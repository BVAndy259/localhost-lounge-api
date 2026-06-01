"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlateService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const httpError_1 = __importDefault(require("../utils/httpError"));
exports.PlateService = {
    async createPlate(data) {
        const existingPlate = await prisma_1.default.plate.findFirst({
            where: {
                name: { equals: data.name, mode: 'insensitive' },
            },
        });
        if (existingPlate)
            throw new httpError_1.default(409, 'En el menú ya hay un plato con ese nombre', 'PLATE_EXISTS');
        return await prisma_1.default.plate.create({ data });
    },
    async getAllPlate() {
        return await prisma_1.default.plate.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
    },
    async getPublicPlates() {
        return await prisma_1.default.plate.findMany({
            where: { available: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
    },
    async updatePlate(id, data) {
        const plateExists = await prisma_1.default.plate.findUnique({ where: { id } });
        if (!plateExists)
            throw new httpError_1.default(404, 'Plato no encontrado', 'PLATE_NOT_FOUND');
        return await prisma_1.default.plate.update({
            where: { id },
            data,
        });
    },
    async toggleAvailability(id, available) {
        const plateExists = await prisma_1.default.plate.findUnique({ where: { id } });
        if (!plateExists)
            throw new httpError_1.default(404, 'Plato no encontrado', 'PLATE_NOT_FOUND');
        return await prisma_1.default.plate.update({
            where: { id },
            data: { available },
        });
    },
};
