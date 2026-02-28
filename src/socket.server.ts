import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { GameNotification } from './interfaces/LiveGame.types';

let io: SocketServer;

// userId → Set of socketIds (handles multiple tabs)
const userSockets = new Map<string, Set<string>>();

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket.id);
    console.log(`[Socket] User ${userId} connected — socket ${socket.id}`);

    socket.on('disconnect', () => {
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
      console.log(`[Socket] User ${userId} disconnected — socket ${socket.id}`);
    });
  });

  console.log('[Socket] Server initialized');
  return io;
}

export function notifyUser(userId: string, notification: GameNotification) {
  const sockets = userSockets.get(userId);
  if (!sockets?.size) return;

  for (const socketId of sockets) {
    io.to(socketId).emit('game-notification', notification);
  }

  console.log(`[Socket] Notified ${userId} → ${notification.type}`);
}
