import React, { useState } from 'react';
import { Save, ChevronDown, Repeat, Copy, Eye } from 'lucide-react';
import { UNITS } from '../constants';
import { toSqFt, formatDecimal, getHillsBreakdown, getTeraiBreakdown } from '../utils/conversions';
import { SavedItem, UnitSystem } from '../types';

interface ConvertScreenProps {
  onSave: (item: SavedItem) => void;
  onVisualize: (sqFt: number) => void;
}

const ConvertScreen: React.FC<ConvertScreenProps> = ({ onSave, onVisualize }) => {
  const [val, setVal] = useState<string>('1');
  const [unit, setUnit] = useState<string>('ROPANI');

  // Derived
  const numVal = parseFloat(val) || 0;
  const sqFt = toSqFt(numVal, unit);
  const sqM = sqFt * 0.092903;
  const hills = getHillsBreakdown(sqFt);
  const terai = getTeraiBreakdown(sqFt);

  // Helper
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="h-full w-full flex flex-col p-6 animate-fade-in relative overflow-hidden">

      {/* --- MANTRA / QUESTION SECTION (Top Half) --- */}
      <div className="flex-1 flex flex-col justify-center items-center gap-4 min-h-[30vh]">
        <div className="text-slate-300 font-bold text-sm uppercase tracking-widest">I have</div>

        {/* Massive Input */}
        <input
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full text-center bg-transparent border-none text-8xl font-display font-black text-white focus:ring-0 p-0 placeholder-slate-600 tracking-tighter"
          placeholder="0"
        />

        {/* Large Unit Selector */}
        <div className="relative group">
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="appearance-none bg-slate-800 hover:bg-slate-700 text-white font-bold text-3xl py-3 pl-8 pr-16 rounded-2xl cursor-pointer transition-colors focus:outline-none text-center min-w-[200px] border border-white/20"
          >
            {Object.values(UNITS).map(u => (
              <option key={u.id} value={u.id} className="bg-slate-900 text-lg">{u.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={28} />
        </div>
      </div>

      {/* --- ANSWER SECTION (Bottom Half) --- */}
      <div className="flex-1 flex flex-col justify-start items-center pt-6 border-t border-white/20">
        <div className="text-slate-300 font-bold text-sm uppercase tracking-widest mb-2">That is equal to</div>

        <div className="text-6xl font-display font-black text-brand-500 mb-2 tracking-tight">
          {fmt(sqFt)} <span className="text-2xl text-slate-400 font-bold">sq.ft</span>
        </div>

        {/* Simple Actions */}
        <div className="flex gap-6 mt-4 mb-6">
          <button onClick={() => onVisualize(sqFt)} className="text-brand-400 hover:text-white flex items-center gap-2 font-bold text-sm bg-slate-800 px-4 py-2 rounded-full transition-colors border border-white/20 hover:border-brand-500">
            <Eye size={16} /> Visualize Size
          </button>
        </div>

        {/* Dual Unit View (Permanent) */}
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-3 animate-enter pb-4">
          <div className="bg-slate-800 border border-white/20 p-4 rounded-xl relative overflow-hidden group hover:border-brand-500/50 transition-colors">
            <div className="text-[10px] uppercase font-bold text-slate-300 tracking-widest mb-1">Hill System</div>
            <div className="text-xl font-mono font-bold text-white relative z-10">
              {hills.ropani}-{hills.aana}-{hills.paisa}-{formatDecimal(hills.daam, 1)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Ropani-Aana-Paisa-Daam</div>
          </div>

          <div className="bg-slate-800 border border-white/20 p-4 rounded-xl relative overflow-hidden group hover:border-brand-500/50 transition-colors">
            <div className="text-[10px] uppercase font-bold text-slate-300 tracking-widest mb-1">Terai System</div>
            <div className="text-xl font-mono font-bold text-white relative z-10">
              {terai.bigha}-{terai.kattha}-{formatDecimal(terai.dhur, 1)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Bigha-Kattha-Dhur</div>
          </div>

          <button
            onClick={() => {
              onSave({ id: Date.now().toString(), title: `${val} ${UNITS[unit].name}`, sqFt, date: Date.now(), type: 'CONVERTED', tags: [] });
              alert("Saved");
            }}
            className="col-span-1 md:col-span-2 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg uppercase tracking-wide text-xs"
          >
            <Save size={16} /> Save to History
          </button>
        </div>
      </div>

    </div>
  );
};

export default ConvertScreen;