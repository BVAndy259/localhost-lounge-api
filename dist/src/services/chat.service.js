"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const reservation_service_1 = require("./reservation.service");
const notify_1 = require("../utils/notify");
const logger_1 = require("../utils/logger");
exports.ChatService = {
    async executeAction(aiResponse, session, clientId, userRole, rawMessage) {
        const isWorker = userRole === 'RECEPCIONISTA' || userRole === 'ADMIN';
        const normalizedMessage = rawMessage.toLowerCase();
        if (isWorker && aiResponse.action === 'REPLY') {
            if (normalizedMessage.includes('dashboard') ||
                normalizedMessage.includes('resumen') ||
                normalizedMessage.includes('reporte') ||
                normalizedMessage.includes('reportes')) {
                aiResponse.action = 'SHOW_DASHBOARD';
                aiResponse.payload = {};
            }
            else if (normalizedMessage.match(/reserva/)) {
                const numericMatch = rawMessage.match(/\d+/);
                aiResponse.action = 'FIND_RESERVATION';
                aiResponse.payload = { search_term: numericMatch ? numericMatch[0] : rawMessage.trim() };
            }
            else if (normalizedMessage.match(/mesa/)) {
                aiResponse.action = 'RENDER_TABLE_STATUS';
                aiResponse.payload = {};
            }
        }
        if (aiResponse.action === 'PREFILL_RESERVATION') {
            const reservationDate = aiResponse.payload?.reservation_date;
            const reservationTime = aiResponse.payload?.reservation_time;
            const guests = Number(aiResponse.payload?.number_people);
            if (reservationDate && reservationTime && Number.isFinite(guests)) {
                const availableSlots = await reservation_service_1.ReservationService.getAvailableSlots(reservationDate, guests);
                const matchingSlot = availableSlots.find((slot) => slot.time === reservationTime);
                if (matchingSlot) {
                    aiResponse.payload = {
                        ...aiResponse.payload,
                        available_tables: matchingSlot.tables,
                    };
                    aiResponse.reply =
                        '¡Excelente! Tengo todos tus datos listos. Tengo estas mesas disponibles, elige una con clic o escríbeme el número.';
                }
                else {
                    aiResponse.payload = {
                        ...aiResponse.payload,
                        available_tables: [],
                    };
                    aiResponse.reply =
                        '¡Excelente! Tengo todos tus datos listos. No encontré mesas disponibles para esa hora, prueba con otro horario o escríbeme otra fecha.';
                }
            }
        }
        switch (aiResponse.action) {
            case 'SHOW_MENU': {
                const { category, plate_name } = aiResponse.payload;
                const whereClause = { available: true };
                if (category)
                    whereClause.category = { contains: category, mode: 'insensitive' };
                if (plate_name)
                    whereClause.name = { contains: plate_name, mode: 'insensitive' };
                const plates = await prisma_1.default.plate.findMany({ where: whereClause });
                aiResponse.payload.plates = plates;
                if (plates.length === 0)
                    aiResponse.reply = 'No encontré opciones exactas, pero revisa el menú completo.';
                break;
            }
            case 'SHOW_RESERVATION_FORM': {
                const { people, type } = aiResponse.payload;
                const whereClause = { status: 'LIBRE', active: true };
                if (people && !isNaN(parseInt(people)))
                    whereClause.capacity = { gte: parseInt(people) };
                if (type)
                    whereClause.type = type.toUpperCase();
                const tables = await prisma_1.default.table.findMany({ where: whereClause });
                aiResponse.payload.available_tables = tables;
                if (tables.length === 0)
                    aiResponse.reply = 'Lo siento, no hay mesas disponibles con esos criterios.';
                break;
            }
            case 'SHOW_DASHBOARD': {
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setDate(end.getDate() + 1);
                const [totalTables, activeTables, freeTables, occupiedTables, reservationsToday, pendingReservations,] = await Promise.all([
                    prisma_1.default.table.count(),
                    prisma_1.default.table.count({ where: { active: true } }),
                    prisma_1.default.table.count({ where: { active: true, status: 'LIBRE' } }),
                    prisma_1.default.table.count({ where: { active: true, status: 'OCUPADO' } }),
                    prisma_1.default.reservation.count({ where: { reservation_date: { gte: start, lt: end } } }),
                    prisma_1.default.reservation.count({ where: { status: 'PENDIENTE' } }),
                ]);
                aiResponse.payload.dashboard = {
                    tables: {
                        total: totalTables,
                        active: activeTables,
                        libres: freeTables,
                        ocupadas: occupiedTables,
                    },
                    reservations: { today_total: reservationsToday, pending: pendingReservations },
                };
                break;
            }
            case 'RENDER_TABLE_STATUS': {
                aiResponse.payload.tables = await prisma_1.default.table.findMany({
                    orderBy: { table_number: 'asc' },
                    include: { waiter: true },
                });
                break;
            }
            case 'SHOW_RESERVATIONS': {
                const reservations = await prisma_1.default.reservation.findMany({
                    orderBy: { created_on: 'desc' },
                    take: 20,
                    include: { client: true, table: true },
                });
                aiResponse.payload.reservations = reservations;
                if (reservations.length === 0)
                    aiResponse.reply = 'No hay reservas registradas.';
                break;
            }
            case 'SHOW_ORDERS': {
                const orders = await prisma_1.default.order.findMany({
                    orderBy: { created_on: 'desc' },
                    take: 20,
                    include: { waiter: true, table: true },
                });
                aiResponse.payload.orders = orders;
                if (orders.length === 0)
                    aiResponse.reply = 'No hay órdenes registradas.';
                break;
            }
            case 'SHOW_WAITERS': {
                const waiters = await prisma_1.default.waiter.findMany({ orderBy: { name: 'asc' } });
                aiResponse.payload.waiters = waiters;
                if (waiters.length === 0)
                    aiResponse.reply = 'No hay meseros registrados.';
                break;
            }
            case 'CREATE_WAITER': {
                const { name, phone_number } = aiResponse.payload;
                const waiter = await prisma_1.default.waiter.create({
                    data: { name, phone_number: phone_number || null },
                });
                aiResponse.reply = `Mesero ${waiter.name} creado correctamente.`;
                aiResponse.payload = { waiter };
                break;
            }
            case 'CREATE_PLATE': {
                if (userRole !== 'ADMIN') {
                    aiResponse.action = 'REPLY';
                    aiResponse.reply = 'No tienes permisos de administrador para crear platos.';
                    aiResponse.payload = {};
                    break;
                }
                const plate = await prisma_1.default.plate.create({
                    data: {
                        name: aiResponse.payload.name,
                        price: aiResponse.payload.price,
                        category: aiResponse.payload.category.toUpperCase(),
                        description: aiResponse.payload.description || null,
                    },
                });
                aiResponse.reply = `Plato ${plate.name} creado correctamente.`;
                aiResponse.payload = { plate };
                break;
            }
            case 'CREATE_TABLE': {
                if (userRole !== 'ADMIN') {
                    aiResponse.action = 'REPLY';
                    aiResponse.reply = 'No tienes permisos de administrador para crear mesas.';
                    aiResponse.payload = {};
                    break;
                }
                const table = await prisma_1.default.table.create({
                    data: {
                        table_number: aiResponse.payload.table_number,
                        capacity: Number(aiResponse.payload.capacity),
                        type: aiResponse.payload.type?.toUpperCase() || 'ESTANDAR',
                        description: aiResponse.payload.description || '',
                    },
                });
                aiResponse.reply = `Mesa #${table.table_number} creada correctamente.`;
                aiResponse.payload = { table };
                break;
            }
            case 'NOTIFY_WAITERS': {
                const notifyResult = await (0, notify_1.notifyAllWaiters)();
                aiResponse.payload = notifyResult;
                if (notifyResult.total === 0) {
                    aiResponse.reply = 'No hay meseros activos registrados.';
                }
                else if (notifyResult.failed.length === 0) {
                    aiResponse.reply = `Notificación enviada a todos los meseros (${notifyResult.sent} mensajes).`;
                }
                else {
                    const failedNames = notifyResult.failed.map((f) => f.name).join(', ');
                    aiResponse.reply = `Notificación enviada a ${notifyResult.sent} mesero(s). Falló con: ${failedNames}.`;
                }
                break;
            }
            case 'UPDATE_PLATE':
            case 'UPDATE_TABLE':
            case 'MANAGE_USERS': {
                if (userRole !== 'ADMIN') {
                    aiResponse.action = 'REPLY';
                    aiResponse.reply = 'No tienes permisos de administrador para realizar esa acción.';
                    aiResponse.payload = {};
                }
                break;
            }
            case 'HUMAN_INTERVENTION': {
                if (clientId) {
                    const activeReservation = await prisma_1.default.reservation.findFirst({
                        where: { client_id: clientId, status: 'PENDIENTE' },
                        orderBy: { created_on: 'desc' },
                    });
                    if (activeReservation) {
                        await prisma_1.default.reservation.update({
                            where: { id: activeReservation.id },
                            data: { support_required: true },
                        });
                        logger_1.logger.info(`[WEB ALERT] Reserva ${activeReservation.id} requiere atención.`);
                    }
                }
                break;
            }
        }
        return aiResponse;
    },
};
