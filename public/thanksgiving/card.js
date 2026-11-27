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
      to: 'A Thanksgiving card for you', sub: 'About 20 seconds · no sound', open: '▶  Open the card',
      lh: 'Happy Thanksgiving', lp: 'Thank you for standing with us and believing in us.', lsig: 'With gratitude,',
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
      tagline: 'Building a New Inclusive World', visit: 'Visit our website',
      games: 'Games', learn: 'Learning Center', events: 'Events', follow: 'Follow along',
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
      to: 'Una tarjeta de Acción de Gracias para ti', sub: 'Unos 20 segundos · sin sonido', open: '▶  Abrir la tarjeta',
      lh: 'Feliz Día de Acción de Gracias', lp: 'Gracias por estar a nuestro lado y por creer en nosotros.', lsig: 'Con gratitud,',
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
      tagline: 'Construyendo un Nuevo Mundo Inclusivo', visit: 'Visita nuestro sitio web',
      games: 'Juegos', learn: 'Centro de Aprendizaje', events: 'Eventos', follow: 'Síguenos',
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

  // food resting on the tabletop, with a soft shadow so it sits rather than floats
  const food = (name, cx, bottom, w) => `<ellipse cx="${cx}" cy="${bottom - 1.5}" rx="${(w * .44).toFixed(1)}" ry="${(w * .075).toFixed(1)}" fill="#7a3d12" opacity=".22"/>${spr(name, cx, bottom, w)}`;

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
      ${[[-60, -70, 'leaf_maple_orange'], [-26, -96, 'leaf_oak_gold'], [30, -92, 'leaf_maple_red'], [64, -64, 'leaf_brown'], [4, -110, 'leaf_maple_orange']]
        .map(([kx, ky, n], i) => `<g class="kick" style="--kx:${kx}px;--ky:${ky}px;animation-delay:${1.1 + i * .03}s">${spr(n, 200, 418, 22)}</g>`).join('')}
      <g class="hop">${spr('nilu_wave', 200, 418, 250, 'dance')}</g>
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
        ${food('pie', 116, 311, 54)}${food('rolls', 180, 309, 44)}${food('plate', 242, 312, 38)}${food('corn_cob', 296, 310, 30)}${food('mini_pumpkin', 342, 310, 32)}
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
      ${food('rolls', 180, 328, 38)}${food('plate', 224, 330, 34)}${food('pie', 318, 330, 48)}
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
      <defs><linearGradient id="gold5" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".3" stop-color="#f2c14e"/>
        <stop offset=".55" stop-color="#d99a1e"/><stop offset=".8" stop-color="#f8d66d"/><stop offset="1" stop-color="#b9780f"/></linearGradient>
        <radialGradient id="halo5"><stop offset=".7" stop-color="#ffd76a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient></defs>
      <g class="pop" style="animation-delay:.1s">
        <circle cx="200" cy="188" r="160" fill="url(#halo5)"/>
        <circle cx="200" cy="188" r="133" fill="#fff" stroke="url(#gold5)" stroke-width="11"/>
        <circle cx="200" cy="188" r="141" fill="none" stroke="#e0a526" stroke-width="1.6" opacity=".7"/>
        <circle cx="200" cy="188" r="125" fill="none" stroke="#b9780f" stroke-width="1.2" opacity=".5"/>
        <g class="spin"><circle cx="200" cy="188" r="133" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="26 810" opacity=".85"/></g>
        <image href="badge.webp" x="78" y="66" width="244" height="248"/>
      </g>
      ${twinkle(64, 110, 1.1, 0)}${twinkle(338, 96, 1.3, .7)}${twinkle(48, 244, .8, 1.4)}${twinkle(356, 230, .9, .4)}${twinkle(112, 62, .7, 1.1)}${twinkle(300, 312, .75, 1.8)}
      <g class="pop" style="animation-delay:.9s"><g transform="translate(200,346)">
        <path d="M${-rw / 2 - 22},4 l18,-14 v28 z M${rw / 2 + 22},4 l-18,-14 v28 z" fill="#c25a2c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <rect x="${-rw / 2}" y="-18" width="${rw}" height="38" rx="10" fill="${INK}"/>
        <text y="8" text-anchor="middle" font-size="21" font-weight="900" fill="#ffd43b" font-family="${FONT}" letter-spacing=".5">✦ ${esc(shine)} ✦</text></g></g>
      ${spr('pie', 84, 432, 76, 'pop', 'animation-delay:1.3s')}${spr('corn_cob', 200, 434, 40, 'pop', 'animation-delay:1.5s')}${spr('mini_pumpkin', 318, 434, 62, 'pop', 'animation-delay:1.7s')}
      ${heart(70, 0)}${heart(330, 1.1)}${heart(150, 2.2)}${heart(252, .6)}`;
  }

  const SOCIAL = [
    ['Facebook', 'https://www.facebook.com/groups/1699307761026480', '#1877F2', 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'],
    ['Instagram', 'https://www.instagram.com/aariasblueelephant/', '#E4405F', 'M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.351-.2 6.77-2.618 6.97-6.98.058-1.28.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.352-2.618-6.77-6.98-6.97C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z'],
    ['X', 'https://x.com/AariasBlue', '#000000', 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'],
    ['YouTube', 'https://www.youtube.com/@AariasBlueElephant', '#FF0000', 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'],
    ['LinkedIn', 'https://www.linkedin.com/in/aariasblueelephant/', '#0077B5', 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z'],
    ['TikTok', 'https://www.tiktok.com/@aariasblueelephant0', '#000000', 'M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.13-.24-2.32-.2-3.35.35-1.01.55-1.74 1.6-1.9 2.73-.13.78-.04 1.58.26 2.3.43 1.05 1.34 1.86 2.39 2.22 1.01.35 2.14.33 3.13-.08 1.04-.49 1.82-1.45 2.1-2.54.12-.56.12-1.13.12-1.7 0-3.67-.01-7.33 0-11zm0 0'],
    ['WhatsApp', 'https://chat.whatsapp.com/FPEmQYA8TKd4wzRGB5PXtb', '#25D366', 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'],
  ];
  // the last screen's "stay connected": the website first, then the main sections, then socials
  const connect = () => `
    <div class="connect line">
      <a class="site" href="/">
        <img src="/hero-logo.jpg" alt="">
        <span class="sitetxt"><b>Aaria's Blue Elephant</b><small>${t('tagline')}</small>
          <span class="url">${t('visit')}: aariasblueelephant.org →</span></span>
      </a>
      <nav class="quick" aria-label="${esc(t('visit'))}">
        <a href="/games"><span aria-hidden="true">🎮</span>${t('games')}</a>
        <a href="/videos"><span aria-hidden="true">🎓</span>${t('learn')}</a>
        <a href="/events"><span aria-hidden="true">🗓️</span>${t('events')}</a>
      </nav>
      <p class="follow">${t('follow')}</p>
      <div class="socials">${SOCIAL.map(([n, u, c, d]) =>
        `<a href="${u}" target="_blank" rel="noopener" aria-label="${n}" title="${n}" style="--c:${c}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg></a>`).join('')}</div>
    </div>`;

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
        </div>
        <p class="save line">${t('save')}</p>
        ${connect()}`,
    },
  ];
  const SPEED = 1.35;   // the whole film plays this much faster than the timings written above
  SCENES.forEach(s => { s.ms = Math.round(s.ms / SPEED); });
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
    // quiet links under the card for anyone who doesn't open it; hidden on the last screen, which has the full block
    $('footlinks').innerHTML = `
      <a class="web" href="/">🌐 aariasblueelephant.org <span aria-hidden="true">→</span></a>
      <div class="fl-row">
        <a href="/games">🎮 ${t('games')}</a><a href="/videos">🎓 ${t('learn')}</a><a href="/events">🗓️ ${t('events')}</a>
      </div>
      <div class="fl-row fl-soc">${SOCIAL.map(([n, u, c, d]) =>
        `<a href="${u}" target="_blank" rel="noopener" aria-label="${n}" title="${n}" style="--c:${c}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg></a>`).join('')}</div>`;
    langBtn.textContent = '🌐 ' + t('langBtn');
    const leafImg = (n, l, tp, w, d) => `<img class="lf" src="art/${n}.webp" alt="" style="left:${l}%;top:${tp}%;width:${w}%;animation-delay:${d}s">`;
    cover.innerHTML = `
      ${leafImg('leaf_maple_red', 5, 8, 9, 0)}${leafImg('leaf_oak_gold', 86, 5, 8, .9)}${leafImg('leaf_maple_orange', 3, 50, 8, 1.6)}${leafImg('leaf_brown', 88, 44, 7, .5)}
      <div class="env" aria-hidden="true"><div class="env-back"></div><div class="env-flap"></div></div>
      <div class="letter">
        <img src="badge.webp" alt="">
        <h1>${esc(t('lh'))}</h1>
        <p>${esc(t('lp'))}</p>
        <p class="sig">${esc(t('lsig'))}<br>Aaria's Blue Elephant</p>
      </div>
      <div class="env" style="z-index:1" aria-hidden="true"><div class="env-front"></div></div>
      <img class="peek-nilu" src="art/nilu_welcome.webp" alt="">
      <button class="env-btn" type="button"><span>${esc(t('open'))}</span></button>
      <p class="env-sub">${esc(t('sub'))}</p>`;
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
      if (j === i) {
        el.classList.remove('on'); void el.getBoundingClientRect(); el.classList.add('on');
        // speed up the scripted moments; leave the gentle loops (bobbing, falling leaves) at their own pace
        if (el.getAnimations) el.getAnimations({ subtree: true }).forEach(a => {
          const it = a.effect && a.effect.getTiming().iterations;
          if (it !== Infinity) a.playbackRate = SPEED;
        });
      } else el.classList.remove('on');
    });
    cap.innerHTML = SCENES[i].cap();
    document.body.classList.toggle('atend', i === SCENES.length - 1);
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
    setTimeout(() => { go(0); setTimeout(play, 500); }, 900);
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
