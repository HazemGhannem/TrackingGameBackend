import cron from 'node-cron';
import { Favorite } from '../models/favorite.model';
import redisClient from '../services/redis.service';
import { notifyUser } from '../socket.server';
import { RedisGameEntry } from '../interfaces/LiveGame.types';
import {
  getLastMatchResult,
  getLiveGame,
  platformToRouting,
} from './spectator.service';

const REDIS_TTL = 60 * 60 * 4;
const POLL_CRON = '*/2 * * * *';
const MATCH_DELAY = 10_000;

async function pollTrackedPlayers() {
  console.log('[Poller] Poll cycle started');
  try {
    const favorites = await Favorite.find({})
      .populate('playerId')
      .populate('userId')
      .lean();
    console.log(`[Poller] Found ${favorites.length} favorites`);

    const playerMap = new Map<
      string,
      {
        puuid: string;
        playerName: string;
        platform: string;
        userIds: string[];
      }
    >();

    for (const fav of favorites) {
      const player = fav.playerId as any;
      const user = fav.userId as any;
      if (!player?.puuid || !user?._id) continue;

      const pid = String(player._id);
      if (!playerMap.has(pid)) {
        playerMap.set(pid, {
          puuid: player.puuid,
          playerName: `${player.gameName}#${player.tagLine}`,
          platform: player.platform ?? 'euw1',
          userIds: [],
        });
      }
      playerMap.get(pid)!.userIds.push(String(user._id));
    }

    for (const [playerId, data] of playerMap) {
      await checkPlayer(playerId, data);
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (err: any) {
    console.error('[Poller] Cycle error:', err.message);
  }
  console.log('[Poller] Poll cycle complete');
}

async function checkPlayer(
  playerId: string,
  {
    puuid,
    playerName,
    platform,
    userIds,
  }: {
    puuid: string;
    playerName: string;
    platform: string;
    userIds: string[];
  },
) {
  const key = `game:state:${playerId}`;
  const raw = await redisClient.get(key);
  const prev: RedisGameEntry = raw ? JSON.parse(raw) : { state: 'idle' };

  const liveGame = await getLiveGame(puuid, platform);
  const inGame = !!liveGame;

  console.log(
    `[Poller] ${playerName} → liveGame=${inGame ? 'IN-GAME' : 'null'} | prevState=${prev.state}`,
  );

  if (inGame && prev.state === 'idle') {
    const me = liveGame!.participants.find((p) => p.puuid === puuid);
    const championName = me?.championName ?? 'Unknown';
    const championId = me?.championId ?? 0;

    // Split participants into blue/red teams
    const blue = liveGame!.participants.filter((p) => p.teamId === 100);
    const red = liveGame!.participants.filter((p) => p.teamId === 200);

    const next: RedisGameEntry = {
      state: 'in-game',
      gameId: liveGame!.gameId,
      gameMode: liveGame!.gameMode,
      championName,
      championId,
      gameStartTime: liveGame!.gameStartTime,
    };
    await redisClient.setex(key, REDIS_TTL, JSON.stringify(next));

    for (const userId of userIds) {
      notifyUser(userId, {
        type: 'GAME_START',
        playerId,
        playerName,
        gameMode: liveGame!.gameMode,
        championName,
        championId,
        gameStartTime: liveGame!.gameStartTime,
        teams: { blue, red },
      });
    }
    console.log(`[Poller] ${playerName} → IN-GAME (${liveGame!.gameMode})`);
  } else if (!inGame && prev.state === 'in-game') {
    await new Promise((r) => setTimeout(r, MATCH_DELAY));
    const result = await getLastMatchResult(puuid, platformToRouting(platform));

    await redisClient.setex(
      key,
      REDIS_TTL,
      JSON.stringify({ state: 'idle' } as RedisGameEntry),
    );

    for (const userId of userIds) {
      notifyUser(userId, {
        type: 'GAME_END',
        playerId,
        playerName,
        result: result?.result ?? 'UNKNOWN',
        kills: result?.kills ?? 0,
        deaths: result?.deaths ?? 0,
        assists: result?.assists ?? 0,
        championName: result?.championName ?? prev.championName ?? 'Unknown',
        gameDurationMinutes: result?.gameDurationMinutes ?? 0,
      });
    }
    console.log(
      `[Poller] ${playerName} → IDLE (${result?.result ?? 'UNKNOWN'})`,
    );
  }
}

export function startPollingJob() {
  console.log('[Poller] Starting — interval: every 2 minutes');
  cron.schedule(POLL_CRON, pollTrackedPlayers);
  pollTrackedPlayers();
}
