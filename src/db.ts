import Dexie, { Table } from 'dexie';

export interface Mod {
  id?: number;
  name: string;
  description: string;
  content: string;
  category: string;
  categoryId?: number;
  groupId?: number;
  createdAt: Date;
  updatedAt: Date;
  steamWorkshopId?: string;
  thumbnailUrl?: string;
  author?: string;
}

export interface Group {
  id?: number;
  name: string;
}

export interface Category {
  id?: number;
  name: string;
}

export class ModDatabase extends Dexie {
  mods!: Table<Mod, number>;
  groups!: Table<Group, number>;
  categories!: Table<Category, number>;

  constructor() {
    super('ModDatabase');
    this.version(4).stores({
      mods: '++id, name, category, categoryId, groupId, createdAt, updatedAt',
      groups: '++id, name',
      categories: '++id, name'
    });
  }
}

export const db = new ModDatabase();

// Initialize default categories
(async () => {
  const defaultCategories = ['Gameplay', 'Graphics', 'Audio', 'UI', 'Cheats', 'Steam Workshop', 'Other'];
  const existingCategories = await db.categories.toArray();
  
  for (const categoryName of defaultCategories) {
    if (!existingCategories.some(cat => cat.name === categoryName)) {
      await db.categories.add({ name: categoryName });
    }
  }
})();