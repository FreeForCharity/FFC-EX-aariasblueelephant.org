/* Aaria's Block Craft 3D — Copy Cat 🐱: build-a-copy challenges (calm, no fail states) */
ABC.copycat = (function () {
  const $ = (id) => document.getElementById(id);
  const ui = () => ABC.ui;

  /* =====================================================
     STATE
     ===================================================== */
  let patterns = null;
  let active = null;      // { pat, site, ghostGroup, ghosts:Map(key->mesh) }
  let ghostMat = null;
  const done = new Set(); // ids of completed patterns (persisted, mirrors stickers.js)

  function ensurePatterns() { if (!patterns) patterns = ABC.COPYCAT_PATTERNS; return patterns; }

  /* =====================================================
     MENU
     ===================================================== */
  function showMenu() {
    ensurePatterns();
    const cards = patterns.map(p => ({
      ico: (done.has(p.id) ? '⭐' : '') + p.emoji,
      label: p.name,
      p,
    }));
    ui().pickCard('Copy Cat 🐱', 'Copy the glowing pattern with your own blocks! Pick one to try!', cards, (c) => {
      ui().closeDialog();
      start(c.p);
    }, '🐱');
  }

  /* a clear, ground-level building spot a few blocks in front of the player
     (mirrors activities.js siteInFront()) */
  function siteInFront() {
    const cam = ABC.player;
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const x = Math.round(cam.position.x + dir.x * 7);
    const z = Math.round(cam.position.z + dir.z * 7);
    const tb = ABC.world.topBlock(x, z);
    return { x, z, y: tb ? tb.y : 0 };     // y = ground top; blocks sit on y+1
  }

  /* 90°-step rotation of a horizontal offset around the vertical (y) axis */
  function rotateXZ(dx, dz, steps) {
    for (let i = 0; i < steps; i++) { const ndx = -dz, ndz = dx; dx = ndx; dz = ndz; }
    return { dx, dz };
  }

  /* =====================================================
     START / QUIT
     ===================================================== */
  function start(pat) {
    if (active) quit(true);
    if (ABC.activities && ABC.activities.hasActiveProject && ABC.activities.hasActiveProject()) {
      ABC.activities.quitProject(true);   // only one build challenge active at a time
    }
    active = { pat, site: siteInFront(), ghostGroup: new THREE.Group(), ghosts: new Map() };
    ABC.world.getScene().add(active.ghostGroup);
    if (!ghostMat) ghostMat = new THREE.MeshLambertMaterial({
      color: 0xffe066, transparent: true, opacity: 0.35, depthWrite: false });
    const geo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    for (const b of pat.blocks) {
      const wx = active.site.x + b.dx, wy = active.site.y + 1 + b.dy, wz = active.site.z + b.dz;
      if (ABC.world.get(wx, wy, wz) === b.type) continue;    // already there
      const m = new THREE.Mesh(geo, ghostMat);
      m.position.set(wx + 0.5, wy + 0.5, wz + 0.5);
      active.ghostGroup.add(m);
      active.ghosts.set(ABC.world.key(wx, wy, wz), m);
    }
    showPanel(pat, 0, pat.blocks.length);
    ui().bellaSays(`${ABC.tpl('Copy the')} ${ABC.tpl(pat.name)} ${pat.emoji}! ${ABC.tpl('Build it just like the glowing shape — any direction is fine! ✨')}`, 5200);
    checkPlacement();   // in case some of it already exists
  }

  function showPanel(pat, placed, total) {
    if (!$('projectPanel')) return;
    $('projectPanel').style.display = 'block';
    if ($('magicBtn')) $('magicBtn').style.display = 'none';   // no auto-finish in Copy Cat — the child builds it
    $('projTitle').textContent = pat.emoji + ' ' + ABC.tpl(pat.name);
    $('projStage').textContent = ABC.tpl('Copy Cat — build it your way!');
    const pct = total ? Math.round(placed / total * 100) : 100;
    $('projBarInner').style.width = pct + '%';
    $('projCount').textContent = placed + '/' + total;
  }

  function quit(silent) {
    if (!active) return;
    ABC.world.getScene().remove(active.ghostGroup);
    active = null;
    if ($('projectPanel')) $('projectPanel').style.display = 'none';
    if ($('magicBtn')) $('magicBtn').style.display = '';        // give Build mode its Finish button back
    if (!silent) ui().toast('Copy Cat paused — come back anytime! 💛', 3000);
  }

  /* =====================================================
     COMPLETION CHECK — rotation-invariant, anchored at the ghost site.
     Hooked from main.js right after a real block placement succeeds
     (the same spot activities.js's post-placement checks live) —
     never a second click-handler, so no double-hooking of block placement.
     ===================================================== */
  function checkPlacement() {
    if (!active) return;
    const { pat, site } = active;
    let best = 0;
    for (let r = 0; r < 4; r++) {
      let matched = 0;
      for (const b of pat.blocks) {
        const { dx, dz } = rotateXZ(b.dx, b.dz, r);
        if (ABC.world.get(site.x + dx, site.y + 1 + b.dy, site.z + dz) === b.type) matched++;
      }
      if (matched > best) best = matched;
      if (matched === pat.blocks.length) { complete(); return; }
    }
    // gentle visual feedback: remove the rotation-0 preview ghost once its spot is filled
    for (const b of pat.blocks) {
      const wx = site.x + b.dx, wy = site.y + 1 + b.dy, wz = site.z + b.dz;
      const k = ABC.world.key(wx, wy, wz);
      const mesh = active.ghosts.get(k);
      if (mesh && ABC.world.get(wx, wy, wz) === b.type) {
        active.ghostGroup.remove(mesh);
        active.ghosts.delete(k);
      }
    }
    showPanel(pat, best, pat.blocks.length);
  }

  function complete() {
    const pat = active.pat;
    done.add(pat.id);
    quit(true);
    ABC.audio.sfx.fanfare();
    ui().confetti(50);
    ABC.stickers && ABC.stickers.award && ABC.stickers.award('copycat');
    ABC.saveSoon && ABC.saveSoon();
    ui().toast(`🐱 ${ABC.tpl('Copy Cat complete:')} ${pat.emoji} <b>${ABC.tpl(pat.name)}</b>! ${ABC.tpl('Purrfect copying! 🎉')}`, 5200, true);
    ui().bellaSays(`${ABC.tpl('You copied the')} ${ABC.tpl(pat.name)} ${ABC.tpl('perfectly!')} ${pat.emoji} ${ABC.tpl('Great job looking closely! 💛')}`, 5200);
  }

  /* =====================================================
     SAVE / LOAD (mirrors stickers.js)
     ===================================================== */
  function serialize() { return { done: [...done] }; }
  function deserialize(d) {
    if (!d) return;
    (d.done || []).forEach(id => done.add(id));
  }

  return { showMenu, checkPlacement, quit, serialize, deserialize,
           hasActive: () => !!active };
})();
