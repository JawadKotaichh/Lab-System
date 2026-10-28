const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadSource(file, mocks) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(id => id in mocks ? mocks[id] : id.startsWith('.')
    ? { __esModule: true, default: () => null } : require(id), module, module.exports);
  return module.exports;
}

// Execute the real hooks with deterministic React state/effect scheduling. No browser,
// application server, production data or wall-clock debounce timers are involved.
function hookHost() {
  const slots = [];
  let cursor, dirty = true, renderFunction, output, effects;
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) {
        const slot = { value: typeof initial === 'function' ? initial() : initial };
        slot.set = update => {
          const next = typeof update === 'function' ? update(slot.value) : update;
          if (!Object.is(next, slot.value)) { slot.value = next; dirty = true; }
        };
        slots[index] = slot;
      }
      return [slots[index].value, slots[index].set];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo(calculate, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) slots[index] = { value: calculate(), deps };
      return slots[index].value;
    },
    useCallback(callback, deps) { return hooks.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
        const previousCleanup = slots[index]?.cleanup;
        slots[index] = { deps };
        effects.push(() => { previousCleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  return {
    hooks,
    render(callback) { renderFunction = callback; dirty = true; return this.flush(); },
    invalidate() { dirty = true; },
    unmount() {
      for (const slot of slots) slot?.cleanup?.();
      slots.length = 0;
      dirty = true;
    },
    flush() {
      for (let renderCount = 0; dirty; renderCount++) {
        assert.ok(renderCount < 30, 'State/URL synchronization must settle instead of reloading indefinitely');
        dirty = false; cursor = 0; effects = [];
        output = renderFunction();
        for (const effect of effects) effect();
      }
      return output;
    },
  };
}
function router(host, search = '') {
  let params = new URLSearchParams(search), setParams;
  const writes = [];
  const refreshSetter = () => { setParams = next => {
    writes.push(next.toString());
    assert.ok(writes.length < 30, 'URL updates must not form a navigation loop');
    params = new URLSearchParams(next); refreshSetter(); host.invalidate();
  }; };
  refreshSetter();
  const navigate = () => {};
  return {
    writes,
    hooks: { useNavigate: () => navigate, useLocation: () => ({ pathname: '/patients' }), useSearchParams: () => [params, setParams] },
    navigate(search) { params = new URLSearchParams(search); refreshSetter(); host.invalidate(); },
    search: () => params.toString(),
  };
}
function findElement(element, predicate) {
  if (!React.isValidElement(element)) return undefined;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props.children)) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
}

for (const status of [401, 503, 'network']) {
  test(`startup session check ${status === 401 ? 'signs out a truly invalid session' : `keeps the login after ${status}`}`, async () => {
    const host = hookHost(), removed = [];
    const previousWindow = global.window, previousStorage = global.localStorage;
    global.window = { matchMedia: () => ({ addEventListener() {}, removeEventListener() {} }) };
    global.localStorage = {
      getItem: () => JSON.stringify({ user_id: 'sample', username: 'sample', role: 'admin' }),
      removeItem: key => removed.push(key),
    };
    try {
      const App = loadSource('App.tsx', {
        react: host.hooks,
        'react-router-dom': { useLocation: () => ({ key: 'sample' }), useMatch: () => null, useNavigate: () => () => {} },
        './api': { baseURLL: 'https://example.test', isSessionExpired: error => error.status === 401 },
        './components/MaintenanceMenu': { __esModule: true, default: () => null, maintenanceNavItems: [] },
        './components/utils': { refreshSession: async () => { throw { status }; } },
      }).default;
      host.render(App);
      for (let i = 0; i < 8; i++) await Promise.resolve();
      host.flush();
      assert.deepEqual(removed, status === 401 ? ['auth_user'] : []);
      host.unmount();
    } finally {
      global.window = previousWindow;
      global.localStorage = previousStorage;
    }
  });
}

