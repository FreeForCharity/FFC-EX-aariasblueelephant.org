// builder.js — pick up / drag / rotate / paint / place blocks with magnetic feel
window.MB = window.MB || {};
(function(){
  const V3 = THREE.Vector3;
  const POP_DIST = 0.95;          // pull needed to un-click an attached block
  const B = {
    scene:null, camera:null, room:null, table:null,
    grabbed:null,               // { inst, members:[{inst,relPos,relQuat}], quat0 }
    pending:null,               // maybe-detach: { inst, start:V3, sx, sy }
    selected:null,
    snap:null,                  // current magnet target while dragging
    tweens:[], onChange:null, locked:false,
  };
  const _v = new V3(), _v2 = new V3(), _q = new THREE.Quaternion();

  // ---------- init ----------
  B.init = function(ctx){
    B.scene = ctx.scene; B.camera = ctx.camera; B.room = ctx.room;
    B.table = { y: ctx.room.tableTopY, half: ctx.room.tableHalf, center: ctx.room.tableCenter };
    // tag bin displays for raycasting
    for (const bin of ctx.room.bins){
      bin.display.traverse(o => { o.userData.mbBin = bin; });
    }
    // snap glow ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.09, 8, 24),
      new THREE.MeshBasicMaterial({ color:0xffe066, transparent:true, opacity:0.9 }));
    ring.rotation.x = -Math.PI/2; ring.visible = false; ring.renderOrder = 5;
    B.scene.add(ring); B.ring = ring;
  };

  function changed(){ if (B.onChange) B.onChange(); }
  B.placedCount = () => MB.Magnet.blocks.length;
  B.strays = () => MB.Magnet.blocks.filter(b => !b.onTable && !isGrabbed(b) && !b._flying);
  function isGrabbed(inst){ return B.grabbed && B.grabbed.members.some(m => m.inst === inst); }

  // ---------- tweens ----------
  B.addTween = function(dur, fn, done){ B.tweens.push({ t:0, dur, fn, done }); };
  function runTweens(dt){
    for (let i=B.tweens.length-1; i>=0; i--){
      const tw = B.tweens[i]; tw.t += dt;
      const k = Math.min(1, tw.t/tw.dur);
      tw.fn(k);
      if (k >= 1){ B.tweens.splice(i,1); if (tw.done) tw.done(); }
    }
  }
  function squashBounce(group){
    const base = group.scale.clone();
    B.addTween(0.28, k => {
      const s = k<0.4 ? 1 - 0.22*Math.sin(k/0.4*Math.PI) : 1 + 0.08*Math.sin((k-0.4)/0.6*Math.PI);
      group.scale.set(base.x*(2-s < 1 ? 1 : 1), base.y*s, base.z*(1));
      group.scale.x = base.x*(1 + (1-s)*0.5); group.scale.z = base.z*(1 + (1-s)*0.5);
    }, ()=>group.scale.copy(base));
  }

  // ---------- selection ----------
  function highlight(inst, on){
    if (!inst) return;
    inst.group.traverse(o => {
      if (o.isMesh && o.material && o.material.emissive){
        if (on){ o.userData._em = o.material.emissive.getHex(); o.material.emissive.setHex(0x4d4020); }
        else if (o.userData._em !== undefined){ o.material.emissive.setHex(o.userData._em); delete o.userData._em; }
      }
    });
  }
  B.select = function(inst){
    if (B.selected === inst) return;
    highlight(B.selected, false);
    B.selected = inst;
    highlight(inst, true);
    changed();
  };

  // ---------- grabbing ----------
  function startGrab(inst){
    B.select(null);
    MB.Magnet.detach(inst);
    const members = [...MB.Magnet.subtree(inst)].map(m => {
      _q.copy(inst.group.quaternion).invert();
      return { inst: m,
        relPos: m.group.position.clone().sub(inst.group.position).applyQuaternion(_q),
        relQuat: _q.clone().multiply(m.group.quaternion) };
    });
    members.forEach(m => { m.inst.onTable = false; });
    B.grabbed = { inst, members };
    MB.Audio.pick();
    changed();
  }
  function applyGrabPose(){
    const g = B.grabbed; if (!g) return;
    for (const m of g.members){
      if (m.inst === g.inst) continue;
      m.inst.group.position.copy(m.relPos).applyQuaternion(g.inst.group.quaternion).add(g.inst.group.position);
      m.inst.group.quaternion.copy(g.inst.group.quaternion).multiply(m.relQuat);
    }
  }

  // desired point under the cursor: top of hovered blocks, else table, else floor
  function dragPoint(ray){
    const skip = B.grabbed ? MB.Magnet.subtree(B.grabbed.inst) : new Set();
    const meshes = [];
    for (const b of MB.Magnet.blocks){ if (!skip.has(b)) meshes.push(b.group); }
    const hits = ray.intersectObjects(meshes, true);
    if (hits.length){ const h = hits[0].point; return new V3(h.x, Math.max(h.y, B.table.y), h.z); }
    const pt = new V3();
    // table plane first
    if (ray.ray.intersectPlane(new THREE.Plane(new V3(0,1,0), -B.table.y), pt)){
      if (Math.abs(pt.x - B.table.center.x) <= B.table.half + 2 && Math.abs(pt.z - B.table.center.z) <= B.table.half + 2) return pt;
    }
    if (ray.ray.intersectPlane(new THREE.Plane(new V3(0,1,0), -(B.room.floorY + 0.6)), pt)) return pt;
    return null;
  }

  // ---------- pointer routing (returns true if consumed) ----------
  B.pointerDown = function(ray, ev){
    if (B.locked) return false;
    const hits = ray.intersectObjects(B.scene.children, true);
    for (const h of hits){
      let o = h.object;
      while (o){
        if (o.userData.mbBin){ spawnFromBin(o.userData.mbBin); return true; }
        if (o.userData.mbRoot){
          const inst = o.userData.mbRoot;
          B.pending = { inst, start: h.point.clone(), moved:0 };
          return true;
        }
        o = o.parent;
      }
    }
    B.select(null);
    return false;
  };

  B.pointerMove = function(ray, dt){
    if (B.grabbed){
      const pt = dragPoint(ray);
      if (pt){
        pt.y += 0.05;
        B.snap = MB.Magnet.magnetTick(B.grabbed.inst, B.grabbed.inst.group, pt, B.table, dt || 0.016);
        applyGrabPose();
        updateRing();
      }
      return true;
    }
    if (B.pending){
      const pt = dragPoint(ray) || B.pending.start;
      const d = pt.distanceTo(B.pending.start);
      const inst = B.pending.inst;
      const attached = inst.parent || inst.onTable;
      if (!attached || d > POP_DIST){
        if (attached && d > POP_DIST) MB.Audio.pop();
        const p = B.pending; B.pending = null;
        startGrab(p.inst);
        // small jump into the hand
        inst.group.position.y += 0.25;
      } else if (d > 0.1){
        // magnetic resistance: strain toward the cursor but hold on
        _v.copy(pt).sub(B.pending.start).multiplyScalar(0.22 * Math.min(1, d/POP_DIST));
        inst.group.position.x += (_v.x - (inst.userData_lean?.x||0));
        inst.group.position.z += (_v.z - (inst.userData_lean?.z||0));
        inst.userData_lean = { x:_v.x, z:_v.z };
      }
      return true;
    }
    return false;
  };

  B.pointerUp = function(ray){
    if (B.pending){
      // simple tap: select (undo any lean)
      const inst = B.pending.inst;
      if (inst.userData_lean){ inst.group.position.x -= inst.userData_lean.x; inst.group.position.z -= inst.userData_lean.z; inst.userData_lean = null; }
      B.select(inst);
      B.pending = null;
      return true;
    }
    if (B.grabbed){
      release();
      return true;
    }
    return false;
  };

  function updateRing(){
    if (B.snap){
      B.ring.visible = true;
      B.ring.position.set(B.snap.point.x, B.snap.point.y + 0.06, B.snap.point.z);
      const pulse = 1 + 0.15*Math.sin(performance.now()/120);
      const near = Math.max(0.4, 1.4 - (1 - B.snap.dist/MB.Magnet.SNAP_RADIUS));
      B.ring.scale.setScalar(near * pulse);
      B.ring.material.opacity = 0.5 + 0.4*(1 - B.snap.dist/MB.Magnet.SNAP_RADIUS);
    } else B.ring.visible = false;
  }

  function release(){
    const g = B.grabbed; B.grabbed = null; B.ring.visible = false;
    const inst = g.inst;
    if (B.snap && B.snap.dist < MB.Magnet.SNAP_LOCK * 1.6){
      MB.Magnet.finalize(inst, B.snap);
      applyGrabPose();
      g.members.forEach(m => { m.inst.onTable = inst.onTable; });
      // children keep their internal attachments; re-adopt anything resting on us
      MB.Audio.snap();
      squashBounce(inst.group);
    } else {
      // no magnet: drop where it is — falls to the floor and becomes a stray
      const from = inst.group.position.clone();
      const floorY = B.room.floorY + 0.02;
      const to = new V3(from.x, floorY, from.z);
      if (Math.abs(from.x - B.table.center.x) <= B.table.half && Math.abs(from.z - B.table.center.z) <= B.table.half && from.y > B.table.y - 0.5){
        // over the table: settle on the tabletop grid instead
        to.set(Math.round(from.x*2)/2, B.table.y, Math.round(from.z*2)/2);
        inst.onTable = true;
      } else {
        inst.onTable = false;
        MB.Audio.no();
      }
      const membersFrom = g.members.map(m => m.inst.group.position.clone());
      B.addTween(0.35, k => {
        const e = 1 - Math.pow(1-k, 2.2);
        const dy = (to.y - from.y) * e, dx = (to.x-from.x)*e, dz = (to.z-from.z)*e;
        g.members.forEach((m,i) => m.inst.group.position.set(membersFrom[i].x+dx, membersFrom[i].y+dy, membersFrom[i].z+dz));
      }, () => { if (inst.onTable){ MB.Audio.snap(); squashBounce(inst.group);} MB.cleanupCheck && MB.cleanupCheck(); });
    }
    B.snap = null;
    changed();
  }

  // ---------- actions ----------
  function spawnFromBin(bin){
    if (B.locked || B.grabbed) return;
    const def = MB.CATALOG.blocks[bin.blockId];
    const inst = MB.Magnet.createBlock(bin.blockId, def.defaultColor);
    if (!inst) return;
    inst.group.position.copy(bin.pos).add(new V3(0, 0.6, 0));
    B.scene.add(inst.group);
    startGrab(inst);
  }

  B.rotateSel = function(){
    const inst = (B.grabbed && B.grabbed.inst) || B.selected;
    if (!inst) return;
    const wasAttached = inst.parent || inst.onTable;
    if (wasAttached && !B.grabbed){ MB.Magnet.detach(inst); }
    const members = B.grabbed ? B.grabbed.members : [...MB.Magnet.subtree(inst)].map(m => ({ inst:m }));
    const q = new THREE.Quaternion().setFromAxisAngle(new V3(0,1,0), Math.PI/2);
    const origin = inst.group.position;
    for (const m of members){
      if (m.inst !== inst){
        m.inst.group.position.sub(origin).applyQuaternion(q).add(origin);
      }
      m.inst.group.quaternion.premultiply(q);
    }
    if (B.grabbed){ // recapture relative poses
      _q.copy(inst.group.quaternion).invert();
      for (const m of B.grabbed.members){
        m.relPos = m.inst.group.position.clone().sub(inst.group.position).applyQuaternion(_q);
        m.relQuat = _q.clone().multiply(m.inst.group.quaternion);
      }
    } else if (wasAttached){
      // try to re-attach in the new orientation
      const snap = MB.Magnet.findSnap(inst, inst.group.position, inst.group.quaternion, B.table);
      if (snap && snap.dist < 0.4) MB.Magnet.finalize(inst, snap);
      else inst.onTable = true;
    }
    MB.Audio.pick();
    squashBounce(inst.group);
  };

  B.repaint = function(inst, colorHex){
    const g2 = inst.def.build(colorHex);
    g2.position.copy(inst.group.position); g2.quaternion.copy(inst.group.quaternion);
    if (inst.group.parent){ inst.group.parent.add(g2); inst.group.parent.remove(inst.group); }
    inst.group = g2; inst.color = colorHex;
    g2.userData.mb = inst; g2.traverse(o => { o.userData.mbRoot = inst; });
    if (B.selected === inst){ highlight(inst, true); }
    MB.Audio.sparkle();
  };

  B.duplicateSel = function(){
    if (!B.selected || B.grabbed) return;
    const src = B.selected;
    const inst = MB.Magnet.createBlock(src.def.id, src.color);
    inst.group.position.copy(src.group.position).add(new V3(0, 1.5, 0));
    inst.group.quaternion.copy(src.group.quaternion);
    B.scene.add(inst.group);
    startGrab(inst);
  };

  B.toggleHinge = function(inst){
    inst = inst || B.selected;
    if (!inst || !inst.def.hinges) return;
    const open = !inst.hingeOpen; inst.hingeOpen = open;
    for (const h of inst.def.hinges){
      const node = inst.group.getObjectByName(h.node);
      if (!node) continue;
      const from = node.rotation[h.axis], to = open ? h.open : h.closed;
      B.addTween(0.4, k => { node.rotation[h.axis] = from + (to - from) * (1 - Math.pow(1-k, 3)); });
    }
    MB.Audio.pick();
  };

  // fly a block (and its stack) back to its shelf bin, then remove
  B.flyToShelf = function(inst, thenRemove = true){
    const members = [...MB.Magnet.subtree(inst)];
    MB.Audio.whoosh();
    for (const m of members) m._flying = true;
    for (const m of members){
      const bin = B.room.bins.find(b => b.blockId === m.def.id) || B.room.bins[0];
      const from = m.group.position.clone(), to = bin.pos.clone();
      const lift = 3 + Math.random()*2;
      B.addTween(0.55 + Math.random()*0.2, k => {
        const e = k*k*(3-2*k);
        m.group.position.lerpVectors(from, to, e);
        m.group.position.y += Math.sin(e*Math.PI) * lift;
        m.group.scale.setScalar(1 - 0.6*e);
      }, () => { if (thenRemove) MB.Magnet.removeBlock(m); changed(); });
    }
    if (B.selected && members.includes(B.selected)) B.select(null);
  };

  B.clearAll = function(){
    for (const b of [...MB.Magnet.blocks]) MB.Magnet.removeBlock(b);
    B.select(null); B.grabbed = null; B.pending = null;
    changed();
  };

  B.tick = function(dt){ runTweens(dt); if (B.grabbed) updateRing(); };

  MB.Builder = B;
})();
