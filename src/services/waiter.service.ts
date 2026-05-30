import prisma from '../config/prisma';
import HttpError from '../utils/httpError';

const PERU_TIME_ZONE = 'America/Lima';

const getPeruDateKey = (date: Date) =>
  (() => {
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

const getPeruTodayKey = () => getPeruDateKey(new Date());

export const WaiterService = {
  async createWaiter(name: string, phone_number?: string | null) {
    const existingWaiter = await prisma.waiter.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existingWaiter)
      throw new HttpError(409, 'Ya hay un mesero con ese nombre registrado', 'WAITER_EXISTS');

    // If Prisma client doesn't expose the new field yet at runtime, use raw SQL as fallback
    if (phone_number) {
      const rows: any = await prisma.$queryRaw`
        INSERT INTO "waiters" (name, phone_number, active)
        VALUES (${name}, ${phone_number}, true)
        RETURNING *
      `;

      return rows[0] ?? null;
    }

    return await prisma.waiter.create({ data: { name } as any });
  },

  async getAllWaiters() {
    const waiters = await prisma.waiter.findMany({
      orderBy: { id: 'asc' },
      include: {
        reservations: {
          select: {
            id: true,
            reservation_date: true,
            status: true,
            table: {
              select: {
                id: true,
                table_number: true,
                status: true,
                active: true,
              },
            },
          },
          where: {
            status: {
              in: ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'],
            },
          },
          orderBy: [{ reservation_date: 'asc' }, { id: 'asc' }],
        },
      },
    });

    const todayKey = getPeruTodayKey();

    return waiters.map((waiter) => {
      const todayReservations = waiter.reservations.filter((reservation) => {
        const reservationDate = getPeruDateKey(reservation.reservation_date);
        return reservationDate === todayKey;
      });

      const todayTables = Array.from(
        new Map(
          todayReservations.map((reservation) => [reservation.table.id, reservation.table])
        ).values()
      );

      return {
        ...waiter,
        tables: todayTables,
        today_tables_count: todayTables.length,
        is_busy_today: todayTables.length >= 3,
      };
    });
  },

  async updateWaiter(id: number, name: string, phone_number?: string | null) {
    const waiterExists = await prisma.waiter.findUnique({ where: { id } });
    if (!waiterExists)
      throw new HttpError(404, 'No se ha encontrado el mesero', 'WAITER_NOT_FOUND');

    if (phone_number !== undefined) {
      const rows: any = await prisma.$queryRaw`
        UPDATE "waiters"
        SET name = ${name}, phone_number = ${phone_number}
        WHERE id = ${id}
        RETURNING *
      `;

      return rows[0] ?? null;
    }

    return await prisma.waiter.update({ where: { id }, data: { name } as any });
  },

  async toggleWaiterStatus(id: number, active: boolean) {
    const waiterExists = await prisma.waiter.findUnique({ where: { id } });
    if (!waiterExists)
      throw new HttpError(404, 'No se ha encontrado el mesero', 'WAITER_NOT_FOUND');

    return await prisma.waiter.update({
      where: { id },
      data: { active },
    });
  },
};