test('panel picker recovers missing list identifiers from the detail endpoint without saving', async () => {
  const host = hookHost(), selected = [], detailCalls = [];
  const panel = { id: 'urine', panel_name: 'Urine Analysis', lab_tests: [{ lab_test_id: null, name: 'Urine test', normal_value_list: [] }] };
  const complete = { ...panel, lab_tests: [{ ...panel.lab_tests[0], lab_test_id: 'urine-test' }] };
  const Picker = loadSource('components/EditVisitPage/LabPanelsTable.tsx', {
    react: host.hooks,
    '../utils': {
      fetchLabPanelsPaginated: async () => ({ lab_panels: [panel], total_pages: 1, TotalNumberOfLabPanels: 1 }),
      fetchLabPanelWithTests: async id => { detailCalls.push(id); return { lab_panel: complete }; },
    },
    '../../api': { __esModule: true, default: { post() { assert.fail('Choosing a panel must not save live records'); } }, getApiErrorMessage: error => error.message },
    '../../style': {},
  }).default;
  host.render(() => Picker({ showPanelsTable: true, visit_id: 'visit', panelResults: [], onSelectPanel: panel => selected.push(panel) }));
  for (let i = 0; i < 5; i++) await Promise.resolve();
  const tree = host.flush();
  const add = findElement(tree, node => node.props.children?.trim?.() === 'Add' && typeof node.props.onClick === 'function');
  await add.props.onClick();
  assert.deepEqual(detailCalls, ['urine']);
  assert.equal(selected[0].lab_tests[0].lab_test_id, 'urine-test');
  host.unmount();
});

test('Edit Visit offers Save or Keep editing without discard controls or idle warning text', async () => {
  const host = hookHost();
  const previousWindow = global.window;
  global.window = { addEventListener() {}, removeEventListener() {} };
  const SaveButton = () => null;
  let resets = 0;
  const blocker = { state: 'blocked', reset() { resets++; }, proceed() {} };
  const pricing = loadSource('components/Invoice/invoicePricing.ts', {});
  try {
    const Page = loadSource('components/EditVisitPage/EditVisitPage.tsx', {
      react: host.hooks,
      'react-router-dom': { useParams: () => ({ visit_id: 'visit' }), useBlocker: () => blocker },
      '../SaveButton': { __esModule: true, default: SaveButton },
      './Prices': pricing,
      '../FormValidation': { useFormValidation: () => ({ validate: () => true }), dateError: () => null, moneyError: () => null },
      '../utils': {
        fetchVisitEditor: async () => ({
          results: { patient: {}, visit_date: '2026-10-28', report_date: '2026-10-28', list_of_standalone_test_results: [], list_of_panel_results: [] },
          invoice: { currency: 'USD', invoice_data: { list_of_tests: [], list_of_lab_panels: [], list_of_lab_tests_ids_changed: [], list_of_lab_panels_ids_changed: [], adjustment_minor: 0, total_paid: 0 } },
        }),
      },
    }).default;
    host.render(Page);
    for (let i = 0; i < 8; i++) await Promise.resolve();
    const tree = host.flush();
    const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node)
      ? node.map(text).join(' ') : React.isValidElement(node) ? text(node.props.children) : String(node);
    const content = text(tree);
    assert.match(content, /Keep editing/);
    assert.ok(findElement(tree, node => node.type === SaveButton && node.props.children === 'Save'));
    for (const removed of ['Discard and leave', 'Discard changes', 'Save and leave', 'You have unsaved changes', 'Changes stay on this page until you save.']) {
      assert.ok(!content.includes(removed), `Edit Visit must not show ${removed}`);
    }
    findElement(tree, node => node.type === 'button' && node.props.children === 'Keep editing').props.onClick();
    assert.equal(resets, 1);
    host.unmount();
  } finally { global.window = previousWindow; }
});

