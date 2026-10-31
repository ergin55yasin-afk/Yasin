// Zusammenführung mit dem zweiten Chat: Akademie, Gesprächsvorbereitung, Krankenzusatz, KV-Bericht, Start.
// Aufruf: JSPDF_PATH=... node tests/zusammen.js [fotoordner]
const path = require('path');
const fs = require('fs');
const { start, geheZu, pruefer, JSPDF } = require('./hilfe');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
const check = pruefer();
(async () => {
  let browser = null;
  for (const vp of [{ n: 'desktop', width: 1440, height: 1000 }, { n: 'mobil', width: 390, height: 844 }]) {
    console.log('\n== ' + vp.n);
    const r = await start({ browser, viewport: { width: vp.width, height: vp.height }, daten: false });
    browser = r.browser; const page = r.page;
    const shot = async n => { if (out) { fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: path.join(out, `zus-${vp.n}-${n}.png`), fullPage: true }) } };
    const sw = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    // Start
    await geheZu(page, 'start');
    check('Start: Weg Wissen, Vorbereitung, Beratung', await page.locator('.weg3 .dbs').count() === 3);
    await shot('1-start');
    // Akademie
    await page.click('.weg3 [data-tab="akademie"]');
    const ak = await page.locator('#view').innerText();
    check('Akademie erreichbar mit Kategorien', /Vertriebsgrundlagen/.test(ak) && /Einwandbehandlung/.test(ak));
    check('Wissensbereiche umschaltbar', await page.locator('.wseg button').count() === 3);
    await page.click('[data-act="wk-cat"] >> nth=0');
    await page.click('[data-act="wk-unit"] >> nth=0');
    check('Lerneinheit öffnet', (await page.locator('#view').innerText()).length > 400);
    await page.click('[data-act="wk-home"]').catch(() => {});
    await geheZu(page, 'akademie');
    await page.fill('#wk-s', 'Einwand');
    await page.waitForTimeout(100);
    check('Akademie-Suche findet Einheiten', await page.locator('#wk-sr .wkli').count() > 0);
    check('Akademie: kein seitliches Scrollen', await sw());
    await shot('2-akademie');
    await page.click('.wseg [data-tab="wissen"]');
    check('Lexikon bleibt erreichbar', await page.locator('#lx-q').count() === 1);
    // Gesprächsvorbereitung
    await geheZu(page, 'vorbereitung');
    check('Gesprächsvorbereitung erreichbar', /In wenigen Klicks vorbereitet/.test(await page.locator('#view').innerText()));
    await page.click('[data-act="gv-go"][data-i="2"]').catch(() => {});
    const ex = page.locator('[data-act="gv-ex"]');
    if (await ex.count() === 0) { await page.click('[data-act="gv-go"][data-i="1"]').catch(() => {}); await page.click('[data-act="gv-go"][data-i="2"]').catch(() => {}) }
    await page.click('[data-act="gv-ex"]');
    await page.click('[data-act="gv-gen"]');
    const vb = await page.locator('#view').innerText();
    check('Vorbereitung aus Beispieltext erstellt', /Krankenzusatz/.test(vb) && /Pflege/.test(vb), vb.slice(0, 120).replace(/\s+/g, ' '));
    check('Vorbereitung: kein seitliches Scrollen', await sw());
    await shot('3-vorbereitung');
    if (JSPDF) {
      await page.addScriptTag({ path: JSPDF });
      const n = await page.evaluate(() => { const p = window.__crm.buildPrepReport ? 1 : 0; return p });
      const len = await page.evaluate(() => { try { const c = window.__crm; const b = c.buildPrepReport(c.prep().A, 'b'); return c.renderPdf(b).byteLength } catch (e) { return 'Fehler: ' + e.message } });
      check('PDF der Vorbereitung (Berater) entsteht', typeof len === 'number' && len > 5000, len);
      const lk = await page.evaluate(() => { try { const c = window.__crm; return c.renderPdf(c.buildPrepReport(c.prep().A, 'k')).byteLength } catch (e) { return 'Fehler: ' + e.message } });
      check('PDF der Vorbereitung (Kunde) entsteht', typeof lk === 'number' && lk > 5000, lk);
    }
    // Beratung mit Krankenzusatz
    await geheZu(page, 'beratung');
    check('Beratung: Link zur Vorbereitung', await page.locator('.bhero [data-tab="vorbereitung"]').count() === 1);
    await page.fill('#bs-k', '40111');
    await page.click('.tcard[data-a="zusatz"]');
    const steps = await page.locator('.bs-i').allInnerTexts();
    check('Krankenzusatz hat eigene Schritte', steps.some(s => /Krankenzusatz|Kasse|Zahn/i.test(s)) && steps.length > 6, steps.join(' | ').slice(0, 300));
    const zk = await page.locator('.bs-i').evaluateAll(b => b.map(x => x.dataset.k).filter(k => /^m:zusatz/.test(k)));
    for (const k of zk) await page.click(`[data-act="bs-go"][data-k="${k}"]`);
    if (zk.length) {
      const sel = page.locator('.bs-body [data-adv="zus.pri.zahn"]');
      if (await sel.count()) { await sel.selectOption('wichtig'); await page.selectOption('.bs-body [data-adv="zus.ist.zahn"]', 'nicht vorhanden') }
    }
    check('Krankenzusatz-Schritte ohne Fehler', r.fehler.length === 0, r.fehler.join(' | '));
    const rep = await page.evaluate(() => window.__crm.buildReport().filter(b => b.t === 'h').map(b => b.text));
    check('Bericht enthält Krankenzusatz', rep.some(t => /Krankenzusatz/.test(t)), rep.join(' | '));
    if (JSPDF) {
      const len = await page.evaluate(() => window.__crm.renderPdf(window.__crm.buildReport()).byteLength);
      check('Beratungs-PDF mit Krankenzusatz', len > 8000, len);
    }
    await shot('4-zusatz');
    // Krankenversicherung: Vergleichskarten aus dem zweiten Chat
    await page.click('[data-act="bs-close"]');
    await geheZu(page, 'beratung');
    await page.click('.tcard[data-a="kranken"]');
    const kk = await page.locator('.bs-i').evaluateAll(b => b.map(x => x.dataset.k).filter(k => /kranken/.test(k)));
    for (const k of kk) await page.click(`[data-act="bs-go"][data-k="${k}"]`);
    await page.evaluate(() => { const a = window.__crm.adv(); a.kv.brutto = '60000'; a.kv.zusKunde = '30' });
    const kb = await page.evaluate(() => window.__crm.buildReport().map(b => b.t));
    check('KV-Bericht mit Vergleichskarten (vs2)', kb.includes('vs2'), kb.join(','));
    const kh = await page.evaluate(() => window.__crm.renderHtmlReport(window.__crm.buildReport()).length);
    check('KV-Bericht als HTML', kh > 2000, kh);
    if (JSPDF) check('KV-Bericht als PDF', await page.evaluate(() => window.__crm.renderPdf(window.__crm.buildReport()).byteLength) > 8000);
    // Einwandtrainer nutzt die Einwände der Akademie
    await geheZu(page, 'training');
    check('Einwandtrainer vorhanden', /Einwand/.test(await page.locator('#view').innerText()));
    check('Keine JavaScript-Fehler', r.fehler.length === 0, r.fehler.join(' | '));
    await page.context().close();
  }
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
