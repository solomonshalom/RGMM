import React from 'react';
import { ParsedWorkshopData, OutputFormat } from '../../types/workshop';
import { formatOutput } from '../../utils/workshop/formatter';

interface ParserOutputProps {
  data: ParsedWorkshopData;
  format: OutputFormat;
  copied: string | null;
  onCopy: (type: string, content: string) => void;
}

const ParserOutput: React.FC<ParserOutputProps> = ({ data, format, copied, onCopy }) => {
  const formattedOutput = formatOutput(data, format);
  const sections = formattedOutput.split('\n');

  return (
    <div className="parsed-output">
      {sections.map((section, index) => (
        <fieldset key={index}>
          <legend>{section.split(':')[0]}</legend>
          <div className="output-row">
            <span>{section.split(':')[1]?.trim() || 'None'}</span>
            <button
              onClick={() => onCopy(`section-${index}`, section.split(':')[1]?.trim() || '')}
              className="copy-button"
              title="Copy to clipboard"
            >
              {copied === `section-${index}` ? '✓' : 'Copy'}
            </button>
          </div>
        </fieldset>
      ))}
    </div>
  );
};

export default ParserOutput;