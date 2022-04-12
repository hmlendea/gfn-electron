const client = require('discord-rich-presence')('963128360219869194');

function DiscordRPC(title) {
    client.updatePresence({
        details: title.replace("Geforce", "GeForce"),
        startTimestamp: Date.now(),
        largeImageKey: 'icon',
        instance: true,
    });
};

module.exports = { DiscordRPC };
