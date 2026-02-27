import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routers/auther.router';
import riotRoutes from './routers/player.router';
import favoriteRoutes from './routers/favorite.router';
import liveGameRoutes from './routers/liveGame.router';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initSocket } from './socket.server';
import { startPollingJob } from './services/LiveGame.job';
import { FRONTEND_URL } from './config/env';

const app = express();
const httpServer = createServer(app);
connectDB();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/riot', riotRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/live-games', liveGameRoutes);

async function start() {
  await connectDB();

  initSocket(httpServer);

  startPollingJob();

  httpServer.listen(5000, () => {
    console.log('[Server] Running on http://localhost:5000');
  });
}

start();
