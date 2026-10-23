const { app, BrowserWindow, session, shell, Notification } = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const findProcess = require('find-process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { DiscordRPC, destroyDiscordRPC } = require('./rpc.js');
const { switchFullscreenState, setFullscreenState } = require('./windowManager.js');
const { createPageCompatibilityScript } = require('./pageCompat.js');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

var homePage = 'https://play.geforcenow.com';
const chromeVersion = process.versions.chrome;
const chromeMajor = chromeVersion.split('.')[0];
var userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36 Edg/${chromeVersion}`;

const isSteamDeck = process.env.SteamDeck === '1';
const isWayland = !!process.env.WAYLAND_DISPLAY;
const hasExperimentalGpuFlagsEnabled =
  process.env.GFN_ENABLE_EXPERIMENTAL_GPU_FLAGS === '1';
const trustedApplicationPermissionTypes = new Set([
  'display-capture',
  'fullscreen',
  'media',
  'mediaKeySystem',
  'pointerLock',
]);

console.log('Using user agent: ' + userAgent);
console.log('Process arguments: ' + process.argv);

// Run as a native Wayland client, avoiding XWayland overhead and enabling compositor overlays.
if (isWayland) {
  app.commandLine.appendSwitch('ozone-platform', 'wayland');
  app.commandLine.appendSwitch('enable-wayland-ime');
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
if (isWayland) {
  enabledFeatures.push('WaylandTextInputV3', 'TouchEventsAPI');
} else {
  // RawDraw uses a GPU raster path that can activate Vulkan; skip it on Wayland.
  enabledFeatures.push('RawDraw');
}
app.commandLine.appendSwitch('enable-features', enabledFeatures.join(','));
app.commandLine.appendSwitch('disable-features', disabledFeatures.join(','));
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Keep aggressive GPU flags opt-in, as they can cause missing text and
// textures on specific Linux driver stacks.
if (hasExperimentalGpuFlagsEnabled) {
  app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');
}

// Tracks GPU crashes to progressively fall back across GL backends, then to
// disabled hardware acceleration.
const configPath = path.join(app.getPath('userData'), 'config.json');
const defaultConfig = { crashCount: 0 };
const maximumCrashCount = 2;
const config = readCrashConfig(configPath);

let isHandlingGpuCrash = false;

if (config.crashCount <= 1) {
  app.commandLine.appendSwitch('enable-accelerated-video-decode');
}

if (isWayland) {
  if (config.crashCount === 0) {
    app.commandLine.appendSwitch('use-gl', 'egl');
  } else if (config.crashCount === 1) {
    app.commandLine.appendSwitch('use-gl', 'desktop');
  } else {
    app.disableHardwareAcceleration();
  }
} else if (config.crashCount === 0) {
  app.commandLine.appendSwitch('use-gl', 'egl');
} else if (config.crashCount === 1) {
  app.commandLine.appendSwitch('use-gl', 'angle');
} else {
  app.disableHardwareAcceleration();
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreenable: true,
    fullscreen: isSteamDeck,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      userAgent: userAgent,
    },
  });

  const argIdx = process.argv.indexOf('--direct-start');
  const requestedCmsId = (argIdx !== -1 && process.argv[argIdx + 1]) || process.env.GFN_DIRECT_START_ID || null;
  const cmsId = isValidCmsId(requestedCmsId) ? requestedCmsId : null;

  if (requestedCmsId && !cmsId) {
    console.error('--direct-start requires a cmsId argument');
  }
  mainWindow.loadURL(cmsId
    ? `https://play.geforcenow.com/mall/#/streamer?launchSource=GeForceNOW&cmsId=${cmsId}`
    : homePage).catch(error => {
      console.error('Failed to load GeForce NOW:', error);
    });

}

let discordIsRunning = false;

