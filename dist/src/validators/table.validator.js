"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleActiveSchema = exports.updateTableSchema = exports.createTableSchema = void 0;
const zod_1 = require("zod");
exports.createTableSchema = zod_1.z.object({
    table_number: zod_1.z.string().trim().min(1).max(20),
    capacity: zod_1.z.preprocess((v) => Number(v), zod_1.z.number().int().positive()),
    type: zod_1.z.enum(['NORMAL', 'VIP']).optional(),
    reservation_price: zod_1.z
        .preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), zod_1.z.number().nonnegative())
        .optional(),
    description: zod_1.z.string().min(1).optional(),
});
exports.updateTableSchema = zod_1.z.object({
    capacity: zod_1.z.preprocess((v) => (v === undefined ? undefined : Number(v)), zod_1.z.number().int().positive().optional()),
    type: zod_1.z.enum(['NORMAL', 'VIP']).optional(),
    reservation_price: zod_1.z.preprocess((v) => (v === undefined ? undefined : Number(v)), zod_1.z.number().nonnegative().optional()),
    description: zod_1.z.string().min(1).optional(),
});
exports.toggleActiveSchema = zod_1.z.object({
    active: zod_1.z.boolean(),
});
exports.default = exports.createTableSchema;
