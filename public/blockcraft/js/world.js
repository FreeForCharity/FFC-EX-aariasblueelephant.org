/* Aaria's Block Craft 3D — voxel world engine (Three.js r128) */
ABC.world = (function () {
  /* ---------- selectable skin ----------
     'smooth' = the elevated, premium "Block Craft" look (beveled blocks, soft PBR
     materials, gentle shadows, gradient sky). Read ONCE at load so every material,
     geometry and renderer setting is built for the chosen skin. Classic is the
     default and is left byte-for-byte unchanged (the `else` branch everywhere). */
  const SMOOTH = (function () {
    // Smooth is the DEFAULT look now; only an explicit 'classic' opts out.
    try { return localStorage.getItem('abcSkin') !== 'classic'; } catch (e) { return true; }
  })();
  ABC.SMOOTH = SMOOTH;        // expose so main.js / ui.js read the SAME value

  const SIZE = 4000;          // soft travel limit — the world generates forever as you walk
  const MAX_Y = 40;
  const MIN_Y = -2;           // dig through grass and dirt down to bedrock stone

  let scene, materials = {}, meshes = {}, dirty = new Set(), underMesh = null;
  let blockGeo = null;
  let _maxAniso = 1, _sky = null, _shadowR = 32;   // smooth-skin render state
  const map = new Map();      // "x,y,z" -> type
  const rotMap = new Map();   // "x,y,z" -> 0..3 quarter-turns (rotating shapes only)
  const key = (x,y,z) => x + ',' + y + ',' + z;

  /* ---------- canvas textures ---------- */
  function makeTexture(def) {
    const S = SMOOTH ? 128 : 64;            // smooth skin paints at 2x for crisp, soft sampling
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    if (SMOOTH) { g.save(); g.scale(S/64, S/64); }   // pattern art below is authored in 64px space
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
    if (SMOOTH) {
      g.restore();                          // back to 128px space for the soft finishing passes
      // (A) soft top-light gradient — gives every face a gentle lit-to-shadow shade
      const lg = g.createLinearGradient(0,0,0,S);
      lg.addColorStop(0,   'rgba(255,255,255,0.16)');
      lg.addColorStop(0.5, 'rgba(255,255,255,0)');
      lg.addColorStop(1,   'rgba(0,0,0,0.10)');
      g.fillStyle = lg; g.fillRect(0,0,S,S);
      // (B) gentle corner ambient-occlusion vignette — REPLACES the hard black outline
      const rg = g.createRadialGradient(S/2,S/2,S*0.30, S/2,S/2,S*0.74);
      rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.13)');
      g.fillStyle = rg; g.fillRect(0,0,S,S);
    } else {
      // subtle block border for the classic voxel look (unchanged)
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 4; g.strokeRect(0,0,64,64);
    }
    const tex = new THREE.CanvasTexture(cv);
    if (SMOOTH) {
      tex.encoding = THREE.sRGBEncoding;            // required once renderer outputEncoding=sRGB
      tex.magFilter = THREE.LinearFilter;           // SOFT, not pixelated
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      tex.anisotropy = Math.min(8, _maxAniso);      // crisp at grazing angles, no shimmer
    } else {
      tex.magFilter = THREE.NearestFilter;
    }
    tex.needsUpdate = true;
    return tex;
  }
  function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

  /* ============================================================
     SMOOTH SKIN render helpers — only used when SMOOTH is true.
     ============================================================ */

  /* Beveled unit cube (r128 has no RoundedBoxGeometry). Soft, light-catching
     edges like the app icon. Outputs a plain BufferGeometry safe for InstancedMesh. */
  function roundedBoxGeo(size, radius, segments) {
    size = size || 1; radius = radius || 0.07; segments = segments || 1;
    radius = Math.min(radius, size / 2);
    const half = size / 2, seg = segments * 2 + 1;
    const box = new THREE.BoxGeometry(size, size, size, seg, seg, seg);
    box.deleteAttribute('normal'); box.deleteAttribute('uv');
    const g = box.toNonIndexed();
    const pos = g.attributes.position, inner = half - radius;
    const v = new THREE.Vector3(), n = new THREE.Vector3(), dir = new THREE.Vector3();
    const normals = new Float32Array(pos.count * 3);
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      n.set(Math.max(-inner, Math.min(inner, v.x)),
            Math.max(-inner, Math.min(inner, v.y)),
            Math.max(-inner, Math.min(inner, v.z)));
      dir.copy(v).sub(n);
      if (dir.lengthSq() < 1e-10) dir.copy(v);
      dir.normalize();
      pos.setXYZ(i, n.x + dir.x * radius, n.y + dir.y * radius, n.z + dir.z * radius);
      normals[i*3] = dir.x; normals[i*3+1] = dir.y; normals[i*3+2] = dir.z;
      const ax = Math.abs(dir.x), ay = Math.abs(dir.y), az = Math.abs(dir.z);
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      let u, w;
      if (ax >= ay && ax >= az) { u = pz; w = py; }
      else if (ay >= ax && ay >= az) { u = px; w = pz; }
      else { u = px; w = py; }
      uvs[i*2] = u / size + 0.5; uvs[i*2+1] = w / size + 0.5;
    }
    g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    pos.needsUpdate = true;
    g.computeBoundingSphere();              // the shadow path consults this
    return g;
  }

  /* A cheap procedural environment: a sky→horizon→ground gradient run through
     PMREM so blocks pick up soft daylight fill + a faint sheen. No asset fetch.
     Built ONCE at load (the generator is the costly part) then disposed. */
  function makeEnvironment(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 128;
    const c = cv.getContext('2d');
    const grad = c.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0.00, '#eaf4ff');     // zenith
    grad.addColorStop(0.45, '#cfe6ff');     // sky
    grad.addColorStop(0.50, '#dfe6ea');     // horizon haze (neutral, not green)
    grad.addColorStop(0.56, '#b9bdc0');     // ground near — soft gray so it doesn't tint snow/sand
    grad.addColorStop(1.00, '#8a8f92');     // ground (neutral)
    c.fillStyle = grad; c.fillRect(0, 0, 16, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose(); tex.dispose();
    return env;
  }

  /* Soft matte PBR block; glassy blocks (water/glass/ice) get a wet catch-light. */
  function makeBlockMaterial(def) {
    const map = makeTexture(def);           // already sRGB-encoded + mipmapped in SMOOTH
    const glassy = def.alpha != null;       // every see-through block already sets alpha
    const m = new THREE.MeshStandardMaterial({
      map,
      roughness: glassy ? 0.14 : 0.92,
      metalness: 0.0,                       // voxels are never metallic
      envMapIntensity: glassy ? 0.8 : 0.32, // gentle fill; low on matte so the neutral env doesn't tint snow/sand
    });
    if (def.alpha != null) { m.transparent = true; m.opacity = def.alpha; }
    if (def.glow) { m.emissive = new THREE.Color(0xffe066); m.emissiveIntensity = 0.6; m.roughness = 0.6; }
    return m;
  }

  /* Vertical gradient sky dome — beats a flat background color. Raw shader (no
     chunk injection) so it's robust across THREE builds. Colors are graded by
     region each frame in gradeTo so dusk/night look right too. */
  function makeSky() {
    const geo = new THREE.SphereGeometry(280, 32, 16);   // inside camera.far(300), outside fog.far
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x7ec8ff) },
                  bottom: { value: new THREE.Color(0xdff1ff) } },
      vertexShader: 'varying vec3 vW; void main(){ vW = position;' +
        ' gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      // apply the SAME exposure + ACES + sRGB the renderer uses for everything else,
      // so the dome matches the terrain/fog and the horizon blends seamlessly.
      fragmentShader: 'varying vec3 vW; uniform vec3 top; uniform vec3 bottom;' +
        ' void main(){ float h = normalize(vW).y; float t = pow(clamp(h*0.5+0.5,0.0,1.0), 0.9);' +
        ' vec3 c = mix(bottom, top, t) * 1.18;' +
        ' c = (c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14);' +
        ' c = pow(clamp(c,0.0,1.0), vec3(1.0/2.2));' +
        ' gl_FragColor = vec4(c, 1.0); }'
    });
    const sky = new THREE.Mesh(geo, mat); sky.frustumCulled = false; return sky;
  }

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
      case 'stair': {
        // two merged boxes: bottom half + back upper half = a climbable step
        const lower = new THREE.BoxGeometry(1, 0.5, 1).translate(0, -0.25, 0);
        const upper = new THREE.BoxGeometry(1, 0.5, 0.5).translate(0, 0.25, -0.25);
        const g = new THREE.BufferGeometry();
        const a = lower.attributes.position.array, b = upper.attributes.position.array;
        const au = lower.attributes.uv.array, bu = upper.attributes.uv.array;
        const an = lower.attributes.normal.array, bn = upper.attributes.normal.array;
        const cat = (x, y) => { const o = new Float32Array(x.length + y.length); o.set(x); o.set(y, x.length); return o; };
        g.setAttribute('position', new THREE.BufferAttribute(cat(a, b), 3));
        g.setAttribute('uv', new THREE.BufferAttribute(cat(au, bu), 2));
        g.setAttribute('normal', new THREE.BufferAttribute(cat(an, bn), 3));
        const ia = lower.index.array, ib = upper.index.array, off = a.length / 3;
        const idx = new Uint16Array(ia.length + ib.length);
        idx.set(ia); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + off;
        g.setIndex(new THREE.BufferAttribute(idx, 1));
        return g;
      }
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
    if (SMOOTH) {
      // opaque blocks cast shadows; transparent ones (water/glass/ice/slime/pane)
      // would throw a solid black shadow (the depth pass ignores opacity), so skip
      m.castShadow = ABC.BLOCK_DEFS[id].alpha == null;
      m.receiveShadow = true;
    }
    scene.add(m);
    return m;
  }
  function initMeshes() {
    blockGeo = SMOOTH ? roundedBoxGeo(1, 0.07, 1) : new THREE.BoxGeometry(1,1,1);
    for (const [id, def] of Object.entries(ABC.BLOCK_DEFS)) {
      let mat;
      if (SMOOTH) {
        mat = makeBlockMaterial(def);
      } else {
        mat = new THREE.MeshLambertMaterial({ map: makeTexture(def) });
        if (def.alpha != null) { mat.transparent = true; mat.opacity = def.alpha; }
        if (def.glow) mat.emissive = new THREE.Color(0xffe066), mat.emissiveIntensity = 0.6;
      }
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
      const raw = rotMap.get(keys[i]) || 0;
      const rot = (raw & 3) + ((raw & 4) ? 1 : 0);    // bit 4 = door swung open
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
    editSet.set(k, { t: type, r: rot || 0 });   // player edits persist forever
    editDel.delete(k);
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
    editSet.delete(k);
    editDel.add(k);                              // remember the hole forever
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

    // 🌊 winding river with sandy banks (east-west across the north)
    for (let x=-SIZE;x<=SIZE;x++) {
      const zc = Math.round(-40 + Math.sin(x/14)*8);
      for (let dz=-1;dz<=1;dz++) set(x,0,zc+dz,'water');
      set(x,0,zc-2,'sand'); set(x,0,zc+2,'sand');
    }
    // 🏔️ mountains (north-east corner): stone cones with snowy tops
    [[52,-52,7],[60,-60,9],[44,-62,6],[63,-46,5]].forEach(([mx,mz,h])=>{
      for (let y=1;y<=h;y++) {
        const r = Math.max(1, h-y);
        for (let dx=-r;dx<=r;dx++) for (let dz=-r;dz<=r;dz++)
          if (dx*dx+dz*dz <= r*r) set(mx+dx,y,mz+dz, y>h-2?'snow':'stone');
      }
    });
    // 🌲 forest (south-west): many trees
    for (let i=0;i<26;i++) {
      const fx = -64 + (rnd()*30|0), fz = 34 + (rnd()*30|0);
      tree(fx, fz);
    }
    // 🏘️ little town (south-east): four cozy houses + town square
    const house = (hx,hz) => {
      for (let x=0;x<=4;x++) for (let z=0;z<=4;z++) set(hx+x,1,hz+z,'plank');
      for (let y=1;y<=2;y++) for (let x=0;x<=4;x++) for (let z=0;z<=4;z++)
        if (x===0||x===4||z===0||z===4) set(hx+x,y,hz+z,'plank');
      set(hx+2,1,hz,'door'); set(hx+2,2,hz,'pane');
      for (let x=-1;x<=5;x++) for (let z=-1;z<=5;z++) set(hx+x,3,hz+z,'brick');
      set(hx+2,4,hz+2,'star');
    };
    house(40,40); house(50,40); house(40,52); house(50,52);
    for (let x=46;x<=49;x++) for (let z=46;z<=49;z++) set(x,0,z,'stone'); // square
    set(47,1,47,'gold'); set(48,1,48,'flower');
    // town market stall #2
    for (let x=0;x<=3;x++) set(44+x,1,58,'plank');
    for (let x=-1;x<=4;x++) for (let z=-1;z<=2;z++) set(44+x,3,57+z,(x+z)%2?'blue':'white');
    set(44,2,58,'wood'); set(47,2,58,'wood'); set(45,2,58,'star');

    // 🏪 little village market stall (vendor stands here)
    const MX = -16, MZ = 2;
    for (let x=0;x<=3;x++) { set(MX+x,1,MZ,'plank'); }            // counter
    set(MX,1,MZ+3,'wood'); set(MX+3,1,MZ+3,'wood');               // posts
    set(MX,2,MZ+3,'wood'); set(MX+3,2,MZ+3,'wood');
    set(MX,2,MZ,'wood'); set(MX+3,2,MZ,'wood');
    for (let x=-1;x<=4;x++) for (let z=-1;z<=4;z++)
      set(MX+x,3,MZ+z,(x+z)%2?'red':'white');                     // stripy awning
    set(MX+1,2,MZ,'star'); set(MX+2,2,MZ,'gold');                 // sparkly display

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

  /* ---------- color themes 🎨 ---------- */
  let hemiLight = null, sunLight = null, lockedTheme = null;
  /* a manual theme from Settings locks the look; 'auto' (or null) lets the
     world color-grade by national-park region as you walk 🏞️ */
  function setTheme(key) {
    if (!key || key === 'auto') { lockedTheme = null; return; }
    lockedTheme = (ABC.THEMES || []).find(t => t.key === key) || null;
  }
  const _c1 = new THREE.Color(), _c2 = new THREE.Color();
  function gradeTo(th, dt, night) {
    if (!scene) return;
    const k = Math.min(1, dt * 0.7);
    const sky = th.sky, fog = th.fog != null ? th.fog : th.sky;
    let near = th.near != null ? th.near : 60, far = th.far != null ? th.far : 150;
    const light = th.light != null ? th.light : 0xfff7e0;
    let lightI = th.lightI != null ? th.lightI : 0.95;
    const hemi = th.hemi != null ? th.hemi : sky;
    let hemiI = th.hemiI != null ? th.hemiI : 0.38;
    if (SMOOTH) {
      // keep the airy view distance & the brighter ACES-balanced sun; still let
      // the region's MOOD come through. At NIGHT, dim the sun right down so it
      // doesn't cast a sunny-day shadow under a navy sky (its shadow stays faint
      // rather than toggling castShadow — which would recompile shaders mid-walk).
      near *= 1.3; far *= 1.6; hemiI *= 0.9;
      lightI *= night ? 0.6 : 2.7;
      // deepen the zenith so the sky reads as a rich blue after ACES+exposure
      // (a pale hue would blow out to near-white); keep the horizon = fog so it blends
      if (_sky) { _sky.material.uniforms.top.value.lerp(_c1.set(sky).multiplyScalar(0.66), k);
                  _sky.material.uniforms.bottom.value.lerp(_c2.set(fog), k); }
    }
    if (scene.background && scene.background.isColor) scene.background.lerp(_c1.set(sky), k);
    scene.fog.color.lerp(_c1.set(fog), k);
    scene.fog.near += (near - scene.fog.near) * k;
    scene.fog.far += (far - scene.fog.far) * k;
    if (sunLight) { sunLight.color.lerp(_c1.set(light), k); sunLight.intensity += (lightI - sunLight.intensity) * k; }
    if (hemiLight) { hemiLight.color.lerp(_c1.set(hemi), k); hemiLight.intensity += (hemiI - hemiLight.intensity) * k; }
  }
  /* called every frame from the main loop with the player position */
  function gradeFrame(x, z, dt) {
    const reg = ABC.REGIONS ? ABC.REGIONS.regionAt(x, z) : null;
    const night = lockedTheme ? lockedTheme.key === 'night' : !!(reg && reg.night);
    const target = lockedTheme || (reg ? reg.theme : null);
    if (target) gradeTo(target, dt, night);
  }

  /* ---------- night sky: stars + Milky Way 🌌 ---------- */
  let starField = null, galaxyBand = null, starOp = 0;
  function buildStars() {
    const mk = (n, R, ySpread, yBase, size, color, band) => {
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        if (band) {
          const a = mulberry(i * 7 + 3)() * Math.PI * 2, sp = (mulberry(i * 13 + 1)() - 0.5) * 70;
          pos[i*3] = Math.cos(a) * R; pos[i*3+1] = yBase + sp * 0.5 + Math.sin(a * 2) * 22; pos[i*3+2] = Math.sin(a) * R + sp;
        } else {
          const u = mulberry(i * 3 + 9)(), v = mulberry(i * 5 + 4)();
          const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
          pos[i*3] = R * Math.sin(ph) * Math.cos(th);
          pos[i*3+1] = Math.abs(R * Math.cos(ph)) * ySpread + yBase;
          pos[i*3+2] = R * Math.sin(ph) * Math.sin(th);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0, depthWrite: false });
      const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
      return pts;
    };
    starField = mk(1500, 260, 0.85, 40, 1.7, 0xffffff, false);
    galaxyBand = mk(950, 250, 0, 130, 2.8, 0xc6ccff, true);
  }
  /* keep the bright sun + its tight shadow frustum centered on the player, so a
     1024 map covers a small area at high quality. Rounds the target to reduce
     shadow swim as you walk (a soft help — the sun axis is diagonal, so it's not
     a perfect texel lock, but enough at this map size to stay calm). */
  const _sunBase = new THREE.Vector3(40, 80, 25);
  function updateSun(px, pz) {
    if (!SMOOTH || !sunLight) return;
    const texel = (_shadowR * 2) / sunLight.shadow.mapSize.x;
    const tx = Math.round(px / texel) * texel, tz = Math.round(pz / texel) * texel;
    sunLight.target.position.set(tx, 0, tz);
    sunLight.position.set(tx + _sunBase.x, _sunBase.y, tz + _sunBase.z);
  }

  function updateSky(cam, dt) {
    if (SMOOTH && _sky) _sky.position.set(cam.x, 0, cam.z);   // dome follows the player
    if (!starField) return;
    starField.position.set(cam.x, 0, cam.z);
    galaxyBand.position.set(cam.x, 0, cam.z);
    galaxyBand.rotation.y += dt * 0.01;
    const night = lockedTheme ? (lockedTheme.key === 'night' ? 1 : 0)
      : (ABC.REGIONS && ABC.REGIONS.regionAt(cam.x, cam.z).night ? 1 : 0);
    starOp += (night - starOp) * Math.min(1, dt * 1.2);
    starField.material.opacity = starOp * 0.95;
    galaxyBand.material.opacity = starOp * 0.8;
  }

  /* ---------- scene setup ---------- */
  function initScene(renderer) {
    scene = new THREE.Scene();
    _maxAniso = renderer.capabilities.getMaxAnisotropy();
    if (SMOOTH) {
      // cinematic color pipeline + soft shadows
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // gradient sky dome instead of a flat color; airier fog
      scene.background = null;
      _sky = makeSky(); scene.add(_sky);
      scene.fog = new THREE.Fog(0xdff1ff, 80, 240);
      scene.environment = makeEnvironment(renderer);   // soft daylight fill for the PBR blocks
      // one warm key sun that casts a single soft, player-following shadow
      sunLight = new THREE.DirectionalLight(0xfff3da, 2.4);
      sunLight.position.set(40, 80, 25);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
      _shadowR = 32;
      const sc = sunLight.shadow.camera;
      sc.left = -_shadowR; sc.right = _shadowR; sc.top = _shadowR; sc.bottom = -_shadowR;
      sc.near = 1; sc.far = 220; sc.updateProjectionMatrix();
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.5;               // primary fix for axis-aligned voxel acne
      scene.add(sunLight); scene.add(sunLight.target);
      scene.add(new THREE.AmbientLight(0xcfe8ff, 0.5));
      hemiLight = new THREE.HemisphereLight(0xbfe3ff, 0x6f9c52, 0.34);
      scene.add(hemiLight);
    } else {
      scene.background = new THREE.Color(0x9fdcff);
      scene.fog = new THREE.Fog(0x9fdcff, 60, 140);
      sunLight = new THREE.DirectionalLight(0xfff7e0, 0.95);
      sunLight.position.set(40, 80, 25);
      scene.add(sunLight);
      scene.add(new THREE.AmbientLight(0xcfe8ff, 0.75));
      hemiLight = new THREE.HemisphereLight(0xbfe3ff, 0x7ed957, 0.35);
      scene.add(hemiLight);
    }
    // dark base far below the bedrock layer
    underMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2000, 1, 2000),
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
    buildStars();
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

  /* ============================================================
     INFINITE WORLD — chunks generate forever as you explore 🌍
     ============================================================ */
  const CHUNK = 16, LOAD_R = 3, UNLOAD_R = 6;
  const chunks = new Map();                  // "cx,cz" -> [keys]
  const editSet = new Map(), editDel = new Set();   // the player's changes, forever
  let structMap = null;                      // handcrafted spawn features

  function hash2(x, z) {
    let h = (x * 374761393 + z * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, z, s) {
    const fx = x / s, fz = z / s, x0 = Math.floor(fx), z0 = Math.floor(fz);
    const tx = fx - x0, tz = fz - z0, sm = (t) => t * t * (3 - 2 * t);
    const a = hash2(x0, z0), b = hash2(x0 + 1, z0), c = hash2(x0, z0 + 1), d = hash2(x0 + 1, z0 + 1);
    return a + (b - a) * sm(tx) + (c - a) * sm(tz) + (a - b - c + d) * sm(tx) * sm(tz);
  }
  function gset(keys, x, y, z, t, rot) {     // generator write (not a player edit)
    const k = key(x, y, z);
    map.set(k, t);
    if (rot) rotMap.set(k, rot);
    dirty.add(t);
    keys.push(k);
  }
  function genTree(keys, x, z, baseY) {
    const th = 3 + ((hash2(x, z) * 2) | 0);
    for (let y = 1; y <= th; y++) gset(keys, x, baseY + y, z, 'wood');
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 2; dy++)
      if (Math.abs(dx) + Math.abs(dz) + dy < 4) gset(keys, x + dx, baseY + th + dy, z + dz, 'leaf');
  }
  /* one tree per spacing×spacing cell, jittered — keeps trees apart so
     canopies never merge into a floating ceiling 🌲 */
  function treeCell(x, z, spacing) {
    const gx = Math.floor(x / spacing), gz = Math.floor(z / spacing);
    const jx = gx * spacing + Math.floor(hash2(gx * 7 + 1, gz * 7 + 3) * spacing);
    const jz = gz * spacing + Math.floor(hash2(gx * 13 + 5, gz * 13 + 9) * spacing);
    return x === jx && z === jz;
  }
  function genPine(keys, x, z, baseY) {     // tall conifer for forests/valleys
    const h = 4 + ((hash2(x, z) * 3) | 0);
    for (let y = 1; y <= h; y++) gset(keys, x, baseY + y, z, 'wood');
    for (let r = 2; r >= 0; r--) {
      const yy = baseY + h - (2 - r);
      for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++)
        if (Math.abs(dx) + Math.abs(dz) <= r) gset(keys, x + dx, yy, z + dz, 'leaf');
    }
    gset(keys, x, baseY + h + 1, z, 'leaf');
  }
  function genHome(keys, x, z) {             // calm flat home meadow
    gset(keys, x, 0, z, 'grass');
    const sp = Math.hypot(x, z), h = hash2(x * 3 + 1, z * 3 + 7);
    if (sp > 16 && treeCell(x, z, 13) && vnoise(x + 777, z - 777, 34) > 0.55) genTree(keys, x, z, 0);
    else if (h < 0.007) gset(keys, x, 1, z, 'flower');
  }
  function genWild(keys, x, z) {             // rolling grasslands between home and parks
    const e = vnoise(x, z, 44);
    const hh = e > 0.6 ? Math.round((e - 0.6) * 18) : 0;
    for (let y = 1; y <= hh; y++) gset(keys, x, y, z, y === hh ? 'grass' : 'dirt');
    if (hh === 0) gset(keys, x, 0, z, 'grass');
    else gset(keys, x, 0, z, 'grass');
    const hsh = hash2(x * 3 + 1, z * 3 + 7);
    if (hh === 0) {
      if (treeCell(x, z, 14) && vnoise(x, z, 26) > 0.58) genTree(keys, x, z, 0);
      else if (hsh < 0.004) gset(keys, x, 1, z, 'flower');
    }
  }
  /* region terrain — each US national park looks distinct 🏞️ */
  function genColumn(keys, x, z) {
    gset(keys, x, -2, z, 'stone');                          // bedrock
    gset(keys, x, -1, z, 'dirt');
    const reg = ABC.REGIONS.regionAt(x, z);
    if (reg.key === 'home') return genHome(keys, x, z);
    if (reg.key === 'wild') return genWild(keys, x, z);
    const sp = Math.hypot(x, z);
    const t = Math.min(1, Math.max(0, (sp - ABC.REGIONS.PARK_R) / 30));  // park features rise in gently
    const hsh = hash2(x * 3 + 1, z * 3 + 7);
    const col = (y0, top, sub) => { for (let y = 1; y <= y0; y++) gset(keys, x, y, z, y === y0 ? top : sub); };
    switch (reg.key) {
      case 'yosemite': {
        gset(keys, x, 0, z, 'grass');
        const cf = vnoise(x + 50, z - 20, 26);
        const mh = cf > 0.62 ? Math.round((cf - 0.62) * 70 * t) : 0;
        for (let y = 1; y <= mh; y++) gset(keys, x, y, z, (y > mh - 2 && mh > 7) ? 'snow' : 'granite');
        if (mh === 0 && treeCell(x, z, 11) && vnoise(x, z, 26) > 0.55) genPine(keys, x, z, 0);
        break;
      }
      case 'zion': {
        gset(keys, x, 0, z, 'sand');
        const me = vnoise(x - 30, z + 40, 30);
        const mh = me > 0.58 ? Math.round((me - 0.58) * 64 * t) : 0;
        for (let y = 1; y <= mh; y++) gset(keys, x, y, z, (y % 3 === 0) ? 'sandstone' : 'redrock');
        break;
      }
      case 'grandcanyon': {
        const river = Math.abs(vnoise(x + 11, z - 77, 64) - 0.5);
        if (river < 0.04) { gset(keys, x, 0, z, 'water'); break; }
        gset(keys, x, 0, z, 'sandstone');
        const wall = Math.round((0.5 - river) * 2 * 11 * t);
        for (let y = 1; y <= wall; y++) gset(keys, x, y, z, (Math.floor(y / 2) % 2) ? 'redrock' : 'sandstone');
        break;
      }
      case 'yellowstone': {
        gset(keys, x, 0, z, 'grass');
        if (vnoise(x + 5, z + 5, 18) > 0.8) gset(keys, x, 0, z, 'water');   // hot springs
        else if (hsh < 0.012) gset(keys, x, 1, z, 'flower');
        break;
      }
      case 'olympic': {
        gset(keys, x, 0, z, 'moss');
        if (treeCell(x, z, 9) && vnoise(x, z, 22) > 0.42) genPine(keys, x, z, 0);   // lush but spaced
        break;
      }
      case 'everglades': {
        if (vnoise(x, z, 14) < 0.46) {
          gset(keys, x, 0, z, 'water');
          if (hash2(x, z) < 0.05) { gset(keys, x, 1, z, 'leaf'); gset(keys, x, 2, z, 'leaf'); }  // reeds
        } else { gset(keys, x, 0, z, 'grass'); if (treeCell(x, z, 11)) genTree(keys, x, z, 0); }
        break;
      }
      case 'glacier': {
        const fj = Math.abs(vnoise(x, z, 40) - 0.5);
        if (fj < 0.06) { gset(keys, x, 0, z, 'water'); break; }
        gset(keys, x, 0, z, vnoise(x + 9, z, 20) > 0.6 ? 'ice' : 'snow');
        const pk = vnoise(x - 40, z + 10, 30);
        const mh = pk > 0.66 ? Math.round((pk - 0.66) * 54 * t) : 0;
        for (let y = 1; y <= mh; y++) gset(keys, x, y, z, 'snow');
        break;
      }
      case 'denali': {
        gset(keys, x, 0, z, 'snow');
        const pk = vnoise(x + 20, z - 20, 34);
        const mh = pk > 0.5 ? Math.round((pk - 0.5) * 64 * t) : 0;
        for (let y = 1; y <= mh; y++) gset(keys, x, y, z, (y > mh - 3) ? 'snow' : 'stone');
        break;
      }
      case 'acadia': {
        const oc = vnoise(x, z, 46);
        if (oc < 0.46) { gset(keys, x, 0, z, 'water'); break; }
        gset(keys, x, 0, z, oc < 0.52 ? 'sand' : 'grass');
        const rk = vnoise(x + 30, z, 18);
        const mh = rk > 0.7 ? Math.round((rk - 0.7) * 30 * t) : 0;
        for (let y = 1; y <= mh; y++) gset(keys, x, y, z, 'granite');
        break;
      }
      case 'hawaii': {
        const oc = vnoise(x, z, 50);
        if (oc < 0.4) { gset(keys, x, 0, z, 'water'); break; }
        gset(keys, x, 0, z, oc < 0.46 ? 'sand' : 'blackrock');
        if (oc >= 0.46 && vnoise(x + 7, z + 7, 16) > 0.84) gset(keys, x, 1, z, 'lava');
        const vc = vnoise(x - 25, z - 25, 30);
        const mh = vc > 0.7 ? Math.round((vc - 0.7) * 54 * t) : 0;
        for (let y = 1; y <= mh; y++) gset(keys, x, y, z, (y > mh - 2 && mh > 6) ? 'lava' : 'blackrock');
        break;
      }
      case 'galaxy': {                       // 🌌 magical night meadow
        gset(keys, x, 0, z, 'grass');
        if (vnoise(x + 3, z + 3, 28) < 0.06) gset(keys, x, 0, z, 'water');   // still reflecting ponds
        else {
          const h2 = hash2(x * 5 + 2, z * 5 + 9);
          if (h2 < 0.02) gset(keys, x, 1, z, 'star');                        // glowing ground sparkles
          else if (h2 < 0.05) gset(keys, x, 1, z, 'flower');
        }
        break;
      }
      default: gset(keys, x, 0, z, 'grass');
    }
  }
  function genHouse(keys, hx, hz) {          // a discoverable village house
    for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) {
      gset(keys, hx + x, 0, hz + z, 'grass');
      gset(keys, hx + x, 1, hz + z, 'plank');
      for (let y = 1; y <= 2; y++)
        if (x === 0 || x === 4 || z === 0 || z === 4) gset(keys, hx + x, y, hz + z, 'plank');
    }
    gset(keys, hx + 2, 1, hz, 'door'); gset(keys, hx + 2, 2, hz, 'pane');
    for (let x = -1; x <= 5; x++) for (let z = -1; z <= 5; z++) gset(keys, hx + x, 3, hz + z, 'brick');
    gset(keys, hx + 2, 4, hz + 2, 'star');
  }
  function genChunk(cx, cz) {
    const keys = [];
    for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++)
      for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) genColumn(keys, x, z);
    // handcrafted spawn features (arch, markets, garden, sky island)
    for (const [k, v] of structMap) {
      const [x, , z] = k.split(',').map(Number);
      if (x >= cx * CHUNK && x < (cx + 1) * CHUNK && z >= cz * CHUNK && z < (cz + 1) * CHUNK) {
        map.set(k, v.t); if (v.r) rotMap.set(k, v.r); dirty.add(v.t); keys.push(k);
      }
    }
    // the player's own changes always win
    for (const k of editDel) {
      const [x, , z] = k.split(',').map(Number);
      if (x >= cx * CHUNK && x < (cx + 1) * CHUNK && z >= cz * CHUNK && z < (cz + 1) * CHUNK) {
        const old = map.get(k); if (old) { map.delete(k); rotMap.delete(k); dirty.add(old); }
      }
    }
    for (const [k, v] of editSet) {
      const [x, , z] = k.split(',').map(Number);
      if (x >= cx * CHUNK && x < (cx + 1) * CHUNK && z >= cz * CHUNK && z < (cz + 1) * CHUNK) {
        map.set(k, v.t); if (v.r) rotMap.set(k, v.r); else rotMap.delete(k); dirty.add(v.t); keys.push(k);
      }
    }
    chunks.set(cx + ',' + cz, keys);
  }
  function ensureChunks(px, pz) {
    const ccx = Math.floor(px / CHUNK), ccz = Math.floor(pz / CHUNK);
    let gen = 0;
    for (let r = 0; r <= LOAD_R && gen < 3; r++)
      for (let dx = -r; dx <= r && gen < 3; dx++) for (let dz = -r; dz <= r && gen < 3; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const ck = (ccx + dx) + ',' + (ccz + dz);
        if (!chunks.has(ck)) { genChunk(ccx + dx, ccz + dz); gen++; }
      }
    if (gen) {
      for (const [ck, keys] of chunks) {
        const [cx, cz] = ck.split(',').map(Number);
        if (Math.max(Math.abs(cx - ccx), Math.abs(cz - ccz)) > UNLOAD_R) {
          for (const k of keys) { const t = map.get(k); if (t) { map.delete(k); rotMap.delete(k); dirty.add(t); } }
          chunks.delete(ck);
        }
      }
      flush();
    }
  }
  /* handcrafted features near spawn, written once into an overlay */
  function buildStructures() {
    structMap = new Map();
    const ss = (x, y, z, t, r) => structMap.set(key(x, y, z), { t, r: r || 0 });
    const arch = [[-3,1],[-3,2],[-3,3],[-2,4],[-1,5],[0,5],[1,5],[2,4],[3,3],[3,2],[3,1]];
    arch.forEach(([x,y]) => ss(x, y, -14, 'rainbow'));   // pushed back so spawn is open
    [[8,-12],[9,-12],[8,-13]].forEach(([x,z]) => ss(x, 1, z, 'blue'));   // mascot garden, off to the side
    ss(8,2,-12,'blue'); ss(8,3,-12,'star');
    for (let x=0;x<=3;x++) ss(-16+x,1,2,'plank');                       // Mr. Maple's stall
    ss(-16,1,5,'wood'); ss(-13,1,5,'wood'); ss(-16,2,5,'wood'); ss(-13,2,5,'wood');
    ss(-16,2,2,'wood'); ss(-13,2,2,'wood'); ss(-15,2,2,'star'); ss(-14,2,2,'gold');
    for (let x=-1;x<=4;x++) for (let z=-1;z<=4;z++) ss(-16+x,3,2+z,(x+z)%2?'red':'white');
    const IC = 36, IY = 24;                                             // sky island
    for (let x=IC-6;x<=IC+6;x++) for (let z=IC-6;z<=IC+6;z++) {
      const d = Math.hypot(x-IC, z-IC);
      if (d <= 6) ss(x, IY, z, d > 4.6 ? 'snow' : 'grass');
      if (d <= 3) ss(x, IY-1, z, 'snow');
    }
    [[-2,1],[-2,2],[-1,3],[0,3],[1,3],[2,2],[2,1]].forEach(([dx,dy]) => ss(IC+dx, IY+dy, IC, 'rainbow'));
    [[-3,-3],[3,-3],[-3,3],[3,3]].forEach(([dx,dz]) => ss(IC+dx, IY+1, IC+dz, 'star'));
    ss(IC, IY+1, IC-3, 'oreo'); ss(IC-1, IY+1, IC-3, 'slimePink');
    for (let x=0;x<=3;x++) ss(44+x,1,58,'plank');                       // Mrs. Cocoa's stall
    for (let x=-1;x<=4;x++) for (let z=-1;z<=2;z++) ss(44+x,3,57+z,(x+z)%2?'blue':'white');
    ss(44,2,58,'wood'); ss(47,2,58,'wood'); ss(45,2,58,'star');
    for (let x=44;x<=49;x++) for (let z=52;z<=60;z++) ss(x,0,z,'grass'); // flat patch for the stall
  }
  function infiniteInit() {
    buildStructures();
    ensureChunks(0, 0);
    ensureChunks(0, 6);
  }
  function serializeEdits() {
    const d = [];
    for (const [k, v] of editSet) d.push(k + ':' + v.t + (v.r ? ':' + v.r : ''));
    return { d, r: [...editDel], inf: 1 };
  }
  function deserializeEdits(data) {
    if (!data || !data.inf) return;          // old fixed-world saves are skipped
    editSet.clear(); editDel.clear();
    for (const e of (data.d || [])) {
      const p = e.split(':');
      if (ABC.BLOCK_DEFS[p[1]]) editSet.set(p[0], { t: p[1], r: +p[2] || 0 });
    }
    for (const k of (data.r || [])) editDel.add(k);
    // regenerate everything with the edits applied
    for (const [, keys] of chunks) for (const k of keys) {
      const t = map.get(k); if (t) { map.delete(k); rotMap.delete(k); dirty.add(t); }
    }
    chunks.clear();
    ensureChunks(0, 6);
    flush();
  }

  function getRot(x,y,z) { return rotMap.get(key(x,y,z)) || 0; }
  function topBlock(x,z) {
    for (let y = MAX_Y; y >= MIN_Y; y--) {
      const t = map.get(key(x,y,z));
      if (t) return { t, y };
    }
    return null;
  }

  return { SIZE, MAX_Y, MIN_Y, initScene, generate: infiniteInit, get, set, remove, flush, key,
           blockMeshes, serialize: serializeEdits, deserialize: deserializeEdits, materials,
           ensureChunks, setTheme, gradeFrame, updateSky, updateSun, getRot, topBlock,
           getScene: () => scene };
})();
