/* ================= Ganzheitliche Beratungsstrecke ================= */
/* Eine Beratung (Sitzung) liegt in db.laufend und wird bei jeder Eingabe gespeichert.
   Aufbau: Anliegen, Lebenssituation, Themen, je Thema seine Schritte und „Bedarf festhalten“,
   Zusammenfassung, Unterlage. Im Kundenmodus werden interne Inhalte gar nicht erst erzeugt. */
var THEMEN=[
 ['alter','Altersvorsorge','Wie möchten Sie im Ruhestand leben, und was fehlt dafür?','sun','alter','rente'],
 ['arbeit','Arbeitskraft absichern','Was passiert mit Ihrem Einkommen, wenn Sie nicht arbeiten können?','briefcase','bu','arbeit'],
 ['pflege','Pflegevorsorge','Wie möchten Sie im Pflegefall versorgt werden?','users','pflege','pflege'],
 ['familie','Familie absichern','Was braucht Ihre Familie, wenn Ihnen etwas zustößt?','family','','tod'],
 ['kranken','Krankenversicherung','Gesetzlich mit Zusatz oder privat: was passt zu Ihnen?','hospital','kv','kranken'],
 ['zusatz','Krankenzusatz','Zahnersatz, Brille, Krankenhaus: was ist Ihnen wichtig?','tooth','zus','kranken'],
 ['unfall','Unfallrisiken','Was würde sich nach einem schweren Unfall ändern?','bandage','','unfall'],
 ['sach','Wohnen und Sachwerte','Haus, Hausrat, Haftung, Auto: passt die Absicherung?','home','sach','hausrat'],
 ['anlage','Geldanlage','Wofür soll Ihr Geld arbeiten, und wie lange?','trend','anlage','anlage'],
 ['vorsorge','Vollmachten und Nachlass','Wer entscheidet, wenn Sie es selbst nicht können?','doc','vorsorge','vollmacht'],
 ['check','Vorsorge- und Finanzcheck','Wo stehen Sie heute, über alle Lebensbereiche?','check','ueberblick',''],
 ['individuell','Eigenes Anliegen','Ein Anliegen, das hier nicht aufgeführt ist.','bubble','','']
];
var ANLIEGEN=THEMEN.map(function(t){return [t[0],t[1]]});
var THEMA_HINWEIS={
 unfall:'Mögliche Folgen eines Unfalls, etwa ein Umbau der Wohnung oder ein Einkommensausfall, sind etwas anderes als die Leistungen eines Vertrags. Was ein Vertrag zahlt, regeln seine Bedingungen, zum Beispiel über den Invaliditätsgrad. Die gesetzliche Unfallversicherung gilt nur bei der Arbeit, in der Schule und auf dem Weg dorthin.',
 zusatz:'Was eine Zusatzversicherung zahlt, hängt vom Tarif, von Wartezeiten und von bereits laufenden oder angeratenen Behandlungen ab. Beim Zahnersatz zahlt die gesetzliche Kasse einen Festzuschuss, den Rest trägt der Versicherte.',
 familie:'Was die Familie im Ernstfall erhält, setzt sich aus gesetzlichen Leistungen (zum Beispiel Hinterbliebenenrente) und bestehenden Verträgen zusammen. Beides gehört in die Betrachtung.',
 individuell:'Halten Sie das Anliegen in den Worten des Kunden fest. Passende Fragen finden Sie im Beraterwissen.'
};
var ZUSAMMEN={
 alter:[['arbeit','Die Sparrate für die Rente setzt ein laufendes Einkommen voraus.'],['pflege','Im Ruhestand stellt sich oft auch die Frage nach Pflege.'],['anlage','Ein Teil der Vorsorge kann über eine Geldanlage laufen.']],
 arbeit:[['familie','Wenn Angehörige vom Einkommen abhängen.'],['alter','Ohne Einkommen fehlen auch Beiträge zur Altersvorsorge.']],
 pflege:[['vorsorge','Im Pflegefall muss jemand für den Kunden handeln dürfen.'],['alter','Pflegekosten werden oft aus Rente und Vermögen bezahlt.']],
 familie:[['arbeit','Das Einkommen ist meist die Grundlage der Familie.'],['vorsorge','Testament und Vollmachten regeln, wer entscheidet und wer was bekommt.'],['sach','Wohneigentum und Kredite betreffen die ganze Familie.']],
 kranken:[['zusatz','Wünsche über die gesetzliche Versorgung hinaus.'],['pflege','Die Pflegeversicherung folgt der Krankenversicherung.']],
 zusatz:[['kranken','Die Grundversorgung bestimmt, was eine Zusatzversicherung ergänzt.']],
 unfall:[['arbeit','Unfälle sind nur ein Teil der Ursachen, warum jemand nicht mehr arbeiten kann.'],['familie','Wenn Angehörige vom Einkommen abhängen.']],
 sach:[['familie','Bei Wohneigentum und laufendem Kredit.'],['unfall','Wenn Kinder im Haushalt leben oder Hobbys mit Risiko bestehen.']],
 anlage:[['alter','Wenn das Ziel ein Einkommen im Ruhestand ist.'],['vorsorge','Wenn Vermögen später weitergegeben werden soll.']],
 vorsorge:[['pflege','Vollmachten und Pflege hängen oft zusammen.'],['familie','Wenn Angehörige versorgt sein sollen.']],
 check:[],individuell:[]
};
var BEDARF=[['','noch offen'],['vermutet','vermutet (intern)'],['besprochen','besprochen'],['bestaetigt','Kundenwunsch bestätigt'],['kein','kein Bedarf']];
function themaDef(k){return THEMEN.filter(function(t){return t[0]===k})[0]||null}
function themaName(k){var t=themaDef(k);return t?t[1]:k}
function themaIcon(k){var t=themaDef(k);return t?t[3]:'shield'}
function bedarfPill(b){if(!b)return '<span class="stat-pill">noch offen</span>';var cls={vermutet:'warn',besprochen:'info',bestaetigt:'ok',kein:'muted'}[b]||'';return '<span class="stat-pill s-'+cls+'">'+esc(pfLbl(BEDARF,b))+'</span>'}

