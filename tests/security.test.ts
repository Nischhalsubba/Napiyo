import { describe, expect, it } from 'vitest';
import { escapeHtml, isSafeSavedItem, normalizeSafeItems, safeCsvCell, safeDownloadName } from '../utils/security';

const validProject = {
  id: 'project-1',
  title: 'Home plot',
  sqFt: 1000,
  sqM: 92.90304,
  date: Date.now(),
  type: 'GPS' as const,
  tags: ['gps'],
  source: {
    geoPoints: [
      { lat: 27.7, lng: 85.3, accuracy: 4, timestamp: 1 },
      { lat: 27.7, lng: 85.301, accuracy: 4, timestamp: 2 },
      { lat: 27.701, lng: 85.301, accuracy: 4, timestamp: 3 },
    ],
  },
};

describe('saved project security validation', () => {
  it('accepts a bounded valid project', () => {
    expect(isSafeSavedItem(validProject)).toBe(true);
    expect(normalizeSafeItems([validProject])).toHaveLength(1);
  });

  it('rejects invalid coordinates and negative areas', () => {
    expect(isSafeSavedItem({ ...validProject, sqFt: -1 })).toBe(false);
    expect(isSafeSavedItem({ ...validProject, source: { geoPoints: [{ lat: 200, lng: 85, accuracy: 4, timestamp: 1 }] } })).toBe(false);
  });

  it('rejects unbounded metadata and point arrays', () => {
    expect(isSafeSavedItem({ ...validProject, title: 'x'.repeat(121) })).toBe(false);
    expect(isSafeSavedItem({ ...validProject, source: { geoPoints: Array.from({ length: 5001 }, (_, index) => ({ lat: 27, lng: 85, accuracy: 4, timestamp: index })) } })).toBe(false);
  });
});

describe('safe output encoding', () => {
  it('escapes report HTML', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('neutralizes spreadsheet formulas', () => {
    expect(safeCsvCell('=HYPERLINK("https://evil.invalid")')).toStartWith('"\'');
    expect(safeCsvCell('Normal title')).toBe('"Normal title"');
  });

  it('creates filesystem-safe names', () => {
    expect(safeDownloadName('../../My plot <script>')).toBe('..-..-My-plot-script');
  });
});
