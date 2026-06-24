// Suppress the Electron/webdriver fingerprint that sites use to detect non-browser clients.
Object.defineProperty(navigator, 'webdriver', { get: () => false });

// Intercept session requests to the GFN API and override the reported monitor
// specs, enabling higher resolutions and refresh rates than the web client
// would otherwise advertise.
(function interceptSessionRequests() {
  const SESSION_PATH = '/v2/session';
  // Default to physical pixels (CSS pixels * DPR) so HiDPI screens report
  // their true resolution instead of CSS-scaled dimensions.
  const targetWidth  = parseInt(process.env.GFN_RESOLUTION_WIDTH)  || Math.round(window.screen.width  * window.devicePixelRatio);
  const targetHeight = parseInt(process.env.GFN_RESOLUTION_HEIGHT) || Math.round(window.screen.height * window.devicePixelRatio);
  const targetFps    = parseInt(process.env.GFN_REFRESH_RATE) || 60;

  function patchBody(bodyText) {
    try {
      const body = JSON.parse(bodyText);
      const sd = body.sessionRequestData;
      if (!sd) return bodyText;

      if (Array.isArray(sd.clientRequestMonitorSettings)) {
        for (const m of sd.clientRequestMonitorSettings) {
          m.widthInPixels  = targetWidth;
          m.heightInPixels = targetHeight;
          m.framesPerSecond = targetFps;
        }
      }

      if (Array.isArray(sd.metaData)) {
        const physRes = sd.metaData.find(e => e.key === 'clientPhysicalResolution');
        if (physRes) {
          physRes.value = JSON.stringify({ horizontalPixels: targetWidth, verticalPixels: targetHeight });
        }
      }

      return JSON.stringify(body);
    } catch (_) {
      return bodyText;
    }
  }

  const originalFetch = window.fetch;
  window.fetch = function (input, init = {}) {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
    if ((init.method || 'GET').toUpperCase() === 'POST' && url.includes(SESSION_PATH) && init.body) {
      init = { ...init, body: patchBody(init.body) };
    }
    return originalFetch.call(this, input, init);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._gfnMethod = method;
    this._gfnUrl = String(url);
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (this._gfnMethod && this._gfnMethod.toUpperCase() === 'POST' &&
        this._gfnUrl && this._gfnUrl.includes(SESSION_PATH) && typeof body === 'string') {
      body = patchBody(body);
    }
    return originalSend.call(this, body);
  };
})()

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

(function mockChromeUserAgent() {
  window.speechSynthesis.getVoices = function () {
    return [
      {
        voiceURI: "Google US English",
        name: "Google US English",
        lang: "en-US",
        localService: false,
        default: false,
      },
    ];
  };
})();