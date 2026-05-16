import prisma from "../config/prisma";

export const PlateService = {
    async createPlate(data: {name: string, description: string, price: number, category: string}) {
        return await prisma.plate.create({ data })
    },

    async getAllPlate() {
        return await prisma.plate.findMany({
            orderBy: [
                { category: 'asc'},
                { name: 'asc'}
            ]
        })

    },

    async updatePlate(id: number, data: {name: string, description: string, price: number, category: string}) {
        const plateExists = await prisma.plate.findUnique({ where: { id } })
        if (!plateExists) throw new Error('Plato no encontrado');

        return await prisma.plate.update({
            where: {id},
            data
        })
    },

    async toggleAvailability(id: number, available: boolean) {
        const plateExists = await prisma.plate.findUnique({ where: { id } })
        if (!plateExists) throw new Error('Plato no encontrado');

        return await prisma.plate.update({
            where: {id},
            data: { available }
        })
    }
}