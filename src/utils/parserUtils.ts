import axios from 'axios';
import * as cheerio from 'cheerio';

interface ParsedIds {
  workshopIds: string[];
  modIds: string[];
  mapIds: string[];
  dependencies: string[];
}

const corsProxies = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

const workshopPattern = /Workshop ID:\s*(\d+)/gi;
const modPattern = /Mod ID:\s*([a-zA-Z0-9._-]+)/gi;
const mapPattern = /Map ID:\s*(map_[A-Za-z0-9._-]+)/gi;
const dependencyPattern = /(?:dependency for other mods|requires .*Mod ID:)/i;

export const extractIds = (text: string): ParsedIds => {
  const workshopIds = Array.from(text.matchAll(workshopPattern), m => m[1]);
  const modIds = Array.from(text.matchAll(modPattern), m => m[1]);
  const mapIds = Array.from(text.matchAll(mapPattern), m => m[1]);

  return {
    workshopIds: [...new Set(workshopIds)].filter(Boolean),
    modIds: [...new Set(modIds)].filter(Boolean),
    mapIds: [...new Set(mapIds)].filter(Boolean),
    dependencies: [] // Dependencies will be handled separately
  };
};

export const fetchWorkshopItem = async (url: string): Promise<ParsedIds> => {
  for (const proxy of corsProxies) {
    try {
      const response = await axios.get(`${proxy}${encodeURIComponent(url)}`);
      const $ = cheerio.load(response.data);

      const workshopId = url.match(/\?id=(\d+)/)?.[1] || '';
      const descriptions = [];

      // Gather all description blocks
      $('.workshopItemDescription').each((_, el) => {
        const text = $(el).text().trim();
        if (text) descriptions.push(text);
      });

      // Find explicit Mod ID within descriptions
      const modIds: string[] = [];
      const dependencies: string[] = [];
      descriptions.forEach(description => {
        const extracted = extractIds(description);
        if (dependencyPattern.test(description)) {
          dependencies.push(...extracted.modIds);
        } else {
          modIds.push(...extracted.modIds);
        }
      });

      // Extract Mod ID from specific HTML element if not found in descriptions
      if (modIds.length === 0) {
        $('.requiredItems .requiredItem .workshopItemTitle').each((_, el) => {
          const modIdText = $(el).text().trim();
          const modIdMatch = modIdText.match(modPattern);
          if (modIdMatch) {
            modIds.push(modIdMatch[1]);
          }
        });
      }

      // Remove duplicates and ensure no overlap between modIds and dependencies
      const uniqueModIds = [...new Set(modIds)].filter(id => !dependencies.includes(id));
      const uniqueDependencies = [...new Set(dependencies)];

      // Debugging output
      console.log('Workshop ID:', workshopId);
      console.log('Primary Mod IDs:', uniqueModIds);
      console.log('Dependencies:', uniqueDependencies);

      return {
        workshopIds: workshopId ? [workshopId] : [],
        modIds: uniqueModIds,
        mapIds: [],
        dependencies: uniqueDependencies
      };
    } catch (error) {
      console.error(`Failed to fetch workshop item with proxy ${proxy}:`, error);
      continue;
    }
  }
  throw new Error('Failed to fetch workshop item data');
};

export const fetchWorkshopCollection = async (url: string): Promise<ParsedIds> => {
  for (const proxy of corsProxies) {
    try {
      const response = await axios.get(`${proxy}${encodeURIComponent(url)}`);
      const $ = cheerio.load(response.data);

      const workshopId = url.match(/\?id=(\d+)/)?.[1] || '';
      const modLinks: string[] = [];

      // Extract all links to items in the collection
      $('.collectionItemDetails a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('id=')) {
          modLinks.push(href);
        }
      });

      const modIds: string[] = [];
      const mapIds: string[] = [];
      const dependencies: string[] = [];

      // Fetch each mod's details from the collection
      for (const modLink of modLinks) {
        try {
          const modData = await fetchWorkshopItem(modLink);
          modIds.push(...modData.modIds);
          mapIds.push(...modData.mapIds);
          dependencies.push(...modData.dependencies);
        } catch (error) {
          console.error(`Failed to fetch mod from collection: ${modLink}`, error);
        }
      }

      // Remove duplicates
      const uniqueModIds = [...new Set(modIds)];
      const uniqueMapIds = [...new Set(mapIds)];
      const uniqueDependencies = [...new Set(dependencies)];

      return {
        workshopIds: workshopId ? [workshopId] : [],
        modIds: uniqueModIds,
        mapIds: uniqueMapIds,
        dependencies: uniqueDependencies
      };
    } catch (error) {
      console.error(`Failed to fetch workshop collection with proxy ${proxy}:`, error);
      continue;
    }
  }
  throw new Error('Failed to fetch workshop collection data');
};

export const normalizeWorkshopUrl = (url: string): string => {
  const idMatch = url.match(/\b(\d+)\b/);
  if (idMatch) {
    return `https://steamcommunity.com/sharedfiles/filedetails/?id=${idMatch[1]}`;
  }
  return url;
};
