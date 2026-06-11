/* Aaria's Block Craft 3D — UI: HUD, dialogs, the expressive-communication engine */
ABC.state = {
  playerName: 'Aaria',
  stars: 0, hearts: 0,
  unlocked: new Set(),        // unlocked block ids (locked blocks)
  completed: new Set(),       // completed project ids
  tutorialDone: false,
};
/* {player} templating — used across all game text */
ABC.tpl = (s) => String(s).replaceAll('{player}', ABC.state.playerName || 'Aaria');

ABC.ui = (function () {
  const $ = (id) => document.getElementById(id);
  const overlay = () => $('dialogOverlay');
  const box = () => $('dialogBox');
  let dialogOpen = false;
  let currentRecog = null;

  /* ---------------- dialogs ---------------- */
  function openDialog(html) {
    if (document.pointerLockElement) document.exitPointerLock();
    box().innerHTML = html;
    overlay().style.display = 'flex';
    dialogOpen = true;
  }
  function closeDialog() {
    overlay().style.display = 'none';
    box().innerHTML = '';
    dialogOpen = false;
    ABC.audio.stopSay();
    if (currentRecog) { try { currentRecog.abort(); } catch(e){} currentRecog = null; }
  }
  function isOpen() { return dialogOpen; }

  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const pick3 = (arr) => shuffle(arr).slice(0, 3);

  /* ---------------- toasts / mascot messages ---------------- */
  function toast(msg, dur, speak) {
    msg = ABC.tpl(msg);
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = msg;
    $('toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .5s'; t.style.opacity = '0';
      setTimeout(()=>t.remove(), 500); }, dur || 3200);
    if (speak) ABC.audio.say(msg);
  }
  function bellaSays(msg, dur) { toast('🐘💙 <b>Bella:</b> ' + msg, dur || 4200, true); }

  /* ---------------- confetti & hearts ---------------- */
  const CONF = ['🎉','⭐','🌈','💖','✨','🎊','🌸','💙'];
  function confetti(n) {
    for (let i=0;i<(n||34);i++) {
      const d = document.createElement('div');
      d.className = 'confetti';
      d.textContent = pick(CONF);
      d.style.left = Math.random()*100 + 'vw';
      d.style.animationDuration = (1.8 + Math.random()*2.2) + 's';
      d.style.fontSize = (16 + Math.random()*22) + 'px';
      document.body.appendChild(d);
      setTimeout(()=>d.remove(), 4500);
    }
  }
  function floatHearts(n) {
    for (let i=0;i<(n||5);i++) {
      const d = document.createElement('div');
      d.className = 'floatHeart';
      d.textContent = pick(['💖','💗','💙','💛']);
      d.style.left = (40 + Math.random()*20) + 'vw';
      d.style.top = (45 + Math.random()*20) + 'vh';
      d.style.animationDelay = (Math.random()*0.6) + 's';
      document.body.appendChild(d);
      setTimeout(()=>d.remove(), 2400);
    }
  }

  /* ---------------- score ---------------- */
  function refreshScore() {
    $('starChip').textContent = '⭐ ' + ABC.state.stars;
    $('heartChip').textContent = '💖 ' + ABC.state.hearts;
  }
  function addStars(n) {
    const before = ABC.state.stars;
    ABC.state.stars += n;
    refreshScore();
    ABC.audio.sfx.star();
    if (Math.floor(before/10) !== Math.floor(ABC.state.stars/10)) {
      confetti(40); ABC.audio.sfx.fanfare();
      const a = ABC.animals.spawnSurprise();
      bellaSays(`${ABC.state.stars} stars! A surprise friend — ${a.name} the ${a.def.label} ${a.def.emoji} — came to play!`, 5200);
    }
    ABC.saveSoon && ABC.saveSoon();
  }
  function addHearts(n) {
    ABC.state.hearts += n;
    refreshScore();
    floatHearts(4);
    const m = ABC.KIND_MILESTONES[ABC.state.hearts];
    if (m) {
      confetti(40); ABC.audio.sfx.fanfare();
      setTimeout(()=>{ toast(m, 5200, true); }, 400);
      if (ABC.state.hearts === 10) ABC.animals.spawnSurprise();
      if (ABC.state.hearts === 5) ABC.bloomFlowers && ABC.bloomFlowers();
      if (ABC.state.hearts === 20) {   // the rainbow puzzle elephant arrives 🐘🌈
        const p = ABC.player ? ABC.player.position : { x: 0, z: 0 };
        ABC.animals.spawn('puzzleEle', Math.round(p.x) + 4, Math.round(p.z) + 4);
      }
    }
    ABC.saveSoon && ABC.saveSoon();
  }

  /* ============================================================
     EXPRESSIVE COMMUNICATION ENGINE
     prompt: { emoji, scene, options:[{t,q}] }  q: best|name|off
     Voice mode: child reads the best sentence aloud instead.
     ============================================================ */
  function askExpressive(prompt, onSuccess, opts) {
    opts = opts || {};
    // apply {player} templating once, up front
    prompt = { emoji: prompt.emoji, scene: ABC.tpl(prompt.scene),
      options: prompt.options.map(o => ({ t: ABC.tpl(o.t), q: o.q })) };
    if (ABC.audio.settings.voiceMode && ABC.audio.hasSR) {
      voiceRound(prompt, onSuccess, opts);
    } else {
      choiceRound(prompt, onSuccess, opts, 0);
    }
  }

  function choiceRound(prompt, onSuccess, opts, attempt) {
    const options = shuffle(prompt.options);
    let html = `<div class="bigEmoji">${prompt.emoji || '💬'}</div>
      <h2>Use Your Words! 💬</h2>
      <div class="scene">${prompt.scene}</div>`;
    options.forEach((o, i) => {
      html += `<button class="choiceBtn" data-i="${i}">🗨️ ${esc(o.t)}
        <span class="speakIco" data-say="${i}">🔊</span></button>`;
    });
    openDialog(html);
    ABC.audio.say(prompt.scene);

    box().querySelectorAll('.speakIco').forEach(s => {
      s.addEventListener('click', (e) => {
        e.stopPropagation();
        ABC.audio.say(options[+s.dataset.say].t, { force: true });
      });
    });
    box().querySelectorAll('.choiceBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const o = options[+btn.dataset.i];
        if (o.q === 'best') {
          btn.classList.add('correct');
          ABC.audio.sfx.ding();
          const praise = pick(ABC.PRAISE);
          setTimeout(() => {
            closeDialog();
            confetti(18);
            addStars(opts.stars != null ? opts.stars : 1);
            ABC.portal && ABC.portal.charge(1);    // word power 🌀
            toast('🌟 ' + praise, 3600, true);
            onSuccess && onSuccess(o);
          }, 650);
        } else if (o.q === 'name') {
          btn.classList.add('again');
          ABC.audio.sfx.gentle();
          const coach = pick(ABC.COACH_NAMING);
          toast('🐘💙 ' + coach, 4200, true);
          setTimeout(()=>btn.classList.remove('again'), 900);
        } else {
          btn.classList.add('again');
          ABC.audio.sfx.sad();
          const coach = pick(ABC.COACH_WRONG);
          toast('🐘💙 ' + coach, 3800, true);
          setTimeout(()=>btn.classList.remove('again'), 900);
        }
      });
    });
  }

  /* ---- Voice mode: read the sentence aloud ---- */
  function voiceRound(prompt, onSuccess, opts, attempt) {
    attempt = attempt || 0;
    const best = prompt.options.find(o => o.q === 'best');
    let html = `<div class="bigEmoji">${prompt.emoji || '🎤'}</div>
      <h2>Say It Out Loud! 🎤</h2>
      <div class="scene">${prompt.scene}</div>
      <div class="sentenceCard">“${esc(best.t)}” <span class="speakIco" id="vSayIt">🔊</span></div>
      <button id="micCircle">🎤</button>
      <div id="vStatus" class="scene" style="min-height:28px; font-size:17px; color:#666;">Press the microphone, then say the sentence!</div>
      <div class="dlgRow"><button class="bigBtn" id="vChoices" style="font-size:16px; padding:10px 18px; background:linear-gradient(180deg,#d0ebff,#a5d8ff); color:#1864ab; box-shadow:0 4px 0 #4dabf7;">📋 Show choices instead</button></div>`;
    openDialog(html);
    ABC.audio.say(prompt.scene + ' ... Press the microphone and say: ' + best.t);

    $('vSayIt').onclick = () => ABC.audio.say(best.t, { force: true });
    $('vChoices').onclick = () => choiceRound(prompt, onSuccess, opts, 0);

    const succeed = () => {
      ABC.audio.sfx.ding();
      $('vStatus').textContent = '🌟 You said it beautifully!';
      setTimeout(() => {
        closeDialog(); confetti(22);
        addStars((opts.stars != null ? opts.stars : 1) + 1);  // bonus star for using voice!
        ABC.portal && ABC.portal.charge(1);    // word power 🌀
        toast('🌟 ' + pick(ABC.PRAISE) + ' (+1 voice bonus ⭐)', 3800, true);
        onSuccess && onSuccess(best);
      }, 800);
    };

    $('micCircle').onclick = () => {
      const mic = $('micCircle');
      mic.classList.add('listening');
      $('vStatus').textContent = '👂 I am listening…';
      ABC.audio.stopSay();
      let gotResult = false;
      currentRecog = ABC.audio.listen(
        (alts) => {
          gotResult = true;
          mic.classList.remove('listening');
          const heard = alts[0] || '';
          $('vStatus').textContent = `I heard: “${heard}”`;
          if (matchSentence(heard, best.t) || alts.some(a => matchSentence(a, best.t))) {
            succeed();
          } else {
            attempt++;
            if (attempt >= 2) {
              // Always end with success — effort counts!
              $('vStatus').textContent = '💛 Great trying! Your words are getting stronger every day!';
              setTimeout(succeed, 700);
            } else {
              ABC.audio.sfx.gentle();
              ABC.audio.say('Good try! Let’s say it one more time, nice and slow.');
              $('vStatus').textContent = '💛 Good try! Press the mic and say it one more time, nice and slow.';
            }
          }
        },
        (why) => {
          mic.classList.remove('listening');
          if (!gotResult) {
            if (why === 'unsupported' || why === 'error') {
              $('vStatus').textContent = 'Hmm, the microphone is shy today. Let’s use choices!';
              setTimeout(() => choiceRound(prompt, onSuccess, opts, 0), 1200);
            } else {
              $('vStatus').textContent = 'I didn’t hear anything — press the mic and try again!';
            }
          }
        });
    };
  }

  /* Lenient: ≥45% of the target's important words heard => success */
  function matchSentence(heard, target) {
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w => w.length > 2);
    const h = new Set(norm(heard));
    const t = norm(target);
    if (!t.length) return false;
    const hits = t.filter(w => h.has(w)).length;
    return hits / t.length >= 0.45;
  }

  /* ---------------- pick-a-card helper (for slime/oreo/kind acts) ---------------- */
  function pickCard(title, sceneText, cards, onPick, emoji) {
    sceneText = ABC.tpl(sceneText);
    let html = `<div class="bigEmoji">${emoji || '✨'}</div><h2>${title}</h2>
      <div class="scene">${sceneText}</div><div class="pickGrid">`;
    cards.forEach((c, i) => {
      html += `<button class="pickCard" data-i="${i}"><span class="ico">${c.ico}</span>${esc(c.label)}</button>`;
    });
    html += '</div>';
    openDialog(html);
    ABC.audio.say(sceneText);
    box().querySelectorAll('.pickCard').forEach(b => {
      b.addEventListener('click', () => {
        ABC.audio.sfx.pop();
        onPick(cards[+b.dataset.i]);
      });
    });
  }

  /* ---------------- simple message dialog ---------------- */
  function message(title, bodyHtml, btnLabel, onClose, emoji) {
    title = ABC.tpl(title); bodyHtml = ABC.tpl(bodyHtml);
    openDialog(`<div class="bigEmoji">${emoji || '💬'}</div><h2>${title}</h2>
      <div class="scene">${bodyHtml}</div>
      <div class="dlgRow"><button class="bigBtn green" id="msgOk">${btnLabel || 'OK! 👍'}</button></div>`);
    ABC.audio.say(title + '. ' + bodyHtml);
    $('msgOk').onclick = () => { ABC.audio.sfx.pop(); closeDialog(); onClose && onClose(); };
  }

  /* ---------------- hotbar ---------------- */
  let selectedBlock = 'plank';
  function buildHotbar() {
    const bar = $('hotbar');
    bar.innerHTML = '';
    const avail = ABC.HOTBAR_ORDER.filter(id => !ABC.BLOCK_DEFS[id].locked || ABC.state.unlocked.has(id));
    avail.forEach((id, i) => {
      const def = ABC.BLOCK_DEFS[id];
      const slot = document.createElement('div');
      slot.className = 'hotSlot' + (id === selectedBlock ? ' selected' : '');
      slot.dataset.block = id;
      slot.innerHTML = `<div class="swatch" style="background:${def.color}">${def.emoji}</div><div>${i<9 ? (i+1) : ''}</div>`;
      slot.title = def.name;
      slot.addEventListener('click', () => selectBlock(id));
      bar.appendChild(slot);
    });
    if (!avail.includes(selectedBlock)) selectBlock(avail[0]);
  }
  function selectBlock(id) {
    selectedBlock = id;
    document.querySelectorAll('.hotSlot').forEach(s =>
      s.classList.toggle('selected', s.dataset.block === id));
    ABC.audio.sfx.gentle();
    if (ABC.refreshHand) ABC.refreshHand();
  }
  function selectByIndex(i) {
    const avail = ABC.HOTBAR_ORDER.filter(id => !ABC.BLOCK_DEFS[id].locked || ABC.state.unlocked.has(id));
    if (avail[i]) selectBlock(avail[i]);
  }
  function getSelected() { return selectedBlock; }
  function unlockBlock(id) {
    if (ABC.state.unlocked.has(id)) return;
    ABC.state.unlocked.add(id);
    buildHotbar();
    toast(`🎁 New block unlocked: ${ABC.BLOCK_DEFS[id].emoji} <b>${ABC.BLOCK_DEFS[id].name}</b>! Find it in your block bar!`, 4500, true);
    ABC.saveSoon && ABC.saveSoon();
  }

  /* ---------------- settings & help ---------------- */
  function showSettings() {
    const s = ABC.audio.settings;
    const chk = (v) => v ? '✅' : '⬜';
    openDialog(`<img src="logo.png" style="width:90px;border-radius:50%;box-shadow:0 4px 12px rgba(0,0,0,.2);" alt=""><h2>Settings</h2>
      <button class="choiceBtn" id="setName">✏️ Player name: <b>${esc(ABC.state.playerName)}</b> — tap to change</button>
      <button class="choiceBtn" id="setVoice">${chk(s.voiceMode)} 🎤 Voice Mode — say sentences out loud ${ABC.audio.hasSR ? '' : '(needs Chrome/Edge)'}</button>
      <button class="choiceBtn" id="setRead">${chk(s.readAloud)} 🔊 Read everything aloud</button>
      <button class="choiceBtn" id="setSound">${chk(s.sound)} 🎵 Sound effects</button>
      <button class="choiceBtn" id="setMusic">${chk(s.music)} 🎶 Gentle music</button>
      <button class="choiceBtn" id="setReset" style="border-color:#ffa8a8;">🧹 Start a brand-new world (erases this one)</button>
      <div class="scene" style="font-size:15px; color:#557;">Made with 💙 by <b>${ABC.BRAND.org}</b> — ${ABC.BRAND.tagline}<br>${ABC.BRAND.url.replace('https://','')}</div>
      <div class="dlgRow"><button class="bigBtn green" id="setDone">Done ✔</button></div>`);
    const wire = (id, fn) => $(id).onclick = fn;
    wire('setName', () => {
      openDialog(`<div class="bigEmoji">✏️</div><h2>Who is playing?</h2>
        <input id="nameInput" value="${esc(ABC.state.playerName)}" maxlength="20"
          style="font-family:inherit;font-size:24px;text-align:center;padding:12px;border:3px solid #74c0fc;border-radius:16px;width:80%;">
        <div class="dlgRow"><button class="bigBtn green" id="nameOk">Save 💾</button></div>`);
      const inp = $('nameInput'); inp.focus(); inp.select();
      $('nameOk').onclick = () => {
        const v = inp.value.trim();
        if (v) ABC.state.playerName = v;
        ABC.saveSoon();
        toast(`Hi, <b>${esc(ABC.state.playerName)}</b>! 👋`, 3000, true);
        showSettings();
      };
    });
    wire('setVoice', () => { s.voiceMode = !s.voiceMode; ABC.saveSoon(); showSettings(); });
    wire('setRead',  () => { s.readAloud = !s.readAloud; ABC.saveSoon(); showSettings(); });
    wire('setSound', () => { s.sound = !s.sound; ABC.saveSoon(); showSettings(); });
    wire('setMusic', () => { s.music = !s.music; ABC.saveSoon(); showSettings(); });
    wire('setDone',  () => closeDialog());
    wire('setReset', () => {
      message('Start over?', 'This erases the whole world. Are you sure?', 'Yes, new world! 🌍', () => {
        localStorage.removeItem('aariasBlockCraft2');
        location.reload();
      }, '🧹');
    });
  }

  function showHelp(onClose) {
    message('How to Play 🌈',
      `🕹️ <b>Arrow buttons</b> (or W A S D) — walk<br>
       ⬆ <b>Jump button</b> — jump · <b>tap it twice</b> — FLY! 🕊️<br>
       ✋ <b>Drag the world</b> — look around<br>
       👆 <b>Click</b> — build 🧱 or dig ⛏️ (switch with the button on the right)<br>
       🫙 <b>Press &amp; pull your slime</b> to stretch it · tap to squish!<br>
       🐾 Click animals to talk · 🌀 words open the wormhole!<br>
       👀 <b>V</b> — see yourself · 🏗️🌈🍪💌 — fun menus up top!`,
      'Let’s play! 🎮', onClose, '❓');
  }

  return { openDialog, closeDialog, isOpen, toast, bellaSays, confetti, floatHearts,
           refreshScore, addStars, addHearts, askExpressive, pickCard, message,
           buildHotbar, selectBlock, selectByIndex, getSelected, unlockBlock,
           showSettings, showHelp, pick, pick3, esc };
})();
