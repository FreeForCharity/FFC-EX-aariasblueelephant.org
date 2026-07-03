// ---------------------------------------------------------------------------
// Rainbow Playground — the earned reward island actually PLAYS.
//   • Bouncy dome: standing on it boings Belu up with ~2x jump power (and the
//     dome squishes). Bounce forever — pure body-play.
//   • Balloons: touch one and it POPS with confetti + a bright chime, then
//     quietly reappears ~30s later. Nothing to lose, nothing to run out of.
//   • Slide: step onto the blue ramp and whoosh down it.
// Deliberately SILENT: no dialogue, no stars, no task card — this island
// doubles as a sensory/regulation corner, so Belu stays quiet here.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLANDS } from './worldConfig';
import { beluPos, beluState, playerImpulse, playerBoost } from './playerState';
import type { Sound } from '../belu/feedback';

const isl = ISLANDS.rainbow;

// layout (local offsets from the island centre; world.y = isl.top)
const DOME = { x: isl.cx - 2.5, z: isl.cz + 1, r: 2.1 };
const SLIDE = { x: isl.cx + 2.8, z: isl.cz + 1, halfW: 0.8, halfL: 1.4 };
const BALLOONS: { color: string; dx: number; dz: number }[] = [
  { color: '#ff6b6b', dx: -3, dz: -2.6 },
  { color: '#ffd166', dx: 3, dz: -2.6 },
  { color: '#8a7bff', dx: 0.5, dz: -3.6 },
];
const BALLOON_Y = 1.5; // above the grass — reachable by walking/jumping
const BALLOON_TOUCH = 1.15;
const BALLOON_RESPAWN = 30; // seconds until a popped balloon drifts back
const BOUNCE_VY = 18; // ~2x the normal jump impulse (Player JUMP_V = 9)
const SLIDE_PUSH = 7; // extra units/second of whoosh down the ramp

interface State {
  clock: number;
  poppedAt: number[]; // -99 = floating; otherwise the clock time it popped
  bounceLock: number;
  slideTick: number;
}

interface Props {
  paused: boolean;
  playSound: (kind: Sound) => void;
}

