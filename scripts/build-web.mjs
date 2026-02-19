import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const outDir = resolve(root, 'www');

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}

mkdirSync(outDir, { recursive: true });

const filesToCopy = [
  'index.html',
  'styles.css',
  'i18n.js',
  'app.js',
  'hex_practice_data.js'
];

for (const fileName of filesToCopy) {
  cpSync(resolve(root, fileName), resolve(outDir, fileName));
}

console.log('[build:web] Copied static files to ./www');