import { useMemo, useState } from 'react';
import { ExternalLink, LocateFixed, Minus, Plus } from 'lucide-react';
import { GeoPoint } from '../types';
import { metresPerPixel, projectGeoToWorldPixels, toLocalMetres, WEB_MERCATOR_TILE_SIZE } from '../utils/geospatial';

interface Props {
  latest: GeoPoint | null;
  points: GeoPoint[];
}

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 640;
const MIN_ZOOM = 16;
const MAX_ZOOM = 20;

const GpsMap = ({ latest, points }: Props) => {
  const [zoom, setZoom] = useState(18);
  const [tileFailed, setTileFailed] = useState(false);
  const center = latest ?? points.at(-1) ?? null;

  const map = useMemo(() => {
    if (!center) return null;
    const centerWorld = projectGeoToWorldPixels(center, zoom);
    const left = centerWorld.x - VIEW_WIDTH / 2;
    const top = centerWorld.y - VIEW_HEIGHT / 2;
    const tileCount = 2 ** zoom;
    const minTileX = Math.floor(left / WEB_MERCATOR_TILE_SIZE);
    const maxTileX = Math.floor((left + VIEW_WIDTH) / WEB_MERCATOR_TILE_SIZE);
    const minTileY = Math.max(0, Math.floor(top / WEB_MERCATOR_TILE_SIZE));
    const maxTileY = Math.min(tileCount - 1, Math.floor((top + VIEW_HEIGHT) / WEB_MERCATOR_TILE_SIZE));
    const tiles: { key: string; x: number; y: number; src: string; left: number; top: number }[] = [];

    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
        const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
        tiles.push({
          key: `${zoom}-${wrappedX}-${tileY}`,
          x: wrappedX,
          y: tileY,
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

    return { tiles, projectedPoints: points.map(project), projectedLatest: latest ? project(latest) : null };
  }, [center, latest, points, zoom]);

  if (!center) {
    return <div className="flex min-h-[380px] flex-col items-center justify-center bg-[#eef2ee] text-center text-ink-400 sm:min-h-[520px]"><LocateFixed size={40}/><p className="mt-3 text-sm font-semibold">Start location to load the map.</p><p className="mt-1 text-xs">Your current position and recorded corners will appear here.</p></div>;
  }

  if (!map || tileFailed) return <FallbackPreview points={points} onRetry={() => setTileFailed(false)} />;

  const path = map.projectedPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const accuracyRadius = latest ? Math.max(6, Math.min(180, latest.accuracy / metresPerPixel(latest.lat, zoom))) : 0;

  return <div className="relative min-h-[380px] overflow-hidden bg-[#dce6e1] sm:min-h-[520px]" role="region" aria-label="OpenStreetMap showing current GPS position and recorded plot corners">
    <div className="absolute left-3 top-3 z-20 flex flex-col overflow-hidden rounded-xl border border-paper-300 bg-white shadow-card">
      <button type="button" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + 1))} disabled={zoom >= MAX_ZOOM} className="focus-ring flex h-11 w-11 items-center justify-center border-b border-paper-200 text-ink-700 disabled:opacity-35" aria-label="Zoom map in"><Plus size={18}/></button>
      <button type="button" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - 1))} disabled={zoom <= MIN_ZOOM} className="focus-ring flex h-11 w-11 items-center justify-center text-ink-700 disabled:opacity-35" aria-label="Zoom map out"><Minus size={18}/></button>
    </div>

    <div className="absolute inset-0 left-1/2 top-1/2 h-[640px] w-[1000px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
      {map.tiles.map((tile) => <img key={tile.key} src={tile.src} alt="" width={WEB_MERCATOR_TILE_SIZE} height={WEB_MERCATOR_TILE_SIZE} draggable={false} loading="eager" referrerPolicy="strict-origin-when-cross-origin" onError={() => setTileFailed(true)} className="absolute max-w-none select-none" style={{ left: tile.left, top: tile.top, width: WEB_MERCATOR_TILE_SIZE, height: WEB_MERCATOR_TILE_SIZE }}/>) }
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="pointer-events-none absolute inset-0 h-full w-full">
        {latest && map.projectedLatest && <circle cx={map.projectedLatest.x} cy={map.projectedLatest.y} r={accuracyRadius} fill="rgba(14,165,233,.14)" stroke="rgba(2,132,199,.45)" strokeWidth="2"/>}
        {map.projectedPoints.length >= 2 && <polyline points={path} fill={map.projectedPoints.length >= 3 ? 'rgba(16,185,129,.22)' : 'none'} stroke="#047857" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>}
        {map.projectedPoints.length >= 3 && <line x1={map.projectedPoints.at(-1)?.x} y1={map.projectedPoints.at(-1)?.y} x2={map.projectedPoints[0].x} y2={map.projectedPoints[0].y} stroke="#047857" strokeWidth="5" strokeLinejoin="round"/>}
        {map.projectedPoints.map((point, index) => <g key={index}><circle cx={point.x} cy={point.y} r="12" fill="#047857" stroke="white" strokeWidth="4"/><text x={point.x} y={point.y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="white">{index + 1}</text></g>)}
        {latest && map.projectedLatest && <g><circle cx={map.projectedLatest.x} cy={map.projectedLatest.y} r="10" fill="#0284c7" stroke="white" strokeWidth="4"/><circle cx={map.projectedLatest.x} cy={map.projectedLatest.y} r="3" fill="white"/></g>}
      </svg>
    </div>

    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 bg-white/92 px-3 py-2 text-[11px] text-ink-600 backdrop-blur-sm">
      <span>Blue dot: current fix · numbered dots: saved corners</span>
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1 font-semibold text-leaf-800">© OpenStreetMap contributors <ExternalLink size={11}/></a>
    </div>
  </div>;
};

