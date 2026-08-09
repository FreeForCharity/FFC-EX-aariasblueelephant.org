/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — GAME DAY  (window.SBGame)

   The last level, and the only one that puts everything together:

     1 · POSITIONS   Coach AJ calls a position by name; that spot lights up
                     out on the field; you walk to it and get set. Three
                     different positions, so it is finding-your-spot, not
                     memorising one.
     2 · IN THE FIELD  a ball comes to you where you are standing. Get it.
     3 · AT BAT      helmet, box, swing, run to first — everything Coach Sam
                     taught, now with the whole team watching.
     4 · MEDAL       the team lines up, the crowd is loud, and Coach AJ hands
                     out a Regionals medal with your name on it.

   Still no timers, no score and no outs. You cannot lose a game here; you can
   only finish one. Every word comes from content.js.
   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const S = {};
  let K = window.ABEKit || {};
  let THREE = null, scene = null, C = null, L = null, F = null;

  const tr = (o) => { try { return (o && typeof o === 'object') ? K.tr(o.en, o.es) : (o || ''); } catch (e) { return (o && o.en) || ''; } };
  const sfx = (n) => { try { K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} };
  const calm = () => { try { return !!(K.calm && K.calm()); } catch (e) { return false; } };
  const speedMul = () => { try { const s = Number(K.speed()); return (s >= 0.4 && s <= 3) ? s : 1; } catch (e) { return 1; } };
  const record = (kind, extra) => { try { K.recordEvent && K.recordEvent(kind, extra); } catch (e) {} };
  const LV = () => window.SBLevels;
  const say = (line, vars, opts) => { try { return LV().speak(line, vars, opts); } catch (e) { return ''; } };

  let running = false, paused = false;
  let marks = [], balls = [];
  let clock = 0, phase = '', posIdx = 0;
  let picked = [];

  function ready() {
    C = window.SBContent; F = window.SBField; L = F && F.L;
    THREE = F && F.three(); scene = F && F.scene();
    return !!(C && F && scene && window.SWalk);
  }
  function clearMarks() {
    for (const m of marks) { try { F.discard(m); } catch (e) {} }
    marks = [];
    try { F.guideOff(); } catch (e) {}   // never outlive the mark it points at
  }
  function clearBalls() {
    for (const b of balls) { try { F.discard(b.m); } catch (e) {} }
    balls = [];
  }

  /* a ball that flies (or rolls) and can be caught by walking into it */
  function ball(from, to, opts) {
    opts = opts || {};
    const m = F.makeBall(0.16);
    m.position.set(from.x, from.y != null ? from.y : 1.2, from.z);
    scene.add(m);
    balls.push({
      m: m, t: 0, dur: Math.max(0.5, (opts.dur || 1.6) * speedMul()),
      a: { x: from.x, y: from.y != null ? from.y : 1.2, z: from.z },
      b: { x: to.x, y: to.y != null ? to.y : 0.16, z: to.z },
      h: opts.h != null ? opts.h : 3.0, grab: opts.grab || null, r: opts.r || 1.7,
      done: opts.done || null,
    });
    return m;
  }
  function ballTick(dt) {
    const me = SWalk.pos;
    for (let i = balls.length - 1; i >= 0; i--) {
      const f = balls[i];
      if (f.grab && Math.hypot(me.x - f.m.position.x, me.z - f.m.position.z) < f.r) {
        const g = f.grab; f.grab = null;
        F.discard(f.m); balls.splice(i, 1);
        try { g(); } catch (e) {}
        continue;
      }
      if (f.t >= f.dur) { f.m.rotation.x += dt; continue; }   // parked, still catchable
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      f.m.position.set(
        f.a.x + (f.b.x - f.a.x) * k,
        f.a.y + (f.b.y - f.a.y) * k + Math.sin(k * Math.PI) * f.h,
        f.a.z + (f.b.z - f.a.z) * k);
      f.m.rotation.x += dt * 9;
      if (k >= 1 && !f.grab) {
        F.discard(f.m); balls.splice(i, 1);
        if (f.done) { try { f.done(); } catch (e) {} }
      } else if (k >= 1 && f.done) { try { f.done(); } catch (e) {} f.done = null; }
    }
  }

  /* ═══════════════════════════════════════════════════ 1 · POSITIONS */
  function startPositions() {
    phase = 'positions';
    posIdx = 0;
    /* three positions, always including one infield and one outfield so it is
       genuinely "find the spot", not "stand where you stood last time" */
    const all = C.positions.slice();
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = all[i]; all[i] = all[j]; all[j] = t;
    }
    picked = all.slice(0, 3);
    say(C.gameDay.intro, null, { emoji: '🏆' });
    setTimeout(nextPosition, 3400 * speedMul());
  }

  function nextPosition() {
    if (!running) return;
    if (posIdx >= picked.length) return startFielding();
    const pos = picked[posIdx++];
    const at = L.pos[pos.id];
    if (!at) return nextPosition();
    clearMarks();

    const co = LV().aj();
    if (co) { co.pose = null; co.lookAt(SWalk.pos.x, SWalk.pos.z); try { co.pose = F.poses.point; } catch (e) {} }
    say(C.gameDay.posCall, { pos: tr(pos.name), where: tr(pos.where) }, { emoji: pos.emoji });

    const ring = F.marker(at.x, at.z, 0x69db7c, 2.4);
    marks.push(ring);
    const tag = F.nameTag(pos.emoji + ' ' + tr(pos.name), 'rgba(255,255,255,0.96)');
    tag.position.set(at.x, 2.6, at.z);
    tag.scale.set(3.0, 0.9, 1);
    scene.add(tag); marks.push(tag);

    SWalk.freeze(false);
    try { F.guideTo(at.x, at.z, 2.4); } catch (e) {}
    SWalk.addSpot({ id: 'gamePos', x: at.x, z: at.z, r: 2.6, once: true, onEnter: () => {
      if (!running || paused) return;
      sfx('yes');
      if (co) co.pose = null;
      say(C.gameDay.posGood, null, { emoji: '✅' });
      clearMarks();
      setTimeout(nextPosition, 2800 * speedMul());
    } });
  }

  /* ═══════════════════════════════════════════════ 2 · A BALL COMES TO YOU */
  function startFielding() {
    if (!running) return;
    phase = 'fielding';
    clearMarks();
    say(C.gameDay.inField, null, { emoji: '🧤' });
    const me = SWalk.pos;
    const to = { x: me.x + (Math.random() - 0.5) * 5, z: me.z + 2 + Math.random() * 3 };
    const from = { x: L.home.x, y: 1.2, z: L.home.z };
    try { SBDrills.frameFollow(from, to, 7); } catch (e) {}
    setTimeout(() => {
      if (!running || paused) return;
      sfx('pop');
      const mk = F.marker(to.x, to.z, 0x69db7c, 1.6);
      marks.push(mk);
      ball(from, to, {
        dur: 2.2, h: 4.0, r: 1.7,
        grab: () => {
          if (!running) return;
          sfx('star');
          record('throw');
          SWalk.hold('ball');
          clearMarks();
          say(C.drills.field.praise[3], null, { emoji: '🎉' });
          setTimeout(() => { SWalk.hold(null); startAtBat(); }, 3200 * speedMul());
        },
        done: () => { if (running && !paused) say(C.nilu.thisWay, null, { emoji: '🐘' }); },
      });
    }, 2200 * speedMul());
  }

  /* ═════════════════════════════════════════════════════════ 3 · AT BAT */
  function startAtBat() {
    if (!running) return;
    phase = 'atbat';
    clearMarks();
    clearBalls();
    say(C.gameDay.atBat, null, { emoji: '🏏' });
    /* the whole team comes to watch from in front of the dugout */
    (F.mates || []).slice(0, 4).forEach((m, i) => {
      m.pose = null;
      m.goTo(L.lineUp[i].x, L.lineUp[i].z, () => m.lookAt(L.home.x, L.home.z));
    });
    const co = LV().aj();
    if (co) { co.pose = null; co.goTo(L.baseCoach.x, L.baseCoach.z, () => co.lookAt(L.home.x, L.home.z)); }

    const box = (SWalk.hand() === 'L') ? L.boxL : L.boxR;
    marks.push(F.marker(box.x, box.z, 0xffd43b, 1.6));
    marks.push(F.footprints(box.x, box.z, Math.PI));
    SWalk.freeze(false);
    SWalk.helmet(true);
    say(C.drills.bat.steps[3].do, null, { emoji: '🏏' });
    try { F.guideTo(box.x, box.z, 1.6); } catch (e) {}
    SWalk.addSpot({ id: 'gameBox', x: box.x, z: box.z, r: 1.8, once: true, onEnter: () => {
      if (!running || paused) return;
      SWalk.freeze(true);
      SWalk.facing(L.circle.x, L.circle.z);
      SWalk.hold('bat');
      clearMarks();
      say(C.gameDay.crowd, null, { emoji: '👏' });
      try {
        SBDrills.ask('🏏', tr(C.drills.bat.steps[5].do), tr(C.drills.bat.steps[5].show), doSwing);
      } catch (e) { doSwing(); }
    } });
  }

  function doSwing() {
    if (!running) return;
    record('hit');
    try { SBDrills.frameAction(SWalk.pos, L.circle, 4.0); } catch (e) {}
    const tee = F.props && F.props.tee;
    const teeBall = tee && tee.userData && tee.userData.ball;
    const left = SWalk.hand() === 'L';
    let t = 0;
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
      if (teeBall) teeBall.visible = false;
      sfx('star');
      const a = -0.5 + Math.random();
      const d = 26 + Math.random() * 14;
      ball({ x: L.tee.x, y: 1.0, z: L.tee.z },
           { x: Math.sin(a) * d, y: 0.2, z: -Math.cos(a) * d },
           { h: 6.5, dur: 2.2, done: () => { if (teeBall) teeBall.visible = true; } });
      say(C.drills.bat.praise[0], null, { emoji: '🥎' });
    }, 540 * speedMul());
    setTimeout(() => {
      if (!running) return;
      SWalk.setPose(null);
      const rig = SWalk.rig();
      if (rig) rig.lean.rotation.y = 0;
      SWalk.hold(null);
      runHome();
    }, 2100 * speedMul());
  }

  /* ── run it out: first, then all the way home, with the team cheering ── */
  function runHome() {
    if (!running) return;
    phase = 'running';
    const d = Math.hypot(L.first.x, L.first.z) || 1;
    const through = { x: L.first.x * (1 + 3.4 / d), z: L.first.z * (1 + 3.4 / d) };
    const route = [through, L.second, L.third, L.home];
    let i = 0;
    SWalk.freeze(false);
    const hop = () => {
      if (!running) return;
      clearMarks();
      if (i >= route.length) return medal();
      const p = route[i++];
      marks.push(F.marker(p.x, p.z, 0x69db7c, 2.4));
      try { SBDrills.frameFollow(SWalk.pos, p, 9); } catch (e) {}
      const step = C.drills.run.steps[Math.min(i - 1, C.drills.run.steps.length - 1)];
      say(step.do, null, { emoji: '🏃' });
      SWalk.addSpot({ id: 'gameRun', x: p.x, z: p.z, r: 2.6, once: true, onEnter: () => {
        if (!running || paused) return;
        sfx('yes');
        hop();
      } });
    };
    hop();
  }

  /* ═══════════════════════════════════════════════════════ 4 · THE MEDAL */
  function medal() {
    if (!running) return;
    phase = 'medal';
    clearMarks();
    clearBalls();
    SWalk.freeze(true);
    SWalk.teleport(L.home.x, L.home.z + 1.6, Math.PI);
    sfx('star');
    record('hit');
    say(C.drills.run.praise[3], null, { emoji: '🎉' });

    /* the whole team gathers round, arms up, and the crowd stands */
    const who = [];
    const co = LV().aj();
    if (co) { co.pose = null; co.goTo(L.home.x - 2.2, L.home.z + 1.4, () => co.lookAt(SWalk.pos.x, SWalk.pos.z)); who.push(co); }
    for (const id of ['scott', 'sam']) {
      const c2 = LV().coach(id);
      if (!c2) continue;
      c2.pose = null;
      c2.goTo(L.home.x + (id === 'sam' ? 2.4 : 3.8), L.home.z + 1.6, () => c2.lookAt(SWalk.pos.x, SWalk.pos.z));
      who.push(c2);
    }
    (F.mates || []).slice(0, 4).forEach((m, i) => {
      m.pose = null;
      m.goTo(L.home.x - 4.5 + i * 1.6, L.home.z + 3.6, () => m.lookAt(SWalk.pos.x, SWalk.pos.z));
      who.push(m);
    });
    try { F.waveFromStands(14); } catch (e) {}

    setTimeout(() => {
      if (!running) return;
      let t = 0;
      const up = (P, dt) => {
        t += dt / speedMul();
        const k = Math.min(1, t * 2.5) * (0.85 + Math.sin(t * 4) * 0.15);
        P.lean.rotation.x = 0; P.legL.rotation.x = 0; P.legR.rotation.x = 0;
        P.armL.rotation.x = -2.7 * k; P.armR.rotation.x = -2.7 * k;
        P.armL.rotation.z = 0; P.armR.rotation.z = 0;
      };
      for (const p of who) p.pose = up;
      sfx('star');
      say(C.team.cheer, null, { emoji: '💙' });
    }, 3200 * speedMul());

    /* the medal itself, hung on the child */
    setTimeout(() => {
      if (!running) return;
      hangMedal();
      sfx('star');
      say(C.gameDay.medal, null, { emoji: '🥇' });
      try {
        SWalk.showCard('🥇', tr(C.gameDay.medalTitle),
          LV().fill(tr(C.gameDay.medal)) + '\n' + tr(C.gameDay.medalSub), {
            sticky: true, btn: tr(C.ui.yay), onDone: finish,
          });
      } catch (e) { finish(); }
    }, 6200 * speedMul());
  }

  function hangMedal() {
    const rig = SWalk.rig();
    if (!rig || rig._medal) return;
    const g = new THREE.Group();
    const ribbon = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.028, 6, 20, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0x2f6fb5, emissive: 0x142a44 }));
    ribbon.position.y = 0.08;
    g.add(ribbon);
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.03, 18),
      new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x6e5a12 }));
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, -0.1, 0.02);
    g.add(disc);
    g.position.set(0, 0.95, 0.2);
    rig.lean.add(g);
    rig._medal = g;
  }

  function finish() {
    running = false;
    clearMarks();
    clearBalls();
    try { SBDrills.hide(); } catch (e) {}
    SWalk.freeze(false);
    for (const p of (F.people || [])) { p.pose = null; if (p.home) p.goTo(p.home.x, p.home.z); }
    try { LV().sticker('game', tr(C.gameDay.medalTitle)); } catch (e) {}
    try { K.streakBump && K.streakBump(); } catch (e) {}
    say(C.aj.proud, null, { emoji: '🧢' });
    try { LV().G.finished = 1; LV().save(); } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════ API */
  S.start = function () {
    if (!ready()) return false;
    running = true; paused = false;
    clearMarks(); clearBalls();
    startPositions();
    return true;
  };
  S.leave = function () {
    running = false;
    clearMarks(); clearBalls();
    try { SWalk.lockCam(null); } catch (e) {}
    try { SBDrills.hide(); } catch (e) {}
    try { SWalk.removeSpot('gamePos'); SWalk.removeSpot('gameBox'); SWalk.removeSpot('gameRun'); } catch (e) {}
    try { SWalk.setPose(null); SWalk.hold(null); SWalk.freeze(false); SWalk.helmet(false); } catch (e) {}
    for (const p of (F && F.people) || []) p.pose = null;
  };
  S.suspend = function () { paused = true; for (const m of marks) m.visible = false;
    try { SBDrills.hide(); } catch (e) {}
    try { SWalk.lockCam(null); } catch (e) {} };
  S.resume = function () { paused = false; for (const m of marks) m.visible = true; };
  S.tick = function (dt) {
    if (!running) return;
    clock += dt;
    ballTick(dt);
    for (const m of marks) {
      if (m.material && m.geometry && m.geometry.type === 'RingGeometry') {
        m.material.opacity = 0.55 + Math.sin(clock * 3) * 0.3;
      }
    }
  };
  S.state = () => ({ running: running, phase: phase, pos: posIdx, picked: picked.map((p) => p.id), balls: balls.length });

  window.SBGame = S;
})();
