/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — LEARN THE POSITIONS, BY PLAYING  (window.SBPositions)

   Opened any time from the 🧭 Positions button. Not a lesson to read — a
   short guided round:

     1 · THE TOUR    Nilu walks you to home plate, then to every infield spot
                     in turn (outfield too, once a grown-up turns it on in
                     Coach Mode). Arrive, hear what happens there, move on.
     2 · THE AT-BAT  a coach — a different one each time — pitches to you for
                     real. Swing whenever feels right; the window is huge and
                     nothing can be missed.
     3 · THE CALL    bat down, run to first, then watch the ball: sometimes
                     nobody's thrown it home yet, so you push for second, or
                     even score. Sometimes you're safe and done. Random each
                     time, so no two rounds play the same.

   Reuses the same 3D world, walking and ball-flight the drills already use —
   this file just directs it. Opening this stops whatever else was active
   (same as switching levels): the child can always pick their drill back up
   from the schedule strip.
   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const S = {};
  let K = window.ABEKit || {};
  let THREE = null, scene = null, C = null, L = null, F = null;

  const tr = (o) => { try { return (o && typeof o === 'object') ? K.tr(o.en, o.es) : (o || ''); } catch (e) { return (o && o.en) || ''; } };
  const sfx = (n) => { try { K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} };
  const speedMul = () => { try { const s = Number(K.speed()); return (s >= 0.4 && s <= 3) ? s : 1; } catch (e) { return 1; } };
  const record = (kind) => { try { K.recordEvent && K.recordEvent(kind); } catch (e) {} };
  const LV = () => window.SBLevels;
  const say = (line, vars, opts) => { try { return LV().speak(line, vars, opts); } catch (e) { return ''; } };

  let running = false, paused = false;
  let marks = [], balls = [];
  let tour = [], curBox = null, hitLanding = null, pitchCoachId = null;

  /* ══════════════════════════════════════ 📷 pick your own camera angle
     On for the WHOLE round, not just the pitch — Nilu's tour, the at-bat and
     every run between bases all use whichever angle the child last picked.
     None of the four locks a world point: the camera always keeps
     re-centring on wherever the child actually IS, so the same angle works
     whether they're standing still for a pitch or walking clear across the
     outfield. Only the relative angle (theta/phi/radius) is fixed. */
  const CAM_MODES = ['side', 'behind', 'facing', 'overhead'];
  const CAM_LABEL = { side: 'camSide', behind: 'camBehind', facing: 'camFacing', overhead: 'camOverhead' };
  let camIdx = 0, elCam = null, curTarget = null;

  /* whichever perpendicular side is closer to where the camera already is,
     so the world never spins round underneath the child — same rule
     drills.js's frameAction/frameFollow already use for this exact reason */
  function perpTheta(me, target) {
    const dx = target.x - me.x, dz = target.z - me.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;
    const t1 = Math.atan2(px, pz), t2 = Math.atan2(-px, -pz);
    let cur = 0;
    try { cur = SWalk.camTheta(); } catch (e) {}
    const off = (t) => { let d = t - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };
    return off(t1) <= off(t2) ? t1 : t2;
  }

  function applyCamAngle() {
    if (!curTarget || !running) return;
    const me = SWalk.pos, target = curTarget;
    const mode = CAM_MODES[camIdx];
    if (mode === 'side') {
      try { SWalk.lockCam({ theta: perpTheta(me, target), phi: 1.05, radius: 10 }); } catch (e) {}
    } else if (mode === 'behind') {
      const theta = Math.atan2(me.x - target.x, me.z - target.z);
      try { SWalk.lockCam({ theta: theta, phi: 1.08, radius: 9 }); } catch (e) {}
    } else if (mode === 'facing') {
      const theta = Math.atan2(target.x - me.x, target.z - me.z);
      try { SWalk.lockCam({ theta: theta, phi: 1.08, radius: 9 }); } catch (e) {}
    } else {
      try { SWalk.lockCam({ theta: 0, phi: 0.3, radius: 13 }); } catch (e) {}
    }
    updateCamBtn();
  }
  /* call whenever the destination changes (a new tour stop, the pitcher,
     the next base) — re-applies whichever angle the child already picked */
  function setCamTarget(t) { curTarget = t; applyCamAngle(); }

  function buildCamBtn() {
    if (elCam || !document.body) return;
    elCam = document.createElement('button');
    elCam.id = 'sbPosCam';
    elCam.addEventListener('click', () => {
      sfx('tap');
      camIdx = (camIdx + 1) % CAM_MODES.length;
      applyCamAngle();
    });
    document.body.appendChild(elCam);
  }
  function updateCamBtn() {
    if (!elCam) return;
    const label = tr(C.posLesson[CAM_LABEL[CAM_MODES[camIdx]]]);
    elCam.textContent = label;
    elCam.title = label;
    elCam.setAttribute('aria-label', label);
  }
  function showCamBtn() { buildCamBtn(); elCam.style.display = 'flex'; updateCamBtn(); }
  function hideCamBtn() { if (elCam) elCam.style.display = 'none'; }

  function outfieldOn() { try { return !!LV().G.outfieldOn; } catch (e) { return false; } }

  /* Nilu visibly leads the way to wherever the ground trail (F.guideTo)
     points — without this she just stands there while a line does the
     talking, which is the "she isn't showing me where to go" complaint. */
  function guideNilu(at) {
    const N = F.nilu;
    if (!N) return;
    N.goTo(at.x + 2.0, at.z + 1.6, () => { try { N.lookAt(SWalk.pos.x, SWalk.pos.z); } catch (e) {} });
  }

  /* the name to call a base by, reusing the position data already written
     for the tour so this never drifts out of sync with it */
  function posName(id) {
    const p = (C.positions || []).find((x) => x.id === id);
    return p ? tr(p.name) : '';
  }
  const HOME_NAME = () => tr({ en: 'home plate', es: 'el home' });

  /* a random "how Nilu's getting there" line — flying, hopping, walking
     diagonally… never the same plain "go to X" twice in a row */
  function moveSay(destName) {
    const styles = C.posLesson.moveStyles || [];
    if (!styles.length) return;
    const s = styles[Math.floor(Math.random() * styles.length)];
    say(s.line, { pos: destName }, { emoji: s.emoji });
  }

  /* ══════════════════════════════════════════════════════════ balls */
  function flyBall(from, to, opts) {
    opts = opts || {};
    const m = F.makeBall(0.16);
    m.position.set(from.x, from.y != null ? from.y : 1.0, from.z);
    scene.add(m);
    balls.push({
      m: m, t: 0, dur: Math.max(0.4, (opts.dur || 1.4) * speedMul()),
      a: { x: from.x, y: from.y != null ? from.y : 1.0, z: from.z },
      b: { x: to.x, y: to.y != null ? to.y : 0.2, z: to.z },
      h: opts.h != null ? opts.h : 3.0, done: opts.done || null,
    });
    return m;
  }
  function ballTick(dt) {
    for (let i = balls.length - 1; i >= 0; i--) {
      const f = balls[i];
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      f.m.position.set(
        f.a.x + (f.b.x - f.a.x) * k,
        f.a.y + (f.b.y - f.a.y) * k + Math.sin(k * Math.PI) * f.h,
        f.a.z + (f.b.z - f.a.z) * k);
      f.m.rotation.x += dt * 9;
      if (k >= 1) {
        F.discard(f.m); balls.splice(i, 1);
        if (f.done) { try { f.done(); } catch (e) {} }
      }
    }
  }
  function clearBalls() {
    for (const f of balls) { try { F.discard(f.m); } catch (e) {} }
    balls = [];
  }

  /* ══════════════════════════════════════════════════════════ marks */
  function clearMarks() {
    for (const m of marks) { try { F.discard(m); } catch (e) {} }
    marks = [];
    try { F.guideOff(); } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════ 1 · THE TOUR */
  const INFIELD_ORDER = ['1b', '2b', '3b', 'ss', 'p', 'c'];
  const OUTFIELD_ORDER = ['lf', 'cf', 'rf'];

  /* a new shuffle every round, so the tour is never the same fixed sequence
     twice — infield and outfield are shuffled separately (not fully mixed
     together) so the walk still stays roughly infield-then-outfield rather
     than zig-zagging the whole field back and forth */
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function tourList() {
    const byId = {};
    for (const p of (C.positions || [])) byId[p.id] = p;
    const ids = outfieldOn() ? shuffled(INFIELD_ORDER).concat(shuffled(OUTFIELD_ORDER)) : shuffled(INFIELD_ORDER);
    return ids.map((id) => byId[id]).filter(Boolean);
  }

  function startTour() {
    tour = tourList();
    showCamBtn();
    say(C.posLesson.startHome, null, { emoji: '🏠' });
    clearMarks();
    marks.push(F.marker(L.home.x, L.home.z, 0xffd43b, 2.4));
    guideNilu(L.home);
    setCamTarget({ x: L.home.x, z: L.home.z });
    try { F.guideTo(L.home.x, L.home.z, 2.6); } catch (e) {}
    SWalk.freeze(false);
    SWalk.addSpot({ id: 'posStop', x: L.home.x, z: L.home.z, r: 2.8, once: true, onEnter: () => {
      if (!running || paused) return;
      sfx('yes'); clearMarks();
      say(C.posLesson.homeDoes, null, { emoji: '🏠' });
      setTimeout(() => tourStep(0), 3200 * speedMul());
    } });
  }

  function tourStep(i) {
    if (!running) return;
    if (i >= tour.length) { setTimeout(startBatting, 700 * speedMul()); return; }
    const pos = tour[i];
    const at = L.pos[pos.id];
    if (!at) { tourStep(i + 1); return; }
    clearMarks();
    const color = pos.group === 'outfield' ? 0x69db7c : 0xffd43b;
    marks.push(F.marker(at.x, at.z, color, 2.4));
    const tag = F.nameTag(pos.emoji + ' ' + tr(pos.name), 'rgba(255,255,255,0.96)');
    tag.position.set(at.x, 2.6, at.z);
    tag.scale.set(3.0, 0.9, 1);
    scene.add(tag); marks.push(tag);
    moveSay(tr(pos.name));
    guideNilu(at);
    setCamTarget({ x: at.x, z: at.z });
    try { F.guideTo(at.x, at.z, 2.6); } catch (e) {}
    SWalk.freeze(false);
    SWalk.addSpot({ id: 'posStop', x: at.x, z: at.z, r: 2.8, once: true, onEnter: () => {
      if (!running || paused) return;
      sfx('yes'); clearMarks();
      say(pos.does, null, { emoji: pos.emoji });
      setTimeout(() => tourStep(i + 1), 3200 * speedMul());
    } });
  }

  /* ══════════════════════════════════════════════════════ 2 · THE AT-BAT
     A single pitch was over before a child could get a feel for it — now
     there are a few practice swings first (a new coach can rotate in each
     time), and only the LAST one carries on into dropping the bat and
     running the bases. */
  const BAT_REPS = 3;
  let batRep = 0;

  function startBatting() {
    if (!running) return;
    clearMarks();
    batRep = 0;
    say(C.posLesson.batIntro, null, { emoji: '🏏' });
    curBox = (SWalk.hand() === 'L') ? L.boxL : L.boxR;
    marks.push(F.marker(curBox.x, curBox.z, 0xffd43b, 1.6));
    marks.push(F.footprints(curBox.x, curBox.z, Math.PI));
    guideNilu(curBox);
    setCamTarget({ x: curBox.x, z: curBox.z });
    try { F.guideTo(curBox.x, curBox.z, 1.7); } catch (e) {}
    SWalk.freeze(false);
    SWalk.addSpot({ id: 'posStop', x: curBox.x, z: curBox.z, r: 1.9, once: true, onEnter: () => {
      if (!running || paused) return;
      sfx('yes'); clearMarks();
      SWalk.freeze(true);
      SWalk.helmet(true);
      SWalk.facing(L.circle.x, L.circle.z);
      SWalk.hold('bat');
      setTimeout(() => { if (running && !paused) doPitch(); }, 900 * speedMul());
    } });
  }

  /* a coach pose: arm swings forward once, timed with the ball leaving their hand */
  function pitchPose(co) {
    let t = 0;
    const arm = () => (co.hand === 'R' ? co.armR : co.armL);
    const other = () => (co.hand === 'R' ? co.armL : co.armR);
    co.pose = (P, dt) => {
      t += dt / speedMul();
      P.lean.rotation.x = 0; P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      if (t < 0.5) { other().rotation.x = -1.2; arm().rotation.x = 0.8; }
      else { const k = Math.min(1, (t - 0.5) / 0.4); arm().rotation.x = 0.8 - k * 2.2; other().rotation.x = -1.2 + k * 1.3; }
    };
  }

  /* a different coach can pitch every rep — Coach AJ, Scott and Sam all take turns */
  function doPitch() {
    if (!running) return;
    try { LV().cueStep(batRep + 1, BAT_REPS); } catch (e) {}
    const ids = ['aj', 'scott', 'sam'];
    pitchCoachId = ids[Math.floor(Math.random() * ids.length)];
    const co = F.coaches && F.coaches[pitchCoachId];
    if (co) { co.pose = null; co.goTo(L.circle.x, L.circle.z, () => co.lookAt(curBox.x, curBox.z)); }
    setTimeout(() => {
      if (!running || paused) return;
      say(C.posLesson.pitchReady, { coach: co ? co.info.name : '' }, { emoji: '🧢' });
    }, 900 * speedMul());
    setTimeout(() => { if (running && !paused) launchPitch(co); }, 2600 * speedMul());
  }

  function launchPitch(co) {
    if (!running) return;
    if (co) pitchPose(co);
    const from = co ? { x: co.x, y: 0.9, z: co.z } : { x: L.circle.x, y: 0.9, z: L.circle.z };
    /* the pitcher is now "where we're looking toward" for camera purposes —
       whichever angle the child already had picked keeps applying here */
    setCamTarget({ x: from.x, z: from.z });
    flyBall(from, { x: curBox.x, y: 1.0, z: curBox.z }, { dur: 1.7, h: 1.3 });
    setTimeout(() => { if (co) co.pose = null; }, 1100 * speedMul());
    const swing = (C.drills.bat.steps.find((s) => s.id === 'swing')) || {};
    try { SBDrills.ask('🏏', tr(swing.do), tr(swing.show), onSwing); } catch (e) { onSwing(); }
    /* nothing can be missed — if the child doesn't tap, the swing happens anyway */
    setTimeout(() => { if (running && !paused) onSwing(); }, 3200 * speedMul());
  }

  let swung = false;
  function onSwing() {
    if (!running || swung) return;
    swung = true;
    try { SBDrills.hide(); } catch (e) {}
    sfx('star');
    record('hit');
    const box = curBox;
    SWalk.freeze(true);
    let t = 0;
    const left = SWalk.hand() === 'L';
    SWalk.setPose((me, dt) => {
      t += dt / speedMul();
      const k = Math.min(1, t / 0.55);
      me.lean.rotation.y = (left ? -1 : 1) * k * 2.3;
      me.lean.rotation.x = 0.1;
      me.legL.rotation.x = 0; me.legR.rotation.x = 0;
      me.armL.rotation.x = -1.15 + k * 0.5; me.armR.rotation.x = -1.15 + k * 0.5;
      me.armL.rotation.z = 0; me.armR.rotation.z = 0;
    });
    setTimeout(() => {
      if (!running) return;
      sfx('yes');
      batRep++;
      say(batRep < BAT_REPS ? C.posLesson.niceHitAgain : C.posLesson.niceHit, null, { emoji: '🎉' });
      const a = -0.55 + Math.random() * 1.1;
      const dist = 22 + Math.random() * 16;
      hitLanding = { x: Math.sin(a) * dist, z: -Math.cos(a) * dist };
      flyBall({ x: box.x, y: 1.0, z: box.z }, { x: hitLanding.x, y: 0.2, z: hitLanding.z }, { h: 5.5, dur: 1.9 });
    }, 560 * speedMul());
    setTimeout(() => {
      if (!running) return;
      SWalk.setPose(null);
      const rig = SWalk.rig(); if (rig) rig.lean.rotation.y = 0;
      if (batRep < BAT_REPS) {
        swung = false;
        setTimeout(() => { if (running && !paused) doPitch(); }, 1400 * speedMul());
      } else {
        afterHit();
      }
    }, 2000 * speedMul());
  }

  /* ══════════════════════════════════════════════════════ 3 · THE CALL */
  function afterHit() {
    if (!running) return;
    try { LV().cueStep(0, 0); } catch (e) {}
    const drop = (C.drills.drop.steps.find((s) => s.id === 'putdown')) || {};
    const go = () => {
      SWalk.hold(null); sfx('pop');
      setTimeout(runToFirst, 700 * speedMul());
    };
    try { SBDrills.ask('👇', tr(drop.do), tr(drop.show), go); } catch (e) { go(); }
  }

  function throughFirst() {
    const d = Math.hypot(L.first.x, L.first.z) || 1;
    return { x: L.first.x * (1 + 3.4 / d), z: L.first.z * (1 + 3.4 / d) };
  }

  function runToFirst() {
    if (!running) return;
    moveSay(posName('1b'));
    const target = throughFirst();
    clearMarks();
    marks.push(F.marker(target.x, target.z, 0x69db7c, 2.4));
    guideNilu(target);
    setCamTarget({ x: target.x, z: target.z });
    try { F.guideTo(target.x, target.z, 2.6); } catch (e) {}
    SWalk.freeze(false);
    SWalk.addSpot({ id: 'posStop', x: target.x, z: target.z, r: 2.8, once: true, onEnter: () => {
      if (!running || paused) return;
      sfx('yes'); clearMarks();
      decideAtFirst();
    } });
  }

  /* the moment the user asked for: watch the ball, then a real (random) call */
  function decideAtFirst() {
    if (!running) return;
    say(C.posLesson.watchBall, null, { emoji: '👀' });
    const mate = (F.mates || [])[0];
    const landing = hitLanding || { x: 20, z: -20 };
    if (mate) { mate.pose = null; mate.goTo(landing.x, landing.z, () => {}); }

    const roll = Math.random();
    const outcome = roll < 0.5 ? 'stay' : (roll < 0.85 ? 'second' : 'home');
    setTimeout(() => {
      if (!running) return;
      if (outcome === 'stay') {
        if (mate) {
          mate.pose = (P) => { P.armL.rotation.x = -1.2; P.armR.rotation.x = -1.2; P.legL.rotation.x = 0; P.legR.rotation.x = 0; };
          flyBall({ x: landing.x, y: 1.2, z: landing.z }, { x: L.home.x, y: 1.0, z: L.home.z },
            { dur: 1.2, h: 2.2, done: () => { if (mate) mate.pose = null; } });
        }
        setTimeout(() => { if (running) { say(C.posLesson.stayFirst, null, { emoji: '✅' }); setTimeout(() => endRound('stay'), 1800 * speedMul()); } }, 1400 * speedMul());
      } else if (outcome === 'second') {
        setTimeout(() => { if (running) { say(C.posLesson.goSecond, null, { emoji: '⚡' }); runToSecond(); } }, 400 * speedMul());
      } else {
        setTimeout(() => { if (running) { say(C.posLesson.goHome, null, { emoji: '🏆' }); runAllTheWay(); } }, 400 * speedMul());
      }
    }, 1800 * speedMul());
  }

  function runToSecond() {
    if (!running) return;
    clearMarks();
    moveSay(posName('2b'));
    guideNilu(L.second);
    setCamTarget({ x: L.second.x, z: L.second.z });
    marks.push(F.marker(L.second.x, L.second.z, 0x69db7c, 2.4));
    try { F.guideTo(L.second.x, L.second.z, 2.6); } catch (e) {}
    SWalk.freeze(false);
    SWalk.addSpot({ id: 'posStop', x: L.second.x, z: L.second.z, r: 2.8, once: true, onEnter: () => {
      if (!running || paused) return;
      sfx('yes'); clearMarks();
      say(C.posLesson.safeSecond, null, { emoji: '✅' });
      setTimeout(() => endRound('second'), 1800 * speedMul());
    } });
  }

  function runAllTheWay() {
    if (!running) return;
    const route = [L.second, L.third, L.home];
    const names = [posName('2b'), posName('3b'), HOME_NAME()];
    let i = 0;
    const hop = () => {
      if (!running) return;
      clearMarks();
      if (i >= route.length) {
        say(C.posLesson.scoredHome, null, { emoji: '🏆' });
        setTimeout(() => endRound('home'), 1800 * speedMul());
        return;
      }
      const p = route[i], name = names[i]; i++;
      moveSay(name);
      guideNilu(p);
      setCamTarget({ x: p.x, z: p.z });
      marks.push(F.marker(p.x, p.z, 0x69db7c, 2.4));
      try { F.guideTo(p.x, p.z, 2.6); } catch (e) {}
      SWalk.addSpot({ id: 'posStop', x: p.x, z: p.z, r: 2.8, once: true, onEnter: () => {
        if (!running || paused) return;
        sfx('yes'); hop();
      } });
    };
    hop();
  }

  function endRound(outcome) {
    if (!running) return;
    clearMarks(); clearBalls();
    SWalk.freeze(true);
    try { SWalk.lockCam(null); } catch (e) {}
    hideCamBtn();
    try { F.confetti(SWalk.pos.x, 2.6, SWalk.pos.z, 36); } catch (e) {}
    sfx('star');
    const title = outcome === 'home' ? C.posLesson.scoredHome
      : outcome === 'second' ? C.posLesson.safeSecond : C.posLesson.stayFirst;
    try {
      const item = (C.album.items || []).find((it) => it.id === 'posplay');
      if (item) LV().sticker('posplay', tr(item.name));
    } catch (e) {}
    try { K.streakBump && K.streakBump(); } catch (e) {}
    say(C.aj.proud, null, { emoji: '🧢' });
    setTimeout(() => {
      if (!running) return;
      try { SWalk.showCard('🎉', tr(title), tr(C.posLesson.playAgain), { sticky: true, btn: tr(C.ui.yay), onDone: finish }); }
      catch (e) { finish(); }
    }, 1600 * speedMul());
  }

  /* ══════════════════════════════════════════════════════════════ lifecycle */
  function ready() {
    C = window.SBContent; F = window.SBField; L = F && F.L;
    THREE = F && F.three(); scene = F && F.scene();
    return !!(C && F && scene && window.SWalk && window.SBLevels);
  }

  S.open = function () {
    if (running) return;
    if (!ready() || !SWalk.started()) return;
    sfx('tap');
    /* treat this like switching to a temporary level: stop whatever else was
       active, exactly like goToLevel() does — the child can always pick their
       drill back up from the schedule strip afterward */
    try { window.SBGear && SBGear.leave && SBGear.leave(); } catch (e) {}
    try { window.SBDrills && SBDrills.leave && SBDrills.leave(); } catch (e) {}
    try { window.SBTeam && SBTeam.leave && SBTeam.leave(); } catch (e) {}
    try { window.SBGame && SBGame.leave && SBGame.leave(); } catch (e) {}
    try { SWalk.clearSpots(); } catch (e) {}
    running = true; paused = false; swung = false;
    curBox = null; hitLanding = null; pitchCoachId = null;
    camIdx = 0; curTarget = null;
    clearMarks(); clearBalls();
    startTour();
  };

  function finish() {
    running = false;
    clearMarks(); clearBalls();
    try { SBDrills.hide(); } catch (e) {}
    hideCamBtn();
    try { SWalk.lockCam(null); } catch (e) {}
    SWalk.freeze(false);
    SWalk.setPose(null);
    SWalk.hold(null);
    SWalk.helmet(false);
    if (pitchCoachId) {
      const co = F.coaches && F.coaches[pitchCoachId];
      if (co) { co.pose = null; if (co.home) co.goTo(co.home.x, co.home.z); }
    }
    pitchCoachId = null;
  }

  S.leave = function () {
    running = false;
    clearMarks(); clearBalls();
    try { SBDrills.hide(); } catch (e) {}
    hideCamBtn();
    try { SWalk.removeSpot('posStop'); } catch (e) {}
    try { SWalk.setPose(null); SWalk.hold(null); SWalk.freeze(false); SWalk.helmet(false); SWalk.lockCam(null); } catch (e) {}
    if (pitchCoachId) { const co = F.coaches && F.coaches[pitchCoachId]; if (co) co.pose = null; }
    pitchCoachId = null;
  };
  S.suspend = function () {
    if (!running) return;
    paused = true;
    try { SBDrills.hide(); } catch (e) {}
    hideCamBtn();
    try { SWalk.lockCam(null); } catch (e) {}
    for (const m of marks) m.visible = false;
  };
  S.resume = function () {
    if (!running) return;
    paused = false;
    for (const m of marks) m.visible = true;
    /* bring the camera picker back and re-apply wherever it was pointed —
       a raised hand shouldn't cost the child their chosen view for the rest
       of the round */
    if (curTarget) { showCamBtn(); applyCamAngle(); }
  };
  S.tick = function (dt) {
    if (!running) return;
    ballTick(dt);
  };
  /* lets goToLevel() (and the once-per-session onboarding flow that calls it
     on a delay after Play) know not to barge in on a round already underway */
  S.isRunning = () => running;

  window.SBPositions = S;
})();
