/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   OUR FIRST YEAR — the 3D cast  (window.ABECast)

   The film used to draw its people as flat navy line art. This file replaces
   that with an actual three-dimensional cast: every character is built out of
   spheres and tapered capsules in 3D space, turned by a camera, depth-sorted,
   and shaded with a single key light — the soft, rounded, glossy-eyed look of
   a modelled toy.

   There is no WebGL here on purpose. The whole film hangs off one rule from
   film.js: renderAt(ms) must be a PURE function of the clock, so a script can
   step it frame by frame and get an identical picture every time. A tiny
   software renderer on the 2D canvas keeps that promise, keeps the export
   path working, and still runs on a school Chromebook.

   How it fits together:

     view      one shared camera. Move its yaw and the whole cast turns —
               that is where the 3D movement comes from.
     proj()    model space (character 100 units tall, feet at the origin,
               +Y up, +Z out of the screen) → screen pixels.
     ball()    an ellipsoid. Radial gradient toward the light, rim light on
               the far side. This is the workhorse.
     tube()    a tapered capsule between two 3D points — limbs, torsos,
               hair, trunks. Shaded across its axis like a cylinder.
     face()    a flat panel glued to a curved surface, correctly foreshortened
               and back-face culled, so eyes and mouths sit ON the head and
               slide away as it turns.

   Nothing in here keeps state between frames.

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const A = window.ABEArt, P = A.P;
  const C = {};
  const TAU = Math.PI * 2;
  const clamp = A.clamp, lerp = A.lerp, mix = A.mix;

  /* ═══════════════════════════════════════════════════════════════ THE VIEW
     One camera for everybody in the shot. A scene sets view.yaw and every
     character turns together — that single number is most of what makes the
     film read as three-dimensional rather than as sliding cut-outs. */
  const view = C.view = {
    yaw: 0,        // orbit around the cast, radians (+ swings the camera left)
    pitch: 0.055,  // looking very slightly down on them
    lens: 3.4,     // camera distance in body-heights: bigger = flatter, longer lens
    light: [-0.44, 0.74, 0.50],   // key light: up, and over the viewer's left shoulder
  };
  /* Scenes set the camera for a shot and put it back afterwards.
     Anything the caller LEAVES OUT goes back to the default rather than
     keeping whatever the last shot used. That matters more than it looks:
     film.js promises that renderAt(ms) is a pure function of the clock, and a
     view that quietly carried over from the previous chapter would make a
     frame depend on which frame was drawn before it — fine on playback,
     wrong the moment anybody scrubs or exports. */
  const VIEW0 = { yaw: 0, pitch: 0.055, lens: 3.4 };
  C.setView = function (o) {
    const keep = { yaw: view.yaw, pitch: view.pitch, lens: view.lens };
    o = o || {};
    view.yaw   = o.yaw   === undefined ? VIEW0.yaw   : o.yaw;
    view.pitch = o.pitch === undefined ? VIEW0.pitch : o.pitch;
    view.lens  = o.lens  === undefined ? VIEW0.lens  : o.lens;
    return keep;
  };

  /* screen-space direction of the key light (screen Y points down) */
  function lightScreen() {
    const L = view.light;
    const n = Math.hypot(L[0], L[1]) || 1;
    return [L[0] / n, -L[1] / n];
  }

  /* ════════════════════════════════════════════════════════════ SHADING */
  /* Toon-3D shading is two moves: warm the side facing the light, and cool
     the side away from it. Everything else is detail. */
  const litc = (col, a) => mix(col, '#fffdf6', a);
  const dimc = (col, a) => mix(col, '#2a2f52', a);
  C.lit = litc; C.dim = dimc;

  /* ═══════════════════════════════════════════════════════════ THE CANVAS
     A frame is: build a draw list, sort it back-to-front, run it. Painter's
     algorithm — plenty for characters, where the parts are convex blobs. */
  function Kit(g, ctx) {
    const list = [];
    return {
      g: g,
      ctx: ctx,
      add: function (z, fn) { list.push({ z: z, fn: fn, i: list.length }); },
      flush: function () {
        list.sort((a, b) => (a.z - b.z) || (a.i - b.i));
        for (let i = 0; i < list.length; i++) list[i].fn(g);
        list.length = 0;
      },
    };
  }

  /* ─────────────────────────────────────────────────────────── projection */
  /* ctx carries everything a projection needs: where the feet are on screen,
     how many pixels tall the figure is, which way it faces, and whether it is
     mirrored. Model units: 100 = the character's full height. */
  function makeCtx(o) {
    const S = o.scale;                       // pixels per model unit
    const turn = (o.turn || 0) + view.yaw;
    const mir = o.flip ? -1 : 1;
    const D = 100 * view.lens;               // camera distance, model units
    return {
      S: S, ox: o.x, oy: o.y, mir: mir,
      ca: Math.cos(turn), sa: Math.sin(turn),
      cb: Math.cos(view.pitch), sb: Math.sin(view.pitch),
      turn: turn, D: D, zOff: o.z || 0,
    };
  }

  /* model point → { x, y, z, f }. z is camera depth (bigger = nearer). */
  function proj(c, p) {
    const mx = p[0] * c.mir;
    const x1 = mx * c.ca + p[2] * c.sa;
    const z1 = -mx * c.sa + p[2] * c.ca + c.zOff;
    const y1 = p[1];
    const y2 = y1 * c.cb - z1 * c.sb;
    const z2 = y1 * c.sb + z1 * c.cb;
    const f = c.D / Math.max(c.D - z2, c.D * 0.25);
    return { x: c.ox + x1 * f * c.S, y: c.oy - y2 * f * c.S, z: z2, f: f };
  }
  C.proj = proj;

  /* the silhouette radius of an ellipse-sectioned solid, once it has turned:
     wide from the front, narrow from the side, and everything in between */
  function turnR(c, w, d) {
    const a = c.ca, b = c.sa;
    return Math.sqrt((w * a) * (w * a) + (d * b) * (d * b));
  }

  /* ══════════════════════════════════════════════════════════════ BALL
     An ellipsoid: the head, a shoulder, a cheek, a hand, an ear, a bun of
     hair. r is a half-size [width, height, depth] or one number. */
  function ball(K, p, r, col, o) {
    o = o || {};
    const c = K.ctx, g = K.g;
    const rw = (r.length ? r[0] : r), rh = (r.length ? r[1] : r), rd = (r.length ? r[2] : r);
    const q = proj(c, p);
    const rx = turnR(c, rw, rd) * q.f * c.S;
    const ry = Math.sqrt(Math.pow(rh * c.cb, 2) + Math.pow(turnR(c, rd, rw) * c.sb, 2)) * q.f * c.S;
    if (rx < 0.2 || ry < 0.2) return q;
    const L = lightScreen();
    const alpha = o.alpha === undefined ? 1 : o.alpha;
    const zBias = o.zBias || 0;
    const clipY = o.clipY;
    K.add(q.z + zBias, function (g) {
      g.save();
      if (alpha < 1) g.globalAlpha *= alpha;
      /* A hairline. Hair modelled as a plain ellipsoid always leaves a seam
         where it meets the mass behind it; cutting the front mass off along a
         soft curve instead is what actually reads as a fringe. */
      if (clipY !== undefined) {
        g.beginPath();
        g.moveTo(q.x - rx * 1.6, q.y - ry * 2.0);
        g.lineTo(q.x + rx * 1.6, q.y - ry * 2.0);
        g.lineTo(q.x + rx * 1.6, clipY - ry * 0.16);
        g.quadraticCurveTo(q.x, clipY + ry * 0.22, q.x - rx * 1.6, clipY - ry * 0.16);
        g.closePath();
        g.clip();
      }
      const big = Math.max(rx, ry);
      const gr = g.createRadialGradient(
        q.x + L[0] * rx * 0.46, q.y + L[1] * ry * 0.46, big * 0.05,
        q.x + L[0] * rx * 0.10, q.y + L[1] * ry * 0.10, big * 1.12);
      gr.addColorStop(0, litc(col, o.gloss === undefined ? 0.40 : o.gloss));
      gr.addColorStop(0.36, litc(col, 0.13));
      gr.addColorStop(0.72, col);
      gr.addColorStop(1, dimc(col, o.shade === undefined ? 0.30 : o.shade));
      A.ell(g, q.x, q.y, rx, ry, o.rot || 0);
      g.fillStyle = gr; g.fill();
      // rim light: a bright sliver on the edge the key light cannot reach
      if (o.rim !== false) {
        const rg = g.createRadialGradient(
          q.x - L[0] * rx * 0.30, q.y - L[1] * ry * 0.30, big * 0.54,
          q.x - L[0] * rx * 0.30, q.y - L[1] * ry * 0.30, big * 1.04);
        rg.addColorStop(0, 'rgba(255,255,255,0)');
        rg.addColorStop(0.80, 'rgba(255,255,255,0)');
        rg.addColorStop(1, 'rgba(255,255,255,' + (o.rim === undefined ? 0.34 : o.rim) + ')');
        g.fillStyle = rg; g.fill();
      }
      if (o.ink) {
        g.strokeStyle = A.alpha(P.ink, o.ink);
        g.lineWidth = Math.max(1, big * 0.045); g.stroke();
      }
      g.restore();
    });
    return q;
  }

  /* ══════════════════════════════════════════════════════════════ TUBE
     A tapered capsule from p1 to p2: an arm, a thigh, a torso, a plait, a
     trunk. Shaded across the axis, so it reads as a cylinder. */
  function tube(K, p1, r1, p2, r2, col, o) {
    o = o || {};
    const c = K.ctx;
    const q1 = proj(c, p1), q2 = proj(c, p2);
    const w1 = r1.length ? r1[0] : r1, d1 = r1.length ? r1[1] : r1;
    const w2 = r2.length ? r2[0] : r2, d2 = r2.length ? r2[1] : r2;
    const R1 = turnR(c, w1, d1) * q1.f * c.S;
    const R2 = turnR(c, w2, d2) * q2.f * c.S;
    if (R1 < 0.2 && R2 < 0.2) return;
    const L = lightScreen();
    const alpha = o.alpha === undefined ? 1 : o.alpha;
    const z = (q1.z + q2.z) / 2 + (o.zBias || 0);
    K.add(z, function (g) {
      g.save();
      if (alpha < 1) g.globalAlpha *= alpha;
      const dx = q2.x - q1.x, dy = q2.y - q1.y;
      const len = Math.hypot(dx, dy);
      if (len <= Math.abs(R1 - R2) + 0.01) {
        const big = R1 > R2;
        A.ell(g, big ? q1.x : q2.x, big ? q1.y : q2.y, Math.max(R1, R2), Math.max(R1, R2));
      } else {
        const ang = Math.atan2(dy, dx);
        const spread = Math.acos(clamp((R1 - R2) / len, -1, 1));
        g.beginPath();
        g.arc(q1.x, q1.y, R1, ang + spread, ang - spread);
        g.arc(q2.x, q2.y, R2, ang - spread, ang + spread);
        g.closePath();
      }
      // across-the-axis gradient, running from the lit edge to the dark one
      let px = -dy / (len || 1), py = dx / (len || 1);
      if (px * L[0] + py * L[1] < 0) { px = -px; py = -py; }
      const mx = (q1.x + q2.x) / 2, my = (q1.y + q2.y) / 2;
      const rad = Math.max(R1, R2);
      const gr = g.createLinearGradient(mx + px * rad, my + py * rad, mx - px * rad, my - py * rad);
      gr.addColorStop(0, litc(col, o.gloss === undefined ? 0.34 : o.gloss));
      gr.addColorStop(0.30, litc(col, 0.10));
      gr.addColorStop(0.66, col);
      gr.addColorStop(0.94, dimc(col, o.shade === undefined ? 0.28 : o.shade));
      gr.addColorStop(1, litc(dimc(col, 0.22), o.rim === undefined ? 0.26 : o.rim));
      g.fillStyle = gr; g.fill();
      if (o.ink) {
        g.strokeStyle = A.alpha(P.ink, o.ink);
        g.lineWidth = Math.max(1, rad * 0.09); g.stroke();
      }
      g.restore();
    });
  }

  /* ══════════════════════════════════════════════════════════════ FACE
     A flat panel glued to a curved surface. Hand it a point and the two
     surface directions ("right" and "down" across the skin) and it hands your
     callback a 2D canvas in model units, already foreshortened by the turn of
     the head — and skipped entirely once the surface points away.

     This is what lets an eye sit ON a head instead of floating in front of
     one: turn the head and the eye slides, squashes and disappears. */
  function panel(K, p, right, down, o, fn) {
    o = o || {};
    const c = K.ctx;
    const e = 0.5;
    const q0 = proj(c, p);
    const qr = proj(c, [p[0] + right[0] * e, p[1] + right[1] * e, p[2] + right[2] * e]);
    const qd = proj(c, [p[0] + down[0] * e, p[1] + down[1] * e, p[2] + down[2] * e]);
    const m11 = (qr.x - q0.x) / e, m12 = (qr.y - q0.y) / e;
    const m21 = (qd.x - q0.x) / e, m22 = (qd.y - q0.y) / e;
    // the panel has turned away when its basis flips over
    const det = (m11 * m22 - m12 * m21) * c.mir;
    if (det <= (o.cull === undefined ? 0.0 : o.cull)) return;
    const z = q0.z + (o.zBias === undefined ? 0.35 : o.zBias);
    K.add(z, function (g) {
      g.save();
      if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
      g.transform(m11, m12, m21, m22, q0.x, q0.y);
      fn(g);
      g.restore();
    });
  }

  /* the point on an ellipsoid in a given direction, and the two surface
     directions there — everything the face needs to hang things on a head */
  function onSurface(centre, rad, dir) {
    const n = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    const u = [dir[0] / n, dir[1] / n, dir[2] / n];
    const p = [centre[0] + u[0] * rad[0], centre[1] + u[1] * rad[1], centre[2] + u[2] * rad[2]];
    // "right" across the surface: horizontal, perpendicular to the normal
    let r = [u[2], 0, -u[0]];
    let rl = Math.hypot(r[0], r[1], r[2]);
    if (rl < 1e-4) { r = [1, 0, 0]; rl = 1; }
    r = [r[0] / rl, r[1] / rl, r[2] / rl];
    // "down" across the surface: normal × right
    const d = [
      u[1] * r[2] - u[2] * r[1],
      u[2] * r[0] - u[0] * r[2],
      u[0] * r[1] - u[1] * r[0],
    ];
    return { p: p, right: r, down: [-d[0], -d[1], -d[2]], n: u };
  }

  C.Kit = Kit; C.ball = ball; C.tube = tube; C.panel = panel;
  C.onSurface = onSurface; C.makeCtx = makeCtx; C.turnR = turnR;

  window.ABECast = C;
})();

