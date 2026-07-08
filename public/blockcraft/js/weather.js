/* Aaria's Block Craft 3D — gentle weather 🌦️: rain, snow, drifting dust,
   rising geyser steam, soft mist. Always calm — no thunder, no flashes. */
ABC.weather = (function () {
  let scene = null, pts = null, geo = null, mat = null, pos = null, type = 'clear';
  const N = 340, BOX = 30, TOP = 22;

  /* modern: falling rain is a thin vertical STREAK, not a square dot */
  let streakTex = null, splashPts = null, splashPos = null, splashAge = null;
  const NSPLASH = 90;
  function makeStreakTex() {
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 64;
    const g = cv.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.35, 'rgba(255,255,255,.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = grad; g.lineWidth = 4.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(8, 3); g.lineTo(8, 61); g.stroke();
    const t = new THREE.CanvasTexture(cv);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
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
    pts.userData.noAO = true;
    scene.add(pts);
    if (ABC.MODERN) {
      streakTex = makeStreakTex();
      // little crowns of spray where drops hit the ground
      splashPos = new Float32Array(NSPLASH * 3); splashAge = new Float32Array(NSPLASH);
      for (let i = 0; i < NSPLASH; i++) { splashPos[i*3+1] = -99; splashAge[i] = Math.random() * 0.4; }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(splashPos, 3));
      splashPts = new THREE.Points(sg, new THREE.PointsMaterial({
        color: 0xdfeeff, size: 0.14, transparent: true, opacity: 0.75, depthWrite: false }));
      splashPts.frustumCulled = false; splashPts.visible = false;
      splashPts.userData.noAO = true;
      scene.add(splashPts);
    }
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
    if (splashPts) splashPts.visible = ABC.MODERN && tp === 'rain';
    if (!c) { pts.visible = false; return; }
    pts.visible = true;
    mat.color.set(c.color); mat.size = c.size; mat.opacity = c.op;
    if (ABC.MODERN && streakTex) {              // modern rain falls in streaks
      mat.map = tp === 'rain' ? streakTex : null;
      if (tp === 'rain') { mat.size = 1.5; mat.opacity = 0.8; mat.color.set(0xd8e8ff); }
    }
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
    // modern rain: recycle spray crowns on whatever surface is under them
    if (splashPts && splashPts.visible) {
      for (let i = 0; i < NSPLASH; i++) {
        splashAge[i] -= dt;
        if (splashAge[i] <= 0) {
          splashAge[i] = 0.16 + Math.random() * 0.3;
          const sx = cx + (Math.random() * 2 - 1) * (BOX - 4);
          const sz = cz + (Math.random() * 2 - 1) * (BOX - 4);
          const tb = ABC.world.topBlock ? ABC.world.topBlock(Math.floor(sx), Math.floor(sz)) : null;
          splashPos[i*3] = sx;
          splashPos[i*3+1] = (tb ? tb.y + 1 : 0) + 0.08;
          splashPos[i*3+2] = sz;
        }
      }
      splashPts.geometry.attributes.position.needsUpdate = true;
    }
  }

  return { init, setType, update, current: () => type, serialize: () => ({}), deserialize: () => {} };
})();
