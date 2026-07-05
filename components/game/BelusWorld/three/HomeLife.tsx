// ---------------------------------------------------------------------------
// Nilu's Home comes alive:
//   • Sparkle Jar — a glass jar by the hut that glows brighter as it fills with
//     the sparkles (and friendship petals) the child collects. Purely additive.
//   • Daily sparkle hunt — 3 hidden sparkles per island per REAL day, at
//     date-seeded spots. Finding one feeds the jar and yields a garden seed.
//   • Home garden — walk to the plot and tap to plant a seed. Each plant grows
//     exactly ONE visible stage per real day (sprout → leaves → bud → flower);
//     a flower attracts a butterfly that stays. Plants never wilt.
//   • Visit moment — once per real day, one date-seeded healed friend drops by
//     Home: a one-line memory, then linger close for a gentle pat and they
//     leave a petal for the jar.
// All persistence lives in belu/progress.ts; this component only renders +
// detects proximity (via the shared beluPos, never React state at 60fps).
// ---------------------------------------------------------------------------

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLANDS, ZONE_ISLANDS, type ZoneId } from './worldConfig';
import { beluPos, dynamicSolids } from './playerState';
import { Flower, makeRng } from './Scenery';
import { Firefly, GreetBurst, TrotGroup } from './quest/meadowExtras';
import { makeLabelTexture } from './quest/emojiTexture';
import Animal3D, { type AnimalSpecies } from './quest/Animal3D';
import { GARDEN_SLOTS, plantStage, type GardenPlant } from '../belu/progress';
import type { Sound } from '../belu/feedback';

const HOME = ISLANDS.home;
const SPARKLES_PER_ISLAND = 3;
const SPARKLE_FIND = 2.2; // walk this close to collect (same feel as firefly-find)
const JAR_POS: [number, number] = [HOME.cx + 2.4, HOME.cz - 2.8];
const PLOT: [number, number] = [HOME.cx - 3.2, HOME.cz + 3.6]; // garden plot centre
const PLOT_R = 2.0;
const PLANT_NEAR = 3.4; // Nilu must be this close for tap-to-plant
const SLOT_OFFSETS: [number, number][] = [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.8], [0.9, 0.8]];
const VISITOR_POS: [number, number] = [HOME.cx + 4.2, HOME.cz + 1.8];
const VISITOR_GREET = 4.0; // the friend recognises you from here
const VISITOR_PAT = 2.0; // linger this close…
const PAT_SECONDS = 2.0; // …for this long → a petal for the jar

// the once-a-day visit line, in each friend's own voice (flavor varies, the
// outcome never does)
const VISIT_LINES: Record<AnimalSpecies, string> = {
  fox: 'You helped me when I was scared! I never forgot. 🧡',
  bunny: 'You helped me when I was sad! Hop hop — my favorite friend! 💛',
  bear: 'You helped me when I was sad! Your hug still keeps me warm. 🤎',
  bird: 'You helped me when I was lonely! I flew all this way to see you. 💙',
  cat: 'You helped me when I was worried! Purr… I remembered you. 💜',
};

// which islands hide daily sparkles (every walkable lesson island + home)
const SPARKLE_ISLANDS: ZoneId[] = ['home', ...ZONE_ISLANDS];

export interface DailySparkleSpot {
  id: string;
  x: number;
  z: number;
  y: number;
}

/** Date-seeded hidden-sparkle spots — same spots all day, new spots tomorrow. */
export function dailySparkleSpots(dateKey: string): DailySparkleSpot[] {
  const out: DailySparkleSpot[] = [];
  for (const zone of SPARKLE_ISLANDS) {
    const isl = ISLANDS[zone];
    let h = 7;
    const s = `${dateKey}:${zone}`;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647;
    const rng = makeRng(h || 1);
    for (let i = 0; i < SPARKLES_PER_ISLAND; i++) {
      const a = rng() * Math.PI * 2;
      const r = (0.45 + rng() * 0.33) * isl.radius;
      out.push({
        id: `${zone}:${i}`,
        x: isl.cx + Math.cos(a) * r,
        z: isl.cz + Math.sin(a) * r,
        y: isl.top + 0.9,
      });
    }
  }
  return out;
}

