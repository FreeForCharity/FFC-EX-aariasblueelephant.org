// ---------------------------------------------------------------------------
// Feelings Meadow as CARING PLAY (no questions, no orbs).
//
// Friends sit under weather clouds that show their feeling. The child walks
// Belu up to a friend and just stays close — Belu comforts them, their cloud
// clears (🌧️→🌥️→☀️), flowers burst open, and they cheer. Help everyone and the
// whole meadow blooms. Pure cause-and-effect kindness; the feeling is read by
// seeing the cloud + body language and hearing Belu name it.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLANDS } from '../worldConfig';
import { beluPos } from '../playerState';
import type { BeluEmotion } from '../../BeluCharacter';
import QuestNPC from './QuestNPC';
import { Flower } from '../Scenery';
import { makeLabelTexture } from './emojiTexture';
import { MEADOW_STORY } from './storyContent';
import type { QuestStatus } from './QuestLayer';

const ZONE = 'meadow' as const;
const CARE_RADIUS = 2.4; // how close Belu must be to comfort a friend
const CARE_STEP = 0.7; // seconds between each cloud-clearing step

interface FriendRT {
  careStage: number; // 0..clouds.length-1 ; last = sunny/healed
  healed: boolean;
  named: boolean;
  lastCareAt: number;
  healedAt: number;
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

interface State {
  clock: number;
  active: boolean;
  level: number;
  friends: FriendRT[];
  helped: number;
  disarmed: boolean;
  pendingSayAt: number;
  pendingSay: string | null;
  finishAt: number; // >0 → complete the level at this clock time (lets the last bloom show)
}

function freshFriends(level: number): FriendRT[] {
  const lvl = MEADOW_STORY[Math.max(0, Math.min(MEADOW_STORY.length - 1, level - 1))];
  return lvl.friends.map(() => ({ careStage: 0, healed: false, named: false, lastCareAt: -99, healedAt: -99 }));
}

export default function StoryLayer(props: Props) {
  const [, force] = useState(0);
  const bump = () => force((v) => (v + 1) % 1_000_000);
  const S = useRef<State>({
    clock: 0, active: false, level: props.level, friends: freshFriends(props.level),
    helped: 0, disarmed: false, pendingSayAt: 0, pendingSay: null, finishAt: 0,
  });
  const frame = useRef<(dt: number) => void>(() => {});

  const isl = ISLANDS[ZONE];
  const lvlDef = MEADOW_STORY[Math.max(0, Math.min(MEADOW_STORY.length - 1, S.current.level - 1))];

  function emitStatus(phase: 'question' | 'correct', instruction: string) {
    props.onStatus({
      zone: ZONE, title: isl.label, emoji: isl.emoji, accent: isl.accent,
      level: S.current.level, instruction, step: S.current.helped,
      total: lvlDef.friends.length, phase,
      hint: phase === 'question' ? 'Walk up to a cloudy friend and stay close to help 💛' : undefined,
    });
  }

  function startStory() {
    S.current.active = true;
    S.current.level = props.level;
    S.current.friends = freshFriends(props.level);
    S.current.helped = 0;
    const lvl = MEADOW_STORY[Math.max(0, Math.min(MEADOW_STORY.length - 1, props.level - 1))];
    props.setEmotion('curious');
    props.speak(lvl.intro);
    emitStatus('question', lvl.intro);
    bump();
  }

  function stopStory() {
    S.current.active = false;
    props.setEmotion('happy');
    props.onStatus(null);
    bump();
  }

  function finish() {
    const lvl = MEADOW_STORY[Math.max(0, Math.min(MEADOW_STORY.length - 1, S.current.level - 1))];
    props.onComplete(ZONE, S.current.level, 3, lvl.moment);
    props.speak(lvl.outro);
    S.current.active = false;
    S.current.disarmed = true;
    props.onStatus(null);
    bump();
  }

  frame.current = (dt: number) => {
    const st = S.current;
    if (props.paused) return;
    st.clock += dt;

    if (st.pendingSay && st.clock >= st.pendingSayAt) {
      props.speak(st.pendingSay);
      st.pendingSay = null;
    }

    if (st.finishAt > 0 && st.clock >= st.finishAt) {
      st.finishAt = 0;
      finish();
      return;
    }

    const dCenter = Math.hypot(beluPos.x - isl.cx, beluPos.z - isl.cz);
    const onIsland = dCenter < isl.radius * 0.82;

    // re-arm after Belu wanders off a finished meadow
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

    // comfort the nearest cloudy friend Belu is standing with
    const defs = MEADOW_STORY[Math.max(0, Math.min(MEADOW_STORY.length - 1, st.level - 1))].friends;
    for (let i = 0; i < defs.length; i++) {
      const rt = st.friends[i];
      if (rt.healed) continue;
      const wx = isl.cx + defs[i].pos[0];
      const wz = isl.cz + defs[i].pos[1];
      const d = Math.hypot(beluPos.x - wx, beluPos.z - wz);
      if (d > CARE_RADIUS) continue;

      if (!rt.named) {
        rt.named = true;
        props.speak(`This friend feels ${defs[i].feeling}. Stay close — you're helping! 💛`);
        props.setEmotion('curious');
      }
      if (st.clock - rt.lastCareAt >= CARE_STEP) {
        rt.lastCareAt = st.clock;
        rt.careStage += 1;
        props.playSound('tap');
        props.setEmotion('happy');
        if (rt.careStage >= defs[i].clouds.length - 1) {
          rt.healed = true;
          rt.healedAt = st.clock;
          st.helped += 1;
          props.playSound('star');
          props.setEmotion('excited');
          emitStatus('correct', `Yay! Your ${defs[i].feeling} friend feels sunny now! ☀️`);
          if (st.helped >= defs.length) st.finishAt = st.clock + 1.4; // let the last bloom show
        } else {
          emitStatus('question', `You're cheering up your ${defs[i].feeling} friend… keep going!`);
        }
        bump();
      }
      break; // only comfort one friend at a time
    }
  };

  // ---- render ----
  const defs = lvlDef.friends;
  return (
    <group>
      <Ticker fnRef={frame} />
      {defs.map((fr, i) => {
        const rt = S.current.friends[i] ?? { careStage: 0, healed: false, healedAt: -99 };
        const wx = isl.cx + fr.pos[0];
        const wz = isl.cz + fr.pos[1];
        const cloud = fr.clouds[Math.min(rt.careStage, fr.clouds.length - 1)];
        const justHealed = rt.healed && S.current.clock - rt.healedAt < 2.5;
        return (
          <group key={`${S.current.level}-${i}`}>
            <QuestNPC
              position={[wx, isl.top, wz]}
              face={fr.face}
              mood={rt.healed ? 'happy' : fr.mood}
              color={isl.accent}
              beckon={!rt.healed && S.current.active}
              seed={i * 1.7}
            />
            {/* weather cloud showing the feeling, above the friend */}
            <CloudSprite emoji={cloud} position={[wx, isl.top + 2.1, wz]} />
            {/* kindness bursts when a friend turns sunny */}
            {justHealed && (
              <Sparkles count={20} scale={3} size={6} speed={0.6} color="#ffd166" position={[wx, isl.top + 1.2, wz]} />
            )}
            {rt.healed && (
              <>
                <Flower position={[wx + 1.1, isl.top, wz + 0.6]} color="#ff8fc8" />
                <Flower position={[wx - 1.0, isl.top, wz + 0.8]} color="#ffd166" />
                <Flower position={[wx + 0.5, isl.top, wz - 1.1]} color="#a78bfa" />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

function CloudSprite({ emoji, position }: { emoji: string; position: [number, number, number] }) {
  const tex = useRef<THREE.CanvasTexture>(makeLabelTexture(emoji));
  // update texture when the emoji changes
  if ((tex.current as unknown as { __e?: string }).__e !== emoji) {
    tex.current = makeLabelTexture(emoji);
    (tex.current as unknown as { __e?: string }).__e = emoji;
  }
  return (
    <sprite position={position} scale={[1.5, 1.5, 1]} renderOrder={12}>
      <spriteMaterial map={tex.current} transparent depthWrite={false} depthTest={false} />
    </sprite>
  );
}

function Ticker({ fnRef }: { fnRef: React.MutableRefObject<(dt: number) => void> }) {
  useFrame((_, dt) => fnRef.current(Math.min(dt, 0.05)));
  return null;
}
