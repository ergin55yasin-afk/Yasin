// Rauchtest der bestehenden CRM-Funktionen: alle Bereiche, Mehr-Menü, Einträge anlegen, Sicherung.
const { start, geheZu, aktion, pruefer, db, tag } = require('./hilfe');
const check = pruefer();
(async () => {
  let browser = null;
  for (const vp of [{ width: 1440, height: 900 }, { width: 1024, height: 1366 }, { width: 390, height: 844 }]) {
    const r = await start({ browser, viewport: vp }); browser = r.browser; const page = r.page;
    for (const t of ['start', 'aufgaben', 'kunden', 'pipeline', 'revier', 'beratung', 'wissen', 'copilot', 'training', 'wissenki']) {
      await geheZu(page, t);
      check(`[${vp.width}] Bereich ${t} hat Inhalt`, (await page.locator('#view').innerText()).length > 40);
    }
    for (const to of [['open-auswertung'], ['open-ganz'], ['open-woche'], ['recht-open'], ['menu'], ['pl-set'], ['profil'], ['nb-open']]) {
      await page.click('.top [data-act="more"]');
      await page.click(`[data-act="more-go"][data-to="${to[0]}"]`);
      check(`[${vp.width}] Mehr-Menü: ${to[0]} öffnet einen Dialog`, await page.locator('#sheet').isVisible());
      await page.keyboard.press('Escape');
    }
    check(`[${vp.width}] keine JavaScript-Fehler`, r.fehler.length === 0, r.fehler.join(' | '));
    if (vp.width === 1440) {
      // Einträge anlegen: Termin mit Uhrzeit und Anliegen, To-do mit Priorität
      await aktion(page, 'add-termin');
      await page.fill('#f-kunde', '30001'); await page.fill('#f-datum', tag(0)); await page.fill('#f-zeit', '09:15'); await page.selectOption('#f-anliegen', 'arbeit');
      await page.click('[data-act="save-add"]');
      await aktion(page, 'add');
      await page.fill('#f-kunde', '30001'); await page.fill('#f-text', 'Gehaltsnachweis anfordern'); await page.fill('#f-due', tag(0)); await page.check('#f-prio');
      await page.click('[data-act="save-add"]');
      await geheZu(page, 'start');
      const s = await page.locator('#view').innerText();
      check('Neuer Termin mit Uhrzeit und Anliegen auf der Startseite', /09:15/.test(s) && /Arbeitskraft absichern/.test(s));
      check('Wichtige Aufgabe heute fällig', /Gehaltsnachweis anfordern/.test(s) && await page.locator('.prio').count() >= 1);
      await page.click('.task:has-text("Gehaltsnachweis") .check');
      const d = await db(page);
      check('Aufgabe abhaken speichert', d.todos.find(t => t.text === 'Gehaltsnachweis anfordern').done === true);
      // Kündigungsschreiben und Vertrag
      await geheZu(page, 'kunden'); await page.click('.ccard[data-k="10483"]');
      await page.click('[data-act="open-vertrag"] >> nth=0');
      check('Vertrag öffnen', /Kündigungsschreiben/.test(await page.locator('#sheetbody').innerText()));
      await page.click('[data-act="ku-open"]');
      check('Kündigungsschreiben erzeugt', /hiermit kündige ich/.test(await page.locator('#sheetbody').innerText()));
      await page.keyboard.press('Escape');
      // Suche
      await page.keyboard.press('Control+k'); await page.fill('#sr-q', 'Pflege');
      const sr = await page.locator('#sr-list').innerText();
      check('Suche findet Beraterwissen', /BERATERWISSEN|Beraterwissen/.test(sr), sr.slice(0, 120));
      await page.click('#sr-list .srr[data-do="lex-open"] >> nth=0');
      check('Treffer öffnet den Wissenseintrag', /Quelle/.test(await page.locator('#sheetbody').innerText()));
      await page.keyboard.press('Escape');
    }
    await page.context().close();
  }
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
