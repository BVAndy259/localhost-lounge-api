import prisma from '../config/prisma';
import HttpError from '../utils/httpError';
import { buildWaiterRotation, syncReservationsAndTables } from './reservation.service';

export const TableService = {
  async createTable(data: {
    table_number: string;
    capacity: number;
    type?: string;
    reservation_price?: number;
    description?: string;
  }) {
    const existingTable = await prisma.table.findFirst({
      where: {
        table_number: data.table_number,
      },
    });

    if (existingTable)
      throw new HttpError(
        409,
        `La mesa con el número ${data.table_number} ya existe`,
        'TABLE_EXISTS'
      );

    return await prisma.table.create({
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
    await syncReservationsAndTables();

    const tables = await prisma.table.findMany({
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

    const waiterRotation = await buildWaiterRotation(
      tables.flatMap((table) =>
        table.reservations.map((reservation) => ({
          id: reservation.id,
          table_id: table.id,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          waiter_id: reservation.waiter_id,
        }))
      )
    );

    return tables.map((table) => ({
      ...table,
      reservations: table.reservations.map((reservation) => ({
        ...reservation,
        assigned_waiter: reservation.waiter ?? waiterRotation.get(reservation.id) ?? null,
      })),
    }));
  },

  async getPublicTables() {
    await syncReservationsAndTables();

    return await prisma.table.findMany({
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

  async getTableById(id: number) {
    await syncReservationsAndTables();

    const table = await prisma.table.findUnique({
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
      throw new HttpError(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');
    }

    const waiterRotation = await buildWaiterRotation(
      table.reservations.map((reservation) => ({
        id: reservation.id,
        table_id: table.id,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        waiter_id: reservation.waiter_id,
      }))
    );

    return {
      ...table,
      reservations: table.reservations.map((reservation) => ({
        ...reservation,
        assigned_waiter: reservation.waiter ?? waiterRotation.get(reservation.id) ?? null,
      })),
    };
  },

  async updateTable(
    id: number,
    data: {
      capacity?: number;
      type?: string;
      reservation_price?: number;
      description?: string;
    }
  ) {
    const tableExists = await prisma.table.findUnique({ where: { id } });
    if (!tableExists) throw new HttpError(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');

    return await prisma.table.update({
      where: { id },
      data,
    });
  },

  async changeTableStatus(id: number, status: string, waiter_id?: number | null) {
    const tableExists = await prisma.table.findUnique({ where: { id } });
    if (!tableExists) throw new HttpError(404, 'Mesa no encontrada', 'TABLE_NOT_FOUND');
    const updateData: any = { status };

    if (status === 'LIBRE') {
      if (waiter_id != null) {
        const waiterExists = await prisma.waiter.findUnique({
          where: { id: waiter_id },
        });

        if (!waiterExists || !waiterExists.active) {
          throw new HttpError(
            400,
            'El mesero asignado no existe o está inactivo',
            'WAITER_INVALID'
          );
        }

        const assignedTables = await prisma.table.count({
          where: {
            waiter_id,
            id: { not: id },
          },
        });

        if (assignedTables >= 3) {
          throw new HttpError(
            400,
            'Ese mesero ya tiene asignadas 3 mesas como máximo',
            'WAITER_LIMIT_REACHED'
          );
        }

        updateData.waiter_id = waiter_id;
      } else {
        updateData.waiter_id = null;
      }
    } else if (waiter_id != undefined) {
      if (waiter_id !== null) {
        const waiterExists = await prisma.waiter.findUnique({
          where: { id: waiter_id },
        });
        if (!waiterExists || !waiterExists.active) {
          throw new HttpError(
            400,
            'El mesero asignado no existe o está inactivo',
            'WAITER_INVALID'
          );
        }
      }
      updateData.waiter_id = waiter_id;
    }

    if (status !== 'LIBRE' && waiter_id == null) {
      throw new HttpError(
        400,
        'Debes asignar un mesero cuando la mesa está ocupada o reservada',
        'WAITER_REQUIRED'
      );
    }

    if (waiter_id != null && status !== 'LIBRE') {
      const assignedTables = await prisma.table.count({
        where: {
          waiter_id,
          id: { not: id },
        },
      });

      if (assignedTables >= 3) {
        throw new HttpError(
          400,
          'Ese mesero ya tiene asignadas 3 mesas como máximo',
          'WAITER_LIMIT_REACHED'
        );
      }
    }

    return await prisma.table.update({
      where: { id },
      data: updateData,
      include: { waiter: { select: { id: true, name: true } } },
    });
  },

  async toggleTableActive(id: number, active: boolean) {
    const tableExists = await prisma.table.findUnique({ where: { id } });
    if (!tableExists) throw new Error('Mesa no encontrada');

    return await prisma.table.update({
      where: { id },
      data: { active },
    });
  },
};
