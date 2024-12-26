import React from 'react';

interface ParserStatusProps {
  isLoading: boolean;
  error: string | null;
}

const ParserStatus: React.FC<ParserStatusProps> = ({ isLoading, error }) => (
  <>
    {isLoading && (
      <div className="status-message">
        Processing input...
      </div>
    )}
    {error && (
      <div className="error-message">
        {error}
      </div>
    )}
  </>
);

export default ParserStatus;