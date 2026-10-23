const { app, BrowserWindow } = require('electron');

var isFullScreen = false;
var isGameStreamingScreen = false;

function getMainWindow() {
    const windows = BrowserWindow.getAllWindows();

    return windows.length > 0 ? windows[0] : null;
}

function toggleFullscreen(state) {
    var window = getMainWindow();

    if (!window || window.isDestroyed()) {
        return;
    }

    var actualState = window.isFullScreen();
    isFullScreen = actualState;

    if (actualState == state || (!state && isGameStreamingScreen)) {
        return;
    }

    window.setFullScreen(state);
    console.log("Fullscreen state changed to: " + state);

    if (state) {
        executeWindowScript(
            window,
            'if (document.readyState !== "loading" && document.body) document.body.requestPointerLock();',
            'request pointer lock');
        focusWindow();
    } else {
        executeWindowScript(window, 'document.exitPointerLock();', 'exit pointer lock');
    }
}

function toggleGameStreamingMode(state) {
    if (isGameStreamingScreen != state) {
        isGameStreamingScreen = state;
        console.log("Game streaming mode state changed to: " + state);
    }

    toggleFullscreen(isGameStreamingScreen);

    if (state) {
        focusWindow();
    }
}

function switchFullscreenState() {
    if (isFullScreen) {
        toggleFullscreen(false);
    } else {
        toggleFullscreen(true);
    }
}

function focusWindow() {
    const window = getMainWindow();

    if (window && !window.isDestroyed()) {
        window.focus();
    }
}

function executeWindowScript(window, script, operation) {
    if (!window || window.isDestroyed()) {
        return;
    }

    try {
        window.webContents.executeJavaScript(script).catch(error => {
            console.error('Failed to ' + operation + ':', error);
        });
    } catch (error) {
        console.error('Failed to ' + operation + ':', error);
    }
}

app.on('browser-window-created', async function (event, window) {
    window.on("enter-full-screen", function () {
        isFullScreen = true;
    });

    window.on("leave-full-screen", function () {
        isFullScreen = false;

        if (isGameStreamingScreen) {
            toggleFullscreen(true);
        }
    });

    window.on("enter-html-full-screen", function () {
        console.log("HTML fullscreen state changed to: true");
    });

    window.on("leave-html-full-screen", function () {
        console.log("HTML fullscreen state changed to: false");
    });

    window.on('page-title-updated', async function (event, title) {
        toggleGameStreamingMode(title.includes('on GeForce NOW'));
    });
});

function setFullscreenState(state) {
    isFullScreen = state;
}

module.exports = { toggleFullscreen, switchFullscreenState, setFullscreenState };