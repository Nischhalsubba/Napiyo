import { useMemo, useState } from 'react';
import { ArrowLeft, CarFront, LandPlot, RectangleHorizontal } from 'lucide-react';
import { formatDecimal, formatHillsWords, formatTeraiWords, toSqM } from '../utils/conversions';
import SegmentedControl from './SegmentedControl';

interface VisualizeScreenProps { initialArea: number; onBack: () => void; }
type PlotRatio = '1' | '1.5' | '2' | '3';
type SceneMode = 'residential' | 'agriculture' | 'open';

const REFERENCES = [
  { name: 'standard parking spaces', area: 162, icon: CarFront },
  { name: 'tennis courts', area: 2808, icon: RectangleHorizontal },
  { name: 'football fields', area: 57600, icon: LandPlot },
];

const VisualizeScreen = ({ initialArea, onBack }: VisualizeScreenProps) => {
  const [ratio, setRatio] = useState<PlotRatio>('1.5');
  const [mode, setMode] = useState<SceneMode>(() => initialArea >= 12000 ? 'agriculture' : 'residential');
  const numericRatio = Number(ratio);
  const frontageFt = Math.sqrt(Math.max(initialArea, 0) * numericRatio);
  const depthFt = Math.sqrt(Math.max(initialArea, 0) / numericRatio);
  const comparison = useMemo(() => {
    const reference = initialArea < 1000 ? REFERENCES[0] : initialArea < 12000 ? REFERENCES[1] : REFERENCES[2];
    return { ...reference, count: initialArea / reference.area };
  }, [initialArea]);
  const ComparisonIcon = comparison.icon;

  return <div className="animate-enter mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={onBack} className="focus-ring inline-flex items-center gap-2 self-start rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-sm font-black text-ink-700 hover:bg-paper-50"><ArrowLeft size={17} />Back to converter</button><p className="max-w-2xl text-sm leading-6 text-ink-500 sm:text-right">Illustrative scale view only. It is not a cadastral map or construction plan.</p></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
      <section className="surface-card overflow-hidden">
        <div className="border-b border-paper-200 bg-white p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-700">Realistic scale view</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink-950 sm:text-4xl">See the land as a usable plot, not a green box.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">Change the assumed shape and context. Total area stays fixed while frontage, depth, and the visual layout adapt.</p></div><SegmentedControl label="Choose plot proportion" value={ratio} onChange={setRatio} options={[{ label: '1:1', value: '1' }, { label: '3:2', value: '1.5' }, { label: '2:1', value: '2' }, { label: '3:1', value: '3' }]} className="w-full lg:w-auto" /></div><div className="mt-5 inline-flex w-full rounded-2xl bg-paper-100 p-1.5 sm:w-auto"><SceneButton active={mode === 'residential'} label="Residential" onClick={() => setMode('residential')} /><SceneButton active={mode === 'agriculture'} label="Agriculture" onClick={() => setMode('agriculture')} /><SceneButton active={mode === 'open'} label="Open plot" onClick={() => setMode('open')} /></div></div>
        <div className="bg-[#dfe9df] p-3 sm:p-5"><LandScene ratio={numericRatio} frontageFt={frontageFt} depthFt={depthFt} mode={mode} /></div>
      </section>
      <aside className="space-y-4">
        <section className="surface-card overflow-hidden"><div className="bg-ink-950 p-5 text-white sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-300">Selected area</p><p className="numeral mt-2 text-4xl font-black tracking-[-0.04em]">{formatDecimal(initialArea)} <span className="text-base text-ink-300">ft²</span></p><p className="numeral mt-1 text-sm font-bold text-ink-300">{formatDecimal(toSqM(initialArea))} m²</p></div><dl className="grid grid-cols-2 gap-px bg-paper-200"><Stat label="Frontage" value={`${formatDecimal(frontageFt, 1)} ft`} sub={`${formatDecimal(frontageFt / 3.28084, 1)} m`} /><Stat label="Depth" value={`${formatDecimal(depthFt, 1)} ft`} sub={`${formatDecimal(depthFt / 3.28084, 1)} m`} /><Stat label="Perimeter" value={`${formatDecimal((frontageFt + depthFt) * 2, 1)} ft`} sub="approximate" /><Stat label="Shape" value={`${ratio}:1`} sub="editable" /></dl></section>
        <section className="surface-card p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-saffron-600">Everyday scale</p><div className="mt-4 flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-600"><ComparisonIcon size={24} /></span><div><p className="numeral text-2xl font-black text-ink-950">about {formatDecimal(comparison.count, 1)}</p><p className="text-sm text-ink-500">{comparison.name}</p></div></div></section>
        <section className="surface-card p-5 sm:p-6"><p className="text-sm font-black text-ink-950">Local unit summary</p><p className="mt-3 text-sm font-bold leading-6 text-ink-700">{formatHillsWords(initialArea)}</p><p className="mt-3 border-t border-paper-200 pt-3 text-sm font-bold leading-6 text-ink-700">{formatTeraiWords(initialArea)}</p></section>
        <p className="rounded-2xl border border-saffron-200 bg-saffron-50 p-4 text-xs leading-5 text-ink-700">Buildings, crops, trees, parking, road access, and boundary markers are visual references only. Real setbacks, slope, regulations, and title boundaries may differ.</p>
      </aside>
    </div>
  </div>;
};

