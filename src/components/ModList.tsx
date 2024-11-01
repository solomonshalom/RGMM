import React, { useState } from 'react';
import { Mod, Group, Category } from '../db';
import { Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

interface ModListProps {
  mods: Mod[];
  groups: Group[];
  selectedMod: Mod | null;
  onSelect: (mod: Mod) => void;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, mod: Mod) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetGroupId?: number, targetCategory?: string) => void;
  isMinimal: boolean;
}

const ModList: React.FC<ModListProps> = ({
  mods,
  groups,
  selectedMod,
  onSelect,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isMinimal
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = useLiveQuery(() => db.categories.toArray());

  const filteredMods = mods.filter(mod => {
    const matchesFilter = filter === 'all' || 
                          (filter.startsWith('group_') && mod.groupId === parseInt(filter.split('_')[1])) ||
                          mod.categoryId === parseInt(filter);
    const matchesSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mod.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const groupedMods = filteredMods.reduce((acc, mod) => {
    const key = mod.groupId ? `group_${mod.groupId}` : `category_${mod.categoryId}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(mod);
    return acc;
  }, {} as Record<string, Mod[]>);

  const handleContextMenu = (e: React.MouseEvent, mod: Mod) => {
    e.preventDefault();
    // Implement context menu logic here
  };

  return (
    <div>
      {!isMinimal && (
        <div className="field-row" style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="Search mods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flexGrow: 1, marginRight: '8px' }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ minWidth: '100px' }}
          >
            <option value="all">All</option>
            <optgroup label="Categories">
              {categories?.map(category => (
                <option key={category.id} value={category.id?.toString()}>{category.name}</option>
              ))}
            </optgroup>
            <optgroup label="Groups">
              {groups.map(group => (
                <option key={`group_${group.id}`} value={`group_${group.id}`}>{group.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      )}
      <div className="mod-list">
        {Object.entries(groupedMods).map(([key, categoryMods]) => {
          const isGroup = key.startsWith('group_');
          const id = isGroup ? Number(key.split('_')[1]) : Number(key.split('_')[1]);
          const group = groups.find(g => g.id === id);
          const category = categories?.find(c => c.id === id);
          const headerText = isGroup ? (group ? group.name : 'Ungrouped') : (category ? category.name : 'Uncategorized');

          return (
            <div
              key={key}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, isGroup ? id : undefined, isGroup ? undefined : headerText)}
            >
              <div className="category-header">{headerText}</div>
              {categoryMods.map((mod) => (
                <div
                  key={mod.id}
                  className={`mod-item ${selectedMod?.id === mod.id ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, mod)}
                  onContextMenu={(e) => handleContextMenu(e, mod)}
                >
                  <span onClick={() => onSelect(mod)}>{mod.name}</span>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${mod.name}"?`)) {
                        onDelete(mod.id!);
                      }
                    }}
                    title="Delete mod"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModList;