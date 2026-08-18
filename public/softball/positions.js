/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — LEARN THE POSITIONS  (window.SBPositions)

   A tap-to-learn field diagram, opened any time from the 🧭 Positions button.
   Six infield spots always show — pitcher, catcher, first, second, third,
   shortstop. The three outfield spots (left, center, right field) only show
   once a grown-up turns them on in Coach Mode → Set up: most beginners only
   need the infield, and this way a child never sees a "locked" spot on the
   field, they just don't see it yet.

   Tapping a spot speaks its name and what it does, through the same one-voice
   queue every other screen uses (SBLevels.speak), so it respects Sound,
   Read-aloud and the language toggle exactly like the rest of the game.
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

  /* hand-placed x/y for each marker, on a 0..600 x 0..570 fan diagram —
     home plate at the tip, foul lines diverging to a fence arc at the top */
  const XY = {
    p:  { x: 300, y: 410 }, c:  { x: 300, y: 548 },
    '1b': { x: 406, y: 414 }, '2b': { x: 300, y: 308 }, '3b': { x: 194, y: 414 },
    ss: { x: 250, y: 345 },
    lf: { x: 140, y: 300 }, cf: { x: 300, y: 190 }, rf: { x: 460, y: 300 },
  };
  const COLOR = { infield: '#ffd43b', outfield: '#69db7c' };

  function fieldSvg(positions) {
    const markers = positions.map((pos) => {
      const xy = XY[pos.id];
      if (!xy) return '';
      const fill = COLOR[pos.group] || '#ffd43b';
      return '<g class="sbPosMark" data-pos="' + pos.id + '" tabindex="0" role="button" ' +
        'aria-label="' + esc(tr(pos.name)) + '" transform="translate(' + xy.x + ',' + xy.y + ')">' +
        '<circle r="30" fill="' + fill + '" stroke="#25324a" stroke-width="3"></circle>' +
        '<text y="11" text-anchor="middle" font-size="30">' + pos.emoji + '</text>' +
        '</g>';
    }).join('');

    return '<svg viewBox="0 0 600 570" class="sbPosField" role="img" aria-label="' + esc(tr(C.posLesson.title)) + '">' +
      '<path d="M300,520 L31,251 A380,380 0 0 1 569,251 Z" fill="#bfe6a8"></path>' +
      '<path d="M300,520 L194,414 L300,308 L406,414 Z" fill="#d9b98a" stroke="#a9805a" stroke-width="3"></path>' +
      '<circle cx="300" cy="410" r="26" fill="#d9b98a" stroke="#a9805a" stroke-width="2"></circle>' +
      '<rect x="288" y="500" width="24" height="24" fill="#fff" stroke="#25324a" stroke-width="2" ' +
        'transform="rotate(45 300 512)"></rect>' +
      markers +
      '</svg>';
  }

  function outfieldOn() {
    try { return !!LV().G.outfieldOn; } catch (e) { return false; }
  }

  function panelHTML() {
    const all = C.positions || [];
    const infield = all.filter((p) => p.group === 'infield');
    const outfield = all.filter((p) => p.group === 'outfield');
    const shown = outfieldOn() ? infield.concat(outfield) : infield;

    return '<h2>🧭 ' + tr(C.posLesson.title) + '</h2>' +
      '<p class="sbSub">' + tr(C.posLesson.intro) + '</p>' +
      fieldSvg(shown) +
      '<p class="sbSub sbPosHint">' + tr(C.posLesson.hint) + '</p>' +
      '<div class="sbPosSay" id="sbPosSay"></div>' +
      '<button class="sbBig" id="sbPosDone">' + tr(C.coachMode.close) + '</button>';
  }

  S.open = function () {
    C = window.SBContent;
    if (!C || !C.posLesson) return;
    sfx('tap');
    const p = LV().panel('sbPositions', panelHTML());
    const card = p.querySelector('.sbPanelCard');
    if (card) card.classList.add('wide');
    const out = document.getElementById('sbPosSay');

    function onPick(id) {
      const pos = (C.positions || []).find((x) => x.id === id);
      if (!pos) return;
      sfx('yes');
      p.querySelectorAll('.sbPosMark').forEach((m) => m.classList.toggle('on', m.dataset.pos === id));
      if (out) out.textContent = pos.emoji + ' ' + tr(pos.name) + ' — ' + tr(pos.does);
      try { LV().speak(pos.does, null, { emoji: pos.emoji }); } catch (e) {}
    }
    p.querySelectorAll('.sbPosMark').forEach((m) => {
      m.addEventListener('click', () => onPick(m.dataset.pos));
      m.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(m.dataset.pos); }
      });
    });
    document.getElementById('sbPosDone').addEventListener('click', () => { sfx('tap'); p._close(); });
  };

  window.SBPositions = S;
})();
