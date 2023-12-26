import { app, globalShortcut, BrowserWindow } from 'electron';
import path from 'path';
import { DiscordRPC } from './rpc';
import { switchFullscreenState } from './windowManager';

let homePage: string = 'https://play.geforcenow.com';
let userAgent: string = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.3';

console.log('Using user agent: ' + userAgent);
console.log('Process arguments: ' + process.argv);

app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WaylandWindowDecorations,RawDraw');

app.commandLine.appendSwitch(
  'disable-features',
  'UseChromeOSDirectVideoDecoder'
);

app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');
app.commandLine.appendSwitch('use-gl', 'egl');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

async function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
    },
  });

  mainWindow.webContents.userAgent = userAgent;

  if (process.argv.includes('--direct-start')) {
    mainWindow.loadURL('https://play.geforcenow.com/mall/#/streamer?launchSource=GeForceNOW&cmsId=' + process.argv[process.argv.indexOf('--direct-start') + 1]);
  } else {
    mainWindow.loadURL(homePage);
  }
}

async function sendKeyEvent(window: Electron.BrowserWindow, key: string) {
  const eventTypes: ('keyDown' | 'char' | 'keyUp')[] = ['keyDown', 'char', 'keyUp'];
  eventTypes.forEach((type) => {
    window.webContents.sendInputEvent({ type, keyCode: key });
  });
}


app.whenReady().then(async () => {
  createWindow();

  DiscordRPC('Browsing on GeForce NOW');

  app.on('activate', async function () {
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
    const window = BrowserWindow.getAllWindows()[0];
    await sendKeyEvent(window, 'Esc');
    await sendKeyEvent(window, 'Esc');
  });

});

app.on('browser-window-created', async function (e, window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);

  window.webContents.setUserAgent(userAgent);

  window.webContents.setWindowOpenHandler(({ url }) => {
    window.loadURL(url);
    return { action: 'deny' };
  });

  window.on('page-title-updated', async function (e, title) {
    DiscordRPC(title);
  });

});

app.on('will-quit', async () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', async function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});