import app from './app';
import { env } from './config/env'

app.listen(env.PORT, () => {
  console.log(`[SERVER] LocalHost Lounge API está disponible`);
  console.log(`[SERVER] Corriendo en el puerto: ${env.PORT}`);
  console.log(`[SERVER] Health Check: http://localhost:${env.PORT}/api/health`);
});