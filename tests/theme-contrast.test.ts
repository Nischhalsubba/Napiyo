import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const luminance = (hex: string) => {
  const rgb = hex.replace('#', '').match(/.{2}/g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = rgb.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};

const contrast = (foreground: string, background: string) => {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
};

const nepaliTheme = readFileSync(resolve(import.meta.dirname, '../nepali-theme.css'), 'utf8');

describe('Napiyo dark theme contrast', () => {
  it('keeps white hero text readable on charcoal', () => {
    expect(contrast('#ffffff', '#171a21')).toBeGreaterThanOrEqual(7);
  });

  it('keeps primary text readable on dark surfaces', () => {
    expect(contrast('#f5f7fa', '#151b23')).toBeGreaterThanOrEqual(7);
  });

  it('keeps secondary text readable on dark surfaces', () => {
    expect(contrast('#aeb7c4', '#151b23')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps muted hero text readable on charcoal', () => {
    expect(contrast('#b8c0cc', '#171a21')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps breakdown titles readable on their dark panel', () => {
    expect(contrast('#b7ceff', '#111827')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps breakdown descriptions readable on their dark panel', () => {
    expect(contrast('#cbd5e1', '#111827')).toBeGreaterThanOrEqual(4.5);
  });

  it('does not render a fixed decorative stripe across the converter hero', () => {
    expect(nepaliTheme).not.toContain('.converter-page::before');
    expect(nepaliTheme).toContain('.nepal-result-card .bg-ink-900\\/90');
  });
});
