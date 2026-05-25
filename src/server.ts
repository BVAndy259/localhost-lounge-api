import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

app.listen(env.PORT, () => {
  logger.info(`[SERVER] LocalHost Lounge API está disponible`);
  logger.info(`[SERVER] Corriendo en el puerto: ${env.PORT}`);
  logger.info(`[SERVER] Health Check: http://localhost:${env.PORT}/api/health`);
});
