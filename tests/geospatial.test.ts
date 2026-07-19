import { describe, expect, it } from 'vitest';
import { GeoPoint } from '../types';
import {
  areaSqFtFromGeo,
  averageAccuracyM,
  haversineDistanceM,
  metresPerPixel,
  polygonAreaSqM,
  polygonPerimeterM,
  projectGeoToWorldPixels,
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
