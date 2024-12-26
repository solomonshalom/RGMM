import axios, { AxiosError } from 'axios';
import { ProxyError } from './types';

const CORS_PROXIES = [
  {
    url: 'https://api.allorigins.win/raw?url=',
    processResponse: (response: any) => response.data
  },
  {
    url: 'https://corsproxy.io/?',
    processResponse: (response: any) => response.data
  },
  {
    url: 'https://api.codetabs.com/v1/proxy?quest=',
    processResponse: (response: any) => response.data
  },
  {
    url: 'https://proxy.cors.sh/',
    processResponse: (response: any) => response.data
  }
];

let currentProxyIndex = 0;

export const fetchWithProxy = async (url: string, retryCount = 0): Promise<string> => {
  if (retryCount >= CORS_PROXIES.length * 2) {
    throw new ProxyError('All proxies failed after multiple attempts');
  }

  const proxy = CORS_PROXIES[currentProxyIndex];
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
    throw new ProxyError('Invalid response format');
  } catch (error) {
    // Rotate to next proxy
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    
    // Add delay before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return fetchWithProxy(url, retryCount + 1);
  }
};