// ---------------------------------------------------------------------------
// Friendship Forest — MAGIC WORDS (the expressive-language island).
//   • 3D animal friends (Animal3D) each show a thought bubble of what they WANT
//     or SEE (a picture, on a soft thought card).
//   • Walk Nilu up to a friend and LINGER a moment → word bubbles (AnswerOrb,
//     word as caption + matching picture) appear in an arc around them.
//   • Walk Nilu into the words IN THE RIGHT ORDER to "say" the phrase. Each
//     correct word lights up; the wanted thing then magically appears (a
//     Sparkles burst + the item pops) and the friend cheers.
//   • Wrong word = a gentle wiggle + a kind nudge ("try the first word"),
//     never a buzzer, never a fail. Single-word levels just have a 1-word order.
// This teaches expressive language as CASTING WORD-SPELLS — using your words to
// make real things happen — not as an abstract quiz.
//
// Mirrors StoryLayer's lifecycle exactly: arm on the island, abort if Nilu
// leaves, finish → disarm → re-arm only after Nilu wanders off again.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ISLANDS } from '../worldConfig';
import { beluPos, dynamicSolids } from '../playerState';
import type { BeluEmotion } from '../../BeluCharacter';
import Animal3D from './Animal3D';
import AnswerOrb, { type OrbStatus } from './AnswerOrb';
import { makeLabelTexture } from './emojiTexture';
import { FOREST_STORY, FOREST_TWINKLES, TWINKLE_FINDS, type SpellWord } from './forestContent';
import { Twinkle, Wisp, GlowMushroom, WishTree, WordTrail, seeded } from './forestExtras';
import { TrotGroup, GreetBurst } from './meadowExtras';
import InviteBubble from './InviteBubble';
import type { QuestStatus } from './QuestLayer';

const ZONE = 'forest' as const;
const APPROACH = 4.8; // stay this close to a friend while it listens & you cast
const LINGER = 1.4; // seconds close before the word bubbles appear
const WORD_DIST = 3.0; // how far the word bubbles sit in front of the friend
const WORD_SPREAD = 2.6; // sideways gap between word bubbles (no overlap)
const WORD_PICK = 1.5; // walk this close to a word bubble to "say" it
const TWINKLE_PICK = 1.9; // walk this close to a hidden twinkle to collect it
const INVITE_START = 2.4; // walk this close to the waving host to BEGIN (consent)
const GREET_DIST = 4.0; // a healed friend recognises Nilu from this far

// A ring of glow-mushrooms around the forest heart that light up one by one as
// the child helps friends — the world visibly waking because of them.
const MUSHROOM_COLORS = ['#c6a0ff', '#ff8fc8', '#7cc6ff', '#ffd166', '#86d6c0', '#a0ffb8'];

