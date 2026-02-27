import React, { useEffect } from 'react';

// Extend Window interface to include our global triggers
declare global {
    interface Window {
        triggerDrift: () => void;
        triggerBurst: (x: number, y: number) => void;
        triggerFunSpinBurst: (x: number, y: number) => void;
    }
}

const Delight: React.FC = () => {
    useEffect(() => {
        // 1. Global Accessibility Guardrails
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let reducedMotion = mediaQuery.matches;

        // Check if canvas already exists (React Strict Mode guard)
        if (document.getElementById('easter-canvas')) return;

        let particles: any[] = [];

        mediaQuery.addEventListener('change', e => {
            reducedMotion = e.matches;
            if (reducedMotion) {
                particles = [];
                if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });

        // 2. Canvas Setup
        const canvas = document.createElement('canvas');
        canvas.id = 'easter-canvas';
        // Style applied directly matching CSS spec
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        canvas.style.opacity = '1.0';

        document.body.insertBefore(canvas, document.body.firstChild);
        const ctx = canvas.getContext('2d');

        let width: number, height: number;
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        // 3. Engine & Parameters
        let isEngineRunning = false;
        let isDrifting = false; // "One-at-a-time" logic lock
        const colors = ['#FFB6C1', '#FFE066', '#C3AED6', '#A8E6CF']; // Neurodiversity pastels

        function createParticle(x?: number, y?: number, isBurst: boolean | string = false) {
            const month = new Date().getMonth() + 1;
            let shape = 'circle'; // Summer/Default
            if (month >= 3 && month <= 5) shape = 'leaf'; // Spring
            else if (month === 1 || month === 2 || month === 12) shape = 'petal'; // Winter

            if (isBurst === 'fun-spin' && Math.random() > 0.7) shape = 'brand-elephant';

            const saturation = isBurst ? (isBurst === 'fun-spin' ? 1.0 : 0.8) : 0.7;

            return {
                x: x !== undefined ? x : Math.random() * width,
                y: y !== undefined ? y : -20,
                vx: isBurst ? (Math.random() * (isBurst === 'fun-spin' ? 8 : 6) - (isBurst === 'fun-spin' ? 4 : 3)) : (Math.random() * 1 - 0.5),
                vy: isBurst ? (isBurst === 'fun-spin' ? (Math.random() * -10 - 5) : (Math.random() * -8 - 4)) : (Math.random() * 0.5 + 0.5),
                size: Math.random() * (isBurst === 'fun-spin' ? 14 : 6) + 4,
                color: isBurst === 'fun-spin'
                    ? ['#00BFFF', '#FFD700', '#FF1493', '#00FF7F', '#9370DB', '#FFA500', '#FF69B4'][Math.floor(Math.random() * 7)]
                    : colors[Math.floor(Math.random() * colors.length)],
                shape: shape,
                opacity: isBurst === 'fun-spin' ? 1.0 : 0.7,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                life: 1.0,
                decay: isBurst ? (isBurst === 'fun-spin' ? 0.004 : 0.015) : (Math.random() * 0.0015 + 0.0005) // 0.004 allows for ~15+ seconds of visibility
            };
        }

        function drawParticle(p: any) {
            if (!ctx) return;
            ctx.save();
            ctx.globalAlpha = p.opacity * p.life;
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.beginPath();

            if (p.shape === 'leaf') {
                ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
            } else if (p.shape === 'petal') {
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, p.size / 3, 0, p.size);
                ctx.bezierCurveTo(-p.size, p.size / 3, -p.size / 2, -p.size / 2, 0, 0);
            } else if (p.shape === 'brand-elephant') {
                // Simplified elephant silhouette with ENHANCED SHIMMER
                const shimmer = Math.sin(Date.now() / 150 + p.x) * 0.3 + 0.7;
                ctx.save();
                ctx.globalAlpha = p.opacity * p.life;
                if (shimmer > 0.8) {
                    ctx.shadowColor = '#00BFFF';
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = 'white'; // Flash white for shine
                }
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2); // Body
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-p.size * 0.8, 0, p.size * 0.6, Math.PI, Math.PI * 2.5); // Trunk
                ctx.lineWidth = p.size * 0.3;
                ctx.strokeStyle = p.color;
                ctx.stroke();
                // Ear
                ctx.beginPath();
                ctx.ellipse(p.size * 0.5, -p.size * 0.2, p.size * 0.5, p.size * 0.7, 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else {
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            }

            ctx.fill();
            ctx.restore();
        }

        let animationFrameId: number;
        function animate() {
            if (!ctx) return;
            if (reducedMotion || particles.length === 0) {
                isEngineRunning = false;
                ctx.clearRect(0, 0, width, height);
                return;
            }
            isEngineRunning = true;
            ctx.clearRect(0, 0, width, height);

            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                // GRAVITY: Restore upward pop then SLOW drift to bottom
                p.vy += p.decay < 0.005 ? 0.08 : 0.15; // Balanced gravity for slow descent
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                p.life -= p.decay;

                if (p.y > height + p.size || p.life <= 0) {
                    particles.splice(i, 1);
                } else {
                    drawParticle(p);
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        }

        // 4. Triggers (Exposed globally)
        window.triggerDrift = () => {
            if (reducedMotion || isDrifting) return;
            isDrifting = true;

            // Spawn ~55 particles slowly over 5 seconds
            let count = 0;
            let spawnInterval = setInterval(() => {
                particles.push(createParticle());
                if (!isEngineRunning) animate();
                count++;
                if (count >= 58) clearInterval(spawnInterval);
            }, 85);

            setTimeout(() => {
                isDrifting = false;
            }, 5000);
        };

        window.triggerBurst = (x: number, y: number) => {
            if (reducedMotion) return;
            for (let i = 0; i < 15; i++) {
                particles.push(createParticle(x, y, true));
            }
            if (!isEngineRunning) animate();
        };

        window.triggerFunSpinBurst = (x: number, y: number) => {
            if (reducedMotion) return;
            // Pronounced splash: 3 waves of particles for 10+ seconds coverage
            const triggerWave = (delay: number) => {
                setTimeout(() => {
                    for (let i = 0; i < 35; i++) {
                        particles.push(createParticle(x, y, 'fun-spin'));
                    }
                    if (!isEngineRunning) animate();
                }, delay);
            };

            triggerWave(0);
            triggerWave(400);
            triggerWave(800);
        };

        // 5. DOM Initialization Events (Delegated Listener for dynamic React apps)
        const handleGlobalClick = (e: MouseEvent) => {
            if (reducedMotion) return;

            const target = e.target as HTMLElement;
            const mascot = target.closest('#elephant-mascot');
            const donateBtn = target.closest('#donate-button') || target.closest('[data-donate-btn]');

            if (mascot) {
                let isWaving = mascot.classList.contains('animate-trunk');
                if (!isWaving) {
                    mascot.classList.add('animate-trunk');
                    let clicks = parseInt(localStorage.getItem('elephantClicks') || '0', 10);
                    clicks++;
                    localStorage.setItem('elephantClicks', clicks.toString());

                    if (clicks % 3 === 0) window.triggerDrift(); // Drift every 3 clicks for more interaction

                    setTimeout(() => {
                        mascot.classList.remove('animate-trunk');
                    }, 800);
                }
            }

            if (donateBtn) {
                // Confetti Burst
                const rect = donateBtn.getBoundingClientRect();
                window.triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

                // Make the button itself tilt
                if (!donateBtn.classList.contains('animate-wiggle')) {
                    donateBtn.classList.add('animate-wiggle');
                    setTimeout(() => donateBtn.classList.remove('animate-wiggle'), 600);
                }

                // Trigger Mascot Wave remotely (Thank You)
                const docMascot = document.getElementById('elephant-mascot');
                if (docMascot && !docMascot.classList.contains('animate-trunk')) {
                    docMascot.classList.add('animate-trunk');
                    setTimeout(() => docMascot.classList.remove('animate-trunk'), 800);
                }
            }
        };

        document.addEventListener('click', handleGlobalClick);

        // Inject Keyframes
        const style = document.createElement('style');
        style.innerHTML = `
      @keyframes trunk-wave {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.05) rotate(15deg); }
        50% { transform: scale(1.05) rotate(-5deg); }
        75% { transform: scale(1.05) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      @keyframes delight-wiggle {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.02) rotate(3deg); }
        50% { transform: scale(1.02) rotate(-3deg); }
        75% { transform: scale(1.02) rotate(2deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      .animate-trunk {
        animation: trunk-wave 0.8s ease-in-out;
        transform-origin: bottom center;
      }
      .animate-wiggle {
        animation: delight-wiggle 0.6s ease-in-out;
      }
    `;
        document.head.appendChild(style);

        return () => {
            // Cleanup
            window.removeEventListener('resize', resize);
            document.removeEventListener('click', handleGlobalClick);
            cancelAnimationFrame(animationFrameId);
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
            if (style.parentNode) style.parentNode.removeChild(style);
            delete (window as any).triggerDrift;
            delete (window as any).triggerBurst;
        };
    }, []);

    return null;
};

export default Delight;
