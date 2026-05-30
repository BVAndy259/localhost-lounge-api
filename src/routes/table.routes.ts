import { Router } from 'express';
import { TableController } from '../controllers/table.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Roles } from '../constants/roles';
import validateBody from '../middlewares/validate.middleware';
import {
  createTableSchema,
  updateTableSchema,
  toggleActiveSchema,
} from '../validators/table.validator';

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
