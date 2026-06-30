/* Aaria's Block Craft 3D — audio: WebAudio synth SFX, gentle music, and text-to-speech */
ABC.audio = (function () {
  let ctx = null, musicGain = null, musicTimer = null;
  const S = { sound:true, music:false, readAloud:true, voiceMode:false, speed:'normal' };

  /* Game pace 🐢🐇🚀 — kids who need more time stay Relaxed; kids who want it
     snappier go Fast. Scales how long messages linger AND the read-aloud rate.
     Default 'normal' is already generous so nothing feels cut short. */
  const SPEED = {
    relaxed: { ico:'🐢', label:'Relaxed', dur:1.5,  rate:0.82 },
    normal:  { ico:'🐇', label:'Normal',  dur:1.0,  rate:0.98 },
    fast:    { ico:'🚀', label:'Fast',    dur:0.55, rate:1.35 },
  };
  const SPEED_ORDER = ['relaxed', 'normal', 'fast'];
  function speedInfo() { return SPEED[S.speed] || SPEED.normal; }
  function cycleSpeed() {
    const i = SPEED_ORDER.indexOf(S.speed);
    S.speed = SPEED_ORDER[(i + 1) % SPEED_ORDER.length];
    return speedInfo();
  }
  function durMul() { return speedInfo().dur; }

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
    trumpet()  {                                    // Bella the elephant's little toot 🐘🎺
      tone(330, .18, 'sawtooth', .08, 0, 520);
      tone(520, .3, 'sawtooth', .1, .16, 660);
      tone(440, .22, 'triangle', .06, .42, 380);
    },
    /* distinctive little animal voices 🐾 */
    chirp()    { [1200,1600,1400].forEach((f,i)=>tone(f,.08,'sine',.06,i*.09)); },
    meow()     { tone(700,.18,'sawtooth',.08,0,520); tone(520,.22,'sawtooth',.07,.16,420); },
    woof()     { tone(220,.12,'square',.12,0,150); tone(175,.14,'square',.1,.17,120); },
    squeak()   { tone(1400,.06,'sine',.05); tone(1750,.07,'sine',.05,.08); },
    roar()     { tone(120,.5,'sawtooth',.13,0,70); tone(90,.5,'sawtooth',.09,.1,55); },
    squawk()   { tone(900,.1,'square',.08,0,1150); tone(680,.12,'square',.07,.11,480); },
    grunt()    { tone(165,.18,'triangle',.1,0,120); tone(140,.14,'triangle',.07,.16,110); },
    lowrumble(){ tone(80,.6,'sine',.14,0,55); tone(110,.4,'sine',.07,.1,70); },
    /* national-park arrival ambiences 🏞️ */
    waves()    { wet(0.55,220,80,.12); wet(0.5,180,70,.1); },
    rumble()   { tone(60,.9,'sine',.16,0,45); tone(95,.5,'sawtooth',.07,.2,60); },
    shimmer()  { [1800,2200,2600,3000].forEach((f,i)=>tone(f,.3,'sine',.05,i*.08)); },
    birds()    { [1300,1700,1500,1900,1600].forEach((f,i)=>tone(f,.09,'sine',.05,i*.13)); },
    breeze()   { wet(0.8,520,200,.1); },
    geyser()   { wet(0.6,150,460,.13); tone(90,.5,'sine',.08,0,60); },
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
  function enVoices() {
    return (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(v => v.lang.startsWith('en'));
  }
  function pickVoice() {
    const vs = enVoices();
    if (!vs.length) return;
    if (S.voiceName) { voice = vs.find(v => v.name === S.voiceName) || voice; if (voice) return; }
    // prefer the most natural-sounding voices available on this device
    // (Edge "Online Natural", neural voices, enhanced Apple voices, then Google)
    const ranks = [/online.*natural/i, /natural/i, /neural/i, /premium/i, /enhanced/i,
      /Ava|Zoe|Allison|Joelle|Aria|Jenny/i, /Samantha/i, /Google US English/i, /Karen|Moira|female/i];
    for (const r of ranks) { const v = vs.find(v => r.test(v.name)); if (v) { voice = v; return; } }
    voice = vs[0];
  }
  function cycleVoice() {       // settings: tap to try the next voice
    const vs = enVoices();
    if (!vs.length) return null;
    const i = vs.findIndex(v => voice && v.name === voice.name);
    voice = vs[(i + 1) % vs.length];
    S.voiceName = voice.name;
    say('Hi! I sound like this!', { force: true });
    return voice.name;
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
    // DON'T cut a line short: if we're already reading something aloud and this
    // isn't a forced read (a button the child tapped, or a dialog they opened),
    // skip it — let the current line finish so the child can listen fully.
    const force = opts && opts.force;
    if (speechSynthesis.speaking && !force) return;
    speechSynthesis.cancel();
    // Chrome quirk: speaking immediately after cancel() silently drops the
    // utterance — queue it a tick later. Speak sentence-by-sentence with
    // natural micro-pauses, the way a person reads to a child.
    const useVoice = (opts && opts.voiceObj) || voice;
    const baseRate = ((opts && opts.rate) || 0.92) * speedInfo().rate;   // game-speed aware
    const basePitch = (opts && opts.pitch) || 1.0;
    setTimeout(() => {
      if (!voice) pickVoice();          // voices sometimes load late
      const parts = clean.match(/[^.!?…]+[.!?…]*/g) || [clean];
      for (const part of parts) {
        const p = part.trim();
        if (!p) continue;
        const u = new SpeechSynthesisUtterance(p);
        u.rate = baseRate; u.pitch = basePitch;   // calm, human pace — no chipmunk
        // tiny lift on questions and excitement, like real speech
        if (/\?$/.test(p)) u.pitch = basePitch + 0.08;
        else if (/!$/.test(p)) { u.pitch = basePitch + 0.05; u.rate = baseRate + 0.04; }
        if (useVoice) u.voice = useVoice;
        speechSynthesis.speak(u);       // queued utterances get natural gaps
      }
    }, 60);
  }
  /* Bella the elephant speaks in her own deep, gentle voice — different from
     the player's chosen voice — after a little trumpet toot 🐘🎺 */
  let bellaV = null;
  function pickBella() {
    const vs = enVoices();
    if (!vs.length) return;
    const deep = vs.find(v => /male|daniel|fred|alex|aaron|arthur|rishi|oliver|google uk english male/i.test(v.name)
                              && (!voice || v.name !== voice.name));
    bellaV = deep || vs.find(v => !voice || v.name !== voice.name) || vs[0];
  }
  function sayBella(text) {
    sfx.trumpet();
    if (!bellaV) pickBella();
    setTimeout(() => say(text, { voiceObj: bellaV, pitch: 0.7, rate: 0.9, force: false }), 360);
  }
  /* each animal kind has its own little voice 🐾 */
  const ANIMAL_CALL = {
    bunny:'squeak', cat:'meow', puppy:'woof', butterfly:'chirp',
    trex:'roar', trice:'roar', longneck:'lowrumble', mammoth:'lowrumble',
    elephant:'trumpet', puzzleEle:'trumpet', penguin:'squawk', capy:'grunt', panda:'grunt',
  };
  function animalCall(kind) { const f = sfx[ANIMAL_CALL[kind]]; if (f) f(); }
  /* each region greets you with its own sound 🏞️ */
  const REGION_SOUND = {
    yosemite:'birds', zion:'breeze', grandcanyon:'breeze', yellowstone:'geyser',
    olympic:'birds', everglades:'waves', glacier:'shimmer', denali:'shimmer',
    acadia:'waves', hawaii:'rumble',
  };
  function regionSound(key) { const f = sfx[REGION_SOUND[key]]; if (f) f(); }
  /* a distinct speaking voice per character (shopkeepers etc.) so nobody
     sounds the same — base pitch by animal kind + a per-name twist, and a
     different system voice where the device offers more than one 🗣️ */
  const KIND_PITCH = { capy:0.8, panda:0.85, bunny:1.28, puppy:1.12, cat:1.18,
    butterfly:1.42, penguin:1.0, mammoth:0.6, trex:0.62, elephant:0.7, puzzleEle:1.3 };
  function voiceFor(kind, seed) {
    seed = Math.abs(seed | 0);
    const vs = enVoices();
    const base = KIND_PITCH[kind] != null ? KIND_PITCH[kind] : 1.0;
    return {
      pitch: Math.max(0.4, Math.min(2, base + ((seed % 5) - 2) * 0.06)),
      rate: 0.9 + ((seed % 3) - 1) * 0.05,
      voiceObj: vs.length ? vs[seed % vs.length] : null,
    };
  }
  function seedFor(text) {
    let h = 0; const s = String(text);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
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

  return { settings:S, ensureCtx, sfx, startMusic, say, sayBella, stopSay, listen, hasSR:!!SR,
           cycleVoice, animalCall, regionSound, voiceFor, seedFor,
           speedInfo, cycleSpeed, durMul, SPEED_ORDER,
           voiceName: () => voice ? voice.name : 'default' };
})();
