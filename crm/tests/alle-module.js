// Gesprächsmodus mit allen Themen: jede Folie öffnen, keine JavaScript-Fehler, Bericht erzeugbar.
// Prüft außerdem das Laden einer älteren Beratungsdatei ohne die neuen Pflegefelder.
const { chromium } = require('playwright');
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('https://fonts.googleapis.com/**', r => r.abort());
  await p.goto('file://' + file);
  await p.click('.tabs button[data-tab="beratung"]');
  for (const m of ['alter', 'anlage', 'kv', 'sach', 'bu', 'pflege', 'vorsorge']) await p.click(`[data-act="home-sel"][data-m="${m}"]`);
  await p.click('[data-act="home-talk"]');
  const n = await p.evaluate(() => document.querySelectorAll('.tdots i').length);
  for (let i = 1; i < n; i++) await p.click('#talk [data-act="talk-next"]');
  const blocks = await p.evaluate(() => window.__crm.buildReport().length);
  await p.click('#talk [data-act="talk-end"]');
  // ältere Beratungsdatei (pf ohne neue Felder) laden und Pflege-Schritt öffnen
  const oldFile = await p.evaluate(() => { const a = JSON.parse(JSON.stringify(window.__crm.adv())); a.pf = { prio: ['selbst'], pg: '4', kost: '', heim: '', mgH: '', mgS: '', bed: false, wo: '', partner: '' }; return JSON.stringify({ app: 'crm-beratung', v: 1, adv: a }) });
  await p.click('.sdot >> nth=-1'); await p.click('[data-act="adv-end"]'); await p.click('[data-act="adv-end"]');
  await p.setInputFiles('#adv-file', { name: 'alt.json', mimeType: 'application/json', buffer: Buffer.from(oldFile) });
  await p.waitForTimeout(200);
  const pg = await p.evaluate(() => window.__crm.pfCalc().g);
  const dots = await p.locator('.sdot').count();
  for (let i = 0; i < dots; i++) { await p.locator('.sdot').nth(i).click() }
  if (pg !== 4) errs.push('Alte Datei: Pflegegrad nicht übernommen (' + pg + ')');
  console.log('Folien:', n, '| Berichtsblöcke:', blocks, '| Fehler:', errs.length ? errs.join(' | ') : 'keine');
  await b.close(); process.exit(errs.length || n < 30 ? 1 : 0);
})();
