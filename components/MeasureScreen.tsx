import React, { useState, useRef } from 'react';
import { Upload, Save, RotateCcw, ChevronRight, Sparkles, Globe, MousePointer2, X, Check } from 'lucide-react';
import { calculatePolygonAreaPx, distance, formatDecimal, getHillsBreakdown } from '../utils/conversions';
import { SavedItem } from '../types';

enum MeasureStep {
  EXTRACT = 0,
  CALIBRATE = 1,
  TRACE = 2,
  REPORT = 3
}

interface MeasureScreenProps {
  onSave: (item: SavedItem) => void;
}

const MeasureScreen: React.FC<MeasureScreenProps> = ({ onSave }) => {
  const [step, setStep] = useState<MeasureStep>(MeasureStep.EXTRACT);
  const [image, setImage] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // URL Extraction
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Calibration (Step 1)
  const [scalePoints, setScalePoints] = useState<{ x: number, y: number }[]>([]);
  const [showDistInput, setShowDistInput] = useState(false);
  const [realDist, setRealDist] = useState<string>('50');
  const [pixelsPerFt, setPixelsPerFt] = useState<number | null>(null);

  // Tracing (Step 2)
  const [polyPoints, setPolyPoints] = useState<{ x: number, y: number }[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Logic ---

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

  const handleExtractUrl = () => {
    if (!url) return;
    setIsExtracting(true);

    // Simulate extraction - SAFE FALLBACK
    setTimeout(() => {
      // Use a reliable, simple placeholder if extraction "fails" or just simulated
      // A simple 800x600 grid pattern for reliability
      const MOCK_MAP = "https://placehold.co/1200x800/1e293b/FFFFFF/png?text=Satellite+Map+Preview";

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        setImgDims({ w: img.width, h: img.height });
        setImage(MOCK_MAP);
        setIsExtracting(false);
        setStep(MeasureStep.CALIBRATE);
      };
      img.onerror = () => {
        alert("Could not extract image. Please upload manually.");
        setIsExtracting(false);
      };
      img.src = MOCK_MAP;
    }, 1500);
  };

  // Safe Click Handler
  const getRelativeCoords = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();

    // Safety check for 0 dimensions
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

    const containerAspect = rect.width / rect.height;
    const imageAspect = (imgDims.w / imgDims.h) || 1; // avoid divide by zero

    let renderW, renderH, offsetX, offsetY;

    if (containerAspect > imageAspect) {
      renderH = rect.height;
      renderW = renderH * imageAspect;
      offsetX = (rect.width - renderW) / 2;
      offsetY = 0;
    } else {
      renderW = rect.width;
      renderH = renderW / imageAspect;
      offsetX = 0;
      offsetY = (rect.height - renderH) / 2;
    }

    const clickX = e.clientX - rect.left - offsetX;
    const clickY = e.clientY - rect.top - offsetY;

    return {
      x: (clickX / renderW) * imgDims.w,
      y: (clickY / renderH) * imgDims.h
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const p = getRelativeCoords(e);

    if (step === MeasureStep.CALIBRATE && !showDistInput) {
      if (scalePoints.length < 2) {
        const newPoints = [...scalePoints, p];
        setScalePoints(newPoints);
        if (newPoints.length === 2) setShowDistInput(true);
      }
    } else if (step === MeasureStep.TRACE) {
      if (isClosed) return;
      if (polyPoints.length > 2) {
        const d = distance(p, polyPoints[0]);
        if (d < (Math.max(imgDims.w, imgDims.h) * 0.02)) {
          closePolygon([...polyPoints, p]);
          return;
        }
      }
      setPolyPoints([...polyPoints, p]);
    }
  };

  const autoDetectScale = () => {
    setIsScanning(true);
    setTimeout(() => {
      const y = imgDims.h * 0.85;
      const x1 = imgDims.w * 0.2;
      const x2 = imgDims.w * 0.8;
      setScalePoints([{ x: x1, y }, { x: x2, y }]);
      setIsScanning(false);
      setShowDistInput(true);
    }, 1000);
  };

  const confirmCalibration = () => {
    const distPx = distance(scalePoints[0], scalePoints[1]);
    setPixelsPerFt(distPx / parseFloat(realDist));
    setShowDistInput(false);
    setStep(MeasureStep.TRACE);
  };

  const closePolygon = (finalPoints?: { x: number, y: number }[]) => {
    setIsClosed(true);
    if (finalPoints) setPolyPoints(finalPoints);
    setStep(MeasureStep.REPORT);
  };

  // --- Render ---
  const areaPx = calculatePolygonAreaPx(polyPoints);
  const areaSqFt = pixelsPerFt ? areaPx / (pixelsPerFt * pixelsPerFt) : 0;
  const hills = getHillsBreakdown(areaSqFt);

  return (
    <div className="h-full w-full flex bg-slate-950 text-white relative overflow-hidden font-sans">

      {/* --- Step 0 - URL Importer (Clean Landing) --- */}
      {step === MeasureStep.EXTRACT && (
        <div className="w-full flex items-center justify-center p-8 relative">
          <div className="max-w-xl w-full z-10 text-center">
            <h1 className="text-4xl font-bold mb-2 text-white">Smart Measure</h1>
            <p className="text-slate-400 mb-8 text-lg">Extract map data or upload manually</p>

            {/* Extraction Bar */}
            <div className="bg-white/5 border border-white/10 p-2 rounded-xl flex gap-2 mb-8 focus-within:ring-2 focus-within:ring-brand-600 transition-all">
              <div className="pl-4 flex items-center text-slate-500"><Globe size={20} /></div>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="Paste Map URL..."
                className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0"
              />
              <button
                onClick={handleExtractUrl}
                disabled={isExtracting}
                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {isExtracting ? 'Analyzing...' : 'Extract'}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8 opacity-30">
              <div className="h-px bg-white flex-1"></div>
              <span className="font-bold text-xs text-white">OR</span>
              <div className="h-px bg-white flex-1"></div>
            </div>

            {/* Manual Upload */}
            <div
              className="border-2 border-dashed border-white/10 p-8 rounded-xl text-center cursor-pointer hover:bg-white/5 hover:border-brand-600/50 transition-all group"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mx-auto mb-2 text-slate-500 group-hover:text-brand-600 transition-colors" size={32} />
              <span className="text-sm font-bold text-slate-400 group-hover:text-white">Upload Manually</span>
              <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>
        </div>
      )}

      {/* --- WORKSPACE LAYOUT --- */}
      {image && step !== MeasureStep.EXTRACT && (
        <>
          {/* 1. LEFT SIDEBAR (TOOLS) */}
          <div className="w-16 bg-slate-900 border-r border-white/10 flex flex-col items-center py-6 gap-4 z-20 shadow-xl">
            <div className="w-8 h-8 bg-brand-600 flex items-center justify-center font-bold text-white rounded-md mb-4 text-xs">V3</div>

            <SidebarTool
              icon={<Sparkles size={18} />}
              label="Auto"
              active={step === MeasureStep.CALIBRATE && !showDistInput}
              onClick={autoDetectScale}
            />
            <SidebarTool
              icon={<MousePointer2 size={18} />}
              label="Trace"
              active={step === MeasureStep.TRACE}
              onClick={() => { }}
            />
            <SidebarTool
              icon={<RotateCcw size={18} />}
              label="Reset"
              onClick={() => {
                setPolyPoints([]);
                setScalePoints([]);
                setStep(MeasureStep.CALIBRATE);
                setIsClosed(false);
              }}
            />

            <div className="mt-auto">
              <SidebarTool
                icon={<X size={18} />}
                label="Exit"
                onClick={() => { setImage(null); setStep(MeasureStep.EXTRACT); }}
              />
            </div>
          </div>

          {/* 2. CENTER CANVAS */}
          <div className="flex-1 relative bg-slate-950 overflow-hidden cursor-crosshair">
            <div
              ref={containerRef}
              className="w-full h-full relative"
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              onClick={handleCanvasClick}
            >
              <img src={image} className="w-full h-full object-contain opacity-80" alt="Work" />

              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${imgDims.w} ${imgDims.h}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Scale Elements */}
                {scalePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={imgDims.w * 0.005} fill="#2563eb" stroke="white" strokeWidth={1} />)}
                {scalePoints.length === 2 && <line x1={scalePoints[0].x} y1={scalePoints[0].y} x2={scalePoints[1].x} y2={scalePoints[1].y} stroke="#2563eb" strokeWidth={2} strokeDasharray="5,5" />}

                {/* Polygon Elements */}
                <path d={`M ${polyPoints.map(p => `${p.x},${p.y}`).join(' L ')} ${isClosed ? 'Z' : ''}`} fill="rgba(37, 99, 235, 0.2)" stroke="#2563eb" strokeWidth={2} />
                {polyPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={imgDims.w * 0.004} fill="#2563eb" stroke="white" />)}
              </svg>

              {/* Simple Prompts */}
              {!showDistInput && step === MeasureStep.CALIBRATE && !isScanning && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 px-4 py-2 rounded-full border border-white/10 text-white text-sm font-medium shadow-lg pointer-events-none">
                  Set Scale: Click 2 points
                </div>
              )}

              {/* Scanner Overlay (Subtle) */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none">
                  <div className="bg-slate-900 px-6 py-3 rounded-full text-white font-medium shadow-xl flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    Scanning geometry...
                  </div>
                </div>
              )}
            </div>

            {/* Config Modal */}
            {showDistInput && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-900 border border-white/10 p-6 rounded-xl w-80 shadow-2xl">
                  <h3 className="text-white font-bold mb-4">Set Reference Distance</h3>
                  <div className="flex gap-2 mb-6">
                    <input
                      value={realDist}
                      onChange={e => setRealDist(e.target.value)}
                      className="flex-1 bg-slate-800 border border-white/10 rounded-lg text-white font-mono text-xl p-2 text-center focus:ring-2 focus:ring-brand-600 focus:outline-none"
                      autoFocus
                    />
                    <div className="bg-slate-800 border border-white/10 px-4 flex items-center text-slate-400 font-bold rounded-lg">FT</div>
                  </div>
                  <button onClick={confirmCalibration} className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold transition-colors">
                    Confirm Scale
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. RIGHT SIDEBAR (RESULTS) */}
          {step === MeasureStep.REPORT && (
            <div className="w-80 bg-slate-900 border-l border-white/10 p-6 flex flex-col z-20 shadow-2xl animate-slide-in-right">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Total Area</div>
              <div className="text-4xl font-bold text-white mb-6">
                {formatDecimal(areaSqFt)} <span className="text-lg text-slate-500">sq.ft</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Hill System</div>
                  <div className="text-xl font-mono text-brand-400 font-bold">{hills.ropani}-{hills.aana}-{hills.paisa}-{formatDecimal(hills.daam, 1)}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Terai System</div>
                  <div className="text-xl font-mono text-white font-bold">...</div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <button onClick={() => closePolygon()} className="w-full py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors">
                  Save Result
                </button>
                <button onClick={() => setStep(MeasureStep.TRACE)} className="w-full py-3 text-slate-400 font-bold hover:text-white transition-colors">
                  Edit Boundary
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SidebarTool = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`group flex flex-col items-center gap-1 w-full py-2 transition-all ${active ? 'text-brand-600' : 'text-slate-500 hover:text-white'}`}
  >
    <div className={`p-2 rounded-lg transition-all ${active ? 'bg-brand-600/10' : 'group-hover:bg-white/5'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium opacity-60 group-hover:opacity-100">{label}</span>
  </button>
);

export default MeasureScreen;