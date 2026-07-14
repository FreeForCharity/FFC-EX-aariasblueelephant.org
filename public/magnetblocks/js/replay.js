// replay.js — 🎬 Watch my build: replay a creation's placement history in order, then celebrate
window.MB = window.MB || {};
(function(){
  const RATE = 2.5; // pieces per second (baseline — a little ease added per-piece)
  const R = { active:false, timer:null, stopRequested:false, session:null };

  function setLocked(on){
    MB.Builder.locked = on;
    const banner = document.getElementById('replayBanner');
    if (banner) banner.style.display = on ? 'block' : 'none';
  }

  function clearTable(){
    for (const b of [...MB.Magnet.blocks]) if (b.onTable) MB.Magnet.removeBlock(b);
  }

  // one piece arrives: drops in from just above its resting spot, then the familiar snap
  // sound + flash (calm mode: gentler, no flash — same feedback used on a normal snap).
  function dropIn(pc, scene){
    const made = MB.Bag.rebuildPieces([pc], scene);
    const inst = made[0];
    if (!inst) return;
    const to = inst.group.position.clone();
    inst.group.position.y = to.y + 2.2;
    const from = inst.group.position.clone();
    MB.Builder.addTween(0.22, k => {
      const e = 1 - Math.pow(1-k, 2.4);
      inst.group.position.y = from.y + (to.y - from.y) * e;
    }, () => {
      inst.group.position.copy(to);
      MB.Audio.snap();
      MB.Builder.snapEffect(inst.group, to);
    });
  }

  function stepThrough(sorted, scene, onDone){
    let i = 0;
    const step = () => {
      if (R.stopRequested || i >= sorted.length){ onDone(); return; }
      dropIn(sorted[i++], scene);
      const delay = (1000 / RATE) * (0.82 + Math.random() * 0.32); // slight ease/variance
      R.timer = setTimeout(step, delay);
    };
    step();
  }

  // always ends with the FULL, exact creation intact on the table — whether we finished
  // naturally or were stopped early.
  function finish(fullPieces, scene){
    clearTable();
    MB.Bag.rebuildPieces(fullPieces, scene);
    R.active = false; R.session = null;
    setLocked(false);
    if (!(MB.ui && MB.ui.calm)) MB.ui.confetti();
    MB.Audio.fanfare();
    MB.ui.toast('🎬 Ta-daa! That’s how you built it!', 2600);
    MB.Builder.onChange && MB.Builder.onChange();
  }

  function begin(fullPieces, scene){
    R.active = true;
    R.stopRequested = false;
    R.session = { pieces: fullPieces, scene };
    setLocked(true);
    MB.Builder.select(null);
    clearTable();
    const sorted = [...fullPieces].sort((a, b) => (a.seq || 0) - (b.seq || 0));
    MB.ui.toast('🎬 Watch your build come to life!', 2000);
    stepThrough(sorted, scene, () => finish(fullPieces, scene));
  }

  // replay whatever is currently on the table (caller should only offer this at ≥3 pieces)
  R.playTable = function(scene){
    if (R.active) return;
    const pieces = MB.Bag.serializeTable();
    if (!pieces.length) return;
    begin(pieces, scene);
  };

  // replay a saved school-bag creation — swap the table first if it's busy building something else
  R.playCreation = function(item, scene){
    if (R.active) return;
    const tableBusy = MB.Bag.serializeTable().length > 0;
    const go = () => begin(item.pieces, scene);
    if (tableBusy){
      MB.ui.confirm('Swap builds? 🔁',
        ABELang.t('The table is busy! Put those blocks back on the shelves and watch "') + item.name + ABELang.t('" instead? (Snap 📸 first if you want to keep the current one!)'),
        () => {
          for (const b of [...MB.Magnet.blocks]) if (b.onTable && !b.parent) MB.Builder.flyToShelf(b);
          setTimeout(go, 800);
        }, null, 'Yes! 🎬', 'No');
    } else go();
  };

  // ⏹ stop early: cancel the schedule and restore the full creation instantly
  R.stop = function(){
    if (!R.active || !R.session) return;
    R.stopRequested = true;
    clearTimeout(R.timer);
    const { pieces, scene } = R.session;
    finish(pieces, scene);
  };

  MB.Replay = R;
})();