test('invoice loading is atomic, fetches once with an adjustment, and ignores old visit responses', async () => {
  const host = hookHost(), requests = [];
  let visitId = 'first';
  const storage = global.localStorage;
  global.localStorage = { getItem: () => JSON.stringify({ role: 'patient' }) };
  const Invoice = () => null;
  const pricing = loadSource('components/Invoice/invoicePricing.ts', {});
  try {
    const Container = loadSource('components/Invoice/InvoiceContainer.tsx', {
      react: host.hooks, 'react-router-dom': { useParams: () => ({ visit_id: visitId }) },
      '../../api': { getApiErrorMessage: () => 'Could not load invoice' },
      '../utils': { fetchInvoice: id => new Promise((resolve, reject) => requests.push({ id, resolve, reject })) },
      './invoicePricing': pricing, './Invoice': { __esModule: true, default: Invoice },
    }).default;
    const response = id => ({ patient: { patient_id: id }, currency: 'USD', invoice_data: {
      invoice_number: 864, adjustment_minor: -1, visit_date: '2026-10-27',
      list_of_tests: [{ lab_test_id: id, price: 20 }], list_of_lab_panels: [],
      patient_insurance_company_rate: 0.1, list_of_lab_tests_ids_changed: [], list_of_lab_panels_ids_changed: [],
    } });
    host.render(Container);
    visitId = 'second'; host.invalidate(); host.flush();
    requests[1].resolve(response('second'));
    for (let i = 0; i < 5; i++) await Promise.resolve();
    let props = findElement(host.flush(), node => node.type === Invoice).props;
    assert.equal(props.list_of_tests[0].lab_test_id, 'second');
    assert.equal(props.total_price, 2);
    assert.equal(props.adjustment_minor, -1);
    requests[0].resolve(response('first'));
    for (let i = 0; i < 5; i++) await Promise.resolve();
    props = findElement(host.flush(), node => node.type === Invoice).props;
    assert.equal(props.patient.patient_id, 'second');
    assert.equal(requests.length, 2, 'Loading an adjustment must not trigger another invoice fetch');
    host.unmount();
  } finally { global.localStorage = storage; }
});

test('URL navigation restores patient filters once without rewriting old state', () => {
  const host = hookHost(), route = router(host, 'page=2&pageSize=50&f.gender=Female');
  const { usePersistedTableState } = loadSource('hooks/usePersistedTableState.ts', { react: host.hooks, 'react-router-dom': route.hooks });
  host.render(() => usePersistedTableState());
  route.navigate('page=1&pageSize=50&f.gender=Male&open=gender');
  const restored = host.flush();
  assert.equal(restored.columnFilters[0].value, 'Male');
  assert.equal(restored.pagination.pageIndex, 0);
  assert.equal(route.writes.length, 0);
  assert.match(route.search(), /f.gender=Male/);
});

test('opening a filter and repeated no-op updates do not refetch or reset pagination', () => {
  const host = hookHost(), route = router(host, 'page=3&pageSize=50&f.gender=Male');
  const { usePersistedTableState } = loadSource('hooks/usePersistedTableState.ts', { react: host.hooks, 'react-router-dom': route.hooks });
  let state = host.render(() => usePersistedTableState());
  const filters = state.columnFilters;
  state.setShowFilters({ gender: true }); state = host.flush();
  assert.equal(state.columnFilters, filters);
  state.setColumnFilters([{ id: 'gender', value: 'Male' }]); state = host.flush();
  assert.equal(state.pagination.pageIndex, 2);
  assert.equal(state.columnFilters, filters);
  assert.equal(route.writes.length, 1);
  state.setColumnFilters([{ id: 'gender', value: 'Female' }]); state = host.flush();
  assert.equal(state.pagination.pageIndex, 0);
  assert.equal(route.writes.length, 2);
  assert.equal(state.columnFilters[0].value, 'Female');
});

test('persisted page sizes cannot exceed the backend limit', () => {
  const host = hookHost(), route = router(host, 'page=1&pageSize=1000');
  const { usePersistedTableState } = loadSource('hooks/usePersistedTableState.ts', { react: host.hooks, 'react-router-dom': route.hooks });
  let state = host.render(() => usePersistedTableState());
  assert.equal(state.pagination.pageSize, 100);
  state.setPagination({ pageIndex: 0, pageSize: 200 }); state = host.flush();
  assert.equal(state.pagination.pageSize, 100);
});

