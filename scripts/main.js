const {app, BrowserWindow} = require('electron')
const path = require('path')
const userAgent = 'Mozilla/5.0 (X11; CrOS x86_64 13099.85.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.110 Safari/537.36';

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 768,
    //fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadURL('https://play.geforcenow.com');
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('browser-window-created',function(e,window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);
  window.webContents.setUserAgent(userAgent);

  if (window.id != 1) {
    var mainWindow = BrowserWindow.fromId(1);
    var mainWindowPosition = mainWindow.getPosition();
    var mainWindowSize = mainWindow.getSize();
    var windowSize = window.getSize();

    window.setPosition(
      mainWindowPosition[0] + (mainWindowSize[0] - windowSize[0]) / 2,
      mainWindowPosition[1] + (mainWindowSize[1] - windowSize[1]) / 2);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
