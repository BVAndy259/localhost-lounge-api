import { Router } from 'express';
import { AuthMiddleware } from '../../shared/middlewares/auth.middleware';
import { AuthController } from './auth.controller';
import { RoleMiddleware } from '../../shared/middlewares/role.middleware';
import { Roles } from '../../shared/constants/roles';
import validateBody from '../../shared/middlewares/validate.middleware';
import { registerSchema, loginSchema } from './auth.validator';

const router = Router();

router.get('/me', AuthMiddleware.verifyToken, AuthController.me);

router.post(
  '/register',
  AuthMiddleware.verifyToken,
  RoleMiddleware.checkRole([Roles.ADMIN]),
  validateBody(registerSchema),
  AuthController.register
);

router.post('/login', validateBody(loginSchema), AuthController.login);

export default router;
