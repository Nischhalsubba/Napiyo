import { SavedItem } from '../types';

const STORAGE_KEY = 'napiyo:saved-items:v2';
const LEGACY_KEY = 'hamrotools:napiyo:v1';

interface StorageSchema {
  version: 2;
  items: SavedItem[];
}

const isSavedItem = (value: unknown): value is SavedItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.sqFt === 'number' &&
    typeof item.date === 'number' &&
    (item.type === 'CONVERTED' || item.type === 'MEASURED')
  );
};

const normalizeItems = (items: unknown[]): SavedItem[] =>
  items.filter(isSavedItem).map((item) => ({
    ...item,
    sqM: typeof item.sqM === 'number' ? item.sqM : item.sqFt * 0.09290304,
    tags: Array.isArray(item.tags) ? item.tags : [],
  }));

export const loadItems = (): SavedItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeItems(parsed);

    if (parsed && typeof parsed === 'object' && 'items' in parsed) {
      const items = (parsed as { items?: unknown }).items;
      return Array.isArray(items) ? normalizeItems(items) : [];
    }

    return [];
  } catch (error) {
    console.error('Napiyo could not read saved calculations.', error);
    return [];
  }
};

export const saveItems = (items: SavedItem[]): boolean => {
  try {
    const payload: StorageSchema = { version: 2, items };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Napiyo could not save calculations.', error);
    return false;
  }
};
