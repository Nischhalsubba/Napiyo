import { describe, expect, it } from 'vitest';
import { GeoPoint } from '../types';
import {
  areaSqFtFromGeo,
  averageAccuracyM,
  haversineDistanceM,
  WEB_MERCATOR_TILE_SIZE,
  metresPerPixel,
  polygonAreaSqM,
  polygonPerimeterM,
  projectGeoToWorldPixels,
  projectWorldPixelsToGeo,
  projectToGeoJson,
  projectToGpx,
  projectToKml,
  shouldAcceptPoint,
} from '../utils/geospatial';

const point = (lat: number, lng: number, accuracy = 4): GeoPoint => ({ lat, lng, accuracy, timestamp: 1 });
const square = [
  point(27.700000, 85.300000),
  point(27.700000, 85.3001015),
  point(27.7000899, 85.3001015),
  point(27.7000899, 85.300000),
];

describe('GPS geometry', () => {
  it('calculates realistic distance in metres', () => {
    expect(haversineDistanceM(square[0], square[1])).toBeGreaterThan(9.8);
    expect(haversineDistanceM(square[0], square[1])).toBeLessThan(10.2);
  });

  it('calculates polygon area and perimeter', () => {
    expect(polygonAreaSqM(square)).toBeGreaterThan(98);
    expect(polygonAreaSqM(square)).toBeLessThan(102);
    expect(polygonPerimeterM(square)).toBeGreaterThan(39);
    expect(polygonPerimeterM(square)).toBeLessThan(41);
    expect(areaSqFtFromGeo(square)).toBeGreaterThan(1050);
  });

  it('filters poor or duplicate fixes', () => {
    expect(shouldAcceptPoint(point(27.7, 85.3, 40), [], 20)).toBe(false);
    expect(shouldAcceptPoint(point(27.7, 85.3, 4), [], 20)).toBe(true);
    expect(shouldAcceptPoint(point(27.7, 85.3, 4), [point(27.7, 85.3)], 20)).toBe(false);
  });

  it('rejects out-of-range coordinates and negative GPS accuracy', () => {
    for (const invalid of [
      point(90.001, 85.3), point(-90.001, 85.3),
      point(27.7, 180.001), point(27.7, -180.001),
      point(27.7, 85.3, -1),
      point(Number.NaN, 85.3), point(27.7, Number.POSITIVE_INFINITY),
    ]) {
      expect(shouldAcceptPoint(invalid, [], 20)).toBe(false);
    }
    expect(shouldAcceptPoint(point(27.7, 85.3, 4), [], -1)).toBe(false);
    expect(shouldAcceptPoint(point(27.7, 85.3, 4), [], Number.NaN)).toBe(false);
    expect(shouldAcceptPoint(point(27.7, 85.3, 4), [], 20)).toBe(true);
  });

  it('summarizes GPS accuracy', () => {
    expect(averageAccuracyM([point(0, 0, 4), point(0, 0, 8)])).toBe(6);
  });

  it('projects coordinates consistently for slippy-map tiles', () => {
    const origin = projectGeoToWorldPixels(point(0, 0), 1);
    expect(origin.x).toBeCloseTo(256, 5);
    expect(origin.y).toBeCloseTo(256, 5);
    const kathmandu = projectGeoToWorldPixels(point(27.7, 85.3), 18);
    expect(Number.isFinite(kathmandu.x)).toBe(true);
    expect(Number.isFinite(kathmandu.y)).toBe(true);
    expect(metresPerPixel(27.7, 18)).toBeGreaterThan(0);
  });

  it('wraps westward map pans into valid longitude bounds', () => {
    const zoom = 1;
    const worldWidth = WEB_MERCATOR_TILE_SIZE * 2 ** zoom;
    for (const x of [-worldWidth * 1.5, -worldWidth * 2.5, worldWidth * 2.5]) {
      const result = projectWorldPixelsToGeo({ x, y: worldWidth / 2 }, zoom);
      expect(result.lng).toBeGreaterThanOrEqual(-180);
      expect(result.lng).toBeLessThan(180);
    }
    expect(projectWorldPixelsToGeo({ x: -worldWidth * 1.5, y: worldWidth / 2 }, zoom).lng).toBe(0);
  });

  it('reverses map pixels back into geographic coordinates', () => {
    const source = point(26.463704, 87.274993);
    const pixels = projectGeoToWorldPixels(source, 18);
    const restored = projectWorldPixelsToGeo(pixels, 18);
    expect(restored.lat).toBeCloseTo(source.lat, 6);
    expect(restored.lng).toBeCloseTo(source.lng, 6);
  });
});

describe('portable GPS exports', () => {
  it('creates valid GeoJSON geometry', () => {
    const parsed = JSON.parse(projectToGeoJson('Plot', square));
    expect(parsed.geometry.type).toBe('Polygon');
    expect(parsed.geometry.coordinates[0]).toHaveLength(5);
  });

  it('creates KML and GPX documents', () => {
    expect(projectToKml('Plot & home', square)).toContain('<Polygon>');
    expect(projectToKml('Plot & home', square)).toContain('Plot &amp; home');
    expect(projectToGpx('Plot', square)).toContain('<trkseg>');
    expect(projectToGpx('Plot', square)).toContain('<trkpt');
  });
});