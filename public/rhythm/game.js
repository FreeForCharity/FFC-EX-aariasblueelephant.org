/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Nilu's Music Meadow — SONG MODE (window.RGame).

   Glowing notes float down from the twilight sky onto each musician's stage pad.
   Tap the animal as its note lands. There is NO wrong here: a note you miss is
   played softly by the meadow itself, a tap with no note is just more music, and
   the results screen is always warm. Bilingual EN/ES from birth.

   Loaded as a plain browser script after lib/three.min.js, ../gamekit/kit.js and
   songs.js. It builds its own DOM (styled by play.css) and its own 3D objects, so
   index.html needs no markup for any of this. */
(function () {
  "use strict";

  /* ---------- little safe helpers (never let song mode break the meadow) ---------- */
  let K = window.ABEKit || {};
  const tr = (en, es) => { try { return K.tr ? K.tr(en, es) : en; } catch (e) { return en; } };
  const es = () => { try { return !!(K.es && K.es()); } catch (e) { return false; } };
  const calm = () => { try { return !!(K.calm && K.calm()); } catch (e) { return false; } };
  const reduceMotion = () => {
    try {
      const r = K.reduceMotion;
      return typeof r === 'function' ? !!r() : !!r;
    } catch (e) { return false; }
  };
  const sfxTap = () => { try { K.sfx && K.sfx.tap && K.sfx.tap(); } catch (e) {} };
  const sfxStar = () => { try { K.sfx && K.sfx.star && K.sfx.star(); } catch (e) {} };
  const say = (m) => { try { K.say && K.say(m); } catch (e) {} };
  const toast = (m, ms) => { try { K.toast && K.toast(m, ms); } catch (e) {} };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* ---------- tuning ---------- */
  const APPROACH = 2.2;          // seconds a note takes to float down
  const LEAD = 0.6;              // quiet beat before the first note starts falling
  const TAIL = 1.2;              // let the last note ring out before results
  const W_PERFECT = 0.22;
  const W_GOOD = 0.45;
  const TOP_Y = 9;               // where notes are born
  const LAND_Y = 1.15;           // where they meet the musician
  const ORB = 1.05;
  const FALLBACK_COLORS = ['#ffb35c', '#ffd6e0', '#93d97e', '#9fc8ff'];

  /* ---------- state ---------- */
  let host = null, THREE = null, scene = null, A = null, colors = FALLBACK_COLORS;
  const D = {};                  // DOM refs
  const S = {
    ready: false, ok3d: false, built: false,
    playing: false, pickerOpen: false, resultOpen: false,
    song: null, songIdx: -1, lastId: null,
    notes: [], lanes: [[], [], [], []], lanePtr: [0, 0, 0, 0],
    live: [], pool: [], rings: [], ringFlash: [0, 0, 0, 0],
    clock: 0, dur: 0, time: 0,
    approach: APPROACH, wPerfect: W_PERFECT, wGood: W_GOOD,
    score: 0, combo: 0, bestCombo: 0, hits: 0, perfects: 0, resolved: 0, total: 0,
    ended: false, endT: 0,
    judgeT: 0, comboT: 0, lastPoint: -9,
    shownScore: -1, shownCombo: -1, shownStars: -1,
  };

  const hostCall = (fn, a, b) => {
    try { if (host && typeof host[fn] === 'function') return host[fn](a, b); } catch (e) {}
    return undefined;
  };
  const songList = () => (Array.isArray(window.RSONGS) ? window.RSONGS.filter((s) => s && s.id) : []);
  const songTitle = (s) => {
    if (!s) return '';
    const t = s.title;
    if (!t) return String(s.id || '');
    if (typeof t === 'string') return t;
    return (es() && t.es) ? t.es : (t.en || t.es || String(s.id || ''));
  };
  const bestKey = (id) => 'best.' + id;
  const loadBest = (id) => {
    try {
      const b = K.load ? K.load(bestKey(id), null) : null;
      return (b && typeof b === 'object') ? b : null;
    } catch (e) { return null; }
  };
  const starStr = (n) => {
    const k = clamp(Math.round(n || 0), 0, 3);
    return '★★★'.slice(0, k) + '☆☆☆'.slice(0, 3 - k);
  };
  const diffLabel = (d) => {
    const dots = '●●●'.slice(0, d) + '○○○'.slice(0, 3 - d) + ' ';
    if (d <= 1) return dots + tr('Easy', 'Fácil');
    if (d === 2) return dots + tr('A bit more', 'Un poco más');
    return dots + tr('Tricky', 'Más difícil');
  };

  /* ================================================================
     DOM builders — created lazily on init, appended to document.body
     ================================================================ */
  function mk(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function buildHud() {
    const hud = document.createElement('div');
    hud.id = 'rgHud';
    D.title = mk('div', 'rgTitle', '');
    D.score = mk('div', 'rgScore', '0');
    D.combo = mk('div', 'rgCombo', '');
    D.combo.style.visibility = 'hidden';
    D.judge = mk('div', 'rgJudge', '');
    D.judge.setAttribute('aria-live', 'polite');
    const bar = mk('div', 'rgBar');
    D.fill = mk('div', 'rgFill');
    bar.appendChild(D.fill);
    const stars = mk('div', 'rgStars');
    D.stars = [];
    for (let i = 0; i < 3; i++) {
      const s = mk('span', 'rgStar', '★');
      s.setAttribute('aria-hidden', 'true');
      stars.appendChild(s);
      D.stars.push(s);
    }
    hud.appendChild(D.title);
    hud.appendChild(D.score);
    hud.appendChild(D.combo);
    hud.appendChild(D.judge);
    hud.appendChild(bar);
    hud.appendChild(stars);
    document.body.appendChild(hud);
    D.hud = hud;
  }

  function buildPicker() {
    const pick = document.createElement('div');
    pick.id = 'rgPick';
    const sheet = mk('div', 'rgSheet');
    const head = mk('div', 'rgPickHead');
    head.appendChild(mk('h2', null, tr('Play a song 🎶', 'Toca una canción 🎶')));
    head.appendChild(mk('p', null, tr(
      'Tap the animal when its glowing note lands. If one slips by, the meadow plays it for you — nothing is ever wrong.',
      'Toca al animal cuando llegue su nota brillante. Si se te escapa una, el prado la toca por ti — nada está mal.')));
    D.total = mk('div', 'rgTotal', '★ 0 / 0');
    D.grid = mk('div', 'rgGrid');
    D.close = mk('button', 'rgClose', tr('Back to free play', 'Volver al juego libre'));
    D.close.type = 'button';
    sheet.appendChild(head);
    sheet.appendChild(D.total);
    sheet.appendChild(D.grid);
    sheet.appendChild(D.close);
    pick.appendChild(sheet);
    document.body.appendChild(pick);
    D.pick = pick;

    D.grid.addEventListener('click', (e) => {
      const card = e.target && e.target.closest ? e.target.closest('.rgCard') : null;
      if (!card || !card.dataset || !card.dataset.id) return;
      sfxTap();
      start(card.dataset.id);
    });
    D.close.addEventListener('click', () => { sfxTap(); closePicker(true); });
    pick.addEventListener('click', (e) => { if (e.target === pick) closePicker(true); });
  }

  function buildResult() {
    const res = document.createElement('div');
    res.id = 'rgResult';
    const card = mk('div', 'rgResCard');
    const rs = mk('div', 'rgResStars');
    D.resStars = [];
    for (let i = 0; i < 3; i++) {
      const s = mk('span', 'rgResStar', '★');
      s.setAttribute('aria-hidden', 'true');
      rs.appendChild(s);
      D.resStars.push(s);
    }
    D.resTitle = mk('div', 'rgResTitle', '');
    D.resScore = mk('div', 'rgResScore', '');
    D.resLine = mk('div', 'rgResLine', '');
    const btns = mk('div', 'rgResBtns');
    D.btnAgain = mk('button', 'rgBtn primary', tr('Play again', 'Otra vez'));
    D.btnPick = mk('button', 'rgBtn', tr('Pick a song', 'Elegir canción'));
    D.btnFree = mk('button', 'rgBtn', tr('Free play', 'Juego libre'));
    [D.btnAgain, D.btnPick, D.btnFree].forEach((b) => { b.type = 'button'; btns.appendChild(b); });
    card.appendChild(rs);
    card.appendChild(D.resTitle);
    card.appendChild(D.resScore);
    card.appendChild(D.resLine);
    card.appendChild(btns);
    res.appendChild(card);
    document.body.appendChild(res);
    D.res = res;

    D.btnAgain.addEventListener('click', () => {
      sfxTap();
      const id = S.lastId;
      closeResult();
      if (id) start(id); else openPicker();
    });
    D.btnPick.addEventListener('click', () => { sfxTap(); closeResult(); openPicker(); });
    D.btnFree.addEventListener('click', () => { sfxTap(); closeResult(); stop(); });
  }

  function buildDom() {
    if (S.built) return;
    buildHud();
    buildPicker();
    buildResult();
    document.addEventListener('keydown', (e) => {
      if (!e || e.key !== 'Escape') return;
      if (S.pickerOpen) { e.preventDefault(); closePicker(true); }
      else if (S.resultOpen) { e.preventDefault(); closeResult(); stop(); }
      else if (S.playing) { e.preventDefault(); stop(); }
    });
    S.built = true;
  }

  /* ================================================================
     3D: target rings on each pad + a pool of glowing note orbs
     ================================================================ */
  let orbTex = null;
  function orbTexture() {
    if (orbTex) return orbTex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 3, 64, 64, 62);
    gr.addColorStop(0.00, 'rgba(255,255,255,1)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.75)');
    gr.addColorStop(1.00, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    orbTex = new THREE.CanvasTexture(c);
    return orbTex;
  }

  function newOrb() {
    const m = new THREE.SpriteMaterial({
      map: orbTexture(), transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0, fog: false,
    });
    const s = new THREE.Sprite(m);
    s.scale.set(ORB, ORB, 1);
    s.visible = false;
    scene.add(s);
    return s;
  }
  function takeOrb(hex) {
    let s = S.pool.pop();
    if (!s) { try { s = newOrb(); } catch (e) { return null; } }
    try {
      s.material.color.set(hex);
      s.material.opacity = 0;
      s.scale.set(ORB, ORB, 1);
      s.visible = true;
    } catch (e) {}
    return s;
  }
  function giveOrb(s) {
    if (!s) return;
    try { s.visible = false; s.material.opacity = 0; } catch (e) {}
    if (S.pool.length < 48) S.pool.push(s);
  }

  function buildRings() {
    for (let i = 0; i < 4; i++) {
      const an = A[i];
      if (!an || !an.g) continue;
      const geo = new THREE.RingGeometry(0.78, 1.02, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors[i] || FALLBACK_COLORS[i]),
        transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide, fog: false,
      });
      const r = new THREE.Mesh(geo, mat);
      r.rotation.x = -Math.PI / 2;
      const padY = (an.pad && an.pad.position ? an.pad.position.y : 0.09) + 0.12;
      r.position.set(an.g.position.x, padY, an.g.position.z);
      r.visible = false;
      scene.add(r);
      S.rings.push(r);
    }
  }

  /* ================================================================
     public: init
     ================================================================ */
  function init(h) {
    host = h || {};
    K = host.K || window.ABEKit || K || {};
    THREE = host.THREE || window.THREE;
    scene = host.scene;
    A = host.animals;
    if (Array.isArray(host.colors) && host.colors.length >= 4) colors = host.colors;
    S.ok3d = !!(THREE && scene && Array.isArray(A) && A.length >= 4 && A[0] && A[0].g);
    buildDom();
    if (S.ok3d && !S.rings.length) {              // idempotent: a second init must not double up
      try { buildRings(); } catch (e) {}
      if (S.rings.length < 4) S.ok3d = false;
      try { for (let i = 0; i < 14; i++) S.pool.push(newOrb()); } catch (e) {}
    }
    S.ready = true;
    return true;
  }

  /* ================================================================
     public: the song picker
     ================================================================ */
  function fillPicker() {
    const songs = songList();
    D.grid.textContent = '';
    if (!songs.length) {
      const p = mk('p', 'rgCardTitle', tr('Songs are coming soon! 🎵', '¡Pronto habrá canciones! 🎵'));
      D.grid.appendChild(p);
      D.total.textContent = '★ 0 / 0';
      return;
    }
    let got = 0;
    songs.forEach((s) => {
      const best = loadBest(s.id);
      const bs = best ? clamp(Math.round(best.stars || 0), 0, 3) : 0;
      got += bs;
      const diff = clamp(Math.round(s.diff || 1), 1, 3);
      const card = mk('button', 'rgCard');
      card.type = 'button';
      card.dataset.id = s.id;
      card.dataset.diff = String(diff);
      card.appendChild(mk('span', 'rgCardEmoji', s.emoji || '🎵'));
      card.appendChild(mk('span', 'rgCardTitle', songTitle(s)));
      card.appendChild(mk('span', 'rgCardDiff', diffLabel(diff)));
      card.appendChild(mk('span', 'rgCardBest', best ? starStr(bs) : '☆☆☆'));
      card.setAttribute('aria-label', songTitle(s) + ' — ' + diffLabel(diff) + ' — ' +
        (best ? tr('best', 'mejor') + ' ' + bs + '/3' : tr('not played yet', 'aún sin tocar')));
      D.grid.appendChild(card);
    });
    D.total.textContent = '★ ' + got + ' / ' + (songs.length * 3);
  }

  function openPicker() {
    if (!S.ready) return;
    if (K.replaying) return;
    clearSong();
    if (D.hud) D.hud.classList.remove('show');
    closeResult();
    fillPicker();
    D.pick.classList.add('show');
    S.pickerOpen = true;
  }

  function closePicker(backToFree) {
    if (!D.pick) return;
    D.pick.classList.remove('show');
    if (S.pickerOpen && backToFree) {
      toast(tr('🎶 Free play — tap the animals!', '🎶 Juego libre — ¡toca a los animales!'), 2200);
    }
    S.pickerOpen = false;
  }

  function closeResult() {
    if (!D.res) return;
    D.res.classList.remove('show');
    S.resultOpen = false;
  }

  /* ================================================================
     public: start a song
     ================================================================ */
  const HELLOS = [
    () => tr('Here we go! Tap when the light lands.', '¡Vamos allá! Toca cuando llegue la lucecita.'),
    () => tr('The band is ready — play with us!', '¡La banda está lista — toca con nosotros!'),
    () => tr("Let's make this song together!", '¡Hagamos esta canción juntos!'),
  ];

  function start(id) {
    if (!S.ready) return;
    if (K.replaying) return;
    const songs = songList();
    let idx = -1;
    for (let i = 0; i < songs.length; i++) if (songs[i].id === id) { idx = i; break; }
    if (idx < 0) { openPicker(); return; }
    const song = songs[idx];

    if (!S.ok3d) {                       // meadow could not build note orbs — stay friendly
      toast(tr('🎵 Free play is ready — tap the animals!', '🎵 El juego libre está listo — ¡toca a los animales!'), 2600);
      return;
    }

    clearSong();
    closePicker(false);
    closeResult();

    const raw = Array.isArray(song.notes) ? song.notes : [];
    const notes = [];
    for (const n of raw) {
      if (!n) continue;
      const t = Number(n.t), a = Math.round(Number(n.a));
      if (!isFinite(t) || t < 0) continue;
      if (!isFinite(a) || a < 0 || a > 3 || !A[a] || !A[a].g) continue;
      notes.push({ t: t, a: a, state: 0, orb: null });
    }
    notes.sort((x, y) => x.t - y.t);
    if (!notes.length) { openPicker(); return; }

    const cm = calm() ? 1.35 : 1;
    S.approach = APPROACH * cm;
    const wm = calm() ? 1.6 : 1;
    S.wPerfect = W_PERFECT * wm;
    S.wGood = W_GOOD * wm;

    S.song = song; S.songIdx = idx; S.lastId = song.id;
    S.notes = notes;
    S.lanes = [[], [], [], []];
    S.lanePtr = [0, 0, 0, 0];
    for (const n of notes) S.lanes[n.a].push(n);
    S.total = notes.length;
    S.dur = notes[notes.length - 1].t;
    S.clock = -(S.approach + LEAD);
    S.score = 0; S.combo = 0; S.bestCombo = 0;
    S.hits = 0; S.perfects = 0; S.resolved = 0;
    S.ended = false; S.endT = 0;
    S.shownScore = -1; S.shownCombo = -1; S.shownStars = -1;
    S.ringFlash = [0, 0, 0, 0];
    S.playing = true;

    D.title.textContent = (song.emoji ? song.emoji + ' ' : '') + songTitle(song);
    D.judge.textContent = '';
    D.judge.classList.remove('show');
    D.combo.textContent = '';
    D.combo.style.visibility = 'hidden';
    D.combo.classList.remove('pulse');
    D.fill.style.width = '0%';
    for (const s of D.stars) s.classList.remove('on');
    D.hud.classList.add('show');
    updateHud();

    for (const r of S.rings) { r.visible = true; r.scale.setScalar(0.55); r.material.opacity = 0; }
    say(HELLOS[Math.floor(Math.random() * HELLOS.length)]());
  }

  /* ================================================================
     public: stop / clean up
     ================================================================ */
  function clearSong() {
    S.playing = false;
    S.ended = false;
    S.endT = 0;
    for (const o of S.live) giveOrb(o.s);
    S.live.length = 0;
    for (const n of S.notes) n.orb = null;
    S.notes = [];
    S.lanes = [[], [], [], []];
    S.lanePtr = [0, 0, 0, 0];
    for (const r of S.rings) { try { r.visible = false; r.material.opacity = 0; } catch (e) {} }
    if (D.judge) { D.judge.classList.remove('show'); D.judge.textContent = ''; }
    if (D.combo) { D.combo.classList.remove('pulse'); D.combo.style.visibility = 'hidden'; }
  }

  function stop() {
    if (!S.ready) return;
    const wasActive = S.playing || S.pickerOpen || S.resultOpen;
    clearSong();
    closePicker(false);
    closeResult();
    if (D.hud) D.hud.classList.remove('show');
    S.song = null;
    S.songIdx = -1;
    if (wasActive) toast(tr('🎶 Free play — tap the animals!', '🎶 Juego libre — ¡toca a los animales!'), 2200);
  }

  /* ================================================================
     judging
     ================================================================ */
  function flashJudge(text, kind) {
    if (!D.judge) return;
    D.judge.textContent = text;
    D.judge.classList.remove('perfect', 'good', 'music');
    if (kind) D.judge.classList.add(kind);
    D.judge.classList.remove('show');
    void D.judge.offsetWidth;              // retrigger the CSS animation
    D.judge.classList.add('show');
    S.judgeT = 0.8;
  }
  function pulseCombo() {
    if (!D.combo) return;
    D.combo.classList.remove('pulse');
    void D.combo.offsetWidth;
    D.combo.classList.add('pulse');
    S.comboT = 0.4;
  }
  function orbOf(note) {
    for (let i = 0; i < S.live.length; i++) if (S.live[i].n === note) return S.live[i];
    return null;
  }
  function pointNilu(i) {
    if (S.time - S.lastPoint < 0.3) return;
    S.lastPoint = S.time;
    hostCall('niluPoint', i);
  }

  function resolve(note, kind) {
    if (!note || note.state === 2) return;
    note.state = 2;
    S.resolved++;
    const o = orbOf(note);
    if (o) { o.y0 = o.s ? o.s.position.y : LAND_Y; o.k = 0; }
    S.ringFlash[note.a] = 1;

    if (kind === 'miss') {
      // the meadow plays it for you — softly, kindly, and the combo just rests
      S.combo = 0;
      hostCall('playNote', note.a, 0.07);
      hostCall('tapVisual', note.a);
      if (o) o.state = 'fade';
      return;
    }
    const perfect = kind === 'perfect';
    S.hits++;
    if (perfect) S.perfects++;
    S.combo++;
    if (S.combo > S.bestCombo) S.bestCombo = S.combo;
    const mult = 1 + Math.min(1, Math.floor(S.combo / 8) * 0.25);   // caps at ×2
    S.score += Math.round((perfect ? 100 : 60) * mult);
    hostCall('playNote', note.a, perfect ? 0.24 : 0.2);
    hostCall('tapVisual', note.a);
    hostCall('plantFlower', note.a);
    flashJudge(perfect ? tr('Perfect!', '¡Perfecto!') : tr('Nice!', '¡Muy bien!'), perfect ? 'perfect' : 'good');
    pulseCombo();
    if (o) o.state = 'spark';
  }

  function onTap(i) {
    if (!S.ready || !S.playing || K.paused || K.replaying) return false;
    const lane = Math.round(Number(i));
    if (!isFinite(lane) || lane < 0 || lane > 3) return false;
    let target = null;
    for (const n of S.notes) {                 // sorted: first live note still in reach
      if (n.state !== 1 || n.a !== lane) continue;
      const d = S.clock - n.t;
      if (d > S.wGood) continue;               // already sliding out — tick will play it
      if (d < -S.wGood) break;                 // everything after is even further away
      target = n;
      break;
    }
    if (!target) {                             // a tap with no note is music too, never a mistake
      flashJudge(tr('Music!', '¡Música!'), 'music');
      return false;
    }
    resolve(target, Math.abs(S.clock - target.t) <= S.wPerfect ? 'perfect' : 'good');
    updateHud();
    return true;
  }

  /* ================================================================
     per-frame
     ================================================================ */
  function spawnDue() {
    for (const n of S.notes) {
      if (n.state !== 0) continue;
      if (n.t - S.clock > S.approach) break;   // sorted — the rest are later
      n.state = 1;
      const an = A[n.a];
      const s = takeOrb(colors[n.a] || FALLBACK_COLORS[n.a]);
      if (s) {
        s.position.set(an.g.position.x, TOP_Y, an.g.position.z);
        n.orb = s;
        S.live.push({ n: n, s: s, state: 'fall', k: 0, y0: TOP_Y });
      }
      pointNilu(n.a);
    }
  }

  function autoResolve() {
    for (const n of S.notes) {
      if (n.state !== 1) continue;
      if (S.clock - n.t <= S.wGood) break;     // sorted — nothing later is overdue
      resolve(n, 'miss');
    }
  }

  function animateOrbs(dt) {
    const rm = reduceMotion();
    for (let i = S.live.length - 1; i >= 0; i--) {
      const o = S.live[i];
      const s = o.s;
      if (!s) { S.live.splice(i, 1); continue; }
      if (o.state === 'fall') {
        const p = clamp(1 - (o.n.t - S.clock) / (S.approach || 1), 0, 1);
        const e = p * p * 0.35 + p * 0.65;                 // a slight ease into the pad
        s.position.y = TOP_Y + (LAND_Y - TOP_Y) * e;
        s.material.opacity = clamp(p / 0.12, 0, 1) * 0.95; // fade in near the top
        const b = rm ? 1 : 1 + Math.sin(S.time * 6 + o.n.t) * 0.05;
        s.scale.set(ORB * b, ORB * b, 1);
      } else if (o.state === 'spark') {
        o.k += dt / 0.26;
        const k = Math.min(1, o.k);
        const sc = ORB * (1 + k * (rm ? 0.6 : 1.6));
        s.scale.set(sc, sc, 1);
        s.material.opacity = (1 - k) * 0.95;
        s.position.y = o.y0 + k * 0.7;
        if (k >= 1) { giveOrb(s); o.n.orb = null; S.live.splice(i, 1); }
      } else {                                             // 'fade' — the meadow played it for you
        o.k += dt / 0.42;
        const k = Math.min(1, o.k);
        const sc = ORB * (1 - k * 0.55);
        s.scale.set(sc, sc, 1);
        s.material.opacity = (1 - k) * 0.5;
        s.position.y = o.y0 - k * 0.45;
        if (k >= 1) { giveOrb(s); o.n.orb = null; S.live.splice(i, 1); }
      }
    }
  }

  function animateRings(dt) {
    const rm = reduceMotion();
    for (let i = 0; i < S.rings.length; i++) {
      const r = S.rings[i];
      if (!r) continue;
      if (!S.playing) { r.visible = false; continue; }
      r.visible = true;
      const arr = S.lanes[i] || [];
      let p = S.lanePtr[i];
      while (p < arr.length && arr[p].state === 2) p++;
      S.lanePtr[i] = p;
      const nx = arr[p];
      let k = 0;
      if (nx) {
        const rem = nx.t - S.clock;
        k = rem > S.approach ? 0 : clamp(1 - rem / (S.approach || 1), 0, 1);
      }
      if (S.ringFlash[i] > 0) S.ringFlash[i] = Math.max(0, S.ringFlash[i] - dt * 3);
      const f = S.ringFlash[i];
      const idle = rm ? 0 : Math.sin(S.time * 2 + i) * 0.03;
      r.scale.setScalar(0.55 + 0.6 * k + idle + f * 0.35);   // grows as the beat arrives
      r.material.opacity = clamp(0.10 + 0.34 * k + f * 0.35, 0, 0.8);
    }
  }

  function starCount(rate) {
    return rate >= 0.90 ? 3 : rate >= 0.70 ? 2 : rate >= 0.40 ? 1 : 0;
  }

  function updateHud() {
    if (!D.hud) return;
    if (S.score !== S.shownScore) { D.score.textContent = String(S.score); S.shownScore = S.score; }
    const showCombo = S.combo >= 2;
    if (S.combo !== S.shownCombo) {
      D.combo.textContent = showCombo ? '×' + S.combo : '';
      D.combo.style.visibility = showCombo ? 'visible' : 'hidden';
      S.shownCombo = S.combo;
    }
    const span = S.dur + TAIL + S.approach + LEAD;
    const p = clamp((S.clock + S.approach + LEAD) / (span > 0 ? span : 1), 0, 1);
    D.fill.style.width = (p * 100).toFixed(1) + '%';
    const st = starCount(S.total ? S.hits / S.total : 0);
    if (st !== S.shownStars) {
      for (let i = 0; i < D.stars.length; i++) D.stars[i].classList.toggle('on', i < st);
      S.shownStars = st;
    }
  }

  function tick(dt) {
    if (!S.ready) return;
    dt = (typeof dt === 'number' && isFinite(dt)) ? clamp(dt, 0, 0.1) : 0;
    S.time += dt;
    if (S.judgeT > 0) { S.judgeT -= dt; if (S.judgeT <= 0 && D.judge) D.judge.classList.remove('show'); }
    if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0 && D.combo) D.combo.classList.remove('pulse'); }
    if (K.replaying && (S.playing || S.pickerOpen || S.resultOpen)) { stop(); return; }
    if (K.paused) return;                       // the song clock waits with the child

    if (S.playing) {
      S.clock += dt;
      spawnDue();
      autoResolve();
      updateHud();
      if (S.resolved >= S.total) {
        S.ended = true;
        S.endT += dt;
        if (S.endT >= TAIL) { finish(); }
      } else if (S.clock > S.dur + S.approach + 5) {
        finish();                               // belt and braces: never strand a child mid-song
      }
    }
    animateOrbs(dt);
    animateRings(dt);
  }

  /* ================================================================
     results — always warm, always positive
     ================================================================ */
  const LINES = [
    () => tr('You made music with the band! 🎵', '¡Hiciste música con la banda! 🎵'),
    () => tr('You played with the band! 🎵', '¡Tocaste con la banda! 🎵'),
    () => tr('Beautiful playing! 🌸', '¡Qué bonito tocaste! 🌸'),
    () => tr('Perfect little concert! 🌟', '¡Un conciertito perfecto! 🌟'),
  ];

  function finish() {
    if (!S.playing) return;
    S.playing = false;
    const song = S.song;
    const total = S.total || 1;
    const rate = S.hits / total;
    const stars = starCount(rate);

    // tidy the sky: anything still falling drifts away softly
    for (const n of S.notes) if (n.state === 1) { n.state = 2; const o = orbOf(n); if (o) { o.y0 = o.s.position.y; o.k = 0; o.state = 'fade'; } }
    for (const r of S.rings) { try { r.visible = false; } catch (e) {} }

    let improved = false;
    if (song && song.id) {
      const prev = loadBest(song.id);
      const ps = prev ? clamp(Math.round(prev.stars || 0), 0, 3) : -1;
      const psc = prev ? (Number(prev.score) || 0) : -1;
      improved = stars > ps || (stars === ps && S.score > psc);
      if (improved) { try { K.save && K.save(bestKey(song.id), { stars: stars, score: S.score }); } catch (e) {} }
    }

    if (D.res) {
      for (let i = 0; i < D.resStars.length; i++) D.resStars[i].classList.toggle('on', i < stars);
      D.resTitle.textContent = (song && song.emoji ? song.emoji + ' ' : '') + songTitle(song);
      D.resScore.textContent = '🎵 ' + S.score + '  ·  🌸 ' + S.hits + '/' + total;
      let line = LINES[stars]();
      if (improved) line += '  ' + tr('New best! 🏅', '¡Tu mejor marca! 🏅');
      D.resLine.textContent = line;
      D.res.classList.add('show');
      S.resultOpen = true;
      say(line);
    }
    updateHud();
    sfxStar();
    if (improved || stars >= 3) { try { K.streakBump && K.streakBump(); } catch (e) {} }
    try { K.recordEvent && K.recordEvent('song', S.songIdx); } catch (e) {}
  }

  /* ================================================================
     export — every entry point guarded so the meadow never white-screens
     ================================================================ */
  const guard = (fn) => function () {
    try { return fn.apply(null, arguments); }
    catch (e) { try { console.warn('[RGame]', e); } catch (_) {} return false; }
  };

  window.RGame = {
    init: guard(init),
    openPicker: guard(openPicker),
    start: guard(start),
    stop: guard(stop),
    tick: guard(tick),
    onTap: guard(onTap),
    get active() { try { return !!(S.playing || S.pickerOpen || S.resultOpen); } catch (e) { return false; } },
  };
})();