/* ═══════════════════════════════════════════════════════════════ THE HEAD
   Everyone in this film shares one head. Change the skin, the hair and the
   eye colour and you get a different person; keep the geometry identical and
   they all belong in the same film. That is the whole trick behind "make the
   others look like they fit".

   The look comes from the reference art: a big rounded skull, a soft jaw,
   large glossy eyes with a bright catchlight, thick simple brows, a button
   nose, and warm cheeks.                                                     */
(function () {
  "use strict";
  const A = window.ABEArt, C = window.ABECast, P = A.P;
  const ball = C.ball, tube = C.tube, panel = C.panel, onSurface = C.onSurface;
  const clamp = A.clamp, lerp = A.lerp, mix = A.mix;

  /* skin tones for the ensemble — the town in this story is not one colour */
  const SKINS = C.SKINS = {
    fair:   '#f8d2b4', light: '#f5c49f', warm:  '#eab288',
    tan:    '#d9975f', brown: '#b6764a', deep:  '#8a5636', dark: '#6b4028',
  };
  const skinShadow = (s) => mix(s, '#8a4a34', 0.30);

  /* ── the eye ─────────────────────────────────────────────────────────── */
  /* Drawn flat on the surface of the skull, in model units. The catchlight is
     doing most of the work: it is the difference between a painted dot and
     something with a wet, rounded surface. */
  function drawEye(g, o) {
    const ew = o.w, eh = o.h, side = o.side;
    const shut = o.shut;
    if (shut) {
      g.save();
      g.strokeStyle = '#3a2a28'; g.lineWidth = eh * 0.30; g.lineCap = 'round';
      g.beginPath();
      if (o.happyShut) {              // an eye creased upward by a real smile
        g.moveTo(-ew * 0.86, eh * 0.22);
        g.quadraticCurveTo(0, -eh * 0.74, ew * 0.86, eh * 0.22);
      } else {
        g.moveTo(-ew * 0.86, -eh * 0.06);
        g.quadraticCurveTo(0, eh * 0.62, ew * 0.86, -eh * 0.06);
      }
      g.stroke();
      if (o.lashes) {
        g.lineWidth = eh * 0.17;
        for (let i = 0; i < 3; i++) {
          const a = -0.5 + i * 0.34;
          const lx = side * ew * (0.70 + i * 0.09), ly = (o.happyShut ? 0.06 : -0.02) * eh;
          g.beginPath(); g.moveTo(lx, ly);
          g.lineTo(lx + side * Math.cos(a) * ew * 0.36, ly - Math.sin(a + 0.55) * eh * 0.44);
          g.stroke();
        }
      }
      g.restore();
      return;
    }
    const wide = o.wide ? 1.18 : 1;
    const rx = ew, ry = eh * wide;
    g.save();
    // the white — very slightly blue in the shadow of the brow
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    const wg = g.createLinearGradient(0, -ry, 0, ry);
    wg.addColorStop(0, '#dfe4ee'); wg.addColorStop(0.42, '#ffffff'); wg.addColorStop(1, '#f2f0f4');
    g.fillStyle = wg; g.fill();
    // iris
    const ir = ry * (o.wide ? 0.80 : 0.88);
    const gx = (o.gazeX || 0) * (rx - ir) , gy = (o.gazeY || 0) * (ry - ir);
    g.save();
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.clip();
    const ig = g.createRadialGradient(gx - ir * 0.25, gy - ir * 0.35, ir * 0.1, gx, gy, ir * 1.05);
    ig.addColorStop(0, mix(o.iris, '#ffffff', 0.34));
    ig.addColorStop(0.62, o.iris);
    ig.addColorStop(1, mix(o.iris, '#1a1008', 0.55));
    g.beginPath(); g.ellipse(gx, gy, ir, ir, 0, 0, Math.PI * 2);
    g.fillStyle = ig; g.fill();
    g.beginPath(); g.ellipse(gx, gy + ir * 0.06, ir * 0.50, ir * 0.50, 0, 0, Math.PI * 2);
    g.fillStyle = '#17110e'; g.fill();
    // the catchlights — one big, one small, always from the same key light
    g.beginPath(); g.ellipse(gx - ir * 0.36, gy - ir * 0.40, ir * 0.30, ir * 0.30, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,.96)'; g.fill();
    g.beginPath(); g.ellipse(gx + ir * 0.34, gy + ir * 0.38, ir * 0.15, ir * 0.15, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,.66)'; g.fill();
    // the lid casts a soft shadow across the top of the eye
    g.beginPath(); g.ellipse(0, -ry * 1.06, rx * 1.1, ry * 0.72, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(60,40,45,.20)'; g.fill();
    g.restore();
    // the lash line: thick on top, barely there underneath
    g.strokeStyle = '#3a2a28'; g.lineCap = 'round';
    g.lineWidth = ry * 0.24;
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI * 1.06, Math.PI * 1.94); g.stroke();
    if (o.lashes) {
      g.lineWidth = ry * 0.17;
      for (let i = 0; i < 3; i++) {
        const a = -0.42 + i * 0.30;
        const lx = side * rx * (0.62 + i * 0.12), ly = -ry * (0.72 - i * 0.14);
        g.beginPath(); g.moveTo(lx, ly);
        g.lineTo(lx + side * Math.cos(a) * rx * 0.40, ly - Math.sin(a + 0.5) * ry * 0.52);
        g.stroke();
      }
    }
    g.restore();
    if (o.tear) {
      g.save();
      const tv = o.tear % 1;
      g.beginPath(); g.ellipse(side * rx * 0.3, ry * (0.9 + tv * 2.6), rx * 0.24, ry * 0.42, 0, 0, Math.PI * 2);
      g.fillStyle = 'rgba(130,200,240,.92)'; g.fill();
      g.restore();
    }
  }

  /* ── the mouth ───────────────────────────────────────────────────────── */
  function drawMouth(g, o) {
    const w = o.w, h = o.h, k = o.kind;
    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    const lip = '#9c4a4e';
    if (k === 'open' || k === 'teeth' || k === 'gasp' || k === 'sing') {
      const ow = k === 'gasp' ? w * 0.52 : k === 'sing' ? w * 0.46 : w * 0.86;
      const oh = k === 'gasp' ? h * 1.45 : k === 'sing' ? h * 1.6 : h * 1.05;
      g.beginPath(); g.ellipse(0, oh * 0.18, ow, oh, 0, 0, Math.PI * 2);
      g.fillStyle = '#7d3540'; g.fill();
      g.save();
      g.beginPath(); g.ellipse(0, oh * 0.18, ow, oh, 0, 0, Math.PI * 2); g.clip();
      if (k === 'teeth' || k === 'open') {      // upper teeth, the smile of the refs
        g.beginPath(); g.ellipse(0, -oh * 0.72, ow * 1.02, oh * 0.86, 0, 0, Math.PI * 2);
        g.fillStyle = '#fffdf8'; g.fill();
      }
      // tongue
      g.beginPath(); g.ellipse(0, oh * 1.10, ow * 0.66, oh * 0.62, 0, 0, Math.PI * 2);
      g.fillStyle = '#d9707c'; g.fill();
      g.restore();
      g.strokeStyle = lip; g.lineWidth = h * 0.24;
      g.beginPath(); g.ellipse(0, oh * 0.18, ow, oh, 0, 0, Math.PI * 2); g.stroke();
    } else if (k === 'frown') {
      g.strokeStyle = lip; g.lineWidth = h * 0.42;
      g.beginPath(); g.moveTo(-w * 0.58, h * 0.34);
      g.quadraticCurveTo(0, -h * 0.42, w * 0.58, h * 0.34); g.stroke();
    } else if (k === 'flat') {
      g.strokeStyle = lip; g.lineWidth = h * 0.40;
      g.beginPath(); g.moveTo(-w * 0.46, 0); g.quadraticCurveTo(0, h * 0.14, w * 0.46, 0); g.stroke();
    } else {                                   // a closed, contented smile
      const sw = k === 'wide' ? 0.78 : 0.58;
      g.strokeStyle = lip; g.lineWidth = h * 0.42;
      g.beginPath(); g.moveTo(-w * sw, -h * 0.18);
      g.quadraticCurveTo(0, h * (k === 'wide' ? 0.95 : 0.66), w * sw, -h * 0.18);
      g.stroke();
    }
    g.restore();
  }

  /* ── expressions ─────────────────────────────────────────────────────── */
  /* one table, so a scene only ever says a word like "bliss" */
  const EXPR = {
    happy:  { mouth: 'smile',  brow: 0,     lift: 0,     shut: 0 },
    bliss:  { mouth: 'teeth',  brow: 0.06,  lift: 0.10,  shut: 1, happyShut: 1 },
    calm:   { mouth: 'smile',  brow: 0.02,  lift: 0,     shut: 0 },
    flat:   { mouth: 'flat',   brow: 0,     lift: 0,     shut: 0 },
    worry:  { mouth: 'frown',  brow: 0.30,  lift: 0.16,  shut: 0 },
    sad:    { mouth: 'frown',  brow: 0.34,  lift: 0.18,  shut: 0 },
    cry:    { mouth: 'open',   brow: 0.36,  lift: 0.18,  shut: 0, tear: 1 },
    wow:    { mouth: 'gasp',   brow: -0.06, lift: 0.26,  shut: 0, wide: 1 },
    scared: { mouth: 'gasp',   brow: 0.30,  lift: 0.24,  shut: 0, wide: 1 },
    sing:   { mouth: 'sing',   brow: 0,     lift: 0.12,  shut: 0 },
    sleep:  { mouth: 'flat',   brow: 0.10,  lift: 0,     shut: 1 },
    cross:  { mouth: 'flat',   brow: -0.34, lift: -0.08, shut: 0 },
    wide:   { mouth: 'wide',   brow: 0,     lift: 0.06,  shut: 0 },
  };
  C.EXPR = EXPR;

  /* ── the head, assembled ─────────────────────────────────────────────── */
  /* cy is the centre of the skull in model units; R is [width, height, depth] */
  C.head = function (K, cy, R, o) {
    o = o || {};
    const skin = o.skin || SKINS.light;
    const ex = EXPR[o.expr] || EXPR.happy;
    const shut = ex.shut || (o.blink > 0.55 ? 1 : 0);
    const happyShut = ex.happyShut && ex.shut;
    const centre = [0, cy, 0];
    const HW = R[0], HH = R[1], HD = R[2];

    // skull, then the softer mass of the jaw and cheeks in front of it
    ball(K, centre, [HW, HH, HD], skin, { gloss: 0.30, shade: 0.26, rim: 0.30 });
    ball(K, [0, cy - HH * 0.40, HD * 0.10], [HW * 0.80, HH * 0.62, HD * 0.84], skin,
         { gloss: 0.26, shade: 0.22, rim: 0.18 });
    // ears
    [-1, 1].forEach((sx) => {
      ball(K, [sx * HW * 0.94, cy - HH * 0.10, -HD * 0.26],
           [HW * 0.11, HH * 0.19, HD * 0.16], skin, { gloss: 0.22, shade: 0.30, rim: 0.2 });
      ball(K, [sx * HW * 0.98, cy - HH * 0.10, -HD * 0.22],
           [HW * 0.05, HH * 0.11, HD * 0.08], mix(skin, '#8a4a34', 0.20),
           { gloss: 0.1, shade: 0.2, rim: 0 });
    });

    // brows — thick, simple, and the single biggest carrier of mood
    [-1, 1].forEach((sx) => {
      const s = onSurface(centre, [HW, HH, HD], [sx * 0.46, 0.30 + ex.lift * 0.5, 0.86]);
      panel(K, s.p, s.right, s.down, { zBias: 0.4 }, function (g) {
        g.save();
        g.rotate(sx * ex.brow);
        g.strokeStyle = o.browCol || '#4a3020';
        g.lineWidth = HH * 0.13; g.lineCap = 'round';
        g.beginPath();
        g.moveTo(-sx * HW * 0.22, HH * 0.04);
        g.quadraticCurveTo(0, -HH * 0.09, sx * HW * 0.24, HH * 0.02);
        g.stroke();
        g.restore();
      });
    });

    // eyes
    [-1, 1].forEach((sx) => {
      const s = onSurface(centre, [HW, HH, HD], [sx * 0.44, 0.06, 0.86]);
      panel(K, s.p, s.right, s.down, { zBias: 0.4 }, function (g) {
        drawEye(g, {
          w: HW * 0.29, h: HH * 0.25, side: sx, iris: o.iris || '#6b4326',
          shut: shut, happyShut: happyShut, wide: ex.wide, lashes: o.lashes,
          gazeX: (o.gazeX || 0) * sx * 0 + (o.gazeX || 0), gazeY: o.gazeY || 0,
          tear: (ex.tear || o.tear) ? (o.tear || 0.3) : 0,
        });
      });
    });

    // the button nose, a real little ball of skin with its own highlight
    ball(K, [0, cy - HH * 0.10, HD * 0.90], [HW * 0.13, HH * 0.115, HD * 0.16],
         mix(skin, '#e8907a', 0.16), { gloss: 0.42, shade: 0.24, rim: 0.1, zBias: 0.2 });

    // mouth
    {
      const s = onSurface(centre, [HW, HH, HD], [0, -0.46, 0.88]);
      panel(K, s.p, s.right, s.down, { zBias: 0.5 }, function (g) {
        drawMouth(g, { w: HW * 0.42, h: HH * 0.17, kind: ex.mouth });
      });
    }

    // cheeks
    if (o.blush !== false) {
      [-1, 1].forEach((sx) => {
        const s = onSurface(centre, [HW, HH, HD], [sx * 0.72, -0.24, 0.66]);
        panel(K, s.p, s.right, s.down, { zBias: 0.3 }, function (g) {
          const gr = g.createRadialGradient(0, 0, 0, 0, 0, HW * 0.26);
          const a = o.blush ? 0.42 : 0.20;
          gr.addColorStop(0, 'rgba(240,130,140,' + a + ')');
          gr.addColorStop(1, 'rgba(240,130,140,0)');
          g.beginPath(); g.ellipse(0, 0, HW * 0.26, HH * 0.17, 0, 0, Math.PI * 2);
          g.fillStyle = gr; g.fill();
        });
      });
    }
    return { cy: cy, R: R, skin: skin };
  };
})();

