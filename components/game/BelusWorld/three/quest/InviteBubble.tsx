// ---------------------------------------------------------------------------
// The "come play when YOU'RE ready" invitation. Islands no longer auto-start
// their lesson: the host friend beckons with a floating ▶ bubble + a soft
// pulsing ring on the ground, and the quest only begins when the child
// deliberately walks Nilu right up to them. Approach = consent.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';

interface Props {
  /** where the ▶ bubble floats (above the host friend's head) */
  position: [number, number, number];
  /** where the pulsing "walk here" ring sits on the ground */
  ground: [number, number, number];
  color: string;
}

export default function InviteBubble({ position, ground, color }: Props) {
  const bubble = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const tex = useRef<THREE.CanvasTexture>(makeLabelTexture('▶️', 'Play!', true));

  useFrame((_, dt) => {
    t.current += dt;
    if (bubble.current) {
      bubble.current.position.y = position[1] + Math.sin(t.current * 1.8) * 0.22;
      // a gentle friendly "wave" sway, like the host is beckoning
      bubble.current.rotation.z = Math.sin(t.current * 2.4) * 0.08;
    }
    if (ring.current) {
      const s = 1 + Math.sin(t.current * 2) * 0.14;
      ring.current.scale.set(s, s, s);
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.28 + Math.sin(t.current * 2) * 0.12;
    }
  });

  return (
    <group>
      <group ref={bubble} position={position}>
        <sprite scale={[1.7, 1.7, 1]} renderOrder={12}>
          <spriteMaterial map={tex.current} transparent depthWrite={false} depthTest={false} />
        </sprite>
      </group>
      <Sparkles count={8} scale={2} size={4} speed={0.4} color={color} position={[ground[0], ground[1] + 1, ground[2]]} />
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[ground[0], ground[1] + 0.06, ground[2]]}>
        <ringGeometry args={[1.0, 1.4, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
