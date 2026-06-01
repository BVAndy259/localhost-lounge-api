import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ReservationService } from '../services/reservation.service';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import HttpError from '../utils/httpError';
import prisma from '../config/prisma';
import {
  assignReservationWaiterSchema,
  createReservationSchema,
  createPublicReservationSchema,
} from '../validators/reservation.validator';

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

      const receptionistId = req.user?.id;
      const receptionist = receptionistId ? await UserService.getUserById(receptionistId) : null;

      const newReservation = await ReservationService.createReservation({
        table_id: Number(table_id),
        receptionist_id: receptionist?.id,
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

  async createPublic(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = createPublicReservationSchema.safeParse(req.body);
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
        customer_name,
        customer_email,
        customer_phone,
        notes,
        session_token,
      } = parsed.data;

      const nameParts = customer_name.trim().split(/\s+/);
      const firstName = nameParts[0] || customer_name;
      const lastName = nameParts.slice(1).join(' ') || 'Cliente';

      const newReservation = await ReservationService.createReservation({
        table_id: table_id,
        reservation_date,
        reservation_time,
        number_people,
        notes,
        status: 'CONFIRMADA',
        client_data: {
          name: firstName,
          last_name: lastName,
          phone_number: customer_phone,
          email: customer_email,
        },
      });

      if (session_token && newReservation.client_id) {
        await prisma.chat_Session.updateMany({
          where: { session_token: session_token },
          data: { client_id: newReservation.client_id },
        });
      }

      res.status(201).json({
        message: 'Reserva creada correctamente',
        data: newReservation,
      });
    } catch (error: any) {
      logger.error(`[RESERVATION ERROR] CreatePublic: ${error?.message ?? error}`);
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(400).json({ error: error?.message ?? 'Error procesando la reserva' });
      }
    }
  },

  async getAll(req: AuthRequest, res: Response): Promise<void> {
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

  async assignWaiter(req: AuthRequest, res: Response): Promise<void> {
    try {
      const reservationId = parseInt(req.params.id as string, 10);
      if (isNaN(reservationId)) {
        res.status(400).json({ error: 'Formato de ID de reserva no válido' });
        return;
      }

      const parsed = assignReservationWaiterSchema.safeParse(req.body);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
        res.status(400).json({ error: 'Payload inválido', details: issues });
        return;
      }

      const updatedReservation = await ReservationService.assignWaiterToReservation(
        reservationId,
        parsed.data.waiter_id
      );

      res.status(200).json({
        message: 'Mesero asignado correctamente a la reserva',
        data: updatedReservation,
      });
    } catch (error: any) {
      logger.error(`[RESERVATION ERROR] AssignWaiter: ${error?.message ?? error}`);
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(400).json({ error: error?.message ?? 'Error asignando mesero' });
      }
    }
  },

  async getAvailableSlots(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { date, guests } = req.query;

      if (!date || !guests) {
        res.status(400).json({ error: 'Los parámetros date y guests son obligatorios' });
        return;
      }

      const parsedDate = String(date);
      const parsedGuests = parseInt(String(guests), 10);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) {
        res.status(400).json({ error: 'La fecha debe tener formato YYYY-MM-DD' });
        return;
      }

      if (isNaN(parsedGuests) || parsedGuests < 1) {
        res.status(400).json({ error: 'El número de personas debe ser un entero positivo' });
        return;
      }

      const slots = await ReservationService.getAvailableSlots(parsedDate, parsedGuests);

      res.status(200).json({ data: slots });
    } catch (error: any) {
      logger.error(`[RESERVATION ERROR] getAvailableSlots: ${error?.message ?? error}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};
