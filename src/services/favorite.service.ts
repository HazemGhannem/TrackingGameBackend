import { Types } from 'mongoose';
import {
  FavoriteDocument,
  PopulatedFavoriteDocument,
} from '../interfaces/favorite.interface';
import { PlayerProfile } from '../interfaces/riot.interface';
import { Favorite } from '../models/favorite.model';

export async function addFavorite(
  userId: string,
  playerId: string,
): Promise<PopulatedFavoriteDocument> {
  const existing = await Favorite.findOne({ userId, playerId }).populate(
    'playerId',
  );
  if (existing) return existing as unknown as PopulatedFavoriteDocument;

  const created = await Favorite.create({ userId, playerId });
  return created.populate('playerId') as unknown as PopulatedFavoriteDocument;
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  await Favorite.findByIdAndDelete(favoriteId);
}
export async function getUserFavorites(
  userId: string,
): Promise<PopulatedFavoriteDocument[]> {
  return Favorite.find({
    userId,
  })
    .populate<{ playerId: PlayerProfile }>('playerId')
    .sort({ createdAt: -1 })
    .exec() as unknown as PopulatedFavoriteDocument[];
}
