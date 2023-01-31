const {app, globalShortcut, BrowserWindow } = require('electron');
const path = require('path');
const { DiscordRPC } = require('./rpc.js');
const { switchFullscreenState } = require('./windowManager.js');

//> Definitions
const HOME_PAGE_URL = 'https://play.geforcenow.com';
const DIRECT_START_URL = 'https://play.geforcenow.com/mall/#/streamer?launchSource=GeForceNOW&cmsId=';

const DEFAULT_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.101 Safari/537.36';
const WIN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36';
const CHROME_UA = 'Mozilla/5.0 (X11; CrOS x86_64 14909.100.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.83 Safari/537.36';

const OPT_SPOOF_WIN = '--spoof-windows';
const OPT_SPOOF_CHROMEOS = '--spoof-chromeos';
const OPT_DIRECT_START = '--direct-start';

let userAgent = DEFAULT_UA;
let game;

const spoofWindows = process.argv.includes(OPT_SPOOF_WIN);
const spoofChromeOS = process.argv.includes(OPT_SPOOF_CHROMEOS);
const directStart = process.argv.includes(OPT_DIRECT_START);
//< Definitions

//> Retrieving cli options
if (spoofWindows) {
  userAgent = WIN_UA;
}

if (spoofChromeOS) {
  userAgent = CHROME_UA;
}

if (directStart) {
  game = process.argv[process.argv.indexOf(OPT_DIRECT_START) + 1];;
}

console.log('Using user agent: ' + userAgent);
console.log('Process arguments: ' + process.argv);
//< Retrieving cli options

//> Config
if (spoofWindows || spoofChromeOS) {
  app.commandLine.appendSwitch('disable-features', 'UserAgentClientHint');
}

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
//< Config

//> Start main process
async function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      userAgent: userAgent,
    },
  });

  if (directStart) {
    mainWindow.loadURL(DIRECT_START_URL + game);
  } else {
    mainWindow.loadURL(HOME_PAGE_URL);
  }

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
    BrowserWindow.getAllWindows()[0].loadURL(homePage);
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

  window.webContents.setUserAgent(userAgent);

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
//< Start main process