test('leaving and returning restores cached filters without starting a URL loop', () => {
  const host = hookHost(), route = router(host, 'page=2&pageSize=50&f.gender=Male');
  const { usePersistedTableState } = loadSource('hooks/usePersistedTableState.ts', { react: host.hooks, 'react-router-dom': route.hooks });
  host.render(() => usePersistedTableState());
  host.unmount();
  route.navigate('');
  const restored = host.render(() => usePersistedTableState());
  assert.equal(restored.pagination.pageIndex, 1);
  assert.equal(restored.columnFilters[0].value, 'Male');
  assert.equal(route.writes.length, 0);
});

test('pagination prevents invalid page sizes and Next on an empty result set', () => {
  const sizes = [];
  const Pagination = loadSource('components/Pagination.tsx', {}).default;
  const tree = Pagination({ currentPage: 1, totalPages: 0, pageSize: 50, setCurrentPage() {}, setPageSize: value => sizes.push(value) });
  assert.equal(findElement(tree, x => x.type === 'button' && x.props.children === 'Next').props.disabled, true);
  const input = findElement(tree, x => x.type === 'input');
  for (const value of ['1000', '0', '1.5']) input.props.onChange({ target: { value } });
  assert.deepEqual(sizes, [100]);
});

test('selecting or clearing a filter never reapplies an old debounced value', () => {
  const host = hookHost();
  let value = '', debounced = '';
  const writes = [];
  const { ColumnFilter } = loadSource('components/react-table/ColumnFilter.tsx', {
    react: host.hooks, './Debounce': { useDebounce: () => debounced },
  });
  const render = () => ColumnFilter({ column: { getFilterValue: () => value, setFilterValue: next => { value = next ?? ''; writes.push(value); host.invalidate(); }, getCanSort: () => false, getIsSorted: () => false }, showFilter: true, withFilter: true, options: [{ value: 'Male', label: 'Male' }], label: 'Gender' });
  let tree = host.render(render);
  findElement(tree, x => x.type === 'select').props.onChange({ target: { value: 'Male' } });
  tree = host.flush();
  assert.equal(value, 'Male');
  assert.deepEqual(writes, ['Male']);
  debounced = 'Male'; host.invalidate(); tree = host.flush();
  findElement(tree, x => x.props['aria-label'] === 'Reset filter').props.onClick();
  host.flush();
  assert.equal(value, '');
  assert.deepEqual(writes, ['Male', '']);
});

test('restoring a date range does not overwrite it with a stale debounce', () => {
  const host = hookHost();
  let value, debounced = { start: '', end: '' };
  const writes = [];
  const { DateRangeFilter } = loadSource('components/react-table/DateRangeFilter.tsx', { react: host.hooks, './Debounce': { useDebounce: () => debounced } });
  host.render(() => DateRangeFilter({ column: { id: 'visit_date', getFilterValue: () => value, setFilterValue: next => { writes.push(next); value = next; host.invalidate(); }, getCanSort: () => false, getIsSorted: () => false }, showFilter: true, withFilter: true, label: 'Date' }));
  value = { start: '2026-10-01', end: '2026-10-28' }; host.invalidate(); host.flush();
  assert.deepEqual(value, { start: '2026-10-01', end: '2026-10-28' });
  assert.deepEqual(writes, []);
});

