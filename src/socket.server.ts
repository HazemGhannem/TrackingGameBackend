import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { GameNotification } from './interfaces/LiveGame.types';
import { logger } from './utils/logger';

let io: SocketServer;

// userId → Set of socketIds (handles multiple tabs / devices)
const userSockets = new Map<string, Set<string>>();

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      logger.warn(
        { socketId: socket.id },
        'Socket connected without userId — disconnecting',
      );
      socket.disconnect();
      return;
    }

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket.id);

    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    socket.on('disconnect', () => {
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
      logger.info({ userId, socketId: socket.id }, 'Socket disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ userId, socketId: socket.id, err }, 'Socket error');
    });
  });

  logger.info('Socket server initialized');
  return io;
}

export function notifyUser(
  userId: string,
  notification: GameNotification,
): void {
  if (!io) {
    logger.warn('notifyUser called before socket server initialized');
    return;
  }

  const sockets = userSockets.get(userId);
  if (!sockets?.size) return;  

  for (const socketId of sockets) {
    io.to(socketId).emit('game-notification', notification);
  }

  logger.info({ userId, type: notification.type }, 'User notified');
}

export function getConnectedUserCount(): number {
  return userSockets.size;
}
