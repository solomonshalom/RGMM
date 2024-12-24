import { WorkshopCollection, ParseResult } from './types';

export function parseModDescription(description: string): string[] {
  const modIdPattern = /(?:Mod(?:\s?)ID)(?:\:)(?:[\s+])([\w._&-]+)/g;
  const matches = [...description.matchAll(modIdPattern)];
  return matches.map(match => match[1]);
}

export function parseWorkshopContent(content: string): ParseResult {
  // Extract Workshop IDs
  const workshopPattern = /(?:steamcommunity\.com\/sharedfiles\/filedetails\/\?id=|Workshop ID:?\s*)(\d{9,10})(?:\s|$|;|,)/gi;
  const workshopMatches = [...content.matchAll(workshopPattern)];
  const workshopIds = [...new Set(workshopMatches.map(match => match[1]))];

  // Extract Mod IDs
  const modIdPattern = /(?:Mod(?:\s?)ID)(?:\:)(?:[\s+])([\w._&-]+)/g;
  const modMatches = [...content.matchAll(modIdPattern)];
  const modIds = [...new Set(modMatches.map(match => match[1]))];

  return {
    workshopIds,
    modIds: modIds.filter(id => id && id.length > 0)
  };
}

export function filterExcludedMods(modIds: string[], exclusions: string[]): string[] {
  if (!exclusions.length) return modIds;
  
  return modIds.filter(modId => {
    return !exclusions.some(exclusion => {
      const similarity = calculateSimilarity(modId.toLowerCase(), exclusion.toLowerCase());
      return similarity >= 0.5;
    });
  });
}

function calculateSimilarity(str1: string, str2: string): number {
  let longer = str1.length > str2.length ? str1 : str2;
  let shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str1.length][str2.length];
}