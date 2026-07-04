/* =====================================================================
   Belu's Helping Hands — game shell (screens, systems, logic)
   All child-facing strings come from js/content.js (window.HH.*).
   This file only invents chrome labels (buttons like "Play", "Menu").
   ===================================================================== */
"use strict";

(() => {

const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------------------------------------------------------------
   SAVE DATA
   --------------------------------------------------------------- */
const SAVE_KEY = "hh_save";
function defaultSave() { return { friends: [], hand: [], stickers: 0, done: [], quizzed: [] }; }
let save = defaultSave();
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      save = Object.assign(defaultSave(), parsed);
      ["friends", "hand", "done", "quizzed"].forEach(k => { if (!Array.isArray(save[k])) save[k] = []; });
      if (typeof save.stickers !== "number" || isNaN(save.stickers)) save.stickers = 0;
    }
  } catch (e) { save = defaultSave(); }
}
function saveSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
function updateStickerUI() { $$(".stickerCount").forEach(el => { el.textContent = String(save.stickers); }); }
function awardSticker(n) { save.stickers += (n || 1); saveSave(); updateStickerUI(); }

/* ---------------------------------------------------------------
   MUTE + SOUND (tiny WebAudio synth) + SPEECH
   --------------------------------------------------------------- */
function isMuted() { return localStorage.getItem("hh_mute") === "1"; }
function setMuted(v) {
  localStorage.setItem("hh_mute", v ? "1" : "0");
  applyMuteIcon();
  if (v && window.speechSynthesis) window.speechSynthesis.cancel();
}
function toggleMute() { setMuted(!isMuted()); }
function applyMuteIcon() {
  const icon = isMuted() ? "🔇" : "🔊";
  $$(".mute-btn").forEach(b => { b.textContent = icon; });
}

const SND = (() => {
  let ctx = null, master = null;
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  }
  const ok = () => ctx && ctx.state === "running" && !isMuted();
  function tone(f0, f1, dur, vol, type) {
    if (!ok()) return;
    const o = ctx.createOscillator(); o.type = type || "sine";
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(master);
    o.start(); o.stop(ctx.currentTime + dur);
  }
  return {
    init,
    chime() { tone(520, 780, 0.18, 0.16, "sine"); setTimeout(() => tone(700, 920, 0.16, 0.12, "sine"), 90); },
    pop() { tone(520, 320, 0.09, 0.14, "triangle"); },
    tryTone() { tone(220, 170, 0.24, 0.10, "sine"); },
  };
})();

function speak(text) {
  if (isMuted() || !text) return;
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------------------------------------------------------------
   CONFETTI (lightweight canvas burst, calm colors, ~1s)
   --------------------------------------------------------------- */
const confettiCanvas = $("confettiCanvas");
const cctx = confettiCanvas.getContext("2d");
let confettiParticles = [];
let confettiRunning = false;
const CONFETTI_COLORS = ["#ffd43b", "#74c0fc", "#8ce99a", "#ffa94d", "#e599f7", "#63e6be"];

function resizeConfetti() { confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; }
window.addEventListener("resize", resizeConfetti);

function reducedMotion() { return document.documentElement.classList.contains("reduced-motion"); }

function confettiBurst(x, y, count) {
  if (reducedMotion()) return;
  count = count || 16;
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    confettiParticles.push({
      x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed - 2.2,
      life: 1, color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 4, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    });
  }
  if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(confettiFrame); }
}
function confettiBig() {
  if (reducedMotion()) return;
  const w = window.innerWidth || 400;
  confettiBurst(w * 0.25, (window.innerHeight || 600) * 0.25, 22);
  confettiBurst(w * 0.5, (window.innerHeight || 600) * 0.2, 22);
  confettiBurst(w * 0.75, (window.innerHeight || 600) * 0.25, 22);
}
function confettiFrame() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  for (const p of confettiParticles) {
    p.vy += 0.12; p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.rot += p.vr;
    cctx.save();
    cctx.globalAlpha = Math.max(0, p.life);
    cctx.translate(p.x, p.y); cctx.rotate(p.rot);
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    cctx.restore();
  }
  confettiParticles = confettiParticles.filter(p => p.life > 0 && p.y < confettiCanvas.height + 60);
  if (confettiParticles.length > 0) requestAnimationFrame(confettiFrame);
  else { confettiRunning = false; cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
}

/* ---------------------------------------------------------------
   SCREEN MANAGEMENT
   --------------------------------------------------------------- */
const SCREEN_IDS = ["titleScreen", "menuScreen", "exploreScreen", "handScreen", "practiceScreen", "grownupsScreen"];
const BELU_SCREENS = ["menuScreen", "exploreScreen", "handScreen", "practiceScreen"];

