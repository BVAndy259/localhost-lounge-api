import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ReservationService } from "../services/reservation.service";

export const ReservationController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        table_id,
        reservation_date,
        reservation_time,
        number_people,
        notes,
        client_id,
        client_data,
      } = req.body;

      if (
        !table_id ||
        !reservation_date ||
        !reservation_time ||
        !number_people
      ) {
        res.status(400).json({ error: "Faltan campos obligatorios en la reserva" });
        return;
      }

      const receptionist_id = req.user?.id;

      const newReservation = await ReservationService.createReservation({
        table_id: parseInt(table_id, 10),
        receptionist_id,
        reservation_date,
        reservation_time,
        number_people: parseInt(number_people, 10),
        notes,
        client_id: client_id ? parseInt(client_id, 10) : undefined,
        client_data: client_data
          ? {
              name: client_data.name,
              last_name: client_data.last_name,
              phone_number: client_data.phone_number,
              email: client_data.email,
            }
          : undefined,
      });

      res
        .status(201)
        .json({
          message: "La reserva se ha procesado correctamente",
          data: newReservation,
        });
    } catch (error: any) {
      console.error(`[RESERVATION ERROR] Create: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const reservations = await ReservationService.getAllReservations();
      res
        .status(200)
        .json({ message: "Reservas recuperadas", data: reservations });
    } catch (error: any) {
      console.error(`[RESERVATION ERROR] GetAll: ${error.message}`);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  async changeStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const reservationId = parseInt(req.params.id as string, 10);
      const { status } = req.body;

      if (isNaN(reservationId)) {
        res.status(400).json({ error: "Formato de ID de reserva no válido" });
        return;
      }

      if (!status) {
        res.status(400).json({ error: "El campo «status» es obligatorio" });
        return;
      }

      const updatedReservation = await ReservationService.updateStatus(
        reservationId,
        status,
      );
      res.status(200).json({
        message: `Reserva marcada como ${status}`,
        data: updatedReservation,
      });
    } catch (error: any) {
      console.error(`[RESERVATION ERROR] ChangeStatus: ${error.message}`);
      if (error.message === "Reserva no encontrada")
        res.status(404).json({ error: error.message });
      else res.status(400).json({ error: error.message });
    }
  },
};
