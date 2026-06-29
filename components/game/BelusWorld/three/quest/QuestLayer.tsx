// ---------------------------------------------------------------------------
// The embodied quest runner. This lives INSIDE the 3D canvas and turns the old
// flashcard pop-ups into things you do in the world:
//   • A friend stands on each island. Walk Belu up to one to begin its lesson.
//   • Answers are glowing orbs out in the meadow/forest/etc. You choose by
//     WALKING Belu into an orb (or tapping it). Right → it blooms and rises;
//     "not yet" → a gentle wobble, never a buzzer, never a loss.
//   • Calm Cove uses a breathing bubble instead of orbs.
// It reads Belu's live position every frame (playerState.beluPos) and reports a
// finished level back up so the island blooms and Belu grows.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ISLANDS } from '../worldConfig';
import { beluPos, dynamicSolids } from '../playerState';
import type { ActivityZone } from '../../belu/progress';
import type { BeluEmotion } from '../../BeluCharacter';
import { getQuest, starsFromSlips, type Quest, type QuestRound } from './quests';
import AnswerOrb, { type OrbStatus } from './AnswerOrb';
import QuestNPC, { type Mood } from './QuestNPC';
import BreatheOrb from './BreatheOrb';

const ALL_ZONES: ActivityZone[] = ['meadow', 'mountain', 'cove', 'forest'];

// idle "host" friends so each island feels inhabited before you arrive
const HOSTS: Record<ActivityZone, { face: string; mood: Mood }> = {
  meadow: { face: '🐥', mood: 'happy' },
  mountain: { face: '🐿️', mood: 'happy' },
  cove: { face: '🐢', mood: 'calm' },
  forest: { face: '🦊', mood: 'happy' },
};

const PICK_RADIUS = 2.4; // how close Belu must walk to choose an orb (generous +
//                          overlapping so you can never thread between orbs)
const ORB_DIST = 3.0; // orb arc distance out in front of the friend
const ORB_H = 1.0; // orb float height above the island top (near Belu's body)

interface Layout {
  positions: [number, number, number][];
}

function orbCount(round: QuestRound): number {
  if (round.kind === 'choice') return round.options?.length ?? 0;
  if (round.kind === 'sequence') return round.pool?.length ?? 0;
  if (round.kind === 'multiPick') return round.options?.length ?? 0;
  return 0;
}

/** Lay the orbs out in an arc in front of the friend, facing Belu's approach. */
function layoutOrbs(zone: ActivityZone, n: number): Layout {
  const isl = ISLANDS[zone];
  // approach direction = from the island centre toward home (0,0)
  const len = Math.hypot(isl.cx, isl.cz) || 1;
  const ax = -isl.cx / len;
  const az = -isl.cz / len;
  // perpendicular (for spreading orbs left/right)
  const px = -az;
  const pz = ax;
  // wider fan = easier to reach from any approach angle; pick radius (2.4) is
  // bigger than half the spacing so coverage never has a gap to walk through.
  const spacing = n <= 2 ? 3.8 : n <= 3 ? 3.4 : n <= 4 ? 3.0 : 2.6;
  const positions: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const frac = n === 1 ? 0 : i / (n - 1) - 0.5;
    const off = frac * (n - 1) * spacing;
    const x = isl.cx + ax * ORB_DIST + px * off;
    const z = isl.cz + az * ORB_DIST + pz * off;
    positions.push([x, isl.top + ORB_H, z]);
  }
  return { positions };
}

function npcPosition(zone: ActivityZone): [number, number, number] {
  const isl = ISLANDS[zone];
  return [isl.cx, isl.top, isl.cz];
}

interface State {
  clock: number;
  zone: ActivityZone | null;
  level: number;
  roundIdx: number;
  slips: number;
  seqDone: string[];
  picked: Set<number>;
  solved: boolean;
  advanceAt: number;
  lockUntil: number;
  wrongIdx: number;
  wrongUntil: number;
  disarmed: ActivityZone | null;
  pendingSay: string | null;
  sayAt: number;
}

export interface QuestStatus {
  zone: ActivityZone;
  title: string;
  emoji: string;
  accent: string;
  level: number;
  instruction: string;
  step: number;
  total: number;
  phase: 'question' | 'correct';
  /** optional override for the small hint line under the instruction */
  hint?: string;
}

