/* ============================================================
   Mountain House Road Safety Heroes  v2 — REAL MAP EDITION
   A road-safety learning game by Aaria's Blue Elephant
   aariasblueelephant.org — Building a New Inclusive World
   Map data © OpenStreetMap contributors (ODbL)
   ============================================================ */
"use strict";

/* ---------- canvas & constants ---------- */
const cvs = document.getElementById("game");
const ctx = cvs.getContext("2d");
const W = 520, H = 760;
const PLAYER_Y = 590;          // player screen y (top-down)
const LANE_W = 64;             // gameplay lane width, px
const PXM = 6;                 // px per meter (world scale)
const PXMPH = 10;              // px/sec per mph
const DS = 24;                 // route resample step, px
const HORIZON = 320, Z0 = 80, CAMD = 300, KY = (H - HORIZON) * Z0; // first-person camera
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
function hash(n){ const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* ---------- vehicles ---------- */
const VEHICLES = [
  { id:"bike",    name:"Bicycle",      emoji:"🚲", max:18, accel:7,  brake:28, w:24, h:46 },
  { id:"ebike",   name:"E-Bike",       emoji:"⚡",  max:24, accel:10, brake:32, w:24, h:48 },
  { id:"scooter", name:"E-Scooter",    emoji:"🛴", max:16, accel:9,  brake:32, w:20, h:42 },
  { id:"ev",      name:"EV Car",       emoji:"🔋", max:35, accel:14, brake:45, w:42, h:72 },
  { id:"car",     name:"Car",          emoji:"🚙", max:45, accel:13, brake:45, w:42, h:74 },
  { id:"monster", name:"Monster Truck",emoji:"🛻", max:38, accel:16, brake:42, w:52, h:82, secret:true },
];

/* ---------- level configs (routes come from real OSM data) ---------- */
const CFG = [
  { title:"Wicklund Neighborhood Ride", lanes:2, base:25, lights:1, stops:2, constr:0, emerg:0, festival:false },
  { title:"Ride to the Kite Festival",  lanes:2, base:25, lights:2, stops:1, constr:1, emerg:0, festival:true,  festName:"MH Kite Festival 🪁" },
  { title:"Library Run to Hansen Park", lanes:2, base:25, lights:2, stops:1, constr:1, emerg:1, festival:false },
  { title:"Town Hall to the High School",lanes:3, base:30, lights:3, stops:0, constr:1, emerg:1, festival:false },
  { title:"Grand Mountain House Drive", lanes:3, base:35, lights:3, stops:1, constr:1, emerg:2, festival:true,  festName:"MH Farmers Market 🥕" },
  { title:"Creekside Stunt Run",        lanes:2, base:30, lights:1, stops:1, constr:0, emerg:0, festival:false, bumps:true },
];
const THEMES = [   // sky/grass per level — mornings to golden hour
  { skyT:"#7ec8ff", skyB:"#cfeaff", g1:"#9ed98f", g2:"#92cf83", sun:"#fff3b0" },
  { skyT:"#6fc0ff", skyB:"#d8f0ff", g1:"#a3dc94", g2:"#97d288", sun:"#fff3b0" },
  { skyT:"#7ec8ff", skyB:"#e8f6ff", g1:"#9ed98f", g2:"#90cc81", sun:"#fff3b0" },
  { skyT:"#ffb86b", skyB:"#ffe3b3", g1:"#b8d489", g2:"#aac97c", sun:"#ffd166" },
  { skyT:"#ff8e6e", skyB:"#ffd9a8", g1:"#b5c97e", g2:"#a8bd72", sun:"#ff9e4f" },
  { skyT:"#69d2ff", skyB:"#e0f7ff", g1:"#a8d999", g2:"#9bce8c", sun:"#fff3b0" },
];

/* ---------- map data → px space ---------- */
function pxify(flat){ const o = new Float32Array(flat.length); for (let i = 0; i < flat.length; i++) o[i] = flat[i] * PXM; return o; }
function bboxOf(p){ let a=1e18,b=1e18,c=-1e18,d=-1e18;
  for (let i = 0; i < p.length; i += 2){ a=Math.min(a,p[i]); c=Math.max(c,p[i]); b=Math.min(b,p[i+1]); d=Math.max(d,p[i+1]); }
  return [a,b,c,d]; }
const MAPR  = MH.roads.map(r => { const p = pxify(r.p); return { c:r.c, n:r.n, p, b:bboxOf(p) }; });
const MAPP  = MH.parks.map(r => { const p = pxify(r.p); return { n:r.n, p, b:bboxOf(p) }; });
const MAPW  = MH.water.map(r => { const p = pxify(r.p); return { a:r.a, p, b:bboxOf(p) }; });
const MAPS  = MH.schools.map(r => { const p = pxify(r.p); return { n:r.n, p, b:bboxOf(p) }; });
const POIS  = MH.pois.map(p => ({ k:p.k, n:p.n, x:p.x*PXM, y:p.y*PXM }));

/* ---------- real NAIP aerial imagery (public domain, USDA) ---------- */
const HAS_AERIAL = typeof AERIAL !== "undefined";
const aerialImg = {};                 // li -> Image (or false if it failed to load)
function loadAerial(li){
  if (!HAS_AERIAL || !AERIAL[li] || aerialImg[li] !== undefined) return;
  const im = new Image();
  im.onerror = () => { aerialImg[li] = false; };
  im.src = AERIAL[li].file;
  aerialImg[li] = im;
}

/* ---------- routes: resample + smooth headings ---------- */
function buildRoute(r){
  const raw = [];
  for (let i = 0; i < r.p.length; i += 2) raw.push([r.p[i]*PXM, r.p[i+1]*PXM]);
  const cum = [0];
  for (let i = 1; i < raw.length; i++)
    cum.push(cum[i-1] + Math.hypot(raw[i][0]-raw[i-1][0], raw[i][1]-raw[i-1][1]));
  const len = cum[cum.length-1];
  const n = Math.max(2, Math.floor(len / DS) + 1);
  const sx = new Float32Array(n), sy = new Float32Array(n), hd = new Float32Array(n);
  let seg = 0;
  for (let i = 0; i < n; i++){
    const d = Math.min(len - .01, i * DS);
    while (seg < raw.length - 2 && cum[seg+1] < d) seg++;
    const t = (d - cum[seg]) / Math.max(.01, cum[seg+1] - cum[seg]);
    sx[i] = lerp(raw[seg][0], raw[seg+1][0], t);
    sy[i] = lerp(raw[seg][1], raw[seg+1][1], t);
  }
  // headings, unwrapped then box-smoothed
  const hraw = new Float32Array(n);
  for (let i = 0; i < n; i++){
    const j = Math.min(n-2, i);
    let a = Math.atan2(sy[j+1]-sy[j], sx[j+1]-sx[j]);
    if (i){ while (a - hraw[i-1] >  Math.PI) a -= 2*Math.PI;
            while (a - hraw[i-1] < -Math.PI) a += 2*Math.PI; }
    hraw[i] = a;
  }
  const RAD = 5;
  for (let i = 0; i < n; i++){
    let s = 0, c = 0;
    for (let k = -RAD; k <= RAD; k++){ const j = clamp(i+k, 0, n-1); s += hraw[j]; c++; }
    hd[i] = s / c;
  }
  return {
    name: r.name, len, n, sx, sy, hd,
    streets: r.streets.map(s => [s[0]*PXM, s[1]]),
    marks: r.marks.map(m => ({ d:m[0]*PXM, side:m[1], name:m[2], kind:m[3] })),
  };
}
const ROUTES = MH.routes.map(buildRoute);

function sample(rt, d){
  const f = clamp(d, 0, rt.len - .5) / DS;
  const i = Math.min(rt.n - 2, Math.floor(f)), t = f - i;
  const h = lerp(rt.hd[i], rt.hd[i+1], t);
  return { x: lerp(rt.sx[i], rt.sx[i+1], t), y: lerp(rt.sy[i], rt.sy[i+1], t),
           h, fx: Math.cos(h), fy: Math.sin(h), rx: -Math.sin(h), ry: Math.cos(h) };
}

/* ---------- safety tips ---------- */
const TIPS = {
  stopsign:   { pts:8,  icon:"🛑", title:"Stop means STOP!",
    text:"At a stop sign, come to a COMPLETE stop. Look LEFT, then RIGHT, then LEFT again. Only go when it's clear." },
  redlight:   { pts:12, icon:"🚦", title:"Red light means stop!",
    text:"When the light is red, stop behind the white line and wait. Green means you may go — but still look both ways first!" },
  yield:      { pts:10, icon:"🚸", title:"People walking go first!",
    text:"When someone is in a crosswalk, stop and wait until they are all the way across. People always have the right of way." },
  hitPed:     { pts:20, icon:"😢", title:"Always stop for people!",
    text:"That was a close one! Slow down whenever you see a crosswalk, and STOP if anyone is crossing. Let's try that crossing again, slowly." },
  emergency:  { pts:10, icon:"🚑", title:"Siren? Pull RIGHT and stop!",
    text:"When you hear a siren or see flashing lights, move to the RIGHT side of the road and stop until the emergency vehicle has passed." },
  cone:       { pts:5,  icon:"🚧", title:"Careful in work zones!",
    text:"Construction zones have workers and machines. Slow down, stay out of the closed lane, and never hit the cones!" },
  schoolSpeed:{ pts:6,  icon:"🏫", title:"Slow down — school zone!",
    text:"The speed limit near a school is 15 mph when children are present. Kids can step out suddenly — go slow and keep watching." },
  festSpeed:  { pts:6,  icon:"🎪", title:"Big event — go slow!",
    text:"Lots of people walk near festivals and markets. Crawl along slowly and be ready to stop at any moment." },
  zoneSpeed:  { pts:6,  icon:"🚧", title:"Slow down for workers!",
    text:"Always obey the lower speed limit in a construction zone. Workers are counting on you to keep them safe." },
};

/* ---------- quizzes ---------- */
const QUIZ = {
  bike:[
    { q:"Before riding your bike, what should you ALWAYS put on?",
      opts:["My helmet 🪖","Sunglasses 😎","Headphones 🎧"], a:0,
      why:"A helmet protects your brain if you fall. Every ride, every time!" },
    { q:"Where should you ride your bike on the road?",
      opts:["The left side","The right side, same direction as cars","The middle of the road"], a:1,
      why:"Ride on the RIGHT, going the same way as traffic, so drivers can see and expect you." },
    { q:"What do you do at a STOP sign?",
      opts:["Slow down a little","Ring my bell and keep going","Stop fully, look left-right-left"], a:2,
      why:"A full stop plus looking both ways keeps you safe at every corner." },
  ],
  ebike:[
    { q:"E-bikes go faster than regular bikes. What does that mean?",
      opts:["I need MORE room to stop — brake earlier","I can ignore stop signs","I should ride faster everywhere"], a:0,
      why:"More speed = longer stopping distance. Slow down sooner than you think you need to." },
    { q:"Do you still need a helmet on an e-bike?",
      opts:["Only on long rides","YES — always!","Only if it's raining"], a:1,
      why:"Helmets are required for young e-bike riders in California — and they're always a smart idea." },
    { q:"When passing people walking, you should…",
      opts:["Zoom past quickly","Slow down, say 'passing on your left', give space","Honk loudly"], a:1,
      why:"Slow, announce, and give plenty of space. Paths are shared with everyone." },
  ],
  scooter:[
    { q:"What's the safest way to cross a street with your scooter?",
      opts:["At the crosswalk — and walk it across","Anywhere, fast as I can","Between parked cars"], a:0,
      why:"Cross at crosswalks and walk your scooter — drivers can see you much better there." },
    { q:"In the evening, what helps drivers see you?",
      opts:["Dark clothes","Lights and bright clothing","Riding faster"], a:1,
      why:"Lights and bright colors make you visible. Be seen = be safe!" },
    { q:"How many people fit safely on one scooter?",
      opts:["One — just me!","Two if we hold on tight","Three small friends"], a:0,
      why:"Scooters are built for ONE rider. A passenger makes it wobbly and dangerous." },
  ],
  ev:[
    { q:"Electric cars are very quiet. Why be extra careful near walkers?",
      opts:["They might not HEAR you coming","Quiet cars are slower","No reason"], a:0,
      why:"People often listen for cars. A quiet EV can surprise them — so you must watch extra carefully." },
    { q:"In a school zone the limit is 15 mph when children are present. You should…",
      opts:["Drive normal speed if no kids in sight","Slow down and scan for kids the whole time","Honk to warn kids"], a:1,
      why:"Kids can appear from anywhere — between cars, behind buses. Slow down and keep scanning." },
    { q:"The light turns yellow as you get close. What does yellow mean?",
      opts:["Speed up to make it!","Get ready to stop if you safely can","Yellow means go"], a:1,
      why:"Yellow warns that red is coming. If you can stop safely, stop." },
  ],
  car:[
    { q:"You hear a siren behind you. What do you do?",
      opts:["Speed up to get out of the way","Pull to the RIGHT and stop","Stop right where I am, middle of road"], a:1,
      why:"Pull to the right edge and stop. Emergency crews need a clear path to help someone." },
    { q:"Why keep space between you and the car ahead?",
      opts:["So you have time to stop if they brake","To see their bumper stickers","No reason"], a:0,
      why:"Space = time. If they stop suddenly, you'll have room to stop too." },
    { q:"In a construction zone you should…",
      opts:["Drive the normal limit","Slow down, follow the cones and signs","Change lanes quickly"], a:1,
      why:"Slow down and follow the orange signs — fines double and workers' lives depend on it." },
  ],
  monster:[
    { q:"Monster trucks are big and heavy. What does that mean?",
      opts:["They can ignore the rules","They need even MORE time and space to stop","They always go first"], a:1,
      why:"The bigger and heavier the vehicle, the longer it takes to stop. Big drivers slow down EARLY." },
    { q:"Where is it OK to do jumps and stunts?",
      opts:["On neighborhood streets","Only at a closed course or special event","In parking lots"], a:1,
      why:"Stunts belong at closed events with safety crews — never on streets where people walk and ride." },
    { q:"Even in a monster truck, when kids are crossing you…",
      opts:["Honk and roll through slowly","STOP completely and wait for them","Drive around them"], a:1,
      why:"No matter how big your wheels are, people in the crosswalk always go first." },
  ],
};

/* ---------- save / load ---------- */
const SAVE_KEY = "abeRoadSafety2";
let save = { name:"", unlocked:1, certs:{}, view:"top", minimap:true };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = Object.assign(save, s); } catch(e){}
function persist(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch(e){} }

