import { LiveGameData, LiveGameParticipant } from '../interfaces/LiveGame.types';
import redisClient from './redis.service';
import {
  MatchResult,
  PLATFORM_HOSTS,
  PlatformRegion,
  RiotRegion,
  TagToPlatformTag,
} from '../interfaces/player.interface';
import { riotApi } from './axios';

export async function getLiveGame(
  puuid: string,
  platform: PlatformRegion = PlatformRegion.EUW1,
): Promise<LiveGameData | null> {
  const host =
    TagToPlatformTag[platform] ?? PLATFORM_HOSTS[PlatformRegion.EUW1];
  const url = `https://${host}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;

  try {
      const { data } = await riotApi.get<LiveGameData>(url);
      data.participants = await resolveChampionNames(data.participants);
    console.log(
      `[Spectator] ✅ ${puuid.slice(0, 12)}... is IN-GAME gameId=${data.gameId}`,
    );
     
    return data;
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    console.error(
      `[Spectator] ❌ status=${err.response?.status} body=`,
      JSON.stringify(err.response?.data),
    );
    console.error(
      `[Spectator] API key used: ${process.env.RIOT_API_KEY?.slice(0, 12)}...`,
    );
    return null;
  }
}

export async function getLastMatchResult(
  puuid: string,
  routing: RiotRegion = RiotRegion.EUROPE,
): Promise<MatchResult | null> {
  const cacheKey = `lastMatch:${puuid}:${routing}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached) as MatchResult;

  try {
    const { data: matchIds } = await riotApi.get<string[]>(
      `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`,
    );

    if (!matchIds.length) return null;

    const { data: match } = await riotApi.get<any>(
      `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchIds[0]}`,
    );

    const participant = match.info.participants.find(
      (p: any) => p.puuid === puuid,
    );
    if (!participant) return null;

    const result: MatchResult = {
      result: participant.win ? 'WIN' : 'LOSS',
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      championName: participant.championName,
      gameDurationMinutes: Math.round(match.info.gameDuration / 60),
    };

    // Cache for 5 minutes
    await redisClient.setex(cacheKey, 60 * 5, JSON.stringify(result));
    return result;
  } catch (err: any) {
    console.error(`[Match] ❌ error:`, err.response?.data ?? err.message);
    return null;
  }
}

export function platformToRouting(platform: PlatformRegion): RiotRegion {
  const map: Record<PlatformRegion, RiotRegion> = {
    [PlatformRegion.NA1]: RiotRegion.AMERICAS,
    [PlatformRegion.EUW1]: RiotRegion.EUROPE,
    [PlatformRegion.EUN1]: RiotRegion.EUROPE,
    [PlatformRegion.KR1]: RiotRegion.ASIA,
  };

  return map[platform] ?? RiotRegion.EUROPE;
}
async function resolveChampionNames(participants: LiveGameParticipant[]) {
  const cacheKey = 'ddragon:champions';
  let championMap: Record<number, string> = {};

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    championMap = JSON.parse(cached);
  } else {
    const { data: versions } = await riotApi.get(
      'https://ddragon.leagueoflegends.com/api/versions.json',
    );
    const latestVersion = versions[0];

    const { data: champData } = await riotApi.get(
      `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`,
    );

    for (const champ of Object.values(champData.data) as any[]) {
      championMap[parseInt(champ.key)] = champ.id;
    }

    await redisClient.setex(
      cacheKey,
      60 * 60 * 24,
      JSON.stringify(championMap),
    );
  }

  return participants.map((p) => ({
    ...p,
    championName: championMap[p.championId] ?? `Champion_${p.championId}`,
  }));
}