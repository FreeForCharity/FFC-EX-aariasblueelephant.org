/* Aaria's Block Craft 3D — My Treasures sticker book 🏅: collect stickers for big moments! */
ABC.stickers = (function () {
  const $ = (id) => document.getElementById(id);

  /* ---------------- the 16 treasures 🏅 ---------------- */
  const DEFS = [
    { id:'first-build',     emoji:'🧱', label:'First Builder',   hint:'Place your very first block!' },
    { id:'villa-done',      emoji:'🏡', label:'Villa Champion',  hint:'Finish the Two-Storey Villa!' },
    { id:'rocket-launched', emoji:'🚀', label:'Space Explorer',  hint:'Build the rocket and blast off!' },
    { id:'10-hearts',       emoji:'💖', label:'Kind Heart',      hint:'Collect 10 kindness hearts!' },
    { id:'5-purchases',     emoji:'🛍️', label:'Super Shopper',   hint:'Buy 5 things at the market!' },
    { id:'pet-adopted',     emoji:'🐾', label:'Pet Pal',         hint:'Bring home an animal friend!' },
    { id:'pet-level-5',     emoji:'🌟', label:'Best Friend',     hint:'Help your pet grow to level 5!' },
    { id:'slime-made',      emoji:'🫙', label:'Slime Scientist', hint:'Mix slime in the Slime Lab!' },
    { id:'oreo-made',       emoji:'🍪', label:'Cookie Chef',     hint:'Bake a giant Oreo!' },
    { id:'dough-art',       emoji:'🎨', label:'Dough Artist',    hint:'Stamp a shape in your slime!' },
    { id:'sky-island',      emoji:'🏝️', label:'Sky Visitor',     hint:'Visit the secret Sky Island!' },
    { id:'map-used',        emoji:'🗺️', label:'World Watcher',   hint:'Peek at your world from the sky!' },
    { id:'tree-planted',    emoji:'🌳', label:'Nature Helper',   hint:'Plant a tree and watch it grow!' },
    { id:'25-stars',        emoji:'⭐', label:'Star Collector',  hint:'Earn 25 shiny stars!' },
    { id:'all-quests-day',  emoji:'🎆', label:'Adventure Ace',   hint:'Finish all 3 adventures in one day!' },
    { id:'surprise-pocket', emoji:'🎁', label:'Lucky Find',      hint:'Open the surprise pocket in your bag!' },
    { id:'copycat',         emoji:'🐱', label:'Copy Cat',        hint:'Copy a Copy Cat pattern perfectly!' },
  ];

  const earned = new Set();
  const counts = { bought: 0 };   // market purchases (stars going down = shopping 🛍️)
  let lastStars = null;

  /* ---------------- award 🏅 — always a celebration, never twice ---------------- */
  function award(id) {
    if (earned.has(id)) return;
    const def = DEFS.find(d => d.id === id);
    if (!def) return;
    earned.add(id);
    ABC.ui.confetti(60);
    ABC.audio.sfx.fanfare();
    ABC.ui.toast(`🏅 ${ABC.tpl('New sticker:')} ${def.emoji} <b>${ABC.tpl(def.label)}</b>!`, 5200, true);
    ABC.saveSoon && ABC.saveSoon();
  }

  /* ---------------- the treasure book 📖 ---------------- */
  function openBook() {
    const n = earned.size;
    let html = `<div class="bigEmoji">🏅</div><h2>${ABC.tpl("{player}'s Treasures")}</h2>
      <div class="scene">${ABC.tpl('You have <b>' + n + '/' + DEFS.length + '</b> stickers! Tap one to hear about it!')}</div>
      <div class="pickGrid">`;
    DEFS.forEach((d, i) => {
      const got = earned.has(d.id);
      html += got
        ? `<button class="pickCard stkCard" data-i="${i}" style="border-color:#ffd43b; background:#fff9db;">
            <span class="ico">${d.emoji}</span>${ABC.ui.esc(ABC.tpl(d.label))}</button>`
        : `<button class="pickCard stkCard" data-i="${i}" style="opacity:.5; background:#f1f3f5;">
            <span class="ico">❓</span><span style="font-size:12px; color:#666;">${ABC.ui.esc(ABC.tpl(d.hint))}</span></button>`;
    });
    html += `</div><div class="dlgRow"><button class="bigBtn green" id="stkOk">${ABC.tpl('Back to playing! 🎮')}</button></div>`;
    ABC.ui.openDialog(ABC.tpl(html));
    ABC.audio.say(n === DEFS.length
      ? 'WOW! Your treasure book is FULL! All ' + DEFS.length + ' stickers!'
      : 'Your treasure book! You have ' + n + ' of ' + DEFS.length + ' stickers!');
    document.querySelectorAll('#dialogBox .stkCard').forEach(b => {
      b.addEventListener('click', () => {
        const d = DEFS[+b.dataset.i];
        ABC.audio.sfx.pop();
        ABC.audio.say(earned.has(d.id) ? ABC.tpl(d.label) + ABC.tpl('! You earned it!') : ABC.tpl('A mystery sticker! ') + ABC.tpl(d.hint), { force: true });
      });
    });
    $('stkOk').onclick = () => ABC.ui.closeDialog();
  }

  /* ---------------- gentle watcher 👀 — awards stickers automatically ---------------- */
  const petLevel = () => {
    try {
      const p = ABC.pet;
      if (!p) return 0;
      if (typeof p.level === 'number') return p.level;
      if (typeof p.level === 'function') return p.level();
      if (typeof p.getLevel === 'function') return p.getLevel();
      if (p.state && typeof p.state.level === 'number') return p.state.level;
    } catch (e) {}
    return 0;
  };
  const CHECKS = {
    'first-build':     () => (ABC.state.placedCount || 0) >= 1,
    'villa-done':      () => ABC.state.completed.has('villa'),
    'rocket-launched': () => ABC.state.completed.has('rocket'),
    '10-hearts':       () => ABC.state.hearts >= 10,
    '5-purchases':     () => counts.bought >= 5,
    'pet-adopted':     () => (ABC.pet && ABC.pet.isAdopted && ABC.pet.isAdopted()) || petLevel() >= 1,
    'pet-level-5':     () => petLevel() >= 5,
    'slime-made':      () => ['slimeGreen','slimePink','slimePurple','slimeBlue'].some(b => ABC.state.unlocked.has(b)),
    'oreo-made':       () => ABC.state.unlocked.has('oreo') || ABC.state.unlocked.has('oreoPink'),
    'sky-island':      () => {                          // standing way up on the island 🏝️
      const p = ABC.player && ABC.player.position, isl = ABC.PORTAL.islandPos;
      return !!p && p.y > 20 && Math.hypot(p.x - isl.x, p.z - isl.z) < 25;
    },
    '25-stars':        () => ABC.state.stars >= 25,
    'all-quests-day':  () => {
      const q = ABC.state.quests;
      return !!q && ABC.quests.todayDefs().every(d => q.done[d.key]);
    },
    'surprise-pocket': () => !!ABC.state.pocket,
  };

  function check() {
    try {
      const hud = $('hud');
      if (!hud || hud.style.display !== 'block') return;   // game not started yet
      // 🛍️ stars only go DOWN when shopping at the market
      if (lastStars != null && ABC.state.stars < lastStars) {
        counts.bought++;
        ABC.saveSoon && ABC.saveSoon();
      }
      lastStars = ABC.state.stars;
      if (ABC.ui.isOpen()) return;                          // wait — never talk over a dialog
      for (const id in CHECKS) {
        if (!earned.has(id) && CHECKS[id]()) { award(id); return; }   // one celebration at a time 💛
      }
    } catch (e) { /* keep playing */ }
  }

  /* event-only stickers: wrap existing flows gently 🎁 */
  function wrapEvents() {
    try {   // 🎨 stamping a cutter into slime
      const orig = ABC.squishy.stamp;
      ABC.squishy.stamp = function () { award('dough-art'); return orig.apply(this, arguments); };
    } catch (e) {}
    try {   // 🌳 the "tree is all grown" toast from planting a sapling
      const origToast = ABC.ui.toast;
      ABC.ui.toast = function (msg) {
        try { if (String(msg).includes('tree is all grown')) award('tree-planted'); } catch (e) {}
        return origToast.apply(this, arguments);
      };
    } catch (e) {}
    try {   // 🗺️ peeking at the sky map
      const mb = $('mapBtn');
      if (mb) mb.addEventListener('click', () => award('map-used'));
    } catch (e) {}
  }
  wrapEvents();
  setInterval(check, 2000);

  /* ---------------- save / load ---------------- */
  function serialize() { return { earned: [...earned], counts: { bought: counts.bought } }; }
  function deserialize(d) {
    if (!d) return;
    (d.earned || []).forEach(id => earned.add(id));
    counts.bought = (d.counts && d.counts.bought) || 0;
  }

  return { award, openBook, serialize, deserialize, DEFS };
})();
