"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservation_controller_1 = require("../controllers/reservation.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../constants/roles");
const router = (0, express_1.Router)();
router.post('/public', reservation_controller_1.ReservationController.createPublic);
router.get('/available-slots', reservation_controller_1.ReservationController.getAvailableSlots);
const staffOnly = [
    auth_middleware_1.AuthMiddleware.verifyToken,
    role_middleware_1.RoleMiddleware.checkRole([roles_1.Roles.ADMIN, roles_1.Roles.RECEPCIONISTA]),
];
router.post('/', staffOnly, reservation_controller_1.ReservationController.create);
router.get('/', staffOnly, reservation_controller_1.ReservationController.getAll);
router.patch('/:id/status', staffOnly, reservation_controller_1.ReservationController.changeStatus);
router.patch('/:id/waiter', staffOnly, reservation_controller_1.ReservationController.assignWaiter);
exports.default = router;