/* ---------- game state ---------- */
const S = {
  screen:"menu", li:0, veh:VEHICLES[0], cfg:CFG[0], rt:ROUTES[0],
  t:0, o:0, speed:0, score:100, time:0,
  events:[], amb:null, toasts:[], banner:null,
  shake:0, speedTimer:0, quizBonus:0, finalScore:0,
  air:null, airPts:0, houses:[], mm:null, view: save.view || "top",
};
let cam = null;
const input = { left:false, right:false, go:false, stop:false };
const HWf = () => S.cfg.lanes * LANE_W / 2;
const laneC = i => -HWf() + LANE_W * (i + .5);

/* ---------- audio ---------- */
let AC = null, muted = false, sirenOsc = null, sirenInt = null;
function ensureAudio(){ if (!AC) { try { AC = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} } }
function tone(freq, dur, type, vol){
  if (!AC || muted) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type||"sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(vol||0.12, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(); o.stop(AC.currentTime + dur);
}
function ding(){ tone(880,.15); setTimeout(()=>tone(1320,.2),110); }
function buzz(){ tone(130,.3,"square",.08); }
function whoosh(){ tone(300,.4,"sawtooth",.05); setTimeout(()=>tone(520,.3,"sawtooth",.04),120); }
function sirenStart(){
  if (!AC || muted || sirenOsc) return;
  sirenOsc = AC.createOscillator(); const g = AC.createGain();
  g.gain.value = .045; sirenOsc.type = "triangle"; sirenOsc.frequency.value = 700;
  sirenOsc.connect(g); g.connect(AC.destination); sirenOsc.start();
  let hi = true;
  sirenInt = setInterval(()=>{ if (sirenOsc) sirenOsc.frequency.value = (hi=!hi) ? 700 : 500; }, 450);
}
function sirenStop(){
  if (sirenInt) clearInterval(sirenInt), sirenInt = null;
  if (sirenOsc) { try{sirenOsc.stop();}catch(e){} sirenOsc = null; }
}

/* ---------- top buttons ---------- */
document.getElementById("muteBtn").addEventListener("click", () => {
  muted = !muted;
  document.getElementById("muteBtn").textContent = muted ? "🔇" : "🔊";
  if (muted) sirenStop();
});
function toggleView(){
  S.view = S.view === "top" ? "fp" : "top";
  save.view = S.view; persist();
  document.getElementById("viewBtn").textContent = S.view === "top" ? "👁 View" : "🚁 View";
}
document.getElementById("viewBtn").addEventListener("click", toggleView);
document.getElementById("mapBtn").addEventListener("click", () => { save.minimap = !save.minimap; persist(); });
document.getElementById("viewBtn").textContent = S.view === "top" ? "👁 View" : "🚁 View";

/* ---------- input ---------- */
const KEYMAP = {
  ArrowLeft:"left", a:"left", A:"left",
  ArrowRight:"right", d:"right", D:"right",
  ArrowUp:"go", w:"go", W:"go",
  ArrowDown:"stop", s:"stop", S:"stop", " ":"stop",
};
addEventListener("keydown", e => {
  ensureAudio();
  if ((e.key === "v" || e.key === "V") && !e.repeat) { toggleView(); return; }
  if ((e.key === "m" || e.key === "M") && !e.repeat) { save.minimap = !save.minimap; persist(); return; }
  const k = KEYMAP[e.key];
  if (k) { input[k] = true; if (S.screen === "playing") e.preventDefault(); }
});
addEventListener("keyup", e => { const k = KEYMAP[e.key]; if (k) input[k] = false; });
function bindTouch(id, key){
  const el = document.getElementById(id);
  const on  = e => { e.preventDefault(); ensureAudio(); input[key] = true; };
  const off = e => { e.preventDefault(); input[key] = false; };
  el.addEventListener("pointerdown", on);
  el.addEventListener("pointerup", off);
  el.addEventListener("pointercancel", off);
  el.addEventListener("pointerleave", off);
}
bindTouch("btnL","left"); bindTouch("btnR","right");
bindTouch("btnGo","go"); bindTouch("btnStop","stop");

/* ---------- helpers ---------- */
function toast(text, color){ S.toasts.push({ text, color: color||"#2d6a4f", t:1.8 }); }
function setBanner(text){ S.banner = { text, until: S.time + 4 }; }
function lightPhase(ev){
  const c = (S.time + ev.offset) % 11;
  return c < 4.5 ? "green" : c < 6 ? "yellow" : "red";
}
function currentLimit(){
  let lim = S.cfg.base;
  for (const ev of S.events)
    if ((ev.type === "school" || ev.type === "festival" || ev.type === "construction")
        && S.t >= ev.from - 350 && S.t <= ev.to) lim = Math.min(lim, ev.limit);
  return lim;
}

/* ---------- screens ---------- */
const SCREENS = ["menu","intro","tip","quiz","cert","retry"];
function show(id){
  for (const s of SCREENS) document.getElementById(s).classList.toggle("hidden", s !== id);
  document.getElementById("touch").classList.toggle("hidden",
    !(id === null && ("ontouchstart" in window)));
}

/* ============================================================
   EVENT GENERATION from the real route landmarks
   ============================================================ */
function genEvents(li){
  const cfg = CFG[li], rt = ROUTES[li], len = rt.len;
  const evs = [], busy = [[0,560],[len-160,len+400]];
  const overlaps = (a,b) => busy.some(([x,y]) => a < y && b > x);
  const take = (a,b) => busy.push([a,b]);

  // school zones at the real schools on this route (often the destination!)
  for (const m of rt.marks){
    if (m.kind !== "school") continue;
    if (m.d < 1000) continue;
    const from = Math.max(580, m.d - 1000), to = Math.min(len - 320, m.d + 650);
    if (to - from < 500 || overlaps(from - 150, to + 150)) continue;
    evs.push({ type:"school", from, to, limit:15, label:m.name });
    evs.push({ type:"kids", at: clamp(m.d, from + 220, to - 220), count:3 });
    take(from - 200, to + 200);
  }
  // crosswalks at parks along the way
  for (const m of rt.marks){
    if (m.kind !== "park" || m.d < 750 || m.d > len - 950) continue;
    const d = m.d - 120;
    if (overlaps(d - 280, d + 280)) continue;
    evs.push({ type:"kids", at:d, count:2 });
    take(d - 320, d + 320);
  }
  // festival at the destination
  if (cfg.festival){
    const to = len - 800, from = Math.max(620, to - 1450);
    if (!overlaps(from - 200, to + 200)){
      evs.push({ type:"festival", from, to, limit:10, label:cfg.festName });
      take(from - 260, to + 260);
    }
  }
  // construction
  for (let c = 0; c < cfg.constr; c++){
    for (let s = len * .3; s < len - 1400; s += 140){
      if (overlaps(s - 240, s + 1140)) continue;
      evs.push({ type:"construction", from:s, to:s + 900, limit:10,
                 lane: Math.floor(hash(s) * cfg.lanes) });
      take(s - 280, s + 1180);
      break;
    }
  }
  // emergencies — triggered near the real fire station if it's on the route
  let placed = 0;
  for (const m of rt.marks){
    if (placed >= cfg.emerg) break;
    if (m.kind === "fire" && m.d > 1400 && m.d < len - 1700 && !overlaps(m.d - 700, m.d + 950)){
      evs.push({ type:"emergency", at:m.d }); take(m.d - 700, m.d + 950); placed++;
    }
  }
  for (const fr of [.5, .76]){
    if (placed >= cfg.emerg) break;
    for (let d = len * fr; d < len - 1700; d += 160){
      if (overlaps(d - 700, d + 950)) continue;
      evs.push({ type:"emergency", at:d }); take(d - 700, d + 950); placed++;
      break;
    }
  }
  // lights & stop signs in the gaps
  const place = (type, frac) => {
    for (let k = 0; k < 26; k++){
      const d = len * frac + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 110;
      if (d < 620 || d > len - 380 || overlaps(d - 340, d + 270)) continue;
      evs.push(type === "light" ? { type, at:d, offset: Math.floor(hash(d) * 11) } : { type, at:d });
      take(d - 340, d + 270);
      return;
    }
  };
  [.22, .46, .7, .9].slice(0, cfg.lights).forEach(f => place("light", f));
  [.14, .6, .84].slice(0, cfg.stops).forEach(f => place("stopsign", f));
  // monster truck bumps!
  if (cfg.bumps){
    for (let d = 760; d < len - 760; d += 300){
      if (overlaps(d - 140, d + 140)) continue;
      evs.push({ type:"bump", at:d, lat: laneCFor(cfg, Math.floor(hash(d * 3) * cfg.lanes)) });
      take(d - 150, d + 150);
    }
  }
  evs.sort((a, b) => (a.at ?? a.from) - (b.at ?? b.from));
  return evs;
}
function laneCFor(cfg, i){ return -(cfg.lanes * LANE_W / 2) + LANE_W * (i + .5); }

function genHouses(li){
  const rt = ROUTES[li], cfg = CFG[li], HW = cfg.lanes * LANE_W / 2;
  const out = [];
  for (let d = 620; d < rt.len - 420; d += 215){
    for (const side of [-1, 1]){
      const h = hash(d * .013 + side * 7);
      if (h > .82) continue;
      if (rt.marks.some(m => Math.abs(m.d - d) < 330 && m.side === side)) continue;
      out.push({ d: d + (h - .5) * 60, lat: side * (HW + 92 + h * 30),
                 kind: h < .42 ? "house" : h < .68 ? "tree" : "bush", v: hash(d + side * 31) });
    }
  }
  return out;
}

/* ---------- run setup ---------- */
function initEvent(e, cfg){
  const ev = Object.assign({}, e);
  ev.resolved = false;
  if (ev.type === "stopsign") ev.fullStop = false;
  if (ev.type === "light")    ev.waited = false;
  if (ev.type === "kids" || ev.type === "festival") { ev.kids = null; ev.waited = false; ev.cwDone = false; }
  if (ev.type === "school" || ev.type === "festival" || ev.type === "construction"){
    ev.over = 0; ev.warned = false; ev.penalized = false;
  }
  if (ev.type === "construction"){
    ev.cones = [];
    for (let w = ev.from + 140; w < ev.to - 60; w += 130)
      ev.cones.push({ w, hit:false, jitter:(hash(w) - .5) * 14 });
  }
  if (ev.type === "emergency"){ ev.spawned = false; ev.bad = 0; }
  return ev;
}
function openIntro(i){
  S.li = i; S.veh = VEHICLES[i]; S.cfg = CFG[i]; S.rt = ROUTES[i];
  document.getElementById("introTitle").textContent = `Level ${i+1}: ${S.cfg.title}`;
  document.getElementById("introRoute").textContent = `📍 ${S.rt.name} • real Mountain House streets`;
  const types = [...new Set(genEvents(i).map(e => e.type))];
  const RL = {
    light:"🚦 Stop at red lights", stopsign:"🛑 FULL stop at stop signs",
    kids:"🚸 Stop for people in crosswalks", school:"🏫 15 mph in school zones",
    construction:"🚧 Slow down, don't hit cones", emergency:"🚑 Siren? Pull RIGHT & stop",
    festival:"🎪 Event crowd — crawl & yield",
    bump:"🛻 Hit ramps FAST for Big Air points (closed course — marshals on duty!)",
  };
  document.getElementById("introRules").innerHTML =
    `<div class="rule">⚡ Speed limit: ${S.cfg.base} mph (lower in special zones)</div>` +
    types.map(t => `<div class="rule">${RL[t]}</div>`).join("") +
    (S.cfg.bumps ? `<div class="rule">⚠️ Jumps are ONLY ok at closed events like this — never on open streets!</div>` : "") +
    `<div class="rule">🎯 <b>Goal:</b> Safety Score 70+ at the finish earns your certificate!</div>` +
    `<div class="rule" style="font-size:11px;opacity:.7;margin-top:6px">🛰 Real aerial imagery: USDA NAIP (public domain) • streets © OpenStreetMap</div>`;
  drawIntroMap(i);
  loadAerial(i);            // preload the real aerial so the run starts crisp
  S.screen = "intro";
  show("intro");
}
function beginRun(){
  S.t = 24; S.speed = 0; S.score = 100; S.time = 0;
  S.amb = null; S.toasts = []; S.banner = null; S.shake = 0;
  S.speedTimer = 0; S.quizBonus = 0; S.air = null; S.airPts = 0;
  S.events = genEvents(S.li).map(e => initEvent(e, S.cfg));
  S.o = laneC(S.cfg.lanes - 1);
  S.houses = genHouses(S.li);
  S.mm = buildMinimap(S.li);
  loadAerial(S.li);
  sirenStop();
  S.screen = "playing";
  show(null);
  setBanner(`${S.veh.emoji} ${S.rt.streets[0][1]} — ride safely!`);
}

