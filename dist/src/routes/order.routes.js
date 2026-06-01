"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../constants/roles");
const validate_middleware_1 = __importDefault(require("../middlewares/validate.middleware"));
const order_validator_1 = require("../validators/order.validator");
const router = (0, express_1.Router)();
const staffOnly = [
    auth_middleware_1.AuthMiddleware.verifyToken,
    role_middleware_1.RoleMiddleware.checkRole([roles_1.Roles.ADMIN, roles_1.Roles.RECEPCIONISTA]),
];
router.use(staffOnly);
router.get('/', order_controller_1.OrderController.getAll);
router.post('/', (0, validate_middleware_1.default)(order_validator_1.createOrderSchema), order_controller_1.OrderController.create);
router.get('/table/:tableId/active', order_controller_1.OrderController.getActiveByTable);
router.get('/:id/receipt/pdf', order_controller_1.OrderController.receiptPdf);
router.get('/:id', order_controller_1.OrderController.getById);
router.post('/:id/items', (0, validate_middleware_1.default)(order_validator_1.addItemsSchema), order_controller_1.OrderController.addItems);
router.delete('/:id/items/:itemId', order_controller_1.OrderController.deleteItem);
router.post('/:id/cancel', order_controller_1.OrderController.cancel);
router.patch('/:id/status', (0, validate_middleware_1.default)(order_validator_1.updateStatusSchema), order_controller_1.OrderController.updateStatus);
router.post('/:id/checkout', (0, validate_middleware_1.default)(order_validator_1.checkoutSchema), order_controller_1.OrderController.checkout);
exports.default = router;
