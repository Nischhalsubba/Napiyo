import React from 'react';

interface SegmentedControlProps {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    className?: string; // Allow custom styling
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, className }) => {
    return (
        <div className={`glass-panel p-1 flex items-center rounded-none bg-white/40 border border-brand-600/10 ${className}`}>
            {options.map((opt) => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`
              flex-1 py-3 px-4 text-sm font-bold uppercase tracking-wider transition-all rounded-none
              ${isActive
                                ? 'bg-white text-brand-600 shadow-md shadow-brand-600/10 border border-brand-600/10'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/20'}
            `}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
};

export default SegmentedControl;
