const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Load the actual TypeScript functions with HTTP boundaries replaced by an in-memory server.
// This does not start the frontend or send requests to patient records.
function loadSource(file, mocks = {}) {
  const filename = path.join(__dirname, '..', 'src', file);
  const source = fs.readFileSync(filename, 'utf8').replace('import.meta.env.VITE_API_BASE_URL', '"https://example.test"');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('.')) return { __esModule: true, default: () => null };
    return require(id);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}
const validation = loadSource('components/FormValidation.tsx');
const pricing = loadSource('components/Invoice/invoicePricing.ts');
const prices = loadSource('components/EditVisitPage/Prices.tsx', { '../Invoice/invoicePricing': pricing });
const apiModule = loadSource('api.ts');
const copy = value => structuredClone(value);
const labTest = id => ({ lab_test_id: id, name: id, price: 20, nssf_id: 1, unit: 'unit', lab_test_category_id: 'category', normal_value_list: [] });
const result = (id, value = '') => ({ lab_test_type_id: id, lab_test_result_id: `result-${id}`, lab_test_type: labTest(id), result: value });
function fixture() {
  return {
    results: { visit_date: '2026-10-26T00:00:00', report_date: '2026-10-26T00:00:00', list_of_standalone_test_results: [result('test-a')], list_of_panel_results: [] },
    invoice: { currency: 'USD', invoice_data: { list_of_tests: [labTest('test-a')], list_of_lab_panels: [], list_of_lab_tests_ids_changed: [], list_of_lab_panels_ids_changed: [], patient_insurance_company_rate: 0.2, adjustment_minor: 0, total_paid: 0 } },
  };
}
function editValues(source) {
  return { tests: copy(source.results.list_of_standalone_test_results), panels: copy(source.results.list_of_panel_results), visitDate: source.results.visit_date.slice(0, 10), reportDate: source.results.report_date.slice(0, 10), adjustment: String(source.invoice.invoice_data.adjustment_minor), paid: String(source.invoice.invoice_data.total_paid), prices: Object.fromEntries(source.invoice.invoice_data.list_of_lab_tests_ids_changed.map(x => [x.lab_test_id, String(x.new_price)])) };
}
function server(initial = fixture()) {
  const state = copy(initial);
  const writes = [];
  let failResults = false;
  const api = {
    async delete(url) {
      writes.push(['delete', url]);
      if (url.includes('/delete_panels/')) state.results.list_of_panel_results = state.results.list_of_panel_results.filter(p => p.lab_panel_id !== url.split('/').at(-1));
      else state.results.list_of_standalone_test_results = state.results.list_of_standalone_test_results.filter(r => r.lab_test_result_id !== url.split('/').at(-1));
    },
    async post(url, body) {
      writes.push(['post', url]);
      if (body) state.results.list_of_standalone_test_results.push(result(body.lab_test_type_id, body.result));
      else state.results.list_of_panel_results.push({ lab_panel_id: 'panel-a', lab_panel_name: 'Panel A', lab_panel_price: 30, lab_panel_category_id: 'category', list_of_test_results: [result('test-p')] });
    },
    async put(url, body, config) {
      writes.push(['put', url, copy(body)]);
      if (url.startsWith('/lab_tests_results/')) {
        if (failResults) { failResults = false; throw new Error('Connection interrupted'); }
        const rows = [...state.results.list_of_standalone_test_results, ...state.results.list_of_panel_results.flatMap(p => p.list_of_test_results)];
        rows.find(r => r.lab_test_result_id === url.split('/').at(-1)).result = config.params.result;
      } else if (url.startsWith('/visits/')) Object.assign(state.results, body);
      else Object.assign(state.invoice.invoice_data, copy(body));
    },
  };
  const utils = {
    async fetchResultList(id, includeIncomplete) { assert.equal(includeIncomplete, true, 'Editing must include blank results'); return copy(state.results); },
    async fetchInvoice() { return copy(state.invoice); },
  };
  const edits = loadSource('components/EditVisitPage/EditVisitPage.tsx', {
    '../../api': { __esModule: true, default: api }, '../utils': utils,
    './Prices': prices, '../FormValidation': validation,
  });
  return { state, writes, edits, failNextResult() { failResults = true; } };
}

