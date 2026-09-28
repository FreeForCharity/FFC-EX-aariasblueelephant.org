#!/usr/bin/env node
/* © 2026 Aaria's Blue Elephant · aariasblueelephant.org
   OUR FIRST YEAR — frame-exact export.

   public/story/film.js exposes renderAt(ms) as a PURE function of the clock,
   so this script can step the film one frame at a time and save each one. The
   result is perfectly paced no matter how fast the machine is — unlike a
   screen recording, which drops frames when the laptop gets busy.

     node scripts/story-frames.mjs                    # whole film, 30fps
     node scripts/story-frames.mjs --fps 60
     node scripts/story-frames.mjs --scene book       # just one chapter
     node scripts/story-frames.mjs --from 12 --to 20  # seconds
     node scripts/story-frames.mjs --stills           # one PNG per chapter
     node scripts/story-frames.mjs --lang es          # the Spanish cut

   Then, to make the video (ffmpeg, once):
     ffmpeg -framerate 30 -i out/story/frame_%05d.png \
            -c:v libx264 -pix_fmt yuv420p -crf 17 out/our-first-year.mp4

   Built by Aaria and her Friends 💙 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes('--' + n);

const FPS = Number(flag('fps', 30));
const OUT = path.resolve(ROOT, flag('out', 'out/story'));
const LANG = flag('lang', 'en');
const STILLS = has('stills');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.txt': 'text/plain', '.json': 'application/json' };

function serve() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(PUBLIC, rel === '/' ? '/index.html' : rel);
      if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => resolve({ server: s, port: s.address().port }));
  });
}

const { server, port } = await serve();
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=1'] });
const page = await browser.newPage();
await page.setViewport({ width: 1960, height: 1240, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('  page error:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('  console:', m.text()); });

await page.evaluateOnNewDocument((lang) => { try { localStorage.setItem('abe.lang', lang); } catch (e) {} }, LANG);
await page.goto(`http://127.0.0.1:${port}/story/index.html?clean=1&paused=1`, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForFunction('!!window.ABEStory');
await page.waitForFunction('window.ABEArt && window.ABEArt.assetsReady()', { timeout: 20000 });

const info = await page.evaluate(() => ({
  duration: window.ABEStory.DURATION,
  starts: window.ABEStory.STARTS,
  ids: window.ABEStory.scenes.map((s) => s.id),
  durs: window.ABEStory.scenes.map((s) => s.dur),
}));

/* Warm the canvas before capturing anything: the browser can rasterize the
   first frames on a different backend before it settles, and frame 1 of an
   export should look exactly like frame 1 rendered any other time. */
await page.evaluate((d) => {
  for (const t of [0, 1000, d * 250, d * 750]) window.ABEStory.renderAt(t);
}, info.duration);

fs.mkdirSync(OUT, { recursive: true });
const grab = async (ms) => {
  const data = await page.evaluate((t) => {
    window.ABEStory.renderAt(t);
    return window.ABEStory.canvas.toDataURL('image/png');
  }, ms);
  return Buffer.from(data.split(',')[1], 'base64');
};

if (STILLS) {
  // one representative frame per chapter, for a quick look
  for (let i = 0; i < info.ids.length; i++) {
    const ms = (info.starts[i] + info.durs[i] * 0.55) * 1000;
    fs.writeFileSync(path.join(OUT, `still_${String(i).padStart(2, '0')}_${info.ids[i]}.png`), await grab(ms));
    process.stdout.write(`  ${info.ids[i]}\n`);
  }
} else {
  let from = Number(flag('from', 0)), to = Number(flag('to', info.duration));
  const sc = flag('scene', null);
  if (sc) { const i = info.ids.indexOf(sc); if (i < 0) throw new Error('no chapter called ' + sc); from = info.starts[i]; to = from + info.durs[i]; }
  const total = Math.round((to - from) * FPS);
  console.log(`rendering ${total} frames  (${from.toFixed(1)}s → ${to.toFixed(1)}s @ ${FPS}fps, ${LANG})`);
  for (let f = 0; f < total; f++) {
    fs.writeFileSync(path.join(OUT, `frame_${String(f).padStart(5, '0')}.png`), await grab((from + f / FPS) * 1000));
    if (f % (FPS * 5) === 0) process.stdout.write(`  ${(f / FPS).toFixed(0)}s / ${(to - from).toFixed(0)}s\n`);
  }
  console.log('\nffmpeg -framerate ' + FPS + ' -i ' + path.relative(ROOT, OUT) + '/frame_%05d.png \\');
  console.log('       -c:v libx264 -pix_fmt yuv420p -crf 17 out/our-first-year.mp4');
}

console.log('frames → ' + path.relative(ROOT, OUT));
await browser.close();
server.close();
