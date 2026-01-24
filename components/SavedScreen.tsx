import React from 'react';
import { Trash2, Copy, Calendar, Tag, ArrowRight } from 'lucide-react';
import { SavedItem } from '../types';
import { formatDecimal } from '../utils/conversions';

interface SavedScreenProps {
  items: SavedItem[];
  onDelete: (id: string) => void;
}

const SavedScreen: React.FC<SavedScreenProps> = ({ items, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-enter">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
          <Calendar size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Saved History</h3>
        <p className="text-slate-400 max-w-xs">Calculations and measurements you save will appear here for quick access.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-enter">
        {items.map((item) => (
          <SavedCard key={item.id} item={item} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

const SavedCard: React.FC<{ item: SavedItem; onDelete: (id: string) => void }> = ({ item, onDelete }) => {
  const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="group relative bg-white/50 hover:bg-white backdrop-blur-sm p-6 rounded-[1.5rem] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-white/60">

      <div className="flex justify-between items-start mb-4">
        <span className={`
            px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
            ${item.type === 'CONVERTED' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-600'}
         `}>
          {item.type}
        </span>
        <button
          onClick={() => onDelete(item.id)}
          className="text-slate-300 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-2">{item.name}</h4>
      <div className="text-2xl font-black text-slate-900 mb-4 font-mono">
        {formatDecimal(item.sqFt)} <span className="text-sm font-bold text-slate-400">sq.ft</span>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/50">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Calendar size={12} /> {dateStr}
        </div>
        <button className="text-slate-400 hover:text-primary-600 transition-colors">
          <Copy size={16} />
        </button>
      </div>

    </div>
  );
};

export default SavedScreen;