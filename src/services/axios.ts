import axios, { AxiosInstance } from 'axios';
import { RIOT_API_KEY } from '../config/env';

export const riotApi: AxiosInstance = axios.create({
  timeout: 5000,
  headers: { 'X-Riot-Token': RIOT_API_KEY },
});

riotApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        await new Promise((r) => setTimeout(r, Number(retryAfter) * 1000));
        return riotApi(error.config);
      }
    }
    return Promise.reject(error);
  },
);
