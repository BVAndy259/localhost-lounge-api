"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const waiter_controller_1 = require("../controllers/waiter.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../constants/roles");
const validate_middleware_1 = __importDefault(require("../middlewares/validate.middleware"));
const waiter_validator_1 = require("../validators/waiter.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.AuthMiddleware.verifyToken);
router.get('/', role_middleware_1.RoleMiddleware.checkRole([roles_1.Roles.ADMIN, roles_1.Roles.RECEPCIONISTA]), waiter_controller_1.WaiterController.getAll);
router.post('/', role_middleware_1.RoleMiddleware.checkRole([roles_1.Roles.ADMIN]), (0, validate_middleware_1.default)(waiter_validator_1.createWaiterSchema), waiter_controller_1.WaiterController.create);
router.put('/:id', role_middleware_1.RoleMiddleware.checkRole([roles_1.Roles.ADMIN]), (0, validate_middleware_1.default)(waiter_validator_1.updateWaiterSchema), waiter_controller_1.WaiterController.update);
router.patch('/:id/status', role_middleware_1.RoleMiddleware.checkRole([roles_1.Roles.ADMIN]), (0, validate_middleware_1.default)(waiter_validator_1.toggleWaiterSchema), waiter_controller_1.WaiterController.toggleStatus);
exports.default = router;
