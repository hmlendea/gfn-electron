var client;
var startTimestamp;

function DiscordRPC(title) {
    if (process.argv.includes("--disable-rpc") || process.env.GFN_DISABLE_RPC === '1') return;

    if (!client) {
        try {
            const discordClient = require('discord-rich-presence')('963128360219869194');
            discordClient.on('error', error => {
                handleClientError(discordClient, error);
            });
            client = discordClient;
        } catch (error) {
            console.log('Discord RPC initialization error:', error);
            client = null;
            return;
        }

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

function handleClientError(discordClient, error) {
    console.log('Discord RPC error:', error);

    if (client !== discordClient) {
        return;
    }

    client = null;

    try {
        discordClient.disconnect();
    } catch (disconnectError) {
        console.log('Discord RPC disconnect error:', disconnectError);
    }
}

function destroyDiscordRPC() {
    if (!client) {
        return;
    }

    const discordClient = client;
    client = null;

    try {
        discordClient.disconnect();
    } catch (_) {
    }
}

module.exports = { DiscordRPC, destroyDiscordRPC };