function showScreen(id) {
  SCREEN_IDS.forEach(s => { $(s).hidden = (s !== id); });
  $("beluBubble").hidden = !BELU_SCREENS.includes(id);
  if (id === "menuScreen") setBelu("What do you want to do today? 💙");
  if (id === "exploreScreen") {
    requestAnimationFrame(() => { if (window.HH && HH.World) HH.World.resize(); });
  }
}

/* ---------------------------------------------------------------
   BELU MASCOT BUBBLE (present across menu/explore/hand/practice)
   --------------------------------------------------------------- */
let currentBeluText = "";
function setBelu(text, opts) {
  opts = opts || {};
  currentBeluText = text || "";
  $("beluText").textContent = currentBeluText;
  const nextBtn = $("beluNextBtn");
  if (opts.onNext) { nextBtn.hidden = false; nextBtn.onclick = opts.onNext; }
  else { nextBtn.hidden = true; nextBtn.onclick = null; }
  $("beluBubble").hidden = false;
}
function playIntroSequence(lines, onDone) {
  let i = 0;
  function step() {
    if (i >= lines.length) { onDone(); return; }
    setBelu(lines[i], { onNext: () => { i++; step(); } });
  }
  step();
}

/* ---------------------------------------------------------------
   GENERIC ERRORLESS CHOICE BUTTONS
   options[0] is always the correct answer pre-shuffle.
   --------------------------------------------------------------- */
function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildChoices(container, options, feedbackEl, onCorrect) {
  container.innerHTML = "";
  if (feedbackEl) feedbackEl.textContent = "";
  const items = shuffleArr(options.map((text, i) => ({ text, correct: i === 0 })));
  items.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = item.text;
    btn.addEventListener("click", () => {
      if (item.correct) {
        SND.chime();
        const r = btn.getBoundingClientRect();
        confettiBurst(r.left + r.width / 2, r.top + r.height / 2);
        container.querySelectorAll(".choice-btn").forEach(b => b.classList.add("disabled"));
        btn.classList.remove("disabled"); btn.classList.add("correct");
        if (feedbackEl) feedbackEl.textContent = "";
        if (onCorrect) onCorrect();
      } else {
        SND.tryTone();
        btn.classList.remove("wiggle"); void btn.offsetWidth; btn.classList.add("wiggle");
        if (feedbackEl) feedbackEl.textContent = "Try again! 💙";
      }
    });
    container.appendChild(btn);
  });
}
function speakRow(card, text) {
  const row = document.createElement("div"); row.className = "step-text-row";
  const p = document.createElement("div"); p.className = "step-text"; p.textContent = text;
  const sb = document.createElement("button"); sb.className = "speak-btn"; sb.textContent = "🔊";
  sb.title = "Read this aloud";
  sb.addEventListener("click", () => speak(text));
  row.appendChild(p); row.appendChild(sb);
  card.appendChild(row);
  return row;
}
function stepCardShell(label) {
  const card = document.createElement("div"); card.className = "step-card";
  const lab = document.createElement("div"); lab.className = "step-label"; lab.textContent = label;
  card.appendChild(lab);
  return card;
}

/* ---------------------------------------------------------------
   1. PASSWORD GATE
   --------------------------------------------------------------- */
async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function attemptUnlock() {
  const input = $("gateInput");
  const val = input.value.trim();
  if (!val) return;
  SND.init();
  let hash;
  try { hash = await sha256Hex(val); } catch (e) { hash = null; }
  if (hash && HH.GATE_HASH && hash.toLowerCase() === HH.GATE_HASH.toLowerCase()) {
    sessionStorage.setItem("hh_gate", "1");
    $("gateScreen").hidden = true;
    showScreen("titleScreen");
  } else {
    const card = $("gateCard");
    card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
    $("gateError").hidden = false;
    SND.tryTone();
    input.value = ""; input.focus();
  }
}
function wireGate() {
  $("gateBtn").addEventListener("click", attemptUnlock);
  $("gateInput").addEventListener("keydown", e => { if (e.key === "Enter") attemptUnlock(); });
}

/* ---------------------------------------------------------------
   2. TITLE
   --------------------------------------------------------------- */
function wireTitle() {
  $("startBtn").addEventListener("click", () => { SND.init(); SND.pop(); showScreen("menuScreen"); });
}

/* ---------------------------------------------------------------
   3. HOME MENU
   --------------------------------------------------------------- */