/* ═══════════════════════════════════════════════════════════════ THE HAIR
   Hair is what tells two people apart once everything else about them is
   shared, so it gets built out of real volumes rather than painted on: a mass
   over the skull, then strands that hang, sweep or bounce in front of it.
   Depth sorting does the rest — a plait behind the head is hidden by the
   head, the same plait swung forward is not.                                 */
(function () {
  "use strict";
  const A = window.ABEArt, C = window.ABECast;
  const ball = C.ball, tube = C.tube;
  const mix = A.mix;

  /* the mass that sits over the skull; every style starts from this */
  function crown(K, cy, R, col, o) {
    o = o || {};
    const HW = R[0], HH = R[1], HD = R[2];
    const g = o.grow === undefined ? 1.07 : o.grow;
    ball(K, [0, cy + HH * 0.13, -HD * 0.13], [HW * g, HH * (g + 0.01), HD * g], col,
         { gloss: 0.34, shade: 0.30 });
    ball(K, [0, cy + HH * 0.42, -HD * 0.02], [HW * (g - 0.06), HH * 0.66, HD * (g - 0.04)], col,
         { gloss: 0.38, shade: 0.24 });
    /* The hairline. This has to sit ABOVE the brows and be soft-edged: the
       first attempt laid a single fat tube across the forehead and every
       character looked like they were wearing a headband. Three overlapping
       lobes, swept slightly to one side, read as hair. */
    if (o.fringe !== false) {
      const hi = 0.50 + (o.high || 0);
      const qh = C.proj(K.ctx, [0, cy + HH * hi, HD * 0.55]);
      ball(K, [0, cy + HH * 0.12, HD * 0.26], [HW * (g - 0.04), HH * (g - 0.08), HD * 0.78], col,
           { gloss: 0.38, shade: 0.22, rim: 0.18, clipY: qh.y });
    }
  }

  /* a chain of tapering segments — a plait, a ponytail, a lock, a wave */
  function strand(K, pts, r0, r1, col, o) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = i / (pts.length - 1), b = (i + 1) / (pts.length - 1);
      tube(K, pts[i], [A.lerp(r0, r1, a), A.lerp(r0, r1, a) * 0.9],
              pts[i + 1], [A.lerp(r0, r1, b), A.lerp(r0, r1, b) * 0.9], col,
           o || { gloss: 0.34, shade: 0.28 });
    }
  }

  /* Every style is a function of (kit, skull centre, skull radii, colour).
     Add one here and the whole cast can wear it.                            */
  const STYLES = {
    /* Daddy: brushed up and swept back off the brow, a little wave at the
       front. Straight off the reference drawing. */
    quiff: function (K, cy, R, col) {
      const HW = R[0], HH = R[1], HD = R[2];
      crown(K, cy, R, col, { grow: 1.03, fringe: false });
      /* Short back and sides: thin slivers set well behind the ears. Anything
         fatter than this swallows the ear and the whole head reads as a
         swimming cap. */
      [-1, 1].forEach((sx) => {
        ball(K, [sx * HW * 0.80, cy + HH * 0.10, -HD * 0.44], [HW * 0.24, HH * 0.52, HD * 0.50],
             col, { gloss: 0.26, shade: 0.34 });
      });
      /* The sweep is one raised mass with a crest lifting off it, brushed to
         the character's left. Built out of separate locks it read as fingers. */
      /* Two long masses, not three balls. Three read as a bun from behind —
         the crest has to stay WIDE front-to-back or it turns into a knot. */
      ball(K, [HW * 0.04, cy + HH * 0.86, HD * 0.22], [HW * 0.96, HH * 0.50, HD * 0.80], col,
           { gloss: 0.40, shade: 0.26 });
      ball(K, [HW * 0.16, cy + HH * 1.12, -HD * 0.02], [HW * 0.78, HH * 0.28, HD * 0.74], col,
           { gloss: 0.46, shade: 0.24 });
      // one lock falling forward onto the brow, so it is a haircut and not a helmet
      strand(K, [
        [-HW * 0.30, cy + HH * 1.06, HD * 0.42],
        [-HW * 0.58, cy + HH * 0.80, HD * 0.56],
        [-HW * 0.70, cy + HH * 0.50, HD * 0.54],
      ], HW * 0.20, HW * 0.10, col);
    },

    /* Mummy: a high ponytail, loose strands down the temples. */
    pony: function (K, cy, R, col) {
      const HW = R[0], HH = R[1], HD = R[2];
      crown(K, cy, R, col, { grow: 1.08, high: 0.02 });
      // the gather, high and at the back
      ball(K, [0, cy + HH * 0.60, -HD * 0.78], [HW * 0.30, HH * 0.26, HD * 0.28], mix(col, '#000000', 0.14),
           { gloss: 0.2, shade: 0.3 });
      /* The tail. Plenty of short segments on a gentle curve: three long ones
         cut the corners and the whole thing swings over the head like a horn. */
      strand(K, [
        [0, cy + HH * 0.54, -HD * 0.92],
        [0, cy + HH * 0.14, -HD * 1.30],
        [HW * 0.06, cy - HH * 0.34, -HD * 1.50],
        [HW * 0.10, cy - HH * 0.88, -HD * 1.48],
        [HW * 0.08, cy - HH * 1.38, -HD * 1.26],
        [HW * 0.02, cy - HH * 1.76, -HD * 0.96],
      ], HW * 0.36, HW * 0.11, col);
      // fine strands down the temples, tucked close to the cheek
      [-1, 1].forEach((sx) => {
        strand(K, [
          [sx * HW * 0.96, cy + HH * 0.42, -HD * 0.10],
          [sx * HW * 1.02, cy - HH * 0.14, -HD * 0.16],
          [sx * HW * 0.92, cy - HH * 0.62, -HD * 0.14],
        ], HW * 0.14, HW * 0.07, col);
      });
    },

    /* Aaria: two long bunches with pink ties, a soft fringe, a centre part. */
    pigtails: function (K, cy, R, col, o) {
      const HW = R[0], HH = R[1], HD = R[2];
      const tie = (o && o.tie) || '#f36ea4';
      crown(K, cy, R, col, { grow: 1.08 });
      [-1, 1].forEach((sx) => {
        // the gathered bunch, then the tie, then the long fall — all of it kept
        // behind the shoulder line so it never crowds the face
        ball(K, [sx * HW * 0.90, cy + HH * 0.14, -HD * 0.34], [HW * 0.30, HH * 0.28, HD * 0.30],
             col, { gloss: 0.34, shade: 0.28 });
        ball(K, [sx * HW * 1.02, cy - HH * 0.12, -HD * 0.32], [HW * 0.15, HH * 0.13, HD * 0.15],
             tie, { gloss: 0.44, shade: 0.22 });
        strand(K, [
          [sx * HW * 1.04, cy - HH * 0.22, -HD * 0.32],
          [sx * HW * 1.20, cy - HH * 1.00, -HD * 0.42],
          [sx * HW * 1.16, cy - HH * 1.80, -HD * 0.22],
          [sx * HW * 0.94, cy - HH * 2.36, HD * 0.04],
        ], HW * 0.25, HW * 0.11, col);
      });
    },

    short: function (K, cy, R, col) { crown(K, cy, R, col, { grow: 1.05 }); },
    crop:  function (K, cy, R, col) { crown(K, cy, R, col, { grow: 1.02, high: -0.04 }); },

    bob: function (K, cy, R, col) {
      const HW = R[0], HH = R[1], HD = R[2];
      crown(K, cy, R, col, { grow: 1.07 });
      [-1, 1].forEach((sx) => {
        strand(K, [
          [sx * HW * 0.94, cy + HH * 0.44, -HD * 0.10],
          [sx * HW * 1.10, cy - HH * 0.30, -HD * 0.06],
          [sx * HW * 1.02, cy - HH * 0.96, HD * 0.02],
        ], HW * 0.34, HW * 0.26, col);
      });
      ball(K, [0, cy - HH * 0.30, -HD * 0.72], [HW * 1.0, HH * 0.78, HD * 0.46], col,
           { gloss: 0.3, shade: 0.3 });
    },

    long: function (K, cy, R, col) {
      const HW = R[0], HH = R[1], HD = R[2];
      crown(K, cy, R, col, { grow: 1.08 });
      [-1, 1].forEach((sx) => {
        strand(K, [
          [sx * HW * 0.92, cy + HH * 0.46, -HD * 0.14],
          [sx * HW * 1.14, cy - HH * 0.56, -HD * 0.12],
          [sx * HW * 1.14, cy - HH * 1.70, HD * 0.02],
          [sx * HW * 0.98, cy - HH * 2.50, HD * 0.06],
        ], HW * 0.36, HW * 0.22, col);
      });
      strand(K, [
        [0, cy + HH * 0.50, -HD * 0.92],
        [0, cy - HH * 0.80, -HD * 1.10],
        [0, cy - HH * 2.10, -HD * 0.86],
      ], HW * 0.78, HW * 0.52, mix(col, '#000000', 0.06));
    },

    curly: function (K, cy, R, col) {
      const HW = R[0], HH = R[1], HD = R[2];
      crown(K, cy, R, col, { grow: 1.02, fringe: false });
      const puffs = [[-0.86, 0.42, -0.2], [-0.42, 0.96, 0.05], [0.16, 1.06, -0.05],
                     [0.70, 0.78, -0.15], [0.92, 0.18, -0.35], [-0.98, -0.08, -0.4],
                     [0.0, 0.62, 0.62], [-0.62, 0.30, 0.52], [0.58, 0.34, 0.50]];
      puffs.forEach((c, i) => {
        ball(K, [HW * c[0], cy + HH * c[1], HD * c[2]],
             [HW * (0.34 + (i % 3) * 0.04), HH * 0.30, HD * 0.32], col,
             { gloss: 0.34, shade: 0.30 });
      });
    },

    bun: function (K, cy, R, col) {
      const HW = R[0], HH = R[1], HD = R[2];
      crown(K, cy, R, col, { grow: 1.06 });
      ball(K, [0, cy + HH * 1.16, -HD * 0.52], [HW * 0.46, HH * 0.42, HD * 0.44], col,
           { gloss: 0.38, shade: 0.28 });
    },

    wave: function (K, cy, R, col) {
      const HW = R[0], HH = R[1], HD = R[2];
      crown(K, cy, R, col, { grow: 1.07 });
      [-1, 1].forEach((sx) => {
        strand(K, [
          [sx * HW * 0.90, cy + HH * 0.40, -HD * 0.18],
          [sx * HW * 1.20, cy - HH * 0.34, -HD * 0.28],
          [sx * HW * 0.98, cy - HH * 1.14, -HD * 0.10],
          [sx * HW * 1.18, cy - HH * 1.86, HD * 0.06],
        ], HW * 0.32, HW * 0.18, col);
      });
    },

    /* a baseball cap, kept for the neighbours and the coaches */
    cap: function (K, cy, R, col, o) {
      const HW = R[0], HH = R[1], HD = R[2];
      const hairCol = (o && o.under) || '#4a3128';
      ball(K, [0, cy + HH * 0.10, -HD * 0.40], [HW * 0.94, HH * 0.72, HD * 0.72], hairCol,
           { gloss: 0.2, shade: 0.3 });
      ball(K, [0, cy + HH * 0.38, -HD * 0.04], [HW * 1.10, HH * 0.78, HD * 1.10], col,
           { gloss: 0.34, shade: 0.30 });
      // the brim, out over the brow
      tube(K, [-HW * 0.66, cy + HH * 0.36, HD * 0.86], [HW * 0.40, HD * 0.10],
              [HW * 0.66, cy + HH * 0.36, HD * 0.86], [HW * 0.40, HD * 0.10],
           mix(col, '#000000', 0.18), { gloss: 0.2, shade: 0.24 });
      tube(K, [0, cy + HH * 0.40, HD * 0.55], [HW * 0.92, HD * 0.30],
              [0, cy + HH * 0.34, HD * 1.22], [HW * 0.64, HD * 0.16],
           mix(col, '#000000', 0.12), { gloss: 0.26, shade: 0.26 });
      ball(K, [0, cy + HH * 1.12, -HD * 0.04], [HW * 0.12, HH * 0.10, HD * 0.12],
           mix(col, '#000000', 0.22), { gloss: 0.3, shade: 0.2 });
    },
  };

  C.hairStyles = STYLES;
  C.hair = function (K, cy, R, style, col, o) {
    const fn = STYLES[style] || STYLES.short;
    fn(K, cy, R, col, o || {});
  };
  C.crown = crown; C.strand = strand;
})();

