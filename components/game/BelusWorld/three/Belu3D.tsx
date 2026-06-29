// ---------------------------------------------------------------------------
// Belu — the blue elephant, modelled from primitives so there's nothing to
// download. Soft rounded forms, big friendly eyes, expressive ears + trunk.
// All animation is driven by a mutable MotionRef the Player controller updates
// each frame (speed + airborne), so this component never re-renders mid-walk.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BeluEmotion } from '../BeluCharacter';
import type { EquippedCosmetics } from '../belu/progress';

export interface MotionRef {
  speed: number; // 0..1 how fast Belu is moving on the ground
  airborne: boolean;
  vy: number; // vertical velocity, for squash/stretch
}

interface Props {
  motion: React.MutableRefObject<MotionRef>;
  emotion: BeluEmotion;
  /** overall size from Belu's growth (0.7 baby → 1.15 grown) */
  growthScale?: number;
  /** 0 baby, 1 little, 2 big, 3 grown — gates visible features */
  growthStage?: number;
  /** cosmetics Belu is wearing */
  equipped?: EquippedCosmetics;
}

const BODY = '#5fa8e8';
const BODY_DARK = '#4a8fd0';
const BELLY = '#bfe0ff';
const EAR_IN = '#ffb3d9';
const CHEEK = '#ff9ec7';

// Emotion → eye + glow tuning. Kept gentle: ASD kids read big, clear shapes.
const EMOTION_GLOW: Record<BeluEmotion, string> = {
  happy: '#ffe27a',
  excited: '#ffd166',
  calm: '#9be7ff',
  curious: '#b8ff9b',
  sad: '#9fb8d6',
  scared: '#c9b8ff',
  overwhelmed: '#ffb3b3',
};

function Leg({ x, z, swing }: { x: number; z: number; swing: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = swing.current * (x + z > 0 ? 1 : -1);
  });
  return (
    <group position={[x, -0.55, z]} ref={ref}>
      <mesh castShadow position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.7, 16]} />
        <meshStandardMaterial color={BODY_DARK} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.72, 0]}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color="#cfd8e3" roughness={0.6} />
      </mesh>
    </group>
  );
}

