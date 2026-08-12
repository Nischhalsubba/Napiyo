import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');
const contrastCss = read('language-contrast.css');
const entry = read('index.tsx');
const learn = read('components/LearnScreen.tsx');
const image = read('components/MeasureScreen.tsx');
const gps = read('components/GpsMeasureScreen.tsx');
const map = read('components/GpsMap.tsx');
const saved = read('components/SavedScreen.tsx');
const planner = read('components/VisualizeScreen.tsx');
const review = read('components/SavedMeasurementReview.tsx');
const converter = read('components/ConvertScreen.tsx');
const conversions = read('utils/conversions.ts');

const luminance = (hex: string) => {
  const rgb = hex.replace('#', '').match(/.{2}/g)!.map((value) => Number.parseInt(value, 16) / 255);
  const linear = rgb.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const ratio = (foreground: string, background: string) => {
  const first = luminance(foreground), second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

describe('complete language and contrast layer', () => {
  it('loads after every visual theme layer', () => {
    expect(entry.indexOf("./language-contrast.css")).toBeGreaterThan(entry.indexOf("./product-redesign.css"));
  });

  it('keeps muted text accessible on the darkest surfaces', () => {
    expect(ratio('#b8c2cf', '#0d1117')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#cbd5e1', '#151b23')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#eaf1ff', '#003893')).toBeGreaterThanOrEqual(4.5);
  });

  it('maps muted utility classes explicitly', () => {
    expect(contrastCss).toContain('html.dark .text-ink-400');
    expect(contrastCss).toContain('html.dark .text-ink-500');
    expect(contrastCss).toContain('.nepal-result-card > div:first-child .text-ink-300');
  });

  it('makes every major workspace react to the app language', () => {
    for (const source of [learn, image, gps, map, saved, planner, review]) {
      expect(source).toContain('useAppLanguage');
      expect(source).toMatch(/language\s*=?.*useAppLanguage/);
      expect(source).toMatch(/language\s*===\s*'ne'|language==='ne'/);
    }
    expect(converter).toContain("language==='ne'");
  });

  it('localizes shared numbers, unit words, parser feedback, reports, and map controls', () => {
    expect(conversions).toContain("document.documentElement.lang==='ne'");
    expect(conversions).toContain("ne:'रोपनी'");
    expect(conversions).toContain('एकाइ पहिचान गर्न सकिएन');
    expect(saved).toContain('सबै स्थानीय डाटा हटाउनुहोस्');
    expect(planner).toContain('जग्गाको आकार मिलाउनुहोस्');
    expect(map).toContain('कुना कोर्नुहोस्');
  });

  it('does not mix bilingual headings in the learning centre', () => {
    expect(learn).not.toContain('Learn · सिक्नुहोस्');
    expect(learn).not.toContain('Hill system · पहाडी प्रणाली');
  });
});
