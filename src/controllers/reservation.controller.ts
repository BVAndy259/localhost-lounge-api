import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ReservationService } from '../services/reservation.service';
import { logger } from '../utils/logger';
import HttpError from '../utils/httpError';
import { createReservationSchema } from '../validators/reservation.validator';

export const ReservationController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = createReservationSchema.safeParse(req.body);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
        res.status(400).json({ error: 'Payload inválido', details: issues });
        return;
      }

      const {
        table_id,
        reservation_date,
        reservation_time,
        number_people,
        notes,
        client_id,
        client_data,
      } = parsed.data;

      const receptionist_id = req.user?.id;

      const newReservation = await ReservationService.createReservation({
        table_id: Number(table_id),
        receptionist_id,
        reservation_date,
        reservation_time,
        number_people: Number(number_people),
        notes,
        client_id: client_id ? Number(client_id) : undefined,
        client_data,
      });

      res.status(201).json({
        message: 'La reserva se ha procesado correctamente',
        data: newReservation,
      });
    } catch (error: any) {
      logger.error(`[RESERVATION ERROR] Create: ${error?.message ?? error}`);
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(400).json({ error: error?.message ?? 'Error procesando la reserva' });
      }
    }
  },

  async getAll(res: Response): Promise<void> {
    try {
      const reservations = await ReservationService.getAllReservations();
      res.status(200).json({ message: 'Reservas recuperadas', data: reservations });
    } catch (error: any) {
      logger.error(`[RESERVATION ERROR] GetAll: ${error?.message ?? error}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async changeStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const reservationId = parseInt(req.params.id as string, 10);
      const { status } = req.body;

      if (isNaN(reservationId)) {
        res.status(400).json({ error: 'Formato de ID de reserva no válido' });
        return;
      }

      if (!status) {
        res.status(400).json({ error: 'El campo «status» es obligatorio' });
        return;
      }

      const updatedReservation = await ReservationService.updateStatus(reservationId, status);
      res.status(200).json({
        message: `Reserva marcada como ${status}`,
        data: updatedReservation,
      });
    } catch (error: any) {
      logger.error(`[RESERVATION ERROR] ChangeStatus: ${error?.message ?? error}`);
      if (error.message === 'Reserva no encontrada') res.status(404).json({ error: error.message });
      else res.status(400).json({ error: error.message });
    }
  },
};
