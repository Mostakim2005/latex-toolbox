import fs from 'node:fs';
import process from 'node:process';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = readJson('manifest.json');
const pkg = readJson('package.json');
const versions = readJson('versions.json');
const errors = [];

if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push(`Invalid semver: ${manifest.version}`);
if (pkg.version !== manifest.version) errors.push(`package.json (${pkg.version}) != manifest.json (${manifest.version})`);
if (!versions[manifest.version]) errors.push(`versions.json missing ${manifest.version}`);
if (fs.existsSync('runtime')) errors.push('Legacy runtime/ folder still exists; src/ is the single source of truth.');
for (const asset of [
  'main.js',
  'lt-engines.chunk.js',
  'lt-builder.chunk.js',
  'lt-calculator.chunk.js',
  'lt-default-presets.json',
  'lt-stem-formula-db.json',
]) {
  if (!fs.existsSync(asset)) errors.push(`${asset} is missing; run npm run build first.`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Release verified for LaTeX Toolbox ${manifest.version}`);
