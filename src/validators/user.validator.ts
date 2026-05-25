import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().optional(),
});

export const toggleUserSchema = z.object({
  active: z.boolean(),
});

export default updateUserSchema;
