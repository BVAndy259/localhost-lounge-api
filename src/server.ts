import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${env.PORT}`;

app.listen(env.PORT, () => {
  logger.info(`[SERVER] LocalHost Lounge API está disponible`);
  logger.info(`[SERVER] Corriendo en el puerto: ${env.PORT}`);
  logger.info(`[SERVER] Health Check: ${serverUrl}/api/health`);
});
