"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.checkoutSchema = exports.addItemsSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    client_id: zod_1.z.preprocess((val) => (val === undefined || val === null || val === '' ? undefined : Number(val)), zod_1.z.number().int().positive().optional()),
    table_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
    waiter_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
    items: zod_1.z
        .array(zod_1.z.object({
        plate_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
        quantity: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
        notes: zod_1.z.string().optional(),
    }))
        .optional(),
});
exports.addItemsSchema = zod_1.z.object({
    items: zod_1.z
        .array(zod_1.z.object({
        plate_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
        quantity: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
        notes: zod_1.z.string().optional(),
    }))
        .min(1, 'Debe incluir al menos un plato'),
});
exports.checkoutSchema = zod_1.z.object({
    payment_method: zod_1.z.enum(['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA']),
    reservation_cost: zod_1.z
        .preprocess((val) => (val === undefined || val === null || val === '' ? undefined : Number(val)), zod_1.z.number().min(0).optional())
        .optional(),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDIENTE', 'PREPARANDO', 'LISTO', 'SERVIDO', 'PAGADO']),
});
