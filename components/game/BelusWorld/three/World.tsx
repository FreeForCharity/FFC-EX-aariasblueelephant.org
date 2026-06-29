// ---------------------------------------------------------------------------
// The world: assembles the floating islands, rainbow bridges and all the
// per-zone scenery from worldConfig. Stateless except for the "active zone"
// (which crystal is glowing because Belu is near it).
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ISLAND_LIST, ISLANDS, BRIDGES, type ZoneId, type IslandDef } from './worldConfig';
import { BRIDGE_SEGMENTS } from './worldMath';
import { useFrame } from '@react-three/fiber';
import { Tree, Flower, Waterfall, Clouds, makeRng } from './Scenery';
import WorldLife from './WorldLife';
import { makeInfinityTexture } from './quest/emojiTexture';

function Island({ isl }: { isl: IslandDef }) {
  return (
    <group position={[isl.cx, 0, isl.cz]}>
      {/* grass top — flat enough to stand on, top face at isl.top */}
      <mesh receiveShadow position={[0, isl.top - 0.7, 0]}>
        <cylinderGeometry args={[isl.radius, isl.radius * 0.94, 1.4, 48]} />
        <meshStandardMaterial color={isl.grass} roughness={0.85} />
      </mesh>
      {/* soft grassy rim cap so the edge reads round */}
      <mesh position={[0, isl.top - 0.1, 0]}>
        <cylinderGeometry args={[isl.radius * 0.99, isl.radius, 0.5, 48]} />
        <meshStandardMaterial color={isl.grass} roughness={0.85} />
      </mesh>
      {/* rocky underside spike */}
      <mesh position={[0, isl.top - 1.4 - isl.radius * 0.7, 0]}>
        <coneGeometry args={[isl.radius * 0.95, isl.radius * 1.7, 24]} />
        <meshStandardMaterial color={isl.rock} roughness={0.95} />
      </mesh>
      {/* a couple of boulders clinging to the underside */}
      <mesh position={[isl.radius * 0.5, isl.top - 2.2, isl.radius * 0.3]}>
        <dodecahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color={isl.rock} roughness={1} />
      </mesh>
      <mesh position={[-isl.radius * 0.4, isl.top - 2.8, -isl.radius * 0.4]}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color={isl.rock} roughness={1} />
      </mesh>
    </group>
  );
}

