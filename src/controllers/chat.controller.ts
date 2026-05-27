import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AIService } from '../services/ai.service';
import { ChatService } from '../services/chat.service';
import { logger } from '../utils/logger';

export const ChatController = {
  async handleWebMessage(req: Request, res: Response): Promise<Response | void> {
    try {
      const { sessionToken, clientId, message, role } = req.body;

      if (!sessionToken || !message) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (sessionToken, message)' });
      }

      const userRole = role || 'CLIENTE';

      let session = await prisma.chat_Session.findUnique({
        where: { session_token: sessionToken },
      });
      if (!session) {
        session = await prisma.chat_Session.create({
          data: { session_token: sessionToken, client_id: clientId || null },
        });
      }

      const historyRaw = await prisma.chat_Message.findMany({
        where: { session_id: session.id },
        orderBy: { created_on: 'desc' },
        take: 6,
      });
      const history = historyRaw.reverse();

      await prisma.chat_Message.create({
        data: { session_id: session.id, role: userRole, content: message },
      });

      let aiResponse;
      if (userRole === 'RECEPCIONISTA' || userRole === 'ADMIN') {
        aiResponse = await AIService.processWorkerWebMessage(message, history);
      } else {
        aiResponse = await AIService.processClientWebMessage(message, history);
      }

      if (typeof aiResponse.payload === 'string') {
        try {
          aiResponse.payload = JSON.parse(aiResponse.payload);
        } catch {
          aiResponse.payload = {};
        }
      }
      if (!aiResponse.payload || typeof aiResponse.payload !== 'object') aiResponse.payload = {};

      aiResponse = await ChatService.executeAction(
        aiResponse,
        session,
        clientId,
        userRole,
        typeof message === 'string' ? message : ''
      );

      await prisma.chat_Message.create({
        data: { session_id: session.id, role: 'BOT', content: aiResponse.reply },
      });

      return res.status(200).json({
        action: aiResponse.action,
        reply: aiResponse.reply,
        payload: aiResponse.payload,
      });
    } catch (error) {
      logger.error('[CHAT CTRL ERROR] Fallo al procesar el chat web:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};
