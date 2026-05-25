import { z } from 'zod';

export const createTableSchema = z.object({
  table_number: z.preprocess((v) => Number(v), z.number().int().positive()),
  capacity: z.preprocess((v) => Number(v), z.number().int().positive()),
  type: z.string().min(1),
  reservation_price: z.preprocess((v) => Number(v), z.number().nonnegative()),
  description: z.string().min(1),
});

export const updateTableSchema = z.object({
  capacity: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
  type: z.string().min(1).optional(),
  reservation_price: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().nonnegative().optional()
  ),
  description: z.string().min(1).optional(),
});

export const toggleActiveSchema = z.object({
  active: z.boolean(),
});

export default createTableSchema;
