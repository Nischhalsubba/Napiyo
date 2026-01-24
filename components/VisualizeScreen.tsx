import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Box } from 'lucide-react';
import { formatDecimal } from '../utils/conversions';

interface VisualizeScreenProps {
    initialArea: number;
    onBack: () => void;
}

const CONSTANTS = {
    FOOTBALL_FIELD: 57600, // standard approx sq ft
    TENNIS_COURT: 2800,
    KING_BED: 42,
    PING_PONG_TABLE: 45
};

const VisualizeScreen: React.FC<VisualizeScreenProps> = ({ initialArea, onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Draw rectangle logic - Clean Version
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resizing
        canvas.width = canvas.parentElement?.offsetWidth || 800;
        canvas.height = canvas.parentElement?.offsetHeight || 600;

        const ratio = 1.5;

        // Scale Logic
        const MAX_REF = 60000;
        const scaleFactor = Math.min(0.8, Math.sqrt(initialArea / MAX_REF));

        const drawW = (canvas.width * 0.8) * scaleFactor;
        const drawH = drawW / ratio;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Clean Grid (Engineering Style)
        ctx.strokeStyle = '#334155'; // Slate-700
        ctx.lineWidth = 1;
        const gridSize = 40;

        // Draw subtle grid
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
        for (let y = 0; y < canvas.height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
        ctx.stroke();

        // Blueprint Rect
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.shadowBlur = 0; // No neon
        ctx.strokeStyle = '#60a5fa'; // Blue-400
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - drawW / 2, cy - drawH / 2, drawW, drawH);

        // Fill
        ctx.fillStyle = 'rgba(37, 99, 235, 0.1)'; // Brand Blue Tint
        ctx.fillRect(cx - drawW / 2, cy - drawH / 2, drawW, drawH);

        // Dimensions text
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`~${formatDecimal(Math.sqrt(initialArea))} ft`, cx, cy + drawH / 2 + 20);

    }, [initialArea]);

    const getComparisons = () => {
        if (initialArea > 10000) return { label: 'Football Fields', val: initialArea / CONSTANTS.FOOTBALL_FIELD, icon: '⚽️' };
        if (initialArea > 1000) return { label: 'Tennis Courts', val: initialArea / CONSTANTS.TENNIS_COURT, icon: '🎾' };
        if (initialArea > 50) return { label: 'Ping Pong Tables', val: initialArea / CONSTANTS.PING_PONG_TABLE, icon: '🏓' };
        return { label: 'King Beds', val: initialArea / CONSTANTS.KING_BED, icon: '🛏️' };
    };

    const comp = getComparisons();

    return (
        <div className="w-full h-full relative bg-slate-950 flex flex-col font-sans">
            {/* Top Bar */}
            <div className="absolute top-4 left-4 z-50">
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors rounded-lg font-bold text-sm shadow-lg">
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            {/* Info Card */}
            <div className="absolute top-4 right-4 z-20 bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl max-w-sm">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Coverage</div>
                <div className="text-4xl font-bold text-white mb-4">
                    {formatDecimal(initialArea)} <span className="text-lg text-slate-400 font-medium">sq.ft</span>
                </div>

                <div className="border-t border-white/10 pt-4">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Equivalent To</div>
                    <div className="flex items-center gap-4">
                        <div className="text-4xl grayscale opacity-80">{comp.icon}</div>
                        <div>
                            <div className="text-2xl font-bold text-brand-400">x {formatDecimal(comp.val)}</div>
                            <div className="text-sm text-slate-300 font-bold">{comp.label}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas Layer */}
            <div className="flex-1 relative overflow-hidden bg-slate-950">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* Footer Disclaimer */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <p className="text-xs text-slate-700 font-medium">Visual Representation Only • Not Geometric Scale</p>
            </div>
        </div>
    );
};

export default VisualizeScreen;
