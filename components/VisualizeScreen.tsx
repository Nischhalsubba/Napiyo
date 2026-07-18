import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { formatDecimal, formatHillsWords, formatTeraiWords, toSqM } from '../utils/conversions';

type Side = 'north' | 'east' | 'south' | 'west';
type Unit = 'ft' | 'm';

interface VisualizeScreenProps {
  initialArea: number;
  onBack: () => void;
}

interface PlanProps {
  frontageFt: number;
  depthFt: number;
  roadSide: Side;
  roadWidthFt: number;
  northSide: Side;
  houseWidthFt: number;
  houseDepthFt: number;
  frontSetbackFt: number;
  rearSetbackFt: number;
  leftSetbackFt: number;
  rightSetbackFt: number;
  showHouse: boolean;
  showDimensions: boolean;
}

const FT_PER_M = 3.28084;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toFeet = (value: number, unit: Unit) => unit === 'm' ? value * FT_PER_M : value;
const fromFeet = (value: number, unit: Unit) => unit === 'm' ? value / FT_PER_M : value;

const VisualizeScreen = ({ initialArea, onBack }: VisualizeScreenProps) => {
  const defaultFrontage = Math.sqrt(Math.max(initialArea, 1) * 1.5);
  const defaultDepth = initialArea / defaultFrontage;
  const [unit, setUnit] = useState<Unit>('ft');
  const [frontageFt, setFrontageFt] = useState(defaultFrontage);
  const [depthFt, setDepthFt] = useState(defaultDepth);
  const [roadSide, setRoadSide] = useState<Side>('south');
  const [roadWidthFt, setRoadWidthFt] = useState(20);
  const [northSide, setNorthSide] = useState<Side>('north');
  const [houseWidthFt, setHouseWidthFt] = useState(Math.min(30, defaultFrontage * 0.55));
  const [houseDepthFt, setHouseDepthFt] = useState(Math.min(36, defaultDepth * 0.45));
  const [frontSetbackFt, setFrontSetbackFt] = useState(10);
  const [rearSetbackFt, setRearSetbackFt] = useState(8);
  const [leftSetbackFt, setLeftSetbackFt] = useState(5);
  const [rightSetbackFt, setRightSetbackFt] = useState(5);
  const [showHouse, setShowHouse] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  const plotArea = frontageFt * depthFt;
  const areaDelta = plotArea - initialArea;
  const usableWidth = Math.max(0, frontageFt - leftSetbackFt - rightSetbackFt);
  const usableDepth = Math.max(0, depthFt - frontSetbackFt - rearSetbackFt);
  const houseFits = houseWidthFt <= usableWidth && houseDepthFt <= usableDepth;

  const updateFrontage = (displayValue: number) => {
    const next = Math.max(1, toFeet(displayValue, unit));
    setFrontageFt(next);
    setDepthFt(initialArea / next);
  };

  const updateDepth = (displayValue: number) => {
    const next = Math.max(1, toFeet(displayValue, unit));
    setDepthFt(next);
    setFrontageFt(initialArea / next);
  };

  const reset = () => {
    setFrontageFt(defaultFrontage);
    setDepthFt(defaultDepth);
    setRoadSide('south');
    setRoadWidthFt(20);
    setNorthSide('north');
    setHouseWidthFt(Math.min(30, defaultFrontage * 0.55));
    setHouseDepthFt(Math.min(36, defaultDepth * 0.45));
    setFrontSetbackFt(10);
    setRearSetbackFt(8);
    setLeftSetbackFt(5);
    setRightSetbackFt(5);
    setShowHouse(true);
    setShowDimensions(true);
  };

  const plan = useMemo<PlanProps>(() => ({
    frontageFt,
    depthFt,
    roadSide,
    roadWidthFt,
    northSide,
    houseWidthFt,
    houseDepthFt,
    frontSetbackFt,
    rearSetbackFt,
    leftSetbackFt,
    rightSetbackFt,
    showHouse,
    showDimensions,
  }), [frontageFt, depthFt, roadSide, roadWidthFt, northSide, houseWidthFt, houseDepthFt, frontSetbackFt, rearSetbackFt, leftSetbackFt, rightSetbackFt, showHouse, showDimensions]);

  const formatLength = (feet: number) => `${formatDecimal(fromFeet(feet, unit), 1)} ${unit}`;

  return (
    <div className="page-shell animate-enter !max-w-[96rem]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="button-secondary focus-ring"><ArrowLeft size={16} aria-hidden="true" />Back to converter</button>
        <button type="button" onClick={reset} className="button-quiet focus-ring"><RotateCcw size={16} aria-hidden="true" />Reset plan</button>
      </div>

      <header className="flex flex-col gap-5 border-b border-paper-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="page-header !mb-0">
          <p className="eyebrow">Land planner</p>
          <h1 className="page-title">Plan the footprint, not just the area.</h1>
          <p className="page-copy">Adjust the plot, road, direction, house size, and setbacks. The drawing updates while the target land area stays fixed.</p>
        </div>
        <div className="rounded-xl border border-paper-200 bg-white px-4 py-3 shadow-card">
          <p className="metric-label">Target area</p>
          <p className="numeral mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink-950">{formatDecimal(initialArea)} ft²</p>
          <p className="numeral mt-0.5 text-xs font-medium text-ink-500">{formatDecimal(toSqM(initialArea))} m²</p>
        </div>
      </header>

      <div className="mt-6 grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="scrollbar-thin space-y-4 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
          <ControlCard title="Plot" subtitle="Changing one side recalculates the other.">
            <div className="inline-flex rounded-lg bg-paper-100 p-1">
              <Toggle active={unit === 'ft'} label="Feet" onClick={() => setUnit('ft')} />
              <Toggle active={unit === 'm'} label="Metres" onClick={() => setUnit('m')} />
            </div>
            <NumberField label="Frontage" value={fromFeet(frontageFt, unit)} suffix={unit} min={1} onChange={updateFrontage} />
            <NumberField label="Depth" value={fromFeet(depthFt, unit)} suffix={unit} min={1} onChange={updateDepth} />
          </ControlCard>

          <ControlCard title="Road" subtitle="Choose the boundary that touches the road.">
            <SelectField label="Road side" value={roadSide} options={['north', 'east', 'south', 'west']} onChange={(value) => setRoadSide(value as Side)} />
            <NumberField label="Road width" value={fromFeet(roadWidthFt, unit)} suffix={unit} min={3} onChange={(value) => setRoadWidthFt(toFeet(value, unit))} />
          </ControlCard>

          <ControlCard title="Orientation" subtitle="Set which edge of the drawing points north.">
            <SelectField label="North edge" value={northSide} options={['north', 'east', 'south', 'west']} onChange={(value) => setNorthSide(value as Side)} />
          </ControlCard>

          <ControlCard title="House" subtitle="Set the building footprint inside the plot.">
            <CheckField label="Show house" checked={showHouse} onChange={setShowHouse} />
            <NumberField label="House width" value={fromFeet(houseWidthFt, unit)} suffix={unit} min={1} disabled={!showHouse} onChange={(value) => setHouseWidthFt(toFeet(value, unit))} />
            <NumberField label="House depth" value={fromFeet(houseDepthFt, unit)} suffix={unit} min={1} disabled={!showHouse} onChange={(value) => setHouseDepthFt(toFeet(value, unit))} />
          </ControlCard>

          <ControlCard title="Setbacks" subtitle="Distance between the house and each plot edge.">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Front" value={fromFeet(frontSetbackFt, unit)} suffix={unit} min={0} onChange={(value) => setFrontSetbackFt(toFeet(value, unit))} />
              <NumberField label="Rear" value={fromFeet(rearSetbackFt, unit)} suffix={unit} min={0} onChange={(value) => setRearSetbackFt(toFeet(value, unit))} />
              <NumberField label="Left" value={fromFeet(leftSetbackFt, unit)} suffix={unit} min={0} onChange={(value) => setLeftSetbackFt(toFeet(value, unit))} />
              <NumberField label="Right" value={fromFeet(rightSetbackFt, unit)} suffix={unit} min={0} onChange={(value) => setRightSetbackFt(toFeet(value, unit))} />
            </div>
            <CheckField label="Show dimensions" checked={showDimensions} onChange={setShowDimensions} />
          </ControlCard>
        </aside>

        <main className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-ink-950">Site plan</p>
                <p className="mt-1 text-xs text-ink-500">Dimensions are proportional to the current settings.</p>
              </div>
              <span className={`status-pill ${houseFits ? 'status-positive' : 'bg-red-50 text-red-700'}`}>{houseFits ? 'House fits inside setbacks' : 'House exceeds buildable area'}</span>
            </div>
            <div className="bg-[#eef2ee] p-3 sm:p-5"><SitePlan plan={plan} /></div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Frontage" value={formatLength(frontageFt)} sub="plot edge" />
            <Stat label="Depth" value={formatLength(depthFt)} sub="plot edge" />
            <Stat label="Road" value={formatLength(roadWidthFt)} sub={`${roadSide} side`} />
            <Stat label="House" value={`${formatLength(houseWidthFt)} × ${formatLength(houseDepthFt)}`} sub={`${formatDecimal(houseWidthFt * houseDepthFt)} ft²`} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <p className="section-title">Local unit summary</p>
              <p className="mt-4 text-sm font-semibold leading-6 text-ink-700">{formatHillsWords(initialArea)}</p>
              <p className="mt-3 border-t border-paper-200 pt-3 text-sm font-semibold leading-6 text-ink-700">{formatTeraiWords(initialArea)}</p>
            </div>
            <div className="panel p-5">
              <p className="section-title">Plan checks</p>
              <dl className="mt-4 space-y-3 text-sm">
                <CheckRow label="Current plot area" value={`${formatDecimal(plotArea)} ft²`} />
                <CheckRow label="Difference from target" value={`${areaDelta >= 0 ? '+' : ''}${formatDecimal(areaDelta)} ft²`} />
                <CheckRow label="Buildable width" value={formatLength(usableWidth)} />
                <CheckRow label="Buildable depth" value={formatLength(usableDepth)} />
              </dl>
            </div>
          </section>

          <p className="rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-3 text-xs leading-5 text-ink-600">This is an early planning view. Confirm road boundaries, orientation, setbacks, building rules, and official dimensions before making decisions.</p>
        </main>
      </div>
    </div>
  );
};

