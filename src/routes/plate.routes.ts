import { Router } from 'express';
import { PlateController } from '../controllers/plate.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Roles } from '../constants/roles';
import validateBody from '../middlewares/validate.middleware';
import { uploadImage } from '../validators/upload.middleware';
import {
  createPlateSchema,
  updatePlateSchema,
  togglePlateSchema,
} from '../validators/plate.validator';

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

router.patch('/:id/status', adminOnly, validateBody(togglePlateSchema), PlateController.toggleStatus);

export default router;