app.whenReady().then(async () => {
  // Override sec-ch-ua client hint headers to match the spoofed user agent.
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const h = details.requestHeaders;
    h['sec-ch-ua'] = `"Microsoft Edge";v="${chromeMajor}", "Chromium";v="${chromeMajor}", "Not?A_Brand";v="99"`;
    h['sec-ch-ua-mobile'] = '?0';
    h['sec-ch-ua-platform'] = '"Linux"';
    callback({ requestHeaders: h });
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    callback(Boolean(details && isTrustedApplicationUrl(details.requestingUrl) && trustedApplicationPermissionTypes.has(permission)));
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) =>
    isTrustedApplicationUrl(requestingOrigin) && trustedApplicationPermissionTypes.has(permission));

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
      win.loadURL(homePage).catch(error => {
        console.error('Failed to load the GeForce NOW home page:', error);
      });
    }
  });

  electronLocalshortcut.register('Control+Shift+P', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win || win.isDestroyed()) return;

    const url = win.webContents.getURL();
    const cmsMatch = url.match(/[?&]cmsId=(\d+)(?:&|$)/);
    if (!cmsMatch || !isGameUrl(url)) {
      console.error('Ctrl+Shift+P: no cmsId in current URL, are you in a game?');
      return;
    }
    const cmsId = cmsMatch[1];
    const gameTitle = win.getTitle().replace(/ on GeForce NOW$/i, '').trim() || `Game ${cmsId}`;
    if (containsDesktopEntryControlCharacter(gameTitle)) {
      console.error('Ctrl+Shift+P: the game title contains unsupported control characters');
      return;
    }

    const execCmd = createDesktopExecCommand(cmsId);
    if (!execCmd) {
      console.error('Ctrl+Shift+P: the application path or Flatpak identifier is invalid');
      return;
    }

    const desktopEntry = [
      '[Desktop Entry]',
      'Encoding=UTF-8',
      `Name=${escapeDesktopEntryValue(gameTitle)}`,
      'Comment=Stream this game using the Nvidia GeForce NOW service',
      'Type=Application',
      `Exec=${execCmd}`,
      'Icon=nvidia',
      'StartupWMClass=geforce now',
      'Categories=Network;Game;',
      `Keywords=${['Game', 'Streaming', 'Nvidia', 'GeForce', 'NOW', 'GFN', gameTitle]
        .map(escapeDesktopEntryValue)
        .join(';')};`,
    ].join('\n') + '\n';

    const appsDir = path.join(os.homedir(), '.local', 'share', 'applications');
    const safeTitle = gameTitle.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'game';
    const fileName = `geforenow-${cmsId}-${safeTitle}.desktop`;
    const desktopPath = path.join(appsDir, fileName);

    try {
      fs.mkdirSync(appsDir, { recursive: true });
      fs.writeFileSync(desktopPath, desktopEntry, { mode: 0o644 });
      console.log(`Desktop shortcut created: ${desktopPath}`);
      new Notification({
        title: 'Shortcut created',
        body: `"${gameTitle}" has been added to your application launcher.`,
      }).show();
    } catch (err) {
      console.error('Failed to create desktop shortcut:', err);
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

  window.webContents.on('will-navigate', (event, url) => {
    handleNavigation(event, url);
  });

  window.webContents.on('will-redirect', (event, url) => {
    handleNavigation(event, url);
  });

  window.webContents.addScriptToExecuteOnNewDocument(createPageCompatibilityScript({
      targetWidth: getPositiveInteger(process.env.GFN_RESOLUTION_WIDTH),
      targetHeight: getPositiveInteger(process.env.GFN_RESOLUTION_HEIGHT),
      targetFps: getPositiveInteger(process.env.GFN_REFRESH_RATE) || 60,
  })).catch(error => {
    console.error('Failed to install page compatibility hooks:', error);
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!isTrustedApplicationUrl(url)) openExternalUrl(url);
    return { action: 'deny' };
  });

  if (discordIsRunning) {
    window.on('page-title-updated', async function (e, title) {
      DiscordRPC(title);
    });
  }
});