const SitePlan = ({ plan }: { plan: PlanProps }) => {
  const canvasW = 960;
  const canvasH = 680;
  const pad = 115;
  const roadPx = clamp(plan.roadWidthFt * 2.2, 40, 105);
  const horizontalRoad = plan.roadSide === 'north' || plan.roadSide === 'south';
  const availableW = canvasW - pad * 2 - (horizontalRoad ? 0 : roadPx);
  const availableH = canvasH - pad * 2 - (horizontalRoad ? roadPx : 0);
  const scale = Math.min(availableW / plan.frontageFt, availableH / plan.depthFt);
  const plotW = plan.frontageFt * scale;
  const plotH = plan.depthFt * scale;
  const baseX = pad + (plan.roadSide === 'west' ? roadPx : 0) + (availableW - plotW) / 2;
  const baseY = pad + (plan.roadSide === 'north' ? roadPx : 0) + (availableH - plotH) / 2;
  const road = plan.roadSide === 'north'
    ? { x: 0, y: 0, w: canvasW, h: roadPx }
    : plan.roadSide === 'south'
      ? { x: 0, y: canvasH - roadPx, w: canvasW, h: roadPx }
      : plan.roadSide === 'west'
        ? { x: 0, y: 0, w: roadPx, h: canvasH }
        : { x: canvasW - roadPx, y: 0, w: roadPx, h: canvasH };
  const houseX = baseX + plan.leftSetbackFt * scale;
  const houseY = baseY + plan.frontSetbackFt * scale;
  const houseW = plan.houseWidthFt * scale;
  const houseH = plan.houseDepthFt * scale;
  const buildX = baseX + plan.leftSetbackFt * scale;
  const buildY = baseY + plan.frontSetbackFt * scale;
  const buildW = Math.max(0, plotW - (plan.leftSetbackFt + plan.rightSetbackFt) * scale);
  const buildH = Math.max(0, plotH - (plan.frontSetbackFt + plan.rearSetbackFt) * scale);
  const northRotation = { north: 0, east: 90, south: 180, west: -90 }[plan.northSide];

  return (
    <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="block h-auto w-full rounded-xl border border-paper-300 bg-white" role="img" aria-label="Customizable site plan with road, dimensions, direction, house and setbacks">
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#dce4dd" strokeWidth="1" /></pattern>
        <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0d1712" floodOpacity=".14" /></filter>
      </defs>
      <rect width={canvasW} height={canvasH} fill="#f8faf8" />
      <rect width={canvasW} height={canvasH} fill="url(#grid)" opacity=".65" />
      <rect x={road.x} y={road.y} width={road.w} height={road.h} fill="#323b37" />
      <RoadMarkings road={road} horizontal={horizontalRoad} />
      <rect x={baseX} y={baseY} width={plotW} height={plotH} rx="6" fill="#9bc99d" filter="url(#shadow)" />
      <rect x={baseX} y={baseY} width={plotW} height={plotH} rx="6" fill="none" stroke="#145d4c" strokeWidth="4" />
      <rect x={buildX} y={buildY} width={buildW} height={buildH} rx="4" fill="none" stroke="#fff8ef" strokeWidth="2" strokeDasharray="9 7" />
      {plan.showHouse && (
        <g>
          <rect x={houseX} y={houseY} width={houseW} height={houseH} rx="4" fill="#f5eee5" stroke="#76523e" strokeWidth="3" />
          <path d={`M${houseX - 6} ${houseY + 15}L${houseX + houseW / 2} ${houseY - 18}L${houseX + houseW + 6} ${houseY + 15}Z`} fill="#bd6a4c" />
          <rect x={houseX + houseW * .42} y={houseY + houseH * .58} width={houseW * .16} height={houseH * .42} fill="#76523e" />
        </g>
      )}
      {[[baseX, baseY], [baseX + plotW, baseY], [baseX, baseY + plotH], [baseX + plotW, baseY + plotH]].map(([x, y], index) => <circle key={index} cx={x} cy={y} r="6" fill="#fff" stroke="#145d4c" strokeWidth="3" />)}
      {plan.showDimensions && (
        <>
          <Dimension x1={baseX} y1={baseY - 30} x2={baseX + plotW} y2={baseY - 30} label={`${formatDecimal(plan.frontageFt, 1)} ft`} />
          <Dimension x1={baseX - 32} y1={baseY} x2={baseX - 32} y2={baseY + plotH} label={`${formatDecimal(plan.depthFt, 1)} ft`} vertical />
          {plan.showHouse && (
            <>
              <Dimension x1={houseX} y1={houseY + houseH + 24} x2={houseX + houseW} y2={houseY + houseH + 24} label={`${formatDecimal(plan.houseWidthFt, 1)} ft`} />
              <Dimension x1={houseX + houseW + 25} y1={houseY} x2={houseX + houseW + 25} y2={houseY + houseH} label={`${formatDecimal(plan.houseDepthFt, 1)} ft`} vertical />
            </>
          )}
        </>
      )}
      <g transform={`translate(885 72) rotate(${northRotation})`}><path d="M0 -32L12 9L0 3L-12 9Z" fill="#df7624" /><text x="0" y="29" textAnchor="middle" fill="#19251f" fontSize="13" fontWeight="700">N</text></g>
      <text x={road.x + road.w / 2} y={road.y + road.h / 2 + 5} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" transform={!horizontalRoad ? `rotate(-90 ${road.x + road.w / 2} ${road.y + road.h / 2})` : undefined}>ROAD · {formatDecimal(plan.roadWidthFt, 1)} FT</text>
    </svg>
  );
};

