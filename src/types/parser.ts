export interface ParsedIds {
  workshopIds: string[];
  modIds: string[];
  mapIds: string[];
}

export interface WorkshopItem {
  title: string;
  description: string;
  author: string;
  lastUpdated: string;
}

export interface ParserState {
  input: string;
  parsedData: ParsedIds;
  isLoading: boolean;
  error: string | null;
  copied: string | null;
}