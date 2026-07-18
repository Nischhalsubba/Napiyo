import { SQ_FT_PER_SQ_M, UNITS } from '../constants';
import { Point } from '../types';

export const toSqFt = (value: number, unitId: string): number => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value * (UNITS[unitId]?.sqFtFactor ?? 1);
};

export const fromSqFt = (sqFt: number, unitId: string): number => {
  if (!Number.isFinite(sqFt) || sqFt < 0) return 0;
  return sqFt / (UNITS[unitId]?.sqFtFactor ?? 1);
};

export const toSqM = (sqFt: number): number => sqFt / SQ_FT_PER_SQ_M;

export const parseAreaInput = (value: string): number => {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const formatDecimal = (value: number, decimals = 2): string => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(safeValue);
};

export const getHillsBreakdown = (sqFt: number) => {
  let remainingDaam = Math.max(0, sqFt) / UNITS.DAAM.sqFtFactor;
  const ropani = Math.floor(remainingDaam / 256);
  remainingDaam -= ropani * 256;
  const aana = Math.floor(remainingDaam / 16);
  remainingDaam -= aana * 16;
  const paisa = Math.floor(remainingDaam / 4);
  const daam = remainingDaam - paisa * 4;
  return { ropani, aana, paisa, daam };
};

export const getTeraiBreakdown = (sqFt: number) => {
  let remainingDhur = Math.max(0, sqFt) / UNITS.DHUR.sqFtFactor;
  const bigha = Math.floor(remainingDhur / 400);
  remainingDhur -= bigha * 400;
  const kattha = Math.floor(remainingDhur / 20);
  const dhur = remainingDhur - kattha * 20;
  return { bigha, kattha, dhur };
};

export const formatHills = (sqFt: number): string => {
  const value = getHillsBreakdown(sqFt);
  return `${value.ropani}-${value.aana}-${value.paisa}-${formatDecimal(value.daam, 2)}`;
};

export const formatTerai = (sqFt: number): string => {
  const value = getTeraiBreakdown(sqFt);
  return `${value.bigha}-${value.kattha}-${formatDecimal(value.dhur, 2)}`;
};

export const getAllConversions = (sqFt: number) => [
  { id: 'SQFT', label: 'Square feet', value: sqFt, suffix: 'sq ft' },
  { id: 'SQM', label: 'Square metres', value: toSqM(sqFt), suffix: 'sq m' },
  { id: 'SQYD', label: 'Square yards', value: sqFt / 9, suffix: 'sq yd' },
  { id: 'ACRE', label: 'Acres', value: sqFt / 43560, suffix: 'acres' },
  { id: 'HECTARE', label: 'Hectares', value: sqFt / 107639.104167, suffix: 'ha' },
];

export const calculatePolygonAreaPx = (points: Point[]): number => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    area += points[index].x * points[nextIndex].y;
    area -= points[nextIndex].x * points[index].y;
  }
  return Math.abs(area / 2);
};

export const distance = (first: Point, second: Point): number =>
  Math.hypot(second.x - first.x, second.y - first.y);
