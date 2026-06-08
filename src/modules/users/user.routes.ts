import { Router } from 'express';
import { UserController } from './user.controller';
import { AuthMiddleware } from '../../shared/middlewares/auth.middleware';
import { RoleMiddleware } from '../../shared/middlewares/role.middleware';
import { Roles } from '../../shared/constants/roles';
import validateBody from '../../shared/middlewares/validate.middleware';
import { createUserSchema, updateUserSchema, toggleUserSchema } from './user.validator';

const router = Router();

router.use(AuthMiddleware.verifyToken, RoleMiddleware.checkRole([Roles.ADMIN]));

router.post('/', validateBody(createUserSchema), UserController.create);

router.get('/', UserController.getAll);

router.put('/:id', validateBody(updateUserSchema), UserController.update);

router.patch('/:id/status', validateBody(toggleUserSchema), UserController.toggleStatus);

export default router;
