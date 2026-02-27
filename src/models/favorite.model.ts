import mongoose, { Schema, Model } from 'mongoose';
import { IFavorite } from '../interfaces/favorite.interface';

const FavoriteSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

FavoriteSchema.index({ userId: 1, playerId: 1 }, { unique: true });

const Favorite: Model<IFavorite> = mongoose.model<IFavorite>(
  'Favorite',
  FavoriteSchema,
);

export default Favorite;
