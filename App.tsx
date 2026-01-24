import React, { useState, useEffect } from 'react';
import { Calculator, Scaling, Bookmark, Map, Settings, Zap } from 'lucide-react';
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
    <div className="h-screen w-full flex overflow-hidden bg-mesh font-sans text-slate-900">

      {/* Sidebar Rail */}
      <nav className="
        hidden md:flex flex-col items-center py-8 gap-6 w-24 z-30 h-full backdrop-blur-sm
      ">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-soft flex items-center justify-center mb-4">
          {/* Logo Stand-in */}
          <div className="w-6 h-6 bg-gradient-to-tr from-primary-500 to-emerald-300 rounded-full"></div>
        </div>

        <div className="flex flex-col gap-4">
          <NavButton
            active={activeTab === 'CONVERT'}
            onClick={() => setActiveTab('CONVERT')}
            icon={<Calculator size={24} />}
            tooltip="Convert"
          />
          <NavButton
            active={activeTab === 'MEASURE'}
            onClick={() => setActiveTab('MEASURE')}
            icon={<Map size={24} />}
            tooltip="Measure"
          />
          <NavButton
            active={activeTab === 'SAVED'}
            onClick={() => setActiveTab('SAVED')}
            icon={<Bookmark size={24} />}
            tooltip="Saved"
          />
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <Settings size={22} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Napi" alt="User" />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative p-4 md:p-6 overflow-hidden">
        {/* Glass Card Container */}
        <div className="w-full h-full bg-glass rounded-[2rem] shadow-glass backdrop-blur-3xl overflow-hidden relative flex flex-col border border-white/40">

          {/* Header Area inside Card */}
          <div className="h-20 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
                {activeTab === 'CONVERT' && 'Unit Converter'}
                {activeTab === 'MEASURE' && 'Smart Measure'}
                {activeTab === 'SAVED' && 'Saved Items'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold tracking-wide uppercase">v2.0 Beta</span>
            </div>

            <button className="hidden md:flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:bg-accent-hover transition-transform hover:scale-105 active:scale-95">
              <Zap size={16} className="text-yellow-400 fill-yellow-400" /> Upgrade Plan
            </button>
          </div>

          {/* Content Canvas */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'CONVERT' && <ConvertScreen onSave={handleSave} />}
            {activeTab === 'MEASURE' && <MeasureScreen onSave={handleSave} />}
            {activeTab === 'SAVED' && <SavedScreen items={savedItems} onDelete={handleDelete} />}
          </div>

        </div>
      </main>

      {/* Mobile Floating Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full px-6 py-3 flex gap-8 items-center">
        <MobileNavButton
          active={activeTab === 'CONVERT'}
          onClick={() => setActiveTab('CONVERT')}
          icon={<Calculator size={24} />}
        />
        <MobileNavButton
          active={activeTab === 'MEASURE'}
          onClick={() => setActiveTab('MEASURE')}
          icon={<Map size={24} />}
        />
        <MobileNavButton
          active={activeTab === 'SAVED'}
          onClick={() => setActiveTab('SAVED')}
          icon={<Bookmark size={24} />}
        />
      </div>

    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tooltip?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, tooltip }) => (
  <button
    onClick={onClick}
    className={`
      w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group
      ${active
        ? 'bg-accent text-white shadow-lg scale-110'
        : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}
    `}
    title={tooltip}
  >
    {icon}
    {active && <div className="absolute -right-1 top-1 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></div>}
  </button>
);

const MobileNavButton: React.FC<NavButtonProps> = ({ active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`
      transition-all duration-300
      ${active
        ? 'text-white scale-110'
        : 'text-slate-500 active:scale-95'}
    `}
  >
    {icon}
  </button>
);

export default App;