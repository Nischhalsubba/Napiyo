import { useMemo, useState } from 'react';
import { Bookmark, Check, Copy, Eye, GitCompare, Search, Trash2, X } from 'lucide-react';
import { SavedFilter, SavedItem } from '../types';
import { formatDecimal, formatHills, formatTerai } from '../utils/conversions';
import SegmentedControl from './SegmentedControl';

interface Props {
  items: SavedItem[];
  onDelete: (id: string) => void;
  onVisualize: (sqFt: number) => void;
  notify: (message: string) => void;
}

const SavedScreen = ({ items, onDelete, onVisualize, notify }: Props) => {
  const [filter, setFilter] = useState<SavedFilter>('ALL');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === 'ALL' || item.type === filter;
    const searchable = `${item.title} ${formatDecimal(item.sqFt)} ${item.tags.join(' ')}`.toLowerCase();
    return matchesFilter && searchable.includes(query.trim().toLowerCase());
  }), [filter, items, query]);

  const comparison = selected.length === 2 ? selected.map((id) => items.find((item) => item.id === id)).filter(Boolean) as SavedItem[] : [];

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  };

  const copy = async (item: SavedItem) => {
    try {
      await navigator.clipboard.writeText(`${item.title}: ${formatDecimal(item.sqFt)} sq ft (${formatDecimal(item.sqM)} sq m). Hill ${formatHills(item.sqFt)}. Terai ${formatTerai(item.sqFt)}.`);
      notify('Saved area copied.');
    } catch {
      notify('Copy was blocked by this browser.');
    }
  };

  if (!items.length) return (
    <div className="animate-enter mx-auto flex min-h-[62vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-leaf-100 text-leaf-800"><Bookmark size={34} aria-hidden="true" /></span>
      <h1 className="mt-6 font-display text-4xl text-ink-950">Nothing saved yet.</h1>
      <p className="mt-3 max-w-md leading-7 text-ink-600">Save a conversion or plot estimate and it will remain on this device for later comparison.</p>
    </div>
  );

  return (
    <div className="animate-enter mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6"><p className="text-sm font-bold uppercase tracking-[0.18em] text-leaf-700">Your browser history</p><h1 className="mt-2 font-display text-4xl text-ink-950 sm:text-5xl">Saved areas</h1><p className="mt-3 max-w-2xl leading-7 text-ink-600">Search, compare, copy, or reopen calculations stored on this device.</p></div>
      <div className="surface-card mb-6 flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl label="Filter saved areas" value={filter} onChange={setFilter} className="w-full lg:w-auto" options={[{ label: 'All', value: 'ALL' }, { label: 'Converted', value: 'CONVERTED' }, { label: 'Measured', value: 'MEASURED' }]} />
        <label className="relative block w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} /><span className="sr-only">Search saved areas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved areas" className="focus-ring min-h-12 w-full rounded-xl border border-paper-300 bg-white pl-11 pr-4" /></label>
      </div>

      {!filtered.length ? <div className="surface-card p-10 text-center"><h2 className="text-xl font-bold">No matching areas</h2><p className="mt-2 text-sm text-ink-500">Try another search or filter.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => {
        const active = selected.includes(item.id);
        return <article key={item.id} className={`surface-card overflow-hidden transition ${active ? 'ring-3 ring-leaf-300' : 'hover:-translate-y-0.5 hover:shadow-soft'}`}>
          <button type="button" onClick={() => toggle(item.id)} aria-pressed={active} className="focus-ring flex w-full items-start justify-between gap-4 p-5 text-left">
            <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.type === 'MEASURED' ? 'bg-saffron-100 text-saffron-600' : 'bg-leaf-100 text-leaf-800'}`}>{item.type === 'MEASURED' ? 'Plot estimate' : 'Conversion'}</span><h2 className="mt-3 text-xl font-bold text-ink-950">{item.title}</h2><p className="numeral mt-2 text-3xl font-bold text-ink-950">{formatDecimal(item.sqFt)} <span className="text-sm font-semibold text-ink-500">sq ft</span></p><p className="numeral mt-1 text-sm text-ink-500">{formatDecimal(item.sqM)} sq m</p></div>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? 'border-leaf-700 bg-leaf-700 text-white' : 'border-paper-300 bg-white text-transparent'}`}><Check size={14} /></span>
          </button>
          <div className="grid grid-cols-3 gap-px border-t border-paper-200 bg-paper-200"><Action icon={Copy} label="Copy" onClick={() => copy(item)} /><Action icon={Eye} label="Show" onClick={() => onVisualize(item.sqFt)} /><Action icon={Trash2} label="Delete" danger onClick={() => onDelete(item.id)} /></div>
        </article>;
      })}</div>}

      {!!selected.length && <div className="safe-bottom fixed inset-x-4 bottom-22 z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl bg-ink-950 p-3 text-white shadow-soft md:bottom-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><GitCompare size={19} /></span><div><p className="text-sm font-bold">{selected.length}/2 selected</p><p className="text-xs text-ink-300">Choose two areas to compare</p></div></div><button type="button" onClick={() => setSelected([])} aria-label="Clear comparison" className="focus-ring rounded-xl p-3 hover:bg-white/10"><X size={19} /></button></div>}

      {comparison.length === 2 && <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950/70 p-4 backdrop-blur-sm sm:p-8"><section className="mx-auto max-w-4xl rounded-3xl bg-paper-50 p-5 shadow-soft sm:p-8" role="dialog" aria-modal="true" aria-labelledby="compare-title"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-700">Side-by-side</p><h2 id="compare-title" className="mt-1 text-3xl font-bold">Compare areas</h2></div><button type="button" onClick={() => setSelected([])} aria-label="Close comparison" className="focus-ring rounded-xl p-3 hover:bg-paper-100"><X size={21} /></button></div><div className="mt-6 grid gap-4 md:grid-cols-2">{comparison.map((item) => <Compare key={item.id} item={item} />)}</div><div className="mt-4 rounded-2xl bg-ink-950 p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-200">Difference</p><p className="numeral mt-2 text-3xl font-bold">{formatDecimal(Math.abs(comparison[0].sqFt - comparison[1].sqFt))} <span className="text-sm text-ink-300">sq ft</span></p><p className="mt-2 text-sm text-ink-300">{comparison[0].sqFt === comparison[1].sqFt ? 'Both areas are equal.' : `${comparison[0].sqFt > comparison[1].sqFt ? comparison[0].title : comparison[1].title} is larger.`}</p></div></section></div>}
    </div>
  );
};

const Action = ({ icon: Icon, label, onClick, danger = false }: { icon: typeof Copy; label: string; onClick: () => void; danger?: boolean }) => <button type="button" onClick={onClick} className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 bg-paper-50 text-xs font-bold hover:bg-white ${danger ? 'text-red-700' : 'text-ink-600'}`}><Icon size={15} />{label}</button>;
const Compare = ({ item }: { item: SavedItem }) => <div className="surface-muted p-5"><p className="text-sm font-bold text-ink-500">{item.title}</p><p className="numeral mt-2 text-3xl font-bold">{formatDecimal(item.sqFt)} <span className="text-sm text-ink-500">sq ft</span></p><p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-400">Hill system</p><p className="numeral mt-1 font-bold">{formatHills(item.sqFt)}</p><p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-400">Terai system</p><p className="numeral mt-1 font-bold">{formatTerai(item.sqFt)}</p></div>;

export default SavedScreen;
