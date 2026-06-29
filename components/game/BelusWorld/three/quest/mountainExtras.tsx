// ---------------------------------------------------------------------------
// Morning Mountain — engagement extras (owned by MountainLayer only).
//   • MorningSun: a friendly sun that RISES across the sky and brightens with
//     every routine step the child finishes — the world visibly reacts to them.
//   • Nimbus: a sleepy little cloud companion that wakes up, blinks, bobs, and
//     cheers as the morning gets going (personality, idle animation).
//   • StepStone: a glowing footprint stepping-stone that lights up once its
//     step is done, so the walking route reads clearly and feels satisfying.
//   • StarSpark: a hidden collectible star that sparkles + can be walked into;
//     finding it pops a chime + burst (surprise/discovery delight).
// All primitives, no downloads. Determinism: callers pass an accumulated clock,
// never Date.now()/Math.random() at module/render scope.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// A tiny seeded value helper (deterministic) for gentle per-thing variation.
export function seeded(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ---------------------------------------------------------------------------
// MorningSun — climbs an arc as `progress` (0..1) grows. At 0 it sits low and
// sleepy-orange near the horizon; at 1 it's high and bright golden, beaming.
// ---------------------------------------------------------------------------
export function MorningSun({
  center,
  top,
  progress,
}: {
  center: [number, number];
  top: number;
  progress: number; // 0..1 across the routine
}) {
  const grp = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const rays = useRef<THREE.Group>(null);
  const t = useRef(0);
  const p = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    // ease toward the target progress so the sun glides up, never snaps
    p.current += (progress - p.current) * Math.min(1, dt * 2.2);
    const g = grp.current;
    if (!g) return;
    const e = p.current; // eased progress
    // arc: low-left at dawn → high-centre at full morning
    const angle = (0.12 + e * 0.76) * Math.PI; // 0.12π..0.88π over the sky
    const R = 16;
    g.position.set(center[0] - Math.cos(angle) * R, top + 3 + Math.sin(angle) * 13, center[1] - 9);
    if (core.current) {
      const m = core.current.material as THREE.MeshStandardMaterial;
      // sleepy orange → bright gold as the morning rises
      m.color.lerpColors(new THREE.Color('#ff9a52'), new THREE.Color('#ffe45e'), e);
      m.emissive.copy(m.color);
      m.emissiveIntensity = 0.6 + e * 0.9 + Math.sin(t.current * 2) * 0.05;
    }
    if (rays.current) {
      rays.current.rotation.z += dt * (0.15 + e * 0.5);
      const s = 0.7 + e * 0.6 + Math.sin(t.current * 3) * 0.03;
      rays.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={grp}>
      <mesh ref={core}>
        <sphereGeometry args={[1.8, 24, 18]} />
        <meshStandardMaterial color="#ff9a52" emissive="#ff9a52" emissiveIntensity={0.7} roughness={0.4} />
      </mesh>
      {/* spinning ray halo */}
      <group ref={rays}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.7, Math.sin(a) * 2.7, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[1.3, 0.22, 0.22]} />
              <meshBasicMaterial color="#ffe9a8" transparent opacity={0.8} />
            </mesh>
          );
        })}
      </group>
      <Sparkles count={18} scale={6} size={5} speed={0.3} color="#fff3c4" />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Nimbus — a sleepy cloud companion. Sleeps (eyes shut, gentle snore-bob) until
