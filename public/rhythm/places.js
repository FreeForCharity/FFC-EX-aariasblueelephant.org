/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Nilu's Music Meadow — THE FAR PLACES  (window.RPlaces)   [adventure layer]
   ---------------------------------------------------------------------------
   Four destinations out past the tree ring, each with a silhouette a child can
   point at from the band and say "what's THAT?", each joined to the meadow by a
   lantern-lit path so nobody can ever get lost:

       💧 Waterfall Grotto  (north-west)  a pale cliff, a falling ribbon of
                                          water, drifting mist and four
                                          stepping-stones that sing
       🫐 Berry Hollow      (south-west)  a sunken plum-coloured dell of berry
                                          bushes you walk into to pick a berry
       ✨ Star Clearing     (north-east)  a wide dark bowl ringed by black
                                          cypress, where the sky is biggest
       🌳 Nilu's Treehouse  (south-east)  a giant blossom tree with a spiral
                                          ramp up to a platform with a view

   Plus a signpost at the meadow edge with four pointing arms, four spokes from
   the tree line, and the Lantern Loop — a curving ring road that touches every
   front door.

   ZONE: everything here lives at radius 34..78 from the origin. The inner
   meadow (0..34) belongs to another layer and is never touched. Path spokes
   begin at r=27 inside the tree ring (26..38), which is the agreed soft edge.

   REACHING IT: layer 2 (walk.js) gathers the child back inside r=34 and has no
   setBound(), so on its own not one of these places could ever be walked to.
   roam() below widens that edge to cover this ring — see §4b. Because it works
   through RWalk.pos, index.html must keep ticking RPlaces straight after RWalk
   (it does).

   NO-FAIL: nothing here can be failed, missed forever, or softlocked. Berries
   regrow, stones can be replayed, every path is lit in both directions.

   Plain browser script. three r128 only. Loaded after lib/three.min.js and
   ../gamekit/kit.js; wired up later by an integration step that calls
   RPlaces.build(host) and RPlaces.tick(dt). Bilingual EN/ES from birth. */
