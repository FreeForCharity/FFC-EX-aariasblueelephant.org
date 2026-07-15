/* Aaria's Block Craft 3D — seasonal dress-up 🍂❄️🌸☀️
   The home meadow quietly follows the real calendar: pumpkins and drifting
   leaves in fall, snowmen and snowfall in winter, blossom trees and
   butterflies in spring, sunflowers and dragonflies in summer. Pure
   decoration — nothing to tap, nothing saved, fresh every visit — so the
   world feels alive when a child comes back after a while. */
ABC.seasons = (function () {
  let scene = null, t = 0;
  const drifters = [];   // animated particles/critters
  const lam = (color, emissive) => new THREE.MeshLambertMaterial({ color, emissive: emissive || 0x000000 });
  const cur = () => {
    const m = new Date().getMonth() + 1;
    return m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'fall';
  };

  function spriteOf(emoji, scale) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.font = '50px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(emoji, 32, 36);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    s.scale.set(scale, scale, 1);
    return s;
  }
  const gy = (x, z) => {
    const tb = ABC.world.topBlock(Math.round(x), Math.round(z));
    return tb ? tb.y + 1 : 1;
  };
  /* scatter spots in a ring around home, away from the main build area */
  function spots(n, seed) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + seed;
      const r = 14 + ((i * 7 + seed * 13) % 14);
      out.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return out;
  }

  function pumpkin(x, z) {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), lam(0xe8871e, 0x4a2a08));
    p.scale.y = 0.75; p.position.y = 0.32; g.add(p);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.22, 6), lam(0x5d7a3a));
    stem.position.y = 0.68; g.add(stem);
    g.position.set(x, gy(x, z), z);
    return g;
  }
  function snowman(x, z) {
    const g = new THREE.Group();
    const w = lam(0xf4f8fc, 0x555c62);
    [[0.5, 0.5], [0.36, 1.22], [0.26, 1.75]].forEach(([r, y]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), w);
      b.position.y = y; g.add(b);
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), lam(0xe8871e, 0x4a2a08));
    nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.78, 0.3); g.add(nose);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), new THREE.MeshBasicMaterial({ color: 0x222222 }));
      eye.position.set(0.1 * s, 1.86, 0.22); g.add(eye);
    }
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.26, 10), lam(0x333a44));
    hat.position.y = 2.06; g.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), lam(0x333a44));
    brim.position.y = 1.94; g.add(brim);
    g.position.set(x, gy(x, z), z);
    return g;
  }
  function blossom(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8), lam(0x8a6a4a, 0x2a1f14));
    trunk.position.y = 0.7; g.add(trunk);
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.55 - i * 0.1, 10, 8), lam(0xf7c1d9, 0x6e4a58));
      puff.position.set((i - 1) * 0.35, 1.5 + (i % 2) * 0.3, (i - 1) * 0.15);
      g.add(puff);
    }
    g.position.set(x, gy(x, z), z);
    return g;
  }
  function sunflower(x, z) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.1, 6), lam(0x4d8f3a, 0x1d3a16));
    stem.position.y = 0.55; g.add(stem);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12), lam(0x6b4a1e));
    head.rotation.x = Math.PI / 2.6; head.position.set(0, 1.12, 0.08); g.add(head);
    for (let i = 0; i < 10; i++) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), lam(0xffd43b, 0x6e5a12));
      const a = (i / 10) * Math.PI * 2;
      petal.scale.set(1, 1.8, 0.4);
      petal.position.set(Math.cos(a) * 0.32, 1.12 + Math.sin(a) * 0.3, 0.1 - Math.sin(a) * 0.12);
      g.add(petal);
    }
    g.position.set(x, gy(x, z), z);
    return g;
  }

  function drifter(emoji, scale, mode) {
    const s = spriteOf(emoji, scale);
    const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 20;
    s.position.set(Math.cos(a) * r, 3 + Math.random() * 5, Math.sin(a) * r);
    s.userData = { mode, t: Math.random() * 9, x0: s.position.x, z0: s.position.z, y0: s.position.y };
    scene.add(s); drifters.push(s);
    return s;
  }

  function decorate() {
    const season = cur();
    const seed = new Date().getDate();
    if (season === 'fall') {
      spots(8, seed).forEach(([x, z], i) => scene.add(i % 3 === 2 ? blossomLessMushroom(x, z) : pumpkin(x, z)));
      for (let i = 0; i < 10; i++) drifter(['🍂', '🍁'][i % 2], 0.55, 'fall');
    } else if (season === 'winter') {
      spots(6, seed).forEach(([x, z]) => scene.add(snowman(x, z)));
      for (let i = 0; i < 16; i++) drifter('❄️', 0.4, 'fall');
    } else if (season === 'spring') {
      spots(7, seed).forEach(([x, z]) => scene.add(blossom(x, z)));
      for (let i = 0; i < 8; i++) drifter('🦋', 0.5, 'flutter');
    } else {
      spots(8, seed).forEach(([x, z]) => scene.add(sunflower(x, z)));
      for (let i = 0; i < 6; i++) drifter('🐝', 0.4, 'flutter');
    }
    // a once-per-season hello (per day at most, and only after the title)
    try {
      const key = 'abcSeasonSeen', v = season + ':' + new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(key) !== v) {
        localStorage.setItem(key, v);
        const line = {
          fall: '🍂 Fall has come to the meadow — pumpkin time!',
          winter: '⛄ Winter is here — the meadow built snowmen for you!',
          spring: '🌸 Spring is here — the blossom trees are out!',
          summer: '🌻 Summer sunshine — the sunflowers are watching you build!',
        }[season];
        setTimeout(() => ABC.ui && ABC.ui.toast(ABC.tpl(line), 4600, true), 6000);
      }
    } catch (e) {}
  }
  function blossomLessMushroom(x, z) {   // little fall mushroom
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8), lam(0xf2e8d8, 0x5e5a50));
    stem.position.y = 0.15; g.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xc0392b, 0x4a120c));
    cap.position.y = 0.3; g.add(cap);
    g.position.set(x, gy(x, z), z);
    return g;
  }

  function init(sc) { scene = sc; decorate(); }

  function update(dt) {
    t += dt;
    for (const d of drifters) {
      const u = d.userData;
      u.t += dt;
      if (u.mode === 'fall') {
        d.position.y -= dt * (u.mode === 'fall' ? 0.5 : 0);
        d.position.x = u.x0 + Math.sin(u.t * 1.4) * 1.2;
        d.material.rotation = Math.sin(u.t * 2) * 0.6;
        if (d.position.y < 0.3) { d.position.y = u.y0 + 3 + Math.random() * 3; u.x0 = (Math.random() - 0.5) * 44; d.position.z = (Math.random() - 0.5) * 44; }
      } else {
        d.position.x = u.x0 + Math.sin(u.t * 0.7) * 3;
        d.position.z = u.z0 + Math.cos(u.t * 0.5) * 3;
        d.position.y = u.y0 + Math.sin(u.t * 2.2) * 0.6;
        d.material.rotation = Math.sin(u.t * 8) * 0.25;
      }
    }
  }

  return { init, update, cur };
})();
