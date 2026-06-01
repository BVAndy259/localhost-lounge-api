"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const validateBody = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                path: issue.path,
                message: issue.message,
            }));
            res.status(400).json({ error: 'Payload inválido', details });
            return;
        }
        req.body = result.data;
        next();
    };
};
exports.validateBody = validateBody;
exports.default = exports.validateBody;
