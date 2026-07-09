// ---------------------------------------------------------------------------
// Morning Mountain — life skills you DO by walking the routine.
//   • Little station objects (bed, sink, wardrobe, breakfast, backpack, door…)
//     stand around the island, each with an emoji sign above it.
//   • Nilu WALKS to the next-correct station to "do" that step: it bounces +
//     glows, a ✅ sparkle pops, and Nilu narrates the step.
//   • Walking to a wrong / out-of-order station = a gentle wiggle + a kind
//     "what do we do first?" — never a buzzer, never a fail.
//   • L1-L3 must be done in order; L4 = walk to the SAFE marker of each pair;
//     L5 = visit every job in ANY order. Finishing the routine completes the
//     level and always awards 3 stars (errorless, no losing).
// Mirrors StoryLayer's frame-ref + arm/disarm/finish structure exactly.
// ---------------------------------------------------------------------------

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLANDS } from '../worldConfig';
import { beluPos, dynamicSolids } from '../playerState';
import { makeRng } from '../Scenery';
import type { BeluEmotion } from '../../BeluCharacter';
import { makeLabelTexture } from './emojiTexture';
import { MOUNTAIN_ROUTINE, NIMBUS_LINES, RING, SAFE_SPOTS, TWIN_DX, type Station } from './mountainContent';
import { MorningSun, Nimbus, StepStone, StarSpark } from './mountainExtras';
import StartSign from './StartSign';
import type { QuestStatus } from './QuestLayer';

const ZONE = 'mountain' as const;
const REACH = 1.7; // walk this close to a station to "do" it
const NUDGE_AT = 1.7; // walking this close to a wrong station triggers the nudge
const STATION_SOLID_R = 0.85; // keep-out radius so Nilu walks around the objects
const STAR_PICK = 1.5; // walk this close to a hidden star to collect it
const INVITE_START = 2.4; // walk this close to Nimbus's spot to BEGIN (consent)

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
  /** gentle re-prompts this session — grown-ups-only signal, never shown to the child */
  slips: number;
  // hidden collectible stars: collect time per star (-99 = not yet)
  starsAt: number[];
  starsFound: number;
  // companion cloud + Nimbus cheer pulse
  cheerUntil: number;
  nimbusLine: number;
  /** stuck-help: same two-stage escalation as QuestLayer (18s coach hint +
   *  spotlight, 36s "Help me" button) — reset whenever a station is reached */
  lastProgressAt: number;
  helpStage: 0 | 1 | 2 | 3;
  helping: boolean;
  helpFinishAt: number;
  /** the instruction text last sent to the DOM card, so a stuck-help status
   *  re-emit (to flip on helpOffered) doesn't clobber it */
  lastInstruction: string;
}

const HELP_HINT_AT = 18;
const HELP_BUTTON_AT = 36;
const HELP_ANIM_TIME = 1.6;

interface Props {
  level: number;
  paused: boolean;
  reduceMotion: boolean;
  /** today's date key (e.g. "2026-07-09") — reshuffles station PLACEMENT once
   *  per real day. The routine's authored order never changes, only which
   *  pedestal spot each step lands on. */
  dateKey: string;
  speak: (line: string) => void;
  setEmotion: (e: BeluEmotion) => void;
  playSound: (kind: 'tap' | 'correct' | 'star' | 'levelup' | 'growup') => void;
  onComplete: (zone: 'mountain', level: number, stars: number, moment: string, slips?: number) => void;
  onStatus: (s: QuestStatus | null) => void;
  /** the DOM "🤝 Help me" button (index.tsx QuestPanel) calls this ref when
   *  tapped, while this layer is the active one */
  helpRequestRef?: import('react').MutableRefObject<() => void>;
}

function clampLevel(level: number) {
  return Math.max(0, Math.min(MOUNTAIN_ROUTINE.length - 1, level - 1));
}

// ---- daily station shuffle -------------------------------------------------
// Same tiny string→seed hash used by HomeLife's dailySparkleSpots, feeding the
// shared makeRng LCG. Deterministic per dateKey: stable all day, fresh tomorrow.
function seedFromKey(key: string): number {
  let h = 7;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 2147483647;
  return h || 1;
}

