/* Aaria's Block Craft 3D — breathing-room guard 📏
   One shared registry of "this spot is taken" circles. Fixed things
   (shops, tracks, squishies, the guide) RESERVE their spots; scattered
   things (seasonal decorations, holiday props) CLAIM a spot — and if it
   is too close to something, they slide outward until the meadow has
   room to breathe. Fixes the crowded-front-yard feeling. */
ABC.space = (function () {
  const claimed = [];   // { x, z, r }

  function reserve(x, z, r) { claimed.push({ x, z, r: r || 1.5 }); }
  function isFree(x, z, r) {
    for (const c of claimed) {
      const need = (r || 1.5) + c.r;
      const dx = x - c.x, dz = z - c.z;
      if (dx * dx + dz * dz < need * need) return false;
    }
    return true;
  }
  /* find a free spot at-or-near (x,z): spiral outward, then give up gracefully */
  function claim(x, z, r) {
    r = r || 1.5;
    if (isFree(x, z, r)) { reserve(x, z, r); return { x, z }; }
    for (let ring = 1; ring <= 6; ring++) {
      const rad = ring * 2.2;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + ring * 0.7;
        const nx = x + Math.cos(a) * rad, nz = z + Math.sin(a) * rad;
        if (Math.abs(nx) > 44 || Math.abs(nz) > 44) continue;
        if (isFree(nx, nz, r)) { reserve(nx, nz, r); return { x: nx, z: nz }; }
      }
    }
    return null;   // truly no room — caller skips this decoration
  }
  return { reserve, isFree, claim, _claimed: claimed };
})();
