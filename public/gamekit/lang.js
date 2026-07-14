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
    voice: function (u) { u.lang = lang === "es" ? "es-US" : "en-US"; return u; },
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
})();
