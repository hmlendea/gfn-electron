# Discord Rich Presence for GeForce NOW

<img width="279" height="119" alt="Screenshot from 2025-10-07 12-48-39" src="https://github.com/user-attachments/assets/4a427f51-c07c-4ea2-aa89-3c0a52780529" />
<img width="279" height="119" alt="Screenshot from 2025-10-07 12-48-22" src="https://github.com/user-attachments/assets/32e11b33-3e52-4a5c-8c8f-ea5186c8c805" />
<img width="279" height="119" alt="Screenshot from 2025-10-07 12-48-12" src="https://github.com/user-attachments/assets/e80a6b68-00e2-449c-8c0e-0f0318547bf5" />

This folder contains the Discord Rich Presence integration for GeForce NOW, providing automatic game detection and dynamic artwork display.

## Features

- **Automatic Game Detection**: Extracts game names from GeForce NOW page titles
- **Steam Integration**: Automatically finds Steam App IDs for accurate game matching
- **Dynamic Artwork**: Shows game-specific artwork in Discord when available
- **Intelligent Caching**: Stores Steam ID mappings for faster subsequent launches
- **Robust Fallback**: Uses NVIDIA icon when game artwork isn't available
- **Debug Logging**: Comprehensive logging for development and troubleshooting

## Files

- **`rpc.js`**: Main Discord RPC integration with Steam scraping
- **`test-steam-scraper.js`**: Test script for validating Steam App ID detection
- **`Poster game images/`**: Collection of 240+ game poster images for Discord assets

## Development Setup

### Discord Application Configuration

1. Create a Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Go to your application's "General Information" page
3. Copy the "Application ID" (this is your client ID)
4. Set the client ID as an environment variable:

```bash
DISCORD_CLIENT_ID=1234567890123456789 npm start
```

**Important**: Never commit your real client ID to the repository. The code uses `YOUR_CLIENT_ID_HERE` as a placeholder.

### Persistent Client ID Setup (Recommended)

Instead of setting the environment variable each time, you can store your Discord client ID in a local, gitignored file:

1. Create a copy of the example config file:

```bash
cp scripts/local-config.js.example scripts/local-config.js
```

2. Edit the `scripts/local-config.js` file (this file is in .gitignore):

```javascript
// scripts/local-config.js - this file is gitignored and won't be committed
module.exports = {
  DISCORD_CLIENT_ID: '1234567890123456789', // Replace with your actual Discord client ID
};
```

3. Run the app normally:

```bash
npm start
```

The app will automatically:

- Look for environment variable `DISCORD_CLIENT_ID`
- If not found, try to load from `scripts/local-config.js`
- If neither is available, fall back to the placeholder (`YOUR_CLIENT_ID_HERE`)

This approach is the most convenient for development and keeps your client ID out of the repository.

### Discord Asset Setup

To display game artwork in Discord Rich Presence:

1. Go to your Discord application in the Developer Portal
2. Navigate to "Rich Presence" → "Art Assets"
3. Upload game images using Steam App IDs as asset names (e.g., `1240440` for Halo Infinite)
4. Use the provided poster images in `Poster game images/` folder to quickly bootstrap common games

### Game Cache

The system automatically caches Steam App ID mappings for performance:

**Cache Location:**

- **Linux**: `~/.config/GeForce NOW/game_cache.json`
- **Development fallback**: `./game_cache.json` (project root)

**View Cache Contents:**

```bash
cat ~/.config/"GeForce NOW"/game_cache.json
```

**Example Cache Structure:**

```json
{
  "Call of Duty®": "1938090",
  "Battlefield™ 2042": "1517290",
  "DEATH STRANDING": "1850570",
  "Halo Infinite": "1240440"
}
```

## Usage Options

### Basic Usage

```bash
DISCORD_CLIENT_ID=your_client_id npm start
```

### Debug Mode

Enable verbose logging to see detailed information about game detection, Steam searches, and RPC updates:

```bash
DEBUG=true DISCORD_CLIENT_ID=your_client_id npm start
```

**Debug Output Includes:**

- Cache file path resolution
- Steam search results and scoring
- Discord RPC client initialization
- Game name extraction and matching
- Steam App ID lookup process

