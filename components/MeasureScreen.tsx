import React, { useState, useRef, useEffect } from 'react';
import { Upload, Ruler, Check, RotateCcw, X, ZoomIn, Save, Copy, MousePointer2, Sparkles, AlertCircle, Wand2, ArrowRight } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { calculatePolygonAreaPx, distance, toSqFt, formatDecimal, getHillsBreakdown, getTeraiBreakdown } from '../utils/conversions';
import { SavedItem } from '../types';

enum MeasureStep {
  UPLOAD = 0,
  SETUP = 1, // Combined Scale + Boundary for fluidity
  RESULT = 2
}

interface MeasureScreenProps {
  onSave: (item: SavedItem) => void;
}

const MeasureScreen: React.FC<MeasureScreenProps> = ({ onSave }) => {
  const [step, setStep] = useState<MeasureStep>(MeasureStep.UPLOAD);
  const [image, setImage] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPoints, setAiPoints] = useState<{ x: number, y: number }[]>([]);
  const [suggestedScale, setSuggestedScale] = useState<{ p1: { x: number, y: number }, p2: { x: number, y: number }, real: number, unit: string } | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Scale State
  const [scaleMode, setScaleMode] = useState(false); // If true, user is drawing scale
  const [scalePoints, setScalePoints] = useState<{ x: number, y: number }[]>([]);
  const [scaleRealLength, setScaleRealLength] = useState<string>('50');
  const [scaleUnit, setScaleUnit] = useState<'ft' | 'm'>('ft');
  const [pixelsPerFt, setPixelsPerFt] = useState<number | null>(null);

  // Boundary State
  const [polyPoints, setPolyPoints] = useState<{ x: number, y: number }[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [draggingPointIdx, setDraggingPointIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Image Analysis Logic ---
  const analyzeImage = async (base64Data: string, mime: string) => {
    setIsAnalyzing(true);
    setAiMessage("Detecting plots and scale...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Clean = base64Data.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: mime, data: base64Clean } },
            { text: "Analyze this map/plot image. 1. Identify the corners of the main plot/boundary (return 'points'). 2. Look closely for a scale bar or legend text (e.g., '10ft', '1:100'). If found, return 'scale' object with 'p1' and 'p2' (endpoints of the scale bar in % coordinates) and 'real_dist' (number) and 'unit' ('ft' or 'm'). All x/y must be 0-100 percentages." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              points: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }
                }
              },
              scale: {
                type: Type.OBJECT,
                properties: {
                  p1: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                  p2: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                  real_dist: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                nullable: true
              }
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);

        // Handle Points
        if (data.points && Array.isArray(data.points) && data.points.length >= 3) {
          setAiPoints(data.points);
        }

        // Handle Scale
        if (data.scale && data.scale.p1 && data.scale.p2 && data.scale.real_dist) {
          setSuggestedScale(data.scale);
          setAiMessage(`Scale detected: ${data.scale.real_dist} ${data.scale.unit}`);
        } else {
          setAiMessage("Plot detected. Please set scale manually.");
        }
      }
    } catch (e) {
      console.error("Analysis failed", e);
      setAiMessage("Auto-detection finished.");
    } finally {
      setIsAnalyzing(false);
      // Clear message after 5s
      setTimeout(() => setAiMessage(null), 5000);
    }
  };

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMimeType(file.type);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setImgDims({ w: img.width, h: img.height });
          setImage(result);
          setStep(MeasureStep.SETUP);
          // Trigger Analysis
          analyzeImage(result, file.type);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const applyAiScale = () => {
    if (!suggestedScale) return;
    const p1 = { x: (suggestedScale.p1.x / 100) * imgDims.w, y: (suggestedScale.p1.y / 100) * imgDims.h };
    const p2 = { x: (suggestedScale.p2.x / 100) * imgDims.w, y: (suggestedScale.p2.y / 100) * imgDims.h };

    setScalePoints([p1, p2]);
    setScaleRealLength(suggestedScale.real_dist.toString());
    setScaleUnit(suggestedScale.unit as 'ft' | 'm');

    // Auto confirm scale calculation
    const distPx = distance(p1, p2);
    const realFt = suggestedScale.unit === 'ft' ? suggestedScale.real_dist : suggestedScale.real_dist * 3.28084;
    setPixelsPerFt(distPx / realFt);

    setSuggestedScale(null);
    setAiMessage("Scale applied! Now check the boundary.");
  };

  const applyAiPoints = () => {
    if (aiPoints.length > 0) {
      const pixelPoints = aiPoints.map(p => ({
        x: (p.x / 100) * imgDims.w,
        y: (p.y / 100) * imgDims.h
      }));
      setPolyPoints(pixelPoints);
      setIsClosed(true);
    }
  };

  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const xPct = (clientX - rect.left) / rect.width;
    const yPct = (clientY - rect.top) / rect.height;

    return {
      x: xPct * imgDims.w,
      y: yPct * imgDims.h
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (draggingPointIdx !== null) {
      setDraggingPointIdx(null);
      return;
    }

    const p = getRelativeCoords(e);

    // Scaling Mode
    if (scaleMode) {
      if (scalePoints.length < 2) {
        const newPts = [...scalePoints, p];
        setScalePoints(newPts);
        if (newPts.length === 2) {
          // Done drawing scale line, wait for user to input distance
        }
      }
      return;
    }

    // Boundary Mode (Default)
    if (isClosed) return;

    if (polyPoints.length > 2) {
      const d = distance(p, polyPoints[0]);
      const threshold = Math.max(imgDims.w, imgDims.h) * 0.02;
      if (d < threshold) {
        setIsClosed(true);
        return;
      }
    }
    setPolyPoints([...polyPoints, p]);
  };

  const confirmScale = () => {
    if (scalePoints.length !== 2) return;
    const distPx = distance(scalePoints[0], scalePoints[1]);
    const realFt = scaleUnit === 'ft' ? parseFloat(scaleRealLength) : parseFloat(scaleRealLength) * 3.28084;
    setPixelsPerFt(distPx / realFt);
    setScaleMode(false);
  };

  const resetAll = () => {
    setStep(MeasureStep.UPLOAD);
    setImage(null);
    setScalePoints([]);
    setPolyPoints([]);
    setIsClosed(false);
    setPixelsPerFt(null);
    setAiPoints([]);
    setSuggestedScale(null);
  };

  const areaPx = calculatePolygonAreaPx(polyPoints);
  const areaSqFt = pixelsPerFt ? areaPx / (pixelsPerFt * pixelsPerFt) : 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">

      {step === MeasureStep.UPLOAD && (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-enter">
          <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-soft border border-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-mesh opacity-20 group-hover:opacity-40 transition-opacity"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-6 shadow-glow">
                <Upload size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Upload Map</h2>
              <p className="text-slate-400 mb-8 font-medium">PNG, JPG or Screenshot of land plot.</p>

              <label className="bg-accent text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 cursor-pointer hover:scale-105 active:scale-95 transition-all flex gap-2">
                <Upload size={20} /> Select Image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {(step === MeasureStep.SETUP || step === MeasureStep.RESULT) && image && (
        <div className="flex-1 relative overflow-hidden flex flex-col">

          {/* Floating Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/80 backdrop-blur-md px-2 py-2 rounded-2xl shadow-glass border border-white/50 flex items-center gap-2">

            <ToolBtn
              active={scaleMode}
              onClick={() => setScaleMode(true)}
              icon={<Ruler size={18} />}
              label="Set Scale"
            />
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <ToolBtn
              active={!scaleMode && !isClosed}
              onClick={() => setScaleMode(false)}
              icon={<MousePointer2 size={18} />}
              label="Boundary"
            />

            {pixelsPerFt && isClosed && (
              <button
                onClick={() => onSave({ id: Date.now().toString(), name: 'Measured Plot', sqFt: areaSqFt, date: Date.now(), type: 'MEASURED', tags: [] })}
                className="ml-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-600 transition-colors"
              >
                Save
              </button>
            )}

            <button onClick={resetAll} className="ml-1 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Analysis Toast */}
          {aiMessage && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 animate-enter">
              <div className="bg-accent text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-medium">
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
                {aiMessage}
                {suggestedScale && (
                  <button onClick={applyAiScale} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg ml-2 transition-colors">Apply</button>
                )}
                {aiPoints.length > 0 && polyPoints.length === 0 && (
                  <button onClick={applyAiPoints} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg ml-2 transition-colors">Show Plot</button>
                )}
              </div>
            </div>
          )}

          {/* Main Canvas */}
          <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center relative touch-none p-4 w-full h-full">
            <div ref={containerRef} className="relative shadow-2xl rounded-lg overflow-hidden ring-4 ring-white">
              <img src={image} className="max-w-full max-h-[85vh] block select-none" alt="Map" />
              <svg
                className="absolute inset-0 w-full h-full z-10 cursor-crosshair"
                viewBox={`0 0 ${imgDims.w} ${imgDims.h}`}
                onClick={handleCanvasClick}
              >
                {/* Scale Line */}
                {scalePoints.length > 0 && (
                  <g>
                    <line
                      x1={scalePoints[0].x} y1={scalePoints[0].y}
                      x2={scalePoints[1]?.x ?? scalePoints[0].x} y2={scalePoints[1]?.y ?? scalePoints[0].y}
                      stroke="#ef4444" strokeWidth="4"
                    />
                    {scalePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={6} fill="#ef4444" stroke="white" strokeWidth={2} />)}
                  </g>
                )}

                {/* Boundary */}
                {polyPoints.length > 0 && (
                  <g>
                    <path
                      d={`M ${polyPoints.map(p => `${p.x},${p.y}`).join(' L ')} ${isClosed ? 'Z' : ''}`}
                      fill={isClosed ? "rgba(34, 197, 94, 0.4)" : "none"}
                      stroke="#10b981" strokeWidth="3" strokeLinejoin="round"
                    />
                    {polyPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={5} fill="white" stroke="#10b981" strokeWidth={2} />)}
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Smart Stats Overlay (Bottom Right) */}
          {isClosed && pixelsPerFt && (
            <div className="absolute bottom-6 right-6 z-30 bg-white/90 backdrop-blur-md p-5 rounded-[1.5rem] shadow-glass border border-white/50 w-64 animate-enter">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Area</div>
              <div className="text-3xl font-black text-slate-800 mb-4">{formatDecimal(areaSqFt)} <span className="text-sm text-slate-400">sq.ft</span></div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold p-2 bg-slate-50 rounded-xl">
                  <span className="text-slate-400">Ropani</span>
                  <span>{formatDecimal(areaSqFt / 5476, 2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Scale Input Modal */}
          {scaleMode && scalePoints.length === 2 && !pixelsPerFt && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white p-4 rounded-2xl shadow-xl flex gap-2 items-center animate-enter">
              <input
                type="number"
                value={scaleRealLength}
                onChange={e => setScaleRealLength(e.target.value)}
                className="w-20 bg-slate-50 border-none rounded-lg p-2 font-bold text-center"
                autoFocus
              />
              <select
                value={scaleUnit}
                onChange={e => setScaleUnit(e.target.value as any)}
                className="bg-slate-50 font-bold p-2 rounded-lg"
              >
                <option value="ft">ft</option>
                <option value="m">m</option>
              </select>
              <button onClick={confirmScale} className="bg-green-500 text-white p-2 rounded-lg">
                <Check size={18} />
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-xs
      ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}
    `}
  >
    {icon} <span>{label}</span>
  </button>
);

export default MeasureScreen;