import axios, { AxiosInstance } from 'axios';
import { RIOT_API_KEY } from '../config/env';
import { logger } from './logger';

export const riotApi: AxiosInstance = axios.create({
  timeout: 8000,
  headers: { 'X-Riot-Token': RIOT_API_KEY },
});

riotApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;
    config._retryCount = config._retryCount ?? 0;

    if (error.response?.status === 429 && config._retryCount < 3) {
      config._retryCount++;
      const retryAfter = Number(error.response.headers['retry-after'] ?? 5);
      logger.warn(
        { retryAfter, attempt: config._retryCount },
        'Riot 429 — retrying',
      );
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return riotApi(config);
    }

    return Promise.reject(error);
  },
);