test('Patients keeps its header mounted and ignores superseded request failures', async () => {
  const host = hookHost(), route = router(host, 'page=1&pageSize=50');
  const { usePersistedTableState } = loadSource('hooks/usePersistedTableState.ts', { react: host.hooks, 'react-router-dom': route.hooks });
  const requests = [];
  const PatientTable = loadSource('components/Patients/PatientTable.tsx', {
    react: host.hooks, 'react-router-dom': route.hooks,
    '../../api': { getApiErrorMessage: () => 'Old request failed' },
    '../../hooks/usePersistedTableState': { usePersistedTableState },
    '../utils': { fetchPatientsPaginated: (page, size, filters, signal) => new Promise((resolve, reject) => requests.push({ resolve, reject, signal, filters })) },
    '../tableData': { getPatientsColumns: () => [] },
    '@tanstack/react-table': { useReactTable: options => options, getCoreRowModel() {}, getSortedRowModel() {}, getPaginationRowModel() {} },
    '../react-table/GeneralTable': { __esModule: true, default: ({ table }) => React.createElement('table', null, React.createElement('tbody', null, table.data.map(row => React.createElement('tr', { key: row.patient_id }, React.createElement('td', null, row.name))))) },
  }).default;
  let tree = host.render(PatientTable);
  assert.match(renderToStaticMarkup(tree), /<h1[^>]*>Patients<\/h1>/);
  assert.equal(requests.length, 1);
  route.navigate('page=1&pageSize=50&f.gender=Male'); tree = host.flush();
  assert.equal(requests.length, 2);
  assert.equal(requests[0].signal.aborted, true);
  requests[1].resolve({ patients: [{ patient_id: 'sample', name: 'Current result' }], total_pages: 1, TotalNumberOfPatients: 1 });
  await Promise.resolve(); tree = host.flush();
  requests[0].reject(new Error('Stale request'));
  await Promise.resolve(); tree = host.flush();
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Current result/);
  assert.doesNotMatch(html, /Old request failed/);
  assert.equal(requests.length, 2);
});


test('Lab Panels uses shared columns with server filters and preserves scoped actions', () => {
  const action = loadSource('components/ActionButton.tsx', {}).default;
  const {getLabPanelColumns, buildLabPanelFilters} = loadSource('components/LabPanel/LabPanelColumns.tsx', {
    '../ActionButton': {__esModule:true, default:action},
  });
  const edits = [], deletes = [];
  const columns = getLabPanelColumns({}, () => {}, [{value:'cat',label:'Chemistry'}], id => edits.push(id), id => deletes.push(id));
  const panel = {id:'panel-a',panel_name:'Panel A',lab_panel_category_id:'cat',lab_tests:[]};
  const tree = columns.find(column => column.id === 'actions').cell({row:{original:panel}});
  const buttons = React.Children.toArray(tree.props.children);
  buttons[0].props.onClick(); buttons[1].props.onClick();
  assert.deepEqual(edits,['panel-a']); assert.deepEqual(deletes,['panel-a']);
  assert.deepEqual(buildLabPanelFilters([{id:'panel_name',value:' Urine '},{id:'nssf_id',value:'12'},
    {id:'lab_panel_category_id',value:'cat'},{id:'lab_panel_price',value:'1.5'},{id:'unknown',value:'ignored'}]),
    {panel_name:'Urine',nssf_id:'12',lab_panel_category_id:'cat',lab_panel_price:'1.5'});
  assert.equal(columns.find(column => column.accessorKey === 'lab_panel_category_id').cell({row:{original:panel}}),'Chemistry');
});

