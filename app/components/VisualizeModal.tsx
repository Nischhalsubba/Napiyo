import React, { useState } from 'react';
import { X, Download, Grid, Maximize } from 'lucide-react';

interface VisualizeModalProps {
  sqFt: number;
  isOpen: boolean;
  onClose: () => void;
  formattedHills: string;
  formattedTerai: string;
}

const VisualizeModal: React.FC<VisualizeModalProps> = ({ sqFt, isOpen, onClose, formattedHills, formattedTerai }) => {
  const [shape, setShape] = useState<'SQUARE' | 'WIDE' | 'LONG'>('SQUARE');
  const [showGrid, setShowGrid] = useState(true);

  if (!isOpen) return null;

  let widthFt = 0;
  let heightFt = 0;

  if (shape === 'SQUARE') {
    widthFt = Math.sqrt(sqFt);
    heightFt = widthFt;
  } else if (shape === 'WIDE') {
    widthFt = Math.sqrt(sqFt * 2);
    heightFt = widthFt / 2;
  } else {
    heightFt = Math.sqrt(sqFt * 2);
    widthFt = heightFt / 2;
  }

  const aspectRatio = widthFt / heightFt;
  
  const containerStyle: React.CSSProperties = {
    aspectRatio: `${aspectRatio}`,
    maxWidth: '100%',
    maxHeight: '300px',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-lg rounded-3xl p-1 pointer-events-auto transform transition-transform animate-enter shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 flex justify-between items-center">
           <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
             <Maximize size={20} className="text-primary-600"/> Visualizer
           </h2>
           <button onClick={onClose} className="p-2 bg-surface-100 rounded-full hover:bg-surface-200 text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="px-5 pb-5 overflow-y-auto no-scrollbar">
          {/* Canvas Area */}
          <div className="bg-surface-50 border border-surface-200 rounded-2xl p-8 flex items-center justify-center mb-6 relative overflow-hidden min-h-[250px]">
            {showGrid && (
              <div className="absolute inset-0 opacity-[0.03]" 
                style={{ 
                  backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                  backgroundSize: '20px 20px' 
                }} 
              />
            )}
            
            <div 
              className="bg-primary-500/10 border-2 border-primary-500 flex items-center justify-center relative transition-all duration-500 shadow-xl shadow-primary-500/10"
              style={containerStyle}
            >
              <span className="text-primary-800 font-bold text-lg drop-shadow-sm">{Math.round(sqFt).toLocaleString()} sq.ft</span>
              
              {/* Dimensions Labels */}
              <div className="absolute -bottom-7 text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm border border-surface-100">
                ~{Math.round(widthFt)} ft
              </div>
              <div className="absolute -left-9 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm border border-surface-100 whitespace-nowrap">
                ~{Math.round(heightFt)} ft
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(['SQUARE', 'WIDE', 'LONG'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  shape === s 
                    ? 'bg-slate-800 border-slate-800 text-white shadow-lg' 
                    : 'bg-white border-surface-200 text-slate-500 hover:bg-surface-50'
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 mb-2">
            <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2">Equivalent</div>
            <div className="font-bold text-slate-800 mb-1">{formattedHills}</div>
            <div className="font-bold text-slate-800 opacity-60">{formattedTerai}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-50 border-t border-surface-100 rounded-b-3xl flex gap-3">
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className="flex-1 py-3 px-4 bg-white border border-surface-200 rounded-xl text-slate-600 font-bold flex items-center justify-center gap-2 hover:bg-surface-50 transition-colors"
          >
            <Grid size={18} />
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <button className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-200 transition-colors">
            <Download size={18} />
            Download
          </button>
        </div>

      </div>
    </div>
  );
};

export default VisualizeModal;