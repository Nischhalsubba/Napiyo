import { GeoPoint } from '../types';

const EARTH_RADIUS_M = 6371008.8;
const SQ_FT_PER_SQ_M = 10.7639104167;
const WEB_MERCATOR_MAX_LAT = 85.05112878;
export const WEB_MERCATOR_TILE_SIZE = 256;

const radians = (degrees: number) => degrees * Math.PI / 180;
const degrees = (radiansValue: number) => radiansValue * 180 / Math.PI;

export const haversineDistanceM = (first: GeoPoint, second: GeoPoint): number => {
  const lat1 = radians(first.lat);
  const lat2 = radians(second.lat);
  const deltaLat = lat2 - lat1;
  const deltaLng = radians(second.lng - first.lng);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(value)));
};

export const toLocalMetres = (points: GeoPoint[]) => {
  if (!points.length) return [];
  const origin = points[0];
  const originLat = radians(origin.lat);
  return points.map((point) => ({
    x: radians(point.lng - origin.lng) * Math.cos(originLat) * EARTH_RADIUS_M,
    y: radians(point.lat - origin.lat) * EARTH_RADIUS_M,
  }));
};

export const polygonAreaSqM = (points: GeoPoint[]): number => {
  if (points.length < 3) return 0;
  const local = toLocalMetres(points);
  let area = 0;
  for (let index = 0; index < local.length; index += 1) {
    const next = local[(index + 1) % local.length];
    area += local[index].x * next.y - next.x * local[index].y;
  }
  return Math.abs(area / 2);
};

export const polygonPerimeterM = (points: GeoPoint[]): number => {
  if (points.length < 2) return 0;
  return points.reduce((total, point, index) => total + haversineDistanceM(point, points[(index + 1) % points.length]), 0);
};

export const areaSqFtFromGeo = (points: GeoPoint[]) => polygonAreaSqM(points) * SQ_FT_PER_SQ_M;
export const perimeterFtFromGeo = (points: GeoPoint[]) => polygonPerimeterM(points) * 3.280839895;

export const averageAccuracyM = (points: GeoPoint[]): number => points.length
  ? points.reduce((total, point) => total + point.accuracy, 0) / points.length
  : 0;

export const shouldAcceptPoint = (candidate: GeoPoint, accepted: GeoPoint[], maximumAccuracyM: number, minimumSpacingM = 0.75): boolean => {
  if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lng) || !Number.isFinite(candidate.accuracy)) return false;
  if (candidate.accuracy > maximumAccuracyM) return false;
  const last = accepted.at(-1);
  return !last || haversineDistanceM(last, candidate) >= minimumSpacingM;
};

export const projectGeoToWorldPixels = (point: Pick<GeoPoint, 'lat' | 'lng'>, zoom: number) => {
  const scale = WEB_MERCATOR_TILE_SIZE * 2 ** zoom;
  const latitude = Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(WEB_MERCATOR_MAX_LAT, point.lat));
  const sinLatitude = Math.sin(radians(latitude));
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
};

export const projectWorldPixelsToGeo = (point: { x: number; y: number }, zoom: number) => {
  const scale = WEB_MERCATOR_TILE_SIZE * 2 ** zoom;
  const lng = (point.x / scale) * 360 - 180;
  const mercatorY = 0.5 - point.y / scale;
  const lat = degrees(Math.atan(Math.sinh(mercatorY * 2 * Math.PI)));
  return {
    lat: Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(WEB_MERCATOR_MAX_LAT, lat)),
    lng: ((lng + 540) % 360) - 180,
  };
};

export const metresPerPixel = (latitude: number, zoom: number) => (
  Math.cos(radians(latitude)) * 2 * Math.PI * 6378137 / (WEB_MERCATOR_TILE_SIZE * 2 ** zoom)
);

const closedCoordinates = (points: GeoPoint[]) => {
  if (!points.length) return [];
  return [...points.map((point) => [point.lng, point.lat]), [points[0].lng, points[0].lat]];
};

export const projectToGeoJson = (title: string, points: GeoPoint[]) => JSON.stringify({
  type: 'Feature',
  properties: { title, createdBy: 'Napiyo', disclaimer: 'Planning estimate, not a legal survey.' },
  geometry: { type: 'Polygon', coordinates: [closedCoordinates(points)] },
}, null, 2);

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] ?? character));

export const projectToKml = (title: string, points: GeoPoint[]) => {
  const coordinates = closedCoordinates(points).map(([lng, lat]) => `${lng},${lat},0`).join(' ');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${escapeXml(title)}</name><Placemark><name>${escapeXml(title)}</name><description>Planning estimate, not a legal survey.</description><Polygon><outerBoundaryIs><LinearRing><coordinates>${coordinates}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>`;
};

export const projectToGpx = (title: string, points: GeoPoint[]) => {
  const track = closedCoordinates(points).map(([lng, lat]) => `<trkpt lat="${lat}" lon="${lng}" />`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Napiyo" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${escapeXml(title)}</name></metadata><trk><name>${escapeXml(title)}</name><trkseg>${track}</trkseg></trk></gpx>`;
};