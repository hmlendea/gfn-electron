const rpc = require('../scripts/rpc');
const { requestWithBackoff } = rpc;
const axios = require('axios');

jest.mock('axios');

describe('rpc additional tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    rpc._test.setGameCache({});
  });

  test('requestWithBackoff retries then succeeds', async () => {
    const error = new Error('network');
    axios.get
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ data: '<a data-ds-appid="999"><div class="title">Retry Game</div></a>' });

    const resp = await requestWithBackoff('http://example.invalid');
    expect(resp).toBeDefined();
    expect(axios.get).toHaveBeenCalledTimes(3);
  }, 10000);

  test('getSteamAppId respects legacy string cache entries', async () => {
    rpc._test.setGameCache({ 'Legacy Game': '123321' });
    const id = await rpc.getSteamAppId('Legacy Game');
    expect(id).toBe('123321');
  });
});
