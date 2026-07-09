// ---------------------------------------------------------------------------
// Calm Cove — "calm the storm" (self-regulation).
//   • The cove water starts agitated: a dark, choppy plane with cold rain.
//   • Nilu arrives → a BreatheOrb appears. As the child FOLLOWS the breaths, the
//     sea visibly CALMS each cycle — the waves settle, the colour brightens from
//     stormy grey-blue toward bright cyan.
//   • When the sea is fully calm, fish leap and a rainbow arcs over the cove, and
//     Nilu is calm.
//   • Higher levels add a gentle pre-step before breathing (a body-scan spot, a
//     calm strategy, or a 3-part calm plan) walked to as glowing AnswerOrb totems.
// No quiz feel, no fail: you literally calm the sea by breathing. Wrong taps just
// wiggle (handled by AnswerOrb) and earn a kind word — never a buzzer.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLANDS } from '../worldConfig';
import { beluPos, dynamicSolids } from '../playerState';
import type { BeluEmotion } from '../../BeluCharacter';
import AnswerOrb, { type OrbStatus } from './AnswerOrb';
import BreatheOrb from './BreatheOrb';
import { makeLabelTexture } from './emojiTexture';
import { COVE_LEVELS, SHELL_FINDS, DOLPHIN_JOKES, type CoveLevel, type CoveTotem } from './coveContent';
import { shellLayout, Shell, StormWaves, DolphinBuddy, PopBubbles, type ShellSpot } from './coveExtras';
import InviteBubble from './InviteBubble';
import type { QuestStatus } from './QuestLayer';

const ZONE = 'cove' as const;
const POSE_HOLD_TICK = 0.9; // seconds between each spoken count of a pose hold
const COUNT_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
const TOTEM_DIST = 3.0; // how far the totems sit out in front, toward home
const TOTEM_SPREAD = 2.9; // sideways gap between totems (no overlap)
const TOTEM_PICK = 1.6; // walk this close to a totem to choose it
const SHELL_FIND = 1.5; // walk this close to a hidden shell to discover it
const INVITE_START = 2.6; // walk this close to the calm-friend to BEGIN (consent)

// stormy → calm colours the water lerps between as breaths complete
const STORM_COLOR = new THREE.Color('#3a4a5e'); // dark, choppy grey-blue
const CALM_COLOR = new THREE.Color('#5fd0e0'); // the cove's bright cyan accent

interface State {
  clock: number;
  active: boolean;
  level: number;
  disarmed: boolean;
  // phase of play within an active session
  phase: 'pre' | 'senses' | 'pose' | 'breathing' | 'done';
  // five-senses grounding round bookkeeping (index of the current step)
  senseIdx: number;
  // "copy the pose" round bookkeeping
  poseHolding: boolean;
  poseDone: boolean;
  poseCountsLeft: number;
  poseNextCountAt: number;
  // how calm the sea is, 0 (full storm) → 1 (fully calm). Animates toward target.
  calm: number;
  calmTarget: number;
  // pre-step bookkeeping
  picked: number[]; // indices of totems walked into (plan can need several)
  wrongIdx: number;
  wrongUntil: number;
  lockUntil: number;
  finishAt: number;
  // hidden treasure shells scattered around the cove
  shells: ShellSpot[];
  shellFound: boolean[]; // parallel to shells
  shellFoundAt: number[]; // clock time each was found (for the pop animation)
  shellCount: number; // how many found this session (for the proud counter)
  sparkleAt: [number, number, number] | null; // where the last shell sparkle burst sits
  sparkleUntil: number;
  // the surprise dolphin buddy + its one-time greeting
  dolphinGreeted: boolean;
  jokeShown: boolean;
}

interface Props {
  level: number;
  paused: boolean;
  speak: (line: string) => void;
  setEmotion: (e: BeluEmotion) => void;
  playSound: (kind: 'tap' | 'correct' | 'star' | 'levelup' | 'growup') => void;
  onComplete: (zone: 'cove', level: number, stars: number, moment: string, slips?: number, calmChoices?: string[]) => void;
  onStatus: (s: QuestStatus | null) => void;
}

