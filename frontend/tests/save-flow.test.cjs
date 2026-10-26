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
const prices = loadSource('components/EditVisitPage/Prices.tsx');
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
