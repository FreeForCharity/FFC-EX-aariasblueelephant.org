// ---------------------------------------------------------------------------
// The world: assembles the floating islands, rainbow bridges and all the
// per-zone scenery from worldConfig. Stateless except for the "active zone"
// (which crystal is glowing because Nilu is near it).
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLAND_LIST, ISLANDS, BRIDGES, type ZoneId, type IslandDef } from './worldConfig';
import { BRIDGE_SEGMENTS } from './worldMath';
import { useFrame } from '@react-three/fiber';
import { Tree, Flower, Waterfall, Clouds, makeRng } from './Scenery';
import WorldLife from './WorldLife';
import { makeInfinityTexture } from './quest/emojiTexture';
import { queueWalkTo } from './input';

function Island({ isl }: { isl: IslandDef }) {
  return (
    <group position={[isl.cx, 0, isl.cz]}>
      {/* grass top — flat enough to stand on, top face at isl.top */}
      <mesh receiveShadow position={[0, isl.top - 0.7, 0]}>
        <cylinderGeometry args={[isl.radius, isl.radius * 0.94, 1.4, 48]} />
        <meshStandardMaterial color={isl.grass} roughness={0.85} />
      </mesh>
      {/* soft grassy rim cap so the edge reads round — this is the surface the
          camera actually sees from above, so it's also the tap-to-walk target:
          a tap anywhere on an island walks Nilu straight there (e.point is the
          real world-space hit, already guaranteed on walkable ground) */}
      <mesh
        position={[0, isl.top - 0.1, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          queueWalkTo(e.point.x, e.point.z);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
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

function RainbowBridges({ hiddenKey, isHidden }: { hiddenKey: string; isHidden: (z: ZoneId) => boolean }) {
  const planks = useMemo(() => {
    const all: { pos: [number, number, number]; rot: number; color: string; w: number }[] = [];
    BRIDGE_SEGMENTS.forEach((s, bi) => {
      if (isHidden(s.to)) return; // bridge to a locked island hasn't formed yet
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hiddenKey encodes everything isHidden reads
  }, [hiddenKey]);

  return (
    <group>
      {planks.map((p, i) => (
        <mesh
          key={i}
          position={p.pos}
          rotation={[0, p.rot, 0]}
          receiveShadow
          onPointerDown={(e) => {
            e.stopPropagation();
            queueWalkTo(e.point.x, e.point.z);
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
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

// Wraps the zone-specific decor with a visible "the island grew!" cue: a
// short accent-coloured sparkle burst the moment `bloom` ticks up (a level
// just finished), rather than the new decor simply existing on next render.
// Static and skipped entirely under reduce-motion so the growth still reads
// via the decor itself, without the extra flourish.
function ZoneDecor({ isl, bloom, reduceMotion = false }: { isl: IslandDef; bloom: number; reduceMotion?: boolean }) {
  const prevBloom = useRef(bloom);
  const [justGrew, setJustGrew] = useState(false);
  useEffect(() => {
    if (bloom > prevBloom.current) {
      prevBloom.current = bloom;
      if (reduceMotion) return;
      setJustGrew(true);
      const t = setTimeout(() => setJustGrew(false), 2000);
      return () => clearTimeout(t);
    }
    prevBloom.current = bloom;
  }, [bloom, reduceMotion]);

  return (
    <>
      <ZoneDecorContent isl={isl} bloom={bloom} />
      {justGrew && (
        <Sparkles
          count={36}
          scale={[isl.radius * 1.5, 3.2, isl.radius * 1.5]}
          size={5}
          speed={0.6}
          color={isl.accent}
          position={[isl.cx, isl.top + 1.4, isl.cz]}
        />
      )}
    </>
  );
}

function ZoneDecorContent({ isl, bloom }: { isl: IslandDef; bloom: number }) {
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
    // reads as a scenic backdrop and never blocks the spot where Nilu meets a
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
        {items.map((it, i) => (
          <mesh key={i} position={[bx * 0.7 + it.x * 0.4, y + 0.2, bz * 0.7 + it.z * 0.4]}>
            <dodecahedronGeometry args={[0.5 + it.r * 0.4, 0]} />
            <meshStandardMaterial color="#aeb8c4" roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  if (isl.id === 'school') {
    // a tiny schoolhouse (box + pyramid roof + bell) at the back edge, plus a
    // few book stacks that fill in with the bloom
    const len = Math.hypot(isl.cx, isl.cz) || 1;
    const bx = (isl.cx / len) * 4.5; // toward the far edge (away from home)
    const bz = (isl.cz / len) * 4.5;
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        <mesh position={[bx, y + 1.0, bz]}>
          <boxGeometry args={[2.6, 2.0, 2.2]} />
          <meshStandardMaterial color="#ffe0a3" roughness={0.8} />
        </mesh>
        <mesh position={[bx, y + 2.6, bz]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[2.1, 1.3, 4]} />
          <meshStandardMaterial color={isl.accent} roughness={0.7} />
        </mesh>
        <mesh position={[bx, y + 3.35, bz]}>
          <sphereGeometry args={[0.22, 12, 10]} />
          <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
        {/* book stacks */}
        {items.map((it, i) => (
          <group key={i} position={[it.x * 0.6, y, it.z * 0.6]}>
            <mesh position={[0, 0.09, 0]}>
              <boxGeometry args={[0.7, 0.18, 0.5]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.7} />
            </mesh>
            <mesh position={[0.05, 0.27, 0]} rotation={[0, 0.4, 0]}>
              <boxGeometry args={[0.6, 0.16, 0.45]} />
              <meshStandardMaterial color="#7cc6ff" roughness={0.7} />
            </mesh>
            <mesh position={[-0.04, 0.42, 0]} rotation={[0, -0.3, 0]}>
              <boxGeometry args={[0.5, 0.14, 0.4]} />
              <meshStandardMaterial color="#ff8fc8" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  if (isl.id === 'afternoon') {
    // after-school fun: a snack table, a ball and a kite on a string
    const len = Math.hypot(isl.cx, isl.cz) || 1;
    const bx = (isl.cx / len) * 4.0;
    const bz = (isl.cz / len) * 4.0;
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        {/* snack table */}
        <group position={[bx, y, bz]}>
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[1.0, 1.0, 0.12, 16]} />
            <meshStandardMaterial color="#caa46a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.14, 0.18, 0.6, 8]} />
            <meshStandardMaterial color="#9a5a3b" roughness={0.9} />
          </mesh>
          <mesh position={[0.3, 0.82, 0.1]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial color="#ff7b7b" roughness={0.5} />
          </mesh>
          <mesh position={[-0.3, 0.78, -0.15]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color="#ffd166" roughness={0.5} />
          </mesh>
        </group>
        {/* play ball — off to the side, clear of the answer-orb arc */}
        <mesh position={[3.4, y + 0.35, -2.2]}>
          <sphereGeometry args={[0.35, 16, 12]} />
          <meshStandardMaterial color={isl.accent} roughness={0.4} />
        </mesh>
        {/* kite on a string */}
        <group position={[-3.2, y, 1.6]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2.8, 6]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshStandardMaterial color={isl.accent} roughness={0.5} side={THREE.DoubleSide} emissive={isl.accent} emissiveIntensity={0.15} />
          </mesh>
        </group>
        {/* scattered toys — fill in with the bloom, same as every other zone */}
        {items.map((it, i) => (
          <mesh key={i} position={[it.x * 0.7, y + 0.2, it.z * 0.7]}>
            <boxGeometry args={[0.3 + it.r * 0.15, 0.3 + it.r * 0.15, 0.3 + it.r * 0.15]} />
            <meshStandardMaterial color={i % 2 ? '#fb7185' : '#ffd166'} roughness={0.6} />
          </mesh>
        ))}
      </group>
    );
  }
  if (isl.id === 'night') {
    // a cozy bed, a crescent moon on a pole, and two soft stars
    const len = Math.hypot(isl.cx, isl.cz) || 1;
    const bx = (isl.cx / len) * 4.2;
    const bz = (isl.cz / len) * 4.2;
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        {/* bed: base + pillow */}
        <group position={[bx, y, bz]}>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[2.4, 0.7, 1.4]} />
            <meshStandardMaterial color="#b8a5e8" roughness={0.8} />
          </mesh>
          <mesh position={[0.8, 0.82, 0]}>
            <boxGeometry args={[0.7, 0.24, 1.0]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        </group>
        {/* crescent moon on a pole (a bright sphere with an offset "bite"
            sphere in the island color reads as a crescent) */}
        <group position={[-2.8, y, 2.6]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 2.8, 8]} />
            <meshStandardMaterial color="#caa46a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 3.0, 0]}>
            <sphereGeometry args={[0.55, 16, 12]} />
            <meshStandardMaterial color="#ffe9a3" emissive="#ffe9a3" emissiveIntensity={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0.3, 3.15, 0.15]}>
            <sphereGeometry args={[0.42, 16, 12]} />
            <meshStandardMaterial color={isl.grass} roughness={0.9} />
          </mesh>
          <pointLight color="#ffe9a3" intensity={1.2} distance={9} position={[0, 3.0, 0]} />
        </group>
        {/* soft stars — fill in with the bloom, same as every other zone */}
        {items.map((it, i) => (
          <mesh key={i} position={[it.x * 0.5, y + 1.6 + it.r * 1.2, it.z * 0.5]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#fff4b0" emissive={isl.accent} emissiveIntensity={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>
    );
  }
  if (isl.id === 'shore') {
    // a beach: a driftwood sandcastle backdrop + scattered shells that fill in
    // with the bloom, same "island visibly grows" contract as every other zone
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        <group position={[isl.radius * 0.5, y, -isl.radius * 0.3]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.55, 0.7, 1.0, 12]} />
            <meshStandardMaterial color="#f2dfa9" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <coneGeometry args={[0.5, 0.5, 12]} />
            <meshStandardMaterial color="#e8c67a" roughness={0.9} />
          </mesh>
        </group>
        {items.map((it, i) => (
          <mesh key={i} position={[it.x, y + 0.03, it.z]} rotation={[-Math.PI / 2, 0, it.r * 6]}>
            <circleGeometry args={[0.28 + it.r * 0.14, 8]} />
            <meshStandardMaterial color={i % 2 ? '#ffb066' : '#ffffff'} roughness={0.6} />
          </mesh>
        ))}
      </group>
    );
  }
  if (isl.id === 'garden') {
    // Feelings Garden — dense flower BEDS in pinks (rows/clusters, not just
    // scattered singles like the meadow), plus a small trellis archway
    const palette = ['#ff8fc8', '#ffb3d9', '#ff6ba3', '#ffd6e8', '#f472b6'];
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        {/* trellis archway at the back edge */}
        <group position={[isl.radius * 0.45, y, -isl.radius * 0.35]}>
          <mesh position={[-0.8, 1.1, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2.2, 8]} />
            <meshStandardMaterial color="#caa46a" roughness={0.8} />
          </mesh>
          <mesh position={[0.8, 1.1, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2.2, 8]} />
            <meshStandardMaterial color="#caa46a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <torusGeometry args={[0.85, 0.08, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#caa46a" roughness={0.8} />
          </mesh>
        </group>
        {/* flower beds — small clustered patches instead of single stems */}
        {items.map((it, i) => (
          <group key={i} position={[it.x, y, it.z]}>
            {[0, 1, 2].map((k) => (
              <Flower
                key={k}
                position={[Math.cos(k * 2.1) * 0.35, 0, Math.sin(k * 2.1) * 0.35]}
                color={palette[(i + k) % palette.length]}
              />
            ))}
          </group>
        ))}
      </group>
    );
  }
  if (isl.id === 'deepforest') {
    // Deep Forest — denser, darker-green trees than Friendship Forest, plus
    // little mushroom clusters filling in with the bloom
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        {items.map((it, i) => (
          <Tree key={`t-${i}`} position={[it.x, y, it.z]} scale={0.9 + it.r * 0.7} leaf={i % 2 ? '#1f5c34' : '#245e2e'} />
        ))}
        {items.map((it, i) => (
          <group key={`m-${i}`} position={[it.x * 0.55, y, it.z * 0.55]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.24, 8]} />
              <meshStandardMaterial color="#f2e3c9" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <sphereGeometry args={[0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={i % 2 ? '#e8736b' : '#caa46a'} roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  if (isl.id === 'lagoon') {
    // Quiet Lagoon — a calm pool ringed with lily pads + tall reeds
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        <mesh position={[0, y + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[isl.radius * 0.6, 36]} />
          <meshStandardMaterial color="#3fb8c9" transparent opacity={0.82} roughness={0.1} metalness={0.15} emissive="#1f8a9c" emissiveIntensity={0.2} />
        </mesh>
        {items.map((it, i) => (
          <mesh key={`lily-${i}`} position={[it.x, y + 0.08, it.z]} rotation={[-Math.PI / 2, 0, it.r * 5]}>
            <circleGeometry args={[0.35 + it.r * 0.2, 10]} />
            <meshStandardMaterial color="#3fae5a" roughness={0.7} />
          </mesh>
        ))}
        {/* reeds around the rim */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          const rx = Math.cos(a) * isl.radius * 0.85;
          const rz = Math.sin(a) * isl.radius * 0.85;
          return (
            <group key={`reed-${i}`} position={[rx, y, rz]}>
              <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 1.8, 6]} />
                <meshStandardMaterial color="#2f7d4a" roughness={0.8} />
              </mesh>
              <mesh position={[0.08, 1.7, 0]} rotation={[0, 0, 0.3]}>
                <coneGeometry args={[0.12, 0.5, 6]} />
                <meshStandardMaterial color="#3fae5a" roughness={0.8} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }
  if (isl.id === 'bay') {
    // Treasure Bay — a beached boat hull, a treasure chest, and a leaning palm
    return (
      <group position={[isl.cx, 0, isl.cz]}>
        {/* boat hull */}
        <group position={[isl.radius * 0.45, y, -isl.radius * 0.3]} rotation={[0, 0.5, 0]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.9, 0.55, 0.9, 16, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#caa46a" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
            <meshStandardMaterial color="#9a5a3b" roughness={0.8} />
          </mesh>
          <mesh position={[0.35, 1.55, 0]} rotation={[0, 0, -0.2]}>
            <planeGeometry args={[0.8, 0.6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
        {/* treasure chest */}
        <group position={[-isl.radius * 0.4, y, isl.radius * 0.2]}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.7, 0.5, 0.5]} />
            <meshStandardMaterial color="#9a5a3b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.5, 16, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#caa46a" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.42, 0.26]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.6} roughness={0.3} />
          </mesh>
        </group>
        {/* leaning palm */}
        <group position={[0, y, isl.radius * 0.55]} rotation={[0, 0, 0.15]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 3.2, 8]} />
            <meshStandardMaterial color="#a5824f" roughness={0.85} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.5, 3.2, Math.sin(a) * 0.5]} rotation={[0.5, a, 0]}>
                <coneGeometry args={[0.25, 1.4, 4]} />
                <meshStandardMaterial color="#3fae5a" roughness={0.8} />
              </mesh>
            );
          })}
        </group>
        {/* scattered shells/gold — fill in with the bloom, same contract as shore */}
        {items.map((it, i) => (
          <mesh key={i} position={[it.x, y + 0.05, it.z]} rotation={[-Math.PI / 2, 0, it.r * 6]}>
            <circleGeometry args={[0.22 + it.r * 0.12, 8]} />
            <meshStandardMaterial color={i % 2 ? '#ffd166' : '#ffffff'} roughness={0.5} metalness={i % 2 ? 0.3 : 0} />
          </mesh>
        ))}
      </group>
    );
  }
  // cove — a calm pool + waterfall off the rim, with rocks filling in as
  // levels complete
  return (
    <group position={[isl.cx, 0, isl.cz]}>
      <mesh position={[0, y + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isl.radius * 0.55, 36]} />
        <meshStandardMaterial color="#4fc3e0" transparent opacity={0.8} roughness={0.1} metalness={0.2} emissive="#2a9fc0" emissiveIntensity={0.2} />
      </mesh>
      <Waterfall position={[0, y - 2.5, isl.radius - 0.5]} />
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, y + 0.2, it.z]}>
          <dodecahedronGeometry args={[0.4 + it.r * 0.4, 0]} />
          <meshStandardMaterial color="#8aa0b0" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// The multicolour autism-acceptance infinity symbol, floating over home as a
// gentle welcoming landmark (and a quiet nod to what Nilu's World is for).
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

export interface DayUnlocks {
  school: boolean;
  afternoon: boolean;
  night: boolean;
}

/** Which advanced sister islands have formed (see progress.ts isAdvancedZoneUnlocked). */
export interface AdvancedUnlocks {
  garden: boolean;
  deepforest: boolean;
  lagoon: boolean;
  bay: boolean;
}

interface Props {
  activeZone: ZoneId | null;
  reduceMotion: boolean;
  islandLevels: Partial<Record<ZoneId, number>>;
  /** has the reward island formed yet? (first level completed) */
  rainbowUnlocked: boolean;
  /** which Nilu's Day islands have formed */
  dayUnlocks: DayUnlocks;
  /** which advanced sister islands have formed */
  advancedUnlocks: AdvancedUnlocks;
}

export default function World({ activeZone, reduceMotion, islandLevels, rainbowUnlocked, dayUnlocks, advancedUnlocks }: Props) {
  // a locked island physically does not exist yet: no island, no decor, no bridge
  const isHidden = (z: ZoneId): boolean => {
    if (z === 'rainbow') return !rainbowUnlocked;
    if (z === 'school') return !dayUnlocks.school;
    if (z === 'afternoon') return !dayUnlocks.afternoon;
    if (z === 'night') return !dayUnlocks.night;
    if (z === 'garden') return !advancedUnlocks.garden;
    if (z === 'deepforest') return !advancedUnlocks.deepforest;
    if (z === 'lagoon') return !advancedUnlocks.lagoon;
    if (z === 'bay') return !advancedUnlocks.bay;
    return false;
  };
  const hiddenKey = `${rainbowUnlocked}-${dayUnlocks.school}-${dayUnlocks.afternoon}-${dayUnlocks.night}-${advancedUnlocks.garden}-${advancedUnlocks.deepforest}-${advancedUnlocks.lagoon}-${advancedUnlocks.bay}`;
  return (
    <group>
      <Clouds reduceMotion={reduceMotion} />
      <WorldLife reduceMotion={reduceMotion} />
      <RainbowBridges hiddenKey={hiddenKey} isHidden={isHidden} />
      {ISLAND_LIST.map((isl) => (isHidden(isl.id) ? null : <Island key={isl.id} isl={isl} />))}
      <HomeDecor />
      {rainbowUnlocked && <RainbowDecor />}
      {ISLAND_LIST.filter((i) => i.id !== 'home' && i.id !== 'rainbow' && !isHidden(i.id)).map((isl) => {
        const bloom = islandLevels[isl.id] ?? 0;
        return (
          <group key={isl.id}>
            <ZoneDecor isl={isl} bloom={bloom} reduceMotion={reduceMotion} />
            {bloom >= MAX_BLOOM && <Landmark isl={isl} />}
          </group>
        );
      })}
    </group>
  );
}

// The reward island's landmark decor — the big rainbow arch overhead. The
// PLAYABLE gear (bouncy dome, slide, balloons) lives in RainbowPlay.tsx, which
// owns the touch/bounce/pop interactions.
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
    </group>
  );
}