// Deterministic shuffle (no Math.random at render/module time — like the rest of
// the world). Same friend always lays its words out the same way.
function ordered(spell: SpellWord[], decoys: SpellWord[], seed: number): SpellWord[] {
  const all = [...spell, ...decoys];
  // a tiny seeded sort: score each word by a hash of (seed, index) so the order
  // is stable per friend but mixes the correct words among the decoys.
  return all
    .map((wd, i) => ({ wd, k: Math.sin((seed + 1) * 12.9898 + i * 78.233) }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.wd);
}

interface FriendRT {
  done: boolean;
  doneAt: number;
}
interface TwinkleRT {
  found: boolean;
  foundAt: number;
}
interface State {
  clock: number;
  active: boolean;
  level: number;
  friends: FriendRT[];
  finished: number; // how many friends have completed their spell
  disarmed: boolean;
  // the friend currently being talked to
  activeFriend: number;
  lingerStart: number;
  listening: boolean; // true once the word bubbles are showing
  progress: number; // how many words of the current spell have been cast
  wrongIdx: number; // word bubble showing a wiggle, or -1
  wrongUntil: number;
  lockUntil: number;
  finishAt: number;
  /** gentle re-prompts this session — grown-ups-only signal, never shown to the child */
  slips: number;
  // ---- engagement extras ----
  twinkles: TwinkleRT[]; // hidden collectibles found so far
  found: number; // count of twinkles collected this level
  trail: { emoji: string; pos: [number, number, number]; born: number } | null; // last word-cast puff
  // healed friends remember you — greet time per friend this session (-1 = not yet)
  greetAt: number[];
}

interface Props {
  level: number;
  paused: boolean;
  /** animal species the child has healed before (they remember!) */
  healedFriends: string[];
  speak: (line: string) => void;
  setEmotion: (e: BeluEmotion) => void;
  playSound: (kind: 'tap' | 'correct' | 'star' | 'levelup' | 'growup') => void;
  onComplete: (zone: 'forest', level: number, stars: number, moment: string, slips?: number) => void;
  onStatus: (s: QuestStatus | null) => void;
  /** the child just helped this species — remember the friendship */
  onFriendHealed: (species: string) => void;
}

function clampLevel(level: number) {
  return Math.max(0, Math.min(FOREST_STORY.length - 1, level - 1));
}

export default function ForestLayer(props: Props) {
  const [, force] = useState(0);
  const bump = () => force((v) => (v + 1) % 1_000_000);
  const twinklesOf = (level: number) =>
    FOREST_STORY[clampLevel(level)].twinkles ?? FOREST_TWINKLES;

  const S = useRef<State>({
    clock: 0, active: false, level: props.level,
    friends: FOREST_STORY[clampLevel(props.level)].friends.map(() => ({ done: false, doneAt: -99 })),
    finished: 0, disarmed: false, activeFriend: -1, lingerStart: 0, listening: false,
    progress: 0, wrongIdx: -1, wrongUntil: 0, lockUntil: 0, finishAt: 0, slips: 0,
    twinkles: twinklesOf(props.level).map(() => ({ found: false, foundAt: -99 })),
    found: 0, trail: null,
    greetAt: FOREST_STORY[clampLevel(props.level)].friends.map(() => -1),
  });
  const frame = useRef<(dt: number) => void>(() => {});
  const isl = ISLANDS[ZONE];

  const friendWorld = (i: number): [number, number] => {
    const fr = FOREST_STORY[clampLevel(S.current.level)].friends[i];
    return [isl.cx + fr.pos[0], isl.cz + fr.pos[1]];
  };

  const twinkleWorld = (i: number): [number, number] => {
    const t = twinklesOf(S.current.level)[i];
    return [isl.cx + t.pos[0], isl.cz + t.pos[1]];
  };

  // the laid-out word bubbles for a friend (correct words + decoys, mixed)
  function wordsFor(i: number): SpellWord[] {
    const fr = FOREST_STORY[clampLevel(S.current.level)].friends[i];
    return ordered(fr.spell, fr.decoys, i + 1);
  }

  // arc of word bubbles on the home-facing side of a friend (same math as
  // StoryLayer's help layout so it reads from any approach angle)
  function wordLayout(i: number): [number, number, number][] {
    const [fx, fz] = friendWorld(i);
    const words = wordsFor(i);
    const n = words.length;
    const len = Math.hypot(fx, fz) || 1;
    const dx = -fx / len; // toward home (0,0)
    const dz = -fz / len;
    const px = -dz;
    const pz = dx;
    const out: [number, number, number][] = [];
    for (let k = 0; k < n; k++) {
      const frac = n === 1 ? 0 : k / (n - 1) - 0.5;
      const off = frac * (n - 1) * WORD_SPREAD;
      out.push([
        fx + dx * WORD_DIST + px * off,
        isl.top + 1.0,
        fz + dz * WORD_DIST + pz * off,
      ]);
    }
    return out;
  }

  function emitStatus(phase: 'question' | 'correct', instruction: string, hint?: string) {
    const lvl = FOREST_STORY[clampLevel(S.current.level)];
    props.onStatus({
      zone: ZONE, title: isl.label, emoji: isl.emoji, accent: isl.accent,
      level: S.current.level, instruction, step: S.current.finished,
      total: lvl.friends.length, phase, hint,
    });
  }

  function startStory() {
    const lvl = FOREST_STORY[clampLevel(props.level)];
    S.current.active = true;
    S.current.level = props.level;
    S.current.friends = lvl.friends.map(() => ({ done: false, doneAt: -99 }));
    S.current.finished = 0;
    S.current.activeFriend = -1;
    S.current.listening = false;
    S.current.progress = 0;
    S.current.twinkles = twinklesOf(props.level).map(() => ({ found: false, foundAt: -99 }));
    S.current.found = 0;
    S.current.trail = null;
    S.current.greetAt = lvl.friends.map(() => -1);
    S.current.slips = 0;
    props.setEmotion('curious');
    props.speak(lvl.intro);
    emitStatus('question', lvl.intro, 'Walk up to a friend to hear their wish 💜');
    bump();
  }

  function stopStory() {
    S.current.active = false;
    S.current.activeFriend = -1;
    S.current.listening = false;
    S.current.progress = 0;
    props.setEmotion('happy');
    props.onStatus(null);
    bump();
  }

  function finish() {
    const lvl = FOREST_STORY[clampLevel(S.current.level)];
    // errorless & no-fail: every completed level is worth a full 3 stars
    props.onComplete(ZONE, S.current.level, 3, lvl.moment, S.current.slips);
    props.speak(lvl.outro);
    S.current.active = false;
    S.current.disarmed = true;
    S.current.activeFriend = -1;
    S.current.listening = false;
    props.onStatus(null);
    bump();
  }

  // the phrase, spaced out, for the on-screen hint ("apple" or "want ball")
  function phraseOf(i: number): string {
    return FOREST_STORY[clampLevel(S.current.level)].friends[i].spell.map((s) => s.word).join(' ');
  }

  // Nilu walked into the word bubble at layout index `k`.
  function castWord(i: number, k: number) {
    const st = S.current;
    if (st.clock < st.lockUntil) return;
    const fr = FOREST_STORY[clampLevel(st.level)].friends[i];
    const words = wordsFor(i);
    const said = words[k].word;
    const expected = fr.spell[st.progress].word;

    if (said === expected) {
      st.progress += 1;
      props.playSound('correct');
      // a sparkle puff rises where the word landed — "your word did that!"
      const layout = wordLayout(i);
      st.trail = { emoji: words[k].emoji, pos: [layout[k][0], isl.top + 1.4, layout[k][2]], born: st.clock };
      if (st.progress >= fr.spell.length) {
        // the whole spell landed → the wanted thing magically appears
        st.friends[i].done = true;
        st.friends[i].doneAt = st.clock;
        st.finished += 1;
        props.onFriendHealed(fr.species); // this friend will remember Nilu forever
        st.listening = false;
        st.lockUntil = st.clock + 0.8;
        props.playSound('star');
        props.setEmotion('excited');
        emitStatus('correct', fr.cheer);
        const total = FOREST_STORY[clampLevel(st.level)].friends.length;
        if (st.finished >= total) st.finishAt = st.clock + 1.6;
        else {
          // move on: let Nilu wander to the next friend
          st.activeFriend = -1;
        }
      } else {
        // partway through a multi-word spell — keep going to the next word
        st.lockUntil = st.clock + 0.3;
        props.setEmotion('happy');
        const next = fr.spell[st.progress].word;
        emitStatus('question', `Say "${phraseOf(i)}"`, `Now walk into "${next}" 💜`);
      }
      bump();
    } else {
      // gentle wiggle — never a fail. Nudge toward the right next word.
      st.wrongIdx = k;
      st.wrongUntil = st.clock + 0.5;
      st.lockUntil = st.clock + 0.5;
      st.slips += 1;
      props.playSound('tap');
      props.setEmotion('curious');
      props.speak(st.progress === 0 ? `Try the first word — "${expected}".` : `Almost! Next is "${expected}".`);
      bump();
    }
  }

  frame.current = (dt: number) => {
    const st = S.current;
    // keep the forest animals registered as solid (Nilu walks around them)
    const lvlFriends = FOREST_STORY[clampLevel(st.level)].friends;
    dynamicSolids.forest = lvlFriends.map((_, i) => {
      const [fx, fz] = friendWorld(i);
      return { x: fx, z: fz, r: 1.05 };
    });
    if (props.paused) return;
    st.clock += dt;

    // --- healed friends remember you: a happy trot-loop + hearts on return ---
    for (let i = 0; i < lvlFriends.length; i++) {
      if ((st.greetAt[i] ?? -1) >= 0) continue;
      if (!props.healedFriends.includes(lvlFriends[i].species)) continue;
      const [fx, fz] = friendWorld(i);
      if (Math.hypot(beluPos.x - fx, beluPos.z - fz) < GREET_DIST) {
        st.greetAt[i] = st.clock;
        props.playSound('correct');
        bump();
      }
    }
    if (st.greetAt.some((g) => g >= 0 && st.clock - g > 2.2 && st.clock - g < 2.2 + dt * 2)) bump();

    if (st.finishAt > 0 && st.clock >= st.finishAt) {
      st.finishAt = 0;
      finish();
      return;
    }
    if (st.wrongIdx >= 0 && st.clock > st.wrongUntil) {
      st.wrongIdx = -1;
      bump();
    }
    // let the last word-cast sparkle puff fade out
    if (st.trail && st.clock - st.trail.born > 1.1) {
      st.trail = null;
      bump();
    }

    // ---- hidden twinkles: collectible discovery (no-fail, anytime on island) ----
    {
      const tw = twinklesOf(st.level);
      for (let i = 0; i < tw.length; i++) {
        if (st.twinkles[i]?.found) continue;
        const [tx, tz] = twinkleWorld(i);
        if (Math.hypot(beluPos.x - tx, beluPos.z - tz) < TWINKLE_PICK) {
          st.twinkles[i] = { found: true, foundAt: st.clock };
          st.found += 1;
          props.playSound('tap');
          props.setEmotion('excited');
          props.speak(TWINKLE_FINDS[Math.floor(seeded(i + st.level) * TWINKLE_FINDS.length) % TWINKLE_FINDS.length]);
          // a little celebration once the whole forest sparkle-hunt is done
          if (st.found >= tw.length) {
            props.playSound('levelup');
            props.speak('You found every hidden sparkle in the forest! 🌟');
          }
          bump();
        }
      }
    }

    const dCenter = Math.hypot(beluPos.x - isl.cx, beluPos.z - isl.cz);
    const onIsland = dCenter < isl.radius * 0.82;
    if (st.disarmed && dCenter > isl.radius + 1.5) {
      st.disarmed = false;
      bump();
    }
    if (!st.active) {
      // NO quest ambush: begin only when the child walks right up to the host
      if (onIsland && !st.disarmed) {
        const [hx, hz] = friendWorld(0);
        if (Math.hypot(beluPos.x - hx, beluPos.z - hz) < INVITE_START) startStory();
      }
      return;
    }
    if (dCenter > isl.radius + 1.5) {
      stopStory();
      return;
    }

    const friends = FOREST_STORY[clampLevel(st.level)].friends;

    // which unfinished friend is Nilu nearest to?
    let near = -1;
    let nearD = APPROACH;
    for (let i = 0; i < friends.length; i++) {
      if (st.friends[i].done) continue;
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
        st.listening = false;
        st.progress = 0;
        emitStatus('question', 'Walk up to a friend to hear their wish.', 'Stay close to help them cast words 💜');
        bump();
      }
      return;
    }

    if (near !== st.activeFriend) {
      st.activeFriend = near;
      st.lingerStart = st.clock;
      st.listening = false;
      st.progress = 0;
      props.setEmotion('curious');
      bump();
    }

    if (!st.listening && st.clock - st.lingerStart >= LINGER) {
      st.listening = true;
      st.progress = 0;
      const first = friends[near].spell[0].word;
      props.speak(`Help me say "${phraseOf(near)}"!`);
      emitStatus(
        'question',
        `Say "${phraseOf(near)}"`,
        friends[near].spell.length > 1 ? `Walk into the words in order — start with "${first}" 💜` : `Walk into "${first}" 💜`,
      );
      st.lockUntil = st.clock + 0.4;
      bump();
    }

    // once listening, let Nilu walk into a word bubble (in order)
    if (st.listening) {
      const layout = wordLayout(near);
      let best = -1;
      let bestD = WORD_PICK;
      for (let k = 0; k < layout.length; k++) {
        const d = Math.hypot(beluPos.x - layout[k][0], beluPos.z - layout[k][2]);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      if (best >= 0) castWord(near, best);
    }
  };

  // ---- render ----
  const friends = FOREST_STORY[clampLevel(S.current.level)].friends;
  const twinkles = twinklesOf(S.current.level);
  const totalFriends = friends.length;
  const allDone = S.current.active === false && S.current.disarmed && S.current.finished >= totalFriends && S.current.finished > 0;
  // glow-mushroom ring: how many are lit grows with friends helped (the forest
  // waking up because of the child). One extra lights the moment all are done.
  const NUM_MUSHROOMS = 6;
  const litCount = totalFriends > 0
    ? Math.round((S.current.finished / totalFriends) * NUM_MUSHROOMS)
    : 0;
  return (
    <group>
      <Ticker fnRef={frame} />

      {/* two firefly guides give the forest living personality; they speed up
          and brighten as Nilu helps more friends (escalating delight) */}
      <Wisp center={[isl.cx, isl.top, isl.cz]} color={isl.accent} seed={1} excited={S.current.finished > 0} />
      <Wisp center={[isl.cx, isl.top, isl.cz]} color="#ffd166" seed={4} excited={S.current.finished >= 2} />

      {/* a ring of glow-mushrooms around the forest heart, lighting up with progress */}
      {Array.from({ length: NUM_MUSHROOMS }).map((_, k) => {
        const a = (k / NUM_MUSHROOMS) * Math.PI * 2;
        const rr = isl.radius * 0.62;
        return (
          <GlowMushroom
            key={`m${k}`}
            position={[isl.cx + Math.cos(a) * rr, isl.top, isl.cz + Math.sin(a) * rr]}
            color={MUSHROOM_COLORS[k % MUSHROOM_COLORS.length]}
            lit={k < litCount}
            seed={k + 1}
          />
        );
      })}

      {/* hidden twinkles to discover — sparkle until found, then pop + chime */}
      {twinkles.map((tw, i) => {
        const rt = S.current.twinkles[i] ?? { found: false, foundAt: -99 };
        // once collected, keep it mounted briefly for the pop-and-rise animation
        if (rt.found && S.current.clock - rt.foundAt > 1.3) return null;
        const [tx, tz] = twinkleWorld(i);
        return (
          <Twinkle
            key={`t${i}`}
            position={[tx, isl.top + 0.9, tz]}
            emoji={tw.emoji}
            color={isl.accent}
            collected={rt.found}
            collectedAt={rt.foundAt}
            clock={S.current.clock}
            seed={i + 1}
          />
        );
      })}

      {/* the rising sparkle puff from the last magic word that landed */}
      {S.current.trail && (
        <WordTrail
          position={S.current.trail.pos}
          emoji={S.current.trail.emoji}
          color={isl.accent}
          born={S.current.trail.born}
          clock={S.current.clock}
        />
      )}

      {/* the big finale: a glowing wish-tree aura once every friend is helped */}
      <WishTree position={[isl.cx, isl.top, isl.cz]} color={isl.accent} on={allDone} clock={S.current.clock} />

      {/* the host friend waves you over — walk right up to them to begin */}
      {!S.current.active && !S.current.disarmed && (
        <InviteBubble
          position={[isl.cx + friends[0].pos[0], isl.top + 2.7, isl.cz + friends[0].pos[1]]}
          ground={[isl.cx + friends[0].pos[0], isl.top, isl.cz + friends[0].pos[1]]}
          color={isl.accent}
        />
      )}

      {friends.map((fr, i) => {
        const rt = S.current.friends[i] ?? { done: false, doneAt: -99 };
        const [fx, fz] = friendWorld(i);
        const isActive = S.current.active && S.current.activeFriend === i && !rt.done;
        const justDone = rt.done && S.current.clock - rt.doneAt < 2.5;
        const layout = isActive && S.current.listening ? wordLayout(i) : [];
        const words = isActive && S.current.listening ? wordsFor(i) : [];
        const greetAt = S.current.greetAt[i] ?? -1;
        const greeting = greetAt >= 0 && S.current.clock - greetAt < 2.2;
        return (
          <group key={`${S.current.level}-${i}`}>
            <TrotGroup active={greeting}>
              <Animal3D
                species={fr.species}
                mood={rt.done ? 'happy' : 'happy'}
                position={[fx, isl.top, fz]}
                seed={i * 1.7}
              />
            </TrotGroup>
            {greeting && <GreetBurst position={[fx, isl.top + 1.0, fz]} />}
            {/* thought bubble above the friend: what they want / see */}
            {isActive && !S.current.listening && (
              <Bubble emoji={fr.thought} position={[fx, isl.top + 1.9, fz]} />
            )}
            {/* the word bubbles (AnswerOrb) — walk into them in order to "say" them */}
            {isActive && S.current.listening &&
              layout.map((p, k) => {
                const wd = words[k];
                // is this bubble the word the spell wants next? (stays live & glowing)
                const isNextExpected =
                  S.current.progress < fr.spell.length && wd.word === fr.spell[S.current.progress].word;
                // has a word like this already been cast earlier in the phrase?
                const alreadyCast =
                  fr.spell.findIndex((s, si) => si < S.current.progress && s.word === wd.word) >= 0;
                let status: OrbStatus = 'idle';
                if (S.current.wrongIdx === k) status = 'wrong';
                else if (alreadyCast && !isNextExpected) status = 'chosen';
                return (
                  <AnswerOrb
                    key={k}
                    position={p}
                    emoji={wd.emoji}
                    caption={wd.word}
                    color={isl.accent}
                    status={status}
                    bobSeed={k * 0.7}
                    onPick={() => castWord(i, k)}
                  />
                );
              })}
            {/* the spell lands: sparkles burst + the wanted thing pops up */}
            {justDone && (
              <>
                <Sparkles count={26} scale={3.2} size={7} speed={0.7} color={isl.accent} position={[fx, isl.top + 1.2, fz]} />
                <Reward emoji={fr.reward} position={[fx, isl.top + 2.1, fz]} born={rt.doneAt} clock={S.current.clock} />
              </>
            )}
            {/* the wanted thing stays as a little keepsake by the happy friend */}
            {rt.done && !justDone && (
              <Bubble emoji={fr.reward} position={[fx + 1.2, isl.top + 0.6, fz + 0.4]} scale={0.9} />
            )}
          </group>
        );
      })}
    </group>
  );
}

// A picture sprite on a thought card (what a friend wants / a kept reward).
function Bubble({ emoji, position, scale = 1.4 }: { emoji: string; position: [number, number, number]; scale?: number }) {
  const tex = useRef<THREE.CanvasTexture>(makeLabelTexture(emoji, undefined, true));
  if ((tex.current as unknown as { __e?: string }).__e !== emoji) {
    tex.current = makeLabelTexture(emoji, undefined, true);
    (tex.current as unknown as { __e?: string }).__e = emoji;
  }
  return (
    <sprite position={position} scale={[scale, scale, 1]} renderOrder={12}>
      <spriteMaterial map={tex.current} transparent depthWrite={false} depthTest={false} />
    </sprite>
  );
}

// The reward item that magically appears — pops up and grows for a beat.
function Reward({ emoji, position, born, clock }: { emoji: string; position: [number, number, number]; born: number; clock: number }) {
  const tex = useRef<THREE.CanvasTexture>(makeLabelTexture(emoji));
  if ((tex.current as unknown as { __e?: string }).__e !== emoji) {
    tex.current = makeLabelTexture(emoji);
    (tex.current as unknown as { __e?: string }).__e = emoji;
  }
  // simple grow-and-rise driven by how long ago it was born (no Date.now)
  const age = Math.max(0, clock - born);
  const s = 0.4 + Math.min(1, age * 4) * 1.4; // 0.4 → ~1.8
  const y = position[1] + Math.min(1, age * 3) * 0.5;
  return (
    <sprite position={[position[0], y, position[2]]} scale={[s, s, 1]} renderOrder={13}>
      <spriteMaterial map={tex.current} transparent depthWrite={false} depthTest={false} />
    </sprite>
  );
}

function Ticker({ fnRef }: { fnRef: React.MutableRefObject<(dt: number) => void> }) {
  useFrame((_, dt) => fnRef.current(Math.min(dt, 0.05)));
  return null;
}
