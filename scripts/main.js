const {app, globalShortcut, BrowserWindow} = require('electron')
const path = require('path')
const userAgent = 'Mozilla/5.0 (X11; CrOS x86_64 13099.85.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.110 Safari/537.36';

function createWindow () {
  const mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadURL('https://play.geforcenow.com');
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  })
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })

  // Prevent ESC from exiting fullscreen
  globalShortcut.register('Esc', () => { });
})

app.on('browser-window-created', function(e, window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);
  window.webContents.setUserAgent(userAgent);

  if (window.id != 1) {
    var mainWindow = BrowserWindow.fromId(1);
    var mainWindowPosition = mainWindow.getPosition();

    window.setPosition(mainWindowPosition[0], mainWindowPosition[1]);
    window.center();
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin')
    app.quit();
})
