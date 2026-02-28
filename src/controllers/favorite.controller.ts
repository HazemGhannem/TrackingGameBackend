import { Response } from 'express';
import {
  addFavorite,
  getFavoriteIds,
  getUserFavorites,
  removeFavorite,
} from '../services/favorite.service';
import { AuthRequest } from '../interfaces/auth.interface';

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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await getUserFavorites(String(userId), page, limit);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
export async function listFavoriteIds(req: AuthRequest, res: Response) {
  try {
    const userId = String(req.user!._id);
    const ids = await getFavoriteIds(userId);
    res.status(200).json({ ids });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
