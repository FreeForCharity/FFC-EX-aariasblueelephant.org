// magnet.js — magnetic snap physics: stud/socket registry, best-fit search, pull force
window.MB = window.MB || {};
(function(){
  const V3 = THREE.Vector3;
  const SNAP_RADIUS = 1.55;      // studs start pulling within this distance
  const SNAP_LOCK   = 0.62;      // release inside this = click together
  const uid = (()=>{ let n=1; return ()=>n++; })();

  // ---- block instances ----------------------------------------------------
  // inst = { uid, def, color, group, edges:Set<inst> (blocks whose sockets sit on my studs = children),
  //          parent:inst|null, onTable:bool, hingeOpen:bool }
  const blocks = [];

  function createBlock(defId, colorHex){
    const def = MB.CATALOG.blocks[defId];
    if (!def) { console.warn('[MB] unknown block', defId); return null; }
    const group = def.build(colorHex);
    const inst = { uid:uid(), def, color:colorHex, group, children:new Set(), parent:null, onTable:false, hingeOpen:false };
    group.userData.mb = inst;
    group.traverse(o => { o.userData.mbRoot = inst; });
    blocks.push(inst);
    return inst;
  }
  function removeBlock(inst){
    detach(inst);
    for (const c of [...inst.children]) { c.parent = null; inst.children.delete(c); }
    const i = blocks.indexOf(inst); if (i>=0) blocks.splice(i,1);
    if (inst.group.parent) inst.group.parent.remove(inst.group);
  }
  function detach(inst){
    if (inst.parent) { inst.parent.children.delete(inst); inst.parent = null; }
  }
  function attach(child, parent){
    detach(child);
    child.parent = parent || null;
    if (parent) parent.children.add(child);
  }

  // subtree = inst + everything stacked on top of it (recursively)
  function subtree(inst){
    const out = new Set(); const q=[inst];
    while(q.length){ const b=q.pop(); if(out.has(b)) continue; out.add(b); b.children.forEach(c=>q.push(c)); }
    return out;
  }

  // ---- world-space snap points --------------------------------------------
  const _v = new V3();
  function worldPoints(inst, kind){ // kind: 'studs' | 'sockets'
    const pts = inst.def[kind] || [];
    const out = [];
    for (let i=0;i<pts.length;i++){
      _v.set(pts[i].x, pts[i].y, pts[i].z).applyQuaternion(inst.group.quaternion).add(inst.group.position);
      out.push({ x:_v.x, y:_v.y, z:_v.z, inst, i });
    }
    return out;
  }

  // all free studs in the world that `held` could attach to (excluding its own subtree)
  function collectStuds(held, table){
    const skip = subtree(held);
    const studs = [];
    for (const b of blocks){
      if (skip.has(b)) continue;
      studs.push(...worldPoints(b,'studs'));
    }
    // the table itself is a magnetic grid
    if (table){
      studs.tableGrid = table; // marker; handled separately in findSnap
    }
    return studs;
  }

  // footprint AABB (world, y-range) for collision tests, slightly shrunk
  function aabbAt(def, pos, quat){
    const s = def.size;
    const hw = s.w/2 - 0.08, hd = s.d/2 - 0.08;
    const corners = [[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd]];
    let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
    for (const [cx,cz] of corners){
      _v.set(cx,0,cz).applyQuaternion(quat);
      minX=Math.min(minX,pos.x+_v.x); maxX=Math.max(maxX,pos.x+_v.x);
      minZ=Math.min(minZ,pos.z+_v.z); maxZ=Math.max(maxZ,pos.z+_v.z);
    }
    return { minX,maxX,minZ,maxZ, minY:pos.y+0.05, maxY:pos.y+s.h-0.05 };
  }
  function aabbOverlap(a,b){
    return a.minX<b.maxX && a.maxX>b.minX && a.minZ<b.maxZ && a.maxZ>b.minZ && a.minY<b.maxY && a.maxY>b.minY;
  }
  function collides(held, pos, quat){
    const skip = subtree(held);
    const box = aabbAt(held.def, pos, quat);
    for (const b of blocks){
      if (skip.has(b)) continue;
      if (aabbOverlap(box, aabbAt(b.def, b.group.position, b.group.quaternion))) return b;
    }
    return null;
  }

  // ---- find best snap for a held block near a desired pose ----------------
  // returns { pos:V3, parent:inst|null, dist, point:{x,y,z} } or null
  function findSnap(held, desired, quat, table){
    const sockets = (held.def.sockets||[]).map(p => {
      _v.set(p.x,p.y,p.z).applyQuaternion(quat);
      return { x:_v.x, y:_v.y, z:_v.z };
    });
    if (!sockets.length) return null;
    let best = null;

    // candidate A: studs of placed blocks
    const skip = subtree(held);
    for (const b of blocks){
      if (skip.has(b)) continue;
      for (const st of worldPoints(b,'studs')){
        for (const so of sockets){
          const px = st.x - so.x, py = st.y - so.y, pz = st.z - so.z; // resulting block origin
          const dx = desired.x - px, dy = desired.y - py, dz = desired.z - pz;
          const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (d > SNAP_RADIUS) continue;
          if (best && d >= best.dist) continue;
          const pos = new V3(px,py,pz);
          if (collides(held, pos, quat)) continue;
          if (!socketsSupported(sockets, pos, skip, table)) continue;
          best = { pos, parent: st.inst, dist: d, point: st };
        }
      }
    }

    // candidate B: the table grid (half-stud grid at tableTopY)
    if (table){
      const gx = Math.round(desired.x*2)/2, gz = Math.round(desired.z*2)/2;
      if (Math.abs(gx) <= table.half && Math.abs(gz) <= table.half){
        // lowest socket must land on the table top
        let lowSock = Infinity; for (const so of sockets) lowSock = Math.min(lowSock, so.y);
        const pos = new V3(gx, table.y - lowSock, gz);
        const dx = desired.x-pos.x, dy = desired.y-pos.y, dz = desired.z-pos.z;
        const d = Math.sqrt(dx*dx+dy*dy+dz*dz);
        if (d <= SNAP_RADIUS && (!best || d < best.dist*0.8) && !collides(held,pos,quat)){
          best = { pos, parent:null, dist:d, point:{x:gx, y:table.y, z:gz}, table:true };
        }
      }
    }
    return best;
  }

  // every socket must rest on a stud or on the table (no floating overhang attach)…
  // relaxed: at least the matched one + no socket buried below a surface.
  function socketsSupported(sockets, pos, skip, table){
    for (const so of sockets){
      const y = pos.y + so.y;
      if (table && y < table.y - 0.15 && Math.abs(pos.x+so.x) <= table.half && Math.abs(pos.z+so.z) <= table.half) return false;
    }
    return true;
  }

  // ---- magnetic pull (called per-frame while dragging) ---------------------
  // lerps the carrier group toward the snap pose; returns snap info (or null)
  function magnetTick(held, carrier, desired, table, dt){
    const snap = findSnap(held, desired, carrier.quaternion, table);
    let target = desired;
    let strength = 0;
    if (snap){
      // pull strength grows as we get closer — feels like a real magnet grabbing
      strength = THREE.MathUtils.clamp(1 - snap.dist / SNAP_RADIUS, 0, 1);
      target = new V3().lerpVectors(desired, snap.pos, Math.pow(strength, 1.6) * 0.9);
    }
    const k = 1 - Math.pow(0.0001, dt); // fast critically-damped-ish lerp
    carrier.position.lerp(target, k);
    return snap;
  }

  // after release: exact placement + wire the support graph
  function finalize(held, snap){
    held.group.position.copy(snap.pos);
    held.onTable = !!snap.table || (snap.parent ? snap.parent.onTable : false);
    attach(held, snap.parent);
    // re-adopt: free blocks whose sockets now sit on my studs become children
    for (const b of blocks){
      if (b === held || b.parent) continue;
      adoptIfResting(held, b);
    }
    // and if I have more supports under my other sockets, that's fine — single parent is enough
  }
  function adoptIfResting(parentCand, b){
    const studs = worldPoints(parentCand,'studs');
    for (const so of worldPoints(b,'sockets')){
      for (const st of studs){
        if (Math.abs(so.x-st.x)<0.1 && Math.abs(so.y-st.y)<0.1 && Math.abs(so.z-st.z)<0.1){
          attach(b, parentCand); b.onTable = parentCand.onTable; return true;
        }
      }
    }
    return false;
  }

  // rebuild support graph from scratch (used after loading from bag)
  function rewireAll(table){
    for (const b of blocks){ b.parent=null; b.children.clear(); b.onTable=false; }
    const studIndex = [];
    for (const b of blocks) for (const st of worldPoints(b,'studs')) studIndex.push(st);
    for (const b of blocks){
      // on table?
      let low = Infinity; for (const so of b.def.sockets||[]) low = Math.min(low, so.y);
      if (table && Math.abs(b.group.position.y + low - table.y) < 0.12 &&
          Math.abs(b.group.position.x) <= table.half+1 && Math.abs(b.group.position.z) <= table.half+1) b.onTable = true;
      for (const so of worldPoints(b,'sockets')){
        for (const st of studIndex){
          if (st.inst===b) continue;
          if (Math.abs(so.x-st.x)<0.1 && Math.abs(so.y-st.y)<0.1 && Math.abs(so.z-st.z)<0.1){
            if (!b.parent && !subtree(b).has(st.inst)) attach(b, st.inst);
          }
        }
      }
    }
    // propagate onTable through the graph
    let changed = true;
    while (changed){ changed=false;
      for (const b of blocks){
        if (!b.onTable && b.parent && b.parent.onTable){ b.onTable=true; changed=true; }
      }
    }
  }

  MB.Magnet = { blocks, createBlock, removeBlock, attach, detach, subtree, worldPoints,
                findSnap, magnetTick, finalize, rewireAll, collides, adoptIfResting,
                SNAP_RADIUS, SNAP_LOCK };
})();
