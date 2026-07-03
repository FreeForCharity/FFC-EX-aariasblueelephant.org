/* Aaria's Block Craft 3D — activities: build projects, emotions, slime lab, oreo kitchen */
ABC.activities = (function () {
  const $ = (id) => document.getElementById(id);
  const ui = () => ABC.ui;

  /* =====================================================
     BUILD PROJECTS (Home / Car / Rocket & Launch Pad)
     ===================================================== */
  let blueprints = null;
  let active = null;   // { bp, stageIdx, ghosts:Map(key->mesh), ghostGroup, total, placed }
  let ghostMat = null;

  function ensureBlueprints() { if (!blueprints) blueprints = ABC.buildBlueprints(); return blueprints; }

  function showBuildMenu() {
    ensureBlueprints();
    const cards = Object.values(blueprints).map(bp => ({
      ico: bp.emoji + (ABC.state.completed.has(bp.id) ? '✅' : ''),
      label: bp.title.replace(/^[^ ]+ /,''),
      bp,
    }));
    ui().pickCard('Build Projects 🏗️', 'What shall we build together? Pick a project!', cards, (c) => {
      ui().closeDialog();
      startProject(c.bp);
    }, '🏗️');
  }

  /* a clear, ground-level building spot a few blocks in front of the player */
  function siteInFront() {
    const cam = ABC.player;
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const x = Math.round(cam.position.x + dir.x * 7);
    const z = Math.round(cam.position.z + dir.z * 7);
    const tb = ABC.world.topBlock(x, z);
    return { x, z, y: tb ? tb.y : 0 };     // y = ground top; blocks sit on y+1
  }

  function startProject(bp) {
    if (active) quitProject(true);
    const prompts = ABC.PROJECT_PROMPTS[bp.id];
    ui().askExpressive(prompts.intro, () => {
      active = { bp, site: siteInFront(), stageIdx: -1, ghosts: new Map(),
        ghostGroup: new THREE.Group(), placed: 0, total: 0 };
      ABC.world.getScene().add(active.ghostGroup);
      if (!ghostMat) ghostMat = new THREE.MeshLambertMaterial({
        color: 0xffe066, transparent: true, opacity: 0.35, depthWrite: false });
      $('projectPanel').style.display = 'block';
      $('projTitle').textContent = bp.title;
      nextStage();
      ui().bellaSays(`Right here! Tap the golden glowing spots to build! ✨ Or press Finish for magic help.`, 5000);
    }, { stars: 1 });
  }

  function nextStage() {
    const a = active; if (!a) return;
    a.stageIdx++;
    if (a.stageIdx >= a.bp.stages.length) { completeProject(); return; }
    const st = a.bp.stages[a.stageIdx];
    $('projStage').textContent = `Stage ${a.stageIdx+1}/${a.bp.stages.length}: ${st.name}`;
    a.placed = 0; a.total = 0;
    const geo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    // dedupe cells (later entries win, e.g. headlights over chassis)
    const cellMap = new Map();
    for (const c of st.cells) cellMap.set(c.x + ',' + c.y + ',' + c.z, c);
    for (const c of cellMap.values()) {
      const wx = a.site.x + c.x, wy = a.site.y + 1 + c.y, wz = a.site.z + c.z;
      if (ABC.world.get(wx, wy, wz) === c.t) continue;        // already there
      const m = new THREE.Mesh(geo, ghostMat);
      m.position.set(wx + 0.5, wy + 0.5, wz + 0.5);
      m.userData.ghost = { x: wx, y: wy, z: wz, t: c.t };
      a.ghostGroup.add(m);
      a.ghosts.set(ABC.world.key(wx, wy, wz), m);
      a.total++;
    }
    updateBar();
    if (a.total === 0) { stageDone(); return; }
  }

  function updateBar() {
    const a = active; if (!a) return;
    const pct = a.total ? Math.round(a.placed / a.total * 100) : 100;
    $('projBarInner').style.width = pct + '%';
    $('projCount').textContent = a.placed + '/' + a.total;   // BlockCraft-style counter
  }

  /* Called from main on click; returns true if the click was handled */
  function tryFillGhost(mesh) {
    const a = active; if (!a || !mesh.userData.ghost) return false;
    const g = mesh.userData.ghost;
    // Kid-friendly: auto-use the right block, no wrong answers while building
    if (ui().getSelected() !== g.t && ABC.BLOCK_DEFS[g.t]) {
      ui().toast(`${ABC.BLOCK_DEFS[g.t].emoji} This spot needs <b>${ABC.BLOCK_DEFS[g.t].name}</b> — I grabbed it for you!`, 2300);
    }
    fillGhost(mesh);
    return true;
  }

  function fillGhost(mesh) {
    const a = active; if (!a) return;
    const g = mesh.userData.ghost;
    ABC.world.set(g.x, g.y, g.z, g.t);
    ABC.world.flush();
    a.ghostGroup.remove(mesh);
    a.ghosts.delete(ABC.world.key(g.x, g.y, g.z));
    a.placed++;
    ABC.audio.sfx.pop();
    updateBar();
    if (a.placed >= a.total) stageDone();
  }

  let magicTimer = null;
  function magicFill() {
    const a = active; if (!a || magicTimer) return;
    const meshes = [...a.ghosts.values()];
    let i = 0;
    magicTimer = setInterval(() => {
      if (!active || i >= meshes.length) { clearInterval(magicTimer); magicTimer = null; return; }
      fillGhost(meshes[i++]);
    }, 90);
  }

  function stageDone() {
    const a = active; if (!a) return;
    ABC.audio.sfx.fanfare();
    ui().confetti(20);
    const prompts = ABC.PROJECT_PROMPTS[a.bp.id];
    const p = prompts.stages[a.stageIdx];
    setTimeout(() => {
      ui().askExpressive(p, () => {
        ABC.quests.mark('build');
        if (a.stageIdx === a.bp.stages.length - 1) nextStage();   // triggers complete
        else nextStage();
      }, { stars: 2 });
    }, 700);
  }

  function completeProject() {
    const a = active; if (!a) return;
    const bp = a.bp, site = a.site;
    ABC.state.completed.add(bp.id);
    cleanupProject();
    ui().confetti(50);
    ABC.audio.sfx.fanfare();
    ABC.saveSoon && ABC.saveSoon();
    if (bp.id === 'rocket') {
      setTimeout(() => ui().askExpressive(ABC.PROJECT_PROMPTS.rocket.launch, () => launchRocket(bp, site), { stars: 3 }), 600);
    } else if (bp.id === 'car') {
      ABC.audio.sfx.honk();
      ui().bellaSays('BEEP BEEP! Your rainbow car looks amazing! 🚗🌈', 5000);
      const a2 = ABC.animals.spawn('puppy', site.x - 2, site.z + 5);
      ui().toast(`🐶 ${a2.name} the Puppy ran over to admire your car!`, 4200);
    } else if (bp.id === 'home') {
      const a2 = ABC.animals.spawn('bunny', site.x + 3, site.z - 3);
      ui().bellaSays(`Your cozy home is beautiful! ${a2.name} the Bunny wants to move in! 🐰🏠`, 5500);
    } else if (bp.id === 'elephant') {
      const a2 = ABC.animals.spawn('puzzleEle', site.x - 4, site.z + 6);
      ui().bellaSays(`You built ME a friend! 🐘💙 ${a2.name} the Rainbow Elephant came to say thank you. Together we are Building a New Inclusive World!`, 7000);
      ui().addHearts(2);
    } else {
      ui().bellaSays(`Hooray! Your ${bp.title.replace(/^[^ ]+ /,'')} is finished! 🎉`, 5000);
    }
  }

  function cleanupProject() {
    if (!active) return;
    if (magicTimer) { clearInterval(magicTimer); magicTimer = null; }
    ABC.world.getScene().remove(active.ghostGroup);
    active = null;
    $('projectPanel').style.display = 'none';
  }
  function quitProject(silent) {
    cleanupProject();
    if (!silent) ui().toast('Project paused — you can start it again any time! 💛', 3000);
  }

  /* ---- Rocket launch animation ---- */
  function launchRocket(bp, site) {
    const scene = ABC.world.getScene();
    // collect rocket cells (stages 1 & 2 = body+fins, nose)
    const cells = [...bp.stages[1].cells, ...bp.stages[2].cells];
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (const c of cells) {
      const wx = site.x + c.x, wy = site.y + 1 + c.y, wz = site.z + c.z;
      if (ABC.world.get(wx, wy, wz) !== c.t) continue;
      ABC.world.remove(wx, wy, wz);
      const m = new THREE.Mesh(geo, ABC.world.materials[c.t]);
      m.position.set(wx + 0.5, wy + 0.5, wz + 0.5);
      group.add(m);
    }
    ABC.world.flush();
    scene.add(group);
    ABC.audio.sfx.whoosh();
    ui().bellaSays('3… 2… 1… BLAST OFF!! 🚀✨', 4000);

    const smoke = [];
    const smokeMat = new THREE.MeshLambertMaterial({ color: 0xdddddd, transparent: true, opacity: 0.8 });
    const t0 = performance.now();
    const anim = () => {
      const t = (performance.now() - t0) / 1000;
      group.position.y = Math.pow(t, 2.2) * 2.2;
      group.rotation.y = t * 0.4;
      if (t > 0.3 && smoke.length < 60 && Math.random() < 0.6) {
        const p = new THREE.Mesh(geo, smokeMat.clone());
        const s = 0.3 + Math.random() * 0.7;
        p.scale.setScalar(s);
        p.position.set(site.x + 1.5 + (Math.random()*3-1.5), site.y + 1.5 + group.position.y * 0.3, site.z + 1.5 + (Math.random()*3-1.5));
        p.userData.vy = Math.random() * 1.5;
        scene.add(p); smoke.push(p);
      }
      for (const p of smoke) { p.position.y += p.userData.vy * 0.03; p.material.opacity *= 0.985; }
      if (t < 7) requestAnimationFrame(anim);
      else {
        scene.remove(group);
        smoke.forEach(p => scene.remove(p));
        // rocket gently lands back, ready to launch again
        for (const c of cells) ABC.world.set(site.x + c.x, site.y + 1 + c.y, site.z + c.z, c.t);
        ABC.world.flush();
        ui().confetti(40);
        ui().bellaSays('What a flight! Your rocket landed safely back on the pad. 🚀💙', 5200);
      }
    };
    anim();
  }

  /* =====================================================
     ANIMAL EMOTION ENCOUNTERS
     ===================================================== */
  function fillTpl(s, a) { return s.replaceAll('{name}', a.name).replaceAll('{label}', a.def.label); }

  /* 🏪 the village market — ask politely, pay with stars, say thank you */
  function shop(a) {
    const vp = ABC.audio.voiceFor(a.kind, a.voiceSeed || ABC.audio.seedFor(a.name));
    const goods = (a.shopGoods || ['water', 'apple', 'cookie'])
      .map(k => ABC.GOODS[k]).filter(Boolean);
    ui().pickCard(`${a.name}'s Shop 🏪`,
      `Hello, {player}! I’m ${a.name}. What would you like today? You have ${ABC.state.stars} ⭐`,
      goods.map(g => ({ ico: g.ico, label: `${g.label} — ${g.price}⭐`, g })),
      (card) => {
        const g = card.g;
        if (ABC.state.stars < g.price) {
          ui().closeDialog();
          ui().bellaSays(`You need ${g.price - ABC.state.stars} more ⭐ for that. Use your words to earn stars, then come back!`, 5200);
          return;
        }
        ui().askExpressive({
          emoji: g.ico,
          scene: `${a.name} smiles. How do we ask to buy it?`,
          options: [
            { t: `Can I have ${g.word}, please? Here are ${g.price} stars.`, q: 'best' },
            { t: 'Want.', q: 'name' },
            { t: 'My hat is red.', q: 'off' } ],
        }, () => {
          ABC.state.stars -= g.price;
          ui().refreshScore();
          ABC.saveSoon && ABC.saveSoon();
          const p = ABC.player.position;
          const k = g.kind;
          if (k === 'water') { ABC.audio.sfx.gentle(); ui().floatHearts(2); ui().toast(`${g.ico} Glug glug — so refreshing! Ahh!`, 3600, true); }
          else if (k === 'food') { ABC.audio.sfx.munch(); ui().addHearts(1); ui().toast(`${g.ico} Yum yum! Thank you, ${a.name}!`, 3600, true); }
          else if (k === 'cookie') { ABC.squishy.spawn({ kind:'cutout', shape:'circle', colorHex:0x8a5a2b, x:Math.round(p.x)+2, z:Math.round(p.z)+2 }); ui().toast('🍪 A yummy cookie appeared! What do we say? THANK YOU!', 3800, true); }
          else if (k === 'blocks') { for (let i=0;i<3;i++) ABC.world.set(Math.round(p.x)+i-1, Math.round(p.y)-1, Math.round(p.z)-3, 'star'); ABC.world.flush(); ui().toast('⭐ Three glowing lamps, all yours!', 3400, true); }
          else if (k === 'balloon') { ui().floatHearts(8); ABC.portal.charge(2); ui().toast('🎈 The magic balloon fills you with word power!', 3600, true); }
          ABC.stickers && ABC.stickers.award && ABC.stickers.award('shopper');
          ABC.audio.animalCall(a.kind);                       // a happy little chirp/grunt
          ui().toast(`🏪 <b>${a.name}:</b> Thank you for shopping and for your kind words! 💛`, 4600, false);
          ABC.audio.say(`Thank you for shopping, and for your kind words!`, vp);   // …in the vendor's own voice
        }, { stars: 0 });
      }, '🏪', vp);
  }

  function talkToAnimal(a) {
    ABC.audio.animalCall(a.kind);                    // each animal says hello its own way 🐾
    if (a.isGuide) { bellaChat(a); return; }
    if (a.isVendor) { shop(a); return; }
    if (ABC.pet && ABC.pet.tryInteract(a)) return;   // your own pet 💕
    ABC.friends && ABC.friends.record && ABC.friends.record(a);
    if (!a.emotion || !a.emotion.sceneTpl) {   // plain bubbles (🌟/😴) aren't help scenarios
      // half the time it's a pure celebration — no quiz, just joy 🎉
      if (Math.random() < 0.5) { animalHello(a); return; }
      // otherwise: a treasure to ask for, or a describing prompt
      if (Math.random() < 0.5) { animalRequest(a); return; }
      const d = a.def;
      ui().askExpressive({
        emoji: d.emoji,
        scene: `${a.name} the ${d.label} looks at you with friendly eyes. What can you tell me about ${a.name}?`,
        options: [
          { t: describeAnimal(a), q: 'best' },
          { t: d.label + '.', q: 'name' },
          { t: 'My chair is brown.', q: 'off' } ],
      }, () => {
        ABC.animals.celebrate(a, performance.now() / 1000);
        ui().floatHearts(3);
      });
      return;
    }
    const emo = a.emotion;
    const scene = fillTpl(emo.sceneTpl, a);
    ui().askExpressive({
      emoji: emo.emoji,
      scene: scene + ' ' + fillTpl(emo.feelingQ, a),
      options: emo.options.map(o => ({ t: fillTpl(o.t, a), q: o.q })),
    }, () => {
      // step 2: choose a kind action
      setTimeout(() => {
        ui().pickCard('Be a Kind Friend 💖', fillTpl('How can we help {name} feel better?', a),
          emo.kindActs.map(k => ({ ico: k.ico, label: k.label, say: k.say })),
          (k) => {
            ui().closeDialog();
            ABC.animals.clearEmotion(a);
            ABC.animals.celebrate(a, performance.now() / 1000);
            ABC.audio.sfx.munch();
            ui().confetti(16);
            ui().addHearts(1);
            ABC.quests.mark('animal');
            ui().toast('💖 ' + fillTpl(k.say, a), 5000, true);
          }, '💖');
      }, 400);
    }, { stars: 1 });
  }

  /* pure celebration hello — hearts, confetti, happy sound, NO quiz 🎉 */
  const HELLO_LINES = [
    '{name} wiggles with joy to see you!', '{name} does a happy little dance!',
    '{name} nuzzles you hello!', '{name} is SO glad you came to say hi!',
  ];
  function animalHello(a) {
    ABC.animals.celebrate(a, performance.now() / 1000);
    ui().floatHearts(5);
    ui().confetti(14);
    ABC.audio.sfx.ding();
    ui().toast(a.def.emoji + ' ' + fillTpl(ui().pick(HELLO_LINES), a), 3200, true);
  }

  /* the animal found something — asking nicely gets it! (requesting practice) */
  function animalRequest(a) {
    const want = ui().pick(ABC.ANIMAL_WANTS);
    ui().askExpressive({
      emoji: a.def.emoji + want.ico,
      scene: `${a.name} the ${a.def.label} found ${want.word}! ${want.ico} How do we ask for it nicely?`,
      options: [
        { t: `Can I have ${want.word}, please?`, q: 'best' },
        { t: 'Give.', q: 'name' },
        { t: 'The door is open.', q: 'off' } ],
    }, () => {
      ABC.animals.celebrate(a, performance.now() / 1000);
      ui().confetti(14);
      ui().addStars(1);   // bonus on top of the expressive star
      ui().toast(`${want.ico} ${a.name} happily shares ${want.word} with you! Asking nicely is magic! 💖`, 4600, true);
    });
  }

  function describeAnimal(a) {
    const d = a.def;
    const colorWord = {
      bunny: 'soft and fluffy white', cat: 'orange and stripy', puppy: 'brown and waggy',
      butterfly: 'purple with golden wings', trex: 'big and green with tiny arms',
      trice: 'orange with three pointy horns', longneck: 'blue with a very long neck',
      mammoth: 'furry brown with long tusks', elephant: 'blue with big flappy ears',
      puzzleEle: 'rainbow-colored with patches like a puzzle',
      capy: 'big, round and chubby like a fuzzy ball', penguin: 'round and waddly with a white tummy',
      panda: 'round like a dumpling with black ears',
    }[d.kind] || 'very friendly';
    return `${a.name} is a ${colorWord} ${d.label.toLowerCase()} who likes to play.`;
  }

  const BELLA_TIPS = [
    'Every kind word builds a more inclusive world! 💙',
    'When a friend feels different, say: “You belong with us!”',
    'Your words are a superpower, {player}! 🌟',
    'Is any animal sad or hungry? Kind friends check!',
    'Try the Slime Lab! What color will you mix? 🌈',
    'Describing words are magic: tall, shiny, cozy, ENORMOUS!',
    'Want to build a big blue elephant like me? Try Build Projects! 🐘',
  ];
  function bellaChat(a) {
    ui().message('Bella the Blue Elephant 🐘💙',
      ui().pick(BELLA_TIPS) + `<br><br><span style="font-size:14px;color:#557;">${ABC.BRAND.org} — ${ABC.BRAND.tagline} 🌈∞</span>`,
      'Thanks, Bella! 💙', null, '🐘');
    ABC.animals.celebrate(a, performance.now() / 1000);
  }

  /* Periodic emotion spawner (gentle pace, max 2 at once) */
  function emotionTick() {
    if (ABC.animals.activeEmotionCount() >= 2) return;
    if (!ABC.state.tutorialDone) return;
    const a = ABC.animals.randomCalmAnimal();
    if (!a) return;
    const emo = ABC.EMOTIONS[Math.floor(Math.random() * ABC.EMOTIONS.length)];
    ABC.animals.setEmotion(a, emo);
    ui().toast(`${emo.emoji} ${a.name} the ${a.def.label} needs a friend! Can you find them?`, 4500, true);
  }

  /* =====================================================
     SLIME LAB 🌈 (inspired by slime videos!)
     ===================================================== */
  function slimeLab() {
    const S = ABC.SLIME;
    ui().pickCard('Slime Lab 🌈', 'Let’s make squishy slime, just like the videos! First — pick your slime color!',
      S.colors.map(c => ({ ico: c.ico, label: c.label, c })),
      (colorCard) => {
        ui().pickCard('Slime Lab 🌈', `Ooooh, ${colorCard.c.word} slime! Now pick a magical mix-in!`,
          S.mixins.map(m => ({ ico: m.ico, label: m.label, m })),
          (mixCard) => slimeStir(colorCard.c, mixCard.m), '🫙');
      }, '🧪');
  }

  function slimeStir(color, mixin) {
    let stirs = 0; const NEED = 8;
    ABC.ui.openDialog(`<div class="bigEmoji" id="slimeBowl">🫙</div><h2>Stir the Slime! 🥄</h2>
      <div class="scene">Tap the bowl to stir! Squish… squish… squish…</div>
      <div style="margin:8px 0;"><span class="stirZone" id="stirZone">🌀</span></div>
      <div id="projBarOuterS" style="height:18px;background:#e5e7eb;border-radius:10px;overflow:hidden;">
        <div id="stirBar" style="height:100%;width:0%;background:linear-gradient(90deg,${color.key === 'slimeGreen' ? '#7be042' : color.key === 'slimePink' ? '#ff8fc8' : color.key === 'slimePurple' ? '#b388ff' : '#5dc8f5'},#fff59d);border-radius:10px;transition:width .2s;"></div></div>`);
    ABC.audio.say('Tap the swirl to stir the slime!');
    const zone = document.getElementById('stirZone');
    zone.addEventListener('click', () => {
      stirs++;
      ABC.audio.sfx.squish();
      zone.style.transform = `rotate(${stirs * 45}deg) scale(${1 + Math.sin(stirs) * 0.2})`;
      document.getElementById('stirBar').style.width = Math.min(100, stirs / NEED * 100) + '%';
      document.getElementById('slimeBowl').textContent = stirs < NEED / 2 ? '🫙' : '🫠';
      if (stirs >= NEED) {
        ABC.audio.sfx.ding();
        setTimeout(() => {
          ui().askExpressive(ABC.SLIME.describe(color.word, mixin.word), () => {
            ui().unlockBlock(color.key);
            const p = spotInFront(3);
            ABC.squishy.spawn({ kind:'slime', color: color.key, mixin: mixin.label, x: p.x, z: p.z });
            ABC.quests.mark('words');
            ABC.saveSoon && ABC.saveSoon();
            ui().bellaSays(`Your pet slime is wiggling right there! Poke it to squish it! 🫧`, 5000);
          }, { stars: 2 });
        }, 400);
      }
    });
  }

  /* a clear spot a few blocks in front of the player */
  function spotInFront(dist) {
    const dir = new THREE.Vector3();
    ABC.player.getWorldDirection(dir);
    return { x: Math.round(ABC.player.position.x + dir.x * dist),
             z: Math.round(ABC.player.position.z + dir.z * dist) };
  }

  /* =====================================================
     OREO KITCHEN 🍪 (inspired by cooking videos!)
     ===================================================== */
  function oreoKitchen() {
    const O = ABC.OREO;
    ui().pickCard('Oreo Kitchen 🍪', 'Welcome, Chef {player}! Let’s bake a giant Oreo! Pick your cream flavor!',
      O.creams.map(c => ({ ico: c.ico, label: c.label, c })),
      (creamCard) => {
        ui().pickCard('Oreo Kitchen 🍪', `Mmm, ${creamCard.c.word} cream! Now pick a topping!`,
          O.toppings.map(t => ({ ico: t.ico, label: t.label, t })),
          (topCard) => oreoStack(creamCard.c, topCard.t), '🍪');
      }, '👩‍🍳');
  }

  function oreoStack(cream, topping) {
    const layers = [
      { label: '🍪 Cookie', css: '#2b2118', text: '#fff' },
      { label: cream.ico + ' Cream', css: cream.css, text: '#333' },
      { label: '🍪 Cookie', css: '#2b2118', text: '#fff' },
      { label: topping.ico + ' ' + topping.label, css: '#fff3bf', text: '#333' },
    ];
    let idx = 0;
    ABC.ui.openDialog(`<div class="bigEmoji">👩‍🍳</div><h2>Stack Your Oreo! 🍪</h2>
      <div class="scene" id="oreoMsg">Tap the button to add each layer!</div>
      <div id="oreoStack"></div>
      <div class="dlgRow"><button class="bigBtn" id="oreoAdd">➕ Add ${layers[0].label}</button></div>`);
    ABC.audio.say('Tap the button to stack your giant Oreo!');
    const btn = document.getElementById('oreoAdd');
    btn.onclick = () => {
      const L = layers[idx];
      const d = document.createElement('div');
      d.className = 'oreoLayer';
      d.style.background = L.css; d.style.color = L.text;
      d.textContent = L.label;
      document.getElementById('oreoStack').appendChild(d);
      ABC.audio.sfx.munch();
      idx++;
      if (idx < layers.length) {
        btn.textContent = '➕ Add ' + layers[idx].label;
      } else {
        btn.style.display = 'none';
        document.getElementById('oreoMsg').textContent = 'It looks DELICIOUS! 🤤';
        ABC.audio.sfx.ding();
        setTimeout(() => {
          ui().askExpressive(ABC.OREO.describe(cream.word, topping.word), () => {
            const blockId = cream.label === 'Strawberry' ? 'oreoPink' : 'oreo';
            ui().unlockBlock(blockId);
            const p = spotInFront(3);
            ABC.squishy.spawn({ kind:'oreo', cream: cream.label, topping: topping.label, x: p.x, z: p.z });
            ABC.quests.mark('words');
            ABC.saveSoon && ABC.saveSoon();
            ui().bellaSays('Your giant Oreo is on the ground! Poke it, squish it, or carry it home! 🍪', 5000);
          }, { stars: 2 });
        }, 600);
      }
    };
  }

  /* =====================================================
     TODAY'S ADVENTURES 📋 — 3 focus quests per day
     ===================================================== */
  ABC.quests = (function () {
    const todayKey = () => new Date().toISOString().slice(0, 10);
    function state() {
      let q = ABC.state.quests;
      if (!q || q.date !== todayKey()) {
        q = ABC.state.quests = { date: todayKey(), done: {}, celebrated: false };
      }
      return q;
    }
    function allDone() { return ABC.QUEST_DEFS.every(d => state().done[d.key]); }
    function refreshChip() {
      const chip = document.getElementById('questChip');
      if (!chip) return;
      const n = ABC.QUEST_DEFS.filter(d => state().done[d.key]).length;
      chip.textContent = '📋 ' + n + '/' + ABC.QUEST_DEFS.length;
      chip.classList.toggle('portalReady', allDone());
    }
    function mark(key) {
      const q = state();
      if (q.done[key]) return;
      q.done[key] = true;
      refreshChip();
      ABC.saveSoon && ABC.saveSoon();
      const def = ABC.QUEST_DEFS.find(d => d.key === key);
      ui().toast(`📋 Adventure done: ${def.ico} ${def.label}!`, 3600, true);
      if (allDone() && !q.celebrated) {
        q.celebrated = true;
        ABC.saveSoon && ABC.saveSoon();
        setTimeout(() => {
          ui().confetti(80);
          ABC.audio.sfx.fanfare();
          ui().addStars(5);
          ABC.portal.charge(2);
          ui().bellaSays('ALL of today’s adventures are DONE! You are a superstar, {player}! 🎆⭐', 6500);
        }, 1200);
      }
    }
    function showBoard() {
      const q = state();
      let html = `<div class="bigEmoji">📋</div><h2>Today's Adventures</h2>
        <div class="scene">Three special things to do today!</div>`;
      ABC.QUEST_DEFS.forEach(d => {
        const done = !!q.done[d.key];
        html += `<div class="sentenceCard" style="display:flex; align-items:center; gap:12px; ${done ? 'opacity:.65; border-style:solid; border-color:#51cf66;' : ''}">
          <span style="font-size:30px;">${done ? '✅' : d.ico}</span>
          <span style="flex:1; text-align:left;">${d.label}</span></div>`;
      });
      html += `<div class="dlgRow"><button class="bigBtn green" id="qbOk">${allDone() ? 'All done! 🎆' : 'Let’s go! 🚀'}</button></div>`;
      ABC.ui.openDialog(html);
      ABC.audio.say(allDone() ? 'All adventures done! Amazing!' : 'Here are today’s three adventures!');
      document.getElementById('qbOk').onclick = () => ABC.ui.closeDialog();
    }
    return { mark, showBoard, refreshChip, state };
  })();

  /* =====================================================
     SHOW & TELL 🧩 — describe your own creations
     ===================================================== */
  let lastShowTell = 0;
  function initShowTell(count) { lastShowTell = count || 0; }
  function maybeShowTell(placedCount) {
    if (placedCount - lastShowTell < 80) return;
    lastShowTell = placedCount;
    const sentence = ui().pick(ABC.SHOWTELL_SENTENCES);
    setTimeout(() => {
      if (ABC.ui.isOpen()) return;
      ui().askBuilder(
        'WOW, {player}! Look at what you are building! Tell me about it — tap the words in order:',
        sentence, null, { emoji: '🏗️✨', stars: 2 });
    }, 600);
  }

  /* =====================================================
     KIND WORDS 💌 — real-world talking missions
     ===================================================== */
  function kindWords() {
    ui().pickCard('Kind Words 💌', 'Time for a real-world mission! Who will you talk to?',
      ABC.MISSION_PEOPLE.map(p => ({ ico: p.ico, label: p.label, p })),
      (who) => {
        const phrases = ui().pick3(ABC.MISSION_PHRASES);
        let html = `<div class="bigEmoji">${who.ico}</div><h2>What will you say to ${who.label}?</h2>
          <div class="scene">Pick something nice to say out loud:</div>`;
        phrases.forEach((ph, i) => {
          html += `<button class="choiceBtn" data-i="${i}">🗨️ ${ph} <span class="speakIco" data-s="${i}">🔊</span></button>`;
        });
        ABC.ui.openDialog(html);
        ABC.audio.say('What will you say to ' + who.label + '?');
        document.querySelectorAll('#dialogBox .speakIco').forEach(s =>
          s.addEventListener('click', (e) => { e.stopPropagation(); ABC.audio.say(phrases[+s.dataset.s], { force: true }); }));
        document.querySelectorAll('#dialogBox .choiceBtn').forEach(btn =>
          btn.addEventListener('click', () => missionGo(who, phrases[+btn.dataset.i])));
      }, '💌');
  }

  function missionGo(who, phrase) {
    ABC.ui.openDialog(`<div class="bigEmoji">${who.ico}💬</div><h2>Your Mission!</h2>
      <div class="scene">Go find ${who.label} and say:</div>
      <div class="sentenceCard">“${phrase}” <span class="speakIco" id="mSay">🔊</span></div>
      <div class="scene" style="font-size:17px;">Practice it, then go say it for real! I’ll wait right here. 😊</div>
      <div class="dlgRow">
        <button class="bigBtn green" id="mDone">✅ I said it!</button>
        <button class="bigBtn" id="mLater" style="font-size:17px;">⏰ Later</button>
      </div>`);
    ABC.audio.say('Go find ' + who.label + ' and say: ' + phrase);
    document.getElementById('mSay').onclick = () => ABC.audio.say(phrase, { force: true });
    document.getElementById('mLater').onclick = () => { ABC.ui.closeDialog(); ui().toast('No rush! The mission will wait. 💛', 2800); };
    document.getElementById('mDone').onclick = () => {
      ABC.ui.closeDialog();
      ABC.audio.sfx.fanfare();
      ui().confetti(30);
      ui().addHearts(2);
      ABC.portal.charge(2);   // real-world words are SUPER word power
      ABC.quests.mark('words');
      ui().bellaSays(`You used your words with ${who.label}! That is real magic! 💖🌀`, 5500);
    };
  }

  function startProjectById(id) {
    ensureBlueprints();
    if (blueprints[id]) startProject(blueprints[id]);
  }

  return { showBuildMenu, startProjectById, tryFillGhost, magicFill, quitProject, talkToAnimal,
           emotionTick, slimeLab, oreoKitchen, kindWords, maybeShowTell, initShowTell,
           hasActiveProject: () => !!active };
})();
