// ---------------------------------------------------------------------------
// Calm Cove extras — the delight layer for "calm the storm".
//   • CoveShells   : hidden glowing seashells the child finds by walking near
//                    them. Each one sparkles + chimes + pops when discovered, and
//                    a little counter of found shells grows (pride + collecting).
//   • StormWaves   : concentric ripple rings that ride HIGH & dark in the storm
//                    and flatten to almost nothing as the sea calms — so the child
//                    SEES their breathing push the waves down.
//   • DolphinBuddy : a friendly dolphin hiding under the choppy water. Once the
//                    sea is calm it surfaces, arcs in happy leaps, and squeaks
//                    hello — a surprise buddy that rewards finishing.
//   • PopBubbles   : a burst of rising bubbles for the big calm celebration.
// All pure primitives; no new textures except shell/dolphin face label sprites
// (depthTest/Write off, renderOrder>=11 per the rules). Deterministic: every bit
// of variation comes from a seed + the shared clock, never Date.now/Math.random.
// Only imported by CoveLayer.
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';

// deterministic 0..1 hash from a seed (no Math.random — SSR/replay safe)
function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export interface ShellSpot {
  x: number;
  z: number;
  emoji: string;
}

/** Lay out `count` shell spots in a calm ring around the cove edge, seeded. */
export function shellLayout(cx: number, cz: number, radius: number, count: number, seed: number): ShellSpot[] {
  const EMOJI = ['🐚', '⭐', '🪸', '🐚', '🌟'];
  const out: ShellSpot[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + seeded(seed + i) * 0.8;
    const r = radius * (0.5 + seeded(seed + i * 2.3) * 0.32);
    out.push({
      x: cx + Math.cos(a) * r,
      z: cz + Math.sin(a) * r,
      emoji: EMOJI[i % EMOJI.length],
    });
  }
  return out;
}