/** Fisher-Yates shuffle of [0..n-1], seeded so it's stable for a given day. */
function seededPermutation(n: number, seed: number): number[] {
  const rng = makeRng(seed);
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Builds today's slot-remap: which physical RING/SAFE_SPOTS slot each
 *  authored slot now lands on. Stations still reference the SAME set of
 *  well-spaced spots — just reassigned — so arc/spacing math is untouched. */
function dailyStationShuffle(dateKey: string) {
  const ringPerm = seededPermutation(RING.length, seedFromKey(`${dateKey}:mountain:ring`));
  const safePerm = seededPermutation(SAFE_SPOTS.length, seedFromKey(`${dateKey}:mountain:safe`));
  const ringIndexOf = (pos: [number, number]) =>
    RING.findIndex(([x, z]) => x === pos[0] && z === pos[1]);
  /** the SHUFFLED local [x,z] a given authored station should render/interact at today */
  return function shuffledPos(s: Station): [number, number] {
    if (s.kind === 'safe' || s.kind === 'unsafe') {
      const pair = s.pair ?? 0;
      const slot = SAFE_SPOTS[safePerm[pair] ?? pair];
      return s.kind === 'unsafe' ? [slot[0] + TWIN_DX, slot[1]] : [slot[0], slot[1]];
    }
    const idx = ringIndexOf(s.pos);
    if (idx < 0) return s.pos; // shouldn't happen — fall back to authored spot
    const slot = RING[ringPerm[idx]];
    return [slot[0], slot[1]];
  };
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
    doneCount: 0, disarmed: false, wrongIdx: -1, wrongUntil: 0, lockUntil: 0, finishAt: 0, slips: 0,
    starsAt: (MOUNTAIN_ROUTINE[clampLevel(props.level)].stars ?? []).map(() => -99),
    starsFound: 0, cheerUntil: 0, nimbusLine: -1,
    lastProgressAt: 0, helpStage: 0, helping: false, helpFinishAt: 0, lastInstruction: '',
  });
  const frame = useRef<(dt: number) => void>(() => {});
  const isl = ISLANDS[ZONE];

  // wire the DOM "🤝 Help me" button to this layer only while its routine
  // is actually active
  if (props.helpRequestRef && S.current.active) {
    props.helpRequestRef.current = () => doHelp();
  }

  // today's pedestal-placement shuffle — stable all day, fresh tomorrow
  const shuffledPos = useMemo(() => dailyStationShuffle(props.dateKey), [props.dateKey]);

  const stationWorld = (s: Station): [number, number] => {
    const [lx, lz] = shuffledPos(s);
    return [isl.cx + lx, isl.cz + lz];
  };
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
    S.current.lastInstruction = instruction;
    props.onStatus({
      zone: ZONE, title: isl.label, emoji: isl.emoji, accent: isl.accent,
      level: S.current.level, instruction, step: S.current.doneCount,
      total: targetCount(lvl.stations), phase, hint,
      helpOffered: S.current.helpStage >= 2,
    });
  }

  /** the correct next station to visit right now (works for ordered chains,
   *  safety pairs, and the any-order finale alike — the un-safe twin is
   *  never "correct") */
  function nextCorrectStationIdx(): number {
    const lvl = MOUNTAIN_ROUTINE[clampLevel(S.current.level)];
    return lvl.stations.findIndex((s, i) => s.kind !== 'unsafe' && !S.current.stations[i].done);
  }

  /** Fill in the rest of the routine as if the child had walked it, then
   *  finish — used after the "watch me" assist beat. Never counted as a slip. */
  function completeRoutineAssisted() {
    const st = S.current;
    st.helping = false;
    const lvl = MOUNTAIN_ROUTINE[clampLevel(st.level)];
    lvl.stations.forEach((s, i) => {
      if (s.kind !== 'unsafe' && !st.stations[i].done) {
        st.stations[i].done = true;
        st.stations[i].doneAt = st.clock;
        st.doneCount += 1;
      }
    });
    props.playSound('levelup');
    st.cheerUntil = st.clock + 2.0;
    emitStatus('correct', 'Now you did it! 💙', 'Routine complete! 🌟');
    st.finishAt = st.clock + 1.8;
    bump();
  }

  /** Tapping "🤝 Help me" (Stage 2). Nimbus does the rest of the routine
   *  together with Nilu — stars are never docked for asking for help. */
  function doHelp() {
    const st = S.current;
    if (!st.active || st.helpStage < 2 || st.helping) return;
    st.helpStage = 3; // used — one help per routine
    st.helping = true;
    st.helpFinishAt = st.clock + HELP_ANIM_TIME;
    props.setEmotion('curious');
    props.speak('Let’s do it together! Watch me…');
    emitStatus('question', st.lastInstruction);
    bump();
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
    S.current.slips = 0;
    S.current.lastProgressAt = S.current.clock;
    S.current.helpStage = 0;
    S.current.helping = false;
    S.current.helpFinishAt = 0;
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
    props.onComplete(ZONE, S.current.level, 3, lvl.moment, S.current.slips);
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
    st.slips += 1;
    props.playSound('tap');
    props.setEmotion('curious');
    props.speak(
      kind === 'unsafe'
        ? 'Hmm, that one is not safe. Which choice keeps us safe?'
        : 'Almost! What do we do first? Walk to the next job in order.',
    );
    bump();
  }

  // Nilu reached station i — "do" it (or nudge if it's wrong/out-of-order)
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
    // 'safe' and 'any' can be done whenever Nilu reaches them

    // do it!
    st.stations[i].done = true;
    st.stations[i].doneAt = st.clock;
    st.doneCount += 1;
    st.lockUntil = st.clock + 0.4;
    st.lastProgressAt = st.clock;
    if (st.helpStage > 0 && st.helpStage < 3) st.helpStage = 0;
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
    // keep every station registered as a solid so Nilu walks around the objects
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
      // NO quest ambush: the routine begins only when the child walks Nilu up
      // to Nimbus the cloud buddy (a deliberate approach = consent).
      if (onIsland && !st.disarmed) {
        const hx = isl.cx - 5.4; // the ground under Nimbus
        const hz = isl.cz - 4.6;
        if (Math.hypot(beluPos.x - hx, beluPos.z - hz) < INVITE_START) startRoutine();
      }
      return;
    }
    if (dCenter > isl.radius + 1.5) {
      stopRoutine();
      return;
    }

    // stuck-help: same two-stage escalation as the generic quest engine —
    // 18s without a station completed → coach hint + spotlight; 18s more →
    // "Help me" button. Reset whenever a station is reached (see reach()).
    if (!st.helping) {
      const stuckFor = st.clock - st.lastProgressAt;
      if (st.helpStage < 1 && stuckFor >= HELP_HINT_AT) {
        st.helpStage = 1;
        const idx = nextCorrectStationIdx();
        if (idx >= 0) props.speak(`${lvl.stations[idx].label}! Walk to it ${lvl.stations[idx].emoji}!`);
        bump();
      } else if (st.helpStage === 1 && stuckFor >= HELP_BUTTON_AT) {
        st.helpStage = 2;
        emitStatus('question', st.lastInstruction, actionHint());
        bump();
      }
    }

    // mid "watch me" assist — freeze normal picking until it lands
    if (st.helping) {
      if (st.clock >= st.helpFinishAt) completeRoutineAssisted();
      return;
    }

    // hidden morning stars: collect any Nilu walks near (no lock — pure bonus)
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

    // which station is Nilu close enough to "do"? (nearest within reach)
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
  // Stage-1 stuck-help spotlight: which station is the correct next one?
  const helpBeaconIdx = S.current.active && S.current.helpStage >= 1 ? nextCorrectStationIdx() : -1;
  return (
    <group>
      <Ticker fnRef={frame} />

      {/* the morning sun rises + brightens as the routine progresses */}
      <MorningSun center={[isl.cx, isl.cz]} top={isl.top} progress={prog} />

      {/* Nimbus waves you over — walk right up to begin the morning routine */}
      {!S.current.active && !S.current.disarmed && (
        <StartSign
          position={[isl.cx - 5.4, isl.top + 4.6, isl.cz - 4.6]}
          ground={[isl.cx - 5.4, isl.top, isl.cz - 4.6]}
          color={isl.accent}
          reduceMotion={props.reduceMotion}
        />
      )}

      {/* Nimbus the sleepy cloud buddy — wakes + cheers Nilu on */}
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
            {/* Stage-1 stuck-help spotlight — a bright beacon on the correct station */}
            {i === helpBeaconIdx && <HelpBeacon reduceMotion={props.reduceMotion} />}
          </Station3D>
        );
      })}
    </group>
  );
}