/* ---------- violations & bonuses ---------- */
function violation(key){
  const v = TIPS[key];
  S.score = Math.max(0, S.score - v.pts);
  buzz(); S.shake = 10;
  document.getElementById("tipIcon").textContent = v.icon;
  document.getElementById("tipTitle").textContent = v.title;
  document.getElementById("tipText").textContent = v.text;
  document.getElementById("tipPts").textContent = `−${v.pts} Safety Points (Score: ${S.score})`;
  S.screen = "tip";
  show("tip");
}
document.getElementById("tipBtn").addEventListener("click", () => {
  if (S.score <= 0){ showRetry("Too many oopsies this time — and that's OK! Every safety hero practices. Let's ride it again, nice and careful."); return; }
  S.screen = "playing";
  show(null);
});
function bonus(pts, msg){ S.score = Math.min(100, S.score + pts); ding(); toast(`${msg} +${pts}`); }

/* ============================================================
   SIMULATION
   ============================================================ */
function update(dt){
  S.time += dt;
  const v = S.veh;

  // jump physics
  if (S.air){
    S.air.p += dt / S.air.dur;
    if (S.air.p >= 1){ S.air = null; bonus(3, "Big Air! Clean landing!"); S.airPts += 3; }
  }
  // speed
  if (!S.air){
    if (input.go)        S.speed += v.accel * dt;
    else if (input.stop) S.speed -= v.brake * dt;
    else                 S.speed -= 4 * dt;
  }
  S.speed = clamp(S.speed, 0, v.max);

  // steering
  const steer = 230 * dt * (S.air ? .25 : 1);
  if (input.left)  S.o -= steer;
  if (input.right) S.o += steer;
  S.o = clamp(S.o, -HWf() + v.w/2 + 5, HWf() - v.w/2 - 5);

  S.t += S.speed * PXMPH * dt;

  // speeding (general)
  const lim = currentLimit();
  if (S.speed > lim + 3){
    S.speedTimer += dt;
    if (S.speedTimer > 1){ S.speedTimer = 0; S.score = Math.max(0, S.score - 1); toast("Slow down! −1", "#d62828"); }
  } else S.speedTimer = 0;

  for (const ev of S.events) updateEvent(ev, dt);
  if (S.amb) updateAmb(dt);

  for (const t of S.toasts) t.t -= dt;
  S.toasts = S.toasts.filter(t => t.t > 0);
  if (S.shake > 0) S.shake = Math.max(0, S.shake - 40 * dt);

  if (S.score <= 0 && S.screen === "playing"){
    showRetry("Too many oopsies this time — and that's OK! Every safety hero practices. Let's ride it again, nice and careful.");
    return;
  }
  if (S.screen === "playing" && S.t > S.rt.len + 50) startQuiz();
}

function updateEvent(ev, dt){
  const t = S.t, HW = HWf();
  switch (ev.type){

    case "stopsign": {
      if (ev.resolved) break;
      if (t > ev.at - 280 && t < ev.at - 8 && S.speed < .4) ev.fullStop = true;
      if (t >= ev.at - 8){
        ev.resolved = true;
        if (ev.fullStop) bonus(5, "Perfect stop!");
        else violation("stopsign");
      }
      break;
    }
    case "light": {
      if (ev.resolved) break;
      const ph = lightPhase(ev);
      if (ph === "red" && t > ev.at - 320 && t < ev.at - 8 && S.speed < .5) ev.waited = true;
      if (t >= ev.at - 6){
        ev.resolved = true;
        if (ph === "red") violation("redlight");
        else if (ev.waited) bonus(5, "Waited for green!");
      }
      break;
    }
    case "kids":
    case "festival": {
      const isFest = ev.type === "festival";
      const cw = isFest ? (ev.from + ev.to) / 2 : ev.at;
      if (isFest) zoneSpeed(ev, dt, "festSpeed");

      if (!ev.kids && t > cw - 780){
        ev.kids = [];
        const n = isFest ? 6 : (ev.count || 2);
        for (let i = 0; i < n; i++){
          const dir = isFest ? (i % 2 ? -1 : 1) : 1;
          ev.kids.push({
            lat: dir === 1 ? -HW - 46 - i * 14 : HW + 46 + i * 14,
            dir, spd: isFest ? 42 + hash(cw + i) * 14 : 58 + hash(cw + i) * 16,
            delay: .4 + i * (isFest ? .8 : .6), done:false,
          });
        }
      }
      if (!ev.kids) break;
      for (const k of ev.kids){
        if (k.done) continue;
        if (k.delay > 0){ k.delay -= dt; continue; }
        k.lat += k.dir * k.spd * dt;
        if ((k.dir === 1 && k.lat > HW + 48) || (k.dir === -1 && k.lat < -HW - 48)) k.done = true;
      }
      const occupied = ev.kids.some(k => !k.done && k.delay <= 0 && k.lat > -HW - 12 && k.lat < HW + 12);
      if (occupied && S.speed < .5 && t > cw - 400 && t < cw) ev.waited = true;

      if (!ev.cwDone && Math.abs(cw - t) < 34 && occupied){
        for (const k of ev.kids){
          if (!k.done && k.delay <= 0 && Math.abs(k.lat - S.o) < 28){
            ev.penalized = true;
            violation("hitPed");
            S.speed = 0;
            S.t = Math.max(40, cw - 180);
            return;
          }
        }
      }
      if (!ev.cwDone && t >= cw + 24){
        ev.cwDone = true;
        if (!isFest) ev.resolved = true;   // festival zone stays live until zoneExit
        if (occupied){ ev.penalized = true; violation("yield"); }
        else if (ev.waited) bonus(6, "You waited — kind & safe!");
      }
      break;
    }
    case "school": zoneSpeed(ev, dt, "schoolSpeed"); zoneExit(ev, "Safe through the school zone!"); break;
    case "construction": {
      zoneSpeed(ev, dt, "zoneSpeed");
      const cx = laneC(ev.lane);
      for (const c of ev.cones){
        if (c.hit) continue;
        if (Math.abs(c.w - t) < 38 && Math.abs(cx + c.jitter - S.o) < S.veh.w/2 + 13){
          c.hit = true; ev.penalized = true;
          S.score = Math.max(0, S.score - 4); S.speed = Math.min(S.speed, 4); S.shake = 8; buzz();
          if (!ev.coneWarned){ ev.coneWarned = true; violation("cone"); S.score = Math.min(100, S.score + TIPS.cone.pts - 4); }
          else toast("Hit a cone! −4", "#d62828");
        }
      }
      zoneExit(ev, "Work zone done — nice driving!");
      break;
    }
    case "emergency": {
      if (!ev.spawned && t >= ev.at){
        ev.spawned = true;
        S.amb = { w: t - 650, lat: laneC(0), mph: S.veh.max + 8, ev };
        setBanner("🚑 SIREN! Pull to the RIGHT lane and STOP!");
        sirenStart();
      }
      break;
    }
    case "bump": {
      if (ev.resolved) break;
      if (Math.abs(ev.at - t) < 26 && Math.abs(ev.lat - S.o) < LANE_W * .62){
        ev.resolved = true;
        if (S.speed > 16){ S.air = { p:0, dur:.55 + S.speed / 70 }; whoosh(); toast("AIR TIME! 🛻", "#9b5de5"); }
        else toast("Too slow for air — that's ok!", "#888");
      } else if (t > ev.at + 30) ev.resolved = true;
      break;
    }
  }
  if (ev.type === "festival") zoneExit(ev, "You kept everyone at the event safe!");
}
function zoneSpeed(ev, dt, tipKey){
  if (S.t < ev.from || S.t > ev.to) return;
  if (S.speed > ev.limit + 1.5){
    ev.over += dt;
    if (!ev.warned && ev.over > .6){ ev.warned = true; ev.penalized = true; violation(tipKey); }
    else if (ev.warned && ev.over > 1.2){ ev.over = .61; S.score = Math.max(0, S.score - 2); toast("Still too fast! −2", "#d62828"); }
  } else ev.over = Math.min(ev.over, .5);
}
function zoneExit(ev, msg){
  if (!ev.resolved && S.t > ev.to + 20){ ev.resolved = true; if (!ev.penalized) bonus(6, msg); }
}
function updateAmb(dt){
  const a = S.amb;
  a.w += a.mph * PXMPH * dt;
  const active = a.w > S.t - 520 && a.w < S.t + 120;
  // must be in the right lane AND clear of the ambulance's path (collision box is 42px)
  const compliant = S.o >= HWf() - LANE_W && S.o >= a.lat + 44 && S.speed < 6;
  if (active && !compliant) a.ev.bad += dt;
  if (Math.abs(a.w - S.t) < 58 && Math.abs(a.lat - S.o) < 42 && !a.ev.resolved){
    a.ev.resolved = true;
    violation("emergency");
    S.speed = 0; a.w = S.t + 90;
  }
  if (!a.ev.resolved && a.w > S.t + 140){
    a.ev.resolved = true;
    if (a.ev.bad < .8) bonus(8, "You pulled over — hero move!");
    else violation("emergency");
  }
  if (a.w > S.t + 800){ S.amb = null; sirenStop(); }
}

/* ============================================================
   CAMERA + WORLD→SCREEN (top-down)
   ============================================================ */
function setCam(){
  cam = sample(S.rt, S.t);
}
function w2s(wx, wy){
  const dx = wx - cam.x, dy = wy - cam.y;
  return [260 + dx * cam.rx + dy * cam.ry, PLAYER_Y - (dx * cam.fx + dy * cam.fy)];
}
function routePt(d, lat){
  const s = sample(S.rt, d);
  const wx = s.x + s.rx * lat, wy = s.y + s.ry * lat;
  const p = w2s(wx, wy);
  const rot = Math.atan2(s.fx * cam.rx + s.fy * cam.ry, s.fx * cam.fx + s.fy * cam.fy);
  return { x: p[0], y: p[1], rot };
}
const worldRot = () => Math.atan2(-cam.fx, cam.rx);

/* ============================================================
   TOP-DOWN RENDERER (real map!)
   ============================================================ */
/* Drape the real aerial photo onto the ground using the same camera transform
   as everything else. The image→world mapping is a uniform affine (image is in
   lat/lon, world is a local ENU approximation — both linear), so one transformed
   drawImage places it perfectly, rotating & panning with the camera. */
function drawAerialGround(){
  if (!HAS_AERIAL) return false;
  const rec = AERIAL[S.li], img = aerialImg[S.li];
  if (!rec || !img || img === false || !img.complete || !img.naturalWidth) return false;
  const sxx = rec.w / img.naturalWidth, syy = rec.h / img.naturalHeight;
  const a = sxx * cam.rx, b = -sxx * cam.fx, c = syy * cam.ry, d = -syy * cam.fy;
  const e = 260 + (rec.x0 - cam.x) * cam.rx + (rec.y0 - cam.y) * cam.ry;
  const f = PLAYER_Y - ((rec.x0 - cam.x) * cam.fx + (rec.y0 - cam.y) * cam.fy);
  ctx.save();
  ctx.transform(a, b, c, d, e, f);         // composes with the shake translate
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  return true;
}

