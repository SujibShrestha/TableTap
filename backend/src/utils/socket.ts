import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
  });

  io.on('connection', (socket) => {
    // ===== STAFF: join role room via JWT =====
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { role: string };
        socket.join(payload.role.toLowerCase()); // e.g. "kitchen", "waiter", "admin", "cashier"
      } catch {
        // invalid/expired token — socket just won't join a role room, no crash
      }
    }

    // ===== CUSTOMER: join session room on request =====
    socket.on('join-session', (sessionId: string) => {
      if (typeof sessionId === 'string' && sessionId.length > 0) {
        socket.join(`session:${sessionId}`);
      }
    });

    socket.on('disconnect', () => {
      // socket.io automatically cleans up room membership on disconnect
    });
  });

  return io;
}

export function getIo() {
  if (!io) throw new Error('Socket.io not initialized yet');
  return io;
}