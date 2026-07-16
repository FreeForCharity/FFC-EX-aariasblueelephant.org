/* Aaria's Block Craft 3D — seasonal dress-up 🍂❄️🌸☀️ + holidays 🎃🪔🎄
   The home meadow quietly follows the real calendar: pumpkins and drifting
   leaves in fall, snowmen and snowfall in winter, blossom trees and
   butterflies in spring, sunflowers and dragonflies in summer. On top of
   the season, HOLIDAYS bring their own magic during their real dates:
   New Year sparkles, MLK kindness hearts, Valentine's, Memorial Day /
   July 4th / Labor Day / Veterans Day flags, Juneteenth, Halloween
   jack-o'-lanterns and friendly ghosts, Diwali diya lamps (real dates per
   year), Thanksgiving turkeys, and a Christmas tree with presents.
   Everything gentle and sensory-friendly — twinkles, never bangs. Pure
   decoration — nothing to tap, nothing saved, fresh every visit. */
ABC.seasons = (function () {
  let scene = null, t = 0;
  const drifters = [];   // animated particles/critters
  const lam = (color, emissive) => new THREE.MeshLambertMaterial({ color, emissive: emissive || 0x000000 });
  const cur = () => {
    const m = new Date().getMonth() + 1;
    return m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'fall';
  };

  /* ---------- the holiday calendar (US holidays + Diwali) ---------- */
  const nthWeekday = (yr, mo, dow, n) => {           // e.g. 4th Thursday of Nov
    const first = new Date(yr, mo - 1, 1).getDay();
    return 1 + ((dow - first + 7) % 7) + (n - 1) * 7;
  };
  const DIWALI = { 2025: [10, 20], 2026: [11, 8], 2027: [10, 29], 2028: [10, 17], 2029: [11, 5], 2030: [10, 26] };
  function holiday(now) {
    const d = now || new Date();
    const yr = d.getFullYear(), mo = d.getMonth() + 1, dy = d.getDate();
    const in_ = (m1, d1, m2, d2) => (mo > m1 || (mo === m1 && dy >= d1)) && (mo < m2 || (mo === m2 && dy <= d2));
    const dw = DIWALI[yr];
    if (dw && mo === dw[0] && Math.abs(dy - dw[1]) <= 4) return 'diwali';
    if (in_(1, 1, 1, 7)) return 'newyear';
    const mlk = nthWeekday(yr, 1, 1, 3);
    if (mo === 1 && Math.abs(dy - mlk) <= 1) return 'mlk';
    if (in_(2, 7, 2, 14)) return 'valentine';
    const mem = (() => { const last = new Date(yr, 5, 0).getDate(); for (let k = last; k > last - 7; k--) if (new Date(yr, 4, k).getDay() === 1) return k; })();
    if (mo === 5 && dy >= mem - 3 && dy <= 31) return 'flags';        // Memorial Day
    if (in_(6, 17, 6, 21)) return 'juneteenth';
    if (in_(7, 1, 7, 7)) return 'july4';
    if (mo === 9 && dy <= nthWeekday(yr, 9, 1, 1) + 1) return 'flags'; // Labor Day
    if (in_(10, 15, 10, 31)) return 'halloween';
    if (mo === 11 && Math.abs(dy - 11) <= 1) return 'flags';           // Veterans Day
    const tg = nthWeekday(yr, 11, 4, 4);
    if (mo === 11 && dy >= tg - 5 && dy <= tg + 2) return 'thanksgiving';
    if (in_(12, 1, 12, 27)) return 'christmas';
    return null;
  }
  const HOLIDAY_HELLO = {
    newyear: '🎉 Happy New Year! The meadow is sparkling for you!',
    mlk: '💖 Kindness Day! Dr. King taught us to be kind helpers — the meadow is full of hearts!',
    valentine: '💖 Happy Valentine’s Day! The meadow loves you!',
    flags: '🇺🇸 The meadow raised its flags today — a day to say thank you!',
    juneteenth: '🎉 Happy Juneteenth — a day of freedom and joy!',
    july4: '🎆 Happy Fourth of July! Gentle twinkles in the sky tonight!',
    halloween: '🎃 Happy Halloween! The pumpkins are smiling at you!',
    diwali: '🪔 Happy Diwali! The little lamps are lit for the festival of lights!',
    thanksgiving: '🦃 Happy Thanksgiving! The turkeys came to say thank YOU!',
    christmas: '🎄 Merry Christmas! There is a twinkly tree with presents in the meadow!',
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
  /* scatter spots in a ring around home, away from the main build area —
     every spot goes through the breathing-room guard (ABC.space), which
     slides it outward if shops/tracks/squishies/other props are close,
     and drops it entirely when the meadow is genuinely full */
  function spots(n, seed) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + seed;
      const r = 16 + ((i * 7 + seed * 13) % 16);
      let x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (ABC.space) {
        const spot = ABC.space.claim(x, z, 2.6);
        if (!spot) continue;
        x = spot.x; z = spot.z;
      }
      out.push([x, z]);
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

  /* ---------- holiday builders ---------- */
  function glow(inner, outer, scale) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(scale, scale, 1);
    return s;
  }
  function diya(x, z) {          // 🪔 a little clay lamp with a warm flame
    const g = new THREE.Group();
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lam(0xb5651d, 0x4a2808));
    bowl.scale.y = 0.8; bowl.position.y = 0.18; g.add(bowl);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 14), lam(0xd9a62e, 0x6e5312));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.19; g.add(rim);
    const flame = glow('rgba(255,214,120,1)', 'rgba(255,150,40,0)', 0.8);
    flame.position.y = 0.42; flame.userData.flicker = Math.random() * 9;
    g.add(flame); g.userData.flame = flame;
    g.position.set(x, gy(x, z), z);
    return g;
  }
  function jacko(x, z) {         // 🎃 friendly glowing jack-o'-lantern
    const g = pumpkin(x, z);
    const face = new THREE.MeshBasicMaterial({ color: 0xffd23f });
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.04), face);
      eye.position.set(0.13 * s, 0.42, 0.38); g.add(eye);
    }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.04), face);
    mouth.position.set(0, 0.24, 0.4); g.add(mouth);
    const gl = glow('rgba(255,190,80,0.9)', 'rgba(255,140,30,0)', 1.1);
    gl.position.y = 0.35; g.add(gl);
    return g;
  }
  function flag(x, z) {          // 🇺🇸 a small friendly flag on a pole
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 6), lam(0x9aa3b2, 0x3a3f47));
    pole.position.y = 0.85; g.add(pole);
    const cloth = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 0.03), lam(i % 2 ? 0xf4f8fc : 0xc0392b, i % 2 ? 0x555c62 : 0x4a120c));
      stripe.position.set(0.42, 1.5 - i * 0.09, 0); cloth.add(stripe);
    }
    const canton = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.035), lam(0x2456a6, 0x0e2246));
    canton.position.set(0.17, 1.46, 0); cloth.add(canton);
    g.add(cloth); g.userData.cloth = cloth;
    const topper = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), lam(0xd9a62e, 0x6e5312));
    topper.position.y = 1.72; g.add(topper);
    g.position.set(x, gy(x, z), z);
    return g;
  }
  function xmasTree(x, z) {      // 🎄 twinkly tree with presents
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.6, 8), lam(0x7a5c40, 0x2a1f14));
    trunk.position.y = 0.3; g.add(trunk);
    [[1.1, 0.9], [0.85, 1.6], [0.6, 2.25]].forEach(([r, y]) => {
      const tier = new THREE.Mesh(new THREE.ConeGeometry(r, 1.0, 10), lam(0x2f7d4a, 0x11301c));
      tier.position.y = y; g.add(tier);
    });
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    star.position.y = 2.85; g.add(star);
    const lightCols = [0xff6b6b, 0xffd43b, 0x69db7c, 0x4dabf7, 0xb197fc];
    const lights = [];
    for (let i = 0; i < 12; i++) {
      const a = i * 1.7, y = 0.7 + (i / 12) * 1.9, r = 1.05 - (y / 3);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: lightCols[i % 5] }));
      l.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      l.userData.ph = i; g.add(l); lights.push(l);
    }
    g.userData.lights = lights;
    [[0.7, 0, 0xc0392b], [-0.6, 0.35, 0x2456a6], [0.1, 0.75, 0xd9a62e]].forEach(([px, pz, col]) => {
      const gift = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.38), lam(col, 0x222222));
      gift.position.set(px, 0.16, pz);
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.1), lam(0xf4f8fc, 0x555c62));
      rib.position.set(px, 0.34, pz);
      g.add(gift, rib);
    });
    g.position.set(x, gy(x, z), z);
    return g;
  }

  const holidayFX = [];          // twinkling things that need per-frame love
  function holidayDecorate(h) {
    if (h === 'diwali') {
      // two warm rows of diyas along the home path — skip spots in use
      for (let i = -4; i <= 4; i++) for (const zz of [4, 7]) {
        if (ABC.space && !ABC.space.isFree(i * 1.6, zz, 0.9)) continue;
        ABC.space && ABC.space.reserve(i * 1.6, zz, 0.9);
        const d = diya(i * 1.6, zz); scene.add(d); holidayFX.push(d);
      }
    } else if (h === 'halloween') {
      spots(6, 3).forEach(([x, z]) => { const j = jacko(x, z); scene.add(j); });
      for (let i = 0; i < 5; i++) drifter('👻', 0.7, 'flutter');
    } else if (h === 'christmas') {
      const tp = ABC.space ? ABC.space.claim(6, 8, 3) : { x: 6, z: 8 };
      if (tp) { const t = xmasTree(tp.x, tp.z); scene.add(t); holidayFX.push(t); }
      for (let i = 0; i < 4; i++) { const s = spriteOf('🍭', 0.8); const [x, z] = [4 - i * 2.6, 5]; s.position.set(x, gy(x, z) + 0.4, z); scene.add(s); }
    } else if (h === 'flags' || h === 'july4') {
      spots(6, 5).forEach(([x, z]) => { const f = flag(x, z); scene.add(f); holidayFX.push(f); });
      if (h === 'july4') for (let i = 0; i < 8; i++) { const d = drifter('✨', 0.7, 'flutter'); d.position.y += 6; d.userData.y0 += 6; }
    } else if (h === 'valentine' || h === 'mlk') {
      for (let i = 0; i < 10; i++) drifter('💖', 0.5, 'flutter');
    } else if (h === 'newyear' || h === 'juneteenth') {
      for (let i = 0; i < 12; i++) drifter(['✨', '🎉'][i % 2], 0.55, 'flutter');
    } else if (h === 'thanksgiving') {
      spots(5, 4).forEach(([x, z], i) => {
        if (i % 2) { const p = pumpkin(x, z); scene.add(p); }
        else { const t = spriteOf('🦃', 1.3); t.position.set(x, gy(x, z) + 0.6, z); scene.add(t); }
      });
    }
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
    // holidays layer their own magic ON TOP of the season
    const h = holiday();
    if (h) holidayDecorate(h);
    // a once-per-day hello — the holiday greeting wins when there is one
    try {
      const key = 'abcSeasonSeen', v = (h || season) + ':' + new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(key) !== v) {
        localStorage.setItem(key, v);
        const line = h ? HOLIDAY_HELLO[h] : {
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

  /* decorate AFTER the world save has loaded, so tracks/squishies/shops
     have reserved their spots first (ABC.space) and we keep clear of them */
  function init(sc) { scene = sc; }

  function update(dt) {
    t += dt;
    // holiday twinkles: diya flames flicker, tree lights blink, flags wave
    for (const fx of holidayFX) {
      if (fx.userData.flame) {
        const f = fx.userData.flame;
        f.userData.flicker += dt * 7;
        f.scale.setScalar(0.65 + Math.sin(f.userData.flicker) * 0.14 + Math.sin(f.userData.flicker * 2.7) * 0.06);
      }
      if (fx.userData.lights) for (const l of fx.userData.lights)
        l.material.color.offsetHSL ? l.scale.setScalar(0.8 + Math.sin(t * 3 + l.userData.ph) * 0.35) : null;
      if (fx.userData.cloth) fx.userData.cloth.rotation.y = Math.sin(t * 1.8 + fx.position.x) * 0.18;
    }
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

  /* test hook: force a holiday's decorations (never persists) */
  function _force(h) { if (h) holidayDecorate(h); return HOLIDAY_HELLO[h]; }

  return { init, update, cur, holiday, decorate, _force };
})();
