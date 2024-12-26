import React from 'react';
import { Copy, Check } from 'lucide-react';

interface OutputSectionProps {
  title: string;
  items?: string[];
  type: 'workshop' | 'mod' | 'map';
  copied: string | null;
  onCopy: (type: string, content: string) => void;
}

const OutputSection: React.FC<OutputSectionProps> = ({
  title,
  items = [], // Provide default empty array
  type,
  copied,
  onCopy,
}) => {
  if (!items?.length) return null;

  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="output-row">
        <span>{items.join(';')}</span>
        <button
          onClick={() => onCopy(type, items.join(';'))}
          className="copy-button"
          title="Copy to clipboard"
        >
          {copied === type ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </fieldset>
  );
};

export default OutputSection;