import prisma from '../config/prisma';
import HttpError from '../utils/httpError';

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
    return await prisma.table.findMany({
      include: {
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

  async getPublicTables() {
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
      updateData.waiter_id = null;
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

      if (assignedTables >= 4) {
        throw new HttpError(
          400,
          'Ese mesero ya tiene asignadas 4 mesas como máximo',
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
