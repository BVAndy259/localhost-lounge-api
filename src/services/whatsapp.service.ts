import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import prisma from "../config/prisma";

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
      console.log("¡LocalHost Lounge Bot conectado!"),
    );

    this.client.on("message", async (msg) => {
      try {
        if (msg.from === "status@broadcast" || msg.from.endsWith("@g.us"))
          return;

        const chat = await msg.getChat();
        const recentMessages = await chat.fetchMessages({ limit: 10 });
        const lastBotMessage = recentMessages.reverse().find((m) => m.fromMe);

        if (!lastBotMessage) return;

        const refMatch = lastBotMessage.body.match(/\(Ref:\s*(\d+)\)/);
        if (!refMatch) return;

        const reservationId = parseInt(refMatch[1], 10);

        const activeReservation = await prisma.reservation.findUnique({
          where: { id: reservationId },
        });

        if (!activeReservation || activeReservation.status !== "PENDIENTE")
          return;

        const userText = msg.body.trim().toUpperCase();

        if (userText === "SÍ" || userText === "SI") {
          await prisma.reservation.update({
            where: { id: activeReservation.id },
            data: { status: "CONFIRMADA" },
          });
          await msg.reply(
            "¡Excelente! Tu reserva ha sido *CONFIRMADA* en el sistema. Te esperamos.",
          );

          console.log(
            `[BOT] Reserva ID: ${activeReservation.id} -> CONFIRMADA`,
          );
        } else if (userText === "NO") {
          await prisma.reservation.update({
            where: { id: activeReservation.id },
            data: { status: "CANCELADA" },
          });
          await msg.reply("Entendido. Tu reserva ha sido *CANCELADA*.");

          console.log(`[BOT] Reserva ID: ${activeReservation.id} -> CANCELADA`);
        } else {
          await msg.reply(
            "Por favor, responde únicamente *SÍ* o *NO* para procesar tu confirmación.",
          );
        }
      } catch (error) {
        console.error(
          "[BOT ERROR] Fallo al procesar el mensaje entrante:",
          error,
        );
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
