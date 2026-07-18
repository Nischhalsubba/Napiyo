import { SQ_FT_PER_SQ_M, UNITS } from '../constants';
import { Point } from '../types';

export interface HillsInput { ropani: number; aana: number; paisa: number; daam: number; }
export interface TeraiInput { bigha: number; kattha: number; dhur: number; }
export interface ParsedArea { sqFt: number; recognized: boolean; interpretation: string; matchedUnits: string[]; }

const EPSILON = 1e-9;
const NEPALI_DIGITS: Record<string, string> = { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' };

export const normalizeDigits = (value: string): string => value.replace(/[०-९]/g, (digit) => NEPALI_DIGITS[digit] ?? digit);

export const toSqFt = (value: number, unitId: string): number => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value * (UNITS[unitId]?.sqFtFactor ?? 1);
};

export const fromSqFt = (sqFt: number, unitId: string): number => {
  if (!Number.isFinite(sqFt) || sqFt < 0) return 0;
  return sqFt / (UNITS[unitId]?.sqFtFactor ?? 1);
};

export const hillsToSqFt = ({ ropani, aana, paisa, daam }: HillsInput): number =>
  toSqFt(ropani, 'ROPANI') + toSqFt(aana, 'AANA') + toSqFt(paisa, 'PAISA') + toSqFt(daam, 'DAAM');

export const teraiToSqFt = ({ bigha, kattha, dhur }: TeraiInput): number =>
  toSqFt(bigha, 'BIGHA') + toSqFt(kattha, 'KATTHA') + toSqFt(dhur, 'DHUR');

export const toSqM = (sqFt: number): number => sqFt / SQ_FT_PER_SQ_M;

