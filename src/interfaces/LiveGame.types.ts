import { PlatformRegion } from './player.interface';

export interface LiveGameParticipant {
  puuid: string;
  riotId: string;
  championId: number;
  championName: string; // we'll resolve this server-side
  profileIconId: number;
  spell1Id: number;
  spell2Id: number;
  teamId: number; // 100 = blue, 200 = red
  perks: {
    perkIds: number[];
    perkStyle: number;
    perkSubStyle: number;
  };
}

export interface LiveGameData {
  gameId: number;
  gameMode: string;
  gameType: string;
  gameQueueConfigId: number;
  gameStartTime: number;
  participants: LiveGameParticipant[];
  bannedChampions: { championId: number; teamId: number; pickTurn: number }[];
}

export interface LiveGameTeam {
  teamId: 100 | 200;
  label: 'Blue' | 'Red';
  participants: LiveGameParticipant[];
}

// Notification types
export interface GameStartNotification {
  type: 'GAME_START';
  playerId: string;
  playerName: string;
  gameMode: string;
  championName: string;
  championId: number;
  gameStartTime: number;
  teams: {
    blue: LiveGameParticipant[];
    red: LiveGameParticipant[];
  };
}
export interface TeamParticipants {
  blue: LiveGameParticipant[];
  red: LiveGameParticipant[];
}
export interface GameEndNotification {
  type: 'GAME_END';
  playerId: string;
  playerName: string;
  result: 'WIN' | 'LOSS' | 'UNKNOWN';
  kills: number;
  deaths: number;
  assists: number;
  championName: string;
  gameDurationMinutes: number;
}

export type GameNotification = GameStartNotification | GameEndNotification;

export type PlayerGameState = 'idle' | 'in-game';

export interface RedisGameEntry {
  state: PlayerGameState;
  gameId?: number;
  gameMode?: string;
  championName?: string;
  championId?: number;
  gameStartTime?: number;
}
export interface PlayerMapEntry {
  puuid: string;
  playerName: string;
  platform: PlatformRegion;
  userIds: string[];
}
