import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { AlertTriangle, ArrowLeft, Download, Plus, Redo2, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react';
import { CardinalSide, PlanBuilding, PlannerProject, Point, SavedItem } from '../types';
import { calculatePolygonAreaPx, formatDecimal, formatHillsWords, formatTeraiWords, toSqM } from '../utils/conversions';

interface Props {
  initialArea: number;
  initialProject?: SavedItem | null;
  onBack: () => void;
  onSave?: (item: SavedItem) => boolean;
  notify?: (message: string) => void;
}

type Unit = 'ft' | 'm';
type Snapshot = { frontage: number; depth: number; insets: number[]; roadSide: CardinalSide; roadWidth: number; northSide: CardinalSide; buildings: PlanBuilding[] };
const FT_PER_M = 3.28084;
const SIDES: CardinalSide[] = ['north', 'east', 'south', 'west'];
const toFeet = (value: number, unit: Unit) => unit === 'm' ? value * FT_PER_M : value;
const fromFeet = (value: number, unit: Unit) => unit === 'm' ? value / FT_PER_M : value;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const id = () => crypto.randomUUID();

const VisualizeScreen = ({ initialArea, initialProject = null, onBack, onSave, notify }: Props) => {
  const restored = initialProject?.type === 'PLANNED' ? initialProject.source?.planner : undefined;
  const fallbackFrontage = Math.sqrt(Math.max(initialArea, 1) * 1.5);
  const fallbackDepth = initialArea / fallbackFrontage;
  const defaultFrontage = restored?.frontage ?? fallbackFrontage;
  const defaultDepth = restored?.depth ?? fallbackDepth;
  const restoredPoints = restored?.plotPoints;
  const restoredInsets = restoredPoints?.length === 4
    ? [restoredPoints[0].x, defaultFrontage - restoredPoints[1].x, defaultFrontage - restoredPoints[2].x, restoredPoints[3].x]
    : [0, 0, 0, 0];
  const defaultBuildings = restored?.buildings?.length ? restored.buildings.map((building) => ({ ...building })) : [{ id: id(), name: 'House', width: Math.min(30, defaultFrontage * .5), depth: Math.min(36, defaultDepth * .45), x: 5, y: 8, rotation: 0 as const }];
  const [unit, setUnit] = useState<Unit>('ft');
  const [frontage, setFrontage] = useState(defaultFrontage);
  const [depth, setDepth] = useState(defaultDepth);
  const [insets, setInsets] = useState(restoredInsets);
  const [roadSide, setRoadSide] = useState<CardinalSide>(restored?.roadSide ?? 'south');
  const [roadWidth, setRoadWidth] = useState(restored?.roadWidth ?? 20);
  const [northSide, setNorthSide] = useState<CardinalSide>(restored?.northSide ?? 'north');
  const [buildings, setBuildings] = useState<PlanBuilding[]>(defaultBuildings);
  const [selectedId, setSelectedId] = useState<string | null>(defaultBuildings[0]?.id ?? null);
  const [showDimensions, setShowDimensions] = useState(restored?.showDimensions ?? true);
  const [showGrid, setShowGrid] = useState(restored?.showGrid ?? true);
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const dragRef = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null);

  const snapshot = (): Snapshot => ({ frontage, depth, insets: [...insets], roadSide, roadWidth, northSide, buildings: buildings.map((building) => ({ ...building })) });
  const restore = (state: Snapshot) => { setFrontage(state.frontage); setDepth(state.depth); setInsets(state.insets); setRoadSide(state.roadSide); setRoadWidth(state.roadWidth); setNorthSide(state.northSide); setBuildings(state.buildings); setSelectedId(state.buildings[0]?.id ?? null); };
  const checkpoint = () => { setPast((items) => [...items.slice(-29), snapshot()]); setFuture([]); };
  const undo = () => { const state = past.at(-1); if (!state) return; setFuture((items) => [snapshot(), ...items]); setPast((items) => items.slice(0, -1)); restore(state); };
  const redo = () => { const state = future[0]; if (!state) return; setPast((items) => [...items, snapshot()]); setFuture((items) => items.slice(1)); restore(state); };

  const plotPoints = useMemo<Point[]>(() => [
    { x: clamp(insets[0], 0, frontage * .45), y: 0 },
    { x: frontage - clamp(insets[1], 0, frontage * .45), y: 0 },
    { x: frontage - clamp(insets[2], 0, frontage * .45), y: depth },
    { x: clamp(insets[3], 0, frontage * .45), y: depth },
  ], [depth, frontage, insets]);
  const plotArea = calculatePolygonAreaPx(plotPoints);
  const selected = buildings.find((building) => building.id === selectedId) ?? null;
  const outOfBounds = (building: PlanBuilding) => {
    const width = building.rotation === 90 ? building.depth : building.width;
    const height = building.rotation === 90 ? building.width : building.depth;
    return building.x < 0 || building.y < 0 || building.x + width > frontage || building.y + height > depth;
  };
  const invalidBuildings = buildings.filter(outOfBounds);

  const updateBuilding = (buildingId: string, patch: Partial<PlanBuilding>, record = true) => {
    if (record) checkpoint();
    setBuildings((items) => items.map((building) => building.id === buildingId ? { ...building, ...patch } : building));
  };
  const addBuilding = () => {
    checkpoint();
    const next = { id: id(), name: `Building ${buildings.length + 1}`, width: Math.min(20, frontage * .35), depth: Math.min(24, depth * .35), x: 3 + buildings.length * 2, y: 3 + buildings.length * 2, rotation: 0 as const };
    setBuildings((items) => [...items, next]);
    setSelectedId(next.id);
  };
  const removeBuilding = (buildingId: string) => { checkpoint(); setBuildings((items) => items.filter((item) => item.id !== buildingId)); setSelectedId(null); };
  const reset = () => { checkpoint(); setFrontage(defaultFrontage); setDepth(defaultDepth); setInsets(restoredInsets); setRoadSide(restored?.roadSide ?? 'south'); setRoadWidth(restored?.roadWidth ?? 20); setNorthSide(restored?.northSide ?? 'north'); setBuildings(defaultBuildings.map((building) => ({ ...building }))); };

  const plan: PlannerProject = { frontage, depth, plotPoints, roadSide, roadWidth, northSide, buildings, showDimensions, showGrid };
  const save = () => {
    if (!onSave) return;
    const ok = onSave({ id:id(), title:initialProject?.title ?? `Site plan · ${new Date().toLocaleDateString()}`, sqFt:plotArea, sqM:toSqM(plotArea), date:Date.now(), type:'PLANNED', tags:['planner', buildings.length > 1 ? 'multiple-buildings' : 'single-building'], source:{ planner:plan } });
    notify?.(ok ? 'Site plan saved on this device.' : 'The site plan could not be saved.');
  };
  const exportSvg = () => {
    const source = document.getElementById('napiyo-site-plan');
    if (!source) return;
    const content = new XMLSerializer().serializeToString(source);
    const url = URL.createObjectURL(new Blob([content], { type:'image/svg+xml' }));
    const link = document.createElement('a'); link.href = url; link.download = 'napiyo-site-plan.svg'; link.rel = 'noopener'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return <div className="page-shell animate-enter !max-w-[100rem]">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={onBack} className="button-secondary focus-ring"><ArrowLeft size={16}/>Back</button><div className="flex flex-wrap gap-2"><button type="button" onClick={undo} disabled={!past.length} className="button-quiet focus-ring"><Undo2 size={16}/>Undo</button><button type="button" onClick={redo} disabled={!future.length} className="button-quiet focus-ring"><Redo2 size={16}/>Redo</button><button type="button" onClick={reset} className="button-quiet focus-ring"><RotateCcw size={16}/>Reset</button><button type="button" onClick={exportSvg} className="button-secondary focus-ring"><Download size={16}/>SVG</button>{onSave && <button type="button" onClick={save} className="button-primary focus-ring"><Save size={16}/>{initialProject ? 'Save updated copy' : 'Save plan'}</button>}</div></div>
    <header className="grid gap-5 border-b border-paper-200 pb-7 lg:grid-cols-[1fr_auto] lg:items-end"><div className="page-header !mb-0 max-w-4xl"><p className="eyebrow">Editable site planner</p><h1 className="page-title">Shape the plot and arrange multiple buildings.</h1><p className="page-copy">Adjust irregular corner insets, roads, direction, and building footprints. Drag buildings directly on the drawing or use arrow keys for one-foot movement.</p></div><div className="rounded-2xl border border-paper-200 bg-white px-5 py-4 shadow-card"><p className="metric-label">Current plot area</p><p className="numeral mt-1 text-2xl font-semibold text-ink-950">{formatDecimal(plotArea)} ft²</p><p className="mt-1 text-xs text-ink-500">Target {formatDecimal(initialArea)} ft² · difference {formatDecimal(plotArea - initialArea)} ft²</p></div></header>

    {invalidBuildings.length > 0 && <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><AlertTriangle className="mt-0.5 shrink-0" size={18}/><div><strong>{invalidBuildings.length} building{invalidBuildings.length === 1 ? '' : 's'} extend outside the rectangular plot envelope.</strong><p className="mt-1 text-xs leading-5">Move or resize highlighted buildings before using this plan for space estimates.</p></div></div>}

    <div className="mt-6 grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <aside className="space-y-4 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1 scrollbar-thin">
        <Control title="Plot geometry"><div className="grid grid-cols-2 gap-1 rounded-xl bg-paper-100 p-1"><Toggle active={unit==='ft'} label="Feet" onClick={() => setUnit('ft')}/><Toggle active={unit==='m'} label="Metres" onClick={() => setUnit('m')}/></div><div className="grid grid-cols-2 gap-3"><NumberField label="Frontage" value={fromFeet(frontage,unit)} suffix={unit} onChange={(value) => { checkpoint(); setFrontage(Math.max(5,toFeet(value,unit))); }}/><NumberField label="Depth" value={fromFeet(depth,unit)} suffix={unit} onChange={(value) => { checkpoint(); setDepth(Math.max(5,toFeet(value,unit))); }}/></div><p className="field-label">Corner insets</p><div className="grid grid-cols-2 gap-3">{['NW','NE','SE','SW'].map((label,index) => <NumberField key={label} label={label} value={fromFeet(insets[index],unit)} suffix={unit} min={0} onChange={(value) => { checkpoint(); setInsets((items) => items.map((item,i) => i===index ? toFeet(value,unit) : item)); }}/>)}</div></Control>
        <Control title="Road and north"><DirectionPicker label="Road side" value={roadSide} onChange={(value) => { checkpoint(); setRoadSide(value); }}/><NumberField label="Road width" value={fromFeet(roadWidth,unit)} suffix={unit} min={3} onChange={(value) => { checkpoint(); setRoadWidth(toFeet(value,unit)); }}/><DirectionPicker label="North edge" value={northSide} onChange={(value) => { checkpoint(); setNorthSide(value); }}/></Control>
        <Control title="Buildings"><button type="button" onClick={addBuilding} className="button-secondary focus-ring w-full"><Plus size={16}/>Add building</button><div className="space-y-2">{buildings.map((building) => <button key={building.id} type="button" onClick={() => setSelectedId(building.id)} className={`focus-ring flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-semibold ${selectedId===building.id?'border-leaf-400 bg-leaf-50 text-leaf-900':outOfBounds(building)?'border-red-300 bg-red-50 text-red-800':'border-paper-300 bg-white text-ink-700'}`}><span>{building.name}</span><span className="text-xs text-ink-400">{formatDecimal(building.width)} × {formatDecimal(building.depth)} ft</span></button>)}</div>{selected && <div className="space-y-3 border-t border-paper-200 pt-4"><label className="block"><span className="field-label">Name</span><input maxLength={120} value={selected.name} onChange={(event) => updateBuilding(selected.id,{name:event.target.value},false)} onFocus={checkpoint} className="field"/></label><div className="grid grid-cols-2 gap-3"><NumberField label="Width" value={fromFeet(selected.width,unit)} suffix={unit} onChange={(value) => updateBuilding(selected.id,{width:Math.max(.1,toFeet(value,unit))})}/><NumberField label="Depth" value={fromFeet(selected.depth,unit)} suffix={unit} onChange={(value) => updateBuilding(selected.id,{depth:Math.max(.1,toFeet(value,unit))})}/><NumberField label="From west" value={fromFeet(selected.x,unit)} suffix={unit} min={0} onChange={(value) => updateBuilding(selected.id,{x:toFeet(value,unit)})}/><NumberField label="From north" value={fromFeet(selected.y,unit)} suffix={unit} min={0} onChange={(value) => updateBuilding(selected.id,{y:toFeet(value,unit)})}/></div><div className="grid grid-cols-2 gap-2"><Toggle active={selected.rotation===0} label="0°" onClick={() => updateBuilding(selected.id,{rotation:0})}/><Toggle active={selected.rotation===90} label="90°" onClick={() => updateBuilding(selected.id,{rotation:90})}/></div><button type="button" onClick={() => removeBuilding(selected.id)} className="button-secondary focus-ring w-full text-red-700"><Trash2 size={16}/>Remove building</button></div>}</Control>
        <Control title="Layers"><CheckField label="Show dimensions" checked={showDimensions} onChange={setShowDimensions}/><CheckField label="Show grid" checked={showGrid} onChange={setShowGrid}/></Control>
      </aside>

      <main className="space-y-4"><section className="panel overflow-hidden"><div className="border-b border-paper-200 px-5 py-4"><p className="section-title">Interactive site plan</p><p className="section-copy">Select a building, drag it, or focus the canvas and use arrow keys. Red buildings are outside the plot envelope.</p></div><div className="bg-[#eef2ee] p-3 sm:p-5"><SitePlan plan={plan} selectedId={selectedId} setSelectedId={setSelectedId} dragRef={dragRef} checkpoint={checkpoint} setBuildings={setBuildings} outOfBounds={outOfBounds}/></div></section><section className="grid gap-4 lg:grid-cols-3"><Info title="Hill system" value={formatHillsWords(plotArea)}/><Info title="Terai system" value={formatTeraiWords(plotArea)}/><Info title="Plan summary" value={`${buildings.length} building${buildings.length===1?'':'s'} · ${formatDecimal(toSqM(plotArea))} m²`}/></section><p className="rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-3 text-xs leading-5 text-ink-600">This planner checks basic rectangular-envelope containment for visual planning only. It does not apply municipality setbacks, structural rules, ownership boundaries, or construction approval requirements.</p></main>
    </div>
  </div>;
};

const SitePlan = ({ plan, selectedId, setSelectedId, dragRef, checkpoint, setBuildings, outOfBounds }: { plan:PlannerProject; selectedId:string|null; setSelectedId:(id:string)=>void; dragRef:React.MutableRefObject<{id:string;startX:number;startY:number;originX:number;originY:number}|null>; checkpoint:()=>void; setBuildings:React.Dispatch<React.SetStateAction<PlanBuilding[]>>; outOfBounds:(building:PlanBuilding)=>boolean }) => {
  const width=1000,height=700,pad=100; const scale=Math.min((width-pad*2)/Math.max(plan.frontage,1),(height-pad*2)/Math.max(plan.depth,1)); const ox=(width-plan.frontage*scale)/2,oy=(height-plan.depth*scale)/2;
  const polygon=plan.plotPoints?.map((point)=>`${ox+point.x*scale},${oy+point.y*scale}`).join(' ') ?? '';
  const move=(event:PointerEvent<SVGSVGElement>)=>{const drag=dragRef.current;if(!drag)return;const rect=event.currentTarget.getBoundingClientRect();const dx=(event.clientX-drag.startX)*(width/rect.width)/scale;const dy=(event.clientY-drag.startY)*(height/rect.height)/scale;setBuildings((items)=>items.map((item)=>item.id===drag.id?{...item,x:drag.originX+dx,y:drag.originY+dy}:item));};
  const keyboardMove=(event:KeyboardEvent<SVGSVGElement>)=>{if(!selectedId||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();checkpoint();const amount=event.shiftKey?5:1;setBuildings((items)=>items.map((item)=>item.id===selectedId?{...item,x:item.x+(event.key==='ArrowRight'?amount:event.key==='ArrowLeft'?-amount:0),y:item.y+(event.key==='ArrowDown'?amount:event.key==='ArrowUp'?-amount:0)}:item));};
  return <svg id="napiyo-site-plan" viewBox={`0 0 ${width} ${height}`} tabIndex={0} className="h-auto w-full select-none focus:outline-none focus:ring-4 focus:ring-leaf-300" onKeyDown={keyboardMove} onPointerMove={move} onPointerUp={()=>{dragRef.current=null;}} onPointerLeave={()=>{dragRef.current=null;}} role="application" aria-label="Editable proportional site plan. Select a building and use arrow keys to move it."><defs><pattern id="plan-grid" width={Math.max(scale*5,20)} height={Math.max(scale*5,20)} patternUnits="userSpaceOnUse"><path d={`M ${Math.max(scale*5,20)} 0 L 0 0 0 ${Math.max(scale*5,20)}`} fill="none" stroke="#d7dfda" strokeWidth="1"/></pattern></defs><rect width={width} height={height} rx="28" fill={plan.showGrid?'url(#plan-grid)':'#f8faf9'}/><polygon points={polygon} fill="#d8f1e7" stroke="#145d4c" strokeWidth="5"/>{plan.buildings.map((building)=>{const rw=(building.rotation===90?building.depth:building.width)*scale;const rh=(building.rotation===90?building.width:building.depth)*scale;const x=ox+building.x*scale,y=oy+building.y*scale;const active=selectedId===building.id;const invalid=outOfBounds(building);return <g key={building.id} onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);checkpoint();setSelectedId(building.id);dragRef.current={id:building.id,startX:event.clientX,startY:event.clientY,originX:building.x,originY:building.y};}} className="cursor-move"><rect x={x} y={y} width={rw} height={rh} rx="8" fill={invalid?'#fee2e2':active?'#0f766e':'#ffffff'} stroke={invalid?'#dc2626':'#0f766e'} strokeWidth={active||invalid?5:3}/><text x={x+rw/2} y={y+rh/2} textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="700" fill={invalid?'#991b1b':active?'white':'#134e4a'}>{building.name}</text></g>;})}<text x="500" y="35" textAnchor="middle" fontSize="18" fontWeight="700" fill="#33443c">NORTH: {plan.northSide.toUpperCase()}</text><text x="500" y="675" textAnchor="middle" fontSize="16" fill="#55675e">Road {formatDecimal(plan.roadWidth)} ft · {plan.roadSide} edge</text>{plan.showDimensions&&<><text x="500" y={oy-18} textAnchor="middle" fontSize="16" fontWeight="700" fill="#33443c">{formatDecimal(plan.frontage)} ft</text><text x={ox-28} y="350" textAnchor="middle" fontSize="16" fontWeight="700" fill="#33443c" transform={`rotate(-90 ${ox-28} 350)`}>{formatDecimal(plan.depth)} ft</text></>}</svg>;
};