test('blank results remain on the invoice when only billing/dates change', async () => {
  const baseline = fixture(), s = server(baseline), edited = editValues(baseline);
  edited.paid = '2'; edited.visitDate = '2026-10-27';
  const confirmed = await s.edits.saveVisitEdits('visit', baseline, edited);
  assert.equal(confirmed.invoice.invoice_data.list_of_tests.length, 1);
  assert.equal(confirmed.results.list_of_standalone_test_results[0].result, '');
  assert.equal(confirmed.invoice.invoice_data.total_paid, 2);
  assert.ok(s.writes.every(([, , body]) => !body || !('posted' in body)));
});

test('adding standalone and panel results saves values against server-assigned IDs', async () => {
  const baseline = fixture(), s = server(baseline), edited = editValues(baseline);
  edited.tests.push({ ...result('test-b', '17'), lab_test_result_id: 'pending-test-b' });
  edited.panels.push({ lab_panel_id: 'panel-a', lab_panel_name: 'Panel A', lab_panel_price: 30, lab_panel_category_id: 'category', list_of_test_results: [{ ...result('test-p', '95'), lab_test_result_id: 'pending-test-p' }] });
  await s.edits.saveVisitEdits('visit', baseline, edited);
  assert.equal(s.state.results.list_of_panel_results[0].list_of_test_results[0].result, '95');
  assert.equal(s.state.invoice.invoice_data.list_of_tests.length, 2);
  assert.equal(s.state.invoice.invoice_data.list_of_lab_panels.length, 1);
  assert.ok(s.writes.every(([, url]) => !url.includes('pending-')));
});

test('removing tests updates the invoice and drops their price overrides', async () => {
  const baseline = fixture();
  baseline.invoice.invoice_data.list_of_lab_tests_ids_changed = [{ lab_test_id: 'test-a', new_price: 3 }];
  const s = server(baseline), edited = editValues(baseline);
  edited.tests = []; edited.prices = {};
  await s.edits.saveVisitEdits('visit', baseline, edited);
  assert.equal(s.state.results.list_of_standalone_test_results.length, 0);
  assert.deepEqual(s.state.invoice.invoice_data.list_of_lab_tests_ids_changed, []);
});

test('a concurrent edit rejects saving before any writes', async () => {
  const baseline = fixture(), s = server(baseline), edited = editValues(baseline);
  s.state.results.list_of_standalone_test_results[0].result = 'changed by someone else';
  edited.paid = '1';
  await assert.rejects(s.edits.saveVisitEdits('visit', baseline, edited), /changed since you opened/);
  assert.deepEqual(s.writes, []);
});

test('interrupted result save stops before billing and retries the remaining edits', async () => {
  const baseline = fixture(), s = server(baseline), edited = editValues(baseline);
  edited.tests.push({ ...result('test-b'), lab_test_result_id: 'pending-test-b' });
  edited.tests[0].result = '12'; edited.paid = '2';
  s.failNextResult();
  await assert.rejects(s.edits.saveVisitEdits('visit', baseline, edited), /Connection interrupted/);
  assert.equal(s.state.invoice.invoice_data.total_paid, 0);
  await s.edits.saveVisitEdits('visit', copy(s.state), edited);
  assert.equal(s.state.results.list_of_standalone_test_results.length, 2);
  assert.equal(s.state.invoice.invoice_data.total_paid, 2);
});

test('invalid dates, payments and negative totals are rejected before writes', async () => {
  for (const patch of [{ visitDate: '2026-02-30' }, { paid: '-1' }, { paid: '' }, { adjustment: '-5' }, { prices: { 'test-a': '1.2345' } }]) {
    const baseline = fixture(), s = server(baseline);
    await assert.rejects(s.edits.saveVisitEdits('visit', baseline, { ...editValues(baseline), ...patch }));
    assert.deepEqual(s.writes, []);
  }
});

