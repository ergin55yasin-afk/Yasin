// Rauchtest für das CRM: lädt die Seite, klickt alle Bereiche durch und
// sammelt JavaScript-Fehler. Aufruf: node tests/smoke.js [pfad/zur/index.html]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const JSPDF = process.env.JSPDF_PATH;

const SEED = {
  v: 2, dismissed: {}, lastBackup: 0, settings: {},
  todos: [
    { id: 't1', kunde: '10482', text: 'Unterlagen anfordern', due: '2026-10-20', done: false, ts: 1, wait: false },
    { id: 't2', kunde: '10483', text: 'Rückmeldung Angebot', due: '2026-10-30', done: false, ts: 2, wait: true }
  ],
  angebote: [{ id: 'a1', kunde: '10482', sparte: 'Hausrat', status: 'offen', nachfass: '2026-10-28', note: '', log: [], ts: 3 }],
  termine: [{ id: 'm1', kunde: '10484', datum: '2026-11-03', sparte: 'Kranken', note: '', ts: 4 }],
  beratungen: [{ id: 'b1', kunde: '10482', bereich: 'Altersvorsorge', datum: '2026-10-01', note: 'Lücke besprochen', wv: '', erg: 'angebot', grund: '', ber: '', fil: '', ts: 5 }],
  vertraege: [{ id: 'v1', kunde: '10483', sparte: 'KFZ', ablauf: '2027-01-01', frist: '1', note: '', ts: 6 }]
};

async function run() {
  const browser = await chromium.launch();
  const errors = [];
  const results = [];
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'tablet', width: 1024, height: 1366 }, { name: 'mobil', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('pageerror', e => errors.push(`[${vp.name}] pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|Failed to load resource/.test(m.text())) errors.push(`[${vp.name}] console: ${m.text()}`) });
    await page.route('**/jspdf.umd.min.js', r => JSPDF ? r.fulfill({ path: JSPDF, contentType: 'text/javascript' }) : r.abort());
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.addInitScript(s => { try { localStorage.setItem('nachbereitung.v1', s) } catch (e) {} }, JSON.stringify(SEED));
    await page.goto('file://' + file);
    for (const t of ['start', 'aufgaben', 'kunden', 'pipeline', 'beratung']) {
      await page.click(`.tabs button[data-tab="${t}"]`);
      const txt = await page.locator('#view').innerText();
      results.push(`[${vp.name}] Tab ${t}: ${txt.length} Zeichen`);
    }
    // Bereiche aus dem Mehr-Menü
    for (const to of [['tab', 'wissen'], ['tab', 'training'], ['rv-open'], ['open-auswertung'], ['open-ganz'], ['open-woche'], ['recht-open'], ['menu']]) {
      await page.click('[data-act="more"]');
      await page.click(`[data-act="more-go"][data-to="${to[0]}"]${to[1] ? `[data-tab="${to[1]}"]` : ''}`);
      await page.keyboard.press('Escape');
    }
    // Kundenakte öffnen
    await page.click('.tabs button[data-tab="kunden"]');
    await page.click('[data-act="open-kunde"][data-k="10482"]');
    await page.keyboard.press('Escape');
    await page.close();
  }
  await browser.close();
  results.forEach(r => console.log(r));
  if (errors.length) { console.log('\nFEHLER:'); errors.forEach(e => console.log(' - ' + e)); process.exit(1) }
  console.log('\nRauchtest ohne JavaScript-Fehler bestanden.');
}
run().catch(e => { console.error(e); process.exit(1) });
