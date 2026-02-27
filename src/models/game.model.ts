import { Schema, model, Document } from 'mongoose';
import { ILiveGame, ILiveGameParticipant } from '../interfaces/game.interface';
 

export type LiveGameDocument = ILiveGame & Document;

const ParticipantSchema = new Schema<ILiveGameParticipant>(
  {
    puuid: { type: String, required: true },
    riotId: { type: String, default: '' },
    championId: { type: Number, required: true },
    championName: { type: String, required: true },
    profileIconId: { type: Number, default: 0 },
    spell1Id: { type: Number, default: 0 },
    spell2Id: { type: Number, default: 0 },
    teamId: { type: Number, enum: [100, 200], required: true },
  },
  { _id: false },
);

const LiveGameSchema = new Schema<LiveGameDocument>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    playerName: { type: String, required: true },
    gameId: { type: Number, required: true },
    gameMode: { type: String, required: true },
    championName: { type: String, required: true },
    championId: { type: Number, required: true },
    gameStartTime: { type: Number, required: true },
    teams: {
      blue: { type: [ParticipantSchema], default: [] },
      red: { type: [ParticipantSchema], default: [] },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

 LiveGameSchema.index({ userId: 1, playerId: 1 }, { unique: true });

 LiveGameSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 4 });

export const LiveGame = model<LiveGameDocument>('LiveGame', LiveGameSchema);
