import { z } from 'zod';

export const createPlateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.preprocess((v) => Number(v), z.number().nonnegative()),
  category: z.string().min(1),
  image_url: z.string().url().optional(),
});

export const updatePlateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().nonnegative().optional()
  ),
  category: z.string().min(1).optional(),
  image_url: z.string().url().optional(),
});

export const togglePlateSchema = z.object({
  available: z.boolean(),
});

export default createPlateSchema;
