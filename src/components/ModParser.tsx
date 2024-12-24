import React, { useState } from 'react';
import { extractIds, fetchWorkshopCollection, normalizeWorkshopUrl } from '../utils/parserUtils';
import OutputSection from './ModParser/OutputSection';

interface ParsedData {
  workshopIds: string[];
  modIds: string[];
  mapIds: string[];
  workshopModIds: Record<string, string[]>;
}

const ModParser: React.FC = () => {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData>({ 
    workshopIds: [], 
    modIds: [], 
    mapIds: [],
    workshopModIds: {}
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseInput = async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, extract IDs from the raw text
      const initialParsed = extractIds(text);
      
      // Check for workshop URLs and fetch their contents
      const lines = text.split('\n');
      const collectionData: ParsedData[] = [];
      const workshopModMapping: Record<string, string[]> = {};
      
      for (const line of lines) {
        if (line.includes('steamcommunity.com/sharedfiles/filedetails/')) {
          try {
            const normalizedUrl = normalizeWorkshopUrl(line);
            const collectionIds = await fetchWorkshopCollection(normalizedUrl);
            collectionData.push(collectionIds);

            // Map Workshop IDs to their corresponding Mod IDs
            if (collectionIds.workshopIds.length > 0) {
              const workshopId = collectionIds.workshopIds[0];
              workshopModMapping[workshopId] = collectionIds.modIds;
            }
          } catch (err) {
            console.error('Failed to fetch collection/item:', err);
          }
        }
      }
      
      // Combine all parsed data
      const combinedData: ParsedData = {
        workshopIds: [
          ...initialParsed.workshopIds,
          ...collectionData.flatMap(d => d.workshopIds)
        ],
        modIds: [
          ...initialParsed.modIds,
          ...collectionData.flatMap(d => d.modIds)
        ],
        mapIds: [
          ...initialParsed.mapIds,
          ...collectionData.flatMap(d => d.mapIds)
        ],
        workshopModIds: workshopModMapping
      };
      
      // Remove duplicates and filter out empty strings
      setParsedData({
        workshopIds: [...new Set(combinedData.workshopIds)].filter(Boolean),
        modIds: [...new Set(combinedData.modIds)].filter(Boolean),
        mapIds: [...new Set(combinedData.mapIds)].filter(Boolean),
        workshopModIds: combinedData.workshopModIds
      });
    } catch (err) {
      setError('Failed to parse some content. Please check your input and try again.');
      console.error('Parsing error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    setInput(newInput);
    parseInput(newInput);
  };

  const copyToClipboard = async (type: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy to clipboard');
    }
  };

  // Format Workshop-Mod ID relationships
  const formatWorkshopModIds = () => {
    const relationships: string[] = [];
    Object.entries(parsedData.workshopModIds).forEach(([workshopId, modIds]) => {
      modIds.forEach(modId => {
        relationships.push(`${workshopId}`);
      });
    });
    return relationships.join(';');
  };

  return (
    <div className="mod-parser">
      <fieldset>
        <legend>Mod Parser</legend>
        <div className="field-row">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Paste your mod list, Workshop URLs, or configuration text here..."
            rows={10}
            disabled={isLoading}
          />
        </div>
        
        {isLoading && (
          <div className="status-message">
            Processing input...
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="parsed-output">
          <OutputSection
            title="Workshop IDs"
            items={parsedData.workshopIds}
            type="workshop"
            copied={copied}
            onCopy={copyToClipboard}
          />
          
          <OutputSection
            title="Mod IDs"
            items={parsedData.modIds}
            type="mod"
            copied={copied}
            onCopy={copyToClipboard}
          />
          
          <OutputSection
            title="Workshop-Mod IDs"
            items={formatWorkshopModIds().split(';').filter(Boolean)}
            type="workshop-mod"
            copied={copied}
            onCopy={copyToClipboard}
          />
        </div>
      </fieldset>
    </div>
  );
};

export default ModParser;