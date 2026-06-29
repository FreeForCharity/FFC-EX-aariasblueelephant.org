// ---------------------------------------------------------------------------
// Morning Mountain — life skills you DO by walking the routine.
//   • Little station objects (bed, sink, wardrobe, breakfast, backpack, door…)
//     stand around the island, each with an emoji sign above it.
//   • Belu WALKS to the next-correct station to "do" that step: it bounces +
//     glows, a ✅ sparkle pops, and Belu narrates the step.
//   • Walking to a wrong / out-of-order station = a gentle wiggle + a kind
//     "what do we do first?" — never a buzzer, never a fail.
//   • L1-L3 must be done in order; L4 = walk to the SAFE marker of each pair;
//     L5 = visit every job in ANY order. Finishing the routine completes the
//     level and always awards 3 stars (errorless, no losing).
// Mirrors StoryLayer's frame-ref + arm/disarm/finish structure exactly.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLANDS } from '../worldConfig';
import { beluPos, dynamicSolids } from '../playerState';
import type { BeluEmotion } from '../../BeluCharacter';
import { makeLabelTexture } from './emojiTexture';
import { MOUNTAIN_ROUTINE, NIMBUS_LINES, type Station } from './mountainContent';
import { MorningSun, Nimbus, StepStone, StarSpark } from './mountainExtras';
import type { QuestStatus } from './QuestLayer';

const ZONE = 'mountain' as const;
const REACH = 1.7; // walk this close to a station to "do" it
const NUDGE_AT = 1.7; // walking this close to a wrong station triggers the nudge
const STATION_SOLID_R = 0.85; // keep-out radius so Belu walks around the objects
const STAR_PICK = 1.5; // walk this close to a hidden star to collect it

interface StationRT {
  done: boolean;
  doneAt: number;
}
interface State {
  clock: number;
  active: boolean;
  level: number;
  stations: StationRT[];
  doneCount: number;
  disarmed: boolean;
  // gentle-nudge wiggle on a wrong/out-of-order station
  wrongIdx: number;
  wrongUntil: number;
  lockUntil: number;
  finishAt: number;
  // hidden collectible stars: collect time per star (-99 = not yet)
  starsAt: number[];
  starsFound: number;
  // companion cloud + Nimbus cheer pulse
  cheerUntil: number;
  nimbusLine: number;
}

interface Props {
  level: number;
  paused: boolean;
  speak: (line: string) => void;
  setEmotion: (e: BeluEmotion) => void;
  playSound: (kind: 'tap' | 'correct' | 'star' | 'levelup' | 'growup') => void;
  onComplete: (zone: 'mountain', level: number, stars: number, moment: string) => void;
  onStatus: (s: QuestStatus | null) => void;
}

function clampLevel(level: number) {
  return Math.max(0, Math.min(MOUNTAIN_ROUTINE.length - 1, level - 1));
}

/** stations that actually need visiting to finish (the un-safe twins don't). */
function targetCount(stations: Station[]) {
  return stations.filter((s) => s.kind !== 'unsafe').length;
}