/* ---- Sitzungen ---- */
var cur=null,ctxOpen=(window.innerWidth||1500)>=1500,mailAdv=false,sessTimer=null,bsLex=null;
function laufendListe(){return (db.laufend||[]).filter(function(s){return s.status!=='abgeschlossen'}).sort(function(a,b){return b.updated-a.updated})}
function laufendFuer(k){return laufendListe().filter(function(s){return k&&s.kunde===k})}
function kmode(){return !!(cur&&cur.modus==='kunde'&&tab==='beratung')}
function neueSitzung(k,anl){
  var s={id:uid(),kunde:k||'',anliegen:anl||'',anliegenText:'',themen:{},bedarf:{},antworten:{},notiz:'',offen:[],doku:{vereinbarungen:'',next:'',termin:'',gesehen:0},step:'anliegen',besucht:{anliegen:1},erledigt:{},status:'laufend',modus:'berater',created:Date.now(),updated:Date.now(),adv:newAdv(k||'')};
  s.adv.mods={alter:false,anlage:false,kv:false,sach:false,vorsorge:false,pflege:false,bu:false,zus:false};
  if(anl){s.themen[anl]={quelle:'anliegen',ts:Date.now()}}
  db.laufend.push(s);return s;
}
function oeffneSitzung(s){
  cur=s;adv=deep(newAdv(s.kunde),s.adv||{});s.adv=adv;mailAdv=false;syncMods();
  talkOpen=true;tab='beratung';
}
function syncMods(){
  var m={alter:false,anlage:false,kv:false,sach:false,vorsorge:false,pflege:false,bu:false,zus:false};
  Object.keys(cur.themen).forEach(function(k){var d=themaDef(k);if(d&&m.hasOwnProperty(d[4]))m[d[4]]=true});
  adv.mods=m;
}
function sessSave(){if(!cur)return;cur.updated=Date.now();cur.adv=adv;save()}
function sessDirty(){if(!cur)return;clearTimeout(sessTimer);sessTimer=setTimeout(sessSave,350)}
function sessionOffen(s){var o=(s.offen||[]).filter(function(x){return !x.done}).map(function(x){return x.t});var p=s.adv&&s.adv.pf;if(p&&s.themen.pflege&&p.offen)PFOFFEN.forEach(function(x){if(p.offen.indexOf(x[0])>=0)o.push(x[1])});return o}

/* ---- Schritte ---- */
function modulSlides(mod){
  var save=adv.mods,sd=adv.direct;
  adv.mods={alter:false,anlage:false,kv:false,sach:false,vorsorge:false,pflege:false,bu:false,zus:false};adv.mods[mod]=true;adv.direct=true;
  var S=talkSlides().filter(function(s){return (s.st||4)===4});
  adv.mods=save;adv.direct=sd;return S;
}
function bsSteps(){
  var s=cur,L=[];
  L.push({key:'anliegen',name:'Anliegen',grp:'Einstieg',kind:'anliegen'});
  L.push({key:'situation',name:'Lebenssituation',grp:'Einstieg',kind:'situation'});
  L.push({key:'themen',name:'Überblick und Zusammenhänge',grp:'Einstieg',kind:'themen'});
  themenFolge().forEach(function(k){
    var d=themaDef(k),g=d[1],mod=d[4];
    if(mod==='sach')L.push({key:'f:'+k,name:'Ist und Soll vergleichen',grp:g,kind:'form',form:'sach',thema:k});
    else if(mod==='ueberblick')L.push({key:'ue:'+k,name:'Überblick aller Bereiche',grp:g,kind:'ueberblick',thema:k});
    else if(mod){modulSlides(mod).forEach(function(sl,i){L.push({key:'m:'+k+':'+i,name:String(sl.title).replace(/<[^>]+>/g,''),grp:g,kind:'slide',slide:sl,thema:k})})}
    else L.push({key:'l:'+k,name:'Gespräch und Fragen',grp:g,kind:'leit',thema:k});
    L.push({key:'b:'+k,name:'Bedarf festhalten',grp:g,kind:'bedarf',thema:k});
  });
  L.push({key:'ergebnis',name:'Zusammenfassung und Vereinbarungen',grp:'Abschluss',kind:'ergebnis'});
  L.push({key:'unterlage',name:'Unterlage, Mail und CRM',grp:'Abschluss',kind:'unterlage',intern:true});
  if(kmode())L=L.filter(function(x){return !x.intern});
  return L;
}
function themenFolge(){var k=Object.keys(cur.themen);k.sort(function(a,b){return (a===cur.anliegen?-1:0)-(b===cur.anliegen?-1:0)||cur.themen[a].ts-cur.themen[b].ts});return k}
function curStep(){var L=bsSteps(),i=L.map(function(x){return x.key}).indexOf(cur.step);if(i<0){i=0;cur.step=L[0].key}return {L:L,i:i,st:L[i]}}
function sessionPos(s){
  var keep=cur,ka=adv,kt=talkOpen;cur=s;adv=deep(newAdv(s.kunde),s.adv||{});syncMods();
  var c=curStep();var r={nr:c.i+1,n:c.L.length,name:c.st.name,grp:c.st.grp};
  cur=keep;adv=ka;talkOpen=kt;return r;
}
function geheZu(key){cur.besucht[key]=1;cur.step=key;sessSave();renderTalk();var m=document.querySelector('.bs-main');if(m)m.scrollTop=0;window.scrollTo(0,0)}

