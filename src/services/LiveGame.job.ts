import cron from 'node-cron';
import Favorite from '../models/favorite.model';
import redisClient from '../services/redis.service';
import { notifyUser } from '../socket.server';
import { PlayerMapEntry, RedisGameEntry } from '../interfaces/LiveGame.types';
import {
  getLastMatchResult,
  getLiveGame,
  platformToRouting,
} from './spectator.service';
import { PlatformRegion } from '../interfaces/player.interface';
import { createLiveGame, deleteLiveGame } from '../services/LiveGame.service';
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
        platform: PlatformRegion;
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

async function checkPlayer(playerId: string, data: PlayerMapEntry) {
  const { puuid, playerName, platform, userIds } = data;
  const key = `game:state:${playerId}`;

  const raw = await redisClient.get(key);
  const prev: RedisGameEntry = raw ? JSON.parse(raw) : { state: 'idle' };

  const liveGame = await getLiveGame(puuid, platform);
  // console.log('[Data check] Poll cycle complete ' + JSON.stringify(liveGame));
  const inGame = !!liveGame;

  console.log(
    `[Poller] ${playerName} → liveGame=${inGame ? 'IN-GAME' : 'NOT-IN-GAME'} | prevState=${prev.state}`,
  );

  if (inGame && prev.state === 'idle') {
    // Player just started a game
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
    await redisClient.setex(key, REDIS_TTL, JSON.stringify(next));
    console.log('[[[[[[redis]]]]]] ' + JSON.stringify(prev));
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

    console.log(
      `[Poller] ${playerName} → IN-GAME (${liveGame!.gameMode})  game:${inGame}`,
    );
  } else if (!inGame && prev.state === 'in-game') {
    // Player just ended a game

    await new Promise((r) => setTimeout(r, MATCH_DELAY));

    const result = await getLastMatchResult(puuid, platformToRouting(platform));
    await redisClient.setex(
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
