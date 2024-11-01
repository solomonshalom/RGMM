import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Mod } from '../db';

interface ModViewerProps {
  mod: Mod;
  onEdit: () => void;
}

const ModViewer: React.FC<ModViewerProps> = ({ mod, onEdit }) => {
  const handleExport = (format: 'markdown' | 'csv') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'markdown') {
      content = `# ${mod.name}\n\n**Category:** ${mod.category}\n\n${mod.description}\n\n${mod.content}`;
      filename = `${mod.name.replace(/\s+/g, '_').toLowerCase()}.md`;
      mimeType = 'text/markdown;charset=utf-8';
    } else {
      // CSV format
      content = `Name,Category,Description\n"${mod.name}","${mod.category}","${mod.description}"`;
      filename = `${mod.name.replace(/\s+/g, '_').toLowerCase()}.csv`;
      mimeType = 'text/csv;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <fieldset>
        <legend>{mod.name}</legend>
        <p><strong>Category:</strong> {mod.category}</p>
        <p>{mod.description}</p>
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{mod.content}</ReactMarkdown>
        </div>
        <div className="button-row">
          <button onClick={onEdit}>Edit</button>
          <select onChange={(e) => handleExport(e.target.value as 'markdown' | 'csv')}
  style={{
    appearance: 'button',
  }}
            >
            <option value="">Export</option>
            <option value="markdown">Markdown</option>
            <option value="csv">CSV</option>
          </select>
        </div>
      </fieldset>
    </div>
  );
};

export default ModViewer;