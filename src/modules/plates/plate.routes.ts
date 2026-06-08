import { Router } from 'express';
import { PlateController } from './plate.controller';
import { AuthMiddleware } from '../../shared/middlewares/auth.middleware';
import { RoleMiddleware } from '../../shared/middlewares/role.middleware';
import { Roles } from '../../shared/constants/roles';
import validateBody from '../../shared/middlewares/validate.middleware';
import { uploadImage } from '../../shared/middlewares/upload.middleware';
import { createPlateSchema, updatePlateSchema, togglePlateSchema } from './plate.validator';

const router = Router();

const adminOnly = RoleMiddleware.checkRole([Roles.ADMIN]);
const staffOnly = RoleMiddleware.checkRole([Roles.ADMIN, Roles.RECEPCIONISTA]);

router.get('/public', PlateController.getPublic);

router.use(AuthMiddleware.verifyToken);

router.post(
  '/',
  adminOnly,
  uploadImage.single('image'),
  validateBody(createPlateSchema),
  PlateController.create
);

router.get('/', staffOnly, PlateController.getAll);

router.put(
  '/:id',
  adminOnly,
  uploadImage.single('image'),
  validateBody(updatePlateSchema),
  PlateController.update
);

router.patch(
  '/:id/status',
  adminOnly,
  validateBody(togglePlateSchema),
  PlateController.toggleStatus
);

export default router;
