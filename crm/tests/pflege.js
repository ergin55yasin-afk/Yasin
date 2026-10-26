// Pflegeberatung (Referenzmodul): alle Schritte in der neuen Beratungsstrecke, Rechenwerte, Bericht, PDF, CRM.
// Aufruf: JSPDF_PATH=... node tests/pflege.js [fotoordner]
const path = require('path');
const fs = require('fs');
const { start, geheZu, pruefer, db, JSPDF } = require('./hilfe');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
const check = pruefer();
(async () => {
  let browser = null;
  for (const vp of [{ n: 'desktop', width: 1440, height: 2200 }, { n: 'tablet', width: 1024, height: 1366 }, { n: 'mobil', width: 390, height: 844 }]) {
    console.log('\n== ' + vp.n);
    const r = await start({ browser, viewport: { width: vp.width, height: vp.height }, daten: false });
    browser = r.browser; const page = r.page;
    const shot = async n => { if (out) { fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: path.join(out, `${vp.n}-${n}.png`), fullPage: vp.n === 'desktop' }) } };
    const go = k => page.click(`[data-act="bs-go"][data-k="${k}"]`);
    const fill = async (k, v) => { await page.fill(`.bs-body [data-adv="${k}"]`, v); await page.waitForTimeout(30) };
    await geheZu(page, 'beratung');
    await page.fill('#bs-k', '20991');
    await page.click('.tcard[data-a="pflege"]');
    // Schritt 1
    await go('m:pflege:0');
    await fill('kd.alter', '63');
    await page.selectOption('.bs-body [data-adv="kd.fam"]', 'verheiratet oder Partnerschaft');
    await page.click('.bs-body [data-act="adv-pfset"][data-k="lage.angeh"][data-v="nein"]');
    await page.click('.bs-body [data-act="adv-pfset"][data-k="lage.wohn"][data-v="teil"]');
    check('Schritt 1 zeigt abgeleitete Fragen', /niemand in der Nähe/.test(await page.locator('#tlive').innerText()));
    await shot('1-situation');
    // Schritt 2
    await go('m:pflege:1');
    await page.click('.bs-body [data-act="adv-pfp"][data-k="zuhause"]');
    await page.click('.bs-body [data-act="adv-pfp"][data-k="partner"]');
    await page.click('.bs-body [data-act="adv-pfset"][data-k="ort"][data-v="zuhause"]');
    const rank = await page.locator('#tlive .ds-rank-list li').allInnerTexts();
    check('Schritt 2 Rangfolge in Klickreihenfolge', rank[0] === 'Möglichst lange zu Hause leben' && rank[1] === 'Den Partner finanziell schützen', rank.join(' | '));
    // Schritt 3
    await go('m:pflege:2');
    check('Schritt 3 Pflegegrade und Diagramm', await page.locator('.bs-body .ds-grade > div').count() === 5 && await page.locator('.bs-body .chartbox[data-c="pfwo"] canvas').count() === 1);
    // Schritt 4
    await go('m:pflege:3');
    await fill('vp.rente', '1800'); await fill('vp.verm', '60000'); await fill('pf.kost', '2400');
    const c = await page.evaluate(() => window.__crm.pfCalc());
    const J = await page.evaluate(() => window.__crm.pfHeimJahre().map(j => Math.round(j.eigen)));
    // vdek 1.1.2026: 3.245 / 2.947 / 2.551 / 2.056 €. Abweichung bis 1 € durch gerundete Ausgangswerte.
    check('Eigenanteil je Jahr entspricht vdek 1.1.2026 (±1 €)', [3245, 2947, 2551, 2056].every((v, i) => Math.abs(J[i] - v) <= 1), JSON.stringify(J));
    check('Heimkosten PG3 = Kasse 1319 + Eigenanteil 3245 + Zuschlag', Math.round(c.heimGes) === Math.round(1319 + 3245 + 1685 / 0.85 * 0.15), Math.round(c.heimGes));
    check('Lücke im Heim = 3245 - 1800', Math.round(c.lueH) === 1445, Math.round(c.lueH));
    check('Zu Hause: 2400 - Sachleistung 1497 = 903', Math.round(c.ebZ) === 903, Math.round(c.ebZ));
    check('Vermögensreichweite mit sinkendem Eigenanteil (113 Monate)', c.monH === 113, c.monH);
    check('Kostenbrücke Heim und Zuhause als Diagramm', await page.locator('.bs-body .chartbox[data-c="pfheim"] canvas').count() === 1 && await page.locator('.bs-body .chartbox[data-c="pfhaus"] canvas').count() === 1);
    const tab = await page.locator('.bs-body .ds-calc').first().innerText();
    check('Rechenweg nennt Quellen', /SGB XI § 43/.test(tab) && /vdek/.test(tab));
    await page.selectOption('.bs-body [data-adv="pf.pg"]', '1');
    check('Pflegegrad 1: keine Heimrechnung', (await page.locator('#tlive').innerText()).includes('gilt erst ab Pflegegrad 2') && await page.locator('.bs-body .chartbox[data-c="pfheim"]').count() === 0);
    await page.selectOption('.bs-body [data-adv="pf.pg"]', '3');
    await page.waitForTimeout(50);
    await shot('4-luecke');
    // Schritt 5
    await go('m:pflege:4');
    check('Vergleich mit vier Möglichkeiten (Tabelle oder Karten)', await page.locator('.bs-body .ds-matrix thead th').count() === 5 && await page.locator('.bs-body .opt-c').count() === 4);
    check('Auf schmalen Bildschirmen Karten statt Tabelle', vp.width < 700 ? await page.locator('.bs-body .opt-c >> nth=0').isVisible() : await page.locator('.bs-body .ds-matrix').isVisible());
    const rel = await page.locator('.bs-body .ds-matrix tr.ds-rel').textContent();
    check('Bezug zur Situation aus Schritt 1 und 4', /keine Angehörigen in der Nähe/.test(rel) && /reicht das Vermögen/.test(rel), rel.replace(/\s+/g, ' ').slice(0, 160));
    await page.click('.bs-body [data-act="adv-pfopt"][data-k="privat"][data-v="pruefen"] >> visible=true');
    await page.click('.bs-body [data-act="adv-pfopt"][data-k="angeh"][data-v="nein"] >> visible=true');
    check('Angebotsbereich öffnet sich bei „Weiter prüfen“', await page.locator('.bs-body details.adv[open] [data-adv="pf.mgS"]').count() === 1);
    await fill('pf.mgS', '1000');
    check('Mit Angebot bleibt im Heim 2245', Math.round((await page.evaluate(() => window.__crm.pfCalc())).ebHT) === 2245);
    check('Hinweis „noch nicht geprüft“ sichtbar', /Noch nicht geprüft/.test(await page.locator('.bs-body .pf-tarif').innerText()));
    await shot('5-optionen');
    // Schritt 6
    await go('m:pflege:5');
    await page.click('.bs-body [data-act="adv-pfoff"][data-k="heim"]');
    await page.click('.bs-body [data-act="adv-pfoff"][data-k="vollm"]');
    await fill('pf.next', 'Angebot rechnen, Termin mit Tochter');
    const s6 = await page.locator('#tlive').innerText();
    check('Schritt 6 fasst Entscheidungen zusammen', /Weiter prüfen/.test(s6) && /Nicht gewünscht/.test(s6) && /Heimkosten in der eigenen Region/.test(s6));
    await shot('6-entscheidung');
    // Bedarf und Bericht
    await go('b:pflege');
    await page.click('[data-act="bs-bedarf"][data-k="pflege"][data-v="bestaetigt"]');
    const rep = await page.evaluate(() => window.__crm.buildReport().filter(b => b.t === 'h').map(b => b.text));
    check('Bericht enthält Anliegen und Pflege-Abschnitte', ['Ihr Anliegen und unsere Themen', 'Pflege: Was Ihnen wichtig ist', 'Pflegeheim: Was bleibt pro Monat?', 'Pflege: Möglichkeiten im Vergleich', 'Pflege: Offene Punkte und nächster Schritt'].every(t => rep.includes(t)), rep.join(' | '));
    if (JSPDF) {
      await page.addScriptTag({ path: JSPDF });
      const len = await page.evaluate(() => window.__crm.renderPdf(window.__crm.buildReport()).byteLength);
      check('PDF wird erzeugt und bleibt klein', len > 20000 && len < 1500000, len + ' Bytes');
      if (out && vp.n === 'desktop') { const b64 = await page.evaluate(() => { const b = new Uint8Array(window.__crm.renderPdf(window.__crm.buildReport())); let s = ''; b.forEach(x => s += String.fromCharCode(x)); return btoa(s) }); fs.writeFileSync(path.join(out, 'Beratungsunterlage-Pflege.pdf'), Buffer.from(b64, 'base64')) }
    }
    // CRM speichern
    await go('unterlage');
    await page.click('[data-act="adv-crm"]');
    const d = await db(page);
    const ber = d.beratungen.find(b => b.bereich === 'Pflege');
    check('CRM: Beratung Pflege gespeichert', !!ber && /Heim-Eigenanteil/.test(ber.note), ber && ber.note.slice(0, 100));
    check('CRM: offene Punkte als Aufgabe', d.todos.some(t => /^Pflege, offen: /.test(t.text)));
    await geheZu(page, 'pipeline');
    check('Pipeline zeigt Pflege-Karte', /Pflege/.test(await page.locator('#view').innerText()));
    check('Keine JavaScript-Fehler', r.fehler.length === 0, r.fehler.join(' | '));
    await page.context().close();
  }
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
