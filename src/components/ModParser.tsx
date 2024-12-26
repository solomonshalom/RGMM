import React, { useState, useCallback } from 'react';
import { scrapeWorkshopCollection } from '../utils/workshop/scraper';
import OutputSection from './ModParser/OutputSection';
import ParserInput from './ModParser/ParserInput';
import ParserStatus from './ModParser/ParserStatus';

const ModParser: React.FC = () => {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState({
    workshopIds: [] as string[],
    modIds: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    setInput(newInput);
    
    if (newInput.includes('steamcommunity.com')) {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await scrapeWorkshopCollection(newInput);
        if (result.success && result.data) {
          setParsedData({
            workshopIds: result.data.workshopIds,
            modIds: result.data.modIds
          });
        } else {
          setError(result.error || 'Failed to parse content');
        }
      } catch (err) {
        setError('Failed to parse content. Please check your input.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

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

  return (
    <div className="mod-parser">
      <fieldset>
        <legend>Mod Parser</legend>
        <ParserInput
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        
        <ParserStatus
          isLoading={isLoading}
          error={error}
        />
        
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
        </div>
      </fieldset>
    </div>
  );
};

export default ModParser;