import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './env';

let io: SocketIOServer | null = null;

export function createSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log('✅ Socket.io server initialized');
  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server not initialized. Call createSocketServer() first.');
  }
  return io;
}

// ─── Room Utilities ──────────────────────────────────────────────────────────
export const SocketRooms = {
  employee: (id: string) => `employee:${id}`,
  admin: () => 'admin:room',
  route: (routeId: string) => `route:${routeId}`,
} as const;

// ─── Event Names ─────────────────────────────────────────────────────────────
export const SocketEvents = {
  // Server → Client
  ROUTE_ASSIGNED: 'route:assigned',
  EMPLOYEE_LOCATION: 'employee:location',
  TASK_CHECKED_IN: 'task:checked_in',
  INVOICE_SUBMITTED: 'invoice:submitted',
  INVOICE_ANALYZED: 'invoice:analyzed',
  EMPLOYEE_CONNECTED: 'employee:connected',
  EMPLOYEE_DISCONNECTED: 'employee:disconnected',

  // Client → Server
  JOIN_ROOM: 'room:join',
  BROADCAST_LOCATION: 'location:broadcast',
  ADMIN_JOIN: 'admin:join',
} as const;
