function DiscordRPC(title) {
    const client = require('discord-rich-presence')('963128360219869194');

    client.updatePresence({
        details: title,
        startTimestamp: Date.now(),
        largeImageKey: 'icon',
        instance: true,
    });
};

module.exports = { DiscordRPC };
