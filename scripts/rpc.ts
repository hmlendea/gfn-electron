import discordRPC from 'discord-rich-presence';

let client: any;

export function DiscordRPC(title: string) {
    if (process.argv.includes("--disable-rpc")) return;

    if (!client) {
        client = discordRPC('963128360219869194');
    }

    let d: string = title.includes('on GeForce NOW') ? title : "Home on GeForce NOW";

    client.updatePresence({
        details: d,
        state: `Not affiliated with NVIDIA`,
        startTimestamp: Date.now(),
        largeImageKey: 'icon',
        instance: true,
    });
};