(function () {
  "use strict";

  /* ======================================================================
     1. THE PLACES TABLE — a grown-up can edit this copy safely
     ====================================================================== */

  const PLACES = [
    {
      id: 'grotto', emoji: '💧', x: -31, z: -41, radius: 12,
      name: { en: 'Waterfall Grotto', es: 'La Gruta de la Cascada' },
      hint: { en: 'Far away, water is singing to itself.',
              es: 'A lo lejos, el agua canta sola.' },
      hello: { en: '💧 The Waterfall Grotto! Step on the four stones — each one sings.',
               es: '💧 ¡La Gruta de la Cascada! Pisa las cuatro piedras — cada una canta.' },
      again: { en: '💧 The waterfall says hello again.',
               es: '💧 La cascada te saluda otra vez.' },
      card: { en: 'A cliff of pale stone, and water falling like a ribbon.',
              es: 'Un acantilado de piedra clara y agua que cae como una cinta.' },
    },
    {
      id: 'berry', emoji: '🫐', x: -40, z: 27, radius: 12,
      name: { en: 'Berry Hollow', es: 'El Hueco de las Bayas' },
      hint: { en: 'Something sweet grows in a dip in the ground.',
              es: 'Algo dulce crece en un hueco del suelo.' },
      hello: { en: '🫐 Berry Hollow! Walk right into a bush to pick a berry.',
               es: '🫐 ¡El Hueco de las Bayas! Métete en un arbusto para recoger una baya.' },
      again: { en: '🫐 More berries have grown back.',
               es: '🫐 Han crecido más bayas.' },
      card: { en: 'A soft plum-coloured dell where berries always grow back.',
              es: 'Un valle color ciruela donde las bayas siempre vuelven a crecer.' },
    },
    {
      id: 'star', emoji: '✨', x: 33, z: -45, radius: 14,
      name: { en: 'Star Clearing', es: 'El Claro de las Estrellas' },
      hint: { en: 'Somewhere out there the sky is very, very big.',
              es: 'En algún lugar allá afuera el cielo es enorme.' },
      hello: { en: '✨ The Star Clearing! Stand in the middle and look up.',
               es: '✨ ¡El Claro de las Estrellas! Ponte en el medio y mira hacia arriba.' },
      again: { en: '✨ The big quiet sky is still here.',
               es: '✨ El cielo grande y tranquilo sigue aquí.' },
      card: { en: 'A dark bowl in the grass where you can see the whole sky.',
              es: 'Un cuenco oscuro en la hierba donde se ve todo el cielo.' },
    },
    {
      id: 'treehouse', emoji: '🌳', x: 38, z: 31, radius: 13,
      name: { en: "Nilu's Treehouse", es: 'La Casa del Árbol de Nilu' },
      hint: { en: 'A very tall tree with something built in it.',
              es: 'Un árbol altísimo con algo construido en lo alto.' },
      hello: { en: '🌳 The Treehouse! Walk round and round the trunk to go up.',
               es: '🌳 ¡La Casa del Árbol! Da vueltas al tronco para subir.' },
      again: { en: '🌳 The blossom tree is waiting for you.',
               es: '🌳 El árbol de flores te está esperando.' },
      card: { en: 'A giant pink blossom tree with a spiral ramp and a little hut.',
              es: 'Un árbol gigante de flores rosas con una rampa en espiral y una cabañita.' },
    },
  ];

  /* extra discoverable moments this layer owns (the journal reads these) */
  const MOMENTS = [
    { id: 'signpost', emoji: '🪧',
      name: { en: 'The Old Signpost', es: 'El Viejo Letrero' },
      hint: { en: 'Walk to the edge of the meadow and see where the paths go.',
              es: 'Camina hasta el borde del prado y mira a dónde van los caminos.' },
      card: { en: 'Four wooden arms, pointing at four adventures.',
              es: 'Cuatro brazos de madera que señalan cuatro aventuras.' } },
    { id: 'grotto.song', emoji: '🎼', earned: true,
      name: { en: 'The Waterfall Song', es: 'La Canción de la Cascada' },
      hint: { en: 'Four stones in the water. Step on every one.',
              es: 'Cuatro piedras en el agua. Písalas todas.' },
      card: { en: 'You played all four stepping-stones and the waterfall sang.',
              es: 'Tocaste las cuatro piedras y la cascada cantó.' } },
    { id: 'berry.basket', emoji: '🧺', earned: true,
      name: { en: 'A Basket of Berries', es: 'Una Cesta de Bayas' },
      hint: { en: 'Pick five berries in one little walk.',
              es: 'Recoge cinco bayas en un mismo paseo.' },
      card: { en: 'Five berries at once! Somebody shy might like those.',
              es: '¡Cinco bayas a la vez! A alguien tímido le pueden gustar.' } },
    { id: 'star.wish', emoji: '🌠', earned: true,
      name: { en: 'A Wishing Star', es: 'Una Estrella de los Deseos' },
      hint: { en: 'Stand very still in the middle of the big dark bowl.',
              es: 'Quédate muy quieto en el medio del cuenco oscuro.' },
      card: { en: 'A star slid right across the sky, just for you.',
              es: 'Una estrella cruzó el cielo entero, solo para ti.' } },
    /* This one is earned by walking the spiral ramp's six lanterns alight. The
       walker has no y-axis (RWalk.pose() is x/z only), so the copy talks about
       what really happens — the tree lighting up — and never claims a view from
       a platform the child has not actually stood on. */
    { id: 'treehouse.top', emoji: '🏮', earned: true,
      name: { en: 'The Lantern Climb', es: 'La Subida de los Faroles' },
      hint: { en: 'Circle the big tree until every ramp lantern is lit.',
              es: 'Rodea el árbol grande hasta encender todos los faroles de la rampa.' },
      card: { en: 'You lit every lantern on the spiral ramp. The whole tree glows!',
              es: 'Encendiste todos los faroles de la rampa. ¡El árbol entero brilla!' } },
    { id: 'lanternloop', emoji: '🗺️', earned: true,
      name: { en: 'The Lantern Loop', es: 'La Vuelta de los Faroles' },
      hint: { en: 'Visit all four faraway places.',
              es: 'Visita los cuatro lugares lejanos.' },
      card: { en: 'You found every place out past the trees. Explorer!',
              es: '¡Encontraste todos los lugares que hay más allá de los árboles!' } },
  ];

  const SIGN = { x: 0, z: -35 };          // meadow edge, dead ahead of the band
  const SPOKE_R = 27;                     // where a spoke leaves the tree ring
  const DOOR_IN = 9;                      // front door = place radius minus this
  const BERRY_CAP = 12;                   // the basket stops LOOKING fuller past this
  const MEADOW_BOUND = 34;                // layer 2's own soft edge (walk.js BOUND)

  /* ======================================================================
     2. tiny safe wrappers — the meadow must never break because of us
     ====================================================================== */

  let K = window.ABEKit || {};
  const tr = (en, es) => { try { return K.tr ? K.tr(en, es) : en; } catch (e) { return en; } };
  const L = (o) => (o ? tr(o.en, o.es) : '');
  const calm = () => { try { return !!(K.calm && K.calm()); } catch (e) { return false; } };
  const speed = () => { try { const s = K.speed && K.speed(); return s > 0 ? s : 1; } catch (e) { return 1; } };
  const reduceMotion = () => {
    try { const r = K.reduceMotion; return typeof r === 'function' ? !!r() : !!r; } catch (e) { return false; }
  };
  const toast = (m, ms) => { try { K.toast && K.toast(m, ms); } catch (e) {} };
  const say = (m) => { try { K.say && K.say(m); } catch (e) {} };
  const sfxTap = () => { try { K.sfx && K.sfx.tap && K.sfx.tap(); } catch (e) {} };
  const sfxStar = () => { try { K.sfx && K.sfx.star && K.sfx.star(); } catch (e) {} };
  const bump = () => { try { K.streakBump && K.streakBump(); } catch (e) {} };
  const rec = (k, x) => { try { K.recordEvent && K.recordEvent(k, x); } catch (e) {} };
  const load = (k, d) => { try { return K.load ? K.load(k, d) : d; } catch (e) { return d; } };
  const save = (k, v) => { try { K.save && K.save(k, v); } catch (e) {} };
  const walk = () => S.RWalk || window.RWalk || null;
  const songPlaying = () => { try { return !!(window.RGame && window.RGame.active); } catch (e) { return false; } };
  const nightness = () => {
    try { const g = window.RM && window.RM.G; return g ? (g.night || 0) : 0; } catch (e) { return 0; }
  };

  /* ======================================================================
     3. state
     ====================================================================== */

  const S = {
    built: false, THREE: null, scene: null, RWalk: null, host: null,
    root: null, t: 0, amb: 1,
    px: 0, pz: 0,                        // live player position (no allocation)
    found: {},                           // id -> 1
    berries: 0,                          // berries in hand right now
    loopDelay: 3.2,                      // beat before the "all four!" fanfare
    stones: [0, 0, 0, 0], stonesLit: 0,
    ramp: [0, 0, 0, 0, 0, 0], rampLit: 0,
    inPlace: '', atStarMid: false, dwell: 0,
    roamR: MEADOW_BOUND,                 // how far out the child may walk (set in build)
    localNight: 0, starToastT: 0,        // the Star Clearing's own private dusk
    topDone: false, topCool: 0, totalDone: false,
    lanternBoost: 0, lanternTarget: 0,
    wishT: -1,
    subs: [],
    pending: [],                         // spots waiting for RWalk to appear
    retry: 0,
  };

  const G = {};   // shared geometries
  const M = {};   // shared materials
  const P = {};   // per-place bundles

  /* ======================================================================
     4. little builders (all shared, all emissive-lifted for twilight)
     ====================================================================== */

  let THREE = null;
  const lam = (color, emissive) => new THREE.MeshLambertMaterial({ color: color, emissive: emissive || 0x1a1a2a });

  const emojiTexCache = {};
  function emojiTex(emoji) {
    if (emojiTexCache[emoji]) return emojiTexCache[emoji];
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.font = '102px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(emoji, 64, 70);
    const t = new THREE.CanvasTexture(c);
    emojiTexCache[emoji] = t;
    return t;
  }
  function emojiSprite(emoji, scale, noFog) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: emojiTex(emoji), transparent: true, depthWrite: false,
    }));
    if (noFog) s.material.fog = false;
    s.scale.set(scale, scale, 1);
    return s;
  }
  const dotTexCache = {};
  function dotTex(inner, outer) {
    const key = inner + '|' + outer;
    if (dotTexCache[key]) return dotTexCache[key];
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 3, 64, 64, 62);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    dotTexCache[key] = t;
    return t;
  }
  function glowSprite(inner, outer, scale, noFog) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTex(inner, outer), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    if (noFog) s.material.fog = false;
    s.scale.set(scale, scale, 1);
    return s;
  }
  /* a soft glowing point cloud (fireflies, mist, stars) — one object, many dots */
  function dotCloud(n, size, inner, outer, opacity, noFog) {
    const pos = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      map: dotTex(inner, outer), size: size, transparent: true, opacity: opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    if (noFog) mat.fog = false;
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.userData.arr = pos;
    return pts;
  }
  /* a small label plaque: emoji + a short name, for the signpost arms */
  function labelSprite(emoji, text, w) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 72;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,251,240,0.94)';
    const r = 18;
    g.beginPath();
    g.moveTo(r, 0); g.lineTo(256 - r, 0); g.quadraticCurveTo(256, 0, 256, r);
    g.lineTo(256, 72 - r); g.quadraticCurveTo(256, 72, 256 - r, 72);
    g.lineTo(r, 72); g.quadraticCurveTo(0, 72, 0, 72 - r);
    g.lineTo(0, r); g.quadraticCurveTo(0, 0, r, 0); g.closePath(); g.fill();
    g.font = '46px serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(emoji, 12, 38);
    g.fillStyle = '#3a3a5a'; g.textAlign = 'left';
    let size = 26;
    g.font = '900 ' + size + 'px system-ui, sans-serif';
    while (g.measureText(text).width > 178 && size > 13) {
      size -= 1; g.font = '900 ' + size + 'px system-ui, sans-serif';
    }
    g.fillText(text, 68, 40);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false,
    }));
    s.material.fog = false;
    s.scale.set(w, w * 72 / 256, 1);
    return s;
  }

  /* instanced-mesh helper (build time only — a Matrix4 per call is fine here) */
  let _m = null, _v = null, _q = null, _e = null, _s = null;
  function setInst(im, i, x, y, z, rx, ry, rz, sx, sy, sz) {
    _v.set(x, y, z); _e.set(rx, ry, rz); _q.setFromEuler(_e); _s.set(sx, sy, sz);
    _m.compose(_v, _q, _s);
    im.setMatrixAt(i, _m);
  }
  function hideInst(im, i) {
    _v.set(0, -900, 0); _e.set(0, 0, 0); _q.setFromEuler(_e); _s.set(0.0001, 0.0001, 0.0001);
    _m.compose(_v, _q, _s); im.setMatrixAt(i, _m); im.instanceMatrix.needsUpdate = true;
  }

  /* turn a group so its local +Z faces the meadow centre */
  function faceMeadow(grp, x, z) {
    grp.position.set(x, 0, z);
    grp.rotation.y = Math.atan2(-x, -z);
    return grp;
  }
  /* local (lx,lz) inside such a group -> world (no matrix update needed) */
  function toWorld(grp, lx, lz, out) {
    const a = grp.rotation.y, ca = Math.cos(a), sa = Math.sin(a);
    out.x = grp.position.x + lx * ca + lz * sa;
    out.z = grp.position.z - lx * sa + lz * ca;
    return out;
  }
  const _w = { x: 0, z: 0 };

  /* ======================================================================
     4b. THE WALKABLE WORLD — how the child is allowed out here at all

     walk.js gathers the child back inside r = MEADOW_BOUND every frame:

         if (r > BOUND) { pull = (r - BOUND) * lerpK(dt, 3.5); ... }

     which settles a walker at r ≈ 35.2 — short of even the nearest of our
     front doors. It is exactly the right edge for the meadow, and layer 2
     offers no way to move it, so we widen it from our side instead. index.html
     ticks RPlaces immediately after RWalk, so every frame we undo the gather
     it just applied (the maths is invertible and exact) and re-apply the very
     same easing at OUR edge. Same soft feel, same "no wall, no message"
     promise — just a world big enough to hold the places in it.

     S.roamR is derived from the PLACES table in build(), so moving a place
     moves the edge with it and no number here can drift out of date.
     ====================================================================== */

  function roam(raw) {
    if (S.boundOwned) return;              // walk.js is easing at our edge itself
    const w = walk();
    const p = w && w.pos;
    if (!p || typeof p.x !== 'number' || typeof p.z !== 'number') return;
    let rep = false;
    try { rep = !!K.replaying; } catch (e) {}
    if (rep) return;                       // My Movie drives the child; hands off
    const d = Math.max(0, Math.min(0.05, +raw || 0));   // walk.js clamps dt the same way
    const k = 1 - Math.exp(-3.5 * d);
    if (!(k > 0) || k >= 1) return;
    let r = Math.hypot(p.x, p.z);
    if (r > MEADOW_BOUND) {
      /* invert  r' = r(1 - k) + BOUND·k  to recover the step actually walked.
         Capped a little past our own edge so that if layer 2 ever stops
         applying the gather, giving back a gather that never happened can
         never send a child sailing off across the ground plane. */
      const back = Math.min((r - MEADOW_BOUND * k) / (1 - k), S.roamR + 6);
      if (back > r) { p.x *= back / r; p.z *= back / r; r = back; }
    }
    if (r > S.roamR) {                     // our own soft edge, eased identically
      const pull = (r - S.roamR) * k;
      p.x -= (p.x / r) * pull;
      p.z -= (p.z / r) * pull;
    }
  }

  /* ======================================================================
     5. paths: gentle bezier curves, resampled into stones + lanterns
     ====================================================================== */

  function curvePts(ax, az, bx, bz, bulge, n) {
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    let dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    let px = -dz / len, pz = dx / len;
    if (px * mx + pz * mz < 0) { px = -px; pz = -pz; }      // always bulge outward
    const cx = mx + px * bulge, cz = mz + pz * bulge;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push(u * u * ax + 2 * u * t * cx + t * t * bx);
      out.push(u * u * az + 2 * u * t * cz + t * t * bz);
    }
    return out;                                             // flat [x,z, x,z, ...]
  }
  /* walk a flat polyline and hand back evenly spaced points */
  function resample(flat, spacing, into) {
    let carry = 0;
    for (let i = 0; i < flat.length - 2; i += 2) {
      const ax = flat[i], az = flat[i + 1], bx = flat[i + 2], bz = flat[i + 3];
      const seg = Math.hypot(bx - ax, bz - az);
      if (seg < 1e-4) continue;
      let d = carry;
      while (d < seg) {
        const t = d / seg;
        into.push(ax + (bx - ax) * t, az + (bz - az) * t);
        d += spacing;
      }
      carry = d - seg;
    }
    return into;
  }

  function buildPaths(root) {
    const stones = [];        // flat x,z
    const lamps = [];         // flat x,z

    /* --- four spokes: tree line -> each place's front door --- */
    for (let i = 0; i < PLACES.length; i++) {
      const p = PLACES[i];
      const ang = Math.atan2(p.z, p.x);
      const pr = Math.hypot(p.x, p.z);
      const doorR = pr - DOOR_IN;
      const ax = Math.cos(ang) * SPOKE_R, az = Math.sin(ang) * SPOKE_R;
      const bx = Math.cos(ang) * doorR, bz = Math.sin(ang) * doorR;
      const flat = curvePts(ax, az, bx, bz, (i % 2 ? 3.5 : -3.5), 16);
      resample(flat, 1.7, stones);
      resample(flat, 7.5, lamps);
      p._door = { x: bx, z: bz, ang: ang, r: doorR };
    }

    /* --- the Lantern Loop: a ring road that touches every front door --- */
    const order = PLACES.slice().sort((a, b) => {
      const aa = Math.atan2(a.z, a.x), bb = Math.atan2(b.z, b.x);
      return (aa < 0 ? aa + Math.PI * 2 : aa) - (bb < 0 ? bb + Math.PI * 2 : bb);
    });
    for (let i = 0; i < order.length; i++) {
      const a = order[i]._door, b = order[(i + 1) % order.length]._door;
      let dphi = Math.atan2(b.z, b.x) - Math.atan2(a.z, a.x);
      while (dphi <= 0) dphi += Math.PI * 2;
      const rm = (a.r + b.r) / 2;
      const bulge = 2 * rm * (1 - Math.cos(dphi / 2));
      const flat = curvePts(a.x, a.z, b.x, b.z, bulge, 26);
      resample(flat, 2.2, stones);
      resample(flat, 13, lamps);
    }

    /* --- a short spur from the signpost out to the nearest two spokes --- */
    for (let i = 0; i < 2; i++) {
      const p = PLACES[i === 0 ? 0 : 2];                    // grotto + star (both north)
      const ang = Math.atan2(p.z, p.x);
      const flat = curvePts(SIGN.x, SIGN.z, Math.cos(ang) * SPOKE_R, Math.sin(ang) * SPOKE_R, 2, 10);
      resample(flat, 2.0, stones);
      resample(flat, 9, lamps);
    }

    /* ---- one instanced mesh for every path stone ---- */
    G.pathStone = new THREE.CylinderGeometry(0.62, 0.7, 0.12, 7);
    M.pathStone = lam(0xd9d2c4, 0x4c4a54);
    const sn = stones.length / 2;
    const sm = new THREE.InstancedMesh(G.pathStone, M.pathStone, sn);
    sm.frustumCulled = false;
    for (let i = 0; i < sn; i++) {
      const x = stones[i * 2], z = stones[i * 2 + 1];
      const wob = ((i * 2654435761) % 1000) / 1000;
      setInst(sm, i,
        x + (wob - 0.5) * 0.9, 0.045, z + ((wob * 7 % 1) - 0.5) * 0.9,
        0, wob * 6.28, 0,
        0.75 + wob * 0.55, 1, 0.75 + ((wob * 3) % 1) * 0.55);
    }
    sm.instanceMatrix.needsUpdate = true;
    root.add(sm);

    /* ---- lantern posts + lamps + one glowing point cloud ---- */
    const ln = lamps.length / 2;
    G.lampPost = new THREE.CylinderGeometry(0.09, 0.13, 1.9, 6);
    M.lampPost = lam(0x6b5138, 0x241a10);
    G.lampHead = new THREE.SphereGeometry(0.26, 8, 6);
    /* fog off on the lamp heads so the chain of little golden dots stays
       readable all the way to the horizon — that is the "you can always get
       home" promise, and it must not fade out at distance. */
    M.lampHead = new THREE.MeshBasicMaterial({ color: 0xffe6a8, fog: false });
    const posts = new THREE.InstancedMesh(G.lampPost, M.lampPost, ln);
    const heads = new THREE.InstancedMesh(G.lampHead, M.lampHead, ln);
    posts.frustumCulled = false; heads.frustumCulled = false;
    const glow = dotCloud(ln, 2.6, 'rgba(255,231,170,1)', 'rgba(255,180,70,0)', 0.85, true);
    const ga = glow.userData.arr;
    for (let i = 0; i < ln; i++) {
      const x = lamps[i * 2], z = lamps[i * 2 + 1];
      setInst(posts, i, x, 0.95, z, 0, 0, 0, 1, 1, 1);
      setInst(heads, i, x, 2.02, z, 0, 0, 0, 1, 1, 1);
      ga[i * 3] = x; ga[i * 3 + 1] = 2.05; ga[i * 3 + 2] = z;
    }
    posts.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    glow.geometry.attributes.position.needsUpdate = true;
    root.add(posts, heads, glow);
    P.lampGlow = glow;

    return { stones: sn, lamps: ln };
  }

  /* ======================================================================
     6. the signpost at the meadow edge
     ====================================================================== */

  function buildSignpost(root) {
    const g = new THREE.Group();
    g.position.set(SIGN.x, 0, SIGN.z);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 4.6, 8), lam(0x7a5c40, 0x2f2418));
    post.position.y = 2.3; g.add(post);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.5, 8), lam(0xa8543f, 0x3d1f16));
    cap.position.y = 4.75; g.add(cap);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.3, 12), lam(0xd9d2c4, 0x4c4a54));
    base.position.y = 0.15; g.add(base);
    const top = glowSprite('rgba(255,236,180,1)', 'rgba(255,170,60,0)', 4.2, true);
    top.position.y = 5.3; g.add(top);

    const armGeo = new THREE.BoxGeometry(2.9, 0.42, 0.14);
    armGeo.translate(1.55, 0, 0);
    const armMat = lam(0xc9a06a, 0x453422);
    for (let i = 0; i < PLACES.length; i++) {
      const p = PLACES[i];
      const dx = p.x - SIGN.x, dz = p.z - SIGN.z;
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.y = 4.0 - i * 0.78;
      arm.rotation.y = Math.atan2(-dz, dx);
      g.add(arm);
      const lab = labelSprite(p.emoji, L(p.name), 3.1);
      lab.position.set(
        Math.cos(arm.rotation.y) * 3.0, 4.0 - i * 0.78 + 0.55, -Math.sin(arm.rotation.y) * 3.0);
      g.add(lab);
    }
    root.add(g);
    P.sign = g;

    addSpot('rp.signpost', SIGN.x, SIGN.z, 4.2, false, function () {
      const isNew = discover('signpost', 'The Old Signpost', 'El Viejo Letrero');
      if (isNew) {
        sfxStar(); bump(); rec('place', 0);
        say(tr('A signpost! Four arms, four adventures. Follow the lanterns — they always lead home too.',
               '¡Un letrero! Cuatro brazos, cuatro aventuras. Sigue los faroles — también te traen de vuelta a casa.'));
        celebrate('🪧 Four places to find! Follow the little lights.',
                  '🪧 ¡Cuatro lugares por encontrar! Sigue las lucecitas.', 4200);
      } else {
        toast(tr('🪧 💧 waterfall · 🫐 berries · ✨ stars · 🌳 treehouse',
                 '🪧 💧 cascada · 🫐 bayas · ✨ estrellas · 🌳 casa del árbol'), 3600);
      }
    });
  }

  /* ======================================================================
     7. 💧 WATERFALL GROTTO — north-west
     ====================================================================== */

  function buildGrotto(def) {
    const grp = faceMeadow(new THREE.Group(), def.x, def.z);
    const rock = lam(0x767a92, 0x2e3044);
    const rockDark = lam(0x5a5e74, 0x232636);
    const rockGeo = new THREE.IcosahedronGeometry(1, 0);

    /* the cliff — a pale wall you can see from the band */
    const wall = new THREE.Mesh(new THREE.BoxGeometry(19, 13, 5), rockDark);
    wall.position.set(0, 6.5, -11.5); grp.add(wall);
    const chunks = [
      [-7.5, 5.5, -8.6, 4.4, 6.0, 3.2], [7.2, 6.2, -8.8, 4.0, 6.8, 3.0],
      [-3.4, 9.6, -8.9, 3.0, 3.6, 2.4], [3.6, 10.2, -9.0, 3.4, 3.2, 2.6],
      [0, 3.2, -8.2, 5.0, 3.4, 2.6], [-9.8, 2.6, -6.4, 2.6, 2.8, 2.4],
      [9.4, 2.4, -6.6, 2.4, 2.6, 2.2],
    ];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const m = new THREE.Mesh(rockGeo, i % 2 ? rock : rockDark);
      m.position.set(c[0], c[1], c[2]);
      m.scale.set(c[3], c[4], c[5]);
      m.rotation.set(i * 0.3, i * 0.7, i * 0.2);
      grp.add(m);
    }
    /* moss along the cliff top so it isn't a grey slab */
    const mossGeo = new THREE.SphereGeometry(1, 8, 6);
    const moss = lam(0x3f7d55, 0x14301e);
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(mossGeo, moss);
      m.position.set(-8 + i * 4, 12.4 + (i % 2) * 0.6, -10.4);
      m.scale.set(2.6, 1.1, 2.0);
      grp.add(m);
    }

    /* the falling ribbon */
    const wtex = (function () {
      const c = document.createElement('canvas'); c.width = 64; c.height = 256;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(206,240,255,0.5)'; g.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 80; i++) {
        g.fillStyle = ['rgba(255,255,255,0.9)', 'rgba(190,232,255,0.7)', 'rgba(255,255,255,0.3)'][i % 3];
        g.fillRect(Math.random() * 64, Math.random() * 256, 1.4 + Math.random() * 2.6, 16 + Math.random() * 70);
      }
      g.globalCompositeOperation = 'destination-in';
      const gr = g.createLinearGradient(0, 0, 64, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.28, 'rgba(0,0,0,1)');
      gr.addColorStop(0.72, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2);
      return t;
    })();
    const fallMat = new THREE.MeshBasicMaterial({
      map: wtex, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide,
    });
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 12.4), fallMat);
    fall.position.set(0, 6.2, -8.6); grp.add(fall);
    const fall2 = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 12.0), fallMat.clone());
    fall2.material.opacity = 0.35;
    fall2.position.set(0, 6.0, -9.1); grp.add(fall2);
    P.fallTex = wtex;

    /* the pool */
    const pool = new THREE.Mesh(new THREE.CircleGeometry(8.2, 30), lam(0x74c8e8, 0x2b5c78));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.03, -2.4); grp.add(pool);
    const deep = new THREE.Mesh(new THREE.CircleGeometry(4.4, 24), lam(0x4f9ec4, 0x1f4a63));
    deep.rotation.x = -Math.PI / 2; deep.position.set(0, 0.05, -4.2); grp.add(deep);

    const ringGeo = new THREE.RingGeometry(0.94, 1, 30);
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: 0xe6f7ff, transparent: true, opacity: 0, depthWrite: false,
      }));
      r.rotation.x = -Math.PI / 2; r.position.set(0, 0.07, -6.3);
      grp.add(r); rings.push(r);
    }
    P.grottoRings = rings;

    /* rim stones round the pool — one instanced mesh */
    const rim = new THREE.InstancedMesh(rockGeo, rock, 20);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const rr = 8.4 + (i % 3) * 0.4;
      setInst(rim, i, Math.cos(a) * rr, 0.18, -2.4 + Math.sin(a) * rr,
        i * 0.4, i * 0.9, i * 0.25, 0.9 + (i % 4) * 0.25, 0.55, 0.9 + (i % 3) * 0.3);
    }
    rim.instanceMatrix.needsUpdate = true;
    grp.add(rim);

    /* mist */
    const mist = dotCloud(48, 2.4, 'rgba(255,255,255,0.85)', 'rgba(200,230,255,0)', 0.26);
    const ma = mist.userData.arr;
    const mseed = [];
    for (let i = 0; i < 48; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * 4.5;
      mseed.push(a, rr, Math.random() * 6.28, 0.3 + Math.random() * 0.9);
      ma[i * 3] = Math.cos(a) * rr; ma[i * 3 + 1] = 0.5; ma[i * 3 + 2] = -6.3 + Math.sin(a) * rr;
    }
    mist.geometry.attributes.position.needsUpdate = true;
    grp.add(mist);
    P.mist = mist; P.mistSeed = mseed;

    /* four stepping-stones that sing — coloured like the four musicians */
    const COL = [0xffb35c, 0xffd6e0, 0x93d97e, 0x9fc8ff];
    const stoneGeo = new THREE.CylinderGeometry(1.5, 1.7, 0.42, 14);
    const stones = [];
    const local = [[-5.0, 0.6], [-1.7, -1.5], [1.7, -1.5], [5.0, 0.6]];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(stoneGeo, lam(COL[i], 0x33313f));
      m.position.set(local[i][0], 0.2, local[i][1]);
      grp.add(m);
      const gl = glowSprite('rgba(255,255,255,0.95)', 'rgba(255,255,255,0)', 3.6);
      gl.position.set(local[i][0], 1.1, local[i][1]);
      gl.material.opacity = 0;
      grp.add(gl);
      const note = emojiSprite('🎵', 1.5);
      note.position.set(local[i][0], 1.9, local[i][1]);
      note.material.opacity = 0;
      grp.add(note);
      stones.push({ mesh: m, glow: gl, note: note, anim: 0, y0: 0.2 });

      toWorld(grp, local[i][0], local[i][1], _w);
      (function (idx, wx, wz) {
        addSpot('rp.stone' + idx, wx, wz, 2.0, false, function () { stepStone(idx); });
      })(i, _w.x, _w.z);
    }
    P.stones = stones;

    /* two standing stones marking the way in */
    for (let s = -1; s <= 1; s += 2) {
      const m = new THREE.Mesh(rockGeo, rock);
      m.position.set(s * 6.4, 1.9, 8.4);
      m.scale.set(0.9, 2.4, 0.9);
      m.rotation.y = s * 0.4;
      grp.add(m);
      const gl = glowSprite('rgba(190,240,255,0.9)', 'rgba(120,200,255,0)', 2.4);
      gl.position.set(s * 6.4, 4.4, 8.4); grp.add(gl);
    }

    beacon(grp, def, 0, 17.5, -7);
    return grp;
  }

  function stepStone(i) {
    const st = P.stones && P.stones[i];
    if (!st) return;
    st.anim = 1;
    st.glow.material.opacity = 0.95;
    st.note.material.opacity = 1;
    st.note.userData.t = 0;
    playNote(i, 0.24);
    if (!S.stones[i]) {
      S.stones[i] = 1; S.stonesLit++;
      save('places.stones', S.stones);
      emit('stone', i);
      if (S.stonesLit >= 4) {
        const isNew = discover('grotto.song', 'The Waterfall Song', 'La Canción de la Cascada');
        if (isNew) {
          sfxStar(); bump(); rec('place', 5);
          for (let f = 0; f < 4; f++) plantFlower(f);
          say(tr('All four stones! Listen — the waterfall is singing your song.',
                 '¡Las cuatro piedras! Escucha — la cascada está cantando tu canción.'));
          celebrate('🎼 The waterfall sings!', '🎼 ¡La cascada canta!', 3600);
        } else {
          toast(tr('🎼 All four stones again!', '🎼 ¡Otra vez las cuatro piedras!'), 2400);
        }
        for (let f = 0; f < 4; f++) if (P.stones[f]) P.stones[f].anim = 1;
      } else {
        toast('🎼 ' + S.stonesLit + ' / 4', 1800);
      }
    }
  }

  /* ======================================================================
     8. 🫐 BERRY HOLLOW — south-west
     ====================================================================== */

  function buildBerry(def) {
    const grp = faceMeadow(new THREE.Group(), def.x, def.z);

    /* the sunken dell */
    const floor = new THREE.Mesh(new THREE.CircleGeometry(11.5, 30), lam(0x3a6f4c, 0x16301f));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.025; grp.add(floor);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(7.4, 26), lam(0x2f5d40, 0x122a1a));
    inner.rotation.x = -Math.PI / 2; inner.position.y = 0.04; grp.add(inner);

    /* a raised grassy rim so it reads as a hollow */
    const mound = new THREE.SphereGeometry(1, 9, 7);
    const moundM = lam(0x548f66, 0x1d3a26);
    const rim = new THREE.InstancedMesh(mound, moundM, 18);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      setInst(rim, i, Math.cos(a) * 12.0, 0.35, Math.sin(a) * 12.0,
        0, a, 0, 2.3 + (i % 3) * 0.5, 0.85 + (i % 2) * 0.25, 1.7);
    }
    rim.instanceMatrix.needsUpdate = true;
    grp.add(rim);

    /* plum-coloured canopy trees — the silhouette that says "not the meadow" */
    const plumTrunk = lam(0x5d4636, 0x231a12);
    const plum = lam(0x8a4f9e, 0x33193d);
    const plumDeep = lam(0x6d3c80, 0x281230);
    const tg = new THREE.CylinderGeometry(0.34, 0.5, 6.4, 7);
    const cg = new THREE.SphereGeometry(1, 12, 9);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const rr = 13.0;
      const t = new THREE.Mesh(tg, plumTrunk);
      t.position.set(Math.cos(a) * rr, 3.2, Math.sin(a) * rr);
      grp.add(t);
      const c = new THREE.Mesh(cg, i % 2 ? plum : plumDeep);
      c.position.set(Math.cos(a) * rr, 7.2 + (i % 3) * 0.5, Math.sin(a) * rr);
      c.scale.set(3.1 + (i % 3) * 0.4, 2.1, 3.1 + (i % 2) * 0.4);
      grp.add(c);
    }

    /* six berry bushes you can walk into */
    const bushGeo = new THREE.SphereGeometry(1, 12, 9);
    const bushM = lam(0x2f6b46, 0x123021);
    const berryGeo = new THREE.SphereGeometry(0.24, 6, 5);
    const berryM = lam(0x8a5bd8, 0x33205c);
    const PER = 10;
    const berries = new THREE.InstancedMesh(berryGeo, berryM, 6 * PER);
    const bushes = [];
    for (let b = 0; b < 6; b++) {
      const a = (b / 6) * Math.PI * 2 + 0.5;
      const bx = Math.cos(a) * 6.0, bz = Math.sin(a) * 6.0;
      const m = new THREE.Mesh(bushGeo, bushM);
      m.position.set(bx, 1.35, bz);
      m.scale.set(1.9, 1.45, 1.9);
      grp.add(m);
      const list = [];
      for (let k = 0; k < PER; k++) {
        const idx = b * PER + k;
        const aa = (k / PER) * Math.PI * 2 + b;
        const rr = 1.35 + (k % 3) * 0.25;
        setInst(berries, idx,
          bx + Math.cos(aa) * rr, 1.15 + (k % 4) * 0.42, bz + Math.sin(aa) * rr,
          0, 0, 0, 1, 1, 1);
        list.push(idx);
      }
      toWorld(grp, bx, bz, _w);
      const bush = { mesh: m, idx: list, left: PER, hidden: [], regrow: 0, sway: b * 1.1, y0: 1.35 };
      bushes.push(bush);
      (function (bi, wx, wz) {
        addSpot('rp.bush' + bi, wx, wz, 2.7, false, function () { pickBerry(bi); });
      })(b, _w.x, _w.z);
    }
    berries.instanceMatrix.needsUpdate = true;
    grp.add(berries);
    P.berryMesh = berries; P.bushes = bushes;

    /* a little basket in the middle that fills up as you carry berries */
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.0, 1.0, 14), lam(0xb98a52, 0x453120));
    basket.position.set(0, 0.5, 0); grp.add(basket);
    const rimT = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.13, 6, 16), lam(0xd7a768, 0x51391f));
    rimT.rotation.x = Math.PI / 2; rimT.position.set(0, 1.0, 0); grp.add(rimT);
    const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), berryM);
    pile.position.set(0, 1.0, 0); pile.scale.set(0.9, 0.28, 0.9); grp.add(pile);
    P.pile = pile;
    const bem = emojiSprite('🧺', 2.0);
    bem.position.set(0, 2.6, 0); grp.add(bem);

    /* a handful of glimmer-flies over the dell */
    const gl = dotCloud(14, 1.1, 'rgba(255,225,255,1)', 'rgba(190,120,255,0)', 0.8);
    const ga = gl.userData.arr;
    const seed = [];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * 6.28, rr = 2 + Math.random() * 8;
      seed.push(a, rr, 1.6 + Math.random() * 2.4, 0.3 + Math.random() * 0.5);
      ga[i * 3] = Math.cos(a) * rr; ga[i * 3 + 1] = 2; ga[i * 3 + 2] = Math.sin(a) * rr;
    }
    gl.geometry.attributes.position.needsUpdate = true;
    grp.add(gl);
    P.berryFlies = gl; P.berryFlySeed = seed;

    beacon(grp, def, 0, 12.5, 0);
    return grp;
  }

  function pickBerry(b) {
    const bush = P.bushes && P.bushes[b];
    if (!bush) return;
    if (bush.left <= 0) {
      toast(tr('🌱 This bush is growing more…', '🌱 A este arbusto le están creciendo más…'), 2000);
      return;
    }
    const idx = bush.idx[bush.left - 1];
    bush.left--;
    bush.hidden.push(idx);
    bush.regrow = 7;
    bush.pop = 1;
    hideInst(P.berryMesh, idx);
    /* the cap is COSMETIC — past a basketful the pile simply stops looking
       fuller. Picking a berry always works; this game never says no. */
    S.berries = Math.min(BERRY_CAP, S.berries + 1);
    save('places.berries', S.berries);
    sfxTap();
    emit('berry', S.berries);
    updatePile();
    toast('🫐 × ' + S.berries, 1600);
    /* carrying five at once — a state a child can SEE in the basket, and one
       that cannot quietly reset by wandering out of the hollow */
    if (S.berries >= 5) {
      const isNew = discover('berry.basket', 'A Basket of Berries', 'Una Cesta de Bayas');
      if (isNew) {
        sfxStar(); bump(); rec('place', 6);
        say(tr('Five berries! Somebody shy might love a present like that.',
               '¡Cinco bayas! A alguien tímido le encantaría un regalo así.'));
        celebrate('🧺 A whole basket of berries!', '🧺 ¡Una cesta llena de bayas!', 3400);
      }
    }
  }
  function updatePile() {
    if (!P.pile) return;
    const f = Math.min(1, S.berries / BERRY_CAP);
    P.pile.scale.set(0.55 + f * 0.55, 0.12 + f * 0.34, 0.55 + f * 0.55);
    P.pile.visible = S.berries > 0;
  }

  /* ======================================================================
     9. ✨ STAR CLEARING — north-east
     ====================================================================== */

  function buildStar(def) {
    const grp = faceMeadow(new THREE.Group(), def.x, def.z);

    /* the dark bowl */
    const bowl = new THREE.Mesh(new THREE.CircleGeometry(13.5, 34), lam(0x2f3556, 0x14162c));
    bowl.rotation.x = -Math.PI / 2; bowl.position.y = 0.025; grp.add(bowl);
    const bowl2 = new THREE.Mesh(new THREE.CircleGeometry(8.6, 28), lam(0x242946, 0x101226));
    bowl2.rotation.x = -Math.PI / 2; bowl2.position.y = 0.04; grp.add(bowl2);

    /* a crown of near-black cypress — unmistakable on the horizon */
    const cyGeo = new THREE.ConeGeometry(1.2, 11.5, 7);
    const cyM = lam(0x223a35, 0x0c1a18);
    const cyM2 = lam(0x1a2e30, 0x081214);
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 + 0.15;
      const c = new THREE.Mesh(cyGeo, i % 2 ? cyM : cyM2);
      const h = 1 + (i % 4) * 0.16;
      c.position.set(Math.cos(a) * 14.4, 5.75 * h, Math.sin(a) * 14.4);
      c.scale.set(0.9 + (i % 3) * 0.15, h, 0.9 + (i % 3) * 0.15);
      grp.add(c);
    }

    /* a pale spiral of star-tiles leading you into the middle */
    const tileGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.1, 6);
    const tileM = lam(0xcdd6ef, 0x4a5070);
    const tiles = new THREE.InstancedMesh(tileGeo, tileM, 34);
    for (let i = 0; i < 34; i++) {
      const t = i / 33;
      const a = t * Math.PI * 3.1 + 1.2;
      const rr = 12.4 - t * 9.4;
      setInst(tiles, i, Math.cos(a) * rr, 0.06, Math.sin(a) * rr, 0, a, 0, 1, 1, 1);
    }
    tiles.instanceMatrix.needsUpdate = true;
    grp.add(tiles);

    /* the sky-mirror in the middle */
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.3, 28), lam(0xa9bdf0, 0x38406e));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.07; grp.add(disc);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.8, 30), new THREE.MeshBasicMaterial({
      color: 0xdfe7ff, transparent: true, opacity: 0.5, depthWrite: false,
    }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.09; grp.add(ring);
    P.starRing = ring;
    const mid = glowSprite('rgba(220,232,255,0.9)', 'rgba(140,170,255,0)', 7);
    mid.position.set(0, 1.4, 0); mid.material.opacity = 0.35; grp.add(mid);
    P.starMid = mid;

    /* the extra sky that only this clearing has */
    const sky = dotCloud(110, 1.5, 'rgba(255,252,230,1)', 'rgba(255,240,180,0)', 0, true);
    const sa = sky.userData.arr;
    for (let i = 0; i < 110; i++) {
      const a = Math.random() * 6.28, rr = Math.random() * 26;
      sa[i * 3] = Math.cos(a) * rr;
      sa[i * 3 + 1] = 13 + Math.random() * 26;
      sa[i * 3 + 2] = Math.sin(a) * rr;
    }
    sky.geometry.attributes.position.needsUpdate = true;
    grp.add(sky);
    P.starSky = sky;

    /* a little elephant constellation, drawn only when the night is out */
    const CON = [
      [-5.2, 20.0, -3], [-3.0, 22.4, -3], [0.2, 23.2, -3], [3.2, 22.0, -3],
      [4.6, 19.4, -3], [3.0, 17.2, -3], [-0.4, 17.0, -3], [-3.6, 17.4, -3],
      [6.4, 21.2, -3],
    ];
    const LINKS = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 0, 3, 8];
    const cpos = new Float32Array(CON.length * 3);
    for (let i = 0; i < CON.length; i++) {
      cpos[i * 3] = CON[i][0]; cpos[i * 3 + 1] = CON[i][1]; cpos[i * 3 + 2] = CON[i][2];
    }
    const cgeo = new THREE.BufferGeometry();
    cgeo.setAttribute('position', new THREE.BufferAttribute(cpos, 3));
    const cpts = new THREE.Points(cgeo, new THREE.PointsMaterial({
      map: dotTex('rgba(255,255,255,1)', 'rgba(180,210,255,0)'), size: 3.2,
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true, fog: false,
    }));
    cpts.frustumCulled = false;
    const lpos = new Float32Array(LINKS.length * 3);
    for (let i = 0; i < LINKS.length; i++) {
      const c = CON[LINKS[i]];
      lpos[i * 3] = c[0]; lpos[i * 3 + 1] = c[1]; lpos[i * 3 + 2] = c[2];
    }
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
    const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({
      color: 0xbcd4ff, transparent: true, opacity: 0, depthWrite: false, fog: false,
    }));
    lines.frustumCulled = false;
    grp.add(cpts, lines);
    P.conPts = cpts; P.conLines = lines;

    /* the wishing star, parked off-stage until it is earned */
    const wish = glowSprite('rgba(255,255,240,1)', 'rgba(255,220,140,0)', 4, true);
    wish.position.set(-24, 26, -8); wish.material.opacity = 0;
    grp.add(wish);
    P.wish = wish;

    beacon(grp, def, 0, 15.5, 0);

    toWorld(grp, 0, 0, _w);
    addSpot('rp.starmid', _w.x, _w.z, 4.0, false, function () {
      S.dwell = 0; S.atStarMid = true;
      /* one invitation per visit — the 4m spot re-fires whenever a child
         mills about in the middle, and a repeating line is a nag */
      if (S.starToastT > 0) return;
      S.starToastT = 20;
      if (Math.max(nightness(), S.localNight) > 0.3) {
        toast(tr('✨ Look up… stay still a moment.', '✨ Mira hacia arriba… no te muevas ni un poquito.'), 3200);
      } else {
        toast(tr('✨ Stand very still right here and the sky will go dark.',
                 '✨ Quédate muy quieto aquí y el cielo se pondrá oscuro.'), 3600);
      }
    }, function () { S.atStarMid = false; S.dwell = 0; });

    return grp;
  }

  function grantWish() {
    const isNew = discover('star.wish', 'A Wishing Star', 'Una Estrella de los Deseos');
    S.wishT = 0;
    sfxStar();
    for (let f = 0; f < 4; f++) plantFlower(f);
    if (isNew) {
      bump(); rec('place', 7);
      say(tr('A wishing star, just for you. Make a lovely little wish.',
             'Una estrella de los deseos, solo para ti. Pide un deseo bonito.'));
      celebrate('🌠 A wishing star!', '🌠 ¡Una estrella de los deseos!', 3600);
    } else {
      toast(tr('🌠 Another wish…', '🌠 Otro deseo…'), 2600);
    }
  }

  /* ======================================================================
     10. 🌳 NILU'S TREEHOUSE — south-east
     ====================================================================== */

  function buildTreehouse(def) {
    const grp = faceMeadow(new THREE.Group(), def.x, def.z);
    const bark = lam(0x7a5c40, 0x2c2116);
    const barkDark = lam(0x60472f, 0x211810);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.8, 15.5, 14), bark);
    trunk.position.y = 7.75; grp.add(trunk);
    const rootGeo = new THREE.ConeGeometry(0.95, 3.2, 7);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const r = new THREE.Mesh(rootGeo, barkDark);
      r.position.set(Math.cos(a) * 2.5, 0.9, Math.sin(a) * 2.5);
      r.rotation.z = Math.cos(a) * 0.5; r.rotation.x = -Math.sin(a) * 0.5;
      grp.add(r);
    }

    /* a giant pink blossom canopy — the loudest silhouette in the world */
    const blossom = lam(0xeaa0c8, 0x5c3a52);
    const blossom2 = lam(0xf3bcd8, 0x6b455e);
    const sph = new THREE.SphereGeometry(1, 14, 10);
    const puffs = [[0, 16.6, 0, 6.4], [-4.4, 15.2, 1.4, 4.4], [4.2, 15.6, -1.2, 4.6],
                   [0.8, 18.4, 2.6, 3.9], [-1.6, 17.6, -3.4, 4.1]];
    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      const m = new THREE.Mesh(sph, i % 2 ? blossom : blossom2);
      m.position.set(p[0], p[1], p[2]);
      m.scale.set(p[3], p[3] * 0.78, p[3]);
      grp.add(m);
    }
    P.canopyRoot = grp;

    /* The spiral ramp. It is a TAPERING helix — wide at the bottom, tucked in
       at the top — so every (x,z) on it has exactly one height. That keeps
       groundY() below single-valued and exact, which a plain constant-radius
       spiral of more than one turn could never be. */
    const R0 = 6.6, R1 = 4.3, TURNS = 1.0, TOP_Y = 6.4, A0 = -1.1, PLANKS = 34;
    const rampR = (t) => R0 + (R1 - R0) * t;
    const rampA = (t) => A0 + t * Math.PI * 2 * TURNS;
    P.rampParams = { r0: R0, r1: R1, turns: TURNS, top: TOP_Y, a0: A0 };

    const plankGeo = new THREE.BoxGeometry(2.4, 0.22, 1.6);
    const plankM = lam(0xc09a63, 0x453521);
    const ramp = new THREE.InstancedMesh(plankGeo, plankM, PLANKS);
    for (let i = 0; i < PLANKS; i++) {
      const t = i / (PLANKS - 1), a = rampA(t), rr = rampR(t);
      setInst(ramp, i, Math.cos(a) * rr, 0.18 + t * TOP_Y, Math.sin(a) * rr, 0, -a, 0, 1, 1, 1);
    }
    ramp.instanceMatrix.needsUpdate = true;
    grp.add(ramp);
    const railGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.05, 5);
    const rail = new THREE.InstancedMesh(railGeo, barkDark, 22);
    for (let i = 0; i < 22; i++) {
      const t = i / 21, a = rampA(t), rr = rampR(t) + 1.15;
      setInst(rail, i, Math.cos(a) * rr, 0.72 + t * TOP_Y, Math.sin(a) * rr, 0, -a, 0, 1, 1, 1);
    }
    rail.instanceMatrix.needsUpdate = true;
    grp.add(rail);

    /* Six ramp lanterns, evenly spaced round the single lap, that light one by
       one as you circle the tree. Closest pair is 4.9 apart and the trigger
       radius is 2.3, so no two can ever fire from one standing spot, yet
       walking the ramp passes through every centre. Miss one and it simply
       pulses until you come back — there is nothing here to fail. */
    const rampLamps = [];
    for (let i = 0; i < 6; i++) {
      const t = i / 6, a = rampA(t), rr = rampR(t);
      const lx = Math.cos(a) * (rr + 1.6), lz = Math.sin(a) * (rr + 1.6);
      const ly = 0.5 + t * TOP_Y;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 5), barkDark);
      post.position.set(lx, ly + 0.6, lz); grp.add(post);
      const gl = glowSprite('rgba(255,232,175,1)', 'rgba(255,170,60,0)', 2.2);
      gl.position.set(lx, ly + 1.35, lz);
      gl.material.opacity = 0.12;
      grp.add(gl);
      rampLamps.push(gl);
      toWorld(grp, Math.cos(a) * rr, Math.sin(a) * rr, _w);
      (function (idx, wx, wz) {
        addSpot('rp.ramp' + idx, wx, wz, 2.3, false, function () { climbStep(idx); });
      })(i, _w.x, _w.z);
    }
    P.rampLamps = rampLamps;

    /* the platform, the hut and the view */
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.36, 18), plankM);
    plat.position.y = 6.8; grp.add(plat);
    const railing = new THREE.Mesh(new THREE.TorusGeometry(4.45, 0.13, 6, 22), barkDark);
    railing.rotation.x = Math.PI / 2; railing.position.y = 7.7; grp.add(railing);
    const hut = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 2.7, 9), lam(0xd0a274, 0x4c3a26));
    hut.position.set(-0.4, 8.35, -0.4); grp.add(hut);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.0, 9), lam(0xa8543f, 0x3d1f16));
    roof.position.set(-0.4, 10.7, -0.4); grp.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.7, 0.16), lam(0x4a3320, 0x1a1108));
    door.position.set(-0.4, 8.0, 2.0); grp.add(door);
    const win = glowSprite('rgba(255,226,150,1)', 'rgba(255,160,50,0)', 2.6);
    win.position.set(1.5, 8.9, 1.5); win.material.opacity = 0.5; grp.add(win);
    P.hutWin = win;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 5), barkDark);
    pole.position.set(3.5, 8.4, 1.6); grp.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x8b5cf6, emissive: 0x3a2560, side: THREE.DoubleSide }));
    flag.position.set(4.3, 9.4, 1.6); grp.add(flag);
    P.flag = flag;
    const scope = emojiSprite('🔭', 2.2);
    scope.position.set(2.4, 8.1, 2.4); grp.add(scope);

    /* falling blossom */
    const pet = dotCloud(44, 0.85, 'rgba(255,205,230,1)', 'rgba(240,150,200,0)', 0.75);
    const pa = pet.userData.arr;
    const pseed = [];
    for (let i = 0; i < 44; i++) {
      const a = Math.random() * 6.28, rr = Math.random() * 8;
      pseed.push(a, rr, Math.random() * 15, 1.1 + Math.random() * 1.3);
      pa[i * 3] = Math.cos(a) * rr; pa[i * 3 + 1] = Math.random() * 15; pa[i * 3 + 2] = Math.sin(a) * rr;
    }
    pet.geometry.attributes.position.needsUpdate = true;
    grp.add(pet);
    P.petals = pet; P.petalSeed = pseed;

    beacon(grp, def, 0, 22.5, 0);
    return grp;
  }

  function climbStep(i) {
    if (!P.rampLamps) return;
    if (!S.ramp[i]) {
      S.ramp[i] = 1; S.rampLit++;
      save('places.ramp', S.ramp);
      sfxTap();
      emit('climb', S.rampLit);
      if (S.rampLit < 6) toast('🏮 ' + S.rampLit + ' / 6', 1700);
    }
    if (S.rampLit < 6) return;
    /* at the top. First time is a fanfare; later visits stay warm but quiet. */
    if (!S.topDone) {
      S.topDone = true; S.topCool = 25;
      discover('treehouse.top', 'The Lantern Climb', 'La Subida de los Faroles');
      S.lanternTarget = 1;
      sfxStar(); bump(); rec('place', 8);
      for (let f = 0; f < 4; f++) plantFlower(f);
      say(tr('Every lantern on the ramp is lit! Look — the whole tree is glowing, and so is every path in the world.',
             '¡Todos los faroles de la rampa están encendidos! Mira — el árbol entero brilla, y también todos los caminos del mundo.'));
      celebrate('🏮 The whole ramp is glowing!', '🏮 ¡La rampa entera está brillando!', 4000);
    } else if (S.topCool <= 0) {
      S.topCool = 25;
      S.lanternTarget = 1;
      sfxStar();
      toast(tr('🏮 Every lantern lit again — look at it glow!',
               '🏮 ¡Otra vez todos los faroles encendidos — mira cómo brilla!'), 3000);
    }
  }

  /* ======================================================================
     11. shared bits: beacons, spot plumbing, discoveries
     ====================================================================== */

  function beacon(grp, def, lx, ly, lz) {
    const b = emojiSprite(def.emoji, 5.2, true);
    b.position.set(lx, ly, lz);
    grp.add(b);
    const halo = glowSprite('rgba(255,246,214,0.75)', 'rgba(255,210,130,0)', 9, true);
    halo.position.set(lx, ly, lz);
    grp.add(halo);
    P[def.id + 'Beacon'] = b;
    P[def.id + 'Halo'] = halo;
    b.userData.y0 = ly;
  }

  /* every spot goes through here so we survive RWalk not existing yet */
  function addSpot(id, x, z, r, once, onEnter, onExit) {
    const spec = { id: id, x: x, z: z, r: r, once: !!once, onEnter: onEnter, onExit: onExit };
    const w = walk();
    if (w && typeof w.addSpot === 'function') {
      try { w.addSpot(spec); return; } catch (e) {}
    }
    S.pending.push(spec);
  }
  function flushSpots() {
    if (!S.pending.length) return;
    const w = walk();
    if (!w || typeof w.addSpot !== 'function') return;
    const q = S.pending;
    S.pending = [];
    for (let i = 0; i < q.length; i++) { try { w.addSpot(q[i]); } catch (e) { } }
  }

  /* card art + copy for a discovery id, so walk.js's own "new wonder" card
     shows OUR emoji and OUR friendly line instead of a generic one */
  let CARD = null;
  function cardFor(id) {
    if (!CARD) {
      CARD = {};
      for (let i = 0; i < PLACES.length; i++) CARD['place.' + PLACES[i].id] = PLACES[i];
      for (let i = 0; i < MOMENTS.length; i++) CARD[MOMENTS[i].id] = MOMENTS[i];
    }
    return CARD[id] || null;
  }
  /* does layer 2 pop a discovery card of its own? if so we must not double-toast */
  function hasWalkCards() {
    const w = walk();
    return !!(w && typeof w.found === 'function');
  }
  /* the spoken line is warmth and always plays; the toast only fills in when
     nobody else is showing the child a card */
  function celebrate(en, es, ms) {
    if (!hasWalkCards()) toast(tr(en, es), ms || 3400);
  }

  function discover(id, en, es) {
    const w = walk();
    let isNew;
    if (w && typeof w.found === 'function') {
      const c = cardFor(id);
      try {
        isNew = !!w.found(id, tr(en, es), c ? { emoji: c.emoji, text: L(c.card) } : undefined);
      } catch (e) { isNew = !S.found[id]; }
    } else {
      isNew = !S.found[id];
    }
    if (!S.found[id]) { S.found[id] = 1; save('places.found', S.found); }
    if (isNew) emit('found', id);
    return isNew;
  }

  /* Layer 2 counts its own wonders and shouts "you found EVERYTHING!" when the
     tally is complete — so our ten have to be added to its total, or that
     celebration fires while four whole places are still out there unfound. */
  function claimTotal() {
    if (S.totalDone) return;
    const w = walk();
    if (!w || typeof w.setTotal !== 'function' || typeof w.total !== 'function') return;
    S.totalDone = true;
    try { w.setTotal(w.total() + PLACES.length + MOMENTS.length); } catch (e) {}
  }

  function emit(kind, data) {
    for (let i = 0; i < S.subs.length; i++) {
      try { S.subs[i](kind, data); } catch (e) {}
    }
    try {
      window.dispatchEvent(new CustomEvent('rplaces', { detail: { kind: kind, data: data } }));
    } catch (e) {}
  }

  const playNote = (i, v) => {
    try { if (S.host && S.host.playNote) S.host.playNote(i, v); } catch (e) {}
  };
  const plantFlower = (i) => {
    try { if (S.host && S.host.plantFlower) S.host.plantFlower(i); } catch (e) {}
  };

  function arrive(def) {
    const isNew = discover('place.' + def.id, def.name.en, def.name.es);
    S.inPlace = def.id;
    if (isNew) {
      sfxStar(); bump(); rec('place', PLACES.indexOf(def) + 1);
      for (let f = 0; f < 3; f++) plantFlower(f);
      say(L(def.hello));
      if (!hasWalkCards()) toast(def.emoji + ' ' + L(def.name) + '!', 4000);
    } else {
      toast(L(def.again), 2800);
    }
  }

  /* the Lantern Loop is polled in tick(), never scheduled on a timer, so it
     can never be lost by closing the tab mid-celebration */
  function loopCheck(dt) {
    if (S.found['lanternloop']) return;
    for (let i = 0; i < PLACES.length; i++) {
      if (!S.found['place.' + PLACES[i].id]) { S.loopDelay = 3.2; return; }
    }
    S.loopDelay -= dt;
    if (S.loopDelay > 0) return;
    if (discover('lanternloop', 'The Lantern Loop', 'La Vuelta de los Faroles')) {
      sfxStar(); bump(); rec('place', 9);
      S.lanternTarget = 1;
      say(tr('You found every single place out past the trees. You are a real explorer!',
             'Encontraste todos los lugares que hay más allá de los árboles. ¡Qué gran aventura!'));
      celebrate('🗺️ All four places found!', '🗺️ ¡Los cuatro lugares encontrados!', 4200);
    }
  }

  /* ======================================================================
     12. build
     ====================================================================== */

  function build(host) {
    if (S.built) return;
    host = host || {};
    THREE = S.THREE = host.THREE || window.THREE;
    S.scene = host.scene;
    S.RWalk = host.RWalk || window.RWalk || null;
    S.host = host;
    if (host.K) K = host.K;
    if (!THREE || !S.scene) return;

    _m = new THREE.Matrix4(); _v = new THREE.Vector3();
    _q = new THREE.Quaternion(); _e = new THREE.Euler(); _s = new THREE.Vector3();

    /* remember what a child already did */
    const f = load('places.found', null);
    if (f && typeof f === 'object') S.found = f;
    S.berries = Math.max(0, Math.min(BERRY_CAP, load('places.berries', 0) | 0));
    const st = load('places.stones', null);
    if (st && st.length === 4) { S.stones = st; S.stonesLit = st[0] + st[1] + st[2] + st[3]; }
    const rp = load('places.ramp', null);
    if (rp && rp.length === 6) {
      S.ramp = rp; S.rampLit = 0;
      for (let i = 0; i < 6; i++) if (rp[i]) S.rampLit++;
    }
    S.topDone = !!S.found['treehouse.top'];
    if (S.found['treehouse.top'] || S.found['lanternloop']) S.lanternTarget = 1;

    /* how far out the child may walk: far enough to stand inside every place
       we are about to build (see §4b). Derived, never assumed. */
    let far = MEADOW_BOUND;
    for (let i = 0; i < PLACES.length; i++) {
      far = Math.max(far, Math.hypot(PLACES[i].x, PLACES[i].z) + PLACES[i].radius);
    }
    S.roamR = far;
    /* Preferred route: just tell walk.js the world is bigger now, and let its
       own easing do the work at the new edge. roam() below is the fallback for
       a walk.js without setBound() — keep both, they are mutually exclusive. */
    try {
      const w0 = walk();
      S.boundOwned = !!(w0 && w0.setBound && w0.setBound(far));
    } catch (e) { S.boundOwned = false; }

    const root = new THREE.Group();
    root.name = 'RPlaces';
    S.root = root;
    S.scene.add(root);

    buildPaths(root);
    buildSignpost(root);

    const builders = { grotto: buildGrotto, berry: buildBerry, star: buildStar, treehouse: buildTreehouse };
    for (let i = 0; i < PLACES.length; i++) {
      const def = PLACES[i];
      const grp = builders[def.id](def);
      root.add(grp);
      def._grp = grp;
      (function (d) {
        addSpot('rp.place.' + d.id, d.x, d.z, d.radius, false,
          function () { arrive(d); },
          function () { if (S.inPlace === d.id) S.inPlace = ''; });
      })(def);
    }

    /* restore the lantern state of anything already lit */
    for (let i = 0; i < 4; i++) if (S.stones[i] && P.stones[i]) P.stones[i].glow.material.opacity = 0.22;
    for (let i = 0; i < 6; i++) if (S.ramp[i] && P.rampLamps[i]) P.rampLamps[i].material.opacity = 0.9;
    updatePile();

    S.built = true;
    emit('built', null);
  }

  /* ======================================================================
     13. tick — no allocations in here
     ====================================================================== */

  function tick(dt) {
    if (!S.built) return;
    /* before anything else, and even while paused: layer 2 gathers the child
       inward every single frame, so our edge has to answer every single frame */
    roam(dt);
    if (!(dt > 0)) dt = 0;
    if (dt > 0.1) dt = 0.1;
    try { if (K.paused) return; } catch (e) {}

    if (S.pending.length || !S.totalDone) {
      S.retry -= dt;
      if (S.retry <= 0) { S.retry = 0.5; flushSpots(); claimTotal(); }
    }

    const rm = reduceMotion();
    const amb = (rm ? 0.22 : 1) * (calm() ? 0.7 : 1) * speed();
    S.amb = amb;
    S.t += dt * amb;
    const t = S.t;

    /* live player position (falls back to the band) */
    const w = walk();
    const pp = w && w.pos;
    if (pp && typeof pp.x === 'number') { S.px = pp.x; S.pz = pp.z; }

    const night = nightness();
    loopCheck(dt);

    /* --- lantern breathing along every path --- */
    S.lanternBoost += (S.lanternTarget - S.lanternBoost) * Math.min(1, dt * 0.6);
    if (P.lampGlow) {
      const base = 0.62 + night * 0.3 + S.lanternBoost * 0.3;
      P.lampGlow.material.opacity = base + (rm ? 0 : Math.sin(t * 1.1) * 0.05);
      P.lampGlow.material.size = 2.5 + S.lanternBoost * 1.1 + (rm ? 0 : Math.sin(t * 0.9) * 0.12);
    }

    /* --- beacons bob and grow a little as you get close --- */
    for (let i = 0; i < PLACES.length; i++) {
      const def = PLACES[i];
      const b = P[def.id + 'Beacon'], h = P[def.id + 'Halo'];
      if (!b) continue;
      const dx = S.px - def.x, dz = S.pz - def.z;
      const d2 = dx * dx + dz * dz;
      const near = d2 < 3600 ? 1 - Math.sqrt(d2) / 60 : 0;
      const sc = 5.2 + near * 1.6;
      b.scale.set(sc, sc, 1);
      b.position.y = b.userData.y0 + (rm ? 0 : Math.sin(t * 0.9 + i) * 0.5);
      if (h) {
        h.material.opacity = 0.32 + near * 0.3 + night * 0.2;
        h.position.y = b.position.y;
      }
    }

    /* --- 💧 grotto --- */
    if (P.fallTex) {
      P.fallTex.offset.y -= dt * (rm ? 0.14 : 0.55) * speed();
      if (P.fallTex.offset.y < -10) P.fallTex.offset.y += 10;
    }
    const gd = PLACES[0];
    const gnear = (S.px - gd.x) * (S.px - gd.x) + (S.pz - gd.z) * (S.pz - gd.z) < 2500;
    if (P.grottoRings) {
      for (let i = 0; i < P.grottoRings.length; i++) {
        const r = P.grottoRings[i];
        const ph = (t * 0.55 + i / P.grottoRings.length) % 1;
        r.scale.setScalar(0.4 + ph * 4.2);
        r.material.opacity = (1 - ph) * 0.42;
      }
    }
    if (P.mist && gnear) {
      const a = P.mist.userData.arr, sd = P.mistSeed;
      for (let i = 0; i < 48; i++) {
        const k = i * 4;
        let ph = (sd[k + 2] + t * sd[k + 3] * 0.55) % 6.28;
        sd[k + 2] = ph;
        const rr = sd[k + 1] + (ph % 1.6);
        const ang = sd[k] + ph * 0.35;
        a[i * 3] = Math.cos(ang) * rr;
        a[i * 3 + 1] = 0.4 + (ph / 6.28) * 5.4;
        a[i * 3 + 2] = -6.3 + Math.sin(ang) * rr;
      }
      P.mist.geometry.attributes.position.needsUpdate = true;
      P.mist.material.opacity = 0.24;
    } else if (P.mist) {
      P.mist.material.opacity = 0.16;
    }
    if (P.stones) {
      for (let i = 0; i < 4; i++) {
        const st = P.stones[i];
        if (st.anim > 0) {
          st.anim = Math.max(0, st.anim - dt * 1.6);
          st.mesh.position.y = st.y0 + st.anim * 0.28;
          st.glow.material.opacity = st.anim * 0.95;
          st.note.userData.t = (st.note.userData.t || 0) + dt;
          st.note.position.y = 1.9 + st.note.userData.t * 2.2;
          st.note.material.opacity = Math.max(0, 1 - st.note.userData.t * 0.8);
        } else if (S.stones[i]) {
          st.glow.material.opacity = 0.18 + (rm ? 0 : Math.sin(t * 1.6 + i) * 0.06);
        }
      }
    }

    /* --- 🫐 berry hollow --- */
    if (P.bushes) {
      for (let i = 0; i < P.bushes.length; i++) {
        const b = P.bushes[i];
        if (b.pop > 0) {
          b.pop = Math.max(0, b.pop - dt * 2.4);
          b.mesh.scale.set(1.9 + b.pop * 0.16, 1.45 - b.pop * 0.14, 1.9 + b.pop * 0.16);
        } else if (!rm) {
          const s = Math.sin(t * 0.9 + b.sway) * 0.03;
          b.mesh.scale.set(1.9 + s, 1.45 - s, 1.9 + s);
        }
        if (b.left < b.idx.length) {
          b.regrow -= dt;
          if (b.regrow <= 0) {
            const idx = b.hidden.pop();
            if (idx !== undefined) {
              const bx = b.mesh.position.x, bz = b.mesh.position.z;
              const k = idx % 10;
              const aa = (k / 10) * Math.PI * 2 + i;
              const rr = 1.35 + (k % 3) * 0.25;
              setInst(P.berryMesh, idx,
                bx + Math.cos(aa) * rr, 1.15 + (k % 4) * 0.42, bz + Math.sin(aa) * rr,
                0, 0, 0, 1, 1, 1);
              P.berryMesh.instanceMatrix.needsUpdate = true;
              b.left++;
            }
            b.regrow = 7;
          }
        }
      }
    }
    if (P.berryFlies && !rm) {
      const a = P.berryFlies.userData.arr, sd = P.berryFlySeed;
      for (let i = 0; i < 14; i++) {
        const k = i * 4;
        const ang = sd[k] + t * sd[k + 3] * 0.5;
        a[i * 3] = Math.cos(ang) * sd[k + 1];
        a[i * 3 + 1] = sd[k + 2] + Math.sin(t * 1.3 + i) * 0.5;
        a[i * 3 + 2] = Math.sin(ang * 1.2) * sd[k + 1];
      }
      P.berryFlies.geometry.attributes.position.needsUpdate = true;
    }

    /* --- ✨ star clearing ---
       The clearing brews its OWN night: stand still in the middle and the bowl
       darkens by itself. It used to need the 🫧 Breathe button, which is the
       one thing that hands the camera to the band — so the payoff played
       fifty-odd metres behind the child's back. Now standing here is enough,
       the follow camera stays put, and the wish crosses the sky overhead. */
    if (S.starToastT > 0) S.starToastT -= dt;
    const wantLocal = (S.atStarMid && !songPlaying()) ? 1 : 0;
    S.localNight += (wantLocal - S.localNight) * Math.min(1, dt * (wantLocal ? 0.5 : 1.1));
    const sky = Math.max(night, S.localNight);
    const sd0 = PLACES[2];
    const sdx = S.px - sd0.x, sdz = S.pz - sd0.z;
    const sNear = Math.max(0, 1 - Math.sqrt(sdx * sdx + sdz * sdz) / 34);
    if (P.starSky) P.starSky.material.opacity = Math.min(1, (0.18 + sky * 0.9) * sNear * 1.2);
    if (P.starMid) P.starMid.material.opacity = 0.2 + sky * 0.35 + sNear * 0.15;
    if (P.starRing) P.starRing.material.opacity = 0.3 + Math.sin(t * 0.8) * (rm ? 0 : 0.12) + sky * 0.25;
    const conO = Math.max(0, (sky - 0.3) / 0.7) * sNear;
    if (P.conPts) P.conPts.material.opacity = conO;
    if (P.conLines) P.conLines.material.opacity = conO * 0.55;
    if (S.atStarMid && sky > 0.3 && !songPlaying()) {
      S.dwell += dt;
      if (S.dwell > 4.5) { S.dwell = -18; grantWish(); }
    }
    if (S.wishT >= 0 && P.wish) {
      S.wishT += dt;
      const ph = S.wishT / 2.6;
      if (ph >= 1) { S.wishT = -1; P.wish.material.opacity = 0; }
      else {
        P.wish.position.set(-24 + ph * 48, 27 - ph * 9, -8 + ph * 12);
        P.wish.material.opacity = Math.sin(ph * Math.PI);
      }
    }

    /* --- 🌳 treehouse --- */
    if (S.topCool > 0) S.topCool -= dt;
    if (P.rampLamps) {
      let nextUnlit = -1;
      for (let i = 0; i < 6; i++) {
        if (S.ramp[i]) P.rampLamps[i].material.opacity = 0.75 + (rm ? 0 : Math.sin(t * 1.4 + i) * 0.15);
        else if (nextUnlit < 0) nextUnlit = i;
      }
      if (nextUnlit >= 0) {
        P.rampLamps[nextUnlit].material.opacity = 0.14 + (rm ? 0.06 : Math.abs(Math.sin(t * 1.2)) * 0.2);
        for (let i = nextUnlit + 1; i < 6; i++) if (!S.ramp[i]) P.rampLamps[i].material.opacity = 0.1;
      }
    }
    if (P.hutWin) P.hutWin.material.opacity = 0.42 + night * 0.35 + (rm ? 0 : Math.sin(t * 0.7) * 0.06);
    if (P.flag && !rm) P.flag.rotation.y = Math.sin(t * 1.6) * 0.35;
    const td = PLACES[3];
    const tnear = (S.px - td.x) * (S.px - td.x) + (S.pz - td.z) * (S.pz - td.z) < 2500;
    if (P.petals && tnear && !rm) {
      const a = P.petals.userData.arr, sd = P.petalSeed;
      for (let i = 0; i < 44; i++) {
        const k = i * 4;
        let y = a[i * 3 + 1] - dt * sd[k + 3] * amb;
        if (y < 0.2) { y = 14 + Math.random() * 3; }
        const ang = sd[k] + y * 0.16;
        a[i * 3] = Math.cos(ang) * sd[k + 1];
        a[i * 3 + 1] = y;
        a[i * 3 + 2] = Math.sin(ang) * sd[k + 1];
      }
      P.petals.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* ======================================================================
     14. public API
     ====================================================================== */

  function list() {
    const out = [];
    for (let i = 0; i < PLACES.length; i++) {
      const p = PLACES[i];
      out.push({ id: p.id, name: { en: p.name.en, es: p.name.es }, emoji: p.emoji, x: p.x, z: p.z });
    }
    return out;
  }

  /* everything this layer contributes to the journal, with real ids */
  function discoveries() {
    const out = [];
    for (let i = 0; i < PLACES.length; i++) {
      const p = PLACES[i];
      out.push({
        id: 'place.' + p.id, emoji: p.emoji, x: p.x, z: p.z,
        name: { en: p.name.en, es: p.name.es },
        hint: { en: p.hint.en, es: p.hint.es },
        card: { en: p.card.en, es: p.card.es },
        found: !!S.found['place.' + p.id], group: 'places',
      });
    }
    const at = {
      signpost: SIGN,
      'grotto.song': PLACES[0], 'berry.basket': PLACES[1],
      'star.wish': PLACES[2], 'treehouse.top': PLACES[3],
      lanternloop: SIGN,
    };
    for (let i = 0; i < MOMENTS.length; i++) {
      const m = MOMENTS[i];
      const a = at[m.id] || SIGN;
      out.push({
        id: m.id, emoji: m.emoji, x: a.x, z: a.z,
        name: { en: m.name.en, es: m.name.es },
        hint: { en: m.hint.en, es: m.hint.es },
        card: { en: m.card.en, es: m.card.es },
        /* x/z here says "this belongs to that place", NOT "stand here and it is
           yours". An earned moment is only ever awarded by doing the thing, so
           a reader must never treat these coordinates as a proximity trigger. */
        earned: !!m.earned,
        found: !!S.found[m.id], group: 'places',
      });
    }
    return out;
  }

  /* where should a quest marker go for this id? */
  function at(id) {
    if (!id) return null;
    for (let i = 0; i < PLACES.length; i++) {
      const p = PLACES[i];
      if (id === p.id || id === 'place.' + p.id) return { x: p.x, z: p.z };
    }
    if (id === 'signpost' || id === 'lanternloop') return { x: SIGN.x, z: SIGN.z };
    if (id === 'grotto.song') return { x: PLACES[0].x, z: PLACES[0].z };
    if (id === 'berry.basket') return { x: PLACES[1].x, z: PLACES[1].z };
    if (id === 'star.wish') return { x: PLACES[2].x, z: PLACES[2].z };
    if (id === 'treehouse.top') return { x: PLACES[3].x, z: PLACES[3].z };
    return null;
  }

  /* The treehouse ramp as a height field, so a later integration step can make
     the climb literal if the walker ever grows a y-axis. Exact, because the
     ramp is a tapering helix: radius alone identifies which lap you are on.
     Returns 0 everywhere else in the world — this never lifts a child by
     surprise, and never drops one either. */
  function groundY(x, z) {
    const rp = P.rampParams, def = PLACES[3];
    if (!rp || !def || !def._grp) return 0;
    const a = def._grp.rotation.y, ca = Math.cos(a), sa = Math.sin(a);
    const dx = x - def.x, dz = z - def.z;
    const lx = dx * ca - dz * sa, lz = dx * sa + dz * ca;
    const rr = Math.hypot(lx, lz);
    if (rr > rp.r0 + 1.3 || rr < rp.r1 - 1.3) return 0;
    let base = Math.atan2(lz, lx) - rp.a0;
    while (base < 0) base += Math.PI * 2;
    while (base >= Math.PI * 2) base -= Math.PI * 2;
    const span = Math.PI * 2 * rp.turns;
    for (let lap = 0; lap <= Math.ceil(rp.turns); lap++) {
      const t = (base + lap * Math.PI * 2) / span;
      if (t < 0 || t > 1) continue;
      const want = rp.r0 + (rp.r1 - rp.r0) * t;
      if (Math.abs(rr - want) <= 1.3) return 0.18 + t * rp.top;
    }
    return 0;
  }

  window.RPlaces = {
    build: build,
    tick: tick,
    list: list,
    discoveries: discoveries,
    at: at,
    groundY: groundY,
    /* live state a quest chain can read */
    reached: (id) => !!S.found[id],
    berries: () => S.berries,
    takeBerries: function (n) {
      const took = Math.min(S.berries, Math.max(0, n | 0));
      S.berries -= took;
      save('places.berries', S.berries);
      updatePile();
      if (took) emit('berry', S.berries);
      return took;
    },
    stonesPlayed: () => S.stonesLit,
    rampLit: () => S.rampLit,
    here: () => S.inPlace,
    root: () => S.root,
    on: function (fn) { if (typeof fn === 'function') S.subs.push(fn); },
    places: PLACES,
  };
})();
