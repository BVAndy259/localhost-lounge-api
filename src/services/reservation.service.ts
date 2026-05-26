import prisma from '../config/prisma';
import HttpError from '../utils/httpError';

export const ReservationService = {
  async createReservation(data: {
    table_id: number;
    receptionist_id?: number;
    reservation_date: string;
    reservation_time: string;
    number_people: number;
    notes?: string;
    client_id?: number;
    client_data?: {
      name: string;
      last_name: string;
      phone_number: string;
      email: string;
    };
  }) {
    const reservationDurationMs = 120 * 60 * 1000;
    const getCategory = (totalReservations: number) => {
      if (totalReservations >= 6) return 'VIP';
      if (totalReservations >= 3) return 'FRECUENTE';
      return 'NUEVO';
    };

    const parseTime = (time: string) => {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
      if (!match) {
        throw new HttpError(400, 'Formato de hora inválido. Usa HH:MM', 'INVALID_TIME_FORMAT');
      }

      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      const totalMinutes = hours * 60 + minutes;
      return { hours, minutes, totalMinutes };
    };

    const isAllowedTime = (minutes: number) => minutes >= 18 * 60 || minutes <= 2 * 60;

    const buildDateTime = (date: Date, hours: number, minutes: number) => {
      const value = new Date(date);
      value.setHours(hours, minutes, 0, 0);
      return value;
    };

    const { hours, minutes, totalMinutes } = parseTime(data.reservation_time);
    const reservationTimeForDb = new Date(0);
    reservationTimeForDb.setHours(hours, minutes, 0, 0);

    if (!isAllowedTime(totalMinutes)) {
      throw new HttpError(
        400,
        'El horario debe estar entre 18:00 y 02:00 para confirmar una reserva',
        'INVALID_TIME'
      );
    }

    let finalClientId: number;

    if (data.client_id) {
      const clientExists = await prisma.client.findUnique({
        where: { id: data.client_id },
      });
      if (!clientExists) throw new HttpError(404, 'Cliente no encontrado', 'CLIENT_NOT_FOUND');
      const updatedTotal = clientExists.total_reservations + 1;
      await prisma.client.update({
        where: { id: clientExists.id },
        data: {
          total_reservations: updatedTotal,
          category: getCategory(updatedTotal),
        },
      });
      finalClientId = clientExists.id;
    } else if (data.client_data) {
      const normalizedPhone = data.client_data.phone_number?.trim();
      const normalizedEmail = data.client_data.email?.trim().toLowerCase();
      const orFilters = [
        ...(normalizedPhone ? [{ phone_number: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ];

      const existingClients = orFilters.length
        ? await prisma.client.findMany({
            where: {
              OR: orFilters,
            },
          })
        : [];

      if (existingClients.length > 1) {
        throw new HttpError(
          409,
          'El telefono y el correo pertenecen a clientes distintos',
          'CLIENT_CONFLICT'
        );
      }

      if (existingClients.length === 1) {
        const existingClient = existingClients[0];
        const updatedTotal = existingClient.total_reservations + 1;
        await prisma.client.update({
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
      } else {
        const newClient = await prisma.client.create({
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
    } else {
      throw new HttpError(
        400,
        'Debes proporcionar un client_id o unos client_data',
        'MISSING_CLIENT'
      );
    }

    const table = await prisma.table.findUnique({
      where: { id: data.table_id },
    });
    if (!table) throw new HttpError(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');

    if (data.number_people > table.capacity) {
      throw new HttpError(
        400,
        `Se ha superado la capacidad de la mesa. El máximo permitido es de ${table.capacity} personas.`,
        'CAPACITY_EXCEEDED'
      );
    }

    const dateToSearch = new Date(data.reservation_date);
    const existingReservations = await prisma.reservation.findMany({
      where: {
        table_id: data.table_id,
        reservation_date: dateToSearch,
        status: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
      select: {
        reservation_date: true,
        reservation_time: true,
      },
    });

    const newStart = buildDateTime(dateToSearch, hours, minutes);
    const newEnd = new Date(newStart.getTime() + reservationDurationMs);

    const hasOverlap = existingReservations.some((reservation) => {
      const existingStart = buildDateTime(
        reservation.reservation_date,
        reservation.reservation_time.getHours(),
        reservation.reservation_time.getMinutes()
      );
      const existingEnd = new Date(existingStart.getTime() + reservationDurationMs);

      return newStart < existingEnd && existingStart < newEnd;
    });

    if (hasOverlap) {
      throw new HttpError(
        409,
        'Esta mesa ya está reservada en el horario seleccionado',
        'TABLE_BUSY'
      );
    }

    return await prisma.reservation.create({
      data: {
        client_id: finalClientId,
        table_id: data.table_id,
        receptionist_id: data.receptionist_id || null,
        reservation_date: dateToSearch,
        reservation_time: reservationTimeForDb,
        number_people: data.number_people,
        notes: data.notes || '',
      },
      include: {
        client: true,
        table: true,
      },
    });
  },

  async getAllReservations() {
    return await prisma.reservation.findMany({
      include: {
        client: {
          select: {
            name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        table: { select: { table_number: true, type: true } },
        receptionist: { select: { name: true } },
      },
      orderBy: [{ reservation_date: 'asc' }, { reservation_time: 'asc' }],
    });
  },

  async updateStatus(id: number, status: string) {
    const validStatuses = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'];

    if (!validStatuses.includes(status.toUpperCase())) {
      throw new HttpError(
        400,
        `Estado no válido. Validos: ${validStatuses.join(', ')}`,
        'INVALID_STATUS'
      );
    }

    const reservationExistis = await prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservationExistis)
      throw new HttpError(404, 'Reserva no encontrada', 'RESERVATION_NOT_FOUND');

    return await prisma.reservation.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: { client: true, table: true },
    });
  },
};
