// ---------------------------------------------------------------------------
// On-screen controls for touch devices: a thumb-joystick (move) plus jump and
// action buttons. Feeds the same global `input` object the keyboard uses, so
// the player controller doesn't care where movement came from.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { setJoystick, clearJoystick, queueJump, input } from '../three/input';

const BASE = 130; // px diameter of the joystick base
const KNOB = 58;
const MAXR = (BASE - KNOB) / 2;

export default function TouchControls() {
  const baseRef = useRef<HTMLDivElement>(null);
  const center = useRef({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function start(e: React.PointerEvent) {
    const rect = baseRef.current!.getBoundingClientRect();
    center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    pointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    move(e);
  }

  function move(e: React.PointerEvent) {
    if (pointerId.current !== e.pointerId) return;
    let dx = e.clientX - center.current.x;
    let dy = e.clientY - center.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > MAXR) {
      dx = (dx / dist) * MAXR;
      dy = (dy / dist) * MAXR;
    }
    setKnob({ x: dx, y: dy });
    // normalise to -1..1; screen-up (negative dy) = forward (negative z)
    setJoystick(dx / MAXR, dy / MAXR);
  }

  function end(e: React.PointerEvent) {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    clearJoystick();
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      {/* joystick — bottom left */}
      <div
        ref={baseRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="pointer-events-auto absolute touch-none"
        style={{
          left: 24,
          bottom: 28,
          width: BASE,
          height: BASE,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.35), rgba(255,255,255,0.12))',
          border: '2px solid rgba(255,255,255,0.5)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25), inset 0 2px 10px rgba(255,255,255,0.4)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: KNOB,
            height: KNOB,
            marginLeft: -KNOB / 2,
            marginTop: -KNOB / 2,
            transform: `translate(${knob.x}px, ${knob.y}px)`,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #ffffff, #cfe4ff)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* jump button — bottom right */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          queueJump();
        }}
        className="pointer-events-auto absolute touch-none active:scale-90 transition-transform"
        style={{
          right: 28,
          bottom: 96,
          width: 84,
          height: 84,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #b6f0a8, #6fcf6a)',
          border: '2px solid rgba(255,255,255,0.7)',
          boxShadow: '0 8px 22px rgba(0,0,0,0.25)',
          fontSize: 30,
        }}
        aria-label="Jump"
      >
        ⬆️
      </button>

      {/* action button — bottom right lower */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          input.interactQueued = true;
        }}
        className="pointer-events-auto absolute touch-none active:scale-90 transition-transform"
        style={{
          right: 120,
          bottom: 32,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #ffe08a, #ffb74d)',
          border: '2px solid rgba(255,255,255,0.7)',
          boxShadow: '0 8px 22px rgba(0,0,0,0.25)',
          fontSize: 28,
        }}
        aria-label="Action"
      >
        ✋
      </button>
    </div>
  );
}
