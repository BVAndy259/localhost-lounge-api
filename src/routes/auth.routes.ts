import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { AuthController } from '../controllers/auth.controller';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Roles } from '../constants/roles';
import validateBody from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

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
