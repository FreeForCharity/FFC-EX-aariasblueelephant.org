import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4000/circle-of-friends', { waitUntil: 'networkidle2' });
  
  const accordionBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('The "Trunk of Friendship" Award'));
  });
  
  if (accordionBtn) {
    await accordionBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.includes('No entries for this award yet.')) {
      console.log("It expanded! (Empty state)");
    } else if (html.includes('parchment-bg')) {
      console.log("It expanded! (Has entries)");
    } else {
      console.log("Did NOT expand at all.");
    }
  }

  await browser.close();
})();