export default function MountainLayer(props: Props) {
  const [, force] = useState(0);
  const bump = () => force((v) => (v + 1) % 1_000_000);
  const S = useRef<State>({
    clock: 0, active: false, level: props.level,
    stations: MOUNTAIN_ROUTINE[clampLevel(props.level)].stations.map(() => ({ done: false, doneAt: -99 })),
    doneCount: 0, disarmed: false, wrongIdx: -1, wrongUntil: 0, lockUntil: 0, finishAt: 0,
    starsAt: (MOUNTAIN_ROUTINE[clampLevel(props.level)].stars ?? []).map(() => -99),
    starsFound: 0, cheerUntil: 0, nimbusLine: -1,
  });
  const frame = useRef<(dt: number) => void>(() => {});
  const isl = ISLANDS[ZONE];

  const stationWorld = (s: Station): [number, number] => [isl.cx + s.pos[0], isl.cz + s.pos[1]];
  const starWorld = (p: [number, number]): [number, number] => [isl.cx + p[0], isl.cz + p[1]];

  // how far along the morning we are (0..1) — drives the rising sun + Nimbus
  function progress(): number {
    const lvl = MOUNTAIN_ROUTINE[clampLevel(S.current.level)];
    const total = Math.max(1, targetCount(lvl.stations));
    return Math.min(1, S.current.doneCount / total);
  }

  function nimbusCheer() {
    const st = S.current;
    st.cheerUntil = st.clock + 1.2;
    const idx = Math.min(NIMBUS_LINES.length - 1, st.doneCount);
    if (idx !== st.nimbusLine) {
      st.nimbusLine = idx;
      props.speak(NIMBUS_LINES[idx]);
    }
  }

  function emitStatus(phase: 'question' | 'correct', instruction: string, hint?: string) {
    const lvl = MOUNTAIN_ROUTINE[clampLevel(S.current.level)];
    props.onStatus({
      zone: ZONE, title: isl.label, emoji: isl.emoji, accent: isl.accent,
      level: S.current.level, instruction, step: S.current.doneCount,
      total: targetCount(lvl.stations), phase, hint,
    });
  }

  // the hint depends on the level's mechanic so the task card guides the child
  function actionHint(): string {
    const lvl = MOUNTAIN_ROUTINE[clampLevel(S.current.level)];
    // L5 'any' order: just visit every job
    if (lvl.stations.every((s) => s.kind === 'any')) return 'Walk to each job — any order you like! ✅';
    // L4 safety: pick the safe one of each pair
    if (lvl.stations.some((s) => s.kind === 'safe')) return 'Walk to the SAFE choice of each pair ✅';
    // L1-L3 ordered: point at the next step
    const first = lvl.stations.find((s, i) => s.kind === 'ordered' && !S.current.stations[i].done);
    return first ? `Walk to: ${first.label} ✅` : 'Walk to the next job ✅';
  }

  function startRoutine() {
    const lvl = MOUNTAIN_ROUTINE[clampLevel(props.level)];
    S.current.active = true;
    S.current.level = props.level;
    S.current.stations = lvl.stations.map(() => ({ done: false, doneAt: -99 }));
    S.current.doneCount = 0;
    S.current.wrongIdx = -1;
    S.current.finishAt = 0;
    S.current.lockUntil = S.current.clock + 0.35;
    S.current.starsAt = (lvl.stars ?? []).map(() => -99);
    S.current.starsFound = 0;
    S.current.cheerUntil = 0;
    S.current.nimbusLine = -1;
    props.setEmotion('curious');
    props.speak(lvl.intro);
    emitStatus('question', lvl.intro, actionHint());
    bump();
  }

  function stopRoutine() {
    S.current.active = false;
    S.current.wrongIdx = -1;
    props.setEmotion('happy');
    props.onStatus(null);
    bump();
  }

  function finish() {
    const lvl = MOUNTAIN_ROUTINE[clampLevel(S.current.level)];
    props.onComplete(ZONE, S.current.level, 3, lvl.moment);
    props.speak(lvl.outro);
    S.current.active = false;
    S.current.disarmed = true;
    S.current.wrongIdx = -1;
    props.onStatus(null);
    bump();
  }

  // gentle "not yet" — a little wiggle + a kind line, never a fail
  function nudge(i: number, kind: 'order' | 'unsafe') {
    const st = S.current;
    st.wrongIdx = i;
    st.wrongUntil = st.clock + 0.5;
    st.lockUntil = st.clock + 0.45;
    props.playSound('tap');
    props.setEmotion('curious');
    props.speak(
      kind === 'unsafe'
        ? 'Hmm, that one is not safe. Which choice keeps us safe?'
        : 'Almost! What do we do first? Walk to the next job in order.',
    );
    bump();
  }

  // Belu reached station i — "do" it (or nudge if it's wrong/out-of-order)
  function reach(i: number) {
    const st = S.current;
    if (st.clock < st.lockUntil) return;
    const lvl = MOUNTAIN_ROUTINE[clampLevel(st.level)];
    const station = lvl.stations[i];
    if (st.stations[i].done) return;

    // L4 un-safe twin → gentle nudge, no progress
    if (station.kind === 'unsafe') {
      nudge(i, 'unsafe');
      return;
    }

    // ordered levels: must be the next not-yet-done ordered station
    if (station.kind === 'ordered') {
      const nextOrderedIdx = lvl.stations.findIndex((s, j) => s.kind === 'ordered' && !st.stations[j].done);
      if (i !== nextOrderedIdx) {
        nudge(i, 'order');
        return;
      }
    }
    // 'safe' and 'any' can be done whenever Belu reaches them

    // do it!
    st.stations[i].done = true;
    st.stations[i].doneAt = st.clock;
    st.doneCount += 1;
    st.lockUntil = st.clock + 0.4;
    props.playSound('correct');
    props.setEmotion('excited');

    const total = targetCount(lvl.stations);
    if (st.doneCount >= total) {
      props.playSound('levelup');
      // a big morning finish: Nimbus is wide awake, the sun is all the way up
      st.cheerUntil = st.clock + 2.0;
      emitStatus('correct', station.done ?? 'You did it!', 'Routine complete! 🌟');
      st.finishAt = st.clock + 1.8;
    } else {
      props.playSound('star');
      nimbusCheer(); // the cloud buddy cheers + the sun climbs another notch
      const stars = st.starsFound > 0 ? ` (★ ${st.starsFound} found!)` : '';
      emitStatus('correct', (station.done ?? 'Nice — you did it!') + stars, actionHint());
    }
    bump();
  }

  frame.current = (dt: number) => {
    const st = S.current;
    // keep every station registered as a solid so Belu walks around the objects
    const lvl = MOUNTAIN_ROUTINE[clampLevel(st.level)];
    dynamicSolids.mountain = lvl.stations.map((s) => {
      const [x, z] = stationWorld(s);
      return { x, z, r: STATION_SOLID_R };
    });
    if (props.paused) return;
    st.clock += dt;

    if (st.finishAt > 0 && st.clock >= st.finishAt) {
      st.finishAt = 0;
      finish();
      return;
    }
    if (st.wrongIdx >= 0 && st.clock > st.wrongUntil) {
      st.wrongIdx = -1;
      bump();
    }

    const dCenter = Math.hypot(beluPos.x - isl.cx, beluPos.z - isl.cz);
    const onIsland = dCenter < isl.radius * 0.82;
    if (st.disarmed && dCenter > isl.radius + 1.5) {
      st.disarmed = false;
      bump();
    }
    if (!st.active) {
      if (onIsland && !st.disarmed) startRoutine();
      return;
    }
    if (dCenter > isl.radius + 1.5) {
      stopRoutine();
      return;
    }
    // hidden morning stars: collect any Belu walks near (no lock — pure bonus)
    const stars = lvl.stars ?? [];
    for (let i = 0; i < stars.length; i++) {
      if (st.starsAt[i] > 0) continue;
      const [sx, sz] = starWorld(stars[i]);
      if (Math.hypot(beluPos.x - sx, beluPos.z - sz) < STAR_PICK) {
        st.starsAt[i] = st.clock;
        st.starsFound += 1;
        props.playSound('tap');
        props.speak(
          st.starsFound >= stars.length
            ? 'Wow! You found ALL the morning stars! ⭐'
            : 'Ooh, a sparkly morning star! ⭐',
        );
        bump();
      }
    }

    if (st.clock < st.lockUntil) return;

    // which station is Belu close enough to "do"? (nearest within reach)
    let best = -1;
    let bestD = Math.max(REACH, NUDGE_AT);
    for (let i = 0; i < lvl.stations.length; i++) {
      if (st.stations[i].done) continue;
      const [x, z] = stationWorld(lvl.stations[i]);
      const d = Math.hypot(beluPos.x - x, beluPos.z - z);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) reach(best);
  };

  // ---- render ----
  const lvl = MOUNTAIN_ROUTINE[clampLevel(S.current.level)];
  const prog = (() => {
    const total = Math.max(1, targetCount(lvl.stations));
    return Math.min(1, S.current.doneCount / total);
  })();
  const cheering = S.current.active && S.current.clock < S.current.cheerUntil;
  const awake = S.current.active; // Nimbus naps until the routine begins
  const starList = lvl.stars ?? [];
  return (
    <group>
      <Ticker fnRef={frame} />

      {/* the morning sun rises + brightens as the routine progresses */}
      <MorningSun center={[isl.cx, isl.cz]} top={isl.top} progress={prog} />

      {/* Nimbus the sleepy cloud buddy — wakes + cheers Belu on */}
      <Nimbus
        position={[isl.cx - 5.4, isl.top + 3.0, isl.cz - 4.6]}
        awake={awake}
        cheer={cheering}
        clock={S.current.clock}
      />

      {/* hidden collectible morning stars */}
      {starList.map((p, i) => {
        const at = S.current.starsAt[i] ?? -99;
        // once collected and its pop animation is over, stop rendering it
        if (at > 0 && S.current.clock - at > 0.5) return null;
        const [sx, sz] = [isl.cx + p[0], isl.cz + p[1]];
        return (
          <StarSpark
            key={`${S.current.level}-star-${i}`}
            position={[sx, isl.top + 1.1, sz]}
            collectedAt={at}
            clock={S.current.clock}
          />
        );
      })}

      {lvl.stations.map((station, i) => {
        const rt = S.current.stations[i] ?? { done: false, doneAt: -99 };
        const [x, z] = stationWorld(station);
        const wiggling = S.current.wrongIdx === i && S.current.clock < S.current.wrongUntil;
        const justDone = rt.done && S.current.clock - rt.doneAt < 2.2;
        return (
          <Station3D
            key={`${S.current.level}-${i}`}
            position={[x, isl.top, z]}
            emoji={station.emoji}
            label={station.label}
            accent={isl.accent}
            done={rt.done}
            wiggle={wiggling}
            clock={S.current.clock}
            seed={i * 1.3}
          >
            {justDone && (
              <Sparkles count={20} scale={2.4} size={6} speed={0.6} color="#7CFC9A" position={[0, 1.4, 0]} />
            )}
            {/* a glowing footprint pad that lights up once this step is done */}
            <StepStone position={[0, 0.06, 1.05]} lit={rt.done} accent={isl.accent} />
          </Station3D>
        );
      })}
    </group>
  );
}