test('overridden prices are final amounts and are not multiplied by insurance rate again', () => {
  const invoice = fixture().invoice.invoice_data;
  invoice.list_of_lab_tests_ids_changed = [{ lab_test_id: 'test-a', new_price: 3 }];
  assert.equal(prices.invoiceGross(invoice), 3);
});

test('invoice PDF uses the same test, panel, zero overrides and adjustment totals as the editor', () => {
  const React = require('react');
  const invoice = fixture().invoice.invoice_data;
  invoice.list_of_lab_panels = [{ id: 'panel-a', panel_name: 'Panel A', nssf_id: 2, lab_panel_price: 50, lab_tests: [] }];
  invoice.list_of_lab_tests_ids_changed = [{ lab_test_id: 'test-a', new_price: 0 }];
  invoice.list_of_lab_panels_ids_changed = [{ panel_id: 'panel-a', new_price: 3.5 }];
  invoice.adjustment_minor = -1.25;
  assert.equal(pricing.invoiceGross(invoice), 3.5);
  assert.equal(prices.invoiceGross(invoice), 3.5);
  assert.equal(pricing.invoiceNet(invoice), 2.25);
  const Table = loadSource('components/Invoice/TestsTableInvoice.tsx', {
    '@react-pdf/renderer': { Text: 'pdf-text', View: 'pdf-view' },
    './InvoiceStyle': { styles: {} },
    './invoicePricing': pricing,
    './amountToWords': { __esModule: true, default: amount => `Words: ${amount}` },
  }).default;
  const tree = Table({ invoiceData: invoice, list_of_tests: invoice.list_of_tests,
    list_of_lab_panels: invoice.list_of_lab_panels, total_price: pricing.invoiceGross(invoice),
    currency: 'USD', patient_insurance_company_rate: 0.2 });
  const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node)
    ? node.map(text).join(' ') : React.isValidElement(node) ? text(node.props.children) : String(node);
  const rendered = text(tree);
  for (const expected of ['test-a', 'Panel A', '0.000 $', '3.500 $', 'Adjustment', '-1.250 $', 'Net Total', '2.250 $', 'Words: 2.25']) {
    assert.ok(rendered.includes(expected), `PDF must include ${expected}`);
  }
});

test('invoice pricing applies insurance rates once to tests and panels in either currency', () => {
  const invoice = fixture().invoice.invoice_data;
  invoice.list_of_lab_panels = [{ id: 'panel-a', lab_panel_price: 50 }];
  for (const rate of [0.07, 8500, 0]) {
    invoice.patient_insurance_company_rate = rate;
    assert.equal(pricing.invoiceGross(invoice), 70 * rate);
  }
});

test('field validation accepts zero where permitted and rejects blanks and impossible dates', () => {
  assert.equal(validation.numberError(0, 'L'), null);
  assert.ok(validation.numberError('', 'L'));
  assert.ok(validation.required('   ', 'Name'));
  assert.ok(validation.dateError('2026-02-29', 'Date'));
  assert.equal(validation.dateError('2024-02-29', 'Date'), null);
});

test('API errors describe connection, permission, validation and server failures', () => {
  const error = (status, detail) => ({ isAxiosError: true, response: status ? { status, data: { detail } } : undefined, config: { url: '/visits' } });
  assert.match(apiModule.getApiErrorMessage(error(), 'Could not load visits'), /could not reach the server/);
  assert.match(apiModule.getApiErrorMessage(error(403), 'Failed'), /permission/);
  assert.match(apiModule.getApiErrorMessage(error(422, [{ loc: ['body', 'panel_name'], msg: 'Field required' }]), 'Failed'), /panel name: Field required/);
  assert.doesNotMatch(apiModule.getApiErrorMessage(error(500, 'private stack trace'), 'Failed'), /private stack trace/);
});

