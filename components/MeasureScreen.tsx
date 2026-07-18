import { ChangeEvent, PointerEvent, useRef, useState } from 'react';
import { Check, ImagePlus, Link2, MapPinned, RotateCcw, Save, Trash2, Undo2, Upload } from 'lucide-react';
import { Point, SavedItem } from '../types';
import { calculatePolygonAreaPx, distance, formatDecimal, formatHills, formatTerai, toSqM } from '../utils/conversions';

type Step = 'SOURCE' | 'CALIBRATE' | 'TRACE' | 'RESULT';

interface Props {
  onSave: (item: SavedItem) => boolean;
  notify: (message: string) => void;
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'SOURCE', label: 'Image' },
  { id: 'CALIBRATE', label: 'Scale' },
  { id: 'TRACE', label: 'Boundary' },
  { id: 'RESULT', label: 'Estimate' },
];

const MeasureScreen = ({ onSave, notify }: Props) => {
  const [step, setStep] = useState<Step>('SOURCE');
  const [image, setImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [referenceFeet, setReferenceFeet] = useState('50');
  const [pixelsPerFoot, setPixelsPerFoot] = useState<number | null>(null);
  const [boundary, setBoundary] = useState<Point[]>([]);
  const [saved, setSaved] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const areaSqFt = pixelsPerFoot ? calculatePolygonAreaPx(boundary) / pixelsPerFoot ** 2 : 0;
  const areaSqM = toSqM(areaSqFt);
  const currentIndex = STEPS.findIndex((item) => item.id === step);

  const openImage = (source: string) => {
    const next = new Image();
    next.onload = () => {
      setDimensions({ width: next.naturalWidth, height: next.naturalHeight });
      setImage(source);
      setScalePoints([]);
      setBoundary([]);
      setPixelsPerFoot(null);
      setSaved(false);
      setError('');
      setBusy(false);
      setStep('CALIBRATE');
    };
    next.onerror = () => {
      setBusy(false);
      setError('That image could not be loaded. Upload a screenshot instead.');
    };
    next.src = source;
  };

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose a PNG, JPG, WebP, or another image file.');
    if (file.size > 15 * 1024 * 1024) return setError('Use an image smaller than 15 MB.');
    const reader = new FileReader();
    reader.onload = () => openImage(String(reader.result));
    reader.onerror = () => setError('The browser could not read that file.');
    reader.readAsDataURL(file);
  };

  const importUrl = async () => {
    try {
      const parsed = new URL(url.trim());
      setBusy(true);
      setError('');
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(parsed.href)}&screenshot=true&meta=false&embed=screenshot.url`);
      if (!response.ok) throw new Error('Screenshot request failed');
      const screenshotUrl = (await response.text()).replace(/^"|"$/g, '');
      if (!screenshotUrl.startsWith('http')) throw new Error('Screenshot missing');
      openImage(screenshotUrl);
    } catch (reason) {
      console.error('Map import failed.', reason);
      setBusy(false);
      setError('URL import is unavailable for this page. Upload a screenshot for the most reliable result.');
    }
  };

  const imagePoint = (event: PointerEvent<HTMLDivElement>): Point | null => {
    const node = workspaceRef.current;
    if (!node || !dimensions.width || !dimensions.height) return null;
    const rect = node.getBoundingClientRect();
    const imageAspect = dimensions.width / dimensions.height;
    const boxAspect = rect.width / rect.height;
    const width = boxAspect > imageAspect ? rect.height * imageAspect : rect.width;
    const height = boxAspect > imageAspect ? rect.height : rect.width / imageAspect;
    const offsetX = (rect.width - width) / 2;
    const offsetY = (rect.height - height) / 2;
    const x = event.clientX - rect.left - offsetX;
    const y = event.clientY - rect.top - offsetY;
    if (x < 0 || y < 0 || x > width || y > height) return null;
    return { x: (x / width) * dimensions.width, y: (y / height) * dimensions.height };
  };

  const addPoint = (event: PointerEvent<HTMLDivElement>) => {
    const point = imagePoint(event);
    if (!point) return;
    if (step === 'CALIBRATE' && scalePoints.length < 2) setScalePoints((items) => [...items, point]);
    if (step === 'TRACE') setBoundary((items) => [...items, point]);
  };

  const confirmScale = () => {
    const feet = Number(referenceFeet);
    if (scalePoints.length !== 2) return notify('Select two points on a known distance.');
    if (!Number.isFinite(feet) || feet <= 0) return notify('Enter a reference distance greater than zero.');
    setPixelsPerFoot(distance(scalePoints[0], scalePoints[1]) / feet);
    setBoundary([]);
    setStep('TRACE');
  };

  const save = () => {
    if (!areaSqFt) return;
    const ok = onSave({
      id: crypto.randomUUID(),
      title: `Measured plot - ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}`,
      sqFt: areaSqFt,
      sqM: areaSqM,
      date: Date.now(),
      type: 'MEASURED',
      tags: ['estimated', 'image-trace'],
      source: { referenceDistanceFt: Number(referenceFeet) },
    });
    setSaved(ok);
    notify(ok ? 'Plot estimate saved on this device.' : 'This browser could not save the estimate.');
  };

  const reset = () => {
    setStep('SOURCE');
    setImage(null);
    setScalePoints([]);
    setBoundary([]);
    setPixelsPerFoot(null);
    setSaved(false);
    setError('');
  };

  return (
    <div className="animate-enter mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-leaf-700">Plot estimator</p>
          <h1 className="mt-2 font-display text-4xl text-ink-950 sm:text-5xl">Estimate area from a map image.</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">Calibrate one known distance, trace the visible boundary, and review the estimate.</p>
        </div>
        {step !== 'SOURCE' && (
          <button type="button" onClick={reset} className="focus-ring inline-flex items-center gap-2 self-start rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-paper-50">
            <RotateCcw size={17} aria-hidden="true" /> Start over
          </button>
        )}
      </div>

      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Measurement steps">
        {STEPS.map((item, index) => (
          <li key={item.id} className={`rounded-xl border px-2 py-3 text-center text-xs font-bold sm:text-sm ${item.id === step ? 'border-leaf-500 bg-leaf-50 text-leaf-800' : index < currentIndex ? 'border-leaf-200 bg-white text-leaf-700' : 'border-paper-300 bg-paper-50 text-ink-400'}`}>
            <span className="hidden sm:inline">{index + 1}. </span>{item.label}
          </li>
        ))}
      </ol>

      {step === 'SOURCE' ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <label className="surface-card flex min-h-72 cursor-pointer flex-col items-center justify-center p-7 text-center hover:border-leaf-300">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-800"><Upload size={26} aria-hidden="true" /></span>
            <span className="mt-5 text-2xl font-bold text-ink-950">Upload a map screenshot</span>
            <span className="mt-2 max-w-sm text-sm leading-6 text-ink-600">Use a clear top-down image with at least one known distance.</span>
            <span className="mt-5 rounded-full bg-ink-950 px-4 py-2 text-sm font-bold text-white">Choose image</span>
            <span className="mt-3 text-xs text-ink-400">PNG, JPG or WebP, up to 15 MB</span>
            <input type="file" accept="image/*" onChange={upload} className="sr-only" />
          </label>
          <div className="surface-card flex min-h-72 flex-col justify-center p-7">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-600"><Link2 size={26} aria-hidden="true" /></span>
            <h2 className="mt-5 text-2xl font-bold text-ink-950">Try a map page URL</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">A third-party screenshot service is used. Protected or private pages may block it.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://maps.example.com/..." className="focus-ring min-h-12 min-w-0 flex-1 rounded-xl border border-paper-300 bg-white px-4" />
              <button type="button" onClick={importUrl} disabled={busy || !url.trim()} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 font-bold text-white disabled:opacity-50"><ImagePlus size={18} aria-hidden="true" />{busy ? 'Importing...' : 'Import'}</button>
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p>}
          </div>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="surface-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-sm font-bold text-ink-950">{step === 'CALIBRATE' ? 'Set the image scale' : step === 'TRACE' ? 'Trace the plot boundary' : 'Estimated plot'}</p>
                <p className="mt-0.5 text-xs text-ink-500">{step === 'CALIBRATE' ? 'Select both ends of one known distance.' : step === 'TRACE' ? 'Tap around the boundary in order.' : 'Review the boundary and estimate.'}</p>
              </div>
              {step === 'TRACE' && <div className="flex gap-2"><button type="button" onClick={() => setBoundary((items) => items.slice(0, -1))} disabled={!boundary.length} aria-label="Undo last point" className="focus-ring rounded-lg border border-paper-300 bg-white p-2 disabled:opacity-40"><Undo2 size={18} /></button><button type="button" onClick={() => setBoundary([])} disabled={!boundary.length} aria-label="Clear boundary" className="focus-ring rounded-lg border border-paper-300 bg-white p-2 disabled:opacity-40"><Trash2 size={18} /></button></div>}
            </div>
            <div ref={workspaceRef} onPointerDown={addPoint} role="application" aria-label="Plot tracing workspace" className={`relative aspect-[4/3] min-h-[360px] w-full touch-none overflow-hidden bg-ink-950 sm:min-h-[480px] ${step === 'RESULT' ? 'cursor-default' : 'cursor-crosshair'}`}>
              {image && <img src={image} alt="Uploaded plot reference" className="pointer-events-none h-full w-full object-contain opacity-85" />}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                {scalePoints.length === 2 && <line x1={scalePoints[0].x} y1={scalePoints[0].y} x2={scalePoints[1].x} y2={scalePoints[1].y} stroke="#ffc347" strokeWidth={Math.max(3, dimensions.width * 0.003)} strokeDasharray="12 10" />}
                {scalePoints.map((point, index) => <circle key={`scale-${index}`} cx={point.x} cy={point.y} r={Math.max(7, dimensions.width * 0.007)} fill="#ffc347" stroke="#fff" strokeWidth="3" />)}
                {!!boundary.length && <path d={`M ${boundary.map((point) => `${point.x},${point.y}`).join(' L ')} ${step === 'RESULT' ? 'Z' : ''}`} fill={step === 'RESULT' ? 'rgba(45,152,93,.3)' : 'rgba(45,152,93,.16)'} stroke="#83d2a1" strokeWidth={Math.max(3, dimensions.width * 0.003)} />}
                {boundary.map((point, index) => <circle key={`point-${index}`} cx={point.x} cy={point.y} r={Math.max(6, dimensions.width * 0.006)} fill="#2d985d" stroke="#fff" strokeWidth="3" />)}
              </svg>
            </div>
          </section>

          <aside className="surface-card h-fit p-5 sm:p-6">
            {step === 'CALIBRATE' && <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-saffron-600">Reference distance</p>
              <h2 className="mt-2 text-2xl font-bold text-ink-950">Tell Napiyo what the scale means.</h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">Select two endpoints of a labelled road width, plot edge, or another distance you know.</p>
              <div className="mt-5 rounded-2xl bg-paper-100 p-4 text-sm"><span className="font-semibold text-ink-600">Points selected</span><span className="numeral float-right font-bold">{scalePoints.length}/2</span></div>
              <label htmlFor="reference-distance" className="mt-5 block text-sm font-semibold">Real distance in feet</label>
              <div className="mt-2 flex overflow-hidden rounded-xl border border-paper-300 bg-white"><input id="reference-distance" inputMode="decimal" value={referenceFeet} onChange={(event) => setReferenceFeet(event.target.value)} className="numeral min-w-0 flex-1 px-4 py-3 text-xl font-bold outline-none" /><span className="flex items-center border-l border-paper-300 bg-paper-50 px-4 text-sm font-bold text-ink-500">FT</span></div>
              <div className="mt-4 flex gap-2"><button type="button" onClick={() => setScalePoints([])} disabled={!scalePoints.length} className="focus-ring min-h-12 rounded-xl border border-paper-300 bg-white px-4 text-sm font-bold disabled:opacity-40">Reset</button><button type="button" onClick={confirmScale} className="focus-ring min-h-12 flex-1 rounded-xl bg-leaf-700 px-4 text-sm font-bold text-white">Continue</button></div>
            </>}
            {step === 'TRACE' && <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-700">Boundary trace</p>
              <h2 className="mt-2 text-2xl font-bold text-ink-950">Outline the visible plot.</h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">Add points around the boundary in order. More points can follow irregular edges.</p>
              <div className="mt-5 rounded-2xl bg-paper-100 p-4 text-sm"><span className="font-semibold text-ink-600">Boundary points</span><span className="numeral float-right font-bold">{boundary.length}</span></div>
              <button type="button" onClick={() => boundary.length >= 3 ? setStep('RESULT') : notify('Add at least three boundary points.')} disabled={boundary.length < 3} className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-leaf-700 px-4 font-bold text-white disabled:opacity-45">Finish boundary <MapPinned size={18} /></button>
            </>}
            {step === 'RESULT' && <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-700">Approximate area</p>
              <p className="numeral mt-2 text-4xl font-bold text-ink-950">{formatDecimal(areaSqFt)} <span className="text-base font-semibold text-ink-500">sq ft</span></p>
              <p className="numeral mt-1 text-sm font-semibold text-ink-500">{formatDecimal(areaSqM)} sq m</p>
              <div className="mt-5 space-y-3"><Result label="Hill system" value={formatHills(areaSqFt)} helper="R-A-P-D" /><Result label="Terai system" value={formatTerai(areaSqFt)} helper="B-K-D" /></div>
              <button type="button" onClick={save} disabled={saved} className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-leaf-700 px-4 font-bold text-white disabled:bg-leaf-200 disabled:text-leaf-800">{saved ? <Check size={18} /> : <Save size={18} />}{saved ? 'Saved' : 'Save estimate'}</button>
              <button type="button" onClick={() => setStep('TRACE')} className="focus-ring mt-2 min-h-11 w-full rounded-xl font-bold text-ink-600 hover:bg-paper-100">Edit boundary</button>
              <div className="mt-4 rounded-xl border border-saffron-200 bg-saffron-50 p-3 text-xs leading-5 text-ink-700">This estimate depends on calibration, image perspective, and tracing. It is not a legal survey.</div>
            </>}
          </aside>
        </div>
      )}
    </div>
  );
};

const Result = ({ label, value, helper }: { label: string; value: string; helper: string }) => <div className="surface-muted p-4"><div className="flex justify-between gap-4"><span className="text-sm font-semibold text-ink-500">{label}</span><span className="text-xs font-bold text-ink-400">{helper}</span></div><p className="numeral mt-1 text-xl font-bold text-ink-950">{value}</p></div>;

export default MeasureScreen;
