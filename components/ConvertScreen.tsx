import React, { useState } from 'react';
import { ArrowLeftRight, Save, History, ChevronDown, Check } from 'lucide-react';
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
    <div className="h-full flex flex-col md:flex-row gap-6 p-6 md:p-10 animate-enter overflow-y-auto">

      {/* Left Panel: Input */}
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">

        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100 relative overflow-hidden">
          {/* Decorator */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[4rem] -z-0"></div>

          <div className="relative z-10">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Input Value</label>

            <div className="flex items-center gap-4 mb-6">
              <input
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="flex-1 text-5xl md:text-6xl font-black bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-200 tracking-tight"
                placeholder="0"
              />
              <div className="relative group">
                <select
                  value={fromUnit}
                  onChange={e => setFromUnit(e.target.value)}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800 font-bold text-lg py-3 pl-6 pr-12 rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  {Object.values(UNITS).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mb-8">
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => { setVal(chip.val.toString()); setFromUnit(chip.unit); }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-colors border border-transparent hover:border-primary-100"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-slate-100 mb-8"></div>

            <div className="flex items-center justify-between">
              <div>
                <div className="fw-bold text-sm text-slate-400 mb-1">Equals to</div>
                <div className="text-3xl font-extrabold text-primary-600 flex items-baseline gap-2">
                  {formatDecimal(result)}
                  <span className="text-base font-bold text-slate-400">{UNITS[toUnit].name}</span>
                </div>
              </div>

              <div className="relative">
                <select
                  value={toUnit}
                  onChange={e => setToUnit(e.target.value)}
                  className="appearance-none bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-2 pl-4 pr-10 rounded-xl cursor-pointer focus:outline-none"
                >
                  {Object.values(UNITS).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" size={16} />
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-600 shadow-sm border border-slate-100 hover:shadow-md hover:text-slate-900 transition-all text-sm font-bold"
          >
            <Save size={18} /> Save Calculation
          </button>
        </div>

      </div>

      {/* Right Panel: Breakdown */}
      <div className="flex-1 max-w-sm w-full mx-auto md:mx-0">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Detailed Breakdown</h3>

        <div className="space-y-4">
          {/* Hills Card */}
          <div className="bg-white/60 p-5 rounded-3xl border border-white shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-xs">H</div>
              <span className="font-bold text-slate-700">Hill System</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <UnitBox val={hills.ropani} label="Ropani" />
              <UnitBox val={hills.aana} label="Aana" />
              <UnitBox val={hills.paisa} label="Paisa" />
              <UnitBox val={hills.daam} label="Daam" isDec />
            </div>
          </div>

          {/* Terai Card */}
          <div className="bg-white/60 p-5 rounded-3xl border border-white shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center font-bold text-xs">T</div>
              <span className="font-bold text-slate-700">Terai System</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <UnitBox val={terai.bigha} label="Bigha" />
              <UnitBox val={terai.kattha} label="Kattha" />
              <UnitBox val={terai.dhur} label="Dhur" isDec />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-900 rounded-3xl p-6 text-slate-300 text-xs relative overflow-hidden group hover:shadow-xl transition-all cursor-crosshair">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowLeftRight size={64} />
          </div>
          <div className="font-bold text-white text-base mb-1">Did you know?</div>
          <p className="leading-relaxed">
            1 Ropani is exactly 5,476 sq. ft., which is roughly one-eighth of an acre. In the Terai, the Bigha system is used, where 1 Bigha equals 13 Ropanis.
          </p>
        </div>

      </div>

    </div>
  );
};

const UnitBox = ({ val, label, isDec = false }: { val: number, label: string, isDec?: boolean }) => (
  <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-50 flex flex-col items-center justify-center min-h-[70px]">
    <div className="font-black text-slate-800 text-lg leading-none mb-1">
      {isDec ? formatDecimal(val, 2) : val}
    </div>
    <div className="text-[10px] uppercase font-bold text-slate-400">{label}</div>
  </div>
);

export default ConvertScreen;