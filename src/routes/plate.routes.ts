import { Router } from 'express';
import { PlateController } from '../controllers/plate.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Roles } from '../constants/roles';
import validateBody from '../middlewares/validate.middleware';
import {
  createPlateSchema,
  updatePlateSchema,
  togglePlateSchema,
} from '../validators/plate.validator';

const router = Router();

router.get('/public', PlateController.getPublic);

router.use(AuthMiddleware.verifyToken, RoleMiddleware.checkRole([Roles.ADMIN]));

router.post('/', validateBody(createPlateSchema), PlateController.create);

router.get('/', PlateController.getAll);

router.put('/:id', validateBody(updatePlateSchema), PlateController.update);

router.patch('/:id/status', validateBody(togglePlateSchema), PlateController.toggleStatus);

export default router;