/* ---- Ansicht Beratung (ohne offene Sitzung) ---- */
function viewBeratung(){
  if(mailAdv&&adv)return mailView();
  if(cur&&talkOpen)return shellHtml();
  var L=laufendListe(),fertig=(db.laufend||[]).filter(function(s){return s.status==='abgeschlossen'}).sort(function(a,b){return b.updated-a.updated}).slice(0,6);
  var h='<section class="bhero"><div><p class="eyebrow">Neues Beratungsgespräch</p><h2>Womit kommt der Kunde heute?</h2><p class="muted">Die Beratung beginnt beim Anliegen des Kunden. Weitere Themen kommen nur dazu, wenn Sie sie gemeinsam wählen.</p>'+
    '<label class="fl bh-k"><span>Kundennummer <em class="opt">optional</em></span><input type="text" id="bs-k" value="'+esc(homeKunde)+'" maxlength="20" placeholder="z. B. 10482" autocomplete="off" list="kunden-list"></label><button class="lnk" data-act="tab" data-tab="vorbereitung">'+ico('check',16)+'Termin zuerst vorbereiten</button></div></section>';
  h+='<div class="tcards">'+THEMEN.map(function(t){return '<button class="tcard" data-act="bs-neu" data-a="'+t[0]+'" data-kin="1"><span class="tc-ill">'+themaIll(t[0])+'</span><span class="tc-b"><span class="tc-ic" aria-hidden="true">'+ico(t[3],20)+'</span><strong>'+esc(t[1])+'</strong><span>'+esc(t[2])+'</span></span></button>'}).join('')+'</div>';
  h+=sec('Laufende Beratungen',L.length,'',L.length?'<ul class="runs">'+L.map(laufKarte).join('')+'</ul>':leer('Keine laufende Beratung. Laufende Beratungen werden automatisch gespeichert und erscheinen hier.'));
  if(fertig.length)h+=sec('Zuletzt abgeschlossen',fertig.length,'','<ul class="runs">'+fertig.map(laufKarte).join('')+'</ul>');
  h+='<details class="more-f"><summary>Weitere Funktionen</summary><div class="tools"><label class="tl2" for="adv-file"><span class="tli">'+ico('folder',20)+'</span><span><strong>Beratungsdatei laden</strong><small>Eine gesicherte Beratung weiterführen</small></span></label><input type="file" id="adv-file" accept=".json,application/json" hidden><button class="tl2" data-act="adv-kat"><span class="tli">'+ico('sliders',20)+'</span><span><strong>Leistungsmerkmale</strong><small>Vorlagen für Vergleiche</small></span></button><button class="tl2" data-act="adv-disc"><span class="tli">'+ico('doc',20)+'</span><span><strong>Hinweistext im PDF</strong><small>Text am Ende der Unterlage</small></span></button></div></details>';
  return h;
}
function laufKarte(s){
  var i=sessionPos(s),th=Object.keys(s.themen||{}).map(themaName),of=sessionOffen(s);
  return '<li class="run"><button data-act="bs-open" data-id="'+s.id+'"><span class="run-ic" aria-hidden="true">'+ico(themaIcon(s.anliegen||'individuell'),20)+'</span><span class="run-b"><span class="run-h"><b>'+esc(s.kunde||'ohne Kundennummer')+'</b><span class="badge">'+esc(s.anliegen?themaName(s.anliegen):'Anliegen offen')+'</span>'+(s.status==='abgeschlossen'?'<span class="stat-pill s-ok">abgeschlossen</span>':'')+'</span>'+
    '<span class="run-m">'+(th.length?'Themen: '+esc(th.join(', ')):'Noch keine Themen gewählt')+'</span>'+
    (s.status!=='abgeschlossen'?'<span class="run-p"><span class="bar"><i style="width:'+Math.round(i.nr/i.n*100)+'%"></i></span>Schritt '+i.nr+' von '+i.n+': '+esc(i.name)+'</span>':'')+
    (of.length?'<span class="run-m">'+of.length+(of.length===1?' offene Frage':' offene Fragen')+'</span>':'')+
    (s.doku&&s.doku.next?'<span class="run-n">Nächster Schritt: '+esc(s.doku.next)+'</span>':'')+
    '<span class="run-d">Zuletzt bearbeitet '+esc(new Date(s.updated).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))+'</span></span>'+ico('arrow',18)+'</button></li>';
}

