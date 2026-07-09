// ---------------------------------------------------------------------------
// A carryable thing — floats on its pedestal until Nilu walks into it, then
// hovers just over her head (gently bobbing) while she carries it to the
// right numbered pad / table. Walking into a slot/table hands it off; the
// QuestLayer clears `carrying` and the item either disappears (placed) or
// this component simply resumes floating on its own pedestal (returned).
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';
import { beluPos } from '../playerState';
import { queueWalkTo } from '../input';

interface Props {
  pedestalPosition: [number, number, number];
  emoji: string;
  caption?: string;
  color: string;
  carrying: boolean;
  reduceMotion: boolean;
  bobSeed?: number;
  /** this is the NEXT thing the child should fetch — a small ⬇️ arrow hovers
   *  above it and it bounces a touch more, so "which one do I grab?" is
   *  always answerable at a glance (static arrow, no extra bounce under
   *  reduce-motion). */
  isNext?: boolean;
}

const HEAD_HEIGHT = 2.15;

export default function CarryItem({
  pedestalPosition, emoji, caption, color, carrying, reduceMotion, bobSeed = 0, isNext = false,
}: Props) {
  const grp = useRef<THREE.Group>(null);
  const arrow = useRef<THREE.Sprite>(null);
  const t = useRef(bobSeed);
  const tex = useMemo(() => makeLabelTexture(emoji, caption), [emoji, caption]);
  const arrowTex = useMemo(() => makeLabelTexture('⬇️'), []);

  useFrame((_, dt) => {
    t.current += dt;
    const g = grp.current;
    if (!g) return;
    if (carrying) {
      const bob = reduceMotion ? 0 : Math.sin(t.current * 3) * 0.1;
      g.position.set(beluPos.x, beluPos.y + HEAD_HEIGHT + bob, beluPos.z);
    } else {
      const bob = reduceMotion ? 0 : Math.sin(t.current * 2) * 0.14;
      g.position.set(pedestalPosition[0], pedestalPosition[1] + bob, pedestalPosition[2]);
    }
    // the "fetch this one next" arrow — a gentle bounce, or a static hover
    // under reduce-motion so it's never overlooked but never overwhelming
    if (arrow.current) {
      const bounce = reduceMotion ? 0 : Math.abs(Math.sin(t.current * 3)) * 0.18;
      arrow.current.position.y = 1.05 + bounce;
    }
  });

  return (
    <group ref={grp} position={pedestalPosition}>
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          // a tap walks Nilu to the pedestal precisely — the pick-up itself
          // still only happens via the normal walk-in proximity check
          queueWalkTo(pedestalPosition[0], pedestalPosition[2]);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[0.42, 20, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={carrying ? 1.5 : isNext ? 1.3 : 0.9}
          roughness={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
      <sprite position={[0, 0.1, 0]} scale={[1.5, 1.5, 1]} renderOrder={10}>
        <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} />
      </sprite>
      {!carrying && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.4, 0.56, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {!carrying && isNext && (
        <sprite ref={arrow} position={[0, 1.05, 0]} scale={[0.9, 0.9, 1]} renderOrder={12}>
          <spriteMaterial map={arrowTex} transparent depthWrite={false} depthTest={false} />
        </sprite>
      )}
    </group>
  );
}
