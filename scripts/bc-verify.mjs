// Block Craft Modern-skin verification gate.
// Serves public/ and drives the real game in headless Chrome.
// Asserts: world builds, culling never hides a VISIBLE block, digging re-exposes
// buried neighbours, sun ball agrees with the light, and measures ms/placement.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');
const ROOT = new URL('../public', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };

const srv = http.createServer(async (req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  if (p === '/games' || p === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<title>stub</title>'); return; }
  try {
    const d = await readFile(join(ROOT, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(d);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(8901, r));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 768 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });
page.on('requestfailed', (r) => errors.push('404? ' + r.url()));
page.on('response', (r) => { if (r.status() === 404) errors.push('404 ' + r.url()); });

await page.evaluateOnNewDocument(() => { try { localStorage.setItem('abcSkin', 'modern'); } catch (e) {} });
await page.goto('http://localhost:8901/blockcraft/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate(() => document.getElementById('playBtn')?.click());
await new Promise((r) => setTimeout(r, 3500));

const out = await page.evaluate(() => {
  const W = window.ABC && window.ABC.world;
  if (!W) return { fatal: 'ABC.world missing' };
  const R = { skin: window.ABC.SKIN, modern: !!window.ABC.MODERN };

  const meshes = W.blockMeshes();
  R.drawn = meshes.reduce((a, m) => a + m.count, 0);

  // ---- INVARIANT 1: every drawn instance corresponds to a live block of that type
  let ghosts = 0;
  for (const m of meshes) {
    const t = m.userData.type;
    for (const p of (m.userData.positions || [])) if (W.get(p[0], p[1], p[2]) !== t) ghosts++;
  }
  R.ghostInstances = ghosts;

  // ---- INVARIANT 2 (the culling safety property): no block that a player can
  // SEE may be missing an instance. Sample a column of air->ground boundaries
  // around spawn: any block with at least one empty neighbour must be drawn.
  const drawnSet = new Set();
  for (const m of meshes) for (const p of (m.userData.positions || [])) drawnSet.add(p[0] + ',' + p[1] + ',' + p[2]);
  let exposedButMissing = 0, checked = 0;
  const N = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for (let x = -24; x <= 24; x++) for (let z = -24; z <= 24; z++) for (let y = W.MIN_Y; y <= 12; y++) {
    const t = W.get(x, y, z); if (!t) continue;
    checked++;
    const exposed = N.some(([dx, dy, dz]) => !W.get(x + dx, y + dy, z + dz) && y + dy >= W.MIN_Y);
    if (exposed && !drawnSet.has(x + ',' + y + ',' + z)) exposedButMissing++;
  }
  R.blocksChecked = checked;
  R.exposedButMissing = exposedButMissing;

  // ---- INVARIANT 3: digging a surface block re-exposes the one beneath it
  let sx = 3, sz = 3, sy = null;
  for (let y = 12; y >= W.MIN_Y; y--) if (W.get(sx, y, sz)) { sy = y; break; }
  R.digTest = 'skipped';
  if (sy != null && sy - 1 >= W.MIN_Y && W.get(sx, sy - 1, sz)) {
    W.remove(sx, sy, sz); W.flush();
    const below = W.get(sx, sy - 1, sz);
    const shown = W.blockMeshes().some((m) => (m.userData.positions || [])
      .some((p) => p[0] === sx && p[1] === sy - 1 && p[2] === sz));
    R.digTest = shown ? 'pass' : ('FAIL: ' + below + ' at ' + sx + ',' + (sy - 1) + ',' + sz + ' hidden after dig');
    W.set(sx, sy, sz, 'grass'); W.flush();
  }

  // ---- INVARIANT 4: sun ball lies along the light's direction
  const sc = W.getScene();
  let sun = null, ball = null;
  sc.traverse((o) => {
    if (o.isDirectionalLight) sun = o;
    if (o.isMesh && o.geometry && o.geometry.type === 'SphereGeometry' && o.material && o.material.fog === false) ball = o;
  });
  if (sun && ball) {
    const lp = sun.position.clone().sub(sun.target.position).normalize();
    const bp = ball.position.clone().sub(sun.target.position).normalize();
    R.sunDot = +lp.dot(bp).toFixed(4);
    R.sunElevationDeg = +(Math.asin(lp.y) * 180 / Math.PI).toFixed(1);
    R.shadowNormalBias = sun.shadow.normalBias;
    R.shadowRadius = sun.shadow.camera.right;
  } else R.sunDot = 'no sun/ball found';

  // ---- INVARIANT 5: crafted build blocks are on real PBR surfaces
  const mats = W.materials;
  const want = ['plank','brick','stone','wood','sand','snow','dirt','grass','red','blue','white','slab','stair','wedge','pillar','glass','pane'];
  R.noNormalMap = want.filter((id) => {
    const m = mats[id]; if (!m) return false;
    const one = Array.isArray(m) ? m[0] : m;
    return !one.normalMap || !one.roughnessMap;
  });

  // ---- PERF: 150 place+dig cycles high in the air (no terrain interaction)
  const cells = [];
  for (let i = 0; i < 150; i++) cells.push([-20 + (i % 15), 14 + ((i / 15) | 0), -20]);
  const t0 = performance.now();
  let did = 0;
  for (const c of cells) { if (W.set(c[0], c[1], c[2], 'plank')) did++; W.flush(); }
  for (const c of cells) { if (W.remove(c[0], c[1], c[2])) did++; W.flush(); }
  R.msPerOp = +((performance.now() - t0) / Math.max(1, did)).toFixed(3);
  R.opsCounted = did;
  // ---- PERF 2: digging GRASS (the path that used to rebuild every tuft)
  const grass = [];
  for (let x = -18; x <= -4 && grass.length < 40; x++)
    for (let z = -18; z <= -4 && grass.length < 40; z++) {
      for (let y = 8; y >= 0; y--) if (W.get(x, y, z) === 'grass') { grass.push([x, y, z]); break; }
    }
  const t1 = performance.now();
  let dug = 0;
  for (const c of grass) { if (W.remove(c[0], c[1], c[2])) dug++; W.flush(); }
  R.msPerGrassDig = +((performance.now() - t1) / Math.max(1, dug)).toFixed(3);
  R.grassDug = dug;

  return R;
});

await page.evaluate(() => {
  for (const el of document.querySelectorAll('.dlg, #dialog, .overlay, #toasts, #hud, .modal, [id*=dlg], [class*=dlg]')) el.style.display = 'none';
  if (window.ABC && ABC.setLook) ABC.setLook(0.6, -0.15);
});
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: '/private/tmp/claude-501/-Users-aj-Desktop-ABE-Website/2c1a860c-07f1-40e5-a3e7-fa6ec646a826/scratchpad/bc-modern.png' });
await browser.close();
srv.close();

console.log(JSON.stringify(out, null, 2));
if (errors.length) console.log('\nPAGE ERRORS:\n' + errors.slice(0, 8).join('\n'));

const fails = [];
if (out.fatal) fails.push(out.fatal);
if (out.skin !== 'modern') fails.push('not running the modern skin (got ' + out.skin + ')');
if (out.ghostInstances > 0) fails.push(out.ghostInstances + ' instances drawn for blocks that do not exist');
if (out.exposedButMissing > 0) fails.push(out.exposedButMissing + ' VISIBLE blocks have no instance (culling is eating real geometry)');
if (out.digTest !== 'pass' && out.digTest !== 'skipped') fails.push(out.digTest);
if (typeof out.sunDot === 'number' && out.sunDot < 0.999) fails.push('sun ball not aligned with light (dot=' + out.sunDot + ')');
if (out.noNormalMap && out.noNormalMap.length) fails.push('no normal/roughness map on: ' + out.noNormalMap.join(', '));
const real = errors.filter((e) => !/favicon|supabase/i.test(e));
if (real.length) fails.push(real.length + ' page errors: ' + real[0]);

if (fails.length) { console.error('\nFAIL:\n' + fails.map((f) => '  x ' + f).join('\n')); process.exit(1); }
console.log('\nPASS');
