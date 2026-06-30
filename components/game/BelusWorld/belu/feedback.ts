// ---------------------------------------------------------------------------
// Gentle audio feedback + read-aloud narration. No audio files — everything is
// synthesised (Web Audio API) or spoken (Web Speech API), so there's nothing to
// download and nothing to break the strict asset policy.
//
// Research note: sound is a likeability "juice" win, but autistic kids can be
// sound-sensitive — so every sound is SOFT and fully toggleable, and narration
// (text-to-speech) supports non-readers and literal-instruction needs.
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** A soft sine "ping". freq in Hz, when = offset seconds, dur seconds. */
function ping(freq: number, when: number, dur: number, gain: number) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t0 = ac.currentTime + when;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type Sound = 'tap' | 'correct' | 'star' | 'levelup' | 'growup';

export function playSound(kind: Sound, enabled: boolean) {
  if (!enabled) return;
  switch (kind) {
    case 'tap':
      ping(440, 0, 0.12, 0.05);
      break;
    case 'correct':
      ping(587.33, 0, 0.16, 0.07); // D5
      ping(880, 0.08, 0.18, 0.06); // A5
      break;
    case 'star':
      ping(659.25, 0, 0.14, 0.07); // E5
      ping(987.77, 0.1, 0.2, 0.06); // B5
      break;
    case 'levelup':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => ping(f, i * 0.11, 0.22, 0.06));
      break;
    case 'growup':
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => ping(f, i * 0.13, 0.3, 0.07));
      break;
  }
}

// ---- text-to-speech ----

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  if (voice) return voice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // prefer a warm English voice if available
  voice =
    voices.find((v) => /en/i.test(v.lang) && /(female|samantha|karen|moira|tessa|google uk english female)/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    voices[0];
  return voice;
}

export function speakAloud(text: string, enabled: boolean, opts?: { rate?: number; force?: boolean }) {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    // Don't cut Belu off mid-sentence: let the current line finish unless this is
    // a forced read. (The old unconditional cancel() chopped every line short.)
    if (window.speechSynthesis.speaking && !(opts && opts.force)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = (opts && opts.rate) || 0.95; // a touch slower — clearer for kids (game-speed aware)
    u.pitch = 1.15; // friendly
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech not available — silent */
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}
