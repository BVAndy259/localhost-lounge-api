import { Router } from 'express';
import { TableController } from './table.controller';
import { AuthMiddleware } from '../../shared/middlewares/auth.middleware';
import { RoleMiddleware } from '../../shared/middlewares/role.middleware';
import { Roles } from '../../shared/constants/roles';
import validateBody from '../../shared/middlewares/validate.middleware';
import { createTableSchema, updateTableSchema, toggleActiveSchema } from './table.validator';

const router = Router();
const onlyAdmin = RoleMiddleware.checkRole([Roles.ADMIN]);
const staffOnly = RoleMiddleware.checkRole([Roles.ADMIN, Roles.RECEPCIONISTA]);

router.get('/public', TableController.getPublic);

router.get('/', AuthMiddleware.verifyToken, staffOnly, TableController.getAll);
router.get('/:id', AuthMiddleware.verifyToken, staffOnly, TableController.getById);

router.post(
  '/',
  AuthMiddleware.verifyToken,
  onlyAdmin,
  validateBody(createTableSchema),
  TableController.create
);
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  onlyAdmin,
  validateBody(updateTableSchema),
  TableController.update
);
router.patch('/:id/status', AuthMiddleware.verifyToken, staffOnly, TableController.changeStatus);
router.patch(
  '/:id/active',
  AuthMiddleware.verifyToken,
  onlyAdmin,
  validateBody(toggleActiveSchema),
  TableController.toggleActive
);

export default router;
