import React, { useState } from 'react';
import { ArrowRight, Save, History, ChevronDown, Check, Zap } from 'lucide-react';
import { UNITS, QUICK_CHIPS } from '../constants';
import { toSqFt, fromSqFt, formatDecimal, getHillsBreakdown, getTeraiBreakdown } from '../utils/conversions';
import { SavedItem } from '../types';

interface ConvertScreenProps {
  onSave: (item: SavedItem) => void;
}

const ConvertScreen: React.FC<ConvertScreenProps> = ({ onSave }) => {
  const [val, setVal] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('ROPANI');
  const [toUnit, setToUnit] = useState<string>('SQFT');

  const numVal = parseFloat(val) || 0;
  const sqFt = toSqFt(numVal, fromUnit);
  const result = fromSqFt(sqFt, toUnit);

  const hills = getHillsBreakdown(sqFt);
  const terai = getTeraiBreakdown(sqFt);

  const handleSave = () => {
    onSave({
      id: Date.now().toString(),
      name: `${val} ${UNITS[fromUnit].name} to ${UNITS[toUnit].name}`,
      sqFt: sqFt,
      date: Date.now(),
      type: 'CONVERTED',
      tags: ['Conversion']
    });
    alert("Saved!");
  };

  return (
    <div className="h-full w-full p-4 md:p-8 animate-enter overflow-y-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 h-full md:h-auto">

        {/* 1. Input Card (Large Box) */}
        <div className="col-span-1 md:col-span-7 glass-panel p-8 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
          {/* Neon Glow blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/20 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 w-full">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 block">Enter Amount</label>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <input
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full md:w-auto flex-1 bg-transparent border-none text-7xl md:text-8xl font-display font-black text-white focus:ring-0 p-0 placeholder-white/10 tracking-tighter"
                placeholder="0"
              />
              <div className="relative shrink-0 w-full md:w-auto">
                <select
                  value={fromUnit}
                  onChange={e => setFromUnit(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 text-white font-bold text-xl py-4 pl-6 pr-12 cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:border-neon-purple"
                >
                  {Object.values(UNITS).map(u => (
                    <option key={u.id} value={u.id} className="bg-slate-900">{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={20} />
              </div>
            </div>
          </div>

          {/* Quick Chips Row */}
          <div className="mt-8 flex flex-wrap gap-2 relative z-10">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => { setVal(chip.val.toString()); setFromUnit(chip.unit); }}
                className="px-4 py-2 bg-white/5 border border-white/5 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Result Card (Accent Box) */}
        <div className="col-span-1 md:col-span-5 bg-gradient-to-br from-neon-purple to-indigo-600 p-8 text-white relative flex flex-col justify-between shadow-2xl min-h-[300px] group">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <Zap size={64} />
          </div>

          <div>
            <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Equals To</div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-5xl md:text-6xl font-display font-black tracking-tight">{formatDecimal(result)}</span>
            </div>

            <div className="relative inline-block">
              <select
                value={toUnit}
                onChange={e => setToUnit(e.target.value)}
                className="appearance-none bg-black/20 hover:bg-black/30 text-white font-bold py-2 pl-4 pr-10 rounded-xl cursor-pointer focus:outline-none backdrop-blur-sm transition-colors text-sm"
              >
                {Object.values(UNITS).map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-900">{u.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" size={14} />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="mt-8 w-full py-4 bg-white text-neon-purple font-bold shadow-lg hover:shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save to History
          </button>
        </div>

        {/* 3. Details (Bento Grid Bottom) */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Hill System Block */}
          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">H</div>
              <div>
                <div className="text-sm font-bold text-slate-100">Hill System</div>
                <div className="text-xs text-slate-500">Ropani-Aana-Paisa-Daam</div>
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {hills.ropani}-{hills.aana}-{hills.paisa}-{formatDecimal(hills.daam, 1)}
            </div>
          </div>

          {/* Terai System Block */}
          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">T</div>
              <div>
                <div className="text-sm font-bold text-slate-100">Terai System</div>
                <div className="text-xs text-slate-500">Bigha-Kattha-Dhur</div>
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {terai.bigha}-{terai.kattha}-{formatDecimal(terai.dhur, 1)}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ConvertScreen;