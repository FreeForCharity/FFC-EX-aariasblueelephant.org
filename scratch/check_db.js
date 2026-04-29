import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4000/circle-of-friends', { waitUntil: 'networkidle2' });
  
  const entries = await page.evaluate(async () => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('ABE_FriendsDB', 1);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    
    return new Promise((res, rej) => {
      const tx = db.transaction('entries', 'readonly');
      const store = tx.objectStore('entries');
      const req = store.getAll();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  });
  
  console.log(`Found ${entries.length} entries in IDB.`);
  
  const counts = {};
  entries.forEach(e => {
    const key = e.name + '|' + e.content.slice(0, 20);
    counts[key] = (counts[key] || 0) + 1;
  });
  
  Object.entries(counts).forEach(([key, count]) => {
    if (count > 1) {
      console.log(`DUPLICATE FOUND: ${key} (x${count})`);
    }
  });

  await browser.close();
})();
