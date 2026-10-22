// Unit tests for the link checker. Run with `npm test` (Node's built-in runner, no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectLinks, check, classify, checkAll } from './check-links.mjs';

// A tiny copy of the data layout: one house, two perfumes, a profile
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'mp-links-'));
  const put = (p, v) => { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), JSON.stringify(v)); };
  put('src/content/houses/acme.json', { website: 'https://acme.my', shopee: 'https://shopee.com.my/acme', lazada: null, sources: ['https://acme.my/about'] });
  put('src/content/perfumes/acme/one.json', { image: 'https://cdn.acme.my/1.jpg', source: 'https://acme.my/p/1' });
  put('src/content/perfumes/acme/two.json', { image: 'https://cdn.acme.my/1.jpg', source: 'https://acme.my/p/2' }); // same photo as one
  put('src/data/profile.json', { links: [{ label: 'GitHub', href: 'https://github.com/x' }] });
  return root;
}

// A fake fetch: answers from a table of url → { HEAD, GET } statuses, and records every call
function fakeFetch(table) {
  const calls = [];
  const impl = async (url, { method }) => {
    calls.push(`${method} ${url}`);
    const s = table[url]?.[method];
    if (s instanceof Error) throw s;
    return { ok: s >= 200 && s < 300, status: s, body: { cancel: async () => {} } };
  };
  return { impl, calls };
}

test('collectLinks finds every link in houses, perfumes and the profile, skipping empty fields', () => {
  const root = fixture();
  try {
    const links = collectLinks(root);
    assert.deepEqual([...links.keys()].sort(), [
      'https://acme.my', 'https://acme.my/about', 'https://acme.my/p/1', 'https://acme.my/p/2',
      'https://cdn.acme.my/1.jpg', 'https://github.com/x', 'https://shopee.com.my/acme',
    ]);
    assert.deepEqual(links.get('https://cdn.acme.my/1.jpg'), ['acme/one image', 'acme/two image']); // shared url, both places kept
    assert.deepEqual(links.get('https://shopee.com.my/acme'), ['house acme shopee']);
  } finally { rmSync(root, { recursive: true }); }
});

test('check uses HEAD only when it succeeds', async () => {
  const f = fakeFetch({ 'https://a': { HEAD: 200 } });
  assert.equal(await check('https://a', f.impl), 200);
  assert.deepEqual(f.calls, ['HEAD https://a']);
});

test('check confirms a failed HEAD with GET (servers that refuse HEAD)', async () => {
  const f = fakeFetch({ 'https://a': { HEAD: 403, GET: 200 } });
  assert.equal(await check('https://a', f.impl), 200);
  assert.deepEqual(f.calls, ['HEAD https://a', 'GET https://a']);
});

test('check reports the GET status when the link is really gone', async () => {
  const f = fakeFetch({ 'https://a': { HEAD: 404, GET: 404 } });
  assert.equal(await check('https://a', f.impl), 404);
});

test('check turns network errors into a readable code', async () => {
  const dns = Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } });
  const slow = Object.assign(new Error('slow'), { name: 'TimeoutError' });
  assert.equal(await check('https://a', fakeFetch({ 'https://a': { HEAD: dns } }).impl), 'ENOTFOUND');
  assert.equal(await check('https://a', fakeFetch({ 'https://a': { HEAD: slow } }).impl), 'timeout');
});

test('classify fails clear errors, but only reports bot walls and network hiccups', () => {
  const { broken, walled } = classify(new Map([
    ['https://ok', 200], ['https://moved', 301], ['https://gone', 404], ['https://removed', 410], ['https://down', 500],
    ['https://dns', 'ENOTFOUND'], ['https://linkedin', 999], ['https://busy', 429], ['https://cf', 403],
    ['https://linktree', 406], ['https://slow', 'timeout'], ['https://reset', 'ECONNRESET'],
  ]));
  assert.deepEqual(broken.map(([u]) => u), ['https://gone', 'https://removed', 'https://down', 'https://dns']);
  assert.deepEqual(walled.map(([u]) => u), ['https://linkedin', 'https://busy', 'https://cf', 'https://linktree', 'https://slow', 'https://reset']);
});

test('checkAll checks every url once, with limited concurrency', async () => {
  let running = 0, peak = 0;
  const seen = [];
  const slowCheck = async (u) => { running++; peak = Math.max(peak, running); seen.push(u); await new Promise((r) => setTimeout(r, 5)); running--; return 200; };
  const urls = Array.from({ length: 10 }, (_, i) => `https://x/${i}`);
  const results = await checkAll(urls, slowCheck, 3);
  assert.equal(results.size, 10);
  assert.deepEqual(seen.sort(), [...urls].sort());
  assert.ok(peak <= 3, `peak concurrency ${peak}`);
});
