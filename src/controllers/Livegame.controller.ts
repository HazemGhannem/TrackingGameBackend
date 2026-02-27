import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth.interface';
import { getUserLiveGames } from '../services/LiveGame.service';

export async function listLiveGames(req: AuthRequest, res: Response) {
  try {
    const userId = String(req.user!._id);
    const games = await getUserLiveGames(userId);
    res.status(200).json(games);
  } catch (err: any) {
    console.error('[LiveGame] listLiveGames error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
