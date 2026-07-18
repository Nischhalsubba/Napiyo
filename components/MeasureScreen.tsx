import { type ChangeEvent, type PointerEvent, useRef, useState } from 'react';
import { Check, ImagePlus, Link2, MapPinned, RotateCcw, Save, Trash2, Undo2, Upload } from 'lucide-react';
import { Point, SavedItem } from '../types';
import { calculatePolygonAreaPx, distance, formatDecimal, formatHills, formatTerai, toSqM } from '../utils/conversions';

type Step = 'SOURCE' | 'CALIBRATE' | 'TRACE' | 'RESULT';

interface Props {
  onSave: (item: SavedItem) => boolean;
  notify: (message: string) => void;
}

const STEPS: { id: Step; label: string; short: string }[] = [
  { id: 'SOURCE', label: 'Add image', short: 'Image' },
  { id: 'CALIBRATE', label: 'Set scale', short: 'Scale' },
  { id: 'TRACE', label: 'Trace edge', short: 'Trace' },
  { id: 'RESULT', label: 'Review', short: 'Review' },
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
    if (!file.type.startsWith('image/')) {
      setError('Choose a PNG, JPG, WebP, or another image file.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Use an image smaller than 15 MB.');
      return;
    }
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
      setError('This page blocked automatic capture. Upload a screenshot instead.');
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
    if (scalePoints.length !== 2) return notify('Select both ends of a known distance.');
    if (!Number.isFinite(feet) || feet <= 0) return notify('Enter a distance greater than zero.');
    setPixelsPerFoot(distance(scalePoints[0], scalePoints[1]) / feet);
    setBoundary([]);
    setStep('TRACE');
  };

  const save = () => {
    if (!areaSqFt) return;
    const ok = onSave({
      id: crypto.randomUUID(),
      title: `Measured plot · ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}`,
      sqFt: areaSqFt,
      sqM: areaSqM,
      date: Date.now(),
      type: 'MEASURED',
      tags: ['estimated', 'image-trace'],
      source: { referenceDistanceFt: Number(referenceFeet) },
    });
    setSaved(ok);
    notify(ok ? 'Estimate saved on this device.' : 'This browser could not save the estimate.');
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
    <div className="page-shell animate-enter">
      <header className="flex flex-col gap-5 border-b border-paper-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="page-header !mb-0">
          <p className="eyebrow">Image measurement</p>
          <h1 className="page-title">Trace a plot from an image.</h1>
          <p className="page-copy">Set one known distance, mark the boundary, and Napiyo estimates the enclosed area.</p>
        </div>
        {step !== 'SOURCE' && (
          <button type="button" onClick={reset} className="button-secondary focus-ring self-start">
            <RotateCcw size={16} aria-hidden="true" />
            Start again
          </button>
        )}
      </header>

      <ol className="my-6 grid grid-cols-4 gap-2" aria-label="Measurement progress">
        {STEPS.map((item, index) => {
          const active = item.id === step;
          const complete = index < currentIndex;
          return (
            <li key={item.id} className={`rounded-xl border px-2 py-3 text-center text-xs font-semibold sm:text-sm ${active ? 'border-ink-950 bg-ink-950 text-white' : complete ? 'border-leaf-200 bg-leaf-50 text-leaf-800' : 'border-paper-200 bg-paper-50 text-ink-400'}`}>
              <span className="hidden sm:inline">{index + 1}. </span>{item.short}
            </li>
          );
        })}
      </ol>

      {step === 'SOURCE' ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <label className="panel flex min-h-72 cursor-pointer flex-col items-center justify-center p-7 text-center transition hover:border-leaf-300 hover:bg-leaf-50/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700"><Upload size={22} aria-hidden="true" /></span>
            <span className="mt-5 text-xl font-semibold tracking-[-0.02em] text-ink-950">Upload a screenshot</span>
            <span className="mt-2 max-w-sm text-sm leading-6 text-ink-500">Choose a clear top-down image with one distance you already know.</span>
            <span className="button-primary mt-5">Choose image</span>
            <span className="mt-3 text-xs text-ink-400">PNG, JPG or WebP · up to 15 MB</span>
            <input type="file" accept="image/*" onChange={upload} className="sr-only" />
          </label>

          <div className="panel flex min-h-72 flex-col justify-center p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600"><Link2 size={22} aria-hidden="true" /></span>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-ink-950">Capture a public map page</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">Public pages may work automatically. Private or protected pages usually require a screenshot.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste a public map URL" className="field min-w-0 flex-1" />
              <button type="button" onClick={importUrl} disabled={busy || !url.trim()} className="button-primary focus-ring">
                <ImagePlus size={17} aria-hidden="true" />
                {busy ? 'Capturing…' : 'Capture'}
              </button>
            </div>
            {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p>}
          </div>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-200 px-4 py-4 sm:px-5">
              <div>
                <p className="text-sm font-semibold text-ink-950">{step === 'CALIBRATE' ? 'Set the image scale' : step === 'TRACE' ? 'Trace the plot edge' : 'Review the estimate'}</p>
                <p className="mt-1 text-xs text-ink-500">{step === 'CALIBRATE' ? 'Tap both ends of one known distance.' : step === 'TRACE' ? 'Add points around the boundary in order.' : 'Check the traced shape and calculated area.'}</p>
              </div>
              {step === 'TRACE' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBoundary((items) => items.slice(0, -1))} disabled={!boundary.length} aria-label="Undo last point" className="icon-button focus-ring"><Undo2 size={17} /></button>
                  <button type="button" onClick={() => setBoundary([])} disabled={!boundary.length} aria-label="Clear boundary" className="icon-button focus-ring text-red-700"><Trash2 size={17} /></button>
                </div>
              )}
            </div>

            <div ref={workspaceRef} onPointerDown={addPoint} role="application" aria-label="Plot tracing workspace" className={`relative aspect-[4/3] min-h-[360px] w-full touch-none overflow-hidden bg-ink-950 sm:min-h-[480px] ${step === 'RESULT' ? 'cursor-default' : 'cursor-crosshair'}`}>
              {image && <img src={image} alt="Uploaded plot reference" className="pointer-events-none h-full w-full object-contain opacity-85" />}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                {scalePoints.length === 2 && <line x1={scalePoints[0].x} y1={scalePoints[0].y} x2={scalePoints[1].x} y2={scalePoints[1].y} stroke="#ffb96c" strokeWidth={Math.max(3, dimensions.width * 0.003)} strokeDasharray="12 10" />}
                {scalePoints.map((point, index) => <circle key={`scale-${index}`} cx={point.x} cy={point.y} r={Math.max(7, dimensions.width * 0.007)} fill="#ffb96c" stroke="#fff" strokeWidth="3" />)}
                {!!boundary.length && <path d={`M ${boundary.map((point) => `${point.x},${point.y}`).join(' L ')} ${step === 'RESULT' ? 'Z' : ''}`} fill={step === 'RESULT' ? 'rgba(35,141,114,.32)' : 'rgba(35,141,114,.16)'} stroke="#78cbb4" strokeWidth={Math.max(3, dimensions.width * 0.003)} />}
                {boundary.map((point, index) => <circle key={`point-${index}`} cx={point.x} cy={point.y} r={Math.max(6, dimensions.width * 0.006)} fill="#238d72" stroke="#fff" strokeWidth="3" />)}
              </svg>
            </div>
          </section>

          <aside className="panel h-fit p-5 sm:p-6">
            {step === 'CALIBRATE' && (
              <>
                <p className="eyebrow text-saffron-600">Scale</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink-950">What distance did you mark?</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">Use a labelled road width, plot edge, or another distance you trust.</p>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-paper-100 p-3 text-sm"><span className="font-medium text-ink-600">Points selected</span><span className="numeral font-semibold">{scalePoints.length}/2</span></div>
                <label htmlFor="reference-distance" className="field-label mt-5">Known distance in feet</label>
                <div className="relative"><input id="reference-distance" inputMode="decimal" value={referenceFeet} onChange={(event) => setReferenceFeet(event.target.value)} className="field numeral pr-14 text-lg font-semibold" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400">FT</span></div>
                <div className="mt-4 flex gap-2"><button type="button" onClick={() => setScalePoints([])} disabled={!scalePoints.length} className="button-secondary focus-ring">Clear</button><button type="button" onClick={confirmScale} className="button-primary focus-ring flex-1">Continue</button></div>
              </>
            )}

            {step === 'TRACE' && (
              <>
                <p className="eyebrow">Boundary</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink-950">Outline the visible plot.</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">Tap corners in order. Add more points where the edge bends.</p>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-paper-100 p-3 text-sm"><span className="font-medium text-ink-600">Boundary points</span><span className="numeral font-semibold">{boundary.length}</span></div>
                <button type="button" onClick={() => boundary.length >= 3 ? setStep('RESULT') : notify('Add at least three boundary points.')} disabled={boundary.length < 3} className="button-primary focus-ring mt-5 w-full">Review estimate <MapPinned size={17} /></button>
              </>
            )}

            {step === 'RESULT' && (
              <>
                <p className="eyebrow">Estimated area</p>
                <p className="numeral mt-2 text-4xl font-semibold tracking-[-0.04em] text-ink-950">{formatDecimal(areaSqFt)} <span className="text-sm font-medium text-ink-400">sq ft</span></p>
                <p className="numeral mt-1 text-sm font-medium text-ink-500">{formatDecimal(areaSqM)} sq m</p>
                <div className="mt-5 space-y-3"><Result label="Hill system" value={formatHills(areaSqFt)} helper="R-A-P-D" /><Result label="Terai system" value={formatTerai(areaSqFt)} helper="B-K-D" /></div>
                <button type="button" onClick={save} disabled={saved} className="button-primary focus-ring mt-5 w-full">{saved ? <Check size={17} /> : <Save size={17} />}{saved ? 'Saved' : 'Save estimate'}</button>
                <button type="button" onClick={() => setStep('TRACE')} className="button-quiet focus-ring mt-2 w-full">Edit boundary</button>
                <p className="mt-4 rounded-xl border border-saffron-200 bg-saffron-50 p-3 text-xs leading-5 text-ink-600">Accuracy depends on the image, scale, and tracing. This is not a legal survey.</p>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

const Result = ({ label, value, helper }: { label: string; value: string; helper: string }) => (
  <div className="panel-muted p-4">
    <div className="flex justify-between gap-4"><span className="text-xs font-semibold text-ink-500">{label}</span><span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">{helper}</span></div>
    <p className="numeral mt-1 text-lg font-semibold text-ink-950">{value}</p>
  </div>
);

export default MeasureScreen;
