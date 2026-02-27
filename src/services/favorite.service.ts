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
): Promise<PopulatedFavoriteDocument[]> => {
  return (await Favorite.find({ userId })
    .populate<{
      playerId: PlayerProfile;
    }>('playerId')
    .sort({ createdAt: -1 })
    .exec()) as PopulatedFavoriteDocument[];
};
