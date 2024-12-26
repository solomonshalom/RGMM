import { patterns } from './patterns';

export const extractModIds = (text: string): string[] => {
  const allModIds: string[] = [];
  
  // Try each pattern
  patterns.modId.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach(match => {
      // Split by comma if multiple IDs are present
      const ids = match[1].split(',').map(id => id.trim());
      allModIds.push(...ids);
    });
  });

  // Filter out duplicates and invalid IDs
  return [...new Set(allModIds)].filter(id => {
    // Validate ID format
    return id.length >= 3 && /^[\w._&-]+$/.test(id);
  });
};

export const extractWorkshopIds = (text: string): string[] => {
  const matches = Array.from(text.matchAll(patterns.workshopId));
  return [...new Set(matches.map(m => m[1]))];
};