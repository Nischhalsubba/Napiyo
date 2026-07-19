import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const index = read('index.html');
const headers = read('public/_headers');
const robots = read('public/robots.txt');
const sitemap = read('public/sitemap.xml');
const manifest = JSON.parse(read('public/manifest.webmanifest')) as {
  screenshots?: Array<{ src: string; sizes: string; type: string }>;
  shortcuts?: Array<{ url: string }>;
};

const meta = (attribute: 'name' | 'property', value: string) => {
  const pattern = new RegExp(`<meta[^>]+${attribute}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+content=["']([^"']+)["']`, 'i');
  return index.match(pattern)?.[1] ?? '';
};

describe('SEO and social preview', () => {
  it('ships a valid 1200x630 PNG social card', () => {
    const encoded = [
      read('seo-assets/social-preview.part1.b64'),
      read('seo-assets/social-preview.part2.b64'),
    ].map((part) => part.trim()).join('');
    const image = Buffer.from(encoded, 'base64');
    expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
    expect(image.length).toBeGreaterThan(10_000);
  });

  it('uses a large PNG card with absolute canonical URLs', () => {
    expect(index).toContain('<link rel="canonical" href="https://napiyo.hinischalsubba.workers.dev/" />');
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
    expect(meta('property', 'og:image')).toBe('https://napiyo.hinischalsubba.workers.dev/napiyo-social-preview-v1.png');
    expect(meta('property', 'og:image:type')).toBe('image/png');
    expect(meta('property', 'og:image:width')).toBe('1200');
    expect(meta('property', 'og:image:height')).toBe('630');
  });

  it('contains parseable structured data allowed by the CSP hash', () => {
    const jsonLd = index.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)?.[1];
    expect(jsonLd).toBeTruthy();
    const parsed = JSON.parse(jsonLd ?? '{}') as { '@context'?: string; '@graph'?: unknown[] };
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@graph']?.length).toBeGreaterThanOrEqual(4);
    const hash = createHash('sha256').update(jsonLd ?? '').digest('base64');
    expect(headers).toContain(`'sha256-${hash}'`);
  });

  it('publishes crawler discovery and image sitemap entries', () => {
    expect(robots).toContain('Sitemap: https://napiyo.hinischalsubba.workers.dev/sitemap.xml');
    expect(sitemap).toContain('<loc>https://napiyo.hinischalsubba.workers.dev/</loc>');
    expect(sitemap).toContain('<image:loc>https://napiyo.hinischalsubba.workers.dev/napiyo-social-preview-v1.png</image:loc>');
  });

  it('exposes the preview in the PWA manifest and valid shortcuts', () => {
    expect(manifest.screenshots?.[0]).toMatchObject({
      src: '/napiyo-social-preview-v1.png',
      sizes: '1200x630',
      type: 'image/png',
    });
    expect(manifest.shortcuts?.map((shortcut) => shortcut.url)).toEqual(['/#convert', '/#gps', '/#visualize']);
  });
});
