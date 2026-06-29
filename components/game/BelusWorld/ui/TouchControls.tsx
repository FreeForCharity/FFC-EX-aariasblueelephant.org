// ---------------------------------------------------------------------------
// On-screen controls — shown for EVERYONE (mouse or touch), so the whole game
// is playable without a keyboard. A big friendly D-pad moves Belu up / down /
// left / right (hold or tap), and a jump button hops. Diagonals work by holding
// two arrows. Everything feeds the same global `input` the keyboard uses.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { setJoystick, clearJoystick, queueJump } from '../three/input';

type Dir = 'up' | 'down' | 'left' | 'right';

export default function ScreenControls() {
  const held = useRef<Set<Dir>>(new Set());

  function apply() {
    const h = held.current;
    let x = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0);
    let z = (h.has('down') ? 1 : 0) - (h.has('up') ? 1 : 0); // up = forward = -z
    const len = Math.hypot(x, z);
    if (len > 0) {
      x /= len;
      z /= len;
      setJoystick(x, z);
    } else {
      clearJoystick();
    }
  }

  function press(d: Dir, e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    held.current.add(d);
    apply();
  }
  function release(d: Dir, e: React.PointerEvent) {
    e.preventDefault();
    held.current.delete(d);
    apply();
  }

  const padBtn = (d: Dir, glyph: string, style: React.CSSProperties) => (
    <button
      onPointerDown={(e) => press(d, e)}
      onPointerUp={(e) => release(d, e)}
      onPointerCancel={(e) => release(d, e)}
      onPointerLeave={(e) => { if (held.current.has(d)) release(d, e); }}
      className="pointer-events-auto absolute flex items-center justify-center touch-none select-none active:scale-95"
      style={{
        width: 58, height: 58, borderRadius: 16, fontSize: 24, color: '#2b517d',
        background: 'rgba(255,255,255,0.82)', border: '2px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.22)', transition: 'transform 0.08s',
        ...style,
      }}
      aria-label={d}
    >
      {glyph}
    </button>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      {/* D-pad — bottom left */}
      <div className="absolute" style={{ left: 22, bottom: 26, width: 182, height: 182 }}>
        {padBtn('up', '▲', { left: 62, top: 0 })}
        {padBtn('left', '◀', { left: 0, top: 62 })}
        {padBtn('right', '▶', { left: 124, top: 62 })}
        {padBtn('down', '▼', { left: 62, top: 124 })}
      </div>

      {/* Jump — bottom right */}
      <button
        onPointerDown={(e) => { e.preventDefault(); queueJump(); }}
        className="pointer-events-auto absolute touch-none select-none active:scale-90"
        style={{
          right: 30, bottom: 40, width: 88, height: 88, borderRadius: '50%', fontSize: 26,
          fontWeight: 800, color: '#0b4419',
          background: 'radial-gradient(circle at 40% 35%, #b6f0a8, #6fcf6a)',
          border: '3px solid rgba(255,255,255,0.85)',
          boxShadow: '0 6px 0 #2f9e44, 0 10px 18px rgba(0,0,0,0.2)', transition: 'transform 0.08s',
        }}
        aria-label="Jump"
      >
        Jump
      </button>
    </div>
  );
}
