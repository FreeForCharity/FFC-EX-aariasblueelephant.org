/* Aaria's Block Craft 3D — village & park shops 🏪: a home village cluster plus
   a themed trading post in every region, each with a vendor who sells food,
   water & treats for stars. Buying is the polite-words practice (ask/pay/thanks). */
ABC.shops = (function () {
  let scene = null;
  const stalls = [];

  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function awning(c1, c2) {
    const g = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: 0x8a5a2b });
    const post = (x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2, 0.22), wood); m.position.set(x, 1, z); g.add(m); };
    post(-1.6, -1.1); post(1.6, -1.1); post(-1.6, 1.1); post(1.6, 1.1);
    const cnt = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.6), wood); cnt.position.set(0, 0.8, 1.2); g.add(cnt);
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 2.8),
        new THREE.MeshLambertMaterial({ color: i % 2 ? c1 : c2 }));
      m.position.set(-1.44 + i * 0.72, 2.15, 0); m.rotation.x = -0.18; g.add(m);
    }
    return g;
  }
  function sign(name) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const x = cv.getContext('2d');
    x.fillStyle = 'rgba(255,255,255,.95)'; roundRect(x, 8, 6, 240, 84, 18); x.fill();
    x.strokeStyle = '#ffd43b'; x.lineWidth = 5; x.stroke();
    x.textAlign = 'center';
    x.fillStyle = '#1d4ed8'; x.font = 'bold 34px sans-serif'; x.fillText('🏪 Shop', 128, 44);
    x.fillStyle = '#333'; x.font = '22px sans-serif'; x.fillText(name, 128, 78);
    const tex = new THREE.CanvasTexture(cv);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(4.2, 2.1, 1);
    return sp;
  }
  function place(px, pz, name, c1, c2) {
    const g = awning(c1, c2); g.position.set(px, 1, pz); scene.add(g);
    const s = sign(name); s.position.set(px, 4.4, pz); scene.add(s);
    stalls.push({ g, s, x: px, z: pz });
  }
  function vendor(s, vx, vz) {
    const v = ABC.animals.spawn(s.animal, vx, vz, s.name);
    v.isVendor = true; v.shopGoods = s.goods; v.home = { x: vx, z: vz }; v.range = 2;
    return v;
  }

  function init(sc) { scene = sc; }
  function placeAll() {
    // 🏘️ home village — a cozy cluster of stalls near spawn
    ['home1', 'home2', 'home3'].forEach(k => {
      const s = ABC.SHOPS[k]; if (!s) return;
      vendor(s, s.at.x + 1, s.at.z + 1);
      place(s.at.x, s.at.z, s.name, 0xff6b6b, 0xffffff);
    });
    // 🏞️ one themed trading post at the centre of each park's compass slice
    const parks = ABC.REGIONS.parks, R = 205;
    parks.forEach((reg, i) => {
      const s = ABC.SHOPS[reg.key]; if (!s) return;
      const ang = ((i + 0.5) / parks.length) * Math.PI * 2 - Math.PI;
      const x = Math.round(Math.cos(ang) * R), z = Math.round(Math.sin(ang) * R);
      vendor(s, x + 1, z + 1);
      place(x, z, s.name, 0x69b3ff, 0xffffff);
    });
  }
  function update(dt) {
    // settle each stall + sign onto the ground once nearby chunks generate
    for (const st of stalls) {
      const tb = ABC.world.topBlock(Math.floor(st.x), Math.floor(st.z));
      if (tb) {
        const gy = tb.y + 1;
        st.g.position.y += (gy - st.g.position.y) * Math.min(1, dt * 4);
        st.s.position.y = st.g.position.y + 3.4;
      }
    }
  }
  return { init, placeAll, update };
})();
