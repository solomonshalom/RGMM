// Enhanced ID extractor to handle Mod IDs from Steam Workshop links

import { ParsedIds } from '../types/parser';

const patterns = {
  // Match Workshop IDs from URLs or explicit mentions
  workshop:
    /(?:steamcommunity\.com\/sharedfiles\/filedetails\/\?id=|Workshop ID:?\s*|workshop=)(\d{9,10})(?:\s|$|;|,)/gi,

  // Match Mod IDs from specific URLs or descriptions
  mod: /(?:Mod ID:?\s*|ModID:?\s*|mod=|steamcommunity\.com\/sharedfiles\/filedetails\/\?id=)([a-zA-Z0-9._-]+)(?:\s|$|;|,)/gim,

  // Match Map IDs
  map: /(?:Map ID:?\s*|map=)(map_[a-zA-Z0-9._-]+)(?:\s|$|;|,)/gi,
};

/**
 * Extracts IDs (workshop, mod, map) from a given text or URL.
 * @param {string} text - The input text or URL to parse.
 * @returns {ParsedIds} - An object containing arrays of extracted IDs.
 */
export const extractIds = (text: string): ParsedIds => {
  const extractMatches = (pattern: RegExp) => {
    const matches = Array.from(text.matchAll(pattern), (m) => m[1]);
    return matches
      .map((id) => id.trim())
      .filter((id) => {
        // Filter out common false positives and very short IDs
        const blacklist = [
          'mod',
          'map',
          'workshop',
          'the',
          'and',
          'for',
          'version',
        ];
        return !blacklist.includes(id.toLowerCase()) && id.length > 2;
      });
  };

  return {
    workshopIds: [...new Set(extractMatches(patterns.workshop))],
    modIds: [...new Set(extractMatches(patterns.mod))],
    mapIds: [...new Set(extractMatches(patterns.map))],
  };
};
