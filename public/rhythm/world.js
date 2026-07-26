/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Nilu's Music Meadow — THE EXPLORABLE MEADOW (window.RWorld).

   The meadow used to be a stage you tapped. This file turns it into a PLACE:
   a wildflower hill, a winding stream with a little bridge, a hollow log you
   walk right through, a ring of glowing mushrooms, singing lily pads, humming
   stones, a swing tree, a lantern stage, a berry bush — and twelve things to
   discover plus eight sparkle notes hidden all over, forever replayable.

   Nothing here is missable, timed, locked or lose-able. Walking near a place is
   the whole "puzzle". Bilingual EN/ES from birth.

   Loaded as a plain browser script after lib/three.min.js, ../gamekit/kit.js and
   walk.js. It owns ONLY scenery + discoveries: movement, camera and the finder
   chrome belong to walk.js (window.RWalk).

     RWorld.build(host)   host = { THREE, scene, K, RWalk, playNote(i,vol), plantFlower(i) }
     RWorld.tick(dt)      animate the props
     RWorld.reset()       forget every discovery (a grown-up "play it fresh" hook)
     RWorld.groundY(x,z)  height of the meadow floor (only the hill is not flat)

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  var RW = {};
  try { window.RWorld = RW; } catch (e) {}

  /* ==========================================================================
     THE DISCOVERY TABLE — grown-ups, the whole story of the meadow lives here.
     One row = one thing a child can find, in the order it is registered.
       en / es : [ title , the little line on the "you found it!" card ]
       say     : optional warm line spoken out loud the first time (friends)
     Twelve rows = the "🔎 n / 12" chip in the corner. Add a row and the chip
     counts higher all by itself.
     ========================================================================== */
  var DISCOVERIES = [
    { id: 'hill', emoji: '🌼', x: -18, z: 0, r: 7.0,
      en: ['Wildflower Hill', 'A whole hill of soft flowers. From up here you can see the whole meadow!'],
      es: ['La colina de flores', 'Una colina llena de flores suavecitas. ¡Desde aquí se ve todo el prado!'] },

    { id: 'bridge', emoji: '🌉', x: 0, z: 0, r: 3.2,   // x/z filled in from the stream path
      en: ['The Little Bridge', 'Clop, clop! A wooden bridge over the singing stream.'],
      es: ['El puentecito', '¡Clop, clop! Un puente de madera sobre el arroyo que canta.'] },

    { id: 'log', emoji: '🪵', x: -8.5, z: 13, r: 2.8,
      en: ['The Hollow Log', 'You can walk right through! Listen — your music echoes inside.'],
      es: ['El tronco hueco', '¡Puedes pasar por dentro! Escucha — tu música hace eco adentro.'] },

    { id: 'mushrooms', emoji: '🍄', x: 10, z: -13, r: 3.6,
      en: ['The Glowing Mushroom Ring', 'Step inside and the little mushrooms light up, one by one.'],
      es: ['El círculo de hongos', 'Entra y los honguitos se encienden, uno por uno.'] },

    { id: 'lilypads', emoji: '🪷', x: 0, z: 5.2, r: 2.6,
      en: ['The Singing Lily Pads', 'Step from pad to pad — each one sings a different note!'],
      es: ['Los nenúfares que cantan', 'Pasa de hoja en hoja — ¡cada una canta una nota distinta!'] },

    { id: 'stones', emoji: '🪨', x: -14, z: 14, r: 4.0,
      en: ['The Humming Stones', 'Old, friendly stones. Stand in the middle and they hum along with you.'],
      es: ['Las piedras que zumban', 'Piedras viejitas y amables. Párate en medio y zumban contigo.'] },

    { id: 'swing', emoji: '🌳', x: 21, z: 9, r: 3.2,
      en: ['The Swing Tree', 'A swing under a big tree, swaying all by itself in the evening air.'],
      es: ['El árbol del columpio', 'Un columpio bajo un árbol grande, meciéndose solito en la brisa.'] },

    /* off to the side, not dead south: due south is the camera's default
       sightline back to the band, and a 3m deck there filled half the screen */
    { id: 'stage', emoji: '🏮', x: 11.5, z: 11, r: 3.8,
      en: ['The Lantern Stage', 'Stand in the lantern light and the band plays a little tune just for you!'],
      es: ['El escenario de farolitos', '¡Párate en la luz de los farolitos y la banda toca solo para ti!'] },

    { id: 'duck', emoji: '🦆', x: -2.6, z: 1.8, r: 2.2,
      en: ['Dilly the duck', 'Dilly was asleep on the pond. Now she is wide awake and very happy to see you.'],
      es: ['Dilly la patita', 'Dilly dormía en el estanque. Ahora está bien despierta y feliz de verte.'],
      say: ['Quack! I know a splashy song!', '¡Cuac! ¡Yo me sé una canción chapoteante!'] },

    { id: 'hedgehog', emoji: '🦔', x: -12, z: 9.6, r: 2.4,
      en: ['Kiko the hedgehog', 'Kiko naps under the berry bush. He says your music makes very good dreams.'],
      es: ['Kiko el erizo', 'Kiko duerme bajo el arbusto de moras. Dice que tu música da sueños muy bonitos.'],
      say: ['Oh, hello! I was napping under the berries.', '¡Ay, hola! Estaba durmiendo bajo las moras.'] },

    { id: 'snail', emoji: '🐌', x: -6.2, z: 14.6, r: 2.2,
      en: ['Lulu the snail', 'Lulu lives on the hollow log and takes her time. Slow is beautiful too.'],
      es: ['Lulu la caracola', 'Lulu vive en el tronco hueco y se toma su tiempo. Lento también es bonito.'],
      say: ['Slooowly, slooowly… I love slow songs.', 'Despaaacito, despaaacito… me encantan las canciones lentas.'] },

    { id: 'fox', emoji: '🦊', x: -18.4, z: -0.6, r: 2.6,
      en: ['Zuzu the fox cub', 'Zuzu was curled up in the flowers at the top of the hill. She waited for you!'],
      es: ['Zuzu la zorrita', 'Zuzu estaba enroscada entre las flores de la colina. ¡Te estaba esperando!'],
      say: ['You came all the way up here! Look at all the flowers!', '¡Subiste hasta aquí! ¡Mira cuántas flores!'] },
  ];

  /* Eight sparkle notes hide in eight of these spots. When all eight are found
     the meadow celebrates and hides a FRESH eight somewhere else — forever. */
  var SPARKLE_POOL = [
    [-18.5, -4.6], [-14.6, 3.6], [-21.2, 1.4],     // the wildflower hill
    [16.4, 4.6], [16.8, -6.2], [14.2, 10.4],       // the stream + under the bridge
    [-8.5, 13.0], [-5.4, 15.8],                    // inside / beside the hollow log
    [10.0, -13.0], [12.8, -9.2],                   // the mushroom ring
    [-14.0, 14.0], [-10.6, 17.2],                  // the stone circle
    [20.6, 9.4], [17.6, 3.6],                      // the swing tree
    [0.0, 17.0], [-3.6, 11.2],                     // the lantern stage
    [6.4, 8.2], [-6.6, 6.4],                       // the open meadow
  ];
  var SPARKLES_PER_ROUND = 8;

  /* ---------- host handles ---------- */
  var THREE = null, scene = null, K = null, RWalk = null;
  var playNote = function () {}, plantFlower = function () {};
  var built = false, T = 0;

  /* ---------- kit wrappers: a missing kit must never break the meadow ---------- */
  function tr(en, es) { try { return K && K.tr ? K.tr(en, es) : en; } catch (e) { return en; } }
  function toast(m, ms) { try { K && K.toast && K.toast(m, ms); } catch (e) {} }
  function say(m) { try { K && K.say && K.say(m); } catch (e) {} }
  function sfx(n) { try { K && K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} }
  function calm() { try { return !!(K && K.calm && K.calm()); } catch (e) { return false; } }
  function reduced() {
    try { return typeof K.reduceMotion === 'function' ? !!K.reduceMotion() : !!K.reduceMotion; }
    catch (e) { return false; }
  }
  function paused() { try { return !!(K && (K.paused || K.replaying)); } catch (e) { return false; } }
  function save(k, v) { try { K && K.save && K.save(k, v); } catch (e) {} }
  function load(k, d) { try { return K && K.load ? K.load(k, d) : d; } catch (e) { return d; } }
  function note(i, vol) { try { playNote(i, (vol || 0.18) * (calm() ? 0.6 : 1)); } catch (e) {} }
  function bloom(i) { try { plantFlower(i & 3); } catch (e) {} }
  function record(kind, extra) { try { K && K.recordEvent && K.recordEvent(kind, extra || 0); } catch (e) {} }

  /* ---------- tiny deterministic RNG (same meadow every time you come back) ---------- */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* ---------- geometry + material caches (a cheap tablet has to run this) ---------- */
  var GEO = {}, MAT = {};
  function gg(key, make) { if (!GEO[key]) GEO[key] = make(); return GEO[key]; }
  function sph(r, w, h) { return gg('s' + r + '_' + w + '_' + h, function () { return new THREE.SphereGeometry(r, w, h); }); }
  function dome(r, w, h) { return gg('d' + r + '_' + w + '_' + h, function () { return new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, 0, Math.PI / 2); }); }
  function cyl(rt, rb, h, s, open) { return gg('c' + rt + '_' + rb + '_' + h + '_' + s + '_' + (open ? 1 : 0), function () { return new THREE.CylinderGeometry(rt, rb, h, s, 1, !!open); }); }
  function box(w, h, d) { return gg('b' + w + '_' + h + '_' + d, function () { return new THREE.BoxGeometry(w, h, d); }); }
  function cone(r, h, s) { return gg('n' + r + '_' + h + '_' + s, function () { return new THREE.ConeGeometry(r, h, s); }); }
  function circ(r, s) { return gg('r' + r + '_' + s, function () { return new THREE.CircleGeometry(r, s); }); }
  function torus(r, t, a, b) { return gg('t' + r + '_' + t, function () { return new THREE.TorusGeometry(r, t, a, b); }); }

  /* twilight scene: EVERY Lambert needs an emissive lift (the house lam() helper) */
  function lam(color, emissive) {
    var e = emissive === undefined ? 0x1a1a2a : emissive;
    var k = 'm' + color + '_' + e;
    if (!MAT[k]) MAT[k] = new THREE.MeshLambertMaterial({ color: color, emissive: e });
    return MAT[k];
  }
  function lam2(color, emissive, side) {   // a fresh (animatable / two-sided) material
    return new THREE.MeshLambertMaterial({ color: color, emissive: emissive, side: side || THREE.FrontSide });
  }
  function mesh(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  var TEX = {};
  function glowTex(inner, outer) {
    var k = 'g' + inner + outer;
    if (!TEX[k]) {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var g = c.getContext('2d');
      var gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, inner); gr.addColorStop(1, outer);
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      TEX[k] = new THREE.CanvasTexture(c);
    }
    return TEX[k];
  }
  function glow(inner, outer, scale) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex(inner, outer), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.scale.set(scale, scale, 1);
    return s;
  }
  function emojiTex(emoji) {
    var k = 'e' + emoji;
    if (!TEX[k]) {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var g = c.getContext('2d');
      g.font = '102px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(emoji, 64, 70);
      TEX[k] = new THREE.CanvasTexture(c);
    }
    return TEX[k];
  }
  function emojiSprite(emoji, scale) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(emoji), transparent: true, depthWrite: false }));
    s.scale.set(scale, scale, 1);
    return s;
  }
  function waterTex() {
    if (!TEX.water) {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d');
      g.fillStyle = '#6fb6e6'; g.fillRect(0, 0, 64, 64);
      g.strokeStyle = 'rgba(220,244,255,.55)'; g.lineWidth = 2;
      for (var y = 4; y < 64; y += 10) {
        g.beginPath();
        for (var x = 0; x <= 64; x += 4) g.lineTo(x, y + Math.sin(x * 0.35 + y) * 1.8);
        g.stroke();
      }
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      TEX.water = t;
    }
    return TEX.water;
  }

  var FLOWER_COLORS = [0xffb35c, 0xffd6e0, 0x93d97e, 0x9fc8ff];   // bear · bunny · frog · bird

  /* ---------- the meadow floor: flat everywhere except the wildflower hill ---------- */
  var HILL = { x: -18, z: 0, r: 8.6, h: 0.72 };
  function groundY(x, z) {
    var dx = x - HILL.x, dz = z - HILL.z, d = Math.sqrt(dx * dx + dz * dz);
    if (d >= HILL.r) return 0;
    var u = d / HILL.r;
    return HILL.h * Math.sqrt(Math.max(0, 1 - u * u));
  }
  RW.groundY = groundY;   // walk.js may lift the child onto the hill with one line

  /* ---------- the winding stream (east) ---------- */
  function streamPoint(t) {
    return { x: 15.2 + Math.sin(t * Math.PI * 1.7) * 1.9, z: -19 + t * 38 };
  }

  /* ---------- animation registers ---------- */
  var ROOT = null;                 // everything this file adds lives under here
  var A = {
    glowers: [],                   // { m, base, hot, k, kT }  emissive fades
    pads: [],                      // lily pads
    mush: [],                      // mushrooms (scale pulse)
    lanterns: [],                  // { sprite }
    sparkles: [],                  // live sparkle notes
    friends: {},                   // id -> friend record
    bobbers: [],                   // { o, y0, sp, amp }
    swayers: [],                   // { o, r0, sp, amp }
    swing: null,
    water: null,
    duck: null,
  };
  var FOUND = {};                  // id -> 1
  var SPARK = { round: 0, taken: [] };
  var CARD_Q = [], cardT = 0;

  function glower(m, baseHex, hotHex) {
    var rec = { m: m, base: new THREE.Color(baseHex), hot: new THREE.Color(hotHex), k: 0, kT: 0 };
    A.glowers.push(rec);
    return rec;
  }

  /* ======================================================================
     BUILDERS
     ====================================================================== */

  function buildHill() {
    var g = new THREE.Group();
    var d = mesh(dome(1, 26, 10), lam(0x63a06e, 0x203a27), HILL.x, 0, HILL.z);
    d.scale.set(HILL.r, HILL.h, HILL.r);
    g.add(d);
    var r = rng(20260726);
    var stemG = cyl(0.045, 0.06, 0.6, 5), bloomG = sph(0.24, 8, 6);
    for (var i = 0; i < 12; i++) {
      var a = r() * Math.PI * 2, dd = 1.4 + r() * (HILL.r * 0.78);
      var x = HILL.x + Math.cos(a) * dd, z = HILL.z + Math.sin(a) * dd, y = groundY(x, z);
      g.add(mesh(stemG, lam(0x4d8f5e, 0x1d3a26), x, y + 0.3, z));
      var b = mesh(bloomG, lam(FLOWER_COLORS[i % 4], 0x33313f), x, y + 0.66, z);
      b.scale.set(1, 0.7, 1);
      g.add(b);
    }
    for (var j = 0; j < 6; j++) {                       // waving grass on the crown
      var a2 = (j / 6) * Math.PI * 2 + 0.4, d2 = 2.2 + (j % 3);
      var x2 = HILL.x + Math.cos(a2) * d2, z2 = HILL.z + Math.sin(a2) * d2;
      var tuft = mesh(cone(0.16, 0.9, 5), lam(0x7cbe86, 0x24402c), x2, groundY(x2, z2) + 0.45, z2);
      g.add(tuft);
      A.swayers.push({ o: tuft, r0: 0, sp: 1.1 + j * 0.13, amp: 0.09 });
    }
    return g;
  }

  function buildStream() {
    var g = new THREE.Group();
    var wm = lam2(0x7cc0ee, 0x27506e);
    wm.map = waterTex();
    A.water = wm;
    var pebG = sph(0.22, 6, 5), pebM = lam(0xa9a5a0, 0x3a3a40);
    for (var i = 0; i <= 16; i++) {
      var p = streamPoint(i / 16);
      var disc = mesh(circ(1.5, 16), wm, p.x, 0.035, p.z);
      disc.rotation.x = -Math.PI / 2;
      disc.scale.set(1 + (i % 3) * 0.06, 1.45, 1);
      g.add(disc);
      if (i % 2 === 0) {                                 // pebbles along the banks
        var side = (i % 4 === 0) ? 1 : -1;
        var pb = mesh(pebG, pebM, p.x + side * (1.7 + (i % 3) * 0.25), 0.14, p.z + 0.4);
        pb.scale.set(1, 0.6, 1.2);
        g.add(pb);
      }
    }
    // cattails at the water's edge
    for (var c = 0; c < 5; c++) {
      var q = streamPoint(0.16 + c * 0.16);
      var stalk = mesh(cyl(0.05, 0.06, 1.5, 5), lam(0x5e8f52, 0x1f331c), q.x + 1.9, 0.75, q.z - 1.1);
      var head = mesh(cyl(0.13, 0.13, 0.5, 7), lam(0x8a6a4a, 0x33271b), q.x + 1.9, 1.65, q.z - 1.1);
      g.add(stalk, head);
      A.swayers.push({ o: stalk, r0: 0, sp: 0.8 + c * 0.1, amp: 0.06 });
    }
    return g;
  }

  function buildBridge(spot) {
    var t = 0.53, p = streamPoint(t), p2 = streamPoint(t + 0.02);
    var flow = Math.atan2(p2.x - p.x, p2.z - p.z);        // bridge lies across the flow
    var g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    g.rotation.y = flow + Math.PI / 2;
    spot.x = p.x; spot.z = p.z;
    var woodM = lam(0xa9825c, 0x3a2a18), darkM = lam(0x7a5c40, 0x2a1f14);
    for (var i = 0; i < 6; i++) {                          // planks (low: little feet walk over them)
      g.add(mesh(box(0.62, 0.14, 3.0), woodM, -2.0 + i * 0.8, 0.12, 0));
    }
    for (var s = -1; s <= 1; s += 2) {
      g.add(mesh(box(4.8, 0.12, 0.14), darkM, 0, 0.66, s * 1.35));
      g.add(mesh(cyl(0.11, 0.13, 0.72, 7), darkM, -2.1, 0.36, s * 1.35));
      g.add(mesh(cyl(0.11, 0.13, 0.72, 7), darkM, 2.1, 0.36, s * 1.35));
    }
    return g;
  }

  function buildLog() {
    var g = new THREE.Group();
    g.position.set(-8.5, 0, 13);
    g.rotation.y = 0.45;
    var barkM = lam2(0x8a6a4a, 0x33271b, THREE.DoubleSide);
    var innerM = lam2(0x5b432c, 0x241a10, THREE.DoubleSide);
    var tube = mesh(cyl(1.62, 1.62, 6.2, 16, true), barkM, 0, 0.9, 0);
    tube.rotation.z = Math.PI / 2;
    var inner = mesh(cyl(1.5, 1.5, 6.18, 16, true), innerM, 0, 0.9, 0);
    inner.rotation.z = Math.PI / 2;
    g.add(tube, inner);
    for (var s = -1; s <= 1; s += 2) {                     // sawn ends
      var ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.62, 16), lam2(0xc4a882, 0x4a3c26, THREE.DoubleSide));
      ring.position.set(s * 3.1, 0.9, 0);
      ring.rotation.y = Math.PI / 2;
      g.add(ring);
    }
    var moss = mesh(sph(0.9, 10, 8), lam(0x5f9b62, 0x1f3a26), 0.6, 2.2, 0.3);
    moss.scale.set(1.5, 0.4, 0.8);
    var knot = mesh(sph(0.3, 8, 6), lam(0x6f5335, 0x281c10), -1.4, 2.1, 0.9);
    g.add(moss, knot);
    return g;
  }

  function buildMushrooms(spot) {
    var g = new THREE.Group();
    var cx = spot.x, cz = spot.z, R = 2.7;
    var stemG = cyl(0.17, 0.24, 0.72, 8), capG = dome(0.52, 12, 8);
    var caps = [0xffc9de, 0xc9e4ff, 0xffe6a8, 0xd9c9ff];
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2;
      var x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R;
      g.add(mesh(stemG, lam(0xf3ead9, 0x5a5348), x, 0.36, z));
      var cm = lam2(caps[i % 4], 0x3a3450);
      var cap = mesh(capG, cm, x, 0.72, z);
      cap.scale.set(1, 0.78, 1);
      g.add(cap);
      var rec = glower(cm, 0x3a3450, 0xa89ad8);
      A.mush.push({ o: cap, g: rec, phase: i / 8 });
    }
    for (var j = 0; j < 2; j++) {                          // two babies in the middle
      var bx = cx + (j ? 0.7 : -0.6), bz = cz + (j ? -0.5 : 0.6);
      g.add(mesh(cyl(0.09, 0.12, 0.34, 6), lam(0xf3ead9, 0x5a5348), bx, 0.17, bz));
      var bc = mesh(dome(0.26, 10, 6), lam(0xffd6e0, 0x3a3450), bx, 0.34, bz);
      bc.scale.set(1, 0.8, 1);
      g.add(bc);
    }
    var gl = glow('rgba(200,190,255,0.85)', 'rgba(150,130,255,0)', 5.5);
    gl.position.set(cx, 0.9, cz);
    gl.material.opacity = 0.28;
    g.add(gl);
    A.lanterns.push({ s: gl, base: 0.28, hot: 0.7, k: 0, kT: 0 });
    return g;
  }

  function buildLilyPads() {
    var g = new THREE.Group();
    var spots = [[-2.0, 4.6], [-0.75, 5.5], [0.75, 5.5], [2.0, 4.6]];
    var padG = circ(0.72, 14);
    for (var i = 0; i < 4; i++) {
      var pm = lam2(0x63b06a, 0x24402c);
      var pad = mesh(padG, pm, spots[i][0], 0.07, spots[i][1]);
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = i * 0.4;
      g.add(pad);
      var rec = glower(pm, 0x24402c, FLOWER_COLORS[i]);
      A.pads.push({ o: pad, g: rec, y0: 0.07, i: i, ph: i * 1.4 });
      if (i === 1 || i === 2) {                            // a little bloom on two of them
        var fl = mesh(sph(0.16, 8, 6), lam(FLOWER_COLORS[i], 0x3a3140), spots[i][0] + 0.28, 0.16, spots[i][1] - 0.2);
        fl.scale.set(1, 0.7, 1);
        g.add(fl);
      }
    }
    var stoneG = circ(0.55, 12), stoneM = lam(0x9d9a95, 0x38383e);
    for (var s = -1; s <= 1; s += 2) {                     // shore stones so the pads feel steppable
      var st = mesh(stoneG, stoneM, s * 3.1, 0.05, 5.3);
      st.rotation.x = -Math.PI / 2;
      g.add(st);
    }
    return g;
  }

  function buildStones(spot) {
    var g = new THREE.Group();
    var cx = spot.x, cz = spot.z, R = 3.4;
    var stG = new THREE.DodecahedronGeometry(0.78, 0);
    GEO.stone = stG;
    var r = rng(4242);
    for (var i = 0; i < 7; i++) {
      var a = (i / 7) * Math.PI * 2;
      var sm = lam2(0x9a97a6, 0x33333f);
      var st = mesh(stG, sm, cx + Math.cos(a) * R, 0.92, cz + Math.sin(a) * R);
      st.scale.set(1, 1.85 + r() * 0.4, 0.78);
      st.rotation.y = r() * 3;
      st.rotation.z = (r() - 0.5) * 0.16;
      g.add(st);
      glower(sm, 0x33333f, 0x7f6fc0);
    }
    var disc = mesh(circ(1.8, 20), lam(0x8f8b86, 0x35353c), cx, 0.04, cz);
    disc.rotation.x = -Math.PI / 2;
    g.add(disc);
    var gl = glow('rgba(190,175,255,0.8)', 'rgba(130,110,220,0)', 6);
    gl.position.set(cx, 0.7, cz);
    gl.material.opacity = 0.16;
    g.add(gl);
    A.lanterns.push({ s: gl, base: 0.16, hot: 0.6, k: 0, kT: 0 });
    return g;
  }

  function buildSwing(spot) {
    var g = new THREE.Group();
    var cx = spot.x, cz = spot.z;
    g.add(mesh(cyl(0.42, 0.62, 4.4, 9), lam(0x7a5c40, 0x2a1f14), cx, 2.2, cz));
    var c1 = mesh(sph(2.9, 14, 10), lam(0x3f7d55, 0x14301e), cx, 4.9, cz);
    c1.scale.y = 1.05;
    var c2 = mesh(sph(2.0, 12, 9), lam(0x4a8c5f, 0x18351f), cx - 1.9, 4.1, cz + 1.1);
    g.add(c1, c2);
    var branch = mesh(cyl(0.16, 0.2, 3.4, 7), lam(0x7a5c40, 0x2a1f14), cx + 1.3, 3.5, cz);
    branch.rotation.z = Math.PI / 2;
    g.add(branch);
    var pivot = new THREE.Group();
    pivot.position.set(cx + 2.2, 3.4, cz);
    var ropeM = lam(0xd9c39a, 0x4a4030);
    for (var s = -1; s <= 1; s += 2) {
      pivot.add(mesh(cyl(0.045, 0.045, 2.7, 5), ropeM, 0, -1.35, s * 0.55));
    }
    pivot.add(mesh(box(0.7, 0.12, 1.5), lam(0xb2864f, 0x3a2a18), 0, -2.72, 0));
    g.add(pivot);
    A.swing = { o: pivot, v: 0.12, a: 0 };
    return g;
  }

  function buildStage(spot) {
    var g = new THREE.Group();
    var cx = spot.x, cz = spot.z;
    var deck = mesh(cyl(3.1, 3.3, 0.16, 22), lam(0xb2864f, 0x3a2a18), cx, 0.08, cz);
    var rim = mesh(torus(3.15, 0.1, 6, 24), lam(0x8a6a4a, 0x33271b), cx, 0.16, cz);
    rim.rotation.x = -Math.PI / 2;
    g.add(deck, rim);
    for (var i = 0; i < 4; i++) {
      var a = Math.PI / 4 + (i / 4) * Math.PI * 2;
      var x = cx + Math.cos(a) * 2.9, z = cz + Math.sin(a) * 2.9;
      g.add(mesh(cyl(0.09, 0.11, 2.2, 7), lam(0x7a5c40, 0x2a1f14), x, 1.1, z));
      var lm = lam2(0xffd9a0, 0x6a4a18);
      var lantern = mesh(sph(0.28, 10, 8), lm, x, 2.3, z);
      g.add(lantern);
      glower(lm, 0x6a4a18, 0xffcf7a);
      var gl = glow('rgba(255,220,150,0.9)', 'rgba(255,170,60,0)', 2.2);
      gl.position.set(x, 2.3, z);
      gl.material.opacity = 0.3;
      g.add(gl);
      A.lanterns.push({ s: gl, base: 0.3, hot: 0.95, k: 0, kT: 0, flick: i });
    }
    return g;
  }

  function buildBerryBush() {
    var g = new THREE.Group();
    var cx = -12, cz = 8;
    var leafM = lam(0x376b45, 0x142a1a);
    var b1 = mesh(sph(1.15, 12, 10), leafM, cx, 1.0, cz); b1.scale.set(1, 0.85, 1);
    var b2 = mesh(sph(0.85, 10, 8), leafM, cx - 0.95, 0.8, cz + 0.4);
    var b3 = mesh(sph(0.75, 10, 8), leafM, cx + 0.9, 0.75, cz - 0.35);
    g.add(b1, b2, b3);
    var berryG = sph(0.15, 6, 5), berryM = lam(0x9b5de5, 0x3a2258);
    var r = rng(777);
    for (var i = 0; i < 10; i++) {
      var a = r() * Math.PI * 2, e = 0.3 + r() * 0.9;
      g.add(mesh(berryG, berryM,
        cx + Math.cos(a) * 1.15, 0.7 + e, cz + Math.sin(a) * 1.05));
    }
    A.swayers.push({ o: b1, r0: 0, sp: 0.7, amp: 0.05 });
    return g;
  }

  function buildExtraTrees() {
    var g = new THREE.Group();
    var spots = [[-6.5, -14.5], [7.5, 15.5], [-22.5, -8.5], [18.5, -6.5]];
    for (var i = 0; i < spots.length; i++) {
      var x = spots[i][0], z = spots[i][1];
      g.add(mesh(cyl(0.3, 0.44, 2.8, 8), lam(0x7a5c40, 0x2a1f14), x, 1.4, z));
      var c = mesh(sph(2.1 + (i % 2) * 0.5, 12, 9), lam(0x3f7d55, 0x14301e), x, 4.0, z);
      c.scale.y = 1.12;
      g.add(c);
    }
    return g;
  }

  function buildPaths() {
    // three faint stepping-stone trails leaving the band — an invitation, never a rule
    var g = new THREE.Group();
    var stG = circ(0.5, 10), stM = lam(0x9d9a95, 0x35353c);
    var trails = [
      [[-4.5, 1.5], [-7.5, 1.2], [-10.5, 0.9], [-13.5, 0.6]],           // → the hill
      [[4.5, 2.0], [7.5, 2.4], [10.5, 2.0], [13.0, 1.6]],               // → the bridge
      [[0.0, 8.0], [0.0, 9.6], [0.0, 11.2]],                            // → the lantern stage
    ];
    for (var t = 0; t < trails.length; t++) {
      for (var i = 0; i < trails[t].length; i++) {
        var p = trails[t][i];
        var s = mesh(stG, stM, p[0], groundY(p[0], p[1]) + 0.04, p[1]);
        s.rotation.x = -Math.PI / 2;
        s.rotation.z = i * 0.7;
        g.add(s);
      }
    }
    return g;
  }

  /* ---------- the four shy meadow friends ---------- */
  function friendShell(id, x, z, y) {
    var g = new THREE.Group();
    g.position.set(x, y || 0, z);
    var zz = emojiSprite('💤', 0.7);
    zz.position.set(0.55, 1.0, 0);
    g.add(zz);
    var rec = { id: id, g: g, zz: zz, wake: 0, awake: false, bob: Math.random() * 6, wave: 0, part: null, base: 1 };
    A.friends[id] = rec;
    return rec;
  }

  function buildDuck() {
    var f = friendShell('duck', -2.6, 1.8, 0.12);
    var whiteM = lam(0xfdf7ee, 0x6a6459), billM = lam(0xffb703, 0x6a4a08);
    var body = mesh(sph(0.5, 14, 11), whiteM, 0, 0.34, 0);
    body.scale.set(1.25, 0.85, 1);
    var head = mesh(sph(0.28, 12, 10), whiteM, 0, 0.85, 0.3);
    var bill = mesh(cone(0.12, 0.28, 8), billM, 0, 0.82, 0.58);
    bill.rotation.x = Math.PI / 2;
    var eye = mesh(sph(0.05, 6, 5), lam(0x2a2a3a, 0x2a2a3a), 0.13, 0.92, 0.5);
    var eye2 = mesh(sph(0.05, 6, 5), lam(0x2a2a3a, 0x2a2a3a), -0.13, 0.92, 0.5);
    var wing = mesh(sph(0.3, 10, 8), lam(0xf0e6d6, 0x5e574c), 0.42, 0.42, -0.05);
    wing.scale.set(0.4, 0.7, 1.1);
    f.g.add(body, head, bill, eye, eye2, wing);
    f.part = wing;
    A.duck = f;
    return f.g;
  }

  function buildHedgehog() {
    var f = friendShell('hedgehog', -12, 9.6, 0);
    var furM = lam(0xd8b48a, 0x4e412c), spikeM = lam(0x7a5334, 0x2c2013);
    var body = mesh(sph(0.42, 12, 10), furM, 0, 0.36, 0);
    body.scale.set(1.15, 0.9, 1);
    var snout = mesh(cone(0.15, 0.34, 8), furM, 0, 0.33, 0.42);
    snout.rotation.x = Math.PI / 2;
    var nose = mesh(sph(0.06, 6, 5), lam(0x3a2a2a, 0x2a2020), 0, 0.33, 0.58);
    f.g.add(body, snout, nose);
    for (var s = -1; s <= 1; s += 2) {
      f.g.add(mesh(sph(0.05, 6, 5), lam(0x2a2a3a, 0x2a2a3a), 0.14 * s, 0.44, 0.32));
    }
    for (var i = 0; i < 5; i++) {
      var a = -0.9 + i * 0.45;
      var sp = mesh(cone(0.11, 0.34, 6), spikeM, Math.sin(a) * 0.3, 0.68, Math.cos(a) * 0.3 - 0.18);
      sp.rotation.x = -0.35;
      f.g.add(sp);
    }
    f.part = body;
    return f.g;
  }

  function buildSnail() {
    var f = friendShell('snail', -6.2, 14.6, 1.9);         // riding on top of the hollow log
    var bodyM = lam(0xf2c9a0, 0x5e4c36), shellM = lam(0xc97b4a, 0x4a2c18);
    var foot = mesh(sph(0.34, 10, 8), bodyM, 0, 0.14, 0);
    foot.scale.set(1.5, 0.5, 0.8);
    var neck = mesh(sph(0.16, 8, 7), bodyM, 0.34, 0.24, 0);
    neck.scale.set(1, 1.1, 1);
    var shell = mesh(torus(0.3, 0.15, 8, 14), shellM, -0.12, 0.38, 0);
    shell.rotation.y = Math.PI / 2;
    var stalks = new THREE.Group();
    stalks.position.set(0.42, 0.3, 0);
    for (var s = -1; s <= 1; s += 2) {
      stalks.add(mesh(cyl(0.03, 0.03, 0.3, 5), bodyM, 0, 0.16, s * 0.1));
      stalks.add(mesh(sph(0.05, 6, 5), lam(0x2a2a3a, 0x2a2a3a), 0, 0.33, s * 0.1));
    }
    f.g.add(foot, neck, shell, stalks);
    f.part = stalks;
    f.base = 1;
    return f.g;
  }

  function buildFox() {
    var f = friendShell('fox', -18.4, groundY(-18.4, -0.6), -0.6);
    f.g.position.set(-18.4, groundY(-18.4, -0.6), -0.6);
    var orange = lam(0xe8834a, 0x4e2c16), cream = lam(0xfaf0e2, 0x60584c);
    var body = mesh(sph(0.46, 12, 10), orange, 0, 0.4, 0);
    body.scale.set(1.15, 0.9, 1.05);
    var head = mesh(sph(0.34, 12, 10), orange, 0, 0.92, 0.22);
    var snout = mesh(cone(0.16, 0.34, 8), cream, 0, 0.86, 0.5);
    snout.rotation.x = Math.PI / 2;
    f.g.add(body, head, snout);
    for (var s = -1; s <= 1; s += 2) {
      var ear = mesh(cone(0.14, 0.3, 6), orange, 0.19 * s, 1.2, 0.16);
      f.g.add(ear);
      f.g.add(mesh(sph(0.05, 6, 5), lam(0x2a2a3a, 0x2a2a3a), 0.14 * s, 0.98, 0.46));
    }
    var tail = mesh(sph(0.28, 10, 8), orange, 0, 0.44, -0.66);
    tail.scale.set(0.8, 0.8, 1.8);
    var tip = mesh(sph(0.17, 8, 7), cream, 0, 0.5, -1.06);
    f.g.add(tail, tip);
    f.part = tail;
    return f.g;
  }

  /* ======================================================================
     DISCOVERIES
     ====================================================================== */

  function saveFound() {
    var list = [];
    for (var k in FOUND) if (FOUND[k]) list.push(k);
    save('world.found', list);
  }
  RW.foundCount = function () {
    var n = 0;
    for (var i = 0; i < DISCOVERIES.length; i++) if (FOUND[DISCOVERIES[i].id]) n++;
    return n;
  };

  /* Two spots can overlap (the fox sits ON the hill), so cards are announced one
     at a time, 1.8s apart — never two celebrations on top of each other. */
  function pumpCards(dt) {
    cardT -= dt;
    if (cardT > 0 || !CARD_Q.length) return;
    var d = CARD_Q.shift();
    cardT = 1.8;
    var title = tr(d.en[0], d.es[0]);
    var text = tr(d.en[1], d.es[1]);
    var shown = false;
    try {
      if (RWalk && typeof RWalk.found === 'function') {
        shown = RWalk.found(d.id, title, { emoji: d.emoji, title: title, text: text }) !== false;
      }
    } catch (e) { shown = false; }
    if (!shown) toast(d.emoji + ' ' + title, 3400);        // fallback if walk.js is not there
    sfx('star');
    if (d.say) say(tr(d.say[0], d.say[1]));
    else say(title);
    bloom(Math.floor(Math.random() * 4));
    var n = RW.foundCount();
    if (n === DISCOVERIES.length) {
      setTimeout(function () {
        toast(tr('🏅 You found every place in the meadow! It is all yours.',
                 '🏅 ¡Encontraste todos los rincones del prado! Es todo tuyo.'), 5000);
        sfx('star');
        try { K && K.streakBump && K.streakBump(); } catch (e) {}
        for (var i = 0; i < 6; i++) bloom(i);
      }, 2200);
    }
  }

  function discover(d) {
    if (FOUND[d.id]) return false;
    FOUND[d.id] = 1;
    saveFound();
    record('find', DISCOVERIES.indexOf(d));
    CARD_Q.push(d);
    if (cardT <= 0) cardT = 0.15;
    return true;
  }

  /* ---------- what each place DOES when the child steps into it ---------- */
  function placeEnter(d) {
    switch (d.id) {
      case 'mushrooms':
        for (var i = 0; i < A.mush.length; i++) A.mush[i].g.kT = 1;
        A.lanterns[0] && (A.lanterns[0].kT = 1);
        sequence([0, 1, 2, 3, 2, 1], 190, 0.13);
        break;
      case 'stones':
        for (var s = 0; s < A.glowers.length; s++) { /* handled below by tag */ }
        setGlowTag('stone', 1);
        tagLantern('stone', 1);
        sequence([0, 2, 3], 240, 0.11);
        break;
      case 'stage':
        setGlowTag('lantern', 1);
        tagLantern('lantern', 1);
        sequence([0, 1, 2, 3], 230, 0.17);
        break;
      case 'bridge':
        sfx('pop');
        setTimeout(function () { sfx('pop'); }, 220);
        break;
      case 'log':
        note(1, 0.16);
        setTimeout(function () { note(1, 0.08); }, 280);
        setTimeout(function () { note(1, 0.04); }, 560);
        break;
      case 'swing':
        if (A.swing) A.swing.v = 1.6;
        sfx('tap');
        break;
      case 'hill':
        sfx('tap');
        break;
      default: break;
    }
  }
  function placeExit(d) {
    if (d.id === 'mushrooms') {
      for (var i = 0; i < A.mush.length; i++) A.mush[i].g.kT = 0;
      A.lanterns[0] && (A.lanterns[0].kT = 0);
    } else if (d.id === 'stones') { setGlowTag('stone', 0); tagLantern('stone', 0); }
    else if (d.id === 'stage') { setGlowTag('lantern', 0); tagLantern('lantern', 0); }
  }
  function sequence(notes, gap, vol) {
    for (var i = 0; i < notes.length; i++) {
      (function (n, idx) {
        setTimeout(function () { if (!paused()) note(n, vol); }, idx * gap);
      })(notes[i], i);
    }
  }
  // simple tags so places can light their own glowers without extra bookkeeping
  var TAGGED = { stone: [], lantern: [] };
  function setGlowTag(tag, v) { for (var i = 0; i < TAGGED[tag].length; i++) TAGGED[tag][i].kT = v; }
  function tagLantern(tag, v) {
    for (var i = 0; i < A.lanterns.length; i++) if (A.lanterns[i].tag === tag) A.lanterns[i].kT = v;
  }

  function wakeFriend(id) {
    var f = A.friends[id];
    if (!f) return;
    if (!f.awake) { f.awake = true; f.wake = 0.001; sfx('pop'); }
    f.wave = 1.6;
  }

  /* ---------- sparkle notes: eight at a time, then eight fresh ones ---------- */
  function sparkleIndices(round) {
    var idx = [], i;
    for (i = 0; i < SPARKLE_POOL.length; i++) idx.push(i);
    var r = rng(1013 + round * 7919);
    for (i = idx.length - 1; i > 0; i--) {                 // deterministic shuffle
      var j = Math.floor(r() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return idx.slice(0, SPARKLES_PER_ROUND);
  }
  function clearSparkles() {
    for (var i = 0; i < A.sparkles.length; i++) {
      var s = A.sparkles[i];
      try { RWalk && RWalk.removeSpot && RWalk.removeSpot(s.spotId); } catch (e) {}
      if (s.g && s.g.parent) s.g.parent.remove(s.g);
    }
    A.sparkles.length = 0;
  }
  function spawnSparkles() {
    clearSparkles();
    var picks = sparkleIndices(SPARK.round);
    for (var i = 0; i < picks.length; i++) {
      var pi = picks[i];
      if (SPARK.taken.indexOf(pi) >= 0) continue;
      var p = SPARKLE_POOL[pi];
      var g = new THREE.Group();
      g.position.set(p[0], groundY(p[0], p[1]) + 1.0, p[1]);
      var gl = glow('rgba(255,246,200,0.95)', 'rgba(255,214,120,0)', 1.7);
      var em = emojiSprite('✨', 0.9);
      g.add(gl, em);
      ROOT.add(g);
      var rec = { g: g, gl: gl, em: em, idx: pi, ph: i * 0.8, spotId: 'spark.' + pi, gone: 0 };
      A.sparkles.push(rec);
      addSpot(rec.spotId, p[0], p[1], 1.5, true, (function (r) {
        return function () { takeSparkle(r); };
      })(rec), null);
    }
  }
  function takeSparkle(rec) {
    if (rec.gone) return;
    rec.gone = 0.001;
    if (SPARK.taken.indexOf(rec.idx) < 0) SPARK.taken.push(rec.idx);
    save('world.taken', SPARK.taken);
    sfx('star');
    note(Math.floor(Math.random() * 4), 0.2);
    bloom(Math.floor(Math.random() * 4));
    record('sparkle', SPARK.taken.length);
    var n = SPARK.taken.length;
    if (n >= SPARKLES_PER_ROUND) {
      toast(tr('✨🎉 All eight sparkle notes! The meadow is singing!',
               '✨🎉 ¡Las ocho notas brillantes! ¡El prado está cantando!'), 4600);
      say(tr('You found all eight sparkle notes! Wonderful!',
             '¡Encontraste las ocho notas brillantes! ¡Maravilloso!'));
      try { K && K.streakBump && K.streakBump(); } catch (e) {}
      for (var i = 0; i < 6; i++) bloom(i);
      sequence([0, 1, 2, 3, 3, 2, 1, 0], 200, 0.2);
      SPARK.round++; SPARK.taken = [];
      save('world.round', SPARK.round);
      save('world.taken', SPARK.taken);
      setTimeout(function () {
        try {
          spawnSparkles();
          toast(tr('✨ Eight new sparkle notes are hiding! Go and look…',
                   '✨ ¡Ocho notas brillantes nuevas se escondieron! Ve a buscarlas…'), 4200);
        } catch (e) {}
      }, 4200);
    } else {
      toast(tr('✨ ' + n + ' of 8 sparkle notes', '✨ ' + n + ' de 8 notas brillantes'), 2200);
    }
  }

  /* ---------- spot plumbing ---------- */
  function addSpot(id, x, z, r, once, onEnter, onExit) {
    try {
      if (RWalk && typeof RWalk.addSpot === 'function') {
        RWalk.addSpot({ id: id, x: x, z: z, r: r, once: !!once, onEnter: onEnter, onExit: onExit });
      }
    } catch (e) {}
  }

  function registerSpots() {
    for (var i = 0; i < DISCOVERIES.length; i++) {
      (function (d) {
        addSpot('find.' + d.id, d.x, d.z, d.r, false,
          function () {
            if (paused()) return;
            placeEnter(d);
            if (d.id === 'duck' || d.id === 'hedgehog' || d.id === 'snail' || d.id === 'fox') wakeFriend(d.id);
            discover(d);
          },
          function () { placeExit(d); });
      })(DISCOVERIES[i]);
    }
    // the lily pads: four little note spots, playable again and again
    for (var p = 0; p < A.pads.length; p++) {
      (function (pad) {
        addSpot('pad.' + pad.i, pad.o.position.x, pad.o.position.z, 0.95, false,
          function () {
            if (paused()) return;
            note(pad.i, 0.22);
            pad.g.kT = 1;
            pad.hop = 1;
            bloom(pad.i);
          },
          function () { pad.g.kT = 0; });
      })(A.pads[p]);
    }
  }

  /* ======================================================================
     BUILD
     ====================================================================== */
  RW.build = function (host) {
    if (built) return;
    try {
      host = host || {};
      THREE = host.THREE || window.THREE;
      scene = host.scene;
      K = host.K || window.ABEKit || {};
      RWalk = host.RWalk || window.RWalk || null;
      if (host.playNote) playNote = host.playNote;
      if (host.plantFlower) plantFlower = host.plantFlower;
      if (!THREE || !scene) return;
      built = true;

      ROOT = new THREE.Group();
      scene.add(ROOT);

      // remember what this child already found
      var savedFound = load('world.found', []);
      if (savedFound && savedFound.length) for (var i = 0; i < savedFound.length; i++) FOUND[savedFound[i]] = 1;
      SPARK.round = load('world.round', 0) | 0;
      var st = load('world.taken', []);
      SPARK.taken = Object.prototype.toString.call(st) === '[object Array]' ? st : [];

      var byId = {};
      for (var d = 0; d < DISCOVERIES.length; d++) byId[DISCOVERIES[d].id] = DISCOVERIES[d];

      ROOT.add(buildHill());
      ROOT.add(buildStream());
      ROOT.add(buildBridge(byId.bridge));
      ROOT.add(buildLog());
      ROOT.add(buildMushrooms(byId.mushrooms));
      ROOT.add(buildLilyPads());
      ROOT.add(buildStones(byId.stones));
      ROOT.add(buildSwing(byId.swing));
      ROOT.add(buildStage(byId.stage));
      ROOT.add(buildBerryBush());
      ROOT.add(buildExtraTrees());
      ROOT.add(buildPaths());
      ROOT.add(buildDuck());
      ROOT.add(buildHedgehog());
      ROOT.add(buildSnail());
      ROOT.add(buildFox());

      // tag the glowers that belong to the stone circle and the lanterns
      // (stones were pushed while building the circle; lanterns while building the stage)
      TAGGED.stone = A.glowers.slice(A.glowers.length - 4 - 7, A.glowers.length - 4);
      TAGGED.lantern = A.glowers.slice(A.glowers.length - 4);
      for (var li = 0; li < A.lanterns.length; li++) {
        A.lanterns[li].tag = (li === 0) ? 'mush' : (li === 1 ? 'stone' : 'lantern');
      }

      // friends already met in an earlier visit stay awake
      for (var id in A.friends) if (FOUND[id]) { A.friends[id].awake = true; A.friends[id].wake = 1; }

      spawnSparkles();
      registerSpots();
      RW.tick(0);
    } catch (e) {
      // a broken prop must never take the meadow down
      try { console.warn('RWorld.build', e); } catch (e2) {}
    }
  };

  /* ======================================================================
     TICK
     ====================================================================== */
  RW.tick = function (dt) {
    if (!built) return;
    try {
      dt = Math.min(0.05, dt || 0);
      var slow = calm() ? 0.7 : 1;
      var M = reduced() ? 0.3 : 1;                        // motion amount, never strobing
      T += dt * slow;

      pumpCards(dt);

      if (A.water && A.water.map) {
        A.water.map.offset.y = (A.water.map.offset.y - dt * 0.05 * slow) % 1;
      }

      // emissive fades (mushrooms, stones, lanterns, lily pads)
      for (var i = 0; i < A.glowers.length; i++) {
        var g = A.glowers[i];
        var k = g.k + (g.kT - g.k) * Math.min(1, dt * 3.2);
        if (Math.abs(k - g.k) > 0.0004 || g.k !== g.kT) {
          g.k = k;
          g.m.emissive.copy(g.base).lerp(g.hot, Math.max(0, Math.min(1, k)));
        }
      }

      // mushrooms breathe
      for (var m = 0; m < A.mush.length; m++) {
        var mu = A.mush[m];
        var s = 1 + Math.sin(T * 1.5 + mu.phase * 6.28) * 0.05 * M + mu.g.k * 0.14;
        mu.o.scale.set(s, 0.78 * s, s);
      }

      // lantern / ring glows
      for (var l = 0; l < A.lanterns.length; l++) {
        var la = A.lanterns[l];
        la.k += (la.kT - la.k) * Math.min(1, dt * 3);
        var flick = la.flick === undefined ? 0 : Math.sin(T * 2.1 + la.flick * 1.7) * 0.05 * M;
        la.s.material.opacity = Math.max(0, la.base + (la.hot - la.base) * la.k + flick);
      }

      // lily pads float, and hop when you step on them
      for (var p = 0; p < A.pads.length; p++) {
        var pad = A.pads[p];
        if (pad.hop) pad.hop = Math.max(0, pad.hop - dt * 2.2);
        pad.o.position.y = pad.y0 + Math.sin(T * 1.2 + pad.ph) * 0.02 * M + (pad.hop || 0) * 0.08;
      }

      // sparkle notes bob, spin and pop when collected
      for (var sp = A.sparkles.length - 1; sp >= 0; sp--) {
        var sk = A.sparkles[sp];
        if (sk.gone) {
          sk.gone += dt * 2.4;
          var e = Math.min(1, sk.gone);
          sk.g.scale.setScalar(1 + e * 1.8);
          sk.g.position.y += dt * 2.2;
          sk.gl.material.opacity = Math.max(0, 1 - e);
          sk.em.material.opacity = Math.max(0, 1 - e);
          if (e >= 1) {
            if (sk.g.parent) sk.g.parent.remove(sk.g);
            A.sparkles.splice(sp, 1);
          }
        } else {
          sk.g.position.y = groundY(sk.g.position.x, sk.g.position.z) + 1.0 + Math.sin(T * 1.8 + sk.ph) * 0.16 * M;
          sk.em.material.rotation = Math.sin(T * 1.4 + sk.ph) * 0.4 * M;
          sk.gl.material.opacity = 0.55 + Math.sin(T * 2.6 + sk.ph) * 0.2;
        }
      }

      // the swing keeps a gentle pendulum
      if (A.swing) {
        A.swing.a += A.swing.v * dt * 2.0;
        A.swing.v += -Math.sin(A.swing.a) * dt * 2.6 - A.swing.v * dt * 0.22;
        A.swing.o.rotation.x = Math.sin(A.swing.a) * 0.34 * M;
      }

      // grasses and cattails sway
      for (var w = 0; w < A.swayers.length; w++) {
        var sw = A.swayers[w];
        sw.o.rotation.z = sw.r0 + Math.sin(T * sw.sp) * sw.amp * M;
      }

      // the shy friends
      var pos = null;
      try { pos = RWalk && RWalk.pos ? RWalk.pos : null; } catch (e) { pos = null; }
      for (var id in A.friends) {
        var f = A.friends[id];
        if (f.awake && f.wake < 1) f.wake = Math.min(1, f.wake + dt * 2.2);
        var pop = f.awake ? 1 + Math.sin(Math.min(1, f.wake) * Math.PI) * 0.22 * M : 0.78;
        var sc = f.awake ? (0.82 + 0.18 * f.wake) * pop : 0.78;
        f.g.scale.setScalar(sc);
        f.zz.visible = !f.awake;
        f.zz.material.opacity = 0.5 + Math.sin(T * 1.3) * 0.25;
        f.bob += dt * (f.awake ? 1.6 : 0.7);
        var lift = f.awake ? Math.abs(Math.sin(f.bob)) * 0.07 * M : 0;
        if (f.wave > 0) { f.wave = Math.max(0, f.wave - dt); lift += Math.abs(Math.sin(f.bob * 3)) * 0.12 * M; }
        f.g.position.y = (f.id === 'snail' ? 1.9 : f.id === 'duck' ? 0.12 : groundY(f.g.position.x, f.g.position.z)) + lift;
        if (f.part) {
          if (f.id === 'duck') f.part.rotation.z = Math.sin(f.bob * 4) * (f.wave > 0 ? 0.6 : 0.08) * M;
          else if (f.id === 'fox') f.part.rotation.y = Math.sin(f.bob * 3) * (f.wave > 0 ? 0.5 : 0.14) * M;
          else if (f.id === 'snail') f.part.rotation.z = Math.sin(f.bob * 2) * 0.22 * M;
          else f.part.rotation.z = Math.sin(f.bob * 2.4) * 0.06 * M;
        }
        if (pos && f.awake) {                              // friends look at the child
          var want = Math.atan2(pos.x - f.g.position.x, pos.z - f.g.position.z);
          var cur = f.g.rotation.y;
          var diff = Math.atan2(Math.sin(want - cur), Math.cos(want - cur));
          f.g.rotation.y = cur + diff * Math.min(1, dt * 2);
        }
      }
    } catch (e) { /* never break the frame loop */ }
  };

  /* ======================================================================
     RESET (a grown-up hook: hide everything again and start the hunt fresh)
     ====================================================================== */
  RW.reset = function () {
    try {
      FOUND = {};
      save('world.found', []);
      SPARK.round = 0; SPARK.taken = [];
      save('world.round', 0); save('world.taken', []);
      CARD_Q.length = 0; cardT = 0;
      for (var id in A.friends) { A.friends[id].awake = false; A.friends[id].wake = 0; }
      spawnSparkles();
    } catch (e) {}
  };

  /* ---------- what the integrator / walk.js can read ---------- */
  RW.TOTAL = DISCOVERIES.length;          // the "/ 12" in the 🔎 chip
  RW.DISCOVERIES = DISCOVERIES;
  RW.isFound = function (id) { return !!FOUND[id]; };
  RW.sparklesLeft = function () { return Math.max(0, SPARKLES_PER_ROUND - SPARK.taken.length); };
})();
