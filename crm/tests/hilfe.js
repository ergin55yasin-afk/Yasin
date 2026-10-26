// Gemeinsame Hilfen für die Browser-Tests (Playwright). Keine echten Kundendaten.
const { chromium } = require('playwright');
const path = require('path');
const DATEI = path.resolve(process.env.CRM_FILE || path.join(__dirname, '..', 'index.html'));
const JSPDF = process.env.JSPDF_PATH;
function tag(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
// Bestandsdaten im alten Format (v2), um die Übernahme zu prüfen
function beispiel() {
  return { v: 2, dismissed: {}, lastBackup: Date.now(), settings: {},
    todos: [
      { id: 't1', kunde: '10482', text: 'Renteninformation anfordern', due: tag(-2), done: false, ts: 1 },
      { id: 't2', kunde: '10483', text: 'Rückmeldung zum Angebot', due: tag(1), done: false, ts: 2, wait: true },
      { id: 't3', kunde: '10484', text: 'Unterlagen vorbereiten', due: tag(0), done: false, ts: 3 },
      { id: 't4', kunde: '10484', text: 'Erledigte Aufgabe', due: tag(-5), done: true, ts: 4 }],
    angebote: [{ id: 'a1', kunde: '10482', sparte: 'Hausrat', status: 'offen', nachfass: tag(3), note: '', log: [], ts: 3 }],
    termine: [{ id: 'm1', kunde: '10484', datum: tag(0), sparte: 'Kranken', note: '', ts: 4 }, { id: 'm2', kunde: '10482', datum: tag(30), sparte: '', note: '', ts: 5 }],
    beratungen: [{ id: 'b1', kunde: '10482', bereich: 'Altersvorsorge', datum: tag(-20), note: 'Lücke besprochen', wv: '', erg: 'angebot', grund: '', ber: '', fil: '', ts: 5 }],
    vertraege: [{ id: 'v1', kunde: '10483', sparte: 'KFZ', ablauf: tag(40), frist: '1', note: '', ts: 6 }],
    settings: { wissen: [{ id: 'w1', titel: 'Einwand: Zu teuer', text: 'Musterantwort aus dem Training', ts: 1 }] } };
}
async function start(opt) {
  opt = opt || {};
  const browser = opt.browser || await chromium.launch();
  const ctx = await browser.newContext({ viewport: opt.viewport || { width: 1440, height: 900 } });
  if (opt.clipboard) await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) fehler.push(m.text()) });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/jspdf.umd.min.js', r => JSPDF ? r.fulfill({ path: JSPDF, contentType: 'text/javascript' }) : r.abort());
  if (opt.daten !== false) await page.addInitScript(s => { if (!sessionStorage.getItem('geladen')) { localStorage.setItem('nachbereitung.v1', s); sessionStorage.setItem('geladen', '1') } }, JSON.stringify(opt.daten || beispiel()));
  await page.goto('file://' + DATEI);
  return { browser, ctx, page, fehler };
}
async function geheZu(page, t) { await page.evaluate(t => { const b = document.createElement('button'); b.dataset.act = 'tab'; b.dataset.tab = t; document.body.appendChild(b); b.click(); b.remove() }, t) }
async function aktion(page, act, data) { await page.evaluate(([a, d]) => { const b = document.createElement('button'); b.dataset.act = a; Object.assign(b.dataset, d || {}); document.body.appendChild(b); b.click(); b.remove() }, [act, data]) }
function pruefer() {
  let n = 0, f = 0;
  const check = (name, ok, info) => { n++; if (!ok) f++; console.log((ok ? 'OK     ' : 'FEHLER ') + name + (info !== undefined ? ' -> ' + String(info).slice(0, 200) : '')) };
  check.ende = () => { console.log(f ? `\n${f} von ${n} Prüfungen fehlgeschlagen.` : `\nAlle ${n} Prüfungen bestanden.`); return f };
  return check;
}
async function db(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('nachbereitung.v1'))) }
module.exports = { start, geheZu, aktion, pruefer, db, tag, beispiel, DATEI, JSPDF };
