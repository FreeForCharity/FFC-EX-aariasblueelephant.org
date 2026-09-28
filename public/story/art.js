/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   OUR FIRST YEAR — the art kit  (window.ABEArt)

   Every shape the film draws lives here. The look is taken straight from the
   badge logo: navy line art, white fill, one solid blue elephant, and a very
   small number of accent colours.

   Aaria is drawn the way the brand mark draws her — top bun with a loose wisp,
   side-swept fringe, big navy eyes with lashes, tiny hooked nose. Nilu is the
   logo elephant: solid blue, one enormous ear with an inner curl, a trunk that
   curls up, a leaf on the tail.

   Two rules hold the whole film together:
     1. Everything is drawn on a fixed 1920x1080 stage — no layout maths in a
        scene, just draw where you mean.
     2. Nothing here keeps state. Every function is a pure function of the
        numbers handed to it, so frame 4021 looks identical every single time
        it renders. That is what makes a clean video export possible.

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const A = {};

  /* ───────────────────────────────────────────────────── the brand palette */
  const P = A.P = {
    ink:      '#16255c',   // the navy of the logo line art
    inkSoft:  '#41538c',
    blue:     '#2f9fd8',   // Nilu blue, straight off the badge
    blueLt:   '#5fbde8',
    blueDk:   '#1f7bae',
    blueBg:   '#a9dcf5',   // the pale disc behind the logo elephant
    ear:      '#8fd0ee',
    sky:      '#ddf0ff',
    skyDeep:  '#9bd4f5',
    cream:    '#fffaf2',
    paper:    '#ffffff',
    sun:      '#ffd43b',
    coral:    '#f2705f',
    grass:    '#8ed081',
    grassDk:  '#5fa968',
    night:    '#16224a',
    white:    '#ffffff',
    road:     '#606a7c',
    rainbow:  ['#e8443b', '#f58a2e', '#ffd43b', '#5ec46a', '#3aa7e0', '#7a5cd6'],
  };

  const FONT = '"Comic Sans MS","Chalkboard SE","Baloo 2",system-ui,sans-serif';
  A.FONT = FONT;

  /* ──────────────────────────────────────────── the real artwork, as sprites
     The badge is NOT redrawn here — it is the actual logo file, composited
     into the frames that show the mark itself. The people used to be cut-outs
     too; they are modelled now (cast3d.js), so only the badge is left.
     art/aaria-head.png, aaria-full.png and pair.png are the old cut-outs and
     nothing loads them any more. */
  const ART = {
    badge: { src: 'art/badge.png', cx: 0.5, cy: 0.5, r: 0.5 },
  };
  /* "loaded" is not the same as "ready to draw": an Image can be complete and
     still undecoded, and the first drawImage of an undecoded bitmap does not
     match the ones after it. That is invisible on playback and fatal to a
     frame-exact export, where frame 1 has to equal frame 1 rendered again —
     so wait for decode(), not just for load. */
  Object.keys(ART).forEach((k) => {
    const im = new Image();
    ART[k].img = im;
    ART[k].ready = false;
    const done = () => { ART[k].ready = true; };
    im.onload = () => { if (im.decode) im.decode().then(done, done); else done(); };
    im.onerror = done;
    im.src = ART[k].src;
  });
  A.asset = (k) => ART[k];
  A.assetsReady = () => Object.keys(ART).every((k) => ART[k].ready);
  /* draw a sprite so its anchor lands at (x, y) at the radius asked for */
  A.sprite = function (g, k, x, y, r, o) {
    o = o || {};
    const a = ART[k], im = a.img;
    if (!im.complete || !im.naturalWidth) return false;
    const sc = r / (a.r * im.naturalWidth);
    const w = im.naturalWidth * sc, h = im.naturalHeight * sc;
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    if (o.flip) g.scale(-1, 1);
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.drawImage(im, -a.cx * w, -a.cy * h, w, h);
    g.restore();
    return true;
  };

  /* ─────────────────────────────────────────────────────────── small maths */
  const TAU = Math.PI * 2;
  A.TAU = TAU;
  const clamp = A.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp  = A.lerp  = (a, b, t) => a + (b - a) * t;
  /* 0..1 progress across a window, clamped — the workhorse of every scene */
  A.at   = (t, a, b) => clamp((t - a) / (b - a || 1e-6), 0, 1);
  A.eo   = (t) => 1 - Math.pow(1 - t, 3);
  A.ei   = (t) => t * t * t;
  A.eio  = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  A.back = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  A.pop  = (t) => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(2, -9 * t) * Math.cos(t * 16);
  A.hump = (t) => Math.sin(clamp(t, 0, 1) * Math.PI);
  A.wob  = (t, hz, amp) => Math.sin(t * hz * TAU) * (amp === undefined ? 1 : amp);

  /* deterministic "random" — same index, same number, forever */
  const rand = A.rand = (i) => {
    const x = Math.sin((i + 1) * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  A.rrange = (i, a, b) => lerp(a, b, rand(i));

  /* Colours go in and out of here as #rrggbb. That matters more than it
     looks: the 3D cast shades a colour, then shades the result again, so a
     mix has to be able to eat its own output. Short hex and rgb() strings are
     understood too, so nothing downstream has to think about it. */
  const rgbOf = A.rgbOf = function (c) {
    if (typeof c !== 'string') return [0, 0, 0];
    if (c[0] === '#') {
      if (c.length === 4) return [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)];
      return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    }
    const m = c.match(/-?\d+(\.\d+)?/g);
    if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
    return [0, 0, 0];
  };
  const hex2 = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  A.hex = function (rgb) { return '#' + hex2(rgb[0]) + hex2(rgb[1]) + hex2(rgb[2]); };
  A.mix = function (c1, c2, t) {
    const a = rgbOf(c1), b = rgbOf(c2), u = clamp(t, 0, 1);
    return A.hex([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]);
  };
  A.alpha = function (col, a) {
    const c = rgbOf(col);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  };

  /* ────────────────────────────────────────────────────────── path helpers */
  A.rr = function (g, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  A.ell = function (g, x, y, rx, ry, rot) {
    g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); g.closePath();
  };
  /* a smooth closed shape through a ring of points — blobs, clouds, hills */
  A.blob = function (g, pts) {
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    g.beginPath();
    let m = mid(pts[n - 1], pts[0]);
    g.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) {
      const c = pts[i], nx = pts[(i + 1) % n];
      m = mid(c, nx);
      g.quadraticCurveTo(c[0], c[1], m[0], m[1]);
    }
    g.closePath();
  };
  /* fill, then the signature navy outline */
  A.shape = function (g, fill, lw, stroke) {
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (lw) { g.strokeStyle = stroke || P.ink; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  };
  A.shadow = function (g, x, y, rx, ry, a) {
    g.save(); A.ell(g, x, y, rx, ry);
    g.fillStyle = 'rgba(22,37,92,' + (a === undefined ? 0.12 : a) + ')'; g.fill(); g.restore();
  };
  A.stroke = function (g, pts, w, col, curve) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    if (curve) for (let i = 1; i < pts.length - 1; i += 2) g.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    else for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.strokeStyle = col || P.ink; g.lineWidth = w; g.stroke(); g.restore();
  };

  A.text = function (g, str, x, y, size, o) {
    o = o || {};
    g.save();
    g.font = (o.weight || 900) + ' ' + size + 'px ' + FONT;
    g.textAlign = o.align || 'center';
    g.textBaseline = o.baseline || 'middle';
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    if (o.stroke) { g.lineWidth = o.stroke; g.strokeStyle = o.strokeColor || P.white; g.lineJoin = 'round'; g.strokeText(str, x, y); }
    g.fillStyle = o.color || P.ink;
    g.fillText(str, x, y);
    g.restore();
  };
  /* text bent around a circle — the badge's two arcs of lettering */
  A.arcText = function (g, str, cx, cy, r, size, startAng, dir, color) {
    g.save();
    g.font = '900 ' + size + 'px ' + FONT;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color || P.ink;
    let total = 0; const ws = [];
    for (const ch of str) { const w = g.measureText(ch).width; ws.push(w); total += w; }
    let ang = startAng - dir * (total / r) / 2;
    for (let i = 0; i < ws.length; i++) {
      const step = (ws[i] / r) * dir;
      ang += step / 2;
      g.save();
      g.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      g.rotate(ang + (dir > 0 ? Math.PI / 2 : -Math.PI / 2));
      g.fillText(str[i], 0, 0);
      g.restore();
      ang += step / 2;
    }
    g.restore();
  };

  /* ═══════════════════════════════════════════════════════════ THE PEOPLE
     Everybody in this film is modelled in three dimensions now — see
     cast3d.js. What lives here is only the bridge: the names the chapters
     already call, mapped onto the 3D rig.

     A scene still says the same thing it always said. x and y are where the
     feet land on the 1920x1080 stage, k is the scale for the shot (one number
     per shot, so everyone in it keeps their right relative height), and pose
     is the same set of joint angles. Three optional extras are new, and they
     are where the depth in this film comes from:

       turn   which way the body faces, in radians (0 looks at the camera)
       z      how far back they stand — further back is smaller and higher
       gaze   where the eyes are looking, -1..1

     Heights, relative to each other, are the same as they always were.        */

  const C = () => window.ABECast;

  /* strip the options the flat rig understood and the 3D one names differently */
  function cast(o, extra) {
    const out = Object.assign({}, extra, o);
    out.s = o.s || (o.k || 1) * (extra && extra.__k || 1);
    delete out.__k; delete out.k; delete out.cloth2;
    if (o.legColor) { out.trousers = o.legColor; delete out.legColor; }
    if (o.capColor) { out.hairCol = o.capColor; delete out.capColor; }
    if (o.gaze !== undefined) { out.gazeX = o.gaze; delete out.gaze; }
    return out;
  }

  A.person = function (g, o) { return C().figure(g, cast(o, { __k: 1 })); };
  A.aaria  = function (g, o) { return C().aaria(g, cast(o, { __k: 0.88 })); };
  A.mum    = function (g, o) { return C().mum(g, cast(o, { __k: 1.26 })); };
  A.dad    = function (g, o) { return C().dad(g, cast(o, { __k: 1.32 })); };
  A.grown  = function (g, o) {
    /* the flat rig picked a look from whatever the scene passed; keep that,
       but fall back to a stable member of the ensemble when it passes nothing */
    const i = o.cast === undefined ? (o.hair ? o.hair.length : 3) : o.cast;
    return C().grown(g, i, cast(o, { __k: 1.24 }));
  };
  A.kid = function (g, i, o) {
    return C().kid(g, i, cast(o, { __k: 0.82 + rand(i * 3.1) * 0.12 }));
  };

  /* ═════════════════════════════════════════════════════════════════ NILU
     Aaria and her elephant. The badge draws them together and never apart, so
     A.pair still puts the two of them side by side — only now they are two
     models standing on the same floor, and either can turn.                  */
  A.nilu = function (g, x, y, s, o) {
    o = o || {};
    return C().nilu(g, Object.assign({}, o, { x: x, y: y, s: (s || 1) * 0.9 }));
  };
  A.pair = function (g, x, y, w, o) {
    o = o || {};
    /* w was the width of the old cut-out badge drawing; the two of them
       together come to about 0.62 of that in height */
    const s = (w / 300) * 1.9;
    const flip = o.flip ? -1 : 1;
    C().nilu(g, { x: x + flip * w * 0.20, y: y, s: s * 0.78, turn: -flip * 0.5,
                  t: o.t || 0, alpha: o.alpha, expr: o.expr || 'bliss' });
    C().aaria(g, { x: x - flip * w * 0.16, y: y, s: s, turn: flip * 0.42,
                   alpha: o.alpha, expr: o.expr || 'bliss',
                   pose: { armL: flip > 0 ? 1.1 : 0.3, armLe: 0.5,
                           armR: flip > 0 ? -0.3 : -1.1, armRe: -0.5 } });
    return true;
  };

  /* the blue elephant PLUSH — the actual toy she ran across town for */
  A.plush = function (g, x, y, s, o) {
    o = o || {};
    return C().plush(g, Object.assign({}, o, { x: x, y: y + 28 * s, s: s * 0.62 }));
  };


  /* ════════════════════════════════════════════════════════ brand marks */
  A.infinity = function (g, x, y, w, lw, t) {
    const n = 90;
    g.save(); g.lineCap = 'round'; g.lineWidth = lw;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, b = ((i + 1.4) / n) * TAU;
      const pt = (u) => [x + w * Math.cos(u) / (1 + Math.sin(u) * Math.sin(u)),
                         y + w * 0.62 * Math.sin(u) * Math.cos(u) / (1 + Math.sin(u) * Math.sin(u))];
      const p1 = pt(a), p2 = pt(b);
      const hue = ((i / n) * 360 + (t || 0) * 40) % 360;
      g.strokeStyle = 'hsl(' + hue + ',78%,55%)';
      g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke();
    }
    g.restore();
  };
  /* the little rainbow pixel elephant from the left of the badge */
  A.pixelEle = function (g, x, y, px) {
    const ROWS = [
      '..####...', '.######..', '#########', '#########', '#########',
      '##.###.##', '##.###.##', '.#...#...',
    ];
    g.save();
    for (let r = 0; r < ROWS.length; r++) {
      for (let c = 0; c < ROWS[r].length; c++) {
        if (ROWS[r][c] !== '#') continue;
        g.fillStyle = 'hsl(' + ((c * 34 + r * 16) % 360) + ',80%,58%)';
        g.fillRect(x + c * px - px * 4.5, y + r * px - px * 4, px + 0.6, px + 0.6);
      }
    }
    // trunk curling up on the right
    g.strokeStyle = 'hsl(150,70%,52%)'; g.lineWidth = px * 0.9; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x + px * 4.2, y - px * 1.5);
    g.quadraticCurveTo(x + px * 6.4, y - px * 1.2, x + px * 5.6, y - px * 3.4);
    g.stroke();
    g.restore();
  };

  /* the badge is the real logo file, not a redrawing of it */
  A.badge = function (g, cx, cy, r, rev, t) {
    rev = rev === undefined ? 1 : clamp(rev, 0, 1);
    if (rev <= 0.001) return;
    g.save();
    A.shadow(g, cx, cy + r * 0.94, r * 0.86 * rev, r * 0.13 * rev, 0.13 * rev);
    A.sprite(g, 'badge', cx, cy, r * rev, { alpha: rev });
    g.restore();
  };

  window.ABEArt = A;
})();
