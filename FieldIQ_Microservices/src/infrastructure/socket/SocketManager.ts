import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { SocketEvents, SocketRooms } from '../../config/socket';
import { prisma } from '../../config/database';

interface AuthenticatedSocket extends Socket {
  employeeId?: string;
  role?: string;
  name?: string;
}

export function registerSocketHandlers(io: SocketIOServer): void {
  // ── Authentication Middleware ───────────────────────────────────────────────
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('SOCKET_AUTH_REQUIRED'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        role: string;
        name: string;
      };

      socket.employeeId = payload.sub;
      socket.role = payload.role;
      socket.name = payload.name;
      next();
    } catch {
      next(new Error('SOCKET_INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(
      `🔌 Socket connected: ${socket.id} | Employee: ${socket.name} (${socket.role})`,
    );

    // ── Auto-join rooms ────────────────────────────────────────────────────
    if (socket.employeeId) {
      socket.join(SocketRooms.employee(socket.employeeId));
    }

    if (socket.role === 'ADMIN') {
      socket.join(SocketRooms.admin());
    }

    // Broadcast to admin room that employee is online
    if (socket.role === 'EMPLOYEE' && socket.employeeId) {
      io.to(SocketRooms.admin()).emit(SocketEvents.EMPLOYEE_CONNECTED, {
        employeeId: socket.employeeId,
        name: socket.name,
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
      });
    }

    // ── Admin: Join room manually ──────────────────────────────────────────
    socket.on(SocketEvents.ADMIN_JOIN, () => {
      if (socket.role === 'ADMIN') {
        socket.join(SocketRooms.admin());
      }
    });

    // ── Employee: Broadcast live location ─────────────────────────────────
    socket.on(
      SocketEvents.BROADCAST_LOCATION,
      async (data: { lat: number; lng: number }) => {
        if (!socket.employeeId) return;

        // Persist to DB asynchronously — do not await to avoid blocking
        prisma.employee
          .update({
            where: { id: socket.employeeId },
            data: {
              lastLat: data.lat,
              lastLng: data.lng,
              lastSeenAt: new Date(),
            },
          })
          .catch((err: Error) => console.error('Location persist error:', err));

        // Forward to admin room
        io.to(SocketRooms.admin()).emit(SocketEvents.EMPLOYEE_LOCATION, {
          employeeId: socket.employeeId,
          name: socket.name,
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString(),
        });
      },
    );

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`);

      if (socket.role === 'EMPLOYEE' && socket.employeeId) {
        io.to(SocketRooms.admin()).emit(SocketEvents.EMPLOYEE_DISCONNECTED, {
          employeeId: socket.employeeId,
          name: socket.name,
          disconnectedAt: new Date().toISOString(),
        });
      }
    });
  });
}
