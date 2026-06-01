import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL as string,
  DIRECT_URL: process.env.DIRECT_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY as string,
};

if (!env.DATABASE_URL || !env.DIRECT_URL) {
  throw new Error('[ENV ERROR] Falta la variable DATABASE_URL en el archivo .env');
}

if (!env.JWT_SECRET) {
  throw new Error('[ENV ERROR] Falta JWT_SECRET en el archivo .env');
}

if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  throw new Error('[ENV ERROR] Faltan credenciales de Cloudinary en el archivo .env');
}

if (!env.OPENROUTER_API_KEY) {
  throw new Error('[ENV ERROR] Falata la API KEY de Open Router en el archivo .env');
}
