#!/usr/bin/env node
/**
 * Squares, trims and shrinks the festival shop logos.
 *
 * Shops send whatever their designer gave them — a 4000px JPEG with a white
 * background, a wide banner, a screenshot. This makes all of them the same:
 * transparent-trimmed, centred on a square, 256x256, WebP, ~15-30 KB each.
 *
 *   node scripts/festival-logos.mjs
 *
 * It reads and writes public/festival/logos/ in place: originals are moved to
 * public/festival/logos/_originals/ so nothing is ever destroyed.
 *
 * Sixteen logos at 30 KB is under half a megabyte — small enough that the card
 * loads instantly on a phone, and small enough that it never matters what the
 * storage limits are, wherever they end up living.
 */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const DIR = 'public/festival/logos';
const KEEP = path.join(DIR, '_originals');
const SIZE = 256;
const MAX_KB = 60;

// A shop's original is moved into _originals/ and a .webp is written in its
// place. On a second run that .webp must NOT be treated as a fresh input, or
// the rename collides with the backup already sitting there.
const backedUp = fs.existsSync(KEEP)
  ? new Set(fs.readdirSync(KEEP).map((f) => path.basename(f, path.extname(f))))
  : new Set();
const inputs = fs.readdirSync(DIR)
  .filter((f) => /\.(png|jpe?g|webp|gif|bmp)$/i.test(f))
  .filter((f) => !backedUp.has(path.basename(f, path.extname(f))));
if (!inputs.length) { console.log('No logos to process in ' + DIR); process.exit(0); }
fs.mkdirSync(KEEP, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setContent('<body></body>');

for (const file of inputs) {
  const src = path.join(DIR, file);
  const b64 = fs.readFileSync(src).toString('base64');
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'jpeg' : ext;

  const out = await page.evaluate(async (data, mimeType, size) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = `data:image/${mimeType};base64,` + data; });

    // measure the real content so banner-shaped logos don't end up tiny
    const m = document.createElement('canvas');
    m.width = img.naturalWidth; m.height = img.naturalHeight;
    const mg = m.getContext('2d');
    mg.drawImage(img, 0, 0);
    const d = mg.getImageData(0, 0, m.width, m.height).data;
    let x0 = m.width, y0 = m.height, x1 = 0, y1 = 0;
    for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
      const i = (y * m.width + x) * 4;
      const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (d[i + 3] > 24 && lum < 244) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    if (x1 <= x0 || y1 <= y0) { x0 = 0; y0 = 0; x1 = m.width - 1; y1 = m.height - 1; }
    const w = x1 - x0 + 1, h = y1 - y0 + 1;

    // centre the trimmed content on a square with a little breathing room
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    const pad = size * 0.06;
    const scale = Math.min((size - pad * 2) / w, (size - pad * 2) / h);
    const dw = w * scale, dh = h * scale;
    g.drawImage(img, x0, y0, w, h, (size - dw) / 2, (size - dh) / 2, dw, dh);

    for (const q of [0.9, 0.8, 0.7, 0.6]) {
      const url = c.toDataURL('image/webp', q);
      if (url.length * 0.75 < 60 * 1024) return url;
    }
    return c.toDataURL('image/webp', 0.5);
  }, b64, mime, SIZE);

  const buf = Buffer.from(out.split(',')[1], 'base64');
  const dest = path.join(DIR, path.basename(file, path.extname(file)) + '.webp');
  fs.renameSync(src, path.join(KEEP, file));
  fs.writeFileSync(dest, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`  ${file}  →  ${path.basename(dest)}  ${kb} KB${buf.length / 1024 > MAX_KB ? '  ⚠ still large' : ''}`);
}

await browser.close();
console.log(`\nDone. Originals kept in ${KEEP}.`);
console.log('Remember to set "logo": "<name>.webp" on the shop in data/festival.json.');
