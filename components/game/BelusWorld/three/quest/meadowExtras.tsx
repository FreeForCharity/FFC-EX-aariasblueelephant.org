// ---------------------------------------------------------------------------
// Feelings Meadow — extra delight (owner-only, imported solely by StoryLayer).
//   • Firefly: a hidden glowing sparkle scattered around the meadow. Walk Belu
//     near it and it POPS with sparkles + a chime, then becomes a little floating
//     star you've collected. Pure discovery joy — never required, never a fail.
//   • FloatingHeart: a heart that drifts up out of a friend you just helped — a
//     visible "your kindness counts" reward.
//   • KindnessTrail: a soft trail of glowing petals that grows as you help more
//     friends, so the child can SEE the meadow filling with their kindness.
// All emoji are <sprite> via makeLabelTexture with depthTest/Write off + high
// renderOrder, per the world rules. No Math.random / Date.now at any scope —
// callers pass an accumulated clock and a seed.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';

// deterministic 0..1 from a seed (no Math.random)
export function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// Firefly — a collectible sparkle that bobs in the meadow until found.
// ---------------------------------------------------------------------------
export function Firefly({
  position,
  found,
  seed = 0,
}: {
  position: [number, number, number];
  found: boolean;
  seed?: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const dot = useRef<THREE.Mesh>(null);
  const t = useRef(seed * 3.3);
  const phase = seeded(seed) * Math.PI * 2;

  useFrame((_, dt) => {
    t.current += dt;
    const g = grp.current;
    if (!g) return;
    if (found) {
      // collected: rise into a calm little floating star
      const targetY = position[1] + 1.6;
      g.position.y += (targetY - g.position.y) * Math.min(1, dt * 2.5);
      g.position.x = position[0] + Math.sin(t.current * 0.8 + phase) * 0.25;
      g.position.z = position[2] + Math.cos(t.current * 0.8 + phase) * 0.25;
      g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, 0.9, dt * 3));
    } else {
      // hidden: a gentle drifting glow inviting you over
      g.position.x = position[0] + Math.sin(t.current * 1.1 + phase) * 0.5;
      g.position.z = position[2] + Math.cos(t.current * 0.9 + phase) * 0.5;
      g.position.y = position[1] + Math.sin(t.current * 1.6 + phase) * 0.3;
      g.scale.setScalar(0.6 + Math.sin(t.current * 4 + phase) * 0.12);
    }
    if (dot.current) {
      const m = dot.current.material as THREE.MeshStandardMaterial;
      const want = found ? 1.4 : 0.9 + Math.sin(t.current * 5 + phase) * 0.4;
      m.emissiveIntensity += (want - m.emissiveIntensity) * Math.min(1, dt * 6);
    }
  });

  return (
    <group ref={grp} position={position}>
      <mesh ref={dot}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial
          color={found ? '#fff4b0' : '#fff7c2'}
          emissive={found ? '#ffd166' : '#ffe680'}
          emissiveIntensity={0.9}
          transparent
          opacity={0.95}
        />
      </mesh>
      <Sparkles
        count={found ? 10 : 6}
        scale={found ? 1.4 : 0.9}
        size={found ? 5 : 3}
        speed={0.5}
        color={found ? '#ffd166' : '#fff3b0'}
      />
      {found && (
        <sprite position={[0, 0.5, 0]} scale={[0.7, 0.7, 1]} renderOrder={12}>
          <spriteMaterial map={starTex()} transparent depthWrite={false} depthTest={false} />
        </sprite>
      )}
    </group>
  );
}

let _starTex: THREE.CanvasTexture | null = null;
function starTex(): THREE.CanvasTexture {
  if (!_starTex) _starTex = makeLabelTexture('⭐');
  return _starTex;
}

// ---------------------------------------------------------------------------
// FloatingHeart — drifts up out of a freshly-helped friend, then fades.
// `bornAt` is the clock time the friend was healed; `clock` is the live clock.
// ---------------------------------------------------------------------------
export function FloatingHeart({
  origin,
  bornAt,
  clock,
  seed = 0,
}: {
  origin: [number, number, number];
  bornAt: number;
  clock: number;
  seed?: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const sway = seeded(seed) * Math.PI * 2;
  useFrame(() => {
    const g = grp.current;
    if (!g) return;
    const age = clock - bornAt;
    const rise = Math.min(age * 0.9, 3.2);
    g.position.set(
      origin[0] + Math.sin(age * 1.5 + sway) * 0.4,
      origin[1] + 1.2 + rise,
      origin[2] + Math.cos(age * 1.2 + sway) * 0.3,
    );
    const fade = Math.max(0, 1 - age / 3.8);
    g.scale.setScalar(0.5 + fade * 0.5);
    const mat = (g.children[0] as THREE.Sprite)?.material as THREE.SpriteMaterial | undefined;
    if (mat) mat.opacity = fade;
  });
  return (
    <group ref={grp} position={origin}>
      <sprite scale={[0.9, 0.9, 1]} renderOrder={13}>
        <spriteMaterial map={heartTex()} transparent depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}

let _heartTex: THREE.CanvasTexture | null = null;
function heartTex(): THREE.CanvasTexture {
  if (!_heartTex) _heartTex = makeLabelTexture('💛');
  return _heartTex;
}

// ---------------------------------------------------------------------------
// A big gentle finale burst — a rainbow shimmer over the whole meadow once
// every friend has been helped. Calm, slow, never strobing.
// ---------------------------------------------------------------------------
export function MeadowFinale({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Sparkles count={60} scale={[16, 6, 16]} size={7} speed={0.4} color="#ffd166" />
      <Sparkles count={40} scale={[14, 5, 14]} size={6} speed={0.3} color="#ff8fc8" />
      <Sparkles count={40} scale={[12, 5, 12]} size={6} speed={0.3} color="#a78bfa" />
    </group>
  );
}
