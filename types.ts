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

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
