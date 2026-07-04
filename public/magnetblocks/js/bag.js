// bag.js — 📸 keep creations in the school bag (localStorage) and rebuild them later
window.MB = window.MB || {};
(function(){
  const KEY = 'mb_bag_v1', MAX = 24;
  const Bag = { items: [] };

  function load(){ try { Bag.items = JSON.parse(localStorage.getItem(KEY)) || []; } catch(e){ Bag.items = []; } }
  function save(){
    try { localStorage.setItem(KEY, JSON.stringify(Bag.items)); }
    catch(e){ // storage full: drop oldest thumbnails first
      while (Bag.items.length > 4){ Bag.items.shift(); try { localStorage.setItem(KEY, JSON.stringify(Bag.items)); return; } catch(_){} }
    }
  }
  load();

  // serialize everything currently ON THE TABLE, relative to table center
  Bag.serializeTable = function(){
    const t = MB.Builder.table;
    const pieces = [];
    for (const b of MB.Magnet.blocks){
      if (!b.onTable) continue;
      const e = new THREE.Euler().setFromQuaternion(b.group.quaternion, 'YXZ');
      pieces.push({ b: b.def.id, c: b.color,
        p: [ +(b.group.position.x - t.center.x).toFixed(3), +(b.group.position.y - t.y).toFixed(3), +(b.group.position.z - t.center.z).toFixed(3) ],
        ry: +e.y.toFixed(4), h: b.hingeOpen ? 1 : 0 });
    }
    return pieces;
  };

  // photo: render the scene once and crop a centered square around the table
  Bag.snapshot = function(renderer, scene, camera){
    renderer.render(scene, camera);
    const src = renderer.domElement;
    const side = Math.min(src.width, src.height);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
    const cx = cv.getContext('2d');
    cx.drawImage(src, (src.width-side)/2, (src.height-side)/2, side, side, 0, 0, 256, 256);
    return cv.toDataURL('image/jpeg', 0.75);
  };

  Bag.keep = function(renderer, scene, camera){
    const pieces = Bag.serializeTable();
    if (!pieces.length) return null;
    const item = { id: Date.now(), name: 'Creation ' + (Bag.items.length + 1),
      date: new Date().toLocaleDateString(), thumb: Bag.snapshot(renderer, scene, camera), pieces };
    Bag.items.push(item);
    if (Bag.items.length > MAX) Bag.items.shift();
    save();
    return item;
  };

  Bag.remove = function(id){ Bag.items = Bag.items.filter(i => i.id !== id); save(); };

  // rebuild a saved creation onto the table (table must be clear-ish; caller confirms)
  Bag.rebuild = function(item, scene){
    const t = MB.Builder.table;
    const made = [];
    for (const pc of item.pieces){
      const def = MB.CATALOG.blocks[pc.b];
      if (!def) continue; // block retired from catalog — skip gracefully
      const inst = MB.Magnet.createBlock(pc.b, pc.c || def.defaultColor);
      inst.group.position.set(t.center.x + pc.p[0], t.y + pc.p[1], t.center.z + pc.p[2]);
      inst.group.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), pc.ry || 0);
      inst.onTable = true;
      if (pc.h && def.hinges){ inst.hingeOpen = true;
        for (const h of def.hinges){ const n = inst.group.getObjectByName(h.node); if (n) n.rotation[h.axis] = h.open; } }
      scene.add(inst.group);
      made.push(inst);
    }
    MB.Magnet.rewireAll(t);
    return made;
  };

  // UI ------------------------------------------------------------------
  Bag.renderGrid = function(onPick){
    const grid = document.getElementById('bagGrid'), empty = document.getElementById('bagEmpty');
    grid.innerHTML = '';
    empty.style.display = Bag.items.length ? 'none' : 'block';
    for (const item of [...Bag.items].reverse()){
      const el = document.createElement('div'); el.className = 'bagItem';
      el.innerHTML = '<img src="' + item.thumb + '" alt=""><div class="nm">' + item.name + ' · ' + item.date + '</div>' +
                     '<button class="del">✕</button>';
      el.querySelector('img').addEventListener('click', () => onPick(item));
      el.querySelector('.del').addEventListener('click', (ev) => {
        ev.stopPropagation();
        Bag.remove(item.id); Bag.renderGrid(onPick); Bag.updateCount();
      });
      grid.appendChild(el);
    }
  };
  Bag.updateCount = function(){
    const c = document.getElementById('bagCount');
    if (c) c.textContent = Bag.items.length;
  };

  MB.Bag = Bag;
})();