const MODE_CARDS = [
  { id: "explore", icon: "🌍", title: "Explore My World", desc: "Visit home & school" },
  { id: "hand", icon: "🖐️", title: "My Helping Hand", desc: "Pick 5 helpers who keep you safe" },
  { id: "practice", icon: "💪", title: "Practice Being Brave", desc: "Try safe choices with Belu" },
];
function renderMenuCards() {
  const wrap = $("menuCards"); wrap.innerHTML = "";
  MODE_CARDS.forEach(m => {
    const card = document.createElement("button");
    card.className = "mode-card"; card.dataset.mode = m.id;
    card.innerHTML = `<div class="icon">${m.icon}</div><div class="title">${m.title}</div><div class="desc">${m.desc}</div>`;
    card.addEventListener("click", () => {
      SND.init();
      if (m.id === "explore") enterExplore();
      else if (m.id === "hand") enterHand();
      else if (m.id === "practice") enterPractice();
    });
    wrap.appendChild(card);
  });
}
function wireMenu() { renderMenuCards(); }

/* ---------------------------------------------------------------
   4. EXPLORE MY WORLD
   --------------------------------------------------------------- */
let worldReady = false;
const exState = { place: null, roomIdx: 0 };

function initWorldOnce() {
  const note = $("worldLoadingNote");
  if (!window.HH || !HH.World) {
    note.textContent = "🌍 The world is still being built! Please check back soon.";
    note.hidden = false;
    return;
  }
  HH.World.init({ canvas: $("three") }).then(() => {
    worldReady = true;
    note.hidden = true;
    HH.World.setHandlers({ onBuilding: handleBuilding, onObject: handleObject, onHelper: handleHelper });
    HH.World.showHub();
    HH.World.resize();
  }).catch(err => {
    note.textContent = "🌍 The world had trouble loading. Please try again later.";
    note.hidden = false;
    if (window.console) console.error(err);
  });
}
function enterExplore() {
  showScreen("exploreScreen");
  goHub();
  if (window.HH && HH.World) HH.World.resize();
}
function goHub() {
  exState.place = null; exState.roomIdx = 0;
  if (window.HH && HH.World && worldReady) HH.World.showHub();
  $("roomHeader").hidden = true;
  $("roomPrevBtn").hidden = true;
  $("roomNextBtn").hidden = true;
  $("quizBtn").hidden = true;
  $("mapBtn").hidden = true;
  setBelu("Tap a building to explore! 🏠🏫");
}
function handleBuilding(placeId) {
  const place = HH.PLACES[placeId];
  if (!place) return;
  if (!place.unlocked) {
    showToast(place.comingSoon || "Coming soon!");
    setBelu(place.comingSoon || "Coming soon!");
    return;
  }
  exState.place = placeId; exState.roomIdx = 0;
  if (HH.World) HH.World.showRoom(placeId, 0);
  renderRoom();
}
function renderRoom() {
  const place = HH.PLACES[exState.place];
  const room = place.rooms[exState.roomIdx];
  const rh = $("roomHeader");
  rh.hidden = false; rh.textContent = room.emoji + " " + room.name;
  setBelu(room.action);
  $("mapBtn").hidden = false;
  $("quizBtn").hidden = !room.quiz;
  $("roomPrevBtn").hidden = false;
  $("roomNextBtn").hidden = false;
}
function stepRoom(delta) {
  const place = HH.PLACES[exState.place];
  if (!place) return;
  const n = place.rooms.length;
  exState.roomIdx = (exState.roomIdx + delta + n) % n;
  if (HH.World) HH.World.showRoom(exState.place, exState.roomIdx);
  renderRoom();
}
function handleObject(objIndex) {
  const place = HH.PLACES[exState.place];
  if (!place) return;
  const room = place.rooms[exState.roomIdx];
  const obj = room.objects && room.objects[objIndex];
  if (!obj) return;
  setBelu(obj[0] + " " + obj[1]);
}
function handleHelper(helperId) { openFriendCard(helperId); }
function startRoomQuiz() {
  const place = HH.PLACES[exState.place];
  if (!place) return;
  const room = place.rooms[exState.roomIdx];
  if (!room.quiz) return;
  openQuiz(room.quiz.q, room.quiz.a, () => {
    if (!save.quizzed.includes(room.id)) save.quizzed.push(room.id);
    awardSticker(1);
  });
}
let toastTimer = null;
function showToast(text) {
  const t = $("toastNote");
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}
function openQuiz(q, answers, onCorrect) {
  const modal = $("quizModal");
  $("quizQ").textContent = q;
  $("quizSpeakBtn").onclick = () => speak(q);
  const feedback = $("quizFeedback");
  buildChoices($("quizAnswers"), answers, feedback, () => {
    setTimeout(() => { modal.hidden = true; if (onCorrect) onCorrect(); }, 900);
  });
  modal.hidden = false;
}
function wireExplore() {
  $("mapBtn").addEventListener("click", goHub);
  $("quizBtn").addEventListener("click", startRoomQuiz);
  $("roomPrevBtn").addEventListener("click", () => stepRoom(-1));
  $("roomNextBtn").addEventListener("click", () => stepRoom(1));
  window.addEventListener("resize", () => { if (window.HH && HH.World && worldReady) HH.World.resize(); });
  $("quizModal").addEventListener("click", e => { if (e.target.id === "quizModal") $("quizModal").hidden = true; });
  initWorldOnce();
}