const FallbackPreview = ({ points, onRetry }: { points: GeoPoint[]; onRetry: () => void }) => {
  const local = toLocalMetres(points);
  if (!local.length) return <div className="flex min-h-[380px] flex-col items-center justify-center bg-[#eef2ee] text-center text-ink-400 sm:min-h-[520px]"><LocateFixed size={40}/><p className="mt-3 text-sm font-semibold">Map tiles are unavailable.</p><button type="button" onClick={onRetry} className="button-secondary focus-ring mt-4">Retry map</button></div>;
  const xs = local.map((point) => point.x), ys = local.map((point) => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 1), height = Math.max(maxY - minY, 1);
  const normalized = local.map((point) => ({ x: 60 + ((point.x - minX) / width) * 880, y: 60 + ((maxY - point.y) / height) * 500 }));
  return <div className="relative min-h-[380px] bg-[#eef2ee] p-4 sm:min-h-[520px]"><svg viewBox="0 0 1000 620" className="h-full min-h-[350px] w-full" role="img" aria-label={`Offline GPS polygon with ${points.length} recorded corners`}><defs><pattern id="gps-fallback-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d5ded9" strokeWidth="1"/></pattern></defs><rect width="1000" height="620" rx="24" fill="url(#gps-fallback-grid)"/><path d={`M ${normalized.map((point) => `${point.x},${point.y}`).join(' L ')} ${points.length >= 3 ? 'Z' : ''}`} fill={points.length >= 3 ? 'rgba(16,185,129,.2)' : 'none'} stroke="#0f766e" strokeWidth="6" strokeLinejoin="round"/>{normalized.map((point, index) => <g key={index}><circle cx={point.x} cy={point.y} r="13" fill="#0f766e" stroke="white" strokeWidth="5"/><text x={point.x} y={point.y - 22} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0f172a">{index + 1}</text></g>)}</svg><div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl bg-white/95 p-3 text-xs shadow-card"><span>Offline shape preview. Map tiles could not load.</span><button type="button" onClick={onRetry} className="button-secondary focus-ring">Retry map</button></div></div>;
};

export default GpsMap;
