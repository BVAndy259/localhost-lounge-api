import prisma from '../config/prisma';
import { ReservationService } from './reservation.service';
import { logger } from '../utils/logger';

export const ChatService = {
  async executeAction(
    aiResponse: any,
    session: any,
    clientId: number | undefined,
    userRole: string,
    rawMessage: string
  ) {
    const isWorker = userRole === 'RECEPCIONISTA' || userRole === 'ADMIN';
    const normalizedMessage = rawMessage.toLowerCase();

    if (isWorker && aiResponse.action === 'REPLY') {
      if (normalizedMessage.includes('dashboard') || normalizedMessage.includes('resumen')) {
        aiResponse.action = 'SHOW_DASHBOARD';
        aiResponse.payload = {};
      } else if (normalizedMessage.match(/reserva/)) {
        const numericMatch = rawMessage.match(/\d+/);
        aiResponse.action = 'FIND_RESERVATION';
        aiResponse.payload = { search_term: numericMatch ? numericMatch[0] : rawMessage.trim() };
      } else if (normalizedMessage.match(/mesa/)) {
        aiResponse.action = 'RENDER_TABLE_STATUS';
        aiResponse.payload = {};
      }
    }

    switch (aiResponse.action) {
      case 'SHOW_MENU': {
        const { category, plate_name } = aiResponse.payload;
        const whereClause: any = { available: true };
        if (category) whereClause.category = { contains: category, mode: 'insensitive' };
        if (plate_name) whereClause.name = { contains: plate_name, mode: 'insensitive' };

        const plates = await prisma.plate.findMany({ where: whereClause });
        aiResponse.payload.plates = plates;
        if (plates.length === 0)
          aiResponse.reply = 'No encontré opciones exactas, pero revisa el menú completo.';
        break;
      }

      case 'SHOW_RESERVATION_FORM': {
        const { people, type } = aiResponse.payload;
        const whereClause: any = { status: 'LIBRE', active: true };
        if (people && !isNaN(parseInt(people))) whereClause.capacity = { gte: parseInt(people) };
        if (type) whereClause.type = type.toUpperCase();

        const tables = await prisma.table.findMany({ where: whereClause });
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

        const [
          totalTables,
          activeTables,
          freeTables,
          occupiedTables,
          reservationsToday,
          pendingReservations,
        ] = await Promise.all([
          prisma.table.count(),
          prisma.table.count({ where: { active: true } }),
          prisma.table.count({ where: { active: true, status: 'LIBRE' } }),
          prisma.table.count({ where: { active: true, status: 'OCUPADO' } }),
          prisma.reservation.count({ where: { reservation_date: { gte: start, lt: end } } }),
          prisma.reservation.count({ where: { status: 'PENDIENTE' } }),
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
        aiResponse.payload.tables = await prisma.table.findMany({
          orderBy: { table_number: 'asc' },
          include: { waiter: true },
        });
        break;
      }

      case 'HUMAN_INTERVENTION': {
        if (clientId) {
          const activeReservation = await prisma.reservation.findFirst({
            where: { client_id: clientId, status: 'PENDIENTE' },
            orderBy: { created_on: 'desc' },
          });
          if (activeReservation) {
            await prisma.reservation.update({
              where: { id: activeReservation.id },
              data: { support_required: true },
            });
            logger.info(`[WEB ALERT] Reserva ${activeReservation.id} requiere atención.`);
          }
        }
        break;
      }
    }

    return aiResponse;
  },
};
