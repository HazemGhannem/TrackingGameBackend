import { Request, Response } from 'express';
import {
  addFavorite,
  getUserFavorites,
  removeFavorite,
} from '../services/favorite.service';

export async function add(req: Request, res: Response) {
  try {
    const userId = req.body.userId as string;
    const playerId = req.body.playerId as string;

    const favorite = await addFavorite(userId, playerId);
    console.log(favorite);
    res.status(201).json(favorite);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
export async function remove(req: Request, res: Response) {
  try {
     const favoriteId = req.params.favoriteId as string;

    await removeFavorite(favoriteId);
    res.status(200).json({ message: 'Removed from favorites' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
export async function list(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;

    const favorites = await getUserFavorites(userId);
    res.status(200).json(favorites);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
