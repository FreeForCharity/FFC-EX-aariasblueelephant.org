// ---------------------------------------------------------------------------
// Little 3D animal friends for the meadow — built from primitives (nothing to
// download) so the world looks real, not like emoji blobs. One component makes a
// fox, bunny, bear, bird or cat, and its BODY acts out the feeling: a scared
// one crouches and trembles, a sad one slumps, a happy one bounces. The child
// reads the emotion from the body language (the whole point of the island).
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type AnimalSpecies = 'fox' | 'bunny' | 'bear' | 'bird' | 'cat';
export type AnimalMood = 'scared' | 'sad' | 'lonely' | 'worried' | 'happy';

interface SpeciesCfg {
  body: string;
  belly: string;
  ear: 'pointy' | 'long' | 'round' | 'none';
  earInner: string;
  tail: 'bushy' | 'round' | 'long' | 'short' | 'none';
  tailColor: string;
  snout: boolean;
  beak: boolean;
  wings: boolean;
  scale: number;
}

const SPECIES: Record<AnimalSpecies, SpeciesCfg> = {
  fox: { body: '#e8843c', belly: '#fff3e0', ear: 'pointy', earInner: '#ffd9b8', tail: 'bushy', tailColor: '#e8843c', snout: true, beak: false, wings: false, scale: 1 },
  bunny: { body: '#dfe3ea', belly: '#ffffff', ear: 'long', earInner: '#ffd1e0', tail: 'round', tailColor: '#ffffff', snout: false, beak: false, wings: false, scale: 0.92 },
  bear: { body: '#9c6b4a', belly: '#c9a182', ear: 'round', earInner: '#7a5238', tail: 'none', tailColor: '#9c6b4a', snout: true, beak: false, wings: false, scale: 1.12 },
  bird: { body: '#6fb7ff', belly: '#dff0ff', ear: 'none', earInner: '', tail: 'short', tailColor: '#4f97df', snout: false, beak: true, wings: true, scale: 0.8 },
  cat: { body: '#b9c0cc', belly: '#ffffff', ear: 'pointy', earInner: '#ffd1e0', tail: 'long', tailColor: '#b9c0cc', snout: true, beak: false, wings: false, scale: 0.95 },
};

interface Props {
  species: AnimalSpecies;
  mood: AnimalMood;
  position: [number, number, number];
  seed?: number;
}