function drawTop(){
  const TH = THEMES[S.li], HW = HWf();
  const shx = S.shake ? (Math.random() - .5) * S.shake : 0;
  ctx.save();
  ctx.translate(shx, 0);

  // grass (base — covered by aerial when available)
  ctx.fillStyle = TH.g1;
  ctx.fillRect(-10, -10, W + 20, H + 20);

  // real aerial photo of Mountain House, draped via the camera transform
  const onAerial = drawAerialGround();

  const inView = b => {
    // bbox vs camera circle (radius covers screen diagonal)
    const cxm = clamp(cam.x, b[0], b[2]), cym = clamp(cam.y, b[1], b[3]);
    return (cxm - cam.x) ** 2 + (cym - cam.y) ** 2 < 1100 * 1100;
  };
  const poly = p => {
    ctx.beginPath();
    for (let i = 0; i < p.length; i += 2){
      const q = w2s(p[i], p[i+1]);
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
  };

  // illustrated map layers — only when there's no real aerial under us
  if (!onAerial){
    // parks, schools, water
    for (const pk of MAPP){ if (!inView(pk.b)) continue;
      poly(pk.p); ctx.closePath();
      ctx.fillStyle = "#a8d796"; ctx.fill();
      ctx.strokeStyle = "#8cc084"; ctx.lineWidth = 3; ctx.stroke();
    }
    for (const sc of MAPS){ if (!inView(sc.b)) continue;
      poly(sc.p); ctx.closePath();
      ctx.fillStyle = "#eedcba"; ctx.fill();
      ctx.strokeStyle = "#d9c193"; ctx.lineWidth = 3; ctx.stroke();
    }
    for (const wt of MAPW){ if (!inView(wt.b)) continue;
      poly(wt.p);
      if (wt.a){ ctx.closePath(); ctx.fillStyle = "#8ecdf2"; ctx.fill(); }
      else { ctx.strokeStyle = "#8ecdf2"; ctx.lineWidth = 26; ctx.lineCap = "round"; ctx.stroke(); }
    }
    // all real streets (casing + fill)
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const RW = { hwy:74, major:62, minor:52, res:42 };
    for (const rd of MAPR){ if (!inView(rd.b)) continue;
      poly(rd.p);
      ctx.strokeStyle = "#4a4f55"; ctx.lineWidth = RW[rd.c] + 7; ctx.stroke();
      ctx.strokeStyle = rd.c === "hwy" ? "#71757c" : "#6d727a"; ctx.lineWidth = RW[rd.c]; ctx.stroke();
    }
  }
  ctx.lineCap = "round"; ctx.lineJoin = "round";

  /* --- the route road (gameplay road) --- */
  const i0 = Math.max(0, Math.floor((S.t - 300) / DS));
  const i1 = Math.min(S.rt.n - 1, Math.ceil((S.t + 1020) / DS));
  const P = [], RT = [];
  for (let i = i0; i <= i1; i++){
    const q = w2s(S.rt.sx[i], S.rt.sy[i]);
    P.push(q);
    RT.push([-Math.sin(S.rt.hd[i]), Math.cos(S.rt.hd[i])]); // world right vec
  }
  const path = pts => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); };
  // over aerial: translucent so the real asphalt shows through, but lanes stay crisp
  path(P); ctx.strokeStyle = onAerial ? "rgba(44,48,56,.55)" : "#3d4248"; ctx.lineWidth = HW * 2 + 26; ctx.stroke();
  path(P); ctx.strokeStyle = onAerial ? "rgba(78,84,94,.5)"  : "#585e66"; ctx.lineWidth = HW * 2; ctx.stroke();

  // zone tints painted on the road
  for (const ev of S.events){
    if (!(ev.type === "school" || ev.type === "construction" || ev.type === "festival")) continue;
    const a = Math.max(i0, Math.floor(ev.from / DS)), b = Math.min(i1, Math.ceil(ev.to / DS));
    if (a >= b) continue;
    ctx.beginPath();
    for (let i = a; i <= b; i++){
      const q = P[i - i0];
      i === a ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]);
    }
    ctx.strokeStyle = ev.type === "school" ? "rgba(255,210,63,.18)" :
                      ev.type === "construction" ? "rgba(247,127,0,.20)" : "rgba(255,112,166,.16)";
    ctx.lineWidth = HW * 2; ctx.stroke();
  }

  // edge lines
  for (const sgn of [-1, 1]){
    ctx.beginPath();
    for (let i = i0; i <= i1; i++){
      const k = i - i0;
      const wx = S.rt.sx[i] + RT[k][0] * sgn * (HW - 5);
      const wy = S.rt.sy[i] + RT[k][1] * sgn * (HW - 5);
      const q = w2s(wx, wy);
      k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.stroke();
  }
  // lane dashes
  ctx.setLineDash([26, 26]);
  ctx.lineDashOffset = -((i0 * DS) % 52);
  for (let l = 1; l < S.cfg.lanes; l++){
    const lat = -HW + l * LANE_W;
    ctx.beginPath();
    for (let i = i0; i <= i1; i++){
      const k = i - i0;
      const q = w2s(S.rt.sx[i] + RT[k][0] * lat, S.rt.sy[i] + RT[k][1] * lat);
      k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.setLineDash([]);

  if (!onAerial) drawHousesTop();        // aerial already shows the real houses
  drawPoiLabels();
  for (const ev of S.events) drawEventTop(ev);
  drawFinishTop();
  if (S.amb && S.amb.w > S.t - 700) drawAmbTop();
  drawPlayerTop();
  ctx.restore();
}

function sprite(d, lat, fn){
  const p = routePt(d, lat);
  if (p.y < -160 || p.y > H + 120 || p.x < -160 || p.x > W + 160) return;
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
  fn();
  ctx.restore();
}
const HOUSE_COLORS = ["#e8985f","#dec06a","#8fb86d","#e08e86","#9fcfd1","#bfa8d4"];
function drawHousesTop(){
  for (const hsec of S.houses){
    if (hsec.d < S.t - 300 || hsec.d > S.t + 1000) continue;
    sprite(hsec.d, hsec.lat, () => {
      if (hsec.kind === "house"){
        const c = HOUSE_COLORS[Math.floor(hsec.v * 6)];
        ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(-24, -16, 52, 40);  // shadow
        ctx.fillStyle = c; ctx.fillRect(-27, -19, 52, 40);
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(-27, -19, 52, 7); // roof ridge light
        ctx.strokeStyle = "rgba(0,0,0,.22)"; ctx.lineWidth = 2; ctx.strokeRect(-27, -19, 52, 40);
        ctx.beginPath(); ctx.moveTo(-27, 1); ctx.lineTo(25, 1); ctx.stroke();
      } else if (hsec.kind === "tree"){
        ctx.fillStyle = "rgba(0,0,0,.16)"; ctx.beginPath(); ctx.arc(4, 4, 17, 0, 7); ctx.fill();
        ctx.fillStyle = "#3c8c4f"; ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.fill();
        ctx.fillStyle = "#55a86a"; ctx.beginPath(); ctx.arc(-4, -4, 10, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = "#67b26f"; ctx.beginPath(); ctx.arc(-6, 0, 9, 0, 7); ctx.arc(5, -2, 10, 0, 7); ctx.fill();
      }
    });
  }
}
const POI_ICON = { school:"🏫", park:"🌳", townhall:"🏛", library:"📚", fire:"🚒", civic:"🏢" };
function drawPoiLabels(){
  ctx.textAlign = "center";
  for (const p of POIS){
    const dx = p.x - cam.x, dy = p.y - cam.y;
    if (dx * dx + dy * dy > 760 * 760) continue;
    const q = w2s(p.x, p.y);
    if (q[0] < -40 || q[0] > W + 40 || q[1] < -20 || q[1] > H + 20) continue;
    // civic buildings get a footprint
    if (p.k === "townhall" || p.k === "library" || p.k === "fire"){
      ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(worldRot());
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(-26, -18, 56, 42);
      ctx.fillStyle = p.k === "fire" ? "#d65f5f" : "#cdb89a";
      ctx.fillRect(-30, -22, 56, 42);
      ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 2; ctx.strokeRect(-30, -22, 56, 42);
      ctx.restore();
    }
    const text = POI_ICON[p.k] + " " + p.n;
    ctx.font = "bold 11px sans-serif";
    const w = ctx.measureText(text).width + 12;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    rounded(q[0] - w/2, q[1] + 14, w, 17, 7); ctx.fill();
    ctx.fillStyle = "#1d3461"; ctx.fillText(text, q[0], q[1] + 26.5);
  }
}

function drawEventTop(ev){
  const HW = HWf(), t = S.t;
  const vis = d => d > t - 300 && d < t + 1000;
  switch (ev.type){
    case "stopsign": {
      if (!vis(ev.at)) break;
      sprite(ev.at - 20, 0, () => stopLineT(HW));
      sprite(ev.at, HW + 30, () => {
        ctx.fillStyle = "#999"; ctx.fillRect(-2, -2, 4, 6);
        ctx.fillStyle = "#d62828";
        ctx.beginPath();
        for (let i = 0; i < 8; i++){
          const a = Math.PI / 8 + i * Math.PI / 4;
          const px = Math.cos(a) * 15, py = Math.sin(a) * 15;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("STOP", 0, 3);
      });
      break;
    }
    case "light": {
      if (!vis(ev.at)) break;
      sprite(ev.at - 20, 0, () => stopLineT(HW));
      const ph = lightPhase(ev);
      sprite(ev.at, HW + 32, () => {
        ctx.fillStyle = "#222"; rounded(-10, -26, 20, 50, 5); ctx.fill();
        ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke();
        const cols = { red:"#ff3b30", yellow:"#ffd23f", green:"#34c759" };
        ["red","yellow","green"].forEach((c, i) => {
          ctx.fillStyle = ph === c ? cols[c] : "#444";
          ctx.beginPath(); ctx.arc(0, -17 + i * 16, 6, 0, 7); ctx.fill();
          if (ph === c){ ctx.fillStyle = cols[c] + "55"; ctx.beginPath(); ctx.arc(0, -17 + i * 16, 10, 0, 7); ctx.fill(); }
        });
      });
      break;
    }
    case "kids": {
      if (vis(ev.at)) crosswalkT(ev.at, ev);
      if (vis(ev.at - 380)) warnT(ev.at - 380, "🚸");
      break;
    }
    case "school": {
      if (vis(ev.from - 350)) warnT(ev.from - 350, "🏫");
      if (vis(ev.from + 60))  roadTextT(ev.from + 60, "SCHOOL ZONE " + ev.limit);
      if (vis(ev.to))         roadTextT(ev.to, "END SCHOOL ZONE");
      break;
    }
    case "festival": {
      if (vis(ev.from - 350)) warnT(ev.from - 350, "🎪");
      if (vis(ev.from)) sprite(ev.from, 0, () => buntingT(HW, ev.label));
      for (let w = ev.from + 140; w < ev.to; w += 190){
        if (!vis(w)) continue;
        const side = (Math.floor(w / 190) % 2 ? -1 : 1) * (HW + 42);
        sprite(w, side, () => balloonT(hash(w)));
      }
      crosswalkT((ev.from + ev.to) / 2, ev);
      break;
    }
    case "construction": {
      if (vis(ev.from - 350)) warnT(ev.from - 350, "🚧");
      if (vis(ev.from + 70)) sprite(ev.from + 70, laneC(ev.lane), () => {
        ctx.fillStyle = "#f77f00"; rounded(-32, -8, 64, 15, 4); ctx.fill();
        ctx.fillStyle = "#fff";
        for (let i = 0; i < 4; i++) ctx.fillRect(-28 + i * 16, -5, 8, 9);
      });
      for (const c of ev.cones){
        if (c.hit || !vis(c.w)) continue;
        sprite(c.w, laneC(ev.lane) + c.jitter, () => {
          ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.beginPath(); ctx.arc(2, 2, 8, 0, 7); ctx.fill();
          ctx.fillStyle = "#f77f00"; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
          ctx.fillStyle = "#f77f00"; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 7); ctx.fill();
        });
      }
      if (vis(ev.from + 160)) sprite(ev.from + 160, HW + 26, () => {
        ctx.fillStyle = "#f48c06"; ctx.fillRect(-6, -8, 12, 16);
        ctx.fillStyle = "#ffba08"; ctx.beginPath(); ctx.arc(0, -12, 6, 0, 7); ctx.fill();
      });
      break;
    }
    case "bump": {
      if (!vis(ev.at)) break;
      sprite(ev.at, ev.lat, () => {
        ctx.fillStyle = "#7a5230"; rounded(-LANE_W * .52, -12, LANE_W * 1.04, 24, 10); ctx.fill();
        ctx.fillStyle = "#9b6b3f"; rounded(-LANE_W * .52, -12, LANE_W * 1.04, 10, 8); ctx.fill();
        ctx.fillStyle = "#ffd23f"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("◣ RAMP ◢", 0, 4);
      });
      break;
    }
  }
}
function stopLineT(HW){ ctx.fillStyle = "#fff"; ctx.fillRect(-HW + 6, -3, HW * 2 - 12, 7); }
function crosswalkT(at, ev){
  const HW = HWf();
  sprite(at, 0, () => {
    ctx.fillStyle = "#e9e9e9";
    for (let x = -HW + 8; x < HW - 8; x += 20) ctx.fillRect(x, -16, 12, 32);
  });
  if (ev && ev.kids) for (const k of ev.kids){
    if (k.done || k.delay > 0) continue;
    sprite(at, k.lat, () => drawKidT(k));
  }
}
function drawKidT(k){
  const step = Math.sin(S.time * 9 + k.lat) * 3;
  ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.arc(2, 3, 9, 0, 7); ctx.fill();
  ctx.strokeStyle = "#444"; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-3 + step, 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, 5); ctx.lineTo(3 - step, 12); ctx.stroke();
  ctx.fillStyle = ["#e63946","#457b9d","#2a9d8f","#f4a261","#9b5de5","#ff70a6"][Math.floor(hash(k.lat * 3) * 6)];
  rounded(-6, -8, 12, 14, 4); ctx.fill();
  ctx.fillStyle = "#f1c9a5"; ctx.beginPath(); ctx.arc(0, -12, 5.5, 0, 7); ctx.fill();
}
function warnT(at, emoji){
  sprite(at, HWf() + 30, () => {
    ctx.save(); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#ffd23f"; ctx.strokeStyle = "#1d3461"; ctx.lineWidth = 2;
    ctx.fillRect(-12, -12, 24, 24); ctx.strokeRect(-12, -12, 24, 24);
    ctx.restore();
    ctx.font = "13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(emoji, 0, 5);
  });
}
function roadTextT(at, text){
  sprite(at, 0, () => {
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(text, 0, 4);
  });
}
function buntingT(HW, lbl){
  ctx.strokeStyle = "#888"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-HW - 14, -4); ctx.lineTo(-HW - 14, 4);
  ctx.moveTo(HW + 14, -4); ctx.lineTo(HW + 14, 4); ctx.stroke();
  const colors = ["#e63946","#ffd23f","#2a9d8f","#9b5de5","#ff70a6"];
  for (let i = 0; i < 9; i++){
    const fx = -HW - 4 + i * (HW * 2 + 8) / 8;
    ctx.fillStyle = colors[i % 5];
    ctx.beginPath(); ctx.moveTo(fx - 6, -2); ctx.lineTo(fx + 6, -2); ctx.lineTo(fx, 9); ctx.closePath(); ctx.fill();
  }
  ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
  const w = ctx.measureText(lbl).width + 12;
  ctx.fillStyle = "rgba(255,255,255,.92)"; rounded(-w/2, -28, w, 17, 7); ctx.fill();
  ctx.fillStyle = "#1d3461"; ctx.fillText(lbl, 0, -15.5);
}
function balloonT(r){
  const c = ["#e63946","#ffd23f","#2a9d8f","#9b5de5"][Math.floor(r * 4)];
  const bob = Math.sin(S.time * 2 + r * 9) * 3;
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(bob, 0, 8, 10, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.arc(bob - 2, -3, 3, 0, 7); ctx.fill();
}
function drawFinishTop(){
  if (S.rt.len > S.t + 1050) return;
  const HW = HWf();
  sprite(S.rt.len - 8, 0, () => {
    for (let x = -HW; x < HW; x += 13)
      for (let r = 0; r < 2; r++){
        ctx.fillStyle = ((Math.floor(x / 13) + r) % 2) ? "#111" : "#fff";
        ctx.fillRect(x, -13 + r * 13, 13, 13);
      }
    ctx.fillStyle = "#1d3461";
    ctx.fillRect(-HW - 14, -26, 10, 26); ctx.fillRect(HW + 4, -26, 10, 26);
    rounded(-HW - 14, -46, HW * 2 + 28, 24, 8); ctx.fill();
    ctx.fillStyle = "#ffd23f"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("🏁 FINISH 🏁", 0, -29);
  });
}
function drawAmbTop(){
  sprite(S.amb.w, S.amb.lat, () => {
    ctx.fillStyle = "rgba(0,0,0,.22)"; rounded(-19, -36, 42, 76, 8); ctx.fill();
    ctx.fillStyle = "#fff"; rounded(-21, -38, 42, 76, 8); ctx.fill();
    ctx.strokeStyle = "#ccc"; ctx.lineWidth = 1.5; rounded(-21, -38, 42, 76, 8); ctx.stroke();
    ctx.fillStyle = "#d62828";
    ctx.fillRect(-21, -6, 42, 11);
    ctx.fillRect(-4, -27, 9, 24); ctx.fillRect(-12, -19, 25, 9);
    ctx.fillStyle = "#9bd1ff"; rounded(-15, 22, 30, 11, 3); ctx.fill();
    const flash = Math.floor(S.time * 6) % 2;
    ctx.fillStyle = flash ? "#ff3b30" : "#3478f6"; ctx.fillRect(-15, -38, 11, 6);
    ctx.fillStyle = flash ? "#3478f6" : "#ff3b30"; ctx.fillRect(4, -38, 11, 6);
  });
}
function drawPlayerTop(){
  const v = S.veh;
  const airS = S.air ? 1 + .45 * Math.sin(Math.PI * S.air.p) : 1;
  ctx.save();
  ctx.translate(260 + S.o, PLAYER_Y);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,.25)";
  const so = S.air ? 10 * Math.sin(Math.PI * S.air.p) : 3;
  ctx.beginPath(); ctx.ellipse(so * .6, so, v.w * .55, v.h * .5, 0, 0, 7); ctx.fill();
  ctx.scale(airS, airS);
  if (v.id === "ev" || v.id === "car" || v.id === "monster"){
    const col = v.id === "ev" ? "#2a9d8f" : v.id === "car" ? "#4361ee" : "#7b2cbf";
    ctx.fillStyle = "#222";
    const wext = v.id === "monster" ? 9 : 4;
    const ww = 7 + (v.id === "monster" ? 4 : 0), wh = 15 + (v.id === "monster" ? 5 : 0);
    [[-v.w/2 - wext, -v.h/2 + 8],[v.w/2 + wext - ww, -v.h/2 + 8],[-v.w/2 - wext, v.h/2 - 22],[v.w/2 + wext - ww, v.h/2 - 22]]
      .forEach(([wx, wy]) => { rounded(wx, wy, ww, wh, 3); ctx.fill(); });
    ctx.fillStyle = col; rounded(-v.w/2, -v.h/2, v.w, v.h, 11); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.25)"; rounded(-v.w/2 + 3, -v.h/2 + 3, v.w - 6, 9, 5); ctx.fill();
    ctx.fillStyle = "#bde0fe"; rounded(-v.w/2 + 6, -v.h/2 + 11, v.w - 12, 13, 4); ctx.fill();
    ctx.fillStyle = "#0d1b2a33"; rounded(-v.w/2 + 6, -8, v.w - 12, v.h/2 - 6, 5); ctx.fill();
    ctx.fillStyle = "#bde0fe"; rounded(-v.w/2 + 7, v.h/2 - 24, v.w - 14, 10, 4); ctx.fill();
    ctx.fillStyle = "#fff8d6"; // headlights
    ctx.fillRect(-v.w/2 + 4, -v.h/2 - 1, 8, 4); ctx.fillRect(v.w/2 - 12, -v.h/2 - 1, 8, 4);
    if (v.id === "ev"){ ctx.fillStyle = "#fff"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center"; ctx.fillText("⚡", 0, 5); }
    if (v.id === "monster"){ ctx.fillStyle = "#ffd23f"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center"; ctx.fillText("MONSTER", 0, 5); }
  } else {
    ctx.fillStyle = "#333";
    ctx.beginPath(); ctx.ellipse(0, -v.h/2 + 7, 4.5, 8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, v.h/2 - 7, 4.5, 8, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = v.id === "scooter" ? "#9b5de5" : v.id === "ebike" ? "#f3722c" : "#e63946";
    ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -v.h/2 + 10); ctx.lineTo(0, v.h/2 - 10); ctx.stroke();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, -v.h/2 + 12); ctx.lineTo(10, -v.h/2 + 12); ctx.stroke();
    ctx.fillStyle = "#457b9d"; rounded(-8, -8, 16, 18, 6); ctx.fill();         // shoulders
    ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(0, -11, 7, 0, 7); ctx.fill(); // helmet
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(-2, -13, 2.5, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/* ============================================================
   FIRST-PERSON RENDERER (the thrill cam)
   ============================================================ */
function drawFP(){
  const TH = THEMES[S.li], HW = HWf();
  const N = 88;
  const jump = S.air ? 60 * Math.sin(Math.PI * S.air.p) : 0;
  const cwx = cam.x + cam.rx * S.o, cwy = cam.y + cam.ry * S.o;

  // --- sky ---
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, TH.skyT); sky.addColorStop(1, TH.skyB);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HORIZON + 2);
  // sun
  ctx.fillStyle = TH.sun; ctx.beginPath(); ctx.arc(412, 86, 34, 0, 7); ctx.fill();
  ctx.fillStyle = TH.sun + "55"; ctx.beginPath(); ctx.arc(412, 86, 48, 0, 7); ctx.fill();
  // Altamont hills + wind turbines, parallax with heading
  const hshift = (-cam.h * 260) % W;
  ctx.fillStyle = "#b9cf9c";
  for (let r = -1; r <= 1; r++){
    const ox = hshift + r * W;
    ctx.beginPath();
    ctx.moveTo(ox, HORIZON);
    ctx.quadraticCurveTo(ox + 110, HORIZON - 56, ox + 240, HORIZON - 14);
    ctx.quadraticCurveTo(ox + 360, HORIZON - 70, ox + 520, HORIZON - 8);
    ctx.lineTo(ox + 520, HORIZON); ctx.closePath(); ctx.fill();
  }
  for (let r = -1; r <= 1; r++){
    const ox = hshift + r * W;
    for (const tx of [120, 330, 455]) drawTurbineFP(ox + tx, HORIZON - (tx % 47) * .8 - 18);
  }

  // --- ground rows + road ---
  const rows = [];
  for (let j = 0; j <= N; j++){
    const d2 = S.t + 10 + j * DS;
    if (d2 > S.rt.len + 600) break;
    const s = sample(S.rt, Math.min(d2, S.rt.len - 1));
    const dx = s.x - cwx, dy = s.y - cwy;
    const fwd = dx * cam.fx + dy * cam.fy;
    if (fwd < 6) continue;
    const latr = dx * cam.rx + dy * cam.ry;
    const z = Z0 + fwd;
    const LF = (300 * Z0) / (HW * z);        // px per lateral unit
    rows.push({ d2, z, cx: 260 + latr * LF, sy: HORIZON + KY / z, hw: 300 * Z0 / z, LF });
  }
  // PASS 1: all grass bands (painted before any road so they can't smear over it)
  for (let j = rows.length - 1; j > 0; j--){
    const a = rows[j], b = rows[j - 1];
    ctx.fillStyle = (Math.floor(a.d2 / (DS * 2)) % 2) ? TH.g1 : TH.g2;
    ctx.fillRect(0, a.sy - 1, W, b.sy - a.sy + 2);
  }
  // grass + road between the nearest row and the bottom edge
  if (rows.length > 1){
    const a = rows[0], b = rows[1];
    if (a.sy < H){
      ctx.fillStyle = TH.g1; ctx.fillRect(0, a.sy - 1, W, H - a.sy + 1);
      const k = (H - a.sy) / Math.max(1, a.sy - b.sy);
      const cxB = a.cx + (a.cx - b.cx) * k, hwB = a.hw + (a.hw - b.hw) * k;
      quad(a.cx - a.hw, a.sy, a.cx + a.hw, a.sy, cxB + hwB, H, cxB - hwB, H, "#575d65");
    }
  }
  // PASS 2: road, far→near
  for (let j = rows.length - 1; j > 0; j--){
    const a = rows[j], b = rows[j - 1];
    const band = Math.floor(a.d2 / (DS * 2)) % 2;
    // road trapezoid
    let road = band ? "#5d636b" : "#575d65";
    for (const ev of S.events){
      if ((ev.type === "school" || ev.type === "construction" || ev.type === "festival")
          && a.d2 >= ev.from && a.d2 <= ev.to){
        road = ev.type === "school" ? (band ? "#6e6b52" : "#686549") :
               ev.type === "construction" ? (band ? "#6e5f4b" : "#685943") : (band ? "#6e5a64" : "#68545e");
      }
    }
    const by = b.sy + 1.5;   // extend the near edge under the next (nearer) quad to hide seams
    quad(a.cx - a.hw, a.sy, a.cx + a.hw, a.sy, b.cx + b.hw, by, b.cx - b.hw, by, road);
    // rumble edges
    const rum = band ? "#e63946" : "#fff";
    quad(a.cx - a.hw, a.sy, a.cx - a.hw * .93, a.sy, b.cx - b.hw * .93, by, b.cx - b.hw, by, rum);
    quad(a.cx + a.hw * .93, a.sy, a.cx + a.hw, a.sy, b.cx + b.hw, by, b.cx + b.hw * .93, by, rum);
    // lane lines
    if (band){
      for (let l = 1; l < S.cfg.lanes; l++){
        const lat = -HW + l * LANE_W;
        const ax = a.cx + lat * a.LF, bx = b.cx + lat * b.LF;
        quad(ax - a.hw * .012 - 1, a.sy, ax + a.hw * .012 + 1, a.sy,
             bx + b.hw * .012 + 1, b.sy, bx - b.hw * .012 - 1, b.sy, "#ffd23f");
      }
    }
    // crosswalks & stop lines painted on this row
    for (const ev of S.events){
      const cw = ev.type === "kids" ? ev.at : ev.type === "festival" ? (ev.from + ev.to) / 2 : null;
      if (cw !== null && Math.abs(cw - a.d2) < DS / 2){
        for (let m = -5; m < 5; m++){
          const lat = m * (HW / 5) + HW / 10;
          const ax = a.cx + lat * a.LF, bx = b.cx + lat * b.LF;
          quad(ax - 6 * a.LF, a.sy, ax + 6 * a.LF, a.sy, bx + 6 * b.LF, b.sy, bx - 6 * b.LF, b.sy, "#e9e9e9");
        }
      }
      if ((ev.type === "light" || ev.type === "stopsign") && Math.abs(ev.at - 20 - a.d2) < DS / 2)
        quad(a.cx - a.hw * .9, a.sy, a.cx + a.hw * .9, a.sy, b.cx + b.hw * .9, b.sy, b.cx - b.hw * .9, b.sy, "#fff");
    }
  }

  // --- sprites (far → near) ---
  const spr = [];
  const proj = (d, lat) => {
    const s = sample(S.rt, Math.min(d, S.rt.len - 1));
    const dx = s.x + s.rx * lat - cwx, dy = s.y + s.ry * lat - cwy;
    const fwd = dx * cam.fx + dy * cam.fy;
    if (fwd < 10 || fwd > N * DS) return null;
    const latr = dx * cam.rx + dy * cam.ry;
    const z = Z0 + fwd;
    const LF = (300 * Z0) / (HW * z);
    return { x: 260 + latr * LF, y: HORIZON + KY / z, sc: CAMD / z, LF, fwd };
  };
  const add = (d, lat, fn) => { const p = proj(d, lat); if (p) spr.push({ p, fn }); };

  for (const ev of S.events){
    if (ev.type === "stopsign") add(ev.at, HW + 36, p => fpStopSign(p));
    if (ev.type === "light")    add(ev.at, HW + 40, p => fpLight(p, lightPhase(ev)));
    if (ev.type === "kids" || ev.type === "festival"){
      const cw = ev.type === "kids" ? ev.at : (ev.from + ev.to) / 2;
      if (ev.kids) for (const k of ev.kids){
        if (k.done || k.delay > 0) continue;
        add(cw, k.lat, p => fpKid(p, k));
      }
      if (ev.type === "kids") add(ev.at - 380, HW + 36, p => fpWarn(p, "🚸"));
    }
    if (ev.type === "festival"){
      add(ev.from, 0, p => fpArch(p, ev.label));
      add(ev.from - 350, HW + 36, p => fpWarn(p, "🎪"));
    }
    if (ev.type === "school"){
      add(ev.from - 350, HW + 36, p => fpWarn(p, "🏫"));
      add(ev.from + 60, 0, p => fpRoadText(p, "SCHOOL ZONE " + ev.limit));
    }
    if (ev.type === "construction"){
      add(ev.from - 350, HW + 36, p => fpWarn(p, "🚧"));
      for (const c of ev.cones){ if (!c.hit) add(c.w, laneC(ev.lane) + c.jitter, p => fpCone(p)); }
    }
    if (ev.type === "bump") add(ev.at, ev.lat, p => fpBump(p));
  }
  // landmarks as billboards
  for (const m of S.rt.marks)
    add(m.d, m.side * (HW + 130), p => fpLandmark(p, m));
  add(S.rt.len - 8, 0, p => fpFinish(p));
  if (S.amb && S.amb.w > S.t + 30) add(S.amb.w, S.amb.lat, p => fpAmb(p));

  spr.sort((a, b) => b.p.fwd - a.p.fwd);
  for (const s of spr) s.fn(s.p);

  // ambulance behind → flashing edges
  if (S.amb && S.amb.w <= S.t + 30){
    const flash = Math.floor(S.time * 6) % 2;
    ctx.fillStyle = flash ? "rgba(255,59,48,.28)" : "rgba(52,120,246,.28)";
    ctx.fillRect(0, 0, 26, H); ctx.fillRect(W - 26, 0, 26, H);
  }
  // speed streaks
  if (S.speed > S.veh.max * .8){
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++){
      const yy = HORIZON + 40 + hash(i + Math.floor(S.time * 10)) * 360;
      const xx = (i % 2) ? 30 + hash(i * 3) * 80 : W - 30 - hash(i * 5) * 80;
      ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + (i % 2 ? -1 : 1) * 30, yy + 14); ctx.stroke();
    }
  }
  drawPlayerFP(jump);
}
function quad(x1, y1, x2, y2, x3, y3, x4, y4, col){
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
  ctx.closePath(); ctx.fill();
}
function drawTurbineFP(x, y){
  ctx.strokeStyle = "#e8edf2"; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, y + 38); ctx.lineTo(x, y); ctx.stroke();
  const a = S.time * 2;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++){
    const ang = a + i * Math.PI * 2 / 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * 16, y + Math.sin(ang) * 16); ctx.stroke();
  }
}
function fpStopSign(p){
  const s = p.sc * 2;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
  ctx.fillStyle = "#888"; ctx.fillRect(-1.5, -34, 3, 34);
  ctx.fillStyle = "#d62828";
  ctx.beginPath();
  for (let i = 0; i < 8; i++){
    const a = Math.PI / 8 + i * Math.PI / 4;
    i ? ctx.lineTo(Math.cos(a) * 12, -40 + Math.sin(a) * 12) : ctx.moveTo(Math.cos(a) * 12, -40 + Math.sin(a) * 12);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("STOP", 0, -38);
  ctx.restore();
}
function fpLight(p, ph){
  const s = p.sc * 2;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
  ctx.strokeStyle = "#666"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -64); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(-46, -62); ctx.stroke();
  ctx.fillStyle = "#222"; rounded(-52, -78, 13, 33, 3); ctx.fill();
  const cols = { red:"#ff3b30", yellow:"#ffd23f", green:"#34c759" };
  ["red","yellow","green"].forEach((c, i) => {
    ctx.fillStyle = ph === c ? cols[c] : "#444";
    ctx.beginPath(); ctx.arc(-45.5, -72 + i * 10, 3.6, 0, 7); ctx.fill();
  });
  ctx.restore();
}
function fpWarn(p, emoji){
  const s = p.sc * 2;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
  ctx.fillStyle = "#888"; ctx.fillRect(-1.5, -30, 3, 30);
  ctx.save(); ctx.translate(0, -38); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#ffd23f"; ctx.strokeStyle = "#1d3461"; ctx.lineWidth = 1.5;
  ctx.fillRect(-9, -9, 18, 18); ctx.strokeRect(-9, -9, 18, 18);
  ctx.restore();
  ctx.font = "11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(emoji, 0, -34);
  ctx.restore();
}
function fpKid(p, k){
  const s = p.sc * 1.9;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
  const step = Math.sin(S.time * 9 + k.lat) * 3;
  ctx.strokeStyle = "#444"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-3 + step, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -6); ctx.lineTo(3 - step, 0); ctx.stroke();
  ctx.fillStyle = ["#e63946","#457b9d","#2a9d8f","#f4a261","#9b5de5","#ff70a6"][Math.floor(hash(k.lat * 3) * 6)];
  rounded(-6, -20, 12, 15, 4); ctx.fill();
  ctx.fillStyle = "#f1c9a5"; ctx.beginPath(); ctx.arc(0, -25, 5.5, 0, 7); ctx.fill();
  ctx.restore();
}
function fpCone(p){
  const s = p.sc * 2;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
  ctx.fillStyle = "#f77f00";
  ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillRect(-4.5, -8, 9, 3.5);
  ctx.restore();
}
function fpBump(p){
  const s = p.sc * 2, w = LANE_W * .55 * p.LF;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = "#7a5230";
  ctx.beginPath(); ctx.ellipse(0, 0, w, 7 * s, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "#ffd23f"; ctx.font = `bold ${Math.max(7, 10 * s)}px sans-serif`; ctx.textAlign = "center";
  ctx.fillText("RAMP", 0, -8 * s);
  ctx.restore();
}
function fpArch(p, lbl){
  const w = HWf() * p.LF + 14 * p.sc;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.strokeStyle = "#888"; ctx.lineWidth = 5 * p.sc;
  ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w, -90 * p.sc);
  ctx.moveTo(w, 0); ctx.lineTo(w, -90 * p.sc); ctx.stroke();
  ctx.strokeStyle = "#555"; ctx.lineWidth = 2 * p.sc;
  ctx.beginPath(); ctx.moveTo(-w, -86 * p.sc); ctx.quadraticCurveTo(0, -68 * p.sc, w, -86 * p.sc); ctx.stroke();
  const colors = ["#e63946","#ffd23f","#2a9d8f","#9b5de5","#ff70a6"];
  for (let i = 0; i < 9; i++){
    const fx = -w + i * (2 * w) / 8, fy = -84 * p.sc + Math.sin(i / 8 * Math.PI) * 14 * p.sc;
    ctx.fillStyle = colors[i % 5];
    ctx.beginPath(); ctx.moveTo(fx - 6 * p.sc, fy); ctx.lineTo(fx + 6 * p.sc, fy); ctx.lineTo(fx, fy + 12 * p.sc);
    ctx.closePath(); ctx.fill();
  }
  if (p.sc > .35){
    ctx.font = `bold ${13 * p.sc}px sans-serif`; ctx.textAlign = "center";
    const tw = ctx.measureText(lbl).width + 12;
    ctx.fillStyle = "rgba(255,255,255,.92)"; rounded(-tw/2, -112 * p.sc, tw, 18 * p.sc, 6); ctx.fill();
    ctx.fillStyle = "#1d3461"; ctx.fillText(lbl, 0, -99 * p.sc);
  }
  ctx.restore();
}
function fpRoadText(p, text){
  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.font = `bold ${Math.max(8, 15 * p.sc * 2)}px sans-serif`; ctx.textAlign = "center";
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, .45); ctx.fillText(text, 0, 0); ctx.restore();
}
const LM_EMOJI = { school:"🏫", park:"🌳", townhall:"🏛", library:"📚", fire:"🚒", civic:"🏢" };
function fpLandmark(p, m){
  if (p.sc < .14) return;
  const s = p.sc * 2;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
  if (m.kind === "park"){
    ctx.fillStyle = "#7a5230"; ctx.fillRect(-3, -16, 6, 16);
    ctx.fillStyle = "#3c8c4f"; ctx.beginPath(); ctx.arc(0, -24, 14, 0, 7); ctx.fill();
    ctx.fillStyle = "#55a86a"; ctx.beginPath(); ctx.arc(-5, -28, 8, 0, 7); ctx.fill();
  } else {
    ctx.fillStyle = m.kind === "fire" ? "#d65f5f" : m.kind === "school" ? "#d9824f" : "#cdb89a";
    ctx.fillRect(-26, -34, 52, 34);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 3; i++) ctx.fillRect(-19 + i * 15, -26, 9, 9);
    ctx.fillStyle = "#5e4634"; ctx.fillRect(-5, -13, 10, 13);
  }
  ctx.restore();
  if (p.sc > .3){
    const text = LM_EMOJI[m.kind] + " " + m.name;
    ctx.font = "bold 10.5px sans-serif"; ctx.textAlign = "center";
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = "rgba(255,255,255,.92)"; rounded(p.x - w/2, p.y - 84 * p.sc - 14, w, 15, 6); ctx.fill();
    ctx.fillStyle = "#1d3461"; ctx.fillText(text, p.x, p.y - 84 * p.sc - 3);
  }
}
function fpFinish(p){
  const w = HWf() * p.LF + 16 * p.sc;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = "#1d3461";
  ctx.fillRect(-w, -84 * p.sc, 8 * p.sc, 84 * p.sc); ctx.fillRect(w - 8 * p.sc, -84 * p.sc, 8 * p.sc, 84 * p.sc);
  ctx.fillRect(-w, -100 * p.sc, 2 * w, 22 * p.sc);
  ctx.fillStyle = "#ffd23f"; ctx.font = `bold ${Math.max(8, 14 * p.sc)}px sans-serif`; ctx.textAlign = "center";
  ctx.fillText("🏁 FINISH 🏁", 0, -85 * p.sc);
  ctx.restore();
}
function fpAmb(p){
  const s = p.sc * 2;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
  ctx.fillStyle = "#fff"; rounded(-14, -34, 28, 34, 4); ctx.fill();
  ctx.fillStyle = "#d62828"; ctx.fillRect(-14, -14, 28, 7);
  ctx.fillStyle = "#9bd1ff"; rounded(-10, -30, 20, 8, 2); ctx.fill();
  const flash = Math.floor(S.time * 6) % 2;
  ctx.fillStyle = flash ? "#ff3b30" : "#3478f6"; ctx.fillRect(-11, -38, 8, 4);
  ctx.fillStyle = flash ? "#3478f6" : "#ff3b30"; ctx.fillRect(3, -38, 8, 4);
  ctx.restore();
}
function drawPlayerFP(jump){
  const v = S.veh;
  const tilt = (input.left ? -.05 : 0) + (input.right ? .05 : 0);
  const bob = Math.sin(S.time * 14) * Math.min(2, S.speed * .06);
  ctx.save();
  ctx.translate(260, 700 - jump + bob);
  ctx.rotate(tilt);
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath(); ctx.ellipse(0, 26 + jump * .8, 70, 12, 0, 0, 7); ctx.fill();
  if (v.id === "ev" || v.id === "car" || v.id === "monster"){
    const col = v.id === "ev" ? "#2a9d8f" : v.id === "car" ? "#4361ee" : "#7b2cbf";
    const wh = v.id === "monster" ? 26 : 14;
    ctx.fillStyle = "#1b1b1b";
    rounded(-66, 10 - wh, 26, wh + 16, 7); ctx.fill();
    rounded(40, 10 - wh, 26, wh + 16, 7); ctx.fill();
    ctx.fillStyle = col; rounded(-58, -26 - (v.id === "monster" ? 16 : 0), 116, 44, 12); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.22)"; rounded(-58, -26 - (v.id === "monster" ? 16 : 0), 116, 10, 8); ctx.fill();
    ctx.fillStyle = "#bde0fe"; rounded(-44, -20 - (v.id === "monster" ? 16 : 0), 88, 16, 6); ctx.fill();
    // brake lights
    ctx.fillStyle = input.stop ? "#ff3b30" : "#7a1f1f";
    rounded(-54, 6 - (v.id === "monster" ? 16 : 0), 18, 8, 3); ctx.fill();
    rounded(36, 6 - (v.id === "monster" ? 16 : 0), 18, 8, 3); ctx.fill();
    if (v.id === "monster"){
      ctx.fillStyle = "#ffd23f"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("MONSTER", 0, -26);
    }
  } else {
    ctx.fillStyle = "#333";
    ctx.beginPath(); ctx.ellipse(0, 16, 9, 16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#457b9d"; rounded(-16, -34, 32, 38, 10); ctx.fill();
    ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(0, -42, 13, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(-4, -46, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-24, -6); ctx.lineTo(-16, -16); ctx.moveTo(24, -6); ctx.lineTo(16, -16); ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================
   HUD: glass top bar, speedometer, minimap, street pill
   ============================================================ */
function drawHUD(){
  const sc = Math.round(S.score), lim = currentLimit();

  // glass top bar
  ctx.fillStyle = "rgba(13,27,42,.78)";
  rounded(8, 8, W - 16, 48, 12); ctx.fill();
  ctx.textAlign = "left"; ctx.font = "bold 17px sans-serif";
  ctx.fillStyle = sc >= 70 ? "#7ae582" : sc >= 40 ? "#ffd23f" : "#ff6b6b";
  ctx.fillText(`🛡 ${sc}`, 20, 30);
  ctx.font = "9px sans-serif"; ctx.fillStyle = "#9fb3c8";
  ctx.fillText("SAFETY SCORE", 20, 46);

  // progress
  const bx = 116, bw = W - 240;
  ctx.fillStyle = "rgba(255,255,255,.18)"; rounded(bx, 20, bw, 10, 5); ctx.fill();
  ctx.fillStyle = "#4ea8de"; rounded(bx, 20, Math.max(8, bw * clamp(S.t / S.rt.len, 0, 1)), 10, 5); ctx.fill();
  for (const ev of S.events){
    const p = (ev.at ?? ev.from) / S.rt.len;
    ctx.fillStyle = ev.type === "emergency" ? "#ff6b6b" : ev.type === "light" ? "#ffb866" :
                    ev.type === "bump" ? "#c77dff" : "#aab8c2";
    ctx.beginPath(); ctx.arc(bx + bw * p, 25, 2.4, 0, 7); ctx.fill();
  }
  ctx.font = "11px sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText("🏁", bx + bw + 5, 29);
  ctx.font = "9px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#9fb3c8";
  ctx.fillText(`LEVEL ${S.li + 1} • ${S.cfg.title.toUpperCase()}`, bx + bw / 2, 46);

  // stunt pts (monster)
  if (S.cfg.bumps){
    ctx.textAlign = "right"; ctx.font = "bold 13px sans-serif"; ctx.fillStyle = "#c77dff";
    ctx.fillText(`🛻 AIR ${S.airPts}`, W - 18, 30);
  }

  // street pill
  let street = S.rt.streets[0][1];
  for (const st of S.rt.streets) if (S.t >= st[0]) street = st[1];
  ctx.font = "bold 12px sans-serif"; ctx.textAlign = "left";
  const sw = ctx.measureText("📍 " + street).width + 18;
  ctx.fillStyle = "rgba(13,27,42,.78)"; rounded(8, 64, sw, 22, 11); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillText("📍 " + street, 17, 79.5);

  // minimap
  if (save.minimap && S.mm) drawMinimap();

  // banner
  if (S.banner && S.time < S.banner.until){
    ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
    const bw2 = ctx.measureText(S.banner.text).width + 28;
    ctx.fillStyle = "rgba(214,40,40,.93)"; rounded(260 - bw2/2, 96, bw2, 30, 15); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(S.banner.text, 260, 116);
  }
  // hint
  if (S.t < 90 && S.speed < 1){
    ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#1d3461";
    ctx.fillStyle = "rgba(255,255,255,.9)";
    const hint = "Hold ▲ (or GO) to start riding!";
    const hw2 = ctx.measureText(hint).width + 24;
    rounded(260 - hw2/2, PLAYER_Y + 76, hw2, 28, 14); ctx.fill();
    ctx.fillStyle = "#1d3461"; ctx.fillText(hint, 260, PLAYER_Y + 95);
  }
  drawSpeedo(lim);
  drawToasts();
}

/* big analog speedometer */
function drawSpeedo(lim){
  const cx = W - 66, cy = H - 70, r = 52;
  const vmax = Math.ceil(S.veh.max / 10) * 10;
  const a0 = Math.PI * .75, a1 = Math.PI * 2.25;
  const ang = m => a0 + (a1 - a0) * clamp(m / vmax, 0, 1);
  ctx.save();
  ctx.fillStyle = "rgba(13,27,42,.85)";
  ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, 7); ctx.stroke();
  // limit→max red arc
  ctx.strokeStyle = "#ff6b6b"; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(cx, cy, r - 4, ang(lim), a1); ctx.stroke();
  ctx.strokeStyle = "#7ae582";
  ctx.beginPath(); ctx.arc(cx, cy, r - 4, a0, ang(lim)); ctx.stroke();
  // ticks
  ctx.fillStyle = "#dfe7ee"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
  for (let m = 0; m <= vmax; m += 10){
    const a = ang(m);
    const x1 = cx + Math.cos(a) * (r - 11), y1 = cy + Math.sin(a) * (r - 11);
    const x2 = cx + Math.cos(a) * (r - 17), y2 = cy + Math.sin(a) * (r - 17);
    ctx.strokeStyle = "#dfe7ee"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillText(String(m), cx + Math.cos(a) * (r - 26), cy + Math.sin(a) * (r - 26) + 3);
  }
  // needle
  const a = ang(S.speed);
  ctx.strokeStyle = "#ff4d4d"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 8, cy - Math.sin(a) * 8);
  ctx.lineTo(cx + Math.cos(a) * (r - 18), cy + Math.sin(a) * (r - 18)); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
  // digital
  ctx.font = "bold 17px sans-serif";
  ctx.fillStyle = S.speed > lim + 3 ? "#ff6b6b" : "#fff";
  ctx.fillText(Math.round(S.speed), cx, cy + 26);
  ctx.font = "8px sans-serif"; ctx.fillStyle = "#9fb3c8";
  ctx.fillText("MPH", cx, cy + 36);
  // limit chip
  ctx.fillStyle = "#fff"; rounded(cx - 17, cy - r - 24, 34, 24, 4); ctx.fill();
  ctx.strokeStyle = "#1d3461"; ctx.lineWidth = 2; rounded(cx - 17, cy - r - 24, 34, 24, 4); ctx.stroke();
  ctx.fillStyle = "#1d3461"; ctx.font = "bold 7px sans-serif"; ctx.fillText("LIMIT", cx, cy - r - 15);
  ctx.font = "bold 12px sans-serif"; ctx.fillText(String(lim), cx, cy - r - 4);
  ctx.restore();
}

function drawToasts(){
  ctx.textAlign = "center"; ctx.font = "bold 16px sans-serif";
  S.toasts.forEach((t, i) => {
    const a = clamp(t.t / .4, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(255,255,255,.85)";
    const w = ctx.measureText(t.text).width + 16;
    const y = PLAYER_Y - 96 - (1.8 - t.t) * 40 - i * 24;
    rounded(260 - w/2, y - 15, w, 22, 11); ctx.fill();
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 260, y + 2);
    ctx.globalAlpha = 1;
  });
}

/* ============================================================
   REAL-MAP RENDERING (minimap + intro map)
   ============================================================ */
function renderBaseMap(c2, region, w, h){
  const [mx0, my0, mx1, my1] = region;
  const s = Math.min(w / (mx1 - mx0), h / (my1 - my0));
  const ox = (w - (mx1 - mx0) * s) / 2, oy = (h - (my1 - my0) * s) / 2;
  c2.fillStyle = "#eef0e4"; c2.fillRect(0, 0, w, h);
  const polyM = p => {
    c2.beginPath();
    for (let i = 0; i < p.length; i += 2)
      i ? c2.lineTo(ox + (p[i] - mx0) * s, oy + (p[i+1] - my0) * s) : c2.moveTo(ox + (p[i] - mx0) * s, oy + (p[i+1] - my0) * s);
  };
  for (const pk of MAPP){ polyM(pk.p); c2.closePath(); c2.fillStyle = "#bfe3a6"; c2.fill(); }
  for (const scl of MAPS){ polyM(scl.p); c2.closePath(); c2.fillStyle = "#f0dfbe"; c2.fill(); }
  for (const wt of MAPW){
    polyM(wt.p);
    if (wt.a){ c2.closePath(); c2.fillStyle = "#a5d8f5"; c2.fill(); }
    else { c2.strokeStyle = "#a5d8f5"; c2.lineWidth = Math.max(1.5, 24 * s); c2.lineCap = "round"; c2.stroke(); }
  }
  c2.lineCap = "round"; c2.lineJoin = "round";
  for (const rd of MAPR){
    polyM(rd.p);
    c2.strokeStyle = rd.c === "hwy" ? "#f2b66d" : "#d9d2c4";
    c2.lineWidth = Math.max(rd.c === "hwy" ? 2.6 : 1.4, (rd.c === "hwy" ? 70 : 44) * s);
    c2.stroke();
  }
  for (const rd of MAPR){
    if (rd.c === "hwy") continue;
    polyM(rd.p);
    c2.strokeStyle = "#fff";
    c2.lineWidth = Math.max(.9, 30 * s);
    c2.stroke();
  }
  return { s, ox, oy, mx0, my0 };
}
function routeBBoxM(rt, margin){
  let a = 1e18, b = 1e18, c = -1e18, d = -1e18;
  for (let i = 0; i < rt.n; i++){
    a = Math.min(a, rt.sx[i]); c = Math.max(c, rt.sx[i]);
    b = Math.min(b, rt.sy[i]); d = Math.max(d, rt.sy[i]);
  }
  // square it
  const cx = (a + c) / 2, cy = (b + d) / 2;
  const half = Math.max(c - a, d - b) / 2 + margin;
  return [cx - half, cy - half, cx + half, cy + half];
}
function buildMinimap(li){
  const rt = ROUTES[li];
  const region = routeBBoxM(rt, 900);
  const cnv = document.createElement("canvas");
  cnv.width = 300; cnv.height = 300;
  const c2 = cnv.getContext("2d");
  const tf = renderBaseMap(c2, region, 300, 300);
  // route
  c2.strokeStyle = "#3478f6"; c2.lineWidth = 4; c2.lineCap = "round"; c2.lineJoin = "round";
  c2.beginPath();
  for (let i = 0; i < rt.n; i += 2){
    const x = tf.ox + (rt.sx[i] - tf.mx0) * tf.s, y = tf.oy + (rt.sy[i] - tf.my0) * tf.s;
    i ? c2.lineTo(x, y) : c2.moveTo(x, y);
  }
  c2.stroke();
  // start / end
  const ex = tf.ox + (rt.sx[rt.n-1] - tf.mx0) * tf.s, ey = tf.oy + (rt.sy[rt.n-1] - tf.my0) * tf.s;
  const sx0 = tf.ox + (rt.sx[0] - tf.mx0) * tf.s, sy0 = tf.oy + (rt.sy[0] - tf.my0) * tf.s;
  c2.fillStyle = "#2d6a4f"; c2.beginPath(); c2.arc(sx0, sy0, 5, 0, 7); c2.fill();
  c2.fillStyle = "#d62828"; c2.beginPath(); c2.arc(ex, ey, 5, 0, 7); c2.fill();
  c2.fillStyle = "#fff"; c2.font = "bold 8px sans-serif"; c2.textAlign = "center";
  c2.fillText("🏁", ex, ey + 3);
  return { cnv, tf };
}
function drawMinimap(){
  const box = { x: W - 158, y: 64, w: 150, h: 150 };
  ctx.save();
  rounded(box.x, box.y, box.w, box.h + 12, 10); ctx.clip();
  ctx.fillStyle = "#eef0e4"; ctx.fillRect(box.x, box.y, box.w, box.h + 12);
  ctx.drawImage(S.mm.cnv, 0, 0, 300, 300, box.x, box.y, box.w, box.w);
  // player arrow
  const tf = S.mm.tf;
  const pxx = box.x + (tf.ox + (cam.x - tf.mx0) * tf.s) * (box.w / 300);
  const pyy = box.y + (tf.oy + (cam.y - tf.my0) * tf.s) * (box.w / 300);
  ctx.translate(pxx, pyy); ctx.rotate(cam.h + Math.PI / 2);
  ctx.fillStyle = "#d62828";
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(13,27,42,.6)"; ctx.lineWidth = 2;
  rounded(box.x, box.y, box.w, box.h + 12, 10); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.font = "7px sans-serif"; ctx.textAlign = "right";
  ctx.fillText("© OpenStreetMap", box.x + box.w - 4, box.y + box.h + 7);
}
function drawIntroMap(li){
  const c = document.getElementById("introMap"), c2 = c.getContext("2d");
  const rt = ROUTES[li];
  c2.clearRect(0, 0, c.width, c.height);
  const region = routeBBoxM(rt, 700);
  const tf = renderBaseMap(c2, region, c.width, c.height);
  c2.strokeStyle = "#3478f6"; c2.lineWidth = 5; c2.lineCap = "round"; c2.lineJoin = "round";
  c2.beginPath();
  for (let i = 0; i < rt.n; i += 2){
    const x = tf.ox + (rt.sx[i] - tf.mx0) * tf.s, y = tf.oy + (rt.sy[i] - tf.my0) * tf.s;
    i ? c2.lineTo(x, y) : c2.moveTo(x, y);
  }
  c2.stroke();
  const pt = i => [tf.ox + (rt.sx[i] - tf.mx0) * tf.s, tf.oy + (rt.sy[i] - tf.my0) * tf.s];
  const [ax, ay] = pt(0), [bx2, by2] = pt(rt.n - 1);
  const tag = (x, y, text, col) => {
    c2.font = "bold 11px sans-serif"; c2.textAlign = "center";
    const w = c2.measureText(text).width + 12;
    const tx = clamp(x, w/2 + 4, c.width - w/2 - 4), ty = clamp(y - 24, 4, c.height - 22);
    c2.fillStyle = col; rounded2(c2, tx - w/2, ty, w, 18, 8); c2.fill();
    c2.fillStyle = "#fff"; c2.fillText(text, tx, ty + 13);
  };
  c2.fillStyle = "#2d6a4f"; c2.beginPath(); c2.arc(ax, ay, 7, 0, 7); c2.fill();
  c2.fillStyle = "#d62828"; c2.beginPath(); c2.arc(bx2, by2, 7, 0, 7); c2.fill();
  const names = rt.name.split("→").map(s => s.trim());
  tag(ax, ay, "🟢 " + (names[0] || "Start"), "#2d6a4f");
  tag(bx2, by2, "🏁 " + (names[1] || "Finish"), "#d62828");
  c2.fillStyle = "#666"; c2.font = "8px sans-serif"; c2.textAlign = "right";
  c2.fillText("© OpenStreetMap contributors", c.width - 5, c.height - 5);
}
function rounded2(c2, x, y, w, h, r){
  c2.beginPath();
  c2.moveTo(x + r, y);
  c2.arcTo(x + w, y, x + w, y + h, r);
  c2.arcTo(x + w, y + h, x, y + h, r);
  c2.arcTo(x, y + h, x, y, r);
  c2.arcTo(x, y, x + w, y, r);
  c2.closePath();
}
function rounded(x, y, w, h, r){ rounded2(ctx, x, y, w, h, r); }

/* ============================================================
   MENU / QUIZ / CERT / RETRY
   ============================================================ */
const nameInput = document.getElementById("playerName");
nameInput.value = save.name || "";
nameInput.addEventListener("input", () => { save.name = nameInput.value.trim(); persist(); });
document.getElementById("logoImg").src = LOGO_DATA_URI;

function buildMenu(){
  const grid = document.getElementById("levelGrid");
  grid.innerHTML = "";
  VEHICLES.forEach((v, i) => {
    const locked = i >= save.unlocked;
    const secretLocked = v.secret && locked;
    const cert = save.certs[v.id];
    const card = document.createElement("button");
    card.className = "lvlcard" + (locked ? " locked" : "");
    // built with textContent (never innerHTML) — save data comes from localStorage
    const stars = cert ? clamp(Math.round(Number(cert.stars) || 0), 0, 3) : 0;
    const score = cert ? clamp(Math.round(Number(cert.score) || 0), 0, 100) : 0;
    const parts = secretLocked
      ? [["vemoji","❓"], ["vname","???"], ["vsub","Secret! Earn all 5 certificates to unlock…"], ["vstars",""]]
      : [["vemoji", locked ? "🔒" : v.emoji],
         ["vname", v.name],
         ["vsub", locked ? "Finish the level before to unlock!" : "Lv " + (i+1) + " • " + CFG[i].title],
         ["vstars", cert ? "⭐".repeat(stars) + ` ${score}/100` : ""]];
    for (const [cls, text] of parts){
      const div = document.createElement("div");
      div.className = cls; div.textContent = text;
      card.appendChild(div);
    }
    if (!locked) card.addEventListener("click", () => { ensureAudio(); openIntro(i); });
    grid.appendChild(card);
  });
}
document.getElementById("introBack").addEventListener("click", () => { S.screen = "menu"; buildMenu(); show("menu"); });
document.getElementById("startBtn").addEventListener("click", beginRun);

/* quiz */
let quizQs = [], quizIdx = 0;
function startQuiz(){
  // settle any still-active siren: judge it on behavior so far (no modal at the finish line)
  if (S.amb && S.amb.ev && !S.amb.ev.resolved){
    S.amb.ev.resolved = true;
    if (S.amb.ev.bad < .8) S.score = Math.min(100, S.score + 8);
    else { S.score = Math.max(0, S.score - TIPS.emergency.pts); toast("Didn't pull over! −" + TIPS.emergency.pts, "#d62828"); }
    S.amb = null;
  }
  sirenStop();
  S.screen = "quiz";
  const pool = [...QUIZ[S.veh.id]].sort(() => Math.random() - .5);
  quizQs = pool.slice(0, 2); quizIdx = 0;
  showQuizQ();
  show("quiz");
}
function showQuizQ(){
  const q = quizQs[quizIdx];
  document.getElementById("quizQ").textContent = `${quizIdx + 1}/2: ${q.q}`;
  document.getElementById("quizWhy").classList.add("hidden");
  document.getElementById("quizNext").classList.add("hidden");
  const box = document.getElementById("quizOpts");
  box.innerHTML = "";
  q.opts.forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "qopt"; b.textContent = opt;
    b.addEventListener("click", () => {
      if (box.dataset.done) return;
      box.dataset.done = "1";
      [...box.children].forEach((c, j) => { if (j === q.a) c.classList.add("right"); });
      const why = document.getElementById("quizWhy");
      if (i === q.a){ S.quizBonus += 4; ding(); why.textContent = "✅ Correct! +4 — " + q.why; }
      else { b.classList.add("wrong"); buzz(); why.textContent = "💡 " + q.why; }
      why.classList.remove("hidden");
      const next = document.getElementById("quizNext");
      next.textContent = quizIdx < quizQs.length - 1 ? "Next →" : "See my results! 🎉";
      next.classList.remove("hidden");
    });
    box.appendChild(b);
  });
  delete box.dataset.done;
}
document.getElementById("quizNext").addEventListener("click", () => {
  quizIdx++;
  if (quizIdx < quizQs.length) showQuizQ();
  else finishLevel();
});

