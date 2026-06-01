"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const waiter_routes_1 = __importDefault(require("./routes/waiter.routes"));
const plate_routes_1 = __importDefault(require("./routes/plate.routes"));
const table_routes_1 = __importDefault(require("./routes/table.routes"));
const reservation_routes_1 = __importDefault(require("./routes/reservation.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const logger_middleware_1 = __importDefault(require("./middlewares/logger.middleware"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.set('etag', false);
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(logger_middleware_1.default);
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Backend Corriendo...',
    });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/waiters', waiter_routes_1.default);
app.use('/api/plates', plate_routes_1.default);
app.use('/api/tables', table_routes_1.default);
app.use('/api/reservations', reservation_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use(error_middleware_1.default);
exports.default = app;
