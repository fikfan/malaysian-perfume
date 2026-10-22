// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://malaysianperfumes.com',
  trailingSlash: 'always',
  // fetch the next page when a link is hovered or tapped, so clicks open from cache
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
