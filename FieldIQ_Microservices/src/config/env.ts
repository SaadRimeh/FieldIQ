// env.ts is the single source of truth for all environment variables.
// dotenv is loaded here so that any module importing env (scripts, tests, etc.)
// gets variables populated regardless of the entry point.
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3001'), 10),
  API_PREFIX: optional('API_PREFIX', '/api/v1'),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
  ADMIN_SECRET: required('ADMIN_SECRET'),

  RABBITMQ_URL: optional('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'),
  RABBITMQ_INVOICE_QUEUE: optional('RABBITMQ_INVOICE_QUEUE', 'fieldiq.invoice.process'),
  RABBITMQ_RESULT_QUEUE: optional('RABBITMQ_RESULT_QUEUE', 'fieldiq.ai.results'),

  REDIS_URL: optional('REDIS_URL', 'redis://localhost:6379'),

  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:5173'),

  UPLOAD_DIR: optional('UPLOAD_DIR', './uploads'),
  MAX_FILE_SIZE_MB: parseInt(optional('MAX_FILE_SIZE_MB', '10'), 10),

  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
} as const;
