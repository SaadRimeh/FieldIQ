// dotenv is loaded via src/config/env.ts — no need to import it here again.
import http from 'http';
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { createSocketServer } from './config/socket';
import { registerSocketHandlers } from './infrastructure/socket/SocketManager';
import { MessageBrokerService } from './application/services/MessageBrokerService';

// Routes
import authRoutes from './interfaces/http/routes/auth.routes';
import dispatchRoutes from './interfaces/http/routes/dispatch.routes';
import taskRoutes from './interfaces/http/routes/task.routes';
import invoiceRoutes from './interfaces/http/routes/invoice.routes';

// Middleware
import {
  errorMiddleware,
  notFoundHandler,
} from './interfaces/http/middleware/error.middleware';

// ── App Bootstrap ─────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  const app: Application = express();
  const httpServer = http.createServer(app);

  // ── Security ────────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploads
    }),
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-AI-Secret'],
      credentials: true,
    }),
  );

  // ── Rate Limiting ────────────────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,  // Stricter for login endpoint
    message: { success: false, error: 'Too many login attempts' },
  });

  app.use(globalLimiter);

  // ── Core Middleware ──────────────────────────────────────────────────────
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ── Static Files (invoice images) ────────────────────────────────────────
  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

  // ── Health Check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'FieldIQ API Gateway',
      timestamp: new Date().toISOString(),
      broker: MessageBrokerService.isReady() ? 'connected' : 'offline',
    });
  });

  // ── API Routes ───────────────────────────────────────────────────────────
  const prefix = env.API_PREFIX;
  app.use(`${prefix}/auth`, authLimiter, authRoutes);
  app.use(`${prefix}/dispatch`, dispatchRoutes);
  app.use(`${prefix}/tasks`, taskRoutes);
  app.use(`${prefix}/invoices`, invoiceRoutes);

  // ── 404 + Error Handling ─────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorMiddleware);

  // ── Socket.io ────────────────────────────────────────────────────────────
  const io = createSocketServer(httpServer);
  registerSocketHandlers(io);

  // ── Database ─────────────────────────────────────────────────────────────
  await connectDatabase();

  // ── Message Broker ────────────────────────────────────────────────────────
  await MessageBrokerService.initialize();

  // ── Start Server ──────────────────────────────────────────────────────────
  httpServer.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║          FieldIQ API Gateway — Online            ║
╠══════════════════════════════════════════════════╣
║  ENV   : ${env.NODE_ENV.padEnd(38)}║
║  PORT  : ${String(env.PORT).padEnd(38)}║
║  API   : http://localhost:${env.PORT}${env.API_PREFIX.padEnd(17)}║
╚══════════════════════════════════════════════════╝
    `);
  });

  // ── Graceful Shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);

    httpServer.close(async () => {
      await MessageBrokerService.close();
      await disconnectDatabase();
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled rejection guard
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
