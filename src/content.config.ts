import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// only https links: blocks javascript: and other schemes in outside corrections
const link = z.string().url().refine((u) => u.startsWith('https://'), 'must be an https:// link');

const houses = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/houses' }),
  schema: z.object({
    name: z.string(),
    type: z.enum(['original', 'inspired', 'both']),
    founded: z.number().nullable().optional(),
    location: z.string().nullable().optional(),
    about: z.string(),
    website: link.nullable().optional(),
    instagram: z.string().nullable().optional(),
    tiktok: z.string().nullable().optional(),
    shopee: link.nullable().optional(),
    lazada: link.nullable().optional(),
    sources: z.array(link).default([]),
    partial: z.boolean().optional(),
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
    image: link.nullable().optional(),
    source: link,
    discontinued: z.boolean().optional(),
  }),
});

export const collections = { houses, perfumes };
