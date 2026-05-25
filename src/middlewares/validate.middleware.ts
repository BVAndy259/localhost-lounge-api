import { AnyZodObject, ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateBody = (schema: AnyZodObject | ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ path: i.path, message: i.message }));
      res.status(400).json({ error: 'Payload inválido', details });
      return;
    }
    // replace body with parsed/coerced data if needed
    req.body = result.data as any;
    next();
  };
};

export default validateBody;
