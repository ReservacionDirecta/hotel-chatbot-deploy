import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
})); 