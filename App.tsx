import React, { useState, useEffect } from 'react';
import { Calculator, Zap, Bookmark, Map as MapIcon, Settings } from 'lucide-react';
import ConvertScreen from './components/ConvertScreen';
import MeasureScreen from './components/MeasureScreen';
import SavedScreen from './components/SavedScreen';
import VisualizeScreen from './components/VisualizeScreen';
import { ViewState, SavedItem } from './types';
import { loadItems, saveItems } from './lib/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('CONVERT');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [visualizeArea, setVisualizeArea] = useState<number>(1000);

  // Load items on mount
  useEffect(() => {
    const items = loadItems();
    setSavedItems(items);
  }, []);

  const handleSave = (item: SavedItem) => {
    const newItems = [...savedItems, item];
    setSavedItems(newItems);
    saveItems(newItems);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this saved item?")) {
      const newItems = savedItems.filter(i => i.id !== id);
      setSavedItems(newItems);
      saveItems(newItems);
    }
  };

  const handleVisualize = (sqFt: number) => {
    setVisualizeArea(sqFt);
    setActiveTab('VISUALIZE');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Aurora Background Layers */}
      <div className="bg-aurora">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      {/* Main Glass Canvas */}
      <main className="absolute inset-4 md:inset-8 bottom-24 md:bottom-28 glass-panel overflow-hidden flex flex-col">
        {/* Top Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-600/20">
              <span className="font-display font-bold text-white text-lg">N.</span>
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight text-white">
              Napiyo <span className="text-xs font-mono text-brand-300 px-2 py-0.5 rounded-full bg-brand-300/10">2026 ALPHA</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-600/20 to-brand-500/20 border border-brand-600/30 hover:border-brand-600/60 transition-all group">
              <Zap size={16} className="text-brand-300 group-hover:text-white transition-colors" />
              <span className="text-xs font-bold text-brand-300 group-hover:text-white transition-colors">Upgrade</span>
            </button>
            <div className="w-10 h-10 bg-slate-800 border border-white/10 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=NapiyoUser" alt="User" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'CONVERT' && <ConvertScreen onSave={handleSave} onVisualize={handleVisualize} />}
          {activeTab === 'MEASURE' && <MeasureScreen onSave={handleSave} />}
          {activeTab === 'SAVED' && <SavedScreen items={savedItems} onDelete={handleDelete} />}
          {activeTab === 'VISUALIZE' && <VisualizeScreen initialArea={visualizeArea} onBack={() => setActiveTab('CONVERT')} />}
        </div>
      </main>

      {/* Floating Dock (Mac Style) - Hide on Visualize screen? Optional, but keeping for now as standard nav */}
      {activeTab !== 'VISUALIZE' && (
        <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl z-50 transition-all hover:scale-105 hover:bg-slate-900/80">
          <DockItem
            active={activeTab === 'CONVERT'}
            onClick={() => setActiveTab('CONVERT')}
            icon={<Calculator size={22} />}
            label="Converter"
          />
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          <DockItem
            active={activeTab === 'MEASURE'}
            onClick={() => setActiveTab('MEASURE')}
            icon={<MapIcon size={22} />}
            label="Smart Measure"
            isMain
          />
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          <DockItem
            active={activeTab === 'SAVED'}
            onClick={() => setActiveTab('SAVED')}
            icon={<Bookmark size={22} />}
            label="History"
          />
          <DockItem
            active={false}
            onClick={() => { }}
            icon={<Settings size={22} />}
            label="Settings"
          />
        </nav>
      )}

    </div>
  );
};

const DockItem = ({ active, onClick, icon, label, isMain = false }: any) => (
  <button
    onClick={onClick}
    className={`
      group relative flex items-center justify-center transition-all duration-300
      ${isMain ? 'w-16 h-16 mx-1' : 'w-12 h-12'}
      ${active
        ? 'bg-gradient-to-t from-brand-600/80 to-brand-500 text-white shadow-lg shadow-brand-600/30 -translate-y-2'
        : 'hover:bg-white/10 text-slate-400 hover:text-white hover:-translate-y-1'}
    `}
  >
    {icon}
    {/* Tooltip */}
    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
      {label}
    </span>
    {/* Active Dot */}
    {active && <div className="absolute -bottom-2 w-1 h-1 bg-white/80 rounded-full shadow-[0_0_8px_white]"></div>}
  </button>
);

export default App;