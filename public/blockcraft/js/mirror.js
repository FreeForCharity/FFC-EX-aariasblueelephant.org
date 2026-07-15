/* Aaria's Block Craft 3D — Mirror Magic 🪞: a shimmering magic mirror rises
   where you stand, and every block you place (or dig) happens on BOTH sides.
   Instant castles! Symmetry is the trick — the child builds one half and the
   mirror builds the other, which is both delightful and quietly teaches the
   concept. Session-only: the mirror goes away when you leave, the blocks stay. */
ABC.mirror = (function () {
  let scene = null;
  let on = false;
  let planeX = 0;          // mirror plane at this integer x boundary
  let wall = null;         // the shimmering visual
  let sparkles = [];
  let t = 0, firstUse = false;

  function init(sc) { scene = sc; }

  function buildWall() {
    const g = new THREE.Group();
    const c = document.createElement('canvas'); c.width = 32; c.height = 128;
    const ctx = c.getContext('2d');
    const gr = ctx.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(180,220,255,0)');
    gr.addColorStop(0.5, 'rgba(190,225,255,0.5)');
    gr.addColorStop(1, 'rgba(200,235,255,0.15)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 32, 128);
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(30, 9),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide,
        depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.y = Math.PI / 2;
    m.position.y = 4.5;
    g.add(m);
    g.userData.sheet = m;
    // a sparkling seam so the mirror line is easy to see on the ground
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xdff3ff }));
      s.position.set(0, 0.15, -14 + i * 2.15);
      s.userData = { z0: s.position.z, ph: i * 0.9 };
      g.add(s); sparkles.push(s);
    }
    return g;
  }

  function toggle(atX, atZ) {
    on = !on;
    if (on) {
      planeX = Math.round(atX);
      if (!wall) { wall = buildWall(); }
      wall.position.set(planeX, 0, Math.round(atZ || 0));
      scene.add(wall);
      ABC.audio.sfx.shimmer ? ABC.audio.sfx.shimmer() : ABC.audio.sfx.ding();
      ABC.ui.toast(ABC.tpl('🪞 Mirror Magic ON! Build on one side — the mirror builds the other!'), 4200, true);
    } else {
      if (wall) scene.remove(wall);
      ABC.ui.toast(ABC.tpl('🪞 Mirror Magic off. Your buildings stay!'), 2800, true);
      ABC.audio.sfx.pop();
    }
    return on;
  }

  const isOn = () => on;
  const mx = (x) => 2 * planeX - x - 1;              // mirrored cell x
  /* rotations 0..3 face N/E/S/W; reflecting across an x-plane swaps E and W */
  const mrot = (rot) => (rot === 1 ? 3 : rot === 3 ? 1 : rot);

  /* called by main.js right after a successful place — echoes it across the mirror */
  function echoPlace(cell, id, rot) {
    if (!on) return false;
    const x2 = mx(cell.x);
    if (x2 === cell.x) return false;
    if (ABC.world.set(x2, cell.y, cell.z, id, mrot(rot))) {
      if (!firstUse) {
        firstUse = true;
        ABC.stickers.award && ABC.stickers.award('mirror-magic');
      }
      return true;
    }
    return false;
  }
  /* and after a successful dig */
  function echoDig(cell) {
    if (!on) return false;
    const x2 = mx(cell.x);
    if (x2 === cell.x) return false;
    return !!ABC.world.remove(x2, cell.y, cell.z);
  }

  function update(dt) {
    if (!on || !wall) return;
    t += dt;
    wall.userData.sheet.material.opacity = 0.5 + Math.sin(t * 1.6) * 0.18;
    for (const s of sparkles) {
      s.position.y = 0.15 + (Math.sin(t * 1.2 + s.userData.ph) + 1) * 2.2;
      s.scale.setScalar(0.7 + Math.sin(t * 3 + s.userData.ph) * 0.4);
    }
  }

  return { init, toggle, isOn, echoPlace, echoDig, update, mx };
})();
