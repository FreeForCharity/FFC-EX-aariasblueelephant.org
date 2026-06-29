// ---------------------------------------------------------------------------
// Friendship Forest — EXTRAS (engagement layer, owned by the forest island).
//   • Twinkle: a tiny hidden firefly/star you can DISCOVER by walking near it.
//     It sparkles, then on collect it pops, chimes, and flies up — a gentle,
//     no-fail collectible that gives a "one more!" reason to wander.
//   • Wisp: a friendly little firefly guide that bobs around the forest, blinks,
//     and gives the world some living personality (idle delight).
//   • GlowMushroom / WishLantern: bits of scenery that LIGHT UP as the child
//     helps more friends, so the forest visibly comes alive because of them.
//   • WordTrail: a quick sparkle puff that rises when a magic word lands.
//
// All purely additive + deterministic (no Date.now / Math.random at module or
// render scope — everything is driven by an accumulated clock and a seeded
// helper). Imported ONLY by ForestLayer. Geometry is reused/cheap.
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';

// seeded 0..1 — stable per seed, no Math.random (keeps SSR/determinism happy)
export function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// Twinkle — a hidden collectible. Sits at `position`, twinkles, and when Belu
// gets close the parent calls onShine for the chime; once `collected` it pops
// up and fades. No fail state — it simply waits to be found.
// ---------------------------------------------------------------------------
export function Twinkle({
  position,
  emoji,
  color,
  collected,
  collectedAt,
  clock,
  seed = 0,
}: {
  position: [number, number, number];
  emoji: string;
  color: string;
  collected: boolean;
  collectedAt: number;
  clock: number;
  seed?: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeLabelTexture(emoji), [emoji]);
  const phase = useMemo(() => seeded(seed + 3) * Math.PI * 2, [seed]);

  useFrame(() => {
    const g = grp.current;
    if (!g) return;
    if (collected) {
      const age = Math.max(0, clock - collectedAt);
      // pop, then rise and shrink away (the layer unmounts us after ~1.2s)
      const s = (0.6 + Math.sin(Math.min(1, age * 6) * Math.PI) * 0.5) * (1 - Math.min(1, age));
      g.scale.setScalar(Math.max(0.0001, s));
      g.position.y = position[1] + Math.min(1, age) * 1.6;
      g.rotation.y += 0.25;
    } else {
      // a gentle hover + a slow shimmering scale so it catches the eye
      const tw = 0.85 + Math.sin(clock * 3 + phase) * 0.18;
      g.scale.setScalar(tw);
      g.position.y = position[1] + Math.sin(clock * 1.6 + phase) * 0.18;
      g.rotation.y += 0.012;
    }
  });

  return (
    <group ref={grp} position={position}>
      {!collected && (
        <Sparkles count={6} scale={0.9} size={4} speed={0.5} color={color} opacity={0.9} />
      )}
      {collected && (
        <Sparkles count={16} scale={1.8} size={6} speed={0.9} color={color} />
      )}
      <sprite scale={[0.85, 0.85, 1]} renderOrder={11}>
        <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Wisp — a friendly firefly guide. Floats a lazy loop around a centre point,
// glows, and blinks brighter now and then. Pure ambience / personality.
// ---------------------------------------------------------------------------
export function Wisp({
  center,
  color,
  seed = 0,
  excited = false,
}: {
  center: [number, number, number];
  color: string;
  seed?: number;
  excited?: boolean;
}) {
  const grp = useRef<THREE.Group>(null);
  const dot = useRef<THREE.Mesh>(null);
  const t = useRef(seeded(seed) * 10);
  const r = useMemo(() => 2.4 + seeded(seed + 1) * 1.8, [seed]);
  const speed = useMemo(() => 0.4 + seeded(seed + 2) * 0.3, [seed]);
  const yAmp = useMemo(() => 0.5 + seeded(seed + 4) * 0.6, [seed]);

  useFrame((_, dt) => {
    t.current += dt * (excited ? 2.2 : 1);
    const g = grp.current;
    if (!g) return;
    const a = t.current * speed;
    g.position.x = center[0] + Math.cos(a) * r;
    g.position.z = center[2] + Math.sin(a * 1.3) * r;
    g.position.y = center[1] + 1.4 + Math.sin(t.current * 1.7) * yAmp;
    if (dot.current) {
      const m = dot.current.material as THREE.MeshBasicMaterial;
      const blink = 0.55 + Math.abs(Math.sin(t.current * 2.3)) * 0.45;
      m.opacity = blink;
    }
  });

  return (
    <group ref={grp} position={center}>
      <mesh ref={dot}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <Sparkles count={excited ? 10 : 5} scale={0.7} size={excited ? 6 : 4} speed={0.6} color={color} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// GlowMushroom — a little mushroom that is dim until `lit`, then glows warmly.
// Used to show the forest waking up as the child helps more friends.
// ---------------------------------------------------------------------------
export function GlowMushroom({
  position,
  color,
  lit,
  seed = 0,
}: {
  position: [number, number, number];
  color: string;
  lit: boolean;
  seed?: number;
}) {
  const cap = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => seeded(seed + 5) * Math.PI * 2, [seed]);
  const t = useRef(phase);

  useFrame((_, dt) => {
    t.current += dt;
    if (!cap.current) return;
    const m = cap.current.material as THREE.MeshStandardMaterial;
    const want = lit ? 0.7 + Math.sin(t.current * 2 + phase) * 0.25 : 0.04;
    m.emissiveIntensity += (want - m.emissiveIntensity) * Math.min(1, dt * 4);
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.26, 8]} />
        <meshStandardMaterial color="#f3ead8" roughness={0.8} />
      </mesh>
      <mesh ref={cap} position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.04} roughness={0.5} />
      </mesh>
      {lit && <Sparkles count={5} scale={0.6} size={3} speed={0.4} color={color} position={[0, 0.4, 0]} />}
    </group>
  );
}

// ---------------------------------------------------------------------------
// WordTrail — a quick rising sparkle puff + the word's picture, played right
// where a magic word landed. A satisfying little "your word did that!" pop.
// ---------------------------------------------------------------------------
export function WordTrail({
  position,
  emoji,
  color,
  born,
  clock,
}: {
  position: [number, number, number];
  emoji: string;
  color: string;
  born: number;
  clock: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeLabelTexture(emoji), [emoji]);

  useFrame(() => {
    const g = grp.current;
    if (!g) return;
    const age = Math.max(0, clock - born);
    g.position.y = position[1] + age * 1.4;
    const s = (0.5 + Math.min(1, age * 5) * 0.5) * (1 - Math.min(1, age / 1.1));
    g.scale.setScalar(Math.max(0.0001, s));
  });

  return (
    <group ref={grp} position={position}>
      <Sparkles count={12} scale={1.2} size={5} speed={0.8} color={color} />
      <sprite scale={[0.7, 0.7, 1]} renderOrder={12}>
        <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}

// ---------------------------------------------------------------------------
// WishTree — a soft glowing aura + crown of sparkles that blooms over the
// forest's heart once EVERY friend has been helped. The big finale payoff.
// ---------------------------------------------------------------------------
export function WishTree({
  position,
  color,
  on,
  clock,
}: {
  position: [number, number, number];
  color: string;
  on: boolean;
  clock: number;
}) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ring.current) return;
    const m = ring.current.material as THREE.MeshBasicMaterial;
    const want = on ? 0.4 + Math.sin(clock * 2) * 0.15 : 0;
    m.opacity += (want - m.opacity) * Math.min(1, dt * 3);
    ring.current.rotation.z += dt * 0.3;
  });
  if (!on) return null;
  return (
    <group position={position}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[2.2, 3.2, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <Sparkles count={40} scale={6} size={8} speed={0.5} color={color} position={[0, 2.2, 0]} />
    </group>
  );
}
