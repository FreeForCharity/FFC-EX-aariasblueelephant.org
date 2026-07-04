// catalog.js — Aaria's Magnet Blocks piece catalog
// Plain script, no imports. THREE is a global (old r13x API). Self-contained: window.MB.CATALOG
window.MB = window.MB || {};
(function(){
  'use strict';
  var MB = window.MB;

  // ======================================================================
  // caches
  // ======================================================================
  var _geomCache = {}, _matCache = {}, _texCache = {};

  function geom(key, fn){ if (!_geomCache[key]) _geomCache[key] = fn(); return _geomCache[key]; }
  function boxG(w,h,d){ return geom('box:'+w+':'+h+':'+d, function(){ return new THREE.BoxGeometry(w,h,d); }); }
  function cylG(rt,rb,h,seg){ seg = seg||16; return geom('cyl:'+rt+':'+rb+':'+h+':'+seg, function(){ return new THREE.CylinderGeometry(rt,rb,h,seg); }); }
  function sphG(r,ws,hs){ ws=ws||14; hs=hs||10; return geom('sph:'+r+':'+ws+':'+hs, function(){ return new THREE.SphereGeometry(r,ws,hs); }); }
  function hsphG(r,ws,hs){ ws=ws||18; hs=hs||10; return geom('hsph:'+r+':'+ws+':'+hs, function(){ return new THREE.SphereGeometry(r,ws,hs,0,Math.PI*2,0,Math.PI/2); }); }
  function coneG(r,h,seg){ seg = seg||16; return geom('cone:'+r+':'+h+':'+seg, function(){ return new THREE.ConeGeometry(r,h,seg); }); }
  function torG(r,t,rs,ts,arc){ rs=rs||8; ts=ts||20; arc=(arc==null)?Math.PI*2:arc; return geom('tor:'+r+':'+t+':'+rs+':'+ts+':'+arc, function(){ return new THREE.TorusGeometry(r,t,rs,ts,arc); }); }
  function studGeom(){ return geom('stud', function(){ return new THREE.CylinderGeometry(0.3,0.3,0.18,12); }); }

  function material(hex, opts){
    opts = opts || {};
    var rough = (opts.roughness != null) ? opts.roughness : 0.35;
    var met = (opts.metalness != null) ? opts.metalness : 0;
    var key = hex+'|'+rough+'|'+met+'|'+(opts.transparent?(opts.opacity||0.5):'x')+'|'+(opts.emissive||'')+'|'+(opts.emissiveIntensity||'');
    if (_matCache[key]) return _matCache[key];
    var params = { color: hex, roughness: rough, metalness: met };
    if (opts.transparent){ params.transparent = true; params.opacity = (opts.opacity != null) ? opts.opacity : 0.5; params.depthWrite = false; }
    if (opts.emissive){ params.emissive = opts.emissive; params.emissiveIntensity = (opts.emissiveIntensity != null) ? opts.emissiveIntensity : 0.9; }
    var m = new THREE.MeshStandardMaterial(params);
    _matCache[key] = m;
    return m;
  }

  function mk(g, m, noShadow){
    var o = new THREE.Mesh(g, m);
    if (!noShadow){ o.castShadow = true; o.receiveShadow = true; }
    return o;
  }
  function P(o,x,y,z){ o.position.set(x,y,z); return o; }

  // grid rule: W studs wide (x) x D studs deep (z), all at height y
  function gridPoints(w,d,y){
    var pts = [], x0 = -(w-1)/2, z0 = -(d-1)/2;
    for (var i=0;i<w;i++){ for (var j=0;j<d;j++){ pts.push({ x:x0+i, y:y, z:z0+j }); } }
    return pts;
  }

  function addStuds(group, studs, m){
    if (!studs || !studs.length) return;
    var g = studGeom();
    for (var i=0;i<studs.length;i++){
      var s = studs[i];
      var b = mk(g, m);
      b.position.set(s.x, s.y+0.09, s.z);
      group.add(b);
    }
  }

  var BLACK = '#212529';
  function eyes(group, mat, cx, cy, cz, spread, r){
    var g = sphG(r,10,8);
    group.add(P(mk(g,mat,true), cx-spread, cy, cz));
    group.add(P(mk(g,mat,true), cx+spread, cy, cz));
  }

  // ======================================================================
  // canvas textures (face tiles)
  // ======================================================================
  function drawHeart(ctx,x,y,s){
    ctx.beginPath();
    ctx.moveTo(x, y+s*0.3);
    ctx.bezierCurveTo(x, y, x-s, y, x-s, y+s*0.35);
    ctx.bezierCurveTo(x-s, y+s*0.75, x, y+s, x, y+s*1.15);
    ctx.bezierCurveTo(x, y+s, x+s, y+s*0.75, x+s, y+s*0.35);
    ctx.bezierCurveTo(x+s, y, x, y, x, y+s*0.3);
    ctx.fill();
  }
  function drawStar2d(ctx,x,y,r){
    ctx.beginPath();
    for (var i=0;i<10;i++){
      var ang = -Math.PI/2 + i*Math.PI/5;
      var rad = (i%2===0) ? r : r*0.45;
      var px = x+Math.cos(ang)*rad, py = y+Math.sin(ang)*rad;
      if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath(); ctx.fill();
  }
  function faceTexture(kind){
    var key = 'face_'+kind;
    if (_texCache[key]) return _texCache[key];
    var c = document.createElement('canvas'); c.width = 128; c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(0,0,128,128);
    ctx.fillStyle = '#212529'; ctx.strokeStyle = '#212529'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    if (kind === 'heart'){ drawHeart(ctx,42,52,14); drawHeart(ctx,86,52,14); }
    else if (kind === 'star'){ drawStar2d(ctx,42,52,13); drawStar2d(ctx,86,52,13); }
    else { ctx.beginPath(); ctx.arc(42,50,9,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(86,50,9,0,Math.PI*2); ctx.fill(); }
    ctx.beginPath();
    if (kind === 'silly'){
      ctx.arc(64,78,24,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath(); ctx.ellipse(64,96,13,16,0,0,Math.PI*2); ctx.fill();
    } else {
      ctx.arc(64,74,26,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    _texCache[key] = tex;
    return tex;
  }
  var _faceMat = {};
  function faceTopMat(kind){
    if (_faceMat[kind]) return _faceMat[kind];
    var m = new THREE.MeshStandardMaterial({ map: faceTexture(kind), roughness: 0.35 });
    _faceMat[kind] = m;
    return m;
  }

  // ======================================================================
  // shape helpers (Shape + Extrude, built-in geometry only)
  // ======================================================================
  function wedgeGeom(w,h,d){
    return geom('wedge:'+w+':'+h+':'+d, function(){
      var half = w/2;
      var shape = new THREE.Shape();
      shape.moveTo(-half,0); shape.lineTo(-half,h); shape.lineTo(0,h); shape.lineTo(half,0); shape.lineTo(-half,0);
      var eg = new THREE.ExtrudeGeometry(shape, { depth:d, bevelEnabled:false, steps:1 });
      eg.translate(0,0,-d/2);
      return eg;
    });
  }
  function archGeom(w,h,d){
    return geom('arch:'+w+':'+h+':'+d, function(){
      var half = w/2;
      var shape = new THREE.Shape();
      shape.moveTo(-half,0); shape.lineTo(-half,h); shape.lineTo(half,h); shape.lineTo(half,0); shape.lineTo(-half,0);
      var archR = w*0.2, baseH = h*0.2;
      var hole = new THREE.Path();
      hole.moveTo(-archR,0); hole.lineTo(-archR,baseH);
      hole.absarc(0,baseH,archR,Math.PI,0,true);
      hole.lineTo(archR,0); hole.lineTo(-archR,0);
      shape.holes.push(hole);
      var eg = new THREE.ExtrudeGeometry(shape, { depth:d, bevelEnabled:false, steps:1 });
      eg.translate(0,0,-d/2);
      return eg;
    });
  }
  function frameGeom(w,h,d,openW,openY0,openY1){
    return geom('frame:'+w+':'+h+':'+d+':'+openW+':'+openY0+':'+openY1, function(){
      var half = w/2, oh = openW/2;
      var shape = new THREE.Shape();
      shape.moveTo(-half,0); shape.lineTo(-half,h); shape.lineTo(half,h); shape.lineTo(half,0); shape.lineTo(-half,0);
      var hole = new THREE.Path();
      hole.moveTo(-oh,openY0); hole.lineTo(-oh,openY1); hole.lineTo(oh,openY1); hole.lineTo(oh,openY0); hole.lineTo(-oh,openY0);
      shape.holes.push(hole);
      var eg = new THREE.ExtrudeGeometry(shape, { depth:d, bevelEnabled:false, steps:1 });
      eg.translate(0,0,-d/2);
      return eg;
    });
  }
  function starGeom(r,h){
    return geom('star:'+r+':'+h, function(){
      var shape = new THREE.Shape();
      for (var i=0;i<10;i++){
        var ang = -Math.PI/2 + i*Math.PI/5;
        var rad = (i%2===0) ? r : r*0.42;
        var px = Math.cos(ang)*rad, py = Math.sin(ang)*rad;
        if (i===0) shape.moveTo(px,py); else shape.lineTo(px,py);
      }
      shape.closePath();
      var eg = new THREE.ExtrudeGeometry(shape, { depth:h, bevelEnabled:true, bevelSize:0.04, bevelThickness:0.04, steps:1 });
      eg.rotateX(-Math.PI/2); // shape's extrude axis (z, 0..h) becomes world y (0..h)
      return eg;
    });
  }

  // ======================================================================
  // catalog skeleton
  // ======================================================================
  var CATALOG = {
    palette: [
      { name:'red', hex:'#ff6b6b' }, { name:'orange', hex:'#ffa94d' }, { name:'yellow', hex:'#ffd43b' },
      { name:'lime', hex:'#a9e34b' }, { name:'green', hex:'#51cf66' }, { name:'teal', hex:'#38d9a9' },
      { name:'cyan', hex:'#3bc9db' }, { name:'blue', hex:'#4dabf7' }, { name:'indigo', hex:'#748ffc' },
      { name:'violet', hex:'#b197fc' }, { name:'pink', hex:'#f783ac' }, { name:'white', hex:'#f8f9fa' },
      { name:'brown', hex:'#b08968' }, { name:'gray', hex:'#ced4da' }
    ],
    categories: [
      { id:'bricks', name:'Bricks', emoji:'🧱' }, { id:'plates', name:'Plates', emoji:'🟩' },
      { id:'shapes', name:'Roofs & Shapes', emoji:'🔺' }, { id:'doors', name:'Windows & Doors', emoji:'🪟' },
      { id:'motion', name:'Wheels & Motion', emoji:'⚙️' }, { id:'animals', name:'Animal Friends', emoji:'🦁' },
      { id:'nature', name:'Nature', emoji:'🌸' }, { id:'faces', name:'Funny Faces', emoji:'😊' },
      { id:'special', name:'Special', emoji:'✨' }
    ],
    blocks: {}
  };
  MB.CATALOG = CATALOG;
  function reg(def){ CATALOG.blocks[def.id] = def; }

  // ======================================================================
  // BRICKS + PLATES (share a simple box-brick builder)
  // ======================================================================
  function simpleBrick(id,name,w,h,d,color,cat,emoji){
    reg({
      id:id, name:name, emoji: emoji||'🧱', category: cat||'bricks', defaultColor: color,
      size: { w:w, h:h, d:d }, studs: gridPoints(w,d,h), sockets: gridPoints(w,d,0),
      build: function(c){
        var g = new THREE.Group(), m = material(c);
        g.add(P(mk(boxG(w,h,d),m), 0, h/2, 0));
        addStuds(g, this.studs, m);
        return g;
      }
    });
  }
  simpleBrick('brick_1x1','Brick 1x1',1,1.2,1,'#ff6b6b');
  simpleBrick('brick_2x1','Brick 2x1',2,1.2,1,'#ffa94d');
  simpleBrick('brick_2x2','Brick 2x2',2,1.2,2,'#ffd43b');
  simpleBrick('brick_4x2','Brick 4x2',4,1.2,2,'#51cf66');
  simpleBrick('brick_6x2','Brick 6x2',6,1.2,2,'#4dabf7');
  simpleBrick('beam_8x1','Beam 8x1',8,1.2,1,'#b197fc');

  simpleBrick('plate_2x4','Plate 2x4',2,0.4,4,'#3bc9db','plates','🟩');
  simpleBrick('plate_4x4','Plate 4x4',4,0.4,4,'#38d9a9','plates','🟩');
  simpleBrick('base_8x8','Baseplate 8x8',8,0.4,8,'#a9e34b','plates','🟩');

  // ======================================================================
  // SHAPES (roofs, curves, fence)
  // ======================================================================
  reg({
    id:'slope_2x1', name:'Slope 2x1', emoji:'🔺', category:'shapes', defaultColor:'#ff6b6b',
    size:{ w:2,h:1.2,d:1 }, studs:[{x:-0.5,y:1.2,z:0}], sockets: gridPoints(2,1,0),
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(mk(wedgeGeom(2,1.2,1), m));
      addStuds(g, this.studs, m);
      return g;
    }
  });
  reg({
    id:'slope_2x2', name:'Slope 2x2', emoji:'🔺', category:'shapes', defaultColor:'#ffa94d',
    size:{ w:2,h:1.2,d:2 }, studs:[{x:-0.5,y:1.2,z:-0.5},{x:-0.5,y:1.2,z:0.5}], sockets: gridPoints(2,2,0),
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(mk(wedgeGeom(2,1.2,2), m));
      addStuds(g, this.studs, m);
      return g;
    }
  });
  reg({
    id:'arch_4x1', name:'Arch 4x1', emoji:'🔺', category:'shapes', defaultColor:'#4dabf7',
    size:{ w:4,h:1.2,d:1 }, studs: gridPoints(4,1,1.2), sockets:[{x:-1.5,y:0,z:0},{x:1.5,y:0,z:0}],
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(mk(archGeom(4,1.2,1), m));
      addStuds(g, this.studs, m);
      return g;
    }
  });
  reg({
    id:'cylinder_1x1', name:'Cylinder', emoji:'🔺', category:'shapes', defaultColor:'#38d9a9',
    size:{ w:1,h:1.2,d:1 }, studs: gridPoints(1,1,1.2), sockets: gridPoints(1,1,0),
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(cylG(0.5,0.5,1.2,20), m), 0,0.6,0));
      addStuds(g, this.studs, m);
      return g;
    }
  });
  reg({
    id:'cone_1x1', name:'Cone', emoji:'🔺', category:'shapes', defaultColor:'#f783ac',
    size:{ w:1,h:1.2,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true, smoothTop:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(coneG(0.5,1.2,20), m), 0,0.6,0));
      return g;
    }
  });
  reg({
    id:'dome_2x2', name:'Dome', emoji:'🔺', category:'shapes', defaultColor:'#748ffc',
    size:{ w:2,h:1,d:2 }, studs:[], sockets: gridPoints(2,2,0), deco:true, smoothTop:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(mk(hsphG(1,20,12), m));
      return g;
    }
  });
  reg({
    id:'fence_4x1', name:'Picket Fence', emoji:'🔺', category:'shapes', defaultColor:'#f8f9fa',
    size:{ w:4,h:1.0,d:1 }, studs:[], sockets: gridPoints(4,1,0), deco:true, smoothTop:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(boxG(4,0.15,0.12), m), 0,0.55,0.3));
      g.add(P(mk(boxG(4,0.15,0.12), m), 0,0.2,0.3));
      for (var i=0;i<5;i++){ g.add(P(mk(boxG(0.16,1.0,0.16), m), -2+i, 0.5, 0.3)); }
      return g;
    }
  });

  // ======================================================================
  // DOORS (windows + doors)
  // ======================================================================
  reg({
    id:'window_2x2', name:'Window', emoji:'🪟', category:'doors', defaultColor:'#f8f9fa',
    size:{ w:2,h:2.4,d:1 }, studs: gridPoints(2,1,2.4), sockets: gridPoints(2,1,0),
    hinges:[{ node:'shutterL', axis:'y', open:-1.8, closed:0 }, { node:'shutterR', axis:'y', open:1.8, closed:0 }],
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(mk(frameGeom(2,2.4,1,1.5,0.3,2.1), m));
      var glass = mk(boxG(1.5,1.8,0.06), material('#bde0fe',{ transparent:true, opacity:0.5, roughness:0.1 }), true);
      P(glass,0,1.2,0); g.add(glass);
      var shutterL = new THREE.Group(); shutterL.name = 'shutterL'; shutterL.position.set(-0.75,1.2,0.45);
      shutterL.add(P(mk(boxG(0.75,1.8,0.08), m), 0.375,0,0)); g.add(shutterL);
      var shutterR = new THREE.Group(); shutterR.name = 'shutterR'; shutterR.position.set(0.75,1.2,0.45);
      shutterR.add(P(mk(boxG(0.75,1.8,0.08), m), -0.375,0,0)); g.add(shutterR);
      addStuds(g, this.studs, m);
      return g;
    }
  });
  reg({
    id:'door_2x3', name:'Door', emoji:'🪟', category:'doors', defaultColor:'#b08968',
    size:{ w:2,h:3.6,d:1 }, studs: gridPoints(2,1,3.6), sockets: gridPoints(2,1,0),
    hinges:[{ node:'door', axis:'y', open:-1.9, closed:0 }],
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(mk(frameGeom(2,3.6,1,1.6,0.05,3.3), m));
      var door = new THREE.Group(); door.name = 'door'; door.position.set(-0.8,0.05,0.45);
      door.add(P(mk(boxG(1.6,3.25,0.08), m), 0.8,1.625,0));
      door.add(P(mk(sphG(0.08,10,8), material('#ffd43b',{ metalness:0.5, roughness:0.3 })), 1.45,1.8,0.08));
      g.add(door);
      addStuds(g, this.studs, m);
      return g;
    }
  });

  // ======================================================================
  // MOTION (wheels, fan, propeller, steering)
  // ======================================================================
  reg({
    id:'wheel_pair', name:'Wheels', emoji:'⚙️', category:'motion', defaultColor:'#495057',
    size:{ w:2,h:1.2,d:1 }, studs: gridPoints(2,1,1.2), sockets: gridPoints(2,1,0),
    spin:{ node:'wheels', axis:'z', speed:10, mode:'drive' },
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(boxG(1.4,0.7,0.8), m), 0,0.75,0));
      var wheels = new THREE.Group(); wheels.name = 'wheels';
      var tireM = material('#212529',{ roughness:0.6 }), hubM = material('#ced4da',{ metalness:0.3, roughness:0.3 });
      [-0.6,0.6].forEach(function(z){
        wheels.add(P(mk(torG(0.75,0.22,10,18), tireM), 0,0.45,z));
        var hub = mk(cylG(0.3,0.3,0.24,16), hubM); hub.rotation.x = Math.PI/2; P(hub,0,0.45,z); wheels.add(hub);
      });
      g.add(wheels);
      addStuds(g, this.studs, m);
      return g;
    }
  });
  reg({
    id:'wheel_big', name:'Big Wheel', emoji:'⚙️', category:'motion', defaultColor:'#495057',
    size:{ w:1,h:1.5,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    spin:{ node:'wheel', axis:'z', speed:8, mode:'drive' },
    build: function(color){
      var g = new THREE.Group();
      var wheel = new THREE.Group(); wheel.name = 'wheel';
      wheel.add(mk(torG(0.7,0.3,10,20), material('#212529',{ roughness:0.6 })));
      var hub = mk(cylG(0.35,0.35,0.3,16), material(color,{ metalness:0.3 })); hub.rotation.x = Math.PI/2; wheel.add(hub);
      wheel.position.set(0,0.75,0);
      g.add(wheel);
      return g;
    }
  });
  reg({
    id:'fan_2x2', name:'Fan', emoji:'⚙️', category:'motion', defaultColor:'#3bc9db',
    size:{ w:2,h:1.2,d:2 }, studs:[], sockets: gridPoints(2,2,0), deco:true,
    spin:{ node:'rotor', axis:'x', speed:9, mode:'spin' },
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(boxG(2,0.5,2), m), 0,0.25,0));
      g.add(P(mk(cylG(0.15,0.15,0.9,12), m), 0,0.95,0));
      var rotor = new THREE.Group(); rotor.name = 'rotor'; rotor.position.set(0.5,1.4,0);
      var bladeM = material('#f8f9fa',{ roughness:0.3 }), bladeGeom = boxG(0.06,0.7,0.16);
      for (var i=0;i<4;i++){
        var blade = mk(bladeGeom, bladeM); P(blade,0,0.35,0);
        var holder = new THREE.Group(); holder.rotation.x = i*Math.PI/2; holder.add(blade);
        rotor.add(holder);
      }
      rotor.add(mk(sphG(0.16,12,10), m));
      g.add(rotor);
      return g;
    }
  });
  reg({
    id:'propeller_1x1', name:'Propeller', emoji:'⚙️', category:'motion', defaultColor:'#ffa94d',
    size:{ w:1,h:1.2,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    spin:{ node:'rotor', axis:'x', speed:14, mode:'spin' },
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(boxG(1,1.2,1), m), 0,0.6,0));
      var rotor = new THREE.Group(); rotor.name = 'rotor'; rotor.position.set(0.55,0.9,0);
      var bladeM = material('#495057',{ roughness:0.4 }), bladeGeom = boxG(0.04,0.5,0.12);
      for (var i=0;i<3;i++){
        var blade = mk(bladeGeom, bladeM); P(blade,0,0.25,0);
        var holder = new THREE.Group(); holder.rotation.x = i*(Math.PI*2/3); holder.add(blade);
        rotor.add(holder);
      }
      rotor.add(mk(sphG(0.13,10,8), material('#ffd43b',{ metalness:0.4 })));
      g.add(rotor);
      return g;
    }
  });
  reg({
    id:'steering_1x1', name:'Steering Wheel', emoji:'⚙️', category:'motion', defaultColor:'#495057',
    size:{ w:1,h:1,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(cylG(0.3,0.35,0.5,16), m), 0,0.25,0));
      var col = mk(cylG(0.08,0.1,0.4,10), m); col.rotation.x = 0.5; P(col,0,0.6,0); g.add(col);
      var wheelGrp = new THREE.Group(); wheelGrp.position.set(0,0.85,0.15); wheelGrp.rotation.x = 0.5;
      wheelGrp.add(mk(torG(0.35,0.06,8,20), material('#212529',{ roughness:0.5 })));
      for (var i=0;i<3;i++){
        var spoke = mk(boxG(0.5,0.05,0.05), material('#ced4da',{ metalness:0.3 }));
        spoke.rotation.z = i*Math.PI*2/3;
        wheelGrp.add(spoke);
      }
      g.add(wheelGrp);
      return g;
    }
  });

  // ======================================================================
  // ANIMAL FRIENDS (all deco, sockets only, chunky low-poly)
  // ======================================================================
  reg({
    id:'butterfly', name:'Butterfly', emoji:'🦋', category:'animals', defaultColor:'#f783ac',
    size:{ w:2,h:1.4,d:2 }, studs:[], sockets:[{x:0,y:0,z:0}], deco:true,
    spin:{ node:'flapL', axis:'x', speed:6, mode:'flap' },
    build: function(color){
      var g = new THREE.Group();
      var bodyM = material('#495057',{ roughness:0.4 });
      var body = mk(sphG(0.16,12,10), bodyM); body.scale.set(1,1.6,1); P(body,0,0.55,0); g.add(body);
      g.add(P(mk(sphG(0.1,10,8), bodyM), 0,0.85,0));
      var wingM = material(color,{ roughness:0.3 });
      function wing(name,dir){
        var w = new THREE.Group(); w.name = name; w.position.set(0,0.7,0);
        var top = mk(sphG(0.32,12,10), wingM); top.scale.set(1,0.7,0.15); P(top,0,0.12,dir*0.32); w.add(top);
        var bot = mk(sphG(0.22,10,8), wingM); bot.scale.set(0.8,0.6,0.15); P(bot,0,-0.1,dir*0.22); w.add(bot);
        return w;
      }
      g.add(wing('flapL',1));
      g.add(wing('flapR',-1));
      return g;
    }
  });
  reg({
    id:'lion', name:'Lion', emoji:'🦁', category:'animals', defaultColor:'#ffa94d',
    size:{ w:2,h:2,d:2 }, studs:[], sockets: gridPoints(2,2,0), deco:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color), maneM = material('#e8590c',{ roughness:0.5 });
      var body = mk(sphG(0.55,14,10), m); body.scale.set(1,0.8,1); P(body,0,0.65,0); g.add(body);
      g.add(P(mk(torG(0.45,0.22,8,20), maneM), 0,1.05,0));
      g.add(P(mk(sphG(0.4,14,10), m), 0,1.05,0));
      g.add(P(mk(sphG(0.16,10,8), material('#fff3bf')), 0,0.95,0.35));
      eyes(g, material(BLACK), 0,1.15,0.28,0.14,0.05);
      g.add(P(mk(sphG(0.06,8,6), material(BLACK), true), 0,1.0,0.5));
      for (var i=0;i<4;i++){ g.add(P(mk(boxG(0.18,0.4,0.18), m), (i%2===0?-0.3:0.3), 0.2, (i<2?-0.3:0.3))); }
      var tail = mk(cylG(0.05,0.05,0.5,8), m); tail.rotation.z = 1.2; P(tail,-0.55,0.7,-0.4); g.add(tail);
      g.add(P(mk(sphG(0.09,8,6), maneM), -0.85,0.9,-0.4));
      return g;
    }
  });
  reg({
    id:'cat', name:'Cat', emoji:'🦁', category:'animals', defaultColor:'#ced4da',
    size:{ w:1,h:1.4,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      var body = mk(sphG(0.32,12,10), m); body.scale.set(1,1.1,1); P(body,0,0.5,0); g.add(body);
      g.add(P(mk(sphG(0.26,12,10), m), 0,0.95,0.05));
      var earL = mk(coneG(0.09,0.16,8), m); earL.rotation.z = -0.3; P(earL,-0.15,1.18,0); g.add(earL);
      var earR = mk(coneG(0.09,0.16,8), m); earR.rotation.z = 0.3; P(earR,0.15,1.18,0); g.add(earR);
      eyes(g, material(BLACK), 0,0.97,0.28,0.09,0.035);
      g.add(P(mk(sphG(0.035,6,6), material('#f783ac'), true), 0,0.9,0.3));
      var tail = mk(cylG(0.04,0.06,0.5,8), m); tail.rotation.z = -0.6; P(tail,0.28,0.55,-0.28); g.add(tail);
      return g;
    }
  });
  reg({
    id:'duck', name:'Duck', emoji:'🦁', category:'animals', defaultColor:'#ffd43b',
    size:{ w:1,h:1.2,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      var body = mk(sphG(0.3,12,10), m); body.scale.set(1,0.9,1.2); P(body,0,0.35,0); g.add(body);
      g.add(P(mk(sphG(0.2,12,10), m), 0,0.75,0.15));
      var beak = mk(coneG(0.09,0.2,8), material('#ff922b')); beak.rotation.x = Math.PI/2; P(beak,0,0.72,0.38); g.add(beak);
      eyes(g, material(BLACK), 0,0.8,0.32,0.09,0.03);
      return g;
    }
  });
  reg({
    id:'bird', name:'Bluebird', emoji:'🦁', category:'animals', defaultColor:'#4dabf7',
    size:{ w:1,h:1.2,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(sphG(0.26,12,10), m), 0,0.4,0));
      g.add(P(mk(sphG(0.18,10,8), m), 0,0.68,0.12));
      var beak = mk(coneG(0.06,0.15,6), material('#ffa94d')); beak.rotation.x = Math.PI/2; P(beak,0,0.67,0.3); g.add(beak);
      eyes(g, material(BLACK), 0,0.72,0.26,0.08,0.028);
      var wing = mk(sphG(0.14,8,6), material('#3bc9db')); wing.scale.set(0.6,1,0.3); P(wing,0.22,0.42,0); g.add(wing);
      return g;
    }
  });
  reg({
    id:'bunny', name:'Bunny', emoji:'🦁', category:'animals', defaultColor:'#f8f9fa',
    size:{ w:1,h:1.5,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color);
      g.add(P(mk(sphG(0.3,12,10), m), 0,0.35,0));
      g.add(P(mk(sphG(0.24,12,10), m), 0,0.72,0.05));
      function ear(dx){ var e = mk(cylG(0.06,0.08,0.5,8), m); e.rotation.z = dx*0.15; P(e,dx*0.1,1.15,0); return e; }
      g.add(ear(-1)); g.add(ear(1));
      eyes(g, material(BLACK), 0,0.75,0.24,0.08,0.03);
      g.add(P(mk(sphG(0.08,8,6), material('#f8f9fa')), 0,0.4,-0.28));
      g.add(P(mk(sphG(0.035,6,6), material('#f783ac'), true), 0,0.7,0.27));
      return g;
    }
  });

  // ======================================================================
  // NATURE (deco)
  // ======================================================================
  reg({
    id:'flower', name:'Flower', emoji:'🌸', category:'nature', defaultColor:'#f783ac',
    size:{ w:1,h:1.4,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    build: function(color){
      var g = new THREE.Group();
      var stemM = material('#51cf66');
      g.add(P(mk(cylG(0.05,0.06,0.9,8), stemM), 0,0.45,0));
      var leaf = mk(sphG(0.12,8,6), stemM); leaf.scale.set(1.6,0.3,1); P(leaf,0.12,0.35,0); g.add(leaf);
      var petalM = material(color), cy = 1.05;
      for (var i=0;i<6;i++){
        var ang = i*Math.PI/3;
        var petal = mk(sphG(0.15,10,8), petalM); petal.scale.set(1,0.6,0.6);
        P(petal, Math.cos(ang)*0.16, cy, Math.sin(ang)*0.16); g.add(petal);
      }
      g.add(P(mk(sphG(0.12,10,8), material('#ffd43b')), 0,cy,0));
      return g;
    }
  });
  reg({
    id:'tree_small', name:'Tree', emoji:'🌸', category:'nature', defaultColor:'#51cf66',
    size:{ w:2,h:2.6,d:2 }, studs:[], sockets: gridPoints(2,2,0), deco:true,
    build: function(color){
      var g = new THREE.Group();
      var trunkM = material('#b08968');
      g.add(P(mk(cylG(0.2,0.28,1.2,10), trunkM), 0,0.6,0));
      var foliageM = material(color);
      g.add(P(mk(coneG(0.9,1.1,14), foliageM), 0,1.75,0));
      g.add(P(mk(coneG(0.65,0.9,14), foliageM), 0,2.2,0));
      g.add(P(mk(sphG(0.16,10,8), material('#ffd43b')), 0,2.75,0));
      return g;
    }
  });
  reg({
    id:'cloud_puff', name:'Cloud', emoji:'🌸', category:'nature', defaultColor:'#f8f9fa',
    size:{ w:2,h:1,d:2 }, studs:[], sockets: gridPoints(2,2,0), deco:true, smoothTop:true,
    build: function(color){
      var g = new THREE.Group(), m = material(color,{ roughness:0.6 });
      g.add(P(mk(sphG(0.55,14,10), m), 0,0.45,0));
      g.add(P(mk(sphG(0.4,12,10), m), -0.5,0.35,0.1));
      g.add(P(mk(sphG(0.42,12,10), m), 0.5,0.38,-0.1));
      return g;
    }
  });

  // ======================================================================
  // FUNNY FACES (canvas-textured smiley tiles)
  // ======================================================================
  function faceTile(id,kind,label){
    reg({
      id:id, name: label, emoji:'😊', category:'faces', defaultColor:'#ffd43b',
      size:{ w:1,h:0.4,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true, smoothTop:true,
      build: function(color){
        var g = new THREE.Group();
        g.add(P(mk(boxG(1,0.4,1), material(color)), 0,0.2,0));
        g.add(P(mk(boxG(0.98,0.06,0.98), faceTopMat(kind)), 0,0.43,0));
        return g;
      }
    });
  }
  faceTile('smiley_happy','happy','Happy Face');
  faceTile('smiley_silly','silly','Silly Face');
  faceTile('smiley_heart','heart','Heart-Eyes Face');
  faceTile('smiley_star','star','Star-Eyes Face');

  // ======================================================================
  // SPECIAL
  // ======================================================================
  reg({
    id:'light_round', name:'Round Light', emoji:'✨', category:'special', defaultColor:'#ffd43b',
    size:{ w:1,h:1.2,d:1 }, studs: gridPoints(1,1,1.2), sockets: gridPoints(1,1,0), emissiveGlow:true,
    build: function(color){
      var g = new THREE.Group();
      var baseM = material('#495057');
      g.add(P(mk(cylG(0.35,0.4,0.3,16), baseM), 0,0.15,0));
      var bulbM = material(color,{ emissive:color, emissiveIntensity:0.9, roughness:0.2 });
      g.add(P(mk(sphG(0.4,16,12), bulbM, true), 0,0.75,0));
      g.add(P(mk(cylG(0.15,0.15,0.1,12), baseM), 0,1.15,0));
      addStuds(g, this.studs, material(color));
      return g;
    }
  });
  reg({
    id:'crown_2x2', name:'Crown', emoji:'✨', category:'special', defaultColor:'#ffd43b',
    size:{ w:2,h:1,d:2 }, studs:[], sockets: gridPoints(2,2,0), deco:true,
    build: function(color){
      var g = new THREE.Group();
      var m = material(color,{ metalness:0.6, roughness:0.25 });
      g.add(P(mk(cylG(0.75,0.85,0.35,16), m), 0,0.35,0));
      for (var i=0;i<5;i++){
        var ang = i*Math.PI*2/5;
        g.add(P(mk(coneG(0.16,0.45,8), m), Math.cos(ang)*0.75, 0.75, Math.sin(ang)*0.75));
        g.add(P(mk(sphG(0.07,8,6), material('#ff6b6b',{ roughness:0.2 })), Math.cos(ang)*0.75, 0.55, Math.sin(ang)*0.75));
      }
      return g;
    }
  });
  reg({
    id:'star_1x1', name:'Star', emoji:'✨', category:'special', defaultColor:'#ffd43b',
    size:{ w:1,h:1.2,d:1 }, studs:[], sockets: gridPoints(1,1,0), deco:true,
    build: function(color){
      var g = new THREE.Group();
      g.add(mk(starGeom(0.55,1.2), material(color,{ metalness:0.5, roughness:0.25 })));
      return g;
    }
  });
  reg({
    id:'rainbow_arch', name:'Rainbow Arch', emoji:'✨', category:'special', defaultColor:'#ff6b6b',
    size:{ w:4,h:2,d:1 }, studs:[], sockets:[{x:-1.5,y:0,z:0},{x:1.5,y:0,z:0}], deco:true, smoothTop:true,
    build: function(){
      var g = new THREE.Group();
      var bandColors = ['#ff6b6b','#ffd43b','#51cf66','#4dabf7'];
      for (var i=0;i<4;i++){
        var r = 1.5 - i*0.22;
        g.add(P(mk(torG(r,0.1,8,24,Math.PI), material(bandColors[i],{ roughness:0.4 })), 0,0.1,0));
      }
      return g;
    }
  });

  console.log('[MB] catalog', Object.keys(MB.CATALOG.blocks).length, 'blocks');
})();
