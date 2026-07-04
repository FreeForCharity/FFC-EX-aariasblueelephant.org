// Belu's Helping Hands — HH.World
// Plain script, no imports. THREE is a global (r128 API). Depends on HH.PLACES / HH.HELPERS /
// HH.HELPER_SPOTS / HH.SCENARIO_ACTORS from content.js.
//
// Builds a bright outdoor hub with 6 building slots (unchanged look) PLUS walkable, connected
// building interiors: a central hallway with rooms attached left/right/top through real wall
// gaps (doors), simple circle-vs-wall collision, a kid avatar + Belu the elephant who walk
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
    return new THREE.Mesh(geo, mat);
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
    var mat = new THREE.SpriteMaterial({ map: signTexture(emoji, name, opts), transparent: true, depthWrite: false });
    var spr = new THREE.Sprite(mat);
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
  var raycaster = new THREE.Raycaster();
  var pointerV2 = new THREE.Vector2();
  var handlers = { onBuilding: function () {}, onObject: function () {}, onHelper: function () {}, onActor: function () {}, onRoomEnter: function () {} };
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
  var belu = null;   // { group, pos }
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

    var stoneMat = stdMat('#efe2c2', { roughness: 0.9 });
    for (var p = 0; p < 7; p++) {
      var pr = mesh(new THREE.CircleGeometry(1.5, 16), stoneMat);
      pr.rotation.x = -Math.PI / 2;
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
    });

    root.add(new THREE.AmbientLight(0xfff6e0, 0.65));
    var hemi = new THREE.HemisphereLight(0xbfe3ff, 0x8fce6a, 0.55);
    root.add(hemi);
    var dir = new THREE.DirectionalLight(0xfff2d9, 0.9);
    dir.position.set(-30, 40, 20);
    root.add(dir);

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
    }

    return g;
  }

  function buildLockedBuilding(placeId, place) {
    var g = new THREE.Group();
    g.userData = { placeId: placeId };
    var W = 6, D = 5.5, H = 4.2;
    var body = mesh(new THREE.BoxGeometry(W, H, D), stdMat('#9aa3b3', { roughness: 0.85 }));
    body.position.y = H / 2;
    g.add(body);
    var roof = mesh(new THREE.BoxGeometry(W + 0.3, 0.5, D + 0.3), stdMat('#767f8f', { roughness: 0.8 }));
    roof.position.y = H + 0.25;
    g.add(roof);
    var door = mesh(new THREE.PlaneGeometry(1.3, 2.0), stdMat('#5f6673', { roughness: 0.8 }));
    door.position.set(0, 1.0, D / 2 + 0.01);
    g.add(door);
    [-1.9, 1.9].forEach(function (wx) {
      var win = mesh(new THREE.PlaneGeometry(0.9, 0.9), stdMat('#4a5866', { roughness: 0.6 }));
      win.position.set(wx, 2.4, D / 2 + 0.01);
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
  };

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
      var stand = mesh(new THREE.BoxGeometry(1.0, 1.0, 0.9), stdMat('#e8a659', { roughness: 0.6 }));
      stand.position.set(-2.2, 0.5, -shell.roomD / 2 + 1.1);
      g.add(stand);
      var lampBase = mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.4, 10), stdMat('#5c4326', { roughness: 0.6 }));
      lampBase.position.set(-2.2, 1.2, -shell.roomD / 2 + 1.1);
      g.add(lampBase);
      var lampShade = mesh(new THREE.ConeGeometry(0.35, 0.5, 12, 1, false), stdMat('#fff3bf', { emissive: true, emissiveHex: '#ffe066', emissiveIntensity: 0.5 }));
      lampShade.position.set(-2.2, 1.6, -shell.roomD / 2 + 1.1);
      g.add(lampShade);
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

      var sinkCounter = mesh(new THREE.BoxGeometry(1.6, 0.9, 0.7), stdMat('#ff9fb0', { roughness: 0.5 }));
      sinkCounter.position.set(1.5, 0.45, -shell.roomD / 2 + 0.9);
      g.add(sinkCounter);
      var basin = mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.15, 16), stdMat('#ffffff', { roughness: 0.3 }));
      basin.position.set(1.5, 0.95, -shell.roomD / 2 + 0.9);
      g.add(basin);
      var mirror = mesh(new THREE.PlaneGeometry(1.3, 1.0), stdMat('#cfefff', { emissive: true, emissiveHex: '#eaffff', emissiveIntensity: 0.2, roughness: 0.2 }));
      mirror.position.set(1.5, 2.0, -shell.roomD / 2 + 0.18);
      g.add(mirror);

      var tub = mesh(new THREE.BoxGeometry(2.6, 0.9, 1.4), stdMat('#ffe066', { roughness: 0.4 }));
      tub.position.set(4.6, 0.45, -shell.roomD / 2 + 1.2);
      g.add(tub);
      var tubBasin = mesh(new THREE.BoxGeometry(2.2, 0.4, 1.0), stdMat('#ffffff', { roughness: 0.4 }));
      tubBasin.position.set(4.6, 0.75, -shell.roomD / 2 + 1.2);
      g.add(tubBasin);

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

      var fridge = new THREE.Group();
      var fbody = mesh(new THREE.BoxGeometry(1.3, 2.4, 1.1), stdMat('#dff6ff', { roughness: 0.4 }));
      fbody.position.y = 1.2;
      fridge.add(fbody);
      var handle = mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), stdMat('#7a8a99', { metalness: 0.5, roughness: 0.3 }));
      handle.position.set(0.55, 1.4, 0.58);
      fridge.add(handle);
      fridge.position.set(4.6, 0, -shell.roomD / 2 + 1.1);
      g.add(fridge);

      var counter = mesh(new THREE.BoxGeometry(2.6, 1.0, 0.8), stdMat('#ffd699', { roughness: 0.5 }));
      counter.position.set(0.3, 0.5, -shell.roomD / 2 + 0.9);
      g.add(counter);

      return { stove: new THREE.Vector3(-4.6, 1.8, -shell.roomD / 2 + 1.0), fridge: new THREE.Vector3(4.6, 2.6, -shell.roomD / 2 + 1.1), bowl: new THREE.Vector3(0.3, 1.3, -shell.roomD / 2 + 0.9) };
    },
    dining: function (g, shell) {
      var table = mesh(new THREE.CylinderGeometry(1.6, 1.5, 0.15, 20), stdMat('#e8a659', { roughness: 0.5 }));
      table.position.set(0, 1.1, -0.5);
      g.add(table);
      var leg = mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.1, 10), stdMat('#c8996a', { roughness: 0.6 }));
      leg.position.set(0, 0.55, -0.5);
      g.add(leg);
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
        chairSpots.push(new THREE.Vector3(cx, 1.0, cz));
      }
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

      var shelf = mesh(new THREE.BoxGeometry(1.6, 1.8, 0.4), stdMat('#c8996a', { roughness: 0.6 }));
      shelf.position.set(4.6, 0.9, -shell.roomD / 2 + 0.5);
      g.add(shelf);
      var bookCols = ['#ff6b6b', '#4dabf7', '#51cf66'];
      bookCols.forEach(function (c, i) {
        var bk = mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), stdMat(c, { roughness: 0.6 }));
        bk.position.set(4.1 + i * 0.5, 1.6, -shell.roomD / 2 + 0.55);
        g.add(bk);
      });

      var rug = mesh(new THREE.CircleGeometry(1.8, 24), stdMat('#8fd6ff', { roughness: 0.9 }));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0.5, 0.02, 1.0);
      g.add(rug);

      return { sofa: new THREE.Vector3(-3.0, 1.9, -shell.roomD / 2 + 1.4), books: new THREE.Vector3(4.5, 2.2, -shell.roomD / 2 + 0.55), puzzle: new THREE.Vector3(0.5, 0.3, 1.0) };
    },
    classroom: function (g, shell) {
      var board = mesh(new THREE.BoxGeometry(4.5, 2.2, 0.12), stdMat('#2f7d4f', { roughness: 0.7 }));
      board.position.set(0, 2.6, -shell.roomD / 2 + 0.2);
      g.add(board);
      var deskSpots = [];
      var rows = 2, cols = 3;
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
          if (r === 0 && c === 1) deskSpots.push(new THREE.Vector3(dx, 1.0, dz));
        }
      }
      return { crayons: new THREE.Vector3(-2.2, 1.0, -0.5), books: new THREE.Vector3(0, 1.0, -0.5), desk: deskSpots[0] || new THREE.Vector3(0, 1.0, 0.7) };
    },
    cafeteria: function (g, shell) {
      var tableSpots = [];
      for (var i = -1; i <= 1; i++) {
        var table = mesh(new THREE.BoxGeometry(3.4, 0.1, 0.9), stdMat('#ffdca3', { roughness: 0.6 }));
        table.position.set(i * 3.6, 0.9, 0.5);
        g.add(table);
        var leg1 = mesh(new THREE.BoxGeometry(0.12, 0.9, 0.7), stdMat('#c8996a', { roughness: 0.6 }));
        leg1.position.set(i * 3.6 - 1.5, 0.45, 0.5);
        g.add(leg1);
        var leg2 = leg1.clone();
        leg2.position.set(i * 3.6 + 1.5, 0.45, 0.5);
        g.add(leg2);
        tableSpots.push(new THREE.Vector3(i * 3.6, 1.2, 0.5));
      }
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

      return { slide: new THREE.Vector3(-1.2, 3.4, 4), ball: new THREE.Vector3(2.0, 1.9, 3.0), tree: new THREE.Vector3(4.5, 4.6, 5.5) };
    },
    office: function (g, shell) {
      var desk = mesh(new THREE.BoxGeometry(2.4, 0.9, 1.1), stdMat('#e6ddff', { roughness: 0.6 }));
      desk.position.set(-2.0, 0.45, -shell.roomD / 2 + 1.2);
      g.add(desk);
      var monitor = mesh(new THREE.BoxGeometry(0.8, 0.6, 0.08), stdMat('#495057', { roughness: 0.4 }));
      monitor.position.set(-2.0, 1.2, -shell.roomD / 2 + 0.9);
      g.add(monitor);
      var chair = new THREE.Group();
      var seat = mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), stdMat('#d9ccff', { roughness: 0.6 }));
      seat.position.y = 0.6;
      chair.add(seat);
      var back = mesh(new THREE.BoxGeometry(0.7, 0.8, 0.12), stdMat('#d9ccff', { roughness: 0.6 }));
      back.position.set(0, 1.0, -0.3);
      chair.add(back);
      chair.position.set(-2.0, 0, -shell.roomD / 2 + 2.0);
      g.add(chair);

      var cabinet = mesh(new THREE.BoxGeometry(1.2, 1.6, 0.6), stdMat('#c8996a', { roughness: 0.6 }));
      cabinet.position.set(4.4, 0.8, -shell.roomD / 2 + 0.6);
      g.add(cabinet);

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

      var cabinet = mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), stdMat('#bdf0d3', { roughness: 0.6 }));
      cabinet.position.set(3.8, 0.7, -shell.roomD / 2 + 0.6);
      g.add(cabinet);
      var cross = mesh(new THREE.PlaneGeometry(0.4, 0.4), stdMat('#ff6b6b', { roughness: 0.6 }));
      cross.position.set(3.8, 1.1, -shell.roomD / 2 + 0.92);
      g.add(cross);

      return { bandaids: new THREE.Vector3(3.8, 1.5, -shell.roomD / 2 + 0.6), bed: new THREE.Vector3(-3.5, 1.4, -shell.roomD / 2 + 1.2), thermometer: new THREE.Vector3(2.6, 1.1, -shell.roomD / 2 + 0.9) };
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
    var spr = makeEmojiSprite(emoji, 1.7);
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

  // ---- generic character builder: body + arms + emoji head + name label ----
  // used for HELPER_SPOTS characters and scenario actors alike.
  function addCharacter(parentGroup, id, emoji, name, position, kind) {
    var charGroup = new THREE.Group();
    charGroup.position.copy(position);

    var bodyColors = ['#4dabf7', '#ff9fb0', '#ffd43b', '#69db7c', '#b197fc', '#ff8787'];
    var colorHex = bodyColors[Math.abs(hashStr(id)) % bodyColors.length];

    var bodyH = 1.5;
    var body;
    if (THREE.CapsuleGeometry) {
      body = mesh(new THREE.CapsuleGeometry(0.42, bodyH - 0.84, 6, 12), stdMat(colorHex, { roughness: 0.6 }));
      body.position.y = bodyH / 2 + 0.08;
      charGroup.add(body);
    } else {
      var cyl = mesh(new THREE.CylinderGeometry(0.42, 0.46, bodyH, 14), stdMat(colorHex, { roughness: 0.6 }));
      cyl.position.y = bodyH / 2;
      charGroup.add(cyl);
      var cap = mesh(new THREE.SphereGeometry(0.42, 14, 10), stdMat(colorHex, { roughness: 0.6 }));
      cap.position.y = bodyH;
      charGroup.add(cap);
      body = null;
    }

    var armMat = stdMat(colorHex, { roughness: 0.6 });
    var armL = mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), armMat);
    armL.position.set(-0.52, bodyH * 0.62, 0);
    armL.geometry.translate(0, -0.33, 0);
    charGroup.add(armL);
    var armR = mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), armMat);
    armR.position.set(0.52, bodyH * 0.62, 0);
    armR.geometry.translate(0, -0.33, 0);
    charGroup.add(armR);

    var head = makeEmojiSprite(emoji, 1.25);
    head.position.set(0, bodyH + 0.5, 0);
    charGroup.add(head);

    var label = makeSignSprite(null, name, { bg: '#ffffff', border: '#4a3222' }, 1.6);
    label.position.set(0, bodyH + 1.4, 0);
    charGroup.add(label);

    parentGroup.add(charGroup);
    charGroup.userData.bubbleHeight = bodyH + 2.3;

    var basePos = position.clone();
    var phase = Math.random() * Math.PI * 2;
    var waveClock = 0, waving = false, waveDuration = 1.1, nextWaveAt = 2 + Math.random() * 3;
    animItems.push({ ownerId: id, fn: function (t, dt) {
      charGroup.position.y = basePos.y + Math.sin(t * 1.3 + phase) * 0.06;
      head.position.y = bodyH + 0.5 + Math.sin(t * 1.3 + phase) * 0.02;
      if (!waving && t > nextWaveAt) { waving = true; waveClock = 0; }
      if (waving) {
        waveClock += dt;
        var p = Math.min(waveClock / waveDuration, 1);
        armR.rotation.z = Math.sin(p * Math.PI * 3) * 0.6 * Math.sin(p * Math.PI);
        if (p >= 1) { waving = false; armR.rotation.z = 0; nextWaveAt = t + 3 + Math.random() * 4; }
      }
    }});

    charGroup.children.forEach(function (child) {
      if (child.isMesh || child.isSprite) {
        registerTappable(child, kind === 'actor' ? { actorId: id, kind: 'actor' } : { helperId: id, kind: 'helper' });
      }
    });

    if (kind === 'actor') actorsRegistry[id] = { group: charGroup, roomId: null };
    else helpersRegistry[id] = { group: charGroup };

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
    ]
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
  function addWorldWall(xMin, xMax, zMin, zMax, colorHex) {
    var dx = xMax - xMin, dz = zMax - zMin;
    if (dx <= 0.02 || dz <= 0.02) return;
    var wall = mesh(new THREE.BoxGeometry(dx, INTERIOR_WALL_H, dz), stdMat(colorHex || '#e8d9c0', { roughness: 0.85 }));
    wall.position.set((xMin + xMax) / 2, INTERIOR_WALL_H / 2, (zMin + zMax) / 2);
    if (wallTargetGroup) wallTargetGroup.add(wall);
    collisionRects.push({ xMin: xMin, xMax: xMax, zMin: zMin, zMax: zMax });
  }
  function addInvisibleWall(xMin, xMax, zMin, zMax) {
    collisionRects.push({ xMin: xMin, xMax: xMax, zMin: zMin, zMax: zMax });
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
    for (var iter = 0; iter < 2; iter++) {
      for (var i = 0; i < collisionRects.length; i++) {
        var w = collisionRects[i];
        var cx = Math.max(w.xMin, Math.min(pos.x, w.xMax));
        var cz = Math.max(w.zMin, Math.min(pos.z, w.zMax));
        var dx = pos.x - cx, dz = pos.z - cz;
        var distSq = dx * dx + dz * dz;
        if (distSq < radius * radius) {
          var dist = Math.sqrt(distSq);
          if (dist < 1e-4) { pos.x += radius; continue; }
          var push = (radius - dist) / dist;
          pos.x += dx * push;
          pos.z += dz * push;
        }
      }
    }
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
      var floor = mesh(new THREE.PlaneGeometry(room.w, room.d), stdMat(pal.floor, { roughness: 0.85 }));
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
    if (FURNITURE_BUILDERS[room.id]) slots = FURNITURE_BUILDERS[room.id](g, shellInfo);
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

    var hallFloor = mesh(new THREE.PlaneGeometry(layout.hallW, layout.hallLen), stdMat('#f6ead0', { roughness: 0.85 }));
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

    root.add(new THREE.AmbientLight(0xfff6e0, 0.6));
    var hemi = new THREE.HemisphereLight(0xbfe3ff, 0xffe8cc, 0.5);
    root.add(hemi);
    var dir = new THREE.DirectionalLight(0xfff2d9, 0.7);
    dir.position.set(10, 18, 8);
    root.add(dir);

    wallTargetGroup = null;
    return { root: root, layout: layout };
  }

  // =========================================================================
  // AVATAR + BELU
  // =========================================================================
  function buildAvatar() {
    var g = new THREE.Group(); g.name = 'avatar';
    var bodyH = 1.15;
    var bodyMat = stdMat('#ff9152', { roughness: 0.6 });
    if (THREE.CapsuleGeometry) {
      var body = mesh(new THREE.CapsuleGeometry(0.36, bodyH - 0.72, 6, 12), bodyMat);
      body.position.y = bodyH / 2 + 0.32;
      g.add(body);
    } else {
      var cyl = mesh(new THREE.CylinderGeometry(0.36, 0.4, bodyH, 14), bodyMat);
      cyl.position.y = bodyH / 2 + 0.32;
      g.add(cyl);
      var cap = mesh(new THREE.SphereGeometry(0.36, 14, 10), bodyMat);
      cap.position.y = bodyH + 0.32;
      g.add(cap);
    }
    var legMat = stdMat('#4a6fa5', { roughness: 0.7 });
    [-0.15, 0.15].forEach(function (lx) {
      var leg = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 8), legMat);
      leg.position.set(lx, 0.25, 0);
      g.add(leg);
    });
    var face = makeEmojiSprite('🙂', 1.0);
    face.position.set(0, bodyH + 0.75, 0);
    g.add(face);
    g.userData.bubbleHeight = bodyH + 1.5;
    return { group: g, pos: new THREE.Vector3(), facing: 0, walking: false, bobPhase: 0 };
  }

  function buildBelu() {
    var g = new THREE.Group(); g.name = 'belu';
    var bodyMat = stdMat('#5f8fe0', { roughness: 0.55 });
    var body = mesh(new THREE.SphereGeometry(0.5, 16, 14), bodyMat);
    body.position.y = 0.55;
    body.scale.set(1, 0.92, 1.1);
    g.add(body);
    var head = mesh(new THREE.SphereGeometry(0.36, 16, 14), bodyMat);
    head.position.set(0, 0.95, 0.42);
    g.add(head);
    [-1, 1].forEach(function (side) {
      var ear = mesh(new THREE.SphereGeometry(0.28, 12, 10), stdMat('#7fa8ee', { roughness: 0.6 }));
      ear.scale.set(1, 1.3, 0.25);
      ear.position.set(side * 0.5, 1.0, 0.3);
      ear.rotation.y = side * 0.5;
      g.add(ear);
    });
    var trunk = mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.55, 8), bodyMat);
    trunk.position.set(0, 0.65, 0.68);
    trunk.rotation.x = 0.6;
    g.add(trunk);
    [-0.13, 0.13].forEach(function (ex) {
      var eye = mesh(new THREE.SphereGeometry(0.05, 8, 8), stdMat('#28324a', { roughness: 0.3 }));
      eye.position.set(ex, 1.02, 0.72);
      g.add(eye);
    });
    var legMat = stdMat('#4f7fd4', { roughness: 0.6 });
    [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.25], [0.25, 0.25]].forEach(function (p) {
      var leg = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.35, 8), legMat);
      leg.position.set(p[0], 0.18, p[1]);
      g.add(leg);
    });
    g.userData.bubbleHeight = 1.7;
    return { group: g, pos: new THREE.Vector3() };
  }

  var AVATAR_SPEED = 3.0, AVATAR_RADIUS = 0.4;
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
      resolveCollision(pos, AVATAR_RADIUS);
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

    var newRoom = computeRoom(avatar.pos);
    if (newRoom !== currentRoomId) {
      currentRoomId = newRoom;
      handlers.onRoomEnter(newRoom);
    }
  }

  function updateBelu(dt, t) {
    var forward = new THREE.Vector3(Math.sin(avatar.facing), 0, Math.cos(avatar.facing));
    var desired = new THREE.Vector3(avatar.pos.x, 0, avatar.pos.z).addScaledVector(forward, -1.2);
    var f = 1 - Math.pow(0.0008, dt);
    belu.pos.lerp(desired, f);
    var bob = Math.sin(t * 2.2) * 0.05;
    belu.group.position.set(belu.pos.x, bob, belu.pos.z);
    var lookPt = new THREE.Vector3(avatar.pos.x, belu.group.position.y, avatar.pos.z);
    if (lookPt.distanceTo(belu.group.position) > 0.05) belu.group.lookAt(lookPt);
  }

  var CAM_OFFSET_Y = 9, CAM_OFFSET_Z = -8; // elevated 3/4 follow — shallow enough that the
  // low (3.0-unit) interior walls rarely cross the avatar->camera sightline.
  function updateCameraFollow(dt) {
    var offset = new THREE.Vector3(0, CAM_OFFSET_Y, CAM_OFFSET_Z);
    var desiredPos = new THREE.Vector3(avatar.pos.x, 0, avatar.pos.z).add(offset);
    var f = 1 - Math.pow(0.0006, dt);
    camera.position.lerp(desiredPos, f);
    var lookTarget = new THREE.Vector3(avatar.pos.x, 1.0, avatar.pos.z);
    if (!camLookCurrent) camLookCurrent = lookTarget.clone();
    camLookCurrent.lerp(lookTarget, f);
    camera.lookAt(camLookCurrent);
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
    if (id === 'belu') return belu ? belu.group : null;
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
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    var spr = new THREE.Sprite(mat);
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
    knob.style.cssText = 'position:absolute; left:50%; top:50%; width:52px; height:52px; margin:-26px; border-radius:50%; background:rgba(255,255,255,0.9); border:3px solid rgba(120,120,120,0.4);';
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
    } else if (mode === 'interior' && avatar) {
      updateAvatarMovement(dt);
      updateBelu(dt, t);
      updateCameraFollow(dt);
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
        renderer.shadowMap.enabled = false;

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
      avatar = null; belu = null;
      helpersRegistry = {}; actorsRegistry = {}; objectsRegistry = {};
      targetState = null;
      speechBubbles = []; speechByChar = {};
      showJoystick(false);
      var root = buildHub();
      setRoot(root);
      setCameraForHub();
    },

    enterBuilding: function (placeId) {
      if (!HH.PLACES[placeId]) return;
      clearAnim();
      clearTappables();
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
      belu = buildBelu();
      currentRoot.add(avatar.group);
      currentRoot.add(belu.group);
      avatar.pos.set(0, 0, 1.0);
      belu.pos.set(0, 0, -0.2);
      avatar.group.position.copy(avatar.pos);
      belu.group.position.copy(belu.pos);

      camera.fov = 56;
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
      if (belu) {
        belu.pos.set(avatar.pos.x, 0, avatar.pos.z - 1.2);
        belu.group.position.copy(belu.pos);
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
      delete actorsRegistry[actorId];
    },

    setHandlers: function (h) {
      h = h || {};
      handlers.onBuilding = h.onBuilding || function () {};
      handlers.onObject = h.onObject || function () {};
      handlers.onHelper = h.onHelper || function () {};
      handlers.onActor = h.onActor || function () {};
      handlers.onRoomEnter = h.onRoomEnter || function () {};
    }
  };
})();
