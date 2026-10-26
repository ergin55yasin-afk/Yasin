// Prüft: "Sicherung als Text kopieren" -> "Kopieren" kopiert die Sicherung und vermerkt das Sicherungsdatum.
const { chromium } = require('playwright');
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage();
  await p.route('https://fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(() => localStorage.setItem('nachbereitung.v1', JSON.stringify({v:2,todos:[{id:'t',kunde:'1',text:'x',due:'',done:false,ts:1}],angebote:[],termine:[],beratungen:[],vertraege:[],dismissed:{},lastBackup:0,settings:{}})));
  await p.goto('file://' + file);
  await p.click('[data-act="more"]'); await p.click('[data-act="more-go"][data-to="menu"]');
  await p.click('[data-act="backup-copy"]');
  await p.click('#sheetbody [data-backup="1"]');
  await p.waitForTimeout(300);
  const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  const last = await p.evaluate(() => JSON.parse(localStorage.getItem('nachbereitung.v1')).lastBackup);
  const ok = clip.includes('"todos"') && last > 0;
  console.log('Zwischenablage beginnt mit:', JSON.stringify(clip.slice(0, 40)), '| lastBackup:', last);
  console.log(ok ? 'OK: Sicherung kopiert und vermerkt' : 'FEHLER: falscher Inhalt kopiert oder Sicherung nicht vermerkt');
  await b.close(); process.exit(ok ? 0 : 1);
})();
