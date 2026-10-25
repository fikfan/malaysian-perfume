---
name: house
description: Add a Malaysian perfume house to malaysiaperfumes.com, or update a house from a brand's reply (corrections, new releases, about text, logo). Use for /house <shop URL | brand name | pasted brand email>.
argument-hint: <shop URL | brand name | pasted brand reply>
---

# Add or update a house

Input: $ARGUMENTS

Read `DATA.md` first. It is the data format. The rules below add to it.

## Decide the mode

- **Add:** the input is a shop URL or brand name, and `src/content/houses/<id>.json` does not exist.
- **Update:** the house exists, or the input is a brand's email or message. Apply only what the brand asks for.

## Add a house

1. **Find the sources.** Use the brand's own website.
   - Shopify shops: `https://<shop>/products.json?limit=250` gives names, sizes, images and descriptions in one call.
   - Other shops: the sitemap, then the product pages.
   - Instagram blocks reading without a login. If a brand has no website, stop and say so; ask the user for the perfume list.
   - Never copy from Fragrantica or Parfumo. Store no prices.
2. **Write the house file** `src/content/houses/<id>.json`. Use a short kebab-case id.
   - `about`: 1 to 3 plain sentences in our own words, with no marketing copy.
   - Attribute product claims with "describes as" or "says", for example vegan, alcohol-free or long-lasting. A brand can ask for its own wording; then use that wording.
   - Do not repeat in `about` the facts that have their own fields (founded, location, sizes).
   - `type`: `original`, `inspired` or `both`, from what the brand says.
   - `sources`: every page you took facts from.
3. **Write the perfume files** `src/content/perfumes/<id>/<perfume-slug>.json`.
   - **Count:** list at most 40 perfumes, and prefer perfumes whose notes the brand confirms. If the brand sells more, set `"partial": true` on the house. The site then shows "Selection" instead of a count.
   - **Skip:** gift sets, bundles, samples, body mists and non-perfume products.
   - **Notes:** use `top`/`heart`/`base` when the brand gives a pyramid; otherwise use `all`. Use the brand's note names. When a note is a spelling variant of an existing note, add an entry to `src/data/note-aliases.json`.
   - **Other fields:** set `inspiredBy` only when the brand names the inspiration itself, and set `gender` only as the brand states it.
   - **Image:** use the brand-hosted image URL. If its host is new, add the host to `IMG_HOSTS` in `src/content.config.ts` and to `img-src` in `public/_headers`. These 2 lists must match.
4. **Clean up the list of upcoming houses.** If the brand is in `src/data/upcoming.json`, remove it.

## Update a house

- **Text changes:** apply the requested facts.
  - For a new `about` text, show the user 2 or 3 drafts. Write the drafts in plain words, without "it says" wording when the brand asked for its own claims. Wait for the user's choice.
- **Corrections or new perfumes:** edit or add the perfume files with the same rules as "Add a house".
- **Logo:**
  1. Resize it: `sips -Z 512 "<file>" --out public/assets/<id>/logo.png`. Home page tiles show it at about 240 px, so a sharp 2x screen needs 480 px or more. Do not enlarge a smaller file.
  2. Set `"logo": "/assets/<id>/logo.png"` in the house file.
  3. Keep each brand's files in `public/assets/<id>/`.

## Check

Run these, and fix every failure:

```sh
npm run check   # 0 errors
npm test
npm run build
```

1. Open `dist/houses/<id>/index.html` and confirm that the perfume count and the changed text are there.
2. For a new house, also run `npm run links`. It needs the internet and takes about 1 minute. Fix or remove broken image and source links.

## Finish

1. **Commit:** write a one-line message, for example "Add Opai Fragrance" or "Update Emajie details from the brand". Never add a Co-Authored-By line. Then push.
2. **Deploy:** ask the user first. When they agree:
   1. Run `npm run deploy`.
   2. Check the live page with `curl -s https://malaysiaperfumes.com/houses/<id>/`.
3. **Report:**
   - The house and the perfume count, and whether `partial` is set.
   - The files that changed.
   - Anything skipped, and why.
   - The live link.

For an update, also draft a short thank-you reply that the user can send to the brand. List the changes in it and link the page. Do not offer any services in it.
