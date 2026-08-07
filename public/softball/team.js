/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — TEAM TIME  (window.SBTeam)

   The parts of practice that have nothing to do with softball and everything
   to do with being at practice:

     🔔 LINE UP    a whistle, five numbered footprints, four teammates walking
                   to theirs — and one spot left, which is yours. This runs at
                   the START OF EVERY LEVEL, not once in a lesson, because
                   lining up is the thing that actually needs rehearsing.
     💪 WARM-UP    copy Coach AJ: arm circles, toe touches, jumping jacks,
                   twists, then one lap around the bases with the team.
     💧 WATER      everybody drinks. Asking to stop is normal.
     💙 CHEER      hands up together. Practice always ends the same way.

   Nobody is ever late, nobody is left behind, and nothing starts without the
   child. If they take two minutes to find their spot, the team waits two
   minutes. Every word comes from content.js.
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
  const LV = () => window.SBLevels;
  const say = (line, vars, opts) => { try { return LV().speak(line, vars, opts); } catch (e) { return ''; } };

  let marks = [];
  let running = false, lining = false;
  let clock = 0;
  const linedUp = {};              // level id → already lined up this session
  let warmedUp = false;            // you stretch once at the start, not eight times

  function clearMarks() {
    for (const m of marks) { try { F.discard(m); } catch (e) {} }
    marks = [];
  }
  function ready() {
    C = window.SBContent; F = window.SBField; L = F && F.L;
    THREE = F && F.three(); scene = F && F.scene();
    return !!(C && F && scene && window.SWalk);
  }

  /* a number floating over a footprint spot */
  function numberTag(n, x, z) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.94)';
    g.beginPath(); g.arc(64, 64, 54, 0, 7); g.fill();
    g.fillStyle = '#2f6fb5';
    g.font = 'bold 78px "Comic Sans MS","Chalkboard SE",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(n), 64, 68);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false }));
    sp.scale.set(0.9, 0.9, 1);
    sp.position.set(x, 1.5, z);
    scene.add(sp);
    marks.push(sp);
    return sp;
  }

  /* ═══════════════════════════════════════════════════════ 🔔 LINE UP */
  S.lineUp = function (then, opts) {
    opts = opts || {};
    if (!ready()) { if (then) then(); return; }
    if (lining) { if (then) then(); return; }
    lining = true;
    clearMarks();

    const co = LV().aj();
    const spots = L.lineUp.slice();
    /* the child's place in the line is different every time — finding YOUR
       spot is the skill, not standing in the same one */
    const mine = Math.floor(Math.random() * spots.length);

    if (co) {
      co.pose = null;
      co.goTo(L.lineUpCoach.x, L.lineUpCoach.z, () => {
        co.lookAt(spots[2].x, spots[2].z);
        try { co.pose = F.poses.callOver; } catch (e) {}
      });
    }
    sfx('star');
    say(C.team.whistle, null, { emoji: '🔔' });
    setTimeout(() => { if (lining) say(C.team.lineUpSay, { coach: co ? co.info.name : '' }, { emoji: '🧢' }); }, 1600 * speedMul());

    /* the footprints appear, numbered, all five */
    spots.forEach((sp, i) => {
      const fp = F.footprints(sp.x, sp.z, Math.PI);
      marks.push(fp);
      numberTag(i + 1, sp.x, sp.z);
      const ring = F.marker(sp.x, sp.z, i === mine ? 0x69db7c : 0xffd43b, 1.1);
      ring.material.opacity = i === mine ? 0.9 : 0.4;
      marks.push(ring);
      if (i === mine) mineRing = ring;
    });

    /* Nilu comes to the line-up too, and waits at the child's own spot. She
       is how a child knows where to go — leaving her behind the dugout while
       everyone else lines up is exactly how this gets confusing. */
    const N = F.nilu;
    if (N) {
      N.pose = null;
      N.goTo(spots[mine].x - 1.9, spots[mine].z - 1.6, () => {
        try { N.lookAt(L.lineUpCoach.x, L.lineUpCoach.z); } catch (e) {}
      });
    }

    /* the teammates walk to theirs and wait — nobody starts without the child */
    const mates = (F.mates || []).slice(0, 4);
    let mi = 0;
    for (let i = 0; i < spots.length; i++) {
      if (i === mine) continue;
      const mate = mates[mi++];
      if (!mate) continue;
      mate.pose = null;
      const sp = spots[i];
      setTimeout(() => {
        if (!lining) return;
        mate.goTo(sp.x, sp.z, () => { mate.ry = Math.PI; mate.lookAt(L.lineUpCoach.x, L.lineUpCoach.z); });
      }, (600 + mi * 700) * speedMul());
    }

    setTimeout(() => {
      if (!lining) return;
      say(C.team.lineUpDo, null, { emoji: '👣' });
      try { SWalk.hint(tr(C.team.lineUpWait), 5000); } catch (e) {}
    }, 3200 * speedMul());

    const target = spots[mine];
    SWalk.freeze(false);
    const arrive = () => {
      if (!lining) return;
      lining = false;
      sfx('yes');
      SWalk.facing(L.lineUpCoach.x, L.lineUpCoach.z);
      say(C.team.lineUpDone, null, { emoji: '💙' });
      try { LV().sticker('lineup', tr(C.team.lineUpDone)); } catch (e) {}
      setTimeout(() => {
        clearMarks();
        mineRing = null;
        if (co) co.pose = null;
        /* every line-up is followed by a short stretch — that's how practice
           actually goes, and Nilu does it with you */
        if (opts.noWarm || warmedUp) { if (then) then(); return; }
        warmedUp = true;
        quickWarmUp(then);
      }, 2600 * speedMul());
    };
    if (SWalk.at(target, 2.0)) setTimeout(arrive, 2600 * speedMul());
    else {
      SWalk.addSpot({ id: 'lineUpSpot', x: target.x, z: target.z, r: 2.0, once: true, onEnter: arrive });
      /* If a child hasn't found their spot after a good long while, Nilu walks
         them to it. Waiting is fine; being stuck is not — practice can never
         be unable to start. */
      setTimeout(() => {
        if (!lining) return;
        say(C.nilu.thisWay, null, { emoji: '🐘' });
        const N = F.nilu;
        if (N) N.goTo(target.x - 1.6, target.z + 1.2);
        SWalk.walkTo(target.x, target.z);
      }, 40000 * speedMul());
      setTimeout(() => { if (lining) arrive(); }, 70000 * speedMul());
    }
  };
  let mineRing = null;

  /* Run once per level per session, before the level itself starts. Lining up
     is not a lesson you do at the end — it is how every practice begins. */
  S.lineUpFor = function (levelId, then) {
    if (!ready() || linedUp[levelId] || levelId === 'team') { if (then) then(); return; }
    linedUp[levelId] = 1;
    S.lineUp(then);
  };
  S.forgetLineUps = function () { for (const k in linedUp) delete linedUp[k]; warmedUp = false; };
  /* a grown-up jumping straight to a station in Coach Mode has already decided
     what they want — don't make them line up and warm up first */
  S.markLinedUp = function (id) { linedUp[id] = 1; warmedUp = true; };

  /* ═════════════════════════════════════ 💪 the short warm-up after a line-up
     Two stretches, about fifteen seconds, with Nilu copying along beside you.
     Team Time runs the full five plus a lap; this is the everyday version. */
  function quickWarmUp(then) {
    const picks = ['arms', 'toes'];
    let i = 0;
    const step = () => {
      if (i >= picks.length) {
        say(C.team.warmDone, null, { emoji: '💪' });
        try { SBDrills.hide(); } catch (e) {}
        setTimeout(() => { if (then) then(); }, 1600 * speedMul());
        return;
      }
      const id = picks[i++];
      const st = (C.team.stretches || []).find((x) => x.id === id) || { emoji: '💪', do: C.team.stretchIntro };
      say(st.do, null, { emoji: st.emoji });
      everyoneDo(id, 4.2);
      try {
        SBDrills.ask(st.emoji, tr(st.do), tr(st.do), () => {
          sfx('pop');
          everyoneDo(id, 2.8);
          setTimeout(step, 3000 * speedMul());
        });
      } catch (e) { setTimeout(step, 4200 * speedMul()); }
    };
    say(C.team.withNilu, null, { emoji: '🐘' });
    setTimeout(step, 2200 * speedMul());
  }
  S.quickWarmUp = quickWarmUp;

  /* ══════════════════════════════════════════════════════ 💪 WARM-UP */
  const POSES = {
    arms(P, dt, t) {
      const a = (t || 0) * 5;
      P.lean.rotation.x = 0; P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      P.armL.rotation.x = -a; P.armR.rotation.x = -a;
      P.armL.rotation.z = 0; P.armR.rotation.z = 0;
    },
    toes(P, dt, t) {
      const k = (Math.sin((t || 0) * 2.6) + 1) / 2;
      P.lean.rotation.x = k * 1.15;
      P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      P.armL.rotation.x = -k * 0.9; P.armR.rotation.x = -k * 0.9;
      P.armL.rotation.z = 0; P.armR.rotation.z = 0;
    },
    jacks(P, dt, t) {
      const k = (Math.sin((t || 0) * 6) + 1) / 2;
      P.lean.rotation.x = 0;
      P.legL.rotation.z = k * 0.45; P.legR.rotation.z = -k * 0.45;
      P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      P.armL.rotation.x = -k * 2.6; P.armR.rotation.x = -k * 2.6;
      P.armL.rotation.z = 0; P.armR.rotation.z = 0;
    },
    twist(P, dt, t) {
      P.lean.rotation.y = Math.sin((t || 0) * 2.4) * 0.9;
      P.lean.rotation.x = 0;
      P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      P.armL.rotation.x = -1.3; P.armR.rotation.x = -1.3;
      P.armL.rotation.z = 0; P.armR.rotation.z = 0;
    },
  };

  function everyoneDo(poseId, secs) {
    const fn = POSES[poseId];
    if (!fn) return;
    let t = 0;
    const wrap = (P, dt) => { t += dt / speedMul(); fn(P, dt, t); };
    const who = [];
    const co = LV().aj();
    if (co) who.push(co);
    for (const m of (F.mates || []).slice(0, 4)) who.push(m);
    for (const p of who) p.pose = wrap;
    /* Nilu stretches too — trunk, ears and a bounce, since she has no shoulders */
    const N = F.nilu;
    if (N) { N.poseT = 0; N.pose = F.niluPoses.stretch; }
    let pt = 0;
    SWalk.setPose((me, dt) => { pt += dt / speedMul(); fn(me, dt, pt); });
    setTimeout(() => {
      for (const p of who) { p.pose = null; p.lean.rotation.y = 0; p.legL.rotation.z = 0; p.legR.rotation.z = 0; }
      if (N) N.pose = null;
      SWalk.setPose(null);
      const rig = SWalk.rig();
      if (rig) { rig.lean.rotation.y = 0; rig.legL.rotation.z = 0; rig.legR.rotation.z = 0; }
    }, (secs || 3) * 1000 * speedMul());
  }

  /* ══════════════════════════════════════════════════ the Team Time level */
  let step = 0;

  S.start = function () {
    if (!ready()) return false;
    running = true;
    step = 0;
    clearMarks();
    /* Team Time always opens with a line-up, then the warm-up */
    S.lineUp(() => { if (running) nextWarm(); }, { noWarm: true });
    return true;
  };

  function nextWarm() {
    if (!running) return;
    const list = C.team.stretches;
    if (step === 0) {
      say(C.team.stretchIntro, null, { emoji: '💪' });
      step = 1;
      setTimeout(nextWarm, 3000 * speedMul());
      return;
    }
    const i = step - 1;
    if (i >= list.length) return waterBreak();
    step++;
    const st = list[i];
    say(st.do, null, { emoji: st.emoji });

    if (st.id === 'lap') { return doLap(); }

    /* the coach and the team start it; the child joins with the big button */
    everyoneDo(st.id, 4.5);
    try {
      SBDrills.ask(st.emoji, tr(st.do), tr(st.do), () => {
        if (!running) return;
        sfx('pop');
        everyoneDo(st.id, 3.2);
        setTimeout(() => { if (running) nextWarm(); }, 3400 * speedMul());
      });
    } catch (e) { setTimeout(nextWarm, 4200 * speedMul()); }
  }

  /* one lap around the bases, with the team */
  function doLap() {
    const route = [L.first, L.second, L.third, L.home];
    let i = 0;
    const mates = (F.mates || []).slice(0, 4);
    mates.forEach((m, k) => {
      let j = 0;
      const go = () => {
        if (!running || j >= route.length) return;
        const p = route[j++];
        m.goTo(p.x + (k - 1.5) * 1.1, p.z + (k - 1.5) * 1.1, go);
      };
      setTimeout(go, k * 400 * speedMul());
    });
    SWalk.freeze(false);
    const hop = () => {
      if (!running) return;
      if (i >= route.length) {
        clearMarks();
        say(C.team.stretchDone, null, { emoji: '💪' });
        setTimeout(() => { if (running) waterBreak(); }, 2600 * speedMul());
        return;
      }
      const p = route[i++];
      clearMarks();
      marks.push(F.marker(p.x, p.z, 0x69db7c, 2.0));
      SWalk.addSpot({ id: 'lapSpot', x: p.x, z: p.z, r: 2.4, once: true, onEnter: hop });
    };
    hop();
  }

  function waterBreak() {
    if (!running) return;
    say(C.team.waterSay, null, { emoji: '💧' });
    clearMarks();
    const at = { x: L.water.x + 1.4, z: L.water.z + 1.4 };
    marks.push(F.marker(at.x, at.z, 0x9fd8ff, 1.8));
    const mates = (F.mates || []).slice(0, 4);
    mates.forEach((m, k) => m.goTo(at.x + 1.6 + k * 1.1, at.z + 1.4, () => m.lookAt(L.water.x, L.water.z)));
    SWalk.freeze(false);
    SWalk.addSpot({ id: 'waterSpot', x: at.x, z: at.z, r: 2.4, once: true, onEnter: () => {
      if (!running) return;
      sfx('pop');
      try {
        SWalk.showCard('💧', tr(C.team.waterSay), tr(C.nilu.restIsOk), {
          sticky: true, btn: tr(C.breakTime.ready), onDone: cheer,
        });
      } catch (e) { cheer(); }
    } });
  }

  function cheer() {
    if (!running) return;
    clearMarks();
    say(C.team.cheer, null, { emoji: '💙' });
    sfx('star');
    const who = [];
    const co = LV().aj();
    if (co) who.push(co);
    for (const m of (F.mates || []).slice(0, 4)) who.push(m);
    let t = 0;
    const up = (P, dt) => {
      t += dt / speedMul();
      const k = Math.min(1, t * 3);
      P.lean.rotation.x = 0; P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      P.armL.rotation.x = -2.7 * k; P.armR.rotation.x = -2.7 * k;
      P.armL.rotation.z = 0; P.armR.rotation.z = 0;
    };
    for (const p of who) p.pose = up;
    let pt = 0;
    SWalk.setPose((me, dt) => { pt += dt / speedMul(); up(me, dt); });

    setTimeout(() => {
      for (const p of who) { p.pose = null; if (p.home) p.goTo(p.home.x, p.home.z); }
      SWalk.setPose(null);
      finish();
    }, 3600 * speedMul());
  }

  function finish() {
    running = false;
    clearMarks();
    try { SBDrills.hide(); } catch (e) {}
    SWalk.freeze(false);
    try { LV().sticker('team', LV().levelName('team')); } catch (e) {}
    try { K.streakBump && K.streakBump(); } catch (e) {}
    say(C.aj.proud, null, { emoji: '🧢' });
    try { LV().unlock('game'); } catch (e) {}
    setTimeout(() => { try { LV().goToLevel('game'); } catch (e) {} }, 4600 * speedMul());
  }

  /* ══════════════════════════════════════════════════════════════ API */
  S.leave = function () {
    running = false; lining = false;
    clearMarks();
    try { SBDrills.hide(); } catch (e) {}
    try { SWalk.removeSpot('lineUpSpot'); SWalk.removeSpot('lapSpot'); SWalk.removeSpot('waterSpot'); } catch (e) {}
    try { SWalk.setPose(null); SWalk.freeze(false); } catch (e) {}
    for (const p of (F && F.people) || []) p.pose = null;
    try { if (F && F.nilu) F.nilu.pose = null; } catch (e) {}
  };
  S.suspend = function () { for (const m of marks) m.visible = false; try { SBDrills.hide(); } catch (e) {} };
  S.resume = function () { for (const m of marks) m.visible = true; };
  S.tick = function (dt) {
    clock += dt;
    if (mineRing) mineRing.material.opacity = 0.6 + Math.sin(clock * 3.4) * 0.35;
  };
  S.state = () => ({ running: running, lining: lining, step: step, linedUp: Object.keys(linedUp) });

  window.SBTeam = S;
})();
