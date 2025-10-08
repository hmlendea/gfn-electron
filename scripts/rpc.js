const axios = require('axios');
const fs = require('fs');
const path = require('path');

let client;
let gameCache = {};
let isInitialized = false;

function getCacheFilePath() {
  try { const { app } = require('electron'); return path.join(app.getPath('userData'), 'game_cache.json'); }
  catch (e) { return path.join(__dirname, '..', 'game_cache.json'); }
}

const CACHE_FILE = getCacheFilePath();

function initializeRPC() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      gameCache = JSON.parse(data);
    }
  } catch (e) { gameCache = {}; }
  if (!client) client = require('discord-rich-presence')('YOUR_CLIENT_ID_HERE');
  isInitialized = true;
}

function saveGameCache() { try { fs.writeFileSync(CACHE_FILE, JSON.stringify(gameCache, null, 2)); } catch (e) { console.error('Error saving cache', e); } }

async function getSteamAppId(gameName) {
  try {
    const url = `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}&category1=998`;
    const resp = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    const appIdRegex = /data-ds-appid="(\d+)"/g;
    const titleRegex = /<span class="title">([^<]+)<\/span>/g;
    let match; const appIds = []; while ((match = appIdRegex.exec(resp.data)) !== null) appIds.push(match[1]);
    const titles = []; while ((match = titleRegex.exec(resp.data)) !== null) titles.push(match[1].trim());
    const results = []; for (let i = 0; i < Math.min(appIds.length, titles.length); i++) results.push({ appId: appIds[i], title: titles[i] });
    if (results.length === 0) return null;
    let best = null; let bestScore = 0;
    for (const r of results) {
      let score = 0; const rt = r.title.toLowerCase(); const sn = gameName.toLowerCase();
      if (rt === sn) score = 100; else if (rt.includes(sn)) score = 75; else if (sn.includes(rt)) score = 50; else {
        const sw = sn.split(/\s+/); const tw = rt.split(/\s+/); const common = sw.filter(w => tw.includes(w)); score = (common.length / sw.length) * 25;
      }
      if (score > bestScore) { best = r; bestScore = score; }
    }
    if (best && bestScore >= 25) { gameCache[gameName] = best.appId; saveGameCache(); return best.appId; }
    return null;
  } catch (e) { console.error('Steam lookup error', e && e.message ? e.message : e); return null; }
}

function extractGameName(title) { if (!title || !title.includes('on GeForce NOW')) return null; return title.replace(/\s+on GeForce NOW$/i, '').trim() || null; }

async function DiscordRPC(title) {
  if (process.argv.includes('--disable-rpc')) return;
  initializeRPC();
  console.log('\n=== PAGE TITLE UPDATE ==='); console.log(`Page title detected: "${title}"`);
  const gameName = extractGameName(title); console.log(`Extracted game name: "${gameName}"`);
  const details = gameName ? title : 'Home on GeForce NOW'; let steamId = null;
  if (gameName) { if (gameCache[gameName]) steamId = gameCache[gameName]; else steamId = await getSteamAppId(gameName); }
  try {
    if (steamId && /^\d{6,7}$/.test(steamId)) {
      client.updatePresence({ details, state: 'Not affiliated with NVIDIA', startTimestamp: Date.now(), largeImageKey: steamId, instance: true });
      console.log(`Discord RPC: Successfully using Steam ID ${steamId}`);
    } else {
      client.updatePresence({ details, state: 'Not affiliated with NVIDIA', startTimestamp: Date.now(), largeImageKey: 'nvidia', instance: true });
      console.log('Discord RPC: Using nvidia icon');
    }
  } catch (err) { console.error('Discord RPC error:', err && err.message ? err.message : err); }
}

module.exports = { DiscordRPC };