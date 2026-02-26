import axios, { AxiosInstance } from 'axios';
import { RIOT_API_KEY } from '../config/env';
import {
  LiveGameData,
  LiveGameParticipant,
} from '../interfaces/LiveGame.types';
import redisClient from './redis.service';
import PlayerModel from '../models/riot.model';

const riotApi: AxiosInstance = axios.create({
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

const PLATFORM_HOSTS: Record<string, string> = {
  na1: 'na1',
  euw1: 'euw1',
  eun1: 'eun1',
  kr: 'kr',
  br1: 'br1',
  oc1: 'oc1',
  la1: 'la1',
  la2: 'la2',
  ru: 'ru',
  tr1: 'tr1',
};

export async function getLiveGame(
  puuid: string,
  platform: string = 'euw1',
): Promise<LiveGameData | null> {
  const host = PLATFORM_HOSTS[platform] ?? 'euw1';
  const url = `https://${host}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;

  console.log(`[Spectator] GET ${url}`);

  try {
    const { data } = await riotApi.get<LiveGameData>(url);
    console.log(
      `[Spectator] ✅ ${puuid.slice(0, 12)}... is IN-GAME gameId=${data.gameId}`,
    );
    return data;
  } catch (err: any) {
    const status = err.response?.status;
    const body = err.response?.data;

    if (status === 404) {
      console.log(`[Spectator] 404 — not in game`);
      return null;
    }

    // ── This is the important line — shows the REAL error ──
    console.error(
      `[Spectator] ❌ status=${status} body=`,
      JSON.stringify(body),
    );
    console.error(`[Spectator] API key used: ${RIOT_API_KEY?.slice(0, 12)}...`);
    return null;
  }
}

export async function getLastMatchResult(
  puuid: string,
  routing: string = 'europe',
): Promise<{
  result: 'WIN' | 'LOSS';
  kills: number;
  deaths: number;
  assists: number;
  championName: string;
  gameDurationMinutes: number;
} | null> {
  try {
    const { data: matchIds } = await riotApi.get<string[]>(
      `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`,
    );

    if (!matchIds.length) return null;

    const { data: match } = await riotApi.get(
      `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchIds[0]}`,
    );

    const participant = match.info.participants.find(
      (p: any) => p.puuid === puuid,
    );
    if (!participant) return null;
    return {
      result: participant.win ? 'WIN' : 'LOSS',
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      championName: participant.championName,
      gameDurationMinutes: Math.round(match.info.gameDuration / 60),
    };
  } catch (err: any) {
    console.error(`[Match] ❌ error:`, err.response?.data ?? err.message);
    return null;
  }
}

export function platformToRouting(platform: string): string {
  const map: Record<string, string> = {
    na1: 'americas',
    br1: 'americas',
    la1: 'americas',
    la2: 'americas',
    euw1: 'europe',
    eun1: 'europe',
    tr1: 'europe',
    ru: 'europe',
    kr: 'asia',
    jp1: 'asia',
    oc1: 'sea',
  };
  return map[platform] ?? 'europe';
}
async function getSummonerId(
  puuid: string,
  platform: string,
): Promise<string | null> {
  const host = PLATFORM_HOSTS[platform] ?? 'euw1';
  const cacheKey = `summonerId:${puuid}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await riotApi.get(
      `https://${host}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    );
    await PlayerModel.updateOne({ puuid }, { $set: { summonerId: data.id } });
    await redisClient.setex(cacheKey, 60 * 60 * 24, data.id);
    return data.id;
  } catch (err: any) {
    console.error(
      `[Spectator] getSummonerId failed:`,
      err.response?.data ?? err.message,
    );
    return null;
  }
}
async function resolveChampionNames(
  participants: any[],
): Promise<LiveGameParticipant[]> {
  const cacheKey = 'ddragon:champions';
  let championMap: Record<number, string> = {};

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    championMap = JSON.parse(cached);
  } else {
    try {
      // Get latest patch version
      const { data: versions } = await axios.get(
        'https://ddragon.leagueoflegends.com/api/versions.json',
      );
      const latestVersion = versions[0];

      // Get champion data
      const { data: champData } = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`,
      );

      // Build id → name map
      for (const champ of Object.values(champData.data) as any[]) {
        championMap[parseInt(champ.key)] = champ.id; // e.g. 1 → "Annie"
      }

      await redisClient.setex(
        cacheKey,
        60 * 60 * 24,
        JSON.stringify(championMap),
      );
    } catch (err: any) {
      console.error('[Spectator] Failed to fetch champion data:', err.message);
    }
  }

  return participants.map((p) => ({
    puuid: p.puuid,
    riotId: p.riotId ?? '',
    summonerId: p.summonerId ?? '',
    championId: p.championId,
    championName: championMap[p.championId] ?? `Champion_${p.championId}`,
    profileIconId: p.profileIconId,
    spell1Id: p.spell1Id,
    spell2Id: p.spell2Id,
    teamId: p.teamId,
    perks: p.perks ?? { perkIds: [], perkStyle: 0, perkSubStyle: 0 },
  }));
}