function clampLevel(level: number) {
  return Math.max(0, Math.min(COVE_LEVELS.length - 1, level - 1));
}

/** how many totems the pre-step needs walked into before breathing begins */
function needCount(lvl: CoveLevel): number {
  switch (lvl.pre.kind) {
    case 'plan': return lvl.pre.need;
    case 'bodySpot':
    case 'pickOne': return 1;
    default: return 0;
  }
}

function preTotems(lvl: CoveLevel): CoveTotem[] {
  return lvl.pre.kind === 'none' ? [] : lvl.pre.totems;
}

export default function CoveLayer(props: Props) {
  const [, force] = useState(0);
  const bump = () => force((v) => (v + 1) % 1_000_000);
  const S = useRef<State>({
    clock: 0, active: false, level: props.level, disarmed: false,
    phase: 'pre', senseIdx: 0, poseHolding: false, poseDone: false, poseCountsLeft: 0, poseNextCountAt: 0,
    calm: 0, calmTarget: 0, picked: [],
    wrongIdx: -1, wrongUntil: 0, lockUntil: 0, finishAt: 0,
    shells: [], shellFound: [], shellFoundAt: [], shellCount: 0,
    sparkleAt: null, sparkleUntil: 0, dolphinGreeted: false, jokeShown: false,
  });
  const frame = useRef<(dt: number) => void>(() => {});
  const water = useRef<THREE.Mesh>(null);
  const isl = ISLANDS[ZONE];

  // the breathing bubble sits out in front of the friend, toward home (0,0)
  const orbPos = (): [number, number, number] => {
    const len = Math.hypot(isl.cx, isl.cz) || 1;
    return [isl.cx + (-isl.cx / len) * 2.6, isl.top + 2.4, isl.cz + (-isl.cz / len) * 2.6];
  };

  // lay the pre-step totems out in an arc on the home-facing side of the cove
  function totemLayout(n: number): [number, number, number][] {
    const len = Math.hypot(isl.cx, isl.cz) || 1;
    const dx = -isl.cx / len; // toward home
    const dz = -isl.cz / len;
    const px = -dz;
    const pz = dx;
    const out: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const frac = n === 1 ? 0 : i / (n - 1) - 0.5;
      const off = frac * (n - 1) * TOTEM_SPREAD;
      out.push([
        isl.cx + dx * TOTEM_DIST + px * off,
        isl.top + 1.0,
        isl.cz + dz * TOTEM_DIST + pz * off,
      ]);
    }
    return out;
  }

  function emitStatus(phase: 'question' | 'correct', instruction: string, hint?: string) {
    const lvl = COVE_LEVELS[clampLevel(S.current.level)];
    const need = needCount(lvl);
    // step/total reflect the pre-step progress so the task card shows movement
    props.onStatus({
      zone: ZONE, title: isl.label, emoji: isl.emoji, accent: isl.accent,
      level: S.current.level, instruction,
      step: S.current.phase === 'pre' ? S.current.picked.length : need,
      total: Math.max(1, need),
      phase, hint,
    });
  }

  function startSession() {
    const lvl = COVE_LEVELS[clampLevel(props.level)];
    const st = S.current;
    st.active = true;
    st.level = props.level;
    st.picked = [];
    st.wrongIdx = -1;
    st.finishAt = 0;
    st.calm = 0;
    st.calmTarget = 0;
    st.senseIdx = 0;
    st.poseHolding = false;
    st.poseDone = false;
    st.poseCountsLeft = 0;
    st.poseNextCountAt = 0;
    // scatter this level's hidden treasure shells (deterministic per level)
    st.shells = shellLayout(isl.cx, isl.cz, isl.radius, lvl.shells, (props.level + 1) * 5.13);
    st.shellFound = st.shells.map(() => false);
    st.shellFoundAt = st.shells.map(() => -99);
    st.shellCount = 0;
    st.sparkleAt = null;
    st.sparkleUntil = 0;
    st.dolphinGreeted = false;
    st.jokeShown = false;
    props.setEmotion('overwhelmed'); // the sea (and Nilu) start stormy
    props.speak(lvl.intro);
    if (needCount(lvl) > 0) {
      st.phase = 'pre';
      st.lockUntil = st.clock + 0.4;
      emitStatus('question', lvl.intro, preHint(lvl));
    } else {
      // no pre-step → move on to the next round (senses → pose → breathing)
      advancePhase(lvl);
    }
    bump();
  }

  // decide + enter the next round in the sequence: five-senses grounding (if
  // this level has one and it isn't done), then a "copy the pose" hold (if
  // this level has one and it isn't done), then finally the calming breaths.
  function advancePhase(lvl: CoveLevel) {
    const st = S.current;
    if (lvl.senses && lvl.senses.length > 0 && st.senseIdx < lvl.senses.length) {
      st.phase = 'senses';
      const step = lvl.senses[st.senseIdx];
      props.setEmotion('curious');
      props.speak(`Let's notice with our senses! Find something you can ${step.senseLabel} ${step.senseEmoji}`);
      emitStatus('question', `Find something you can ${step.senseLabel} ${step.senseEmoji}`, `Walk to ${step.targetLabel} ${step.targetEmoji}`);
      return;
    }
    if (lvl.pose && !st.poseDone) {
      st.phase = 'pose';
      st.poseHolding = false;
      props.setEmotion('curious');
      props.speak(`Let's do a pose together — ${lvl.pose.name} ${lvl.pose.emoji}! Walk to it.`);
      emitStatus('question', `Walk to the ${lvl.pose.name} pose`, `${lvl.pose.emoji} ${lvl.pose.name}`);
      return;
    }
    st.phase = 'breathing';
    props.setEmotion('calm');
    props.speak(lvl.breatheCue);
    emitStatus('question', lvl.breatheCue, 'Follow the bubble and breathe 🫧');
  }

  // child walked into / tapped the current five-senses target
  function pickSense() {
    const st = S.current;
    if (st.phase !== 'senses' || st.clock < st.lockUntil) return;
    const lvl = COVE_LEVELS[clampLevel(st.level)];
    const steps = lvl.senses ?? [];
    const step = steps[st.senseIdx];
    if (!step) return;
    props.playSound('correct');
    props.setEmotion('happy');
    props.speak(`Yes! You found ${step.targetLabel} with what you ${step.senseLabel.toLowerCase()}. 🌟`);
    st.senseIdx += 1;
    st.lockUntil = st.clock + 0.6;
    if (st.senseIdx >= steps.length) {
      advancePhase(lvl);
    } else {
      const next = steps[st.senseIdx];
      emitStatus('question', `Now find something you can ${next.senseLabel} ${next.senseEmoji}`, `Walk to ${next.targetLabel} ${next.targetEmoji}`);
    }
    bump();
  }

  // child walked into / tapped the pose totem → begin the slow 3-2-1 hold
  function beginPoseHold() {
    const st = S.current;
    if (st.phase !== 'pose' || st.poseHolding || st.poseDone) return;
    const lvl = COVE_LEVELS[clampLevel(st.level)];
    if (!lvl.pose) return;
    st.poseHolding = true;
    st.poseCountsLeft = 3;
    st.poseNextCountAt = st.clock + POSE_HOLD_TICK;
    props.playSound('tap');
    props.speak(lvl.pose.cue);
    emitStatus('question', `Hold your ${lvl.pose.name}…`, 'Nice and steady 💙');
    bump();
  }

  function preHint(lvl: CoveLevel): string {
    switch (lvl.pre.kind) {
      case 'bodySpot': return 'Walk to a body spot to send your calm there 💙';
      case 'pickOne': return 'Walk into one thing that helps you feel calm 💙';
      case 'plan': return `Walk into ${lvl.pre.need} calm things to build your plan 💙`;
      default: return 'Follow the bubble and breathe 🫧';
    }
  }

  function stopSession() {
    const st = S.current;
    st.active = false;
    st.phase = 'pre';
    st.picked = [];
    st.calmTarget = 0;
    props.setEmotion('happy');
    props.onStatus(null);
    bump();
  }

  function finish() {
    const lvl = COVE_LEVELS[clampLevel(S.current.level)];
    // the child's own calm-plan picks (only present on the "plan" pre-step) —
    // saved so a grown-up can later see which strategies their child chose
    const calmChoices = lvl.pre.kind === 'plan'
      ? S.current.picked.map((i) => preTotems(lvl)[i]?.label).filter((l): l is string => !!l)
      : undefined;
    // always errorless: a finished level is always worth 3 stars
    props.onComplete(ZONE, S.current.level, 3, lvl.moment, 0, calmChoices);
    props.speak(lvl.outro);
    S.current.active = false;
    S.current.disarmed = true;
    S.current.phase = 'pre';
    props.onStatus(null);
    bump();
  }

  // child walked into / tapped a pre-step totem
  function pickTotem(i: number) {
    const st = S.current;
    if (st.phase !== 'pre' || st.clock < st.lockUntil) return;
    const lvl = COVE_LEVELS[clampLevel(st.level)];
    const need = needCount(lvl);
    if (st.picked.includes(i)) return; // already chosen — no double counting
    // every totem here is a kind/valid choice (errorless), so picking always helps
    st.picked.push(i);
    st.lockUntil = st.clock + 0.3;
    props.playSound('correct');
    if (st.picked.length >= need) {
      // pre-step complete → move on (senses → pose → breathing)
      st.lockUntil = st.clock + 0.5;
      advancePhase(lvl);
    } else {
      props.setEmotion('happy');
      emitStatus('question', lvl.intro, `Nice! Walk into ${need - st.picked.length} more 💙`);
    }
    bump();
  }

  // child walked near a hidden shell → discover it (chime, sparkle, kind line).
  // Finding shells is pure delight: it's never required and never penalised.
  function findShell(i: number) {
    const st = S.current;
    if (st.shellFound[i]) return;
    st.shellFound[i] = true;
    st.shellFoundAt[i] = st.clock;
    st.shellCount += 1;
    st.sparkleAt = [st.shells[i].x, isl.top + 0.6, st.shells[i].z];
    st.sparkleUntil = st.clock + 1.3;
    props.playSound('star'); // bright chime for treasure
    props.setEmotion('excited');
    props.speak(SHELL_FINDS[(st.shellCount - 1) % SHELL_FINDS.length]);
    bump();
  }

  // BreatheOrb tells us each phase begins; on every "Breathe out" the sea settles
  // one notch (so the child SEES their breathing calm the storm).
  function onBreathPhase(label: string) {
    const st = S.current;
    const lvl = COVE_LEVELS[clampLevel(st.level)];
    if (!label.startsWith('Breathe out')) {
      props.speak(label);
      return;
    }
    // step the calm target up by one breath's worth toward fully calm
    const stepEach = 1 / Math.max(1, lvl.cycles);
    st.calmTarget = Math.min(1, st.calmTarget + stepEach);
    props.playSound('tap'); // soft water "settle" tick
    if (lvl.counting) {
      // counting-breath round: speak the running count instead of the label,
      // with a visual counter shown via the task-card dots/hint
      const breathNum = Math.min(lvl.cycles, Math.round(st.calmTarget * lvl.cycles));
      const word = COUNT_WORDS[breathNum - 1] ?? String(breathNum);
      props.speak(`${word}! 🦋`);
      emitStatus('question', lvl.breatheCue, `Breath ${breathNum} of ${lvl.cycles} 🦋`);
    } else {
      props.speak(label);
    }
    bump();
  }

  function onBreatheDone() {
    const st = S.current;
    st.calmTarget = 1; // sea fully calm
    st.phase = 'done';
    props.setEmotion('calm');
    props.playSound('levelup'); // bigger, brighter chord for the calm payoff
    const lvl = COVE_LEVELS[clampLevel(st.level)];
    emitStatus('correct', lvl.outro, 'The sea is calm 🌈');
    // a touch longer so the surprise dolphin can surface, greet, and play
    st.finishAt = st.clock + 4.2;
    bump();
  }

  frame.current = (dt: number) => {
    const st = S.current;
    // register the cove friend/totems as solids so Nilu walks around them
    const lvl = COVE_LEVELS[clampLevel(st.level)];
    const solids: { x: number; z: number; r: number }[] = [
      { x: isl.cx, z: isl.cz, r: 1.05 }, // the calm-friend at centre
    ];
    if (st.active && st.phase === 'pre') {
      totemLayout(preTotems(lvl).length).forEach((p) => solids.push({ x: p[0], z: p[2], r: 0.7 }));
    } else if (st.active && (st.phase === 'senses' || st.phase === 'pose')) {
      totemLayout(1).forEach((p) => solids.push({ x: p[0], z: p[2], r: 0.7 }));
    }
    dynamicSolids.cove = solids;

    if (props.paused) return;
    st.clock += dt;

    // ease the visible sea-calm toward its target every frame
    st.calm += (st.calmTarget - st.calm) * Math.min(1, dt * 2.2);

    // animate the water mesh: choppy & dark when stormy, flat & bright when calm
    if (water.current) {
      const m = water.current.material as THREE.MeshStandardMaterial;
      m.color.copy(STORM_COLOR).lerp(CALM_COLOR, st.calm);
      m.emissive.copy(CALM_COLOR);
      m.emissiveIntensity = 0.05 + st.calm * 0.35;
      // chop: bob/tilt the plane a lot when stormy, almost still when calm
      const chop = (1 - st.calm) * 0.5;
      water.current.position.y = isl.top - 0.35 + Math.sin(st.clock * 3.2) * chop * 0.25;
      water.current.rotation.x = -Math.PI / 2 + Math.sin(st.clock * 2.1) * chop * 0.06;
      water.current.rotation.z = Math.cos(st.clock * 1.7) * chop * 0.06;
    }

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
      // NO quest ambush: the calm session begins only when the child walks
      // Nilu right up to the calm-friend at the cove centre (consent).
      if (onIsland && !st.disarmed) {
        if (Math.hypot(beluPos.x - isl.cx, beluPos.z - isl.cz) < INVITE_START) startSession();
      }
      return;
    }
    if (dCenter > isl.radius + 1.5) {
      stopSession();
      return;
    }

    // during the pre-step, detect Nilu walking into a totem
    if (st.phase === 'pre' && st.clock >= st.lockUntil) {
      const layout = totemLayout(preTotems(lvl).length);
      let best = -1;
      let bestD = TOTEM_PICK;
      for (let i = 0; i < layout.length; i++) {
        if (st.picked.includes(i)) continue;
        const d = Math.hypot(beluPos.x - layout[i][0], beluPos.z - layout[i][2]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0) pickTotem(best);
    }
    // during the senses round, detect Nilu walking into the current target
    if (st.phase === 'senses' && st.clock >= st.lockUntil) {
      const pos = totemLayout(1)[0];
      const d = Math.hypot(beluPos.x - pos[0], beluPos.z - pos[2]);
      if (d < TOTEM_PICK) pickSense();
    }
    // during the pose round: detect Nilu walking up to begin the hold, then
    // run the slow spoken 3-2-1 count while they hold it
    if (st.phase === 'pose' && !st.poseHolding && !st.poseDone) {
      const pos = totemLayout(1)[0];
      const d = Math.hypot(beluPos.x - pos[0], beluPos.z - pos[2]);
      if (d < TOTEM_PICK) beginPoseHold();
    }
    if (st.phase === 'pose' && st.poseHolding && st.clock >= st.poseNextCountAt) {
      if (st.poseCountsLeft > 0) {
        props.speak(String(st.poseCountsLeft));
        props.playSound('tap');
        emitStatus('question', `Hold your ${lvl.pose!.name}…`, String(st.poseCountsLeft));
        st.poseCountsLeft -= 1;
        st.poseNextCountAt = st.clock + POSE_HOLD_TICK;
      } else {
        st.poseHolding = false;
        st.poseDone = true;
        props.playSound('correct');
        props.setEmotion('excited');
        props.speak(`Lovely ${lvl.pose!.name}! You held so still. 🌟`);
        advancePhase(lvl);
      }
      bump();
    }
    // breathing & done phases drive themselves via BreatheOrb callbacks
  };

  // ---- render ----
  const lvl = COVE_LEVELS[clampLevel(S.current.level)];
  const totems = preTotems(lvl);
  const layout = S.current.active && S.current.phase === 'pre' ? totemLayout(totems.length) : [];
  const singleLayout = S.current.active && (S.current.phase === 'senses' || S.current.phase === 'pose') ? totemLayout(1) : [];
  const senseStep = lvl.senses?.[S.current.senseIdx];
  const calm = S.current.calm;
  const seaCalm = calm > 0.92; // fully-calm celebration threshold

  return (
    <group>
      <Ticker fnRef={frame} />

      {/* the cove water plane — choppy/dark when stormy, bright/flat when calm */}
      <mesh ref={water} position={[isl.cx, isl.top - 0.35, isl.cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isl.radius * 0.92, 48]} />
        <meshStandardMaterial
          color={STORM_COLOR}
          emissive={CALM_COLOR}
          emissiveIntensity={0.05}
          roughness={0.25}
          metalness={0.35}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* cold rain while the sea is still stormy; fades out as it calms */}
      {S.current.active && calm < 0.7 && (
        <Sparkles
          count={40}
          scale={[isl.radius * 1.6, 6, isl.radius * 1.6]}
          size={4}
          speed={2.4}
          opacity={Math.max(0, 0.7 - calm) }
          color="#bcd4e6"
          position={[isl.cx, isl.top + 3, isl.cz]}
        />
      )}

      {/* the calm-friend waves you over — walk right up to it to begin */}
      {!S.current.active && !S.current.disarmed && (
        <InviteBubble
          position={[isl.cx, isl.top + 2.8, isl.cz]}
          ground={[isl.cx, isl.top, isl.cz]}
          color={isl.accent}
        />
      )}

      {/* the calm friend at the cove centre (a gentle floating orb-buddy) */}
      <CalmFriend
        position={[isl.cx, isl.top + 0.9, isl.cz]}
        color={isl.accent}
        calm={calm}
        clock={S.current.clock}
      />

      {/* pre-step totems (body spots / calm strategies) to walk into */}
      {S.current.active && S.current.phase === 'pre' &&
        totems.map((t, i) => {
          const status: OrbStatus = S.current.picked.includes(i)
            ? 'chosen'
            : S.current.wrongIdx === i
              ? 'wrong'
              : 'idle';
          return (
            <AnswerOrb
              key={`${S.current.level}-tot-${i}`}
              position={layout[i]}
              emoji={t.emoji}
              caption={t.label}
              color={isl.accent}
              status={status}
              bobSeed={i * 0.7}
              onPick={() => pickTotem(i)}
            />
          );
        })}

      {/* five-senses grounding round — one tappable target at a time */}
      {S.current.active && S.current.phase === 'senses' && senseStep && singleLayout[0] && (
        <AnswerOrb
          key={`${S.current.level}-sense-${S.current.senseIdx}`}
          position={singleLayout[0]}
          emoji={senseStep.targetEmoji}
          caption={`${senseStep.senseLabel} ${senseStep.targetLabel}`}
          color={isl.accent}
          status="idle"
          onPick={pickSense}
        />
      )}

      {/* "copy the pose" totem — walk to it, then hold through the 3-2-1 count */}
      {S.current.active && S.current.phase === 'pose' && !S.current.poseDone && lvl.pose && singleLayout[0] && (
        <AnswerOrb
          key={`${S.current.level}-pose`}
          position={singleLayout[0]}
          emoji={lvl.pose.emoji}
          caption={lvl.pose.name}
          color={isl.accent}
          status={S.current.poseHolding ? 'chosen' : 'idle'}
          onPick={beginPoseHold}
        />
      )}

      {/* the breathing bubble — appears once we're breathing the storm away */}
      {S.current.active && S.current.phase === 'breathing' && (
        <BreatheOrb
          key={`${S.current.level}-breathe`}
          position={orbPos()}
          cycles={lvl.cycles}
          color={isl.accent}
          onPhase={onBreathPhase}
          onDone={onBreatheDone}
        />
      )}

      {/* celebration when the sea is fully calm: leaping fish + a rainbow */}
      {seaCalm && (
        <>
          <Sparkles count={26} scale={5} size={7} speed={0.5} color="#bff6ff" position={[isl.cx, isl.top + 1.4, isl.cz]} />
          <LeapingFish position={[isl.cx, isl.top, isl.cz]} radius={isl.radius * 0.55} clock={S.current.clock} />
          <Rainbow position={[isl.cx, isl.top + 0.2, isl.cz]} radius={isl.radius * 0.8} />
        </>
      )}
    </group>
  );
}

