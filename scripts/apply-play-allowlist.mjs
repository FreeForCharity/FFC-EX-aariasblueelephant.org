// Applies supabase/create_game_play_counts.sql to the live database, then proves
// it took by reading the function definitions back.
//
// WHY THIS EXISTS: the play-counting allowlist lives inside a Postgres function,
// not in this repo. Every game before softball needed someone to remember to
// paste SQL into the Supabase editor, and softball shipped without it — the RPC
// returns void, so the ping got a 200 and the game silently went uncounted for
// its whole launch. Now merging to main is enough.
//
// Idempotent: create-or-replace / if-not-exists throughout, so re-running is a
// no-op. Run: node scripts/apply-play-allowlist.mjs [--dry-run]
import { readFileSync } from 'node:fs';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'joclqxgedhdgslxnovxz';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const SQL_FILE = 'supabase/create_game_play_counts.sql';
const dryRun = process.argv.includes('--dry-run');

// the slugs games actually send — same extraction the R6 rule in
// check-game-controls.mjs uses, so the two can never disagree
function repoSlugs() {
  const dirs = (readFileSync('scripts/minify-games.mjs', 'utf8').match(/GAME_DIRS = \[([^\]]+)\]/) || [])[1] || '';
  const out = new Set();
  for (const m of dirs.matchAll(/'([a-z0-9-]+)'/g)) {
    if (m[1] === 'gamekit') continue;
    let html;
    try { html = readFileSync(`public/${m[1]}/index.html`, 'utf8'); } catch { continue; }
    // quote style varies between games — grocery/dayplanner use "double"
    const slug = (html.match(/slug:\s*['"]([a-z0-9-]+)['"]/) || html.match(/\bg:\s*['"]([a-z0-9-]+)['"]/) || [])[1];
    if (slug) out.add(slug);
  }
  try {
    const react = readFileSync('components/game/BelusWorld/index.tsx', 'utf8');
    const m = react.match(/record_game_play',\s*\{\s*g:\s*['"]([a-z0-9-]+)['"]/);
    if (m) out.add(m[1]);
  } catch { /* React game is optional */ }
  return [...out];
}

async function query(sql) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Management API ${res.status}: ${body.slice(0, 400)}`);
  try { return JSON.parse(body); } catch { return body; }
}

const slugs = repoSlugs();
console.log(`play-allowlist: ${slugs.length} game slugs in the repo — ${slugs.join(', ')}`);

if (!TOKEN) {
  // Warn loudly rather than failing: a missing secret must not break the deploy,
  // but it must never scroll past unnoticed either (that is the original bug).
  console.log('::warning title=Play allowlist not applied::SUPABASE_ACCESS_TOKEN is not set, so ' +
    `${SQL_FILE} was NOT applied to the database. New games will not be counted until it is.`);
  process.exit(0);
}
if (dryRun) { console.log(`play-allowlist: dry run — would apply ${SQL_FILE}`); process.exit(0); }

await query(readFileSync(SQL_FILE, 'utf8'));
console.log(`play-allowlist: applied ${SQL_FILE}`);

// prove it — read the live function bodies back and check every slug is allowed
const check = await query(`
  select p.proname, pg_get_functiondef(p.oid) as def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('record_game_play','record_game_time');`);
const rows = Array.isArray(check) ? check : check.rows || [];
if (rows.length !== 2) throw new Error(`expected 2 functions live, found ${rows.length}`);

const missing = [];
for (const r of rows) for (const s of slugs) if (!r.def.includes(`'${s}'`)) missing.push(`${r.proname} is missing '${s}'`);
if (missing.length) throw new Error(`allowlist did not take:\n  ${missing.join('\n  ')}`);

console.log(`play-allowlist: verified live — both functions allow all ${slugs.length} slugs ✓`);
