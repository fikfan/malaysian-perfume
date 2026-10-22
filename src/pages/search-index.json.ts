import { load, pyramid, perfumeUrl, imgUrl, allNotes, searchFamilies, ROW_IMG } from '../lib/data';
import type { SearchRow } from '../lib/contracts';

// One small JSON file the search page loads; built at build time.
export async function GET() {
  const { houses, perfumes } = await load();
  const hn = new Map(houses.map((h) => [h.id, h.data.name]));
  const rows: SearchRow[] = perfumes.map((p) => ({
    n: p.data.name,
    h: p.data.house,
    hn: hn.get(p.data.house) ?? p.data.house,
    u: perfumeUrl(p),
    i: p.data.inspiredBy ?? null,
    g: p.data.gender ?? null,
    d: p.data.discontinued ? 1 : 0,
    img: imgUrl(p.data.image, ROW_IMG * 2),
    l: pyramid(p).map((l): [string, string[]] => [l.label, l.notes]),
    f: searchFamilies([p.data.name, p.data.inspiredBy, ...allNotes(p)]),
  }));
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
}
