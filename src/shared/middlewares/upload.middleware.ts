import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { env } from '../config/env';
import { format } from 'node:path';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'lhl_menu',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      format: 'webp',
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    };
  },
});

export const uploadImage = multer({ storage: storage });
