/* Aaria's Block Craft 3D — main: renderer, Minecraft-style controls, interaction, save/load, loop */
(function () {
  const $ = (id) => document.getElementById(id);

  /* ---------------- renderer / camera ---------------- */
  const canvas = $('gameCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // smooth skin: cap pixel ratio (cheapest big win — scales shadow + PBR + fill at once)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, ABC.SMOOTH ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (ABC.SMOOTH) document.body.classList.add('skin-smooth');
  ABC._renderer = renderer;   // diagnostics/test seam

  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 300);
  ABC.player = camera;
  let yaw = 0, pitch = -0.08;   // face the rainbow arch & Bella at spawn

  /* player body state (feet position; camera derives from it) */
  const EYE = 1.62;
  const feet = new THREE.Vector3(0, 1, 6);
  let vy = 0, grounded = false, flying = false, lastSpaceTap = 0;
  let sprint = false, lastFwdTap = 0;
  function fwdTap() {                      // double-tap forward = sprint! 🏃
    const now = performance.now();
    if (now - lastFwdTap < 320) { sprint = true; ABC.ui && ABC.ui.toast('🏃💨 Sprinting!', 1500); }
    lastFwdTap = now;
  }
  let thirdPerson = false;
  let zoom = 1;                                   // 0.5 (right up close) … 6 (high in the sky)
  function applyZoom() {
    // zooming out past ~1.4 lifts you up and behind for a wide view;
    // zooming all the way in returns to first person
    const want3p = zoom > 1.4;
    if (want3p !== thirdPerson) {
      thirdPerson = want3p;
      avatar.visible = thirdPerson;
      hand.visible = !thirdPerson;
      refreshHand();
      $('viewBtn').classList.toggle('active', thirdPerson);
    }
    camera.fov = 72 * (thirdPerson ? 1 : Math.max(0.55, Math.min(1.35, zoom)));
    camera.updateProjectionMatrix();
  }
  function setZoom(dz) {
    zoom = Math.max(0.5, Math.min(6, zoom + dz));
    applyZoom();
    ABC.audio.sfx.gentle();
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 200));

  // if the Smooth skin fails to init on a weak GPU (PMREM/shadows/shaders), fall
  // back to Classic on the next load so a kid is never stuck on a broken world.
  let scene;
  try {
    scene = ABC.world.initScene(renderer);
  } catch (e) {
    if (ABC.SMOOTH) { try { localStorage.setItem('abcSkin', 'classic'); } catch (_) {} location.reload(); }
    throw e;
  }
  ABC.world.generate();
  ABC.animals.spawnAll(scene);
  ABC.squishy.init(scene);
  ABC.portal.init(scene);
  ABC.music.init(scene);
  ABC.weather.init(scene);
  ABC.shops.init(scene);
  ABC.shops.placeAll();
  ABC.signs.init(scene);
  ABC.signs.placeAll();

  ABC.teleport = (x, y, z) => { feet.set(x, y, z); vy = 0; };
  ABC.setLook = (y, p) => { yaw = y; pitch = p; };   // test/debug: aim the camera

  /* ---------------- player avatar (visible in 3rd person) ---------------- */
  const avatar = new THREE.Group();
  (function buildAvatar() {
    const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
    const bx = (w,h,d,x,y,z,c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(c)); m.position.set(x,y,z); avatar.add(m); return m; };
    bx(.5,.6,.3, 0,1.05,0, '#4dabf7');     // shirt
    bx(.42,.42,.42, 0,1.6,0, '#ffd8b5');   // head
    bx(.46,.18,.46, 0,1.86,0, '#5c3c10');  // hair
    bx(.5,.1,.5, 0,1.94,0, '#5c3c10');     // bun
    bx(.16,.55,.2, -.14,.38,0, '#b197fc'); // legs
    bx(.16,.55,.2,  .14,.38,0, '#b197fc');
    bx(.14,.5,.18, -.33,1.05,0, '#ffd8b5');// arms
    bx(.14,.5,.18,  .33,1.05,0, '#ffd8b5');
    // friendly face
    const e = mat('#222');
    [-0.1, 0.1].forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.02), e); m.position.set(x,1.64,.22); avatar.add(m); });
    avatar.visible = false;
    scene.add(avatar);
  })();

  /* held block "hand" (first person, Minecraft style) */
  const hand = new THREE.Mesh(new THREE.BoxGeometry(.45,.45,.45),
    new THREE.MeshLambertMaterial({ color: 0xd9a05b }));
  hand.position.set(0.62, -0.55, -1.0);
  hand.rotation.set(0.3, -0.6, 0);
  camera.add(hand);
  scene.add(camera);
  function refreshHand() {
    const h = ABC.ui.getHand ? ABC.ui.getHand() : { kind: 'block', id: ABC.ui.getSelected() };
    hand.visible = !thirdPerson;
    hand.scale.set(1, 1, 1);
    if (h.kind === 'block' && ABC.world.materials[h.id]) {
      hand.material = ABC.world.materials[h.id];
    } else if (h.kind === 'tool') {
      hand.material = new THREE.MeshLambertMaterial({ color: 0x8a8f98 });   // pickaxe head
      hand.scale.set(0.6, 1.4, 0.6);
    } else if (h.kind === 'cutter') {
      hand.material = new THREE.MeshLambertMaterial({ color: 0xff8fc8 });
      hand.scale.set(1, 0.35, 1);
    } else if (h.kind === 'sapling') {
      hand.material = ABC.world.materials.leaf;
      hand.scale.set(0.6, 0.9, 0.6);
    } else if (h.kind === 'animal') {
      hand.visible = false;   // carrying a friend gently in both hands
    }
  }
  ABC.refreshHand = refreshHand;

  /* hover highlight */
  const hl = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
    new THREE.LineBasicMaterial({ color: 0xffffff }));
  hl.visible = false; scene.add(hl);

  /* ---------------- input (no pointer lock, no Esc — drag to look, click to act) ---------------- */
  const keys = {};
  let mode = 'place';   // 'place' 🧱 | 'dig' ⛏️ — toggled by the on-screen button

  function tapSpace() {
    const now = performance.now();
    if (now - lastSpaceTap < 320) {           // double-tap = toggle fly
      flying = !flying; vy = 0;
      $('flyBtn').classList.toggle('active', flying);
      ABC.ui.toast(flying ? '🕊️ Flying! Hold ⬆ to go up — tap 🕊️ to drop!' : '🚶 Walking again — wheee!', 2400);
      ABC.audio.sfx.gentle();
    } else if (!flying && grounded) {
      vy = 7.5; grounded = false;             // jump
    }
    lastSpaceTap = now;
  }

  document.addEventListener('keydown', (e) => {
    if (ABC.ui.isOpen()) return;
    if (e.code === 'Space' && !e.repeat) tapSpace();
    if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !e.repeat) fwdTap();
    if (e.code === 'KeyV' && !e.repeat) toggleView();
    keys[e.code] = true;
    if (e.code.startsWith('Digit')) {
      const n = +e.code.slice(5);
      if (n >= 1 && n <= 9) ABC.ui.selectByIndex(n - 1);
    }
  });
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') sprint = false;
  });

  function toggleView() {
    // jump between a close first-person zoom and a comfy third-person zoom
    zoom = thirdPerson ? 1 : 2.2;
    applyZoom();
    ABC.audio.sfx.gentle();
  }

  /* ---------------- fast voxel raycast (grid walk) ---------------- */
  const REACH = 8;
  function castVoxel(origin, dir) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = dir.x >= 0 ? 1 : -1, stepY = dir.y >= 0 ? 1 : -1, stepZ = dir.z >= 0 ? 1 : -1;
    const tDX = Math.abs(1 / (dir.x || 1e-10)), tDY = Math.abs(1 / (dir.y || 1e-10)), tDZ = Math.abs(1 / (dir.z || 1e-10));
    let tX = ((stepX > 0 ? x + 1 - origin.x : origin.x - x)) * tDX;
    let tY = ((stepY > 0 ? y + 1 - origin.y : origin.y - y)) * tDY;
    let tZ = ((stepZ > 0 ? z + 1 - origin.z : origin.z - z)) * tDZ;
    let px = x, py = y, pz = z, t = 0;
    for (let i = 0; i < 64; i++) {
      px = x; py = y; pz = z;
      if (tX < tY && tX < tZ) { x += stepX; t = tX; tX += tDX; }
      else if (tY < tZ)       { y += stepY; t = tY; tY += tDY; }
      else                    { z += stepZ; t = tZ; tZ += tDZ; }
      if (t > REACH) return null;
      if (ABC.world.get(x, y, z)) {
        return { cell: { x, y, z }, prev: { x: px, y: py, z: pz }, dist: t };
      }
    }
    return null;
  }

  /* three.js raycast for animals / ghosts / squishies only (few objects) */
  const raycaster = new THREE.Raycaster();
  raycaster.far = REACH;
  function castEntities(origin, dir) {
    raycaster.set(origin, dir);
    let ghosts = [];
    scene.traverse(o => { if (o.userData && o.userData.ghost) ghosts.push(o); });
    const hits = raycaster.intersectObjects(
      [...ghosts, ...ABC.animals.meshTargets(), ...ABC.squishy.meshTargets(),
       ...ABC.music.meshTargets(),
       ...ABC.portal.meshTargets()], false);
    return hits.length ? hits[0] : null;
  }

  function aim(screenX, screenY) {
    const origin = camera.position.clone();
    const dir = new THREE.Vector3();
    if (screenX == null) {
      camera.getWorldDirection(dir);
    } else {
      const v = new THREE.Vector2((screenX / window.innerWidth) * 2 - 1, -(screenY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(v, camera);
      dir.copy(raycaster.ray.direction);
      origin.copy(raycaster.ray.origin);
    }
    const ent = castEntities(origin, dir);
    const vox = castVoxel(origin, dir);
    if (ent && (!vox || ent.distance < vox.dist)) {
      const o = ent.object;
      if (o.userData.animalRef)  return { kind: 'animal', animal: o.userData.animalRef, point: ent.point };
      if (o.userData.squishyRef) return { kind: 'squishy', squishy: o.userData.squishyRef, point: ent.point };
      if (o.userData.portalRef)  return { kind: 'portal', portal: o.userData.portalRef, point: ent.point };
      if (o.userData.noteRef)    return { kind: 'note', mesh: o, point: ent.point };
      if (o.userData.ghost)      return { kind: 'ghost', mesh: o, point: ent.point };
    }
    if (vox) return { kind: 'block', cell: vox.cell, place: vox.prev };
    return null;
  }

  /* ---------------- pulverize particles 💥 ---------------- */
  const particles = [];
  function pulverize(x, y, z, type) {
    const mat = ABC.world.materials[type];
    if (!mat) return;
    const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(x + 0.2 + Math.random() * 0.6, y + 0.2 + Math.random() * 0.6, z + 0.2 + Math.random() * 0.6);
      p.userData.v = new THREE.Vector3((Math.random() - .5) * 4, 2 + Math.random() * 3.5, (Math.random() - .5) * 4);
      p.userData.life = 0.9 + Math.random() * 0.5;
      p.userData.spin = (Math.random() - .5) * 12;
      scene.add(p);
      particles.push(p);
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.userData.life -= dt;
      if (p.userData.life <= 0) { scene.remove(p); particles.splice(i, 1); continue; }
      p.userData.v.y -= 14 * dt;
      p.position.addScaledVector(p.userData.v, dt);
      p.rotation.x += p.userData.spin * dt; p.rotation.z += p.userData.spin * dt;
      const s = Math.min(1, p.userData.life * 2);
      p.scale.setScalar(s);
      if (p.position.y < 0.1) { p.position.y = 0.1; p.userData.v.y *= -0.4; p.userData.v.x *= 0.7; p.userData.v.z *= 0.7; }
    }
  }

  /* ---------------- gravity: unsupported builds fall down 🌳🏚️ ----------------
     terrain never falls; trees, houses & built blocks do. When the base is
     dug away, the connected group that's no longer resting on the ground
     drops as one piece and lands. */
  const GROUND = new Set(['grass','dirt','stone','sand','snow','water','moss',
    'redrock','sandstone','granite','blackrock','ice','lava']);
  const NB6 = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const falls = []; // active falling groups
  function fallable(t) { return t && !GROUND.has(t); }

  function collapseCheck(cell) {
    // seeds: fallable blocks that were touching the removed one
    const seeds = [];
    for (const [dx, dy, dz] of NB6) {
      const x = cell.x + dx, y = cell.y + dy, z = cell.z + dz;
      if (fallable(ABC.world.get(x, y, z))) seeds.push({ x, y, z });
    }
    const done = new Set();
    for (const s of seeds) {
      const sk = ABC.world.key(s.x, s.y, s.z);
      if (done.has(sk)) continue;
      // flood the connected fallable cluster (capped for safety)
      const cluster = [], seen = new Set([sk]), q = [[s.x, s.y, s.z]];
      let overflow = false;
      while (q.length) {
        const [x, y, z] = q.shift();
        if (!fallable(ABC.world.get(x, y, z))) continue;
        cluster.push({ x, y, z, t: ABC.world.get(x, y, z) });
        if (cluster.length > 500) { overflow = true; break; }
        for (const [dx, dy, dz] of NB6) {
          const nx = x+dx, ny = y+dy, nz = z+dz, kk = ABC.world.key(nx, ny, nz);
          if (seen.has(kk)) continue; seen.add(kk);
          if (fallable(ABC.world.get(nx, ny, nz))) q.push([nx, ny, nz]);
        }
      }
      if (overflow) continue;
      cluster.forEach(c => done.add(ABC.world.key(c.x, c.y, c.z)));
      const inClus = new Set(cluster.map(c => ABC.world.key(c.x, c.y, c.z)));
      // supported if any block sits on something solid that isn't part of itself
      let supported = false;
      for (const c of cluster) {
        if (c.y - 1 < ABC.world.MIN_Y) { supported = true; break; }
        const belowK = ABC.world.key(c.x, c.y - 1, c.z);
        if (!inClus.has(belowK) && ABC.world.get(c.x, c.y - 1, c.z)) { supported = true; break; }
      }
      if (supported || !cluster.length) continue;
      dropCluster(cluster);     // TIMBER! the whole disconnected piece comes down
      const treeish = cluster.some(c => c.t === 'wood' || c.t === 'leaf');
      ABC.ui.toast(treeish ? '🪓 TIMBER! The tree is falling down! 🌳'
                           : '🏚️ Watch out — it’s tumbling down!', 2600, true);
    }
  }
  /* the unsupported piece collapses: every block falls and piles up on the
     ground of its own column, so a tall tree pancakes into a heap 🌳→🪵 */
  function dropCluster(cluster) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    // group by column
    const cols = new Map();
    for (const c of cluster) {
      const ck = c.x + ',' + c.z;
      (cols.get(ck) || cols.set(ck, []).get(ck)).push(c);
    }
    // remove from the world first so landings don't collide with originals
    for (const c of cluster) ABC.world.remove(c.x, c.y, c.z);
    ABC.world.flush();
    let any = false;
    for (const [, col] of cols) {
      col.sort((a, b) => a.y - b.y);
      const x = col[0].x, z = col[0].z;
      // first solid ground at/below the column (ignoring cluster cells)
      let rest = col[0].y;
      while (rest - 1 >= ABC.world.MIN_Y && !ABC.world.get(x, rest - 1, z)) rest--;
      // stack the column's blocks up from the ground, low ones first
      col.forEach((c, i) => {
        const target = rest + i;
        if (target >= c.y) { ABC.world.set(x, c.y, z, c.t); return; }  // already low enough
        const m = new THREE.Mesh(geo, ABC.world.materials[c.t] || ABC.world.materials.wood);
        m.position.set(x + 0.5, c.y + 0.5, z + 0.5);
        m.userData.spin = (Math.random() - 0.5) * 3;
        scene.add(m);
        falls.push({ m, x, z, t: c.t, y: c.y, target, vy: 0 });
        any = true;
      });
    }
    ABC.world.flush();
    if (any) ABC.audio.sfx.remove();
  }
  function updateFalls(dt) {
    let landed = false;
    for (let i = falls.length - 1; i >= 0; i--) {
      const f = falls[i];
      f.vy = Math.min(30, f.vy + 42 * dt);
      f.y = Math.max(f.target, f.y - f.vy * dt);
      f.m.position.y = f.y + 0.5;
      f.m.rotation.z = (f.y - f.target) * 0.12 * (f.m.userData.spin || 0);
      if (f.y <= f.target + 0.001) {
        scene.remove(f.m);
        ABC.world.set(f.x, f.target, f.z, f.t);
        pulverize(f.x, f.target, f.z, f.t);
        falls.splice(i, 1);
        landed = true;
      }
    }
    if (landed) { ABC.world.flush(); ABC.audio.sfx.plop(); saveSoon(); }
  }

  /* ---------------- doors really open & close 🚪 ---------------- */
  function toggleDoor(cell) {
    const rot = ABC.world.getRot(cell.x, cell.y, cell.z);
    const open = !(rot & 4);
    ABC.world.set(cell.x, cell.y, cell.z, 'door', open ? (rot | 4) : (rot & 3));
    ABC.world.flush();
    ABC.audio.sfx[open ? 'pop' : 'plop']();
    ABC.ui.toast(open ? '🚪 The door swings open — come in!' : '🚪 Click! The door is closed.', 2000);
    saveSoon();
  }

  /* ---------------- satellite map 🗺️ ---------------- */
  function showMap() {
    const R = 56, CV = 2 * R + 1, SC = 4;
    let html = `<div class="bigEmoji">🗺️</div><h2>Your World From the Sky</h2>
      <canvas id="mapCv" width="${CV * SC}" height="${CV * SC}" style="width:min(82vw,440px); image-rendering:pixelated; border-radius:16px; border:4px solid #74c0fc;"></canvas>
      <div class="dlgRow"><button class="bigBtn green" id="mapOk">Back to playing! 🎮</button></div>`;
    ABC.ui.openDialog(html);
    const g = $('mapCv').getContext('2d');
    const px = Math.round(feet.x), pz = Math.round(feet.z);
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
      const tb = ABC.world.topBlock(px + dx, pz + dz);
      let col = '#9fdcff';
      if (tb) {
        col = (ABC.BLOCK_DEFS[tb.t] || {}).color || '#888';
        if (tb.t === 'grass' && tb.y > 0) col = '#5aa327';
      }
      g.fillStyle = col;
      g.fillRect((dx + R) * SC, (dz + R) * SC, SC, SC);
    }
    // you are here 💙 + facing arrow
    g.fillStyle = '#1d4ed8';
    g.beginPath(); g.arc(R * SC + SC/2, R * SC + SC/2, SC * 1.6, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(R * SC + SC/2, R * SC + SC/2);
    g.lineTo(R * SC + SC/2 - Math.sin(yaw) * SC * 3.2, R * SC + SC/2 - Math.cos(yaw) * SC * 3.2); g.stroke();
    ABC.audio.say('Look — your world from the sky! The blue dot is you.');
    $('mapOk').onclick = () => ABC.ui.closeDialog();
  }

  /* ---------------- tree growing 🌱 ---------------- */
  function growTree(x, y, z) {
    ABC.audio.sfx.grow();
    ABC.ui.toast('🌱 A little tree is growing…', 2600);
    const h = 3 + Math.floor(Math.random() * 2);
    const steps = [];
    for (let i = 0; i < h; i++) steps.push(() => ABC.world.set(x, y + i, z, 'wood'));
    for (let dy = 0; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++)
      if (Math.abs(dx) + Math.abs(dz) + dy < 4)
        steps.push(() => ABC.world.set(x + dx, y + h - 1 + dy, z + dz, 'leaf'));
    let i = 0;
    const t = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(t);
        ABC.ui.confetti(14); ABC.audio.sfx.ding();
        ABC.ui.toast('🌳 Your tree is all grown! You are a nature helper!', 3600, true);
        saveSoon();
        return;
      }
      for (let n = 0; n < 4 && i < steps.length; n++) steps[i++]();
      ABC.world.flush();
      if (i % 8 === 0) ABC.audio.sfx.pop();
    }, 160);
  }

  /* ---------------- spawn an animal friend from the bag ---------------- */
  function placeAnimal(type, x, z) {
    if (ABC.animals.list.length > 40) { ABC.ui.toast('🐾 The meadow is full of friends! Maybe dig some space first!', 3200); return; }
    const a = ABC.animals.spawn(type, x, z);
    ABC.state.friends = ABC.state.friends || [];
    ABC.state.friends.push({ kind: type, x, z, name: a.name });
    ABC.ui.confetti(12); ABC.audio.sfx.ding();
    ABC.ui.toast(`${a.def.emoji} ${a.name} the ${a.def.label} hopped out of your bag!`, 3800, true);
    saveSoon();
  }

  /* ---------------- act: every click/tap routes here ---------------- */
  function act(info, m, hitPoint) {
    const hand = ABC.ui.getHand();
    if (!info) return;
    // friends & magic things respond first
    if (info.kind === 'animal')  { ABC.activities.talkToAnimal(info.animal); return; }
    if (info.kind === 'portal')  { ABC.portal.use(info.portal); return; }
    if (info.kind === 'note')    { ABC.music.handleClick(info.mesh); return; }
    if (info.kind === 'squishy') {
      if (hand.kind === 'cutter') ABC.squishy.stamp(info.squishy, hand.shape);
      else ABC.squishy.poke(info.squishy, hitPoint);
      return;
    }
    if (info.kind === 'ghost')   { ABC.activities.tryFillGhost(info.mesh); return; }
    if (info.kind === 'block') {
      // doors open and close with a click (any mode)
      if (ABC.world.get(info.cell.x, info.cell.y, info.cell.z) === 'door') { toggleDoor(info.cell); return; }
      const digging = m === 'dig' || hand.kind === 'tool';
      if (digging) {
        const t = ABC.world.get(info.cell.x, info.cell.y, info.cell.z);
        if (ABC.world.remove(info.cell.x, info.cell.y, info.cell.z)) {
          ABC.world.flush(); ABC.audio.sfx.remove(); saveSoon();
          pulverize(info.cell.x, info.cell.y, info.cell.z, t);   // 💥 crumble!
          collapseCheck(info.cell);                              // 🌳 unsupported parts fall
        } else if (info.cell.y === ABC.world.MIN_Y) {
          ABC.ui.toast('🪨 That is the super-strong bottom rock!', 2400);
        }
        return;
      }
      const p = info.place;
      if (hand.kind === 'sapling') { growTree(p.x, p.y, p.z); return; }
      if (hand.kind === 'animal')  { placeAnimal(hand.type, p.x + 0.5, p.z + 0.5); return; }
      if (hand.kind === 'cutter')  { ABC.ui.toast(hand.ico + '🍪 Tap your squishy slime with the cutter!', 2600); return; }
      // place a block — shaped blocks face the way you are looking
      if (Math.abs(p.x + 0.5 - feet.x) < 0.85 && Math.abs(p.z + 0.5 - feet.z) < 0.85 &&
          p.y + 1 > feet.y && p.y < feet.y + 1.8) return;
      const id = hand.kind === 'block' ? hand.id : ABC.ui.getSelected();
      const def = ABC.BLOCK_DEFS[id];
      const rot = def.rotates ? ((Math.round(yaw / (Math.PI / 2)) % 4) + 4) % 4 : 0;
      if (ABC.world.set(p.x, p.y, p.z, id, rot)) {
        ABC.world.flush(); ABC.audio.sfx.pop(); saveSoon();
        ABC.state.placedCount = (ABC.state.placedCount || 0) + 1;
        ABC.activities.maybeShowTell(ABC.state.placedCount);   // Show & Tell moments
      }
    }
  }

  function setMode(m, quiet) {
    mode = m;
    $('tMode').textContent = mode === 'dig' ? '⛏️' : '🧱';
    $('tMode').classList.toggle('digMode', mode === 'dig');
    if (!quiet) {
      ABC.ui.toast(mode === 'dig' ? '⛏️ Dig mode — click blocks to dig them up!'
                                  : '🧱 Build mode — click to place blocks!', 2400);
      ABC.audio.sfx.gentle();
    }
  }
  ABC.setMode = setMode;

  /* ---------------- unified pointer input (mouse + touch) ----------------
     drag on the world = look around · quick click/tap = act
     press a squishy and drag = stretch & pull it like real slime           */
  let pDown = false, pMoved = 0, pLast = { x: 0, y: 0 };
  let hover = { x: innerWidth / 2, y: innerHeight / 2 };
  let dragS = null;

  function groundPointAt(screenX, screenY, atY) {
    // where the click-ray crosses the height of the slime's base
    const v = new THREE.Vector2((screenX / innerWidth) * 2 - 1, -(screenY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(v, camera);
    const o = raycaster.ray.origin, d = raycaster.ray.direction;
    const t = (atY - o.y) / (d.y || -1e-6);
    if (t <= 0) return null;
    return { x: o.x + d.x * t, z: o.z + d.z * t };
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!started || ABC.ui.isOpen()) return;
    canvas.setPointerCapture(e.pointerId);
    pDown = true; pMoved = 0;
    pLast = { x: e.clientX, y: e.clientY };
    const info = aim(e.clientX, e.clientY);
    if (info && info.kind === 'squishy' && e.button !== 2) {
      dragS = info.squishy;
      ABC.squishy.grab(dragS);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    hover = { x: e.clientX, y: e.clientY };
    if (!pDown) return;
    const dx = e.clientX - pLast.x, dy = e.clientY - pLast.y;
    pMoved += Math.abs(dx) + Math.abs(dy);
    if (dragS) {
      const p = groundPointAt(e.clientX, e.clientY, dragS.group.position.y + 0.4);
      if (p) ABC.squishy.dragTo(dragS, p.x, p.z);
    } else {
      yaw -= dx * 0.0045; pitch -= dy * 0.0045;
      pitch = Math.max(-1.45, Math.min(1.45, pitch));
    }
    pLast = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!started) { pDown = false; dragS = null; return; }
    if (dragS) {
      ABC.squishy.release(dragS);
      if (pMoved < 9) ABC.squishy.poke(dragS);   // quick tap = squish!
      dragS = null;
    } else if (pDown && pMoved < 9 && !ABC.ui.isOpen()) {
      const info = aim(e.clientX, e.clientY);
      // right-click does the opposite of the current mode (handy for grown-ups)
      const m = e.button === 2 ? (mode === 'dig' ? 'place' : 'dig') : mode;
      act(info, m, info && info.point);
    }
    pDown = false;
  });
  canvas.addEventListener('pointercancel', () => {
    if (dragS) { ABC.squishy.release(dragS); dragS = null; }
    pDown = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------------- on-screen control pad (always visible) ---------------- */
  const holdBtn = (id, code) => {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); keys[code] = true; });
    el.addEventListener('pointerup',   (e) => { e.preventDefault(); keys[code] = false; });
    el.addEventListener('pointercancel', () => { keys[code] = false; });
  };
  holdBtn('tUp', 'KeyW'); holdBtn('tDown', 'KeyS'); holdBtn('tLeft', 'KeyA'); holdBtn('tRight', 'KeyD');
  holdBtn('tDesc', 'ShiftLeft');                                    // ⬇ fly down
  $('tUp').addEventListener('pointerdown', fwdTap);                 // double-tap ▲ = sprint
  const jb = $('tJump');
  jb.addEventListener('pointerdown', (e) => { e.preventDefault(); tapSpace(); keys.Space = true; });
  jb.addEventListener('pointerup',   (e) => { e.preventDefault(); keys.Space = false; });
  jb.addEventListener('pointercancel', () => { keys.Space = false; });
  $('tMode').addEventListener('click', () => {
    const next = mode === 'dig' ? 'place' : 'dig';
    if (next === 'place' && ABC.ui.getHand().kind !== 'block') {
      ABC.ui.selectBlock(ABC.ui.getSelected());   // put the tool away, take the block back out
    }
    setMode(next);
  });

  /* ---------------- movement & physics ---------------- */
  const solid = (x, y, z) => {
    const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
    const t = ABC.world.get(fx, fy, fz);
    if (!t) return false;
    if (t === 'door' && (ABC.world.getRot(fx, fy, fz) & 4)) return false;   // open doors let you through
    return true;
  };
  /* highest walkable surface at column (x,z) at or below fromY (+ small step-up) */
  function surfaceY(x, z, fromY) {
    for (let y = Math.floor(fromY + 1.01); y >= ABC.world.MIN_Y; y--) {
      if (solid(x, y, z)) return y + 1;
    }
    return ABC.world.MIN_Y;
  }

  function updatePlayer(dt) {
    if (ABC.ui.isOpen()) return;
    const speed = flying ? 9 : 5.2;
    const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const r = new THREE.Vector3(-f.z, 0, f.x);
    const move = new THREE.Vector3();
    if (keys.KeyW || keys.ArrowUp)   move.add(f);
    if (keys.KeyS || keys.ArrowDown) move.sub(f);
    if (keys.KeyD)                   move.add(r);
    if (keys.KeyA)                   move.sub(r);
    if (keys.ArrowLeft)  yaw += dt * 1.9;
    if (keys.ArrowRight) yaw -= dt * 1.9;
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * dt);

    if (flying) {
      feet.x += move.x * (sprint ? 1.6 : 1); feet.z += move.z * (sprint ? 1.6 : 1);
      if (keys.Space) feet.y += speed * dt;
      if (keys.ShiftLeft || keys.ShiftRight) feet.y -= speed * dt;
      const gy = surfaceY(feet.x, feet.z, feet.y);
      if (feet.y <= gy) {           // touched down — land softly
        feet.y = gy;
        if (keys.ShiftLeft || keys.ShiftRight) { flying = false; $('flyBtn').classList.remove('active'); }
      }
    } else {
      // horizontal, axis by axis, with 1-block step-up and a body radius
      // (the radius stops you from pressing your face inside walls)
      const spd = sprint ? 1.65 : 1;
      for (const [dx, dz] of [[move.x * spd, 0], [0, move.z * spd]]) {
        if (!dx && !dz) continue;
        const nx = feet.x + dx, nz = feet.z + dz;
        let ok = true;
        for (const [ox, oz] of [[.32,.32],[.32,-.32],[-.32,.32],[-.32,-.32]]) {
          const sy = surfaceY(nx + ox, nz + oz, feet.y + 0.1);
          if (sy - feet.y > 1.05 || solid(nx + ox, sy + 1.4, nz + oz)) { ok = false; break; }
        }
        if (ok) { feet.x = nx; feet.z = nz; }
      }
      // gravity
      vy -= 22 * dt;
      feet.y += vy * dt;
      const gy = surfaceY(feet.x, feet.z, feet.y + 0.5);
      if (feet.y <= gy) { feet.y = gy; vy = 0; grounded = true; }
      else grounded = false;
    }

    // animals are solid friends — you bump into them, not through them
    for (const a of ABC.animals.list) {
      const r = 0.45 + a.def.size * 0.5;
      const dx = feet.x - a.group.position.x, dz = feet.z - a.group.position.z;
      const d = Math.hypot(dx, dz);
      if (d < r && d > 0.001 && Math.abs(feet.y - a.group.position.y) < 2.2) {
        feet.x = a.group.position.x + (dx / d) * r;
        feet.z = a.group.position.z + (dz / d) * r;
      }
    }

    const S = ABC.world.SIZE - 1;
    feet.x = Math.max(-S, Math.min(S, feet.x));
    feet.z = Math.max(-S, Math.min(S, feet.z));
    feet.y = Math.max(ABC.world.MIN_Y, Math.min(38, feet.y));

    // camera follows feet (1st person) or trails behind (3rd person)
    camera.rotation.set(0, 0, 0);
    camera.rotateY(yaw); camera.rotateX(pitch);
    if (thirdPerson) {
      const back = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      // higher and further the more you zoom out — up to a soaring bird's-eye view
      camera.position.set(feet.x, feet.y + EYE + 2.2 * zoom, feet.z).addScaledVector(back, 4.0 * zoom);
      avatar.position.set(feet.x, feet.y, feet.z);
      avatar.rotation.y = yaw + Math.PI;
    } else {
      camera.position.set(feet.x, feet.y + EYE, feet.z);
    }
    // gentle hand bob while moving
    const moving = move.lengthSq() > 0;
    hand.position.y = -0.55 + (moving ? Math.sin(performance.now() / 130) * 0.04 : 0);
  }

  /* gentle auto-fly to a build site */
  let flyTarget = null;
  ABC.flyToSite = (site) => { flyTarget = new THREE.Vector3(site.x - 5, 5, site.z + 11); };
  function updateFly(dt) {
    if (!flyTarget) return;
    if (!flying) { flying = true; $('flyBtn').classList.add('active'); }
    const d = flyTarget.clone().sub(feet);
    if (d.length() < 0.6) { flyTarget = null; return; }
    feet.addScaledVector(d.normalize(), Math.min(d.length(), 13 * dt));
    yaw = Math.atan2(-(flyTarget.x - feet.x), -(flyTarget.z - feet.z));
    pitch = -0.22;
  }

  /* ---------------- kindness flowers ---------------- */
  ABC.bloomFlowers = () => {
    const px = Math.round(feet.x), pz = Math.round(feet.z);
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 5;
      const x = Math.round(px + Math.cos(a) * r), z = Math.round(pz + Math.sin(a) * r);
      ABC.world.set(x, surfaceY(x + 0.5, z + 0.5, 6), z, 'flower');
    }
    ABC.world.flush();
  };

  /* ---------------- save / load ---------------- */
  const SAVE_KEY = 'aariasBlockCraft3';   // v3: infinite world (edits-only saves)
  let saveTimer = null;
  function saveNow() {
    try {
      const s = ABC.audio.settings;
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        world: ABC.world.serialize(),
        squishies: ABC.squishy.serialize(),
        pet: ABC.pet.serialize(),
        stickers: ABC.stickers.serialize(),
        overnight: ABC.overnight.serialize(),
        photo: ABC.photo.serialize(),
        parks: ABC.parks.serialize(),
        playerName: ABC.state.playerName,
        portalCharge: ABC.state.portalCharge || 0,
        quests: ABC.state.quests || null,
        placedCount: ABC.state.placedCount || 0,
        friends: ABC.state.friends || [],
        pocket: ABC.state.pocket || null,
        stars: ABC.state.stars, hearts: ABC.state.hearts,
        unlocked: [...ABC.state.unlocked], completed: [...ABC.state.completed],
        tutorialDone: ABC.state.tutorialDone,
        settings: { sound: s.sound, music: s.music, readAloud: s.readAloud, voiceMode: s.voiceMode,
                    theme: s.theme, voiceName: s.voiceName },
      }));
    } catch (e) { /* storage blocked — keep playing */ }
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 1500); }
  ABC.saveSoon = saveSoon;
  window.addEventListener('beforeunload', saveNow);

  function load() {
    try {
      let raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        // migrate stars/hearts/name/settings from the old fixed-world save
        const old = localStorage.getItem('aariasBlockCraft2');
        if (!old) return false;
        const o = JSON.parse(old);
        delete o.world; delete o.squishies;
        raw = JSON.stringify(o);
      }
      const d = JSON.parse(raw);
      ABC.world.deserialize(d.world);
      ABC.squishy.deserialize(d.squishies);
      ABC.pet.deserialize(d.pet);
      ABC.parks.deserialize(d.parks);
      ABC.stickers.deserialize(d.stickers);
      ABC.overnight.deserialize(d.overnight);
      ABC.photo.deserialize(d.photo);
      if (d.playerName) ABC.state.playerName = d.playerName;
      ABC.state.portalCharge = d.portalCharge || 0;
      ABC.state.quests = d.quests || null;
      ABC.state.placedCount = d.placedCount || 0;
      ABC.state.friends = d.friends || [];
      ABC.state.pocket = d.pocket || null;
      ABC.state.friends.forEach(f => {
        if (ABC.ANIMAL_DEFS[f.kind]) ABC.animals.spawn(f.kind, f.x, f.z, f.name);
      });
      ABC.state.stars = d.stars || 0;
      ABC.state.hearts = d.hearts || 0;
      (d.unlocked || []).forEach(b => ABC.state.unlocked.add(b));
      (d.completed || []).forEach(p => ABC.state.completed.add(p));
      ABC.state.tutorialDone = !!d.tutorialDone;
      if (d.settings) Object.assign(ABC.audio.settings, d.settings);
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- HUD wiring ---------------- */
  $('buildMenuBtn').onclick = () => ABC.activities.showBuildMenu();
  $('bagBtn').onclick      = () => ABC.ui.openBag();
  $('kindBtn').onclick     = () => ABC.activities.kindWords();
  $('slimeBtn').onclick    = () => ABC.activities.slimeLab();
  $('oreoBtn').onclick     = () => ABC.activities.oreoKitchen();
  $('settingsBtn').onclick = () => ABC.ui.showSettings();
  $('helpBtn').onclick     = () => ABC.ui.showHelp();
  $('magicBtn').onclick    = () => ABC.activities.magicFill();
  $('quitProjBtn').onclick = () => ABC.activities.quitProject();
  $('viewBtn').onclick     = () => toggleView();
  $('portalChip').onclick  = () => ABC.portal.findPortal();
  $('zoomInBtn').onclick   = () => setZoom(-0.18);
  $('zoomOutBtn').onclick  = () => setZoom(+0.18);
  $('mapBtn').onclick      = () => showMap();
  $('passportBtn').onclick = () => ABC.parks.openPassport();
  $('photoBtn').onclick    = () => ABC.photo.takePhoto();
  $('albumBtn').onclick    = () => ABC.photo.openAlbum();
  $('stickersBtn').onclick = () => ABC.stickers.openBook();
  $('flowerChip').onclick  = () => ABC.overnight.showFlower();
  $('moreBtn').onclick     = () => ABC.ui.openQuickMenu();
  $('tFly').addEventListener('click', () => $('flyBtn').click());
  $('questChip').onclick   = () => ABC.quests.showBoard();

  /* full screen — works on Chrome/Edge/Firefox AND Safari (incl. iOS, which
     has no Fullscreen API, via a CSS faux-fullscreen fallback) */
  function nativeFsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function fsLabel() {
    const on = !!nativeFsEl() || document.body.classList.contains('fauxFs');
    $('fsBtn').textContent = on ? '🗗' : '⛶';
    $('fsBtn').title = on ? 'Exit full screen' : 'Full screen';
  }
  function setFaux(on) {
    document.body.classList.toggle('fauxFs', on);
    fsLabel();
    onResize();   // game canvas resizes to the new viewport
  }
  function toggleFullscreen() {
    // already in faux mode → just leave it
    if (document.body.classList.contains('fauxFs')) { setFaux(false); return; }
    if (nativeFsEl()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    const root = document.documentElement;
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (req) {
      try {
        const p = req.call(root);
        if (p && p.catch) p.catch(() => setFaux(true));   // Safari may reject → faux
      } catch (e) { setFaux(true); }
    } else {
      setFaux(true);   // iOS Safari: no API at all → faux fullscreen
    }
  }
  document.addEventListener('fullscreenchange', fsLabel);
  document.addEventListener('webkitfullscreenchange', fsLabel);
  $('fsBtn').onclick = toggleFullscreen;
  $('fsTitleBtn').onclick = toggleFullscreen;
  $('flyBtn').onclick      = () => {
    flying = !flying; vy = 0;
    $('flyBtn').classList.toggle('active', flying);
    ABC.ui.toast(flying ? '🕊️ Flying! Hold ⬆ to go up — tap 🕊️ to drop!' : '🚶 Walking again — wheee!', 2400);
  };

  /* ---------------- start flow ---------------- */
  let started = false;
  const hadSave = load();
  $('playerNameInput').value = ABC.state.playerName;

  $('playBtn').onclick = () => {
    const nm = $('playerNameInput').value.trim();
    if (nm) ABC.state.playerName = nm;
    ABC.audio.ensureCtx();
    ABC.audio.startMusic();
    if (ABC.audio.settings.theme) ABC.world.setTheme(ABC.audio.settings.theme);
    $('titleScreen').style.display = 'none';
    $('hud').style.display = 'block';
    ABC.ui.buildHotbar();
    refreshHand();
    ABC.ui.refreshScore();
    ABC.portal.refreshChip();
    ABC.quests.refreshChip();
    ABC.activities.initShowTell(ABC.state.placedCount || 0);
    started = true;
    saveSoon();
    setTimeout(() => { $('lookHint').style.display = 'none'; }, 9000);
    if (!ABC.state.tutorialDone) {
      setTimeout(() => {
        ABC.ui.askExpressive(ABC.TUTORIAL_PROMPT, () => {
          ABC.state.tutorialDone = true;
          saveSoon();
          ABC.ui.bellaSays('YAY! Click animals to make friends, or tap 🏗️ Build Projects!', 6000);
        }, { stars: 2 });
      }, 900);
    } else {
      ABC.ui.bellaSays('Welcome back, {player}! Your world missed you! 💙', 4500);
      ABC.pet.onLogin();
      ABC.overnight.onLogin();
      // show today's three adventures for a focused start
      setTimeout(() => { if (!ABC.ui.isOpen()) ABC.quests.showBoard(); }, 9000);
      // offer a pet to kids who don't have one yet
      setTimeout(() => { if (!ABC.ui.isOpen()) ABC.pet.maybeAdoptPrompt(); }, 16000);
    }
  };
  $('howBtn').onclick = () => ABC.ui.showHelp();

  /* ---------------- skin picker (title screen) ----------------
     The smooth skin rebuilds materials/geometry/renderer at startup, so flipping
     it writes the choice and reloads — calmer than a mid-session visual pop. */
  function currentSkin() { try { return localStorage.getItem('abcSkin') === 'smooth' ? 'smooth' : 'classic'; } catch (e) { return 'classic'; } }
  function labelSkinBtn() {
    const b = $('skinBtn'); if (!b) return;
    b.textContent = currentSkin() === 'smooth' ? '✨ Look: Smooth' : '🧱 Look: Classic';
  }
  ABC.setSkin = (skin) => {
    try { localStorage.setItem('abcSkin', skin === 'smooth' ? 'smooth' : 'classic'); } catch (e) {}
    location.reload();
  };
  if ($('skinBtn')) {
    $('skinBtn').onclick = () => ABC.setSkin(currentSkin() === 'smooth' ? 'classic' : 'smooth');
    labelSkinBtn();
  }

  /* emotion spawner: gentle pace */
  setInterval(() => { if (started && !ABC.ui.isOpen()) ABC.activities.emotionTick(); }, 25000);

  /* ---------------- smooth-skin perf guard ----------------
     Sample FPS once a second; if it's low for a sustained 3s, calmly drop the
     single most expensive feature (the sun shadow) ONCE — never frame-to-frame,
     never strobing. Steps back up only on a fresh session (Settings reload). */
  let _frames = 0, _t0 = performance.now(), _lowSec = 0, _perfRung = 0;
  function sampleFPS(now) {
    if (!ABC.SMOOTH) return;                 // classic is byte-for-byte: no sampling at all
    _frames++;
    if (now - _t0 >= 1000) {
      const fps = _frames * 1000 / (now - _t0);
      _frames = 0; _t0 = now;
      window.__abcFps = Math.round(fps);
      if (ABC._noPerfGuard) return;
      // act only on a sustained 3s trend, one rung at a time, never frame-to-frame
      if (fps < 28) _lowSec++; else _lowSec = 0;
      if (_lowSec >= 3 && _perfRung < 2) {
        _lowSec = 0; _perfRung++;
        if (_perfRung === 1) {               // rung 1: drop the sun shadow + HUD blur
          renderer.shadowMap.enabled = false;
          renderer.shadowMap.needsUpdate = true;
          document.body.classList.add('perf-lite');
        } else {                             // rung 2: drop pixel ratio + the reflection env
          renderer.setPixelRatio(1.0);
          const sc = ABC.world.getScene && ABC.world.getScene();
          if (sc) sc.environment = null;
        }
        ABC.ui && ABC.ui.toast && ABC.ui.toast('✨ Smoothing things out for your device…', 2600);
      }
    }
  }

  /* ---------------- main loop ---------------- */
  let last = performance.now();
  let chunkTimer = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (started) {
      sampleFPS(now);
      chunkTimer += dt;
      if (chunkTimer > 0.3) {
        chunkTimer = 0;
        ABC.world.ensureChunks(feet.x, feet.z);
        const reg = ABC.parks.check(feet);                          // park arrival + passport
        const w = reg.weather;
        // fireflies are magical, not weather — they shine even if weather is off
        ABC.weather.setType((ABC.audio.settings.weather === false && w !== 'fireflies') ? 'clear' : w);
      }
      ABC.world.gradeFrame(feet.x, feet.z, dt);                     // color-grade the sky by region
      ABC.world.updateSun(feet.x, feet.z);                          // smooth skin: sun shadow follows you ☀️
      ABC.world.updateSky(camera.position, dt);                     // stars + Milky Way at night 🌌
      updatePlayer(dt);
      updateFly(dt);
      updateParticles(dt);
      updateFalls(dt);
      ABC.weather.update(dt, camera.position);
      ABC.shops.update(dt);
      ABC.signs.update(dt);
      ABC.animals.update(dt, now / 1000);
      ABC.pet.update(dt, feet);
      ABC.squishy.update(dt, camera);
      ABC.portal.update(dt);
      if (!ABC.ui.isOpen()) ABC.portal.checkWalkIn(feet, dt);
      // hover highlight follows the mouse
      if (!ABC.ui.isOpen() && !pDown) {
        const info = aim(hover.x, hover.y);
        if (info && info.kind === 'block') {
          hl.position.set(info.cell.x + 0.5, info.cell.y + 0.5, info.cell.z + 0.5);
          hl.visible = true;
        } else if (info && info.kind === 'ghost') {
          hl.position.copy(info.mesh.position);
          hl.visible = true;
        } else hl.visible = false;
      } else hl.visible = false;
    }
    renderer.render(scene, camera);
  }
  ABC.renderScene = () => renderer.render(scene, camera);   // fresh frame for photo snaps
  requestAnimationFrame(loop);

  // test hook: ?autostart skips the title screen (used for automated checks)
  if (location.search.includes('autostart')) setTimeout(() => $('playBtn').click(), 300);
})();
