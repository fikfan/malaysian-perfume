// Checks every outside link in the data: product photos, source pages, brand websites and shop links.
// Run with `npm run links`. Exits with code 1 when a link is broken, so it can gate a deploy.
// Needs the network, so it is not part of `npm run build`.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CONCURRENCY = 8;
const TIMEOUT_MS = 15000;
// Sites that refuse scripts but work in a browser: report them, but do not fail on them
const BOT_WALLS = [401, 403, 429, 999];

const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const files = (dir) => readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));

// Collect [url, where] pairs; one url can appear in many places
const links = new Map();
const add = (url, where) => { if (url) links.set(url, [...(links.get(url) ?? []), where]); };

for (const f of files(join(ROOT, 'src/content/houses'))) {
  const h = json(f), id = f.split('/').pop().replace('.json', '');
  for (const k of ['website', 'shopee', 'lazada']) add(h[k], `house ${id} ${k}`);
  for (const s of h.sources ?? []) add(s, `house ${id} source`);
}
for (const f of files(join(ROOT, 'src/content/perfumes'))) {
  const p = json(f), id = f.split('/content/perfumes/')[1].replace('.json', '');
  add(p.image, `${id} image`);
  add(p.source, `${id} source`);
}
for (const l of json(join(ROOT, 'src/data/profile.json')).links) add(l.href, `profile ${l.label}`);

async function check(url) {
  const opts = { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'Mozilla/5.0 (link check; malaysianperfumes.com)' } };
  try {
    // HEAD first (no download); some servers refuse or mishandle HEAD, so confirm a failure with GET
    let r = await fetch(url, { ...opts, method: 'HEAD' });
    if (!r.ok) { r = await fetch(url, { ...opts, method: 'GET' }); await r.body?.cancel(); }
    return r.status;
  } catch (e) {
    return e.name === 'TimeoutError' ? 'timeout' : (e.cause?.code ?? e.message);
  }
}

const urls = [...links.keys()];
const results = new Map();
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < urls.length) { const u = urls[next++]; results.set(u, await check(u)); }
}));

const broken = [], walled = [];
for (const [u, s] of results) {
  if (typeof s === 'number' && s < 400) continue;
  (BOT_WALLS.includes(s) ? walled : broken).push([u, s]);
}
const show = ([u, s]) => `  ${s}  ${u}\n        used by: ${links.get(u).slice(0, 3).join(', ')}${links.get(u).length > 3 ? ` (+${links.get(u).length - 3})` : ''}`;

console.log(`Checked ${urls.length} links.`);
if (walled.length) console.log(`\n${walled.length} blocked automatic checks (open them in a browser to confirm):\n${walled.map(show).join('\n')}`);
if (broken.length) console.log(`\n${broken.length} broken:\n${broken.map(show).join('\n')}`);
else console.log('No broken links.');
process.exit(broken.length ? 1 : 0);
