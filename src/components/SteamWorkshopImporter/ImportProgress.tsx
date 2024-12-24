import React from 'react';

interface ImportProgressProps {
  current: number;
  total: number;
}

const ImportProgress: React.FC<ImportProgressProps> = ({ current, total }) => {
  if (total === 0) return null;

  return (
    <div className="progress-bar">
      Importing: {current}/{total} mods
    </div>
  );
};

export default ImportProgress;