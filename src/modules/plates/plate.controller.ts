import { Request, Response } from 'express';
import { PlateService } from './plate.service';
import { logger } from '../../shared/utils/logger';

export const PlateController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, price, category } = req.body;

      const finalImageUrl = req.file ? req.file.path : req.body.image_url;

      if (!name || price === undefined || !category) {
        res.status(400).json({ error: 'Nombre, precio y categoria son requeridos' });
        return;
      }

      const newPlate = await PlateService.createPlate({
        name,
        description,
        price,
        category,
        image_url: finalImageUrl,
      });
      res.status(201).json({
        message: 'El plato se ha creado correctamente',
        data: newPlate,
      });
    } catch (error: any) {
      logger.error(`[PLATE ERROR] Create: ${error?.message ?? error}`);
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const plates = await PlateService.getAllPlate();

      res.status(200).json({
        message: 'Se ha recuperado correctamente los platos',
        data: plates,
      });
    } catch (error: any) {
      logger.error(`[PLATE ERROR] GetAll: ${error?.message ?? error}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getPublic(req: Request, res: Response): Promise<void> {
    try {
      const plates = await PlateService.getPublicPlates();

      res.status(200).json({
        message: 'Se ha recuperado correctamente los platos disponibles',
        data: plates,
      });
    } catch (error: any) {
      logger.error(`[PLATE ERROR] GetPublic: ${error?.message ?? error}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const plateId = parseInt(req.params.id as string, 10);

      if (isNaN(plateId)) {
        res.status(400).json({ error: 'Formato de ID de plato no válido' });
        return;
      }

      const { name, description, price, category } = req.body;

      const finalImageUrl = req.file ? req.file.path : req.body.image_url;

      const updatePlate = await PlateService.updatePlate(plateId, {
        name,
        description,
        price,
        category,
        image_url: finalImageUrl,
      });
      res.status(200).json({
        message: 'El plato se ha actualizado correctamente',
        data: updatePlate,
      });
    } catch (error: any) {
      logger.error(`[PLATE ERROR] Update: ${error?.message ?? error}`);
      if (error.message === 'Plato no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  },

  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const plateId = parseInt(req.params.id as string, 10);
      if (isNaN(plateId)) {
        res.status(400).json({ error: 'Formato de ID de plato no válido' });
        return;
      }

      const { available } = req.body;
      if (typeof available !== 'boolean') {
        res.status(400).json({ error: 'El campo «available» debe ser un valor booleano' });
        return;
      }

      const updatePlate = await PlateService.toggleAvailability(plateId, available);
      const statusMessage = available ? 'disponible' : 'no disponible/sin stock';

      res.status(200).json({
        message: `Plato ${statusMessage} con éxito`,
        data: updatePlate,
      });
    } catch (error: any) {
      logger.error(`[PLATE ERROR] ToggleStatus: ${error?.message ?? error}`);
      if (error.message === 'Plato no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  },
};
