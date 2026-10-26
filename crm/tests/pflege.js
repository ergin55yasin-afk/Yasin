// Funktionstest der Pflegeberatung: führt durch alle sechs Schritte, prüft Rechenwerte,
// Bericht, PDF und CRM-Speicherung und macht Bildschirmfotos.
// Aufruf: JSPDF_PATH=... node tests/pflege.js [index.html] [fotoordner]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const out = process.argv[3] ? path.resolve(process.argv[3]) : null;
const JSPDF = process.env.JSPDF_PATH;
let fails = 0;
function check(name, cond, info) { console.log((cond ? 'OK     ' : 'FEHLER ') + name + (info !== undefined ? ' -> ' + info : '')); if (!cond) fails++ }

(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ n: 'desktop', w: 1440, h: 2200 }, { n: 'tablet', w: 1024, h: 1366 }, { n: 'mobil', w: 390, h: 844 }]) {
    console.log('\n== ' + vp.n);
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.route('**/jspdf.umd.min.js', r => JSPDF ? r.fulfill({ path: JSPDF, contentType: 'text/javascript' }) : r.abort());
    await page.goto('file://' + file);
    await page.click('.tabs button[data-tab="beratung"]');
    await page.fill('[data-home="kunde"]', '20991');
    await page.click('[data-act="home-sel"][data-m="pflege"]');
    await page.click('[data-act="home-talk"]');
    const shot = async name => { if (out) { fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: path.join(out, `${vp.n}-${name}.png`) }) } };
    const next = () => page.click('#talk [data-act="talk-next"]');
    const fill = async (k, v) => { await page.fill(`#talk [data-adv="${k}"]`, v); await page.waitForTimeout(30) };

    // Schritt 1
    await fill('kd.alter', '63');
    await page.selectOption('#talk [data-adv="kd.fam"]', 'verheiratet oder Partnerschaft');
    await page.click('#talk [data-act="adv-pfset"][data-k="lage.angeh"][data-v="nein"]');
    await page.click('#talk [data-act="adv-pfset"][data-k="lage.wohn"][data-v="teil"]');
    const s1 = await page.locator('#tlive').innerText();
    check('Schritt 1 zeigt abgeleitete Fragen', /niemand in der Nähe/.test(s1));
    await shot('1-situation');
    await next();
    // Schritt 2
    await page.click('#talk [data-act="adv-pfp"][data-k="zuhause"]');
    await page.click('#talk [data-act="adv-pfp"][data-k="partner"]');
    await page.click('#talk [data-act="adv-pfset"][data-k="ort"][data-v="zuhause"]');
    const rank = await page.locator('#tlive .ds-rank-list li').allInnerTexts();
    check('Schritt 2 Rangfolge in Klickreihenfolge', rank[0] === 'Möglichst lange zu Hause leben' && rank[1] === 'Den Partner finanziell schützen', rank.join(' | '));
    await shot('2-ziele');
    await next();
    check('Schritt 3 Pflegegrade und Diagramm', await page.locator('#talk .ds-grade > div').count() === 5 && await page.locator('#talk .chartbox[data-c="pfwo"] canvas').count() === 1);
    await shot('3-risiko');
    await next();
    // Schritt 4
    await fill('vp.rente', '1800'); await fill('vp.verm', '60000'); await fill('pf.kost', '2400');
    const c = await page.evaluate(() => window.__crm.pfCalc());
    const J = await page.evaluate(() => window.__crm.pfHeimJahre().map(j => Math.round(j.eigen)));
    // vdek 1.1.2026: 3.245 / 2.947 / 2.551 / 2.056 €. Abweichung bis 1 € durch die gerundeten Ausgangswerte.
    check('Eigenanteil je Jahr entspricht vdek 1.1.2026 (±1 €)', [3245, 2947, 2551, 2056].every((v, i) => Math.abs(J[i] - v) <= 1), JSON.stringify(J));
    check('Heimkosten PG3 = Kasse 1319 + Eigenanteil 3245 + Zuschlag', Math.round(c.heimGes) === Math.round(1319 + 3245 + 1685 / 0.85 * 0.15), Math.round(c.heimGes));
    check('Lücke im Heim = 3245 - 1800', Math.round(c.lueH) === 1445, Math.round(c.lueH));
    check('Zu Hause: 2400 - Sachleistung 1497 = 903', Math.round(c.ebZ) === 903, Math.round(c.ebZ));
    // Reichweite: Jahr 1 Lücke 1445, Jahr 2 1147 -> 60000: 12*1445=17340, Rest 42660 / 1147 = 37,19 -> 12 Monate (13764), Rest 28896 / Jahr 3 751 -> 12 (9012), Rest 19884 / Jahr 4 256 -> 77 Monate
    check('Vermögensreichweite mit sinkendem Eigenanteil', c.monH === 12 + 12 + 12 + 77, c.monH);
    check('Kostenbrücke Heim und Zuhause als Diagramm', await page.locator('#talk .chartbox[data-c="pfheim"] canvas').count() === 1 && await page.locator('#talk .chartbox[data-c="pfhaus"] canvas').count() === 1);
    const tab = await page.locator('#talk .ds-calc').first().innerText();
    check('Rechenweg nennt Quellen', /SGB XI § 43/.test(tab) && /vdek/.test(tab));
    await page.selectOption('#talk [data-adv="pf.pg"]', '1');
    check('Pflegegrad 1: keine Heimrechnung', (await page.locator('#tlive').innerText()).includes('gilt erst ab Pflegegrad 2') && await page.locator('#talk .chartbox[data-c="pfheim"]').count() === 0);
    await page.selectOption('#talk [data-adv="pf.pg"]', '3');
    await page.waitForTimeout(50);
    await shot('4-luecke');
    await next();
    // Schritt 5
    check('Vergleich mit vier Möglichkeiten', await page.locator('#talk .ds-matrix thead th').count() === 5);
    const rel = await page.locator('#talk .ds-matrix tr.ds-rel').innerText();
    check('Bezug zur Situation aus Schritt 1 und 4', /keine Angehörigen in der Nähe/.test(rel) && /reicht das Vermögen/.test(rel), rel.replace(/\s+/g, ' ').slice(0, 160));
    await page.click('#talk [data-act="adv-pfopt"][data-k="privat"][data-v="pruefen"]');
    await page.click('#talk [data-act="adv-pfopt"][data-k="angeh"][data-v="nein"]');
    check('Angebotsbereich öffnet sich bei "Weiter prüfen"', await page.locator('#talk details.adv[open] [data-adv="pf.mgS"]').count() === 1);
    await fill('pf.mgS', '1000');
    const c2 = await page.evaluate(() => window.__crm.pfCalc());
    check('Mit Angebot bleibt im Heim 2245', Math.round(c2.ebHT) === 2245, Math.round(c2.ebHT));
    check('Hinweis "noch nicht geprüft" sichtbar', /Noch nicht geprüft/.test(await page.locator('#talk .pf-tarif').innerText()));
    await shot('5-optionen');
    await next();
    // Schritt 6
    await page.click('#talk [data-act="adv-pfoff"][data-k="heim"]');
    await page.click('#talk [data-act="adv-pfoff"][data-k="vollm"]');
    await fill('pf.next', 'Angebot rechnen, Termin mit Tochter');
    const s6 = await page.locator('#tlive').innerText();
    check('Schritt 6 fasst Entscheidungen zusammen', /Weiter prüfen/.test(s6) && /Nicht gewünscht/.test(s6) && /Heimkosten in der eigenen Region/.test(s6) && /Angebot rechnen/.test(s6));
    await shot('6-entscheidung');
    // Bericht
    const rep = await page.evaluate(() => window.__crm.buildReport().filter(b => b.t === 'h').map(b => b.text));
    check('Bericht enthält Pflege-Abschnitte', ['Pflege: Ihre Situation', 'Pflege: Was Ihnen wichtig ist', 'Pflegeheim: Was bleibt pro Monat?', 'Pflege: Möglichkeiten im Vergleich', 'Pflege: Offene Punkte und nächster Schritt'].every(t => rep.includes(t)), rep.join(' | '));
    if (JSPDF) {
      await page.addScriptTag({ path: JSPDF });
      const pdf = await page.evaluate(() => { const b = window.__crm.renderPdf(window.__crm.buildReport()); return b.byteLength });
      check('PDF wird erzeugt', pdf > 20000, pdf + ' Bytes');
      if (out && vp.n === 'desktop') {
        const b64 = await page.evaluate(() => { const b = new Uint8Array(window.__crm.renderPdf(window.__crm.buildReport())); let s = ''; b.forEach(x => s += String.fromCharCode(x)); return btoa(s) });
        fs.writeFileSync(path.join(out, 'Beratungsunterlage-Pflege.pdf'), Buffer.from(b64, 'base64'));
      }
    }
    const html = await page.evaluate(() => window.__crm.renderHtmlReport(window.__crm.buildReport()));
    check('HTML-Bericht enthält Kostenbrücke', /Leistungszuschlag im ersten Jahr/.test(html));
    // CRM speichern
    await next();
    await page.click('#talk [data-act="talk-out"]');
    await page.click('[data-act="adv-crm"]');
    const db = await page.evaluate(() => JSON.parse(localStorage.getItem('nachbereitung.v1')));
    const ber = db.beratungen.find(b => b.bereich === 'Pflege');
    check('CRM: Beratung Pflege gespeichert', !!ber && /Heim-Eigenanteil/.test(ber.note), ber && ber.note.slice(0, 120));
    check('CRM: offene Punkte als Aufgabe', db.todos.some(t => /^Pflege, offen: /.test(t.text)));
    // Beratung im Formularmodus
    await page.click('.tabs button[data-tab="beratung"]');
    const stepBtn = page.locator('.sdot').nth(1);
    await stepBtn.click();
    check('Formularmodus zeigt Pflege-Ergebnisse', await page.locator('#advres .ds-calc').count() >= 1);
    // Pipeline nimmt den Bereich auf
    await page.click('.tabs button[data-tab="pipeline"]');
    check('Pipeline zeigt Pflege-Karte', /Pflege/.test(await page.locator('#view').innerText()));
    check('Keine JavaScript-Fehler', errs.length === 0, errs.join(' | '));
    await page.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen.` : '\nAlle Prüfungen bestanden.');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
