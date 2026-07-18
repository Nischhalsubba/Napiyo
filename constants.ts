import { UnitDefinition, UnitSystem } from './types';

export const SQ_FT_PER_SQ_M = 10.7639104167;

export const UNITS: Record<string, UnitDefinition> = {
  ROPANI: {
    id: 'ROPANI',
    name: 'Ropani',
    shortName: 'ropani',
    sqFtFactor: 5476,
    system: UnitSystem.HILLS,
    description: 'Hill-region land unit. 1 Ropani = 16 Aana.',
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
    description: '1 Paisa = 4 Daam.',
  },
  DAAM: {
    id: 'DAAM',
    name: 'Daam',
    shortName: 'daam',
    sqFtFactor: 21.390625,
    system: UnitSystem.HILLS,
    description: 'The smallest unit in the Ropani system.',
  },
  BIGHA: {
    id: 'BIGHA',
    name: 'Bigha',
    shortName: 'bigha',
    sqFtFactor: 72900,
    system: UnitSystem.TERAI,
    description: 'Terai land unit. 1 Bigha = 20 Kattha.',
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
    description: 'The smaller commonly used unit in the Terai system.',
  },
  SQFT: {
    id: 'SQFT',
    name: 'Square feet',
    shortName: 'sq ft',
    sqFtFactor: 1,
    system: UnitSystem.GLOBAL,
    description: 'International area unit used in property listings and plans.',
  },
  SQM: {
    id: 'SQM',
    name: 'Square metres',
    shortName: 'sq m',
    sqFtFactor: SQ_FT_PER_SQ_M,
    system: UnitSystem.GLOBAL,
    description: 'Metric area unit used in survey and construction documents.',
  },
  SQYD: {
    id: 'SQYD',
    name: 'Square yards',
    shortName: 'sq yd',
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
    description: 'Large international land unit. 1 acre = 43,560 sq ft.',
  },
  HECTARE: {
    id: 'HECTARE',
    name: 'Hectares',
    shortName: 'ha',
    sqFtFactor: 107639.104167,
    system: UnitSystem.GLOBAL,
    description: 'Metric land unit. 1 hectare = 10,000 square metres.',
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