interface Props {
  paused: boolean;
  dateKey: string;
  jarCount: number;
  seeds: number;
  garden: GardenPlant[];
  /** sparkle ids already found today */
  sparklesFound: string[];
  /** today's date-seeded visitor (a healed friend), or null */
  visitor: AnimalSpecies | null;
  speak: (line: string) => void;
  playSound: (kind: Sound) => void;
  onCollectSparkle: (id: string) => void;
  onPlant: () => void;
  onPetal: () => void;
}

export default function HomeLife({
  paused,
  dateKey,
  jarCount,
  seeds,
  garden,
  sparklesFound,
  visitor,
  speak,
  playSound,
  onCollectSparkle,
  onPlant,
  onPetal,
}: Props) {
  const [, force] = useState(0);
  const bump = () => force((v) => (v + 1) % 1_000_000);

  const claimed = useRef(new Set<string>()); // guards double-fires pre-save
  const spots = useMemo(() => {
    claimed.current.clear(); // a new day = a fresh hunt
    return dailySparkleSpots(dateKey);
  }, [dateKey]);
  const nearPlot = useRef(false);
  // visitor runtime (refs — no 60fps React state)
  const V = useRef({ clock: 0, greetedAt: -99, lingerStart: -1, patted: false, petalAt: -99, petalGiven: false });
  const frame = useRef<(dt: number) => void>(() => {});

  const canPlant = seeds > 0 && garden.length < GARDEN_SLOTS;

  frame.current = (dt: number) => {
    // the visitor is a solid little body Nilu walks around, not through
    dynamicSolids.homeLife = visitor
      ? [{ x: VISITOR_POS[0], z: VISITOR_POS[1], r: 1.0 }]
      : [];
    if (paused) return;
    const v = V.current;
    v.clock += dt;

    // ---- daily hidden sparkles ----
    for (const sp of spots) {
      if (sparklesFound.includes(sp.id) || claimed.current.has(sp.id)) continue;
      if (Math.hypot(beluPos.x - sp.x, beluPos.z - sp.z) < SPARKLE_FIND) {
        claimed.current.add(sp.id);
        onCollectSparkle(sp.id);
      }
    }

    // ---- garden plot proximity (drives the "tap to plant" bubble) ----
    const near = Math.hypot(beluPos.x - PLOT[0], beluPos.z - PLOT[1]) < PLANT_NEAR;
    if (near !== nearPlot.current) {
      nearPlot.current = near;
      bump();
    }

    // ---- today's visit moment ----
    if (visitor && !v.petalGiven) {
      const d = Math.hypot(beluPos.x - VISITOR_POS[0], beluPos.z - VISITOR_POS[1]);
      if (v.greetedAt < 0 && d < VISITOR_GREET) {
        v.greetedAt = v.clock;
        playSound('correct');
        speak(VISIT_LINES[visitor]);
        bump();
      }
      if (v.greetedAt >= 0 && !v.patted) {
        if (d < VISITOR_PAT) {
          if (v.lingerStart < 0) v.lingerStart = v.clock;
          if (v.clock - v.lingerStart >= PAT_SECONDS) {
            // the gentle pat lands → a petal for the jar
            v.patted = true;
            v.petalAt = v.clock;
            playSound('star');
            speak('A petal — for our jar! 🌸');
            bump();
          }
        } else {
          v.lingerStart = -1;
        }
      }
      // let the petal float for a moment, then bank it (visitor heads home)
      if (v.patted && !v.petalGiven && v.clock - v.petalAt > 1.6) {
        v.petalGiven = true;
        onPetal();
        bump();
      }
      // retire the greet hearts after their burst
      if (v.greetedAt >= 0 && v.clock - v.greetedAt > 2.2 && v.clock - v.greetedAt < 2.2 + dt * 2) {
        bump();
      }
    }
  };

  const v = V.current;
  const fill = Math.min(1, jarCount / 40); // the jar visibly brightens as it fills
  const plantTex = useRef<THREE.CanvasTexture>(makeLabelTexture('🌱', 'Tap to plant!', true));

  return (
    <group>
      <Ticker fnRef={frame} />

      {/* ---- today's hidden sparkles, across the islands ---- */}
      {spots.map((sp, i) =>
        sparklesFound.includes(sp.id) ? null : (
          <Firefly key={sp.id} position={[sp.x, sp.y, sp.z]} found={false} seed={i + 2} />
        ),
      )}

      {/* ---- the Sparkle Jar by the hut ---- */}
      <group position={[JAR_POS[0], HOME.top, JAR_POS[1]]}>
        {/* glass */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.42, 0.36, 1.05, 18, 1, true]} />
          <meshStandardMaterial
            color="#dff4ff"
            transparent
            opacity={0.35}
            roughness={0.05}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* cork lid */}
        <mesh position={[0, 1.14, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.16, 14]} />
          <meshStandardMaterial color="#caa46a" roughness={0.8} />
        </mesh>
        {/* the glowing light inside — grows + brightens with every sparkle */}
        <mesh position={[0, 0.25 + fill * 0.35, 0]}>
          <sphereGeometry args={[0.16 + fill * 0.2, 14, 12]} />
          <meshStandardMaterial
            color="#fff4b0"
            emissive="#ffd166"
            emissiveIntensity={0.4 + fill * 1.6}
            transparent
            opacity={0.95}
          />
        </mesh>
        <Sparkles
          count={2 + Math.round(fill * 14)}
          scale={[0.7, 1.0, 0.7]}
          size={4}
          speed={0.3}
          color="#ffd166"
          position={[0, 0.55, 0]}
        />
        {jarCount > 0 && <pointLight color="#ffd166" intensity={0.4 + fill * 2} distance={6} position={[0, 0.8, 0]} />}
      </group>

      {/* ---- the Home garden plot ---- */}
      <group position={[PLOT[0], HOME.top, PLOT[1]]}>
        {/* soil — tap it (when close, with a seed) to plant */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.04, 0]}
          onClick={() => {
            if (paused) return;
            if (nearPlot.current && canPlant) onPlant();
          }}
        >
          <circleGeometry args={[PLOT_R, 28]} />
          <meshStandardMaterial color="#8a6b4f" roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[PLOT_R, PLOT_R + 0.22, 28]} />
          <meshStandardMaterial color="#caa46a" roughness={0.9} />
        </mesh>

        {/* the invitation bubble when Nilu is close and holding a seed */}
        {nearPlot.current && canPlant && (
          <sprite position={[0, 2.0, 0]} scale={[1.7, 1.7, 1]} renderOrder={12}>
            <spriteMaterial map={plantTex.current} transparent depthWrite={false} depthTest={false} />
          </sprite>
        )}

        {/* the plants — each only ever GROWS, one stage per real day */}
        {garden.map((plant, i) => {
          const off = SLOT_OFFSETS[i % SLOT_OFFSETS.length];
          return (
            <GardenPlantView
              key={`${plant.plantedDate}-${i}`}
              position={[off[0], 0, off[1]]}
              stage={plantStage(plant.plantedDate, dateKey)}
              seed={i + 1}
            />
          );
        })}
      </group>

      {/* ---- today's visiting healed friend ---- */}
      {visitor && !v.petalGiven && (
        <group>
          <TrotGroup active={v.greetedAt >= 0 && v.clock - v.greetedAt < 2}>
            <Animal3D
              species={visitor}
              mood="happy"
              position={[VISITOR_POS[0], HOME.top, VISITOR_POS[1]]}
              seed={3.1}
            />
          </TrotGroup>
          {v.greetedAt >= 0 && v.clock - v.greetedAt < 2.2 && (
            <GreetBurst position={[VISITOR_POS[0], HOME.top + 1.0, VISITOR_POS[1]]} />
          )}
          {/* a soft "come say hi" shimmer until greeted */}
          {v.greetedAt < 0 && (
            <Sparkles count={10} scale={2.4} size={4} speed={0.4} color="#ff8fc8" position={[VISITOR_POS[0], HOME.top + 1.2, VISITOR_POS[1]]} />
          )}
          {/* the petal drifting toward the jar after the pat */}
          {v.patted && (
            <PetalDrift
              from={[VISITOR_POS[0], HOME.top + 1.2, VISITOR_POS[1]]}
              to={[JAR_POS[0], HOME.top + 0.8, JAR_POS[1]]}
            />
          )}
        </group>
      )}
    </group>
  );
}

