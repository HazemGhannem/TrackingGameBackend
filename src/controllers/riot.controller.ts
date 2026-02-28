import { NextFunction, Request, Response } from 'express';
import {
  getPlayerProfileWithFallback,
  getTop10Challengers,
} from '../services/player.service';
import { MatchType, PlatformRegion, RiotRegion } from '../interfaces/player.interface';
import { resoleRegionsFromTag } from '../utils/utiles';

export const fetchPlayerProfile = async (req: Request, res: Response) => {
  try {
    const { name, tag, routingRegion } = req.params;
    const riotName = decodeURIComponent(Array.isArray(name) ? name[0] : name);
    const riotTag = decodeURIComponent(Array.isArray(tag) ? tag[0] : tag);
    const Region = decodeURIComponent(
      Array.isArray(routingRegion) ? routingRegion[0] : routingRegion,
    );
    console.log(riotName, riotTag, Region);
    if (!riotName || !riotTag || !Region) {
      return res.status(400).json({
        error: 'Riot Name and Tag are required (e.g., /EUW/Name/Tag)',
      });
    }

    const matchPage = Number(req.query.matchPage) || 1;
    const matchPageSize = Number(req.query.matchPageSize) || 15;
    const masteryPage = Number(req.query.masteryPage) || 1;
    const masteryPageSize = Number(req.query.masteryPageSize) || 10;
    const matchType = req.query.matchType as MatchType;
    const { platformRegion } = resoleRegionsFromTag(riotTag);

    const profile = await getPlayerProfileWithFallback(
      riotName,
      riotTag,
      Region as RiotRegion,
      platformRegion,
      {
        matchPage,
        matchPageSize,
        masteryPage,
        masteryPageSize,
        matchType,
      },
    );

    res.json(profile);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error:
        error.response?.data?.status?.message ||
        error.message ||
        'Internal Server Error',
    });
  }
};
export const fetchTop10Challengers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { platform } = req.params;


    const data = await getTop10Challengers(platform as PlatformRegion);

    res.status(200).json({
      platform,
      queue: 'RANKED_SOLO_5x5',
      tier: 'CHALLENGER',
      players: data,
    });
  } catch (error) {
    next(error);
  }
};