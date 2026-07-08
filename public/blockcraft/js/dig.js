/* Aaria's Block Craft 3D — Dig & Discover 🪙
   When you dig up a VISIBLE treasure marker (placed at world-gen), you get the one
   fixed reward that marker always means — silver/gold coins, a shape egg, or a sleepy
   animal friend. No random rolls: you see the glint/egg/mound before you dig it. */
ABC.dig = (function () {
  // marker block id -> reward kind (the marker you SEE is the reward you GET)
  const KIND = { silverGlint: 'coin', goldGlint: 'gold', eggTell: 'egg', moundTell: 'friend' };

  function kindForBlock(blockId) { return KIND[blockId] || null; }

  // hatch the NEXT un-owned shape (eggs and the coin bar share one fixed order)
  function hatchNextShape() {
    const next = (ABC.SHAPE_UNLOCKS || []).find((id) => !ABC.state.unlocked.has(id));
    if (next) {
      ABC.state.foundShapes.add(next);
      ABC.ui.unlockBlock(next);                  // adds + rebuilds hotbar + celebratory toast + saveSoon
      ABC.ui.confetti && ABC.ui.confetti(16);
      ABC.audio.sfx.fanfare && ABC.audio.sfx.fanfare();
    } else {
      // already have every shape — never a dead reward; gift a gold coin instead
      ABC.ui.addCoins(5);
    }
  }

  // a sleepy little friend wakes up — routes into the game's observe-and-help loop
  function wakeFriend(cell) {
    if (!ABC.animals || !ABC.animals.spawn) return;
    const cute = Object.keys(ABC.ANIMAL_DEFS).filter((k) => ABC.ANIMAL_DEFS[k].cute && !ABC.ANIMAL_DEFS[k].special);
    const kind = cute[Math.abs(cell.x * 31 + cell.z * 17) % cute.length];
    const a = ABC.animals.spawn(kind, cell.x + 0.5, cell.z + 0.5);
    const sleepy = (ABC.EMOTIONS || []).find((e) => e.key === 'sleepy') || (ABC.EMOTIONS || [])[0];
    if (a && sleepy && ABC.animals.setEmotion) ABC.animals.setEmotion(a, sleepy);
    ABC.ui.bellaSays && ABC.ui.bellaSays(
      `You dug up a sleepy little friend! ${a ? a.def.emoji : '🐾'} Tap them to say hello and help!`, 5200);
  }

  /* ---------- ⭐ gentle treasure hints ----------
     Treasures are truly buried now (invisible under the grass), so a child who
     hasn't found one in a while gets a nudge: a floating, bobbing star appears
     over ONE or TWO nearby buried treasures — never all of them, so the hunt
     stays a hunt. Triggers after ~3 min without a find, or sooner if they've
     been digging a lot with no luck. A hint vanishes when its treasure is dug. */
  let lastFound = performance.now(), digsSinceFound = 0, hints = [], bobT = 0, retryAt = 0;
  const TREASURE_IDS = ['silverGlint', 'goldGlint', 'eggTell', 'moundTell'];
  function hintSprite() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 8, 64, 64, 60);   // soft golden halo
    rg.addColorStop(0, 'rgba(255,225,120,.9)'); rg.addColorStop(1, 'rgba(255,225,120,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
    g.font = '72px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('⭐', 64, 66);
    const tex = new THREE.CanvasTexture(cv);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(1.5, 1.5, 1);
    sp.userData.noAO = true;
    return sp;
  }
  function noteDig() { digsSinceFound++; }
  function update(dt, px, pz) {
    const scene = ABC.world.getScene && ABC.world.getScene();
    if (!scene) return;
    bobT += dt;
    for (const h of hints) {
      h.sp.position.y = h.y + Math.sin(bobT * 2 + h.ph) * 0.28;
      if (ABC.world.get(h.cx, h.cy, h.cz) !== h.t ||                 // dug (or gone) → hint done
          Math.hypot(h.cx - px, h.cz - pz) > 80) {                   // wandered far away → drop it
        scene.remove(h.sp); h.dead = true;
      }
    }
    if (hints.length) { hints = hints.filter((h) => !h.dead); return; }
    const now = performance.now();
    const struggling = (now - lastFound > 180000) ||                          // ~3 min, no find
                       (digsSinceFound >= 12 && now - lastFound > 45000);     // digging hard, no luck
    if (!struggling || now < retryAt) return;
    retryAt = now + 20000;                       // rescan at most every 20s
    const near = ABC.world.findNear ? ABC.world.findNear(TREASURE_IDS, px, pz, 48, 2) : [];
    for (const c of near) {
      const sp = hintSprite();
      const top = ABC.world.topBlock ? ABC.world.topBlock(c.x, c.z) : null;
      const y = (top ? top.y + 1 : c.y + 2) + 1.6;
      sp.position.set(c.x + 0.5, y, c.z + 0.5);
      scene.add(sp);
      hints.push({ sp, y, ph: Math.random() * 6, cx: c.x, cy: c.y, cz: c.z, t: c.t });
    }
    if (near.length) ABC.ui.bellaSays && ABC.ui.bellaSays(
      'I can feel treasure sparkling under the ground! Walk to the floating star and dig down! ⭐', 5200);
  }

  // route a dug marker to its reward (called from main.js act() after a successful dig)
  function reward(kind, cell) {
    const f = (ABC.DIG_FIND && ABC.DIG_FIND[kind]) || { emoji: '✨', word: 'a surprise' };
    if (kind === 'coin') {
      ABC.ui.addCoins(1);
      ABC.ui.toast(`🪙 You dug up ${f.word}!`, 2600);
    } else if (kind === 'gold') {
      ABC.ui.addCoins(5);
      ABC.ui.confetti && ABC.ui.confetti(10);
      ABC.ui.bellaSays && ABC.ui.bellaSays(`Wow — ${f.word}! That is worth five! ${f.emoji}`, 4200);
    } else if (kind === 'egg') {
      ABC.ui.bellaSays && ABC.ui.bellaSays(`A magic shape egg! Let's see what hatches… ${f.emoji}`, 3600);
      hatchNextShape();
    } else if (kind === 'friend') {
      wakeFriend(cell);
    }
    lastFound = performance.now();               // found one — the hint timer starts over
    digsSinceFound = 0;
    ABC.saveSoon && ABC.saveSoon();
  }

  return { kindForBlock, reward, hatchNextShape, wakeFriend, noteDig, update };
})();
