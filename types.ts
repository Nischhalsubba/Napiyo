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
  title: string;
  sqFt: number;
  sqM?: number; // Optional, computed
  date: number;
  type: 'CONVERTED' | 'MEASURED';
  tags: string[]; // Keep tags for filtering if needed, or map to 'source'
  source?: {
    systemMode?: string;
    roundingMode?: boolean;
    inputValue?: string;
    inputUnit?: string;
  };
}

export interface Point {
  x: number;
  y: number;
}

export type ViewState = 'CONVERT' | 'MEASURE' | 'SAVED' | 'VISUALIZE';
