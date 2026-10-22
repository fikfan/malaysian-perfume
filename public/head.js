// Runs in <head> before the page paints. A file, not an inline script, so the CSP needs no hashes.
try { const t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; } catch {}
// hold the page behind a brief loader until the font is in, so text does not jump; never longer than 1.2 s
(() => {
  const r = document.documentElement; r.classList.add('js');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.classList.add('loading');
  const done = () => r.classList.remove('loading');
  setTimeout(done, 1200);
  addEventListener('DOMContentLoaded', () => document.fonts.ready.then(done));
})();
// product photos: fade in on load; if the brand's server refuses one, show the letter tile instead
document.addEventListener('load', (e) => { if (e.target.matches?.('.thumb img')) e.target.classList.add('in'); }, true);
document.addEventListener('error', (e) => {
  if (e.target.matches?.('.thumb img')) { e.target.parentElement.classList.add('noimg'); e.target.remove(); }
}, true);
