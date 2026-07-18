import { SQ_FT_PER_SQ_M, UNITS } from '../constants';
import { Point } from '../types';

export interface HillsInput {
  ropani: number;
  aana: number;
  paisa: number;
  daam: number;
}

export interface TeraiInput {
  bigha: number;
  kattha: number;
  dhur: number;
}

const EPSILON = 1e-9;

export const toSqFt = (value: number, unitId: string): number => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value * (UNITS[unitId]?.sqFtFactor ?? 1);
};

export const fromSqFt = (sqFt: number, unitId: string): number => {
  if (!Number.isFinite(sqFt) || sqFt < 0) return 0;
  return sqFt / (UNITS[unitId]?.sqFtFactor ?? 1);
};

export const hillsToSqFt = ({ ropani, aana, paisa, daam }: HillsInput): number =>
  toSqFt(ropani, 'ROPANI') +
  toSqFt(aana, 'AANA') +
  toSqFt(paisa, 'PAISA') +
  toSqFt(daam, 'DAAM');

export const teraiToSqFt = ({ bigha, kattha, dhur }: TeraiInput): number =>
  toSqFt(bigha, 'BIGHA') + toSqFt(kattha, 'KATTHA') + toSqFt(dhur, 'DHUR');

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

const cleanRemainder = (value: number): number => {
  const rounded = Math.abs(value - Math.round(value)) < EPSILON ? Math.round(value) : value;
  return Math.max(0, rounded);
};

export const getHillsBreakdown = (sqFt: number) => {
  let remainingDaam = Math.max(0, sqFt) / UNITS.DAAM.sqFtFactor;
  const ropani = Math.floor((remainingDaam + EPSILON) / 256);
  remainingDaam -= ropani * 256;
  const aana = Math.floor((remainingDaam + EPSILON) / 16);
  remainingDaam -= aana * 16;
  const paisa = Math.floor((remainingDaam + EPSILON) / 4);
  const daam = cleanRemainder(remainingDaam - paisa * 4);
  return { ropani, aana, paisa, daam };
};

export const getTeraiBreakdown = (sqFt: number) => {
  let remainingDhur = Math.max(0, sqFt) / UNITS.DHUR.sqFtFactor;
  const bigha = Math.floor((remainingDhur + EPSILON) / 400);
  remainingDhur -= bigha * 400;
  const kattha = Math.floor((remainingDhur + EPSILON) / 20);
  const dhur = cleanRemainder(remainingDhur - kattha * 20);
  return { bigha, kattha, dhur };
};

export const formatHills = (sqFt: number): string => {
  const value = getHillsBreakdown(sqFt);
  return `${value.ropani}-${value.aana}-${value.paisa}-${formatDecimal(value.daam, 3)}`;
};

export const formatTerai = (sqFt: number): string => {
  const value = getTeraiBreakdown(sqFt);
  return `${value.bigha}-${value.kattha}-${formatDecimal(value.dhur, 3)}`;
};

export const formatHillsWords = (sqFt: number): string => {
  const value = getHillsBreakdown(sqFt);
  return `${formatDecimal(value.ropani, 0)} Ropani · ${formatDecimal(value.aana, 0)} Aana · ${formatDecimal(value.paisa, 0)} Paisa · ${formatDecimal(value.daam, 3)} Daam`;
};

export const formatTeraiWords = (sqFt: number): string => {
  const value = getTeraiBreakdown(sqFt);
  return `${formatDecimal(value.bigha, 0)} Bigha · ${formatDecimal(value.kattha, 0)} Kattha · ${formatDecimal(value.dhur, 3)} Dhur`;
};

export const getAllConversions = (sqFt: number) => [
  { id: 'SQFT', label: 'Square feet', value: sqFt, suffix: 'sq ft' },
  { id: 'SQM', label: 'Square metres', value: toSqM(sqFt), suffix: 'm²' },
  { id: 'SQYD', label: 'Square yards', value: sqFt / 9, suffix: 'yd²' },
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
