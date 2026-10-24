import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// only https links: blocks javascript: and other schemes in outside corrections
const link = z.url({ protocol: /^https$/, error: 'must be an https:// link' });
// photos load in every visitor's browser, so only from known brand hosts; keep in sync with img-src in public/_headers
const IMG_HOSTS = ['cdn.shopify.com', 'cdn.store-assets.com', 'cdn1.sgliteasset.com', 'cdn-ca.dg1.services', 'blancofragrance.com.my', 'perfumemalaya.com', 'www.legendary.com.my', 'szindore.com', 'ptjyhtnqeqtmeepaudvq.supabase.co'];
const image = link.refine((u) => IMG_HOSTS.includes(new URL(u).hostname), 'image host not allowed: add it to IMG_HOSTS and to img-src in public/_headers');

const houses = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/houses' }),
  schema: z.object({
    name: z.string(),
    type: z.enum(['original', 'inspired', 'both']),
    founded: z.number().nullable().optional(),
    location: z.string().nullable().optional(),
    about: z.string(),
    website: link.nullable().optional(),
    instagram: z.string().regex(/^[\w.]+$/, 'handle only, without @ or a URL').nullable().optional(),
    tiktok: z.string().regex(/^[\w.]+$/, 'handle only, without @ or a URL').nullable().optional(),
    shopee: link.nullable().optional(),
    lazada: link.nullable().optional(),
    sources: z.array(link).default([]),
    partial: z.boolean().optional(),
    // a logo the brand sent us, served from public/assets/<house>/
    logo: z.string().regex(/^\/assets\/[\w-]+\/[\w.-]+\.(png|svg|jpg|webp)$/, 'a file under /assets/<house>/').nullable().optional(),
  }),
});

const notes = z.union([
  z.object({ top: z.array(z.string()), heart: z.array(z.string()), base: z.array(z.string()) }),
  z.object({ all: z.array(z.string()) }),
]);

const perfumes = defineCollection({
  loader: glob({ pattern: '*/*.json', base: './src/content/perfumes' }),
  schema: z.object({
    name: z.string(),
    house: z.string(),
    gender: z.enum(['masculine', 'feminine', 'unisex']).nullable().optional(),
    concentration: z.string().nullable().optional(),
    sizesMl: z.array(z.number()).default([]),
    inspiredBy: z.string().nullable().optional(),
    notes,
    image: image.nullable().optional(),
    source: link,
    discontinued: z.boolean().optional(),
  }),
});

export const collections = { houses, perfumes };
