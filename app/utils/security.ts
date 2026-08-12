import { GeoPoint, PlanBuilding, PlannerProject, Point, SavedItem } from '../types';

export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;
export const MAX_IMPORT_PROJECTS = 500;
const MAX_COORDINATE_POINTS = 5000;
const MAX_BUILDINGS = 200;
const MAX_AREA_SQ_FT = 1_000_000_000_000;

const finite = (value: unknown, min = -Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

const text = (value: unknown, max: number, allowEmpty = false): value is string =>
  typeof value === 'string' && value.length <= max && (allowEmpty || value.trim().length > 0);

const isPoint = (value: unknown): value is Point => {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<Point>;
  return finite(point.x) && finite(point.y);
};

const isGeoPoint = (value: unknown): value is GeoPoint => {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<GeoPoint>;
  return finite(point.lat, -90, 90)
    && finite(point.lng, -180, 180)
    && finite(point.accuracy, 0, 100_000)
    && finite(point.timestamp, 0, 9_999_999_999_999)
    && (point.altitude === undefined || point.altitude === null || finite(point.altitude, -20_000, 100_000));
};

const isBuilding = (value: unknown): value is PlanBuilding => {
  if (!value || typeof value !== 'object') return false;
  const building = value as Partial<PlanBuilding>;
  return text(building.id, 100)
    && text(building.name, 120)
    && finite(building.width, 0.01, 1_000_000)
    && finite(building.depth, 0.01, 1_000_000)
    && finite(building.x, -1_000_000, 1_000_000)
    && finite(building.y, -1_000_000, 1_000_000)
    && (building.rotation === 0 || building.rotation === 90);
};

const isPlanner = (value: unknown): value is PlannerProject => {
  if (!value || typeof value !== 'object') return false;
  const planner = value as Partial<PlannerProject>;
  const sides = new Set(['north', 'east', 'south', 'west']);
  return finite(planner.frontage, 0.01, 1_000_000)
    && finite(planner.depth, 0.01, 1_000_000)
    && finite(planner.roadWidth, 0, 100_000)
    && sides.has(String(planner.roadSide))
    && sides.has(String(planner.northSide))
    && typeof planner.showDimensions === 'boolean'
    && typeof planner.showGrid === 'boolean'
    && Array.isArray(planner.buildings)
    && planner.buildings.length <= MAX_BUILDINGS
    && planner.buildings.every(isBuilding)
    && (planner.plotPoints === undefined || (Array.isArray(planner.plotPoints) && planner.plotPoints.length <= MAX_COORDINATE_POINTS && planner.plotPoints.every(isPoint)));
};

const isSource = (value: unknown): value is NonNullable<SavedItem['source']> => {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const source = value as NonNullable<SavedItem['source']>;
  if (source.inputValue !== undefined && !text(source.inputValue, 500, true)) return false;
  if (source.inputUnit !== undefined && !text(source.inputUnit, 80, true)) return false;
  if (source.referenceDistanceFt !== undefined && !finite(source.referenceDistanceFt, 0, 1_000_000_000)) return false;
  if (source.referenceUnit !== undefined && source.referenceUnit !== 'ft' && source.referenceUnit !== 'm') return false;
  if (source.perimeterFt !== undefined && !finite(source.perimeterFt, 0, 10_000_000_000)) return false;
  if (source.imageWidth !== undefined && !finite(source.imageWidth, 1, 100_000)) return false;
  if (source.imageHeight !== undefined && !finite(source.imageHeight, 1, 100_000)) return false;
  if (source.confidence !== undefined && !['LOW', 'MEDIUM', 'HIGH'].includes(source.confidence)) return false;
  if (source.gpsAccuracyAverage !== undefined && !finite(source.gpsAccuracyAverage, 0, 100_000)) return false;
  if (source.gpsAccuracyWorst !== undefined && !finite(source.gpsAccuracyWorst, 0, 100_000)) return false;
  if (source.scalePoints !== undefined && (!Array.isArray(source.scalePoints) || source.scalePoints.length > 2 || !source.scalePoints.every(isPoint))) return false;
  if (source.boundary !== undefined && (!Array.isArray(source.boundary) || source.boundary.length > MAX_COORDINATE_POINTS || !source.boundary.every(isPoint))) return false;
  if (source.geoPoints !== undefined && (!Array.isArray(source.geoPoints) || source.geoPoints.length > MAX_COORDINATE_POINTS || !source.geoPoints.every(isGeoPoint))) return false;
  if (source.planner !== undefined && !isPlanner(source.planner)) return false;
  return true;
};

export const isSafeSavedItem = (value: unknown): value is SavedItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedItem>;
  return text(item.id, 100)
    && text(item.title, 120)
    && finite(item.sqFt, 0.000001, MAX_AREA_SQ_FT)
    && (item.sqM === undefined || finite(item.sqM, 0.000001, MAX_AREA_SQ_FT))
    && finite(item.date, 0, 9_999_999_999_999)
    && ['CONVERTED', 'MEASURED', 'GPS', 'PLANNED'].includes(String(item.type))
    && Array.isArray(item.tags)
    && item.tags.length <= 20
    && item.tags.every((tag) => text(tag, 40, true))
    && (item.notes === undefined || text(item.notes, 5000, true))
    && isSource(item.source);
};

export const normalizeSafeItems = (items: unknown[]): SavedItem[] => items
  .filter(isSafeSavedItem)
  .slice(0, MAX_IMPORT_PROJECTS)
  .map((item) => ({
    ...item,
    title: item.title.trim(),
    sqM: typeof item.sqM === 'number' ? item.sqM : item.sqFt * 0.09290304,
    tags: item.tags.map((tag) => tag.trim()).filter(Boolean),
    notes: item.notes?.trim() || undefined,
  }));

export const escapeHtml = (value: unknown): string => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] ?? character));

export const safeCsvCell = (value: unknown): string => {
  const raw = String(value ?? '');
  const neutralized = /^[=+\-@]/.test(raw.trimStart()) ? `'${raw}` : raw;
  return `"${neutralized.replace(/"/g, '""')}"`;
};

export const safeDownloadName = (value: string, fallback = 'napiyo-project'): string => {
  const cleaned = value.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return cleaned || fallback;
};
