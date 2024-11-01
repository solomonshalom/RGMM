import React, { useState, useEffect, useContext } from 'react';
import { db, Group, Category } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ThemeContext } from '../contexts/ThemeContext';

interface SettingsProps {
  isMinimal: boolean;
  setIsMinimal: (value: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  isMinimal, 
  setIsMinimal
}) => {
  const [apiKey, setApiKey] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const groups = useLiveQuery(() => db.groups.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const { theme, setTheme } = useContext(ThemeContext);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    localStorage.setItem('apiKey', newApiKey);
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      await db.groups.add({ name: newGroupName.trim() });
      setNewGroupName('');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (window.confirm('Are you sure you want to delete this group? This will not delete the mods in the group.')) {
      await db.groups.delete(groupId);
      // Update mods to remove the deleted group
      const modsToUpdate = await db.mods.where('groupId').equals(groupId).toArray();
      await Promise.all(modsToUpdate.map(mod => db.mods.update(mod.id!, { groupId: undefined })));
    }
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      await db.categories.add({ name: newCategoryName.trim() });
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? This will not delete the mods in the category.')) {
      await db.categories.delete(categoryId);
      // Update mods to set category to 'Other' for the deleted category
      const modsToUpdate = await db.mods.where('categoryId').equals(categoryId).toArray();
      const otherCategory = await db.categories.where('name').equals('Other').first();
      await Promise.all(modsToUpdate.map(mod => db.mods.update(mod.id!, { 
        categoryId: otherCategory?.id,
        category: 'Other'
      })));
    }
  };

  return (
    <div className="settings">
      <fieldset>
        <legend>Settings</legend>
        <div className="field-row">
          <label htmlFor="apiKey">Groq API Key:</label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Enter your Groq API key"
          />
        </div>
        <div className="field-row">
          <label htmlFor="theme">Theme:</label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'winxp' | 'accessible' | 'macos' | 'win98' )}
          >
            <option value="winxp">Windows XP</option>
            <option value="accessible">Accessible</option>
            <option value="macos">macOS</option>
            <option value="win98">Windows 98</option>
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="minimal">Minimal Mode:</label>
          <select
            id="minimal"
            value={isMinimal ? 'yes' : 'no'}
            onChange={(e) => setIsMinimal(e.target.value === 'yes')}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </fieldset>
      <fieldset>
        <legend>Group Management</legend>
        <div className="field-row">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name"
          />
          <button onClick={handleCreateGroup}>Create Group</button>
        </div>
        <div className="group-list">
          {groups?.map((group: Group) => (
            <div key={group.id} className="group-item">
              <span>{group.name}</span>
              <button onClick={() => handleDeleteGroup(group.id!)}>Delete</button>
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Category Management</legend>
        <div className="field-row">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
          />
          <button onClick={handleCreateCategory}>Create Category</button>
        </div>
        <div className="category-list">
          {categories?.map((category: Category) => (
            <div key={category.id} className="category-item">
              <span>{category.name}</span>
              <button onClick={() => handleDeleteCategory(category.id!)}>Delete</button>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
};

export default Settings;