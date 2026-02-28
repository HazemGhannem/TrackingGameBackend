import { PopulatedFavoriteDocument } from '../interfaces/favorite.interface';
import { PlayerProfile } from '../interfaces/player.interface';
import Favorite from '../models/favorite.model';

export const addFavorite = async (
  userId: string,
  playerId: string,
): Promise<PopulatedFavoriteDocument> => {
  const existing = await Favorite.findOne({ userId, playerId }).populate(
    'playerId',
  );
  if (existing) return existing as unknown as PopulatedFavoriteDocument;

  const created = await Favorite.create({ userId, playerId });
  return (await created.populate('playerId')) as PopulatedFavoriteDocument;
};

export const removeFavorite = async (favoriteId: string): Promise<void> => {
  await Favorite.findByIdAndDelete(favoriteId);
};

export const getUserFavorites = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: PopulatedFavoriteDocument[];
  total: number;
  pages: number;
}> => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Favorite.find({ userId })
      .populate<{ playerId: PlayerProfile }>('playerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec() as Promise<PopulatedFavoriteDocument[]>,
    Favorite.countDocuments({ userId }),
  ]);
  return { data, total, pages: Math.ceil(total / limit) };
};
