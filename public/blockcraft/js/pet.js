/* Aaria's Block Craft 3D — My Pet 🐾: adopt, name, feed daily, watch it grow */
ABC.pet = (function () {
  const $ = (id) => document.getElementById(id);
  let st = { adopted: false, kind: null, name: null, level: 0, lastFed: null };
  let a = null;            // the live animal entity
  let askedOnce = false;
  const today = () => new Date().toISOString().slice(0, 10);

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
    else {
      ABC.animals.celebrate(animal, performance.now() / 1000);
      ABC.ui.floatHearts(4);
      ABC.audio.sfx.gentle();
      ABC.ui.toast(`💕 ${st.name} loves you! (level ${st.level})`, 2800, true);
    }
    return true;
  }

  function serialize() { return { ...st }; }
  function deserialize(d) { if (d && d.adopted) st = d; }

  return { maybeAdoptPrompt, onLogin, update, tryInteract, feedFlow,
           serialize, deserialize,
           isAdopted: () => st.adopted, level: () => st.level };
})();
