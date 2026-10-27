// Structured data (schema.org JSON-LD) that helps search engines understand the pages
import { REPO_URL } from './site';
import { SITE_URL as SITE } from './site';
const abs = (path: string) => new URL(path, SITE).href;

/** Search results show about 160 characters of a description; cut at a word and add an ellipsis */
export const clip = (s: string, max = 160) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,;:.\s]+$/, '') + '…');

const WEBSITE = abs('/#website');
const ORG = abs('/#org');
const org = { '@type': 'Organization', '@id': ORG, name: 'Malaysia Perfumes', url: abs('/'), logo: abs('/logo.svg'), sameAs: [REPO_URL] };

/** Home page: names the site and who publishes it, and lets Google offer a search box for it */
export const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': WEBSITE,
      name: 'Malaysia Perfumes',
      alternateName: 'malaysiaperfumes.com',
      url: abs('/'),
      inLanguage: 'en-MY',
      publisher: { '@id': ORG },
      potentialAction: { '@type': 'SearchAction', target: `${abs('/search/')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
    org,
  ],
});

/** The About page: describes the site and the organisation behind it */
export const aboutLd = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'AboutPage', name: 'About Malaysia Perfumes', url: abs('/about/'), isPartOf: { '@id': WEBSITE }, about: { '@id': ORG } },
    org,
  ],
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

/** A page that lists things (an inspiration and its perfumes); the list goes in as mainEntity */
export const collectionPageLd = (name: string, path: string, description: string, list?: ReturnType<typeof itemListLd>) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  description,
  url: abs(path),
  inLanguage: 'en-MY',
  ...(list && { mainEntity: { ...list, '@context': undefined } }),
});

/** A house page: the brand, and the list of its perfumes */
export const houseLd = (b: { name: string; path: string; website?: string | null; logo?: string | null; sameAs: string[] }, items: [name: string, path: string][]) => {
  const { '@context': _, ...list } = itemListLd(`${b.name} perfumes`, items);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${b.name} perfumes`,
    url: abs(b.path),
    about: {
      '@type': 'Brand',
      name: b.name,
      ...(b.website && { url: b.website }),
      ...(b.logo && { logo: abs(b.logo) }),
      ...(b.sameAs.length && { sameAs: b.sameAs }),
    },
    mainEntity: list,
  };
};

/** A perfume page; facts only, so no offers, ratings or reviews */
export const perfumeLd = (p: { name: string; brand: string; brandPath: string; path: string; description: string; image?: string | null; inspiredBy?: string | null; sameAs?: string | null }) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': abs(p.path) + '#product',
  name: p.name,
  description: p.description,
  url: abs(p.path),
  category: 'Perfume',
  brand: { '@type': 'Brand', name: p.brand, url: abs(p.brandPath) },
  ...(p.image && { image: abs(p.image) }), // brand-sent photos are local /assets/ paths
  ...(p.inspiredBy && { isSimilarTo: { '@type': 'Product', name: p.inspiredBy } }),
  ...(p.sameAs && { sameAs: p.sameAs }),
});
