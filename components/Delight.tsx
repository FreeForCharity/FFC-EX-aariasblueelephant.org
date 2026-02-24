import React, { useEffect } from 'react';

// Extend Window interface to include our global triggers
declare global {
    interface Window {
        triggerDrift: () => void;
        triggerBurst: (x: number, y: number) => void;
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
        canvas.style.opacity = '0.6';

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

        function createParticle(x?: number, y?: number, isBurst = false) {
            const month = new Date().getMonth() + 1;
            let shape = 'circle'; // Summer/Default
            if (month >= 3 && month <= 5) shape = 'leaf'; // Spring
            else if (month === 1 || month === 2 || month === 12) shape = 'petal'; // Winter

            return {
                x: x !== undefined ? x : Math.random() * width,
                y: y !== undefined ? y : -20,
                vx: isBurst ? (Math.random() * 6 - 3) : (Math.random() * 1 - 0.5),
                vy: isBurst ? (Math.random() * -4 - 2) : (Math.random() * 0.5 + 0.5),
                size: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shape,
                opacity: 0.4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                life: 1.0,
                decay: isBurst ? 0.015 : (Math.random() * 0.002 + 0.001)
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
                p.vy += 0.015; // Gravity
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

            // Spawn 30-40 particles slowly over 3 seconds
            let count = 0;
            let spawnInterval = setInterval(() => {
                particles.push(createParticle());
                if (!isEngineRunning) animate();
                count++;
                if (count >= 35) clearInterval(spawnInterval);
            }, 85);

            setTimeout(() => {
                isDrifting = false;
            }, 3000);
        };

        window.triggerBurst = (x: number, y: number) => {
            if (reducedMotion) return;
            for (let i = 0; i < 15; i++) {
                particles.push(createParticle(x, y, true));
            }
            if (!isEngineRunning) animate();
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
      .animate-trunk {
        animation: trunk-wave 0.8s ease-in-out;
        transform-origin: bottom center;
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
