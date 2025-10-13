#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
  } catch (e) {
    return '';
  }
}

// Usage: node scripts/gen_changelog.js [--out=path] [--base=ref]
const args = process.argv.slice(2);
const outArg = args.find(a => a.startsWith('--out='));
const baseArg = args.find(a => a.startsWith('--base='));
const outPath = outArg ? outArg.split('=')[1] : null;
const baseRef = baseArg ? baseArg.split('=')[1] : 'origin/main';

console.log(`Generating changelog against base: ${baseRef}`);

// Ensure remote refs are up to date
run('git fetch --all --prune');

let range = '';
try {
  // if baseRef exists, use baseRef..HEAD
  const showBase = run(`git rev-parse --verify ${baseRef}`);
  if (showBase) range = `${baseRef}..HEAD`;
} catch (e) {
  // fallback to last tag
  const lastTag = run('git describe --tags --abbrev=0 2>/dev/null');
  if (lastTag) range = `${lastTag}..HEAD`;
}

if (!range) range = 'HEAD';

const commits = run(`git log ${range} --pretty=format:"- %s (%h)" --no-merges`);

const header = `# Changelog\n\n## Unreleased\n\n`;
const output = commits ? header + commits + '\n' : header + '- No changes found\n';

if (outPath) {
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`Changelog written to ${outPath}`);
} else {
  console.log('\n' + output);
}