/* friend card modal (used by Explore) */
function openFriendCard(id) {
  const h = HH.HELPERS[id];
  if (!h) return;
  $("friendEmoji").textContent = h.emoji;
  $("friendName").textContent = h.name;
  $("friendLine").textContent = h.line;
  const addBtn = $("friendAddBtn");
  const already = save.friends.includes(id);
  addBtn.textContent = already ? "Already my friend! 💙" : "Add to my friends! 💙";
  addBtn.disabled = already;
  addBtn.onclick = () => {
    if (!save.friends.includes(id)) { save.friends.push(id); saveSave(); }
    addBtn.textContent = "Already my friend! 💙"; addBtn.disabled = true;
    SND.pop();
    const r = addBtn.getBoundingClientRect();
    confettiBurst(r.left + r.width / 2, r.top + r.height / 2);
    setTimeout(() => { $("friendModal").hidden = true; }, 1100);
  };
  $("friendModal").hidden = false;
}
function wireFriendModal() {
  $("friendCloseBtn").addEventListener("click", () => { $("friendModal").hidden = true; });
  $("friendModal").addEventListener("click", e => { if (e.target.id === "friendModal") $("friendModal").hidden = true; });
}

/* ---------------------------------------------------------------
   5. MY HELPING HAND
   --------------------------------------------------------------- */
let handState = null;

function enterHand() {
  showScreen("handScreen");
  handState = {
    slots: (save.hand && save.hand.length === 5) ? save.hand.slice() : [null, null, null, null, null],
    secretsIdx: 0,
  };
  $("handBody").innerHTML = "";
  playIntroSequence(HH.HAND_INTRO, () => renderHandFill());
}

function renderHandFill() {
  const body = $("handBody"); body.innerHTML = "";
  const h2 = document.createElement("h2");
  h2.style.cssText = "color:#4c3a8f;font-size:20px;text-align:center;";
  h2.textContent = "Build your Helping Hand 🖐️";
  body.appendChild(h2);

  const graphic = document.createElement("div"); graphic.className = "hand-graphic";
  const bg = document.createElement("div"); bg.className = "hand-emoji-bg"; bg.textContent = "🖐️";
  graphic.appendChild(bg);
  const slotsRow = document.createElement("div"); slotsRow.className = "hand-slots";
  handState.slots.forEach((helperId, idx) => {
    const slot = document.createElement("button");
    slot.className = "hand-slot" + (helperId ? " filled" : "");
    slot.textContent = helperId ? HH.HELPERS[helperId].emoji : String(idx + 1);
    slot.title = helperId ? HH.HELPERS[helperId].name : "Empty slot";
    slot.addEventListener("click", () => {
      if (helperId) { handState.slots[idx] = null; renderHandFill(); }
    });
    slotsRow.appendChild(slot);
  });
  graphic.appendChild(slotsRow);
  body.appendChild(graphic);

  const poolTitle = document.createElement("div");
  poolTitle.style.cssText = "font-weight:800;color:#4c3a8f;font-size:15px;text-align:center;";
  poolTitle.textContent = "Tap a helper to add them to your hand:";
  body.appendChild(poolTitle);

  const pool = document.createElement("div"); pool.className = "helper-pool";
  Object.keys(HH.HELPERS).forEach(id => {
    const h = HH.HELPERS[id];
    const inHand = handState.slots.includes(id);
    const chip = document.createElement("button");
    chip.className = "helper-chip" + (save.friends.includes(id) ? " friend" : "") + (inHand ? " used" : "");
    chip.innerHTML = '<span class="em">' + h.emoji + '</span><span class="nm">' + h.name + "</span>";
    chip.addEventListener("click", () => {
      if (inHand) return;
      const emptyIdx = handState.slots.indexOf(null);
      if (emptyIdx === -1) return;
      handState.slots[emptyIdx] = id;
      SND.pop();
      renderHandFill();
      checkHandComplete();
    });
    pool.appendChild(chip);
  });
  body.appendChild(pool);

  const filledCount = handState.slots.filter(Boolean).length;
  if (filledCount < 5) {
    const left = 5 - filledCount;
    setBelu("Pick " + left + " more helper" + (left === 1 ? "" : "s") + " for your hand!");
  }
}

