import { z } from 'zod';

export const createWaiterSchema = z.object({
  name: z.string().min(1),
});

export const updateWaiterSchema = z.object({
  name: z.string().min(1),
});

export const toggleWaiterSchema = z.object({
  active: z.boolean(),
});

export default createWaiterSchema;
