import { load, pyramid, perfumeUrl, imgUrl, allNotes, searchFamilies } from '../lib/data';

// One small JSON file the search page loads; built at build time.
export async function GET() {
  const { houses, perfumes } = await load();
  const hn = new Map(houses.map((h) => [h.id, h.data.name]));
  const rows = perfumes.map((p) => ({
    n: p.data.name,
    h: p.data.house,
    hn: hn.get(p.data.house),
    u: perfumeUrl(p),
    i: p.data.inspiredBy ?? null,
    g: p.data.gender ?? null,
    d: p.data.discontinued ? 1 : 0,
    img: imgUrl(p.data.image, 352),
    l: pyramid(p).map((l) => [l.label, l.notes]),
    f: searchFamilies(allNotes(p)),
  }));
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
}
