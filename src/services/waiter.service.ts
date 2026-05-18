import prisma from "../config/prisma";

export const WaiterService = {
  async createWaiter(name: string) {
    const existingWaiter = await prisma.waiter.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existingWaiter)
      throw new Error("Ya hay un mesero con ese nombre registrado");

    return await prisma.waiter.create({
      data: { name },
    });
  },

  async getAllWaiters() {
    return await prisma.waiter.findMany({
      orderBy: { id: "asc" },
    });
  },

  async updateWaiter(id: number, name: string) {
    const waiterExists = await prisma.waiter.findUnique({ where: { id } });
    if (!waiterExists) throw new Error("No se ha encontrado el mesero");

    return await prisma.waiter.update({
      where: { id },
      data: { name },
    });
  },

  async toggleWaiterStatus(id: number, active: boolean) {
    const waiterExists = await prisma.waiter.findUnique({ where: { id } });
    if (!waiterExists) throw new Error("No se ha encontrado el mesero");

    return await prisma.waiter.update({
      where: { id },
      data: { active },
    });
  },
};
