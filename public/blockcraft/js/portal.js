/* Aaria's Block Craft 3D — the magic wormhole 🌀
   Every expressive sentence charges it with WORD POWER.
   At full charge it opens and whooshes you to the secret Sky Island. */
ABC.portal = (function () {
  let scene = null;
  const portals = [];   // { group, id:'home'|'island', rings, discMat, stars }

  function build(id, x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    // two spinning rainbow rings
    const rings = [];
    [1.6, 1.25].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.12, 10, 40),
        new THREE.MeshLambertMaterial({ color: i ? 0xb197fc : 0x4dabf7,
          emissive: i ? 0x7048e8 : 0x1864ab, emissiveIntensity: 0.4 }));
      ring.position.y = 1.8;
      g.add(ring); rings.push(ring);
    });
    // swirling center disc
    const discMat = new THREE.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.15, 30), discMat);
    disc.position.y = 1.8;
    g.add(disc);
    // orbiting stars
    const stars = [];
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), starMat);
      g.add(s); stars.push(s);
    }
    // stone base
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x9aa0a6 }));
    base.position.y = 0.15;
    g.add(base);
    scene.add(g);
    const p = { group: g, id, rings, discMat, stars, t: 0 };
    g.traverse(o => { if (o.isMesh) o.userData.portalRef = p; });
    portals.push(p);
    return p;
  }

  function init(sc) {
    scene = sc;
    const P = ABC.PORTAL;
    build('home', P.homePos.x, groundY(P.homePos.x, P.homePos.z), P.homePos.z);
    build('island', P.islandPos.x, P.islandPos.y, P.islandPos.z);
  }
  function groundY(x, z) {
    for (let y = 8; y >= ABC.world.MIN_Y; y--)
      if (ABC.world.get(Math.floor(x), y, Math.floor(z))) return y + 1;
    return 1;
  }

  function isOpen() { return (ABC.state.portalCharge || 0) >= ABC.PORTAL.NEED; }

  function refreshChip() {
    const chip = document.getElementById('portalChip');
    if (!chip) return;
    const c = Math.min(ABC.state.portalCharge || 0, ABC.PORTAL.NEED);
    chip.textContent = '🌀 ' + c + '/' + ABC.PORTAL.NEED;
    chip.classList.toggle('portalReady', isOpen());
  }

  /* clicking the 🌀 chip flies you straight to the wormhole */
  function findPortal() {
    const home = portals.find(p => p.id === 'home');
    if (!home) return;
    // if you're on the Sky Island, point to the island portal instead
    const island = portals.find(p => p.id === 'island');
    const feet = ABC.player ? ABC.player.position : { y: 0 };
    const target = (feet.y > 15 && island) ? island : home;
    ABC.flyToSite({ x: target.group.position.x, z: target.group.position.z });
    if (target.id === 'home') {
      ABC.ui.bellaSays(isOpen()
        ? 'Follow me — the wormhole is OPEN! Step right in! 🌀✨'
        : `There is the wormhole! It needs ${ABC.PORTAL.NEED - (ABC.state.portalCharge||0)} more word power to open. 💬`, 4800);
    } else {
      ABC.ui.bellaSays('That portal takes you back home! 🌀', 3600);
    }
    ABC.audio.sfx.whoosh();
  }

  /* called on every expressive-language success */
  function charge(n) {
    const was = isOpen();
    ABC.state.portalCharge = (ABC.state.portalCharge || 0) + n;
    refreshChip();
    if (!was && isOpen()) {
      ABC.audio.sfx.star();
      ABC.ui.toast('🌀 Your word power OPENED the wormhole! Tap the 🌀 button up top and I’ll take you there!', 5600, true);
      ABC.ui.confetti(24);
    }
    ABC.saveSoon && ABC.saveSoon();
  }

  function use(p) {
    const P = ABC.PORTAL;
    if (p.id === 'home') {
      if (!isOpen()) {
        const left = P.NEED - (ABC.state.portalCharge || 0);
        ABC.ui.bellaSays(`The wormhole needs word power! Use your words ${left} more time${left>1?'s':''} to open it! 💬🌀`, 4800);
        ABC.audio.sfx.gentle();
        return;
      }
      ABC.state.portalCharge = 0;
      refreshChip();
      travel(P.islandPos.x + 2, P.islandPos.y, P.islandPos.z - 2, () => {   // land safely on the island
        ABC.ui.addStars(3);
        ABC.ui.bellaSays('WHOOSH! Welcome to the secret SKY ISLAND! ☁️🌈 Your words brought you here! Step in the portal to go home.', 7000);
      });
      ABC.saveSoon && ABC.saveSoon();
    } else {
      travel(0, 1, 4, () => {
        ABC.ui.bellaSays('Home again! Keep using your words to open the wormhole once more! 💙', 5200);
      });
    }
  }

  function travel(x, y, z, after) {
    ABC.audio.sfx.whoosh();
    const flash = document.getElementById('flash');
    flash.style.transition = 'none'; flash.style.opacity = '1'; flash.style.display = 'block';
    setTimeout(() => {
      ABC.teleport(x, y, z);
      flash.style.transition = 'opacity 1.2s'; flash.style.opacity = '0';
      setTimeout(() => { flash.style.display = 'none'; }, 1300);
      after && after();
    }, 350);
  }

  function update(dt) {
    for (const p of portals) {
      p.t += dt;
      const open = p.id === 'island' || isOpen();
      const speed = open ? 3.2 : 0.6;
      p.rings[0].rotation.y += dt * speed;
      p.rings[1].rotation.y -= dt * speed * 1.4;
      p.rings[0].rotation.x = Math.sin(p.t * 0.8) * 0.2;
      p.discMat.opacity = open ? 0.55 + Math.sin(p.t * 5) * 0.2 : 0.18;
      p.discMat.color.setHSL(open ? (p.t * 0.15) % 1 : 0.58, 0.8, 0.65);
      p.stars.forEach((s, i) => {
        const a = p.t * (open ? 2.4 : 0.7) + i * Math.PI / 3;
        s.position.set(Math.cos(a) * 1.95, 1.8 + Math.sin(p.t * 2 + i) * 0.25, Math.sin(a) * 0.5);
        s.visible = open || i < 2;
      });
    }
  }

  function meshTargets() {
    const out = [];
    for (const p of portals) p.group.traverse(o => { if (o.isMesh) out.push(o); });
    return out;
  }

  /* auto-enter when walking through */
  let cooldown = 0;
  function checkWalkIn(feet, dt) {
    cooldown = Math.max(0, cooldown - dt);
    if (cooldown > 0) return;
    for (const p of portals) {
      const d = Math.hypot(feet.x - p.group.position.x, feet.z - p.group.position.z);
      const dy = Math.abs(feet.y - p.group.position.y);
      if (d < 1.3 && dy < 2.5) { cooldown = 3; use(p); return; }
    }
  }

  return { init, charge, use, update, meshTargets, refreshChip, checkWalkIn, isOpen, findPortal };
})();
