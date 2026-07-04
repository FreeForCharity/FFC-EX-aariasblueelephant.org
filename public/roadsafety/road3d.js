/* ============================================================
   ROAD SAFETY HEROES — real-3D renderer (three.js)
   The simulation stays untouched in game.js; this file only gives it a body:
   a true extruded road over the real OSM street geometry, 3D world & vehicles.
   game.js calls: GL3D.active() · GL3D.build(li) · GL3D.render() · GL3D.resize()
   All game symbols (S, cam, ROUTES, …) are read lazily at call time.
   ============================================================ */
window.GL3D = (function(){
  const T = window.THREE;
  let ok = false, renderer = null, scene, camera, hemi, sunL;
  const M = 1/6;                      // px → meters (PXM = 6)
  let grpStatic = null, grpDyn = null, player = null;
  let P = {};                         // player parts: wheels[], brake[], group…
  let evObjs = [];                    // per-event dynamic hooks
  let ambObj = null, kidObjs = [], coneObjs = [];
  let builtLevel = -1;

  /* ---------- boot ---------- */
  try {
    const cnv = document.getElementById("gl");
    renderer = new T.WebGLRenderer({ canvas: cnv, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(62, 1, .1, 900);
    hemi = new T.HemisphereLight(0xdfefff, 0x5d8a4a, .5); scene.add(hemi);
    sunL = new T.DirectionalLight(0xfff2d0, .95);
    sunL.castShadow = true;
    sunL.shadow.mapSize.set(2048, 2048);
    sunL.shadow.camera.near = 1; sunL.shadow.camera.far = 220;
    sunL.shadow.camera.left = -60; sunL.shadow.camera.right = 60;
    sunL.shadow.camera.top = 60; sunL.shadow.camera.bottom = -60;
    sunL.shadow.bias = -0.0004;
    scene.add(sunL); scene.add(sunL.target);
    ok = true;
  } catch(e){ ok = false; }

  const mat = (c, r) => new T.MeshLambertMaterial({ color: new T.Color(c) });
  const std = (c, rough) => new T.MeshStandardMaterial({ color: new T.Color(c), roughness: rough ?? .85, metalness: 0 });
  function em(c, i){ const m = std(c, .5); m.emissive = new T.Color(c); m.emissiveIntensity = i ?? .8; return m; }

  /* soft radial glow texture for lamp halos */
  const GLOWTEX = (function(){
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d");
    const rg = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(.4, "rgba(255,255,255,.45)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();

  /* route point in 3D meters: distance d (px) along route, lat (px) to the right */
  function rp(d, lat){
    const s = sample(S.rt, d);
    return new T.Vector3((s.x + s.rx * lat) * M, 0, (s.y + s.ry * lat) * M);
  }

  /* ---------- ROAD RIBBON (one vertex-colored mesh: asphalt + all paint) ---------- */
  function buildRoad(){
    const pos = [], col = [], idx = [];
    let vi = 0;
    const C = {};
    const V = (p, y, c) => { pos.push(p.x, y, p.z); col.push(c.r, c.g, c.b); return vi++; };
    const colOf = h => C[h] || (C[h] = new T.Color(h));
    /* quad strip helper: band from d0→d1 at [latA..latB] px, color, height */
    function band(d0, d1, latA, latB, hex, y, step){
      const c = colOf(hex); step = step || DS;
      let prevA = null, prevB = null;
      for (let d = d0; d <= d1 + .01; d += Math.min(step, d1 - d + .01) || step){
        const a = V(rp(d, latA), y, c), b = V(rp(d, latB), y, c);
        if (prevA !== null){ idx.push(prevA, prevB, a, prevB, b, a); }
        prevA = a; prevB = b;
        if (d >= d1) break;
      }
    }
    const HW = HWf();                                    // px half width
    band(0, S.rt.len, -HW - 4, HW + 4, "#565b63", 0);    // asphalt
    band(0, S.rt.len, -HW - 24, -HW - 3, "#8a9296", .005, DS * 2);  // sidewalks
    band(0, S.rt.len,  HW + 3,  HW + 24, "#8a9296", .005, DS * 2);
    // edge lines + rumble
    band(24, S.rt.len - 10, -HW + 2, -HW + 6, "#eef2f5", .02);
    band(24, S.rt.len - 10,  HW - 6,  HW - 2, "#eef2f5", .02);
    for (let d = 30; d < S.rt.len - 20; d += DS * 2){
      const red = Math.floor(d / (DS * 2)) % 2 === 0;
      band(d, Math.min(d + DS * 2, S.rt.len), -HW - 3, -HW + 1, red ? "#d64545" : "#f2f4f6", .015, DS);
      band(d, Math.min(d + DS * 2, S.rt.len),  HW - 1,  HW + 3, red ? "#d64545" : "#f2f4f6", .015, DS);
    }
    // dashed yellow lane dividers
    for (let l = 1; l < S.cfg.lanes; l++){
      const lat = -HW + l * LANE_W;
      for (let d = 40; d < S.rt.len - 30; d += DS * 2.4)
        band(d, d + DS, lat - 2, lat + 2, "#ffd23f", .02);
    }
    // zone tints + crosswalks + stop lines from the real events
    for (const ev of S.events){
      if (ev.type === "school")       band(ev.from, ev.to, -HW, HW, "#6f6b4e", .01);
      if (ev.type === "construction") band(ev.from, ev.to, -HW, HW, "#6e5c45", .01);
      if (ev.type === "festival")     band(ev.from, ev.to, -HW, HW, "#6e5a64", .01);
      const cw = ev.type === "kids" ? ev.at : ev.type === "festival" ? (ev.from + ev.to) / 2 : null;
      if (cw !== null)
        for (let m2 = -5; m2 < 5; m2++)
          band(cw - 14, cw + 14, m2 * HW / 5 + 3, m2 * HW / 5 + HW / 5 - 3, "#f2f4f6", .025);
      if (ev.type === "stopsign" || ev.type === "light")
        band(ev.at - 26, ev.at - 14, -HW + 6, HW - 6, "#f2f4f6", .025);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const mesh = new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true }));
    mesh.receiveShadow = true;
    grpStatic.add(mesh);
  }

  /* ---------- WORLD: ground, hills, trees, houses, lamps, turbines ---------- */
  function buildWorld(TH){
    // ground
    const g = new T.Mesh(new T.PlaneGeometry(2600, 2600), new T.MeshLambertMaterial({ color: new T.Color(TH.g1).multiplyScalar(.82) }));
    g.rotation.x = -Math.PI / 2; g.position.y = -.05; g.receiveShadow = true;
    const mid = rp(S.rt.len / 2, 0); g.position.x = mid.x; g.position.z = mid.z;
    grpStatic.add(g);
    // soft hills ring
    const hillM = new T.MeshLambertMaterial({ color: new T.Color(TH.g2).multiplyScalar(.75) });
    for (let i = 0; i < 14; i++){
      const a = i / 14 * Math.PI * 2;
      const h = new T.Mesh(new T.SphereGeometry(140 + hash(i) * 90, 24, 12), hillM);
      h.scale.y = .16 + hash(i + 3) * .1;
      h.position.set(mid.x + Math.cos(a) * (560 + hash(i + 7) * 160), -12, mid.z + Math.sin(a) * (560 + hash(i + 7) * 160));
      grpStatic.add(h);
    }
    // instanced trees & houses along the route
    const nT = Math.min(320, Math.floor(S.rt.len / 55));
    const trunk = new T.InstancedMesh(new T.CylinderGeometry(.16, .22, 1.6, 6), mat("#8a6136"), nT);
    const leaf  = new T.InstancedMesh(new T.SphereGeometry(1.5, 10, 8), mat("#4d9e4f"), nT);
    const leaf2 = new T.InstancedMesh(new T.SphereGeometry(1.05, 10, 8), mat("#5cb85e"), nT);
    trunk.castShadow = leaf.castShadow = true;
    const m4 = new T.Matrix4(), q0 = new T.Quaternion(), sc = new T.Vector3();
    for (let i = 0; i < nT; i++){
      const d = 60 + hash(i * 13.7) * (S.rt.len - 120);
      const side = hash(i * 7.1) > .5 ? 1 : -1;
      const lat = side * (HWf() + 40 + hash(i * 3.3) * 130);
      const p = rp(d, lat); const s = .7 + hash(i * 9.2) * .9;
      sc.set(s, s, s);
      m4.compose(new T.Vector3(p.x, .8 * s, p.z), q0, sc); trunk.setMatrixAt(i, m4);
      m4.compose(new T.Vector3(p.x, 2.3 * s, p.z), q0, sc); leaf.setMatrixAt(i, m4);
      m4.compose(new T.Vector3(p.x + .7 * s, 2.9 * s, p.z + .3), q0, sc); leaf2.setMatrixAt(i, m4);
    }
    grpStatic.add(trunk, leaf, leaf2);
    const HCOLS = ["#e8b17c", "#d98c7a", "#e6d29a", "#a9c8e8", "#c9a9e0"];
    const nH = Math.min(120, Math.floor(S.rt.len / 150));
    const bodies = HCOLS.map(c => new T.InstancedMesh(new T.BoxGeometry(6, 4, 5), mat(c), Math.ceil(nH / 5) + 1));
    const roofs  = new T.InstancedMesh(new T.ConeGeometry(4.6, 2.4, 4), mat("#8a5340"), nH);
    bodies.forEach(b => b.castShadow = true); roofs.castShadow = true;
    const cnt = [0, 0, 0, 0, 0];
    const qy = new T.Quaternion();
    for (let i = 0; i < nH; i++){
      const d = 100 + (i + .5) / nH * (S.rt.len - 200);
      const side = i % 2 ? 1 : -1;
      const lat = side * (HWf() + 62 + hash(i * 5.9) * 60);
      const p = rp(d, lat);
      const s2 = sample(S.rt, d);
      qy.setFromAxisAngle(new T.Vector3(0, 1, 0), -Math.atan2(s2.fy, s2.fx));
      const k = i % 5;
      m4.compose(new T.Vector3(p.x, 2, p.z), qy, sc.set(1, 1, 1)); bodies[k].setMatrixAt(cnt[k]++, m4);
      qy.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 4));
      m4.compose(new T.Vector3(p.x, 5.2, p.z), qy, sc.set(1, 1, 1)); roofs.setMatrixAt(i, m4);
    }
    bodies.forEach((b, k) => { b.count = cnt[k]; grpStatic.add(b); });
    grpStatic.add(roofs);
    // streetlights
    for (let d = 140; d < S.rt.len - 60; d += 560){
      const side = Math.floor(d / 560) % 2 ? 1 : -1;
      const p = rp(d, side * (HWf() + 12));
      const pole = new T.Mesh(new T.CylinderGeometry(.09, .12, 5.4, 6), mat("#5d6570"));
      pole.position.set(p.x, 2.7, p.z); pole.castShadow = true; grpStatic.add(pole);
      const bulb = new T.Mesh(new T.SphereGeometry(.24, 8, 6), em("#fff3c0", .6));
      bulb.position.set(p.x, 5.5, p.z); grpStatic.add(bulb);
    }
    // wind turbines on the hills (Tracy!)
    P.blades = [];
    for (let i = 0; i < 3; i++){
      const d = (i + .6) / 3.4 * S.rt.len;
      const p = rp(d, (i % 2 ? -1 : 1) * (HWf() + 340 + i * 60));
      const pole = new T.Mesh(new T.CylinderGeometry(.5, 1, 34, 8), mat("#eef1f4"));
      pole.position.set(p.x, 17, p.z); grpStatic.add(pole);
      const hub = new T.Group(); hub.position.set(p.x, 34, p.z);
      for (let b = 0; b < 3; b++){
        const bl = new T.Mesh(new T.BoxGeometry(.5, 11, .1), mat("#f4f7fa"));
        bl.position.y = 5.5;
        const arm = new T.Group(); arm.rotation.z = b * Math.PI * 2 / 3; arm.add(bl); hub.add(arm);
      }
      grpStatic.add(hub); P.blades.push(hub);
    }
    // finish arch
    const fin = rp(S.rt.len - 6, 0);
    const s2 = sample(S.rt, S.rt.len - 6);
    const arch = new T.Group();
    const px1 = new T.Mesh(new T.CylinderGeometry(.3, .3, 7, 8), mat("#22303f"));
    const px2 = px1.clone();
    px1.position.set(-HWf() * M - .6, 3.5, 0); px2.position.set(HWf() * M + .6, 3.5, 0);
    const ban = new T.Mesh(new T.BoxGeometry(HWf() * M * 2 + 1.2, 1.1, .3),
      new T.MeshLambertMaterial({ color: 0xffffff }));
    ban.position.y = 7;
    // checkered banner via canvas texture
    const cc = document.createElement("canvas"); cc.width = 128; cc.height = 16;
    const g2 = cc.getContext("2d");
    for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++){
      g2.fillStyle = (x + y) % 2 ? "#111" : "#fff"; g2.fillRect(x * 8, y * 8, 8, 8); }
    ban.material = new T.MeshBasicMaterial({ map: new T.CanvasTexture(cc) });
    arch.add(px1, px2, ban);
    arch.position.set(fin.x, 0, fin.z);
    arch.rotation.y = -Math.atan2(s2.fy, s2.fx) + Math.PI / 2;
    grpStatic.add(arch);
  }

  /* ---------- EVENT OBJECTS (lights, signs, cones, kids) ---------- */
  function buildEvents(){
    evObjs = []; kidObjs = []; coneObjs = [];
    for (const ev of S.events){
      if (ev.type === "light"){
        // US-style mast arm: pole at the right curb, arm reaching over the
        // road, signal head hanging above the lane and FACING the driver.
        const s2 = sample(S.rt, ev.at);
        const yaw = Math.atan2(s2.fx, s2.fy);
        const g = new T.Group();
        const armLen = (HWf() + 14) * M;                 // curb → over the lanes
        const pole = new T.Mesh(new T.CylinderGeometry(.14, .17, 7.2, 8), mat("#3c454f"));
        pole.position.set(armLen, 3.6, 0); pole.castShadow = true;
        const arm = new T.Mesh(new T.CylinderGeometry(.09, .09, armLen, 6), mat("#3c454f"));
        arm.rotation.z = Math.PI / 2; arm.position.set(armLen / 2, 6.9, 0);
        const box = new T.Mesh(new T.BoxGeometry(.95, 2.6, .5), mat("#1c232b"));
        box.position.set(0, 5.7, 0);
        g.add(pole, arm, box);
        // big BRIGHT lamps + a glow halo sprite so the phase reads from far away
        const LAMP = ["#ff3226", "#ffc400", "#2fe15d"];
        const balls = LAMP.map((c, i) => {
          const b = new T.Mesh(new T.SphereGeometry(.34, 12, 10), em(c, .15));
          b.position.set(0, 6.5 - i * .8, .3);
          const halo = new T.Sprite(new T.SpriteMaterial({
            map: GLOWTEX, color: new T.Color(c), transparent: true, opacity: 0, depthWrite: false }));
          halo.scale.set(2.6, 2.6, 1); halo.position.set(0, 6.5 - i * .8, .55);
          g.add(b, halo); b.userData.halo = halo; return b;
        });
        const pp = rp(ev.at, 0);
        g.position.set(pp.x, 0, pp.z);
        g.rotation.y = yaw + Math.PI;                    // face oncoming traffic
        grpDyn.add(g);
        evObjs.push({ ev, kind: "light", balls });
      }
      if (ev.type === "stopsign"){
        const s2 = sample(S.rt, ev.at - 18);
        const yaw = Math.atan2(s2.fx, s2.fy);
        const g = new T.Group();
        const pole = new T.Mesh(new T.CylinderGeometry(.06, .08, 2.6, 6), mat("#8a9296"));
        pole.position.y = 1.3;
        // canvas-textured STOP face (octagon + white text), double-sided
        const sc2 = document.createElement("canvas"); sc2.width = sc2.height = 128;
        const sg = sc2.getContext("2d");
        sg.fillStyle = "#d81f26";
        sg.beginPath();
        for (let k = 0; k < 8; k++){
          const a = Math.PI / 8 + k * Math.PI / 4;
          sg[k ? "lineTo" : "moveTo"](64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60);
        }
        sg.closePath(); sg.fill();
        sg.strokeStyle = "#fff"; sg.lineWidth = 6; sg.stroke();
        sg.fillStyle = "#fff"; sg.font = "bold 40px sans-serif";
        sg.textAlign = "center"; sg.textBaseline = "middle"; sg.fillText("STOP", 64, 66);
        const face = new T.Mesh(new T.PlaneGeometry(1.35, 1.35),
          new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc2), transparent: true, side: T.DoubleSide }));
        face.position.y = 2.9;
        g.add(pole, face);
        const pp = rp(ev.at - 18, HWf() + 9);
        g.position.set(pp.x, 0, pp.z);
        g.rotation.y = yaw + Math.PI;
        grpStatic.add(g);
      }
      if (ev.type === "construction"){
        for (const c of ev.cones){
          const p = rp(c.w, c.jitter * 2);
          const cone = new T.Group();
          const k = new T.Mesh(new T.ConeGeometry(.32, .85, 10), em("#ff7f2a", .3));
          k.position.y = .45;
          const band2 = new T.Mesh(new T.CylinderGeometry(.24, .28, .16, 10), mat("#ffffff"));
          band2.position.y = .5;
          cone.add(k, band2); cone.position.set(p.x, 0, p.z);
          cone.castShadow = true; grpDyn.add(cone);
          coneObjs.push({ c, obj: cone });
        }
        // work sign + digger blob
        const p2 = rp(ev.from - 40, HWf() + 9);
        const sign = new T.Mesh(new T.BoxGeometry(1.4, 1.4, .1), em("#ffa14a", .3));
        sign.rotation.z = Math.PI / 4; sign.position.set(p2.x, 1.6, p2.z); grpStatic.add(sign);
      }
      if (ev.type === "kids" || ev.type === "festival"){
        const cw = ev.type === "kids" ? ev.at : (ev.from + ev.to) / 2;
        const kids = [];
        const cols = ["#e05a7a", "#4a90d9", "#58b368"];
        for (let i = 0; i < (ev.count || 2); i++){
          const kg = new T.Group();
          const body = new T.Mesh(T.CapsuleGeometry ? new T.CapsuleGeometry(.22, .5, 3, 8) : new T.CylinderGeometry(.22, .22, .8, 8), mat(cols[i % 3]));
          body.position.y = .75;
          const head = new T.Mesh(new T.SphereGeometry(.22, 10, 8), mat("#ffd9b0"));
          head.position.y = 1.35;
          kg.add(body, head); kg.castShadow = true;
          grpDyn.add(kg); kids.push(kg);
        }
        kidObjs.push({ ev, cw, kids });
      }
    }
    // ambulance (one reusable object, shown when S.amb exists)
    const A = new T.Group();
    const van = new T.Mesh(new T.BoxGeometry(2.2, 1.9, 4.6), mat("#f4f7fa")); van.position.y = 1.3; van.castShadow = true;
    const stripe = new T.Mesh(new T.BoxGeometry(2.24, .4, 4.6), mat("#d62828")); stripe.position.y = 1.1;
    const barR = new T.Mesh(new T.BoxGeometry(.5, .25, .5), em("#ff3b30", 1)); barR.position.set(-.5, 2.4, .8);
    const barB = new T.Mesh(new T.BoxGeometry(.5, .25, .5), em("#3b7bff", 1)); barB.position.set(.5, 2.4, .8);
    A.add(van, stripe, barR, barB);
    for (const wz of [-1.4, 1.4]) for (const wx of [-1, 1]){
      const w = new T.Mesh(new T.CylinderGeometry(.42, .42, .3, 10), mat("#1d2126"));
      w.rotation.z = Math.PI / 2; w.position.set(wx * 1.05, .42, wz); A.add(w);
    }
    A.visible = false; grpDyn.add(A);
    ambObj = { grp: A, r: barR, b: barB };
  }

  /* ---------- PLAYER VEHICLES (procedural 3D) ---------- */
  function wheel(r, w){ const m = new T.Mesh(new T.CylinderGeometry(r, r, w, 14), mat("#1d2126"));
    m.rotation.z = Math.PI / 2; m.castShadow = true;
    const hub = new T.Mesh(new T.CylinderGeometry(r * .45, r * .45, w + .02, 8), mat("#8f9aa5"));
    hub.rotation.z = Math.PI / 2; m.add(hub); return m; }
  function rider(jkt, helm){
    const g = new T.Group();
    const torso = new T.Mesh(new T.BoxGeometry(.5, .62, .32), mat(jkt)); torso.position.y = 1.18; torso.castShadow = true;
    const head = new T.Mesh(new T.SphereGeometry(.21, 12, 10), mat("#ffd9b0")); head.position.y = 1.72;
    const hel = new T.Mesh(new T.SphereGeometry(.24, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(helm));
    hel.position.y = 1.74;
    g.add(torso, head, hel);
    return g;
  }
  function buildPlayer(){
    if (player){ grpDyn.remove(player); }
    player = new T.Group(); P.wheels = []; P.brake = []; P.pedals = null; P.riderG = null;
    const id = S.veh.id;
    if (id === "ev" || id === "car" || id === "monster"){
      const col = id === "ev" ? "#21b58c" : id === "car" ? "#3f6cf0" : "#8b39d6";
      const big = id === "monster";
      const wr = big ? .78 : .42, lift = big ? .55 : 0;
      const body = new T.Mesh(new T.BoxGeometry(1.9, .62, 3.6), std(col, .4));
      body.position.y = .72 + lift; body.castShadow = true;
      const cab = new T.Mesh(new T.BoxGeometry(1.7, .55, 1.9), std(col, .4));
      cab.position.set(0, 1.25 + lift, -.2); cab.castShadow = true;
      const glass = new T.Mesh(new T.BoxGeometry(1.55, .4, 1.95), std("#9fc8e8", .15));
      glass.position.set(0, 1.28 + lift, -.2);
      player.add(body, cab, glass);
      for (const z of [-1.25, 1.25]) for (const x of [-.95, .95]){
        const w = wheel(wr, .34); w.position.set(x, wr, z); player.add(w); P.wheels.push(w);
      }
      for (const x of [-.6, .6]){
        const tl = new T.Mesh(new T.BoxGeometry(.4, .18, .06), em("#b32a26", .3));
        tl.position.set(x, .82 + lift, 1.82); player.add(tl); P.brake.push(tl);
      }
      if (id === "ev"){ const bolt = new T.Mesh(new T.BoxGeometry(.3, .06, .5), em("#7ae582", .8));
        bolt.position.set(0, 1.56 + lift, -.2); player.add(bolt); }
    } else if (id === "scooter"){
      const deck = new T.Mesh(new T.BoxGeometry(.34, .08, 1.1), std("#9b5de5", .5)); deck.position.y = .18;
      const stem = new T.Mesh(new T.CylinderGeometry(.04, .045, 1.15, 8), mat("#7b3fd0"));
      stem.position.set(0, .8, -.52); stem.rotation.x = .12;
      const bars = new T.Mesh(new T.CylinderGeometry(.035, .035, .6, 8), mat("#333"));
      bars.rotation.z = Math.PI / 2; bars.position.set(0, 1.36, -.6);
      const w1 = wheel(.14, .1); w1.position.set(0, .14, -.5);
      const w2 = wheel(.14, .1); w2.position.set(0, .14, .5);
      const kid = rider("#43a5a0", "#e63946"); kid.scale.setScalar(.92); kid.position.y = .2;
      const pack = new T.Mesh(new T.BoxGeometry(.36, .44, .16), mat("#ff8fa3")); pack.position.set(0, 1.28, .26);
      player.add(deck, stem, bars, w1, w2, kid, pack);
      P.wheels.push(w1, w2);
    } else {
      const isE = id === "ebike";
      const frame = new T.Mesh(new T.BoxGeometry(isE ? .22 : .09, isE ? .34 : .5, isE ? 1.3 : 1.15),
        std(isE ? "#f3722c" : "#e63946", .5));
      frame.position.y = isE ? .55 : .62; frame.rotation.x = isE ? .15 : .5; frame.castShadow = true;
      const wr2 = isE ? .42 : .34, ww = isE ? .16 : .07;
      const w1 = wheel(wr2, ww); w1.position.set(0, wr2, -.66);
      const w2 = wheel(wr2, ww); w2.position.set(0, wr2, .66);
      const bars = new T.Mesh(new T.CylinderGeometry(.03, .03, .52, 8), mat("#333"));
      bars.rotation.z = Math.PI / 2; bars.position.set(0, 1.05, -.55);
      const kid = rider(isE ? "#f8961e" : "#3a6ea5", isE ? "#f4f6f8" : "#ffd23f");
      kid.position.set(0, .28, .12); kid.rotation.x = .18;
      player.add(frame, w1, w2, bars, kid);
      P.wheels.push(w1, w2);
      if (isE){
        // chunky e-bike: BIG glowing battery, rear rack + orange panniers,
        // hi-vis stripes on the rider, and a headlight beam on the road
        const bat = new T.Mesh(new T.BoxGeometry(.2, .44, .6), std("#1d2a22", .5)); bat.position.y = .7;
        const led = new T.Mesh(new T.BoxGeometry(.22, .14, .5), em("#54f08a", 1.4)); led.position.y = .95;
        const rack = new T.Mesh(new T.BoxGeometry(.5, .05, .5), mat("#23262b")); rack.position.set(0, .82, .55);
        const pan1 = new T.Mesh(new T.BoxGeometry(.18, .34, .42), std("#f3722c", .6)); pan1.position.set(-.3, .6, .55);
        const pan2 = pan1.clone(); pan2.position.x = .3;
        const stripe1 = new T.Mesh(new T.BoxGeometry(.52, .07, .34), em("#f4f6f8", .7)); stripe1.position.set(0, 1.28, .12);
        const lamp = new T.Mesh(new T.SphereGeometry(.09, 8, 6), em("#fff6c8", 2)); lamp.position.set(0, .95, -.72);
        const beam = new T.Mesh(new T.CircleGeometry(.9, 20),
          new T.MeshBasicMaterial({ color: 0xfff3b8, transparent: true, opacity: .3 }));
        beam.rotation.x = -Math.PI / 2; beam.position.set(0, .02, -2.4); beam.scale.z = 2.2;
        player.add(bat, led, rack, pan1, pan2, stripe1, lamp, beam);
      } else {
        const pl = new T.Mesh(new T.BoxGeometry(.3, .05, .12), mat("#f4f6f8")); pl.position.set(-.2, .34, 0);
        const pr = pl.clone(); pr.position.x = .2;
        player.add(pl, pr); P.pedals = [pl, pr];
      }
    }
    player.castShadow = true;
    grpDyn.add(player);
  }

  /* ---------- BUILD LEVEL ---------- */
  function build(li){
    if (!ok) return;
    if (grpStatic) scene.remove(grpStatic);
    if (grpDyn) scene.remove(grpDyn);
    grpStatic = new T.Group(); grpDyn = new T.Group();
    scene.add(grpStatic, grpDyn);
    player = null;
    const TH = THEMES[li];
    scene.background = new T.Color(TH.skyT);
    scene.fog = new T.Fog(new T.Color(TH.skyB), 90, 460);
    const golden = li === 3 || li === 4;
    sunL.color.set(golden ? 0xffc27a : 0xfff2d0);
    sunL.intensity = golden ? .8 : .95;
    hemi.intensity = golden ? .38 : .5;
    buildRoad();
    buildWorld(TH);
    buildEvents();
    buildPlayer();
    builtLevel = li;
  }

  /* ---------- PER-FRAME ---------- */
  const _v = new T.Vector3(), _f = new T.Vector3();
  function render(){
    if (!ok || builtLevel !== S.li) return false;
    const s = cam;                                  // game.js sampled this frame
    const latM = S.o * M;
    const px = (s.x + s.rx * S.o) * M, pz = (s.y + s.ry * S.o) * M;
    const jump = S.air ? 1.4 * Math.sin(Math.PI * S.air.p) : 0;
    const yaw = Math.atan2(s.fx, s.fy);
    // player
    player.position.set(px, jump, pz);
    player.rotation.set(0, yaw + Math.PI, 0);
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    player.rotation.z = -steer * Math.min(1, S.speed / S.veh.max) * .22;   // bank!
    const spin = S.time * S.speed * .9;
    for (const w of P.wheels) w.rotation.x = spin;
    if (P.pedals){ P.pedals[0].position.y = .34 + Math.sin(S.time * 8) * .14;
                   P.pedals[1].position.y = .34 - Math.sin(S.time * 8) * .14; }
    for (const b of (P.brake || [])) b.material.emissiveIntensity = input.stop ? 1.4 : .25;
    for (const h of (P.blades || [])) h.rotation.x += .012;
    // chase camera: behind + above, look ahead; FOV kicks with speed
    _f.set(s.fx, 0, s.fy);
    const back = 8.2, up = 3.4;
    camera.position.set(px - _f.x * back, up + jump * .5, pz - _f.z * back);
    _v.set(px + _f.x * 11, 1.1 + jump * .6, pz + _f.z * 11);
    camera.lookAt(_v);
    const kick = (S.speed / S.veh.max) * 13 + (S.boost > 0 ? 5 : 0);
    camera.fov += ((62 + kick) - camera.fov) * .08;
    camera.updateProjectionMatrix();
    // sun follows player so shadows stay crisp
    sunL.position.set(px - 26, 42, pz - 14);
    sunL.target.position.set(px, 0, pz);
    // traffic lights
    for (const o of evObjs){
      if (o.kind === "light"){
        const ph = lightPhase(o.ev);
        const on = ph === "red" ? 0 : ph === "yellow" ? 1 : 2;
        o.balls.forEach((b, i) => {
          b.material.emissiveIntensity = i === on ? 2.2 : .06;
          b.material.color.setScalar(i === on ? 1 : .18);      // unlit lamps go dark
          b.userData.halo.material.opacity = i === on ? .85 : 0;
        });
      }
    }
    // cones vanish if hit
    for (const c of coneObjs) c.obj.visible = !c.c.hit;
    // kids cross while their event is live
    for (const K of kidObjs){
      const live = !K.ev.resolved && Math.abs(K.cw - S.t) < 600 && !K.ev.cwDone;
      K.kids.forEach((kg, i) => {
        kg.visible = live;
        if (live){
          const t = (S.time * .35 + i * .3) % 1.6;
          const lat = -HWf() - 8 + t * (HWf() * 2 + 16) / 1.6 * 6;   // px walk across
          const p = rp(K.cw, clamp(lat, -HWf() - 8, HWf() + 8));
          kg.position.set(p.x, Math.abs(Math.sin(S.time * 6 + i)) * .06, p.z);
        }
      });
    }
    // ambulance
    if (S.amb){
      ambObj.grp.visible = true;
      const a = S.amb;
      const sa = sample(S.rt, clamp(a.w, 0, S.rt.len - 1));
      ambObj.grp.position.set((sa.x + sa.rx * a.lat) * M, 0, (sa.y + sa.ry * a.lat) * M);
      ambObj.grp.rotation.y = Math.atan2(sa.fx, sa.fy) + Math.PI;
      const fl = Math.floor(S.time * 6) % 2;
      ambObj.r.material.emissiveIntensity = fl ? 1.8 : .2;
      ambObj.b.material.emissiveIntensity = fl ? .2 : 1.8;
    } else ambObj.grp.visible = false;
    renderer.render(scene, camera);
    return true;
  }

  function resize(){
    if (!ok) return;
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  setTimeout(resize, 0);

  return { active: () => ok, build, render, resize };
})();
