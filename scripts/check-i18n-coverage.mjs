import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const i18nPath = resolve(root, 'i18n.js');
const source = readFileSync(i18nPath, 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const data = sandbox.window.GUI_I18N;
if (!data || !data.packs || !data.packs.en) {
  console.error('[i18n:check] Failed to load GUI_I18N from i18n.js');
  process.exit(1);
}

const base = data.packs.en;
const baseKeys = Object.keys(base);
const report = [];

for (const locale of data.locales || []) {
  const pack = data.packs[locale] || {};
  const missing = baseKeys.filter((key) => !(key in pack));
  report.push({ locale, total: baseKeys.length, missing: missing.length });
}

console.log('[i18n:check] Key coverage against en baseline');
for (const row of report) {
  const pct = Math.round(((row.total - row.missing) / row.total) * 100);
  console.log(`- ${row.locale}: ${pct}% (${row.total - row.missing}/${row.total})`);
}

const hasCritical = report.some((row) => row.missing > 0);
if (hasCritical) {
  console.log('[i18n:check] Note: Missing keys fall back to English by design.');
}