// Aaria's Magnet Blocks — MB.Playroom
// Plain script, no imports. THREE is a global (old r13x API). Depends on MB.CATALOG.
// Builds a cozy kid's playroom: floor/walls/window/door/posters, rug + build table,
// per-category shelf units with bins holding a display copy of every catalog block,
// warm lighting, and cozy props. Returns the exact contract shape MB.Playroom.build(scene) needs.
(function () {
  'use strict';
  window.MB = window.MB || {};

  // ---------------------------------------------------------------------
  // small canvas-texture helpers
  // ---------------------------------------------------------------------
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function canvasTex(draw, w, h, repX, repY) {
    var c = makeCanvas(w || 256, h || 256);
    draw(c.getContext('2d'), c.width, c.height);
    var t = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    if (repX || repY) {
      t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repX || 1, repY || 1);
    }
    t.needsUpdate = true;
    return t;
  }

  function woodTexture() {
    return canvasTex(function (ctx, w, h) {
      ctx.fillStyle = '#d8a15c'; ctx.fillRect(0, 0, w, h);
      var planks = 6;
      for (var i = 0; i < planks; i++) {
        var y = (h / planks) * i;
        ctx.fillStyle = (i % 2 === 0) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, y, w, h / planks);
        ctx.strokeStyle = 'rgba(90,55,20,0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        for (var g = 0; g < 5; g++) {
          ctx.strokeStyle = 'rgba(90,55,20,0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          var gy = y + Math.random() * (h / planks);
          ctx.moveTo(0, gy);
          for (var x = 0; x <= w; x += 24) ctx.lineTo(x, gy + Math.sin(x * 0.05 + i) * 2);
          ctx.stroke();
        }
      }
    }, 256, 256, 10, 6);
  }

  function rugTexture() {
    return canvasTex(function (ctx, w, h) {
      var cx = w / 2, cy = h / 2;
      var colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#b197fc', '#ffa94d'];
      ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, w, h);
      var rings = 7;
      for (var i = rings; i >= 0; i--) {
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.arc(cx, cy, (cx * 0.95) * (i / rings), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = '#fff8ef';
      ctx.arc(cx, cy, cx * 0.06, 0, Math.PI * 2);
      ctx.fill();
      // scalloped edge shading
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, cx * 0.97, 0, Math.PI * 2); ctx.stroke();
    }, 512, 512);
  }

  function tabletopTexture(hex) {
    return canvasTex(function (ctx, w, h) {
      ctx.fillStyle = hex; ctx.fillRect(0, 0, w, h);
      var studsAcross = 16; // ~ visual stud pitch across the buildable square
      var cell = w / studsAcross;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      for (var i = 0; i <= studsAcross; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(w, i * cell); ctx.stroke();
        // finer 4x subdivisions, very subtle
        for (var s = 1; s < 4; s++) {
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath(); ctx.moveTo(i * cell + s * cell / 4, 0); ctx.lineTo(i * cell + s * cell / 4, h); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (var x = 0; x <= studsAcross; x++) {
        for (var y = 0; y <= studsAcross; y++) {
          ctx.beginPath(); ctx.arc(x * cell, y * cell, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
    }, 512, 512);
  }

  function skyTexture() {
    return canvasTex(function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#7ec8ff'); g.addColorStop(1, '#d6f3ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.beginPath(); ctx.fillStyle = '#fff3a0';
      ctx.arc(w * 0.75, h * 0.28, w * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      [[0.15,0.3,0.12],[0.28,0.32,0.09],[0.6,0.18,0.1]].forEach(function(p){
        ctx.beginPath();
        ctx.ellipse(w*p[0], h*p[1], w*p[2], h*p[2]*0.6, 0, 0, Math.PI*2);
        ctx.fill();
      });
    }, 256, 192);
  }

  function doorTexture() {
    return canvasTex(function (ctx, w, h) {
      ctx.fillStyle = '#c88a4a'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8a5a26'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.strokeRect(w * 0.15, h * 0.08, w * 0.7, h * 0.4);
      ctx.strokeRect(w * 0.15, h * 0.55, w * 0.7, h * 0.38);
      ctx.beginPath(); ctx.fillStyle = '#ffd43b';
      ctx.arc(w * 0.78, h * 0.55, w * 0.035, 0, Math.PI * 2); ctx.fill();
    }, 160, 240);
  }

  function posterTexture(kind) {
    return canvasTex(function (ctx, w, h) {
      ctx.fillStyle = '#fff9ef'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, w - 10, h - 10);
      if (kind === 'rainbow') {
        var bands = ['#ff6b6b', '#ffa94d', '#ffd43b', '#a9e34b', '#38d9a9', '#4dabf7', '#b197fc'];
        for (var i = 0; i < bands.length; i++) {
          ctx.strokeStyle = bands[i]; ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.95, h * 0.75 - i * 14, Math.PI, 2 * Math.PI);
          ctx.stroke();
        }
      } else if (kind === 'elephant') {
        ctx.fillStyle = '#4dabf7';
        ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.55, w * 0.28, h * 0.24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.34, w * 0.16, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4dabf7'; ctx.lineWidth = w * 0.06; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.4); ctx.quadraticCurveTo(w * 0.28, h * 0.6, w * 0.36, h * 0.78); ctx.stroke();
        ctx.fillStyle = '#f783ac';
        ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.28, w * 0.09, h * 0.09, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#212529';
        ctx.beginPath(); ctx.arc(w * 0.58, h * 0.32, 4, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#ff8787';
        ctx.font = 'bold ' + Math.floor(w * 0.13) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText("AARIA'S", w / 2, h * 0.38);
        ctx.fillStyle = '#4dabf7';
        ctx.fillText('PLAYROOM', w / 2, h * 0.62);
        ctx.font = Math.floor(w * 0.1) + 'px sans-serif';
        ctx.fillText('★ ✦ ★', w / 2, h * 0.85);
      }
    }, 380, 260);
  }

  function signTexture(emoji, name) {
    return canvasTex(function (ctx, w, h) {
      var r = 22;
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath();
      ctx.moveTo(r, 0); ctx.arcTo(w, 0, w, h, r); ctx.arcTo(w, h, 0, h, r);
      ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, w, 0, r); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8c07a'; ctx.lineWidth = 8; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = Math.floor(h * 0.42) + 'px sans-serif';
      ctx.fillText(emoji || '★', w / 2, h * 0.38);
      ctx.fillStyle = '#5c4326';
      ctx.font = 'bold ' + Math.floor(h * 0.2) + 'px sans-serif';
      ctx.fillText((name || '').toUpperCase(), w / 2, h * 0.78);
    }, 256, 128);
  }

  function clockTexture() {
    return canvasTex(function (ctx, w, h) {
      var cx = w / 2, cy = h / 2, r = w / 2 - 4;
      ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e8967a'; ctx.lineWidth = 8; ctx.stroke();
      ctx.fillStyle = '#495057';
      for (var i = 0; i < 12; i++) {
        var a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.sin(a) * r * 0.82, cy - Math.cos(a) * r * 0.82, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#495057'; ctx.lineCap = 'round';
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * 0.35, cy - r * 0.25); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - r * 0.05, cy - r * 0.55); ctx.stroke();
      ctx.fillStyle = '#e8967a'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    }, 128, 128);
  }

  // ---------------------------------------------------------------------
  // material / geometry caches
  // ---------------------------------------------------------------------
  var matCache = {};
  function stdMat(hex, opts) {
    opts = opts || {};
    var key = hex + '|' + (opts.roughness || 0.35) + '|' + (opts.metalness || 0) + '|' + (opts.map ? 'm' : '') + '|' + (opts.emissive ? 'e' : '') + (opts.transparent ? 't' : '');
    if (matCache[key]) return matCache[key];
    var params = {
      color: new THREE.Color(hex),
      roughness: opts.roughness !== undefined ? opts.roughness : 0.7,
      metalness: opts.metalness !== undefined ? opts.metalness : 0
    };
    if (opts.map) params.map = opts.map;
    if (opts.emissive) { params.emissive = new THREE.Color(opts.emissiveHex || hex); params.emissiveIntensity = opts.emissiveIntensity || 0.8; }
    if (opts.transparent) { params.transparent = true; params.opacity = opts.opacity !== undefined ? opts.opacity : 0.7; }
    if (opts.side) params.side = opts.side;
    var m = new THREE.MeshStandardMaterial(params);
    matCache[key] = m;
    return m;
  }

  function mesh(geo, mat, shadow) {
    var m = new THREE.Mesh(geo, mat);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  }

  // ===========================================================================
  MB.Playroom = {
    build: function (scene) {
      var CATALOG = MB.CATALOG || { categories: [], blocks: {} };
      var root = new THREE.Group(); root.name = 'playroom';

      // ---- room dimensions ----
      var ROOM_W = 46, ROOM_D = 30, ROOM_H = 14;
      var HALF_W = ROOM_W / 2, HALF_D = ROOM_D / 2;
      var WALL_T = 0.6;
      var floorY = 0;

      // ---- floor ----
      var floorGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_D);
      var floorMesh = mesh(floorGeo, stdMat('#e8c58a', { map: woodTexture(), roughness: 0.8 }));
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.castShadow = false;
      root.add(floorMesh);

      // ---- walls ----
      var wallColors = { n: '#ffe8d6', s: '#ffe8d6', w: '#d9edf8', e: '#fde3ef' };
      function addWall(w, h, d, x, y, z, hex) {
        var wm = mesh(new THREE.BoxGeometry(w, h, d), stdMat(hex, { roughness: 0.85 }));
        wm.position.set(x, y, z);
        wm.receiveShadow = true; wm.castShadow = false;
        root.add(wm);
        return wm;
      }
      addWall(ROOM_W, ROOM_H, WALL_T, 0, ROOM_H / 2, -HALF_D, wallColors.n);
      addWall(ROOM_W, ROOM_H, WALL_T, 0, ROOM_H / 2, HALF_D, wallColors.s);
      addWall(WALL_T, ROOM_H, ROOM_D, -HALF_W, ROOM_H / 2, 0, wallColors.w);
      addWall(WALL_T, ROOM_H, ROOM_D, HALF_W, ROOM_H / 2, 0, wallColors.e);
      // skirting boards
      var skirtMat = stdMat('#c8996a', { roughness: 0.6 });
      [-HALF_D, HALF_D].forEach(function (z) {
        var s = mesh(new THREE.BoxGeometry(ROOM_W, 0.9, WALL_T + 0.1), skirtMat);
        s.position.set(0, 0.45, z);
        root.add(s);
      });
      [-HALF_W, HALF_W].forEach(function (x) {
        var s = mesh(new THREE.BoxGeometry(WALL_T + 0.1, 0.9, ROOM_D), skirtMat);
        s.position.set(x, 0.45, 0);
        root.add(s);
      });

      // ---- window + door on south wall (kept clear of the shelf walls) ----
      var winPlane = mesh(new THREE.PlaneGeometry(10, 6), stdMat('#ffffff', { map: skyTexture(), roughness: 1 }), false);
      var winFrame = mesh(new THREE.BoxGeometry(10.6, 6.6, 0.15), stdMat('#a9784f', { roughness: 0.7 }));
      winFrame.position.set(-10, 8, HALF_D - WALL_T / 2 - 0.06);
      winPlane.position.set(-10, 8, HALF_D - WALL_T / 2 + 0.02);
      root.add(winFrame); root.add(winPlane);

      var doorPlane = mesh(new THREE.PlaneGeometry(2.6, 3.9), stdMat('#ffffff', { map: doorTexture() }), false);
      doorPlane.position.set(10, 1.95, HALF_D - WALL_T / 2 + 0.02);
      root.add(doorPlane);

      // ---- posters ----
      function addPoster(kind, x, y, z, ry, w, h) {
        var p = mesh(new THREE.PlaneGeometry(w || 3.6, h || 2.5), stdMat('#ffffff', { map: posterTexture(kind) }), false);
        p.position.set(x, y, z);
        p.rotation.y = ry || 0;
        root.add(p);
      }
      addPoster('rainbow', 1, 9.2, HALF_D - WALL_T / 2 + 0.02, 0);
      addPoster('elephant', 0, 9.4, -HALF_D + WALL_T / 2 - 0.02, Math.PI);
      addPoster('banner', -8, 11.6, HALF_D - WALL_T / 2 + 0.02, 0, 5.4, 2.4);

      // ---- rug ----
      var RUG_R = 11;
      var rug = mesh(new THREE.CircleGeometry(RUG_R, 40), stdMat('#ffffff', { map: rugTexture(), roughness: 0.95 }), false);
      rug.rotation.x = -Math.PI / 2; rug.position.y = 0.02; rug.receiveShadow = true;
      root.add(rug);

      // ---- build table ----
      var tableTopY = 2.2;
      var tableHalf = 7; // buildable half-extent, per contract
      var tablePhysHalf = tableHalf + 0.9; // physical rim beyond buildable area
      var TOP_THICK = 0.4;
      var tableTop = mesh(new THREE.BoxGeometry(tablePhysHalf * 2, TOP_THICK, tablePhysHalf * 2),
        stdMat('#ffd8a8', { map: tabletopTexture('#ffd8a8'), roughness: 0.5 }));
      tableTop.position.set(0, tableTopY - TOP_THICK / 2, 0);
      root.add(tableTop);
      var legH = tableTopY - TOP_THICK;
      var legGeo = new THREE.CylinderGeometry(0.55, 0.65, legH, 14);
      var legMat = stdMat('#e8a659', { roughness: 0.6 });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
        var lx = s[0] * (tablePhysHalf - 0.9), lz = s[1] * (tablePhysHalf - 0.9);
        var leg = mesh(legGeo, legMat);
        leg.position.set(lx, legH / 2, lz);
        root.add(leg);
      });
      var tableCenter = new THREE.Vector3(0, tableTopY, 0);

      // ---- ceiling pendant lamps over the table ----
      var lampMat = stdMat('#fff3bf', { emissive: true, emissiveHex: '#ffe066', emissiveIntensity: 1.0, roughness: 0.4 });
      [[-3, -2], [3, 2]].forEach(function (p) {
        var cordH = ROOM_H - 6.8;
        var cord = mesh(new THREE.CylinderGeometry(0.05, 0.05, cordH, 6), stdMat('#5c4326', { roughness: 0.8 }), false);
        cord.position.set(p[0], ROOM_H - cordH / 2, p[1]);
        root.add(cord);
        var bulb = mesh(new THREE.SphereGeometry(0.55, 14, 10), lampMat, false);
        bulb.position.set(p[0], ROOM_H - cordH, p[1]);
        root.add(bulb);
        var pl = new THREE.PointLight(0xffdd99, 0.5, 14, 2);
        pl.position.copy(bulb.position);
        root.add(pl);
      });

      // ---- fairy lights along the south wall (near ceiling) ----
      var fairyColors = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#b197fc', '#ff8787'];
      for (var fi = 0; fi < 20; fi++) {
        var t = fi / 19;
        var fx = -19 + t * 38;
        var fy = 12.4 + Math.sin(t * Math.PI * 5) * 0.35 - 0.35;
        var fcol = fairyColors[fi % fairyColors.length];
        var fb = mesh(new THREE.SphereGeometry(0.14, 8, 6), stdMat(fcol, { emissive: true, emissiveHex: fcol, emissiveIntensity: 1.0 }), false);
        fb.position.set(fx, fy, HALF_D - WALL_T / 2 - 0.15);
        root.add(fb);
      }

      // ---- cozy props ----
      function addBeanbag(x, z, hex) {
        var bb = mesh(new THREE.SphereGeometry(1.1, 16, 12), stdMat(hex, { roughness: 0.9 }));
        bb.scale.set(1, 0.62, 1);
        bb.position.set(x, 0.68, z);
        root.add(bb);
      }
      function addToyChest(x, z) {
        var g = new THREE.Group();
        var base = mesh(new THREE.BoxGeometry(2.6, 1.2, 1.5), stdMat('#c8996a', { roughness: 0.6 }));
        base.position.set(0, 0.6, 0);
        var lid = mesh(new THREE.BoxGeometry(2.7, 0.35, 1.6), stdMat('#e8a659', { roughness: 0.6 }));
        lid.position.set(0, 1.35, -0.1);
        lid.rotation.x = -0.35;
        var clasp = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.15), stdMat('#ffd43b', { metalness: 0.4, roughness: 0.4 }));
        clasp.position.set(0, 1.05, 0.72);
        g.add(base); g.add(lid); g.add(clasp);
        g.position.set(x, 0, z);
        root.add(g);
      }
      function addBall(x, z, hex) {
        var b = mesh(new THREE.SphereGeometry(0.55, 16, 12), stdMat(hex, { roughness: 0.4 }));
        b.position.set(x, 0.55, z);
        root.add(b);
      }
      function addBooks(x, z) {
        var cols = ['#ff6b6b', '#4dabf7', '#ffd43b', '#51cf66'];
        var y = 0;
        for (var i = 0; i < cols.length; i++) {
          var h = 0.28;
          var bk = mesh(new THREE.BoxGeometry(1.4 - i * 0.05, h, 1.0 - i * 0.03), stdMat(cols[i], { roughness: 0.6 }));
          bk.position.set(x + (i % 2 === 0 ? 0.05 : -0.05), y + h / 2, z);
          bk.rotation.y = (i - 1.5) * 0.06;
          root.add(bk);
          y += h;
        }
      }
      function addPlant(x, z) {
        var pot = mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.7, 12), stdMat('#e8967a', { roughness: 0.7 }));
        pot.position.set(x, 0.35, z);
        root.add(pot);
        var leafMat = stdMat('#51cf66', { roughness: 0.7 });
        for (var i = 0; i < 5; i++) {
          var a = (i / 5) * Math.PI * 2;
          var leaf = mesh(new THREE.SphereGeometry(0.55, 10, 8), leafMat);
          leaf.scale.set(0.55, 1.3, 0.55);
          leaf.position.set(x + Math.cos(a) * 0.25, 1.3 + (i % 2) * 0.3, z + Math.sin(a) * 0.25);
          root.add(leaf);
        }
      }
      function addClock(x, y, z, ry) {
        var c = mesh(new THREE.CircleGeometry(1.1, 24), stdMat('#ffffff', { map: clockTexture() }), false);
        c.position.set(x, y, z); c.rotation.y = ry || 0;
        root.add(c);
      }
      addBeanbag(15.5, 10.5, '#38d9a9');
      addToyChest(-16.5, 11.2);
      addBall(13.6, 9.0, '#ff6b6b');
      addBooks(-13.6, 9.4);
      addPlant(-21, -13.4);
      addClock(0, 10.6, -HALF_D + WALL_T / 2 - 0.02, Math.PI);

      // ---- lighting ----
      root.add(new THREE.AmbientLight(0xfff1e0, 0.55));
      var hemi = new THREE.HemisphereLight(0xbfe3ff, 0xffe8cc, 0.5);
      root.add(hemi);
      var dir = new THREE.DirectionalLight(0xfff2d9, 0.85);
      dir.position.set(16, 26, 12);
      dir.target.position.set(0, 0, 0);
      dir.castShadow = true;
      dir.shadow.mapSize.set(2048, 2048);
      dir.shadow.camera.left = -HALF_W - 2;
      dir.shadow.camera.right = HALF_W + 2;
      dir.shadow.camera.top = HALF_D + 2;
      dir.shadow.camera.bottom = -(HALF_D + 2);
      dir.shadow.camera.near = 1;
      dir.shadow.camera.far = 60;
      dir.shadow.bias = -0.0015;
      root.add(dir);
      root.add(dir.target);

      // =======================================================================
      // ---- dynamic shelves + bins, one unit per catalog category ----
      // =======================================================================
      var bins = [];
      var categories = CATALOG.categories || [];
      var blocksById = CATALOG.blocks || {};

      // group blocks by category id, preserving catalog order
      var byCat = {};
      categories.forEach(function (c) { byCat[c.id] = []; });
      Object.keys(blocksById).forEach(function (id) {
        var def = blocksById[id];
        if (!def) return;
        if (!byCat[def.category]) byCat[def.category] = [];
        byCat[def.category].push({ id: id, def: def });
      });

      // split categories into up to 3 wall groups (North, West, East), evenly
      function chunk3(arr) {
        var n = arr.length;
        var per = Math.ceil(n / 3) || 1;
        return [arr.slice(0, per), arr.slice(per, per * 2), arr.slice(per * 2)];
      }
      var groups = chunk3(categories);

      var SHELF_D = 1.6;
      var wallDefs = [
        { cats: groups[0], axis: 'x', length: 40, depthPos: -HALF_D + WALL_T / 2 + 0.35 + SHELF_D / 2, facing: 1 },
        { cats: groups[1], axis: 'z', length: 25, depthPos: -HALF_W + WALL_T / 2 + 0.35 + SHELF_D / 2, facing: 1 },
        { cats: groups[2], axis: 'z', length: 25, depthPos: HALF_W - WALL_T / 2 - 0.35 - SHELF_D / 2, facing: -1 }
      ];

      var BIN_PITCH = 1.9, UNIT_MARGIN = 0.5, GAP = 0.8;
      var TIER_Y0 = 1.1, TIER_GAP = 2.05, TRAY_THICK = 0.22, TIER_BOARD_THICK = 0.15;

      function layoutUnits(cats, availableLength) {
        function widths(pitch, margin) {
          return cats.map(function (c) {
            var list = byCat[c.id] || [];
            var n = Math.max(list.length, 1);
            var tiers = n <= 6 ? 2 : 3;
            var perTier = Math.ceil(n / tiers);
            return { cat: c, list: list, tiers: tiers, perTier: perTier, width: perTier * pitch + margin * 2 };
          });
        }
        var list = widths(BIN_PITCH, UNIT_MARGIN);
        var total = list.reduce(function (s, u) { return s + u.width; }, 0) + GAP * Math.max(list.length - 1, 0);
        var scale = total > availableLength ? availableLength / total : 1;
        var pitch = BIN_PITCH * scale, margin = UNIT_MARGIN * scale, gap = GAP * scale;
        if (scale < 1) {
          list = widths(pitch, margin);
          total = list.reduce(function (s, u) { return s + u.width; }, 0) + gap * Math.max(list.length - 1, 0);
        }
        var cursor = -total / 2;
        list.forEach(function (u) {
          u.center = cursor + u.width / 2;
          cursor += u.width + gap;
          u.pitch = pitch;
        });
        return list;
      }

      var shelfFrameMat = stdMat('#c8996a', { roughness: 0.55 });
      var traySwatch = ['#ff8787', '#ffc078', '#ffe066', '#c0eb75', '#8ce99a', '#63e6be', '#66d9e8', '#74c0fc', '#b197fc', '#f783ac'];

      wallDefs.forEach(function (wallDef) {
        if (!wallDef.cats.length) return;
        var units = layoutUnits(wallDef.cats, wallDef.length);
        units.forEach(function (u, unitIdx) {
          var topTierY = TIER_Y0 + (u.tiers - 1) * TIER_GAP;
          var frameH = topTierY + TRAY_THICK + 1.9; // extra height for sign board
          var depth = SHELF_D;

          // side + tier boards, built with axis-correct box dimensions (room is axis aligned, no rotation needed)
          function boxDims(alongWallSize, h, depthSize) {
            return wallDef.axis === 'x'
              ? [alongWallSize, h, depthSize]
              : [depthSize, h, alongWallSize];
          }
          function setPos(m3, alongWallCoord, y) {
            if (wallDef.axis === 'x') m3.position.set(alongWallCoord, y, wallDef.depthPos);
            else m3.position.set(wallDef.depthPos, y, alongWallCoord);
          }

          // side panels
          [u.center - u.width / 2 + 0.08, u.center + u.width / 2 - 0.08].forEach(function (edge) {
            var dims = boxDims(0.15, frameH, depth);
            var side = mesh(new THREE.BoxGeometry(dims[0], dims[1], dims[2]), shelfFrameMat);
            setPos(side, edge, frameH / 2);
            root.add(side);
          });
          // back panel
          var backDims = boxDims(u.width, frameH, 0.12);
          var back = mesh(new THREE.BoxGeometry(backDims[0], backDims[1], backDims[2]), shelfFrameMat);
          var backDepthOffset = -wallDef.facing * (depth / 2 - 0.06);
          if (wallDef.axis === 'x') back.position.set(u.center, frameH / 2, wallDef.depthPos + backDepthOffset);
          else back.position.set(wallDef.depthPos + backDepthOffset, frameH / 2, u.center);
          root.add(back);

          // tier boards + sign
          var catDef = u.cat;
          var itemsList = u.list;
          var idx = 0;
          for (var t = 0; t < u.tiers; t++) {
            var tierY = TIER_Y0 + t * TIER_GAP;
            var boardDims = boxDims(u.width, TIER_BOARD_THICK, depth);
            var board = mesh(new THREE.BoxGeometry(boardDims[0], boardDims[1], boardDims[2]), shelfFrameMat);
            setPos(board, u.center, tierY);
            root.add(board);

            var remaining = itemsList.length - idx;
            var rowCount = Math.min(u.perTier, Math.max(remaining, 0));
            for (var j = 0; j < rowCount; j++) {
              var itemEntry = itemsList[idx++];
              var colOffset = (rowCount - 1) / 2;
              var alongCoord = u.center + (j - colOffset) * u.pitch;

              // tray
              var trayHex = traySwatch[(unitIdx * 3 + t) % traySwatch.length];
              var trayDims = boxDims(u.pitch * 0.8, TRAY_THICK, depth * 0.78);
              var tray = mesh(new THREE.BoxGeometry(trayDims[0], trayDims[1], trayDims[2]), stdMat(trayHex, { roughness: 0.5 }));
              var trayY = tierY + TIER_BOARD_THICK / 2 + TRAY_THICK / 2;
              setPos(tray, alongCoord, trayY);
              root.add(tray);

              // display copy of the block, scaled to fit the tray
              var def = itemEntry.def;
              var display = null;
              try {
                display = def.build ? def.build(def.defaultColor) : new THREE.Group();
              } catch (err) {
                display = new THREE.Group();
              }
              var size = def.size || { w: 1, h: 1.2, d: 1 };
              var footprint = Math.max(size.w || 1, size.d || 1);
              var scaleF = Math.min(1, 1.5 / footprint, 1.7 / (size.h || 1.2));
              display.scale.setScalar(scaleF);
              display.traverse(function (child) {
                if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
              });

              var surfaceY = trayY + TRAY_THICK / 2;
              var posVec;
              if (wallDef.axis === 'x') posVec = new THREE.Vector3(alongCoord, surfaceY, wallDef.depthPos);
              else posVec = new THREE.Vector3(wallDef.depthPos, surfaceY, alongCoord);
              display.position.copy(posVec);
              root.add(display);

              bins.push({ blockId: itemEntry.id, categoryId: catDef.id, pos: posVec.clone(), display: display });
            }
          }

          // sign board above the top tier
          var signY = topTierY + 1.15;
          var signDims = boxDims(Math.min(u.width * 0.9, 3.4), 1.5, 0.06);
          var sign = mesh(new THREE.PlaneGeometry(signDims[0], signDims[1]), stdMat('#ffffff', { map: signTexture(catDef.emoji, catDef.name) }), false);
          if (wallDef.axis === 'x') {
            sign.position.set(u.center, signY, wallDef.depthPos + wallDef.facing * (depth / 2 + 0.05));
            sign.rotation.y = wallDef.facing > 0 ? 0 : Math.PI;
          } else {
            sign.position.set(wallDef.depthPos + wallDef.facing * (depth / 2 + 0.05), signY, u.center);
            sign.rotation.y = wallDef.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
          }
          root.add(sign);
        });
      });

      scene.add(root);
      console.log('[MB] playroom ready');
      return {
        tableCenter: tableCenter,
        tableTopY: tableTopY,
        tableHalf: tableHalf,
        bins: bins,
        floorY: floorY
      };
    }
  };
})();
