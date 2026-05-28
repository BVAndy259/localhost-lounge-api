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

router.use(AuthMiddleware.verifyToken);

router.get(
  '/',
  RoleMiddleware.checkRole([Roles.ADMIN, Roles.RECEPCIONISTA]),
  WaiterController.getAll
);

router.post(
  '/',
  RoleMiddleware.checkRole([Roles.ADMIN]),
  validateBody(createWaiterSchema),
  WaiterController.create
);

router.put(
  '/:id',
  RoleMiddleware.checkRole([Roles.ADMIN]),
  validateBody(updateWaiterSchema),
  WaiterController.update
);

router.patch(
  '/:id/status',
  RoleMiddleware.checkRole([Roles.ADMIN]),
  validateBody(toggleWaiterSchema),
  WaiterController.toggleStatus
);

export default router;
