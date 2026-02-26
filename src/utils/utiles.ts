import {  routingMap, TagToPlatformTag } from "../interfaces/riot.interface";

export const resoleRegionsFromTag = (tagLine: string) => {
     if (!tagLine) {
       throw new Error('tagLine is required');
    }
    const cleanTag = tagLine.trim().toUpperCase();
    const platformRegion = TagToPlatformTag[cleanTag];
    if (!platformRegion) {
        throw new Error('unsupported region tag ' + cleanTag);
    }
    const routingRegion = routingMap[platformRegion];
    return { platformRegion, routingRegion };
};