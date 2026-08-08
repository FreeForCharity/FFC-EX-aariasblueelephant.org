/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   Aaria's Softball Stars — LEVEL 1: KNOW YOUR GEAR  (window.SBGear)

   Four rounds, all played IN the world — never a flash card:

     A · THINGS   "Which one is the batting tee?"  Three real 3D models float
                  in bubbles beside the equipment bag. Tap one, or just walk
                  into it.
     B · PLACES   "Where is second base?"  The actual bases, plate, circle,
                  dugout and fence light up out on the field. You walk there.
                  This round IS the tour of the ballpark.
     C · WHAT FOR "What do we use the helmet for?"  Three answer bubbles.
     D · SAFETY   Six rules from the coaches, then three checks.

   NO-FAIL PROMISES (please keep these if you edit)
     · nothing is ever marked wrong. A miss names what the child DID pick,
       warmly, and offers again
     · after two tries the right answer glows and pulses — it cannot be failed
     · order is fixed and identical every time; the child always knows what
       comes next
     · 🙋 Break works mid-question and costs nothing: suspend() parks the whole
       round exactly where it was, resume() puts it back

   Every word comes from content.js. Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const S = {};
  let K = window.ABEKit || {};
  let THREE = null, scene = null, C = null, L = null, F = null;

  const tr = (o) => { try { return (o && typeof o === 'object') ? K.tr(o.en, o.es) : (o || ''); } catch (e) { return (o && o.en) || ''; } };
  const sfx = (n) => { try { K.sfx && K.sfx[n] && K.sfx[n](); } catch (e) {} };
  const save = (k, v) => { try { K.save && K.save(k, v); } catch (e) {} };
  const load = (k, d) => { try { return K.load ? K.load(k, d) : d; } catch (e) { return d; } };
  const calm = () => { try { return !!(K.calm && K.calm()); } catch (e) { return false; } };
  const speedMul = () => { try { const s = Number(K.speed()); return (s >= 0.4 && s <= 3) ? s : 1; } catch (e) { return 1; } };
  const record = (kind, extra) => { try { K.recordEvent && K.recordEvent(kind, extra); } catch (e) {} };
  const LV = () => window.SBLevels;
  const say = (line, vars, opts) => { try { return LV().speak(line, vars, opts); } catch (e) { return ''; } };

  /* ═══════════════════════════════════════════════════════════════ state */
  let running = false, paused = false;
  const Q = {
    round: 'things',      // things → places → function → safety → done
    i: 0,                 // index within the round
    active: null,         // the live question
    tries: 0,
    done: [],             // ids already answered, so a break never loses work
  };
  const bubbles = [];     // live answer objects
  const rings = [];       // live place rings
  let anchorMark = null;
  let clock = 0, lockUntil = 0;

  /* where each place actually is on the field */
  let PLACE_AT = null;
  function buildPlaceMap() {
    PLACE_AT = {
      plate:  { x: L.home.x, z: L.home.z, r: 2.6 },
      first:  { x: L.first.x, z: L.first.z, r: 2.6 },
      second: { x: L.second.x, z: L.second.z, r: 2.6 },
      third:  { x: L.third.x, z: L.third.z, r: 2.6 },
      circle: { x: L.circle.x, z: L.circle.z, r: 2.8 },
      dugout: { x: L.dugout.x + 2.5, z: L.dugout.z + 2.0, r: 3.2 },
      fence:  { x: 0, z: -(L.fenceR - 3.0), r: 3.6 },
    };
  }

  /* where the THINGS round is played — beside the gear it's asking about */
  /* Answers are staged on the open grass in FRONT of the gear (towards the
     field), never behind home plate: the backstop's posts stripe right
     through anything parked back there. */
  const DUGOUT_STAGE = () => ({ x: L.dugout.x + 4.0, z: L.dugout.z - 5.0 });

  /* Lay out the three answer bubbles in an arc that the child can actually
     see and reach. Two things go wrong if you just aim from the anchor at the
     child: standing ON the anchor gives a zero-length direction (all three
     bubbles land on the same point), and standing very close puts a bubble
     inside the child. So: fall back to the camera direction when the child is
     too close, and always push the arc clear of them. */
  /* WHERE THE ANSWERS APPEAR
     Four hand-picked patches of open grass between the dugout and third base.
     Always the same spots, always three bubbles side by side left-to-right,
     always with the child standing a few steps south looking at them. Nothing
     is computed from where the child happens to be standing, because that
     kept parking answers inside the dugout roof or behind the backstop's
     posts — and because a child who knows where to look does better. */
  /* ══════════════════════════════════ THE ANSWER SPOT — one place, always
     Answers used to be staged next to whatever gear they were about, which
     meant four different patches of grass and a constant fight with whatever
     happened to be standing in each: the dugout roof, a kit bag, Nilu, a
     coach walking past.

     There is one answer spot now. Always the same patch of open grass, always
     the same three positions on it, with a chalk ring on the ground so it
     reads as the place where questions happen. Nothing else is ever routed
     into it: the coaches idle far away, the teammates wait in the dugout, and
     Nilu has her own fixed spot off to the side.

     A child also learns where to look — and stops walking between stations
     for every single question.

     If you move this, check it stays clear of: the backstop arc (anything at
     z > 0 near home), the dugout (x < -11.6 with z between 0.5 and 4.2), the
     bat rack, the kit bag, the cooler, and third base at (-11.3, -11.3). */
  const STAGE = {
    at:    { x: -11.5, z: -6.0 },     // where the three answers hang
    stand: { x: -11.5, z: -2.3 },     // where the child stands to look at them
    /* well to the left of the row, level with it — from where the child
       stands she reads as beside the answers, never behind one */
    nilu:  { x: -21.5, z: -6.0 },
  };
  let stageRing = null;

  /* HOW THE THREE ANSWERS ARE ARRANGED
     A wide screen gets them side by side. A phone held upright has no room
     for that — three discs in a row ran off both edges — so it gets them
     stacked front-to-back instead, which is exactly the shape a tall screen
     has room for. The child still reads them top to bottom, still taps or
     walks into them, and the fixed answer spot doesn't move. */
  function layout() {
    const w = innerWidth, h = innerHeight;
    /* phone upright: no width for a row, so stack them front-to-back */
    if (w / h < 0.95) return { spread: 2.55, depth: 3.3, scale: 2.5, y: 1.85, back: 0 };
    /* phone on its side: barely any height, and the cue band owns the top —
       so sit them lower and a little further off, out from under it */
    if (h < 470) return { spread: 3.4, depth: 0, scale: 2.5, y: 1.7, back: 0.8 };
    return { spread: 3.6, depth: 0, scale: 3.0, y: 1.95, back: 0 };
  }
  const SPREAD = 3.6;                 // metres between neighbouring answers (wide screens)

    function stageFor() { return STAGE; }
  /* the three slots — left to right on a wide screen, near to far on a phone */
  function slot(stage, i) {
    const L2 = layout();
    return { x: stage.at.x + (i - 1) * L2.spread,
             z: stage.at.z - (i - 1) * L2.depth - (L2.back || 0),
             y: L2.y };
  }
  /* a chalk ring on the grass so the answer spot is a place, not a surprise */
  function markStage() {
    if (stageRing) return;
    stageRing = F.marker(STAGE.at.x, STAGE.at.z + 1.6, 0xffffff, 5.6);
    stageRing.material.opacity = 0.28;
  }

  /* ══════════════════════════════════════════════════ little 3D factories */
  function emojiSprite(emoji, scale) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.font = '100px "Apple Color Emoji","Segoe UI Emoji",serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(emoji, 64, 70);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true,
      depthWrite: false, depthTest: false, fog: false }));
    s.scale.set(scale, scale, 1);
    s.renderOrder = 900;
    return s;
  }

  /* a wrapped-text billboard — used for the caption under an answer bubble */
  function textSprite(text, wide) {
    const W = 512, H = 200;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.95)';
    const r = 26;
    g.beginPath();
    g.moveTo(r, 8); g.lineTo(W - r, 8); g.quadraticCurveTo(W - 8, 8, W - 8, 8 + r);
    g.lineTo(W - 8, H - 8 - r); g.quadraticCurveTo(W - 8, H - 8, W - 8 - r, H - 8);
    g.lineTo(r, H - 8); g.quadraticCurveTo(8, H - 8, 8, H - 8 - r);
    g.lineTo(8, 8 + r); g.quadraticCurveTo(8, 8, r, 8);
    g.fill();
    g.fillStyle = '#25324a';
    g.font = 'bold 36px "Comic Sans MS","Chalkboard SE",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    /* wrap by words */
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > W - 46 && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    const shown = lines.slice(0, 4);
    const lh = 42;
    const y0 = H / 2 - ((shown.length - 1) * lh) / 2;
    shown.forEach((ln, i) => g.fillText(ln, W / 2, y0 + i * lh));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false, fog: false }));
    const w = wide || 2.6;
    s.scale.set(w, w * (H / W), 1);
    s.renderOrder = 880;
    return s;
  }

  /* An answer drawn INSIDE its own disc: the picture on top, a short phrase
     under it. The old version hung a separate caption card below the bubble,
     which overlapped its neighbours, got clipped, and turned three simple
     choices into a wall of text. One object, one glance. */
  function discAnswer(emoji, text) {
    const S_ = 256;
    const c = document.createElement('canvas');
    c.width = c.height = S_;
    const g = c.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '78px "Apple Color Emoji","Segoe UI Emoji",serif';
    g.fillText(emoji, S_ / 2, S_ * 0.32);

    g.fillStyle = '#1f3350';
    const wrap = (fs) => {
      g.font = 'bold ' + fs + 'px "Comic Sans MS","Chalkboard SE",sans-serif';
      const words = String(text).split(/\s+/);
      const out = []; let line = '';
      for (const w of words) {
        const t2 = line ? line + ' ' + w : w;
        if (g.measureText(t2).width > S_ * 0.74 && line) { out.push(line); line = w; }
        else line = t2;
      }
      if (line) out.push(line);
      return out;
    };
    let size = 30, lines = wrap(size);
    while (lines.length > 3 && size > 18) { size -= 2; lines = wrap(size); }
    const lh = size * 1.2;
    const y0 = S_ * 0.66 - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => g.fillText(ln, S_ / 2, y0 + i * lh));

    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true,
      depthWrite: false, depthTest: false, fog: false }));
    sp.scale.set(2.45, 2.45, 1);
    sp.renderOrder = 910;
    return sp;
  }

  /* the real gear, shrunk to fit inside an answer bubble */
  function miniModel(id) {
    const g = new THREE.Group();
    let m = null;
    if (id === 'ball') { m = F.makeBall(0.44); }
    else if (id === 'glove') { m = F.makeGlove(); m.scale.setScalar(2.4); m.rotation.x = -0.3; m.position.y = -0.2; }
    else if (id === 'bat') { m = F.makeBat(); m.scale.setScalar(1.35); m.rotation.z = 0.6; }
    else if (id === 'helmet') { m = F.makeHelmet(); m.scale.setScalar(2.2); m.position.y = 0.12; }
    else if (id === 'mask') { m = F.makeMask(); m.scale.setScalar(2.5); }
    else if (id === 'tee') {
      m = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.09, 14), new THREE.MeshLambertMaterial({ color: 0x1f2937 }));
      base.position.y = -0.34; m.add(base);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.52, 10), new THREE.MeshLambertMaterial({ color: 0x2f6fb5 }));
      stem.position.y = -0.04; m.add(stem);
      const b = F.makeBall(0.16); b.position.y = 0.44; m.add(b);
      m.scale.setScalar(1.35);
    } else if (id === 'cleats') {
      m = new THREE.Group();
      for (const s of [-1, 1]) {
        const sh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.17, 0.55), new THREE.MeshLambertMaterial({ color: 0x1d1f24 }));
        sh.position.set(s * 0.18, 0, 0); m.add(sh);
        for (let i = 0; i < 4; i++) {
          const st = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.07, 5), new THREE.MeshLambertMaterial({ color: 0xb9c2cc }));
          st.position.set(s * 0.18 + (i % 2 ? 0.08 : -0.08), -0.11, -0.17 + Math.floor(i / 2) * 0.34);
          m.add(st);
        }
      }
      m.scale.setScalar(1.7);
    } else if (id === 'water') {
      m = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.62, 12),
        new THREE.MeshLambertMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.9 }));
      m.add(b);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.13, 10), new THREE.MeshLambertMaterial({ color: 0x2f6fb5 }));
      cap.position.y = 0.37; m.add(cap);
      m.scale.setScalar(1.5);
    } else {
      m = emojiSprite('🥎', 1.0);
    }
    g.add(m);
    /* Clone the materials and lift them: these models are reused from the
       field, where they sit in real light. Inside a bubble they need to be
       readable at a glance, and mutating the shared material would repaint
       the whole ballpark. */
    g.traverse((o) => {
      if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
      o.material = o.material.clone();
      /* An answer the child cannot see is not an answer. These are floating UI
         that happens to live in the world, so they draw over anything that
         wanders in front — Nilu, a coach, a fence post.

         `transparent` matters even at full opacity: three.js draws the whole
         opaque pass BEFORE the transparent one, so opaque gear would be
         painted over by the (transparent-sprite) bubble disc behind it. Moving
         it into the transparent pass lets renderOrder actually decide, and the
         item lands on top of its own background where it belongs. */
      o.material.transparent = true;
      o.material.opacity = 1;
      o.material.depthTest = false;
      o.material.depthWrite = false;
      o.renderOrder = 900;
      /* glow in its OWN colour, so the ball stays yellow and the helmet stays
         blue — a flat grey lift desaturated everything into pebbles */
      if (o.material.emissive && o.material.color) o.material.emissive.copy(o.material.color).multiplyScalar(0.45);
    });
    return g;
  }

  /* ═════════════════════════════════════════════════════ answer bubbles */
  /* a soft dark disc that sits BEHIND the item and always faces the camera.
     Without it a pale ball on pale grass is nearly invisible; with it every
     answer reads instantly. Additive glow was tried first and blew three
     bubbles into one white smear — don't put it back. */
  function bubblePlate(scale) {
    const S_ = 256;
    const c = document.createElement('canvas');
    c.width = c.height = S_;
    const g = c.getContext('2d');
    /* a soft cool disc: pale gear needs something to sit against, but it must
       stay light enough that a dark bat still reads. Additive glow was tried
       first and smeared three bubbles into one white blob — don't go back. */
    /* SOLID, not tinted glass. Grass stripes, chalk and dirt showing through
       made the gear hard to pick out — a plain opaque disc gives every item a
       clean background to sit on, whatever it is standing in front of. Light,
       because most of the gear is dark-edged; the ball is optic yellow now,
       which reads fine against it. */
    const gr = g.createRadialGradient(S_ * 0.42, S_ * 0.34, 12, S_ / 2, S_ / 2, S_ * 0.47);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.55, '#f4f9ff');
    gr.addColorStop(1, '#d7e6f4');
    g.beginPath(); g.arc(S_ / 2, S_ / 2, S_ * 0.455, 0, 7); g.fillStyle = gr; g.fill();
    /* a soft inner edge so it reads as a disc rather than a flat hole */
    const inner = g.createRadialGradient(S_ / 2, S_ / 2, S_ * 0.32, S_ / 2, S_ / 2, S_ * 0.455);
    inner.addColorStop(0, 'rgba(120,150,180,0)');
    inner.addColorStop(1, 'rgba(120,150,180,0.30)');
    g.beginPath(); g.arc(S_ / 2, S_ / 2, S_ * 0.455, 0, 7); g.fillStyle = inner; g.fill();
    /* the ring — thick, gold, and perfectly circular from any angle */
    g.beginPath(); g.arc(S_ / 2, S_ / 2, S_ * 0.435, 0, 7);
    g.lineWidth = 16; g.strokeStyle = '#e09b12'; g.stroke();
    g.beginPath(); g.arc(S_ / 2, S_ / 2, S_ * 0.435, 0, 7);
    g.lineWidth = 6; g.strokeStyle = '#ffe08a'; g.stroke();
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true,
      depthWrite: false, depthTest: false, fog: false }));
    sp.scale.set(scale, scale, 1);
    sp.renderOrder = 880;                // over the world, under its contents
    return sp;
  }

  function makeBubble(x, y, z, content, caption) {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);

    const rim = bubblePlate(layout().scale);
    grp.add(rim);

    /* a little shadow on the grass under each one, so they read as objects
       standing in a place rather than stickers floating on the screen */
    const foot = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 20),
      new THREE.MeshBasicMaterial({ map: F.shadowTexture(), transparent: true,
                                    depthWrite: false, opacity: 0.5, fog: false }));
    foot.rotation.x = -Math.PI / 2;
    foot.position.y = -(y - 0.04);
    grp.add(foot);

    const spin = new THREE.Group();
    if (content) spin.add(content);
    grp.add(spin);

    /* the tap target: a plain invisible sphere, generous on purpose */
    const hit = new THREE.Mesh(new THREE.SphereGeometry(layout().scale * 0.42, 10, 8),
      new THREE.MeshBasicMaterial({ visible: false }));
    grp.add(hit);

    let cap = null;
    if (caption) {
      cap = textSprite(caption, 2.7);
      cap.position.y = -1.45;
      grp.add(cap);
    }
    scene.add(grp);
    return { grp: grp, hit: hit, rim: rim, spin: spin, cap: cap, x: x, y: y, z: z, t: Math.random() * 6 };
  }

  function clearBubbles() {
    for (const b of bubbles) { try { F.discard(b.grp); } catch (e) {} }
    bubbles.length = 0;
    if (!rings.length) showStrip(true);
  }
  /* the strip lives across the top of the screen, exactly where the answers
     appear — it steps aside while a question is up */
  function showStrip(on) { try { LV().stripVisible(on); } catch (e) {} }
  function clearRings() {
    if (!bubbles.length) showStrip(true);
    for (const r of rings) {
      try { F.discard(r.mesh); } catch (e) {}
      try { if (r.tag) F.discard(r.tag); } catch (e) {}
    }
    rings.length = 0;
  }
  function clearMark() {
    if (anchorMark) { try { F.discard(anchorMark); } catch (e) {} anchorMark = null; }
  }
  function clearAll() { clearBubbles(); clearRings(); clearMark(); }

  /* ════════════════════════════════════════════════════════ the rounds */
  const byId = (id) => C.gear.find((g) => g.id === id);
  const things = () => C.gear.filter((g) => g.kind === 'thing');
  const places = () => C.gear.filter((g) => g.kind === 'place');
  const funcs = () => C.gear.filter((g) => g.fnAsk);

  function pickOthers(pool, notId, n) {
    const rest = pool.filter((g) => g.id !== notId);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = rest[i]; rest[i] = rest[j]; rest[j] = t;
    }
    return rest.slice(0, n);
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---- round A: THINGS ------------------------------------------------ */
  function askThing(item) {
    const stage = stageFor(item);
    const opts = shuffle([item].concat(pickOthers(things(), item.id, 2)));
    Q.active = { kind: 'thing', item: item, opts: opts.map((o) => o.id) };
    Q.tries = 0;

    opts.forEach((o, i) => {
      const at = slot(stage, i);
      const b = makeBubble(at.x, at.y, at.z, miniModel(o.id), null);
      b.id = o.id;
      b.right = o.id === item.id;
      bubbles.push(b);
    });
    anchorMark = F.marker(stage.stand.x, stage.stand.z, 0xffd43b, 1.4);
    niluAside(stage);
    showStrip(false);
    say(C.gearQ.naming, { thing: tr(item.name) }, { emoji: item.emoji });
  }

  /* Park Nilu off to the far side of the stage while a question is up. She
     is a big elephant and she was standing in front of the answers. */
  function niluAside(stage) {
    const N = F.nilu;
    if (!N || !stage.nilu) return;
    N.goTo(stage.nilu.x, stage.nilu.z, () => {
      try { N.lookAt(SWalk.pos.x, SWalk.pos.z); } catch (e) {}
    });
  }

  /* ---- round B: PLACES ------------------------------------------------ */
  function askPlace(item) {
    const opts = shuffle([item].concat(pickOthers(places(), item.id, 2)));
    Q.active = { kind: 'place', item: item, opts: opts.map((o) => o.id) };
    Q.tries = 0;

    for (const o of opts) {
      const at = PLACE_AT[o.id];
      if (!at) continue;
      const mesh = F.marker(at.x, at.z, o.id === item.id ? 0xffd43b : 0xffd43b, at.r);
      mesh.material.opacity = 0.55;
      const tag = emojiSprite(o.emoji, 1.5);
      tag.position.set(at.x, 2.2, at.z);
      scene.add(tag);
      rings.push({ mesh: mesh, tag: tag, id: o.id, at: at, right: o.id === item.id, t: Math.random() * 6 });
      /* the sprite is a separate scene child — remember to take it away too */
      mesh.userData.tag = tag;
    }
    showStrip(false);
    say(C.gearQ.where, { thing: tr(item.name) }, { emoji: item.emoji });
    try { SWalk.hint(LV().fill(tr(C.gearQ.walkTo), { thing: tr(item.name) }), 4200); } catch (e) {}
  }

  /* ---- round C: WHAT IS IT FOR --------------------------------------- */
  function askFunction(item) {
    const stage = STAGE;
    const opts = shuffle([item].concat(pickOthers(funcs(), item.id, 2)));
    Q.active = { kind: 'function', item: item, opts: opts.map((o) => o.id) };
    Q.tries = 0;

    opts.forEach((o, i) => {
      const at = slot(stage, i);
      const b = makeBubble(at.x, at.y + 0.2, at.z, discAnswer(o.emoji, tr(o.whatFor)), null);
      b.id = o.id;
      b.right = o.id === item.id;
      bubbles.push(b);
    });
    niluAside(stage);
    showStrip(false);
    say(C.gearQ.function, { thing: tr(item.name) }, { emoji: item.emoji });
    /* Deliberately NOT reading all three aloud. Hearing every option before
       choosing is a lot to hold in your head; the child hears back the one
       they actually pick instead. */
  }

  /* ══════════════════════════════════ EARN YOUR WAY ONTO THE FIELD EARLY
     Thirty-three questions before you touch a ball is too many; a child loses
     interest long before the fun part. So each skill opens as soon as you
     know the gear it actually needs — throwing after the ball and the glove,
     which is two questions in — and you're asked, right then, whether you'd
     like to go and do it. Staying to learn more is an equally good answer,
     and Level 1 picks up exactly where you left it. */
  const EARLY = [
    { level: 'throw', needs: ['ball', 'glove'] },
    { level: 'bat', needs: ['bat', 'helmet'] },
    { level: 'pitch', needs: ['ball', 'circle'] },
    { level: 'field', needs: ['glove', 'first'] },
    { level: 'run', needs: ['first', 'second', 'third'] },
  ];

  function checkEarlyUnlock() {
    for (const e of EARLY) {
      try { if (LV().G.open[e.level]) continue; } catch (err) { continue; }
      if (!e.needs.every((id) => Q.done.indexOf(id) >= 0)) continue;
      try { LV().unlock(e.level); } catch (err) {}
      return e.level;
    }
    return null;
  }

  /* the offer itself — two big buttons, neither of them wrong */
  function offerJump(level) {
    let name = level;
    try { name = LV().levelName(level); } catch (e) {}
    const p = LV().panel('sbUnlock',
      '<h2>🔓 ' + LV().fill(tr(C.gearQ.unlockedGo), { level: name }) + '</h2>' +
      '<p class="sbSub">' + tr(C.gearQ.unlockedAsk) + '</p>' +
      '<button class="sbBig" id="sbGoNow">' + tr(C.gearQ.goNow) + '</button>' +
      '<button class="sbLink" id="sbStay">' + tr(C.gearQ.keepLearning) + '</button>');
    say(C.gearQ.unlockedGo, { level: name }, { emoji: '🔓' });
    document.getElementById('sbGoNow').addEventListener('click', () => {
      sfx('star');
      p._close();
      /* they lined up when practice started a few minutes ago — going to play
         the thing they just unlocked shouldn't put another line-up in the way */
      try { window.SBTeam && SBTeam.markLinedUp(level); } catch (e) {}
      try { LV().goToLevel(level); } catch (e) {}
    });
    document.getElementById('sbStay').addEventListener('click', () => {
      sfx('tap');
      p._close();
      say(C.gearQ.comeBack, { level: name }, { emoji: '💙' });
      setTimeout(() => { clearAll(); next(); }, 2200 * speedMul());
    });
  }

  /* ---- round D: SAFETY ------------------------------------------------ */
  let safetyStep = 0;
  function nextSafety() {
    /* first every rule as a card from Nilu, then three checks */
    if (safetyStep < C.safety.length) {
      const r = C.safety[safetyStep++];
      say({ en: r.rule.en + ' ' + r.why.en, es: r.rule.es + ' ' + r.why.es }, null, { emoji: r.emoji });
      try {
        SWalk.showCard(r.emoji, tr(r.rule), tr(r.why), {
          sticky: true, btn: tr(C.ui.ok),
          onDone: () => setTimeout(nextSafety, 400),
        });
      } catch (e) { setTimeout(nextSafety, 2600); }
      return;
    }
    const checks = ['helmet-first', 'bat-space', 'ask-break'];
    const idx = safetyStep - C.safety.length;
    if (idx >= checks.length) { finishSafety(); return; }
    safetyStep++;
    askSafety(C.safety.find((s) => s.id === checks[idx]));
  }

  function askSafety(rule) {
    if (!rule) { nextSafety(); return; }
    const stage = STAGE;
    const opts = shuffle([rule].concat(pickOthers(C.safety, rule.id, 2)));
    Q.active = { kind: 'safety', item: rule, opts: opts.map((o) => o.id) };
    Q.tries = 0;
    opts.forEach((o, i) => {
      const at = slot(stage, i);
      const b = makeBubble(at.x, at.y + 0.2, at.z, discAnswer(o.emoji, tr(o.rule)), null);
      b.id = o.id;
      b.right = o.id === rule.id;
      bubbles.push(b);
    });
    niluAside(stage);
    showStrip(false);
    say(rule.why, null, { emoji: '🛟' });
    setTimeout(() => {
      if (Q.active && Q.active.item === rule) say(C.safetyQ.ask, null, { emoji: '🛟' });
    }, 1800 * speedMul());
  }

  function finishSafety() {
    Q.active = null;
    clearAll();
    say(C.safetyQ.done, null, { emoji: '🛟' });
    try { LV().sticker('safety', tr(C.safetyQ.done)); } catch (e) {}
    /* send Coach AJ back to the front of the field */
    try {
      const co = LV().aj();
      if (co && co.home) { co.pose = null; co.goTo(co.home.x, co.home.z); }
    } catch (e) {}
    setTimeout(finishLevel, 3200 * speedMul());
  }

  /* ═══════════════════════════════════════════════════ answering ═══════ */
  function choose(id) {
    if (!Q.active || paused || clock < lockUntil) return;
    const a = Q.active;
    const rightId = a.kind === 'safety' ? a.item.id : a.item.id;
    if (id === rightId) { rightAnswer(); return; }
    wrongAnswer(id);
  }

  /* Say a label that has already been translated. There is no template here
     on purpose — wrapping it in a t('{picked}.', '{picked}.') would put a
     string with nothing to translate into the coaches' file. */
  function sayPicked(text, emoji) {
    if (!text) return;
    say({ en: text, es: text }, null, { emoji: emoji || '💛' });
  }

  /* what to call the thing they just tapped, in the words of the round */
  function labelFor(kind, id) {
    if (kind === 'safety') return tr(((C.safety.find((x) => x.id === id)) || {}).rule || '');
    if (kind === 'function') return tr(((byId(id)) || {}).whatFor || '');
    return tr(((byId(id)) || {}).name || '');
  }

  function rightAnswer() {
    const a = Q.active;
    if (!a) return;
    Q.active = null;
    lockUntil = clock + 0.6;
    sfx('yes');
    record('learn');
    if (a.kind === 'thing' || a.kind === 'place') {
      say(C.gearQ.right, { thing: tr(a.item.name) }, { emoji: a.item.emoji });
    } else {
      /* say back the one they chose, then confirm it */
      sayPicked(labelFor(a.kind, a.item.id), a.item.emoji);
      setTimeout(() => say(C.gearQ.rightFn, null, { emoji: '⭐' }), 1600 * speedMul());
    }

    /* the winning bubble blooms, the others fade — and paper goes up over the
       one they got, so the win is something that happens rather than something
       they are told */
    for (const b of bubbles) {
      if (b.right) {
        b.win = 0.001;
        try { F.confetti(b.x, b.y + 0.9, b.z, 24); } catch (e) {}
      } else b.fade = 0.001;
    }
    for (const r of rings) { if (!r.right) r.fade = 0.001; else r.win = 0.001; }

    if (!Q.done.includes(a.item.id)) { Q.done.push(a.item.id); persist(); }
    /* the note is the teaching moment — say it while the bubble blooms */
    if (a.item.note) {
      /* after "you picked X" and "that's right" have both had their moment */
      setTimeout(() => { try { const n = LV().fill(tr(a.item.note)); LV().voice(n); LV().cue(n, a.item.emoji); } catch (e) {} }, 3400 * speedMul());
    }
    setTimeout(() => {
      clearAll();
      /* did that answer just earn them a station? ask before carrying on */
      const won = checkEarlyUnlock();
      if (won) { offerJump(won); return; }
      next();
    }, 5800 * speedMul());
  }

  function wrongAnswer(id) {
    const a = Q.active;
    if (!a) return;
    Q.tries++;
    lockUntil = clock + 0.5;
    sfx('pop');
    const picked = labelFor(a.kind, id);
    if (a.kind === 'thing' || a.kind === 'place') {
      say(C.gearQ.softMiss, { picked: picked, thing: tr(a.item.name) }, { emoji: '💛' });
    } else {
      /* name the one they chose, then correct it — nothing else is read out */
      sayPicked(picked, '💛');
      setTimeout(() => say(C.gearQ.softMissFn, null, { emoji: '💛' }), 1400 * speedMul());
    }
    if (Q.tries >= 2) {
      /* two tries is enough — show them, warmly. This can never be failed. */
      setTimeout(() => {
        if (!Q.active) return;
        say(C.gearQ.glowHelp, null, { emoji: '💙' });
        for (const b of bubbles) if (b.right) b.help = true;
        for (const r of rings) if (r.right) r.help = true;
      }, 1600 * speedMul());
    }
  }

  /* ══════════════════════════════════════════════════ the round machine */
  function next() {
    if (!running) return;
    Q.active = null;
    clearAll();

    if (Q.round === 'things') {
      const list = things();
      if (Q.i >= list.length) { Q.round = 'places'; Q.i = 0; persist(); return startPlaces(); }
      const item = list[Q.i++];
      persist();
      leadTo(STAGE.stand, () => askThing(item));
      return;
    }
    if (Q.round === 'places') {
      const list = places();
      if (Q.i >= list.length) { Q.round = 'function'; Q.i = 0; persist(); return startFunction(); }
      const item = list[Q.i++];
      persist();
      askPlace(item);
      return;
    }
    if (Q.round === 'function') {
      const list = funcs();
      if (Q.i >= list.length) { Q.round = 'safety'; Q.i = 0; safetyStep = 0; persist(); return startSafety(); }
      const item = list[Q.i++];
      persist();
      askFunction(item);
      return;
    }
    if (Q.round === 'safety') { nextSafety(); return; }
    finishLevel();
  }

  /* Nilu walks ahead, then the question starts when the child gets there */
  function leadTo(at, then) {
    Q.at = { x: at.x, z: at.z };
    const N = F.nilu;
    /* she waits on open grass past the answers — close enough to follow, and
       never routed into the dugout, where she used to get wedged behind the
       bench */
    if (N) N.goTo(at.x, at.z - 3.4, () => { try { N.lookAt(SWalk.pos.x, SWalk.pos.z); } catch (e) {} });
    anchorMark = F.marker(at.x, at.z, 0xffd43b, 1.5);
    const p = SWalk.pos;
    if (Math.hypot(p.x - at.x, p.z - at.z) < 4.2) { then(); return; }
    say(C.start.followHint, null, { emoji: '🐘' });
    SWalk.addSpot({
      id: 'gearStop', x: at.x, z: at.z, r: 4.2, once: true,
      onEnter: () => { if (running && !paused) then(); },
    });
  }

  function startPlaces() {
    say({ en: 'Now let\'s find the places on the field!', es: '¡Ahora vamos a encontrar los lugares del campo!' }, null, { emoji: '🗺️' });
    setTimeout(next, 2600 * speedMul());
  }
  function startFunction() {
    const at = STAGE.stand;
    say({ en: 'Come back to the dugout — I want to know what they are FOR!',
          es: '¡Vuelve al dugout — quiero saber para qué SIRVEN!' }, null, { emoji: '🏠' });
    leadTo(at, () => setTimeout(next, 400));
  }
  /* Coach AJ walks over and teaches the safety rules himself. */
  function startSafety() {
    try {
      LV().ajSays([C.aj.safetyIntro, C.safetyQ.intro], () => setTimeout(nextSafety, 600), { stay: true });
    } catch (e) {
      say(C.safetyQ.intro, null, { emoji: '🛟' });
      setTimeout(nextSafety, 2600 * speedMul());
    }
  }

  function finishLevel() {
    if (!running) return;
    running = false;
    Q.round = 'done';
    persist();
    clearAll();
    SWalk.removeSpot('gearStop');
    sfx('star');
    try { LV().sticker('gear', LV().levelName('gear')); } catch (e) {}
    try { LV().unlock('throw'); } catch (e) {}
    try { K.streakBump && K.streakBump(); } catch (e) {}
    say(C.gearQ.allDone, null, { emoji: '⭐' });
    setTimeout(() => { try { LV().goToLevel('throw'); } catch (e) {} }, 4600 * speedMul());
  }

  function persist() {
    save('gear', { round: Q.round, i: Q.i, done: Q.done, safety: safetyStep });
  }
  function restore() {
    const g = load('gear', null);
    if (!g) return;
    Q.round = g.round || 'things';
    Q.i = +g.i || 0;
    Q.done = Array.isArray(g.done) ? g.done : [];
    safetyStep = +g.safety || 0;
    if (Q.round === 'done') { Q.round = 'things'; Q.i = 0; Q.done = []; safetyStep = 0; }
  }

  /* ══════════════════════════════════════════════════════════════ API */
  S.start = function () {
    C = window.SBContent; F = window.SBField; L = F && F.L;
    THREE = F && F.three(); scene = F && F.scene();
    if (!C || !F || !THREE || !scene) return false;
    if (!PLACE_AT) buildPlaceMap();
    restore();
    running = true; paused = false;
    markStage();
    clearAll();
    next();
    return true;
  };

  S.leave = function () {
    running = false;
    Q.active = null;
    clearAll();
    if (stageRing) { try { F.discard(stageRing); } catch (e) {} stageRing = null; }
    showStrip(true);
    try { SWalk.removeSpot('gearStop'); } catch (e) {}
  };

  /* 🙋 a break can happen mid-question. Park it; put it back untouched. */
  S.suspend = function () {
    if (!running) return;
    paused = true;
    for (const b of bubbles) b.grp.visible = false;
    for (const r of rings) { r.mesh.visible = false; if (r.tag) r.tag.visible = false; }
    if (anchorMark) anchorMark.visible = false;
  };
  S.resume = function () {
    if (!running) return;
    paused = false;
    /* Coming back from a 🙋 request usually means walking across the field —
       possibly straight through an answer. Disarm everything so the child has
       to approach deliberately again; nobody answers a question by accident. */
    for (const b of bubbles) { b.grp.visible = true; b.armed = false; }
    for (const r of rings) { r.mesh.visible = true; r.armed = false; if (r.tag) r.tag.visible = true; }
    if (anchorMark) anchorMark.visible = true;
    /* re-ask, so a child coming back from a break is never left guessing */
    if (Q.active) {
      const a = Q.active;
      if (a.kind === 'thing') say(C.gearQ.naming, { thing: tr(a.item.name) }, { emoji: a.item.emoji });
      else if (a.kind === 'place') say(C.gearQ.where, { thing: tr(a.item.name) }, { emoji: a.item.emoji });
      else if (a.kind === 'function') say(C.gearQ.function, { thing: tr(a.item.name) }, { emoji: a.item.emoji });
      else say(C.safetyQ.ask, null, { emoji: '🛟' });
    }
  };

  S.onTap = function (caster) {
    if (!running || paused || !Q.active) return false;
    if (bubbles.length) {
      const hits = caster.intersectObjects(bubbles.map((b) => b.hit), false);
      if (hits.length) {
        const b = bubbles.find((x) => x.hit === hits[0].object);
        if (b) { sfx('tap'); choose(b.id); return true; }
      }
    }
    if (rings.length) {
      const hits = caster.intersectObjects(rings.map((r) => r.mesh), false);
      if (hits.length) {
        const r = rings.find((x) => x.mesh === hits[0].object);
        /* tapping a place WALKS you there — arriving is the answer */
        if (r) { sfx('tap'); SWalk.walkTo(r.at.x, r.at.z); return true; }
      }
    }
    return false;
  };

  S.tick = function (dt) {
    if (!running) return;
    clock += dt;
    const soft = calm() ? 0.5 : 1;
    const p = SWalk.pos;

    for (const b of bubbles) {
      b.t += dt;
      if (b.fade != null) {
        b.fade += dt * 2.2;
        const k = Math.max(0, 1 - b.fade);
        b.grp.scale.setScalar(k);
        b.grp.visible = k > 0.02;
        continue;
      }
      if (b.win != null) {
        b.win += dt * 2.4;
        const k = 1 + Math.sin(Math.min(Math.PI, b.win * 2.2)) * 0.35;
        b.grp.scale.setScalar(k);
        b.rim.material.color.setHex(0x69db7c);
        continue;
      }
      b.grp.position.y = b.y + Math.sin(b.t * 1.5) * 0.11 * soft;
      b.spin.rotation.y += dt * 0.7;
      const pulse = b.help ? (1 + Math.sin(b.t * 6) * 0.13) : 1;
      b.grp.scale.setScalar(pulse);
      b.rim.material.opacity = b.help ? 0.55 + Math.sin(b.t * 6) * 0.45 : 1;
      if (b.help) b.rim.material.color.setHex(0x69db7c);
      /* Walking into a bubble picks it — no tapping needed. But a bubble can
         appear right where the child is already standing, so it only becomes
         pickable once they have been clear of it: otherwise it answers itself
         the instant it spawns (and keeps answering, every frame). */
      const bd = Math.hypot(p.x - b.x, p.z - b.z);
      if (!b.armed) { if (bd > 2.1) b.armed = true; }
      else if (!paused && Q.active && bd < 1.25) choose(b.id);
    }

    for (const r of rings) {
      r.t += dt;
      if (r.fade != null) {
        r.fade += dt * 2.2;
        const k = Math.max(0, 1 - r.fade);
        r.mesh.material.opacity = 0.55 * k;
        if (r.tag) r.tag.material.opacity = k;
        continue;
      }
      const base = r.help ? 0.5 + Math.sin(r.t * 6) * 0.45 : 0.45 + Math.sin(r.t * 2) * 0.14;
      r.mesh.material.opacity = base;
      if (r.help) r.mesh.material.color.setHex(0x69db7c);
      if (r.tag) r.tag.position.y = 2.2 + Math.sin(r.t * 1.6) * 0.12 * soft;
      const rd = Math.hypot(p.x - r.at.x, p.z - r.at.z);
      if (!r.armed) { if (rd > r.at.r * 1.5) r.armed = true; }
      else if (!paused && Q.active && rd < r.at.r * 0.85) choose(r.id);
    }

    if (anchorMark) anchorMark.material.opacity = 0.5 + Math.sin(clock * 2.4) * 0.25;
  };

  /* the phone turned — put the answers back where they now fit */
  S.relayout = function () {
    if (!running || !bubbles.length) return;
    bubbles.forEach((b, i) => {
      const at = slot(STAGE, i);
      b.x = at.x; b.z = at.z;
      b.y = at.y + (Q.active && Q.active.kind !== 'thing' ? 0.2 : 0);
      b.grp.position.set(b.x, b.y, b.z);
    });
  };

  /* grown-up / test helpers — also what Coach Mode reads */
  S.state = () => ({
    round: Q.round, i: Q.i, done: Q.done.length, paused: paused, running: running,
    ask: Q.active ? Q.active.item.id : null, kind: Q.active ? Q.active.kind : null,
    choices: Q.active ? Q.active.opts : null,
    at: Q.at || null,
  });
  S.answer = (id) => choose(id);
  S.jumpTo = (round) => { Q.round = round; Q.i = 0; safetyStep = 0; Q.active = null; clearAll(); next(); };

  /* start Level 1 over from the top */
  S.forget = function () {
    Q.round = 'things'; Q.i = 0; Q.done = []; safetyStep = 0;
    persist();
  };

  window.SBGear = S;
})();
