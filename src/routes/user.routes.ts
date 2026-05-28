import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Roles } from '../constants/roles';
import validateBody from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema, toggleUserSchema } from '../validators/user.validator';

const router = Router();

router.use(AuthMiddleware.verifyToken, RoleMiddleware.checkRole([Roles.ADMIN]));

router.post('/', validateBody(createUserSchema), UserController.create);

router.get('/', UserController.getAll);

router.put('/:id', validateBody(updateUserSchema), UserController.update);

router.patch('/:id/status', validateBody(toggleUserSchema), UserController.toggleStatus);

export default router;
