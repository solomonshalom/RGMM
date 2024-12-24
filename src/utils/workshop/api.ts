import axios from 'axios';
import { parseModDescription } from './parser';
import { WorkshopCollection } from './types';

export async function fetchWorkshopData(workshopId: string): Promise<string[]> {
  try {
    const response = await axios.get(`https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`);
    const description = extractDescription(response.data);
    return parseModDescription(description);
  } catch (error) {
    console.error('Failed to fetch workshop data:', error);
    return [];
  }
}

function extractDescription(html: string): string {
  const descriptionMatch = html.match(/<div class="workshopItemDescription">([\s\S]*?)<\/div>/);
  return descriptionMatch ? descriptionMatch[1] : '';
}

export async function processWorkshopCollection(workshopIds: string[]): Promise<WorkshopCollection> {
  const collection: WorkshopCollection = {};
  
  for (const workshopId of workshopIds) {
    const modIds = await fetchWorkshopData(workshopId);
    collection[workshopId] = modIds;
  }
  
  return collection;
}