const Control=({title,children}:{title:string;children:React.ReactNode})=><section className="panel p-5"><h2 className="section-title">{title}</h2><div className="mt-4 space-y-4">{children}</div></section>;
const Toggle=({active,label,onClick}:{active:boolean;label:string;onClick:()=>void})=><button type="button" onClick={onClick} className={`focus-ring rounded-lg px-3 py-2 text-xs font-semibold ${active?'bg-ink-950 text-white':'border border-paper-300 bg-white text-ink-600'}`}>{label}</button>;
const NumberField=({label,value,suffix,min=1,onChange}:{label:string;value:number;suffix:string;min?:number;onChange:(value:number)=>void})=><label className="block"><span className="field-label">{label}</span><div className="relative"><input type="number" min={min} max="1000000" step="0.1" value={Number(value.toFixed(2))} onChange={(event)=>onChange(Number(event.target.value)||0)} className="field numeral pr-12"/><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400">{suffix}</span></div></label>;
const DirectionPicker=({label,value,onChange}:{label:string;value:CardinalSide;onChange:(value:CardinalSide)=>void})=><div><p className="field-label">{label}</p><div className="grid grid-cols-4 gap-1">{SIDES.map((side)=><Toggle key={side} active={value===side} label={side[0].toUpperCase()} onClick={()=>onChange(side)}/>)}</div></div>;
const CheckField=({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void})=><label className="flex items-center justify-between gap-3 rounded-xl border border-paper-300 bg-white px-3 py-3 text-sm font-semibold text-ink-700"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event)=>onChange(event.target.checked)} className="h-5 w-5 accent-emerald-700"/></label>;
const Info=({title,value}:{title:string;value:string})=><section className="panel p-5"><p className="metric-label">{title}</p><p className="mt-2 text-sm font-semibold leading-6 text-ink-800">{value}</p></section>;
export default VisualizeScreen;
