const {app, globalShortcut, BrowserWindow} = require('electron');
const path = require('path');

var isFullScreen = false;

app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

function createWindow () {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false
    }
  });

  mainWindow.loadURL('https://play.geforcenow.com');
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  globalShortcut.register("Super+F", () => {
    isFullScreen = BrowserWindow.getAllWindows()[0].isFullScreen();
    if (isFullScreen) {
      BrowserWindow.getAllWindows()[0].setFullScreen(false);
      isFullScreen = false;
    } else {
      BrowserWindow.getAllWindows()[0].setFullScreen(true);
      isFullScreen = true;
    }
  });
});

app.on('browser-window-created', function(e, window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);

  window.on('leave-full-screen', function(e, win) {
    if (isFullScreen) {
      BrowserWindow.getAllWindows()[0].setFullScreen(true);
    }
  });

  window.on('page-title-updated', function(e, title) {
    if (title.includes('on GeForce NOW')) {
      window.setFullScreen(true);
      isFullScreen = true;
    } else {
      window.setFullScreen(false);
      isFullScreen = false;
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
