// Ganzheitlicher Überblick: Anliegen in der Mitte, begründete Zusammenhänge, Entscheidung des Kunden.
// Aufruf: node tests/ueberblick.js [fotoordner]
const path = require('path');
const fs = require('fs');
const { start, geheZu, pruefer, db } = require('./hilfe');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
const check = pruefer();
(async () => {
  let browser = null;
  for (const vp of [{ n: 'desktop', width: 1440, height: 1100 }, { n: 'tablet', width: 1024, height: 1366 }, { n: 'mobil', width: 390, height: 844 }]) {
    console.log('\n== ' + vp.n);
    const r = await start({ browser, viewport: { width: vp.width, height: vp.height }, daten: false });
    browser = r.browser; const page = r.page;
    const shot = async n => { if (out) { fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: path.join(out, `ueb-${vp.n}-${n}.png`), fullPage: true }) } };
    const S = async () => (await db(page)).laufend[0];
    await geheZu(page, 'beratung');
    await page.fill('#bs-k', '30117');
    await page.click('.tcard[data-a="sach"]');
    // Anlass
    check('Anlass-Fragen im ersten Schritt', await page.locator('.anlass [data-bs="anlass.wichtig"]').count() === 1 && await page.locator('.anlass [data-act="bs-aend"]').count() === 7);
    await page.fill('.anlass [data-bs="anliegenText"]', 'Ich möchte meine Gebäudeversicherung überprüfen.');
    await page.fill('.anlass [data-bs="anlass.wichtig"]', 'Starkregen soll abgedeckt sein');
    await page.click('[data-act="bs-aend"][data-k="haus"]');
    await page.waitForTimeout(400);
    const s1 = await S();
    check('Anlass wird gespeichert', s1.anlass && s1.anlass.wichtig === 'Starkregen soll abgedeckt sein' && s1.anlass.aenderung[0] === 'haus' && /Gebäudeversicherung/.test(s1.anliegenText));
    await shot('1-anlass');
    // Situation
    await page.click('[data-act="bs-go"][data-k="situation"]');
    await page.click('.bs-body [data-act="adv-grp"][data-k="arbeitend"]');
    await page.fill('.bs-body [data-adv="kd.alter"]', '41');
    await page.fill('.bs-body [data-adv="kd.kinder"]', '2');
    await page.selectOption('.bs-body [data-adv="kd.fam"]', 'verheiratet oder Partnerschaft');
    await page.selectOption('.bs-body [data-adv="kd.wohnen"]', 'Eigentum');
    await page.waitForTimeout(400);
    // Überblick
    await page.click('[data-act="bs-go"][data-k="themen"]');
    const ueb = await page.locator('.bs-body').innerText();
    check('Anliegen steht in der Mitte mit Kundenzitat', /Mein Zuhause/.test(await page.locator('.ueb-anchor').innerText()) && /Gebäudeversicherung überprüfen/.test(await page.locator('.ueb-anchor').innerText()));
    const n = await page.locator('.ueb-felder > .fcards > .fcard').count();
    check('Nur 3 bis 4 Bereiche, nicht alle Sparten', n >= 3 && n <= 4, n);
    check('Keine Lücken, Warnungen oder Verkaufschancen', !/Lücke|Chance|Warnung|dringend|empfehlen Ihnen/i.test(ueb));
    check('Respektvolle Option, beim Anliegen zu bleiben', /Wir können heute gerne bei Sachversicherungen bleiben|Wir können heute gerne bei .* bleiben/.test(await page.locator('.ueb-stay').innerText()));
    const erst = await page.locator('.ueb-felder > .fcards > .fcard .fc-t b').allInnerTexts();
    check('Finanzierung steht oben (Eigentum und Hauskauf)', erst.slice(0, 2).includes('Meine Finanzierung absichern'), erst.join(' | '));
    check('Kein Bereich ist automatisch gewählt', Object.keys((await S()).themen).join() === 'sach');
    await page.click('[data-act="bs-fopen"][data-k="finanzierung"]');
    const kar = await page.locator('.fcard.open').innerText();
    check('Karte erklärt Zusammenhang, Gründe, fehlende Angaben und offene Frage', /Zusammenhang mit Ihrem Anliegen/i.test(kar) && /Aus Ihren Angaben/i.test(kar) && /gekauft, gebaut/.test(kar) && /noch zu klären/i.test(kar) && /Offene Frage/i.test(kar));
    check('Karte ist ausdrücklich kein Bedarf und keine Empfehlung', /kein festgestellter Bedarf und keine Empfehlung/.test(kar));
    await shot('2-ueberblick');
    // Entscheidungen
    await page.click('[data-act="bs-feld"][data-k="finanzierung"][data-s="jetzt"]');
    let s = await S();
    check('„Jetzt besprechen“ nimmt das Thema in die Beratung auf', s.themen.arbeit && s.themen.arbeit.quelle === 'zusammenhang' && s.felder.finanzierung.jetzt === true);
    check('Neue Schritte für das gewählte Thema', await page.locator('.bs-i[data-k="b:arbeit"]').count() === 1);
    await page.click('[data-act="bs-fopen"][data-k="familie"]');
    await page.click('[data-act="bs-feld"][data-k="familie"][data-s="spaeter"]');
    s = await S();
    check('„Später“ legt ohne Klick keine Wiedervorlage an', s.felder.familie.status === 'spaeter' && !(await db(page)).todos.length);
    await page.click('[data-act="bs-fwv"][data-k="familie"][data-m="3"]');
    const d = await db(page);
    check('Wiedervorlage nur nach Vereinbarung, mit Kundennummer', d.todos.length === 1 && d.todos[0].kunde === '30117' && /Später besprechen: Meine Familie/.test(d.todos[0].text));
    const third = (await page.locator('.ueb-felder > .fcards > .fcard [data-act="bs-fopen"]').evaluateAll(b => b.map(x => x.dataset.k)))[0];
    await page.click(`[data-act="bs-fopen"][data-k="${third}"]`);
    await page.click(`[data-act="bs-feld"][data-k="${third}"][data-s="nein"]`);
    s = await S();
    check('„Heute nicht vertiefen“ wird gespeichert, ohne Thema', s.felder[third].status === 'nein' && Object.keys(s.themen).length === 2);
    const done = await page.locator('.ueb-done').innerText();
    check('Bereits geklärt zeigt die Entscheidungen', /Wird heute besprochen/.test(done) && /Für später vorgemerkt/.test(done) && /Heute nicht vertieft/.test(done) && /Wiedervorlage am/.test(done));
    await shot('3-entschieden');
    // Ändern: zurück auf möglichen Zusammenhang, Thema verschwindet
    await page.click(`.ueb-done [data-act="bs-feld"][data-k="finanzierung"][data-s="erkannt"]`);
    s = await S();
    check('Rücknahme entfernt das aus dem Überblick gewählte Thema', !s.themen.arbeit && s.felder.finanzierung.status === 'erkannt');
    await page.click('[data-act="bs-fopen"][data-k="finanzierung"]');
    await page.click('[data-act="bs-feld"][data-k="finanzierung"][data-s="jetzt"]');
    // Wiederaufrufen
    await page.click('[data-act="bs-close"]');
    await page.reload();
    await geheZu(page, 'start');
    const st = await page.locator('#view').innerText();
    check('Startseite zeigt „für später vorgemerkt“', /Meine Familie berücksichtigen/.test(st));
    await page.click('[data-act="bs-open"] >> nth=0');
    await page.click('[data-act="bs-go"][data-k="themen"]');
    check('Nach dem Neuladen bleiben die Entscheidungen erhalten', /Für später vorgemerkt/.test(await page.locator('.ueb-done').innerText()));
    // Kundenmodus
    await page.click('[data-act="bs-kmode"]').catch(async () => { await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'bs-kmode'; document.body.appendChild(b); b.click(); b.remove() }) });
    await page.waitForTimeout(100);
    const k = await page.locator('.bs-body').innerText();
    check('Kundenmodus: keine Schaltfläche „Angesprochen“, kein „Thema direkt hinzufügen“', !/Thema direkt hinzufügen/.test(k) && await page.locator('[data-act="bs-feld"][data-s="angesprochen"]').count() === 0);
    const rest = await page.locator('.ueb-felder > .fcards [data-act="bs-fopen"]').evaluateAll(b => b.map(x => x.dataset.k));
    if (rest.length) {
      await page.click(`[data-act="bs-fopen"][data-k="${rest[0]}"]`);
      await page.waitForTimeout(400);
      check('Kundenmodus: Öffnen einer Karte zählt als angesprochen', (await S()).felder[rest[0]].status === 'angesprochen');
    }
    await page.click('[data-act="bs-fokus"] >> nth=0');
    check('„Mit dem Anliegen weitermachen“ führt zur Beratung', !/Was damit zusammenhängen kann/.test(await page.locator('.bs-body').innerText()));
    // Zusammenfassung und Bericht
    await page.click('[data-act="bs-go"][data-k="ergebnis"]');
    const erg = await page.locator('.bs-body').innerText();
    check('Zusammenfassung nennt die Bereiche mit Stand', /Weitere Lebensbereiche aus dem Überblick/i.test(erg) && /Für später vorgemerkt/.test(erg) && /im Überblick gemeinsam gewählt/.test(erg));
    const rep = await page.evaluate(() => JSON.stringify(window.__crm.buildReport()));
    check('Bericht: nur angesprochene Bereiche, kein „möglicher Zusammenhang“', /Weitere Lebensbereiche/.test(rep) && /Meine Familie berücksichtigen/.test(rep) && !/Möglicher Zusammenhang/.test(rep));
    const TIT = { zuhause: 'Mein Zuhause rundum schützen', finanzierung: 'Meine Finanzierung absichern', familie: 'Meine Familie berücksichtigen', reserven: 'Größere Ausgaben einplanen', unfall: 'Folgen eines Unfalls' };
    const fe = (await S()).felder; const nie = Object.keys(fe).filter(x => fe[x].status === 'erkannt');
    check('Bericht nennt keine nicht angesprochenen Bereiche', nie.length > 0 && nie.every(x => !rep.includes(TIT[x])), nie.join());
    const sw = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    check('Kein seitliches Scrollen', sw);
    check('Keine JavaScript-Fehler', r.fehler.length === 0, r.fehler.join(' | '));
    await page.context().close();
  }
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