// A little routine station: a low rounded base + a tinted glow pad, an emoji
// sign floating above, and a ✅ badge once it's been done. Built from primitives
// only (no downloads). The sign is a sprite with depthTest off so it never hides
// inside the geometry.
function Station3D({
  position, emoji, label, accent, done, wiggle, clock, seed, children,
}: {
  position: [number, number, number];
  emoji: string;
  label: string;
  accent: string;
  done: boolean;
  wiggle: boolean;
  clock: number;
  seed: number;
  children?: React.ReactNode;
}) {
  const grp = useRef<THREE.Group>(null);
  const t = useRef(seed);
  const tex = useRef<THREE.CanvasTexture>(makeLabelTexture(emoji, label, true));
  const checkTex = useRef<THREE.CanvasTexture>(makeLabelTexture('✅'));
  // refresh the sign texture if the emoji/label ever changes for this slot
  const key = `${emoji} ${label}`;
  if ((tex.current as unknown as { __k?: string }).__k !== key) {
    tex.current = makeLabelTexture(emoji, label, true);
    (tex.current as unknown as { __k?: string }).__k = key;
  }

  useFrame((_, dt) => {
    t.current += dt;
    const g = grp.current;
    if (!g) return;
    // a soft idle bob; a quick wiggle when nudged; a celebratory bounce when done
    let y = position[1];
    let rz = 0;
    if (wiggle) {
      rz = Math.sin(clock * 40) * 0.18;
    } else if (done) {
      y = position[1] + Math.abs(Math.sin(t.current * 4)) * 0.12;
    } else {
      y = position[1] + Math.sin(t.current * 1.6) * 0.05;
    }
    g.position.y += (y - g.position.y) * Math.min(1, dt * 12);
    g.rotation.z += (rz - g.rotation.z) * Math.min(1, dt * 18);
  });

  return (
    <group ref={grp} position={position}>
      {/* glow pad on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.5, 0.82, 28]} />
        <meshBasicMaterial color={done ? '#7CFC9A' : accent} transparent opacity={done ? 0.55 : 0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* a little pedestal you walk up to */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.7, 16]} />
        <meshStandardMaterial color={accent} roughness={0.55} metalness={0.1} emissive={accent} emissiveIntensity={done ? 0.5 : 0.18} />
      </mesh>
      {/* signpost stalk */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#caa46a" roughness={0.8} />
      </mesh>
      {/* the emoji + word sign (sprite always faces camera, drawn on top) */}
      <sprite position={[0, 1.7, 0]} scale={[1.6, 1.6, 1]} renderOrder={11}>
        <spriteMaterial map={tex.current} transparent depthWrite={false} depthTest={false} />
      </sprite>
      {/* ✅ badge once done */}
      {done && (
        <sprite position={[0.6, 2.35, 0]} scale={[0.7, 0.7, 1]} renderOrder={13}>
          <spriteMaterial map={checkTex.current} transparent depthWrite={false} depthTest={false} />
        </sprite>
      )}
      {children}
    </group>
  );
}

function Ticker({ fnRef }: { fnRef: React.MutableRefObject<(dt: number) => void> }) {
  useFrame((_, dt) => fnRef.current(Math.min(dt, 0.05)));
  return null;
}
