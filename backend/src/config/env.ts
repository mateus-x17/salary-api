import 'dotenv/config';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  PORT: Number(process.env.PORT) || 3000,
};

if (!env.DATABASE_URL || !env.JWT_SECRET) {
  throw new Error('Environment variables DATABASE_URL and JWT_SECRET are required.');
}
