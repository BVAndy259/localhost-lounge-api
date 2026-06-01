"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const auth_service_1 = require("../services/auth.service");
const user_service_1 = require("../services/user.service");
const logger_1 = require("../utils/logger");
exports.UserController = {
    async create(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const newUser = await auth_service_1.AuthService.registerUser(name, email, password, role);
            res.status(201).json({
                message: 'El usuario se ha creado correctamente',
                data: newUser,
            });
        }
        catch (error) {
            logger_1.logger.error(`[USER ERROR] Create: ${error?.message ?? error}`);
            res.status(400).json({ error: error.message });
        }
    },
    async getAll(req, res) {
        try {
            const users = await user_service_1.UserService.getAllUsers();
            res.status(200).json({
                message: 'Se han recuperado los usuarios correctamente',
                data: users,
            });
        }
        catch (error) {
            logger_1.logger.error(`[USER ERROR] GetAll: ${error?.message ?? error}`);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    async update(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            if (isNaN(userId)) {
                res.status(400).json({ error: 'Formato de ID de usuario no válido' });
                return;
            }
            const { name, role } = req.body;
            const updateUser = await user_service_1.UserService.updateUser(userId, { name, role });
            res.status(200).json({
                message: 'El usuario se ha actualizado correctamente',
                data: updateUser,
            });
        }
        catch (error) {
            logger_1.logger.error(`[USER ERROR] Update: ${error?.message ?? error}`);
            if (error.message === 'No se ha encontrado al usuario') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    },
    async toggleStatus(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            if (isNaN(userId)) {
                res.status(400).json({ error: 'Formato de ID de usuario no válido' });
                return;
            }
            const { active } = req.body;
            if (typeof active !== 'boolean') {
                res.status(400).json({ error: 'El campo «activo» debe ser un valor booleano' });
                return;
            }
            if (req.user?.role === 'ADMIN' && req.user.id === userId && active === false) {
                res.status(400).json({
                    error: 'El administrador autenticado no puede desactivarse a sí mismo',
                });
                return;
            }
            const targetUser = await user_service_1.UserService.getUserById(userId);
            if (!targetUser) {
                res.status(404).json({ error: 'No se ha encontrado al usuario' });
                return;
            }
            if (targetUser.role === 'ADMIN' && active === false && !req.user?.isSuperAdmin) {
                res.status(403).json({
                    error: 'Solo el super administrador puede desactivar otros administradores',
                });
                return;
            }
            const updatedUser = await user_service_1.UserService.toggleUserStatus(userId, active);
            const statusMessage = active ? 'activado' : 'desactivado/suspendido';
            res.status(200).json({
                message: `Usuario ${statusMessage} con éxito`,
                data: updatedUser,
            });
        }
        catch (error) {
            logger_1.logger.error(`[USER ERROR] ToggleStatus: ${error?.message ?? error}`);
            if (error.message === 'No se ha encontrado al usuario') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    },
};
