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
  const [showDetails, setShowDetails] = useState(false);

  // Derived
  const numVal = parseFloat(val) || 0;
  const sqFt = toSqFt(numVal, unit);
  const sqM = sqFt * 0.092903;
  const hills = getHillsBreakdown(sqFt);
  const terai = getTeraiBreakdown(sqFt);

  // Helper
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="h-full w-full flex flex-col p-6 animate-fade-in relative overflow-y-auto">

      {/* --- MANTRA / QUESTION SECTION (Top Half) --- */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6 min-h-[40vh]">
        <div className="text-slate-500 font-bold text-sm uppercase tracking-widest">I have</div>

        {/* Massive Input */}
        <input
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full text-center bg-transparent border-none text-9xl font-display font-black text-slate-900 focus:ring-0 p-0 placeholder-slate-300 tracking-tighter"
          placeholder="0"
        />

        {/* Large Unit Selector */}
        <div className="relative group">
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="appearance-none bg-brand-600/5 hover:bg-brand-600/10 text-brand-600 font-bold text-4xl py-4 pl-8 pr-16 rounded-2xl cursor-pointer transition-colors focus:outline-none text-center min-w-[200px]"
          >
            {Object.values(UNITS).map(u => (
              <option key={u.id} value={u.id} className="bg-white text-lg">{u.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-600/50 pointer-events-none" size={32} />
        </div>
      </div>

      {/* --- ANSWER SECTION (Bottom Half) --- */}
      <div className="flex-1 flex flex-col justify-start items-center pt-10 border-t border-white/5">
        <div className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-4">That is equal to</div>

        <div className="text-7xl font-display font-black text-brand-600 mb-2 tracking-tight">
          {fmt(sqFt)} <span className="text-3xl text-slate-400 font-bold">sq.ft</span>
        </div>

        {/* Simple Actions */}
        <div className="flex gap-6 mt-8">
          <button onClick={() => setShowDetails(!showDetails)} className="text-slate-500 hover:text-brand-600 flex items-center gap-2 font-bold text-sm bg-brand-600/5 px-4 py-2 rounded-full transition-colors">
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button onClick={() => onVisualize(sqFt)} className="text-brand-600 hover:text-brand-800 flex items-center gap-2 font-bold text-sm bg-brand-600/10 px-4 py-2 rounded-full transition-colors">
            <Eye size={16} /> Visualize Size
          </button>
        </div>

        {/* Collapsible Details */}
        {showDetails && (
          <div className="w-full max-w-md mt-8 grid grid-cols-2 gap-4 animate-enter">
            <div className="bg-white/60 border border-brand-600/10 p-4 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-500">Hill System</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                {hills.ropani}-{hills.aana}-{hills.paisa}-{formatDecimal(hills.daam, 1)}
              </div>
            </div>
            <div className="bg-white/60 border border-brand-600/10 p-4 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-500">Terai System</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-1">
                {terai.bigha}-{terai.kattha}-{formatDecimal(terai.dhur, 1)}
              </div>
            </div>
            <button
              onClick={() => {
                onSave({ id: Date.now().toString(), title: `${val} ${UNITS[unit].name}`, sqFt, date: Date.now(), type: 'CONVERTED', tags: [] });
                alert("Saved");
              }}
              className="col-span-2 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> Save Calculation
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ConvertScreen;