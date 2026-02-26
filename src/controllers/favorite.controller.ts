import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  addFavorite,
  getUserFavorites,
  removeFavorite,
} from '../services/favorite.service';

export async function add(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!._id;
    const { playerId } = req.body;

    const favorite = await addFavorite(userId, playerId);
    res.status(201).json(favorite);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const favoriteId = req.params.favoriteId as string;

    await removeFavorite(favoriteId);
    res.status(200).json({ message: 'Removed from favorites' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function list(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!._id;

    const favorites = await getUserFavorites(userId);
    res.status(200).json(favorites);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