// A soft, friendly calm-buddy that floats over the cove. It looks worried while
// the sea is stormy and beams a happy face once it's calm — pure primitives.
function CalmFriend({ position, color, calm, clock }: { position: [number, number, number]; color: string; calm: number; clock: number }) {
  const grp = useRef<THREE.Group>(null);
  // swap the face sprite between worried (stormy) and calm (settled)
  const faceTex = useRef<{ stormy: THREE.CanvasTexture; calm: THREE.CanvasTexture }>({
    stormy: makeLabelTexture('😣'),
    calm: makeLabelTexture('😌'),
  });
  useFrame(() => {
    if (!grp.current) return;
    // bob faster/jitterier while stormy, gentle float once calm
    const chop = 1 - calm;
    grp.current.position.y = position[1] + Math.sin(clock * (1.6 + chop * 3)) * (0.08 + chop * 0.12);
  });
  return (
    <group ref={grp} position={position}>
      <mesh>
        <sphereGeometry args={[0.7, 24, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4 + calm * 0.5} roughness={0.3} metalness={0.1} />
      </mesh>
      <sprite position={[0, 0, 0.72]} scale={[1, 1, 1]} renderOrder={11}>
        <spriteMaterial map={calm > 0.6 ? faceTex.current.calm : faceTex.current.stormy} transparent depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}

// A few fish that leap in gentle arcs out of the now-calm water.
function LeapingFish({ position, radius, clock }: { position: [number, number, number]; radius: number; clock: number }) {
  const fish = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!fish.current) return;
    fish.current.children.forEach((child, i) => {
      const phase = (clock * 0.6 + i * 0.5) % 1; // 0..1 leap progress
      const ang = (i / 3) * Math.PI * 2 + i;
      const r = radius * 0.6;
      child.position.x = Math.cos(ang) * r;
      child.position.z = Math.sin(ang) * r;
      // a parabolic leap above the water
      child.position.y = Math.sin(phase * Math.PI) * 1.6;
      child.rotation.z = (phase - 0.5) * 2.2; // tip up then down
    });
  });
  return (
    <group ref={fish} position={[position[0], position[1], position[2]]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} scale={[0.4, 0.22, 0.16]}>
          <sphereGeometry args={[0.5, 12, 10]} />
          <meshStandardMaterial color="#7fdfff" emissive="#7fdfff" emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// A simple rainbow: concentric coloured half-torus arcs over the calm cove.
function Rainbow({ position, radius }: { position: [number, number, number]; radius: number }) {
  const colors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
  return (
    <group position={position} rotation={[0, 0, 0]}>
      {colors.map((c, i) => {
        const r = radius + i * 0.5;
        return (
          <mesh key={c} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.22, 10, 40, Math.PI]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} roughness={0.4} transparent opacity={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Ticker({ fnRef }: { fnRef: React.MutableRefObject<(dt: number) => void> }) {
  useFrame((_, dt) => fnRef.current(Math.min(dt, 0.05)));
  return null;
}
