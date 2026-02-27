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

const WheelOfFun: React.FC = () => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState<number | null>(null);
    const wheelRef = useRef<HTMLDivElement>(null);

    // Audio Refs
    const spinAudio = useRef<HTMLAudioElement | null>(null);
    const winAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio (using royalty-free preview URLs for now)
        spinAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3');
        winAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

        if (spinAudio.current) {
            spinAudio.current.loop = true;
            spinAudio.current.volume = 0.4;
        }
    }, []);

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setWinner(null);

        // Random spin: 5-10 full rotations + random segment offset
        const extraDegrees = Math.floor(Math.random() * 360);
        const totalRotation = rotation + (360 * (5 + Math.floor(Math.random() * 5))) + extraDegrees;

        setRotation(totalRotation);

        if (spinAudio.current) {
            spinAudio.current.currentTime = 0;
            spinAudio.current.play().catch(e => console.log("Audio play blocked", e));
        }

        // Standard spin duration: 4s
        setTimeout(() => {
            setIsSpinning(false);

            if (spinAudio.current) spinAudio.current.pause();
            if (winAudio.current) winAudio.current.play().catch(e => console.log("Audio play blocked", e));

            // Calculate winner
            const actualDegrees = totalRotation % 360;
            // Wheel segments: 360 / 7 = ~51.42 each
            // The needle is at the top (270 degrees in SVG space or just 0 offset)
            // We'll simplify: index = floor((360 - actualDegrees) / (360 / 7))
            const segmentSize = 360 / SEGMENTS.length;
            const winnerIndex = Math.floor(((360 - (actualDegrees % 360)) % 360) / segmentSize);
            setWinner(winnerIndex);

            // Trigger Celebration
            if (window.triggerFunSpinBurst && wheelRef.current) {
                const rect = wheelRef.current.getBoundingClientRect();
                window.triggerFunSpinBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

                // Trigger Mascot if present
                const mascot = document.getElementById('elephant-mascot');
                if (mascot) {
                    mascot.classList.add('animate-trunk');
                    setTimeout(() => mascot.classList.remove('animate-trunk'), 1500);
                }
            }
        }, 4000);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border-4 border-sky-500/20 shadow-2xl relative overflow-hidden group">
            {/* Decorative Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-purple-500/5 pointer-events-none" />

            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <RotateCw className={`h-8 w-8 text-brand-cyan ${isSpinning ? 'animate-spin' : ''}`} />
                Aaria's Wheel of Fun
            </h2>

            <div className="relative w-80 h-80 sm:w-96 sm:h-96" ref={wheelRef}>
                {/* Needle */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-40 transition-transform duration-100">
                    <div className="w-6 h-10 bg-slate-800 dark:bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="w-2 h-6 bg-red-500 rounded-full" />
                    </div>
                </div>

                {/* The Wheel */}
                <div
                    className="w-full h-full rounded-full border-8 border-slate-800 dark:border-slate-700 shadow-[0_0_50px_rgba(14,165,233,0.3)] transition-transform duration-[4000ms] ease-out overflow-hidden"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
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
                                <path
                                    key={i}
                                    d={pathData}
                                    fill={seg.color}
                                    className="stroke-slate-800 dark:stroke-slate-700 stroke-1"
                                />
                            );
                        })}
                    </svg>
                </div>

                {/* Center Hub with Logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full border-4 border-slate-800 dark:border-slate-700 z-30 flex items-center justify-center shadow-xl">
                    <Logo className="h-16 w-16 sm:h-20 sm:w-20 animate-wiggle" />
                </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4">
                <button
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className={`
            flex items-center gap-3 px-10 py-5 rounded-full text-2xl font-black uppercase tracking-tighter transition-all shadow-xl
            ${isSpinning
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed scale-95'
                            : 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white hover:scale-110 active:scale-95 hover:shadow-sky-500/50'
                        }
          `}
                >
                    {isSpinning ? 'Good Luck...' : <>Spin for Fun <Play className="fill-current" /></>}
                </button>

                {winner !== null && !isSpinning && (
                    <div className="animate-bounce">
                        <p className="text-xl font-bold bg-slate-100 dark:bg-slate-800 px-6 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                            Land color: <span style={{ color: SEGMENTS[winner].color }}>{SEGMENTS[winner].name}</span>! 🎉
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WheelOfFun;
