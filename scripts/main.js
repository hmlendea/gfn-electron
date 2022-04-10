const { app, globalShortcut, BrowserWindow } = require("electron");
const path = require("path");

var userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36"; // Linux
var isFullScreen = false;

if (process.argv.indexOf('--spoof-chromeos')) {
  userAgent = "Mozilla/5.0 (X11; CrOS x86_64 14469.41.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.57 Safari/537.36" // ChromeOS
  app.commandLine.appendSwitch("disable-features", "UserAgentClientHint");
}

if (process.argv.indexOf('--spoof-windows')) {
  userAgent = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.7113.93 Safari/537.36" // Windows
  app.commandLine.appendSwitch("disable-features", "UserAgentClientHint");
}

console.log('Using user agent: ' + userAgent);

app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder");

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      nativeWindowOpen: false,
      userAgent: userAgent
    },
  });

  mainWindow.loadURL("https://play.geforcenow.com");

  /*
  uncomment this to debug any errors with loading GFN landing page

  mainWindow.webContents.on("will-navigate", (event, url) => {
    console.log("will-navigate", url);
    event.preventDefault();
  });
  */
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
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

app.on("browser-window-created", function (e, window) {
  window.setBackgroundColor("#1A1D1F");
  window.setMenu(null);

  window.webContents.setUserAgent(userAgent);

  window.on("leave-full-screen", function (e, win) {
    if (isFullScreen) {
      BrowserWindow.getAllWindows()[0].setFullScreen(true);
    }
  });

  window.on("page-title-updated", function (e, title) {
    if (title.includes("on GeForce NOW")) {
      window.setFullScreen(true);
      isFullScreen = true;
    } else {
      window.setFullScreen(false);
      isFullScreen = false;
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
