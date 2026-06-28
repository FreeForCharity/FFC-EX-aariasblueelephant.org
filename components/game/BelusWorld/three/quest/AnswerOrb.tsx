// ---------------------------------------------------------------------------
// An answer orb — the embodied replacement for a flashcard. It's a real glowing
// object in the world that shows a picture (and word). The child either WALKS
// Belu into it or taps it. Choosing right makes it bloom and rise; choosing
// "not yet" just gives it a gentle wobble (never a buzzer, never a fail).
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';

export type OrbStatus = 'idle' | 'right' | 'wrong' | 'chosen';

interface Props {
  position: [number, number, number];
  emoji: string;
  caption?: string;
  color: string;
  status: OrbStatus;
  /** a phase offset so a row of orbs doesn't bob in lockstep */
  bobSeed?: number;
  onPick: () => void;
}

export default function AnswerOrb({ position, emoji, caption, color, status, bobSeed = 0, onPick }: Props) {
  const grp = useRef<THREE.Group>(null);
  const sphere = useRef<THREE.Mesh>(null);
  const t = useRef(bobSeed);
  const shake = useRef(0);
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
      // idle bob
      const bob = Math.sin(t.current * 2) * 0.12;
      grp.current.position.y = baseY + bob;
      let x = position[0];
      if (shake.current > 0) {
        shake.current = Math.max(0, shake.current - dt);
        x += Math.sin(t.current * 40) * shake.current * 0.4;
      }
      grp.current.position.x = x;
      grp.current.scale.setScalar(1);
    }

    if (sphere.current) {
      const m = sphere.current.material as THREE.MeshStandardMaterial;
      const want = status === 'idle' ? 0.7 : 1.4;
      m.emissiveIntensity += (want - m.emissiveIntensity) * Math.min(1, dt * 6);
    }
  });

  return (
    <group ref={grp} position={position}>
      {/* the glowing orb body — the thing you walk into / tap */}
      <mesh
        ref={sphere}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPick();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[0.95, 24, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          roughness={0.25}
          metalness={0.1}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* picture + word, always facing the camera */}
      <sprite position={[0, 0, 0]} scale={[1.7, 1.7, 1]}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
      {/* soft glow ring under it on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
        <ringGeometry args={[0.7, 1.0, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