function checkHandComplete() {
  const filled = handState.slots.filter(Boolean);
  if (filled.length < 5) return;
  const wheres = new Set(filled.map(id => HH.HELPERS[id].where));
  if (wheres.size >= 2) {
    save.hand = handState.slots.slice(); saveSave();
    setBelu("My hand is ready! 🖐️💙");
    confettiBig(); SND.chime();
    awardSticker(1);
    setTimeout(showHandContinue, 1100);
  } else {
    setBelu(HH.HAND_INTRO[2]);
    SND.tryTone();
    setTimeout(() => {
      handState.slots = [null, null, null, null, null];
      renderHandFill();
    }, 2400);
  }
}
function showHandContinue() {
  const body = $("handBody");
  const btn = document.createElement("button");
  btn.className = "btn-primary"; btn.textContent = "Continue to lessons ➡️";
  btn.style.marginTop = "16px";
  btn.addEventListener("click", startFeelingsLesson);
  body.appendChild(btn);
}

function startFeelingsLesson() {
  $("handBody").innerHTML = "";
  setBelu(HH.FEELINGS.intro, { onNext: renderFeelingsSigns });
}
function renderFeelingsSigns() {
  const body = $("handBody"); body.innerHTML = "";
  const card = document.createElement("div"); card.className = "lesson-card";
  const grid = document.createElement("div"); grid.className = "signs-grid";
  HH.FEELINGS.signs.forEach(s => {
    const chip = document.createElement("div"); chip.className = "sign-chip";
    chip.innerHTML = '<div class="em">' + s.emoji + '</div><div class="tx">' + s.text + "</div>";
    grid.appendChild(chip);
  });
  card.appendChild(grid);
  speakRow(card, HH.FEELINGS.lesson);
  const nextBtn = document.createElement("button");
  nextBtn.className = "btn-primary"; nextBtn.textContent = "Next ➡️";
  nextBtn.addEventListener("click", renderFeelingsQuiz);
  card.appendChild(nextBtn);
  body.appendChild(card);
  setBelu(HH.FEELINGS.lesson);
}
function renderFeelingsQuiz() {
  const body = $("handBody"); body.innerHTML = "";
  const card = stepCardShell("Quick Check");
  speakRow(card, HH.FEELINGS.quiz.q);
  const answers = document.createElement("div"); answers.className = "quiz-answers";
  const feedback = document.createElement("div"); feedback.className = "quiz-feedback";
  card.appendChild(answers); card.appendChild(feedback);
  body.appendChild(card);
  buildChoices(answers, HH.FEELINGS.quiz.a, feedback, () => {
    awardSticker(1);
    setTimeout(startSecretsLesson, 900);
  });
  setBelu(HH.FEELINGS.quiz.q);
}
function startSecretsLesson() {
  $("handBody").innerHTML = "";
  setBelu(HH.SECRETS.intro, {
    onNext: () => {
      setBelu(HH.SECRETS.rule, { onNext: () => { handState.secretsIdx = 0; renderSecretItem(); } });
    },
  });
}
function renderSecretItem() {
  const body = $("handBody"); body.innerHTML = "";
  const idx = handState.secretsIdx;
  const item = HH.SECRETS.items[idx];
  if (!item) { finishHandMode(); return; }
  const card = document.createElement("div"); card.className = "secret-card";
  const em = document.createElement("div"); em.className = "secret-emoji"; em.textContent = item.emoji;
  card.appendChild(em);
  const row = document.createElement("div"); row.style.cssText = "display:flex;align-items:center;gap:10px;";
  const tx = document.createElement("div"); tx.className = "secret-text"; tx.textContent = item.text;
  const sb = document.createElement("button"); sb.className = "speak-btn"; sb.textContent = "🔊";
  sb.addEventListener("click", () => speak(item.text));
  row.appendChild(tx); row.appendChild(sb);
  card.appendChild(row);

  const btnsRow = document.createElement("div"); btnsRow.className = "secret-buttons";
  const safeBtn = document.createElement("button"); safeBtn.className = "secret-btn safe"; safeBtn.textContent = "Happy surprise 🎁";
  const tellBtn = document.createElement("button"); tellBtn.className = "secret-btn tell"; tellBtn.textContent = "Tell a helper 🗣️";
  const whyBox = document.createElement("div"); whyBox.className = "secret-why"; whyBox.hidden = true;

  function choose(pickedSafe, btnEl) {
    const correct = pickedSafe === item.safe;
    whyBox.hidden = false; whyBox.textContent = item.why;
    if (correct) {
      SND.chime();
      const r = btnEl.getBoundingClientRect();
      confettiBurst(r.left + r.width / 2, r.top + r.height / 2);
      btnEl.classList.add("correct-flash");
      safeBtn.disabled = true; tellBtn.disabled = true;
      setTimeout(() => { handState.secretsIdx++; renderSecretItem(); }, 1700);
    } else {
      SND.tryTone();
      btnEl.classList.remove("wiggle"); void btnEl.offsetWidth; btnEl.classList.add("wiggle");
    }
  }
  safeBtn.addEventListener("click", () => choose(true, safeBtn));
  tellBtn.addEventListener("click", () => choose(false, tellBtn));
  btnsRow.appendChild(safeBtn); btnsRow.appendChild(tellBtn);
  card.appendChild(btnsRow); card.appendChild(whyBox);
  body.appendChild(card);
  setBelu("Is this a happy surprise, or should you tell a helper?");
}
function finishHandMode() {
  const body = $("handBody"); body.innerHTML = "";
  awardSticker(1);
  confettiBig(); SND.chime();
  const card = document.createElement("div"); card.className = "lesson-card"; card.style.alignItems = "center"; card.style.textAlign = "center";
  card.innerHTML = '<div style="font-size:44px;">🎉</div><div class="step-text" style="text-align:center;">You finished My Helping Hand! You know your 5 helpers and how to spot tricky secrets.</div>';
  const btn = document.createElement("button"); btn.className = "btn-primary"; btn.textContent = "Back to Menu";
  btn.addEventListener("click", () => showScreen("menuScreen"));
  card.appendChild(btn);
  body.appendChild(card);
  setBelu("You did it! I am so proud of you. 💙");
}
function wireHand() { /* interactions wired per-render */ }

