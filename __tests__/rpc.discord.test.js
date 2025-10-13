const rpc = require('../scripts/rpc');

describe('DiscordRPC presence behavior', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    rpc._test.setGameCache({});
    rpc._test.setClient(null);
    // mark as already initialized so initializeRPC is a no-op during tests
    rpc._test.setInitialized(true);
  });

  test('uses numeric Steam ID for largeImageKey when available', async () => {
    const fakeClient = { updatePresence: jest.fn() };
    rpc._test.setClient(fakeClient);
  // seed cache with legacy string numeric steam id
  rpc._test.setGameCache({ 'Some Game': '123456' });
    await rpc.DiscordRPC('Some Game on GeForce NOW');
    expect(fakeClient.updatePresence).toHaveBeenCalled();
    const args = fakeClient.updatePresence.mock.calls[0][0];
    expect(args.largeImageKey).toBe('123456');
  });

  test('falls back to nvidia image when no numeric steam id', async () => {
    const fakeClient = { updatePresence: jest.fn() };
    rpc._test.setClient(fakeClient);
  // seed cache with non-numeric legacy string
  rpc._test.setGameCache({ 'Other Game': 'unknown' });
    await rpc.DiscordRPC('Other Game on GeForce NOW');
    expect(fakeClient.updatePresence).toHaveBeenCalled();
    const args = fakeClient.updatePresence.mock.calls[0][0];
    expect(args.largeImageKey).toBe('nvidia');
  });
});
