import { z } from 'zod';

export const createReservationSchema = z.object({
  table_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  reservation_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  }),
  reservation_time: z.string().regex(/^[0-9]{2}:[0-9]{2}$/, {
    message: 'La hora debe tener formato HH:MM',
  }),
  number_people: z.preprocess((val) => Number(val), z.number().int().positive()),
  notes: z.string().optional(),
  client_id: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  client_data: z
    .object({
      name: z.string().min(1),
      last_name: z.string().min(1),
      phone_number: z.string().min(7),
      email: z.string().email(),
    })
    .optional(),
});

export const assignReservationWaiterSchema = z.object({
  waiter_id: z.preprocess((val) => Number(val), z.number().int().positive()),
});

export const createPublicReservationSchema = z.object({
  reservation_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  }),
  reservation_time: z.string().regex(/^[0-9]{2}:[0-9]{2}$/, {
    message: 'La hora debe tener formato HH:MM',
  }),
  number_people: z.preprocess((val) => Number(val), z.number().int().positive()),
  customer_name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  customer_phone: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos' }),
  notes: z.string().optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CreatePublicReservationInput = z.infer<typeof createPublicReservationSchema>;

export default createReservationSchema;
