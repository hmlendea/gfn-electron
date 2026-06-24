var client;
var startTimestamp;

function DiscordRPC(title) {
    if (process.argv.includes("--disable-rpc") || process.env.GFN_DISABLE_RPC === '1') return;

    if (!client) {
        client = require('discord-rich-presence')('963128360219869194');
        startTimestamp = Date.now();
    }

    let d;

    if (title.includes('on GeForce NOW')) {
        d = title;
    } else {
        d = "Home on GeForce NOW";
    }

    try {
        client.updatePresence({
            details: d,
            state: `Not affiliated with NVIDIA`,
            startTimestamp: startTimestamp,
            largeImageKey: 'icon',
            instance: true,
        });
    } catch (error) {
        console.log('Discord RPC error:', error);
    }
};

function destroyDiscordRPC() {
    if (!client) {
        return;
    }

    try {
        client.disconnect();
    } catch (_) {
    }

    client = null;
}

module.exports = { DiscordRPC, destroyDiscordRPC };