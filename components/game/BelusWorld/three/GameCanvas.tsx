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
import HomeLife from './HomeLife';
import RainbowPlay from './RainbowPlay';
import type { AnimalSpecies } from './quest/Animal3D';
import type { GardenPlant } from '../belu/progress';
import { type QuestStatus } from './quest/QuestLayer';
import StoryLayer from './quest/StoryLayer';
import ForestLayer from './quest/ForestLayer';
import MountainLayer from './quest/MountainLayer';
import CoveLayer from './quest/CoveLayer';
import { PLAYER_SPAWN, type ZoneId } from './worldConfig';
import type { BeluEmotion } from '../BeluCharacter';
import type { ActivityZone } from '../belu/progress';
import type { Sound } from '../belu/feedback';

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
  equipped?: import('../belu/progress').EquippedCosmetics;
  /** completed-level count per zone island (drives the bloom) */
  islandLevels: Partial<Record<ZoneId, number>>;
  /** has the reward island formed? */
  rainbowUnlocked: boolean;
  /** which level to play next on each zone island */
  islandNextLevel: Record<ActivityZone, number>;
  sound: boolean;
  // ---- Home life: sparkle jar, daily sparkle hunt, garden, visit moments ----
  /** today's local date key (YYYY-MM-DD) — drives daily sparkles + plant growth */
  dateKey: string;
  jarCount: number;
  seeds: number;
  garden: GardenPlant[];
  /** ids of today's hidden sparkles already found */
  sparklesFound: string[];
  /** animal species the child has healed (they remember the child) */
  healedFriends: string[];
  /** today's date-seeded visiting healed friend, or null */
  visitor: AnimalSpecies | null;
  onProximity: (zone: ZoneId | null) => void;
  speak: (line: string) => void;
  setEmotion: (e: BeluEmotion) => void;
  playSound: (kind: Sound) => void;
  onQuestComplete: (zone: ActivityZone, level: number, stars: number, moment: string) => void;
  onQuestStatus: (s: QuestStatus | null) => void;
  onCollectSparkle: (id: string) => void;
  onPlant: () => void;
  onPetal: () => void;
  onFriendHealed: (species: string) => void;
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
  equipped,
  islandLevels,
  rainbowUnlocked,
  islandNextLevel,
  sound,
  dateKey,
  jarCount,
  seeds,
  garden,
  sparklesFound,
  healedFriends,
  visitor,
  onProximity,
  speak,
  setEmotion,
  playSound,
  onQuestComplete,
  onQuestStatus,
  onCollectSparkle,
  onPlant,
  onPetal,
  onFriendHealed,
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
        <World activeZone={activeZone} reduceMotion={reduceMotion} islandLevels={islandLevels} rainbowUnlocked={rainbowUnlocked} />
        <Player
          ref={player}
          emotion={emotion}
          paused={paused}
          onProximity={onProximity}
          reduceMotion={reduceMotion}
          growthScale={growthScale}
          growthStage={growthStage}
          equipped={equipped}
        />
        {/* Each island now has its own bespoke play layer: Feelings Meadow is
            caring-play (StoryLayer), Friendship Forest is magic words
            (ForestLayer), Morning Mountain is do-the-routine (MountainLayer),
            and Calm Cove is calm-the-storm breathing (CoveLayer). */}
        {/* Belu's Home comes alive: sparkle jar, daily sparkle hunt, the garden
            and the once-a-day visiting healed friend. */}
        <HomeLife
          paused={paused}
          dateKey={dateKey}
          jarCount={jarCount}
          seeds={seeds}
          garden={garden}
          sparklesFound={sparklesFound}
          visitor={visitor}
          speak={speak}
          playSound={playSound}
          onCollectSparkle={onCollectSparkle}
          onPlant={onPlant}
          onPetal={onPetal}
        />
        {/* The Rainbow Playground actually plays: bouncy dome, balloons, slide.
            Deliberately silent — it doubles as a sensory/regulation corner. */}
        {rainbowUnlocked && <RainbowPlay paused={paused} playSound={playSound} />}
        <StoryLayer
          level={islandNextLevel.meadow}
          paused={paused}
          healedFriends={healedFriends}
          onFriendHealed={onFriendHealed}
          speak={speak}
          setEmotion={setEmotion}
          playSound={playSound}
          onComplete={onQuestComplete}
          onStatus={onQuestStatus}
        />
        <ForestLayer
          level={islandNextLevel.forest}
          paused={paused}
          healedFriends={healedFriends}
          onFriendHealed={onFriendHealed}
          speak={speak}
          setEmotion={setEmotion}
          playSound={playSound}
          onComplete={onQuestComplete}
          onStatus={onQuestStatus}
        />
        <MountainLayer
          level={islandNextLevel.mountain}
          paused={paused}
          speak={speak}
          setEmotion={setEmotion}
          playSound={playSound}
          onComplete={onQuestComplete}
          onStatus={onQuestStatus}
        />
        <CoveLayer
          level={islandNextLevel.cove}
          paused={paused}
          speak={speak}
          setEmotion={setEmotion}
          playSound={playSound}
          onComplete={onQuestComplete}
          onStatus={onQuestStatus}
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
