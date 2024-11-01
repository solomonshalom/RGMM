import React, { useState, useEffect, useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Mod, Group } from './db';
import ModList from './components/ModList';
import ModForm from './components/ModForm';
import ModViewer from './components/ModViewer';
import Settings from './components/Settings';
import Chat from './components/Chat';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { Maximize2, Minimize2 } from 'lucide-react';

function App() {
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [meme, setMeme] = useState<string>('');
  const [currentView, setCurrentView] = useState<'mods' | 'settings' | 'chat'>('mods');
  const [isMinimal, setIsMinimal] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<string>('Arial, sans-serif');

  const mods = useLiveQuery(() => db.mods.toArray());
  const groups = useLiveQuery(() => db.groups.toArray());
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const memes = [
      "When you find a rare item but your inventory is full!",
      "Lag killed me, not you!",
      "That moment when you finally beat the final boss...",
      "I came. I saw. I rage quit.",
      "Respawn, repeat. The life of a gamer.",
      'I came here to laugh, not to grind.',
      'When you fail a level for the 10th time, and you hear the same intro speech again.',
      'One more game, they said… 5 hours later…',
      'Why does the boss always have a second, harder form?',
      'Lag: The true final boss of any online game.'
    ];

    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    setMeme(randomMeme);
  }, []);
  
  const handleSave = async (modData: Omit<Mod, 'id'>) => {
    if (selectedMod && selectedMod.id) {
      await db.mods.update(selectedMod.id, modData);
    } else {
      await db.mods.add(modData);
    }
    setSelectedMod(null);
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    await db.mods.delete(id);
    if (selectedMod && selectedMod.id === id) {
      setSelectedMod(null);
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, mod: Mod) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(mod));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetGroupId?: number, targetCategory?: string) => {
    e.preventDefault();
    const modData = JSON.parse(e.dataTransfer.getData('text/plain')) as Mod;

    if (modData.id) {
      const updateData: Partial<Mod> = {};
      if (targetGroupId !== undefined) {
        updateData.groupId = targetGroupId;
      }
      if (targetCategory) {
        updateData.category = targetCategory;
      }
      await db.mods.update(modData.id, updateData);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  return (
    <ThemeProvider>
      <div className={`window theme-${theme}`} style={{ 
        width: '100%', 
        maxWidth: isFullScreen ? '100%' : '800px', 
        margin: '0 auto',
      }}>
        <div className="title-bar">
          <div className="title-bar-text">
            RGMM&nbsp;
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
        <div className="window-body">
          <p>Status: {meme}</p>
          <div className="field-row" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
            <button onClick={() => setCurrentView('mods')} disabled={currentView === 'mods'}>Mods</button>
            <button onClick={() => setCurrentView('settings')} disabled={currentView === 'settings'}>Settings</button>
            <button onClick={() => setCurrentView('chat')} disabled={currentView === 'chat'}>Chat</button>
          </div>
          {currentView === 'mods' ? (
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40%' }}>
                <fieldset>
                  <legend>Mods</legend>
                  <ModList
                    mods={mods || []}
                    groups={groups || []}
                    selectedMod={selectedMod}
                    onSelect={setSelectedMod}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isMinimal={isMinimal}
                  />
                </fieldset>
                <div className="field-row">
                  <button onClick={() => { setSelectedMod(null); setIsEditing(true); }}>New Mod</button>
                </div>
              </div>
              <div style={{ width: '60%' }}>
                {isEditing ? (
                  <ModForm
                    mod={selectedMod || undefined}
                    groups={groups || []}
                    onSave={handleSave}
                    onCancel={() => {
                      setSelectedMod(null);
                      setIsEditing(false);
                    }}
                  />
                ) : selectedMod ? (
                  <ModViewer mod={selectedMod} onEdit={handleEdit} />
                ) : (
                  <div className="markdown-content">
                    <p>Select a mod to view or create a new one.</p>
                  </div>
                )}
              </div>
            </div>
          ) : currentView === 'settings' ? (
            <Settings 
              isMinimal={isMinimal} 
              setIsMinimal={setIsMinimal}
            />
          ) : (
            <Chat 
              mods={mods || []} 
              groups={groups || []} 
              onDelete={handleDelete}
              onEdit={handleEdit}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;