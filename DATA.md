# Data format

One JSON file per house and one per perfume. Facts only (names, notes, sizes, links).
Do not copy marketing paragraphs. Do not store prices. Do not copy data from Fragrantica or Parfumo.
Images are linked from the brand's own site (not downloaded) and always credited with a source link.

## House: src/content/houses/<house-slug>.json
{
  "name": "Emajie",
  "type": "inspired",              // "original" | "inspired" | "both"
  "founded": 2023,                  // number or null
  "location": "Selangor",           // state or city, or null
  "about": "One or two plain sentences in our own words.",
  "website": "https://www.emajie.com",
  "instagram": "emajie.my",         // handle without @, or null
  "tiktok": "emajieofficial",       // or null
  "shopee": null,                   // full URL or null
  "lazada": null,                   // full URL or null (official store only)
  "sources": ["https://..."]        // pages the facts came from
}

## Perfume: src/content/perfumes/<house-slug>/<perfume-slug>.json
{
  "name": "Superclean",
  "house": "emajie",                // must match a house file name
  "gender": "unisex",               // "masculine" | "feminine" | "unisex" | null (only as the brand states it)
  "concentration": "Extrait de Parfum", // as stated, or null
  "sizesMl": [30],                  // numbers, or []
  "inspiredBy": "Maison Francis Kurkdjian Aqua Universalis", // only if the brand states it, else null
  "notes": {
    "top": ["Lemon", "Bergamot"],
    "heart": ["White Flowers", "Lily of the Valley"],
    "base": ["Musk", "Light Woods"]
  },                                 // or "notes": {"all": ["..."]} when the brand gives no pyramid
  "image": "https://cdn.../image.png", // brand-hosted image URL, or null
  "source": "https://www.emajie.com/products/emajie-superclean"
}
