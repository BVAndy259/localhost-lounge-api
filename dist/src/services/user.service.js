"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const httpError_1 = __importDefault(require("../utils/httpError"));
exports.UserService = {
    async getUserById(id) {
        return await prisma_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
            },
        });
    },
    async getAllUsers() {
        return await prisma_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
            },
            orderBy: { id: 'asc' },
        });
    },
    async updateUser(id, data) {
        const userExists = await prisma_1.default.user.findUnique({ where: { id } });
        if (!userExists)
            throw new httpError_1.default(404, 'No se ha encontrado al usuario', 'USER_NOT_FOUND');
        return await prisma_1.default.user.update({
            where: { id },
            data,
            select: { id: true, name: true, email: true, role: true, active: true },
        });
    },
    async toggleUserStatus(id, active) {
        const userExists = await prisma_1.default.user.findUnique({ where: { id } });
        if (!userExists)
            throw new httpError_1.default(404, 'No se ha encontrado al usuario', 'USER_NOT_FOUND');
        return await prisma_1.default.user.update({
            where: { id },
            data: { active },
            select: { id: true, name: true, email: true, role: true, active: true },
        });
    },
};
