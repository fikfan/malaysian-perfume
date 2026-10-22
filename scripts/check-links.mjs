// Checks every outside link in the data: product photos, source pages, brand websites and shop links.
// Run with `npm run links`. Exits with code 1 when a link is broken, so it can gate a deploy.
// Needs the network, so it is not part of `npm run build`. Unit tests: scripts/check-links.test.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONCURRENCY = 8;
const TIMEOUT_MS = 15000;
// The data has under 1000 links; far more means a bad pull request, which would keep the CI runner busy for hours
export const MAX_LINKS = 3000;
// Answers that mean "this server will not talk to a script" (bot protection, rate limits, LinkedIn's 999),
// and network hiccups. Common from CI data centres; the link usually works in a browser, so report, do not fail.
export const BOT_WALLS = [401, 403, 406, 429, 999];
const FLAKY = ['timeout', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'UND_ERR_SOCKET'];

const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const files = (dir) => readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));

/** Every outside link in the data, as url → list of places that use it */
export function collectLinks(root) {
  const links = new Map();
  // https only, like the schema: never fetch http:, data: or other schemes from CI
  const add = (url, where) => { if (/^https:\/\//i.test(url ?? '')) links.set(url, [...(links.get(url) ?? []), where]); };
  for (const f of files(join(root, 'src/content/houses'))) {
    const h = json(f), id = f.split('/').pop().replace('.json', '');
    for (const k of ['website', 'shopee', 'lazada']) add(h[k], `house ${id} ${k}`);
    for (const s of h.sources ?? []) add(s, `house ${id} source`);
  }
  for (const f of files(join(root, 'src/content/perfumes'))) {
    const p = json(f), id = f.split('/content/perfumes/')[1].replace('.json', '');
    add(p.image, `${id} image`);
    add(p.source, `${id} source`);
  }
  for (const l of json(join(root, 'src/data/profile.json')).links) add(l.href, `profile ${l.label}`);
  return links;
}

/** HTTP status for a url, or an error code string ('timeout', 'ENOTFOUND', …) */
export async function check(url, fetchImpl = fetch) {
  const opts = { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'Mozilla/5.0 (link check; malaysianperfumes.com)' } };
  try {
    // HEAD first (no download); some servers refuse or mishandle HEAD, so confirm a failure with GET
    let r = await fetchImpl(url, { ...opts, method: 'HEAD' });
    if (!r.ok) { r = await fetchImpl(url, { ...opts, method: 'GET' }); await r.body?.cancel(); }
    return r.status;
  } catch (e) {
    return e.name === 'TimeoutError' ? 'timeout' : (e.cause?.code ?? e.message);
  }
}

/** Split results into broken links (fail the run) and ones that could not be checked (check by hand) */
export function classify(results) {
  const broken = [], walled = [];
  for (const [u, s] of results) {
    if (typeof s === 'number' && s < 400) continue;
    (BOT_WALLS.includes(s) || FLAKY.includes(s) ? walled : broken).push([u, s]);
  }
  return { broken, walled };
}

/** Check urls a few at a time */
export async function checkAll(urls, checkOne = check, concurrency = CONCURRENCY) {
  const results = new Map();
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < urls.length) { const u = urls[next++]; results.set(u, await checkOne(u)); }
  }));
  return results;
}

// Data from pull requests reaches the CI log; strip control characters so it cannot fake log commands
export const clean = (s) => String(s).replace(/[\x00-\x1f\x7f]/g, '?');

async function main() {
  const links = collectLinks(fileURLToPath(new URL('..', import.meta.url)));
  if (links.size > MAX_LINKS) { console.log(`${links.size} links, more than ${MAX_LINKS}. Check the data.`); process.exit(1); }
  const { broken, walled } = classify(await checkAll([...links.keys()]));
  const show = ([u, s]) => {
    const used = links.get(u);
    return `  ${clean(s)}  ${clean(u)}\n        used by: ${clean(used.slice(0, 3).join(', '))}${used.length > 3 ? ` (+${used.length - 3})` : ''}`;
  };
  console.log(`Checked ${links.size} links.`);
  if (walled.length) console.log(`\n${walled.length} could not be checked: blocked or no answer (open them in a browser to confirm):\n${walled.map(show).join('\n')}`);
  console.log(broken.length ? `\n${broken.length} broken:\n${broken.map(show).join('\n')}` : 'No broken links.');
  process.exit(broken.length ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
