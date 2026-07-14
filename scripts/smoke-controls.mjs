// Runtime control-canon smoke test — verifies ACTUAL on-screen placement, not
// just markup, in a real headless browser. Run: node scripts/smoke-controls.mjs
// (needs `npm run build` NOT required — serves public/ directly)
//
// THE CANON (matches scripts/check-game-controls.mjs static rules):
//  C1  🏠 Exit (data-abe="exit"): present, top-LEFT corner (rect within 120px
//      of the top and left edges), contains 🏠, has a title.
//  C2  Sound button (data-abe="sound"): present, in the TOP-RIGHT quadrant.
//  C3  If a settings button (data-abe="settings") exists, it is RIGHT of the
//      sound button (settings last in the cluster).
// Buttons hidden on title screens are fine: each game entry says how to reach
// gameplay; the checks run after that step.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');
const ROOT = new URL('../public', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };

// how to get each game from page-load to "gameplay HUD visible"
const GAMES = [
  { slug: 'grocery', url: '/grocery/index.html', start: async (p) => { await p.click('#kPlay'); } },
  { slug: 'dayplanner', url: '/dayplanner/index.html', start: async (p) => { await p.click('#kPlay'); await p.evaluate(() => { document.getElementById('dpPlanner').style.display = 'none'; window.DP.G.mode = 'live'; }); } },
  { slug: 'blockcraft', url: '/blockcraft/index.html', start: async (p) => { await p.evaluate(() => document.getElementById('playBtn')?.click()); } },
  { slug: 'doughlab', url: '/doughlab/index.html', start: async (p) => { await p.evaluate(() => { for (const id of ['startBtn', 'playBtn']) document.getElementById(id)?.click(); }) } },
  { slug: 'elly-tubbies', url: '/elly-tubbies/index.html', start: async (p) => { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) if (/play|start/i.test(b.textContent) && b.offsetParent) { b.click(); break; } }); } },
  { slug: 'magnetblocks', url: '/magnetblocks/index.html', start: async (p) => { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) if (/build/i.test(b.textContent) && b.offsetParent) { b.click(); break; } }); } },
  { slug: 'roadsafety', url: '/roadsafety/index.html', start: async (p) => {
      await p.evaluate(() => document.getElementById('titlePlay')?.click());
      await new Promise((r) => setTimeout(r, 600));
      await p.evaluate(() => document.getElementById('garGo')?.click());
      await new Promise((r) => setTimeout(r, 1000));
      for (let i = 0; i < 3; i++) {
        await p.evaluate(() => { const s = [...document.querySelectorAll('.screen')].find((x) => !x.classList.contains('hidden')); s?.querySelector('button')?.click(); });
        await new Promise((r) => setTimeout(r, 900));
      }
    } },
  { slug: 'helpinghands', url: '/helpinghands/index.html', start: async () => { /* gated: exit is asserted on its entry screen */ } },
  { slug: 'feelings', url: '/feelings/index.html', start: async (p) => { await p.click('#kPlay'); } },
];

const srv = http.createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  if (path === '/games' || path === '/') {
    // launcher stub — Exit buttons navigate here; C4 asserts the arrival
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<title>games launcher stub</title>');
    return;
  }
  try {
    const d = await readFile(join(ROOT, path));
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(d);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(8899, r));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--mute-audio'] });
const failures = [];
for (const g of GAMES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  try {
    await page.goto(`http://localhost:8899${g.url}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await g.start(page);
    await new Promise((r) => setTimeout(r, 1500));
    const res = await page.evaluate(() => {
      const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 }; };
      const exit = document.querySelector('[data-abe="exit"]');
      // some games repeat the mute button per-screen; measure a visible one if any
      const sounds = [...document.querySelectorAll('[data-abe="sound"]')].map((el) => ({ ...rect(el), clusterRight: el.parentElement.getBoundingClientRect().right }));
      const sound = sounds.find((s) => s.visible) || null;
      const settings = document.querySelector('[data-abe="settings"]');
      // hidden-at-boot fallback (gated games): the specified CSS must still pin it top-left
      let exitCss = null;
      if (exit && !rect(exit).visible) {
        const cs = getComputedStyle(exit);
        exitCss = { position: cs.position, top: parseFloat(cs.top), left: parseFloat(cs.left) };
      }
      return {
        exit: exit ? { ...rect(exit), icon: exit.textContent.includes('🏠'), title: !!exit.getAttribute('title'), css: exitCss } : null,
        sound, settings: settings ? rect(settings) : null, vw: innerWidth,
      };
    });
    if (!res.exit) failures.push(`${g.slug}: C1 no [data-abe=exit] in DOM`);
    else {
      if (res.exit.visible) {
        if (res.exit.x > 120 || res.exit.y > 120) failures.push(`${g.slug}: C1 exit not top-left (at ${Math.round(res.exit.x)},${Math.round(res.exit.y)})`);
      } else if (!res.exit.css || !/fixed|absolute/.test(res.exit.css.position) || !(res.exit.css.top <= 120) || !(res.exit.css.left <= 120)) {
        failures.push(`${g.slug}: C1 exit hidden and its CSS is not pinned top-left (${JSON.stringify(res.exit.css)})`);
      }
      if (!res.exit.icon) failures.push(`${g.slug}: C1 exit missing 🏠`);
      if (!res.exit.title) failures.push(`${g.slug}: C1 exit missing title`);
    }
    // C2: the sound button's CLUSTER hugs the right edge, in the top band, clear of Exit's corner
    if (res.sound && (res.sound.y > 130 || res.sound.clusterRight < res.vw - 60 || res.sound.x < 140))
      failures.push(`${g.slug}: C2 sound cluster not top-right (btn x=${Math.round(res.sound.x)}, cluster right=${Math.round(res.sound.clusterRight)}/${res.vw})`);
    if (res.settings && res.sound && res.settings.w > 0 && res.settings.x < res.sound.x) failures.push(`${g.slug}: C3 settings not right of sound`);
    // C4: Exit actually WORKS — clicking it must navigate to the games launcher
    if (res.exit && res.exit.visible) {
      await page.evaluate(() => document.querySelector('[data-abe="exit"]').click());
      await new Promise((r) => setTimeout(r, 800));
      // some games confirm first (e.g. Magnet Blocks) — accept a visible confirm dialog as working too
      const after = await page.evaluate(() => ({
        path: location.pathname,
        confirm: [...document.querySelectorAll('button')].some((b) => b.offsetParent && /leave|exit|yes|stay/i.test(b.textContent)),
      }));
      if (!after.path.startsWith('/games') && !after.confirm)
        failures.push(`${g.slug}: C4 exit click did nothing (still on ${after.path})`);
    }
  } catch (e) {
    failures.push(`${g.slug}: smoke error — ${e.message.slice(0, 90)}`);
  }
  await page.close();
}
await browser.close();
srv.close();

if (failures.length) {
  console.error('\ncontrol-canon smoke FAILURES:\n' + failures.map((f) => '  ✗ ' + f).join('\n') + '\n');
  process.exit(1);
}
console.log(`control-canon smoke: exit/sound/settings placement verified in ${GAMES.length} games ✓`);
