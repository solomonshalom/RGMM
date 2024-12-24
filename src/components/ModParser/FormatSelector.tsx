import React from 'react';
import { OutputFormat } from '../../types/workshop';

interface FormatSelectorProps {
  format: OutputFormat;
  onChange: (format: OutputFormat) => void;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ format, onChange }) => {
  return (
    <div className="field-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label htmlFor="format-select" style={{ minWidth: '100px' }}>Output Format:</label>
      <select
        id="format-select"
        value={format}
        onChange={(e) => onChange(e.target.value as OutputFormat)}
        style={{
          padding: '0.25rem',
          minWidth: '200px'
        }}
      >
        <option value="flat">Flat List</option>
        <option value="grouped">Grouped by Workshop ID</option>
        <option value="relationship">Relationship View</option>
      </select>
    </div>
  );
};

export default FormatSelector;