// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://malaysianperfumes.com',
  trailingSlash: 'always',
  // fetch the next page when a link is hovered or tapped, so clicks open from cache
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // sitemap-index.xml for search engines; the 404 page is left out
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
