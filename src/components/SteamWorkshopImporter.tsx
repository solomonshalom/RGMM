import React, { useState } from 'react';
import axios from 'axios';
import { Mod } from '../db';
import * as cheerio from 'cheerio';
import { Groq } from 'groq-sdk';

interface SteamWorkshopImporterProps {
  onImport: (mod: Omit<Mod, 'id'>) => void;
  onCancel: () => void;
}

const SteamWorkshopImporter: React.FC<SteamWorkshopImporterProps> = ({ onImport, onCancel }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentProxyIndex, setCurrentProxyIndex] = useState(0);
  const [useAI, setUseAI] = useState(false);

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
    
    const patterns = [
      /(\d{9,})/,
      /filedetails\/\?id=(\d+)/,
      /workshop\/(\d+)/,
      /sharedfiles\/filedetails\/(\d+)/,
      /\?id=(\d+)/
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
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      const processedResponse = proxy.processResponse(response);
      
      if (typeof processedResponse === 'string' && processedResponse.includes('<!DOCTYPE html>')) {
        return processedResponse;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Proxy ${proxyIndex + 1} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithProxy(normalizedUrl, proxyIndex + 1);
    }
  };

  const processWithAI = async (modData: any) => {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      throw new Error('Please set your Groq API key in settings first');
    }

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in summarizing game modification (mod) details. Create a clear, organized summary with key features and improvements.'
          },
          {
            role: 'user',
            content: `Summarize this mod information:\nTitle: ${modData.name}\nDescription: ${modData.description}`
          }
        ],
        model: 'llama3-8b-8192',
      });

      const summary = completion.choices[0]?.message?.content;
      return {
        ...modData,
        content: `# ${modData.name}\n\n${summary}\n\n## Original Description\n${modData.description}\n\n## Details\n- Author: ${modData.author}\n- Last Updated: ${modData.lastUpdated}\n\n[View on Steam Workshop](${modData.steamWorkshopId})\n\n![Mod Preview](${modData.thumbnailUrl})`
      };
    } catch (error) {
      console.error('AI processing error:', error);
      return modData;
    }
  };

  const scrapeWorkshopData = async (inputUrl: string) => {
    try {
      const normalizedUrl = normalizeUrl(inputUrl);
      const html = await fetchWithProxy(normalizedUrl, currentProxyIndex);
      
      const $ = cheerio.load(html);

      const workshopId = normalizedUrl.match(/\?id=(\d+)/)?.[1];
      if (!workshopId) {
        throw new Error('Could not extract workshop ID from URL');
      }

      const titleSelectors = [
        '.workshopItemTitle',
        '.workshopItemDetailsHeader h1',
        '.workshop_item_header h1',
        '#mainContents h1',
        'div.workshop_item_header div.title',
      ];

      const descriptionSelectors = [
        '.workshopItemDescription',
        '.detailsBlock div.description',
        '.workshop_description',
      ];

      const imageSelectors = [
        '.workshopItemPreviewImage',
        '.workshop_item_header img',
        '.highlight_strip_screenshot img',
      ];

      const authorSelectors = [
        '.workshopItemAuthorName a',
        '.friendBlockContent',
        '.workshop_author_link',
      ];

      const trySelectors = (selectors: string[], attribute?: string) => {
        for (const selector of selectors) {
          const element = $(selector).first();
          if (element.length) {
            return attribute ? element.attr(attribute) : element.text().trim();
          }
        }
        return '';
      };

      let title = trySelectors(titleSelectors);
      if (!title) {
        $('h1').each((_, element) => {
          const text = $(element).text().trim();
          if (text.length > 0) {
            title = text;
            return false;
          }
        });
      }
      title = title || 'Untitled Mod';

      const description = trySelectors(descriptionSelectors) || 'No description available';
      const thumbnailUrl = trySelectors(imageSelectors, 'src') || '';
      const author = trySelectors(authorSelectors) || 'Unknown Author';
      const lastUpdated = $('.detailsStatRight:contains("Updated")').next().text().trim() || new Date().toISOString();

      const modData = {
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

      return useAI ? await processWithAI(modData) : modData;
    } catch (error) {
      console.error('Scraping error:', error);
      setCurrentProxyIndex((prev) => (prev + 1) % corsProxies.length);
      throw error;
    }
  };

  const handleSingleImport = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (!url) {
        throw new Error('Please enter a Steam Workshop URL');
      }
      const modData = await scrapeWorkshopData(url);
      onImport(modData);
      onCancel();
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import mod');
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
        />
      </div>

      <div className="field-row">
        <label>
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
          /> Use AI to enhance descriptions
        </label>
      </div>

      <div className="field-row">
        <button
          type="button"
          onClick={handleSingleImport}
          disabled={isLoading || !url}
        >
          {isLoading ? 'Importing...' : 'Import'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default SteamWorkshopImporter;