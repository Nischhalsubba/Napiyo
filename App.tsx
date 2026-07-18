import { useEffect, useState } from 'react';
import {
  Bookmark,
  Calculator,
  CheckCircle2,
  Code2,
  LandPlot,
  MapPinned,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import ConvertScreen from './components/ConvertScreen';
import MeasureScreen from './components/MeasureScreen';
import SavedScreen from './components/SavedScreen';
import VisualizeScreen from './components/VisualizeScreen';
import { loadItems, saveItems } from './lib/storage';
import { SavedItem, ViewState } from './types';

const NAV_ITEMS: { id: Exclude<ViewState, 'visualize'>; label: string; mobileLabel: string; icon: typeof Calculator }[] = [
  { id: 'convert', label: 'Convert', mobileLabel: 'Convert', icon: Calculator },
  { id: 'measure', label: 'Measure', mobileLabel: 'Measure', icon: MapPinned },
  { id: 'saved', label: 'Saved', mobileLabel: 'Saved', icon: Bookmark },
];

const getInitialView = (): ViewState => {
  const hash = window.location.hash.replace('#', '') as ViewState;
  return ['convert', 'measure', 'saved', 'visualize'].includes(hash) ? hash : 'convert';
};

const App = () => {
  const [activeView, setActiveView] = useState<ViewState>(getInitialView);
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => loadItems());
  const [visualizedArea, setVisualizedArea] = useState(1000);
  const [toast, setToast] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SavedItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncView = () => setActiveView(getInitialView());
    window.addEventListener('hashchange', syncView);
    return () => window.removeEventListener('hashchange', syncView);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const navigate = (view: ViewState) => {
    window.location.hash = view;
    setActiveView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (item: SavedItem): boolean => {
    const nextItems = [item, ...savedItems];
    const saved = saveItems(nextItems);
    if (saved) setSavedItems(nextItems);
    return saved;
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const nextItems = savedItems.filter((item) => item.id !== pendingDelete.id);
    if (saveItems(nextItems)) {
      setSavedItems(nextItems);
      setToast('Removed from saved areas.');
    } else {
      setToast('This browser could not update saved areas.');
    }
    setPendingDelete(null);
  };

  const visualize = (sqFt: number) => {
    setVisualizedArea(sqFt);
    navigate('visualize');
  };

  return (
    <div className="min-h-screen pb-24 text-ink-950 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-paper-200 bg-paper-50/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[86rem] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('convert')} className="focus-ring flex items-center gap-3 rounded-xl text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-white">
              <LandPlot size={19} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold tracking-[-0.02em] text-ink-950">Napiyo</span>
              <span className="hidden text-xs font-medium text-ink-500 sm:block">Land measurements, made readable</span>
            </span>
          </button>

          <nav className="hidden items-center rounded-xl border border-paper-200 bg-paper-100 p-1 md:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)} />
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="https://github.com/Nischhalsubba/Napiyo"
              target="_blank"
              rel="noreferrer"
              className="icon-button focus-ring"
              aria-label="View Napiyo source code"
            >
              <Code2 aria-hidden="true" size={18} />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="icon-button focus-ring md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Open navigation"
          >
            {mobileMenuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-paper-200 bg-paper-50 px-4 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto grid max-w-[86rem] gap-1">
              {NAV_ITEMS.map((item) => (
                <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)} mobile />
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="main-content">
        {activeView === 'convert' && <ConvertScreen onSave={handleSave} onVisualize={visualize} notify={setToast} />}
        {activeView === 'measure' && <MeasureScreen onSave={handleSave} notify={setToast} />}
        {activeView === 'saved' && (
          <SavedScreen
            items={savedItems}
            onDelete={(id) => setPendingDelete(savedItems.find((item) => item.id === id) ?? null)}
            onVisualize={visualize}
            notify={setToast}
          />
        )}
        {activeView === 'visualize' && <VisualizeScreen initialArea={visualizedArea} onBack={() => navigate('convert')} />}
      </main>

      <footer className="border-t border-paper-200 bg-paper-50">
        <div className="mx-auto flex max-w-[86rem] flex-col gap-4 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-50 text-leaf-700">
              <ShieldCheck aria-hidden="true" size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-800">Planning aid, not a survey record</p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-500">Confirm official area, boundaries, access, and ownership with cadastral records and a qualified survey professional.</p>
            </div>
          </div>
          <a href="https://github.com/Nischhalsubba/Napiyo" target="_blank" rel="noreferrer" className="button-quiet focus-ring self-start">
            <Code2 aria-hidden="true" size={16} />
            Source code
          </a>
        </div>
      </footer>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-paper-200 bg-paper-50/96 px-2 pt-2 backdrop-blur-xl md:hidden" aria-label="Bottom navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition ${
                active ? 'bg-ink-950 text-white' : 'text-ink-500 hover:bg-paper-100 hover:text-ink-950'
              }`}
            >
              <Icon aria-hidden="true" size={19} />
              {item.mobileLabel}
            </button>
          );
        })}
      </nav>

      {toast && (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white shadow-soft md:bottom-6" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" className="shrink-0 text-leaf-300" size={18} />
          {toast}
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
          <section className="w-full max-w-md rounded-t-2xl bg-paper-50 p-6 shadow-soft sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <p className="eyebrow text-red-700">Remove saved area</p>
            <h2 id="delete-title" className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink-950">Delete “{pendingDelete.title}”?</h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">This removes the item from this browser. It cannot be restored.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingDelete(null)} className="button-secondary focus-ring">Cancel</button>
              <button type="button" onClick={confirmDelete} className="button-primary focus-ring !border-red-700 !bg-red-700 hover:!bg-red-800">Delete area</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

interface NavButtonProps {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}

const NavButton = ({ item, active, onClick, mobile = false }: NavButtonProps) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold transition ${
        mobile ? 'w-full px-3 py-3 text-left' : 'px-3.5 py-2'
      } ${active ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:bg-white/70 hover:text-ink-900'}`}
    >
      <Icon aria-hidden="true" size={17} />
      {item.label}
    </button>
  );
};

export default App;
