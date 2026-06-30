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
    ABC.saveSoon && ABC.saveSoon();
  }

  return { kindForBlock, reward, hatchNextShape, wakeFriend };
})();
