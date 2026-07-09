// ---------------------------------------------------------------------------
// The embodied quest runner. This lives INSIDE the 3D canvas and turns the old
// flashcard pop-ups into things you do in the world:
//   • A friend stands on each island. Walk Nilu up to one to begin its lesson.
//   • Answers are glowing orbs out in the meadow/forest/etc. You choose by
//     WALKING Nilu into an orb (or tapping it). Right → it blooms and rises;
//     "not yet" → a gentle wobble, never a buzzer, never a loss.
//   • Calm Cove uses a breathing bubble instead of orbs.
// It reads Nilu's live position every frame (playerState.beluPos) and reports a
// finished level back up so the island blooms and Nilu grows.
// ---------------------------------------------------------------------------

import { useRef, useState, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLANDS } from '../worldConfig';
import { beluPos, dynamicSolids } from '../playerState';
import type { ActivityZone } from '../../belu/progress';
import type { BeluEmotion } from '../../BeluCharacter';
import { getQuest, starsFromSlips, type Quest, type QuestRound, type RoundKind } from './quests';
import AnswerOrb, { type OrbStatus } from './AnswerOrb';
import QuestNPC, { type Mood } from './QuestNPC';
import BreatheOrb from './BreatheOrb';
import CarryItem from './CarryItem';
import CarrySlot, { type SlotStatus } from './CarrySlot';

const ALL_ZONES: ActivityZone[] = [
  'meadow', 'mountain', 'cove', 'forest', 'shore',
  'school', 'afternoon', 'night',
  'garden', 'deepforest', 'lagoon', 'bay',
];

// idle "host" friends so each island feels inhabited before you arrive
const HOSTS: Record<ActivityZone, { face: string; mood: Mood }> = {
  meadow: { face: '🐥', mood: 'happy' },
  mountain: { face: '🐿️', mood: 'happy' },
  cove: { face: '🐢', mood: 'calm' },
  forest: { face: '🦊', mood: 'happy' },
  shore: { face: '🦀', mood: 'happy' },
  school: { face: '🦉', mood: 'happy' },
  afternoon: { face: '🐕', mood: 'happy' },
  night: { face: '🐑', mood: 'calm' },
  garden: { face: '🦋', mood: 'happy' },
  deepforest: { face: '🦌', mood: 'happy' },
  lagoon: { face: '🐬', mood: 'calm' },
  bay: { face: '🦜', mood: 'happy' },
};

const PICK_RADIUS = 2.4; // how close Nilu must walk to choose an orb (generous +
//                          overlapping so you can never thread between orbs)
const ORB_DIST = 2.4; // orb arc distance out in front of the friend
const ORB_H = 1.0; // orb float height above the island top (near Nilu's body)

// Adjacent-choice spacing: a joystick can't reliably steer between two things
// whose walk-in circles overlap. PICK_RADIUS is 2.4, so two centres closer
// than 4.8 apart are ambiguous — a parent reported exactly this on Forest's
// word orbs ("too close together to navigate precisely"). 5.0 gives clean
// daylight between every pair while staying inside the smallest island's
// walkable radius (8.5) even at the largest option count QuestLayer ever
// lays out (4, for a couple of Sleepy Island sequence rounds).
const ORB_SPACING = 5.0;

// carry/sort: items sit further out on their own pedestals; the delivery pads
// (numbered slots or labeled tables) sit a bit closer to the friend, so the
// child's walk naturally reads as "pick up, then bring it in". Items get the
// same ≥5-apart rule as orbs; pads (fewer, and only ever a target, never a
// multi-way choice to distinguish) get a slightly tighter ≥4.
const CARRY_ITEM_DIST = 5.4;
const CARRY_SPACING = 5.0;
const CARRY_SLOT_DIST = 2.4;
const SLOT_SPACING = 4.2;
// steps: a little path of stones receding from the friend, each a touch
// higher than the last — a gentle rising staircase to walk in order. This is
// a single-file path (not a side-by-side choice fan), so the ≥5 rule doesn't
// apply the same way; the fix here is nearest-match picking (below) rather
// than spacing, since widening it enough to beat PICK_RADIUS would push the
// last stone off the smaller islands.
const STEP_DIST = ORB_DIST + 0.4;
const STEP_SPACING = 1.9;
const STEP_RISE = 0.28;

interface Layout {
  positions: [number, number, number][];
}

