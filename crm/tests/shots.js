// Bildschirmfotos der Pflegeberatung im Gesprächsmodus.
// Aufruf: node tests/shots.js <index.html> <zielordner> [breite] [höhe]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const file = path.resolve(process.argv[2]);
const out = path.resolve(process.argv[3]);
const W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900);
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('file://' + file);
  await page.click('.tabs button[data-tab="beratung"]');
  await page.click('[data-act="home-sel"][data-m="pflege"]');
  await page.click('[data-act="home-talk"]');
  const n = await page.evaluate(() => document.querySelectorAll('.tdots i').length);
  for (let i = 0; i < n; i++) {
    await page.screenshot({ path: path.join(out, `folie-${String(i + 1).padStart(2, '0')}.png`), fullPage: false });
    // Beispielwerte eintragen, sobald die Felder erscheinen
    for (const [k, v] of [['vp.rente', '1800'], ['vp.verm', '60000'], ['pf.kost', '2400'], ['kd.alter', '63']]) {
      const el = page.locator(`#talk [data-adv="${k}"]`);
      if (await el.count() && !(await el.first().inputValue())) { await el.first().fill(v); }
    }
    if (await page.locator('#talk [data-act="talk-next"]:not([disabled])').count()) await page.click('#talk [data-act="talk-next"]');
  }
  await browser.close();
  console.log(n + ' Folien fotografiert nach ' + out);
})();
