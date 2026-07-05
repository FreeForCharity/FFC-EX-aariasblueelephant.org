// ---------------------------------------------------------------------------
// On-screen controls — shown for EVERYONE (mouse or touch), so the whole game
// is playable without a keyboard. The same soft analog joystick as Elly-Tubbies:
// drag the elephant knob in any direction to walk Nilu (true analog — gentle
// push = slow stroll, big push = trot). A jump button hops. Everything feeds
// the same global `input` the keyboard uses.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { setJoystick, clearJoystick, queueJump } from '../three/input';

const RING = 144;           // joystick ring diameter (px)
const KNOB = 60;            // knob diameter (px)
const MAX = (RING - KNOB) / 2 - 4; // how far the knob may travel

export default function ScreenControls() {
  const ringRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);

  function setKnob(dx: number, dy: number) {
    if (knobRef.current)
      knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  function track(e: React.PointerEvent) {
    if (!ringRef.current) return;
    const r = ringRef.current.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > MAX) { dx = (dx / len) * MAX; dy = (dy / len) * MAX; }
    setKnob(dx, dy);
    // analog vector: x right+, z down+ (screen-down = toward camera = +z)
    setJoystick(dx / MAX, dy / MAX);
  }

  function onDown(e: React.PointerEvent) {
    e.preventDefault();
    activeId.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    track(e);
  }
  function onMove(e: React.PointerEvent) {
    if (activeId.current === e.pointerId) track(e);
  }
  function onUp(e: React.PointerEvent) {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    setKnob(0, 0);
    clearJoystick();
  }

  const arrow = (glyph: string, style: React.CSSProperties) => (
    <span
      className="absolute font-black pointer-events-none"
      style={{ fontSize: 15, color: '#fff', textShadow: '0 2px 5px rgba(58,58,90,.45)', ...style }}
    >
      {glyph}
    </span>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      {/* analog joystick — bottom left (same feel as Elly-Tubbies) */}
      <div
        ref={ringRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="pointer-events-auto absolute touch-none"
        style={{
          left: 20, bottom: 24, width: RING, height: RING, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.55), rgba(255,255,255,.18))',
          border: '4px solid rgba(255,255,255,.85)',
          boxShadow: '0 6px 18px rgba(58,58,90,.18), inset 0 0 24px rgba(184,164,255,.25)',
          backdropFilter: 'blur(2px)',
        }}
        aria-label="Move Nilu"
      >
        {arrow('▲', { top: 5, left: '50%', transform: 'translateX(-50%)' })}
        {arrow('▼', { bottom: 5, left: '50%', transform: 'translateX(-50%)' })}
        {arrow('◀', { left: 8, top: '50%', transform: 'translateY(-50%)' })}
        {arrow('▶', { right: 8, top: '50%', transform: 'translateY(-50%)' })}
        <div
          ref={knobRef}
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            left: '50%', top: '50%', width: KNOB, height: KNOB, borderRadius: '50%',
            transform: 'translate(-50%, -50%)', fontSize: 28,
            background: 'linear-gradient(160deg,#ffffff,#ffe9f2)', border: '3px solid #fff',
            boxShadow: '0 5px 0 #f3c1d6, 0 8px 16px rgba(58,58,90,.25)',
          }}
        >
          🐘
        </div>
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
