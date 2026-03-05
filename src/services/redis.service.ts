import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { REDIS_URL } from '../config/env';
const parsedUrl = new URL(REDIS_URL);

const redisClient = new IORedis(REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
export const connection = {
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port),
  username: parsedUrl.username,
  password: parsedUrl.password,
  tls: {},
};
redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

export async function safeRedisGet(key: string): Promise<string | null> {
  try {
    return await redisClient.get(key);
  } catch (err) {
    logger.error({ err, key }, 'Redis GET failed');
    return null;
  }
}

export async function safeRedisSetex(
  key: string,
  ttl: number,
  value: string,
): Promise<void> {
  try {
    await redisClient.setex(key, ttl, value);
  } catch (err) {
    logger.error({ err, key }, 'Redis SETEX failed');
  }
}

export default redisClient;
