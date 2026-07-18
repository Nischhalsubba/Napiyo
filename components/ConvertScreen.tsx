import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { BookmarkPlus, Check, Copy, Eye, Info } from 'lucide-react';
import { CONVERSION_REFERENCE, QUICK_VALUES, UNITS } from '../constants';
import { SavedItem, UnitSystem } from '../types';
import {
  formatDecimal,
  formatHills,
  formatHillsWords,
  formatTerai,
  formatTeraiWords,
  getAllConversions,
  getHillsBreakdown,
  getTeraiBreakdown,
  hillsToSqFt,
  parseAreaInput,
  teraiToSqFt,
  toSqFt,
  toSqM,
} from '../utils/conversions';

interface ConvertScreenProps {
  onSave: (item: SavedItem) => boolean;
  onVisualize: (sqFt: number) => void;
  notify: (message: string) => void;
}

type InputMode = 'HILLS' | 'TERAI' | 'SQUARE';
type SquareUnit = 'SQFT' | 'SQM';
type Fields = Record<string, string>;

const valueText = (value: number, decimals = 3) =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(decimals)));

const ConvertScreen = ({ onSave, onVisualize, notify }: ConvertScreenProps) => {
  const [mode, setMode] = useState<InputMode>('HILLS');
  const [hills, setHills] = useState<Fields>({ ropani: '1', aana: '0', paisa: '0', daam: '0' });
  const [terai, setTerai] = useState<Fields>({ bigha: '0', kattha: '0', dhur: '0' });
  const [squareValue, setSquareValue] = useState('5476');
  const [squareUnit, setSquareUnit] = useState<SquareUnit>('SQFT');
  const [copied, setCopied] = useState(false);

  const sqFt = useMemo(() => {
    if (mode === 'HILLS') {
      return hillsToSqFt({
        ropani: parseAreaInput(hills.ropani),
        aana: parseAreaInput(hills.aana),
        paisa: parseAreaInput(hills.paisa),
        daam: parseAreaInput(hills.daam),
      });
    }
    if (mode === 'TERAI') {
      return teraiToSqFt({
        bigha: parseAreaInput(terai.bigha),
        kattha: parseAreaInput(terai.kattha),
        dhur: parseAreaInput(terai.dhur),
      });
    }
    return toSqFt(parseAreaInput(squareValue), squareUnit);
  }, [hills, mode, squareUnit, squareValue, terai]);

  const sqM = toSqM(sqFt);
  const conversions = useMemo(() => getAllConversions(sqFt), [sqFt]);
  const hasValue = sqFt > 0;

  const switchMode = (nextMode: InputMode, area = sqFt) => {
    if (nextMode === 'HILLS') {
      const value = getHillsBreakdown(area);
      setHills({
        ropani: valueText(value.ropani, 0),
        aana: valueText(value.aana, 0),
        paisa: valueText(value.paisa, 0),
        daam: valueText(value.daam),
      });
    } else if (nextMode === 'TERAI') {
      const value = getTeraiBreakdown(area);
      setTerai({
        bigha: valueText(value.bigha, 0),
        kattha: valueText(value.kattha, 0),
        dhur: valueText(value.dhur),
      });
    } else {
      setSquareValue(valueText(squareUnit === 'SQM' ? toSqM(area) : area, 4));
    }
    setMode(nextMode);
  };

  const setSquareSystem = (unit: SquareUnit) => {
    setSquareUnit(unit);
    setSquareValue(valueText(unit === 'SQM' ? sqM : sqFt, 4));
  };

  const applyQuickValue = (quickValue: (typeof QUICK_VALUES)[number]) => {
    const area = toSqFt(parseAreaInput(quickValue.value), quickValue.unit);
    const system = UNITS[quickValue.unit].system;
    if (system === UnitSystem.HILLS) switchMode('HILLS', area);
    else if (system === UnitSystem.TERAI) switchMode('TERAI', area);
    else {
      setSquareUnit('SQFT');
      setSquareValue(valueText(area, 4));
      setMode('SQUARE');
    }
  };

  const summary = `${formatHillsWords(sqFt)} = ${formatTeraiWords(sqFt)} = ${formatDecimal(sqFt)} sq ft = ${formatDecimal(sqM)} m².`;

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      notify('Conversion copied to your clipboard.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      notify('Copy was blocked by this browser.');
    }
  };

  const saveCalculation = () => {
    if (!hasValue) return;
    const saved = onSave({
      id: crypto.randomUUID(),
      title: mode === 'HILLS' ? formatHillsWords(sqFt) : mode === 'TERAI' ? formatTeraiWords(sqFt) : `${formatDecimal(squareUnit === 'SQM' ? sqM : sqFt, 4)} ${UNITS[squareUnit].name}`,
      sqFt,
      sqM,
      date: Date.now(),
      type: 'CONVERTED',
      tags: [mode.toLowerCase()],
      source: {
        inputValue: mode === 'HILLS' ? `${hills.ropani}-${hills.aana}-${hills.paisa}-${hills.daam}` : mode === 'TERAI' ? `${terai.bigha}-${terai.kattha}-${terai.dhur}` : squareValue,
        inputUnit: mode,
      },
    });
    notify(saved ? 'Calculation saved on this device.' : 'This browser could not save the calculation.');
  };

  return (
    <div className="animate-enter mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <section className="mb-6 overflow-hidden rounded-[2rem] border border-paper-200 bg-ink-950 px-5 py-7 text-white shadow-soft sm:px-8 sm:py-10">
        <div className="grid items-end gap-7 lg:grid-cols-[1fr_25rem]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-leaf-300">Nepal land area converter</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.03] tracking-[-0.04em] sm:text-5xl lg:text-6xl">Enter land the way people actually describe it.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-200 sm:text-lg">Use complete Ropani–Aana–Paisa–Daam, Bigha–Kattha–Dhur, or square-unit inputs. Results update instantly from one consistent square-foot base.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
            <div className="flex gap-3"><Info className="mt-0.5 shrink-0 text-saffron-300" size={19} aria-hidden="true" /><div><p className="font-bold">Formula reference</p><p className="mt-1 text-sm leading-6 text-ink-200">Based on {CONVERSION_REFERENCE.source}. Metric values are derived from the same canonical area to avoid mixed rounding.</p></div></div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="surface-card overflow-hidden xl:sticky xl:top-24 xl:self-start">
          <div className="border-b border-paper-200 p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-paper-100 p-1.5" role="tablist" aria-label="Choose input system">
              <ModeButton active={mode === 'HILLS'} label="Hill system" detail="R-A-P-D" onClick={() => switchMode('HILLS')} />
              <ModeButton active={mode === 'TERAI'} label="Terai system" detail="B-K-D" onClick={() => switchMode('TERAI')} />
              <ModeButton active={mode === 'SQUARE'} label="Square units" detail="ft² / m²" onClick={() => switchMode('SQUARE')} />
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><p className="text-sm font-bold text-leaf-700">Your known area</p><h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-ink-950">{mode === 'HILLS' ? 'Ropani system input' : mode === 'TERAI' ? 'Bigha system input' : 'Square area input'}</h2></div>
              <button type="button" onClick={() => { setHills({ ropani: '0', aana: '0', paisa: '0', daam: '0' }); setTerai({ bigha: '0', kattha: '0', dhur: '0' }); setSquareValue('0'); }} className="focus-ring rounded-xl px-3 py-2 text-sm font-bold text-ink-500 hover:bg-paper-100 hover:text-ink-950">Clear</button>
            </div>

            {mode === 'HILLS' && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(['ropani', 'aana', 'paisa', 'daam'] as const).map((field) => <AreaField key={field} label={field} value={hills[field]} onChange={(value) => setHills((current) => ({ ...current, [field]: value }))} />)}</div>}
            {mode === 'TERAI' && <div className="grid grid-cols-3 gap-3">{(['bigha', 'kattha', 'dhur'] as const).map((field) => <AreaField key={field} label={field} value={terai[field]} onChange={(value) => setTerai((current) => ({ ...current, [field]: value }))} />)}</div>}
            {mode === 'SQUARE' && <div><div className="mb-3 inline-flex rounded-xl bg-paper-100 p-1"><UnitButton active={squareUnit === 'SQFT'} label="Square feet" onClick={() => setSquareSystem('SQFT')} /><UnitButton active={squareUnit === 'SQM'} label="Square metres" onClick={() => setSquareSystem('SQM')} /></div><label htmlFor="square-value" className="block text-sm font-bold text-ink-700">Area value</label><div className="relative mt-2"><input id="square-value" inputMode="decimal" value={squareValue} onChange={(event: ChangeEvent<HTMLInputElement>) => setSquareValue(event.target.value)} className="focus-ring numeral w-full rounded-2xl border border-paper-300 bg-white px-4 py-4 pr-20 text-4xl font-black tracking-[-0.04em] text-ink-950 shadow-inner" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">{squareUnit === 'SQFT' ? 'ft²' : 'm²'}</span></div></div>}

            <p className="mt-4 rounded-xl bg-leaf-50 px-4 py-3 text-sm leading-6 text-leaf-900">Sub-units normalize automatically. For example, 16 Aana becomes 1 Ropani and 20 Kattha becomes 1 Bigha.</p>
            <div className="mt-6 border-t border-paper-200 pt-5"><p className="text-sm font-bold text-ink-700">Common areas</p><div className="mt-3 flex flex-wrap gap-2">{QUICK_VALUES.map((item) => <button key={item.label} type="button" onClick={() => applyQuickValue(item)} className="focus-ring rounded-full border border-paper-300 bg-paper-50 px-3 py-2 text-sm font-bold text-ink-700 hover:border-leaf-300 hover:bg-leaf-50">{item.label}</button>)}</div></div>
          </div>
        </div>

        <div className="space-y-5">
          <section className="surface-card overflow-hidden">
            <div className="bg-[#173d2e] px-5 py-6 text-white sm:px-7 sm:py-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-200">Equivalent area</p><div className="mt-2 flex flex-wrap items-end gap-3"><span className="numeral text-5xl font-black tracking-[-0.05em] sm:text-6xl">{formatDecimal(sqFt)}</span><span className="pb-1 text-lg font-bold text-leaf-100">square feet</span></div><p className="numeral mt-2 text-sm font-bold text-leaf-100">{formatDecimal(sqM)} square metres</p></div>
            <div className="grid gap-px bg-paper-200 sm:grid-cols-2"><ResultCard title="Hill system" compact={formatHills(sqFt)} words={formatHillsWords(sqFt)} /><ResultCard title="Terai system" compact={formatTerai(sqFt)} words={formatTeraiWords(sqFt)} /></div>
            <div className="grid gap-2 border-t border-paper-200 p-4 sm:grid-cols-3 sm:p-6"><ActionButton onClick={saveCalculation} disabled={!hasValue} primary icon={<BookmarkPlus size={18} />} label="Save" /><ActionButton onClick={() => onVisualize(sqFt)} disabled={!hasValue} icon={<Eye size={18} />} label="Visualize land" /><ActionButton onClick={copySummary} disabled={!hasValue} icon={copied ? <Check size={18} /> : <Copy size={18} />} label={copied ? 'Copied' : 'Copy result'} /></div>
          </section>

          <section className="surface-card p-5 sm:p-7"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-saffron-600">More equivalents</p><h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-ink-950">One area, every useful unit</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{conversions.map((item) => <div key={item.id} className="surface-muted p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-400">{item.label}</p><p className="numeral mt-2 text-2xl font-black text-ink-950">{formatDecimal(item.value, item.value < 1 ? 6 : 2)} <span className="text-sm font-bold text-ink-400">{item.suffix}</span></p></div>)}</div></section>

          <aside className="rounded-2xl border border-saffron-200 bg-saffron-50 p-4 text-sm leading-6 text-ink-700"><strong className="text-ink-950">Use the result for comparison and planning.</strong> Confirm official area, boundaries, road access, and ownership with cadastral records and a licensed survey professional.</aside>
        </div>
      </section>
    </div>
  );
};

