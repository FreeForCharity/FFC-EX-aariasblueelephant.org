// ---------------------------------------------------------------------------
// The R3F canvas: camera, realistic lighting, procedural sky, soft shadows and
// a gentle bloom pass that gives the world its magical glow. "Calm mode" dials
// the bloom right down for sensory-sensitive players.
//
// Performance: device-pixel-ratio is capped and auto-scaled by a
// PerformanceMonitor (drops to 1x on weak GPUs), only Belu casts a shadow, the
// shadow map is modest, and the composer runs without extra multisampling.
// ---------------------------------------------------------------------------

import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Player, { type PlayerHandle } from './Player';
import World from './World';
import { PLAYER_SPAWN, type ZoneId } from './worldConfig';
import type { BeluEmotion } from '../BeluCharacter';

interface Props {
  emotion: BeluEmotion;
  paused: boolean;
  reduceMotion: boolean;
  calmMode: boolean;
  /** the zone whose crystal should glow (Belu is near it) */
  activeZone: ZoneId | null;
  /** Belu's current size + growth stage (visible "growing up") */
  growthScale: number;
  growthStage: number;
  /** completed-level count per zone island (drives the bloom) */
  islandLevels: Partial<Record<ZoneId, number>>;
  onProximity: (zone: ZoneId | null) => void;
  onEnter: (zone: ZoneId) => void;
}

function Lighting({ calmMode }: { calmMode: boolean }) {
  return (
    <>
      <hemisphereLight args={['#cfe8ff', '#8fae7a', 0.9]} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[28, 40, 18]}
        intensity={calmMode ? 1.6 : 2.1}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={130}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.0005}
      />
      {/* warm rim fill from the opposite side for soft toy-like shading */}
      <directionalLight position={[-25, 16, -20]} intensity={0.5} color="#ffd9b8" />
    </>
  );
}

export default function GameCanvas({
  emotion,
  paused,
  reduceMotion,
  calmMode,
  activeZone,
  growthScale,
  growthStage,
  islandLevels,
  onProximity,
  onEnter,
}: Props) {
  const player = useRef<PlayerHandle>(null);
  // start at a safe-ish ratio and let the monitor scale it to the device
  const [dpr, setDpr] = useState(1.25);

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{
        antialias: false, // the composer + dpr handle edges; saves fill-rate
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{
        fov: 50,
        near: 0.1,
        far: 400,
        position: [PLAYER_SPAWN.x, PLAYER_SPAWN.y + 13.5, PLAYER_SPAWN.z + 17],
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.5)}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />

      {/* atmospheric depth */}
      <fog attach="fog" args={['#bfe2ff', 70, 160]} />
      <Sky
        distance={450000}
        sunPosition={[28, 30, 18]}
        inclination={0.52}
        azimuth={0.25}
        turbidity={4}
        rayleigh={1.2}
        mieCoefficient={0.004}
        mieDirectionalG={0.85}
      />

      <Lighting calmMode={calmMode} />

      <Suspense fallback={null}>
        <World activeZone={activeZone} reduceMotion={reduceMotion} islandLevels={islandLevels} />
        <Player
          ref={player}
          emotion={emotion}
          paused={paused}
          onProximity={onProximity}
          onEnter={onEnter}
          reduceMotion={reduceMotion}
          growthScale={growthScale}
          growthStage={growthStage}
        />
      </Suspense>

      {!calmMode && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.65}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
