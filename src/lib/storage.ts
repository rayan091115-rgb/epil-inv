import { Equipment } from "@/types/equipment";

const STORAGE_KEY = "epil_inventory";

export const storage = {
  getAll: (): Equipment[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading from storage:", error);
      return [];
    }
  },

  save: (equipment: Equipment[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  },

  add: (equipment: Equipment): void => {
    const all = storage.getAll();
    all.push(equipment);
    storage.save(all);
  },

  update: (id: string, updates: Partial<Equipment>): void => {
    const all = storage.getAll();
    const index = all.findIndex((e) => e.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
      storage.save(all);
    }
  },

  delete: (id: string): void => {
    const all = storage.getAll();
    storage.save(all.filter((e) => e.id !== id));
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },
};
