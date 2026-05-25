import { Router } from 'express';
import { WaiterController } from '../controllers/waiter.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Roles } from '../constants/roles';
import validateBody from '../middlewares/validate.middleware';
import {
  createWaiterSchema,
  updateWaiterSchema,
  toggleWaiterSchema,
} from '../validators/waiter.validator';

const router = Router();

router.use(AuthMiddleware.verifyToken, RoleMiddleware.checkRole([Roles.ADMIN]));

router.post('/', validateBody(createWaiterSchema), WaiterController.create);

router.get('/', WaiterController.getAll);

router.put('/:id', validateBody(updateWaiterSchema), WaiterController.update);

router.patch('/:id/status', validateBody(toggleWaiterSchema), WaiterController.toggleStatus);

export default router;
