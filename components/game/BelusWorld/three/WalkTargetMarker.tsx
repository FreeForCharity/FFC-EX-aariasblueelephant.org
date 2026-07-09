// ---------------------------------------------------------------------------
// Tap-to-walk ground marker. A small accent ring that appears wherever the
// child last tapped (ground, an orb, an item, a pad, an NPC, a start sign) so
// it's always visible where Nilu is heading — the same trust-building cue as
// the answer-orb "tap me" ring. Gently pulses; static (no pulse) when
// reduceMotion is on. Reads the shared `input.walkTarget` channel directly
// (module-level, like HelpBeacon reads quest state) so it needs no props from
// the reward/pause React tree.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { input } from './input';
import { sampleGround } from './worldMath';

export default function WalkTargetMarker({ reduceMotion }: { reduceMotion: boolean }) {
  const grp = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    const g = grp.current;
    const r = ring.current;
    if (!g || !r) return;
    const target = input.walkTarget;
    if (!target) {
      if (g.visible) g.visible = false;
      return;
    }
    g.visible = true;
    const gy = sampleGround(target.x, target.z).y;
    g.position.set(target.x, gy + 0.06, target.z);
    const mat = r.material as THREE.MeshBasicMaterial;
    if (reduceMotion) {
      r.scale.setScalar(1);
      mat.opacity = 0.55;
    } else {
      const pulse = (Math.sin(t.current * 4) + 1) / 2; // 0..1
      r.scale.setScalar(1 + pulse * 0.2);
      mat.opacity = 0.75 - pulse * 0.4;
    }
  });

  return (
    <group ref={grp} visible={false}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.72, 32]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
