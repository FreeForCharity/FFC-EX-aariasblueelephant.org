// Post-build: minify the games in dist/ and stamp a copyright banner.
// Runs AFTER vite build + prerender, touches ONLY dist/ — source stays readable.
// Mangling is function-local only (toplevel:false): the games share globals
// (ABC.*, MB.*, HH.*) across <script> files, so top-level names must survive.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { minify as terser } from 'terser';
import { minify as htmlMinify } from 'html-minifier-terser';

const DIST = new URL('../dist/', import.meta.url).pathname;
const GAME_DIRS = ['blockcraft', 'doughlab', 'elly-tubbies', 'helpinghands',
  'magnetblocks', 'roadsafety', 'craft3d', 'grocery', 'dayplanner', 'feelings', 'rhythm', 'flying', 'gamekit'];

const BANNER = `/*! © ${new Date().getFullYear()} Aaria's Blue Elephant · aariasblueelephant.org · All rights reserved.
 * Built by Aaria and her Friends 💙 — please don't copy; ask us instead: buddy@aariasblueelephant.org */`;

const TERSER_OPTS = {
  compress: { defaults: true, passes: 2 },
  mangle: { toplevel: false }, // keep cross-file globals intact
  format: { comments: false, preamble: BANNER },
};

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let jsN = 0, htmlN = 0, saved = 0;
for (const g of GAME_DIRS) {
  const root = join(DIST, g);
  for await (const file of walk(root)) {
    const ext = extname(file);
    // skip vendored libs that are already minified
    if (/\.min\.js$/.test(file) || file.includes('/lib/')) continue;
    if (ext === '.js') {
      const src = await readFile(file, 'utf8');
      const out = await terser(src, TERSER_OPTS);
      if (!out.code) throw new Error(`terser produced no output for ${file}`);
      saved += src.length - out.code.length;
      await writeFile(file, out.code);
      jsN++;
    } else if (ext === '.html') {
      const src = await readFile(file, 'utf8');
      const out = await htmlMinify(src, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: TERSER_OPTS, // inline <script> games (doughlab, elly-tubbies)
      });
      const stamped = out.replace(/<head>/i, `<head><!-- ${BANNER.replace(/\/\*!|\*\//g, '').trim()} -->`);
      saved += src.length - stamped.length;
      await writeFile(file, stamped);
      htmlN++;
    }
  }
}
console.log(`minify-games: ${jsN} js + ${htmlN} html minified, ${(saved / 1024).toFixed(0)}KB saved`);
