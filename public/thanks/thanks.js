/* © 2026 Aaria's Blue Elephant — Thanksgiving card (window.ABEThanks)
   Five tap-through panels, each an SVG drawn on a 400×440 stage in the
   badge's style. CSS runs the animation, and only on the visible panel.
   Built by Aaria and her Friends 💙 */
(function () {
  'use strict';

  /* ── language (shared with the site and the games) ───────────────────── */
  let lang = 'en';
  try { lang = localStorage.getItem('abe.lang') === 'es' ? 'es' : 'en'; } catch (e) { /* private mode */ }
  const T = {
    en: {
      h1: 'Happy Thanksgiving!', h1sub: "from all of us at Aaria's Blue Elephant",
      p2: 'The Wampanoag shared what they knew: plant corn, beans and squash together, and each one helps the others grow.',
      p2small: 'The Three Sisters, a tradition of many Native nations.',
      corn: 'corn', beans: 'beans', squash: 'squash',
      p3a: 'Different, and stronger together.', p3b: 'So everyone comes just as they are… and the table keeps getting longer.',
      b1: 'Am I… dinner?', b2: 'You’re a GUEST!', b3: 'MORE PIE.',
      p4: 'Everyone gets a seat.', p4b: 'Even the turkey.',
      p5: 'Thank you for walking with 150+ families in 2026.',
      p5b: 'We can’t wait to see what we grow together next year.',
      plan: '🗓️ See our 2027 plan', give: '💙 Give thanks with a gift',
      save: 'Save the date: GivingTuesday is Tuesday, December 1.',
      again: 'Watch again', hint: 'Tap the picture to continue', hintEnd: '',
      back: 'Back', next: 'Next', langBtn: 'Español',
      og1: 'Happy Thanksgiving!', og2: 'Everyone gets a seat.', og3: 'Even the turkey.',
    },
    es: {
      h1: '¡Feliz Día de Acción de Gracias!', h1sub: "de parte de todos en Aaria's Blue Elephant",
      p2: 'Los wampanoag compartieron lo que sabían: siembra maíz, frijol y calabaza juntos, y cada uno ayuda a crecer a los demás.',
      p2small: 'Las Tres Hermanas, una tradición de muchas naciones indígenas.',
      corn: 'maíz', beans: 'frijol', squash: 'calabaza',
      p3a: 'Diferentes, y más fuertes juntos.', p3b: 'Así que cada quien llega tal como es… y la mesa se sigue alargando.',
      b1: '¿Soy… la cena?', b2: '¡Eres INVITADO!', b3: '¡MÁS PASTEL!',
      p4: 'Todos tienen un lugar.', p4b: 'Hasta el pavo.',
      p5: 'Gracias por acompañar a más de 150 familias en 2026.',
      p5b: 'Ya queremos ver lo que creceremos juntos el próximo año.',
      plan: '🗓️ Ver nuestro plan 2027', give: '💙 Da gracias con un donativo',
      save: 'Aparta la fecha: GivingTuesday es el martes 1 de diciembre.',
      again: 'Ver de nuevo', hint: 'Toca la imagen para continuar', hintEnd: '',
      back: 'Atrás', next: 'Siguiente', langBtn: 'English',
      og1: '¡Feliz Día de Acción de Gracias!', og2: 'Todos tienen un lugar.', og3: 'Hasta el pavo.',
    },
  };
  const t = (k) => T[lang][k];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const INK = '#16255c', BLUE = '#2f9fd8', EAR = '#8fd0ee', PUMPKIN = '#e8743b', GOLD = '#f2b134',
        RUST = '#b4532a', LEAF = '#5c9e48', LEAFDK = '#3f7a33', CREAM = '#fff4e3';
  const ZEFFY = 'https://www.zeffy.com/en-US/donation-form/aariasblueelephant';

  /* ── characters ──────────────────────────────────────────────────────── */
  // Nilu, facing right, feet at (0,0). earCls lets a panel make the ear wave.
  function nilu(earCls) {
    return `
      <path d="M-50,-58 Q-64,-50 -62,-36" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="-63" cy="-32" rx="6" ry="9" fill="${LEAF}" stroke="${INK}" stroke-width="2" transform="rotate(-30 -63 -32)"/>
      <rect x="-40" y="-30" width="20" height="30" rx="9" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
      <rect x="12" y="-30" width="20" height="30" rx="9" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="-6" cy="-52" rx="54" ry="38" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
      <rect x="-26" y="-28" width="20" height="28" rx="9" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
      <rect x="26" y="-28" width="20" height="28" rx="9" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
      <path d="M66,-80 C92,-74 100,-44 88,-30 C80,-22 70,-28 76,-38" stroke="${INK}" stroke-width="19" fill="none" stroke-linecap="round"/>
      <path d="M66,-80 C92,-74 100,-44 88,-30 C80,-22 70,-28 76,-38" stroke="${BLUE}" stroke-width="13" fill="none" stroke-linecap="round"/>
      <circle cx="44" cy="-90" r="34" fill="${BLUE}" stroke="${INK}" stroke-width="3"/>
      <g class="${earCls || ''}">
        <path d="M30,-92 C6,-128 -34,-108 -26,-74 C-20,-48 10,-50 22,-64 Z" fill="${EAR}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M14,-82 C2,-98 -16,-92 -12,-78" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M50,-98 q7,-7 14,0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="64" cy="-80" r="5" fill="#f7a8b8" opacity=".8"/>
      <path d="M54,-74 q6,5 12,1" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  }

  // the turkey, feet at (0,0). mood: 'scared' | 'happy'; napkin adds a bib.
  function turkey(mood, napkin) {
    const fc = [RUST, GOLD, PUMPKIN, '#8b4a24', PUMPKIN, GOLD, RUST];
    let fan = '';
    fc.forEach((c, i) => {
      const a = -72 + i * 24;
      fan += `<g transform="rotate(${a} 0 -52)"><ellipse cx="0" cy="-96" rx="12" ry="40" fill="${c}" stroke="${INK}" stroke-width="2.5"/>
              <ellipse cx="0" cy="-122" rx="7" ry="10" fill="#fde7b0" opacity=".85"/></g>`;
    });
    const eyes = mood === 'scared'
      ? `<circle cx="-2" cy="-92" r="7" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="14" cy="-92" r="7" fill="#fff" stroke="${INK}" stroke-width="2"/>
         <circle cx="0" cy="-91" r="2.6" fill="${INK}"/><circle cx="16" cy="-91" r="2.6" fill="${INK}"/>
         <path d="M-8,-104 l8,3 M20,-104 l-8,3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M-6,-92 q5,-5 10,0 M10,-92 q5,-5 10,0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    return `
      ${fan}
      <path d="M-10,-14 v14 M10,-14 v14 M-10,0 l-7,3 M-10,0 l5,4 M10,0 l-5,4 M10,0 l7,3" stroke="#e08a1e" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="0" cy="-42" rx="32" ry="33" fill="#8b5a2b" stroke="${INK}" stroke-width="3"/>
      <path d="M-24,-46 q12,24 30,8" stroke="#6b4320" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M2,-66 q-4,-12 4,-20" stroke="${INK}" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M2,-66 q-4,-12 4,-20" stroke="#a0693a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <circle cx="6" cy="-92" r="17" fill="#a0693a" stroke="${INK}" stroke-width="3"/>
      ${eyes}
      <path d="M20,-86 l11,4 l-11,4 z" fill="#f5a524" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M19,-80 q4,10 -1,15 q-5,-4 -2,-14" fill="#e23b3b" stroke="${INK}" stroke-width="1.8"/>
      ${mood === 'scared' ? `<path d="M-6,-80 q4,3 8,0" stroke="${INK}" stroke-width="2" fill="none"/>` : ''}
      ${napkin ? `<path d="M-14,-70 L22,-70 L4,-44 Z" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
                   <path d="M-6,-64 h18" stroke="${EAR}" stroke-width="2"/>` : ''}`;
  }

  // a child seated behind the table, head centre at (0,0)
  function kid(o) {
    const skin = o.skin, hair = o.hair, shirt = o.shirt;
    let h = '';
    if (o.style === 'curly') h = [[-15, -12], [-6, -19], [5, -20], [15, -13], [19, -3], [-19, -3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${hair}"/>`).join('');
    if (o.style === 'short') h = `<path d="M-21,-1 C-24,-28 24,-28 21,-1 C15,-14 -8,-16 -21,-1Z" fill="${hair}"/>`;
    if (o.style === 'braids') h = `<path d="M-21,0 C-24,-28 24,-28 21,0 C14,-14 -14,-14 -21,0Z" fill="${hair}"/>
         <ellipse cx="-22" cy="14" rx="5" ry="10" fill="${hair}"/><ellipse cx="22" cy="14" rx="5" ry="10" fill="${hair}"/>`;
    const arms = o.flap
      ? `<g class="flap"><path d="M-20,34 L-38,10" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M-20,34 L-38,10" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/><circle cx="-39" cy="8" r="5.5" fill="${skin}" stroke="${INK}" stroke-width="2"/></g>
         <g class="flapR"><path d="M20,34 L38,10" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M20,34 L38,10" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/><circle cx="39" cy="8" r="5.5" fill="${skin}" stroke="${INK}" stroke-width="2"/></g>`
      : '';
    const phones = o.phones
      ? `<path d="M-23,2 C-24,-32 24,-32 23,2" stroke="#7c3aed" stroke-width="5" fill="none"/>
         <rect x="-29" y="-6" width="10" height="17" rx="4" fill="#7c3aed" stroke="${INK}" stroke-width="2"/>
         <rect x="19" y="-6" width="10" height="17" rx="4" fill="#7c3aed" stroke="${INK}" stroke-width="2"/>` : '';
    const tablet = o.tablet
      ? `<rect x="-17" y="30" width="34" height="24" rx="4" fill="#334155" stroke="${INK}" stroke-width="2"/>
         <rect x="-13" y="33" width="26" height="17" rx="2" fill="#a5f3fc"/>
         <circle cx="-6" cy="41" r="2.4" fill="${PUMPKIN}"/><circle cx="1" cy="41" r="2.4" fill="${GOLD}"/><circle cx="8" cy="41" r="2.4" fill="${LEAF}"/>` : '';
    return `
      ${arms}
      <path d="M-26,70 Q-26,24 0,22 Q26,24 26,70 Z" fill="${shirt}" stroke="${INK}" stroke-width="3"/>
      <circle cx="0" cy="0" r="21" fill="${skin}" stroke="${INK}" stroke-width="3"/>
      ${h}
      <circle cx="-7" cy="1" r="2.8" fill="${INK}"/><circle cx="7" cy="1" r="2.8" fill="${INK}"/>
      <circle cx="-12" cy="8" r="3.4" fill="#f7a8b8" opacity=".7"/><circle cx="12" cy="8" r="3.4" fill="#f7a8b8" opacity=".7"/>
      <path d="M-6,9 q6,6 12,0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${phones}${tablet}`;
  }

  // a child in a wheelchair, head centre at (0,0), drawn in full at the table's end
  function wheelchairKid() {
    return `
      <path d="M-18,40 L-18,74 L22,74" stroke="#475569" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-26,18 L-18,40" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
      <path d="M-22,68 Q-22,22 2,20 Q22,22 24,62 Z" fill="#14b8a6" stroke="${INK}" stroke-width="3"/>
      <path d="M8,70 L30,72 L32,98" stroke="${INK}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8,70 L30,72 L32,98" stroke="#1e3a8a" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="-8" cy="86" r="28" fill="none" stroke="${INK}" stroke-width="5"/>
      <circle cx="-8" cy="86" r="22" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <path d="M-8,64 V108 M-30,86 H14 M-23,71 L7,101 M7,71 L-23,101" stroke="#94a3b8" stroke-width="1.6"/>
      <circle cx="-8" cy="86" r="4" fill="${INK}"/>
      <circle cx="30" cy="108" r="6" fill="#fff" stroke="${INK}" stroke-width="3"/>
      <circle cx="0" cy="0" r="21" fill="#f1c27d" stroke="${INK}" stroke-width="3"/>
      <path d="M-21,-1 C-24,-28 24,-28 21,-1 C15,-14 -8,-16 -21,-1Z" fill="#c0392b"/>
      <circle cx="-7" cy="1" r="2.8" fill="${INK}"/><circle cx="7" cy="1" r="2.8" fill="${INK}"/>
      <path d="M-7,8 q7,7 14,0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M14,34 L34,24" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M14,34 L34,24" stroke="#14b8a6" stroke-width="6" stroke-linecap="round"/>
      <circle cx="36" cy="23" r="5.5" fill="#f1c27d" stroke="${INK}" stroke-width="2"/>`;
  }

  // Aaria, from the badge art (a bust; the table hides below her shoulders)
  const aaria = (x, y, w) => `<image href="aaria.webp" x="${x - w / 2}" y="${y}" width="${w}" height="${w * 377 / 240}"/>`;

  /* ── scenery ─────────────────────────────────────────────────────────── */
  const LEAFPATH = 'M0,-10 L3,-4 L9,-6 L6,0 L10,4 L3,4 L2,10 L0,6 L-2,10 L-3,4 L-10,4 L-6,0 L-9,-6 L-3,-4 Z';
  function leaves(n, seed) {
    let s = seed || 7, out = '';
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const cols = [PUMPKIN, GOLD, RUST, '#d9481c', '#c99a2e'];
    for (let i = 0; i < n; i++) {
      const x = 20 + r() * 360, sc = 0.9 + r() * 0.9, dur = 7 + r() * 6, del = -r() * 12, dx = (r() * 80 - 40) | 0;
      out += `<g transform="translate(${x.toFixed(0)},0)"><g class="fall" style="animation-duration:${dur.toFixed(1)}s;animation-delay:${del.toFixed(1)}s;--dx:${dx}px">
        <path d="${LEAFPATH}" transform="scale(${sc.toFixed(2)})" fill="${cols[i % cols.length]}" stroke="${INK}" stroke-width="1" opacity=".92"/></g></g>`;
    }
    return out;
  }
  const bunting = (y) => {
    let s = `<path d="M-5,${y} Q100,${y + 18} 200,${y + 6} T405,${y}" stroke="${INK}" stroke-width="1.6" fill="none"/>`;
    const cols = [PUMPKIN, GOLD, RUST, LEAF];
    for (let i = 0; i < 12; i++) {
      const x = 10 + i * 34, yy = y + 6 + Math.sin(i / 11 * Math.PI) * 9;
      s += `<path d="M${x},${yy} l20,0 l-10,18 z" fill="${cols[i % 4]}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
    }
    return s;
  };
  const room = (id) => `
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6e6"/><stop offset="1" stop-color="#fde4c2"/></linearGradient></defs>
    <rect width="400" height="440" fill="url(#${id})"/>
    <rect y="360" width="400" height="80" fill="#e9c79c"/>
    <path d="M0,360 H400" stroke="${INK}" stroke-width="2" opacity=".25"/>
    ${bunting(26)}`;

  const pie = (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="0" rx="22" ry="7" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <path d="M-17,-2 Q0,-14 17,-2 Q0,4 -17,-2Z" fill="#e8a33b" stroke="${INK}" stroke-width="2"/><path d="M-8,-5 l3,3 M2,-7 l2,3 M9,-4 l2,2" stroke="#b4532a" stroke-width="1.5"/></g>`;
  const corncob = (x, y) => `<g transform="translate(${x},${y}) rotate(-12)"><ellipse cx="0" cy="0" rx="16" ry="6" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>
    <path d="M-18,0 q-6,-8 -2,-12 M-18,0 q-8,2 -10,-6" stroke="${LEAF}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  const squashFood = (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="-3" rx="13" ry="10" fill="${PUMPKIN}" stroke="${INK}" stroke-width="2"/>
    <path d="M0,-12 v-5" stroke="${LEAFDK}" stroke-width="3" stroke-linecap="round"/><path d="M-5,-11 q-2,8 0,15 M5,-11 q2,8 0,15" stroke="${RUST}" stroke-width="1.4" fill="none"/></g>`;
  const plate = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="5" fill="#fff" stroke="${INK}" stroke-width="1.8"/>`;
  const tableFront = (x, w, y) => `
    <rect x="${x}" y="${y}" width="${w}" height="16" rx="6" fill="#f3a26b" stroke="${INK}" stroke-width="2.5"/>
    <path d="M${x},${y + 12} H${x + w} V${y + 70} Q${x + w - 20},${y + 80} ${x + w - 40},${y + 70} H${x + 40} Q${x + 20},${y + 80} ${x},${y + 70} Z" fill="${PUMPKIN}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M${x + 10},${y + 30} H${x + w - 10}" stroke="#f7c08f" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>`;

  /* ── the five panels ─────────────────────────────────────────────────── */
  function p1() {
    return `
      <defs><linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9c7"/><stop offset="1" stop-color="#fff7ea"/></linearGradient></defs>
      <rect width="400" height="440" fill="url(#sky1)"/>
      <circle cx="320" cy="90" r="44" fill="#ffd43b" opacity=".85"/>
      <ellipse cx="90" cy="420" rx="220" ry="110" fill="#e9b15f"/>
      <ellipse cx="330" cy="430" rx="220" ry="100" fill="#d99a48"/>
      <g transform="translate(70,345)">${squashFood(0, 0)}</g><g transform="translate(340,360) scale(1.3)">${squashFood(0, 0)}</g>
      <g transform="translate(300,352) scale(.9)">${squashFood(0, 0)}</g>
      <g transform="translate(185,385) scale(1.35)"><g class="bob">${nilu('wave')}</g></g>
      ${leaves(10, 3)}`;
  }

  function p2() {
    const stalk = (x, h, d) => `<g class="grow" style="animation-delay:${d}s">
      <path d="M${x},372 V${372 - h}" stroke="${LEAFDK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x},${372 - h * .35} q-34,-6 -46,-30 q22,4 46,18 M${x},${372 - h * .55} q34,-8 44,-34 q-22,8 -44,22 M${x},${372 - h * .78} q-28,-6 -36,-26 q18,6 36,14"
            fill="${LEAF}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${x},${372 - h} l-8,-18 M${x},${372 - h} l0,-22 M${x},${372 - h} l8,-18" stroke="#c99a2e" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(${x + 9},${372 - h * .62}) rotate(18)"><ellipse rx="8" ry="20" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>
        <path d="M-8,6 q-6,14 4,22 M8,6 q6,14 -4,22" stroke="${LEAF}" stroke-width="3" fill="none"/></g></g>`;
    const bean = (x, y, d) => `<g class="pop" style="animation-delay:${d}s"><g transform="translate(${x},${y})">
      <path d="M0,0 q10,-10 16,0 q-6,8 -16,0Z" fill="#7cc46a" stroke="${INK}" stroke-width="1.5"/></g></g>`;
    const pod = (x, y, d) => `<g class="pop" style="animation-delay:${d}s"><path d="M${x},${y} q4,14 -2,24" stroke="#3f7a33" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
    const sq = (x, y, s, d) => `<g class="pop" style="animation-delay:${d}s"><g transform="translate(${x},${y}) scale(${s})">
      <path d="M-30,-6 q-24,-26 6,-36 q12,12 2,34Z M30,-8 q26,-24 -4,-36 q-14,12 -4,34Z" fill="${LEAF}" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="0" cy="0" rx="26" ry="18" fill="${PUMPKIN}" stroke="${INK}" stroke-width="2.5"/>
      <path d="M-10,-16 q-4,16 0,32 M10,-16 q4,16 0,32" stroke="${RUST}" stroke-width="2" fill="none"/>
      <path d="M0,-18 v-8" stroke="${LEAFDK}" stroke-width="4" stroke-linecap="round"/></g></g>`;
    const tag = (x, y, txt, d) => `<g class="pop" style="animation-delay:${d}s"><g transform="translate(${x},${y})">
      <rect x="-34" y="-13" width="68" height="24" rx="12" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <text y="4" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}" font-family="ui-rounded, Nunito, system-ui">${esc(txt)}</text></g></g>`;
    return `
      <defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff1ff"/><stop offset="1" stop-color="#fff6e6"/></linearGradient></defs>
      <rect width="400" height="440" fill="url(#sky2)"/>
      <circle cx="70" cy="70" r="34" fill="#ffd43b"/>
      <rect y="360" width="400" height="80" fill="#8b5a2b"/>
      <ellipse cx="200" cy="372" rx="150" ry="26" fill="#a0693a" stroke="${INK}" stroke-width="2.5"/>
      ${stalk(150, 210, .1)}${stalk(250, 230, .35)}${stalk(200, 260, .2)}
      <path class="vine" style="animation-delay:1.3s" d="M200,372 C222,346 178,326 200,300 C222,274 178,254 200,228 C220,204 182,184 200,160 C214,142 190,128 200,116"
            stroke="#3f7a33" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      ${bean(206, 336, 2.0)}${bean(186, 288, 2.2)}${bean(208, 240, 2.4)}${bean(184, 196, 2.6)}${bean(204, 150, 2.8)}
      ${pod(214, 300, 2.5)}${pod(188, 214, 2.7)}
      ${sq(95, 382, 1, 3.0)}${sq(310, 388, 1.15, 3.2)}${sq(205, 410, .85, 3.4)}
      ${tag(150, 128, t('corn'), 3.8)}${tag(262, 170, t('beans'), 4.0)}${tag(330, 330, t('squash'), 4.2)}`;
  }

  function p3() {
    return `
      ${room('wall3')}
      <rect x="40" y="70" width="90" height="110" rx="8" fill="#cfeaff" stroke="${INK}" stroke-width="2.5"/>
      <path d="M85,70 V180 M40,125 H130" stroke="${INK}" stroke-width="2"/>
      <circle cx="104" cy="150" r="14" fill="${PUMPKIN}" opacity=".5"/>
      <g class="pop" style="animation-delay:2.3s">${aaria(112, 198, 66)}</g>
      <g class="pop" style="animation-delay:2.6s"><g transform="translate(170,252)">${kid({ skin: '#8d5a3b', hair: '#1f1a17', shirt: '#3b82f6', style: 'curly', phones: true })}</g></g>
      <g class="pop" style="animation-delay:2.9s"><g transform="translate(226,252)">${kid({ skin: '#f5d0b5', hair: '#7a4a21', shirt: GOLD, style: 'short', flap: true })}</g></g>
      <g class="pop" style="animation-delay:3.2s"><g transform="translate(282,252)">${kid({ skin: '#d9a37a', hair: '#2b1a10', shirt: '#ec4899', style: 'braids', tablet: true })}</g></g>
      <g class="pull"><g transform="translate(366,332) scale(-.68,.68)">${nilu('')}</g></g>
      <g class="stretch">${tableFront(70, 300, 292)}</g>
      <g class="pop" style="animation-delay:2.0s">${pie(140, 293)}${plate(200, 296)}${corncob(250, 292)}${plate(300, 296)}${squashFood(330, 296)}</g>
      <g class="pop" style="animation-delay:3.5s"><g transform="translate(36,256) scale(.92)">${wheelchairKid()}</g></g>`;
  }

  function p4() {
    const bubble = (cls, x, y, w, txt, tail) => `<g class="bubble ${cls}"><g transform="translate(${x},${y})">
      <rect x="${-w / 2}" y="-20" width="${w}" height="36" rx="16" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <path d="${tail}" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="${-w / 2 + 3}" y="6" width="${w - 6}" height="8" fill="#fff"/>
      <text y="4" text-anchor="middle" font-size="16" font-weight="900" fill="${INK}" font-family="ui-rounded, Nunito, system-ui">${esc(txt)}</text></g></g>`;
    return `
      ${room('wall4')}
      <g class="seated"><g transform="translate(226,334) scale(.72)">${turkey('happy', true)}</g></g>
      ${aaria(306, 200, 62)}
      <g transform="translate(360,254)">${kid({ skin: '#d9a37a', hair: '#2b1a10', shirt: '#ec4899', style: 'braids', tablet: true })}</g>
      ${tableFront(150, 250, 300)}
      ${pie(336, 301)}${plate(228, 304)}${corncob(184, 300)}
      <g class="later"><g transform="translate(228,296)"><path d="M-14,0 q14,-12 28,0" stroke="#e8a33b" stroke-width="7" stroke-linecap="round" fill="none"/></g></g>
      <g transform="translate(238,436) scale(.86)"><g class="peek"><g class="faint">${turkey('scared', false)}</g></g></g>
      <g transform="translate(78,438) scale(.9)"><g class="bob">${nilu('')}</g></g>
      <g class="stars"><text x="196" y="414" font-size="24">💫</text></g>
      ${bubble('b1', 222, 300, 150, t('b1'), 'M2,14 L12,36 L20,14 Z')}
      ${bubble('b2', 116, 150, 168, t('b2'), 'M-30,14 L-44,40 L-10,14 Z')}
      ${bubble('b3', 320, 160, 138, t('b3'), 'M20,14 L38,40 L42,14 Z')}`;
  }

  function p5() {
    const heart = (x, d) => `<g transform="translate(${x},330)"><g class="heart" style="animation-delay:${d}s"><path d="M0,6 C-14,-6 -8,-18 0,-10 C8,-18 14,-6 0,6Z" fill="${BLUE}" stroke="${INK}" stroke-width="1.5"/></g></g>`;
    return `
      <defs><radialGradient id="glow" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#fde4c2"/></radialGradient></defs>
      <rect width="400" height="440" fill="url(#glow)"/>
      ${bunting(26)}
      <circle cx="200" cy="236" r="150" fill="#a9dcf5" opacity=".45"/>
      ${leaves(7, 11)}
      <image href="pair.webp" x="72" y="88" width="256" height="273"/>
      ${pie(110, 392)}${squashFood(290, 394)}${corncob(205, 396)}
      ${heart(80, 0)}${heart(320, 1.1)}${heart(140, 2.2)}${heart(262, .6)}`;
  }

  /* ── assemble ────────────────────────────────────────────────────────── */
  const PANELS = [
    { art: p1, cap: () => `<h1>${t('h1')}</h1><p>${t('h1sub')}</p>`, alt: 'Nilu the blue elephant waving in an autumn field' },
    { art: p2, cap: () => `<h2>${t('p2')}</h2><p class="small">${t('p2small')}</p>`, alt: 'Corn, beans and squash growing together' },
    { art: p3, cap: () => `<h2>${t('p3a')}</h2><p>${t('p3b')}</p>`, alt: 'Aaria and friends at a Thanksgiving table that Nilu keeps stretching longer' },
    { art: p4, cap: () => `<p class="big">${t('p4')}<br>${t('p4b')}</p>`, alt: 'A nervous turkey is welcomed to the table as a guest' },
    {
      art: p5, alt: 'Aaria hugging Nilu',
      cap: () => `<h2>${t('p5')}</h2><p>${t('p5b')}</p>
        <div class="ctas">
          <a class="btn primary" href="/events/2027">${t('plan')}</a>
          <a class="btn soft" href="${ZEFFY}" target="_blank" rel="noopener">${t('give')}</a>
        </div>
        <p class="save">${t('save')}</p>
        <button class="replay" type="button" data-replay>${t('again')}</button>`,
    },
  ];

  const stage = document.getElementById('stage');
  const dots = document.getElementById('dots');
  const prev = document.getElementById('prev'), next = document.getElementById('next');
  const hint = document.getElementById('hint'), langBtn = document.getElementById('lang');
  let cur = 0;

  function build() {
    document.documentElement.lang = lang;
    stage.innerHTML = PANELS.map((p, i) => `
      <section class="panel" data-i="${i}" aria-roledescription="slide" aria-label="${i + 1} / ${PANELS.length}">
        <div class="art"><svg viewBox="0 0 400 440" role="img" aria-label="${esc(p.alt)}">${p.art()}</svg></div>
        <div class="cap">${p.cap()}</div>
      </section>`).join('');
    dots.innerHTML = PANELS.map(() => '<i></i>').join('');
    prev.setAttribute('aria-label', t('back'));
    next.setAttribute('aria-label', t('next'));
    langBtn.textContent = '🌐 ' + t('langBtn');
    show(cur, true);
  }

  function show(i, force) {
    if (i < 0 || i >= PANELS.length || (i === cur && !force)) return;
    cur = i;
    stage.querySelectorAll('.panel').forEach((el, j) => {
      el.classList.remove('on');
      if (j === i) { void el.offsetWidth; el.classList.add('on'); }   // restart its animations
    });
    dots.querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j === i));
    prev.disabled = i === 0;
    next.disabled = i === PANELS.length - 1;
    hint.textContent = i === PANELS.length - 1 ? '' : t('hint');
  }

  stage.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    if (e.target.closest('[data-replay]')) { show(0); return; }
    if (e.target.closest('.cap')) return;
    show(cur + 1);
  });
  prev.addEventListener('click', () => show(cur - 1));
  next.addEventListener('click', () => show(cur + 1));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); show(cur + 1); }
    if (e.key === 'ArrowLeft') show(cur - 1);
  });
  langBtn.addEventListener('click', () => {
    lang = lang === 'en' ? 'es' : 'en';
    try { localStorage.setItem('abe.lang', lang); } catch (e) { /* ignore */ }
    build();
  });
  // swipe on phones
  let sx = null;
  stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { e.preventDefault(); show(cur + (dx < 0 ? 1 : -1)); }
  });

  const q = new URLSearchParams(location.search);
  if (q.get('lang') === 'es' || q.get('lang') === 'en') lang = q.get('lang');
  const start = parseInt(q.get('p') || '1', 10) - 1;
  cur = Math.min(Math.max(start, 0), PANELS.length - 1);
  build();

  // share-image mode (scripts render /thanks/?og to make og.png)
  if (q.has('og')) {
    document.body.classList.add('og');
    document.body.innerHTML = `<div id="og"><div class="ogart"><svg viewBox="0 0 400 440">${p4()}</svg></div>
      <div class="ogtxt"><img src="/abe-logo-badge.png" alt=""><h1>${t('og1')}</h1><p>${t('og2')}<br><b>${t('og3')}</b></p>
      <span>aariasblueelephant.org/thanks</span></div></div>`;
  }

  window.ABEThanks = { show };
})();
