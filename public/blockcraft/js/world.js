/* Aaria's Block Craft 3D — voxel world engine (Three.js r128) */
ABC.world = (function () {
  const SIZE = 48;            // world extends -SIZE..SIZE in x,z
  const MAX_Y = 40;
  const MIN_Y = -3;           // diggable underground: -1,-2 dirt, -3 stone

  let scene, materials = {}, meshes = {}, dirty = new Set(), underMesh = null;
  let blockGeo = null;
  const map = new Map();      // "x,y,z" -> type
  const rotMap = new Map();   // "x,y,z" -> 0..3 quarter-turns (rotating shapes only)
  const key = (x,y,z) => x + ',' + y + ',' + z;

  /* ---------- canvas textures ---------- */
  function makeTexture(def) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = def.color; g.fillRect(0,0,64,64);
    const rnd = mulberry(def.color.length * 7 + (def.pat||'').length * 13);
    switch (def.pat) {
      case 'speck':
        g.fillStyle = def.speck || 'rgba(0,0,0,.15)';
        for (let i=0;i<46;i++) g.fillRect((rnd()*60)|0, (rnd()*60)|0, 3+rnd()*3, 3+rnd()*3);
        break;
      case 'rings':
        g.strokeStyle = 'rgba(60,35,10,.5)'; g.lineWidth = 3;
        for (let r=6;r<46;r+=9) { g.beginPath(); g.arc(32,32,r,0,7); g.stroke(); }
        break;
      case 'planks':
        g.strokeStyle = 'rgba(90,55,20,.55)'; g.lineWidth = 3;
        for (let y=0;y<=64;y+=16) { g.beginPath(); g.moveTo(0,y); g.lineTo(64,y); g.stroke(); }
        g.beginPath(); g.moveTo(20,0); g.lineTo(20,16); g.moveTo(44,16); g.lineTo(44,32);
        g.moveTo(20,32); g.lineTo(20,48); g.moveTo(44,48); g.lineTo(44,64); g.stroke();
        break;
      case 'bricks':
        g.strokeStyle = '#f0e0d0'; g.lineWidth = 4;
        for (let y=0;y<=64;y+=16) { g.beginPath(); g.moveTo(0,y); g.lineTo(64,y); g.stroke(); }
        for (let row=0;row<4;row++) { const off = row%2?16:0;
          for (let x=off;x<=64;x+=32) { g.beginPath(); g.moveTo(x,row*16); g.lineTo(x,row*16+16); g.stroke(); } }
        break;
      case 'glass':
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
        g.strokeRect(3,3,58,58);
        g.beginPath(); g.moveTo(10,54); g.lineTo(54,10); g.moveTo(20,58); g.lineTo(58,20); g.stroke();
        break;
      case 'flowers':
        for (let i=0;i<6;i++) { const x=8+rnd()*48, y=8+rnd()*48;
          g.fillStyle = ['#ff6b9d','#ffd43b','#b197fc','#ff8787'][i%4];
          for (let p=0;p<5;p++){ const a=p/5*6.28; g.beginPath(); g.arc(x+Math.cos(a)*5,y+Math.sin(a)*5,3.4,0,7); g.fill(); }
          g.fillStyle = '#fff'; g.beginPath(); g.arc(x,y,3,0,7); g.fill(); }
        break;
      case 'rainbow': {
        const cols = ['#ff5e7e','#ffa94d','#ffd43b','#69db7c','#4dabf7','#b197fc'];
        cols.forEach((c,i)=>{ g.fillStyle=c; g.fillRect(0,i*11,64,11); });
        break; }
      case 'stars':
        g.fillStyle = 'rgba(255,255,255,.9)';
        for (let i=0;i<8;i++) { const x=6+rnd()*52, y=6+rnd()*52, s=2+rnd()*3;
          g.beginPath(); g.moveTo(x,y-s*2); g.lineTo(x+s,y); g.lineTo(x,y+s*2); g.lineTo(x-s,y); g.fill(); }
        break;
      case 'waves':
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3;
        for (let y=10;y<64;y+=14) { g.beginPath();
          for (let x=0;x<=64;x+=4) g.lineTo(x, y + Math.sin(x/8)*4); g.stroke(); }
        break;
      case 'slime':
        g.fillStyle = 'rgba(255,255,255,.4)';
        for (let i=0;i<10;i++) { g.beginPath(); g.arc(6+rnd()*52, 6+rnd()*52, 2+rnd()*5, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(18,16,7,0,7); g.fill();
        break;
      case 'oreo':
        g.fillStyle = '#1d1610'; g.fillRect(0,0,64,64);
        g.fillStyle = '#fdf6e3'; g.fillRect(0,24,64,16);
        g.fillStyle = '#3a2c20';
        for (let i=0;i<12;i++) { g.beginPath(); g.arc(5+rnd()*54, (rnd()<.5?2+rnd()*18:44+rnd()*18), 2.5, 0, 7); g.fill(); }
        break;
      case 'oreoPink':
        g.fillStyle = '#1d1610'; g.fillRect(0,0,64,64);
        g.fillStyle = '#ffb3c6'; g.fillRect(0,24,64,16);
        g.fillStyle = '#3a2c20';
        for (let i=0;i<12;i++) { g.beginPath(); g.arc(5+rnd()*54, (rnd()<.5?2+rnd()*18:44+rnd()*18), 2.5, 0, 7); g.fill(); }
        break;
      case 'door':
        g.fillStyle = '#6e4520'; g.fillRect(0,0,64,64);
        g.strokeStyle = '#4a2d12'; g.lineWidth = 4;
        g.strokeRect(8,6,48,52); g.strokeRect(14,12,36,18); g.strokeRect(14,36,36,18);
        g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(50,34,5,0,7); g.fill();  // golden knob
        g.strokeStyle = '#b8860b'; g.lineWidth = 2; g.beginPath(); g.arc(50,34,5,0,7); g.stroke();
        break;
    }
    // subtle block border for the voxel look
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 4; g.strokeRect(0,0,64,64);
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }
  function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

  /* ---------- shaped block geometries ---------- */
  function wedgeGeo() {
    // a right-triangle ramp: full at -z, slopes down toward +z
    const g = new THREE.BufferGeometry();
    const v = [ // x,y,z triplets — two triangle sides + slope + bottom + back
      -.5,-.5,-.5,  .5,-.5,-.5,  .5,.5,-.5,   -.5,-.5,-.5,  .5,.5,-.5,  -.5,.5,-.5,   // back face
      -.5,-.5,-.5, -.5,.5,-.5,  -.5,-.5,.5,                                            // left tri
       .5,-.5,-.5,  .5,-.5,.5,   .5,.5,-.5,                                            // right tri
      -.5,.5,-.5,   .5,.5,-.5,   .5,-.5,.5,   -.5,.5,-.5,  .5,-.5,.5,  -.5,-.5,.5,    // slope
      -.5,-.5,-.5, -.5,-.5,.5,   .5,-.5,.5,   -.5,-.5,-.5,  .5,-.5,.5,  .5,-.5,-.5,   // bottom
    ];
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const uv = [];
    for (let i = 0; i < v.length / 3; i++) uv.push((v[i*3]+0.5), (v[i*3+1]+0.5));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function geoFor(def) {
    switch (def.shape) {
      case 'slab':   return new THREE.BoxGeometry(1, 0.5, 1).translate(0, -0.25, 0);
      case 'wedge':  return wedgeGeo();
      case 'pillar': return new THREE.CylinderGeometry(0.42, 0.42, 1, 14);
      case 'pane':   return new THREE.BoxGeometry(1, 1, 0.14);
      case 'knob':   return new THREE.BoxGeometry(0.3, 0.3, 0.3);
      default:       return blockGeo;
    }
  }

  /* ---------- mesh management (capacity grows on demand) ---------- */
  function newMesh(id, cap) {
    const m = new THREE.InstancedMesh(geoFor(ABC.BLOCK_DEFS[id]), materials[id], cap);
    m.count = 0;
    m.userData.type = id;
    m.userData.positions = [];
    m.frustumCulled = false;
    scene.add(m);
    return m;
  }
  function initMeshes() {
    blockGeo = new THREE.BoxGeometry(1,1,1);
    for (const [id, def] of Object.entries(ABC.BLOCK_DEFS)) {
      const mat = new THREE.MeshLambertMaterial({ map: makeTexture(def) });
      if (def.alpha != null) { mat.transparent = true; mat.opacity = def.alpha; }
      if (def.glow) mat.emissive = new THREE.Color(0xffe066), mat.emissiveIntensity = 0.6;
      materials[id] = mat;
      meshes[id] = newMesh(id, 512);
    }
  }

  const _m4 = new THREE.Matrix4();
  function rebuild(type) {
    let m = meshes[type];
    const pos = [], keys = [];
    for (const [k, t] of map) if (t === type) {
      const [x,y,z] = k.split(',').map(Number);
      pos.push([x,y,z]); keys.push(k);
    }
    if (pos.length > m.instanceMatrix.count) {       // grow capacity
      scene.remove(m);
      let cap = m.instanceMatrix.count;
      while (cap < pos.length) cap *= 2;
      m = meshes[type] = newMesh(type, cap);
    }
    m.count = pos.length;
    const slabOff = ABC.BLOCK_DEFS[type].shape === 'slab' ? 0 : 0;  // slab geo already offset
    for (let i=0;i<m.count;i++) {
      const rot = rotMap.get(keys[i]) || 0;
      _m4.makeRotationY(rot * Math.PI / 2);
      _m4.setPosition(pos[i][0]+0.5, pos[i][1]+0.5 + slabOff, pos[i][2]+0.5);
      m.setMatrixAt(i, _m4);
    }
    m.userData.positions = pos;
    m.instanceMatrix.needsUpdate = true;
  }
  function flush() { for (const t of dirty) rebuild(t); dirty.clear(); }

  function inBounds(x,y,z) { return Math.abs(x)<=SIZE && Math.abs(z)<=SIZE && y>=MIN_Y && y<=MAX_Y; }
  function get(x,y,z) { return map.get(key(x,y,z)) || null; }
  function set(x,y,z,type,rot) {
    if (!inBounds(x,y,z)) return false;
    const k = key(x,y,z);
    const old = map.get(k);
    if (old === type && (rotMap.get(k)||0) === (rot||0)) return false;
    if (old) dirty.add(old);
    map.set(k, type);
    if (rot) rotMap.set(k, rot); else rotMap.delete(k);
    dirty.add(type);
    return true;
  }
  function remove(x,y,z) {
    if (y === MIN_Y) return false;        // the deepest stone is bedrock — keeps the world cozy
    const k = key(x,y,z);
    const old = map.get(k);
    if (!old) return false;
    map.delete(k);
    rotMap.delete(k);
    dirty.add(old);
    return true;
  }

  /* ---------- world generation ---------- */
  let defaultMap;  // key -> type as generated (for save diffing)
  function generate() {
    for (let x=-SIZE;x<=SIZE;x++) for (let z=-SIZE;z<=SIZE;z++) {
      set(x,0,z,'grass');                 // surface you can dig through…
      set(x,-1,z,'dirt'); set(x,-2,z,'dirt');
      set(x,-3,z,'stone');                // …down to stone
    }
    const rnd = mulberry(20260611);
    const tree = (x,z) => {
      const h = 3 + (rnd()*2|0);
      for (let y=1;y<=h;y++) set(x,y,z,'wood');
      for (let dx=-2;dx<=2;dx++) for (let dz=-2;dz<=2;dz++) for (let dy=0;dy<=2;dy++) {
        if (Math.abs(dx)+Math.abs(dz)+dy < 4) set(x+dx,h+dy,z+dz,'leaf');
      }
    };
    [[-22,8],[24,14],[18,-26],[-30,-18],[34,30],[-36,26],[8,34],[-12,-34]].forEach(p=>tree(p[0],p[1]));
    // flower patches
    for (let i=0;i<14;i++) {
      const cx = (rnd()*90-45)|0, cz = (rnd()*90-45)|0;
      for (let j=0;j<4;j++) set(cx+(rnd()*3|0), 1, cz+(rnd()*3|0), 'flower');
    }
    // little pond
    for (let x=-8;x<=-4;x++) for (let z=24;z<=28;z++) set(x,0,z,'water');
    // welcome rainbow arch near spawn
    const arch = [[-3,1],[-3,2],[-3,3],[-2,4],[-1,5],[0,5],[1,5],[2,4],[3,3],[3,2],[3,1]];
    arch.forEach(([x,y])=>set(x,y,-6,'rainbow'));
    // little blue elephant garden by the arch (mascot corner 🐘💙)
    [[6,-6],[7,-6],[6,-7]].forEach(([x,z])=>{ set(x,1,z,'blue'); });
    set(6,2,-6,'blue'); set(6,3,-6,'star');

    // ✨ SECRET SKY ISLAND — reached through the magic wormhole
    const IC = 36, IY = 24;          // island center & height
    for (let x=IC-6;x<=IC+6;x++) for (let z=IC-6;z<=IC+6;z++) {
      const d = Math.hypot(x-IC, z-IC);
      if (d <= 6) set(x, IY, z, d > 4.6 ? 'snow' : 'grass');   // cloud rim, grassy middle
      if (d <= 3) set(x, IY-1, z, 'snow');                      // fluffy underside
    }
    // rainbow ring centerpiece + star treasures + candy flowers
    const ring = [[-2,1],[-2,2],[-1,3],[0,3],[1,3],[2,2],[2,1]];
    ring.forEach(([dx,dy])=>set(IC+dx, IY+dy, IC, 'rainbow'));
    [[-3,-3],[3,-3],[-3,3],[3,3]].forEach(([dx,dz])=>set(IC+dx, IY+1, IC+dz, 'star'));
    [[-1,-2],[1,-2],[0,2],[-2,0],[2,0]].forEach(([dx,dz])=>set(IC+dx, IY+1, IC+dz, 'flower'));
    set(IC, IY+1, IC-3, 'oreo'); set(IC-1, IY+1, IC-3, 'slimePink');   // sweet surprises
    flush();
    defaultMap = new Map(map);   // snapshot for save diffing
  }

  /* ---------- scene setup ---------- */
  function initScene(renderer) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fdcff);
    scene.fog = new THREE.Fog(0x9fdcff, 60, 140);
    const sun = new THREE.DirectionalLight(0xfff7e0, 0.95);
    sun.position.set(40, 80, 25);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xcfe8ff, 0.75));
    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x7ed957, 0.35);
    scene.add(hemi);
    // dark base far below the bedrock layer
    underMesh = new THREE.Mesh(
      new THREE.BoxGeometry(SIZE*2+1, 1, SIZE*2+1),
      new THREE.MeshLambertMaterial({ color: 0x4a4036 }));
    underMesh.position.set(0, MIN_Y - 0.51, 0);
    scene.add(underMesh);
    // fluffy clouds
    const cloudMat = new THREE.MeshLambertMaterial({ color:0xffffff, transparent:true, opacity:.85 });
    const rnd = mulberry(7);
    for (let i=0;i<10;i++) {
      const c = new THREE.Group();
      for (let j=0;j<5;j++) {
        const s = 3+rnd()*4;
        const b = new THREE.Mesh(new THREE.BoxGeometry(s,1.6,s*0.7), cloudMat);
        b.position.set(rnd()*8-4, rnd()*0.8, rnd()*4-2);
        c.add(b);
      }
      c.position.set(rnd()*200-100, 32+rnd()*8, rnd()*200-100);
      scene.add(c);
    }
    // sun ball
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshBasicMaterial({ color:0xffe45e }));
    sunBall.position.set(70, 60, -80);
    scene.add(sunBall);
    initMeshes();
    return scene;
  }

  /* ---------- save / load (diff against the generated world) ---------- */
  function serialize() {
    const diffs = [];
    for (const [k,t] of map) {
      const r = rotMap.get(k) || 0;
      if (defaultMap.get(k) !== t || r) diffs.push(k + ':' + t + (r ? ':' + r : ''));
    }
    const removed = [];
    for (const k of defaultMap.keys()) if (!map.has(k)) removed.push(k);
    return { d: diffs, r: removed };
  }
  function deserialize(data) {
    if (!data) return;
    map.clear(); rotMap.clear();
    for (const [k,t] of defaultMap) map.set(k, t);
    for (const k of (data.r||[])) map.delete(k);
    for (const e of (data.d||[])) {
      const parts = e.split(':');            // "x,y,z" ":type" [":rot"]
      const k = parts[0], t = parts[1], r = +parts[2] || 0;
      if (ABC.BLOCK_DEFS[t]) { map.set(k, t); if (r) rotMap.set(k, r); }
    }
    for (const t of Object.keys(meshes)) dirty.add(t);
    flush();
  }

  function blockMeshes() { return Object.values(meshes); }

  return { SIZE, MAX_Y, MIN_Y, initScene, generate, get, set, remove, flush, key,
           blockMeshes, serialize, deserialize, materials,
           getScene: () => scene };
})();
