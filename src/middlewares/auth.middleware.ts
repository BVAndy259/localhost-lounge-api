import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const AuthMiddleware = {
  verifyToken(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Acceso denegado. No se ha proporcionado ningún token',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: number;
        role: string;
      };

      req.user = decoded;

      next();
    } catch {
      res.status(403).json({ error: 'Token no válido o caducado' });
    }
  },
};