const LandScene = ({ ratio, frontageFt, depthFt, mode }: { ratio: number; frontageFt: number; depthFt: number; mode: SceneMode }) => {
  const maxW = 640; const maxH = 310; let w = maxW; let h = w / ratio; if (h > maxH) { h = maxH; w = h * ratio; }
  const x = (900 - w) / 2; const y = 78 + (maxH - h) / 2; const roadY = 470;
  const houseW = Math.min(w * .42, 230); const houseH = Math.min(h * .42, 130); const houseX = x + w * .16; const houseY = y + h * .2;
  const cropRowCount = Math.max(5, Math.min(12, Math.floor(h / 24)));
  const cropRowGap = (h - 36) / Math.max(1, cropRowCount - 1);
  return <svg viewBox="0 0 900 580" className="block h-auto w-full rounded-[1.5rem] border border-white/60 bg-[#d7e3d5] shadow-[0_24px_70px_rgba(27,54,42,0.18)]" role="img" aria-label="Illustrative land plot with dimensions and road access">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eef3ea"/><stop offset="1" stopColor="#cbdcc9"/></linearGradient><linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#83b879"/><stop offset="1" stopColor="#5f9d63"/></linearGradient><linearGradient id="soil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b78858"/><stop offset="1" stopColor="#8c6848"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#17352a" floodOpacity=".25"/></filter><clipPath id="clip"><rect x={x} y={y} width={w} height={h} rx="8"/></clipPath></defs>
    <rect width="900" height="580" fill="url(#bg)"/><path d="M0 82C150 34 255 94 390 48S700 20 900 72V0H0Z" fill="#f7faf4" opacity=".8"/><g fill="#7eaa78" opacity=".45"><circle cx="72" cy="88" r="34"/><circle cx="112" cy="64" r="24"/><circle cx="820" cy="90" r="35"/><circle cx="858" cy="64" r="22"/></g>
    <rect x="0" y={roadY} width="900" height="110" fill="#343b3c"/><rect x="0" y={roadY - 18} width="900" height="18" fill="#c8c5b8"/>{Array.from({ length: 9 }, (_, i) => <rect key={i} x={32 + i * 108} y={roadY + 52} width="58" height="4" rx="2" fill="#f5d66a" opacity=".85"/>)}<text x="450" y="552" textAnchor="middle" fill="#f2f4f4" fontSize="13" fontWeight="700" letterSpacing="1.5">ILLUSTRATIVE ROAD ACCESS</text>
    <rect x={x} y={y} width={w} height={h} rx="8" fill={mode === 'agriculture' ? 'url(#soil)' : 'url(#grass)'} filter="url(#shadow)"/>
    <g clipPath="url(#clip)">
      {mode === 'residential' && <><rect x={houseX + houseW * .58} y={houseY + houseH * .6} width={Math.max(36, houseW * .24)} height={roadY - houseY} fill="#d7d3c8"/><rect x={houseX} y={houseY} width={houseW} height={houseH} rx="6" fill="#f6f0e6"/><path d={`M${houseX - 8} ${houseY + 14}L${houseX + houseW / 2} ${houseY - 28}L${houseX + houseW + 8} ${houseY + 14}Z`} fill="#a94f3d"/><rect x={houseX + houseW * .43} y={houseY + houseH * .52} width={houseW * .16} height={houseH * .48} fill="#7a5944"/><circle cx={x + w * .78} cy={y + h * .3} r="25" fill="#2d6e45"/><circle cx={x + w * .72} cy={y + h * .72} r="21" fill="#3e7d4d"/><rect x={houseX + houseW * .62} y={roadY - 88} width="31" height="54" rx="8" fill="#365b77"/></>}
      {mode === 'agriculture' && <>{Array.from({ length: cropRowCount }, (_, i) => { const row = y + 18 + i * cropRowGap; return <path key={i} d={`M${x + 18} ${row}C${x + w * .35} ${row - 7} ${x + w * .65} ${row + 7} ${x + w - 18} ${row}`} fill="none" stroke={i % 2 ? '#d7c06f' : '#5d793f'} strokeWidth="6" opacity=".85"/>; })}<rect x={x + w * .08} y={y + h * .1} width={Math.min(92, w * .18)} height={Math.min(62, h * .24)} rx="5" fill="#d6c6a4"/><path d={`M${x + w * .06} ${y + h * .13}L${x + w * .17} ${y + h * .02}L${x + w * .28} ${y + h * .13}Z`} fill="#7f4b35"/></>}
      {mode === 'open' && <><path d={`M${x + 20} ${y + h * .3}C${x + w * .35} ${y + h * .1} ${x + w * .6} ${y + h * .55} ${x + w - 20} ${y + h * .3}`} fill="none" stroke="#d5e7ca" strokeWidth="4" opacity=".55"/><ellipse cx={x + w * .64} cy={y + h * .48} rx={Math.min(70, w * .15)} ry={Math.min(34, h * .13)} fill="#9d7b56" opacity=".38"/><circle cx={x + w * .2} cy={y + h * .28} r="21" fill="#2d6e45"/><circle cx={x + w * .82} cy={y + h * .7} r="19" fill="#3e7d4d"/></>}
    </g>
    <rect x={x} y={y} width={w} height={h} rx="8" fill="none" stroke="#173f2e" strokeWidth="5"/><rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx="5" fill="none" stroke="#f4f1df" strokeWidth="2" strokeDasharray="8 7"/>
    {[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([px,py],i) => <g key={i}><circle cx={px} cy={py} r="8" fill="#f7f2df" stroke="#173f2e" strokeWidth="4"/><circle cx={px} cy={py} r="2.5" fill="#d1692f"/></g>)}
    <g fill="#17352a" fontFamily="Inter,system-ui" fontWeight="800"><line x1={x} y1={y-28} x2={x+w} y2={y-28} stroke="#17352a" strokeWidth="2"/><rect x={x+w/2-76} y={y-46} width="152" height="28" rx="14" fill="#f8faf6"/><text x={x+w/2} y={y-27} textAnchor="middle" fontSize="13">{formatDecimal(frontageFt,1)} ft · {formatDecimal(frontageFt/3.28084,1)} m</text><line x1={x-28} y1={y} x2={x-28} y2={y+h} stroke="#17352a" strokeWidth="2"/><g transform={`translate(${x-48} ${y+h/2}) rotate(-90)`}><rect x="-76" y="-14" width="152" height="28" rx="14" fill="#f8faf6"/><text x="0" y="5" textAnchor="middle" fontSize="13">{formatDecimal(depthFt,1)} ft · {formatDecimal(depthFt/3.28084,1)} m</text></g></g>
    <g transform="translate(804 34)"><path d="M18 0L29 34L18 28L7 34Z" fill="#d1692f"/><text x="18" y="50" textAnchor="middle" fill="#17352a" fontSize="12" fontWeight="900">N</text></g>
  </svg>;
};

const SceneButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => <button type="button" onClick={onClick} aria-pressed={active} className={`focus-ring flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition ${active ? 'bg-white text-ink-950 shadow-card' : 'text-ink-500 hover:bg-white/70'}`}>{label}</button>;
const Stat = ({ label, value, sub }: { label: string; value: string; sub: string }) => <div className="bg-white p-4"><dt className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">{label}</dt><dd className="numeral mt-2 text-xl font-black text-ink-950">{value}</dd><dd className="mt-1 text-xs font-bold text-ink-400">{sub}</dd></div>;

export default VisualizeScreen;
