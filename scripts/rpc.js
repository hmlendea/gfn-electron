const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

let client;
let gameCache = {};
let isInitialized = false;
// Time-to-live for cache entries in milliseconds (default: 30 days)
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
// Backoff configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

// Debug logging flag - set DEBUG=true in environment for verbose logs
const DEBUG = process.env.DEBUG === 'true';

function log(level, ...args) {
  if (level === 'debug' && !DEBUG) return;
  console[level](...args);
}

function getCacheFilePath() {
  try { 
    const { app } = require('electron'); 
    const cachePath = path.join(app.getPath('userData'), 'game_cache.json');
    log('debug', `Using Electron userData cache: ${cachePath}`);
    return cachePath;
  } catch (e) { 
    const cachePath = path.join(__dirname, '..', 'game_cache.json');
    log('debug', `Using fallback cache path: ${cachePath}`);
    return cachePath;
  }
}

const CACHE_FILE = getCacheFilePath();

function initializeRPC() {
  if (isInitialized) return;
  // Honor environment variable to disable RPC entirely
  if (process.env.DISABLE_RPC === 'true' || process.env.DISABLE_RPC === '1') {
    log('info', 'Discord RPC disabled via DISABLE_RPC environment variable');
    isInitialized = true;
    client = null;
    return;
  }
  // Honor local-config.js persistent disable flag if present
  try {
    const localConfig = require('./local-config.js');
    if (localConfig && localConfig.DISABLE_RPC) {
      log('info', 'Discord RPC disabled via scripts/local-config.js');
      isInitialized = true;
      client = null;
      return;
    }
  } catch (e) {
    // ignore missing local-config
  }
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      gameCache = JSON.parse(data);
      log('debug', `Loaded ${Object.keys(gameCache).length} cached games`);
    } else {
      // Fallback: try to load a pre-populated common cache shipped with the app
      const fallback = path.join(__dirname, 'game_cache_common.json');
      if (fs.existsSync(fallback)) {
        try {
          const fallbackData = fs.readFileSync(fallback, 'utf8');
          const common = JSON.parse(fallbackData);
          gameCache = Object.assign({}, common);
          log('debug', `Loaded ${Object.keys(common).length} common cached games as fallback`);
        } catch (err) {
          log('debug', 'Failed to load fallback common cache:', err && err.message ? err.message : err);
        }
      }
    }
  } catch (e) { 
    log('warn', 'Failed to load game cache:', e.message);
    gameCache = {}; 
  }
  
  if (!client) {
    // Try environment variable first, then local-config.js (development), then placeholder
    let localConfig = {};
    try { localConfig = require('./local-config.js') || {}; } catch (e) { /* ignore missing local config */ }
    const clientId = process.env.DISCORD_CLIENT_ID || localConfig.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
    if (clientId === 'YOUR_CLIENT_ID_HERE') {
      log('warn', 'Discord client ID not configured. Set DISCORD_CLIENT_ID environment variable or edit scripts/local-config.js');
      log('info', 'Example: DISCORD_CLIENT_ID=1234567890123456789 npm start');
    }
    try {
      client = require('discord-rich-presence')(clientId);
      log('debug', 'Discord RPC client initialized');
      // Avoid uncaught errors from the underlying transport
      try {
        if (client && typeof client.on === 'function') {
          client.on('error', (err) => log('warn', 'Discord RPC client error:', err && err.message ? err.message : err));
        }
      } catch (e) {
        log('debug', 'Failed to attach error handler to Discord RPC client:', e && e.message ? e.message : e);
      }
    } catch (e) {
      log('error', 'Failed to initialize Discord RPC client:', e.message);
      client = null;
    }
  }
  isInitialized = true;
}

function saveGameCache() { 
  try { 
    fs.writeFileSync(CACHE_FILE, JSON.stringify(gameCache, null, 2)); 
    log('debug', 'Game cache saved successfully');
  } catch (e) { 
    log('error', 'Error saving cache:', e.message); 
  } 
}

function isCacheEntryValid(entryTimestamp) {
  if (!entryTimestamp) return false;
  return (Date.now() - entryTimestamp) <= CACHE_TTL_MS;
}

function normalizeText(text) {
  return text
    .replace(/[™®©]/g, '') // Remove trademark symbols
    .replace(/[''""]/g, '') // Remove smart quotes
    .replace(/[^\w\s]/g, '') // Remove other punctuation
    .toLowerCase()
    .trim();
}