export default function Belu3D({ motion, emotion, growthScale = 1, growthStage = 2, equipped }: Props) {
  const root = useRef<THREE.Group>(null);
  const bodyGrp = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const trunk = useRef<THREE.Group>(null);
  const legSwing = useRef(0);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    const m = motion.current;
    const sp = m.speed;
    const walkF = t.current * (6 + sp * 8);

    // leg swing amplitude scales with speed
    legSwing.current = Math.sin(walkF) * (0.15 + sp * 0.5);

    // body bob — gentle when idle, bouncier when walking
    if (bodyGrp.current) {
      const bob = Math.sin(walkF * 2) * (0.02 + sp * 0.08) + Math.sin(t.current * 1.4) * 0.02;
      bodyGrp.current.position.y = bob;
      bodyGrp.current.rotation.z = Math.sin(walkF) * sp * 0.04;
    }

    // ears flap — faster with speed, plus a slow idle drift
    const flap = Math.sin(walkF * 1.5) * (0.12 + sp * 0.35) + 0.25;
    if (earL.current) earL.current.rotation.y = -0.5 - flap;
    if (earR.current) earR.current.rotation.y = 0.5 + flap;

    // trunk sway
    if (trunk.current) {
      trunk.current.rotation.z = Math.sin(t.current * 1.8) * 0.12;
      trunk.current.rotation.x = -0.2 + Math.sin(t.current * 1.2) * 0.08;
    }

    // head: slight look-up when excited/curious, droop when sad
    if (head.current) {
      const tilt = emotion === 'sad' || emotion === 'overwhelmed' ? 0.18 : emotion === 'excited' ? -0.12 : 0;
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, tilt, 0.1);
    }

    // squash & stretch in the air
    if (root.current) {
      let sx = 1, sy = 1;
      if (m.airborne) {
        sy = 1 + Math.max(-0.12, Math.min(0.18, m.vy * 0.04));
        sx = 1 - (sy - 1) * 0.6;
      }
      root.current.scale.x = THREE.MathUtils.lerp(root.current.scale.x, sx, 0.3);
      root.current.scale.y = THREE.MathUtils.lerp(root.current.scale.y, sy, 0.3);
      root.current.scale.z = THREE.MathUtils.lerp(root.current.scale.z, sx, 0.3);
    }
  });

  const glow = EMOTION_GLOW[emotion];
  const eyeNarrow = emotion === 'happy' || emotion === 'excited';
  const eyeWide = emotion === 'scared' || emotion === 'curious' || emotion === 'overwhelmed';
  const eyeScaleY = eyeNarrow ? 0.6 : eyeWide ? 1.25 : 1;

  return (
   <group scale={growthScale}>
    <group ref={root}>
      <group ref={bodyGrp}>
        {/* main body */}
        <mesh castShadow position={[0, 0.1, 0]} scale={[1.15, 1, 1.35]}>
          <sphereGeometry args={[1, 22, 16]} />
          <meshStandardMaterial color={BODY} roughness={0.55} metalness={0.02} />
        </mesh>
        {/* belly */}
        <mesh position={[0, -0.35, 0.25]} scale={[0.95, 0.7, 1]}>
          <sphereGeometry args={[0.8, 24, 18]} />
          <meshStandardMaterial color={BELLY} roughness={0.6} />
        </mesh>

        {/* explorer's satchel — appears once Belu is all grown up */}
        {growthStage >= 3 && (
          <group position={[0.95, -0.1, 0]} rotation={[0, 0, -0.2]}>
            <mesh castShadow>
              <boxGeometry args={[0.35, 0.4, 0.5]} />
              <meshStandardMaterial color="#c98a4b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.05, 0.26]}>
              <boxGeometry args={[0.37, 0.18, 0.04]} />
              <meshStandardMaterial color="#a06a32" roughness={0.7} />
            </mesh>
          </group>
        )}

        {/* legs */}
        <Leg x={-0.6} z={0.55} swing={legSwing} />
        <Leg x={0.6} z={0.55} swing={legSwing} />
        <Leg x={-0.6} z={-0.55} swing={legSwing} />
        <Leg x={0.6} z={-0.55} swing={legSwing} />

        {/* tail */}
        <mesh position={[0, 0.1, -1.35]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.7, 8]} />
          <meshStandardMaterial color={BODY_DARK} />
        </mesh>

        {/* head */}
        <group ref={head} position={[0, 0.55, 1.0]}>
          <mesh castShadow scale={[1, 0.95, 0.9]}>
            <sphereGeometry args={[0.85, 22, 16]} />
            <meshStandardMaterial color={BODY} roughness={0.55} />
          </mesh>

          {/* forehead glow patch — subtle emotion tint */}
          <mesh position={[0, 0.45, 0.55]} scale={[0.5, 0.4, 0.2]}>
            <sphereGeometry args={[0.4, 16, 12]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.5} roughness={0.4} />
          </mesh>

          {/* ears */}
          <group ref={earL} position={[-0.8, 0.1, 0]}>
            <mesh castShadow scale={[0.25, 1, 1]} rotation={[0, 0, 0]} position={[-0.15, 0, 0]}>
              <sphereGeometry args={[0.6, 24, 18]} />
              <meshStandardMaterial color={BODY} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            <mesh scale={[0.18, 0.78, 0.78]} position={[-0.2, 0, 0.02]}>
              <sphereGeometry args={[0.6, 20, 16]} />
              <meshStandardMaterial color={EAR_IN} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          </group>
          <group ref={earR} position={[0.8, 0.1, 0]}>
            <mesh castShadow scale={[0.25, 1, 1]} position={[0.15, 0, 0]}>
              <sphereGeometry args={[0.6, 24, 18]} />
              <meshStandardMaterial color={BODY} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            <mesh scale={[0.18, 0.78, 0.78]} position={[0.2, 0, 0.02]}>
              <sphereGeometry args={[0.6, 20, 16]} />
              <meshStandardMaterial color={EAR_IN} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* cheeks */}
          <mesh position={[-0.42, -0.18, 0.62]} scale={[1, 0.8, 0.4]}>
            <sphereGeometry args={[0.18, 12, 10]} />
            <meshStandardMaterial color={CHEEK} roughness={0.7} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.42, -0.18, 0.62]} scale={[1, 0.8, 0.4]}>
            <sphereGeometry args={[0.18, 12, 10]} />
            <meshStandardMaterial color={CHEEK} roughness={0.7} transparent opacity={0.8} />
          </mesh>

          {/* eyes */}
          <group position={[-0.3, 0.12, 0.68]} scale={[1, eyeScaleY, 1]}>
            <mesh>
              <sphereGeometry args={[0.17, 20, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[0.02, 0, 0.12]}>
              <sphereGeometry args={[0.09, 16, 12]} />
              <meshStandardMaterial color="#26334d" roughness={0.2} />
            </mesh>
            <mesh position={[0.05, 0.05, 0.19]}>
              <sphereGeometry args={[0.03, 10, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
            </mesh>
          </group>
          <group position={[0.3, 0.12, 0.68]} scale={[1, eyeScaleY, 1]}>
            <mesh>
              <sphereGeometry args={[0.17, 20, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[-0.02, 0, 0.12]}>
              <sphereGeometry args={[0.09, 16, 12]} />
              <meshStandardMaterial color="#26334d" roughness={0.2} />
            </mesh>
            <mesh position={[0.01, 0.05, 0.19]}>
              <sphereGeometry args={[0.03, 10, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
            </mesh>
          </group>

          {/* trunk */}
          <group ref={trunk} position={[0, -0.35, 0.7]}>
            <mesh castShadow position={[0, -0.05, 0.05]} rotation={[0.4, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.17, 0.55, 16]} />
              <meshStandardMaterial color={BODY} roughness={0.55} />
            </mesh>
            <mesh castShadow position={[0, -0.42, 0.18]} rotation={[0.9, 0, 0]}>
              <cylinderGeometry args={[0.17, 0.14, 0.5, 16]} />
              <meshStandardMaterial color={BODY} roughness={0.55} />
            </mesh>
            <mesh castShadow position={[0, -0.66, 0.42]} rotation={[1.4, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.12, 0.4, 16]} />
              <meshStandardMaterial color={BODY_DARK} roughness={0.55} />
            </mesh>
            {/* nostril tip */}
            <mesh position={[0, -0.74, 0.62]}>
              <torusGeometry args={[0.08, 0.04, 10, 16]} />
              <meshStandardMaterial color={BODY_DARK} />
            </mesh>
          </group>

          {/* tusks — grow in as Belu grows up (baby has none) */}
          {growthStage >= 1 && (
            <>
              <mesh position={[-0.22, -0.45, 0.7]} rotation={[0.6, 0, 0.2]} scale={0.7 + growthStage * 0.15}>
                <coneGeometry args={[0.05, 0.28, 10]} />
                <meshStandardMaterial color="#fffaf0" roughness={0.3} />
              </mesh>
              <mesh position={[0.22, -0.45, 0.7]} rotation={[0.6, 0, -0.2]} scale={0.7 + growthStage * 0.15}>
                <coneGeometry args={[0.05, 0.28, 10]} />
                <meshStandardMaterial color="#fffaf0" roughness={0.3} />
              </mesh>
            </>
          )}

          {/* worn cosmetics on the head + face */}
          {equipped?.head && <HeadGear id={equipped.head} />}
          {equipped?.face && <FaceGear id={equipped.face} />}
        </group>

        {/* worn cosmetics on the back */}
        {equipped?.back && <BackGear id={equipped.back} />}
      </group>
    </group>
   </group>
  );
}

// --- worn cosmetics (procedural, nothing to download) -----------------------

function HeadGear({ id }: { id: string }) {
  if (id === 'cap') {
    return (
      <group position={[0, 0.82, 0.05]}>
        <mesh castShadow scale={[1, 0.62, 1]}>
          <sphereGeometry args={[0.52, 18, 12]} />
          <meshStandardMaterial color="#e8556b" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.04, 0.42]} rotation={[-0.25, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.06, 20, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#c8455a" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color="#ffd166" />
        </mesh>
      </group>
    );
  }
  if (id === 'bow') {
    return (
      <group position={[0.34, 0.78, 0.1]} rotation={[0, 0, -0.3]}>
        <mesh position={[-0.16, 0, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.16, 0.3, 12]} />
          <meshStandardMaterial color="#ff8fc8" roughness={0.5} />
        </mesh>
        <mesh position={[0.16, 0, 0]} rotation={[0, 0, -0.5 + Math.PI]}>
          <coneGeometry args={[0.16, 0.3, 12]} />
          <meshStandardMaterial color="#ff8fc8" roughness={0.5} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.09, 12, 10]} />
          <meshStandardMaterial color="#ff6fb5" />
        </mesh>
      </group>
    );
  }
  if (id === 'party') {
    return (
      <group position={[0, 0.95, 0.05]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <coneGeometry args={[0.34, 0.9, 18]} />
          <meshStandardMaterial color="#6c8cff" roughness={0.4} emissive="#6c8cff" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }
  if (id === 'crown') {
    return (
      <group position={[0, 0.9, 0.05]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.22, 7, 1, true]} />
          <meshStandardMaterial color="#ffcf33" metalness={0.7} roughness={0.25} emissive="#caa000" emissiveIntensity={0.2} side={THREE.DoubleSide} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.42, 0.18, Math.sin(a) * 0.42]}>
              <coneGeometry args={[0.07, 0.2, 8]} />
              <meshStandardMaterial color="#ffcf33" metalness={0.7} roughness={0.25} />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (id === 'wizard') {
    return (
      <group position={[0, 0.95, 0.05]}>
        <mesh castShadow position={[0, 0.45, 0]} rotation={[0.05, 0, 0.04]}>
          <coneGeometry args={[0.32, 1.2, 20]} />
          <meshStandardMaterial color="#3b3a8c" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.62, 24]} />
          <meshStandardMaterial color="#2c2b6e" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.05, 0.55, 0.28]}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.5} />
        </mesh>
      </group>
    );
  }
  return null;
}

function FaceGear({ id }: { id: string }) {
  if (id === 'glasses') {
    return (
      <group position={[0, 0.12, 0.78]}>
        <mesh position={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 18]} />
          <meshStandardMaterial color="#1c2433" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 18]} />
          <meshStandardMaterial color="#1c2433" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.22, 8]} />
          <meshStandardMaterial color="#1c2433" />
        </mesh>
      </group>
    );
  }
  return null;
}

function BackGear({ id }: { id: string }) {
  if (id === 'cape') {
    return (
      <mesh position={[0, 0.15, -0.95]} rotation={[0.22, 0, 0]} castShadow>
        <planeGeometry args={[1.5, 1.7, 6, 6]} />
        <meshStandardMaterial color="#e8395b" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
    );
  }
  if (id === 'wings') {
    return (
      <group position={[0, 0.3, -0.7]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.5 * s, 0, 0]} rotation={[0, s * 0.5, s * 0.3]} scale={[1, 1.4, 0.1]}>
            <sphereGeometry args={[0.5, 16, 12]} />
            <meshStandardMaterial color="#bfe7ff" transparent opacity={0.6} emissive="#9fd8ff" emissiveIntensity={0.3} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    );
  }
  return null;
}
