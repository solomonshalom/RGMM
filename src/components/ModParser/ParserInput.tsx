import React from 'react';

interface ParserInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const ParserInput: React.FC<ParserInputProps> = ({ value, onChange, disabled }) => (
  <div className="field-row">
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste your mod list, Workshop URLs, or configuration text here..."
      rows={10}
      disabled={disabled}
    />
  </div>
);