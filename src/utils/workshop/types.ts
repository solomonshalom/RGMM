export interface ParsedIds {
  workshopIds: string[];
  modIds: string[];
  mapIds: string[];
}

export interface ParserResult {
  workshopIds: string[];
  modIds: string[];
}

export class ProxyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProxyError';
  }
}

export interface ScraperResult {
  success: boolean;
  data?: ParserResult;
  error?: string;
}