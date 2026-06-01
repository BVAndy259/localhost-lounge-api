"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePlateSchema = exports.updatePlateSchema = exports.createPlateSchema = void 0;
const zod_1 = require("zod");
exports.createPlateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    price: zod_1.z.preprocess((v) => Number(v), zod_1.z.number().nonnegative()),
    category: zod_1.z.string().min(1),
    image_url: zod_1.z.string().url().optional(),
});
exports.updatePlateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.preprocess((v) => (v === undefined ? undefined : Number(v)), zod_1.z.number().nonnegative().optional()),
    category: zod_1.z.string().min(1).optional(),
    image_url: zod_1.z.string().url().optional(),
});
exports.togglePlateSchema = zod_1.z.object({
    available: zod_1.z.boolean(),
});
exports.default = exports.createPlateSchema;
