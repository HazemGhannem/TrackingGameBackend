export interface RankedInfo {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface PlayerProfile {
  _id?: string;
  puuid: string;
  gameName: string;
  tagLine?: string;
  platform?: string;
  profileIconId?: number;
  summonerLevel?: number;
  ranked?: RankedInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface RiotAccount {
  puuid: string;
  gameName?: string;
  tagLine?: string;
  profileIconId?: string;
  summonerLevel?: string;
  ranked?: [RankedInfo];
}

export enum RiotRegion {
  AMERICAS = 'americas',
  EUROPE = 'europe',
  ASIA = 'asia',
}

export enum PlatformRegion {
  EUW1 = 'euw1',
  NA1 = 'na1',
  KR1 = 'kr',
  EUN1 = 'eun1',
}

export const TagToPlatformTag: Record<string, PlatformRegion> = {
  EUW: PlatformRegion.EUW1,
  NA: PlatformRegion.NA1,
  KR: PlatformRegion.KR1,
  EUN: PlatformRegion.EUN1,
};

export const routingMap: Record<PlatformRegion, RiotRegion> = {
  [PlatformRegion.EUW1]: RiotRegion.EUROPE,
  [PlatformRegion.EUN1]: RiotRegion.EUROPE,
  [PlatformRegion.NA1]: RiotRegion.AMERICAS,
  [PlatformRegion.KR1]: RiotRegion.ASIA,
};
export const PLATFORM_HOSTS: Record<PlatformRegion, string> = {
  [PlatformRegion.EUW1]: 'euw1',
  [PlatformRegion.NA1]: 'na1',
  [PlatformRegion.KR1]: 'kr',
  [PlatformRegion.EUN1]: 'eun1',
};
export enum MatchType {
  RANKED = 'ranked',
  NORMAL = 'normal',
  TOURNEY = 'tourney',
  TUTORIAL = 'tutorial',
}

export interface PaginationOptions {
  matchPage?: number;
  matchPageSize?: number;
  masteryPage?: number;
  masteryPageSize?: number;
  matchType?: MatchType;
}

export interface RiotAccountInput {
  region: RiotRegion;
  gameName: string;
  tagLine: string;
}
export interface MatchResult {
  result: 'WIN' | 'LOSS';
  kills: number;
  deaths: number;
  assists: number;
  championName: string;
  gameDurationMinutes: number;
}