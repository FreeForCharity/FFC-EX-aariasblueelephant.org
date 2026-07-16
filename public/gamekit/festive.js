/*! © 2026 Aaria's Blue Elephant · shared festive calendar 🎃🪔🎄
 * One source of truth for seasons + holidays across ALL games (kit and
 * legacy). Games ask WHAT day it is; each game draws its own decorations
 * in its own style. US holidays + Diwali (real dates per year).
 *   ABEFestive.season()   -> 'winter'|'spring'|'summer'|'fall'
 *   ABEFestive.holiday()  -> 'newyear'|'mlk'|'valentine'|'flags'|'juneteenth'
 *                            |'july4'|'halloween'|'diwali'|'thanksgiving'
 *                            |'christmas'|null
 *   ABEFestive.hello()    -> { en, es } greeting for today (holiday wins)
 * Everything gentle and sensory-friendly — twinkles, never bangs. */
(function () {
  const nth = (yr, mo, dow, n) => {
    const first = new Date(yr, mo - 1, 1).getDay();
    return 1 + ((dow - first + 7) % 7) + (n - 1) * 7;
  };
  const DIWALI = { 2025: [10, 20], 2026: [11, 8], 2027: [10, 29], 2028: [10, 17], 2029: [11, 5], 2030: [10, 26] };

  function season(d) {
    const m = (d || new Date()).getMonth() + 1;
    return m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'fall';
  }
  function holiday(now) {
    const d = now || new Date();
    const yr = d.getFullYear(), mo = d.getMonth() + 1, dy = d.getDate();
    const in_ = (m1, d1, m2, d2) => (mo > m1 || (mo === m1 && dy >= d1)) && (mo < m2 || (mo === m2 && dy <= d2));
    const dw = DIWALI[yr];
    if (dw && mo === dw[0] && Math.abs(dy - dw[1]) <= 4) return 'diwali';
    if (in_(1, 1, 1, 7)) return 'newyear';
    if (mo === 1 && Math.abs(dy - nth(yr, 1, 1, 3)) <= 1) return 'mlk';
    if (in_(2, 7, 2, 14)) return 'valentine';
    const mem = (() => { const last = new Date(yr, 5, 0).getDate(); for (let k = last; k > last - 7; k--) if (new Date(yr, 4, k).getDay() === 1) return k; })();
    if (mo === 5 && dy >= mem - 3) return 'flags';
    if (in_(6, 17, 6, 21)) return 'juneteenth';
    if (in_(7, 1, 7, 7)) return 'july4';
    if (mo === 9 && dy <= nth(yr, 9, 1, 1) + 1) return 'flags';
    if (in_(10, 15, 10, 31)) return 'halloween';
    if (mo === 11 && Math.abs(dy - 11) <= 1) return 'flags';
    const tg = nth(yr, 11, 4, 4);
    if (mo === 11 && dy >= tg - 5 && dy <= tg + 2) return 'thanksgiving';
    if (in_(12, 1, 12, 27)) return 'christmas';
    return null;
  }
  const HELLO = {
    newyear: ['🎉 Happy New Year!', '🎉 ¡Feliz Año Nuevo!'],
    mlk: ['💖 Kindness Day! Dr. King taught us to be kind helpers!', '💖 ¡Día de la Bondad! ¡El Dr. King nos enseñó a ser amables!'],
    valentine: ['💖 Happy Valentine’s Day!', '💖 ¡Feliz Día del Amor!'],
    flags: ['🇺🇸 A day to say thank you — the flags are up!', '🇺🇸 Un día para dar gracias — ¡las banderas ondean!'],
    juneteenth: ['🎉 Happy Juneteenth — a day of freedom and joy!', '🎉 ¡Feliz Juneteenth — un día de libertad y alegría!'],
    july4: ['🎆 Happy Fourth of July — gentle twinkles tonight!', '🎆 ¡Feliz Cuatro de Julio — destellos suaves esta noche!'],
    halloween: ['🎃 Happy Halloween!', '🎃 ¡Feliz Halloween!'],
    diwali: ['🪔 Happy Diwali — the festival of lights!', '🪔 ¡Feliz Diwali — el festival de las luces!'],
    thanksgiving: ['🦃 Happy Thanksgiving!', '🦃 ¡Feliz Día de Acción de Gracias!'],
    christmas: ['🎄 Merry Christmas!', '🎄 ¡Feliz Navidad!'],
    winter: ['⛄ A frosty winter day!', '⛄ ¡Un día de invierno escarchado!'],
    spring: ['🌸 A blossomy spring day!', '🌸 ¡Un día de primavera florido!'],
    summer: ['🌻 A sunny summer day!', '🌻 ¡Un día soleado de verano!'],
    fall: ['🍂 A crunchy-leaf fall day!', '🍂 ¡Un día de otoño con hojitas crujientes!'],
  };
  function hello(d) {
    const h = holiday(d) || season(d);
    const pair = HELLO[h] || HELLO.summer;
    return { id: h, en: pair[0], es: pair[1] };
  }
  /* the drifting sky sprites each occasion likes (games render these) */
  const DRIFT = {
    newyear: ['✨', '🎉'], mlk: ['💖'], valentine: ['💖', '💝'], flags: [],
    juneteenth: ['✨', '🎉'], july4: ['✨'], halloween: ['👻', '🍂'],
    diwali: ['✨'], thanksgiving: ['🍂', '🍁'], christmas: ['❄️'],
    winter: ['❄️'], spring: ['🦋', '🌸'], summer: ['🐝', '🦋'], fall: ['🍂', '🍁'],
  };
  /* the greeting, at most once per game per day */
  function helloOnce(slug) {
    const h = hello();
    try {
      const k = 'abe.festive.' + slug, v = h.id + ':' + new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(k) === v) return null;
      localStorage.setItem(k, v);
    } catch (e) {}
    return h;
  }
  window.ABEFestive = { season, holiday, hello, helloOnce, drift: (d) => DRIFT[holiday(d) || season(d)] || [] };
})();
