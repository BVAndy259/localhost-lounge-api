"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const auth_controller_1 = require("../controllers/auth.controller");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../constants/roles");
const validate_middleware_1 = __importDefault(require("../middlewares/validate.middleware"));
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
router.get('/me', auth_middleware_1.AuthMiddleware.verifyToken, auth_controller_1.AuthController.me);
router.post('/register', auth_middleware_1.AuthMiddleware.verifyToken, role_middleware_1.RoleMiddleware.checkRole([roles_1.Roles.ADMIN]), (0, validate_middleware_1.default)(auth_validator_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', (0, validate_middleware_1.default)(auth_validator_1.loginSchema), auth_controller_1.AuthController.login);
exports.default = router;
