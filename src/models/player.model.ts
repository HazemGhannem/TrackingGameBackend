import mongoose, { Schema, Model } from 'mongoose';
import { PlayerProfile } from '../interfaces/player.interface';

const RankedSchema = new Schema(
  {
    leagueId: { type: String },
    queueType: { type: String },
    tier: { type: String },
    rank: { type: String },
    leaguePoints: { type: Number },
    wins: { type: Number },
    losses: { type: Number },
    veteran: { type: Boolean, default: false },
    inactive: { type: Boolean, default: false },
    freshBlood: { type: Boolean, default: false },
    hotStreak: { type: Boolean, default: false },
  },
  { _id: false },
);

const PlayerSchema = new Schema<PlayerProfile>(
  {
    puuid: { type: String, unique: true, required: true, index: true },
    gameName: { type: String, index: true, required: true },
    tagLine: { type: String },
    profileIconId: { type: Number },
    summonerLevel: { type: Number, default: 1 },
    platform: { type: String, default: 'euw1' },
    ranked: { type: RankedSchema, default: {} },
  },
  { timestamps: true },
);

const Player: Model<PlayerProfile> = mongoose.model<PlayerProfile>(
  'Player',
  PlayerSchema,
);

export default Player;
