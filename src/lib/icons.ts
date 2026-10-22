// Brand marks as inline SVG: Simple Icons (CC0); Lazada from Wikimedia Commons (public domain), which has its own viewBox
import icons from '../data/brand-icons.json';

const EXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>';

/** SVG markup for a brand key (shopee, tiktok, github…); 'web' and unknown keys get the external-link arrow */
export function iconSvg(key: string) {
  const i = (icons as Record<string, string | { viewBox: string; d: string }>)[key];
  if (!i) return EXT;
  const [vb, d] = typeof i === 'string' ? ['0 0 24 24', i] : [i.viewBox, i.d];
  // the JSON goes into raw markup, so allow only path commands and numbers
  if (!/^[MmLlHhVvCcSsQqTtAaZzEe\d.,\s+-]+$/.test(d) || !/^[\d.\s-]+$/.test(vb)) throw new Error(`brand-icons.json: invalid icon "${key}"`);
  return `<svg viewBox="${vb}" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
}
