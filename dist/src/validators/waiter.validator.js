"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleWaiterSchema = exports.updateWaiterSchema = exports.createWaiterSchema = void 0;
const zod_1 = require("zod");
exports.createWaiterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    phone_number: zod_1.z.preprocess((value) => {
        if (value === undefined || value === null)
            return undefined;
        const normalized = String(value).trim();
        return normalized === '' ? undefined : normalized;
    }, zod_1.z.string().min(7).max(20).optional()),
});
exports.updateWaiterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    phone_number: zod_1.z.preprocess((value) => {
        if (value === undefined || value === null)
            return undefined;
        const normalized = String(value).trim();
        return normalized === '' ? undefined : normalized;
    }, zod_1.z.string().min(7).max(20).optional()),
});
exports.toggleWaiterSchema = zod_1.z.object({
    active: zod_1.z.boolean(),
});
exports.default = exports.createWaiterSchema;