// One garden plant: sprout → leaves → bud → flower (+ a butterfly that stays).
function GardenPlantView({ position, stage, seed }: { position: [number, number, number]; stage: number; seed: number }) {
  const stemH = 0.25 + stage * 0.18;
  return (
    <group position={position}>
      {/* stem */}
      <mesh position={[0, stemH / 2 + 0.04, 0]}>
        <cylinderGeometry args={[0.035, 0.05, stemH, 6]} />
        <meshStandardMaterial color="#5fae54" roughness={0.8} />
      </mesh>
      {/* stage 0: just a tiny sprout tip */}
      {stage === 0 && (
        <mesh position={[0, stemH + 0.08, 0]}>
          <coneGeometry args={[0.08, 0.16, 8]} />
          <meshStandardMaterial color="#7fd06a" roughness={0.7} />
        </mesh>
      )}
      {/* stage ≥ 1: little leaves */}
      {stage >= 1 && (
        <>
          <mesh position={[0.12, stemH * 0.6, 0]} scale={[1.4, 0.5, 0.8]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#6ec66a" roughness={0.7} />
          </mesh>
          <mesh position={[-0.12, stemH * 0.75, 0.03]} scale={[1.4, 0.5, 0.8]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#7fd06a" roughness={0.7} />
          </mesh>
        </>
      )}
      {/* stage 2: a closed bud */}
      {stage === 2 && (
        <mesh position={[0, stemH + 0.1, 0]} scale={[1, 1.25, 1]}>
          <sphereGeometry args={[0.11, 12, 10]} />
          <meshStandardMaterial color="#ff8fc8" roughness={0.6} emissive="#ff8fc8" emissiveIntensity={0.15} />
        </mesh>
      )}
      {/* stage 3: the open flower + its butterfly friend (it stays!) */}
      {stage >= 3 && (
        <>
          <group position={[0, stemH - 0.15, 0]} scale={1.3}>
            <Flower position={[0, 0, 0]} color={['#ff8fc8', '#ffd166', '#a78bfa', '#ff7b7b'][seed % 4]} />
          </group>
          <Butterfly center={[0, stemH + 0.75, 0]} seed={seed} />
        </>
      )}
    </group>
  );
}

// A tiny butterfly that circles its flower forever — self-animating.
function Butterfly({ center, seed }: { center: [number, number, number]; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const t = useRef(seed * 2.7);
  useFrame((_, dt) => {
    t.current += dt;
    const time = t.current;
    if (g.current) {
      g.current.position.set(
        center[0] + Math.cos(time * 0.9) * 0.45,
        center[1] + Math.sin(time * 1.7) * 0.12,
        center[2] + Math.sin(time * 0.9) * 0.45,
      );
      g.current.rotation.y = -time * 0.9 + Math.PI / 2;
    }
    const flap = Math.sin(time * 14) * 0.9;
    if (wingL.current) wingL.current.rotation.y = flap;
    if (wingR.current) wingR.current.rotation.y = -flap;
  });
  return (
    <group ref={g}>
      <mesh scale={[0.5, 1, 1]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color="#5a4632" roughness={0.8} />
      </mesh>
      <mesh ref={wingL} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.16, 0.12]} />
        <meshStandardMaterial color="#ffd166" roughness={0.6} side={THREE.DoubleSide} emissive="#ffd166" emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={wingR} position={[0, 0.01, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.16, 0.12]} />
        <meshStandardMaterial color="#ffb84d" roughness={0.6} side={THREE.DoubleSide} emissive="#ffb84d" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// The gifted petal drifting from the friend to the jar — self-animating.
function PetalDrift({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  const tex = useRef<THREE.CanvasTexture>(makeLabelTexture('🌸'));
  useFrame((_, dt) => {
    t.current += dt;
    const p = Math.min(1, t.current / 1.6);
    if (g.current) {
      g.current.position.set(
        from[0] + (to[0] - from[0]) * p,
        from[1] + (to[1] - from[1]) * p + Math.sin(p * Math.PI) * 1.2,
        from[2] + (to[2] - from[2]) * p,
      );
      const s = 0.8 * (1 - p * 0.4);
      g.current.scale.set(s, s, 1);
    }
  });
  return (
    <group ref={g} position={from}>
      <sprite renderOrder={13}>
        <spriteMaterial map={tex.current} transparent depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}

function Ticker({ fnRef }: { fnRef: React.MutableRefObject<(dt: number) => void> }) {
  useFrame((_, dt) => fnRef.current(Math.min(dt, 0.05)));
  return null;
}
