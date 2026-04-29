import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:4000/circle-of-friends', { waitUntil: 'networkidle2' });
  
  // Inject mock data to IDB
  await page.evaluate(async () => {
    const entry = {
      id: 'test-123',
      name: 'Test',
      grade: '1',
      school: 'Altamont',
      teacher: 'Mr T',
      category: 'The "Elephant Mindset" Award',
      content: 'This is some text',
      media: [],
      priority: 1,
      date: new Date().toISOString()
    };
    
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('ABE_FriendsDB', 1);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    
    await new Promise((res, rej) => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      store.put(entry);
      tx.oncomplete = res;
    });
  });
  
  // Reload page to load from IDB
  await page.reload({ waitUntil: 'networkidle2' });
  
  // Try to click "Elephant Mindset"
  const accordionBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('The "Elephant Mindset" Award'));
  });
  
  if (accordionBtn) {
    console.log("Found Mindset button. Clicking...");
    await accordionBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.includes('Test')) {
      console.log("It expanded successfully with entries!");
    } else {
      console.log("Did NOT expand.");
    }
  }

  await browser.close();
})();
