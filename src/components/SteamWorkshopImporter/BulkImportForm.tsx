import React from 'react';

interface BulkImportFormProps {
  bulkUrls: string;
  setBulkUrls: (urls: string) => void;
  bulkImportMode: 'individual' | 'collection';
  setBulkImportMode: (mode: 'individual' | 'collection') => void;
  collectionName: string;
  setCollectionName: (name: string) => void;
}

const BulkImportForm: React.FC<BulkImportFormProps> = ({
  bulkUrls,
  setBulkUrls,
  bulkImportMode,
  setBulkImportMode,
  collectionName,
  setCollectionName,
}) => {
  return (
    <>
      <div className="field-row">
        <select 
          value={bulkImportMode} 
          onChange={(e) => setBulkImportMode(e.target.value as 'individual' | 'collection')}
        >
          <option value="individual">Create Individual Mods</option>
          <option value="collection">Create Single Collection</option>
        </select>
      </div>

      {bulkImportMode === 'collection' && (
        <div className="field-row">
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder="Collection Name"
          />
        </div>
      )}

      <div className="field-row">
        <textarea
          value={bulkUrls}
          onChange={(e) => setBulkUrls(e.target.value)}
          placeholder="Enter multiple Steam Workshop URLs (one per line)"
          rows={5}
        />
      </div>
    </>
  );
};

export default BulkImportForm;