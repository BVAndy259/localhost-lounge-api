import { Response, Request } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';

export const UserController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({
        message: 'Se han recuperado los usuarios correctamente',
        data: users,
      });
    } catch (error: any) {
      logger.error(`[USER ERROR] GetAll: ${error?.message ?? error}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id as string, 10);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'Formato de ID de usuario no válido' });
        return;
      }

      const { name, role } = req.body;
      const updateUser = await UserService.updateUser(userId, { name, role });

      res.status(200).json({
        message: 'El usuario se ha actualizado correctamente',
        data: updateUser,
      });
    } catch (error: any) {
      logger.error(`[USER ERROR] Update: ${error?.message ?? error}`);
      if (error.message === 'No se ha encontrado al usuario') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },

  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id as string, 10);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'Formato de ID de usuario no válido' });
        return;
      }

      const { active } = req.body;

      if (typeof active !== 'boolean') {
        res.status(400).json({ error: 'El campo «activo» debe ser un valor booleano' });
        return;
      }

      const updatedUser = await UserService.toggleUserStatus(userId, active);

      const statusMessage = active ? 'activado' : 'desactivado/suspendido';

      res.status(200).json({
        message: `Usuario ${statusMessage} con éxito`,
        data: updatedUser,
      });
    } catch (error: any) {
      logger.error(`[USER ERROR] ToggleStatus: ${error?.message ?? error}`);
      if (error.message === 'No se ha encontrado al usuario') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },
};
