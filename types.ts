export enum UnitSystem {
  HILLS = 'HILLS',
  TERAI = 'TERAI',
  MODERN = 'MODERN'
}

export interface UnitDefinition {
  id: string;
  name: string;
  sqFtFactor: number; // How many sq ft is 1 unit
  system: UnitSystem;
}

export interface SavedItem {
  id: string;
  name: string;
  sqFt: number;
  date: number;
  type: 'CONVERTED' | 'MEASURED';
  tags: string[];
}

export interface Point {
  x: number;
  y: number;
}

export type ViewState = 'CONVERT' | 'MEASURE' | 'SAVED';
