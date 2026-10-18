import puppeteer from 'puppeteer';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3055;
const distPath = path.resolve(__dirname, 'dist');

// Routes to pre-render
const routesToPrerender = [
    '/',
    '/about',
    '/volunteer',
    '/privacy-policy',
    '/donate',
    '/wheel',
    '/resources',
    '/resources/understanding',
    '/resources/interventions',
    '/resources/screening',
    '/InclusionFestival/printing',
    // festival pages get shared on Facebook: a real page (200, not the 404
    // fallback) so link previews work, each with its own preview card
    '/InclusionFestival',
    '/InclusionFestival/join',
    '/InclusionFestival/youngfounders',
    '/InclusionFestival/youngfounders/join'
];

const SITE = 'https://aariasblueelephant.org';
const FESTIVAL = 'Inclusion Festival & Special Needs Resource Fair';
const YOUNG = {
    title: 'Young Founders — get your business featured | Inclusion Festival',
    description: 'Kid-run business (under 18)? Get a free spot on our Inclusion Festival page: your offer for festival families, a QR sign for your stall, online through Nov 30, and an optional video. A parent signs up in 2 minutes.',
    image: '/og-young-founders.jpg', size: 1080,
};
/** what a shared link shows on Facebook and elsewhere, per page */
const previews = {
    '/InclusionFestival': {
        title: `${FESTIVAL} — Sun, Nov 1 · Mountain House`,
        description: 'Special offers from local businesses and young founders for festival families, all through November. Free for families and businesses.',
    },
    '/InclusionFestival/join': {
        title: 'Join the Inclusion Festival — free for local businesses',
        description: 'Offer festival families something special through November. Free, two minutes, no account: a QR sign for your counter and a personal code for online orders.',
    },
    '/InclusionFestival/youngfounders': YOUNG,
    '/InclusionFestival/youngfounders/join': YOUNG,
};

/** swap the site-wide preview tags for a page's own */
const withPreview = (html, route, p) => {
    const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const set = (attr, key, value) => {
        html = html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${esc(value)}$2`);
    };
    const image = SITE + (p.image || '/og-image.jpg');
    set('property', 'og:url', SITE + route);
    set('property', 'og:title', p.title);
    set('property', 'og:description', p.description);
    set('property', 'og:image', image);
    set('property', 'og:image:secure_url', image);
    set('property', 'og:image:width', p.size || 1024);
    set('property', 'og:image:height', p.size || 1024);
    set('name', 'twitter:url', SITE + route);
    set('name', 'twitter:title', p.title);
    set('name', 'twitter:description', p.description);
    set('name', 'twitter:image', image);
    return html.replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`);
};

async function prerender() {
    console.log('Starting prerender process...');

    // Start server
    const app = express();

    // Serve static files from dist
    app.use(express.static(distPath));

    // Fallback to index.html for CSR routes
    app.use((req, res, next) => {
        if (req.path.includes('.')) return next();
        res.sendFile(path.resolve(distPath, 'index.html'));
    });

    const server = app.listen(PORT, async () => {
        console.log(`Server running at http://localhost:${PORT}`);

        try {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            for (const route of routesToPrerender) {
                const page = await browser.newPage();
                const url = `http://localhost:${PORT}${route}`;
                console.log(`Prerendering ${url}...`);

                // networkidle0 can hang on analytics keep-alives — retry with a looser wait
                try {
                    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
                } catch (e) {
                    console.warn(`  networkidle0 timed out for ${route}, retrying with networkidle2…`);
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
                }

                // Ensure animations/hydration complete
                await new Promise(r => setTimeout(r, 1500));

                let html = await page.content();
                await page.close();
                if (previews[route]) html = withPreview(html, route, previews[route]);

                // Save to file
                const routePath = route === '/' ? 'index.html' : `${route}/index.html`;
                const fullPath = path.resolve(distPath, routePath.replace(/^\//, ''));

                // Ensure directory exists
                await fs.mkdir(path.dirname(fullPath), { recursive: true });

                await fs.writeFile(fullPath, html);
                console.log(`Saved ${fullPath}`);
            }

            // Create 404.html from index.html for GH Pages fallback
            const indexHtml = await fs.readFile(path.resolve(distPath, 'index.html'), 'utf-8');
            await fs.writeFile(path.resolve(distPath, '404.html'), indexHtml);
            console.log('Created 404.html for GitHub Pages fallback');

            await browser.close();
            console.log('Prerendering completed successfully!');
        } catch (error) {
            console.error('Error during prerendering:', error);
            process.exit(1);
        } finally {
            server.close();
        }
    });
}

prerender();
