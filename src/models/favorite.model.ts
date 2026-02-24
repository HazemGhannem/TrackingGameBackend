import mongoose, { Schema } from 'mongoose';
import { IFavorite } from '../interfaces/favorite.interface';

const FavoriteSchema = new Schema<IFavorite>(
  {
    riotGameName: {
      type: String,
      required: true,
      trim: true,
    },
    riotTagLine: {
      type: String,
      required: true,
      trim: true,
    },
    puuid: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
