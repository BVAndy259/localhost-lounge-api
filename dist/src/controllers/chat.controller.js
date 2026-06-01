"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ai_service_1 = require("../services/ai.service");
const chat_service_1 = require("../services/chat.service");
const logger_1 = require("../utils/logger");
exports.ChatController = {
    async handleWebMessage(req, res) {
        try {
            const { sessionToken, clientId, message, role } = req.body;
            if (!sessionToken || !message) {
                return res.status(400).json({ error: 'Faltan datos obligatorios (sessionToken, message)' });
            }
            const userRole = role || 'CLIENTE';
            let session = await prisma_1.default.chat_Session.findUnique({
                where: { session_token: sessionToken },
                include: { client: true },
            });
            if (!session) {
                session = await prisma_1.default.chat_Session.create({
                    data: { session_token: sessionToken, client_id: clientId || null },
                    include: { client: true },
                });
            }
            const historyRaw = await prisma_1.default.chat_Message.findMany({
                where: { session_id: session.id },
                orderBy: { created_on: 'desc' },
                take: 6,
            });
            const history = historyRaw.reverse();
            await prisma_1.default.chat_Message.create({
                data: { session_id: session.id, role: userRole, content: message },
            });
            let aiResponse;
            if (userRole === 'RECEPCIONISTA' || userRole === 'ADMIN') {
                aiResponse = await ai_service_1.AIService.processWorkerWebMessage(message, history, userRole);
            }
            else {
                aiResponse = await ai_service_1.AIService.processClientWebMessage(message, history, session?.client);
            }
            if (typeof aiResponse.payload === 'string') {
                try {
                    aiResponse.payload = JSON.parse(aiResponse.payload);
                }
                catch {
                    aiResponse.payload = {};
                }
            }
            if (!aiResponse.payload || typeof aiResponse.payload !== 'object')
                aiResponse.payload = {};
            aiResponse = await chat_service_1.ChatService.executeAction(aiResponse, session, clientId, userRole, typeof message === 'string' ? message : '');
            await prisma_1.default.chat_Message.create({
                data: { session_id: session.id, role: 'BOT', content: aiResponse.reply },
            });
            return res.status(200).json({
                action: aiResponse.action,
                reply: aiResponse.reply,
                payload: aiResponse.payload,
            });
        }
        catch (error) {
            logger_1.logger.error('[CHAT CTRL ERROR] Fallo al procesar el chat web:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
};
