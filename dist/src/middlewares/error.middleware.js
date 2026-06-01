"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const httpError_1 = __importDefault(require("../utils/httpError"));
function errorHandler(err, req, res, next) {
    void req;
    void next;
    logger_1.logger.error(err?.message ?? err);
    if (err instanceof httpError_1.default) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
}
exports.default = errorHandler;