// Stuck-help spotlight: a bright pulsing gold beacon dropped above whatever
// station the child should walk to next. Static (no pulse) under
// reduce-motion so it reads as a clear, calm spotlight rather than a
// distraction. Rendered as a child of Station3D, so it inherits its position.
function HelpBeacon({ reduceMotion }: { reduceMotion: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (!ring.current) return;
    ring.current.scale.setScalar(reduceMotion ? 1.3 : 1.1 + Math.sin(t.current * 3.2) * 0.25);
  });
  return (
    <group position={[0, 2.4, 0]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.72, 28]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color="#ffe066" intensity={1.4} distance={4} />
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
  const tex = useRef<THREE.CanvasTexture>(makeLabelTexture(emoji, label, true, accent));
  const checkTex = useRef<THREE.CanvasTexture>(makeLabelTexture('✅'));
  // refresh the sign texture if the emoji/label ever changes for this slot
  const key = `${emoji} ${label} ${accent}`;
  if ((tex.current as unknown as { __k?: string }).__k !== key) {
    tex.current = makeLabelTexture(emoji, label, true, accent);
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
      {/* a little pedestal you walk up to — a subtle accent glow so it never reads as flat/pale */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.7, 16]} />
        <meshStandardMaterial color={accent} roughness={0.55} metalness={0.1} emissive={accent} emissiveIntensity={done ? 0.75 : 0.5} />
      </mesh>
      {/* signpost stalk */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#caa46a" roughness={0.8} />
      </mesh>
      {/* the emoji + word sign (sprite always faces camera, drawn on top) — 1.4x larger
          so the card reads as a real 3D object, not a pale sticker */}
      <sprite position={[0, 1.7, 0]} scale={[2.24, 2.24, 1]} renderOrder={11}>
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
