/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — THE BALLPARK  (window.SBField)

   Everything you can see: the sky, the grass, the diamond, the chalk, the
   fence, the dugout, the bleachers, the gear, Nilu, the three coaches and the
   four teammates. Nothing in here knows about levels or drills — it just
   builds the place and keeps it breathing.

   Coordinates: home plate is the origin. The outfield is -Z. First base is
   +X/-Z, third base is -X/-Z. One unit ≈ one metre; a child is ~1.5 tall.

   Owns:  scene, lights, every mesh, the people rigs, name tags.
   Gives: SBField.L (every position anything else needs), makePerson(),
          nilu/coach/mate lookups, spot markers, and a tick().

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const F = {};
  let THREE = null, scene = null;
  let clock = 0;

  /* ══════════════════════════════════════════════════════════ THE LAYOUT
     Anything that needs to know where something IS reads it from here. */
  const B = 16;                       // baseline length
  const D = B / Math.SQRT2;           // 11.31 — base offset on each axis

  const L = F.L = {
    baseline: B,
    home:   { x: 0, z: 0 },
    first:  { x: D, z: -D },
    second: { x: 0, z: -2 * D },
    third:  { x: -D, z: -D },
    circle: { x: 0, z: -10.5 },       // pitching circle / rubber
    tee:    { x: 0, z: -0.5 },

    /* batter's boxes — a righty bats from the third-base (-X) side */
    boxR:   { x: -1.7, z: -0.3 },
    boxL:   { x: 1.7, z: -0.3 },
    boxOut: { x: -4.4, z: 2.6 },      // where "step out" puts you (righty; mirrored for lefty)

    dugout: { x: -16.5, z: 2.5 },
    bench:  { x: -16.5, z: 1.75 },   // sitting spot lines up with the seat
    rack:   { x: -12.6, z: 1.0 },     // bat + helmet rack
    bag:    { x: -11.0, z: 4.4 },     // equipment bag: balls, gloves, cleats
    water:  { x: -14.6, z: 4.8 },

    /* stations. `*Coach` is where a coach stands DURING their drill; `*Idle`
       is where they wait the rest of the time — never on top of home plate,
       which the camera and the child both need to be able to see. */
    throwPlayer: { x: 12.0, z: 3.0 },
    throwCoach:  { x: 19.0, z: -5.0 },
    scottIdle:   { x: 19.0, z: -5.0 },
    pitchPlayer: { x: 0, z: -10.5 },
    pitchCoach:  { x: 0, z: 1.7 },       // Coach Sam catches behind the plate
    samIdle:     { x: 3.4, z: -5.0 },
    fieldPlayer: { x: -6.0, z: -16.0 },  // shortstop
    fieldCoach:  { x: -2.6, z: -1.2 },   // fungo spot beside home
    ajIdle:   { x: -7.2, z: 5.4 },
    batCoach:    { x: 2.9, z: -1.9 },    // Coach Sam beside the plate for tee work
    baseCoach:   { x: -13.6, z: -7.4 },  // Coach AJ's coaching box by third
    firstCover:  { x: D + 1.4, z: -D + 1.2 },   // a teammate covering first

    /* Line-up: five footprints on the open grass in front of the dugout.
       Kept out past x = -8.5 so the backstop's posts never stripe across the
       row — a child cannot find "their" spot through a cage. */
    lineUp: [
      { x: -17.6, z: 8.0 }, { x: -15.5, z: 8.0 }, { x: -13.4, z: 8.0 },
      { x: -11.3, z: 8.0 }, { x: -9.2, z: 8.0 },
    ],
    lineUpCoach: { x: -13.4, z: 4.4 },

    /* fielding positions for Game Day */
    pos: {
      p:  { x: 0, z: -10.5 },  c: { x: 0, z: 1.6 },
      '1b': { x: D + 1.6, z: -D + 1.0 }, '2b': { x: 5.4, z: -18.0 },
      '3b': { x: -D - 1.6, z: -D + 1.0 }, ss: { x: -5.4, z: -18.0 },
      lf: { x: -20, z: -30 }, cf: { x: 0, z: -34 }, rf: { x: 20, z: -30 },
    },

    fenceR: 44,
    groundR: 78,
    /* the soft world bound — a circle the child is gently gathered back into */
    boundC: { x: 0, z: -14 },
    boundR: 38,

    start: { x: 0, z: 4.2, ry: Math.PI },   // behind home plate, facing the field
  };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  F.dist = dist;

  /* ══════════════════════════════════════════════════════════ materials */
  const M = {};
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
  const basic = (c) => new THREE.MeshBasicMaterial({ color: c });

  /* Materials and textures shared by the whole ballpark. Anything in here is
     reused by many meshes and must NEVER be disposed when a single throwaway
     object (a marker, a bubble, a footprint) is cleared away. */
  const SHARED = new Set();

  /* Take a throwaway object out of the scene AND free its GPU memory. A
     practice session creates hundreds of markers, footprints, answer bubbles
     and balls; scene.remove() alone leaves every geometry and texture
     resident, which on a tablet eventually takes the whole canvas down. */
  F.discard = function (o) {
    if (!o) return;
    try { if (o.parent) o.parent.remove(o); } catch (e) {}
    try {
      o.traverse((c) => {
        if (c.geometry && c.geometry.dispose) c.geometry.dispose();
        const m = c.material;
        if (!m) return;
        const list = Array.isArray(m) ? m : [m];
        for (const mm of list) {
          if (!mm || SHARED.has(mm)) continue;
          if (mm.map && mm.map !== shadowTex && mm.map.dispose) mm.map.dispose();
          if (mm.dispose) mm.dispose();
        }
      });
    } catch (e) {}
  };

  function buildMaterials() {
    M.dirt = lam(0xc08a5a);
    M.dirtDark = lam(0xa9744a);
    M.chalk = basic(0xfdfdfd);
    M.baseWhite = lam(0xf7f7f2);
    M.wood = lam(0x9c6b43);
    M.woodDark = lam(0x6f4a2c);
    M.metal = lam(0xb9c2cc);
    M.metalDark = lam(0x7c8792);
    M.ball = lam(0xd9e34a);            // optic-yellow softball — the real ones are vivid
    M.seam = basic(0xd6455a);
    M.rubber = lam(0x2f3238);
    M.blue = lam(0x6db9f2);
    M.blueLight = lam(0x8fcdf8);
    M.pink = lam(0xf7c8dc);
    M.white = basic(0xffffff);
    M.dark = basic(0x2a2a3a);
    for (const k in M) SHARED.add(M[k]);
  }

  /* a canvas texture of mown grass stripes — free, and it sells the ballpark */
  function grassTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#3c8438';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#428f3d' : '#377a34';
      g.fillRect(0, i * 32, 256, 32);
    }
    /* a little speckle so it isn't flat */
    for (let i = 0; i < 900; i++) {
      g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,50,0,.08)';
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(14, 14);
    return tx;
  }

  /* chain-link: the diamond weave, drawn once and tiled. This is what makes a
     real park dugout see-through — an opaque box hid whoever stepped behind
     it, which for Nilu meant the child couldn't find her. */
  let linkTex = null;
  function chainLink() {
    if (linkTex) return linkTex;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    g.strokeStyle = 'rgba(206,216,226,0.9)';
    g.lineWidth = 2.6;
    for (let i = -64; i < 128; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke();
      g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke();
    }
    linkTex = new THREE.CanvasTexture(c);
    linkTex.wrapS = linkTex.wrapT = THREE.RepeatWrapping;
    return linkTex;
  }
  /* one panel of fencing, `w` by `h`, centred at x/y/z */
  function meshPanel(x, y, z, w, h, ry) {
    const tex = chainLink().clone();
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(Math.max(1, Math.round(w * 1.1)), Math.max(1, Math.round(h * 1.1)));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide,
                                    depthWrite: false, opacity: 0.85, fog: false }));
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    return m;
  }
  F.meshPanel = meshPanel;

  function shadowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, 'rgba(20,40,20,0.42)');
    gr.addColorStop(1, 'rgba(20,40,20,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  let shadowTex = null;
  F.shadowTexture = () => (shadowTex || (shadowTex = shadowTexture()));

  /* ═════════════════════════════════════════════════════════════ the sky */
  function buildSky() {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 512;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0.00, '#2f7fd0');
    gr.addColorStop(0.45, '#7fc0ee');
    gr.addColorStop(0.80, '#cfe9f8');
    gr.addColorStop(1.00, '#f4f2df');
    g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(200, 24, 16),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.BackSide, fog: false })));

    /* sun + a few soft clouds (sprites — cheap and they read well) */
    scene.add(glowSprite('rgba(255,250,210,1)', 'rgba(255,236,150,0)', 34, 44, 96, -120));
    const cloudTex = cloudTexture();
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.85, fog: false }));
      const a = (i / 9) * Math.PI * 2 + 0.4;
      const r = 110 + (i % 3) * 22;
      s.position.set(Math.sin(a) * r, 44 + (i % 4) * 9, Math.cos(a) * r - 20);
      const sc = 34 + (i % 3) * 12;
      s.scale.set(sc, sc * 0.5, 1);
      scene.add(s);
      clouds.push({ s: s, sp: 0.12 + (i % 3) * 0.05 });
    }
  }
  const clouds = [];

  function cloudTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.95)';
    const blob = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    blob(40, 40, 18); blob(62, 34, 22); blob(86, 42, 16); blob(52, 46, 14);
    return new THREE.CanvasTexture(c);
  }

  function glowSprite(inner, outer, scale, x, y, z) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.scale.set(scale, scale, 1);
    if (x !== undefined) s.position.set(x, y, z);
    return s;
  }
  F.glowSprite = glowSprite;

  /* ═════════════════════════════════════════════════════════ the ground */
  function disc(r, mat, x, z, y) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y || 0.01, z);
    scene.add(m);
    return m;
  }
  /* a flat strip from a→b, `w` wide, lying on the grass */
  function strip(a, b, w, mat, y) {
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -Math.atan2(dx, dz);
    m.position.set(a.x + dx / 2, y || 0.012, a.z + dz / 2);
    scene.add(m);
    return m;
  }
  F.strip = strip;

  function buildGround() {
    const g = new THREE.Mesh(new THREE.CircleGeometry(L.groundR, 56),
      new THREE.MeshLambertMaterial({ map: grassTexture() }));
    g.rotation.x = -Math.PI / 2;
    scene.add(g);

    /* dirt: home area, base cutouts, the circle, and the base paths */
    disc(4.0, M.dirt, L.home.x, L.home.z, 0.014);
    disc(2.6, M.dirt, L.circle.x, L.circle.z, 0.014);
    for (const b of [L.first, L.second, L.third]) disc(2.3, M.dirt, b.x, b.z, 0.014);
    const path = [[L.home, L.first], [L.first, L.second], [L.second, L.third], [L.third, L.home]];
    for (const p of path) strip(p[0], p[1], 1.5, M.dirt, 0.013);

    /* chalk: foul lines out to the poles, and the batter's boxes */
    const R = L.fenceR;
    const poleR = { x: Math.sin(Math.PI / 4) * R, z: -Math.cos(Math.PI / 4) * R };
    const poleL = { x: -poleR.x, z: poleR.z };
    strip(L.home, poleR, 0.16, M.chalk, 0.02);
    strip(L.home, poleL, 0.16, M.chalk, 0.02);
    chalkBox(L.boxR, 1.35, 2.4);
    chalkBox(L.boxL, 1.35, 2.4);

    /* the plate, the rubber, the bases */
    buildPlate();
    const rub = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.32), M.baseWhite);
    rub.position.set(L.circle.x, 0.03, L.circle.z + 0.1);
    scene.add(rub);
    ringOutline(L.circle, 2.6, M.chalk);
    for (const b of [L.first, L.second, L.third]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 1.1), M.baseWhite);
      m.position.set(b.x, 0.05, b.z);
      m.rotation.y = Math.PI / 4;
      scene.add(m);
    }
  }

  function chalkBox(c, w, h) {
    const t = 0.1;
    strip({ x: c.x - w / 2, z: c.z - h / 2 }, { x: c.x - w / 2, z: c.z + h / 2 }, t, M.chalk, 0.02);
    strip({ x: c.x + w / 2, z: c.z - h / 2 }, { x: c.x + w / 2, z: c.z + h / 2 }, t, M.chalk, 0.02);
    strip({ x: c.x - w / 2, z: c.z - h / 2 }, { x: c.x + w / 2, z: c.z - h / 2 }, t, M.chalk, 0.02);
    strip({ x: c.x - w / 2, z: c.z + h / 2 }, { x: c.x + w / 2, z: c.z + h / 2 }, t, M.chalk, 0.02);
  }

  function ringOutline(c, r, mat) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.09, r, 44), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(c.x, 0.019, c.z);
    scene.add(m);
    return m;
  }
  F.ringOutline = ringOutline;

  function buildPlate() {
    /* home plate: a square with a point, the shape kids actually recognise */
    const sq = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 0.62), M.baseWhite);
    sq.position.set(0, 0.03, -0.15);
    scene.add(sq);
    const pt = new THREE.Mesh(new THREE.ConeGeometry(0.61, 0.06, 4), M.baseWhite);
    pt.rotation.x = -Math.PI / 2;
    pt.rotation.z = Math.PI / 4;
    pt.position.set(0, 0.03, 0.28);
    scene.add(pt);
  }

  /* ══════════════════════════════════════════════ fence, backstop, stands */
  function buildFence() {
    const R = L.fenceR;
    const grp = new THREE.Group();
    const railMat = lam(0x2f7a4a), meshMat = lam(0x3f8f5c);
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 4 + (i / steps) * (Math.PI / 2);
      const x = Math.sin(a) * R, z = -Math.cos(a) * R;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.1, 6), M.metalDark);
      post.position.set(x, 1.05, z);
      grp.add(post);
      if (i < steps) {
        const a2 = -Math.PI / 4 + ((i + 1) / steps) * (Math.PI / 2);
        const x2 = Math.sin(a2) * R, z2 = -Math.cos(a2) * R;
        const seg = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x2 - x, z2 - z) + 0.06, 1.75, 0.07), meshMat);
        seg.position.set((x + x2) / 2, 0.92, (z + z2) / 2);
        seg.rotation.y = Math.atan2(x2 - x, z2 - z) + Math.PI / 2;
        grp.add(seg);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x2 - x, z2 - z) + 0.06, 0.16, 0.16), railMat);
        rail.position.set((x + x2) / 2, 1.9, (z + z2) / 2);
        rail.rotation.y = seg.rotation.y;
        grp.add(rail); blocks(rail); blocks(seg);
      }
    }
    /* foul poles — bright yellow, the landmark kids steer by */
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 8, 8), lam(0xffd43b));
      p.position.set(s * Math.sin(Math.PI / 4) * R, 4, -Math.cos(Math.PI / 4) * R);
      grp.add(p);
    }
    scene.add(grp);

    /* a low ring of trees outside the fence, so the world has an edge */
    for (let i = 0; i < 34; i++) {
      const a = -Math.PI * 0.62 + (i / 33) * Math.PI * 1.24;
      const r = R + 7 + (i % 3) * 3;
      const x = Math.sin(a) * r, z = -Math.cos(a) * r;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 3.2, 6), M.woodDark);
      tr.position.set(x, 1.6, z); scene.add(tr); blocks(tr);
      const cr = new THREE.Mesh(new THREE.SphereGeometry(2.6 + (i % 3) * 0.5, 10, 8), lam(i % 2 ? 0x357535 : 0x3d853a));
      cr.position.set(x, 4.4, z); cr.scale.y = 0.85; scene.add(cr); blocks(cr);
    }
  }

  /* Anything tall enough to stand between the child and the camera is tagged
     here; walk.js raycasts along the camera boom against exactly this list and
     pulls the camera in front of whatever it hits. Without it, standing at home
     plate means staring through the backstop. */
  const blockers = F.blockers = [];
  const blocks = (m) => { blockers.push(m); return m; };

  function buildBackstop() {
    const grp = new THREE.Group();
    const R = 9.5;
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI * 0.22 + (i / 10) * Math.PI * 0.44;
      const x = Math.sin(a) * R, z = Math.cos(a) * R;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 6), M.metalDark);
      post.position.set(x, 1.5, z);
      grp.add(post); blocks(post);
      if (i < 10) {
        const a2 = -Math.PI * 0.22 + ((i + 1) / 10) * Math.PI * 0.44;
        const x2 = Math.sin(a2) * R, z2 = Math.cos(a2) * R;
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(Math.hypot(x2 - x, z2 - z) + 0.05, 2.8, 0.05),
          new THREE.MeshLambertMaterial({ color: 0xd6dde4, transparent: true, opacity: 0.22 }));
        seg.position.set((x + x2) / 2, 1.5, (z + z2) / 2);
        seg.rotation.y = Math.atan2(x2 - x, z2 - z) + Math.PI / 2;
        grp.add(seg);
      }
    }
    scene.add(grp);
  }

  function buildBleachers() {
    const grp = new THREE.Group();
    for (let row = 0; row < 4; row++) {
      const y = 0.45 + row * 0.45, z = 13.6 + row * 0.95;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(13, 0.22, 0.75), M.wood);
      plank.position.set(0, y, z);
      grp.add(plank); blocks(plank);
      /* a handful of happy watchers */
      for (let i = 0; i < 5; i++) {
        if ((row + i) % 2) continue;
        const c = [0xef6f9c, 0x7c5cd6, 0x18a4a0, 0xe5484d, 0xf5a524][(row * 5 + i) % 5];
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.6, 8), lam(c));
        body.position.set(-5.0 + i * 2.5, y + 0.45, z);
        grp.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), lam(0xe8b98a));
        head.position.set(-5.0 + i * 2.5, y + 0.9, z);
        grp.add(head);

        /* front row, middle: THIS one is the child's grown-up. When the child
           asks "can I see my grown-up?", they stand up and wave back. */
        if (row === 0 && i === 2) {
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.5, 6), lam(0xe8b98a));
          arm.position.set(0, -0.2, 0);
          const armPivot = new THREE.Group();
          armPivot.position.set(-5.0 + i * 2.5 + 0.26, y + 0.72, z);
          armPivot.add(arm);
          grp.add(armPivot);
          const tag = nameTag('👋', 'rgba(255,245,200,0.96)');
          tag.position.set(-5.0 + i * 2.5, y + 1.7, z);
          tag.visible = false;
          grp.add(tag);
          F.grownUp = { body: body, head: head, arm: armPivot, tag: tag,
                        baseY: y + 0.45, headY: y + 0.9, wave: 0, t: 0,
                        at: { x: -5.0 + i * 2.5, y: y + 1.2, z: z } };
        }
      }
    }
    scene.add(grp);
  }

  /* the grown-up in the stands stands up and waves for `secs` seconds */
  F.waveFromStands = function (secs) {
    if (!F.grownUp) return null;
    F.grownUp.wave = Math.max(0.1, secs || 6);
    F.grownUp.tag.visible = true;
    return F.grownUp.at;
  };

  /* ══════════════════════════════════════════════════ dugout & the gear */
  function buildDugout() {
    /* A real park dugout: a metal frame with chain-link, so you can see
       straight through it. Nothing that walks behind it — a teammate, a coach,
       Nilu — can ever be lost to the child. Deliberately NOT a camera blocker
       either: there is nothing to hide behind. */
    const d = L.dugout, grp = new THREE.Group();
    const W = 9.6, DPT = 3.4, H = 2.4;

    /* uprights: four corners plus two in the middle of the back */
    for (const s of [-1, -0.33, 0.33, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, H, 8), M.metalDark);
      p.position.set(d.x + s * (W / 2), H / 2, d.z - DPT / 2);
      grp.add(p);
    }
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, H, 8), M.metalDark);
      p.position.set(d.x + s * (W / 2), H / 2, d.z + DPT / 2);
      grp.add(p);
    }
    /* the fencing: back and both ends. The front stays open — that's the way in. */
    grp.add(meshPanel(d.x, H / 2, d.z - DPT / 2, W, H));
    for (const s of [-1, 1]) {
      grp.add(meshPanel(d.x + s * (W / 2), H / 2, d.z, DPT, H, Math.PI / 2));
    }
    /* top rails, and a shade roof you can also see through */
    for (const zz of [d.z - DPT / 2, d.z + DPT / 2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.1, 0.1), M.metal);
      rail.position.set(d.x, H, zz); grp.add(rail);
    }
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, DPT), M.metal);
      rail.position.set(d.x + s * (W / 2), H, d.z); grp.add(rail);
    }
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, DPT),
      new THREE.MeshBasicMaterial({ color: 0x9fd0ee, transparent: true, opacity: 0.3,
                                    side: THREE.DoubleSide, depthWrite: false, fog: false }));
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(d.x, H + 0.06, d.z);
    grp.add(roof);
    /* the bench you sit on during a break */
    const seat = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.2, 0.85), M.wood);
    seat.position.set(d.x, 0.62, d.z - 0.5);
    grp.add(seat);
    const rest = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.75, 0.16), M.wood);
    rest.position.set(d.x, 1.05, d.z - 0.92);
    grp.add(rest);
    for (const s of [-1, 0, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.7), M.woodDark);
      leg.position.set(d.x + s * 3.6, 0.31, d.z - 0.5);
      grp.add(leg);
    }
    scene.add(grp);

    /* bat + helmet rack */
    const r = L.rack;
    const rk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.5), M.woodDark);
    rk.position.set(r.x, 1.15, r.z); scene.add(rk);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), M.woodDark);
      p.position.set(r.x + s * 1.2, 0.6, r.z); scene.add(p);
    }
    props.bat = [];
    for (let i = 0; i < 4; i++) {
      const b = makeBat();
      b.position.set(r.x - 0.9 + i * 0.6, 0.62, r.z - 0.12);
      b.rotation.x = 0.18;
      scene.add(b);
      props.bat.push(b);
    }
    props.helmet = [];
    for (let i = 0; i < 3; i++) {
      const h = makeHelmet();
      h.position.set(r.x - 0.8 + i * 0.8, 1.36, r.z);
      scene.add(h);
      props.helmet.push(h);
    }
    const mask = makeMask();
    mask.position.set(r.x + 1.05, 1.34, r.z + 0.15);
    scene.add(mask);
    props.mask = mask;

    /* the equipment bag: balls, gloves, cleats */
    const g = L.bag;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.95), lam(0x2f4a6b));
    bag.position.set(g.x, 0.42, g.z); scene.add(bag);
    const bagTop = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 2.2, 12, 1, false, 0, Math.PI), lam(0x3b5c82));
    bagTop.rotation.z = Math.PI / 2; bagTop.position.set(g.x, 0.85, g.z); scene.add(bagTop);
    props.ballPile = [];
    for (let i = 0; i < 5; i++) {
      const b = makeBall(0.16);
      b.position.set(g.x - 1.5 + (i % 3) * 0.36, 0.16, g.z + 0.7 + Math.floor(i / 3) * 0.36);
      scene.add(b);
      props.ballPile.push(b);
    }
    props.glove = makeGlove();
    props.glove.position.set(g.x + 1.5, 0.16, g.z + 0.5);
    props.glove.rotation.x = -Math.PI / 2;
    scene.add(props.glove);
    props.cleats = new THREE.Group();
    for (const s of [-1, 1]) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.5), lam(0x1d1f24));
      sh.position.set(s * 0.16, 0.08, 0);
      props.cleats.add(sh);
      for (let i = 0; i < 4; i++) {
        const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 5), M.metal);
        stud.position.set(s * 0.16 + (i % 2 ? 0.07 : -0.07), -0.01, -0.16 + Math.floor(i / 2) * 0.3);
        props.cleats.add(stud);
      }
    }
    props.cleats.position.set(g.x + 1.5, 0, g.z - 0.6);
    scene.add(props.cleats);

    /* water cooler */
    const w = L.water;
    const cool = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.0, 14), lam(0xe5484d));
    cool.position.set(w.x, 0.5, w.z); scene.add(cool);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 14), lam(0xf7f7f2));
    lid.position.set(w.x, 1.06, w.z); scene.add(lid);
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.5, 10), new THREE.MeshLambertMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.85 }));
    bottle.position.set(w.x + 0.7, 0.25, w.z + 0.2); scene.add(bottle);
    props.water = bottle;

    /* the batting tee, waiting at the plate */
    props.tee = makeTee();
    props.tee.position.set(L.tee.x, 0, L.tee.z);
    scene.add(props.tee);
  }

  const props = F.props = {};

  /* ═══════════════════════════════════════════════════ the gear, modelled */
  function makeBall(r) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.SphereGeometry(r || 0.15, 14, 12), M.ball);
    g.add(b);
    for (const s of [-1, 1]) {
      const seam = new THREE.Mesh(new THREE.TorusGeometry((r || 0.15) * 0.82, (r || 0.15) * 0.055, 6, 20, Math.PI), M.seam);
      seam.rotation.y = Math.PI / 2;
      seam.position.x = s * (r || 0.15) * 0.38;
      seam.rotation.z = s > 0 ? 0 : Math.PI;
      g.add(seam);
    }
    return g;
  }
  F.makeBall = makeBall;

  function makeBat() {
    const g = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.72, 10), lam(0xd9a066));
    barrel.position.y = 0.36; g.add(barrel);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.42, 8), lam(0x2f3238));
    handle.position.y = -0.14; g.add(handle);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 8), lam(0x2f3238));
    knob.position.y = -0.36; g.add(knob);
    return g;
  }
  F.makeBat = makeBat;

  function makeHelmet() {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), lam(0x2f6fb5));
    g.add(dome);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 14, 1, false, -Math.PI / 2, Math.PI), lam(0x1d4b7d));
    brim.position.set(0, -0.02, 0.09); g.add(brim);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lam(0x2f6fb5));
      ear.scale.set(0.55, 1, 1); ear.position.set(s * 0.27, -0.11, 0); g.add(ear);
    }
    return g;
  }
  F.makeHelmet = makeHelmet;

  function makeMask() {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 16), M.metalDark);
    g.add(frame);
    for (let i = -2; i <= 2; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.46, 5), M.metalDark);
      bar.position.y = i * 0.1; bar.rotation.z = Math.PI / 2; g.add(bar);
    }
    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 6, 16), lam(0x2f3238));
    pad.position.z = -0.05; g.add(pad);
    return g;
  }
  F.makeMask = makeMask;

  function makeGlove() {
    const g = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), lam(0x8a5a30));
    palm.scale.set(1, 1.15, 0.5); g.add(palm);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 6), lam(0x94623a));
      f.position.set(-0.11 + i * 0.075, 0.26, 0);
      g.add(f);
    }
    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6), lam(0x94623a));
    thumb.position.set(-0.2, 0.1, 0); thumb.rotation.z = 0.7; g.add(thumb);
    const web = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.03), lam(0x6f4522));
    web.position.set(-0.14, 0.22, 0.01); g.add(web);
    return g;
  }
  F.makeGlove = makeGlove;

  function makeTee() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.11, 16), lam(0x1f2937));
    base.position.y = 0.055; g.add(base);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.72, 10), lam(0x2f6fb5));
    stem.position.y = 0.46; g.add(stem);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.16, 10), lam(0xf5a524));
    cup.position.y = 0.88; g.add(cup);
    const ball = makeBall(0.15);
    ball.position.y = 1.06;
    g.add(ball);
    g.userData.ball = ball;
    g.userData.cup = cup;
    return g;
  }

  /* ══════════════════════════════════════════════════════════ name tags */
  function nameTag(text, color) {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = color || 'rgba(255,255,255,0.94)';
    const r = 22;
    g.beginPath();
    g.moveTo(r, 6); g.lineTo(314 - r, 6); g.quadraticCurveTo(314, 6, 314, 6 + r);
    g.lineTo(314, 84 - r); g.quadraticCurveTo(314, 84, 314 - r, 84);
    g.lineTo(r, 84); g.quadraticCurveTo(6, 84, 6, 84 - r);
    g.lineTo(6, 6 + r); g.quadraticCurveTo(6, 6, r, 6);
    g.fill();
    g.fillStyle = '#25324a';
    g.font = 'bold 44px "Comic Sans MS", "Chalkboard SE", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(text).slice(0, 16), 160, 47);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false, fog: false }));
    s.scale.set(2.05, 0.62, 1);
    s.renderOrder = 900;
    return s;
  }
  F.nameTag = nameTag;

  /* ══════════════════════════════════════════════════════════ the people
     One rig for coaches, teammates and the player. `hand` is 'R' or 'L' and
     decides which side wears the glove and which arm throws. */
  function makePerson(o) {
    o = o || {};
    const tall = o.tall || 1;                 // 1 = child, 1.32 = grown-up coach
    const skin = lam(o.skin || 0xf3caa4);
    const shirt = lam(o.shirt || 0x7ec8f7);
    const pants = lam(o.pants || 0x53507e);
    const shoes = lam(o.shoes || 0x1d1f24);
    const capC = lam(o.cap != null ? o.cap : 0xe05a5a);
    const hairC = lam(o.hair || 0x4a3527);

    const outer = new THREE.Group();
    const lean = new THREE.Group();
    outer.add(lean);
    outer.scale.setScalar(tall);

    const legL = new THREE.Group(), legR = new THREE.Group();
    [[-0.13, legL], [0.13, legR]].forEach((pair) => {
      const pv = pair[1];
      pv.position.set(pair[0], 0.58, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.088, 0.44, 8), pants);
      thigh.position.y = -0.22; pv.add(thigh);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.11, 0.3), shoes);
      shoe.position.set(0, -0.475, 0.05); pv.add(shoe);
      lean.add(pv);
    });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.46, 12), shirt);
    torso.position.y = 0.81; lean.add(torso);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10), shirt);
    chest.scale.set(1, 0.8, 0.9); chest.position.y = 1.0; lean.add(chest);

    /* jersey number, so teammates read as teammates */
    if (o.number) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g2 = c.getContext('2d');
      g2.fillStyle = 'rgba(255,255,255,0.92)';
      g2.font = 'bold 52px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillText(String(o.number), 32, 34);
      const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
      num.scale.set(0.3, 0.3, 1); num.position.set(0, 0.92, -0.22);
      lean.add(num);
    }

    const armL = new THREE.Group(), armR = new THREE.Group();
    const hands = {};
    [[-0.235, armL, 'L'], [0.235, armR, 'R']].forEach((pair) => {
      const pv = pair[1];
      pv.position.set(pair[0], 1.0, 0);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.4, 8), shirt);
      arm.position.y = -0.2; pv.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), skin);
      hand.position.y = -0.42; pv.add(hand);
      hands[pair[2]] = { pivot: pv, hand: hand };
      lean.add(pv);
    });

    const headG = new THREE.Group();
    headG.position.set(0, 1.16, 0);
    lean.add(headG);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.235, 18, 14), skin);
    head.position.y = 0.12; headG.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.243, 16, 12), hairC);
    hair.scale.set(1, 0.92, 1); hair.position.set(0, 0.135, -0.02); headG.add(hair);
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.white);
      w.position.set(0.082 * s, 0.14, 0.196); headG.add(w);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 6), M.dark);
      p.position.set(0.082 * s, 0.142, 0.228); headG.add(p);
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), M.pink);
      cheek.scale.set(1, 0.7, 0.5); cheek.position.set(0.148 * s, 0.075, 0.176); headG.add(cheek);
    }
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.013, 6, 12, Math.PI), M.dark);
    smile.position.set(0, 0.075, 0.212); smile.rotation.z = Math.PI; headG.add(smile);

    /* ball cap */
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.248, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), capC);
    crown.position.y = 0.14; headG.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.042, 14, 1, false, -Math.PI / 2, Math.PI), capC);
    brim.position.set(0, 0.145, 0.055); headG.add(brim);

    /* the glove goes on the NON-throwing hand */
    const hand = (o.hand === 'L') ? 'L' : 'R';
    const gloveSide = hand === 'R' ? 'L' : 'R';
    let glove = null;
    if (o.glove !== false) {
      glove = makeGlove();
      glove.scale.setScalar(0.9);
      glove.position.set(0, -0.54, 0.04);
      glove.rotation.x = -0.5;
      hands[gloveSide].pivot.add(glove);
    }

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.52 * tall, 20),
      new THREE.MeshBasicMaterial({ map: F.shadowTexture(), transparent: true, depthWrite: false, opacity: 0.75, fog: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;

    let tag = null;
    const setTag = (name) => {
      if (tag) { outer.remove(tag); tag = null; }
      if (!name) return;
      tag = nameTag(name, o.tagColor);
      tag.position.set(0, 2.15, 0);
      outer.add(tag);
    };
    setTag(o.name);

    const P = {
      group: outer, lean: lean, legL: legL, legR: legR, armL: armL, armR: armR,
      headG: headG, hands: hands, glove: glove, shadow: shadow, tag: tag,
      hand: hand, gloveSide: gloveSide,
      x: 0, z: 0, ry: 0, phase: Math.random() * 6, moveAmt: 0, tall: tall,
      target: null, speed: o.speed || 3.0, idle: Math.random() * 6,
      sitting: false, handUp: 0, pose: null,
    };
    P.setName = (name) => { setTag(name); P.tag = tag; P.name = name; };
    P.place = (x, z, ry) => {
      P.x = x; P.z = z;
      if (typeof ry === 'number') P.ry = ry;
      outer.position.set(x, 0, z);
      outer.rotation.y = P.ry;
      shadow.position.set(x, 0.03, z);
    };
    P.goTo = (x, z, done) => {
      /* never send anyone to a spot inside a wall — they'd grind against it
         forever and never fire their arrival callback */
      let t = { x: x, z: z };
      try { t = F.freeSpot(x, z, 0.45); } catch (e) {}
      P.target = { x: t.x, z: t.z, done: done, t: 0, last: null };
    };
    P.stop = () => { P.target = null; };
    P.lookAt = (x, z) => { P.ry = Math.atan2(x - P.x, z - P.z); };
    P.place(0, 0, 0);
    return P;
  }
  F.makePerson = makePerson;

  /* HOW FAR AWAY A NAME TAG IS STILL WORTH SHOWING
     Tags draw over the whole world, which is what makes people findable — but
     on a phone eight of them at once is most of the screen. So they fade out
     with distance, and by how much room there is. Coaches stay readable from
     further off because "walk to Coach Scott" needs to be answerable; Nilu is
     never hidden at any range. */
  F.tagRange = function (kind) {
    const small = (typeof innerWidth === 'number' && innerWidth < 760);
    if (kind === 'coach') return small ? 17 : 26;
    return small ? 6.5 : 11;                       // teammates and everyone else
  };

  /* one shared animation step for every NPC (the player has its own in walk.js) */
  function personTick(P, dt) {
    let want = 0;
    if (P.target) {
      const dx = P.target.x - P.x, dz = P.target.z - P.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.18) {
        const cb = P.target.done;
        P.target = null;
        if (cb) { try { cb(); } catch (e) {} }
      } else if (unstick(P, d, dt, () => {
        const cb = P.target.done; P.target = null;
        if (cb) { try { cb(); } catch (e) {} }
      })) {
        /* rescued */
      } else {
        const sp = P.speed;
        P.x += (dx / d) * sp * dt;
        P.z += (dz / d) * sp * dt;
        want = 1;
        P.phase += sp * dt * 3.2;
        let a = Math.atan2(dx, dz) - P.ry;
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        P.ry += a * Math.min(1, dt * 10);
      }
    }
    P.moveAmt += (want - P.moveAmt) * Math.min(1, dt * 8);
    P.idle += dt;

    /* only show this person's name when they're near enough to matter */
    if (P.tag) {
      let me = null;
      try { me = window.SWalk && SWalk.pos; } catch (e) {}
      if (me) P.tag.visible = Math.hypot(P.x - me.x, P.z - me.z) < F.tagRange(P.tagKind);
    }

    const bob = Math.abs(Math.sin(P.phase)) * 0.035 * P.moveAmt
              + Math.sin(P.idle * 1.4) * 0.012 * (1 - P.moveAmt);
    const sit = P.sitting ? -0.42 : 0;
    P.group.position.set(P.x, sit + bob, P.z);
    P.group.rotation.y = P.ry;
    P.shadow.position.set(P.x, 0.03, P.z);
    P.shadow.material.opacity = 0.75 - P.moveAmt * 0.12;

    if (P.pose) { P.pose(P, dt); return; }

    const sw = Math.sin(P.phase) * P.moveAmt;
    P.lean.rotation.x = P.sitting ? 0.1 : P.moveAmt * 0.07;
    P.legL.rotation.x = P.sitting ? -1.3 : sw * 0.6;
    P.legR.rotation.x = P.sitting ? -1.3 : -sw * 0.6;
    /* a raised hand overrides the arm swing — this is the break signal */
    const up = P.handUp;
    const throwArm = P.hand === 'R' ? P.armR : P.armL;
    const otherArm = P.hand === 'R' ? P.armL : P.armR;
    throwArm.rotation.x = (-sw * 0.5) * (1 - up) + (-Math.PI * 0.92) * up;
    throwArm.rotation.z = 0;
    otherArm.rotation.x = (sw * 0.5) * (1 - up) + 0.1 * up;
    P.headG.rotation.z = Math.sin(P.phase) * 0.05 * P.moveAmt;
    P.headG.rotation.x = 0;
  }
  F.personTick = personTick;

  /* Poses a person can hold instead of the walk cycle. Assign with
     `p.pose = SBField.poses.kneel` and clear with `p.pose = null`. */
  F.poses = {
    /* down on one knee, at a child's eye level — how you actually talk to a kid */
    kneel(P) {
      P.group.position.y -= 0.36;
      P.lean.rotation.x = 0.14;
      P.legL.rotation.x = -1.45; P.legR.rotation.x = -0.3;
      P.armL.rotation.x = 0.4; P.armL.rotation.z = 0;
      P.armR.rotation.x = 0.4; P.armR.rotation.z = 0;
      P.headG.rotation.x = 0.1; P.headG.rotation.z = 0;
    },
    /* arm out, pointing where the child should go */
    point(P, dt, dir) {
      const arm = P.hand === 'R' ? P.armR : P.armL;
      const oth = P.hand === 'R' ? P.armL : P.armR;
      P.lean.rotation.x = 0;
      P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      arm.rotation.x = -1.42; arm.rotation.z = 0;
      oth.rotation.x = 0.1; oth.rotation.z = 0;
      P.headG.rotation.x = 0; P.headG.rotation.z = 0;
    },
    /* both arms up: the universal "everybody line up / eyes here" */
    callOver(P, dt, clock) {
      const w = Math.sin((clock || 0) * 5) * 0.22;
      P.lean.rotation.x = 0;
      P.legL.rotation.x = 0; P.legR.rotation.x = 0;
      P.armL.rotation.x = -2.5 + w; P.armL.rotation.z = 0;
      P.armR.rotation.x = -2.5 - w; P.armR.rotation.z = 0;
      P.headG.rotation.x = 0; P.headG.rotation.z = 0;
    },
  };

  /* ══════════════════════════════════════════════════════════════ Nilu */
  function buildNilu() {
    const g = new THREE.Group();
    const blue = M.blue, blueLight = M.blueLight, pink = M.pink;
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.05, 24, 18), blue);
    body.scale.set(1, 1.05, 0.95); body.position.y = 1.0; g.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.78, 18, 14), blueLight);
    belly.scale.set(0.9, 0.85, 0.8); belly.position.set(0, 0.85, 0.42); g.add(belly);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 18), blue);
    head.position.set(0, 2.15, 0.25); g.add(head);

    const earGeo = new THREE.CircleGeometry(1.15, 28);
    const earBlue = new THREE.MeshLambertMaterial({ color: 0x6db9f2, side: THREE.DoubleSide });
    const earL = new THREE.Group(), earR = new THREE.Group();
    const eL = new THREE.Mesh(earGeo, earBlue); eL.scale.set(0.8, 1.2, 1); eL.position.x = -1.05;
    const eLi = new THREE.Mesh(new THREE.CircleGeometry(0.85, 28), pink);
    eLi.scale.set(0.75, 1.12, 1); eLi.position.set(-1.05, 0, 0.035);
    earL.add(eL, eLi); earL.position.set(-0.45, 2.35, 0.15); earL.rotation.y = 0.35;
    const eR = eL.clone(); eR.position.x = 1.05;
    const eRi = eLi.clone(); eRi.position.x = 1.05;
    earR.add(eR, eRi); earR.position.set(0.45, 2.35, 0.15); earR.rotation.y = -0.35;
    g.add(earL, earR);

    const trunkG = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.15, 10), blue);
    trunk.position.y = -0.55; trunkG.add(trunk);
    trunkG.position.set(0, 2.1, 0.95); trunkG.rotation.x = 0.5; g.add(trunkG);

    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), M.white);
      w.position.set(0.3 * s, 2.35, 0.86); g.add(w);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), M.dark);
      p.position.set(0.3 * s, 2.36, 0.97); g.add(p);
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), pink);
      cheek.scale.set(1, 0.7, 0.5); cheek.position.set(0.5 * s, 2.1, 0.82); g.add(cheek);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.6, 10), blue);
      leg.position.set(0.5 * s, 0.3, 0.55); leg.rotation.x = 0.5; g.add(leg);
    }
    /* Nilu came to practice in a ball cap, of course */
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), lam(0xe05a5a));
    crown.position.set(0, 2.5, 0.22); g.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.08, 14, 1, false, -Math.PI / 2, Math.PI), lam(0xe05a5a));
    brim.position.set(0, 2.52, 0.42); g.add(brim);

    /* Nilu is modelled at "meadow" scale (~3.2 tall); on a ballpark next to
       1.5-tall kids that reads as a monument. Bring her down to buddy size:
       a little shorter than a coach, a little taller than the child. */
    g.scale.setScalar(0.56);

    /* NILU CAN NEVER BE HIDDEN. She is the child's way of knowing where to go;
       if she ends up behind the dugout roof the game feels broken. Her tag
       draws over the whole world, exactly like the coaches' — so wherever she
       is, you can see her. */
    const tag = nameTag('🐘 Nilu', 'rgba(214,240,255,0.96)');
    tag.scale.set(1.9, 0.58, 1);
    tag.renderOrder = 950;
    scene.add(tag);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.78, 22),
      new THREE.MeshBasicMaterial({ map: F.shadowTexture(), transparent: true, depthWrite: false, opacity: 0.6, fog: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.028;
    scene.add(shadow);

    return {
      group: g, earL: earL, earR: earR, trunk: trunkG, shadow: shadow, tag: tag,
      pose: null,
      x: 0, z: 0, ry: 0, target: null, phase: 0, moveAmt: 0, speed: 4.6, bounce: 0,
      place(x, z, ry) {
        this.x = x; this.z = z;
        if (typeof ry === 'number') this.ry = ry;
        g.position.set(x, 0, z); g.rotation.y = this.ry;
        shadow.position.set(x, 0.028, z);
      },
      goTo(x, z, done) {
        let t = { x: x, z: z };
        try { t = F.freeSpot(x, z, 0.95); } catch (e) {}
        this.target = { x: t.x, z: t.z, done: done, t: 0, last: null };
      },
      lookAt(x, z) { this.ry = Math.atan2(x - this.x, z - this.z); },
    };
  }

  /* Poses Nilu can hold. Her rig is an elephant's — no shoulders to swing —
     so "stretching" for her is a trunk swing, big ear flaps and a bounce. */
  F.niluPoses = {
    stretch(N, dt, t) {
      N.trunk.rotation.x = 0.5 + Math.sin(t * 3.1) * 0.95;
      N.earL.rotation.y = 0.35 + Math.sin(t * 4.2) * 0.55;
      N.earR.rotation.y = -0.35 - Math.sin(t * 4.2) * 0.55;
      N.group.position.y = Math.abs(Math.sin(t * 3.1)) * 0.34;
    },
    cheer(N, dt, t) {
      N.trunk.rotation.x = -0.5 + Math.sin(t * 6) * 0.3;
      N.earL.rotation.y = 0.35 + Math.abs(Math.sin(t * 6)) * 0.7;
      N.earR.rotation.y = -0.35 - Math.abs(Math.sin(t * 6)) * 0.7;
      N.group.position.y = Math.abs(Math.sin(t * 5)) * 0.5;
    },
  };

  /* If someone stops making progress towards where they're going — caught on
     a corner, boxed in by furniture — put them there and fire the callback.
     Nilu wedged behind the dugout bench is exactly the failure this closes:
     a child looking for her would have waited forever. */
  function unstick(P, d, dt, arrive) {
    if (P.target.last == null || d < P.target.last - 0.04) {
      P.target.last = d; P.target.t = 0;
      return false;
    }
    P.target.t += dt;
    if (P.target.t < 3.5) return false;
    let q = { x: P.target.x, z: P.target.z };
    try { q = F.freeSpot(P.target.x, P.target.z, 0.9); } catch (e) {}
    P.x = q.x; P.z = q.z;
    arrive();
    return true;
  }

  function niluTick(N, dt) {
    let want = 0;
    if (N.target) {
      const dx = N.target.x - N.x, dz = N.target.z - N.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.3) {
        const cb = N.target.done; N.target = null;
        if (cb) { try { cb(); } catch (e) {} }
      } else if (unstick(N, d, dt, () => {
        const cb = N.target.done; N.target = null;
        if (cb) { try { cb(); } catch (e) {} }
      })) {
        /* rescued — nothing more to do this frame */
      } else {
        N.x += (dx / d) * N.speed * dt;
        N.z += (dz / d) * N.speed * dt;
        want = 1;
        N.phase += N.speed * dt * 2.4;
        let a = Math.atan2(dx, dz) - N.ry;
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        N.ry += a * Math.min(1, dt * 9);
      }
    }
    N.moveAmt += (want - N.moveAmt) * Math.min(1, dt * 7);
    N.bounce += dt;
    /* she is solid-aware too, so she never ends up standing inside the dugout */
    try { F.collide(N, 0.85); } catch (e) {}
    const hop = Math.abs(Math.sin(N.phase)) * 0.14 * N.moveAmt
              + Math.sin(N.bounce * 1.6) * 0.05 * (1 - N.moveAmt);
    N.group.position.set(N.x, hop, N.z);
    N.group.rotation.y = N.ry;
    N.shadow.position.set(N.x, 0.028, N.z);
    N.shadow.material.opacity = 0.6 - hop * 0.8;
    if (N.pose) {
      N.poseT = (N.poseT || 0) + dt;
      try { N.pose(N, dt, N.poseT); } catch (e) {}
    } else {
      N.poseT = 0;
      const flap = Math.sin(N.bounce * 2.2) * 0.18 + N.moveAmt * 0.2;
      N.earL.rotation.y = 0.35 + flap;
      N.earR.rotation.y = -0.35 - flap;
      N.trunk.rotation.x = 0.5 + Math.sin(N.bounce * 1.1) * 0.16;
    }
    /* the tag rides above her, drawn over everything */
    if (N.tag) N.tag.position.set(N.x, 2.35 + N.group.position.y, N.z);
  }

  /* ═════════════════════════════════════════════════════════════ build */
  F.init = function (o) {
    THREE = o.THREE || window.THREE;
    scene = o.scene;
    if (!THREE || !scene) return false;

    buildMaterials();
    scene.fog = new THREE.Fog(0xcfe4f2, 70, 168);

    /* a bright but not blown-out afternoon: one warm sun, one sky bounce */
    scene.add(new THREE.HemisphereLight(0xbcdcf5, 0x3c6b35, 0.55));
    const sun = new THREE.DirectionalLight(0xfff0cc, 0.55);
    sun.position.set(28, 46, 22);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));

    buildSky();
    buildGround();
    buildFence();
    buildBackstop();
    buildBleachers();
    buildDugout();
    buildSolids();

    /* Nilu */
    F.nilu = buildNilu();
    scene.add(F.nilu.group);
    F.nilu.place(2.4, 4.6, Math.PI);

    /* the three coaches, each at their station */
    const CN = (window.SBContent && SBContent.coaches) || [];
    F.coaches = {};
    const stations = { aj: L.ajIdle, scott: L.scottIdle, sam: L.samIdle };
    for (const c of CN) {
      const p = makePerson({
        tall: 1.32, shirt: c.shirt, cap: c.cap, skin: c.skin, hair: c.hair,
        pants: 0x39404d, name: c.name, tagColor: 'rgba(255,255,255,0.95)', speed: 3.4,
      });
      scene.add(p.group); scene.add(p.shadow);
      const at = stations[c.id] || L.lineUpCoach;
      p.place(at.x, at.z, 0);
      p.lookAt(L.home.x, L.home.z);
      p.home = { x: at.x, z: at.z };
      p.info = c;
      p.tagKind = 'coach';
      F.coaches[c.id] = p;
      people.push(p);
    }
    if (F.coaches.sam) F.coaches.sam.lookAt(L.circle.x, L.circle.z);

    /* Four teammates. Who they ARE is decided per session by castMates()
       once the child's own name is known — see SBLevels.castTeammates. */
    const LOOKS = (window.SBContent && SBContent.mateLooks) || [];
    F.mates = [];
    LOOKS.forEach((m, i) => {
      const p = makePerson({
        shirt: m.shirt, cap: m.cap, skin: m.skin, hair: m.hair,
        pants: 0x53507e, name: '', number: i + 2, speed: 3.2,
      });
      scene.add(p.group); scene.add(p.shadow);
      p.place(L.dugout.x - 3 + i * 2.1, L.dugout.z + 1.3, Math.PI);
      p.home = { x: p.x, z: p.z };
      p.info = { name: '' };
      F.mates.push(p);
      people.push(p);
    });

    return true;
  };

  const people = [];
  F.people = people;

  /* Cast today's teammates. `names` is an array of strings; anything past the
     fourth is ignored, and a blank name simply hides that child's tag. */
  F.castMates = function (names) {
    if (!F.mates) return [];
    const out = [];
    F.mates.forEach((p, i) => {
      const n = (names && names[i]) || '';
      p.setName(n);
      p.info = { name: n };
      out.push(n);
    });
    return out;
  };

  F.tick = function (dt) {
    clock += dt;
    for (let i = 0; i < people.length; i++) {
      try { personTick(people[i], dt); } catch (e) {}
    }
    if (F.nilu) { try { niluTick(F.nilu, dt); } catch (e) {} }
    /* the ball on the tee breathes a little so it reads as "waiting for you" */
    if (props.tee && props.tee.userData.ball) {
      props.tee.userData.ball.rotation.y = clock * 0.6;
    }
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.s.position.x += c.sp * dt;
      if (c.s.position.x > 150) c.s.position.x = -150;
    }
    /* the grown-up in the stands: stand up, wave, sit back down */
    const gu = F.grownUp;
    if (gu) {
      if (gu.wave > 0) {
        gu.wave -= dt; gu.t += dt;
        const up = 0.42;
        gu.body.position.y = gu.baseY + up;
        gu.head.position.y = gu.headY + up;
        gu.arm.rotation.z = -2.1 + Math.sin(gu.t * 7) * 0.5;
        gu.tag.visible = true;
        gu.tag.position.y = gu.headY + up + 0.8 + Math.sin(gu.t * 2.4) * 0.08;
        if (gu.wave <= 0) {
          gu.body.position.y = gu.baseY;
          gu.head.position.y = gu.headY;
          gu.arm.rotation.z = 0;
          gu.tag.visible = false;
        }
      }
    }
  };

  /* ══════════════════════════════════════════════════════════ SOLID THINGS
     Barriers you cannot walk through. Registered as circles, boxes or arcs,
     and resolved every frame in walk.js: the child is pushed back out of
     anything they overlap, so the fence is a fence and the dugout wall is a
     wall. Nothing here can trap them — every push is straight out along the
     shortest way, so they always slide along a surface rather than sticking. */
  const solids = F.solids = [];
  const solidCircle = (x, z, r) => { solids.push({ k: 'c', x: x, z: z, r: r }); };
  const solidBox = (x, z, hw, hd) => { solids.push({ k: 'b', x: x, z: z, hw: hw, hd: hd }); };
  /* an arc barrier centred on `c`: `inside` true keeps the child within radius
     r, false keeps them outside it. `half` is the half-angle around `face`. */
  const solidArc = (cx, cz, r, face, half, inside) =>
    solids.push({ k: 'a', x: cx, z: cz, r: r, face: face, half: half, inside: inside });

  function buildSolids() {
    /* the outfield fence — you stay on the field */
    solidArc(L.home.x, L.home.z, L.fenceR - 0.9, Math.PI, Math.PI / 4 + 0.06, true);
    /* the backstop behind home — you can walk around it, not through it */
    solidArc(L.home.x, L.home.z, 9.5 - 0.5, 0, Math.PI * 0.22 + 0.03, true);
    /* foul poles */
    for (const s of [-1, 1]) {
      solidCircle(s * Math.sin(Math.PI / 4) * L.fenceR, -Math.cos(Math.PI / 4) * L.fenceR, 0.6);
    }
    /* the dugout: the back wall and its posts are solid — the bench is NOT,
       because sitting on it during a break is the whole point */
    solidBox(L.dugout.x, L.dugout.z - 1.7, 4.9, 0.25);   // the back fence line
    for (const s of [-1, 1]) solidCircle(L.dugout.x + s * 4.8, L.dugout.z + 1.7, 0.3);
    /* the seats */
    solidBox(0, 15.4, 6.8, 2.6);
    /* the gear you'd trip over */
    solidBox(L.rack.x, L.rack.z, 1.5, 0.45);          // bat + helmet rack
    solidBox(L.bag.x, L.bag.z, 1.2, 0.6);             // equipment bag
    solidCircle(L.water.x, L.water.z, 0.7);           // water cooler
    solidCircle(L.tee.x, L.tee.z, 0.55);              // the batting tee
  }

  /* Push a point out of every solid it overlaps. `pr` is the child's own
     radius. Returns true if anything moved them. */
  F.collide = function (p, pr) {
    pr = pr || 0.34;
    let hit = false;
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (s.k === 'c') {
        const dx = p.x - s.x, dz = p.z - s.z;
        const d = Math.hypot(dx, dz), need = s.r + pr;
        if (d < need) {
          /* dead centre has no direction to push along — pick one rather than
             leaving them standing inside the water cooler */
          if (d < 0.0001) { p.x = s.x; p.z = s.z + need; }
          else { p.x = s.x + (dx / d) * need; p.z = s.z + (dz / d) * need; }
          hit = true;
        }
      } else if (s.k === 'b') {
        const dx = p.x - s.x, dz = p.z - s.z;
        const ox = s.hw + pr - Math.abs(dx), oz = s.hd + pr - Math.abs(dz);
        if (ox > 0 && oz > 0) {
          /* out along whichever wall is nearest — this is what lets a child
             slide along a wall instead of catching on it */
          if (ox < oz) p.x = s.x + Math.sign(dx || 1) * (s.hw + pr);
          else p.z = s.z + Math.sign(dz || 1) * (s.hd + pr);
          hit = true;
        }
      } else {
        const dx = p.x - s.x, dz = p.z - s.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.0001) continue;    // dead centre of an arc is always the open side
        /* angle measured from the arc's facing direction */
        let a = Math.atan2(dx, dz) - s.face;
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        if (Math.abs(a) > s.half) continue;
        if (s.inside && d > s.r - pr) {
          const k = (s.r - pr) / d; p.x = s.x + dx * k; p.z = s.z + dz * k; hit = true;
        } else if (!s.inside && d < s.r + pr) {
          const k = (s.r + pr) / d; p.x = s.x + dx * k; p.z = s.z + dz * k; hit = true;
        }
      }
    }
    return hit;
  };

  /* The nearest patch of OPEN ground to x,z. F.collide only shoves a point out
     of whatever it overlaps, which can land it on the wrong side of a wall —
     behind the dugout instead of in front of it. This searches outward until
     it finds somewhere genuinely clear, so nobody is ever parked inside the
     furniture. */
  F.freeSpot = function (x, z, r) {
    r = r || 0.9;
    const p = { x: x, z: z };
    if (!F.collide(p, r)) return { x: x, z: z };
    for (let ring = 1; ring <= 7; ring++) {
      const rad = ring * 1.3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const q = { x: x + Math.cos(a) * rad, z: z + Math.sin(a) * rad };
        const t = { x: q.x, z: q.z };
        if (!F.collide(t, r)) return q;
      }
    }
    return p;
  };

  /* a soft glowing disc used to say "stand here" / "this is the spot" */
  F.marker = function (x, z, color, r) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry((r || 1.1) * 0.62, r || 1.1, 28),
      new THREE.MeshBasicMaterial({ color: color || 0xffd43b, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.05, z);
    scene.add(m);
    return m;
  };

  /* two little footprints, the "stand here" the coaches actually use */
  F.footprints = function (x, z, ry) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
    for (const s of [-1, 1]) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), mat);
      f.rotation.x = -Math.PI / 2;
      f.scale.set(1, 1.7, 1);
      f.position.set(s * 0.19, 0.045, 0);
      g.add(f);
      const toe = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10), mat);
      toe.rotation.x = -Math.PI / 2;
      toe.position.set(s * 0.19, 0.045, 0.34);
      g.add(toe);
    }
    g.position.set(x, 0, z);
    g.rotation.y = ry || 0;
    scene.add(g);
    return g;
  };

  F.scene = () => scene;
  F.three = () => THREE;
  F.mat = M;

  window.SBField = F;
})();
