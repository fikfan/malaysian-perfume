import { getCollection, type CollectionEntry } from 'astro:content';
import ALIAS from '../data/note-aliases.json';
import { family } from './match';
export { GENDER_LABEL } from './labels';

export type House = CollectionEntry<'houses'>;
export type Perfume = CollectionEntry<'perfumes'>;

const SMALL = new Set(['of', 'the', 'de', 'du', 'la', 'le', 'and', 'in', 'with', 'a', 'an', 'd']);
// Brands write notes in every case style; show them one way. "LILY OF THE VALLEY" -> "Lily of the Valley"
export const noteName = (n: string) =>
  n.trim().toLowerCase().replace(/\s+/g, ' ')
    .replace(/[\p{L}\d][\p{L}\d'’.]*/gu, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));

export const TYPE_LABEL = { original: 'Original scents', inspired: 'Inspired-by scents', both: 'Original and inspired-by' } as const;

export const DATA_CHECKED = 'October 2026';

// Words brands put in front of a note ("Juicy Pineapple") and entries that are not notes at all
const ADJ = /^(juicy|sparkling|zesty|velvety|warm|subtle|crisp|bright|soft|smooth|creamy|rich|deep|refreshing|refined|sensual|elegant|fiery|bold|delicate|luscious|lush|vibrant|sweet and|spiced)\s+/i;
const DROP = new Set(['Masculine Florals', 'Fresh Accords', 'Fresh', 'Oriental', 'Gourmand', 'Notes', 'Accords', 'Fresh Accord', 'Sweetness', 'Amber Heart',
  'Golden Fur', 'Honeyed Blood', 'Carnal Blooms', 'Obscure Elements', 'Melon-Like Seeds', 'Gourd-Like Fruits']);
const aliases = ALIAS as Record<string, string>;
// "Imperial Incense (Agarwood, White Sandalwood)" -> ["Agarwood", "White Sandalwood"]; Chinese names in brackets are dropped
function expand(raw: string): string[] {
  const s = raw.replace(/[\u3000-\u9fff\uff00-\uffef]+/g, '')
    .replace(/[“"‘][^”"’]*[”"’]\s*/g, '')          // quoted foreign names: drop the whole segment
    .replace(/\s*\([^,()]*\)/g, '').trim();        // "(Kin Mokusei)": a bracket without a list is an aside
  const inner = s.match(/[(\[]([^()\[\]]*,[^()\[\]]*)[)\]]/);
  return (inner ? inner[1].split(/[,;]/) : [s]).map((x) => x.replace(/\(\s*\)/g, '').trim()).filter(Boolean);
}
export function cleanNote(raw: string): string[] {
  return expand(raw).flatMap((x) => {
    let n = noteName(x);
    if (DROP.has(n)) return [];
    if (n.split(' ').length > 1) n = n.replace(ADJ, '');
    n = Object.hasOwn(aliases, n) ? aliases[n] : n;
    if (!n || DROP.has(n)) return [];
    return [n[0].toUpperCase() + n.slice(1)];
  });
}
// Search also finds oud under its other names, and the other way round
export const searchFamilies = (texts: (string | null | undefined)[]) => family(texts.filter(Boolean).join(' '));

export const pyramid = (p: Perfume): { label: string; notes: string[] }[] => {
  const n = p.data.notes;
  const clean = (a: string[]) => [...new Set(a.flatMap(cleanNote))];
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
  // Each perfume's house must exist and match its folder (the folder gives the slug, the field gives the URL)
  const ids = new Set(houses.map((h) => h.id));
  for (const p of perfumes) {
    if (!ids.has(p.data.house) || p.id.split('/')[0] !== p.data.house)
      throw new Error(`Perfume ${p.id}: house "${p.data.house}" must be an existing house id and match its folder`);
  }
  // current perfumes first, discontinued ones after (stable, so A-Z order is kept inside each group)
  const byHouse = new Map(houses.map((h) => [h.id, perfumes.filter((p) => p.data.house === h.id)
    .sort((a, b) => Number(!!a.data.discontinued) - Number(!!b.data.discontinued))]));
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
export function imgUrl(src: string, w: number): string;
export function imgUrl(src: string | null | undefined, w: number): string | null;
export function imgUrl(src: string | null | undefined, w: number) {
  if (!src) return null;
  try {
    const u = new URL(src);
    if (/cdn\.shopify\.com|store-assets\.com|\/cdn\/shop\//.test(u.href)) { u.searchParams.set('width', String(w)); return u.href; }
    if (u.hostname.endsWith('dg1.services')) return src.replace('/o/', `/rw${w}/`);
    if (u.hostname.endsWith('.supabase.co') && u.pathname.includes('/render/image/')) { u.searchParams.set('width', String(w)); return u.href; }
    if (u.hostname === 'static.wixstatic.com') {
      const file = u.pathname.split('/')[2];
      return `${u.origin}/media/${file}/v1/fill/w_${w},h_${w},al_c,q_80,enc_auto/${file}`;
    }
    return src;
  } catch { return src; }
}

// Thumbnail display sizes in CSS px; image requests ask for 2x for sharp screens
export const ROW_IMG = 176;
export const TILE_IMG = 240;

export const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');
// A house that sells more than we list shows no number: the count would read as the brand's whole range
export const countLabel = (h: House, n: number) => (h.data.partial ? 'Selection' : String(n));
export const perfumesLabel = (h: House, n: number) => (h.data.partial ? 'A selection of perfumes' : `${n} perfumes`);

// A house's current perfumes that have a photo: what the home page shows off
export const currentWithPhoto = (list: Perfume[]) => list.filter((p) => p.data.image && !p.data.discontinued);

export const fmtSizes = (s: number[]) => (s.length ? s.map((m) => `${m} ml`).join(', ') : null);
