// Nilu's Helping Hands — HH.World
// Plain script, no imports. THREE is a global (r128 API). Depends on HH.PLACES / HH.HELPERS /
// HH.HELPER_SPOTS / HH.SCENARIO_ACTORS from content.js.
//
// Builds a bright outdoor hub with 6 building slots (unchanged look) PLUS walkable, connected
// building interiors: a central hallway with rooms attached left/right/top through real wall
// gaps (doors), simple circle-vs-wall collision, a kid avatar + Nilu the elephant who walk
// around, a follow camera, floor target rings, and speech bubbles.
(function () {
  'use strict';
  window.HH = window.HH || {};

  // =========================================================================
  // small canvas-texture / sprite helpers
  // =========================================================================
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function canvasTex(draw, w, h) {
    var c = makeCanvas(w || 256, h || 256);
    draw(c.getContext('2d'), c.width, c.height);
    var t = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    t.needsUpdate = true;
    return t;
  }

  // ---- floor textures (near-white, tinted by the material color) ----
  var plankTexCache = null, tileTexCache = null;
  function plankTexture() {
    if (plankTexCache) return plankTexCache;
    plankTexCache = canvasTex(function (ctx, w, h) {
      ctx.fillStyle = '#f2e4cf'; ctx.fillRect(0, 0, w, h);
      var plankW = w / 6;
      for (var i = 0; i < 6; i++) {
        var x = i * plankW;
        ctx.fillStyle = i % 2 ? 'rgba(160,110,60,0.10)' : 'rgba(180,130,80,0.05)';
        ctx.fillRect(x, 0, plankW, h);
        ctx.strokeStyle = 'rgba(120,80,40,0.28)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        // grain
        ctx.strokeStyle = 'rgba(140,95,50,0.10)'; ctx.lineWidth = 1.2;
        for (var gLine = 0; gLine < 4; gLine++) {
          var gx = x + 6 + Math.random() * (plankW - 12);
          ctx.beginPath(); ctx.moveTo(gx, 0);
          for (var y = 0; y <= h; y += 32) ctx.lineTo(gx + Math.sin(y / 40 + i) * 3, y);
          ctx.stroke();
        }
        // plank end-joints
        for (var j = 0; j < 2; j++) {
          var jy = ((i * 137 + j * 251) % h);
          ctx.strokeStyle = 'rgba(120,80,40,0.22)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, jy); ctx.lineTo(x + plankW, jy); ctx.stroke();
        }
      }
    }, 256, 256);
    plankTexCache.wrapS = plankTexCache.wrapT = THREE.RepeatWrapping;
    plankTexCache.repeat.set(2, 2);
    return plankTexCache;
  }
  function tileTexture() {
    if (tileTexCache) return tileTexCache;
    tileTexCache = canvasTex(function (ctx, w, h) {
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, w, h);
      var t = w / 4;
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
        ctx.fillStyle = (i + j) % 2 ? 'rgba(120,140,160,0.10)' : 'rgba(255,255,255,0.35)';
        ctx.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
      }
      ctx.strokeStyle = 'rgba(110,120,135,0.35)'; ctx.lineWidth = 3;
      for (var k = 0; k <= 4; k++) {
        ctx.beginPath(); ctx.moveTo(k * t, 0); ctx.lineTo(k * t, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, k * t); ctx.lineTo(w, k * t); ctx.stroke();
      }
    }, 256, 256);
    tileTexCache.wrapS = tileTexCache.wrapT = THREE.RepeatWrapping;
    tileTexCache.repeat.set(3, 3);
    return tileTexCache;
  }
  var TILE_ROOMS = { bathroom: 1, kitchen: 1, nurseroom: 1, cafeteria: 1 };

  var matCache = {};
  function stdMat(hex, opts) {
    opts = opts || {};
    var key = hex + '|' + (opts.roughness !== undefined ? opts.roughness : 0.7) + '|' + (opts.metalness || 0) +
      '|' + (opts.map ? opts.map.uuid : '') + '|' + (opts.emissive ? 'e' + (opts.emissiveHex || '') : '') +
      '|' + (opts.transparent ? 't' + opts.opacity : '') + '|' + (opts.side || '');
    if (matCache[key]) return matCache[key];
    var params = {
      color: new THREE.Color(hex),
      roughness: opts.roughness !== undefined ? opts.roughness : 0.7,
      metalness: opts.metalness || 0
    };
    if (opts.map) params.map = opts.map;
    if (opts.emissive) { params.emissive = new THREE.Color(opts.emissiveHex || hex); params.emissiveIntensity = opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.7; }
    if (opts.transparent) { params.transparent = true; params.opacity = opts.opacity !== undefined ? opts.opacity : 0.7; }
    if (opts.side) params.side = opts.side;
    var m = new THREE.MeshStandardMaterial(params);
    matCache[key] = m;
    return m;
  }

  function mesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function makeSun() {
    // one soft shadow-casting sun, shared rig for hub + interiors
    var dir = new THREE.DirectionalLight(0xfff2d9, 0.75);
    dir.position.set(12, 22, -10);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.left = -26; dir.shadow.camera.right = 26;
    dir.shadow.camera.top = 26; dir.shadow.camera.bottom = -26;
    dir.shadow.camera.near = 2; dir.shadow.camera.far = 70;
    dir.shadow.bias = -0.0012;
    dir.shadow.radius = 3;
    return dir;
  }

  // ---- emoji sprite cache: draws an emoji onto a canvas, wraps as a Sprite ----
  var emojiTexCache = {};
  function emojiTexture(emoji) {
    if (emojiTexCache[emoji]) return emojiTexCache[emoji];
    var size = 256;
    var c = makeCanvas(size, size);
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '200px serif';
    ctx.fillText(emoji || '❓', size / 2, size / 2 + 14);
    var t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    emojiTexCache[emoji] = t;
    return t;
  }
  function makeEmojiSprite(emoji, scale) {
    var mat = new THREE.SpriteMaterial({ map: emojiTexture(emoji), transparent: true, depthWrite: false });
    var spr = new THREE.Sprite(mat);
    var s = scale || 1.6;
    spr.scale.set(s, s, 1);
    return spr;
  }

  // ---- rounded pill "name sign" sprite: emoji + text, drawn together ----
  var signTexCache = {};
  function signTexture(emoji, name, opts) {
    opts = opts || {};
    var key = emoji + '|' + name + '|' + (opts.bg || '');
    if (signTexCache[key]) return signTexCache[key];
    var w = 512, h = 176;
    var t = canvasTex(function (ctx) {
      var r = 40;
      ctx.fillStyle = opts.bg || '#fffaf0';
      roundRect(ctx, 4, 4, w - 8, h - 8, r);
      ctx.fill();
      ctx.strokeStyle = opts.border || '#8a5a26';
      ctx.lineWidth = 8;
      roundRect(ctx, 4, 4, w - 8, h - 8, r);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (emoji) {
        ctx.font = '84px serif';
        ctx.fillText(emoji, 78, h / 2 + 4);
      }
      ctx.fillStyle = opts.fg || '#4a3222';
      ctx.font = 'bold 56px "Comic Sans MS", "Trebuchet MS", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name || '', emoji ? 150 : 40, h / 2 + 4);
    }, w, h);
    signTexCache[key] = t;
    return t;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function makeSignSprite(emoji, name, opts, scale) {
    var mat = new THREE.SpriteMaterial({ map: signTexture(emoji, name, opts), transparent: true, depthWrite: false, depthTest: false });
    var spr = new THREE.Sprite(mat);
    spr.renderOrder = 900; // wording must never hide behind walls or boards
    var s = scale || 2.4;
    spr.scale.set(s, s * (176 / 512), 1);
    return spr;
  }

  function padlockSprite() {
    return makeEmojiSprite('🔒', 1.4);
  }

  // ---- sky gradient background texture ----
  function skyTexture() {
    return canvasTex(function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#4fb3ff');
      g.addColorStop(0.55, '#8fd6ff');
      g.addColorStop(1, '#dff6ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, 8, 512);
  }
  function windowSkyTexture() {
    return canvasTex(function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#7ec8ff'); g.addColorStop(1, '#d6f3ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.beginPath(); ctx.fillStyle = '#fff3a0';
      ctx.arc(w * 0.72, h * 0.3, w * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      [[0.2, 0.35, 0.16], [0.55, 0.22, 0.12]].forEach(function (p) {
        ctx.beginPath();
        ctx.ellipse(w * p[0], h * p[1], w * p[2], h * p[2] * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }, 256, 192);
  }

  // ---- grass texture with subtle blade speckle (tiled via RepeatWrapping) ----
  function grassTexture(repeat) {
    var t = canvasTex(function (ctx, w, h) {
      ctx.fillStyle = '#6ec651'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 260; i++) {
        var x = Math.random() * w, y = Math.random() * h;
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(25,75,20,0.12)';
        ctx.fillRect(x, y, 3, 8);
      }
    }, 128, 128);
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat || 1, repeat || 1);
    t.needsUpdate = true;
    return t;
  }

  // =========================================================================
  // module state
  // =========================================================================
  var renderer = null, scene = null, camera = null, canvasEl = null;
  var interiorSun = null;
  var hubBuildings = {};
  var hubAvatar = null;
  var hubWalk = null; // { placeId, from, to, t0, dur, onArrive }
  var raycaster = new THREE.Raycaster();
  var pointerV2 = new THREE.Vector2();
  var handlers = { onBuilding: function () {}, onObject: function () {}, onHelper: function () {}, onActor: function () {}, onRoomEnter: function () {}, onBump: function () {}, onJoystickFirstUse: function () {} };
  var animItems = []; // { obj, fn(t,dt), ownerId? }
  var tappables = []; // meshes/sprites registered for raycast
  var currentRoot = null; // Group currently in scene (hub or interior)
  var clock = new THREE.Clock();
  var camSwayBase = null; // {pos, look} — hub gentle sway
  var camLookCurrent = null; // interior follow-cam smoothed look target
  var rafId = null;

  var mode = 'hub'; // 'hub' | 'interior'
  var currentPlaceId = null;
  var currentLayout = null;
  var currentRoomId = null;

  var collisionRects = []; // [{xMin,xMax,zMin,zMax}] axis-aligned wall footprints
  var wallTargetGroup = null; // group new wall meshes are added to while building

  var avatar = null; // { group, pos, facing, walking, bobPhase }
  var nilu = null;   // { group, pos }
  var helpersRegistry = {}; // helperId -> { group }
  var actorsRegistry = {};  // actorId -> { group }
  var objectsRegistry = {}; // "roomId:idx" -> sprite Object3D

  var keysDown = {};
  var joystickVec = { x: 0, z: 0 };
  var joystickEl = null, joystickKnob = null;

  var targetState = null; // { ring, arrow, baseArrowY }
  var speechBubbles = []; // [{id, sprite, t0, pop, life, expireAt, tw, th}]
  var speechByChar = {};

  function clearAnim() { animItems = []; }
  function clearTappables() { tappables = []; }

  function disposeGroup(g) {
    if (!g) return;
    g.traverse(function (obj) {
      if (obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose();
      }
      // materials/textures are cached & shared — do not dispose globally
    });
  }

  function setRoot(group) {
    if (currentRoot) {
      scene.remove(currentRoot);
      disposeGroup(currentRoot);
    }
    currentRoot = group;
    scene.add(group);
  }

  function registerTappable(obj3d, data) {
    obj3d.userData = obj3d.userData || {};
    for (var k in data) obj3d.userData[k] = data[k];
    tappables.push(obj3d);
  }

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return h;
  }

  // =========================================================================
  // clouds (hub sky decoration)
  // =========================================================================
  function makeCloud() {
    var g = new THREE.Group();
    var mat = stdMat('#ffffff', { roughness: 0.95 });
    var puffs = 4 + Math.floor(Math.random() * 3);
    for (var i = 0; i < puffs; i++) {
      var s = 1.1 + Math.random() * 1.3;
      var puff = mesh(new THREE.SphereGeometry(s, 10, 8), mat);
      puff.position.set((i - puffs / 2) * 1.3 + (Math.random() - 0.5) * 0.5, Math.random() * 0.6, (Math.random() - 0.5) * 0.8);
      g.add(puff);
    }
    return g;
  }

  // =========================================================================
  // HUB SCENE (unchanged look)
  // =========================================================================
  function buildHub() {
    var root = new THREE.Group(); root.name = 'hub';

    scene.background = skyTexture();

    var sun = mesh(new THREE.SphereGeometry(6, 20, 16), stdMat('#fff3a0', { emissive: true, emissiveHex: '#ffe066', emissiveIntensity: 0.9, roughness: 0.5 }));
    sun.position.set(-40, 46, -70);
    root.add(sun);

    var clouds = [];
    for (var i = 0; i < 6; i++) {
      var c = makeCloud();
      c.position.set(-60 + Math.random() * 120, 26 + Math.random() * 10, -50 - Math.random() * 30);
      c.scale.setScalar(1.5 + Math.random());
      root.add(c);
      clouds.push({ obj: c, speed: 0.4 + Math.random() * 0.4, startX: c.position.x });
    }
    animItems.push({ fn: function (t) {
      clouds.forEach(function (cl) {
        cl.obj.position.x = cl.startX + Math.sin(t * 0.02 * cl.speed) * 6 + t * cl.speed * 0.15;
        if (cl.obj.position.x > 90) cl.obj.position.x -= 180;
      });
    }});

    var ground = mesh(new THREE.CircleGeometry(120, 48), stdMat('#ffffff', { map: grassTexture(26), roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    root.add(ground);

    var stoneMat = stdMat('#dcc08e', { roughness: 1 });
    for (var p = 0; p < 7; p++) {
      var pr = mesh(new THREE.CircleGeometry(1.15 + (p % 3) * 0.18, 14), stoneMat);
      pr.rotation.x = -Math.PI / 2;
      pr.rotation.z = p * 0.9;
      pr.scale.set(1, 0.8, 1);
      pr.castShadow = false;
      pr.position.set(Math.sin(p * 0.8) * 1.4, 0.02, 15 - p * 3.6);
      root.add(pr);
    }

    function addTree(x, z, scale) {
      var g = new THREE.Group();
      var trunk = mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8), stdMat('#a9784f', { roughness: 0.8 }));
      trunk.position.y = 1.1;
      g.add(trunk);
      var leafMat = stdMat('#4fb35c', { roughness: 0.85 });
      for (var i = 0; i < 3; i++) {
        var leaf = mesh(new THREE.SphereGeometry(1.5 - i * 0.25, 12, 10), leafMat);
        leaf.position.y = 2.6 + i * 1.1;
        g.add(leaf);
      }
      g.position.set(x, 0, z);
      g.scale.setScalar(scale || 1);
      root.add(g);
    }
    [[-32, -8, 1.2], [32, -10, 1.4], [-40, 6, 0.9], [40, 4, 1.0], [-18, -30, 1.1], [20, -32, 0.9]].forEach(function (t) {
      addTree(t[0], t[1], t[2]);
    });

    var order = ['house', 'school', 'library', 'clinic', 'firestation', 'police'];
    var radius = 30;
    var arcSpan = Math.PI * 0.72;
    var startAngle = Math.PI / 2 + arcSpan / 2;
    var schoolPos = null;
    order.forEach(function (placeId, idx) {
      var place = HH.PLACES[placeId];
      if (!place) return;
      var t = order.length > 1 ? idx / (order.length - 1) : 0.5;
      var angle = startAngle - t * arcSpan;
      var x = Math.cos(angle) * radius;
      var z = -Math.sin(angle) * radius - 6;
      var bldg = place.unlocked ? buildUnlockedBuilding(placeId, place) : buildLockedBuilding(placeId, place);
      bldg.position.set(x, 0, z);
      bldg.lookAt(0, 0, 6);
      root.add(bldg);
      if (placeId === 'school') schoolPos = { x: x, z: z };
      // buildings feel alive & tappable: gentle staggered breathing pulse
      hubBuildings[placeId] = { group: bldg, x: x, z: z, popT: -1 };
      (function (grp, phase, rec) {
        animItems.push({ fn: function (t) {
          var s = 1 + 0.018 * Math.sin(t * 1.4 + phase);
          if (rec.popT >= 0) { // tap pop: quick squash-and-bounce
            var pt = t - rec.popT;
            if (pt < 0.42) s *= 1 + 0.14 * Math.sin(pt / 0.42 * Math.PI);
            else rec.popT = -1;
          }
          grp.scale.set(s, s, s);
        }});
      })(bldg, idx * 1.1, hubBuildings[placeId]);
    });

    // the kid + Nilu stand at the path, ready to walk to a chosen building
    hubAvatar = buildAvatar();
    hubAvatar.group.position.set(0.8, 0, 8.5);
    hubAvatar.group.rotation.y = Math.PI; // face the town
    root.add(hubAvatar.group);
    var hubNilu = buildNilu();
    hubNilu.group.position.set(-0.9, 0, 9.3);
    hubNilu.group.rotation.y = Math.PI;
    root.add(hubNilu.group);
    hubAvatar.nilu = hubNilu;
    animItems.push({ fn: function (t) {
      if (hubWalk) return; // walking animation owns the pose
      hubAvatar.group.position.y = Math.abs(Math.sin(t * 1.8)) * 0.03;
      hubNilu.group.position.y = Math.abs(Math.sin(t * 2.1 + 1)) * 0.04;
    }});

    // ---- extra trees of varied sizes, scattered further out for depth ----
    [[-50, -18, 0.6], [50, -20, 0.65], [-10, -45, 1.6], [10, -46, 1.5], [-55, 20, 0.8], [55, 18, 0.75], [0, -55, 1.8], [-24, 22, 0.7]].forEach(function (t) {
      addTree(t[0], t[1], t[2]);
    });

    // ---- fence flanking the entrance path (purely decorative — hub has no
    // avatar/collision system, only the tappable buildings matter here) ----
    for (var fz = 12; fz > -5; fz -= 2.3) {
      [-3.0, 3.0].forEach(function (fx) {
        var seg = buildFenceSegment(2.2);
        seg.position.set(fx, 0, fz);
        seg.rotation.y = Math.PI / 2;
        root.add(seg);
      });
    }

    // ---- benches on the lawn ----
    [[-6.5, 9, Math.PI / 2], [6.5, 5, -Math.PI / 2], [-9, -2, Math.PI / 2]].forEach(function (b) {
      var bench = buildBench();
      bench.position.set(b[0], 0, b[1]);
      bench.rotation.y = b[2];
      root.add(bench);
    });

    // ---- flower beds ----
    addFlowerBed(root, -14, 10, 3.2, 1.6);
    addFlowerBed(root, 14, 8, 3.2, 1.6);
    addFlowerBed(root, 0, 20, 4.0, 1.6);

    // ---- pond + butterflies on the open lawn ----
    addPond(root, 22, 16, 3.2);
    addButterflies(root, -14, 9, 2);
    addButterflies(root, 22, 15, 1);

    // ---- a swing near the school building ----
    if (schoolPos) {
      var hubSwing = buildSwingSet(1.3);
      hubSwing.position.set(schoolPos.x + 4, 0, schoolPos.z + 11);
      root.add(hubSwing);
    }

    root.add(new THREE.AmbientLight(0xfff6e0, 0.5));
    var hemi = new THREE.HemisphereLight(0xbfe3ff, 0x8fce6a, 0.5);
    root.add(hemi);
    var sun = makeSun();
    sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -34;
    root.add(sun);
    root.add(sun.target);

    return root;
  }

  function houseColors() {
    return { wall: '#ffd9a0', roof: '#e8574b', door: '#8a5a26', trim: '#ffffff' };
  }

  function buildUnlockedBuilding(placeId, place) {
    var g = new THREE.Group();
    g.userData = { placeId: placeId };

    if (placeId === 'house') {
      var col = houseColors();
      var W = 8, D = 7, H = 5.5;
      var body = mesh(new THREE.BoxGeometry(W, H, D), stdMat(col.wall, { roughness: 0.8 }));
      body.position.y = H / 2;
      g.add(body);
      var roof = mesh(new THREE.ConeGeometry(6.2, 3.2, 4), stdMat(col.roof, { roughness: 0.7 }));
      roof.position.y = H + 1.4;
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      var door = mesh(new THREE.PlaneGeometry(1.6, 2.6), stdMat(col.door, { roughness: 0.7 }));
      door.position.set(0, 1.3, D / 2 + 0.01);
      g.add(door);
      var knob = mesh(new THREE.SphereGeometry(0.09, 8, 8), stdMat('#ffd43b', { metalness: 0.5, roughness: 0.3 }));
      knob.position.set(0.55, 1.3, D / 2 + 0.08);
      g.add(knob);
      [-2.6, 2.6].forEach(function (wx) {
        var winFrame = mesh(new THREE.BoxGeometry(1.5, 1.5, 0.15), stdMat('#ffffff', { roughness: 0.6 }));
        winFrame.position.set(wx, 3.1, D / 2 + 0.02);
        g.add(winFrame);
        var winGlass = mesh(new THREE.PlaneGeometry(1.2, 1.2), stdMat('#8fd6ff', { emissive: true, emissiveHex: '#bfe9ff', emissiveIntensity: 0.3, roughness: 0.3 }));
        winGlass.position.set(wx, 3.1, D / 2 + 0.1);
        g.add(winGlass);
      });
      var chim = mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), stdMat('#c96a4a', { roughness: 0.8 }));
      chim.position.set(2.2, H + 2.2, -1);
      g.add(chim);

      registerTappable(body, { placeId: placeId, kind: 'building' });
      registerTappable(roof, { placeId: placeId, kind: 'building' });
      registerTappable(door, { placeId: placeId, kind: 'building' });

      var sign = makeSignSprite(place.emoji, place.name, { bg: '#fff7e6', border: '#e8574b' }, 3.2);
      sign.position.set(0, H + 4.2, 0);
      g.add(sign);
      registerTappable(sign, { placeId: placeId, kind: 'building' });

    } else if (placeId === 'school') {
      var W2 = 12, D2 = 8, H2 = 6.5;
      var body2 = mesh(new THREE.BoxGeometry(W2, H2, D2), stdMat('#f6cfe0', { roughness: 0.8 }));
      body2.position.y = H2 / 2;
      g.add(body2);
      var roofTrim = mesh(new THREE.BoxGeometry(W2 + 0.4, 0.6, D2 + 0.4), stdMat('#4dabf7', { roughness: 0.7 }));
      roofTrim.position.y = H2 + 0.3;
      g.add(roofTrim);
      var bandTex = canvasTex(function (ctx, w, h) {
        ctx.fillStyle = '#4dabf7'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 90px "Comic Sans MS", sans-serif';
        ctx.fillText('SCHOOL', w / 2, h / 2 + 6);
      }, 1024, 200);
      var band = mesh(new THREE.PlaneGeometry(W2 * 0.85, 1.4), stdMat('#ffffff', { map: bandTex }));
      band.position.set(0, H2 - 0.9, D2 / 2 + 0.02);
      g.add(band);
      [-0.9, 0.9].forEach(function (dx) {
        var door = mesh(new THREE.PlaneGeometry(1.5, 2.8), stdMat('#e8574b', { roughness: 0.7 }));
        door.position.set(dx, 1.4, D2 / 2 + 0.03);
        g.add(door);
        registerTappable(door, { placeId: placeId, kind: 'building' });
      });
      for (var wi = -2; wi <= 2; wi++) {
        if (wi === 0) continue;
        var winFrame2 = mesh(new THREE.BoxGeometry(1.3, 1.3, 0.15), stdMat('#ffffff', { roughness: 0.6 }));
        winFrame2.position.set(wi * 2.2, 4.2, D2 / 2 + 0.02);
        g.add(winFrame2);
        var winGlass2 = mesh(new THREE.PlaneGeometry(1.05, 1.05), stdMat('#8fd6ff', { emissive: true, emissiveHex: '#bfe9ff', emissiveIntensity: 0.3, roughness: 0.3 }));
        winGlass2.position.set(wi * 2.2, 4.2, D2 / 2 + 0.1);
        g.add(winGlass2);
      }
      var pole = mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 8), stdMat('#d9d9d9', { metalness: 0.4, roughness: 0.4 }));
      pole.position.set(W2 / 2 + 1.5, 3.5, D2 / 2 + 1);
      g.add(pole);
      var flag = mesh(new THREE.PlaneGeometry(1.4, 0.9), stdMat('#ffd43b', { roughness: 0.6, side: THREE.DoubleSide }));
      flag.position.set(W2 / 2 + 2.2, 6.5, D2 / 2 + 1);
      g.add(flag);
      animItems.push({ fn: function (t) { flag.rotation.y = Math.sin(t * 1.6) * 0.25; } });

      registerTappable(body2, { placeId: placeId, kind: 'building' });
      registerTappable(band, { placeId: placeId, kind: 'building' });

      var sign2 = makeSignSprite(place.emoji, place.name, { bg: '#eef7ff', border: '#4dabf7' }, 3.6);
      sign2.position.set(0, H2 + 3.4, 0);
      g.add(sign2);
      registerTappable(sign2, { placeId: placeId, kind: 'building' });
    } else {
      // community buildings (library / clinic / fire station / police)
      var th = COMMUNITY_THEMES[placeId] || { wall: '#e8c99a', roof: '#a9713a', band: '#8a5a2a', door: '#6a5a48' };
      var W3 = 7, D3 = 6, H3 = 4.8;
      var body3 = mesh(new THREE.BoxGeometry(W3, H3, D3), stdMat(th.wall, { roughness: 0.85 }));
      body3.position.y = H3 / 2;
      g.add(body3);
      var roof3 = mesh(new THREE.BoxGeometry(W3 + 0.6, 0.6, D3 + 0.6), stdMat(th.roof, { roughness: 0.8 }));
      roof3.position.y = H3 + 0.3;
      g.add(roof3);
      var band3 = mesh(new THREE.BoxGeometry(W3 + 0.08, 0.55, D3 + 0.08), stdMat(th.band, { roughness: 0.7 }));
      band3.position.y = H3 - 0.7;
      g.add(band3);
      var door3 = mesh(new THREE.PlaneGeometry(1.7, 2.4), stdMat(th.door || '#6a5a48', { roughness: 0.7 }));
      door3.position.set(0, 1.2, D3 / 2 + 0.02);
      g.add(door3);
      var knob3 = mesh(new THREE.SphereGeometry(0.09, 8, 8), stdMat('#ffd43b', { metalness: 0.5, roughness: 0.3 }));
      knob3.position.set(0.6, 1.2, D3 / 2 + 0.08);
      g.add(knob3);
      [-2.2, 2.2].forEach(function (wx3) {
        var wf3 = mesh(new THREE.BoxGeometry(1.3, 1.3, 0.15), stdMat('#ffffff', { roughness: 0.6 }));
        wf3.position.set(wx3, 2.9, D3 / 2 + 0.02);
        g.add(wf3);
        var wg3 = mesh(new THREE.PlaneGeometry(1.05, 1.05), stdMat('#8fd6ff', { emissive: true, emissiveHex: '#bfe9ff', emissiveIntensity: 0.3, roughness: 0.3 }));
        wg3.position.set(wx3, 2.9, D3 / 2 + 0.1);
        g.add(wg3);
      });
      // special touch per place: fire station gets a garage door, clinic a cross
      if (placeId === 'firestation') {
        var gd = mesh(new THREE.PlaneGeometry(2.6, 2.2), stdMat('#c9ccd4', { roughness: 0.6 }));
        gd.position.set(-1.8, 1.15, D3 / 2 + 0.03); g.add(gd);
      } else if (placeId === 'clinic') {
        var cc1 = mesh(new THREE.BoxGeometry(0.8, 0.24, 0.1), stdMat('#e8554d', { roughness: 0.5 }));
        cc1.position.set(0, H3 - 0.7, D3 / 2 + 0.06); g.add(cc1);
        var cc2 = mesh(new THREE.BoxGeometry(0.24, 0.8, 0.1), stdMat('#e8554d', { roughness: 0.5 }));
        cc2.position.set(0, H3 - 0.7, D3 / 2 + 0.06); g.add(cc2);
      }
      var emojiSign3 = makeEmojiSprite(place.emoji, 1.9);
      emojiSign3.position.set(0, H3 + 1.6, 0.3);
      g.add(emojiSign3);
      registerTappable(body3, { placeId: placeId, kind: 'building' });
      registerTappable(door3, { placeId: placeId, kind: 'building' });
      registerTappable(emojiSign3, { placeId: placeId, kind: 'building' });
      var sign3 = makeSignSprite(place.emoji, place.name, { bg: '#fff7e6', border: th.roof }, 3.0);
      sign3.position.set(0, H3 + 3.2, 0);
      g.add(sign3);
      registerTappable(sign3, { placeId: placeId, kind: 'building' });
    }

    return g;
  }
  var COMMUNITY_THEMES = {
    library:     { wall: '#e8c99a', roof: '#a9713a', band: '#8a5a2a', door: '#6a4a28' },
    clinic:      { wall: '#f2f5f8', roof: '#7fb8d8', band: '#e8590c', door: '#7fb8d8' },
    firestation: { wall: '#e8695a', roof: '#b8352a', band: '#f8c537', door: '#8a2a20' },
    police:      { wall: '#7f96c9', roof: '#3a4f8a', band: '#f5f7fa', door: '#2c3e6a' },
  };

  var LOCKED_THEMES = {
    library:     { wall: '#e8c99a', roof: '#a9713a', band: '#8a5a2a' },
    clinic:      { wall: '#f2f5f8', roof: '#7fb8d8', band: '#e8590c' },
    firestation: { wall: '#e8695a', roof: '#b8352a', band: '#f8c537' },
    police:      { wall: '#7f96c9', roof: '#3a4f8a', band: '#f5f7fa' },
  };
  function buildLockedBuilding(placeId, place) {
    var g = new THREE.Group();
    g.userData = { placeId: placeId };
    var theme = LOCKED_THEMES[placeId] || { wall: '#c9b8a0', roof: '#8f7a5a', band: '#6a5a44' };
    var W = 6, D = 5.5, H = 4.2;
    var body = mesh(new THREE.BoxGeometry(W, H, D), stdMat(theme.wall, { roughness: 0.85 }));
    body.position.y = H / 2;
    g.add(body);
    var roof = mesh(new THREE.BoxGeometry(W + 0.5, 0.55, D + 0.5), stdMat(theme.roof, { roughness: 0.8 }));
    roof.position.y = H + 0.27;
    g.add(roof);
    var band = mesh(new THREE.BoxGeometry(W + 0.06, 0.5, D + 0.06), stdMat(theme.band, { roughness: 0.7 }));
    band.position.y = H - 0.65;
    g.add(band);
    var door = mesh(new THREE.PlaneGeometry(1.3, 2.0), stdMat('#6a5a48', { roughness: 0.8 }));
    door.position.set(0, 1.0, D / 2 + 0.02);
    g.add(door);
    [-1.9, 1.9].forEach(function (wx) {
      var frame = mesh(new THREE.PlaneGeometry(1.08, 1.08), stdMat('#ffffff', { roughness: 0.6 }));
      frame.position.set(wx, 2.3, D / 2 + 0.015);
      g.add(frame);
      var win = mesh(new THREE.PlaneGeometry(0.9, 0.9), stdMat('#bfe0f2', { roughness: 0.3 }));
      win.position.set(wx, 2.3, D / 2 + 0.03);
      g.add(win);
    });

    var emojiSign = makeEmojiSprite(place.emoji, 2.2);
    emojiSign.position.set(0, H + 1.7, 0.3);
    g.add(emojiSign);

    var lock = padlockSprite();
    lock.scale.set(2.2, 2.2, 1);
    lock.position.set(0, H * 0.55, D / 2 + 0.7);
    g.add(lock);

    var sign = makeSignSprite(null, place.name, { bg: '#eef0f3', border: '#767f8f' }, 2.6);
    sign.position.set(0, H + 3.1, 0);
    g.add(sign);

    [body, roof, door, emojiSign, lock, sign].forEach(function (m) {
      registerTappable(m, { placeId: placeId, kind: 'building' });
    });

    return g;
  }

  // =========================================================================
  // DECOR HELPERS — cheap primitives + canvas textures, reused across rooms,
  // hallways and the hub to fill empty floor/wall space. None of these are
  // collidable unless explicitly registered by the caller with regCollider().
  // =========================================================================
  var decorTexCache = {};
  function cachedTex(key, build) {
    if (!decorTexCache[key]) decorTexCache[key] = build();
    return decorTexCache[key];
  }
  function framedPictureTex(emoji, bg, border) {
    return cachedTex('pic|' + emoji + '|' + bg + '|' + border, function () {
      return canvasTex(function (ctx, w, h) {
        ctx.fillStyle = border; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = bg; roundRect(ctx, 16, 16, w - 32, h - 32, 10); ctx.fill();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = Math.floor(h * 0.5) + 'px serif';
        ctx.fillText(emoji, w / 2, h / 2 + 8);
      }, 256, 256);
    });
  }
  // wall decor: a small framed picture/poster, flush against a wall. rotY
  // should point the plane's normal INTO the room (e.g. 0 for a zMin wall,
  // Math.PI for a zMax wall, ±PI/2 for x walls).
  function addFramedPicture(g, x, y, z, rotY, emoji, bg, border, size) {
    size = size || 1.1;
    var m = mesh(new THREE.PlaneGeometry(size, size), stdMat('#ffffff', { map: framedPictureTex(emoji, bg || '#fff7e6', border || '#8a5a26'), roughness: 0.7 }));
    m.position.set(x, y, z);
    m.rotation.y = rotY || 0;
    g.add(m);
    return m;
  }
  function clockTexture() {
    return cachedTex('clock', function () {
      return canvasTex(function (ctx, w, h) {
        ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4a3222'; ctx.lineWidth = 10; ctx.stroke();
        ctx.fillStyle = '#4a3222';
        for (var i = 0; i < 12; i++) {
          var a = (i / 12) * Math.PI * 2;
          ctx.beginPath(); ctx.arc(w / 2 + Math.sin(a) * w * 0.38, h / 2 - Math.cos(a) * w * 0.38, 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = '#e8574b'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2 + w * 0.22, h / 2 - w * 0.1); ctx.stroke();
        ctx.strokeStyle = '#2c2416'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2, h / 2 - w * 0.28); ctx.stroke();
      }, 160, 160);
    });
  }
  function addWallClock(g, x, y, z, rotY, size) {
    size = size || 0.72;
    var m = mesh(new THREE.CircleGeometry(size / 2, 20), stdMat('#ffffff', { map: clockTexture(), roughness: 0.6 }));
    m.position.set(x, y, z);
    m.rotation.y = rotY || 0;
    g.add(m);
    return m;
  }
  function addWallShelf(g, x, y, z, rotY, w) {
    w = w || 1.4;
    var grp = new THREE.Group();
    var shelf = mesh(new THREE.BoxGeometry(w, 0.08, 0.3), stdMat('#c8996a', { roughness: 0.6 }));
    grp.add(shelf);
    var itemColors = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b'];
    var n = 2 + (Math.abs(hashStr('shelf' + x + z)) % 2);
    for (var i = 0; i < n; i++) {
      var it = mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), stdMat(itemColors[i % itemColors.length], { roughness: 0.6 }));
      it.position.set(-w / 2 + 0.26 + i * 0.32, 0.15, 0);
      grp.add(it);
    }
    grp.position.set(x, y, z);
    grp.rotation.y = rotY || 0;
    g.add(grp);
    return grp;
  }
  // floor rug — never collidable, kids should walk freely over it
  function addRug(g, x, z, w, d, color) {
    var rug = mesh(new THREE.PlaneGeometry(w, d), stdMat(color, { roughness: 0.92 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(x, 0.02, z);
    g.add(rug);
    return rug;
  }
  function buildPottedPlant(scale) {
    scale = scale || 1;
    var grp = new THREE.Group();
    var pot = mesh(new THREE.CylinderGeometry(0.22 * scale, 0.17 * scale, 0.32 * scale, 10), stdMat('#c96a4a', { roughness: 0.75 }));
    pot.position.y = 0.16 * scale;
    grp.add(pot);
    var leafMat = stdMat('#4fb35c', { roughness: 0.85 });
    for (var i = 0; i < 3; i++) {
      var leaf = mesh(new THREE.SphereGeometry(0.24 * scale, 10, 8), leafMat);
      leaf.position.set((i - 1) * 0.12 * scale, (0.42 + i * 0.14) * scale, (i % 2 ? 1 : -1) * 0.06 * scale);
      grp.add(leaf);
    }
    return grp;
  }
  function addPottedPlant(parent, x, z, scale) {
    var grp = buildPottedPlant(scale);
    grp.position.x = x; grp.position.z = z;
    parent.add(grp);
    return grp;
  }
  function buildBench() {
    var grp = new THREE.Group();
    var woodMat = stdMat('#c8996a', { roughness: 0.7 });
    var seat = mesh(new THREE.BoxGeometry(1.7, 0.12, 0.55), woodMat);
    seat.position.y = 0.48;
    grp.add(seat);
    var back = mesh(new THREE.BoxGeometry(1.7, 0.5, 0.1), woodMat);
    back.position.set(0, 0.74, -0.22);
    grp.add(back);
    var legMat = stdMat('#8a5a26', { roughness: 0.7 });
    [-0.68, 0.68].forEach(function (lx) {
      var leg = mesh(new THREE.BoxGeometry(0.1, 0.48, 0.5), legMat);
      leg.position.set(lx, 0.24, 0);
      grp.add(leg);
    });
    return grp;
  }
  function buildFenceSegment(len) {
    len = len || 2.2;
    var grp = new THREE.Group();
    var railMat = stdMat('#ffffff', { roughness: 0.7 });
    [0.24, 0.52].forEach(function (ry) {
      var rail = mesh(new THREE.BoxGeometry(len, 0.07, 0.06), railMat);
      rail.position.y = ry;
      grp.add(rail);
    });
    var postMat = stdMat('#e8d9c0', { roughness: 0.7 });
    [-len / 2, len / 2].forEach(function (px) {
      var post = mesh(new THREE.BoxGeometry(0.09, 0.68, 0.09), postMat);
      post.position.set(px, 0.34, 0);
      grp.add(post);
    });
    return grp;
  }
  var flowerEmojis = ['🌸', '🌷', '🌼'];
  function addFlowerBed(root, x, z, w, d) {
    var soil = mesh(new THREE.BoxGeometry(w, 0.1, d), stdMat('#7a5230', { roughness: 0.9 }));
    soil.position.set(x, 0.05, z);
    root.add(soil);
    var n = Math.max(4, Math.round(w * d * 1.6));
    for (var i = 0; i < n; i++) {
      var fx = x + (Math.random() - 0.5) * (w - 0.35);
      var fz = z + (Math.random() - 0.5) * (d - 0.35);
      var flower = makeEmojiSprite(flowerEmojis[i % flowerEmojis.length], 0.42);
      flower.position.set(fx, 0.26, fz);
      root.add(flower);
    }
  }
  function addPond(root, x, z, r) {
    var rim = mesh(new THREE.CircleGeometry(r + 0.3, 28), stdMat('#d8cba0', { roughness: 0.9 }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(x, 0.01, z);
    root.add(rim);
    var water = mesh(new THREE.CircleGeometry(r, 28), stdMat('#4fb3ff', { roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.92 }));
    water.rotation.x = -Math.PI / 2; water.position.set(x, 0.03, z);
    root.add(water);
    var lily = makeEmojiSprite('🪷', 0.55);
    lily.position.set(x + r * 0.35, 0.05, z - r * 0.15);
    root.add(lily);
  }
  function addButterflies(root, x, z, count) {
    for (var i = 0; i < count; i++) {
      (function () {
        var spr = makeEmojiSprite('🦋', 0.5);
        var baseX = x + (Math.random() - 0.5) * 3, baseZ = z + (Math.random() - 0.5) * 3;
        var baseY = 1.2 + Math.random() * 0.6;
        spr.position.set(baseX, baseY, baseZ);
        root.add(spr);
        var phase = Math.random() * Math.PI * 2;
        animItems.push({ fn: function (t) {
          spr.position.x = baseX + Math.sin(t * 0.6 + phase) * 1.8;
          spr.position.z = baseZ + Math.cos(t * 0.45 + phase) * 1.8;
          spr.position.y = baseY + Math.sin(t * 3 + phase) * 0.22;
        }});
      })();
    }
  }
  function buildSwingSet(scale) {
    scale = scale || 1;
    var grp = new THREE.Group();
    var poleMat = stdMat('#4dabf7', { roughness: 0.6 });
    var poleH = 2.5 * scale, spanW = 2.3 * scale;
    [-spanW / 2, spanW / 2].forEach(function (px) {
      var post = mesh(new THREE.CylinderGeometry(0.09 * scale, 0.09 * scale, poleH, 8), poleMat);
      post.position.set(px, poleH / 2, 0);
      grp.add(post);
      var brace = mesh(new THREE.CylinderGeometry(0.07 * scale, 0.07 * scale, poleH * 0.8, 8), poleMat);
      brace.position.set(px * 1.3, poleH * 0.42, -0.5 * scale);
      brace.rotation.x = 0.55;
      grp.add(brace);
    });
    var bar = mesh(new THREE.CylinderGeometry(0.09 * scale, 0.09 * scale, spanW + 0.3 * scale, 8), poleMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, poleH, 0);
    grp.add(bar);
    var seatMat = stdMat('#ffd43b', { roughness: 0.6 });
    var ropeMat = stdMat('#8a5a26', { roughness: 0.7 });
    [-0.5 * scale, 0.5 * scale].forEach(function (sx) {
      [-0.09, 0.09].forEach(function (rz) {
        var rope = mesh(new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, poleH * 0.62, 6), ropeMat);
        rope.position.set(sx, poleH - poleH * 0.31, rz);
        grp.add(rope);
      });
      var seat = mesh(new THREE.BoxGeometry(0.5 * scale, 0.06 * scale, 0.22 * scale), seatMat);
      seat.position.set(sx, poleH * 0.38, 0);
      grp.add(seat);
    });
    return grp;
  }
  function buildSandbox(w, d) {
    var grp = new THREE.Group();
    var sand = mesh(new THREE.BoxGeometry(w, 0.08, d), stdMat('#e8c987', { roughness: 0.95 }));
    sand.position.y = 0.04;
    grp.add(sand);
    var frameMat = stdMat('#a9784f', { roughness: 0.8 });
    var t = 0.14;
    [[w / 2 - t / 2, 0, t, d], [-w / 2 + t / 2, 0, t, d], [0, d / 2 - t / 2, w, t], [0, -d / 2 + t / 2, w, t]].forEach(function (s) {
      var seg = mesh(new THREE.BoxGeometry(s[2], 0.18, s[3]), frameMat);
      seg.position.set(s[0], 0.09, s[1]);
      grp.add(seg);
    });
    return grp;
  }
  function pennantTexture() {
    return cachedTex('pennant', function () {
      return canvasTex(function (ctx, w, h) {
        var colors = ['#ff6b6b', '#4dabf7', '#ffd43b', '#51cf66', '#c26bff'];
        var n = 8, tw = w / n;
        for (var i = 0; i < n; i++) {
          ctx.fillStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.moveTo(i * tw, 0); ctx.lineTo((i + 1) * tw, 0); ctx.lineTo((i + 0.5) * tw, h); ctx.closePath(); ctx.fill();
        }
      }, 512, 128);
    });
  }
  function addPennantString(parent, x1, z1, x2, z2, y) {
    var len = Math.hypot(x2 - x1, z2 - z1);
    var m = mesh(new THREE.PlaneGeometry(len, 0.32), stdMat('#ffffff', { map: pennantTexture(), transparent: true, side: THREE.DoubleSide }));
    m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    m.rotation.y = Math.atan2(x2 - x1, z2 - z1) + Math.PI / 2;
    parent.add(m);
  }
  function alphabetPosterTex() {
    return cachedTex('alphabet', function () {
      return canvasTex(function (ctx, w, h) {
        ctx.fillStyle = '#fff9e6'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#4a3222'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12);
        ctx.fillStyle = '#2c2416'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 42px "Comic Sans MS", sans-serif';
        var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var cols = 7, rows = 4;
        for (var i = 0; i < letters.length; i++) {
          var cx = 40 + (i % cols) * (w - 80) / (cols - 1);
          var cy = 50 + Math.floor(i / cols) * (h - 100) / (rows - 1);
          ctx.fillText(letters[i], cx, cy);
        }
      }, 512, 320);
    });
  }
  function menuBoardTex() {
    return cachedTex('menu', function () {
      return canvasTex(function (ctx, w, h) {
        ctx.fillStyle = '#2f7d4f'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
        ctx.font = 'bold 38px "Comic Sans MS", sans-serif';
        ctx.fillText("TODAY'S LUNCH", w / 2, 46);
        ctx.font = '30px "Comic Sans MS", sans-serif';
        ['🍎 Apple', '🥪 Sandwich', '🥛 Milk'].forEach(function (line, i) { ctx.fillText(line, w / 2, 104 + i * 46); });
      }, 420, 260);
    });
  }
  function eyeChartTex() {
    return cachedTex('eyechart', function () {
      return canvasTex(function (ctx, w, h) {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#bcdec4'; ctx.lineWidth = 6; ctx.strokeRect(4, 4, w - 8, h - 8);
        ctx.fillStyle = '#2c2416'; ctx.textAlign = 'center';
        var rows = ['E', 'F P', 'T O Z', 'L P E D'];
        rows.forEach(function (r, i) { ctx.font = (60 - i * 11) + 'px monospace'; ctx.fillText(r, w / 2, 60 + i * 68); });
      }, 300, 340);
    });
  }

  // =========================================================================
  // ROOM PALETTES (also used for interior wall colors)
  // =========================================================================
  var ROOM_PALETTES = {
    bedroom:   { wall: '#4f95dc', wall2: '#3f82c9', floor: '#d8a15c' },
    bathroom:  { wall: '#29bfc2', wall2: '#20a9ac', floor: '#7fcfd6' },
    kitchen:   { wall: '#f2a03d', wall2: '#e08e2e', floor: '#c9a06a' },
    dining:    { wall: '#ef7360', wall2: '#e2604c', floor: '#d8a15c' },
    living:    { wall: '#f0c022', wall2: '#deae10', floor: '#b9814a' },
    classroom: { wall: '#4499e0', wall2: '#3487cf', floor: '#d8a15c' },
    cafeteria: { wall: '#efa03c', wall2: '#e08e2a', floor: '#c9a06a' },
    playground:{ wall: null, wall2: null, floor: '#6ec651' },
    office:    { wall: '#8266d9', wall2: '#7154c7', floor: '#c9bb96' },
    nurseroom: { wall: '#3dc088', wall2: '#2fae77', floor: '#bcdec4' },
    readingroom: { wall: '#d99a4e', wall2: '#c9883c', floor: '#b9814a' },
    checkout:    { wall: '#c9883c', wall2: '#b9772e', floor: '#b9814a' },
    waiting:     { wall: '#57c9a2', wall2: '#46b791', floor: '#cfe8d8' },
    examroom:    { wall: '#54aede', wall2: '#449ccc', floor: '#d8e8f0' },
    garage:      { wall: '#d95f4e', wall2: '#c94e3d', floor: '#a8a8b0' },
    gearroom:    { wall: '#e0a03c', wall2: '#cf8f2c', floor: '#c9a06a' },
    frontdesk:   { wall: '#5a76c9', wall2: '#4a65b8', floor: '#c9c4b0' },
    safecorner:  { wall: '#3fb8ae', wall2: '#2fa69c', floor: '#d8ead8' },
  };
  TILE_ROOMS.garage = 1; TILE_ROOMS.waiting = 1; TILE_ROOMS.examroom = 1; TILE_ROOMS.frontdesk = 1;

  // ---- furniture builders keyed by room id (unchanged: local coords, shell.roomW/roomD) ----
  var FURNITURE_BUILDERS = {
    bedroom: function (g, shell) {
      var bed = new THREE.Group();
      var frame = mesh(new THREE.BoxGeometry(3.2, 0.6, 2.2), stdMat('#c8996a', { roughness: 0.7 }));
      frame.position.y = 0.3;
      bed.add(frame);
      var mattress = mesh(new THREE.BoxGeometry(3.0, 0.4, 2.0), stdMat('#ffffff', { roughness: 0.8 }));
      mattress.position.y = 0.8;
      bed.add(mattress);
      var pillow = mesh(new THREE.BoxGeometry(0.9, 0.25, 0.7), stdMat('#8fd6ff', { roughness: 0.6 }));
      pillow.position.set(-1.0, 1.05, 0);
      bed.add(pillow);
      var blanket = mesh(new THREE.BoxGeometry(3.0, 0.15, 1.2), stdMat('#ff9fb0', { roughness: 0.7 }));
      blanket.position.set(0.4, 1.0, 0);
      bed.add(blanket);
      bed.position.set(-4.2, 0, -shell.roomD / 2 + 1.6);
      g.add(bed);
      regCollider(bed);

      var nightstand = new THREE.Group();
      var stand = mesh(new THREE.BoxGeometry(1.0, 1.0, 0.9), stdMat('#e8a659', { roughness: 0.6 }));
      stand.position.y = 0.5;
      nightstand.add(stand);
      var lampBase = mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.4, 10), stdMat('#5c4326', { roughness: 0.6 }));
      lampBase.position.y = 1.2;
      nightstand.add(lampBase);
      var lampShade = mesh(new THREE.ConeGeometry(0.35, 0.5, 12, 1, false), stdMat('#fff3bf', { emissive: true, emissiveHex: '#ffe066', emissiveIntensity: 0.5 }));
      lampShade.position.y = 1.6;
      nightstand.add(lampShade);
      nightstand.position.set(-2.2, 0, -shell.roomD / 2 + 1.1);
      g.add(nightstand);
      regCollider(nightstand);

      addRug(g, -4.0, -shell.roomD / 2 + 2.1, 4.0, 2.8, '#ffb3c6');

      // extra props: dresser + a second floor lamp, filling the open front half
      var dresser = new THREE.Group();
      var dbody = mesh(new THREE.BoxGeometry(2.0, 1.1, 0.7), stdMat('#e8a659', { roughness: 0.6 }));
      dbody.position.y = 0.55;
      dresser.add(dbody);
      [-0.55, 0, 0.55].forEach(function (dx) {
        var drawer = mesh(new THREE.BoxGeometry(0.55, 0.3, 0.05), stdMat('#c8996a', { roughness: 0.5 }));
        drawer.position.set(dx, 0.75, 0.36);
        dresser.add(drawer);
        var knob = mesh(new THREE.SphereGeometry(0.04, 8, 8), stdMat('#5c4326', { roughness: 0.4 }));
        knob.position.set(dx, 0.75, 0.4);
        dresser.add(knob);
      });
      var mirrorTop = mesh(new THREE.PlaneGeometry(1.3, 0.9), stdMat('#cfefff', { emissive: true, emissiveHex: '#eaffff', emissiveIntensity: 0.2, roughness: 0.2 }));
      mirrorTop.position.set(0, 1.55, 0.34);
      dresser.add(mirrorTop);
      dresser.position.set(4.4, 0, 1.7);
      g.add(dresser);
      regCollider(dresser);

      var floorLamp = new THREE.Group();
      var poleMesh = mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.5, 8), stdMat('#5c4326', { roughness: 0.6 }));
      poleMesh.position.y = 0.75;
      floorLamp.add(poleMesh);
      var floorShade = mesh(new THREE.ConeGeometry(0.32, 0.45, 12, 1, false), stdMat('#fff3bf', { emissive: true, emissiveHex: '#ffe066', emissiveIntensity: 0.5 }));
      floorShade.position.y = 1.7;
      floorLamp.add(floorShade);
      floorLamp.position.set(1.6, 0, 3.1);
      g.add(floorLamp);
      regCollider(floorLamp);

      addFramedPicture(g, -1.4, 2.3, shell.roomD / 2 - 0.12, Math.PI, '🌙', '#e8f4ff', '#4f95dc');
      addWallClock(g, 2.2, 2.6, shell.roomD / 2 - 0.12, Math.PI);
      addWallShelf(g, 5.0, 2.0, shell.roomD / 2 - 0.18, Math.PI, 1.3);

      return { bed: new THREE.Vector3(-4.2, 1.5, -shell.roomD / 2 + 1.6), lamp: new THREE.Vector3(-2.2, 1.7, -shell.roomD / 2 + 1.1), teddy: new THREE.Vector3(-3.0, 1.15, -shell.roomD / 2 + 2.0) };
    },
    bathroom: function (g, shell) {
      var toilet = new THREE.Group();
      var base = mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.7, 12), stdMat('#ffffff', { roughness: 0.4 }));
      base.position.y = 0.35;
      toilet.add(base);
      var tank = mesh(new THREE.BoxGeometry(0.7, 0.6, 0.3), stdMat('#ffffff', { roughness: 0.4 }));
      tank.position.set(0, 0.9, -0.25);
      toilet.add(tank);
      toilet.position.set(-5.2, 0, -shell.roomD / 2 + 1.2);
      g.add(toilet);
      regCollider(toilet);

      var sinkUnit = new THREE.Group();
      var sinkCounter = mesh(new THREE.BoxGeometry(1.6, 0.9, 0.7), stdMat('#ff9fb0', { roughness: 0.5 }));
      sinkCounter.position.y = 0.45;
      sinkUnit.add(sinkCounter);
      var basin = mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.15, 16), stdMat('#ffffff', { roughness: 0.3 }));
      basin.position.y = 0.95;
      sinkUnit.add(basin);
      sinkUnit.position.set(1.5, 0, -shell.roomD / 2 + 0.9);
      g.add(sinkUnit);
      regCollider(sinkUnit);
      var mirror = mesh(new THREE.PlaneGeometry(1.3, 1.0), stdMat('#cfefff', { emissive: true, emissiveHex: '#eaffff', emissiveIntensity: 0.2, roughness: 0.2 }));
      mirror.position.set(1.5, 2.0, -shell.roomD / 2 + 0.18);
      g.add(mirror);

      var tubUnit = new THREE.Group();
      var tub = mesh(new THREE.BoxGeometry(2.6, 0.9, 1.4), stdMat('#ffe066', { roughness: 0.4 }));
      tub.position.y = 0.45;
      tubUnit.add(tub);
      var tubBasin = mesh(new THREE.BoxGeometry(2.2, 0.4, 1.0), stdMat('#ffffff', { roughness: 0.4 }));
      tubBasin.position.y = 0.75;
      tubUnit.add(tubBasin);
      tubUnit.position.set(4.6, 0, -shell.roomD / 2 + 1.2);
      g.add(tubUnit);
      regCollider(tubUnit);

      // extra props: bathmat + a full-length mirror over a small storage cabinet
      addRug(g, 1.5, -shell.roomD / 2 + 2.3, 1.6, 1.0, '#ffe9a8');

      var vanity = new THREE.Group();
      var vbody = mesh(new THREE.BoxGeometry(1.0, 0.7, 0.5), stdMat('#7fcfd6', { roughness: 0.6 }));
      vbody.position.y = 0.35;
      vanity.add(vbody);
      vanity.position.set(4.6, 0, 2.6);
      g.add(vanity);
      regCollider(vanity);
      var fullMirror = mesh(new THREE.PlaneGeometry(0.9, 1.4), stdMat('#cfefff', { emissive: true, emissiveHex: '#eaffff', emissiveIntensity: 0.2, roughness: 0.2 }));
      fullMirror.position.set(4.6, 1.7, shell.roomD / 2 - 0.14);
      fullMirror.rotation.y = Math.PI;
      g.add(fullMirror);

      addFramedPicture(g, -1.0, 2.2, shell.roomD / 2 - 0.12, Math.PI, '🐳', '#e8fbff', '#29bfc2');
      addWallClock(g, -3.4, 2.5, shell.roomD / 2 - 0.12, Math.PI);
      addWallShelf(g, 0.4, 1.9, shell.roomD / 2 - 0.18, Math.PI, 1.1);

      return { toilet: new THREE.Vector3(-5.2, 1.2, -shell.roomD / 2 + 1.2), toothbrush: new THREE.Vector3(1.9, 1.3, -shell.roomD / 2 + 0.9), soap: new THREE.Vector3(1.1, 1.3, -shell.roomD / 2 + 0.9) };
    },
    kitchen: function (g, shell) {
      var stove = new THREE.Group();
      var body = mesh(new THREE.BoxGeometry(1.4, 1.4, 1.0), stdMat('#e8574b', { roughness: 0.5 }));
      body.position.y = 0.7;
      stove.add(body);
      var burnersTex = canvasTex(function (ctx, w, h) {
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#222';
        [[0.28, 0.3], [0.72, 0.3], [0.28, 0.72], [0.72, 0.72]].forEach(function (p) {
          ctx.beginPath(); ctx.arc(w * p[0], h * p[1], w * 0.14, 0, Math.PI * 2); ctx.fill();
        });
      }, 128, 128);
      var top = mesh(new THREE.BoxGeometry(1.4, 0.08, 1.0), stdMat('#ffffff', { map: burnersTex }));
      top.position.y = 1.42;
      stove.add(top);
      stove.position.set(-4.6, 0, -shell.roomD / 2 + 1.0);
      g.add(stove);
      regCollider(stove);

      var fridge = new THREE.Group();
      var fbody = mesh(new THREE.BoxGeometry(1.3, 2.4, 1.1), stdMat('#dff6ff', { roughness: 0.4 }));
      fbody.position.y = 1.2;
      fridge.add(fbody);
      var handle = mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), stdMat('#7a8a99', { metalness: 0.5, roughness: 0.3 }));
      handle.position.set(0.55, 1.4, 0.58);
      fridge.add(handle);
      fridge.position.set(4.6, 0, -shell.roomD / 2 + 1.1);
      g.add(fridge);
      regCollider(fridge);

      var counter = mesh(new THREE.BoxGeometry(2.6, 1.0, 0.8), stdMat('#ffd699', { roughness: 0.5 }));
      counter.position.set(0.3, 0.5, -shell.roomD / 2 + 0.9);
      g.add(counter);
      regCollider(counter);

      // extra prop: a second counter/island with a stack of pots, plus a
      // hanging pot rack on the wall
      var island = new THREE.Group();
      var itop = mesh(new THREE.BoxGeometry(2.2, 0.9, 1.0), stdMat('#ffd699', { roughness: 0.5 }));
      itop.position.y = 0.45;
      island.add(itop);
      var potColors = ['#c94f4f', '#5c8fd6', '#e0a53d'];
      potColors.forEach(function (c, i) {
        var pot = mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.28, 12), stdMat(c, { roughness: 0.5, metalness: 0.2 }));
        pot.position.set(-0.6 + i * 0.6, 1.04, 0);
        island.add(pot);
      });
      island.position.set(0.6, 0, 2.4);
      g.add(island);
      regCollider(island);

      var rackMat = stdMat('#8a5a26', { roughness: 0.6 });
      var rack = mesh(new THREE.BoxGeometry(1.4, 0.08, 0.1), rackMat);
      rack.position.set(-2.6, 2.4, -shell.roomD / 2 + 0.16);
      g.add(rack);
      [-0.5, 0, 0.5].forEach(function (rx) {
        var hook = mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.16, 10), stdMat('#e0a53d', { roughness: 0.5, metalness: 0.2 }));
        hook.position.set(-2.6 + rx, 2.22, -shell.roomD / 2 + 0.16);
        g.add(hook);
      });

      addFramedPicture(g, 3.0, 2.3, shell.roomD / 2 - 0.12, Math.PI, '🍎', '#fff3e0', '#f2a03d');
      addWallClock(g, -0.6, 2.7, shell.roomD / 2 - 0.12, Math.PI);
      addWallShelf(g, -4.0, 2.0, shell.roomD / 2 - 0.18, Math.PI, 1.2);

      return { stove: new THREE.Vector3(-4.6, 1.8, -shell.roomD / 2 + 1.0), fridge: new THREE.Vector3(4.6, 2.6, -shell.roomD / 2 + 1.1), bowl: new THREE.Vector3(0.3, 1.3, -shell.roomD / 2 + 0.9) };
    },
    dining: function (g, shell) {
      var tableUnit = new THREE.Group();
      var table = mesh(new THREE.CylinderGeometry(1.6, 1.5, 0.15, 20), stdMat('#e8a659', { roughness: 0.5 }));
      table.position.y = 1.1;
      tableUnit.add(table);
      var leg = mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.1, 10), stdMat('#c8996a', { roughness: 0.6 }));
      leg.position.y = 0.55;
      tableUnit.add(leg);
      tableUnit.position.set(0, 0, -0.5);
      g.add(tableUnit);
      regCollider(tableUnit);

      var chairSpots = [];
      var chairColors = ['#ff9fb0', '#8fd6ff', '#ffe066', '#a9e34b'];
      for (var i = 0; i < 4; i++) {
        var a = (i / 4) * Math.PI * 2;
        var cx = Math.cos(a) * 2.2, cz = -0.5 + Math.sin(a) * 2.2;
        var chair = new THREE.Group();
        var seat = mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), stdMat(chairColors[i], { roughness: 0.6 }));
        seat.position.y = 0.75;
        chair.add(seat);
        var back = mesh(new THREE.BoxGeometry(0.7, 0.8, 0.12), stdMat(chairColors[i], { roughness: 0.6 }));
        back.position.set(0, 1.15, -0.3);
        chair.add(back);
        chair.position.set(cx, 0, cz);
        g.add(chair);
        regCollider(chair);
        chairSpots.push(new THREE.Vector3(cx, 1.0, cz));
      }

      addRug(g, 0, -0.5, 4.2, 3.6, '#ffe08a');

      // extra prop: sideboard along the back wall with a bowl on top
      var sideboard = new THREE.Group();
      var sbody = mesh(new THREE.BoxGeometry(2.2, 0.9, 0.6), stdMat('#c8996a', { roughness: 0.6 }));
      sbody.position.y = 0.45;
      sideboard.add(sbody);
      var vase = mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.4, 10), stdMat('#ef7360', { roughness: 0.5 }));
      vase.position.set(0.5, 1.1, 0);
      sideboard.add(vase);
      sideboard.position.set(4.6, 0, -shell.roomD / 2 + 0.6);
      g.add(sideboard);
      regCollider(sideboard);

      addFramedPicture(g, -3.2, 2.3, shell.roomD / 2 - 0.12, Math.PI, '🍽️', '#fff0ec', '#ef7360');
      addWallClock(g, 1.0, 2.6, shell.roomD / 2 - 0.12, Math.PI);
      addWallShelf(g, -5.4, 2.0, shell.roomD / 2 - 0.18, Math.PI, 1.1);

      return { table: new THREE.Vector3(0, 1.5, -0.5), chair: chairSpots[0], milk: new THREE.Vector3(0.5, 1.4, -0.7) };
    },
    living: function (g, shell) {
      var sofa = new THREE.Group();
      var base = mesh(new THREE.BoxGeometry(3.4, 0.7, 1.3), stdMat('#ffe066', { roughness: 0.7 }));
      base.position.y = 0.55;
      sofa.add(base);
      var backCush = mesh(new THREE.BoxGeometry(3.4, 0.9, 0.35), stdMat('#ffd43b', { roughness: 0.7 }));
      backCush.position.set(0, 1.15, -0.5);
      sofa.add(backCush);
      [-1.5, 1.5].forEach(function (ax) {
        var arm = mesh(new THREE.BoxGeometry(0.35, 0.9, 1.3), stdMat('#ffd43b', { roughness: 0.7 }));
        arm.position.set(ax, 0.9, 0);
        sofa.add(arm);
      });
      sofa.position.set(-3.0, 0, -shell.roomD / 2 + 1.4);
      g.add(sofa);
      regCollider(sofa);

      var bookshelfUnit = new THREE.Group();
      var shelf = mesh(new THREE.BoxGeometry(1.6, 1.8, 0.4), stdMat('#c8996a', { roughness: 0.6 }));
      shelf.position.y = 0.9;
      bookshelfUnit.add(shelf);
      var bookCols = ['#ff6b6b', '#4dabf7', '#51cf66'];
      bookCols.forEach(function (c, i) {
        var bk = mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), stdMat(c, { roughness: 0.6 }));
        bk.position.set(-0.5 + i * 0.5, 1.6, 0.05);
        bookshelfUnit.add(bk);
      });
      bookshelfUnit.position.set(4.6, 0, -shell.roomD / 2 + 0.5);
      g.add(bookshelfUnit);
      regCollider(bookshelfUnit);

      var rug = mesh(new THREE.CircleGeometry(1.8, 24), stdMat('#8fd6ff', { roughness: 0.9 }));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0.5, 0.02, 1.0);
      g.add(rug);

      // extra props: TV cabinet facing the sofa + a potted plant
      var tvUnit = new THREE.Group();
      var tvBody = mesh(new THREE.BoxGeometry(2.2, 0.6, 0.5), stdMat('#c8996a', { roughness: 0.6 }));
      tvBody.position.y = 0.3;
      tvUnit.add(tvBody);
      var tvScreen = mesh(new THREE.BoxGeometry(1.8, 1.0, 0.08), stdMat('#2c2c34', { roughness: 0.3 }));
      tvScreen.position.set(0, 1.1, 0);
      tvUnit.add(tvScreen);
      var tvGlow = mesh(new THREE.PlaneGeometry(1.6, 0.85), stdMat('#8fd6ff', { emissive: true, emissiveHex: '#bfe9ff', emissiveIntensity: 0.4, roughness: 0.3 }));
      tvGlow.position.set(0, 1.1, 0.05);
      tvUnit.add(tvGlow);
      tvUnit.position.set(0.4, 0, 3.1);
      tvUnit.rotation.y = Math.PI;
      g.add(tvUnit);
      regCollider(tvUnit);

      addPottedPlant(g, 3.0, 3.0, 1.2);

      addFramedPicture(g, -3.0, 2.4, shell.roomD / 2 - 0.12, Math.PI, '🖼️', '#fff9e6', '#f0c022');
      addWallClock(g, 1.6, 2.7, shell.roomD / 2 - 0.12, Math.PI);
      addWallShelf(g, -5.6, 2.0, shell.roomD / 2 - 0.18, Math.PI, 1.1);

      return { sofa: new THREE.Vector3(-3.0, 1.9, -shell.roomD / 2 + 1.4), books: new THREE.Vector3(4.5, 2.2, -shell.roomD / 2 + 0.55), puzzle: new THREE.Vector3(0.5, 0.3, 1.0) };
    },
    classroom: function (g, shell) {
      var board = mesh(new THREE.BoxGeometry(3.8, 2.0, 0.12), stdMat('#2f7d4f', { roughness: 0.7 }));
      board.position.set(-3.6, 2.7, -shell.roomD / 2 + 0.2);
      g.add(board);
      var deskSpots = [];
      var rows = 3, cols = 3;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var dx = (c - 1) * 2.2;
          var dz = -0.5 + r * 1.8;
          var desk = new THREE.Group();
          var top = mesh(new THREE.BoxGeometry(1.1, 0.1, 0.7), stdMat('#ffd699', { roughness: 0.6 }));
          top.position.y = 0.75;
          desk.add(top);
          var leg = mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), stdMat('#c8996a', { roughness: 0.6 }));
          [[-0.45, -0.28], [0.45, -0.28], [-0.45, 0.28], [0.45, 0.28]].forEach(function (o) {
            var l = leg.clone();
            l.position.set(o[0], 0.375, o[1]);
            desk.add(l);
          });
          desk.position.set(dx, 0, dz);
          g.add(desk);
          regCollider(desk);
          if (r === 0 && c === 1) deskSpots.push(new THREE.Vector3(dx, 1.0, dz));
        }
      }

      addFramedPicture(g, 5.4, 2.3, shell.roomD / 2 - 0.12, Math.PI, '📐', '#eef7ff', '#4499e0', 1.0);
      var alphaPoster = mesh(new THREE.PlaneGeometry(3.2, 2.0), stdMat('#ffffff', { map: alphabetPosterTex(), roughness: 0.7 }));
      alphaPoster.position.set(1.0, 2.5, shell.roomD / 2 - 0.12);
      alphaPoster.rotation.y = Math.PI;
      g.add(alphaPoster);
      addWallClock(g, 3.9, 2.7, shell.roomD / 2 - 0.12, Math.PI);

      return { crayons: new THREE.Vector3(-2.2, 1.0, -0.5), books: new THREE.Vector3(0, 1.0, -0.5), desk: deskSpots[0] || new THREE.Vector3(0, 1.0, 0.7) };
    },
    cafeteria: function (g, shell) {
      var tableSpots = [];
      for (var i = -1; i <= 1; i++) {
        var tableUnit = new THREE.Group();
        var table = mesh(new THREE.BoxGeometry(3.4, 0.1, 0.9), stdMat('#ffdca3', { roughness: 0.6 }));
        table.position.y = 0.9;
        tableUnit.add(table);
        var leg1 = mesh(new THREE.BoxGeometry(0.12, 0.9, 0.7), stdMat('#c8996a', { roughness: 0.6 }));
        leg1.position.set(-1.5, 0.45, 0);
        tableUnit.add(leg1);
        var leg2 = leg1.clone();
        leg2.position.set(1.5, 0.45, 0);
        tableUnit.add(leg2);
        tableUnit.position.set(i * 3.6, 0, -1.3);
        g.add(tableUnit);
        regCollider(tableUnit);
        tableSpots.push(new THREE.Vector3(i * 3.6, 1.2, -1.3));
      }

      // extra props: serving counter + menu board
      var serving = new THREE.Group();
      var sctop = mesh(new THREE.BoxGeometry(3.0, 0.9, 0.8), stdMat('#efa03c', { roughness: 0.55 }));
      sctop.position.y = 0.45;
      serving.add(sctop);
      var trayStack = mesh(new THREE.BoxGeometry(0.6, 0.1, 0.5), stdMat('#ffffff', { roughness: 0.5 }));
      trayStack.position.set(-0.8, 0.96, 0);
      serving.add(trayStack);
      serving.position.set(0, 0, -shell.roomD / 2 + 0.7);
      g.add(serving);
      regCollider(serving);
      var menuBoard = mesh(new THREE.PlaneGeometry(1.5, 0.9), stdMat('#ffffff', { map: menuBoardTex(), roughness: 0.7 }));
      menuBoard.position.set(0, 2.1, -shell.roomD / 2 + 0.15);
      g.add(menuBoard);

      addFramedPicture(g, -5.6, 2.3, shell.roomD / 2 - 0.12, Math.PI, '🍎', '#fff3e0', '#efa03c');
      addWallClock(g, 5.6, 2.5, shell.roomD / 2 - 0.12, Math.PI);

      return { apple: tableSpots[0], tray: tableSpots[1], chairs: tableSpots[2] };
    },
    playground: function (g, shell) {
      var slide = new THREE.Group();
      var ladder = mesh(new THREE.BoxGeometry(0.7, 2.2, 0.15), stdMat('#4dabf7', { roughness: 0.6 }));
      ladder.position.set(-0.8, 1.1, 0);
      slide.add(ladder);
      var platform = mesh(new THREE.BoxGeometry(1.2, 0.15, 1.0), stdMat('#4dabf7', { roughness: 0.6 }));
      platform.position.set(-0.2, 2.2, 0);
      slide.add(platform);
      var chute = mesh(new THREE.BoxGeometry(2.4, 0.15, 1.0), stdMat('#ffd43b', { roughness: 0.5 }));
      chute.position.set(1.2, 1.1, 0);
      chute.rotation.z = -0.55;
      slide.add(chute);
      slide.position.set(-2.0, 0, 4);
      g.add(slide);
      regCollider(slide);

      var ball = mesh(new THREE.SphereGeometry(0.5, 16, 12), stdMat('#ff6b6b', { roughness: 0.4 }));
      ball.position.set(2.0, 0.5, 3.0);
      g.add(ball);

      var tree = new THREE.Group();
      var trunk = mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8), stdMat('#a9784f', { roughness: 0.8 }));
      trunk.position.y = 1.1;
      tree.add(trunk);
      var leafMat = stdMat('#4fb35c', { roughness: 0.85 });
      for (var i = 0; i < 3; i++) {
        var leaf = mesh(new THREE.SphereGeometry(1.4 - i * 0.22, 12, 10), leafMat);
        leaf.position.y = 2.6 + i * 1.0;
        tree.add(leaf);
      }
      tree.position.set(4.5, 0, 5.5);
      g.add(tree);
      regCollider(tree);

      // extra props: swing set, sandbox, flower beds
      var swings = buildSwingSet(1.1);
      swings.position.set(-6.0, 0, 8.0);
      g.add(swings);
      regCollider(swings);

      var sandbox = buildSandbox(3.0, 2.4);
      sandbox.position.set(7.0, 0, 7.0);
      g.add(sandbox);
      regCollider(sandbox);

      addFlowerBed(g, -7.0, 2.0, 2.6, 1.4);
      addFlowerBed(g, 0.0, 9.5, 3.2, 1.4);

      return { slide: new THREE.Vector3(-1.2, 3.4, 4), ball: new THREE.Vector3(2.0, 1.9, 3.0), tree: new THREE.Vector3(4.5, 4.6, 5.5) };
    },
    office: function (g, shell) {
      var deskUnit = new THREE.Group();
      var desk = mesh(new THREE.BoxGeometry(2.4, 0.9, 1.1), stdMat('#e6ddff', { roughness: 0.6 }));
      desk.position.y = 0.45;
      deskUnit.add(desk);
      var monitor = mesh(new THREE.BoxGeometry(0.8, 0.6, 0.08), stdMat('#495057', { roughness: 0.4 }));
      monitor.position.set(0, 1.2, -0.3);
      deskUnit.add(monitor);
      deskUnit.position.set(-2.0, 0, -shell.roomD / 2 + 1.2);
      g.add(deskUnit);
      regCollider(deskUnit);

      var chair = new THREE.Group();
      var seat = mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), stdMat('#d9ccff', { roughness: 0.6 }));
      seat.position.y = 0.6;
      chair.add(seat);
      var back = mesh(new THREE.BoxGeometry(0.7, 0.8, 0.12), stdMat('#d9ccff', { roughness: 0.6 }));
      back.position.set(0, 1.0, -0.3);
      chair.add(back);
      chair.position.set(-2.0, 0, -shell.roomD / 2 + 2.0);
      g.add(chair);
      regCollider(chair);

      var cabinet = mesh(new THREE.BoxGeometry(1.2, 1.6, 0.6), stdMat('#c8996a', { roughness: 0.6 }));
      cabinet.position.set(4.4, 0.8, -shell.roomD / 2 + 0.6);
      g.add(cabinet);
      regCollider(cabinet);

      // extra props: tall bookshelf + potted plant
      var bookshelf = new THREE.Group();
      var bsBody = mesh(new THREE.BoxGeometry(1.6, 2.2, 0.5), stdMat('#8266d9', { roughness: 0.6 }));
      bsBody.position.y = 1.1;
      bookshelf.add(bsBody);
      var bsColors = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b'];
      for (var bi = 0; bi < 4; bi++) {
        var bsBook = mesh(new THREE.BoxGeometry(0.35, 0.5, 0.4), stdMat(bsColors[bi], { roughness: 0.6 }));
        bsBook.position.set(-0.55 + bi * 0.37, 1.85, 0.05);
        bookshelf.add(bsBook);
      }
      bookshelf.position.set(4.6, 0, 2.4);
      g.add(bookshelf);
      regCollider(bookshelf);

      addPottedPlant(g, 1.6, 3.1, 1.15);

      addFramedPicture(g, -4.8, 2.3, shell.roomD / 2 - 0.12, Math.PI, '💼', '#f3f0ff', '#8266d9');
      addWallClock(g, -1.0, 2.6, shell.roomD / 2 - 0.12, Math.PI);

      return { desk: new THREE.Vector3(-2.6, 1.5, -shell.roomD / 2 + 0.9), phone: new THREE.Vector3(-0.9, 1.0, -shell.roomD / 2 + 1.5), door: new THREE.Vector3(4.4, 1.9, -shell.roomD / 2 + 0.6) };
    },
    nurseroom: function (g, shell) {
      var cot = new THREE.Group();
      var frame = mesh(new THREE.BoxGeometry(2.6, 0.5, 1.3), stdMat('#ffffff', { roughness: 0.6 }));
      frame.position.y = 0.5;
      cot.add(frame);
      var mattress = mesh(new THREE.BoxGeometry(2.4, 0.25, 1.1), stdMat('#d0f5e0', { roughness: 0.7 }));
      mattress.position.y = 0.75;
      cot.add(mattress);
      var pillow = mesh(new THREE.BoxGeometry(0.6, 0.18, 0.5), stdMat('#ffffff', { roughness: 0.7 }));
      pillow.position.set(-0.9, 0.9, 0);
      cot.add(pillow);
      cot.position.set(-3.5, 0, -shell.roomD / 2 + 1.2);
      g.add(cot);
      regCollider(cot);

      var cabinet = new THREE.Group();
      var cbody = mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), stdMat('#bdf0d3', { roughness: 0.6 }));
      cbody.position.y = 0.7;
      cabinet.add(cbody);
      var cross = mesh(new THREE.PlaneGeometry(0.4, 0.4), stdMat('#ff6b6b', { roughness: 0.6 }));
      cross.position.set(0, 0.4, 0.32);
      cabinet.add(cross);
      cabinet.position.set(3.8, 0, -shell.roomD / 2 + 0.6);
      g.add(cabinet);
      regCollider(cabinet);

      // extra props: a second supply cabinet + wall eye chart
      var supply = new THREE.Group();
      var sbody = mesh(new THREE.BoxGeometry(1.3, 1.1, 0.55), stdMat('#3dc088', { roughness: 0.6 }));
      sbody.position.y = 0.55;
      supply.add(sbody);
      supply.position.set(-5.2, 0, 2.6);
      g.add(supply);
      regCollider(supply);

      var eyeChart = mesh(new THREE.PlaneGeometry(1.0, 1.3), stdMat('#ffffff', { map: eyeChartTex(), roughness: 0.7 }));
      eyeChart.position.set(1.2, 2.1, shell.roomD / 2 - 0.12);
      eyeChart.rotation.y = Math.PI;
      g.add(eyeChart);
      addWallClock(g, -1.2, 2.5, shell.roomD / 2 - 0.12, Math.PI);
      addWallShelf(g, 4.0, 2.0, shell.roomD / 2 - 0.18, Math.PI, 1.1);

      return { bandaids: new THREE.Vector3(3.8, 1.5, -shell.roomD / 2 + 0.6), bed: new THREE.Vector3(-3.5, 1.4, -shell.roomD / 2 + 1.2), thermometer: new THREE.Vector3(2.6, 1.1, -shell.roomD / 2 + 0.9) };
    },

    /* =================== LIBRARY =================== */
    readingroom: function (g, shell) {
      var zN = shell.roomD / 2; // far (north) wall — fully visible to the follow-cam
      [-4.2, -1.6].forEach(function (sx, si) {
        var shelf = new THREE.Group();
        var frame = mesh(new THREE.BoxGeometry(2.2, 2.6, 0.5), stdMat('#8a5a30', { roughness: 0.7 }));
        frame.position.y = 1.3; shelf.add(frame);
        for (var row = 0; row < 3; row++) {
          for (var bcol = 0; bcol < 5; bcol++) {
            var bookColors = ['#e8554d', '#3f8fe0', '#5cbf63', '#f2cf3a', '#9a6ce0', '#ef7fc0'];
            var book = mesh(new THREE.BoxGeometry(0.28, 0.55, 0.18),
              stdMat(bookColors[(row * 5 + bcol + si) % 6], { roughness: 0.6 }));
            book.position.set(-0.8 + bcol * 0.4, 0.65 + row * 0.75, 0.2);
            shelf.add(book);
          }
        }
        shelf.rotation.y = Math.PI;
        shelf.position.set(sx, 0, zN - 0.6);
        g.add(shelf); regCollider(shelf);
      });
      var chair = new THREE.Group();
      var seatC = mesh(new THREE.BoxGeometry(1.3, 0.55, 1.2), stdMat('#c9563e', { roughness: 0.8 }));
      seatC.position.y = 0.45; chair.add(seatC);
      var backC = mesh(new THREE.BoxGeometry(1.3, 1.0, 0.35), stdMat('#c9563e', { roughness: 0.8 }));
      backC.position.set(0, 0.95, 0.5); chair.add(backC);
      [-0.62, 0.62].forEach(function (ax) {
        var arm = mesh(new THREE.BoxGeometry(0.28, 0.5, 1.1), stdMat('#b8462e', { roughness: 0.8 }));
        arm.position.set(ax, 0.75, 0); chair.add(arm);
      });
      chair.position.set(1.8, 0, 0.6); chair.rotation.y = 0.4;
      g.add(chair); regCollider(chair);
      addRug(g, 1.6, 0.4, 3.6, 3.0, '#e8c99a');
      var gt = new THREE.Group();
      var gtTop = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 14), stdMat('#a8763e', { roughness: 0.6 }));
      gtTop.position.y = 0.9; gt.add(gtTop);
      var gtLeg = mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.9, 8), stdMat('#8a5a30', { roughness: 0.6 }));
      gtLeg.position.y = 0.45; gt.add(gtLeg);
      var globe = mesh(new THREE.SphereGeometry(0.4, 14, 12), stdMat('#4a9fd8', { roughness: 0.5 }));
      globe.position.y = 1.4; gt.add(globe);
      var land = mesh(new THREE.SphereGeometry(0.405, 10, 8, 0.4, 1.4, 0.8, 1.2), stdMat('#6ec651', { roughness: 0.7 }));
      land.position.y = 1.4; gt.add(land);
      gt.position.set(4.4, 0, zN - 1.3);
      g.add(gt); regCollider(gt);
      addFramedPicture(g, -2.0, 2.3, zN - 0.12, Math.PI, '📖', '#fff2dc', '#8a5a30');
      addWallClock(g, 2.4, 2.6, zN - 0.12, Math.PI);
      return {
        books: new THREE.Vector3(-2.9, 2.0, zN - 1.2),
        chair: new THREE.Vector3(1.8, 1.7, 0.6),
        globe: new THREE.Vector3(4.4, 2.3, zN - 1.3),
      };
    },
    checkout: function (g, shell) {
      var zN = shell.roomD / 2;
      var counter = new THREE.Group();
      var cTop = mesh(new THREE.BoxGeometry(6.0, 0.18, 1.4), stdMat('#a8763e', { roughness: 0.5 }));
      cTop.position.y = 1.1; counter.add(cTop);
      var cBody = mesh(new THREE.BoxGeometry(5.7, 1.05, 1.2), stdMat('#c9985c', { roughness: 0.7 }));
      cBody.position.y = 0.55; counter.add(cBody);
      var monitor = mesh(new THREE.BoxGeometry(0.8, 0.55, 0.08), stdMat('#2e3440', { roughness: 0.3 }));
      monitor.position.set(-2.2, 1.6, -0.2); monitor.rotation.y = 0.3; counter.add(monitor);
      ['#e8554d', '#3f8fe0', '#f2cf3a'].forEach(function (bc, bi) {
        var rb = mesh(new THREE.BoxGeometry(0.7, 0.14, 0.5), stdMat(bc, { roughness: 0.6 }));
        rb.position.set(-1.0, 1.27 + bi * 0.15, 0.1); rb.rotation.y = bi * 0.25; counter.add(rb);
      });
      counter.rotation.y = Math.PI;
      counter.position.set(-0.6, 0, zN - 1.7);
      g.add(counter); regCollider(counter);
      var bin = new THREE.Group();
      var binBody = mesh(new THREE.BoxGeometry(1.1, 1.15, 1.1), stdMat('#4a9fd8', { roughness: 0.6 }));
      binBody.position.y = 0.575; bin.add(binBody);
      var slot = mesh(new THREE.BoxGeometry(0.75, 0.12, 0.06), stdMat('#20303f', { roughness: 0.5 }));
      slot.position.set(0, 0.9, 0.56); bin.add(slot);
      bin.rotation.y = Math.PI;
      bin.position.set(4.6, 0, zN - 1.2);
      g.add(bin); regCollider(bin);
      addRug(g, -0.4, 0.4, 5.0, 2.4, '#e8c99a');
      addFramedPicture(g, 3.4, 2.3, zN - 0.12, Math.PI, '🤫', '#fff2dc', '#8a5a30');
      return {
        book:    new THREE.Vector3(-1.6, 1.9, zN - 1.9),
        card:    new THREE.Vector3(0.6, 1.75, zN - 1.9),
        scanner: new THREE.Vector3(2.0, 1.75, zN - 1.9),
      };
    },

    /* =================== DOCTOR'S OFFICE =================== */
    waiting: function (g, shell) {
      var zN = shell.roomD / 2;
      for (var wc = 0; wc < 4; wc++) {
        var wchair = new THREE.Group();
        var wseat = mesh(new THREE.BoxGeometry(0.9, 0.14, 0.9), stdMat('#f2a03d', { roughness: 0.6 }));
        wseat.position.y = 0.5; wchair.add(wseat);
        var wback = mesh(new THREE.BoxGeometry(0.9, 0.8, 0.12), stdMat('#f2a03d', { roughness: 0.6 }));
        wback.position.set(0, 0.95, 0.4); wchair.add(wback);
        [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(function (lp) {
          var wleg = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8), stdMat('#6a6f7a', { roughness: 0.5 }));
          wleg.position.set(lp[0], 0.25, lp[1]); wchair.add(wleg);
        });
        wchair.position.set(-4.4 + wc * 1.25, 0, zN - 1.0);
        g.add(wchair);
        if (wc === 0 || wc === 3) regCollider(wchair);
      }
      var lt = new THREE.Group();
      var ltTop = mesh(new THREE.BoxGeometry(1.6, 0.12, 1.1), stdMat('#e8e0d0', { roughness: 0.6 }));
      ltTop.position.y = 0.55; lt.add(ltTop);
      [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].forEach(function (lp) {
        var ltLeg = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), stdMat('#b8b0a0', { roughness: 0.5 }));
        ltLeg.position.set(lp[0], 0.27, lp[1]); lt.add(ltLeg);
      });
      ['#5cbf63', '#ef7fc0'].forEach(function (bc, bi) {
        var pb = mesh(new THREE.BoxGeometry(0.55, 0.1, 0.4), stdMat(bc, { roughness: 0.6 }));
        pb.position.set(-0.25 + bi * 0.5, 0.66, 0); pb.rotation.y = bi * 0.5; lt.add(pb);
      });
      lt.position.set(0.8, 0, 0.4);
      g.add(lt); regCollider(lt);
      var tb = new THREE.Group();
      var tbBody = mesh(new THREE.BoxGeometry(1.3, 0.75, 0.95), stdMat('#f2cf3a', { roughness: 0.7 }));
      tbBody.position.y = 0.375; tb.add(tbBody);
      var ballToy = mesh(new THREE.SphereGeometry(0.22, 10, 10), stdMat('#e8554d', { roughness: 0.6 }));
      ballToy.position.set(-0.25, 0.85, 0); tb.add(ballToy);
      var blockToy = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), stdMat('#4a9fd8', { roughness: 0.6 }));
      blockToy.position.set(0.3, 0.9, 0.1); blockToy.rotation.y = 0.5; tb.add(blockToy);
      tb.position.set(4.3, 0, zN - 1.1);
      g.add(tb); regCollider(tb);
      addRug(g, 0.8, 0.4, 3.4, 2.6, '#bfe8d8');
      addFramedPicture(g, -1.8, 2.3, zN - 0.12, Math.PI, '🌈', '#e8fff4', '#2fa67c');
      addWallClock(g, 1.6, 2.6, zN - 0.12, Math.PI);
      return {
        chairs: new THREE.Vector3(-3.2, 1.6, zN - 1.0),
        books:  new THREE.Vector3(0.8, 1.25, 0.4),
        toybox: new THREE.Vector3(4.3, 1.5, zN - 1.1),
      };
    },
    examroom: function (g, shell) {
      var zN = shell.roomD / 2;
      var bed = new THREE.Group();
      var bedBase = mesh(new THREE.BoxGeometry(2.6, 0.75, 1.2), stdMat('#e8e8f0', { roughness: 0.6 }));
      bedBase.position.y = 0.375; bed.add(bedBase);
      var bedTop = mesh(new THREE.BoxGeometry(2.6, 0.22, 1.2), stdMat('#57a9c9', { roughness: 0.7 }));
      bedTop.position.y = 0.85; bed.add(bedTop);
      var paper = mesh(new THREE.BoxGeometry(2.3, 0.03, 0.7), stdMat('#ffffff', { roughness: 0.9 }));
      paper.position.y = 0.98; bed.add(paper);
      var bedPillow = mesh(new THREE.BoxGeometry(0.65, 0.18, 0.55), stdMat('#ffffff', { roughness: 0.8 }));
      bedPillow.position.set(-0.9, 1.05, 0); bed.add(bedPillow);
      bed.position.set(-3.4, 0, zN - 1.3);
      g.add(bed); regCollider(bed);
      var sc = new THREE.Group();
      var scBase = mesh(new THREE.BoxGeometry(0.75, 0.14, 0.75), stdMat('#6a6f7a', { roughness: 0.5 }));
      scBase.position.y = 0.07; sc.add(scBase);
      var scPole = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), stdMat('#8a8f9a', { roughness: 0.5 }));
      scPole.position.set(0, 0.82, -0.3); sc.add(scPole);
      var scDial = mesh(new THREE.CircleGeometry(0.22, 14), stdMat('#ffffff', { roughness: 0.4 }));
      scDial.position.set(0, 1.62, -0.26); sc.add(scDial);
      sc.rotation.y = Math.PI;
      sc.position.set(0.8, 0, zN - 0.9);
      g.add(sc); regCollider(sc);
      var cab = new THREE.Group();
      var cabBody = mesh(new THREE.BoxGeometry(1.7, 2.0, 0.7), stdMat('#ffffff', { roughness: 0.5 }));
      cabBody.position.y = 1.0; cab.add(cabBody);
      var cross = mesh(new THREE.BoxGeometry(0.55, 0.16, 0.04), stdMat('#e8554d', { roughness: 0.5 }));
      cross.position.set(0, 1.45, 0.36); cab.add(cross);
      var cross2 = mesh(new THREE.BoxGeometry(0.16, 0.55, 0.04), stdMat('#e8554d', { roughness: 0.5 }));
      cross2.position.set(0, 1.45, 0.36); cab.add(cross2);
      cab.rotation.y = Math.PI;
      cab.position.set(3.8, 0, zN - 0.95);
      g.add(cab); regCollider(cab);
      var chart = mesh(new THREE.PlaneGeometry(0.6, 2.2), stdMat('#fff2b8', { roughness: 0.8 }));
      chart.position.set(-shell.roomW / 2 + 0.12, 1.5, 0.6);
      chart.rotation.y = Math.PI / 2;
      chart.castShadow = false; g.add(chart);
      addFramedPicture(g, 2.2, 2.3, zN - 0.12, Math.PI, '🦷', '#e8f6ff', '#449ccc');
      return {
        steth: new THREE.Vector3(3.8, 2.4, zN - 0.95),
        scale: new THREE.Vector3(0.8, 1.6, zN - 0.9),
        bed:   new THREE.Vector3(-3.4, 1.6, zN - 1.3),
      };
    },

    /* =================== FIRE STATION =================== */
    garage: function (g, shell) {
      var zN = shell.roomD / 2;
      var truck = new THREE.Group();
      var truckBody = mesh(new THREE.BoxGeometry(4.6, 1.5, 1.9), stdMat('#d92c20', { roughness: 0.45 }));
      truckBody.position.set(0.4, 1.15, 0); truck.add(truckBody);
      var cabF = mesh(new THREE.BoxGeometry(1.5, 1.9, 1.9), stdMat('#c22318', { roughness: 0.45 }));
      cabF.position.set(-2.4, 1.35, 0); truck.add(cabF);
      var windshield = mesh(new THREE.PlaneGeometry(1.1, 0.7), stdMat('#bfe0f2', { roughness: 0.2 }));
      windshield.position.set(-3.16, 1.7, 0); windshield.rotation.y = -Math.PI / 2;
      windshield.castShadow = false; truck.add(windshield);
      var stripe = mesh(new THREE.BoxGeometry(4.62, 0.28, 1.92), stdMat('#f8c537', { roughness: 0.5 }));
      stripe.position.set(0.4, 1.0, 0); truck.add(stripe);
      [[-2.4, 0], [-0.6, 0], [1.6, 0]].forEach(function (wp) {
        [-1, 1].forEach(function (side) {
          var wheel = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16), stdMat('#2a2e36', { roughness: 0.8 }));
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(wp[0], 0.5, side * 0.95);
          truck.add(wheel);
          var hub = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 10), stdMat('#c9ccd4', { roughness: 0.4 }));
          hub.rotation.x = Math.PI / 2;
          hub.position.set(wp[0], 0.5, side * 0.96);
          truck.add(hub);
        });
      });
      var ladder = new THREE.Group();
      [-0.28, 0.28].forEach(function (lx) {
        var rail = mesh(new THREE.BoxGeometry(0.08, 0.08, 3.4), stdMat('#e8e8f0', { roughness: 0.4 }));
        rail.position.set(lx, 0, 0); ladder.add(rail);
      });
      for (var rung = 0; rung < 7; rung++) {
        var r = mesh(new THREE.BoxGeometry(0.55, 0.06, 0.08), stdMat('#e8e8f0', { roughness: 0.4 }));
        r.position.set(0, 0, -1.5 + rung * 0.5); ladder.add(r);
      }
      ladder.rotation.y = Math.PI / 2;
      ladder.position.set(0.6, 2.05, 0); truck.add(ladder);
      var beacon = mesh(new THREE.BoxGeometry(0.35, 0.22, 0.5), stdMat('#3f8fe0', { emissive: true, emissiveHex: '#5cb8ff', emissiveIntensity: 0.7, roughness: 0.3 }));
      beacon.position.set(-2.4, 2.42, 0); truck.add(beacon);
      truck.position.set(0, 0, zN - 2.2);
      g.add(truck); regCollider(truck);
      var gdoor = mesh(new THREE.PlaneGeometry(6.4, 2.6), stdMat('#b8bcc4', { roughness: 0.6 }));
      gdoor.rotation.y = Math.PI;
      gdoor.position.set(0, 1.4, zN - 0.16);
      gdoor.castShadow = false; g.add(gdoor);
      for (var seg = 0; seg < 4; seg++) {
        var segLine = mesh(new THREE.BoxGeometry(6.4, 0.06, 0.02), stdMat('#8f939c', { roughness: 0.6 }));
        segLine.position.set(0, 0.6 + seg * 0.62, zN - 0.18);
        segLine.castShadow = false; g.add(segLine);
      }
      var ext = new THREE.Group();
      var extBody = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 10), stdMat('#d92c20', { roughness: 0.4 }));
      extBody.position.y = 0.45; ext.add(extBody);
      var extTop = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8), stdMat('#2a2e36', { roughness: 0.5 }));
      extTop.position.y = 0.9; ext.add(extTop);
      ext.position.set(5.4, 0, zN - 0.7);
      g.add(ext); regCollider(ext);
      var bellDome = mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), stdMat('#f8c537', { roughness: 0.35 }));
      bellDome.rotation.x = -Math.PI / 2;
      bellDome.position.set(-5.2, 2.45, zN - 0.2);
      bellDome.castShadow = false; g.add(bellDome);
      return {
        truck: new THREE.Vector3(0, 3.0, zN - 2.2),
        ext:   new THREE.Vector3(5.4, 1.4, zN - 0.7),
        bell:  new THREE.Vector3(-5.2, 3.1, zN - 0.6),
      };
    },
    gearroom: function (g, shell) {
      var zN = shell.roomD / 2;
      for (var lk = 0; lk < 3; lk++) {
        var locker = new THREE.Group();
        var lkFrame = mesh(new THREE.BoxGeometry(1.5, 2.3, 0.8), stdMat('#8f4a2e', { roughness: 0.7 }));
        lkFrame.position.y = 1.15; locker.add(lkFrame);
        var lkBack = mesh(new THREE.BoxGeometry(1.3, 2.0, 0.1), stdMat('#6a3820', { roughness: 0.8 }));
        lkBack.position.set(0, 1.15, -0.25); locker.add(lkBack);
        var coat = mesh(new THREE.BoxGeometry(0.75, 1.1, 0.28), stdMat('#e8a03c', { roughness: 0.7 }));
        coat.position.set(0, 1.25, 0.05); locker.add(coat);
        var coatStripe = mesh(new THREE.BoxGeometry(0.77, 0.14, 0.3), stdMat('#f5f7fa', { emissive: true, emissiveHex: '#ffffcc', emissiveIntensity: 0.3, roughness: 0.5 }));
        coatStripe.position.set(0, 1.1, 0.05); locker.add(coatStripe);
        var helm = mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), stdMat('#f8c537', { roughness: 0.4 }));
        helm.position.set(0, 2.32, 0.05); locker.add(helm);
        locker.rotation.y = Math.PI;
        locker.position.set(-3.8 + lk * 1.9, 0, zN - 0.75);
        g.add(locker); regCollider(locker);
      }
      var bench = new THREE.Group();
      var benchTop = mesh(new THREE.BoxGeometry(3.4, 0.14, 0.7), stdMat('#c9985c', { roughness: 0.7 }));
      benchTop.position.y = 0.5; bench.add(benchTop);
      [[-1.5, 0], [1.5, 0]].forEach(function (bp) {
        var bleg = mesh(new THREE.BoxGeometry(0.16, 0.5, 0.6), stdMat('#a8763e', { roughness: 0.7 }));
        bleg.position.set(bp[0], 0.25, bp[1]); bench.add(bleg);
      });
      bench.position.set(-1.6, 0, 0.2);
      g.add(bench); regCollider(bench);
      for (var bt = 0; bt < 3; bt++) {
        [-0.16, 0.16].forEach(function (bx) {
          var boot = mesh(new THREE.BoxGeometry(0.24, 0.42, 0.4), stdMat('#2a2e36', { roughness: 0.7 }));
          boot.position.set(-2.6 + bt * 1.1 + bx, 0.21, -0.4);
          g.add(boot);
        });
      }
      addFramedPicture(g, 3.6, 2.3, zN - 0.12, Math.PI, '🚒', '#ffe8e0', '#c94e3d');
      return {
        helmet: new THREE.Vector3(-3.8, 2.9, zN - 0.75),
        coat:   new THREE.Vector3(-1.9, 1.8, zN - 0.95),
        boots:  new THREE.Vector3(-1.6, 1.1, -0.45),
      };
    },

    /* =================== POLICE STATION =================== */
    frontdesk: function (g, shell) {
      var zN = shell.roomD / 2;
      var desk = new THREE.Group();
      var dBody = mesh(new THREE.BoxGeometry(5.4, 1.05, 1.3), stdMat('#4a65b8', { roughness: 0.6 }));
      dBody.position.y = 0.525; desk.add(dBody);
      var dTop = mesh(new THREE.BoxGeometry(5.7, 0.16, 1.5), stdMat('#e8e8f0', { roughness: 0.4 }));
      dTop.position.y = 1.15; desk.add(dTop);
      var dSign = mesh(new THREE.BoxGeometry(1.8, 0.4, 0.08), stdMat('#f8c537', { roughness: 0.5 }));
      dSign.position.set(0, 0.8, 0.68); desk.add(dSign);
      desk.rotation.y = Math.PI;
      desk.position.set(-0.4, 0, zN - 1.7);
      g.add(desk); regCollider(desk);
      var flagPole = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), stdMat('#8a8f9a', { roughness: 0.4 }));
      flagPole.position.set(5.2, 1.3, zN - 0.6);
      g.add(flagPole);
      var flag = mesh(new THREE.PlaneGeometry(1.0, 0.65), stdMat('#3f5fc9', { roughness: 0.7, side: 2 }));
      flag.position.set(4.68, 2.2, zN - 0.6);
      flag.castShadow = false; g.add(flag);
      var board = mesh(new THREE.PlaneGeometry(2.2, 1.4), stdMat('#c9985c', { roughness: 0.8 }));
      board.rotation.y = Math.PI;
      board.position.set(-4.4, 2.0, zN - 0.16);
      board.castShadow = false; g.add(board);
      [['#ffffff', -4.9, 2.2], ['#fff2b8', -4.1, 1.9], ['#e0f2ff', -4.5, 1.7]].forEach(function (np) {
        var note = mesh(new THREE.PlaneGeometry(0.5, 0.4), stdMat(np[0], { roughness: 0.9 }));
        note.rotation.y = Math.PI;
        note.position.set(np[1], np[2], zN - 0.18);
        note.castShadow = false; g.add(note);
      });
      addRug(g, -0.4, 0.2, 4.6, 2.2, '#b8c4e8');
      return {
        badge: new THREE.Vector3(-1.8, 1.75, zN - 1.9),
        radio: new THREE.Vector3(0.2, 1.75, zN - 1.9),
        phone: new THREE.Vector3(1.8, 1.75, zN - 1.9),
      };
    },
    safecorner: function (g, shell) {
      var zN = shell.roomD / 2;
      var cozy = new THREE.Group();
      var cozySeat = mesh(new THREE.BoxGeometry(3.2, 0.55, 1.2), stdMat('#e8785a', { roughness: 0.8 }));
      cozySeat.position.y = 0.45; cozy.add(cozySeat);
      var cozyBack = mesh(new THREE.BoxGeometry(3.2, 0.95, 0.3), stdMat('#e8785a', { roughness: 0.8 }));
      cozyBack.position.set(0, 0.95, 0.45); cozy.add(cozyBack);
      ['#f2cf3a', '#4a9fd8'].forEach(function (cc, ci) {
        var cush = mesh(new THREE.BoxGeometry(0.7, 0.5, 0.28), stdMat(cc, { roughness: 0.8 }));
        cush.position.set(-1.0 + ci * 2.0, 0.95, 0.28);
        cush.rotation.x = 0.15; cozy.add(cush);
      });
      // a friendly teddy sitting on the bench
      var teddy = new THREE.Group();
      var tBody = mesh(new THREE.SphereGeometry(0.26, 12, 10), stdMat('#a8763e', { roughness: 0.9 }));
      tBody.position.y = 0.95; teddy.add(tBody);
      var tHead = mesh(new THREE.SphereGeometry(0.19, 12, 10), stdMat('#a8763e', { roughness: 0.9 }));
      tHead.position.y = 1.3; teddy.add(tHead);
      [-1, 1].forEach(function (te) {
        var tEar = mesh(new THREE.SphereGeometry(0.075, 8, 8), stdMat('#8a5a30', { roughness: 0.9 }));
        tEar.position.set(te * 0.13, 1.45, 0); teddy.add(tEar);
      });
      var tSnout = mesh(new THREE.SphereGeometry(0.08, 8, 8), stdMat('#d8b88a', { roughness: 0.9 }));
      tSnout.position.set(0, 1.27, -0.15); teddy.add(tSnout);
      teddy.position.set(0.2, 0, 0);
      cozy.add(teddy);
      cozy.position.set(1.4, 0, zN - 1.1);
      g.add(cozy); regCollider(cozy);
      var mapBoard = new THREE.Group();
      var mapFrame = mesh(new THREE.BoxGeometry(2.9, 2.0, 0.1), stdMat('#8a5a30', { roughness: 0.7 }));
      mapFrame.position.y = 2.0; mapBoard.add(mapFrame);
      var mapFace = mesh(new THREE.PlaneGeometry(2.6, 1.7), stdMat('#d8ead8', { roughness: 0.9 }));
      mapFace.position.set(0, 2.0, 0.06); mapFace.castShadow = false; mapBoard.add(mapFace);
      [[0, 0.4, 2.2, 0.1], [0, -0.3, 2.2, 0.1], [-0.6, 0, 0.1, 1.4], [0.7, 0.05, 0.1, 1.5]].forEach(function (rd) {
        var road = mesh(new THREE.PlaneGeometry(rd[2], rd[3]), stdMat('#8f939c', { roughness: 0.8 }));
        road.position.set(rd[0], 2.0 + rd[1], 0.08); road.castShadow = false; mapBoard.add(road);
      });
      var homeDot = mesh(new THREE.CircleGeometry(0.12, 10), stdMat('#e8554d', { roughness: 0.6 }));
      homeDot.position.set(-0.6, 2.4, 0.09); homeDot.castShadow = false; mapBoard.add(homeDot);
      mapBoard.rotation.y = Math.PI;
      mapBoard.position.set(-3.2, 0, zN - 0.35);
      g.add(mapBoard); regCollider(mapBoard);
      var wt = new THREE.Group();
      var wtTop = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12), stdMat('#e8e0d0', { roughness: 0.6 }));
      wtTop.position.y = 0.75; wt.add(wtTop);
      var wtLeg = mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.75, 8), stdMat('#b8b0a0', { roughness: 0.5 }));
      wtLeg.position.y = 0.375; wt.add(wtLeg);
      var cup = mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.2, 10), stdMat('#4a9fd8', { roughness: 0.5 }));
      cup.position.y = 0.9; wt.add(cup);
      wt.position.set(4.2, 0, zN - 1.1);
      g.add(wt); regCollider(wt);
      addRug(g, 1.2, 0.2, 3.8, 2.6, '#c8e8d8');
      addFramedPicture(g, 3.0, 2.3, zN - 0.12, Math.PI, '💙', '#e8f4ff', '#2fa69c');
      return {
        map:   new THREE.Vector3(-3.2, 3.3, zN - 0.8),
        teddy: new THREE.Vector3(1.6, 1.7, zN - 1.1),
        cup:   new THREE.Vector3(4.2, 1.35, zN - 1.1),
      };
    }
  };

  function fallbackSlots(count, shell) {
    var slots = [];
    for (var i = 0; i < count; i++) {
      var t = count > 1 ? i / (count - 1) : 0.5;
      slots.push(new THREE.Vector3((t - 0.5) * (shell.roomW - 3), 1.4, -shell.roomD / 2 + 1.5 + (i % 2) * 1.0));
    }
    return slots;
  }

  // ---- tappable object sprite anchored to furniture, tiny bob (spec: max ±0.03) ----
  function addObjectSprite(g, emoji, index, placeId, position, roomId) {
    var mat = new THREE.SpriteMaterial({ map: tokenTexture(emoji), transparent: true, depthWrite: false });
    var spr = new THREE.Sprite(mat);
    spr.scale.set(1.05, 1.05, 1);
    spr.position.copy(position);
    var baseY = position.y;
    var phase = Math.random() * Math.PI * 2;
    g.add(spr);
    animItems.push({ fn: function (t) {
      spr.position.y = baseY + Math.sin(t * 1.6 + phase) * 0.03;
    }});
    registerTappable(spr, { objIndex: index, placeId: placeId, roomId: roomId, kind: 'object' });
    return spr;
  }

  // =========================================================================
  // TOY-FIGURE CHARACTER SYSTEM — proper little people with 3D faces,
  // outfits, hair and accessories (replaces the old capsule+emoji look)
  // =========================================================================
  var SKIN_TONES = ['#ffd9b3', '#f2c29b', '#e0a878', '#c68e63'];
  var PERSONAS = {
    teacher:     { shirt: '#9c6ade', pants: '#7048b6', skin: 0, hair: '#6b4a2f', hairStyle: 'bun',   accessory: 'glasses' },
    principal:   { shirt: '#3b5bdb', pants: '#2c3e8f', skin: 2, hair: '#3a2a1c', hairStyle: 'short', accessory: 'tie' },
    nurse:       { shirt: '#63e6be', pants: '#f8f9fa', skin: 1, hair: '#8a5a3a', hairStyle: 'bun',   accessory: 'nursehat' },
    counselor:   { shirt: '#20a9a0', pants: '#33475e', skin: 3, hair: '#241a12', hairStyle: 'curly', accessory: 'none' },
    mom:         { shirt: '#ff8787', pants: '#e05572', skin: 0, hair: '#7a4a28', hairStyle: 'long',  accessory: 'apron' },
    dad:         { shirt: '#4dabf7', pants: '#39547a', skin: 1, hair: '#2e2018', hairStyle: 'short', accessory: 'none' },
    grandma:     { shirt: '#b197fc', pants: '#8a6fd4', skin: 0, hair: '#d8d4d0', hairStyle: 'bun',   accessory: 'glasses' },
    librarian:   { shirt: '#e8a33d', pants: '#8f6a3a', skin: 1, hair: '#cfc8c0', hairStyle: 'bun',   accessory: 'glasses' },
    doctor:      { shirt: '#f8f9fa', pants: '#4a6fa5', skin: 2, hair: '#241a12', hairStyle: 'short', accessory: 'none' },
    firefighter: { shirt: '#e8590c', pants: '#33475e', skin: 1, hair: '#5a3a22', hairStyle: 'short', accessory: 'firehat' },
    officer:     { shirt: '#364fc7', pants: '#2b3a80', skin: 3, hair: '#1c130c', hairStyle: 'short', accessory: 'cophat' },
    // scenario actors (kids are smaller, most look grumpy mid-scene)
    ball:      { shirt: '#f59f00', pants: '#5c7cfa', skin: 1, hair: '#4a3018', hairStyle: 'short', accessory: 'none', kid: true, mood: 'grumpy' },
    cookies:   { shirt: '#f783ac', pants: '#9c36b5', skin: 0, hair: '#6b4a2f', hairStyle: 'long',  accessory: 'none', kid: true, mood: 'grumpy' },
    leftout:   { shirt: '#94d82d', pants: '#37864a', skin: 2, hair: '#2e2018', hairStyle: 'curly', accessory: 'none', kid: true, mood: 'grumpy' },
    poker:     { shirt: '#22b8cf', pants: '#3a5f8a', skin: 1, hair: '#241a12', hairStyle: 'short', accessory: 'none', kid: true, mood: 'grumpy' },
    follower:  { shirt: '#6a6f7a', pants: '#4a4e58', skin: 1, hair: '#3a2a1c', hairStyle: 'short', accessory: 'none', mood: 'neutral' },
    aide:      { shirt: '#8a8f9a', pants: '#5a5e68', skin: 0, hair: '#5a3a22', hairStyle: 'bun',   accessory: 'none', mood: 'grumpy' },
    cousin:    { shirt: '#ff922b', pants: '#4a6fa5', skin: 1, hair: '#3a2a1c', hairStyle: 'curly', accessory: 'none', kid: true, mood: 'grumpy' },
    scaryhome: { shirt: '#6a6f7a', pants: '#4a4e58', skin: 1, hair: '#3a2a1c', hairStyle: 'short', accessory: 'none', mood: 'grumpy' },
    // Wave 2 actors
    friend:     { shirt: '#94d82d', pants: '#5c7cfa', skin: 2, hair: '#2e2018', hairStyle: 'short', accessory: 'none', kid: true, mood: 'grumpy' },
    different:  { shirt: '#22b8cf', pants: '#f59f00', skin: 0, hair: '#6b4a2f', hairStyle: 'curly', accessory: 'none', kid: true, mood: 'grumpy' },
    secretgift: { shirt: '#8a8f9a', pants: '#5a5e68', skin: 1, hair: '#3a2a1c', hairStyle: 'short', accessory: 'none', mood: 'neutral' },
  };

  function makeFace(headR, mood) {
    var f = new THREE.Group();
    var pupilMat = stdMat('#2a2e3a', { roughness: 0.25 });
    var whiteMat = stdMat('#ffffff', { roughness: 0.35 });
    [-1, 1].forEach(function (side) {
      var eye = mesh(new THREE.SphereGeometry(headR * 0.21, 10, 10), whiteMat);
      eye.scale.set(1, 1.18, 0.55);
      eye.position.set(side * headR * 0.38, headR * 0.10, headR * 0.86);
      eye.castShadow = false; f.add(eye);
      var pupil = mesh(new THREE.SphereGeometry(headR * 0.105, 8, 8), pupilMat);
      pupil.position.set(side * headR * 0.38, headR * 0.09, headR * 1.00);
      pupil.castShadow = false; f.add(pupil);
      var glint = mesh(new THREE.SphereGeometry(headR * 0.035, 6, 6), whiteMat);
      glint.position.set(side * headR * 0.42, headR * 0.14, headR * 1.07);
      glint.castShadow = false; f.add(glint);
      var brow = mesh(new THREE.BoxGeometry(headR * 0.34, headR * 0.07, headR * 0.06), pupilMat);
      brow.position.set(side * headR * 0.38, headR * 0.42, headR * 0.90);
      if (mood === 'grumpy') brow.rotation.z = side * 0.45;
      brow.castShadow = false; f.add(brow);
      var blush = mesh(new THREE.CircleGeometry(headR * 0.14, 10),
        stdMat('#ff9d9d', { roughness: 0.9, transparent: true, opacity: 0.55 }));
      blush.position.set(side * headR * 0.62, headR * -0.18, headR * 0.78);
      blush.rotation.y = side * 0.55;
      blush.castShadow = false; f.add(blush);
    });
    var mouth = mesh(new THREE.TorusGeometry(headR * 0.28, headR * 0.055, 8, 14, Math.PI * 0.9), pupilMat);
    mouth.position.set(0, headR * -0.28, headR * 0.88);
    mouth.rotation.z = mood === 'grumpy' ? 0.15 + Math.PI : Math.PI + Math.PI * 0.05;
    if (mood === 'grumpy') { mouth.rotation.z = 0.2; mouth.position.y = headR * -0.45; }
    mouth.castShadow = false; f.add(mouth);
    return f;
  }

  function makeHair(headR, style, colorHex) {
    var g = new THREE.Group();
    var hm = stdMat(colorHex, { roughness: 0.85 });
    var cap = mesh(new THREE.SphereGeometry(headR * 1.06, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hm);
    g.add(cap);
    if (style === 'bun') {
      var bun = mesh(new THREE.SphereGeometry(headR * 0.38, 10, 10), hm);
      bun.position.set(0, headR * 0.82, -headR * 0.55); g.add(bun);
    } else if (style === 'long') {
      var back = mesh(new THREE.SphereGeometry(headR * 0.95, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), hm);
      back.position.set(0, -headR * 0.35, -headR * 0.28);
      back.scale.set(0.95, 1.25, 0.7); g.add(back);
    } else if (style === 'curly') {
      [-0.6, 0, 0.6].forEach(function (x) {
        var puff = mesh(new THREE.SphereGeometry(headR * 0.42, 10, 10), hm);
        puff.position.set(x * headR, headR * 0.72, 0); g.add(puff);
      });
    }
    return g;
  }

  function makeAccessory(headR, kind) {
    var g = new THREE.Group();
    if (kind === 'glasses') {
      var gm = stdMat('#4a4e58', { roughness: 0.4 });
      [-1, 1].forEach(function (side) {
        var rim = mesh(new THREE.TorusGeometry(headR * 0.26, headR * 0.035, 8, 16), gm);
        rim.position.set(side * headR * 0.38, headR * 0.10, headR * 0.92);
        rim.castShadow = false; g.add(rim);
      });
      var bridge = mesh(new THREE.BoxGeometry(headR * 0.26, headR * 0.05, headR * 0.05), gm);
      bridge.position.set(0, headR * 0.10, headR * 0.94); bridge.castShadow = false; g.add(bridge);
    } else if (kind === 'nursehat') {
      var hat = mesh(new THREE.CylinderGeometry(headR * 0.62, headR * 0.66, headR * 0.42, 14), stdMat('#ffffff', { roughness: 0.5 }));
      hat.position.set(0, headR * 0.98, 0); g.add(hat);
      var cm = stdMat('#e8590c', { roughness: 0.5 });
      var c1 = mesh(new THREE.BoxGeometry(headR * 0.42, headR * 0.10, headR * 0.05), cm);
      c1.position.set(0, headR * 1.02, headR * 0.62); c1.castShadow = false; g.add(c1);
      var c2 = mesh(new THREE.BoxGeometry(headR * 0.10, headR * 0.42, headR * 0.05), cm);
      c2.position.set(0, headR * 1.02, headR * 0.62); c2.castShadow = false; g.add(c2);
    } else if (kind === 'firehat') {
      var dome = mesh(new THREE.SphereGeometry(headR * 0.92, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), stdMat('#f8c537', { roughness: 0.45 }));
      dome.position.y = headR * 0.55; g.add(dome);
      var brim = mesh(new THREE.CylinderGeometry(headR * 1.15, headR * 1.2, headR * 0.09, 16), stdMat('#f8c537', { roughness: 0.45 }));
      brim.position.y = headR * 0.5; g.add(brim);
    } else if (kind === 'cophat') {
      var cap2 = mesh(new THREE.CylinderGeometry(headR * 0.72, headR * 0.78, headR * 0.45, 14), stdMat('#2b3a80', { roughness: 0.55 }));
      cap2.position.y = headR * 0.92; g.add(cap2);
      var peak = mesh(new THREE.BoxGeometry(headR * 0.9, headR * 0.07, headR * 0.5), stdMat('#1d2860', { roughness: 0.5 }));
      peak.position.set(0, headR * 0.72, headR * 0.7); g.add(peak);
    }
    return g;
  }

  function makePersonFigure(opts) {
    opts = opts || {};
    var g = new THREE.Group();
    var skin = SKIN_TONES[opts.skin || 0];
    var skinMat = stdMat(skin, { roughness: 0.55 });
    var shirtMat = stdMat(opts.shirt || '#4dabf7', { roughness: 0.65 });
    var pantsMat = stdMat(opts.pants || '#39547a', { roughness: 0.7 });

    // legs + shoes
    [-1, 1].forEach(function (side) {
      var leg = mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.46, 10), pantsMat);
      leg.position.set(side * 0.15, 0.27, 0); g.add(leg);
      var shoe = mesh(new THREE.SphereGeometry(0.115, 10, 8), stdMat('#f4f6f8', { roughness: 0.5 }));
      shoe.scale.set(1, 0.55, 1.45);
      shoe.position.set(side * 0.15, 0.06, 0.05); g.add(shoe);
    });
    // torso
    var torso = mesh(new THREE.CylinderGeometry(0.26, 0.35, 0.66, 16), shirtMat);
    torso.position.y = 0.80; g.add(torso);
    var shoulders = mesh(new THREE.SphereGeometry(0.26, 14, 10), shirtMat);
    shoulders.position.y = 1.13; shoulders.scale.set(1, 0.6, 1); g.add(shoulders);
    // arms (pivot at shoulder so waving works)
    var arms = {};
    [-1, 1].forEach(function (side) {
      var pivot = new THREE.Group();
      pivot.position.set(side * 0.33, 1.10, 0);
      var arm = mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.48, 10), shirtMat);
      arm.position.y = -0.24; pivot.add(arm);
      var hand = mesh(new THREE.SphereGeometry(0.085, 10, 8), skinMat);
      hand.position.y = -0.5; pivot.add(hand);
      pivot.rotation.z = side * 0.22;
      g.add(pivot);
      arms[side === 1 ? 'right' : 'left'] = pivot;
    });
    // head + face + hair
    var headR = 0.34;
    var head = mesh(new THREE.SphereGeometry(headR, 18, 16), skinMat);
    head.position.y = 1.52; g.add(head);
    var face = makeFace(headR, opts.mood || 'happy');
    face.position.y = 1.52; g.add(face);
    if (opts.hairStyle !== 'none') {
      var hair = makeHair(headR, opts.hairStyle || 'short', opts.hair || '#4a3018');
      hair.position.y = 1.52; g.add(hair);
    }
    if (opts.accessory && opts.accessory !== 'none') {
      if (opts.accessory === 'tie') {
        var tie = mesh(new THREE.ConeGeometry(0.07, 0.3, 4), stdMat('#f5b301', { roughness: 0.5 }));
        tie.rotation.x = Math.PI; tie.position.set(0, 0.95, 0.30); g.add(tie);
      } else if (opts.accessory === 'apron') {
        var apron = mesh(new THREE.CylinderGeometry(0.28, 0.37, 0.5, 16, 1, false, -Math.PI / 3, Math.PI / 1.5), stdMat('#fff5e6', { roughness: 0.8 }));
        apron.position.y = 0.72; apron.position.z = 0.015; g.add(apron);
      } else {
        var acc = makeAccessory(headR, opts.accessory);
        acc.position.y = 1.52; g.add(acc);
      }
    }
    var s = opts.kid ? 0.78 : 1.0;
    g.scale.set(s, s, s);
    return { group: g, arms: arms, height: 1.9 * s };
  }

  // ---- sticker-card token for tappable objects (reads designed, not floating) ----
  var tokenTexCache = {};
  function tokenTexture(emoji) {
    if (tokenTexCache[emoji]) return tokenTexCache[emoji];
    var size = 256;
    var c = makeCanvas(size, size);
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    // soft drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(60,40,90,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
    roundRectPath(ctx, 30, 24, size - 60, size - 60, 46);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
    // rim
    roundRectPath(ctx, 30, 24, size - 60, size - 60, 46);
    ctx.lineWidth = 8; ctx.strokeStyle = '#ffd43b'; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '120px serif';
    ctx.fillText(emoji, size / 2, size / 2 - 6);
    var t = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    tokenTexCache[emoji] = t;
    return t;
  }
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- tappable object sprite anchored to furniture (kept from v2) ----
  // ---- generic character builder used for HELPER_SPOTS + scenario actors ----
  function addCharacter(parentGroup, id, emoji, name, position, kind) {
    var charGroup = new THREE.Group();
    charGroup.position.copy(position);
    charGroup.rotation.y = Math.PI; // face the follow camera

    var persona = PERSONAS[id] || {
      shirt: ['#4dabf7', '#ff9fb0', '#ffd43b', '#69db7c', '#b197fc', '#ff8787'][Math.abs(hashStr(id)) % 6],
      pants: '#4a6fa5', skin: Math.abs(hashStr(id)) % SKIN_TONES.length,
      hair: '#4a3018', hairStyle: 'short', accessory: 'none',
    };
    var fig = makePersonFigure(persona);
    charGroup.add(fig.group);
    var bodyH = fig.height;

    var label = makeSignSprite(null, name, { bg: '#ffffff', border: kind === 'actor' ? '#e8590c' : '#5b7cfa' }, 1.5);
    label.position.set(0, bodyH + 0.55, 0);
    charGroup.add(label);

    parentGroup.add(charGroup);
    charGroup.userData.bubbleHeight = bodyH + 1.25;

    var basePos = position.clone();
    var phase = Math.random() * Math.PI * 2;
    var waveClock = 0, waving = false, waveDuration = 1.1, nextWaveAt = 2 + Math.random() * 3;
    var armR = fig.arms.right;
    animItems.push({ ownerId: id, fn: function (t, dt) {
      charGroup.position.y = basePos.y + Math.sin(t * 1.3 + phase) * 0.045;
      if (!waving && t > nextWaveAt) { waving = true; waveClock = 0; }
      if (waving) {
        waveClock += dt;
        var p = Math.min(waveClock / waveDuration, 1);
        armR.rotation.z = 0.22 + Math.sin(p * Math.PI) * 2.4 + Math.sin(p * Math.PI * 5) * 0.25 * Math.sin(p * Math.PI);
        if (p >= 1) { waving = false; armR.rotation.z = 0.22; nextWaveAt = t + 3 + Math.random() * 4; }
      }
    }});

    charGroup.traverse(function (child) {
      if (child.isMesh || child.isSprite) {
        registerTappable(child, kind === 'actor' ? { actorId: id, kind: 'actor' } : { helperId: id, kind: 'helper' });
      }
    });

    if (kind === 'actor') actorsRegistry[id] = { group: charGroup, roomId: null };
    else helpersRegistry[id] = { group: charGroup };

    // give the character a collision footprint (body+arms only would be ideal,
    // but the auto Box3 over the whole group is a fine, slightly generous
    // "personal space" rect — tagged by id so actors can be un-registered
    // on removeActor). The avatar bumps into helpers/actors; Nilu never calls
    // resolveCollision so she is unaffected by any of this.
    regCollider(charGroup, id);

    return charGroup;
  }

  // =========================================================================
  // WALKABLE INTERIOR — data-driven floor plan (small layout table)
  // =========================================================================
  // Each building lists its rooms with a side: 'L' (left of hallway),
  // 'R' (right of hallway), or 'T' (attached beyond the far/top end of the
  // hallway). Order matters only within a side (fills bands nearest the
  // entrance first). Room ids MUST match HH.PLACES[placeId].rooms[].id.
  var BUILDING_SIDES = {
    house: [
      { id: 'bedroom', side: 'L' },
      { id: 'kitchen', side: 'R' },
      { id: 'bathroom', side: 'L' },
      { id: 'dining', side: 'R' },
      { id: 'living', side: 'T' }
    ],
    school: [
      { id: 'classroom', side: 'L' },
      { id: 'office', side: 'R' },
      { id: 'cafeteria', side: 'L' },
      { id: 'nurseroom', side: 'R' },
      { id: 'playground', side: 'T', yard: true }
    ],
    library:     [{ id: 'readingroom', side: 'L' }, { id: 'checkout', side: 'R' }],
    clinic:      [{ id: 'waiting', side: 'L' }, { id: 'examroom', side: 'R' }],
    firestation: [{ id: 'garage', side: 'L' }, { id: 'gearroom', side: 'R' }],
    police:      [{ id: 'frontdesk', side: 'L' }, { id: 'safecorner', side: 'R' }]
  };

  var LAY_ROOM_W = 13, LAY_ROOM_D = 8, LAY_HALL_W = 3.6, LAY_DOOR_GAP = 1.8;
  var INTERIOR_WALL_H = 3.0; // kept low so the elevated follow-camera is never blocked
  var WALL_THICK = 0.3;

  function makeRoomEntry(s, cx, cz, side) {
    var yard = !!s.yard;
    var padX = yard ? 16 : 0, padZ = yard ? 26 : 0;
    return {
      id: s.id, cx: cx, cz: cz, w: LAY_ROOM_W, d: LAY_ROOM_D, side: side, yard: yard,
      boundsXMin: cx - LAY_ROOM_W / 2 - padX, boundsXMax: cx + LAY_ROOM_W / 2 + padX,
      boundsZMin: cz - LAY_ROOM_D / 2, boundsZMax: cz + LAY_ROOM_D / 2 + padZ
    };
  }

  function makeLayout(sides) {
    var L = sides.filter(function (s) { return s.side === 'L'; });
    var R = sides.filter(function (s) { return s.side === 'R'; });
    var T = sides.filter(function (s) { return s.side === 'T'; });
    var bandCount = Math.max(L.length, R.length);
    var bandZ = [];
    var z = LAY_ROOM_D / 2 + 1.5;
    for (var i = 0; i < bandCount; i++) { bandZ.push(z); z += LAY_ROOM_D + 2; }
    var hallLen = (bandZ.length ? bandZ[bandZ.length - 1] + LAY_ROOM_D / 2 : LAY_ROOM_D) + 1.5;
    var rooms = [];
    L.forEach(function (s, i) { rooms.push(makeRoomEntry(s, -(LAY_HALL_W / 2 + LAY_ROOM_W / 2), bandZ[i], 'L')); });
    R.forEach(function (s, i) { rooms.push(makeRoomEntry(s, (LAY_HALL_W / 2 + LAY_ROOM_W / 2), bandZ[i], 'R')); });
    var tW = T.length * LAY_ROOM_W + Math.max(0, T.length - 1) * 2;
    T.forEach(function (s, i) {
      var cx = -tW / 2 + LAY_ROOM_W / 2 + i * (LAY_ROOM_W + 2);
      rooms.push(makeRoomEntry(s, cx, hallLen + LAY_ROOM_D / 2, 'T'));
    });
    return { rooms: rooms, hallLen: hallLen, hallW: LAY_HALL_W, doorGap: LAY_DOOR_GAP };
  }

  function findLayoutRoom(roomId) {
    if (!currentLayout) return null;
    for (var i = 0; i < currentLayout.rooms.length; i++) {
      if (currentLayout.rooms[i].id === roomId) return currentLayout.rooms[i];
    }
    return null;
  }

  function computeRoom(pos) {
    if (!currentLayout) return 'hall';
    for (var i = 0; i < currentLayout.rooms.length; i++) {
      var r = currentLayout.rooms[i];
      if (pos.x >= r.boundsXMin && pos.x <= r.boundsXMax && pos.z >= r.boundsZMin && pos.z <= r.boundsZMax) return r.id;
    }
    return 'hall';
  }

  // ---- wall + collision helpers ----
  var fadeWalls = []; // walls that can turn translucent when they block the camera
  function addWorldWall(xMin, xMax, zMin, zMax, colorHex) {
    var dx = xMax - xMin, dz = zMax - zMin;
    if (dx <= 0.02 || dz <= 0.02) return;
    // cloned (uncached) material so each wall can fade independently
    var m = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex || '#e8d9c0'), roughness: 0.85 });
    m.transparent = true;
    var wall = mesh(new THREE.BoxGeometry(dx, INTERIOR_WALL_H, dz), m);
    wall.position.set((xMin + xMax) / 2, INTERIOR_WALL_H / 2, (zMin + zMax) / 2);
    if (wallTargetGroup) wallTargetGroup.add(wall);
    fadeWalls.push(wall);
    collisionRects.push({ xMin: xMin, xMax: xMax, zMin: zMin, zMax: zMax });
  }
  // ---- cutaway: fade any wall sitting between the camera and the avatar ----
  var cutawayRay = null;
  function updateWallCutaway(dt) {
    if (!avatar || !fadeWalls.length) return;
    if (!cutawayRay) cutawayRay = new THREE.Raycaster();
    var from = camera.position;
    var to = new THREE.Vector3(avatar.pos.x, 1.0, avatar.pos.z);
    var dirV = to.clone().sub(from);
    var dist = dirV.length();
    cutawayRay.set(from, dirV.normalize());
    cutawayRay.far = dist;
    var blocked = {};
    var hits = cutawayRay.intersectObjects(fadeWalls, false);
    for (var i = 0; i < hits.length; i++) blocked[hits[i].object.id] = true;
    var k = 1 - Math.pow(0.002, dt); // quick but smooth fade
    for (var j = 0; j < fadeWalls.length; j++) {
      var w = fadeWalls[j];
      var target = blocked[w.id] ? 0.18 : 1.0;
      w.material.opacity += (target - w.material.opacity) * k;
      w.castShadow = w.material.opacity > 0.6;
    }
  }
  function addInvisibleWall(xMin, xMax, zMin, zMax) {
    collisionRects.push({ xMin: xMin, xMax: xMax, zMin: zMin, zMax: zMax });
  }
  // ---- furniture / character collider registration ----
  // Auto-derives an axis-aligned footprint from the object's actual world-space
  // geometry (Box3), shrunk ~15% on each axis so the avatar can brush past
  // corners. Call AFTER the object has been added to its final parent so the
  // world matrix chain is correct. Skips near-degenerate (flat/vertical) shapes
  // like wall-mounted decor — those should simply not be passed in.
  var SHRINK = 0.85;
  function regCollider(obj, ownerId) {
    if (!obj) return null;
    obj.updateWorldMatrix(true, true);
    var box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return null;
    var w = box.max.x - box.min.x, d = box.max.z - box.min.z;
    if (!isFinite(w) || !isFinite(d) || w < 0.12 || d < 0.12) return null;
    var cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
    var hw = (w / 2) * SHRINK, hd = (d / 2) * SHRINK;
    var rect = { xMin: cx - hw, xMax: cx + hw, zMin: cz - hd, zMax: cz + hd };
    if (ownerId) rect.ownerId = ownerId;
    collisionRects.push(rect);
    return rect;
  }
  function removeCollidersByOwner(ownerId) {
    collisionRects = collisionRects.filter(function (r) { return r.ownerId !== ownerId; });
  }
  function splitRangeWithGaps(start, end, gaps) {
    var segs = [];
    var cur = start;
    var sorted = gaps.slice().sort(function (a, b) { return a[0] - b[0]; });
    sorted.forEach(function (g) {
      var gs = Math.max(g[0], start), ge = Math.min(g[1], end);
      if (gs > cur) segs.push([cur, gs]);
      cur = Math.max(cur, ge);
    });
    if (cur < end) segs.push([cur, end]);
    return segs;
  }
  function addWallLineX(zc, xStart, xEnd, gaps, colorHex) {
    splitRangeWithGaps(xStart, xEnd, gaps).forEach(function (s) {
      addWorldWall(s[0], s[1], zc - WALL_THICK / 2, zc + WALL_THICK / 2, colorHex);
    });
  }
  function addWallLineZ(xc, zStart, zEnd, gaps, colorHex) {
    splitRangeWithGaps(zStart, zEnd, gaps).forEach(function (s) {
      addWorldWall(xc - WALL_THICK / 2, xc + WALL_THICK / 2, s[0], s[1], colorHex);
    });
  }
  function resolveCollision(pos, radius) {
    var hit = false;
    for (var iter = 0; iter < 2; iter++) {
      for (var i = 0; i < collisionRects.length; i++) {
        var w = collisionRects[i];
        var cx = Math.max(w.xMin, Math.min(pos.x, w.xMax));
        var cz = Math.max(w.zMin, Math.min(pos.z, w.zMax));
        var dx = pos.x - cx, dz = pos.z - cz;
        var distSq = dx * dx + dz * dz;
        if (distSq < radius * radius) {
          hit = true;
          var dist = Math.sqrt(distSq);
          if (dist < 1e-4) { pos.x += radius; continue; }
          var push = (radius - dist) / dist;
          pos.x += dx * push;
          pos.z += dz * push;
        }
      }
    }
    return hit;
  }

  function buildLayoutRoom(root, placeId, place, room) {
    var pal = ROOM_PALETTES[room.id] || { wall: '#e6c9a0', wall2: '#dcb98c', floor: '#e8c58a' };
    var xMin = room.cx - room.w / 2, xMax = room.cx + room.w / 2;
    var zMin = room.cz - room.d / 2, zMax = room.cz + room.d / 2;
    var g = new THREE.Group();
    g.position.set(room.cx, 0, room.cz);
    root.add(g);

    if (room.yard) {
      var grass = mesh(new THREE.PlaneGeometry(40, 34), stdMat('#ffffff', { map: grassTexture(9), roughness: 0.95 }));
      grass.rotation.x = -Math.PI / 2;
      grass.position.set(0, 0, room.d / 2 + 9);
      g.add(grass);
    } else {
      var floor = mesh(new THREE.PlaneGeometry(room.w, room.d),
        stdMat(pal.floor, { roughness: 0.85, map: TILE_ROOMS[room.id] ? tileTexture() : plankTexture() }));
      floor.castShadow = false;
      floor.rotation.x = -Math.PI / 2;
      g.add(floor);
      // ceiling-height wall cap trim isn't drawn (open-top "dollhouse" rooms keep the
      // elevated follow-camera unobstructed); windows/skylight glow come from the sky bg.
    }

    if (room.side === 'L') {
      addWallLineZ(xMin, zMin, zMax, [], pal.wall);
      addWallLineX(zMin, xMin, xMax, [], pal.wall);
      addWallLineX(zMax, xMin, xMax, [], pal.wall);
    } else if (room.side === 'R') {
      addWallLineZ(xMax, zMin, zMax, [], pal.wall);
      addWallLineX(zMin, xMin, xMax, [], pal.wall);
      addWallLineX(zMax, xMin, xMax, [], pal.wall);
    } else if (room.side === 'T') {
      addWallLineZ(xMin, zMin, zMax, [], pal.wall);
      addWallLineZ(xMax, zMin, zMax, [], pal.wall);
      addWallLineX(zMax, xMin, xMax, [], pal.wall);
      if (!room.yard) {
        var gw = LAY_DOOR_GAP;
        addWallLineX(zMin, xMin, xMax, [[room.cx - gw / 2, room.cx + gw / 2]], pal.wall);
      }
      // yard rooms are fully open on the hallway side — a real doorway to the outdoors
    }
    if (room.yard) {
      addInvisibleWall(room.cx - 20, room.cx - 19.7, zMax - 0.5, zMax + 33);
      addInvisibleWall(room.cx + 19.7, room.cx + 20, zMax - 0.5, zMax + 33);
      addInvisibleWall(room.cx - 20, room.cx + 20, zMax + 32.5, zMax + 33);
    }

    var placeRoom = null;
    (place.rooms || []).forEach(function (r) { if (r.id === room.id) placeRoom = r; });
    var shellInfo = { roomW: room.w, roomD: room.d, roomH: INTERIOR_WALL_H + 3 };
    var slots = null;
    // Legacy rooms (built before the walkable-world rework) placed their key
    // furniture against the CAMERA-side wall, which the cutaway fades — so
    // stoves/desks/the chalkboard turned ghost-invisible and their word-tokens
    // hid off-frame. Auto-flip anything in the near-wall band to the far wall
    // (meshes, their colliders, and their token slots), rotated to face the
    // camera. Mid-room symmetric furniture (desk rows, dining chairs) stays.
    var LEGACY_FLIP = { bedroom: 1, bathroom: 1, kitchen: 1, dining: 1, living: 1, classroom: 1, cafeteria: 1, office: 1, nurseroom: 1 };
    var beforeColliders = collisionRects.length;
    if (FURNITURE_BUILDERS[room.id]) slots = FURNITURE_BUILDERS[room.id](g, shellInfo);
    if (LEGACY_FLIP[room.id] && !room.yard) {
      var bandZ = -(room.d / 2 - 2.6); // "near the camera wall" band
      g.children.forEach(function (ch) {
        if (ch.position.z < bandZ) {
          ch.position.z = -ch.position.z;
          ch.rotation.y += Math.PI;
        }
      });
      for (var ci = beforeColliders; ci < collisionRects.length; ci++) {
        var rc = collisionRects[ci];
        if ((rc.zMin + rc.zMax) / 2 < room.cz + bandZ) {
          var nzMin = 2 * room.cz - rc.zMax, nzMax = 2 * room.cz - rc.zMin;
          rc.zMin = nzMin; rc.zMax = nzMax;
        }
      }
      if (slots) {
        for (var sk in slots) { if (slots[sk].z < bandZ) slots[sk].z = -slots[sk].z; }
      }
    }
    var slotKeys = slots ? Object.keys(slots) : [];
    var objs = (placeRoom && placeRoom.objects) || [];
    var fallback = fallbackSlots(objs.length, shellInfo);
    objs.forEach(function (entry, idx) {
      var emoji = entry[0];
      var pos = (slots && slotKeys[idx]) ? slots[slotKeys[idx]] : fallback[idx];
      var spr = addObjectSprite(g, emoji, idx, placeId, pos, room.id);
      objectsRegistry[room.id + ':' + idx] = spr;
    });

    var helperSpots = HH.HELPER_SPOTS || {};
    var helperId = helperSpots[placeId] && helperSpots[placeId][room.id];
    if (helperId && HH.HELPERS && HH.HELPERS[helperId]) {
      var helperPos = new THREE.Vector3(room.w / 4.4, 0, room.d / 2 - 3.6);
      addCharacter(g, helperId, HH.HELPERS[helperId].emoji, HH.HELPERS[helperId].name, helperPos, 'helper');
    }
  }

  function buildInteriorRoot(placeId) {
    var place = HH.PLACES[placeId];
    var sides = BUILDING_SIDES[placeId] || [];
    var layout = makeLayout(sides);
    var root = new THREE.Group(); root.name = 'interior:' + placeId;
    collisionRects = [];
    wallTargetGroup = root;
    scene.background = skyTexture();

    // porch / entrance patch, just south of the hallway mouth
    var porch = mesh(new THREE.PlaneGeometry(layout.hallW + 3, 3.6), stdMat('#ffffff', { map: grassTexture(3), roughness: 0.95 }));
    porch.rotation.x = -Math.PI / 2;
    porch.position.set(0, 0, -1.8);
    root.add(porch);
    addInvisibleWall(-layout.hallW / 2 - 2.4, layout.hallW / 2 + 2.4, -3.7, -3.5);

    var hallFloor = mesh(new THREE.PlaneGeometry(layout.hallW, layout.hallLen),
      stdMat('#f6ead0', { roughness: 0.85, map: plankTexture() }));
    hallFloor.castShadow = false;
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(0, 0, layout.hallLen / 2);
    root.add(hallFloor);

    if (place) {
      var entrySign = makeSignSprite(place.emoji, place.name, { bg: '#fff7e6', border: '#8a5a26' }, 3.0);
      entrySign.position.set(0, 3.8, -3.0);
      root.add(entrySign);
    }

    var Lrooms = layout.rooms.filter(function (r) { return r.side === 'L'; });
    var Rrooms = layout.rooms.filter(function (r) { return r.side === 'R'; });
    var Trooms = layout.rooms.filter(function (r) { return r.side === 'T'; });
    var hallWallColor = '#c98a52';
    addWallLineZ(-layout.hallW / 2, 0, layout.hallLen, Lrooms.map(function (r) { return [r.cz - layout.doorGap / 2, r.cz + layout.doorGap / 2]; }), hallWallColor);
    addWallLineZ(layout.hallW / 2, 0, layout.hallLen, Rrooms.map(function (r) { return [r.cz - layout.doorGap / 2, r.cz + layout.doorGap / 2]; }), hallWallColor);
    if (!Trooms.length) {
      addWallLineX(layout.hallLen, -layout.hallW / 2, layout.hallW / 2, [], hallWallColor);
    }

    layout.rooms.forEach(function (room) { buildLayoutRoom(root, placeId, place, room); });

    // ---- hallway decor: runner rug + potted plants + wall art (school also
    // gets a pennant garland). Plant/picture z-spots are chosen strictly
    // between door bands so nothing blocks a doorway or the walking channel.
    addRug(root, 0, layout.hallLen / 2, layout.hallW - 0.7, Math.max(layout.hallLen - 3, 1), '#e8b23d');
    var hallZones = [];
    var sideRoomZs = layout.rooms.filter(function (r) { return r.side !== 'T'; }).map(function (r) { return r.cz; }).sort(function (a, b) { return a - b; });
    var prevZ = 1.6;
    sideRoomZs.forEach(function (z) {
      if (z - prevZ > 3.5) hallZones.push((z + prevZ) / 2);
      prevZ = z;
    });
    if (layout.hallLen - prevZ > 3.5) hallZones.push((prevZ + layout.hallLen) / 2);
    hallZones.forEach(function (z, i) {
      var plantSide = (i % 2 === 0) ? -1 : 1;
      var plant = addPottedPlant(root, plantSide * (layout.hallW / 2 - 0.42), z, 1.0);
      regCollider(plant);
      var picSide = -plantSide;
      addFramedPicture(root, picSide * (layout.hallW / 2 - 0.12), 2.3, z, picSide < 0 ? Math.PI / 2 : -Math.PI / 2, (place && place.emoji) || '🌟', '#fff7e6', '#8a5a26', 0.9);
    });
    if (placeId === 'school') {
      for (var pz = 3.0; pz < layout.hallLen - 2; pz += 6) {
        addPennantString(root, -layout.hallW / 2 + 0.2, pz, layout.hallW / 2 - 0.2, pz, 3.3);
      }
    }

    root.add(new THREE.AmbientLight(0xfff6e0, 0.5));
    var hemi = new THREE.HemisphereLight(0xbfe3ff, 0xffe8cc, 0.45);
    root.add(hemi);
    var sun = makeSun();
    root.add(sun);
    root.add(sun.target);
    interiorSun = sun;

    wallTargetGroup = null;
    return { root: root, layout: layout };
  }

  // =========================================================================
  // AVATAR + NILU
  // =========================================================================
  function buildAvatar() {
    var g = new THREE.Group(); g.name = 'avatar';
    var fig = makePersonFigure({
      shirt: '#ff9152', pants: '#4a6fa5', skin: 1,
      hair: '#4a3018', hairStyle: 'short', accessory: 'none', kid: true,
    });
    g.add(fig.group);
    // backpack — makes the follow-cam back view charming
    var packMat = stdMat('#5cb8ff', { roughness: 0.6 });
    var pack = mesh(new THREE.BoxGeometry(0.42, 0.5, 0.2), packMat);
    pack.position.set(0, 0.72, -0.27); g.add(pack);
    var pocket = mesh(new THREE.BoxGeometry(0.26, 0.24, 0.06), stdMat('#ffd43b', { roughness: 0.6 }));
    pocket.position.set(0, 0.62, -0.39); g.add(pocket);
    [-1, 1].forEach(function (side) {
      var strap = mesh(new THREE.BoxGeometry(0.07, 0.4, 0.05), packMat);
      strap.position.set(side * 0.14, 0.82, -0.13); g.add(strap);
    });
    g.userData.bubbleHeight = fig.height + 0.5;
    return { group: g, pos: new THREE.Vector3(), facing: 0, walking: false, bobPhase: 0, fig: fig };
  }

  function buildNilu() {
    var g = new THREE.Group(); g.name = 'nilu';
    var blue = '#5f8fe0', blueDark = '#4f7fd4', blueLight = '#89aef0';
    var bodyMat = stdMat(blue, { roughness: 0.5 });
    var body = mesh(new THREE.SphereGeometry(0.48, 18, 14), bodyMat);
    body.position.y = 0.52; body.scale.set(1, 0.9, 1.15); g.add(body);
    var head = mesh(new THREE.SphereGeometry(0.38, 18, 16), bodyMat);
    head.position.set(0, 0.98, 0.40); g.add(head);
    // big friendly ears with pink inners
    [-1, 1].forEach(function (side) {
      var ear = mesh(new THREE.SphereGeometry(0.30, 14, 12), stdMat(blueLight, { roughness: 0.6 }));
      ear.scale.set(0.9, 1.25, 0.16);
      ear.position.set(side * 0.42, 1.12, 0.28);
      ear.rotation.y = side * 0.6; g.add(ear);
      var inner = mesh(new THREE.SphereGeometry(0.20, 12, 10), stdMat('#ffc4d0', { roughness: 0.75 }));
      inner.scale.set(0.85, 1.2, 0.12);
      inner.position.set(side * 0.46, 1.12, 0.31);
      inner.rotation.y = side * 0.6; inner.castShadow = false; g.add(inner);
    });
    // curved trunk (three tapering tilted segments)
    var t1 = mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.26, 10), bodyMat);
    t1.position.set(0, 0.86, 0.72); t1.rotation.x = 0.5; g.add(t1);
    var t2 = mesh(new THREE.CylinderGeometry(0.085, 0.10, 0.24, 10), bodyMat);
    t2.position.set(0, 0.68, 0.84); t2.rotation.x = 0.95; g.add(t2);
    var t3 = mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.2, 10), bodyMat);
    t3.position.set(0, 0.57, 0.97); t3.rotation.x = 1.5; g.add(t3);
    var tip = mesh(new THREE.SphereGeometry(0.075, 8, 8), bodyMat);
    tip.position.set(0, 0.56, 1.06); g.add(tip);
    // face: eyes with glints, smile, blush
    var dark = stdMat('#28324a', { roughness: 0.3 });
    var white = stdMat('#ffffff', { roughness: 0.35 });
    [-1, 1].forEach(function (side) {
      var eye = mesh(new THREE.SphereGeometry(0.075, 10, 10), white);
      eye.scale.set(1, 1.2, 0.6); eye.position.set(side * 0.15, 1.08, 0.72); eye.castShadow = false; g.add(eye);
      var pupil = mesh(new THREE.SphereGeometry(0.04, 8, 8), dark);
      pupil.position.set(side * 0.15, 1.07, 0.77); pupil.castShadow = false; g.add(pupil);
      var glint = mesh(new THREE.SphereGeometry(0.014, 6, 6), white);
      glint.position.set(side * 0.17, 1.09, 0.80); glint.castShadow = false; g.add(glint);
      var blush = mesh(new THREE.CircleGeometry(0.055, 10), stdMat('#ff9d9d', { roughness: 0.9, transparent: true, opacity: 0.55 }));
      blush.position.set(side * 0.27, 0.97, 0.62); blush.rotation.y = side * 0.5; blush.castShadow = false; g.add(blush);
    });
    var smile = mesh(new THREE.TorusGeometry(0.09, 0.016, 8, 12, Math.PI * 0.85), dark);
    smile.position.set(0, 0.93, 0.70); smile.rotation.z = Math.PI + Math.PI * 0.07; smile.castShadow = false; g.add(smile);
    // legs, tail
    [[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.26], [0.24, 0.26]].forEach(function (p) {
      var leg = mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.32, 10), stdMat(blueDark, { roughness: 0.6 }));
      leg.position.set(p[0], 0.16, p[1]); g.add(leg);
    });
    var tail = mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.34, 6), stdMat(blueDark, { roughness: 0.6 }));
    tail.position.set(0, 0.55, -0.52); tail.rotation.x = -0.7; g.add(tail);
    var tuft = mesh(new THREE.SphereGeometry(0.05, 6, 6), stdMat('#3f6fc4', { roughness: 0.8 }));
    tuft.position.set(0, 0.44, -0.62); g.add(tuft);
    g.userData.bubbleHeight = 1.75;
    return { group: g, pos: new THREE.Vector3() };
  }

  var AVATAR_SPEED = 3.0, AVATAR_RADIUS = 0.4;
  // ---- bump feedback: brief squash tween + throttled handlers.onBump() ----
  var BUMP_THROTTLE = 0.6, BUMP_SQUASH_MS = 0.12;
  var lastBumpAt = -999, bumpSquashStart = null;
  function triggerBump() {
    var t = elapsedTotal;
    bumpSquashStart = t;
    if (t - lastBumpAt >= BUMP_THROTTLE) {
      lastBumpAt = t;
      handlers.onBump();
    }
  }
  function updateAvatarMovement(dt) {
    var mv = { x: 0, z: 0 };
    if (keysDown['arrowup'] || keysDown['w']) mv.z += 1;
    if (keysDown['arrowdown'] || keysDown['s']) mv.z -= 1;
    if (keysDown['arrowleft'] || keysDown['a']) mv.x -= 1;
    if (keysDown['arrowright'] || keysDown['d']) mv.x += 1;
    if (Math.abs(joystickVec.x) > 0.08 || Math.abs(joystickVec.z) > 0.08) {
      mv.x += joystickVec.x; mv.z += joystickVec.z;
    }
    var len = Math.hypot(mv.x, mv.z);
    var moving = len > 0.001;
    if (moving) {
      mv.x /= len; mv.z /= len;
      var pos = avatar.pos.clone();
      pos.x += mv.x * AVATAR_SPEED * dt;
      pos.z += mv.z * AVATAR_SPEED * dt;
      var hit = resolveCollision(pos, AVATAR_RADIUS);
      if (hit) triggerBump();
      avatar.pos.copy(pos);
      avatar.facing = Math.atan2(mv.x, mv.z);
    }
    avatar.walking = moving;
    avatar.bobPhase += dt * (moving ? 7 : 0);
    var bob = moving ? Math.abs(Math.sin(avatar.bobPhase)) * 0.08 : 0;
    avatar.group.position.set(avatar.pos.x, bob, avatar.pos.z);
    var cur = avatar.group.rotation.y;
    var diff = Math.atan2(Math.sin(avatar.facing - cur), Math.cos(avatar.facing - cur));
    avatar.group.rotation.y = cur + diff * Math.min(1, dt * 10);
    avatar.group.rotation.x = moving ? 0.08 : 0;

    if (bumpSquashStart !== null) {
      var bAge = elapsedTotal - bumpSquashStart;
      if (bAge <= BUMP_SQUASH_MS) {
        var bp = bAge / BUMP_SQUASH_MS;
        avatar.group.scale.set(1, 1 - 0.08 * Math.sin(bp * Math.PI), 1);
      } else {
        avatar.group.scale.set(1, 1, 1);
        bumpSquashStart = null;
      }
    }

    var newRoom = computeRoom(avatar.pos);
    if (newRoom !== currentRoomId) {
      currentRoomId = newRoom;
      handlers.onRoomEnter(newRoom);
    }
  }

  function updateNilu(dt, t) {
    var forward = new THREE.Vector3(Math.sin(avatar.facing), 0, Math.cos(avatar.facing));
    var desired = new THREE.Vector3(avatar.pos.x, 0, avatar.pos.z).addScaledVector(forward, -1.7)
      .add(new THREE.Vector3(Math.cos(avatar.facing), 0, -Math.sin(avatar.facing)).multiplyScalar(0.55));
    var f = 1 - Math.pow(0.0008, dt);
    nilu.pos.lerp(desired, f);
    var bob = Math.sin(t * 2.2) * 0.05;
    nilu.group.position.set(nilu.pos.x, bob, nilu.pos.z);
    var lookPt = new THREE.Vector3(avatar.pos.x, nilu.group.position.y, avatar.pos.z);
    if (lookPt.distanceTo(nilu.group.position) > 0.05) nilu.group.lookAt(lookPt);
  }

  var CAM_OFFSET_Y = 7.4, CAM_OFFSET_Z = -8.6; // lower, more cinematic 3/4 follow —
  // still clears the low (3.0-unit) interior walls on the avatar->camera sightline.
  function updateCameraFollow(dt) {
    var offset = new THREE.Vector3(0, CAM_OFFSET_Y, CAM_OFFSET_Z);
    var desiredPos = new THREE.Vector3(avatar.pos.x, 0, avatar.pos.z).add(offset);
    var f = 1 - Math.pow(0.0006, dt);
    camera.position.lerp(desiredPos, f);
    var lookTarget = new THREE.Vector3(avatar.pos.x, 1.15, avatar.pos.z + 0.6);
    if (!camLookCurrent) camLookCurrent = lookTarget.clone();
    camLookCurrent.lerp(lookTarget, f);
    camera.lookAt(camLookCurrent);
    if (interiorSun) { // keep the shadow frustum centered on the action
      interiorSun.position.set(avatar.pos.x + 12, 22, avatar.pos.z - 10);
      interiorSun.target.position.set(avatar.pos.x, 0, avatar.pos.z);
      interiorSun.target.updateMatrixWorld();
    }
  }

  function snapCameraToAvatar() {
    camera.position.set(avatar.pos.x, CAM_OFFSET_Y, avatar.pos.z + CAM_OFFSET_Z);
    camLookCurrent = new THREE.Vector3(avatar.pos.x, 1.0, avatar.pos.z);
    camera.lookAt(camLookCurrent);
  }

  // =========================================================================
  // camera framing helpers (hub)
  // =========================================================================
  function setCameraForHub() {
    camera.fov = 45;
    camera.updateProjectionMatrix();
    camera.position.set(0, 18, 42);
    camSwayBase = { pos: camera.position.clone(), look: new THREE.Vector3(0, 6, 0) };
    camera.lookAt(camSwayBase.look);
  }

  // =========================================================================
  // target ring + arrow ("go here")
  // =========================================================================
  function clearTargetVisuals() {
    if (targetState) {
      if (targetState.glow.parent) targetState.glow.parent.remove(targetState.glow);
      if (targetState.ring.parent) targetState.ring.parent.remove(targetState.ring);
      if (targetState.arrow.parent) targetState.arrow.parent.remove(targetState.arrow);
      targetState = null;
    }
  }
  function setTargetAt(worldPos) {
    clearTargetVisuals();
    var glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 28),
      new THREE.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(worldPos.x, 0.035, worldPos.z);
    currentRoot.add(glow);
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.78, 32),
      new THREE.MeshBasicMaterial({ color: 0xff9500, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(worldPos.x, 0.05, worldPos.z);
    currentRoot.add(ring);
    var arrow = makeEmojiSprite('👇', 1.4);
    var baseArrowY = worldPos.y + 1.5;
    arrow.position.set(worldPos.x, baseArrowY, worldPos.z);
    currentRoot.add(arrow);
    targetState = { glow: glow, ring: ring, arrow: arrow, baseArrowY: baseArrowY };
  }

  // =========================================================================
  // speech bubbles
  // =========================================================================
  function resolveCharGroup(id) {
    if (id === 'me') return avatar ? avatar.group : null;
    if (id === 'nilu') return nilu ? nilu.group : null;
    if (helpersRegistry[id]) return helpersRegistry[id].group;
    if (actorsRegistry[id]) return actorsRegistry[id].group;
    return null;
  }
  function wrapWords(ctx, text, maxWidth) {
    var words = String(text || '').split(/\s+/).filter(Boolean);
    var lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = w;
      } else line = test;
    });
    if (line) lines.push(line);
    if (!lines.length) lines.push('');
    return lines;
  }
  var speechTexCache = {};
  function speechTexture(text) {
    if (speechTexCache[text]) return speechTexCache[text];
    var fontSize = 44, maxWidth = 520, padding = 34;
    var probe = makeCanvas(8, 8).getContext('2d');
    probe.font = 'bold ' + fontSize + 'px "Comic Sans MS","Trebuchet MS",sans-serif';
    var lines = wrapWords(probe, text, maxWidth);
    var lineH = fontSize * 1.22;
    var w = maxWidth + padding * 2;
    var bodyH = lines.length * lineH + padding * 2;
    var h = bodyH + 34;
    var t = canvasTex(function (ctx) {
      ctx.font = 'bold ' + fontSize + 'px "Comic Sans MS","Trebuchet MS",sans-serif';
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 6, 6, w - 12, bodyH - 12, 30);
      ctx.fill();
      ctx.strokeStyle = '#4a3222'; ctx.lineWidth = 6;
      roundRect(ctx, 6, 6, w - 12, bodyH - 12, 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2 - 18, bodyH - 10);
      ctx.lineTo(w / 2 + 18, bodyH - 10);
      ctx.lineTo(w / 2, bodyH + 26);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#4a3222'; ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = '#2c2416';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lines.forEach(function (ln, i) {
        ctx.fillText(ln, w / 2, padding + lineH * i + lineH / 2);
      });
    }, w, h);
    speechTexCache[text] = t;
    return t;
  }
  function removeSpeechFor(id) {
    var rec = speechByChar[id];
    if (rec) {
      if (rec.sprite.parent) rec.sprite.parent.remove(rec.sprite);
      var idx = speechBubbles.indexOf(rec);
      if (idx >= 0) speechBubbles.splice(idx, 1);
      delete speechByChar[id];
    }
  }
  function easeOutBack(x) {
    x = Math.max(0, Math.min(1, x));
    var c1 = 1.4, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
  function sayOnChar(id, text, ms) {
    var charGroup = resolveCharGroup(id);
    if (!charGroup) return;
    removeSpeechFor(id);
    var tex = speechTexture(text);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
    var spr = new THREE.Sprite(mat);
    spr.renderOrder = 950; // speech is the story — always readable
    var aspect = tex.image.width / tex.image.height;
    var th = 1.5, tw = th * aspect;
    spr.scale.set(0.001, 0.001, 1);
    var bh = charGroup.userData.bubbleHeight || 2.0;
    spr.position.set(0, bh, 0);
    charGroup.add(spr);
    var t0 = elapsedTotal;
    var rec = { id: id, sprite: spr, t0: t0, pop: 0.22, expireAt: t0 + (ms || 2600) / 1000, tw: tw, th: th };
    speechByChar[id] = rec;
    speechBubbles.push(rec);
  }

  // =========================================================================
  // touch joystick (bottom-left, interiors only)
  // =========================================================================
  function ensureJoystick() {
    if (joystickEl) return;
    var container = canvasEl.parentElement || document.body;
    if (container && getComputedStyle(container).position === 'static') container.style.position = 'relative';
    joystickEl = document.createElement('div');
    joystickEl.style.cssText = 'position:absolute; left:18px; bottom:18px; width:112px; height:112px; border-radius:50%; background:rgba(255,255,255,0.25); border:3px solid rgba(255,255,255,0.6); touch-action:none; z-index:40; display:none;';
    var knob = document.createElement('div');
    knob.style.cssText = 'position:absolute; left:50%; top:50%; width:52px; height:52px; margin:-26px; border-radius:50%; background:rgba(255,255,255,0.9); border:3px solid rgba(120,120,120,0.4); display:flex; align-items:center; justify-content:center; overflow:hidden;';
    var knobImg = document.createElement('img');
    knobImg.src = 'logo.png';
    knobImg.alt = '';
    knobImg.width = 42;
    knobImg.height = 42;
    knobImg.style.borderRadius = '50%';
    knobImg.style.pointerEvents = 'none';
    knob.appendChild(knobImg);
    joystickEl.appendChild(knob);
    if (container) container.appendChild(joystickEl);
    joystickKnob = knob;

    var active = false, cx0 = 0, cy0 = 0, radius = 46;
    function setVec(dx, dy) {
      var len = Math.hypot(dx, dy);
      if (len > radius) { dx = dx / len * radius; dy = dy / len * radius; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      joystickVec.x = dx / radius;
      joystickVec.z = dy / radius;
    }
    function reset() { joystickVec.x = 0; joystickVec.z = 0; knob.style.transform = 'translate(0,0)'; }
    joystickEl.addEventListener('pointerdown', function (ev) {
      handlers.onJoystickFirstUse();
      active = true;
      try { joystickEl.setPointerCapture(ev.pointerId); } catch (e) {}
      var r = joystickEl.getBoundingClientRect();
      cx0 = r.left + r.width / 2; cy0 = r.top + r.height / 2;
      setVec(ev.clientX - cx0, ev.clientY - cy0);
    });
    joystickEl.addEventListener('pointermove', function (ev) { if (active) setVec(ev.clientX - cx0, ev.clientY - cy0); });
    function end() { active = false; reset(); }
    joystickEl.addEventListener('pointerup', end);
    joystickEl.addEventListener('pointercancel', end);
    joystickEl.addEventListener('pointerleave', function () { if (active) end(); });
  }
  function showJoystick(show) {
    if (!joystickEl) return;
    joystickEl.style.display = show ? 'block' : 'none';
    if (!show) { joystickVec.x = 0; joystickVec.z = 0; }
  }

  function onKeyDown(ev) { keysDown[ev.key.toLowerCase()] = true; }
  function onKeyUp(ev) { keysDown[ev.key.toLowerCase()] = false; }

  // =========================================================================
  // render loop
  // =========================================================================
  var elapsedTotal = 0; // NOTE: THREE.Clock.getElapsedTime() internally calls getDelta(), so
  // calling both per frame would starve the real getDelta() reading — track elapsed ourselves.
  function tick() {
    rafId = requestAnimationFrame(tick);
    var dt = Math.min(clock.getDelta(), 0.05);
    elapsedTotal += dt;
    var t = elapsedTotal;
    for (var i = 0; i < animItems.length; i++) animItems[i].fn(t, dt);

    if (mode === 'hub' && camSwayBase) {
      var swayAmt = (Math.PI / 180) * 1.4;
      var angle = Math.sin(t * 0.25) * swayAmt;
      var radius = camSwayBase.pos.distanceTo(camSwayBase.look);
      var dir3 = new THREE.Vector3().subVectors(camSwayBase.pos, camSwayBase.look).normalize();
      var rotated = dir3.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      camera.position.copy(camSwayBase.look).add(rotated.multiplyScalar(radius));
      camera.position.y = camSwayBase.pos.y + Math.sin(t * 0.18) * 0.15;
      camera.lookAt(camSwayBase.look);
    }
    if (mode === 'hub' && hubWalk && hubAvatar) {
      var wp = Math.min((elapsedTotal - hubWalk.t0) / hubWalk.dur, 1);
      var ease = wp < 0.5 ? 2 * wp * wp : 1 - Math.pow(-2 * wp + 2, 2) / 2;
      var wx = hubWalk.from.x + (hubWalk.to.x - hubWalk.from.x) * ease;
      var wz = hubWalk.from.z + (hubWalk.to.z - hubWalk.from.z) * ease;
      hubAvatar.group.position.set(wx, Math.abs(Math.sin(elapsedTotal * 9)) * 0.09, wz);
      hubAvatar.group.rotation.y = Math.atan2(hubWalk.to.x - hubWalk.from.x, hubWalk.to.z - hubWalk.from.z);
      if (hubAvatar.nilu) {
        var bx = hubWalk.from.x + (hubWalk.to.x - hubWalk.from.x) * Math.max(0, ease - 0.12) - 1.1;
        var bz = hubWalk.from.z + (hubWalk.to.z - hubWalk.from.z) * Math.max(0, ease - 0.12) + 0.6;
        hubAvatar.nilu.group.position.set(bx, Math.abs(Math.sin(elapsedTotal * 10 + 1)) * 0.07, bz);
        hubAvatar.nilu.group.rotation.y = hubAvatar.group.rotation.y;
      }
      if (wp >= 1) {
        var cb = hubWalk.onArrive; hubWalk = null;
        if (cb) cb();
      }
    }
    if (mode === 'interior' && avatar) {
      updateAvatarMovement(dt);
      updateNilu(dt, t);
      updateCameraFollow(dt);
      updateWallCutaway(dt);
    }

    if (targetState) {
      var pulse = 1 + 0.15 * Math.sin(t * 3.2);
      targetState.ring.scale.set(pulse, pulse, 1);
      targetState.ring.material.opacity = 0.75 + 0.2 * Math.sin(t * 3.2);
      var glowPulse = 1 + 0.3 * Math.sin(t * 3.2 + 0.6);
      targetState.glow.scale.set(glowPulse, glowPulse, 1);
      targetState.arrow.position.y = targetState.baseArrowY + Math.abs(Math.sin(t * 2.4)) * 0.3;
    }

    for (var si = speechBubbles.length - 1; si >= 0; si--) {
      var rec = speechBubbles[si];
      var age = t - rec.t0;
      var s = age < rec.pop ? easeOutBack(age / rec.pop) : 1;
      rec.sprite.scale.set(rec.tw * s, rec.th * s, 1);
      if (t > rec.expireAt) {
        if (rec.sprite.parent) rec.sprite.parent.remove(rec.sprite);
        speechBubbles.splice(si, 1);
        delete speechByChar[rec.id];
      }
    }

    renderer.render(scene, camera);
  }

  // =========================================================================
  // pointer / raycast tap handling
  // =========================================================================
  function onPointerDown(ev) {
    if (!renderer || !camera) return;
    var rect = canvasEl.getBoundingClientRect();
    var clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    var clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    pointerV2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerV2.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerV2, camera);
    var hits = raycaster.intersectObjects(tappables, false);
    if (!hits.length) return;
    var obj = hits[0].object;
    var data = obj.userData || {};
    if (data.kind === 'building' && data.placeId) {
      handlers.onBuilding(data.placeId);
    } else if (data.kind === 'object' && data.objIndex !== undefined) {
      handlers.onObject(data.roomId, data.objIndex);
    } else if (data.kind === 'helper' && data.helperId) {
      handlers.onHelper(data.helperId);
    } else if (data.kind === 'actor' && data.actorId) {
      handlers.onActor(data.actorId);
    }
  }

  // =========================================================================
  // public API
  // =========================================================================
  HH.World = {
    init: function (opts) {
      return new Promise(function (resolve) {
        canvasEl = opts.canvas;
        renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) {
          renderer.outputEncoding = THREE.sRGBEncoding;
        }
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);

        HH.World.resize();

        canvasEl.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        ensureJoystick();

        if (!rafId) tick();

        resolve();
      });
    },

    resize: function () {
      if (!renderer || !canvasEl) return;
      var parent = canvasEl.parentElement || canvasEl;
      var w = parent.clientWidth || window.innerWidth;
      var h = parent.clientHeight || window.innerHeight;
      if (w < 2 || h < 2) { w = window.innerWidth; h = window.innerHeight; }
      renderer.setSize(w, h, false);
      if (camera) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    },

    showHub: function () {
      clearAnim();
      clearTappables();
      mode = 'hub';
      currentPlaceId = null;
      currentLayout = null;
      currentRoomId = null;
      collisionRects = [];
      avatar = null; nilu = null;
      interiorSun = null;
      fadeWalls = [];
      helpersRegistry = {}; actorsRegistry = {}; objectsRegistry = {};
      targetState = null;
      speechBubbles = []; speechByChar = {};
      showJoystick(false);
      hubBuildings = {}; hubAvatar = null; hubWalk = null;
      var root = buildHub();
      setRoot(root);
      setCameraForHub();
    },

    enterBuilding: function (placeId) {
      if (!HH.PLACES[placeId]) return;
      clearAnim();
      clearTappables();
      fadeWalls = [];
      helpersRegistry = {}; actorsRegistry = {}; objectsRegistry = {};
      targetState = null;
      speechBubbles = []; speechByChar = {};
      camSwayBase = null;
      camLookCurrent = null;

      mode = 'interior';
      currentPlaceId = placeId;
      var built = buildInteriorRoot(placeId);
      currentLayout = built.layout;
      setRoot(built.root);

      avatar = buildAvatar();
      nilu = buildNilu();
      currentRoot.add(avatar.group);
      currentRoot.add(nilu.group);
      avatar.pos.set(0, 0, 1.0);
      nilu.pos.set(0, 0, -0.2);
      avatar.group.position.copy(avatar.pos);
      nilu.group.position.copy(nilu.pos);

      camera.fov = 48;
      camera.updateProjectionMatrix();
      snapCameraToAvatar();

      currentRoomId = 'hall';
      handlers.onRoomEnter('hall');
      showJoystick(true);
    },

    teleport: function (roomId) {
      if (!avatar) return;
      var r = findLayoutRoom(roomId);
      if (r) avatar.pos.set(r.cx, 0, Math.min(r.cz, r.boundsZMax - 1));
      else avatar.pos.set(0, 0, 1.0);
      avatar.group.position.set(avatar.pos.x, 0, avatar.pos.z);
      if (nilu) {
        nilu.pos.set(avatar.pos.x, 0, avatar.pos.z - 1.2);
        nilu.group.position.copy(nilu.pos);
      }
      snapCameraToAvatar();
      currentRoomId = computeRoom(avatar.pos);
      handlers.onRoomEnter(currentRoomId);
    },

    getRoom: function () {
      return currentRoomId || 'hall';
    },

    setTarget: function (t) {
      if (!currentRoot) return;
      if (!t) { clearTargetVisuals(); return; }
      var worldPos = null;
      if (t.helperId && helpersRegistry[t.helperId]) {
        worldPos = new THREE.Vector3();
        helpersRegistry[t.helperId].group.getWorldPosition(worldPos);
      } else if (t.roomId !== undefined && t.objIndex !== undefined) {
        var spr = objectsRegistry[t.roomId + ':' + t.objIndex];
        if (spr) { worldPos = new THREE.Vector3(); spr.getWorldPosition(worldPos); }
      }
      if (!worldPos) { clearTargetVisuals(); return; }
      setTargetAt(worldPos);
    },

    say: function (id, text, ms) {
      sayOnChar(id, text, ms);
    },

    popBuilding: function (placeId) {
      var rec = hubBuildings[placeId];
      if (rec) rec.popT = elapsedTotal;
    },

    hubWalkTo: function (placeId, onArrive) {
      var rec = hubBuildings[placeId];
      if (!rec || !hubAvatar || mode !== 'hub') { if (onArrive) onArrive(); return; }
      if (hubWalk) return; // already walking
      var from = hubAvatar.group.position.clone();
      // stop a few steps in front of the building door
      var dir = new THREE.Vector3(rec.x - from.x, 0, rec.z - from.z);
      var dist = dir.length(); dir.normalize();
      var stop = Math.max(0.5, dist - 5.2);
      var to = { x: from.x + dir.x * stop, z: from.z + dir.z * stop };
      hubWalk = { placeId: placeId, from: { x: from.x, z: from.z }, to: to, t0: elapsedTotal, dur: Math.min(2.0, 0.5 + stop * 0.055), onArrive: onArrive };
    },

    pulseToken: function (roomId, idx) {
      var spr = objectsRegistry[roomId + ':' + idx];
      if (!spr) return;
      var t0 = elapsedTotal;
      animItems.push({ fn: function (t) {
        var pt = t - t0;
        if (pt > 0.55) { spr.scale.set(1.05, 1.05, 1); return; }
        var s = 1.05 * (1 + 0.75 * Math.sin(pt / 0.55 * Math.PI));
        spr.scale.set(s, s, 1);
      }});
    },

    spawnActor: function (actorId, roomId) {
      if (!currentRoot || !HH.SCENARIO_ACTORS || !HH.SCENARIO_ACTORS[actorId]) return;
      var actorDef = HH.SCENARIO_ACTORS[actorId];
      var r = findLayoutRoom(roomId);
      var pos;
      if (r) pos = new THREE.Vector3(r.cx + 1.6, 0, Math.min(r.cz + 1.0, r.boundsZMax - 1));
      else pos = new THREE.Vector3(1.6, 0, 3.0);
      var grp = addCharacter(currentRoot, actorId, actorDef.emoji, actorDef.name, pos, 'actor');
      actorsRegistry[actorId] = { group: grp, roomId: roomId };
    },

    removeActor: function (actorId) {
      var rec = actorsRegistry[actorId];
      if (!rec) return;
      removeSpeechFor(actorId);
      if (rec.group.parent) rec.group.parent.remove(rec.group);
      tappables = tappables.filter(function (o) { return !(o.userData && o.userData.actorId === actorId); });
      animItems = animItems.filter(function (a) { return a.ownerId !== actorId; });
      removeCollidersByOwner(actorId);
      delete actorsRegistry[actorId];
    },

    setHandlers: function (h) {
      h = h || {};
      handlers.onBuilding = h.onBuilding || function () {};
      handlers.onObject = h.onObject || function () {};
      handlers.onHelper = h.onHelper || function () {};
      handlers.onActor = h.onActor || function () {};
      handlers.onRoomEnter = h.onRoomEnter || function () {};
      handlers.onBump = h.onBump || function () {};
      handlers.onJoystickFirstUse = h.onJoystickFirstUse || function () {};
    }
  };
})();
