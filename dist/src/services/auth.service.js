"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = require("../config/env");
const httpError_1 = __importDefault(require("../utils/httpError"));
exports.AuthService = {
    async registerUser(name, email, password, role) {
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser)
            throw new httpError_1.default(409, 'El email ya está registrado', 'EMAIL_EXISTS');
        const salt = await bcryptjs_1.default.genSalt(12);
        const password_hash = await bcryptjs_1.default.hash(password, salt);
        const newUser = await prisma_1.default.user.create({
            data: {
                name,
                email,
                password_hash,
                role: role || 'RECEPCIONISTA',
            },
        });
        const { password_hash: __newUser_password_hash, ...userWithoutPassword } = newUser;
        void __newUser_password_hash;
        return userWithoutPassword;
    },
    async loginUser(email, password) {
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user)
            throw new httpError_1.default(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');
        if (!user.active)
            throw new httpError_1.default(403, 'Cuenta suspendida. Ponte en contacto con el administrador.', 'ACCOUNT_SUSPENDED');
        const passwordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordValid)
            throw new httpError_1.default(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');
        const isSuperAdmin = user.email === env_1.env.ADMIN_EMAIL;
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, isSuperAdmin }, env_1.env.JWT_SECRET, {
            expiresIn: '8h',
        });
        const { password_hash: __user_password_hash, ...userData } = user;
        void __user_password_hash;
        return {
            user: {
                ...userData,
                isSuperAdmin,
            },
            token,
        };
    },
};
