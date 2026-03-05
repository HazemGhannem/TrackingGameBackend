import { Request, Response } from 'express';
import mongoose from 'mongoose';
import redisClient from '../services/redis.service';

export async function healthCheck(_req: Request, res: Response) {
  const redisOk = await redisClient
    .ping()
    .then(() => true)
    .catch(() => false);
  const mongoOk = mongoose.connection.readyState === 1;
  const status = redisOk && mongoOk ? 200 : 503;

  res.status(status).json({
    status: status === 200 ? 'ok' : 'degraded',
    redis: redisOk,
    mongo: mongoOk,
    uptime: Math.floor(process.uptime()),
  });
}
