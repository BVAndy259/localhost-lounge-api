"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleMiddleware = void 0;
exports.RoleMiddleware = {
    checkRole(allowedRoles) {
        return (req, res, next) => {
            if (!req.user || !allowedRoles.includes(req.user.role)) {
                res.status(403).json({ error: 'Prohibido. No tienes los permisos necesarios.' });
                return;
            }
            next();
        };
    },
};
