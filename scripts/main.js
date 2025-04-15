const { app, BrowserWindow, session } = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const findProcess = require('find-process');
const fs = require('fs');
const path = require('path');
const { DiscordRPC } = require('./rpc.js');
const { switchFullscreenState } = require('./windowManager.js');

var homePage = 'https://play.geforcenow.com';
var userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.152 Safari/537.36 Edg/130.0.6723.152';

console.log('Using user agent: ' + userAgent);
console.log('Process arguments: ' + process.argv);

app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WaylandWindowDecorations,RawDraw');

app.commandLine.appendSwitch(
  'disable-features',
  'UseChromeOSDirectVideoDecoder'
);
app.commandLine.appendSwitch("enable-features", "AcceleratedVideoDecodeLinuxGL");
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');

// To identify a possible stable 'use-gl' switch implementation for our application, we utilize a config file that stores the number of crashes.
// On Linux, the crash count is likely stored here: /home/[username]/.config/GeForce NOW/config.json.
// To reset the crash count, we can delete that file.

// If the 'use-gl' switch with the 'angle' implementation crashes, the app will then use the 'egl' implementation.
// If the 'egl' implementation also crashes, the app will disable hardware acceleration.

// When I try to use the 'use-gl' switch with 'desktop' or 'swiftshader', it results in an error indicating that these options are not among the permitted implementations.
// It's possible that future versions of Electron may introduce support for 'desktop' and 'swiftshader' implementations.

// Based on my current understanding (which may be incorrect), the 'angle' implementation is preferred due to its utilization of 'OpenGL ES', which ensures consistent behavior across different systems, such as Windows and Linux systems.
// Furthermore, 'angle' includes an additional abstraction layer that could potentially mitigate bugs or circumvent limitations inherent in direct implementations.

// When the 'use-gl' switch is functioning correctly, I still encounter the 'GetVSyncParametersIfAvailable() error' three times, but it does not occur thereafter (based on my testing).
const configPath = path.join(app.getPath('userData'), 'config.json');
const config = fs.existsSync(configPath) ?
  JSON.parse(fs.readFileSync(configPath, 'utf-8')) :
  { crashCount: 0 };

switch(config.crashCount) {
  case 0:
    app.commandLine.appendArgument('enable-accelerated-video-decode');
    app.commandLine.appendSwitch('use-gl', 'angle');
    break;
  case 1:
    app.commandLine.appendArgument('enable-accelerated-video-decode');
    app.commandLine.appendSwitch('use-gl', 'egl');
    break;
  default:
    app.disableHardwareAcceleration();
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      userAgent: userAgent,
    },
  });

  if (process.argv.includes('--direct-start')) {
    mainWindow.loadURL('https://play.geforcenow.com/mall/#/streamer?launchSource=GeForceNOW&cmsId=' + process.argv[process.argv.indexOf('--direct-start') + 1]);
  } else {
    mainWindow.loadURL(homePage);
  }

  /*
  uncomment this to debug any errors with loading GFN landing page

  mainWindow.webContents.on("will-navigate", (event, url) => {
    console.log("will-navigate", url);
    event.preventDefault();
  });
  */
}

let discordIsRunning = false;

app.whenReady().then(async () => {
  // Ensure isDiscordRunning is called before createWindow to prevent the 'browser-window-created' event from triggering before the Discord check is complete.
  discordIsRunning = await isDiscordRunning();

  createWindow();

  if (discordIsRunning) {
    DiscordRPC('GeForce NOW');
  }

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  electronLocalshortcut.register('Super+F', async () => {
    switchFullscreenState();
  });

  electronLocalshortcut.register('F11', async () => {
    switchFullscreenState();
  });

  electronLocalshortcut.register('Alt+F4', async () => {
    app.quit();
  });

  electronLocalshortcut.register('Alt+Home', async () => {
    BrowserWindow.getAllWindows()[0].loadURL(homePage);
  });

  electronLocalshortcut.register('Control+Shift+I', () => {
    BrowserWindow.getAllWindows()[0].webContents.toggleDevTools();
  });
});

app.on('browser-window-created', async function (e, window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);

  window.webContents.setUserAgent(userAgent);

  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    BrowserWindow.getAllWindows()[0].loadURL(url);
  });

  if (discordIsRunning) {
    window.on('page-title-updated', async function (e, title) {
      DiscordRPC(title);
    });
  }
});

app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU' && details.reason === 'crashed') {
      config.crashCount++;
      fs.writeFileSync(configPath, JSON.stringify(config));

      console.log("Initiating application restart with an alternative 'use-gl' switch implementation or with hardware acceleration disabled, aiming to improve stability or performance based on prior execution outcomes.");

      app.relaunch();
      app.exit(0);
  }
});

app.on('will-quit', async () => {
  electronLocalshortcut.unregisterAll();
});

app.on('window-all-closed', async function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function isDiscordRunning() {
  return new Promise(resolve => {
      findProcess('name', 'Discord').then(list => {
          if (list.length > 0) {
              resolve(true);
          } else {
              resolve(false);
          }
      }).catch(error => {
          console.log('Error checking Discord process:', error);
          resolve(false);
      });
  });
}
