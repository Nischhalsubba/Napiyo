import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Download, LocateFixed, MapPin, Pause, Play, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react';
import { GeoPoint, SavedItem } from '../types';
import { formatDecimal, formatHillsWords, formatTeraiWords, toSqM } from '../utils/conversions';
import {
  areaSqFtFromGeo,
  averageAccuracyM,
  perimeterFtFromGeo,
  projectToGeoJson,
  projectToGpx,
  projectToKml,
  shouldAcceptPoint,
  toLocalMetres,
} from '../utils/geospatial';

interface Props {
  onSave: (item: SavedItem) => boolean;
  notify: (message: string) => void;
}

const download = (filename: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const GpsMeasureScreen = ({ onSave, notify }: Props) => {
  const [latest, setLatest] = useState<GeoPoint | null>(null);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [maximumAccuracy, setMaximumAccuracy] = useState(20);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const watchId = useRef<number | null>(null);

  const areaSqFt = areaSqFtFromGeo(points);
  const perimeterFt = perimeterFtFromGeo(points);
  const averageAccuracy = averageAccuracyM(points);
  const worstAccuracy = points.length ? Math.max(...points.map((point) => point.accuracy)) : 0;
  const acceptable = latest ? latest.accuracy <= maximumAccuracy : false;
  const confidence = averageAccuracy <= 5 && points.length >= 4 ? 'HIGH' : averageAccuracy <= 12 && points.length >= 3 ? 'MEDIUM' : 'LOW';

  const stop = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setWatching(false);
  };

  const start = () => {
    if (!('geolocation' in navigator)) return setError('This browser does not provide location access.');
    setError('');
    setWatching(true);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => setLatest({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        timestamp: position.timestamp,
      }),
      (reason) => {
        setError(reason.code === 1 ? 'Location permission was denied. Allow precise location access and try again.' : 'A reliable location fix is not available yet. Move outdoors and try again.');
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
  };

  useEffect(() => () => stop(), []);

  const addCorner = () => {
    if (!latest) return notify('Wait for a location fix first.');
    if (!shouldAcceptPoint(latest, points, maximumAccuracy)) {
      return notify(latest.accuracy > maximumAccuracy
        ? `Accuracy is ±${formatDecimal(latest.accuracy, 0)} m. Wait until it is within ±${maximumAccuracy} m.`
        : 'This corner is too close to the previous one. Move to the next boundary corner.');
    }
    setPoints((current) => [...current, latest]);
    setSaved(false);
    notify(`Corner ${points.length + 1} added.`);
  };

  const title = `GPS plot · ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}`;

  const save = () => {
    if (points.length < 3 || !areaSqFt) return;
    const ok = onSave({
      id: crypto.randomUUID(), title, sqFt: areaSqFt, sqM: toSqM(areaSqFt), date: Date.now(), type: 'GPS',
      tags: ['gps', 'field-estimate', confidence.toLowerCase()],
      source: { geoPoints: points, perimeterFt, gpsAccuracyAverage: averageAccuracy, gpsAccuracyWorst: worstAccuracy, confidence },
    });
    setSaved(ok);
    notify(ok ? 'GPS project saved on this device.' : 'This browser could not save the GPS project.');
  };

  const exportProject = (kind: 'geojson' | 'kml' | 'gpx') => {
    if (points.length < 3) return notify('Add at least three corners before exporting.');
    const exports = {
      geojson: [projectToGeoJson(title, points), 'application/geo+json'],
      kml: [projectToKml(title, points), 'application/vnd.google-earth.kml+xml'],
      gpx: [projectToGpx(title, points), 'application/gpx+xml'],
    } as const;
    download(`napiyo-gps-plot.${kind}`, exports[kind][0], exports[kind][1]);
  };

  const localPoints = useMemo(() => toLocalMetres(points), [points]);

  return <div className="page-shell animate-enter !max-w-[96rem]">
    <header className="page-header max-w-4xl">
      <p className="eyebrow">Field GPS estimate</p>
      <h1 className="page-title">Stand at each plot corner and record it.</h1>
      <p className="page-copy">Napiyo uses your device location without a map provider. Wait for a good accuracy reading at every corner, add the point, and export the result as GeoJSON, KML, or GPX.</p>
    </header>

    <div className="grid gap-5 xl:grid-cols-[23rem_minmax(0,1fr)]">
      <aside className="space-y-4">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="section-title">Location signal</p><p className="section-copy">Best used outdoors with precise location enabled.</p></div><span className={`h-3 w-3 rounded-full ${watching ? 'bg-leaf-500 animate-pulse' : 'bg-ink-200'}`} /></div>
          <button type="button" onClick={watching ? stop : start} className="button-primary focus-ring mt-5 w-full">{watching ? <><Pause size={17}/>Pause location</> : <><Play size={17}/>Start precise location</>}</button>
          <div className="mt-4 rounded-xl bg-paper-100 p-4">
            <p className="metric-label">Current accuracy</p>
            <p className={`numeral mt-1 text-3xl font-semibold ${acceptable ? 'text-leaf-700' : 'text-saffron-700'}`}>{latest ? `±${formatDecimal(latest.accuracy, 0)} m` : 'Waiting'}</p>
            {latest && <p className="mt-1 text-xs text-ink-500">{formatDecimal(latest.lat, 6)}, {formatDecimal(latest.lng, 6)}</p>}
          </div>
          <label className="field-label mt-4" htmlFor="gps-accuracy">Maximum accepted accuracy: ±{maximumAccuracy} m</label>
          <input id="gps-accuracy" type="range" min="5" max="50" step="1" value={maximumAccuracy} onChange={(event) => setMaximumAccuracy(Number(event.target.value))} className="w-full accent-emerald-600" />
          <button type="button" onClick={addCorner} disabled={!latest || !acceptable} className="button-secondary focus-ring mt-4 w-full disabled:opacity-45"><MapPin size={17}/>Add this corner</button>
          {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p>}
        </section>

        <section className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="section-title">Recorded corners</p><p className="section-copy">Walk around the boundary in order.</p></div><strong className="numeral text-2xl text-ink-950">{points.length}</strong></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setPoints((current) => current.slice(0, -1))} disabled={!points.length} className="button-secondary focus-ring"><Undo2 size={16}/>Undo</button><button type="button" onClick={() => { setPoints([]); setSaved(false); }} disabled={!points.length} className="button-secondary focus-ring text-red-700"><Trash2 size={16}/>Clear</button></div>
          <p className="mt-4 rounded-xl border border-saffron-200 bg-saffron-50 p-3 text-xs leading-5 text-ink-600">Phone GPS can drift by several metres. This is useful for rough field planning, not boundary disputes, registration, or construction approval.</p>
        </section>
      </aside>

      <main className="space-y-4">
        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-200 px-5 py-4"><div><p className="section-title">Boundary preview</p><p className="section-copy">The shape is normalized to fit this canvas. It is not a satellite map.</p></div><Crosshair size={20} className="text-leaf-700"/></div>
          <div className="min-h-[380px] bg-[#eef2ee] p-4 sm:min-h-[520px]"><GpsPreview points={localPoints}/></div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Estimated area" value={`${formatDecimal(areaSqFt)} ft²`} sub={`${formatDecimal(toSqM(areaSqFt))} m²`} />
          <Stat label="Perimeter" value={`${formatDecimal(perimeterFt)} ft`} sub={`${formatDecimal(perimeterFt / 3.28084)} m`} />
          <Stat label="Average accuracy" value={points.length ? `±${formatDecimal(averageAccuracy, 1)} m` : '—'} sub={points.length ? `worst ±${formatDecimal(worstAccuracy, 1)} m` : 'Add corners'} />
          <Stat label="Confidence" value={points.length >= 3 ? confidence.toLowerCase() : '—'} sub="Based on device fixes" />
        </section>

        {points.length >= 3 && <section className="panel p-5 sm:p-6"><div className="grid gap-4 lg:grid-cols-2"><div><p className="metric-label">Hill system</p><p className="mt-2 font-semibold leading-6 text-ink-800">{formatHillsWords(areaSqFt)}</p></div><div><p className="metric-label">Terai system</p><p className="mt-2 font-semibold leading-6 text-ink-800">{formatTeraiWords(areaSqFt)}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={save} disabled={saved} className="button-primary focus-ring"><Save size={16}/>{saved ? 'Saved' : 'Save project'}</button>{(['geojson','kml','gpx'] as const).map((kind) => <button key={kind} type="button" onClick={() => exportProject(kind)} className="button-secondary focus-ring"><Download size={16}/>{kind.toUpperCase()}</button>)}</div></section>}
      </main>
    </div>
  </div>;
};

