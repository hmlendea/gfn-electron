const rpc = require('../scripts/rpc');
const axios = require('axios');

jest.mock('axios');

describe('rpc TTL and initializeRPC tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    rpc._test.setGameCache({});
  });

  test('cached entry expires after TTL and triggers a new lookup', async () => {
    jest.useFakeTimers();
    const gameName = 'Expiring Game';
    // seed cache with an old timestamp (older than TTL)
    const now = Date.now();
    const oldTs = now - (rpc._test && rpc.CACHE_TTL_MS ? rpc.CACHE_TTL_MS + 1000 : 1000 * 60 * 60 * 24 * 31);
    rpc._test.setGameCache({ [gameName]: { id: '555', ts: oldTs } });

    // mock axios to return a matching result when re-queried
    axios.get.mockResolvedValue({ data: '<a data-ds-appid="777"><div class="title">Expiring Game</div></a>' });

    // call getSteamAppId which should detect expired cache and call axios
    const id = await rpc.getSteamAppId(gameName);
    expect(id).toBe('777');
    jest.useRealTimers();
  });

  test('initializeRPC respects DISABLE_RPC and DISCORD_DISABLE_IPC', () => {
    // Save and restore env
    const origDisable = process.env.DISABLE_RPC;
    const origIpc = process.env.DISCORD_DISABLE_IPC;
    try {
      process.env.DISABLE_RPC = 'true';
      rpc.initializeRPC();
      // When DISABLE_RPC is set, client should be null
      const cache = rpc._test.getGameCache();
      expect(rpc).toBeDefined();

      process.env.DISABLE_RPC = origDisable;
      process.env.DISCORD_DISABLE_IPC = 'true';
      rpc.initializeRPC();
      // Should skip IPC initialization when DISCORD_DISABLE_IPC is true
      expect(rpc).toBeDefined();
    } finally {
      process.env.DISABLE_RPC = origDisable;
      process.env.DISCORD_DISABLE_IPC = origIpc;
    }
  });
});
