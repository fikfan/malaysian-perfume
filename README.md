# Malaysia Perfumes

A free library of perfumes made by Malaysian perfume houses: notes, inspirations and links, taken from each brand's own website.

- Site: https://malaysiaperfumes.com (also https://malaysian-perfume.malaysianperfumes.workers.dev)
- Stack: Astro (static) on a Cloudflare Worker, no database, no tracking. The Worker only handles the contact form (`worker/`).
- Data: one JSON file per house in `src/content/houses/` and one per perfume in `src/content/perfumes/<house>/`. See [DATA.md](DATA.md).

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
npm run check    # type check
npm test         # unit tests: link checker, contact form checks
npm run dev:worker  # the built site plus the contact form, http://localhost:8787 (emails are simulated)
npm run links    # check every photo, source and shop link (needs internet, ~1 min)
```

For `dev:worker`, create `.dev.vars` (gitignored):

```sh
CONTACT_TO=you@example.com
TURNSTILE_SECRET=1x0000000000000000000000000000000AA   # Cloudflare test secret, always passes
```

## Deploy (Cloudflare)

1. Add the domain to Cloudflare, then turn on Email Service sending for it: `npx wrangler email sending enable malaysiaperfumes.com`.
2. Create a Turnstile widget for the domain. Put its site key in `TURNSTILE_SITE_KEY` in `src/lib/site.ts`.
3. Set the two secrets: `npx wrangler secret put CONTACT_TO` and `npx wrangler secret put TURNSTILE_SECRET`.
4. Deploy: `npm run deploy`, or connect the repo in Workers Builds (build `npm run build`, deploy `npx wrangler deploy`).

## Corrections

Open an issue or a pull request. Brands can ask to be added, corrected or removed.
Product photos are linked from each brand's own website and remain the brand's property.
