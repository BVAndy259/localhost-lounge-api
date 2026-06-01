"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../constants/roles");
const validate_middleware_1 = __importDefault(require("../middlewares/validate.middleware"));
const user_validator_1 = require("../validators/user.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.AuthMiddleware.verifyToken, role_middleware_1.RoleMiddleware.checkRole([roles_1.Roles.ADMIN]));
router.post('/', (0, validate_middleware_1.default)(user_validator_1.createUserSchema), user_controller_1.UserController.create);
router.get('/', user_controller_1.UserController.getAll);
router.put('/:id', (0, validate_middleware_1.default)(user_validator_1.updateUserSchema), user_controller_1.UserController.update);
router.patch('/:id/status', (0, validate_middleware_1.default)(user_validator_1.toggleUserSchema), user_controller_1.UserController.toggleStatus);
exports.default = router;
