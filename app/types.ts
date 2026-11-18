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

export interface Point {
  x: number;
  y: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number | null;
  timestamp: number;
}

export type CardinalSide = 'north' | 'east' | 'south' | 'west';

export interface PlanBuilding {
  id: string;
  name: string;
  width: number;
  depth: number;
  x: number;
  y: number;
  rotation: 0 | 90;
}

export interface PlannerProject {
  frontage: number;
  depth: number;
  plotPoints?: Point[];
  roadSide: CardinalSide;
  roadWidth: number;
  northSide: CardinalSide;
  buildings: PlanBuilding[];
  showDimensions: boolean;
  showGrid: boolean;
}

export interface SavedItem {
  id: string;
  title: string;
  sqFt: number;
  sqM: number;
  date: number;
  type: 'CONVERTED' | 'MEASURED' | 'GPS' | 'PLANNED';
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
    geoPoints?: GeoPoint[];
    gpsAccuracyAverage?: number;
    gpsAccuracyWorst?: number;
    planner?: PlannerProject;
  };
}

export type ViewState = 'convert' | 'measure' | 'gps' | 'saved' | 'visualize' | 'learn';
export type SavedFilter = 'ALL' | SavedItem['type'];
