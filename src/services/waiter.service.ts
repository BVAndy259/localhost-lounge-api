import prisma from '../config/prisma';
import HttpError from '../utils/httpError';

export const WaiterService = {
  async createWaiter(name: string) {
    const existingWaiter = await prisma.waiter.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existingWaiter)
      throw new HttpError(409, 'Ya hay un mesero con ese nombre registrado', 'WAITER_EXISTS');

    return await prisma.waiter.create({
      data: { name },
    });
  },

  async getAllWaiters() {
    return await prisma.waiter.findMany({
      orderBy: { id: 'asc' },
    });
  },

  async updateWaiter(id: number, name: string) {
    const waiterExists = await prisma.waiter.findUnique({ where: { id } });
    if (!waiterExists)
      throw new HttpError(404, 'No se ha encontrado el mesero', 'WAITER_NOT_FOUND');

    return await prisma.waiter.update({
      where: { id },
      data: { name },
    });
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
