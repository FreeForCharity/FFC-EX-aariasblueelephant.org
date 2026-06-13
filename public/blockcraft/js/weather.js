/* Aaria's Block Craft 3D — gentle weather 🌦️: rain, snow, drifting dust,
   rising geyser steam, soft mist. Always calm — no thunder, no flashes. */
ABC.weather = (function () {
  let scene = null, pts = null, geo = null, mat = null, pos = null, type = 'clear';
  const N = 340, BOX = 30, TOP = 22;

  function init(sc) {
    scene = sc;
    pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i*3] = (Math.random()*2-1)*BOX;
      pos[i*3+1] = Math.random()*TOP;
      pos[i*3+2] = (Math.random()*2-1)*BOX;
    }
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    mat = new THREE.PointsMaterial({ size: 0.35, transparent: true, opacity: 0.8,
      depthWrite: false, color: 0xffffff, sizeAttenuation: true });
    pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.visible = false;
    scene.add(pts);
  }

  const CFG = {
    clear: null,
    rain:  { color: 0xaccbff, size: 0.16, vy: -24, sway: 0,   vx: 0,   op: 0.55 },
    snow:  { color: 0xffffff, size: 0.42, vy: -3.0, sway: 1.5, vx: 0,   op: 0.95 },
    dust:  { color: 0xe2caa0, size: 0.28, vy: -0.5, sway: 0,   vx: 5.5, op: 0.45 },
    steam: { color: 0xffffff, size: 0.6,  vy: 3.2,  sway: 0.7, vx: 0,   op: 0.4  },
    mist:  { color: 0xeaf2f5, size: 0.95, vy: 0.2,  sway: 0.3, vx: 1.4, op: 0.38 },
    fireflies: { color: 0xfff07a, size: 0.34, vy: 0.5, sway: 1.6, vx: 0.5, op: 0.95, glow: true },
  };

  function setType(tp) {
    if (tp === type || !pts) return;
    type = tp;
    const c = CFG[tp];
    if (!c) { pts.visible = false; return; }
    pts.visible = true;
    mat.color.set(c.color); mat.size = c.size; mat.opacity = c.op;
    mat.blending = c.glow ? THREE.AdditiveBlending : THREE.NormalBlending;
    mat.needsUpdate = true;
  }

  function update(dt, cam) {
    if (!pts || !pts.visible) return;
    const c = CFG[type]; if (!c) return;
    const cx = cam.x, cy = cam.y, cz = cam.z;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      pos[j+1] += c.vy * dt;
      if (c.glow) pos[j+1] += Math.sin((pos[j] + pos[j+2] + i) * 0.7) * 1.2 * dt;  // fireflies bob
      if (c.sway) { pos[j] += Math.sin((pos[j+1] + i) * 1.5) * c.sway * dt;
                    pos[j+2] += Math.cos((pos[j+1] + i) * 1.3) * c.sway * dt; }
      if (c.vx) pos[j] += c.vx * dt;
      const off = pos[j+1] < cy - 4 || pos[j+1] > cy + TOP ||
                  Math.abs(pos[j] - cx) > BOX || Math.abs(pos[j+2] - cz) > BOX;
      if (off) {
        pos[j]   = cx + (Math.random()*2-1) * BOX;
        pos[j+2] = cz + (Math.random()*2-1) * BOX;
        pos[j+1] = c.vy > 0 ? cy - 3 + Math.random()*3 : cy + TOP * Math.random();
      }
    }
    geo.attributes.position.needsUpdate = true;
  }

  return { init, setType, update, serialize: () => ({}), deserialize: () => {} };
})();
