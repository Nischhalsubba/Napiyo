import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { ArrowLeft, Lock, RotateCcw, Unlock } from 'lucide-react';
import { formatDecimal, formatHillsWords, formatTeraiWords, toSqM } from '../utils/conversions';

type Side = 'north' | 'east' | 'south' | 'west';
type Unit = 'ft' | 'm';

interface VisualizeScreenProps {
  initialArea: number;
  onBack: () => void;
}

interface Plan {
  frontage: number;
  depth: number;
  roadSide: Side;
  roadWidth: number;
  northSide: Side;
  houseWidth: number;
  houseDepth: number;
  houseX: number;
  houseY: number;
  rotateHouse: boolean;
  showHouse: boolean;
  showDimensions: boolean;
  showGrid: boolean;
}

const FT_PER_M = 3.28084;
const SIDES: Side[] = ['north', 'east', 'south', 'west'];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toFeet = (value: number, unit: Unit) => unit === 'm' ? value * FT_PER_M : value;
const fromFeet = (value: number, unit: Unit) => unit === 'm' ? value / FT_PER_M : value;

const VisualizeScreen = ({ initialArea, onBack }: VisualizeScreenProps) => {
  const defaultFrontage = Math.sqrt(Math.max(initialArea, 1) * 1.5);
  const defaultDepth = initialArea / defaultFrontage;
  const [unit, setUnit] = useState<Unit>('ft');
  const [lockArea, setLockArea] = useState(true);
  const [frontage, setFrontage] = useState(defaultFrontage);
  const [depth, setDepth] = useState(defaultDepth);
  const [roadSide, setRoadSide] = useState<Side>('south');
  const [roadWidth, setRoadWidth] = useState(20);
  const [northSide, setNorthSide] = useState<Side>('north');
  const [showHouse, setShowHouse] = useState(true);
  const [houseWidth, setHouseWidth] = useState(Math.min(30, defaultFrontage * 0.5));
  const [houseDepth, setHouseDepth] = useState(Math.min(36, defaultDepth * 0.45));
  const [houseX, setHouseX] = useState(5);
  const [houseY, setHouseY] = useState(8);
  const [rotateHouse, setRotateHouse] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const renderedHouseWidth = rotateHouse ? houseDepth : houseWidth;
  const renderedHouseDepth = rotateHouse ? houseWidth : houseDepth;
  const eastGap = frontage - houseX - renderedHouseWidth;
  const southGap = depth - houseY - renderedHouseDepth;
  const plotArea = frontage * depth;
  const houseFits = !showHouse || (houseX >= 0 && houseY >= 0 && eastGap >= 0 && southGap >= 0);

  const updateFrontage = (displayValue: number) => {
    const next = Math.max(1, toFeet(displayValue, unit));
    setFrontage(next);
    if (lockArea) setDepth(initialArea / next);
  };

  const updateDepth = (displayValue: number) => {
    const next = Math.max(1, toFeet(displayValue, unit));
    setDepth(next);
    if (lockArea) setFrontage(initialArea / next);
  };

  const applyRatio = (ratio: number) => {
    const nextFrontage = Math.sqrt(Math.max(initialArea, 1) * ratio);
    const nextDepth = initialArea / nextFrontage;
    setFrontage(nextFrontage);
    setDepth(nextDepth);
    setLockArea(true);
    setHouseX(Math.max(0, (nextFrontage - renderedHouseWidth) / 2));
    setHouseY(Math.max(0, (nextDepth - renderedHouseDepth) / 2));
  };

  const reset = () => {
    setUnit('ft'); setLockArea(true); setFrontage(defaultFrontage); setDepth(defaultDepth);
    setRoadSide('south'); setRoadWidth(20); setNorthSide('north'); setShowHouse(true);
    setHouseWidth(Math.min(30, defaultFrontage * 0.5)); setHouseDepth(Math.min(36, defaultDepth * 0.45));
    setHouseX(5); setHouseY(8); setRotateHouse(false); setShowDimensions(true); setShowGrid(true);
  };

  const plan = useMemo<Plan>(() => ({
    frontage, depth, roadSide, roadWidth, northSide, houseWidth, houseDepth,
    houseX, houseY, rotateHouse, showHouse, showDimensions, showGrid,
  }), [frontage, depth, roadSide, roadWidth, northSide, houseWidth, houseDepth, houseX, houseY, rotateHouse, showHouse, showDimensions, showGrid]);

  const display = (feet: number) => `${formatDecimal(fromFeet(feet, unit), 1)} ${unit}`;

  return (
    <div className="page-shell animate-enter !max-w-[100rem]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="button-secondary focus-ring"><ArrowLeft size={16} />Back to converter</button>
        <button type="button" onClick={reset} className="button-quiet focus-ring"><RotateCcw size={16} />Reset plan</button>
      </div>

      <header className="grid gap-5 border-b border-paper-200 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="page-header !mb-0 max-w-4xl">
          <p className="eyebrow">Measured land planner</p>
          <h1 className="page-title">Customize the plot, road, direction, and house in one plan.</h1>
          <p className="page-copy">Every setting updates the drawing. Plot sides, road width, north direction, house size, position, rotation, and clear spaces can all be adjusted.</p>
        </div>
        <div className="rounded-2xl border border-paper-200 bg-white px-5 py-4 shadow-card">
          <p className="metric-label">Converted target</p>
          <p className="numeral mt-1 text-2xl font-semibold text-ink-950">{formatDecimal(initialArea)} ft²</p>
          <p className="numeral mt-1 text-xs text-ink-500">{formatDecimal(toSqM(initialArea), 3)} m²</p>
        </div>
      </header>

      <div className="mt-6 grid gap-5 2xl:grid-cols-[23rem_minmax(0,1fr)]">
        <aside className="space-y-4 2xl:max-h-[calc(100vh-6rem)] 2xl:overflow-y-auto 2xl:pr-1 scrollbar-thin">
          <ControlCard number="1" title="Plot" subtitle="Lock the converted area or edit both sides freely.">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper-100 p-1">
              <Toggle active={unit === 'ft'} label="Feet" onClick={() => setUnit('ft')} />
              <Toggle active={unit === 'm'} label="Metres" onClick={() => setUnit('m')} />
            </div>
            <button type="button" onClick={() => setLockArea((current) => !current)} className={`focus-ring flex w-full items-center justify-between rounded-xl border px-3 py-3 text-sm font-semibold ${lockArea ? 'border-leaf-200 bg-leaf-50 text-leaf-900' : 'border-paper-300 bg-white text-ink-700'}`}>
              {lockArea ? 'Converted area locked' : 'Free dimensions'}
              {lockArea ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Frontage" value={fromFeet(frontage, unit)} suffix={unit} min={1} onChange={updateFrontage} />
              <NumberField label="Depth" value={fromFeet(depth, unit)} suffix={unit} min={1} onChange={updateDepth} />
            </div>
            <div><p className="field-label">Shape presets</p><div className="grid grid-cols-4 gap-2">{[1, 1.5, 2, 3].map((ratio) => <button key={ratio} type="button" onClick={() => applyRatio(ratio)} className="focus-ring rounded-lg border border-paper-300 bg-white py-2 text-xs font-semibold text-ink-600">{ratio === 1.5 ? '3:2' : `${ratio}:1`}</button>)}</div></div>
          </ControlCard>

          <ControlCard number="2" title="Road" subtitle="Place the road on any plot edge.">
            <DirectionPicker label="Road side" value={roadSide} onChange={setRoadSide} />
            <NumberField label="Road width" value={fromFeet(roadWidth, unit)} suffix={unit} min={3} onChange={(value) => setRoadWidth(toFeet(value, unit))} />
          </ControlCard>

          <ControlCard number="3" title="Direction" subtitle="Choose which edge points north.">
            <DirectionPicker label="North edge" value={northSide} onChange={setNorthSide} />
          </ControlCard>

          <ControlCard number="4" title="House" subtitle="Resize and position the house footprint.">
            <CheckField label="Show house" checked={showHouse} onChange={setShowHouse} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Width" value={fromFeet(houseWidth, unit)} suffix={unit} min={1} disabled={!showHouse} onChange={(value) => setHouseWidth(toFeet(value, unit))} />
              <NumberField label="Depth" value={fromFeet(houseDepth, unit)} suffix={unit} min={1} disabled={!showHouse} onChange={(value) => setHouseDepth(toFeet(value, unit))} />
              <NumberField label="From west" value={fromFeet(houseX, unit)} suffix={unit} min={0} disabled={!showHouse} onChange={(value) => setHouseX(toFeet(value, unit))} />
              <NumberField label="From north" value={fromFeet(houseY, unit)} suffix={unit} min={0} disabled={!showHouse} onChange={(value) => setHouseY(toFeet(value, unit))} />
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper-100 p-1">
              <Toggle active={!rotateHouse} label="0°" onClick={() => setRotateHouse(false)} />
              <Toggle active={rotateHouse} label="90°" onClick={() => setRotateHouse(true)} />
            </div>
            <button type="button" disabled={!showHouse} onClick={() => { setHouseX(Math.max(0, (frontage - renderedHouseWidth) / 2)); setHouseY(Math.max(0, (depth - renderedHouseDepth) / 2)); }} className="button-secondary focus-ring w-full disabled:opacity-40">Center house</button>
          </ControlCard>

          <ControlCard number="5" title="Layers" subtitle="Choose what the plan displays.">
            <CheckField label="Show measurements" checked={showDimensions} onChange={setShowDimensions} />
            <CheckField label="Show grid" checked={showGrid} onChange={setShowGrid} />
          </ControlCard>
        </aside>

        <main className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-paper-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="section-title">Interactive site plan</p><p className="section-copy">The drawing is proportional to the entered measurements.</p></div>
              <span className={`status-pill ${houseFits ? 'status-positive' : 'bg-red-50 text-red-700'}`}>{houseFits ? 'House fits inside plot' : 'House crosses plot boundary'}</span>
            </div>
            <div className="bg-[#eef2ee] p-3 sm:p-5"><SitePlan plan={plan} display={display} /></div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Plot" value={`${display(frontage)} × ${display(depth)}`} sub={`${formatDecimal(plotArea)} ft²`} />
            <Stat label="Road" value={display(roadWidth)} sub={`${roadSide} edge`} />
            <Stat label="House" value={`${display(renderedHouseWidth)} × ${display(renderedHouseDepth)}`} sub={`${formatDecimal(houseWidth * houseDepth)} ft²`} />
            <Stat label="Position" value={`${display(houseX)}, ${display(houseY)}`} sub="from west, north" />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <InfoCard title="Hill system"><p className="text-sm font-semibold leading-6 text-ink-700">{formatHillsWords(initialArea)}</p></InfoCard>
            <InfoCard title="Terai system"><p className="text-sm font-semibold leading-6 text-ink-700">{formatTeraiWords(initialArea)}</p></InfoCard>
            <InfoCard title="Plan checks"><dl className="space-y-3"><CheckRow label="Area difference" value={`${plotArea - initialArea >= 0 ? '+' : ''}${formatDecimal(plotArea - initialArea)} ft²`} /><CheckRow label="East clearance" value={display(eastGap)} /><CheckRow label="South clearance" value={display(southGap)} /></dl></InfoCard>
          </section>

          <p className="rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-3 text-xs leading-5 text-ink-600">This is a visual planning tool, not an approved cadastral or architectural drawing.</p>
        </main>
      </div>
    </div>
  );
};

const SitePlan = ({ plan, display }: { plan: Plan; display: (feet: number) => string }) => {
  const width = 1040, height = 720, pad = 120;
  const roadPx = clamp(plan.roadWidth * 2.2, 42, 110);
  const horizontalRoad = plan.roadSide === 'north' || plan.roadSide === 'south';
  const availableW = width - pad * 2 - (horizontalRoad ? 0 : roadPx);
  const availableH = height - pad * 2 - (horizontalRoad ? roadPx : 0);
  const scale = Math.min(availableW / Math.max(plan.frontage, 1), availableH / Math.max(plan.depth, 1));
  const plotW = plan.frontage * scale, plotH = plan.depth * scale;
  const plotX = pad + (plan.roadSide === 'west' ? roadPx : 0) + (availableW - plotW) / 2;
  const plotY = pad + (plan.roadSide === 'north' ? roadPx : 0) + (availableH - plotH) / 2;
  const road = plan.roadSide === 'north' ? { x: 0, y: 0, w: width, h: roadPx } : plan.roadSide === 'south' ? { x: 0, y: height - roadPx, w: width, h: roadPx } : plan.roadSide === 'west' ? { x: 0, y: 0, w: roadPx, h: height } : { x: width - roadPx, y: 0, w: roadPx, h: height };
  const houseRenderedWidth = plan.rotateHouse ? plan.houseDepth : plan.houseWidth;
  const houseRenderedDepth = plan.rotateHouse ? plan.houseWidth : plan.houseDepth;
  const houseX = plotX + plan.houseX * scale, houseY = plotY + plan.houseY * scale;
  const houseW = houseRenderedWidth * scale, houseH = houseRenderedDepth * scale;
  const northRotation = { north: 0, east: 90, south: 180, west: -90 }[plan.northSide];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full rounded-[1.5rem] border border-white/70 bg-[#edf2e9] shadow-[0_24px_70px_rgba(27,54,42,0.14)]" role="img" aria-label="Customizable measured land plan">
      <defs><pattern id="plan-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#cbd7c8" strokeWidth="1" /></pattern><linearGradient id="land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#92c184" /><stop offset="1" stopColor="#6ea668" /></linearGradient></defs>
      <rect width={width} height={height} fill="#edf2e9" />{plan.showGrid && <rect width={width} height={height} fill="url(#plan-grid)" opacity=".65" />}
      <rect x={road.x} y={road.y} width={road.w} height={road.h} fill="#3d4547" />
      <text x={road.x + road.w / 2} y={road.y + road.h / 2 + 5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" transform={!horizontalRoad ? `rotate(-90 ${road.x + road.w / 2} ${road.y + road.h / 2})` : undefined}>ROAD · {display(plan.roadWidth)}</text>
      <rect x={plotX} y={plotY} width={plotW} height={plotH} rx="8" fill="url(#land)" stroke="#173f2e" strokeWidth="5" />
      <rect x={plotX + 8} y={plotY + 8} width={Math.max(0, plotW - 16)} height={Math.max(0, plotH - 16)} rx="5" fill="none" stroke="#f8f2dd" strokeWidth="2" strokeDasharray="10 8" />
      {plan.showHouse && <g><rect x={houseX + 8} y={houseY + 10} width={houseW} height={houseH} rx="6" fill="#17352a" opacity=".18" /><rect x={houseX} y={houseY} width={houseW} height={houseH} rx="6" fill="#f7f1e6" stroke="#6e4d3d" strokeWidth="3" /><rect x={houseX + houseW * .08} y={houseY + houseH * .1} width={houseW * .84} height={houseH * .22} rx="4" fill="#b75d43" /></g>}
      {plan.showDimensions && <><Dimension x1={plotX} y1={plotY - 34} x2={plotX + plotW} y2={plotY - 34} label={display(plan.frontage)} /><Dimension x1={plotX - 36} y1={plotY} x2={plotX - 36} y2={plotY + plotH} label={display(plan.depth)} vertical />{plan.showHouse && <><Dimension x1={houseX} y1={houseY + houseH + 28} x2={houseX + houseW} y2={houseY + houseH + 28} label={display(houseRenderedWidth)} /><Dimension x1={houseX + houseW + 28} y1={houseY} x2={houseX + houseW + 28} y2={houseY + houseH} label={display(houseRenderedDepth)} vertical /></>}</>}
      <g transform={`translate(955 78) rotate(${northRotation})`}><circle r="32" fill="#fff" stroke="#d5c9b7" strokeWidth="2" /><path d="M0 -24L11 10L0 4L-11 10Z" fill="#d1692f" /><text x="0" y="24" textAnchor="middle" fill="#17352a" fontSize="13" fontWeight="900">N</text></g>
    </svg>
  );
};

const Dimension = ({ x1, y1, x2, y2, label, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return <g stroke="#17352a" fill="#17352a" fontFamily="Inter,system-ui" fontWeight="800"><line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" /><rect x={mx - (vertical ? 13 : 44)} y={my - (vertical ? 44 : 18)} width={vertical ? 26 : 88} height={vertical ? 88 : 26} rx="13" fill="#fff" stroke="#d5c9b7" /><text x={mx} y={my + 4} textAnchor="middle" fontSize="12" transform={vertical ? `rotate(-90 ${mx} ${my})` : undefined}>{label}</text></g>;
};

const ControlCard = ({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: ReactNode }) => <section className="panel p-5"><div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-950 text-xs font-semibold text-white">{number}</span><div><h2 className="text-base font-semibold text-ink-950">{title}</h2><p className="mt-1 text-xs leading-5 text-ink-500">{subtitle}</p></div></div><div className="mt-4 space-y-4">{children}</div></section>;
const NumberField = ({ label, value, suffix, min, onChange, disabled = false }: { label: string; value: number; suffix: string; min: number; onChange: (value: number) => void; disabled?: boolean }) => <label className="block"><span className="field-label">{label}</span><div className="relative"><input type="number" value={Number(value.toFixed(2))} min={min} step="0.1" disabled={disabled} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value) || 0)} className="field numeral pr-12 font-semibold disabled:opacity-45" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400">{suffix}</span></div></label>;
const DirectionPicker = ({ label, value, onChange }: { label: string; value: Side; onChange: (value: Side) => void }) => <div><p className="field-label">{label}</p><div className="grid grid-cols-4 gap-2">{SIDES.map((side) => <button key={side} type="button" onClick={() => onChange(side)} className={`focus-ring rounded-lg border px-2 py-2 text-xs font-semibold ${value === side ? 'border-ink-950 bg-ink-950 text-white' : 'border-paper-300 bg-white text-ink-600'}`}>{side[0].toUpperCase()}</button>)}</div></div>;
const CheckField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => <label className="flex items-center justify-between gap-3 rounded-xl bg-paper-100 px-3 py-3 text-sm font-semibold text-ink-700"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)} className="h-5 w-5 accent-[#1c613d]" /></label>;
const Toggle = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => <button type="button" onClick={onClick} className={`focus-ring flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${active ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500'}`}>{label}</button>;
const Stat = ({ label, value, sub }: { label: string; value: string; sub: string }) => <div className="panel p-4"><p className="metric-label">{label}</p><p className="numeral mt-2 text-lg font-semibold text-ink-950">{value}</p><p className="mt-1 text-xs text-ink-400">{sub}</p></div>;
const InfoCard = ({ title, children }: { title: string; children: ReactNode }) => <section className="panel p-5"><p className="section-title">{title}</p><div className="mt-4 space-y-3">{children}</div></section>;
const CheckRow = ({ label, value }: { label: string; value: string }) => <div className="flex items-center justify-between gap-4 text-sm"><dt className="font-medium text-ink-500">{label}</dt><dd className="numeral text-right font-semibold text-ink-950">{value}</dd></div>;

export default VisualizeScreen;
