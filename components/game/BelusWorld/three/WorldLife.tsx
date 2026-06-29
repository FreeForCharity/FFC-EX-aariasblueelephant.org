// ---------------------------------------------------------------------------
// Ambient life — the little things that make the world feel ALIVE rather than
// staged: butterflies drifting over the meadow, birds wheeling slowly across
// the sky, dragonflies skimming the cove. All cheap emoji sprites on gentle
// looping paths. "Reduce motion" slows them right down for sensory comfort.
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLANDS } from './worldConfig';
import { makeLabelTexture } from './quest/emojiTexture';
import { makeRng } from './Scenery';

interface Flyer {
  emoji: string;
  cx: number;
  cy: number;
  cz: number;
  rx: number; // orbit radius x
  rz: number; // orbit radius z
  bob: number; // vertical bob amount
  speed: number;
  phase: number;
  size: number;
}

function buildFlyers(): Flyer[] {
  const rng = makeRng(4242);
  const out: Flyer[] = [];

  // butterflies over the meadow + forest, low and looping
  for (const z of ['meadow', 'forest'] as const) {
    const isl = ISLANDS[z];
    const n = z === 'meadow' ? 4 : 3;
    for (let i = 0; i < n; i++) {
      out.push({
        emoji: z === 'meadow' ? '🦋' : (i % 2 ? '🦋' : '🐝'),
        cx: isl.cx + (rng() - 0.5) * 6,
        cy: isl.top + 1.6 + rng() * 1.4,
        cz: isl.cz + (rng() - 0.5) * 6,
        rx: 1.2 + rng() * 2,
        rz: 1.2 + rng() * 2,
        bob: 0.3 + rng() * 0.5,
        speed: 0.4 + rng() * 0.5,
        phase: rng() * Math.PI * 2,
        size: 0.7 + rng() * 0.3,
      });
    }
  }

  // dragonflies skimming the cove water
  {
    const isl = ISLANDS.cove;
    for (let i = 0; i < 3; i++) {
      out.push({
        emoji: '🪰',
        cx: isl.cx + (rng() - 0.5) * 5,
        cy: isl.top + 0.8 + rng() * 0.6,
        cz: isl.cz + (rng() - 0.5) * 5,
        rx: 1.5 + rng() * 2.5,
        rz: 1.5 + rng() * 2.5,
        bob: 0.15,
        speed: 0.8 + rng() * 0.6,
        phase: rng() * Math.PI * 2,
        size: 0.55 + rng() * 0.2,
      });
    }
  }

  // birds wheeling high across the whole sky
  for (let i = 0; i < 3; i++) {
    out.push({
      emoji: '🐦',
      cx: (rng() - 0.5) * 30,
      cy: 16 + rng() * 6,
      cz: (rng() - 0.5) * 30,
      rx: 14 + rng() * 8,
      rz: 14 + rng() * 8,
      bob: 1.2,
      speed: 0.18 + rng() * 0.1,
      phase: rng() * Math.PI * 2,
      size: 1.1 + rng() * 0.4,
    });
  }

  return out;
}

export default function WorldLife({ reduceMotion }: { reduceMotion: boolean }) {
  const flyers = useMemo(buildFlyers, []);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const textures = useMemo(() => {
    const map = new Map<string, THREE.CanvasTexture>();
    for (const f of flyers) if (!map.has(f.emoji)) map.set(f.emoji, makeLabelTexture(f.emoji));
    return map;
  }, [flyers]);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt * (reduceMotion ? 0.35 : 1);
    const time = t.current;
    for (let i = 0; i < flyers.length; i++) {
      const s = refs.current[i];
      if (!s) continue;
      const f = flyers[i];
      const a = time * f.speed + f.phase;
      s.position.set(
        f.cx + Math.cos(a) * f.rx,
        f.cy + Math.sin(a * 1.7) * f.bob,
        f.cz + Math.sin(a) * f.rz,
      );
    }
  });

  return (
    <group>
      {flyers.map((f, i) => (
        <sprite
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[f.cx + f.rx, f.cy, f.cz]}
          scale={[f.size, f.size, 1]}
        >
          <spriteMaterial map={textures.get(f.emoji)} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}
