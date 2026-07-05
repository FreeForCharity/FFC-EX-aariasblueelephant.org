/* =====================================================================
   Nilu's Helping Hands — game shell (screens, systems, logic)
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
   ADULT SIGN-OFF STORE
   Every scenario + the two lessons must be reviewed & approved by an
   adult on this device before a child can play it. A grown-up can
   re-lock any item at any time from the Grown-Ups Corner. Date() is
   fine here — this runs on the main thread, not in a workflow.
   --------------------------------------------------------------- */
const SIGNOFF_KEY = "hh_signoff";
function defaultSignoff() { return { reviewer: "", items: {} }; }
let signoff = defaultSignoff();
function loadSignoff() {
  try {
    const raw = localStorage.getItem(SIGNOFF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      signoff = Object.assign(defaultSignoff(), parsed);
      if (!signoff.items || typeof signoff.items !== "object") signoff.items = {};
      if (typeof signoff.reviewer !== "string") signoff.reviewer = "";
    }
  } catch (e) { signoff = defaultSignoff(); }
}
function saveSignoff() { try { localStorage.setItem(SIGNOFF_KEY, JSON.stringify(signoff)); } catch (e) {} }
function isApproved(itemId) {
  const it = signoff.items[itemId];
  return !!(it && it.approvedAt && !it.locked);
}
function approveItem(itemId, reviewerName) {
  if (reviewerName) signoff.reviewer = reviewerName;
  signoff.items[itemId] = { approvedAt: new Date().toISOString(), locked: false };
  saveSignoff();
}
function lockItem(itemId) {
  const it = signoff.items[itemId] || (signoff.items[itemId] = { approvedAt: null, locked: false });
  it.locked = true;
  saveSignoff();
}
function getSignoffState() { return JSON.parse(JSON.stringify(signoff)); }
function gatedItems() {
  const items = HH.SCENARIOS.map(sc => ({ id: "scenario:" + sc.id, title: sc.emoji + " " + sc.title }));
  items.push({ id: "lesson:feelings", title: "💓 Feelings Lesson" });
  items.push({ id: "lesson:secrets", title: "🤫 Secrets Lesson" });
  return items;
}
function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch (e) { return ""; }
}

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
    bump() { tone(140, 80, 0.10, 0.10, "triangle"); },
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
  // while the world banner is up it carries the narration — Nilu waits
  $("beluBubble").hidden = !$("worldBanner").hidden;
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
  { id: "practice", icon: "💪", title: "Practice Being Brave", desc: "Try safe choices with Nilu" },
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
   4. EXPLORE MY WORLD (free-roam) + BELU'S GAME (find & do)
   Quiz cards are gone — the child WALKS the world. Nilu's Game asks
   the child to find & tap the right object in the right room.
   --------------------------------------------------------------- */
let worldReady = false;
const exState = { place: null, roomId: null };
const visitedRoomsThisSession = new Set();
let findState = { active: false, placeId: null, tasks: [], idx: 0, lastWrongAt: 0 };
let scenarioState = null; // set while an in-world "Practice Being Brave" scenario is running

