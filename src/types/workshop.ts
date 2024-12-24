export interface WorkshopItem {
  workshopId: string;
  modIds: string[];
  title?: string;
  description?: string;
  author?: string;
  lastUpdated?: string;
  isFramework?: boolean;
  dependencies?: string[];
}

export interface ParsedWorkshopData {
  items: WorkshopItem[];
  totalModIds: string[];
  totalWorkshopIds: string[];
}

export interface WorkshopRelationship {
  workshopId: string;
  modIds: {
    id: string;
    type?: 'framework' | 'variant' | 'difficulty' | 'standard';
    dependencies?: string[];
  }[];
}

export type OutputFormat = 'flat' | 'grouped' | 'relationship';