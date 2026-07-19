import { ArrowLeft, ImageOff, LandPlot, RotateCcw } from 'lucide-react';
import { SavedItem } from '../types';
import { formatDecimal, formatHillsWords, formatTeraiWords } from '../utils/conversions';

interface Props {
  project: SavedItem;
  onBack: () => void;
  onStartNew: () => void;
  onVisualize: (sqFt: number) => void;
}

const SavedMeasurementReview = ({ project, onBack, onStartNew, onVisualize }: Props) => {
  const boundary = project.source?.boundary ?? [];
  const width = project.source?.imageWidth ?? 1000;
  const height = project.source?.imageHeight ?? 750;

  return <div className="page-shell animate-enter">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={onBack} className="button-secondary focus-ring"><ArrowLeft size={16}/>Projects</button><div className="flex flex-wrap gap-2"><button type="button" onClick={onStartNew} className="button-secondary focus-ring"><RotateCcw size={16}/>Start new trace</button><button type="button" onClick={() => onVisualize(project.sqFt)} className="button-primary focus-ring"><LandPlot size={16}/>Plan this area</button></div></div>
    <header className="page-header"><p className="eyebrow">Saved image estimate</p><h1 className="page-title">{project.title}</h1><p className="page-copy">The traced geometry and calibration were saved locally. The original uploaded image was intentionally not retained, so this is a reconstructed boundary review rather than the original screenshot.</p></header>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-paper-200 px-5 py-4"><div><p className="section-title">Reconstructed boundary</p><p className="section-copy">Proportional to the original image dimensions.</p></div><ImageOff className="text-ink-400" size={20}/></div><div className="min-h-[420px] bg-ink-950 p-4"><svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[390px] w-full" role="img" aria-label={`Saved polygon with ${boundary.length} points`}><rect width={width} height={height} fill="#10231d"/><path d={boundary.length ? `M ${boundary.map((point) => `${point.x},${point.y}`).join(' L ')} Z` : ''} fill="rgba(16,185,129,.28)" stroke="#6ee7b7" strokeWidth={Math.max(3,width*.003)}/>{boundary.map((point,index)=><g key={index}><circle cx={point.x} cy={point.y} r={Math.max(6,width*.006)} fill="#10b981" stroke="white" strokeWidth="3"/><text x={point.x} y={point.y-Math.max(10,width*.01)} textAnchor="middle" fontSize={Math.max(12,width*.014)} fontWeight="700" fill="white">{index+1}</text></g>)}</svg></div></section>
      <aside className="space-y-4"><section className="panel p-5"><p className="metric-label">Estimated area</p><p className="numeral mt-2 text-4xl font-semibold text-ink-950">{formatDecimal(project.sqFt)} <span className="text-sm text-ink-400">sq ft</span></p><p className="mt-1 text-sm text-ink-500">{formatDecimal(project.sqM)} m²</p>{project.source?.confidence && <span className="status-pill status-warning mt-4">{project.source.confidence.toLowerCase()} confidence</span>}</section><section className="panel p-5"><Result label="Hill system" value={formatHillsWords(project.sqFt)}/><Result label="Terai system" value={formatTeraiWords(project.sqFt)}/><Result label="Perimeter" value={project.source?.perimeterFt ? `${formatDecimal(project.source.perimeterFt)} ft` : 'Not recorded'}/><Result label="Boundary points" value={String(boundary.length)}/><Result label="Reference distance" value={project.source?.referenceDistanceFt ? `${formatDecimal(project.source.referenceDistanceFt)} ft` : 'Not recorded'}/></section><p className="rounded-xl border border-saffron-200 bg-saffron-50 p-4 text-xs leading-5 text-ink-600">This reconstruction is an estimate, not a legal survey. Re-upload the original image and trace again when you need to adjust vertices.</p></aside>
    </div>
  </div>;
};

const Result = ({ label, value }: { label: string; value: string }) => <div className="border-b border-paper-200 py-3 last:border-0"><p className="metric-label">{label}</p><p className="mt-1 text-sm font-semibold text-ink-800">{value}</p></div>;
export default SavedMeasurementReview;
