const { app, globalShortcut, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { DiscordRPC } = require('./rpc.js');
const { switchFullscreenState } = require('./windowManager.js');

const HOME_PAGE = 'https://play.geforcenow.com?toto=tata';

const DEFAULT_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.101 Safari/537.36';
const WIN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36';
const CHROME_UA = 'Mozilla/5.0 (X11; CrOS x86_64 14909.100.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.83 Safari/537.36';

const DEFAULT_LANG = 'en-GB';

const DEFAULT_PLATFORM = 'Linux X86_64';
const WIN_PLATFORM = 'Windows';
const CHROME_PLATFORM = DEFAULT_PLATFORM;

var homePage = HOME_PAGE;

var userAgent = DEFAULT_UA;
var platform = DEFAULT_PLATFORM;
var lang = DEFAULT_LANG;

if (process.argv.includes('--spoof-chromeos')) {
  userAgent = CHROME_UA;
  platform = CHROME_PLATFORM;
}

if (process.argv.includes('--spoof-windows')) {
  userAgent = WIN_UA;
  platform = WIN_PLATFORM;
}

if (process.argv.includes('--lang')) {
  lang = process.argv[process.argv.indexOf('--lang') + 1];
}

console.log('Using user agent: ' + userAgent);
console.log('Process arguments: ' + process.argv);
console.log('Language: ' + lang);

ipcMain.on('getConfigData', function (event, arg) {
  event.sender.send('configData', {
    userAgent,
    platform,
    lang,
  });
});

app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WaylandWindowDecorations');

app.commandLine.appendSwitch(
  'disable-features',
  'UseChromeOSDirectVideoDecoder'
);
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-gpu-rasterization');

async function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      userAgent,
    },
  });

  ipcMain.handle('getConfig', () => ({
    userAgent,
    platform,
    lang,
  }));

  if (process.argv.includes('--direct-start')) {
    homePage = 'https://play.geforcenow.com/mall/#/streamer?launchSource=GeForceNOW&cmsId=' + process.argv[process.argv.indexOf('--direct-start') + 1];
  }
  mainWindow.loadURL(homePage, { userAgent });

  /*
  uncomment this to debug any errors with loading GFN landing page

  mainWindow.webContents.on("will-navigate", (event, url) => {
    console.log("will-navigate", url);
    event.preventDefault();
  });
  */
}

app.whenReady().then(async () => {
  createWindow();

  BrowserWindow.getAllWindows()[0].webContents.openDevTools();

  DiscordRPC('GeForce NOW');

  app.on('activate', async function() {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  globalShortcut.register('Super+F', async () => {
    switchFullscreenState();
  });

  globalShortcut.register('F11', async () => {
    switchFullscreenState();
  });

  globalShortcut.register('Alt+F4', async () => {
    app.quit();
  });

  globalShortcut.register('Alt+Home', async () => {
    BrowserWindow.getAllWindows()[0].loadURL(HOME_PAGE);
  });

  globalShortcut.register('F4', async () => {
    app.quit();
  });

  globalShortcut.register('Control+Shift+I', () => {
    BrowserWindow.getAllWindows()[0].webContents.toggleDevTools();
  });

  globalShortcut.register('Esc', async () => {
    var window = BrowserWindow.getAllWindows()[0];

    window.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: 'Esc'
    });
    window.webContents.sendInputEvent({
      type: 'char',
      keyCode: 'Esc'
    });
    window.webContents.sendInputEvent({
      type: 'keyUp',
      keyCode: 'Esc'
    });

    window.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: 'Esc'
    });
    window.webContents.sendInputEvent({
      type: 'char',
      keyCode: 'Esc'
    });
    window.webContents.sendInputEvent({
      type: 'keyUp',
      keyCode: 'Esc'
    });
  });
});

app.on('browser-window-created', async function(e, window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);

  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    BrowserWindow.getAllWindows()[0].loadURL(url);
  });

  window.on('page-title-updated', async function(e, title) {
    DiscordRPC(title);
  });
});

app.on('will-quit', async () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', async function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
