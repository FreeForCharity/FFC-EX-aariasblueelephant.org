/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   OUR FIRST YEAR — the projector  (window.ABEStory)

   Runs the chapters in scenes.js on a fixed 1920x1080 stage.

   The one rule that matters here: renderAt(ms) is a PURE FUNCTION of the
   clock. Play it, scrub it, or step it a frame at a time from a script — the
   same millisecond always produces the same picture. That is what lets this
   become a video: either press ⏺ (records straight to .webm in the browser)
   or run scripts/story-frames.mjs, which steps renderAt() frame by frame and
   hands the PNGs to ffmpeg.

   Nothing is drawn on the canvas except the film itself — every control lives
   in the DOM outside it, so the exported frames are always clean.

   Built by Aaria and her Friends 💙 */
(function () {
  "use strict";

  const A = window.ABEArt, W = window.ABEProps, P = A.P;
  const SCENES = window.ABEStoryScenes;
  const $ = (id) => document.getElementById(id);
  const ES = !!(window.ABELang && window.ABELang.es);
  const T = (en, es) => (ES ? es : en);

  const STAGE_W = 1920, STAGE_H = 1080;
  const FADE = 0.55;               // seconds of dip-to-white between chapters

  /* chapter start times, and the total running time */
  let acc = 0;
  const STARTS = SCENES.map((s) => { const a = acc; acc += s.dur; return a; });
  const DURATION = acc;

  /* ─────────────────────────────────────────────────────── original photos */
  /* Drop real photos into public/story/photos/ — see the README in there.
     Anything missing just draws an empty frame, so the film always runs. */
  const PHOTO_KEYS = ['gatherings', 'easter', 'circle', 'parksrec', 'softball', 'family', 'aaria'];
  const EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.PNG'];
  const photos = {};
  let photosPending = 0;
  function loadPhoto(key, i) {
    if (i >= EXTS.length) { photosPending--; return; }
    const img = new Image();
    img.onload = () => { photos[key] = img; photosPending--; };
    img.onerror = () => loadPhoto(key, i + 1);
    img.src = 'photos/' + key + EXTS[i];
  }
  PHOTO_KEYS.forEach((k) => { photosPending++; loadPhoto(k, 0); });
  const SHARED = { photo: (k) => photos[k] || null, T: T, es: ES };

  /* ───────────────────────────────────────────────────────────── the stage */
  const cv = $('stage');
  cv.width = STAGE_W; cv.height = STAGE_H;
  const g = cv.getContext('2d', { alpha: false });

  function wrap(str, size, maxW) {
    g.save();
    g.font = '900 ' + size + 'px ' + A.FONT;
    const words = String(str).split(' ');
    const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    g.restore();
    return lines;
  }

  function drawKicker(sc, t, alpha) {
    if (!sc.kicker) return;
    const a = alpha * A.eo(A.at(t, 0.3, 1.2)) * (1 - A.at(t, sc.dur - 1.4, sc.dur - 0.5));
    if (a <= 0.01) return;
    const label = T(sc.kicker.en, sc.kicker.es);
    g.save();
    g.globalAlpha = a;
    g.font = '900 38px ' + A.FONT;
    const w = g.measureText(label).width + 62;
    A.rr(g, 72, 64, w, 74, 37);
    g.fillStyle = 'rgba(255,255,255,.92)'; g.fill();
    g.strokeStyle = A.alpha(P.ink, 0.15); g.lineWidth = 3; g.stroke();
    A.text(g, label, 72 + w / 2, 102, 38, { color: P.ink });
    g.restore();
  }

  function drawCaption(sc, t, alpha) {
    if (!sc.caps || !sc.caps.length) return;
    // exactly one caption on screen at a time: the latest one that has started
    let c = null;
    for (const k of sc.caps) if (t >= k.a && k.a >= (c ? c.a : -1)) c = k;
    if (c && t <= c.b) {
      const fade = Math.min(A.eo(A.at(t, c.a, c.a + 0.3)), 1 - A.eo(A.at(t, c.b - 0.3, c.b)));
      if (fade <= 0.01) return;
      const size = 46;
      const lines = wrap(T(c.en, c.es), size, 1520);
      const lh = size * 1.32;
      const boxH = lines.length * lh + 42;
      const y0 = STAGE_H - 78 - boxH;
      let maxW = 0;
      g.save(); g.font = '900 ' + size + 'px ' + A.FONT;
      lines.forEach((l) => { maxW = Math.max(maxW, g.measureText(l).width); });
      g.restore();
      const boxW = maxW + 76;
      g.save();
      g.globalAlpha = fade;
      A.rr(g, (STAGE_W - boxW) / 2, y0, boxW, boxH, 28);
      g.fillStyle = 'rgba(255,255,255,.93)'; g.fill();
      g.strokeStyle = A.alpha(P.ink, 0.12); g.lineWidth = 3; g.stroke();
      lines.forEach((l, i) => A.text(g, l, STAGE_W / 2, y0 + 21 + lh * (i + 0.5), size, { color: P.ink }));
      g.restore();
    }
  }

  /* the one function the whole film hangs off */
  function renderAt(ms) {
    const time = A.clamp(ms / 1000, 0, DURATION - 0.001);
    let i = 0;
    while (i < SCENES.length - 1 && time >= STARTS[i + 1]) i++;
    const sc = SCENES[i];
    const t = time - STARTS[i];

    g.save();
    g.fillStyle = P.cream; g.fillRect(0, 0, STAGE_W, STAGE_H);
    /* A chapter may declare cam(t, u): where the camera is for this moment.
       It pushes in, drifts, moves the vanishing point — and hands its yaw to
       the 3D cast, so swinging the camera turns every person in the frame.
       It is applied here rather than inside each chapter so that a chapter
       can never leave the transform dirty. */
    let err = null;
    const cam = sc.cam ? W.cam(g, sc.cam(t, t / sc.dur)) : null;
    try { sc.draw(g, t, t / sc.dur, SHARED); } catch (e) { err = e; }
    if (cam) cam.end();
    if (err) {
      g.fillStyle = '#ffe9e9'; g.fillRect(0, 0, STAGE_W, STAGE_H);
      A.text(g, String(err && err.message || err), 960, 540, 30, { color: '#a33' });
      if (!renderAt._warned) { renderAt._warned = 1; console.error(sc.id, err); }
    }
    g.restore();

    drawKicker(sc, t, 1);
    drawCaption(sc, t, 1);

    // dip to white across every chapter boundary
    let dip = 0;
    if (t < FADE && i > 0) dip = 1 - t / FADE;
    if (t > sc.dur - FADE && i < SCENES.length - 1) dip = 1 - (sc.dur - t) / FADE;
    if (time < 0.9) dip = Math.max(dip, 1 - time / 0.9);
    if (time > DURATION - 1.2) dip = Math.max(dip, A.at(time, DURATION - 1.2, DURATION));
    if (dip > 0) { g.save(); g.fillStyle = 'rgba(255,255,255,' + dip + ')'; g.fillRect(0, 0, STAGE_W, STAGE_H); g.restore(); }
    return { index: i, scene: sc, t: t, time: time };
  }

  /* ─────────────────────────────────────────────────────────────── transport */
  let clock = 0, playing = false, speed = 1, last = 0, narrate = false, spoken = '';

  function fmt(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function speakCaption(sc, t) {
    if (!narrate || !window.speechSynthesis) return;
    let line = '';
    for (const c of sc.caps || []) if (t >= c.a && t < c.b) line = T(c.en, c.es);
    if (line && line !== spoken) {
      spoken = line;
      try {
        const u = new SpeechSynthesisUtterance(line.replace(/[💙🐘]/g, ''));
        u.rate = 0.92; u.pitch = 1.02;
        if (window.ABELang) window.ABELang.voice(u);
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (playing) {
      const dt = Math.min(0.1, (now - last) / 1000);
      clock += dt * speed * 1000;
      if (clock >= DURATION * 1000) { clock = DURATION * 1000; setPlaying(false); if (rec.on) stopRecording(); }
    }
    last = now;
    const st = renderAt(clock);
    speakCaption(st.scene, st.t);
    $('bar').style.width = (clock / (DURATION * 1000) * 100) + '%';
    $('time').textContent = fmt(clock / 1000) + ' / ' + fmt(DURATION);
    const ch = $('chapterName');
    if (ch.dataset.i !== String(st.index)) {
      ch.dataset.i = String(st.index);
      ch.textContent = (st.index + 1) + '. ' + (st.scene.kicker ? T(st.scene.kicker.en, st.scene.kicker.es) : T('Title', 'Título'));
      Array.from(document.querySelectorAll('.chip')).forEach((b, i) => b.classList.toggle('on', i === st.index));
    }
  }

  function setPlaying(p) {
    playing = p;
    $('play').innerHTML = p ? '⏸' : '▶';
    $('play').title = p ? T('Pause', 'Pausa') : T('Play', 'Reproducir');
    if (!p && window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} spoken = ''; }
  }
  function seek(ms) {
    clock = A.clamp(ms, 0, DURATION * 1000);
    spoken = '';
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
  }

  /* ───────────────────────────────────────────── record straight to a video */
  const rec = { on: false, mr: null, chunks: [] };
  function bestMime() {
    const want = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    for (const m of want) if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
    return '';
  }
  function startRecording() {
    if (!window.MediaRecorder || !cv.captureStream) {
      alert(T('This browser cannot record video. Use Chrome, or run scripts/story-frames.mjs for a frame-exact export.',
              'Este navegador no puede grabar video. Usa Chrome o ejecuta scripts/story-frames.mjs para una exportación exacta.'));
      return;
    }
    rec.chunks = [];
    const stream = cv.captureStream(30);
    rec.mr = new MediaRecorder(stream, { mimeType: bestMime(), videoBitsPerSecond: 12000000 });
    rec.mr.ondataavailable = (e) => { if (e.data && e.data.size) rec.chunks.push(e.data); };
    rec.mr.onstop = () => {
      const blob = new Blob(rec.chunks, { type: rec.chunks[0] ? rec.chunks[0].type : 'video/webm' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'aarias-blue-elephant-our-first-year.webm';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    rec.on = true;
    $('rec').classList.add('on');
    $('rec').innerHTML = '⏹';
    narrate = false; $('narrate').classList.remove('on');
    seek(0); setPlaying(true); speed = 1; $('speed').textContent = '1×';
    rec.mr.start(250);
  }
  function stopRecording() {
    if (!rec.on) return;
    rec.on = false;
    $('rec').classList.remove('on');
    $('rec').innerHTML = '⏺';
    try { rec.mr.stop(); } catch (e) {}
    setPlaying(false);
  }

  /* ──────────────────────────────────────────────────────────────── the UI */
  function buildChapters() {
    const box = $('chapters');
    SCENES.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = (i + 1) + '. ' + (s.kicker ? T(s.kicker.en, s.kicker.es) : T('Title', 'Título'));
      b.onclick = () => { seek(STARTS[i] * 1000); setPlaying(true); };
      box.appendChild(b);
    });
  }

  function fit() {
    const wrapEl = $('screen');
    if (!wrapEl) return;               // the page may have been taken over (harness mode)
    const pad = 24;
    const availW = wrapEl.clientWidth - pad, availH = wrapEl.clientHeight - pad;
    const sc = Math.min(availW / STAGE_W, availH / STAGE_H);
    cv.style.width = (STAGE_W * sc) + 'px';
    cv.style.height = (STAGE_H * sc) + 'px';
  }

  function wire() {
    $('play').onclick = () => setPlaying(!playing);
    $('back').onclick = () => seek(clock - 10000);
    $('fwd').onclick = () => seek(clock + 10000);
    $('restart').onclick = () => { seek(0); setPlaying(true); };
    $('speed').onclick = () => {
      speed = speed >= 2 ? 0.5 : speed === 0.5 ? 1 : 2;
      $('speed').textContent = speed + '×';
    };
    $('rec').onclick = () => (rec.on ? stopRecording() : startRecording());
    $('narrate').onclick = () => {
      narrate = !narrate; spoken = '';
      $('narrate').classList.toggle('on', narrate);
      if (!narrate && window.speechSynthesis) speechSynthesis.cancel();
    };
    $('full').onclick = () => {
      try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {}
    };
    $('clean').onclick = () => document.body.classList.toggle('clean');
    $('lang').onclick = () => window.ABELang.toggle();
    $('lang').textContent = window.ABELang.label();

    const track = $('track');
    const scrub = (e) => {
      const r = track.getBoundingClientRect();
      seek(A.clamp((e.clientX - r.left) / r.width, 0, 1) * DURATION * 1000);
    };
    let dragging = false;
    track.addEventListener('pointerdown', (e) => { dragging = true; track.setPointerCapture(e.pointerId); scrub(e); });
    track.addEventListener('pointermove', (e) => { if (dragging) scrub(e); });
    track.addEventListener('pointerup', () => { dragging = false; });

    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
      if (e.key === 'ArrowRight') seek(clock + (e.shiftKey ? 1000 / 30 : 5000));
      if (e.key === 'ArrowLeft') seek(clock - (e.shiftKey ? 1000 / 30 : 5000));
      if (e.key === 'Home') seek(0);
      if (e.key === 'c') document.body.classList.toggle('clean');
      if (e.key === 'f') $('full').click();
    });
    window.addEventListener('resize', fit);
  }

  /* ─────────────────────────────────────────────────────────────── start up */
  buildChapters();
  wire();
  fit();

  const q = new URLSearchParams(location.search);
  if (q.has('clean')) document.body.classList.add('clean');
  if (q.has('scene')) {
    const i = SCENES.findIndex((s) => s.id === q.get('scene'));
    if (i >= 0) clock = STARTS[i] * 1000;
  }
  if (q.has('t')) clock = parseFloat(q.get('t')) * 1000;

  /* ?harness=1 loads the art kit and the chapters but never starts the loop,
     so a tool (scripts/tmp/*.mjs) can take the page over and draw test sheets
     on its own canvas without the projector running underneath it. */
  if (!q.has('harness')) {
    requestAnimationFrame(tick);
    // photos load in the background; nothing waits on them
    if (!q.has('paused')) setTimeout(() => setPlaying(true), 400);
  }

  window.ABEStory = {
    renderAt: renderAt,                 // renderAt(milliseconds) — pure
    DURATION: DURATION,                 // seconds
    STARTS: STARTS,
    scenes: SCENES,
    es: ES,
    seek: seek,
    canvas: cv,
    ready: () => photosPending === 0 && A.assetsReady() && document.fonts && document.fonts.status === 'loaded',
  };
})();
