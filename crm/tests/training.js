// Training: Rollenspiel mit Feedback am Ende. Die KI wird simuliert (window.claude).
const { start, geheZu, pruefer } = require('./hilfe');
const check = pruefer();
(async () => {
  const { browser, ctx } = await start({ daten: false });
  await ctx.close();
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await c2.addInitScript(() => {
    window.__calls = [];
    const sample = function (turns, opt) { window.__calls.push({ art: 'chat', turns }); return Promise.resolve({ text: 'Ich bin skeptisch, was bringt mir das?' }) };
    sample.json = function (prompt, opt) {
      window.__calls.push({ art: 'json', prompt, opt });
      if (window.__failNext) { window.__failNext = false; return Promise.reject({ code: 'rate_limited' }) }
      return Promise.resolve({ gesamt: 'Guter Einstieg, Einwand zu schnell übergangen.', staerken: ['Freundlich begrüßt', 'Offene Frage gestellt', 'Ruhig geblieben'], verbesserungen: ['Beim Einwand nachfragen', 'Nutzen in Euro zeigen', 'Nächsten Schritt vereinbaren'], satz: 'Was genau macht Sie skeptisch?', punkte: 3 });
    };
    window.claude = { use: name => Promise.resolve(name === 'sample' ? sample : null) };
  });
  const page = await c2.newPage();
  const fehler = []; page.on('pageerror', e => fehler.push(e.message));
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.goto('file://' + require('./hilfe').DATEI);
  await geheZu(page, 'training');
  await page.click('[data-act="tr-mode"][data-id="rolle"]');
  await page.click('[data-act="tr-role"][data-id="skeptiker"]');
  // Fall 1: ohne eigene Antwort beenden
  await page.click('[data-act="tr-start"]');
  await page.waitForTimeout(100);
  await page.click('[data-act="tr-end"]');
  check('Ohne eigene Antwort: klare Meldung statt stillem Abbruch', /mindestens eine eigene Antwort/.test(await page.locator('#tr-fb').innerText()));
  // Fall 2: Gespräch mit Antwort
  await page.click('[data-act="tr-start"]');
  await page.waitForTimeout(100);
  await page.fill('#ci-tr', 'Guten Tag, schön dass Sie da sind. Was beschäftigt Sie?');
  await page.click('[data-act="chat-send"]');
  await page.waitForTimeout(100);
  await page.click('[data-act="tr-end"]');
  await page.waitForTimeout(150);
  const calls = await page.evaluate(() => window.__calls);
  const fbCall = calls.filter(x => x.art === 'json').pop();
  check('Feedback ist ein eigener Aufruf als Coach', !!fbCall && /Verkaufstrainer/.test(fbCall.prompt));
  check('Feedback-Aufruf enthält keine Rollenanweisung des Kunden', fbCall && !/Beende die Rolle nie/.test(fbCall.prompt) && !/DU bist der KUNDE/.test(fbCall.prompt));
  check('Feedback-Aufruf enthält den Gesprächsverlauf', fbCall && /BERATER: Guten Tag/.test(fbCall.prompt) && /KUNDE: Ich bin skeptisch/.test(fbCall.prompt));
  const fb = await page.locator('#tr-fb').innerText();
  check('Feedback-Karte mit Stärken, Verbesserungen und Satz', /Das war gut/.test(fb) && /Beim Einwand nachfragen/.test(fb) && /Was genau macht Sie skeptisch/.test(fb) && /3 von 5/i.test(fb));
  check('Nach dem Ende kein zweiter „Beenden“-Knopf', await page.locator('[data-act="tr-end"]').count() === 0);
  check('Feedback ist keine Kundennachricht im Chat', !/Das war gut/.test(await page.locator('#cm-tr').innerText()));
  // Fall 3: Fehler und erneut anfordern
  await page.evaluate(() => { window.__failNext = true });
  await page.click('[data-act="tr-start"]');
  await page.waitForTimeout(100);
  await page.fill('#ci-tr', 'Darf ich fragen, was Sie vorsichtig macht?');
  await page.click('[data-act="chat-send"]');
  await page.waitForTimeout(100);
  await page.click('[data-act="tr-end"]');
  await page.waitForTimeout(100);
  check('Fehler wird verständlich angezeigt', /zu viele Anfragen/i.test(await page.locator('#tr-fb').innerText()));
  await page.click('[data-act="tr-fb-retry"]');
  await page.waitForTimeout(150);
  check('Erneut anfordern liefert das Feedback', /Das war gut/.test(await page.locator('#tr-fb').innerText()));
  check('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
  await browser.close();
  process.exit(check.ende() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
