import React from 'react';
import { Mod, Group } from '../db';
import ModList from './ModList';
import ModForm from './ModForm';
import ModViewer from './ModViewer';
import Settings from './Settings';
import Chat from './Chat';
import ModParser from './ModParser';

interface MainContentProps {
  currentView: 'mods' | 'settings' | 'chat' | 'parser';
  mods: Mod[];
  groups: Group[];
  selectedMod: Mod | null;
  isEditing: boolean;
  isMinimal: boolean;
  setSelectedMod: (mod: Mod | null) => void;
  setIsEditing: (isEditing: boolean) => void;
  setIsMinimal: (isMinimal: boolean) => void;
  handleSave: (modData: Omit<Mod, 'id'>) => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
  handleEdit: () => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, mod: Mod) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, targetGroupId?: number, targetCategory?: string) => Promise<void>;
}

const MainContent: React.FC<MainContentProps> = ({
  currentView,
  mods,
  groups,
  selectedMod,
  isEditing,
  isMinimal,
  setSelectedMod,
  setIsEditing,
  setIsMinimal,
  handleSave,
  handleDelete,
  handleEdit,
  handleDragStart,
  handleDragOver,
  handleDrop
}) => {
  if (currentView === 'mods') {
    return (
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ width: '40%' }}>
          <fieldset>
            <legend>Mods</legend>
            <ModList
              mods={mods}
              groups={groups}
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
            <button onClick={() => { setSelectedMod(null); setIsEditing(true); }}>
              New Mod
            </button>
          </div>
        </div>
        <div style={{ width: '60%' }}>
          {isEditing ? (
            <ModForm
              mod={selectedMod || undefined}
              groups={groups}
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
    );
  }

  if (currentView === 'settings') {
    return <Settings isMinimal={isMinimal} setIsMinimal={setIsMinimal} />;
  }

  if (currentView === 'chat') {
    return (
      <Chat 
        mods={mods} 
        groups={groups} 
        onDelete={handleDelete}
        onEdit={handleEdit}
        onSave={handleSave}
      />
    );
  }

  return <ModParser />;
};

export default MainContent;