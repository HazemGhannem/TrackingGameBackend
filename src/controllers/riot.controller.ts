import { Request, Response } from 'express';
import { getAccountByRiotId, getFullPlayerProfile } from '../services/riot.service';
import { MatchType, PlatformRegion, RiotRegion } from '../interfaces/riot.interface';

export const fetchAccount = async (req: Request, res: Response) => {
  try {
    const { region, gameName, tagLine } = req.query;

    if (!region || !gameName || !tagLine) {
      return res.status(400).json({
        error: 'region, gameName and tagLine are required',
      });
    }

    const account = await getAccountByRiotId(
      region as string,
      gameName as string,
      tagLine as string,
    );

    res.json(account);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal Server Error',
    });
  }
};
export const fetchPlayerProfile = async (req: Request, res: Response) => {
  try {
     const { region, platform, puuid: rawPuuid } = req.params;
     const puuid = Array.isArray(rawPuuid) ? rawPuuid[0] : rawPuuid;
      const matchPage = Number(req.query.matchPage) || 1;
      const matchPageSize = Number(req.query.matchPageSize) || 15;
      const masteryPage = Number(req.query.masteryPage) || 1;
      const masteryPageSize = Number(req.query.masteryPageSize) || 1;
      const matchType = req.query.matchType as MatchType;
    if (!puuid ) {
      return res.status(400).json({
        error: 'puuid is required',
      });
    }

      const profile = await getFullPlayerProfile(
        region as RiotRegion,
        platform as PlatformRegion,
        puuid,
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
      error: error.response?.data || 'Internal Server Error',
    });
  }
};
