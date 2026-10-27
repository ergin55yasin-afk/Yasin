/* ================= Kundenübersicht und Kundenprofil ================= */
/* Kunden werden über ihre Nummer geführt. Namen werden bewusst nicht gespeichert. */
function kundeInfo(n){
  var T=todayIso();
  var td=db.todos.filter(function(x){return x.kunde===n&&!x.done});
  var nt=db.termine.filter(function(x){return x.kunde===n&&x.datum>=T}).sort(function(a,b){return a.datum.localeCompare(b.datum)||(a.zeit||'').localeCompare(b.zeit||'')})[0];
  return {td:td.length,late:td.filter(function(x){return x.due&&x.due<T}).length,ag:db.angebote.filter(function(x){return x.kunde===n&&isOpenAng(x)}).length,
    bt:db.beratungen.filter(function(x){return x.kunde===n}).length,lauf:laufendFuer(n)[0],nt:nt,last:kundeLast(n)};
}
function kundenListHtml(){
  var q=kundeQuery.trim().toUpperCase();
  var nums=allKunden().filter(function(n){return !q||n.indexOf(q)>-1}).sort(function(a,b){return kundeLast(b).localeCompare(kundeLast(a))||a.localeCompare(b)});
  if(!nums.length)return leer(q?'Keine Kundennummer gefunden.':'Noch keine Kunden erfasst. Kunden entstehen, sobald du einen Eintrag oder eine Beratung mit Kundennummer anlegst.','<button class="btn small primary" data-act="add">Ersten Eintrag anlegen</button>');
  return '<div class="clist">'+nums.map(function(n){
    var i=kundeInfo(n),tags=[];
    if(i.lauf)tags.push('<span class="stat-pill s-run">Beratung läuft</span>');
    if(i.late)tags.push('<span class="stat-pill s-late">'+i.late+' überfällig</span>');
    return '<button class="ccard" data-act="open-kunde" data-k="'+esc(n)+'"><span class="avatar" aria-hidden="true">'+esc(n.slice(-2))+'</span><span class="cc-b"><span class="cc-n">'+esc(n)+'</span><span class="cc-m">'+
      [i.nt?'Termin '+fmtDate(i.nt.datum)+(i.nt.zeit?' '+i.nt.zeit:''):'',i.td?i.td+(i.td===1?' Aufgabe':' Aufgaben'):'',i.ag?i.ag+(i.ag===1?' Angebot':' Angebote'):'',i.bt?i.bt+(i.bt===1?' Beratung':' Beratungen'):''].filter(Boolean).join(' · ')+
      '</span></span><span class="cc-t">'+tags.join('')+(i.last?'<small>zuletzt '+esc(fmtDate(i.last))+'</small>':'')+'</span></button>';
  }).join('')+'</div>';
}
function viewKunden(){
  return '<div class="toolbar"><label class="searchf">'+ico('search',18)+'<input type="text" id="kq" placeholder="Kundennummer suchen" value="'+esc(kundeQuery)+'" autocomplete="off" aria-label="Kundennummer suchen"></label><button class="btn primary" data-act="add">'+ico('plus',18)+'Neuer Eintrag</button></div><div id="klist">'+kundenListHtml()+'</div>';
}
function openKunde(nr){if(!nr)return;closeSheet();kundeAkt=nr;tab='kunde';render();window.scrollTo(0,0)}
function viewKunde(){
  var nr=kundeAkt;if(!nr)return viewKunden();
  var i=kundeInfo(nr),T=todayIso();
  var sess=db.laufend.filter(function(s){return s.kunde===nr}).sort(function(a,b){return b.updated-a.updated});
  var td=db.todos.filter(function(x){return x.kunde===nr}).sort(function(a,b){return (a.done-b.done)||(a.due||'9999').localeCompare(b.due||'9999')});
  var ag=db.angebote.filter(function(x){return x.kunde===nr}).sort(function(a,b){return (b.ts||0)-(a.ts||0)});
  var tm=db.termine.filter(function(x){return x.kunde===nr}).sort(function(a,b){return b.datum.localeCompare(a.datum)});
  var be=db.beratungen.filter(function(x){return x.kunde===nr}).sort(function(a,b){return b.datum.localeCompare(a.datum)});
  var vv=db.vertraege.filter(function(x){return x.kunde===nr}).sort(function(a,b){return a.ablauf.localeCompare(b.ablauf)});
  var h='<button class="lnk back" data-act="tab" data-tab="kunden">'+ico('back',16)+'Alle Kunden</button>';
  h+='<section class="profile"><span class="avatar xl" aria-hidden="true">'+esc(nr.slice(-2))+'</span><div class="pf-t"><p class="eyebrow">Kundennummer</p><h2>'+esc(nr)+'</h2><p class="muted">'+(i.last?'Zuletzt Kontakt '+esc(fmtFull(i.last)):'Noch kein Kontakt erfasst')+(i.nt?' · nächster Termin '+esc(fmtDate(i.nt.datum))+(i.nt.zeit?' '+esc(i.nt.zeit):''):'')+'</p></div>'+
    '<div class="pf-a">'+(i.lauf?'<button class="btn primary" data-act="bs-open" data-id="'+i.lauf.id+'">'+ico('play',18)+'Beratung fortsetzen</button>':'<button class="btn primary" data-act="bs-neu" data-k="'+esc(nr)+'">'+ico('play',18)+'Beratung starten</button>')+
    '<button class="btn" data-act="add-for" data-k="'+esc(nr)+'">'+ico('plus',18)+'Eintrag</button><button class="btn" data-act="export-akte" data-k="'+esc(nr)+'">'+ico('doc',18)+'Akte</button></div></section>';
  // Kennzahlen nur als Fakten
  h+='<div class="facts-row">'+[['Offene Aufgaben',i.td],['Offene Angebote',i.ag],['Beratungen',i.bt],['Verträge mit Ablauf',vv.length]].map(function(f){return '<div><b>'+f[1]+'</b><span>'+f[0]+'</span></div>'}).join('')+'</div>';
  h+='<div class="dash"><div class="dash-main">';
  // Themen und Bedarfe aus Beratungen
  var bed=[];sess.forEach(function(s){Object.keys(s.themen||{}).forEach(function(k){bed.push({s:s,k:k,b:(s.bedarf||{})[k]||''})})});
  h+=sec('Themen und Bedarfe',null,'',bed.length?'<ul class="needs">'+bed.map(function(x){return '<li><span class="nd-ic" aria-hidden="true">'+ico(themaIcon(x.k),18)+'</span><span class="nd-t"><b>'+esc(themaName(x.k))+'</b><small>'+(x.s.status==='abgeschlossen'?'Beratung abgeschlossen ':'Beratung läuft ')+esc(fmtFull(iso(new Date(x.s.updated))))+'</small></span>'+bedarfPill(x.b)+'</li>'}).join('')+'</ul><p class="fine-s">„Vermutet“ ist eine interne Einschätzung und wurde nicht mit dem Kunden bestätigt.</p>':leer('Noch keine Themen aus einer Beratung erfasst.'));
  var lb=[];sess.forEach(function(x){felderGeklaert(x).forEach(function(f){lb.push({s:x,f:f})})});
  if(lb.length)h+=sec('Weitere Lebensbereiche',null,'','<ul class="needs">'+lb.map(function(x){var st=x.f.e.jetzt&&feldStatusVon(x.s,x.f.k)!=='bestaetigt'?'jetzt':feldStatusVon(x.s,x.f.k),wv=x.f.e.wv&&db.todos.find(function(t){return t.id===x.f.e.wv});return '<li><span class="nd-ic" aria-hidden="true">'+ico(x.f.f.ic,18)+'</span><span class="nd-t"><b>'+esc(x.f.f.t)+'</b><small>'+esc(fmtFull(iso(new Date(x.f.e.ts||x.s.updated))))+(wv?' · Wiedervorlage am '+esc(fmtFull(wv.due)):'')+'</small></span><span class="stat-pill s-'+({jetzt:'info',angesprochen:'info',bestaetigt:'ok',spaeter:'warn',nein:'muted'})[st]+'">'+(st==='jetzt'?'Besprochen':FSTATUS_K[st])+'</span></li>'}).join('')+'</ul><p class="fine-s">Bereiche, die im Überblick mit dem Kunden angesprochen wurden. Nicht angesprochene Bereiche erscheinen hier nicht.</p>');
  h+=sec('Beratungen',sess.length+be.length,'',(sess.length?'<ul class="runs">'+sess.map(laufKarte).join('')+'</ul>':'')+(be.length?'<ul class="list-s">'+be.map(function(b){return '<li><button data-act="open-ber" data-id="'+b.id+'"><b>'+esc(b.bereich)+'</b><span>'+esc(fmtFull(b.datum))+' · '+esc(ergLabel(b))+'</span>'+(b.note?'<small>'+esc(b.note)+'</small>':'')+'</button></li>'}).join('')+'</ul>':'')+(!sess.length&&!be.length?leer('Noch keine Beratung.'):''));
  h+=sec('Verlauf',null,'',kundeTimeline(nr));
  h+='</div><div class="dash-side">';
  h+=sec('Aufgaben',i.td,'<button class="lnk" data-act="add-for" data-k="'+esc(nr)+'">'+ico('plus',16)+'Neu</button>',td.length?'<ul class="tasks">'+td.map(function(x){return x.done?'<li class="task done"><span class="dot-i">✓</span><span class="task-b"><span class="task-t">'+esc(x.text)+'</span></span></li>':aufgabeZeile(x,T)}).join('')+'</ul>':leer('Keine Aufgaben.'));
  h+=sec('Termine',tm.length,'',tm.length?'<ul class="list-s">'+tm.map(function(t){return '<li><span><b>'+esc(fmtFull(t.datum))+(t.zeit?' '+esc(t.zeit):'')+'</b><span>'+esc(t.anliegen?themaName(t.anliegen):(t.sparte||'Termin'))+'</span>'+(t.note?'<small>'+esc(t.note)+'</small>':'')+'</span></li>'}).join('')+'</ul>':leer('Keine Termine.'));
  h+=sec('Verträge und Fristen',vv.length,'',vv.length?'<ul class="list-s">'+vv.map(function(v){var x=vtInfo(v);return '<li><button data-act="open-vertrag" data-id="'+v.id+'"><b>'+esc(v.sparte)+'</b><span>läuft ab '+esc(fmtFull(v.ablauf))+'</span><span class="stat-pill s-'+(x.st==='verpasst'||x.st==='dringend'?'late':x.st==='ok'?'ok':'info')+'">'+(x.st==='abgelaufen'?'abgelaufen':x.st==='verpasst'?'Frist verpasst':x.st==='ok'?'läuft':'Kündigung bis '+fmtFull(x.bis))+'</span></button></li>'}).join('')+'</ul>':leer('Keine Verträge mit Ablaufdatum.'));
  h+=sec('Angebote',ag.length,'',ag.length?'<ul class="list-s">'+ag.map(function(a){return '<li><button data-act="open-ang" data-id="'+a.id+'"><b>'+esc(a.sparte)+'</b><span>'+STATUS[a.status]+(isOpenAng(a)&&a.nachfass?' · nachfassen '+esc(fmtDate(a.nachfass)):'')+'</span></button></li>'}).join('')+'</ul>':leer('Keine Angebote.'));
  h+='<div class="danger-z"><button class="btn danger small" data-act="del-kunde" data-k="'+esc(nr)+'" data-confirm="Wirklich alles zu dieser Nummer löschen?">Kundennummer samt Einträgen löschen</button></div>';
  h+='</div></div>';
  return h;
}
