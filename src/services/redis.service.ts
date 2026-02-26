import { Redis } from 'ioredis';
import { REDIS_URL } from '../config/env';

// Single shared ioredis instance — same client you already use in riot.service.ts
const redisClient = new Redis(REDIS_URL);

redisClient.on('error', (err) => console.error('[Redis] Error:', err));
redisClient.on('connect', () => console.log('[Redis] Connected'));

export default redisClient;
