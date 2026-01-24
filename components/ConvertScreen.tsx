import React, { useState } from 'react';
import { Save, ChevronDown, Zap, Eye, Copy, MoreHorizontal } from 'lucide-react';
import { UNITS, QUICK_CHIPS } from '../constants';
import { toSqFt, fromSqFt, formatDecimal, getHillsBreakdown, getTeraiBreakdown } from '../utils/conversions';
import { SavedItem, UnitSystem } from '../types';
import SegmentedControl from './SegmentedControl';
import Toggle from './Toggle';

interface ConvertScreenProps {
  onSave: (item: SavedItem) => void;
  onVisualize: (sqFt: number) => void;
}

const ConvertScreen: React.FC<ConvertScreenProps> = ({ onSave, onVisualize }) => {
  // State
  const [val, setVal] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('ROPANI');
  const [systemMode, setSystemMode] = useState<string>(UnitSystem.HILLS);
  const [isExact, setIsExact] = useState<boolean>(false);

  // Derived Values
  const numVal = parseFloat(val) || 0;
  const sqFt = toSqFt(numVal, fromUnit);
  const sqM = sqFt * 0.092903;

  const hills = getHillsBreakdown(sqFt);
  const terai = getTeraiBreakdown(sqFt);

  // Formatters
  const fmt = (n: number) => isExact ? n.toLocaleString(undefined, { minimumFractionDigits: 4 }) : formatDecimal(n);

  const handleSave = () => {
    onSave({
      id: Date.now().toString(),
      name: `${val} ${UNITS[fromUnit].name} -> ${fmt(sqFt)} sq.ft`,
      sqFt: sqFt,
      date: Date.now(),
      type: 'CONVERTED',
      tags: ['Conversion', systemMode]
    });
    alert("Saved!");
  };

  const copyResult = () => {
    const text = `${val} ${UNITS[fromUnit].name} = ${fmt(sqFt)} sq.ft`;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  return (
    <div className="h-full w-full p-4 md:p-8 animate-enter overflow-y-auto flex flex-col gap-6">

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <SegmentedControl
          options={[
            { label: 'Hills (R-A-P-D)', value: UnitSystem.HILLS },
            { label: 'Terai (B-K-D)', value: UnitSystem.TERAI },
            { label: 'Modern (Sq.Ft)', value: UnitSystem.MODERN },
          ]}
          value={systemMode}
          onChange={setSystemMode}
          className="w-full md:w-auto min-w-[300px]"
        />
        <Toggle
          checked={isExact}
          onChange={setIsExact}
          label={isExact ? "Exact Values" : "Rounded"}
        />
      </div>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">

        {/* 1. Input Card */}
        <div className="col-span-1 md:col-span-7 glass-panel p-8 relative overflow-hidden flex flex-col justify-center min-h-[320px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 w-full">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 block">Input Value (Rakham)</label>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <input
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full md:w-auto flex-1 bg-transparent border-none text-6xl md:text-8xl font-display font-black text-white focus:ring-0 p-0 placeholder-white/10 tracking-tighter"
                placeholder="0"
              />
              <div className="relative shrink-0 w-full md:w-auto">
                <select
                  value={fromUnit}
                  onChange={e => setFromUnit(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 text-white font-bold text-xl py-4 pl-6 pr-12 cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:border-neon-purple rounded-none"
                >
                  {Object.values(UNITS).map(u => (
                    <option key={u.id} value={u.id} className="bg-slate-900">{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={20} />
              </div>
            </div>
          </div>

          {/* Quick Chips */}
          <div className="mt-8 flex flex-wrap gap-2 relative z-10">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => { setVal(chip.val.toString()); setFromUnit(chip.unit); }}
                className="px-3 py-1.5 bg-white/5 border border-white/5 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all uppercase tracking-wide"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Result Card */}
        <div className="col-span-1 md:col-span-5 bg-gradient-to-br from-neon-purple/20 to-slate-900 border border-white/10 p-8 text-white relative flex flex-col justify-between shadow-2xl min-h-[320px] group">

          <div>
            <div className="text-xs font-bold text-neon-cyan uppercase tracking-widest mb-4">Calculated Area</div>

            {/* Primary Result */}
            <div className="mb-2">
              <span className="text-5xl md:text-6xl font-display font-black tracking-tight leading-none">
                {fmt(sqFt)}
              </span>
              <span className="text-xl font-bold text-slate-400 ml-2">sq.ft</span>
            </div>

            {/* Secondary Result */}
            <div className="text-slate-400 font-mono text-sm border-t border-white/10 pt-2 mt-2 inline-block">
              {fmt(sqM)} sq. meter
            </div>
          </div>

          {/* Context Breakdown (Dynamic) */}
          <div className="mt-6 p-4 bg-black/20 border border-white/5">
            {systemMode === UnitSystem.HILLS && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Hill System</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {hills.ropani}-{hills.aana}-{hills.paisa}-{isExact ? hills.daam.toFixed(4) : formatDecimal(hills.daam, 1)}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">Ropani-Aana-Paisa-Daam</div>
              </div>
            )}
            {systemMode === UnitSystem.TERAI && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Terai System</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {terai.bigha}-{terai.kattha}-{isExact ? terai.dhur.toFixed(4) : formatDecimal(terai.dhur, 1)}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">Bigha-Kattha-Dhur</div>
              </div>
            )}
            {systemMode === UnitSystem.MODERN && (
              <div className="text-sm text-slate-400 italic">
                Standard metric units selected. Switch system to see local units.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <button onClick={handleSave} className="col-span-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors">
              <Save size={16} /> Save
            </button>
            <button onClick={copyResult} className="col-span-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors">
              <Copy size={16} /> Copy
            </button>
            <button onClick={() => onVisualize(sqFt)} className="col-span-1 py-3 bg-neon-purple hover:bg-neon-purple/80 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors shadow-lg shadow-neon-purple/20">
              <Eye size={16} /> Visualize
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConvertScreen;