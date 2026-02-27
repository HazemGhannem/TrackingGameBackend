import { CreateLiveGamePayload } from '../interfaces/game.interface';
import { LiveGame } from '../models/game.model';

export async function createLiveGame(
  payload: CreateLiveGamePayload,
): Promise<void> {
  const { userId, playerId, ...rest } = payload;

  await LiveGame.findOneAndUpdate(
    { userId, playerId },
    {
      $set: {
        ...rest,
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  console.log(
    `[LiveGame] Created — player=${payload.playerName} user=${userId}`,
  );
}

export async function deleteLiveGame(
  userId: string,
  playerId: string,
): Promise<void> {
  await LiveGame.deleteOne({ userId, playerId });
  console.log(`[LiveGame] Deleted — playerId=${playerId} userId=${userId}`);
}

export async function getUserLiveGames(userId: string) {
  return LiveGame.find({ userId })
    .populate(
      'playerId',
      'gameName tagLine puuid platform profileIconId summonerId',
    )
    .sort({ createdAt: -1 })
    .lean();
}
