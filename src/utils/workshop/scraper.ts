import * as cheerio from 'cheerio';
import { ParserResult, ScraperResult, ProxyError } from './types';
import { fetchWithProxy } from './proxy';
import { extractModIds } from './extractors';

const handleScraperError = (error: unknown): ScraperResult => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return {
    success: false,
    error: errorMessage,
    data: { workshopIds: [], modIds: [] }
  };
};

export const scrapeWorkshopItem = async (url: string): Promise<ScraperResult> => {
  try {
    const html = await fetchWithProxy(url);
    const $ = cheerio.load(html);
    
    const descriptions = [
      $('.workshopItemDescription').text(),
      $('.detailsBlock .description').text(),
      $('.workshop_description').text()
    ].filter(Boolean);
    
    const workshopId = url.match(/\?id=(\d+)/)?.[1] || '';
    const modIds = descriptions.flatMap(desc => extractModIds(desc));
    const uniqueModIds = [...new Set(modIds)];

    return {
      success: true,
      data: {
        workshopIds: workshopId ? [workshopId] : [],
        modIds: uniqueModIds
      }
    };
  } catch (error) {
    return handleScraperError(error);
  }
};

export const scrapeWorkshopCollection = async (url: string): Promise<ScraperResult> => {
  try {
    const html = await fetchWithProxy(url);
    const $ = cheerio.load(html);
    
    const workshopId = url.match(/\?id=(\d+)/)?.[1] || '';
    const items = $('.collectionItem, .requiredItem');
    const allModIds: string[] = [];
    const allWorkshopIds: string[] = [];
    
    const collectionDescription = $('.workshopItemDescription').text();
    if (collectionDescription) {
      const collectionModIds = extractModIds(collectionDescription);
      allModIds.push(...collectionModIds);
    }
    
    for (let i = 0; i < items.length; i++) {
      const itemUrl = $(items[i]).find('a[href*="steamcommunity.com/sharedfiles/filedetails"]').attr('href');
      if (itemUrl) {
        try {
          const result = await scrapeWorkshopItem(itemUrl);
          if (result.success && result.data) {
            allModIds.push(...result.data.modIds);
            allWorkshopIds.push(...result.data.workshopIds);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to process item ${itemUrl}:`, error);
        }
      }
    }

    return {
      success: true,
      data: {
        workshopIds: [...new Set(allWorkshopIds)],
        modIds: [...new Set(allModIds)]
      }
    };
  } catch (error) {
    return handleScraperError(error);
  }
};