import { PlatformRegion, routingMap, TagToPlatformTag } from '../interfaces/player.interface';

export const resoleRegionsFromTag = (tag: string) => {
  const normalizedTag = tag.replace(/\d+$/, '').toUpperCase();
  const platform = TagToPlatformTag[normalizedTag] ?? PlatformRegion.EUW1;
  return {
    platformRegion: platform,
    routingRegion: routingMap[platform],
  };
};
