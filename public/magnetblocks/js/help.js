// help.js — 🪄 Magic Builder: on a cooldown, blocks fly off the shelves and click into a surprise build
window.MB = window.MB || {};
(function(){
  const COOLDOWN = 60;       // seconds between magic builds
  const FIRST_WAIT = 40;     // first one unlocks quickly so kids discover it
  const H = { readyAt: 0, running: false };
  H.init = function(){ H.readyAt = performance.now()/1000 + FIRST_WAIT; H.lastCooldown = FIRST_WAIT; };

  H.isReady = () => !H.running && performance.now()/1000 >= H.readyAt;

  H.tickUI = function(){
    const btn = document.getElementById('helpBtn');
    const ring = document.querySelector('#helpRing circle');
    const timer = document.getElementById('helpTimer');
    const now = performance.now()/1000;
    const left = Math.max(0, H.readyAt - now);
    const total = H.readyAt - H.startedWait || COOLDOWN;
    if (left > 0 || H.running){
      btn.classList.add('cooling');
      const frac = Math.min(1, left / (H.lastCooldown || COOLDOWN));
      ring.style.strokeDashoffset = (295.3 * frac).toFixed(1);
      timer.style.display = 'block';
      timer.textContent = H.running ? '✨' : Math.ceil(left/60) + 'm';
      if (left < 60 && left > 0) timer.textContent = Math.ceil(left) + 's';
    } else {
      btn.classList.remove('cooling');
      ring.style.strokeDashoffset = 0;
      timer.style.display = 'none';
    }
  };

  H.openPicker = function(){
    if (H.running) return;
    if (!H.isReady()){
      MB.Audio.no();
      const left = Math.ceil((H.readyAt - performance.now()/1000));
      MB.ui.toast('🪄 The magic wand is resting! Ready in ' + (left > 60 ? Math.ceil(left/60) + ' minutes' : left + ' seconds') + ' — keep building! 💪', 2400);
      return;
    }
    const grid = document.getElementById('helpGrid');
    grid.innerHTML = '';
    for (const m of MB.HELP_MODELS){
      const el = document.createElement('div'); el.className = 'helpItem';
      el.innerHTML = '<div class="em">' + m.emoji + '</div><div class="nm">' + m.name + '</div>';
      el.addEventListener('click', () => { MB.ui.hide('helpModal'); H.build(m); });
      grid.appendChild(el);
    }
    MB.ui.show('helpModal');
  };

  // magic build: pieces fly one by one from their shelf bins and snap into place
  H.build = function(model){
    if (H.running) return;
    H.running = true;
    H.lastCooldown = COOLDOWN;
    MB.Builder.locked = true;
    MB.Builder.select(null);
    MB.Audio.sparkle();
    MB.ui.toast('🪄 Watch the magic! Building a ' + model.name + '! ' + model.emoji, 2400);

    const t = MB.Builder.table;
    // find a clear spot on the table: try center then offsets
    const spots = [[0,0],[ -3.5,0 ],[3.5,0],[0,-3.5],[0,3.5],[3.5,3.5],[-3.5,-3.5]];
    let ox = 0, oz = 0;
    for (const [sx,sz] of spots){
      if (spotClear(sx, sz, model)) { ox = sx; oz = sz; break; }
    }

    const scene = MB.Builder.scene;
    let i = 0;
    const placeNext = () => {
      if (i >= model.pieces.length){ finish(); return; }
      const pc = model.pieces[i++];
      const def = MB.CATALOG.blocks[pc.b];
      if (!def){ placeNext(); return; }
      const inst = MB.Magnet.createBlock(pc.b, pc.c || def.defaultColor);
      const bin = MB.Builder.room.bins.find(bn => bn.blockId === pc.b);
      const from = bin ? bin.pos.clone() : new THREE.Vector3(t.center.x, t.y + 12, t.center.z);
      const to = new THREE.Vector3(t.center.x + ox + pc.p[0], t.y + pc.p[1], t.center.z + oz + pc.p[2]);
      inst.group.position.copy(from);
      inst.group.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), (pc.r || 0) * Math.PI/2);
      inst.onTable = true;
      scene.add(inst.group);
      MB.Audio.whoosh();
      const lift = 4 + Math.random()*3;
      MB.Builder.addTween(0.5, k => {
        const e = k*k*(3-2*k);
        inst.group.position.lerpVectors(from, to, e);
        inst.group.position.y += Math.sin(e*Math.PI) * lift * (1-e*0.4);
      }, () => {
        inst.group.position.copy(to);
        MB.Audio.snap();
        setTimeout(placeNext, 120);
      });
    };
    const finish = () => {
      MB.Magnet.rewireAll(t);
      MB.Builder.locked = false;
      H.running = false;
      H.readyAt = performance.now()/1000 + COOLDOWN;
      MB.Audio.fanfare();
      MB.ui.confetti();
      MB.ui.toast('🎉 Ta-daa! One ' + model.name + '! ' + model.emoji + ' Now make it your own — or press ▶️ to play with it!', 3600);
      MB.Builder.onChange && MB.Builder.onChange();
    };
    placeNext();
  };

  function spotClear(ox, oz, model){
    const t = MB.Builder.table;
    // model footprint ~ max |x|,|z| of pieces + margin
    let ext = 2;
    for (const pc of model.pieces) ext = Math.max(ext, Math.abs(pc.p[0]) + 2, Math.abs(pc.p[2]) + 2);
    if (Math.abs(ox) + ext > t.half || Math.abs(oz) + ext > t.half) return false;
    for (const b of MB.Magnet.blocks){
      if (!b.onTable) continue;
      const dx = b.group.position.x - (t.center.x + ox), dz = b.group.position.z - (t.center.z + oz);
      if (Math.abs(dx) < ext && Math.abs(dz) < ext) return false;
    }
    return true;
  }

  MB.Help = H;
})();
