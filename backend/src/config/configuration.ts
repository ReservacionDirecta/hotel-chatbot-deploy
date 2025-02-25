import { registerAs } from '@nestjs/config';
import whatsappConfig from './whatsapp.config';
import aiConfig from './ai.config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  whatsapp: whatsappConfig(),
  ai: aiConfig(),
})); 