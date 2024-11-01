import React, { useState, useEffect } from 'react';
import { Mod, Group, Category } from '../db';
import SteamWorkshopImporter from './SteamWorkshopImporter';
import { Groq } from 'groq-sdk';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

interface ModFormProps {
  mod?: Mod;
  groups: Group[];
  onSave: (mod: Omit<Mod, 'id'>) => void;
  onCancel: () => void;
}

interface ExtendedMod extends Mod {
  steamWorkshopId?: string;
  thumbnailUrl?: string;
  author?: string;
  lastUpdated?: string;
}

const ModForm: React.FC<ModFormProps> = ({ mod, groups, onSave, onCancel }) => {
  const [name, setName] = useState(mod?.name || '');
  const [description, setDescription] = useState(mod?.description || '');
  const [content, setContent] = useState(mod?.content || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(mod?.categoryId);
  const [groupId, setGroupId] = useState<number | undefined>(mod?.groupId);
  const [showImporter, setShowImporter] = useState(false);
  const [steamWorkshopId, setSteamWorkshopId] = useState((mod as ExtendedMod)?.steamWorkshopId || '');
  const [thumbnailUrl, setThumbnailUrl] = useState((mod as ExtendedMod)?.thumbnailUrl || '');
  const [author, setAuthor] = useState((mod as ExtendedMod)?.author || '');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const categories = useLiveQuery(() => db.categories.toArray());

  useEffect(() => {
    if (mod) {
      setName(mod.name);
      setDescription(mod.description);
      setContent(mod.content);
      setCategoryId(mod.categoryId);
      setGroupId(mod.groupId);
      
      const extendedMod = mod as ExtendedMod;
      if (extendedMod.steamWorkshopId) {
        setSteamWorkshopId(extendedMod.steamWorkshopId);
        setThumbnailUrl(extendedMod.thumbnailUrl || '');
        setAuthor(extendedMod.author || '');
      }
    }
  }, [mod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = categories?.find(cat => cat.id === categoryId)?.name || 'Other';
    const modData: Omit<ExtendedMod, 'id'> = {
      name,
      description,
      content,
      category,
      categoryId,
      groupId,
      createdAt: mod?.createdAt || new Date(),
      updatedAt: new Date(),
      steamWorkshopId,
      thumbnailUrl,
      author,
    };
    onSave(modData);
  };

  const handleImport = (importedMod: Omit<ExtendedMod, 'id'>) => {
    setName(importedMod.name);
    const markdownContent = `
# ${importedMod.name}

${importedMod.description}

---
**Steam Workshop ID**: ${importedMod.steamWorkshopId}
**Author**: ${importedMod.author}
**Last Updated**: ${new Date(importedMod.lastUpdated || '').toLocaleDateString()}

![Mod Thumbnail](${importedMod.thumbnailUrl})
    `.trim();

    setContent(markdownContent);
    const steamWorkshopCategory = categories?.find(cat => cat.name === 'Steam Workshop');
    setCategoryId(steamWorkshopCategory?.id);
    setSteamWorkshopId(importedMod.steamWorkshopId || '');
    setThumbnailUrl(importedMod.thumbnailUrl || '');
    setAuthor(importedMod.author || '');
    setShowImporter(false);
  };

  const handleAiIt = async () => {
    setIsAiProcessing(true);
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      alert('Please set your Groq API key in the settings first.');
      setIsAiProcessing(false);
      return;
    }

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in summarizing game modification (mod) details. Your task is to extract all essential points from the mod description. Ensure no relevant information is omitted, and present the summary in a clear, organized manner with bullet points or sections for easy reading.',
          },
          {
            role: 'user',
            content: `Summarize the following game mod information into key points:
            Name: ${name}
            Category: ${categories?.find(cat => cat.id === categoryId)?.name}
            Description: ${description}
            Content: ${content}`,
          },
        ],
        model: 'mixtral-8x7b-32768',
      });

      const summary = completion.choices[0]?.message?.content;
      if (summary) {
        setContent((prevContent) => `## ${name}\n${summary}`);
      }
    } catch (error) {
      console.error('Error processing with AI:', error);
      alert('An error occurred while processing with AI. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>{mod ? 'Edit Mod' : 'New Mod'}</legend>
        <div className="field-row">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field-row">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Select a category</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="group">Group:</label>
          <select
            id="group"
            value={groupId || ''}
            onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">No Group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="description">Description:</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="field-row">
          <label htmlFor="content">Content (Markdown):</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        {!showImporter && (
          <div className="field-row">
            <button type="button" onClick={() => setShowImporter(true)}>
              Import from Steam Workshop
            </button>
            <button type="button" onClick={handleAiIt} disabled={isAiProcessing}>
              {isAiProcessing ? 'Processing...' : 'AI it!'}
            </button>
          </div>
        )}
        {showImporter && (
          <SteamWorkshopImporter 
            onImport={handleImport} 
            onCancel={() => setShowImporter(false)} 
          />
        )}
      </fieldset>
      <div className="button-row">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Save</button>
      </div>
    </form>
  );
};

export default ModForm;