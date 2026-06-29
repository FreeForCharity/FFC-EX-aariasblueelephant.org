// ---------------------------------------------------------------------------
// Feelings Meadow — caring play (the owner's design).
//   • 3D animal friends act out a feeling with their bodies.
//   • Walk Belu up to one and LINGER a moment → a clue bubble appears telling
//     you how they feel.
//   • 3 ways-to-help then appear around them → walk into (or tap) the kind one.
//   • Right → the animal cheers up, flowers bloom. Help everyone → meadow blooms.
// No abstract quiz: read the body language, understand, choose how to be kind.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLANDS } from '../worldConfig';
import { beluPos, dynamicSolids } from '../playerState';
import type { BeluEmotion } from '../../BeluCharacter';
import Animal3D, { type AnimalMood } from './Animal3D';
import AnswerOrb, { type OrbStatus } from './AnswerOrb';
import { Flower } from '../Scenery';
import { makeLabelTexture } from './emojiTexture';
import { MEADOW_STORY } from './storyContent';
import type { QuestStatus } from './QuestLayer';

const ZONE = 'meadow' as const;
const APPROACH = 4.6; // stay this close to a friend while observing & choosing
const LINGER = 1.6; // seconds of staying close before the clue appears
const HELP_DIST = 2.3; // how far the help bubbles sit in front of a friend
const HELP_SPREAD = 2.8; // sideways gap between the 3 help bubbles (no overlap)
const HELP_PICK = 1.5; // walk this close to a help bubble to choose it

const FEELING_FACE: Record<AnimalMood, string> = {
  scared: '😨', sad: '😢', lonely: '😞', worried: '😟', happy: '😊',
};

interface FriendRT {
  healed: boolean;
  healedAt: number;
}
interface State {
  clock: number;
  active: boolean;
  level: number;
  friends: FriendRT[];
  helped: number;
  disarmed: boolean;
  // current friend being observed/helped
  activeFriend: number;
  lingerStart: number;
  observed: boolean;
  wrongIdx: number;
  wrongUntil: number;
  lockUntil: number;
  finishAt: number;
}

interface Props {
  level: number;
  paused: boolean;
  speak: (line: string) => void;
  setEmotion: (e: BeluEmotion) => void;
  playSound: (kind: 'tap' | 'correct' | 'star' | 'levelup' | 'growup') => void;
  onComplete: (zone: 'meadow', level: number, stars: number, moment: string) => void;
  onStatus: (s: QuestStatus | null) => void;
}

function clampLevel(level: number) {
  return Math.max(0, Math.min(MEADOW_STORY.length - 1, level - 1));
}

