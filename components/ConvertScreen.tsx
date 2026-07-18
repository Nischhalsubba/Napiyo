import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { BookmarkPlus, Check, Copy, ExternalLink, Info, RotateCcw } from 'lucide-react';
import { QUICK_VALUES, UNITS } from '../constants';
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

  const clear = () => {
    setHills({ ropani: '0', aana: '0', paisa: '0', daam: '0' });
    setTerai({ bigha: '0', kattha: '0', dhur: '0' });
    setSquareValue('0');
  };

  const summary = `${formatHillsWords(sqFt)} = ${formatTeraiWords(sqFt)} = ${formatDecimal(sqFt)} sq ft = ${formatDecimal(sqM)} m².`;

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      notify('Conversion copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      notify('Your browser blocked clipboard access.');
    }
  };

  const saveCalculation = () => {
    if (!hasValue) return;
    const saved = onSave({
      id: crypto.randomUUID(),
      title: mode === 'HILLS'
        ? formatHillsWords(sqFt)
        : mode === 'TERAI'
          ? formatTeraiWords(sqFt)
          : `${formatDecimal(squareUnit === 'SQM' ? sqM : sqFt, 4)} ${UNITS[squareUnit].name}`,
      sqFt,
      sqM,
      date: Date.now(),
      type: 'CONVERTED',
      tags: [mode.toLowerCase()],
      source: {
        inputValue: mode === 'HILLS'
          ? `${hills.ropani}-${hills.aana}-${hills.paisa}-${hills.daam}`
          : mode === 'TERAI'
            ? `${terai.bigha}-${terai.kattha}-${terai.dhur}`
            : squareValue,
        inputUnit: mode,
      },
    });
    notify(saved ? 'Area saved on this device.' : 'This browser could not save the area.');
  };

  return (
    <div className="page-shell animate-enter">
      <header className="page-header">
        <p className="eyebrow">Land unit converter</p>
        <h1 className="page-title">Convert Nepal land units without doing the math twice.</h1>
        <p className="page-copy">Enter the format on your document or listing. Every equivalent updates from the same area.</p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-start">
        <div className="panel xl:sticky xl:top-24">
          <div className="panel-header">
            <p className="section-title">What format do you have?</p>
            <p className="section-copy">Switching formats keeps the current area instead of resetting it.</p>
          </div>

          <div className="panel-body">
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-paper-100 p-1" role="tablist" aria-label="Choose input system">
              <ModeButton active={mode === 'HILLS'} label="Hill" detail="R-A-P-D" onClick={() => switchMode('HILLS')} />
              <ModeButton active={mode === 'TERAI'} label="Terai" detail="B-K-D" onClick={() => switchMode('TERAI')} />
              <ModeButton active={mode === 'SQUARE'} label="Square" detail="ft² / m²" onClick={() => switchMode('SQUARE')} />
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {mode === 'HILLS' ? 'Ropani system' : mode === 'TERAI' ? 'Bigha system' : 'Square area'}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-500">Enter zero for units you do not use.</p>
              </div>
              <button type="button" onClick={clear} className="button-quiet focus-ring !min-h-9 !px-2.5 !py-1.5">
                <RotateCcw size={15} aria-hidden="true" />
                Clear
              </button>
            </div>

            {mode === 'HILLS' && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(['ropani', 'aana', 'paisa', 'daam'] as const).map((field) => (
                  <AreaField key={field} label={field} value={hills[field]} onChange={(value) => setHills((current) => ({ ...current, [field]: value }))} />
                ))}
              </div>
            )}

            {mode === 'TERAI' && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {(['bigha', 'kattha', 'dhur'] as const).map((field) => (
                  <AreaField key={field} label={field} value={terai[field]} onChange={(value) => setTerai((current) => ({ ...current, [field]: value }))} />
                ))}
              </div>
            )}

            {mode === 'SQUARE' && (
              <div className="mt-4">
                <div className="inline-flex rounded-lg bg-paper-100 p-1">
                  <UnitButton active={squareUnit === 'SQFT'} label="Square feet" onClick={() => setSquareSystem('SQFT')} />
                  <UnitButton active={squareUnit === 'SQM'} label="Square metres" onClick={() => setSquareSystem('SQM')} />
                </div>
                <label htmlFor="square-value" className="field-label mt-4">Area</label>
                <div className="relative">
                  <input id="square-value" inputMode="decimal" value={squareValue} onChange={(event: ChangeEvent<HTMLInputElement>) => setSquareValue(event.target.value)} className="field numeral pr-16 text-2xl font-semibold" />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">{squareUnit === 'SQFT' ? 'ft²' : 'm²'}</span>
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3 rounded-xl border border-leaf-100 bg-leaf-50 p-3.5 text-sm leading-6 text-leaf-900">
              <Info className="mt-0.5 shrink-0 text-leaf-700" size={17} aria-hidden="true" />
              <p>Sub-units roll over automatically. For example, 16 Aana becomes 1 Ropani.</p>
            </div>

            <div className="mt-6 border-t border-paper-200 pt-5">
              <p className="field-label">Common starting points</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_VALUES.map((item) => (
                  <button key={item.label} type="button" onClick={() => applyQuickValue(item)} className="focus-ring rounded-lg border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-ink-300 hover:bg-white hover:text-ink-950">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-ink-900 bg-ink-950 text-white shadow-card">
            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-300">Same area</p>
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="numeral text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{formatDecimal(sqFt)}</span>
                <span className="pb-1 text-base font-medium text-ink-300">square feet</span>
              </div>
              <p className="numeral mt-2 text-sm font-medium text-ink-300">{formatDecimal(sqM)} square metres</p>
            </div>

            <div className="grid gap-px bg-white/10 sm:grid-cols-2">
              <ResultCard title="Hill system" compact={formatHills(sqFt)} words={formatHillsWords(sqFt)} />
              <ResultCard title="Terai system" compact={formatTerai(sqFt)} words={formatTeraiWords(sqFt)} />
            </div>

            <div className="grid gap-2 border-t border-white/10 p-4 sm:grid-cols-3 sm:p-5">
              <ActionButton onClick={saveCalculation} disabled={!hasValue} primary icon={<BookmarkPlus size={17} />} label="Save area" />
              <ActionButton onClick={() => onVisualize(sqFt)} disabled={!hasValue} icon={<ExternalLink size={17} />} label="Open planner" />
              <ActionButton onClick={copySummary} disabled={!hasValue} icon={copied ? <Check size={17} /> : <Copy size={17} />} label={copied ? 'Copied' : 'Copy summary'} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <p className="section-title">Other useful units</p>
              <p className="section-copy">Rounded for reading. The full calculation remains based on square feet.</p>
            </div>
            <div className="grid gap-px bg-paper-200 sm:grid-cols-2 lg:grid-cols-3">
              {conversions.map((item) => (
                <div key={item.id} className="bg-white p-4">
                  <p className="metric-label">{item.label}</p>
                  <p className="numeral mt-2 text-xl font-semibold tracking-[-0.02em] text-ink-950">
                    {formatDecimal(item.value, item.value < 1 ? 6 : 2)} <span className="text-xs font-medium text-ink-400">{item.suffix}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <p className="rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-3 text-xs leading-5 text-ink-600">Use these figures for comparison and early planning. Legal area and boundaries must come from official records.</p>
        </div>
      </section>
    </div>
  );
};

const AreaField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="block">
    <span className="field-label capitalize">{label}</span>
    <input inputMode="decimal" value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} aria-label={label} className="field numeral text-center text-xl font-semibold" />
  </label>
);

const ModeButton = ({ active, label, detail, onClick }: { active: boolean; label: string; detail: string; onClick: () => void }) => (
  <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`focus-ring rounded-lg px-2 py-2.5 text-center transition ${active ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:bg-white/65 hover:text-ink-800'}`}>
    <span className="block text-sm font-semibold">{label}</span>
    <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.1em] opacity-65">{detail}</span>
  </button>
);

const UnitButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`focus-ring rounded-md px-3 py-1.5 text-xs font-semibold ${active ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}>{label}</button>
);

const ResultCard = ({ title, compact, words }: { title: string; compact: string; words: string }) => (
  <div className="bg-ink-900 p-5 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-300">{title}</p>
    <p className="numeral mt-2 text-2xl font-semibold tracking-[-0.025em] text-white">{compact}</p>
    <p className="mt-2 text-xs leading-5 text-ink-300">{words}</p>
  </div>
);

const ActionButton = ({ onClick, disabled, icon, label, primary = false }: { onClick: () => void; disabled: boolean; icon: ReactNode; label: string; primary?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${primary ? 'bg-white text-ink-950 hover:bg-leaf-50' : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'}`}>
    {icon}{label}
  </button>
);

export default ConvertScreen;
