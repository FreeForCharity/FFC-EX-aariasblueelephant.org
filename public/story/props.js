/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   OUR FIRST YEAR — the world kit  (window.ABEProps)

   Everything that isn't a person or an elephant: skies, streets, the house in
   Mountain House, a four-way crossing, the carnival, the classroom, the cake.

   The people in this film are modelled in three dimensions (cast3d.js). If
   the town around them stayed a flat sticker book the two would fight, so
   everything solid out here is built toward a VANISHING POINT: it has a face,
   a side and a top, and it is lit by the same lamp that lights the cast.

   Same rules as art.js — no state, pure functions of the numbers passed in.

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const A = window.ABEArt, P = A.P;
  const W = {};
  const TAU = Math.PI * 2;
  const mix = A.mix, clamp = A.clamp, lerp = A.lerp;

  /* The signs in this town are read by the audience, so they are bilingual
     like the rest of the film. (STOP stays STOP — that is what the sign at
     that junction in Mountain House actually says.) */
  const T = function (en, es) { return (window.ABELang && window.ABELang.es) ? es : en; };
  W.T = T;

  /* ═════════════════════════════════ THE WORLD IN THREE DIMENSIONS ═══════
     W.vp is the camera: where its eye level sits, and what it is pointed at.
     Move it and the whole street re-angles itself — which is how a shot gets
     to look ROUND something instead of straight past it. */
  const VP0 = { x: 960, y: 300, k: 0.30 };
  const VP = W.vp = { x: VP0.x, y: VP0.y, k: VP0.k };

  /* a screen point pushed d units away from the camera */
  function away(x, y, d) {
    const f = Math.min(d * VP.k, 0.88);
    return [x + (VP.x - x) * f, y + (VP.y - y) * f];
  }
  W.away = away;

  const LIGHT = [-0.42, -0.72];    // screen-space key light: up, over the left shoulder

  /* fill a polygon, shaded down the light */
  function quad(g, pts, col, o) {
    o = o || {};
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const gr = g.createLinearGradient(x0, y0, x0 + (x1 - x0) * 0.3, y1 + 1);
    gr.addColorStop(0, mix(col, '#ffffff', o.top === undefined ? 0.15 : o.top));
    gr.addColorStop(1, mix(col, '#1e2748', o.bot === undefined ? 0.11 : o.bot));
    g.fillStyle = gr; g.fill();
    if (o.line) { g.strokeStyle = A.alpha(P.ink, o.line); g.lineWidth = o.lw || 2.5; g.lineJoin = 'round'; g.stroke(); }
  }
  W.quad = quad;

  /* a shaded ball — foliage, a bush, a balloon, a scoop of anything */
  W.orb = function (g, x, y, rx, ry, col, o) {
    o = o || {};
    const big = Math.max(rx, ry);
    const gr = g.createRadialGradient(x + LIGHT[0] * rx * 0.44, y + LIGHT[1] * ry * 0.44, big * 0.05,
                                      x + LIGHT[0] * rx * 0.10, y + LIGHT[1] * ry * 0.10, big * 1.1);
    gr.addColorStop(0, mix(col, '#ffffff', o.gloss === undefined ? 0.38 : o.gloss));
    gr.addColorStop(0.40, mix(col, '#ffffff', 0.10));
    gr.addColorStop(0.74, col);
    gr.addColorStop(1, mix(col, '#1e2748', o.shade === undefined ? 0.28 : o.shade));
    g.save();
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    A.ell(g, x, y, rx, ry, o.rot || 0); g.fillStyle = gr; g.fill();
    g.restore();
  };

  /* a box standing on the ground at (x, y): w wide, h tall, d deep.
     The side you can see is the one turned toward the vanishing point, and
     the top only shows when the box stands below eye level. */
  W.box = function (g, x, y, w, h, d, col, o) {
    o = o || {};
    const fl = [x - w / 2, y - h], fr = [x + w / 2, y - h];
    const bl = [x - w / 2, y], br = [x + w / 2, y];
    const Fl = away(fl[0], fl[1], d), Fr = away(fr[0], fr[1], d);
    const Bl = away(bl[0], bl[1], d), Br = away(br[0], br[1], d);
    const lineO = { line: o.line, lw: o.lw };
    if (VP.x > x) quad(g, [fr, Fr, Br, br], mix(col, '#1e2748', 0.26), Object.assign({ top: 0.05, bot: 0.14 }, lineO));
    else          quad(g, [fl, Fl, Bl, bl], mix(col, '#1e2748', 0.26), Object.assign({ top: 0.05, bot: 0.14 }, lineO));
    if (y - h > VP.y) quad(g, [fl, fr, Fr, Fl], mix(col, '#ffffff', 0.24), Object.assign({ top: 0.10, bot: 0.02 }, lineO));
    quad(g, [fl, fr, br, bl], col, Object.assign({ top: o.top, bot: o.bot }, lineO));
    return { fl: fl, fr: fr, bl: bl, br: br, Fl: Fl, Fr: Fr, Bl: Bl, Br: Br };
  };

  /* a hipped roof sitting on an eave line: front slope, top slope, one end */
  W.roof = function (g, x, yEave, w, rise, d, col, o) {
    o = o || {};
    const L = [x - w / 2, yEave], R = [x + w / 2, yEave];
    const rl = [x - w * 0.20, yEave - rise], rr = [x + w * 0.20, yEave - rise];
    const RL = away(rl[0], rl[1], d * 0.55), RR = away(rr[0], rr[1], d * 0.55);
    const Lb = away(L[0], L[1], d), Rb = away(R[0], R[1], d);
    if (VP.x > x) quad(g, [R, Rb, RR, rr], mix(col, '#1e2748', 0.28), { top: 0.04, bot: 0.14 });
    else          quad(g, [L, Lb, RL, rl], mix(col, '#1e2748', 0.28), { top: 0.04, bot: 0.14 });
    quad(g, [rl, rr, RR, RL], mix(col, '#ffffff', 0.22), { top: 0.1, bot: 0.02 });
    quad(g, [L, R, rr, rl], col, { top: 0.18, bot: 0.06 });
  };

  /* a soft contact shadow on the ground */
  W.cast = function (g, x, y, rx, ry, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, 'rgba(26,34,70,' + (a === undefined ? 0.26 : a) + ')');
    gr.addColorStop(0.55, 'rgba(26,34,70,' + (a === undefined ? 0.13 : a * 0.5) + ')');
    gr.addColorStop(1, 'rgba(26,34,70,0)');
    g.save(); A.ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill(); g.restore();
  };

  /* ───────────────────────────────────────────────────────────── THE SHOT
     Wrap a chapter (or one shot inside it) in this and the camera moves:
     push in, drift sideways, and — the part that actually reads as three
     dimensions — swing round, because yaw is handed straight to the cast so
     every person in frame turns with it.

       const cam = W.cam(g, { zoom: 1.15, yaw: 0.3, vpx: 700 });
       ...draw the shot...
       cam.end();                                                            */
  W.cam = function (g, o) {
    o = o || {};
    const keepVp = { x: VP.x, y: VP.y, k: VP.k };
    const keepView = window.ABECast ? window.ABECast.setView(o) : null;
    // same rule as the cast's view: anything left out goes back to the
    // default, so a frame never depends on the frame drawn before it
    VP.x = o.vpx === undefined ? VP0.x : o.vpx;
    VP.y = o.vpy === undefined ? VP0.y : o.vpy;
    VP.k = o.vpk === undefined ? VP0.k : o.vpk;
    const z = o.zoom === undefined ? 1 : o.zoom;
    const fx = o.fx === undefined ? 960 : o.fx, fy = o.fy === undefined ? 620 : o.fy;
    g.save();
    g.translate(fx + (o.dx || 0), fy + (o.dy || 0));
    g.scale(z, z);
    if (o.roll) g.rotate(o.roll);
    g.translate(-fx, -fy);
    return {
      end: function () {
        g.restore();
        VP.x = keepVp.x; VP.y = keepVp.y; VP.k = keepVp.k;
        if (keepView && window.ABECast) window.ABECast.setView(keepView);
      },
    };
  };

  /* ───────────────────────────────────────────────────────────────── skies */
  const SKIES = {
    day:    ['#bfe8ff', '#e8f6ff', '#fff6e4'],
    morning:['#ffd9b0', '#ffeede', '#e6f4ff'],
    dusk:   ['#f7b48a', '#f2d0c4', '#cfd8f0'],
    night:  ['#101a38', '#1d2b4a', '#33436e'],
    warm:   ['#ffe9cf', '#fff6e9', '#fffdf8'],
    grey:   ['#9aa6bd', '#c3ccdd', '#dfe6f0'],
    joy:    ['#ffe08a', '#ffd0e4', '#cdeeff'],
  };
  W.sky = function (g, key, h) {
    const c = SKIES[key] || SKIES.day;
    const gr = g.createLinearGradient(0, 0, 0, h || 1080);
    gr.addColorStop(0, c[0]); gr.addColorStop(0.55, c[1]); gr.addColorStop(1, c[2]);
    g.fillStyle = gr; g.fillRect(-200, -200, 2320, 1480);
  };
  W.sun = function (g, x, y, r, t) {
    g.save();
    const glow = g.createRadialGradient(x, y, r * 0.6, x, y, r * 4.2);
    glow.addColorStop(0, 'rgba(255,224,120,.42)'); glow.addColorStop(1, 'rgba(255,224,120,0)');
    g.fillStyle = glow; A.ell(g, x, y, r * 4.2, r * 4.2); g.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + (t || 0) * 0.12;
      g.save(); g.translate(x, y); g.rotate(a);
      A.rr(g, r * 1.2, -r * 0.06, r * 0.36, r * 0.12, r * 0.06);
      g.fillStyle = 'rgba(255,212,59,.6)'; g.fill(); g.restore();
    }
    W.orb(g, x, y, r, r, P.sun, { gloss: 0.5, shade: 0.12 });
    g.restore();
  };
  W.moon = function (g, x, y, r) {
    g.save();
    const glow = g.createRadialGradient(x, y, r * 0.7, x, y, r * 3.4);
    glow.addColorStop(0, 'rgba(255,245,210,.24)'); glow.addColorStop(1, 'rgba(255,245,210,0)');
    g.fillStyle = glow; A.ell(g, x, y, r * 3.4, r * 3.4); g.fill();
    W.orb(g, x, y, r, r, '#fff3cd', { gloss: 0.35, shade: 0.22 });
    A.ell(g, x + r * 0.4, y - r * 0.28, r * 0.16, r * 0.16); g.fillStyle = 'rgba(200,190,160,.45)'; g.fill();
    A.ell(g, x - r * 0.25, y + r * 0.3, r * 0.12, r * 0.12); g.fill();
    g.restore();
  };
  W.stars = function (g, n, t, seed) {
    g.save();
    for (let i = 0; i < n; i++) {
      const x = A.rand(i * 1.3 + (seed || 0)) * 1920, y = A.rand(i * 2.7 + (seed || 0)) * 620;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin((t || 0) * 1.4 + i));
      g.globalAlpha = tw; g.fillStyle = '#fff8e0';
      const r = 1.5 + A.rand(i * 5.1) * 2.5;
      A.ell(g, x, y, r, r); g.fill();
    }
    g.restore();
  };
  /* clouds get a lit top and a shaded underside, so even the sky has volume */
  W.cloud = function (g, x, y, s, a) {
    g.save(); g.globalAlpha *= (a === undefined ? 0.95 : a);
    const lobes = [[-58, 6, 40, 26], [-16, -16, 50, 34], [30, -4, 44, 28], [64, 10, 32, 20]];
    lobes.forEach((l) => W.orb(g, x + l[0] * s, y + l[1] * s, l[2] * s, l[3] * s, '#ffffff',
                              { gloss: 0.2, shade: 0.16 }));
    g.restore();
  };
  W.rain = function (g, t, n, a) {
    g.save(); g.strokeStyle = 'rgba(190,215,240,' + (a || 0.5) + ')'; g.lineWidth = 2.4; g.lineCap = 'round';
    for (let i = 0; i < (n || 120); i++) {
      const sp = 700 + A.rand(i * 3.7) * 500;
      const x = (A.rand(i) * 2100 - 90 + ((t * 60) % 40)) % 2100;
      const y = ((A.rand(i * 9.1) * 1080) + t * sp) % 1200 - 60;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 7, y + 26); g.stroke();
    }
    g.restore();
  };

  /* ───────────────────────────────────────────────────── ground & road
     A ground plane, not a green rectangle: hazy where it meets the sky,
     saturated underfoot, with its texture converging on the vanishing point
     so the eye reads distance. */
  W.ground = function (g, y, c1, c2) {
    const far = c1 || P.grass, near = c2 || P.grassDk;
    const gr = g.createLinearGradient(0, y, 0, 1090);
    gr.addColorStop(0, mix(far, '#e8f4ff', 0.46));
    gr.addColorStop(0.16, far);
    gr.addColorStop(1, mix(near, '#000000', 0.07));
    g.fillStyle = gr; g.fillRect(-200, y, 2320, 1090 - y);
    g.save();
    g.beginPath(); g.rect(-200, y, 2320, 1090 - y); g.clip();
    g.strokeStyle = A.alpha(mix(near, '#000000', 0.4), 0.09); g.lineWidth = 2.5;
    for (let i = -4; i <= 22; i++) {
      const bx = i * 150 - 320;
      g.beginPath(); g.moveTo(bx, 1100); g.lineTo(VP.x + (bx - VP.x) * 0.07, y + 1); g.stroke();
    }
    for (let i = 1; i < 10; i++) {
      const yy = y + Math.pow(i / 10, 2.2) * (1090 - y);
      g.beginPath(); g.moveTo(-200, yy); g.lineTo(2120, yy); g.stroke();
    }
    g.restore();
    for (let i = 0; i < 24; i++) {
      const yy = y + 16 + Math.pow(A.rand(i * 7.7), 1.8) * (1050 - y);
      const sc = 0.3 + (yy - y) / Math.max(1, 1080 - y);
      W.orb(g, A.rand(i * 4.4) * 1920, yy, (26 + A.rand(i) * 30) * sc, 8 * sc,
            mix(near, '#000000', 0.08), { gloss: 0.2, shade: 0.16 });
    }
  };

  W.road = function (g, y, h, dash) {
    // kerbs, with a lip so the road sits DOWN in the world
    g.fillStyle = mix('#cfd6e2', '#ffffff', 0.3); g.fillRect(-200, y - 28, 2320, 28);
    g.fillStyle = mix('#cfd6e2', '#1e2748', 0.22); g.fillRect(-200, y - 7, 2320, 7);
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, mix(P.road, '#ffffff', 0.16));
    gr.addColorStop(0.5, P.road);
    gr.addColorStop(1, mix(P.road, '#1e2748', 0.14));
    g.fillStyle = gr; g.fillRect(-200, y, 2320, h);
    g.fillStyle = mix('#cfd6e2', '#ffffff', 0.18); g.fillRect(-200, y + h, 2320, 28);
    g.fillStyle = A.alpha(P.ink, 0.10); g.fillRect(-200, y + h, 2320, 5);
    if (dash !== false) {
      g.save(); g.strokeStyle = '#ffe9a8'; g.lineWidth = 8; g.setLineDash([60, 46]);
      g.beginPath(); g.moveTo(-240, y + h / 2); g.lineTo(2160, y + h / 2); g.stroke(); g.restore();
    }
  };

  /* the four-way crossing. The arm running away from camera actually narrows
     toward the vanishing point — that one change is what turns this shot from
     a diagram into a place. */
  W.crossing = function (g, cx, cy, w) {
    g.save();
    const gr = g.createLinearGradient(0, cy - w, 0, cy + w);
    gr.addColorStop(0, mix(P.road, '#ffffff', 0.14)); gr.addColorStop(1, mix(P.road, '#1e2748', 0.12));
    g.fillStyle = gr; g.fillRect(-200, cy - w / 2, 2320, w);
    // the arm going away: a trapezoid, wide at the bottom, narrow at the top
    const topL = away(cx - w / 2, 0, 1.0), topR = away(cx + w / 2, 0, 1.0);
    quad(g, [[cx - w / 2, 1090], [cx + w / 2, 1090], topR, topL], P.road, { top: 0.16, bot: 0.10 });
    g.fillStyle = mix('#cfd6e2', '#ffffff', 0.2);
    g.fillRect(-200, cy - w / 2 - 24, 2320, 24);
    g.fillRect(-200, cy + w / 2, 2320, 24);
    g.fillStyle = 'rgba(255,255,255,.92)';
    for (let i = 0; i < 6; i++) {
      const o = (i - 2.5) * (w / 7);
      g.fillRect(cx - w / 2 - 78, cy + o - w / 16, 62, w / 8);
      g.fillRect(cx + w / 2 + 16, cy + o - w / 16, 62, w / 8);
      g.fillRect(cx + o - w / 16, cy - w / 2 - 78, w / 8, 62);
      g.fillRect(cx + o - w / 16, cy + w / 2 + 16, w / 8, 62);
    }
    g.restore();
  };

  /* a car, seen from three-quarters on: a body box, a cabin box, round wheels */
  W.car = function (g, x, y, s, col, o) {
    o = o || {};
    const U = (v) => v * s, f = o.facing === undefined ? 1 : o.facing;
    g.save();
    g.translate(x, y); g.scale(f, 1); g.translate(-x, -y);
    W.cast(g, x, y + U(6), U(92), U(16));
    const d = 0.10 * s;
    W.box(g, x - U(6), y - U(28), U(88), U(40), d, mix(col, '#ffffff', 0.10));  // cabin
    W.box(g, x, y - U(4), U(158), U(36), d, col);                               // body
    // glass
    const gl = away(x - U(28), y - U(58), d);
    quad(g, [[x - U(46), y - U(58)], [x + U(28), y - U(58)],
             away(x + U(28), y - U(58), d), [gl[0], gl[1]]], '#bfe3ff', { top: 0.3, bot: 0.05 });
    A.rr(g, x - U(46), y - U(56), U(36), U(24), U(7)); A.shape(g, '#d8f0ff', 0);
    A.rr(g, x - U(4), y - U(56), U(32), U(24), U(7)); A.shape(g, '#d8f0ff', 0);
    W.orb(g, x + U(74), y - U(22), U(9), U(7), o.lights ? '#fff6c4' : '#ffe08a', { gloss: 0.5 });
    W.orb(g, x - U(74), y - U(22), U(7), U(6), '#f08a8a', { gloss: 0.4 });
    [-46, 46].forEach((dx) => {
      W.orb(g, x + U(dx), y - U(2), U(18), U(18), '#2b3244', { gloss: 0.22, shade: 0.3 });
      W.orb(g, x + U(dx), y - U(2), U(8), U(8), '#c6cfe0', { gloss: 0.5 });
    });
    if (o.lights) {
      g.save(); g.globalAlpha *= 0.4;
      g.beginPath(); g.moveTo(x + U(80), y - U(26)); g.lineTo(x + U(300), y - U(66)); g.lineTo(x + U(300), y + U(22)); g.closePath();
      g.fillStyle = '#fff3c4'; g.fill(); g.restore();
    }
    g.restore();
  };

  /* ────────────────────────────────────────────────────────── the outdoors */
  W.tree = function (g, x, y, s, t, i) {
    const U = (v) => v * s;
    const sway = Math.sin((t || 0) * 1.1 + (i || 0)) * 0.03;
    g.save();
    W.cast(g, x + U(10), y + U(2), U(58), U(14));
    W.box(g, x, y, U(22), U(96), 0.05 * s, '#a3714c', { top: 0.2 });
    g.translate(x, y - U(96)); g.rotate(sway); g.translate(-x, -(y - U(96)));
    W.orb(g, x - U(30), y - U(132), U(52), U(46), mix(P.grass, '#000000', 0.10));
    W.orb(g, x + U(34), y - U(128), U(48), U(42), mix(P.grass, '#000000', 0.06));
    W.orb(g, x + U(2), y - U(168), U(56), U(48), P.grass);
    g.restore();
  };
  W.bush = function (g, x, y, s) {
    W.cast(g, x, y + 3 * s, 52 * s, 11 * s, 0.2);
    W.orb(g, x - 22 * s, y - 18 * s, 30 * s, 24 * s, mix(P.grassDk, '#000000', 0.08));
    W.orb(g, x + 20 * s, y - 16 * s, 28 * s, 22 * s, P.grassDk);
    W.orb(g, x, y - 32 * s, 32 * s, 26 * s, mix(P.grassDk, '#ffffff', 0.06));
  };

  /* windows, doors and signs are flat decals on whatever face they sit on */
  function pane(g, x, y, w, h, lit) {
    A.rr(g, x - w / 2, y - h / 2, w, h, Math.min(8, h * 0.16));
    const gr = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    if (lit) { gr.addColorStop(0, '#fff3c0'); gr.addColorStop(1, '#ffd98a'); }
    else { gr.addColorStop(0, '#dff1ff'); gr.addColorStop(0.45, '#a9d6f2'); gr.addColorStop(1, '#cfe9fb'); }
    g.fillStyle = gr; g.fill();
    g.strokeStyle = A.alpha(P.ink, 0.22); g.lineWidth = Math.max(2, h * 0.05); g.stroke();
    g.save(); g.globalAlpha *= 0.5; g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(2, h * 0.05);
    g.beginPath(); g.moveTo(x, y - h / 2); g.lineTo(x, y + h / 2);
    g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.stroke(); g.restore();
  }
  W.pane = pane;

  W.house = function (g, x, y, s, o) {
    o = o || {};
    const U = (v) => v * s;
    const wall = o.wall || '#fff3e2', roof = o.roof || '#e08a6a';
    g.save();
    W.cast(g, x, y + U(6), U(150), U(20));
    W.box(g, x, y, U(240), U(150), 0.30 * s, wall, { top: 0.12, bot: 0.10 });
    W.roof(g, x, y - U(148), U(282), U(96), 0.30 * s, roof);
    A.rr(g, x - U(30), y - U(88), U(60), U(88), U(8)); A.shape(g, o.doorOpen ? '#2b3a56' : '#8d5a3b', 0);
    if (!o.doorOpen) W.orb(g, x + U(16), y - U(44), U(5), U(5), P.sun, { gloss: 0.5 });
    [[-80, -120], [80, -120]].forEach((p) => pane(g, x + U(p[0]), y + U(p[1]), U(52), U(48), o.lit));
    if (o.name) A.text(g, o.name, x, y - U(178), U(22), { color: P.white });
    g.restore();
  };

  W.school = function (g, x, y, s) {
    const U = (v) => v * s;
    g.save();
    W.cast(g, x, y + U(8), U(300), U(26));
    W.box(g, x, y, U(480), U(180), 0.34 * s, '#f6e3c4', { top: 0.12 });
    W.box(g, x, y - U(180), U(516), U(30), 0.34 * s, '#c96a5a');
    A.rr(g, x - U(46), y - U(96), U(92), U(96), U(10)); A.shape(g, '#8d5a3b', 0);
    for (let i = 0; i < 5; i++) {
      const wx = x - U(190) + i * U(95);
      if (Math.abs(wx - x) < U(60)) continue;
      pane(g, wx, y - U(119), U(60), U(58));
    }
    A.rr(g, x - U(120), y - U(258), U(240), U(52), U(12)); A.shape(g, P.white, U(5));
    A.text(g, T('SCHOOL', 'ESCUELA'), x, y - U(230), U(30));
    g.restore();
  };

  W.bus = function (g, x, y, s) {
    const U = (v) => v * s;
    g.save();
    W.cast(g, x, y + U(6), U(130), U(18));
    W.box(g, x, y, U(220), U(104), 0.14 * s, '#ffc93c', { top: 0.14 });
    for (let i = 0; i < 4; i++) pane(g, x - U(77) + i * U(48), y - U(72), U(38), U(36));
    pane(g, x + U(83), y - U(54), U(38), U(76));
    g.fillStyle = A.alpha(P.ink, 0.5); g.fillRect(x - U(110), y - U(40), U(220), U(10));
    [-62, 58].forEach((dx) => {
      W.orb(g, x + U(dx), y - U(2), U(19), U(19), '#2b3244', { gloss: 0.2, shade: 0.3 });
      W.orb(g, x + U(dx), y - U(2), U(8), U(8), '#c6cfe0', { gloss: 0.5 });
    });
    g.restore();
  };

  /* ───────────────────────────────────────────────────────────── interiors
     A room in one-point perspective: a back wall, a floor and two side walls
     splaying out of frame. Ten chapters happen inside one of these, so this
     is where most of the depth in the film is felt. */
  W.room = function (g, o) {
    o = o || {};
    const floorY = o.floorY || 760;
    const wall = o.wall || '#ffeedd', floor = o.floor || '#d9a877';
    const cx = o.cx === undefined ? 960 : o.cx;
    const bw = o.backW || 1240, bt = o.wallTop === undefined ? 60 : o.wallTop;
    const bx0 = cx - bw / 2, bx1 = cx + bw / 2;
    const L = -260, R = 2180, TOP = -160, BOT = 1140;
    g.save();
    // the floor, running from the foot of the back wall out past the camera
    quad(g, [[bx0, floorY], [bx1, floorY], [R, BOT], [L, BOT]], floor, { top: 0.24, bot: 0.14 });
    g.save();
    g.beginPath(); g.moveTo(bx0, floorY); g.lineTo(bx1, floorY); g.lineTo(R, BOT); g.lineTo(L, BOT); g.closePath(); g.clip();
    g.strokeStyle = A.alpha(mix(floor, '#000000', 0.5), 0.18); g.lineWidth = 3;
    for (let i = -3; i <= 15; i++) {   // boards converging on the back wall
      const bx = lerp(bx0, bx1, i / 12);
      g.beginPath(); g.moveTo(bx, floorY); g.lineTo(lerp(L, R, i / 12), BOT); g.stroke();
    }
    for (let i = 1; i < 7; i++) {
      const yy = floorY + Math.pow(i / 7, 2.0) * (BOT - floorY);
      g.globalAlpha = 0.5; g.beginPath(); g.moveTo(L, yy); g.lineTo(R, yy); g.stroke();
    }
    g.restore();
    // the side walls, full height so the room is closed
    quad(g, [[bx0, bt], [bx0, floorY], [L, BOT], [L, TOP]], mix(wall, '#1e2748', 0.13), { top: 0.16, bot: 0.06 });
    quad(g, [[bx1, bt], [bx1, floorY], [R, BOT], [R, TOP]], mix(wall, '#1e2748', 0.06), { top: 0.2, bot: 0.04 });
    // the ceiling, running back to meet the top of the far wall
    quad(g, [[bx0, bt], [bx1, bt], [R, TOP], [L, TOP]], mix(wall, '#ffffff', 0.44), { top: 0.06, bot: 0.14 });
    // the back wall
    const wg = g.createLinearGradient(0, bt, 0, floorY);
    wg.addColorStop(0, mix(wall, '#ffffff', 0.32)); wg.addColorStop(1, mix(wall, '#1e2748', 0.05));
    g.fillStyle = wg; g.fillRect(bx0, bt, bw, floorY - bt);
    // skirting, and the shadow the floor throws up the wall
    g.fillStyle = mix(wall, '#ffffff', 0.5); g.fillRect(bx0, floorY - 22, bw, 22);
    g.fillStyle = A.alpha(P.ink, 0.10); g.fillRect(bx0, floorY - 4, bw, 4);
    const ag = g.createLinearGradient(0, floorY - 150, 0, floorY);
    ag.addColorStop(0, 'rgba(26,34,70,0)'); ag.addColorStop(1, 'rgba(26,34,70,.10)');
    g.fillStyle = ag; g.fillRect(bx0, floorY - 150, bw, 150);
    if (o.dim) { g.fillStyle = 'rgba(16,26,60,' + o.dim + ')'; g.fillRect(L, TOP, R - L, BOT - TOP); }
    g.restore();
  };

  W.window = function (g, x, y, w, h, o) {
    o = o || {};
    g.save();
    // a reveal, so the window is a hole in a wall with thickness
    A.rr(g, x - w / 2 - 12, y - h / 2 - 12, w + 24, h + 24, 16);
    g.fillStyle = 'rgba(26,34,70,.10)'; g.fill();
    A.rr(g, x - w / 2, y - h / 2, w, h, 14);
    if (o.night) {
      g.fillStyle = '#22315c'; g.fill();
      g.save(); g.clip(); W.stars(g, 14, o.t || 0, 3); g.restore();
    } else {
      const gr = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
      gr.addColorStop(0, '#dff1ff'); gr.addColorStop(0.5, '#a9d6f2'); gr.addColorStop(1, '#e7f5ff');
      g.fillStyle = gr; g.fill();
    }
    g.strokeStyle = A.alpha(P.ink, 0.35); g.lineWidth = 8; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(x, y - h / 2); g.lineTo(x, y + h / 2);
    g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.stroke();
    if (o.curtain !== false) {
      [-1, 1].forEach((sx) => {
        g.beginPath();
        g.moveTo(x + sx * (w / 2 + 12), y - h / 2 - 18);
        g.quadraticCurveTo(x + sx * (w / 2 - 26), y, x + sx * (w / 2 + 6), y + h / 2 + 12);
        g.lineTo(x + sx * (w / 2 + 48), y + h / 2 + 12);
        g.lineTo(x + sx * (w / 2 + 48), y - h / 2 - 18);
        g.closePath();
        const cg = g.createLinearGradient(x + sx * (w / 2 - 26), 0, x + sx * (w / 2 + 48), 0);
        const cc = o.curtain || '#f2a3a3';
        cg.addColorStop(0, mix(cc, '#1e2748', 0.22)); cg.addColorStop(0.45, cc);
        cg.addColorStop(1, mix(cc, '#ffffff', 0.18));
        g.fillStyle = cg; g.fill();
      });
    }
    g.restore();
  };

  W.sofa = function (g, x, y, s, col) {
    const U = (v) => v * s, c = col || '#7fb7d9';
    g.save();
    W.cast(g, x, y + U(6), U(180), U(22));
    W.box(g, x, y - U(70), U(300), U(64), 0.16 * s, c, { top: 0.2 });        // back
    W.box(g, x, y, U(320), U(74), 0.20 * s, mix(c, '#ffffff', 0.14), { top: 0.24 });  // seat
    [-1, 1].forEach((sx) => W.box(g, x + sx * U(150), y, U(48), U(112), 0.18 * s, c, { top: 0.18 }));
    g.restore();
  };
  W.rug = function (g, x, y, rx, ry, col) {
    const c = col || '#f0c26a';
    const gr = g.createRadialGradient(x, y - ry * 0.3, ry * 0.2, x, y, rx);
    gr.addColorStop(0, mix(c, '#ffffff', 0.22)); gr.addColorStop(1, mix(c, '#1e2748', 0.12));
    A.ell(g, x, y, rx, ry); g.fillStyle = gr; g.fill();
    A.ell(g, x, y, rx * 0.72, ry * 0.72);
    g.strokeStyle = A.alpha(mix(c, '#1e2748', 0.5), 0.45); g.lineWidth = 5; g.stroke();
  };
  W.lamp = function (g, x, y, s, on) {
    const U = (v) => v * s;
    g.save();
    if (on) {
      const gr = g.createRadialGradient(x, y - U(90), U(10), x, y - U(90), U(440));
      gr.addColorStop(0, 'rgba(255,225,150,.5)'); gr.addColorStop(1, 'rgba(255,225,150,0)');
      g.fillStyle = gr; A.ell(g, x, y - U(90), U(440), U(440)); g.fill();
    }
    W.cast(g, x, y + U(2), U(44), U(12));
    W.box(g, x, y, U(16), U(96), 0.05 * s, '#8d6a4a');
    W.orb(g, x, y - U(2), U(34), U(11), '#8d6a4a');
    const top = on ? '#ffe9a8' : '#e8ddc8';
    quad(g, [[x - U(46), y - U(96)], [x - U(30), y - U(150)], [x + U(30), y - U(150)], [x + U(46), y - U(96)]],
         top, { top: 0.25, bot: 0.14 });
    g.restore();
  };
  W.table = function (g, x, y, s, col) {
    const U = (v) => v * s, c = col || '#c89a6a';
    W.cast(g, x, y + U(4), U(140), U(18));
    [-96, 88].forEach((dx) => W.box(g, x + U(dx) + U(8), y, U(16), U(58), 0.10 * s, mix(c, '#1e2748', 0.12)));
    // the top, seen from above: a slab with a visible far edge
    const d = 0.13 * s;
    const fl = [x - U(120), y - U(74)], fr = [x + U(120), y - U(74)];
    const Bl = away(fl[0], fl[1], d), Br = away(fr[0], fr[1], d);
    quad(g, [fl, fr, Br, Bl], mix(c, '#ffffff', 0.26), { top: 0.1, bot: 0.02 });
    quad(g, [fl, fr, [fr[0], fr[1] + U(20)], [fl[0], fl[1] + U(20)]], c, { top: 0.14, bot: 0.1 });
  };
  W.bed = function (g, x, y, s) {
    const U = (v) => v * s;
    g.save();
    W.cast(g, x, y + U(6), U(230), U(24));
    W.box(g, x - U(190), y, U(40), U(150), 0.14 * s, '#a3714c');      // headboard
    W.box(g, x + U(190), y, U(38), U(100), 0.14 * s, '#a3714c');      // footboard
    const d = 0.34 * s;
    const ml = [x - U(200), y - U(90)], mr = [x + U(200), y - U(90)];
    quad(g, [ml, mr, away(mr[0], mr[1], d), away(ml[0], ml[1], d)], '#fff6ea', { top: 0.1 });
    quad(g, [ml, mr, [mr[0], mr[1] + U(34)], [ml[0], ml[1] + U(34)]], '#fff6ea', { top: 0.14, bot: 0.12 });
    const bl = [x - U(200), y - U(66)], br = [x + U(120), y - U(66)];
    quad(g, [bl, br, away(br[0], br[1], d), away(bl[0], bl[1], d)], '#8fc3e8', { top: 0.12 });
    quad(g, [bl, br, [br[0], br[1] + U(30)], [bl[0], bl[1] + U(30)]], '#8fc3e8', { top: 0.16, bot: 0.12 });
    // pillow: a little slab lying on the mattress, not a balloon floating over it
    const pl = [x - U(196), y - U(100)], pr = [x - U(66), y - U(100)];
    quad(g, [pl, pr, away(pr[0], pr[1], d), away(pl[0], pl[1], d)], '#ffffff', { top: 0.08, bot: 0.02 });
    quad(g, [pl, pr, [pr[0], pr[1] + U(26)], [pl[0], pl[1] + U(26)]], '#f2f4fa', { top: 0.12, bot: 0.12 });
    g.restore();
  };

  /* ──────────────────────────────────────────────────────────────── things */
  /* an open picture book — pages are drawn by a callback, so any chapter can
     put anything on them */
  W.book = function (g, x, y, s, drawL, drawR, o) {
    o = o || {};
    const U = (v) => v * s;
    g.save();
    W.cast(g, x, y + U(96), U(250), U(24));
    [-1, 1].forEach((sx) => {
      g.save();
      g.beginPath();
      g.moveTo(x, y - U(130)); g.quadraticCurveTo(x + sx * U(120), y - U(150), x + sx * U(236), y - U(120));
      g.lineTo(x + sx * U(236), y + U(92)); g.quadraticCurveTo(x + sx * U(120), y + U(114), x, y + U(86));
      g.closePath();
      const gr = g.createLinearGradient(x, y, x + sx * U(236), y);
      gr.addColorStop(0, '#e6e2d8'); gr.addColorStop(0.28, '#ffffff'); gr.addColorStop(1, '#f6f2e8');
      g.fillStyle = gr; g.fill();
      g.strokeStyle = A.alpha(P.ink, 0.18); g.lineWidth = U(4); g.stroke();
      g.clip();
      if (sx < 0 && drawL) drawL(g, x - U(120), y - U(20), s);
      if (sx > 0 && drawR) drawR(g, x + U(120), y - U(20), s);
      g.restore();
    });
    g.save(); g.strokeStyle = A.alpha(P.ink, 0.3); g.lineWidth = U(5); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y - U(130)); g.lineTo(x, y + U(86)); g.stroke(); g.restore();
    g.restore();
  };
  W.bubble = function (g, x, y, w, h, tailX, tailY, o) {
    o = o || {};
    g.save();
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.shadowColor = 'rgba(26,34,70,.18)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    if (o.thought) {
      A.ell(g, x, y, w / 2, h / 2); A.shape(g, P.white, 6);
      g.shadowColor = 'transparent';
      let px = x, py = y + h / 2;
      for (let i = 1; i <= 3; i++) {
        px = A.lerp(x, tailX, i / 3.4); py = A.lerp(y + h / 2, tailY, i / 3.4);
        A.ell(g, px, py, 16 - i * 3.5, 16 - i * 3.5); A.shape(g, P.white, 5);
      }
    } else {
      A.rr(g, x - w / 2, y - h / 2, w, h, Math.min(28, h / 2));
      g.fillStyle = P.white; g.fill();
      g.beginPath();
      g.moveTo(x - 24, y + h / 2 - 4); g.lineTo(tailX, tailY); g.lineTo(x + 24, y + h / 2 - 4); g.closePath();
      g.fillStyle = P.white; g.fill();
      g.shadowColor = 'transparent';
      A.rr(g, x - w / 2, y - h / 2, w, h, Math.min(28, h / 2));
      g.strokeStyle = P.ink; g.lineWidth = 6; g.stroke();
      g.beginPath();
      g.moveTo(x - 24, y + h / 2 - 3); g.lineTo(tailX, tailY); g.lineTo(x + 24, y + h / 2 - 3);
      g.strokeStyle = P.ink; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke();
      g.beginPath(); g.moveTo(x - 22, y + h / 2 - 4); g.lineTo(x + 22, y + h / 2 - 4);
      g.strokeStyle = P.white; g.lineWidth = 8; g.stroke();
    }
    g.restore();
  };
  W.heart = function (g, x, y, s, col, a) {
    g.save(); if (a !== undefined) g.globalAlpha *= a;
    g.beginPath();
    g.moveTo(x, y + s * 0.85);
    g.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.55, y - s * 1.15, x, y - s * 0.35);
    g.bezierCurveTo(x + s * 0.55, y - s * 1.15, x + s * 1.5, y - s * 0.2, x, y + s * 0.85);
    g.closePath();
    const c = col || '#f2708f';
    const gr = g.createRadialGradient(x - s * 0.4, y - s * 0.5, s * 0.1, x, y, s * 1.5);
    gr.addColorStop(0, mix(c, '#ffffff', 0.45)); gr.addColorStop(0.6, c);
    gr.addColorStop(1, mix(c, '#1e2748', 0.22));
    g.fillStyle = gr; g.fill();
    g.restore();
  };
  W.star = function (g, x, y, r, col, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.44 : r, a = (i / 10) * TAU - Math.PI / 2;
      g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    const c = col || P.sun;
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r * 1.2);
    gr.addColorStop(0, mix(c, '#ffffff', 0.5)); gr.addColorStop(0.6, c);
    gr.addColorStop(1, mix(c, '#1e2748', 0.2));
    g.fillStyle = gr; g.fill();
    g.restore();
  };
  W.balloon = function (g, x, y, s, col, t) {
    const sway = Math.sin((t || 0) * 1.3 + x * 0.01) * 6;
    g.save();
    g.strokeStyle = 'rgba(22,37,92,.4)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x + sway, y);
    g.quadraticCurveTo(x + sway * 1.6, y + 60 * s, x, y + 130 * s); g.stroke();
    W.orb(g, x + sway, y - 44 * s, 36 * s, 44 * s, col, { gloss: 0.5, shade: 0.3 });
    g.beginPath();
    g.moveTo(x + sway - 8 * s, y); g.lineTo(x + sway + 8 * s, y); g.lineTo(x + sway, y + 12 * s);
    g.closePath(); g.fillStyle = mix(col, '#1e2748', 0.2); g.fill();
    g.restore();
  };
  W.cake = function (g, x, y, s, candles, flick) {
    const U = (v) => v * s;
    g.save();
    W.cast(g, x, y + U(6), U(190), U(22));
    const d = 0.10 * s;
    // the plate, then two tiers, each a cylinder-ish slab with a visible top
    const slab = (yy, hw, hh, col) => {
      const fl = [x - hw, yy - hh], fr = [x + hw, yy - hh];
      quad(g, [fl, fr, away(fr[0], fr[1], d), away(fl[0], fl[1], d)], mix(col, '#ffffff', 0.22), { top: 0.1, bot: 0.02 });
      quad(g, [fl, fr, [fr[0], yy], [fl[0], yy]], col, { top: 0.16, bot: 0.1 });
    };
    slab(y, U(170), U(24), '#e8eef8');
    slab(y - U(20), U(140), U(92), '#ffd9ea');
    slab(y - U(108), U(118), U(30), P.white);
    for (let i = 0; i < 7; i++) {
      const dx = -U(120) + i * U(40);
      g.beginPath(); g.moveTo(x + dx, y - U(96));
      g.quadraticCurveTo(x + dx + U(6), y - U(80), x + dx, y - U(64));
      g.strokeStyle = ['#f2708f', '#6cc7f0', '#ffd43b'][i % 3]; g.lineWidth = U(6); g.lineCap = 'round'; g.stroke();
    }
    for (let i = 0; i < (candles || 1); i++) {
      const dx = (i - (candles - 1) / 2) * U(46);
      W.box(g, x + dx, y - U(126), U(14), U(64), 0.04 * s, '#ffd9ea');
      const fl = 1 + Math.sin((flick || 0) * 9 + i) * 0.16;
      W.orb(g, x + dx, y - U(206), U(9) * fl, U(17) * fl, '#ffb03a', { gloss: 0.6, shade: 0.1 });
      W.orb(g, x + dx, y - U(202), U(4.5) * fl, U(9) * fl, '#fff0b0', { gloss: 0.6, shade: 0.05 });
    }
    g.restore();
  };
  W.confetti = function (g, t, n, y0) {
    g.save();
    for (let i = 0; i < (n || 80); i++) {
      const sp = 90 + A.rand(i * 2.2) * 150;
      const x = A.rand(i * 1.7) * 1920 + Math.sin(t * 1.4 + i) * 40;
      const y = ((A.rand(i * 5.3) * 1200) + t * sp) % 1300 - 120 + (y0 || 0);
      const spin = t * 2 + i;
      g.save(); g.translate(x, y); g.rotate(spin);
      // it tumbles: the piece narrows as it turns edge-on
      g.scale(Math.abs(Math.cos(spin * 1.7)) * 0.75 + 0.25, 1);
      g.fillStyle = P.rainbow[i % P.rainbow.length];
      g.fillRect(-7, -4, 14, 9);
      g.restore();
    }
    g.restore();
  };
  /* a real cube, so it can actually be rolling */
  W.die = function (g, x, y, s, face, rot) {
    const U = (v) => v * s;
    const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
      4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
      6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    g.save();
    g.translate(x, y); g.rotate(rot || 0);
    const d = 0.10 * s;
    const fl = [-U(34), -U(34)], fr = [U(34), -U(34)], br = [U(34), U(34)], bl = [-U(34), U(34)];
    const Fl = [fl[0] + U(20), fl[1] - U(16)], Fr = [fr[0] + U(20), fr[1] - U(16)];
    const Br = [br[0] + U(20), br[1] - U(16)];
    quad(g, [fr, Fr, Br, br], mix(P.white, '#1e2748', 0.20), { top: 0.02, bot: 0.1 });
    quad(g, [fl, fr, Fr, Fl], mix(P.white, '#ffffff', 0.4), { top: 0.05, bot: 0.0 });
    A.rr(g, fl[0], fl[1], U(68), U(68), U(12));
    const gr = g.createLinearGradient(fl[0], fl[1], fr[0], br[1]);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#e7ecf6');
    g.fillStyle = gr; g.fill();
    (PIPS[face] || PIPS[3]).forEach((p) => {
      W.orb(g, p[0] * U(17), p[1] * U(17), U(7), U(7), P.ink, { gloss: 0.3, shade: 0.2 });
    });
    g.restore();
  };
  /* a polaroid frame — the film drops real photos into these */
  W.polaroid = function (g, x, y, w, rot, img, caption, t) {
    const h = w * 0.78, pad = w * 0.055;
    g.save();
    g.translate(x, y); g.rotate(rot || 0);
    W.cast(g, 0, h / 2 + 22, w * 0.5, 16, 0.22);
    A.rr(g, -w / 2, -h / 2 - pad, w, h + pad * 4.2, 8);
    const pg = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#f0f2f6');
    g.fillStyle = pg; g.fill();
    g.save();
    A.rr(g, -w / 2 + pad, -h / 2, w - pad * 2, h, 4); g.clip();
    if (img && img.complete && img.naturalWidth) {
      const iw = w - pad * 2, ih = h;
      const sc = Math.max(iw / img.naturalWidth, ih / img.naturalHeight) * (1 + 0.05 * Math.sin((t || 0) * 0.5));
      const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
      g.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
      g.fillStyle = '#eef5fb'; g.fillRect(-w / 2, -h / 2, w, h);
      A.text(g, '📷', 0, -h * 0.04, w * 0.19, { color: '#a9c3d8' });
      g.setLineDash([12, 10]);
      A.rr(g, -w / 2 + w * 0.06, -h / 2 + h * 0.07, w * 0.88, h * 0.86, 10);
      g.strokeStyle = '#c3d8e8'; g.lineWidth = 4; g.stroke();
      g.setLineDash([]);
    }
    g.restore();
    A.rr(g, -w / 2 + pad, -h / 2, w - pad * 2, h, 4);
    g.strokeStyle = 'rgba(22,37,92,.14)'; g.lineWidth = 3; g.stroke();
    if (caption) A.text(g, caption, 0, h / 2 + pad * 2.1, w * 0.072, { color: P.inkSoft });
    g.restore();
  };
  /* the sensory wall at the carnival — rings of sound pressing in */
  W.noise = function (g, x, y, t, strength) {
    g.save();
    for (let i = 0; i < 7; i++) {
      const ph = ((t * 0.5 + i / 7) % 1);
      const r = 90 + ph * 760;
      g.globalAlpha = (1 - ph) * 0.5 * strength;
      A.ell(g, x, y, r, r * 0.82);
      g.strokeStyle = '#f2705f'; g.lineWidth = 14 * (1 - ph) + 3; g.stroke();
    }
    g.restore();
  };
  W.bouncy = function (g, x, y, s, t) {
    const U = (v) => v * s;
    const b = 1 + Math.sin((t || 0) * 2.4) * 0.018;
    g.save();
    g.translate(x, y); g.scale(b, b); g.translate(-x, -y);
    W.cast(g, x, y + U(8), U(240), U(30));
    for (let i = 0; i < 4; i++) {
      W.box(g, x - U(158) + i * U(100), y - U(120), U(64), U(184), 0.16 * s, P.rainbow[i % P.rainbow.length]);
    }
    W.box(g, x, y, U(420), U(120), 0.16 * s, '#6cc7f0', { top: 0.18 });
    A.rr(g, x - U(120), y - U(340), U(240), U(56), U(24)); A.shape(g, '#ffd43b', U(7));
    A.text(g, T('BOUNCE', 'BRINCA'), x, y - U(312), U(30));
    quad(g, [[x - U(74), y - U(120)], [x + U(74), y - U(120)], [x + U(74), y], [x - U(74), y]],
         '#2b3a56', { top: 0.05, bot: 0.3 });
    g.restore();
  };
  W.lights = function (g, x1, y1, x2, y2, n, t) {
    g.save();
    g.beginPath(); g.moveTo(x1, y1);
    g.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 70, x2, y2);
    g.strokeStyle = 'rgba(22,37,92,.45)'; g.lineWidth = 4; g.stroke();
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const px = A.lerp(A.lerp(x1, (x1 + x2) / 2, u), A.lerp((x1 + x2) / 2, x2, u), u);
      const py = A.lerp(A.lerp(y1, Math.max(y1, y2) + 70, u), A.lerp(Math.max(y1, y2) + 70, y2, u), u);
      const on = 0.55 + 0.45 * Math.sin(t * 3 + i * 0.9);
      const col = P.rainbow[i % P.rainbow.length];
      g.save(); g.globalAlpha = on * 0.5;
      const gr = g.createRadialGradient(px, py + 12, 2, px, py + 12, 34);
      gr.addColorStop(0, col); gr.addColorStop(1, A.alpha(col, 0));
      g.fillStyle = gr; A.ell(g, px, py + 12, 34, 34); g.fill(); g.restore();
      g.globalAlpha = on;
      W.orb(g, px, py + 12, 11, 13, col, { gloss: 0.55, shade: 0.15 });
    }
    g.restore();
  };
  W.slide = function (g, x, y, s) {
    const U = (v) => v * s;
    g.save();
    W.cast(g, x, y + U(4), U(120), U(16));
    W.box(g, x - U(83), y, U(14), U(190), 0.06 * s, '#9aa6bd');
    W.box(g, x - U(33), y, U(14), U(190), 0.06 * s, '#9aa6bd');
    g.beginPath();
    g.moveTo(x - U(96), y - U(190)); g.lineTo(x - U(20), y - U(190));
    g.quadraticCurveTo(x + U(90), y - U(150), x + U(110), y - U(16));
    g.lineTo(x + U(66), y - U(16));
    g.quadraticCurveTo(x + U(50), y - U(130), x - U(20), y - U(160));
    g.lineTo(x - U(96), y - U(160)); g.closePath();
    const gr = g.createLinearGradient(x - U(96), y - U(190), x + U(110), y);
    gr.addColorStop(0, mix('#f5b23c', '#ffffff', 0.3)); gr.addColorStop(1, mix('#f5b23c', '#1e2748', 0.18));
    g.fillStyle = gr; g.fill();
    g.restore();
  };
  /* a calendar page that can fly off */
  W.calPage = function (g, x, y, s, label, rot, a) {
    const U = (v) => v * s;
    g.save();
    if (a !== undefined) g.globalAlpha *= a;
    g.translate(x, y); g.rotate(rot || 0);
    g.shadowColor = 'rgba(26,34,70,.20)'; g.shadowBlur = 18; g.shadowOffsetY = 7;
    A.rr(g, -U(70), -U(84), U(140), U(168), U(12)); g.fillStyle = P.white; g.fill();
    g.shadowColor = 'transparent';
    A.rr(g, -U(70), -U(84), U(140), U(40), U(12));
    const gr = g.createLinearGradient(0, -U(84), 0, -U(44));
    gr.addColorStop(0, mix('#f2705f', '#ffffff', 0.2)); gr.addColorStop(1, '#f2705f');
    g.fillStyle = gr; g.fill();
    A.text(g, label, 0, U(22), U(48), { color: P.ink });
    g.restore();
  };

  /* ══════════════════════════════════════════════════════ MOUNTAIN HOUSE */
  /* The town itself is a character in this film: flat, wide, brand-new, with
     the golden Altamont hills and their wind turbines on the western horizon,
     and wind through absolutely everything.

     The hills are drawn as three ridges, each hazier and bluer than the one
     in front of it. Aerial perspective — colour fading with distance — does
     as much for depth as any amount of geometry. */
  W.hills = function (g, y, t, o) {
    o = o || {};
    const back = o.back || '#d8c98a', front = o.front || '#c4b16c';
    g.save();
    // furthest ridge, nearly the colour of the sky
    A.blob(g, [[-260, y - 20], [280, y - 130], [700, y - 86], [1180, y - 150],
               [1620, y - 96], [2180, y - 140], [2180, y + 260], [-260, y + 260]]);
    g.fillStyle = mix(back, '#dceaff', 0.52); g.fill();
    // far ridge
    A.blob(g, [[-260, y + 40], [180, y - 96], [520, y - 46], [880, y - 120],
               [1240, y - 60], [1620, y - 126], [2180, y - 40], [2180, y + 260], [-260, y + 260]]);
    const bg = g.createLinearGradient(0, y - 130, 0, y + 120);
    bg.addColorStop(0, mix(back, '#ffffff', 0.18)); bg.addColorStop(1, mix(back, '#dceaff', 0.22));
    g.fillStyle = bg; g.fill();
    // near ridge
    A.blob(g, [[-260, y + 110], [300, y + 10], [700, y + 62], [1100, y - 6],
               [1500, y + 56], [2180, y + 20], [2180, y + 300], [-260, y + 300]]);
    const fg = g.createLinearGradient(0, y - 20, 0, y + 200);
    fg.addColorStop(0, mix(front, '#ffffff', 0.16)); fg.addColorStop(1, mix(front, '#6a5e38', 0.18));
    g.fillStyle = fg; g.fill();
    g.restore();
    if (o.turbines !== false) {
      const spots = [[210, -92], [470, -52], [760, -104], [1010, -58], [1330, -70], [1660, -110], [1850, -54]];
      spots.forEach((sp, i) => W.turbine(g, sp[0], y + sp[1], o.tScale || 0.62, (t || 0) + i * 0.7, i));
    }
  };

  W.turbine = function (g, x, y, s, t, i) {
    const U = (v) => v * s;
    g.save();
    g.globalAlpha *= 0.94;
    g.beginPath();
    g.moveTo(x - U(7), y); g.lineTo(x - U(3.4), y - U(150));
    g.lineTo(x + U(3.4), y - U(150)); g.lineTo(x + U(7), y);
    g.closePath();
    const gr = g.createLinearGradient(x - U(7), 0, x + U(7), 0);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dbe3ee');
    g.fillStyle = gr; g.fill();
    W.orb(g, x, y - U(152), U(9), U(6), '#e6ebf4', { gloss: 0.4, shade: 0.2 });
    const spin = (t || 0) * (0.9 + A.rand(i || 0) * 0.25);
    for (let b = 0; b < 3; b++) {
      const a = spin + (b / 3) * TAU;
      g.save(); g.translate(x, y - U(152)); g.rotate(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(U(9), -U(52), U(4), -U(108));
      g.quadraticCurveTo(-U(2), -U(56), 0, 0);
      g.closePath();
      // the blade dims as it turns edge-on to us — the whole reason it reads as turning
      g.fillStyle = mix('#f7f9fc', '#9fb0c6', Math.abs(Math.sin(a)) * 0.35);
      g.fill();
      g.restore();
    }
    g.restore();
  };

  /* a Mountain House home: two storeys, stucco, tile roof, a garage and a
     porch — the houses on every street in town. Built as boxes, so the street
     opens up as the camera moves along it. */
  W.mhHouse = function (g, x, y, s, o) {
    o = o || {};
    const U = (v) => v * s;
    const wall = o.wall || '#fff1de', roof = o.roof || '#b06a54', trim = o.trim || '#ffffff';
    const d = 0.34 * s;
    g.save();
    W.cast(g, x, y + U(8), U(220), U(26));
    W.box(g, x, y, U(340), U(150), d, wall, { top: 0.12, bot: 0.10 });                       // ground floor
    W.box(g, x, y - U(146), U(300), U(126), d, mix(wall, '#ffffff', 0.22), { top: 0.14 });   // upper floor
    W.roof(g, x, y - U(266), U(352), U(78), d, roof);
    // porch roof and post
    quad(g, [[x - U(176), y - U(146)], [x - U(40), y - U(146)], [x - U(56), y - U(178)], [x - U(160), y - U(178)]],
         mix(roof, '#ffffff', 0.10), { top: 0.16, bot: 0.06 });
    W.box(g, x - U(163), y, U(11), U(146), 0.04 * s, trim);
    // garage
    W.box(g, x + U(88), y, U(128), U(116), 0.06 * s, '#e8e2d6', { top: 0.1 });
    g.strokeStyle = A.alpha(P.ink, 0.22); g.lineWidth = U(3);
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + U(24), y - U(116) + i * U(29)); g.lineTo(x + U(152), y - U(116) + i * U(29)); g.stroke(); }
    // front door
    A.rr(g, x - U(120), y - U(104), U(56), U(104), U(7));
    const dg = g.createLinearGradient(x - U(120), 0, x - U(64), 0);
    const dc = o.doorOpen ? '#2b3a56' : '#8d5a3b';
    dg.addColorStop(0, mix(dc, '#ffffff', 0.14)); dg.addColorStop(1, mix(dc, '#1e2748', 0.16));
    g.fillStyle = dg; g.fill();
    if (!o.doorOpen) W.orb(g, x - U(76), y - U(52), U(5), U(5), P.sun, { gloss: 0.6 });
    [[-52, -104], [-96, -216], [0, -216], [92, -216]].forEach((p) => {
      pane(g, x + U(p[0]), y + U(p[1]), U(52), U(52), o.lit);
    });
    if (o.tree !== false) W.saplin(g, x + U(196), y, s * 0.8, o.t || 0);
    g.restore();
  };

  W.saplin = function (g, x, y, s, t) {
    const U = (v) => v * s;
    const sway = Math.sin((t || 0) * 1.7 + x * 0.01) * 0.07;
    g.save();
    W.cast(g, x, y + U(2), U(38), U(10), 0.2);
    W.box(g, x, y, U(12), U(70), 0.03 * s, '#a3714c');
    g.translate(x, y - U(70)); g.rotate(sway); g.translate(-x, -(y - U(70)));
    W.orb(g, x - U(14), y - U(102), U(32), U(30), mix(P.grass, '#000000', 0.08));
    W.orb(g, x + U(16), y - U(112), U(30), U(28), P.grass);
    g.restore();
  };

  /* the library — where a lot of the gatherings actually happen */
  W.library = function (g, x, y, s, o) {
    o = o || {};
    const U = (v) => v * s, d = 0.30 * s;
    g.save();
    W.cast(g, x, y + U(8), U(340), U(28));
    W.box(g, x, y, U(560), U(210), d, '#f6e8cf', { top: 0.12 });
    W.roof(g, x, y - U(206), U(600), U(82), d, '#7f9bb8');
    A.rr(g, x - U(200), y - U(176), U(400), U(120), U(8));
    const gg = g.createLinearGradient(x - U(200), y - U(176), x + U(200), y - U(56));
    gg.addColorStop(0, '#e2f3ff'); gg.addColorStop(0.5, '#a9d6f2'); gg.addColorStop(1, '#d6eefd');
    g.fillStyle = gg; g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = U(4);
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - U(200) + i * U(100), y - U(176)); g.lineTo(x - U(200) + i * U(100), y - U(56)); g.stroke(); }
    A.rr(g, x - U(56), y - U(112), U(112), U(112), U(8)); A.shape(g, '#9ac3e0', U(6));
    A.rr(g, x - U(150), y - U(256), U(300), U(52), U(12)); A.shape(g, P.white, U(5));
    A.text(g, o.label || T('LIBRARY', 'BIBLIOTECA'), x, y - U(230), U(32));
    A.text(g, '📚', x - U(230), y - U(120), U(48), {});
    g.restore();
  };

  /* town hall, with the little cupola and a clock */
  W.townhall = function (g, x, y, s, o) {
    o = o || {};
    const U = (v) => v * s, d = 0.28 * s;
    g.save();
    W.cast(g, x, y + U(8), U(300), U(26));
    W.box(g, x, y, U(500), U(200), d, '#fff3e2', { top: 0.12 });
    W.roof(g, x, y - U(196), U(544), U(76), d, '#8d6a4a');
    [-160, -80, 80, 160].forEach((dx) => W.box(g, x + U(dx), y, U(32), U(180), 0.05 * s, P.white, { top: 0.2 }));
    A.rr(g, x - U(52), y - U(150), U(104), U(150), U(10)); A.shape(g, '#8d5a3b', 0);
    W.box(g, x, y - U(264), U(92), U(96), 0.10 * s, '#fff3e2');
    W.roof(g, x, y - U(356), U(116), U(68), 0.10 * s, '#8d6a4a');
    W.orb(g, x, y - U(312), U(30), U(30), P.white, { gloss: 0.3, shade: 0.16 });
    g.strokeStyle = P.ink; g.lineWidth = U(4); g.lineCap = 'round';
    const hr = (o.t || 0) * 0.2;
    g.beginPath(); g.moveTo(x, y - U(312)); g.lineTo(x + Math.sin(hr) * U(14), y - U(312) - Math.cos(hr) * U(14)); g.stroke();
    g.beginPath(); g.moveTo(x, y - U(312)); g.lineTo(x + Math.sin(hr * 12) * U(20), y - U(312) - Math.cos(hr * 12) * U(20)); g.stroke();
    W.box(g, x + U(304), y, U(8), U(300), 0.03 * s, '#9aa6bd');
    g.beginPath();
    g.moveTo(x + U(308), y - U(296));
    g.quadraticCurveTo(x + U(360), y - U(282) + Math.sin((o.t || 0) * 4) * U(8), x + U(408), y - U(292));
    g.lineTo(x + U(408), y - U(240));
    g.quadraticCurveTo(x + U(360), y - U(230) + Math.sin((o.t || 0) * 4) * U(8), x + U(308), y - U(244));
    g.closePath(); A.shape(g, '#5f8fc4', U(4));
    g.restore();
  };

  /* wind: this town is never still */
  W.wind = function (g, t, n, o) {
    o = o || {};
    g.save();
    const bits = ['🍃', '🍂'];
    for (let i = 0; i < (n || 14); i++) {
      const sp = 130 + A.rand(i * 2.3) * 220;
      const x = ((A.rand(i) * 2400) + t * sp) % 2400 - 240;
      const y = (o.y0 || 200) + A.rand(i * 5.9) * (o.span || 600) + Math.sin(t * 2 + i) * 26;
      g.save();
      g.globalAlpha = 0.65;
      g.translate(x, y); g.rotate(Math.sin(t * 3 + i) * 0.9);
      // it tumbles through depth: the leaf turns edge-on and thins out
      g.scale(Math.abs(Math.cos(t * 2.6 + i)) * 0.7 + 0.3, 1);
      A.text(g, bits[i % 2], 0, 0, 22 + A.rand(i * 7) * 16, {});
      g.restore();
    }
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const x = ((A.rand(i * 3.1) * 2400) + t * 420) % 2400 - 240;
      const y = (o.y0 || 200) + A.rand(i * 8.3) * (o.span || 600);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 70, y - 6); g.stroke();
    }
    g.restore();
  };

  /* the wide, brand-new Mountain House street: sidewalk, verge, saplings.
     The paving slabs run off toward the vanishing point rather than standing
     to attention, so walking along it is walking INTO something. */
  W.street = function (g, y, pan, t, o) {
    o = o || {};
    const sg = g.createLinearGradient(0, y, 0, y + 92);
    sg.addColorStop(0, mix('#cfd6e2', '#ffffff', 0.34)); sg.addColorStop(1, '#c3cbd9');
    g.fillStyle = sg; g.fillRect(-200, y, 2320, 92);
    g.fillStyle = A.alpha(P.ink, 0.09); g.fillRect(-200, y, 2320, 4);
    g.fillStyle = mix('#9ed68f', '#000000', 0.04); g.fillRect(-200, y + 92, 2320, 40);
    g.save(); g.strokeStyle = A.alpha(P.ink, 0.13); g.lineWidth = 4;
    for (let i = -1; i < 15; i++) {
      const x = i * 180 - ((pan || 0) % 180);
      g.beginPath(); g.moveTo(x, y + 92);
      g.lineTo(VP.x + (x - VP.x) * 0.80, y);
      g.stroke();
    }
    g.restore();
    if (o.saplings !== false) {
      for (let i = 0; i < 5; i++) {
        const x = ((i * 460 - (pan || 0) * 1.2) % 2400 + 2400) % 2400 - 240;
        W.saplin(g, x, y + 126, 1.0, t);
      }
    }
  };

  window.ABEProps = W;
})();
