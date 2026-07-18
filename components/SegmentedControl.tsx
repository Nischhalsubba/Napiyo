interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

const SegmentedControl = <T extends string>({ options, value, onChange, label, className = '' }: SegmentedControlProps<T>) => (
  <div className={`inline-flex rounded-2xl border border-paper-300 bg-paper-100 p-1 ${className}`} role="group" aria-label={label}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button key={option.value} type="button" onClick={() => onChange(option.value)} aria-pressed={active} className={`focus-ring min-h-10 flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${active ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:bg-white/60 hover:text-ink-900'}`}>
          {option.label}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
