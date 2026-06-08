import { Router } from 'express';
import { WaiterController } from './waiter.controller';
import { AuthMiddleware } from '../../shared/middlewares/auth.middleware';
import { RoleMiddleware } from '../../shared/middlewares/role.middleware';
import { Roles } from '../../shared/constants/roles';
import validateBody from '../../shared/middlewares/validate.middleware';
import {
  createWaiterSchema,
  updateWaiterSchema,
  toggleWaiterSchema,
} from './waiter.validator';

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
