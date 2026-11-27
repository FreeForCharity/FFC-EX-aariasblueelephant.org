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
  const INK = '#16255c', LINE = '#1d5fa3', BODY = '#4aa8e0', BODYDK = '#3893cf', EARIN = '#a4d9f4',
        PUMPKIN = '#e8743b', GOLD = '#f2b134', RUST = '#b4532a', LEAF = '#5c9e48', LEAFDK = '#3f7a33',
        BLUSH = '#ff9fb2';
  const ZEFFY = 'https://www.zeffy.com/en-US/donation-form/aariasblueelephant';
  const FONT = 'ui-rounded, Nunito, system-ui, sans-serif';

  /* ── Nilu: a baby elephant, facing right, feet at (0,0) ──────────────── */
  function nilu(o) {
    o = o || {};
    const trunk = o.trunkUp
      ? 'M66,-80 C84,-84 92,-100 88,-116 C86,-125 76,-126 75,-117'
      : 'M66,-80 C86,-82 94,-66 91,-54 C89,-46 81,-45 79,-52';
    const ridges = o.trunkUp
      ? 'M76,-86 q4,2 6,7 M84,-98 q4,1 6,5'
      : 'M78,-80 q2,4 0,8 M86,-70 q-2,3 -5,6';
    const eye = o.eyes === 'happy'
      ? `<path d="M42,-96 q7,-8 14,0" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
      : `<g class="blink"><ellipse cx="49" cy="-95" rx="6.2" ry="8" fill="${INK}"/>
           <circle cx="51.5" cy="-98" r="2.6" fill="#fff"/><circle cx="47" cy="-91.5" r="1.3" fill="#fff"/></g>`;
    return `
      <path d="M-43,-50 q-13,3 -15,16" stroke="${LINE}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M-58,-35 q-5,4 -4,9 M-58,-35 q0,6 3,9 M-58,-35 q4,3 6,7" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <rect x="-36" y="-30" width="20" height="30" rx="9" fill="${BODYDK}" stroke="${LINE}" stroke-width="3"/>
      <rect x="8" y="-30" width="20" height="30" rx="9" fill="${BODYDK}" stroke="${LINE}" stroke-width="3"/>
      <ellipse cx="-4" cy="-44" rx="43" ry="33" fill="${BODY}" stroke="${LINE}" stroke-width="3"/>
      <ellipse cx="-12" cy="-58" rx="22" ry="9" fill="#fff" opacity=".16"/>
      <rect x="-22" y="-27" width="20" height="27" rx="9" fill="${BODY}" stroke="${LINE}" stroke-width="3"/>
      <rect x="20" y="-27" width="20" height="27" rx="9" fill="${BODY}" stroke="${LINE}" stroke-width="3"/>
      <path d="M-18,-4 q3,-4 6,0 M-11,-4 q3,-4 6,0 M24,-4 q3,-4 6,0 M31,-4 q3,-4 6,0" stroke="#dff1fc" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="${trunk}" stroke="${LINE}" stroke-width="19" fill="none" stroke-linecap="round"/>
      <path d="${trunk}" stroke="${BODY}" stroke-width="13" fill="none" stroke-linecap="round"/>
      <path d="${ridges}" stroke="${LINE}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="36" cy="-90" r="41" fill="${BODY}" stroke="${LINE}" stroke-width="3"/>
      <ellipse cx="28" cy="-112" rx="16" ry="8" fill="#fff" opacity=".18" transform="rotate(-18 28 -112)"/>
      <path d="M30,-130 q-3,-10 4,-13 M36,-130 q2,-11 10,-9" stroke="${LINE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <g class="${o.wave ? 'wave' : ''}">
        <path d="M20,-114 C2,-138 -42,-128 -44,-92 C-46,-62 -20,-46 4,-56 C14,-60 19,-70 18,-82 Z" fill="${BODY}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M10,-108 C-4,-122 -32,-114 -33,-92 C-34,-72 -16,-64 0,-70 C8,-74 9,-84 8,-92 Z" fill="${EARIN}"/>
        <path d="M-2,-104 C-14,-108 -24,-98 -22,-86" stroke="${LINE}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>
      </g>
      ${eye}
      <ellipse cx="58" cy="-75" rx="8" ry="5" fill="${BLUSH}" opacity=".75"/>
      <path d="M57,-65 q6,6 12,1" stroke="${LINE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }

  /* ── the turkey, feet at (0,0) ───────────────────────────────────────── */
  function turkey(mood, napkin) {
    const fc = [RUST, GOLD, PUMPKIN, '#9a5a2a', PUMPKIN, GOLD, RUST];
    let fan = '';
    fc.forEach((c, i) => {
      const a = -72 + i * 24;
      fan += `<g transform="rotate(${a} 0 -52)"><path d="M0,-58 C-15,-80 -14,-120 0,-138 C14,-120 15,-80 0,-58 Z" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
              <circle cx="0" cy="-124" r="6" fill="#fde7b0" opacity=".9"/></g>`;
    });
    const eyes = mood === 'scared'
      ? `<circle cx="-1" cy="-94" r="8" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="15" cy="-94" r="8" fill="#fff" stroke="${INK}" stroke-width="2"/>
         <circle cx="1" cy="-93" r="3.4" fill="${INK}"/><circle cx="17" cy="-93" r="3.4" fill="${INK}"/>
         <circle cx="2" cy="-95" r="1.1" fill="#fff"/><circle cx="18" cy="-95" r="1.1" fill="#fff"/>
         <path d="M-7,-106 l8,4 M22,-106 l-8,4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
         <path d="M-14,-104 q-4,7 0,10 q4,-3 0,-10Z" fill="#9fd6f3" stroke="${INK}" stroke-width="1.2"/>`
      : `<path d="M-6,-94 q5,-6 10,0 M10,-94 q5,-6 10,0" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
         <ellipse cx="-4" cy="-85" rx="4.5" ry="3" fill="${BLUSH}" opacity=".8"/>`;
    return `
      ${fan}
      <path d="M-10,-14 v14 M10,-14 v14 M-10,0 l-7,3 M-10,0 l5,4 M10,0 l-5,4 M10,0 l7,3" stroke="#e08a1e" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="0" cy="-42" rx="33" ry="34" fill="#8b5a2b" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="-6" cy="-54" rx="16" ry="9" fill="#fff" opacity=".12"/>
      <path d="M-24,-46 q12,24 30,8" stroke="#6b4320" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="7" cy="-92" r="20" fill="#a0693a" stroke="${INK}" stroke-width="3"/>
      ${eyes}
      <path d="M24,-88 l12,4 l-12,5 z" fill="#f5a524" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M23,-80 q5,10 -1,16 q-6,-4 -2,-15" fill="#e23b3b" stroke="${INK}" stroke-width="1.8"/>
      ${napkin ? `<path d="M-14,-72 L24,-72 L5,-46 Z" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
                   <path d="M-6,-66 h20" stroke="${EARIN}" stroke-width="2.4"/>` : ''}`;
  }

  /* ── children, head centre at (0,0) ──────────────────────────────────── */
  const eyes = () => `<circle cx="-7" cy="1" r="3.2" fill="${INK}"/><circle cx="7" cy="1" r="3.2" fill="${INK}"/>
    <circle cx="-6" cy="-.2" r="1.1" fill="#fff"/><circle cx="8" cy="-.2" r="1.1" fill="#fff"/>`;
  function kid(o) {
    const skin = o.skin, hair = o.hair, shirt = o.shirt;
    let h = '';
    if (o.style === 'curly') h = [[-15, -12], [-6, -19], [5, -20], [15, -13], [19, -3], [-19, -3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${hair}"/>`).join('');
    if (o.style === 'short') h = `<path d="M-21,-1 C-24,-28 24,-28 21,-1 C15,-14 -8,-16 -21,-1Z" fill="${hair}"/>`;
    if (o.style === 'braids') h = `<path d="M-21,0 C-24,-28 24,-28 21,0 C14,-14 -14,-14 -21,0Z" fill="${hair}"/>
         <ellipse cx="-22" cy="14" rx="5" ry="10" fill="${hair}"/><ellipse cx="22" cy="14" rx="5" ry="10" fill="${hair}"/>
         <circle cx="-22" cy="4" r="3" fill="${PUMPKIN}"/><circle cx="22" cy="4" r="3" fill="${PUMPKIN}"/>`;
    const arm = (side, cls) => `<g class="${cls}"><path d="M${side * 20},34 L${side * 38},10" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
         <path d="M${side * 20},34 L${side * 38},10" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/>
         <circle cx="${side * 39}" cy="8" r="5.5" fill="${skin}" stroke="${INK}" stroke-width="2"/></g>`;
    return `
      ${o.flap ? arm(-1, 'flap') + arm(1, 'flapR') : ''}
      <path d="M-26,70 Q-26,24 0,22 Q26,24 26,70 Z" fill="${shirt}" stroke="${INK}" stroke-width="3"/>
      <circle cx="0" cy="0" r="21" fill="${skin}" stroke="${INK}" stroke-width="3"/>
      ${h}${eyes()}
      <ellipse cx="-12" cy="8" rx="4" ry="2.6" fill="${BLUSH}" opacity=".7"/><ellipse cx="12" cy="8" rx="4" ry="2.6" fill="${BLUSH}" opacity=".7"/>
      <path d="M-6,9 q6,6 12,0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${o.phones ? `<path d="M-23,2 C-24,-32 24,-32 23,2" stroke="#7c3aed" stroke-width="5" fill="none"/>
         <rect x="-29" y="-6" width="10" height="17" rx="4" fill="#8b5cf6" stroke="${INK}" stroke-width="2"/>
         <rect x="19" y="-6" width="10" height="17" rx="4" fill="#8b5cf6" stroke="${INK}" stroke-width="2"/>` : ''}
      ${o.tablet ? `<rect x="-17" y="30" width="34" height="24" rx="4" fill="#334155" stroke="${INK}" stroke-width="2"/>
         <rect x="-13" y="33" width="26" height="17" rx="2" fill="#a5f3fc"/>
         <circle cx="-6" cy="41" r="2.4" fill="${PUMPKIN}"/><circle cx="1" cy="41" r="2.4" fill="${GOLD}"/><circle cx="8" cy="41" r="2.4" fill="${LEAF}"/>` : ''}`;
  }
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
      ${eyes()}
      <ellipse cx="-12" cy="8" rx="4" ry="2.6" fill="${BLUSH}" opacity=".7"/><ellipse cx="12" cy="8" rx="4" ry="2.6" fill="${BLUSH}" opacity=".7"/>
      <path d="M-7,8 q7,7 14,0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M14,34 L34,24" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M14,34 L34,24" stroke="#14b8a6" stroke-width="6" stroke-linecap="round"/>
      <circle cx="36" cy="23" r="5.5" fill="#f1c27d" stroke="${INK}" stroke-width="2"/>`;
  }
  const aaria = (x, y, w) => `<image href="aaria.webp" x="${x - w / 2}" y="${y}" width="${w}" height="${w * 377 / 240}"/>`;

  /* ── scenery ─────────────────────────────────────────────────────────── */
  // a real leaf: blade, midrib, veins and a stem
  const LEAF_COLS = [PUMPKIN, GOLD, RUST, '#d9481c', '#c99a2e', '#a23e1c'];
  function leaf(c) {
    return `<path d="M0,-14 C9,-8 10,5 0,13 C-10,5 -9,-8 0,-14 Z" fill="${c}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M0,-12 V17 M0,-4 l5,-4 M0,-4 l-5,-4 M0,3 l5,-4 M0,3 l-5,-4" stroke="${INK}" stroke-width=".9" stroke-linecap="round" opacity=".55" fill="none"/>`;
  }
  function leaves(n, seed) {
    let s = seed || 7, out = '';
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) {
      const x = 20 + r() * 360, sc = 0.8 + r() * 0.6, dur = 8 + r() * 5, del = -r() * 12, sw = 1.6 + r() * 1.4;
      out += `<g transform="translate(${x.toFixed(0)},0)"><g class="fall" style="animation-duration:${dur.toFixed(1)}s;animation-delay:${del.toFixed(1)}s">
        <g class="sway" style="animation-duration:${sw.toFixed(1)}s"><g transform="scale(${sc.toFixed(2)}) rotate(${(r() * 60 - 30) | 0})">${leaf(LEAF_COLS[i % LEAF_COLS.length])}</g></g></g></g>`;
    }
    return out;
  }
  const restingLeaf = (x, y, rot, c, sc) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${sc || 1})">${leaf(c)}</g>`;
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
    <rect y="360" width="400" height="80" fill="#ecc99d"/>
    <path d="M0,360 H400" stroke="${INK}" stroke-width="2" opacity=".2"/>
    ${bunting(26)}`;
  const pie = (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="0" rx="22" ry="7" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <path d="M-17,-2 Q0,-14 17,-2 Q0,4 -17,-2Z" fill="#e8a33b" stroke="${INK}" stroke-width="2"/><path d="M-8,-5 l3,3 M2,-7 l2,3 M9,-4 l2,2" stroke="${RUST}" stroke-width="1.5"/></g>`;
  const corncob = (x, y) => `<g transform="translate(${x},${y}) rotate(-12)"><ellipse cx="0" cy="0" rx="16" ry="6" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>
    <path d="M-18,0 q-6,-8 -2,-12 M-18,0 q-8,2 -10,-6" stroke="${LEAF}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  const squash = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s || 1})"><ellipse cx="0" cy="-3" rx="13" ry="10" fill="${PUMPKIN}" stroke="${INK}" stroke-width="2"/>
    <path d="M0,-12 v-5" stroke="${LEAFDK}" stroke-width="3" stroke-linecap="round"/><path d="M-5,-11 q-2,8 0,15 M5,-11 q2,8 0,15" stroke="${RUST}" stroke-width="1.4" fill="none"/></g>`;
  const plate = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="5" fill="#fff" stroke="${INK}" stroke-width="1.8"/>`;
  const tableFront = (x, w, y) => `
    <rect x="${x}" y="${y}" width="${w}" height="16" rx="6" fill="#f3a26b" stroke="${INK}" stroke-width="2.5"/>
    <path d="M${x},${y + 12} H${x + w} V${y + 70} Q${x + w - 20},${y + 80} ${x + w - 40},${y + 70} H${x + 40} Q${x + 20},${y + 80} ${x},${y + 70} Z" fill="${PUMPKIN}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M${x + 10},${y + 30} H${x + w - 10}" stroke="#f7c08f" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>`;

  /* ── the five scenes ─────────────────────────────────────────────────── */
  function s1() {
    return `
      <defs><linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2b8"/><stop offset="1" stop-color="#fff6e8"/></linearGradient></defs>
      <rect width="400" height="440" fill="url(#sky1)"/>
      <circle cx="318" cy="92" r="46" fill="#ffd43b" opacity=".9"/><circle cx="318" cy="92" r="62" fill="#ffd43b" opacity=".18"/>
      <path d="M60,120 q14,-10 28,0 q14,-10 28,0" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="80" cy="430" rx="230" ry="112" fill="#efbe6c"/>
      <ellipse cx="340" cy="440" rx="230" ry="100" fill="#e3a453"/>
      ${squash(62, 350, 1.2)}${squash(344, 366, 1.4)}${squash(302, 356, .95)}
      ${restingLeaf(110, 372, 40, RUST)}${restingLeaf(280, 392, -20, GOLD)}${restingLeaf(150, 410, 80, PUMPKIN)}
      ${leaves(9, 3)}
      <g transform="translate(178,404) scale(1.32)"><g class="hop"><g class="bob">${nilu({ wave: true, trunkUp: true })}</g></g></g>`;
  }

  function s2() {
    const stalk = (x, h, d) => `<g class="grow" style="animation-delay:${d}s">
      <path d="M${x},372 V${372 - h}" stroke="${LEAFDK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x},${372 - h * .35} q-34,-6 -46,-30 q22,4 46,18 M${x},${372 - h * .55} q34,-8 44,-34 q-22,8 -44,22 M${x},${372 - h * .78} q-28,-6 -36,-26 q18,6 36,14"
            fill="${LEAF}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${x},${372 - h} l-8,-18 M${x},${372 - h} l0,-22 M${x},${372 - h} l8,-18" stroke="#c99a2e" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(${x + 9},${372 - h * .62}) rotate(18)"><ellipse rx="8" ry="20" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>
        <path d="M-8,6 q-6,14 4,22 M8,6 q6,14 -4,22" stroke="${LEAF}" stroke-width="3" fill="none"/></g></g>`;
    const bean = (x, y, d) => `<g class="pop" style="animation-delay:${d}s"><g transform="translate(${x},${y})">
      <path d="M0,0 q10,-10 16,0 q-6,8 -16,0Z" fill="#7cc46a" stroke="${INK}" stroke-width="1.5"/></g></g>`;
    const pod = (x, y, d) => `<g class="pop" style="animation-delay:${d}s"><path d="M${x},${y} q4,14 -2,24" stroke="${LEAFDK}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
    const sq = (x, y, s, d) => `<g class="pop" style="animation-delay:${d}s"><g transform="translate(${x},${y}) scale(${s})">
      <path d="M-30,-6 q-24,-26 6,-36 q12,12 2,34Z M30,-8 q26,-24 -4,-36 q-14,12 -4,34Z" fill="${LEAF}" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="0" cy="0" rx="26" ry="18" fill="${PUMPKIN}" stroke="${INK}" stroke-width="2.5"/>
      <path d="M-10,-16 q-4,16 0,32 M10,-16 q4,16 0,32" stroke="${RUST}" stroke-width="2" fill="none"/>
      <path d="M0,-18 v-8" stroke="${LEAFDK}" stroke-width="4" stroke-linecap="round"/></g></g>`;
    const tag = (x, y, txt, d) => `<g class="pop" style="animation-delay:${d}s"><g transform="translate(${x},${y})">
      <rect x="-36" y="-13" width="72" height="25" rx="12.5" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <text y="4.5" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}" font-family="${FONT}">${esc(txt)}</text></g></g>`;
    return `
      <defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff1ff"/><stop offset="1" stop-color="#fff6e6"/></linearGradient></defs>
      <rect width="400" height="440" fill="url(#sky2)"/>
      <circle cx="70" cy="70" r="34" fill="#ffd43b"/><circle cx="70" cy="70" r="48" fill="#ffd43b" opacity=".2"/>
      <rect y="360" width="400" height="80" fill="#8b5a2b"/>
      <ellipse cx="200" cy="372" rx="150" ry="26" fill="#a0693a" stroke="${INK}" stroke-width="2.5"/>
      ${stalk(150, 210, .1)}${stalk(250, 230, .35)}${stalk(200, 260, .2)}
      <path class="vine" style="animation-delay:1.3s" d="M200,372 C222,346 178,326 200,300 C222,274 178,254 200,228 C220,204 182,184 200,160 C214,142 190,128 200,116"
            stroke="${LEAFDK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      ${bean(206, 336, 2.0)}${bean(186, 288, 2.2)}${bean(208, 240, 2.4)}${bean(184, 196, 2.6)}${bean(204, 150, 2.8)}
      ${pod(214, 300, 2.5)}${pod(188, 214, 2.7)}
      ${sq(95, 382, 1, 3.0)}${sq(310, 388, 1.15, 3.2)}${sq(205, 410, .85, 3.4)}
      ${tag(150, 128, t('corn'), 3.8)}${tag(262, 170, t('beans'), 4.0)}${tag(330, 330, t('squash'), 4.2)}`;
  }

  function s3() {
    return `
      ${room('wall3')}
      <rect x="40" y="70" width="90" height="110" rx="8" fill="#cfeaff" stroke="${INK}" stroke-width="2.5"/>
      <path d="M85,70 V180 M40,125 H130" stroke="${INK}" stroke-width="2"/>
      <path d="M52,168 q14,-30 30,-8 q10,-26 30,-4" stroke="${PUMPKIN}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>
      <g class="pop" style="animation-delay:2.3s">${aaria(112, 198, 66)}</g>
      <g class="pop" style="animation-delay:2.6s"><g transform="translate(170,252)">${kid({ skin: '#8d5a3b', hair: '#1f1a17', shirt: '#3b82f6', style: 'curly', phones: true })}</g></g>
      <g class="pop" style="animation-delay:2.9s"><g transform="translate(226,252)">${kid({ skin: '#f5d0b5', hair: '#7a4a21', shirt: GOLD, style: 'short', flap: true })}</g></g>
      <g class="pop" style="animation-delay:3.2s"><g transform="translate(282,252)">${kid({ skin: '#d9a37a', hair: '#2b1a10', shirt: '#ec4899', style: 'braids', tablet: true })}</g></g>
      <g class="pull"><g transform="translate(372,336) scale(-.66,.66)">${nilu({})}</g></g>
      <g class="stretch">${tableFront(70, 300, 292)}</g>
      <g class="pop" style="animation-delay:2.0s">${pie(140, 293)}${plate(200, 296)}${corncob(250, 292)}${plate(300, 296)}${squash(330, 296)}</g>
      <g class="pop" style="animation-delay:3.5s"><g transform="translate(36,256) scale(.92)">${wheelchairKid()}</g></g>`;
  }

  function s4() {
    const bubble = (cls, x, y, w, txt, tail) => `<g class="bubble ${cls}"><g transform="translate(${x},${y})">
      <rect x="${-w / 2}" y="-20" width="${w}" height="36" rx="16" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <path d="${tail}" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="${-w / 2 + 3}" y="6" width="${w - 6}" height="8" fill="#fff"/>
      <text y="4" text-anchor="middle" font-size="16" font-weight="900" fill="${INK}" font-family="${FONT}">${esc(txt)}</text></g></g>`;
    return `
      ${room('wall4')}
      <g class="seated"><g transform="translate(226,334) scale(.72)">${turkey('happy', true)}</g></g>
      ${aaria(306, 200, 62)}
      <g transform="translate(360,254)">${kid({ skin: '#d9a37a', hair: '#2b1a10', shirt: '#ec4899', style: 'braids', tablet: true })}</g>
      ${tableFront(150, 250, 300)}
      ${pie(336, 301)}${plate(228, 304)}${corncob(184, 300)}
      <g class="later"><g transform="translate(228,296)"><path d="M-14,0 q14,-12 28,0" stroke="#e8a33b" stroke-width="7" stroke-linecap="round" fill="none"/></g></g>
      <g transform="translate(242,436) scale(.86)"><g class="peek"><g class="faint">${turkey('scared', false)}</g></g></g>
      <g transform="translate(70,438) scale(.86)"><g class="bob">${nilu({})}</g></g>
      <g class="stars"><text x="196" y="414" font-size="24">💫</text></g>
      ${bubble('b1', 222, 300, 150, t('b1'), 'M2,14 L12,36 L20,14 Z')}
      ${bubble('b2', 118, 160, 168, t('b2'), 'M-26,14 L-38,40 L-6,14 Z')}
      ${bubble('b3', 320, 160, 138, t('b3'), 'M20,14 L38,40 L42,14 Z')}`;
  }

  function s5() {
    const heart = (x, d) => `<g transform="translate(${x},350)"><g class="heart" style="animation-delay:${d}s"><path d="M0,6 C-14,-6 -8,-18 0,-10 C8,-18 14,-6 0,6Z" fill="${BODY}" stroke="${LINE}" stroke-width="1.5"/></g></g>`;
    const star = (x, y, sc, d) => `<g transform="translate(${x},${y}) scale(${sc})"><g class="twinkle" style="animation-delay:${d}s">
      <path d="M0,-12 C1.5,-3 3,-1.5 12,0 C3,1.5 1.5,3 0,12 C-1.5,3 -3,1.5 -12,0 C-3,-1.5 -1.5,-3 0,-12 Z" fill="#ffd43b" stroke="${RUST}" stroke-width="1.2" stroke-linejoin="round"/></g></g>`;
    const shine = t('shine');
    const rw = Math.max(210, shine.length * 13 + 60);
    return `
      <defs><radialGradient id="glow5" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#fde4c2"/></radialGradient></defs>
      <rect width="400" height="440" fill="url(#glow5)"/>
      ${bunting(26)}
      ${leaves(5, 11)}
      <circle cx="200" cy="196" r="134" fill="#a9dcf5" opacity=".35"/>
      <g class="pop" style="animation-delay:.2s"><image href="badge.webp" x="76" y="70" width="248" height="252"/></g>
      ${star(64, 118, 1.1, 0)}${star(338, 104, 1.3, .7)}${star(48, 250, .8, 1.4)}${star(356, 236, .9, .4)}${star(112, 70, .7, 1.1)}${star(300, 318, .75, 1.8)}
      <g class="pop" style="animation-delay:.9s"><g transform="translate(200,352)">
        <path d="M${-rw / 2 - 22},4 l18,-14 v28 z M${rw / 2 + 22},4 l-18,-14 v28 z" fill="#c25a2c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <rect x="${-rw / 2}" y="-18" width="${rw}" height="38" rx="10" fill="${INK}"/>
        <text y="8" text-anchor="middle" font-size="21" font-weight="900" fill="#ffd43b" font-family="${FONT}" letter-spacing=".5">✦ ${esc(shine)} ✦</text></g></g>
      ${pie(92, 410)}${squash(310, 412, 1.1)}${corncob(205, 414)}
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
      <svg viewBox="0 0 300 220" aria-hidden="true">
        <g transform="translate(40,206) rotate(-24)">${leaf(RUST)}</g><g transform="translate(270,30) rotate(30) scale(1.2)">${leaf(GOLD)}</g>
        <rect x="14" y="44" width="272" height="160" rx="14" fill="#f6d3a3" stroke="${INK}" stroke-width="3"/>
        <rect x="30" y="20" width="240" height="120" rx="8" fill="#fff" stroke="${INK}" stroke-width="2"/>
        <text x="150" y="70" text-anchor="middle" font-size="22" font-weight="900" fill="${INK}" font-family="${FONT}">🦃 💙</text>
        <path d="M14,92 L150,178 L286,92 V190 a14,14 0 0 1 -14,14 H28 a14,14 0 0 1 -14,-14 Z" fill="#f9dcb3" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path class="flap" d="M14,58 a14,14 0 0 1 14,-14 H272 a14,14 0 0 1 14,14 L150,140 Z" fill="#f2c487" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <g class="seal"><circle cx="150" cy="138" r="24" fill="${BODY}" stroke="${LINE}" stroke-width="3"/>
          <path d="M150,150 C134,140 138,126 150,133 C162,126 166,140 150,150Z" fill="#fff"/></g>
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
