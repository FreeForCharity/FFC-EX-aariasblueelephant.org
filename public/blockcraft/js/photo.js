/* Aaria's Block Craft 3D — photo mode 📸: snap pictures, pick caption words, keep an album */
ABC.photo = (function () {
  const $ = (id) => document.getElementById(id);
  const MAX_PHOTOS = 12;       // localStorage is small — the oldest photo makes room
  let photos = [];             // [{ img, caption, date }]

  /* 💬 fun caption ideas — three are offered each time */
  const CAPTIONS = [
    'My amazing creation! 🏗️',
    'Look at my world! 🌍',
    'Me and my animal friends! 🐾',
    'I built this all by myself! 💪',
    'What a beautiful day! 🌈',
    'My favorite place! 💙',
    'Made by {player}! 🌟',
    'So much fun today! 🎉',
  ];

  /* ⚡ white camera flash (reuses the #flash overlay) */
  function flash() {
    const f = $('flash');
    f.style.display = 'block';
    setTimeout(() => { f.style.display = 'none'; }, 130);
  }

  /* grab the 3D view onto a small offscreen canvas (no caption yet) */
  function captureFrame() {
    const src = $('gameCanvas');
    if (ABC.renderScene) ABC.renderScene();   // fresh frame, so toDataURL is never blank
    const W = 480, BANNER = 54;
    const H = Math.max(1, Math.round(W * src.height / src.width));
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H + BANNER;
    const g = cv.getContext('2d');
    g.fillStyle = '#aee7ff';
    g.fillRect(0, 0, W, H);
    g.drawImage(src, 0, 0, W, H);
    return cv;
  }

  /* stamp caption + date + branding banner at the bottom, return a JPEG data URL */
  function stamp(cv, caption) {
    const g = cv.getContext('2d');
    const W = cv.width, BANNER = 54, top = cv.height - BANNER;
    g.fillStyle = '#fff9db';
    g.fillRect(0, top, W, BANNER);
    g.fillStyle = '#ffd43b';
    g.fillRect(0, top, W, 3);
    g.textAlign = 'center';
    let size = 19;
    const fnt = (s, b) => (b ? 'bold ' : '') + s + 'px "Comic Sans MS","Chalkboard SE","Segoe UI",sans-serif';
    g.font = fnt(size, true);
    while (size > 11 && g.measureText(caption).width > W - 16) { size--; g.font = fnt(size, true); }
    g.fillStyle = '#1d4ed8';
    g.fillText(caption, W / 2, top + 25);
    g.fillStyle = '#5c4500';
    g.font = fnt(12, false);
    g.fillText("Aaria's Block Craft 3D 🐘💙 · " + new Date().toLocaleDateString(), W / 2, top + 44);
    return cv.toDataURL('image/jpeg', 0.7);
  }

  function keep(img, caption) {
    photos.push({ img, caption, date: new Date().toISOString().slice(0, 10) });
    while (photos.length > MAX_PHOTOS) photos.shift();   // oldest makes room
    ABC.saveSoon && ABC.saveSoon();
  }

  /* one-call snap: capture + caption + save to the album, returns the data URL */
  function snap(caption) {
    caption = ABC.tpl(caption || CAPTIONS[0]);
    flash();
    const img = stamp(captureFrame(), caption);
    keep(img, caption);
    return img;
  }

  /* 📸 side-button flow: snap → preview → pick caption words → into the album! */
  function takePhoto() {
    if (ABC.ui.isOpen()) return;
    const cv = captureFrame();
    flash();
    ABC.audio.sfx.pop();
    const opts = ABC.ui.pick3(CAPTIONS).map(c => ABC.tpl(c));
    let html = `<div class="bigEmoji">📸</div><h2>Say cheese!</h2>
      <img src="${cv.toDataURL('image/jpeg', 0.8)}" alt=""
        style="width:min(80vw,400px); border-radius:16px; border:4px solid #74c0fc; box-shadow:0 4px 10px rgba(0,0,0,.2);">
      <div class="scene" style="margin-top:10px;">Pick the words for your photo! 💬</div>`;
    opts.forEach((c, i) => {
      html += `<button class="choiceBtn capBtn" data-i="${i}">🗨️ ${ABC.ui.esc(c)}</button>`;
    });
    html += `<div class="dlgRow">
      <button class="bigBtn" id="phAlbum" style="font-size:16px; padding:10px 18px;">📔 My album</button>
      <button class="bigBtn" id="phNo" style="font-size:16px; padding:10px 18px;">↩️ Not now</button></div>`;
    ABC.ui.openDialog(html);
    ABC.audio.say('Say cheese! What a great photo! Pick the words for it!');
    document.querySelectorAll('.capBtn').forEach(b => {
      b.addEventListener('click', () => {
        const caption = opts[+b.dataset.i];
        keep(stamp(cv, caption), caption);
        ABC.ui.closeDialog();
        ABC.ui.confetti(14);
        ABC.audio.sfx.ding();
        ABC.ui.addStars(1);
        ABC.ui.toast('📸 Photo saved! Tap 📸 then 📔 to see your album!', 3800, true);
      });
    });
    $('phAlbum').onclick = () => { ABC.ui.closeDialog(); setTimeout(openAlbum, 60); };
    $('phNo').onclick = () => { ABC.audio.sfx.gentle(); ABC.ui.closeDialog(); };
  }

  /* 📔 scrollable album of saved photos */
  function openAlbum() {
    let html = `<div class="bigEmoji">📔</div><h2>{player}'s Photo Album</h2>`;
    if (!photos.length) {
      html += `<div class="scene">No photos yet! 📸 Tap “New photo” to take your very first one!</div>`;
    } else {
      html += `<div class="scene">${photos.length} wonderful ${photos.length === 1 ? 'photo' : 'photos'}! 💙</div>
        <div class="pickGrid">`;
      photos.slice().reverse().forEach((p, i) => {
        html += `<div style="width:200px; background:#fff; border:3px solid #cde; border-radius:16px; padding:8px;">
          <img src="${p.img}" alt="" style="width:100%; border-radius:10px;">
          <div style="font-size:14px; color:#234; margin:6px 0; line-height:1.3;">${ABC.ui.esc(p.caption)}</div>
          <div style="font-size:11px; color:#789;">${p.date}</div>
          <a href="${p.img}" download="block-craft-photo-${p.date}-${photos.length - i}.jpg"
            style="display:inline-block; margin-top:6px; font-size:13px; text-decoration:none;
            background:#d0ebff; color:#1864ab; padding:6px 14px; border-radius:12px;">💾 Save</a>
        </div>`;
      });
      html += '</div>';
    }
    html += `<div class="dlgRow">
      <button class="bigBtn" id="albSnap" style="font-size:18px; padding:10px 22px;">📸 New photo</button>
      <button class="bigBtn green" id="albOk">Back to playing! 🎮</button></div>`;
    ABC.ui.openDialog(ABC.tpl(html));
    ABC.audio.say(photos.length ? 'Look at all your beautiful photos!'
                                : 'Your album is ready for its very first photo!');
    $('albSnap').onclick = () => { ABC.ui.closeDialog(); setTimeout(takePhoto, 60); };
    $('albOk').onclick = () => { ABC.audio.sfx.pop(); ABC.ui.closeDialog(); };
  }

  /* ---------------- save / load ---------------- */
  function serialize() { return { photos }; }
  function deserialize(d) {
    photos = (d && Array.isArray(d.photos)) ? d.photos.slice(-MAX_PHOTOS) : [];
  }

  return { snap, takePhoto, openAlbum, serialize, deserialize };
})();
