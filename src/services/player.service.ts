import {
  ChallengerLeagueResponse,
  ChallengerPlayer,
  PaginationOptions,
  PlatformRegion,
  PlayerProfile,
  RiotAccount,
  RiotRegion,
  routingMap,
} from '../interfaces/player.interface';
import PlayerModel from '../models/player.model';
import { resoleRegionsFromTag } from '../utils/utiles';
import redisClient from './redis.service';
import { AppError } from '../utils/AppError';
import { riotApi } from './axios';

async function createOrUpdateDB(
  puuid: string,
  data: Partial<PlayerProfile>,
): Promise<(PlayerProfile & { _id: string }) | null> {
  return PlayerModel.findOneAndUpdate(
    { puuid },
    { $set: data },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  ).exec();
}

export const getAccountByRiotId = async (
  gameName: string,
  tagLine: string,
  routingRegion: string,
): Promise<RiotAccount> => {
  const { platformRegion } = resoleRegionsFromTag(tagLine);
  const cacheKey = `basic:${platformRegion}:${gameName}${tagLine}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached) as RiotAccount;

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

  const result: RiotAccount = {
    puuid,
    gameName,
    tagLine,
    profileIconId: summonerRes.data.profileIconId,
    summonerLevel: summonerRes.data.summonerLevel,
    ranked: rankedRes.data,
  };

  await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 60);
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

  const matchStart = (matchPage - 1) * matchPageSize;
  const masteryStart = (masteryPage - 1) * masteryPageSize;

  const cacheKey = `player:${platformRegion}:${puuid}:mPage=${matchPage}:mSize=${matchPageSize}:maPage=${masteryPage}:maSize=${masteryPageSize}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const summonerRes = await riotApi.get(
    `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
  );
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
        params: { start: matchStart, count: matchPageSize, type: matchType },
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

  await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 60);
  return result;
};

export const getPlayerProfileWithFallback = async (
  gameName: string,
  tagLine: string,
  routingRegion: RiotRegion,
  platformRegion: PlatformRegion,
  options?: PaginationOptions,
) => {
  const dbPlayer = await PlayerModel.findOne({
    gameName: { $regex: new RegExp(`^${gameName}$`, 'i') },
    tagLine: { $regex: new RegExp(`^${tagLine}$`, 'i') },
  }).exec();

  const isFresh =
    dbPlayer && Date.now() - new Date(dbPlayer.updatedAt!).getTime() < 3600_000;

  if (dbPlayer && isFresh) {
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
      platform: platformRegion,
      source: 'database',
    };
  }

  let targetPuuid = dbPlayer?.puuid;
  if (!targetPuuid) {
    const account = await getAccountByRiotId(gameName, tagLine, routingRegion);
    targetPuuid = account.puuid;
  }

  const riotData = await getFullPlayerProfile(
    routingRegion,
    platformRegion,
    targetPuuid,
    options,
  );

  const dbUpdateData = {
    puuid: targetPuuid,
    gameName,
    tagLine,
    profileIconId: riotData.summoner.profileIconId,
    summonerLevel: riotData.summoner.summonerLevel,
    ranked: riotData.ranked,
    platform: platformRegion,
  };

  const savedPlayer = await createOrUpdateDB(targetPuuid, dbUpdateData);
  if (!savedPlayer)
    throw new AppError(
      `Failed to save player ${gameName}#${tagLine} to database`,
      500,
    );

  return { ...riotData, _id: savedPlayer._id, source: 'riot-api' };
};
export const getTop10Challengers = async (
  platform: PlatformRegion,
): Promise<ChallengerPlayer[]> => {
  const routing = routingMap[platform];
  if (!routing) throw new AppError(`Invalid platform: ${platform}`, 400);
  const cacheKey = `challenger:top10:${platform}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);
  // 1. Fetch challenger league
  const leagueRes = await riotApi.get<ChallengerLeagueResponse>(
    `https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`,
  );

  // 2. Sort by LP desc, take top 10
  const top10 = [...leagueRes.data.entries]
    .sort((a, b) => b.leaguePoints - a.leaguePoints)
    .slice(0, 10);

  // 3. Fetch summoner + account info for each in parallel
  const enriched = await Promise.all(
    top10.map(async (entry, index) => {
      const [summonerRes, accountRes] = await Promise.all([
        riotApi.get(
          `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${entry.puuid}`,
        ),
        riotApi.get(
          `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${entry.puuid}`,
        ),
      ]);

      const winRate = Math.round(
        (entry.wins / (entry.wins + entry.losses)) * 100,
      );

      return {
        rank: index + 1,
        puuid: entry.puuid,
        gameName: accountRes.data.gameName as string,
        tagLine: accountRes.data.tagLine as string,
        profileIconId: summonerRes.data.profileIconId as number,
        summonerLevel: summonerRes.data.summonerLevel as number,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
        winRate,
        hotStreak: entry.hotStreak,
        veteran: entry.veteran,
        freshBlood: entry.freshBlood,
      } satisfies ChallengerPlayer;
    }),
  );
  await redisClient.set(cacheKey, JSON.stringify(enriched), 'EX', 300); // 5 min cache
  return enriched;
};
