// Structured data (schema.org JSON-LD) that helps search engines understand the pages
import { REPO_URL } from './site';
import { SITE_URL as SITE } from './site';
const abs = (path: string) => new URL(path, SITE).href;

/** Search results show about 160 characters of a description; cut at a word and add an ellipsis */
export const clip = (s: string, max = 160) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,;:.\s]+$/, '') + '…');

/** Home page: names the site and lets Google offer a search box for it */
export const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Malaysian Perfumes',
  url: abs('/'),
  inLanguage: 'en-MY',
  sameAs: [REPO_URL],
  potentialAction: { '@type': 'SearchAction', target: `${abs('/search/')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
});

/** "Houses › Emajie › Alpha" trail shown under the result in Google */
export const breadcrumbLd = (items: [name: string, path: string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});

/** A list page (a house's perfumes, the houses table) */
export const itemListLd = (name: string, items: [name: string, path: string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map(([n, path], i) => ({ '@type': 'ListItem', position: i + 1, name: n, url: abs(path) })),
});
