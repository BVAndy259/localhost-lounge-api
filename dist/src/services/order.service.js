"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const ORDER_FLOW = {
    PENDIENTE: ['PREPARANDO'],
    PREPARANDO: ['LISTO'],
    LISTO: ['SERVIDO'],
    SERVIDO: [],
    PAGADO: [],
};
const ORDER_TIME_ZONE = 'America/Lima';
const getLimaDateKey = (date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: ORDER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
}).format(date);
const getLimaDayRange = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map((value) => Number(value));
    if ([year, month, day].some((value) => Number.isNaN(value))) {
        throw new httpError_1.default(400, 'Formato de fecha no válido. Usa YYYY-MM-DD', 'INVALID_DATE');
    }
    const start = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59, 999));
    return { start, end };
};
exports.OrderService = {
    async getOrders(filters) {
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        else if (!filters?.includePaid) {
            where.status = { not: 'PAGADO' };
        }
        const targetDate = filters?.date ?? getLimaDateKey(new Date());
        const { start: startOfDay, end: endOfDay } = getLimaDayRange(targetDate);
        where.created_on = {
            gte: startOfDay,
            lte: endOfDay,
        };
        return await prisma_1.default.order.findMany({
            where,
            include: {
                client: true,
                items: { include: { plate: true } },
                table: true,
                waiter: true,
                receipt: true,
            },
            orderBy: [{ status: 'asc' }, { created_on: 'desc' }],
        });
    },
    async getActiveByTable(table_id) {
        const table = await prisma_1.default.table.findUnique({ where: { id: table_id } });
        if (!table)
            throw new httpError_1.default(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');
        return await prisma_1.default.order.findFirst({
            where: {
                table_id,
                status: { not: 'PAGADO' },
            },
            include: {
                client: true,
                items: { include: { plate: true } },
                table: true,
                waiter: true,
                receipt: true,
            },
            orderBy: { created_on: 'desc' },
        });
    },
    async createOrder(data) {
        if (data.client_id !== undefined && data.client_id !== null) {
            const client = await prisma_1.default.client.findUnique({ where: { id: data.client_id } });
            if (!client)
                throw new httpError_1.default(404, 'Cliente no encontrado', 'CLIENT_NOT_FOUND');
        }
        const table = await prisma_1.default.table.findUnique({ where: { id: data.table_id } });
        if (!table)
            throw new httpError_1.default(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');
        if (!table.active)
            throw new httpError_1.default(400, 'La mesa está inactiva', 'TABLE_INACTIVE');
        if (table.status === 'OCUPADA')
            throw new httpError_1.default(400, 'La mesa ya está ocupada', 'TABLE_OCCUPIED');
        const waiter = await prisma_1.default.waiter.findUnique({ where: { id: data.waiter_id } });
        if (!waiter || !waiter.active) {
            throw new httpError_1.default(400, 'El mesero asignado no existe o está inactivo', 'WAITER_INVALID');
        }
        const openOrder = await prisma_1.default.order.findFirst({
            where: {
                table_id: data.table_id,
                status: { not: 'PAGADO' },
            },
        });
        if (openOrder) {
            throw new httpError_1.default(400, 'La mesa ya tiene una orden activa. Cierra la comanda antes de abrir otra.', 'OPEN_ORDER_EXISTS');
        }
        return await prisma_1.default.$transaction(async (tx) => {
            await tx.table.update({
                where: { id: data.table_id },
                data: {
                    status: 'OCUPADA',
                    waiter_id: data.waiter_id,
                },
            });
            return await tx.order.create({
                data: {
                    client_id: data.client_id ?? null,
                    table_id: data.table_id,
                    waiter_id: data.waiter_id,
                    status: 'PENDIENTE',
                    items: data.items && data.items.length > 0
                        ? {
                            create: await (async () => {
                                const items = data.items;
                                const orderItems = [];
                                for (const item of data.items || []) {
                                    const plate = await tx.plate.findUnique({ where: { id: item.plate_id } });
                                    if (!plate) {
                                        throw new httpError_1.default(400, 'Uno o más platos no existen en la carta', 'INVALID_PLATES');
                                    }
                                    if (!plate.available) {
                                        throw new httpError_1.default(400, `El plato ${plate.name} no está disponible actualmente`, 'PLATE_UNAVAILABLE');
                                    }
                                    orderItems.push({
                                        plate_id: item.plate_id,
                                        quantity: item.quantity,
                                        price: Number(plate.price),
                                        notes: item.notes,
                                    });
                                }
                                return orderItems;
                            })(),
                        }
                        : undefined,
                },
                include: {
                    client: true,
                    table: true,
                    waiter: true,
                    items: { include: { plate: true } },
                },
            });
        });
    },
    async deleteItemFromOrder(order_id, item_id) {
        const order = await prisma_1.default.order.findUnique({
            where: { id: order_id },
            include: { items: true },
        });
        if (!order)
            throw new httpError_1.default(404, 'Orden no encontrada', 'ORDER_NOT_FOUND');
        if (order.status === 'PAGADO')
            throw new httpError_1.default(400, 'No puedes modificar una orden pagada', 'ORDER_CLOSED');
        const item = order.items.find((i) => i.id === item_id);
        if (!item)
            throw new httpError_1.default(404, 'Plato no encontrado en la orden', 'ORDER_ITEM_NOT_FOUND');
        await prisma_1.default.order_Item.delete({ where: { id: item_id } });
        return await this.getOrderDetails(order_id);
    },
    async cancelOrder(order_id) {
        const order = await prisma_1.default.order.findUnique({
            where: { id: order_id },
            include: { receipt: true, items: true, table: true },
        });
        if (!order)
            throw new httpError_1.default(404, 'Orden no encontrada', 'ORDER_NOT_FOUND');
        if (order.receipt || order.status === 'PAGADO') {
            throw new httpError_1.default(400, 'No puedes cancelar una orden pagada', 'ORDER_CLOSED');
        }
        if (!['PENDIENTE', 'PREPARANDO'].includes(order.status)) {
            throw new httpError_1.default(400, 'Solo puedes cancelar órdenes en estado PENDIENTE o PREPARANDO', 'ORDER_CANNOT_CANCEL');
        }
        return await prisma_1.default.$transaction(async (tx) => {
            if (order.table_id) {
                await tx.table.update({
                    where: { id: order.table_id },
                    data: { status: 'LIBRE' },
                });
            }
            await tx.order.delete({ where: { id: order_id } });
            return { id: order_id, cancelled: true };
        });
    },
    async addItemsToOrder(order_id, items) {
        const order = await prisma_1.default.order.findUnique({ where: { id: order_id } });
        if (!order)
            throw new httpError_1.default(404, 'Orden no encontrada', 'ORDER_NOT_FOUND');
        if (order.status === 'PAGADO')
            throw new httpError_1.default(400, 'No se pueden añadir platos a una orden pagada', 'ORDER_CLOSED');
        const plateIds = items.map((i) => i.plate_id);
        const plates = await prisma_1.default.plate.findMany({ where: { id: { in: plateIds } } });
        if (plates.length !== new Set(plateIds).size) {
            throw new httpError_1.default(400, 'Uno o más platos no existen en la carta', 'INVALID_PLATES');
        }
        const unavailablePlate = plates.find((plate) => !plate.available);
        if (unavailablePlate) {
            throw new httpError_1.default(400, `El plato ${unavailablePlate.name} no está disponible actualmente`, 'PLATE_UNAVAILABLE');
        }
        const orderItemsData = items.map((item) => {
            const plate = plates.find((p) => p.id === item.plate_id);
            return {
                order_id,
                plate_id: item.plate_id,
                quantity: item.quantity,
                price: Number(plate.price),
                notes: item.notes,
            };
        });
        return await prisma_1.default.order_Item.createMany({
            data: orderItemsData,
        });
    },
    async getOrderDetails(id) {
        const order = await prisma_1.default.order.findUnique({
            where: { id },
            include: {
                client: true,
                items: { include: { plate: true } },
                table: true,
                waiter: true,
                receipt: true,
            },
        });
        if (!order)
            throw new httpError_1.default(404, 'Orden no encontrada', 'ORDER_NOT_FOUND');
        return order;
    },
    async updateStatus(id, status) {
        const order = await prisma_1.default.order.findUnique({ where: { id } });
        if (!order)
            throw new httpError_1.default(404, 'Orden no encontrada', 'ORDER_NOT_FOUND');
        if (status === 'PAGADO') {
            throw new httpError_1.default(400, 'No puedes marcar PAGADO manualmente. Usa checkout para cerrar la orden.', 'USE_CHECKOUT');
        }
        if (order.status === 'PAGADO') {
            throw new httpError_1.default(400, 'No puedes modificar una orden pagada', 'ORDER_CLOSED');
        }
        if (status === order.status) {
            return order;
        }
        const nextAllowedStatuses = ORDER_FLOW[order.status];
        if (!nextAllowedStatuses.includes(status)) {
            throw new httpError_1.default(400, `Transición de estado no válida: ${order.status} -> ${status}`, 'INVALID_STATUS_TRANSITION');
        }
        return await prisma_1.default.order.update({
            where: { id },
            data: { status },
        });
    },
    async checkout(order_id, payment_method, reservation_cost) {
        const order = await this.getOrderDetails(order_id);
        if (order.status === 'PAGADO' || order.receipt) {
            throw new httpError_1.default(400, 'Esta orden ya ha sido pagada', 'ALREADY_PAID');
        }
        if (order.items.length === 0) {
            throw new httpError_1.default(400, 'No puedes cerrar una orden sin platos', 'EMPTY_ORDER');
        }
        const itemsTotal = order.items.reduce((total, item) => {
            return total + Number(item.price) * item.quantity;
        }, 0);
        const reservationCost = reservation_cost === undefined ? 0 : Math.max(0, Number(reservation_cost));
        const taxableTotal = itemsTotal + reservationCost;
        const igvTotal = taxableTotal * 0.18;
        const finalTotal = taxableTotal + igvTotal;
        return await prisma_1.default.$transaction(async (tx) => {
            const receipt = await tx.receipt.create({
                data: {
                    order_id: order.id,
                    reservation_cost: reservationCost,
                    items_total: itemsTotal,
                    final_total: finalTotal,
                    payment_method,
                },
            });
            await tx.order.update({
                where: { id: order.id },
                data: { status: 'PAGADO' },
            });
            await tx.table.update({
                where: { id: order.table.id },
                data: { status: 'LIBRE' },
            });
            const reservationWhere = order.client_id
                ? {
                    table_id: order.table.id,
                    client_id: order.client_id,
                    status: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
                }
                : {
                    table_id: order.table.id,
                    status: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
                };
            await tx.reservation.updateMany({
                where: reservationWhere,
                data: { status: 'COMPLETADA' },
            });
            return receipt;
        });
    },
};
