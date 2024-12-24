export interface WorkshopConfig {
  apiKey: string;
  collections: string[];
  exclusions: string[];
}

export interface WorkshopCollection {
  [workshopId: string]: string[]; // Map of Workshop ID to array of Mod IDs
}

export interface ParseResult {
  workshopIds: string[];
  modIds: string[];
}