import Favorite from '../models/favorite.model';
import { notifyUser } from '../socket.server';
import { PlayerMapEntry, RedisGameEntry } from '../interfaces/LiveGame.types';
import {
  getLastMatchResult,
  getLiveGame,
  platformToRouting,
} from './spectator.service';
import { createLiveGame, deleteLiveGame } from './LiveGame.service';
import { safeRedisGet, safeRedisSetex } from './redis.service';
import { logger } from '../utils/logger';

const REDIS_TTL = 60 * 60 * 4;
const MATCH_DELAY = 30_000;  

export async function pollTrackedPlayers() {
  logger.info('Poll cycle started');

  const favorites = await Favorite.find({})
    .populate('playerId', 'puuid gameName tagLine platform')  
    .populate('userId', '_id')
    .lean();

  logger.info({ count: favorites.length }, 'Favorites loaded');

  const playerMap = new Map<string, PlayerMapEntry & { userIds: string[] }>();

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

  logger.info('Poll cycle complete');
}

async function checkPlayer(
  playerId: string,
  data: PlayerMapEntry & { userIds: string[] },
) {
  const { puuid, playerName, platform, userIds } = data;
  const key = `game:state:${playerId}`;

  const raw = await safeRedisGet(key);  
  const prev: RedisGameEntry = raw ? JSON.parse(raw) : { state: 'idle' };

  const liveGame = await getLiveGame(puuid, platform);
  const inGame = !!liveGame;

  logger.debug({ playerName, inGame, prevState: prev.state }, 'Player check');

  if (inGame && prev.state === 'idle') {
    const me = liveGame!.participants.find((p) => p.puuid === puuid);
    const championName = me?.championName ?? 'Unknown';
    const championId = me?.championId ?? 0;
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

    await safeRedisSetex(key, REDIS_TTL, JSON.stringify(next));

    await Promise.all(
      userIds.map((userId) =>
        createLiveGame({
          userId,
          playerId,
          playerName,
          gameId: liveGame!.gameId,
          gameMode: liveGame!.gameMode,
          championName,
          championId,
          gameStartTime: liveGame!.gameStartTime,
          teams: { blue, red },
        }),
      ),
    );

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

    logger.info(
      { playerName, gameMode: liveGame!.gameMode },
      'Player entered game',
    );
  } else if (!inGame && prev.state === 'in-game') {
    await new Promise((r) => setTimeout(r, MATCH_DELAY));

    const result = await getLastMatchResult(puuid, platformToRouting(platform));

    await safeRedisSetex(
      key,
      REDIS_TTL,
      JSON.stringify({ state: 'idle' } as RedisGameEntry),
    );

    await Promise.all(
      userIds.map((userId) => deleteLiveGame(userId, playerId)),
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

    logger.info(
      { playerName, result: result?.result ?? 'UNKNOWN' },
      'Player left game',
    );
  }
}