function panelFixture() {
  const baseline = fixture();
  baseline.results.list_of_standalone_test_results.push(result('test-b'));
  baseline.invoice.invoice_data.list_of_tests.push(labTest('test-b'));
  baseline.results.list_of_panel_results = ['panel-a', 'panel-b'].map((id, i) => ({
    lab_panel_id: id, lab_panel_name: id, lab_panel_price: 30, lab_panel_category_id: 'category',
    list_of_test_results: [result(`panel-${i}-test-1`), result(`panel-${i}-test-2`)],
  }));
  return baseline;
}

test('Urine Analysis and Sensitivity can be added together with independent results', () => {
  const s = server(), initial = editValues(fixture());
  const panel = (id, name, count) => ({ id, panel_name: name, nssf_id: 1, lab_panel_price: 20,
    lab_panel_category_id: 'category', lab_tests: Array.from({ length: count }, (_, i) => labTest(`${id}-test-${i}`)) });
  const urine = panel('urine', 'Urine Analysis', 12);
  const sensitivity = panel('sensitivity', 'Antibiotic Sensitivity', 21);
  let edits = s.edits.addVisitPanel(initial, urine);
  edits = s.edits.addVisitPanel(edits, sensitivity);
  assert.equal(edits.panels.length, 2);
  assert.equal(edits.panels[0].list_of_test_results.length, 12);
  assert.equal(edits.panels[1].list_of_test_results.length, 21);
  edits = s.edits.updateVisitResult(edits, { panelId: 'urine', testId: 'urine-test-0' }, 'First result');
  assert.equal(edits.panels[0].list_of_test_results[0].result, 'First result');
  assert.ok(edits.panels[1].list_of_test_results.every(test => test.result === ''));
  assert.throws(() => s.edits.addVisitPanel(edits, urine), /already included/);
  const invalid = panel('invalid', 'Invalid', 2);
  invalid.lab_tests.forEach(test => test.lab_test_id = null);
  assert.throws(() => s.edits.addVisitPanel(initial, invalid), /missing or repeated test identifiers/);
  const overlapping = panel('overlap', 'Overlapping', 1);
  overlapping.lab_tests[0] = urine.lab_tests[0];
  assert.throws(() => s.edits.addVisitPanel(edits, overlapping), /urine-test-0/);
});

test('typing in a panel updates only the selected test even when result IDs collide', () => {
  const baseline = panelFixture(), s = server(baseline);
  let edited = editValues(baseline);
  for (const row of [...edited.tests, ...edited.panels.flatMap(panel => panel.list_of_test_results)]) row.lab_test_result_id = 'shared-id';
  const original = copy(edited);
  edited = s.edits.updateVisitResult(edited, { panelId: 'panel-a', testId: 'panel-0-test-2' }, '12.5');
  assert.deepEqual(edited.tests, original.tests);
  assert.equal(edited.panels[0].list_of_test_results[0].result, '');
  assert.equal(edited.panels[0].list_of_test_results[1].result, '12.5');
  assert.deepEqual(edited.panels[1], original.panels[1]);
  edited = s.edits.updateVisitResult(edited, { panelId: 'panel-b', testId: 'panel-1-test-1' }, '98');
  assert.equal(edited.panels[0].list_of_test_results[1].result, '12.5');
  assert.equal(edited.panels[1].list_of_test_results[0].result, '98');
  assert.equal(edited.panels[1].list_of_test_results[1].result, '');
  assert.equal(s.edits.updateVisitResult(edited, { panelId: 'panel-a', testId: undefined }, 'wrong'), edited);
});

test('saving a panel result writes only its own server result record', async () => {
  const baseline = panelFixture(), s = server(baseline);
  const edited = s.edits.updateVisitResult(editValues(baseline), { panelId: 'panel-b', testId: 'panel-1-test-2' }, '12.5');
  await s.edits.saveVisitEdits('visit', baseline, edited);
  const resultWrites = s.writes.filter(([method, url]) => method === 'put' && url.startsWith('/lab_tests_results/'));
  assert.equal(resultWrites.length, 1);
  assert.equal(resultWrites[0][1], '/lab_tests_results/result-panel-1-test-2');
  assert.equal(s.state.results.list_of_panel_results[0].list_of_test_results[0].result, '');
  assert.equal(s.state.results.list_of_panel_results[1].list_of_test_results[1].result, '12.5');
});