const GpsPreview = ({ points }: { points: { x: number; y: number }[] }) => {
  if (!points.length) return <div className="flex min-h-[350px] flex-col items-center justify-center text-center text-ink-400"><LocateFixed size={40}/><p className="mt-3 text-sm font-semibold">Start location and add your first corner.</p></div>;
  const xs = points.map((point) => point.x), ys = points.map((point) => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 1), height = Math.max(maxY - minY, 1);
  const normalized = points.map((point) => ({ x: 60 + ((point.x - minX) / width) * 880, y: 60 + ((maxY - point.y) / height) * 520 }));
  return <svg viewBox="0 0 1000 640" className="h-full min-h-[350px] w-full" role="img" aria-label={`GPS polygon with ${points.length} recorded corners`}><defs><pattern id="gps-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d5ded9" strokeWidth="1"/></pattern></defs><rect width="1000" height="640" rx="24" fill="url(#gps-grid)"/><path d={`M ${normalized.map((point) => `${point.x},${point.y}`).join(' L ')} ${points.length >= 3 ? 'Z' : ''}`} fill={points.length >= 3 ? 'rgba(16,185,129,.2)' : 'none'} stroke="#0f766e" strokeWidth="6" strokeLinejoin="round"/>{normalized.map((point, index) => <g key={index}><circle cx={point.x} cy={point.y} r="13" fill="#0f766e" stroke="white" strokeWidth="5"/><text x={point.x} y={point.y - 22} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0f172a">{index + 1}</text></g>)}</svg>;
};

const Stat = ({ label, value, sub }: { label: string; value: string; sub: string }) => <div className="panel p-4"><p className="metric-label">{label}</p><p className="numeral mt-2 text-xl font-semibold capitalize text-ink-950">{value}</p><p className="mt-1 text-xs text-ink-500">{sub}</p></div>;

export default GpsMeasureScreen;
