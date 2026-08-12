import { SavedItem } from '../types';
import { isSafeSavedItem, normalizeSafeItems } from '../utils/security';

const STORAGE_KEY = 'napiyo:saved-items:v3';
const PREVIOUS_KEYS = ['napiyo:saved-items:v2', 'hamrotools:napiyo:v1'];
const DB_NAME = 'napiyo-projects';
const STORE_NAME = 'library';
const DB_VERSION = 1;

interface StorageSchema {
  version: 3;
  items: SavedItem[];
}

export const isSavedItem = isSafeSavedItem;
export const normalizeItems = normalizeSafeItems;

const readLocal = (): SavedItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      ?? PREVIOUS_KEYS.map((key) => localStorage.getItem(key)).find(Boolean)
      ?? null;
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeItems(parsed);
    if (parsed && typeof parsed === 'object' && 'items' in parsed) {
      const items = (parsed as { items?: unknown }).items;
      return Array.isArray(items) ? normalizeItems(items) : [];
    }
  } catch (error) {
    console.error('Napiyo could not read local project data.', error);
  }
  return [];
};

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) return reject(new Error('IndexedDB is unavailable'));
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('IndexedDB could not open'));
});

const writeIndexedDb = async (items: SavedItem[]) => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ version: 3, items }, 'projects');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed'));
  });
  database.close();
};

const readIndexedDb = async (): Promise<SavedItem[]> => {
  const database = await openDatabase();
  const result = await new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get('projects');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
  });
  database.close();
  if (!result || typeof result !== 'object' || !('items' in result)) return [];
  const items = (result as { items?: unknown }).items;
  return Array.isArray(items) ? normalizeItems(items) : [];
};

export const loadItems = (): SavedItem[] => readLocal();

export const hydrateItems = async (): Promise<SavedItem[]> => {
  const local = readLocal();
  try {
    const indexed = await readIndexedDb();
    if (indexed.length) {
      const merged = normalizeItems([...indexed, ...local].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index));
      if (merged.length !== indexed.length) await writeIndexedDb(merged);
      return merged;
    }
    if (local.length) await writeIndexedDb(local);
  } catch (error) {
    console.warn('Napiyo is using localStorage because IndexedDB is unavailable.', error);
  }
  return local;
};

export const saveItems = (items: SavedItem[]): boolean => {
  const safeItems = normalizeItems(items);
  try {
    const payload: StorageSchema = { version: 3, items: safeItems };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    void writeIndexedDb(safeItems).catch((error) => console.warn('IndexedDB mirror failed.', error));
    return true;
  } catch (error) {
    console.error('Napiyo could not save projects.', error);
    void writeIndexedDb(safeItems).catch(() => undefined);
    return false;
  }
};

export const clearItems = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
  PREVIOUS_KEYS.forEach((key) => localStorage.removeItem(key));
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete('projects');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete failed'));
    });
    database.close();
  } catch (error) {
    console.warn('Napiyo could not clear IndexedDB.', error);
  }
};
