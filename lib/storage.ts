import { SavedItem } from '../types';

const STORAGE_KEY = 'napiyo:saved-items:v3';
const PREVIOUS_KEYS = ['napiyo:saved-items:v2', 'hamrotools:napiyo:v1'];
const DB_NAME = 'napiyo-projects';
const STORE_NAME = 'library';
const DB_VERSION = 1;

interface StorageSchema {
  version: 3;
  items: SavedItem[];
}

const validTypes = new Set(['CONVERTED', 'MEASURED', 'GPS', 'PLANNED']);

export const isSavedItem = (value: unknown): value is SavedItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedItem>;
  return typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.sqFt === 'number'
    && Number.isFinite(item.sqFt)
    && typeof item.date === 'number'
    && validTypes.has(String(item.type));
};

export const normalizeItems = (items: unknown[]): SavedItem[] => items
  .filter(isSavedItem)
  .map((item) => ({
    ...item,
    sqM: typeof item.sqM === 'number' ? item.sqM : item.sqFt * 0.09290304,
    tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : [],
  }));

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
    if (indexed.length) return indexed;
    if (local.length) await writeIndexedDb(local);
  } catch (error) {
    console.warn('Napiyo is using localStorage because IndexedDB is unavailable.', error);
  }
  return local;
};

export const saveItems = (items: SavedItem[]): boolean => {
  try {
    const payload: StorageSchema = { version: 3, items };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    void writeIndexedDb(items).catch((error) => console.warn('IndexedDB mirror failed.', error));
    return true;
  } catch (error) {
    console.error('Napiyo could not save projects.', error);
    void writeIndexedDb(items).catch(() => undefined);
    return false;
  }
};
