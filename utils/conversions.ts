import { UNITS } from '../constants';

export const toSqFt = (value: number, unitId: string): number => {
  const factor = UNITS[unitId]?.sqFtFactor || 1;
  return value * factor;
};

export const fromSqFt = (sqFt: number, unitId: string): number => {
  const factor = UNITS[unitId]?.sqFtFactor || 1;
  return sqFt / factor;
};

export const formatDecimal = (num: number, decimals = 2): string => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
};

// Breakdown Logic (e.g. 5.5 Ropani -> 5 Ropani, 8 Aana...)
export const getHillsBreakdown = (sqFt: number) => {
  let remaining = sqFt;
  
  const ropani = Math.floor(remaining / UNITS.ROPANI.sqFtFactor);
  remaining %= UNITS.ROPANI.sqFtFactor;
  
  const aana = Math.floor(remaining / UNITS.AANA.sqFtFactor);
  remaining %= UNITS.AANA.sqFtFactor;
  
  const paisa = Math.floor(remaining / UNITS.PAISA.sqFtFactor);
  remaining %= UNITS.PAISA.sqFtFactor;
  
  const daam = remaining / UNITS.DAAM.sqFtFactor; // Keep decimal for last unit

  return { ropani, aana, paisa, daam };
};

export const getTeraiBreakdown = (sqFt: number) => {
  let remaining = sqFt;
  
  const bigha = Math.floor(remaining / UNITS.BIGHA.sqFtFactor);
  remaining %= UNITS.BIGHA.sqFtFactor;
  
  const kattha = Math.floor(remaining / UNITS.KATTHA.sqFtFactor);
  remaining %= UNITS.KATTHA.sqFtFactor;
  
  const dhur = remaining / UNITS.DHUR.sqFtFactor; // Keep decimal for last unit
  
  return { bigha, kattha, dhur };
};

// Geometry for Measure Tool
export const calculatePolygonAreaPx = (points: {x: number, y: number}[]) => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

export const distance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};
