import { z } from 'zod';

export const createTableSchema = z.object({
  table_number: z.string().trim().min(1).max(20),
  capacity: z.preprocess((v) => Number(v), z.number().int().positive()),
  type: z.enum(['NORMAL', 'VIP']).optional(),
  reservation_price: z
    .preprocess(
      (v) => (v === undefined || v === '' ? undefined : Number(v)),
      z.number().nonnegative()
    )
    .optional(),
  description: z.string().min(1).optional(),
});

export const updateTableSchema = z.object({
  capacity: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
  type: z.enum(['NORMAL', 'VIP']).optional(),
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
