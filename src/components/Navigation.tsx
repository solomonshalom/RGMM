import React from 'react';

interface NavigationProps {
  currentView: 'mods' | 'settings' | 'chat' | 'parser';
  setCurrentView: (view: 'mods' | 'settings' | 'chat' | 'parser') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="field-row" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
      <button onClick={() => setCurrentView('mods')} disabled={currentView === 'mods'}>
        Mods
      </button>
      <button onClick={() => setCurrentView('settings')} disabled={currentView === 'settings'}>
        Settings
      </button>
      <button onClick={() => setCurrentView('chat')} disabled={currentView === 'chat'}>
        Chat
      </button>
      <button onClick={() => setCurrentView('parser')} disabled={currentView === 'parser'}>
        Scrappy
      </button>
    </div>
  );
};

export default Navigation;