// A single hidden shell. Bobs gently and glints; when found it pops big, spins,
// fades, and leaves a sparkle burst behind (handled by the parent's render).
export function Shell({
  position,
  emoji,
  color,
  found,
  foundAt,
  clock,
  seed,
}: {
  position: [number, number, number];
  emoji: string;
  color: string;
  found: boolean;
  foundAt: number;
  clock: number;
  seed: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeLabelTexture(emoji), [emoji]);
  useFrame(() => {
    if (!grp.current) return;
    if (found) {
      // pop up + grow + spin, then shrink away into its sparkle burst
      const age = clock - foundAt;
      const pop = age < 0.35 ? 1 + age * 2.2 : Math.max(0, 1.77 - (age - 0.35) * 1.6);
      grp.current.scale.setScalar(Math.max(0.0001, pop));
      grp.current.position.y = position[1] + Math.min(1.4, age * 2.4);
      grp.current.rotation.y += 0.25;
    } else {
      // a small inviting bob + glint so a curious kid notices it
      const t = clock * 1.6 + seed * 6.0;
      grp.current.position.y = position[1] + Math.sin(t) * 0.12;
      grp.current.rotation.y = Math.sin(t * 0.5) * 0.5;
      grp.current.scale.setScalar(0.7);
    }
  });
  if (found && clock - foundAt > 1.4) return null; // fully collected
  return (
    <group ref={grp} position={position}>
      {/* tiny glow halo so shells read as "special" treasure */}
      <mesh>
        <sphereGeometry args={[0.42, 16, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} roughness={0.2} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <sprite position={[0, 0, 0]} scale={[0.95, 0.95, 1]} renderOrder={11}>
        <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}

// Concentric ripple rings. `calm` 0..1 flattens their height + slows them so the
// child watches the storm's waves shrink as they breathe.
export function StormWaves({
  center,
  radius,
  calm,
  clock,
}: {
  center: [number, number, number];
  radius: number;
  calm: number;
  clock: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const RINGS = 4;
  useFrame(() => {
    if (!grp.current) return;
    const chop = 1 - calm;
    grp.current.children.forEach((ring, i) => {
      // each ring breathes out from the centre on its own phase
      const phase = (clock * (0.35 + chop * 0.5) + i / RINGS) % 1;
      const r = 0.4 + phase * radius;
      ring.scale.set(r, r, 1);
      const m = (ring as THREE.Mesh).material as THREE.MeshStandardMaterial;
      // tall, dark & strong in the storm; nearly invisible when calm
      m.opacity = (1 - phase) * (0.06 + chop * 0.5);
      ring.position.y = center[1] + Math.sin(clock * 3 + i) * chop * 0.18;
    });
  });
  return (
    <group ref={grp} position={center} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh key={i}>
          <ringGeometry args={[0.86, 1.0, 40]} />
          <meshStandardMaterial color="#cfe6f2" emissive="#9fd6ec" emissiveIntensity={0.4} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// The surprise buddy: a dolphin that hides under the storm, then leaps happily in
// arcs once the cove is calm. Squeak/wave handled by the parent (speak()).
export function DolphinBuddy({
  center,
  radius,
  active,
  clock,
}: {
  center: [number, number, number];
  radius: number;
  active: boolean; // true once the sea is calm — it surfaces & plays
  clock: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const faceTex = useMemo(() => makeLabelTexture('🐬'), []);
  const since = useRef(0);
  const wasActive = useRef(false);
  useFrame(() => {
    if (!grp.current) return;
    if (active && !wasActive.current) since.current = clock;
    wasActive.current = active;
    if (!active) {
      // lurking just under the surface, barely visible
      grp.current.position.set(center[0], center[1] - 1.4, center[2]);
      grp.current.scale.setScalar(0.0001);
      return;
    }
    const age = clock - since.current;
    grp.current.scale.setScalar(Math.min(1, age * 2));
    // travel in a wide circle, leaping (parabola) on each pass
    const ang = clock * 0.8;
    const r = radius * 0.5;
    grp.current.position.x = center[0] + Math.cos(ang) * r;
    grp.current.position.z = center[2] + Math.sin(ang) * r;
    const leap = Math.max(0, Math.sin(clock * 1.6));
    grp.current.position.y = center[1] + leap * 1.8;
    // nose-dives: tip up on the way up, down on the way down
    grp.current.rotation.y = -ang;
    grp.current.rotation.z = Math.cos(clock * 1.6) * 0.9;
  });
  return (
    <group ref={grp}>
      {/* body */}
      <mesh scale={[1.0, 0.5, 0.4]}>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial color="#7fc7e8" emissive="#7fc7e8" emissiveIntensity={0.45} roughness={0.3} />
      </mesh>
      {/* tail */}
      <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.5, 0.45, 0.12]}>
        <coneGeometry args={[0.32, 0.6, 8]} />
        <meshStandardMaterial color="#7fc7e8" emissive="#7fc7e8" emissiveIntensity={0.45} roughness={0.3} />
      </mesh>
      {/* dorsal fin */}
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, -0.2]} scale={[0.4, 0.5, 0.1]}>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshStandardMaterial color="#6fb8da" emissive="#6fb8da" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      {/* friendly face */}
      <sprite position={[0.55, 0.25, 0.35]} scale={[0.7, 0.7, 1]} renderOrder={11}>
        <spriteMaterial map={faceTex} transparent depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}

// A column of bubbles rising for the big calm celebration.
export function PopBubbles({ center, radius, clock }: { center: [number, number, number]; radius: number; clock: number }) {
  const grp = useRef<THREE.Group>(null);
  const N = 14;
  useFrame(() => {
    if (!grp.current) return;
    grp.current.children.forEach((b, i) => {
      const sp = 0.35 + seeded(i + 1) * 0.5;
      const phase = (clock * sp + seeded(i * 2.1)) % 1;
      const ang = seeded(i * 3.3) * Math.PI * 2;
      const rr = radius * (0.2 + seeded(i * 1.7) * 0.6);
      b.position.x = Math.cos(ang) * rr;
      b.position.z = Math.sin(ang) * rr;
      b.position.y = phase * 3.2; // rise then loop
      const s = (0.12 + seeded(i) * 0.18) * (1 - phase * 0.4);
      b.scale.setScalar(s);
      const m = (b as THREE.Mesh).material as THREE.MeshStandardMaterial;
      m.opacity = (1 - phase) * 0.6;
    });
  });
  return (
    <group ref={grp} position={center}>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#d8f7ff" emissive="#bff3ff" emissiveIntensity={0.6} roughness={0.1} metalness={0.2} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
