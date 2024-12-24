import axios from 'axios';
import * as cheerio from 'cheerio';
import { Groq } from 'groq-sdk';

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
  },
  {
    url: 'https://cors.bridged.cc/',
    processResponse: (response: any) => response.data
  },
  {
    url: 'https://cors-anywhere.herokuapp.com/',
    processResponse: (response: any) => response.data
  },
  {
    url: 'https://api.proxy.lol/v1/proxy?url=',
    processResponse: (response: any) => response.data
  },
  {
    url: 'https://www.corsproxy.eu/?url=',
    processResponse: (response: any) => response.data
  },
  {
    url: 'https://cors.io/?url=',
    processResponse: (response: any) => response.data
  },
];

export const normalizeUrl = (inputUrl: string): string => {
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

export const fetchWithProxy = async (normalizedUrl: string, proxyIndex: number = 0): Promise<string> => {
  if (proxyIndex >= corsProxies.length) {
    throw new Error('All proxies failed to fetch the content. Please try again later.');
  }

  const proxy = corsProxies[proxyIndex];
  const encodedUrl = encodeURIComponent(normalizedUrl);
  const proxyUrl = `${proxy.url}${encodedUrl}`;
  
  try {
    const response = await axios.get(proxyUrl, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'x-requested-with': 'XMLHttpRequest'
      },
      timeout: 15000,
      validateStatus: (status) => status < 500
    });

    const processedResponse = proxy.processResponse(response);
    
    if (typeof processedResponse === 'string' && processedResponse.includes('<!DOCTYPE html>')) {
      return processedResponse;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchWithProxy(normalizedUrl, proxyIndex + 1);
  }
};

export const processWithAI = async (modData: any) => {
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
      model: 'mixtral-8x7b-32768',
    });

    const summary = completion.choices[0]?.message?.content;
    return {
      ...modData,
      content: `# ${modData.name}\n\n${summary}\n\n## Original Description\n${modData.description}\n\n## Details\n- Author: ${modData.author}\n- Last Updated: ${modData.lastUpdated}\n\n[View on Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=${modData.steamWorkshopId})\n\n![Mod Preview](${modData.thumbnailUrl})`
    };
  } catch (error) {
    console.error('AI processing error:', error);
    return modData;
  }
};

export const scrapeWorkshopData = async (inputUrl: string, useAI: boolean = false): Promise<any> => {
  try {
    const normalizedUrl = normalizeUrl(inputUrl);
    const html = await fetchWithProxy(normalizedUrl);
    
    const $ = cheerio.load(html);

    const workshopId = normalizedUrl.match(/\?id=(\d+)/)?.[1];
    if (!workshopId) {
      throw new Error('Could not extract workshop ID from URL');
    }

    const titleSelectors = ['.workshopItemTitle', '.workshopItemDetailsHeader h1', '.workshop_item_header h1'];
    const descriptionSelectors = ['.workshopItemDescription', '.workshop_description'];
    const imageSelectors = ['.workshopItemPreviewImage', '.workshop_item_header img'];
    const authorSelectors = ['.workshopItemAuthorName a', '.workshop_author_link'];

    const trySelectors = (selectors: string[], attribute?: string) => {
      for (const selector of selectors) {
        const element = $(selector).first();
        if (element.length) {
          return attribute ? element.attr(attribute) : element.text().trim();
        }
      }
      return '';
    };

    let title = trySelectors(titleSelectors) || 'Untitled Mod';
    const description = trySelectors(descriptionSelectors) || 'No description available';
    const thumbnailUrl = trySelectors(imageSelectors, 'src') || '';
    const author = trySelectors(authorSelectors) || 'Unknown Author';
    const lastUpdated = $('.detailsStatRight:contains("Updated")').next().text().trim() || new Date().toISOString();

    const modData = {
      name: title,
      description,
      content: `Imported from Steam Workshop\n\nDescription: ${description}\n\nAuthor: ${author}\nLast Updated: ${lastUpdated}\n\n[View on Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId})`,
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
    throw error;
  }
};