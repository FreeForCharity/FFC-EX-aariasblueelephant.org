/*! © 2026 Aaria's Blue Elephant · aariasblueelephant.org · All rights reserved.
 * ABE Game Kit — the shared shell every new game plugs into, so all games have
 * the SAME controls, title screen, calm mode, replay ("My Movie"), sharing and
 * privacy posture (everything on-device; one anonymous play tally, no IDs).
 * Built by Aaria and her Friends 💙
 *
 * A game calls:
 *   ABEKit.init({
 *     slug:'grocery', name:"Aaria's Grocery Store", emoji:'🛒', accent:'#f59e0b',
 *     tagline:'shop with your list, wait your turn, pay & bag!',  // finishes "Built for Aaria and Her Friends 💖 — …"
 *     emojis:['🛒','🍎','🥕','🧾','🪙'],   // title-screen emoji row
 *     // logo.png (the round ABE badge, see public/magnetblocks/logo.png) must be vendored into the game's own folder
 *     // /legal/disclosure.html link is automatic — every kit game gets it for free
 *     howTo:[['🕹️','Walk with the stick or arrow keys'],['👆','Tap anything to walk to it'],...],
 *     onStart(){}, onPause(paused){}, onFrame(dt){}, onReplayEvent(ev){},
 *     replayableState:{ get(){}, set(state){} },   // snapshot for safe replay enter/exit
 *     actions:[{emoji:'✋', label:'Grab', title:'Pick up / put down', onTap(){}}],
 *   })
 * and uses: ABEKit.save/load, .toast, .say, .sfx, .calm(), .speed(), .recordEvent,
 * .joy {x,z,active}, .paused, .replaying, .queueWalkTo/consumeWalkTarget.
 */
