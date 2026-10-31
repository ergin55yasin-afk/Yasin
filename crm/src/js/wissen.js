/* ================= Beraterwissen und Lexikon ================= */
/* Einträge liegen in db.lexikon.eintraege. Jede Änderung wird in der Historie des Eintrags festgehalten.
   KI-Inhalte starten immer als Entwurf. „Fachlich geprüft“ setzt nur ein Mensch, mit Prüfdatum. */
var lx={q:'',sparte:'',typ:'',status:'',fav:false,edit:null};
function lexDb(){
  if(!db.lexikon){
    db.lexikon={version:LEX_VERSION,eintraege:[],nutzung:{},zuletzt:[]};
    var now=Date.now(),wer='Vorlage (KI-Entwurf)';
    lexSeed().forEach(function(x){db.lexikon.eintraege.push(lexNorm(Object.assign(x,{status:'entwurf',ki:true,pruefdatum:'',verantwortlich:'',favorit:false,aktualisiert:now,historie:[{ts:now,aktion:'angelegt',von:wer}]})))});
    (db.settings&&db.settings.wissen||[]).forEach(function(w){db.lexikon.eintraege.push(lexNorm({id:'w-'+w.id,sparte:'allgemein',typ:/^Einwand/.test(w.titel)?'einwaende':'grund',titel:w.titel,text:w.text,quelle:'',status:'entwurf',ki:/^Einwand:/.test(w.titel),pruefdatum:'',verantwortlich:'',favorit:false,aktualisiert:w.ts||now,historie:[{ts:now,aktion:'aus der bisherigen Wissensdatenbank übernommen',von:'System'}]}))});
    save();
  }
  return db.lexikon;
}
function lexNorm(e){e.tags=e.tags||[];e.historie=e.historie||[];e.kunde=!!e.kunde;return e}
function lexAll(){return lexDb().eintraege}
function lexGet(id){return lexAll().filter(function(e){return e.id===id})[0]}
function lexSparteName(k){var s=LEXSPARTEN.filter(function(x){return x[0]===k})[0];return s?s[1]:k}
function lexAlt(e){return e.status==='geprueft'&&e.pruefdatum&&diffDays(e.pruefdatum,todayIso())>365}
function lexStatusPill(e){var t=lexAlt(e)?'Prüfung älter als ein Jahr':pfLbl(LEXSTATUS,e.status),c=lexAlt(e)||e.status==='aktualisieren'?'warn':e.status==='geprueft'?'ok':'muted';return '<span class="stat-pill s-'+c+'">'+esc(t)+'</span>'+(e.ki&&e.status!=='geprueft'?'<span class="stat-pill s-ki">KI-Entwurf</span>':'')}
function lexFuerThema(k){var sp=THEMA_SPARTE[k];if(!sp)return [];return lexAll().filter(function(e){return e.sparte===sp&&(!kmode()||(e.kunde&&(e.typ==='grund'||e.typ==='kern')))})}
function wissenList(){return lexAll().map(function(e){return {titel:e.titel+' ('+lexSparteName(e.sparte)+', '+(LEXTYP[e.typ]||'')+', '+pfLbl(LEXSTATUS,e.status)+')',text:e.text}})}
function lexSuche(){
  var q=lx.q.trim().toLowerCase(),R=lexAll().filter(function(e){
    if(lx.sparte&&e.sparte!==lx.sparte)return false;if(lx.typ&&e.typ!==lx.typ)return false;if(lx.fav&&!e.favorit)return false;
    if(lx.status==='alt'){if(!(lexAlt(e)||e.status==='aktualisieren'))return false}else if(lx.status&&e.status!==lx.status)return false;
    return true});
  if(!q)return R.sort(function(a,b){return LEXTYPEN.map(function(t){return t[0]}).indexOf(a.typ)-LEXTYPEN.map(function(t){return t[0]}).indexOf(b.typ)||a.titel.localeCompare(b.titel)});
  var W=q.split(/\s+/).filter(Boolean);
  return R.map(function(e){var t=e.titel.toLowerCase(),x=(e.text+' '+e.tags.join(' ')+' '+e.quelle).toLowerCase(),s=0;
    W.forEach(function(w){if(t.indexOf(w)>=0)s+=5;if(e.tags.join(' ').toLowerCase().indexOf(w)>=0)s+=3;if(x.indexOf(w)>=0)s+=1;else if(t.indexOf(w)<0)s-=100});return {e:e,s:s}})
    .filter(function(r){return r.s>0}).sort(function(a,b){return b.s-a.s}).map(function(r){return r.e});
}
function lexKarte(e){
  var ex=e.text.replace(/\s+/g,' ').slice(0,150);
  return '<li class="lx"><button class="lx-b" data-act="lex-open" data-id="'+e.id+'"><span class="lx-m"><span class="lx-t">'+esc(LEXTYP[e.typ]||e.typ)+'</span><span>'+esc(lexSparteName(e.sparte))+'</span></span><strong>'+esc(e.titel)+'</strong><span class="lx-x">'+esc(ex)+(e.text.length>150?' …':'')+'</span><span class="lx-s">'+lexStatusPill(e)+(e.quelle?'<span class="lx-q">'+ico('link',12)+'Quelle</span>':'')+'</span></button><button class="star'+(e.favorit?' on':'')+'" data-act="lex-fav" data-id="'+e.id+'" aria-pressed="'+e.favorit+'" aria-label="Favorit">'+ico('star',18)+'</button></li>';
}
function viewWissen(){
  var A=lexAll(),filt=lx.q||lx.sparte||lx.typ||lx.status||lx.fav;
  var h=wissenSeg('wissen')+'<div class="wtool"><label class="searchf big">'+ico('search',20)+'<input type="search" id="lx-q" value="'+esc(lx.q)+'" placeholder="Begriff, Frage, Kernaussage oder Paragraf suchen" autocomplete="off" aria-label="Beraterwissen durchsuchen"></label><button class="btn primary" data-act="lex-neu">'+ico('plus',18)+'Neuer Eintrag</button></div>';
  h+='<div class="wfilter"><select data-lxf="sparte" aria-label="Sparte"><option value="">Alle Sparten</option>'+LEXSPARTEN.map(function(s){return '<option value="'+s[0]+'"'+(lx.sparte===s[0]?' selected':'')+'>'+esc(s[1])+'</option>'}).join('')+'</select>'+
    '<select data-lxf="typ" aria-label="Inhaltstyp"><option value="">Alle Inhaltstypen</option>'+LEXTYPEN.map(function(s){return '<option value="'+s[0]+'"'+(lx.typ===s[0]?' selected':'')+'>'+esc(s[1])+'</option>'}).join('')+'</select>'+
    '<select data-lxf="status" aria-label="Aktualität"><option value="">Jeder Status</option>'+LEXSTATUS.map(function(s){return '<option value="'+s[0]+'"'+(lx.status===s[0]?' selected':'')+'>'+esc(s[1])+'</option>'}).join('')+'<option value="alt"'+(lx.status==='alt'?' selected':'')+'>Zu aktualisieren oder älter als ein Jahr</option></select>'+
    '<button class="chip" data-act="lex-favf" aria-pressed="'+lx.fav+'">'+ico('star',14)+'Favoriten</button>'+(filt?'<button class="lnk" data-act="lex-reset">Filter zurücksetzen</button>':'')+'</div>';
  if(filt){
    var R=lexSuche();
    h+='<p class="muted" id="lx-n" aria-live="polite">'+R.length+(R.length===1?' Eintrag':' Einträge')+'</p>';
    if(lx.sparte&&!lx.q&&!lx.typ)h+=lexSparteSicht(lx.sparte,R);
    else h+=R.length?'<ul class="lxl">'+R.map(lexKarte).join('')+'</ul>':leer('Nichts gefunden. Andere Begriffe versuchen oder Filter zurücksetzen.','<button class="btn small" data-act="lex-reset">Filter zurücksetzen</button>');
    return h;
  }
  var kern=A.filter(function(e){return e.typ==='kern'&&(e.favorit||e.sparte==='pflege'||e.id==='av-k1')}).slice(0,6);
  h+='<section class="kernband"><header class="cs-h"><h2>Kernaussagen</h2><button class="lnk" data-act="lex-typ" data-v="kern">Alle</button></header><div class="kerns">'+kern.map(function(e){return '<button class="kern" data-act="lex-open" data-id="'+e.id+'"><span class="eyebrow">'+esc(lexSparteName(e.sparte))+'</span><q>'+esc(e.text.split('\n')[0])+'</q><span class="lx-s">'+lexStatusPill(e)+'</span></button>'}).join('')+'</div></section>';
  h+='<h2 class="sec-t">Sparten</h2><div class="spgrid">'+LEXSPARTEN.map(function(s){var L=A.filter(function(e){return e.sparte===s[0]}),g=L.filter(function(e){return e.status==='geprueft'}).length;return '<button class="spc" data-act="lex-sparte" data-v="'+s[0]+'"><span class="spc-ill">'+themaIll(s[2])+'</span><span class="spc-b"><strong>'+esc(s[1])+'</strong><span>'+L.length+(L.length===1?' Eintrag':' Einträge')+(L.length?', '+g+' geprüft':'')+'</span>'+(s[0]==='pflege'?'<span class="badge">Muster-Sparte</span>':'')+'</span></button>'}).join('')+'</div>';
  var fav=A.filter(function(e){return e.favorit}),N=lexDb().nutzung||{},oft=A.filter(function(e){return N[e.id]}).sort(function(a,b){return N[b.id]-N[a.id]}).slice(0,5);
  h+='<div class="dash"><div class="dash-main">'+sec('Favoriten',fav.length,'',fav.length?'<ul class="lxl">'+fav.map(lexKarte).join('')+'</ul>':leer('Markiere Einträge mit dem Stern, dann erscheinen sie hier und auf der Startseite.'))+'</div><div class="dash-side">'+sec('Häufig geöffnet',null,'',oft.length?'<ul class="list-s">'+oft.map(function(e){return '<li><button data-act="lex-open" data-id="'+e.id+'"><b>'+esc(e.titel)+'</b><span>'+N[e.id]+'× geöffnet</span></button></li>'}).join('')+'</ul>':leer('Noch nichts geöffnet.'))+
    sec('Redaktion',null,'','<ul class="list-s">'+LEXSTATUS.map(function(s){var n=A.filter(function(e){return e.status===s[0]}).length;return '<li><button data-act="lex-stf" data-v="'+s[0]+'"><b>'+esc(s[1])+'</b><span>'+n+' Einträge</span></button></li>'}).join('')+'</ul><p class="fine-s">Alle mitgelieferten Inhalte sind KI-Entwürfe. Bitte prüfen und erst dann als „fachlich geprüft“ kennzeichnen.</p>')+'</div></div>';
  return h;
}
function lexSparteSicht(sp,R){
  var s=LEXSPARTEN.filter(function(x){return x[0]===sp})[0];
  var h='<section class="sphead"><div class="sph-ill" aria-hidden="true">'+themaIll(s[2])+'</div><div><p class="eyebrow">Sparte</p><h2>'+esc(s[1])+'</h2><p class="muted">Alle Inhalte nach der einheitlichen Wissensstruktur.</p></div></section>';
  h+='<nav class="toc" aria-label="Inhaltsbereiche">'+LEXTYPEN.map(function(t,i){var n=R.filter(function(e){return e.typ===t[0]}).length;return '<a href="#lxs-'+t[0]+'" class="'+(n?'':'empty')+'"><b>'+(i+1)+'</b>'+esc(t[1])+'<span>'+n+'</span></a>'}).join('')+'</nav>';
  LEXTYPEN.forEach(function(t,i){var L=R.filter(function(e){return e.typ===t[0]});h+='<section class="lxsec" id="lxs-'+t[0]+'"><h3><b>'+(i+1)+'</b>'+esc(t[1])+'</h3>'+(L.length?'<ul class="lxl">'+L.map(lexKarte).join('')+'</ul>':'<p class="muted">Noch kein Eintrag. <button class="lnk" data-act="lex-neu" data-sp="'+sp+'" data-typ="'+t[0]+'">Eintrag anlegen</button></p>')+'</section>'});
  return h;
}
function lexText(t){return esc(t).split(/\n{2,}/).map(function(p){var L=p.split('\n');if(L.every(function(l){return /^- /.test(l)}))return '<ul>'+L.map(function(l){return '<li>'+l.slice(2)+'</li>'}).join('')+'</ul>';if(L.slice(1).every(function(l){return /^- /.test(l)})&&L.length>1)return '<p>'+L[0]+'</p><ul>'+L.slice(1).map(function(l){return '<li>'+l.slice(2)+'</li>'}).join('')+'</ul>';return '<p>'+L.join('<br>')+'</p>'}).join('')}
function openLexEintrag(id,ausBeratung){
  var e=lexGet(id);if(!e)return;var D=lexDb();D.nutzung[id]=(D.nutzung[id]||0)+1;save();
  if(kmode()){openSheet('<p class="eyebrow">Erklärung</p><h3>'+esc(e.titel)+'</h3><div class="lxtext">'+lexText(e.text)+'</div>'+(e.quelle?'<p class="ds-source">Quelle: '+esc(e.quelle)+'</p>':'')+'<div class="btnrow"><button class="btn primary" data-act="close">Zurück zur Beratung</button></div>');return}
  var h='<p class="eyebrow">'+esc(lexSparteName(e.sparte))+' · '+esc(LEXTYP[e.typ]||e.typ)+'</p><h3>'+esc(e.titel)+'</h3><div class="lx-s">'+lexStatusPill(e)+'</div><div class="lxtext">'+lexText(e.text)+'</div>';
  h+='<dl class="ds-facts meta"><div><dt>Quelle</dt><dd>'+(e.quelle?esc(e.quelle):'<span class="warn-t">keine Quelle angegeben</span>')+'</dd></div><div><dt>Prüfdatum</dt><dd>'+(e.pruefdatum?esc(fmtFull(e.pruefdatum)):'nicht geprüft')+'</dd></div><div><dt>Verantwortlich</dt><dd>'+(e.verantwortlich?esc(e.verantwortlich):'–')+'</dd></div><div><dt>Ursprung</dt><dd>'+(e.ki?'KI-Entwurf':'von Hand erstellt')+'</dd></div><div><dt>Für Kunden geeignet</dt><dd>'+(e.kunde?'ja':'nein')+'</dd></div></dl>';
  h+='<details class="adv"><summary>Änderungshistorie ('+e.historie.length+')</summary><ol class="hist">'+e.historie.slice().reverse().map(function(x,i){var idx=e.historie.length-1-i;return '<li><b>'+esc(new Date(x.ts).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}))+'</b> '+esc(x.aktion)+(x.von?' · '+esc(x.von):'')+(x.felder&&x.felder.length?'<small>Geändert: '+esc(x.felder.join(', '))+'</small>':'')+(x.vorher?'<button class="lnk" data-act="lex-restore" data-id="'+e.id+'" data-i="'+idx+'">Stand davor wiederherstellen</button>':'')+'</li>'}).join('')+'</ol></details>';
  h+='<div class="btnrow wrap"><button class="btn" data-act="close">'+(ausBeratung?'Zurück zur Beratung':'Schließen')+'</button><button class="btn" data-act="lex-fav" data-id="'+e.id+'" data-s="1">'+ico('star',16)+(e.favorit?'Favorit entfernen':'Als Favorit')+'</button><button class="btn" data-act="lex-edit" data-id="'+e.id+'">'+ico('edit',16)+'Bearbeiten</button>'+
    (e.status!=='geprueft'?'<button class="btn primary" data-act="lex-pruef" data-id="'+e.id+'">'+ico('check',16)+'Als fachlich geprüft kennzeichnen</button>':'<button class="btn" data-act="lex-st" data-id="'+e.id+'" data-v="aktualisieren">Aktualisierung erforderlich</button>')+'</div>';
  openSheet(h);
}
function openLexThema(k){
  var L=lexFuerThema(k);
  if(kmode()){openSheet('<p class="eyebrow">Erklärung</p><h3>'+esc(themaName(k))+'</h3>'+(L.length?L.map(function(e){return '<section class="lxk"><h4>'+esc(e.titel)+'</h4><div class="lxtext">'+lexText(e.text)+'</div></section>'}).join(''):'<p>Keine Erklärung vorhanden.</p>')+'<div class="btnrow"><button class="btn primary" data-act="close">Zurück zur Beratung</button></div>');return}
  openSheet('<p class="eyebrow">Beraterwissen</p><h3>'+esc(themaName(k))+'</h3><p class="hint-t">Der Fortschritt der Beratung bleibt erhalten.</p><ul class="lxl">'+L.map(lexKarte).join('')+'</ul><div class="btnrow"><button class="btn" data-act="close">Zurück zur Beratung</button></div>');
}
function lexEditor(e){
  lx.edit=e?e.id:null;e=e||{titel:'',text:'',sparte:lx.sparte||'pflege',typ:lx.typ||'grund',quelle:'',verantwortlich:(db.settings&&db.settings.beraterName)||'',pruefdatum:'',status:'entwurf',tags:[],kunde:false};
  openSheet('<h3>'+(lx.edit?'Eintrag bearbeiten':'Neuer Eintrag')+'</h3><label for="lx-t">Titel</label><input type="text" id="lx-t" maxlength="120" value="'+esc(e.titel)+'">'+
    '<div class="grid2"><div><label for="lx-sp">Sparte</label><select id="lx-sp">'+LEXSPARTEN.map(function(s){return '<option value="'+s[0]+'"'+(e.sparte===s[0]?' selected':'')+'>'+esc(s[1])+'</option>'}).join('')+'</select></div><div><label for="lx-ty">Inhaltsbereich</label><select id="lx-ty">'+LEXTYPEN.map(function(s){return '<option value="'+s[0]+'"'+(e.typ===s[0]?' selected':'')+'>'+esc(s[1])+'</option>'}).join('')+'</select></div></div>'+
    '<label for="lx-x">Inhalt</label><textarea id="lx-x" rows="9" maxlength="6000">'+esc(e.text)+'</textarea><p class="hint-t">Leere Zeile = neuer Absatz. Zeilen mit „- “ werden zur Liste.</p>'+
    '<label for="lx-qu">Quelle</label><input type="text" id="lx-qu" maxlength="300" value="'+esc(e.quelle)+'" placeholder="z. B. SGB XI § 37, Stand 2026">'+
    '<div class="grid2"><div><label for="lx-v">Verantwortlich</label><input type="text" id="lx-v" maxlength="60" value="'+esc(e.verantwortlich)+'"></div><div><label for="lx-tg">Stichwörter</label><input type="text" id="lx-tg" maxlength="200" value="'+esc(e.tags.join(', '))+'" placeholder="durch Komma getrennt"></div></div>'+
    '<label class="ck"><input type="checkbox" id="lx-k"'+(e.kunde?' checked':'')+'> Für Kunden geeignet (darf im Kundenmodus als Erklärung erscheinen)</label>'+
    '<p class="hint-t">Status: '+esc(pfLbl(LEXSTATUS,e.status))+'. Eine inhaltliche Änderung setzt einen geprüften Eintrag zurück auf „Entwurf“.</p><div id="lx-err"></div>'+
    '<div class="btnrow">'+(lx.edit?'<button class="btn danger" data-act="lex-del" data-id="'+lx.edit+'" data-confirm="Eintrag wirklich löschen?">Löschen</button>':'<button class="btn" data-act="close">Abbrechen</button>')+'<button class="btn primary" data-act="lex-save">Speichern</button></div>');
}
function lexWer(){return (db.settings&&db.settings.beraterName)||'Berater'}
function lexSave(){
  var t=$('lx-t').value.trim(),x=$('lx-x').value.trim();
  if(!t||!x){$('lx-err').innerHTML='<p class="err" role="alert">Bitte Titel und Inhalt ausfüllen.</p>';return}
  var er=checkText(t)||checkText(x);if(er){$('lx-err').innerHTML='<p class="err" role="alert">'+esc(er)+'</p>';return}
  var neu={titel:t,text:x,sparte:$('lx-sp').value,typ:$('lx-ty').value,quelle:$('lx-qu').value.trim(),verantwortlich:$('lx-v').value.trim(),tags:$('lx-tg').value.split(',').map(function(s){return s.trim()}).filter(Boolean),kunde:$('lx-k').checked};
  var now=Date.now();
  if(lx.edit){
    var e=lexGet(lx.edit),fel=[],vor={};
    Object.keys(neu).forEach(function(k){if(JSON.stringify(e[k])!==JSON.stringify(neu[k])){fel.push(k);vor[k]=e[k];e[k]=neu[k]}});
    if(!fel.length){closeSheet();return}
    var inhalt=fel.some(function(f){return f==='titel'||f==='text'||f==='quelle'});
    if(inhalt&&e.status==='geprueft'){vor.status=e.status;vor.pruefdatum=e.pruefdatum;e.status='entwurf';e.pruefdatum='';fel.push('status')}
    e.aktualisiert=now;e.historie.push({ts:now,aktion:'bearbeitet',von:lexWer(),felder:fel.map(lexFeld),vorher:vor});
    save();closeSheet();render();openLexEintrag(e.id);toast('Gespeichert'+(vor.status?', Status zurück auf Entwurf':''));
  }else{
    var n=lexNorm(Object.assign(neu,{id:'u-'+uid(),status:'entwurf',ki:false,pruefdatum:'',favorit:false,aktualisiert:now,historie:[{ts:now,aktion:'angelegt',von:lexWer()}]}));
    lexAll().push(n);save();closeSheet();render();openLexEintrag(n.id);toast('Eintrag angelegt');
  }
}
function lexFeld(k){return ({titel:'Titel',text:'Inhalt',sparte:'Sparte',typ:'Inhaltsbereich',quelle:'Quelle',verantwortlich:'Verantwortlich',tags:'Stichwörter',kunde:'Kundeneignung',status:'Status',pruefdatum:'Prüfdatum'})[k]||k}
function lexNeuKI(sp,typ,titel,text){var now=Date.now();var n=lexNorm({id:'k-'+uid(),sparte:sp,typ:typ,titel:titel,text:text,quelle:'',status:'entwurf',ki:true,pruefdatum:'',verantwortlich:'',favorit:false,kunde:false,tags:['KI'],aktualisiert:now,historie:[{ts:now,aktion:'angelegt aus dem KI-Training',von:'KI'}]});lexAll().push(n);save();return n}
function wissenKurz(){
  var A=lexAll(),fav=A.filter(function(e){return e.favorit}).slice(0,3),N=lexDb().nutzung||{};
  var oft=A.filter(function(e){return N[e.id]&&!e.favorit}).sort(function(a,b){return N[b.id]-N[a.id]}).slice(0,3);
  var kern=A.filter(function(e){return e.typ==='kern'&&e.kunde})[new Date().getDate()%Math.max(1,A.filter(function(e){return e.typ==='kern'&&e.kunde}).length)];
  var h='<label class="searchf">'+ico('search',18)+'<input type="search" id="lx-qs" placeholder="Im Beraterwissen suchen" autocomplete="off" aria-label="Im Beraterwissen suchen"></label>';
  if(kern)h+='<button class="kern mini" data-act="lex-open" data-id="'+kern.id+'"><span class="eyebrow">Kernaussage · '+esc(lexSparteName(kern.sparte))+'</span><q>'+esc(kern.text.split('\n')[0])+'</q></button>';
  var L=fav.concat(oft);
  h+=L.length?'<ul class="list-s">'+L.map(function(e){return '<li><button data-act="lex-open" data-id="'+e.id+'"><b>'+(e.favorit?'★ ':'')+esc(e.titel)+'</b><span>'+esc(lexSparteName(e.sparte))+' · '+esc(LEXTYP[e.typ])+'</span></button></li>'}).join('')+'</ul>':'<p class="fine-s">Favoriten und häufig geöffnete Einträge erscheinen hier.</p>';
  return h;
}
function lexAct(act,btn){
  var id=btn.dataset.id,e=id?lexGet(id):null;
  switch(act){
    case 'lex-open':openLexEintrag(id,!!cur&&tab==='beratung');return;
    case 'lex-fav':if(!e)return;e.favorit=!e.favorit;save();if(tab==='wissen'||tab==='start')render();if(btn.dataset.s)openLexEintrag(id);return;
    case 'lex-neu':lx.sparte=btn.dataset.sp||lx.sparte;lx.typ=btn.dataset.typ||lx.typ;lexEditor(null);return;
    case 'lex-edit':lexEditor(e);return;
    case 'lex-save':lexSave();return;
    case 'lex-del':lexDb().eintraege=lexAll().filter(function(x){return x.id!==id});save();closeSheet();render();toast('Gelöscht');return;
    case 'lex-pruef':openSheet('<h3>Als fachlich geprüft kennzeichnen</h3><p>Bitte nur bestätigen, wenn du Inhalt und Quelle selbst geprüft hast.'+(e.ki?' Dieser Eintrag ist ein KI-Entwurf.':'')+(e.quelle?'':' <b>Es ist keine Quelle angegeben.</b>')+'</p><div class="grid2"><div><label for="lx-pd">Prüfdatum</label><input type="date" id="lx-pd" value="'+todayIso()+'"></div><div><label for="lx-pv">Geprüft von</label><input type="text" id="lx-pv" maxlength="60" value="'+esc(e.verantwortlich||(db.settings&&db.settings.beraterName)||'')+'"></div></div><div id="lx-err"></div><div class="btnrow"><button class="btn" data-act="lex-open" data-id="'+id+'">Abbrechen</button><button class="btn primary" data-act="lex-pruef-ok" data-id="'+id+'">Geprüft</button></div>');return;
    case 'lex-pruef-ok':{var pd=$('lx-pd').value,pv=$('lx-pv').value.trim();if(!pd||!pv){$('lx-err').innerHTML='<p class="err" role="alert">Bitte Prüfdatum und Namen angeben.</p>';return}
      e.historie.push({ts:Date.now(),aktion:'als fachlich geprüft gekennzeichnet',von:pv,felder:['Status','Prüfdatum'],vorher:{status:e.status,pruefdatum:e.pruefdatum,verantwortlich:e.verantwortlich}});e.status='geprueft';e.pruefdatum=pd;e.verantwortlich=pv;save();render();openLexEintrag(id);toast('Als geprüft gekennzeichnet');return}
    case 'lex-st':e.historie.push({ts:Date.now(),aktion:'Status: '+pfLbl(LEXSTATUS,btn.dataset.v),von:lexWer(),felder:['Status'],vorher:{status:e.status}});e.status=btn.dataset.v;save();render();openLexEintrag(id);return;
    case 'lex-restore':{var x=e.historie[Number(btn.dataset.i)];if(!x||!x.vorher)return;var vor={},fel=[];Object.keys(x.vorher).forEach(function(k){vor[k]=e[k];e[k]=x.vorher[k];fel.push(lexFeld(k))});e.historie.push({ts:Date.now(),aktion:'früheren Stand wiederhergestellt',von:lexWer(),felder:fel,vorher:vor});save();render();openLexEintrag(id);toast('Wiederhergestellt');return}
    case 'lex-sparte':lx.sparte=btn.dataset.v;lx.q='';lx.typ='';render();window.scrollTo(0,0);return;
    case 'lex-typ':lx.typ=btn.dataset.v;render();return;
    case 'lex-stf':lx.status=btn.dataset.v;render();return;
    case 'lex-favf':lx.fav=!lx.fav;render();return;
    case 'lex-reset':lx={q:'',sparte:'',typ:'',status:'',fav:false,edit:null};render();return;
  }
}
document.addEventListener('input',function(ev){
  var t=ev.target;
  if(t.id==='lx-q'){lx.q=t.value;var pos=t.selectionStart;render();var n=$('lx-q');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}
  if(t.id==='lx-qs'&&t.value.trim().length>1){lx={q:t.value,sparte:'',typ:'',status:'',fav:false,edit:null};tab='wissen';render();var m=$('lx-q');if(m){m.focus();m.setSelectionRange(m.value.length,m.value.length)}}
});
document.addEventListener('change',function(ev){var t=ev.target;if(t.dataset&&t.dataset.lxf){lx[t.dataset.lxf]=t.value;render()}});
