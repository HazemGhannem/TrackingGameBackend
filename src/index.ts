import express from 'express';
import cors from 'cors';
import { PORT } from './config/env';
import connectDB from './config/db';
import authRoutes from './routers/auther.router';
import riotRoutes from './routers/riot.router';
import favoriteRoutes from './routers/favorite.router';

const app = express();
connectDB();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded());
app.use('/api/auth', authRoutes);
app.use('/api/riot', riotRoutes);
app.use('/api/favorites', favoriteRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'LoL API Server Running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
