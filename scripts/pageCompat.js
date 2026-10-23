function createPageCompatibilityScript(settings) {
    return `
        (() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            const sessionPath = '/v2/session';
            const targetWidth = ${settings.targetWidth || 'Math.round(window.screen.width * window.devicePixelRatio)'};
            const targetHeight = ${settings.targetHeight || 'Math.round(window.screen.height * window.devicePixelRatio)'};
            const targetFps = ${settings.targetFps};

            function patchBody(bodyText) {
                try {
                    const body = JSON.parse(bodyText);
                    const sessionRequestData = body.sessionRequestData;
                    if (!sessionRequestData) return bodyText;
                    if (Array.isArray(sessionRequestData.clientRequestMonitorSettings)) {
                        for (const monitor of sessionRequestData.clientRequestMonitorSettings) {
                            monitor.widthInPixels = targetWidth;
                            monitor.heightInPixels = targetHeight;
                            monitor.framesPerSecond = targetFps;
                        }
                    }
                    if (Array.isArray(sessionRequestData.metaData)) {
                        const physicalResolution = sessionRequestData.metaData.find(entry => entry.key === 'clientPhysicalResolution');
                        if (physicalResolution) {
                            physicalResolution.value = JSON.stringify({ horizontalPixels: targetWidth, verticalPixels: targetHeight });
                        }
                    }
                    return JSON.stringify(body);
                } catch (_) {
                    return bodyText;
                }
            }

            const originalFetch = window.fetch;
            window.fetch = async function (input, init) {
                const request = input instanceof Request ? input : null;
                const url = request ? request.url : String(input instanceof URL ? input.href : input);
                const method = (init && init.method) || (request && request.method) || 'GET';
                let body = init && init.body !== undefined ? init.body : null;
                if (body === null && request && method.toUpperCase() === 'POST') {
                    body = await request.clone().text();
                }
                if (method.toUpperCase() === 'POST' && url.includes(sessionPath) && typeof body === 'string') {
                    if (request && (!init || init.body === undefined)) {
                        input = new Request(request, { body: patchBody(body) });
                        init = undefined;
                    } else {
                    init = { ...(init || {}), body: patchBody(body) };
                    }
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
                if (this._gfnMethod && this._gfnMethod.toUpperCase() === 'POST' && this._gfnUrl && this._gfnUrl.includes(sessionPath) && typeof body === 'string') {
                    body = patchBody(body);
                }
                return originalSend.call(this, body);
            };

            if (window.speechSynthesis) {
                window.speechSynthesis.getVoices = () => [{ voiceURI: 'Google US English', name: 'Google US English', lang: 'en-US', localService: false, default: false }];
            }
        })();
    `;
}

module.exports = { createPageCompatibilityScript };
