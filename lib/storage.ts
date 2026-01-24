import { SavedItem } from '../types';

const STORAGE_KEY = 'hamrotools:napiyo:v1';

interface StorageSchema {
    version: number;
    items: SavedItem[];
}

export const loadItems = (): SavedItem[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        // Check for legacy data (if any existed before v1)
        if (!raw.includes('"version":')) {
            // Handle migration if needed, or just allow legacy array to be parsed if valid
            // For now, assume fresh start or compatible array
            const legacy = JSON.parse(raw);
            if (Array.isArray(legacy)) return legacy;
        }

        const data: StorageSchema = JSON.parse(raw);
        return data.items || [];
    } catch (e) {
        console.error("Failed to load items", e);
        return [];
    }
};

export const saveItems = (items: SavedItem[]) => {
    try {
        const payload: StorageSchema = {
            version: 1,
            items
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error("Failed to save items", e);
        alert("Storage full or unavailable. Some data may not be saved.");
    }
};
