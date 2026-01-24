import { UnitDefinition, UnitSystem } from './types';

// Base Unit is Square Feet
export const UNITS: Record<string, UnitDefinition> = {
  // Hills
  ROPANI: { id: 'ROPANI', name: 'Ropani', sqFtFactor: 5476, system: UnitSystem.HILLS },
  AANA: { id: 'AANA', name: 'Aana', sqFtFactor: 342.25, system: UnitSystem.HILLS },
  PAISA: { id: 'PAISA', name: 'Paisa', sqFtFactor: 85.5625, system: UnitSystem.HILLS },
  DAAM: { id: 'DAAM', name: 'Daam', sqFtFactor: 21.390625, system: UnitSystem.HILLS },
  
  // Terai
  BIGHA: { id: 'BIGHA', name: 'Bigha', sqFtFactor: 72900, system: UnitSystem.TERAI },
  KATTHA: { id: 'KATTHA', name: 'Kattha', sqFtFactor: 3645, system: UnitSystem.TERAI },
  DHUR: { id: 'DHUR', name: 'Dhur', sqFtFactor: 182.25, system: UnitSystem.TERAI },

  // Modern
  SQFT: { id: 'SQFT', name: 'Sq. Feet', sqFtFactor: 1, system: UnitSystem.MODERN },
  SQM: { id: 'SQM', name: 'Sq. Meter', sqFtFactor: 10.7639, system: UnitSystem.MODERN },
};

export const QUICK_CHIPS = [
  { label: '1 Aana', val: 1, unit: 'AANA' },
  { label: '4 Aana', val: 4, unit: 'AANA' },
  { label: '1 Ropani', val: 1, unit: 'ROPANI' },
  { label: '1 Kattha', val: 1, unit: 'KATTHA' },
  { label: '10 Dhur', val: 10, unit: 'DHUR' },
  { label: '1 Bigha', val: 1, unit: 'BIGHA' },
  { label: '1000 Sq.ft', val: 1000, unit: 'SQFT' },
];
