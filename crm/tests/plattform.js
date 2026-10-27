// Plattform-Test: Navigator, Kunden, Beratung mit Kundenmodus, Beraterwissen, Datenübernahme, Darstellung.
// Aufruf: JSPDF_PATH=... node tests/plattform.js
const { start, geheZu, aktion, pruefer, db, tag } = require('./hilfe');
const check = pruefer();
(async () => {
  const { browser, page, fehler } = await start();
  // --- Datenübernahme aus dem alten Format
  let d = await db(page);
  check('Altdaten bleiben erhalten (Aufgaben, Termine, Verträge)', d.todos.length === 4 && d.termine.length === 2 && d.vertraege.length === 1);
  // --- Startseite
  const st = await page.locator('#view').innerText();
  check('Start: Begrüßung und Zusammenfassung', /Guten (Morgen|Tag|Abend)/.test(st) && /1 Termin heute/.test(st));
  check('Start: Termin heute mit Kundennummer und Status', /10484/.test(st) && /Erstes Gespräch/.test(st));
  check('Start: überfällige Aufgabe getrennt ausgewiesen', /Überfällig/i.test(st) && /Renteninformation anfordern/.test(st));
  check('Start: erledigte Aufgabe nicht als fällig', !/Erledigte Aufgabe/.test(st));
  check('Start: Rückmeldung und Angebot unter Wiedervorlagen', /Rückmeldung zum Angebot/.test(st) && /Angebot Hausrat nachfassen/.test(st));
  check('Start: keine automatischen Verkaufschancen', !/Chancen|Gesprächsanlässe|ist noch nichts erfasst/.test(st));
  check('Start: Termin in 30 Tagen nicht unter den nächsten 7 Tagen', (st.match(/10482/g) || []).length >= 1 && !/in 30 Tagen/.test(st));
  // --- Kunden
  await geheZu(page, 'kunden');
  check('Kundenübersicht listet alle Nummern', (await page.locator('.ccard').count()) === 3);
  await page.fill('#kq', '1048');
  await page.click('.ccard[data-k="10482"]');
  const kp = await page.locator('#view').innerText();
  check('Kundenprofil als eigene Seite mit Verlauf und Fristen', /10482/.test(kp) && /Verlauf/.test(kp) && /Beratung starten/.test(kp));
  // --- Beratung starten aus dem Profil
  await page.click('[data-act="bs-neu"][data-k="10482"]');
  check('Beratung startet mit Kundennummer', /10482/.test(await page.locator('.bs-who').innerText()));
  await page.click('.tcard[data-a="alter"]');
  check('Anliegen dauerhaft sichtbar', /Anliegen: Altersvorsorge/.test(await page.locator('.bs-anl').innerText()));
  await page.click('[data-act="bs-go"][data-k="themen"]');
  const vorschl = await page.locator('.ueb-felder').innerText();
  check('Zusammenhänge als mögliche Gesprächsansätze, nicht als Bedarf', /Was damit zusammenhängen kann/.test(vorschl) && /Mein Einkommen absichern/.test(vorschl) && !/Lücke|Chance/.test(vorschl));
  check('Vorschlag wählt Thema nicht automatisch', !(await page.evaluate(() => !!JSON.parse(localStorage.getItem('nachbereitung.v1')).laufend[0].themen.pflege)));
  await page.click('[data-act="bs-fopen"][data-k="pflege"]');
  await page.click('[data-act="bs-feld"][data-k="pflege"][data-s="jetzt"]');
  await page.click('summary:has-text("Thema direkt hinzufügen")');
  await page.click('.tcard[data-a="unfall"]');
  const steps = await page.locator('.bs-i').allInnerTexts();
  check('Schritte je Thema in der linken Leiste', steps.some(s => /Zeit ist Ihr größter Hebel/.test(s)) && steps.some(s => /Gespräch und Fragen/.test(s)) && steps.filter(s => /Bedarf festhalten/.test(s)).length === 3);
  // Unfall: Gesprächsleitfaden mit Antworten
  await page.click('[data-act="bs-go"][data-k="l:unfall"]');
  check('Unfall: Unterschied Unfallfolgen und Vertragsleistung erklärt', /etwas anderes als die Leistungen eines Vertrags/.test(await page.locator('.bs-body').innerText()));
  await page.fill('[data-bsa="unfall.e"]', 'Wohnung müsste umgebaut werden');
  await page.click('[data-act="bs-go"][data-k="b:unfall"]');
  await page.click('[data-act="bs-bedarf"][data-k="unfall"][data-v="vermutet"]');
  await page.click('[data-act="bs-go"][data-k="b:alter"]');
  await page.click('[data-act="bs-bedarf"][data-k="alter"][data-v="bestaetigt"]');
  await page.fill('#bs-ofq', 'Renteninformation mitbringen');
  await page.click('[data-act="bs-offen-add"]');
  // Altersvorsorge-Rechner
  await page.click('[data-act="bs-go"][data-k="m:alter:2"]');
  await page.fill('[data-adv="al.gehalt"]', '3000');
  await page.click('[data-act="bs-go"][data-k="m:alter:3"]');
  await page.fill('[data-adv="al.rente"]', '1500');
  await page.click('[data-act="bs-go"][data-k="m:alter:1"]');
  await page.fill('[data-adv="al.alter"]', '40');
  await page.click('[data-act="bs-go"][data-k="m:alter:4"]');
  const luecke = await page.locator('#tlive').innerText();
  check('Versorgungslücke wird live berechnet (3.000 Ziel minus 1.500 Rente)', /1\.500 €/.test(luecke), luecke.replace(/\s+/g, ' ').slice(0, 120));
  // Interne Notiz
  if (!(await page.locator('#bs-notiz').count())) await page.click('[data-act="bs-ctx"]');
  await page.fill('#bs-notiz', 'GEHEIM-NOTIZ-4711 Kunde wirkt unsicher');
  await page.click('[data-act="bs-go"][data-k="ergebnis"]');
  await page.fill('[data-bs="doku.next"]', 'Angebot Rürup rechnen');
  await page.fill('[data-bs="doku.vereinbarungen"]', 'Unterlagen zur Betriebsrente mitbringen');
  await page.waitForTimeout(500);
  // --- Speichern und Wiederaufrufen
  await page.reload();
  d = await db(page);
  const s = d.laufend[0];
  check('Laufende Beratung nach Neuladen gespeichert', !!s && s.kunde === '10482' && s.anliegen === 'alter' && s.notiz.indexOf('GEHEIM') === 0 && s.adv.al.gehalt === '3000');
  check('Name für das PDF wird nicht gespeichert', !JSON.stringify(d).includes('"pdfName"'));
  const st2 = await page.locator('#view').innerText();
  check('Start zeigt laufende Beratung mit Position und nächstem Schritt', /Laufende Beratungen/.test(st2) && /Schritt \d+ von \d+/.test(st2) && /Angebot Rürup rechnen/.test(st2));
  check('Start zeigt bestätigtes Thema, aber keine Vermutung', /Kundenwunsch bestätigt/.test(st2) && !/vermutet/.test(st2));
  await page.click('[data-act="bs-open"]');
  check('Fortsetzen an derselben Stelle', /Zusammenfassung und Vereinbarungen/.test(await page.locator('.bs-body h2').innerText()));
  // --- Kundenmodus
  await page.click('[data-act="bs-kmode"]');
  const html = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script').forEach(s => s.remove()); return c.outerHTML });
  check('Kundenmodus: interne Notiz nicht im Seitenquelltext', !html.includes('GEHEIM-NOTIZ-4711'));
  check('Kundenmodus: andere Kundennummern nicht im Seitenquelltext', !html.includes('10483') && !html.includes('10484'));
  check('Kundenmodus: Vermutung nicht sichtbar', !/vermutet/.test(await page.locator('#view').innerText()));
  check('Kundenmodus: interner Abschluss-Schritt ausgeblendet', !(await page.locator('[data-k="unterlage"]').count()));
  check('Kundenmodus: Navigation verborgen', !(await page.locator('#nav').isVisible()));
  check('Kundenmodus: Tipps und Kontext fehlen', !(await page.locator('.bs-ctx').count()) && !html.includes('Tipp für diesen Schritt'));
  await page.keyboard.press('Control+k');
  check('Kundenmodus: Suche per Tastatur gesperrt', await page.locator('#sheet').isHidden());
  await aktion(page, 'tab', { tab: 'kunden' });
  check('Kundenmodus: Wechsel zu anderen Bereichen gesperrt', await page.locator('.bs').count() === 1);
  await page.click('[data-act="bs-go"][data-k="b:unfall"]');
  check('Kundenmodus: Bedarfswahl ohne „vermutet“', !(await page.locator('[data-v="vermutet"]').count()));
  await page.click('[data-act="bs-go"][data-k="m:alter:0"]');
  if (await page.locator('[data-act="bs-lex"]').count()) {
    await page.click('[data-act="bs-lex"]');
    const sh = await page.locator('#sheetbody').innerText();
    check('Kundenmodus: Erklärung nur mit kundengeeigneten Inhalten, ohne Status', /Erklärung/i.test(sh) && !/Ergänzende Frage|Entwurf|KI-Entwurf|Bearbeiten/.test(sh));
    await page.click('#sheetbody [data-act="close"]');
  }
  const pdfBl = await page.evaluate(() => JSON.stringify(window.__crm.buildReport()));
  check('PDF: Vereinbarungen enthalten, interne Notiz und Vermutung nicht', /Unterlagen zur Betriebsrente/.test(pdfBl) && !/GEHEIM/.test(pdfBl) && !/vermutet/.test(pdfBl));
  await page.click('[data-act="bs-kende"]');
  check('Kundenmodus beenden verlangt Bestätigung', /Kundenmodus beenden\?/.test(await page.locator('#sheetbody').innerText()) && await page.locator('body.kmode').count() === 1);
  await page.click('[data-act="bs-kende-ok"]');
  check('Beratermodus wieder aktiv', await page.locator('body.kmode').count() === 0 && await page.locator('[data-act="bs-kmode"]').count() === 1);
  // --- Lexikon aus der Beratung, Fortschritt bleibt
  await page.click('[data-act="bs-go"][data-k="m:pflege:3"]');
  await page.click('[data-act="bs-lex"]');
  await page.click('#sheetbody .lx-b >> nth=0');
  await page.click('#sheetbody [data-act="close"]');
  check('Wissen aus der Beratung geöffnet, Schritt unverändert', /Was die Pflegekasse zahlt/.test(await page.locator('.bs-body h2').innerText()));
  // --- Abschluss
  await page.click('[data-act="bs-go"][data-k="unterlage"]');
  await page.click('[data-act="bs-abschluss"]'); await page.click('[data-act="bs-abschluss"]');
  d = await db(page);
  check('Abschluss: Status gespeichert und nächster Schritt als Aufgabe', d.laufend[0].status === 'abgeschlossen' && d.todos.some(t => t.text === 'Nächster Schritt: Angebot Rürup rechnen'));
  check('Abschluss: Kundenprofil zeigt Themen mit Stand', /Kundenwunsch bestätigt/.test(await page.locator('#view').innerText()));
  // --- Beraterwissen
  await geheZu(page, 'wissen');
  d = await db(page);
  check('Lexikon angelegt, alle Startinhalte als KI-Entwurf', d.lexikon.eintraege.length > 40 && d.lexikon.eintraege.filter(e => e.ki).every(e => e.status === 'entwurf'));
  const pf = d.lexikon.eintraege.filter(e => e.sparte === 'pflege');
  const typen = ['grund', 'vertieft', 'fragen', 'indikatoren', 'kern', 'einwaende', 'praxis', 'produkt', 'recht', 'doku'];
  check('Muster-Sparte Pflege deckt alle 10 Inhaltsbereiche ab', typen.every(t => pf.some(e => e.typ === t)), typen.filter(t => !pf.some(e => e.typ === t)).join(','));
  check('Alte Wissenseinträge übernommen', d.lexikon.eintraege.some(e => e.titel === 'Einwand: Zu teuer'));
  await page.fill('#lx-q', 'Leistungszuschlag');
  await page.waitForTimeout(100);
  const tr = await page.locator('.lxl').innerText();
  check('Suche findet Fachbegriff', /Leistungszuschlag/.test(tr));
  await page.fill('#lx-q', 'xyzunbekannt');
  check('Suche ohne Treffer zeigt leeren Zustand', /Nichts gefunden/.test(await page.locator('#view').innerText()));
  await aktion(page, 'lex-reset');
  await page.selectOption('[data-lxf="sparte"]', 'pflege');
  check('Sparte zeigt die 10 Inhaltsbereiche', (await page.locator('.toc a').count()) === 10);
  await page.selectOption('[data-lxf="typ"]', 'einwaende');
  check('Filter Inhaltstyp', (await page.locator('.lx').count()) === 4);
  await aktion(page, 'lex-reset');
  // Neuer Eintrag, bearbeiten, prüfen, Historie
  await page.click('[data-act="lex-neu"]');
  await page.fill('#lx-t', 'Testeintrag Merksatz');
  await page.fill('#lx-x', 'Erster Inhalt');
  await page.selectOption('#lx-sp', 'pflege'); await page.selectOption('#lx-ty', 'kern');
  await page.click('[data-act="lex-save"]');
  let e = (await db(page)).lexikon.eintraege.find(x => x.titel === 'Testeintrag Merksatz');
  check('Eintrag angelegt als Entwurf, nicht KI', !!e && e.status === 'entwurf' && !e.ki);
  await page.click('#sheetbody [data-act="lex-pruef"]');
  await page.fill('#lx-pv', 'Prüferin A');
  await page.click('[data-act="lex-pruef-ok"]');
  e = (await db(page)).lexikon.eintraege.find(x => x.id === e.id);
  check('Als geprüft gekennzeichnet mit Datum und Person', e.status === 'geprueft' && e.pruefdatum === tag(0) && e.verantwortlich === 'Prüferin A');
  await page.click('#sheetbody [data-act="lex-edit"]');
  await page.fill('#lx-x', 'Geänderter Inhalt');
  await page.click('[data-act="lex-save"]');
  e = (await db(page)).lexikon.eintraege.find(x => x.id === e.id);
  check('Inhaltliche Änderung setzt geprüft zurück auf Entwurf', e.status === 'entwurf' && e.text === 'Geänderter Inhalt');
  check('Änderungshistorie mit drei Einträgen', e.historie.length === 3 && e.historie[2].felder.includes('Inhalt'));
  await page.click('#sheetbody details.adv summary');
  await page.click('#sheetbody [data-act="lex-restore"] >> nth=0');
  e = (await db(page)).lexikon.eintraege.find(x => x.id === e.id);
  check('Früheren Stand wiederherstellen', e.text === 'Erster Inhalt' && e.historie.length === 4);
  await page.click('#sheetbody [data-act="lex-fav"]');
  await page.click('#sheetbody [data-act="close"]');
  await geheZu(page, 'start');
  check('Favorit erscheint auf der Startseite', /Testeintrag Merksatz/.test(await page.locator('#view').innerText()));
  await page.fill('#lx-qs', 'Pflege-Bahr');
  check('Suche von der Startseite öffnet das Beraterwissen', /Pflege-Bahr/.test(await page.locator('.lxl').innerText()));
  // KI-Chat nutzt das Lexikon
  await geheZu(page, 'wissenki');
  check('Wissens-Chat greift auf das Lexikon zu', /Wissensdatenbank \(\d{2,} Einträge\)/.test(await page.locator('#view').innerText()));
  check('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
  await page.context().close();

  // --- Leerer Zustand
  const leer = await start({ browser, daten: false });
  const lt = await leer.page.locator('#view').innerText();
  check('Leerer Start: freundliche leere Zustände', /Keine Termine/.test(lt) && /Keine begonnene Beratung/.test(lt));
  await geheZu(leer.page, 'kunden');
  check('Leere Kundenliste mit Hinweis', /Noch keine Kunden erfasst/.test(await leer.page.locator('#view').innerText()));
  check('Keine Fehler im leeren Zustand', leer.fehler.length === 0, leer.fehler.join(' | '));
  await leer.page.context().close();

  // --- Darstellung: keine waagerechte Verschiebung
  for (const vp of [{ width: 390, height: 844 }, { width: 1024, height: 1366 }, { width: 1440, height: 900 }]) {
    const r = await start({ browser, viewport: vp });
    const zuBreit = [];
    for (const t of ['start', 'kunden', 'beratung', 'wissen', 'aufgaben', 'pipeline']) {
      await geheZu(r.page, t);
      const w = await r.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (w > 1) zuBreit.push(t + ' +' + w + 'px');
    }
    await geheZu(r.page, 'beratung'); await r.page.click('.tcard[data-a="pflege"]');
    for (const k of ['m:pflege:3', 'm:pflege:4', 'ergebnis']) { await r.page.click(`[data-act="bs-go"][data-k="${k}"]`); const w = await r.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (w > 1) zuBreit.push(k + ' +' + w + 'px') }
    check(`Breite ${vp.width}: kein waagerechtes Scrollen`, zuBreit.length === 0, zuBreit.join(', '));
    check(`Breite ${vp.width}: keine Fehler`, r.fehler.length === 0, r.fehler.join(' | '));
    await r.page.context().close();
  }
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
