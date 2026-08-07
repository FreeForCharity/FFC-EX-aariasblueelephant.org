/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — THE PRACTICE  (window.SBLevels)

   The session director. Owns:
     · onboarding — the child's name and which hand they throw with
     · the cue band (#sbCue) — ONE instruction at a time, plus 🔁 Say it again
     · the visual schedule strip (#sbStrip) — what's now, what's next
     · 🙋 the break flow — from ANY level, at ANY moment, always a win
     · progress: which levels are open, how many reps of each skill
     · Nilu, who walks ahead to wherever the child should go next

   It never contains words. Every string comes from SBContent (content.js),
   which is the file the coaches edit.

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const S = {};
  let K = window.ABEKit || {};
  let C = null, L = null;

  const tr = (o, en, es) => {
    try {
      if (o && typeof o === 'object') return K.tr ? K.tr(o.en, o.es) : o.en;
      return K.tr ? K.tr(en, es) : en;
    } catch (e) { return (o && o.en) || en || ''; }
  };
  const toast = (m, ms) => { try { K.toast && K.toast(m, ms); } catch (e) {} };
  /* ══════════════════════════════════════════════════════════ ONE VOICE
     Lines are queued and spoken one at a time, in order — never over the top
     of each other. Two coaches talking at once is noise, and for a child who
     is already working hard to listen it is worse than silence.

     A line only ever waits its turn; it is never dropped unless the queue has
     genuinely run away (a level change, a burst of praise), in which case the
     oldest are let go so the child isn't listening to stale instructions.
     K.say already no-ops when the kit is muted or read-aloud is off, so the
     🔊 Sound button and Settings → Read aloud still switch all of this off. */
  const voiceQ = [];
  let voiceBusy = false, voiceTimer = 0, voiceGuard = 0;

  function voicePump() {
    if (voiceBusy) return;
    const next = voiceQ.shift();
    if (next == null) return;
    voiceBusy = true;
    try { K.say && K.say(next); } catch (e) {}
    clearInterval(voiceTimer); clearTimeout(voiceGuard);
    /* give the engine a beat to start, then wait for it to fall silent */
    setTimeout(() => {
      voiceTimer = setInterval(() => {
        let busy = false;
        try { busy = !!(speechSynthesis.speaking || speechSynthesis.pending); } catch (e) {}
        if (busy) return;
        clearInterval(voiceTimer); clearTimeout(voiceGuard);
        voiceBusy = false;
        voicePump();
      }, 160);
    }, 220);
    /* a browser that never reports going idle must not jam the queue forever */
    voiceGuard = setTimeout(() => {
      clearInterval(voiceTimer);
      voiceBusy = false;
      voicePump();
    }, 14000);
  }

  const say = (m) => {
    if (!m) return;
    voiceQ.push(String(m));
    /* don't build a backlog — a child should hear what is happening NOW */
    while (voiceQ.length > 2) voiceQ.shift();
    voicePump();
  };
  /* drop anything still waiting (level change, a break starting) */
  function voiceClear() {
    voiceQ.length = 0;
    clearInterval(voiceTimer); clearTimeout(voiceGuard);
    voiceBusy = false;
    try { speechSynthesis.cancel(); } catch (e) {}
  }
  S.voice = say;
  S.voiceClear = voiceClear;
  const sfx = (n) => { try { K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} };
  const save = (k, v) => { try { K.save && K.save(k, v); } catch (e) {} };
  const load = (k, d) => { try { return K.load ? K.load(k, d) : d; } catch (e) { return d; } };
  const calm = () => { try { return !!(K.calm && K.calm()); } catch (e) { return false; } };
  const speedMul = () => { try { const s = Number(K.speed()); return (s >= 0.4 && s <= 3) ? s : 1; } catch (e) { return 1; } };
  const record = (kind, extra) => { try { K.recordEvent && K.recordEvent(kind, extra); } catch (e) {} };

  /* ══════════════════════════════════════════════════════════════ state */
  const G = S.G = {
    name: '',
    hand: 'R',
    level: 'gear',            // the level we're on
    open: { gear: 1 },        // which levels have been unlocked
    reps: {},                 // skill id → how many times practiced
    breaks: 0,                // how many times the child asked for a break
    needs: {},                // 🙋 requests by kind: break / water / bathroom / grownup / hurt
    stickers: [],
    onboarded: 0,
    assist: 1,
    finished: 0,          // 1 once Game Day and the medal are done
  };

  function loadState() {
    G.name = String(load('name', '') || '').slice(0, 24);
    G.hand = load('hand', 'R') === 'L' ? 'L' : 'R';
    G.level = load('level', 'gear');
    G.open = load('open', { gear: 1 }) || { gear: 1 };
    G.reps = load('reps', {}) || {};
    G.breaks = +load('breaks', 0) || 0;
    G.needs = load('needs', {}) || {};
    G.stickers = load('stickers', []) || [];
    G.onboarded = +load('onboarded', 0) || 0;
    G.finished = +load('finished', 0) || 0;
    G.assist = load('assist', 1) ? 1 : 0;
  }
  function saveState() {
    save('name', G.name); save('hand', G.hand); save('level', G.level);
    save('open', G.open); save('reps', G.reps); save('breaks', G.breaks); save('needs', G.needs);
    save('stickers', G.stickers); save('onboarded', G.onboarded); save('assist', G.assist);
    save('finished', G.finished);
  }
  S.save = saveState;

  /* fill {name}, {coach}, {n}… and the handedness words */
  function fill(str, vars) {
    let s = String(str == null ? '' : str);
    vars = vars || {};
    if (!vars.name) vars.name = G.name;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    try { s = window.SWalk ? SWalk.fill(s) : s; } catch (e) {}
    /* a child with no name shouldn't read a dangling "{name}" or a double space */
    return s.replace(/\s*\{name\}\s*/g, ' ').replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
  }
  S.fill = fill;

  /* a line of coach speech: says it, shows it, and puts it in the cue band */
  function speak(line, vars, opts) {
    opts = opts || {};
    const text = fill(tr(line), vars);
    if (!text) return '';
    if (opts.cue !== false) cue(text, opts.emoji);
    if (opts.toast) toast(text, opts.ms || 3200);
    if (opts.silent !== true) say(text);
    lastSpoken = { line: line, vars: vars, emoji: opts.emoji };
    return text;
  }
  S.speak = speak;
  let lastSpoken = null;

  /* ═══════════════════════════════════════════════ the cue band + schedule */
  let elCue = null, elCueText = null, elCueEmoji = null, elAgain = null;
  let elStrip = null;

  function mk(tag, id, cls, txt) {
    const n = document.createElement(tag);
    if (id) n.id = id;
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function buildChrome() {
    if (document.getElementById('sbCue')) return;

    elCue = mk('div', 'sbCue');
    elCueEmoji = mk('span', null, 'sbCueEmoji', '🥎');
    elCueText = mk('span', null, 'sbCueText', '');
    elAgain = mk('button', 'sbAgain', null, '🔁');
    elAgain.title = tr(C.drillUI.sayAgain);
    elAgain.setAttribute('aria-label', elAgain.title);
    elAgain.addEventListener('click', repeat);
    elCue.appendChild(elCueEmoji);
    elCue.appendChild(elCueText);
    elCue.appendChild(elAgain);
    elCue.style.display = 'none';
    document.body.appendChild(elCue);

    elStrip = mk('div', 'sbStrip');
    elStrip.setAttribute('aria-label', tr(C.ui.scheduleTitle));
    elStrip.style.display = 'none';
    document.body.appendChild(elStrip);
    refreshStrip();
  }

  function cue(text, emoji) {
    if (!elCue) return;
    if (!text) { elCue.style.display = 'none'; placeStrip(); return; }
    elCue.style.display = 'flex';
    elCueEmoji.textContent = emoji || levelEmoji(G.level);
    elCueText.textContent = text;
    elCue.classList.remove('pop');
    void elCue.offsetWidth;
    elCue.classList.add('pop');
    placeStrip();
  }
  S.cue = cue;

  /* The cue band grows to two or three lines depending on the sentence and
     the screen, so the schedule strip cannot sit at a fixed offset — it has
     to be measured under whatever the band currently is. */
  function placeStrip() {
    if (!elStrip) return;
    requestAnimationFrame(() => {
      try {
        if (!elCue || elCue.style.display === 'none') { elStrip.style.top = ''; return; }
        const b = elCue.getBoundingClientRect();
        if (b.height) elStrip.style.top = Math.round(b.bottom + 8) + 'px';
      } catch (e) {}
    });
  }
  S.placeStrip = placeStrip;
  addEventListener('resize', placeStrip);

  /* the little "Step 2 of 6" pill — a child always knows how much is left */
  function cueStep(n, total) {
    if (!elCue) return;
    let pill = document.getElementById('sbStepPill');
    if (!n || !total) { if (pill) pill.remove(); return; }
    if (!pill) {
      pill = mk('span', 'sbStepPill', 'sbStepPill');
      elCue.insertBefore(pill, elAgain);
    }
    pill.textContent = fill(tr(C.drillUI.stepOf), { n: n, total: total });
  }
  S.cueStep = cueStep;

  function repeat() {
    sfx('tap');
    if (!lastSpoken) return;
    const text = fill(tr(lastSpoken.line), lastSpoken.vars);
    cue(text, lastSpoken.emoji);
    say(text);
  }
  S.repeat = repeat;

  function levelEmoji(id) {
    const l = C.levels.find((x) => x.id === id);
    return l ? l.emoji : '🥎';
  }
  function levelName(id) {
    const l = C.levels.find((x) => x.id === id);
    return l ? tr(l.name) : '';
  }
  S.levelName = levelName;

  function refreshStrip() {
    if (!elStrip) return;
    elStrip.innerHTML = '';
    for (const l of C.levels) {
      const open = !!G.open[l.id];
      const now = l.id === G.level;
      const b = mk('button', null, 'sbStripCard' + (now ? ' now' : '') + (open ? ' open' : ' locked'));
      b.innerHTML = '<span class="sbStripEmoji">' + l.emoji + '</span>' +
                    '<span class="sbStripName">' + tr(l.name) + '</span>';
      b.title = tr(l.name) + (now ? ' — ' + tr(C.ui.now) : (open ? '' : ' — ' + tr(C.ui.locked)));
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', () => {
        sfx('tap');
        if (!open) { toast(tr(C.ui.locked), 2600); return; }
        goToLevel(l.id);
      });
      elStrip.appendChild(b);
    }
    const now = elStrip.querySelector('.now');
    if (now && now.scrollIntoView) { try { now.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }
  }
  S.refreshStrip = refreshStrip;

  function showChrome(on) {
    if (elCue) elCue.style.display = on && elCueText.textContent ? 'flex' : 'none';
    if (elStrip) elStrip.style.display = on ? 'flex' : 'none';
    placeStrip();
  }
  S.showChrome = showChrome;

  /* ═══════════════════════════════════════════════════════════ panels */
  function panel(id, inner, onClose) {
    const old = document.getElementById(id);
    if (old) old.remove();
    const p = mk('div', id, 'sbPanel');
    const card = mk('div', null, 'sbPanelCard');
    card.innerHTML = inner;
    p.appendChild(card);
    document.body.appendChild(p);
    p._close = () => { p.remove(); if (onClose) { try { onClose(); } catch (e) {} } };
    return p;
  }
  S.panel = panel;

  /* ══════════════════════════════════════════ ONBOARDING — name + hand */
  function askName(next) {
    const p = panel('sbName',
      '<h2>' + tr(C.start.askName) + '</h2>' +
      '<input id="sbNameIn" type="text" maxlength="20" autocomplete="off" ' +
        'placeholder="' + tr(C.start.namePlaceholder) + '" aria-label="' + tr(C.start.askName) + '">' +
      '<button class="sbBig" id="sbNameOk">' + tr(C.start.nameOk) + '</button>' +
      '<button class="sbLink" id="sbNameSkip">' + tr(C.start.nameSkip) + '</button>');
    const input = document.getElementById('sbNameIn');
    const go = () => {
      G.name = String((input && input.value) || '').replace(/[<>]/g, '').trim().slice(0, 20);
      saveState();
      sfx('yes');
      p._close();
      next();
    };
    document.getElementById('sbNameOk').addEventListener('click', go);
    document.getElementById('sbNameSkip').addEventListener('click', () => { sfx('tap'); p._close(); next(); });
    if (input) {
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      setTimeout(() => { try { input.focus(); } catch (e) {} }, 250);
    }
    say(tr(C.start.askName));
  }

  function askHand(next) {
    const p = panel('sbHand',
      '<h2>' + tr(C.start.askHand) + '</h2>' +
      '<p class="sbSub">' + tr(C.start.askHandWhy) + '</p>' +
      '<div class="sbHandRow">' +
        '<button class="sbHandBtn" id="sbHandR"><span class="sbHandEmoji">✋</span>' +
          '<span class="sbHandLbl">' + tr(C.start.handRight) + '</span></button>' +
        '<button class="sbHandBtn" id="sbHandL"><span class="sbHandEmoji sbFlip">✋</span>' +
          '<span class="sbHandLbl">' + tr(C.start.handLeft) + '</span></button>' +
      '</div>' +
      '<button class="sbLink" id="sbHandU">' + tr(C.start.handUnsure) + '</button>');
    const pick = (h) => {
      G.hand = h;
      saveState();
      try { SWalk.setHand(h); } catch (e) {}
      sfx('yes');
      p._close();
      const line = h === 'R' ? C.start.handSetRight : C.start.handSetLeft;
      toast(tr(line), 3600);
      say(tr(line));
      next();
    };
    document.getElementById('sbHandR').addEventListener('click', () => pick('R'));
    document.getElementById('sbHandL').addEventListener('click', () => pick('L'));
    document.getElementById('sbHandU').addEventListener('click', () => {
      sfx('tap');
      p._close();
      toast(tr(C.start.handUnsureHelp), 5200);
      say(tr(C.start.handUnsureHelp));
      /* not-sure is a real answer: keep the default, and the grown-up can
         change it any time in Coach Mode once the child has tried both */
      G.hand = 'R'; saveState();
      try { SWalk.setHand('R'); } catch (e) {}
      setTimeout(next, 1200);
    });
    say(tr(C.start.askHand));
  }

  /* ══════════════════════════════ 🙋 ASKING FOR WHAT YOU NEED (the big one)
     One button, available from the first second of the first level, in every
     level, in the middle of a drill — and it never costs anything.

     Every request runs the SAME four beats, because that is the routine we
     want a child to carry onto a real field:
        1. raise your hand      2. wait for Coach AJ to look
        3. say what you need    4. he says yes

     Coach AJ is the one who comes over — for a break, for water, for the
     bathroom, to find a grown-up, or because something hurts. Nilu stays
     beside the child the whole time and tells them what is happening. */
  let onNeed = false, activeNeed = null, needCoach = null, returnTo = null;

  S.onBreak = () => onNeed;                      // kept: older callers ask this
  S.needActive = () => activeNeed && activeNeed.id;

  const needById = (id) => C.needs.items.find((n) => n.id === id);

  /* the 🙋 button: a picture menu, not a wall of words */
  S.openNeeds = function () {
    if (onNeed) { finishNeed(); return; }
    if (!window.SWalk || !SWalk.started()) return;
    sfx('tap');
    const rows = C.needs.items.map((n) =>
      '<button class="sbNeedBtn" data-need="' + n.id + '">' +
        '<span class="sbNeedEmoji">' + n.emoji + '</span>' +
        '<span class="sbNeedLbl">' + tr(n.label) + '</span></button>').join('');
    const p = panel('sbNeeds',
      '<h2>🙋 ' + tr(C.needs.title) + '</h2>' +
      '<p class="sbSub">' + tr(C.needs.how) + '</p>' +
      '<div class="sbNeedGrid">' + rows + '</div>' +
      '<button class="sbLink" id="sbNeedNone">' + tr(C.needs.cancel) + '</button>');
    p.querySelectorAll('.sbNeedBtn').forEach((b) => b.addEventListener('click', () => {
      const n = needById(b.dataset.need);
      p._close();
      if (n) startNeed(n);
    }));
    document.getElementById('sbNeedNone').addEventListener('click', () => { sfx('tap'); p._close(); });
    say(tr(C.needs.title));
  };
  /* the old name still works — index.html and any saved shortcut call this */
  S.askBreak = S.openNeeds;

  function startNeed(need) {
    onNeed = true;
    activeNeed = need;
    record('break', 0);
    G.needs[need.id] = (G.needs[need.id] || 0) + 1;
    if (need.id === 'break') G.breaks++;
    saveState();

    /* whatever was happening politely steps aside — nothing is lost */
    try { window.SBDrills && SBDrills.suspend && SBDrills.suspend(); } catch (e) {}
    try { window.SBGear && SBGear.suspend && SBGear.suspend(); } catch (e) {}
    try { window.SBTeam && SBTeam.suspend && SBTeam.suspend(); } catch (e) {}
    try { window.SBGame && SBGame.suspend && SBGame.suspend(); } catch (e) {}

    voiceClear();                     // a raised hand takes the floor
    returnTo = { x: SWalk.pos.x, z: SWalk.pos.z, ry: SWalk.pos.ry };
    SWalk.freeze(true);
    SWalk.raiseHand(true);
    sfx('pop');

    /* beat 1 — hand up */
    speak(C.needs.handUp, null, { emoji: '✋' });
    /* beat 2 — wait for him to look */
    setTimeout(() => { if (onNeed) speak(C.needs.waiting, null, { emoji: '👀' }); }, 1500 * speedMul());
    /* beat 3 — say it */
    setTimeout(() => { if (onNeed) speak(need.say, null, { emoji: '🗣️' }); }, 3000 * speedMul());

    /* beat 4 — Coach AJ walks over and kneels to eye level */
    setTimeout(() => {
      if (!onNeed) return;
      const co = S.aj() || nearestCoach();
      needCoach = co;
      if (!co) { coachAnswers(null, need); return; }
      speak(C.needs.coming, { coach: co.info.name }, { emoji: '🧢' });
      const p = SWalk.pos;
      const a = Math.atan2(p.x - co.x, p.z - co.z);
      co.pose = null;
      /* a hand in the air must always get answered — see coachWalksTo */
      coachWalksTo(co, p.x - Math.sin(a) * 1.8, p.z - Math.cos(a) * 1.8, () => {
        if (!onNeed) return;
        co.lookAt(SWalk.pos.x, SWalk.pos.z);
        try { co.pose = SBField.poses.kneel; } catch (e) {}
        coachAnswers(co, need);
      }, 7000);
    }, 4400 * speedMul());
  }

  function coachAnswers(co, need) {
    if (!onNeed) return;
    SWalk.raiseHand(false);
    sfx('yes');
    speak(G.name ? C.needs.thanks : C.needs.thanksNoName, { coach: co ? co.info.name : '' }, { emoji: '💙' });
    setTimeout(() => {
      if (!onNeed) return;
      speak(need.reply, { coach: co ? co.info.name : '' }, { emoji: '🧢' });
    }, 2200 * speedMul());
    setTimeout(() => {
      if (!onNeed) return;
      if (need.nilu) speak(need.nilu, null, { emoji: '🐘' });
      doNeed(need);
    }, 5000 * speedMul());

    /* asking is a win, and it gets a sticker like any other win */
    if (!G.stickers.includes('asking')) {
      G.stickers.push('asking');
      saveState();
      setTimeout(() => { if (onNeed) { sfx('star'); toast('⭐ ' + tr(C.needs.sticker), 4200); } }, 3400 * speedMul());
    }
  }

  /* ── what actually happens, per need ──────────────────────────────────── */
  function doNeed(need) {
    if (need.id === 'break') return goRest();
    if (need.id === 'water') return goWater(need);
    if (need.id === 'bathroom') return goBathroom(need);
    if (need.id === 'grownup') return goGrownUp(need);
    if (need.id === 'hurt') return goHurt(need);
    finishNeed();
  }

  /* walk somewhere with Nilu, then run `then` when we arrive (or time out) */
  function walkWithNilu(at, then, timeout) {
    const N = window.SBField && SBField.nilu;
    if (N) N.goTo(at.x + 1.8, at.z + 1.2, () => { try { N.lookAt(SWalk.pos.x, SWalk.pos.z); } catch (e) {} });
    SWalk.freeze(false);
    SWalk.walkTo(at.x, at.z);
    let t = 0;
    const iv = setInterval(() => {
      t += 0.25;
      if (!onNeed) { clearInterval(iv); return; }
      const p = SWalk.pos;
      if (Math.hypot(p.x - at.x, p.z - at.z) < 1.6 || t > (timeout || 16)) {
        clearInterval(iv);
        then();
      }
    }, 250);
  }

  /* 🪑 a break — the bench, a slow breath, and nothing to get right */
  function goRest() {
    const b = { x: L.bench.x + 2.2, z: L.bench.z + 0.9 };
    walkWithNilu(b, () => {
      if (!onNeed) return;
      SWalk.freeze(true);
      SWalk.teleport(L.bench.x + 2.2, L.bench.z + 0.35, Math.PI);
      SWalk.sit(true);
      speak(C.nilu.restIsOk, null, { emoji: '🐘' });
      const p = panel('sbRest',
        '<div class="sbBreathe" aria-hidden="true"></div>' +
        '<h2>🫧 ' + tr(C.breakTime.breathe) + '</h2>' +
        '<p class="sbSub">' + tr(C.nilu.restIsOk) + '</p>' +
        '<button class="sbBig" id="sbRestGo">' + tr(C.breakTime.ready) + '</button>' +
        '<button class="sbLink" id="sbRestStay">' + tr(C.breakTime.stayLonger) + '</button>');
      p.classList.add('sbRestPanel');
      document.getElementById('sbRestGo').addEventListener('click', () => { sfx('yes'); finishNeed(); });
      document.getElementById('sbRestStay').addEventListener('click', () => {
        sfx('tap'); p._close();
        speak(C.nilu.waiting, null, { emoji: '🐘' });
        toast(tr(C.breakTime.stayLonger), 3000);
      });
    });
  }

  /* 💧 water — walk to the cooler by the dugout and have a drink */
  function goWater(need) {
    const at = { x: L.water.x + 1.4, z: L.water.z + 1.4 };
    walkWithNilu(at, () => {
      if (!onNeed) return;
      SWalk.freeze(true);
      SWalk.facing(L.water.x, L.water.z);
      sfx('pop');
      SWalk.showCard('💧', tr(need.label), tr(need.done || need.nilu), {
        sticky: true, btn: tr(C.breakTime.ready), onDone: finishNeed,
      });
    });
  }

  /* 🚻 the bathroom — Coach AJ walks with you, and practice waits */
  function goBathroom(need) {
    const at = { x: L.dugout.x - 4.5, z: L.dugout.z + 6.5 };
    const co = needCoach;
    if (co) { co.pose = null; co.goTo(at.x + 1.6, at.z + 0.6); }
    walkWithNilu(at, () => {
      if (!onNeed) return;
      SWalk.freeze(true);
      SWalk.showCard('🚻', tr(need.label), tr(need.done || ''), {
        sticky: true, btn: tr(C.breakTime.ready), onDone: finishNeed,
      });
    });
  }

  /* 👨‍👩‍👧 find my grown-up — they're in the seats, and they wave back */
  function goGrownUp(need) {
    const stands = { x: 0, y: 2.6, z: 14.5 };
    try { SBField.waveFromStands(7); } catch (e) {}
    SWalk.freeze(true);
    SWalk.facing(stands.x, stands.z);
    /* Frame the SEATS, not the middle distance — the whole point is that the
       child sees their grown-up stand up and wave. Looking back from the
       field, so the stands fill the top of the frame above any card. */
    SWalk.lockCam({ x: stands.x, y: 2.2, z: 13.2, theta: Math.PI, phi: 1.22, radius: 11 });
    setTimeout(() => {
      if (!onNeed) return;
      SWalk.showCard('👋', tr(need.label), tr(need.done || need.nilu), {
        sticky: true, btn: tr(C.breakTime.ready),
        onDone: () => { try { SWalk.lockCam(null); } catch (e) {} finishNeed(); },
      });
    }, 4200 * speedMul());
  }

  /* 🤕 something hurts — always believed, always their choice what happens next */
  function goHurt(need) {
    SWalk.freeze(true);
    const p = panel('sbHurt',
      '<h2>🤕 ' + tr(need.label) + '</h2>' +
      '<p class="sbSub">' + fill(tr(need.reply)) + '</p>' +
      '<button class="sbBig" id="sbHurtRest">' + tr(need.restBtn) + '</button>' +
      '<button class="sbBig alt" id="sbHurtGo">' + tr(need.goBtn) + '</button>');
    document.getElementById('sbHurtRest').addEventListener('click', () => {
      sfx('tap'); p._close(); goRest();
    });
    document.getElementById('sbHurtGo').addEventListener('click', () => {
      sfx('yes'); p._close(); finishNeed();
    });
  }

  /* ── back to practice, exactly where we left it ───────────────────────── */
  function finishNeed() {
    for (const id of ['sbRest', 'sbHurt', 'sbNeeds']) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }
    if (!onNeed) return;
    onNeed = false;
    const need = activeNeed;
    activeNeed = null;
    SWalk.sit(false);
    SWalk.raiseHand(false);
    SWalk.lockCam(null);
    SWalk.freeze(false);
    if (needCoach) {
      const co = needCoach;
      co.pose = null;
      if (co.home) co.goTo(co.home.x, co.home.z, () => { try { co.lookAt(L.home.x, L.home.z); } catch (e) {} });
    }
    needCoach = null;
    /* walk back to where practice was happening — never make them re-navigate */
    if (returnTo && need && need.id !== 'break') SWalk.walkTo(returnTo.x, returnTo.z);
    returnTo = null;
    sfx('yes');
    speak(G.name ? C.breakTime.back : C.breakTime.backNoName, null, { emoji: '💙' });
    try { window.SBGear && SBGear.resume && SBGear.resume(); } catch (e) {}
    try { window.SBDrills && SBDrills.resume && SBDrills.resume(); } catch (e) {}
    try { window.SBTeam && SBTeam.resume && SBTeam.resume(); } catch (e) {}
    try { window.SBGame && SBGame.resume && SBGame.resume(); } catch (e) {}
  }
  S.endBreak = finishNeed;
  S.finishNeed = finishNeed;

  /* ══════════════════════════════════════════════ today's teammates
     Four kids from the roster, redrawn every session so practice never feels
     like the same four faces. Two rules, both of which matter:
       · the child's OWN name never appears on somebody else
       · no duplicates — each name is cast at most once
     Regulars (the ones who actually turn up most weeks) get most of the
     spots, with one from the wider squad so it stays fresh. */
  function shuffled(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }

  function castTeammates() {
    const roster = (C.roster || []).filter((r) => r && r.name);
    const mine = String(G.name || '').trim().toLowerCase();
    const pool = roster.filter((r) => r.name.trim().toLowerCase() !== mine);
    const regulars = shuffled(pool.filter((r) => r.regular));
    const others = shuffled(pool.filter((r) => !r.regular));
    /* three regulars and one from the wider squad, then shuffled again so the
       new face isn't always standing in the same spot in the line */
    const pick = regulars.slice(0, 3).concat(others.slice(0, 1));
    while (pick.length < 4 && regulars.length + others.length > pick.length) {
      const rest = regulars.concat(others).filter((r) => pick.indexOf(r) < 0);
      if (!rest.length) break;
      pick.push(rest[0]);
    }
    const names = shuffled(pick).slice(0, 4).map((r) => r.name);
    try { SBField.castMates(names); } catch (e) {}
    return names;
  }
  S.castTeammates = castTeammates;

  /* ══════════════════════════════════════════════════════ Coach AJ
     He opens the session, introduces the other two coaches, teaches the
     safety rules, works the bases, calls the line-up and answers a raised
     hand. Not a rank — just the coach a child is pointed at when they need
     a person rather than a skill. */
  S.coach = (id) => { try { return SBField.coaches[id] || null; } catch (e) { return null; } };
  S.aj = () => S.coach(C.aj.id);

  /* Walk a coach to a spot and then continue — but NEVER let the walk itself
     be able to block the game. If he can't get there (something in the way, a
     tab that was backgrounded mid-stride, a position we didn't anticipate) we
     put him there and carry on. A child must never be left standing with their
     hand up waiting for a coach who is never going to arrive. */
  function coachWalksTo(co, x, z, then, maxMs) {
    if (!co) { if (then) then(); return; }
    let done = false;
    const finish = () => { if (done) return; done = true; if (then) then(); };
    co.goTo(x, z, finish);
    setTimeout(() => {
      if (done) return;
      try { co.stop(); co.place(x, z, co.ry); } catch (e) {}
      finish();
    }, (maxMs || 6000) * speedMul());
  }
  S.coachWalksTo = coachWalksTo;

  /* walk Coach AJ over to the child, say some lines, send him back */
  S.ajSays = function (lines, done, opts) {
    opts = opts || {};
    const co = S.aj();
    if (!co) {
      /* no coach in the scene: still say it, still finish */
      (lines || []).forEach((l, i) => setTimeout(() => speak(l, { coach: 'Coach AJ' }, { emoji: '🧢' }), i * 4200 * speedMul()));
      setTimeout(() => done && done(), ((lines || []).length * 4200 + 600) * speedMul());
      return;
    }
    const p = SWalk.pos;
    const a = Math.atan2(p.x - co.x, p.z - co.z);
    co.pose = null;
    coachWalksTo(co, p.x - Math.sin(a) * 2.3, p.z - Math.cos(a) * 2.3, () => {
      co.lookAt(SWalk.pos.x, SWalk.pos.z);
      if (opts.kneel) { try { co.pose = SBField.poses.kneel; } catch (e) {} }
      (lines || []).forEach((l, i) => setTimeout(() => {
        co.lookAt(SWalk.pos.x, SWalk.pos.z);
        speak(l, { coach: co.info.name }, { emoji: '🧢' });
      }, i * 4400 * speedMul()));
      setTimeout(() => {
        co.pose = null;
        if (!opts.stay && co.home) co.goTo(co.home.x, co.home.z, () => { try { co.lookAt(L.home.x, L.home.z); } catch (e) {} });
        if (done) done();
      }, ((lines || []).length * 4400 + 900) * speedMul());
    });
  };

  function ajIntro(done) {
    /* a child who is past Level 1 has met him already — keep it short */
    const first = G.level === 'gear';
    const lines = first
      ? [C.aj.welcome, C.aj.whoIsWho, C.aj.anyProblem]
      : [C.aj.sendTo];
    S.ajSays(lines, done);
  }
  S.ajIntro = ajIntro;

  function nearestCoach() {
    const CF = window.SBField && SBField.coaches;
    if (!CF) return null;
    const p = SWalk.pos;
    let best = null, bd = 1e9;
    for (const id in CF) {
      const c = CF[id];
      const d = Math.hypot(c.x - p.x, c.z - p.z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }
  S.nearestCoach = nearestCoach;

  /* ═══════════════════════════════════════════ progress & level routing */
  S.rep = function (skill) {
    G.reps[skill] = (G.reps[skill] || 0) + 1;
    saveState();
    return G.reps[skill];
  };
  S.reps = (skill) => G.reps[skill] || 0;

  S.sticker = function (id, label) {
    if (G.stickers.includes(id)) return false;
    G.stickers.push(id);
    saveState();
    sfx('star');
    toast('⭐ ' + label, 4200);
    return true;
  };

  S.unlock = function (id) {
    if (G.open[id]) return false;
    G.open[id] = 1;
    saveState();
    refreshStrip();
    sfx('star');
    toast(fill(tr(C.ui.unlocked), { level: levelName(id) }), 4200);
    return true;
  };

  /* where each level happens, and who runs it */
  const WHERE = {
    gear:  { at: () => L.rack, coach: null },      // Nilu leads this one
    throw: { at: () => L.throwPlayer, coach: 'scott' },
    pitch: { at: () => L.pitchPlayer, coach: 'sam' },
    field: { at: () => L.fieldPlayer, coach: 'scott' },
    bat:   { at: () => L.boxR, coach: 'sam' },
    run:   { at: () => L.home, coach: 'aj' },   // Coach AJ works the bases
    team:  { at: () => L.lineUp[2], coach: 'aj' },
    game:  { at: () => L.home, coach: 'aj' },
  };
  S.where = WHERE;

  function goToLevel(id) {
    if (!G.open[id]) { toast(tr(C.ui.locked), 2600); return false; }
    voiceClear();                     // nothing from the last level talks over the new one
    G.level = id;
    saveState();
    refreshStrip();
    /* tell whoever owns this level to take over */
    try { window.SBGear && SBGear.leave && SBGear.leave(); } catch (e) {}
    try { window.SBDrills && SBDrills.leave && SBDrills.leave(); } catch (e) {}
    try { window.SBTeam && SBTeam.leave && SBTeam.leave(); } catch (e) {}
    try { window.SBGame && SBGame.leave && SBGame.leave(); } catch (e) {}
    SWalk.clearSpots();
    startLevel(id);
    return true;
  }
  S.goToLevel = goToLevel;

  function startLevel(id) {
    /* Practice begins the way practice begins: the whistle and the line-up.
       Once per level per session — this is the routine that actually needs
       rehearsing, so it is not a one-off lesson tucked in at the end. */
    const proceed = () => beginLevel(id);
    if (window.SBTeam && SBTeam.lineUpFor) SBTeam.lineUpFor(id, proceed);
    else proceed();
  }

  function beginLevel(id) {
    const w = WHERE[id];
    const N = window.SBField && SBField.nilu;
    const CF = window.SBField && SBField.coaches;
    const spot = w ? w.at() : L.home;

    /* Nilu always walks ahead to where the child is going */
    if (N) {
      N.goTo(spot.x + 2.0, spot.z + 1.6, () => { try { N.lookAt(SWalk.pos.x, SWalk.pos.z); } catch (e) {} });
    }
    if (w && w.coach && CF && CF[w.coach]) {
      speak(C.ui.goTo, { coach: CF[w.coach].info.name }, { emoji: levelEmoji(id) });
    } else {
      cue(levelName(id), levelEmoji(id));
    }

    /* hand off — each layer registers itself under its level id */
    if (id === 'gear' && window.SBGear) { SBGear.start(); return; }
    if (id === 'team' && window.SBTeam && SBTeam.start()) return;
    if (id === 'game' && window.SBGame && SBGame.start()) return;
    if (window.SBDrills && SBDrills.start && SBDrills.start(id)) return;
    /* nothing owns this level yet: leave the child free-roaming, never stuck */
    speak(C.ui.comingSoon, null, { emoji: levelEmoji(id) });
  }
  S.startLevel = startLevel;

  /* ═════════════════════════════════════════════════════════════ start */
  S.init = function (o) {
    o = o || {};
    if (o.K) K = o.K;
    C = window.SBContent;
    L = window.SBField && SBField.L;
    if (!C || !L) return false;
    loadState();
    buildChrome();
    return true;
  };

  /* called from ABEKit onStart — the child has pressed ▶️ Play */
  S.begin = function () {
    /* re-read the saves now that the kit definitely has its slug — this module
       must survive being init()'d in either order (see index.html) */
    loadState();
    try { SWalk.setHand(G.hand); } catch (e) {}
    refreshStrip();
    showChrome(true);
    /* Nilu opens every session — she is the narrator of this whole game. On a
       child's FIRST practice she also teaches the one thing that matters most:
       how to ask a grown-up for what you need. */
    const firstEver = !G.onboarded;
    const go = () => {
      G.onboarded = 1;
      saveState();
      refreshStrip();
      castTeammates();          // now that we know the child's own name
      /* A child's FIRST practice gets the whole welcome: who Nilu is, who to
         ask for what, and Coach AJ coming over to introduce the coaches.
         After that, keep it short — every session already opens with a whistle
         and a line-up, which is the real introduction. */
      const beats = firstEver
        ? [G.name ? C.start.welcome : C.start.welcomeNoName, C.nilu.stayWithYou,
           C.nilu.whoToAsk, C.nilu.howToAsk, C.nilu.tapToAsk]
        : [G.name ? C.start.welcome : C.start.welcomeNoName];
      beats.forEach((b, i) => setTimeout(() => speak(b, null, { emoji: '🐘' }), i * 4400 * speedMul()));
      setTimeout(() => { try { SWalk.hint(tr(C.start.firstHint), 5200); } catch (e) {} }, 2600 * speedMul());
      if (firstEver) {
        setTimeout(() => { try { SWalk.hint(tr(C.start.breakHint), 5600); } catch (e) {} },
                   (beats.length - 1) * 4400 * speedMul());
      }
      const after = beats.length * 4400 + 400;
      if (firstEver) {
        /* Coach AJ comes over and opens practice */
        setTimeout(() => ajIntro(() => goToLevel(G.open[G.level] ? G.level : 'gear')), after * speedMul());
      } else {
        setTimeout(() => goToLevel(G.open[G.level] ? G.level : 'gear'), after * speedMul());
      }
    };
    if (G.onboarded) { go(); return; }
    setTimeout(() => askName(() => askHand(go)), 500);
  };

  S.tick = function (dt) {
    /* the schedule strip only needs refreshing when something changes, and
       the break flow drives itself on timers — nothing to do per frame yet */
  };

  window.SBLevels = S;
})();
