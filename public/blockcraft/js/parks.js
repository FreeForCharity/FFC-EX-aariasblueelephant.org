/* Aaria's Block Craft 3D — National Park Passport 📔: travel to real parks,
   hear their name, describe what you see, and collect a stamp for each one. */
ABC.parks = (function () {
  let visited = new Set();
  let cur = null;

  /* what to say when you first arrive at each park (describing words!) */
  const DESC = {
    yosemite:    { best: 'I see tall grey granite cliffs and pointy green pine trees!', off: 'I like soup.' },
    zion:        { best: 'I see big red rocks and warm orange sand all around!', off: 'My shoe is wet.' },
    grandcanyon: { best: 'I see deep canyon walls with a blue river far below!', off: 'Cats sleep.' },
    yellowstone: { best: 'I see golden grass and steamy water springs!', off: 'I have a ball.' },
    olympic:     { best: 'I see a green rainforest with mossy ground and soft rain!', off: 'It is loud.' },
    everglades:  { best: 'I see a wet swamp with tall reeds and shallow water!', off: 'I eat toast.' },
    glacier:     { best: 'I see icy blue water and shiny white snow everywhere!', off: 'Buses go fast.' },
    denali:      { best: 'I see huge snowy mountains touching the sky!', off: 'My hat is red.' },
    acadia:      { best: 'I see the blue ocean splashing on grey rocky cliffs!', off: 'Dogs bark.' },
    hawaii:      { best: 'I see black rocks and glowing orange lava by the sea!', off: 'I like Tuesdays.' },
  };

  function check(feet) {
    const reg = ABC.REGIONS.regionAt(feet.x, feet.z);
    if (reg.key === cur) return reg;
    const prev = cur;
    cur = reg.key;
    if (reg.key === 'home' || reg.key === 'wild') {
      // a gentle one-time nudge the first time you leave the meadow
      if (reg.key === 'wild' && prev === 'home' && !ABC.state.wildHint) {
        ABC.state.wildHint = true; ABC.saveSoon && ABC.saveSoon();
        ABC.ui.bellaSays('Ooh, the wild grasslands! Keep walking and you’ll discover an amazing new place! 🧭', 5200);
      }
      return reg;
    }
    const first = !visited.has(reg.key);
    ABC.ui.bellaSays(`${reg.emoji} Welcome to ${reg.name}!`, 4200);
    if (first) {
      visited.add(reg.key);
      ABC.saveSoon && ABC.saveSoon();
      ABC.ui.confetti(20);
      // one signature animal greets you (fewer animals, more meaningful)
      if (reg.animal && ABC.animals && ABC.animals.list.length < 22) {
        const a = ABC.animals.spawn(reg.animal, Math.round(feet.x) + 3, Math.round(feet.z) + 3);
        (ABC.state.friends = ABC.state.friends || []).push({ kind: reg.animal, x: a.group.position.x, z: a.group.position.z, name: a.name });
      }
      setTimeout(() => { if (!ABC.ui.isOpen()) describe(reg); }, 1800);
    }
    return reg;
  }

  function describe(reg) {
    const d = DESC[reg.key] || { best: `I am exploring ${reg.name}!`, off: 'I like blue.' };
    ABC.ui.askExpressive({
      emoji: reg.emoji,
      scene: `You stamped your passport at ${reg.name}! Tell me what you see.`,
      options: [
        { t: d.best, q: 'best' },
        { t: reg.name.split(' ')[0] + '.', q: 'name' },
        { t: d.off, q: 'off' } ],
    }, () => {
      ABC.ui.bellaSays(`${reg.emoji} A new stamp for your passport! ${visited.size}/${ABC.REGIONS.parks.length} parks!`, 5000);
    }, { stars: 2 });
  }

  function openPassport() {
    let html = `<div class="bigEmoji">📔</div><h2>My Park Passport — ${visited.size}/${ABC.REGIONS.parks.length}</h2>
      <div class="scene" style="font-size:15px;">Walk in any direction to find a new park!</div><div class="pickGrid">`;
    ABC.REGIONS.parks.forEach(p => {
      const has = visited.has(p.key);
      html += `<div class="pickCard" style="cursor:default; ${has ? 'border-color:#51cf66; background:#eaffea;' : 'opacity:.5;'}">
        <span class="ico">${has ? p.emoji : '❓'}</span>${has ? p.name : '???'}</div>`;
    });
    html += `</div><div class="dlgRow"><button class="bigBtn green" id="ppOk">Adventure! 🧭</button></div>`;
    ABC.ui.openDialog(html);
    ABC.audio.say(`Your park passport. You have visited ${visited.size} of ${ABC.REGIONS.parks.length} national parks!`);
    document.getElementById('ppOk').onclick = () => ABC.ui.closeDialog();
  }

  function serialize() { return { visited: [...visited] }; }
  function deserialize(d) { if (d && d.visited) visited = new Set(d.visited); }

  return { check, openPassport, serialize, deserialize, count: () => visited.size };
})();
