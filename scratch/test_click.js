import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:4000/circle-of-friends', { waitUntil: 'networkidle2' });
  
  console.log("Page loaded. Looking for accordion buttons...");
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons.`);
  
  // Find an accordion button
  const accordionBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('The "Trunk of Friendship" Award') || b.textContent.includes('Winner'));
  });
  
  if (accordionBtn) {
    console.log("Clicking accordion...");
    await accordionBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.includes('EntryCardItem') || html.includes('parchment-bg')) {
      console.log("It expanded!");
    } else {
      console.log("It did NOT expand.");
    }
  } else {
    console.log("Could not find accordion button.");
  }

  await browser.close();
})();
