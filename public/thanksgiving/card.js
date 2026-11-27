/* © 2026 Aaria's Blue Elephant — Thanksgiving card
   An envelope, then a 30-second film in five scenes played in one stretch.
   Every scene is an SVG on a 400×440 stage in the badge's style; CSS runs the
   motion, and only on the scene that is showing.
   Built by Aaria and her Friends 💙 */
(function () {
  'use strict';

  /* ── words ───────────────────────────────────────────────────────────── */
  let lang = 'en';
  try { lang = localStorage.getItem('abe.lang') === 'es' ? 'es' : 'en'; } catch (e) { /* private mode */ }
  const q = new URLSearchParams(location.search);
  if (q.get('lang') === 'es' || q.get('lang') === 'en') lang = q.get('lang');

  const T = {
    en: {
      eyebrow: "Happy Thanksgiving · 2026",
      to: 'A Thanksgiving card for you', sub: 'About 30 seconds · no sound', open: '▶  Open the card',
      h1: 'Happy Thanksgiving!', h1sub: "With love from all of us at Aaria's Blue Elephant.",
      p2: 'The Wampanoag shared what they knew: plant corn, beans and squash together, and each one helps the others grow.',
      p2note: 'The Three Sisters, a tradition of many Native nations.',
      corn: 'corn', beans: 'beans', squash: 'squash',
      p3a: 'Different, and stronger together.', p3b: 'So everyone comes just as they are… and the table keeps getting longer.',
      b1: 'Am I… dinner?', b2: 'You’re a GUEST!', b3: 'MORE PIE.',
      p4a: 'Everyone gets a seat.', p4b: 'Even the turkey.',
      p5: 'Thank you for walking with 150+ families in 2026.',
      p5b: 'We can’t wait to see what we grow together next year.',
      shine: 'Every Star Shines',
      plan: '🗓️  See our 2027 plan', give: '💙  Give thanks with a gift',
      save: 'Save the date: GivingTuesday is Tuesday, Dec. 1',
      pause: 'Pause', play: 'Play', again: '↺ Replay', langBtn: 'Español',
      alt: ['Nilu the baby blue elephant waving in an autumn field',
            'Corn, beans and squash growing together',
            'Aaria and friends at a Thanksgiving table that Nilu keeps stretching longer',
            'A nervous turkey is welcomed to the table as a guest',
            "The Aaria's Blue Elephant badge, Building a New Inclusive World, with the words Every Star Shines"],
      og1: 'Happy Thanksgiving!', og2: 'Everyone gets a seat.', og3: 'Even the turkey.',
    },
    es: {
      eyebrow: "Feliz Acción de Gracias · 2026",
      to: 'Una tarjeta de Acción de Gracias para ti', sub: 'Unos 30 segundos · sin sonido', open: '▶  Abrir la tarjeta',
      h1: '¡Feliz Día de Acción de Gracias!', h1sub: "Con cariño de todos en Aaria's Blue Elephant.",
      p2: 'Los wampanoag compartieron lo que sabían: siembra maíz, frijol y calabaza juntos, y cada uno ayuda a crecer a los demás.',
      p2note: 'Las Tres Hermanas, una tradición de muchas naciones indígenas.',
      corn: 'maíz', beans: 'frijol', squash: 'calabaza',
      p3a: 'Diferentes, y más fuertes juntos.', p3b: 'Así que cada quien llega tal como es… y la mesa se sigue alargando.',
      b1: '¿Soy… la cena?', b2: '¡Eres INVITADO!', b3: '¡MÁS PASTEL!',
      p4a: 'Todos tienen un lugar.', p4b: 'Hasta el pavo.',
      p5: 'Gracias por acompañar a más de 150 familias en 2026.',
      p5b: 'Ya queremos ver lo que creceremos juntos el próximo año.',
      shine: 'Cada estrella brilla',
      plan: '🗓️  Ver nuestro plan 2027', give: '💙  Da gracias con un donativo',
      save: 'Aparta la fecha: GivingTuesday es el martes 1 de dic.',
      pause: 'Pausa', play: 'Reproducir', again: '↺ Repetir', langBtn: 'English',
      alt: ['Nilu, el elefantito azul, saluda en un campo de otoño',
            'Maíz, frijol y calabaza crecen juntos',
            'Aaria y sus amigos en una mesa que Nilu sigue alargando',
            'Un pavo nervioso es recibido en la mesa como invitado',
            "El escudo de Aaria's Blue Elephant, Building a New Inclusive World, con las palabras Cada estrella brilla"],
      og1: '¡Feliz Día de Acción de Gracias!', og2: 'Todos tienen un lugar.', og3: 'Hasta el pavo.',
    },
  };
  const t = (k) => T[lang][k];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  /* ── palette (from the badge) ────────────────────────────────────────── */
  const INK = '#16255c', LINE = '#1d5fa3', BODY = '#4aa8e0', RUST = '#b4532a';
  const ZEFFY = 'https://www.zeffy.com/en-US/donation-form/aariasblueelephant';
  const FONT = 'ui-rounded, Nunito, system-ui, sans-serif';

  /* ── artwork (Gemini-made stickers in art/, sizes in art/sizes.js) ───── */
  const ART = window.ABE_ART || {};
  // a sprite placed by its bottom-centre, w wide; cls/style wrap it for animation
  function spr(name, cx, bottom, w, cls, style) {
    const [W, H] = ART[name] || [1, 1];
    const h = w * H / W;
    const img = `<image href="art/${name}.webp" x="${(cx - w / 2).toFixed(1)}" y="${(bottom - h).toFixed(1)}" width="${w}" height="${h.toFixed(1)}"/>`;
    return cls ? `<g class="${cls}"${style ? ` style="${style}"` : ''}>${img}</g>` : img;
  }
  const bg = (name) => `<g class="kb"><image href="art/${name}.webp" x="-4" y="-4" width="408" height="448" preserveAspectRatio="xMidYMid slice"/></g>`;
  const aaria = (cx, bottom, w, cls, style) => {
    const h = w * 566 / 360;
    const img = `<image href="aaria.webp" x="${cx - w / 2}" y="${(bottom - h).toFixed(1)}" width="${w}" height="${h.toFixed(1)}"/>`;
    return cls ? `<g class="${cls}" style="${style || ''}">${img}</g>` : img;
  };

  const LEAVES = ['leaf_maple_orange', 'leaf_maple_red', 'leaf_oak_gold', 'leaf_brown'];
  // tumbling leaves; `after` starts them at that second instead of mid-fall
  function leaves(n, seed, after) {
    let s = seed || 7, out = '';
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) {
      const x = 16 + r() * 368, w = 18 + r() * 16, dur = 7 + r() * 5, sw = 1.6 + r() * 1.4;
      const del = after != null ? after + r() * 1.2 : -r() * 12;
      out += `<g transform="translate(${x.toFixed(0)},0)"><g class="fall" style="animation-duration:${dur.toFixed(1)}s;animation-delay:${del.toFixed(1)}s">
        <g class="sway" style="animation-duration:${sw.toFixed(1)}s">${spr(LEAVES[i % 4], 0, 10, w)}</g></g></g>`;
    }
    return out;
  }
  const twinkle = (x, y, sc, d) => `<g transform="translate(${x},${y}) scale(${sc})"><g class="twinkle" style="animation-delay:${d}s">
    <path d="M0,-12 C1.5,-3 3,-1.5 12,0 C3,1.5 1.5,3 0,12 C-1.5,3 -3,1.5 -12,0 C-3,-1.5 -1.5,-3 0,-12 Z" fill="#ffd43b" stroke="${RUST}" stroke-width="1.2" stroke-linejoin="round"/></g></g>`;
  const note = (x, y, d) => `<g transform="translate(${x},${y})"><g class="note" style="animation-delay:${d}s"><text font-size="18" fill="#7c3aed" font-family="${FONT}">♪</text></g></g>`;
  const bubble = (cls, x, y, w, txt, tail) => `<g class="bubble ${cls}"><g transform="translate(${x},${y})">
    <rect x="${-w / 2}" y="-20" width="${w}" height="36" rx="16" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
    <path d="${tail}" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="${-w / 2 + 3}" y="6" width="${w - 6}" height="8" fill="#fff"/>
    <text y="4" text-anchor="middle" font-size="16" font-weight="900" fill="${INK}" font-family="${FONT}">${esc(txt)}</text></g></g>`;

  /* ── the five scenes ─────────────────────────────────────────────────── */
  function s1() {
    return `
      ${bg('bg_field')}
      ${leaves(8, 3)}
      ${spr('mini_pumpkin', 46, 432, 64, 'pop', 'animation-delay:.9s')}
      ${spr('mini_pumpkin', 352, 438, 80, 'pop', 'animation-delay:1.1s')}
      <g class="hop">${spr('nilu_wave', 200, 418, 250, 'bob')}</g>
      ${twinkle(96, 236, .8, 1.2)}${twinkle(318, 214, 1, 1.6)}${twinkle(286, 160, .6, 2)}`;
  }

  function s2() {
    const stalk = (cx, w, d) => `<g class="grow" style="animation-delay:${d}s">${spr('corn_stalk', cx, 374, w, 'plantsway', `animation-delay:${d + 1.6}s`)}</g>`;
    const tag = (x, y, txt, d) => `<g class="pop" style="animation-delay:${d}s"><g transform="translate(${x},${y})">
      <rect x="-38" y="-13" width="76" height="25" rx="12.5" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <text y="4.5" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}" font-family="${FONT}">${esc(txt)}</text></g></g>`;
    return `
      ${bg('bg_garden')}
      ${spr('soil_mound', 200, 398, 300, 'pop', 'animation-delay:0s')}
      ${stalk(128, 92, .2)}${stalk(272, 96, .45)}${stalk(200, 110, .3)}
      <g class="grow slow" style="animation-delay:1.4s">${spr('bean_vine', 210, 376, 70, 'plantsway', 'animation-delay:3.6s')}</g>
      ${spr('squash_plant', 70, 434, 120, 'pop', 'animation-delay:2.7s')}
      ${spr('squash_plant', 334, 436, 124, 'pop', 'animation-delay:3s')}
      ${tag(96, 140, t('corn'), 3.7)}${tag(300, 196, t('beans'), 3.9)}${tag(340, 300, t('squash'), 4.1)}`;
  }

  function s3() {
    return `
      ${bg('bg_room')}
      ${aaria(102, 314, 80, 'pop', 'animation-delay:2.1s')}
      <g class="pop" style="animation-delay:2.4s">${spr('kid_headphones', 170, 306, 86, 'bob')}</g>
      ${note(190, 214, 2.8)}${note(146, 206, 3.4)}
      <g class="pop" style="animation-delay:2.7s">${spr('kid_flapping', 240, 306, 104, 'wiggle')}</g>
      ${spr('kid_tablet', 308, 306, 86, 'pop', 'animation-delay:3s')}
      <g class="stretch">${spr('table', 214, 394, 330)}</g>
      <g class="pop" style="animation-delay:1.9s">
        ${spr('pie', 116, 300, 54)}${spr('rolls', 180, 298, 44)}${spr('plate', 242, 300, 38)}${spr('corn_cob', 296, 298, 30)}${spr('mini_pumpkin', 342, 298, 32)}
      </g>
      <g class="pull">${spr('nilu_reach', 386, 404, 148)}</g>
      ${spr('kid_wheelchair', 44, 434, 104, 'pop', 'animation-delay:3.3s')}`;
  }

  function s4() {
    return `
      ${bg('bg_room')}
      ${spr('turkey_seated', 222, 318, 100, 'seated')}
      ${aaria(296, 322, 72)}
      ${spr('kid_tablet', 362, 314, 80)}
      ${spr('table', 286, 398, 270)}
      ${spr('rolls', 178, 306, 38)}${spr('plate', 222, 308, 34)}${spr('pie', 318, 308, 48)}
      <g class="peek">${spr('turkey_nervous', 248, 438, 124, 'tn')}</g>
      ${spr('turkey_fainted', 236, 440, 138, 'tf')}
      <g class="bob">${spr('nilu_welcome', 84, 438, 168)}</g>
      ${bubble('b1', 214, 284, 150, t('b1'), 'M14,14 L32,40 L36,14 Z')}
      ${bubble('b2', 112, 250, 168, t('b2'), 'M-26,14 L-34,40 L-6,14 Z')}
      ${bubble('b3', 322, 176, 138, t('b3'), 'M22,14 L40,40 L44,14 Z')}
      ${leaves(14, 21, 6.2)}`;
  }

  function s5() {
    const heart = (x, d) => `<g transform="translate(${x},350)"><g class="heart" style="animation-delay:${d}s"><path d="M0,6 C-14,-6 -8,-18 0,-10 C8,-18 14,-6 0,6Z" fill="${BODY}" stroke="${LINE}" stroke-width="1.5"/></g></g>`;
    const shine = t('shine');
    const rw = Math.max(210, shine.length * 13 + 60);
    return `
      <defs><radialGradient id="glow5" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#fde4c2"/></radialGradient></defs>
      <rect width="400" height="440" fill="url(#glow5)"/>
      ${leaves(7, 11)}
      <circle cx="200" cy="190" r="136" fill="#a9dcf5" opacity=".35"/>
      <g class="pop" style="animation-delay:.2s"><image href="badge.webp" x="76" y="62" width="248" height="252"/></g>
      ${twinkle(64, 110, 1.1, 0)}${twinkle(338, 96, 1.3, .7)}${twinkle(48, 244, .8, 1.4)}${twinkle(356, 230, .9, .4)}${twinkle(112, 62, .7, 1.1)}${twinkle(300, 312, .75, 1.8)}
      <g class="pop" style="animation-delay:.9s"><g transform="translate(200,346)">
        <path d="M${-rw / 2 - 22},4 l18,-14 v28 z M${rw / 2 + 22},4 l-18,-14 v28 z" fill="#c25a2c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <rect x="${-rw / 2}" y="-18" width="${rw}" height="38" rx="10" fill="${INK}"/>
        <text y="8" text-anchor="middle" font-size="21" font-weight="900" fill="#ffd43b" font-family="${FONT}" letter-spacing=".5">✦ ${esc(shine)} ✦</text></g></g>
      ${spr('pie', 84, 432, 76, 'pop', 'animation-delay:1.3s')}${spr('corn_cob', 200, 434, 40, 'pop', 'animation-delay:1.5s')}${spr('mini_pumpkin', 318, 434, 62, 'pop', 'animation-delay:1.7s')}
      ${heart(70, 0)}${heart(330, 1.1)}${heart(150, 2.2)}${heart(252, .6)}`;
  }

  /* ── the film ────────────────────────────────────────────────────────── */
  const SCENES = [
    { art: s1, ms: 5200, cap: () => `<h1 class="line">${t('h1')}</h1><p class="line">${t('h1sub')}</p>` },
    { art: s2, ms: 7200, cap: () => `<h2 class="line">${t('p2')}</h2><p class="line note">${t('p2note')}</p>` },
    { art: s3, ms: 6800, cap: () => `<h2 class="line">${t('p3a')}</h2><p class="line">${t('p3b')}</p>` },
    { art: s4, ms: 9000, cap: () => `<p class="big line">${t('p4a')}<br><em>${t('p4b')}</em></p>` },
    {
      art: s5, ms: 0,
      cap: () => `<h2 class="line">${t('p5')}</h2><p class="line">${t('p5b')}</p>
        <div class="ctas line">
          <a class="btn primary" href="/events/2027">${t('plan')}</a>
          <a class="btn soft" href="${ZEFFY}" target="_blank" rel="noopener">${t('give')}</a>
        </div>
        <p class="save line">${t('save')}</p>`,
    },
  ];
  const TIMED = SCENES.filter(s => s.ms).length;

  const $ = (id) => document.getElementById(id);
  const card = $('card'), scenesEl = $('scenes'), cap = $('cap'), prog = $('prog'), cover = $('cover');
  const pp = $('pp'), again = $('again'), langBtn = $('lang');
  let cur = -1, elapsed = 0, playing = false, last = 0, raf = 0, opened = false;

  function build() {
    document.documentElement.lang = lang;
    $('eyebrow').textContent = t('eyebrow');
    scenesEl.innerHTML = SCENES.map((s, i) =>
      `<div class="scene" data-i="${i}"><svg viewBox="0 0 400 440" aria-hidden="true">${s.art()}</svg></div>`).join('');
    prog.innerHTML = Array.from({ length: TIMED }, () => '<i><b></b></i>').join('');
    again.textContent = t('again');
    langBtn.textContent = '🌐 ' + t('langBtn');
    cover.innerHTML = `
      <svg class="coverart" viewBox="0 0 300 230" aria-hidden="true">
        <circle cx="150" cy="128" r="96" fill="#a9dcf5" opacity=".45"/>
        ${spr('leaf_maple_red', 58, 66, 30, 'twinkle')}${spr('leaf_oak_gold', 250, 52, 26, 'twinkle', 'animation-delay:.8s')}${spr('leaf_maple_orange', 262, 196, 28, 'twinkle', 'animation-delay:1.4s')}
        ${spr('mini_pumpkin', 66, 222, 52)}
        <g class="bob">${spr('nilu_welcome', 156, 222, 210)}</g>
      </svg>
      <p class="to">${esc(t('to'))}</p>
      <p class="sub">${esc(t('sub'))}</p>
      <button type="button">${esc(t('open'))}</button>`;
    $('scenes').setAttribute('aria-label', t('alt')[Math.max(cur, 0)]);
  }

  function setPP() {
    const end = cur === SCENES.length - 1;
    pp.disabled = end || !opened;
    pp.textContent = playing ? '❚❚' : '▶';
    pp.setAttribute('aria-label', playing ? t('pause') : t('play'));
    card.classList.toggle('paused', !playing && !end);
  }

  function go(i) {
    cur = i; elapsed = 0;
    scenesEl.querySelectorAll('.scene').forEach((el, j) => {
      if (j === i) { el.classList.remove('on'); void el.getBoundingClientRect(); el.classList.add('on'); }
      else el.classList.remove('on');
    });
    cap.innerHTML = SCENES[i].cap();
    scenesEl.setAttribute('aria-label', t('alt')[i]);
    drawProgress();
    setPP();
  }

  function drawProgress() {
    prog.querySelectorAll('b').forEach((b, j) => {
      const f = j < cur ? 1 : j > cur ? 0 : Math.min(1, elapsed / SCENES[cur].ms);
      b.style.width = (f * 100).toFixed(1) + '%';
    });
  }

  function tick(now) {
    raf = 0;
    if (!playing) return;
    elapsed += now - last; last = now;
    const s = SCENES[cur];
    if (s.ms && elapsed >= s.ms) {
      go(cur + 1);
      if (!SCENES[cur].ms) { playing = false; setPP(); drawProgress(); return; }
    }
    drawProgress();
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (!opened || cur === SCENES.length - 1) return;
    playing = true; last = performance.now(); setPP();
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function pause() { playing = false; setPP(); }

  function open() {
    if (opened) return;
    opened = true;
    cover.classList.add('open');
    go(0);
    setTimeout(play, 650);
  }

  cover.addEventListener('click', open);
  pp.addEventListener('click', () => (playing ? pause() : play()));
  again.addEventListener('click', () => { if (!opened) { open(); return; } go(0); play(); });
  scenesEl.addEventListener('click', () => { if (opened && cur < SCENES.length - 1) (playing ? pause() : play()); });
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { if (!opened) { e.preventDefault(); open(); } else if (e.target === document.body) { e.preventDefault(); playing ? pause() : play(); } }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });
  langBtn.addEventListener('click', () => {
    lang = lang === 'en' ? 'es' : 'en';
    try { localStorage.setItem('abe.lang', lang); } catch (e) { /* ignore */ }
    const was = cur, wasPlaying = playing;
    pause(); build();
    if (opened) { cover.classList.add('open'); go(Math.max(was, 0)); if (wasPlaying) play(); }
  });

  build();
  setPP();

  // ?s=N (1–5) skips the envelope and opens on that scene, paused — for checks
  const startAt = parseInt(q.get('s') || '0', 10);
  if (startAt >= 1 && startAt <= SCENES.length) {
    opened = true; cover.classList.add('open'); go(startAt - 1);
    if (q.has('play')) play(); else setPP();
  }

  // ?og renders the 1200×630 share image (see scripts in the PR)
  if (q.has('og')) {
    document.body.classList.add('og');
    document.body.innerHTML = `<div id="og"><div class="ogart"><svg viewBox="0 0 400 440">${s4()}</svg></div>
      <div class="ogtxt"><img src="/abe-logo-badge.png" alt=""><h1>${t('og1')}</h1><p>${t('og2')}<br><b>${t('og3')}</b></p>
      <span>aariasblueelephant.org/thanksgiving</span></div></div>`;
  }
})();
