import React, { useState } from 'react';
import axios from 'axios';
import { Mod } from '../db';
import * as cheerio from 'cheerio';

interface SteamWorkshopImporterProps {
  onImport: (mod: Omit<Mod, 'id'>) => void;
  onCancel: () => void;
}

const SteamWorkshopImporter: React.FC<SteamWorkshopImporterProps> = ({ onImport, onCancel }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentProxyIndex, setCurrentProxyIndex] = useState(0);

  // Enhanced list of CORS proxies with more reliable options
  const corsProxies = [
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
      url: 'https://thingproxy.freeboard.io/fetch/',
      processResponse: (response: any) => response.data
    },
    {
      url: 'https://cors.platformvm.com/',
      processResponse: (response: any) => response.data
    }
  ];

  const normalizeUrl = (inputUrl: string): string => {
    let normalizedUrl = inputUrl.trim();
    
    // Extract the workshop ID using various patterns
    const patterns = [
      /(\d{9,})/,                     // Raw ID
      /filedetails\/\?id=(\d+)/,      // Standard URL format
      /workshop\/(\d+)/,              // Short URL format
      /sharedfiles\/filedetails\/(\d+)/, // Full path format
      /\?id=(\d+)/                    // Query parameter format
    ];

    let workshopId = '';
    for (const pattern of patterns) {
      const match = inputUrl.match(pattern);
      if (match && match[1]) {
        workshopId = match[1];
        break;
      }
    }

    if (workshopId) {
      return `https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`;
    }

    // If no ID found, return cleaned URL
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    return normalizedUrl;
  };

  const fetchWithProxy = async (normalizedUrl: string, proxyIndex: number): Promise<string> => {
    if (proxyIndex >= corsProxies.length) {
      throw new Error('All proxies failed. Please try again later.');
    }

    const proxy = corsProxies[proxyIndex];
    const encodedUrl = encodeURIComponent(normalizedUrl);
    const proxyUrl = `${proxy.url}${encodedUrl}`;
    
    try {
      console.log(`Attempting with proxy ${proxyIndex + 1}/${corsProxies.length}:`, proxy.url);
      
      const response = await axios.get(proxyUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'x-requested-with': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000, // Increased timeout
        validateStatus: (status) => status < 500 // Accept any status < 500
      });

      const processedResponse = proxy.processResponse(response);
      
      // Verify we got actual HTML content
      if (typeof processedResponse === 'string' && processedResponse.includes('<!DOCTYPE html>')) {
        return processedResponse;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Proxy ${proxyIndex + 1} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before trying next proxy
      return fetchWithProxy(normalizedUrl, proxyIndex + 1);
    }
  };

  const scrapeWorkshopData = async (inputUrl: string) => {
    try {
      const normalizedUrl = normalizeUrl(inputUrl);
      const html = await fetchWithProxy(normalizedUrl, currentProxyIndex);
      
      const $ = cheerio.load(html);

      // Extract workshop ID
      const workshopId = normalizedUrl.match(/\?id=(\d+)/)?.[1];
      if (!workshopId) {
        throw new Error('Could not extract workshop ID from URL');
      }

      // Enhanced selectors for better reliability
      const titleSelectors = [
        '.workshopItemTitle',
        '.workshopItemDetailsHeader h1',
        '.workshop_item_header h1',
        '#mainContents h1',
        'div.workshop_item_header div.title',
      ];

      const descriptionSelectors = [
        '.workshopItemDescription',
        '.workshopItemDetailsHeader div.description',
        '.detailsBlock div.description',
        '.workshop_description',
      ];

      const imageSelectors = [
        '.workshopItemPreviewImage',
        '.workshop_item_header img',
        '.highlight_strip_screenshot img',
        '.workshopItemPreviewImageMain',
      ];

      const authorSelectors = [
        '.workshopItemAuthorName a',
        '.friendBlockContent',
        '.workshop_author_link',
        '.creatorsBlock a',
      ];

      // Helper function to try multiple selectors
      const trySelectors = (selectors: string[], attribute?: string) => {
        for (const selector of selectors) {
          const element = $(selector).first();
          if (element.length) {
            return attribute ? element.attr(attribute) : element.text().trim();
          }
        }
        return '';
      };

      // Try to extract metadata with fallbacks
      let title = trySelectors(titleSelectors);
      if (!title) {
        // Try finding any heading that might contain the title
        $('h1').each((_, element) => {
          const text = $(element).text().trim();
          if (text.length > 0) {
            title = text;
            return false; // break the loop
          }
        });
      }
      title = title || 'Untitled Mod';

      const description = trySelectors(descriptionSelectors) || 'No description available';
      const thumbnailUrl = trySelectors(imageSelectors, 'src') || '';
      const author = trySelectors(authorSelectors) || 'Unknown Author';
      
      // Try multiple date formats
      const lastUpdated = 
        $('.detailsStatRight:contains("Updated")').next().text().trim() ||
        $('div.stats_table tr:contains("Updated")').find('td').last().text().trim() ||
        new Date().toISOString();

      return {
        name: title,
        description,
        content: `Imported from Steam Workshop\n\nDescription: ${description}\n\nAuthor: ${author}\nLast Updated: ${lastUpdated}\n\n[View on Steam Workshop](${normalizedUrl})`,
        category: 'Steam Workshop',
        createdAt: new Date(),
        updatedAt: new Date(),
        steamWorkshopId: workshopId,
        thumbnailUrl,
        author,
        lastUpdated,
      };
    } catch (error) {
      console.error('Scraping error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          response: error.response?.data,
          status: error.response?.status
        });
      }
      // Rotate to next proxy for next attempt
      setCurrentProxyIndex((prev) => (prev + 1) % corsProxies.length);
      throw error;
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (!url) {
        throw new Error('Please enter a Steam Workshop URL');
      }
      const modData = await scrapeWorkshopData(url);
      onImport(modData);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import mod');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="steam-workshop-importer">
      <div className="field-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter Steam Workshop URL or ID"
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="field-row mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleImport}
          disabled={isLoading || !url}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {isLoading ? 'Importing...' : 'Import'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
      </div>
      {error && (
        <div className="error-message mt-2 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default SteamWorkshopImporter;