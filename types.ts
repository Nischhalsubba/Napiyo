export enum UnitSystem {
  HILLS = 'HILLS',
  TERAI = 'TERAI',
  GLOBAL = 'GLOBAL',
}

export interface UnitDefinition {
  id: string;
  name: string;
  shortName: string;
  sqFtFactor: number;
  system: UnitSystem;
  description: string;
}

export interface SavedItem {
  id: string;
  title: string;
  sqFt: number;
  sqM: number;
  date: number;
  type: 'CONVERTED' | 'MEASURED';
  tags: string[];
  source?: {
    inputValue?: string;
    inputUnit?: string;
    referenceDistanceFt?: number;
  };
}

export interface Point {
  x: number;
  y: number;
}

export type ViewState = 'convert' | 'measure' | 'saved' | 'visualize';
export type SavedFilter = 'ALL' | SavedItem['type'];