function findRoomInfo(roomId) {
  const placeIds = Object.keys(HH.PLACES);
  for (let i = 0; i < placeIds.length; i++) {
    const place = HH.PLACES[placeIds[i]];
    if (!place.rooms) continue;
    const room = place.rooms.find(r => r.id === roomId);
    if (room) return { placeId: placeIds[i], room };
  }
  return null;
}

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
    HH.World.setHandlers({
      onBuilding: handleBuilding,
      onObject: handleObject,
      onHelper: handleHelper,
      onActor: handleActor,
      onRoomEnter: handleRoomEnter,
      onBump: () => SND.bump(),
    });
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
function exitOverlayModes() {
  if (findState.active) quitFindGame();
  if (scenarioState) { endScenario(); }
}
function goHub() {
  exitOverlayModes();
  exState.place = null; exState.roomId = null;
  if (window.HH && HH.World && worldReady) HH.World.showHub();
  $("roomHeader").hidden = true;
  $("findGameBtn").hidden = true;
  $("mapBtn").hidden = true;
  hideWorldBanner();
  setBelu("Tap a building to explore! 🏠🏫");
}
function handleBuilding(placeId) {
  if (scenarioState) return;
  const place = HH.PLACES[placeId];
  if (!place) return;
  if (!place.unlocked) {
    showToast(place.comingSoon || "Coming soon!");
    setBelu(place.comingSoon || "Coming soon!");
    return;
  }
  // per AJ: pop the building (it's clickable!) and offer the game choice
  // BEFORE entering, instead of the kid having to find the in-game button
  if (window.HH && HH.World && HH.World.popBuilding) HH.World.popBuilding(placeId);
  SND.pop();
  const hasTasks = !!(HH.FIND_TASKS && HH.FIND_TASKS[placeId] && HH.FIND_TASKS[placeId].length);
  setTimeout(() => {
    if (hasTasks) showEnterChoice(placeId, place);
    else walkThenEnter(placeId, null);
  }, 260);
}
// the kid walks to the chosen building, then we go inside
let walkingTo = null;
function walkThenEnter(placeId, afterEnter) {
  if (walkingTo) return;
  if (window.HH && HH.World && HH.World.hubWalkTo) {
    walkingTo = placeId;
    setBelu("Here we go! 🚶");
    HH.World.hubWalkTo(placeId, () => {
      walkingTo = null;
      enterPlace(placeId);
      if (afterEnter) afterEnter();
    });
  } else {
    enterPlace(placeId);
    if (afterEnter) afterEnter();
  }
}
function enterPlace(placeId) {
  exState.place = placeId; exState.roomId = null;
  if (window.HH && HH.World) HH.World.enterBuilding(placeId);
  $("mapBtn").hidden = false;
  const hasTasks = !!(HH.FIND_TASKS && HH.FIND_TASKS[placeId] && HH.FIND_TASKS[placeId].length);
  $("findGameBtn").hidden = !hasTasks || findState.active;
  $("roomHeader").hidden = true;
}
function showEnterChoice(placeId, place) {
  $("enterChoiceEmoji").textContent = place.emoji;
  $("enterChoiceTitle").textContent = place.name;
  speak(place.name + ". What do you want to do?");
  $("enterExploreBtn").onclick = () => {
    $("enterChoiceModal").hidden = true;
    SND.pop();
    walkThenEnter(placeId, null);
  };
  $("enterGameBtn").onclick = () => {
    $("enterChoiceModal").hidden = true;
    SND.chime();
    walkThenEnter(placeId, () => {
      setTimeout(() => { if (exState.place === placeId && !findState.active) startFindGame(); }, 350);
    });
  };
  $("enterChoiceCloseBtn").onclick = () => { $("enterChoiceModal").hidden = true; };
  $("enterChoiceModal").hidden = false;
}
function handleRoomEnter(roomId) {
  if (scenarioState) return; // scenarios control their own room chrome
  exState.roomId = roomId;
  const info = findRoomInfo(roomId);
  const rh = $("roomHeader");
  if (info) {
    rh.hidden = false;
    rh.textContent = info.room.emoji + " " + info.room.name;
    if (!visitedRoomsThisSession.has(roomId)) {
      visitedRoomsThisSession.add(roomId);
      if (!findState.active) setBelu(info.room.action);
    }
  } else {
    rh.hidden = true;
    if (!findState.active) setBelu("Walk through a door! 🚪");
  }
}
function handleObject(roomId, objIndex) {
  if (scenarioState) return;
  if (findState.active) { handleFindObjectTap(roomId, objIndex); return; }
  const info = findRoomInfo(roomId);
  const obj = info && info.room.objects && info.room.objects[objIndex];
  if (!obj) return;
  if (window.HH && HH.World && HH.World.pulseToken) HH.World.pulseToken(roomId, objIndex);
  SND.pop();
  showUsageCard(obj);
}
// zoom-in card: what the object is + a little emoji scene of HOW it's used
function showUsageCard(obj) {
  const emoji = obj[0], label = obj[1], scene = obj[2], usage = obj[3];
  $("usageEmoji").textContent = emoji;
  $("usageLabel").textContent = label;
  const sceneEl = $("usageScene");
  sceneEl.innerHTML = "";
  if (scene) {
    // split into glyph clusters (handles ZWJ emoji like the doctor)
    const parts = typeof Intl !== "undefined" && Intl.Segmenter
      ? Array.from(new Intl.Segmenter("en", { granularity: "grapheme" }).segment(scene), s => s.segment)
      : Array.from(scene);
    parts.forEach((ch, i) => {
      const sp = document.createElement("span");
      sp.textContent = ch;
      sp.style.animationDelay = (0.15 + i * 0.22) + "s";
      sceneEl.appendChild(sp);
    });
  }
  $("usageText").textContent = usage || label;
  $("usageSpeakBtn").onclick = () => speak(usage || label);
  speak(usage || label);
  $("usageModal").hidden = false;
}
function handleHelper(helperId) {
  if (scenarioState) { handleScenarioHelperTap(helperId); return; }
  openFriendCard(helperId);
}
function handleActor(actorId) {
  if (scenarioState && scenarioState.scenario.id === actorId) {
    const actor = HH.SCENARIO_ACTORS[actorId];
    if (actor && window.HH && HH.World) HH.World.say(actorId, actor.bubble, 2500);
  }
}
let toastTimer = null;
function showToast(text) {
  const t = $("toastNote");
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

/* ---- world banner: bottom overlay used by Nilu's Game + in-world scenarios ---- */
function showWorldBanner(text, opts) {
  opts = opts || {};
  const banner = $("worldBanner");
  $("worldBannerText").textContent = text || "";
  $("worldBannerSpeakBtn").onclick = () => speak(text || "");
  $("worldBannerCloseBtn").hidden = !opts.onClose;
  $("worldBannerCloseBtn").onclick = opts.onClose || null;
  $("worldBannerChoices").innerHTML = "";
  $("worldBannerActions").innerHTML = "";
  banner.hidden = false;
  $("beluBubble").hidden = true; // the banner IS the narration — don't double it
}
function setBannerText(text) { $("worldBannerText").textContent = text || ""; }
function hideWorldBanner() {
  $("worldBanner").hidden = true;
  $("worldBannerChoices").innerHTML = "";
  $("worldBannerActions").innerHTML = "";
  if (BELU_SCREENS.includes(currentScreenId())) $("beluBubble").hidden = false;
}
function currentScreenId() {
  for (const id of SCREEN_IDS) { if (!$(id).hidden) return id; }
  return "";
}
function bannerChoices(options, onCorrect) {
  buildChoices($("worldBannerChoices"), options, null, onCorrect);
}
function bannerActionButton(label, cls, onClick) {
  const btn = document.createElement("button");
  btn.className = cls || "btn-primary";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  $("worldBannerActions").appendChild(btn);
  return btn;
}

/* ---- Nilu's Game: find & do (replaces the old room quiz cards) ---- */
function startFindGame() {
  const placeId = exState.place;
  const tasks = HH.FIND_TASKS && HH.FIND_TASKS[placeId];
  if (!placeId || !tasks || !tasks.length) return;
  findState = { active: true, placeId, tasks, idx: 0, lastWrongAt: 0 };
  $("findGameBtn").hidden = true;
  showFindTask();
}
function showFindTask() {
  const task = findState.tasks[findState.idx];
  if (!task) { finishFindGame(); return; }
  setBelu(task.ask);
  showWorldBanner(task.ask, { onClose: quitFindGame });
  if (window.HH && HH.World) HH.World.setTarget({ roomId: task.roomId, objIndex: task.objIndex });
}
function handleFindObjectTap(roomId, objIndex) {
  const task = findState.tasks[findState.idx];
  if (!task) return;
  if (roomId === task.roomId && objIndex === task.objIndex) {
    SND.chime();
    awardSticker(1);
    setBelu(task.praise);
    setBannerText(task.praise);
    if (window.HH && HH.World) HH.World.setTarget(null);
    findState.idx++;
    setTimeout(showFindTask, 1500);
  } else {
    const now = Date.now();
    if (now - findState.lastWrongAt > 2500) {
      findState.lastWrongAt = now;
      SND.tryTone();
      setBelu("Hmm, not that one — keep looking! 💙");
    }
  }
}
function finishFindGame() {
  const placeId = findState.placeId;
  findState.active = false;
  hideWorldBanner();
  if (window.HH && HH.World) HH.World.setTarget(null);
  const place = HH.PLACES[placeId];
  if (placeId && !save.quizzed.includes(placeId)) save.quizzed.push(placeId);
  saveSave();
  confettiBig(); SND.chime();
  setBelu("You know your whole " + (place ? place.name : "place") + "! 🌟");
  if (place && exState.place === placeId) $("findGameBtn").hidden = false;
}
function quitFindGame() {
  findState.active = false;
  hideWorldBanner();
  if (window.HH && HH.World) HH.World.setTarget(null);
  if (exState.place && HH.FIND_TASKS && HH.FIND_TASKS[exState.place]) $("findGameBtn").hidden = false;
  setBelu("Let's keep exploring! 🌍");
}

function wireExplore() {
  $("mapBtn").addEventListener("click", goHub);
  $("findGameBtn").addEventListener("click", startFindGame);
  window.addEventListener("resize", () => { if (window.HH && HH.World && worldReady) HH.World.resize(); });
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
  // show the hand UI immediately — Nilu's intro plays alongside it, so the
  // screen is never a blank page with a lone bubble in the corner
  renderHandFill();
  playIntroSequence(HH.HAND_INTRO, () => setBelu(HH.HAND_INTRO[3]));
}

function handSVG() {
  // strokeless silhouette so fingers+palm merge cleanly; sleeve + creases for charm
  return '<svg viewBox="0 0 300 340" aria-hidden="true">' +
    '<g fill="#ffd9b3">' +
    '<rect x="54"  y="112" width="34" height="130" rx="17"/>' +
    '<rect x="97"  y="76"  width="36" height="170" rx="18"/>' +
    '<rect x="141" y="64"  width="38" height="185" rx="19"/>' +
    '<rect x="186" y="84"  width="36" height="165" rx="18"/>' +
    '<rect x="216" y="168" width="36" height="110" rx="18" transform="rotate(-38 234 178)"/>' +
    '<path d="M60 240 Q58 208 78 206 L222 206 Q240 208 238 244 L236 282 Q232 316 196 318 L104 318 Q68 316 63 282 Z"/>' +
    '</g>' +
    '<path d="M108 254 Q140 268 178 262" fill="none" stroke="#eebd8f" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M104 280 Q145 296 190 286" fill="none" stroke="#eebd8f" stroke-width="4.5" stroke-linecap="round"/>' +
    '<rect x="86" y="308" width="128" height="32" rx="16" fill="#74c0fc"/>' +
    '</svg>';
}
// fingertip slot anchors (percent of the SVG box), thumb..pinky = 1..5
const HAND_TIPS = [
  { x: 85.5, y: 48 },  // 1 thumb
  { x: 68.5, y: 27.5 },// 2 index
  { x: 53.5, y: 22 },  // 3 middle
  { x: 40.5, y: 25.5 },// 4 ring
  { x: 26, y: 34.5 },  // 5 pinky
];
const WHERE_GROUPS = [
  { key: "home", title: "At Home 🏠", match: w => w === "home" },
  { key: "school", title: "At School 🏫", match: w => w === "school" },
  { key: "town", title: "Around Town 🏙️", match: w => w !== "home" && w !== "school" },
];

function renderHandFill() {
  const body = $("handBody"); body.innerHTML = "";
  const layout = document.createElement("div"); layout.className = "hand-layout";

  // ----- left: the hand with fingertip sockets -----
  const handPanel = document.createElement("section"); handPanel.className = "hh-panel hand-panel";
  handPanel.innerHTML =
    '<div class="panel-head"><h2>Build your Helping Hand</h2>' +
    '<p>One trusted helper for every finger — from different places!</p></div>';
  const stage = document.createElement("div"); stage.className = "hand-stage";
  stage.innerHTML = handSVG();
  const firstEmpty = handState.slots.indexOf(null);
  handState.slots.forEach((helperId, idx) => {
    const slot = document.createElement("button");
    slot.className = "tip-slot" + (helperId ? " filled" : "") + (idx === firstEmpty ? " next" : "");
    slot.style.left = HAND_TIPS[idx].x + "%";
    slot.style.top = HAND_TIPS[idx].y + "%";
    if (helperId) {
      slot.innerHTML = '<span class="em">' + HH.HELPERS[helperId].emoji + '</span>' +
        '<span class="nm">' + HH.HELPERS[helperId].name + '</span>';
      slot.title = "Tap to remove " + HH.HELPERS[helperId].name;
    } else {
      slot.textContent = String(idx + 1);
      slot.title = "Empty finger " + (idx + 1);
    }
    slot.addEventListener("click", () => {
      if (helperId) { handState.slots[idx] = null; SND.pop(); renderHandFill(); }
    });
    stage.appendChild(slot);
  });
  handPanel.appendChild(stage);

  // progress row
  const filled = handState.slots.filter(Boolean);
  const wheres = new Set(filled.map(id => HH.HELPERS[id].where === "home" ? "home" : HH.HELPERS[id].where === "school" ? "school" : "town"));
  const prog = document.createElement("div"); prog.className = "hand-progress";
  prog.innerHTML =
    '<span class="prog-pill">' + filled.length + ' of 5 helpers</span>' +
    '<span class="prog-pill ' + (wheres.size >= 2 ? "ok" : "") + '">' +
    (wheres.size >= 2 ? "✓ different places" : "pick from 2+ places") + '</span>';
  handPanel.appendChild(prog);
  layout.appendChild(handPanel);

  // ----- right: grouped helper picker -----
  const picker = document.createElement("section"); picker.className = "hh-panel picker-panel";
  picker.innerHTML = '<div class="panel-head"><h2>Pick your helpers</h2>' +
    '<p>Tap a helper to put them on a finger.</p></div>';
  WHERE_GROUPS.forEach(gr => {
    const ids = Object.keys(HH.HELPERS).filter(id => gr.match(HH.HELPERS[id].where));
    if (!ids.length) return;
    const gt = document.createElement("div"); gt.className = "group-title"; gt.textContent = gr.title;
    picker.appendChild(gt);
    const grid = document.createElement("div"); grid.className = "helper-grid";
    ids.forEach(id => {
      const h = HH.HELPERS[id];
      const inHand = handState.slots.includes(id);
      const chip = document.createElement("button");
      chip.className = "helper-card" + (inHand ? " used" : "") + (save.friends.includes(id) ? " friend" : "");
      chip.innerHTML = '<span class="em">' + h.emoji + '</span><span class="nm">' + h.name + '</span>' +
        (inHand ? '<span class="pick-check">✓</span>' : "");
      chip.addEventListener("click", () => {
        if (inHand) return;
        const emptyIdx = handState.slots.indexOf(null);
        if (emptyIdx === -1) return;
        handState.slots[emptyIdx] = id;
        SND.pop();
        renderHandFill();
        checkHandComplete();
      });
      grid.appendChild(chip);
    });
    picker.appendChild(grid);
  });
  layout.appendChild(picker);
  body.appendChild(layout);

  if (filled.length < 5) {
    const left = 5 - filled.length;
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
  if (!isApproved("lesson:feelings")) {
    showKidLockModal("lesson:feelings", startFeelingsLesson);
    return;
  }
  $("handBody").innerHTML = "";
  setBelu(HH.FEELINGS.intro, { onNext: renderFeelingsSigns });
}
function beluCardRow() {
  const row = document.createElement("div"); row.className = "belu-card-row";
  row.innerHTML = '<span class="belu-card-avatar">🐘</span>';
  return row;
}
function renderFeelingsSigns() {
  const body = $("handBody"); body.innerHTML = "";
  const card = document.createElement("div"); card.className = "lesson-card";
  card.appendChild(beluCardRow());
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
  card.appendChild(beluCardRow());
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
  if (!isApproved("lesson:secrets")) {
    showKidLockModal("lesson:secrets", startSecretsLesson);
    return;
  }
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
   Enacted IN-WORLD: the child walks to the actor, feels/reacts via
   banner choices, then walks to & taps the right helper to "tell".
   Falls back to the old step-card flow only if a scenario's place
   or room is not walkable (shouldn't happen for the tier-A set).
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
  // per-item adult sign-off (see section 7) now guards every scenario,
  // so all scenarios are listed here — locked ones just show a 🔒 badge.
  return HH.SCENARIOS.slice();
}
function scenarioIsWalkable(sc) {
  const place = HH.PLACES[sc.place];
  return !!(place && place.rooms && place.rooms.some(r => r.id === sc.room) && window.HH && HH.World && worldReady);
}
function renderScenarioPicker(body) {
  setBelu("Pick a story to practice! 💪");
  const title = document.createElement("h2");
  title.className = "practice-title";
  title.textContent = "Practice Being Brave 💪";
  body.appendChild(title);
  const sub = document.createElement("p");
  sub.className = "practice-sub";
  sub.textContent = "Short practice stories! In each one we spot the uh-oh feeling, choose a safe thing to do, and go tell a helper — just like real life.";
  body.appendChild(sub);
  const hint = document.createElement("p");
  hint.className = "practice-hint";
  hint.textContent = "🔒 A grown-up reads each story first, to make sure it is just right for you.";
  body.appendChild(hint);
  const pendingCount = gatedItems().filter(it => !isApproved(it.id)).length;
  if (pendingCount) {
    const adultBtn = document.createElement("button");
    adultBtn.className = "practice-adult-btn";
    adultBtn.textContent = "👋 Grown-up here? Review & approve all " + pendingCount + " sections at once";
    adultBtn.addEventListener("click", () => startMasterReview({ onApproved: renderPractice }));
    body.appendChild(adultBtn);
  }
  const grid = document.createElement("div"); grid.className = "scenario-grid";
  visibleScenarios().forEach(sc => {
    const card = document.createElement("button");
    card.className = "scenario-card"; card.dataset.scenarioId = sc.id;
    if (!isApproved("scenario:" + sc.id)) {
      const badge = document.createElement("div"); badge.className = "lock-badge"; badge.textContent = "🔒";
      card.appendChild(badge);
    }
    const em = document.createElement("div"); em.className = "em"; em.textContent = sc.emoji;
    const tt = document.createElement("div"); tt.className = "tt"; tt.textContent = sc.title;
    card.appendChild(em); card.appendChild(tt);
    card.addEventListener("click", () => attemptStartScenario(sc));
    grid.appendChild(card);
  });
  body.appendChild(grid);
}
function attemptStartScenario(sc) {
  const itemId = "scenario:" + sc.id;
  if (!isApproved(itemId)) {
    showKidLockModal(itemId, () => attemptStartScenario(sc));
    return;
  }
  if (scenarioIsWalkable(sc)) {
    startScenarioInWorld(sc);
  } else {
    practiceState = { scenario: sc, step: "see", usedTell: [], tellPhase: "ask1" };
    renderPractice();
  }
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

/* -------- in-world flow: enact the scenario in the 3D world -------- */
function startScenarioInWorld(sc) {
  if (findState.active) quitFindGame();
  if (window.HH && HH.World) HH.World.removeActor(sc.id); // defensive: idempotent if not present
  scenarioState = { scenario: sc, step: "see", usedTell: [], tellPhase: "ask1" };
  showScreen("exploreScreen");
  $("mapBtn").hidden = true;
  $("findGameBtn").hidden = true;
  $("roomHeader").hidden = true;
  if (window.HH && HH.World) {
    HH.World.enterBuilding(sc.place);
    HH.World.teleport(sc.room);
    HH.World.spawnActor(sc.id, sc.room);
  }
  runScenarioSee();
}
function runScenarioSee() {
  const sc = scenarioState.scenario;
  const actor = HH.SCENARIO_ACTORS[sc.id];
  if (actor && window.HH && HH.World) HH.World.say(sc.id, actor.bubble, 4500);
  showWorldBanner(sc.setup, { onClose: quitScenario });
  bannerActionButton("Next ➡️", "btn-primary", () => { scenarioState.step = "feel"; runScenarioFeel(); });
  setBelu(sc.setup);
}
function runScenarioFeel() {
  const sc = scenarioState.scenario;
  showWorldBanner(sc.feelQ, { onClose: quitScenario });
  bannerChoices(sc.feelA, () => {
    setTimeout(() => { scenarioState.step = "react"; runScenarioReact(); }, 800);
  });
  setBelu(sc.feelQ);
}
function runScenarioReact() {
  const sc = scenarioState.scenario;
  showWorldBanner(sc.reactQ, { onClose: quitScenario });
  bannerChoices(sc.reactA, () => {
    // the correct reaction always moves the child away from the situation
    if (window.HH && HH.World) HH.World.removeActor(sc.id);
    setTimeout(() => { scenarioState.step = "reactWhy"; runScenarioReactWhy(); }, 800);
  });
  setBelu(sc.reactQ);
}
function runScenarioReactWhy() {
  const sc = scenarioState.scenario;
  showWorldBanner(sc.reactWhy, { onClose: quitScenario });
  bannerActionButton("Next ➡️", "btn-primary", () => { startTellStep(); });
  setBelu(sc.reactWhy);
}
function startTellStep() {
  const sc = scenarioState.scenario;
  scenarioState.step = "tell";
  scenarioState.tellPhase = "ask1";
  showWorldBanner(sc.tellPrompt, { onClose: quitScenario });
  setBelu(sc.tellPrompt);
  if (window.HH && HH.World) HH.World.setTarget({ helperId: sc.tellTo[0] });
}
function helperPlaceOf(helperId) {
  for (const placeId in HH.HELPER_SPOTS) {
    const rooms = HH.HELPER_SPOTS[placeId];
    for (const roomId in rooms) if (rooms[roomId] === helperId) return placeId;
  }
  return null;
}
function handleScenarioHelperTap(helperId) {
  if (!scenarioState || scenarioState.step !== "tell") return;
  const sc = scenarioState.scenario;
  const phase = scenarioState.tellPhase;
  const expected = phase === "ask2" ? sc.tellTo[1] : sc.tellTo[0];
  if (helperId !== expected) {
    SND.tryTone();
    setBannerText("Try another helper! 💙");
    return;
  }
  scenarioState.usedTell.push(helperId);
  SND.chime();
  confettiBig();
  if (sc.keepTelling && scenarioState.usedTell.length === 1) {
    if (window.HH && HH.World) {
      HH.World.setTarget(null);
      HH.World.say(helperId, sc.busyLine, 3000);
    }
    setBannerText(sc.busyLine);
    setBelu(sc.busyLine);
    setTimeout(() => {
      scenarioState.tellPhase = "keep";
      setBannerText(sc.keepLine);
      setBelu(sc.keepLine);
      setTimeout(() => {
        scenarioState.tellPhase = "ask2";
        const nextHelper = sc.tellTo[1];
        const nextPlace = helperPlaceOf(nextHelper);
        if (nextPlace && nextPlace !== sc.place && window.HH && HH.World) {
          // the next helper lives in a different building — go there!
          const line = sc.goLine || "Let's go find another helper!";
          setBannerText(line);
          setBelu(line);
          speak(line);
          setTimeout(() => {
            HH.World.enterBuilding(nextPlace);
            setBannerText(sc.tellPrompt);
            HH.World.setTarget({ helperId: nextHelper });
          }, 2600);
        } else {
          setBannerText("Who else can you tell?");
          setBelu("Who else can you tell?");
          if (window.HH && HH.World) HH.World.setTarget({ helperId: nextHelper });
        }
      }, 1800);
    }, 3000);
  } else {
    scenarioState.step = "resolve";
    runScenarioResolve();
  }
}
function runScenarioResolve() {
  const sc = scenarioState.scenario;
  const helperId = scenarioState.usedTell[scenarioState.usedTell.length - 1];
  if (window.HH && HH.World) {
    HH.World.setTarget(null);
    HH.World.say(helperId, "You were brave to tell me. 💙", 4000);
  }
  if (!save.done.includes(sc.id)) save.done.push(sc.id);
  saveSave();
  awardSticker(1);
  confettiBig(); SND.chime();
  const aff = HH.AFFIRMATIONS[Math.floor(Math.random() * HH.AFFIRMATIONS.length)];
  showWorldBanner(sc.resolve + "  " + aff, {});
  bannerActionButton("Play again 🔁", "btn-secondary", () => { startScenarioInWorld(sc); });
  bannerActionButton("More stories ➡️", "btn-primary", () => {
    endScenario();
    showScreen("practiceScreen");
    practiceState = { scenario: null, step: "pick", usedTell: [], tellPhase: "ask1" };
    renderPractice();
  });
  setBelu(sc.resolve);
}
function endScenario() {
  if (scenarioState) {
    const sc = scenarioState.scenario;
    if (window.HH && HH.World) { HH.World.removeActor(sc.id); HH.World.setTarget(null); }
  }
  scenarioState = null;
  hideWorldBanner();
}
function quitScenario() {
  endScenario();
  showScreen("practiceScreen");
  practiceState = { scenario: null, step: "pick", usedTell: [], tellPhase: "ask1" };
  renderPractice();
  setBelu("Let's pick another story! 💪");
}

/* ---------------------------------------------------------------
   7. ADULT SIGN-OFF: adult check challenge, review sheet, kid lock
   --------------------------------------------------------------- */
let globalToastTimer = null;
function showGlobalToast(text) {
  const t = $("globalToast");
  t.textContent = text; t.hidden = false;
  clearTimeout(globalToastTimer);
  globalToastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

/* ---- adult check: a randomized easy-for-adults challenge ---- */
function generateAdultChallenge() {
  const types = ["mult", "year", "spell"];
  const type = types[Math.floor(Math.random() * types.length)];
  if (type === "mult") {
    const a = 11 + Math.floor(Math.random() * 9); // 11-19
    const b = 3 + Math.floor(Math.random() * 6);  // 3-8
    return { question: "What is " + a + " × " + b + "?", check: v => parseInt(v, 10) === a * b };
  }
  if (type === "year") {
    const n = 10 + Math.floor(Math.random() * 31); // 10-40 years ago
    const currentYear = new Date().getFullYear();
    return { question: "What year was it " + n + " years ago?", check: v => parseInt(v, 10) === currentYear - n };
  }
  const sentences = [
    "The quick brown fox jumps over the lazy dog",
    "Grown-ups keep children safe every single day",
    "Please read this whole sentence very carefully now",
    "Our family likes to walk in the park together",
  ];
  const s = sentences[Math.floor(Math.random() * sentences.length)];
  const target = s.split(" ")[4]; // fifth word
  const norm = v => String(v).trim().toLowerCase().replace(/[^a-z]/g, "");
  return { question: 'Type the fifth word of this sentence: "' + s + '"', check: v => norm(v) === norm(target) };
}
let adultCheckState = null;
function adultCheck(onPass) {
  adultCheckState = { challenge: generateAdultChallenge(), attempts: 0, onPass };
  $("adultQuestion").textContent = adultCheckState.challenge.question;
  $("adultAnswerInput").value = "";
  $("adultAnswerInput").disabled = false;
  $("adultSubmitBtn").disabled = false;
  $("adultError").hidden = true;
  $("adultCheckModal").hidden = false;
  setTimeout(() => $("adultAnswerInput").focus(), 50);
}
function submitAdultCheck() {
  if (!adultCheckState) return;
  const val = $("adultAnswerInput").value;
  if (adultCheckState.challenge.check(val)) {
    const onPass = adultCheckState.onPass;
    $("adultCheckModal").hidden = true;
    adultCheckState = null;
    if (onPass) onPass();
    return;
  }
  adultCheckState.attempts++;
  const err = $("adultError");
  if (adultCheckState.attempts >= 3) {
    err.hidden = false;
    err.textContent = "Please try again later.";
    $("adultAnswerInput").disabled = true;
    $("adultSubmitBtn").disabled = true;
    setTimeout(() => {
      $("adultCheckModal").hidden = true;
      $("adultAnswerInput").disabled = false;
      $("adultSubmitBtn").disabled = false;
      adultCheckState = null;
    }, 1700);
  } else {
    err.hidden = false;
    err.textContent = "Not quite — try again.";
    $("adultAnswerInput").value = "";
    $("adultAnswerInput").focus();
    const card = document.querySelector("#adultCheckModal .adult-card");
    card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
  }
}
function cancelAdultCheck() {
  $("adultCheckModal").hidden = true;
  adultCheckState = null;
}

/* ---- kid-facing lock modal: "bring this to a grown-up" ---- */
let kidLockResume = null;
function showKidLockModal(itemId, resumeFn) {
  kidLockResume = resumeFn || null;
  $("kidLockReviewBtn").onclick = () => {
    $("kidLockModal").hidden = true;
    startReview(itemId, { onApproved: () => { if (kidLockResume) kidLockResume(); } });
  };
  $("kidLockModal").hidden = false;
}

/* ---- review sheet: full verbatim script + sign-off footer ---- */
function escHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function helperNames(ids) { return (ids || []).map(id => (HH.HELPERS[id] ? HH.HELPERS[id].name : id)).join(", "); }
function reviewField(label, text) {
  return '<div class="review-block"><div class="review-label">' + escHtml(label) + '</div><div class="review-text">' + escHtml(text) + "</div></div>";
}
function reviewChoiceBlock(label, q, choices) {
  const items = (choices || []).map((c, i) => "<li>" + escHtml(c) + (i === 0 ? " <b>✓ correct</b>" : "") + "</li>").join("");
  return '<div class="review-block"><div class="review-label">' + escHtml(label) + '</div><div class="review-text">' + escHtml(q) +
    '</div><ul class="review-list">' + items + "</ul></div>";
}
function reviewSignoffFooter() {
  return '<div class="review-signoff-footer">' +
    '<label class="review-name-label">Your name or initials' +
      '<input id="reviewNameInput" type="text" class="review-name-input" placeholder="e.g. AJ"></label>' +
    '<label class="review-checkbox-label"><input id="reviewApproveCheckbox" type="checkbox"> I have read this section and approve it for my child</label>' +
    '<div class="review-actions">' +
      '<button id="reviewNotNowBtn" class="btn-plain">Not now</button>' +
      '<button id="reviewApproveBtn" class="btn-primary" disabled>Approve &amp; unlock</button>' +
    "</div></div>";
}
function buildReviewHTML(itemId) {
  return buildReviewScriptHTML(itemId) + reviewSignoffFooter();
}
function buildReviewScriptHTML(itemId) {
  let html = "";
  if (itemId.indexOf("scenario:") === 0) {
    const scId = itemId.slice("scenario:".length);
    const sc = HH.SCENARIOS.find(s => s.id === scId);
    if (!sc) return "<p>Item not found.</p>";
    const actor = HH.SCENARIO_ACTORS[sc.id];
    html += '<div class="review-header"><span class="review-emoji">' + sc.emoji + "</span><h2>" + escHtml(sc.title) + "</h2></div>";
    html += reviewField("Setup", sc.setup);
    if (actor && actor.bubble) html += reviewField("Actor says (in-world speech bubble)", actor.bubble);
    html += reviewChoiceBlock("Feel — question", sc.feelQ, sc.feelA);
    html += reviewChoiceBlock("React — question", sc.reactQ, sc.reactA);
    html += reviewField("Why this is the right reaction", sc.reactWhy);
    if (sc.busyLine) html += reviewField("If the first helper is busy", sc.busyLine);
    if (sc.keepLine) html += reviewField("Keep-telling encouragement", sc.keepLine);
    if (sc.goLine) html += reviewField("Moving to find another helper", sc.goLine);
    html += reviewField("Tell prompt", sc.tellPrompt);
    html += reviewField("Accepted helpers to tell", helperNames(sc.tellTo));
    html += reviewField("Resolution", sc.resolve);
  } else if (itemId === "lesson:feelings") {
    const F = HH.FEELINGS;
    html += '<div class="review-header"><span class="review-emoji">💓</span><h2>Feelings Lesson</h2></div>';
    html += reviewField("Intro", F.intro);
    html += '<div class="review-block"><div class="review-label">Signs</div><ul class="review-list">' +
      F.signs.map(s => "<li>" + s.emoji + " " + escHtml(s.text) + "</li>").join("") + "</ul></div>";
    html += reviewField("Lesson", F.lesson);
    html += reviewChoiceBlock("Quiz", F.quiz.q, F.quiz.a);
  } else if (itemId === "lesson:secrets") {
    const S = HH.SECRETS;
    html += '<div class="review-header"><span class="review-emoji">🤫</span><h2>Secrets Lesson</h2></div>';
    html += reviewField("Intro", S.intro);
    html += reviewField("Rule", S.rule);
    html += '<div class="review-block"><div class="review-label">Items</div>' +
      S.items.map(it => '<div class="review-secret-item"><b>' + it.emoji + " " + escHtml(it.text) + "</b><br>Classification: " +
        (it.safe ? "Happy surprise" : "Tell a helper") + "<br>Why: " + escHtml(it.why) + "</div>").join("") +
      "</div>";
  } else {
    html += "<p>Unknown item.</p>";
  }
  return html;
}
const REVIEW_WHY = "Why review? These practice stories touch real safety topics — bullying, getting lost, body safety, secrets. Reading the full script first lets you decide what fits your child today, and be ready to talk about it together afterward. You can re-lock any section at any time from the Grown-Ups Corner.";
function bindReviewSheet(bodyHTML, approveLabel, onApprove) {
  $("reviewSheetBody").innerHTML = '<p class="review-intro">' + REVIEW_WHY + "</p>" + bodyHTML;
  const nameInput = $("reviewNameInput");
  const checkbox = $("reviewApproveCheckbox");
  const approveBtn = $("reviewApproveBtn");
  approveBtn.textContent = approveLabel;
  nameInput.value = signoff.reviewer || "";
  checkbox.checked = false;
  function updateApproveBtn() { approveBtn.disabled = !(checkbox.checked && nameInput.value.trim()); }
  nameInput.oninput = updateApproveBtn;
  checkbox.onchange = updateApproveBtn;
  updateApproveBtn();
  approveBtn.onclick = () => {
    onApprove(nameInput.value.trim());
    $("reviewSheetModal").hidden = true;
  };
  $("reviewNotNowBtn").onclick = () => { $("reviewSheetModal").hidden = true; };
  $("reviewSheetModal").hidden = false;
  $("reviewSheetModal").scrollTop = 0;
}
function openReviewSheet(itemId, opts) {
  opts = opts || {};
  bindReviewSheet(buildReviewHTML(itemId), "Approve & unlock", name => {
    approveItem(itemId, name);
    showGlobalToast("Approved! This section is unlocked. 💙");
    if (opts.onApproved) opts.onApproved();
  });
}
// one master page: every not-yet-approved script, one sign-off for all
function openMasterReviewSheet(opts) {
  opts = opts || {};
  const pending = gatedItems().filter(it => !isApproved(it.id));
  if (!pending.length) { showGlobalToast("Everything is already approved on this device. ✓"); return; }
  const html = pending.map((it, i) =>
    '<div class="review-master-head">Section ' + (i + 1) + " of " + pending.length + "</div>" +
    buildReviewScriptHTML(it.id)
  ).join("") + reviewSignoffFooter();
  bindReviewSheet(html, "Approve all " + pending.length + " sections", name => {
    pending.forEach(it => approveItem(it.id, name));
    showGlobalToast("All " + pending.length + " sections approved and unlocked. 💙");
    if (opts.onApproved) opts.onApproved();
  });
}
function startMasterReview(opts) { withAdultOk(() => openMasterReviewSheet(opts)); }
/* one adult-check per browser session guards both the review flow and
   the Grown-Ups Corner itself */
function withAdultOk(onOk) {
  if (sessionStorage.getItem("hh_adult_ok") === "1") { onOk(); return; }
  adultCheck(() => { sessionStorage.setItem("hh_adult_ok", "1"); onOk(); });
}
function startReview(itemId, opts) {
  withAdultOk(() => openReviewSheet(itemId, opts));
}
function wireAdultSignoff() {
  $("adultSubmitBtn").addEventListener("click", submitAdultCheck);
  $("adultAnswerInput").addEventListener("keydown", e => { if (e.key === "Enter") submitAdultCheck(); });
  $("adultCancelBtn").addEventListener("click", cancelAdultCheck);
  $("kidLockOkBtn").addEventListener("click", () => { $("kidLockModal").hidden = true; });
  $("usageOkBtn").addEventListener("click", () => { $("usageModal").hidden = true; SND.pop(); });
  $("usageModal").addEventListener("click", e => { if (e.target.id === "usageModal") $("usageModal").hidden = true; });
  $("reviewCloseBtn").addEventListener("click", () => { $("reviewSheetModal").hidden = true; });
}

/* ---------------------------------------------------------------
   8. GROWN-UPS CORNER (adult-gated, sober styling)
   --------------------------------------------------------------- */
let guReturnScreen = "titleScreen";

function enterGrownups(returnScreen) {
  guReturnScreen = returnScreen || "titleScreen";
  showScreen("grownupsScreen");
  if (sessionStorage.getItem("hh_adult_ok") === "1") {
    $("guGateWrap").hidden = true;
    renderGrownupsBody();
  } else {
    $("guGateWrap").hidden = false;
    $("guBody").hidden = true;
  }
}
function renderSignoffSection() {
  const rows = gatedItems().map(it => {
    const st = signoff.items[it.id];
    let chipClass = "chip-pending", chipText = "Not yet reviewed";
    if (st && st.locked) { chipClass = "chip-locked"; chipText = "Locked"; }
    else if (st && st.approvedAt) { chipClass = "chip-approved"; chipText = "Approved " + formatDate(st.approvedAt); }
    const reviewBtn = '<button class="btn-plain signoff-review-btn" data-item="' + it.id + '">Review &amp; approve</button>';
    const lockBtn = (st && st.approvedAt && !st.locked)
      ? '<button class="btn-plain signoff-lock-btn" data-item="' + it.id + '">Lock</button>' : "";
    return "<tr><td>" + escHtml(it.title) + '</td><td><span class="chip ' + chipClass + '">' + chipText + "</span></td><td>" +
      reviewBtn + " " + lockBtn + "</td></tr>";
  }).join("");
  const pendingCount = gatedItems().filter(it => !isApproved(it.id)).length;
  return "<h3>Content Sign-off</h3>" +
    '<p class="gu-why">Why this exists: the practice stories touch real safety situations — bullying, getting lost, body safety, secrets. You read each script before your child plays it, so you decide what fits your child today and can talk about it together afterward. Approvals are saved on this device only, and you can re-lock any section at any time.</p>' +
    (pendingCount
      ? '<p><button class="btn-plain btn-master" id="signoffMasterBtn">📋 Review everything at once — ' + pendingCount + ' section' + (pendingCount === 1 ? '' : 's') + ' remaining</button></p>'
      : '<p class="gu-note">All sections are approved on this device. ✓</p>') +
    "<p>Reviewer on file: <b>" + (signoff.reviewer ? escHtml(signoff.reviewer) : "—") + "</b></p>" +
    '<table class="gu-table signoff-table"><thead><tr><th>Item</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + "</tbody></table>" +
    '<div class="gu-note">Every scenario and both lessons must be approved once before a child can play them. ' +
    "You can re-lock any section at any time.</div>";
}
function renderGrownupsBody() {
  const body = $("guBody");
  body.hidden = false;
  const G = HH.GROWNUPS;
  const esc = s => String(s);
  body.innerHTML =
    renderSignoffSection() +
    "<h3>What This Teaches</h3><ul>" + G.what.map(t => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
    "<h3>If A Child Tells You Something</h3><ol>" + G.disclosure.map(t => "<li>" + esc(t) + "</li>").join("") + "</ol>" +
    "<h3>Where To Report</h3><table class=\"gu-table\">" +
      G.report.map(row => "<tr><td>" + esc(row[0]) + "</td><td>" + esc(row[1]) + "</td></tr>").join("") +
    "</table>" +
    "<div class=\"gu-note\">" + esc(G.note) + "</div>" +
    '<div class="gu-actions"><button class="btn-plain" id="guPrintBtn">🖨️ Print</button>' +
    '<a class="btn-plain" href="/legal/disclosure.html" target="_blank" rel="noopener">General Disclosure</a></div>';
  $("guPrintBtn").addEventListener("click", () => window.print());
}
function wireGrownups() {
  $("guEnterBtn").addEventListener("click", () => {
    withAdultOk(() => { $("guGateWrap").hidden = true; renderGrownupsBody(); });
  });
  $("guBackBtn").addEventListener("click", () => showScreen(guReturnScreen));
  $("grownupsLinkTitle").addEventListener("click", () => enterGrownups("titleScreen"));
  $("grownupsLinkMenu").addEventListener("click", () => enterGrownups("menuScreen"));
  $("guBody").addEventListener("click", e => {
    if (e.target.id === "signoffMasterBtn" || e.target.closest("#signoffMasterBtn")) {
      startMasterReview({ onApproved: renderGrownupsBody }); return;
    }
    const reviewBtn = e.target.closest(".signoff-review-btn");
    if (reviewBtn) { startReview(reviewBtn.dataset.item, { onApproved: renderGrownupsBody }); return; }
    const lockBtn = e.target.closest(".signoff-lock-btn");
    if (lockBtn) {
      if (confirm("Lock this section? Your child will need a grown-up to review and approve it again.")) {
        lockItem(lockBtn.dataset.item);
        renderGrownupsBody();
      }
    }
  });
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
    if (back) { exitOverlayModes(); showScreen("menuScreen"); return; }
  });
}

function boot() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduced-motion");
  }
  resizeConfetti();
  loadSave();
  loadSignoff();
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
  wireAdultSignoff();
  wireGlobalBelu();
  wireGlobalChrome();

  // gate is hidden in the markup so the public build never flashes it;
  // review builds (REQUIRE_GATE=true) reveal it here instead
  if (HH.REQUIRE_GATE && sessionStorage.getItem("hh_gate") !== "1") {
    SCREEN_IDS.forEach(s => { $(s).hidden = true; });
    $("beluBubble").hidden = true;
    $("gateScreen").hidden = false;
  } else {
    showScreen("titleScreen");
  }
}

boot();


/* test hooks (harmless in production; used by headless verification) */
window.__HHTEST = {
  handleBuilding, handleObject, handleHelper, handleActor, handleRoomEnter, showScreen,
  startFindGame, quitFindGame,
  attemptStartScenario, quitScenario, handleScenarioHelperTap,
  getSignoffState,
  approveItemForTest(itemId, name) { approveItem(itemId, name); },
  lockItemForTest(itemId) { lockItem(itemId); },
  startReview,
  get exState() { return exState; },
  get worldReady() { return worldReady; },
  get findState() { return findState; },
  get scenarioState() { return scenarioState; },
};

})();