// `awake`, then blinks open, perks up, and bounces. `cheer` gives a quick hop.
// ---------------------------------------------------------------------------
export function Nimbus({
  position,
  awake,
  cheer,
  clock,
}: {
  position: [number, number, number];
  awake: boolean;
  cheer: boolean;
  clock: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const lid = useRef(0); // 1 = closed, 0 = open
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    const g = grp.current;
    if (!g) return;
    const target = awake ? 0 : 1;
    lid.current += (target - lid.current) * Math.min(1, dt * 6);
    // bob: slow sleepy float when asleep, livelier when awake, a hop on cheer
    const speed = awake ? 2.4 : 1.1;
    const amp = awake ? 0.16 : 0.08;
    const hop = cheer ? Math.abs(Math.sin(clock * 9)) * 0.45 : 0;
    g.position.y = position[1] + Math.sin(t.current * speed) * amp + hop;
    g.rotation.z = Math.sin(t.current * 0.8) * 0.05;
  });

  const eyeScaleY = Math.max(0.08, 1 - lid.current); // squashed = shut

  return (
    <group ref={grp} position={position}>
      {/* puffy cloud body: three blobs */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} emissive="#dbeafe" emissiveIntensity={awake ? 0.25 : 0.1} />
      </mesh>
      <mesh position={[0.6, -0.05, 0]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
      <mesh position={[-0.6, -0.05, 0]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
      {/* eyes (scale Y down to "close" them) */}
      <group position={[0, 0.12, 0.62]}>
        <mesh position={[-0.22, 0, 0]} scale={[1, eyeScaleY, 1]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshBasicMaterial color="#33415c" />
        </mesh>
        <mesh position={[0.22, 0, 0]} scale={[1, eyeScaleY, 1]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshBasicMaterial color="#33415c" />
        </mesh>
      </group>
      {/* rosy cheeks appear when awake */}
      {awake && (
        <>
          <mesh position={[-0.34, -0.05, 0.58]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color="#ffb3c6" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.34, -0.05, 0.58]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color="#ffb3c6" transparent opacity={0.8} />
          </mesh>
        </>
      )}
      {cheer && <Sparkles count={14} scale={2} size={5} speed={0.6} color="#ffd166" position={[0, 0.4, 0]} />}
    </group>
  );
}

// ---------------------------------------------------------------------------
// StepStone — a footprint pad on the ground that lights up once its step is
// done, drawing the walking route in glowing dots.
// ---------------------------------------------------------------------------
export function StepStone({
  position,
  lit,
  accent,
}: {
  position: [number, number, number];
  lit: boolean;
  accent: string;
}) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    if (!mat.current) return;
    const want = lit ? 0.9 : 0.12;
    mat.current.emissiveIntensity += (want - mat.current.emissiveIntensity) * Math.min(1, dt * 5);
  });
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.34, 18]} />
      <meshStandardMaterial
        ref={mat}
        color={lit ? '#7CFC9A' : accent}
        emissive={lit ? '#7CFC9A' : accent}
        emissiveIntensity={0.12}
        transparent
        opacity={lit ? 0.85 : 0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// StarSpark — a hidden collectible star. Spins + sparkles; on collect it does a
// quick pop-and-vanish (the layer stops rendering it). Pure visual; the layer
// handles the walk-into detection + chime.
// ---------------------------------------------------------------------------
export function StarSpark({
  position,
  collectedAt,
  clock,
}: {
  position: [number, number, number];
  collectedAt: number; // -99 if not collected
  clock: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const t = useRef(seeded(position[0] + position[2]) * 6);
  const collected = collectedAt > 0;
  useFrame((_, dt) => {
    t.current += dt;
    const g = grp.current;
    if (!g) return;
    g.rotation.y += dt * 1.8;
    g.position.y = position[1] + Math.sin(t.current * 2) * 0.18;
    if (collected) {
      const age = clock - collectedAt;
      const s = Math.max(0, 1 - age * 2.2); // shrink away over ~0.45s
      g.scale.setScalar(s);
    }
  });
  return (
    <group ref={grp} position={position}>
      {/* a simple 5-point star made of two crossed thin boxes + a core */}
      <mesh>
        <icosahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color="#ffe45e" emissive="#ffd166" emissiveIntensity={1.1} roughness={0.3} />
      </mesh>
      <Sparkles count={collected ? 24 : 12} scale={collected ? 2.4 : 1.1} size={6} speed={collected ? 0.9 : 0.4} color="#fff3c4" />
    </group>
  );
}