function orbCount(round: QuestRound): number {
  if (round.kind === 'choice') return round.options?.length ?? 0;
  if (round.kind === 'sequence') return round.pool?.length ?? 0;
  if (round.kind === 'multiPick') return round.options?.length ?? 0;
  return 0;
}

/** Lay `n` things out in an arc at `dist` in front of the friend, facing
 *  Nilu's approach (the same fan used for answer orbs, carry items/slots,
 *  and sort tables — only the distance + spacing differ). `spacing` is the
 *  centre-to-centre gap between adjacent things, chosen by the caller so it
 *  clears PICK_RADIUS with real room (see the constants above). */
function layoutArc(zone: ActivityZone, n: number, dist: number, spacing: number = ORB_SPACING): Layout {
  const isl = ISLANDS[zone];
  // approach direction = from the island centre toward home (0,0)
  const len = Math.hypot(isl.cx, isl.cz) || 1;
  const ax = -isl.cx / len;
  const az = -isl.cz / len;
  // perpendicular (for spreading things left/right)
  const px = -az;
  const pz = ax;
  const positions: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const frac = n === 1 ? 0 : i / (n - 1) - 0.5;
    const off = frac * (n - 1) * spacing;
    const x = isl.cx + ax * dist + px * off;
    const z = isl.cz + az * dist + pz * off;
    positions.push([x, isl.top + ORB_H, z]);
  }
  return { positions };
}

/** Lay the answer orbs out in an arc in front of the friend. */
function layoutOrbs(zone: ActivityZone, n: number): Layout {
  return layoutArc(zone, n, ORB_DIST, ORB_SPACING);
}

/** A little path of stepping stones receding from the friend, rising as it
 *  goes — purely a visual staircase feel (proximity-triggered, like orbs). */
function layoutSteps(zone: ActivityZone, n: number): Layout {
  const isl = ISLANDS[zone];
  const len = Math.hypot(isl.cx, isl.cz) || 1;
  const ax = -isl.cx / len;
  const az = -isl.cz / len;
  const positions: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const dist = STEP_DIST + i * STEP_SPACING;
    positions.push([isl.cx + ax * dist, isl.top + ORB_H * 0.6 + i * STEP_RISE, isl.cz + az * dist]);
  }
  return { positions };
}

/** Find the CLOSEST candidate to Nilu within `radius`, or -1. Each candidate
 *  is `[id, position]` — `id` is whatever the caller wants back (an item's
 *  original index, a pad number, ...). Several rounds lay pedestals/pads
 *  close enough together that their walk-in circles overlap (that's fine —
 *  it's what makes picking feel forgiving) but picking must always resolve
 *  to the thing Nilu is actually nearest to, never just the first one
 *  checked in array order — otherwise a child standing right on item B can
 *  end up "picking up" item A because it happened to be checked first. */
