"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webChatSchema = void 0;
const zod_1 = require("zod");
exports.webChatSchema = zod_1.z.object({
    sessionToken: zod_1.z.string().min(1),
    clientId: zod_1.z.preprocess((v) => (v === undefined ? undefined : Number(v)), zod_1.z.number().int().positive().optional()),
    message: zod_1.z.string().min(1),
    role: zod_1.z.string().optional(),
});
exports.default = exports.webChatSchema;
