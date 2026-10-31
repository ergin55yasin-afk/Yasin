// Akademie, wissenschaftliche Vertiefung: Daten, Modi, Quellen, Übung, Vertiefungsfragen, Lernstand.
// Die KI wird simuliert (window.claude). Aufruf: node tests/akademie.js [fotoordner]
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { DATEI, pruefer, geheZu, aktion, db } = require('./hilfe');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
const check = pruefer();
(async () => {
  const browser = await chromium.launch();
  // 1. Ohne KI
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage(); const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto('file://' + DATEI);
    await geheZu(page, 'akademie');
    const home = await page.locator('#view').innerText();
    check('Akademie: Abschnitt „Wissenschaftlich vertieft“', /Wissenschaftlich vertieft/i.test(home));
    const n = await page.locator('.tfcard').count();
    check('Mindestens 17 Vertiefungseinheiten auf der Startseite', n >= 17, n);
    check('Legende der Evidenzstufen vorhanden', await page.locator('.tfleg').count() >= 1);
    // Einheit Spiegeln öffnen
    await page.click('.tfcard[data-id="t-spiegeln"]');
    let v = await page.locator('#view').innerText();
    check('Einheit öffnet im Modus Schnell', /Das Wichtigste/i.test(v) && /Vermeiden/i.test(v));
    check('Vier Modi angeboten', await page.locator('.tfseg button').count() === 4);
    check('Version, Stand und Prüfdatum sichtbar', /Version 1\.0/.test(v) && /Stand 2026-10-31/.test(v) && /Nächste Prüfung/.test(v));
    await page.click('.tfseg [data-m="experte"]');
    v = await page.locator('#view').innerText();
    check('Experte: Abschnitte A, B, C, F, H', /A · Grundlagen/i.test(v) && /B · Psychologische/i.test(v) && /C · Wissenschaftliche Evidenz/i.test(v) && /F · Grenzen/i.test(v) && /H · Quellen/i.test(v));
    check('Experte: Aussagen mit Evidenzstufe', await page.locator('.tfaus .evb').count() >= 3);
    check('Experte: Kennzeichnung Transfer/Erfahrungsregel', /übertragen aus anderem Kontext|Erfahrungsregel|direkt untersucht/.test(v));
    check('Experte: Quellen mit DOI-Link', await page.locator('.tfq a[href^="https://doi.org/"]').count() >= 3);
    await page.click('.tfseg [data-m="praxis"]');
    v = await page.locator('#view').innerText();
    check('Praxis: Schritte, Formulierungen, Dialog', /Schritt für Schritt/i.test(v) && /Formulierungen/i.test(v) && /Beispieldialog/i.test(v));
    check('Praxis: Beispiel „flexibel bleiben“', /flexibel/i.test(v));
    // Selbsttest
    await page.click('.tfseg [data-m="ueben"]');
    const fragen = await page.locator('.tfquiz').count();
    check('Üben: Selbsttest vorhanden', fragen >= 2, fragen);
    for (let i = 0; i < fragen; i++) await page.click(`[data-act="tf-quiz"][data-i="${i}"][data-a="1"]`);
    v = await page.locator('#view').innerText();
    check('Selbsttest: Ergebnis angezeigt', /Ergebnis: \d von \d/.test(v));
    let s = await db(page);
    check('Lernstand: Test gespeichert', s.akademie && s.akademie.tests && s.akademie.tests['t-spiegeln'] && s.akademie.tests['t-spiegeln'].n === fragen);
    // Übung ohne KI: Regelprüfung
    await page.fill('#tf-ue', 'Wenn ich Sie richtig verstehe, ist Ihnen Sicherheit wichtig. Was genau macht Ihnen Sorge?');
    await page.click('[data-act="tf-fb"]');
    await page.waitForSelector('.tffb');
    v = await page.locator('.tffb').innerText();
    check('Übung ohne KI: acht Kriterien', await page.locator('.tfkrit > div').count() === 8);
    check('Übung ohne KI: als Regelprüfung gekennzeichnet', /keine KI/.test(v));
    s = await db(page);
    check('Lernstand: Übung gezählt', s.akademie.uebungen['t-spiegeln'] === 1);
    // Vertiefungsfrage ohne KI
    await page.click('[data-act="tf-vq"][data-i="1"]');
    await page.waitForSelector('.tfvq .wkans');
    check('Vertiefungsfrage ohne KI: Aussagen aus der Einheit', /keine KI/.test(await page.locator('.tfvq .wkans').innerText()));
    await page.click('[data-act="tf-vq"][data-i="5"]');
    check('„Lass mich üben“ wechselt in den Übungsmodus', await page.locator('.tfseg [data-m="ueben"][aria-pressed="true"]').count() === 1);
    // Gelesen
    await page.click('[data-act="tf-read"]');
    s = await db(page);
    check('Als gelesen markiert', !!s.akademie.gelesen['t-spiegeln']);
    // Quellenverzeichnis
    await aktion(page, 'tf-src', { id: 'weger14' });
    await page.waitForTimeout(80);
    v = await page.locator('#view').innerText();
    check('Quellenverzeichnis öffnet', /Quellenverzeichnis/.test(v));
    const qn = await page.locator('.tfq > li').count();
    check('Quellenverzeichnis: mindestens 50 Quellen', qn >= 50, qn);
    check('Quelle hervorgehoben', await page.locator('#aq-weger14.tfhi').count() === 1);
    check('Quellen zeigen Verwendung in Einheiten', await page.locator('.tfused').count() >= 40);
    check('Offene DOIs gekennzeichnet', /DOI aus Literaturangabe/.test(v));
    await page.click('[data-act="tf-qf"][data-id="Meta-Analyse"]');
    const mq = await page.locator('.tfq > li').count();
    check('Filter nach Typ', mq > 3 && mq < qn, mq);
    await page.fill('#tf-sq', 'Lundahl');
    await page.waitForTimeout(80);
    check('Suche im Quellenverzeichnis', await page.locator('#tf-ql .tfq > li').count() === 1);
    // Einheit Entscheidung: Bias-Tabelle
    await aktion(page, 'wk-unit', { id: 't-entscheidung' });
    await page.click('.tfseg [data-m="experte"]');
    const bias = await page.locator('.tfbias details').count();
    check('Entscheidungspsychologie: 12 Verzerrungen', bias === 12, bias);
    v = await page.locator('#view').innerText();
    check('Bias ohne geprüfte Quelle als Stufe D markiert', /Primärquelle in dieser Akademie nicht geprüft|keine Primärquelle geprüft/.test(await page.locator('.tfbias').innerHTML()));
    // Einwände: zehn Situationen
    await aktion(page, 'wk-unit', { id: 't-einwand' });
    await page.click('.tfseg [data-m="praxis"]');
    check('Einwände: zehn Situationstypen', await page.locator('.tfsit > div').count() === 10);
    check('Einwände: Hinweis kein verstecktes Kaufsignal', /Nicht jeder Einwand ist ein verstecktes Kaufsignal/.test(await page.locator('#view').innerText()));
    // Verknüpfung aus normaler Lerneinheit
    await aktion(page, 'wk-unit', { id: 'e1' });
    check('Lerneinheit „Aktives Zuhören“ verlinkt Vertiefung', await page.locator('.tflink .tfcard').count() >= 1);
    // Suche
    await aktion(page, 'wk-home');
    await page.fill('#wk-s', 'Spiegeln');
    await page.waitForTimeout(100);
    check('Suche findet Vertiefungen', await page.locator('#wk-sr .tfcard').count() >= 1);
    check('Keine JS-Fehler ohne KI', fehler.length === 0, fehler.join(' | '));
    await ctx.close();
  }
  // 2. Mit KI, Desktop und mobil
  for (const vp of [{ n: 'desktop', width: 1280, height: 900 }, { n: 'mobil', width: 390, height: 844 }]) {
    console.log('\n== ' + vp.n);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      window.__calls = [];
      const sample = function (turns) { window.__calls.push({ art: 'chat', turns }); return Promise.resolve({ text: '**Hintergrund**\nAntwort auf Grundlage der Einheit (Weger u. a. 2014).' }) };
      sample.json = function (prompt) {
        window.__calls.push({ art: 'json', prompt });
        return Promise.resolve({ krit: [{ k: 'Verständlichkeit', n: 4, t: 'Klar.' }, { k: 'Zuhören', n: 5, t: 'Gut zurückgemeldet.' }, { k: 'Fragetechnik', n: 4, t: 'Offene Frage.' }, { k: 'Gesprächsstruktur', n: 3, t: 'Ok.' }, { k: 'Empathie', n: 4, t: 'Sorge aufgenommen.' }, { k: 'Umgang mit Einwänden', n: 0, t: 'Nicht relevant.' }, { k: 'Klarheit', n: 4, t: 'Ok.' }, { k: 'Kundenorientierung', n: 9, t: 'Ungültig.' }], gut: 'Gut zurückgemeldet.', besser: 'Kürzer fragen.', alt: 'Ihnen ist Sicherheit wichtig. Was genau beunruhigt Sie?' });
      };
      window.claude = { use: name => Promise.resolve(name === 'sample' ? sample : null) };
    });
    const page = await ctx.newPage(); const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto('file://' + DATEI);
    const shot = async n => { if (out) { fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: path.join(out, `ak-${vp.n}-${n}.png`), fullPage: true }) } };
    const sw = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    await geheZu(page, 'akademie');
    check('Akademie-Start ohne seitliches Scrollen', await sw());
    await shot('1-start');
    await aktion(page, 'wk-unit', { id: 't-zuhoeren' });
    await page.click('.tfseg [data-m="ueben"]');
    await page.fill('#tf-ue', 'Sie haben den Überblick verloren. Was wäre Ihnen als Erstes wichtig?');
    await page.click('[data-act="tf-fb"]');
    await page.waitForSelector('.tffb');
    const fb = await page.locator('.tffb').innerText();
    check('KI-Rückmeldung: acht Kriterien', await page.locator('.tfkrit > div').count() === 8);
    check('KI-Rückmeldung: als nicht geprüft gekennzeichnet', /keine geprüfte Bewertung/.test(fb));
    check('KI-Rückmeldung: ungültige Werte verworfen', /Kundenorientierung\s*\n?\s*–/.test(fb), fb.slice(0, 300));
    const pr = await page.evaluate(() => window.__calls.filter(c => c.art === 'json').pop().prompt);
    check('Übungsprompt enthält Kriterien und Fall', /Verständlichkeit/.test(pr) && /Kundenorientierung/.test(pr) && /Situation:/.test(pr));
    await shot('2-ueben');
    await page.click('[data-act="tf-vq"][data-i="1"]');
    await page.waitForSelector('.tfvq .wkans');
    const ch = await page.evaluate(() => window.__calls.filter(c => c.art === 'chat').pop().turns[0].content);
    check('Vertiefungsfrage: Prompt enthält Einheit und Quellen', /QUELLEN DIESER EINHEIT/.test(ch) && /Weger/.test(ch) && /erfinde keine/i.test(ch));
    check('Vertiefungsfrage: KI-Antwort markiert', /nicht fachlich geprüft/.test(await page.locator('.tfvq').innerText()));
    await page.click('.tfseg [data-m="experte"]');
    check('Experte ohne seitliches Scrollen', await sw());
    await shot('3-experte');
    await aktion(page, 'tf-quellen');
    check('Quellenverzeichnis ohne seitliches Scrollen', await sw());
    await shot('4-quellen');
    check('Keine JS-Fehler mit KI (' + vp.n + ')', fehler.length === 0, fehler.join(' | '));
    await ctx.close();
  }
  // 3. Alle Einheiten in allen Modi
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto('file://' + DATEI);
    await geheZu(page, 'akademie');
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('.tfcard')).map(b => b.dataset.id).filter((x, i, a) => a.indexOf(x) === i));
    let ok = 0, breit = [];
    for (const id of ids) {
      await aktion(page, 'wk-unit', { id });
      for (const m of ['schnell', 'praxis', 'experte', 'ueben']) {
        await page.click(`.tfseg [data-m="${m}"]`);
        const w = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
        if (!w) breit.push(id + ':' + m);
        ok++;
      }
    }
    check('Alle Einheiten in vier Modi gerendert', ok === ids.length * 4 && ids.length >= 17, ok);
    check('Mobil kein seitliches Scrollen in allen Modi', breit.length === 0, breit.join(', '));
    check('Keine JS-Fehler beim Durchklicken', fehler.length === 0, fehler.join(' | '));
    await ctx.close();
  }
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
