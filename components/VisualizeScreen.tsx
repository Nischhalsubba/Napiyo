import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CarFront, LandPlot, RectangleHorizontal } from 'lucide-react';
import { formatDecimal, formatHills, formatTerai, toSqM } from '../utils/conversions';
import SegmentedControl from './SegmentedControl';

interface VisualizeScreenProps {
  initialArea: number;
  onBack: () => void;
}

type PlotRatio = '1' | '1.5' | '2';

const REFERENCE_AREAS = [
  { name: 'standard parking spaces', area: 162, icon: CarFront },
  { name: 'tennis courts', area: 2808, icon: RectangleHorizontal },
  { name: 'football fields', area: 57600, icon: LandPlot },
];

const VisualizeScreen = ({ initialArea, onBack }: VisualizeScreenProps) => {
  const [ratio, setRatio] = useState<PlotRatio>('1.5');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const numericRatio = Number(ratio);
  const widthFt = Math.sqrt(initialArea * numericRatio);
  const heightFt = Math.sqrt(initialArea / numericRatio);

  const comparison = useMemo(() => {
    const reference = initialArea < 1000 ? REFERENCE_AREAS[0] : initialArea < 12000 ? REFERENCE_AREAS[1] : REFERENCE_AREAS[2];
    return { ...reference, count: initialArea / reference.area };
  }, [initialArea]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const draw = () => {
      const context = canvas.getContext('2d');
      if (!context) return;
      const rect = container.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      context.fillStyle = '#121b19';
      context.fillRect(0, 0, rect.width, rect.height);
      context.strokeStyle = 'rgba(157, 175, 170, 0.14)';
      context.lineWidth = 1;
      for (let x = 0; x <= rect.width; x += 32) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, rect.height); context.stroke(); }
      for (let y = 0; y <= rect.height; y += 32) { context.beginPath(); context.moveTo(0, y); context.lineTo(rect.width, y); context.stroke(); }
      const maxWidth = rect.width * 0.72;
      const maxHeight = rect.height * 0.62;
      let plotWidth = maxWidth;
      let plotHeight = plotWidth / numericRatio;
      if (plotHeight > maxHeight) { plotHeight = maxHeight; plotWidth = plotHeight * numericRatio; }
      const x = (rect.width - plotWidth) / 2;
      const y = (rect.height - plotHeight) / 2;
      context.fillStyle = 'rgba(76, 183, 119, 0.24)';
      context.strokeStyle = '#83d2a1';
      context.lineWidth = 3;
      context.fillRect(x, y, plotWidth, plotHeight);
      context.strokeRect(x, y, plotWidth, plotHeight);
      context.fillStyle = '#f3f6f5';
      context.font = '600 13px Inter, system-ui, sans-serif';
      context.textAlign = 'center';
      context.fillText(`about ${formatDecimal(widthFt, 1)} ft`, rect.width / 2, y + plotHeight + 28);
      context.save();
      context.translate(x - 28, rect.height / 2);
      context.rotate(-Math.PI / 2);
      context.fillText(`about ${formatDecimal(heightFt, 1)} ft`, 0, 0);
      context.restore();
    };

    const observer = new ResizeObserver(draw);
    observer.observe(container);
    draw();
    return () => observer.disconnect();
  }, [heightFt, numericRatio, widthFt]);

  const ComparisonIcon = comparison.icon;

  return (
    <div className="animate-enter mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <button type="button" onClick={onBack} className="focus-ring mb-5 inline-flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-paper-50"><ArrowLeft size={17} aria-hidden="true" />Back to converter</button>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="surface-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-paper-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-leaf-700">Area visualization</p><h1 className="mt-1 text-2xl font-bold text-ink-950">A simple rectangular footprint</h1><p className="mt-1 text-sm text-ink-500">Shape changes the dimensions, not the total area.</p></div>
            <SegmentedControl label="Choose plot shape" value={ratio} onChange={setRatio} options={[{ label: '1:1', value: '1' }, { label: '3:2', value: '1.5' }, { label: '2:1', value: '2' }]} />
          </div>
          <div ref={containerRef} className="relative min-h-[440px] overflow-hidden bg-ink-950 sm:min-h-[560px]"><canvas ref={canvasRef} className="block h-full w-full" aria-label="Approximate rectangular visualization of the selected area" /></div>
        </section>
        <aside className="space-y-4">
          <section className="surface-card p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-700">Selected area</p>
            <p className="numeral mt-2 text-4xl font-bold text-ink-950">{formatDecimal(initialArea)} <span className="text-base font-semibold text-ink-500">sq ft</span></p>
            <p className="numeral mt-1 text-sm font-semibold text-ink-500">{formatDecimal(toSqM(initialArea))} sq m</p>
            <dl className="mt-5 space-y-4 border-t border-paper-200 pt-5 text-sm"><div><dt className="font-semibold text-ink-500">Approximate width</dt><dd className="numeral mt-1 text-xl font-bold text-ink-950">{formatDecimal(widthFt, 1)} ft</dd></div><div><dt className="font-semibold text-ink-500">Approximate length</dt><dd className="numeral mt-1 text-xl font-bold text-ink-950">{formatDecimal(heightFt, 1)} ft</dd></div></dl>
          </section>
          <section className="surface-card p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-saffron-600">For scale</p><div className="mt-4 flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-600"><ComparisonIcon size={24} aria-hidden="true" /></span><div><p className="numeral text-2xl font-bold text-ink-950">about {formatDecimal(comparison.count, 1)}</p><p className="text-sm text-ink-500">{comparison.name}</p></div></div></section>
          <section className="surface-card p-5 sm:p-6"><p className="text-sm font-bold text-ink-950">Local unit summary</p><p className="numeral mt-3 text-sm text-ink-600"><strong className="text-ink-950">Hill:</strong> {formatHills(initialArea)} R-A-P-D</p><p className="numeral mt-2 text-sm text-ink-600"><strong className="text-ink-950">Terai:</strong> {formatTerai(initialArea)} B-K-D</p></section>
          <p className="rounded-2xl border border-saffron-200 bg-saffron-50 p-4 text-xs leading-5 text-ink-700">This diagram is a size aid, not a boundary plan. Real plots may have different proportions and irregular edges.</p>
        </aside>
      </div>
    </div>
  );
};

export default VisualizeScreen;
