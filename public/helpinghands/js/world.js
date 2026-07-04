// Belu's Helping Hands — HH.World
// Plain script, no imports. THREE is a global (r128 API). Depends on HH.PLACES / HH.HELPERS / HH.HELPER_SPOTS
// from content.js. Builds a bright outdoor hub with 6 building slots and per-room interiors,
// with tap-to-raycast handlers for buildings / objects / helpers.
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

  function brickTexture(hex) {
    return canvasTex(function (ctx, w, h) {
      ctx.fillStyle = hex; ctx.fillRect(0, 0, w, h);
    }, 4, 4);
  }

  // =========================================================================
  // module state
  // =========================================================================
  var renderer = null, scene = null, camera = null, canvasEl = null;
  var raycaster = new THREE.Raycaster();
  var pointerV2 = new THREE.Vector2();
  var handlers = { onBuilding: function () {}, onObject: function () {}, onHelper: function () {} };
  var animItems = []; // { obj, fn(t) }
  var tappables = []; // meshes/sprites registered for raycast
  var currentRoot = null; // Group currently in scene (hub or room)
  var clock = new THREE.Clock();
  var camSwayBase = null; // {pos, lookAt}
  var rafId = null;

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
  // HUB SCENE
  // =========================================================================
  function buildHub() {
    var root = new THREE.Group(); root.name = 'hub';

    // sky background
    scene.background = skyTexture();

    // sun
    var sun = mesh(new THREE.SphereGeometry(6, 20, 16), stdMat('#fff3a0', { emissive: true, emissiveHex: '#ffe066', emissiveIntensity: 0.9, roughness: 0.5 }));
    sun.position.set(-40, 46, -70);
    root.add(sun);

    // clouds drifting
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

    // ground
    var ground = mesh(new THREE.CircleGeometry(120, 48), stdMat('#ffffff', { map: grassTexture(26), roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    root.add(ground);

    // a simple stepping-stone path toward the buildings (individual round stones, spaced apart)
    var stoneMat = stdMat('#efe2c2', { roughness: 0.9 });
    for (var p = 0; p < 7; p++) {
      var pr = mesh(new THREE.CircleGeometry(1.5, 16), stoneMat);
      pr.rotation.x = -Math.PI / 2;
      pr.position.set(Math.sin(p * 0.8) * 1.4, 0.02, 15 - p * 3.6);
      root.add(pr);
    }

    // a few decorative trees/bushes scattered around
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

    // ---- 6 buildings placed in a gentle arc ----
    var order = ['house', 'school', 'library', 'clinic', 'firestation', 'police'];
    var radius = 30;
    var arcSpan = Math.PI * 0.72; // total angular spread
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
      bldg.lookAt(0, 0, 6); // face generally toward the camera/viewer
      root.add(bldg);
    });

    // hemisphere + ambient + directional light
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
      // roof (cone-ish using pyramid via cylinder with 4 segments)
      var roof = mesh(new THREE.ConeGeometry(6.2, 3.2, 4), stdMat(col.roof, { roughness: 0.7 }));
      roof.position.y = H + 1.4;
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      // door
      var door = mesh(new THREE.PlaneGeometry(1.6, 2.6), stdMat(col.door, { roughness: 0.7 }));
      door.position.set(0, 1.3, D / 2 + 0.01);
      g.add(door);
      var knob = mesh(new THREE.SphereGeometry(0.09, 8, 8), stdMat('#ffd43b', { metalness: 0.5, roughness: 0.3 }));
      knob.position.set(0.55, 1.3, D / 2 + 0.08);
      g.add(knob);
      // windows
      [-2.6, 2.6].forEach(function (wx) {
        var winFrame = mesh(new THREE.BoxGeometry(1.5, 1.5, 0.15), stdMat('#ffffff', { roughness: 0.6 }));
        winFrame.position.set(wx, 3.1, D / 2 + 0.02);
        g.add(winFrame);
        var winGlass = mesh(new THREE.PlaneGeometry(1.2, 1.2), stdMat('#8fd6ff', { emissive: true, emissiveHex: '#bfe9ff', emissiveIntensity: 0.3, roughness: 0.3 }));
        winGlass.position.set(wx, 3.1, D / 2 + 0.1);
        g.add(winGlass);
      });
      // chimney
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
      var W = 12, D = 8, H = 6.5;
      var body = mesh(new THREE.BoxGeometry(W, H, D), stdMat('#f6cfe0', { roughness: 0.8 }));
      body.position.y = H / 2;
      g.add(body);
      // flat roof band trim
      var roofTrim = mesh(new THREE.BoxGeometry(W + 0.4, 0.6, D + 0.4), stdMat('#4dabf7', { roughness: 0.7 }));
      roofTrim.position.y = H + 0.3;
      g.add(roofTrim);
      // "SCHOOL" banner band across the front
      var bandTex = canvasTex(function (ctx, w, h) {
        ctx.fillStyle = '#4dabf7'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 90px "Comic Sans MS", sans-serif';
        ctx.fillText('SCHOOL', w / 2, h / 2 + 6);
      }, 1024, 200);
      var band = mesh(new THREE.PlaneGeometry(W * 0.85, 1.4), stdMat('#ffffff', { map: bandTex }));
      band.position.set(0, H - 0.9, D / 2 + 0.02);
      g.add(band);
      // entrance door (double)
      [-0.9, 0.9].forEach(function (dx) {
        var door = mesh(new THREE.PlaneGeometry(1.5, 2.8), stdMat('#e8574b', { roughness: 0.7 }));
        door.position.set(dx, 1.4, D / 2 + 0.03);
        g.add(door);
        registerTappable(door, { placeId: placeId, kind: 'building' });
      });
      // windows row
      for (var wi = -2; wi <= 2; wi++) {
        if (wi === 0) continue;
        var winFrame = mesh(new THREE.BoxGeometry(1.3, 1.3, 0.15), stdMat('#ffffff', { roughness: 0.6 }));
        winFrame.position.set(wi * 2.2, 4.2, D / 2 + 0.02);
        g.add(winFrame);
        var winGlass = mesh(new THREE.PlaneGeometry(1.05, 1.05), stdMat('#8fd6ff', { emissive: true, emissiveHex: '#bfe9ff', emissiveIntensity: 0.3, roughness: 0.3 }));
        winGlass.position.set(wi * 2.2, 4.2, D / 2 + 0.1);
        g.add(winGlass);
      }
      // flag pole
      var pole = mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 8), stdMat('#d9d9d9', { metalness: 0.4, roughness: 0.4 }));
      pole.position.set(W / 2 + 1.5, 3.5, D / 2 + 1);
      g.add(pole);
      var flag = mesh(new THREE.PlaneGeometry(1.4, 0.9), stdMat('#ffd43b', { roughness: 0.6, side: THREE.DoubleSide }));
      flag.position.set(W / 2 + 2.2, 6.5, D / 2 + 1);
      g.add(flag);
      animItems.push({ fn: function (t) { flag.rotation.y = Math.sin(t * 1.6) * 0.25; } });

      registerTappable(body, { placeId: placeId, kind: 'building' });
      registerTappable(band, { placeId: placeId, kind: 'building' });

      var sign = makeSignSprite(place.emoji, place.name, { bg: '#eef7ff', border: '#4dabf7' }, 3.6);
      sign.position.set(0, H + 3.4, 0);
      g.add(sign);
      registerTappable(sign, { placeId: placeId, kind: 'building' });
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
    // small dark windows either side, for texture/interest
    [-1.9, 1.9].forEach(function (wx) {
      var win = mesh(new THREE.PlaneGeometry(0.9, 0.9), stdMat('#4a5866', { roughness: 0.6 }));
      win.position.set(wx, 2.4, D / 2 + 0.01);
      g.add(win);
    });

    // big emoji sign of the place's own emoji
    var emojiSign = makeEmojiSprite(place.emoji, 2.2);
    emojiSign.position.set(0, H + 1.7, 0.3);
    g.add(emojiSign);

    // padlock overlay, front and center, large and unmistakable
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
  // ROOM SCENES
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

  function buildRoomShell(roomId) {
    var pal = ROOM_PALETTES[roomId] || { wall: '#f7d9ba', wall2: '#f6cfe0', floor: '#e8c58a' };
    var g = new THREE.Group();
    var ROOM_W = 13, ROOM_H = 8.5, ROOM_D = 8;

    if (roomId === 'playground') {
      // outdoor: grass + sky background, no walls
      scene.background = skyTexture();
      var ground = mesh(new THREE.PlaneGeometry(40, 30), stdMat('#ffffff', { map: grassTexture(10), roughness: 0.95 }));
      ground.rotation.x = -Math.PI / 2;
      g.add(ground);
      return { root: g, floorY: 0, backZ: -ROOM_D / 2, roomW: ROOM_W };
    }

    scene.background = new THREE.Color(pal.wall).lerp(new THREE.Color('#ffffff'), 0.25);

    // floor
    var floor = mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), stdMat(pal.floor, { roughness: 0.85 }));
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);

    // back wall
    var back = mesh(new THREE.BoxGeometry(ROOM_W, ROOM_H, 0.3), stdMat(pal.wall, { roughness: 0.85 }));
    back.position.set(0, ROOM_H / 2, -ROOM_D / 2);
    g.add(back);

    // two side walls (partial, leaving front open toward camera) — use wall2 for a touch of variation
    var sideL = mesh(new THREE.BoxGeometry(0.3, ROOM_H, ROOM_D), stdMat(pal.wall2, { roughness: 0.85 }));
    sideL.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
    g.add(sideL);
    var sideR = mesh(new THREE.BoxGeometry(0.3, ROOM_H, ROOM_D), stdMat(pal.wall2, { roughness: 0.85 }));
    sideR.position.set(ROOM_W / 2, ROOM_H / 2, 0);
    g.add(sideR);

    // ceiling lid so the pale scene backdrop never peeks through above the walls
    var ceil = mesh(new THREE.BoxGeometry(ROOM_W, 0.3, ROOM_D), stdMat(pal.wall2, { roughness: 0.9 }));
    ceil.position.set(0, ROOM_H + 0.15, 0);
    g.add(ceil);

    // window on the back wall with sky view
    var winFrame = mesh(new THREE.BoxGeometry(3.2, 2.4, 0.15), stdMat('#ffffff', { roughness: 0.6 }));
    winFrame.position.set(ROOM_W / 2 - 2.8, ROOM_H - 2.4, -ROOM_D / 2 + 0.2);
    g.add(winFrame);
    var winGlass = mesh(new THREE.PlaneGeometry(2.8, 2.0), stdMat('#ffffff', { map: windowSkyTexture(), roughness: 0.4 }));
    winGlass.position.set(ROOM_W / 2 - 2.8, ROOM_H - 2.4, -ROOM_D / 2 + 0.28);
    g.add(winGlass);

    // baseboard trim
    var trim = mesh(new THREE.BoxGeometry(ROOM_W, 0.35, 0.32), stdMat('#ffffff', { roughness: 0.6 }));
    trim.position.set(0, 0.17, -ROOM_D / 2 + 0.05);
    g.add(trim);

    return { root: g, floorY: 0, backZ: -ROOM_D / 2, roomW: ROOM_W, roomD: ROOM_D, roomH: ROOM_H };
  }

  // ---- furniture builders keyed by room id ----
  var FURNITURE_BUILDERS = {
    bedroom: function (g, shell) {
      // bed
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
      // nightstand + lamp
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
      tub.position.set(5.0, 0.45, -shell.roomD / 2 + 1.2);
      g.add(tub);
      var tubBasin = mesh(new THREE.BoxGeometry(2.2, 0.4, 1.0), stdMat('#ffffff', { roughness: 0.4 }));
      tubBasin.position.set(5.0, 0.75, -shell.roomD / 2 + 1.2);
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
      fridge.position.set(4.8, 0, -shell.roomD / 2 + 1.1);
      g.add(fridge);

      var counter = mesh(new THREE.BoxGeometry(2.6, 1.0, 0.8), stdMat('#ffd699', { roughness: 0.5 }));
      counter.position.set(0.3, 0.5, -shell.roomD / 2 + 0.9);
      g.add(counter);

      return { stove: new THREE.Vector3(-4.6, 1.8, -shell.roomD / 2 + 1.0), fridge: new THREE.Vector3(4.8, 2.6, -shell.roomD / 2 + 1.1), bowl: new THREE.Vector3(0.3, 1.3, -shell.roomD / 2 + 0.9) };
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
      shelf.position.set(5.0, 0.9, -shell.roomD / 2 + 0.5);
      g.add(shelf);
      var bookCols = ['#ff6b6b', '#4dabf7', '#51cf66'];
      bookCols.forEach(function (c, i) {
        var bk = mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), stdMat(c, { roughness: 0.6 }));
        bk.position.set(4.5 + i * 0.5, 1.6, -shell.roomD / 2 + 0.55);
        g.add(bk);
      });

      var rug = mesh(new THREE.CircleGeometry(1.8, 24), stdMat('#8fd6ff', { roughness: 0.9 }));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0.5, 0.02, 1.0);
      g.add(rug);

      return { sofa: new THREE.Vector3(-3.0, 1.9, -shell.roomD / 2 + 1.4), books: new THREE.Vector3(4.9, 2.2, -shell.roomD / 2 + 0.55), puzzle: new THREE.Vector3(0.5, 0.3, 1.0) };
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
      slide.position.set(-3.5, 0, -3);
      g.add(slide);

      var ball = mesh(new THREE.SphereGeometry(0.5, 16, 12), stdMat('#ff6b6b', { roughness: 0.4 }));
      ball.position.set(1.5, 0.5, -1.5);
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
      tree.position.set(4.5, 0, -2.5);
      g.add(tree);

      return { slide: new THREE.Vector3(-2.5, 3.4, -3), ball: new THREE.Vector3(1.5, 1.9, -1.5), tree: new THREE.Vector3(4.5, 4.6, -2.5) };
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

      var doorFrame = mesh(new THREE.BoxGeometry(1.6, 2.6, 0.15), stdMat('#c8996a', { roughness: 0.6 }));
      doorFrame.position.set(3.4, 1.3, -shell.roomD / 2 + 0.2);
      g.add(doorFrame);
      var doorPanel = mesh(new THREE.PlaneGeometry(1.3, 2.3), stdMat('#e8a659', { roughness: 0.6 }));
      doorPanel.position.set(3.4, 1.3, -shell.roomD / 2 + 0.3);
      g.add(doorPanel);

      return { desk: new THREE.Vector3(-2.6, 1.5, -shell.roomD / 2 + 0.9), phone: new THREE.Vector3(-0.9, 1.0, -shell.roomD / 2 + 1.5), door: new THREE.Vector3(3.4, 1.7, -shell.roomD / 2 + 0.3) };
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

  // fallback slots evenly spaced if a room id has no dedicated furniture builder
  function fallbackSlots(count, shell) {
    var slots = [];
    for (var i = 0; i < count; i++) {
      var t = count > 1 ? i / (count - 1) : 0.5;
      slots.push(new THREE.Vector3((t - 0.5) * (shell.roomW - 3), 1.4, -shell.roomD / 2 + 1.5 + (i % 2) * 1.0));
    }
    return slots;
  }

  // ---- floating tappable object sprite with gentle bob ----
  function addObjectSprite(g, emoji, index, placeId, position) {
    var spr = makeEmojiSprite(emoji, 1.9);
    spr.position.copy(position);
    var baseY = position.y;
    var phase = Math.random() * Math.PI * 2;
    g.add(spr);
    animItems.push({ fn: function (t) {
      spr.position.y = baseY + Math.sin(t * 1.6 + phase) * 0.14;
    }});
    registerTappable(spr, { objIndex: index, placeId: placeId, kind: 'object' });
    return spr;
  }

  // ---- helper character: capsule/cylinder body + emoji-face sprite head ----
  function addHelperCharacter(g, helperId, helper, position) {
    var charGroup = new THREE.Group();
    charGroup.position.copy(position);

    var bodyColors = ['#4dabf7', '#ff9fb0', '#ffd43b', '#69db7c', '#b197fc', '#ff8787'];
    var colorHex = bodyColors[Math.abs(hashStr(helperId)) % bodyColors.length];

    // body — capsule if available (r128 has THREE.CapsuleGeometry? not guaranteed pre-r142) fallback to cylinder + sphere cap
    var bodyH = 1.5;
    var body;
    if (THREE.CapsuleGeometry) {
      body = mesh(new THREE.CapsuleGeometry(0.45, bodyH - 0.9, 6, 12), stdMat(colorHex, { roughness: 0.6 }));
      body.position.y = bodyH / 2 + 0.1;
    } else {
      var cyl = mesh(new THREE.CylinderGeometry(0.45, 0.5, bodyH, 14), stdMat(colorHex, { roughness: 0.6 }));
      cyl.position.y = bodyH / 2;
      charGroup.add(cyl);
      var cap = mesh(new THREE.SphereGeometry(0.45, 14, 10), stdMat(colorHex, { roughness: 0.6 }));
      cap.position.y = bodyH;
      charGroup.add(cap);
      body = null;
    }
    if (body) charGroup.add(body);

    // arms — simple boxes, one will "wave"
    var armMat = stdMat(colorHex, { roughness: 0.6 });
    var armL = mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), armMat);
    armL.position.set(-0.55, bodyH * 0.62, 0);
    armL.geometry.translate(0, -0.35, 0); // pivot at shoulder
    charGroup.add(armL);
    var armR = mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), armMat);
    armR.position.set(0.55, bodyH * 0.62, 0);
    armR.geometry.translate(0, -0.35, 0);
    charGroup.add(armR);

    // head — emoji face sprite
    var head = makeEmojiSprite(helper.emoji, 1.3);
    head.position.set(0, bodyH + 0.55, 0);
    charGroup.add(head);

    // name label above head
    var label = makeSignSprite(null, helper.name, { bg: '#ffffff', border: '#4a3222' }, 1.7);
    label.position.set(0, bodyH + 1.5, 0);
    charGroup.add(label);

    g.add(charGroup);

    var basePos = position.clone();
    var phase = Math.random() * Math.PI * 2;
    var waveClock = 0, waving = false, waveDuration = 1.1, nextWaveAt = 2 + Math.random() * 3;
    animItems.push({ fn: function (t, dt) {
      charGroup.position.y = basePos.y + Math.sin(t * 1.3 + phase) * 0.08;
      head.position.y = bodyH + 0.55 + Math.sin(t * 1.3 + phase) * 0.02;
      // occasional wave: rotate right arm
      if (!waving && t > nextWaveAt) { waving = true; waveClock = 0; }
      if (waving) {
        waveClock += dt;
        var p = Math.min(waveClock / waveDuration, 1);
        armR.rotation.z = Math.sin(p * Math.PI * 3) * 0.6 * Math.sin(p * Math.PI);
        if (p >= 1) { waving = false; armR.rotation.z = 0; nextWaveAt = t + 3 + Math.random() * 4; }
      }
    }});

    [body, head, label].forEach(function (m) {
      if (m) registerTappable(m, { helperId: helperId, kind: 'helper' });
    });
    // also make the group's cylinder/cap children tappable if no capsule
    if (!body) {
      charGroup.children.forEach(function (child) {
        if (child.isMesh) registerTappable(child, { helperId: helperId, kind: 'helper' });
      });
    }

    return charGroup;
  }

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return h;
  }

  function buildRoom(placeId, roomIndex) {
    var place = HH.PLACES[placeId];
    if (!place || !place.rooms || !place.rooms[roomIndex]) {
      console.warn('[HH.World] unknown room', placeId, roomIndex);
      return new THREE.Group();
    }
    var room = place.rooms[roomIndex];
    var shell = buildRoomShell(room.id);
    var g = shell.root;

    var slots = null;
    if (FURNITURE_BUILDERS[room.id]) {
      slots = FURNITURE_BUILDERS[room.id](g, shell);
    }
    var slotKeys = slots ? Object.keys(slots) : [];
    var fallback = fallbackSlots((room.objects || []).length, shell);

    (room.objects || []).forEach(function (entry, idx) {
      var emoji = entry[0];
      var pos;
      if (slots && slotKeys[idx]) {
        pos = slots[slotKeys[idx]];
      } else {
        pos = fallback[idx];
      }
      addObjectSprite(g, emoji, idx, placeId, pos);
    });

    // helper character, if this room has one
    var helperSpots = HH.HELPER_SPOTS || {};
    var helperId = helperSpots[placeId] && helperSpots[placeId][room.id];
    if (helperId && HH.HELPERS && HH.HELPERS[helperId]) {
      var helperPos = new THREE.Vector3(shell.roomW ? shell.roomW / 4.4 : 2.5, 0, (shell.roomD || 8) / 2 - 3.6);
      addHelperCharacter(g, helperId, HH.HELPERS[helperId], helperPos);
    }

    // lighting for room (kept modest so mid-tone wall/floor colors read clearly, not blown to white)
    g.add(new THREE.AmbientLight(0xfff6e0, 0.4));
    var hemi = new THREE.HemisphereLight(0xbfe3ff, 0xffe8cc, 0.35);
    g.add(hemi);
    var dir = new THREE.DirectionalLight(0xfff2d9, 0.55);
    dir.position.set(6, 10, 8);
    g.add(dir);

    return g;
  }

  // =========================================================================
  // camera framing helpers
  // =========================================================================
  function setCameraForHub() {
    camera.position.set(0, 18, 42);
    camSwayBase = { pos: camera.position.clone(), look: new THREE.Vector3(0, 6, 0) };
    camera.lookAt(camSwayBase.look);
  }
  function setCameraForRoom(roomId) {
    if (roomId === 'playground') {
      camera.position.set(0, 6, 14);
      camSwayBase = { pos: camera.position.clone(), look: new THREE.Vector3(0, 2.5, -3) };
    } else {
      camera.position.set(0, 4.8, 9.2);
      camSwayBase = { pos: camera.position.clone(), look: new THREE.Vector3(0, 3.0, -1.5) };
    }
    camera.lookAt(camSwayBase.look);
  }

  // =========================================================================
  // render loop
  // =========================================================================
  function tick() {
    rafId = requestAnimationFrame(tick);
    var t = clock.getElapsedTime();
    var dt = Math.min(clock.getDelta(), 0.05);
    for (var i = 0; i < animItems.length; i++) animItems[i].fn(t, dt);

    // gentle camera sway (<=2 degrees) around the fixed framing
    if (camSwayBase) {
      var swayAmt = (Math.PI / 180) * 1.4; // ~1.4 degrees
      var angle = Math.sin(t * 0.25) * swayAmt;
      var radius = camSwayBase.pos.distanceTo(camSwayBase.look);
      var dir3 = new THREE.Vector3().subVectors(camSwayBase.pos, camSwayBase.look).normalize();
      var rotated = dir3.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      camera.position.copy(camSwayBase.look).add(rotated.multiplyScalar(radius));
      camera.position.y = camSwayBase.pos.y + Math.sin(t * 0.18) * 0.15;
      camera.lookAt(camSwayBase.look);
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
      handlers.onObject(data.objIndex);
    } else if (data.kind === 'helper' && data.helperId) {
      handlers.onHelper(data.helperId);
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
      var root = buildHub();
      setRoot(root);
      setCameraForHub();
    },

    showRoom: function (placeId, roomIndex) {
      clearAnim();
      clearTappables();
      var place = HH.PLACES[placeId];
      var room = place && place.rooms && place.rooms[roomIndex];
      var g = buildRoom(placeId, roomIndex);
      setRoot(g);
      setCameraForRoom(room ? room.id : null);
    },

    setHandlers: function (h) {
      h = h || {};
      handlers.onBuilding = h.onBuilding || function () {};
      handlers.onObject = h.onObject || function () {};
      handlers.onHelper = h.onHelper || function () {};
    }
  };
})();
