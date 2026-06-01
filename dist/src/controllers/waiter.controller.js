"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaiterController = void 0;
const waiter_service_1 = require("../services/waiter.service");
const logger_1 = require("../utils/logger");
exports.WaiterController = {
    async create(req, res) {
        try {
            const { name, phone_number } = req.body;
            if (!name) {
                res.status(400).json({ error: 'Es obligatorio indicar el nombre del mesero' });
                return;
            }
            const newWaiter = await waiter_service_1.WaiterService.createWaiter(name, phone_number);
            res.status(201).json({
                message: 'El mesero se ha creado correctamente',
                data: newWaiter,
            });
        }
        catch (error) {
            logger_1.logger.error(`[WAITER ERROR] Create: ${error?.message ?? error}`);
            res.status(400).json({ error: error.message });
        }
    },
    async getAll(req, res) {
        try {
            const waiters = await waiter_service_1.WaiterService.getAllWaiters();
            res.status(200).json({
                message: 'Se han recuperado correctamente los meseros',
                data: waiters,
            });
        }
        catch (error) {
            logger_1.logger.error(`[WAITER ERROR] GetAll: ${error?.message ?? error}`);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    async update(req, res) {
        try {
            const waiterId = parseInt(req.params.id, 10);
            if (isNaN(waiterId)) {
                res.status(400).json({ error: 'Formato de ID de mesero no válido' });
                return;
            }
            const { name, phone_number } = req.body;
            if (!name) {
                res.status(400).json({
                    error: 'Es necesario indicar el nombre del mesero para realizar la actualización',
                });
                return;
            }
            const updatedWaiter = await waiter_service_1.WaiterService.updateWaiter(waiterId, name, phone_number);
            res.status(200).json({
                message: 'El mesero se ha actualizado correctamente',
                data: updatedWaiter,
            });
        }
        catch (error) {
            logger_1.logger.error(`[WAITER ERROR] Update: ${error?.message ?? error}`);
            if (error.message === 'No se ha encontrado el mesero') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    },
    async toggleStatus(req, res) {
        try {
            const waiterId = parseInt(req.params.id, 10);
            if (isNaN(waiterId)) {
                res.status(400).json({ error: 'Formato de ID de mesero no válido' });
                return;
            }
            const { active } = req.body;
            if (typeof active !== 'boolean') {
                res.status(400).json({ error: 'El campo «activo» debe ser un valor booleano' });
                return;
            }
            const updatedWaiter = await waiter_service_1.WaiterService.toggleWaiterStatus(waiterId, active);
            const statusMessage = active ? 'activado' : 'desactivado/suspendido';
            res.status(200).json({
                message: `Mesero ${statusMessage} con éxito`,
                data: updatedWaiter,
            });
        }
        catch (error) {
            logger_1.logger.error(`[WAITER ERROR] ToggleStatus: ${error?.message ?? error}`);
            if (error.message === 'No se ha encontrado el mesero') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    },
};
