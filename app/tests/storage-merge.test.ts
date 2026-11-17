import { describe, expect, it } from 'vitest';
import { mergeStoredItems, needsIndexedMirrorRefresh } from '../lib/storage';
import type { SavedItem } from '../types';

const project = (id: string, title: string): SavedItem => ({
  id, title, sqFt: 1000, sqM: 92.90304,
  date: 1700000000000, type: 'CONVERTED', tags: [],
});

describe('local/IndexedDB project recovery', () => {
  it('preserves the newest synchronous local version of a project ID', () => {
    const local = [project('plot-1', 'Edited locally')];
    const indexed = [project('plot-1', 'Stale IndexedDB copy')];
    const merged = mergeStoredItems(local, indexed);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe('Edited locally');
    expect(needsIndexedMirrorRefresh(merged, indexed)).toBe(true);
  });

  it('keeps unique projects from both sources', () => {
    const local = [project('local', 'Local')];
    const indexed = [project('indexed', 'Indexed')];
    expect(mergeStoredItems(local, indexed).map((item) => item.id)).toEqual(['local', 'indexed']);
  });

  it('does not rewrite an already current mirror', () => {
    const records = [project('plot-1', 'Current')];
    expect(needsIndexedMirrorRefresh(mergeStoredItems(records, records), records)).toBe(false);
  });
});
