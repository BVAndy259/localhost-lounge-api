"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const roles_1 = require("../constants/roles");
const userRoleSchema = zod_1.z.enum([roles_1.Roles.ADMIN, roles_1.Roles.RECEPCIONISTA]);
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: userRoleSchema,
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    role: userRoleSchema.optional(),
});
exports.toggleUserSchema = zod_1.z.object({
    active: zod_1.z.boolean(),
});
exports.default = exports.updateUserSchema;
