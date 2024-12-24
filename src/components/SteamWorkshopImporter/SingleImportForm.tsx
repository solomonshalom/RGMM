import React from 'react';

interface SingleImportFormProps {
  url: string;
  setUrl: (url: string) => void;
}

const SingleImportForm: React.FC<SingleImportFormProps> = ({ url, setUrl }) => {
  return (
    <div className="field-row">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter Steam Workshop URL or ID"
      />
    </div>
  );
};

export default SingleImportForm;