test('ambiguous server result identifiers prevent saving before any records are changed', async () => {
  for (const invalidId of ['', 'result-test-a']) {
    const baseline = panelFixture();
    baseline.results.list_of_panel_results[0].list_of_test_results[0].lab_test_result_id = invalidId;
    const s = server(baseline);
    const edited = editValues(baseline);
    edited.panels[0].list_of_test_results[0].result = '12';
    await assert.rejects(s.edits.saveVisitEdits('visit', baseline, edited), /missing or repeated result identifiers/);
    assert.deepEqual(s.writes, []);
  }
});

test('panel result inputs and autocomplete use the selected row, not a shared result ID', async () => {
  const React = require('react');
  const s = server(panelFixture());
  let edited = editValues(panelFixture());
  for (const row of edited.panels.flatMap(panel => panel.list_of_test_results)) row.lab_test_result_id = 'shared-panel-result';
  const originalWindow = global.window;
  const timers = new Map(), requests = [], slots = [];
  let cursor = 0, timerId = 0;
  global.window = {
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  };
  const visitInputs = element => {
    if (!React.isValidElement(element)) return [];
    return [element, ...React.Children.toArray(element.props.children).flatMap(visitInputs)];
  };
  try {
    const Results = loadSource('components/EditVisitPage/TestResultsList.tsx', {
      react: { ...React,
        useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }]; },
        useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
        useEffect() {},
      },
      '../utils.js': { fetchResultSuggestions: testId => new Promise(resolve => requests.push({ testId, resolve })) },
    }).default;
    const render = () => {
      cursor = 0;
      return visitInputs(Results({ validation: { field: () => ({}) }, panelResults: edited.panels, standAloneTestResults: edited.tests,
        updatedInvoiceData: fixture().invoice.invoice_data, priceDrafts: {}, onPriceChange() {}, onRemoveTest() {}, onRemovePanel() {},
        onResultChange(target, value) { edited = s.edits.updateVisitResult(edited, target, value); },
        // Legacy callbacks reproduce the previous identifier-based parent updates.
        setStandAloneTestResults(update) { edited = { ...edited, tests: update(edited.tests) }; },
        setPanelResults(update) { edited = { ...edited, panels: update(edited.panels) }; }, setPendingResults() {},
      }));
    };
    let nodes = render();
    let inputs = nodes.filter(x => x.type === 'input' && x.props.placeholder === 'Enter result');
    inputs[2].props.onChange({ target: { value: '12' } });
    assert.deepEqual(edited.panels.map(panel => panel.list_of_test_results.map(test => test.result)), [['12', ''], ['', '']]);
    [...timers.values()][0](); timers.clear();
    nodes = render(); inputs = nodes.filter(x => x.type === 'input' && x.props.placeholder === 'Enter result');
    inputs[4].props.onChange({ target: { value: '9' } });
    [...timers.values()][0](); timers.clear();
    assert.equal(requests.length, 2);
    requests[0].resolve([{ value: 'Wrong test suggestion' }]);
    await Promise.resolve();
    nodes = render();
    assert.ok(!nodes.some(x => x.type === 'button' && x.props.children === 'Wrong test suggestion'));
    requests[1].resolve([{ value: 'Correct test suggestion' }]);
    await Promise.resolve();
    nodes = render();
    const suggestion = nodes.find(x => x.type === 'button' && x.props.children === 'Correct test suggestion');
    assert.ok(suggestion);
    suggestion.props.onClick();
    assert.deepEqual(edited.panels.map(panel => panel.list_of_test_results.map(test => test.result)), [['12', ''], ['Correct Test Suggestion', '']]);
    assert.deepEqual(edited.tests.map(test => test.result), ['', '']);
  } finally {
    if (originalWindow === undefined) delete global.window;
    else global.window = originalWindow;
  }
});

