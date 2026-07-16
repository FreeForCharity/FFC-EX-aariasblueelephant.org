# Aaria's Blue Elephant — repo conventions

React 19 + Vite 6 + TypeScript + Tailwind v4. Source lives at the repo root (`pages/`, `components/`, `lib/`, `data/`) — there is no `src/`. Games are static apps under `public/`. Typecheck/lint: `npm run lint` (= `tsc --noEmit`).

## Bilingual site (English/Spanish) — REQUIRED for all new content

The entire site is bilingual. **Any new or edited user-facing text MUST ship in both English and Spanish** — pages, components, buttons, labels, aria-labels, placeholders, toasts, loading messages, and game copy alike. Never add an English-only string.

How:
- **React site (pages/, components/):** `import { tr, isEs } from '../lib/lang'` and wrap every string: `tr('English', 'Español')`. Language is stored in localStorage key `abe.lang` ('en' | 'es'), shared with the games; toggling reloads the page, so `tr()` at render time is enough — no context/hooks needed. The toggle lives in the Navbar.
- **Kit games (public/, load gamekit/kit.js):** use `K.tr(en, es)` / register strings per game.
- **Legacy games (public/, load gamekit/lang.js):** `ABELang.register({...})` + `ABELang.t()`.
- **data/games.json:** every game entry needs `oneLiner_es` (titles stay untranslated). Changes must be additive — the mobile app consumes this file.
- Data from the database (event records, testimonials, registrant input) stays as-entered; translate only the UI chrome around it.

Style: warm, neutral Latin American Spanish, informal "tú" (legal pages may use a consistent formal register). Keep proper nouns (Aaria's Blue Elephant, Signify Impact, game titles, people's names) untranslated. English is the authoritative version.

Legal: all Spanish is AI-translated. The single site-wide disclosure covering this (and AI-assisted content generally) is `public/legal/disclosure.html` — linked from the Footer ("General Disclosure / Aviso general") and from every game. If translation policy changes, update that one file; don't create additional disclaimers. The Footer also shows a short AI-translation notice when Spanish is active.

## Other conventions
- Games carry the credit line "Built by Aaria and her Friends 💙" and the badge logo.
- New games must be registered per the ABE Game Kit checklist (see gamekit docs) and added to `data/games.json`.