(function () {
  const K = (window.ABEKit = {});
  const $ = (id) => document.getElementById(id);
  let cfg = null;

  // ---------- profiles (siblings share a tablet without clobbering each other) ----------
  // Profile p1 maps to the ORIGINAL unprefixed keys so nobody's saves are lost.
  const AVATARS = [
    { id: 'p1', emoji: '🐘' }, { id: 'p2', emoji: '🦊' }, { id: 'p3', emoji: '🐰' }, { id: 'p4', emoji: '🦄' },
  ];
  let prof = 'p1';
  try { prof = localStorage.getItem('abe.profile.current') || 'p1'; } catch (e) {}
  if (!AVATARS.some((a) => a.id === prof)) prof = 'p1';
  K.profile = () => prof;
  const kk = (key) => prof === 'p1' ? `abe.${cfg.slug}.${key}` : `abe.${cfg.slug}.${prof}.${key}`;

  // ---------- persistence (per-game, per-profile namespace, on-device only) ----------
  K.save = (key, val) => { try { localStorage.setItem(kk(key), JSON.stringify(val)); } catch (e) {} };
  K.load = (key, fallback) => {
    try { const v = localStorage.getItem(kk(key)); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  };

  // ---------- daily streak helper (any game: K.streakBump() on its "completed something today") ----------
  const dayStr = (off) => new Date(Date.now() - (off || 0) * 86400000).toISOString().slice(0, 10);
  K.streak = () => K.load('streak', { last: '', n: 0 }).n;
  K.streakBump = () => {
    const s = K.load('streak', { last: '', n: 0 });
    if (s.last === dayStr(0)) return { n: s.n, grew: false };
    s.n = s.last === dayStr(1) ? s.n + 1 : 1; s.last = dayStr(0);
    K.save('streak', s);
    return { n: s.n, grew: true };
  };

  // ---------- season helper (date-driven freshness, shared by every kit game) ----------
  K.season = () => {
    const m = new Date().getMonth();
    return m === 11 || m < 2 ? { id: 'winter', emoji: '❄️' }
      : m < 5 ? { id: 'spring', emoji: '🌸' }
      : m < 8 ? { id: 'summer', emoji: '☀️' }
      : { id: 'fall', emoji: '🍂' };
  };

  // ---------- game passport (cross-game sticker shelf; one stamp per game per day) ----------
  // FUTURE GAMES: add one line here and the passport, /games page, and offline
  // cache (public/sw.js) are the only three registration spots outside the game.
  const CATALOG = [
    { slug: 'nilus-world', name: "Nilu's World", emoji: '🐘', url: '/nelus-world' },
    { slug: 'elly-tubbies', name: 'Elly-Tubbies', emoji: '☀️', url: '/1' },
    { slug: 'blockcraft', name: 'Block Craft 3D', emoji: '🧱', url: '/2' },
    { slug: 'roadsafety', name: 'Road Safety Heroes', emoji: '🚦', url: '/4' },
    { slug: 'doughlab', name: 'Dough Lab 3D', emoji: '🫓', url: '/5' },
    { slug: 'magnetblocks', name: 'Magnet Blocks', emoji: '🧲', url: '/6' },
    { slug: 'helpinghands', name: "Nilu's Helping Hands", emoji: '🖐️', url: '/7' },
    { slug: 'grocery', name: "Aaria's Grocery Store", emoji: '🛒', url: '/8' },
    { slug: 'dayplanner', name: "Aaria's Day Planner", emoji: '📅', url: '/9' },
  ];
  const passKey = () => prof === 'p1' ? 'abe.passport.v1' : `abe.passport.${prof}.v1`;
  function passGet() { try { return JSON.parse(localStorage.getItem(passKey())) || {}; } catch (e) { return {}; } }
  function stampToday() {
    try {
      const p = passGet(), e = p[cfg.slug] || { days: 0, last: '' };
      if (e.last === dayStr(0)) return false;
      e.days++; e.last = dayStr(0); p[cfg.slug] = e;
      localStorage.setItem(passKey(), JSON.stringify(p));
      return true;
    } catch (e) { return false; }
  }

  // ---------- settings (shared shape across all kit games) ----------
  const S = { sound: true, calm: false, speed: 'normal', voice: true, music: true };
  const SPEED = { relaxed: { ico: '🐢', mul: 1.5 }, normal: { ico: '🐇', mul: 1 }, fast: { ico: '🚀', mul: 0.6 } };
  K.calm = () => S.calm;
  K.speed = () => SPEED[S.speed].mul;
  K.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- audio: gentle synth, master-mute covers sfx + speech ----------
  let ctx = null, muted = false;
  function ac() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function tone(f, dur, type, vol) {
    if (muted || !S.sound) return;
    try {
      const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime((vol || 0.12) * (S.calm ? 0.5 : 1), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  K.sfx = {
    tap: () => tone(520, 0.08, 'triangle'),
    yes: () => { tone(660, 0.12, 'triangle'); setTimeout(() => tone(880, 0.16, 'triangle'), 90); },
    star: () => { [660, 830, 990, 1320].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.1), i * 90)); },
    no: () => { tone(360, 0.12, 'sine', 0.07); setTimeout(() => tone(300, 0.14, 'sine', 0.07), 110); },
    pop: () => tone(300, 0.09, 'square', 0.06),
  };
  // ---------- ambient music: a very soft generative loop, no audio files ----------
  // Gentle pad chords + sparse plucks. OFF automatically in Calm Mode (sensory-
  // friendly), OFF with mute, toggleable in settings for every kit game.
  let mus = null;
  function startMusic() {
    if (mus || muted || !S.music || S.calm) return;
    try {
      const c = ac(), g = c.createGain();
      g.gain.value = 0.04; g.connect(c.destination);
      mus = { g, t1: 0, t2: 0, stop: false };
      const CHORDS = [[262, 330, 392], [220, 262, 330], [175, 220, 262], [196, 247, 294]];
      let ci = 0;
      const pad = () => {
        if (mus.stop) return;
        for (const f of CHORDS[ci++ % 4]) {
          const o = c.createOscillator(), og = c.createGain(), t = c.currentTime;
          o.type = 'triangle'; o.frequency.value = f / 2;
          og.gain.setValueAtTime(0.0001, t);
          og.gain.linearRampToValueAtTime(0.5, t + 2.5);
          og.gain.linearRampToValueAtTime(0.0001, t + 7.6);
          o.connect(og).connect(g); o.start(t); o.stop(t + 8);
        }
        mus.t1 = setTimeout(pad, 7200);
      };
      const pluck = () => {
        if (mus.stop) return;
        const o = c.createOscillator(), og = c.createGain(), t = c.currentTime;
        o.type = 'sine'; o.frequency.value = [523, 587, 659, 784, 880][Math.floor(Math.random() * 5)];
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(0.35, t + 0.03);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        o.connect(og).connect(g); o.start(t); o.stop(t + 1.5);
        mus.t2 = setTimeout(pluck, 2800 + Math.random() * 2800);
      };
      pad(); setTimeout(pluck, 1600);
    } catch (e) { mus = null; }
  }
  function stopMusic() {
    if (!mus) return;
    mus.stop = true; clearTimeout(mus.t1); clearTimeout(mus.t2);
    try { mus.g.disconnect(); } catch (e) {}
    mus = null;
  }
  function refreshMusic() { stopMusic(); if ($('kTitle').style.display === 'none' && !K.paused) startMusic(); }

  K.say = (text) => {
    if (muted || !S.voice || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}]/gu, ''));
      u.rate = 0.95 / K.speed() > 1.3 ? 1.05 : 0.95; u.pitch = 1.1; speechSynthesis.speak(u);
    } catch (e) {}
  };
  K.toast = (msg, ms) => {
    const t = $('kToast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), (ms || 2600) * K.speed());
  };
  K.chip = (msg) => { const c = $('kChip'); if (!msg) { c.style.display = 'none'; return; } c.style.display = 'block'; c.textContent = msg; };

  // ---------- input: joystick + keys + tap-to-walk target ----------
  K.joy = { x: 0, z: 0, active: false };
  let walkTarget = null;
  K.queueWalkTo = (x, z) => { walkTarget = { x, z }; };
  K.consumeWalkTarget = () => walkTarget;
  K.clearWalkTarget = () => { walkTarget = null; };
  function wireStick() {
    const stick = $('kStick'), knob = $('kKnob');
    let pid = null;
    const set = (e) => {
      const r = stick.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dz = e.clientY - (r.top + r.height / 2);
      const m = Math.hypot(dx, dz), max = r.width / 2 - 18;
      if (m > max) { dx *= max / m; dz *= max / m; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dz}px))`;
      K.joy.x = dx / max; K.joy.z = dz / max; K.joy.active = true; walkTarget = null;
    };
    stick.addEventListener('pointerdown', (e) => { pid = e.pointerId; stick.setPointerCapture(pid); set(e); ac(); });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId === pid) set(e); });
    const end = () => { pid = null; K.joy.x = K.joy.z = 0; K.joy.active = false; knob.style.transform = 'translate(-50%,-50%)'; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    const keys = new Set();
    const re = () => {
      K.joy.x = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
      K.joy.z = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
      K.joy.active = !!(K.joy.x || K.joy.z); if (K.joy.active) walkTarget = null;
    };
    addEventListener('keydown', (e) => { keys.add(e.code); re(); });
    addEventListener('keyup', (e) => { keys.delete(e.code); re(); });
  }

  // ---------- adventure recorder (RAM ring, persisted; NO identifiers) ----------
  const REC = { t0: 0, samples: [], events: [], resumeAt: 0 };
  const REC_MS = 250, REC_MAX = 1200, REC_MIN = 20000;
  let recAcc = 0;
  K.recordEvent = (kind, extra) => {
    if (K.paused || K.replaying) return;
    const t = performance.now() - REC.t0 + REC.resumeAt;
    REC.events.push([Math.round(t), kind, extra || 0]);
    if (REC.events.length > 400) REC.events.shift();
  };
  function recTick(dt, pos) {
    if (K.paused || K.replaying || !pos) return;
    recAcc += dt * 1000;
    if (recAcc < REC_MS) return;
    recAcc = 0;
    const t = performance.now() - REC.t0 + REC.resumeAt;
    REC.samples.push([Math.round(t), +pos.x.toFixed(2), +pos.z.toFixed(2), +(pos.ry || 0).toFixed(2)]);
    while (REC.samples.length > REC_MAX) {
      REC.samples.shift();
      while (REC.events.length && REC.events[0][0] < REC.samples[0][0]) REC.events.shift();
    }
  }
  const recSpan = () => (REC.samples.length < 2 ? 0 : REC.samples[REC.samples.length - 1][0] - REC.samples[0][0]);
  function persistRec() { K.save('replay.v1', { samples: REC.samples, events: REC.events }); }
  addEventListener('pagehide', persistRec);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persistRec(); });

  // ---------- replay ("My Movie") ----------
  K.replaying = false;
  let rp = null;
  function startReplay(data, own) {
    if (K.replaying) return;
    const snap = cfg.replayableState ? cfg.replayableState.get() : null;
    K.replaying = true;
    rp = { data, own, t: data.samples[0][0], i: 0, ei: 0, speed: 1, snap };
    $('kReplayBar').style.display = 'flex'; $('kHud').style.display = 'none';
    $('kStick').style.display = 'none'; $('kActs').style.display = 'none';
    K.chip('');
    K.toast(own ? '▶️ My Movie!' : "▶️ A friend's adventure!");
  }
  function endReplay() {
    if (!K.replaying) return;
    K.replaying = false;
    if (cfg.replayableState && rp.snap != null) cfg.replayableState.set(rp.snap);
    $('kReplayBar').style.display = 'none'; $('kHud').style.display = 'flex';
    $('kStick').style.display = 'block'; $('kActs').style.display = 'flex';
    K.toast('What an adventure! 🌟'); K.sfx.star();
    rp = null;
  }
  // games call this each frame while K.replaying to get the position to show
  K.replayPose = (dt) => {
    if (!rp) return null;
    rp.t += dt * 1000 * rp.speed;
    const S_ = rp.data.samples;
    while (rp.i < S_.length - 2 && S_[rp.i + 1][0] <= rp.t) rp.i++;
    const a = S_[rp.i], b = S_[Math.min(rp.i + 1, S_.length - 1)];
    if (rp.t >= S_[S_.length - 1][0]) { endReplay(); return null; }
    const f = b[0] === a[0] ? 0 : Math.min(1, (rp.t - a[0]) / (b[0] - a[0]));
    while (rp.ei < rp.data.events.length && rp.data.events[rp.ei][0] <= rp.t) {
      const ev = rp.data.events[rp.ei++];
      cfg.onReplayEvent && cfg.onReplayEvent({ kind: ev[1], extra: ev[2] });
    }
    return { x: a[1] + (b[1] - a[1]) * f, z: a[2] + (b[2] - a[2]) * f, ry: a[3] + (b[3] - a[3]) * f };
  };
  function shareAdventure() {
    if (recSpan() < REC_MIN) { K.toast('Play a little first, then share your adventure! 📤'); return; }
    const blob = new Blob([JSON.stringify({ app: cfg.slug, v: 1, kind: 'adventure', samples: REC.samples, events: REC.events })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `my-adventure.${cfg.slug}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    K.toast('Adventure saved! Send it to a friend! 📤'); K.sfx.yes();
  }
  function importAdventure(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (d.app !== cfg.slug || !Array.isArray(d.samples) || d.samples.length < 4) throw 0;
        d.samples = d.samples.slice(0, REC_MAX).filter((s) => Array.isArray(s) && s.length >= 3 && s.every(Number.isFinite));
        d.events = (Array.isArray(d.events) ? d.events : []).slice(0, 400);
        startReplay(d, false);
      } catch (e) { K.toast("Hmm, that file isn't an adventure 💛"); }
    };
    r.readAsText(file);
  }

  // ---------- pause ----------
  K.paused = false;
  function setPaused(p) {
    K.paused = p;
    $('kPause').style.display = p ? 'flex' : 'none';
    if (p && window.speechSynthesis) speechSynthesis.cancel();
    cfg.onPause && cfg.onPause(p);
  }

  // ---------- anonymous play-time tally (aggregate seconds only, ZERO identifiers) ----------
  // Counts only ACTIVE play: after Play is pressed, not paused, tab visible.
  // Flushed in small batches so a closed tab loses at most a minute.
  const TIME = { acc: 0, last: 0, on: false };
  function timeFlush() {
    const s = Math.floor(TIME.acc);
    if (s < 5 || !cfg.anonKey) { return; }
    TIME.acc -= s;
    try {
      fetch('https://joclqxgedhdgslxnovxz.supabase.co/rest/v1/rpc/record_game_time', {
        method: 'POST', keepalive: true,
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ g: cfg.slug, s }),
      }).catch(() => {});
    } catch (e) {}
  }
  function timeTick() {
    const now = performance.now();
    if (TIME.on && !K.paused && !document.hidden) TIME.acc += (now - TIME.last) / 1000;
    TIME.last = now;
  }
  setInterval(() => { timeTick(); if (TIME.acc >= 60) timeFlush(); }, 5000);
  addEventListener('pagehide', () => { timeTick(); timeFlush(); });

  // ---------- anonymous play tally (one per session, ZERO identifiers) ----------
  function ping() {
    try {
      if (sessionStorage.getItem(`abe_played_${cfg.slug}`)) return;
      sessionStorage.setItem(`abe_played_${cfg.slug}`, '1');
      const KEY = cfg.anonKey; if (!KEY) return;
      fetch('https://joclqxgedhdgslxnovxz.supabase.co/rest/v1/rpc/record_game_play', {
        method: 'POST', keepalive: true,
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ g: cfg.slug }),
      }).catch(() => {});
    } catch (e) {}
  }

  // ---------- shell construction (the UI itself) ----------
  function buildShell() {
    document.documentElement.style.setProperty('--k-accent', cfg.accent);
    const el = document.createElement('div');
    el.innerHTML = `
  <div id="kHud" style="display:none">
    <button class="kBtn" id="kMute" title="Sound on or off">🔊<span class="kLbl">Sound</span></button>
    <button class="kBtn" id="kPauseBtn" title="Take a break">⏸️<span class="kLbl">Pause</span></button>
    <button class="kBtn" id="kMovie" title="Watch your adventure like a movie!">▶️<span class="kLbl">My Movie</span></button>
    <button class="kBtn" id="kShare" title="Save your adventure as a file to share">📤<span class="kLbl">Share</span></button>
    <button class="kBtn" id="kSettings" title="Settings">⚙️<span class="kLbl">More</span></button>
  </div>
  <div id="kChip" style="display:none"></div>
  <div id="kStick" style="display:none"><div id="kKnob"><img src="logo.png" alt=""></div></div>
  <div id="kActs" style="display:none"></div>
  <div id="kToast"></div>
  <div id="kReplayBar" style="display:none">
    <span>▶️ My Movie</span>
    <button id="kRSpeed" title="Play faster or slower">1x</button>
    <button id="kRShare" title="Save this adventure as a file">📤 Share</button>
    <button id="kRDone" title="Back to playing">⏹ Done</button>
  </div>
  <div id="kPause" style="display:none">
    <div class="kTitleCard"><h1>Taking a break 💙</h1>
      <button class="kBig" id="kResume" title="Keep playing">Keep playing ▶️</button></div>
  </div>
  <div id="kTitle">
    <div class="kTitleCard">
      <img class="kLogo" src="logo.png" alt="Aaria's Blue Elephant — Building a New Inclusive World">
      <h1>${cfg.name}</h1>
      <p>Built for <b>Aaria and Her Friends</b> 💖 — ${cfg.tagline}</p>
      <a id="kDisclosure" href="/legal/disclosure.html" target="_blank" rel="noopener">General Disclosure</a>
      <div class="kTitleEmojis">${(cfg.emojis || []).join('')}</div>
      <div class="kAvatars"><span class="kAvLbl">Who is playing?</span>${AVATARS.map((a) =>
        `<button class="kAvatar" data-p="${a.id}" title="Play as ${a.emoji}">${a.emoji}</button>`).join('')}</div>
      <button class="kBig" id="kPlay" title="Start playing">▶️ Play</button>
      <div id="kTitleExtras" style="display:none;margin-top:6px">
        <button class="kBig kAlt" id="kTitleMovie" title="Watch your last adventure">▶️ My Movie</button>
        <button class="kBig kAlt" id="kTitleImport" title="Watch a friend's adventure file">📥 Friend's adventure</button>
        <button class="kBig kAlt" id="kTitlePass" title="See your stamps from every game">🛂 Passport</button>
      </div>
      <div id="kHow" style="text-align:left;margin-top:10px;display:inline-block"></div>
      <div><button class="kSmall" id="kFs" title="Play in full screen">⛶ Full Screen</button></div>
      <div class="kOrgFooter">A game from <b>Aaria's Blue Elephant</b> 🐘💙 · aariasblueelephant.org</div>
    </div>
  </div>
  <input type="file" id="kImportFile" accept=".json,application/json" style="display:none">`;
    document.body.appendChild(el);
    // how-to rows
    $('kHow').innerHTML = (cfg.howTo || []).map(([e, t]) => `<div style="margin:4px 0;font-size:14px"><b>${e}</b> ${t}</div>`).join('');
    // action buttons (game-specific, still standard style)
    for (const a of cfg.actions || []) {
      const b = document.createElement('button');
      b.className = 'kAct'; b.title = a.title || a.label;
      b.innerHTML = `${a.emoji}<span class="kLbl">${a.label}</span>`;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); ac(); a.onTap && a.onTap(); });
      $('kActs').appendChild(b);
    }
  }

  function refreshMute() { $('kMute').innerHTML = muted ? '🔇<span class="kLbl">Sound</span>' : '🔊<span class="kLbl">Sound</span>'; }

  function refreshAvatars() {
    document.querySelectorAll('.kAvatar').forEach((b) => b.classList.toggle('on', b.dataset.p === prof));
  }
  function switchProfile(id) {
    prof = id;
    try { localStorage.setItem('abe.profile.current', id); } catch (e) {}
    // this profile's own settings + saved adventure take over
    Object.assign(S, { sound: true, calm: false, speed: 'normal', voice: true, music: true }, K.load('settings', {}));
    const saved = K.load('replay.v1', null);
    REC.samples = (saved && saved.samples) || []; REC.events = (saved && saved.events) || [];
    REC.resumeAt = (REC.samples.length ? REC.samples[REC.samples.length - 1][0] : 0) + 1000;
    $('kTitleMovie').style.display = recSpan() >= REC_MIN ? '' : 'none';
    refreshAvatars(); K.sfx.tap();
  }

  // ---------- passport shelf (the cross-game collection that ties all games together) ----------
  function openPassport() {
    const p = document.createElement('div'); p.className = 'kPanel'; p.id = 'kPass';
    const stamps = passGet();
    const seen = CATALOG.filter((g) => stamps[g.slug] && stamps[g.slug].days > 0).length;
    const av = AVATARS.find((a) => a.id === prof) || AVATARS[0];
    p.innerHTML = `<div class="kPanelCard"><h2>🛂 ${av.emoji} My Game Passport</h2>
      <p class="kPassSub">${seen} of ${CATALOG.length} games explored${seen >= CATALOG.length ? ' — you found them ALL! 🏆' : ' — collect them all!'}</p>
      ${CATALOG.map((g) => {
        const st = stamps[g.slug], here = g.slug === cfg.slug;
        const days = st ? st.days : 0;
        const stars = days ? '⭐'.repeat(Math.min(days, 5)) + (days > 5 ? ` ×${days}` : '') : '';
        return `<div class="kPassRow ${days ? 'got' : ''}">
          <span class="kPassEmoji">${g.emoji}</span>
          <span class="kPassName">${g.name}${here ? ' <small>· you are here</small>' : ''}</span>
          <span class="kPassStars">${days ? stars : '· · ·'}</span>
          ${here ? '' : `<a class="kPassGo" href="${g.url}" title="Go play ${g.name}">▶️</a>`}
        </div>`;
      }).join('')}
      <button class="kRow" id="kPassClose" title="Close the passport">✔️ Done</button></div>`;
    document.body.appendChild(p);
    $('kPassClose').onclick = () => p.remove();
  }

  function openSettings() {
    const p = document.createElement('div'); p.className = 'kPanel'; p.id = 'kSet';
    const row = (id, txt) => `<button class="kRow" id="${id}" title="${txt.replace(/<[^>]*>/g, '')}">${txt}</button>`;
    p.innerHTML = `<div class="kPanelCard"><h2>⚙️ Settings</h2>
      ${row('ksCalm', `😌 Calm mode: <b>${S.calm ? 'ON' : 'off'}</b>`)}
      ${row('ksSpeed', `${SPEED[S.speed].ico} Game speed`)}
      ${row('ksVoice', `🗣️ Read aloud: <b>${S.voice ? 'ON' : 'off'}</b>`)}
      ${row('ksMusic', `🎵 Music: <b>${S.music ? 'ON' : 'off'}</b>`)}
      ${row('ksPass', `🛂 My Game Passport`)}
      ${row('ksImport', `📥 Watch a friend's adventure`)}
      ${row('ksHome', `🏠 More games (back to the site)`)}
      ${row('ksClose', `✔️ Done`)}</div>`;
    document.body.appendChild(p);
    const saveS = () => K.save('settings', S);
    $('ksCalm').onclick = () => { S.calm = !S.calm; saveS(); refreshMusic(); p.remove(); openSettings(); };
    $('ksMusic').onclick = () => { S.music = !S.music; saveS(); refreshMusic(); p.remove(); openSettings(); };
    $('ksPass').onclick = () => { p.remove(); openPassport(); };
    $('ksSpeed').onclick = () => {
      const o = ['relaxed', 'normal', 'fast']; S.speed = o[(o.indexOf(S.speed) + 1) % 3]; saveS();
      K.toast(`${SPEED[S.speed].ico} Speed: ${S.speed}`); p.remove(); openSettings();
    };
    $('ksVoice').onclick = () => { S.voice = !S.voice; saveS(); p.remove(); openSettings(); };
    $('ksImport').onclick = () => { p.remove(); $('kImportFile').click(); };
    $('ksHome').onclick = () => { location.href = '/'; };
    $('ksClose').onclick = () => p.remove();
  }

  // ---------- init ----------
  K.init = function (c) {
    cfg = c;
    Object.assign(S, K.load('settings', {}));
    document.title = `${c.name} | Aaria's Blue Elephant`;
    buildShell();
    // last-game stamp for the site's smart Play button
    try { localStorage.setItem('abe_last_game', JSON.stringify({ url: location.pathname, name: c.name, emoji: c.emoji, at: Date.now() })); } catch (e) {}
    // restore persisted adventure so the title-screen Movie button works
    const saved = K.load('replay.v1', null);
    if (saved && Array.isArray(saved.samples)) {
      REC.samples = saved.samples; REC.events = saved.events || [];
      REC.resumeAt = (REC.samples.length ? REC.samples[REC.samples.length - 1][0] : 0) + 1000;
    }
    if (recSpan() >= REC_MIN) { $('kTitleExtras').style.display = 'block'; }
    else { $('kTitleExtras').style.display = 'block'; $('kTitleMovie').style.display = 'none'; }
    REC.t0 = performance.now();

    const begin = (then) => {
      $('kTitle').style.display = 'none';
      $('kHud').style.display = 'flex'; $('kStick').style.display = 'block'; $('kActs').style.display = 'flex';
      ac(); ping(); startMusic();
      TIME.on = true; TIME.last = performance.now();
      if (stampToday()) setTimeout(() => { K.toast('🛂 Passport stamped! ⭐'); K.sfx.pop(); }, 1500);
      cfg.onStart && cfg.onStart(); then && then();
    };
    $('kPlay').onclick = () => { K.sfx.yes(); begin(); };
    $('kTitlePass').onclick = openPassport;
    $('kFs').onclick = () => {
      try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {}
    };
    document.querySelectorAll('.kAvatar').forEach((b) => b.addEventListener('pointerdown', () => switchProfile(b.dataset.p)));
    refreshAvatars();
    // offline: cache this game (and every other one visited) for cars & waiting rooms
    if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('/sw.js'); } catch (e) {} }
    $('kTitleMovie').onclick = () => { K.sfx.tap(); begin(() => startReplay({ samples: REC.samples, events: REC.events }, true)); };
    $('kTitleImport').onclick = () => { begin(); $('kImportFile').click(); };
    $('kImportFile').addEventListener('change', (e) => { if (e.target.files[0]) importAdventure(e.target.files[0]); e.target.value = ''; });
    $('kMute').onclick = () => { muted = !muted; if (muted && window.speechSynthesis) speechSynthesis.cancel(); refreshMute(); refreshMusic(); K.toast(muted ? '🔇 Sound is off' : '🔊 Sound is on!'); };
    $('kPauseBtn').onclick = () => { setPaused(true); stopMusic(); };
    $('kResume').onclick = () => { setPaused(false); refreshMusic(); };
    $('kMovie').onclick = () => { recSpan() >= REC_MIN ? startReplay({ samples: REC.samples, events: REC.events }, true) : K.toast('Play a little first, then watch your movie! ▶️'); };
    $('kShare').onclick = shareAdventure;
    $('kRShare').onclick = shareAdventure;
    $('kRDone').onclick = endReplay;
    $('kRSpeed').onclick = () => { rp.speed = rp.speed >= 4 ? 1 : rp.speed * 2; $('kRSpeed').textContent = rp.speed + 'x'; };
    $('kSettings').onclick = openSettings;
    wireStick();
    document.addEventListener('visibilitychange', () => { if (document.hidden && !K.paused && $('kTitle').style.display === 'none') setPaused(true); });

    // main loop wrapper: the game renders; the kit records
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!K.paused) {
        cfg.onFrame && cfg.onFrame(dt);
        if (cfg.playerPos && !K.replaying) recTick(dt, cfg.playerPos());
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };
})();
