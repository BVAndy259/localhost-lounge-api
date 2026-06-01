"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlateController = void 0;
const plate_service_1 = require("../services/plate.service");
const logger_1 = require("../utils/logger");
exports.PlateController = {
    async create(req, res) {
        try {
            const { name, description, price, category } = req.body;
            const finalImageUrl = req.file ? req.file.path : req.body.image_url;
            if (!name || price === undefined || !category) {
                res.status(400).json({ error: 'Nombre, precio y categoria son requeridos' });
                return;
            }
            const newPlate = await plate_service_1.PlateService.createPlate({
                name,
                description,
                price,
                category,
                image_url: finalImageUrl,
            });
            res.status(201).json({
                message: 'El plato se ha creado correctamente',
                data: newPlate,
            });
        }
        catch (error) {
            logger_1.logger.error(`[PLATE ERROR] Create: ${error?.message ?? error}`);
            res.status(400).json({ error: error.message });
        }
    },
    async getAll(req, res) {
        try {
            const plates = await plate_service_1.PlateService.getAllPlate();
            res.status(200).json({
                message: 'Se ha recuperado correctamente los platos',
                data: plates,
            });
        }
        catch (error) {
            logger_1.logger.error(`[PLATE ERROR] GetAll: ${error?.message ?? error}`);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    async getPublic(req, res) {
        try {
            const plates = await plate_service_1.PlateService.getPublicPlates();
            res.status(200).json({
                message: 'Se ha recuperado correctamente los platos disponibles',
                data: plates,
            });
        }
        catch (error) {
            logger_1.logger.error(`[PLATE ERROR] GetPublic: ${error?.message ?? error}`);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    async update(req, res) {
        try {
            const plateId = parseInt(req.params.id, 10);
            if (isNaN(plateId)) {
                res.status(400).json({ error: 'Formato de ID de plato no válido' });
                return;
            }
            const { name, description, price, category } = req.body;
            const finalImageUrl = req.file ? req.file.path : req.body.image_url;
            const updatePlate = await plate_service_1.PlateService.updatePlate(plateId, {
                name,
                description,
                price,
                category,
                image_url: finalImageUrl,
            });
            res.status(200).json({
                message: 'El plato se ha actualizado correctamente',
                data: updatePlate,
            });
        }
        catch (error) {
            logger_1.logger.error(`[PLATE ERROR] Update: ${error?.message ?? error}`);
            if (error.message === 'Plato no encontrado') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(400).json({ error: error.message });
        }
    },
    async toggleStatus(req, res) {
        try {
            const plateId = parseInt(req.params.id, 10);
            if (isNaN(plateId)) {
                res.status(400).json({ error: 'Formato de ID de plato no válido' });
                return;
            }
            const { available } = req.body;
            if (typeof available !== 'boolean') {
                res.status(400).json({ error: 'El campo «available» debe ser un valor booleano' });
                return;
            }
            const updatePlate = await plate_service_1.PlateService.toggleAvailability(plateId, available);
            const statusMessage = available ? 'disponible' : 'no disponible/sin stock';
            res.status(200).json({
                message: `Plato ${statusMessage} con éxito`,
                data: updatePlate,
            });
        }
        catch (error) {
            logger_1.logger.error(`[PLATE ERROR] ToggleStatus: ${error?.message ?? error}`);
            if (error.message === 'Plato no encontrado') {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(400).json({ error: error.message });
        }
    },
};
