"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.env = {
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    ADMIN_NAME: process.env.ADMIN_NAME,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
};
if (!exports.env.DATABASE_URL || !exports.env.DIRECT_URL) {
    throw new Error('[ENV ERROR] Falta la variable DATABASE_URL en el archivo .env');
}
if (!exports.env.JWT_SECRET) {
    throw new Error('[ENV ERROR] Falta JWT_SECRET en el archivo .env');
}
if (!exports.env.ADMIN_NAME || !exports.env.ADMIN_EMAIL || !exports.env.ADMIN_PASSWORD) {
    throw new Error('[ENV ERROR] Falta nombre, email o contraseña en el archivo .env');
}
if (!exports.env.CLOUDINARY_CLOUD_NAME || !exports.env.CLOUDINARY_API_KEY || !exports.env.CLOUDINARY_API_SECRET) {
    throw new Error('[ENV ERROR] Faltan credenciales de Cloudinary en el archivo .env');
}
if (!exports.env.OPENROUTER_API_KEY) {
    throw new Error('[ENV ERROR] Faltan la API KEY de Open Router en el archivo .env');
}
