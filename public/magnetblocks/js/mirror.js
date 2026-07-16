/* Magnet Blocks — Mirror Magic 🪞 (ported from Block Craft, AJ-approved)
   A toggle raises a shimmer line across the table; every piece placed on
   one side appears mirrored on the other, and removing one removes its
   twin. Mirrored pieces are REAL pieces — they save, replay and tidy up
   like any other. Symmetry the fun way. */
window.MB = window.MB || {};
MB.Mirror = (function () {
  let on = false, sheet = null;
  const links = new Map();          // uid -> partner inst

  const planeX = () => MB.Builder.table.center.x;
  const scene = () => MB.Builder.scene;

  function buildSheet() {
    const half = MB.Builder.table.half;
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 0.6, 2.2),
      new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.28,
        side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.y = Math.PI / 2;
    m.position.set(planeX(), MB.Builder.table.y + 1.1, MB.Builder.table.center.z);
    g.add(m);
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      s.position.set(planeX(), MB.Builder.table.y + 0.06,
        MB.Builder.table.center.z - half + (i / 8) * half * 2);
      g.add(s);
    }
    return g;
  }

  function toggle() {
    on = !on;
    if (on) {
      if (!sheet) sheet = buildSheet();
      scene().add(sheet);
      MB.Audio.sparkle();
      MB.ui.toast(ABELang.t('🪞 Mirror Magic ON! Build on one side — the mirror builds the other!'), 3800);
    } else {
      if (sheet) scene().remove(sheet);
      MB.Audio.pop();
      MB.ui.toast(ABELang.t('🪞 Mirror Magic off. Your pieces stay!'), 2600);
    }
    return on;
  }

  /* called right after a piece lands on the table */
  function echo(inst) {
    if (!on || !inst.onTable) return;
    const px = planeX();
    const x2 = 2 * px - inst.group.position.x;
    if (Math.abs(x2 - inst.group.position.x) < 0.45) return;   // on the line itself
    // don't double up if something already sits there
    for (const b of MB.Magnet.blocks) {
      if (b.onTable && Math.abs(b.group.position.x - x2) < 0.3 &&
          Math.abs(b.group.position.z - inst.group.position.z) < 0.3 &&
          Math.abs(b.group.position.y - inst.group.position.y) < 0.3) return;
    }
    const clone = MB.Magnet.createBlock(inst.def.id, inst.color);
    if (!clone) return;
    clone.group.position.set(x2, inst.group.position.y, inst.group.position.z);
    const e = new THREE.Euler().setFromQuaternion(inst.group.quaternion, 'YXZ');
    clone.group.quaternion.setFromEuler(new THREE.Euler(0, -e.y, 0, 'YXZ'));
    clone.onTable = true;
    clone.group.userData.seq = MB.Bag.nextSeq();
    scene().add(clone.group);
    links.set(inst.uid, clone);
    links.set(clone.uid, inst);
    MB.Audio.snap();
    if (MB.Stats) MB.Stats.bump('blocksPlaced');
  }

  /* called when a piece is removed — its twin goes home too */
  function echoRemove(inst) {
    const partner = links.get(inst.uid);
    links.delete(inst.uid);
    if (!partner) return;
    links.delete(partner.uid);
    if (MB.Magnet.blocks.includes(partner)) {
      MB.Magnet.removeBlock(partner);
      MB.Audio.pop();
    }
  }

  return { toggle, echo, echoRemove, isOn: () => on };
})();
