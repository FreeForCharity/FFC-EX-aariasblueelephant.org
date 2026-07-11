/*! © 2026 Aaria's Blue Elephant · ABE Game Passport stamp for legacy (non-kit) games.
 * Include with:  <script src="/gamekit/passport.js" data-game="<slug>" defer></script>
 * Stamps one passport day per game per calendar day, per profile — same storage
 * the game kit uses, so kit games and legacy games share one passport shelf.
 * Everything stays on-device; no identifiers, nothing transmitted. */
(function () {
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
