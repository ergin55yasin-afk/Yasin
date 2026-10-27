/* ================= Startseite: persönlicher Beratungsnavigator ================= */
/* Zeigt nur, was in den Daten steht: Termine, Aufgaben, laufende Beratungen, vereinbarte Wiedervorlagen.
   Keine erzeugten Verkaufschancen. */
function gruss(){var h=new Date().getHours();return h<11?'Guten Morgen':h<18?'Guten Tag':'Guten Abend'}
function zeitTxt(t){return t&&t.zeit?t.zeit+' Uhr':'ohne Uhrzeit'}
function terminStatus(t){
  var L=laufendFuer(t.kunde)[0];
  if(L){var i=sessionPos(L);return {cls:'run',t:'Beratung läuft',s:'Schritt '+i.nr+' von '+i.n+': '+i.name}}
  var b=db.beratungen.filter(function(x){return x.kunde===t.kunde}).sort(function(a,c){return c.datum.localeCompare(a.datum)})[0];
  if(b)return {cls:'done',t:'Zuletzt beraten',s:fmtFull(b.datum)+', '+b.bereich+' ('+ergLabel(b)+')'};
  return {cls:'new',t:'Erstes Gespräch',s:'Noch keine Beratung erfasst'};
}
function terminVorb(t){
  var k=t.kunde,v=[],T=todayIso();
  var td=db.todos.filter(function(x){return x.kunde===k&&!x.done});
  var late=td.filter(function(x){return x.due&&x.due<T}).length;
  if(late)v.push(late+(late===1?' überfällige Aufgabe':' überfällige Aufgaben'));
  var w=td.filter(function(x){return x.wait}).length;if(w)v.push(w+' Rückmeldung'+(w===1?'':'en')+' offen');
  var ag=db.angebote.filter(function(a){return a.kunde===k&&isOpenAng(a)}).length;if(ag)v.push(ag+(ag===1?' offenes Angebot':' offene Angebote'));
  var L=laufendFuer(k)[0];if(L){var of=sessionOffen(L).length;if(of)v.push(of+(of===1?' offene Frage':' offene Fragen')+' aus der Beratung')}
  var fr=db.vertraege.filter(function(x){if(x.kunde!==k)return false;var i=vtInfo(x);return i.st==='dringend'||i.st==='verpasst'||i.st==='bald'}).length;if(fr)v.push(fr+(fr===1?' Vertragsfrist':' Vertragsfristen')+' im Blick');
  return v;
}
function naechsterSchritt(k){
  var L=laufendFuer(k)[0];if(L&&L.doku&&L.doku.next)return L.doku.next;
  var td=db.todos.filter(function(x){return x.kunde===k&&!x.done}).sort(function(a,b){return (a.due||'9999').localeCompare(b.due||'9999')})[0];
  return td?td.text+(td.due?' ('+fmtDate(td.due)+')':''):'';
}
function terminKarte(t){
  var st=terminStatus(t),v=terminVorb(t),nx=naechsterSchritt(t.kunde),L=laufendFuer(t.kunde)[0];
  var an=t.anliegen?themaName(t.anliegen):(t.sparte||'');
  return '<article class="appt"><div class="appt-time"><b>'+(t.zeit?esc(t.zeit):'–')+'</b><span>'+(t.datum===todayIso()?'heute':esc(fmtDate(t.datum)))+'</span></div>'+
    '<div class="appt-main"><div class="appt-h"><button class="kn" data-act="open-kunde" data-k="'+esc(t.kunde)+'">'+esc(t.kunde)+'</button>'+(an?'<span class="badge">'+esc(an)+'</span>':'')+'<span class="stat-pill s-'+st.cls+'">'+st.t+'</span></div>'+
    '<p class="appt-sub">'+esc(st.s)+(t.note?' · '+esc(t.note):'')+'</p>'+
    (v.length?'<ul class="appt-prep" aria-label="Vorbereitung">'+v.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'<p class="appt-sub muted">Keine offenen Punkte erfasst.</p>')+
    (nx?'<p class="appt-next"><span>Nächster Schritt</span>'+esc(nx)+'</p>':'')+
    '<div class="appt-act">'+(L?'<button class="btn small primary" data-act="bs-open" data-id="'+L.id+'">'+ico('play',16)+'Beratung fortsetzen</button>':'<button class="btn small primary" data-act="bs-neu" data-k="'+esc(t.kunde)+'"'+(t.anliegen?' data-a="'+t.anliegen+'"':'')+'>'+ico('play',16)+'Beratung vorbereiten</button>')+'<button class="btn small" data-act="open-kunde" data-k="'+esc(t.kunde)+'">Kundenprofil</button></div></div></article>';
}
function aufgabeZeile(x,T){
  var late=x.due&&x.due<T,today=x.due===T;
  return '<li class="task'+(late?' late':today?' today':'')+'"><button class="check" data-act="toggle-todo" data-id="'+x.id+'" aria-label="Erledigt: '+esc(x.text)+'"></button><button class="task-b" data-act="open-todo" data-id="'+x.id+'"><span class="task-t">'+(x.prio?'<i class="prio" title="Wichtig">!</i>':'')+esc(x.text)+'</span><span class="task-m"><b>'+esc(x.kunde)+'</b> · '+(x.due?(late?'überfällig seit '+fmtDate(x.due):today?'heute':fmtDate(x.due)):'ohne Datum')+(x.wait?' · wartet auf Kunde':'')+'</span></button></li>';
}
function sec(title,count,act,body,cls){return '<section class="card-s'+(cls?' '+cls:'')+'"><header class="cs-h"><h2>'+title+(count!=null?'<span class="cnt">'+count+'</span>':'')+'</h2>'+(act||'')+'</header>'+body+'</section>'}
function leer(t,btn){return '<div class="empty-s"><p>'+t+'</p>'+(btn||'')+'</div>'}
function viewStart(){
  var T=todayIso(),z7=addDaysIso(T,7),name=(db.settings&&db.settings.beraterName)||'';
  var ter=db.termine.filter(function(t){return t.datum>=T&&t.datum<=z7}).sort(function(a,b){return a.datum.localeCompare(b.datum)||(a.zeit||'99').localeCompare(b.zeit||'99')});
  var heute=ter.filter(function(t){return t.datum===T});
  var offen=db.todos.filter(function(x){return !x.done&&!x.wait});
  var ueber=offen.filter(function(x){return x.due&&x.due<T}),faellig=offen.filter(function(x){return x.due===T}),bald=offen.filter(function(x){return x.due&&x.due>T&&x.due<=z7});
  var lauf=laufendListe();
  var parts=[];
  parts.push(heute.length?heute.length+(heute.length===1?' Termin':' Termine')+' heute':'heute keine Termine');
  if(ueber.length+faellig.length)parts.push((ueber.length+faellig.length)+' fällige Aufgabe'+(ueber.length+faellig.length===1?'':'n'));
  if(lauf.length)parts.push(lauf.length+' laufende Beratung'+(lauf.length===1?'':'en'));
  var h='<section class="hello"><div class="hello-t"><p class="eyebrow">'+esc(new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'}))+'</p><h2>'+gruss()+(name?', '+esc(name):'')+'</h2><p class="hello-s">'+esc(parts.join(', '))+'.</p>'+
    '<div class="quick">'+
      '<button class="qbtn pri" data-act="bs-neu">'+ico('play',18)+'Neues Beratungsgespräch</button>'+
      (lauf[0]?'<button class="qbtn" data-act="bs-open" data-id="'+lauf[0].id+'">'+ico('arrow',18)+'Fortsetzen: '+esc(lauf[0].kunde||'ohne Nr.')+'</button>':'')+
      '<button class="qbtn" data-act="search">'+ico('search',18)+'Kunden suchen</button>'+
      '<button class="qbtn" data-act="add">'+ico('plus',18)+'Aufgabe erfassen</button>'+
      '<button class="qbtn" data-act="tab" data-tab="wissen">'+ico('book',18)+'Beraterwissen</button>'+
    '</div></div><div class="hello-ill" aria-hidden="true">'+themaIll('willkommen')+'</div></section>';
  // Termine
  var tb=ter.length?'<div class="appts">'+ter.slice(0,6).map(terminKarte).join('')+'</div>'+(ter.length>6?'<p class="more-n">Weitere '+(ter.length-6)+' Termine in den nächsten 7 Tagen.</p>':''):leer('Keine Termine in den nächsten 7 Tagen erfasst.','<button class="btn small" data-act="add-termin">Termin anlegen</button>');
  // Aufgaben
  var ab='';
  if(ueber.length||faellig.length||bald.length){
    if(ueber.length)ab+='<h3 class="sub-h late">Überfällig</h3><ul class="tasks">'+ueber.sort(function(a,b){return (b.prio?1:0)-(a.prio?1:0)||a.due.localeCompare(b.due)}).slice(0,6).map(function(x){return aufgabeZeile(x,T)}).join('')+'</ul>';
    if(faellig.length)ab+='<h3 class="sub-h">Heute fällig</h3><ul class="tasks">'+faellig.sort(function(a,b){return (b.prio?1:0)-(a.prio?1:0)}).map(function(x){return aufgabeZeile(x,T)}).join('')+'</ul>';
    if(bald.length)ab+='<h3 class="sub-h">In den nächsten 7 Tagen</h3><ul class="tasks">'+bald.sort(function(a,b){return a.due.localeCompare(b.due)}).slice(0,5).map(function(x){return aufgabeZeile(x,T)}).join('')+'</ul>';
  }else ab=leer('Keine Aufgabe ist heute oder in den nächsten 7 Tagen fällig.','<button class="btn small" data-act="add">Aufgabe erfassen</button>');
  // Laufende Beratungen
  var lb=lauf.length?'<ul class="runs">'+lauf.slice(0,5).map(laufKarte).join('')+'</ul>':leer('Keine begonnene Beratung offen.','<button class="btn small" data-act="bs-neu">Beratung starten</button>');
  // Rückmeldungen und Wiedervorlagen
  var waits=db.todos.filter(function(x){return !x.done&&(x.wait||x.ref)}).sort(function(a,b){return (a.due||'9999').localeCompare(b.due||'9999')});
  var angW=db.angebote.filter(function(a){return isOpenAng(a)}).sort(function(a,b){return (a.nachfass||'9999').localeCompare(b.nachfass||'9999')});
  var wb='';
  if(waits.length||angW.length){
    wb='<ul class="tasks">'+waits.slice(0,5).map(function(x){return aufgabeZeile(x,T)}).join('')+angW.slice(0,4).map(function(a){var late=a.nachfass&&a.nachfass<=T;return '<li class="task'+(late?' late':'')+'"><span class="dot-i" aria-hidden="true">'+ico('flag',16)+'</span><button class="task-b" data-act="open-ang" data-id="'+a.id+'"><span class="task-t">Angebot '+esc(a.sparte)+' nachfassen</span><span class="task-m"><b>'+esc(a.kunde)+'</b> · '+(a.nachfass?(late?'fällig seit '+fmtDate(a.nachfass):fmtDate(a.nachfass)):'ohne Datum')+'</span></button></li>'}).join('')+'</ul>';
  }else wb=leer('Keine offenen Rückmeldungen oder Wiedervorlagen.');
  // Mit Kunden vereinbart (nur besprochene oder bestätigte Themen)
  var ver=[];db.laufend.forEach(function(s){Object.keys(s.themen||{}).forEach(function(k){var b=(s.bedarf||{})[k];if(b==='bestaetigt'||b==='besprochen')ver.push({s:s,k:k,b:b})})});
  var spt=[];db.laufend.forEach(function(x){felderGeklaert(x).forEach(function(f){if(f.e.status==='spaeter')spt.push({s:x,f:f})})});
  var vb=ver.length||spt.length?'<ul class="agreed">'+ver.slice(0,6).map(function(v){return '<li><button data-act="bs-open" data-id="'+v.s.id+'"><b>'+esc(v.s.kunde||'ohne Nr.')+'</b><span>'+esc(themaName(v.k))+'</span><span class="stat-pill s-'+(v.b==='bestaetigt'?'ok':'info')+'">'+(v.b==='bestaetigt'?'Kundenwunsch bestätigt':'besprochen')+'</span></button></li>'}).join('')+spt.slice(0,4).map(function(v){var wv=v.f.e.wv&&db.todos.find(function(t){return t.id===v.f.e.wv});return '<li><button data-act="bs-open" data-id="'+v.s.id+'"><b>'+esc(v.s.kunde||'ohne Nr.')+'</b><span>'+esc(v.f.f.t)+'</span><span class="stat-pill s-warn">'+(wv?'später, ab '+esc(fmtDate(wv.due)):'für später vorgemerkt')+'</span></button></li>'}).join('')+'</ul><p class="fine-s">Nur Themen, die im Gespräch besprochen oder vom Kunden bestätigt wurden. Vermutungen erscheinen hier nicht.</p>':'';
  // Fristen
  var rad=radarList().filter(function(o){return o.i.st==='verpasst'||o.i.st==='dringend'});
  var fb=rad.length?'<ul class="tasks">'+rad.slice(0,4).map(function(o){return '<li class="task late"><span class="dot-i" aria-hidden="true">'+ico('clock',16)+'</span><button class="task-b" data-act="open-vertrag" data-id="'+o.v.id+'"><span class="task-t">'+esc(o.v.sparte)+': '+(o.i.st==='verpasst'?'Kündigungsfrist verpasst':'Kündigung bis '+fmtFull(o.i.bis))+'</span><span class="task-m"><b>'+esc(o.v.kunde)+'</b> · läuft ab '+fmtFull(o.v.ablauf)+'</span></button></li>'}).join('')+'</ul>':'';
  h+='<div class="dash"><div class="dash-main">'+
    sec('Termine',ter.length,'<button class="lnk" data-act="add-termin">'+ico('plus',16)+'Termin</button>',tb)+
    sec('Laufende Beratungen',lauf.length,'<button class="lnk" data-act="tab" data-tab="beratung">Alle</button>',lb)+
    (vb?sec('Mit Kunden vereinbart',null,'',vb):'')+
    '</div><div class="dash-side">'+
    sec('Meine Aufgaben',ueber.length+faellig.length,'<button class="lnk" data-act="tab" data-tab="aufgaben">Alle</button>',ab)+
    sec('Rückmeldungen und Wiedervorlagen',waits.length+angW.length,'',wb)+
    (fb?sec('Vertragsfristen',rad.length,'',fb):'')+
    sec('Beraterwissen',null,'<button class="lnk" data-act="tab" data-tab="wissen">Öffnen</button>',wissenKurz())+
    '</div></div>';
  return h;
}
