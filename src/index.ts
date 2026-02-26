import express from 'express';
import cors from 'cors';
import { PORT } from './config/env';
import connectDB from './config/db';
import authRoutes from './routers/auther.router';
import riotRoutes from './routers/riot.router';
import favoriteRoutes from './routers/favorite.router';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initSocket } from './socket.server';
import { startPollingJob } from './services/LiveGame.job';

const app = express();
const httpServer = createServer(app);
connectDB();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/riot', riotRoutes);
app.use('/api/favorites', favoriteRoutes);

async function start() {
  await connectDB();;

  initSocket(httpServer);

  startPollingJob();

  httpServer.listen(5000, () => {
    console.log('[Server] Running on http://localhost:5000');
  });
}

start();