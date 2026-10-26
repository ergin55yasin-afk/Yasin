// Alle Themen in einer Beratung: jeden Schritt öffnen, Bericht erzeugen, keine Fehler.
// Prüft außerdem das Laden einer älteren Beratungsdatei ohne die neuen Felder.
const { start, geheZu, pruefer } = require('./hilfe');
const check = pruefer();
(async () => {
  const { browser, page, fehler } = await start({ daten: false });
  await geheZu(page, 'beratung');
  await page.click('.tcard[data-a="check"]');
  await page.click('[data-act="bs-go"][data-k="themen"]');
  for (const t of ['alter', 'arbeit', 'pflege', 'familie', 'kranken', 'zusatz', 'unfall', 'sach', 'anlage', 'vorsorge', 'individuell']) await page.click(`.tcard[data-act="bs-thema"][data-a="${t}"]`);
  const keys = await page.locator('.bs-i').evaluateAll(b => b.map(x => x.dataset.k));
  for (const k of keys) await page.click(`[data-act="bs-go"][data-k="${k}"]`);
  check('Alle Schritte aller 12 Themen geöffnet', keys.length > 50, keys.length + ' Schritte');
  const blocks = await page.evaluate(() => window.__crm.buildReport().length);
  check('Bericht mit allen Themen erzeugbar', blocks > 10, blocks + ' Blöcke');
  // ältere Beratungsdatei (ohne neue Pflegefelder) laden
  const alt = await page.evaluate(() => { const a = JSON.parse(JSON.stringify(window.__crm.adv())); a.mods = { pflege: true, alter: true }; a.pf = { prio: ['selbst'], pg: '4', kost: '', heim: '', mgH: '', mgS: '', bed: false, wo: '', partner: '' }; return JSON.stringify({ app: 'crm-beratung', v: 1, adv: a }) });
  await page.click('[data-act="bs-close"]');
  await geheZu(page, 'beratung');
  await page.setInputFiles('#adv-file', { name: 'alt.json', mimeType: 'application/json', buffer: Buffer.from(alt) });
  await page.waitForTimeout(200);
  check('Ältere Beratungsdatei geladen, Pflegegrad übernommen', (await page.evaluate(() => window.__crm.pfCalc().g)) === 4);
  const st = await page.locator('.bs-i').allInnerTexts();
  check('Themen aus der Datei als Schritte', st.some(s => /Was wäre Ihnen im Pflegefall wichtig/.test(s)) && st.some(s => /Zeit ist Ihr größter Hebel/.test(s)));
  check('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
