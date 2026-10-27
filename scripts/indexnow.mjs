// Tells Bing (and so ChatGPT search and DuckDuckGo) which pages changed, through IndexNow. Google does not use it.
// `prepare` runs after every build (npm postbuild): it hashes each sitemap page and compares with the hashes on the live site.
// `send` runs after the deploy, once the changed pages are live. Neither step ever fails the build or the deploy.
// Unit tests: scripts/indexnow.test.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = 'https://malaysiaperfumes.com'; // same as `site` in astro.config.mjs
const KEY = '52131a0cf02723baac1086a91ed20dfd'; // served as public/<KEY>.txt
const HASHES = 'indexnow-hashes.json'; // published next to the site, so the next build can compare
const root = new URL('..', import.meta.url);
const dist = (p) => fileURLToPath(new URL(`dist/${p}`, root));
const PENDING = fileURLToPath(new URL('.astro/indexnow-pending.json', root));

/** Paths from the sitemap, e.g. /houses/emajie/ */
export const sitemapPaths = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

/** Paths whose hash is new or different; with no old hashes (first run) every path counts */
export const changed = (old, now) => Object.keys(now).filter((p) => !old || old[p] !== now[p]);

async function prepare() {
  const now = {};
  for (const p of sitemapPaths(readFileSync(dist('sitemap-0.xml'), 'utf8'))) {
    now[p] = createHash('sha1').update(readFileSync(dist(`${p.slice(1)}index.html`))).digest('hex').slice(0, 12);
  }
  writeFileSync(dist(HASHES), JSON.stringify(now));
  let old;
  try {
    const res = await fetch(`${SITE}/${HASHES}`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) old = await res.json();
    else if (res.status !== 404) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    // no answer: send nothing rather than every page, so Bing does not see a flood of unchanged URLs
    console.log(`IndexNow: could not read the live hashes (${e.message}); nothing will be sent.`);
    writeFileSync(PENDING, '[]');
    return;
  }
  const list = changed(old, now);
  writeFileSync(PENDING, JSON.stringify(list));
  console.log(`IndexNow: ${list.length} changed page(s) to send after the deploy.`);
}

async function send() {
  const list = existsSync(PENDING) ? JSON.parse(readFileSync(PENDING, 'utf8')) : [];
  if (!list.length) return console.log('IndexNow: nothing to send.');
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: list.map((p) => SITE + p) }),
      signal: AbortSignal.timeout(15000),
    });
    console.log(`IndexNow: sent ${list.length} page(s), HTTP ${res.status}.`); // 200 or 202 means accepted
  } catch (e) {
    console.log(`IndexNow: send failed (${e.message}).`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const step = process.argv[2];
  if (step === 'prepare') await prepare();
  else if (step === 'send') await send();
  else console.log('Usage: node scripts/indexnow.mjs prepare|send');
}
