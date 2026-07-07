/* Aaria's Block Craft 3D — wayfinding signposts 🪧: trail fingerposts at the
   edge of the home meadow. Each post shows only the few places that make sense
   from that spot — the park straight ahead plus its two neighbours — so she
   learns which direction leads where. */
ABC.signs = (function () {
  let scene = null;
  const posts = [];

  function plankTexture(emoji, name) {
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 72;
    const c = cv.getContext('2d');
    c.fillStyle = '#a9733f'; c.fillRect(0, 0, 320, 72);              // wood
    c.fillStyle = '#8a5a2b'; for (let i = 0; i < 4; i++) c.fillRect(0, i * 20, 320, 2);
    c.strokeStyle = '#5e3a18'; c.lineWidth = 5; c.strokeRect(2, 2, 316, 68);
    c.textBaseline = 'middle';
    c.font = '30px sans-serif'; c.textAlign = 'left';
    c.fillText(emoji, 14, 38);
    c.fillStyle = '#fff7e6'; c.font = 'bold 26px sans-serif';
    c.fillText(name, 60, 39);
    c.fillStyle = '#ffe066'; c.font = 'bold 34px sans-serif'; c.textAlign = 'right';
    c.fillText('►', 308, 38);                                        // points to the tip
    return new THREE.CanvasTexture(cv);
  }
  function plank(emoji, name, y) {
    // a long board whose tip (local +X) points outward toward the place
    const g = new THREE.Group();
    const tex = plankTexture(emoji, name);
    const mat = new THREE.MeshLambertMaterial({ map: tex });
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.74, 0.12), mat);
    board.position.set(1.5, y, 0);          // offset so the post is at the tail
    g.add(board);
    // a little pointed tip
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 4),
      new THREE.MeshLambertMaterial({ color: 0x8a5a2b }));
    tip.rotation.z = -Math.PI / 2; tip.position.set(3.4, y, 0);
    g.add(tip);
    return g;
  }
  function buildPost(px, pz, boards) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.34, 5, 0.34),
      new THREE.MeshLambertMaterial({ color: 0x6e4520 }));
    post.position.y = 2.5; g.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xffd43b, emissive: 0x665100 }));
    cap.position.y = 5.1; g.add(cap);
    boards.forEach((b, i) => {
      const pl = plank(b.emoji, b.name, 4.1 - i * 0.95);
      pl.rotation.y = -b.ang;               // local +X aligns to the world direction
      g.add(pl);
    });
    g.position.set(px, 0, pz);
    scene.add(ABC.world.entityShadows(g));
    posts.push({ g, x: px, z: pz });
  }

  function init(sc) { scene = sc; }
  function placeAll() {
    const parks = ABC.REGIONS.parks, N = parks.length;
    const RIM = ABC.REGIONS.HOME_R + 6;     // just outside the cozy meadow
    parks.forEach((reg, i) => {
      const ang = ((i + 0.5) / N) * Math.PI * 2 - Math.PI;   // matches park placement
      const px = Math.round(Math.cos(ang) * RIM), pz = Math.round(Math.sin(ang) * RIM);
      const left = parks[(i + N - 1) % N], right = parks[(i + 1) % N];
      const aL = ((i - 1 + 0.5) / N) * Math.PI * 2 - Math.PI;
      const aR = ((i + 1 + 0.5) / N) * Math.PI * 2 - Math.PI;
      // straight-ahead place on top, neighbours below pointing their own way
      buildPost(px, pz, [
        { emoji: reg.emoji,   name: reg.name,   ang: ang },
        { emoji: left.emoji,  name: left.name,  ang: aL },
        { emoji: right.emoji, name: right.name, ang: aR },
      ]);
    });
  }
  function update(dt) {
    for (const p of posts) {
      const tb = ABC.world.topBlock(Math.floor(p.x), Math.floor(p.z));
      if (tb) p.g.position.y += ((tb.y + 1) - p.g.position.y) * Math.min(1, dt * 4);
    }
  }
  return { init, placeAll, update };
})();