/* ---------------------------------------------------------------
   6. PRACTICE BEING BRAVE
   --------------------------------------------------------------- */
let practiceState = null;

function enterPractice() {
  showScreen("practiceScreen");
  practiceState = { scenario: null, step: "pick", usedTell: [], tellPhase: "ask1" };
  renderPractice();
}
function tellCandidates(sc) {
  const placeHelpers = (HH.PLACES[sc.place] && HH.PLACES[sc.place].helpers) || [];
  const set = [];
  placeHelpers.concat(sc.tellTo).forEach(id => { if (set.indexOf(id) === -1) set.push(id); });
  return set;
}
function renderPractice() {
  const body = $("practiceBody"); body.innerHTML = "";
  if (practiceState.step === "pick") renderScenarioPicker(body);
  else if (practiceState.step === "see") renderSeeStep(body);
  else if (practiceState.step === "feel") renderFeelStep(body);
  else if (practiceState.step === "react") renderReactStep(body);
  else if (practiceState.step === "reactWhy") renderReactWhyStep(body);
  else if (practiceState.step === "tell") renderTellStep(body);
  else if (practiceState.step === "resolve") renderResolveStep(body);
}
function visibleScenarios() {
  const showTierB = !!HH.ENABLE_TIER_B;
  return HH.SCENARIOS.filter(sc => showTierB || sc.tier !== "B");
}
function renderScenarioPicker(body) {
  setBelu("Pick a story to practice! 💪");
  const grid = document.createElement("div"); grid.className = "scenario-grid";
  visibleScenarios().forEach(sc => {
    const card = document.createElement("button");
    card.className = "scenario-card"; card.dataset.scenarioId = sc.id;
    if (sc.reviewPending) {
      const ribbon = document.createElement("div"); ribbon.className = "review-ribbon"; ribbon.textContent = "🔍 Clinical review pending";
      card.appendChild(ribbon);
    }
    const em = document.createElement("div"); em.className = "em"; em.textContent = sc.emoji;
    const tt = document.createElement("div"); tt.className = "tt"; tt.textContent = sc.title;
    card.appendChild(em); card.appendChild(tt);
    card.addEventListener("click", () => {
      practiceState = { scenario: sc, step: "see", usedTell: [], tellPhase: "ask1" };
      renderPractice();
    });
    grid.appendChild(card);
  });
  body.appendChild(grid);
}
function renderSeeStep(body) {
  const sc = practiceState.scenario;
  const card = stepCardShell("See");
  speakRow(card, sc.setup);
  const btn = document.createElement("button"); btn.className = "btn-primary"; btn.textContent = "Next ➡️";
  btn.addEventListener("click", () => { practiceState.step = "feel"; renderPractice(); });
  card.appendChild(btn);
  body.appendChild(card);
  setBelu(sc.setup);
}
function renderFeelStep(body) {
  const sc = practiceState.scenario;
  const card = stepCardShell("Feel");
  speakRow(card, sc.feelQ);
  const answers = document.createElement("div"); answers.className = "quiz-answers";
  const feedback = document.createElement("div"); feedback.className = "quiz-feedback";
  card.appendChild(answers); card.appendChild(feedback);
  body.appendChild(card);
  buildChoices(answers, sc.feelA, feedback, () => {
    setTimeout(() => { practiceState.step = "react"; renderPractice(); }, 800);
  });
  setBelu(sc.feelQ);
}
function renderReactStep(body) {
  const sc = practiceState.scenario;
  const card = stepCardShell("React");
  speakRow(card, sc.reactQ);
  const answers = document.createElement("div"); answers.className = "quiz-answers";
  const feedback = document.createElement("div"); feedback.className = "quiz-feedback";
  card.appendChild(answers); card.appendChild(feedback);
  body.appendChild(card);
  buildChoices(answers, sc.reactA, feedback, () => {
    setTimeout(() => { practiceState.step = "reactWhy"; renderPractice(); }, 800);
  });
  setBelu(sc.reactQ);
}
function renderReactWhyStep(body) {
  const sc = practiceState.scenario;
  const card = stepCardShell("Good Thinking!");
  speakRow(card, sc.reactWhy);
  const btn = document.createElement("button"); btn.className = "btn-primary"; btn.textContent = "Next ➡️";
  btn.addEventListener("click", () => { practiceState.step = "tell"; practiceState.tellPhase = "ask1"; renderPractice(); });
  card.appendChild(btn);
  body.appendChild(card);
  setBelu(sc.reactWhy);
}
function renderTellStep(body) {
  const sc = practiceState.scenario;
  const phase = practiceState.tellPhase;

  if (phase === "busy") {
    const card = stepCardShell("Hmm...");
    speakRow(card, sc.busyLine);
    const btn = document.createElement("button"); btn.className = "btn-primary"; btn.textContent = "Next ➡️";
    btn.addEventListener("click", () => { practiceState.tellPhase = "keep"; renderPractice(); });
    card.appendChild(btn);
    body.appendChild(card);
    setBelu(sc.busyLine);
    return;
  }
  if (phase === "keep") {
    const card = stepCardShell("Keep Telling!");
    speakRow(card, sc.keepLine);
    const btn = document.createElement("button"); btn.className = "btn-primary"; btn.textContent = "Try Again ➡️";
    btn.addEventListener("click", () => { practiceState.tellPhase = "ask2"; renderPractice(); });
    card.appendChild(btn);
    body.appendChild(card);
    setBelu(sc.keepLine);
    return;
  }

  const card = stepCardShell("Tell");
  const promptText = phase === "ask2" ? "Who else can you tell?" : sc.tellPrompt;
  speakRow(card, promptText);
  const map = document.createElement("div"); map.className = "tell-map";
  const placeInfo = HH.PLACES[sc.place];
  const pe = document.createElement("div"); pe.className = "tell-place-emoji"; pe.textContent = placeInfo ? placeInfo.emoji : "🏠";
  map.appendChild(pe);
  const helpersRow = document.createElement("div"); helpersRow.className = "tell-helpers";
  const feedback = document.createElement("div"); feedback.className = "quiz-feedback";

  tellCandidates(sc).forEach(id => {
    const h = HH.HELPERS[id]; if (!h) return;
    const used = practiceState.usedTell.includes(id);
    const chip = document.createElement("button");
    chip.className = "helper-chip" + (used ? " used" : "");
    chip.innerHTML = '<span class="em">' + h.emoji + '</span><span class="nm">' + h.name + "</span>";
    if (!used) {
      chip.addEventListener("click", () => {
        if (sc.tellTo.includes(id)) {
          practiceState.usedTell.push(id);
          SND.chime();
          const r = chip.getBoundingClientRect();
          confettiBurst(r.left + r.width / 2, r.top + r.height / 2);
          if (sc.keepTelling && practiceState.usedTell.length === 1) practiceState.tellPhase = "busy";
          else practiceState.step = "resolve";
          renderPractice();
        } else {
          chip.classList.remove("wiggle"); void chip.offsetWidth; chip.classList.add("wiggle");
          SND.tryTone();
          feedback.textContent = "Try another helper! 💙";
        }
      });
    }
    helpersRow.appendChild(chip);
  });
  map.appendChild(helpersRow);
  map.appendChild(feedback);
  card.appendChild(map);
  body.appendChild(card);
  setBelu(promptText);
}
function renderResolveStep(body) {
  const sc = practiceState.scenario;
  if (!practiceState.resolvedAwarded) {
    practiceState.resolvedAwarded = true;
    if (!save.done.includes(sc.id)) save.done.push(sc.id);
    saveSave();
    awardSticker(1);
    confettiBig(); SND.chime();
  }
  const card = stepCardShell("You Did It!");
  speakRow(card, sc.resolve);
  const aff = HH.AFFIRMATIONS[Math.floor(Math.random() * HH.AFFIRMATIONS.length)];
  const affEl = document.createElement("div"); affEl.className = "affirmation-big"; affEl.textContent = aff;
  card.appendChild(affEl);
  const actions = document.createElement("div"); actions.className = "resolve-actions";
  const again = document.createElement("button"); again.className = "btn-secondary"; again.textContent = "Play again 🔁";
  again.addEventListener("click", () => {
    practiceState = { scenario: sc, step: "see", usedTell: [], tellPhase: "ask1" };
    renderPractice();
  });
  const more = document.createElement("button"); more.className = "btn-primary"; more.textContent = "More practice ➡️";
  more.addEventListener("click", () => {
    practiceState = { scenario: null, step: "pick", usedTell: [], tellPhase: "ask1" };
    renderPractice();
  });
  actions.appendChild(again); actions.appendChild(more);
  card.appendChild(actions);
  body.appendChild(card);
  setBelu(sc.resolve);
}
function wirePractice() { /* interactions wired per-render */ }