async function requestWithBackoff(url, opts = {}, retries = 0) {
  try {
    return await axios.get(url, opts);
  } catch (err) {
    if (retries >= MAX_RETRIES) throw err;
    const backoff = INITIAL_BACKOFF_MS * Math.pow(2, retries);
    log('debug', `Request failed, retrying in ${backoff}ms (attempt ${retries + 1})`);
    await new Promise(r => setTimeout(r, backoff));
    return requestWithBackoff(url, opts, retries + 1);
  }
}

async function getSteamAppId(gameName) {
  try {
    // Use cache if present and valid
    const cached = gameCache[gameName];
    if (cached && typeof cached === 'object') {
      if (isCacheEntryValid(cached.ts)) {
        log('debug', `Using TTL-valid cached Steam ID for ${gameName}: ${cached.id}`);
        return cached.id;
      }
    } else if (cached && typeof cached === 'string') {
      // legacy simple string cache entry
      log('debug', `Using legacy cached Steam ID for ${gameName}: ${cached}`);
      return cached;
    }

    const url = `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}&category1=998`;
    log('debug', `Searching Steam for: "${gameName}"`);

    const resp = await requestWithBackoff(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GFN-Electron)' }, timeout: 15000 });

    const $ = cheerio.load(resp.data);
    const results = [];

    $('a[data-ds-appid]').each((i, element) => {
      const appId = $(element).attr('data-ds-appid');
      const titleElement = $(element).find('.title');
      const title = titleElement.text().trim();
      if (appId && title) results.push({ appId, title });
    });

    log('debug', `Found ${results.length} Steam results`);
    if (results.length === 0) return null;

    let best = null;
    let bestScore = 0;
    const normalizedSearch = normalizeText(gameName);

    for (const result of results) {
      let score = 0;
      const normalizedTitle = normalizeText(result.title);
      if (normalizedTitle === normalizedSearch) score = 100;
      else if (normalizedTitle.includes(normalizedSearch)) score = 85;
      else if (normalizedSearch.includes(normalizedTitle)) score = 70;
      else {
        const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 2);
        const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2);
        const commonWords = searchWords.filter(w => titleWords.includes(w));
        if (searchWords.length > 0) score = (commonWords.length / searchWords.length) * 50;
      }
      log('debug', `"${result.title}" -> score: ${score.toFixed(1)}`);
      if (score > bestScore) { best = result; bestScore = score; }
    }

    if (best && bestScore >= 25) {
      log('info', `Steam ID found: "${gameName}" -> ${best.appId} (${best.title}, score: ${bestScore.toFixed(1)})`);
      gameCache[gameName] = { id: best.appId, ts: Date.now() };
      saveGameCache();
      return best.appId;
    }

    log('warn', `No suitable Steam match found for: "${gameName}" (best score: ${bestScore.toFixed(1)})`);
    return null;
  } catch (e) {
    log('error', 'Steam lookup error:', e && e.message ? e.message : e);
    return null;
  }
}

function extractGameName(title) { if (!title || !title.includes('on GeForce NOW')) return null; return title.replace(/\s+on GeForce NOW$/i, '').trim() || null; }

async function DiscordRPC(title) {
  if (process.argv.includes('--disable-rpc')) {
    log('debug', 'Discord RPC disabled via --disable-rpc flag');
    return;
  }
  
  initializeRPC();
  
  log('info', '\n=== PAGE TITLE UPDATE ===');
  log('info', `Page title detected: "${title}"`);
  
  const gameName = extractGameName(title);
  log('info', `Extracted game name: "${gameName}"`);
  
  const details = gameName ? title : 'Home on GeForce NOW';
  let steamId = null;
  
  if (gameName) {
    if (gameCache[gameName]) {
      steamId = gameCache[gameName];
      log('debug', `Using cached Steam ID: ${steamId}`);
    } else {
      steamId = await getSteamAppId(gameName);
    }
  }
  
  // Guard against missing Discord RPC client
  if (!client) {
    log('warn', 'Discord RPC client not initialized - skipping presence update');
    return;
  }
  
  try {
    const presenceData = {
      details,
      state: 'Not affiliated with NVIDIA',
      startTimestamp: Date.now(),
      instance: true
    };
    
    if (steamId && /^\d{6,7}$/.test(steamId)) {
      presenceData.largeImageKey = steamId;
      client.updatePresence(presenceData);
      log('info', `Discord RPC: Successfully using Steam ID ${steamId} for artwork`);
    } else {
      presenceData.largeImageKey = 'nvidia';
      client.updatePresence(presenceData);
      log('info', 'Discord RPC: Using nvidia fallback icon');
    }
  } catch (err) { 
    log('error', 'Discord RPC update failed:', err.message);
    log('debug', 'Full error:', err);
  }
}

module.exports = { DiscordRPC };