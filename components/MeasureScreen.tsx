import React, { useState, useRef, useEffect } from 'react';
import { Upload, Ruler, Check, RotateCcw, X, ZoomIn, Save, Copy, MousePointer2, Sparkles, AlertCircle, Wand2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { calculatePolygonAreaPx, distance, toSqFt, formatDecimal, getHillsBreakdown, getTeraiBreakdown } from '../utils/conversions';
import { SavedItem } from '../types';

enum MeasureStep {
  UPLOAD = 0,
  SCALE = 1,
  BOUNDARY = 2,
  RESULT = 3
}

interface MeasureScreenProps {
  onSave: (item: SavedItem) => void;
}

const MeasureScreen: React.FC<MeasureScreenProps> = ({ onSave }) => {
  const [step, setStep] = useState<MeasureStep>(MeasureStep.UPLOAD);
  const [image, setImage] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPoints, setAiPoints] = useState<{x: number, y: number}[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Scale State
  const [scalePoints, setScalePoints] = useState<{x: number, y: number}[]>([]);
  const [scaleRealLength, setScaleRealLength] = useState<string>('50');
  const [scaleUnit, setScaleUnit] = useState<'ft' | 'm'>('ft');
  const [pixelsPerFt, setPixelsPerFt] = useState<number | null>(null);

  // Boundary State
  const [polyPoints, setPolyPoints] = useState<{x: number, y: number}[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [draggingPointIdx, setDraggingPointIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- AI Analysis Logic ---
  const analyzeImage = async (base64Data: string, mime: string) => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Clean = base64Data.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: mime, data: base64Clean } },
            { text: "Analyze this image and identify the corners of the primary land plot, property boundary, or field. Return a JSON object with a key 'points' containing an array of objects with 'x' and 'y' properties. 'x' and 'y' must be numbers between 0 and 100, representing the percentage position from the top-left corner (e.g., x: 50 is middle width). Limit to the 4-10 most significant corners." }
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
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        if (data.points && Array.isArray(data.points) && data.points.length >= 3) {
          setAiPoints(data.points); // Store percentage points
        } else {
          setAiError("No clear boundary detected.");
        }
      }
    } catch (e) {
      console.error("AI Analysis failed", e);
      setAiError("Could not analyze image automatically.");
    } finally {
      setIsAnalyzing(false);
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
          setStep(MeasureStep.SCALE);
          // Trigger AI Analysis
          analyzeImage(result, file.type);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const applyAiPoints = () => {
    if (aiPoints.length > 0) {
      // Convert percentages to pixels
      const pixelPoints = aiPoints.map(p => ({
        x: (p.x / 100) * imgDims.w,
        y: (p.y / 100) * imgDims.h
      }));
      setPolyPoints(pixelPoints);
      setIsClosed(true); // AI usually gives a closed shape concept
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

    if (step === MeasureStep.SCALE) {
      if (scalePoints.length < 2) {
        setScalePoints([...scalePoints, p]);
      }
    } else if (step === MeasureStep.BOUNDARY) {
      if (isClosed) return;
      
      if (polyPoints.length > 2) {
        const d = distance(p, polyPoints[0]);
        const threshold = Math.max(imgDims.w, imgDims.h) * 0.02; 
        if (d < threshold) {
          setIsClosed(true);
          setStep(MeasureStep.RESULT);
          return;
        }
      }
      setPolyPoints([...polyPoints, p]);
    }
  };

  const confirmScale = () => {
    if (scalePoints.length !== 2) return;
    const distPx = distance(scalePoints[0], scalePoints[1]);
    const realFt = scaleUnit === 'ft' ? parseFloat(scaleRealLength) : parseFloat(scaleRealLength) * 3.28084;
    setPixelsPerFt(distPx / realFt);
    
    // Auto-apply AI points if available and user enters boundary step
    if (aiPoints.length > 0 && polyPoints.length === 0) {
       applyAiPoints();
    }
    
    setStep(MeasureStep.BOUNDARY);
  };

  const resetAll = () => {
    setStep(MeasureStep.UPLOAD);
    setImage(null);
    setScalePoints([]);
    setPolyPoints([]);
    setIsClosed(false);
    setPixelsPerFt(null);
    setAiPoints([]);
  };

  const handlePointDragStart = (idx: number) => {
      setDraggingPointIdx(idx);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingPointIdx !== null && containerRef.current) {
        const p = getRelativeCoords(e);
        const newPoints = [...polyPoints];
        newPoints[draggingPointIdx] = p;
        setPolyPoints(newPoints);
    }
  };

  const areaPx = calculatePolygonAreaPx(polyPoints);
  const areaSqFt = pixelsPerFt ? areaPx / (pixelsPerFt * pixelsPerFt) : 0;
  const areaSqM = areaSqFt / 10.7639;
  const hills = getHillsBreakdown(areaSqFt);
  const terai = getTeraiBreakdown(areaSqFt);

  const saveResult = () => {
    onSave({
      id: Date.now().toString(),
      name: `Measured Plot ${new Date().toLocaleDateString()}`,
      sqFt: areaSqFt,
      date: Date.now(),
      type: 'MEASURED',
      tags: ['Measure', 'Image']
    });
    alert("Saved!");
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 relative">
      {/* Header / Stepper */}
      <div className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="bg-primary-100 text-primary-700 p-1.5 rounded-lg"><Ruler size={16} /></span>
              Measure Plot
            </h2>
            {step !== MeasureStep.UPLOAD && (
                <button onClick={resetAll} className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors flex items-center gap-1.5">
                    <RotateCcw size={12} /> Reset
                </button>
            )}
        </div>
        {/* Progress Bar */}
        <div className="flex justify-between items-center relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 rounded-full overflow-hidden">
             <div 
               className="h-full bg-primary-500 transition-all duration-500 ease-out" 
               style={{ width: `${(step / 3) * 100}%` }}
             ></div>
          </div>
          {['Upload', 'Scale', 'Boundary', 'Result'].map((label, idx) => {
            const isActive = step >= idx;
            const isCurrent = step === idx;
            return (
              <div key={label} className={`flex flex-col items-center gap-1.5 ${isActive ? 'text-primary-700' : 'text-slate-300'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 shadow-sm
                  ${isCurrent ? 'bg-primary-600 border-primary-600 text-white scale-110 ring-4 ring-primary-100' : 
                    isActive ? 'bg-white border-primary-500 text-primary-600' : 'bg-white border-slate-200 text-slate-300'}`}>
                  {idx + 1}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isCurrent ? 'text-primary-800' : ''}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-900/5">
        
        {step === MeasureStep.UPLOAD && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-enter">
            <div className="bg-white p-8 rounded-3xl shadow-soft border border-white w-full max-w-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary-600 rotate-3">
                <Upload size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Plot Image</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Upload a clear image of a map, blueprint, or satellite view. We'll help you measure it.
              </p>
              
              <label className="relative group cursor-pointer block">
                <div className="absolute inset-0 bg-primary-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-primary-600 text-white py-4 px-6 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 group-active:scale-[0.98] transition-transform">
                  <Upload size={18} /> Choose Image
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {image && (
          <div className="flex-1 relative overflow-hidden bg-slate-900 flex items-center justify-center touch-none">
             {/* AI Loading State Overlay */}
             {isAnalyzing && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg animate-pulse">
                   <Sparkles size={14} className="text-yellow-400" /> AI is analyzing terrain...
                </div>
             )}
             
             {/* Canvas Container */}
             <div ref={containerRef} className="relative shadow-2xl">
                 <img src={image} alt="Plot" className="max-w-full max-h-[70vh] object-contain pointer-events-none select-none opacity-90" />
                 
                 <svg 
                   className="absolute inset-0 w-full h-full z-10 cursor-crosshair"
                   viewBox={`0 0 ${imgDims.w} ${imgDims.h}`}
                   onClick={handleCanvasClick}
                   onMouseMove={handleMouseMove}
                 >
                    {/* Scale Line */}
                    {scalePoints.map((p, i) => (
                      <circle key={`s-${i}`} cx={p.x} cy={p.y} r={Math.max(imgDims.w, imgDims.h) * 0.008} fill="#ef4444" stroke="white" strokeWidth="2" />
                    ))}
                    {scalePoints.length === 2 && (
                      <line x1={scalePoints[0].x} y1={scalePoints[0].y} x2={scalePoints[1].x} y2={scalePoints[1].y} stroke="#ef4444" strokeWidth="3" strokeDasharray="5,5" />
                    )}

                    {/* Boundary Polygon */}
                    {polyPoints.length > 0 && (
                      <g>
                        <path 
                          d={`M ${polyPoints.map(p => `${p.x},${p.y}`).join(' L ')} ${isClosed ? 'Z' : ''}`}
                          fill={isClosed ? "rgba(16, 185, 129, 0.3)" : "none"}
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinejoin="round"
                        />
                         {!isClosed && polyPoints.length > 0 && (
                           <line 
                            x1={polyPoints[polyPoints.length-1].x} 
                            y1={polyPoints[polyPoints.length-1].y} 
                            x2={polyPoints[0].x} 
                            y2={polyPoints[0].y} 
                            stroke="#10b981" 
                            strokeWidth="1.5" 
                            strokeDasharray="4,4" 
                            opacity="0.6"
                           />
                        )}
                        {polyPoints.map((p, i) => (
                          <circle 
                            key={`p-${i}`} 
                            cx={p.x} 
                            cy={p.y} 
                            r={Math.max(imgDims.w, imgDims.h) * 0.01} 
                            fill="white" 
                            stroke="#10b981" 
                            strokeWidth="2" 
                            onMouseDown={() => handlePointDragStart(i)}
                            className="cursor-move hover:fill-primary-200"
                          />
                        ))}
                      </g>
                    )}
                 </svg>
             </div>
          </div>
        )}

        {/* Action Panel */}
        <div className="bg-white border-t p-5 pb-8 rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.05)] z-20">
            
            {step === MeasureStep.SCALE && (
              <div className="animate-enter">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-50 text-red-500 p-2.5 rounded-xl"><Ruler size={20} /></div>
                  <div>
                    <h4 className="font-bold text-slate-800">Set Scale</h4>
                    <p className="text-xs text-slate-500">Tap 2 points and enter real distance.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      value={scaleRealLength} 
                      onChange={(e) => setScaleRealLength(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Length</span>
                  </div>
                  <select 
                    value={scaleUnit} 
                    onChange={(e) => setScaleUnit(e.target.value as any)} 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="ft">ft</option>
                    <option value="m">m</option>
                  </select>
                </div>

                <button 
                  onClick={confirmScale}
                  disabled={scalePoints.length !== 2}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Confirm Scale <Check size={18} />
                </button>
              </div>
            )}

            {step === MeasureStep.BOUNDARY && (
              <div className="animate-enter flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="bg-primary-50 text-primary-600 p-2.5 rounded-xl">
                      <MousePointer2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Draw Boundary</h4>
                      <p className="text-xs text-slate-500">
                        {polyPoints.length === 0 ? "Tap corners" : `${polyPoints.length} points`}
                        {aiPoints.length > 0 && polyPoints.length > 0 && " • AI Suggested"}
                      </p>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    {/* AI Suggestion Button if available but not used yet */}
                    {aiPoints.length > 0 && polyPoints.length === 0 && (
                      <button onClick={applyAiPoints} className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-100 transition-colors">
                        <Wand2 size={16} /> Use AI
                      </button>
                    )}
                    
                    <button onClick={() => setPolyPoints(p => p.slice(0, -1))} className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100">
                      Undo
                    </button>
                    
                    {polyPoints.length > 2 && (
                       <button onClick={() => { setIsClosed(true); setStep(MeasureStep.RESULT); }} className="bg-primary-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-glow hover:bg-primary-700 transition-all">
                         Done
                       </button>
                    )}
                 </div>
              </div>
            )}

            {(step === MeasureStep.RESULT) && (
              <div className="animate-enter">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Estimated Area</div>
                     <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{formatDecimal(areaSqFt)} <span className="text-lg font-medium text-slate-400">sq.ft</span></div>
                     <div className="text-sm font-medium text-slate-500 mt-1">{formatDecimal(areaSqM)} sq.m</div>
                   </div>
                   <button onClick={saveResult} className="p-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 shadow-glow transition-all">
                     <Save size={24} />
                   </button>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Hills</span>
                      <span className="font-mono font-bold text-slate-800">
                        {hills.ropani}-{hills.aana}-{hills.paisa}-{formatDecimal(hills.daam, 1)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Terai</span>
                      <span className="font-mono font-bold text-slate-800">
                        {terai.bigha}-{terai.kattha}-{formatDecimal(terai.dhur, 2)}
                      </span>
                    </div>
                 </div>
                 
                 <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-400 leading-tight">
                   <AlertCircle size={12} className="shrink-0 mt-0.5" />
                   Result is an estimate based on your manual scale. For legal or construction purposes, always verify with a licensed surveyor.
                 </div>
              </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default MeasureScreen;