for (const role of ['admin', 'patient']) {
  test(`${role} navigation renders desktop links and a collapsed accessible mobile menu`, () => {
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const { MemoryRouter } = require('react-router-dom');
    const previousStorage = global.localStorage;
    global.localStorage = { getItem: () => JSON.stringify({ user_id: 'sample', username: 'sample', role }) };
    try {
      const maintenance = loadSource('components/MaintenanceMenu.tsx');
      const App = loadSource('App.tsx', {
        './api': { baseURLL: 'https://example.test' },
        './components/MaintenanceMenu': maintenance,
      }).default;
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [role === 'admin' ? '/visits' : '/my-visits'] }, React.createElement(App)));
      assert.match(html, /aria-label="Open navigation menu"/);
      assert.match(html, /aria-expanded="false"/);
      assert.match(html, /id="mobile-navigation" hidden=""/);
      assert.match(html, /Al Saha Lab home/);
      assert.match(html, /Logout/);
      if (role === 'admin') {
        assert.match(html, /xl:flex/);
        assert.match(html, /Insurance Companies/);
        assert.match(html, /Financial Transactions/);
      } else {
        assert.match(html, /md:flex/);
        assert.match(html, /My Visits/);
        assert.doesNotMatch(html, /Insurance Companies/);
      }
    } finally {
      if (previousStorage === undefined) delete global.localStorage;
      else global.localStorage = previousStorage;
    }
  });
}

test('Add Test Result keeps one dialog and its close button visible while loading', async () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const state = [], effects = [];
  let cursor = 0, resolvePage;
  const pageRequest = new Promise(resolve => { resolvePage = resolve; });
  const picker = loadSource('components/EditVisitPage/AddTestResultTable.tsx', {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
      },
      useEffect(effect) { effects.push(effect); },
    },
    'react-router-dom': { useNavigate: () => () => {} },
    '@tanstack/react-table': { useReactTable: options => options, getCoreRowModel() {}, getPaginationRowModel() {}, getSortedRowModel() {} },
    '../utils': { fetchLabTestTypePaginated: () => pageRequest },
    '../tableData': { getLabTestColumns: () => [] },
    '../CloseButton': loadSource('components/CloseButton.tsx'),
    '../../hooks/useLabTestCategoryOptions': { useLabTestCategoryOptions: () => [], buildLabTestFilters: () => ({}) },
    '../react-table/GeneralTable': { __esModule: true, default: ({ table }) => React.createElement('table', null, React.createElement('tbody', null, table.data.map(row => React.createElement('tr', { key: row.lab_test_id }, React.createElement('td', null, row.name))))) },
  }).default;
  const props = { showTestsTable: true, error: '', addError: '', setError() {}, existingLabTestTypeIds: new Set() };
  const render = () => { cursor = 0; return renderToStaticMarkup(picker(props)); };
  const initial = render();
  assert.equal((initial.match(/role="dialog"/g) ?? []).length, 1);
  assert.match(initial, /role="status"/);
  assert.match(initial, /aria-label="Close add test result dialog"/);
  assert.doesNotMatch(initial, /<table/);

  // Starting the request must keep the same dialog shell, rather than render a page loader.
  const cleanup = effects[0]();
  const pending = render();
  assert.match(pending, /role="dialog"/);
  assert.match(pending, /aria-label="Close add test result dialog"/);
  resolvePage({ lab_tests: [labTest('Available test')], total_pages: 1, TotalNumberOfTests: 1 });
  await pageRequest;
  await Promise.resolve();
  const loaded = render();
  assert.match(loaded, /role="dialog"/);
  assert.match(loaded, /<table/);
  assert.match(loaded, /Available test/);
  assert.doesNotMatch(loaded, /role="status"/);
  cleanup();
});
