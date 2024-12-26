import React from 'react';

interface ParserInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}

const ParserInput: React.FC<ParserInputProps> = ({ value, onChange, disabled }) => (
  <div className="field-row">
    <textarea
      value={value}
      onChange={onChange}
      placeholder="Paste your collection link here"
      rows={10}
      disabled={disabled}
    />
  </div>
);

export default ParserInput;