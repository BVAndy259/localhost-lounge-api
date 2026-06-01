import { z } from 'zod';

export const createWaiterSchema = z.object({
  name: z.string().min(1),
  phone_number: z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    return normalized === '' ? undefined : normalized;
  }, z.string().min(7).max(20).optional()),
});

export const updateWaiterSchema = z.object({
  name: z.string().min(1),
  phone_number: z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    return normalized === '' ? undefined : normalized;
  }, z.string().min(7).max(20).optional()),
});

export const toggleWaiterSchema = z.object({
  active: z.boolean(),
});

export default createWaiterSchema;