export default function RainbowPlay({ paused, playSound }: Props) {
  const [, force] = useState(0);
  const bump = () => force((v) => (v + 1) % 1_000_000);
  const S = useRef<State>({ clock: 0, poppedAt: BALLOONS.map(() => -99), bounceLock: 0, slideTick: 0 });
  const dome = useRef<THREE.Mesh>(null);
  const lastBounce = useRef(-99);
  const frame = useRef<(dt: number) => void>(() => {});

  frame.current = (dt: number) => {
    const st = S.current;
    if (paused) return;
    st.clock += dt;

    // ---- bouncy dome: standing on it boings Belu skyward ----
    const dDome = Math.hypot(beluPos.x - DOME.x, beluPos.z - DOME.z);
    if (dDome < DOME.r && beluState.grounded && st.clock > st.bounceLock) {
      playerImpulse.vy = BOUNCE_VY;
      st.bounceLock = st.clock + 0.3;
      lastBounce.current = st.clock;
      playSound('correct'); // a bright happy "boing"
    }

    // ---- slide: whoosh Belu down the ramp (downhill = +z) ----
    if (
      Math.abs(beluPos.x - SLIDE.x) < SLIDE.halfW &&
      beluPos.z > SLIDE.z - SLIDE.halfL &&
      beluPos.z < SLIDE.z + SLIDE.halfL
    ) {
      playerBoost.z += SLIDE_PUSH;
      if (st.clock > st.slideTick) {
        st.slideTick = st.clock + 0.45;
        playSound('tap'); // soft whoosh ticks
      }
    }

    // ---- balloons: pop on touch, confetti, quiet respawn ----
    for (let i = 0; i < BALLOONS.length; i++) {
      const b = BALLOONS[i];
      const at = st.poppedAt[i];
      if (at < 0) {
        const d = Math.hypot(
          beluPos.x - (isl.cx + b.dx),
          beluPos.y - (isl.top + BALLOON_Y),
          beluPos.z - (isl.cz + b.dz),
        );
        if (d < BALLOON_TOUCH) {
          st.poppedAt[i] = st.clock;
          playSound('star'); // pop!
          bump();
        }
      } else if (st.clock - at > BALLOON_RESPAWN) {
        st.poppedAt[i] = -99;
        bump();
      } else if (st.clock - at > 1.3 && st.clock - at < 1.3 + dt * 2) {
        bump(); // retire the confetti burst
      }
    }
  };

  const st = S.current;
  return (
    <group>
      <Ticker fnRef={frame} />

      {/* bouncy dome (squishes on every boing) */}
      <SquishyDome meshRef={dome} lastBounce={lastBounce} />

      {/* slide: ramp + a soft landing pad at the bottom */}
      <group position={[SLIDE.x, isl.top, SLIDE.z]}>
        <mesh position={[0, 0.8, 0]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.9, 0.12, 2.6]} />
          <meshStandardMaterial color="#5fd0e0" roughness={0.35} emissive="#5fd0e0" emissiveIntensity={0.15} />
        </mesh>
        {/* side rails */}
        {[-0.5, 0.5].map((o) => (
          <mesh key={o} position={[o, 0.92, 0]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.1, 0.22, 2.6]} />
            <meshStandardMaterial color="#ffd166" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.08, 1.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 24]} />
          <meshBasicMaterial color="#bff6ff" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* balloons + confetti */}
      {BALLOONS.map((b, i) => {
        const at = st.poppedAt[i];
        const x = isl.cx + b.dx;
        const z = isl.cz + b.dz;
        const justPopped = at > 0 && st.clock - at < 1.3;
        return (
          <group key={i}>
            {at < 0 && <Balloon position={[x, isl.top + BALLOON_Y, z]} color={b.color} seed={i + 1} />}
            {justPopped && (
              <group position={[x, isl.top + BALLOON_Y, z]}>
                <Sparkles count={24} scale={2.6} size={8} speed={1.4} color={b.color} />
                <Sparkles count={16} scale={2.2} size={6} speed={1.1} color="#ffffff" />
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

// The pink dome that squishes when Belu boings off it.
function SquishyDome({
  meshRef,
  lastBounce,
}: {
  meshRef: React.RefObject<THREE.Mesh>;
  lastBounce: React.MutableRefObject<number>;
}) {
  const sq = useRef(0); // 0 = round, >0 = squashed (decays back)
  const seen = useRef(-99);
  useFrame((_, dt) => {
    const m = meshRef.current;
    if (!m) return;
    if (lastBounce.current >= 0 && seen.current !== lastBounce.current) {
      seen.current = lastBounce.current;
      sq.current = 0.35; // squash on every boing
    }
    sq.current = Math.max(0, sq.current - dt * 1.1);
    const s = sq.current;
    m.scale.set(1.4 * (1 + s * 0.5), 0.9 * (1 - s), 1.4 * (1 + s * 0.5));
  });
  return (
    <mesh ref={meshRef} position={[DOME.x, isl.top + 0.55, DOME.z]} scale={[1.4, 0.9, 1.4]}>
      <sphereGeometry args={[1.4, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#ff9ed8" roughness={0.45} emissive="#ff9ed8" emissiveIntensity={0.12} />
    </mesh>
  );
}

// A gently bobbing balloon on a string.
function Balloon({ position, color, seed }: { position: [number, number, number]; color: string; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(seed * 2.1);
  useFrame((_, dt) => {
    t.current += dt;
    if (g.current) {
      g.current.position.y = position[1] + Math.sin(t.current * 1.4) * 0.18;
      g.current.rotation.z = Math.sin(t.current * 1.1) * 0.06;
    }
  });
  return (
    <group ref={g} position={position}>
      <mesh>
        <sphereGeometry args={[0.5, 14, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <coneGeometry args={[0.09, 0.14, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Ticker({ fnRef }: { fnRef: React.MutableRefObject<(dt: number) => void> }) {
  useFrame((_, dt) => fnRef.current(Math.min(dt, 0.05)));
  return null;
}
