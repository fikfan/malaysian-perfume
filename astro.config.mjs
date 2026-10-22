// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://malaysiaperfumes.com',
  trailingSlash: 'always',
  // CSS and small scripts as files, not inline, so the CSP in public/_headers needs no hashes
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  // fetch the next page when a link is hovered or tapped, so clicks open from cache
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // sitemap-index.xml for search engines; the 404 page is left out
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
