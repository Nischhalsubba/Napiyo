import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark, BookOpen, Calculator, CheckCircle2, Code2, Contrast, LandPlot, Languages, MapPinned, Menu,
  Moon, Navigation, ShieldCheck, Sun, Type, X,
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
import { appCopy, LANGUAGE_STORAGE_KEY, readLanguage, type AppLanguage } from './utils/language';

type NavItem = { id: ViewState; label: string; mobileLabel: string; icon: typeof Calculator; mobile?: boolean };

const getInitialView = (): ViewState => {
  const hash = window.location.hash.replace('#', '') as ViewState;
  return ['convert', 'measure', 'gps', 'saved', 'visualize', 'learn'].includes(hash) ? hash : 'convert';
};
const readSetting = (key: string) => localStorage.getItem(key) === 'true';
const readDarkMode = () => {
  const stored = localStorage.getItem('napiyo:dark-mode');
  return stored === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : stored === 'true';
};
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
  const [darkMode, setDarkMode] = useState(readDarkMode);
  const [language, setLanguage] = useState<AppLanguage>(readLanguage);
  const [online, setOnline] = useState(() => navigator.onLine);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const copy = appCopy[language];

  const navItems = useMemo<NavItem[]>(() => [
    { id: 'convert', label: copy.convert, mobileLabel: copy.convert, icon: Calculator, mobile: true },
    { id: 'measure', label: copy.image, mobileLabel: copy.image, icon: MapPinned, mobile: true },
    { id: 'gps', label: copy.gps, mobileLabel: 'GPS', icon: Navigation, mobile: true },
    { id: 'visualize', label: copy.plan, mobileLabel: copy.plan, icon: LandPlot, mobile: true },
    { id: 'saved', label: copy.projects, mobileLabel: copy.projects, icon: Bookmark, mobile: true },
    { id: 'learn', label: copy.learn, mobileLabel: copy.learn, icon: BookOpen },
  ], [copy]);

  useEffect(() => {
    const syncView = () => setActiveView(getInitialView());
    window.addEventListener('hashchange', syncView);
    return () => window.removeEventListener('hashchange', syncView);
  }, []);
  useEffect(() => { void hydrateItems().then((items) => setSavedItems((current) => uniqueItems([...current, ...items]))); }, []);
  useEffect(() => { if (!toast) return undefined; const timeout = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => { document.documentElement.classList.toggle('large-text', largeText); localStorage.setItem('napiyo:large-text', String(largeText)); }, [largeText]);
  useEffect(() => { document.documentElement.classList.toggle('high-contrast', highContrast); localStorage.setItem('napiyo:high-contrast', String(highContrast)); }, [highContrast]);
  useEffect(() => { document.documentElement.classList.toggle('reduced-motion', reducedMotion); localStorage.setItem('napiyo:reduced-motion', String(reducedMotion)); }, [reducedMotion]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('napiyo:dark-mode', String(darkMode));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#151B23' : '#003893');
  }, [darkMode]);
  useEffect(() => {
    document.documentElement.lang = language === 'ne' ? 'ne' : 'en';
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);
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
    setToast(saved ? (language === 'ne' ? 'सुरक्षित परियोजना हटाइयो।' : 'Removed from saved projects.') : (language === 'ne' ? 'परियोजना अद्यावधिक गर्न सकिएन।' : 'This browser could not update saved projects.'));
    setPendingDelete(null);
  };
  const clearAll = async () => {
    await clearItems();
    setSavedItems([]);
    setActiveProject(null);
    setToast(language === 'ne' ? 'यस ब्राउजरबाट सबै स्थानीय Napiyo परियोजना हटाइयो।' : 'All local Napiyo projects were removed from this browser.');
  };
  const visualize = (sqFt: number) => { setActiveProject(null); setVisualizedArea(sqFt); navigate('visualize', true); };
  const openProject = (item: SavedItem) => {
    setActiveProject(item);
    setVisualizedArea(item.sqFt);
    if (item.type === 'GPS') navigate('gps', true);
    else if (item.type === 'MEASURED') navigate('measure', true);
    else navigate('visualize', true);
  };

  const LanguageSwitch = ({ mobile = false }: { mobile?: boolean }) => <div className={`flex items-center rounded-xl border border-paper-300 bg-paper-100 p-1 ${mobile ? 'w-full' : ''}`} role="group" aria-label={copy.language}>
    <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={`focus-ring rounded-lg px-2.5 py-2 text-xs font-bold ${mobile ? 'flex-1' : ''} ${language === 'en' ? 'bg-white text-leaf-800 shadow-sm ring-1 ring-leaf-200' : 'text-ink-500 hover:text-ink-900'}`}>English</button>
    <button type="button" onClick={() => setLanguage('ne')} aria-pressed={language === 'ne'} className={`focus-ring rounded-lg px-2.5 py-2 text-xs font-bold ${mobile ? 'flex-1' : ''} ${language === 'ne' ? 'bg-white text-leaf-800 shadow-sm ring-1 ring-leaf-200' : 'text-ink-500 hover:text-ink-900'}`}>नेपाली</button>
  </div>;

  const AccessibilityButtons = ({ mobile = false }: { mobile?: boolean }) => <div className={mobile ? 'grid grid-cols-4 gap-2 border-t border-paper-200 pt-3' : 'flex items-center gap-2'}>
    <button type="button" onClick={() => setDarkMode((value) => !value)} aria-pressed={darkMode} className={`${mobile ? 'button-secondary' : 'icon-button'} focus-ring ${darkMode ? '!border-leaf-500 !bg-leaf-50 !text-leaf-800' : ''}`} aria-label={darkMode ? 'Use light appearance' : 'Use dark appearance'}>{darkMode ? <Sun size={18}/> : <Moon size={18}/>} {mobile && <span>{copy.theme}</span>}</button>
    <button type="button" onClick={() => setLargeText((value) => !value)} aria-pressed={largeText} className={`${mobile ? 'button-secondary' : 'icon-button'} focus-ring ${largeText ? '!border-leaf-500 !bg-leaf-50 !text-leaf-800' : ''}`} aria-label="Toggle larger text"><Type size={18}/>{mobile && <span>{copy.text}</span>}</button>
    <button type="button" onClick={() => setHighContrast((value) => !value)} aria-pressed={highContrast} className={`${mobile ? 'button-secondary' : 'icon-button'} focus-ring ${highContrast ? '!border-leaf-500 !bg-leaf-50 !text-leaf-800' : ''}`} aria-label="Toggle high contrast"><Contrast size={18}/>{mobile && <span>{copy.contrast}</span>}</button>
    <button type="button" onClick={() => setReducedMotion((value) => !value)} aria-pressed={reducedMotion} className={`${mobile ? 'button-secondary' : 'icon-button'} focus-ring ${reducedMotion ? '!border-leaf-500 !bg-leaf-50 !text-leaf-800' : ''}`} aria-label="Toggle reduced motion"><span aria-hidden="true">◫</span>{mobile && <span>{copy.motion}</span>}</button>
  </div>;

  const mobileItems = navItems.filter((item) => item.mobile);

  return <div className="app-shell pb-20 text-ink-950 md:pb-0">
    <header className="app-header z-40 border-b border-paper-200/80 bg-white/82 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[96rem] items-center justify-between px-4 sm:px-6 lg:px-8"><button type="button" onClick={() => navigate('convert')} className="focus-ring flex items-center gap-3 rounded-xl text-left"><span className="brand-mark flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-card"><LandPlot size={20}/></span><span><span className="block text-base font-bold text-ink-950">Napiyo<span className="brand-accent">.</span></span><span className="hidden text-xs font-medium text-ink-500 sm:block">{copy.tagline}</span></span></button>
      <nav className="hidden items-center rounded-xl border border-white/80 bg-white/72 p-1 shadow-sm lg:flex" aria-label="Primary navigation">{navItems.map((item) => <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)}/>)}</nav>
      <div className="hidden items-center gap-2 md:flex"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${online ? 'bg-success-50 text-success-700' : 'bg-saffron-50 text-saffron-700'}`}>{online ? copy.online : copy.offline}</span><LanguageSwitch/><AccessibilityButtons/><a href="https://github.com/Nischhalsubba/Napiyo" target="_blank" rel="noreferrer" className="icon-button focus-ring" aria-label="View source code"><Code2 size={18}/></a></div>
      <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="icon-button focus-ring md:hidden" aria-expanded={mobileMenuOpen} aria-label="Open navigation">{mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}</button></div>
      {mobileMenuOpen && <nav className="border-t border-paper-200 bg-white/96 px-4 py-3 md:hidden" aria-label="Mobile navigation"><div className="mx-auto grid max-w-[86rem] gap-2">{navItems.map((item) => <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => navigate(item.id)} mobile/>)}<div className="flex items-center gap-2 pt-2"><Languages size={17} className="text-leaf-700"/><span className="text-sm font-semibold text-ink-700">{copy.language}</span></div><LanguageSwitch mobile/><AccessibilityButtons mobile/></div></nav>}
    </header>
    <main id="main-content" className="app-main scrollbar-thin">
      {activeView === 'convert' && <ConvertScreen language={language} onSave={handleSave} onVisualize={visualize} notify={setToast}/>} 
      {activeView === 'measure' && activeProject?.type === 'MEASURED' && <SavedMeasurementReview project={activeProject} onBack={() => navigate('saved')} onStartNew={() => { setActiveProject(null); navigate('measure', true); }} onVisualize={visualize}/>} 
      {activeView === 'measure' && activeProject?.type !== 'MEASURED' && <MeasureScreen onSave={handleSave} notify={setToast}/>} 
      {activeView === 'gps' && <GpsMeasureScreen onSave={handleSave} notify={setToast} initialProject={activeProject}/>} 
      {activeView === 'saved' && <SavedScreen items={savedItems} onDelete={(id) => setPendingDelete(savedItems.find((item) => item.id === id) ?? null)} onOpen={openProject} onClearAll={clearAll} onImport={handleImport} notify={setToast}/>} 
      {activeView === 'visualize' && <VisualizeScreen initialArea={visualizedArea} initialProject={activeProject} onBack={() => navigate('saved')} onSave={handleSave} notify={setToast}/>} 
      {activeView === 'learn' && <LearnScreen/>}
    </main>
    <footer className="app-footer hidden border-t border-paper-200/80 bg-white/78 backdrop-blur-xl md:block"><div className="mx-auto flex max-w-[96rem] items-center justify-between gap-6 px-6 py-3 lg:px-8"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700"><ShieldCheck size={17}/></span><p className="truncate text-xs text-ink-500"><strong className="font-semibold text-ink-800">{copy.planning}</strong> {copy.storage}</p></div><button type="button" onClick={() => navigate('learn')} className="button-quiet focus-ring shrink-0 !min-h-9 !px-3 !py-1.5"><BookOpen size={15}/>{copy.learn}</button></div></footer>
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-paper-200 bg-white/94 px-2 pt-2 backdrop-blur-xl md:hidden" aria-label="Bottom navigation">{mobileItems.map((item) => { const Icon = item.icon; const active = activeView === item.id; return <button key={item.id} type="button" onClick={() => navigate(item.id)} aria-current={active ? 'page' : undefined} className={`focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${active ? 'bg-leaf-100 text-leaf-800 ring-1 ring-leaf-200' : 'text-ink-500'}`}><Icon size={18}/>{item.mobileLabel}</button>; })}</nav>
    {toast && <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white shadow-soft md:bottom-16" role="status" aria-live="polite"><CheckCircle2 className="shrink-0 text-leaf-300" size={18}/>{toast}</div>}
    {pendingDelete && <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/48 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation"><section className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-soft sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-title"><p className="eyebrow !text-error-500">{language === 'ne' ? 'सुरक्षित परियोजना हटाउनुहोस्' : 'Remove saved project'}</p><h2 id="delete-title" className="mt-2 text-2xl font-bold text-ink-950">{language === 'ne' ? `“${pendingDelete.title}” हटाउने?` : `Delete “${pendingDelete.title}”?`}</h2><p className="mt-3 text-sm leading-6 text-ink-600">{language === 'ne' ? 'यसले परियोजना यस ब्राउजरबाट हटाउँछ। पछि आवश्यक पर्न सक्छ भने पहिले ब्याकअप निर्यात गर्नुहोस्।' : 'This removes the project from this browser. Export a backup first if you may need it later.'}</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button ref={cancelDeleteRef} type="button" onClick={() => setPendingDelete(null)} className="button-secondary focus-ring">{language === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}</button><button type="button" onClick={confirmDelete} className="button-primary focus-ring !border-error-500 !bg-error-500 hover:!border-error-700 hover:!bg-error-700">{language === 'ne' ? 'परियोजना हटाउनुहोस्' : 'Delete project'}</button></div></section></div>}
  </div>;
};

interface NavButtonProps { item: NavItem; active: boolean; onClick: () => void; mobile?: boolean; }
const NavButton = ({ item, active, onClick, mobile = false }: NavButtonProps) => { const Icon = item.icon; return <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold ${mobile ? 'w-full px-3 py-3 text-left' : 'px-3 py-2'} ${active ? 'bg-leaf-100 text-leaf-800 shadow-sm ring-1 ring-leaf-200' : 'text-ink-500 hover:bg-leaf-50 hover:text-ink-900'}`}><Icon size={17}/>{item.label}</button>; };
export default App;