/* ---------------------------------------------------------------
   7. GROWN-UPS CORNER (adult-gated, sober styling)
   --------------------------------------------------------------- */
let guReturnScreen = "titleScreen";
let guChallenge = { a: 2, b: 2, answer: 4 };

function enterGrownups(returnScreen) {
  guReturnScreen = returnScreen || "titleScreen";
  showScreen("grownupsScreen");
  $("guGateWrap").hidden = false;
  $("guBody").hidden = true;
  $("guAnswerInput").value = "";
  $("guError").hidden = true;
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 2 + Math.floor(Math.random() * 7);
  guChallenge = { a, b, answer: a + b };
  $("guQuestion").textContent = a + " + " + b + " = ?";
}
function checkGuAnswer() {
  const val = parseInt($("guAnswerInput").value, 10);
  if (val === guChallenge.answer) {
    $("guGateWrap").hidden = true;
    renderGrownupsBody();
  } else {
    $("guError").hidden = false;
    const card = document.querySelector(".gu-gate-card");
    card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
  }
}
function renderGrownupsBody() {
  const body = $("guBody");
  body.hidden = false;
  const G = HH.GROWNUPS;
  const esc = s => String(s);
  body.innerHTML =
    "<h3>What This Teaches</h3><ul>" + G.what.map(t => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
    "<h3>If A Child Tells You Something</h3><ol>" + G.disclosure.map(t => "<li>" + esc(t) + "</li>").join("") + "</ol>" +
    "<h3>Where To Report</h3><table class=\"gu-table\">" +
      G.report.map(row => "<tr><td>" + esc(row[0]) + "</td><td>" + esc(row[1]) + "</td></tr>").join("") +
    "</table>" +
    "<div class=\"gu-note\">" + esc(G.note) + "</div>" +
    "<div class=\"gu-actions\"><button class=\"btn-plain\" id=\"guPrintBtn\">🖨️ Print</button></div>";
  $("guPrintBtn").addEventListener("click", () => window.print());
}
function wireGrownups() {
  $("guCheckBtn").addEventListener("click", checkGuAnswer);
  $("guAnswerInput").addEventListener("keydown", e => { if (e.key === "Enter") checkGuAnswer(); });
  $("guBackBtn").addEventListener("click", () => showScreen(guReturnScreen));
  $("grownupsLinkTitle").addEventListener("click", () => enterGrownups("titleScreen"));
  $("grownupsLinkMenu").addEventListener("click", () => enterGrownups("menuScreen"));
}

/* ---------------------------------------------------------------
   GLOBAL WIRING
   --------------------------------------------------------------- */
function wireGlobalBelu() {
  $("beluSpeakBtn").addEventListener("click", () => speak(currentBeluText));
}
function wireGlobalChrome() {
  document.addEventListener("click", e => {
    const mute = e.target.closest(".mute-btn");
    if (mute) { toggleMute(); return; }
    const back = e.target.closest(".btn-back[data-target='menu']");
    if (back) { showScreen("menuScreen"); return; }
  });
}

function boot() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduced-motion");
  }
  resizeConfetti();
  loadSave();
  updateStickerUI();
  applyMuteIcon();

  wireGate();
  wireTitle();
  wireMenu();
  wireExplore();
  wireFriendModal();
  wireHand();
  wirePractice();
  wireGrownups();
  wireGlobalBelu();
  wireGlobalChrome();

  if (sessionStorage.getItem("hh_gate") === "1") {
    $("gateScreen").hidden = true;
    showScreen("titleScreen");
  }
}

boot();


/* test hooks (harmless in production; used by headless verification) */
window.__HHTEST = {
  handleBuilding, handleObject, handleHelper, stepRoom, showScreen,
  get exState() { return exState; },
  get worldReady() { return worldReady; },
};

})();