### Disable Discord RPC

Run without Discord integration:

```bash
npm start -- --disable-rpc
```

## Testing

### Steam Scraper Test

Test the Steam App ID detection system:

```bash
# Test specific games
node scripts/test-steam-scraper.js "Halo Infinite" "Cyberpunk 2077"

# Test with default game list
node scripts/test-steam-scraper.js
```

### Manual Testing

Test a single game detection:

```bash
DEBUG=true node -e "
const { DiscordRPC } = require('./scripts/rpc.js');
DiscordRPC('Halo Infinite on GeForce NOW').then(() => console.log('Done'));
"
```

## How It Works

### Game Detection Process

1. **Title Extraction**: Monitors GeForce NOW page title changes
2. **Game Name Parsing**: Extracts game name from "Game Name on GeForce NOW" format
3. **Steam Lookup**: Searches Steam Store for matching games
4. **Smart Matching**: Uses multiple scoring algorithms:
   - Exact match (100 points)
   - Partial containment (85/70 points)
   - Word overlap analysis (up to 50 points)
5. **Text Normalization**: Strips trademark symbols (™®©), punctuation, and smart quotes
6. **Caching**: Stores successful matches for future use
7. **Discord Update**: Updates Rich Presence with game artwork or fallback

### Steam Scraping Details

The system uses **Cheerio** for robust HTML parsing instead of fragile regex patterns:

- Fetches Steam Store search results
- Extracts `data-ds-appid` and game titles using DOM parsing
- Applies normalized text matching with configurable thresholds
- Handles special characters and international titles
- Includes comprehensive error handling and timeouts

### Rich Presence Behavior

- **With Game Artwork**: Shows Steam App ID as `largeImageKey` when asset exists in Discord app
- **Fallback Mode**: Uses `nvidia` asset when game artwork isn't uploaded
- **Status Details**: Displays full GeForce NOW title (e.g., "Halo Infinite on GeForce NOW")
- **State Message**: "Not affiliated with NVIDIA" disclaimer
- **Timestamp**: Shows session start time

## Dependencies

- **`axios`**: HTTP client for Steam Store requests
- **`cheerio`**: Server-side jQuery for HTML parsing
- **`discord-rich-presence`**: Discord RPC client library

## Configuration Options

### Environment Variables

| Variable            | Description                   | Default               |
| ------------------- | ----------------------------- | --------------------- |
| `DISCORD_CLIENT_ID` | Discord application client ID | `YOUR_CLIENT_ID_HERE` |
| `DEBUG`             | Enable verbose logging        | `false`               |

### Command Line Arguments

| Argument        | Description                   |
| --------------- | ----------------------------- |
| `--disable-rpc` | Disable Discord Rich Presence |

## Troubleshooting

### Common Issues

**Discord client not connecting:**

- Ensure Discord is running
- Verify client ID is correct
- Check Discord Developer Portal application status

**Games not detected:**

- Enable debug mode: `DEBUG=true`
- Check game name extraction in logs
- Verify Steam Store accessibility
- Review matching scores in debug output

**Cache issues:**

- Clear cache: `rm ~/.config/"GeForce NOW"/game_cache.json`
- Check cache permissions and path access
- Verify Electron userData directory exists

**Steam scraping failures:**

- Check network connectivity to store.steampowered.com
- Verify User-Agent header acceptance
- Review timeout settings (default: 15 seconds)

### Debug Information

Enable debug logging to see:

```
Cache file resolution and loading
Steam search URLs and responses
Game name normalization process
Matching scores for each candidate
Discord RPC client status
Rich Presence update results
```

## Performance Notes

- **Caching**: First lookup per game may take 2-5 seconds; subsequent launches are instant
- **Rate Limiting**: No explicit rate limiting on Steam requests (use responsibly)
- **Memory Usage**: Minimal; cache file typically <1KB for 50+ games
- **Network**: Only makes requests for uncached games

## Credits

This implementation is based on the original Windows app: [GeForce-NOW-Rich-Presence](https://github.com/luisbrn/GeForce-NOW-Rich-Presence)
