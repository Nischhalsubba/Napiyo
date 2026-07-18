import { useEffect, useState } from 'react';
import {
  Bookmark,
  Calculator,
  CheckCircle2,
  Github,
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

const NAV_ITEMS: { id: Exclude<ViewState, 'visualize'>; label: string; shortLabel: string; icon: typeof Calculator }[] = [
  { id: 'convert', label: 'Convert area', shortLabel: 'Convert', icon: Calculator },
  { id: 'measure', label: 'Estimate a plot', shortLabel: 'Measure', icon: MapPinned },
  { id: 'saved', label: 'Saved areas', shortLabel: 'Saved', icon: Bookmark },
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
      setToast('Saved area deleted.');
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
      <header className="sticky top-0 z-40 border-b border-paper-300/80 bg-paper-100/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('convert')} className="focus-ring flex items-center gap-3 rounded-xl text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-lg font-bold text-white shadow-card">N</span>
            <span>
              <span className="block text-lg font-bold leading-5 text-ink-950">Napiyo</span>
              <span className="hidden text-xs font-semibold text-ink-500 sm:block">Land area tools for Nepal</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)} />
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="https://github.com/Nischhalsubba/Napiyo"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-600 hover:bg-white hover:text-ink-950"
              aria-label="Open Napiyo on GitHub"
            >
              <Github aria-hidden="true" size={19} />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 hover:bg-white md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-paper-300 bg-paper-50 px-4 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto grid max-w-7xl gap-2">
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

      <footer className="border-t border-paper-300 bg-paper-50/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-ink-950">
              <ShieldCheck aria-hidden="true" size={18} className="text-leaf-700" />
              Estimate responsibly
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">
              Napiyo helps with conversion, comparison, and early understanding. Verify legal land area and boundaries with official records and a licensed survey professional.
            </p>
          </div>
          <a
            href="https://github.com/Nischhalsubba/Napiyo"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-ink-600 hover:text-ink-950"
          >
            <Github aria-hidden="true" size={17} />
            View source
          </a>
        </div>
      </footer>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-paper-300 bg-paper-50/95 px-2 pt-2 backdrop-blur-xl md:hidden" aria-label="Bottom navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition ${
                active ? 'bg-leaf-100 text-leaf-800' : 'text-ink-500 hover:bg-paper-100 hover:text-ink-950'
              }`}
            >
              <Icon aria-hidden="true" size={20} />
              {item.shortLabel}
            </button>
          );
        })}
      </nav>

      {toast && (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white shadow-soft md:bottom-6" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" className="shrink-0 text-leaf-300" size={19} />
          {toast}
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
          <section className="w-full max-w-md rounded-t-3xl bg-paper-50 p-6 shadow-soft sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <Bookmark aria-hidden="true" size={22} />
            </span>
            <h2 id="delete-title" className="mt-5 text-2xl font-bold text-ink-950">Delete this saved area?</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              “{pendingDelete.title}” will be removed from this browser. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="focus-ring min-h-12 rounded-xl border border-paper-300 bg-white px-4 font-bold text-ink-700 hover:bg-paper-50"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="focus-ring min-h-12 rounded-xl bg-red-700 px-4 font-bold text-white hover:bg-red-800"
              >
                Delete saved area
              </button>
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
      className={`focus-ring inline-flex items-center gap-2 rounded-xl font-bold transition ${
        mobile ? 'w-full px-4 py-3 text-left' : 'px-4 py-2.5 text-sm'
      } ${active ? 'bg-ink-950 text-white' : 'text-ink-600 hover:bg-white hover:text-ink-950'}`}
    >
      <Icon aria-hidden="true" size={18} />
      {item.label}
    </button>
  );
};

export default App;