const AreaField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="block"><span className="mb-2 block text-sm font-bold capitalize text-ink-600">{label}</span><input inputMode="decimal" value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} aria-label={label} className="focus-ring numeral w-full rounded-2xl border border-paper-300 bg-white px-3 py-4 text-center text-3xl font-black text-ink-950 shadow-inner" /></label>;
const ModeButton = ({ active, label, detail, onClick }: { active: boolean; label: string; detail: string; onClick: () => void }) => <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`focus-ring rounded-xl px-2 py-3 text-center transition ${active ? 'bg-white text-ink-950 shadow-card' : 'text-ink-500 hover:bg-white/70'}`}><span className="block text-sm font-black">{label}</span><span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.12em] opacity-60">{detail}</span></button>;
const UnitButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => <button type="button" onClick={onClick} className={`focus-ring rounded-lg px-4 py-2 text-sm font-bold ${active ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500'}`}>{label}</button>;
const ResultCard = ({ title, compact, words }: { title: string; compact: string; words: string }) => <div className="bg-white p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">{title}</p><p className="numeral mt-2 text-3xl font-black tracking-[-0.03em] text-ink-950">{compact}</p><p className="mt-2 text-sm font-semibold leading-6 text-ink-500">{words}</p></div>;
const ActionButton = ({ onClick, disabled, icon, label, primary = false }: { onClick: () => void; disabled: boolean; icon: ReactNode; label: string; primary?: boolean }) => <button type="button" onClick={onClick} disabled={disabled} className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${primary ? 'bg-leaf-700 text-white hover:bg-leaf-800' : 'border border-paper-300 bg-white text-ink-800 hover:bg-paper-50'}`}>{icon}{label}</button>;

export default ConvertScreen;
