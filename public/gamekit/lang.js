/*! © 2026 Aaria's Blue Elephant · shared language helper for the games.
 * One setting for every game: localStorage "abe.lang" ('en' | 'es').
 * Legacy (non-kit) games include this BEFORE their own scripts and:
 *   ABELang.register({ "English string": "Spanish string", ... })
 *   ABELang.t("English string")        -> translated (digit-templated: keys
 *                                         may use {#} to match any number)
 *   ABELang.es                         -> true when Spanish
 *   ABELang.toggle()                   -> persist + reload (title screens)
 *   ABELang.voice(utterance)           -> sets utterance.lang appropriately
 *   ABELang.makeButton()               -> unstyled flag <button data-abe="lang">
 * Kit games get all of this from kit.js instead. */
(function () {
  var lang = "en";
  try { lang = localStorage.getItem("abe.lang") === "es" ? "es" : "en"; } catch (e) {}
  var dict = {};
  var voiceCache = {};
  function pickVoice(l) {
    if (voiceCache[l] !== undefined) return voiceCache[l];
    try {
      var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
      if (!vs.length) return null;                 // not loaded yet — don't cache
      var pool = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(l) === 0; });
      var ranks = [/natural/i, /neural/i, /premium/i, /enhanced/i, /paulina|m[oó]nica|samantha|ava|jenny/i];
      var pick = null;
      for (var i = 0; i < ranks.length && !pick; i++) {
        for (var j = 0; j < pool.length; j++) if (ranks[i].test(pool[j].name)) { pick = pool[j]; break; }
      }
      if (!pick) for (var k = 0; k < pool.length; k++) if (/US|MX|ES/i.test(pool[k].lang)) { pick = pool[k]; break; }
      voiceCache[l] = pick || pool[0] || null;
      return voiceCache[l];
    } catch (e) { return null; }
  }
  try { speechSynthesis.addEventListener("voiceschanged", function () { voiceCache = {}; }); } catch (e) {}
  function t(s) {
    if (lang !== "es" || s == null) return s;
    s = String(s);
    if (dict[s]) return dict[s];
    var tpl = s.replace(/\d+/g, "{#}");
    var es = dict[tpl];
    if (!es) return s;
    var nums = s.match(/\d+/g) || [];
    var i = 0;
    return es.replace(/\{#\}/g, function () { return nums[i++]; });
  }
  window.ABELang = {
    lang: lang,
    es: lang === "es",
    register: function (map) { for (var k in map) dict[k] = map[k]; },
    t: t,
    toggle: function () {
      try { localStorage.setItem("abe.lang", lang === "es" ? "en" : "es"); } catch (e) {}
      location.reload();
    },
    voice: function (u) {
      u.lang = lang === "es" ? "es-US" : "en-US";
      // u.lang alone is unreliable (WebKit keeps the old/default voice):
      // pick an explicit voice for the language — but respect a voice the game
      // already chose IF it matches the language (e.g. character voices).
      try {
        if (!u.voice || !String(u.voice.lang).toLowerCase().startsWith(lang)) {
          var v = pickVoice(lang);
          if (v) u.voice = v;
        }
      } catch (e) {}
      return u;
    },
    label: function () { return lang === "es" ? "🌐 English" : "🌐 Español"; },
    makeButton: function () {
      var b = document.createElement("button");
      b.setAttribute("data-abe", "lang");
      b.title = lang === "es" ? "Switch to English" : "Cambiar a español";
      b.textContent = this.label();
      b.addEventListener("click", this.toggle);
      return b;
    },
  };

  /* AI-translation disclaimer: whenever Spanish mode is on, every game shows a
   * small dismissible note (once per session) — the translation is entirely
   * AI-made and the creators are not Spanish speakers; please report mistakes. */
  if (lang === "es") {
    var show = function () {
      try {
        if (sessionStorage.getItem("abe_es_note")) return;
        sessionStorage.setItem("abe_es_note", "1");
      } catch (e) {}
      var n = document.createElement("div");
      n.id = "abeEsNote";
      n.style.cssText = "position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:99990;" +
        "max-width:min(92vw,560px);background:rgba(255,255,255,.96);color:#3a3a5a;border:2px solid #ffd43b;" +
        "border-radius:14px;padding:10px 38px 10px 14px;font:600 12.5px/1.45 'Comic Sans MS','Chalkboard SE',sans-serif;" +
        "box-shadow:0 6px 18px rgba(40,40,90,.25);pointer-events:none;";
      n.innerHTML = "🌐 La traducción al español fue hecha <b>completamente con IA</b> y puede tener errores — " +
        "los creadores no hablan español. Si encuentras un error, por favor avísanos en " +
        "<b>aariasblueelephant.org</b>. ¡Gracias! 💙" +
        "<div style='font-weight:500;font-size:10.5px;opacity:.75;margin-top:3px'>Spanish translation is AI-made and may contain mistakes — please report any at aariasblueelephant.org.</div>";
      var x = document.createElement("button");
      x.textContent = "✕";
      x.setAttribute("aria-label", "Cerrar");
      x.style.cssText = "position:absolute;top:4px;right:6px;border:0;background:none;font-size:16px;" +
        "font-weight:900;color:#3a3a5a;cursor:pointer;padding:4px;pointer-events:auto;";
      x.addEventListener("click", function () { n.remove(); });
      n.appendChild(x);
      document.body.appendChild(n);
      setTimeout(function () { if (n.parentNode) n.remove(); }, 20000);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
    else show();
  }
})();
