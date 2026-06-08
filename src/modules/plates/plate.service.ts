import prisma from '../../shared/config/prisma';
import HttpError from '../../shared/utils/httpError';

export const PlateService = {
  async createPlate(data: {
    name: string;
    description?: string;
    price: number;
    category: string;
    image_url?: string;
  }) {
    const existingPlate = await prisma.plate.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
      },
    });

    if (existingPlate)
      throw new HttpError(409, 'En el menú ya hay un plato con ese nombre', 'PLATE_EXISTS');

    return await prisma.plate.create({ data });
  },

  async getAllPlate() {
    return await prisma.plate.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  },

  async getPublicPlates() {
    return await prisma.plate.findMany({
      where: { available: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  },

  async updatePlate(
    id: number,
    data: {
      name: string;
      description?: string;
      price: number;
      category: string;
      image_url?: string;
    }
  ) {
    const plateExists = await prisma.plate.findUnique({ where: { id } });
    if (!plateExists) throw new HttpError(404, 'Plato no encontrado', 'PLATE_NOT_FOUND');

    return await prisma.plate.update({
      where: { id },
      data,
    });
  },

  async toggleAvailability(id: number, available: boolean) {
    const plateExists = await prisma.plate.findUnique({ where: { id } });
    if (!plateExists) throw new HttpError(404, 'Plato no encontrado', 'PLATE_NOT_FOUND');

    return await prisma.plate.update({
      where: { id },
      data: { available },
    });
  },
};
