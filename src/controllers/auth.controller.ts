import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { AuthRequest } from '../middlewares/auth.middleware';

export const AuthController = {
  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const user = await UserService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({ error: 'No se ha encontrado al usuario' });
        return;
      }

      res.status(200).json({
        message: 'Sesión recuperada correctamente',
        data: {
          ...user,
          isSuperAdmin: user.email === env.ADMIN_EMAIL,
        },
      });
    } catch (error: any) {
      logger.error(`[AUTH ERROR] Me: ${error?.message ?? error}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({
          error: 'Es necesario introducir el nombre, el correo electrónico y la contraseña',
        });
        return;
      }

      const newUser = await AuthService.registerUser(name, email, password, role);

      res.status(201).json({
        message: 'El usuario se ha registrado correctamente',
        data: newUser,
      });
    } catch (error: any) {
      logger.error(`[AUTH ERROR] Registro: ${error?.message ?? error}`);
      res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'Es necesario introducir el correo electrónico y la contraseña',
        });
        return;
      }

      const authData = await AuthService.loginUser(email, password);

      res.status(200).json({
        message: 'Inicio de sesión correcto',
        data: authData,
      });
    } catch (error: any) {
      logger.error(`[AUTH ERROR] Login: ${error?.message ?? error}`);
      res.status(401).json({ error: error.message });
    }
  },
};
