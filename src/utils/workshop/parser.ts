import { patterns } from './patterns';
import { ParserResult } from './types';

export const parseWorkshopContent = (content: string): ParserResult => {
  // Extract Workshop IDs
  const workshopIds = Array.from(content.matchAll(patterns.workshopId), m => m[1]);
  
  // Extract Mod IDs
  const modIds = Array.from(content.matchAll(patterns.modId), m => m[1]);

  // Create Workshop-Mod mapping
  const workshopModMapping: Record<string, string[]> = {};
  workshopIds.forEach(workshopId => {
    workshopModMapping[workshopId] = modIds;
  });

  return {
    workshopIds: [...new Set(workshopIds)],
    modIds: [...new Set(modIds)],
    workshopModMapping
  };
};

export const normalizeWorkshopUrl = (url: string): string => {
  const idMatch = url.match(patterns.workshopUrl);
  if (idMatch) {
    return `https://steamcommunity.com/sharedfiles/filedetails/?id=${idMatch[1]}`;
  }
  return url;
};