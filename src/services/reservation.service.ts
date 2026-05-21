import prisma from "../config/prisma";

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
    let finalClientId: number;

    if (data.client_id) {
      const clientExists = await prisma.client.findUnique({
        where: { id: data.client_id },
      });
      if (!clientExists) throw new Error("Cliente no encontrado");
      finalClientId = data.client_id;
    } else if (data.client_data) {
      const existingClient = await prisma.client.findFirst({
        where: { phone_number: data.client_data.phone_number },
      });

      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: {
            name: data.client_data.name,
            last_name: data.client_data.last_name,
            phone_number: data.client_data.phone_number,
            email: data.client_data.email,
          },
        });
        finalClientId = newClient.id;
      }
    } else {
      throw new Error("Debes proporcionar un client_id o unos client_data");
    }

    const table = await prisma.table.findUnique({
      where: { id: data.table_id },
    });
    if (!table) throw new Error("Mesa no encontrada");

    if (data.number_people > table.capacity) {
      throw new Error(
        `Se ha superado la capacidad de la mesa. El máximo permitido es de ${table.capacity} personas.`,
      );
    }

    const dateToSearch = new Date(data.reservation_date);
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        table_id: data.table_id,
        reservation_date: dateToSearch,
        status: { in: ["PENDIENTE", "CONFIRMADA"] },
      },
    });

    if (existingReservation) {
      throw new Error("Esta mesa ya está reservada para la fecha seleccionada");
    }

    return await prisma.reservation.create({
      data: {
        client_id: finalClientId,
        table_id: data.table_id,
        receptionist_id: data.receptionist_id || null,
        reservation_date: dateToSearch,
        reservation_time: new Date(data.reservation_time),
        number_people: data.number_people,
        notes: data.notes || "",
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
      orderBy: [{ reservation_date: "asc" }, { reservation_time: "asc" }],
    });
  },

  async updateStatus(id: number, status: string) {
    const validStatuses = [
      "PENDIENTE",
      "CONFIRMADA",
      "CANCELADA",
      "COMPLETADA",
    ];

    if (!validStatuses.includes(status.toUpperCase())) {
      throw new Error(`Estado no válido. Validos: ${validStatuses.join(", ")}`);
    }

    const reservationExistis = await prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservationExistis) throw new Error("Reserva no encontrada");

    return await prisma.reservation.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: { client: true, table: true },
    });
  },
};
