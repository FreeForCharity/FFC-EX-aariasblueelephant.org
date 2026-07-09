// ---------------------------------------------------------------------------
// A little world friend. Nilu walks up to these creatures to learn with them.
// One component renders ANY character — the face is an emoji sprite, so a fox,
// a bunny, a happy child or a worried one are all just a different face + mood.
// The mood drives a gentle body animation (a sad friend slumps, an excited one
// bounces) and an optional floating thought bubble shows what they feel or want.
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';
import { queueWalkTo } from '../input';

export type Mood =
  | 'neutral' | 'happy' | 'excited' | 'proud' | 'calm'
  | 'sad' | 'disappointed' | 'scared' | 'surprised' | 'angry' | 'frustrated';

interface Props {
  position: [number, number, number];
  /** the character's face, e.g. '🦊' or '😊' */
  face: string;
  mood: Mood;
  color: string;
  /** floating thought bubble content (what they feel / want), or null */
  thought?: { emoji: string; caption?: string } | null;
  /** show a gentle "come learn with me" sparkle ring (quest available) */
  beckon?: boolean;
  /** small phase offset so a group of NPCs don't move in sync */
  seed?: number;
}

export default function QuestNPC({ position, face, mood, color, thought, beckon, seed = 0 }: Props) {
  const body = useRef<THREE.Group>(null);
  const t = useRef(seed);
  const faceTex = useMemo(() => makeLabelTexture(face), [face]);
  const thoughtTex = useMemo(
    () => (thought ? makeLabelTexture(thought.emoji, thought.caption, true) : null),
    [thought],
  );

  useFrame((_, dt) => {
    t.current += dt;
    const g = body.current;
    if (!g) return;
    const time = t.current;
    // mood → motion
    switch (mood) {
      case 'excited':
        g.position.y = Math.abs(Math.sin(time * 6)) * 0.35;
        g.rotation.z = Math.sin(time * 12) * 0.05;
        break;
      case 'happy':
      case 'proud':
        g.position.y = Math.abs(Math.sin(time * 3)) * 0.18;
        g.rotation.z = 0;
        break;
      case 'sad':
      case 'disappointed':
        g.position.y = -0.12 + Math.sin(time * 1.2) * 0.02;
        g.rotation.z = Math.sin(time * 0.8) * 0.03;
        break;
      case 'scared':
      case 'surprised':
        g.position.y = 0.02 + Math.sin(time * 22) * 0.02;
        g.rotation.z = Math.sin(time * 30) * 0.02;
        break;
      case 'angry':
      case 'frustrated':
        g.position.x = position[0] + Math.sin(time * 18) * 0.05;
        g.position.y = Math.sin(time * 4) * 0.05;
        break;
      default: // neutral / calm
        g.position.y = Math.sin(time * 1.6) * 0.07;
        g.rotation.z = 0;
    }
  });

  const slump = mood === 'sad' || mood === 'disappointed';

  return (
    <group position={position}>
      <group ref={body}>
        {/* rounded body — a tap walks Nilu straight up to this friend */}
        <mesh
          castShadow
          position={[0, 0.55, 0]}
          scale={[0.95, slump ? 0.85 : 1, 0.95]}
          onPointerDown={(e) => {
            e.stopPropagation();
            queueWalkTo(position[0], position[2]);
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <sphereGeometry args={[0.7, 24, 18]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* belly */}
        <mesh position={[0, 0.4, 0.45]} scale={[0.7, 0.6, 0.5]}>
          <sphereGeometry args={[0.55, 20, 14]} />
          <meshStandardMaterial color="#fff7ef" roughness={0.7} />
        </mesh>
        {/* two little ears / bumps */}
        <mesh position={[-0.35, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.2, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.35, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.2, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* feet */}
        <mesh position={[-0.3, 0.02, 0.2]}>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0.3, 0.02, 0.2]}>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* face */}
        <sprite position={[0, 0.7, 0.62]} scale={[0.95, 0.95, 1]} renderOrder={11}>
          <spriteMaterial map={faceTex} transparent depthWrite={false} depthTest={false} />
        </sprite>
      </group>

      {/* thought bubble */}
      {thoughtTex && (
        <group position={[0.6, 2.0, 0]}>
          <sprite scale={[1.5, 1.5, 1]} renderOrder={12}>
            <spriteMaterial map={thoughtTex} transparent depthWrite={false} depthTest={false} />
          </sprite>
          <mesh position={[-0.55, -0.7, 0]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
          <mesh position={[-0.75, -1.0, 0]}>
            <sphereGeometry args={[0.08, 12, 10]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
        </group>
      )}

      {/* beckon ring — a soft "learn with me" glow on the ground */}
      {beckon && <BeckonRing color={color} />}
    </group>
  );
}

function BeckonRing({ color }: { color: string }) {
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (ring.current) {
      const s = 1 + Math.sin(t.current * 2) * 0.12;
      ring.current.scale.set(s, s, s);
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.3 + Math.sin(t.current * 2) * 0.12;
    }
  });
  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[0.9, 1.25, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
    </mesh>
  );
}
