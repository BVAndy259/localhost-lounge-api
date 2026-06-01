"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicReservationSchema = exports.assignReservationWaiterSchema = exports.createReservationSchema = void 0;
const zod_1 = require("zod");
exports.createReservationSchema = zod_1.z.object({
    table_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
    reservation_date: zod_1.z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, {
        message: 'La fecha debe tener formato YYYY-MM-DD',
    }),
    reservation_time: zod_1.z.string().regex(/^[0-9]{2}:[0-9]{2}$/, {
        message: 'La hora debe tener formato HH:MM',
    }),
    number_people: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
    notes: zod_1.z.string().optional(),
    client_id: zod_1.z.preprocess((val) => (val === undefined || val === null || val === '' ? undefined : Number(val)), zod_1.z.number().int().positive().optional()),
    client_data: zod_1.z
        .object({
        name: zod_1.z.string().min(1),
        last_name: zod_1.z.string().min(1),
        phone_number: zod_1.z.string().min(7),
        email: zod_1.z.string().email(),
    })
        .optional(),
});
exports.assignReservationWaiterSchema = zod_1.z.object({
    waiter_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
});
exports.createPublicReservationSchema = zod_1.z.object({
    table_id: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
    reservation_date: zod_1.z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, {
        message: 'La fecha debe tener formato YYYY-MM-DD',
    }),
    reservation_time: zod_1.z.string().regex(/^[0-9]{2}:[0-9]{2}$/, {
        message: 'La hora debe tener formato HH:MM',
    }),
    number_people: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()),
    customer_name: zod_1.z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    customer_email: zod_1.z.string().email({ message: 'El correo electrónico no es válido' }),
    customer_phone: zod_1.z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos' }),
    notes: zod_1.z.string().optional(),
    session_token: zod_1.z.string().optional(), // <--- ACEPTAMOS EL TOKEN
});
exports.default = exports.createReservationSchema;
