import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Copy, Save, Info, ChevronDown, Sparkles } from 'lucide-react';
import { UNITS, QUICK_CHIPS } from '../constants';
import { toSqFt, getHillsBreakdown, getTeraiBreakdown, formatDecimal, fromSqFt } from '../utils/conversions';
import { SavedItem, UnitSystem } from '../types';
import VisualizeModal from './VisualizeModal';

interface ConvertScreenProps {
  onSave: (item: SavedItem) => void;
}

const ConvertScreen: React.FC<ConvertScreenProps> = ({ onSave }) => {
  const [inputValue, setInputValue] = useState<string>('1');
  const [selectedUnit, setSelectedUnit] = useState<string>('ROPANI');
  const [systemFilter, setSystemFilter] = useState<UnitSystem>(UnitSystem.HILLS);
  const [showVisualize, setShowVisualize] = useState(false);
  const [showRef, setShowRef] = useState(false);

  // Computed Values
  const numericVal = parseFloat(inputValue) || 0;
  const sqFtVal = toSqFt(numericVal, selectedUnit);
  const sqMVal = sqFtVal / 10.7639;
  
  const hills = getHillsBreakdown(sqFtVal);
  const terai = getTeraiBreakdown(sqFtVal);

  const formattedHills = `${hills.ropani} Ropani, ${hills.aana} Aana, ${hills.paisa} Paisa, ${formatDecimal(hills.daam, 2)} Daam`;
  const formattedTerai = `${terai.bigha} Bigha, ${terai.kattha} Kattha, ${formatDecimal(terai.dhur, 2)} Dhur`;

  const handleChipClick = (val: number, unit: string) => {
    setInputValue(val.toString());
    setSelectedUnit(unit);
    const u = UNITS[unit];
    if (u && u.system !== UnitSystem.MODERN) setSystemFilter(u.system);
  };

  const saveConversion = () => {
    onSave({
      id: Date.now().toString(),
      name: `${inputValue} ${UNITS[selectedUnit].name}`,
      sqFt: sqFtVal,
      date: Date.now(),
      type: 'CONVERTED',
      tags: [UNITS[selectedUnit].system]
    });
    // Add toast logic here
  };

  const copyResults = () => {
    const text = `Converted: ${inputValue} ${UNITS[selectedUnit].name}\n= ${formatDecimal(sqFtVal)} sq.ft\n= ${formattedHills}\n= ${formattedTerai}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 overflow-y-auto pb-24 md:pb-0">
      
      {/* 1. System Switch */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-4 py-3 shadow-sm border-b border-surface-200">
        <div className="flex gap-2 overflow-x-auto no-scrollbar p-1">
          {[UnitSystem.HILLS, UnitSystem.TERAI, UnitSystem.MODERN].map((sys) => (
            <button
              key={sys}
              onClick={() => setSystemFilter(sys)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                systemFilter === sys 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-105' 
                : 'bg-white text-slate-500 hover:bg-surface-100 border border-transparent hover:border-surface-200'
              }`}
            >
              {sys === UnitSystem.HILLS ? 'Hills' : sys === UnitSystem.TERAI ? 'Terai' : 'Modern'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-8 max-w-2xl mx-auto w-full animate-enter">
        
        {/* 2. Hero Input Card */}
        <div className="bg-white p-1 rounded-[2rem] shadow-soft">
           <div className="bg-gradient-to-br from-white to-surface-50 rounded-[1.8rem] border border-surface-100 p-6 md:p-8">
              <label className="block text-xs font-extrabold text-primary-600 uppercase tracking-widest mb-4">Input Value</label>
              
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 text-5xl md:text-6xl font-black text-slate-800 bg-transparent border-b-2 border-surface-200 focus:border-primary-500 focus:outline-none py-2 placeholder-slate-200 tabular-nums tracking-tight transition-colors"
                  placeholder="0"
                />
                
                <div className="relative min-w-[160px]">
                  <select 
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full h-full appearance-none bg-primary-50 border border-primary-100 text-primary-900 py-4 px-6 pr-12 rounded-2xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer hover:bg-primary-100"
                  >
                      {Object.values(UNITS)
                        .filter(u => u.system === systemFilter || u.system === UnitSystem.MODERN)
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" size={20} strokeWidth={3} />
                </div>
              </div>

              {/* Quick Chips Inside */}
              <div className="mt-6 flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleChipClick(chip.val, chip.unit)}
                    className="px-3 py-1.5 bg-white border border-surface-200 rounded-lg text-xs font-bold text-slate-500 hover:border-primary-400 hover:text-primary-700 hover:shadow-sm transition-all active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* 4. Results Block */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-surface-100">
          <div className="relative bg-slate-900 p-8 text-white overflow-hidden">
            {/* Abstract Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10 text-center">
              <div className="text-primary-300 text-xs font-bold uppercase tracking-widest mb-2">Equivalent Area</div>
              <div className="text-5xl font-black tracking-tight mb-3 flex items-baseline justify-center gap-2">
                {formatDecimal(sqFtVal)} 
                <span className="text-xl font-medium text-slate-400">sq.ft</span>
              </div>
              <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 text-sm font-medium text-slate-200 border border-white/10">
                {formatDecimal(sqMVal)} sq.m
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            {/* Hills Breakdown */}
            <div className={`transition-all duration-300 ${systemFilter === UnitSystem.HILLS ? 'opacity-100 scale-100' : 'opacity-60 grayscale'}`}>
              <div className="flex justify-between items-center mb-3">
                 <div className="text-xs font-extrabold text-primary-600 uppercase tracking-widest">Hills</div>
                 {systemFilter === UnitSystem.HILLS && <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></div>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <ResultBox val={hills.ropani} label="Ropani" />
                <ResultBox val={hills.aana} label="Aana" />
                <ResultBox val={hills.paisa} label="Paisa" />
                <ResultBox val={formatDecimal(hills.daam, 1)} label="Daam" isLast />
              </div>
            </div>

            <div className="h-px bg-surface-100 w-full"></div>

            {/* Terai Breakdown */}
            <div className={`transition-all duration-300 ${systemFilter === UnitSystem.TERAI ? 'opacity-100 scale-100' : 'opacity-60 grayscale'}`}>
              <div className="flex justify-between items-center mb-3">
                 <div className="text-xs font-extrabold text-primary-600 uppercase tracking-widest">Terai</div>
                 {systemFilter === UnitSystem.TERAI && <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></div>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ResultBox val={terai.bigha} label="Bigha" />
                <ResultBox val={terai.kattha} label="Kattha" />
                <ResultBox val={formatDecimal(terai.dhur, 2)} label="Dhur" isLast />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-3 border-t border-surface-100">
             <button onClick={() => setShowVisualize(true)} className="py-5 text-sm font-bold text-primary-700 hover:bg-primary-50 transition-colors flex flex-col items-center gap-2 group">
               <Info size={20} className="group-hover:scale-110 transition-transform" /> Visualize
             </button>
             <button onClick={copyResults} className="py-5 text-sm font-bold text-slate-600 hover:bg-surface-50 transition-colors flex flex-col items-center gap-2 group border-l border-surface-100">
               <Copy size={20} className="group-hover:scale-110 transition-transform" /> Copy
             </button>
             <button onClick={saveConversion} className="py-5 text-sm font-bold text-slate-600 hover:bg-surface-50 transition-colors flex flex-col items-center gap-2 group border-l border-surface-100">
               <Save size={20} className="group-hover:scale-110 transition-transform" /> Save
             </button>
          </div>
        </div>

        {/* 5. Reference Accordion */}
        <div className="border border-surface-200 rounded-2xl bg-white overflow-hidden">
          <button 
             onClick={() => setShowRef(!showRef)}
             className="w-full flex justify-between items-center p-5 bg-white text-sm font-bold text-slate-600 hover:bg-surface-50 transition-colors"
          >
             <span>Unit Reference Table</span>
             <ChevronDown className={`transform transition-transform text-slate-400 ${showRef ? 'rotate-180' : ''}`} size={20} />
          </button>
          {showRef && (
            <div className="p-6 pt-0 text-sm space-y-6 bg-surface-50/50">
               <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-extrabold text-slate-800 mb-3 border-b pb-2">Hills System</h4>
                    <ul className="space-y-2 text-slate-600 font-medium">
                      <li className="flex justify-between"><span>1 Ropani</span> <span className="text-slate-400">16 Aana</span></li>
                      <li className="flex justify-between"><span>1 Aana</span> <span className="text-slate-400">4 Paisa</span></li>
                      <li className="flex justify-between"><span>1 Paisa</span> <span className="text-slate-400">4 Daam</span></li>
                      <li className="flex justify-between pt-2 border-t text-primary-700 font-bold"><span>1 Ropani</span> <span>5,476 sq.ft</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 mb-3 border-b pb-2">Terai System</h4>
                    <ul className="space-y-2 text-slate-600 font-medium">
                      <li className="flex justify-between"><span>1 Bigha</span> <span className="text-slate-400">20 Kattha</span></li>
                      <li className="flex justify-between"><span>1 Kattha</span> <span className="text-slate-400">20 Dhur</span></li>
                      <li className="flex justify-between pt-2 border-t text-primary-700 font-bold"><span>1 Bigha</span> <span>72,900 sq.ft</span></li>
                    </ul>
                  </div>
               </div>
            </div>
          )}
        </div>

      </div>

      <VisualizeModal 
        isOpen={showVisualize} 
        onClose={() => setShowVisualize(false)} 
        sqFt={sqFtVal}
        formattedHills={formattedHills}
        formattedTerai={formattedTerai}
      />
    </div>
  );
};

const ResultBox = ({ val, label, isLast }: { val: number | string, label: string, isLast?: boolean }) => (
  <div className="bg-surface-50 rounded-xl p-3 flex flex-col items-center justify-center border border-surface-100">
    <span className={`font-black text-slate-800 tabular-nums ${String(val).length > 4 ? 'text-lg' : 'text-xl'}`}>{val}</span>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
  </div>
);

export default ConvertScreen;