test('expanded panel details show only the selected panel and do not change other tables', () => {
  const tanstack = require('@tanstack/react-table');
  const GenericTable = loadSource('components/react-table/GeneralTable.tsx', {}).default;
  const {getLabPanelColumns, PanelTestDetails} = loadSource('components/LabPanel/LabPanelColumns.tsx', {
    '../ActionButton':{__esModule:true,default:loadSource('components/ActionButton.tsx',{}).default},
    '../react-table/ColumnFilter':{ColumnFilter:({label})=>React.createElement('span',null,label)},
  });
  const panels = ['A','B'].map(name => ({id:name,panel_name:`Panel ${name}`,lab_tests:[{lab_test_id:`test-${name}`,name:`Unique test ${name}`,normal_value_list:[]}]}));
  const table = tanstack.createTable({data:panels, columns:getLabPanelColumns({},()=>{},[],()=>{},()=>{}),
    getCoreRowModel:tanstack.getCoreRowModel(), getRowId:row=>row.id,getRowCanExpand:()=>true,
    state:{}, onStateChange() {},renderFallbackValue:null});
  table.setOptions(previous => ({...previous,state:{...table.initialState,expanded:{}}}));
  const render = details => renderToStaticMarkup(React.createElement(GenericTable,{table,renderExpandedRow:details}));
  const details = row => React.createElement(PanelTestDetails,{panel:row.original});
  assert.doesNotMatch(render(details),/Unique test/);
  table.setOptions(previous=>({...previous,state:{...previous.state,expanded:{A:true}}}));
  const html = render(details);
  assert.match(html,/Unique test A/); assert.doesNotMatch(html,/Unique test B/);
  assert.match(html,/aria-expanded="true"/);
  // Existing callers without an expansion renderer keep their original flat table.
  assert.doesNotMatch(render(undefined),/Unique test/);
  table.setOptions(previous=>({...previous,state:{...previous.state,expanded:{}}}));
  assert.doesNotMatch(render(details),/Unique test/);
});

test('Lab Panels ignores stale searches and refetches a valid page after deletion', async () => {
  const host=hookHost(), route=router(host,'page=2&pageSize=10');
  const {usePersistedTableState}=loadSource('hooks/usePersistedTableState.ts',{react:host.hooks,'react-router-dom':route.hooks});
  const requests=[], deleted=[]; let remove;
  const Page=loadSource('components/LabPanel/LabPanelsList.tsx',{
    react:host.hooks,'react-router-dom':route.hooks,
    '../../api':{__esModule:true,default:{delete:async url=>{deleted.push(url);}},getApiErrorMessage:()=> 'Request failed'},
    '../../hooks/usePersistedTableState':{usePersistedTableState},
    '../../hooks/useLabTestCategoryOptions':{useLabTestCategoryOptions:()=>[]},
    '../data':{labPanelApiURL:'/lab_panel'},
    '../utils':{fetchLabPanelsPaginated:(page,size,filters,signal)=>new Promise((resolve,reject)=>requests.push({page,size,filters,signal,resolve,reject}))},
    './LabPanelColumns':{getLabPanelColumns:(shown,toggle,categories,edit,handler)=>{remove=handler;return [];},buildLabPanelFilters:filters=>Object.fromEntries(filters.map(f=>[f.id,f.value]))},
    '@tanstack/react-table':{useReactTable:options=>options,getCoreRowModel:()=>null,getSortedRowModel:()=>null},
    '../react-table/GeneralTable':{__esModule:true,default:({table})=>React.createElement('div',null,table.data.map(row=>row.panel_name).join(','))},
  }).default;
  let tree=host.render(Page);
  assert.equal(requests.length,1);
  route.navigate('page=2&pageSize=10&f.panel_name=Urine');tree=host.flush();
  assert.equal(requests[0].signal.aborted,true);
  requests[1].resolve({lab_panels:[{id:'selected',panel_name:'Current panel'}],total_pages:2,TotalNumberOfLabPanels:11});
  await Promise.resolve();tree=host.flush();
  requests[0].reject(new Error('Old failure'));await Promise.resolve();tree=host.flush();
  assert.doesNotMatch(renderToStaticMarkup(tree),/Request failed/);
  const originalWindow=global.window;global.window={confirm:()=>true};
  try {await remove('selected');} finally {global.window=originalWindow;}
  host.flush();
  assert.deepEqual(deleted,['/lab_panel/selected']);
  requests[2].resolve({lab_panels:[],total_pages:1,TotalNumberOfLabPanels:10});
  await Promise.resolve();host.flush();
  assert.equal(requests[3].page,1);
  requests[3].resolve({lab_panels:[{id:'remaining',panel_name:'Remaining panel'}],total_pages:1,TotalNumberOfLabPanels:10});
  await Promise.resolve();tree=host.flush();
  assert.match(renderToStaticMarkup(tree),/Remaining panel/);
  assert.equal(requests.length,4);
});
