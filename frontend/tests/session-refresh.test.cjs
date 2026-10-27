const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const axios = require('axios');

function loadSource(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8')
    .replace('import.meta.env.VITE_API_BASE_URL', '"https://example.test"');
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(id => id in mocks ? mocks[id]
    : id.startsWith('.') ? {} : require(id), module, module.exports);
  return module.exports;
}

const tick = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function httpError(config, status) {
  return new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null,
    { config, status, data: { detail: status === 401 ? 'Invalid session' : 'Temporary failure' }, headers: {} });
}

// Simulate the browser cookie jar and rotating refresh endpoint at the Axios
// adapter boundary. No browser, server, real account or network is used.
function sessionServer() {
  let cookieVersion = 0, accessValid = false;
  const refreshes = [], requests = [];
  function connect() {
    const module = loadSource('api.ts'), api = module.default;
    const utils = loadSource('components/utils.tsx', { '../api': module });
    api.defaults.adapter = config => {
      const response = data => ({ status: 200, data, config, headers: {} });
      if (config.url === '/auth/refresh') {
        const pending = deferred(), sentCookie = cookieVersion;
        refreshes.push({
          finish() {
            if (sentCookie !== cookieVersion) pending.reject(httpError(config, 401));
            else { cookieVersion++; accessValid = true; pending.resolve(response({ ok: true })); }
          },
          fail(status) { pending.reject(httpError(config, status)); },
        });
        return pending.promise;
      }
      if (config.url === '/auth/login' || config.url === '/auth/logout') return Promise.reject(httpError(config, 401));
      if (accessValid) return Promise.resolve(response({ ok: true }));
      const pending = deferred();
      requests.push({ expire() { pending.reject(httpError(config, 401)); } });
      return pending.promise;
    };
    return { api, utils, module };
  }
  return { connect, refreshes, requests };
}

test('startup refresh and protected requests share one refresh, including repeated startup checks', async () => {
  const server = sessionServer(), { api, utils } = server.connect();
  const startup = utils.refreshSession(), repeatedStartup = utils.refreshSession();
  const page = api.get('/visits');
  await tick();
  server.requests[0].expire();
  await tick();
  assert.equal(server.refreshes.length, 1);
  server.refreshes[0].finish();
  assert.deepEqual(await Promise.all([startup, repeatedStartup]), [true, true]);
  assert.equal((await page).data.ok, true);
});

test('a burst of 401 responses refreshes once and retries all requests', async () => {
  const server = sessionServer(), { api } = server.connect();
  const pending = ['/patients', '/visits', '/invoices'].map(url => api.get(url));
  await tick();
  server.requests.forEach(request => request.expire());
  await tick();
  assert.equal(server.refreshes.length, 1);
  server.refreshes[0].finish();
  assert.equal((await Promise.all(pending)).length, 3);
});

test('a delayed 401 uses the refreshed cookie without starting another rotation', async () => {
  const server = sessionServer(), { api } = server.connect();
  const first = api.get('/patients'), late = api.get('/visits');
  await tick();
  server.requests[0].expire();
  await tick();
  server.refreshes[0].finish();
  await first;
  server.requests[1].expire();
  await tick();
  assert.equal(server.refreshes.length, 1, 'An old response must not refresh the new session');
  assert.equal((await late).data.ok, true);
});

test('tabs serialize token rotation with the shared browser lock', async () => {
  const previousNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  let tail = Promise.resolve();
  const names = [];
  Object.defineProperty(global, 'navigator', { configurable: true, value: { locks: {
    request(name, action) {
      names.push(name);
      const next = tail.then(action);
      tail = next.catch(() => {});
      return next;
    },
  } } });
  try {
    const server = sessionServer(), firstTab = server.connect(), secondTab = server.connect();
    const first = firstTab.utils.refreshSession(), second = secondTab.utils.refreshSession();
    await tick();
    assert.equal(server.refreshes.length, 1, 'Second tab must wait for the first token rotation');
    server.refreshes[0].finish();
    await first;
    await tick();
    assert.equal(server.refreshes.length, 2);
    server.refreshes[1].finish();
    assert.equal(await second, true);
    assert.equal(names[0], names[1]);
  } finally {
    if (previousNavigator) Object.defineProperty(global, 'navigator', previousNavigator);
    else delete global.navigator;
  }
});

test('a temporary refresh failure can be retried and is not classified as an expired session', async () => {
  const server = sessionServer(), { utils, module } = server.connect();
  const first = utils.refreshSession();
  const rejected = assert.rejects(first, error => {
    assert.equal(module.isSessionExpired(error), false);
    return true;
  });
  await tick();
  server.refreshes[0].fail(503);
  await rejected;
  const retry = utils.refreshSession();
  await tick();
  server.refreshes[1].finish();
  assert.equal(await retry, true);
  assert.equal(module.isSessionExpired({ isAxiosError: true, response: { status: 401 } }), true);
  assert.equal(module.isSessionExpired({ isAxiosError: true, code: 'ERR_NETWORK' }), false);
});

test('an invalid refresh session rejects the original request without a refresh loop', async () => {
  const server = sessionServer(), { api, module } = server.connect();
  const request = api.get('/patients');
  const rejected = assert.rejects(request, error => module.isSessionExpired(error));
  await tick();
  server.requests[0].expire();
  await tick();
  server.refreshes[0].fail(401);
  await rejected;
  assert.equal(server.refreshes.length, 1);
});

test('a login failure never triggers session refresh', async () => {
  const server = sessionServer(), { api } = server.connect();
  await assert.rejects(api.post('/auth/login', {}));
  assert.equal(server.refreshes.length, 0);
});
