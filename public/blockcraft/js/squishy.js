/* Aaria's Block Craft 3D — squishies: playable slime blobs & giant Oreos that live in the world.
   Poke them to squish, hold and wiggle to stretch like play-dough, carry them around.
   They are saved with the world so you can come back to them. */
ABC.squishy = (function () {
  const list = [];   // { group, data:{kind,color,mixin,cream,topping,x,z}, spring, carried }
  let scene = null;

  const SLIME_COLORS = { slimeGreen:0x7be042, slimePink:0xff8fc8, slimePurple:0xb388ff, slimeBlue:0x5dc8f5 };

  function init(sc) { scene = sc; }

  /* ---------- builders ---------- */
  function buildSlime(data) {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({
      color: SLIME_COLORS[data.color] || 0x7be042,
      transparent: true, opacity: 0.88, shininess: 90,
      specular: 0xffffff });
    // unique geometry per slime — its vertices get squished in real time
    const geo = new THREE.SphereGeometry(0.9, 22, 16);
    const blob = new THREE.Mesh(geo, mat);
    blob.scale.y = 0.72;
    blob.position.y = 0.62;
    blob.userData.isBlob = true;
    g.add(blob);
    g.userData.soft = {
      blob,
      base: geo.attributes.position.array.slice(),   // rest shape
      d: new Float32Array(geo.attributes.position.count),   // radial dent per vertex
      v: new Float32Array(geo.attributes.position.count),   // dent velocity
    };
    // googly eyes — slimes are friends too
    const eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeB = new THREE.MeshBasicMaterial({ color: 0x222222 });
    [-0.3, 0.3].forEach(x => {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), eyeW);
      w.position.set(x, 0.85, 0.72); g.add(w);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), eyeB);
      b.position.set(x, 0.85, 0.86); g.add(b);
    });
    // mix-in sparkles
    const sparkMat = new THREE.MeshBasicMaterial({
      color: data.mixin === 'Foam Beads' ? 0xffffff : 0xfff59d });
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), sparkMat);
      const a = Math.random() * Math.PI * 2, r = 0.45 + Math.random() * 0.35;
      s.position.set(Math.cos(a) * r, 0.4 + Math.random() * 0.5, Math.sin(a) * r * 0.8);
      g.add(s);
    }
    return g;
  }

  function buildOreo(data) {
    const g = new THREE.Group();
    const cookieMat = new THREE.MeshLambertMaterial({ color: 0x2b2118 });
    const creamColor = { 'Classic Vanilla': 0xfdf6e3, 'Strawberry': 0xffb3c6, 'Cool Mint': 0xa7e8bd }[data.cream] || 0xfdf6e3;
    const creamMat = new THREE.MeshLambertMaterial({ color: creamColor });
    const mk = (h, r, mat, y) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), mat);
      m.position.y = y; g.add(m); return m;
    };
    mk(0.3, 1.0, cookieMat, 0.15);
    mk(0.26, 0.94, creamMat, 0.43);
    mk(0.3, 1.0, cookieMat, 0.71);
    // bumpy cookie texture dots
    const dotMat = new THREE.MeshLambertMaterial({ color: 0x1d1610 });
    for (let i = 0; i < 14; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), dotMat);
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.8;
      d.position.set(Math.cos(a) * r, 0.88, Math.sin(a) * r);
      g.add(d);
    }
    // toppings
    const palette = data.topping === 'Choco Drizzle' ? [0x5c3a1e]
      : data.topping === 'Sugar Stars' ? [0xfff3bf, 0xffe066]
      : [0xfa5252, 0xffa94d, 0xffd43b, 0x69db7c, 0x4dabf7, 0xb197fc];
    for (let i = 0; i < 16; i++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.05),
        new THREE.MeshBasicMaterial({ color: palette[i % palette.length] }));
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.85;
      t.position.set(Math.cos(a) * r, 0.92, Math.sin(a) * r);
      t.rotation.y = Math.random() * Math.PI;
      g.add(t);
    }
    return g;
  }

  /* ---------- cookie-cutter cutouts (playdough shapes!) ---------- */
  function cutoutShape(shape) {
    const s = new THREE.Shape();
    if (shape === 'heart') {
      s.moveTo(0, -0.45);
      s.bezierCurveTo(0.55, 0.05, 0.45, 0.5, 0, 0.22);
      s.bezierCurveTo(-0.45, 0.5, -0.55, 0.05, 0, -0.45);
    } else if (shape === 'star') {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.22 : 0.52, a = i / 10 * Math.PI * 2 - Math.PI / 2;
        i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
    } else if (shape === 'flower') {
      for (let i = 0; i <= 36; i++) {
        const a = i / 36 * Math.PI * 2;
        const r = 0.38 + Math.sin(a * 6) * 0.13;            // scalloped petals
        i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
    } else {  // circle
      s.absarc(0, 0, 0.45, 0, Math.PI * 2);
    }
    return s;
  }
  function buildCutout(data) {
    const g = new THREE.Group();
    const geo = new THREE.ExtrudeGeometry(cutoutShape(data.shape),
      { depth: 0.22, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.04, bevelSegments: 2 });
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      color: data.colorHex || 0xff8fc8, shininess: 60 }));
    m.position.y = 0.16;
    g.add(m);
    return g;
  }
  /* stamp a cutter into a slime → pops out a matching dough shape */
  function stamp(target, shape) {
    if (target.data.kind !== 'slime') {
      ABC.ui.toast('🍪 The cutter works on your squishy slime!', 2600);
      return;
    }
    poke(target);
    ABC.audio.sfx.stamp();
    const p = target.group.position;
    const a = Math.random() * Math.PI * 2;
    const s = spawn({ kind: 'cutout', shape,
      colorHex: SLIME_COLORS[target.data.color] || 0xff8fc8,
      x: p.x + Math.cos(a) * 1.6, z: p.z + Math.sin(a) * 1.6 });
    s.spring.vy -= 5;   // lands with a wobble
    ABC.ui.confetti(10);
    ABC.ui.floatHearts(2);
    ABC.saveSoon && ABC.saveSoon();
    return s;
  }

  /* ---------- spawn / serialize ---------- */
  function spawn(data) {
    const g = data.kind === 'slime' ? buildSlime(data)
            : data.kind === 'cutout' ? buildCutout(data)
            : buildOreo(data);
    g.position.set(data.x, groundYAt(data.x, data.z), data.z);
    scene.add(ABC.world.entityShadows(g));
    const s = { group: g, data,
      spring: { sx: 1, sy: 1, vx: 0, vy: 0 },   // squash & stretch springs
      wobbleT: Math.random() * 10, carried: false };
    g.traverse(o => { if (o.isMesh) o.userData.squishyRef = s; });
    ABC.space && ABC.space.reserve(data.x, data.z, 2);   // 📏 breathing room
    list.push(s);
    return s;
  }
  function groundYAt(x, z) {
    for (let y = 8; y >= ABC.world.MIN_Y; y--)
      if (ABC.world.get(Math.floor(x), y, Math.floor(z))) return y + 1;
    return 1;
  }
  function serialize() { return list.map(s => s.data); }
  function deserialize(arr) {
    for (const s of list) scene.remove(s.group);
    list.length = 0;
    (arr || []).forEach(d => spawn(d));
  }

  /* ---------- play interactions (grab, pull, squish — like real slime!) ---------- */
  let lastSquelch = 0;
  function squelch(force) {
    const now = performance.now();
    if (!force && now - lastSquelch < 220) return;
    lastSquelch = now;
    ABC.audio.sfx.squish();
  }

  /* dent the jelly surface around a world-space contact point */
  function dent(s, worldPoint, power) {
    const soft = s.group.userData.soft;
    if (!soft) return;
    const local = worldPoint ? soft.blob.worldToLocal(worldPoint.clone())
                             : new THREE.Vector3(0, 0.9, 0);   // default: press the top
    const pos = soft.base, n = soft.v.length;
    for (let i = 0; i < n; i++) {
      const dx = pos[i*3] - local.x, dy = pos[i*3+1] - local.y, dz = pos[i*3+2] - local.z;
      const w = Math.max(0, 1 - Math.sqrt(dx*dx + dy*dy + dz*dz) / 1.1);
      soft.v[i] -= power * w * w;
    }
  }

  function poke(s, worldPoint) {
    if (s.data.kind === 'cutout') {           // cutouts give a firm dough bounce
      s.spring.vy -= 4; s.jiggle = 0.6;
      ABC.audio.sfx.plop();
      return;
    }
    dent(s, worldPoint, 7);                   // deep finger dent right where touched
    s.spring.vy -= (s.data.kind === 'slime' ? 4 : 8);
    s.spring.vx += 3;
    s.jiggle = 1;
    if (s.data.kind === 'slime') ABC.audio.sfx.squishBig(); else squelch(true);
    if (Math.random() < 0.3) ABC.ui.floatHearts(2);
  }
  function grab(s) {
    s.grabbed = true;
    s.dragTarget = null;
    s.spring.vy += 4;        // lifts and stretches up as you grab it
    dent(s, null, -3);       // top bulges up toward your hand
    if (s.data.kind === 'slime') ABC.audio.sfx.stretchy(); else squelch(true);
  }
  function dragTo(s, x, z) {
    if (!s.grabbed) return;
    const S = ABC.world.SIZE - 2;
    s.dragTarget = { x: Math.max(-S, Math.min(S, x)), z: Math.max(-S, Math.min(S, z)) };
  }
  /* drop a cutout onto another cutout → they stack into dough art 🎨 */
  function trySnapStack(s) {
    if (s.data.kind !== 'cutout') return false;
    let best = null, bestD = 0.9;
    for (const o of list) {
      if (o === s || o.data.kind !== 'cutout') continue;
      const d = Math.hypot(o.group.position.x - s.group.position.x,
                           o.group.position.z - s.group.position.z);
      if (d < bestD && (o.data.stackY || 0) >= (best ? best.data.stackY || 0 : -1)) { best = o; bestD = d; }
    }
    if (!best) return false;
    s.data.x = best.data.x; s.data.z = best.data.z;
    s.data.stackY = (best.data.stackY || 0) + 0.3;
    s.group.position.set(s.data.x, s.group.position.y, s.data.z);
    ABC.audio.sfx.stamp();
    ABC.ui.confetti(8);
    const height = Math.round(s.data.stackY / 0.3) + 1;
    if (height === 3) {
      setTimeout(() => ABC.ui.askBuilder(
        'You stacked your dough shapes into ART! Tell me about it:',
        'I made beautiful art with my dough shapes!',
        null, { emoji: '🎨', stars: 2 }), 500);
    } else {
      ABC.ui.toast('🎨 Stacked! Add more shapes to make dough art!', 2600);
    }
    return true;
  }

  function release(s) {
    if (!s.grabbed) return;
    s.grabbed = false;
    s.dragTarget = null;
    if (trySnapStack(s)) { ABC.saveSoon && ABC.saveSoon(); return; }
    s.data.stackY = 0;
    // plop back down with a satisfying wobble
    s.spring.vy -= 6;
    s.spring.vx += 4;
    s.jiggle = 1;
    dent(s, null, 5);          // top splats flat as it lands
    if (s.data.kind === 'slime') ABC.audio.sfx.plop(); else squelch(true);
    s.data.x = s.group.position.x;
    s.data.z = s.group.position.z;
    ABC.saveSoon && ABC.saveSoon();
  }

  /* per-frame jelly vertex integration */
  function updateSoft(s, dt, moveX, moveZ, speed) {
    const soft = s.group.userData.soft;
    if (!soft) return;
    const pos = soft.blob.geometry.attributes.position;
    const base = soft.base, d = soft.d, v = soft.v, n = v.length;
    // gooey trailing while dragged: trailing side bulges, leading side flattens
    let fx = 0, fz = 0;
    if (speed > 0.05) { fx = -moveX / (speed || 1); fz = -moveZ / (speed || 1); }
    const decay = Math.pow(0.004, dt);
    for (let i = 0; i < n; i++) {
      if (speed > 0.05) {
        const align = (base[i*3] * fx + base[i*3+2] * fz);  // + on trailing side
        v[i] += align * speed * 2.2 * dt;
      }
      v[i] += -70 * d[i] * dt;            // spring back to rest
      v[i] *= decay;                       // damping
      d[i] = Math.max(-0.55, Math.min(0.8, d[i] + v[i] * dt));
      const k = 1 + d[i];
      pos.array[i*3]   = base[i*3]   * k;
      pos.array[i*3+1] = base[i*3+1] * k;
      pos.array[i*3+2] = base[i*3+2] * k;
    }
    pos.needsUpdate = true;
    soft.blob.geometry.computeVertexNormals();
  }

  /* ---------- per-frame ---------- */
  function update(dt, camera) {
    for (const s of list) {
      const sp = s.spring;
      // damped springs toward rest scale 1
      sp.vy += (1 - sp.sy) * 60 * dt; sp.vy *= Math.pow(0.0025, dt);
      sp.vx += (1 - sp.sx) * 60 * dt; sp.vx *= Math.pow(0.0025, dt);
      sp.sy = Math.max(0.22, Math.min(2.4, sp.sy + sp.vy * dt));
      sp.sx = Math.max(0.4,  Math.min(2.6, sp.sx + sp.vx * dt));
      s.wobbleT += dt;
      s.jiggle = Math.max(0, (s.jiggle || 0) - dt * 1.4);

      let speed = 0, mvX = 0, mvZ = 0;
      if (s.grabbed && s.dragTarget) {
        // slime chases your finger with gooey lag, stretching as it goes
        const g = s.group;
        const dx = s.dragTarget.x - g.position.x, dz = s.dragTarget.z - g.position.z;
        const dist = Math.hypot(dx, dz);
        speed = dist; mvX = dx; mvZ = dz;
        const step = Math.min(1, dt * 7);
        g.position.x += dx * step;
        g.position.z += dz * step;
        const gy = groundYAt(g.position.x, g.position.z) + (s.data.stackY || 0);
        g.position.y += ((gy + 0.18) - g.position.y) * Math.min(1, dt * 8);  // slight lift while held
        if (dist > 0.15) {
          g.rotation.y = Math.atan2(dx, dz);          // face the pull direction
          squelch();                                   // gooey squelches while dragging
        }
        // lean into the pull
        g.rotation.z = Math.max(-0.4, Math.min(0.4, -dx * 0.12));
        g.rotation.x = Math.max(-0.4, Math.min(0.4,  dz * 0.12));
      } else {
        const g = s.group;
        g.rotation.z *= Math.pow(0.01, dt);
        g.rotation.x *= Math.pow(0.01, dt);
        const gy = groundYAt(g.position.x, g.position.z) + (s.data.stackY || 0);
        g.position.y += (gy - g.position.y) * Math.min(1, dt * 6);
      }

      // squash & stretch: held = taller and thinner; dragging = stretched along motion
      const pull = s.grabbed ? Math.min(1.2, 0.25 + speed * 0.35) : 0;
      const idle = 1 + Math.sin(s.wobbleT * 3) * 0.025                 // gentle breathing
                 + (s.jiggle ? Math.sin(s.wobbleT * 26) * 0.16 * s.jiggle : 0);  // post-poke jelly wobble
      const sx = sp.sx * idle * (1 + pull * 0.35);
      const sy = (sp.sy / Math.sqrt(sp.sx)) * (s.grabbed ? 1.25 + pull * 0.3 : 1);
      s.group.scale.set(sx, sy * idle, sx);
      updateSoft(s, dt, mvX, mvZ, speed);    // jelly surface ripples
    }
  }

  function meshTargets() {
    const out = [];
    for (const s of list) s.group.traverse(o => { if (o.isMesh) out.push(o); });
    return out;
  }

  return { init, spawn, update, poke, grab, dragTo, release, stamp,
           serialize, deserialize, meshTargets, list };
})();
