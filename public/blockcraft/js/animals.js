/* Aaria's Block Craft 3D — voxel animals: models, wandering, emotions */
ABC.animals = (function () {
  const list = [];          // {group, def, name, state, emotion, ...}
  let scene = null;
  let nameIdx = 0;

  /* ---------- 🧸 modern fur ----------
     Flat single-color parts are what make the animals read as plastic toys.
     On modern, every animal color becomes a little painted FUR texture — a
     tinted base with hundreds of short, mostly-downward strokes plus soft
     dapples — so bodies read as felt/plush fur under the PBR sun. One texture
     + material cached per color. Smooth/Classic keep plain Lambert colors. */
  const _furTex = new Map(), _furMat = new Map();
  function shadeHex(hex, k) {                    // '#rgb'/'#rrggbb' lightened (+k) / darkened (−k)
    let h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + k))));
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  }
  function furTexture(color) {
    let tex = _furTex.get(color);
    if (tex) return tex;
    const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.fillStyle = color; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 12; i++) {               // soft tonal dapples
      g.globalAlpha = 0.12;
      g.fillStyle = shadeHex(color, (i % 2 ? 0.18 : -0.18));
      g.beginPath(); g.arc(Math.random() * S, Math.random() * S, 16 + Math.random() * 28, 0, 7); g.fill();
    }
    for (let i = 0; i < 1100; i++) {             // the fur itself — bold enough to read in-game
      const x = Math.random() * S, y = Math.random() * S, len = 5 + Math.random() * 10;
      const a = Math.PI / 2 + (Math.random() - 0.5) * 0.9;   // mostly downward, like real coat lie
      g.globalAlpha = 0.22 + Math.random() * 0.26;
      g.strokeStyle = shadeHex(color, (Math.random() - 0.45) * 0.75);
      g.lineWidth = 0.8 + Math.random() * 1.4;
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 1.5, y + Math.sin(a) * len * 0.5,
                         x + Math.cos(a) * len, y + Math.sin(a) * len);   // gentle curl
      g.stroke();
    }
    g.globalAlpha = 1;
    tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);                        // finer fur across big body parts
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    _furTex.set(color, tex);
    return tex;
  }
  function mat(color) {
    if (!ABC.MODERN || typeof color !== 'string' || color[0] !== '#') {
      return new THREE.MeshLambertMaterial({ color });
    }
    let m = _furMat.get(color);                  // materials are never mutated per-animal → share
    if (!m) { m = new THREE.MeshLambertMaterial({ map: furTexture(color) }); _furMat.set(color, m); }
    return m;
  }
  function sp(group, r, x, y, z, color, sy) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat(color));
    m.position.set(x, y, z);
    if (sy) m.scale.y = sy;
    group.add(m);
    return m;
  }
  /* modern: every box body-part becomes a rounded plush shape (vendored
     RoundedBoxGeometry) so animals read as soft toys, not LEGO bricks.
     Same dims recur across every bunny/puppy/etc, so cache one geometry
     per unique size. Smooth/Classic keep the original crisp boxes. */
  const _geoCache = new Map();
  function boxGeo(w, h, d) {
    const lib = ABC.MODERN && window.ABC_MODERN_LIB;
    if (!lib || !lib.RoundedBoxGeometry) return new THREE.BoxGeometry(w, h, d);
    const k = w + ',' + h + ',' + d;
    let g = _geoCache.get(k);
    if (!g) { g = new lib.RoundedBoxGeometry(w, h, d, 4, Math.min(w, h, d) * 0.34); _geoCache.set(k, g); }
    return g;
  }
  function bx(group, w,h,d, x,y,z, color) {
    const m = new THREE.Mesh(boxGeo(w,h,d), mat(color));
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
    capy(g, d) {                       /* a big round chonky capybara ball */
      sp(g, 1.05, 0, 1.05, 0, d.body, 0.92);          // ball body
      sp(g, .55, 0, 1.35, .85, d.body);                // round snoot
      sp(g, .16, -.2, 1.65, 1.28, '#3a2a18');          // nose
      bx(g, .18,.22,.1, -.45,1.95,.55, d.accent);      // tiny ears
      bx(g, .18,.22,.1,  .45,1.95,.55, d.accent);
      [[-.5,.45],[.5,.45],[-.5,-.45],[.5,-.45]].forEach(([x,z]) =>
        sp(g, .2, x, .18, z, d.accent));               // stubby ball feet
      face(g, .9, 1.55, 1.18);
    },
    penguin(g, d) {                    /* a round penguin like a bowling pin ball */
      sp(g, .85, 0, .95, 0, d.body, 1.05);             // ball body
      sp(g, .62, 0, 1.05, .32, d.accent, 1.0);         // white tummy
      sp(g, .5, 0, 1.95, .1, d.body);                  // round head
      bx(g, .3,.12,.2, 0, 1.85, .58, '#ffa94d');       // beak
      sp(g, .3, -.8, 1.0, 0, d.body, 1.4);             // flippers
      sp(g, .3,  .8, 1.0, 0, d.body, 1.4);
      [[-.3],[.3]].forEach(([x]) => bx(g, .35,.12,.45, x, .08, .15, '#ffa94d'));
      face(g, .56, 2.05, .55);
    },
    panda(g, d) {                      /* a perfectly round panda dumpling */
      sp(g, 1.0, 0, 1.0, 0, d.body, 0.95);             // ball body
      sp(g, .68, 0, 1.95, .25, d.body);                // round head
      sp(g, .2, -.4, 2.5, .2, d.accent);               // black ears
      sp(g, .2,  .4, 2.5, .2, d.accent);
      sp(g, .17, -.26, 2.0, .78, d.accent);            // eye patches
      sp(g, .17,  .26, 2.0, .78, d.accent);
      sp(g, .12, 0, 1.78, .9, d.accent);               // nose
      [[-.55,.4],[.55,.4],[-.55,-.4],[.55,-.4]].forEach(([x,z]) =>
        sp(g, .26, x, .2, z, d.accent));               // chubby ball paws
      face(g, .5, 2.02, .93);
    },
    puzzleEle(g, d) {                               /* rainbow puzzle elephant from the logo 🌈 */
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
    // simple friendly eyes — modern: round bead eyes, nudged out a touch so
    // they sit proud of the rounded cheek instead of sinking into it
    if (ABC.MODERN) {
      sp(g, .075, -w*0.25, y, z + .04, '#222');
      sp(g, .075,  w*0.25, y, z + .04, '#222');
      return;
    }
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
    ABC.world.entityShadows(g);
    list.push(a);
    return a;
  }

  function spawnAll(sc) {
    scene = sc;
    // Nilu the Blue Elephant — guide, stays near spawn
    const bella = spawn('elephant', 4, -8, 'Nilu');
    bella.isGuide = true; bella.home = {x:4, z:-8}; bella.range = 6;
    // shops (incl. vendors) are placed by ABC.shops after spawnAll
    // a few gentle friends near home — the parks add their own as you explore
    spawn('bunny', -6, -10); spawn('butterfly', 2, 4); spawn('puppy', 8, 6);
    if (ABC.space){                                   // 📏 friends need wiggle room
      ABC.space.reserve(4, -8, 4);                    // Nilu the guide
      for (const [x, z] of [[-6, -10], [2, 4], [8, 6]]) ABC.space.reserve(x, z, 2.5);
      ABC.space.reserve(0, 0, 5);                     // the spawn clearing itself
    }
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
            Math.max(-(ABC.world.SIZE-2), Math.min(ABC.world.SIZE-2, hx + (Math.random()*2-1)*r)),
            a.baseY,
            Math.max(-(ABC.world.SIZE-2), Math.min(ABC.world.SIZE-2, hz + (Math.random()*2-1)*r)));
        }
      }
      if (a.target) {
        const dir = a.target.clone().sub(g.position); dir.y = 0;
        const dist = dir.length();
        if (dist > 0.4) {
          dir.normalize();
          // walls stop walking animals — they politely pick a new path
          const tx = g.position.x + dir.x * (a.speed * dt + 0.5);
          const tz = g.position.z + dir.z * (a.speed * dt + 0.5);
          if (!a.def.fly && (ABC.world.get(Math.floor(tx), 1, Math.floor(tz)) ||
                             ABC.world.get(Math.floor(tx), 2, Math.floor(tz)))) {
            a.target = null;
          } else
          g.position.addScaledVector(dir, a.speed * dt);
          const want = Math.atan2(dir.x, dir.z);
          let dy = want - g.rotation.y;
          while (dy > Math.PI) dy -= Math.PI*2;
          while (dy < -Math.PI) dy += Math.PI*2;
          g.rotation.y += dy * Math.min(1, dt*4);
        }
      }
      // follow the land: stand on top of hills, mountains, sand…
      let gy = 1;
      const tb = ABC.world.topBlock ? ABC.world.topBlock(Math.floor(g.position.x), Math.floor(g.position.z)) : null;
      if (tb) gy = tb.y + 1;
      a.groundY = a.groundY == null ? gy : a.groundY + (gy - a.groundY) * Math.min(1, dt * 6);
      // bob / hop / flutter
      if (a.def.fly) {
        g.position.y = a.groundY + Math.sin(a.t*2.2)*0.5 + 1.6;
        const wings = g.userData.wings;
        if (wings) { wings[0].rotation.z = Math.sin(a.t*14)*0.7; wings[1].rotation.z = -Math.sin(a.t*14)*0.7; }
      } else if (a.def.hop) {
        g.position.y = a.groundY + Math.abs(Math.sin(a.t*4))*0.35;
      } else if (a.def.round) {
        // round friends waddle-roll side to side as they toddle
        g.position.y = a.groundY + Math.abs(Math.sin(a.t*3))*0.1;
        g.rotation.z = Math.sin(a.t*3)*0.08;
      } else {
        g.position.y = a.groundY + Math.abs(Math.sin(a.t*2))*0.06;
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
