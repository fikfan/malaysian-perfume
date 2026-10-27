// Unit tests for the IndexNow script. Run with `npm test` (no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sitemapPaths, changed, pageHash } from './indexnow.mjs';

test('sitemapPaths reads the paths from the sitemap', () => {
  const xml = '<urlset><url><loc>https://malaysiaperfumes.com/</loc></url><url><loc>https://malaysiaperfumes.com/houses/emajie/</loc></url></urlset>';
  assert.deepEqual(sitemapPaths(xml), ['/', '/houses/emajie/']);
});

test('changed lists new and edited pages only', () => {
  assert.deepEqual(changed({ '/': 'a', '/x/': 'b' }, { '/': 'a', '/x/': 'c', '/y/': 'd' }), ['/x/', '/y/']);
});

test('changed sends every page on the first run', () => {
  assert.deepEqual(changed(undefined, { '/': 'a', '/x/': 'b' }), ['/', '/x/']);
});

test('pageHash ignores asset file names but not content', () => {
  assert.equal(pageHash('<link href="/_astro/a.B1x.css"><p>Hi</p>'), pageHash('<link href="/_astro/a.Z9q.css"><p>Hi</p>'));
  assert.notEqual(pageHash('<p>Hi</p>'), pageHash('<p>Bye</p>'));
});
