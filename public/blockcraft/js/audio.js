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

  const sfx = {
    pop()      { tone(420, .12, 'square', .08); tone(640, .1, 'sine', .1, .02); },
    remove()   { tone(300, .15, 'triangle', .1, 0, 150); },
    ding()     { tone(880, .3, 'sine', .14); tone(1320, .4, 'sine', .08, .05); },
    star()     { [880,1108,1318,1760].forEach((f,i)=>tone(f,.25,'sine',.1,i*.09)); },
    fanfare()  { [523,659,784,1046,1318].forEach((f,i)=>tone(f,.35,'triangle',.12,i*.13)); },
    squish()   { tone(180, .2, 'sawtooth', .05, 0, 90); tone(90, .25, 'sine', .12, .02, 60); },
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
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.92; u.pitch = 1.15;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
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
