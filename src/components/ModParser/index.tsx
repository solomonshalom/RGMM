import React, { useState } from 'react';
import { parseWorkshopContent, filterExcludedMods } from '../../utils/workshop/parser';
import { processWorkshopCollection } from '../../utils/workshop/api';
import { ParseResult } from '../../utils/workshop/types';

const ModParser: React.FC = () => {
  const [input, setInput] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [output, setOutput] = useState<ParseResult>({ workshopIds: [], modIds: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initial parsing of input text
      const result = parseWorkshopContent(input);
      
      // Process workshop IDs to get mod IDs
      const collection = await processWorkshopCollection(result.workshopIds);
      
      // Get all mod IDs from collection
      const collectionModIds = Object.values(collection).flat();
      
      // Combine with directly parsed mod IDs and filter exclusions
      const allModIds = [...new Set([...result.modIds, ...collectionModIds])];
      const excludedIds = exclusions.split(',').map(id => id.trim());
      const filteredModIds = filterExcludedMods(allModIds, excludedIds);

      setOutput({
        workshopIds: result.workshopIds,
        modIds: filteredModIds
      });
    } catch (err) {
      setError('Failed to parse content. Please check your input.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mod-parser">
      <fieldset>
        <legend>Mod Parser</legend>
        
        <div className="field-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste Workshop URLs or content..."
            disabled={isLoading}
          />
        </div>

        <div className="field-row">
          <input
            type="text"
            value={exclusions}
            onChange={(e) => setExclusions(e.target.value)}
            placeholder="Excluded Mod IDs (comma-separated)"
          />
        </div>

        <div className="field-row">
          <button onClick={handleParse} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Parse'}
          </button>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {output.workshopIds.length > 0 && (
          <div className="output-section">
            <h4>Workshop IDs:</h4>
            <div className="output-content">
              {output.workshopIds.join(';')}
            </div>
          </div>
        )}

        {output.modIds.length > 0 && (
          <div className="output-section">
            <h4>Mod IDs:</h4>
            <div className="output-content">
              {output.modIds.join(';')}
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
};

export default ModParser;