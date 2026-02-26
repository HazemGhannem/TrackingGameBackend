import axios, { AxiosInstance } from 'axios';
import {
  PaginationOptions,
  PlatformRegion,
  PlayerProfile,
  RiotAccount,
  RiotRegion,
} from '../interfaces/riot.interface';
import { Redis } from 'ioredis';
import { REDIS_URL, RIOT_API_KEY } from '../config/env';
import PlayerModel from '../models/riot.model';
import { resoleRegionsFromTag } from '../utils/utiles';

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

async function createOrUpdateDB(
  puuid: string,
  data: Record<string, any>,
): Promise<(Document & PlayerProfile) | null> {
  return PlayerModel.findOneAndUpdate(
    { puuid },
    { $set: data },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}
export const getAccountByRiotId = async (
  gameName: string,
  tagLine: string,
): Promise<RiotAccount> => {
  const { platformRegion, routingRegion } = resoleRegionsFromTag(tagLine);
  const cacheKey = `basic:${platformRegion}:${gameName}${tagLine}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  console.log(routingRegion, platformRegion);
  const response = await riotApi.get(
    `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
  );
  const { puuid } = response.data;
  const [summonerRes, rankedRes] = await Promise.all([
    riotApi.get(
      `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    ),
    riotApi.get(
      `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
    ),
  ]);
  const result = {
    puuid,
    gameName,
    tagLine,
    profileIconId: summonerRes.data.profileIconId,
    summonerLevel: summonerRes.data.summonerLevel,
    ranked: rankedRes.data,
  };
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
  return result;
};

export const getFullPlayerProfile = async (
  region: RiotRegion,
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
  console.log(
    platformRegion,
    'platformRegion from getFullPlayerProfile  /// api key:',
    RIOT_API_KEY,
  );
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
      `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`,
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
export const getPlayerProfileWithFallback = async (
  gameName: string,
  tagLine: string,
  routingRegion: RiotRegion,
  platformRegion: PlatformRegion,
  options?: PaginationOptions,
) => {
  // 1️⃣ Try DB first
  const dbPlayer = await PlayerModel.findOne({
    gameName: { $regex: new RegExp(`^${gameName}$`, 'i') },
    tagLine: { $regex: new RegExp(`^${tagLine}$`, 'i') },
  });

  // Check if DB data is fresh (less than 1 hour old)
  const isFresh =
    dbPlayer &&
    Date.now() - new Date(dbPlayer.updatedAt as any).getTime() < 3600_000;

  if (dbPlayer && isFresh) {
    console.log('🚀 Data found in DB and is fresh. Returning...');
    return {
      summoner: {
        profileIconId: dbPlayer.profileIconId,
        summonerLevel: dbPlayer.summonerLevel,
        puuid: dbPlayer.puuid,
      },
      ranked: dbPlayer.ranked,
      gameName: dbPlayer.gameName,
      tagLine: dbPlayer.tagLine,
      _id: dbPlayer._id,
      source: 'database',
    };
  }

  // 2️⃣ Resolve PUUID (from DB if exists, else Riot)
  let targetPuuid = dbPlayer?.puuid;
  if (!targetPuuid) {
    console.log('🔍 Player not in DB. Resolving PUUID from Riot...');
    const account = await getAccountByRiotId(gameName, tagLine);
    targetPuuid = account.puuid;
  }

  // 3️⃣ Fetch full profile from Riot API
  console.log('🌐 Fetching full profile from Riot API...');
  const riotData = await getFullPlayerProfile(
    routingRegion,
    platformRegion,
    targetPuuid,
    options,
  );

  // 4️⃣ Update DB
  const dbUpdateData = {
    puuid: targetPuuid,
    gameName,
    tagLine,
    profileIconId: riotData.summoner.profileIconId,
    summonerLevel: riotData.summoner.summonerLevel,
    ranked: riotData.ranked,
  };

  const savedPlayer = await createOrUpdateDB(targetPuuid, dbUpdateData);
  if (!savedPlayer) {
    throw new Error(`Failed to save player ${gameName}#${tagLine} to database`);
  }
  return { ...riotData, _id: savedPlayer._id, source: 'riot-api' };
};
