import React, { useState, useEffect, useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Mod } from './db';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import AppHeader from './components/AppHeader';
import Navigation from './components/Navigation';
import MainContent from './components/MainContent';

const App: React.FC = () => {
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [meme, setMeme] = useState<string>('');
  const [currentView, setCurrentView] = useState<'mods' | 'settings' | 'chat' | 'parser'>('mods');
  const [isMinimal, setIsMinimal] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const mods = useLiveQuery(() => db.mods.toArray()) || [];
  const groups = useLiveQuery(() => db.groups.toArray()) || [];
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
      <div 
        className={`window theme-${theme}`} 
        style={{ 
          width: '100%', 
          maxWidth: isFullScreen ? '100%' : '800px', 
          margin: '0 auto',
        }}
      >
        <AppHeader 
          isFullScreen={isFullScreen} 
          toggleFullScreen={toggleFullScreen} 
        />
        <div className="window-body">
          <p>Status: {meme}</p>
          <Navigation 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
          />
          <MainContent
            currentView={currentView}
            mods={mods}
            groups={groups}
            selectedMod={selectedMod}
            isEditing={isEditing}
            isMinimal={isMinimal}
            setSelectedMod={setSelectedMod}
            setIsEditing={setIsEditing}
            setIsMinimal={setIsMinimal}
            handleSave={handleSave}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;