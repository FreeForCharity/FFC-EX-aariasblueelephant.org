// cleanup.js — the playroom stays tidy! too many blocks on the floor ⇒ tidy-up time
window.MB = window.MB || {};
(function(){
  const LIMIT = 10;          // strays allowed before tidy-up kicks in (lenient!)
  const AUTO_AFTER = 30;     // seconds — then the playroom tidies itself
  const C = { active:false, sparkles:[], auto:false, startedAt:0 };

  C.check = function(){
    if (C.active) return;
    if (MB.ui && MB.ui.calm) return; // calm mode: never nag about tidy-up on its own
    const strays = MB.Builder.strays();
    if (strays.length > LIMIT) C.start();
    else if (strays.length === LIMIT){
      MB.ui.toast('Uh oh, lots of blocks on the floor! 🧹 One more and it\'s tidy-up time!', 2600);
    }
  };
  MB.cleanupCheck = () => C.check();

  C.start = function(){
    if (C.active) return;
    const strays = MB.Builder.strays();
    if (!strays.length) return;
    const calm = MB.ui && MB.ui.calm;
    C.active = true;
    C.auto = false;
    C.startedAt = performance.now()/1000;
    if (!calm) MB.Builder.locked = true; // calm mode: manual tidy never locks input
    if (MB.Animate.on) MB.ui.setPlay(false);
    document.getElementById('tidyBanner').style.display = 'block';
    MB.Audio.tidy(true);
    // sparkle markers over each stray so they're easy to find
    for (const s of strays) addSparkle(s);
    MB.ui.toast('🧹 Tidy-up time! Tap the flashing blocks — or press 🪄 Tidy for me!', 3200);
  };

  function addSparkle(inst){
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent:true, opacity:0.95 }));
    sp.position.copy(inst.group.position).add(new THREE.Vector3(0, inst.def.size.h + 1.1, 0));
    sp.userData.follow = inst;
    MB.Builder.scene.add(sp);
    C.sparkles.push(sp);
  }

  C.tick = function(t){
    for (const sp of C.sparkles){
      const inst = sp.userData.follow;
      sp.position.set(inst.group.position.x, inst.group.position.y + inst.def.size.h + 1.1 + Math.sin(t*4)*0.25, inst.group.position.z);
      sp.scale.setScalar(0.8 + 0.3*Math.sin(t*6));
    }
    if (!C.active || C.auto) return;
    // flash the stray blocks themselves so they're easy to spot
    const pulse = 1 + 0.14*Math.sin(t*7);
    for (const s of MB.Builder.strays()) s.group.scale.setScalar(pulse);
    // after a while, the playroom kindly tidies itself
    if (performance.now()/1000 - C.startedAt > AUTO_AFTER) C.autoTidy();
  };

  // 🪄 fly every remaining stray home, one by one
  C.autoTidy = function(){
    if (!C.active || C.auto) return;
    C.auto = true;
    MB.ui.toast('🪄 Whoosh! The playroom is tidying itself — watch!', 2200);
    const next = () => {
      const s = MB.Builder.strays()[0];
      if (!s){ C.progress(); return; }
      s.group.scale.setScalar(1);
      removeSparkle(s);
      MB.Builder.flyToShelf(s);
      MB.Audio.sparkle();
      setTimeout(next, 450);
    };
    next();
  };

  // main routes taps here first while active; returns true if consumed
  C.pointerDown = function(ray){
    if (!C.active) return false;
    const strays = MB.Builder.strays();
    const hits = ray.intersectObjects(strays.map(s => s.group), true);
    if (hits.length){
      let o = hits[0].object;
      while (o && !o.userData.mbRoot) o = o.parent;
      if (o){
        const inst = o.userData.mbRoot;
        inst.group.scale.setScalar(1);
        removeSparkle(inst);
        MB.Builder.flyToShelf(inst);
        MB.Audio.sparkle();
        C.startedAt = performance.now()/1000; // kid is on it — reset the auto timer
        setTimeout(() => C.progress(), 700);
      }
      return true;
    }
    // calm mode: tidy sparkles keep showing, but building isn't blocked
    return !(MB.ui && MB.ui.calm);
  };

  function removeSparkle(inst){
    for (let i = C.sparkles.length-1; i >= 0; i--){
      if (C.sparkles[i].userData.follow === inst){
        MB.Builder.scene.remove(C.sparkles[i]); C.sparkles.splice(i,1);
      }
    }
  }

  C.progress = function(){
    const left = MB.Builder.strays().length;
    if (left <= 0){
      C.active = false;
      MB.Builder.locked = false;
      document.getElementById('tidyBanner').style.display = 'none';
      MB.Audio.tidy(false);
      MB.Audio.fanfare();
      if (MB.Stats) MB.Stats.bump('tidyUps');
      MB.ui.confetti();
      MB.ui.toast('✨ Sparkling clean! What a great helper! Back to building! 🧱', 2800);
      for (const sp of C.sparkles) MB.Builder.scene.remove(sp);
      C.sparkles.length = 0;
    } else {
      MB.ui.toast(left + (left === 1 ? ' block' : ' blocks') + ' to go! 🧹', 1400);
    }
  };

  MB.Cleanup = C;
})();
