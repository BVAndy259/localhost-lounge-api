import prisma from '../config/prisma';
import HttpError from '../utils/httpError';

export const UserService = {
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
      orderBy: { id: 'asc' },
    });
  },

  async updateUser(id: number, data: { name?: string; role?: string }) {
    const userExists = await prisma.user.findUnique({ where: { id } });

    if (!userExists) throw new HttpError(404, 'No se ha encontrado al usuario', 'USER_NOT_FOUND');

    return await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  },

  async toggleUserStatus(id: number, active: boolean) {
    const userExists = await prisma.user.findUnique({ where: { id } });

    if (!userExists) throw new HttpError(404, 'No se ha encontrado al usuario', 'USER_NOT_FOUND');

    return await prisma.user.update({
      where: { id },
      data: { active },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  },
};
