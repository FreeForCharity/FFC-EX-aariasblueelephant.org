/*! © 2026 Aaria's Blue Elephant · ABE Game Passport stamp for legacy (non-kit) games.
 * Include with:  <script src="/gamekit/passport.js" data-game="<slug>" defer></script>
 * Stamps one passport day per game per calendar day, per profile — same storage
 * the game kit uses, so kit games and legacy games share one passport shelf.
 * Everything stays on-device; no identifiers, nothing transmitted. */
(function () {
  // playtest-corner journal (no-op unless a grown-up enabled it at /playtest)
  try {
    if (localStorage.getItem("abe.playtest") === "1" && !window.__abePlaytest) {
      var pt = document.createElement("script");
      pt.src = "/gamekit/playtest.js";
      var cur = document.currentScript && document.currentScript.dataset.game;
      if (cur) pt.dataset.game = cur;
      document.head.appendChild(pt);
    }
  } catch (e) {}
  try {
    var slug = (document.currentScript && document.currentScript.dataset.game) || "";
    if (!slug || sessionStorage.getItem("abe_stamp_" + slug)) return;
    sessionStorage.setItem("abe_stamp_" + slug, "1");
    var prof = localStorage.getItem("abe.profile.current") || "p1";
    var key = prof === "p1" ? "abe.passport.v1" : "abe.passport." + prof + ".v1";
    var p = {};
    try { p = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
    var today = new Date().toISOString().slice(0, 10);
    var entry = p[slug] || { days: 0, last: "" };
    if (entry.last !== today) {
      entry.days++; entry.last = today; p[slug] = entry;
      localStorage.setItem(key, JSON.stringify(p));
    }
  } catch (e) {}
})();

/* Native share bridge: in the mobile app, file "downloads" (adventure files,
 * world shares, photos, certificates) route to the OS share sheet instead of
 * <a download> (which silently fails in iOS WKWebView). On the web this is a
 * no-op and games keep their normal download path.
 *   window.ABEShare(filename, data) -> Promise<boolean handled>
 *   data: Blob, data: URL string, or plain string (JSON) */
(function () {
  window.ABEShare = async function (filename, data) {
    try {
      var C = window.Capacitor;
      if (!C || !C.Plugins || !C.Plugins.Share || !C.Plugins.Filesystem) return false;
      var b64;
      if (typeof data === "string" && data.indexOf("data:") === 0) b64 = data.split(",")[1];
      else {
        var blob = data instanceof Blob ? data : new Blob([String(data)]);
        b64 = await new Promise(function (res, rej) {
          var r = new FileReader();
          r.onload = function () { res(String(r.result).split(",")[1]); };
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
      }
      var w = await C.Plugins.Filesystem.writeFile({ path: filename, data: b64, directory: "CACHE" });
      await C.Plugins.Share.share({ title: filename, url: w.uri });
      return true;
    } catch (e) { return e && e.message === "Share canceled" ? true : false; }
  };
})();

/* Anonymous aggregate play-time for legacy games (same posture as the play
 * tally each game already sends: seconds per game per day, NO identifiers).
 * Counts only visible-tab time, flushed in small batches. The anon key below
 * is the same public key already inline in every game's page. */
(function () {
  try {
    var slug = (document.currentScript && document.currentScript.dataset.game) || "";
    if (!slug || slug === "nilus-world") return; // the /nelus-world route stays analytics-free (COPPA follow-up)
    var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvY2xxeGdlZGhkZ3NseG5vdnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MzA3NzUsImV4cCI6MjA4NzQwNjc3NX0.824zjMOHfPyMXBm5WgvArI-ZzQJgYzddskm7-5y-PSM";
    var acc = 0, last = performance.now();
    function tick() {
      var now = performance.now();
      if (!document.hidden) acc += (now - last) / 1000;
      last = now;
    }
    function flush() {
      if (window.Capacitor) return;   // native app builds send NOTHING (Kids Category)
      var s = Math.floor(acc);
      if (s < 5) return;
      acc -= s;
      try {
        fetch("https://joclqxgedhdgslxnovxz.supabase.co/rest/v1/rpc/record_game_time", {
          method: "POST", keepalive: true,
          headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ g: slug, s: s }),
        }).catch(function () {});
      } catch (e) {}
    }
    setInterval(function () { tick(); if (acc >= 60) flush(); }, 5000);
    addEventListener("pagehide", function () { tick(); flush(); });
  } catch (e) {}
})();
