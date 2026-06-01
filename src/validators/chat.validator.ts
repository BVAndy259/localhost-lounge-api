import { z } from 'zod';

export const webChatSchema = z
  .object({
    sessionToken: z.string().min(1).optional(),
    clientId: z.preprocess(
      (v) => (v === undefined ? undefined : Number(v)),
      z.number().int().positive().optional()
    ),
    message: z.string().min(1),
    role: z.string().optional(),
  })
  .refine((data) => data.clientId || data.sessionToken, {
    message: 'Debe proporcionar sessionToken o clientId',
  });

export default webChatSchema;
