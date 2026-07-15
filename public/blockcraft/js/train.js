/* Aaria's Block Craft 3D — the meadow railway 🚂
   Lay track pieces that snap to the grid and auto-connect (straights, curves,
   even crossings). When enough track is down, a REAL little steam locomotive
   pulls in — boiler, brass bands, cowcatcher, spoked driving wheels with
   working side rods, a glowing headlamp, puffing smoke — with an open coach
   behind it. Walk up and tap it to climb aboard! It chuffs along everything
   you built, toots and gently reverses at the end of the line, and never,
   ever crashes. Tracks and trains are saved with the world. */
ABC.train = (function () {
  const $ = (id) => document.getElementById(id);
  let scene = null;
  const pieces = new Map();          // "x,y,z" -> { data:{x,y,z}, group }
  const key = (x, y, z) => x + ',' + y + ',' + z;

  /* ---------- materials (Lambert: auto-upgraded on the Modern skin) ---------- */
  const M = {};
  function mats() {
    if (M.rail) return M;
    M.rail = new THREE.MeshLambertMaterial({ color: 0x9aa3b2 });
    M.railTop = new THREE.MeshLambertMaterial({ color: 0xc9d2e0 });
    M.sleeper = new THREE.MeshLambertMaterial({ color: 0x7a5c40 });
    M.ballast = new THREE.MeshLambertMaterial({ color: 0x8f8a82 });
    M.boiler = new THREE.MeshLambertMaterial({ color: 0x2456a6 });
    M.smokebox = new THREE.MeshLambertMaterial({ color: 0x23272e });
    M.chassis = new THREE.MeshLambertMaterial({ color: 0x2b2f38 });
    M.brass = new THREE.MeshLambertMaterial({ color: 0xd9a62e });
    M.red = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    M.cab = new THREE.MeshLambertMaterial({ color: 0x2f6bc4 });
    M.roof = new THREE.MeshLambertMaterial({ color: 0xa93226 });
    M.wheel = new THREE.MeshLambertMaterial({ color: 0x3a3f47 });
    M.wheelRim = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    M.rod = new THREE.MeshLambertMaterial({ color: 0xb8c2d0 });
    M.wood = new THREE.MeshLambertMaterial({ color: 0xb08954 });
    M.seat = new THREE.MeshLambertMaterial({ color: 0xd45d79 });
    M.dark = new THREE.MeshBasicMaterial({ color: 0x1a1d22 });
    M.lampGlow = new THREE.MeshBasicMaterial({ color: 0xfff2b8 });
    return M;
  }
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const cyl = (r1, r2, h, m, seg) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 16), m);

  function glowSprite(inner, outer, scale) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(scale, scale, 1);
    return s;
  }

  function init(sc) { scene = sc; }

  /* ================================================================
     TRACK PIECES — auto-orienting rails on the voxel grid
     ================================================================ */
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // N E S W (grid dz/dx)
  function neighborDirs(d) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      if (pieces.has(key(d.x + DIRS[i][0], d.y, d.z + DIRS[i][1]))) out.push(i);
    }
    return out;
  }

  /* one straight rail run (two rails + sleepers) along local Z */
  function railRun(g, m) {
    for (const sx of [-0.28, 0.28]) {
      const r = box(0.09, 0.08, 1.0, m.rail); r.position.set(sx, 0.10, 0); g.add(r);
      const rt = box(0.11, 0.025, 1.0, m.railTop); rt.position.set(sx, 0.15, 0); g.add(rt);
    }
    for (let i = -1; i <= 1; i++) {
      const s = box(0.86, 0.06, 0.16, m.sleeper); s.position.set(0, 0.045, i * 0.33); g.add(s);
    }
  }
  /* a quarter-curve: three short runs fanning through the cell corner */
  function railCurve(g, m) {
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const a0 = (i / steps) * Math.PI / 2, a1 = ((i + 1) / steps) * Math.PI / 2;
      const mid = (a0 + a1) / 2;
      const seg = new THREE.Group();
      // arc of radius 0.5 centered on the cell corner (-0.5, -0.5)
      const cx = -0.5 + Math.cos(mid) * 0.5, cz = -0.5 + Math.sin(mid) * 0.5;
      for (const off of [-0.28, 0.28]) {
        const rr = 0.5 + off;
        const r = box(0.09, 0.08, 0.62 * rr / 0.5, m.rail);
        r.position.set(-0.5 + Math.cos(mid) * rr - cx, 0.10, -0.5 + Math.sin(mid) * rr - cz);
        seg.add(r);
        const rt = box(0.11, 0.025, 0.62 * rr / 0.5, m.railTop);
        rt.position.copy(r.position); rt.position.y = 0.15; seg.add(rt);
      }
      const s = box(0.86, 0.06, 0.16, m.sleeper); s.position.y = 0.045; seg.add(s);
      seg.position.set(cx, 0, cz);
      seg.rotation.y = -mid + Math.PI / 2;
      g.add(seg);
    }
  }

  function buildTrackMesh(d) {
    const m = mats();
    const g = new THREE.Group();
    const base = box(0.98, 0.05, 0.98, m.ballast);
    base.position.y = 0.012; g.add(base);
    const nd = neighborDirs(d);
    if (nd.length === 0) {
      const r = new THREE.Group(); railRun(r, m); r.rotation.y = (d.rot || 0) * Math.PI / 2; g.add(r);
    } else if (nd.length === 1) {
      const r = new THREE.Group(); railRun(r, m); r.rotation.y = nd[0] % 2 ? Math.PI / 2 : 0; g.add(r);
    } else if (nd.length === 2 && Math.abs(nd[0] - nd[1]) === 2) {
      const r = new THREE.Group(); railRun(r, m); r.rotation.y = nd[0] % 2 ? Math.PI / 2 : 0; g.add(r);
    } else if (nd.length === 2) {
      // curve joining the two neighbor directions
      const c = new THREE.Group(); railCurve(c, m);
      const pair = nd[0] * 10 + nd[1];
      const rotFor = { 1: 0, 12: 3, 23: 2, 3: 1 };     // N+E, E+S, S+W, N+W
      c.rotation.y = (rotFor[pair] || 0) * Math.PI / 2;
      g.add(c);
    } else {
      // 3-4 neighbors: a crossing — both runs
      const a = new THREE.Group(); railRun(a, m); g.add(a);
      const b = new THREE.Group(); railRun(b, m); b.rotation.y = Math.PI / 2; g.add(b);
    }
    g.position.set(d.x + 0.5, d.y, d.z + 0.5);
    g.traverse((o) => { if (o.isMesh) o.userData.trainRef = { type: 'track', cell: d }; });
    return g;
  }

  function refreshPiece(p) {
    if (p.group) scene.remove(p.group);
    p.group = buildTrackMesh(p.data);
    scene.add(ABC.world.entityShadows ? ABC.world.entityShadows(p.group) : p.group);
  }
  function refreshAround(x, y, z) {
    for (const [dx, dz] of [[0, 0], ...DIRS]) {
      const p = pieces.get(key(x + dx, y, z + dz));
      if (p) refreshPiece(p);
    }
  }

  function place(x, y, z, rot) {
    const k = key(x, y, z);
    if (pieces.has(k)) return false;
    const data = { x, y, z, rot: rot || 0 };
    const p = { data, group: null };
    pieces.set(k, p);
    refreshAround(x, y, z);
    ABC.audio.sfx.pop();
    ABC.saveSoon && ABC.saveSoon();
    if (pieces.size === 1) ABC.ui.toast(ABC.tpl('🛤️ First track! Keep going — your train needs a line to run on!'), 3400, true);
    ensureTrain();
    if (train && !riding) parkTrain();      // re-park: the network changed
    return true;
  }
  function removeAt(cell) {
    const k = key(cell.x, cell.y, cell.z);
    const p = pieces.get(k);
    if (!p) return;
    scene.remove(p.group);
    pieces.delete(k);
    refreshAround(cell.x, cell.y, cell.z);
    ABC.audio.sfx.remove();
    ABC.saveSoon && ABC.saveSoon();
    if (pieces.size < MIN_TRACKS && train && !riding) departTrain();
    else if (train && !riding) parkTrain();
  }

  /* ================================================================
     THE TRAIN — a proper little steam locomotive + open coach
     ================================================================ */
  const MIN_TRACKS = 4;
  let train = null;      // { group, loco:{wheels,rods,lamp,glow,stack}, coach, seatAnchor }
  let smoke = [];        // puff sprites
  let riding = false;
  const R = { cell: null, dir: 1, prog: 0, speed: 0, pauseT: 0, heading: 0, chuffA: 0 };

  function spokedWheel(r, m) {
    const g = new THREE.Group();
    const disc = new THREE.Group();               // the spinning part
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.18, 8, 20), m.wheelRim);
    disc.add(rim);
    const hub = cyl(r * 0.22, r * 0.22, 0.09, m.wheel); hub.rotation.x = Math.PI / 2; disc.add(hub);
    for (let i = 0; i < 6; i++) {
      const sp = box(r * 0.13, r * 1.86, 0.05, m.wheel);
      sp.rotation.z = (i / 6) * Math.PI;
      disc.add(sp);
    }
    const crank = cyl(0.045, 0.045, 0.12, m.brass);
    crank.rotation.x = Math.PI / 2;
    crank.position.set(0, -r * 0.55, 0.05);
    disc.add(crank);
    g.add(disc);
    g.rotation.y = Math.PI / 2;                   // sit sideways on the axle
    g.userData.disc = disc;
    g.userData.crankR = r * 0.55;
    return g;
  }

  function buildLoco() {
    const m = mats();
    const g = new THREE.Group();
    // chassis + cowcatcher
    const ch = box(0.78, 0.16, 2.3, m.chassis); ch.position.y = 0.42; g.add(ch);
    for (const [w, y, z] of [[0.7, 0.3, 1.28], [0.5, 0.22, 1.4], [0.3, 0.14, 1.52]]) {
      const c = box(w, 0.09, 0.24, m.red); c.position.set(0, y, z); c.rotation.x = 0.5; g.add(c);
    }
    // boiler with brass bands + smokebox face
    const boiler = cyl(0.34, 0.34, 1.35, m.boiler, 20);
    boiler.rotation.x = Math.PI / 2; boiler.position.set(0, 0.82, 0.28); g.add(boiler);
    for (const z of [-0.1, 0.28, 0.62]) {
      const band = cyl(0.355, 0.355, 0.05, m.brass, 20);
      band.rotation.x = Math.PI / 2; band.position.set(0, 0.82, z); g.add(band);
    }
    const smokebox = cyl(0.35, 0.35, 0.3, m.smokebox, 20);
    smokebox.rotation.x = Math.PI / 2; smokebox.position.set(0, 0.82, 1.08); g.add(smokebox);
    const door = cyl(0.26, 0.3, 0.06, m.smokebox, 20);
    door.rotation.x = Math.PI / 2; door.position.set(0, 0.82, 1.25); g.add(door);
    // headlamp + warm glow
    const lampBox = box(0.16, 0.2, 0.14, m.brass); lampBox.position.set(0, 1.12, 1.18); g.add(lampBox);
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), M.lampGlow);
    lamp.position.set(0, 1.12, 1.26); g.add(lamp);
    const glow = glowSprite('rgba(255,240,180,0.9)', 'rgba(255,220,120,0)', 1.1);
    glow.position.set(0, 1.12, 1.34); g.add(glow);
    // funnel (flared stack), steam dome, sand dome, whistle
    const stack = cyl(0.16, 0.1, 0.34, m.smokebox, 14); stack.position.set(0, 1.32, 1.0); g.add(stack);
    const flare = cyl(0.19, 0.16, 0.1, m.brass, 14); flare.position.set(0, 1.5, 1.0); g.add(flare);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), m.brass);
    dome.position.set(0, 1.14, 0.42); g.add(dome);
    const dome2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.boiler);
    dome2.position.set(0, 1.14, 0.05); g.add(dome2);
    const wh = cyl(0.035, 0.035, 0.14, m.brass, 8); wh.position.set(0.08, 1.2, 0.24); g.add(wh);
    // cab with windows and roof
    const cab = box(0.82, 0.78, 0.7, m.cab); cab.position.set(0, 0.98, -0.72); g.add(cab);
    for (const sx of [-1, 1]) {
      const win = box(0.03, 0.3, 0.3, m.dark); win.position.set(sx * 0.41, 1.12, -0.72); g.add(win);
    }
    const winF = box(0.5, 0.28, 0.03, m.dark); winF.position.set(0, 1.14, -0.36); g.add(winF);
    const roof = box(0.98, 0.07, 0.9, m.roof); roof.position.set(0, 1.42, -0.72); g.add(roof);
    // pistons
    for (const sx of [-1, 1]) {
      const pist = cyl(0.1, 0.1, 0.42, m.smokebox, 12);
      pist.rotation.x = Math.PI / 2; pist.position.set(sx * 0.32, 0.42, 0.95); g.add(pist);
    }
    // wheels: two big drivers + one small front axle per side, with side rods
    const wheels = [], rods = [];
    for (const sx of [-1, 1]) {
      const w1 = spokedWheel(0.3, m); w1.position.set(sx * 0.42, 0.3, -0.5); g.add(w1);
      const w2 = spokedWheel(0.3, m); w2.position.set(sx * 0.42, 0.3, 0.16); g.add(w2);
      const w3 = spokedWheel(0.17, m); w3.position.set(sx * 0.42, 0.17, 0.95);
      w3.userData.crankR = 0;
      g.add(w3);
      wheels.push(w1, w2, w3);
      const rod = box(0.05, 0.07, 0.82, m.rod);
      rod.position.set(sx * 0.47, 0.3, -0.17);
      g.add(rod); rods.push({ rod, w: w1 });
    }
    g.userData.wheels = wheels; g.userData.rods = rods;
    g.userData.stackTip = new THREE.Vector3(0, 1.56, 1.0);
    return g;
  }

  function buildCoach() {
    const m = mats();
    const g = new THREE.Group();
    const floor = box(0.84, 0.1, 1.5, m.wood); floor.position.y = 0.42; g.add(floor);
    for (const sx of [-1, 1]) {
      const side = box(0.07, 0.3, 1.5, m.cab); side.position.set(sx * 0.42, 0.6, 0); g.add(side);
      const trim = box(0.09, 0.05, 1.5, m.brass); trim.position.set(sx * 0.42, 0.76, 0); g.add(trim);
    }
    const back = box(0.84, 0.3, 0.07, m.cab); back.position.set(0, 0.6, -0.75); g.add(back);
    for (const z of [-0.3, 0.3]) {
      const bench = box(0.66, 0.08, 0.3, m.seat); bench.position.set(0, 0.56, z); g.add(bench);
      const rest = box(0.66, 0.2, 0.06, m.seat); rest.position.set(0, 0.68, z - 0.16); g.add(rest);
    }
    for (const sz of [-0.55, 0.55]) for (const sx of [-1, 1]) {
      const w = spokedWheel(0.15, m);
      w.position.set(sx * 0.42, 0.15, sz);
      w.userData.crankR = 0;
      g.add(w);
      g.userData.wheels = (g.userData.wheels || []).concat(w);
    }
    // scalloped canopy on brass posts
    for (const sz of [-0.62, 0.62]) for (const sx of [-1, 1]) {
      const post = cyl(0.03, 0.03, 0.75, m.brass, 8);
      post.position.set(sx * 0.36, 1.05, sz); g.add(post);
    }
    const canopy = box(0.95, 0.06, 1.6, m.red); canopy.position.set(0, 1.45, 0); g.add(canopy);
    for (let i = 0; i < 6; i++) {
      const sc = cyl(0.08, 0.08, 0.95, m.red, 8);
      sc.rotation.z = Math.PI / 2;
      sc.position.set(0, 1.42, -0.66 + i * 0.265); g.add(sc);
    }
    return g;
  }

  function buildTrain() {
    const g = new THREE.Group();
    const loco = buildLoco();
    const coach = buildCoach();
    coach.position.z = -2.15;
    const hitch = box(0.08, 0.08, 0.6, mats().chassis);
    hitch.position.set(0, 0.42, -1.5); g.add(hitch);
    g.add(loco, coach);
    g.userData.loco = loco; g.userData.coach = coach;
    g.traverse((o) => { if (o.isMesh) o.userData.trainRef = { type: 'train' }; });
    return g;
  }

  /* ---------- track graph helpers ---------- */
  function trackEnds() {
    const ends = [];
    for (const p of pieces.values()) {
      const nd = neighborDirs(p.data);
      if (nd.length <= 1) ends.push({ p, nd });
    }
    return ends;
  }
  function ensureTrain() {
    if (train || pieces.size < MIN_TRACKS) return;
    train = buildTrain();
    scene.add(ABC.world.entityShadows ? ABC.world.entityShadows(train) : train);
    parkTrain();
    ABC.audio.sfx.whistle && ABC.audio.sfx.whistle();
    ABC.ui.toast(ABC.tpl('🚂 Your train has arrived! Walk up and tap it to climb aboard!'), 4600, true);
    ABC.ui.floatHearts && ABC.ui.floatHearts(3);
  }
  function departTrain() {
    if (!train) return;
    scene.remove(train);
    train = null;
    ABC.ui.toast(ABC.tpl('🚂 The train went home — lay more track to call it back!'), 3600, true);
  }
  function parkTrain() {
    if (!train || !pieces.size) return;
    const ends = trackEnds();
    const start = ends.length ? ends[0] : { p: pieces.values().next().value, nd: neighborDirs(pieces.values().next().value.data) };
    R.cell = start.p.data;
    const d = start.nd.length ? start.nd[0] : 1;
    R.dirIdx = d; R.prog = 0.5; R.speed = 0; R.pauseT = 0;
    R.heading = Math.atan2(DIRS[d][0], DIRS[d][1]);
    poseTrain(0);
  }

  function cellCenter(c) { return { x: c.x + 0.5, y: c.y, z: c.z + 0.5 }; }

  function nextCell(cell, dirIdx) {
    // prefer straight, then the two turns; never doubles back on its own
    for (const cand of [dirIdx, (dirIdx + 1) % 4, (dirIdx + 3) % 4]) {
      const n = pieces.get(key(cell.x + DIRS[cand][0], cell.y, cell.z + DIRS[cand][1]));
      if (n) return { cell: n.data, dirIdx: cand };
    }
    return null;
  }

  /* position the train (and its smoke/wheels) along the track */
  function poseTrain(dt) {
    if (!train || !R.cell) return;
    const c = cellCenter(R.cell);
    const d = DIRS[R.dirIdx];
    // entry edge midpoint -> exit edge midpoint through the cell
    const ex = c.x - d[0] * 0.5, ez = c.z - d[1] * 0.5;     // entry point
    const qx = c.x + d[0] * 0.5, qz = c.z + d[1] * 0.5;     // exit point
    const t = R.prog;
    let px, pz, heading;
    if (R.turn) {
      // quadratic bezier through the cell center: smooth 90° curve
      const cx = c.x, czn = c.z;
      const ax = R.turn.ex, az = R.turn.ez;
      const bx = qx, bz = qz;
      const u = 1 - t;
      px = u * u * ax + 2 * u * t * cx + t * t * bx;
      pz = u * u * az + 2 * u * t * czn + t * t * bz;
      const dx = 2 * u * (cx - ax) + 2 * t * (bx - cx);
      const dz = 2 * u * (czn - az) + 2 * t * (bz - czn);
      heading = Math.atan2(dx, dz);
    } else {
      px = ex + (qx - ex) * t;
      pz = ez + (qz - ez) * t;
      heading = Math.atan2(d[0], d[1]);
    }
    R.heading = heading;
    train.position.set(px, R.cell.y + 0.02, pz);
    train.rotation.y = heading;
    train.userData.poseCache = { x: px, y: R.cell.y + 0.02, z: pz, heading, speed: R.speed };
    // animated running gear
    const roll = (R.rollA = (R.rollA || 0) + R.speed * dt / 0.3);
    for (const w of train.userData.loco.userData.wheels) w.userData.disc.rotation.z = -roll;
    for (const w of (train.userData.coach.userData.wheels || [])) w.userData.disc.rotation.z = -roll * 2;
    for (const r of train.userData.loco.userData.rods) {
      const a = r.w.userData.disc.rotation.z, cr = r.w.userData.crankR || 0.16;
      r.rod.position.y = 0.3 + Math.sin(a) * cr * 0.5;
      r.rod.position.z = -0.17 + Math.cos(a) * cr * 0.5;
    }
  }

  /* ---------- smoke ---------- */
  function puff(strength) {
    if (!train) return;
    const s = glowSprite('rgba(240,240,245,0.85)', 'rgba(220,220,230,0)', 0.5);
    const tip = train.userData.loco.userData.stackTip.clone();
    train.localToWorld(tip);
    s.position.copy(tip);
    s.userData = { t: 0, vy: 1.2 + strength * 0.8, grow: 1.4 + strength };
    scene.add(s); smoke.push(s);
  }

  /* ================================================================
     RIDING
     ================================================================ */
  function canRide() { return !!train && pieces.size >= MIN_TRACKS; }
  function board() {
    riding = true;
    R.speed = 0;
    R.pauseT = 0;
    ABC.audio.sfx.whistle && ABC.audio.sfx.whistle();
    ABC.stickers.award && ABC.stickers.award('train-ride');
  }
  function dismount() {
    riding = false;
    R.speed = 0;
  }
  function whistle() {
    ABC.audio.sfx.whistle && ABC.audio.sfx.whistle();
    for (let i = 0; i < 4; i++) setTimeout(() => puff(1.5), i * 120);
  }
  /* a safe spot beside the train to hop off onto */
  function dismountSpot() {
    const p = train.userData.poseCache;
    const sx = p.x + Math.cos(p.heading) * 1.3;
    const sz = p.z - Math.sin(p.heading) * 1.3;
    return { x: sx, z: sz };
  }

  /* ---------- per-frame ---------- */
  let idleT = 0, chuffT = 0;
  function tick(dt) {
    // smoke drifts up, grows, fades
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.userData.t += dt;
      s.position.y += s.userData.vy * dt;
      s.position.x += Math.sin(s.userData.t * 2) * dt * 0.2;
      const k = 0.5 + s.userData.t * s.userData.grow;
      s.scale.set(k, k, 1);
      s.material.opacity = Math.max(0, 0.8 - s.userData.t * 0.55);
      if (s.userData.t > 1.6) { scene.remove(s); smoke.splice(i, 1); }
    }
    if (!train) return;
    if (!riding) {
      // idling at the platform: soft breathing steam
      idleT += dt;
      if (idleT > 2.4) { idleT = 0; puff(0.2); }
      poseTrain(dt);
      return;
    }
    // riding: accelerate gently, follow the line, reverse at the end
    const calm = ABC.audio.settings && ABC.audio.settings.calm;
    const target = calm ? 2.0 : 3.0;
    if (R.pauseT > 0) {
      R.pauseT -= dt;
      R.speed = 0;
      if (R.pauseT <= 0) {
        R.dirIdx = (R.dirIdx + 2) % 4;               // reverse!
        R.prog = Math.max(0.01, 1 - R.prog);
        R.turn = null;
        ABC.audio.sfx.whistle && ABC.audio.sfx.whistle();
      }
    } else {
      R.speed += (target - R.speed) * Math.min(1, dt * 1.2);
      R.prog += R.speed * dt;
      while (R.prog >= 1) {
        const nx = nextCell(R.cell, R.dirIdx);
        if (!nx) {
          R.prog = 0.999;
          R.pauseT = 1.1;                              // sweet stop at the end of the line
          R.speed = 0;
          ABC.ui.toast(ABC.tpl('🚂 End of the line! Turning around…'), 2200, true);
          break;
        }
        R.prog -= 1;
        const entering = nx.dirIdx !== R.dirIdx;
        const c = cellCenter(nx.cell);
        R.turn = entering
          ? { ex: c.x - DIRS[R.dirIdx][0] * 0.5, ez: c.z - DIRS[R.dirIdx][1] * 0.5 }
          : null;
        R.cell = nx.cell;
        R.dirIdx = nx.dirIdx;
      }
    }
    // chuff-chuff synced to the wheels
    chuffT += R.speed * dt;
    if (chuffT > 0.5 && R.speed > 0.4) {
      chuffT = 0;
      ABC.audio.sfx.chuff && ABC.audio.sfx.chuff();
      puff(Math.min(1, R.speed / 3));
    }
    poseTrain(dt);
  }

  /* the seat the rider sits in (world space) */
  function seatPose() {
    if (!train) return null;
    const v = new THREE.Vector3(0, 0.75, -2.05);
    train.localToWorld(v);
    const p = train.userData.poseCache || { heading: 0, speed: 0 };
    return { x: v.x, y: v.y, z: v.z, heading: p.heading, speed: R.speed, x2: p.x, z2: p.z };
  }

  /* ---------- taps / persistence / targets ---------- */
  function meshTargets() {
    const out = [];
    for (const p of pieces.values()) p.group && p.group.traverse((o) => { if (o.isMesh) out.push(o); });
    if (train) train.traverse((o) => { if (o.isMesh) out.push(o); });
    return out;
  }
  function serialize() { return [...pieces.values()].map((p) => p.data); }
  function deserialize(arr) {
    for (const p of pieces.values()) p.group && scene.remove(p.group);
    pieces.clear();
    if (train) { scene.remove(train); train = null; }
    (arr || []).forEach((d) => pieces.set(key(d.x, d.y, d.z), { data: d, group: null }));
    for (const p of pieces.values()) refreshPiece(p);
    ensureTrain();
  }

  function count() { return pieces.size; }
  function hasTrain() { return !!train; }
  function trainPos() { return train ? train.userData.poseCache : null; }
  function isRiding() { return riding; }

  return { init, tick, place, removeAt, serialize, deserialize, meshTargets,
           canRide, board, dismount, whistle, seatPose, dismountSpot,
           count, hasTrain, trainPos, isRiding, MIN_TRACKS, _R: R };
})();
