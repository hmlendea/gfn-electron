const { app, BrowserWindow, session } = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const findProcess = require('find-process');
const fs = require('fs');
const path = require('path');
const { DiscordRPC, destroyDiscordRPC } = require('./rpc.js');
const { switchFullscreenState, setFullscreenState } = require('./windowManager.js');

var homePage = 'https://play.geforcenow.com';
var userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.152 Safari/537.36 Edg/130.0.6723.152';

const isSteamDeck = process.env.SteamDeck === '1';
const isWayland = !!process.env.WAYLAND_DISPLAY;

console.log('Using user agent: ' + userAgent);
console.log('Process arguments: ' + process.argv);

// Run as a native Wayland client, avoiding XWayland overhead and enabling compositor overlays.
if (isWayland) {
  app.commandLine.appendSwitch('ozone-platform', 'wayland');
  app.commandLine.appendSwitch('enable-wayland-ime');
  app.commandLine.appendSwitch('enable-features', 'WaylandTextInputV3,TouchEventsAPI');
  // ANGLE's Vulkan backend is incompatible with ozone-wayland; force OpenGL ES.
  app.commandLine.appendSwitch('use-angle', 'gl');
  // Use EGL for native Wayland surfaces rather than the X11 path.
  app.commandLine.appendSwitch('use-gl', 'egl');
}

const disabledFeatures = ['UseChromeOSDirectVideoDecoder'];
if (isWayland) {
  // Disable all features that activate Vulkan, which is incompatible with ozone-wayland.
  disabledFeatures.push('Vulkan', 'DefaultANGLEVulkan', 'VulkanFromANGLE');
}

const enabledFeatures = ['VaapiVideoDecoder', 'WaylandWindowDecorations', 'AcceleratedVideoDecodeLinuxGL'];
if (!isWayland) {
  // RawDraw uses a GPU raster path that can activate Vulkan; skip it on Wayland.
  enabledFeatures.push('RawDraw');
}
app.commandLine.appendSwitch('enable-features', enabledFeatures.join(','));
app.commandLine.appendSwitch('disable-features', disabledFeatures.join(','));
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');

// Tracks GPU crashes to progressively fall back: ANGLE → EGL → disabled hardware acceleration.
const configPath = path.join(app.getPath('userData'), 'config.json');
let config = { crashCount: 0 };
try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (error) {
  console.error('Failed to read config, using defaults:', error);
}

switch(config.crashCount) {
  case 0:
    app.commandLine.appendSwitch('enable-accelerated-video-decode');
    app.commandLine.appendSwitch('use-gl', 'angle');
    break;
  case 1:
    app.commandLine.appendSwitch('enable-accelerated-video-decode');
    app.commandLine.appendSwitch('use-gl', 'egl');
    break;
  default:
    app.disableHardwareAcceleration();
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreenable: true,
    fullscreen: isSteamDeck,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      userAgent: userAgent,
    },
  });

  const argIdx = process.argv.indexOf('--direct-start');
  const cmsId = (argIdx !== -1 && process.argv[argIdx + 1]) || process.env.GFN_DIRECT_START_ID || null;

  if (argIdx !== -1 && !cmsId) {
    console.error('--direct-start requires a cmsId argument');
  }
  mainWindow.loadURL(cmsId
    ? 'https://play.geforcenow.com/mall/#/streamer?launchSource=GeForceNOW&cmsId=' + cmsId
    : homePage);

}

let discordIsRunning = false;

app.whenReady().then(async () => {
  // Check Discord before creating the window so browser-window-created fires after.
  discordIsRunning = await isDiscordRunning();

  createWindow();

  if (isSteamDeck) {
    setFullscreenState(true);
  }

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
    const win = BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      win.loadURL(homePage);
    }
  });

  electronLocalshortcut.register('Control+Shift+I', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      win.webContents.toggleDevTools();
    }
  });
});

app.on('browser-window-created', async function (e, window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);

  window.webContents.setUserAgent(userAgent);

  window.webContents.setWindowOpenHandler(({ url }) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      win.loadURL(url);
    }
    return { action: 'deny' };
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
    try {
      fs.writeFileSync(configPath, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to write crash config:', error);
    }

    console.log('GPU crashed; restarting with fallback rendering settings.');

    app.relaunch();
    app.quit();
  }
});

app.on('will-quit', () => {
  destroyDiscordRPC();
  try {
    electronLocalshortcut.unregisterAll();
  } catch (_) {}
});

app.on('window-all-closed', function () {
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
