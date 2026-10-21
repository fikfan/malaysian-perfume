import { getCollection, type CollectionEntry } from 'astro:content';

export type House = CollectionEntry<'houses'>;
export type Perfume = CollectionEntry<'perfumes'>;

const SMALL = new Set(['of', 'the', 'de', 'du', 'la', 'le', 'and', 'in', 'with', 'a', 'an', 'd']);
// Brands write notes in every case style; show them one way. "LILY OF THE VALLEY" -> "Lily of the Valley"
export const noteName = (n: string) =>
  n.trim().toLowerCase().replace(/\s+/g, ' ')
    .replace(/[\p{L}\d][\p{L}\d'’.]*/gu, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const TYPE_LABEL = { original: 'Original scents', inspired: 'Inspired-by scents', both: 'Original and inspired-by' } as const;
export const GENDER_LABEL = { masculine: 'Masculine', feminine: 'Feminine', unisex: 'Unisex' } as const;

export const pyramid = (p: Perfume): { label: string; notes: string[] }[] => {
  const n = p.data.notes;
  const clean = (a: string[]) => [...new Set(a.map(noteName).filter(Boolean))];
  if ('all' in n) return n.all.length ? [{ label: 'Notes', notes: clean(n.all) }] : [];
  return [
    { label: 'Top', notes: clean(n.top) },
    { label: 'Heart', notes: clean(n.heart) },
    { label: 'Base', notes: clean(n.base) },
  ].filter((l) => l.notes.length);
};

export const allNotes = (p: Perfume) => [...new Set(pyramid(p).flatMap((l) => l.notes))];
export const perfumeSlug = (p: Perfume) => p.id.split('/')[1];
export const perfumeUrl = (p: Perfume) => `/perfumes/${p.data.house}/${perfumeSlug(p)}/`;
export const houseUrl = (id: string) => `/houses/${id}/`;
export const searchUrl = (q: string) => `/search/?q=${encodeURIComponent(q)}`;

let cache: { houses: House[]; perfumes: Perfume[]; byHouse: Map<string, Perfume[]> } | null = null;
export async function load() {
  if (cache) return cache;
  const houses = (await getCollection('houses')).sort((a, b) => a.data.name.localeCompare(b.data.name));
  const perfumes = (await getCollection('perfumes')).sort((a, b) => a.data.name.localeCompare(b.data.name));
  const byHouse = new Map(houses.map((h) => [h.id, perfumes.filter((p) => p.data.house === h.id)]));
  return (cache = { houses, perfumes, byHouse });
}

// Note frequency across the whole library, used for "popular notes" and note links
export async function noteCounts() {
  const { perfumes } = await load();
  const c = new Map<string, number>();
  for (const p of perfumes) for (const n of allNotes(p)) c.set(n, (c.get(n) ?? 0) + 1);
  return [...c].sort((a, b) => b[1] - a[1]);
}

// Ask the brand's image server for a small copy when it supports resizing (Shopify, EasyStore CDNs)
export function imgUrl(src: string | null | undefined, w: number) {
  if (!src) return null;
  try {
    const u = new URL(src);
    if (/cdn\.shopify\.com|store-assets\.com|\/cdn\/shop\//.test(u.href)) { u.searchParams.set('width', String(w)); return u.href; }
    return src;
  } catch { return src; }
}

export const fmtSizes = (s: number[]) => (s.length ? s.map((m) => `${m} ml`).join(', ') : null);
