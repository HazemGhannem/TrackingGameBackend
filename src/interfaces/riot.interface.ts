export interface RiotAccount {
  puuid: string;
  gameName?: string;
  tagLine?: string;
}
export enum RiotRegion {
  AMERICAS = 'americas',
  EUROPE = 'europe',
  ASIA = 'asia',
}
export enum PlatformRegion {
  EUW1 = 'euw1',
  NA1 = 'na1',
  KR = 'kr',
  EUN1 = 'eun1',
}
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
  matchType?: MatchType  ;
}
export interface RiotAccountInput {
  region: RiotRegion;
  gameName: string;
  tagLine: string;
}