export default function Animal3D({ species, mood, position, seed = 0 }: Props) {
  const cfg = SPECIES[species];
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const t = useRef(seed);

  useFrame((_, dt) => {
    t.current += dt;
    const time = t.current;
    const g = root.current;
    if (!g) return;
    let y = 0;
    let rotZ = 0;
    let headTilt = 0;
    switch (mood) {
      case 'scared':
        y = -0.18 + Math.sin(time * 30) * 0.015; // crouched + tremble
        g.position.x = position[0] + Math.sin(time * 34) * 0.02;
        headTilt = -0.25;
        break;
      case 'sad':
        y = -0.1 + Math.sin(time * 1.4) * 0.02;
        headTilt = 0.4; // head drooped down
        rotZ = Math.sin(time * 0.7) * 0.03;
        break;
      case 'lonely':
        y = Math.sin(time * 1.1) * 0.04;
        headTilt = 0.25;
        rotZ = Math.sin(time * 0.6) * 0.05;
        break;
      case 'worried':
        y = Math.sin(time * 2.2) * 0.03;
        g.rotation.y = Math.sin(time * 1.3) * 0.25; // looking around
        headTilt = 0.1;
        break;
      default: // happy
        y = Math.abs(Math.sin(time * 5)) * 0.22;
        rotZ = Math.sin(time * 10) * 0.03;
        headTilt = -0.1;
    }
    g.position.y = position[1] + y;
    if (mood !== 'worried') g.rotation.y = 0;
    g.rotation.z = rotZ;
    if (head.current) head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, headTilt, 0.1);
    if (tail.current) tail.current.rotation.z = Math.sin(time * (mood === 'happy' ? 10 : 2)) * 0.4;
  });

  const eyeWide = mood === 'scared' || mood === 'worried';
  const eyeScaleY = mood === 'sad' || mood === 'lonely' ? 0.55 : eyeWide ? 1.25 : 1;

  return (
    <group ref={root} position={position} scale={cfg.scale}>
      {/* body */}
      <mesh castShadow position={[0, 0.5, 0]} scale={[1, 0.95, 1.15]}>
        <sphereGeometry args={[0.55, 22, 16]} />
        <meshStandardMaterial color={cfg.body} roughness={0.7} />
      </mesh>
      {/* belly */}
      <mesh position={[0, 0.38, 0.4]} scale={[0.7, 0.8, 0.5]}>
        <sphereGeometry args={[0.45, 18, 14]} />
        <meshStandardMaterial color={cfg.belly} roughness={0.75} />
      </mesh>
      {/* legs */}
      {[[-0.28, 0.28], [0.28, 0.28], [-0.28, -0.28], [0.28, -0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]}>
          <cylinderGeometry args={[0.12, 0.13, 0.28, 10]} />
          <meshStandardMaterial color={cfg.body} roughness={0.7} />
        </mesh>
      ))}
      {/* tail */}
      {cfg.tail !== 'none' && (
        <group ref={tail} position={[0, 0.45, -0.6]}>
          {cfg.tail === 'bushy' && (
            <mesh position={[0, 0.05, -0.2]} rotation={[0.6, 0, 0]}>
              <sphereGeometry args={[0.26, 14, 12]} />
              <meshStandardMaterial color={cfg.tailColor} roughness={0.8} />
            </mesh>
          )}
          {cfg.tail === 'round' && (
            <mesh position={[0, 0, -0.1]}>
              <sphereGeometry args={[0.16, 12, 10]} />
              <meshStandardMaterial color={cfg.tailColor} roughness={0.85} />
            </mesh>
          )}
          {cfg.tail === 'long' && (
            <mesh position={[0, 0.1, -0.25]} rotation={[0.8, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.09, 0.7, 8]} />
              <meshStandardMaterial color={cfg.tailColor} roughness={0.8} />
            </mesh>
          )}
          {cfg.tail === 'short' && (
            <mesh position={[0, 0, -0.12]} rotation={[0.5, 0, 0]}>
              <coneGeometry args={[0.18, 0.3, 8]} />
              <meshStandardMaterial color={cfg.tailColor} roughness={0.8} />
            </mesh>
          )}
        </group>
      )}

      {/* head */}
      <group ref={head} position={[0, 0.85, 0.32]}>
        <mesh castShadow>
          <sphereGeometry args={[0.42, 20, 16]} />
          <meshStandardMaterial color={cfg.body} roughness={0.7} />
        </mesh>

        {/* ears */}
        {cfg.ear === 'pointy' && [-1, 1].map((s) => (
          <mesh key={s} position={[0.22 * s, 0.4, 0]} rotation={[0, 0, -s * 0.2]}>
            <coneGeometry args={[0.14, 0.34, 10]} />
            <meshStandardMaterial color={cfg.body} roughness={0.7} />
          </mesh>
        ))}
        {cfg.ear === 'long' && [-1, 1].map((s) => (
          <mesh key={s} position={[0.16 * s, 0.5, 0]} rotation={[mood === 'scared' ? -0.6 : 0, 0, -s * 0.15]} scale={[0.5, 1.4, 0.5]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color={cfg.body} roughness={0.7} />
          </mesh>
        ))}
        {cfg.ear === 'round' && [-1, 1].map((s) => (
          <mesh key={s} position={[0.3 * s, 0.34, 0]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial color={cfg.body} roughness={0.7} />
          </mesh>
        ))}

        {/* snout / beak */}
        {cfg.snout && (
          <mesh position={[0, -0.05, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.13, 0.3, 12]} />
            <meshStandardMaterial color={cfg.belly} roughness={0.7} />
          </mesh>
        )}
        {cfg.snout && (
          <mesh position={[0, -0.05, 0.55]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color="#3a2a22" roughness={0.5} />
          </mesh>
        )}
        {cfg.beak && (
          <mesh position={[0, -0.02, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.1, 0.26, 8]} />
            <meshStandardMaterial color="#ffb74d" roughness={0.5} />
          </mesh>
        )}

        {/* eyes */}
        {[-1, 1].map((s) => (
          <group key={s} position={[0.16 * s, 0.08, 0.36]} scale={[1, eyeScaleY, 1]}>
            <mesh>
              <sphereGeometry args={[0.1, 14, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[0, mood === 'sad' ? -0.02 : 0, 0.07]}>
              <sphereGeometry args={[0.055, 12, 10]} />
              <meshStandardMaterial color="#26334d" />
            </mesh>
          </group>
        ))}

        {/* worried/sad brow */}
        {(mood === 'sad' || mood === 'worried' || mood === 'scared') && (
          <mesh position={[0, 0.22, 0.34]} rotation={[0, 0, 0]} scale={[0.5, 0.5, 0.5]}>
            <torusGeometry args={[0.12, 0.02, 6, 12, Math.PI]} />
            <meshStandardMaterial color="#3a2a22" />
          </mesh>
        )}
      </group>

      {/* wings (bird) */}
      {cfg.wings && [-1, 1].map((s) => (
        <mesh key={s} position={[0.45 * s, 0.5, 0]} rotation={[0, 0, s * 0.4]} scale={[0.18, 0.5, 0.9]}>
          <sphereGeometry args={[0.4, 12, 10]} />
          <meshStandardMaterial color={cfg.tailColor} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
