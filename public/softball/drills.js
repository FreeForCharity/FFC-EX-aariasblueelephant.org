/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — THE SKILL STATIONS  (window.SBDrills)

   Every skill is taught the same way, because a predictable shape is the
   whole point:

        Nilu walks you there  →  the coach shows you  →  ONE step at a time
        →  you do it  →  the coach says something true and kind  →  again?

   A step is never a slideshow: each one has a real thing to do with the
   joystick or the one big button (#sbDo). Assist is ON by default — the
   timing window is enormous, the aim is magnetic, and nothing can be missed.
   A grown-up can tighten it per skill in Coach Mode.

   NO-FAIL PROMISES (please keep these if you edit)
     · no timers, no score, no red, no "wrong", no losing
     · a rep completes on EFFORT, not accuracy: a bad throw still lands, still
       gets praise, still counts
     · 🙋 works mid-step: suspend() parks the drill exactly here, resume() puts
       the same step back and re-says it
     · the child can walk away at any moment and come back to the same step

   All the words come from content.js — the coaches' file. The mechanics live
   here, so rewording a cue can never break a drill.
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
  const fill = (s, v) => { try { return LV().fill(s, v); } catch (e) { return s; } };

  /* ══════════════════════════════════════════════════════ the mechanics
     content.js owns the WORDS; this table owns what the child has to DO.
     Step ids here must match the step ids in C.drills[…].steps.
       walk  — go and stand on the footprints
       tap   — press the one big button
       arc   — draw the pitching circle with a finger (or hold+release)
       throw — the throw itself: ball leaves your hand and flies
       auto  — a beat that plays itself (a follow-through, a coach's catch) */
  const MECH = {
    throw: { grip: 'tap', point: 'tap', step: 'tap', elbow: 'tap', release: 'throw', follow: 'auto' },
    pitch: { rubber: { kind: 'walk', at: () => L.circle, r: 2.2 }, ready: 'tap', back: 'tap',
             circle: 'arc', release: 'auto', stepto: 'tap' },
    field: { ready: 'tap', watch: 'auto', move: 'catch', scoop: 'tap', stand: 'tap', throwfirst: 'throwFirst' },
    /* Batting: walk into the box, then SET the feet, then aim, then wait for the
       coach's GO, then swing. 'look' used to be 'auto' — it announced itself and
       moved on, so aiming was something the game said rather than something the
       child did. */
    bat:   { helmet: 'helmet', pickbat: 'takeBat', grip: 'tap',
             stance: { kind: 'walk', at: () => batBox(), r: 1.7 },
             feet: 'stance', look: 'tap', waitgo: 'waitCoach', swing: 'swing',
             drop: 'dropBat', run: { kind: 'walk', at: () => throughFirst(), r: 2.6 } },
    box:   { in1: { kind: 'walk', at: () => batBox(), r: 1.6 },
             out1: { kind: 'walk', at: () => boxOut(), r: 1.8 },
             wait: 'tap',
             in2: { kind: 'walk', at: () => batBox(), r: 1.6 } },
    drop:  { hold: 'takeBat', putdown: 'dropBat',
             run: { kind: 'walk', at: () => throughFirst(), r: 2.6 } },
    run:   { tofirst: { kind: 'walk', at: () => throughFirst(), r: 2.6 }, look: 'tap',
             tosecond: { kind: 'walk', at: () => L.second, r: 2.6 },
             tothird: { kind: 'walk', at: () => L.third, r: 2.6 },
             home: { kind: 'walk', at: () => L.home, r: 2.6 } },
  };

  /* handedness decides which batter's box is yours, and which way "out" is */
  function batBox() {
    return (SWalk.hand() === 'L') ? L.boxL : L.boxR;
  }
  function boxOut() {
    const s = (SWalk.hand() === 'L') ? 1 : -1;
    return { x: Math.abs(L.boxOut.x) * s, z: L.boxOut.z };
  }
  /* you run THROUGH first base, so the target is past it, not on it */
  function throughFirst() {
    const d = Math.hypot(L.first.x, L.first.z) || 1;
    return { x: L.first.x * (1 + 3.4 / d), z: L.first.z * (1 + 3.4 / d) };
  }

  /* where each drill happens: where the child stands, where the coach stands,
     and which way the ball travels */
  function station(id) {
    if (id === 'throw') {
      return { me: L.throwPlayer, coach: L.throwCoach, coachId: 'scott', faceCoach: true };
    }
    if (id === 'pitch') {
      return { me: L.pitchPlayer, coach: L.pitchCoach, coachId: 'sam', faceCoach: true };
    }
    if (id === 'field') {
      /* Coach Scott hits from beside home; the child works at shortstop */
      return { me: L.fieldPlayer, coach: L.fieldCoach, coachId: 'scott', faceCoach: true, cover: true };
    }
    if (id === 'bat' || id === 'box' || id === 'drop') {
      return { me: batBox(), coach: L.batCoach, coachId: 'sam', faceCoach: false };
    }
    if (id === 'run') {
      /* Coach AJ works the bases — that is where he actually stands */
      return { me: L.home, coach: L.baseCoach, coachId: 'aj', faceCoach: false };
    }
    return null;
  }

  /* ═══════════════════════════════════════════════════════════════ state */
  let running = false, paused = false, waiting = null;
  let cur = null;               // { id, def, st, coach, mate, stepIdx, reps }
  let marks = [];               // footprints / markers we put down
  let balls = [];               // balls in flight
  let clock = 0;
  let elDo = null;              // the one big button

  /* ═════════════════════════════════════════════════════ the big button */
  function buildButton() {
    if (elDo || !document.body) return;
    elDo = document.createElement('button');
    elDo.id = 'sbDo';
    elDo.style.display = 'none';
    elDo.innerHTML = '<span class="sbDoEmoji">🥎</span><span class="sbDoLbl"></span>';
    elDo.addEventListener('click', () => {
      if (!waiting || waiting.kind === 'walk') return;
      sfx('tap');
      const w = waiting;
      waiting = null;
      hideButton();
      try { w.go(); } catch (e) {}
    });
    document.body.appendChild(elDo);
  }
  function showButton(emoji, label, title) {
    buildButton();
    if (!elDo) return;
    elDo.querySelector('.sbDoEmoji').textContent = emoji || '🥎';
    elDo.querySelector('.sbDoLbl').textContent = label || '';
    elDo.title = title || label || '';
    elDo.setAttribute('aria-label', elDo.title);
    elDo.style.display = 'flex';
    elDo.classList.remove('pop'); void elDo.offsetWidth; elDo.classList.add('pop');
  }
  function hideButton() { if (elDo) elDo.style.display = 'none'; }

  /* ══════════════════════════════════════════════════ FRAME THE ACTION
     A throw across twelve metres, watched from behind the child at full zoom,
     is two dots and a speck. For the moment that actually matters — the ball
     leaving a hand and arriving in a glove — the camera swings side-on to the
     line of the throw and comes in close enough to read it, then hands control
     straight back.

     Side-on is deliberate: from behind, a ball thrown away from you barely
     moves on screen. From the side you see the whole arc. */
  function frameAction(a, b, secs, then) {
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;          // perpendicular to the throw
    const t1 = Math.atan2(px, pz), t2 = Math.atan2(-px, -pz);
    let cur = 0;
    try { cur = SWalk.camTheta(); } catch (e) {}
    const off = (t) => { let d = t - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };
    /* whichever side is closer to where they were already looking, so the
       world never spins round underneath them */
    const theta = off(t1) <= off(t2) ? t1 : t2;
    try {
      SWalk.lockCam({ x: mx, y: 1.35, z: mz, theta: theta, phi: 1.0,
                      radius: Math.max(8.5, Math.min(len * 1.15 + 4.5, 20)) });
    } catch (e) {}
    setTimeout(() => {
      try { SWalk.lockCam(null); } catch (e) {}
      if (then) { try { then(); } catch (e) {} }
    }, (secs || 3.4) * 1000 * speedMul());
  }
  S.frameAction = frameAction;

  /* For an action the child has to MOVE through — chasing a grounder, running
     the bases. Keeps following them, but swings side-on to what is happening
     and comes in close, so they can still walk while seeing it properly. */
  function frameFollow(a, b, secs, then) {
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;
    const t1 = Math.atan2(px, pz), t2 = Math.atan2(-px, -pz);
    let cur = 0;
    try { cur = SWalk.camTheta(); } catch (e) {}
    const off = (t) => { let d = t - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };
    try {
      SWalk.lockCam({ theta: off(t1) <= off(t2) ? t1 : t2, phi: 1.02,
                      radius: Math.max(9, Math.min(len * 0.85 + 5, 16)) });
    } catch (e) {}
    setTimeout(() => {
      try { SWalk.lockCam(null); } catch (e) {}
      if (then) { try { then(); } catch (e) {} }
    }, (secs || 5) * 1000 * speedMul());
  }
  S.frameFollow = frameFollow;

  /* ════════════════════════════════════════════════════ balls in flight */
  function flyBall(from, to, opts) {
    opts = opts || {};
    const b = F.makeBall(0.15);
    b.position.set(from.x, from.y != null ? from.y : 1.1, from.z);
    scene.add(b);
    balls.push({
      m: b, t: 0, dur: Math.max(0.3, (opts.dur || 1.0) * speedMul()),
      a: { x: from.x, y: from.y != null ? from.y : 1.1, z: from.z },
      b: { x: to.x, y: to.y != null ? to.y : 1.1, z: to.z },
      h: opts.h != null ? opts.h : 2.0,
      done: opts.done || null, spin: opts.spin != null ? opts.spin : 8,
    });
    return b;
  }
  function ballTick(dt) {
    const me = (window.SWalk && SWalk.pos) || { x: 0, z: 0 };
    for (let i = balls.length - 1; i >= 0; i--) {
      const f = balls[i];
      /* a rolling ball is catchable the whole way — and it never gets away:
         once it stops it just sits there waiting to be walked onto */
      if (f.grab && Math.hypot(me.x - f.m.position.x, me.z - f.m.position.z) < f.r) {
        const g = f.grab; f.grab = null;
        F.discard(f.m); balls.splice(i, 1);
        try { g(); } catch (e) {}
        continue;
      }
      if (f.roll && f.t >= f.dur) { f.m.rotation.x += dt * 1.2; continue; }   // parked, still catchable
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      f.m.position.set(
        f.a.x + (f.b.x - f.a.x) * k,
        f.a.y + (f.b.y - f.a.y) * k + Math.sin(k * Math.PI) * f.h,
        f.a.z + (f.b.z - f.a.z) * k);
      f.m.rotation.x += dt * f.spin;
      if (k >= 1) {
        if (f.roll && f.grab) { if (f.done) { try { f.done(); } catch (e) {} f.done = null; } continue; }
        F.discard(f.m);
        balls.splice(i, 1);
        if (f.done) { try { f.done(); } catch (e) {} }
      }
    }
  }
  /* a grounder: rolls along the grass, and the child can walk into it */
  function rollBall(from, to, opts) {
    opts = opts || {};
    const b = F.makeBall(0.16);
    b.position.set(from.x, 0.16, from.z);
    scene.add(b);
    balls.push({
      m: b, t: 0, dur: Math.max(0.6, (opts.dur || 2.6) * speedMul()),
      a: { x: from.x, y: 0.16, z: from.z }, b: { x: to.x, y: 0.16, z: to.z },
      h: 0, spin: 11, roll: true,
      grab: opts.grab || null, r: opts.r || 1.5,
      done: opts.done || null,
    });
    return b;
  }

  function clearBalls() {
    for (const f of balls) { try { F.discard(f.m); } catch (e) {} }
    balls.length = 0;
  }

  /* ════════════════════════════════════════════════════ markers on grass */
  function clearMarks() {
    for (const m of marks) { try { F.discard(m); } catch (e) {} }
    marks = [];
    /* the trail belongs to whatever mark it was pointing at — never outlive it */
    try { F.guideOff(); } catch (e) {}
  }
  function footprintsAt(x, z, ry, spread) {
    const g = F.footprints(x, z, ry || 0, spread);
    marks.push(g);
    return g;
  }
  function markerAt(x, z, color, r) {
    const m = F.marker(x, z, color, r);
    marks.push(m);
    return m;
  }

  /* ═══════════════════════════════════════════════ coach demonstrations
     The coach performs the motion before the child tries it. These are the
     same arm pivots the child's rig uses, so what they watch is what they
     are about to do. */
  function demoThrow(co, target, then) {
    let t = 0;
    const arm = () => (co.hand === 'R' ? co.armR : co.armL);
    const other = () => (co.hand === 'R' ? co.armL : co.armR);
    co.pose = (P, dt) => {
      t += dt / speedMul();
      P.lean.rotation.x = 0; P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      if (t < 0.9) {                       // point the glove
        other().rotation.x = -1.4; arm().rotation.x = 0.2;
      } else if (t < 1.8) {                // arm back, elbow up
        other().rotation.x = -1.2; arm().rotation.x = 1.5;
      } else if (t < 2.2) {                // through
        const k = (t - 1.8) / 0.4;
        arm().rotation.x = 1.5 - k * 3.0;
        other().rotation.x = -1.2 + k * 1.3;
      } else {                             // follow through
        arm().rotation.x = -1.5; other().rotation.x = 0.1;
      }
    };
    setTimeout(() => {
      if (!running) return;
      flyBall({ x: co.x, y: 1.5, z: co.z }, target, { h: 2.6, dur: 1.0 });
      sfx('pop');
    }, 2000 * speedMul());
    setTimeout(() => { if (!running) return; co.pose = null; if (then) then(); }, 3400 * speedMul());
  }

  function demoPitch(co, target, then) {
    let t = 0;
    const arm = () => (co.hand === 'R' ? co.armR : co.armL);
    co.pose = (P, dt) => {
      t += dt / speedMul();
      P.lean.rotation.x = 0; P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      if (t < 0.7) arm().rotation.x = 0.3;
      else if (t < 2.1) arm().rotation.x = 0.3 - ((t - 0.7) / 1.4) * (Math.PI * 2);  // one full circle
      else arm().rotation.x = 0.3;
      P.armL.rotation.z = 0; P.armR.rotation.z = 0;
    };
    setTimeout(() => {
      if (!running) return;
      flyBall({ x: co.x, y: 0.8, z: co.z }, target, { h: 1.1, dur: 1.2 });
      sfx('pop');
    }, 2100 * speedMul());
    setTimeout(() => { if (!running) return; co.pose = null; if (then) then(); }, 3500 * speedMul());
  }

  /* 🧤 ready position — feet apart, knees bent, glove down near the grass */
  function demoReady(co, target, then) {
    co.pose = (P) => {
      P.lean.rotation.x = 0.45;
      P.legL.rotation.x = -0.5; P.legR.rotation.x = -0.5;
      const g = P.gloveSide === 'L' ? P.armL : P.armR;
      const o = P.gloveSide === 'L' ? P.armR : P.armL;
      g.rotation.x = 0.75; g.rotation.z = 0;
      o.rotation.x = 0.6; o.rotation.z = 0;
      P.headG.rotation.x = -0.2; P.headG.rotation.z = 0;
    };
    setTimeout(() => { if (!running) return; co.pose = null; if (then) then(); }, 3200 * speedMul());
  }

  /* 🏏 a level swing, all the way around */
  function demoBatSwing(co, target, then) {
    let t = 0;
    co.pose = (P, dt) => {
      t += dt / speedMul();
      const k = t < 1.0 ? 0 : Math.min(1, (t - 1.0) / 0.6);
      P.lean.rotation.y = k * 2.2;
      P.lean.rotation.x = 0.1;
      P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      P.armL.rotation.x = -1.15 + k * 0.5; P.armL.rotation.z = 0;
      P.armR.rotation.x = -1.15 + k * 0.5; P.armR.rotation.z = 0;
    };
    setTimeout(() => { if (running) sfx('star'); }, 1600 * speedMul());
    setTimeout(() => {
      if (!running) return;
      co.pose = null; co.lean.rotation.y = 0;
      if (then) then();
    }, 3200 * speedMul());
  }

  /* 🏃 the coach points at the base you are running to */
  function demoPoint(co, target, then) {
    co.pose = (P) => {
      P.lean.rotation.x = 0; P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      P.armR.rotation.x = -1.45; P.armR.rotation.z = 0;
      P.armL.rotation.x = 0.1; P.armL.rotation.z = 0;
      P.headG.rotation.x = 0; P.headG.rotation.z = 0;
    };
    setTimeout(() => { if (!running) return; co.pose = null; if (then) then(); }, 3000 * speedMul());
  }

  const DEMO = {
    throw: demoThrow, pitch: demoPitch, field: demoReady,
    bat: demoBatSwing, box: null, drop: null, run: demoPoint,
  };

  /* the child's own motions, driven by SWalk.setPose */
  function playerThrowPose(then) {
    let t = 0;
    SWalk.setPose((me, dt) => {
      t += dt / speedMul();
      const arm = me.hand === 'R' ? me.armR : me.armL;
      const oth = me.hand === 'R' ? me.armL : me.armR;
      me.lean.rotation.x = 0; me.legL.rotation.x = 0; me.legR.rotation.x = 0;
      if (t < 0.45) { arm.rotation.x = 1.5; oth.rotation.x = -1.35; }
      else if (t < 0.8) {
        const k = (t - 0.45) / 0.35;
        arm.rotation.x = 1.5 - k * 3.0;
        oth.rotation.x = -1.35 + k * 1.45;
      } else { arm.rotation.x = -1.5; oth.rotation.x = 0.1; }
      arm.rotation.z = 0; oth.rotation.z = 0;
    });
    setTimeout(() => { if (then) then(); }, 500 * speedMul());
    setTimeout(() => { SWalk.setPose(null); }, 1700 * speedMul());
  }

  function playerPitchPose(then) {
    let t = 0;
    SWalk.setPose((me, dt) => {
      t += dt / speedMul();
      const arm = me.hand === 'R' ? me.armR : me.armL;
      me.lean.rotation.x = 0; me.legL.rotation.x = 0; me.legR.rotation.x = 0;
      if (t < 1.3) arm.rotation.x = 0.3 - (t / 1.3) * (Math.PI * 2);
      else arm.rotation.x = 0.3;
      me.armL.rotation.z = 0; me.armR.rotation.z = 0;
    });
    setTimeout(() => { if (then) then(); }, 1150 * speedMul());
    setTimeout(() => { SWalk.setPose(null); }, 1900 * speedMul());
  }

  /* ═════════════════════════════════════════════════════ the drill runner */
  function start(levelId) {
    C = window.SBContent; F = window.SBField; L = F && F.L;
    THREE = F && F.three(); scene = F && F.scene();
    if (!C || !F || !scene) return false;
    const def = C.drills[levelId];
    const st = station(levelId);
    if (!def || !st) return false;

    leave();
    running = true; paused = false;
    const coach = (F.coaches && F.coaches[st.coachId]) || null;
    cur = { id: levelId, def: def, st: st, coach: coach, stepIdx: -1, reps: LV().reps(levelId) };

    /* the coach walks to their drill spot; Nilu leads the child to theirs */
    if (coach) {
      coach.pose = null;
      coach.goTo(st.coach.x, st.coach.z, () => coach.lookAt(st.me.x, st.me.z));
    }
    if (st.cover && F.mates && F.mates.length) {
      const mate = F.mates[0];
      cur.cover = mate;
      mate.pose = null;
      mate.goTo(L.firstCover.x, L.firstCover.z, () => mate.lookAt(st.me.x, st.me.z));
    }
    footprintsAt(st.me.x, st.me.z, Math.atan2(st.coach.x - st.me.x, st.coach.z - st.me.z));
    markerAt(st.me.x, st.me.z, 0xffd43b, 1.5);

    /* Nilu waits BEHIND the child, on the far side from the coach, and well off
       to one side. The action camera swings side-on to the child→coach line, so
       "behind" alone was not enough: at 3.2 units she sat right on the lens and
       filled the screen — a batting turn you could not see past. Further back,
       and stepped sideways out of the sight-line. */
    const N = F.nilu;
    if (N) {
      const bx = st.me.x - st.coach.x, bz = st.me.z - st.coach.z;
      const bl = Math.hypot(bx, bz) || 1;
      const ux = bx / bl, uz = bz / bl;
      const px = -uz, pz = ux;                     // sideways, out of the shot
      const spot = F.freeSpot(st.me.x + ux * 5.6 + px * 3.4,
                              st.me.z + uz * 5.6 + pz * 3.4, 1.1);
      N.goTo(spot.x, spot.z,
        () => { try { N.lookAt(SWalk.pos.x, SWalk.pos.z); } catch (e) {} });
    }

    say(C.nilu.followMe, null, { emoji: '🐘' });
    setTimeout(() => {
      if (!running) return;
      say(C.drillUI.standHere, null, { emoji: '👣' });
    }, 2600 * speedMul());

    /* wait for them to arrive — no rush, no timer */
    const arrive = () => { try { F.guideOff(); } catch (e) {} if (running && !paused) intro(); };
    if (SWalk.at(st.me, 3.2)) setTimeout(arrive, 1200 * speedMul());
    else {
      try { F.guideTo(st.me.x, st.me.z, 1.5); } catch (e) {}
      SWalk.addSpot({ id: 'drillStand', x: st.me.x, z: st.me.z, r: 3.2, once: true, onEnter: arrive });
    }
    return true;
  }

  function intro() {
    if (!running || !cur) return;
    SWalk.removeSpot('drillStand');
    const co = cur.coach;
    if (cur.st.faceCoach) SWalk.facing(cur.st.coach.x, cur.st.coach.z);
    else if (cur.id === 'bat' || cur.id === 'box' || cur.id === 'drop') SWalk.facing(L.circle.x, L.circle.z);
    else if (cur.id === 'run') SWalk.facing(L.first.x, L.first.z);

    /* the coach says hello, then shows the whole motion once */
    if (co && co.info && co.info.greet && cur.reps === 0) {
      say(co.info.greet, null, { emoji: '🧢' });
    }
    setTimeout(() => {
      if (!running) return;
      say(cur.def.intro, null, { emoji: cur.def.emoji });
    }, (cur.reps === 0 ? 4200 : 300) * speedMul());

    setTimeout(() => {
      if (!running) return;
      SWalk.freeze(true);
      const demo = DEMO[cur.id];
      if (co && demo) {
        say(C.nilu.watchCoach, { coach: co.info.name }, { emoji: '🐘' });
        const target = cur.id === 'pitch' ? { x: L.home.x, y: 0.4, z: L.home.z } : cur.st.me;
        /* watch the coach from the side, close enough to see what they do */
        frameAction({ x: co.x, z: co.z }, { x: target.x, z: target.z }, 3.6);
        demo(co, target, () => {
          SWalk.freeze(false);
          say(C.nilu.yourTurn, null, { emoji: '🐘' });
          nextStep(0);
        });
      } else {
        SWalk.freeze(false);
        nextStep(0);
      }
    }, (cur.reps === 0 ? 8200 : 3200) * speedMul());
  }

  function nextStep(i) {
    if (!running || !cur) return;
    /* The child can always walk. The stick is never a dead control — only the
       coach's demonstration holds them still, and only for a moment. */
    SWalk.freeze(false);
    const steps = cur.def.steps;
    if (i >= steps.length) return finishRep();
    cur.stepIdx = i;
    const step = steps[i];
    const raw = (MECH[cur.id] || {})[step.id] || 'tap';
    const mech = (typeof raw === 'string') ? raw : raw.kind;
    const spec = (typeof raw === 'string') ? {} : raw;

    /* pass the coach's name so a step line can say "wait for Coach Sam" rather
       than printing a literal {coach} */
    say(step.do, { coach: (cur.coach && cur.coach.info && cur.coach.info.name) || '' },
        { emoji: cur.def.emoji });
    try { LV().cueStep(i + 1, steps.length); } catch (e) {}

    if (mech === 'walk') {
      SWalk.freeze(false);
      const at = spec.at ? spec.at() : cur.st.me;
      const r = spec.r || 2.0;
      markerAt(at.x, at.z, 0xffd43b, Math.max(1.2, r * 0.85));
      /* a long run round the bases reads much better side-on and close in */
      if (Math.hypot(at.x - SWalk.pos.x, at.z - SWalk.pos.z) > 6) frameFollow(SWalk.pos, at, 9);
      if (SWalk.at(at, r)) { setTimeout(() => { if (running && !paused) nextStep(i + 1); }, 900 * speedMul()); return; }
      try { F.guideTo(at.x, at.z, r); } catch (e) {}
      SWalk.addSpot({ id: 'drillStep', x: at.x, z: at.z, r: r, once: true,
        onEnter: () => { try { F.guideOff(); } catch (e) {} if (running && !paused) nextStep(i + 1); } });
      return;
    }

    /* ⛑️ the helmet gate: the bat literally will not come out without it */
    if (mech === 'helmet') {
      showButton('⛑️', tr(step.do), fill(tr(step.show)));
      waiting = { kind: 'tap', go: () => {
        SWalk.helmet(true); sfx('yes');
        setTimeout(() => { if (running && !paused) nextStep(i + 1); }, 1200 * speedMul());
      } };
      return;
    }
    if (mech === 'takeBat') {
      showButton('🏏', tr(step.do), fill(tr(step.show)));
      waiting = { kind: 'tap', go: () => {
        if (!SWalk.hasHelmet()) {            // can't happen in order, but never let it
          say(C.safety[0].rule, null, { emoji: '⛑️' });
          SWalk.helmet(true);
        }
        SWalk.hold('bat'); sfx('pop');
        setTimeout(() => { if (running && !paused) nextStep(i + 1); }, 1200 * speedMul());
      } };
      return;
    }
    if (mech === 'dropBat') {
      showButton('👇', tr(step.do), fill(tr(step.show)));
      waiting = { kind: 'tap', go: () => {
        SWalk.hold(null); sfx('pop');
        setTimeout(() => { if (running && !paused) nextStep(i + 1); }, 1000 * speedMul());
      } };
      return;
    }
    /* 👣 SET YOUR FEET — the stance. Two marks appear where the feet go, wide
       apart and square to the plate, and the child's body holds the stance once
       they tap. Standing in the box and standing READY are different things. */
    if (mech === 'stance') {
      const me = SWalk.pos;
      const toPlate = Math.atan2(L.home.x - me.x, L.home.z - me.z);
      footprintsAt(me.x, me.z, toPlate, 2.1);
      say(C.drillUI.feetOn, null, { emoji: '👣' });
      showButton('👣', tr(step.do), fill(tr(step.show)));
      waiting = { kind: 'tap', go: () => {
        sfx('yes');
        battingStance();
        setTimeout(() => { if (running && !paused) nextStep(i + 1); }, 1500 * speedMul());
      } };
      return;
    }

    /* ✋ WAIT FOR THE COACH. Deliberately has NO button: the only thing to do is
       stand still and watch, which is the thing itself. The coach raises a hand,
       holds it, then calls GO — and the game moves on by itself, so waiting can
       never be failed. */
    if (mech === 'waitCoach') {
      hideButton();
      battingStance();
      const co = cur.coach;
      if (co) {
        try { co.pose = 'callOver'; } catch (e) {}
        try { co.lookAt(SWalk.pos.x, SWalk.pos.z); } catch (e) {}
      }
      say(C.drillUI.getReady, { coach: (co && co.info && co.info.name) || '' }, { emoji: '✋' });
      setTimeout(() => {
        if (!running || paused) return;
        say(C.drillUI.goNow, null, { emoji: '🟢' });
        sfx('star');
        if (co) { try { co.pose = null; } catch (e) {} }
        setTimeout(() => { if (running && !paused) nextStep(i + 1); }, 1100 * speedMul());
      }, 2400 * speedMul());
      return;
    }

    if (mech === 'swing') {
      showButton('🏏', tr(step.do), fill(tr(step.show)));
      waiting = { kind: 'tap', go: () => doSwing(i) };
      return;
    }
    if (mech === 'throwFirst') {
      showButton('🥎', tr(step.do), fill(tr(step.show)));
      waiting = { kind: 'tap', go: () => doThrowFirst(i) };
      return;
    }
    if (mech === 'catch') {
      hitGrounder(i);
      return;
    }

    if (mech === 'auto') {
      setTimeout(() => { if (running && !paused) nextStep(i + 1); }, 2000 * speedMul());
      return;
    }

    if (mech === 'arc') {
      showButton('➰', tr(step.do), tr(step.do));
      /* two ways in, because one of them will suit this child:
         swipe the circle on the field, OR just press the big button */
      SWalk.awaitArc((sweep) => {
        if (!running || paused || !waiting) return;
        waiting = null; hideButton(); SWalk.cancelArc();
        doArc(i);
      });
      waiting = { kind: 'arc', go: () => { SWalk.cancelArc(); doArc(i); } };
      return;
    }

    if (mech === 'throw') {
      showButton('🥎', tr(step.do), tr(step.do));
      waiting = { kind: 'throw', go: () => doThrow(i) };
      return;
    }

    /* plain 'tap': the big button, with the coach's own words on it */
    showButton(cur.def.emoji, tr(step.do), fill(tr(step.show)));
    waiting = { kind: 'tap', go: () => {
      posePreview(step.id);
      setTimeout(() => { if (running && !paused) nextStep(i + 1); }, 1200 * speedMul());
    } };
  }

  /* The batting stance, held: feet apart and splayed, knees soft, turned side-on
     to the plate, bat up by the shoulder. Held (not a one-shot animation) so it
     is still there while they aim and while they wait for the coach. */
  function battingStance() {
    const left = SWalk.hand() === 'L';
    SWalk.setPose((me) => {
      me.lean.rotation.y = (left ? -0.35 : 0.35);
      me.lean.rotation.x = 0.13;
      /* feet apart: splay at the hip, and stagger one foot slightly back */
      me.legL.rotation.z = 0.2; me.legR.rotation.z = -0.2;
      me.legL.rotation.x = 0.1; me.legR.rotation.x = -0.1;
      /* both hands up by the back shoulder, where a bat is actually held */
      me.armL.rotation.x = -1.45; me.armL.rotation.z = (left ? -0.3 : 0.3);
      me.armR.rotation.x = -1.45; me.armR.rotation.z = (left ? -0.3 : 0.3);
    });
  }

  /* a small held pose so a "tap" step still LOOKS like the body doing it */
  function posePreview(stepId) {
    const hold = (fn, ms) => {
      SWalk.setPose(fn);
      setTimeout(() => SWalk.setPose(null), (ms || 1400) * speedMul());
    };
    if (stepId === 'grip' || stepId === 'ready') { SWalk.hold('ball'); sfx('pop'); return; }
    if (stepId === 'point') {
      hold((me) => {
        const oth = me.hand === 'R' ? me.armL : me.armR;
        const arm = me.hand === 'R' ? me.armR : me.armL;
        me.legL.rotation.x = 0; me.legR.rotation.x = 0; me.lean.rotation.x = 0;
        oth.rotation.x = -1.4; oth.rotation.z = 0; arm.rotation.x = 0.2; arm.rotation.z = 0;
      });
      return;
    }
    if (stepId === 'step' || stepId === 'stepto') {
      hold((me) => {
        const front = me.hand === 'R' ? me.legL : me.legR;
        const back = me.hand === 'R' ? me.legR : me.legL;
        front.rotation.x = -0.55; back.rotation.x = 0.25; me.lean.rotation.x = 0.1;
      });
      return;
    }
    if (stepId === 'elbow' || stepId === 'back') {
      hold((me) => {
        const arm = me.hand === 'R' ? me.armR : me.armL;
        const oth = me.hand === 'R' ? me.armL : me.armR;
        me.legL.rotation.x = 0; me.legR.rotation.x = 0; me.lean.rotation.x = 0;
        arm.rotation.x = 1.5; arm.rotation.z = 0; oth.rotation.x = -1.3; oth.rotation.z = 0;
      });
      return;
    }
    sfx('pop');
  }

  /* ── the throw itself ─────────────────────────────────────────────────── */
  function doThrow(i) {
    const co = cur.coach;
    const to = co ? { x: co.x, y: 1.4, z: co.z } : { x: cur.st.coach.x, y: 1.4, z: cur.st.coach.z };
    record('throw');
    /* hold still and watch it — the whole beat is about four seconds */
    SWalk.freeze(true);
    frameAction(SWalk.pos, to, 4.6, () => SWalk.freeze(false));
    playerThrowPose(() => {
      SWalk.hold(null);
      const p = SWalk.pos;
      flyBall({ x: p.x, y: 1.4, z: p.z }, to, {
        h: 2.4, dur: 1.0,
        done: () => {
          sfx('yes');
          if (co) {
            /* the coach catches it, then tosses it straight back */
            co.pose = (P) => {
              P.legL.rotation.x = 0; P.legR.rotation.x = 0; P.lean.rotation.x = 0;
              const g = P.gloveSide === 'L' ? P.armL : P.armR;
              g.rotation.x = -1.5; g.rotation.z = 0;
              (P.gloveSide === 'L' ? P.armR : P.armL).rotation.x = 0.1;
            };
            setTimeout(() => {
              if (!running) return;
              co.pose = null;
              flyBall({ x: co.x, y: 1.4, z: co.z }, { x: SWalk.pos.x, y: 1.3, z: SWalk.pos.z },
                { h: 2.2, dur: 1.0, done: () => { if (running) { SWalk.hold('ball'); sfx('pop'); } } });
            }, 1400 * speedMul());
          }
          if (running && !paused) nextStep(i + 1);
        },
      });
    });
  }

  /* ── the pitch: one big underhand circle ─────────────────────────────── */
  function doArc(i) {
    record('throw');
    const co0 = cur.coach;
    SWalk.freeze(true);
    frameAction(SWalk.pos, co0 ? { x: co0.x, z: co0.z } : L.home, 4.8, () => SWalk.freeze(false));
    playerPitchPose(() => {
      SWalk.hold(null);
      const p = SWalk.pos;
      const co = cur.coach;
      const to = co ? { x: co.x, y: 0.9, z: co.z } : { x: L.home.x, y: 0.5, z: L.home.z };
      flyBall({ x: p.x, y: 0.7, z: p.z }, to, {
        h: 1.2, dur: 1.3,
        done: () => {
          sfx('yes');
          if (co) {
            co.pose = (P) => {
              P.legL.rotation.x = -1.1; P.legR.rotation.x = -1.1; P.lean.rotation.x = 0.2;
              const g = P.gloveSide === 'L' ? P.armL : P.armR;
              g.rotation.x = -0.9; g.rotation.z = 0;
            };
            setTimeout(() => {
              if (!running) return;
              co.pose = null;
              flyBall({ x: co.x, y: 1.2, z: co.z }, { x: SWalk.pos.x, y: 1.2, z: SWalk.pos.z },
                { h: 2.0, dur: 1.1, done: () => { if (running) { SWalk.hold('ball'); sfx('pop'); } } });
            }, 1500 * speedMul());
          }
          if (running && !paused) nextStep(i + 1);
        },
      });
    });
  }

  /* ── 🏏 the swing: off the tee, and the ball really goes somewhere ───── */
  function doSwing(i) {
    record('hit');
    /* side-on to the swing, looking down the line the ball will travel */
    SWalk.freeze(true);
    frameAction(SWalk.pos, { x: L.circle.x, z: L.circle.z }, 3.8, () => SWalk.freeze(false));
    const tee = F.props && F.props.tee;
    const teeBall = tee && tee.userData && tee.userData.ball;
    let t = 0;
    const left = SWalk.hand() === 'L';
    SWalk.setPose((me, dt) => {
      t += dt / speedMul();
      const k = Math.min(1, t / 0.55);
      const turn = (left ? -1 : 1) * k * 2.3;
      me.lean.rotation.y = turn;
      me.lean.rotation.x = 0.1;
      me.legL.rotation.x = 0; me.legR.rotation.x = 0;
      me.armL.rotation.x = -1.15 + k * 0.5; me.armL.rotation.z = 0;
      me.armR.rotation.x = -1.15 + k * 0.5; me.armR.rotation.z = 0;
    });
    setTimeout(() => {
      if (!running) return;
      if (teeBall) teeBall.visible = false;
      sfx('star');
      /* somewhere out in the grass — a different spot every time */
      const a = -0.55 + Math.random() * 1.1;
      const dist = 22 + Math.random() * 16;
      flyBall({ x: L.tee.x, y: 1.0, z: L.tee.z },
              { x: Math.sin(a) * dist, y: 0.2, z: -Math.cos(a) * dist },
              { h: 5.5, dur: 1.9, done: () => { if (teeBall) teeBall.visible = true; } });
    }, 520 * speedMul());
    setTimeout(() => {
      if (!running) return;
      SWalk.setPose(null);
      const rig = SWalk.rig();
      if (rig) rig.lean.rotation.y = 0;
      if (!paused) nextStep(i + 1);
    }, 1900 * speedMul());
  }

  /* ── 🧤 a grounder from the coach, and you go and get it ─────────────── */
  function hitGrounder(i) {
    const co = cur.coach;
    const me = SWalk.pos;
    SWalk.freeze(false);
    /* the ball is rolled NEAR the child, never straight at them: moving to
       get in front of it is the whole skill */
    const off = (Math.random() < 0.5 ? -1 : 1) * (2.2 + Math.random() * 2.0);
    const to = { x: cur.st.me.x + off, z: cur.st.me.z + (Math.random() - 0.5) * 2.4 };
    const from = co ? { x: co.x, z: co.z } : { x: L.home.x, z: L.home.z };

    if (co) {
      let t = 0;
      co.pose = (P, dt) => {
        t += dt / speedMul();
        P.legL.rotation.x = 0; P.legR.rotation.x = 0; P.lean.rotation.x = 0;
        const k = Math.min(1, t / 0.5);
        P.armL.rotation.x = -1.0 + k * 1.4; P.armR.rotation.x = -1.0 + k * 1.4;
        P.armL.rotation.z = 0; P.armR.rotation.z = 0;
      };
      setTimeout(() => { if (running && co) co.pose = null; }, 1500 * speedMul());
    }
    /* side-on to the roll, and close — you can still run, you can now see */
    frameFollow(from, to, 7);
    setTimeout(() => {
      if (!running || paused) return;
      sfx('pop');
      const mark = markerAt(to.x, to.z, 0x69db7c, 1.5);
      rollBall(from, to, {
        dur: 2.8, r: 1.5,
        grab: () => {
          if (!running) return;
          sfx('yes');
          SWalk.hold('ball');
          try { F.discard(mark); } catch (e) {}
          try { SWalk.lockCam(null); } catch (e) {}
          if (!paused) nextStep(i + 1);
        },
        /* if it stops before they reach it, that is fine — Nilu just says so */
        done: () => { if (running && !paused) say(C.nilu.thisWay, null, { emoji: '🐘' }); },
      });
    }, 700 * speedMul());
  }

  /* ── 🥎 throw it to first, where a teammate is covering ──────────────── */
  function doThrowFirst(i) {
    const cover = cur.cover;
    const to = cover ? { x: cover.x, y: 1.4, z: cover.z }
                     : { x: L.firstCover.x, y: 1.4, z: L.firstCover.z };
    record('throw');
    SWalk.freeze(true);
    frameAction(SWalk.pos, to, 4.4, () => SWalk.freeze(false));
    playerThrowPose(() => {
      SWalk.hold(null);
      const p = SWalk.pos;
      flyBall({ x: p.x, y: 1.4, z: p.z }, to, {
        h: 2.6, dur: 1.1,
        done: () => {
          sfx('star');
          if (cover) {
            cover.pose = (P) => {
              P.legL.rotation.x = 0; P.legR.rotation.x = 0; P.lean.rotation.x = 0;
              const g = P.gloveSide === 'L' ? P.armL : P.armR;
              g.rotation.x = -1.6; g.rotation.z = 0;
              (P.gloveSide === 'L' ? P.armR : P.armL).rotation.x = 0.1;
            };
            setTimeout(() => { if (cover) cover.pose = null; }, 1800 * speedMul());
          }
          if (running && !paused) nextStep(i + 1);
        },
      });
    });
  }

  /* ═══════════════════════════════════════════════ end of a rep, and again */
  function finishRep() {
    if (!running || !cur) return;
    hideButton();
    SWalk.setPose(null);
    SWalk.hold(null);
    const n = LV().rep(cur.id);
    cur.reps = n;
    sfx('star');
    const praise = cur.def.praise[(n - 1) % cur.def.praise.length];
    say(praise, null, { emoji: '⭐' });
    try { LV().cueStep(0, 0); } catch (e) {}

    setTimeout(() => {
      if (!running) return;
      say(C.nilu.goodJob, null, { emoji: '🐘' });
    }, 3000 * speedMul());

    /* a few good reps is the whole bar. It is not a test, and a rep counts
       on effort, not accuracy. Running all four bases is tiring, so that one
       asks for fewer. */
    if (n >= repTarget(cur.id)) { setTimeout(finishDrill, 5200 * speedMul()); return; }
    setTimeout(() => {
      if (!running) return;
      say(cur.def.again, null, { emoji: cur.def.emoji });
      showButton(cur.def.emoji, tr(cur.def.again), tr(cur.def.again));
      waiting = { kind: 'tap', go: () => { nextStep(0); } };
    }, 5200 * speedMul());
  }

  /* the batting station teaches three things in a row, under one schedule
     card: hitting off the tee, stepping in and out of the box, then dropping
     the bat and running — each its own hard skill, none its own card */
  const CHAIN = { bat: 'box', box: 'drop' };
  const REPS = { throw: 3, pitch: 3, field: 3, bat: 3, box: 2, drop: 2, run: 2 };
  /* the whole batting station still earns the one "Big Hitter" sticker,
     whichever sub-drill happens to finish the chain last */
  const STICKER_ID = { drop: 'box' };
  /* How many turns a station asks for. A coach can set this three ways, and
     the most specific one wins:
       1. this station's own number   (Coach Mode → Set up → the station's ± )
       2. one number for every station (Coach Mode → "same for every station")
       3. what the drill was written with (REPS above)
     Kept in that order so changing one station never disturbs the others. */
  function repTarget(id) {
    let G = null;
    try { G = LV().G; } catch (e) {}
    if (!G) return REPS[id] || 3;
    const mine = +((G.repsBy || {})[id]) || 0;
    if (mine > 0) return mine;
    const all = +G.repTarget || 0;
    return all > 0 ? all : (REPS[id] || 3);
  }
  S.repTarget = repTarget;
  S.repDefault = (id) => REPS[id] || 3;   // what the drill was written with
  const NEXT_LEVEL = { throw: 'pitch', pitch: 'field', field: 'bat', drop: 'run', run: 'team', team: 'game' };

  function finishDrill() {
    if (!running || !cur) return;
    const id = cur.id;
    running = false;
    hideButton();
    clearMarks();
    SWalk.freeze(false);
    SWalk.setPose(null);
    SWalk.hold(null);
    if (cur.coach) { cur.coach.pose = null; if (cur.coach.home) cur.coach.goTo(cur.coach.home.x, cur.coach.home.z); }
    if (cur.cover) { cur.cover.pose = null; if (cur.cover.home) cur.cover.goTo(cur.cover.home.x, cur.cover.home.z); }
    SWalk.helmet(false);
    /* same station, next thing it teaches — the schedule card doesn't change */
    if (CHAIN[id]) {
      const nextDrill = CHAIN[id];
      say(cur.def.done, null, { emoji: '⭐' });
      cur = null;
      setTimeout(() => { if (window.SBLevels) start(nextDrill); }, 4200 * speedMul());
      return;
    }
    /* finishing a whole station is the biggest win in the game outside the
       medal — give it the full burst, over the child's own head */
    try {
      const p = SWalk.pos;
      SBField.confetti(p.x, 2.9, p.z, 46);
    } catch (e) {}
    try { LV().sticker(STICKER_ID[id] || id, LV().levelName(id)); } catch (e) {}
    try { K.streakBump && K.streakBump(); } catch (e) {}
    say(cur.def.done, null, { emoji: '⭐' });
    const nxt = NEXT_LEVEL[id];
    cur = null;
    if (!nxt) return;
    try { LV().unlock(nxt); } catch (e) {}
    setTimeout(() => { try { LV().goToLevel(nxt); } catch (e) {} }, 4800 * speedMul());
  }

  /* ══════════════════════════════════════════════════════════════ API */
  S.start = start;
  S.has = (id) => !!(window.SBContent && SBContent.drills[id] && station(id));

  function leave() {
    running = false;
    waiting = null;
    cur = null;
    hideButton();
    clearMarks();
    clearBalls();
    try { SWalk.removeSpot('drillStand'); SWalk.removeSpot('drillStep'); } catch (e) {}
    try { SWalk.setPose(null); SWalk.hold(null); SWalk.freeze(false); SWalk.cancelArc(); SWalk.lockCam(null); } catch (e) {}
  }
  S.leave = leave;

  /* 🙋 mid-step: park it exactly here. Nothing is lost, nothing repeats. */
  S.suspend = function () {
    if (!running) return;
    paused = true;
    hideButton();
    try { SWalk.lockCam(null); } catch (e) {}   // a raised hand gets the camera back
    try { SWalk.cancelArc(); } catch (e) {}
    for (const m of marks) m.visible = false;
  };
  S.resume = function () {
    if (!running) return;
    paused = false;
    for (const m of marks) m.visible = true;
    /* put the same step back, and say it again — never leave them guessing */
    if (cur && cur.stepIdx >= 0) setTimeout(() => { if (running && !paused) nextStep(cur.stepIdx); }, 600 * speedMul());
  };

  /* The one big button, lent to whoever needs it (team.js uses it for the
     warm-up). Only safe while no drill is mid-step, which is exactly when
     Team Time runs. */
  S.ask = function (emoji, label, title, onTap) {
    showButton(emoji, label, title);
    waiting = { kind: 'tap', go: onTap };
  };
  S.hide = function () { waiting = null; hideButton(); };

  S.onTap = function () { return false; };

  S.tick = function (dt) {
    clock += dt;
    ballTick(dt);
  };

  /* grown-up / test helpers */
  S.state = () => ({
    running: running, paused: paused, id: cur && cur.id,
    step: cur ? cur.stepIdx : -1,
    stepId: cur && cur.stepIdx >= 0 ? cur.def.steps[cur.stepIdx].id : null,
    reps: cur ? cur.reps : 0, waiting: waiting && waiting.kind,
    balls: balls.length,
  });
  S.press = () => { if (elDo && elDo.style.display !== 'none') elDo.click(); };
  /* where the current step wants the child to be (a base, a box, a grounder) */
  S.walkTarget = () => {
    if (!cur || cur.stepIdx < 0) return null;
    const step = cur.def.steps[cur.stepIdx];
    const raw = (MECH[cur.id] || {})[step.id];
    if (raw && typeof raw === 'object' && raw.kind === 'walk') { const a = raw.at(); return { x: a.x, z: a.z }; }
    if (raw === 'walk') return { x: cur.st.me.x, z: cur.st.me.z };
    if (raw === 'catch') {
      const b = balls.find((f) => f.grab);
      return b ? { x: b.m.position.x, z: b.m.position.z } : null;
    }
    return null;
  };

  window.SBDrills = S;
})();
