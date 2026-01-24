import React from 'react';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
    return (
        <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => onChange(!checked)}
        >
            <div className={`
        w-10 h-5 rounded-none border border-white/10 relative transition-colors flex items-center px-0.5
        ${checked ? 'bg-neon-emerald/20 border-neon-emerald/50' : 'bg-slate-800 border-white/10'}
      `}>
                <div className={`
          w-4 h-4 bg-white shadow-sm transition-all rounded-none
          ${checked ? 'translate-x-5 bg-neon-emerald' : 'translate-x-0 bg-slate-400'}
        `} />
            </div>
            {label && (
                <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-wide">
                    {label}
                </span>
            )}
        </div>
    );
};

export default Toggle;
