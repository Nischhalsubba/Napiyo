import { describe, expect, it } from 'vitest';
import {
  calculatePolygonAreaPx,
  calculatePolygonPerimeterPx,
  getHillsBreakdown,
  getTeraiBreakdown,
  normalizeDigits,
  parseSmartArea,
  toSqFt,
} from '../utils/conversions';

describe('smart Nepal land input', () => {
  it('normalizes Nepali digits', () => {
    expect(normalizeDigits('१ रोपनी ४ आना')).toBe('1 रोपनी 4 आना');
  });

  it('parses Hill words', () => {
    expect(parseSmartArea('1 ropani 2 aana').sqFt).toBe(6160.5);
  });

  it('parses Nepali Terai input', () => {
    expect(parseSmartArea('२ कट्ठा ५ धुर').sqFt).toBe(8201.25);
  });

  it('parses compact Hill notation', () => {
    expect(parseSmartArea('1-2-3-4').sqFt).toBe(6502.75);
  });

  it('parses compact Terai notation', () => {
    expect(parseSmartArea('1-2-3').sqFt).toBe(80736.75);
  });

  it('accepts metric and global units', () => {
    expect(parseSmartArea('500 m²').sqFt).toBeCloseTo(toSqFt(500, 'SQM'), 6);
    expect(parseSmartArea('0.25 acre').sqFt).toBe(10890);
  });

  it('does not claim unrecognized text is valid', () => {
    expect(parseSmartArea('some mysterious land').recognized).toBe(false);
  });
});

describe('normalization and geometry', () => {
  it('normalizes 16 Aana to one Ropani', () => {
    expect(getHillsBreakdown(toSqFt(16, 'AANA'))).toEqual({ ropani: 1, aana: 0, paisa: 0, daam: 0 });
  });

  it('normalizes 20 Kattha to one Bigha', () => {
    expect(getTeraiBreakdown(toSqFt(20, 'KATTHA'))).toEqual({ bigha: 1, kattha: 0, dhur: 0 });
  });

  it('calculates polygon area and perimeter', () => {
    const rectangle = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }];
    expect(calculatePolygonAreaPx(rectangle)).toBe(50);
    expect(calculatePolygonPerimeterPx(rectangle)).toBe(30);
  });
});
