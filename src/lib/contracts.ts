// Data contracts: the JSON the build writes and the browser scripts read.
// The build side annotates its output with these types and the client side parses into them,
// so a field change breaks the type check on both ends instead of failing quietly.

import type { GENDER_LABEL } from './labels';

export type Gender = keyof typeof GENDER_LABEL;

/** One row of /search-index.json (src/pages/search-index.json.ts → src/pages/search.astro) */
export type SearchRow = {
  n: string;                    // perfume name
  h: string;                    // house id
  hn: string;                   // house name
  u: string;                    // perfume page URL
  i: string | null;             // inspired by
  g: Gender | null;
  d: 0 | 1;                     // discontinued
  img: string | null;           // resized photo URL
  l: [label: string, notes: string[]][]; // note layers, e.g. ["Top", ["Bergamot"]]
  f: string;                    // extra family words for search (oud names)
};

/** One house in the home page hero pool (src/pages/index.astro, build → inline JSON → client) */
export type HeroHouse = {
  n: string;                    // house name
  u: string;                    // house page URL
  c: string;                    // "57 perfumes" or "A selection of perfumes"
  img: string | null;           // house cover photo
  p: { n: string; u: string; img: string | null }[]; // current perfumes with a photo
};
