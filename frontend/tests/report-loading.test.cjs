const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');

function loadSource(file, resolve) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(resolve, module, module.exports);
  return module.exports;
}
function harness(user = { user_id: 'sample', role: 'admin', username: 'sample' }) {
  const loaded = [];
  const reportIds = [
    './components/Invoice/InvoiceContainer', './components/ResultPDF/ResultContainer',
    './components/MonthlySummary/InvoiceSummaryContainer',
    './components/AccountingPages/FinancialTransactionsSummaryContainer',
  ];
  const report = loadSource('components/ReportPage.tsx', id => id.startsWith('.')
    ? { __esModule: true, default: () => React.createElement('p', null, 'Loading report…') } : require(id));
  const App = loadSource('App.tsx', id => {
    if (reportIds.includes(id)) {
      loaded.push(id);
      return { __esModule: true, default: () => React.createElement('div', null, 'Report rendered') };
    }
    if (id === './components/ReportPage') return report;
    if (id === './components/MaintenanceMenu') return { __esModule: true, default: () => null, maintenanceNavItems: [] };
    if (id === './api') return { baseURLL: 'https://example.test' };
    if (id.startsWith('.')) return { __esModule: true, default: () => null };
    return require(id);
  }).default;
  return {
    loaded,
    render(route) {
      const storage = global.localStorage;
      global.localStorage = { getItem: () => JSON.stringify(user) };
      try { return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App))); }
      finally { global.localStorage = storage; }
    },
  };
}

test('Visits and Patients do not import any PDF/report module', () => {
  const app = harness();
  app.render('/visits');
  app.render('/patients');
  assert.deepEqual(app.loaded, []);
});

for (const [route, expected] of [
  ['/invoice/visit', 'Invoice/InvoiceContainer'], ['/result/visit', 'ResultPDF/ResultContainer'],
  ['/summary-invoice/company', 'MonthlySummary/InvoiceSummaryContainer'],
  ['/financial-transactions/summary/Income', 'AccountingPages/FinancialTransactionsSummaryContainer'],
]) {
  test(`${route} loads only its report module and shows a loading state first`, async () => {
    const app = harness();
    assert.match(app.render(route), /Loading report/);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    assert.deepEqual(app.loaded, [`./components/${expected}`]);
    assert.match(app.render(route), /Report rendered/);
    assert.equal(app.loaded.length, 1, 'A loaded report module should be reused');
  });
}

test('a signed-out visit to a report route does not download report code', () => {
  const app = harness(null);
  app.render('/invoice/visit');
  assert.deepEqual(app.loaded, []);
});

test('a failed report offers a manual reload without an automatic reload loop', () => {
  const report = loadSource('components/ReportPage.tsx', id => id.startsWith('.') ? {} : require(id));
  const Boundary = report.ReportLoadBoundary;
  const boundary = new Boundary({ children: 'Report' });
  boundary.state = Boundary.getDerivedStateFromError(new Error('Chunk download failed'));
  const tree = boundary.render();
  assert.match(renderToStaticMarkup(tree), /report could not be loaded/);
  let reloads = 0;
  const previousWindow = global.window;
  global.window = { location: { reload() { reloads++; } } };
  try {
    assert.equal(reloads, 0);
    React.Children.toArray(tree.props.children).find(child => child.type === 'button').props.onClick();
    assert.equal(reloads, 1);
  } finally { global.window = previousWindow; }
});
