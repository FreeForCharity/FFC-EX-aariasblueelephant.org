/* Aaria's Block Craft 3D — Music & Dance corner 🎵
   A little stage near spawn with 5 big rainbow note blocks.
   Tap a note → a pentatonic bell rings, the block glows,
   and every animal friend nearby starts to dance! 💃🐾 */
ABC.music = (function () {
  let scene = null;
  const notes = [];          // { mesh, mat, baseY, freq, pulse }
  let notesPlayed = 0;       // per session — 8 notes = a whole song! 🎶
  let celebrated = false;
  let raf = false;

  /* stage footprint: 4x4 at (12, 8) */
  const X0 = 12, Z0 = 8, W = 4;
  const CX = X0 + W / 2, CZ = Z0 + W / 2;   // stage center (for the dance circle)
  let stageY = 1;

  /* 🌈 five notes, five colors — C D E G A (pentatonic, always pretty) */
  const NOTES = [
    { freq: 523.25, color: 0xfa5252 },   // 🔴 C
    { freq: 587.33, color: 0xffa94d },   // 🟠 D
    { freq: 659.25, color: 0xffd43b },   // 🟡 E
    { freq: 783.99, color: 0x69db7c },   // 🟢 G
    { freq: 880.00, color: 0x4dabf7 },   // 🔵 A
  ];

  /* a soft bell tone — same WebAudio style as js/audio.js */
  function bell(freq, dur, vol, when) {
    if (!ABC.audio.settings.sound) return;
    const c = ABC.audio.ensureCtx();
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* ---------------- build the stage 🎤 ---------------- */
  function init(sc) {
    scene = sc;
    // sit the stage on top of the tallest ground in its footprint
    let top = 0;
    for (let x = X0; x < X0 + W; x++) for (let z = Z0; z < Z0 + W; z++) {
      const tb = ABC.world.topBlock(x, z);
      if (tb && tb.y > top) top = tb.y;
    }
    stageY = top + 1;
    // 4x4 stone stage with shiny gold corners ✨
    for (let x = X0; x < X0 + W; x++) for (let z = Z0; z < Z0 + W; z++) {
      const corner = (x === X0 || x === X0 + W - 1) && (z === Z0 || z === Z0 + W - 1);
      ABC.world.set(x, stageY, z, corner ? 'gold' : 'stone');
    }
    ABC.world.flush();

    // 5 big floating note blocks along the front edge (facing spawn)
    const geo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    NOTES.forEach((n, i) => {
      const mat = new THREE.MeshLambertMaterial({
        color: n.color, emissive: n.color, emissiveIntensity: 0.25 });
      const mesh = new THREE.Mesh(geo, mat);
      const note = { mesh, mat, baseY: stageY + 1.6, freq: n.freq, pulse: 0, i };
      mesh.position.set(X0 - 0.2 + i * (W + 0.4) / (NOTES.length - 1), note.baseY, Z0 - 0.8);
      mesh.userData.noteRef = note;
      scene.add(mesh);
      notes.push(note);
    });

    if (!raf) { raf = true; requestAnimationFrame(animate); }
  }

  /* gentle bob, slow spin, and the glow-pulse fade 🌟 */
  function animate() {
    requestAnimationFrame(animate);
    const t = performance.now() / 1000;
    for (const n of notes) {
      n.mesh.position.y = n.baseY + Math.sin(t * 2 + n.i * 1.3) * 0.12;
      n.mesh.rotation.y += 0.008 + n.pulse * 0.06;
      n.pulse = Math.max(0, n.pulse - 0.025);
      n.mat.emissiveIntensity = 0.25 + n.pulse * 0.75;
    }
  }

  /* every animal within 8 blocks of the stage wiggles along 💃 */
  function danceParty() {
    const now = performance.now() / 1000;
    for (const a of ABC.animals.list) {
      const d = Math.hypot(a.group.position.x - CX, a.group.position.z - CZ);
      if (d <= 8) ABC.animals.celebrate(a, now);
    }
  }

  /* ---------------- click routing from main.js ---------------- */
  function meshTargets() { return notes.map(n => n.mesh); }

  function handleClick(mesh) {
    const note = mesh.userData.noteRef;
    if (!note) return;
    bell(note.freq, 0.55, 0.14);          // the note 🎵
    bell(note.freq * 2, 0.7, 0.06, 0.04); // a sparkly octave on top ✨
    note.pulse = 1;
    danceParty();
    notesPlayed++;
    if (notesPlayed === 1) {
      ABC.ui.toast('🎵 Music time! Tap the rainbow notes — the animals will dance!', 3400);
    }
    if (notesPlayed === 8 && !celebrated) {   // a whole song! 🎶
      celebrated = true;
      ABC.ui.confetti(30);
      ABC.audio.sfx.fanfare();
      ABC.ui.bellaSays('What a beautiful song, {player}! The animals love your music! 🎶', 5600);
      ABC.ui.addStars(2);
    }
  }

  /* stateless — no-ops kept for save/load symmetry 💾 */
  function serialize() { return null; }
  function deserialize(data) { /* nothing to restore 🎵 */ }

  return { init, meshTargets, handleClick, serialize, deserialize };
})();
