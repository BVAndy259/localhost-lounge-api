import { z } from 'zod';
import { Roles } from '../../shared/constants/roles';

const userRoleSchema = z.enum([Roles.ADMIN, Roles.RECEPCIONISTA]);

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema,
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
});

export const toggleUserSchema = z.object({
  active: z.boolean(),
});

export default updateUserSchema;
