import { Request, Response } from 'express';
import { TableService } from '../services/table.service';
import { logger } from '../utils/logger';

export const TableController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { table_number, capacity, type, reservation_price, description } = req.body;

      if (table_number === undefined || !capacity) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
      }

      const normalizedType = type ? String(type).toUpperCase() : 'NORMAL';
      const allowedTypes = ['NORMAL', 'VIP'];

      if (!allowedTypes.includes(normalizedType)) {
        res.status(400).json({ error: 'Tipo no válido. Valores permitidos: NORMAL, VIP' });
        return;
      }

      const newTable = await TableService.createTable({
        table_number: String(table_number).trim(),
        capacity: parseInt(capacity, 10),
        type: normalizedType,
        reservation_price:
          reservation_price !== undefined && reservation_price !== ''
            ? parseFloat(reservation_price)
            : undefined,
        description,
      });

      res.status(201).json({
        message: 'La mesa se ha creado correctamente',
        data: newTable,
      });
    } catch (error: any) {
      logger.error(`[TABLE ERROR] Create: ${error?.message ?? error}`);
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tables = await TableService.getAllTables();
      res.status(200).json({
        message: 'Las mesas se han recuperado correctamente',
        data: tables,
      });
    } catch (error: any) {
      logger.error(`[TABLE ERROR] GetAll: ${error?.message ?? error}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getPublic(req: Request, res: Response): Promise<void> {
    try {
      const tables = await TableService.getPublicTables();
      res.status(200).json({
        message: 'Las mesas publicas se han recuperado correctamente',
        data: tables,
      });
    } catch (error: any) {
      logger.error(`[TABLE ERROR] GetPublic: ${error?.message ?? error}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const tableId = parseInt(req.params.id as string, 10);
      if (isNaN(tableId)) {
        res.status(400).json({ error: 'Formato de ID de mesa no válido' });
        return;
      }

      const { capacity, type, reservation_price, description } = req.body;

      const normalizedType = type ? String(type).toUpperCase() : undefined;
      if (normalizedType && !['NORMAL', 'VIP'].includes(normalizedType)) {
        res.status(400).json({ error: 'Tipo no válido. Valores permitidos: NORMAL, VIP' });
        return;
      }

      const updateTable = await TableService.updateTable(tableId, {
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        type: normalizedType,
        reservation_price: reservation_price ? parseFloat(reservation_price) : undefined,
        description,
      });

      res.status(200).json({
        message: 'La mesa se ha actualizado correctamente',
        data: updateTable,
      });
    } catch (error: any) {
      logger.error(`[TABLE ERROR] Update: ${error?.message ?? error}`);
      if (error.message === 'Mesa no encontrada') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },

  async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const tableId = parseInt(req.params.id as string, 10);
      if (isNaN(tableId)) {
        res.status(400).json({ error: 'Formato de ID de mesa no válido' });
        return;
      }

      const { status, waiter_id } = req.body;

      if (!status) {
        res.status(400).json({ error: 'El campo «status» es obligatorio' });
        return;
      }

      const allowedStatus = ['LIBRE', 'OCUPADO', 'RESERVADO'];
      if (!allowedStatus.includes(status.toUpperCase())) {
        res.status(400).json({
          error: 'Estado no válido. Valores permitidos: LIBRE, OCUPADO, RESERVADO',
        });
        return;
      }

      const parseWaiterId = waiter_id ? parseInt(waiter_id, 10) : null;

      const updateTable = await TableService.changeTableStatus(
        tableId,
        status.toUpperCase(),
        parseWaiterId
      );
      res.status(200).json({
        message: `El estado de la mesa se ha actualizado a ${status.toUpperCase()}`,
        data: updateTable,
      });
    } catch (error: any) {
      logger.error(`[TABLE ERROR] ChangeStatus: ${error?.message ?? error}`);
      if (error.message === 'Mesa no encontrada') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },

  async toggleActive(req: Request, res: Response): Promise<void> {
    try {
      const tableId = parseInt(req.params.id as string, 10);
      if (isNaN(tableId)) {
        res.status(400).json({ error: 'Formato de ID de mesa no válido' });
        return;
      }

      const { active } = req.body;
      if (typeof active !== 'boolean') {
        res.status(400).json({ error: 'El campo «active» debe ser un valor booleano' });
        return;
      }

      const updateTable = await TableService.toggleTableActive(tableId, active);
      const msg = active ? 'activado' : 'marcado como en mantenimiento/inactivo';

      res.status(200).json({
        message: `La mesa ${msg} se ha creado correctamente`,
        data: updateTable,
      });
    } catch (error: any) {
      logger.error(`[TABLE ERROR] ToggleActive: ${error?.message ?? error}`);
      if (error.message === 'Mesa no encontrada') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },
};
