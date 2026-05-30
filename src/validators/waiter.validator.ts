import { z } from 'zod';

export const createWaiterSchema = z.object({
  name: z.string().min(1),
  phone_number: z.string().min(7).max(20).optional(),
});

export const updateWaiterSchema = z.object({
  name: z.string().min(1),
  phone_number: z.string().min(7).max(20).optional(),
});

export const toggleWaiterSchema = z.object({
  active: z.boolean(),
});

export default createWaiterSchema;
