# Malaysian Perfumes

A free library of perfumes made by Malaysian perfume houses: notes, inspirations and links, taken from each brand's own website.

- Site: https://malaysianperfumes.com (not deployed yet)
- Stack: Astro (static), no database, no tracking.
- Data: one JSON file per house in `src/content/houses/` and one per perfume in `src/content/perfumes/<house>/`. See [DATA.md](DATA.md).

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
npm run check    # type check
npm run links    # check every photo, source and shop link (needs internet, ~1 min)
```

## Corrections

Open an issue or a pull request. Brands can ask to be added, corrected or removed.
Product photos are linked from each brand's own website and remain the brand's property.
