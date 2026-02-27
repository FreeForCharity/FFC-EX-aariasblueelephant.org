import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCw } from 'lucide-react';
import Logo from './Logo';

const SEGMENTS = [
    { color: '#00BFFF', name: 'Sky Blue' },
    { color: '#FFD700', name: 'Yellow' },
    { color: '#FF1493', name: 'Deep Pink' },
    { color: '#00FF7F', name: 'Spring Green' },
    { color: '#9370DB', name: 'Medium Purple' },
    { color: '#FFA500', name: 'Orange' },
    { color: '#FF69B4', name: 'Hot Pink' }
];

const SPIN_SOUNDS = [
    'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3', // Soft whir
    'https://assets.mixkit.co/active_storage/sfx/1344/1344-preview.mp3', // Chime whir
    'https://assets.mixkit.co/active_storage/sfx/707/707-preview.mp3'    // Mechanical whir
];

const WheelOfFun: React.FC = () => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState<number | null>(null);
    const wheelRef = useRef<HTMLDivElement>(null);

    // Audio Refs
    const spinAudio = useRef<HTMLAudioElement | null>(null);
    const winAudio = useRef<HTMLAudioElement | null>(null);
    const popAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        winAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        if (winAudio.current) winAudio.current.volume = 0.5;

        popAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
        if (popAudio.current) popAudio.current.volume = 0.4;
    }, []);

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setWinner(null);

        // Random spin sound
        const randomSound = SPIN_SOUNDS[Math.floor(Math.random() * SPIN_SOUNDS.length)];
        spinAudio.current = new Audio(randomSound);
        if (spinAudio.current) {
            spinAudio.current.loop = true;
            spinAudio.current.volume = 0.3;
            spinAudio.current.play().catch(e => console.log("Audio play blocked", e));
        }

        const extraDegrees = Math.floor(Math.random() * 360);
        const totalRotation = rotation + (360 * (6 + Math.floor(Math.random() * 4))) + extraDegrees;

        setRotation(totalRotation);

        setTimeout(() => {
            setIsSpinning(false);

            if (spinAudio.current) {
                spinAudio.current.pause();
                spinAudio.current = null;
            }
            if (winAudio.current) winAudio.current.play().catch(e => console.log("Audio play blocked", e));

            const actualDegrees = totalRotation % 360;
            const segmentSize = 360 / SEGMENTS.length;
            const winnerIndex = Math.floor(((360 - (actualDegrees % 360)) % 360) / segmentSize);
            setWinner(winnerIndex);

            if (window.triggerFunSpinBurst && wheelRef.current) {
                const rect = wheelRef.current.getBoundingClientRect();
                window.triggerFunSpinBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

                // Add POP sound for realism
                if (popAudio.current) {
                    popAudio.current.currentTime = 0;
                    popAudio.current.play().catch(e => console.log("Pop suppressed", e));
                }

                const mascot = document.getElementById('elephant-mascot');
                if (mascot) {
                    mascot.classList.add('animate-trunk');
                    setTimeout(() => mascot.classList.remove('animate-trunk'), 1500);
                }
            }
        }, 6000);
    };

    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border-8 border-sky-500/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden group max-w-xl mx-auto">
            {/* Premium Glassmorphism Overlays */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <div className="text-center mb-10 relative">
                <h2 className="text-4xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-4 tracking-tighter uppercase italic">
                    <RotateCw className={`h-10 w-10 text-brand-cyan ${isSpinning ? 'animate-spin brightness-125' : ''}`} />
                    Aaria's Wheel of Fun
                </h2>
                <div className="h-1 w-24 bg-brand-cyan mx-auto mt-2 rounded-full opacity-50" />
            </div>

            <div className="relative w-80 h-80 sm:w-96 sm:h-96 perspective-1000" ref={wheelRef}>
                {/* Needle - 3D Modernized */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-50">
                    <div className="w-8 h-12 bg-slate-900 dark:bg-white rounded-t-full rounded-b-xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] flex items-center justify-center border-b-4 border-slate-700 dark:border-slate-300">
                        <div className="w-2 h-8 bg-brand-pink rounded-full animate-pulse" />
                    </div>
                </div>

                {/* The Wheel - 3D Depth */}
                <div
                    className={`
                    w-full h-full rounded-full border-[12px] border-slate-800 dark:border-slate-700 
                    shadow-[0_0_80px_rgba(14,165,233,0.3),_inset_0_0_40px_rgba(0,0,0,0.4)] 
                    transition-all duration-[6000ms] ease-[cubic-bezier(0.15,0,0.15,1)] overflow-hidden relative
                    ${isSpinning ? 'hue-rotate-15 saturate-150 brightness-110' : ''}
                  `}
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {/* Metallic Rim Glow */}
                    <div className="absolute inset-0 rounded-full border-4 border-white/20 pointer-events-none z-10" />

                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {SEGMENTS.map((seg, i) => {
                            const startAngle = (i * 360) / SEGMENTS.length;
                            const endAngle = ((i + 1) * 360) / SEGMENTS.length;

                            const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                            const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                            const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                            const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                            return (
                                <g key={i}>
                                    <path
                                        d={pathData}
                                        fill={seg.color}
                                        className="stroke-slate-900/10 stroke-[0.5]"
                                    />
                                    {/* Internal Shading for 3D */}
                                    <path
                                        d={pathData}
                                        fill="url(#segmentGradient)"
                                        opacity="0.2"
                                    />
                                </g>
                            );
                        })}
                        <defs>
                            <radialGradient id="segmentGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="white" stopOpacity="0" />
                                <stop offset="100%" stopColor="black" stopOpacity="0.5" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>

                {/* Center Hub - 3D Embossed Bulge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-36 sm:h-36 z-30">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 shadow-[0_15px_35px_rgba(0,0,0,0.3),_inset_0_2px_5px_rgba(255,255,255,0.8),_inset_0_-5px_15px_rgba(0,0,0,0.2)] flex items-center justify-center relative overflow-hidden ring-4 ring-slate-800/10 dark:ring-white/5">
                        {/* Shading to create bulge */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_60%)] pointer-events-none" />

                        <div className="relative z-10 flex items-center justify-center w-full h-full p-2">
                            <Logo className={`h-22 w-22 sm:h-26 sm:w-26 aspect-square transition-all duration-500 ${isSpinning ? 'scale-110' : 'scale-100'}`} />
                            {isSpinning && <div className="absolute inset-0 bg-brand-cyan/20 blur-3xl rounded-full animate-pulse" />}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-6 w-full">
                <button
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className={`
                    relative flex items-center justify-center gap-3 px-12 py-6 rounded-2xl text-3xl font-black uppercase tracking-tighter transition-all shadow-2xl overflow-hidden
                    ${isSpinning
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed border-b-0 translate-y-2'
                            : 'bg-brand-cyan text-slate-900 hover:-translate-y-1 active:translate-y-1 hover:shadow-brand-cyan/40 border-b-8 border-sky-600'
                        }
                  `}
                >
                    {isSpinning ? 'Spinning...' : <>Take a Spin <Play className="fill-current h-8 w-8" /></>}
                    {!isSpinning && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />}
                </button>

                <div className="h-12 flex items-center justify-center">
                    {winner !== null && !isSpinning ? (
                        <div className="animate-in zoom-in-50 duration-500">
                            <p className="text-2xl font-black text-white px-8 py-3 rounded-2xl shadow-xl transition-colors" style={{ backgroundColor: SEGMENTS[winner].color }}>
                                LANDED ON {SEGMENTS[winner].name}! 🐘
                            </p>
                        </div>
                    ) : (
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse">
                            Click to signify fun and impact
                        </p>
                    )}
                </div>
            </div>

            {/* Embedded Style for Blinking Colors */}
            <style>{`
                @keyframes huePulse {
                  0% { filter: hue-rotate(0deg); }
                  50% { filter: hue-rotate(30deg) brightness(1.2); }
                  100% { filter: hue-rotate(0deg); }
                }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    );
};

export default WheelOfFun;
