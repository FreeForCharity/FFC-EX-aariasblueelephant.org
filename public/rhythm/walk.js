/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Nilu's Music Meadow — WALK MODE (window.RWalk).

   The meadow used to be a picture you tapped. This layer lets the child WALK
   into it: a little kid in a music cap, a 3rd-person camera you can swing
   around with your finger, tap-the-grass-to-go-there, and music you can play
   with your feet by standing on a musician's stage pad.

   Owns: the player avatar, ALL input (joystick / keys / tap / drag / pinch /
   wheel / ➕➖), the camera rig, the proximity-spot system world.js registers
   its discoveries on, and the discovery bookkeeping (the 🔎 chip and the
   "you found something!" card).

   Loaded as a plain browser script after lib/three.min.js and ../gamekit/kit.js.
   Styles live in walk.css; this file only creates the DOM.

   Nothing in here may ever white-screen the meadow: every kit call, every
   world.js callback and every input handler is wrapped.
   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  /* ============================================================ kit helpers
     Every one of these is safe to call before (or without) ABEKit. */
  let K = window.ABEKit || {};
  const tr = (en, es) => { try { return K.tr ? K.tr(en, es) : en; } catch (e) { return en; } };
  const toast = (m, ms) => { try { K.toast && K.toast(m, ms); } catch (e) {} };
  const say = (m) => { try { K.say && K.say(m); } catch (e) {} };
  const sfx = (n) => { try { K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} };
  const save = (k, v) => { try { K.save && K.save(k, v); } catch (e) {} };
  const load = (k, d) => { try { return K.load ? K.load(k, d) : d; } catch (e) { return d; } };
  const calm = () => { try { return !!(K.calm && K.calm()); } catch (e) { return false; } };
  const replaying = () => { try { return !!K.replaying; } catch (e) { return false; } };
  const isPaused = () => { try { return !!K.paused; } catch (e) { return false; } };
  const lessMotion = () => { try { return !!K.reduceMotion; } catch (e) { return false; } };
  /* kit speed is a DURATION multiplier (relaxed 1.5 · normal 1 · fast 0.6),
     so walking speed divides by it. */
  const speedMul = () => {
    let s = 1;
    try { s = Number(K.speed ? K.speed() : 1); } catch (e) {}
    return (s >= 0.4 && s <= 3) ? s : 1;
  };

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerpK = (dt, rate) => 1 - Math.exp(-rate * Math.max(0, Math.min(0.1, dt)));

  /* ============================================================== constants */
  const WALK_SPEED = 4.2;            // units / second at normal speed
  const BOUND = 34;                  // soft world radius — eased, never a wall
  const BAND = { x: 0, z: -1.0 };    // middle of the four musicians
  const HOME = { x: -3.4, z: 1.2 };  // the "come back to Nilu" landing spot
  const HOME_DIST = 16;              // show the ⬅️ Nilu chip past this
  const POND = { x: 0, z: 3.2, r: 3.4 };
  const PAD_IN = 1.45, PAD_OUT = 1.9;  // stage-pad enter / leave (hysteresis)
  const CAM_R_MIN = 6, CAM_R_MAX = 26, CAM_PHI_MIN = 0.35, CAM_PHI_MAX = 1.25;
  const BAND_VIEW = { theta: 0, phi: 0.98, radius: 12.5, x: 0, y: 1.4, z: -0.9 };
  const TAP_PX = 8, TAP_MS = 300;    // under both = a tap, not a camera drag

  /* ================================================================== state */
  let THREE = null, scene = null, camera = null, renderer = null, canvas = null, host = null;
  let ready = false, started = false, mode = 'follow';
  let kid = null, lean = null, legL = null, legR = null, armL = null, armR = null;
  let headG = null, shadowMesh = null, ring = null;

  const P = { x: 0, z: 7.4, ry: Math.PI };   // starts south of the pond, facing the band
  let walkPhase = 0, moveAmt = 0, clock = 0, ringT = 0;

  /* phi ~1.05 keeps the twilight sky in the top of the frame — the whole
     reason this meadow is pretty — instead of staring down at the grass */
  const orbit = { theta: 0, phi: 1.15, radius: 13.5 }; // what the child has set
  const view = { theta: 0, phi: 1.15, radius: 13.5 };  // what the camera is using
  let camTarget = null;                                // THREE.Vector3, lerped

  const tweens = [];
  const spots = [];
  const padIn = [false, false, false, false];
  let foundSet = null, total = 12;

  /* DOM (created by buildUI, styled by walk.css) */
  let elZoom = null, elFind = null, elHome = null, elCard = null, elHint = null;
  let cardEmoji = null, cardTitle = null, cardText = null, cardBtn = null;
  let cardTimer = 0, hintTimer = 0, uiT = 0, homeShown = false;

  /* ============================================================== little UI */
  function mk(tag, id, cls, txt) {
    const n = document.createElement(tag);
    if (id) n.id = id;
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  /* Safety net only: index.html hides the joystick with
       #kStick { display: none !important; }
     walk.css undoes that (and the integrator deletes the old rule). This extra
     rule is higher-specificity than a bare #kStick, so the stick comes back
     even if walk.css is missing — while STILL letting the kit hide the stick
     during My Movie (the kit sets an inline display:none). */
  function injectStickFallback() {
    try {
      if (document.getElementById('rwStickFix')) return;
      const s = document.createElement('style');
      s.id = 'rwStickFix';
      s.textContent = '#kStick[style*="block"]{display:block !important;}';
      document.head.appendChild(s);
    } catch (e) {}
  }

  function buildUI() {
    if (!document.body || document.getElementById('rwZoom')) return;

    /* ➕ / ➖ — same ids and feel as Magnet Blocks, so every game zooms alike */
    elZoom = mk('div', 'rwZoom');
    const zi = mk('button', 'zoomInBtn', null, '➕');
    const zo = mk('button', 'zoomOutBtn', null, '➖');
    zi.title = tr('Zoom in — get closer', 'Acercar — verlo de cerca');
    zo.title = tr('Zoom out — see more meadow', 'Alejar — ver más prado');
    zi.setAttribute('aria-label', zi.title);
    zo.setAttribute('aria-label', zo.title);
    zi.addEventListener('click', () => nudgeZoom(-3.2));
    zo.addEventListener('click', () => nudgeZoom(3.2));
    elZoom.appendChild(zi); elZoom.appendChild(zo);
    document.body.appendChild(elZoom);

    /* 🔎 discovery chip */
    elFind = mk('div', 'rwFind', null, '🔎 0 / ' + total);
    elFind.title = tr('Wonders you have found in the meadow', 'Maravillas que encontraste en el prado');
    document.body.appendChild(elFind);

    /* ⬅️ Nilu — only when the child has wandered far */
    elHome = mk('button', 'rwHome', null, '⬅️ Nilu');
    elHome.title = tr('Walk back to Nilu and the band', 'Vuelve con Nilu y la banda');
    elHome.setAttribute('aria-label', elHome.title);
    elHome.style.display = 'none';
    elHome.addEventListener('click', goHome);
    document.body.appendChild(elHome);

    /* "you found something!" card */
    elCard = mk('div', 'rwCard');
    cardEmoji = mk('div', null, 'rwCardEmoji', '✨');
    cardTitle = mk('div', null, 'rwCardTitle', '');
    cardText = mk('div', null, 'rwCardText', '');
    cardBtn = mk('button', null, 'rwCardBtn', tr('💙 Yay!', '💙 ¡Genial!'));
    cardBtn.addEventListener('click', () => { sfx('tap'); hideCard(); });
    elCard.appendChild(cardEmoji); elCard.appendChild(cardTitle);
    elCard.appendChild(cardText); elCard.appendChild(cardBtn);
    document.body.appendChild(elCard);

    /* transient bottom hint line */
    elHint = mk('div', 'rwHint', 'rwHint', '');
    elHint.style.display = 'none';
    document.body.appendChild(elHint);
  }

  function showChrome(on) {
    if (elZoom) elZoom.style.display = on ? '' : 'none';
    if (elFind) elFind.style.display = on ? '' : 'none';
    if (!on && elHome) { elHome.style.display = 'none'; homeShown = false; }
  }

  function hint(text, ms) {
    if (!elHint || !text) return;
    elHint.textContent = text;
    elHint.style.display = '';
    elHint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      if (!elHint) return;
      elHint.classList.remove('show');
      elHint.textContent = '';
      elHint.style.display = 'none';
    }, (ms || 4200) * speedMul());
  }

  function hideCard() {
    if (!elCard) return;
    elCard.classList.remove('show');
    clearTimeout(cardTimer);
  }

  function showCard(emoji, title, text) {
    if (!elCard) return;
    cardEmoji.textContent = emoji || '✨';
    cardTitle.textContent = title || tr('Something new!', '¡Algo nuevo!');
    cardText.textContent = text || tr('A new little wonder in the meadow — keep exploring!',
                                      'Una nueva maravilla del prado — ¡sigue explorando!');
    cardBtn.textContent = tr('💙 Yay!', '💙 ¡Genial!');
    elCard.classList.add('show');
    clearTimeout(cardTimer);
    cardTimer = setTimeout(hideCard, 5600 * speedMul());
  }

  function refreshFind() {
    if (!elFind || !foundSet) return;
    if (foundSet.size > total) total = foundSet.size;
    elFind.textContent = '🔎 ' + foundSet.size + ' / ' + total;
  }

  /* ============================================ discovery bookkeeping (API)
     world.js calls RWalk.found('bridge', 'The little bridge').
     An optional third argument can dress the card:
       { emoji:'🌉', text:'…', silent:true, quiet:true } */
  function found(id, label, opts) {
    try {
      if (!id) return false;
      if (!foundSet) foundSet = new Set(loadFound());
      if (foundSet.has(id)) return false;
      foundSet.add(id);
      save('walk.found', Array.from(foundSet));
      refreshFind();
      opts = opts || {};
      const name = label || tr('A new wonder', 'Una maravilla nueva');
      if (!opts.silent) sfx('pop');
      if (!opts.quiet) {
        toast('🔎 ' + name, 2600);
        showCard(opts.emoji, name, opts.text ||
          tr('Wonder ' + foundSet.size + ' of ' + total + ' — the meadow has more to find!',
             'Maravilla ' + foundSet.size + ' de ' + total + ' — ¡el prado tiene más para encontrar!'));
      }
      if (foundSet.size >= total) celebrateAll();
      return true;
    } catch (e) { return false; }
  }

  function loadFound() {
    const a = load('walk.found', []);
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : [];
  }

  function celebrateAll() {
    try {
      if (load('walk.allDone', 0)) return;
      save('walk.allDone', 1);
      try { K.streakBump && K.streakBump(); } catch (e) {}
      sfx('star');
      toast(tr('🌟 You found EVERYTHING in the meadow!', '🌟 ¡Encontraste TODO en el prado!'), 4600);
      setTimeout(() => say(tr('You explored the whole meadow! Nilu is so proud of you!',
                              '¡Exploraste todo el prado! ¡Nilu está muy orgullosa de ti!')), 900);
    } catch (e) {}
  }

  /* ====================================================== proximity spots
     world.js registers { id, x, z, r, once, onEnter, onExit } here. Enter and
     exit radii differ so standing on the edge never flickers. */
  function addSpot(s) {
    try {
      if (!s || !s.id) return null;
      removeSpot(s.id);
      const sp = {
        id: s.id, x: +s.x || 0, z: +s.z || 0, r: Math.max(0.5, +s.r || 1.6),
        once: !!s.once, onEnter: s.onEnter, onExit: s.onExit, inside: false, done: false,
      };
      spots.push(sp);
      return sp;
    } catch (e) { return null; }
  }
  function removeSpot(id) {
    for (let i = spots.length - 1; i >= 0; i--) if (spots[i].id === id) spots.splice(i, 1);
  }
  function spotTick() {
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      if (s.done) continue;
      const d = Math.hypot(P.x - s.x, P.z - s.z);
      if (!s.inside && d <= s.r) {
        s.inside = true;
        if (s.once) s.done = true;
        if (s.onEnter) { try { s.onEnter(); } catch (e) {} }
      } else if (s.inside && d > s.r * 1.3 + 0.25) {
        s.inside = false;
        if (s.onExit) { try { s.onExit(); } catch (e) {} }
      }
    }
  }

  /* ============================================================== the child
     A kid in a music cap — Nilu is the elephant, this is her small friend. */
  function shadowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, 'rgba(24,26,48,0.55)');
    gr.addColorStop(1, 'rgba(24,26,48,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function buildKid() {
    const T = THREE;
    const lam = (c, e) => new T.MeshLambertMaterial({ color: c, emissive: e || 0x1a1a2a });
    const skin = lam(0xf3caa4, 0x4d3b2b);
    const shirt = lam(0x7ec8f7, 0x2c4a66);      // ABE blue
    const pants = lam(0x6a63b8, 0x252247);
    const shoes = lam(0xffd166, 0x5a4a12);
    const capC = lam(0xe05a5a, 0x5a1f1f);       // Nilu's little red cap colour
    const hairC = lam(0x4a3527, 0x1a120c);
    const gold = lam(0xffd43b, 0x6e5a12);
    const dark = new T.MeshBasicMaterial({ color: 0x2a2a3a });

    const outer = new T.Group();
    lean = new T.Group();                        // lean forward when walking
    outer.add(lean);

    /* legs — hip pivots so they swing */
    legL = new T.Group(); legR = new T.Group();
    [[-0.13, legL], [0.13, legR]].forEach(function (pair) {
      const pv = pair[1];
      pv.position.set(pair[0], 0.58, 0);
      const thigh = new T.Mesh(new T.CylinderGeometry(0.098, 0.088, 0.44, 8), pants);
      thigh.position.y = -0.22; pv.add(thigh);
      const shoe = new T.Mesh(new T.BoxGeometry(0.19, 0.11, 0.3), shoes);
      shoe.position.set(0, -0.475, 0.05); pv.add(shoe);
      lean.add(pv);
    });

    /* body */
    const torso = new T.Mesh(new T.CylinderGeometry(0.2, 0.23, 0.46, 12), shirt);
    torso.position.y = 0.81; lean.add(torso);
    const chest = new T.Mesh(new T.SphereGeometry(0.21, 14, 10), shirt);
    chest.scale.set(1, 0.8, 0.9); chest.position.y = 1.0; lean.add(chest);
    const collar = new T.Mesh(new T.CylinderGeometry(0.13, 0.15, 0.07, 10), lam(0xffd166, 0x5a4a12));
    collar.position.y = 1.09; lean.add(collar);

    /* arms — shoulder pivots, swinging opposite the legs */
    armL = new T.Group(); armR = new T.Group();
    [[-0.235, armL], [0.235, armR]].forEach(function (pair) {
      const pv = pair[1];
      pv.position.set(pair[0], 1.0, 0);
      const arm = new T.Mesh(new T.CylinderGeometry(0.062, 0.055, 0.4, 8), shirt);
      arm.position.y = -0.2; pv.add(arm);
      const hand = new T.Mesh(new T.SphereGeometry(0.072, 10, 8), skin);
      hand.position.y = -0.42; pv.add(hand);
      lean.add(pv);
    });

    /* head */
    headG = new T.Group();
    headG.position.set(0, 1.16, 0);
    lean.add(headG);
    const head = new T.Mesh(new T.SphereGeometry(0.235, 18, 14), skin);
    head.position.y = 0.12; headG.add(head);
    const hair = new T.Mesh(new T.SphereGeometry(0.243, 16, 12), hairC);
    hair.scale.set(1, 0.92, 1); hair.position.set(0, 0.135, -0.02); headG.add(hair);
    for (const s of [-1, 1]) {
      const w = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }));
      w.position.set(0.082 * s, 0.14, 0.196); headG.add(w);
      const p = new T.Mesh(new T.SphereGeometry(0.027, 8, 6), dark);
      p.position.set(0.082 * s, 0.142, 0.228); headG.add(p);
      const cheek = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), lam(0xf7a8b8, 0x6e4c56));
      cheek.scale.set(1, 0.7, 0.5); cheek.position.set(0.148 * s, 0.075, 0.176); headG.add(cheek);
    }
    const smile = new T.Mesh(new T.TorusGeometry(0.055, 0.013, 6, 12, Math.PI), dark);
    smile.position.set(0, 0.075, 0.212); smile.rotation.z = Math.PI; headG.add(smile);

    /* the music cap 🎵 */
    const crown = new T.Mesh(new T.SphereGeometry(0.248, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), capC);
    crown.position.y = 0.14; headG.add(crown);
    const brim = new T.Mesh(new T.CylinderGeometry(0.245, 0.245, 0.042, 14, 1, false, -Math.PI / 2, Math.PI), capC);
    brim.position.set(0, 0.145, 0.055); headG.add(brim);
    const badge = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.05, 10), gold);
    badge.rotation.x = Math.PI / 2; badge.position.set(0, 0.24, 0.215); headG.add(badge);
    const pom = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), gold);
    pom.position.y = 0.39; headG.add(pom);

    /* soft contact shadow */
    shadowMesh = new T.Mesh(
      new T.CircleGeometry(0.52, 20),
      new T.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.8, fog: false }));
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.035;
    scene.add(shadowMesh);

    return outer;
  }

  function buildRing() {
    ring = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.62, 26),
      new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.07;
    ring.visible = false;
    scene.add(ring);
  }

  /* ================================================================ camera */
  function nudgeZoom(d) {
    const from = view.radius;
    const to = clamp(from + d, CAM_R_MIN, CAM_R_MAX);
    orbit.radius = to;
    tween(0.32, (k) => {
      const e = 1 - Math.pow(1 - k, 3);
      view.radius = from + (to - from) * e;
      orbit.radius = view.radius;
    });
    sfx('tap');
  }
  function nudgeTurn(d) {
    const from = orbit.theta, to = from + d;
    tween(0.45, (k) => { orbit.theta = from + (to - from) * (1 - Math.pow(1 - k, 3)); });
    sfx('tap');
  }
  function tween(dur, fn) { tweens.push({ t: 0, d: Math.max(0.05, dur), fn: fn }); }
  function tweenTick(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.d);
      try { tw.fn(k); } catch (e) {}
      if (k >= 1) tweens.splice(i, 1);
    }
  }

  /* ---------------------------------------------------------------- camera
     collision. The meadow is ringed with trees and dotted with a treehouse,
     a cliff and a hollow log; without this the follow camera swims straight
     into a canopy and the child sees a wall of green leaves.
     One raycast from the child out along the camera boom, against a small
     cached list of tall solid things (not the sky shell, not sprites, not
     the ground), pulls the camera in front of whatever is in the way. */
  let blockers = null, blockT = 0, camPull = 0, blockAge = 9, boomCaster = null, boomDir = null;
  function collectBlockers() {
    const out = [];
    try {
      scene.traverse((o) => {
        if (!o.isMesh || !o.geometry || o.isSprite) return;
        const m = o.material;
        if (!m || m.side === THREE.BackSide || m.transparent) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const r = o.geometry.boundingSphere.radius;
        if (r < 0.7 || r > 40) return;                       // dust and the world shells
        o.updateWorldMatrix(true, false);
        if (o.matrixWorld.elements[13] < 1.6) return;        // world y: only tall things
        out.push(o);
      });
    } catch (e) {}
    return out;
  }
  function camBlocked(want, dt) {
    if (!THREE || !camTarget || !scene) return want;
    if (!boomCaster) { boomCaster = new THREE.Raycaster(); boomDir = new THREE.Vector3(); }
    /* world.js and places.js build after init, so refresh the list now and then */
    blockAge += dt;
    if (!blockers || blockAge > 4) { blockers = collectBlockers(); blockAge = 0; }
    if (!blockers.length) return want;
    const sp = Math.sin(view.phi), cp = Math.cos(view.phi);
    boomDir.set(sp * Math.sin(view.theta), cp, sp * Math.cos(view.theta));
    boomCaster.set(camTarget, boomDir);
    boomCaster.far = want + 0.6;
    let hit = 0;
    try {
      const hits = boomCaster.intersectObjects(blockers, false);
      if (hits.length) hit = hits[0].distance;
    } catch (e) {}
    return hit > 0.5 ? Math.max(5.5, hit - 0.9) : want;
  }

  function camTick(dt) {
    if (mode === 'free' || !camera || !camTarget) return;
    const rate = lessMotion() ? 14 : (calm() ? 5 : 7);
    const e = lerpK(dt, rate);

    let tx = P.x, ty = 1.15, tz = P.z;
    let wTheta = orbit.theta, wPhi = orbit.phi, wRadius = orbit.radius;
    if (mode === 'band') {                       // frame the four musicians
      tx = BAND_VIEW.x; ty = BAND_VIEW.y; tz = BAND_VIEW.z;
      wTheta = BAND_VIEW.theta; wPhi = BAND_VIEW.phi; wRadius = BAND_VIEW.radius;
    }
    camTarget.x += (tx - camTarget.x) * e;
    camTarget.y += (ty - camTarget.y) * e;
    camTarget.z += (tz - camTarget.z) * e;

    /* shortest way round for theta so the view never spins the long way */
    let dTheta = wTheta - view.theta;
    while (dTheta > Math.PI) dTheta -= Math.PI * 2;
    while (dTheta < -Math.PI) dTheta += Math.PI * 2;
    view.theta += dTheta * e;
    view.phi += (clamp(wPhi, CAM_PHI_MIN, CAM_PHI_MAX) - view.phi) * e;
    view.radius += (clamp(wRadius, CAM_R_MIN, CAM_R_MAX) - view.radius) * e;

    /* don't let a tree stand between the child and the camera (checked a few
       times a second — a per-frame raycast is more than this needs) */
    blockT -= dt;
    if (blockT <= 0) { camPull = camBlocked(view.radius, 0.12 + Math.max(0, -blockT)); blockT = 0.12; }
    const useR = Math.min(view.radius, camPull || view.radius);

    const sp = Math.sin(view.phi), cp = Math.cos(view.phi);
    camera.position.set(
      camTarget.x + useR * sp * Math.sin(view.theta),
      Math.max(1.1, camTarget.y + useR * cp),
      camTarget.z + useR * sp * Math.cos(view.theta));
    camera.lookAt(camTarget.x, camTarget.y, camTarget.z);
  }

  /* ================================================================= input */
  const pointers = new Map();
  let drag = null, pinch = 0, downT = 0, downId = -1, movedPx = 0;
  let caster = null, ndc = null, groundPlane = null, hitV = null;

  function inputBlocked() {
    return !ready || isPaused() || replaying() || !started;
  }

  function ndcFrom(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    ndc.y = -((ev.clientY - r.top) / Math.max(1, r.height)) * 2 + 1;
    return ndc;
  }

  function onDown(ev) {
    try {
      if (inputBlocked()) return;
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 2) {
        const it = pointers.values(), a = it.next().value, b = it.next().value;
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
        drag = null;
        return;
      }
      downId = ev.pointerId; downT = performance.now();
      downX = ev.clientX; downY = ev.clientY; movedPx = 0;
      drag = { x: ev.clientX, y: ev.clientY };
    } catch (e) {}
  }

  function onMove(ev) {
    try {
      if (!pointers.has(ev.pointerId)) return;
      const p = pointers.get(ev.pointerId);
      p.x = ev.clientX; p.y = ev.clientY;
      if (pointers.size === 2) {                        // pinch = zoom
        const it = pointers.values(), a = it.next().value, b = it.next().value;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        orbit.radius = clamp(orbit.radius * (pinch / Math.max(40, d)), CAM_R_MIN, CAM_R_MAX);
        view.radius = orbit.radius;
        pinch = d;
        return;
      }
      if (!drag) return;
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      movedPx += Math.hypot(dx, dy);
      if (movedPx > TAP_PX) {                           // drag on the world = orbit
        orbit.theta -= dx * 0.0065;
        orbit.phi = clamp(orbit.phi - dy * 0.005, CAM_PHI_MIN, CAM_PHI_MAX);
      }
      drag.x = ev.clientX; drag.y = ev.clientY;
    } catch (e) {}
  }

  function onUp(ev) {
    try {
      pointers.delete(ev.pointerId);
      if (pointers.size < 2) pinch = 0;
      const wasTap = ev.pointerId === downId && drag &&
                     movedPx <= TAP_PX && (performance.now() - downT) <= TAP_MS;
      drag = null;
      if (ev.pointerId === downId) downId = -1;
      if (wasTap && !inputBlocked()) handleTap(ev);
    } catch (e) {}
  }

  /* a tap on a musician PLAYS it; a tap on the grass walks there */
  function handleTap(ev) {
    ndcFrom(ev);
    caster.setFromCamera(ndc, camera);
    const animals = (host && host.animals) || [];
    const targets = [];
    for (let i = 0; i < animals.length; i++) if (animals[i] && animals[i].hit) targets.push(animals[i].hit);
    if (targets.length) {
      const hits = caster.intersectObjects(targets, false);
      if (hits.length) {
        const idx = hits[0].object.userData ? hits[0].object.userData.animal : -1;
        if (idx >= 0) {
          tapAnimal(idx);
          padIn[idx] = true;                 // don't re-fire if we walk onto the pad
          return;
        }
      }
    }
    if (!caster.ray.intersectPlane(groundPlane, hitV)) return;
    let x = hitV.x, z = hitV.z;
    const r = Math.hypot(x, z);
    if (r > BOUND - 0.6) { const k = (BOUND - 0.6) / r; x *= k; z *= k; }
    walkTo(x, z);
    sfx('tap');
  }

  function onWheel(ev) {
    try {
      if (inputBlocked()) return;
      ev.preventDefault();
      const d = (ev.deltaY > 0 ? 1 : -1) * 1.6;
      orbit.radius = clamp(orbit.radius + d, CAM_R_MIN, CAM_R_MAX);
    } catch (e) {}
  }

  function onKey(ev) {
    try {
      if (inputBlocked() || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const c = ev.code;
      if (c === 'Equal' || c === 'NumpadAdd') nudgeZoom(-3.2);
      else if (c === 'Minus' || c === 'NumpadSubtract') nudgeZoom(3.2);
      else if (c === 'KeyQ') nudgeTurn(0.5);
      else if (c === 'KeyE') nudgeTurn(-0.5);
      else if (c === 'KeyH') goHome();
    } catch (e) {}
  }

  /* ================================================================ walking */
  function walkTo(x, z) {
    try { K.queueWalkTo && K.queueWalkTo(x, z); } catch (e) {}
    if (ring) { ring.position.set(x, 0.07, z); ring.visible = true; ringT = 0; }
  }
  function clearWalk() {
    try { K.clearWalkTarget && K.clearWalkTarget(); } catch (e) {}
    if (ring) ring.visible = false;
  }
  function goHome() {
    if (inputBlocked()) return;
    walkTo(HOME.x, HOME.z);
    sfx('yes');
    toast(tr('💙 Walking back to Nilu…', '💙 Volviendo con Nilu…'), 2000);
  }

  function tapAnimal(i) {
    try { host && host.tapAnimal && host.tapAnimal(i); } catch (e) {}
  }

  function moveTick(dt) {
    let vx = 0, vz = 0;
    let joy = null;
    try { joy = K.joy; } catch (e) {}
    if (joy && joy.active) {
      /* camera-relative: pushing "away" always walks away from the camera,
         whichever way the child has swung the view */
      const c = Math.cos(view.theta), s = Math.sin(view.theta);
      vx = joy.x * c + joy.z * s;
      vz = -joy.x * s + joy.z * c;
      if (ring && ring.visible) ring.visible = false;
    } else {
      let t = null;
      try { t = K.consumeWalkTarget ? K.consumeWalkTarget() : null; } catch (e) {}
      if (t) {
        const dx = t.x - P.x, dz = t.z - P.z, d = Math.hypot(dx, dz);
        if (d < 0.3) clearWalk();
        else { vx = dx / d; vz = dz / d; }
      } else if (ring && ring.visible) ring.visible = false;
    }

    const inPond = Math.hypot(P.x - POND.x, P.z - POND.z) < POND.r - 0.2;
    let sp = WALK_SPEED / speedMul();
    if (calm()) sp *= 0.9;
    if (inPond) sp *= 0.78;                      // wading is slower and sillier

    const m = Math.hypot(vx, vz);
    let want = 0;
    if (m > 0.02) {
      const mag = Math.min(1, m);
      vx = (vx / m) * mag; vz = (vz / m) * mag;
      P.x += vx * sp * dt;
      P.z += vz * sp * dt;
      walkPhase += sp * mag * dt * 3.2;
      want = mag;
      let d = Math.atan2(vx, vz) - P.ry;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      P.ry += d * lerpK(dt, 11);
    }
    moveAmt += (want - moveAmt) * lerpK(dt, 9);

    /* soft bounds: the meadow gently gathers the child back in, no wall, no message */
    const r = Math.hypot(P.x, P.z);
    if (r > BOUND) {
      const pull = (r - BOUND) * lerpK(dt, 3.5);
      P.x -= (P.x / r) * pull;
      P.z -= (P.z / r) * pull;
    }

    /* music with your feet: stepping onto a stage pad plays that musician */
    if (!replaying()) {
      const animals = (host && host.animals) || [];
      for (let i = 0; i < animals.length && i < padIn.length; i++) {
        const a = animals[i];
        if (!a || !a.g) continue;
        const d = Math.hypot(P.x - a.g.position.x, P.z - a.g.position.z);
        if (!padIn[i] && d < PAD_IN) { padIn[i] = true; tapAnimal(i); }
        else if (padIn[i] && d > PAD_OUT) padIn[i] = false;
      }
    }
    return inPond;
  }

  function poseTick(dt, inPond) {
    if (!kid) return;
    const soft = lessMotion() ? 0.45 : 1;
    const bob = Math.abs(Math.sin(walkPhase)) * 0.035 * moveAmt * soft
              + Math.sin(clock * 1.5) * 0.012 * (1 - moveAmt);
    kid.position.set(P.x, (inPond ? -0.14 : 0) + bob, P.z);
    kid.rotation.y = P.ry;
    if (lean) lean.rotation.x = moveAmt * 0.07 * soft;
    const sw = Math.sin(walkPhase) * moveAmt * soft;
    if (legL) legL.rotation.x = sw * 0.6;
    if (legR) legR.rotation.x = -sw * 0.6;
    if (armL) armL.rotation.x = -sw * 0.5 + (1 - moveAmt) * Math.sin(clock * 1.5) * 0.06;
    if (armR) armR.rotation.x = sw * 0.5 - (1 - moveAmt) * Math.sin(clock * 1.5) * 0.06;
    if (headG) headG.rotation.z = Math.sin(walkPhase) * 0.05 * moveAmt * soft;
    if (shadowMesh) {
      shadowMesh.position.set(P.x, 0.035, P.z);
      const s = 1 - bob * 1.4;
      shadowMesh.scale.set(s, s, 1);
      shadowMesh.material.opacity = (inPond ? 0.35 : 0.8) - moveAmt * 0.1;
    }
    if (ring && ring.visible) {
      ringT += dt;
      const s = 1 + Math.sin(ringT * 4) * 0.12;
      ring.scale.set(s, s, 1);
      ring.material.opacity = 0.55 + Math.sin(ringT * 4) * 0.25;
    }
  }

  /* ============================================================= chrome tick
     Cheap, throttled: title-screen gating, the 🔎 chip and the ⬅️ Nilu arrow. */
  const ARROWS = ['⬆️', '↖️', '⬅️', '↙️', '⬇️', '↘️', '➡️', '↗️'];
  function homeArrow() {
    /* which way is Nilu, from where the camera is looking? */
    const d = Math.atan2(BAND.x - P.x, BAND.z - P.z);
    let rel = d - view.theta - Math.PI;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    let idx = Math.round(rel / (Math.PI / 4));
    if (idx < 0) idx += 8;
    return ARROWS[idx % 8];
  }

  function uiTick(dt) {
    uiT += dt;
    if (uiT < 0.2) return;
    uiT = 0;
    let onTitle = false;
    try {
      const t = document.getElementById('kTitle');
      onTitle = !!(t && t.style.display !== 'none');
    } catch (e) {}
    const play = !onTitle;
    if (play !== started) {
      started = play;
      if (started) firstHints();
    }
    const chrome = started && !replaying() && mode !== 'free';
    showChrome(chrome);
    if (!chrome) return;
    const far = Math.hypot(P.x - BAND.x, P.z - BAND.z) > HOME_DIST;
    if (far !== homeShown && elHome) {
      homeShown = far;
      elHome.style.display = far ? 'flex' : 'none';
      elHome.classList.toggle('show', far);
    }
    if (far && elHome) elHome.textContent = homeArrow() + ' Nilu';
  }

  let hintsDone = false;
  function firstHints() {
    if (hintsDone || replaying()) return;
    hintsDone = true;
    setTimeout(() => { if (!replaying()) hint(tr('🕹️ Walk with the stick — or tap the grass to go there!',
                                                 '🕹️ Camina con la palanca — ¡o toca el pasto para ir ahí!'), 5200); }, 3000);
    setTimeout(() => { if (!replaying()) hint(tr('🔎 There are hidden wonders in the meadow — go and find them!',
                                                 '🔎 Hay maravillas escondidas en el prado — ¡ve a encontrarlas!'), 5200); }, 14000);
    setTimeout(() => { if (!replaying()) hint(tr('🎵 Stand on a musician’s pad — your feet make music too!',
                                                 '🎵 Párate en la tarima de un músico — ¡tus pies también hacen música!'), 5200); }, 26000);
  }

  /* ================================================================== API */
  const RWalk = {
    pos: P,

    init(h) {
      try {
        if (ready) return true;
        host = h || {};
        THREE = host.THREE || window.THREE;
        scene = host.scene; camera = host.camera; renderer = host.renderer;
        if (host.K) K = host.K;
        if (!THREE || !scene || !camera) return false;
        canvas = (renderer && renderer.domElement) || document.querySelector('#kStage canvas');

        caster = new THREE.Raycaster();
        ndc = new THREE.Vector2();
        groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        hitV = new THREE.Vector3();
        camTarget = new THREE.Vector3(P.x, 1.15, P.z);

        foundSet = new Set(loadFound());
        if (foundSet.size > total) total = foundSet.size;

        kid = buildKid();
        kid.position.set(P.x, 0, P.z);
        kid.rotation.y = P.ry;
        scene.add(kid);
        buildRing();

        injectStickFallback();
        buildUI();
        refreshFind();
        showChrome(false);

        if (canvas) {
          canvas.addEventListener('pointerdown', onDown);
          canvas.addEventListener('pointermove', onMove);
          canvas.addEventListener('pointerup', onUp);
          canvas.addEventListener('pointercancel', onUp);
          canvas.addEventListener('wheel', onWheel, { passive: false });
        }
        addEventListener('pointerup', (e) => { if (pointers.has(e.pointerId)) onUp(e); });
        addEventListener('keydown', onKey);

        /* place the camera before the first frame so nothing pops
           (view and camTarget already sit on their targets, so one tick is exact) */
        view.theta = orbit.theta; view.phi = orbit.phi; view.radius = orbit.radius;
        camTick(0.016);
        ready = true;
        return true;
      } catch (e) { ready = false; return false; }
    },

    tick(dt) {
      if (!ready) return;
      try {
        dt = Math.max(0, Math.min(0.05, dt || 0));
        clock += dt;
        tweenTick(dt);
        uiTick(dt);
        if (replaying()) {
          /* My Movie: the recording drives the child, input stays out of it */
          let pose = null;
          try { pose = K.replayPose ? K.replayPose(dt) : null; } catch (e) {}
          if (pose) {
            const d = Math.hypot(pose.x - P.x, pose.z - P.z);
            P.x = pose.x; P.z = pose.z; P.ry = pose.ry;
            walkPhase += d * 3.2;
            moveAmt += (Math.min(1, d / Math.max(0.0001, dt) / 3) - moveAmt) * lerpK(dt, 6);
          } else {
            moveAmt += (0 - moveAmt) * lerpK(dt, 6);
          }
          if (ring) ring.visible = false;
          const inPondR = Math.hypot(P.x - POND.x, P.z - POND.z) < POND.r - 0.2;
          poseTick(dt, inPondR);
          camTick(dt);
          return;
        }
        const inPond = moveTick(dt);
        poseTick(dt, inPond);
        spotTick();
        camTick(dt);
      } catch (e) { /* a bad frame must never stop the meadow */ }
    },

    pose() { return { x: P.x, z: P.z, ry: P.ry }; },
    owns() { return ready && mode !== 'free'; },
    setMode(m) {
      if (m !== 'follow' && m !== 'band' && m !== 'free') return;
      mode = m;
      uiT = 1;                       // refresh the chrome on the next tick
      if (m !== 'follow') clearWalk();
    },
    mode() { return mode; },

    addSpot, removeSpot,
    found,
    hasFound(id) { return !!(foundSet && foundSet.has(id)); },
    foundCount() { return foundSet ? foundSet.size : 0; },
    setTotal(n) { n = parseInt(n, 10); if (n > 0) { total = n; refreshFind(); } },
    total() { return total; },

    hint,
    walkTo(x, z) { walkTo(x, z); },
    goHome,
    teleport(x, z, ry) {
      P.x = x; P.z = z;
      if (typeof ry === 'number') P.ry = ry;
      clearWalk();
      if (camTarget) { camTarget.x = P.x; camTarget.z = P.z; }
    },
    avatar() { return kid; },

    /* grown-up / test helper: forget the discoveries and start the hunt again */
    forget() {
      foundSet = new Set();
      save('walk.found', []);
      save('walk.allDone', 0);
      refreshFind();
    },
  };

  window.RWalk = RWalk;
})();
