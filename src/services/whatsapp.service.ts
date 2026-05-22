import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import prisma from "../config/prisma";
import { AIService } from "./ia.service";

class WhatsAppBot {
  private client: Client;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });
  }

  public init() {
    this.client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
    this.client.on("ready", () =>
      console.log("LocalHost Lounge Bot activo y operando"),
    );

    this.client.on("message", async (msg) => {
      try {
        if (msg.from === "status@broadcast" || msg.from.endsWith("@g.us"))
          return;

        const chat = await msg.getChat();
        const recentMessages = await chat.fetchMessages({ limit: 10 });
        const lastBotMessage = recentMessages.reverse().find((m) => m.fromMe);
        const refMatch = lastBotMessage
          ? lastBotMessage.body.match(/\(Ref:\s*(\d+)\)/)
          : null;

        if (!lastBotMessage || !refMatch) return;

        const reservationId = parseInt(refMatch[1], 10);
        const activeReservation = await prisma.reservation.findUnique({
          where: { id: reservationId },
        });

        if (
          !activeReservation ||
          ["FINALIZADA", "RECHAZADA"].includes(activeReservation.status)
        )
          return;

        if (activeReservation.support_required) {
          console.log(
            `[BOT] Silenciado: Reserva ${reservationId} en manos de un asesor.`,
          );
          return;
        }

        const clientText = msg.body.trim();

        await prisma.message.create({
          data: {
            reservation_id: activeReservation.id,
            sender: "CLIENTE",
            content: clientText,
          },
        });

        const aiAnalysis =
          await AIService.analyzeReservationResponse(clientText);

        const botReply = aiAnalysis.reply;
        if (botReply) {
          await prisma.message.create({
            data: {
              reservation_id: activeReservation.id,
              sender: "BOT",
              content: botReply,
            },
          });
          await msg.reply(botReply);
        }

        if (aiAnalysis.intent === "CONFIRMAR") {
          await prisma.reservation.update({
            where: { id: activeReservation.id },
            data: { status: "CONFIRMADA" },
          });
          console.log(`[BOT] Reserva ${reservationId} -> CONFIRMADA`);
        } else if (aiAnalysis.intent === "CANCELAR") {
          await prisma.reservation.update({
            where: { id: activeReservation.id },
            data: { status: "CANCELADA" },
          });
          console.log(`[BOT] Reserva ${reservationId} -> CANCELADA`);
        } else if (aiAnalysis.intent === "HUMAN_INTERVENTION") {
          await prisma.reservation.update({
            where: { id: activeReservation.id },
            data: { support_required: true },
          });
          console.log(
            `[ALERT] Reserva ${reservationId} requiere atención humana.`,
          );
        }
      } catch (error) {
        console.error("[BOT ERROR] Fallo crítico en el flujo:", error);
      }
    });

    this.client.initialize();
  }

  public async sendMessage(phoneNumber: string, message: string) {
    const chatId = `${phoneNumber}@c.us`;
    await this.client.sendMessage(chatId, message);
  }
}

export const WhatsAppService = new WhatsAppBot();
