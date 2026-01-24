import React, { useState } from 'react';
import { Trash2, Check, ArrowRight, Tag, Calendar, LayoutGrid } from 'lucide-react';
import { SavedItem } from '../types';
import { formatDecimal, getHillsBreakdown } from '../utils/conversions';

interface SavedScreenProps {
  items: SavedItem[];
  onDelete: (id: string) => void;
}

const SavedScreen: React.FC<SavedScreenProps> = ({ items, onDelete }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'ALL' | 'CONVERTED' | 'MEASURED'>('ALL');

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filteredItems = items.filter(i => filter === 'ALL' || i.type === filter);
  const isComparing = selectedIds.size >= 2;
  const compareItems = items.filter(i => selectedIds.has(i.id));

  // --- Comparison View ---
  if (isComparing) {
    return (
      <div className="flex flex-col h-full bg-surface-50">
         <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><LayoutGrid size={18}/> Compare ({selectedIds.size})</h2>
            <button onClick={() => setSelectedIds(new Set())} className="text-sm font-bold text-slate-500 hover:text-slate-800 bg-surface-100 px-3 py-1 rounded-lg">Close</button>
         </div>
         <div className="flex-1 overflow-x-auto p-6">
           <div className="flex gap-6 h-full items-start">
             {compareItems.map(item => {
               const h = getHillsBreakdown(item.sqFt);
               return (
                 <div key={item.id} className="min-w-[300px] bg-white border border-surface-200 rounded-3xl p-6 shadow-soft flex flex-col animate-enter">
                    <div className="font-bold text-xl mb-1 text-slate-900 line-clamp-2">{item.name}</div>
                    <div className="text-xs font-medium text-slate-400 mb-6 flex items-center gap-1"><Calendar size={12}/> {new Date(item.date).toLocaleDateString()}</div>
                    
                    <div className="mb-8 p-4 bg-primary-50 rounded-2xl border border-primary-100">
                      <div className="text-4xl font-black text-primary-700 font-mono tracking-tighter mb-1">{formatDecimal(item.sqFt)}</div>
                      <div className="text-xs font-bold text-primary-400 uppercase tracking-widest">Square Feet</div>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="bg-surface-50 p-4 rounded-2xl">
                         <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Hills Breakdown</div>
                         <div className="font-bold text-slate-800 text-lg tabular-nums">{h.ropani}-{h.aana}-{h.paisa}-{formatDecimal(h.daam,1)}</div>
                      </div>
                      
                      {selectedIds.size === 2 && compareItems[0].id !== item.id && (
                         <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                           <div className="text-[10px] font-extrabold text-orange-400 uppercase tracking-widest mb-2">Difference</div>
                           <div className="font-bold text-orange-800 text-lg tabular-nums">
                             {items.find(i => selectedIds.has(i.id) && i.id !== item.id)?.sqFt 
                               ? formatDecimal(item.sqFt - (items.find(i => selectedIds.has(i.id) && i.id !== item.id)?.sqFt || 0)) 
                               : '-'} sq.ft
                           </div>
                         </div>
                      )}
                    </div>
                 </div>
               )
             })}
           </div>
         </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-surface-50 flex flex-col">
       {/* Filters */}
       <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-surface-200 flex gap-2 overflow-x-auto no-scrollbar sticky top-0 z-10">
         {['ALL', 'CONVERTED', 'MEASURED'].map((f) => (
           <button
             key={f}
             onClick={() => setFilter(f as any)}
             className={`px-4 py-1.5 rounded-lg text-xs font-extrabold tracking-wide transition-all ${
               filter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-surface-100 text-slate-400 hover:bg-surface-200'
             }`}
           >
             {f}
           </button>
         ))}
       </div>

       <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4 space-y-4">
         {filteredItems.length === 0 ? (
           <div className="text-center py-20 text-slate-300">
             <div className="mb-4 text-6xl opacity-20"><Tag className="mx-auto" /></div>
             <div className="text-lg font-bold text-slate-400">No saved items yet</div>
             <div className="text-sm">Measurements and conversions you save will appear here.</div>
           </div>
         ) : (
           filteredItems.slice().reverse().map(item => (
             <div 
               key={item.id} 
               className={`group relative bg-white border rounded-2xl p-5 shadow-soft transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${selectedIds.has(item.id) ? 'ring-2 ring-primary-500 bg-primary-50/30' : 'border-white'}`}
               onClick={() => toggleSelect(item.id)}
             >
                <div className="flex justify-between items-start mb-3">
                   <div>
                     <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.name}</h3>
                     <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1"><Calendar size={10}/> {new Date(item.date).toLocaleDateString()} • {item.type}</p>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                     className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                   <span className="text-3xl font-black text-primary-700 tracking-tight">{formatDecimal(item.sqFt)}</span>
                   <span className="text-xs font-bold text-slate-400 uppercase">sq.ft</span>
                </div>

                <div className="flex gap-2">
                   {item.tags.map(t => (
                     <span key={t} className="px-2.5 py-1 bg-surface-100 text-slate-500 text-[10px] uppercase font-bold rounded-md">
                       {t}
                     </span>
                   ))}
                </div>

                {/* Selection Indicator */}
                <div className={`absolute top-5 right-14 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id) ? 'bg-primary-500 border-primary-500 text-white scale-100' : 'border-surface-200 scale-90 opacity-0 group-hover:opacity-100'}`}>
                   {selectedIds.has(item.id) && <Check size={14} strokeWidth={4} />}
                </div>
             </div>
           ))
         )}
       </div>

       {/* Compare Floating Bar */}
       {selectedIds.size > 0 && (
          <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white pl-6 pr-2 py-2 rounded-full shadow-2xl shadow-primary-900/50 flex items-center gap-6 animate-enter z-50">
             <span className="font-bold text-sm">{selectedIds.size} Selected</span>
             {selectedIds.size >= 2 ? (
                 <button className="bg-primary-500 text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-primary-400 transition-colors">
                   Compare <ArrowRight size={16} />
                 </button>
             ) : (
                 <span className="text-xs text-slate-400 pr-4">Select 1 more to compare</span>
             )}
          </div>
       )}
    </div>
  );
};

export default SavedScreen;