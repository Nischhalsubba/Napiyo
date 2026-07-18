import { useMemo, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Info,
  MoveRight,
} from 'lucide-react';
import { QUICK_VALUES, UNIT_GROUPS, UNITS } from '../constants';
import { SavedItem } from '../types';
import {
  formatDecimal,
  formatHills,
  formatTerai,
  getAllConversions,
  parseAreaInput,
  toSqFt,
  toSqM,
} from '../utils/conversions';

interface ConvertScreenProps {
  onSave: (item: SavedItem) => boolean;
  onVisualize: (sqFt: number) => void;
  notify: (message: string) => void;
}

const ConvertScreen = ({ onSave, onVisualize, notify }: ConvertScreenProps) => {
  const [value, setValue] = useState('1');
  const [unit, setUnit] = useState('ROPANI');
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const numericValue = parseAreaInput(value);
  const sqFt = toSqFt(numericValue, unit);
  const sqM = toSqM(sqFt);
  const selectedUnit = UNITS[unit];
  const conversions = useMemo(() => getAllConversions(sqFt), [sqFt]);
  const hasValue = numericValue > 0;

  const summary = `${formatDecimal(numericValue, 4)} ${selectedUnit.name} = ${formatDecimal(sqFt)} sq ft = ${formatDecimal(sqM)} sq m. Hill: ${formatHills(sqFt)} R-A-P-D. Terai: ${formatTerai(sqFt)} B-K-D.`;

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
    if (!hasValue) {
      notify('Enter an area greater than zero before saving.');
      return;
    }

    const saved = onSave({
      id: crypto.randomUUID(),
      title: `${formatDecimal(numericValue, 4)} ${selectedUnit.name}`,
      sqFt,
      sqM,
      date: Date.now(),
      type: 'CONVERTED',
      tags: [selectedUnit.system.toLowerCase()],
      source: {
        inputValue: value,
        inputUnit: unit,
      },
    });

    notify(saved ? 'Calculation saved on this device.' : 'This browser could not save the calculation.');
  };

  return (
    <div className="animate-enter mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8">
        <div className="surface-card p-5 sm:p-7 lg:sticky lg:top-28 lg:self-start">
          <div className="mb-7">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-leaf-700">Land area converter</p>
            <h1 className="font-display text-4xl leading-tight text-ink-950 sm:text-5xl">
              Start with the unit you already know.
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-ink-600">
              Convert between Nepal&apos;s Hill and Terai systems and commonly used global area units.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="area-value" className="mb-2 block text-sm font-semibold text-ink-800">
                Area value
              </label>
              <input
                id="area-value"
                inputMode="decimal"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Enter an area"
                aria-describedby="area-help"
                className="focus-ring numeral w-full rounded-2xl border border-paper-300 bg-white px-4 py-4 text-3xl font-bold text-ink-950 shadow-inner placeholder:text-ink-300 sm:text-4xl"
              />
              <p id="area-help" className="mt-2 text-sm text-ink-500">
                Decimals are supported. Negative values are ignored.
              </p>
            </div>

            <div>
              <label htmlFor="area-unit" className="mb-2 block text-sm font-semibold text-ink-800">
                Starting unit
              </label>
              <div className="relative">
                <select
                  id="area-unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  className="focus-ring w-full appearance-none rounded-2xl border border-paper-300 bg-white px-4 py-4 pr-12 text-lg font-semibold text-ink-950"
                >
                  {UNIT_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.units.map((unitId) => (
                        <option key={unitId} value={unitId}>
                          {UNITS[unitId].name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500"
                  size={20}
                />
              </div>
              <div className="mt-3 flex gap-2 rounded-xl bg-leaf-50 p-3 text-sm leading-6 text-leaf-900">
                <Info aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
                <span>{selectedUnit.description}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-800">Common starting points</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_VALUES.map((quickValue) => (
                  <button
                    key={quickValue.label}
                    type="button"
                    onClick={() => {
                      setValue(quickValue.value);
                      setUnit(quickValue.unit);
                    }}
                    className="focus-ring rounded-full border border-paper-300 bg-paper-50 px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-leaf-300 hover:bg-leaf-50 hover:text-leaf-800"
                  >
                    {quickValue.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card overflow-hidden">
            <div className="border-b border-paper-200 bg-ink-950 px-5 py-5 text-white sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-200">Converted area</p>
              <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="numeral text-4xl font-bold sm:text-5xl">{formatDecimal(sqFt)}</span>
                <span className="pb-1 text-lg font-semibold text-ink-200">square feet</span>
              </div>
              <p className="numeral mt-2 text-sm text-ink-200">{formatDecimal(sqM)} square metres</p>
            </div>

            <div className="grid gap-px bg-paper-200 sm:grid-cols-2">
              <ResultBlock
                eyebrow="Hill system"
                value={formatHills(sqFt)}
                label="Ropani - Aana - Paisa - Daam"
              />
              <ResultBlock
                eyebrow="Terai system"
                value={formatTerai(sqFt)}
                label="Bigha - Kattha - Dhur"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-paper-200 p-5 sm:flex-row sm:flex-wrap sm:p-7">
              <button
                type="button"
                onClick={saveCalculation}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-leaf-700 px-4 py-3 font-bold text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hasValue}
              >
                <BookmarkPlus aria-hidden="true" size={18} />
                Save calculation
              </button>
              <button
                type="button"
                onClick={() => onVisualize(sqFt)}
                disabled={!hasValue}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-paper-300 bg-white px-4 py-3 font-bold text-ink-800 transition hover:border-ink-300 hover:bg-paper-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eye aria-hidden="true" size={18} />
                Visualize area
              </button>
              <button
                type="button"
                onClick={copySummary}
                disabled={!hasValue}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-ink-600 transition hover:bg-paper-100 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
                {copied ? 'Copied' : 'Copy result'}
              </button>
            </div>
          </div>

          <section className="surface-card p-5 sm:p-7" aria-labelledby="more-units-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-saffron-600">Reference values</p>
                <h2 id="more-units-title" className="mt-1 text-2xl font-bold text-ink-950">
                  Compare common global units
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-600">
                  Useful when a listing, survey, or drawing uses a different standard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAll((current) => !current)}
                aria-expanded={showAll}
                className="focus-ring inline-flex items-center gap-2 self-start rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-800 transition hover:bg-paper-50"
              >
                {showAll ? 'Show less' : 'Show all units'}
                <MoveRight aria-hidden="true" size={17} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {conversions.slice(0, showAll ? conversions.length : 2).map((conversion) => (
                <div key={conversion.id} className="surface-muted p-4">
                  <p className="text-sm font-semibold text-ink-500">{conversion.label}</p>
                  <p className="numeral mt-1 text-2xl font-bold text-ink-950">
                    {formatDecimal(conversion.value, conversion.value < 1 ? 5 : 2)}{' '}
                    <span className="text-sm font-semibold text-ink-500">{conversion.suffix}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-saffron-200 bg-saffron-50 p-4 text-sm leading-6 text-ink-700">
            <strong className="text-ink-950">Use these figures for understanding and estimation.</strong>{' '}
            Confirm legal boundaries, ownership, and official area with cadastral records and a licensed survey professional.
          </aside>
        </div>
      </section>
    </div>
  );
};

interface ResultBlockProps {
  eyebrow: string;
  value: string;
  label: string;
}

const ResultBlock = ({ eyebrow, value, label }: ResultBlockProps) => (
  <div className="bg-paper-50 p-5 sm:p-7">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">{eyebrow}</p>
    <p className="numeral mt-2 break-words text-3xl font-bold text-ink-950">{value}</p>
    <p className="mt-2 text-sm text-ink-500">{label}</p>
  </div>
);

export default ConvertScreen;
