import { useEffect, useRef, useState } from 'react';
import {
  Bookmark, BookOpen, Calculator, CheckCircle2, Code2, Contrast, LandPlot, MapPinned, Menu,
  Navigation, ShieldCheck, Type, X,
} from 'lucide-react';
import ConvertScreen from './components/ConvertScreen';
import GpsMeasureScreen from './components/GpsMeasureScreen';
import LearnScreen from './components/LearnScreen';
import MeasureScreen from './components/MeasureScreen';
import SavedMeasurementReview from './components/SavedMeasurementReview';
import SavedScreen from './components/SavedScreen';
import VisualizeScreen from './components/VisualizeScreen';
import { clearItems, hydrateItems, loadItems, saveItems } from './lib/storage';
import { SavedItem, ViewState } from './types';

const NAV_ITEMS: { id: ViewState; label: string; mobileLabel: string; icon: typeof Calculator; mobile?: boolean }[] = [
  { id: 'convert', label: 'Convert', mobileLabel: 'Convert', icon: Calculator, mobile: true },
  { id: 'measure', label: 'Image', mobileLabel: 'Image', icon: MapPinned, mobile: true },
  { id: 'gps', label: 'Field GPS', mobileLabel: 'GPS', icon: Navigation, mobile: true },
  { id: 'visualize', label: 'Plan', mobileLabel: 'Plan', icon: LandPlot, mobile: true },
  { id: 'saved', label: 'Projects', mobileLabel: 'Projects', icon: Bookmark, mobile: true },
  { id: 'learn', label: 'Learn', mobileLabel: 'Learn', icon: BookOpen },
];

const getInitialView = (): ViewState => {
  const hash = window.location.hash.replace('#', '') as ViewState;
  return ['convert', 'measure', 'gps', 'saved', 'visualize', 'learn'].includes(hash) ? hash : 'convert';
};
const readSetting = (key: string) => localStorage.getItem(key) === 'true';
const uniqueItems = (items: SavedItem[]) => items.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);