function finishLevel(){
  S.finalScore = clamp(Math.round(S.score + S.quizBonus), 0, 100);
  if (S.finalScore >= 70){
    const stars = S.finalScore >= 90 ? 3 : S.finalScore >= 78 ? 2 : 1;
    save.unlocked = Math.max(save.unlocked, S.li + 2);
    const old = save.certs[S.veh.id];
    if (!old || S.finalScore > old.score)
      save.certs[S.veh.id] = { score: S.finalScore, stars, date: new Date().toLocaleDateString() };
    persist();
    showCert(stars);
  } else {
    showRetry(`You finished with a Safety Score of ${S.finalScore} — you need 70 to graduate. You've got this! Remember: stop fully, slow down in zones, and watch for people.`);
  }
}
function showRetry(text){
  sirenStop();
  S.screen = "retry";
  document.getElementById("retryText").textContent = text;
  show("retry");
}
document.getElementById("retryBtn").addEventListener("click", () => openIntro(S.li));
document.getElementById("retryMenu").addEventListener("click", () => { S.screen = "menu"; buildMenu(); show("menu"); });

/* certificate */
const logoIm = new Image(); logoIm.src = LOGO_DATA_URI;
function showCert(stars){
  S.screen = "cert";
  const champ = S.li === 4;                 // finished the Car level
  const stunt = S.veh.id === "monster";
  document.getElementById("certHead").textContent =
    stunt ? "🛻 STUNT STAR! What a run!" :
    champ ? "🏆 ROAD SAFETY CHAMPION! All 5 levels done — secret unlocked on the menu… 🏆"
          : "🎉 Level complete — you graduated!";
  drawCert(stars, champ, stunt);
  document.getElementById("certNext").classList.toggle("hidden", S.li >= VEHICLES.length - 1 || S.li + 1 >= save.unlocked);
  show("cert");
  ding(); setTimeout(ding, 300);
}
function drawCert(stars, champ, stunt){
  const c = document.getElementById("certCanvas"), x = c.getContext("2d");
  const CW = 900, CH = 640;
  x.fillStyle = "#fffdf7"; x.fillRect(0, 0, CW, CH);
  x.strokeStyle = "#1d3461"; x.lineWidth = 10; x.strokeRect(14, 14, CW - 28, CH - 28);
  x.strokeStyle = "#4ea8de"; x.lineWidth = 3;  x.strokeRect(30, 30, CW - 60, CH - 60);
  x.font = "26px sans-serif"; x.textAlign = "center";
  [[52,62],[CW-52,62],[52,CH-40],[CW-52,CH-40]].forEach(([sx,sy]) => x.fillText("⭐", sx, sy));
  if (logoIm.complete && logoIm.naturalWidth){
    const lw = 130, lh = lw * (logoIm.naturalHeight / logoIm.naturalWidth);
    x.drawImage(logoIm, CW/2 - lw/2, 44, lw, lh);
  }
  x.fillStyle = "#1d3461";
  x.font = "bold 38px Georgia, serif";
  x.fillText(stunt ? "Certificate of Stunt Stardom" : "Certificate of Road Safety", CW/2, 232);
  x.font = "italic 17px Georgia, serif"; x.fillStyle = "#5a7d9a";
  x.fillText("Mountain House Road Safety Heroes", CW/2, 260);
  x.font = "16px Georgia, serif"; x.fillStyle = "#333";
  x.fillText("This certifies that", CW/2, 304);
  x.font = "bold 44px 'Comic Sans MS', cursive";
  x.fillStyle = "#2a6fb0";
  x.fillText(save.name || "A Road Safety Hero", CW/2, 356);
  x.strokeStyle = "#9cc3e0"; x.lineWidth = 2;
  x.beginPath(); x.moveTo(CW/2 - 240, 368); x.lineTo(CW/2 + 240, 368); x.stroke();
  x.font = "17px Georgia, serif"; x.fillStyle = "#333";
  x.fillText(`has safely completed the ${S.veh.name} Level — "${S.cfg.title}"`, CW/2, 402);
  x.fillText(`${S.rt.name} • Mountain House, California`, CW/2, 428);
  x.font = "34px sans-serif";
  x.fillText("⭐".repeat(stars) + "☆".repeat(3 - stars), CW/2, 474);
  x.font = "bold 19px Georgia, serif"; x.fillStyle = "#2d6a4f";
  x.fillText(`Safety Score: ${S.finalScore} / 100${stunt ? `  •  Air Points: ${S.airPts} 🛻` : ""}`, CW/2, 506);
  if (champ){
    x.font = "bold 21px Georgia, serif"; x.fillStyle = "#b07d12";
    x.fillText("🏆 MOUNTAIN HOUSE ROAD SAFETY CHAMPION 🏆", CW/2, 538);
  }
  x.font = "54px sans-serif"; x.textAlign = "left";
  x.fillText(S.veh.emoji, 70, 380);
  x.textAlign = "center";
  x.font = "15px Georgia, serif"; x.fillStyle = "#333";
  x.fillText(`Date: ${new Date().toLocaleDateString()}`, 200, 580);
  x.strokeStyle = "#9cc3e0";
  x.beginPath(); x.moveTo(560, 566); x.lineTo(820, 566); x.stroke();
  x.font = "bold 15px Georgia, serif";
  x.fillText("Aaria's Blue Elephant", 690, 586);
  x.font = "12px Georgia, serif"; x.fillStyle = "#5a7d9a";
  x.fillText("Building a New Inclusive World 🌈 ♾️ • aariasblueelephant.org", CW/2, 612);
}
document.getElementById("certDownload").addEventListener("click", () => {
  try {
    const a = document.createElement("a");
    a.href = document.getElementById("certCanvas").toDataURL("image/png");
    const nm = (save.name || "hero").replace(/[^a-z0-9]/gi, "_");
    a.download = `${nm}_${S.veh.id}_certificate.png`;
    a.click();
  } catch (e){
    alert("Couldn't download — try running the game from a local web server (see README).");
  }
});
document.getElementById("certNext").addEventListener("click", () => openIntro(Math.min(S.li + 1, VEHICLES.length - 1)));
document.getElementById("certMenu").addEventListener("click", () => { S.screen = "menu"; buildMenu(); show("menu"); });

/* ---------- main loop ---------- */
function draw(){
  setCam();
  if (S.view === "fp") drawFP();
  else drawTop();
  drawHUD();
}
let last = 0;
function frame(ts){
  const dt = clamp((ts - last) / 1000, 0, .05);
  last = ts;
  if (S.screen === "playing"){ update(dt); if (S.screen === "playing" || S.screen === "tip") draw(); }
  else if (S.screen === "tip" || S.screen === "quiz") draw();
  requestAnimationFrame(frame);
}
buildMenu();
show("menu");
requestAnimationFrame(frame);
