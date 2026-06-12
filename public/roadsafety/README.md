# Mountain House Road Safety Heroes 🚲🛡🚗

A road-safety learning game for kids by **Aaria's Blue Elephant**
*Building a New Inclusive World* — [aariasblueelephant.org](https://aariasblueelephant.org)

**Built on the REAL street map of Mountain House, California** — actual road geometry, parks,
schools, Town Hall, the Library, and routes computed over the live OpenStreetMap road network.
Map data © OpenStreetMap contributors (ODbL).

## How to play

Open `index.html` in any modern browser (double-click it). No install, no internet needed.
Optionally serve it for tablets on your Wi-Fi:

```bash
cd AariaRoadrash
python3 -m http.server 8000     # then open http://localhost:8000
```

**Controls:** `▲`/`W` go • `▼`/`S`/`Space` brake • `◀ ▶`/`A D` steer •
**`V` toggles first-person thrill view** • `M` toggles the minimap.
Big touch buttons appear automatically on tablets/phones.

## The journey — graduate through 5 levels (+ a secret!)

| Level | Vehicle | Real route |
|---|---|---|
| 1 | 🚲 Bicycle | Wicklund Park → Wicklund Elementary |
| 2 | ⚡ E-Bike | Questa Park → Kite Festival at Central Park |
| 3 | 🛴 E-Scooter | Mountain House Library → Hansen Park (past MH High) |
| 4 | 🔋 EV Car | Town Hall → Mountain House High School |
| 5 | 🚙 Car | Questa Park → Cordes Park, the grand 3-mile drive |
| 🤫 | ❓ Secret | Earn all 5 certificates to find out… (hint: BIG wheels, big air — on a closed course with marshals, of course) |

Every route is computed on the real road graph — Questa Trail, Central Parkway, Main Street,
Arturo Boulevard, Legacy Drive, South Tradition Street… The HUD always shows the real street
you're on, the intro screen shows your route drawn on a real map, and the corner minimap
tracks you across town live.

## What kids learn

- 🛑 Full stops at stop signs (look left-right-left)
- 🚦 Red means stop, yellow means get ready
- 🚸 People in crosswalks always go first
- 🏫 15 mph school zones at the real MH schools — slow down and scan
- 🚧 Construction zones — slow down, protect workers
- 🚑 Sirens — pull to the RIGHT and stop
- 🎪 Events (Kite Festival, Farmers Market) — crawl and yield

Start each ride with a Safety Score of 100. Breaking a rule costs points *and* pauses for a
friendly explanation; safe choices earn points back. Score 70+ then pass a 2-question quiz to
earn a **downloadable, printable certificate** (child's name + the Aaria's Blue Elephant logo)
and unlock the next vehicle. Best scores are kept; progress saves automatically.

## Files

- `index.html` / `style.css` / `game.js` — the whole game (vanilla JS, zero dependencies)
- `assets/mh-map-data.js` — compact real-map extract: streets, parks, water, schools, POIs + 6 routed levels
- `assets/logo.png`, `assets/logo-data.js` — the nonprofit logo (embedded so certificates download offline)
- `tools/build-map.js` — rebuilds `mh-map-data.js` from `assets/osm-raw.json` (Overpass API extract);
  routes are Dijkstra-computed with per-level preferred streets
- `tools/smoke-test.js` — headless autoplay test: a law-abiding autopilot must finish all 6 levels
  with a high score (`node tools/smoke-test.js`)

## A note on map imagery

Google Maps tiles/photos can't legally be embedded in a game, so this uses **OpenStreetMap**
data instead — the same real streets, openly licensed. Attribution
"© OpenStreetMap contributors" is shown on every map view, as the ODbL license requires.
