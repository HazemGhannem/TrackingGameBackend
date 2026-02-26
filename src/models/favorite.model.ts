import mongoose, { Schema } from 'mongoose';
import { IFavorite } from '../interfaces/favorite.interface';

const FavoriteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'player', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

FavoriteSchema.index({ userId: 1, playerId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
