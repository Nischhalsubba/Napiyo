import React, { useState, useRef, useEffect } from 'react';
import { Upload, Ruler, Check, RotateCcw, X, Save, MousePointer2, Sparkles, ChevronRight, CornerUpLeft, Search } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { calculatePolygonAreaPx, distance, toSqFt, formatDecimal, getHillsBreakdown, getTeraiBreakdown } from '../utils/conversions';
import { SavedItem } from '../types';

enum MeasureStep {
  UPLOAD = 0,
  CALIBRATE = 1,
  TRACE = 2,
  REPORT = 3
}

interface MeasureScreenProps {
  onSave: (item: SavedItem) => void;
}

const MeasureScreen: React.FC<MeasureScreenProps> = ({ onSave }) => {
  const [step, setStep] = useState<MeasureStep>(MeasureStep.UPLOAD);
  const [image, setImage] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Calibration (Step 1)
  const [scalePoints, setScalePoints] = useState<{ x: number, y: number }[]>([]);
  const [realDist, setRealDist] = useState<string>('50');
  const [pixelsPerFt, setPixelsPerFt] = useState<number | null>(null);

  // Tracing (Step 2)
  const [polyPoints, setPolyPoints] = useState<{ x: number, y: number }[]>([]);
  const [isClosed, setIsClosed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setImgDims({ w: img.width, h: img.height });
          setImage(result);
          setStep(MeasureStep.CALIBRATE);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const getRelativeCoords = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    return { x: xPct * imgDims.w, y: yPct * imgDims.h };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const p = getRelativeCoords(e);

    if (step === MeasureStep.CALIBRATE) {
      if (scalePoints.length < 2) {
        setScalePoints([...scalePoints, p]);
      }
    } else if (step === MeasureStep.TRACE) {
      if (isClosed) return;
      // Check for closing
      if (polyPoints.length > 2) {
        const d = distance(p, polyPoints[0]);
        if (d < (Math.max(imgDims.w, imgDims.h) * 0.02)) {
          setIsClosed(true);
          setStep(MeasureStep.REPORT);
          return;
        }
      }
      setPolyPoints([...polyPoints, p]);
    }
  };

  const confirmCalibration = () => {
    if (scalePoints.length !== 2) return;
    const distPx = distance(scalePoints[0], scalePoints[1]);
    const ft = parseFloat(realDist); // Assuming feet for now
    setPixelsPerFt(distPx / ft);
    setStep(MeasureStep.TRACE);
  };

  // Calculations
  const areaPx = calculatePolygonAreaPx(polyPoints);
  const areaSqFt = pixelsPerFt ? areaPx / (pixelsPerFt * pixelsPerFt) : 0;
  const hills = getHillsBreakdown(areaSqFt);

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-slate-900 text-slate-100">

      {/* Step Wizard Header */}
      {step !== MeasureStep.UPLOAD && (
        <div className="absolute top-0 left-0 right-0 z-40 flex justify-center pt-6 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 flex items-center gap-4 shadow-2xl pointer-events-auto">
            <StepIndicator active={step === MeasureStep.CALIBRATE} done={step > MeasureStep.CALIBRATE} label="1. Calibrate" />
            <div className="w-8 h-px bg-white/10"></div>
            <StepIndicator active={step === MeasureStep.TRACE} done={step > MeasureStep.TRACE} label="2. Trace" />
            <div className="w-8 h-px bg-white/10"></div>
            <StepIndicator active={step === MeasureStep.REPORT} done={step > MeasureStep.REPORT} label="3. Report" />
          </div>
        </div>
      )}

      {/* --- UPLOAD VIEW --- */}
      {step === MeasureStep.UPLOAD && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-enter z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-[0_0_60px_rgba(139,92,246,0.3)] mb-8">
            <Upload size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-display font-bold mb-4 tracking-tight">Smart Measure 2.0</h2>
          <p className="text-slate-400 max-w-md mb-10 text-lg">Upload a plot map. Calibrate the scale. Get instant legal-grade measurements.</p>

          <label className="group relative px-8 py-4 bg-white text-slate-900 font-bold text-lg cursor-pointer hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="flex items-center gap-3"><Upload size={20} /> Upload Map</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* --- WORKSPACE VIEW --- */}
      {image && step !== MeasureStep.UPLOAD && (
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-950/50">

          {/* Canvas */}
          <div
            ref={containerRef}
            className="relative shadow-2xl rounded-sm cursor-none select-none"
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
          >
            <img src={image} className="w-full h-full object-contain opacity-90" alt="Map" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Scale Line */}
              {scalePoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={6} fill="#ec4899" stroke="white" strokeWidth={2} />
              ))}
              {scalePoints.length === 2 && (
                <line x1={scalePoints[0].x} y1={scalePoints[0].y} x2={scalePoints[1].x} y2={scalePoints[1].y} stroke="#ec4899" strokeWidth={3} strokeDasharray="6,4" />
              )}

              {/* Polygon */}
              <g>
                <path
                  d={`M ${polyPoints.map(p => `${p.x},${p.y}`).join(' L ')} ${isClosed ? 'Z' : ''}`}
                  fill={isClosed ? "rgba(16, 185, 129, 0.2)" : "none"}
                  stroke="#10b981" strokeWidth="3"
                />
                {polyPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={5} fill="#10b981" stroke="white" strokeWidth={2} />
                ))}
              </g>

              {/* Connection Line (Elastic) */}
              {!isClosed && polyPoints.length > 0 && (
                <line
                  x1={polyPoints[polyPoints.length - 1].x}
                  y1={polyPoints[polyPoints.length - 1].y}
                  x2={(mousePos.x - containerRef.current!.getBoundingClientRect().left) / containerRef.current!.getBoundingClientRect().width * imgDims.w}
                  y2={(mousePos.y - containerRef.current!.getBoundingClientRect().top) / containerRef.current!.getBoundingClientRect().height * imgDims.h}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity="0.8"
                />
              )}
            </svg>

            {/* Custom Cursor / Magnifier */}
            {step !== MeasureStep.REPORT && (
              <div
                className="fixed w-32 h-32 border-2 border-brand-300/50 backdrop-blur-md pointer-events-none z-50 flex items-center justify-center shadow-2xl bg-white/5 rounded-full"
                style={{ left: mousePos.x - 100, top: mousePos.y - 100 }}
              >
                <div className="w-0.5 h-4 bg-brand-300/80 absolute"></div>
                <div className="w-4 h-0.5 bg-brand-300/80 absolute"></div>
              </div>
            )}
          </div>

          {/* --- Step Overlays --- */}

          {/* 1. Calibrate Overlay */}
          {step === MeasureStep.CALIBRATE && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 animate-enter shadow-glass">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Instruction</span>
                <span className="font-bold text-white">Tap 2 points on the scale bar</span>
              </div>
              {scalePoints.length === 2 && (
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                  <span className="text-sm text-slate-300">Distance:</span>
                  <input
                    type="number"
                    value={realDist}
                    onChange={e => setRealDist(e.target.value)}
                    className="w-16 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white font-mono text-center focus:outline-none focus:border-neon-purple"
                  />
                  <span className="font-bold text-slate-400">ft</span>
                  <button onClick={confirmCalibration} className="bg-neon-purple text-white p-2 rounded-lg hover:bg-neon-purple/80 transition-colors shadow-lg shadow-neon-purple/20">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
              <button onClick={() => setScalePoints([])} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><RotateCcw size={16} /></button>
            </div>
          )}

          {/* 2. Trace Overlay */}
          {step === MeasureStep.TRACE && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 animate-enter shadow-glass">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Instruction</span>
                <span className="font-bold text-white">Trace the boundary corners</span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-neon-emerald">{polyPoints.length}</span>
                <span className="text-xs text-slate-400">points</span>
              </div>
              <button onClick={() => setPolyPoints(p => p.slice(0, -1))} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><CornerUpLeft size={16} /></button>
              {(polyPoints.length > 2) && (
                <button onClick={() => { setIsClosed(true); setStep(MeasureStep.REPORT) }} className="bg-neon-emerald text-slate-900 px-4 py-2 font-bold text-xs shadow-lg shadow-neon-emerald/20 hover:scale-105 transition-transform">
                  Finish
                </button>
              )}
            </div>
          )}

        </div>
      )}

      {/* --- REPORT SHEET (BottomSheet) --- */}
      <div className={`
            absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 p-8 shadow-2xl transition-transform duration-500 z-50
            ${step === MeasureStep.REPORT ? 'translate-y-0' : 'translate-y-[110%]'}
        `}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center md:items-start">

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-emerald/10 text-neon-emerald border border-neon-emerald/20 text-xs font-bold mb-4">
              <Check size={12} /> Calculation Complete
            </div>
            <div className="text-6xl font-display font-black text-white mb-2 tracking-tight line-clamp-1">
              {formatDecimal(areaSqFt)} <span className="text-2xl text-slate-500 font-medium">sq.ft</span>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <ReportCard
              label="Hill System"
              value={`${hills.ropani}-${hills.aana}-${hills.paisa}-${formatDecimal(hills.daam, 1)}`}
              color="text-neon-purple"
            />
            {/* Add Terai if needed, kept simple for now */}
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto min-w-[140px]">
            <button
              onClick={() => onSave({ id: Date.now().toString(), name: 'Measured Plot', sqFt: areaSqFt, date: Date.now(), type: 'MEASURED', tags: [] })}
              className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> Save
            </button>
            <button
              onClick={() => { setStep(MeasureStep.UPLOAD); setImage(null); setPolyPoints([]); setScalePoints([]); }}
              className="w-full py-3 bg-white/5 text-slate-400 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm"
            >
              New Measure
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

const StepIndicator = ({ active, done, label }: any) => (
  <div className={`flex items-center gap-2 ${active ? 'text-white' : done ? 'text-neon-emerald' : 'text-slate-600'}`}>
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-white shadow-[0_0_10px_white]' : done ? 'bg-neon-emerald' : 'bg-slate-700'}`}></div>
    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
  </div>
);

const ReportCard = ({ label, value, color }: any) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 min-w-[120px]">
    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{label}</div>
    <div className={`text-xl font-mono font-bold ${color}`}>{value}</div>
  </div>
);

export default MeasureScreen;