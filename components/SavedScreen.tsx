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

  const comparison = selected.length === 2
    ? selected.map((id) => items.find((item) => item.id === id)).filter(Boolean) as SavedItem[]
    : [];

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 2
        ? [...current, id]
        : [current[1], id]);
  };

  const copy = async (item: SavedItem) => {
    try {
      await navigator.clipboard.writeText(`${item.title}: ${formatDecimal(item.sqFt)} sq ft (${formatDecimal(item.sqM)} sq m). Hill ${formatHills(item.sqFt)}. Terai ${formatTerai(item.sqFt)}.`);
      notify('Saved area copied.');
    } catch {
      notify('Your browser blocked clipboard access.');
    }
  };

  if (!items.length) {
    return (
      <div className="page-shell animate-enter">
        <div className="mx-auto flex min-h-[58vh] max-w-xl flex-col items-center justify-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-paper-200 bg-white text-leaf-700 shadow-card">
            <Bookmark size={24} aria-hidden="true" />
          </span>
          <p className="eyebrow mt-6">Saved areas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink-950">Your library is empty.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-500">Save a conversion or traced estimate to compare it later on this device.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell animate-enter">
      <header className="page-header">
        <p className="eyebrow">Saved areas</p>
        <h1 className="page-title">Keep useful measurements close.</h1>
        <p className="page-copy">Search previous work, reopen a plan, or select two areas to compare.</p>
      </header>

      <section className="panel mb-6">
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedControl
            label="Filter saved areas"
            value={filter}
            onChange={setFilter}
            className="w-full lg:w-auto"
            options={[
              { label: 'All', value: 'ALL' },
              { label: 'Conversions', value: 'CONVERTED' },
              { label: 'Measurements', value: 'MEASURED' },
            ]}
          />
          <label className="relative block w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
            <span className="sr-only">Search saved areas</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or area" className="field pl-10" />
          </label>
        </div>
      </section>

      {!filtered.length ? (
        <div className="panel p-10 text-center">
          <h2 className="section-title">No results</h2>
          <p className="section-copy">Clear the search or choose a different filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const active = selected.includes(item.id);
            return (
              <article key={item.id} className={`overflow-hidden rounded-2xl border bg-white transition ${active ? 'border-leaf-500 ring-3 ring-leaf-100' : 'border-paper-300 hover:border-ink-300 hover:shadow-card'}`}>
                <button type="button" onClick={() => toggle(item.id)} aria-pressed={active} className="focus-ring flex w-full items-start justify-between gap-4 p-5 text-left">
                  <div className="min-w-0">
                    <span className={`status-pill ${item.type === 'MEASURED' ? 'status-warning' : 'status-positive'}`}>{item.type === 'MEASURED' ? 'Image estimate' : 'Converted area'}</span>
                    <h2 className="mt-4 truncate text-base font-semibold text-ink-900">{item.title}</h2>
                    <p className="numeral mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink-950">
                      {formatDecimal(item.sqFt)} <span className="text-xs font-medium text-ink-400">sq ft</span>
                    </p>
                    <p className="numeral mt-1 text-xs font-medium text-ink-500">{formatDecimal(item.sqM)} sq m</p>
                  </div>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? 'border-leaf-700 bg-leaf-700 text-white' : 'border-paper-300 bg-white text-transparent'}`}>
                    <Check size={13} aria-hidden="true" />
                  </span>
                </button>
                <div className="grid grid-cols-3 gap-px border-t border-paper-200 bg-paper-200">
                  <Action icon={Copy} label="Copy" onClick={() => copy(item)} />
                  <Action icon={Eye} label="Plan" onClick={() => onVisualize(item.sqFt)} />
                  <Action icon={Trash2} label="Delete" danger onClick={() => onDelete(item.id)} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!!selected.length && (
        <div className="safe-bottom fixed inset-x-4 bottom-22 z-30 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl bg-ink-950 p-3 text-white shadow-soft md:bottom-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><GitCompare size={17} aria-hidden="true" /></span>
            <div>
              <p className="text-sm font-semibold">{selected.length} of 2 selected</p>
              <p className="text-xs text-ink-300">Choose two areas to compare</p>
            </div>
          </div>
          <button type="button" onClick={() => setSelected([])} aria-label="Clear comparison" className="focus-ring rounded-lg p-2.5 hover:bg-white/10"><X size={18} /></button>
        </div>
      )}

      {comparison.length === 2 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950/60 p-4 backdrop-blur-sm sm:p-8">
          <section className="mx-auto max-w-4xl rounded-2xl bg-paper-50 p-5 shadow-soft sm:p-7" role="dialog" aria-modal="true" aria-labelledby="compare-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Area comparison</p>
                <h2 id="compare-title" className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink-950">Compare saved areas</h2>
              </div>
              <button type="button" onClick={() => setSelected([])} aria-label="Close comparison" className="icon-button focus-ring"><X size={19} /></button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {comparison.map((item) => <Compare key={item.id} item={item} />)}
            </div>
            <div className="mt-4 rounded-xl bg-ink-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-300">Difference</p>
              <p className="numeral mt-2 text-3xl font-semibold tracking-[-0.03em]">{formatDecimal(Math.abs(comparison[0].sqFt - comparison[1].sqFt))} <span className="text-xs font-medium text-ink-300">sq ft</span></p>
              <p className="mt-2 text-sm text-ink-300">{comparison[0].sqFt === comparison[1].sqFt ? 'These areas are equal.' : `${comparison[0].sqFt > comparison[1].sqFt ? comparison[0].title : comparison[1].title} is larger.`}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const Action = ({ icon: Icon, label, onClick, danger = false }: { icon: typeof Copy; label: string; onClick: () => void; danger?: boolean }) => (
  <button type="button" onClick={onClick} className={`focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 bg-paper-50 text-xs font-semibold hover:bg-white ${danger ? 'text-red-700' : 'text-ink-600'}`}>
    <Icon size={14} aria-hidden="true" />{label}
  </button>
);

const Compare = ({ item }: { item: SavedItem }) => (
  <div className="panel-muted p-5">
    <p className="text-sm font-semibold text-ink-700">{item.title}</p>
    <p className="numeral mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink-950">{formatDecimal(item.sqFt)} <span className="text-xs font-medium text-ink-400">sq ft</span></p>
    <dl className="mt-5 space-y-4 border-t border-paper-200 pt-4">
      <div><dt className="metric-label">Hill system</dt><dd className="numeral mt-1 text-sm font-semibold text-ink-800">{formatHills(item.sqFt)}</dd></div>
      <div><dt className="metric-label">Terai system</dt><dd className="numeral mt-1 text-sm font-semibold text-ink-800">{formatTerai(item.sqFt)}</dd></div>
    </dl>
  </div>
);

export default SavedScreen;
