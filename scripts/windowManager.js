const { app, globalShortcut, BrowserWindow } = require('electron');

var isFullScreen = false;
var isGameStreamingScreen = false;

function toggleFullscreen(state) {
    var actualState = BrowserWindow.getAllWindows()[0].isFullScreen();
    if (isFullScreen != state || actualState != state) {
        if (state || !isGameStreamingScreen) {
            BrowserWindow.getAllWindows()[0].setFullScreen(state);
            isFullScreen = state;
            console.log("Fullscreen state changed to: " + state);
        }
    }
}

function toggleGameStreamingMode(state) {
    if (isGameStreamingScreen != state) {
        isGameStreamingScreen = state;
        console.log("Game streaming mode state changed to: " + state);
    }

    toggleFullscreen(isGameStreamingScreen);
}

function switchFullscreenState() {
    if (isFullScreen) {
        toggleFullscreen(false);
    } else {
        toggleFullscreen(true);
    }
}

app.on('browser-window-created', async function (event, window) {
    window.on("enter-full-screen", async function(event, window) {
        event.preventDefault();
        toggleFullscreen(true);
    });
    window.on("leave-full-screen", async function(event, window) {
        event.preventDefault();
        if (isGameStreamingScreen) {
            toggleFullscreen(true);
        }
    });
    window.on('page-title-updated', async function (event, title) {
        toggleGameStreamingMode(title.includes('on GeForce NOW'));
    });
});

module.exports = { toggleFullscreen, switchFullscreenState };
