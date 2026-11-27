// Tarjima tekshiruvi: kodda t('...') bilan chaqirilgan, lekin ruscha lug'atda (src/lib/i18n-ru.ts) yo'q kalitlar.
//   node scripts/i18n-check.mjs          yetishmaganlar ro'yxati (bo'lsa exit 1)
//   node scripts/i18n-check.mjs --unused qo'shimcha: lug'atda bor, kodda ishlatilmaydiganlar
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|ts)$/.test(f) && !/^(i18n-(ru|en)|translit)/.test(f)) files.push(p);
  }
})(root);

const unescape = (s) => s.replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n');
const used = new Map();
const call = /\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\$]|\\.)*)`)/g;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(call)) {
    const key = unescape(m[1] ?? m[2] ?? m[3]);
    if (!used.has(key)) used.set(key, f.slice(root.length));
  }
}

const dict = readFileSync(join(root, 'lib', 'i18n-ru.ts'), 'utf8');
const keys = new Set();
for (const m of dict.matchAll(/^\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*:/gm)) keys.add(unescape(m[1] ?? m[2]));

const missing = [...used].filter(([k]) => !keys.has(k));
for (const [k, f] of missing) console.log(`${f}\t${JSON.stringify(k)}`);
console.log(`\nKalitlar: kodda ${used.size}, lug'atda ${keys.size}, yetishmaydi ${missing.length}`);
if (process.argv.includes('--unused')) {
  const unused = [...keys].filter((k) => !used.has(k));
  console.log(`Ishlatilmaydi (${unused.length}):`, unused.slice(0, 50));
}
process.exit(missing.length ? 1 : 0);
