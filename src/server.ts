import app from "./app";
import { env } from "./config/env";
import { ReminderJob } from "./jobs/reminder.job";
import { WhatsAppService } from "./services/whatsapp.service";

app.listen(env.PORT, () => {
  console.log(`[SERVER] LocalHost Lounge API está disponible`);
  console.log(`[SERVER] Corriendo en el puerto: ${env.PORT}`);
  console.log(`[SERVER] Health Check: http://localhost:${env.PORT}/api/health`);
});

WhatsAppService.init();
ReminderJob.init();
