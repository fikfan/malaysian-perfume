// One way to fold and match search text, shared by the build (data.ts) and the browser scripts.
// No astro:content import here, so the pages' client scripts can bundle it.

// Oud goes by many names; a search for any of them finds all of them
export const OUD = ['oud', 'agarwood', 'gaharu', 'kyara', 'jinkoh', 'qinan'];
const OUD_RE = /agarwood|gaharu|jinkoh|kyara|qi-?nan|\boud\b/i;

export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').toLowerCase();
// " word word …": folded, punctuation turned into spaces, so ' ' + term matches the start of a word
export const haystack = (s: string) => ' ' + fold(s).replace(/[^a-z0-9]+/g, ' ');
// What the visitor typed, as words of two letters or more
export const terms = (q: string) => fold(q).replace(/[^a-z0-9]+/g, ' ').split(' ').filter((t) => t.length > 1);
export const matches = (hay: string, ts: string[]) => ts.every((t) => hay.includes(' ' + t));
// Extra words added to a perfume's search text when any of its notes or its name is an oud
export const family = (text: string) => (OUD_RE.test(text) ? ' ' + OUD.join(' ') : '');
