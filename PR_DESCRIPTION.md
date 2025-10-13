## Summary

This PR adds automatic Steam App ID detection and improved Discord Rich Presence for GeForce NOW. It detects the currently-playing game by reading the GeForce NOW page title, looks up the matching Steam App ID (via Steam Store scraping), caches the mapping, and sets Discord Rich Presence so game artwork shows up in Discord when the corresponding asset is uploaded. If an artwork asset isn't present in the Discord application, the presence falls back to the `nvidia` asset.

## What changed

- **Discord Rich Presence Integration**

  - Added dynamic game detection from GeForce NOW page titles
  - Implemented Steam App ID lookup via Store search API
  - Created caching system for found Steam App IDs
  - Added fallback to NVIDIA logo when game artwork isn't available

- **Developer Experience**

  - Added `scripts/local-config.js.example` template for local Discord client ID storage
  - Improved documentation in `scripts/README.md` with setup and testing instructions
  - Created `scripts/test-steam-scraper.js` for easy testing without launching the full app

- **Assets & Resources**
  - Added 240+ game poster images in `scripts/Poster game images/` to help bootstrap Discord assets
  - Updated main README.md with links to Discord integration documentation

## How to test

1. If you want to use a persistent local client ID (recommended for dev), create and edit `scripts/local-config.js` from the template:

```javascript
// scripts/local-config.js
module.exports = { DISCORD_CLIENT_ID: '1234567890123456789' }; // keep this file local and gitignored
```

Alternatively set an environment variable before running:

```bash
DISCORD_CLIENT_ID=1234567890123456789 npm start
```

2. Start the app (or run with `--disable-rpc` to skip RPC):

```bash
npm start
```

3. Play a GeForce NOW game (or simulate page title). Logs show detection, Steam lookup, and RPC updates. Enable verbose logs with `DEBUG=true`.

4. Verify either:

   - Game-specific artwork shows in Discord (if the corresponding image has been uploaded to the Discord application's Art Assets using the Steam App ID as the asset key),
   - or the presence falls back to the `nvidia` asset if the app asset is missing.

5. Optional: run the test script to exercise multiple lookups without the UI:

```bash
node scripts/test-steam-scraper.js "Halo Infinite" "Cyberpunk 2077"
```

## Notes for maintainers

- Steam Scraping & Matching

  - Uses Cheerio to parse Steam Store search results robustly.
  - Normalizes titles (removes ™/®/©, punctuation and smart quotes) before matching.
  - Keeps a conservative scoring threshold to avoid false positives; successful matches are cached.

- Discord App Assets

  - To show artwork in Discord, upload images to your Discord application (Developer Portal → Rich Presence → Art Assets).
  - Use Steam App IDs as asset names (for example: `1240440` for Halo Infinite) so `largeImageKey` can reference them directly.

- Local client ID and safety

  - The code searches for a client ID in this order: `process.env.DISCORD_CLIENT_ID` → `scripts/local-config.js` → placeholder (`YOUR_CLIENT_ID_HERE`).
  - `scripts/local-config.js` is intentionally gitignored and is the recommended way to persist a local client ID for development.
  - Do NOT commit real client IDs to public branches.

- Dependencies
  - New runtime/dev dependencies: `axios` and `cheerio` (used for Steam scraping).

## Testing and troubleshooting

- If RPC doesn't connect, verify Discord is running and that the client ID is correct.
- Enable debug logging: `DEBUG=true DISCORD_CLIENT_ID=your_id npm start` to see Steam lookup URLs, scoring info, and cache behavior.
- The cache file location is:
  - Linux (Electron): `~/.config/GeForce NOW/game_cache.json`
  - Dev fallback: `./game_cache.json` in project root

## Origin

This work is adapted from the original Windows app: [GeForce-NOW-Rich-Presence](https://github.com/luisbrn/GeForce-NOW-Rich-Presence). I ported and improved the detection and RPC logic for this Electron project.
