// HTML-string helpers for the browser scripts that render lists (search results, hero grid).
// Server-rendered pages use the Astro components; keep the thumbnail markup here in sync with Thumb.astro.

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const thumbHtml = (img: string | null, name: string, size: number) =>
  `<div class="thumb${img ? '' : ' noimg'}" data-initial="${esc(name[0] ?? '')}">${img
    ? `<img src="${esc(img)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
    : ''}</div>`;

// Fisher–Yates: every order equally likely
export const shuffle = <T>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Run a DOM update as a cross-fade where the browser supports it, unless the visitor asked for less motion
export const withFade = (update: () => void) =>
  'startViewTransition' in document && !matchMedia('(prefers-reduced-motion: reduce)').matches ? document.startViewTransition(update) : update();
