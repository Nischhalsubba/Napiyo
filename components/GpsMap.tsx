import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, ExternalLink, Eye, EyeOff, Hand, LocateFixed, Minus, MousePointer2, Plus } from 'lucide-react';
import { GeoPoint } from '../types';
import {
  metresPerPixel,
  projectGeoToWorldPixels,
  projectWorldPixelsToGeo,
  toLocalMetres,
  WEB_MERCATOR_TILE_SIZE,
} from '../utils/geospatial';

interface Props {
  latest: GeoPoint | null;
  points: GeoPoint[];
  onPointsChange: (points: GeoPoint[]) => void;
  notify: (message: string) => void;
}

type MapMode = 'pan' | 'draw';

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 640;
const MIN_ZOOM = 7;
const MAX_ZOOM = 20;
const NEPAL_CENTER = { lat: 28.25, lng: 84.0 };
const PRIMARY = '#003893';
const PRIMARY_LIGHT = 'rgba(0,56,147,.18)';
const ACCENT = '#dc143c';

const GpsMap = ({ latest, points, onPointsChange, notify }: Props) => {
  const [zoom, setZoom] = useState(points.length || latest ? 18 : 8);
  const [showTiles, setShowTiles] = useState(true);
  const [failedTiles, setFailedTiles] = useState<Set<string>>(() => new Set());
  const [center, setCenter] = useState(() => latest ?? points.at(-1) ?? NEPAL_CENTER);
  const [mode, setMode] = useState<MapMode>('pan');
  const [followLocation, setFollowLocation] = useState(Boolean(latest));
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    centerWorld: { x: number; y: number };
    moved: boolean;
    markerIndex: number | null;
  } | null>(null);

  useEffect(() => {
    if (!latest || !followLocation) return;
    setCenter({ lat: latest.lat, lng: latest.lng });
    setZoom((value) => Math.max(value, 18));
  }, [followLocation, latest]);

  const map = useMemo(() => {
    const centerWorld = projectGeoToWorldPixels(center, zoom);
    const left = centerWorld.x - VIEW_WIDTH / 2;
    const top = centerWorld.y - VIEW_HEIGHT / 2;
    const tileCount = 2 ** zoom;
    const minTileX = Math.floor(left / WEB_MERCATOR_TILE_SIZE);
    const maxTileX = Math.floor((left + VIEW_WIDTH) / WEB_MERCATOR_TILE_SIZE);
    const minTileY = Math.max(0, Math.floor(top / WEB_MERCATOR_TILE_SIZE));
    const maxTileY = Math.min(tileCount - 1, Math.floor((top + VIEW_HEIGHT) / WEB_MERCATOR_TILE_SIZE));
    const tiles: { key: string; src: string; left: number; top: number }[] = [];

    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
        const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
        tiles.push({
          key: `${zoom}-${wrappedX}-${tileY}`,
          src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
          left: tileX * WEB_MERCATOR_TILE_SIZE - left,
          top: tileY * WEB_MERCATOR_TILE_SIZE - top,
        });
      }
    }

    const project = (point: Pick<GeoPoint, 'lat' | 'lng'>) => {
      const world = projectGeoToWorldPixels(point, zoom);
      return { x: world.x - left, y: world.y - top };
    };

    return {
      centerWorld,
      tiles,
      projectedPoints: points.map(project),
      projectedLatest: latest ? project(latest) : null,
    };
  }, [center, latest, points, zoom]);

  const geoAtPointer = (event: Pick<ReactPointerEvent, 'clientX' | 'clientY'>) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    return projectWorldPixelsToGeo({
      x: map.centerWorld.x + x - VIEW_WIDTH / 2,
      y: map.centerWorld.y + y - VIEW_HEIGHT / 2,
    }, zoom);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-map-control]') || target.closest('[data-map-marker]')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      centerWorld: map.centerWorld,
      moved: false,
      markerIndex: null,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.markerIndex !== null) {
      const geo = geoAtPointer(event);
      if (!geo) return;
      onPointsChange(points.map((point, index) => index === drag.markerIndex
        ? { ...point, ...geo, accuracy: 0, timestamp: Date.now() }
        : point));
      return;
    }
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    if (mode === 'draw' && !drag.moved) return;
    setFollowLocation(false);
    setCenter(projectWorldPixelsToGeo({ x: drag.centerWorld.x - dx, y: drag.centerWorld.y - dy }, zoom));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.markerIndex !== null) notify(`Corner ${drag.markerIndex + 1} moved.`);
    else if (mode === 'draw' && !drag.moved) {
      const geo = geoAtPointer(event);
      if (geo) {
        onPointsChange([...points, { ...geo, accuracy: 0, timestamp: Date.now() }]);
        notify(`Corner ${points.length + 1} added from the map.`);
      }
    }
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const startMarkerDrag = (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    event.stopPropagation();
    setFollowLocation(false);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      centerWorld: map.centerWorld,
      moved: false,
      markerIndex: index,
    };
  };

  const recenter = () => {
    const target = latest ?? points.at(-1) ?? NEPAL_CENTER;
    setCenter({ lat: target.lat, lng: target.lng });
    setZoom(latest || points.length ? 18 : 8);
    setFollowLocation(Boolean(latest));
  };

  if (!showTiles) return <FallbackPreview points={points} onRetry={() => setShowTiles(true)} privacyMode />;

  const path = map.projectedPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const accuracyRadius = latest ? Math.max(6, Math.min(180, latest.accuracy / metresPerPixel(latest.lat, zoom))) : 0;

  return <div className="relative min-h-[380px] overflow-hidden bg-paper-200 sm:min-h-[520px]" role="region" aria-label="Interactive OpenStreetMap for drawing or recording a plot boundary">
    <div className="absolute left-3 top-3 z-30 flex flex-col overflow-hidden rounded-xl border border-paper-300 bg-white shadow-card" data-map-control>
      <button type="button" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + 1))} disabled={zoom >= MAX_ZOOM} className="focus-ring flex h-11 w-11 items-center justify-center border-b border-paper-200 text-ink-700 disabled:opacity-35" aria-label="Zoom map in"><Plus size={18}/></button>
      <button type="button" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - 1))} disabled={zoom <= MIN_ZOOM} className="focus-ring flex h-11 w-11 items-center justify-center border-b border-paper-200 text-ink-700 disabled:opacity-35" aria-label="Zoom map out"><Minus size={18}/></button>
      <button type="button" onClick={recenter} className="focus-ring flex h-11 w-11 items-center justify-center border-b border-paper-200 text-ink-700" aria-label="Recenter map"><Crosshair size={18}/></button>
      <button type="button" onClick={() => setShowTiles(false)} className="focus-ring flex h-11 w-11 items-center justify-center text-ink-700" aria-label="Hide online map tiles for privacy"><EyeOff size={18}/></button>
    </div>

    <div className="absolute right-3 top-3 z-30 flex overflow-hidden rounded-xl border border-paper-300 bg-white shadow-card" data-map-control>
      <button type="button" onClick={() => setMode('pan')} className={`focus-ring flex h-11 items-center gap-2 px-3 text-xs font-semibold ${mode === 'pan' ? 'bg-leaf-700 text-white' : 'text-ink-700'}`} aria-pressed={mode === 'pan'}><Hand size={16}/>Move</button>
      <button type="button" onClick={() => setMode('draw')} className={`focus-ring flex h-11 items-center gap-2 border-l border-paper-200 px-3 text-xs font-semibold ${mode === 'draw' ? 'bg-leaf-700 text-white' : 'text-ink-700'}`} aria-pressed={mode === 'draw'}><MousePointer2 size={16}/>Draw corners</button>
    </div>

    <div
      ref={canvasRef}
      className={`absolute left-1/2 top-1/2 h-[640px] w-[1000px] -translate-x-1/2 -translate-y-1/2 touch-none select-none ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { dragRef.current = null; }}
      data-testid="gps-map-canvas"
    >
      {map.tiles.map((tile) => failedTiles.has(tile.key)
        ? <div key={tile.key} className="absolute bg-paper-200" style={{ left: tile.left, top: tile.top, width: WEB_MERCATOR_TILE_SIZE, height: WEB_MERCATOR_TILE_SIZE }}/>
        : <img key={tile.key} src={tile.src} alt="" width={WEB_MERCATOR_TILE_SIZE} height={WEB_MERCATOR_TILE_SIZE} draggable={false} loading="eager" referrerPolicy="no-referrer" onError={() => setFailedTiles((current) => new Set(current).add(tile.key))} className="pointer-events-none absolute max-w-none select-none" style={{ left: tile.left, top: tile.top, width: WEB_MERCATOR_TILE_SIZE, height: WEB_MERCATOR_TILE_SIZE }}/>) }
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {latest && map.projectedLatest && <circle cx={map.projectedLatest.x} cy={map.projectedLatest.y} r={accuracyRadius} fill="rgba(220,20,60,.12)" stroke="rgba(169,14,45,.55)" strokeWidth="2"/>}
        {map.projectedPoints.length >= 2 && <polyline points={path} fill={map.projectedPoints.length >= 3 ? PRIMARY_LIGHT : 'none'} stroke={PRIMARY} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>}
        {map.projectedPoints.length >= 3 && <line x1={map.projectedPoints.at(-1)?.x} y1={map.projectedPoints.at(-1)?.y} x2={map.projectedPoints[0].x} y2={map.projectedPoints[0].y} stroke={PRIMARY} strokeWidth="5" strokeLinejoin="round"/>}
        {latest && map.projectedLatest && <g><circle cx={map.projectedLatest.x} cy={map.projectedLatest.y} r="10" fill={ACCENT} stroke="white" strokeWidth="4"/><circle cx={map.projectedLatest.x} cy={map.projectedLatest.y} r="3" fill="white"/></g>}
      </svg>
      {map.projectedPoints.map((point, index) => <button
        key={`${points[index].timestamp}-${index}`}
        type="button"
        data-map-marker
        data-testid={`gps-corner-${index + 1}`}
        className="focus-ring absolute z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full border-[3px] border-white bg-leaf-700 text-xs font-extrabold text-white shadow-card cursor-grab active:cursor-grabbing"
        style={{ left: point.x, top: point.y }}
        onPointerDown={(event) => startMarkerDrag(event, index)}
        onPointerMove={handlePointerMove as never}
        onPointerUp={handlePointerUp as never}
        aria-label={`Move corner ${index + 1}`}
      >{index + 1}</button>)}
    </div>

    {!latest && !points.length && <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-xl bg-white/94 px-4 py-2 text-center text-xs font-semibold text-ink-700 shadow-card backdrop-blur-sm"><LocateFixed className="mr-1 inline text-leaf-700" size={14}/>Move the map, enable GPS, or choose Draw corners</div>}
    {mode === 'draw' && <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 rounded-xl bg-leaf-950/95 px-4 py-2 text-center text-xs font-semibold text-white shadow-card">Tap the map to add corners. Drag a numbered corner to correct it.</div>}
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 bg-white/92 px-3 py-2 text-[11px] text-ink-600 backdrop-blur-sm">
      <span>{latest ? 'Crimson dot: GPS fix · numbered blue dots: editable corners' : 'Use Move to pan or Draw corners to mark the boundary manually.'}</span>
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1 font-semibold text-leaf-800">© OpenStreetMap contributors <ExternalLink size={11}/></a>
    </div>
  </div>;
};

const FallbackPreview = ({ points, onRetry, privacyMode = false }: { points: GeoPoint[]; onRetry: () => void; privacyMode?: boolean }) => {
  const local = toLocalMetres(points);
  if (!local.length) return <div className="flex min-h-[380px] flex-col items-center justify-center bg-paper-200 px-6 text-center text-ink-500 sm:min-h-[520px]"><EyeOff className="text-leaf-700" size={40}/><p className="mt-3 text-sm font-semibold">Private outline mode</p><p className="mt-1 max-w-sm text-xs leading-5">No external map tiles are requested. Start location and record corners to see a local-only shape preview.</p><button type="button" onClick={onRetry} className="button-secondary focus-ring mt-4"><Eye size={16}/>Show online map</button></div>;
  const xs = local.map((point) => point.x), ys = local.map((point) => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 1), height = Math.max(maxY - minY, 1);
  const normalized = local.map((point) => ({ x: 60 + ((point.x - minX) / width) * 880, y: 60 + ((maxY - point.y) / height) * 500 }));
  return <div className="relative min-h-[380px] bg-paper-200 p-4 sm:min-h-[520px]"><svg viewBox="0 0 1000 620" className="h-full min-h-[350px] w-full" role="img" aria-label={`Private GPS polygon with ${points.length} recorded corners`}><defs><pattern id="gps-fallback-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#b8c0cc" strokeWidth="1"/></pattern></defs><rect width="1000" height="620" rx="24" fill="url(#gps-fallback-grid)"/><path d={`M ${normalized.map((point) => `${point.x},${point.y}`).join(' L ')} ${points.length >= 3 ? 'Z' : ''}`} fill={points.length >= 3 ? PRIMARY_LIGHT : 'none'} stroke={PRIMARY} strokeWidth="6" strokeLinejoin="round"/>{normalized.map((point, index) => <g key={index}><circle cx={point.x} cy={point.y} r="13" fill={PRIMARY} stroke="white" strokeWidth="5"/><text x={point.x} y={point.y - 22} textAnchor="middle" fontSize="20" fontWeight="700" fill="#171a21">{index + 1}</text></g>)}</svg><div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl bg-white/95 p-3 text-xs shadow-card"><span>{privacyMode ? 'Private outline mode. No map tiles are requested.' : 'Map tiles are unavailable; showing the recorded shape.'}</span><button type="button" onClick={onRetry} className="button-secondary focus-ring"><Eye size={15}/>Show map</button></div></div>;
};

export default GpsMap;