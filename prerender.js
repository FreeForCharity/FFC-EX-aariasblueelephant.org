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
    '/wheel'
];

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

                await page.goto(url, { waitUntil: 'networkidle0' });

                // Ensure animations/hydration complete
                await new Promise(r => setTimeout(r, 1500));

                const html = await page.content();
                await page.close();

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
