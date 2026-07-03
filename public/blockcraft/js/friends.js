/* Aaria's Block Craft 3D — Animal Friend Encyclopedia 📖: meet friends, learn their stories */
ABC.friends = (function () {
  const $ = (id) => document.getElementById(id);

  /* one page per species — name comes from ANIMAL_DEFS; food, fact & one rare star moment */
  const PAGES = [
    { kind:'bunny',    food:'🥕 Crunchy carrots',  fact:'Bunnies do a happy jump called a BINKY when they feel great!',
      rare:'did a happy BINKY jump — twisting in mid-air!' },
    { kind:'cat',      food:'🐟 Fresh fish',        fact:'Cats purr like a tiny motor when they feel safe and cozy.',
      rare:'rolled over and showed you its fluffy tummy!' },
    { kind:'puppy',    food:'🍪 Little biscuits',   fact:'Puppies wag their whole body when they are super happy!',
      rare:'zoomed around you in a giant happy circle!' },
    { kind:'butterfly',food:'🌸 Flower nectar',     fact:'Butterflies taste flowers with their FEET!',
      rare:'landed right on your shoulder for a rest!' },
    { kind:'trex',     food:'🍗 A big dinner',      fact:'T-Rex had teeth as long as bananas — but this one only smiles!',
      rare:'let out a mighty (but friendly) ROAR just for you!' },
    { kind:'trice',    food:'🌿 Leafy greens',      fact:'Triceratops means "three-horned face" — count the horns!',
      rare:'showed off its frill in a slow, proud spin!' },
    { kind:'longneck', food:'🍃 Treetop leaves',    fact:'Long-necks could reach leaves higher than a house!',
      rare:'stretched way, WAY up and nibbled a cloud!' },
    { kind:'mammoth',  food:'🌾 Sweet grass',       fact:'Woolly mammoths wore fuzzy coats to stay warm in the snow.',
      rare:'trumpeted a deep, happy rumble for you!' },
    { kind:'capy',     food:'🍉 Juicy melon',       fact:'Capybaras are the chillest animals — everyone wants to sit with them!',
      rare:'flopped over for the world’s comfiest sunbath!' },
    { kind:'penguin',  food:'🐟 Slippery fish',     fact:'Penguins slide on their tummies like little sleds!',
      rare:'did a wobbly happy dance, flippers out!' },
    { kind:'panda',    food:'🎋 Bamboo',            fact:'Pandas eat bamboo almost ALL day long. Munch munch!',
      rare:'did a slow, roly-poly somersault!' },
  ];
  const NEED = 3;   // gentle interactions to fill in a page

  /* progress lives in ABC.state.friendBook = { met:{kind:count}, stars:{kind:1} } */
  function book() {
    if (!ABC.state.friendBook) ABC.state.friendBook = { met: {}, stars: {} };
    if (!ABC.state.friendBook.met) ABC.state.friendBook.met = {};
    if (!ABC.state.friendBook.stars) ABC.state.friendBook.stars = {};
    return ABC.state.friendBook;
  }
  const metCount = () => PAGES.filter(p => (book().met[p.kind] || 0) > 0).length;
  const known = (kind) => (book().met[kind] || 0) >= NEED;

  /* called from every gentle talk/interaction with a wild animal */
  function record(a) {
    const page = PAGES.find(p => p.kind === a.kind);
    if (!page) return;
    const b = book();
    const was = b.met[a.kind] || 0;
    b.met[a.kind] = was + 1;
    ABC.saveSoon && ABC.saveSoon();
    if (was === 0) {
      setTimeout(() => ABC.ui.toast(`📖 New friend in your book: ${a.def.emoji} <b>${a.def.label}</b>! You've met ${metCount()} of ${PAGES.length} friends!`, 4600, true), 1400);
    } else if (was + 1 === NEED) {
      setTimeout(() => {
        ABC.ui.confetti(20);
        ABC.ui.bellaSays(`Your ${a.def.label} page is all filled in! 📖✨ Check your Friend Book — you've met ${metCount()} of ${PAGES.length} friends!`, 5600);
      }, 1400);
    } else if (known(a.kind) && !b.stars[a.kind] && Math.random() < 0.22) {
      rareMoment(a, page);   // 🌟 a rare, once-per-species golden moment
    }
  }

  function rareMoment(a, page) {
    book().stars[a.kind] = 1;
    ABC.saveSoon && ABC.saveSoon();
    ABC.animals.celebrate(a, performance.now() / 1000);
    ABC.animals.setEmotion(a, { emoji: '🌟' });
    setTimeout(() => ABC.animals.clearEmotion(a), 4000);
    setTimeout(() => {
      ABC.ui.confetti(30);
      ABC.audio.sfx.fanfare();
      ABC.ui.toast(`🌟 WOW! ${a.name} ${page.rare} A GOLD STAR shines on the ${a.def.label} page! 📖`, 5600, true);
    }, 1600);
  }

  /* ---------------- the Friend Book 📖 ---------------- */
  function openBook() {
    const b = book();
    let html = `<div class="bigEmoji">📖</div><h2>{player}'s Friend Book</h2>
      <div class="scene">You've met <b>${metCount()}/${PAGES.length}</b> animal friends! Tap a page to hear about them!</div>
      <div class="pickGrid">`;
    PAGES.forEach((p, i) => {
      const d = ABC.ANIMAL_DEFS[p.kind];
      const met = (b.met[p.kind] || 0);
      if (met >= NEED) {
        html += `<button class="pickCard frCard" data-i="${i}" style="border-color:#ffd43b; background:#fff9db; position:relative;">
          ${b.stars[p.kind] ? '<span style="position:absolute;top:2px;right:6px;">🌟</span>' : ''}
          <span class="ico">${d.emoji}</span>${ABC.ui.esc(d.label)}
          <span style="font-size:11px; color:#666;">Loves: ${p.food}</span></button>`;
      } else if (met > 0) {
        html += `<button class="pickCard frCard" data-i="${i}" style="background:#eef4fa;">
          <span class="ico">${d.emoji}</span>${ABC.ui.esc(d.label)}
          <span style="font-size:11px; color:#666;">Say hi ${NEED - met} more time${NEED - met > 1 ? 's' : ''}!</span></button>`;
      } else {
        html += `<button class="pickCard frCard" data-i="${i}" style="opacity:.5; background:#f1f3f5;">
          <span class="ico" style="filter:brightness(0) opacity(.5);">${d.emoji}</span>???</button>`;
      }
    });
    html += `</div><div class="dlgRow"><button class="bigBtn green" id="frOk">Back to playing! 🎮</button></div>`;
    ABC.ui.openDialog(ABC.tpl(html));
    ABC.audio.say(`Your friend book! You have met ${metCount()} of ${PAGES.length} animal friends!`);
    document.querySelectorAll('#dialogBox .frCard').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = PAGES[+btn.dataset.i], d = ABC.ANIMAL_DEFS[p.kind];
        const met = (b.met[p.kind] || 0);
        ABC.audio.sfx.pop();
        if (met >= NEED) ABC.audio.say(`${d.label}! Favorite food: ${p.food.replace(/^[^ ]+ /, '')}. Fun fact: ${p.fact}` +
          (b.stars[p.kind] ? ' And you saw its rare golden moment!' : ''), { force: true });
        else if (met > 0) ABC.audio.say(`A ${d.label}! Say hello ${NEED - met} more times to fill in the page!`, { force: true });
        else ABC.audio.say('A mystery friend! Explore the world and say hello to fill in this page!', { force: true });
      });
    });
    $('frOk').onclick = () => ABC.ui.closeDialog();
  }

  return { record, openBook, metCount };
})();
