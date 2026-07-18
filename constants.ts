import { UnitDefinition, UnitSystem } from './types';

export const SQ_FT_PER_SQ_M = 10.7639104167;

export const CONVERSION_REFERENCE = {
  source: 'Global IME Bank land area converter',
  url: 'https://www.globalimebank.com/blog/nepal-land-area-converter/',
  note: 'Square-foot relationships are used as the canonical calculation base. Metric values are derived from 1 m² = 10.7639 sq ft.',
  rates: [
    { unit: '1 Ropani', relation: '16 Aana · 5,476 sq ft · about 508.72 m²' },
    { unit: '1 Aana', relation: '4 Paisa · 342.25 sq ft · about 31.80 m²' },
    { unit: '1 Paisa', relation: '4 Daam · 85.56 sq ft · about 7.95 m²' },
    { unit: '1 Daam', relation: '21.39 sq ft · about 1.99 m²' },
    { unit: '1 Bigha', relation: '20 Kattha · 400 Dhur · 72,900 sq ft · about 6,772.63 m²' },
    { unit: '1 Kattha', relation: '20 Dhur · 3,645 sq ft · about 338.63 m²' },
    { unit: '1 Dhur', relation: '182.25 sq ft · about 16.93 m²' },
  ],
} as const;

export const UNITS: Record<string, UnitDefinition> = {
  ROPANI: {
    id: 'ROPANI',
    name: 'Ropani',
    shortName: 'ropani',
    sqFtFactor: 5476,
    system: UnitSystem.HILLS,
    description: 'Hill system: 1 Ropani = 16 Aana = 5,476 sq ft.',
  },
  AANA: {
    id: 'AANA',
    name: 'Aana',
    shortName: 'aana',
    sqFtFactor: 342.25,
    system: UnitSystem.HILLS,
    description: '1 Aana = 4 Paisa = 342.25 sq ft.',
  },
  PAISA: {
    id: 'PAISA',
    name: 'Paisa',
    shortName: 'paisa',
    sqFtFactor: 85.5625,
    system: UnitSystem.HILLS,
    description: '1 Paisa = 4 Daam = 85.5625 sq ft.',
  },
  DAAM: {
    id: 'DAAM',
    name: 'Daam',
    shortName: 'daam',
    sqFtFactor: 21.390625,
    system: UnitSystem.HILLS,
    description: 'Smallest Hill-system unit: 1 Daam = 21.390625 sq ft.',
  },
  BIGHA: {
    id: 'BIGHA',
    name: 'Bigha',
    shortName: 'bigha',
    sqFtFactor: 72900,
    system: UnitSystem.TERAI,
    description: 'Terai system: 1 Bigha = 20 Kattha = 72,900 sq ft.',
  },
  KATTHA: {
    id: 'KATTHA',
    name: 'Kattha',
    shortName: 'kattha',
    sqFtFactor: 3645,
    system: UnitSystem.TERAI,
    description: '1 Kattha = 20 Dhur = 3,645 sq ft.',
  },
  DHUR: {
    id: 'DHUR',
    name: 'Dhur',
    shortName: 'dhur',
    sqFtFactor: 182.25,
    system: UnitSystem.TERAI,
    description: 'Smallest commonly used Terai unit: 1 Dhur = 182.25 sq ft.',
  },
  SQFT: {
    id: 'SQFT',
    name: 'Square feet',
    shortName: 'sq ft',
    sqFtFactor: 1,
    system: UnitSystem.GLOBAL,
    description: 'Common property-listing and floor-plan area unit.',
  },
  SQM: {
    id: 'SQM',
    name: 'Square metres',
    shortName: 'm²',
    sqFtFactor: SQ_FT_PER_SQ_M,
    system: UnitSystem.GLOBAL,
    description: 'Metric survey and construction area unit.',
  },
  SQYD: {
    id: 'SQYD',
    name: 'Square yards',
    shortName: 'yd²',
    sqFtFactor: 9,
    system: UnitSystem.GLOBAL,
    description: '1 square yard = 9 square feet.',
  },
  ACRE: {
    id: 'ACRE',
    name: 'Acres',
    shortName: 'acres',
    sqFtFactor: 43560,
    system: UnitSystem.GLOBAL,
    description: '1 acre = 43,560 square feet.',
  },
  HECTARE: {
    id: 'HECTARE',
    name: 'Hectares',
    shortName: 'ha',
    sqFtFactor: 107639.104167,
    system: UnitSystem.GLOBAL,
    description: '1 hectare = 10,000 square metres.',
  },
};

export const UNIT_GROUPS = [
  {
    label: 'Hill system',
    description: 'Ropani, Aana, Paisa and Daam',
    units: ['ROPANI', 'AANA', 'PAISA', 'DAAM'],
  },
  {
    label: 'Terai system',
    description: 'Bigha, Kattha and Dhur',
    units: ['BIGHA', 'KATTHA', 'DHUR'],
  },
  {
    label: 'Global units',
    description: 'Square and metric units',
    units: ['SQFT', 'SQM', 'SQYD', 'ACRE', 'HECTARE'],
  },
] as const;

export const QUICK_VALUES = [
  { label: '1 Aana', value: '1', unit: 'AANA' },
  { label: '4 Aana', value: '4', unit: 'AANA' },
  { label: '1 Ropani', value: '1', unit: 'ROPANI' },
  { label: '10 Dhur', value: '10', unit: 'DHUR' },
  { label: '1 Kattha', value: '1', unit: 'KATTHA' },
  { label: '1,000 sq ft', value: '1000', unit: 'SQFT' },
] as const;
