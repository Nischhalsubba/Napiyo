import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Save, Check, RotateCcw, ChevronRight, CornerUpLeft } from 'lucide-react';
import { calculatePolygonAreaPx, distance, formatDecimal, getHillsBreakdown } from '../utils/conversions';
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

  // Calibration (Step 1)
  const [scalePoints, setScalePoints] = useState<{ x: number, y: number }[]>([]);
  const [showDistInput, setShowDistInput] = useState(false);
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
        const newPoints = [...scalePoints, p];
        setScalePoints(newPoints);
        // AUTO-ADVANCE: If 2 points set, show modal immediately
        if (newPoints.length === 2) {
          setShowDistInput(true);
        }
      }
    } else if (step === MeasureStep.TRACE) {
      if (isClosed) return;
      // Check for closing
      if (polyPoints.length > 2) {
        const d = distance(p, polyPoints[0]);
        // Close if near start (within 2% of image size) or if user taps close button later
        if (d < (Math.max(imgDims.w, imgDims.h) * 0.02)) {
          closePolygon([...polyPoints, p]);
          return;
        }
      }
      setPolyPoints([...polyPoints, p]);
    }
  };

  const confirmCalibration = () => {
    if (scalePoints.length !== 2) return;
    const distPx = distance(scalePoints[0], scalePoints[1]);
    const ft = parseFloat(realDist);
    if (!ft || ft <= 0) return;

    setPixelsPerFt(distPx / ft);
    setShowDistInput(false);
    setStep(MeasureStep.TRACE); // AUTO-ADVANCE to Trace
  };

  const closePolygon = (finalPoints?: { x: number, y: number }[]) => {
    setIsClosed(true);
    if (finalPoints) setPolyPoints(finalPoints);
    setStep(MeasureStep.REPORT); // AUTO-ADVANCE to Report
  };

  // Calculations
  const areaPx = calculatePolygonAreaPx(polyPoints);
  const areaSqFt = pixelsPerFt ? areaPx / (pixelsPerFt * pixelsPerFt) : 0;
  const hills = getHillsBreakdown(areaSqFt);

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-brand-100 text-slate-900">

      {/* --- UPLOAD VIEW --- */}
      {step === MeasureStep.UPLOAD && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-enter z-10 cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-brand-600/30 animate-pulse-slow shadow-xl">
            <Upload size={48} className="text-brand-600" />
          </div>
          <h2 className="text-3xl font-display font-medium text-slate-900 mb-2">Tap to Measure</h2>
          <p className="text-slate-500 text-lg">Upload a photo of the land map</p>
          <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
      )}

      {/* --- WORKSPACE VIEW --- */}
      {image && step !== MeasureStep.UPLOAD && (
        <div className="flex-1 relative w-full h-full overflow-hidden bg-black">

          {/* Canvas */}
          <div
            ref={containerRef}
            className="relative w-full h-full cursor-none select-none"
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
          >
            <img src={image} className="w-full h-full object-contain opacity-80" alt="Map" />

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

              {/* Elastic Line */}
              {!isClosed && polyPoints.length > 0 && containerRef.current && (
                <line
                  x1={polyPoints[polyPoints.length - 1].x}
                  y1={polyPoints[polyPoints.length - 1].y}
                  x2={(mousePos.x - containerRef.current.getBoundingClientRect().left) / containerRef.current.getBoundingClientRect().width * imgDims.w}
                  y2={(mousePos.y - containerRef.current.getBoundingClientRect().top) / containerRef.current.getBoundingClientRect().height * imgDims.h}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity="0.8"
                />
              )}
            </svg>

            {/* Magnifier (Offset) */}
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

          {/* --- Contextual Prompts (Floating) --- */}

          {/* Scale Prompt */}
          {step === MeasureStep.CALIBRATE && !showDistInput && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-brand-600/20 px-6 py-3 rounded-full flex items-center gap-3 animate-enter pointer-events-none shadow-lg">
              <div className="w-2 h-2 bg-brand-600 rounded-full animate-pulse"></div>
              <span className="font-bold text-slate-900 text-sm">Tap 2 points on the scale bar</span>
            </div>
          )}

          {/* Distance Input Modal */}
          {showDistInput && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-enter">
              <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-1">Set Scale Distance</h3>
                <p className="text-slate-400 text-sm mb-6">How long is the line you just drew?</p>

                <div className="flex items-center gap-3 mb-6">
                  <input
                    type="number"
                    value={realDist}
                    onChange={e => setRealDist(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-2xl font-mono text-white focus:border-brand-500 focus:outline-none"
                    autoFocus
                  />
                  <span className="text-xl font-bold text-slate-500">ft</span>
                </div>

                <button
                  onClick={confirmCalibration}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Start Tracing <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Trace Prompt */}
          {step === MeasureStep.TRACE && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-xl border border-brand-600/20 px-6 py-3 rounded-full flex items-center gap-3 animate-enter shadow-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-slate-900 text-sm">Trace the boundaries</span>
              </div>

              {/* Action Buttons (Pointer Events Allowed) */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <button onClick={() => setPolyPoints(p => p.slice(0, -1))} className="p-3 bg-white hover:bg-brand-100 rounded-full text-slate-600 backdrop-blur shadow-lg border border-brand-600/10">
                  <RotateCcw size={20} />
                </button>
                {polyPoints.length > 2 && (
                  <button onClick={() => closePolygon()} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                    <Check size={18} /> Finish
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* --- REPORT SHEET (BottomSheet) --- */}
      <div className={`
            absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 p-8 shadow-2xl transition-transform duration-500 z-50
            ${step === MeasureStep.REPORT ? 'translate-y-0' : 'translate-y-[110%]'}
        `}>
        <div className="max-w-md mx-auto flex flex-col items-center text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-4 uppercase tracking-wider">
            Calculation Complete
          </div>

          <div className="text-6xl font-display font-black text-white mb-2 tracking-tight">
            {formatDecimal(areaSqFt)} <span className="text-2xl text-slate-500 font-medium">sq.ft</span>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-4 w-full mb-6">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Hill System</div>
            <div className="text-2xl font-mono font-bold text-brand-300">
              {hills.ropani}-{hills.aana}-{hills.paisa}-{formatDecimal(hills.daam, 1)}
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => { setStep(MeasureStep.UPLOAD); setImage(null); setPolyPoints([]); setScalePoints([]); }}
              className="flex-1 py-3 bg-white/5 text-slate-400 font-bold rounded-lg hover:bg-white/10 transition-colors"
            >
              New
            </button>
            <button
              onClick={() => onSave({ id: Date.now().toString(), title: 'Measured Plot', sqFt: areaSqFt, date: Date.now(), type: 'MEASURED', tags: [] })}
              className="flex-[2] py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> Save Result
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default MeasureScreen;