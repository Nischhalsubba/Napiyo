import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const redesign = readFileSync(resolve(import.meta.dirname, '../product-redesign.css'), 'utf8');
const entry = readFileSync(resolve(import.meta.dirname, '../index.tsx'), 'utf8');

const luminance = (hex: string) => {
  const rgb = hex.replace('#', '').match(/.{2}/g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = rgb.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};

const contrast = (foreground: string, background: string) => {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

describe('restrained utility redesign', () => {
  it('loads after the legacy theme layers', () => {
    expect(entry.indexOf("./product-redesign.css")).toBeGreaterThan(entry.indexOf("./nepali-theme.css"));
  });

  it('removes decorative hero and result ornaments', () => {
    expect(redesign).toContain('.nepali-hero::before');
    expect(redesign).toContain('.nepali-hero-emblem');
    expect(redesign).toContain('display: none !important');
    expect(redesign).toContain('.nepal-result-card::after');
  });

  it('uses flat page and card surfaces', () => {
    expect(redesign).toContain('background: var(--color-bg) !important');
    expect(redesign).toContain('background: var(--color-surface)');
    expect(redesign).not.toContain('radial-gradient');
    expect(redesign).not.toContain('linear-gradient');
    expect(redesign).not.toContain('backdrop-filter: blur');
  });

  it('keeps the primary result header accessible', () => {
    expect(contrast('#ffffff', '#003893')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps body text accessible on the warm neutral background', () => {
    expect(contrast('#171a21', '#fafaf8')).toBeGreaterThanOrEqual(7);
  });
});
