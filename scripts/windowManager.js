const { app, globalShortcut, BrowserWindow } = require('electron');

var isFullScreen = false;

function toggleFullscreen(state) {
    var actualState = BrowserWindow.getAllWindows()[0].isFullScreen();
    if (isFullScreen != state || actualState != state) {
        BrowserWindow.getAllWindows()[0].setFullScreen(state);
        isFullScreen = state;
        console.log("Fullscreen state changed to: " + state);
    }
}

function switchFullscreenState() {
    if (isFullScreen) {
        toggleFullscreen(false);
    } else {
        toggleFullscreen(true);
    }
}

app.on('browser-window-created', async function (event, window) {
    window.on("enter-screen", async function(event, window) {
        event.preventDefault();
        toggleFullscreen(true);
    });
    window.on('page-title-updated', async function (event, title) {
        var isGameStreamingScreen = title.includes('on GeForce NOW');
        toggleFullscreen(isGameStreamingScreen);
    });
});

module.exports = { toggleFullscreen, switchFullscreenState };