/* ═══════════════════════════════════════════════════════════ THE FIGURE
   One rig for every person in the film. A figure is 100 model units tall with
   its feet at the origin; a scene says where the feet land on screen and how
   many pixels tall the person should be, exactly as it always has.

   The pose numbers are the ones the film already used — armL, armLe, legR and
   friends, an angle at the shoulder and a bend at the elbow. What is new is
   that a pose now swings in a PLANE:

     'front'  across the body, the way the flat drawings read (waving, a hug,
              hands over the ears, arms up)
     'side'   forward and back (a stride, a sit, a reach)

   A pose says which it wants; 'front' is the default, so every old pose still
   reads the way it was drawn.                                                */
(function () {
  "use strict";
  const A = window.ABEArt, C = window.ABECast, P = A.P;
  const ball = C.ball, tube = C.tube;
  const mix = A.mix, clamp = A.clamp;

  /* Proportions come straight off the reference sheet, and the reference is
     unmistakably chibi: a big head, a short sturdy body, chunky arms. Getting
     this table wrong makes everything else look wrong, however nicely it is
     shaded — the first pass had legs half the height of the figure and the
     whole cast read as puppets. Heights are a percentage of the figure, whose
     hair reaches 100. */
  const FORM = {
    adult: { hip: 42, waist: 49, chest: 56, sh: 63, neck: 67,
             headH: 13.8, headW: 11.4, headD: 12.2,
             shW: 13.2, hipW: 9.6, bodyD: 8.6,
             upper: 13.0, fore: 12.4, armR: 4.2, handR: 4.4,
             thigh: 18.5, shin: 17.5, legR: 6.1, footL: 8.8 },
    kid:   { hip: 38, waist: 44, chest: 51, sh: 58, neck: 62,
             headH: 16.0, headW: 13.4, headD: 14.0,
             shW: 11.8, hipW: 8.4, bodyD: 7.9,
             upper: 11.0, fore: 10.5, armR: 4.0, handR: 4.2,
             thigh: 16.0, shin: 15.0, legR: 5.7, footL: 7.8 },
  };
  C.FORM = FORM;

  /* hair presets: a style and the colour it usually comes in, so a scene can
     keep saying hair: 'grey' and get a grey-haired person */
  const HAIR = {
    quiff:    { style: 'quiff',    col: '#7b4a2c' },
    pony:     { style: 'pony',     col: '#3d2a20' },
    pigtails: { style: 'pigtails', col: '#a0703f' },
    short:    { style: 'short',    col: '#4a3128' },
    crop:     { style: 'crop',     col: '#2f251e' },
    bob:      { style: 'bob',      col: '#4a3128' },
    long:     { style: 'long',     col: '#422d22' },
    wave:     { style: 'wave',     col: '#5b3a2a' },
    curly:    { style: 'curly',    col: '#33261e' },
    bun:      { style: 'bun',      col: '#4a3128' },
    fair:     { style: 'long',     col: '#c99a52' },
    red:      { style: 'bob',      col: '#a8492a' },
    grey:     { style: 'short',    col: '#9aa0ad' },
    cap:      { style: 'cap',      col: '#d8453c' },
  };
  C.HAIR = HAIR;

  /* which way a joint swings */
  function dirOf(a, plane) {
    return plane === 'side' ? [0, -Math.cos(a), Math.sin(a)]
                            : [Math.sin(a), -Math.cos(a), 0];
  }
  function limbPts(root, a1, a2, l1, l2, plane) {
    const d1 = dirOf(a1, plane), d2 = dirOf(a1 + a2, plane);
    const mid = [root[0] + d1[0] * l1, root[1] + d1[1] * l1, root[2] + d1[2] * l1];
    const end = [mid[0] + d2[0] * l2, mid[1] + d2[1] * l2, mid[2] + d2[2] * l2];
    return [root, mid, end, d2];
  }

  /* ── the shoe: a chunky little sneaker pointing the way the body faces ── */
  function shoe(K, ank, F, col, sole) {
    const y = Math.max(ank[1] - F.legR * 0.10, F.legR * 0.80);
    const back = [ank[0], y, ank[2] - F.footL * 0.36];
    const toe  = [ank[0], y - F.legR * 0.16, ank[2] + F.footL * 0.78];
    tube(K, back, [F.legR * 0.84, F.legR * 0.92], toe, [F.legR * 0.70, F.legR * 0.78], col,
         { gloss: 0.32, shade: 0.30 });
    tube(K, [back[0], y - F.legR * 0.62, back[2]], [F.legR * 0.76, F.legR * 0.46],
            [toe[0], y - F.legR * 0.72, toe[2]], [F.legR * 0.64, F.legR * 0.40],
         sole || '#fdfcf8', { gloss: 0.3, shade: 0.18 });
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  C.figure = function (g, o) {
    o = o || {};
    const s = o.s || 1;
    const F = o.kid ? FORM.kid : FORM.adult;
    const pose = o.pose || {};
    const skin = o.skin || C.SKINS.light;
    const cloth = o.cloth || '#5c8fd6';
    const hairKey = HAIR[o.hair] || HAIR.short;
    const hairStyle = o.hairStyle || hairKey.style;
    const hairCol = o.hairCol || hairKey.col;

    const armPlane = pose.armPlane || pose.plane || 'front';
    const legPlane = pose.legPlane || pose.plane || 'front';

    /* the old rig swung a nearly-straight arm OUTWARD so it never read as a
       sash across the chest; keep that, it is still the right instinct */
    let armL = pose.armL === undefined ? 0.28 : pose.armL;
    let armR = pose.armR === undefined ? -0.28 : pose.armR;
    if (armPlane === 'front') {
      if (Math.abs(armL) < 0.62) armL = -Math.abs(armL);
      if (Math.abs(armR) < 0.62) armR = Math.abs(armR);
    }
    const armLe = pose.armLe || 0, armRe = pose.armRe || 0;
    const legL = pose.legL === undefined ? 0.06 : pose.legL, legLe = pose.legLe || 0;
    const legR = pose.legR === undefined ? -0.06 : pose.legR, legRe = pose.legRe || 0;

    const ctx = C.makeCtx({ x: o.x, y: o.y, scale: s, turn: o.turn || 0, flip: o.flip, z: o.z });
    const K = C.Kit(g, ctx);

    g.save();
    if (o.lean) { g.translate(o.x, o.y); g.rotate(o.lean); g.translate(-o.x, -o.y); }
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;

    /* the contact shadow — the one thing that stops a 3D figure floating */
    if (o.shadow !== false) {
      const q = C.proj(ctx, [0, 0, 0]);
      const rx = 23 * s * q.f, ry = 7.5 * s * q.f;
      const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, rx);
      gr.addColorStop(0, 'rgba(26,34,70,.30)');
      gr.addColorStop(0.55, 'rgba(26,34,70,.16)');
      gr.addColorStop(1, 'rgba(26,34,70,0)');
      g.save(); A.ell(g, q.x, q.y + ry * 0.2, rx, ry); g.fillStyle = gr; g.fill(); g.restore();
    }

    /* ── clothing decisions ─────────────────────────────────────────────── */
    const dress = o.dress !== undefined ? o.dress : (o.skirt !== false && !o.shorts && !o.trousers);
    const trousers = o.trousers || o.legColor || null;
    const shorts = o.shorts || null;
    const shoeCol = o.shoe || '#47588a';
    const sleeve = o.sleeve === undefined ? 0.46 : o.sleeve;   // 0 = vest, 1 = long

    /* ── legs ───────────────────────────────────────────────────────────── */
    [-1, 1].forEach((sx) => {
      const a1 = sx < 0 ? legL : legR, a2 = sx < 0 ? legLe : legRe;
      const root = [sx * F.hipW * 0.56, F.hip, 0];
      const L = limbPts(root, a1, a2, F.thigh, F.shin, legPlane);
      const legCol = trousers || skin;
      tube(K, L[0], [F.legR * 1.02, F.legR * 0.98], L[1], [F.legR * 0.80, F.legR * 0.78], legCol,
           { gloss: 0.26, shade: 0.28 });
      ball(K, L[1], [F.legR * 0.81, F.legR * 0.81, F.legR * 0.79], legCol, { gloss: 0.22, shade: 0.24, rim: 0 });
      tube(K, L[1], [F.legR * 0.80, F.legR * 0.78], L[2], [F.legR * 0.56, F.legR * 0.56], legCol,
           { gloss: 0.26, shade: 0.28 });
      if (shorts && !trousers) {   // the shorts themselves, over the top of the leg
        const cuffT = 0.52;
        const cp = [A.lerp(L[0][0], L[1][0], cuffT), A.lerp(L[0][1], L[1][1], cuffT), A.lerp(L[0][2], L[1][2], cuffT)];
        tube(K, [L[0][0], L[0][1] + 2, L[0][2]], [F.legR * 1.20, F.legR * 1.16],
                cp, [F.legR * 1.04, F.legR * 1.00], shorts, { gloss: 0.26, shade: 0.28 });
      }
      shoe(K, L[2], F, shoeCol, o.sole);
    });

    /* ── hips and torso ─────────────────────────────────────────────────── */
    const belowCol = dress ? cloth : (trousers || shorts || skin);
    tube(K, [-F.hipW * 0.80, F.hip + 1, 0], [F.legR * 0.96, F.bodyD * 0.82],
            [F.hipW * 0.80, F.hip + 1, 0], [F.legR * 0.96, F.bodyD * 0.82], belowCol,
         { gloss: 0.24, shade: 0.28 });
    if (dress) {
      tube(K, [0, F.waist + 2, 0], [F.shW * 0.62, F.bodyD * 0.82],
              [0, F.hip - F.thigh * 0.44, 0], [F.shW * 1.14, F.bodyD * 1.18], cloth,
           { gloss: 0.30, shade: 0.28 });
    }
    tube(K, [0, F.hip + 1, 0], [F.shW * 0.82, F.bodyD * 0.96],
            [0, F.sh, 0], [F.shW * 0.96, F.bodyD * 1.02], cloth,
         { gloss: 0.30, shade: 0.28 });
    // a collar: a flattened ring at the base of the neck, which the neck then
    // comes up through — a bar across the chest reads as a necklace
    ball(K, [0, F.sh + 1.6, 0], [F.armR * 1.62, F.armR * 0.62, F.armR * 1.40],
         o.trim || mix(cloth, '#ffffff', 0.22), { gloss: 0.32, shade: 0.22, rim: 0.2 });
    if (o.tee) {                       // what is printed on the front of the shirt
      C.panel(K, [0, (F.waist + F.sh) / 2 + 3, F.bodyD * 1.02], [1, 0, 0], [0, -1, 0],
              { zBias: 0.4 }, function (g) { o.tee(g, F.shW * 0.74); });
    }
    if (o.sash) {
      tube(K, [-F.shW * 0.80, F.hip + 6, F.bodyD * 0.2], [F.armR * 0.75, F.armR * 0.55],
              [F.shW * 0.80, F.hip + 6, F.bodyD * 0.2], [F.armR * 0.75, F.armR * 0.55],
           o.sash, { gloss: 0.34, shade: 0.24 });
    }

    /* ── arms ───────────────────────────────────────────────────────────── */
    const hands = {};
    [-1, 1].forEach((sx) => {
      const a1 = sx < 0 ? armL : armR, a2 = sx < 0 ? armLe : armRe;
      const root = [sx * F.shW * 0.92, F.sh - 1.5, 0];
      const L = limbPts(root, a1, a2, F.upper, F.fore, armPlane);
      ball(K, root, [F.armR * 1.02, F.armR * 1.02, F.armR * 1.02], cloth, { gloss: 0.32, shade: 0.28 });
      tube(K, L[0], [F.armR * 1.02, F.armR * 0.98], L[1], [F.armR * 0.82, F.armR * 0.80], skin,
           { gloss: 0.26, shade: 0.28 });
      tube(K, L[1], [F.armR * 0.82, F.armR * 0.80], L[2], [F.armR * 0.66, F.armR * 0.66], skin,
           { gloss: 0.26, shade: 0.28 });
      if (sleeve > 0.02) {       // the sleeve, pulled over the top of the arm
        const sp = [A.lerp(L[0][0], L[1][0], sleeve), A.lerp(L[0][1], L[1][1], sleeve), A.lerp(L[0][2], L[1][2], sleeve)];
        const sp2 = sleeve > 0.9
          ? [A.lerp(L[1][0], L[2][0], 0.8), A.lerp(L[1][1], L[2][1], 0.8), A.lerp(L[1][2], L[2][2], 0.8)]
          : sp;
        tube(K, L[0], [F.armR * 1.10, F.armR * 1.07], sp2, [F.armR * 0.97, F.armR * 0.95], cloth,
             { gloss: 0.30, shade: 0.28 });
        if (o.ringer && o.trim) {      // the contrast cuff on a ringer tee
          const c0 = [A.lerp(sp2[0], L[0][0], 0.13), A.lerp(sp2[1], L[0][1], 0.13), A.lerp(sp2[2], L[0][2], 0.13)];
          tube(K, c0, [F.armR * 0.99, F.armR * 0.97], sp2, [F.armR * 0.97, F.armR * 0.95], o.trim,
               { gloss: 0.30, shade: 0.26 });
        }
      }
      const hq = ball(K, L[2], [F.handR, F.handR * 0.94, F.handR * 0.86], skin,
                      { gloss: 0.30, shade: 0.26 });
      hands[sx < 0 ? 'handL' : 'handR'] = [hq.x, hq.y];
    });

    /* ── neck, head, hair ───────────────────────────────────────────────── */
    tube(K, [0, F.sh - 2, 0], [F.armR * 1.10, F.armR * 1.00],
            [0, F.neck + 1.5, 0], [F.armR * 0.96, F.armR * 0.92], skin,
         { gloss: 0.18, shade: 0.34 });

    const hs = o.headScale || 1;
    const HR = [F.headW * hs, F.headH * hs, F.headD * hs];
    const cy = F.neck + F.headH * hs * 0.86;
    C.head(K, cy, HR, {
      skin: skin, expr: o.expr, blink: o.blink, blush: o.blush, tear: o.tear,
      iris: o.iris, lashes: o.lashes, browCol: o.browCol || mix(hairCol, '#2a1a12', 0.28),
      gazeX: o.gazeX, gazeY: o.gazeY,
    });
    if (o.hair !== 'none') C.hair(K, cy, HR, hairStyle, hairCol, { tie: o.tie, under: o.hairUnder });

    K.flush();
    g.restore();

    /* the same contract the flat rig returned, so scenes keep working */
    const qHead = C.proj(ctx, [0, cy, 0]);
    const qSh = C.proj(ctx, [0, F.sh, 0]);
    const qHip = C.proj(ctx, [0, F.hip, 0]);
    return {
      handL: hands.handL || [o.x, o.y], handR: hands.handR || [o.x, o.y],
      headY: qHead.y, headR: F.headH * hs * s * qHead.f,
      headX: qHead.x, shY: qSh.y, hipY: qHip.y,
      x: o.x, y: o.y, s: s, ctx: ctx,
    };
  };
})();

