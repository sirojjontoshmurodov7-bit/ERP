// Og'ir o'qish endpointlarining kechikishi (load-seed.mjs dan keyin). Rahbar ma'lumoti scripts/.load-owner.json dan.
//   node scripts/load-bench.mjs [so'rovlar=40] [parallel=5]
import { readFileSync } from 'node:fs';

const owner = JSON.parse(readFileSync(new URL('./.load-owner.json', import.meta.url), 'utf8'));
const API = owner.api;
const TOTAL = Number(process.argv[2] ?? 40);
const CONC = Number(process.argv[3] ?? 5);
const today = new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 10);
const yearAgo = new Date(Date.parse(`${today}T00:00:00Z`) - 364 * 86_400_000).toISOString().slice(0, 10);

const s = await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login: owner.login, password: owner.password }) })).json();
const H = { authorization: `Bearer ${s.accessToken}` };

const ENDPOINTS = [
  '/debtors?limit=50',
  '/debtors?limit=50&offset=400',
  '/reports/overview',
  '/reports/branches?sort=income',
  '/reports/finance/summary',
  `/reports/finance/daily?from=${yearAgo}&to=${today}`,
  '/ratings?scope=center&limit=50',
  '/students?limit=50&q=ali',
  '/students?limit=50&offset=1000',
  '/groups?limit=200',
  '/payments?limit=50',
  '/charges?limit=50',
  '/attendance/summary',
  '/audit?limit=50',
];

const pct = (xs, p) => xs[Math.min(xs.length - 1, Math.floor((p / 100) * xs.length))];
const rows = [];
for (const path of ENDPOINTS) {
  // isitish
  for (let i = 0; i < 2; i++) {
    const r = await fetch(API + path, { headers: H });
    if (!r.ok) throw new Error(`${path}: ${r.status} ${(await r.text()).slice(0, 120)}`);
    await r.arrayBuffer();
  }
  const times = [];
  let bytes = 0;
  let next = 0;
  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: CONC }, async () => {
      while (next < TOTAL) {
        next++;
        const a = performance.now();
        const r = await fetch(API + path, { headers: H });
        bytes = (await r.arrayBuffer()).byteLength;
        if (!r.ok) throw new Error(`${path}: ${r.status}`);
        times.push(performance.now() - a);
      }
    }),
  );
  const wall = (performance.now() - t0) / 1000;
  times.sort((a, b) => a - b);
  rows.push({ endpoint: path, p50: Math.round(pct(times, 50)), p95: Math.round(pct(times, 95)), max: Math.round(times.at(-1)), rps: Math.round(TOTAL / wall), kb: Math.round(bytes / 1024) });
}
console.table(rows);
