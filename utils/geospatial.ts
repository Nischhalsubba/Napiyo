import { GeoPoint } from '../types';

const EARTH_RADIUS_M = 6371008.8;
const SQ_FT_PER_SQ_M = 10.7639104167;
const WEB_MERCATOR_MAX_LAT = 85.05112878;
const WEB_MERCATOR_TILE_SIZE = 256;

const radians = (degrees: number) => degrees * Math.PI / 180;

export const haversineDistanceM = (first: GeoPoint, second: GeoPoint): number => {
  const lat1 = radians(first.lat);
  const lat2 = radians(second.lat);
  const deltaLat = lat2 - lat1;
 