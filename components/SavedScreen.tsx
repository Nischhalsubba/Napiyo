import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Bookmark, Check, Copy, Download, Eye, FileJson, FileUp, GitCompare, Printer, Search, Trash2, X } from 'lucide-react';
import { normalizeItems } from '../lib/storage';
import { SavedFilter, SavedItem } from '../types';
import { formatDecimal, formatHillsWords, formatTeraiWords } from '../utils/conversions';
import { projectToGeoJson, projectToGpx, projectToKml } from '../utils/geospatial';
import SegmentedControl from './SegmentedControl';

interface Props {
  items: SavedItem[];
  onDelete: (id: string) => void;
  onVisualize: (sqFt: number) => void;
  onImport: (items: SavedItem[]) => number;
  notify: (message: string) => void;
}

const download = (name: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

const SavedScreen = ({ items, onDelete, onVisualize, onImport, notify }: Props) => {
  const [filter, setFilter] = useState<SavedFilter>('ALL');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSelected((current) => current.filter((id) => items.some((item) => item.id === id))); }, [items]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === 'ALL' || item.type === filter;
    const searchable = `${item.title} ${formatDecimal(item.sqFt)} ${item.tags.join(' ')} ${item.notes ?? ''}`.toLowerCase();
    return matchesFilter && searchable.includes(query.trim().toLowerCase());
  }), [filter, items, query]);

  const comparison = selected.length === 2 ? selected.map((id) => items.find((item) => item.id === id)).filter(Boolean) as SavedItem[] : [];
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  const summary = (item: SavedItem) => `${item.title}\n${formatDecimal(item.sqFt)} sq ft · ${formatDecimal(item.sqM)} sq m\nHill: ${formatHillsWords(item.sqFt)}\nTerai: ${formatTeraiWords(item.sqFt)}${item.source?.perimeterFt ? `\nPerimeter: ${formatDecimal(item.source.perimeterFt)} ft` : ''}`;
  const copy = async (item: SavedItem) => { try { await navigator.clipboard.writeText(summary(item)); notify('Saved project copied.'); } catch { notify('Your browser blocked clipboard access.'); } };
  const exportProject = (item: SavedItem) => download(`napiyo-${item.id}.json`, JSON.stringify({ app: 'Napiyo', version: 2, exportedAt: new Date().toISOString(), project: item }, null, 2), 'application/json');
  const exportAll = () => download('napiyo-projects-backup.json', JSON.stringify({ app: 'Napiyo', version: 2, exportedAt: new Date().toISOString(), projects: items }, null, 2), 'application/json');
  const exportCsv = () => {
    const rows = [['Title','Type','Square feet','Square metres','Hill system','Terai system','Perimeter feet','Date'], ...items.map((item) => [item.title,item.type,String(item.sqFt),String(item.sqM),formatHillsWords(item.sqFt),formatTeraiWords(item.sqFt),String(item.source?.perimeterFt ?? ''),new Date(item.date).toISOString()])];
    download('napiyo-projects.csv', rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv;charset=utf-8');
  };

  const importProjects = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const raw = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' && 'projects' in parsed
        ? (parsed as { projects?: unknown }).projects
        : parsed && typeof parsed === 'object' && 'project' in parsed ? [(parsed as { project?: unknown }).project] : [];
      const projects = Array.isArray(raw) ? normalizeItems(raw) : [];
      if (!projects.length) return notify('No valid Napiyo projects were found in that file.');
      const count = onImport(projects);
      notify(count ? `${count} project${count === 1 ? '' : 's'} restored.` : 'The projects could not be restored.');
    } catch {
      notify('That backup file is not valid JSON.');
    }
  };

  const exportGeo = (item: SavedItem, kind: 'geojson' | 'kml' | 'gpx') => {
    const points = item.source?.geoPoints;
    if (!points?.length) return notify('Geospatial export is available for GPS projects.');
    const values = {
      geojson: [projectToGeoJson(item.title, points), 'application/geo+json'],
      kml: [projectToKml(item.title, points), 'application/vnd.google-earth.kml+xml'],
      gpx: [projectToGpx(item.title, points), 'application/gpx+xml'],
    } as const;
    download(`napiyo-${item.id}.${kind}`, values[kind][0], values[kind][1]);
  };

  const printReport = (item: SavedItem) => {
    const report = window.open('', '_blank', 'noopener,noreferrer');
    if (!report) return notify('The browser blocked the printable report.');
    report.document.write(`<!doctype html><html><head><title>${item.title}</title><style>body{font-family:system-ui,sans-serif;margin:48px;color:#15231d}h1{font-size:30px}table{border-collapse:collapse;width:100%;margin-top:24px}td{border-bottom:1px solid #ddd;padding:12px 0}td:first-child{font-weight:700;width:35%}.note{margin-top:30px;padding:16px;background:#fff7ed;border:1px solid #fed7aa}@media print{button{display:none}}</style></head><body><h1>${item.title}</h1><p>Generated by Napiyo on ${new Date().toLocaleDateString()}</p><table><tr><td>Project type</td><td>${item.type}</td></tr><tr><td>Area</td><td>${formatDecimal(item.sqFt)} sq ft · ${formatDecimal(item.sqM)} m²</td></tr><tr><td>Hill system</td><td>${formatHillsWords(item.sqFt)}</td></tr><tr><td>Terai system</td><td>${formatTeraiWords(item.sqFt)}</td></tr><tr><td>Perimeter</td><td>${item.source?.perimeterFt ? `${formatDecimal(item.source.perimeterFt)} ft` : 'Not recorded'}</td></tr><tr><td>Saved</td><td>${new Date(item.date).toLocaleString()}</td></tr></table><p class="note">Planning aid only. This report is not a cadastral record, legal survey, valuation, or construction approval.</p><button onclick="window.print()">Print or save as PDF</button></body></html>`);
    report.document.close();
  };

  if (!items.length) return <div className="page-shell animate-enter"><div className="mx-auto flex min-h-[58vh] max-w-xl flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-paper-200 bg-white text-leaf-700 shadow-card"><Bookmark size={24}/></span><p className="eyebrow mt-6">Saved projects</p><h1 className="mt-2 text-3xl font-bold text-ink-950">Your project library is empty.</h1><p className="mt-3 max-w-md text-sm leading-6 text-ink-500">Save a conversion, image trace, or GPS measurement, or restore a previous JSON backup.</p><button type="button" onClick={() => importRef.current?.click()} className="button-primary focus-ring mt-5"><FileUp size={16}/>Restore backup</button><input ref={importRef} type="file" accept="application/json,.json" onChange={importProjects} className="sr-only"/></div></div>;

  return <div className="page-shell animate-enter"><header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="page-header !mb-0"><p className="eyebrow">Saved projects</p><h1 className="page-title">Keep measurements useful and portable.</h1><p className="page-copy">Search, compare, restore, print, or export your projects. Data stays in this browser unless you choose to download or share it.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => importRef.current?.click()} className="button-secondary focus-ring"><FileUp size={16}/>Restore JSON</button><button type="button" onClick={exportCsv} className="button-secondary focus-ring"><Download size={16}/>CSV</button><button type="button" onClick={exportAll} className="button-primary focus-ring"><FileJson size={16}/>Backup all</button><input ref={importRef} type="file" accept="application/json,.json" onChange={importProjects} className="sr-only"/></div></header>
    <section className="panel my-6"><div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"><SegmentedControl label="Filter saved projects" value={filter} onChange={setFilter} className="w-full lg:w-auto" options={[{label:'All',value:'ALL'},{label:'Conversions',value:'CONVERTED'},{label:'Image',value:'MEASURED'},{label:'GPS',value:'GPS'},{label:'Plans',value:'PLANNED'}]}/><label className="relative block w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17}/><span className="sr-only">Search saved projects</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, tag, or area" className="field pl-10"/></label></div></section>
    {!filtered.length ? <div className="panel p-10 text-center"><h2 className="section-title">No matching projects</h2><p className="section-copy">Clear the search or choose another filter.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => { const active = selected.includes(item.id); return <article key={item.id} className={`overflow-hidden rounded-2xl border bg-white transition ${active ? 'border-leaf-500 ring-3 ring-leaf-100' : 'border-paper-300 hover:shadow-card'}`}><button type="button" onClick={() => toggle(item.id)} aria-pressed={active} className="focus-ring flex w-full items-start justify-between gap-4 p-5 text-left"><div className="min-w-0"><span className={`status-pill ${item.type === 'CONVERTED' ? 'status-positive' : 'status-warning'}`}>{item.type === 'CONVERTED' ? 'Exact conversion' : item.type === 'MEASURED' ? 'Image estimate' : item.type === 'GPS' ? 'GPS estimate' : 'Site plan'}</span><h2 className="mt-4 truncate text-base font-semibold text-ink-900">{item.title}</h2><p className="numeral mt-3 text-3xl font-semibold text-ink-950">{formatDecimal(item.sqFt)} <span className="text-xs text-ink-400">sq ft</span></p><p className="mt-1 text-xs text-ink-500">{formatDecimal(item.sqM)} m²{item.source?.perimeterFt ? ` · ${formatDecimal(item.source.perimeterFt)} ft perimeter` : ''}</p>{item.source?.confidence && <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{item.source.confidence.toLowerCase()} confidence</p>}</div><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? 'border-leaf-700 bg-leaf-700 text-white' : 'border-paper-300 text-transparent'}`}><Check size={13}/></span></button><div className="grid grid-cols-5 gap-px border-t border-paper-200 bg-paper-200"><Action icon={Copy} label="Copy" onClick={() => copy(item)}/><Action icon={Eye} label="Plan" onClick={() => onVisualize(item.sqFt)}/><Action icon={Printer} label="Report" onClick={() => printReport(item)}/><Action icon={Download} label="Export" onClick={() => item.type === 'GPS' ? exportGeo(item, 'geojson') : exportProject(item)}/><Action icon={Trash2} label="Delete" danger onClick={() => onDelete(item.id)}/></div>{item.type === 'GPS' && <div className="flex gap-2 border-t border-paper-200 px-4 py-3">{(['geojson','kml','gpx'] as const).map((kind) => <button key={kind} type="button" onClick={() => exportGeo(item, kind)} className="focus-ring rounded-lg border border-paper-300 px-2.5 py-1.5 text-[11px] font-bold uppercase text-ink-600">{kind}</button>)}</div>}</article>; })}</div>}
    {!!selected.length && <div className="safe-bottom fixed inset-x-4 bottom-22 z-30 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl bg-ink-950 p-3 text-white shadow-soft md:bottom-5"><div className="flex items-center gap-3"><GitCompare size={18}/><div><p className="text-sm font-semibold">{selected.length} of 2 selected</p><p className="text-xs text-ink-300">Choose two projects to compare</p></div></div><button type="button" onClick={() => setSelected([])} aria-label="Clear comparison" className="focus-ring rounded-lg p-2.5 hover:bg-white/10"><X size={18}/></button></div>}
    {comparison.length === 2 && <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950/60 p-4 backdrop-blur-sm sm:p-8" role="presentation"><section className="mx-auto max-w-4xl rounded-2xl bg-white p-5 shadow-soft sm:p-7" role="dialog" aria-modal="true" aria-labelledby="compare-title"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Project comparison</p><h2 id="compare-title" className="mt-2 text-2xl font-bold text-ink-950">Compare saved areas</h2></div><button type="button" onClick={() => setSelected([])} aria-label="Close comparison" className="icon-button focus-ring"><X size={19}/></button></div><div className="mt-6 grid gap-4 md:grid-cols-2">{comparison.map((item) => <Compare key={item.id} item={item}/>)}</div><div className="mt-4 rounded-xl bg-ink-950 p-5 text-white"><p className="text-xs uppercase tracking-wide text-ink-300">Difference</p><p className="numeral mt-2 text-3xl font-semibold">{formatDecimal(Math.abs(comparison[0].sqFt - comparison[1].sqFt))} <span className="text-xs text-ink-300">sq ft</span></p></div></section></div>}
  </div>;
};

const Action = ({ icon: Icon, label, onClick, danger = false }: { icon: typeof Copy; label: string; onClick: () => void; danger?: boolean }) => <button type="button" onClick={onClick} className={`focus-ring inline-flex min-h-11 items-center justify-center gap-1 bg-white text-[11px] font-semibold ${danger ? 'text-red-700' : 'text-ink-600'}`}><Icon size={14}/>{label}</button>;
const Compare = ({ item }: { item: SavedItem }) => <div className="panel-muted p-5"><p className="text-sm font-semibold text-ink-700">{item.title}</p><p className="numeral mt-3 text-3xl font-semibold text-ink-950">{formatDecimal(item.sqFt)} <span className="text-xs text-ink-400">sq ft</span></p><dl className="mt-5 space-y-4 border-t border-paper-200 pt-4"><div><dt className="metric-label">Hill system</dt><dd className="mt-1 text-sm font-semibold text-ink-800">{formatHillsWords(item.sqFt)}</dd></div><div><dt className="metric-label">Terai system</dt><dd className="mt-1 text-sm font-semibold text-ink-800">{formatTeraiWords(item.sqFt)}</dd></div>{item.source?.perimeterFt && <div><dt className="metric-label">Perimeter</dt><dd className="mt-1 text-sm font-semibold text-ink-800">{formatDecimal(item.source.perimeterFt)} ft</dd></div>}</dl></div>;
export default SavedScreen;