/* ═══════════════════════════════════════════════════════════════ THE CAST
   Three people were drawn for this film before anything was modelled — Daddy,
   Mummy and Aaria. Everybody else is the same rig wearing different hair,
   skin and clothes, which is exactly why the crowd scenes hang together: a
   neighbour, a buddy, a volunteer and a coach are all built to the same
   proportions and lit by the same lamp as the family.                        */
(function () {
  "use strict";
  const A = window.ABEArt, C = window.ABECast, P = A.P;
  const ball = C.ball, tube = C.tube;
  const S = C.SKINS, mix = A.mix, rand = A.rand;

  /* a tiny blue elephant on the front of Aaria's shirt */
  function teeElephant(g, w) {
    g.save();
    g.fillStyle = '#2f9fd8';
    g.beginPath(); g.ellipse(0, 0, w * 0.52, w * 0.44, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(-w * 0.30, -w * 0.10, w * 0.30, w * 0.34, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2f9fd8'; g.lineWidth = w * 0.16; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-w * 0.52, w * 0.06);
    g.quadraticCurveTo(-w * 0.82, w * 0.26, -w * 0.62, w * 0.50); g.stroke();
    g.restore();
  }

  C.CAST = {
    /* Aaria — pigtails with pink ties, a cream ringer tee, denim shorts and
       pink high-tops, drawn from the reference sheet. */
    aaria: {
      kid: true, skin: S.light, iris: '#6a4326', lashes: true,
      hair: 'pigtails', hairCol: '#a0703f', tie: '#f36ea4',
      cloth: '#fdf4e2', trim: '#ffcf45', ringer: true, skirt: false, shorts: '#4d76ab',
      shoe: '#f06ea0', sole: '#fffdf8', sleeve: 0.56, tee: teeElephant,
    },
    /* Mummy — a high ponytail and a red top. */
    mum: {
      skin: S.light, iris: '#5a3320', lashes: true,
      hair: 'pony', hairCol: '#3d2a20',
      cloth: '#d9474f', trim: '#e9767c', skirt: false, trousers: '#2f4470',
      shoe: '#3b3f56', sleeve: 0.58,
    },
    /* Daddy — hair brushed up and back, and that blue shirt. */
    dad: {
      skin: S.light, iris: '#6b4326',
      hair: 'quiff', hairCol: '#7b4a2c',
      cloth: '#2f6fd0', trim: '#5b96e4', skirt: false, trousers: '#8d97ad',
      shoe: '#39405a', sleeve: 0.46,
    },
  };

  function preset(name, o) {
    return Object.assign({}, C.CAST[name], o);
  }
  C.aaria = function (g, o) { return C.figure(g, preset('aaria', o)); };
  C.mum   = function (g, o) { return C.figure(g, preset('mum', o)); };
  C.dad   = function (g, o) { return C.figure(g, preset('dad', o)); };

  /* ── everybody else ──────────────────────────────────────────────────── */
  /* The town in this story is a real town, so the ensemble is mixed: seven
     skin tones, ten haircuts, and a wardrobe out of the brand palette. */
  const TONES = [S.fair, S.light, S.warm, S.tan, S.brown, S.deep, S.dark];
  const IRIS  = ['#6b4326', '#3f2a1c', '#4a6b46', '#2f2420', '#7a5230', '#2b3f5e'];

  const KIDS = [
    { hair: 'pigtails', cloth: '#f5b23c', trim: '#ffd98a', skirt: false, shorts: '#4d76ab', shoe: '#e8626f', lashes: true },
    { hair: 'long',     cloth: '#9b7ce0', trim: '#c3adf0', shoe: '#5b5f8a', lashes: true },
    { hair: 'crop',     cloth: '#4fb265', trim: '#84d193', skirt: false, trousers: '#4a5670', shoe: '#33415e' },
    { hair: 'fair',     cloth: '#ef7fa8', trim: '#ffb3cd', shoe: '#c05a80', lashes: true },
    { hair: 'wave',     cloth: '#3aa7e0', trim: '#7fcbf0', skirt: false, shorts: '#3f5d86', shoe: '#2f4a6e' },
    { hair: 'curly',    cloth: '#f2705f', trim: '#ffa094', skirt: false, trousers: '#6a5a4a', shoe: '#4a3a30' },
    { hair: 'bob',      cloth: '#57c1ba', trim: '#96ddd7', shoe: '#3e7a76', lashes: true },
    { hair: 'short',    cloth: '#b98cd6', trim: '#d5b6e8', skirt: false, shorts: '#5c5470', shoe: '#463f5e' },
  ];
  C.kid = function (g, i, o) {
    const n = ((i % KIDS.length) + KIDS.length) % KIDS.length;
    const k = KIDS[n];
    return C.figure(g, Object.assign({
      kid: true, skin: TONES[Math.floor(rand(i * 5.3) * TONES.length)],
      iris: IRIS[Math.floor(rand(i * 2.9) * IRIS.length)],
      hairCol: null,
    }, k, o));
  };
  const GROWN = [
    { hair: 'short', cloth: '#7f93b5' }, { hair: 'bun',  cloth: '#b98cd6' },
    { hair: 'grey',  cloth: '#8fa9c4' }, { hair: 'wave', cloth: '#5bbfb0' },
    { hair: 'crop',  cloth: '#e0925c' }, { hair: 'curly', cloth: '#6f7fbf' },
  ];
  C.grown = function (g, i, o) {
    const n = ((i % GROWN.length) + GROWN.length) % GROWN.length;
    return C.figure(g, Object.assign({
      skin: TONES[Math.floor(rand(i * 3.7) * TONES.length)],
      iris: IRIS[Math.floor(rand(i * 6.1) * IRIS.length)],
      lashes: n % 2 === 1,
    }, GROWN[n], o));
  };
})();

/* ══════════════════════════════════════════════════════════════════ NILU
   The blue elephant himself, modelled rather than traced: a round body, a
   head that can look at Aaria, two enormous ears, and a trunk that curls up
   at the tip the way it does on the badge.

   He stands 100 units tall with his feet on the ground, like everybody else,
   so a scene can place him next to Aaria and get the heights right.          */
(function () {
  "use strict";
  const A = window.ABEArt, C = window.ABECast, P = A.P;
  const ball = C.ball, tube = C.tube, panel = C.panel, onSurface = C.onSurface;
  const mix = A.mix;

  const BLUE = '#2f9fd8', EAR = '#7fc9ec', DARK = '#1f7bae';

  C.nilu = function (g, o) {
    o = o || {};
    const s = o.s || 1;
    const ctx = C.makeCtx({ x: o.x, y: o.y, scale: s, turn: o.turn || 0, flip: o.flip, z: o.z });
    const K = C.Kit(g, ctx);
    const t = o.t || 0;
    const blue = o.col || BLUE;

    g.save();
    if (o.lean) { g.translate(o.x, o.y); g.rotate(o.lean); g.translate(-o.x, -o.y); }
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;

    if (o.shadow !== false) {
      const q = C.proj(ctx, [0, 0, 0]);
      const rx = 30 * s * q.f, ry = 9 * s * q.f;
      const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, rx);
      gr.addColorStop(0, 'rgba(26,34,70,.30)'); gr.addColorStop(0.55, 'rgba(26,34,70,.15)');
      gr.addColorStop(1, 'rgba(26,34,70,0)');
      g.save(); A.ell(g, q.x, q.y + ry * 0.2, rx, ry); g.fillStyle = gr; g.fill(); g.restore();
    }

    // four sturdy legs
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach((c) => {
      tube(K, [c[0] * 15, 30, c[1] * 15], [8.5, 8.5], [c[0] * 15.5, 5, c[1] * 16], [8.0, 8.0], blue,
           { gloss: 0.28, shade: 0.30 });
      ball(K, [c[0] * 15.5, 5.5, c[1] * 16], [8.2, 5.5, 8.2], mix(blue, '#ffffff', 0.12),
           { gloss: 0.3, shade: 0.2 });
    });
    // body
    ball(K, [0, 47, -2], [25, 22, 24], blue, { gloss: 0.32, shade: 0.28 });
    // tail with the little leaf off the badge
    tube(K, [0, 52, -22], [3.2, 3.2], [2, 30, -33], [1.8, 1.8], blue, { gloss: 0.26, shade: 0.28 });
    ball(K, [3, 26, -35], [4.2, 6.0, 2.2], '#7bc47f', { gloss: 0.34, shade: 0.24, rot: 0.5 });

    // head
    const hy = 70, hz = 10;
    const HR = [21, 19.5, 20];
    const nod = Math.sin(t * 1.3) * 0.5;
    ball(K, [0, hy + nod, hz], HR, blue, { gloss: 0.34, shade: 0.28 });
    // the ears: big flat fans, wide from the front and thin from the side
    [-1, 1].forEach((sx) => {
      const flap = Math.sin(t * 2.1 + sx) * 1.4;
      ball(K, [sx * 21, hy + 2 + flap, hz - 6], [15, 18.5, 3.4], blue, { gloss: 0.30, shade: 0.30 });
      ball(K, [sx * 22, hy + 1 + flap, hz - 3.4], [10.5, 13, 2.2], EAR, { gloss: 0.26, shade: 0.18, rim: 0.1 });
    });
    // the trunk, curling up at the tip
    C.strand(K, [
      [0, hy - 8 + nod, hz + 17],
      [0, hy - 24 + nod, hz + 25],
      [1, hy - 34, hz + 30],
      [2, hy - 30, hz + 39],
      [2, hy - 21, hz + 40],
    ], 7.2, 2.8, blue, { gloss: 0.30, shade: 0.28 });

    // the face: two happy eyes with lashes, and a soft smile
    const centre = [0, hy + nod, hz];
    [-1, 1].forEach((sx) => {
      const sf = onSurface(centre, HR, [sx * 0.44, 0.18, 0.84]);
      panel(K, sf.p, sf.right, sf.down, { zBias: 0.4 }, function (g) {
        g.save();
        const shut = o.expr === 'bliss' || o.expr === 'sleep' || o.blink > 0.55;
        if (shut) {
          g.strokeStyle = P.ink; g.lineWidth = 1.5; g.lineCap = 'round';
          g.beginPath(); g.moveTo(-4.2, 1.2); g.quadraticCurveTo(0, -3.6, 4.2, 1.2); g.stroke();
        } else {
          g.beginPath(); g.ellipse(0, 0, 3.6, 4.2, 0, 0, Math.PI * 2);
          g.fillStyle = '#ffffff'; g.fill();
          g.beginPath(); g.ellipse((o.gazeX || 0) * 1.2, 0.3, 2.3, 2.6, 0, 0, Math.PI * 2);
          g.fillStyle = P.ink; g.fill();
          g.beginPath(); g.ellipse((o.gazeX || 0) * 1.2 - 0.8, -0.7, 0.9, 0.9, 0, 0, Math.PI * 2);
          g.fillStyle = '#ffffff'; g.fill();
        }
        g.strokeStyle = P.ink; g.lineWidth = 1.1; g.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          const a = -0.45 + i * 0.34;
          g.beginPath(); g.moveTo(sx * 3.6, -3.0 + i * 1.3);
          g.lineTo(sx * (3.6 + Math.cos(a) * 3.2), -3.0 + i * 1.3 - Math.sin(a + 0.5) * 2.4);
          g.stroke();
        }
        g.restore();
      });
    });
    {
      const sf = onSurface(centre, HR, [0.34, -0.50, 0.80]);
      panel(K, sf.p, sf.right, sf.down, { zBias: 0.5 }, function (g) {
        g.strokeStyle = mix(DARK, '#112233', 0.3); g.lineWidth = 1.4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-4, -1); g.quadraticCurveTo(0, 3.2, 4, -1); g.stroke();
      });
    }

    K.flush();
    g.restore();
    const qh = C.proj(ctx, [0, hy, hz]);
    return { x: o.x, y: o.y, s: s, headX: qh.x, headY: qh.y };
  };

  /* the blue elephant PLUSH — the toy she ran across town for. Same animal,
     softer and stubbier, sitting down. */
  C.plush = function (g, o) {
    o = o || {};
    const s = o.s || 1;
    const ctx = C.makeCtx({ x: o.x, y: o.y, scale: s, turn: o.turn || 0.2, flip: o.flip, z: o.z });
    const K = C.Kit(g, ctx);
    const blue = o.col || BLUE;
    g.save();
    if (o.rot) { g.translate(o.x, o.y); g.rotate(o.rot); g.translate(-o.x, -o.y); }
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    if (o.shadow) {
      const q = C.proj(ctx, [0, 0, 0]);
      const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 34 * s);
      gr.addColorStop(0, 'rgba(26,34,70,.26)'); gr.addColorStop(1, 'rgba(26,34,70,0)');
      g.save(); A.ell(g, q.x, q.y, 34 * s, 10 * s); g.fillStyle = gr; g.fill(); g.restore();
    }
    // little legs stuck out in front
    [-1, 1].forEach((sx) => {
      tube(K, [sx * 13, 22, 4], [10, 10], [sx * 15, 11, 24], [8.5, 8.5], mix(blue, '#1a5f8a', 0.16),
           { gloss: 0.26, shade: 0.26 });
    });
    ball(K, [0, 34, 0], [26, 24, 24], blue, { gloss: 0.34, shade: 0.26 });
    const hy = 66;
    ball(K, [0, hy, 6], [21, 20, 20], blue, { gloss: 0.36, shade: 0.26 });
    [-1, 1].forEach((sx) => {
      ball(K, [sx * 20, hy + 3, 0], [14, 17, 3.4], blue, { gloss: 0.30, shade: 0.28 });
      ball(K, [sx * 21, hy + 2, 2.4], [9.5, 12, 2.2], EAR, { gloss: 0.26, shade: 0.16, rim: 0.1 });
    });
    C.strand(K, [[0, hy - 9, 22], [0, hy - 20, 28], [3, hy - 24, 35], [4, hy - 16, 37]],
             6.6, 2.6, blue, { gloss: 0.3, shade: 0.26 });
    const centre = [0, hy, 6], HR = [21, 20, 20];
    [-1, 1].forEach((sx) => {
      const sf = onSurface(centre, HR, [sx * 0.44, 0.16, 0.84]);
      panel(K, sf.p, sf.right, sf.down, { zBias: 0.4 }, function (g) {
        g.strokeStyle = P.ink; g.lineWidth = 1.6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-3.8, 1.0); g.quadraticCurveTo(0, -3.4, 3.8, 1.0); g.stroke();
      });
    });
    K.flush();
    g.restore();
  };
})();
