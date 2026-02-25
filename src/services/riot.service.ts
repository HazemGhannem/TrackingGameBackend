import axios, { AxiosInstance } from 'axios';
import {
  PaginationOptions,
  PlatformRegion,
  RiotAccount,
  RiotRegion,
} from '../interfaces/riot.interface';
import { Redis } from 'ioredis';
import { REDIS_URL, RIOT_API_KEY } from '../config/env';


const redis = new Redis(REDIS_URL);
const riotApi: AxiosInstance = axios.create({
  timeout: 5000,
  headers: {
    'X-Riot-Token': RIOT_API_KEY,
  },
});

riotApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        await new Promise((resolve) =>
          setTimeout(resolve, Number(retryAfter) * 1000),
        );
        return riotApi(error.config);
      }
    }
    return Promise.reject(error);
  },
);

const riotHeaders = {
  headers: { 'X-Riot-Token': RIOT_API_KEY },
};

export const getAccountByRiotId = async (
  region: string,
  gameName: string,
  tagLine: string,
): Promise<RiotAccount> => {
  const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName,
  )}/${encodeURIComponent(tagLine)}`;
  const response = await axios.get<RiotAccount>(url, riotHeaders);

  return response.data;
};

export const getFullPlayerProfile = async (
  routingRegion: RiotRegion,
  platformRegion: PlatformRegion,
  puuid: string,
  options?: PaginationOptions,
) => {
  const {
    matchPage = 1,
    matchPageSize = 15,
    masteryPage = 1,
    masteryPageSize = 10,
    matchType,
  } = options || {};

  const matchStart = (matchPage - 1) * matchPageSize;
  const masteryStart = (masteryPage - 1) * masteryPageSize;
  const cacheKey = `player:${platformRegion}:${puuid}:mPage=${matchPage}:mSize=${matchPageSize}:maPage=${masteryPage}:maSize=${masteryPageSize}`;
  // ✅ 1️⃣ Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // ✅ 2️⃣ Get Summoner (required first)
  const summonerRes = await riotApi.get(
    `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
  );

  // ✅ 3️⃣ Parallel calls (performance boost)
  const [masteryRes, rankedRes, matchesRes] = await Promise.all([
    riotApi.get(
      `https://${platformRegion}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
    ),
    riotApi.get(
      `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
    ),
    riotApi.get(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        params: {
          start: matchStart,
          count: matchPageSize,
          type: matchType,
        },
      },
    ),
  ]);

  const paginatedMastery = masteryRes.data.slice(
    masteryStart,
    masteryStart + masteryPageSize,
  );

  const result = {
    summoner: summonerRes.data,
    ranked: rankedRes.data,
    mastery: {
      page: masteryPage,
      pageSize: masteryPageSize,
      total: masteryRes.data.length,
      data: paginatedMastery,
    },
    matches: {
      page: matchPage,
      pageSize: matchPageSize,
      data: matchesRes.data,
    },
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);

  return result;
};