export const parseAreaInput = (value: string): number => {
  const normalized = normalizeDigits(value).replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const UNIT_ALIASES: Array<{ id: string; label: string; aliases: string[] }> = [
  { id: 'ROPANI', label: 'Ropani', aliases: ['ropani','rop','रोपनी'] },
  { id: 'AANA', label: 'Aana', aliases: ['aana','ana','आना'] },
  { id: 'PAISA', label: 'Paisa', aliases: ['paisa','पैसा'] },
  { id: 'DAAM', label: 'Daam', aliases: ['daam','dam','दाम'] },
  { id: 'BIGHA', label: 'Bigha', aliases: ['bigha','biga','बिघा'] },
  { id: 'KATTHA', label: 'Kattha', aliases: ['kattha','katha','कट्ठा','कठ्ठा'] },
  { id: 'DHUR', label: 'Dhur', aliases: ['dhur','धुर'] },
  { id: 'SQFT', label: 'Square feet', aliases: ['sq ft','sqft','square feet','square foot','ft2','ft²','वर्ग फिट'] },
  { id: 'SQM', label: 'Square metres', aliases: ['sq m','sqm','square metre','square meter','square metres','square meters','m2','m²','वर्ग मिटर'] },
  { id: 'SQYD', label: 'Square yards', aliases: ['sq yd','sqyd','square yard','square yards','yd2','yd²'] },
  { id: 'ACRE', label: 'Acres', aliases: ['acre','acres','एकर'] },
  { id: 'HECTARE', label: 'Hectares', aliases: ['hectare','hectares','ha','हेक्टर'] },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parseSmartArea = (raw: string): ParsedArea => {
  const text = normalizeDigits(raw).toLowerCase().replace(/,/g, '').replace(/–|—/g, '-').trim();
  if (!text) return { sqFt: 0, recognized: false, interpretation: 'Enter an area to begin.', matchedUnits: [] };

  const compact = text.match(/^\s*(\d+(?:\.\d+)?)\s*[-/]\s*(\d+(?:\.\d+)?)\s*[-/]\s*(\d+(?:\.\d+)?)(?:\s*[-/]\s*(\d+(?:\.\d+)?))?\s*$/);
  if (compact) {
    const values = compact.slice(1).filter(Boolean).map(Number);
    if (values.length === 4) {
      const sqFt = hillsToSqFt({ ropani: values[0], aana: values[1], paisa: values[2], daam: values[3] });
      return { sqFt, recognized: true, interpretation: `${values[0]} Ropani · ${values[1]} Aana · ${values[2]} Paisa · ${values[3]} Daam`, matchedUnits: ['ROPANI','AANA','PAISA','DAAM'] };
    }
    const sqFt = teraiToSqFt({ bigha: values[0], kattha: values[1], dhur: values[2] });
    return { sqFt, recognized: true, interpretation: `${values[0]} Bigha · ${values[1]} Kattha · ${values[2]} Dhur`, matchedUnits: ['BIGHA','KATTHA','DHUR'] };
  }

  let sqFt = 0;
  const parts: string[] = [];
  const matchedUnits: string[] = [];
  for (const unit of UNIT_ALIASES) {
    const aliases = [...unit.aliases].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');
    const expression = new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*(?:${aliases})(?![a-z])`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = expression.exec(text))) {
      const amount = Number(match[1]);
      if (Number.isFinite(amount) && amount >= 0) {
        sqFt += toSqFt(amount, unit.id);
        parts.push(`${amount} ${unit.label}`);
        matchedUnits.push(unit.id);
      }
    }
  }

  if (parts.length) return { sqFt, recognized: true, interpretation: parts.join(' + '), matchedUnits };

  const numberOnly = Number(text);
  if (Number.isFinite(numberOnly) && numberOnly >= 0) {
    return { sqFt: numberOnly, recognized: true, interpretation: `${numberOnly} square feet (default)`, matchedUnits: ['SQFT'] };
  }

  return { sqFt: 0, recognized: false, interpretation: 'Could not identify the units. Try “1 ropani 2 aana”, “2 kattha 5 dhur”, “500 m²”, or “1-2-0-0”.', matchedUnits: [] };
};

export const formatDecimal = (value: number, decimals = 2): string => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: 0 }).format(safeValue);
};

export const formatNepaliNumber = (value: number, decimals = 2): string =>
  new Intl.NumberFormat('ne-NP', { maximumFractionDigits: decimals, minimumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

const cleanRemainder = (value: number): number => {
  const rounded = Math.abs(value - Math.round(value)) < EPSILON ? Math.round(value) : value;
  return Math.max(0, rounded);
};

export const getHillsBreakdown = (sqFt: number) => {
  let remainingDaam = Math.max(0, sqFt) / UNITS.DAAM.sqFtFactor;
  const ropani = Math.floor((remainingDaam + EPSILON) / 256); remainingDaam -= ropani * 256;
  const aana = Math.floor((remainingDaam + EPSILON) / 16); remainingDaam -= aana * 16;
  const paisa = Math.floor((remainingDaam + EPSILON) / 4);
  const daam = cleanRemainder(remainingDaam - paisa * 4);
  return { ropani, aana, paisa, daam };
};

export const getTeraiBreakdown = (sqFt: number) => {
  let remainingDhur = Math.max(0, sqFt) / UNITS.DHUR.sqFtFactor;
  const bigha = Math.floor((remainingDhur + EPSILON) / 400); remainingDhur -= bigha * 400;
  const kattha = Math.floor((remainingDhur + EPSILON) / 20);
  const dhur = cleanRemainder(remainingDhur - kattha * 20);
  return { bigha, kattha, dhur };
};

export const formatHills = (sqFt: number): string => { const v = getHillsBreakdown(sqFt); return `${v.ropani}-${v.aana}-${v.paisa}-${formatDecimal(v.daam, 3)}`; };
export const formatTerai = (sqFt: number): string => { const v = getTeraiBreakdown(sqFt); return `${v.bigha}-${v.kattha}-${formatDecimal(v.dhur, 3)}`; };
export const formatHillsWords = (sqFt: number): string => { const v = getHillsBreakdown(sqFt); return `${formatDecimal(v.ropani,0)} Ropani · ${formatDecimal(v.aana,0)} Aana · ${formatDecimal(v.paisa,0)} Paisa · ${formatDecimal(v.daam,3)} Daam`; };
export const formatTeraiWords = (sqFt: number): string => { const v = getTeraiBreakdown(sqFt); return `${formatDecimal(v.bigha,0)} Bigha · ${formatDecimal(v.kattha,0)} Kattha · ${formatDecimal(v.dhur,3)} Dhur`; };

export const getAllConversions = (sqFt: number) => Object.values(UNITS).map((unit) => ({ id: unit.id, label: unit.name, value: fromSqFt(sqFt, unit.id), suffix: unit.shortName }));

export const calculatePolygonAreaPx = (points: Point[]): number => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    area += points[index].x * points[nextIndex].y - points[nextIndex].x * points[index].y;
  }
  return Math.abs(area / 2);
};

export const calculatePolygonPerimeterPx = (points: Point[]): number => {
  if (points.length < 2) return 0;
  return points.reduce((total, point, index) => total + distance(point, points[(index + 1) % points.length]), 0);
};

export const distance = (first: Point, second: Point): number => Math.hypot(second.x - first.x, second.y - first.y);
