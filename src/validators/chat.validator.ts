import { z } from 'zod';

export const webChatSchema = z.object({
  sessionToken: z.string().min(1),
  clientId: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
  message: z.string().min(1),
  role: z.string().optional(),
});

export default webChatSchema;
