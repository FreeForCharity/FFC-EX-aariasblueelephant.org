/*! © 2026 Aaria's Blue Elephant · Playtest-corner observation journal.
 * ACTIVE ONLY when a grown-up enables Playtest Mode (localStorage
 * abe.playtest === '1', toggled at /playtest). Everything stays ON-DEVICE:
 * nothing is transmitted, ever. The journal captures what a volunteer's
 * eyes miss at a family event:
 *   - which games get opened, and for how long (visible seconds)
 *   - "dead taps": taps on things that aren't interactive
 *   - "rage taps": rapid bursts in one spot (frustration signal)
 * Shared by every game: kit games load this via kit.js's include; legacy
 * games get it through passport.js loading it. One file, all games, forever.
 * Journal: abe.playtest.journal = [{t,g,ev,n}...] capped at 800 entries. */
(function () {
  try {
    if (localStorage.getItem("abe.playtest") !== "1") return;
  } catch (e) { return; }
  if (window.__abePlaytest) return;   // don't double-instrument
  window.__abePlaytest = true;

  var slug = "site";
  try {
    var m = location.pathname.match(/^\/([a-z0-9-]+)\/index\.html/);
    if (m) slug = m[1];
    else if (location.pathname.indexOf("nelus-world") >= 0) slug = "nilus-world";
    var cs = document.currentScript && document.currentScript.dataset.game;
    if (cs) slug = cs;
  } catch (e) {}

  var KEY = "abe.playtest.journal";
  function log(ev, n) {
    try {
      var j = JSON.parse(localStorage.getItem(KEY) || "[]");
      j.push({ t: Date.now(), g: slug, ev: ev, n: n || 0 });
      if (j.length > 800) j = j.slice(j.length - 800);
      localStorage.setItem(KEY, JSON.stringify(j));
    } catch (e) {}
  }

  log("open");

  // visible play time
  var acc = 0, last = performance.now();
  function tick() {
    var now = performance.now();
    if (!document.hidden) acc += (now - last) / 1000;
    last = now;
  }
  setInterval(tick, 4000);

  // dead taps: pointerdown whose target chain has nothing interactive
  // rage taps: >=4 taps within 1.6s inside an ~90px circle
  var dead = 0, rage = 0;
  var burst = [];
  var INTERACTIVE = /^(button|a|input|select|textarea|canvas|label|summary|video|audio)$/i;
  document.addEventListener("pointerdown", function (e) {
    var el = e.target, interactive = false;
    for (var i = 0; el && i < 6; i++, el = el.parentElement) {
      if (INTERACTIVE.test(el.tagName) || el.onclick || el.getAttribute && (el.getAttribute("role") === "button" || el.dataset && (el.dataset.abe || el.dataset.i || el.dataset.kind || el.dataset.w || el.dataset.t || el.dataset.p))) { interactive = true; break; }
    }
    if (!interactive) dead++;
    var now = Date.now();
    burst = burst.filter(function (b) { return now - b.t < 1600; });
    burst.push({ t: now, x: e.clientX, y: e.clientY });
    if (burst.length >= 4) {
      // judge only the LAST four taps — one earlier faraway tap in the time
      // window must not mask a genuine burst
      var lastN = burst.slice(-4);
      var cx = lastN[0].x, cy = lastN[0].y, tight = true;
      for (var k = 1; k < lastN.length; k++)
        if (Math.hypot(lastN[k].x - cx, lastN[k].y - cy) > 90) { tight = false; break; }
      if (tight) { rage++; burst = []; }
    }
  }, true);

  function flush() {
    tick();
    if (acc >= 3) log("dur", Math.round(acc));
    if (dead > 0) log("dead", dead);
    if (rage > 0) log("rage", rage);
    acc = 0; dead = 0; rage = 0;
  }
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); });
  setInterval(flush, 60000);   // long sessions still journal periodically

  // a small badge so grown-ups can SEE the tablet is in playtest mode
  function badge() {
    var b = document.createElement("div");
    b.textContent = "🧪";
    b.title = "Playtest mode is ON (grown-ups: aariasblueelephant.org/playtest)";
    b.style.cssText = "position:fixed;bottom:4px;left:4px;z-index:99991;font-size:14px;opacity:.5;pointer-events:none;";
    document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", badge);
  else badge();
})();
