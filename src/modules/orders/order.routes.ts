import { Router } from 'express';
import { OrderController } from './order.controller';
import { AuthMiddleware } from '../../shared/middlewares/auth.middleware';
import { RoleMiddleware } from '../../shared/middlewares/role.middleware';
import { Roles } from '../../shared/constants/roles';
import validateBody from '../../shared/middlewares/validate.middleware';
import {
  createOrderSchema,
  addItemsSchema,
  checkoutSchema,
  updateStatusSchema,
} from './order.validator';

const router = Router();

const staffOnly = [
  AuthMiddleware.verifyToken,
  RoleMiddleware.checkRole([Roles.ADMIN, Roles.RECEPCIONISTA]),
];

router.use(staffOnly);

router.get('/', OrderController.getAll);
router.post('/', validateBody(createOrderSchema), OrderController.create);
router.get('/table/:tableId/active', OrderController.getActiveByTable);
router.get('/:id/receipt/pdf', OrderController.receiptPdf);
router.get('/:id', OrderController.getById);
router.post('/:id/items', validateBody(addItemsSchema), OrderController.addItems);
router.delete('/:id/items/:itemId', OrderController.deleteItem);
router.post('/:id/cancel', OrderController.cancel);
router.patch('/:id/status', validateBody(updateStatusSchema), OrderController.updateStatus);
router.post('/:id/checkout', validateBody(checkoutSchema), OrderController.checkout);

export default router;
