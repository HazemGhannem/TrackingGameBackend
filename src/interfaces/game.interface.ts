import { Types } from 'mongoose';
import { LiveGameParticipant } from './LiveGame.types';

export interface ILiveGameParticipant {
  puuid: string;
  riotId: string;
  championId: number;
  championName: string;
  profileIconId: number;
  spell1Id: number;
  spell2Id: number;
  teamId: 100 | 200;
}

export interface ILiveGame {
  _id: Types.ObjectId;
  playerId: Types.ObjectId;  
  userId: Types.ObjectId;  
  playerName: string;  
  gameId: number;
  gameMode: string;
  championName: string;
  championId: number;
  gameStartTime: number;
  teams: {
    blue: ILiveGameParticipant[];
    red: ILiveGameParticipant[];
  };
  createdAt: Date;
}
export interface CreateLiveGamePayload {
  playerId: string;
  userId: string;
  playerName: string;
  gameId: number;
  gameMode: string;
  championName: string;
  championId: number;
  gameStartTime: number;
  teams: {
    blue: LiveGameParticipant[];
    red: LiveGameParticipant[];
  };
}
