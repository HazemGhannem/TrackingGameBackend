import mongoose from 'mongoose';
import { PlayerProfile } from '../interfaces/riot.interface';

const PlayerSchema = new mongoose.Schema<PlayerProfile>(
  {
    puuid: { type: String, unique: true },
    gameName: { type: String, index: true },
    tagLine: { type: String },
    profileIconId: { type: Number },
    summonerLevel: { type: Number },
    platform: { type: String, default: 'euw1' },
    ranked: {
      leagueId: String,
      queueType: String,
      tier: String,
      rank: String,
      leaguePoints: Number,
      wins: Number,
      losses: Number,
      veteran: Boolean,
      inactive: Boolean,
      freshBlood: Boolean,
      hotStreak: Boolean,
    },
  },
  { timestamps: true },
);
export default mongoose.model<PlayerProfile>('player',PlayerSchema);
    