const RoadMarkings = ({ road, horizontal }: { road: { x: number; y: number; w: number; h: number }; horizontal: boolean }) => horizontal
  ? <g>{Array.from({ length: 8 }, (_, index) => <rect key={index} x={40 + index * 120} y={road.y + road.h / 2 - 2} width="65" height="4" rx="2" fill="#ffd5a3" />)}</g>
  : <g>{Array.from({ length: 6 }, (_, index) => <rect key={index} x={road.x + road.w / 2 - 2} y={40 + index * 105} width="4" height="58" rx="2" fill="#ffd5a3" />)}</g>;

const Dimension = ({ x1, y1, x2, y2, label, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) => (
  <g stroke="#25332d" fill="#25332d" fontFamily="Inter,system-ui" fontWeight="650">
    <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" />
    <line x1={x1} y1={y1 - 5} x2={x1} y2={y1 + 5} />
    <line x1={x2} y1={y2 - 5} x2={x2} y2={y2 + 5} />
    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" fontSize="12" transform={vertical ? `rotate(-90 ${(x1 + x2) / 2} ${(y1 + y2) / 2})` : undefined}>{label}</text>
  </g>
);

const ControlCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <section className="panel p-5">
    <h2 className="text-base font-semibold tracking-[-0.015em] text-ink-950">{title}</h2>
    <p className="mt-1 text-xs leading-5 text-ink-500">{subtitle}</p>
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const NumberField = ({ label, value, suffix, min, onChange, disabled = false }: { label: string; value: number; suffix: string; min: number; onChange: (value: number) => void; disabled?: boolean }) => (
  <label className="block">
    <span className="field-label">{label}</span>
    <div className="relative">
      <input type="number" value={Number(value.toFixed(2))} min={min} step="0.1" disabled={disabled} onChange={(event) => onChange(Number(event.target.value) || 0)} className="field numeral pr-12 font-semibold" />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400">{suffix}</span>
    </div>
  </label>
);

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) => (
  <label className="block">
    <span className="field-label">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="select-field font-semibold capitalize">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
  </label>
);

const CheckField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <label className="flex items-center justify-between gap-3 rounded-xl border border-paper-200 bg-paper-100 px-3 py-3 text-sm font-semibold text-ink-700">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#145d4c]" />
  </label>
);

const Toggle = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`focus-ring rounded-md px-3 py-1.5 text-xs font-semibold ${active ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}>{label}</button>
);

const Stat = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="metric-card">
    <p className="metric-label">{label}</p>
    <p className="numeral mt-2 text-lg font-semibold tracking-[-0.02em] text-ink-950">{value}</p>
    <p className="mt-1 text-xs font-medium text-ink-400">{sub}</p>
  </div>
);

const CheckRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="font-medium text-ink-500">{label}</dt>
    <dd className="numeral text-right font-semibold text-ink-950">{value}</dd>
  </div>
);

export default VisualizeScreen;
