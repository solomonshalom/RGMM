import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParsedIds } from '../types/parser';
import { CORS_PROXIES } from '../constants/proxies';

export const normalizeWorkshopUrl = (url: string): string => {
  const idMatch = url.match(/\b(\d{9,10})\b/);
  if (idMatch) {
    return `https://steamcommunity.com/sharedfiles/filedetails/?id=${idMatch[1]}`;
  }
  return url;
};

export const fetchWithProxy = async (url: string, proxyIndex = 0): Promise<string> => {
  if (proxyIndex >= CORS_PROXIES.length) {
    throw new Error('All proxies failed. Please try again later.');
  }

  const proxy = CORS_PROXIES[proxyIndex];
  const encodedUrl = encodeURIComponent(url);
  
  try {
    const response = await axios.get(`${proxy.url}${encodedUrl}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'User-Agent': 'ModManager/1.0'
      },
      timeout: 10000
    });

    const data = proxy.processResponse(response);
    if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
      return data;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    return fetchWithProxy(url, proxyIndex + 1);
  }
};