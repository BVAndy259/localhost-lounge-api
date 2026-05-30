import { z } from 'zod';

export const createOrderSchema = z.object({
  client_id: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  table_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  waiter_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  items: z
    .array(
      z.object({
        plate_id: z.preprocess((val) => Number(val), z.number().int().positive()),
        quantity: z.preprocess((val) => Number(val), z.number().int().positive()),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

export const addItemsSchema = z.object({
  items: z
    .array(
      z.object({
        plate_id: z.preprocess((val) => Number(val), z.number().int().positive()),
        quantity: z.preprocess((val) => Number(val), z.number().int().positive()),
        notes: z.string().optional(),
      })
    )
    .min(1, 'Debe incluir al menos un plato'),
});

export const checkoutSchema = z.object({
  payment_method: z.enum(['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA']),
  reservation_cost: z
    .preprocess(
      (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
      z.number().min(0).optional()
    )
    .optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDIENTE', 'PREPARANDO', 'LISTO', 'SERVIDO', 'PAGADO']),
});
