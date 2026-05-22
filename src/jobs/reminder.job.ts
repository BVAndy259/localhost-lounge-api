import cron from "node-cron";
import prisma from "../config/prisma";
import { WhatsAppService } from "../services/whatsapp.service";

export const ReminderJob = {
  init() {
    cron.schedule("* * * * *", async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const reservations = await prisma.reservation.findMany({
          where: {
            reservation_date: tomorrow,
            status: "PENDIENTE",
            reminder_sent: false,
          },
          include: {
            client: true,
          },
        });

        if (reservations.length === 0) return;

        for (const reservation of reservations) {
          const clientName = reservation.client.name;
          const phoneNumber = `51${reservation.client.phone_number.replace(/\D/g, "")}`;

          const textMessage = `¡Hola ${clientName}! Te escribe el asistente virtual de *LocalHost Lounge*.\n\nTe escribimos para confirmar tu reserva de mañana para ${reservation.number_people} personas.\n\n¿Confirmas tu asistencia? (Responde *SÍ* o *NO*)\n\n_(Ref: ${reservation.id})_`;

          await WhatsAppService.sendMessage(phoneNumber, textMessage);

          await prisma.reservation.update({
            where: { id: reservation.id },
            data: { reminder_sent: true },
          });

          console.log(
            `[CRON] Recordatorio enviado exitosamente para la Reserva ID: ${reservation.id}`,
          );
        }
      } catch (error) {
        console.error(
          "[CRON ERROR] Fallo en la tarea de recordatorios:",
          error,
        );
      }
    });

    console.log("Cron Job de recordatorios inicializado");
  },
};
