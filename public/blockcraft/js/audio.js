/* Aaria's Block Craft 3D — audio: WebAudio synth SFX, gentle music, and text-to-speech */
ABC.audio = (function () {
  let ctx = null, musicGain = null, musicTimer = null;
  const S = { sound:true, music:false, readAloud:true, voiceMode:false };

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!S.sound) return;
    const c = ensureCtx();
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* shared white-noise buffer for wet/organic sounds */
  let _noise = null;
  function noiseBuffer() {
    const c = ensureCtx();
    if (_noise) return _noise;
    _noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = _noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return _noise;
  }
  /* a wet squelch: noise squeezed through a falling band-pass + a soft thump */
  function wet(dur, f0, f1, vol) {
    if (!S.sound) return;
    const c = ensureCtx(), t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuffer();
    src.playbackRate.value = 0.7 + Math.random() * 0.6;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(f0 * (0.85 + Math.random() * 0.3), t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(t); src.stop(t + dur + 0.05);
    tone(90 + Math.random() * 40, dur * 0.8, 'sine', vol * 0.7, 0, 55);
  }

  const sfx = {
    pop()      { tone(420, .12, 'square', .08); tone(640, .1, 'sine', .1, .02); },
    remove()   { tone(300, .15, 'triangle', .1, 0, 150); },
    ding()     { tone(880, .3, 'sine', .14); tone(1320, .4, 'sine', .08, .05); },
    star()     { [880,1108,1318,1760].forEach((f,i)=>tone(f,.25,'sine',.1,i*.09)); },
    fanfare()  { [523,659,784,1046,1318].forEach((f,i)=>tone(f,.35,'triangle',.12,i*.13)); },
    squish()   { wet(0.22, 480, 110, 0.22); },                                  // press into dough
    squishBig(){ wet(0.4, 380, 70, 0.3); wet(0.18, 700, 200, 0.12); },          // deep two-stage splat
    stretchy() { wet(0.35, 140, 520, 0.16); },                                  // pulling taffy upward
    plop()     { wet(0.16, 300, 90, 0.2); tone(70, .2, 'sine', .15, .04, 45); },// lands back down
    stamp()    { wet(0.12, 600, 250, 0.2); tone(660, .18, 'triangle', .12, .08); tone(990, .25, 'sine', .1, .14); },
    grow()     { [330,392,494,587].forEach((f,i)=>tone(f,.22,'triangle',.09,i*.12)); },
    honk()     { tone(330, .25, 'square', .12); tone(415, .3, 'square', .12, .25); },
    whoosh()   { tone(220, 1.4, 'sawtooth', .07, 0, 1100); tone(110, 1.6, 'triangle', .08, 0, 700); },
    gentle()   { tone(660, .25, 'sine', .08); },
    munch()    { tone(140, .09, 'square', .1); tone(120, .09, 'square', .1, .14); tone(150, .09, 'square', .1, .28); },
    sad()      { tone(440, .4, 'sine', .08, 0, 330); },
  };

  /* Soft generative music: slow pentatonic bells */
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  function musicTick() {
    if (!S.music || !ctx) return;
    const n = SCALE[Math.floor(Math.random()*SCALE.length)];
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = n / 2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 3.4);
  }
  function startMusic() {
    ensureCtx();
    if (musicTimer) return;
    musicTimer = setInterval(musicTick, 2600);
  }

  /* ---- Speech ---- */
  let voice = null;
  function pickVoice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    voice = vs.find(v=>/Samantha|Google US English|Karen|female/i.test(v.name)) || vs.find(v=>v.lang.startsWith('en')) || null;
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function say(text, opts) {
    if (!window.speechSynthesis) return;
    if (!S.readAloud && !(opts && opts.force)) return;
    const clean = String(text).replace(/<[^>]*>/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✨⭐]/gu, '');
    if (!clean.trim()) return;
    speechSynthesis.cancel();
    // Chrome quirk: speaking immediately after cancel() silently drops the
    // utterance — queue it a tick later
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = 0.92; u.pitch = 1.15;
      if (!voice) pickVoice();          // voices sometimes load late
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    }, 60);
  }
  // Chrome quirk #2: long speech silently pauses after ~15s — keep it awake
  setInterval(() => {
    if (window.speechSynthesis && speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause(); speechSynthesis.resume();
    }
  }, 9000);
  function stopSay() { if (window.speechSynthesis) speechSynthesis.cancel(); }

  /* ---- Speech recognition (voice mode) ---- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  function listen(onResult, onEnd) {
    if (!SR) { onEnd && onEnd('unsupported'); return null; }
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 3;
    r.onresult = (e) => {
      const alts = [];
      for (const res of e.results) for (const a of res) alts.push(a.transcript);
      onResult(alts);
    };
    r.onerror = () => onEnd && onEnd('error');
    r.onend = () => onEnd && onEnd('end');
    try { r.start(); } catch (e) { onEnd && onEnd('error'); return null; }
    return r;
  }

  return { settings:S, ensureCtx, sfx, startMusic, say, stopSay, listen, hasSR:!!SR };
})();
