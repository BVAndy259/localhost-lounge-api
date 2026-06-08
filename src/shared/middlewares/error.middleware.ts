import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import HttpError from '../utils/httpError';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  void req;
  void next;
  logger.error(err?.message ?? err);

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}

export default errorHandler;
