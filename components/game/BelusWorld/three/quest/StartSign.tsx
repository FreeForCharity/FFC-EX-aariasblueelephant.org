// ---------------------------------------------------------------------------
// The "come play when YOU'RE ready" invitation — now an UNMISSABLE 3D
// signpost: two wooden posts holding up a big bold "START ▶" board, gently
// bobbing, with a pulsing accent-coloured ring on the ground. The quest only
// begins when the child deliberately walks Nilu right up to it (consent).
// Replaces the old small "Play!" sprite, which read as decoration rather
// than an invitation.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { makeStartTexture } from './emojiTexture';
import { queueWalkTo } from '../input';

interface Props {
  /** where the sign board floats (above the host friend's head) */
  position: [number, number, number];
  /** where the pulsing "walk here" ring sits on the ground */
  ground: [number, number, number];
  color: string;
  reduceMotion?: boolean;
}

export default function StartSign({ position, ground, color, reduceMotion }: Props) {
  const sign = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const tex = useRef<THREE.CanvasTexture>(makeStartTexture(color));
  if ((tex.current as unknown as { __k?: string }).__k !== color) {
    tex.current = makeStartTexture(color);
    (tex.current as unknown as { __k?: string }).__k = color;
  }

  const postSpan = Math.max(0.6, position[1] - ground[1]);

  useFrame((_, dt) => {
    if (reduceMotion) return;
    t.current += dt;
    if (sign.current) {
      sign.current.position.y = position[1] + Math.sin(t.current * 1.8) * 0.22;
      sign.current.rotation.z = Math.sin(t.current * 2.4) * 0.06;
    }
    if (ring.current) {
      const s = 1 + Math.sin(t.current * 2) * 0.14;
      ring.current.scale.set(s, s, s);
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.32 + Math.sin(t.current * 2) * 0.14;
    }
  });

  return (
    <group>
      {/* two wooden posts holding the board up */}
      <mesh position={[ground[0] - 0.55, ground[1] + postSpan / 2, ground[2]]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, postSpan, 8]} />
        <meshStandardMaterial color="#a97c46" roughness={0.85} />
      </mesh>
      <mesh position={[ground[0] + 0.55, ground[1] + postSpan / 2, ground[2]]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, postSpan, 8]} />
        <meshStandardMaterial color="#a97c46" roughness={0.85} />
      </mesh>

      <group ref={sign} position={position}>
        {/* ~2x the old "Play!" sprite (was scale 1.7) so it reads as a real invite */}
        <sprite scale={[3.2, 1.6, 1]} renderOrder={12}>
          <spriteMaterial map={tex.current} transparent depthWrite={false} depthTest={false} />
        </sprite>
      </group>

      {!reduceMotion && (
        <Sparkles count={10} scale={2.2} size={4.5} speed={0.4} color={color} position={[ground[0], ground[1] + 1, ground[2]]} />
      )}

      {/* pulsing accent ring on the ground — static (still visible) when
          reduceMotion. Also the tap target: a tap walks Nilu straight to the
          sign; walking in (as usual) is what actually begins the quest. */}
      <mesh
        ref={ring}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[ground[0], ground[1] + 0.06, ground[2]]}
        onPointerDown={(e) => {
          e.stopPropagation();
          queueWalkTo(ground[0], ground[2]);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <ringGeometry args={[1.1, 1.55, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
