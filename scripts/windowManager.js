const { app, BrowserWindow } = require('electron');

var isFullScreen = false;
var isGameStreamingScreen = false;

function toggleFullscreen(state) {
  const windows = BrowserWindow.getAllWindows();
  if (!windows || windows.length === 0) return;
  var window = windows[0];
  var actualState = window.isFullScreen();
  if (isFullScreen != state || actualState != state) {
    if (state || !isGameStreamingScreen) {
      window.setFullScreen(state);
      isFullScreen = state;
      console.log('Fullscreen state changed to: ' + state);

      if (state) {
        window.webContents.executeJavaScript('window.document.body.requestPointerLock();');
        focusWindow();
      } else {
        window.webContents.executeJavaScript('window.document.body.exitPointerLock();');
      }
    }
  }
}

function toggleGameStreamingMode(state) {
  if (isGameStreamingScreen != state) {
    isGameStreamingScreen = state;
    console.log('Game streaming mode state changed to: ' + state);
  }

  toggleFullscreen(isGameStreamingScreen);

  if (state) {
    focusWindow();
  }
}

function switchFullscreenState() {
  if (isFullScreen) {
    toggleFullscreen(false);
  } else {
    toggleFullscreen(true);
  }
}

function focusWindow() {
  const windows = BrowserWindow.getAllWindows();
  if (!windows || windows.length === 0) return;
  windows[0].focus();
}

app.on('browser-window-created', async function (event, browserWindow) {
  browserWindow.on('leave-full-screen', async function (ev) {
    ev.preventDefault();
    if (isGameStreamingScreen) {
      toggleFullscreen(true);
    }
  });
  browserWindow.on('page-title-updated', async function (event, title) {
    toggleGameStreamingMode(title.includes('on GeForce NOW'));
  });
});

module.exports = { toggleFullscreen, switchFullscreenState };
