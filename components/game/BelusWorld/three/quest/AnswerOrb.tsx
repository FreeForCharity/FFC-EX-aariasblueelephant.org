// ---------------------------------------------------------------------------
// An answer orb — the embodied replacement for a flashcard. It's a real glowing
// object in the world that shows a picture (and word). The child either WALKS
// Nilu into it or taps it. Choosing right makes it bloom and rise; choosing
// "not yet" just gives it a gentle wobble (never a buzzer, never a fail).
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';
import { beluPos } from '../playerState';
import { queueWalkTo } from '../input';

const NEAR_DIST = 2.4; // matches QuestLayer PICK_RADIUS

export type OrbStatus = 'idle' | 'right' | 'wrong' | 'chosen';

interface Props {
  position: [number, number, number];
  emoji: string;
  caption?: string;
  color: string;
  status: OrbStatus;
  /** a phase offset so a row of orbs doesn't bob in lockstep */
  bobSeed?: number;
}

// Detect prefers-reduced-motion locally so the ring/pulse can respect it
// without QuestLayer needing to pass a new prop through.
const prefersReducedMotion =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

export default function AnswerOrb({ position, emoji, caption, color, status, bobSeed = 0 }: Props) {
  const grp = useRef<THREE.Group>(null);
  const sphere = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(bobSeed);
  const shake = useRef(0);
  const nearRef = useRef(false);
  const tex = useMemo(() => makeLabelTexture(emoji, caption), [emoji, caption]);

  useEffect(() => {
    if (status === 'wrong') shake.current = 0.5; // seconds of wobble
  }, [status]);

  useFrame((_, dt) => {
    t.current += dt;
    if (!grp.current) return;
    const baseY = position[1];

    if (status === 'right' || status === 'chosen') {
      // bloom: rise, grow, then the layer unmounts us
      grp.current.position.y += (baseY + 1.3 - grp.current.position.y) * Math.min(1, dt * 4);
      const s = grp.current.scale.x + (1.5 - grp.current.scale.x) * Math.min(1, dt * 5);
      grp.current.scale.setScalar(s);
      grp.current.rotation.y += dt * 3;
    } else {
      // is Nilu close enough to choose me? → swell + brighten so it's obvious
      const near =
        Math.hypot(beluPos.x - position[0], beluPos.z - position[2]) < NEAR_DIST;
      const targetScale = near ? 1.12 : 1;
      const s = grp.current.scale.x + (targetScale - grp.current.scale.x) * Math.min(1, dt * 8);
      // idle bob (a little livelier when Nilu is near)
      const bob = Math.sin(t.current * 2) * (near ? 0.2 : 0.12);
      grp.current.position.y = baseY + bob;
      let x = position[0];
      if (shake.current > 0) {
        shake.current = Math.max(0, shake.current - dt);
        x += Math.sin(t.current * 40) * shake.current * 0.4;
      }
      grp.current.position.x = x;
      grp.current.scale.setScalar(s);
      nearRef.current = near;
    }

    if (sphere.current) {
      const m = sphere.current.material as THREE.MeshStandardMaterial;
      const want = status !== 'idle' ? 1.9 : nearRef.current ? 1.6 : 1.1;
      m.emissiveIntensity += (want - m.emissiveIntensity) * Math.min(1, dt * 6);
    }

    // gentle pulsing "tappable" ring at the orb's base — a slow breathing
    // loop that invites a tap. Static (no pulse) when reduce-motion is on.
    if (ring.current) {
      const mat = ring.current.material as THREE.MeshBasicMaterial;
      if (prefersReducedMotion) {
        ring.current.scale.setScalar(1.1);
        mat.opacity = 0.3;
      } else {
        const cycle = (Math.sin(t.current * 1.4) + 1) / 2; // 0..1
        ring.current.scale.setScalar(1 + cycle * 0.25);
        mat.opacity = 0.5 - cycle * 0.35;
      }
    }
  });

  return (
    <group ref={grp} position={position}>
      {/* the glowing orb body — the thing you walk into / tap */}
      <mesh ref={sphere}>
        <sphereGeometry args={[0.6, 24, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
          roughness={0.25}
          metalness={0.1}
          transparent
          opacity={0.85}
          depthWrite
        />
      </mesh>
      {/* invisible, larger hit-target so an imprecise tap still lands — a tap
          walks Nilu straight to the orb (select-and-go); the actual pick only
          fires once she arrives via the normal walk-in proximity check in
          QuestLayer, so tapping from across the island can never pick from
          range. */}
      <mesh
        visible={false}
        onPointerDown={(e) => {
          e.stopPropagation();
          queueWalkTo(position[0], position[2]);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[1.1, 12, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
      </mesh>
      {/* picture + word — always on top of the bubble & facing the camera */}
      <sprite position={[0, 0.15, 0]} scale={[2.1, 2.1, 1]} renderOrder={10}>
        <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} />
      </sprite>
      {/* soft glow ring under it on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
        <ringGeometry args={[0.45, 0.66, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* pulsing "tap me" ring — a slow breathing loop inviting a tap */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.74, 0]}>
        <ringGeometry args={[0.68, 0.8, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
