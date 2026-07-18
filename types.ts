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

export interface Point { x: number; y: number; }

export interface SavedItem {
  id: string;
  title: string;
  sqFt: number;
  sqM: number;
  date: number;
  type: 'CONVERTED' | 'MEASURED';
  tags: string[];
  notes?: string;
  source?: {
    inputValue?: string;
    inputUnit?: string;
    referenceDistanceFt?: number;
    referenceUnit?: 'ft' | 'm';
    perimeterFt?: number;
    scalePoints?: Point[];
    boundary?: Point[];
    imageWidth?: number;
    imageHeight?: number;
    confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export type ViewState = 'convert' | 'measure' | 'saved' | 'visualize';
export type SavedFilter = 'ALL' | SavedItem['type'];
