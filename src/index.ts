import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initSocket } from './socket.server';
import { FRONTEND_URL } from './config/env';
import authRoutes from './routers/auther.router';
import riotRoutes from './routers/player.router';
import favoriteRoutes from './routers/favorite.router';
import liveGameRoutes from './routers/liveGame.router';
import healthRouter from './routers/health.router';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';
import helmet from 'helmet';
import { serverAdapter } from './monitoring/bullBoard';
import { startPollerQueue } from './jobs/poller.queue';
const app = express();
const httpServer = createServer(app);
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/admin/queues', serverAdapter.getRouter());
app.use('/health', healthRouter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/riot', apiLimiter, riotRoutes);
app.use('/api/favorites', apiLimiter, favoriteRoutes);
app.use('/api/live-games', apiLimiter, liveGameRoutes);

async function start() {
  await connectDB();

  initSocket(httpServer);

  startPollerQueue();

  httpServer.listen(5000, () => {
    console.log('[Server] Running on http://localhost:5000');
  });
}

start();
