import { type ChangeEvent, type PointerEvent, useMemo, useRef, useState } from 'react';
import { Check, MapPinned, RotateCcw, Save, Trash2, Undo2, Upload } from 'lucide-react';
import { Point, SavedItem } from '../types';
import {
  calculatePolygonAreaPx, calculatePolygonPerimeterPx, distance, formatDecimal,
  formatHillsWords, formatTeraiWords, fromSqFt, toSqM,
} from '../utils/conversions';
import { useAppLanguage } from '../utils/useAppLanguage';

type Step = 'SOURCE' | 'CALIBRATE' | 'TRACE' | 'RESULT';
type ReferenceUnit = 'ft' | 'm';
interface Props { onSave: (item: SavedItem) => boolean; notify: (message: string) => void; }

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

const MeasureScreen = ({ onSave, notify }: Props) => {
  const language = useAppLanguage();
  const ne = language === 'ne';
  const steps: { id: Step; short: string }[] = ne
    ? [{ id:'SOURCE', short:'तस्बिर' }, { id:'CALIBRATE', short:'स्केल' }, { id:'TRACE', short:'रेखा' }, { id:'RESULT', short:'समीक्षा' }]
    : [{ id:'SOURCE', short:'Image' }, { id:'CALIBRATE', short:'Scale' }, { id:'TRACE', short:'Trace' }, { id:'RESULT', short:'Review' }];
  const [step, setStep] = useState<Step>('SOURCE');
  const [image, setImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width:0, height:0 });
  const [error, setError] = useState('');
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [referenceDistance, setReferenceDistance] = useState('50');
  const [referenceUnit, setReferenceUnit] = useState<ReferenceUnit>('ft');
  const [pixelsPerFoot, setPixelsPerFoot] = useState<number | null>(null);
  const [boundary, setBoundary] = useState<Point[]>([]);
  const [saved, setSaved] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const scalePixels = scalePoints.length === 2 ? distance(scalePoints[0], scalePoints[1]) : 0;
  const areaSqFt = pixelsPerFoot ? calculatePolygonAreaPx(boundary) / pixelsPerFoot ** 2 : 0;
  const perimeterFt = pixelsPerFoot ? calculatePolygonPerimeterPx(boundary) / pixelsPerFoot : 0;
  const areaSqM = toSqM(areaSqFt);
  const currentIndex = steps.findIndex(item=>item.id===step);
  const confidence = useMemo<'LOW'|'MEDIUM'|'HIGH'>(() => {
    if (!dimensions.width || !scalePixels) return 'LOW';
    const ratio = scalePixels / dimensions.width;
    if (ratio >= 0.35 && boundary.length >= 5) return 'HIGH';
    if (ratio >= 0.15 && boundary.length >= 4) return 'MEDIUM';
    return 'LOW';
  }, [boundary.length, dimensions.width, scalePixels]);

  const openImage = (source:string) => {
    const next = new Image();
    next.onload=()=>{
      if (!next.naturalWidth || !next.naturalHeight || next.naturalWidth * next.naturalHeight > MAX_IMAGE_PIXELS) {
        setError(ne ? 'डिकोड गरेपछि तस्बिर धेरै ठूलो भयो। ४० मेगापिक्सेलभन्दा सानो तस्बिर प्रयोग गर्नुहोस्।' : 'That image is too large after decoding. Use an image below 40 megapixels.');
        return;
      }
      setDimensions({width:next.naturalWidth,height:next.naturalHeight});setImage(source);setScalePoints([]);setBoundary([]);setPixelsPerFoot(null);setSaved(false);setError('');setStep('CALIBRATE');
    };
    next.onerror=()=>setError(ne ? 'तस्बिर खोल्न सकिएन। PNG, JPG वा WebP तस्बिर छान्नुहोस्।' : 'That image could not be loaded. Choose a PNG, JPG, or WebP image.');
    next.src=source;
  };

  const upload = (event:ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0]; event.target.value=''; if(!file) return;
    if(!ALLOWED_IMAGE_TYPES.has(file.type)) return setError(ne ? 'PNG, JPG वा WebP तस्बिर छान्नुहोस्। SVG र एनिमेटेड ढाँचा स्वीकार हुँदैन।' : 'Choose a PNG, JPG, or WebP image. SVG and animated formats are not accepted.');
    if(file.size>MAX_IMAGE_BYTES) return setError(ne ? '१५ MB भन्दा सानो तस्बिर प्रयोग गर्नुहोस्।' : 'Use an image smaller than 15 MB.');
    const reader=new FileReader(); reader.onload=()=>openImage(String(reader.result)); reader.onerror=()=>setError(ne ? 'ब्राउजरले फाइल पढ्न सकेन।' : 'The browser could not read that file.'); reader.readAsDataURL(file);
  };

  const imagePoint=(event:PointerEvent<HTMLDivElement>):Point|null=>{
    const node=workspaceRef.current; if(!node||!dimensions.width||!dimensions.height) return null;
    const rect=node.getBoundingClientRect(); const imageAspect=dimensions.width/dimensions.height; const boxAspect=rect.width/rect.height;
    const width=boxAspect>imageAspect?rect.height*imageAspect:rect.width; const height=boxAspect>imageAspect?rect.height:rect.width/imageAspect;
    const offsetX=(rect.width-width)/2; const offsetY=(rect.height-height)/2; const x=event.clientX-rect.left-offsetX; const y=event.clientY-rect.top-offsetY;
    if(x<0||y<0||x>width||y>height) return null; return {x:(x/width)*dimensions.width,y:(y/height)*dimensions.height};
  };

  const addPoint=(event:PointerEvent<HTMLDivElement>)=>{const point=imagePoint(event);if(!point)return;if(step==='CALIBRATE'&&scalePoints.length<2)setScalePoints(items=>[...items,point]);if(step==='TRACE')setBoundary(items=>[...items,point]);};
  const confirmScale=()=>{
    const entered=Number(referenceDistance); if(scalePoints.length!==2)return notify(ne ? 'ज्ञात दूरीका दुवै अन्तिम बिन्दु छान्नुहोस्।' : 'Select both ends of a known distance.');
    if(!Number.isFinite(entered)||entered<=0)return notify(ne ? 'शून्यभन्दा ठूलो दूरी लेख्नुहोस्।' : 'Enter a distance greater than zero.');
    const px=distance(scalePoints[0],scalePoints[1]); if(px<Math.max(12,dimensions.width*0.02))return notify(ne ? 'स्केल रेखा धेरै छोटो छ। भरपर्दो अनुमानका लागि टाढाका दुई बिन्दु छान्नुहोस्।' : 'The scale line is too short. Select two points farther apart for a reliable estimate.');
    const feet=referenceUnit==='m'?entered*3.28084:entered; setPixelsPerFoot(px/feet); setBoundary([]); setStep('TRACE');
  };
  const save=()=>{
    if(!areaSqFt)return;
    const date = new Intl.DateTimeFormat(ne ? 'ne-NP' : 'en',{month:'short',day:'numeric',year:'numeric'}).format(new Date());
    const ok=onSave({id:crypto.randomUUID(),title:ne?`तस्बिरबाट नापिएको जग्गा · ${date}`:`Measured plot · ${date}`,sqFt:areaSqFt,sqM:areaSqM,date:Date.now(),type:'MEASURED',tags:['estimated','image-trace',confidence.toLowerCase()],source:{referenceDistanceFt:referenceUnit==='m'?Number(referenceDistance)*3.28084:Number(referenceDistance),referenceUnit,perimeterFt,scalePoints,boundary,imageWidth:dimensions.width,imageHeight:dimensions.height,confidence}});
    setSaved(ok);notify(ok?(ne?'नाप परियोजना यस उपकरणमा सुरक्षित भयो।':'Measurement project saved on this device.'):(ne?'अनुमान सुरक्षित गर्न सकिएन।':'This browser could not save the estimate.'));
  };
  const reset=()=>{setStep('SOURCE');setImage(null);setScalePoints([]);setBoundary([]);setPixelsPerFoot(null);setSaved(false);setError('');};

  const stepTitle = step==='CALIBRATE'?(ne?'तस्बिरको स्केल मिलाउनुहोस्':'Set the image scale'):step==='TRACE'?(ne?'जग्गाको सिमाना कोर्नुहोस्':'Trace the plot boundary'):(ne?'नाप समीक्षा गर्नुहोस्':'Review the measurement');
  const stepHelp = step==='CALIBRATE'?(ne?'वास्तविक दूरी थाहा भएका टाढाका दुई बिन्दु छान्नुहोस्।':'Select two distant points with a known real-world length.'):step==='TRACE'?(ne?'क्रमअनुसार प्रत्येक कुनामा ट्याप गर्नुहोस्। घुमाउरो भागमा थप बिन्दु प्रयोग गर्नुहोस्।':'Tap each corner in order. Use more points around curves.'):(ne?'गणनाका लागि बहुभुज स्वतः बन्द हुन्छ।':'The polygon is closed automatically for calculation.');

  return <div className="page-shell animate-enter">
    <header className="flex flex-col gap-5 border-b border-paper-200 pb-7 lg:flex-row lg:items-end lg:justify-between"><div className="page-header !mb-0"><p className="eyebrow">{ne?'निजी तस्बिर नाप':'Private image measurement'}</p><h1 className="page-title">{ne?'तस्बिरबाट जग्गाको सिमाना कोर्नुहोस्।':'Trace a plot from a screenshot.'}</h1><p className="page-copy">{ne?'तपाईंको तस्बिर यही ब्राउजरमा रहन्छ। एउटा भरपर्दो दूरी सेट गर्नुहोस्, सिमाना कोर्नुहोस् र क्षेत्रफल, परिधि तथा विश्वसनीयता समीक्षा गर्नुहोस्।':'Your uploaded image stays in this browser. Set one trusted distance, trace the boundary, and review area, perimeter, and confidence.'}</p></div>{step!=='SOURCE'&&<button type="button" onClick={reset} className="button-secondary focus-ring self-start"><RotateCcw size={16}/>{ne?'फेरि सुरु':'Start again'}</button>}</header>
    <ol className="my-6 grid grid-cols-4 gap-2" aria-label={ne?'नाप प्रगति':'Measurement progress'}>{steps.map((item,index)=><li key={item.id} className={`rounded-lg border px-2 py-3 text-center text-xs font-semibold sm:text-sm ${item.id===step?'border-ink-950 bg-ink-950 text-white':index<currentIndex?'border-leaf-200 bg-leaf-50 text-leaf-800':'border-paper-200 bg-white text-ink-400'}`}>{index+1}. {item.short}</li>)}</ol>
    {step==='SOURCE'?<section className="panel flex min-h-72 flex-col items-center justify-center p-7 text-center"><label className="flex cursor-pointer flex-col items-center"><span className="flex h-14 w-14 items-center justify-center rounded-lg bg-leaf-50 text-leaf-700"><Upload size={25}/></span><span className="mt-5 text-xl font-semibold text-ink-950">{ne?'जग्गाको तस्बिर अपलोड गर्नुहोस्':'Upload a plot screenshot'}</span><span className="mt-2 max-w-md text-sm leading-6 text-ink-500">{ne?'एउटा स्पष्ट माथिबाट देखिने तस्बिर छान्नुहोस् जसमा कम्तीमा एउटा ज्ञात दूरी होस्। तस्बिर स्थानीय रूपमा प्रशोधन हुन्छ।':'Choose a clear top-down image containing one labelled or known distance. Images are processed locally and are not sent to a capture service.'}</span><span className="button-primary mt-5">{ne?'तस्बिर छान्नुहोस्':'Choose image'}</span><span className="mt-3 text-xs text-ink-400">{ne?'PNG, JPG, WebP · अधिकतम १५ MB र ४० मेगापिक्सेल':'PNG, JPG, WebP · up to 15 MB and 40 megapixels'}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} className="sr-only"/></label>{error&&<p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}</section>:
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"><section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-paper-200 px-5 py-4"><div><p className="font-semibold text-ink-950">{stepTitle}</p><p className="mt-1 text-xs text-ink-500">{stepHelp}</p></div>{step==='TRACE'&&<div className="flex gap-2"><button type="button" onClick={()=>setBoundary(items=>items.slice(0,-1))} disabled={!boundary.length} className="icon-button focus-ring" aria-label={ne?'अन्तिम बिन्दु हटाउनुहोस्':'Undo last point'}><Undo2 size={17}/></button><button type="button" onClick={()=>setBoundary([])} disabled={!boundary.length} className="icon-button focus-ring text-red-700" aria-label={ne?'सिमाना खाली गर्नुहोस्':'Clear boundary'}><Trash2 size={17}/></button></div>}</div>
      <div ref={workspaceRef} onPointerDown={addPoint} aria-label={ne?'जग्गा रेखा कोर्ने क्षेत्र':'Plot tracing workspace'} className={`relative aspect-[4/3] min-h-[360px] w-full touch-none overflow-hidden bg-ink-950 sm:min-h-[480px] ${step==='RESULT'?'cursor-default':'cursor-crosshair'}`}>{image&&<img src={image} alt={ne?'अपलोड गरिएको जग्गा सन्दर्भ':'Uploaded plot reference'} className="pointer-events-none h-full w-full object-contain opacity-85"/>}<svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">{scalePoints.length===2&&<line x1={scalePoints[0].x} y1={scalePoints[0].y} x2={scalePoints[1].x} y2={scalePoints[1].y} stroke="#fb923c" strokeWidth={Math.max(3,dimensions.width*.003)} strokeDasharray="12 10"/>}{scalePoints.map((point,index)=><circle key={`s-${index}`} cx={point.x} cy={point.y} r={Math.max(7,dimensions.width*.007)} fill="#fb923c" stroke="#fff" strokeWidth="3"/>)}{!!boundary.length&&<path d={`M ${boundary.map(point=>`${point.x},${point.y}`).join(' L ')} ${step==='RESULT'?'Z':''}`} fill={step==='RESULT'?'rgba(0,56,147,.28)':'rgba(0,56,147,.14)'} stroke="#8baeff" strokeWidth={Math.max(3,dimensions.width*.003)}/>} {boundary.map((point,index)=><circle key={`b-${index}`} cx={point.x} cy={point.y} r={Math.max(6,dimensions.width*.006)} fill="#003893" stroke="#fff" strokeWidth="3"/>)}</svg></div></section>
      <aside className="panel h-fit p-5 sm:p-6">{step==='CALIBRATE'&&<><p className="eyebrow text-saffron-600">{ne?'स्केल':'Scale'}</p><h2 className="mt-2 text-xl font-semibold text-ink-950">{ne?'तपाईंले चिनाएको दूरी कति हो?':'What distance did you mark?'}</h2><p className="mt-2 text-sm leading-6 text-ink-500">{ne?'लामो सन्दर्भ रेखाले सामान्यतया राम्रो अनुमान दिन्छ।':'Longer reference lines generally produce better estimates.'}</p><div className="mt-4 rounded-lg bg-paper-100 p-3 text-sm">{ne?'छानिएका बिन्दु':'Points selected'}: <strong>{scalePoints.length}/2</strong>{scalePixels>0&&<span className="float-right">{formatDecimal(scalePixels,0)} px</span>}</div><div className="mt-4 grid grid-cols-[1fr_6rem] gap-2"><input value={referenceDistance} onChange={e=>setReferenceDistance(e.target.value)} inputMode="decimal" className="field numeral" aria-label={ne?'ज्ञात दूरी':'Known distance'}/><select value={referenceUnit} onChange={e=>setReferenceUnit(e.target.value as ReferenceUnit)} className="select-field" aria-label={ne?'दूरी एकाइ':'Distance unit'}><option value="ft">{ne?'फिट':'feet'}</option><option value="m">{ne?'मिटर':'metres'}</option></select></div><div className="mt-4 flex gap-2"><button type="button" onClick={()=>setScalePoints([])} disabled={!scalePoints.length} className="button-secondary focus-ring">{ne?'खाली':'Clear'}</button><button type="button" onClick={confirmScale} className="button-primary focus-ring flex-1">{ne?'अगाडि':'Continue'}</button></div></>}
      {step==='TRACE'&&<><p className="eyebrow">{ne?'सिमाना':'Boundary'}</p><h2 className="mt-2 text-xl font-semibold text-ink-950">{ne?'देखिएको जग्गाको बाहिरी रेखा कोर्नुहोस्।':'Outline the visible plot.'}</h2><p className="mt-2 text-sm leading-6 text-ink-500">{ne?'कम्तीमा तीन कुना थप्नुहोस्। सही बिन्दुले राम्रो अनुमान दिन्छ।':'Add at least three corners. More accurate points produce a better estimate.'}</p><div className="mt-5 rounded-lg bg-paper-100 p-3 text-sm">{ne?'सिमाना बिन्दु':'Boundary points'} <strong className="float-right">{boundary.length}</strong></div><button type="button" onClick={()=>boundary.length>=3?setStep('RESULT'):notify(ne?'कम्तीमा तीन सिमाना बिन्दु थप्नुहोस्।':'Add at least three boundary points.')} disabled={boundary.length<3} className="button-primary focus-ring mt-5 w-full">{ne?'अनुमान समीक्षा':'Review estimate'} <MapPinned size={17}/></button></>}
      {step==='RESULT'&&<><p className="eyebrow">{ne?'अनुमानित नाप':'Estimated measurement'}</p><p className="numeral mt-2 text-4xl font-semibold text-ink-950">{formatDecimal(areaSqFt)} <span className="text-sm text-ink-400">{ne?'वर्ग फिट':'sq ft'}</span></p><p className="mt-1 text-sm text-ink-500">{formatDecimal(areaSqM)} m² · {ne?'परिधि':'perimeter'} {formatDecimal(perimeterFt)} ft</p><span className={`status-pill mt-4 ${confidence==='HIGH'?'status-positive':confidence==='MEDIUM'?'status-warning':'bg-red-50 text-red-700'}`}>{ne?(confidence==='HIGH'?'उच्च विश्वसनीयता':confidence==='MEDIUM'?'मध्यम विश्वसनीयता':'कम विश्वसनीयता'):`${confidence.toLowerCase()} confidence`}</span><div className="mt-5 space-y-3"><Result label={ne?'पहाडी प्रणाली':'Hill system'} value={formatHillsWords(areaSqFt)}/><Result label={ne?'तराई प्रणाली':'Terai system'} value={formatTeraiWords(areaSqFt)}/><Result label={ne?'एकर':'Acres'} value={`${formatDecimal(fromSqFt(areaSqFt,'ACRE'),6)} ${ne?'एकर':'acres'}`}/></div><button type="button" onClick={save} disabled={saved} className="button-primary focus-ring mt-5 w-full">{saved?<Check size={17}/>:<Save size={17}/>} {saved?(ne?'सुरक्षित':'Saved'):(ne?'परियोजना सुरक्षित':'Save project')}</button><button type="button" onClick={()=>setStep('TRACE')} className="button-quiet focus-ring mt-2 w-full">{ne?'सिमाना सम्पादन':'Edit boundary'}</button><p className="mt-4 rounded-lg border border-saffron-200 bg-saffron-50 p-3 text-xs leading-5 text-ink-600">{ne?'यो तस्बिरमा आधारित अनुमान हो, कानुनी नापी होइन। विश्वसनीयताले रेखा कोर्ने अवस्था मात्र देखाउँछ, नापी वैधता होइन।':'This is an image-based estimate, not a legal survey. Confidence reflects tracing conditions, not cadastral validity.'}</p></>}</aside></div>}
  </div>;
};

const Result=({label,value}:{label:string;value:string})=><div className="panel-muted p-3"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p><p className="mt-1 text-sm font-semibold leading-6 text-ink-900">{value}</p></div>;
export default MeasureScreen;
