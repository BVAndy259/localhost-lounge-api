import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const RoleMiddleware = {
  checkRole(allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        res.status(403).json({ error: 'Prohibido. No tienes los permisos necesarios.' });
        return;
      }

      next();
    };
  },
};
