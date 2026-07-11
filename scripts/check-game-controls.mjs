// Game-control standard checker — fails the build/push when any game's HUD
// drifts from the house rules. Run: node scripts/check-game-controls.mjs
//
// THE STANDARD
//  R1  Every game has a one-tap mute button, FIRST in its HUD cluster.
//  R2  Every button in the HUD cluster has a title (tooltip) attribute.
//  R3  Ambiguous-action buttons (share/import/replay/parent/photo…) must carry
//      a VISIBLE text label — bare emoji like 📤 are not self-explanatory.
//  R4  Nilu's World (React HUD) keeps mute first and aria-labels everywhere.
import { readFileSync } from 'node:fs';

const errors = [];
const ok = (game, rule, msg) => {};
const fail = (game, rule, msg) => errors.push(`  ✗ [${game}] ${rule}: ${msg}`);

function clusterButtons(html, clusterId) {
  const m = html.match(new RegExp(`id="${clusterId}"[^>]*>([\\s\\S]*?)\\n\\s*</div>`));
  if (!m) return null;
  const btns = [...m[1].matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map((b) => b[0]);
  return btns;
}
const idOf = (btn) => (btn.match(/id="([^"]+)"/) || [])[1] ?? '(no id)';
const hasTitle = (btn) => /title="[^"]{3,}"/.test(btn);
const hasVisibleLabel = (btn) => {
  const inner = btn.replace(/<button[^>]*>/, '').replace(/<\/button>$/, '');
  const text = inner.replace(/<[^>]*>/g, ' ').replace(/[\p{Extended_Pictographic}️‍]/gu, '').trim();
  return text.length >= 3; // real words, not just emoji
};

// game → { file, cluster id, mute button id, ids that MUST have visible labels }
const GAMES = {
  'doughlab':     { file: 'public/doughlab/index.html',     cluster: 'hudBtns',  mute: 'muteBtn',  labeled: ['exportBtn', 'importBtn', 'parentBtn', 'photoBtn'] },
  'blockcraft':   { file: 'public/blockcraft/index.html',   cluster: 'menuBar',  mute: 'muteBtn',  labeled: ['movieBtn', 'shareBtn'] },
  'elly-tubbies': { file: 'public/elly-tubbies/index.html', cluster: 'menu',     mute: 'soundBtn', labeled: ['replayBtn', 'shareBtn'] },
  'magnetblocks': { file: 'public/magnetblocks/index.html', cluster: 'topRight', mute: 'soundBtn', labeled: ['replayBtn', 'shareBtn'] },
  'roadsafety':   { file: 'public/roadsafety/index.html',   cluster: 'topbtns',  mute: 'muteBtn',  labeled: [] },
};

for (const [game, cfg] of Object.entries(GAMES)) {
  const html = readFileSync(cfg.file, 'utf8');
  const btns = clusterButtons(html, cfg.cluster);
  if (!btns || btns.length === 0) { fail(game, 'R1', `HUD cluster #${cfg.cluster} not found`); continue; }
  // R1: mute exists and is first
  if (idOf(btns[0]) !== cfg.mute) fail(game, 'R1', `mute (#${cfg.mute}) must be FIRST in #${cfg.cluster}; found #${idOf(btns[0])} first`);
  // R2: every cluster button has a tooltip
  for (const b of btns) if (!hasTitle(b)) fail(game, 'R2', `#${idOf(b)} has no title tooltip`);
  // R3: ambiguous actions carry visible labels
  for (const id of cfg.labeled) {
    const b = btns.find((x) => idOf(x) === id);
    if (!b) { fail(game, 'R3', `expected button #${id} not found in #${cfg.cluster}`); continue; }
    if (!hasVisibleLabel(b)) fail(game, 'R3', `#${id} needs a visible text label (bare emoji is ambiguous)`);
  }
}

// ABE Game Kit (grocery + every future kit game): the HUD is built from a JS
// template in kit.js, so we check the kit once and all kit games inherit it.
{
  const src = readFileSync('public/gamekit/kit.js', 'utf8');
  const btns = clusterButtons(src, 'kHud');
  if (!btns || btns.length === 0) fail('gamekit', 'R1', 'HUD cluster #kHud not found in kit.js');
  else {
    if (idOf(btns[0]) !== 'kMute') fail('gamekit', 'R1', `mute (#kMute) must be FIRST in #kHud; found #${idOf(btns[0])} first`);
    for (const b of btns) if (!hasTitle(b)) fail('gamekit', 'R2', `#${idOf(b)} has no title tooltip`);
    for (const id of ['kMovie', 'kShare']) {
      const b = btns.find((x) => idOf(x) === id);
      if (!b) fail('gamekit', 'R3', `expected button #${id} not found in #kHud`);
      else if (!hasVisibleLabel(b)) fail('gamekit', 'R3', `#${id} needs a visible text label`);
    }
  }
}

// helpinghands: mute is a repeated .mute-btn on each screen, not one cluster
{
  const html = readFileSync('public/helpinghands/index.html', 'utf8');
  const mutes = html.match(/class="mute-btn"[^>]*/g) || [];
  if (mutes.length < 3) fail('helpinghands', 'R1', `expected mute buttons on screens, found ${mutes.length}`);
  for (const m of mutes) if (!/title="/.test(m)) fail('helpinghands', 'R2', 'a .mute-btn is missing its title');
}

// Nilu's World (React HUD)
{
  const src = readFileSync('components/game/BelusWorld/ui/HUD.tsx', 'utf8');
  const cluster = src.split('right-4 top-4')[1] ?? '';
  const firstOnClick = (cluster.match(/onClick=\{(\w+)/) || [])[1];
  if (firstOnClick !== 'onToggleMute') fail('nilus-world', 'R4', `mute must be the first button in the top-right cluster (found onClick={${firstOnClick}})`);
  // a button is fine if it has an aria-label OR visible text content (menu rows)
  const buttons = [...cluster.matchAll(/<button[\s\S]*?<\/button>/g)].map((b) => b[0]);
  for (const b of buttons) {
    const visible = b.replace(/<[^>]*>/g, ' ').replace(/\{[^}]*\}/g, ' ')
      .replace(/[\p{Extended_Pictographic}️‍]/gu, '').trim();
    if (!/aria-label=/.test(b) && visible.length < 3)
      fail('nilus-world', 'R4', 'a HUD button has neither aria-label nor visible text');
  }
}

// Offline coverage: every game folder the build minifies must be cached by the
// service worker, so no future game silently ships without offline support.
{
  const sw = readFileSync('public/sw.js', 'utf8');
  const dirs = (readFileSync('scripts/minify-games.mjs', 'utf8').match(/GAME_DIRS = \[([^\]]+)\]/) || [])[1] || '';
  for (const m of dirs.matchAll(/'([a-z0-9-]+)'/g)) {
    if (!sw.includes(m[1])) fail('sw.js', 'R5', `game folder '${m[1]}' missing from GAME_RX in public/sw.js (no offline cache)`);
  }
}

if (errors.length) {
  console.error('\nGame-control standard violations:\n' + errors.join('\n'));
  console.error('\nThe standard lives in scripts/check-game-controls.mjs — fix the game or (deliberately) update the rule.\n');
  process.exit(1);
}
console.log('check-game-controls: all 7 games + the game kit pass the control standard ✓');
