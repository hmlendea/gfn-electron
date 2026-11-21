const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createPageCompatibilityScript } = require('../scripts/pageCompat');

function createHarness() {
  let received;
  const window = {
    screen: { width: 1280, height: 720 },
    fetch: async function (input, init) {
      received = { input, init };
      return { ok: true };
    },
  };
  class XMLHttpRequest {
    open() {}
    send() {}
  }
  const context = {
    window,
    navigator: {},
    Request,
    URL,
    XMLHttpRequest,
  };
  vm.runInNewContext(
    createPageCompatibilityScript({
      targetWidth: 1920,
      targetHeight: 1080,
      targetFps: 120,
    }),
    context,
  );
  return {
    fetch: (...args) => window.fetch(...args),
    getReceived: () => received,
  };
}

function sessionBody() {
  return JSON.stringify({
    sessionRequestData: {
      clientRequestMonitorSettings: [
        { widthInPixels: 1280, heightInPixels: 720, framesPerSecond: 60 },
      ],
      metaData: [
        {
          key: 'clientPhysicalResolution',
          value: JSON.stringify({ horizontalPixels: 1280, verticalPixels: 720 }),
        },
      ],
    },
  });
}

test('patches session JSON sent with a URL and preserves init options', async () => {
  const harness = createHarness();
  const headers = { 'content-type': 'application/json', 'x-test': 'kept' };
  await harness.fetch('https://play.geforcenow.com/v2/session', {
    method: 'POST',
    headers,
    credentials: 'include',
    redirect: 'follow',
    body: sessionBody(),
  });

  const { input, init } = harness.getReceived();
  assert.equal(input, 'https://play.geforcenow.com/v2/session');
  assert.equal(init.method, 'POST');
  assert.equal(init.credentials, 'include');
  assert.equal(init.redirect, 'follow');
  assert.deepEqual(init.headers, headers);
  const body = JSON.parse(init.body);
  assert.equal(body.sessionRequestData.clientRequestMonitorSettings[0].widthInPixels, 1920);
  assert.equal(body.sessionRequestData.clientRequestMonitorSettings[0].heightInPixels, 1080);
  assert.equal(body.sessionRequestData.clientRequestMonitorSettings[0].framesPerSecond, 120);
});

test('patches Request bodies and preserves Request plus init overrides', async () => {
  const harness = createHarness();
  const request = new Request('https://play.geforcenow.com/v2/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-original': 'yes' },
    body: sessionBody(),
  });

  await harness.fetch(request, {
    credentials: 'include',
    headers: { 'x-override': 'yes' },
  });

  const { input, init } = harness.getReceived();
  assert.ok(input instanceof Request);
  assert.equal(init, undefined);
  assert.equal(input.credentials, 'include');
  assert.equal(input.headers.get('x-override'), 'yes');
  assert.equal(input.headers.get('x-original'), null);
  const body = JSON.parse(await input.text());
  assert.equal(body.sessionRequestData.clientRequestMonitorSettings[0].widthInPixels, 1920);
});

test('leaves non-session requests untouched', async () => {
  const harness = createHarness();
  const init = { method: 'POST', body: 'unchanged', credentials: 'omit' };
  await harness.fetch('https://play.geforcenow.com/v2/other', init);
  const received = harness.getReceived();
  assert.equal(received.input, 'https://play.geforcenow.com/v2/other');
  assert.equal(received.init, init);
});
