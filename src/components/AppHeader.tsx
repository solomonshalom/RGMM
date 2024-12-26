import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface AppHeaderProps {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ isFullScreen, toggleFullScreen }) => {
  return (
    <div className="title-bar">
      <div className="title-bar-text">
        PZM&nbsp;
        <a 
          href="https://linktr.ee/solomonlijo" 
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          (@solomonlijo)
        </a>
      </div>
      <div className="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize" onClick={toggleFullScreen}>
          {isFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
        <button aria-label="Close"></button>
      </div>
    </div>
  );
};

export default AppHeader;