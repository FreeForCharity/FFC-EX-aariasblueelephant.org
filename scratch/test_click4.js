import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:4000/circle-of-friends', { waitUntil: 'networkidle2' });
  
  // Inject mock data to IDB so we have categories
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
  
  await page.reload({ waitUntil: 'networkidle2' });
  
  // Add an event listener to document to trace click
  await page.evaluate(() => {
    document.addEventListener('click', (e) => {
      console.log('Document clicked on:', e.target.tagName, e.target.className);
    });
  });

  const accordionBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('The "Elephant Mindset" Award'));
  });
  
  if (accordionBtn) {
    console.log("Clicking button...");
    await accordionBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    const isExpanded = await page.evaluate(() => {
      const html = document.body.innerHTML;
      return html.includes('EntryCardItem') || html.includes('parchment-bg') || html.includes('Test');
    });
    console.log("Did it expand?", isExpanded);
  }

  await browser.close();
})();
