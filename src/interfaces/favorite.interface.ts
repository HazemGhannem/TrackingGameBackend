import { Document, Types } from 'mongoose';
import { PlayerProfile } from './player.interface';

export interface IFavorite extends Document {
  userId: Types.ObjectId;
  playerId: Types.ObjectId;
  createdAt: Date;
}

export interface FavoriteDocument extends IFavorite {}

export interface PopulatedFavoriteDocument extends Document {
  userId: Types.ObjectId;
  playerId: PlayerProfile;
  createdAt: Date;
}
