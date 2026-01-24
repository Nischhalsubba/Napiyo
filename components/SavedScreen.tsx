import React, { useState, useMemo } from 'react';
import { Trash2, Copy, Calendar, Tag, ArrowRight, Search, GitCompare } from 'lucide-react';
import { SavedItem } from '../types';
import { formatDecimal, getHillsBreakdown, getTeraiBreakdown } from '../utils/conversions';
import SegmentedControl from './SegmentedControl';

interface SavedScreenProps {
  items: SavedItem[];
  onDelete: (id: string) => void;
}

const SavedScreen: React.FC<SavedScreenProps> = ({ items, onDelete }) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtering
  const filteredItems = useMemo(() => {
    let res = items;
    if (activeTab === 'MEASURED') res = res.filter(i => i.type === 'MEASURED');
    if (activeTab === 'CONVERTED') res = res.filter(i => i.type === 'CONVERTED');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(i => i.title.toLowerCase().includes(q));
    }
    return res;
  }, [items, activeTab, searchQuery]);

  // Compare Logic
  const canCompare = selectedIds.length === 2;
  const compareItems = items.filter(i => selectedIds.includes(i.id));

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pid => pid !== id));
    } else {
      if (selectedIds.length < 2) {
        setSelectedIds([...selectedIds, id]);
      } else {
        // Replace the second one or show error? Spec says "select 2-3", implies limit.
        // Let's just limit to 2 for v1.
        alert("You can only compare 2 items at a time.");
      }
    }
  };

  // --- Views ---

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-enter">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-500">
          <Calendar size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">No Saved History</h3>
        <p className="text-slate-500 max-w-xs">Calculations and measurements you save will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-hidden relative">

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shrink-0">
        <SegmentedControl
          options={[
            { label: 'All', value: 'ALL' },
            { label: 'Measured', value: 'MEASURED' },
            { label: 'Converted', value: 'CONVERTED' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          className="w-full md:w-auto min-w-[300px]"
        />
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-none pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-enter">
          {filteredItems.map((item) => (
            <SavedCard
              key={item.id}
              item={item}
              onDelete={onDelete}
              selected={selectedIds.includes(item.id)}
              onToggle={() => toggleSelection(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Compare Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-auto min-w-[300px] glass-panel bg-slate-900/90 border border-neon-purple/30 p-4 rounded-xl shadow-2xl flex items-center justify-between z-50 animate-enter">
          <div className="flex items-center gap-3">
            <div className="bg-neon-purple/20 text-neon-purple p-2 rounded-lg"><GitCompare size={20} /></div>
            <div className="text-white text-sm font-bold">Compare ({selectedIds.length}/2)</div>
          </div>

          {canCompare ? (
            <button
              onClick={() => { /* Open Modal */ }} // Ideally opens a modal, but for now inline replacement
              className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-lg hover:bg-brand-500 transition-colors"
            >
              View Comparison
            </button>
          ) : (
            <button className="px-4 py-2 bg-white/10 text-slate-500 font-bold text-xs rounded-lg cursor-not-allowed">
              Select 2 items
            </button>
          )}

          <button onClick={() => setSelectedIds([])} className="ml-2 text-slate-500 hover:text-white"><Trash2 size={16} /></button>
        </div>
      )}

      {/* Compare Modal (Overlay) */}
      {canCompare && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-[60] p-8 flex flex-col animate-enter">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Comparison</h2>
            <button onClick={() => setSelectedIds([])} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"><Trash2 size={20} /></button>
          </div>

          <div className="grid grid-cols-2 gap-8 flex-1">
            <CompareColumn item={compareItems[0]} />
            <div className="w-px bg-white/10 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-white/20 p-2 rounded-full text-slate-400 font-bold text-xs">VS</div>
            </div>
            <CompareColumn item={compareItems[1]} />
          </div>

          {/* Delta Footer */}
          <div className="mt-8 p-6 glass-panel border border-brand-300/20 bg-brand-300/5 text-center">
            <div className="text-xs uppercase font-bold text-brand-300 tracking-widest mb-2">Difference</div>
            <div className="text-3xl font-mono font-bold text-white">
              {formatDecimal(Math.abs(compareItems[0].sqFt - compareItems[1].sqFt))} <span className="text-sm text-slate-400">sq.ft</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {compareItems[0].sqFt > compareItems[1].sqFt ? 'Item 1 is larger' : 'Item 2 is larger'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const SavedCard: React.FC<{ item: SavedItem; onDelete: (id: string) => void; selected: boolean; onToggle: () => void }> = ({ item, onDelete, selected, onToggle }) => {
  const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div
      className={`
            group relative bg-white/5 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 border cursor-pointer
            ${selected ? 'border-brand-600 bg-brand-600/10' : 'border-white/5 hover:border-white/20 hover:bg-white/10'}
            rounded-none
        `}
      onClick={onToggle}
    >

      <div className="flex justify-between items-start mb-4">
        <span className={`
            px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border
            ${item.type === 'CONVERTED' ? 'text-indigo-400 border-indigo-400/30' : 'text-emerald-400 border-emerald-400/30'}
         `}>
          {item.type}
        </span>
        <div className="flex gap-2">
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'bg-brand-600 border-brand-600' : 'border-slate-600'}`}>
            {selected && <Check size={12} className="text-white" />}
          </div>
        </div>
      </div>

      <h4 className="font-bold text-slate-200 text-lg leading-tight mb-1 line-clamp-2">{item.title}</h4>
      <div className="text-2xl font-black text-white mb-4 font-mono">
        {formatDecimal(item.sqFt)} <span className="text-sm font-bold text-slate-500">sq.ft</span>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Calendar size={12} /> {dateStr}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="text-slate-600 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

    </div>
  );
};

const CompareColumn: React.FC<{ item: SavedItem }> = ({ item }) => {
  const hills = getHillsBreakdown(item.sqFt);
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-4">{item.title}</h3>
      <div className="text-4xl font-black text-white mb-2">{formatDecimal(item.sqFt)} <span className="text-lg text-slate-500">sq.ft</span></div>
      <div className="text-slate-400 font-mono text-sm mb-8">{formatDecimal(item.sqFt * 0.092903)} sq.m</div>

      <div className="space-y-4 bg-white/5 p-4 border border-white/5">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Hill (R-A-P-D)</div>
          <div className="text-xl font-mono text-white font-bold">{hills.ropani}-{hills.aana}-{hills.paisa}-{formatDecimal(hills.daam, 1)}</div>
        </div>
      </div>
    </div>
  );
}

export default SavedScreen;