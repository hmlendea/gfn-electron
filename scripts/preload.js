// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require('electron');

ipcRenderer.send('getConfigData');

ipcRenderer.on('configData', function (event, config) {
  const {
    userAgent,
    platform,
    lang,
  } = config || {};

  console.log(userAgent);
  console.log(platform);
  console.log(lang);

  navigator.__defineGetter__('userAgent', function(){
    return userAgent;
  });

  navigator.__defineGetter__('language', function(){
    return lang;
  });

  navigator.__defineGetter__('languages', function(){
    return [lang];
  });

  navigator.__defineGetter__('platform', function(){
    return platform;
  });

  navigator.userAgentData.__defineGetter__('platform', function(){
    return platform;
  });
});

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
  let oiginalVoices = window.speechSynthesis.getVoices();
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

  //wait some arbitraty time before cleaning up the mess we did previously
  setTimeout(() => {
    window.speechSynthesis.getVoices = function () {
      return oiginalVoices;
    };
  }, 10_000);
})();