function nearestWithin(
  candidates: [id: number, pos: [number, number, number]][],
  radius: number,
): number {
  let best = -1;
  let bestD = radius;
  for (const [id, p] of candidates) {
    const d = Math.hypot(beluPos.x - p[0], beluPos.z - p[2]);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

/** Deterministic shuffle (no Math.random at render/module time — like the
 *  rest of the world). Same round always lays its pedestals out the same
 *  way, so it's stable across re-renders but still varies per round/level. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  return arr
    .map((v, i) => ({ v, k: Math.sin((seed + 1) * 12.9898 + i * 78.233) }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.v);
}

/** A short on-screen hint per round kind (choice/sequence/multiPick already
 *  read clearly from their instruction line alone). */
function hintFor(kind: RoundKind): string | undefined {
  switch (kind) {
    case 'carry':
      return 'Walk into a thing to pick it up, then carry it to the right number!';
    case 'sort':
      return 'Walk into a thing to pick it up, then carry it to the table it belongs on!';
    case 'steps':
      return 'Walk onto each stone in order — 1, 2, 3…';
    default:
      return undefined;
  }
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
  /** carry/sort: index into round.items currently hovering over Nilu's head, or null */
  carrying: number | null;
  /** steps: how many stones have been walked in order so far */
  stepIdx: number;
  /** steps: consecutive out-of-order taps (a slip only counts after 2 in a row) */
  stepWrongStreak: number;
  /** carry/sort/steps: which slot/table/stone is wobbling right now, or -1 */
  wrongSlot: number;
  wrongSlotUntil: number;
  /** stuck-help: clock time of the last correct pick/delivery/step (or round
   *  start) — the two-stage help escalation counts idle time from here */
  lastProgressAt: number;
  /** stuck-help: 0 = nothing yet, 1 = coach hint + beacon shown, 2 = "Help
   *  me" button offered, 3 = help already used this round (one per round) */
  helpStage: 0 | 1 | 2 | 3;
  /** stuck-help: true while the assisted "watch me" animation is playing,
   *  between tapping Help me and the round actually completing */
  helping: boolean;
  helpFinishAt: number;
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
  /** the child has been stuck long enough that a "🤝 Help me" button should
   *  appear on the quest card (two-stage stuck-help escalation) */
  helpOffered?: boolean;
}

// Stuck-help timing: a coach hint + spotlight at 18s without progress, then a
// "Help me" button at 18s more (36s total). Reset on every correct pick,
// delivery or step so a child who's actively working never sees it.
const HELP_HINT_AT = 18;
const HELP_BUTTON_AT = 36;
// how long the assisted "watch me" animation plays before the round
// actually completes, once Help me is tapped
const HELP_ANIM_TIME = 1.6;

interface Props {
  islandNextLevel: Record<ActivityZone, number>;
  paused: boolean;
  reduceMotion: boolean;
  sound: boolean;
  speak: (line: string) => void;
  setEmotion: (e: BeluEmotion) => void;
  playSound: (kind: 'tap' | 'correct' | 'star' | 'levelup' | 'growup') => void;
  onComplete: (zone: ActivityZone, level: number, stars: number, moment: string, slips?: number) => void;
  onStatus: (s: QuestStatus | null) => void;
  /** which islands this layer owns (others are handled elsewhere, e.g. StoryLayer) */
  zones?: ActivityZone[];
  /** the DOM "🤝 Help me" button (rendered by QuestPanel in index.tsx) calls
   *  this ref when tapped. Assigned every render this layer is active, so it
   *  always points at whichever quest layer currently owns the on-screen
   *  status card (StoryLayer/ForestLayer/CoveLayer don't use it). */
  helpRequestRef?: MutableRefObject<() => void>;
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
    carrying: null, stepIdx: 0, stepWrongStreak: 0, wrongSlot: -1, wrongSlotUntil: 0,
    lastProgressAt: 0, helpStage: 0, helping: false, helpFinishAt: 0,
  });

  // The frame logic is re-bound every render so it never closes over stale
  // props; the <Ticker> below just calls it.
  const frame = useRef<(dt: number) => void>(() => {});

  const curQuest: Quest | null = S.current.zone ? getQuest(S.current.zone, S.current.level) : null;
  const curRound: QuestRound | null = curQuest ? curQuest.rounds[S.current.roundIdx] : null;

  // wire the DOM "🤝 Help me" button to this layer only while it's the one
  // actually running a quest — StoryLayer/ForestLayer/CoveLayer never touch
  // this ref, so whichever of them (or QuestLayer) is active always owns it
  if (props.helpRequestRef && S.current.zone) {
    props.helpRequestRef.current = () => doHelp();
  }

  function resetRound() {
    S.current.seqDone = [];
    S.current.picked = new Set();
    S.current.solved = false;
    S.current.wrongIdx = -1;
    S.current.carrying = null;
    S.current.stepIdx = 0;
    S.current.stepWrongStreak = 0;
    S.current.wrongSlot = -1;
    S.current.wrongSlotUntil = 0;
    S.current.lastProgressAt = S.current.clock;
    S.current.helpStage = 0;
    S.current.helping = false;
    S.current.helpFinishAt = 0;
  }

  // stuck-help: call whenever the child makes REAL progress (a correct pick,
  // delivery or step) so the 18s/36s escalation timer restarts and any
  // coach hint/beacon already shown clears.
  function recordProgress() {
    S.current.lastProgressAt = S.current.clock;
    if (S.current.helpStage > 0 && S.current.helpStage < 3) S.current.helpStage = 0;
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
    const round = q.rounds[S.current.roundIdx];
    props.onStatus({
      zone: z, title: isl.label, emoji: isl.emoji, accent: isl.accent,
      level: S.current.level, instruction, step: S.current.roundIdx,
      total: q.rounds.length, phase, hint: hintFor(round.kind),
      helpOffered: S.current.helpStage >= 2,
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
    props.onComplete(zone, level, stars, q.moment, S.current.slips);
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

  // carry/sort's version of `slip` — the wobble targets a pad/table (not an
  // orb index), and the coaching line is passed in so it can name the thing.
  function carrySlip(slotIdx: number, message: string) {
    const st = S.current;
    st.slips += 1;
    st.wrongSlot = slotIdx;
    st.wrongSlotUntil = st.clock + 0.5;
    st.lockUntil = st.clock + 0.45;
    props.playSound('tap');
    props.setEmotion('curious');
    props.speak(message);
    bump();
  }

  /** carry: walk into items to pick them up (one at a time — walking into a
   *  new one politely swaps), then walk into pad 1, 2, 3… in that exact
   *  order. The array order of `round.items` IS the correct delivery order. */
  function carryFrame(st: State, round: QuestRound) {
    const items = round.items!;
    const n = items.length;
    const seed = st.roundIdx * 7 + st.level * 3 + (st.zone?.length ?? 0);
    const perm = seededShuffle(items.map((_, i) => i), seed);
    const itemPositions = layoutArc(st.zone!, n, CARRY_ITEM_DIST, CARRY_SPACING).positions;
    const slotPositions = layoutArc(st.zone!, n, CARRY_SLOT_DIST, SLOT_SPACING).positions;

    if (st.carrying == null) {
      const candidates: [number, [number, number, number]][] = [];
      for (let p = 0; p < n; p++) {
        const idx = perm[p];
        if (st.seqDone.includes(items[idx].caption ?? String(idx))) continue;
        candidates.push([idx, itemPositions[p]]);
      }
      const near = nearestWithin(candidates, PICK_RADIUS);
      if (near >= 0) {
        st.carrying = near;
        props.playSound('tap');
        st.lockUntil = st.clock + 0.3;
        recordProgress();
        bump();
      }
      return;
    }

    // already carrying something — walking into a different, unplaced item
    // swaps politely (no penalty, it's still just one thing at a time)
    const swapCandidates: [number, [number, number, number]][] = [];
    for (let p = 0; p < n; p++) {
      const idx = perm[p];
      if (idx === st.carrying || st.seqDone.includes(items[idx].caption ?? String(idx))) continue;
      swapCandidates.push([idx, itemPositions[p]]);
    }
    const swap = nearestWithin(swapCandidates, PICK_RADIUS);
    if (swap >= 0) {
      st.carrying = swap;
      props.playSound('tap');
      st.lockUntil = st.clock + 0.3;
      bump();
      return;
    }

    // walking onto a numbered pad — right item + right pad (the next one in
    // order) delivers it; anything else is a gentle "not yet, try again"
    const slotCandidates: [number, [number, number, number]][] = slotPositions.map((pos, s) => [s, pos]);
    const s = nearestWithin(slotCandidates, PICK_RADIUS);
    if (s >= 0) {
      const expected = st.seqDone.length;
      if (s === expected && st.carrying === expected) {
        st.seqDone.push(items[expected].caption ?? String(expected));
        st.carrying = null;
        props.playSound('correct');
        recordProgress();
        if (st.seqDone.length >= n) {
          solveRound(round.doneLine ?? 'Perfect! Everything is in its place!');
        } else {
          st.lockUntil = st.clock + 0.3;
          props.setEmotion('happy');
          bump();
        }
      } else {
        st.carrying = null; // returns to its pedestal
        carrySlip(s, 'Hmm — what comes first?');
      }
    }
  }

  /** sort: like carry, but delivery is by which table the item belongs on —
   *  any order is fine, there's no sequence to keep. */
  function sortFrame(st: State, round: QuestRound) {
    const items = round.items!;
    const tables = round.tables!;
    const n = items.length;
    const seed = st.roundIdx * 11 + st.level * 5 + (st.zone?.length ?? 0);
    const perm = seededShuffle(items.map((_, i) => i), seed);
    const itemPositions = layoutArc(st.zone!, n, CARRY_ITEM_DIST, CARRY_SPACING).positions;
    const tablePositions = layoutArc(st.zone!, tables.length, CARRY_SLOT_DIST, SLOT_SPACING).positions;

    if (st.carrying == null) {
      const candidates: [number, [number, number, number]][] = [];
      for (let p = 0; p < n; p++) {
        const idx = perm[p];
        if (st.seqDone.includes(items[idx].caption ?? String(idx))) continue;
        candidates.push([idx, itemPositions[p]]);
      }
      const near = nearestWithin(candidates, PICK_RADIUS);
      if (near >= 0) {
        st.carrying = near;
        props.playSound('tap');
        st.lockUntil = st.clock + 0.3;
        recordProgress();
        bump();
      }
      return;
    }

    const swapCandidates: [number, [number, number, number]][] = [];
    for (let p = 0; p < n; p++) {
      const idx = perm[p];
      if (idx === st.carrying || st.seqDone.includes(items[idx].caption ?? String(idx))) continue;
      swapCandidates.push([idx, itemPositions[p]]);
    }
    const swap = nearestWithin(swapCandidates, PICK_RADIUS);
    if (swap >= 0) {
      st.carrying = swap;
      props.playSound('tap');
      st.lockUntil = st.clock + 0.3;
      bump();
      return;
    }

    const tableCandidates: [number, [number, number, number]][] = tablePositions.map((pos, t) => [t, pos]);
    const t = nearestWithin(tableCandidates, PICK_RADIUS);
    if (t >= 0) {
      const carried = items[st.carrying];
      if (carried.table === t) {
        st.seqDone.push(carried.caption ?? String(st.carrying));
        st.carrying = null;
        props.playSound('correct');
        recordProgress();
        if (st.seqDone.length >= n) {
          solveRound(round.doneLine ?? 'Everything sorted!');
        } else {
          st.lockUntil = st.clock + 0.3;
          props.setEmotion('happy');
          bump();
        }
      } else {
        st.carrying = null;
        carrySlip(t, `Hmm — where does the ${carried.caption ?? 'thing'} go?`);
      }
    }
  }

  /** steps: just walk the stones 1→2→3… — no carrying. Stepping ahead out of
   *  order gets a gentle wobble + coaching line every time, but only counts
   *  as a real slip after two wrong steps in a row (adjacent-number mixups
   *  are expected and shouldn't cost stars). Stepping on an already-done
   *  stone is simply ignored. */
  function stepsFrame(st: State, round: QuestRound) {
    const n = round.count ?? 4;
    const positions = layoutSteps(st.zone!, n).positions;
    const expected = st.stepIdx;
    // this is a receding single-file path (not a side-by-side fan), so
    // adjacent stones' walk-in circles can overlap however close they sit —
    // always resolve to the NEAREST stone, never the first index checked,
    // so standing on stone 3 can't get silently swallowed by stone 2's radius.
    const candidates: [number, [number, number, number]][] = positions.map((pos, i) => [i, pos]);
    const i = nearestWithin(candidates, PICK_RADIUS);
    if (i < 0) return;
    if (i === expected) {
      st.stepIdx += 1;
      st.stepWrongStreak = 0;
      const label = round.labels?.[i] ?? String(i + 1);
      props.playSound(st.stepIdx >= n ? 'star' : 'correct');
      recordProgress();
      if (st.stepIdx >= n) {
        solveRound(round.doneLine ?? 'You did every step!');
      } else {
        props.speak(`${label}!`);
        st.lockUntil = st.clock + 0.35;
        props.setEmotion('happy');
        bump();
      }
    } else if (i > expected) {
      st.stepWrongStreak += 1;
      st.wrongSlot = i;
      st.wrongSlotUntil = st.clock + 0.5;
      st.lockUntil = st.clock + 0.4;
      if (st.stepWrongStreak >= 2) {
        st.slips += 1;
        st.stepWrongStreak = 0;
      }
      props.playSound('tap');
      props.setEmotion('curious');
      props.speak('Which number comes next?');
      bump();
    }
    // stepping on an already-done stone (i < expected): no reaction
  }

  function pick(i: number) {
    const st = S.current;
    if (!curRound || st.solved || st.clock < st.lockUntil) return;
    if (curRound.kind === 'choice') {
      const o = curRound.options![i];
      if (o.correct) {
        props.playSound('correct');
        recordProgress();
        solveRound(curRound.doneLine ?? 'Yes! You got it!');
      } else slip(i);
    } else if (curRound.kind === 'sequence') {
      const cap = curRound.pool![i].caption ?? '';
      const expected = curRound.order![st.seqDone.length];
      if (cap === expected && !st.seqDone.includes(cap)) {
        st.seqDone.push(cap);
        props.playSound('correct');
        recordProgress();
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
      recordProgress();
      if (st.picked.size >= (curRound.picks ?? 1)) {
        solveRound(curRound.doneLine ?? 'Wonderful!');
      } else {
        st.lockUntil = st.clock + 0.3;
        props.setEmotion('happy');
        bump();
      }
    }
  }

  // ---- stuck-help ----------------------------------------------------------

  /** What's the single correct next thing to do right now, in plain words?
   *  Derived entirely from round data — no per-quest authoring needed. Used
   *  both for the Stage-1 coach hint and to know where to draw the beacon. */
  function stuckHint(): { text: string; kind: 'orb' | 'carryItem' | 'carrySlot' | 'sortTable' | 'step'; idx: number } | null {
    const st = S.current;
    if (!curRound) return null;
    if (curRound.kind === 'choice') {
      const idx = curRound.options!.findIndex((o) => o.correct);
      if (idx < 0) return null;
      const cap = curRound.options![idx].caption;
      return { text: cap ? `${cap}! Walk to it!` : 'Walk to the glowing one!', kind: 'orb', idx };
    }
    if (curRound.kind === 'sequence') {
      const nextCap = curRound.order![st.seqDone.length];
      const idx = curRound.pool!.findIndex((o) => o.caption === nextCap);
      if (idx < 0) return null;
      return { text: `"${nextCap}" next! Walk to it!`, kind: 'orb', idx };
    }
    if (curRound.kind === 'multiPick') {
      const idx = curRound.options!.findIndex((_, i) => !st.picked.has(i));
      if (idx < 0) return null;
      const cap = curRound.options![idx].caption;
      return { text: cap ? `Try ${cap}!` : 'Walk to one you haven’t tried!', kind: 'orb', idx };
    }
    if (curRound.kind === 'carry') {
      const items = curRound.items!;
      if (st.carrying != null) {
        return { text: `Carry it to spot ${st.seqDone.length + 1}!`, kind: 'carrySlot', idx: st.seqDone.length };
      }
      const idx = st.seqDone.length;
      if (idx >= items.length) return null;
      const it = items[idx];
      return { text: `The ${it.caption ?? 'thing'} goes next! Walk to it ${it.emoji}!`, kind: 'carryItem', idx };
    }
    if (curRound.kind === 'sort') {
      const items = curRound.items!;
      const tables = curRound.tables!;
      if (st.carrying != null) {
        const t = items[st.carrying].table ?? 0;
        const tCap = tables[t]?.caption;
        return { text: tCap ? `Carry it to ${tCap}!` : 'Carry it to its table!', kind: 'sortTable', idx: t };
      }
      const idx = items.findIndex((it, i) => !st.seqDone.includes(it.caption ?? String(i)));
      if (idx < 0) return null;
      const it = items[idx];
      return { text: `The ${it.caption ?? 'thing'} goes next! Walk to it ${it.emoji}!`, kind: 'carryItem', idx };
    }
    if (curRound.kind === 'steps') {
      const label = curRound.labels?.[st.stepIdx] ?? String(st.stepIdx + 1);
      return { text: `Walk to ${label}!`, kind: 'step', idx: st.stepIdx };
    }
    return null;
  }

  /** Fill in the whole round as if the child had done it, then solve — used
   *  after the "watch me" assist animation. Never counts as a slip. */
  function completeRoundAssisted() {
    const st = S.current;
    st.helping = false;
    if (!curRound || st.solved) return;
    if (curRound.kind === 'sequence') {
      st.seqDone = [...curRound.order!];
    } else if (curRound.kind === 'multiPick') {
      curRound.options!.forEach((_, i) => st.picked.add(i));
    } else if (curRound.kind === 'carry' || curRound.kind === 'sort') {
      st.seqDone = curRound.items!.map((it, i) => it.caption ?? String(i));
      st.carrying = null;
    } else if (curRound.kind === 'steps') {
      st.stepIdx = curRound.count ?? 4;
    }
    props.playSound('star');
    solveRound(curRound.doneLine ?? 'Now you did it! 💙');
  }

  /** Tapping the quest card's "🤝 Help me" button (Stage 2). Nilu's friend
   *  does it together with her: a short "watch me" beat, then the round
   *  finishes for real — stars are never docked for asking for help. */
  function doHelp() {
    const st = S.current;
    if (!st.zone || st.solved || st.helpStage < 2 || st.helping) return;
    st.helpStage = 3; // used — one help per round
    st.helping = true;
    st.helpFinishAt = st.clock + HELP_ANIM_TIME;
    props.setEmotion('curious');
    props.speak('Let’s do it together! Watch me…');
    emitStatus('question', curQuest ? curQuest.rounds[st.roundIdx].say : '');
    bump();
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
    if (st.wrongSlot >= 0 && st.clock > st.wrongSlotUntil) {
      st.wrongSlot = -1;
      bump();
    }

    // a solved round animates, then advances
    if (st.solved && st.clock >= st.advanceAt) {
      advance();
      return;
    }

    // which zone island is Nilu standing on?
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

    // re-arm a just-completed island once Nilu wanders off it
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

    // stuck-help: two-stage escalation. Breathe rounds auto-advance on their
    // own (no "stuck" state is possible), so they're excluded.
    if (round.kind !== 'breathe' && !st.solved && !st.helping) {
      const stuckFor = st.clock - st.lastProgressAt;
      if (st.helpStage < 1 && stuckFor >= HELP_HINT_AT) {
        st.helpStage = 1;
        const h = stuckHint();
        if (h) props.speak(h.text);
        bump();
      } else if (st.helpStage === 1 && stuckFor >= HELP_BUTTON_AT) {
        st.helpStage = 2;
        emitStatus('question', round.say);
        bump();
      }
    }

    // mid "watch me" assist — freeze normal picking until it lands, then
    // fill in the round for real (never counted as a slip)
    if (st.helping) {
      if (st.clock >= st.helpFinishAt) completeRoundAssisted();
      return;
    }

    if (round.kind === 'breathe' || st.solved || st.clock < st.lockUntil) return;
    if (round.kind === 'carry') {
      carryFrame(st, round);
      return;
    }
    if (round.kind === 'sort') {
      sortFrame(st, round);
      return;
    }
    if (round.kind === 'steps') {
      stepsFrame(st, round);
      return;
    }
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

  // Stage-1 stuck-help spotlight target (recomputed each render so it tracks
  // live state — cheap, and only non-null while genuinely stuck)
  const help = S.current.helpStage >= 1 && !S.current.solved ? stuckHint() : null;

  const accent: Record<ActivityZone, string> = {
    meadow: ISLANDS.meadow.accent,
    mountain: ISLANDS.mountain.accent,
    cove: ISLANDS.cove.accent,
    forest: ISLANDS.forest.accent,
    shore: ISLANDS.shore.accent,
    school: ISLANDS.school.accent,
    afternoon: ISLANDS.afternoon.accent,
    night: ISLANDS.night.accent,
    garden: ISLANDS.garden.accent,
    deepforest: ISLANDS.deepforest.accent,
    lagoon: ISLANDS.lagoon.accent,
    bay: ISLANDS.bay.accent,
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
          ) : curRound.kind === 'carry' ? (
            (() => {
              const st = S.current;
              const zone = S.current.zone!;
              const items = curRound.items!;
              const n = items.length;
              const seed = st.roundIdx * 7 + st.level * 3 + zone.length;
              const perm = seededShuffle(items.map((_, i) => i), seed);
              const itemPositions = layoutArc(zone, n, CARRY_ITEM_DIST, CARRY_SPACING).positions;
              const slotPositions = layoutArc(zone, n, CARRY_SLOT_DIST, SLOT_SPACING).positions;
              return (
                <group>
                  {perm.map((idx, p) => {
                    if (st.seqDone.includes(items[idx].caption ?? String(idx))) return null;
                    return (
                      <CarryItem
                        key={`carry-item-${idx}`}
                        pedestalPosition={itemPositions[p]}
                        emoji={items[idx].emoji}
                        caption={items[idx].caption}
                        color={accent[zone]}
                        carrying={st.carrying === idx}
                        reduceMotion={props.reduceMotion}
                        bobSeed={p * 0.6}
                        isNext={st.carrying == null && idx === st.seqDone.length}
                      />
                    );
                  })}
                  {slotPositions.map((pos, s) => {
                    const filled = s < st.seqDone.length;
                    const next = s === st.seqDone.length;
                    const status: SlotStatus = filled ? 'filled' : st.wrongSlot === s ? 'wrong' : next ? 'next' : 'idle';
                    return (
                      <CarrySlot
                        key={`carry-slot-${s}`}
                        position={pos}
                        number={s + 1}
                        status={status}
                        color={accent[zone]}
                        reduceMotion={props.reduceMotion}
                      />
                    );
                  })}
                  {help && help.kind === 'carryItem' && (
                    <HelpBeacon position={itemPositions[perm.indexOf(help.idx)]} reduceMotion={props.reduceMotion} />
                  )}
                  {help && help.kind === 'carrySlot' && (
                    <HelpBeacon position={slotPositions[help.idx]} reduceMotion={props.reduceMotion} />
                  )}
                </group>
              );
            })()
          ) : curRound.kind === 'sort' ? (
            (() => {
              const st = S.current;
              const zone = S.current.zone!;
              const items = curRound.items!;
              const tables = curRound.tables!;
              const n = items.length;
              const seed = st.roundIdx * 11 + st.level * 5 + zone.length;
              const perm = seededShuffle(items.map((_, i) => i), seed);
              const itemPositions = layoutArc(zone, n, CARRY_ITEM_DIST, CARRY_SPACING).positions;
              const tablePositions = layoutArc(zone, tables.length, CARRY_SLOT_DIST, SLOT_SPACING).positions;
              return (
                <group>
                  {perm.map((idx, p) => {
                    if (st.seqDone.includes(items[idx].caption ?? String(idx))) return null;
                    return (
                      <CarryItem
                        key={`sort-item-${idx}`}
                        pedestalPosition={itemPositions[p]}
                        emoji={items[idx].emoji}
                        caption={items[idx].caption}
                        color={accent[zone]}
                        carrying={st.carrying === idx}
                        reduceMotion={props.reduceMotion}
                        bobSeed={p * 0.6}
                      />
                    );
                  })}
                  {tables.map((tb, t) => (
                    <CarrySlot
                      key={`sort-table-${t}`}
                      position={tablePositions[t]}
                      status={st.wrongSlot === t ? 'wrong' : 'idle'}
                      color={accent[zone]}
                      reduceMotion={props.reduceMotion}
                      emoji={tb.emoji}
                      caption={tb.caption}
                    />
                  ))}
                  {help && help.kind === 'carryItem' && (
                    <HelpBeacon position={itemPositions[perm.indexOf(help.idx)]} reduceMotion={props.reduceMotion} />
                  )}
                  {help && help.kind === 'sortTable' && (
                    <HelpBeacon position={tablePositions[help.idx]} reduceMotion={props.reduceMotion} />
                  )}
                </group>
              );
            })()
          ) : curRound.kind === 'steps' ? (
            (() => {
              const st = S.current;
              const zone = S.current.zone!;
              const n = curRound.count ?? 4;
              const positions = layoutSteps(zone, n).positions;
              return (
                <group>
                  {positions.map((pos, i) => {
                    const done = i < st.stepIdx;
                    const next = i === st.stepIdx;
                    const status: SlotStatus = done ? 'filled' : st.wrongSlot === i ? 'wrong' : next ? 'next' : 'idle';
                    return (
                      <CarrySlot
                        key={`step-${i}`}
                        position={pos}
                        number={i + 1}
                        label={curRound.labels?.[i]}
                        status={status}
                        color={accent[zone]}
                        reduceMotion={props.reduceMotion}
                      />
                    );
                  })}
                  {help && help.kind === 'step' && (
                    <HelpBeacon position={positions[help.idx]} reduceMotion={props.reduceMotion} />
                  )}
                </group>
              );
            })()
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
              return (
                <group>
                  {items.map((o, i) => (
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
                  ))}
                  {help && help.kind === 'orb' && (
                    <HelpBeacon position={positions[help.idx]} reduceMotion={props.reduceMotion} />
                  )}
                </group>
              );
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

// Stage-1 stuck-help spotlight: a bright pulsing gold beacon dropped on top
// of whatever the child should walk to next. Static (no pulse) under
// reduce-motion so it stays a clear, calm spotlight rather than a distraction.
function HelpBeacon({ position, reduceMotion }: { position: [number, number, number]; reduceMotion: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (!ring.current) return;
    if (reduceMotion) {
      ring.current.scale.setScalar(1.3);
    } else {
      ring.current.scale.setScalar(1.1 + Math.sin(t.current * 3.2) * 0.25);
    }
  });
  return (
    <group position={position}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.1, 0]}>
        <ringGeometry args={[0.55, 0.78, 28]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color="#ffe066" intensity={1.4} distance={4} position={[0, 1.2, 0]} />
    </group>
  );
}
