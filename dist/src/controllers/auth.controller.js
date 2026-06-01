"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const user_service_1 = require("../services/user.service");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
exports.AuthController = {
    async me(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: 'No autenticado' });
                return;
            }
            const user = await user_service_1.UserService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({ error: 'No se ha encontrado al usuario' });
                return;
            }
            res.status(200).json({
                message: 'Sesión recuperada correctamente',
                data: {
                    ...user,
                    isSuperAdmin: user.email === env_1.env.ADMIN_EMAIL,
                },
            });
        }
        catch (error) {
            logger_1.logger.error(`[AUTH ERROR] Me: ${error?.message ?? error}`);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    async register(req, res) {
        try {
            const { name, email, password, role } = req.body;
            if (!name || !email || !password) {
                res.status(400).json({
                    error: 'Es necesario introducir el nombre, el correo electrónico y la contraseña',
                });
                return;
            }
            const newUser = await auth_service_1.AuthService.registerUser(name, email, password, role);
            res.status(201).json({
                message: 'El usuario se ha registrado correctamente',
                data: newUser,
            });
        }
        catch (error) {
            logger_1.logger.error(`[AUTH ERROR] Registro: ${error?.message ?? error}`);
            res.status(400).json({ error: error.message });
        }
    },
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    error: 'Es necesario introducir el correo electrónico y la contraseña',
                });
                return;
            }
            const authData = await auth_service_1.AuthService.loginUser(email, password);
            res.status(200).json({
                message: 'Inicio de sesión correcto',
                data: authData,
            });
        }
        catch (error) {
            logger_1.logger.error(`[AUTH ERROR] Login: ${error?.message ?? error}`);
            res.status(401).json({ error: error.message });
        }
    },
};
