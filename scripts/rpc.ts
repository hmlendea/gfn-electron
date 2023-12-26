import rpc from 'discord-rpc';

const clientId = '963128360219869194';

rpc.register(clientId);

const rpcclient = new rpc.Client({ transport: 'ipc' });

export async function DiscordRPC(title: string) {
    if (process.argv.includes("--disable-rpc")) return;


    rpcclient.setActivity({
        details: title,
        state: 'Playing',
        startTimestamp: new Date(),
        largeImageKey: 'icon',
        instance: true,
    });
}