const App = () => {
  const [activeView, setActiveView] = useState<ViewState>(getInitialView);
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => loadItems());
  const [activeProject, setActiveProject] = useState<SavedItem | null>(null);
  const [visualizedArea, setVisualizedArea] = useState(1000);
  const [toast, setToast] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SavedItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [largeText, setLargeText] = useState(() => readSetting('napiyo:large-text'));
  const [highContrast, setHighContrast] = useState(() => readSetting('napiyo:high-contrast'));
  const [reducedMotion, setReducedMotion] = useState(() => readSetting('napiyo:reduced-motion'));
  const [online, setOnline] = useState(() => navigator.onLine);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const syncView = () => setActiveView(getInitialView());
    window.addEventListener('hashchange', syncView);
    return () => window.removeEventListener('hashchange', syncView);
  }, []);
  useEffect(() => {
    void hydrateItems().then((items) => {
      setSavedItems((current) => uniqueItems([...current, ...items]));
    });
  }, []);
  useEffect(() => { if (!toast) return undefined; const timeout = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => { document.documentElement.classList.toggle('large-text', largeText); localStorage.setItem('napiyo:large-text', String(largeText)); }, [largeText]);
  useEffect(() => { document.documentElement.classList.toggle('high-contrast', highContrast); localStorage.setItem('napiyo:high-contrast', String(highContrast)); }, [highContrast]);
  useEffect(() => { document.documentElement.classList.toggle('reduced-motion', reducedMotion); localStorage.setItem('napiyo:reduced-motion', String(reducedMotion)); }, [reducedMotion]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if (!pendingDelete) return undefined;
    cancelDeleteRef.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setPendingDelete(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [pendingDelete]);

  const navigate = (view: ViewState, preserveProject = false) => {
    if (!preserveProject) setActiveProject(null);
    window.location.hash = view;
    setActiveView(view);
    setMobileMenuOpen(false);
    requestAnimationFrame(() => document.getElementById('main-content')?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
  };
  const persist = (next: SavedItem[]) => { const safe = uniqueItems(next); const saved = saveItems(safe); if (saved) setSavedItems(safe); return saved; };
  const handleSave = (item: SavedItem): boolean => persist([item, ...savedItems]);
  const handleImport = (items: SavedItem[]): number => {
    const used = new Set(savedItems.map((item) => item.id));
    const fresh = items.map((item) => {
      let next = item;
      if (used.has(next.id)) next = { ...next, id: crypto.randomUUID(), title: `${next.title} (imported)` };
      used.add(next.id);
      return next;
    });
    return persist([...fresh, ...savedItems]) ? fresh.length : 0;
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    const saved = persist(savedItems.filter((item) => item.id !== pendingDelete.id));
    setToast(saved ? 'Removed from saved projects.' : 'This browser could not update saved projects.');
    setPendingDelete(null);
  };
  const clearAll = async () => {
    await clearItems();
    setSavedItems([]);
    setActiveProject(null);
    setToast('All local Napiyo projects were removed from this browser.');
  };
  const visualize = (sqFt: number) => { setActiveProject(null); setVisualizedArea(sqFt); navigate('visualize', true); };
  const openProject = (item: SavedItem) => {
    setActiveProject(item);
    setVisualizedArea(item.sqFt);
    if (item.type === 'GPS') navigate('gps', true);
    else if (item.type === 'MEASURED') navigate('measure', true);
    else navigate('visualize', true);
  };

  const AccessibilityButtons = ({ mobile = false }: { mobile?: boolean }) => <div className={mobile ? 'grid grid-cols-3 gap-2 border-t border-paper-200 pt-3' : 'flex items-center gap-2'}>
    <button type="button" onClick={() => setLargeText((value) => !value)} aria-pressed={largeText} className={`${mobile ? 'button-secondary' : 'icon-button'} focus-ring ${largeText ? '!border-leaf-500 !bg-leaf-50 !text-leaf-800' : ''}`} aria-label="Toggle larger text"><Type size={18}/>{mobile && <span>Text</span>}</button>
    <button type="button" onClick={() => setHighContrast((value) => !value)} aria-pressed={highContrast} className={`${mobile ? 'button-secondary' : 'icon-button'} focus-ring ${highContrast ? '!border-leaf-500 !bg-leaf-50 !text-leaf-800' : ''}`} aria-label="Toggle high contrast"><Contrast size={18}/>{mobile && <span>Contrast</span>}</button>
    <button type="button" onClick={() => setReducedMotion((value) => !value)} aria-pressed={reducedMotion} className={`${mobile ? 'button-secondary' : 'icon-button'} focus-ring ${reducedMotion ? '!border-leaf-500 !bg-leaf-50 !text-leaf-800' : ''}`} aria-label="Toggle reduced motion"><span aria-hidden="true">◫</span>{mobile && <span>Motion</span>}</button>
  </div>;

  const mobileItems = NAV_ITEMS.filter((item) => item.mobile);

  return <div className="app-shell pb-20 text-ink-950 md:pb-0">
    <header className="app-header z-40 border-b border-paper-200/80 bg-white/82 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[96rem] items-center justify-between px-4 sm:px-6 lg:px-8"><button type="button" onClick={() => navigate('convert')} className="focus-ring flex items-center gap-3 rounded-xl text-left"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-card"><LandPlot size={20}/></span><span><span className="block text-base font-bold text-ink-950">Napiyo</span><span className="hidden text-xs font-medium text-ink-500 sm:block">Land measurements, made readable</span></span></button>
      <nav className="hidden items-center rounded-xl border border-white/80 bg-white/72 p-1 shadow-sm lg:flex" aria-label="Primary navigation">{NAV_ITEMS.map((item) => <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)}/>)}</nav>
      <div className="hidden items-center gap-2 md:flex"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${online ? 'bg-leaf-50 text-leaf-800' : 'bg-saffron-50 text-saffron-800'}`}>{online ? 'Online' : 'Offline'}</span><AccessibilityButtons/><a href="https://github.com/Nischhalsubba/Napiyo" target="_blank" rel="noreferrer" className="icon-button focus-ring" aria-label="View source code"><Code2 size={18}/></a></div>
      <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="icon-button focus-ring md:hidden" aria-expanded={mobileMenuOpen} aria-label="Open navigation">{mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}</button></div>
      {mobileMenuOpen && <nav className="border-t border-paper-200 bg-white/96 px-4 py-3 md:hidden" aria-label="Mobile navigation"><div className="mx-auto grid max-w-[86rem] gap-1">{NAV_ITEMS.map((item) => <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)} mobile/>)}<AccessibilityButtons mobile/></div></nav>}
    </header>
    <main id="main-content" className="app-main scrollbar-thin">
      {activeView === 'convert' && <ConvertScreen onSave={handleSave} onVisualize={visualize} notify={setToast}/>} 
      {activeView === 'measure' && activeProject?.type === 'MEASURED' && <SavedMeasurementReview project={activeProject} onBack={() => navigate('saved')} onStartNew={() => { setActiveProject(null); navigate('measure', true); }} onVisualize={visualize}/>} 
      {activeView === 'measure' && activeProject?.type !== 'MEASURED' && <MeasureScreen onSave={handleSave} notify={setToast}/>} 
      {activeView === 'gps' && <GpsMeasureScreen onSave={handleSave} notify={setToast} initialProject={activeProject}/>} 
      {activeView === 'saved' && <SavedScreen items={savedItems} onDelete={(id) => setPendingDelete(savedItems.find((item) => item.id === id) ?? null)} onOpen={openProject} onClearAll={clearAll} onImport={handleImport} notify={setToast}/>} 
      {activeView === 'visualize' && <VisualizeScreen initialArea={visualizedArea} initialProject={activeProject} onBack={() => navigate('saved')} onSave={handleSave} notify={setToast}/>} 
      {activeView === 'learn' && <LearnScreen/>}
    </main>
    <footer className="app-footer hidden border-t border-paper-200/80 bg-white/78 backdrop-blur-xl md:block"><div className="mx-auto flex max-w-[96rem] items-center justify-between gap-6 px-6 py-3 lg:px-8"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700"><ShieldCheck size={17}/></span><p className="truncate text-xs text-ink-500"><strong className="font-semibold text-ink-800">Planning aid, not a survey record.</strong> Projects are stored locally and are not encrypted by Napiyo.</p></div><button type="button" onClick={() => navigate('learn')} className="button-quiet focus-ring shrink-0 !min-h-9 !px-3 !py-1.5"><BookOpen size={15}/>Learn</button></div></footer>
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-paper-200 bg-white/94 px-2 pt-2 backdrop-blur-xl md:hidden" aria-label="Bottom navigation">{mobileItems.map((item) => { const Icon = item.icon; const active = activeView === item.id; return <button key={item.id} type="button" onClick={() => navigate(item.id)} aria-current={active ? 'page' : undefined} className={`focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${active ? 'bg-leaf-100 text-leaf-800 ring-1 ring-leaf-200' : 'text-ink-500'}`}><Icon size={18}/>{item.mobileLabel}</button>; })}</nav>
    {toast && <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white shadow-soft md:bottom-16" role="status" aria-live="polite"><CheckCircle2 className="shrink-0 text-leaf-300" size={18}/>{toast}</div>}
    {pendingDelete && <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/48 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation"><section className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-soft sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-title"><p className="eyebrow text-red-700">Remove saved project</p><h2 id="delete-title" className="mt-2 text-2xl font-bold text-ink-950">Delete “{pendingDelete.title}”?</h2><p className="mt-3 text-sm leading-6 text-ink-600">This removes the project from this browser. Export a backup first if you may need it later.</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button ref={cancelDeleteRef} type="button" onClick={() => setPendingDelete(null)} className="button-secondary focus-ring">Cancel</button><button type="button" onClick={confirmDelete} className="button-primary focus-ring !border-red-600 !bg-red-600">Delete project</button></div></section></div>}
  </div>;
};

interface NavButtonProps { item: (typeof NAV_ITEMS)[number]; active: boolean; onClick: () => void; mobile?: boolean; }
const NavButton = ({ item, active, onClick, mobile = false }: NavButtonProps) => { const Icon = item.icon; return <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold ${mobile ? 'w-full px-3 py-3 text-left' : 'px-3 py-2'} ${active ? 'bg-leaf-100 text-leaf-800 shadow-sm ring-1 ring-leaf-200' : 'text-ink-500 hover:bg-sky-50 hover:text-ink-900'}`}><Icon size={17}/>{item.label}</button>; };
export default App;
