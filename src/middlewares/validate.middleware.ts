import { ZodTypeAny, type ZodIssue } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue: ZodIssue) => ({
        path: issue.path,
        message: issue.message,
      }));
      res.status(400).json({ error: 'Payload inválido', details });
      return;
    }
    req.body = result.data as any;
    next();
  };
};

export default validateBody;
