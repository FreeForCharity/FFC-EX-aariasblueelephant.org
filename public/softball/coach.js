/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — COACH MODE  (window.SBCoach)

   For Coach AJ, Coach Scott, Coach Sam and any parent. Grown-up gated, so a
   child tapping around can't wander in.

   It shows four things:
     · who is playing, and which hand they throw with (changeable)
     · which skills they have actually practised, and how many reps
     · self-advocacy — how many times they asked for what they needed. This is
       framed as wins, because it is, and it is never shown to the child as a
       problem
     · 📋 THE CUE SHEET: every word the game says, station by station, read
       straight out of content.js. Read it on a phone at practice and check it
       against what you are actually saying. If it's wrong, edit content.js —
       nothing else needs to change.

   And it can share a one-page practice card matching where the child is now,
   so a parent can run the same station at home.

   NOTHING here leaves the device. No names, no scores, no accounts, no
   network. The kit's anonymous play tally sends a game slug and a number of
   seconds, and nothing else — see gamekit/kit.js.
   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const S = {};
  let K = window.ABEKit || {};
  let C = null;

  const tr = (o) => { try { return (o && typeof o === 'object') ? K.tr(o.en, o.es) : (o || ''); } catch (e) { return (o && o.en) || ''; } };
  const sfx = (n) => { try { K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} };
  const LV = () => window.SBLevels;
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ══════════════════════════════════════════════════ the grown-up gate */
  S.open = function () {
    C = window.SBContent;
    if (!C) return;
    sfx('tap');
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 4 + Math.floor(Math.random() * 6);
    const p = LV().panel('sbGate',
      '<h2>🧢 ' + tr(C.coachMode.title) + '</h2>' +
      '<p class="sbSub">' + LV().fill(tr(C.coachMode.gate), { a: a, b: b }) + '</p>' +
      '<input id="sbGateIn" type="number" inputmode="numeric" autocomplete="off" aria-label="' +
        esc(LV().fill(tr(C.coachMode.gate), { a: a, b: b })) + '">' +
      '<button class="sbBig" id="sbGateOk">✔️</button>' +
      '<button class="sbLink" id="sbGateNo">' + tr(C.coachMode.close) + '</button>');
    const input = document.getElementById('sbGateIn');
    const go = () => {
      if (Number((input && input.value) || 0) !== a + b) {
        sfx('no');
        const sub = p.querySelector('.sbSub');
        if (sub) sub.textContent = tr(C.coachMode.gateWrong);
        if (input) { input.value = ''; input.focus(); }
        return;
      }
      p._close();
      panel();
    };
    document.getElementById('sbGateOk').addEventListener('click', go);
    document.getElementById('sbGateNo').addEventListener('click', () => { sfx('tap'); p._close(); });
    if (input) {
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      setTimeout(() => { try { input.focus(); } catch (e) {} }, 250);
    }
  };

  /* ══════════════════════════════════════════════════════ the main panel

     Three tabs, because one long column of unlabelled buttons is what made the
     first version unreadable — you could not tell what was a reading, what was
     a setting, and what would move the child somewhere:
       📊 Today    what is happening right now — read only, nothing to break
       🎚️ Set up   every knob, each with a line saying what it actually does
       🎯 Stations where to send the child next
     Every control saves the moment it is tapped. There is no OK button, which
     is deliberate: a coach reading this on a phone mid-practice should never
     lose a change by closing the panel. */
  const SKILLS = ['throw', 'pitch', 'field', 'bat', 'box', 'drop', 'run'];
  let TAB = 'today';

  /* which station is on now, and what follows it */
  function nowNext() {
    const G = LV().G;
    const L = C.levels || [];
    let i = L.findIndex((l) => l.id === G.level);
    if (i < 0) i = 0;
    return { now: L[i] || null, next: L[i + 1] || null };
  }

  function todayHTML() {
    const G = LV().G;
    const M = C.coachMode;
    const nn = nowNext();

    const openCount = (C.levels || []).filter((l) => G.open[l.id]).length;
    const dots = (C.levels || []).map((l) =>
      '<span class="sbDot' + (G.open[l.id] ? ' on' : '') + (l.id === G.level ? ' now' : '') +
      '" title="' + esc(tr(l.name)) + '">' + l.emoji + '</span>').join('');

    const rows = SKILLS.map((id) => {
      const d = C.drills[id];
      if (!d) return '';
      const n = G.reps[id] || 0;
      let t = 3;
      try { t = SBDrills.repTarget(id); } catch (e) {}
      const done = n >= t;
      return '<div class="sbCoachRow' + (n > 0 ? ' done' : '') + '">' +
        '<span class="sbCoachEmoji">' + d.emoji + '</span>' +
        '<span class="sbCoachName">' + esc(tr(d.title)) + '</span>' +
        '<span class="sbCoachVal">' + (n > 0 ? LV().fill(tr(M.turnsOf), { n: n, t: t }) : tr(M.notYet)) +
        (done ? ' ✓' : '') + '</span></div>';
    }).join('');

    const needTotal = Object.keys(G.needs || {}).reduce((s, k) => s + (G.needs[k] || 0), 0);
    const needRows = (C.needs.items || []).map((it) => {
      const n = (G.needs || {})[it.id] || 0;
      return n ? '<span class="sbNeedTally">' + it.emoji + ' ' + n + '</span>' : '';
    }).join('');

    return '<div class="sbCoachHead">' +
        '<div><b>' + tr(M.player) + ':</b> ' + esc(G.name || '—') + '</div>' +
        '<div><b>' + tr(M.hand) + ':</b> ' + tr(G.hand === 'L' ? M.handL : M.handR) + '</div>' +
      '</div>' +
      (G.finished
        ? '<div class="sbNowNext"><div class="sbNowBig">' + tr(M.allStations) + '</div></div>'
        : '<div class="sbNowNext">' +
            '<div class="sbNNRow"><span class="sbNNLbl">' + tr(M.nowAt) + '</span>' +
              '<span class="sbNNVal">' + (nn.now ? nn.now.emoji + ' ' + esc(tr(nn.now.name)) : '—') + '</span></div>' +
            (nn.next ? '<div class="sbNNRow next"><span class="sbNNLbl">' + tr(M.upNext) + '</span>' +
              '<span class="sbNNVal">' + nn.next.emoji + ' ' + esc(tr(nn.next.name)) + '</span></div>' : '') +
          '</div>') +
      '<div class="sbUnlocked">' + LV().fill(tr(M.unlocked), { a: openCount, b: (C.levels || []).length }) + '</div>' +
      '<div class="sbDots">' + dots + '</div>' +
      '<h3 class="sbCoachH3">' + tr(M.progress) + '</h3>' + rows +
      '<h3 class="sbCoachH3">' + tr(M.selfAdvocacy) + '</h3>' +
      '<div class="sbCoachAdv">' +
        '<div class="sbAdvBig">' + LV().fill(tr(C.needs.tally), { n: needTotal }) + '</div>' +
        '<div class="sbAdvRow">' + (needRows || '—') + '</div>' +
      '</div>';
  }

  function setupHTML() {
    const G = LV().G;
    const M = C.coachMode;

    const stepRows = SKILLS.map((id) => {
      const d = C.drills[id];
      if (!d) return '';
      let t = 3, def = 3;
      try { t = SBDrills.repTarget(id); def = SBDrills.repDefault(id); } catch (e) {}
      return '<div class="sbStepRow">' +
        '<span class="sbCoachEmoji">' + d.emoji + '</span>' +
        '<span class="sbStepName">' + esc(tr(d.title)) +
          '<small>' + (t === def ? tr(M.isDefault) : tr(M.changed)) + '</small></span>' +
        '<span class="sbStepper">' +
          '<button class="sbRepsBtn" data-rep="' + id + '" data-d="-1" aria-label="−">−</button>' +
          '<b class="sbStepVal">' + t + '</b>' +
          '<button class="sbRepsBtn" data-rep="' + id + '" data-d="1" aria-label="+">+</button>' +
        '</span></div>';
    }).join('');

    return '<p class="sbSub">' + tr(M.setupIntro) + '</p>' +
      '<h3 class="sbCoachH3">' + tr(M.perStation) + '</h3>' +
      '<p class="sbSub sbRepsSub">' + tr(M.perStationSub) + '</p>' +
      stepRows +
      '<div class="sbStepRow allRow">' +
        '<span class="sbCoachEmoji">🎚️</span>' +
        '<span class="sbStepName">' + tr(M.sameForAll) +
          '<small>' + (G.repTarget ? '' : tr(M.isDefault)) + '</small></span>' +
        '<span class="sbStepper">' +
          '<button class="sbRepsBtn" id="sbAllDown" aria-label="−">−</button>' +
          '<b class="sbStepVal">' + (G.repTarget ? G.repTarget : '—') + '</b>' +
          '<button class="sbRepsBtn" id="sbAllUp" aria-label="+">+</button>' +
        '</span></div>' +
      '<button class="sbLink" id="sbRepsReset">' + tr(M.backToWritten) + '</button>' +

      '<h3 class="sbCoachH3">' + tr(M.assist) + '</h3>' +
      '<p class="sbSub sbRepsSub">' + tr(M.assistWhat) + '</p>' +
      '<button class="kRow" id="sbCoachAssist">' + tr(M.assist) + ': <b>' +
        tr(G.assist ? M.assistOn : M.assistOff) + '</b></button>' +

      '<h3 class="sbCoachH3">' + tr(M.hand) + '</h3>' +
      '<p class="sbSub sbRepsSub">' + tr(M.handWhat) + '</p>' +
      '<button class="kRow" id="sbCoachHand">🤚 ' + tr(M.resetHand) + ' — <b>' +
        tr(G.hand === 'L' ? M.handL : M.handR) + '</b></button>' +

      '<h3 class="sbCoachH3">' + tr(M.outfield) + '</h3>' +
      '<p class="sbSub sbRepsSub">' + tr(M.outfieldWhat) + '</p>' +
      '<button class="kRow" id="sbCoachOutfield">' + tr(M.outfield) + ': <b>' +
        tr(G.outfieldOn ? M.outfieldOn : M.outfieldOff) + '</b></button>' +

      '<h3 class="sbCoachH3">♻️ ' + tr({ en: 'Start practice over', es: 'Empezar la práctica de nuevo' }) + '</h3>' +
      '<p class="sbSub sbRepsSub">' + tr(M.resetWhat) + '</p>' +
      '<button class="kRow" id="sbCoachReset">♻️ ' +
        tr({ en: 'Start practice over', es: 'Empezar la práctica de nuevo' }) + '</button>';
  }

  /* A child's own path stays in order on purpose — the same eight cards in the
     same order every time is most of why this game is calm. But a coach running
     one skill on a Saturday, or a kid who came to hit today, should not have to
     work through the gear round first. */
  function stationsHTML() {
    const G = LV().G;
    const M = C.coachMode;
    const cards = (C.levels || []).map((l) => {
      const open = !!G.open[l.id];
      const now = l.id === G.level;
      return '<button class="sbStationBtn' + (now ? ' now' : '') + (open ? ' open' : '') +
        '" data-lvl="' + l.id + '">' +
        '<span class="sbStationEmoji">' + l.emoji + '</span>' +
        '<span class="sbStationLbl">' + esc(tr(l.name)) + '</span>' +
        '<span class="sbStationState">' + (open ? '✓' : '🔒') + '</span></button>';
    }).join('');
    return '<p class="sbSub">' + tr(M.goStationSub) + '</p>' +
      '<div class="sbStationGrid">' + cards + '</div>' +
      '<button class="kRow" id="sbOpenAll">' + tr(M.openAll) + '</button>';
  }

  function panel() {
    const G = LV().G;
    const M = C.coachMode;

    const tabs = [['today', M.tabToday], ['setup', M.tabSetup], ['stations', M.tabStations]];
    const tabRow = tabs.map((x) =>
      '<button class="sbTab' + (TAB === x[0] ? ' on' : '') + '" data-tab="' + x[0] + '">' +
      tr(x[1]) + '</button>').join('');

    const body = TAB === 'setup' ? setupHTML() : TAB === 'stations' ? stationsHTML() : todayHTML();

    const p = LV().panel('sbCoach',
      '<h2>🧢 ' + tr(M.title) + '</h2>' +
      '<div class="sbTabs">' + tabRow + '</div>' +
      '<div class="sbTabBody">' + body + '</div>' +
      '<h3 class="sbCoachH3">' + tr(M.takeAway) + '</h3>' +
      '<button class="kRow" id="sbCoachCues">' + tr(M.cueSheet) + '</button>' +
      '<button class="kRow" id="sbCoachCard">' + tr(M.practiceCard) + '</button>' +
      '<p class="sbSub sbCoachNote">' + tr(M.note) + '</p>' +
      '<button class="sbBig" id="sbCoachDone">' + tr(M.close) + '</button>');

    const redraw = () => { p._close(); panel(); };

    p.querySelectorAll('.sbTab').forEach((b) => b.addEventListener('click', () => {
      TAB = b.dataset.tab; sfx('tap'); redraw();
    }));

    document.getElementById('sbCoachDone').addEventListener('click', () => { sfx('tap'); p._close(); });
    document.getElementById('sbCoachCues').addEventListener('click', () => { sfx('tap'); p._close(); cueSheet(); });
    document.getElementById('sbCoachCard').addEventListener('click', () => { sfx('tap'); sharePracticeCard(); });

    if (TAB === 'setup') {
      /* per-station ±. Stored only when it differs from what the drill was
         written with, so "as written" keeps meaning what it says even after a
         coach nudges a number up and back down again. */
      p.querySelectorAll('[data-rep]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.rep;
        let cur = 3, def = 3;
        try { cur = SBDrills.repTarget(id); def = SBDrills.repDefault(id); } catch (e) {}
        const next = Math.max(1, Math.min(9, cur + (+b.dataset.d)));
        G.repsBy = G.repsBy || {};
        if (next === def && !G.repTarget) delete G.repsBy[id];
        else G.repsBy[id] = next;
        LV().save(); sfx('tap'); redraw();
      }));
      const bumpAll = (d) => {
        G.repTarget = Math.max(0, Math.min(9, (G.repTarget || 0) + d));
        G.repsBy = {};                 // one number for everything means everything
        LV().save(); sfx('tap'); redraw();
      };
      document.getElementById('sbAllDown').addEventListener('click', () => bumpAll(-1));
      document.getElementById('sbAllUp').addEventListener('click', () => bumpAll(1));
      document.getElementById('sbRepsReset').addEventListener('click', () => {
        G.repTarget = 0; G.repsBy = {};
        LV().save(); sfx('yes'); redraw();
      });
      document.getElementById('sbCoachAssist').addEventListener('click', () => {
        G.assist = G.assist ? 0 : 1; LV().save(); sfx('tap'); redraw();
      });
      document.getElementById('sbCoachHand').addEventListener('click', () => {
        const h = G.hand === 'L' ? 'R' : 'L';
        G.hand = h; LV().save();
        try { SWalk.setHand(h); } catch (e) {}
        sfx('yes'); redraw();
      });
      document.getElementById('sbCoachOutfield').addEventListener('click', () => {
        G.outfieldOn = G.outfieldOn ? 0 : 1; LV().save(); sfx('tap'); redraw();
      });
      document.getElementById('sbCoachReset').addEventListener('click', () => { sfx('tap'); p._close(); confirmReset(); });
    }

    if (TAB === 'stations') {
      p.querySelectorAll('.sbStationBtn').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.lvl;
        sfx('yes');
        G.open[id] = 1;                 // opening it is the whole point
        LV().save();
        LV().refreshStrip();
        p._close();
        /* straight to the skill: they picked it deliberately, so skip the
           line-up and warm-up they'd otherwise sit through first */
        try { window.SBTeam && SBTeam.markLinedUp(id); } catch (e) {}
        try { LV().goToLevel(id); } catch (e) {}
      }));
      document.getElementById('sbOpenAll').addEventListener('click', () => {
        for (const l of (C.levels || [])) G.open[l.id] = 1;
        LV().save();
        LV().refreshStrip();
        sfx('star');
        try { K.toast(tr(M.openAllDone), 3200); } catch (e) {}
        redraw();
      });
    }
  }

  /* ══════════════════════════ 📋 the cue sheet — everything the game says */
  function cueSheet() {
    /* {coach} has to be substituted here or the sheet prints the token raw —
       and the coaches read this sheet to check our wording against theirs. Lines
       that belong to a named station pass that coach; Nilu's general lines have
       no one coach, so they get the generic word. */
    const anyCoach = tr({ en: 'the coach', es: 'el coach' });
    const fill = (s2, co) => LV().fill(tr(s2), { coach: co || anyCoach });
    const line = (a, b) => '<div class="sbCue2"><b>' + esc(a) + '</b>' + (b ? '<span>' + esc(b) + '</span>' : '') + '</div>';

    /* one entry per station, so the chips above can show them one at a time */
    const sections = [];
    const add = (id, emoji, title, body) => sections.push({ id: id, emoji: emoji, title: title, body: body });

    add('nilu', '🐘', tr({ en: 'Nilu', es: 'Nilu' }),
      Object.keys(C.nilu).map((k) => line(fill(C.nilu[k]))).join(''));

    add('aj', '🧢', 'Coach AJ',
      Object.keys(C.aj).filter((k) => k !== 'id').map((k) => line(fill(C.aj[k]))).join(''));

    add('needs', '🙋', tr(C.needs.title),
      line(fill(C.needs.how)) +
      (C.needs.items || []).map((it) =>
        line(it.emoji + ' ' + tr(it.label), fill(it.say) + '  →  ' + fill(it.reply))).join(''));

    add('gear', '🥎', tr({ en: 'The gear', es: 'El equipo' }),
      (C.gear || []).map((g) =>
        line(g.emoji + ' ' + tr(g.name), tr(g.whatFor) + (g.note ? ' · ' + fill(g.note) : ''))).join(''));

    add('safety', '🛟', tr({ en: 'Safety', es: 'Seguridad' }),
      (C.safety || []).map((r) => line(r.emoji + ' ' + tr(r.rule), tr(r.why))).join(''));

    for (const id of ['throw', 'pitch', 'field', 'bat', 'box', 'drop', 'run']) {
      const d = C.drills[id];
      if (!d) continue;
      const co = (C.coaches.find((c) => c.id === d.coach) || {}).name || '';
      let turns = 3;
      try { turns = SBDrills.repTarget(id); } catch (e) {}
      add(id, d.emoji, tr(d.title),
        line(tr(d.title) + ' — ' + co, LV().fill(tr(C.coachMode.reps), { n: turns })) +
        line(tr({ en: 'Intro', es: 'Introducción' }), fill(d.intro)) +
        d.steps.map((st, i) =>
          line((i + 1) + '. ' + fill(st.do, co),
               tr({ en: 'coach says', es: 'el coach dice' }) + ': ' + fill(st.show, co))).join('') +
        d.praise.map((pr) => line('⭐', fill(pr))).join('') +
        line(tr({ en: 'Finish', es: 'Cierre' }), fill(d.done)));
    }

    add('team', '👥', tr({ en: 'Team time', es: 'Trabajo en equipo' }),
      line(fill(C.team.whistle)) + line(fill(C.team.lineUpSay)) + line(fill(C.team.lineUpDo)) +
      line(fill(C.team.withNilu)) + line(fill(C.team.stretchIntro)) +
      (C.team.stretches || []).map((x) => line(x.emoji, tr(x.do))).join('') +
      line(fill(C.team.waterSay)) + line(fill(C.team.cheer)));

    add('game', '🏆', tr({ en: 'Game day', es: 'Día de juego' }),
      Object.keys(C.gameDay).map((k) => line(fill(C.gameDay[k]))).join(''));

    const html = sections.map((x) =>
      '<div data-secid="' + x.id + '"><h3 class="sbCoachH3">' + esc(x.emoji + ' ' + x.title) + '</h3>' +
      x.body + '</div>').join('');

    /* Station chips: the whole script at once is a wall. Pick one and read
       just that — which is how you'd actually check it before a session. */
    const chips = [{ id: 'all', label: tr(C.coachMode.cueAll), emoji: '📋' }]
      .concat(sections.map((x) => ({ id: x.id, label: x.title, emoji: x.emoji })));
    const chipRow = chips.map((c) =>
      '<button class="sbCueChip" data-sec="' + c.id + '">' + c.emoji + ' ' + esc(c.label) + '</button>').join('');

    const p = LV().panel('sbCues',
      '<h2>📋 ' + tr(C.coachMode.cueSheet) + '</h2>' +
      '<p class="sbSub">' + tr({
        en: 'Everything the game says. Wrong? Edit content.js — nothing else needs to change.',
        es: 'Todo lo que dice el juego. ¿Algo no cuadra? Edita content.js — no hace falta tocar nada más.',
      }) + '</p>' +
      '<div class="sbCueChips">' + chipRow + '</div>' +
      '<div class="sbCueSheet">' + html + '</div>' +
      '<button class="sbBig" id="sbCuesDone">' + tr(C.coachMode.close) + '</button>');
    p.querySelector('.sbPanelCard').classList.add('wide');
    const show = (id) => {
      p.querySelectorAll('.sbCueChip').forEach((c) => c.classList.toggle('on', c.dataset.sec === id));
      p.querySelectorAll('[data-secid]').forEach((sec) => {
        sec.style.display = (id === 'all' || sec.dataset.secid === id) ? '' : 'none';
      });
      const sheet = p.querySelector('.sbCueSheet');
      if (sheet) sheet.scrollTop = 0;
    };
    p.querySelectorAll('.sbCueChip').forEach((c) => c.addEventListener('click', () => { sfx('tap'); show(c.dataset.sec); }));
    show('all');
    document.getElementById('sbCuesDone').addEventListener('click', () => { sfx('tap'); p._close(); panel(); });
  }

  /* ══════════════════════════ 📤 the practice card a parent can take home */
  function practiceCardHTML() {
    const G = LV().G;
    const fill = (s) => LV().fill(tr(s));
    const level = G.level;
    const d = C.drills[level] || C.drills.throw;
    const co = (C.coaches.find((c) => c.id === d.coach) || {}).name || 'Coach AJ';
    const hand = tr(G.hand === 'L' ? C.coachMode.handL : C.coachMode.handR);
    const steps = d.steps.map((st, i) =>
      '<li><b>' + esc(fill(st.do)) + '</b><br><small>' + esc(fill(st.show)) + '</small></li>').join('');
    return '<!doctype html><html lang="' + (K.es && K.es() ? 'es' : 'en') + '"><meta charset="utf-8">' +
      '<title>' + esc(tr(d.title)) + ' — ' + esc(G.name || '') + '</title>' +
      '<style>body{font:16px/1.5 system-ui,sans-serif;max-width:680px;margin:24px auto;padding:0 18px;color:#25324a}' +
      'h1{font-size:26px;margin:0 0 2px}h2{font-size:18px;color:#2f6fb5;margin:22px 0 6px}' +
      '.meta{color:#5a6a80;font-size:14px;margin-bottom:14px}ol{padding-left:22px}li{margin:10px 0}' +
      'small{color:#5a6a80}.box{background:#eef4ff;border-radius:12px;padding:12px 16px;margin:14px 0}' +
      'footer{margin-top:28px;font-size:12px;color:#5a6a80;border-top:1px solid #dde}' +
      '@media print{body{margin:0}}</style>' +
      '<h1>' + d.emoji + ' ' + esc(tr(d.title)) + '</h1>' +
      '<div class="meta">' + esc(G.name || '') + ' · ' + esc(hand) + ' · ' + esc(co) + '</div>' +
      '<div class="box">' + esc(fill(d.intro)) + '</div>' +
      '<h2>' + esc(tr({ en: 'One step at a time', es: 'Un paso a la vez' })) + '</h2><ol>' + steps + '</ol>' +
      '<h2>' + esc(tr({ en: 'Things to say', es: 'Cosas para decir' })) + '</h2><ul>' +
      d.praise.map((x) => '<li>' + esc(fill(x)) + '</li>').join('') + '</ul>' +
      '<div class="box">🙋 ' + esc(fill(C.nilu.howToAsk)) + ' ' + esc(fill(C.nilu.askAnyTime)) + '</div>' +
      '<footer><p>Aaria\'s Blue Elephant · aariasblueelephant.org · ' +
      esc(tr(C.gameDay.medalSub)) + '<br>Built by Aaria and her Friends 💙</p></footer></html>';
  }

  async function sharePracticeCard() {
    const G = LV().G;
    const name = 'practice-card.' + (G.level || 'softball') + '.html';
    const blob = new Blob([practiceCardHTML()], { type: 'text/html' });
    try {
      if (K.shareFile && await K.shareFile(name, blob)) { sfx('yes'); return; }
    } catch (e) {}
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      sfx('yes');
      K.toast(tr({ en: '📤 Practice card saved!', es: '📤 ¡Tarjeta de práctica guardada!' }), 3200);
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════ start practice over */
  function confirmReset() {
    const p = LV().panel('sbReset',
      '<h2>♻️ ' + tr({ en: 'Start practice over?', es: '¿Empezar la práctica de nuevo?' }) + '</h2>' +
      '<p class="sbSub">' + tr({
        en: 'This clears every level and every sticker for this player. Their name and throwing hand are kept.',
        es: 'Esto borra todos los niveles y todas las calcomanías de este jugador. Se conservan su nombre y su mano de lanzar.',
      }) + '</p>' +
      '<button class="sbBig" id="sbResetYes">' + tr({ en: '♻️ Yes, start over', es: '♻️ Sí, empezar de nuevo' }) + '</button>' +
      '<button class="sbLink" id="sbResetNo">' + tr(C.coachMode.close) + '</button>');
    document.getElementById('sbResetNo').addEventListener('click', () => { sfx('tap'); p._close(); panel(); });
    document.getElementById('sbResetYes').addEventListener('click', () => {
      const G = LV().G;
      G.level = 'gear'; G.open = { gear: 1 }; G.reps = {}; G.stickers = []; G.finished = 0;
      LV().save();
      try { window.SBGear && SBGear.forget(); } catch (e) {}
      try { window.SBTeam && SBTeam.forgetLineUps(); } catch (e) {}
      LV().refreshStrip();
      sfx('star');
      p._close();
      try { LV().goToLevel('gear'); } catch (e) {}
    });
  }

  /* the practice card, as HTML — named for what it actually returns */
  S.practiceCardHTML = () => { C = window.SBContent; return practiceCardHTML(); };
  window.SBCoach = S;
})();
