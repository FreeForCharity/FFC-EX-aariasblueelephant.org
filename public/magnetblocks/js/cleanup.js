// cleanup.js — the playroom stays tidy! too many blocks on the floor ⇒ tidy-up time
window.MB = window.MB || {};
(function(){
  const LIMIT = 6;           // strays allowed before tidy-up kicks in
  const C = { active:false, sparkles:[] };

  C.check = function(){
    if (C.active) return;
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
    C.active = true;
    MB.Builder.locked = true;
    if (MB.Animate.on) MB.ui.setPlay(false);
    document.getElementById('tidyBanner').style.display = 'block';
    MB.Audio.tidy(true);
    // sparkle markers over each stray so they're easy to find
    for (const s of strays) addSparkle(s);
    MB.ui.toast('🧹 Tidy-up time! Tap each block on the floor to send it home!', 3000);
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
        removeSparkle(inst);
        MB.Builder.flyToShelf(inst);
        MB.Audio.sparkle();
        setTimeout(() => C.progress(), 700);
      }
    }
    return true; // swallow all input during tidy time
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
