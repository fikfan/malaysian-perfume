import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const houses = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/houses' }),
  schema: z.object({
    name: z.string(),
    type: z.enum(['original', 'inspired', 'both']),
    founded: z.number().nullable().optional(),
    location: z.string().nullable().optional(),
    about: z.string(),
    website: z.string().url().nullable().optional(),
    instagram: z.string().nullable().optional(),
    tiktok: z.string().nullable().optional(),
    shopee: z.string().nullable().optional(),
    lazada: z.string().nullable().optional(),
    sources: z.array(z.string()).default([]),
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
    image: z.string().url().nullable().optional(),
    source: z.string().url(),
    discontinued: z.boolean().optional(),
  }),
});

export const collections = { houses, perfumes };
