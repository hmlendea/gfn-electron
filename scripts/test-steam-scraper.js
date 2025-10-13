#!/usr/bin/env node

/**
 * Test script for Steam App ID detection
 * Usage: node scripts/test-steam-scraper.js [game names...]
 * Example: node scripts/test-steam-scraper.js "Halo Infinite" "Call of Duty" "Cyberpunk 2077"
 */

// Enable debug logging
process.env.DEBUG = 'true';
// Disable RPC for tests to avoid requiring the system Discord client
process.env.DISABLE_RPC = 'true';

// Load the RPC module (it will skip initializing RPC when DISABLE_RPC is set)
const { DiscordRPC } = require('./rpc.js');

// Test game names
const defaultTestGames = [
  'Halo Infinite',
  'Call of Duty®',
  'Cyberpunk 2077',
  'The Witcher 3: Wild Hunt',
  'Fortnite',
  'Apex Legends',
  'Counter-Strike 2',
  'Destiny 2',
  'Grand Theft Auto V',
  'Red Dead Redemption 2',
];

async function testSteamScraper(gameNames = defaultTestGames) {
  console.log('🔍 Testing Steam App ID detection\n');

  // Use command line arguments if provided, otherwise use defaults
  const testNames = process.argv.slice(2).length > 0 ? process.argv.slice(2) : gameNames;

  console.log(`Testing ${testNames.length} games:\n`);

  for (const gameName of testNames) {
    console.log(`\n📋 Testing: "${gameName}"`);
    console.log('─'.repeat(50));

    try {
      // Test the full DiscordRPC flow
      await DiscordRPC(`${gameName} on GeForce NOW`);
      console.log('✅ Test completed\n');
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}\n`);
    }
  }

  console.log('\n🏁 All tests completed!');

  // Show cache file location
  const fs = require('fs');
  const path = require('path');

  const possibleCachePaths = [
    path.join(process.env.HOME, '.config', 'GeForce NOW', 'game_cache.json'),
    path.join(__dirname, '..', 'game_cache.json'),
  ];

  console.log('\n📁 Cache file locations:');
  for (const cachePath of possibleCachePaths) {
    if (fs.existsSync(cachePath)) {
      console.log(`✅ Found: ${cachePath}`);
      try {
        const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        console.log(`   Entries: ${Object.keys(cache).length}`);
      } catch (e) {
        console.log('   (unable to read)');
      }
    } else {
      console.log(`❌ Not found: ${cachePath}`);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSteamScraper().catch(console.error);
}

module.exports = { testSteamScraper };
