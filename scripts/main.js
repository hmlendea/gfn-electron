const { app, BrowserWindow, session, Notification, globalShortcut } = require('electron');
const fs = require('fs');
const path = require('path');
const { DiscordRPC } = require('./rpc.js');
// const { switchFullscreenState } = require('./windowManager.js'); // let electron handle the fullscreen and not manually setting it
const homePage = 'https://play.geforcenow.com/mall/';
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0  Safari/537.36';
console.log('Using user agent: ' + userAgent);
console.log('Process arguments: ' + process.argv);
app.commandLine.appendSwitch('log-level', '3');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
app.commandLine.appendSwitch('enable-wayland-ime');
app.commandLine.appendSwitch('wayland-text-input-version', '2');
app.commandLine.appendSwitch('enable-features', 'AcceleratedVideoDecodeLinuxZeroCopyGL,VaapiVideoDecoder,AcceleratedVideoEncoder,VaapiIgnoreDriverChecks,VaapiOnNvidiaGPUs,VaapiVideoDecodeLinuxGL,AcceleratedVideoDecodeLinuxGL,UseOzonePlatform,TouchpadOverscrollHistoryNavigation');
process.on('uncaughtException', (err) => {
  console.error('Ignoring uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Ignoring unhandled promise rejection:', reason);
});

const configPath = path.join(app.getPath('userData'), 'config.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf-8')) : { crashCount: 0 };

let discordIsRunning = false;
let notified = false;

function isDiscordRunning() {
  return new Promise(resolve => {
    resolve(true);
  });
}

const userSessions = {
  Main: null,
  User2: null,
  User3: null,
  User4: null,
  User5: null,
};

function createWindowForUser(userId) {
  for (const [id, win] of Object.entries(userSessions)) {
    if (id !== userId && win && !win.isDestroyed()) {
      win.close();
      userSessions[id] = null;
    }
  }

  const partitionName = `persist:${userId}`;
  const partition = session.fromPartition(partitionName);

  if (!partition._websocketHooked) {
    partition.webRequest.onBeforeRequest(
      { urls: ["wss://*/*"] },  // Thanks AstralVixen for this part of the code.
      async (details, callback) => {
        const url = details.url;
        const isNvidiaRequest = url.includes("nvidiagrid") && url.includes("/sign_in") && url.includes("peer_id");

        if (isNvidiaRequest) {
          const window = BrowserWindow.getAllWindows()[0];
          if (window && !notified) {
            const title = await window.webContents.getTitle();
            console.log(`[GeForce NOW] Current title: "${title}"`);

            new Notification({
              title: "GeForce NOW",
              body: `${title.replace(' on GeForce NOW', '')} is ready to play`,
              icon: path.join(__dirname, "icon.png")
            }).show();

            notified = true;
          }
        }

        callback({ cancel: false });
      }
    );

    partition._websocketHooked = true;
  }

  if (!userSessions[userId]) {
    userSessions[userId] = new BrowserWindow({
      fullscreenable: true,
      show: false,
      icon: path.join(__dirname, "icon.png"),
     webPreferences: {
    session: session.fromPartition(partitionName),
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: false,
    userAgent: userAgent,},
    });

    userSessions[userId].loadURL(homePage);

    userSessions[userId].once('ready-to-show', () => {
      userSessions[userId].show();
      new Notification({
        title: "Account Active",
        body: `Now using ${userId}.\nUse Ctrl+Shift+Alt+1–5 to switch profiles.`,
        icon: path.join(__dirname, "icon.png")
      }).show();
    });

    userSessions[userId].on('page-title-updated', async (e, title) => {
      if (title.includes(" on GeForce NOW")) {
        userSessions[userId].maximize();
        notified = false;
      }
    });
  } else {
    userSessions[userId].focus();
  }
}

app.whenReady().then(async () => {
  discordIsRunning = await isDiscordRunning();

  createWindowForUser('Main');

  if (discordIsRunning) {
    DiscordRPC('GeForce NOW');
  }

  globalShortcut.register('Control+Shift+Alt+1', () => createWindowForUser('Main'));
  globalShortcut.register('Control+Shift+Alt+2', () => createWindowForUser('User2'));
  globalShortcut.register('Control+Shift+Alt+3', () => createWindowForUser('User3'));
  globalShortcut.register('Control+Shift+Alt+4', () => createWindowForUser('User4'));
  globalShortcut.register('Control+Shift+Alt+5', () => createWindowForUser('User5'));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindowForUser('Main');
    }
  });
});

app.on('browser-window-created', async function (e, window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);
  window.webContents.setUserAgent(userAgent);

  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    BrowserWindow.getAllWindows()[0]?.loadURL(url);
  });

  if (discordIsRunning) {
    window.on('page-title-updated', async function (e, title) {
      DiscordRPC(title);
    });
  }
});

app.on('window-all-closed', async function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
