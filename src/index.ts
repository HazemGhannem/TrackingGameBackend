import express from 'express';
import cors from 'cors';
import { PORT,JWT_SECRET } from './config/env';
import connectDB from './config/db';
import authRoutes from './routers/auther.router';
import riotRoutes from './routers/riot.router';


const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use('/api/auth', authRoutes);
app.use('/api/riot', riotRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'LoL API Server Running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
