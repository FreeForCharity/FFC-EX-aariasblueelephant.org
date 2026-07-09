/* Aaria's Block Craft 3D — overnight: "While You Were Away" 🌙 + streak sunflower 🌻 */
ABC.overnight = (function () {
  const $ = (id) => document.getElementById(id);
  const todayKey = () => new Date().toISOString().slice(0, 10);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* {lastVisit, petals, seenEvents, shown} — petals NEVER go down 💛
     shown: milestone petal-counts already celebrated, so a returning child never
     sees the same surprise twice (and gaps in play never cost a celebration). */
  let data = { lastVisit: null, petals: 0, seenEvents: [], shown: [] };

  /* 🌻 petal milestones → confetti + sticker-style toast + a one-time reward */
  const MILESTONES = {
    3:  { text: '🐾 Sticker earned: <b>EXPLORER PAWS</b> — 3 days of adventures!', reward: 'animal' },
    7:  { text: '🌟 Sticker earned: <b>SUNSHINE STAR</b> — 7 days of adventures!', reward: 'animal' },
    14: { text: '🦋 Sticker earned: <b>BUTTERFLY CHAMP</b> — 14 days of adventures!', reward: 'stars' },
    30: { text: '🌈 Sticker earned: <b>RAINBOW HERO</b> — 30 days of adventures!', reward: 'rainbow' },
  };

  const BELLA_NEWS = [
    'I taught the bunnies a wiggle dance! 🐰💃',
    'I found a cloud shaped like a cookie! ☁️🍪',
    'The butterflies had a tiny parade! 🦋🎈',
    'I hummed a song to the flowers all night! 🎶🌸',
  ];

  /* 🌼 a few flowers pop up near spawn (feet start at 0, 6) */
  function bloomNearSpawn() {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 5;
      const x = Math.round(Math.cos(a) * r), z = Math.round(6 + Math.sin(a) * r);
      const tb = ABC.world.topBlock(x, z);
      if (tb && tb.t !== 'flower') ABC.world.set(x, tb.y + 1, z, 'flower');
    }
    ABC.world.flush();
  }

  /* 🌈 30-day milestone: a whole ring of rainbow flowers blooms near spawn */
  function bloomRainbowFlowers() {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 7;
      const x = Math.round(Math.cos(a) * r), z = Math.round(6 + Math.sin(a) * r);
      const tb = ABC.world.topBlock(x, z);
      if (tb) ABC.world.set(x, tb.y + 1, z, 'rainbow');
    }
    ABC.world.flush();
  }

  /* gentle overnight events — each returns one short line for the dialog */
  const EVENTS = [
    { key: 'flowers',   make: () => { bloomNearSpawn(); return '🌼 A little flower patch bloomed near your home!'; } },
    { key: 'gift',      make: () => { ABC.ui.addStars(2); return '⭐ Sparkle left you 2 shiny stars!'; } },
    { key: 'butterfly', make: () => { const a = ABC.animals.spawnSurprise(); return `${a.def.emoji} ${a.name} the ${a.def.label} moved in nearby!`; } },
    { key: 'bella',     make: () => '🐘💙 Nilu has news: ' + pick(BELLA_NEWS) },
  ];

  /* ---------------- login: new day? ---------------- */
  function onLogin() {
    const today = todayKey();
    if (data.lastVisit === today) { refreshChip(); return; }
    const firstEver = !data.lastVisit;
    data.lastVisit = today;
    data.petals += 1;                 // 🌻 one petal for every day you play!
    refreshChip();
    ABC.saveSoon && ABC.saveSoon();
    if (firstEver) return;            // day one — the streak starts quietly 💛
    setTimeout(function tryShow() {   // wait for a calm moment
      if (ABC.ui.isOpen()) { setTimeout(tryShow, 2600); return; }
      showNight();
    }, 1400);
  }

  function showNight() {
    // pick 1-2 gentle events — fresh ones first ✨
    if (data.seenEvents.length >= EVENTS.length) data.seenEvents = [];
    const order = shuffle(EVENTS).sort((a, b) =>
      (data.seenEvents.includes(a.key) ? 1 : 0) - (data.seenEvents.includes(b.key) ? 1 : 0));
    const chosen = order.slice(0, 1 + Math.floor(Math.random() * 2));
    chosen.forEach(e => { if (!data.seenEvents.includes(e.key)) data.seenEvents.push(e.key); });
    const lines = chosen.map(e => e.make());
    lines.push('🌻 Your sunflower grew a new petal!');
    ABC.saveSoon && ABC.saveSoon();
    ABC.ui.message('While you were away... 🌙', lines.join('<br>'), 'Hooray! ☀️',
      checkMilestone, '🌙');
  }

  function checkMilestone() {
    const m = MILESTONES[data.petals];
    if (!m || data.shown.includes(data.petals)) return;   // celebrate once each, ever
    data.shown.push(data.petals);
    ABC.saveSoon && ABC.saveSoon();
    ABC.ui.confetti(50);              // calm-aware — gentler burst when 😌 calm mode is on
    ABC.audio.sfx.fanfare();
    ABC.ui.bellaSays(`You've played ${data.petals} days! A special surprise…`, 4200);
    setTimeout(() => {
      ABC.ui.toast(m.text, 5600, true);
      if (m.reward === 'animal') {
        const a = ABC.animals.spawnSurprise();
        setTimeout(() => ABC.ui.bellaSays(
          `${a.def.emoji} ${a.name} the ${a.def.label} came to celebrate with you!`, 5200), 900);
      } else if (m.reward === 'stars') {
        ABC.ui.addStars(5);
      } else if (m.reward === 'rainbow') {
        bloomRainbowFlowers();
        setTimeout(() => ABC.ui.bellaSays('🌈 A whole ring of rainbow flowers bloomed for you!', 5200), 900);
      }
    }, 900);
  }

  /* ---------------- the streak sunflower 🌻 ---------------- */
  function refreshChip() {
    const chip = $('flowerChip');
    if (chip) chip.textContent = '🌻 ' + data.petals;
  }

  function drawSunflower(cv, n) {
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.40;
    // stem 🌿
    g.strokeStyle = '#2f9e44'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + 10, cy + 80, cx, H - 12); g.stroke();
    // leaves
    g.fillStyle = '#51cf66';
    [[-1, 78], [1, 112]].forEach(([s, dy]) => {
      g.beginPath();
      g.ellipse(cx + s * 26, cy + dy, 26, 11, s * 0.5, 0, Math.PI * 2);
      g.fill();
    });
    // petals — rings of 14, golden and bright 🌻
    const drawn = Math.min(n, 56);
    for (let i = 0; i < drawn; i++) {
      const ring = Math.floor(i / 14);
      const a = ((i % 14) / 14) * Math.PI * 2 + ring * 0.24;
      g.save();
      g.translate(cx, cy);
      g.rotate(a);
      g.fillStyle = ring % 2 ? '#fab005' : '#ffd43b';
      g.beginPath(); g.ellipse(52 + ring * 13, 0, 27, 10, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    // happy face center 😊
    g.fillStyle = '#8a5a1e';
    g.beginPath(); g.arc(cx, cy, 36, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5c3c10';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath(); g.arc(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, 2.6, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#2b1a06';
    [-11, 11].forEach(dx => { g.beginPath(); g.arc(cx + dx, cy - 6, 3.6, 0, Math.PI * 2); g.fill(); });
    g.strokeStyle = '#2b1a06'; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy + 4, 12, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
  }

  function showFlower() {
    const n = data.petals;
    const word = n === 1 ? 'petal' : 'petals';
    ABC.ui.openDialog(ABC.tpl(`<div class="bigEmoji">🌻</div><h2>{player}'s Streak Sunflower</h2>
      <canvas id="sunCv" width="320" height="340" style="width:min(70vw,300px);"></canvas>
      <div class="scene">🌻 <b>${n}</b> ${word} — <b>${n} day${n === 1 ? '' : 's'} of adventures!</b><br>
        Play each day and your sunflower keeps growing! 💛</div>
      <div class="dlgRow"><button class="bigBtn green" id="sunOk">Keep growing! 🌞</button></div>`));
    drawSunflower($('sunCv'), n);
    ABC.audio.say(n + ' days of adventures! Your sunflower is growing so big!');
    $('sunOk').onclick = () => { ABC.audio.sfx.pop(); ABC.ui.closeDialog(); };
  }

  /* ---------------- save / load ---------------- */
  function serialize() {
    return { lastVisit: data.lastVisit, petals: data.petals, seenEvents: data.seenEvents, shown: data.shown };
  }
  function deserialize(d) {
    if (!d) return;
    data.lastVisit = d.lastVisit || null;
    data.petals = d.petals || 0;
    data.seenEvents = d.seenEvents || [];
    data.shown = d.shown || [];
    refreshChip();
  }

  return { onLogin, showFlower, refreshChip, serialize, deserialize, petals: () => data.petals };
})();
