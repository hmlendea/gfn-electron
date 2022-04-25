const client = require('discord-rich-presence')('963128360219869194');

function DiscordRPC(title) {
    if (process.argv.includes("--disable-rpc")) return;

    let d;

    if (title.includes('on GeForce NOW')) {
        d = title;
    } else {
        d = "Home on GeForce NOW";
    };

    client.updatePresence({
        details: d,
        state: `Not affiliated with NVIDIA`,
        startTimestamp: Date.now(),
        largeImageKey: 'icon',
        instance: true,
    });
};

module.exports = { DiscordRPC };