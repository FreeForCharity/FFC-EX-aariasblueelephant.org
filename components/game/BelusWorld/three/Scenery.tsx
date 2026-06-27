// ---------------------------------------------------------------------------
// Reusable scenery props: trees, flowers, clouds, waterfalls, the interaction
// crystal beacon. All procedural primitives — nothing to download.
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Tiny seeded RNG so island layouts are stable across renders (no hydration
// surprises, no flicker between frames).
export function makeRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function Tree({ position, scale = 1, leaf = '#5fae54' }: { position: [number, number, number]; scale?: number; leaf?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.18, 0.26, 1.4, 8]} />
        <meshStandardMaterial color="#8a5a3b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.85, 14, 10]} />
        <meshStandardMaterial color={leaf} roughness={0.8} />
      </mesh>
      <mesh position={[0.45, 2.1, 0.2]}>
        <sphereGeometry args={[0.55, 12, 8]} />
        <meshStandardMaterial color={leaf} roughness={0.8} />
      </mesh>
      <mesh position={[-0.4, 2.2, -0.1]}>
        <sphereGeometry args={[0.5, 12, 8]} />
        <meshStandardMaterial color={leaf} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Flower({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
        <meshStandardMaterial color="#5fae54" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.12, 0.42, Math.sin(a) * 0.12]}>
            <sphereGeometry args={[0.08, 10, 8]} />
            <meshStandardMaterial color={color} roughness={0.6} emissive={color} emissiveIntensity={0.12} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// A glowing crystal that hovers over a zone island — this is the "play here"
// beacon. It pulses brighter when Belu is near.
export function Crystal({ position, color, active }: { position: [number, number, number]; color: string; active: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (mesh.current) {
      mesh.current.rotation.y = t.current * 0.8;
      mesh.current.position.y = Math.sin(t.current * 1.6) * 0.25;
    }
  });
  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh ref={mesh}>
          <octahedronGeometry args={[active ? 0.85 : 0.7, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={active ? 1.4 : 0.8}
            roughness={0.1}
            metalness={0.3}
            transparent
            opacity={0.92}
          />
        </mesh>
      </Float>
      {/* the active crystal gets a real light; the others rely on emissive +
          bloom, so we never carry more than one dynamic point light at a time */}
      {active && <pointLight color={color} intensity={3} distance={12} position={[0, 0.5, 0]} />}
      <Sparkles count={active ? 14 : 6} scale={3} size={4} speed={0.4} color={color} position={[0, 0.5, 0]} />
      {/* base ring on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <ringGeometry args={[1.1, 1.5, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// A translucent waterfall sheet pouring off an island edge into mist below.
export function Waterfall({ position }: { position: [number, number, number] }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (mat.current) mat.current.opacity = 0.45 + Math.sin(t.current * 6) * 0.08;
  });
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[2.4, 6, 1, 1]} />
        <meshStandardMaterial
          ref={mat}
          color="#bfefff"
          emissive="#9fe6ff"
          emissiveIntensity={0.4}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          roughness={0.2}
        />
      </mesh>
      {/* mist puff at the bottom */}
      <mesh position={[0, -3, 0]}>
        <sphereGeometry args={[1.4, 16, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
      </mesh>
      <Sparkles count={10} scale={[2.4, 6, 1]} size={3} speed={1} color="#dffaff" />
    </group>
  );
}

// Slow-drifting cloud puffs scattered under and around the islands.
export function Clouds({ reduceMotion }: { reduceMotion: boolean }) {
  const grp = useRef<THREE.Group>(null);
  const puffs = useMemo(() => {
    const rng = makeRng(91);
    return Array.from({ length: 14 }, () => ({
      x: (rng() - 0.5) * 120,
      y: -6 - rng() * 10,
      z: (rng() - 0.5) * 120,
      s: 2 + rng() * 3,
      speed: 0.2 + rng() * 0.4,
    }));
  }, []);
  useFrame((_, dt) => {
    if (reduceMotion || !grp.current) return;
    grp.current.children.forEach((c, i) => {
      c.position.x += puffs[i].speed * dt;
      if (c.position.x > 70) c.position.x = -70;
    });
  });
  return (
    <group ref={grp}>
      {puffs.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} scale={p.s}>
          <mesh>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0.9, -0.1, 0]}>
            <sphereGeometry args={[0.7, 14, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.9} />
          </mesh>
          <mesh position={[-0.8, -0.15, 0.2]}>
            <sphereGeometry args={[0.6, 14, 10]} />
            <meshStandardMaterial color="#f3f8ff" roughness={1} transparent opacity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
