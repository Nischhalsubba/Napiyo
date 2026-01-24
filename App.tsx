import React, { useState, useEffect } from 'react';
import { Calculator, Scaling, Bookmark, Map } from 'lucide-react';
import ConvertScreen from './components/ConvertScreen';
import MeasureScreen from './components/MeasureScreen';
import SavedScreen from './components/SavedScreen';
import { ViewState, SavedItem } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('CONVERT');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('napi_saved_items');
    if (saved) {
      try {
        setSavedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved items", e);
      }
    }
  }, []);

  const handleSave = (item: SavedItem) => {
    const newItems = [...savedItems, item];
    setSavedItems(newItems);
    localStorage.setItem('napi_saved_items', JSON.stringify(newItems));
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this saved item?")) {
      const newItems = savedItems.filter(i => i.id !== id);
      setSavedItems(newItems);
      localStorage.setItem('napi_saved_items', JSON.stringify(newItems));
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-surface-50 font-sans">
      
      {/* Desktop Sidebar */}
      <nav className="
        hidden md:flex bg-white border-r border-surface-200 
        flex-col justify-start p-6 gap-2 w-72 z-30 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]
      ">
        <div className="px-2 mb-8 mt-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Napi<span className="text-primary-500">.</span></h1>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">Hamro Tools</p>
        </div>

        <NavButton 
          active={activeTab === 'CONVERT'} 
          onClick={() => setActiveTab('CONVERT')} 
          icon={<Calculator size={20} />} 
          label="Convert" 
          description="Area units converter"
        />
        <NavButton 
          active={activeTab === 'MEASURE'} 
          onClick={() => setActiveTab('MEASURE')} 
          icon={<Map size={20} />} 
          label="Measure" 
          description="Map & image analysis"
        />
        <NavButton 
          active={activeTab === 'SAVED'} 
          onClick={() => setActiveTab('SAVED')} 
          icon={<Bookmark size={20} />} 
          label="Saved" 
          description="History & comparison"
        />
        
        <div className="mt-auto p-6 bg-surface-50 rounded-2xl border border-surface-100">
           <div className="text-xs font-bold text-slate-400 mb-2">PRO TIP</div>
           <p className="text-xs text-slate-500 leading-relaxed">
             For accurate measurements, ensure your reference line is as long as possible.
           </p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative">
        {activeTab === 'CONVERT' && <ConvertScreen onSave={handleSave} />}
        {activeTab === 'MEASURE' && <MeasureScreen onSave={handleSave} />}
        {activeTab === 'SAVED' && <SavedScreen items={savedItems} onDelete={handleDelete} />}
      </main>

      {/* Mobile Floating Nav */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-200/50 rounded-2xl p-2 flex justify-around items-center">
        <MobileNavButton 
          active={activeTab === 'CONVERT'} 
          onClick={() => setActiveTab('CONVERT')} 
          icon={<Calculator size={22} strokeWidth={2.5} />} 
          label="Convert" 
        />
        <MobileNavButton 
          active={activeTab === 'MEASURE'} 
          onClick={() => setActiveTab('MEASURE')} 
          icon={<Map size={22} strokeWidth={2.5} />} 
          label="Measure" 
        />
        <MobileNavButton 
          active={activeTab === 'SAVED'} 
          onClick={() => setActiveTab('SAVED')} 
          icon={<Bookmark size={22} strokeWidth={2.5} />} 
          label="Saved" 
        />
      </div>

    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, description }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group
      ${active 
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-300' 
        : 'text-slate-500 hover:bg-surface-50 hover:text-slate-900'}
    `}
  >
    <div className={`${active ? 'text-primary-400' : 'text-slate-400 group-hover:text-primary-500'} transition-colors`}>{icon}</div>
    <div>
      <div className="font-bold text-sm">{label}</div>
      {description && <div className={`text-[10px] font-medium ${active ? 'text-slate-400' : 'text-slate-400'}`}>{description}</div>}
    </div>
  </button>
);

const MobileNavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center p-3 rounded-xl transition-all w-20
      ${active 
        ? 'text-primary-600 bg-primary-50 scale-105' 
        : 'text-slate-400 hover:text-slate-600 active:scale-95'}
    `}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-[10px] font-bold tracking-tight">{label}</span>
  </button>
);

export default App;