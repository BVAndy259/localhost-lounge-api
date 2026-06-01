"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = exports.syncReservationsAndTables = exports.buildWaiterRotation = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const notify_1 = require("../utils/notify");
const PERU_TIME_ZONE = 'America/Lima';
const RESERVATION_DURATION_MS = 120 * 60 * 1000;
const parsePeruDate = (date) => new Date(`${date}T00:00:00-05:00`);
const getPeruDateRange = (date) => {
    const start = parsePeruDate(date);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
};
const getPeruDateKey = (date) => (() => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: PERU_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
    const month = parts.find((part) => part.type === 'month')?.value ?? '01';
    const day = parts.find((part) => part.type === 'day')?.value ?? '01';
    return `${year}-${month}-${day}`;
})();
const getDateOnlyKey = (date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
}).format(date);
const getPeruTimeKey = (date) => new Intl.DateTimeFormat('en-GB', {
    timeZone: PERU_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
}).format(date);
const getPeruTimeMinutes = (date) => {
    const timeKey = getPeruTimeKey(date);
    const [hour, minute] = timeKey.split(':').map(Number);
    return hour * 60 + minute;
};
const parseTimeToMinutes = (time) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
    if (!match) {
        throw new httpError_1.default(400, 'Formato de hora inválido. Usa HH:MM', 'INVALID_TIME_FORMAT');
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const totalMinutes = hours * 60 + minutes;
    return { hours, minutes, totalMinutes };
};
const getPeruNow = () => {
    return new Date();
};
const getReservationWindow = (reservationDate, reservationTime) => {
    const dateKey = getDateOnlyKey(reservationDate);
    const timeKey = getPeruTimeKey(reservationTime);
    const [hour, minute] = timeKey.split(':').map(Number);
    const start = new Date(`${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-05:00`);
    const end = new Date(start.getTime() + RESERVATION_DURATION_MS);
    return { start, end };
};
const selectAutoWaiterId = async () => {
    const waiters = await prisma_1.default.waiter.findMany({
        where: { active: true },
        select: {
            id: true,
        },
        orderBy: { id: 'asc' },
    });
    let selectedWaiterId = null;
    let lowestLoad = Number.POSITIVE_INFINITY;
    for (const waiter of waiters) {
        const assignedTables = await prisma_1.default.table.count({
            where: {
                waiter_id: waiter.id,
            },
        });
        if (assignedTables < 3 && assignedTables < lowestLoad) {
            lowestLoad = assignedTables;
            selectedWaiterId = waiter.id;
        }
    }
    return selectedWaiterId;
};
const assignWaiterToTableIfNeeded = async (tableId) => {
    const table = await prisma_1.default.table.findUnique({
        where: { id: tableId },
        select: {
            waiter_id: true,
        },
    });
    if (!table || table.waiter_id != null) {
        return;
    }
    const autoWaiterId = await selectAutoWaiterId();
    if (!autoWaiterId) {
        return;
    }
    const updated = await prisma_1.default.table.update({
        where: { id: tableId },
        data: { waiter_id: autoWaiterId },
        select: { id: true, table_number: true },
    });
    // Notify waiter about table assignment (best-effort)
    try {
        await (0, notify_1.sendWaiterWhatsapp)(autoWaiterId, `Se te asignó la mesa ${updated.table_number}. Revisa tus asignaciones en el sistema.`);
    }
    catch (err) {
        // no bloquear el flujo si falla la notificación
        console.warn('[notify] fallo al notificar asignación de mesa', err);
    }
};
const buildWaiterRotation = async (reservations) => {
    const waiters = await prisma_1.default.waiter.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
    });
    const waiterLoad = new Map(waiters.map((waiter) => [waiter.id, 0]));
    const assignedByReservationId = new Map();
    if (!waiters.length) {
        return assignedByReservationId;
    }
    const reservationsByDay = new Map();
    for (const reservation of reservations) {
        const dayKey = getDateOnlyKey(reservation.reservation_date);
        const nextReservations = reservationsByDay.get(dayKey) ?? [];
        nextReservations.push(reservation);
        reservationsByDay.set(dayKey, nextReservations);
    }
    for (const reservationsOfDay of reservationsByDay.values()) {
        let cursor = 0;
        for (const reservation of reservationsOfDay) {
            if (!reservation.waiter_id) {
                continue;
            }
            const waiter = waiters.find((entry) => entry.id === reservation.waiter_id);
            if (!waiter) {
                continue;
            }
            waiterLoad.set(waiter.id, (waiterLoad.get(waiter.id) ?? 0) + 1);
            assignedByReservationId.set(reservation.id, waiter);
        }
        for (const reservation of reservationsOfDay) {
            if (reservation.waiter_id) {
                continue;
            }
            let selectedWaiter = null;
            for (let offset = 0; offset < waiters.length; offset += 1) {
                const waiter = waiters[(cursor + offset) % waiters.length];
                const currentLoad = waiterLoad.get(waiter.id) ?? 0;
                if (currentLoad < 3) {
                    selectedWaiter = waiter;
                    cursor = (cursor + offset + 1) % waiters.length;
                    break;
                }
            }
            if (!selectedWaiter) {
                break;
            }
            waiterLoad.set(selectedWaiter.id, (waiterLoad.get(selectedWaiter.id) ?? 0) + 1);
            assignedByReservationId.set(reservation.id, selectedWaiter);
        }
    }
    return assignedByReservationId;
};
exports.buildWaiterRotation = buildWaiterRotation;
const formatReservationDate = (date) => new Intl.DateTimeFormat('es-PE', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
}).format(date);
const formatReservationTime = (date) => new Intl.DateTimeFormat('es-PE', {
    timeZone: PERU_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
}).format(date);
const serializeReservation = (reservation) => ({
    ...reservation,
    reservation_date: formatReservationDate(reservation.reservation_date),
    reservation_time: formatReservationTime(reservation.reservation_time),
});
const syncReservationsAndTables = async () => {
    const now = getPeruNow();
    const reservations = await prisma_1.default.reservation.findMany({
        where: {
            status: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
        },
        select: {
            id: true,
            table_id: true,
            reservation_date: true,
            reservation_time: true,
            waiter_id: true,
            status: true,
        },
    });
    const tableStateById = new Map();
    for (const reservation of reservations) {
        const { start, end } = getReservationWindow(reservation.reservation_date, reservation.reservation_time);
        if (now >= end) {
            if (reservation.status !== 'COMPLETADA') {
                await prisma_1.default.reservation.update({
                    where: { id: reservation.id },
                    data: { status: 'COMPLETADA' },
                });
            }
            continue;
        }
        if (now >= start) {
            if (reservation.status !== 'EN_CURSO') {
                await prisma_1.default.reservation.update({
                    where: { id: reservation.id },
                    data: { status: 'EN_CURSO' },
                });
            }
            tableStateById.set(reservation.table_id, 'OCUPADA');
            await assignWaiterToTableIfNeeded(reservation.table_id);
            continue;
        }
        if (!tableStateById.has(reservation.table_id)) {
            tableStateById.set(reservation.table_id, 'RESERVADA');
            await assignWaiterToTableIfNeeded(reservation.table_id);
        }
    }
    const tableIds = await prisma_1.default.table.findMany({
        select: { id: true },
    });
    await Promise.all(tableIds.map((table) => prisma_1.default.table.update({
        where: { id: table.id },
        data: { status: tableStateById.get(table.id) ?? 'LIBRE' },
    })));
    const waiterRotation = await (0, exports.buildWaiterRotation)(reservations);
    await Promise.all(reservations.map(async (reservation) => {
        if (reservation.waiter_id != null) {
            return;
        }
        const assignedWaiter = waiterRotation.get(reservation.id);
        if (assignedWaiter) {
            const updated = await prisma_1.default.reservation.update({
                where: { id: reservation.id },
                data: { waiter_id: assignedWaiter.id },
                include: { table: { select: { table_number: true } } },
            });
            try {
                await (0, notify_1.sendWaiterWhatsapp)(assignedWaiter.id, `Se te asignó la mesa ${updated.table.table_number} para una reserva. Revisa tus asignaciones.`);
            }
            catch (err) {
                console.warn('[notify] fallo al notificar asignación de reserva', err);
            }
        }
    }));
};
exports.syncReservationsAndTables = syncReservationsAndTables;
exports.ReservationService = {
    async createReservation(data) {
        const getCategory = (totalReservations) => {
            if (totalReservations >= 6)
                return 'VIP';
            if (totalReservations >= 3)
                return 'FRECUENTE';
            return 'NUEVO';
        };
        const isAllowedTime = (minutes) => minutes >= 18 * 60 || minutes <= 2 * 60;
        const { hours, minutes, totalMinutes } = parseTimeToMinutes(data.reservation_time);
        const reservationTimeForDb = new Date(`1970-01-01T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`);
        if (!isAllowedTime(totalMinutes)) {
            throw new httpError_1.default(400, 'El horario debe estar entre 18:00 y 02:00 para confirmar una reserva', 'INVALID_TIME');
        }
        const table = await prisma_1.default.table.findUnique({
            where: { id: data.table_id },
        });
        if (!table)
            throw new httpError_1.default(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');
        if (data.number_people > table.capacity) {
            throw new httpError_1.default(400, `Se ha superado la capacidad de la mesa. El máximo permitido es de ${table.capacity} personas.`, 'CAPACITY_EXCEEDED');
        }
        const dateToSearch = parsePeruDate(data.reservation_date);
        const { start: dayStart, end: dayEnd } = getPeruDateRange(data.reservation_date);
        const existingReservations = await prisma_1.default.reservation.findMany({
            where: {
                table_id: data.table_id,
                reservation_date: {
                    gte: dayStart,
                    lt: dayEnd,
                },
                status: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
            },
            select: {
                reservation_date: true,
                reservation_time: true,
                status: true,
            },
        });
        const newStart = new Date(`${data.reservation_date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`);
        const newStartMinutes = totalMinutes;
        const newEndMinutes = newStartMinutes + 120;
        const hasOverlap = existingReservations.some((reservation) => {
            const existingStartMinutes = getPeruTimeMinutes(reservation.reservation_time);
            const existingEndMinutes = existingStartMinutes + 120;
            return newStartMinutes < existingEndMinutes && existingStartMinutes < newEndMinutes;
        });
        if (hasOverlap) {
            throw new httpError_1.default(409, 'Esta mesa ya está reservada en el horario seleccionado', 'TABLE_BUSY');
        }
        let finalClientId;
        if (data.client_id) {
            const clientExists = await prisma_1.default.client.findUnique({
                where: { id: data.client_id },
            });
            if (!clientExists)
                throw new httpError_1.default(404, 'Cliente no encontrado', 'CLIENT_NOT_FOUND');
            const updatedTotal = clientExists.total_reservations + 1;
            await prisma_1.default.client.update({
                where: { id: clientExists.id },
                data: {
                    total_reservations: updatedTotal,
                    category: getCategory(updatedTotal),
                },
            });
            finalClientId = clientExists.id;
        }
        else if (data.client_data) {
            const normalizedPhone = data.client_data.phone_number?.trim();
            const normalizedEmail = data.client_data.email?.trim().toLowerCase();
            const orFilters = [
                ...(normalizedPhone ? [{ phone_number: normalizedPhone }] : []),
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ];
            const existingClients = orFilters.length
                ? await prisma_1.default.client.findMany({
                    where: {
                        OR: orFilters,
                    },
                })
                : [];
            if (existingClients.length > 1) {
                throw new httpError_1.default(409, 'El telefono y el correo pertenecen a clientes distintos', 'CLIENT_CONFLICT');
            }
            if (existingClients.length === 1) {
                const existingClient = existingClients[0];
                const updatedTotal = existingClient.total_reservations + 1;
                await prisma_1.default.client.update({
                    where: { id: existingClient.id },
                    data: {
                        name: data.client_data.name,
                        last_name: data.client_data.last_name,
                        phone_number: normalizedPhone || existingClient.phone_number,
                        email: normalizedEmail || existingClient.email,
                        total_reservations: updatedTotal,
                        category: getCategory(updatedTotal),
                    },
                });
                finalClientId = existingClient.id;
            }
            else {
                const newClient = await prisma_1.default.client.create({
                    data: {
                        name: data.client_data.name,
                        last_name: data.client_data.last_name,
                        phone_number: normalizedPhone || data.client_data.phone_number,
                        email: normalizedEmail || data.client_data.email,
                        total_reservations: 1,
                        category: getCategory(1),
                    },
                });
                finalClientId = newClient.id;
            }
        }
        else {
            throw new httpError_1.default(400, 'Debes proporcionar un client_id o unos client_data', 'MISSING_CLIENT');
        }
        const newReservation = await prisma_1.default.reservation.create({
            data: {
                client_id: finalClientId,
                table_id: data.table_id,
                receptionist_id: data.receptionist_id ?? null,
                reservation_date: dateToSearch,
                reservation_time: reservationTimeForDb,
                number_people: data.number_people,
                notes: data.notes || '',
                status: data.status ?? 'CONFIRMADA',
            },
            include: {
                client: true,
                table: true,
                waiter: true,
            },
        });
        await (0, exports.syncReservationsAndTables)();
        return serializeReservation(newReservation);
    },
    async getAllReservations() {
        await (0, exports.syncReservationsAndTables)();
        const reservations = await prisma_1.default.reservation.findMany({
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                table: { select: { table_number: true, type: true } },
                receptionist: { select: { name: true } },
                waiter: { select: { id: true, name: true } },
            },
            orderBy: [{ reservation_date: 'asc' }, { reservation_time: 'asc' }],
        });
        const waiterRotation = await (0, exports.buildWaiterRotation)(reservations.map((reservation) => ({
            id: reservation.id,
            table_id: reservation.table_id,
            reservation_date: reservation.reservation_date,
            reservation_time: reservation.reservation_time,
            waiter_id: reservation.waiter_id,
        })));
        return reservations.map((reservation) => ({
            ...serializeReservation(reservation),
            assigned_waiter: waiterRotation.get(reservation.id) ?? null,
        }));
    },
    async updateStatus(id, status) {
        const validStatuses = [
            'PENDIENTE',
            'CONFIRMADA',
            'EN_CURSO',
            'CANCELADA',
            'COMPLETADA',
        ];
        const normalizedStatus = status.toUpperCase();
        if (!validStatuses.includes(normalizedStatus)) {
            throw new httpError_1.default(400, `Estado no válido. Validos: ${validStatuses.join(', ')}`, 'INVALID_STATUS');
        }
        if (normalizedStatus === 'COMPLETADA') {
            throw new httpError_1.default(400, 'La reserva se completa automáticamente al terminar su horario', 'MANUAL_COMPLETION_NOT_ALLOWED');
        }
        const reservationExistis = await prisma_1.default.reservation.findUnique({
            where: { id },
        });
        if (!reservationExistis)
            throw new httpError_1.default(404, 'Reserva no encontrada', 'RESERVATION_NOT_FOUND');
        if (reservationExistis.status === 'COMPLETADA') {
            throw new httpError_1.default(400, 'No se puede modificar el estado de una reserva ya completada', 'RESERVATION_COMPLETED');
        }
        const updatedReservation = await prisma_1.default.reservation.update({
            where: { id },
            data: { status: normalizedStatus },
            include: { client: true, table: true },
        });
        await (0, exports.syncReservationsAndTables)();
        return serializeReservation(updatedReservation);
    },
    async assignWaiterToReservation(reservationId, waiterId) {
        const reservation = await prisma_1.default.reservation.findUnique({
            where: { id: reservationId },
            select: {
                id: true,
                reservation_date: true,
            },
        });
        if (!reservation) {
            throw new httpError_1.default(404, 'Reserva no encontrada', 'RESERVATION_NOT_FOUND');
        }
        const waiter = await prisma_1.default.waiter.findUnique({
            where: { id: waiterId },
        });
        if (!waiter || !waiter.active) {
            throw new httpError_1.default(400, 'El mesero asignado no existe o está inactivo', 'WAITER_INVALID');
        }
        const dayStart = parsePeruDate(getDateOnlyKey(reservation.reservation_date));
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const sameDayReservations = await prisma_1.default.reservation.findMany({
            where: {
                waiter_id: waiterId,
                reservation_date: {
                    gte: dayStart,
                    lt: dayEnd,
                },
                status: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
                id: { not: reservationId },
            },
            select: { id: true },
        });
        if (sameDayReservations.length >= 3) {
            throw new httpError_1.default(400, 'Ese mesero ya tiene asignadas 3 reservas como máximo para ese día', 'WAITER_LIMIT_REACHED');
        }
        const updatedReservation = await prisma_1.default.reservation.update({
            where: { id: reservationId },
            data: { waiter_id: waiterId },
            include: {
                client: true,
                table: true,
                waiter: { select: { id: true, name: true } },
            },
        });
        try {
            await (0, notify_1.sendWaiterWhatsapp)(waiterId, `Te asignaron la mesa ${updatedReservation.table.table_number} para la reserva ${formatReservationDate(updatedReservation.reservation_date)} ${formatReservationTime(updatedReservation.reservation_time)}`);
        }
        catch (err) {
            console.warn('[notify] fallo al notificar asignación manual', err);
        }
        await (0, exports.syncReservationsAndTables)();
        return serializeReservation(updatedReservation);
    },
    async getAvailableSlots(date, guests) {
        const dayStart = parsePeruDate(date);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const tables = await prisma_1.default.table.findMany({
            where: { active: true, capacity: { gte: guests }, status: { not: 'OCUPADA' } },
            select: {
                id: true,
                table_number: true,
                capacity: true,
                type: true,
                description: true,
                reservation_price: true,
            },
        });
        if (!tables.length)
            return [];
        const tableIds = tables.map((t) => t.id);
        const existingReservations = await prisma_1.default.reservation.findMany({
            where: {
                table_id: { in: tableIds },
                reservation_date: { gte: dayStart, lt: dayEnd },
                status: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
            },
            select: { table_id: true, reservation_time: true },
        });
        const OPEN = 18 * 60;
        const CLOSE = 24 * 60 + 2 * 60;
        const DURATION = 120;
        const INTERVAL = 30;
        const slots = [];
        for (let m = OPEN; m + DURATION <= CLOSE; m += INTERVAL) {
            const availableTables = tables.filter((table) => {
                const hasOverlap = existingReservations
                    .filter((r) => r.table_id === table.id)
                    .some((r) => {
                    const startMin = getPeruTimeMinutes(r.reservation_time);
                    return m < startMin + DURATION && startMin < m + DURATION;
                });
                return !hasOverlap;
            });
            if (availableTables.length > 0) {
                const h = Math.floor(m / 60);
                const min = m % 60;
                const time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                slots.push({ time, tables: availableTables });
            }
        }
        return slots;
    },
    async findAvailableTable(date, time, guests) {
        const dayStart = parsePeruDate(date);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const { totalMinutes: timeMinutes } = parseTimeToMinutes(time);
        const tables = await prisma_1.default.table.findMany({
            where: { active: true, capacity: { gte: guests }, status: { not: 'OCUPADA' } },
            orderBy: { capacity: 'asc' },
        });
        for (const table of tables) {
            const existing = await prisma_1.default.reservation.findMany({
                where: {
                    table_id: table.id,
                    reservation_date: { gte: dayStart, lt: dayEnd },
                    status: { in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'] },
                },
                select: { reservation_time: true },
            });
            const hasOverlap = existing.some((res) => {
                const startMin = getPeruTimeMinutes(res.reservation_time);
                return timeMinutes < startMin + 120 && startMin < timeMinutes + 120;
            });
            if (!hasOverlap)
                return table;
        }
        return null;
    },
};
