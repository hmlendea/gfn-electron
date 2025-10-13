const { getSteamAppId } = require('../scripts/rpc');
const axios = require('axios');
const cheerio = require('cheerio');

jest.mock('axios');

test('getSteamAppId returns best match from mocked Steam search', async () => {
  // Construct a minimal HTML snippet similar to Steam search results
  const html = `
    <a data-ds-appid="123456">
      <div class="title">Test Game</div>
    </a>
    <a data-ds-appid="654321">
      <div class="title">Another Game</div>
    </a>
  `;

  axios.get.mockResolvedValue({ data: html });

  const id = await getSteamAppId('Test Game');
  expect(id).toBe('123456');
});
