// Training: Szenarien, freies Rollenspiel, Coaching-Glühbirne, strukturiertes Feedback, Verlauf.
// Die KI wird simuliert (window.claude). Aufruf: node tests/training.js [fotoordner]
const path = require('path');
const fs = require('fs');
const { start, geheZu, pruefer, db, DATEI } = require('./hilfe');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
const check = pruefer();
(async () => {
  const { browser, ctx } = await start({ daten: false });
  await ctx.close();
  for (const vp of [{ n: 'desktop', width: 1280, height: 900 }, { n: 'mobil', width: 390, height: 844 }]) {
    console.log('\n== ' + vp.n);
    const c2 = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await c2.addInitScript(() => {
      window.__calls = [];
      window.__n = 0;
      const antworten = ['Hallo. Die Bank meinte, ich soll mal vorbeikommen. Ehrlich gesagt bin ich skeptisch, was bringt mir das?', 'Okay.', 'Na gut, und was kostet mich das im Monat?', 'Hm, das muss ich mir überlegen.'];
      const sample = function (turns, opt) { window.__calls.push({ art: 'chat', turns }); return Promise.resolve({ text: antworten[Math.min(window.__n++, antworten.length - 1)] }) };
      sample.json = function (prompt, opt) {
        window.__calls.push({ art: 'json', prompt, opt });
        if (window.__failNext) { window.__failNext = false; return Promise.reject({ code: 'rate_limited' }) }
        if (/LETZTE AUSSAGE DES KUNDEN/.test(prompt)) {
          if (/„Okay\.“/.test(prompt)) return Promise.resolve({ geeignet: false });
          return Promise.resolve({ geeignet: true, stichwort: 'Skepsis zum Nutzen', hintergrund: ['Vielleicht schlechte Erfahrung mit Beratung', 'Möglicherweise unklar, warum die Bank den Termin vorschlug'], erkennen: 'Der Kunde sagt offen, dass er skeptisch ist.', reaktionen: [{ weg: 'Nachfragen', satz: 'Was macht Sie skeptisch?' }, { weg: 'Rahmen klären', satz: 'Darf ich kurz sagen, worum es heute gehen kann?' }], vermeiden: ['Sofort Produkte vorstellen'], lernziel: 'Skepsis aufnehmen statt übergehen.' });
        }
        // Feedback: ein wörtliches Zitat, ein erfundenes Zitat, ein Bereich ohne Bewertung
        return Promise.resolve({ gesamt: 'Freundlicher Einstieg, beim Preis zu schnell geantwortet.',
          bereiche: [{ key: 'eroeffnung', score: 4, einschaetzung: 'Freundlich und klar.' }, { key: 'fragen', score: 3, einschaetzung: 'Eine offene Frage.' }, { key: 'zuhoeren', score: 3, einschaetzung: 'Teilweise aufgegriffen.' }, { key: 'einwand', score: 2, einschaetzung: 'Skepsis übergangen.' }, { key: 'fachlich', score: null, einschaetzung: 'Keine fachliche Aussage im Gespräch.' }, { key: 'ganzheitlich', score: 2, einschaetzung: 'Lebenssituation nicht erfragt.' }, { key: 'abschluss', score: null, einschaetzung: 'Kein Abschluss erreicht.' }],
          punkte: [{ bereich: 'eroeffnung', ref: 'B1', zitat: 'schön dass Sie da sind', bewertung: 'gut', warum: 'Wertschätzender Einstieg.', alternative: '', wirkung: '', faehigkeit: 'Beziehung aufbauen' },
            { bereich: 'einwand', ref: 'B2', zitat: 'Das ist ganz sicher das beste Produkt am Markt', bewertung: 'verbesserbar', warum: 'Die Skepsis wurde nicht aufgegriffen.', alternative: 'Was genau macht Sie skeptisch?', wirkung: 'Der Kunde fühlt sich ernst genommen.', faehigkeit: 'Einwände erfragen' }],
          staerken: ['Freundlich begrüßt', 'Ruhig geblieben', 'Klar gesprochen'], entwicklung: ['Skepsis erfragen', 'Lebenssituation verstehen', 'Nächsten Schritt anbieten'], uebung: 'Übe drei Varianten der Frage nach dem Grund der Skepsis.' });
      };
      window.claude = { use: name => Promise.resolve(name === 'sample' ? sample : null) };
    });
    const page = await c2.newPage();
    const fehler = []; page.on('pageerror', e => fehler.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto('file://' + DATEI);
    const shot = async n => { if (out) { fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: path.join(out, `tr-${vp.n}-${n}.png`), fullPage: true }) } };
    const calls = () => page.evaluate(() => window.__calls);
    const senden = async t => { await page.fill('#ci-tr', t); await page.click('[data-act="chat-send"]'); await page.waitForTimeout(120) };
    await geheZu(page, 'training');
    check('Einwandtrainer bleibt erhalten', await page.locator('[data-act="tr-mode"][data-id="drill"]').count() === 1);
    await page.click('[data-act="tr-mode"][data-id="rolle"]');
    check('Sieben Szenarien wählbar', await page.locator('[data-act="tr-szen"]').count() === 7);
    check('Bisherige Kundenrollen bleiben erhalten', (await page.locator('[data-act="tr-role"]').evaluateAll(b => b.map(x => x.dataset.id))).join() === 'offen,skeptiker,preis,zeit,bank');
    check('Zwei Modi: frei und mit Coaching', await page.locator('[data-act="tr-modus"]').count() === 2);
    // ---- Fall 1: ohne eigene Antwort beenden
    await page.click('[data-act="tr-start"]');
    await page.waitForTimeout(100);
    await page.click('[data-act="tr-end"]');
    check('Ohne eigene Antwort: klare Meldung', /mindestens eine eigene Antwort/.test(await page.locator('#tr-fb').innerText()));
    // ---- Fall 2: Modus A, frei, kurzes Gespräch
    await page.click('[data-act="tr-szen"][data-id="einwand"]');
    await page.click('[data-act="tr-role"][data-id="skeptiker"]');
    await page.evaluate(() => { window.__calls = []; window.__n = 0 });
    await page.click('[data-act="tr-start"]');
    await page.waitForTimeout(120);
    const rolle = (await calls()).find(x => x.art === 'chat').turns[0].content;
    check('Kundenrolle mit Szenario und „bleib in der Rolle“', /Einwandbehandlung/.test(rolle) && /Berufsunfähigkeit/.test(rolle) && /Bleib immer in der Rolle/.test(rolle) && /Gib kein Feedback/.test(rolle));
    check('Szenario ist während des Gesprächs gesperrt', await page.locator('[data-act="tr-szen"][disabled]').count() === 7);
    await senden('Guten Tag, schön dass Sie da sind. Was beschäftigt Sie?');
    check('Freies Rollenspiel: keine Coaching-Anfrage', !(await calls()).some(x => x.art === 'json'));
    check('Freies Rollenspiel: keine Glühbirne', await page.locator('.tr-bulb').count() === 0);
    await page.click('[data-act="tr-end"]');
    await page.waitForTimeout(150);
    const fbCall = (await calls()).filter(x => x.art === 'json').pop();
    check('Feedback ist ein eigener Coach-Aufruf ohne Kundenrolle', /Verkaufstrainer/.test(fbCall.prompt) && !/DU bist der KUNDE/.test(fbCall.prompt) && !/Deine Lage/.test(fbCall.prompt));
    check('Feedback-Aufruf mit nummeriertem Verlauf', /B1: Guten Tag/.test(fbCall.prompt) && /K1: Hallo/.test(fbCall.prompt));
    check('Feedback fragt alle sieben Bereiche ab', ['Gesprächseröffnung', 'Fragetechnik', 'Zuhören', 'Einwandbehandlung', 'Fachliche Qualität', 'Ganzheitliche Beratung', 'Gesprächsabschluss'].every(t => fbCall.prompt.includes(t)));
    let fb = await page.locator('#tr-fb').innerText();
    check('Wenig Gesprächsstoff wird gekennzeichnet', /Wenig Gesprächsstoff/.test(fb));
    check('Kompetenzen mit Werten und „nicht beurteilbar“', /Kompetenzen/i.test(fb) && /4 von 5/.test(fb) && /nicht beurteilbar/.test(fb) && /Durchschnitt 2,8 von 5 aus 5/.test(fb));
    check('Top 3 Stärken und Entwicklungsfelder', /Freundlich begrüßt/.test(fb) && /Skepsis erfragen/.test(fb));
    check('Wörtliches Zitat wird als Beobachtung belegt', /wörtlich aus dem Gespräch/i.test(fb) && /schön dass Sie da sind/.test(fb));
    check('Erfundenes Zitat wird nicht gezeigt', !/beste Produkt am Markt/.test(fb));
    check('Punkt mit Alternative, Wirkung und Fähigkeit', /Was genau macht Sie skeptisch/.test(fb) && /fühlt sich ernst genommen/.test(fb) && /Einwände erfragen/.test(fb));
    check('Beobachtung und KI-Einschätzung getrennt', /Beobachtung/i.test(fb) && /Einschätzung der KI/i.test(fb));
    check('Konkrete Übung', /drei Varianten/.test(fb));
    check('Feedback ist keine Kundennachricht im Chat', !/Das war gut/.test(await page.locator('#cm-tr').innerText()));
    await shot('1-feedback');
    // ---- Fall 3: Modus B, mit Coaching
    await page.click('[data-act="tr-szen"][data-id="erst"]');
    await page.click('[data-act="tr-modus"][data-id="coach"]');
    await page.evaluate(() => { window.__calls = []; window.__n = 0 });
    await page.click('[data-act="tr-start"]');
    await page.waitForTimeout(200);
    const coachCall = (await calls()).find(x => x.art === 'json');
    check('Coaching-Anfrage zur Kundenaussage', !!coachCall && /LETZTE AUSSAGE DES KUNDEN/.test(coachCall.prompt) && /skeptisch/.test(coachCall.prompt));
    check('Coaching kennt die verdeckte Kundenrolle nicht und nimmt nichts vorweg', !/Deine Lage|Einzelhandel/.test(coachCall.prompt) && /NICHT voraus/.test(coachCall.prompt));
    check('Glühbirne erscheint bei geeigneter Aussage', await page.locator('.tr-bulb').count() === 1);
    check('Coaching ist anfangs geschlossen', await page.locator('.tr-coach').count() === 0);
    await page.click('.tr-bulb');
    const co = await page.locator('.tr-coach').innerText();
    check('Coaching-Panel mit A bis E und Hypothesen-Kennzeichnung', /Möglicher Hintergrund/i.test(co) && /Hypothesen/i.test(co) && /erkennen/i.test(co) && /Antwortwege/i.test(co) && /vermeiden/i.test(co) && /Lernziel/i.test(co));
    check('Coaching bezieht sich auf die konkrete Aussage', /Zur Aussage: „Hallo\. Die Bank meinte/.test(co));
    await shot('2-coaching');
    await page.click('[data-act="tr-coach-close"]');
    check('Coaching lässt sich schließen', await page.locator('.tr-coach').count() === 0);
    await senden('Das verstehe ich. Was macht Sie denn skeptisch, wenn ich fragen darf?');
    check('Gespräch läuft nach dem Coaching normal weiter', /Okay\./.test(await page.locator('#cm-tr').innerText()));
    check('Keine Glühbirne bei ungeeigneter Aussage', await page.locator('.tr-bulb').count() === 1);
    await senden('Erzählen Sie mir gern, wie Sie heute leben und was Ihnen für die nächsten Jahre wichtig ist.');
    await senden('Bevor ich etwas zu Kosten sage, möchte ich verstehen, was Sie absichern möchten. Darf ich ein paar Fragen stellen?');
    check('Weitere Glühbirne bei neuer geeigneter Aussage', await page.locator('.tr-bulb').count() >= 2);
    check('Coaching-Texte gehen nicht in die Kundenrolle ein', !(await calls()).filter(x => x.art === 'chat').some(x => x.turns.some(t => /Skepsis aufnehmen/.test(t.content))));
    await page.click('[data-act="tr-end"]');
    await page.waitForTimeout(200);
    fb = await page.locator('#tr-fb').innerText();
    check('Bei ausreichend Gesprächsstoff kein Datenhinweis', !/Wenig Gesprächsstoff/.test(fb) && /mit Coaching/i.test(fb));
    // ---- Verlauf
    let d = await db(page);
    check('Verlauf: zwei Übungen gespeichert, mit Feedback', d.training.length === 2 && d.training.every(e => e.fb && e.msgs.length >= 2) && d.training[0].modus === 'coach' && d.training[0].coachN === 1);
    check('Verlauf auf der Seite', await page.locator('[data-act="tr-hist"]').count() === 2);
    await page.click('[data-act="tr-hist"] >> nth=1');
    const hs = await page.locator('#sheet').innerText();
    check('Frühere Übung zeigt Feedback und Verlauf', /Einwandbehandlung/.test(hs) && /Kompetenzen/i.test(hs) && /Gesprächsverlauf/.test(hs));
    await shot('3-verlauf');
    await page.click('#sheet [data-act="tr-hist-del"]');
    await page.click('#sheet [data-act="tr-hist-del"]');
    await page.waitForTimeout(100);
    d = await db(page);
    check('Übung löschen', d.training.length === 1 && await page.locator('[data-act="tr-hist"]').count() === 1);
    // ---- Fehler und erneut anfordern
    await page.evaluate(() => { window.__failNext = false });
    await page.click('[data-act="tr-modus"][data-id="frei"]');
    await page.evaluate(() => { window.__n = 0 });
    await page.click('[data-act="tr-start"]');
    await page.waitForTimeout(100);
    await senden('Darf ich fragen, was Sie vorsichtig macht?');
    await page.evaluate(() => { window.__failNext = true });
    await page.click('[data-act="tr-end"]');
    await page.waitForTimeout(100);
    check('Fehler wird verständlich angezeigt', /zu viele Anfragen/i.test(await page.locator('#tr-fb').innerText()));
    await page.click('[data-act="tr-fb-retry"]');
    await page.waitForTimeout(150);
    check('Erneut anfordern liefert das Feedback', /Das war gut/.test(await page.locator('#tr-fb').innerText()));
    check('Verlauf ergänzt das Feedback der Übung', (await db(page)).training.length === 2 && !!(await db(page)).training[0].fb);
    check('Kein seitliches Scrollen', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    check('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
    await c2.close();
  }
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
