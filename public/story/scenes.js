/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   OUR FIRST YEAR — the chapters  (window.ABEStoryScenes)

   Thirteen chapters, every one of them true. The order is the order it
   happened in, except the first: the day Aaria ran across town for a blue
   elephant comes first, because that day is where the name came from.

   A chapter is:
     { id, dur, sky, kicker:{en,es}, photo, caps:[{a,b,en,es}], draw(g,t,u,S) }
   draw() is handed the seconds into the chapter and its 0..1 progress, and
   must be a pure function of them — same t, same frame, every time.

   Every line of narration exists in English and Spanish. English is the
   authoritative version; the Spanish is AI-translated (see the general
   disclosure linked in the footer of the page).

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const A = window.ABEArt, W = window.ABEProps, P = A.P;
  const at = A.at, eo = A.eo, ei = A.ei, eio = A.eio, hump = A.hump;
  const lerp = A.lerp, clamp = A.clamp, rand = A.rand, pop = A.pop, back = A.back;

  /* a quick dip to white, to hide a hard cut between shots inside a chapter */
  function cut(g, t, marks) {
    let a = 0;
    for (const m of marks) { const d = Math.abs(t - m); if (d < 0.2) a = Math.max(a, 1 - d / 0.2); }
    if (a > 0) { g.save(); g.fillStyle = 'rgba(255,255,255,' + a + ')'; g.fillRect(0, 0, 1920, 1080); g.restore(); }
  }
  /* a walk / run cycle as a plain pose object */
  function stride(t, sp, amp) {
    const p = t * sp * A.TAU;
    return {
      /* a walk swings forward and back, not across the body — so the whole
         cycle happens in the character's own sagittal plane, and a walker
         turned side-on to the camera reads exactly as they always did */
      plane: 'side',
      legL: Math.sin(p) * amp, legR: -Math.sin(p) * amp,
      legLe: Math.max(0, -Math.sin(p)) * 0.55, legRe: Math.max(0, Math.sin(p)) * 0.55,
      armL: -Math.sin(p) * amp * 0.85, armLe: 0.5, armR: Math.sin(p) * amp * 0.85, armRe: -0.5,
    };
  }
  const HUG = { armL: 1.5, armLe: 0.9, armR: -1.5, armRe: -0.9 };
  const REACH = { armL: 0.3, armR: -1.35, armRe: -0.5 };
  const UP    = { armL: 2.7, armLe: 0.3, armR: -2.7, armRe: -0.3 };
  const EARS  = { armL: 2.5, armLe: 0.9, armR: -2.5, armRe: -0.9 };   // hands over ears
  /* sitting: the thighs come FORWARD out of the hips (sagittal) while the
     arms still rest across the body (frontal) */
  const SIT   = { legPlane: 'side', legL: 1.5, legLe: -1.5, legR: 1.35, legRe: -1.5,
                  armL: 0.34, armLe: 0.8, armR: -0.34, armRe: -0.8 };

  const S = [];

  /* ══════════════════════════════════════════════════ 0 · TITLE (11s) */
  S.push({
    id: 'title', dur: 11, sky: 'joy',
    /* the camera: a slow, admiring drift onto the mark */
    cam: function (t, u) { return { zoom: 1 + u * 0.06, dy: -u * 14, vpy: 360 }; },
    kicker: null,
    caps: [],
    draw: function (g, t, u) {
      W.sky(g, 'joy');
      W.cloud(g, 300 + t * 9, 200, 1.5, 0.75);
      W.cloud(g, 1500 - t * 7, 290, 1.9, 0.6);
      W.cloud(g, 900 + t * 5, 140, 1.1, 0.5);
      const r = lerp(120, 250, pop(at(t, 0.3, 2.2)));
      g.save();
      g.translate(960, 420 - hump(at(t, 0, 1)) * 12);
      g.rotate(lerp(-0.28, 0, eo(at(t, 0.3, 2.6))));
      g.translate(-960, -420);
      A.badge(g, 960, 420, r, at(t, 0.3, 1.2), t);
      g.restore();

      const ta = eo(at(t, 2.4, 3.6));
      g.save(); g.globalAlpha = ta;
      A.text(g, 'Our First Year', 960, 760 + (1 - ta) * 30, 92, { color: P.ink });
      g.restore();
      const es = window.ABEStory && window.ABEStory.es;
      const tb = eo(at(t, 3.2, 4.4));
      g.save(); g.globalAlpha = tb;
      A.text(g, es ? 'Nuestro primer año' : 'Nuestro primer año', 960, 848, 46, { color: P.inkSoft, weight: 700 });
      g.restore();
      const tc = eo(at(t, 4.4, 5.6));
      g.save(); g.globalAlpha = tc;
      A.text(g, '2 Nov 2025  ·  2 Nov 2026', 960, 946, 44, { color: P.blueDk });
      g.restore();

      for (let i = 0; i < 12; i++) {
        const st = (t * 0.22 + rand(i) ) % 1;
        const x = rand(i * 3.3) * 1920, y = 1080 - st * 1100;
        g.save(); g.globalAlpha = hump(st) * 0.7;
        if (i % 3) W.heart(g, x, y, 16 + rand(i * 7) * 10, '#f2708f');
        else W.star(g, x, y, 15, P.sun, t + i);
        g.restore();
      }
    },
  });

  /* ════════════════════════════════ 1 · RUNNING FOR THE BLUE ELEPHANT (34s) */
  S.push({
    id: 'run', dur: 34, sky: 'day',
    /* Six shots, six camera positions. The one that matters is the crossing:
       she runs AWAY from us up the road, so the vanishing point sits right
       behind her and the lens pushes in while she gets smaller. */
    cam: function (t) {
      if (t < 6.5)  return { zoom: 1 + at(t, 0, 6.5) * 0.09, yaw: lerp(-0.10, 0.07, at(t, 0, 6.5)), vpx: 900, vpy: 300 };
      if (t < 11.6) return { zoom: 1.04, vpx: 1520, vpy: 420, yaw: -0.05 };
      if (t < 19.2) return { zoom: 1 + at(t, 11.6, 17.4) * 0.16, vpx: 980, vpy: 300, fy: 760 };
      if (t < 24.2) return { zoom: 1.03, vpx: 380, vpy: 380, yaw: 0.08 };
      if (t < 29.6) return { zoom: 1 + at(t, 24.2, 29) * 0.11, vpx: 1140, vpy: 340, yaw: -0.12 };
      return { zoom: 1 + at(t, 29.6, 34) * 0.13, yaw: lerp(0.10, -0.05, at(t, 29.6, 34)) };
    },
    kicker: { en: 'Before there was a name', es: 'Antes de que hubiera un nombre' },
    caps: [
      { a: 0.6, b: 6.2, en: 'One afternoon, Mummy and Daddy were both busy with work.',
        es: 'Una tarde, mami y papi estaban ocupados con el trabajo.' },
      { a: 6.8, b: 11.3, en: 'Aaria had one thought only: the blue elephant at our friend’s house.',
        es: 'Aaria tenía un solo pensamiento: el elefante azul en la casa de nuestro amigo.' },
      { a: 12.0, b: 15.4, en: 'She reached the four-way crossing.',
        es: 'Llegó al cruce de cuatro vías.' },
      { a: 15.6, b: 19.0, en: 'She never looked up. She was only thinking about the elephant.',
        es: 'Nunca miró hacia arriba. Solo pensaba en el elefante.' },
      { a: 19.4, b: 23.8, en: 'One driver did not drive away. They followed her, slowly, the whole way.',
        es: 'Un conductor no se fue. La siguió, despacio, todo el camino.' },
      { a: 24.4, b: 29.2, en: 'They were about to call 911 — then our friend said, “She’s my friend’s daughter.”',
        es: 'Estaban a punto de llamar al 911 — y nuestro amigo dijo: «Es la hija de mi amigo».' },
      { a: 29.8, b: 34, en: 'The phone rang. She was safe. And she was so, so happy.',
        es: 'Sonó el teléfono. Estaba a salvo. Y estaba feliz, muy feliz.' },
    ],
    draw: function (g, t, u) {
      /* ── shot A: the living room, two laptops, one small plan */
      if (t < 6.5) {
        W.room(g, { floorY: 640, wall: '#ffeedd' });
        W.window(g, 1700, 260, 280, 220, { curtain: '#f2a3a3' });
        A.mum(g, { x: 400, y: 830, k: 3.0, turn: 0.5, expr: 'flat', pose: SIT });
        A.dad(g, { x: 1110, y: 830, k: 3.0, turn: -0.45, expr: 'flat', pose: SIT });
        W.table(g, 400, 840, 1.25); W.table(g, 1110, 840, 1.25);
        A.rr(g, 316, 620, 172, 112, 8); A.shape(g, '#cfd8e6', 7);
        A.rr(g, 1026, 620, 172, 112, 8); A.shape(g, '#cfd8e6', 7);
        // Aaria at the window, thinking hard about one thing
        const ax = 1700 + Math.sin(t * 1.4) * 4;
        // she is at the window with her back half to the room, looking out
        A.aaria(g, { x: ax, y: 812, k: 2.7, turn: 1.15, expr: 'bliss',
          blink: Math.sin(t * 2.6) > 0.94 ? 1 : 0, pose: UP });
        if (t > 1.6) {
          const b = eo(at(t, 1.6, 2.6));
          g.save(); g.globalAlpha = b;
          W.bubble(g, 1330, 300, 320, 250, ax - 60, 600, { thought: true });
          A.plush(g, 1330, 322, 2.9 * b, { rot: Math.sin(t * 2) * 0.08 });
          g.restore();
        }
        if (t > 4.4) {   // and then she is simply not there
          const f = eo(at(t, 4.4, 5.6));
          g.save(); g.globalAlpha = f * 0.9;
          A.text(g, '🚪', 130, 700, 110, {});
          g.restore();
        }
      /* ── shot B: the street, running */
      } else if (t < 11.6) {
        const st = t - 6.5;
        W.sky(g, 'day'); W.sun(g, 1680, 150, 70, t);
        W.cloud(g, 400 - st * 40, 180, 1.4, 0.8);
        W.cloud(g, 1400 - st * 30, 240, 1.1, 0.6);
        W.hills(g, 430, t);
        const pan = st * 210;
        g.save(); g.translate(-(pan % 700), 0);
        for (let i = 0; i < 5; i++) {
          W.mhHouse(g, 200 + i * 700, 752, 0.9, { t: t,
            wall: ['#fff1de', '#eef3fb', '#fdeef0', '#f4f1e4'][i % 4],
            roof: ['#b06a54', '#8d7f9b', '#a8705f', '#7f8f6a'][i % 4] });
        }
        g.restore();
        W.ground(g, 752, '#9ed68f', '#77bd78');
        W.street(g, 756, pan, t);
        W.wind(g, t, 12, { y0: 300, span: 380 });
        const bob = Math.abs(Math.sin(st * 7)) * 14;
        A.aaria(g, {
          x: 820, y: 852 - bob, k: 2.9, expr: 'bliss', lean: 0.13,
          turn: 1.38,                       // side on, running into frame right
          pose: stride(st, 2.6, 0.78),
        });
        // little speed puffs behind her
        for (let i = 0; i < 5; i++) {
          const ph = ((st * 1.8 + i * 0.2) % 1);
          g.save(); g.globalAlpha = (1 - ph) * 0.45;
          A.ell(g, 760 - ph * 190, 820 - rand(i) * 40, 24 * (0.4 + ph), 14 * (0.4 + ph));
          g.fillStyle = P.white; g.fill(); g.restore();
        }
      /* ── shot C: the four-way crossing */
      } else if (t < 19.2) {
        const st = t - 11.6;
        W.sky(g, 'day');
        W.hills(g, 286, t, { tScale: 0.5 });
        for (let i = 0; i < 3; i++) {
          W.mhHouse(g, 240 + i * 700, 482, 0.56, { t: t,
            wall: ['#fff1de', '#eef3fb', '#fdeef0'][i], roof: ['#b06a54', '#8d7f9b', '#a8705f'][i] });
        }
        W.ground(g, 482, '#9ed68f', '#77bd78');
        g.fillStyle = '#cfd6e2'; g.fillRect(0, 516, 1920, 72);
        W.road(g, 588, 232);
        g.fillStyle = '#cfd6e2'; g.fillRect(0, 820, 1920, 80);
        W.ground(g, 900, '#9ed68f', '#77bd78');
        // the crossing itself, plus the sign that names it
        g.save(); g.fillStyle = 'rgba(255,255,255,.93)';
        for (let i = 0; i < 7; i++) g.fillRect(840 + i * 0, 0, 0, 0);
        for (let i = 0; i < 6; i++) g.fillRect(806, 596 + i * 38, 300, 22);
        g.restore();
        A.rr(g, 236, 300, 14, 230, 6); A.shape(g, '#9aa6bd', 5);
        g.save(); g.translate(243, 280); g.rotate(0.03);
        g.beginPath();
        for (let i = 0; i < 8; i++) { const a = (i / 8) * A.TAU + Math.PI / 8; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 66, Math.sin(a) * 66); }
        g.closePath(); A.shape(g, '#d8453c', 7);
        A.text(g, 'STOP', 0, 2, 30, { color: P.white });
        g.restore();
        // cars
        const carB = 2100 - st * 300;
        W.car(g, carB, 700, 0.95, '#7fa8d9', { facing: -1 });
        const brake = clamp((st - 2.2) / 1.6, 0, 1);
        const carA = lerp(-200, 720, eo(clamp(st / 2.6, 0, 1))) + brake * 0;
        W.car(g, carA, 790, 1.05, '#e05a5a', { lights: true });
        if (st > 2.3 && st < 4.6) {
          g.save(); g.strokeStyle = 'rgba(30,30,40,.5)'; g.lineWidth = 12; g.lineCap = 'round';
          [-48, 48].forEach((d) => { g.beginPath(); g.moveTo(carA - 170, 790 + d * 0.35); g.lineTo(carA - 60, 790 + d * 0.35); g.stroke(); });
          g.restore();
        }
        // Aaria crossing, away from camera: she rises up the frame and shrinks
        const cp = clamp(st / 5.4, 0, 1);
        const ax = lerp(560, 1000, cp), ay = lerp(940, 560, eo(cp));
        const ak = lerp(2.9, 1.9, cp);
        /* away from the camera, up the road. This is the shot the whole 3D
           rebuild buys: she turns her back on us and gets smaller. */
        A.aaria(g, { x: ax, y: ay, k: ak, expr: 'bliss', lean: 0.1,
          turn: Math.PI - 0.62, pose: stride(st, 2.7, 0.75) });
        // the moment: a red pulse, a held breath
        if (st > 2.4 && st < 4.2) {
          const f = hump(at(st, 2.4, 4.2));
          g.save();
          const gr = g.createRadialGradient(960, 540, 300, 960, 540, 1100);
          gr.addColorStop(0, 'rgba(226,80,70,0)'); gr.addColorStop(1, 'rgba(226,80,70,' + f * 0.5 + ')');
          g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080);
          g.restore();
        }
      /* ── shot D: the car that did not drive away */
      } else if (t < 24.2) {
        const st = t - 19.2;
        W.sky(g, 'day');
        W.hills(g, 400, t);
        const pan = st * 120;
        g.save(); g.translate(-(pan % 700), 0);
        for (let i = 0; i < 5; i++) {
          W.mhHouse(g, 200 + i * 700, 700, 0.84, { t: t,
            wall: ['#fdeef0', '#fff1de', '#eef3fb', '#f4f1e4'][i % 4],
            roof: ['#a8705f', '#b06a54', '#8d7f9b', '#7f8f6a'][i % 4] });
        }
        g.restore();
        W.ground(g, 700, '#9ed68f', '#77bd78');
        W.street(g, 704, pan, t, { saplings: false });
        W.road(g, 840, 170, false);
        W.wind(g, t, 8, { y0: 260, span: 340 });
        const bob = Math.abs(Math.sin(st * 6.2)) * 12;
        A.aaria(g, { x: 1180, y: 800 - bob, k: 2.55, expr: 'happy', lean: 0.11,
          turn: 1.32, pose: stride(st, 2.3, 0.72) });
        W.car(g, 560 + st * 12, 930, 1.05, '#e05a5a', { lights: true });
        const ba = eo(at(st, 1.2, 2.2));
        g.save(); g.globalAlpha = ba;
        W.bubble(g, 520, 560, 400, 120, 560, 850, {});
        A.text(g, '👀', 520, 560, 62, {});
        g.restore();
      /* ── shot E: the doorbell */
      } else if (t < 29.6) {
        const st = t - 24.2;
        W.sky(g, 'day');
        W.hills(g, 360, t, { tScale: 0.5 });
        W.ground(g, 820, '#9ed68f', '#77bd78');
        W.mhHouse(g, 1120, 890, 1.5, { wall: '#fff1de', roof: '#b06a54', doorOpen: st > 1.6, t: t, tree: false });
        W.saplin(g, 1560, 890, 1.4, t);
        const open = st > 1.6;
        if (open) {   // the friend in the doorway
          A.person(g, { x: 940, y: 900, k: 2.3, turn: -0.85, hair: 'short', cloth: '#6a8f5f',
            skirt: false, expr: st > 3.2 ? 'happy' : 'wow' });
        }
        A.aaria(g, { x: 1110, y: 904, k: 2.4, turn: 0.75, expr: 'bliss', pose: st > 1.6 ? HUG : REACH });
        if (st < 1.7) {   // the bell
          const r = hump(at(st, 0.5, 1.6));
          g.save(); g.globalAlpha = r;
          for (let i = 1; i <= 3; i++) { A.ell(g, 1020, 806, 30 * i * r, 24 * i * r); g.strokeStyle = P.sun; g.lineWidth = 7; g.stroke(); }
          A.text(g, '🔔', 1020, 806, 56, {});
          g.restore();
        }
        // the neighbour, phone half-dialled
        const na = eo(at(st, 2.2, 3.2));
        g.save(); g.globalAlpha = na;
        A.person(g, { x: 400, y: 900, k: 2.25, turn: 0.4, hair: 'grey', cloth: '#b98cd6',
          expr: 'worry', pose: { armL: 0.4, armR: -1.9, armRe: -0.8 } });
        A.rr(g, 470, 660, 66, 116, 12); A.shape(g, '#2b3a56', 6);
        A.text(g, '911', 503, 716, 32, { color: st > 4 ? '#8fa6bb' : '#ff8a8a' });
        if (st > 4) { g.save(); g.strokeStyle = '#5ec46a'; g.lineWidth = 9; g.lineCap = 'round';
          g.beginPath(); g.moveTo(462, 700); g.lineTo(546, 760); g.moveTo(546, 700); g.lineTo(462, 760); g.stroke(); g.restore(); }
        g.restore();
      /* ── shot F: the phone call, and one very happy girl */
      } else {
        const st = t - 29.6;
        W.room(g, { floorY: 660, wall: '#ffeedd' });
        if (st < 1.9) {
          A.mum(g, { x: 700, y: 820, k: 3.0, turn: 0.45, expr: 'worry', pose: { armL: 0.3, armR: -2.1, armRe: -0.7 } });
          A.dad(g, { x: 1180, y: 820, k: 3.0, turn: -0.5, expr: 'worry', pose: { armL: 0.5, armR: -0.5 } });
          A.rr(g, 796, 470, 76, 132, 14); A.shape(g, '#2b3a56', 6);
          const r = hump(at(st, 0.2, 1.4));
          g.save(); g.globalAlpha = r;
          for (let i = 1; i <= 3; i++) { A.ell(g, 834, 536, 36 * i, 30 * i); g.strokeStyle = P.sun; g.lineWidth = 7; g.stroke(); }
          g.restore();
        } else {
          const f = eo(at(st, 1.9, 2.6));
          g.save(); g.globalAlpha = f;
          const sq = 1 + hump(at(st, 2.2, 3.4)) * 0.03;
          g.save(); g.translate(960, 820); g.scale(sq, sq); g.translate(-960, -820);
          A.aaria(g, { x: 960, y: 830, k: 3.7, expr: 'bliss', blush: true, pose: HUG });
          A.plush(g, 960, 620, 3.4, { rot: Math.sin(st * 1.6) * 0.06 });
          g.restore();
          for (let i = 0; i < 10; i++) {
            const ph = ((st * 0.5 + rand(i)) % 1);
            g.save(); g.globalAlpha = hump(ph) * 0.85;
            W.heart(g, 960 + Math.sin(ph * 5 + i) * 300, 700 - ph * 520, 20, '#f2708f');
            g.restore();
          }
          g.restore();
        }
      }
      cut(g, t, [6.5, 11.6, 19.2, 24.2, 29.6, 31.5]);
    },
  });

  /* ══════════════════════════════════════════════ 2 · TWO AND A HALF (21s) */
  S.push({
    id: 'diagnosis', dur: 21, sky: 'warm',
    /* a slow swing across the room, so the table and everyone at it turn */
    cam: function (t, u) {
      return { zoom: 1 + u * 0.08, yaw: lerp(-0.18, 0.18, u), vpx: lerp(1140, 800, u), vpy: 250 };
    },
    kicker: { en: 'Aaria, age 2½', es: 'Aaria, 2 años y medio' },
    caps: [
      { a: 0.5, b: 4.6, en: 'At two and a half, the words stopped coming.',
        es: 'A los dos años y medio, las palabras dejaron de llegar.' },
      { a: 6.4, b: 11.4, en: 'In a school district room we heard a phrase for the first time: educational autism.',
        es: 'En una sala del distrito escolar escuchamos una frase por primera vez: autismo educativo.' },
      { a: 11.8, b: 15.4, en: 'Our world broke into pieces.',
        es: 'Nuestro mundo se rompió en pedazos.' },
      { a: 16.2, b: 21, en: 'So we picked the pieces up, and we started learning.',
        es: 'Así que recogimos los pedazos y empezamos a aprender.' },
    ],
    draw: function (g, t, u) {
      if (t < 6.2) {
        W.room(g, { floorY: 700, wall: '#ffeedd' });
        W.window(g, 1620, 280, 280, 230, { curtain: '#f2a3a3' });
        W.rug(g, 880, 860, 460, 110, '#f0c26a');
        A.mum(g, { x: 560, y: 866, k: 2.9, turn: 0.35, expr: 'happy', pose: { legPlane: 'side', armL: 0.2, armR: -1.5, armRe: -0.5, legL: 1.4, legLe: -1.4, legR: 1.2, legRe: -1.3 } });
        A.aaria(g, { x: 1040, y: 866, k: 2.6, turn: -0.4, expr: 'flat', pose: SIT });
        [0, 1, 2].forEach((i) => { A.rr(g, 1200 + i * 74, 800 - i * 5, 62, 62, 11); A.shape(g, P.rainbow[i], 6); });
        // her name goes out, and nothing comes back
        if (t > 1.2) {
          const a = eo(at(t, 1.2, 2.0)) * (1 - at(t, 4.2, 5.4));
          g.save(); g.globalAlpha = a;
          W.bubble(g, 520, 470, 320, 120, 580, 610, {});
          A.text(g, 'Aaria?', 520, 470, 54, {});
          g.restore();
        }
        if (t > 2.8) {
          const a = eo(at(t, 2.8, 3.6));
          g.save(); g.globalAlpha = a;
          W.bubble(g, 1320, 440, 250, 120, 1140, 600, {});
          A.text(g, '. . .', 1320, 440, 62, { color: '#a9b6c8' });
          g.restore();
        }
      } else if (t < 12.0) {
        const st = t - 6.2;
        W.room(g, { floorY: 720, wall: '#eef1f6', floor: '#b9bfcc' });
        A.rr(g, 300, 430, 1320, 170, 10); A.shape(g, '#dfe4ee', 7);
        A.text(g, 'SCHOOL DISTRICT', 960, 482, 40, { color: '#8fa0b8' });
        A.grown(g, { x: 560, y: 900, k: 2.7, turn: 0.45, hair: 'grey', cloth: '#7f93b5', expr: 'flat', pose: SIT });
        A.grown(g, { x: 1360, y: 900, k: 2.7, turn: -0.45, hair: 'long', cloth: '#9b7ce0', expr: 'flat', pose: SIT });
        W.table(g, 960, 910, 2.1, '#a98f74');
        // the phrase lands
        const a = eo(at(st, 0.8, 2.2));
        g.save(); g.globalAlpha = a;
        const sc = lerp(1.4, 1, eo(at(st, 0.8, 2.6)));
        g.translate(960, 300); g.scale(sc, sc); g.translate(-960, -300);
        A.text(g, window.ABEStory && window.ABEStory.es ? 'autismo educativo' : 'educational autism',
               960, 300, 90, { color: P.ink, stroke: 16 });
        g.restore();
      } else {
        const st = t - 12.0;
        W.sky(g, 'grey');
        // the family photo, and then the pieces
        const brk = at(st, 0.6, 1.1);
        const n = 22;
        g.save();
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * A.TAU + 0.3;
          const fly = ei(at(st, 1.0, 4.4)) * (140 + rand(i) * 520);
          const gather = eo(at(st, 5.0, 8.2));
          const ex = Math.cos(ang) * fly * (1 - gather), ey = Math.sin(ang) * fly * (1 - gather);
          g.save();
          g.translate(960 + ex, 470 + ey);
          g.rotate((rand(i * 3) - 0.5) * 3 * ei(at(st, 1.0, 4.4)) * (1 - gather));
          g.globalAlpha = 1 - at(st, 6.4, 8.0) * 0.85;
          g.beginPath();
          const r1 = 150 + rand(i * 5) * 60, r2 = 150 + rand(i * 9) * 60;
          const a1 = (i / n) * A.TAU, a2 = ((i + 1) / n) * A.TAU;
          g.moveTo(0, 0); g.lineTo(Math.cos(a1) * r1 * 1.6, Math.sin(a1) * r1);
          g.lineTo(Math.cos(a2) * r2 * 1.6, Math.sin(a2) * r2); g.closePath();
          g.clip();
          // the photo inside the frame: the three of them
          A.mum(g, { x: -110 - ex, y: 150 - ey, k: 1.5, turn: 0.3, expr: 'happy' });
          A.dad(g, { x: 120 - ex, y: 150 - ey, k: 1.55, turn: -0.3, expr: 'happy' });
          A.aaria(g, { x: 6 - ex, y: 150 - ey, k: 1.2, expr: 'happy' });
          g.strokeStyle = 'rgba(255,255,255,' + brk + ')'; g.lineWidth = 4; g.stroke();
          g.restore();
        }
        g.restore();
        // and from the pieces, the infinity
        if (st > 6.0) {
          const a = eo(at(st, 6.0, 7.6));
          g.save(); g.globalAlpha = a;
          A.infinity(g, 960, 470, 230 * a, 34, st);
          g.restore();
        }
      }
      cut(g, t, [6.2, 12.0]);
    },
  });

  /* ═════════════════════════════════════════════════ 3 · SMALL WORDS (17s) */
  S.push({
    id: 'services', dur: 17, sky: 'warm',
    cam: function (t, u) {
      return { zoom: 1 + u * 0.09, yaw: lerp(0.14, -0.10, u), vpx: lerp(800, 1140, u), vpy: 260 };
    },
    kicker: { en: 'Services begin', es: 'Empiezan los servicios' },
    caps: [
      { a: 0.5, b: 5.2, en: 'Services started. Speech. Therapy. Hours, and hours, and hours.',
        es: 'Empezaron los servicios. Lenguaje. Terapia. Horas, y horas, y horas.' },
      { a: 6.0, b: 11.0, en: 'And then — small things. A sound. A word. A win.',
        es: 'Y entonces, cositas. Un sonido. Una palabra. Un logro.' },
      { a: 11.6, b: 17, en: 'Every single one of them enormous.',
        es: 'Cada una de ellas, enorme.' },
    ],
    draw: function (g, t, u) {
      W.room(g, { floorY: 700, wall: '#eaf6ef', floor: '#cdb392' });
      W.window(g, 290, 260, 250, 210, { curtain: '#a8d8c0' });
      A.rr(g, 1450, 190, 330, 230, 14); A.shape(g, P.white, 7);
      ['🐘', '⭐', '🍎', '🚗', '🐶', '☀️'].forEach((e, i) => {
        A.text(g, e, 1508 + (i % 3) * 108, 260 + Math.floor(i / 3) * 106, 62, {});
      });
      A.grown(g, { x: 660, y: 890, k: 2.8, turn: 0.72, hair: 'curly', cloth: '#5bbfb0', expr: 'happy',
        pose: { legPlane: 'side', legL: 1.5, legLe: -1.5, legR: 1.35, legRe: -1.5, armL: 0.9, armR: -1.3, armRe: -0.6 } });
      A.aaria(g, { x: 1290, y: 890, k: 2.6, turn: -0.72, expr: t > 6 ? 'bliss' : 'flat', pose: SIT });
      W.table(g, 960, 900, 2.1, '#c89a6a');
      // a card held up, then the word
      const cards = ['🐘', '⭐', '🍎'];
      const ci = Math.min(2, Math.floor(t / 4.6));
      const cy = 700 - hump((t % 4.6) / 4.6) * 40;
      A.rr(g, 806, cy - 82, 130, 164, 14); A.shape(g, P.white, 7);
      A.text(g, cards[ci], 871, cy, 82, {});
      if (t > 6) {
        const words = [['ball!', '¡pelota!'], ['more!', '¡más!'], ['mama!', '¡mamá!']];
        for (let i = 0; i < 3; i++) {
          const b = at(t, 6.2 + i * 2.6, 7.2 + i * 2.6), f = at(t, 8.6 + i * 2.6, 11.4 + i * 2.6);
          if (b <= 0) continue;
          g.save(); g.globalAlpha = eo(b) * (1 - f);
          const yy = 660 - i * 104 - eo(b) * 56 - f * 220, xx = 1340 - i * 36;
          W.star(g, xx - 110, yy, 26 + i * 4, P.sun, t * 2 + i);
          A.text(g, window.ABEStory && window.ABEStory.es ? words[i][1] : words[i][0], xx, yy, 56, { color: P.blueDk });
          g.restore();
        }
      }
      // the little pile of wins, growing
      const won = Math.floor(clamp((t - 6) / 1.5, 0, 7));
      for (let i = 0; i < won; i++) W.star(g, 170 + i * 76, 820, 30, P.sun, i);
    },
  });

  /* ═══════════════════════════════════════════ 4 · AND THEN IT CLOSED (19s) */
  S.push({
    id: 'covid', dur: 19, sky: 'grey',
    cam: function (t, u) { return { zoom: 1 + u * 0.07, vpy: 300, dy: -u * 8 }; },
    kicker: { en: '2020', es: '2020' },
    caps: [
      { a: 0.5, b: 4.4, en: 'Then COVID. Everything shut.',
        es: 'Luego el COVID. Todo se cerró.' },
      { a: 5.2, b: 10.4, en: 'No services. No school. A year and a half inside these four walls.',
        es: 'Sin servicios. Sin escuela. Un año y medio dentro de estas cuatro paredes.' },
      { a: 11.2, b: 15.0, en: 'The small words went quiet again.',
        es: 'Las palabras pequeñas se callaron otra vez.' },
      { a: 15.4, b: 19, en: 'We held on.',
        es: 'Nos sostuvimos.' },
    ],
    draw: function (g, t, u) {
      if (t < 4.6) {
        W.room(g, { floorY: 700, wall: '#e6e9ee', floor: '#b6a894', dim: 0.1 });
        W.table(g, 960, 880, 2.1, '#b08b62');
        g.save(); g.globalAlpha = 0.5;
        A.rr(g, 1450, 190, 330, 230, 14); A.shape(g, '#e4e8ee', 7);
        g.restore();
        const sw = eo(at(t, 0.6, 1.8));
        g.save();
        g.translate(960, 560); g.rotate(lerp(-0.7, -0.06, sw)); g.translate(-960, -560);
        g.globalAlpha = sw;
        A.rr(g, 700, 480, 520, 160, 14); A.shape(g, '#d8453c', 8);
        A.text(g, window.ABEStory && window.ABEStory.es ? 'CERRADO' : 'CLOSED', 960, 560, 74, { color: P.white });
        g.restore();
        g.save(); g.globalAlpha = 0.35 * eo(at(t, 1.6, 3.0));
        for (let i = 0; i < 40; i++) {
          const x = rand(i) * 1920, y = 560 + rand(i * 3) * 460;
          A.ell(g, x, y, 2.5, 2.5); g.fillStyle = '#7f8899'; g.fill();
        }
        g.restore();
      } else if (t < 11.6) {
        const st = t - 4.6;
        W.sky(g, 'night');
        W.stars(g, 40, t, 1);
        W.moon(g, 1660, 170, 62);
        W.ground(g, 840, '#3c5a52', '#2f4a44');
        W.house(g, 960, 840, 1.85, { wall: '#4a5a78', roof: '#3a4660', lit: true });
        // three of us in the window, the same three every night
        g.save();
        g.translate(0, 0);
        A.ell(g, 812, 620, 22, 26); g.fillStyle = '#c9a15c'; g.fill();
        A.ell(g, 860, 626, 18, 22); g.fillStyle = '#c9a15c'; g.fill();
        A.ell(g, 900, 632, 14, 17); g.fillStyle = '#c9a15c'; g.fill();
        g.restore();
        W.rain(g, t, 150, 0.4);
        // the calendar, losing pages
        const months = ['MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'];
        const idx = Math.floor(st * 2.4);
        for (let i = 0; i < 4; i++) {
          const j = idx - i;
          if (j < 0 || j >= months.length) continue;
          const ph = (st * 2.4) % 1;
          if (i === 0) {
            g.save(); g.globalAlpha = 1 - ph;
            W.calPage(g, 300 + ph * 240, 300 - ph * 160, 1.2, months[j], ph * 1.6, 1);
            g.restore();
          } else if (i === 1) {
            W.calPage(g, 300, 300, 1.2, months[j], 0, 1);
          }
        }
        if (st > 3) {
          const a = eo(at(st, 3.2, 4.4));
          A.text(g, window.ABEStory && window.ABEStory.es ? '1 año y medio' : '1 and a half years',
                 300, 480, 44, { color: P.white, alpha: a });
        }
      } else {
        const st = t - 11.6;
        W.room(g, { floorY: 700, wall: '#dfe4ec', floor: '#b0a894', dim: 0.06 });
        W.window(g, 1600, 290, 300, 240, { curtain: '#b9c6d8' });
        W.rain(g, t, 40, 0.18);
        A.aaria(g, { x: 900, y: 880, k: 3.0, turn: 0.3, expr: 'flat', pose: SIT });
        A.plush(g, 1090, 810, 2.8, { rot: 0.2, shadow: true });
        g.save(); g.globalAlpha = 0.55 + 0.15 * Math.sin(st);
        W.bubble(g, 1380, 520, 230, 110, 1160, 700, { thought: true });
        A.text(g, '. . .', 1380, 520, 56, { color: '#a9b6c8' });
        g.restore();
        if (st > 3.2) {
          const a = eo(at(st, 3.4, 5.0));
          g.save(); g.globalAlpha = a;
          A.mum(g, { x: 560, y: 890, k: 3.0, turn: 0.4, expr: 'calm', pose: { legPlane: 'side', armL: 0.3, armR: -1.1, armRe: -0.7, legL: 1.5, legLe: -1.5, legR: 1.3, legRe: -1.5 } });
          W.heart(g, 730, 590, 24, '#f2708f', 0.8);
          g.restore();
        }
      }
      cut(g, t, [4.6, 11.6]);
    },
  });

  /* ═════════════════════════════════════════════ 5 · THE DOOR OPENS (13s) */
  S.push({
    id: 'school', dur: 13, sky: 'morning',
    cam: function (t, u) {
      return { zoom: 1 + u * 0.06, vpx: lerp(680, 1340, u), vpy: 430, yaw: lerp(-0.08, 0.07, u) };
    },
    kicker: { en: 'And then, finally', es: 'Y entonces, por fin' },
    caps: [
      { a: 0.6, b: 5.0, en: 'And then — finally — school again.',
        es: 'Y entonces, por fin, la escuela otra vez.' },
      { a: 6.0, b: 13, en: 'A bag, a bus, a door that opens every single morning.',
        es: 'Una mochila, un autobús, una puerta que se abre cada mañana.' },
    ],
    draw: function (g, t, u) {
      W.sky(g, 'morning');
      W.sun(g, 300, lerp(420, 190, eo(at(t, 0, 5))), 76, t);
      W.cloud(g, 1350 - t * 8, 210, 1.5, 0.85);
      W.hills(g, 520, t, { tScale: 0.55 });
      W.ground(g, 800, '#9ed68f', '#77bd78');
      W.school(g, 1250, 800, 1.0);
      W.tree(g, 240, 830, 1.0, t, 1);
      W.wind(g, t, 9, { y0: 330, span: 300 });
      W.bus(g, 520, 900, 1.0);
      const walk = clamp((t - 2.2) / 6.5, 0, 1);
      const ax = lerp(560, 1150, walk);
      const bob = Math.abs(Math.sin(t * 4.4)) * 9 * (walk > 0 && walk < 1 ? 1 : 0);
      A.aaria(g, { x: ax, y: 870 - bob, k: 2.9, expr: 'happy',
        turn: walk < 1 ? 1.25 : -0.6,        // walks away to school, then turns to wave
        pose: walk < 1 ? stride(t, 1.7, 0.5) : { armL: 2.6, armLe: 0.3, armR: -0.3 } });
      A.rr(g, ax - 80, 726 - bob, 68, 88, 13); A.shape(g, '#f2705f', 6);
      A.mum(g, { x: 380, y: 880, k: 2.9, turn: 0.6, expr: 'happy', pose: { armL: 0.3, armR: -2.6, armRe: -0.4 } });
      if (t > 8.6) {
        const a = eo(at(t, 8.8, 9.8));
        g.save(); g.globalAlpha = a;
        W.bubble(g, 680, 470, 310, 120, 440, 620, {});
        A.text(g, window.ABEStory && window.ABEStory.es ? '¡Adiós!' : 'Bye bye!', 680, 470, 50, {});
        g.restore();
      }
    },
  });

  /* ══════════════════════════════════ 6 · MOUNTAIN HOUSE, AND A BOOK (27s) */
  S.push({
    id: 'book', dur: 27, sky: 'night',
    cam: function (t, u) {
      if (t < 4.6) return { zoom: 1 + at(t, 0, 4.6) * 0.06, vpy: 420 };
      const v = at(t, 4.6, 27);
      return { zoom: 1 + v * 0.10, yaw: lerp(0.16, -0.12, v), vpx: lerp(1240, 760, v), vpy: 250 };
    },
    kicker: { en: 'Mountain House', es: 'Mountain House' },
    caps: [
      { a: 0.5, b: 4.2, en: 'We moved to Mountain House.',
        es: 'Nos mudamos a Mountain House.' },
      { a: 5.0, b: 9.6, en: 'One night, a book at bedtime: Mommy and Baby Animals.',
        es: 'Una noche, un libro antes de dormir: Mommy and Baby Animals.' },
      { a: 10.0, b: 13.6, en: 'Every page, a mummy animal holding her baby.',
        es: 'En cada página, una mamá animal abrazando a su bebé.' },
      { a: 14.2, b: 19.0, en: 'She turned to the last page — all of them together — and said, “look, mommy and baby.”',
        es: 'Pasó a la última página — todos juntos — y dijo: «mira, mami y bebé».' },
      { a: 19.4, b: 24.0, en: 'Then she put my hand over her, pointed at us, and said it again. Mommy. And baby.',
        es: 'Luego puso mi mano sobre ella, nos señaló y lo dijo otra vez. Mami. Y bebé.' },
      { a: 24.4, b: 27, en: 'Her first real conversation.',
        es: 'Su primera conversación de verdad.' },
    ],
    draw: function (g, t, u) {
      if (t < 4.6) {
        W.sky(g, 'dusk');
        W.hills(g, 430, t, { back: '#d9b98a', front: '#c49a6c' });
        W.ground(g, 800, '#8fc98a', '#6fae74');
        for (let i = 0; i < 3; i++) {
          W.mhHouse(g, 300 + i * 660, 828, 0.86, { t: t, lit: i === 1,
            wall: ['#fff1de', '#eef3fb', '#fdeef0'][i], roof: ['#b06a54', '#8d7f9b', '#a8705f'][i] });
        }
        W.street(g, 832, 0, t, { saplings: false });
        W.wind(g, t, 14, { y0: 280, span: 420 });
        const a = eo(at(t, 1.0, 2.2));
        A.text(g, 'Mountain House', 960, 220, 76, { color: P.ink, alpha: a, stroke: 14 });
      } else {
        const st = t - 4.6;
        W.room(g, { floorY: 780, wall: '#5a5a84', floor: '#7a5f46', dim: 0.04 });
        W.window(g, 250, 250, 240, 210, { night: true, t: t, curtain: '#8a72b0' });
        W.lamp(g, 1560, 830, 1.9, true);
        W.bed(g, 930, 900, 1.6);
        A.dad(g, { x: 1210, y: 876, k: 3.0, turn: -0.62, expr: st > 14.4 ? 'bliss' : 'happy',
          pose: { legPlane: 'side', legL: 1.5, legLe: -1.5, legR: 1.32, legRe: -1.5, armL: 1.5, armLe: 0.75, armR: -1.5, armRe: -0.75 } });
        A.aaria(g, { x: 860, y: 876, k: 2.7, turn: 0.62, expr: st > 9.6 ? 'bliss' : 'happy',
          pose: st > 9.6 ? { legPlane: 'side', legL: 1.5, legLe: -1.5, legR: 1.3, legRe: -1.5, armL: 0.2, armR: -2.0, armRe: -0.5 }
                         : { legPlane: 'side', legL: 1.5, legLe: -1.5, legR: 1.3, legRe: -1.5, armL: 0.7, armLe: 0.5, armR: -0.7, armRe: -0.5 } });

        // the book: mummy-and-baby pairs, then the last page with all of them
        const last = st > 9.4;
        const pair = (em1, em2) => (gg, cx, cy, sc) => {
          A.text(gg, em1, cx - 26 * sc, cy - 10 * sc, 96 * sc, {});
          A.text(gg, em2, cx + 38 * sc, cy + 34 * sc, 54 * sc, {});
        };
        const all = (gg, cx, cy, sc) => {
          ['🐘', '🐈', '🐦', '🐻', '🐧', '🐨'].forEach((e, i) => {
            A.text(gg, e, cx - 76 * sc + (i % 3) * 76 * sc, cy - 36 * sc + Math.floor(i / 3) * 80 * sc, 50 * sc, {});
          });
        };
        const flip = Math.floor(clamp(st / 3.1, 0, 2));
        const PL = ['🐘', '🐈', '🐻'], PR = ['🐦', '🐧', '🐨'];
        const L = last ? all : pair(PL[flip], PL[flip]);
        const R = last ? all : pair(PR[flip], PR[flip]);
        g.save();
        g.translate(1030, 796 - Math.sin(st * 1.2) * 4);
        g.rotate(-0.05);
        g.translate(-1030, -796);
        W.book(g, 1030, 796, 0.58, L, R);
        g.restore();

        // “look, mommy and baby”
        if (st > 9.8 && st < 15.4) {
          const a = eo(at(st, 9.8, 10.6)) * (1 - at(st, 14.6, 15.4));
          g.save(); g.globalAlpha = a;
          W.bubble(g, 520, 420, 560, 140, 800, 660, {});
          A.text(g, window.ABEStory && window.ABEStory.es ? '«mira, mami y bebé»' : '“look, mommy and baby”', 520, 420, 48, {});
          g.restore();
        }
        // the hand, and the pointing
        if (st > 14.8) {
          const a = eo(at(st, 14.8, 15.8));
          g.save(); g.globalAlpha = a;
          g.strokeStyle = P.ink; g.lineWidth = 17; g.lineCap = 'round';
          g.beginPath(); g.moveTo(1150, 800); g.quadraticCurveTo(1010, 740, 900, 792); g.stroke();
          g.strokeStyle = P.white; g.lineWidth = 10; g.stroke();
          g.restore();
          const b = eo(at(st, 16.2, 17.2));
          g.save(); g.globalAlpha = b;
          W.bubble(g, 520, 330, 580, 140, 800, 600, {});
          A.text(g, window.ABEStory && window.ABEStory.es ? '«mami. y bebé.»' : '“mommy. and baby.”', 520, 330, 50, {});
          g.restore();
          for (let i = 0; i < 12; i++) {
            const ph = ((st * 0.36 + rand(i)) % 1);
            g.save(); g.globalAlpha = hump(ph) * 0.9 * eo(at(st, 16.4, 17.4));
            W.heart(g, 1000 + Math.sin(ph * 4 + i * 2) * 340, 800 - ph * 700, 18 + rand(i * 3) * 12, '#f2708f');
            g.restore();
          }
        }
      }
      cut(g, t, [4.6]);
    },
  });

  /* ═══════════════════════════════════════════ 7 · A CARNIVAL, A LINE (26s) */
  S.push({
    id: 'carnival', dur: 26, sky: 'dusk',
    /* the lens creeps in as the noise closes on her */
    cam: function (t, u) {
      return { zoom: 1 + at(t, 3, 24) * 0.18, yaw: lerp(-0.06, 0.15, u), vpx: lerp(1220, 840, u), vpy: 330, fy: 760 };
    },
    kicker: { en: 'A carnival, a line', es: 'Un carnaval, una fila' },
    caps: [
      { a: 0.5, b: 4.6, en: 'A carnival. A bouncy house. A long, long line.',
        es: 'Un carnaval. Un brincolín. Una fila larga, muy larga.' },
      { a: 5.4, b: 10.2, en: 'Too loud. Too many people. Too long a wait.',
        es: 'Demasiado ruido. Demasiada gente. Demasiada espera.' },
      { a: 10.6, b: 15.0, en: 'Her body said what her words could not. Sounds. Hands. Feet. Tears.',
        es: 'Su cuerpo dijo lo que sus palabras no podían. Sonidos. Manos. Pies. Lágrimas.' },
      { a: 15.4, b: 19.2, en: 'Mummy stepped aside with her. Daddy kept our place in line.',
        es: 'Mami se apartó con ella. Papi guardó nuestro lugar en la fila.' },
      { a: 19.6, b: 23.4, en: 'Our turn came. “She has to wait in the line like everyone else.”',
        es: 'Llegó nuestro turno. «Tiene que esperar en la fila como todos».' },
      { a: 23.8, b: 26, en: 'Nobody meant to be unkind. She still did not get her turn.',
        es: 'Nadie quiso ser cruel. Aun así, no tuvo su turno.' },
    ],
    draw: function (g, t, u) {
      W.sky(g, 'dusk');
      W.hills(g, 520, t, { back: '#c9b487', front: '#b8a271', tScale: 0.46 });
      W.ground(g, 830, '#8fc98a', '#6fae74');
      W.lights(g, -40, 190, 700, 250, 9, t);
      W.lights(g, 700, 250, 1420, 210, 9, t + 1);
      W.lights(g, 1420, 210, 1960, 280, 7, t + 2);
      W.bouncy(g, 1450, 846, 0.84, t);
      // the queue, and the rope
      g.save(); g.strokeStyle = '#d8453c'; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(1150, 760); g.quadraticCurveTo(1075, 792, 1000, 760); g.stroke();
      g.restore();
      A.rr(g, 1142, 756, 16, 130, 7); A.shape(g, '#9aa6bd', 5);
      A.rr(g, 992, 756, 16, 130, 7); A.shape(g, '#9aa6bd', 5);

      const left = t > 12.6;                        // mum and Aaria step out of line
      const stress = clamp((t - 4.2) / 4.2, 0, 1) * (left ? clamp(1 - (t - 13.6) / 2.6, 0.12, 1) : 1);

      // other families waiting, quite happily
      [0, 1, 2].forEach((i) => {
        A.kid(g, i + 2, { x: 770 - i * 165, y: 872 + i * 7, k: 2.6 + i * 0.06,
          turn: 0.55 - i * 0.12, expr: 'happy' });
      });
      // Daddy holds the place
      A.dad(g, { x: 940, y: 886, k: 2.9, turn: 0.4, expr: t > 19 ? 'worry' : 'flat',
        pose: { armL: 0.3, armR: -0.3 } });

      const jitter = stress * 5;
      const ax = left ? lerp(1060, 300, eo(at(t, 12.8, 15.6))) : 1070;
      const mx = left ? lerp(1210, 450, eo(at(t, 12.8, 15.6))) : 1220;
      A.mum(g, { x: mx, y: 900, k: 2.9, turn: left ? -0.7 : 0.35, expr: left ? 'calm' : 'worry',
        pose: { armL: 1.1, armLe: 0.8, armR: -0.5 } });
      A.aaria(g, {
        x: ax + Math.sin(t * 22) * jitter, y: 894 - (stress > 0.5 && !left ? Math.abs(Math.sin(t * 9)) * 16 : 0),
        k: 2.7, expr: stress > 0.55 ? 'cry' : 'worry', tear: (t * 1.4) % 1,
        pose: stress > 0.5 ? EARS : { armL: 0.4, armR: -0.4 },
      });
      if (stress > 0.2) W.noise(g, 1450, 620, t, stress * 0.9);
      if (stress > 0.55 && !left) {
        for (let i = 0; i < 4; i++) {
          const ph = ((t * 1.1 + i * 0.25) % 1);
          g.save(); g.globalAlpha = hump(ph) * 0.8;
          A.text(g, ['〰️', '⚡', '〰️', '✳️'][i], ax - 120 + i * 78, 600 - ph * 90, 44, {});
          g.restore();
        }
      }
      // the volunteer, and the hand
      if (t > 18.4) {
        const a = eo(at(t, 18.4, 19.4));
        g.save(); g.globalAlpha = a;
        A.grown(g, { x: 1270, y: 876, k: 2.9, turn: -0.5, hair: 'short', cloth: '#f5b23c', expr: 'flat', skirt: false,
          pose: { armL: 0.4, armR: -2.3, armRe: -0.8 } });
        A.text(g, '✋', 1392, 546, 72, {});
        g.restore();
        const b = eo(at(t, 19.8, 20.8));
        g.save(); g.globalAlpha = b;
        W.bubble(g, 1440, 330, 720, 150, 1330, 520, {});
        A.text(g, window.ABEStory && window.ABEStory.es ? '«Tiene que esperar en la fila»' : '“She has to wait in the line”',
               1440, 330, 42, {});
        g.restore();
      }
      if (t > 23.4) {   // the light goes out of it
        g.save(); g.fillStyle = 'rgba(30,40,80,' + eo(at(t, 23.4, 26)) * 0.35 + ')';
        g.fillRect(0, 0, 1920, 1080); g.restore();
      }
    },
  });

  /* ═════════════════════════════════════════════════ 8 · THE BUDDY (23s) */
  S.push({
    id: 'buddy', dur: 23, sky: 'day',
    cam: function (t, u) {
      return { zoom: 1 + u * 0.07, yaw: lerp(-0.22, 0.20, u), vpx: lerp(1220, 740, u), vpy: 250 };
    },
    kicker: { en: 'School: the Buddy Program', es: 'La escuela: el programa de compañeros' },
    caps: [
      { a: 0.5, b: 5.0, en: 'At the IEP meeting, the school offered a buddy program.',
        es: 'En la reunión del IEP, la escuela ofreció un programa de compañeros.' },
      { a: 5.6, b: 9.6, en: 'A classmate sat down next to her. Not a teacher. A kid.',
        es: 'Una compañera se sentó junto a ella. No una maestra. Una niña.' },
      { a: 10.0, b: 15.2, en: '“Aaria, let’s do the next one. Look — I’m rolling my dice. I got a 3! Let’s see what you get.”',
        es: '«Aaria, hagamos la siguiente. Mira, estoy tirando el dado. ¡Me salió 3! A ver qué te sale a ti».' },
      { a: 15.8, b: 20.0, en: 'On the second try, Aaria rolled the dice.',
        es: 'En el segundo intento, Aaria tiró el dado.' },
      { a: 20.4, b: 23, en: 'That was it. That was the whole thing.',
        es: 'Eso era. Eso era todo.' },
    ],
    draw: function (g, t, u) {
      W.room(g, { floorY: 720, wall: '#eaf2ff', floor: '#cdb392' });
      W.window(g, 260, 250, 270, 220, { curtain: '#a8c6e8' });
      A.rr(g, 1330, 160, 470, 290, 14); A.shape(g, '#3f6a56', 9);
      A.text(g, 'A  B  C', 1565, 245, 62, { color: P.white });
      A.text(g, '1  2  3', 1565, 355, 62, { color: P.white });
      A.kid(g, 1, { x: 700, y: 896, k: 2.9, turn: 0.8, expr: 'happy',
        pose: { legPlane: 'side', legL: 1.5, legLe: -1.5, legR: 1.3, legRe: -1.5, armL: 0.8, armR: t > 7 && t < 11 ? -1.5 : -1.0, armRe: -0.6 } });
      const rolled = t > 15.6;
      A.aaria(g, { x: 1250, y: 896, k: 2.8, turn: -0.8, expr: rolled ? 'bliss' : t > 11 ? 'happy' : 'flat',
        pose: rolled ? { legPlane: 'side', legL: 1.5, legLe: -1.5, legR: 1.3, legRe: -1.5, armL: 0.3, armLe: 0.2, armR: -1.6, armRe: -0.5 } : SIT });
      W.table(g, 960, 906, 2.3, '#c89a6a');

      // the buddy's die, rolling then landing on 3
      const rollA = at(t, 7.4, 9.0);
      if (t > 7.2) {
        const land = t > 9.0;
        W.die(g, land ? 880 : 760 + rollA * 120, land ? 792 : 772 - hump(rollA) * 130, 1.0,
              land ? 3 : 1 + Math.floor((t * 17) % 6), land ? 0.1 : t * 9);
      }
      // the line
      if (t > 9.4 && t < 15.6) {
        const a = eo(at(t, 9.4, 10.3)) * (1 - at(t, 14.8, 15.6));
        g.save(); g.globalAlpha = a;
        W.bubble(g, 620, 330, 780, 200, 700, 580, {});
        const es = window.ABEStory && window.ABEStory.es;
        A.text(g, es ? '«Aaria, hagamos la siguiente.' : '“Aaria, let’s do the next one.', 620, 290, 41, {});
        A.text(g, es ? 'Mira, ¡me salió 3! ¿Y a ti?»' : 'Look — I got a 3! What do you get?”', 620, 364, 41, {});
        g.restore();
      }
      // attempt one: nothing. attempt two: she rolls.
      if (t > 12.2 && t < 15.4) {
        g.save(); g.globalAlpha = hump(at(t, 12.2, 15.4)) * 0.9;
        A.text(g, '. . .', 1270, 560, 66, { color: '#a9b6c8' });
        g.restore();
      }
      if (rolled) {
        const st = t - 15.6;
        const rollB = at(st, 0.3, 1.8), landB = st > 1.8;
        W.die(g, landB ? 1080 : 1180 - rollB * 100, landB ? 792 : 772 - hump(rollB) * 140, 1.0,
              landB ? 5 : 1 + Math.floor((t * 19) % 6), landB ? -0.08 : -t * 9);
        if (st > 2.0) {
          for (let i = 0; i < 9; i++) {
            const ph = ((st - 2.0) * 0.7 + rand(i)) % 1;
            g.save(); g.globalAlpha = hump(ph) * 0.95;
            W.star(g, 1080 + Math.sin(ph * 5 + i * 2) * 340, 800 - ph * 660, 20 + rand(i * 3) * 14, P.sun, t * 2 + i);
            g.restore();
          }
          const a = eo(at(st, 2.2, 3.0));
          g.save(); g.globalAlpha = a;
          W.bubble(g, 1500, 400, 350, 125, 1330, 600, {});
          A.text(g, window.ABEStory && window.ABEStory.es ? '¡CINCO!' : 'FIVE!', 1500, 400, 54, { color: P.blueDk });
          g.restore();
        }
      }
    },
  });

  /* ═════════════════════════════════════════════ 9 · A CIRCLE AT HOME (19s) */
  S.push({
    id: 'circle', dur: 19, sky: 'warm',
    /* The chapter the whole rebuild was for: one long orbit round the ring.
       yaw goes to the cast, so every child turns as the camera travels. */
    cam: function (t, u) {
      const v = eio(u);
      return { zoom: 1 + u * 0.08, yaw: lerp(-0.34, 0.34, v), vpx: lerp(1400, 580, v), vpy: 250 };
    },
    kicker: { en: 'January 2025', es: 'Enero de 2025' },
    caps: [
      { a: 0.5, b: 4.6, en: 'Kids learn people from kids.',
        es: 'Los niños aprenden de las personas a través de otros niños.' },
      { a: 5.4, b: 10.6, en: 'So in January 2025 we started a little social group — in our living room.',
        es: 'Así que en enero de 2025 empezamos un pequeño grupo social, en nuestra sala.' },
      { a: 11.2, b: 15.8, en: 'Neurodivergent and neurotypical. Same rug, same snacks, same game.',
        es: 'Neurodivergentes y neurotípicos. La misma alfombra, la misma merienda, el mismo juego.' },
      { a: 16.2, b: 19, en: 'Nobody was a project. Everybody was a friend.',
        es: 'Nadie era un proyecto. Todos eran amigos.' },
    ],
    draw: function (g, t, u) {
      W.room(g, { floorY: 680, wall: '#fff0e0', floor: '#d9a877' });
      W.window(g, 1660, 270, 290, 240, { curtain: '#f2a3a3' });
      W.sofa(g, 250, 700, 1.0, '#7fb7d9');
      W.rug(g, 1000, 852, 640, 165, '#f0c26a');
      [0, 1, 2].forEach((i) => W.balloon(g, 470 + i * 125, 330, 0.9, P.rainbow[i * 2], t + i));
      /* The circle fills in, one child at a time. It is an actual ring on an
         actual floor: the two at the back sit higher and smaller, everyone
         turns to face the middle of it, and the camera orbits the lot. */
      const RING = { cx: 980, cy: 846, ry: 66 };
      const seats = [[590, 852], [770, 886], [980, 898], [1190, 886], [1370, 852], [1270, 780], [690, 780]];
      const shown = clamp(Math.floor((t - 1.2) / 1.5), 0, seats.length);
      for (let i = 0; i < shown; i++) {
        const born = 1.2 + i * 1.5;
        const a = eo(at(t, born, born + 0.7));
        const bounce = hump(at(t, born, born + 0.9)) * 26;
        const sx = seats[i][0], sy = seats[i][1];
        // further up the frame is further away: smaller, and a little hazier
        const depth = clamp((sy - 770) / 130, 0, 1);
        const k = lerp(2.15, 2.6, depth);
        /* Everyone faces the middle of the ring. The ones at the BACK are
           looking toward us, so they turn only a little; the ones at the
           front would otherwise have their backs to the camera, so they are
           swung to a profile — far enough to be in the circle, near enough
           that you can still read their faces. */
        const turn = sy < RING.cy ? clamp((RING.cx - sx) / 640, -0.6, 0.6)
                                  : clamp((RING.cx - sx) / 300, -1.25, 1.25);
        g.save(); g.globalAlpha = a;
        if (i === 2) {
          A.pair(g, sx, sy - bounce + 14, 300);
        } else {
          A.kid(g, i * 2 + 1, { x: sx, y: sy - bounce, k: k, turn: turn, expr: 'happy', pose: SIT });
        }
        g.restore();
      }
      if (t > 13) {
        for (let i = 0; i < 8; i++) {
          const ph = ((t - 13) * 0.32 + rand(i)) % 1;
          g.save(); g.globalAlpha = hump(ph) * 0.8;
          W.heart(g, 960 + Math.sin(ph * 4 + i * 2) * 420, 790 - ph * 700, 18, '#f2708f');
          g.restore();
        }
      }
    },
  });

  /* ══════════════════════════════════════════ 10 · NOVEMBER 2, 2025 (17s) */
  S.push({
    id: 'founded', dur: 17, sky: 'joy',
    cam: function (t, u) { return { zoom: 1 + u * 0.05, vpy: 360 }; },
    kicker: { en: 'November 2, 2025', es: '2 de noviembre de 2025' },
    caps: [
      { a: 0.6, b: 5.4, en: 'On November 2, 2025, the living room got a name.',
        es: 'El 2 de noviembre de 2025, la sala tuvo un nombre.' },
      { a: 8.0, b: 12.4, en: 'Aaria’s Blue Elephant.',
        es: 'Aaria’s Blue Elephant.' },
      { a: 12.8, b: 17, en: 'Building a New Inclusive World.',
        es: 'Construyendo un nuevo mundo inclusivo.' },
    ],
    draw: function (g, t, u) {
      W.sky(g, 'joy');
      for (let i = 0; i < 5; i++) W.cloud(g, 200 + i * 420 + Math.sin(t * 0.2 + i) * 30, 160 + (i % 2) * 90, 1.2, 0.5);
      const cx = 960, cy = 440, r = 300;

      // a white disc opens, and the badge lands in it
      const disc = pop(at(t, 0.4, 2.0));
      if (disc > 0.01) {
        g.save();
        A.shadow(g, cx, cy + r * 0.94, r * 0.86 * disc, r * 0.13 * disc, 0.13);
        A.ell(g, cx, cy, r * disc, r * disc);
        A.shape(g, P.white, 4, '#dfe6f2');
        g.restore();
      }
      const rev = clamp(pop(at(t, 1.7, 3.4)), 0, 1);
      if (rev > 0.01) {
        g.save();
        g.translate(cx, cy);
        g.rotate(lerp(-0.55, 0, eo(at(t, 1.7, 4.2))));
        g.translate(-cx, -cy);
        A.badge(g, cx, cy, r, rev, t);
        g.restore();
      }
      if (t > 3.0) W.confetti(g, t - 3.0, 90);

      if (t > 6.4) {
        const a = eo(at(t, 6.4, 7.4));
        A.text(g, window.ABEStory && window.ABEStory.es ? '2 de noviembre de 2025' : 'November 2, 2025',
               960, 866, 66, { color: P.ink, alpha: a, stroke: 14 });
      }
    },
  });

  /* ══════════════════════════════════════════════ 11 · THE FIRST YEAR (32s) */
  S.push({
    id: 'year', dur: 32, sky: 'warm',
    cam: function (t, u) { return { zoom: 1 + u * 0.05, vpx: lerp(820, 1100, u), vpy: 400 }; },
    kicker: { en: 'The first year', es: 'El primer año' },
    caps: [
      { a: 0.6, b: 5.0, en: 'Then a whole year of Saturdays.',
        es: 'Después, un año entero de sábados.' },
      { a: 5.6, b: 9.4, en: 'Gatherings at home, and at the library.',
        es: 'Reuniones en casa y en la biblioteca.' },
      { a: 10.0, b: 13.4, en: 'An Easter egg hunt.',
        es: 'Una búsqueda de huevos de Pascua.' },
      { a: 14.0, b: 17.4, en: 'Circle of Friends.',
        es: 'Circle of Friends.' },
      { a: 18.0, b: 21.4, en: 'A Parks and Rec event.',
        es: 'Un evento de Parks and Rec.' },
      { a: 22.0, b: 25.4, en: 'Softball sessions — gloves, bases, everybody plays.',
        es: 'Sesiones de softbol: guantes, bases, todos juegan.' },
      { a: 26.2, b: 32, en: 'Every single one: neurodivergent and neurotypical kids, together.',
        es: 'En cada una: niños neurodivergentes y neurotípicos, juntos.' },
    ],
    draw: function (g, t, u, S) {
      W.sky(g, 'warm');
      // the town these Saturdays happened in, kept pale so the photos carry it
      g.save(); g.globalAlpha = 0.22;
      W.hills(g, 560, t, { back: '#d8c98a', front: '#c4b16c', tScale: 0.5 });
      W.ground(g, 880, '#b6dca8', '#9ccb92');
      W.library(g, 330, 900, 0.78);
      W.townhall(g, 1600, 900, 0.7, { t: t });
      W.school(g, 960, 900, 0.62);
      g.restore();
      // bunting across the top
      g.save();
      for (let i = 0; i < 16; i++) {
        const x1 = -60 + i * 130, x2 = x1 + 130;
        const y1 = 60 + Math.sin(i * 0.9) * 26, y2 = 60 + Math.sin((i + 1) * 0.9) * 26;
        g.strokeStyle = 'rgba(22,37,92,.35)'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
        g.beginPath(); g.moveTo(x1 + 30, y1 + 3); g.lineTo(x1 + 90, y1 + 3); g.lineTo(x1 + 60, y1 + 74); g.closePath();
        g.fillStyle = P.rainbow[i % P.rainbow.length]; g.fill();
      }
      g.restore();

      const CARDS = [
        { key: 'gatherings', en: 'Home & library gatherings', es: 'Reuniones en casa y biblioteca', at: 5.4 },
        { key: 'easter',     en: 'Easter egg hunt',           es: 'Búsqueda de huevos de Pascua', at: 9.8 },
        { key: 'circle',     en: 'Circle of Friends',          es: 'Circle of Friends',           at: 13.8 },
        { key: 'parksrec',   en: 'Parks & Rec event',          es: 'Evento de Parks & Rec',       at: 17.8 },
        { key: 'softball',   en: 'Softball sessions',          es: 'Sesiones de softbol',         at: 21.8 },
      ];
      const SPOT = [[340, 350, -0.07], [960, 322, 0.05], [1580, 350, -0.05], [650, 682, 0.06], [1280, 682, -0.04]];
      const es = window.ABEStory && window.ABEStory.es;
      CARDS.forEach((c, i) => {
        if (t < c.at) return;
        const a = pop(at(t, c.at, c.at + 1.1));
        const sp = SPOT[i];
        // each photo flies in big and centre, then tucks into its place
        const settle = eo(at(t, c.at + 1.6, c.at + 3.0));
        const x = lerp(960, sp[0], settle), y = lerp(500, sp[1], settle);
        const w = lerp(680, 372, settle);
        g.save(); g.globalAlpha = clamp(a, 0, 1);
        W.polaroid(g, x, y, w, lerp(0, sp[2], settle), S.photo(c.key), es ? c.es : c.en, t);
        g.restore();
      });
      // and the kids who were actually there
      if (t > 25.6) {
        const a = eo(at(t, 25.6, 27.0));
        g.save(); g.globalAlpha = a;
        g.fillStyle = 'rgba(255,250,242,.86)'; g.fillRect(0, 0, 1920, 1080);
        for (let i = 0; i < 7; i++) {
          const bx = 300 + i * 220;
          const b = hump(clamp((t - 26.2 - i * 0.16) / 1.4, 0, 1)) * 22;
          if (i === 3) continue;
          A.kid(g, i, { x: bx, y: 830 - b, k: 2.7, turn: (3 - i) * 0.14, expr: 'happy', pose: UP });
        }
        A.pair(g, 960, 852 - hump(clamp((t - 26.7) / 1.4, 0, 1)) * 22, 330);
        W.confetti(g, t - 25.6, 60);
        g.restore();
      }
    },
  });

  /* ══════════════════════════════════════ 12 · HAPPY BIRTHDAY (22s) */
  S.push({
    id: 'birthday', dur: 22, sky: 'joy',
    cam: function (t, u) {
      return { zoom: 1.07 - u * 0.07, yaw: lerp(0.14, -0.14, u), vpx: lerp(680, 1240, u), vpy: 420 };
    },
    kicker: { en: 'November 2, 2026', es: '2 de noviembre de 2026' },
    caps: [
      { a: 0.6, b: 4.6, en: 'One year old.',
        es: 'Un año.' },
      { a: 5.4, b: 10.6, en: 'Happy Birthday, Aaria’s Blue Elephant. 💙',
        es: 'Feliz cumpleaños, Aaria’s Blue Elephant. 💙' },
      { a: 11.4, b: 16.4, en: 'And all of it started with a little girl running for a blue elephant.',
        es: 'Y todo empezó con una niña corriendo por un elefante azul.' },
    ],
    draw: function (g, t, u) {
      W.sky(g, 'joy');
      W.hills(g, 560, t, { tScale: 0.5 });
      for (let i = 0; i < 6; i++) W.balloon(g, 150 + i * 330, 430 + Math.sin(i * 1.7) * 70, 1.2, P.rainbow[i], t + i);
      W.ground(g, 790, '#9ed68f', '#77bd78');
      W.wind(g, t, 8, { y0: 220, span: 260 });
      // everybody, in a line, with the cake on its own table so nobody hides
      [0, 1, 2].forEach((i) => A.kid(g, i + 4, { x: 150 + i * 165, y: 868, k: 2.75, turn: 0.5 - i * 0.14, expr: 'happy',
        pose: hump((t * 0.6 + i * 0.2) % 1) > 0.5 ? UP : { armL: 0.5, armR: -0.5 } }));
      A.kid(g, 2, { x: 1270, y: 868, k: 2.75, turn: -0.45, expr: 'happy',
        pose: hump((t * 0.6 + 0.4) % 1) > 0.5 ? UP : { armL: 0.5, armR: -0.5 } });
      A.mum(g, { x: 660, y: 872, k: 3.0, turn: 0.28, expr: 'bliss', pose: { armL: 1.0, armLe: 0.7, armR: -0.4 } });
      A.dad(g, { x: 1080, y: 872, k: 3.05, turn: -0.25, expr: 'bliss', pose: { armL: 0.4, armR: -1.0, armRe: -0.7 } });
      const jump = Math.abs(Math.sin(t * 2.2)) * 16;
      A.pair(g, 890, 878 - jump, 360);
      W.table(g, 1480, 952, 1.9, '#c89a6a');
      W.cake(g, 1480, 812, 0.82, 1, t);
      W.confetti(g, t, 110);

      if (t > 4.6) {
        const a = pop(at(t, 4.6, 6.0));
        g.save(); g.globalAlpha = clamp(a, 0, 1);
        const es = window.ABEStory && window.ABEStory.es;
        A.text(g, es ? '¡Feliz cumpleaños!' : 'Happy Birthday!', 960, 160, 104, { color: P.ink, stroke: 18 });
        A.text(g, "Aaria's Blue Elephant  ·  2 Nov 2026", 960, 268, 50, { color: P.blueDk, stroke: 12 });
        g.restore();
      }
      if (t > 16.4) {
        const a = eo(at(t, 16.4, 17.8));
        g.save(); g.globalAlpha = a;
        g.fillStyle = 'rgba(255,250,242,.94)'; g.fillRect(0, 0, 1920, 1080);
        A.badge(g, 960, 400, 250, 1, t);
        A.text(g, 'aariasblueelephant.org', 960, 740, 48, { color: P.blueDk });
        A.text(g, 'Built by Aaria and her Friends 💙', 960, 826, 40, { color: P.inkSoft, weight: 700 });
        g.restore();
      }
    },
  });

  window.ABEStoryScenes = S;
})();
