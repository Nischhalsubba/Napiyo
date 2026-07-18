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
    window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
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
    <div className="app-shell pb-20 text-ink-950 md:pb-0">
      <header className="app-header z-40 border-b border-paper-200/80 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[86rem] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('convert')} className="focus-ring flex items-center gap-3 rounded-xl text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-card">
              <LandPlot size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold tracking-[-0.02em] text-ink-950">Napiyo</span>
              <span className="hidden text-xs font-medium text-ink-500 sm:block">Land measurements, made readable</span>
            </span>
          </button>

          <nav className="hidden items-center rounded-xl border border-white/80 bg-white/72 p-1 shadow-sm md:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)} />
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a href="https://github.com/Nischhalsubba/Napiyo" target="_blank" rel="noreferrer" className="icon-button focus-ring" aria-label="View Napiyo source code">
              <Code2 aria-hidden="true" size={18} />
            </a>
          </div>

          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="icon-button focus-ring md:hidden" aria-expanded={mobileMenuOpen} aria-label="Open navigation">
            {mobileMenuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-paper-200 bg-white/96 px-4 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto grid max-w-[86rem] gap-1">
              {NAV_ITEMS.map((item) => (
                <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)} mobile />
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="app-main scrollbar-thin">
        {activeView === 'convert' && <ConvertScreen onSave={handleSave} onVisualize={visualize} notify={setToast} />}
        {activeView === 'measure' && <MeasureScreen onSave={handleSave} notify={setToast} />}
        {activeView === 'saved' && <SavedScreen items={savedItems} onDelete={(id) => setPendingDelete(savedItems.find((item) => item.id === id) ?? null)} onVisualize={visualize} notify={setToast} />}
        {activeView === 'visualize' && <VisualizeScreen initialArea={visualizedArea} onBack={() => navigate('convert')} />}
      </main>

      <footer className="app-footer hidden border-t border-paper-200/80 bg-white/78 backdrop-blur-xl md:block">
        <div className="mx-auto flex max-w-[86rem] items-center justify-between gap-6 px-6 py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700">
              <ShieldCheck aria-hidden="true" size={17} />
            </span>
            <p className="truncate text-xs text-ink-500"><strong className="font-semibold text-ink-800">Planning aid, not a survey record.</strong> Confirm official area and boundaries with cadastral records.</p>
          </div>
          <a href="https://github.com/Nischhalsubba/Napiyo" target="_blank" rel="noreferrer" className="button-quiet focus-ring shrink-0 !min-h-9 !px-3 !py-1.5">
            <Code2 aria-hidden="true" size={15} />Source
          </a>
        </div>
      </footer>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-paper-200 bg-white/94 px-2 pt-2 backdrop-blur-xl md:hidden" aria-label="Bottom navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button key={item.id} type="button" onClick={() => navigate(item.id)} aria-current={active ? 'page' : undefined} className={`focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition ${active ? 'bg-leaf-100 text-leaf-800 ring-1 ring-leaf-200' : 'text-ink-500 hover:bg-paper-100 hover:text-ink-950'}`}>
              <Icon aria-hidden="true" size={19} />{item.mobileLabel}
            </button>
          );
        })}
      </nav>

      {toast && (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white shadow-soft md:bottom-16" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" className="shrink-0 text-leaf-300" size={18} />{toast}
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/48 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
          <section className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-soft sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <p className="eyebrow text-red-700">Remove saved area</p>
            <h2 id="delete-title" className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ink-950">Delete “{pendingDelete.title}”?</h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">This removes the item from this browser. It cannot be restored.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingDelete(null)} className="button-secondary focus-ring">Cancel</button>
              <button type="button" onClick={confirmDelete} className="button-primary focus-ring !border-red-600 !bg-red-600 hover:!bg-red-700">Delete area</button>
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
    <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold transition ${mobile ? 'w-full px-3 py-3 text-left' : 'px-3.5 py-2'} ${active ? 'bg-leaf-100 text-leaf-800 shadow-sm ring-1 ring-leaf-200' : 'text-ink-500 hover:bg-sky-50 hover:text-ink-900'}`}>
      <Icon aria-hidden="true" size={17} />{item.label}
    </button>
  );
};

export default App;
