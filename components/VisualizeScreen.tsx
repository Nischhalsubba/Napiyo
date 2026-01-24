import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Info } from 'lucide-react';
import { formatDecimal } from '../utils/conversions';
import SegmentedControl from './SegmentedControl';

interface VisualizeScreenProps {
    initialArea: number;
    onBack: () => void;
}

const VisualizeScreen: React.FC<VisualizeScreenProps> = ({ initialArea, onBack }) => {
    const [area, setArea] = useState(initialArea);
    const [ratio, setRatio] = useState('1:1');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Derived dimensions
    const getDimensions = () => {
        // ratio is w:h
        const [wRatio, hRatio] = ratio.split(':').map(Number);
        // area = w * h
        // w = h * (wRatio/hRatio)
        // area = [h * (wRatio/hRatio)] * h
        // area = h^2 * (wRatio/hRatio)
        // h = sqrt(area / (wRatio/hRatio))

        const r = wRatio / hRatio;
        const h = Math.sqrt(area / r);
        const w = area / h;
        return { w, h };
    };

    const { w: realW, h: realH } = getDimensions();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // container size
        const container = canvas.parentElement;
        if (!container) return;
        const maxW = container.clientWidth;
        const maxH = container.clientHeight;

        // Set canvas size (HiDPI)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = maxW * dpr;
        canvas.height = maxH * dpr;
        canvas.style.width = `${maxW}px`;
        canvas.style.height = `${maxH}px`;
        ctx.scale(dpr, dpr);

        // Drawing Logic
        ctx.clearRect(0, 0, maxW, maxH);

        // Add padding
        const pad = 40;
        const availW = maxW - pad * 2;
        const availH = maxH - pad * 2;

        // Calculate scale to fit
        // we want to draw a box of realW x realH inside availW x availH
        // Scale = pixels per foot
        const scaleX = availW / realW;
        const scaleY = availH / realH;
        const scale = Math.min(scaleX, scaleY); // fit uniform

        const drawW = realW * scale;
        const drawH = realH * scale;

        const startX = (maxW - drawW) / 2;
        const startY = (maxH - drawH) / 2;

        // Draw Shape
        ctx.fillStyle = 'rgba(139, 92, 246, 0.1)'; // neon-purple/10
        ctx.strokeStyle = '#8b5cf6'; // neon-purple
        ctx.lineWidth = 2;

        // Draw fill
        ctx.beginPath();
        ctx.rect(startX, startY, drawW, drawH);
        ctx.fill();
        ctx.stroke();

        // Draw Dimensions Text
        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.font = 'bold 12px Manrope';
        ctx.textAlign = 'center';

        // Width Label (Top)
        ctx.fillText(`${formatDecimal(realW)} ft`, startX + drawW / 2, startY - 10);

        // Height Label (Left)
        ctx.save();
        ctx.translate(startX - 15, startY + drawH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${formatDecimal(realH)} ft`, 0, 0);
        ctx.restore();

        // Context Human Scale (e.g., a person is ~1.5ft wide shoulder to shoulder? No, maybe simpler just grid)
        // Draw reference grid (10ft lines) if needed, but keeping it clean for now.

    }, [area, ratio, realW, realH]);

    const handleDownload = () => {
        // Just a placeholder alert for now as per "Download card" spec request
        // Ideally we'd use canvas.toDataURL()
        const link = document.createElement('a');
        link.download = `napi-visualize-${Math.round(area)}.png`;
        link.href = canvasRef.current!.toDataURL();
        link.click();
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-8 animate-enter relative">

            <button onClick={onBack} className="absolute top-4 left-4 md:left-8 z-20 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                <ArrowLeft size={20} />
            </button>

            {/* Top Controls */}
            <div className="flex flex-col items-center gap-6 mb-4 z-10">
                <h2 className="text-2xl font-display font-bold text-white text-center mt-2">
                    Visualizing <span className="text-neon-cyan">{formatDecimal(area)} sq.ft</span>
                </h2>

                <SegmentedControl
                    options={[
                        { label: 'Square (1:1)', value: '1:1' },
                        { label: 'Wide (2:1)', value: '2:1' },
                        { label: 'Long (1:3)', value: '1:3' },
                    ]}
                    value={ratio}
                    onChange={setRatio}
                    className="min-w-[300px]"
                />
            </div>

            {/* Canvas Container */}
            <div className="flex-1 w-full relative rounded-none border border-white/5 bg-slate-950/30 overflow-hidden">
                {/* Grid Background */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>

                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            </div>

            {/* Footer Info */}
            <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 p-4 glass-panel bg-white/5">
                <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <Info size={16} className="text-neon-blue" />
                    <span>Visualization is for understanding size only. Real plots vary in shape.</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Approx Dimensions</div>
                        <div className="text-white font-mono font-bold">
                            {formatDecimal(realW)}' × {formatDecimal(realH)}'
                        </div>
                    </div>
                    <button onClick={handleDownload} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-none border border-white/10 transition-colors">
                        <Download size={20} />
                    </button>
                </div>
            </div>

        </div>
    );
};

export default VisualizeScreen;
