// animate.js — play mode: fans spin, wings flap, lights pulse, wheeled creations drive
window.MB = window.MB || {};
(function(){
  const A = { on:false, vehicle:null, joy:{x:0,y:0}, heading:0 };
  const V3 = THREE.Vector3;

  // find drivable structures: connected components (stud↔socket contact) with >=1 'drive' spinner
  function findVehicles(){
    const blocks = MB.Magnet.blocks.filter(b => b.onTable);
    const touching = (a, b) => {
      for (const st of MB.Magnet.worldPoints(a, 'studs'))
        for (const so of MB.Magnet.worldPoints(b, 'sockets'))
          if (Math.abs(st.x-so.x) < 0.12 && Math.abs(st.y-so.y) < 0.12 && Math.abs(st.z-so.z) < 0.12) return true;
      return false;
    };
    const seen = new Set(), out = [];
    for (const b of blocks){
      if (seen.has(b)) continue;
      const comp = [b]; seen.add(b);
      for (let i = 0; i < comp.length; i++){
        for (const o of blocks){
          if (seen.has(o)) continue;
          if (touching(comp[i], o) || touching(o, comp[i])){ seen.add(o); comp.push(o); }
        }
      }
      if (comp.some(m => m.def.spin && m.def.spin.mode === 'drive')) out.push({ root: comp[0], members: comp });
    }
    return out;
  }

  A.setOn = function(on){
    A.on = on;
    A.vehicle = null; A.heading = 0;
    if (on){
      const vs = findVehicles();
      if (vs.length){
        // drive the biggest wheeled creation
        vs.sort((a,b) => b.members.length - a.members.length);
        A.vehicle = vs[0];
      }
      document.getElementById('joy').style.display = A.vehicle ? 'block' : 'none';
    } else {
      document.getElementById('joy').style.display = 'none';
    }
  };

  A.tick = function(dt, t){
    const table = MB.Builder.table;
    for (const b of MB.Magnet.blocks){
      const def = b.def;
      // lights breathe softly all the time
      if (def.emissiveGlow){
        b.group.traverse(o => {
          if (o.isMesh && o.material && o.material.emissiveIntensity !== undefined && o.material.emissive && o.material.emissive.getHex() !== 0)
            o.material.emissiveIntensity = 0.7 + 0.35*Math.sin(t*2.4 + b.uid);
        });
      }
      if (!A.on || !def.spin) continue;
      const node = b.group.getObjectByName(def.spin.node);
      if (!node) continue;
      const ax = def.spin.axis || 'y';
      if (def.spin.mode === 'spin'){
        node.rotation[ax] += (def.spin.speed || 8) * dt;
      } else if (def.spin.mode === 'flap'){
        node.rotation[ax] = Math.sin(t*7 + b.uid) * 0.6 * (def.spin.dir || 1);
        // catalog may use flapL/flapR pair — mirror the second
        const other = def.spin.node === 'flapL' ? null : null;
      } else if (def.spin.mode === 'drive' && A.vehicle && A.vehicle.members.includes(b)){
        node.rotation[ax] += A.speed * 6 * dt;
      }
      // butterflies etc. with two named wings
      if (def.spin.mode === 'flap'){
        const l = b.group.getObjectByName('flapL'), r = b.group.getObjectByName('flapR');
        const a = Math.sin(t*7 + b.uid) * 0.55;
        if (l) l.rotation[ax] =  a; if (r) r.rotation[ax] = -a;
      }
    }

    // ---- driving ----
    A.speed = 0;
    if (A.on && A.vehicle){
      const v = A.vehicle;
      if (Math.abs(A.joy.x) > 0.12 || Math.abs(A.joy.y) > 0.12){
        A.heading += -A.joy.x * 2.2 * dt;
        A.speed = -A.joy.y * 5.5;
        const root = v.root.group;
        const dx = Math.sin(A.heading) * A.speed * dt, dz = Math.cos(A.heading) * A.speed * dt;
        // keep on the table
        const nx = root.position.x + dx, nz = root.position.z + dz;
        const lim = table.half - 2.2;
        const cdx = (Math.abs(nx - table.center.x) < lim ? dx : 0);
        const cdz = (Math.abs(nz - table.center.z) < lim ? dz : 0);
        const q = new THREE.Quaternion().setFromAxisAngle(new V3(0,1,0), A.heading - (v.lastHeading || 0));
        v.lastHeading = A.heading;
        const origin = root.position.clone();
        for (const m of v.members){
          m.group.position.sub(origin).applyQuaternion(q).add(origin);
          m.group.position.x += cdx; m.group.position.z += cdz;
          m.group.quaternion.premultiply(q);
        }
      }
    }
  };

  // joystick input
  A.bindJoy = function(){
    const joy = document.getElementById('joy'), knob = document.getElementById('joyKnob');
    let active = false;
    const set = (ev) => {
      const r = joy.getBoundingClientRect();
      const t = ev.touches ? ev.touches[0] : ev;
      let x = (t.clientX - r.left - r.width/2) / (r.width/2);
      let y = (t.clientY - r.top - r.height/2) / (r.height/2);
      const m = Math.hypot(x,y); if (m > 1){ x/=m; y/=m; }
      A.joy.x = x; A.joy.y = y;
      knob.style.left = (45 + x*38) + 'px'; knob.style.top = (45 + y*38) + 'px';
    };
    const end = () => { active=false; A.joy.x=0; A.joy.y=0; knob.style.left='45px'; knob.style.top='45px'; };
    joy.addEventListener('pointerdown', ev => { active=true; joy.setPointerCapture(ev.pointerId); set(ev); });
    joy.addEventListener('pointermove', ev => { if (active) set(ev); });
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  };

  // keyboard driving
  A.keys = {};
  A.keyTick = function(){
    if (!A.on) return;
    const k = A.keys;
    const ky = (k.ArrowUp||k.KeyW ? -1 : 0) + (k.ArrowDown||k.KeyS ? 1 : 0);
    const kx = (k.ArrowLeft||k.KeyA ? -1 : 0) + (k.ArrowRight||k.KeyD ? 1 : 0);
    if (kx || ky || A._kbd){ A.joy.x = kx; A.joy.y = ky; A._kbd = !!(kx || ky); }
  };

  MB.Animate = A;
})();
