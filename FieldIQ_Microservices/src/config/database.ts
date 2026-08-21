import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // Prevent multiple instances in dev HMR
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
    errorFormat: 'pretty',
  });

if (env.isDevelopment) {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌 PostgreSQL disconnected');
}
