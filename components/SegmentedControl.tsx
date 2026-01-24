import React from 'react';

interface SegmentedControlProps {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    className?: string; // Allow custom styling
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, className }) => {
    return (
        <div className={`glass-panel p-1 flex items-center rounded-none bg-white/5 border border-white/10 ${className}`}>
            {options.map((opt) => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`
              flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider transition-all rounded-none
              ${isActive
                                ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}
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
