// bag.js — 📸 keep creations in the school bag (localStorage) and rebuild them later
window.MB = window.MB || {};
(function(){
  const KEY = 'mb_bag_v1', MAX = 24;
  const AUTOSAVE_KEY = 'mb_autosave';
  const Bag = { items: [] };

  // placeholder thumb for imported builds we haven't rendered a photo of yet
  const PLACEHOLDER_THUMB = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
    '<rect width="100%" height="100%" fill="#dbe4ff"/>' +
    '<text x="50%" y="58%" font-size="120" text-anchor="middle" dominant-baseline="middle">🧲</text></svg>');

  // ---- build-order sequence numbers: lets 🎬 replay show pieces in placement order ----
  // stamped onto piece.group.userData.seq wherever a block is finalized onto the table
  // (see builder.js release(), help.js Magic Builder placement).
  Bag.nextSeq = function(){
    MB.seqCounter = (MB.seqCounter || 0) + 1;
    return MB.seqCounter;
  };
  function syncSeqFloor(){
    let max = MB.seqCounter || 0;
    for (const b of MB.Magnet.blocks){
      const s = b.group.userData.seq;
      if (typeof s === 'number' && s > max) max = s;
    }
    MB.seqCounter = max;
  }

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
    let i = 0;
    for (const b of MB.Magnet.blocks){
      if (!b.onTable) continue;
      const e = new THREE.Euler().setFromQuaternion(b.group.quaternion, 'YXZ');
      pieces.push({ b: b.def.id, c: b.color,
        p: [ +(b.group.position.x - t.center.x).toFixed(3), +(b.group.position.y - t.y).toFixed(3), +(b.group.position.z - t.center.z).toFixed(3) ],
        ry: +e.y.toFixed(4), h: b.hingeOpen ? 1 : 0,
        seq: (typeof b.group.userData.seq === 'number') ? b.group.userData.seq : i });
      i++;
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
    if (MB.Stats) MB.Stats.bump('buildsSaved');
    save();
    return item;
  };

  Bag.remove = function(id){ Bag.items = Bag.items.filter(i => i.id !== id); save(); };

  // ---- share/export: a tiny, personal-data-free JSON file a friend can bring back in ----
  async function downloadBuild(name, pieces){
    const payload = { app:'magnetblocks', v:1, name: name, pieces: pieces };
    const blob = new Blob([JSON.stringify(payload)], { type:'application/json' });
    const slug = (name || 'creation').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'creation';
    if (window.ABEShare && await window.ABEShare(slug + '.magnetblocks.json', blob)) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = slug + '.magnetblocks.json';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  }

  Bag.exportItem = async function(item){
    await downloadBuild(item.name, item.pieces);
  };

  // share the LIVE table (not a saved school-bag item) — used by the 📤 share HUD button
  Bag.exportTable = async function(){
    const pieces = Bag.serializeTable();
    if (!pieces.length) return false;
    await downloadBuild('My Magnet Build', pieces);
    return true;
  };

  // defensive shape check — never trust a dropped-in file
  Bag.validatePieces = function(arr){
    if (!Array.isArray(arr) || !arr.length) return false;
    for (const pc of arr){
      if (!pc || typeof pc.b !== 'string') return false;
      if (!Array.isArray(pc.p) || pc.p.length !== 3 || pc.p.some(n => typeof n !== 'number' || !isFinite(n))) return false;
    }
    return true;
  };

  Bag.addImported = function(name, pieces){
    const item = { id: Date.now(), name: (name || "Friend's build").slice(0, 40),
      date: new Date().toLocaleDateString(), thumb: PLACEHOLDER_THUMB, pieces };
    Bag.items.push(item);
    if (Bag.items.length > MAX) Bag.items.shift();
    save();
    return item;
  };

  // read + validate a dropped-in .magnetblocks.json file; cb(item, errCode) — errCode set on failure
  Bag.importFromFile = function(file, cb){
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(reader.result); } catch(e){ cb(null, 'parse'); return; }
      if (!data || data.app !== 'magnetblocks' || typeof data.v !== 'number' || !Bag.validatePieces(data.pieces)){
        cb(null, 'shape'); return;
      }
      const name = (typeof data.name === 'string' && data.name.trim()) ? data.name.trim() : "Friend's build";
      cb(Bag.addImported(name, data.pieces), null);
    };
    reader.onerror = () => cb(null, 'read');
    reader.readAsText(file);
  };

  // rebuild any array of serialized pieces onto the table (shared by bag-load, autosave-restore, undo)
  Bag.rebuildPieces = function(pieces, scene){
    const t = MB.Builder.table;
    const made = [];
    pieces.forEach((pc, idx) => {
      const def = MB.CATALOG.blocks[pc.b];
      if (!def) return; // block retired from catalog — skip gracefully
      const inst = MB.Magnet.createBlock(pc.b, pc.c || def.defaultColor);
      inst.group.position.set(t.center.x + pc.p[0], t.y + pc.p[1], t.center.z + pc.p[2]);
      inst.group.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), pc.ry || 0);
      inst.onTable = true;
      // legacy saves have no seq — fall back to array order so old creations still replay sensibly
      inst.group.userData.seq = (typeof pc.seq === 'number') ? pc.seq : idx;
      if (pc.h && def.hinges){ inst.hingeOpen = true;
        for (const h of def.hinges){ const n = inst.group.getObjectByName(h.node); if (n) n.rotation[h.axis] = h.open; } }
      scene.add(inst.group);
      made.push(inst);
    });
    MB.Magnet.rewireAll(t);
    syncSeqFloor();
    return made;
  };

  // rebuild a saved creation onto the table (table must be clear-ish; caller confirms)
  Bag.rebuild = function(item, scene){ return Bag.rebuildPieces(item.pieces, scene); };

  // ---- autosave: quietly remember the live table so a refresh never loses a build ----
  Bag.saveAutosave = function(){
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(Bag.serializeTable())); } catch(e){}
  };
  Bag.loadAutosave = function(){
    try { return JSON.parse(localStorage.getItem(AUTOSAVE_KEY)) || []; } catch(e){ return []; }
  };
  Bag.clearAutosave = function(){ try { localStorage.removeItem(AUTOSAVE_KEY); } catch(e){} };

  // UI ------------------------------------------------------------------
  Bag.renderGrid = function(onPick, onReplay, onShare){
    const grid = document.getElementById('bagGrid'), empty = document.getElementById('bagEmpty');
    grid.innerHTML = '';
    empty.style.display = Bag.items.length ? 'none' : 'block';
    for (const item of [...Bag.items].reverse()){
      const el = document.createElement('div'); el.className = 'bagItem';
      el.innerHTML = '<img src="' + item.thumb + '" alt=""><div class="nm" title="✏️ Tap to rename">' + item.name + ' · ' + item.date + '</div>' +
                     '<div class="bagActions">' +
                       '<button class="bagAct" title="My Movie — watch my build">▶️</button>' +
                       '<button class="bagAct" title="Share this build">📤</button>' +
                     '</div>' +
                     '<button class="del">✕</button>';
      el.querySelector('img').addEventListener('click', () => onPick(item));
      el.querySelector('.nm').addEventListener('click', (ev) => {
        ev.stopPropagation();
        const nm = prompt('Name this creation:', item.name);
        if (nm && nm.trim()){
          item.name = nm.trim().slice(0, 40);
          save();
          Bag.renderGrid(onPick, onReplay, onShare);
        }
      });
      const acts = el.querySelectorAll('.bagAct');
      acts[0].addEventListener('click', (ev) => { ev.stopPropagation(); if (onReplay) onReplay(item); });
      acts[1].addEventListener('click', (ev) => { ev.stopPropagation(); if (onShare) onShare(item); });
      el.querySelector('.del').addEventListener('click', (ev) => {
        ev.stopPropagation();
        Bag.remove(item.id); Bag.renderGrid(onPick, onReplay, onShare); Bag.updateCount();
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
