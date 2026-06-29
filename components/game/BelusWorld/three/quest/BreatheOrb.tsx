// ---------------------------------------------------------------------------
// The breathing bubble for Calm Cove. A big gentle orb that grows as you
// breathe in, holds, and shrinks as you breathe out — Belu breathes along with
// it. It runs a set number of calm cycles and then quietly finishes. No taps,
// no pressure: just follow the bubble. As it breathes, the whole cove settles.
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';

interface Phase {
  label: string;
  dur: number;
  scale: number;
}
const PHASES: Phase[] = [
  { label: 'Breathe in…', dur: 4, scale: 1.7 },
  { label: 'Hold gently…', dur: 2, scale: 1.7 },
  { label: 'Breathe out…', dur: 4, scale: 0.85 },
];

interface Props {
  position: [number, number, number];
  cycles: number;
  color: string;
  reduceMotion?: boolean;
  /** called once when all cycles are complete */
  onDone: () => void;
  /** called when a phase begins, so Belu can say the cue aloud */
  onPhase?: (label: string) => void;
}

export default function BreatheOrb({ position, cycles, color, reduceMotion, onDone, onPhase }: Props) {
  const orb = useRef<THREE.Mesh>(null);
  const phaseIdx = useRef(0);
  const phaseT = useRef(0);
  const cyclesDone = useRef(0);
  const finished = useRef(false);
  const curScale = useRef(0.85);
  const labelRef = useRef<THREE.Sprite>(null);
  const lastLabel = useRef('');

  const textures = useMemo(
    () => PHASES.map((p) => makeLabelTexture('🫧', p.label, true)),
    [],
  );

  // speed factor: reduce-motion slows the breath a touch (even calmer)
  const speed = reduceMotion ? 0.8 : 1;

  useFrame((_, dt) => {
    if (finished.current) return;
    const idx = phaseIdx.current;
    const phase = PHASES[idx];

    if (phaseT.current === 0 && lastLabel.current !== phase.label) {
      lastLabel.current = phase.label;
      onPhase?.(phase.label);
      if (labelRef.current) {
        (labelRef.current.material as THREE.SpriteMaterial).map = textures[idx];
        (labelRef.current.material as THREE.SpriteMaterial).needsUpdate = true;
      }
    }

    phaseT.current += dt * speed;
    const k = Math.min(1, phaseT.current / phase.dur);
    const fromScale = idx === 0 ? 0.85 : PHASES[idx - 1].scale;
    const eased = 0.5 - 0.5 * Math.cos(k * Math.PI); // smooth in-out
    curScale.current = fromScale + (phase.scale - fromScale) * eased;

    if (orb.current) {
      orb.current.scale.setScalar(curScale.current);
      const m = orb.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.6 + curScale.current * 0.4;
    }

    if (phaseT.current >= phase.dur) {
      phaseT.current = 0;
      phaseIdx.current = (idx + 1) % PHASES.length;
      if (phaseIdx.current === 0) {
        cyclesDone.current += 1;
        if (cyclesDone.current >= cycles) {
          finished.current = true;
          onDone();
        }
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={orb}>
        <sphereGeometry args={[1.1, 32, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.5}
        />
      </mesh>
      <sprite ref={labelRef} position={[0, 2.6, 0]} scale={[2.4, 2.4, 1]}>
        <spriteMaterial map={textures[0]} transparent depthWrite={false} />
      </sprite>
      <pointLight color={color} intensity={2} distance={10} />
    </group>
  );
}
