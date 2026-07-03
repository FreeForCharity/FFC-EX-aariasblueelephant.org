/* Aaria's Block Craft 3D — My Pet 🐾: adopt, name, feed daily, watch it grow */
ABC.pet = (function () {
  const $ = (id) => document.getElementById(id);
  let st = { adopted: false, kind: null, name: null, level: 0, lastFed: null, tricks: 0 };
  let a = null;            // the live animal entity
  let askedOnce = false;
  const today = () => new Date().toISOString().slice(0, 10);

  /* ---------- tricks 🎪 — every 5 hearts teaches the next one ---------- */
  const TRICKS = [
    { key:'spin',     label:'SPIN',              ico:'🌀' },
    { key:'backflip', label:'BACKFLIP',          ico:'🤸' },
    { key:'chase',    label:'CHASE ITS TAIL',    ico:'💫' },
    { key:'sing',     label:'SING',              ico:'🎵' },
    { key:'carry',    label:'BALANCE A BLOCK',   ico:'🧱' },
    { key:'dance',    label:'DANCE ALONG',       ico:'🕺' },
  ];
  let trick = null;        // { key, t } — the trick playing right now

  function checkTricks() {
    if (!st.adopted) return;
    const should = Math.min(TRICKS.length, Math.floor(ABC.state.hearts / 5));
    while ((st.tricks || 0) < should) {
      st.tricks = (st.tricks || 0) + 1;
      const tr = TRICKS[st.tricks - 1];
      ABC.ui.confetti(40);
      ABC.audio.sfx.fanfare();
      ABC.ui.bellaSays(`${tr.ico} ${st.name} learned to ${tr.label}! Tap ${st.name} to see it!`, 5600);
      ABC.saveSoon && ABC.saveSoon();
    }
  }

  function playTrick() {
    const known = TRICKS.slice(0, st.tricks || 0);
    const tr = known[Math.floor(Math.random() * known.length)];
    trick = { key: tr.key, t: 0 };
    ABC.animals.celebrate(a, performance.now() / 1000);
    ABC.ui.floatHearts(4);
    if (tr.key === 'sing') [523, 659, 784].forEach((f, i) =>
      setTimeout(() => ABC.audio.sfx.gentle(), i * 260));
    else ABC.audio.sfx.ding();
    ABC.ui.toast(`${tr.ico} ${st.name} does a ${tr.label.toLowerCase()}! 💕`, 3200, true);
  }
  function updateTrick(dt) {
    if (!trick || !a) return;
    trick.t += dt;
    const g = a.group, t = trick.t, D = 2.2;
    if (trick.key === 'spin')      g.rotation.y += dt * 9;
    if (trick.key === 'backflip')  { g.rotation.x = -Math.min(1, t / 1.4) * Math.PI * 2;
                                     g.position.y = a.groundY + Math.sin(Math.min(1, t / 1.4) * Math.PI) * 1.4; }
    if (trick.key === 'chase')     { g.rotation.y += dt * 6;
                                     g.position.x += Math.cos(g.rotation.y) * dt * 1.5;
                                     g.position.z += Math.sin(g.rotation.y) * dt * 1.5; }
    if (trick.key === 'sing')      g.rotation.z = Math.sin(t * 7) * 0.18;
    if (trick.key === 'dance')     { g.rotation.z = Math.sin(t * 9) * 0.25;
                                     g.position.y = a.groundY + Math.abs(Math.sin(t * 6)) * 0.4; }
    if (trick.key === 'carry') {
      if (!g.getObjectByName('trickBlock')) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),
          new THREE.MeshLambertMaterial({ color: 0xffd43b }));
        m.name = 'trickBlock';
        m.position.y = new THREE.Box3().setFromObject(g).max.y / (a.def.size * 0.55) - g.position.y + .4;
        g.add(m);
      }
    }
    if (t >= D) {
      g.rotation.x = 0; g.rotation.z = 0;
      const b = g.getObjectByName('trickBlock'); if (b) g.remove(b);
      trick = null;
    }
  }

  /* ---------- naps on the kid's own builds 🛏️ ---------- */
  let napT = 20, napping = 0, napSpot = null, napSaid = false, napWalkT = 0;
  function maybeNap(dt, feet) {
    if (napping > 0) {          // zzz… flopped over next to the kid's build 💤
      napping -= dt;
      a.target = null; a.group.rotation.z = 1.35;
      if (napping <= 0) { ABC.animals.clearEmotion(a); a.group.rotation.z = 0; }
      return;
    }
    if (napSpot) {              // ambling over to the cozy spot
      a.target = napSpot;
      napWalkT += dt;
      if (napWalkT > 12) { napSpot = null; return; }   // too tricky to reach — wander on
      if (a.group.position.distanceTo(napSpot) < 1.6) {
        napSpot = null; napping = 9;
        ABC.animals.setEmotion(a, { emoji: '😴' });
        if (!napSaid) { napSaid = true; ABC.ui.bellaSays(`Look — ${st.name} loves what you built! Cozy nap time. 💤`, 4800); }
        else ABC.ui.toast(`💤 ${st.name} is napping next to your build!`, 3200);
      }
      return;
    }
    napT -= dt;
    if (napT > 0) return;
    napT = 40 + Math.random() * 50;
    if (trick || Math.random() < 0.5) return;
    // find a kid-placed block near the player (the pet stays close anyway)
    const edits = (ABC.world.serialize().d || []);
    const near = [];
    for (const e of edits) {
      const [x, , z] = e.split(':')[0].split(',').map(Number);
      if (Math.hypot(x - feet.x, z - feet.z) < 10) near.push({ x, z });
    }
    if (!near.length) return;
    const b = near[Math.floor(Math.random() * near.length)];
    napSpot = new THREE.Vector3(b.x + 0.5, a.group.position.y, b.z + 1.6);
    napWalkT = 0;
  }

  const SPECIES = [
    { kind: 'bunny', ico: '🐰', label: 'Bunny' },
    { kind: 'cat',   ico: '🐱', label: 'Kitty' },
    { kind: 'puppy', ico: '🐶', label: 'Puppy' },
    { kind: 'panda', ico: '🐼', label: 'Panda' },
  ];
  const FOODS = [
    { ico: '🥕', label: 'Crunchy Carrot', word: 'the crunchy carrot' },
    { ico: '🍓', label: 'Sweet Berries',  word: 'the sweet berries' },
    { ico: '🍪', label: 'Little Cookie',  word: 'a little cookie' },
  ];
  const NAME_IDEAS = ['Mochi', 'Sparkle', 'Cookie', 'Luna', 'Pebble', 'Sunny'];

  /* ---------- spawn / appearance ---------- */
  function materialize() {
    if (!st.adopted || a) return;
    const p = ABC.player ? ABC.player.position : { x: 0, z: 0 };
    a = ABC.animals.spawn(st.kind, Math.round(p.x) + 2, Math.round(p.z) + 2, st.name);
    a.isPet = true;
    a.range = 3;
    applyLook();
  }
  function applyLook() {
    if (!a) return;
    a.group.scale.setScalar(a.def.size * 0.55 * (1 + st.level * 0.05));
    const old = a.group.getObjectByName('petAcc');
    if (old) a.group.remove(old);
    if (st.level >= 3) {
      const acc = new THREE.Group(); acc.name = 'petAcc';
      const mk = (w, h, d, x, y, z, c) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
          new THREE.MeshLambertMaterial({ color: c }));
        m.position.set(x, y, z); acc.add(m);
      };
      const top = new THREE.Box3().setFromObject(a.group).max.y / (a.def.size * 0.55) - a.group.position.y;
      if (st.level >= 3) mk(.34, .18, .1, 0, 2.1, .5, '#ff6b9d');          // bow 🎀
      if (st.level >= 6) { mk(.5, .14, .5, 0, 2.3, 0, '#4dabf7'); mk(.34, .3, .34, 0, 2.45, 0, '#4dabf7'); } // hat 🎩
      if (st.level >= 9) mk(.6, .14, .14, 0, 1.4, .42, '#ffd43b');         // golden scarf ✨
      a.group.add(acc);
    }
  }

  /* ---------- adopt flow ---------- */
  function maybeAdoptPrompt() {
    if (st.adopted || askedOnce || ABC.state.stars < 3) return;
    askedOnce = true;
    ABC.ui.message('A new friend? 🐾',
      'Bella knows some little friends who need a home. Would you like your very own pet?',
      'Yes! Adopt a pet! 💕', () => adoptFlow(), '🐾');
  }
  function adoptFlow() {
    ABC.ui.pickCard('Pick Your Pet 🐾', 'Who will be YOUR best friend?',
      SPECIES.map(s => ({ ico: s.ico, label: s.label, s })),
      (c) => {
        const sug = NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)];
        ABC.ui.openDialog(`<div class="bigEmoji">${c.s.ico}</div><h2>Name your pet!</h2>
          <input id="petName" value="${sug}" maxlength="14"
            style="font-family:inherit;font-size:24px;text-align:center;padding:12px;border:3px solid #74c0fc;border-radius:16px;width:75%;">
          <div class="dlgRow"><button class="bigBtn green" id="petOk">That's the name! 💕</button></div>`);
        const inp = $('petName'); inp.focus(); inp.select();
        $('petOk').onclick = () => {
          const nm = inp.value.trim() || sug;
          ABC.ui.closeDialog();
          ABC.ui.askExpressive({
            emoji: c.s.ico + '💕',
            scene: `Say hello to your new friend!`,
            options: [
              { t: `This is my pet ${nm}, my best friend!`, q: 'best' },
              { t: 'Pet.', q: 'name' },
              { t: 'The sky is up.', q: 'off' } ],
          }, () => {
            st = { adopted: true, kind: c.s.kind, name: nm, level: 1, lastFed: today() };
            materialize();
            ABC.ui.confetti(40);
            ABC.ui.bellaSays(`${nm} is YOURS forever! ${c.s.ico} ${nm} will follow you everywhere!`, 5600);
            ABC.saveSoon && ABC.saveSoon();
          }, { stars: 2 });
        };
      }, '🐾');
  }

  /* ---------- daily feeding ---------- */
  function needsFood() { return st.adopted && st.lastFed !== today(); }
  function feedFlow() {
    ABC.ui.pickCard(`Feed ${st.name}! 🍽️`,
      `${st.name}'s tummy is rumbling! What shall we give?`,
      FOODS.map(f => ({ ico: f.ico, label: f.label, f })),
      (c) => {
        ABC.ui.closeDialog();
        ABC.ui.askExpressive({
          emoji: c.f.ico,
          scene: `How do we offer it to ${st.name}?`,
          options: [
            { t: `Here you go, ${st.name} — ${c.f.word}, just for you!`, q: 'best' },
            { t: 'Eat.', q: 'name' },
            { t: 'My sock is blue.', q: 'off' } ],
        }, () => {
          st.lastFed = today();
          st.level = Math.min(10, st.level + 1);
          if (a) { ABC.animals.clearEmotion(a); ABC.animals.celebrate(a, performance.now() / 1000); }
          applyLook();
          ABC.audio.sfx.munch();
          ABC.ui.floatHearts(6);
          ABC.portal && ABC.portal.charge(1);
          if (st.level === 3) ABC.ui.bellaSays(`${st.name} grew and got a pretty bow! 🎀`, 5000);
          else if (st.level === 6) ABC.ui.bellaSays(`${st.name} grew again — look at that little hat! 🎩`, 5000);
          else if (st.level === 9) ABC.ui.bellaSays(`${st.name} has a golden scarf now! So fancy! ✨`, 5000);
          else ABC.ui.toast(`${st.name} munches happily and grows a tiny bit! 💕 (level ${st.level})`, 4200, true);
          ABC.saveSoon && ABC.saveSoon();
        }, { stars: 1 });
      }, '🍽️');
  }

  /* ---------- login + per-frame ---------- */
  function onLogin() {
    if (!st.adopted) return;
    materialize();
    setTimeout(() => {
      ABC.ui.toast(`💕 ${st.name} missed you SO much!`, 4200, true);
      if (needsFood() && a) ABC.animals.setEmotion(a, { emoji: '🍽️' });
    }, 2500);
  }
  function update(dt, feet) {
    if (!a) return;
    updateTrick(dt);
    maybeNap(dt, feet);
    if (napSpot || napping > 0) return;   // heading for (or having) a nap — don't tug the leash
    // loyal follow: amble to a spot near the player when too far
    const d = Math.hypot(a.group.position.x - feet.x, a.group.position.z - feet.z);
    if (d > 6) {
      a.home = { x: feet.x, z: feet.z };
      a.target = new THREE.Vector3(feet.x + 1.5, a.group.position.y, feet.z + 1.5);
      a.speed = Math.min(4, a.def.speed + d * 0.15);   // hurries when left behind
    } else { a.home = { x: feet.x, z: feet.z }; a.speed = a.def.speed; }
    // hungry pets show it
    if (needsFood() && !a.emotion) ABC.animals.setEmotion(a, { emoji: '🍽️' });
  }
  /* clicking the pet = feed if hungry, else love */
  function tryInteract(animal) {
    if (!animal.isPet) return false;
    if (needsFood()) feedFlow();
    else if ((st.tricks || 0) > 0) playTrick();   // 🎪 tapping always shows a trick
    else {
      ABC.animals.celebrate(animal, performance.now() / 1000);
      ABC.ui.floatHearts(4);
      ABC.audio.sfx.gentle();
      ABC.ui.toast(`💕 ${st.name} loves you! (level ${st.level})`, 2800, true);
    }
    return true;
  }

  function serialize() { return { ...st }; }
  function deserialize(d) { if (d && d.adopted) { st = d; st.tricks = st.tricks || 0; } }

  return { maybeAdoptPrompt, onLogin, update, tryInteract, feedFlow, checkTricks,
           serialize, deserialize,
           isAdopted: () => st.adopted, level: () => st.level };
})();
