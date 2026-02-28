import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth.interface';
import { deleteLiveGame, getUserLiveGames } from '../services/LiveGame.service';

export async function listLiveGames(req: AuthRequest, res: Response) {
  try {
    const userId = String(req.user!._id);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await getUserLiveGames(userId, page, limit);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('[LiveGame] listLiveGames error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
export async function deleteLiveGames(req: AuthRequest, res: Response) {
  try {
    const userId = String(req.user!._id);
    const playerId = String(req.params.playerId);
    const games = await deleteLiveGame(userId, playerId);
    res.status(200).json(games);
  } catch (err: any) {
    console.error('[LiveGame] listLiveGames error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
