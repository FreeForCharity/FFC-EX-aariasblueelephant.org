/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — WALKING THE FIELD  (window.SWalk)

   Owns the child: their body, every input (joystick / keys / tap-to-walk /
   drag / pinch / wheel / ➕➖), the follow camera, the proximity-spot system
   that levels.js hangs its stations on, and the little chrome that belongs to
   walking (zoom buttons, the "⬅️ Nilu" arrow, the hint line, the info card).

   Handedness lives here: setHand('L'|'R') moves the glove to the other hand
   and everything downstream (grip, stance, batter's box) reads SWalk.hand().

   Nothing in here may white-screen the field: every kit call, every callback
   and every input handler is wrapped.
   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  /* ============================================================ kit helpers
     All safe to call before (or entirely without) ABEKit. */
  let K = window.ABEKit || {};
  const tr = (en, es) => { try { return K.tr ? K.tr(en, es) : en; } catch (e) { return en; } };
  const toast = (m, ms) => { try { K.toast && K.toast(m, ms); } catch (e) {} };
  const sfx = (n) => { try { K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} };
  const save = (k, v) => { try { K.save && K.save(k, v); } catch (e) {} };
  const load = (k, d) => { try { return K.load ? K.load(k, d) : d; } catch (e) { return d; } };
  const calm = () => { try { return !!(K.calm && K.calm()); } catch (e) { return false; } };
  const replaying = () => { try { return !!K.replaying; } catch (e) { return false; } };
  const isPaused = () => { try { return !!K.paused; } catch (e) { return false; } };
  const lessMotion = () => { try { return !!K.reduceMotion; } catch (e) { return false; } };
  /* the kit's speed is a DURATION multiplier (relaxed 1.5 · normal 1 · fast .6),
     so walking speed divides by it */
  const speedMul = () => {
    let s = 1;
    try { s = Number(K.speed ? K.speed() : 1); } catch (e) {}
    return (s >= 0.4 && s <= 3) ? s : 1;
  };

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerpK = (dt, rate) => 1 - Math.exp(-rate * Math.max(0, Math.min(0.1, dt)));

  /* ============================================================== constants */
  const WALK_SPEED = 4.4;
  const CAM_R_MIN = 6, CAM_R_MAX = 34, CAM_PHI_MIN = 0.3, CAM_PHI_MAX = 1.3;
  const TAP_PX = 8, TAP_MS = 300;
  const HOME_DIST = 13;             // show the "⬅️ Nilu" chip past this — she
                                    // is how you know where to go, so point at
                                    // her early rather than only when lost

  /* ================================================================== state */
  let THREE = null, scene = null, camera = null, renderer = null, canvas = null, host = null;
  let L = null;
  let ready = false, started = false, frozen = false;
  let me = null;                    // the SBField person rig
  let ring = null, ringT = 0;
  let hand = 'R';

  const P = { x: 0, z: 0, ry: Math.PI };
  let walkPhase = 0, moveAmt = 0, clock = 0;
  let handUp = 0, handUpWant = 0, sitting = false, customPose = null;
  let held = null;                  // 'bat' | 'ball' | null — what's in the throwing hand
  let heldMesh = null;

  const orbit = { theta: 0, phi: 1.0, radius: 17 };
  const view = { theta: 0, phi: 1.0, radius: 17 };
  let camTarget = null, camLock = null;

  const tweens = [];
  const spots = [];

  /* DOM */
  let elZoom = null, elHome = null, elHint = null, elCard = null;
  let cardEmoji = null, cardTitle = null, cardText = null, cardBtn = null;
  let hintTimer = 0, cardTimer = 0, uiT = 0, homeShown = false;

  /* ============================================================== little UI */
  function mk(tag, id, cls, txt) {
    const n = document.createElement(tag);
    if (id) n.id = id;
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  /* Safety net: index.html hides #kStick until the field is up; this rule is
     higher-specificity than a bare #kStick so the stick comes back even if
     field.css failed to load — while still letting the kit hide it during
     My Movie (the kit sets an inline display:none). */
  function injectStickFallback() {
    try {
      if (document.getElementById('swStickFix')) return;
      const s = document.createElement('style');
      s.id = 'swStickFix';
      s.textContent = '#kStick[style*="block"]{display:block !important;}';
      document.head.appendChild(s);
    } catch (e) {}
  }

  function buildUI() {
    if (!document.body || document.getElementById('swZoom')) return;
    const U = (window.SBContent && SBContent.ui) || {};
    const T = (o, en, es) => (o ? tr(o.en, o.es) : tr(en, es));

    elZoom = mk('div', 'swZoom');
    const zi = mk('button', 'zoomInBtn', null, '➕');
    const zo = mk('button', 'zoomOutBtn', null, '➖');
    zi.title = T(U.zoomIn, 'Zoom in', 'Acercar');
    zo.title = T(U.zoomOut, 'Zoom out', 'Alejar');
    zi.setAttribute('aria-label', zi.title);
    zo.setAttribute('aria-label', zo.title);
    zi.addEventListener('click', () => nudgeZoom(-3.6));
    zo.addEventListener('click', () => nudgeZoom(3.6));
    elZoom.appendChild(zi); elZoom.appendChild(zo);
    document.body.appendChild(elZoom);

    elHome = mk('button', 'swHome', null, '⬅️ Nilu');
    elHome.title = T(U.backToNilu, 'Walk back to Nilu', 'Vuelve con Nilu');
    elHome.setAttribute('aria-label', elHome.title);
    elHome.style.display = 'none';
    elHome.addEventListener('click', goToNilu);
    document.body.appendChild(elHome);

    elCard = mk('div', 'swCard');
    cardEmoji = mk('div', null, 'swCardEmoji', '🥎');
    cardTitle = mk('div', null, 'swCardTitle', '');
    cardText = mk('div', null, 'swCardText', '');
    cardBtn = mk('button', null, 'swCardBtn', T(U.yay, '💙 Yay!', '💙 ¡Genial!'));
    cardBtn.addEventListener('click', () => { sfx('tap'); hideCard(); });
    elCard.appendChild(cardEmoji); elCard.appendChild(cardTitle);
    elCard.appendChild(cardText); elCard.appendChild(cardBtn);
    document.body.appendChild(elCard);

    elHint = mk('div', 'swHint', 'swHint', '');
    elHint.style.display = 'none';
    document.body.appendChild(elHint);
  }

  function showChrome(on) {
    if (elZoom) elZoom.style.display = on ? '' : 'none';
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
    }, (ms || 4600) * speedMul());
  }

  function hideCard() {
    if (!elCard) return;
    elCard.classList.remove('show');
    clearTimeout(cardTimer);
    if (cardDone) { const f = cardDone; cardDone = null; try { f(); } catch (e) {} }
  }
  let cardDone = null;

  function showCard(emoji, title, text, opts) {
    if (!elCard) return;
    opts = opts || {};
    cardEmoji.textContent = emoji || '🥎';
    cardTitle.textContent = title || '';
    cardText.textContent = text || '';
    cardBtn.textContent = opts.btn || tr('💙 Yay!', '💙 ¡Genial!');
    cardDone = opts.onDone || null;
    elCard.classList.add('show');
    clearTimeout(cardTimer);
    if (!opts.sticky) cardTimer = setTimeout(hideCard, (opts.ms || 5600) * speedMul());
  }

  /* ================================================================ camera */
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

  /* ---------------------------------------------------------------- camera
     collision. Home plate sits inside a backstop and in front of bleachers;
     without this, the most important spot on the field is watched through a
     cage. One raycast along the camera boom against the small tagged list
     SBField.blockers keeps, a few times a second, pulls the camera in front
     of whatever is in the way. */
  let camPull = 0, blockT = 0, boomCaster = null, boomDir = null;
  function camBlocked(want) {
    const SF = window.SBField;
    if (!THREE || !camTarget || !SF || !SF.blockers || !SF.blockers.length) return want;
    if (!boomCaster) { boomCaster = new THREE.Raycaster(); boomDir = new THREE.Vector3(); }
    const sp = Math.sin(view.phi), cp = Math.cos(view.phi);
    boomDir.set(sp * Math.sin(view.theta), cp, sp * Math.cos(view.theta));
    boomCaster.set(camTarget, boomDir);
    boomCaster.far = want + 0.6;
    let hit = 0;
    try {
      const hits = boomCaster.intersectObjects(SF.blockers, false);
      if (hits.length) hit = hits[0].distance;
    } catch (e) {}
    return hit > 0.5 ? Math.max(4.5, hit - 0.9) : want;
  }

  function camTick(dt) {
    if (!camera || !camTarget) return;
    const rate = lessMotion() ? 14 : (calm() ? 5 : 7);
    const e = lerpK(dt, rate);

    let tx = P.x, ty = 1.15, tz = P.z;
    let wTheta = orbit.theta, wPhi = orbit.phi, wRadius = orbit.radius;
    if (camLock) {
      /* A lock WITH a position frames a fixed spot (a throw between two
         people). A lock WITHOUT one keeps following the child but takes over
         the angle and the zoom — which is what a moving action like chasing a
         grounder needs: close enough to read, still yours to walk. */
      if (camLock.x != null) { tx = camLock.x; tz = camLock.z; }
      if (camLock.y != null) ty = camLock.y;
      if (camLock.theta != null) wTheta = camLock.theta;
      if (camLock.phi != null) wPhi = camLock.phi;
      if (camLock.radius != null) wRadius = camLock.radius;
    }
    camTarget.x += (tx - camTarget.x) * e;
    camTarget.y += (ty - camTarget.y) * e;
    camTarget.z += (tz - camTarget.z) * e;

    let dTheta = wTheta - view.theta;
    while (dTheta > Math.PI) dTheta -= Math.PI * 2;
    while (dTheta < -Math.PI) dTheta += Math.PI * 2;
    view.theta += dTheta * e;
    view.phi += (clamp(wPhi, CAM_PHI_MIN, CAM_PHI_MAX) - view.phi) * e;
    view.radius += (clamp(wRadius, CAM_R_MIN, CAM_R_MAX) - view.radius) * e;

    /* checked a few times a second — a per-frame raycast is more than this needs */
    blockT -= dt;
    if (blockT <= 0) { camPull = camBlocked(view.radius); blockT = 0.12; }
    const useR = Math.min(view.radius, camPull || view.radius);

    const sp = Math.sin(view.phi), cp = Math.cos(view.phi);
    camera.position.set(
      camTarget.x + useR * sp * Math.sin(view.theta),
      Math.max(1.2, camTarget.y + useR * cp),
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
      downId = ev.pointerId; downT = performance.now(); movedPx = 0;
      drag = { x: ev.clientX, y: ev.clientY };
    } catch (e) {}
  }

  function onMove(ev) {
    try {
      if (!pointers.has(ev.pointerId)) return;
      const p = pointers.get(ev.pointerId);
      p.x = ev.clientX; p.y = ev.clientY;
      if (pointers.size === 2) {
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
      if (movedPx > TAP_PX && !camLock) {
        orbit.theta -= dx * 0.0065;
        orbit.phi = clamp(orbit.phi - dy * 0.005, CAM_PHI_MIN, CAM_PHI_MAX);
      }
      drag.x = ev.clientX; drag.y = ev.clientY;
      if (gestureOn) gestureMove(ev);
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
      if (gestureOn) gestureEnd();
      if (wasTap && !inputBlocked()) handleTap(ev);
    } catch (e) {}
  }

  /* a tap on something taggable walks you to it; a tap on the grass walks there */
  function handleTap(ev) {
    if (frozen) return;
    ndcFrom(ev);
    caster.setFromCamera(ndc, camera);

    /* let the level layer claim the tap first (answer bubbles, gear, people) */
    if (host && host.onTap) {
      let claimed = false;
      try { claimed = !!host.onTap(caster, ndc); } catch (e) {}
      if (claimed) return;
    }
    if (!caster.ray.intersectPlane(groundPlane, hitV)) return;
    /* nudge the tap out of anything solid, so tapping the fence walks you up
       to it rather than into it */
    const t = { x: hitV.x, z: hitV.z };
    try { SBField.collide(t, 0.5); } catch (e) {}
    walkTo(t.x, t.z);
    sfx('tap');
  }

  function onWheel(ev) {
    try {
      if (inputBlocked()) return;
      ev.preventDefault();
      orbit.radius = clamp(orbit.radius + (ev.deltaY > 0 ? 1.8 : -1.8), CAM_R_MIN, CAM_R_MAX);
    } catch (e) {}
  }

  function onKey(ev) {
    try {
      if (inputBlocked() || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const c = ev.code;
      if (c === 'Equal' || c === 'NumpadAdd') nudgeZoom(-3.6);
      else if (c === 'Minus' || c === 'NumpadSubtract') nudgeZoom(3.6);
      else if (c === 'KeyQ') nudgeTurn(0.5);
      else if (c === 'KeyE') nudgeTurn(-0.5);
      else if (c === 'KeyH') goToNilu();
    } catch (e) {}
  }

  /* ── a swipe-arc gesture, used by the pitching drill (arm circle) ────── */
  let gestureOn = false, gesturePts = null, gestureCb = null;
  function gestureMove(ev) {
    if (!gesturePts) return;
    gesturePts.push({ x: ev.clientX, y: ev.clientY, t: performance.now() });
    if (gesturePts.length > 90) gesturePts.shift();
  }
  function gestureEnd() {
    const pts = gesturePts || [];
    gestureOn = false; gesturePts = null;
    const cb = gestureCb; gestureCb = null;
    if (!cb) return;
    /* how much did the pointer sweep around its own centre? */
    let total = 0;
    if (pts.length > 4) {
      let cx = 0, cy = 0;
      for (const p of pts) { cx += p.x; cy += p.y; }
      cx /= pts.length; cy /= pts.length;
      let prev = Math.atan2(pts[0].y - cy, pts[0].x - cx);
      for (let i = 1; i < pts.length; i++) {
        let a = Math.atan2(pts[i].y - cy, pts[i].x - cx);
        let d = a - prev;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        total += d;
        prev = a;
      }
    }
    try { cb(Math.abs(total)); } catch (e) {}
  }

  /* ================================================================ walking */
  function walkTo(x, z) {
    const c = L.boundC, r = Math.hypot(x - c.x, z - c.z);
    if (r > L.boundR - 1) {
      const k = (L.boundR - 1) / r;
      x = c.x + (x - c.x) * k;
      z = c.z + (z - c.z) * k;
    }
    try { K.queueWalkTo && K.queueWalkTo(x, z); } catch (e) {}
    if (ring) { ring.position.set(x, 0.07, z); ring.visible = true; ringT = 0; }
  }
  function clearWalk() {
    try { K.clearWalkTarget && K.clearWalkTarget(); } catch (e) {}
    if (ring) ring.visible = false;
  }
  function goToNilu() {
    if (inputBlocked() || frozen) return;
    const N = window.SBField && SBField.nilu;
    if (!N) return;
    walkTo(N.x + 1.6, N.z + 1.6);
    sfx('yes');
    toast(tr('💙 Walking back to Nilu…', '💙 Volviendo con Nilu…'), 2000);
  }

  function moveTick(dt) {
    if (frozen) { moveAmt += (0 - moveAmt) * lerpK(dt, 9); clearWalk(); return; }
    let vx = 0, vz = 0, joy = null;
    try { joy = K.joy; } catch (e) {}
    if (joy && joy.active) {
      /* camera-relative: pushing "away" always walks away from the camera */
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

    let sp = WALK_SPEED / speedMul();
    if (calm()) sp *= 0.9;

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

    /* soft bounds — the field gathers you back in. No wall, no message. */
    const c = L.boundC, r = Math.hypot(P.x - c.x, P.z - c.z);
    if (r > L.boundR) {
      const pull = (r - L.boundR) * lerpK(dt, 3.5);
      P.x -= ((P.x - c.x) / r) * pull;
      P.z -= ((P.z - c.z) / r) * pull;
    }

    /* Hard bounds: the fence, the backstop, the dugout wall, the seats and
       the gear are real. If we've been pushed out of one, drop the tap-to-walk
       target too — otherwise the child grinds against a wall trying to reach
       somewhere they can't get to. */
    try {
      if (SBField.collide(P, 0.34)) {
        const t2 = K.consumeWalkTarget ? K.consumeWalkTarget() : null;
        if (t2 && Math.hypot(t2.x - P.x, t2.z - P.z) > 1.2) clearWalk();
      }
    } catch (e) {}
  }

  function poseTick(dt) {
    if (!me) return;
    const soft = lessMotion() ? 0.45 : 1;
    handUp += (handUpWant - handUp) * lerpK(dt, 7);
    const bob = Math.abs(Math.sin(walkPhase)) * 0.035 * moveAmt * soft
              + Math.sin(clock * 1.5) * 0.012 * (1 - moveAmt);
    const sit = sitting ? -0.42 : 0;
    me.group.position.set(P.x, sit + bob, P.z);
    me.group.rotation.y = P.ry;
    me.shadow.position.set(P.x, 0.03, P.z);
    me.shadow.material.opacity = (sitting ? 0.5 : 0.75) - moveAmt * 0.1;

    if (customPose) { try { customPose(me, dt, clock); } catch (e) {} }
    else {
      const sw = Math.sin(walkPhase) * moveAmt * soft;
      me.lean.rotation.x = sitting ? 0.1 : moveAmt * 0.07 * soft;
      me.legL.rotation.x = sitting ? -1.3 : sw * 0.6;
      me.legR.rotation.x = sitting ? -1.3 : -sw * 0.6;
      const thr = me.hand === 'R' ? me.armR : me.armL;
      const oth = me.hand === 'R' ? me.armL : me.armR;
      thr.rotation.x = (-sw * 0.5 + (1 - moveAmt) * Math.sin(clock * 1.5) * 0.05) * (1 - handUp)
                     + (-Math.PI * 0.95) * handUp;
      thr.rotation.z = 0;
      oth.rotation.x = (sw * 0.5 - (1 - moveAmt) * Math.sin(clock * 1.5) * 0.05) * (1 - handUp) + 0.12 * handUp;
      oth.rotation.z = 0;
      me.headG.rotation.z = Math.sin(walkPhase) * 0.05 * moveAmt * soft;
      me.headG.rotation.x = 0;
    }

    if (ring && ring.visible) {
      ringT += dt;
      const s = 1 + Math.sin(ringT * 4) * 0.12;
      ring.scale.set(s, s, 1);
      ring.material.opacity = 0.55 + Math.sin(ringT * 4) * 0.25;
    }
  }

  /* ============================================================ chrome tick */
  const ARROWS = ['⬆️', '↖️', '⬅️', '↙️', '⬇️', '↘️', '➡️', '↗️'];
  function arrowTo(x, z) {
    const d = Math.atan2(x - P.x, z - P.z);
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
      if (started && host && host.onFirstPlay) { try { host.onFirstPlay(); } catch (e) {} }
    }
    const chrome = started && !replaying();
    showChrome(chrome);
    if (!chrome) return;
    const N = window.SBField && SBField.nilu;
    if (!N || !elHome) return;
    const far = Math.hypot(P.x - N.x, P.z - N.z) > HOME_DIST;
    if (far !== homeShown) {
      homeShown = far;
      elHome.style.display = far ? 'flex' : 'none';
      elHome.classList.toggle('show', far);
    }
    if (far) elHome.textContent = arrowTo(N.x, N.z) + ' Nilu';
  }

  /* ====================================================== proximity spots */
  function addSpot(s) {
    try {
      if (!s || !s.id) return null;
      removeSpot(s.id);
      const sp = {
        id: s.id, x: +s.x || 0, z: +s.z || 0, r: Math.max(0.5, +s.r || 2.2),
        once: !!s.once, onEnter: s.onEnter, onExit: s.onExit, inside: false, done: false,
      };
      spots.push(sp);
      return sp;
    } catch (e) { return null; }
  }
  function removeSpot(id) {
    for (let i = spots.length - 1; i >= 0; i--) if (spots[i].id === id) spots.splice(i, 1);
  }
  function clearSpots() { spots.length = 0; }
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

  /* ========================================================= carrying gear */
  function setHeld(kind) {
    const SF = window.SBField;
    if (!SF || !me) return;
    if (heldMesh && heldMesh.parent) heldMesh.parent.remove(heldMesh);
    heldMesh = null;
    held = kind || null;
    if (!held) return;
    const grip = me.hand === 'R' ? me.armR : me.armL;
    if (held === 'bat') {
      heldMesh = SF.makeBat();
      heldMesh.scale.setScalar(0.95);
      heldMesh.position.set(0, -0.62, 0.06);
      heldMesh.rotation.x = -0.4;
    } else if (held === 'ball') {
      heldMesh = SF.makeBall(0.15);
      heldMesh.position.set(0, -0.5, 0.05);
    }
    if (heldMesh) grip.add(heldMesh);
  }

  function setHelmet(on) {
    const SF = window.SBField;
    if (!SF || !me) return;
    if (me._helmet) { me.headG.remove(me._helmet); me._helmet = null; }
    if (on) {
      const h = SF.makeHelmet();
      h.position.y = 0.17;
      me.headG.add(h);
      me._helmet = h;
    }
  }

  /* ================================================================== API */
  const SWalk = {
    pos: P,

    init(h) {
      try {
        if (ready) return true;
        host = h || {};
        THREE = host.THREE || window.THREE;
        scene = host.scene; camera = host.camera; renderer = host.renderer;
        if (host.K) K = host.K;
        const SF = window.SBField;
        if (!THREE || !scene || !camera || !SF) return false;
        L = SF.L;
        canvas = (renderer && renderer.domElement) || document.querySelector('canvas');

        caster = new THREE.Raycaster();
        ndc = new THREE.Vector2();
        groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        hitV = new THREE.Vector3();

        hand = load('hand', '') === 'L' ? 'L' : (load('hand', '') === 'R' ? 'R' : 'R');

        me = SF.makePerson({
          hand: hand, shirt: 0x7ec8f7, cap: 0xe05a5a, pants: 0x53507e,
          name: null, speed: WALK_SPEED,
        });
        scene.add(me.group); scene.add(me.shadow);
        P.x = L.start.x; P.z = L.start.z; P.ry = L.start.ry;
        me.place(P.x, P.z, P.ry);
        camTarget = new THREE.Vector3(P.x, 1.15, P.z);

        ring = new THREE.Mesh(
          new THREE.RingGeometry(0.42, 0.62, 26),
          new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.07;
        ring.visible = false;
        scene.add(ring);

        injectStickFallback();
        buildUI();
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
          poseTick(dt);
          camTick(dt);
          return;
        }
        moveTick(dt);
        poseTick(dt);
        spotTick();
        camTick(dt);
      } catch (e) { /* one bad frame must never stop the field */ }
    },

    /* ---- pose & state -------------------------------------------------- */
    pose() { return { x: P.x, z: P.z, ry: P.ry }; },
    avatar() { return me; },
    rig() { return me; },
    at(p, r) { return Math.hypot(P.x - p.x, P.z - p.z) <= (r || 2.2); },
    facing(x, z) { P.ry = Math.atan2(x - P.x, z - P.z); },
    teleport(x, z, ry) {
      P.x = x; P.z = z;
      if (typeof ry === 'number') P.ry = ry;
      clearWalk();
      if (camTarget) { camTarget.x = P.x; camTarget.z = P.z; }
    },
    walkTo(x, z) { walkTo(x, z); },
    goToNilu,
    /* freeze = the child stays put while a coach demonstrates. Input still
       orbits the camera, so it never feels like the game locked up. */
    freeze(on) { frozen = !!on; if (frozen) clearWalk(); },
    frozen() { return frozen; },
    sit(on) { sitting = !!on; },
    raiseHand(on) { handUpWant = on ? 1 : 0; },
    handIsUp() { return handUp > 0.85; },
    setPose(fn) { customPose = fn || null; },
    hold: setHeld,
    holding() { return held; },
    helmet: setHelmet,
    hasHelmet() { return !!(me && me._helmet); },

    /* ---- handedness ---------------------------------------------------- */
    hand() { return hand; },
    setHand(h) {
      hand = h === 'L' ? 'L' : 'R';
      save('hand', hand);
      if (!me) return hand;
      /* move the glove across, and any held gear with it */
      const SF = window.SBField;
      const oldGrip = me.hand === 'R' ? me.armR : me.armL;
      if (me.glove && me.glove.parent) me.glove.parent.remove(me.glove);
      me.hand = hand;
      me.gloveSide = hand === 'R' ? 'L' : 'R';
      if (SF) {
        const g = SF.makeGlove();
        g.scale.setScalar(0.9);
        g.position.set(0, -0.54, 0.04);
        g.rotation.x = -0.5;
        me.hands[me.gloveSide].pivot.add(g);
        me.glove = g;
      }
      if (heldMesh && heldMesh.parent === oldGrip) {
        oldGrip.remove(heldMesh);
        (hand === 'R' ? me.armR : me.armL).add(heldMesh);
      }
      return hand;
    },
    /* fills {glove} {throw} {front} {back} in a coach cue */
    fill(s) {
      if (!s) return '';
      const es = (function () { try { return K.es && K.es(); } catch (e) { return false; } })();
      const R = hand === 'R';
      const words = es
        ? { glove: R ? 'izquierda' : 'derecha', throw: R ? 'derecho' : 'izquierdo',
            front: R ? 'izquierdo' : 'derecho', back: R ? 'derecha' : 'izquierda' }
        : { glove: R ? 'left' : 'right', throw: R ? 'right' : 'left',
            front: R ? 'left' : 'right', back: R ? 'right' : 'left' };
      return String(s).replace(/\{(glove|throw|front|back)\}/g, (m, k) => words[k]);
    },

    /* ---- camera -------------------------------------------------------- */
    lockCam(o) { camLock = o || null; },
    camTheta() { return view.theta; },

    /* ---- gestures ------------------------------------------------------ */
    awaitArc(cb) { gestureOn = true; gesturePts = []; gestureCb = cb; },
    cancelArc() { gestureOn = false; gesturePts = null; gestureCb = null; },

    /* ---- chrome -------------------------------------------------------- */
    hint, showCard, hideCard, arrowTo,
    addSpot, removeSpot, clearSpots,
    started() { return started; },
  };

  window.SWalk = SWalk;
})();
