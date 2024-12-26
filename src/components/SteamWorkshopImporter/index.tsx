import React, { useState } from 'react';
import { Mod } from '../../db';
import { scrapeWorkshopData } from './steamUtils';
import SingleImportForm from './SingleImportForm';
import BulkImportForm from './BulkImportForm';
import ImportProgress from './ImportProgress';

interface SteamWorkshopImporterProps {
  onImport: (mod: Omit<Mod, 'id'>) => void;
  onCancel: () => void;
}

const SteamWorkshopImporter: React.FC<SteamWorkshopImporterProps> = ({ onImport, onCancel }) => {
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState<'single' | 'bulk'>('single');
  const [bulkImportMode, setBulkImportMode] = useState<'individual' | 'collection'>('individual');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [useAI, setUseAI] = useState(false);
  const [collectionName, setCollectionName] = useState('');

  const handleBulkImport = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const urls = bulkUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      if (urls.length === 0) {
        throw new Error('No valid URLs provided');
      }
      
      setProgress({ current: 0, total: urls.length });

      const scrapedMods = [];
      for (let i = 0; i < urls.length; i++) {
        try {
          const modData = await scrapeWorkshopData(urls[i], useAI);
          scrapedMods.push(modData);
          setProgress({ current: i + 1, total: urls.length });
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (err) {
          console.error(`Failed to import ${urls[i]}:`, err);
        }
      }

      if (scrapedMods.length === 0) {
        throw new Error('Failed to import any mods');
      }

      if (bulkImportMode === 'individual') {
        scrapedMods.forEach(mod => onImport(mod));
      } else {
        const collectionContent = scrapedMods.map((mod, index) => `
## ${index + 1}. ${mod.name}

${mod.description}

- Author: ${mod.author}
- [View on Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=${mod.steamWorkshopId})
${mod.thumbnailUrl ? `\n![${mod.name}](${mod.thumbnailUrl})` : ''}
`).join('\n\n---\n\n');

        const collectionMod = {
          name: collectionName || 'Mod Collection',
          description: `A collection of ${scrapedMods.length} Steam Workshop mods`,
          content: `# ${collectionName || 'Mod Collection'}\n\n${collectionContent}`,
          category: 'Steam Workshop',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        onImport(collectionMod);
      }
      
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import mods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleImport = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (!url) {
        throw new Error('Please enter a Steam Workshop URL');
      }
      const modData = await scrapeWorkshopData(url, useAI);
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
        <select value={importMode} onChange={(e) => setImportMode(e.target.value as 'single' | 'bulk')}>
          <option value="single">Single Import</option>
          <option value="bulk">Advanced Import</option>
        </select>
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

      {importMode === 'single' ? (
        <SingleImportForm url={url} setUrl={setUrl} />
      ) : (
        <BulkImportForm
          bulkUrls={bulkUrls}
          setBulkUrls={setBulkUrls}
          bulkImportMode={bulkImportMode}
          setBulkImportMode={setBulkImportMode}
          collectionName={collectionName}
          setCollectionName={setCollectionName}
        />
      )}

      <ImportProgress current={progress.current} total={progress.total} />

      <div className="field-row">
        <button
          type="button"
          onClick={importMode === 'single' ? handleSingleImport : handleBulkImport}
          disabled={isLoading || (!url && !bulkUrls) || (bulkImportMode === 'collection' && !collectionName)}
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