export default function StoryLayer(props: Props) {
  const [, force] = useState(0);
  const bump = () => force((v) => (v + 1) % 1_000_000);
  const S = useRef<State>({
    clock: 0, active: false, level: props.level, friends: MEADOW_STORY[clampLevel(props.level)].friends.map(() => ({ healed: false, healedAt: -99 })),
    helped: 0, disarmed: false, activeFriend: -1, lingerStart: 0, observed: false,
    wrongIdx: -1, wrongUntil: 0, lockUntil: 0, finishAt: 0,
  });
  const frame = useRef<(dt: number) => void>(() => {});
  const isl = ISLANDS[ZONE];

  const friendWorld = (i: number): [number, number] => {
    const fr = MEADOW_STORY[clampLevel(S.current.level)].friends[i];
    return [isl.cx + fr.pos[0], isl.cz + fr.pos[1]];
  };

  // 3 help bubbles in an arc on the home-facing side of a friend
  function helpLayout(i: number): [number, number, number][] {
    const [fx, fz] = friendWorld(i);
    const len = Math.hypot(fx, fz) || 1;
    const dx = -fx / len; // toward home (0,0)
    const dz = -fz / len;
    const px = -dz;
    const pz = dx;
    return [-1, 0, 1].map((o) => [
      fx + dx * HELP_DIST + px * o * HELP_SPREAD,
      isl.top + 1.0,
      fz + dz * HELP_DIST + pz * o * HELP_SPREAD,
    ]);
  }

  function emitStatus(phase: 'question' | 'correct', instruction: string, hint?: string) {
    const lvl = MEADOW_STORY[clampLevel(S.current.level)];
    props.onStatus({
      zone: ZONE, title: isl.label, emoji: isl.emoji, accent: isl.accent,
      level: S.current.level, instruction, step: S.current.helped,
      total: lvl.friends.length, phase, hint,
    });
  }

  function startStory() {
    const lvl = MEADOW_STORY[clampLevel(props.level)];
    S.current.active = true;
    S.current.level = props.level;
    S.current.friends = lvl.friends.map(() => ({ healed: false, healedAt: -99 }));
    S.current.helped = 0;
    S.current.activeFriend = -1;
    S.current.observed = false;
    props.setEmotion('curious');
    props.speak(lvl.intro);
    emitStatus('question', lvl.intro, 'Walk up to a friend to see how they feel 💛');
    bump();
  }

  function stopStory() {
    S.current.active = false;
    S.current.activeFriend = -1;
    S.current.observed = false;
    props.setEmotion('happy');
    props.onStatus(null);
    bump();
  }

  function finish() {
    const lvl = MEADOW_STORY[clampLevel(S.current.level)];
    props.onComplete(ZONE, S.current.level, 3, lvl.moment);
    props.speak(lvl.outro);
    S.current.active = false;
    S.current.disarmed = true;
    S.current.activeFriend = -1;
    props.onStatus(null);
    bump();
  }

  function pickHelp(i: number) {
    const st = S.current;
    if (st.clock < st.lockUntil) return;
    const fr = MEADOW_STORY[clampLevel(st.level)].friends[st.activeFriend];
    const opt = fr.helps[i];
    if (opt.correct) {
      st.friends[st.activeFriend].healed = true;
      st.friends[st.activeFriend].healedAt = st.clock;
      st.helped += 1;
      st.lockUntil = st.clock + 0.8;
      props.playSound('star');
      props.setEmotion('excited');
      emitStatus('correct', `Yay! Your ${fr.species} feels safe and happy now! ☀️`);
      const total = MEADOW_STORY[clampLevel(st.level)].friends.length;
      if (st.helped >= total) st.finishAt = st.clock + 1.5;
      else {
        st.activeFriend = -1;
        st.observed = false;
      }
      bump();
    } else {
      st.wrongIdx = i;
      st.wrongUntil = st.clock + 0.5;
      st.lockUntil = st.clock + 0.5;
      props.playSound('tap');
      props.setEmotion('curious');
      props.speak('Hmm, that might not help them. What would a kind friend do?');
      bump();
    }
  }

  frame.current = (dt: number) => {
    const st = S.current;
    // keep the meadow animals registered as solid things (walk around them)
    const lvlFriends = MEADOW_STORY[clampLevel(st.level)].friends;
    dynamicSolids.meadow = lvlFriends.map((_, i) => {
      const [fx, fz] = friendWorld(i);
      return { x: fx, z: fz, r: 1.05 };
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
      if (onIsland && !st.disarmed) startStory();
      return;
    }
    if (dCenter > isl.radius + 1.5) {
      stopStory();
      return;
    }

    const friends = MEADOW_STORY[clampLevel(st.level)].friends;

    // who is Belu nearest to (unhealed)?
    let near = -1;
    let nearD = APPROACH;
    for (let i = 0; i < friends.length; i++) {
      if (st.friends[i].healed) continue;
      const [fx, fz] = friendWorld(i);
      const d = Math.hypot(beluPos.x - fx, beluPos.z - fz);
      if (d < nearD) {
        nearD = d;
        near = i;
      }
    }

    if (near === -1) {
      if (st.activeFriend !== -1) {
        st.activeFriend = -1;
        st.observed = false;
        emitStatus('question', 'Walk up to a friend who needs help.', 'Stay close to see how they feel 💛');
        bump();
      }
      return;
    }

    if (near !== st.activeFriend) {
      st.activeFriend = near;
      st.lingerStart = st.clock;
      st.observed = false;
      props.setEmotion('curious');
      bump();
    }

    if (!st.observed && st.clock - st.lingerStart >= LINGER) {
      st.observed = true;
      const fr = friends[near];
      props.speak(`The ${fr.species} ${fr.clue}`);
      emitStatus('question', `The ${fr.species} ${fr.clue}`, 'Walk into a kind way to help 💛');
      st.lockUntil = st.clock + 0.4;
      bump();
    }

    // once observed, let Belu walk into a help bubble
    if (st.observed) {
      const layout = helpLayout(near);
      let best = -1;
      let bestD = HELP_PICK;
      for (let i = 0; i < layout.length; i++) {
        const d = Math.hypot(beluPos.x - layout[i][0], beluPos.z - layout[i][2]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0) pickHelp(best);
    }
  };

  // ---- render ----
  const friends = MEADOW_STORY[clampLevel(S.current.level)].friends;
  return (
    <group>
      <Ticker fnRef={frame} />
      {friends.map((fr, i) => {
        const rt = S.current.friends[i] ?? { healed: false, healedAt: -99 };
        const [fx, fz] = friendWorld(i);
        const isActive = S.current.active && S.current.activeFriend === i && !rt.healed;
        const justHealed = rt.healed && S.current.clock - rt.healedAt < 2.5;
        return (
          <group key={`${S.current.level}-${i}`}>
            <Animal3D
              species={fr.species}
              mood={rt.healed ? 'happy' : fr.feeling}
              position={[fx, isl.top, fz]}
              seed={i * 1.7}
            />
            {/* bubble above the friend: 👀 while observing, the feeling once seen */}
            {isActive && (
              <Bubble
                emoji={S.current.observed ? FEELING_FACE[fr.feeling] : '👀'}
                position={[fx, isl.top + 1.9, fz]}
              />
            )}
            {/* the 3 ways-to-help, once observed */}
            {isActive && S.current.observed &&
              helpLayout(i).map((p, oi) => {
                const opt = fr.helps[oi];
                const status: OrbStatus = S.current.wrongIdx === oi ? 'wrong' : 'idle';
                return (
                  <AnswerOrb
                    key={oi}
                    position={p}
                    emoji={opt.emoji}
                    caption={opt.label}
                    color={isl.accent}
                    status={status}
                    bobSeed={oi * 0.7}
                    onPick={() => pickHelp(oi)}
                  />
                );
              })}
            {justHealed && (
              <Sparkles count={22} scale={3} size={6} speed={0.6} color="#ffd166" position={[fx, isl.top + 1.2, fz]} />
            )}
            {rt.healed && (
              <>
                <Flower position={[fx + 1.1, isl.top, fz + 0.6]} color="#ff8fc8" />
                <Flower position={[fx - 1.0, isl.top, fz + 0.8]} color="#ffd166" />
                <Flower position={[fx + 0.4, isl.top, fz - 1.1]} color="#a78bfa" />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Bubble({ emoji, position }: { emoji: string; position: [number, number, number] }) {
  const tex = useRef<THREE.CanvasTexture>(makeLabelTexture(emoji, undefined, true));
  if ((tex.current as unknown as { __e?: string }).__e !== emoji) {
    tex.current = makeLabelTexture(emoji, undefined, true);
    (tex.current as unknown as { __e?: string }).__e = emoji;
  }
  return (
    <sprite position={position} scale={[1.4, 1.4, 1]} renderOrder={12}>
      <spriteMaterial map={tex.current} transparent depthWrite={false} depthTest={false} />
    </sprite>
  );
}

function Ticker({ fnRef }: { fnRef: React.MutableRefObject<(dt: number) => void> }) {
  useFrame((_, dt) => fnRef.current(Math.min(dt, 0.05)));
  return null;
}
