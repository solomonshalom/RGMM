import * as cheerio from 'cheerio';
import { fetchWithProxy } from './workshopUtils';
import { extractIds } from './idExtractor';
import { ParsedIds } from '../types/parser';

export const scrapeWorkshopItem = async (url: string): Promise<ParsedIds> => {
  const html = await fetchWithProxy(url);
  const $ = cheerio.load(html);

  // Get the description text
  const description = $('.workshopItemDescription').text() || '';
  
  // First try to find Mod IDs in the description
  const modIdMatches = description.match(/(?:Mod ID:?\s*|ModID:?\s*)([a-zA-Z0-9._-]+)/gi) || [];
  const modIds = modIdMatches.map(match => {
    const id = match.split(/:\s*/)[1];
    return id.trim();
  }).filter(Boolean);

  // Extract Workshop ID from URL
  const workshopId = url.match(/\?id=(\d+)/)?.[1] || '';

  // Look for required items if this is a collection
  const requiredItems = $('.requiredItem');
  const collectionModIds: string[] = [];
  
  requiredItems.each((_, item) => {
    const itemDescription = $(item).find('.workshopItemDescription').text();
    const modIdMatch = itemDescription.match(/(?:Mod ID:?\s*|ModID:?\s*)([a-zA-Z0-9._-]+)/i);
    if (modIdMatch && modIdMatch[1]) {
      collectionModIds.push(modIdMatch[1].trim());
    }
  });

  return {
    workshopIds: workshopId ? [workshopId] : [],
    modIds: [...new Set([...modIds, ...collectionModIds])].filter(id => id.length > 2),
    mapIds: []
  };
};

export const scrapeWorkshopCollection = async (url: string): Promise<ParsedIds> => {
  const html = await fetchWithProxy(url);
  const $ = cheerio.load(html);
  
  const workshopId = url.match(/\?id=(\d+)/)?.[1] || '';
  const allModIds: string[] = [];
  
  // Process collection items
  const items = $('.collectionItem, .requiredItem');
  const itemUrls: string[] = [];
  
  items.each((_, item) => {
    const itemUrl = $(item).find('a[href*="steamcommunity.com/sharedfiles/filedetails"]').attr('href');
    if (itemUrl) {
      itemUrls.push(itemUrl);
    }
  });

  // Process each item in the collection
  for (const itemUrl of itemUrls) {
    try {
      const itemData = await scrapeWorkshopItem(itemUrl);
      allModIds.push(...itemData.modIds);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    } catch (error) {
      console.error(`Failed to process item ${itemUrl}:`, error);
    }
  }

  return {
    workshopIds: workshopId ? [workshopId] : [],
    modIds: [...new Set(allModIds)],
    mapIds: []
  };
};