interface Props {
  islandNextLevel: Record<ActivityZone, number>;
  paused: boolean;
  reduceMotion: boolean;
  sound: boolean;
  speak: (line: string) => void;
  setEmotion: (e: BeluEmotion) => void;
  playSound: (kind: 'tap' | 'correct' | 'star' | 'levelup' | 'growup') => void;
  onComplete: (zone: ActivityZone, level: number, stars: number, moment: string) => void;
  onStatus: (s: QuestStatus | null) => void;
  /** which islands this layer owns (others are handled elsewhere, e.g. StoryLayer) */
  zones?: ActivityZone[];
}

export default function QuestLayer(props: Props) {
  const [, force] = useState(0);
  const bump = () => force((v) => (v + 1) % 1_000_000);
  const zones = props.zones ?? ALL_ZONES;

  const S = useRef<State>({
    clock: 0, zone: null, level: 1, roundIdx: 0, slips: 0,
    seqDone: [], picked: new Set(), solved: false, advanceAt: 0,
    lockUntil: 0, wrongIdx: -1, wrongUntil: 0, disarmed: null,
    pendingSay: null, sayAt: 0,
  });

  // The frame logic is re-bound every render so it never closes over stale
  // props; the <Ticker> below just calls it.
  const frame = useRef<(dt: number) => void>(() => {});

  const curQuest: Quest | null = S.current.zone ? getQuest(S.current.zone, S.current.level) : null;
  const curRound: QuestRound | null = curQuest ? curQuest.rounds[S.current.roundIdx] : null;

  function resetRound() {
    S.current.seqDone = [];
    S.current.picked = new Set();
    S.current.solved = false;
    S.current.wrongIdx = -1;
  }

  // tell the DOM HUD what the player should be doing right now (persistent card)
  function emitStatus(phase: 'question' | 'correct', instruction: string) {
    const z = S.current.zone;
    if (!z) {
      props.onStatus(null);
      return;
    }
    const q = getQuest(z, S.current.level);
    const isl = ISLANDS[z];
    props.onStatus({
      zone: z, title: isl.label, emoji: isl.emoji, accent: isl.accent,
      level: S.current.level, instruction, step: S.current.roundIdx,
      total: q.rounds.length, phase,
    });
  }

  function startQuest(zone: ActivityZone) {
    const level = props.islandNextLevel[zone];
    const q = getQuest(zone, level);
    S.current.zone = zone;
    S.current.level = level;
    S.current.roundIdx = 0;
    S.current.slips = 0;
    resetRound();
    // short arm delay only — long enough not to fire on the arrival step, short
    // enough that walking up to an orb registers immediately (no "dead" window).
    S.current.lockUntil = S.current.clock + 0.35;
    props.setEmotion('curious');
    props.speak(q.intro);
    S.current.pendingSay = q.rounds[0].say;
    S.current.sayAt = S.current.clock + 2.6;
    emitStatus('question', q.rounds[0].say);
    bump();
  }

  function abortQuest() {
    S.current.zone = null;
    resetRound();
    S.current.pendingSay = null;
    props.setEmotion('happy');
    props.onStatus(null);
    bump();
  }

  function finishQuest() {
    const q = getQuest(S.current.zone!, S.current.level);
    const stars = starsFromSlips(S.current.slips);
    const zone = S.current.zone!;
    const level = S.current.level;
    props.onComplete(zone, level, stars, q.moment);
    props.speak(q.outro);
    S.current.disarmed = zone;
    S.current.zone = null;
    resetRound();
    S.current.pendingSay = null;
    props.onStatus(null);
    bump();
  }

  function advance() {
    const q = getQuest(S.current.zone!, S.current.level);
    const next = S.current.roundIdx + 1;
    if (next >= q.rounds.length) {
      finishQuest();
      return;
    }
    S.current.roundIdx = next;
    resetRound();
    props.setEmotion(q.rounds[next].kind === 'breathe' ? 'calm' : 'curious');
    props.speak(q.rounds[next].say);
    emitStatus('question', q.rounds[next].say);
    bump();
  }

  function solveRound(line?: string) {
    S.current.solved = true;
    props.setEmotion('excited');
    props.playSound('star');
    if (line) props.speak(line);
    emitStatus('correct', line ?? 'Yes! You got it!');
    S.current.advanceAt = S.current.clock + 1.0;
    S.current.lockUntil = S.current.clock + 1.0;
    bump();
  }

  function slip(i: number) {
    S.current.slips += 1;
    S.current.wrongIdx = i;
    S.current.wrongUntil = S.current.clock + 0.5;
    S.current.lockUntil = S.current.clock + 0.45;
    props.playSound('tap');
    props.setEmotion('curious');
    props.speak("Hmm, not quite — look again. You can do it!");
    bump();
  }

  function pick(i: number) {
    const st = S.current;
    if (!curRound || st.solved || st.clock < st.lockUntil) return;
    if (curRound.kind === 'choice') {
      const o = curRound.options![i];
      if (o.correct) {
        props.playSound('correct');
        solveRound(curRound.doneLine ?? 'Yes! You got it!');
      } else slip(i);
    } else if (curRound.kind === 'sequence') {
      const cap = curRound.pool![i].caption ?? '';
      const expected = curRound.order![st.seqDone.length];
      if (cap === expected && !st.seqDone.includes(cap)) {
        st.seqDone.push(cap);
        props.playSound('correct');
        if (st.seqDone.length >= curRound.order!.length) {
          solveRound(curRound.doneLine ?? 'Perfect!');
        } else {
          st.lockUntil = st.clock + 0.3;
          props.setEmotion('happy');
          bump();
        }
      } else if (!st.seqDone.includes(cap)) {
        slip(i);
      }
    } else if (curRound.kind === 'multiPick') {
      if (st.picked.has(i)) return;
      st.picked.add(i);
      props.playSound('correct');
      if (st.picked.size >= (curRound.picks ?? 1)) {
        solveRound(curRound.doneLine ?? 'Wonderful!');
      } else {
        st.lockUntil = st.clock + 0.3;
        props.setEmotion('happy');
        bump();
      }
    }
  }

  // ---- per-frame logic ----
  frame.current = (dt: number) => {
    const st = S.current;
    // keep each island's friend registered as a solid thing (walk around them)
    dynamicSolids.quest = zones.map((z) => {
      const isl = ISLANDS[z];
      return { x: isl.cx, z: isl.cz, r: 1.05 };
    });
    if (import.meta.env.DEV) {
      (window as unknown as { __quest?: unknown }).__quest = {
        zone: st.zone, roundIdx: st.roundIdx, picked: st.picked.size,
        seqDone: st.seqDone.length, solved: st.solved, slips: st.slips,
        lock: Math.max(0, st.lockUntil - st.clock),
      };
    }
    if (props.paused) return;
    st.clock += dt;

    // deferred line (e.g. the round question after the intro greeting)
    if (st.pendingSay && st.clock >= st.sayAt) {
      props.speak(st.pendingSay);
      st.pendingSay = null;
    }

    // clear a wobble once it's done
    if (st.wrongIdx >= 0 && st.clock > st.wrongUntil) {
      st.wrongIdx = -1;
      bump();
    }

    // a solved round animates, then advances
    if (st.solved && st.clock >= st.advanceAt) {
      advance();
      return;
    }

    // which zone island is Belu standing on?
    let onZone: ActivityZone | null = null;
    let onDist = Infinity;
    for (const z of zones) {
      const isl = ISLANDS[z];
      const d = Math.hypot(beluPos.x - isl.cx, beluPos.z - isl.cz);
      if (d < isl.radius * 0.82 && d < onDist) {
        onDist = d;
        onZone = z;
      }
    }

    // re-arm a just-completed island once Belu wanders off it
    if (st.disarmed) {
      const isl = ISLANDS[st.disarmed];
      const d = Math.hypot(beluPos.x - isl.cx, beluPos.z - isl.cz);
      if (d > isl.radius + 1.5) {
        st.disarmed = null;
        bump();
      }
    }

    if (!st.zone) {
      if (onZone && onZone !== st.disarmed) startQuest(onZone);
      return;
    }

    // left the island mid-quest → gently abort (no penalty)
    const islc = ISLANDS[st.zone];
    const dCenter = Math.hypot(beluPos.x - islc.cx, beluPos.z - islc.cz);
    if (dCenter > islc.radius + 1.5) {
      abortQuest();
      return;
    }

    // orb pick detection (walk-in). Breathe rounds handle themselves.
    const round = getQuest(st.zone, st.level).rounds[st.roundIdx];
    if (round.kind === 'breathe' || st.solved || st.clock < st.lockUntil) return;
    const n = orbCount(round);
    if (!n) return;
    const { positions } = layoutOrbs(st.zone, n);
    let best = -1;
    let bestD = PICK_RADIUS;
    for (let i = 0; i < n; i++) {
      const p = positions[i];
      const d = Math.hypot(beluPos.x - p[0], beluPos.z - p[2]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) pick(best);
  };

  // ---- render ----
  function orbStatus(i: number): OrbStatus {
    const st = S.current;
    if (!curRound) return 'idle';
    if (curRound.kind === 'choice') {
      if (st.solved && curRound.options![i].correct) return 'right';
      if (st.wrongIdx === i) return 'wrong';
      return 'idle';
    }
    if (curRound.kind === 'sequence') {
      const cap = curRound.pool![i].caption ?? '';
      if (st.seqDone.includes(cap)) return 'chosen';
      if (st.wrongIdx === i) return 'wrong';
      return 'idle';
    }
    if (curRound.kind === 'multiPick') {
      if (st.picked.has(i)) return 'chosen';
      return 'idle';
    }
    return 'idle';
  }

  const accent: Record<ActivityZone, string> = {
    meadow: ISLANDS.meadow.accent,
    mountain: ISLANDS.mountain.accent,
    cove: ISLANDS.cove.accent,
    forest: ISLANDS.forest.accent,
  };

  return (
    <group>
      <Ticker fnRef={frame} />

      {/* idle host friends on islands you're not currently questing */}
      {zones.map((z) => {
        if (S.current.zone === z) return null;
        const p = npcPosition(z);
        const host = HOSTS[z];
        const disarmed = S.current.disarmed === z;
        return (
          <QuestNPC
            key={`host-${z}`}
            position={p}
            face={host.face}
            mood={host.mood}
            color={accent[z]}
            beckon={!disarmed}
            seed={z.length * 1.3}
          />
        );
      })}

      {/* the active quest: friend + orbs (or breathing bubble) */}
      {S.current.zone && curQuest && curRound && (
        <group>
          <QuestNPC
            position={npcPosition(S.current.zone)}
            face={curRound.npc.face}
            mood={curRound.npc.mood}
            color={accent[S.current.zone]}
            thought={curRound.npc.thought ?? null}
            beckon={false}
          />

          {curRound.kind === 'breathe' ? (
            <BreatheOrb
              position={(() => {
                const isl = ISLANDS[S.current.zone];
                const len = Math.hypot(isl.cx, isl.cz) || 1;
                return [isl.cx + (-isl.cx / len) * 2.6, isl.top + 2.2, isl.cz + (-isl.cz / len) * 2.6];
              })()}
              cycles={curRound.cycles ?? 2}
              color={accent[S.current.zone]}
              reduceMotion={props.reduceMotion}
              onPhase={(label) => props.speak(label)}
              onDone={() => solveRound()}
            />
          ) : (
            (() => {
              const n = orbCount(curRound);
              const { positions } = layoutOrbs(S.current.zone, n);
              const items =
                curRound.kind === 'choice'
                  ? curRound.options!
                  : curRound.kind === 'sequence'
                    ? curRound.pool!
                    : curRound.options!;
              return items.map((o, i) => (
                <AnswerOrb
                  key={`${S.current.roundIdx}-${i}`}
                  position={positions[i]}
                  emoji={o.emoji}
                  caption={o.caption}
                  color={accent[S.current.zone!]}
                  status={orbStatus(i)}
                  bobSeed={i * 0.7}
                  onPick={() => pick(i)}
                />
              ));
            })()
          )}
        </group>
      )}
    </group>
  );
}

function Ticker({ fnRef }: { fnRef: React.MutableRefObject<(dt: number) => void> }) {
  useFrame((_, dt) => fnRef.current(Math.min(dt, 0.05)));
  return null;
}
