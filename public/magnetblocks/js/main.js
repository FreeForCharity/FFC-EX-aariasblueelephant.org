// main.js — boot, camera orbit, input routing, HUD wiring, game loop
window.MB = window.MB || {};
(function(){
  const V3 = THREE.Vector3;
  let renderer, scene, camera, room, raycaster = new THREE.Raycaster();
  let started = false;

  // ---------- tiny UI kit ----------
  const $ = id => document.getElementById(id);
  const ui = MB.ui = {
    muted: false,
    show: id => { $(id).style.display = 'flex'; },
    hide: id => { $(id).style.display = 'none'; },
    toast(msg, ms){
      const t = $('toast'); t.innerHTML = msg; t.style.display = 'block';
      clearTimeout(ui._tt); ui._tt = setTimeout(() => t.style.display = 'none', ms || 2200);
    },
    hint(msg){ const h = $('hintChip'); h.textContent = msg; h.style.display = msg ? 'block' : 'none'; },
    confetti(){
      const ems = ['🎉','⭐','💛','🧡','💚','💙','💜','✨'];
      for (let i = 0; i < 26; i++){
        const d = document.createElement('div'); d.className = 'confettiBit';
        d.textContent = ems[i % ems.length];
        d.style.left = (5 + Math.random()*90) + 'vw';
        d.style.top = (-5 - Math.random()*20) + 'vh';
        d.style.animationDelay = (Math.random()*0.5) + 's';
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 2400);
      }
    },
    confirm(title, text, yes){
      $('confirmTitle').textContent = title; $('confirmText').textContent = text;
      ui.show('confirmModal');
      $('confirmYes').onclick = () => { ui.hide('confirmModal'); yes(); };
      $('confirmNo').onclick = () => ui.hide('confirmModal');
    },
    setPlay(on){
      MB.Animate.setOn(on);
      $('playBtn').textContent = on ? '⏹️' : '▶️';
      $('playBtn').classList.toggle('on', on);
      MB.Builder.select(null);
      updateSelBar();
      if (on){
        ui.toast(MB.Animate.vehicle ? '🏎️ Beep beep! Drive your creation with the joystick!' : '✨ Playtime! Fans spin, wings flap! (Add wheels to drive!)', 2600);
      }
    },
  };

  // ---------- camera orbit ----------
  // room is 46×30×14 — keep the camera INSIDE it (never through walls = no white screen)
  const CAM_BOX = { x: 20.5, z: 12.5, yMin: 1.6, yMax: 8.7 }; // yMax below the bulbs (9.6)
  const orbit = { theta: 0.5, phi: 0.95, radius: 16, target: new V3(0, 4, 0), drag: null };
  function applyCamera(){
    orbit.phi = THREE.MathUtils.clamp(orbit.phi, 0.32, 1.35);
    orbit.radius = THREE.MathUtils.clamp(orbit.radius, 5, 22);
    camera.position.set(
      orbit.target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
      orbit.target.y + orbit.radius * Math.cos(orbit.phi),
      orbit.target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta));
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -CAM_BOX.x, CAM_BOX.x);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -CAM_BOX.z, CAM_BOX.z);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, CAM_BOX.yMin, CAM_BOX.yMax);
    camera.lookAt(orbit.target);
  }
  function nudgeZoom(d){
    const from = orbit.radius, to = THREE.MathUtils.clamp(from + d, 5, 22);
    MB.Builder.addTween(0.3, k => { orbit.radius = from + (to - from) * (1 - Math.pow(1-k, 3)); });
    MB.Audio.pick();
  }
  function nudgeTurn(d){
    const from = orbit.theta, to = from + d;
    MB.Builder.addTween(0.45, k => { orbit.theta = from + (to - from) * (1 - Math.pow(1-k, 3)); });
    MB.Audio.pick();
  }

  // ---------- input ----------
  const pointers = new Map();
  let pinchDist = 0;
  function rayFrom(ev){
    const r = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera({ x: ((ev.clientX - r.left)/r.width)*2 - 1, y: -((ev.clientY - r.top)/r.height)*2 + 1 }, camera);
    return raycaster;
  }
  function onDown(ev){
    if (!started) return;
    renderer.domElement.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 2){
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      return;
    }
    hidePalette();
    const ray = rayFrom(ev);
    if (MB.Cleanup.active){ MB.Cleanup.pointerDown(ray); return; }
    // lamp bulbs: tap to switch on/off (works in any mode)
    {
      const hits = ray.intersectObjects(scene.children, true);
      if (hits.length){
        let o = hits[0].object;
        while (o && !o.userData.mbLamp) o = o.parent;
        if (o){
          const lamp = o.userData.mbLamp;
          lamp.on = !lamp.on;
          lamp.mesh.material.emissiveIntensity = lamp.on ? 1.0 : 0.02;
          if (lamp.light) lamp.light.intensity = lamp.on ? 0.5 : 0;
          MB.Audio.pick();
          ui.toast(lamp.on ? '💡 Light on!' : '🌙 Light off!', 1200);
          return;
        }
      }
    }
    if (MB.Animate.on){ // playtime: taps open doors / flip switches, otherwise orbit
      const hits = ray.intersectObjects(scene.children, true);
      for (const h of hits){
        let o = h.object;
        while (o && !o.userData.mbRoot) o = o.parent;
        if (o && o.userData.mbRoot && o.userData.mbRoot.def.hinges){ MB.Builder.toggleHinge(o.userData.mbRoot); return; }
        if (o) break;
      }
      orbit.drag = { x: ev.clientX, y: ev.clientY };
      return;
    }
    if (!MB.Builder.pointerDown(ray, ev)) orbit.drag = { x: ev.clientX, y: ev.clientY };
  }
  function onMove(ev){
    if (!started || !pointers.has(ev.pointerId)) { if (started && MB.Builder.grabbed) MB.Builder.pointerMove(rayFrom(ev), 0.016); return; }
    const p = pointers.get(ev.pointerId); p.x = ev.clientX; p.y = ev.clientY;
    if (pointers.size === 2){
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      orbit.radius *= pinchDist / Math.max(40, d); // inverted: spread = zoom in
      orbit.radius = THREE.MathUtils.clamp(orbit.radius, 6, 26);
      pinchDist = d;
      return;
    }
    if (orbit.drag){
      orbit.theta -= (ev.clientX - orbit.drag.x) * 0.0065;
      orbit.phi   -= (ev.clientY - orbit.drag.y) * 0.005;
      orbit.drag = { x: ev.clientX, y: ev.clientY };
      return;
    }
    MB.Builder.pointerMove(rayFrom(ev), 0.016);
  }
  function onUp(ev){
    pointers.delete(ev.pointerId);
    if (orbit.drag){ orbit.drag = null; return; }
    if (!started) return;
    MB.Builder.pointerUp(rayFrom(ev));
    updateSelBar();
  }

  // ---------- selection toolbar / palette ----------
  function updateSelBar(){
    const sel = MB.Builder.selected;
    $('selBar').style.display = (sel && !MB.Animate.on && !MB.Cleanup.active) ? 'flex' : 'none';
    if (sel){
      $('hingeBtn').style.display = sel.def.hinges ? 'inline-block' : 'none';
      $('hingeBtn').innerHTML = (sel.hingeOpen ? '🚪' : '🪟') + '<span>' + (sel.hingeOpen ? 'close' : 'open') + '</span>';
    } else hidePalette();
    $('pieceChip').textContent = '🧱 ' + MB.Builder.placedCount();
  }
  function hidePalette(){ $('palettePop').style.display = 'none'; }
  function buildPalette(){
    const pop = $('palettePop');
    for (const c of MB.CATALOG.palette){
      const s = document.createElement('div'); s.className = 'swatch'; s.style.background = c.hex; s.title = c.name;
      s.addEventListener('click', () => {
        if (MB.Builder.selected) MB.Builder.repaint(MB.Builder.selected, c.hex);
        hidePalette();
      });
      pop.appendChild(s);
    }
  }

  // ---------- photo → school bag ----------
  function takePhoto(){
    if (!MB.Bag.serializeTable().length){ ui.toast('Build something on the table first, then snap it! 📸', 2200); MB.Audio.no(); return; }
    const wasSel = MB.Builder.selected; MB.Builder.select(null);
    const item = MB.Bag.keep(renderer, scene, camera);
    MB.Builder.select(wasSel);
    if (!item) return;
    MB.Audio.camera();
    const fl = $('flash'); fl.style.display = 'block'; fl.style.opacity = 0.9;
    setTimeout(() => { fl.style.opacity = 0; fl.style.display = 'none'; }, 180);
    // photo flies into the bag
    const ph = $('flyPhoto'); ph.src = item.thumb; ph.style.display = 'block';
    ph.style.transition = 'none'; ph.style.left = '50%'; ph.style.top = '38%'; ph.style.transform = 'translate(-50%,-50%) scale(1.2)'; ph.style.opacity = 1;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ph.style.transition = 'all .9s cubic-bezier(.5,-0.2,.6,1)';
      ph.style.left = '58px'; ph.style.top = (window.innerHeight - 60) + 'px'; ph.style.transform = 'translate(-50%,-50%) scale(0.1)'; ph.style.opacity = 0.4;
    }));
    setTimeout(() => { ph.style.display = 'none'; MB.Bag.updateCount(); MB.Audio.sparkle(); ui.toast('🎒 Safe in your school bag! Take it out any time to keep building!', 2600); }, 950);
  }

  function openBag(){
    MB.Bag.renderGrid(item => {
      ui.hide('bagModal');
      const tableBusy = MB.Bag.serializeTable().length > 0;
      const doLoad = () => {
        const made = MB.Bag.rebuild(item, scene);
        MB.Audio.sparkle(); MB.Audio.fanfare();
        ui.toast('🎒→🧱 ' + item.name + ' is back on the table! Keep building on it!', 2800);
        updateSelBar();
      };
      if (tableBusy){
        ui.confirm('Swap builds? 🔁', 'The table is busy! Put those blocks back on the shelves and take out "' + item.name + '"? (Snap 📸 first if you want to keep the current one!)', () => {
          for (const b of [...MB.Magnet.blocks]) if (b.onTable && !b.parent) MB.Builder.flyToShelf(b);
          setTimeout(doLoad, 800);
        });
      } else doLoad();
    });
    MB.Bag.updateCount();
    ui.show('bagModal');
  }

  // ---------- hints ----------
  const HINTS = [
    '👆 Tap a block on a shelf to pick it up!',
    '🧲 Drag a block close to another — feel the magnet pull it in!',
    '🔄 Tap a placed block to turn, paint or copy it',
    '📸 Snap a photo to keep your build in your school bag 🎒',
    '▶️ Press play — wheels drive and fans spin!',
    '🪟 Windows and doors really open — tap one!',
    '🧹 Keep the playroom tidy — blocks belong on shelves or the table!',
  ];
  let hintIdx = 0;
  function rotateHints(){ ui.hint(HINTS[hintIdx % HINTS.length]); hintIdx++; }

  // ---------- audio mute wrapper ----------
  function wrapAudio(){
    for (const k of Object.keys(MB.Audio)){
      if (typeof MB.Audio[k] !== 'function' || k === 'init') continue;
      const orig = MB.Audio[k].bind(MB.Audio);
      MB.Audio[k] = (...a) => { if (ui.muted && !((k === 'bgm' || k === 'tidy') && a[0] === false)) return; return orig(...a); };
    }
  }

  // ---------- boot ----------
  function boot(){
    renderer = new THREE.WebGLRenderer({ canvas: $('gameCanvas'), antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#dff0ff'); // safety: never a stark white flash
    camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 200);
    room = MB.Playroom.build(scene);
    orbit.target.copy(room.tableCenter).add(new V3(0, 1.2, 0));
    applyCamera();

    MB.Builder.init({ scene, camera, room });
    MB.Builder.onChange = updateSelBar;
    MB.Animate.bindJoy();
    MB.Bag.updateCount();
    buildPalette();
    wrapAudio();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    let wheelAcc = 0;
    cv.addEventListener('wheel', ev => {
      if (MB.Builder.grabbed){ // scrolling while holding a block turns it
        wheelAcc += ev.deltaY;
        if (Math.abs(wheelAcc) > 80){ MB.Builder.rotateSel(); wheelAcc = 0; }
      } else orbit.radius += ev.deltaY * 0.02;
      ev.preventDefault();
    }, { passive:false });
    document.addEventListener('contextmenu', ev => ev.preventDefault());
    window.addEventListener('keydown', ev => {
      MB.Animate.keys[ev.code] = true;
      if (ev.code === 'KeyR') MB.Builder.rotateSel();
      if (ev.code === 'Escape'){ MB.Builder.select(null); updateSelBar(); hidePalette(); }
      if ((ev.code === 'Delete' || ev.code === 'Backspace') && MB.Builder.selected){ MB.Builder.flyToShelf(MB.Builder.selected); updateSelBar(); }
    });
    window.addEventListener('keyup', ev => { MB.Animate.keys[ev.code] = false; });

    // HUD buttons
    $('startBtn').addEventListener('click', () => {
      MB.Audio.init(); MB.Audio.bgm(true);
      $('titleScreen').style.display = 'none';
      $('hud').style.display = 'block';
      started = true;
      MB.Help.init();
      rotateHints(); setInterval(rotateHints, 13000);
      ui.toast('🧲 Welcome to the playroom! Tap any block on the shelves to start building!', 3200);
      // gentle camera intro sweep
      const th0 = orbit.theta + 2.2, r0 = 25;
      MB.Builder.addTween(2.2, k => {
        const e = 1 - Math.pow(1-k, 3);
        orbit.theta = th0 - 2.2*e + 0.5*0; orbit.radius = r0 - (r0-17)*e;
      });
    });
    $('homeBtn').addEventListener('click', () => ui.confirm('Leave the playroom? 🏠', 'Your school bag creations stay saved!', () => location.href = '/'));
    $('soundBtn').addEventListener('click', () => {
      ui.muted = !ui.muted;
      $('soundBtn').textContent = ui.muted ? '🔇' : '🔊';
      if (ui.muted){ MB.Audio.bgm(false); MB.Audio.tidy(false); } else MB.Audio.bgm(true);
    });
    $('tidyForMeBtn').addEventListener('click', () => MB.Cleanup.autoTidy());
    $('tidyNowBtn').addEventListener('click', () => {
      if (MB.Builder.strays().length) MB.Cleanup.start();
      else ui.toast('✨ The playroom is already tidy! Great job!', 2000);
    });
    $('clearBtn').addEventListener('click', () => {
      if (!MB.Magnet.blocks.length){ ui.toast('The table is already clear! 🧱', 1800); return; }
      ui.confirm('Start fresh? 🆕', 'All blocks go back to the shelves. (Snap 📸 first to keep your build!)', () => {
        for (const b of [...MB.Magnet.blocks]) if (!b.parent) MB.Builder.flyToShelf(b);
      });
    });
    $('photoBtn').addEventListener('click', takePhoto);
    $('bagBtn').addEventListener('click', openBag);
    $('bagClose').addEventListener('click', () => ui.hide('bagModal'));
    $('playBtn').addEventListener('click', () => ui.setPlay(!MB.Animate.on));
    $('helpBtn').addEventListener('click', () => MB.Help.openPicker());
    $('helpClose').addEventListener('click', () => ui.hide('helpModal'));
    $('rotBtn').addEventListener('click', () => MB.Builder.rotateSel());
    // view controls
    $('zoomInBtn').addEventListener('click', () => nudgeZoom(-3));
    $('zoomOutBtn').addEventListener('click', () => nudgeZoom(3));
    $('turnLBtn').addEventListener('click', () => nudgeTurn(Math.PI/4));
    $('turnRBtn').addEventListener('click', () => nudgeTurn(-Math.PI/4));
    // rotate the block in your hand (touch-friendly)
    $('holdRotBtn').addEventListener('pointerdown', ev => { ev.stopPropagation(); MB.Builder.rotateSel(); });
    // table colors
    const TABLE_COLORS = [
      { hex:'#7cb85c', chip:'🟩', name:'Grass Green' },
      { hex:'#5fa8dc', chip:'🟦', name:'Sky Blue' },
      { hex:'#a58fd8', chip:'🟪', name:'Lavender' },
      { hex:'#e8b04e', chip:'🟨', name:'Sunshine' },
      { hex:'#e08bb0', chip:'🌸', name:'Pink' },
      { hex:'#8d99a6', chip:'⬜', name:'Cloud Gray' },
      { hex:'#4f9d8c', chip:'🟢', name:'Deep Teal' },
    ];
    let tableIdx = Math.max(0, TABLE_COLORS.findIndex(c => c.hex === localStorage.getItem('mb_table_color')));
    const applyTable = () => {
      const c = TABLE_COLORS[tableIdx];
      if (MB.Playroom.setTableColor) MB.Playroom.setTableColor(c.hex);
      $('tableBtn').textContent = c.chip + ' Table';
      localStorage.setItem('mb_table_color', c.hex);
    };
    applyTable();
    $('tableBtn').addEventListener('click', () => {
      tableIdx = (tableIdx + 1) % TABLE_COLORS.length;
      applyTable();
      MB.Audio.sparkle();
      ui.toast('🛠️ Table color: ' + TABLE_COLORS[tableIdx].name + '!', 1500);
    });
    $('paintBtn').addEventListener('click', () => { const p = $('palettePop'); p.style.display = p.style.display === 'grid' ? 'none' : 'grid'; });
    $('hingeBtn').addEventListener('click', () => { MB.Builder.toggleHinge(); setTimeout(updateSelBar, 50); });
    $('dupBtn').addEventListener('click', () => MB.Builder.duplicateSel());
    $('shelfBtn').addEventListener('click', () => { if (MB.Builder.selected) MB.Builder.flyToShelf(MB.Builder.selected); });

    // loop
    let last = performance.now();
    (function loop(){
      requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last)/1000); last = now;
      const t = now/1000;
      if (started){
        MB.Builder.tick(dt);
        MB.Animate.keyTick();
        MB.Animate.tick(dt, t);
        MB.Cleanup.tick(t);
        MB.Help.tickUI();
        applyCamera();
        const hr = $('holdRotBtn');
        const want = MB.Builder.grabbed ? 'block' : 'none';
        if (hr.style.display !== want) hr.style.display = want;
      }
      renderer.render(scene, camera);
    })();
  }

  window.addEventListener('load', boot);
})();
