import { Router } from 'express';
import { WaiterController } from '../controllers/waiter.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Roles } from '../constants/roles';

const router = Router();

router.use(AuthMiddleware.verifyToken, RoleMiddleware.checkRole([Roles.ADMIN]));

router.post('/', WaiterController.create);

router.get('/', WaiterController.getAll);

router.put('/:id', WaiterController.update);

router.patch('/:id/status', WaiterController.toggleStatus);

export default router;