import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Roles } from '../constants/roles';

const router = Router();

router.post('/public', ReservationController.createPublic);
router.get('/available-slots', ReservationController.getAvailableSlots);

const staffOnly = [
  AuthMiddleware.verifyToken,
  RoleMiddleware.checkRole([Roles.ADMIN, Roles.RECEPCIONISTA]),
];

router.post('/', staffOnly, ReservationController.create);
router.get('/', staffOnly, ReservationController.getAll);
router.patch('/:id/status', staffOnly, ReservationController.changeStatus);
router.patch('/:id/waiter', staffOnly, ReservationController.assignWaiter);

export default router;
