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

  /* ══════════════════════════════════════════════════════ the main panel */
  function panel() {
    const G = LV().G;
    const M = C.coachMode;

    const skills = ['throw', 'pitch', 'field', 'bat', 'box', 'run'];
    const rows = skills.map((id) => {
      const d = C.drills[id];
      if (!d) return '';
      const n = G.reps[id] || 0;
      const done = n > 0;
      return '<div class="sbCoachRow' + (done ? ' done' : '') + '">' +
        '<span class="sbCoachEmoji">' + d.emoji + '</span>' +
        '<span class="sbCoachName">' + esc(tr(d.title)) + '</span>' +
        '<span class="sbCoachVal">' + (done ? LV().fill(tr(M.reps), { n: n }) : tr(M.notYet)) + '</span></div>';
    }).join('');

    const needTotal = Object.keys(G.needs || {}).reduce((s, k) => s + (G.needs[k] || 0), 0);
    const needRows = (C.needs.items || []).map((it) => {
      const n = (G.needs || {})[it.id] || 0;
      if (!n) return '';
      return '<span class="sbNeedTally">' + it.emoji + ' ' + n + '</span>';
    }).join('');

    const p = LV().panel('sbCoach',
      '<h2>🧢 ' + tr(M.title) + '</h2>' +
      '<div class="sbCoachHead">' +
        '<div><b>' + tr(M.player) + ':</b> ' + esc(G.name || '—') + '</div>' +
        '<div><b>' + tr(M.hand) + ':</b> ' + tr(G.hand === 'L' ? M.handL : M.handR) + '</div>' +
      '</div>' +
      '<h3 class="sbCoachH3">' + tr(M.progress) + '</h3>' + rows +
      '<h3 class="sbCoachH3">' + tr(M.selfAdvocacy) + '</h3>' +
      '<div class="sbCoachAdv">' +
        '<div class="sbAdvBig">' + LV().fill(tr(C.needs.tally), { n: needTotal }) + '</div>' +
        '<div class="sbAdvRow">' + (needRows || '—') + '</div>' +
      '</div>' +
      '<button class="kRow" id="sbCoachAssist">' + tr(M.assist) + ': <b>' +
        tr(G.assist ? M.assistOn : M.assistOff) + '</b></button>' +
      '<button class="kRow" id="sbCoachHand">🤚 ' + tr(M.resetHand) + '</button>' +
      '<button class="kRow" id="sbCoachCues">' + tr(M.cueSheet) + '</button>' +
      '<button class="kRow" id="sbCoachCard">' + tr(M.practiceCard) + '</button>' +
      '<button class="kRow" id="sbCoachReset">♻️ ' + tr({ en: 'Start practice over', es: 'Empezar la práctica de nuevo' }) + '</button>' +
      '<p class="sbSub sbCoachNote">' + tr(M.note) + '</p>' +
      '<button class="sbBig" id="sbCoachDone">' + tr(M.close) + '</button>');

    document.getElementById('sbCoachDone').addEventListener('click', () => { sfx('tap'); p._close(); });
    document.getElementById('sbCoachAssist').addEventListener('click', () => {
      G.assist = G.assist ? 0 : 1; LV().save(); sfx('tap'); p._close(); panel();
    });
    document.getElementById('sbCoachHand').addEventListener('click', () => {
      const h = G.hand === 'L' ? 'R' : 'L';
      G.hand = h; LV().save();
      try { SWalk.setHand(h); } catch (e) {}
      sfx('yes'); p._close(); panel();
    });
    document.getElementById('sbCoachCues').addEventListener('click', () => { sfx('tap'); p._close(); cueSheet(); });
    document.getElementById('sbCoachCard').addEventListener('click', () => { sfx('tap'); sharePracticeCard(); });
    document.getElementById('sbCoachReset').addEventListener('click', () => { sfx('tap'); p._close(); confirmReset(); });
  }

  /* ══════════════════════════ 📋 the cue sheet — everything the game says */
  function cueSheet() {
    const fill = (s) => LV().fill(tr(s));
    const sec = (title, body) => '<h3 class="sbCoachH3">' + esc(title) + '</h3>' + body;
    const line = (a, b) => '<div class="sbCue2"><b>' + esc(a) + '</b>' + (b ? '<span>' + esc(b) + '</span>' : '') + '</div>';

    let html = '';

    html += sec('🐘 ' + tr({ en: 'Nilu (the narrator)', es: 'Nilu (la narradora)' }),
      Object.keys(C.nilu).map((k) => line(fill(C.nilu[k]))).join(''));

    html += sec('🧢 Coach AJ',
      Object.keys(C.aj).filter((k) => k !== 'id').map((k) => line(fill(C.aj[k]))).join(''));

    html += sec('🙋 ' + tr(C.needs.title),
      line(fill(C.needs.how)) +
      (C.needs.items || []).map((it) =>
        line(it.emoji + ' ' + tr(it.label), fill(it.say) + '  →  ' + fill(it.reply))).join(''));

    html += sec('🥎 ' + tr({ en: 'The gear', es: 'El equipo' }),
      (C.gear || []).map((g) =>
        line(g.emoji + ' ' + tr(g.name), tr(g.whatFor) + (g.note ? ' · ' + fill(g.note) : ''))).join(''));

    html += sec('🛟 ' + tr({ en: 'Safety', es: 'Seguridad' }),
      (C.safety || []).map((r) => line(r.emoji + ' ' + tr(r.rule), tr(r.why))).join(''));

    for (const id of ['throw', 'pitch', 'field', 'bat', 'box', 'run']) {
      const d = C.drills[id];
      if (!d) continue;
      const co = (C.coaches.find((c) => c.id === d.coach) || {}).name || '';
      html += sec(d.emoji + ' ' + tr(d.title) + ' — ' + co,
        line(tr({ en: 'Intro', es: 'Introducción' }), fill(d.intro)) +
        d.steps.map((st, i) =>
          line((i + 1) + '. ' + fill(st.do), tr({ en: 'coach says', es: 'el coach dice' }) + ': ' + fill(st.show))).join('') +
        d.praise.map((pr) => line('⭐', fill(pr))).join('') +
        line(tr({ en: 'Finish', es: 'Cierre' }), fill(d.done)));
    }

    html += sec('👥 ' + tr({ en: 'Team time', es: 'Trabajo en equipo' }),
      line(fill(C.team.whistle)) + line(fill(C.team.lineUpSay)) + line(fill(C.team.lineUpDo)) +
      line(fill(C.team.stretchIntro)) +
      (C.team.stretches || []).map((x) => line(x.emoji, tr(x.do))).join('') +
      line(fill(C.team.waterSay)) + line(fill(C.team.cheer)));

    html += sec('🏆 ' + tr({ en: 'Game day', es: 'Día de juego' }),
      Object.keys(C.gameDay).map((k) => line(fill(C.gameDay[k]))).join(''));

    const p = LV().panel('sbCues',
      '<h2>📋 ' + tr(C.coachMode.cueSheet) + '</h2>' +
      '<p class="sbSub">' + tr({
        en: 'Everything the game says, in order. Wrong? Edit content.js — nothing else needs to change.',
        es: 'Todo lo que dice el juego, en orden. ¿Algo no cuadra? Edita content.js — no hace falta tocar nada más.',
      }) + '</p>' +
      '<div class="sbCueSheet">' + html + '</div>' +
      '<button class="sbBig" id="sbCuesDone">' + tr(C.coachMode.close) + '</button>');
    p.querySelector('.sbPanelCard').classList.add('wide');
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

  S.cueSheetHTML = () => { C = window.SBContent; return practiceCardHTML(); };
  window.SBCoach = S;
})();