app.on('child-process-gone', (event, details) => {
  if (isHandlingGpuCrash || details.type !== 'GPU' || details.reason !== 'crashed') return;

  isHandlingGpuCrash = true;
  const nextCrashCount = Math.min(config.crashCount + 1, maximumCrashCount);
  config.crashCount = nextCrashCount;

  if (!writeCrashConfig(configPath, config)) {
    console.error('GPU crash state could not be persisted; stopping automatic recovery.');
    app.quit();
    return;
  }

  if (nextCrashCount >= maximumCrashCount) {
    console.error('GPU crash recovery exhausted; stopping automatic recovery.');
    app.quit();
    return;
  }

  console.log('GPU crashed; restarting with fallback rendering settings.');
  app.relaunch();
  app.quit();
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

function readCrashConfig(filePath) {
  try {
    const parsedConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (isValidCrashConfig(parsedConfig)) return parsedConfig;
  } catch (error) {
    console.error('Failed to read crash config, using defaults:', error);
  }

  return { ...defaultConfig };
}

function isValidCrashConfig(value) {
  return value !== null && !Array.isArray(value) &&
    Number.isSafeInteger(value.crashCount) &&
    value.crashCount >= 0 && value.crashCount <= maximumCrashCount;
}

function writeCrashConfig(filePath, value) {
  const temporaryFilePath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(temporaryFilePath, JSON.stringify(value), 'utf-8');
    fs.renameSync(temporaryFilePath, filePath);
    return true;
  } catch (error) {
    console.error('Failed to write crash config:', error);
    try {
      fs.unlinkSync(temporaryFilePath);
    } catch (_) {
      // The temporary file may not exist after a failed write or rename.
    }
    return false;
  }
}

function isValidCmsId(value) {
  return typeof value === 'string' && /^\d+$/.test(value);
}

function getPositiveInteger(value) {
  if (!/^\d+$/.test(value || '')) return null;
  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function isGameUrl(value) {
  try {
    const parsedUrl = new URL(value);
    return isTrustedApplicationUrl(value) && parsedUrl.pathname === '/mall/' &&
      parsedUrl.hash.startsWith('#/streamer');
  } catch (_) {
    return false;
  }
}

function containsDesktopEntryControlCharacter(value) {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function escapeDesktopEntryValue(value) {
  return value.replace(/([\\;\n\r\t])/g, character => {
    const escapedCharacters = {
      '\\': '\\\\',
      ';': '\\;',
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
    };
    return escapedCharacters[character];
  });
}

function escapeDesktopExecArgument(value) {
  return `"${value.replace(/([\\"%])/g, character => {
    if (character === '%') return '%%';
    return `\\${character}`;
  })}"`;
}

function createDesktopExecCommand(cmsId) {
  const flatpakId = process.env.FLATPAK_ID;
  if (flatpakId && /^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(flatpakId)) {
    return ['flatpak', 'run', flatpakId, '--direct-start', cmsId]
      .map(escapeDesktopExecArgument)
      .join(' ');
  }

  if (flatpakId) return null;
  return [app.getPath('exe'), '--direct-start', cmsId]
    .map(escapeDesktopExecArgument)
    .join(' ');
}

function isTrustedApplicationUrl(value) {
  try {
    const parsedUrl = new URL(value);
    const hostname = parsedUrl.hostname.toLowerCase();
    const trustedHostname = hostname === 'nvidia.com' || hostname.endsWith('.nvidia.com') ||
      hostname === 'geforcenow.com' || hostname.endsWith('.geforcenow.com');
    return parsedUrl.protocol === 'https:' && !parsedUrl.username && !parsedUrl.password &&
      (!parsedUrl.port || parsedUrl.port === '443') && trustedHostname;
  } catch (_) {
    return false;
  }
}

function handleNavigation(event, value) {
  if (isTrustedApplicationUrl(value)) return;
  event.preventDefault();
  openExternalUrl(value);
}

function openExternalUrl(value) {
  try {
    const parsedUrl = new URL(value);
    if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) return;
    shell.openExternal(parsedUrl.toString()).catch(error => {
      console.error('Failed to open external URL:', error);
    });
  } catch (_) {
    console.error('Blocked invalid external URL');
  }
}