/* ---- Shell ---- */
function shellHtml(){
  var c=curStep(),L=c.L,st=c.st,km=kmode();
  var done=L.filter(function(x){return cur.erledigt[x.key]}).length,pct=Math.round(done/L.length*100);
  var nav='<aside class="bs-steps" aria-label="Beratungsschritte"><div class="bs-who"><span class="avatar" aria-hidden="true">'+(km?ico('user',20):esc((cur.kunde||'–').slice(-2)))+'</span><div><b>'+(km?'Ihre Beratung':esc(cur.kunde||'Ohne Kundennummer'))+'</b><span class="bs-anl">'+ico(themaIcon(cur.anliegen||'individuell'),14)+'Anliegen: '+esc(cur.anliegen?themaName(cur.anliegen):'noch offen')+'</span></div></div>'+
    '<div class="bs-prog"><span class="bar"><i style="width:'+pct+'%"></i></span><small>'+done+' von '+L.length+' Schritten erledigt</small></div><nav class="bs-list">';
  var g='';
  L.forEach(function(x,i){
    if(x.grp!==g){if(g)nav+='</ol>';g=x.grp;nav+='<div class="bs-g">'+(x.thema?'<span aria-hidden="true">'+ico(themaIcon(x.thema),14)+'</span>':'')+esc(g)+'</div><ol>'}
    var stt=x.key===cur.step?'cur':cur.erledigt[x.key]?'done':cur.besucht[x.key]?'seen':'open';
    nav+='<li><button class="bs-i s-'+stt+'" data-act="bs-go" data-k="'+esc(x.key)+'"'+(stt==='cur'?' aria-current="step"':'')+'><i aria-hidden="true">'+(stt==='done'?'✓':stt==='cur'?'':'')+'</i><span>'+esc(x.name)+'</span><span class="sr">'+({cur:'aktueller Schritt',done:'erledigt',seen:'begonnen',open:'offen'})[stt]+'</span></button></li>';
  });
  nav+='</ol></nav><button class="lnk add-t" data-act="bs-go" data-k="themen">'+ico('plus',16)+'Thema hinzufügen</button></aside>';
  var main='<section class="bs-main"><div class="bs-bar"><div class="bs-crumb"><span>'+esc(st.grp)+'</span><b>Schritt '+(c.i+1)+' von '+L.length+'</b></div><div class="bs-tools">'+
    (km?'<span class="kbadge">'+ico('eye',16)+'Kundenansicht</span><button class="btn small" data-act="bs-kende">'+ico('lock',16)+'Kundenmodus beenden</button>':
      '<button class="btn small" data-act="bs-kmode">'+ico('eye',16)+'Kundenmodus</button><button class="btn small'+(ctxOpen?' on':'')+'" data-act="bs-ctx" aria-pressed="'+ctxOpen+'">'+ico('panel',16)+'Kontext</button><button class="btn small" data-act="bs-close">'+ico('back',16)+'Pausieren</button>')+
    '</div></div><div class="bs-body" id="bs-body">'+stepHtml(st)+'</div>'+
    '<div class="bs-foot"><button class="btn" data-act="bs-prev"'+(c.i===0?' disabled':'')+'>'+ico('back',18)+'Zurück</button>'+(c.i<L.length-1?'<button class="btn primary" data-act="bs-next">Weiter'+ico('arrow',18)+'</button>':(km?'':'<button class="btn primary" data-act="bs-abschluss" data-confirm="Beratung jetzt abschließen?">Beratung abschließen</button>'))+'</div></section>';
  var ctx=(!km&&ctxOpen)?ctxHtml(st):'';
  return '<div class="bs'+(km?' km':'')+(ctx?' with-ctx':'')+'">'+nav+main+ctx+'</div>';
}
function stepHead(st,lead){
  var ill=st.thema&&(st.kind==='leit'||st.key.slice(-2)===':0'||st.kind==='form'||st.kind==='ueberblick');
  return '<header class="sh-h'+(ill?' with-ill':'')+'"><div><p class="eyebrow">'+esc(st.grp)+'</p><h2>'+esc(st.name)+'</h2>'+(lead?'<p class="lead">'+lead+'</p>':'')+'</div>'+(ill?'<div class="sh-ill" aria-hidden="true">'+themaIll(st.thema)+'</div>':'')+'</header>';
}
function lexKnopf(k){var n=lexFuerThema(k).length;if(!n)return '';return '<button class="lnk lexb" data-act="bs-lex" data-k="'+esc(k)+'">'+ico('book',16)+(kmode()?'Erklärung ansehen':'Beraterwissen ('+n+')')+'</button>'}
function stepHtml(st){
  var km=kmode();
  if(st.kind==='anliegen'){
    return stepHead(st,'Mit welchem Anliegen kommt der Kunde? Es bleibt während der ganzen Beratung sichtbar.')+
      (function(){var tc='<div class="tcards small">'+THEMEN.map(function(t){var on=cur.anliegen===t[0];return '<button class="tcard'+(on?' on':'')+'" data-act="bs-anl" data-a="'+t[0]+'" aria-pressed="'+on+'"><span class="tc-ill">'+themaIll(t[0])+'</span><span class="tc-b"><span class="tc-ic" aria-hidden="true">'+ico(t[3],20)+'</span><strong>'+esc(t[1])+'</strong><span>'+esc(t[2])+'</span></span></button>'}).join('')+'</div>';
        return cur.anliegen?'<div class="anl-sel"><span class="anl-ill" aria-hidden="true">'+themaIll(cur.anliegen)+'</span><span><p class="eyebrow">Anliegen</p><b>'+esc(themaName(cur.anliegen))+'</b></span></div>'+anlassForm()+'<details class="adv"><summary>Anderes Anliegen wählen</summary>'+tc+'</details>':tc+anlassForm()})()+
      (km?'':'<label class="fl"><span>Kundennummer <em class="opt">nur für das CRM</em></span><input type="text" data-bs="kunde" value="'+esc(cur.kunde)+'" maxlength="20" placeholder="z. B. 10482" autocomplete="off" list="kunden-list"></label>');
  }
  if(st.kind==='situation')return stepHead(st,'Wie lebt der Kunde heute? Nur Lebensumstände, keine Namen und keine Gesundheitsangaben.')+'<div class="bs-form">'+kdForm()+'</div>';
  if(st.kind==='themen')return ueberblickHtml(st);
  if(st.kind==='slide'){
    var s=st.slide,fm=s.form?s.form():'',lv=s.live?s.live():'';
    return stepHead(st,'')+'<div class="bs-grid'+(s.text?'':' one')+'">'+(s.text?'<div class="bs-text">'+s.text+lexKnopf(st.thema)+'</div>':'')+'<div class="bs-work"><div id="tform">'+fm+'</div><div id="tlive">'+lv+'</div></div></div>';
  }
  if(st.kind==='form'){
    return stepHead(st,'')+lexKnopf(st.thema)+'<div class="bs-form">'+stepForm(st.form)+'</div><div id="advres">'+stepRes(st.form)+'</div>';
  }
  if(st.kind==='ueberblick'){
    return stepHead(st,'Wie ist der Kunde heute abgesichert? Gedeckt, teilweise, Lücke oder ungeklärt. Ungeklärt ist keine Lücke.')+'<div class="bs-form">'+ueForm()+'</div><div id="tlive">'+ueSummary()+'</div>';
  }
  if(st.kind==='leit'){
    var L=LEIT[themaDef(st.thema)[5]],A=cur.antworten[st.thema]||{},hw=THEMA_HINWEIS[st.thema];
    var h2=stepHead(st,esc(themaDef(st.thema)[2]));
    if(hw)h2+='<div class="ds-callout">'+esc(hw)+'</div>';
    if(L){
      h2+='<ol class="qlist">'+[['e','Einstieg'],['v','Situation verstehen'],['b','Bedeutung'],['p','Eigene Prioritäten']].map(function(q){return '<li><p class="q-k">'+q[1]+'</p><p class="q-t">'+esc(L[q[0]])+'</p><textarea data-bsa="'+st.thema+'.'+q[0]+'" maxlength="600" rows="2" placeholder="Antwort des Kunden">'+esc(A[q[0]]||'')+'</textarea></li>'}).join('')+'</ol>';
      h2+='<blockquote class="kq">'+esc(L.m)+'</blockquote>';
    }else h2+='<label class="fl"><span>Was ist dem Kunden wichtig?</span><textarea data-bsa="'+st.thema+'.frei" maxlength="800" rows="4">'+esc(A.frei||'')+'</textarea></label>';
    return h2+lexKnopf(st.thema);
  }
  if(st.kind==='bedarf'){
    var k=st.thema,b=cur.bedarf[k]||'',opts=BEDARF.filter(function(o){return o[0]&&(!km||o[0]!=='vermutet')});
    return stepHead(st,'Wie stehen Sie gemeinsam zu diesem Thema? Nur festhalten, was im Gespräch tatsächlich besprochen wurde.')+
      '<div class="needpick" role="group" aria-label="Stand des Themas">'+opts.map(function(o){return '<button class="np'+(b===o[0]?' on':'')+' n-'+o[0]+'" data-act="bs-bedarf" data-k="'+k+'" data-v="'+o[0]+'" aria-pressed="'+(b===o[0])+'"><b>'+esc(o[1])+'</b><small>'+esc(({vermutet:'Ihre Einschätzung, nicht mit dem Kunden besprochen. Erscheint nicht in der Kundenansicht und nicht im PDF.',besprochen:'Das Thema wurde gemeinsam angeschaut.',bestaetigt:'Der Kunde möchte hier eine Lösung.',kein:'Kein Bedarf oder bewusst nicht gewünscht.'})[o[0]])+'</small></button>'}).join('')+'</div>'+
      (km&&b==='vermutet'?'':'')+
      '<label class="fl"><span>Offene Frage zu diesem Thema <em class="opt">optional</em></span><span class="fi"><input type="text" id="bs-ofq" maxlength="160" placeholder="z. B. Renteninformation mitbringen"><button class="btn small" data-act="bs-offen-add" data-k="'+k+'">Hinzufügen</button></span></label>'+offenListe(k);
  }
  if(st.kind==='ergebnis')return ergebnisHtml(st);
  if(st.kind==='unterlage')return stepHead(st,'Interner Abschluss: Unterlage erzeugen, Mail vorbereiten und das Ergebnis im CRM festhalten.')+'<div class="bs-form">'+fOut()+'</div><details class="adv"><summary>Mail an den Kunden vorbereiten</summary>'+fBrief()+'<div id="advres">'+briefRes()+'</div></details>';
  return '';
}
function offenListe(k){
  var L=(cur.offen||[]).filter(function(x){return !k||x.k===k});if(!L.length)return '';
  return '<ul class="ofl">'+L.map(function(x){return '<li class="'+(x.done?'done':'')+'"><button class="ds-check" data-act="bs-offen-t" data-id="'+x.id+'" aria-pressed="'+!!x.done+'"><i aria-hidden="true">'+(x.done?'✓':'')+'</i>'+esc(x.t)+(x.k&&!k?' <small>('+esc(themaName(x.k))+')</small>':'')+'</button></li>'}).join('')+'</ul>';
}
function antwortZeilen(k){
  var R=[],d=themaDef(k),mod=d&&d[4];
  try{
    if(mod==='pflege')R=pfSummaryRows();
    else if(mod==='alter'){var c=calcAl();if(!c.err){R.push(['Versorgungsziel',eur(c.ziel)+' pro Monat']);R.push(['Erwartete Rente und Betriebsrente',eur(c.rente+c.bav)+' pro Monat']);R.push(['Versorgungslücke heute',eur(c.lueckeHeute)+' pro Monat'])}}
    else if(mod==='bu'){var o=buCalc();if(!isNaN(o.n))R.push(['Netto-Einkommen',eur(o.n)+' pro Monat']);R.push(['Im Leistungsfall verfügbar',eur(o.v)+' pro Monat']);if(!isNaN(o.lueN))R.push(['Unterschied zum Einkommen',eur(o.lueN)+' pro Monat'])}
    else if(mod==='anlage'){var a=calcAn();if(!a.err){R.push(['Einzahlungen gesamt',eur(a.ein)]);R.push(['Laufzeit',a.j+' Jahre'])}}
    else if(mod==='kv'){var kk=calcKv();if(!kk.err){R.push(['GKV mit Zusatz',eur(kk.A)+' pro Monat']);if(kk.hasPkv)R.push(['PKV Eigenanteil',eur(kk.eigen)+' pro Monat'])}}
    else if(mod==='sach'){sachStats().forEach(function(s){R.push([s.name,s.nein+' Lücken, '+s.teil+' teilweise'])})}
    else if(mod==='vorsorge'){var g=vpGaps();R.push(['Offene oder teilweise geregelte Punkte',String(g.length)])}
  }catch(e){}
  var A=cur.antworten[k]||{},L=d&&LEIT[d[5]];
  Object.keys(A).forEach(function(q){if(A[q]&&String(A[q]).trim())R.push([L&&L[q]?({e:'Einstieg',v:'Situation',b:'Bedeutung',p:'Prioritäten'})[q]||'Antwort':'Antwort',String(A[q]).trim()])});
  return R;
}
function ergebnisHtml(st){
  var km=kmode(),ks=themenFolge(),d=cur.doku;
  var h=stepHead(st,'Was wurde besprochen, was ist vereinbart, was ist noch offen? Gehen Sie diese Seite gemeinsam durch.');
  h+='<div class="sum"><div class="sum-a"><p class="eyebrow">Anliegen</p><p class="sum-l">'+esc(cur.anliegen?themaName(cur.anliegen):'Nicht angegeben')+(cur.anliegenText?'</p><p class="muted">„'+esc(cur.anliegenText)+'“':'')+'</p></div>';
  h+='<table class="ttab"><thead><tr><th>Thema</th><th>Woher</th><th>Stand</th></tr></thead><tbody>'+ks.map(function(k){var b=cur.bedarf[k]||'';if(km&&b==='vermutet')b='';var q=cur.themen[k].quelle;return '<tr><td><b>'+esc(themaName(k))+'</b></td><td>'+(q==='anliegen'?'Anliegen des Kunden':q==='zusammenhang'?'im Überblick gemeinsam gewählt':q==='vorschlag'?'aus einem Gesprächsansatz gewählt':'im Gespräch gewählt')+'</td><td>'+bedarfPill(b)+'</td></tr>'}).join('')+'</tbody></table>';
  h+=felderErgebnis(km);
  ks.forEach(function(k){var R=antwortZeilen(k);if(R.length)h+='<div class="ds-card"><div class="ds-cap">'+esc(themaName(k))+': wesentliche Angaben</div>'+pfFacts(R)+'</div>'});
  h+='<p class="fine-s">Die Zahlen stammen aus den Eingaben und Rechnern der Beratung. Ein Thema gilt erst als bestätigt, wenn der Kunde es so gesagt hat.</p></div>';
  var of=sessionOffen(cur);
  h+='<h3 class="sub-h">Offene Fragen</h3>'+(of.length?'<ul class="ds-list">'+of.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul>':'<p class="muted">Keine offenen Fragen erfasst.</p>')+
    '<label class="fl"><span>Weitere offene Frage</span><span class="fi"><input type="text" id="bs-ofq" maxlength="160"><button class="btn small" data-act="bs-offen-add" data-k="">Hinzufügen</button></span></label>';
  h+='<label class="fl"><span>Vereinbarungen</span><textarea data-bs="doku.vereinbarungen" maxlength="800" rows="3" placeholder="z. B. Angebot für Pflegemonatsgeld rechnen, Unterlagen zur Betriebsrente mitbringen">'+esc(d.vereinbarungen)+'</textarea></label>'+
    '<div class="grid2"><label class="fl"><span>Nächster Schritt</span><input type="text" data-bs="doku.next" maxlength="160" value="'+esc(d.next)+'" placeholder="z. B. Folgetermin mit Partnerin"></label><label class="fl"><span>Nächster Termin</span><input type="text" data-bs="doku.termin" maxlength="80" value="'+esc(d.termin)+'" placeholder="z. B. 12.11., 10 Uhr"></label></div>';
  h+='<button class="ds-check confirm" data-act="bs-gesehen" aria-pressed="'+!!d.gesehen+'"><i aria-hidden="true">'+(d.gesehen?'✓':'')+'</i>Zusammenfassung gemeinsam mit dem Kunden durchgesehen'+(d.gesehen?' <small>('+esc(new Date(d.gesehen).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))+')</small>':'')+'</button>';
  return h;
}
function ctxHtml(st){
  var k=st.thema,kd=adv.kd||{},h='<aside class="bs-ctx" aria-label="Kontext für den Berater"><div class="ctx-h"><b>'+ico('lock',14)+'Nur für dich</b><button class="icon sm" data-act="bs-ctx" aria-label="Kontext ausblenden">×</button></div>';
  h+='<div class="ctx-s"><label class="ctx-l" for="bs-notiz">Interne Notiz</label><textarea id="bs-notiz" data-bs="notiz" rows="4" maxlength="1500" placeholder="Erscheint nie in der Kundenansicht und nicht im PDF.">'+esc(cur.notiz)+'</textarea></div>';
  var f=[];if(kd.gruppe&&GR[kd.gruppe])f.push(['Lebensphase',GR[kd.gruppe].name]);if(kd.alter)f.push(['Alter',kd.alter+' Jahre']);if(kd.fam)f.push(['Familienstand',kd.fam]);if(kd.kinder)f.push(['Kinder',kd.kinder]);if(kd.beruf)f.push(['Beruf',kd.beruf]);if(kd.netto)f.push(['Netto',kd.netto+' €']);
  h+='<div class="ctx-s"><p class="ctx-l">Kunde</p>'+(f.length?pfFacts(f):'<p class="muted sm">Noch keine Angaben.</p>')+'</div>';
  var ks=themenFolge();
  h+='<div class="ctx-s"><p class="ctx-l">Themen</p>'+(ks.length?'<ul class="ctx-t">'+ks.map(function(x){return '<li><span>'+esc(themaName(x))+'</span>'+bedarfPill(cur.bedarf[x]||'')+'</li>'}).join('')+'</ul>':'<p class="muted sm">Noch keine Themen.</p>')+'</div>';
  if(k&&ZUSAMMEN[k]&&ZUSAMMEN[k].length)h+='<div class="ctx-s"><p class="ctx-l">Mögliche Zusammenhänge</p><ul class="ctx-z">'+ZUSAMMEN[k].map(function(z){return '<li><b>'+esc(themaName(z[0]))+(cur.themen[z[0]]?' ✓':'')+'</b><span>'+esc(z[1])+'</span></li>'}).join('')+'</ul></div>';
  var of=sessionOffen(cur);h+='<div class="ctx-s"><p class="ctx-l">Offene Fragen ('+of.length+')</p>'+(of.length?'<ul class="ds-list sm">'+of.slice(0,6).map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul>':'<p class="muted sm">Keine.</p>')+'</div>';
  if(st.slide&&st.slide.tip)h+='<div class="ctx-s tip"><p class="ctx-l">Tipp für diesen Schritt</p><p>'+st.slide.tip+'</p></div>';
  if(k){var lx=lexFuerThema(k).slice(0,6);if(lx.length)h+='<div class="ctx-s"><p class="ctx-l">Beraterwissen</p><ul class="ctx-x">'+lx.map(function(e){return '<li><button data-act="bs-lexe" data-id="'+e.id+'"><span>'+esc(LEXTYP[e.typ]||e.typ)+'</span>'+esc(e.titel)+'</button></li>'}).join('')+'</ul></div>'}
  return h+'</aside>';
}
/* Ersetzt die alten Funktionen des Gesprächsmodus */
function renderTalk(keep){
  if(!cur){render();return}
  var v=$('view'),b=$('bs-body'),y=keep?window.scrollY:0,by=b?b.scrollTop:0;
  v.innerHTML=shellHtml();afterBeratungRender();
  if(keep){window.scrollTo(0,y);var b2=$('bs-body');if(b2)b2.scrollTop=by}
}
function talkLive(){
  if(!cur)return;var st=curStep().st;
  if(st.kind==='slide'){var el=$('tlive');if(el){el.innerHTML=st.slide.live?st.slide.live():'';drawCharts(el)}}
  else if(st.kind==='form'||st.kind==='unterlage'){var r=$('advres');if(r){r.innerHTML=st.kind==='form'?stepRes(st.form):briefRes();drawCharts(r)}}
  else if(st.kind==='ueberblick'){var u=$('tlive');if(u)u.innerHTML=ueSummary()}
}
function talkKey(ev){if(kmode()&&(ev.ctrlKey||ev.metaKey)&&ev.key&&ev.key.toLowerCase()==='k'){ev.preventDefault();ev.stopImmediatePropagation();return true}return false}
function afterBeratungRender(){
  document.body.classList.toggle('kmode',kmode());
  document.body.classList.toggle('in-bs',!!(cur&&talkOpen&&tab==='beratung'));
  if(kmode()){$('kunden-list').innerHTML='';$('banner').innerHTML=''}
  var v=$('view');if(v)drawCharts(v);
}
function mailView(){
  return '<button class="lnk back" data-act="bs-mailende">'+ico('back',16)+'Zurück</button><section class="card-s"><div class="bs-form">'+fBrief()+'</div><div id="advres">'+briefRes()+'</div></section>';
}
function advLoadText(t){
  try{var o=JSON.parse(t);if(!o||o.app!=='crm-beratung'||!o.adv)throw new Error('x');
    var a=deep(newAdv(''),o.adv),s=neueSitzung(a.kunde||'','');s.adv=a;
    var map={alter:'alter',bu:'arbeit',pflege:'pflege',kv:'kranken',sach:'sach',anlage:'anlage',vorsorge:'vorsorge'};
    Object.keys(map).forEach(function(m){if(a.mods&&a.mods[m])s.themen[map[m]]={quelle:'gewaehlt',ts:Date.now()}});
    s.anliegen=Object.keys(s.themen)[0]||'';if(s.anliegen)s.themen[s.anliegen].quelle='anliegen';
    s.step='themen';oeffneSitzung(s);a.pdfName='';sessSave();render();toast('Beratung geladen')}
  catch(e){toast('Das ist keine gültige Beratungsdatei.')}
}
function waitMail(id){
  var t=db.todos.find(function(x){return x.id===id});if(!t)return;
  closeSheet();cur=null;talkOpen=false;
  adv=newAdv(t.kunde);adv.mods={alter:false,anlage:false,kv:false,sach:false,vorsorge:false,pflege:false,bu:false,zus:false};
  var b=adv.brief;b.betreff='Kurze Nachfrage';b.besprochen='Ich wollte kurz nachfragen, wie es bei Ihnen mit diesem Punkt aussieht: '+t.text;b.benoetigt='';b.kennzahlen=false;b.anlagen='';
  mailAdv=true;tab='beratung';render();window.scrollTo(0,0);
}
function dokuReport(b){
  if(!cur)return;var ks=themenFolge();
  b.push({t:'h',text:'Ihr Anliegen und unsere Themen'});
  b.push({t:'p',text:'Anliegen: '+(cur.anliegen?themaName(cur.anliegen):'nicht angegeben')+(cur.anliegenText?'. In Ihren Worten: „'+cur.anliegenText+'“':'')+'.'});
  var rows=ks.map(function(k){var v=cur.bedarf[k]||'';if(v==='vermutet')v='';return [themaName(k),pfLbl(BEDARF,v)||'noch offen']});
  if(rows.length)b.push({t:'table',head:['Thema','Stand'],w:[0.6,0.4],rows:rows});
  var fg=felderGeklaert().filter(function(x){return x.e.status!=='angesprochen'||!x.e.jetzt});
  if(fg.length){b.push({t:'h',text:'Weitere Lebensbereiche, über die wir gesprochen haben'});b.push({t:'table',head:['Bereich','Vereinbart'],w:[0.6,0.4],rows:fg.map(function(x){var wv=x.e.wv&&db.todos.find(function(t){return t.id===x.e.wv});return [x.f.t,(x.e.jetzt?'heute besprochen':FSTATUS_K[feldStatusVon(cur,x.k)]||'')+(wv?', Termin ab '+fmtFull(wv.due):'')]})})}
  var d=cur.doku,of=sessionOffen(cur);
  if(d.vereinbarungen.trim()){b.push({t:'h',text:'Vereinbarungen'});b.push({t:'p',text:d.vereinbarungen.trim()})}
  if(of.length){b.push({t:'h',text:'Offene Fragen'});b.push({t:'bul',items:of})}
  if(d.next.trim()||d.termin.trim()){b.push({t:'h',text:'Nächster Schritt'});if(d.next.trim())b.push({t:'p',text:d.next.trim()});if(d.termin.trim())b.push({t:'p',text:'Nächster Termin: '+d.termin.trim()})}
}

/* ---- Aktionen ---- */
function bsAct(act,btn){
  var c;
  switch(act){
    case 'bs-neu':{
      var k=(btn.dataset.k||($('bs-k')&&$('bs-k').value)||'').trim().toUpperCase();
      if(k){var e=checkKunde(k);if(e){toast(e);return}}
      var a=btn.dataset.a||'';var s=neueSitzung(k,a);oeffneSitzung(s);sessSave();render();window.scrollTo(0,0);return}
    case 'bs-open':{var s2=db.laufend.find(function(x){return x.id===btn.dataset.id});if(!s2)return;closeSheet();s2.modus='berater';if(s2.status==='abgeschlossen'){s2.step='ergebnis'}oeffneSitzung(s2);render();window.scrollTo(0,0);return}
    case 'bs-close':sessSave();cur=null;adv=null;talkOpen=false;document.body.classList.remove('in-bs');render();toast('Beratung pausiert. Du findest sie auf der Startseite.');return;
    case 'bs-go':geheZu(btn.dataset.k);return;
    case 'bs-next':c=curStep();cur.erledigt[c.st.key]=1;if(c.i<c.L.length-1)geheZu(c.L[c.i+1].key);return;
    case 'bs-prev':c=curStep();if(c.i>0)geheZu(c.L[c.i-1].key);return;
    case 'bs-ctx':ctxOpen=!ctxOpen;renderTalk(true);return;
    case 'bs-kmode':cur.modus='kunde';closeSheet();sessSave();renderTalk();toast('Kundenmodus: interne Inhalte sind ausgeblendet.');return;
    case 'bs-kende':openSheet('<h3>Kundenmodus beenden?</h3><p>Danach werden interne Notizen, Einschätzungen und Hinweise wieder angezeigt. Bitte erst beenden, wenn der Kunde nicht mehr auf den Bildschirm schaut.</p><div class="btnrow"><button class="btn" data-act="close">Im Kundenmodus bleiben</button><button class="btn primary" data-act="bs-kende-ok">Beratermodus anzeigen</button></div>');return;
    case 'bs-kende-ok':cur.modus='berater';closeSheet();sessSave();renderTalk();return;
    case 'bs-anl':{var an=btn.dataset.a;if(cur.anliegen&&cur.themen[cur.anliegen]&&cur.themen[cur.anliegen].quelle==='anliegen'&&cur.anliegen!==an)cur.themen[cur.anliegen].quelle='gewaehlt';cur.anliegen=an;cur.themen[an]=cur.themen[an]||{ts:Date.now()};cur.themen[an].quelle='anliegen';syncMods();sessSave();renderTalk(true);return}
    case 'bs-thema':{var t=btn.dataset.a;uebAdd=!!btn.closest('.ueb-add');if(cur.themen[t]){if(t===cur.anliegen){toast('Das Anliegen bleibt Teil der Beratung.');return}delete cur.themen[t]}else{var vor=btn.classList.contains('chip');cur.themen[t]={quelle:vor?'vorschlag':'gewaehlt',ts:Date.now()}}syncMods();sessSave();renderTalk(true);return}
    case 'bs-bedarf':{var kk=btn.dataset.k,v=btn.dataset.v;cur.bedarf[kk]=cur.bedarf[kk]===v?'':v;sessSave();renderTalk(true);return}
    case 'bs-offen-add':{var inp=$('bs-ofq'),tx=inp?inp.value.trim():'';if(!tx)return;var er=checkText(tx);if(er){toast(er);return}cur.offen.push({id:uid(),t:tx.slice(0,160),k:btn.dataset.k||'',done:false});sessSave();renderTalk(true);return}
    case 'bs-offen-t':{var o=cur.offen.find(function(x){return x.id===btn.dataset.id});if(o){o.done=!o.done;sessSave();renderTalk(true)}return}
    case 'bs-gesehen':cur.doku.gesehen=cur.doku.gesehen?0:Date.now();sessSave();renderTalk(true);return;
    case 'bs-abschluss':{
      var nx=(cur.doku.next||'').trim();
      if(nx&&cur.kunde){var ex=db.todos.some(function(x){return x.kunde===cur.kunde&&x.text==='Nächster Schritt: '+nx&&!x.done});if(!ex)db.todos.push({id:uid(),kunde:cur.kunde,text:('Nächster Schritt: '+nx).slice(0,300),due:adv.wvDays&&adv.wvDays!=='0'?addDaysIso(todayIso(),Number(adv.wvDays)):addDaysIso(todayIso(),14),done:false,ts:Date.now()})}
      cur.status='abgeschlossen';cur.erledigt.unterlage=1;cur.erledigt.ergebnis=1;sessSave();var kd=cur.kunde;cur=null;adv=null;talkOpen=false;document.body.classList.remove('in-bs');
      if(kd){kundeAkt=kd;tab='kunde'}else tab='beratung';render();toast('Beratung abgeschlossen'+(nx&&kd?', nächster Schritt als Aufgabe angelegt':''));return}
    case 'bs-fopen':{var fk=btn.dataset.k;uebOffen=uebOffen===fk?'':fk;if(uebOffen&&kmode()&&feldStatus(fk)==='erkannt'){felderObj()[fk].status='angesprochen';felderObj()[fk].ts=Date.now();sessSave()}renderTalk(true);return}
    case 'bs-feld':feldSetzen(btn.dataset.k,btn.dataset.s);sessSave();renderTalk(true);return;
    case 'bs-fwv':feldWv(btn.dataset.k,btn.dataset.m);save();sessSave();renderTalk(true);return;
    case 'bs-fwv-del':{var fe=felderObj()[btn.dataset.k];if(fe&&fe.wv){db.todos=db.todos.filter(function(x){return x.id!==fe.wv||x.done});fe.wv=''}save();sessSave();renderTalk(true);return}
    case 'bs-fokus':{c=curStep();cur.erledigt.themen=1;cur.fokus=Object.keys(felderObj()).some(function(x){return felderObj()[x].jetzt})?'':'anliegen';var ix=c.L.map(function(x){return x.key}).indexOf('themen');sessSave();if(ix>=0&&ix<c.L.length-1)geheZu(c.L[ix+1].key);return}
    case 'bs-aend':{var A=anlassObj().aenderung,ak=btn.dataset.k,ai=A.indexOf(ak);if(ai>=0)A.splice(ai,1);else A.push(ak);sessSave();renderTalk(true);return}
    case 'bs-lex':openLexThema(btn.dataset.k);return;
    case 'bs-lexe':openLexEintrag(btn.dataset.id,true);return;
    case 'bs-mailende':mailAdv=false;adv=null;render();return;
  }
}
document.addEventListener('input',function(ev){
  var t=ev.target;if(!cur||!t.dataset)return;
  if(t.dataset.bs!==undefined){var p=t.dataset.bs,v=t.value;if(p==='kunde'){v=v.trim().toUpperCase();cur.kunde=v;adv.kunde=v}else{if(/^anlass\./.test(p))anlassObj();setp(cur,p,v)}sessDirty();return}
  if(t.dataset.bsa!==undefined){var q=t.dataset.bsa.split('.');if(!cur.antworten[q[0]])cur.antworten[q[0]]={};cur.antworten[q[0]][q[1]]=t.value;sessDirty();return}
  if(t.dataset.adv!==undefined||t.dataset.sig!==undefined)sessDirty();
});
document.addEventListener('change',function(ev){if(cur&&ev.target.dataset&&ev.target.dataset.adv!==undefined)sessDirty()});
document.addEventListener('click',function(){if(cur)sessDirty()});
/* Im Kundenmodus erlaubte Aktionen: nur Bedienung der Beratung selbst */
var KMODE_OK=/^(bs-(go|next|prev|anl|thema|bedarf|offen-add|offen-t|gesehen|kende|kende-ok|lex|lexe|fopen|feld|fokus|aend)|adv-(pfset|pfopt|pfoff|pfp|ue|ent|wish|grp|wenn|leben|row-add|row-del|an-add|an-del|kvl-add|kvl-del|fp-from-tax)|ganz-set|ev-set|talk-jump|setdate|close|lexk-.*)$/;
