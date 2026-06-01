"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const reservation_service_1 = require("./reservation.service");
exports.TableService = {
    async createTable(data) {
        const existingTable = await prisma_1.default.table.findFirst({
            where: {
                table_number: data.table_number,
            },
        });
        if (existingTable)
            throw new httpError_1.default(409, `La mesa con el número ${data.table_number} ya existe`, 'TABLE_EXISTS');
        return await prisma_1.default.table.create({
            data: {
                table_number: data.table_number,
                capacity: data.capacity,
                type: data.type ?? 'NORMAL',
                reservation_price: data.reservation_price ?? 0,
                description: data.description ?? `Mesa ${data.table_number}`,
            },
        });
    },
    async getAllTables() {
        await (0, reservation_service_1.syncReservationsAndTables)();
        const tables = await prisma_1.default.table.findMany({
            include: {
                waiter: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                reservations: {
                    select: {
                        id: true,
                        reservation_date: true,
                        reservation_time: true,
                        status: true,
                        waiter_id: true,
                        waiter: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        client: {
                            select: {
                                id: true,
                                name: true,
                                last_name: true,
                            },
                        },
                        receptionist: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: [{ reservation_date: 'asc' }, { reservation_time: 'asc' }],
                },
            },
            orderBy: {
                table_number: 'asc',
            },
        });
        const waiterRotation = await (0, reservation_service_1.buildWaiterRotation)(tables.flatMap((table) => table.reservations.map((reservation) => ({
            id: reservation.id,
            table_id: table.id,
            reservation_date: reservation.reservation_date,
            reservation_time: reservation.reservation_time,
            waiter_id: reservation.waiter_id,
        }))));
        return tables.map((table) => ({
            ...table,
            reservations: table.reservations.map((reservation) => ({
                ...reservation,
                assigned_waiter: reservation.waiter ?? waiterRotation.get(reservation.id) ?? null,
            })),
        }));
    },
    async getPublicTables() {
        await (0, reservation_service_1.syncReservationsAndTables)();
        return await prisma_1.default.table.findMany({
            where: { active: true },
            select: {
                id: true,
                table_number: true,
                capacity: true,
                status: true,
                active: true,
                waiter: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                table_number: 'asc',
            },
        });
    },
    async getTableById(id) {
        await (0, reservation_service_1.syncReservationsAndTables)();
        const table = await prisma_1.default.table.findUnique({
            where: { id },
            include: {
                waiter: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                reservations: {
                    select: {
                        id: true,
                        reservation_date: true,
                        reservation_time: true,
                        status: true,
                        waiter_id: true,
                        waiter: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        client: {
                            select: {
                                id: true,
                                name: true,
                                last_name: true,
                            },
                        },
                    },
                    orderBy: [{ reservation_date: 'asc' }, { reservation_time: 'asc' }],
                },
            },
        });
        if (!table) {
            throw new httpError_1.default(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');
        }
        const waiterRotation = await (0, reservation_service_1.buildWaiterRotation)(table.reservations.map((reservation) => ({
            id: reservation.id,
            table_id: table.id,
            reservation_date: reservation.reservation_date,
            reservation_time: reservation.reservation_time,
            waiter_id: reservation.waiter_id,
        })));
        return {
            ...table,
            reservations: table.reservations.map((reservation) => ({
                ...reservation,
                assigned_waiter: reservation.waiter ?? waiterRotation.get(reservation.id) ?? null,
            })),
        };
    },
    async updateTable(id, data) {
        const tableExists = await prisma_1.default.table.findUnique({ where: { id } });
        if (!tableExists)
            throw new httpError_1.default(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');
        return await prisma_1.default.table.update({
            where: { id },
            data,
        });
    },
    async changeTableStatus(id, status, waiter_id) {
        const tableExists = await prisma_1.default.table.findUnique({ where: { id } });
        if (!tableExists)
            throw new httpError_1.default(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');
        const updateData = { status };
        if (status === 'LIBRE') {
            if (waiter_id != null) {
                const waiterExists = await prisma_1.default.waiter.findUnique({
                    where: { id: waiter_id },
                });
                if (!waiterExists || !waiterExists.active) {
                    throw new httpError_1.default(400, 'El mesero asignado no existe o está inactivo', 'WAITER_INVALID');
                }
                const assignedTables = await prisma_1.default.table.count({
                    where: {
                        waiter_id,
                        id: { not: id },
                    },
                });
                if (assignedTables >= 3) {
                    throw new httpError_1.default(400, 'Ese mesero ya tiene asignadas 3 mesas como máximo', 'WAITER_LIMIT_REACHED');
                }
                updateData.waiter_id = waiter_id;
            }
            else {
                updateData.waiter_id = null;
            }
        }
        else if (waiter_id != undefined) {
            if (waiter_id !== null) {
                const waiterExists = await prisma_1.default.waiter.findUnique({
                    where: { id: waiter_id },
                });
                if (!waiterExists || !waiterExists.active) {
                    throw new httpError_1.default(400, 'El mesero asignado no existe o está inactivo', 'WAITER_INVALID');
                }
            }
            updateData.waiter_id = waiter_id;
        }
        if (status !== 'LIBRE' && waiter_id == null) {
            throw new httpError_1.default(400, 'Debes asignar un mesero cuando la mesa está ocupada o reservada', 'WAITER_REQUIRED');
        }
        if (waiter_id != null && status !== 'LIBRE') {
            const assignedTables = await prisma_1.default.table.count({
                where: {
                    waiter_id,
                    id: { not: id },
                },
            });
            if (assignedTables >= 3) {
                throw new httpError_1.default(400, 'Ese mesero ya tiene asignadas 3 mesas como máximo', 'WAITER_LIMIT_REACHED');
            }
        }
        return await prisma_1.default.table.update({
            where: { id },
            data: updateData,
            include: { waiter: { select: { id: true, name: true } } },
        });
    },
    async toggleTableActive(id, active) {
        const tableExists = await prisma_1.default.table.findUnique({ where: { id } });
        if (!tableExists)
            throw new Error('Mesa no encontrada');
        return await prisma_1.default.table.update({
            where: { id },
            data: { active },
        });
    },
};