function RainbowBridges({ rainbowUnlocked }: { rainbowUnlocked: boolean }) {
  const planks = useMemo(() => {
    const all: { pos: [number, number, number]; rot: number; color: string; w: number }[] = [];
    BRIDGE_SEGMENTS.forEach((s, bi) => {
      if (s.to === 'rainbow' && !rainbowUnlocked) return; // bridge not formed yet
      const colors = BRIDGES[bi].colors;
      const SEGS = 14;
      const dx = s.bx - s.ax;
      const dz = s.bz - s.az;
      const rot = Math.atan2(dx, dz);
      for (let i = 0; i < SEGS; i++) {
        const t = (i + 0.5) / SEGS;
        const x = s.ax + dx * t;
        const z = s.az + dz * t;
        const y = s.ay + (s.by - s.ay) * t + Math.sin(t * Math.PI) * 0.8 - 0.15;
        all.push({ pos: [x, y, z], rot, color: colors[i % colors.length], w: s.halfWidth * 2 });
      }
    });
    return all;
  }, [rainbowUnlocked]);

  return (
    <group>
      {planks.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, p.rot, 0]} receiveShadow>
          <boxGeometry args={[p.w, 0.28, 1.3]} />
          <meshStandardMaterial
            color={p.color}
            roughness={0.5}
            emissive={p.color}
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

const MAX_BLOOM = 5;

function ZoneDecor({ isl, bloom }: { isl: IslandDef; bloom: number }) {
  const allItems = useMemo(() => {
    const rng = makeRng(isl.cx * 31 + isl.cz * 17 + 7);
    const out: { x: number; z: number; r: number }[] = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2;
      const r = (0.35 + rng() * 0.5) * isl.radius;
      out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, r: rng() });
    }
    return out;
  }, [isl]);

  // The island visibly fills in as the child completes its levels (the "bloom").
  const count = Math.max(1, Math.ceil((bloom / MAX_BLOOM) * allItems.length));
  const items = allItems.slice(0, count);
  const fullyBloomed = bloom >= MAX_BLOOM;
  const y = isl.top;

  if (isl.id === 'meadow') {
    const palette = ['#ff8fc8', '#ffd166', '#a78bfa', '#ff7b7b', '#6ee7b7'];
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        {items.map((it, i) => (
          <Flower key={i} position={[it.x, y, it.z]} color={palette[i % palette.length]} />
        ))}
        <Tree position={[isl.radius * 0.5, y, -isl.radius * 0.3]} scale={0.8} leaf="#7fd06a" />
      </group>
    );
  }
  if (isl.id === 'forest') {
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        {items.map((it, i) => (
          <Tree key={i} position={[it.x, y, it.z]} scale={0.7 + it.r * 0.6} leaf={i % 2 ? '#5fae54' : '#4f9e6a'} />
        ))}
      </group>
    );
  }
  if (isl.id === 'mountain') {
    // The peak sits at the BACK edge of the island (away from the bridge), so it
    // reads as a scenic backdrop and never blocks the spot where Belu meets a
    // friend and the answer orbs appear (which is the island centre, front side).
    const len = Math.hypot(isl.cx, isl.cz) || 1;
    const bx = (isl.cx / len) * 6.5; // toward the far edge (away from home)
    const bz = (isl.cz / len) * 6.5;
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        <mesh position={[bx, y + 2.0, bz]}>
          <coneGeometry args={[2.6, 5.0, 5]} />
          <meshStandardMaterial color="#9aa6b5" roughness={0.9} />
        </mesh>
        <mesh position={[bx, y + 3.7, bz]}>
          <coneGeometry args={[1.1, 1.5, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
        {items.slice(0, 3).map((it, i) => (
          <mesh key={i} position={[bx * 0.7 + it.x * 0.4, y + 0.2, bz * 0.7 + it.z * 0.4]}>
            <dodecahedronGeometry args={[0.5 + it.r * 0.4, 0]} />
            <meshStandardMaterial color="#aeb8c4" roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  // cove — a calm pool + waterfall off the rim
  return (
    <group position={[isl.cx, 0, isl.cz]}>
      <mesh position={[0, y + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isl.radius * 0.55, 36]} />
        <meshStandardMaterial color="#4fc3e0" transparent opacity={0.8} roughness={0.1} metalness={0.2} emissive="#2a9fc0" emissiveIntensity={0.2} />
      </mesh>
      <Waterfall position={[0, y - 2.5, isl.radius - 0.5]} />
      <mesh position={[-isl.radius * 0.55, y + 0.2, isl.radius * 0.3]}>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#8aa0b0" roughness={1} />
      </mesh>
    </group>
  );
}

// The multicolour autism-acceptance infinity symbol, floating over home as a
// gentle welcoming landmark (and a quiet nod to what Belu's World is for).
function AutismInfinity() {
  const grp = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeInfinityTexture(), []);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (grp.current) grp.current.position.y = 7.6 + Math.sin(t.current * 1.2) * 0.3;
  });
  return (
    <group ref={grp} position={[0, 7.6, 0]}>
      <sprite scale={[5, 2.5, 1]}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function HomeDecor() {
  const isl = ISLANDS.home;
  const y = isl.top;
  return (
    <group position={[isl.cx, 0, isl.cz]}>
      <AutismInfinity />
      {/* cozy hut */}
      <mesh position={[0, y + 0.9, -2]}>
        <boxGeometry args={[3, 1.8, 2.6]} />
        <meshStandardMaterial color="#ffe0a3" roughness={0.8} />
      </mesh>
      <mesh position={[0, y + 2.2, -2]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.4, 1.4, 4]} />
        <meshStandardMaterial color="#e8736b" roughness={0.7} />
      </mesh>
      <mesh position={[0, y + 0.55, -0.68]}>
        <boxGeometry args={[0.8, 1.1, 0.1]} />
        <meshStandardMaterial color="#9a5a3b" roughness={0.8} />
      </mesh>
      {/* welcome flowers + trees */}
      <Tree position={[3.5, y, 1]} scale={0.9} />
      <Tree position={[-3.8, y, 0.5]} scale={0.8} leaf="#6ec6a8" />
      <Flower position={[1.6, y, 2.2]} color="#ff8fc8" />
      <Flower position={[-1.6, y, 2.4]} color="#ffd166" />
      <Flower position={[0.4, y, 3]} color="#a78bfa" />
    </group>
  );
}

function Landmark({ isl }: { isl: IslandDef }) {
  // A glowing victory totem that appears once an island is fully bloomed —
  // a clear, permanent, ownable marker of mastery the child earned.
  return (
    <group position={[isl.cx, isl.top, isl.cz - isl.radius * 0.55]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 2.4, 8]} />
        <meshStandardMaterial color="#caa46a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color={isl.accent} emissive={isl.accent} emissiveIntensity={1.2} roughness={0.1} />
      </mesh>
      <pointLight color={isl.accent} intensity={2} distance={10} position={[0, 2.7, 0]} />
      {/* little flag */}
      <mesh position={[0.45, 1.9, 0]}>
        <boxGeometry args={[0.7, 0.45, 0.04]} />
        <meshStandardMaterial color={isl.accent} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

interface Props {
  activeZone: ZoneId | null;
  reduceMotion: boolean;
  islandLevels: Partial<Record<ZoneId, number>>;
  /** has the reward island formed yet? (first level completed) */
  rainbowUnlocked: boolean;
}

export default function World({ activeZone, reduceMotion, islandLevels, rainbowUnlocked }: Props) {
  return (
    <group>
      <Clouds reduceMotion={reduceMotion} />
      <WorldLife reduceMotion={reduceMotion} />
      <RainbowBridges rainbowUnlocked={rainbowUnlocked} />
      {ISLAND_LIST.map((isl) =>
        isl.id === 'rainbow' && !rainbowUnlocked ? null : <Island key={isl.id} isl={isl} />,
      )}
      <HomeDecor />
      {rainbowUnlocked && <RainbowDecor />}
      {ISLAND_LIST.filter((i) => i.id !== 'home' && i.id !== 'rainbow').map((isl) => {
        const bloom = islandLevels[isl.id] ?? 0;
        return (
          <group key={isl.id}>
            <ZoneDecor isl={isl} bloom={bloom} />
            {bloom >= MAX_BLOOM && <Landmark isl={isl} />}
          </group>
        );
      })}
    </group>
  );
}

// The reward island's playful decor — a free-play spot the child earns. A
// bouncy castle dome, a slide, balloons and a big rainbow arch overhead.
function RainbowDecor() {
  const isl = ISLANDS.rainbow;
  const y = isl.top;
  const arc = ['#ff6b6b', '#ffd166', '#7ec850', '#5fd0e0', '#8a7bff'];
  return (
    <group position={[isl.cx, 0, isl.cz]}>
      {/* big rainbow arch */}
      {arc.map((c, i) => (
        <mesh key={i} position={[0, y + 1.5, -1]} rotation={[0, 0, 0]}>
          <torusGeometry args={[5.2 - i * 0.45, 0.22, 10, 40, Math.PI]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.3} roughness={0.5} />
        </mesh>
      ))}
      {/* bouncy dome */}
      <mesh position={[-2.5, y + 0.6, 1]} scale={[1.4, 0.9, 1.4]}>
        <sphereGeometry args={[1.4, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff9ed8" roughness={0.5} />
      </mesh>
      {/* slide */}
      <mesh position={[2.8, y + 0.8, 1]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.9, 0.12, 2.6]} />
        <meshStandardMaterial color="#5fd0e0" roughness={0.4} />
      </mesh>
      {/* floating balloons */}
      {[['#ff6b6b', -3, 2.6], ['#ffd166', 3, 3.2], ['#8a7bff', 0.5, 3.6]].map((b, i) => (
        <mesh key={i} position={[b[1] as number, y + (b[2] as number), -2]}>
          <sphereGeometry args={[0.5, 14, 12]} />
          <meshStandardMaterial color={b[0] as string} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
