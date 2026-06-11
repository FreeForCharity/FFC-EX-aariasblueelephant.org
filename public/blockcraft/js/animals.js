/* Aaria's Block Craft 3D — voxel animals: models, wandering, emotions */
ABC.animals = (function () {
  const list = [];          // {group, def, name, state, emotion, ...}
  let scene = null;
  let nameIdx = 0;

  function mat(color) { return new THREE.MeshLambertMaterial({ color }); }
  function bx(group, w,h,d, x,y,z, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color));
    m.position.set(x,y,z);
    group.add(m);
    return m;
  }

  /* ---------- voxel models (all face +Z forward) ---------- */
  const builders = {
    bunny(g, d) {
      bx(g, .9,.8,1.2,  0,.5,0,   d.body);          // body
      bx(g, .7,.7,.7,   0,1.15,.6, d.body);          // head
      bx(g, .18,.7,.18, -.2,1.8,.55, d.body);        // ears
      bx(g, .18,.7,.18,  .2,1.8,.55, d.body);
      bx(g, .14,.5,.14, -.2,1.78,.55, d.accent);
      bx(g, .14,.5,.14,  .2,1.78,.55, d.accent);
      bx(g, .3,.3,.3,   0,.55,-.65, '#ffffff');      // tail
      face(g, .72, 1.18, .96);
    },
    cat(g, d) {
      bx(g, .8,.7,1.3,  0,.45,0,  d.body);
      bx(g, .7,.65,.65, 0,1.0,.7, d.body);
      bx(g, .2,.3,.15, -.22,1.45,.7, d.body);        // ears
      bx(g, .2,.3,.15,  .22,1.45,.7, d.body);
      bx(g, .15,.15,.9, 0,.75,-.9, d.body);          // tail
      bx(g, .8,.18,.18, 0,.85,1.0, d.accent);        // snout stripe
      legs(g, d, .3, .5);
      face(g, .72, 1.05, 1.03);
    },
    puppy(g, d) {
      bx(g, .9,.8,1.4,  0,.55,0,  d.body);
      bx(g, .8,.75,.7,  0,1.15,.85, d.body);
      bx(g, .25,.5,.18, -.32,1.3,.95, d.accent);     // floppy ears
      bx(g, .25,.5,.18,  .32,1.3,.95, d.accent);
      bx(g, .35,.3,.35, 0,1.0,1.25, d.accent);       // snout
      bx(g, .15,.15,.7, 0,.95,-.85, d.body);         // tail (waggy)
      legs(g, d, .35, .55);
      face(g, .82, 1.25, 1.21);
    },
    butterfly(g, d) {
      bx(g, .18,.18,.8, 0,1.6,0, '#5c4500');         // body (floats)
      const w1 = bx(g, 1.0,.06,.7, -.55,1.62,0, d.body);
      const w2 = bx(g, 1.0,.06,.7,  .55,1.62,0, d.body);
      bx(g, .5,.07,.4, -.5,1.63,-.45, d.accent);
      bx(g, .5,.07,.4,  .5,1.63,-.45, d.accent);
      g.userData.wings = [w1, w2];
    },
    trex(g, d) {
      bx(g, 1.0,1.2,1.8, 0,1.4,0, d.body);           // body
      bx(g, .9,.9,1.1,  0,2.5,1.0, d.body);          // head
      bx(g, .7,.4,.6,   0,2.3,1.7, d.body);          // jaw
      bx(g, .75,.12,.62, 0,2.52,1.72, '#fff');       // teeth line
      bx(g, .4,1.2,.4, -.3,.6,-.2, d.accent);        // legs
      bx(g, .4,1.2,.4,  .3,.6,-.2, d.accent);
      bx(g, .22,.45,.22, -.5,1.7,.8, d.accent);      // tiny arms
      bx(g, .22,.45,.22,  .5,1.7,.8, d.accent);
      bx(g, .5,.5,1.4,  0,1.3,-1.5, d.body);         // tail
      bx(g, .3,.3,.9,   0,1.2,-2.5, d.accent);
      face(g, .92, 2.65, 1.56);
    },
    trice(g, d) {
      bx(g, 1.2,1.0,2.0, 0,.95,0, d.body);
      bx(g, 1.0,.9,.9,  0,1.2,1.3, d.body);
      bx(g, 1.4,1.1,.25, 0,1.7,1.0, d.accent);       // frill
      bx(g, .15,.15,.6, -.3,1.5,1.8, '#fff');        // horns
      bx(g, .15,.15,.6,  .3,1.5,1.8, '#fff');
      bx(g, .12,.12,.4,  0,1.05,1.85, '#fff');
      legs(g, d, .5, .9, 1.5);
      bx(g, .4,.4,1.0, 0,.9,-1.4, d.body);           // tail
      face(g, 1.02, 1.3, 1.76);
    },
    longneck(g, d) {
      bx(g, 1.3,1.2,2.4, 0,1.2,0, d.body);
      bx(g, .5,2.4,.5,  0,3.0,1.0, d.body);          // neck
      bx(g, .7,.55,.9,  0,4.3,1.2, d.body);          // head
      legs(g, d, .5, 1.0, 1.6);
      bx(g, .5,.5,1.8,  0,1.1,-2.0, d.body);         // tail
      bx(g, .3,.3,1.2,  0,1.0,-3.3, d.accent);
      face(g, .72, 4.35, 1.66);
    },
    mammoth(g, d) {
      bx(g, 1.4,1.3,2.2, 0,1.5,0, d.body);
      bx(g, 1.0,1.0,1.0, 0,2.0,1.4, d.body);
      bx(g, .3,1.0,.3,  0,1.4,1.9, d.accent);        // trunk
      bx(g, .15,.5,.6, -.45,1.5,1.8, '#f6f0e0');     // tusks
      bx(g, .15,.5,.6,  .45,1.5,1.8, '#f6f0e0');
      bx(g, .6,.5,.2, -.6,2.2,1.4, d.accent);        // ears
      bx(g, .6,.5,.2,  .6,2.2,1.4, d.accent);
      legs(g, d, .55, 1.0, 1.6);
      face(g, .92, 2.15, 1.91);
    },
    elephant(g, d) {                                  /* Bella 💙 — the Blue Elephant mascot */
      bx(g, 1.4,1.3,2.1, 0,1.45,0, d.body);
      bx(g, 1.1,1.05,1.0, 0,2.0,1.35, d.body);       // head
      bx(g, .32,1.2,.32, 0,1.25,1.85, d.body);       // trunk
      bx(g, .3,.3,.45,   0,.65,2.0,  d.body);        // trunk tip curls forward
      bx(g, .85,.85,.18, -.75,2.1,1.3, d.accent);    // big flappy ears
      bx(g, .85,.85,.18,  .75,2.1,1.3, d.accent);
      bx(g, .2,.2,.5,    0,1.6,-1.25, d.accent);     // tail
      legs(g, d, .5, .9, 1.55);
      face(g, 1.0, 2.15, 1.86);
      // tiny rainbow infinity charm on the chest (non-profit symbol)
      const charm = bx(g, .5,.22,.06, 0,1.6,1.06, '#ff5e7e');
      charm.material = new THREE.MeshLambertMaterial({ color:0xffffff, emissive:0xb197fc, emissiveIntensity:.5 });
    },
    puzzleEle(g, d) {                                 /* rainbow puzzle elephant from the logo 🌈 */
      const pal = ['#fa5252','#ffa94d','#ffd43b','#69db7c','#4dabf7','#b197fc'];
      let p = 0; const next = () => pal[(p++) % pal.length];
      // patchwork body: 2x2x3 grid of colored boxes
      for (let x=-1;x<=0;x++) for (let y=0;y<=1;y++) for (let z=-1;z<=1;z++)
        bx(g, .72,.68,.72, x*.7+.35, .95+y*.65, z*.7, next());
      bx(g, 1.0,.95,.9, 0,1.85,1.15, next());          // head
      bx(g, .3,1.1,.3,  0,1.15,1.6, next());           // trunk
      bx(g, .75,.75,.16, -.65,1.95,1.1, next());       // ears
      bx(g, .75,.75,.16,  .65,1.95,1.1, next());
      legs(g, d, .42, .65, 1.4);
      face(g, .9, 2.0, 1.61);
    },
  };
  function legs(g, d, w, h, spread) {
    const s = spread || 1.0;
    [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz]) =>
      bx(g, w,h,w, sx*0.35, h/2, sz*s*0.5, d.accent));
  }
  function face(g, w, y, z) {
    // simple friendly eyes
    bx(g, .12,.12,.05, -w*0.25, y, z, '#222');
    bx(g, .12,.12,.05,  w*0.25, y, z, '#222');
  }

  /* ---------- emotion bubble sprites ---------- */
  function makeBubble(emoji) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    g.beginPath(); g.arc(64,56,46,0,7); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill();
    g.beginPath(); g.moveTo(50,98); g.lineTo(64,122); g.lineTo(78,98); g.fill();
    g.font = '56px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(emoji, 64, 58);
    const tex = new THREE.CanvasTexture(cv);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sp.scale.set(2.2, 2.2, 1);
    return sp;
  }

  /* ---------- spawning ---------- */
  function spawn(kind, x, z, fixedName) {
    const d = ABC.ANIMAL_DEFS[kind];
    const g = new THREE.Group();
    builders[kind](g, d);
    g.scale.setScalar(d.size * 0.55);
    g.position.set(x, 1, z);
    g.traverse(o => { if (o.isMesh) o.userData.animalRef = null; });
    scene.add(g);
    const a = {
      group: g, def: d, kind,
      name: fixedName || ABC.ANIMAL_NAMES[(nameIdx++) % ABC.ANIMAL_NAMES.length],
      state: 'idle', t: Math.random()*10, target: null, speed: d.speed,
      emotion: null, bubble: null, baseY: d.fly ? 1.5 : 1,
      happyUntil: 0,
    };
    g.traverse(o => { if (o.isMesh) o.userData.animalRef = a; });
    list.push(a);
    return a;
  }

  function spawnAll(sc) {
    scene = sc;
    // Bella the Blue Elephant — guide, stays near spawn
    const bella = spawn('elephant', 4, -8, 'Bella');
    bella.isGuide = true; bella.home = {x:4, z:-8}; bella.range = 6;
    // cute friends near spawn
    spawn('bunny', -5, -10);  spawn('bunny', 14, 6);
    spawn('cat', 6, 8);       spawn('puppy', -8, 4);
    spawn('butterfly', 0, 2); spawn('butterfly', 10, -4);
    // prehistoric pals roam a bit further out
    spawn('trex', 26, 20);    spawn('trice', -24, 22);
    spawn('longneck', 30, -20); spawn('mammoth', -28, -24);
    return list;
  }

  function spawnSurprise() {
    const kinds = Object.keys(ABC.ANIMAL_DEFS).filter(k=>!ABC.ANIMAL_DEFS[k].special);
    const k = kinds[Math.floor(Math.random()*kinds.length)];
    const ang = Math.random()*Math.PI*2;
    const px = ABC.player ? ABC.player.position.x : 0;
    const pz = ABC.player ? ABC.player.position.z : 0;
    const a = spawn(k, Math.max(-40,Math.min(40,px+Math.cos(ang)*8)), Math.max(-40,Math.min(40,pz+Math.sin(ang)*8)));
    return a;
  }

  /* ---------- emotions ---------- */
  function setEmotion(a, emo) {
    clearEmotion(a);
    a.emotion = emo;
    a.bubble = makeBubble(emo.emoji);
    // compensate for group scale so the bubble floats just above the model
    const s = a.def.size * 0.55;
    const top = new THREE.Box3().setFromObject(a.group).max.y;  // world units
    a.bubble.position.y = (top - a.group.position.y) / s + 1.4 / s;
    a.bubble.scale.set(2.4 / s, 2.4 / s, 1);
    a.group.add(a.bubble);
  }
  function clearEmotion(a) {
    if (a.bubble) { a.group.remove(a.bubble); a.bubble = null; }
    a.emotion = null;
  }
  function activeEmotionCount() { return list.filter(a=>a.emotion).length; }
  function randomCalmAnimal() {
    const c = list.filter(a=>!a.emotion && !a.isGuide);
    return c.length ? c[Math.floor(Math.random()*c.length)] : null;
  }

  /* ---------- per-frame update ---------- */
  function update(dt, time) {
    for (const a of list) {
      a.t += dt;
      const g = a.group;
      // pick wander targets
      if (!a.target || g.position.distanceTo(a.target) < 0.5) {
        if (Math.random() < 0.01 || !a.target) {
          const hx = a.home ? a.home.x : g.position.x;
          const hz = a.home ? a.home.z : g.position.z;
          const r = a.range || 12;
          a.target = new THREE.Vector3(
            Math.max(-46, Math.min(46, hx + (Math.random()*2-1)*r)),
            a.baseY,
            Math.max(-46, Math.min(46, hz + (Math.random()*2-1)*r)));
        }
      }
      if (a.target) {
        const dir = a.target.clone().sub(g.position); dir.y = 0;
        const dist = dir.length();
        if (dist > 0.4) {
          dir.normalize();
          g.position.addScaledVector(dir, a.speed * dt);
          const want = Math.atan2(dir.x, dir.z);
          let dy = want - g.rotation.y;
          while (dy > Math.PI) dy -= Math.PI*2;
          while (dy < -Math.PI) dy += Math.PI*2;
          g.rotation.y += dy * Math.min(1, dt*4);
        }
      }
      // bob / hop / flutter
      if (a.def.fly) {
        g.position.y = a.baseY + Math.sin(a.t*2.2)*0.5 + 0.8;
        const wings = g.userData.wings;
        if (wings) { wings[0].rotation.z = Math.sin(a.t*14)*0.7; wings[1].rotation.z = -Math.sin(a.t*14)*0.7; }
      } else if (a.def.hop) {
        g.position.y = a.baseY + Math.abs(Math.sin(a.t*4))*0.35;
      } else {
        g.position.y = a.baseY + Math.abs(Math.sin(a.t*2))*0.06;
      }
      // celebration wiggle
      if (a.happyUntil > time) g.rotation.y += Math.sin(a.t*12)*0.06;
      if (a.bubble) a.bubble.material.rotation = Math.sin(a.t*2)*0.08;
    }
  }

  function celebrate(a, time) { a.happyUntil = time + 2.5; }
  function meshTargets() {
    const out = [];
    for (const a of list) a.group.traverse(o => { if (o.isMesh) out.push(o); });
    return out;
  }

  return { list, spawnAll, spawn, spawnSurprise, update, setEmotion, clearEmotion,
           activeEmotionCount, randomCalmAnimal, celebrate, meshTargets };
})();
