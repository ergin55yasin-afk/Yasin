/* ================= Akademie, Vertiefung: Oberfläche (Modi, Übung, Vertiefungsfragen, Quellen, Lernstand) ================= */
var tf={mode:{},ue:{},ueI:{},res:{},quiz:{},vq:{},qf:'',sq:''};
var TF_MODI=[['schnell','Schnell'],['praxis','Praxis'],['experte','Experte'],['ueben','Üben']];
var TF_KRIT=['Verständlichkeit','Zuhören','Fragetechnik','Gesprächsstruktur','Empathie','Umgang mit Einwänden','Klarheit','Kundenorientierung'];
var TF_VQ=['Erkläre mir die psychologischen Hintergründe.','Welche Studien belegen das?','Welche Gegenargumente gibt es?','Zeige mir fünf weitere Beispiele.','Wie wende ich das bei einer Vertragsfälligkeit an?','Lass mich diese Technik üben.'];
var TF_ART={beleg:'direkt untersucht',transfer:'übertragen aus anderem Kontext',heuristik:'Erfahrungsregel'};

/* Lernstand, lokal in db.akademie */
function tfLs(){var a=db.akademie;if(!a||typeof a!=='object')a=db.akademie={};['gelesen','tests','uebungen'].forEach(function(k){if(!a[k]||typeof a[k]!=='object')a[k]={}});return a}
function tfFaellig(u){return !!(u&&u.pruefen&&todayIso()>u.pruefen)}
function tfBadge(s,txt){return '<span class="evb ev'+s+'" title="'+esc(AQ_STUFEN[s]?AQ_STUFEN[s][1]:'')+'">'+(txt||'Evidenz '+s)+'</span>'}
function tfCite(keys){return keys&&keys.length?' <span class="tfcite">'+keys.map(function(k){return '<button class="linkbtn" data-act="tf-src" data-id="'+k+'">'+esc(aqKurz(k))+'</button>'}).join('; ')+'</span>':''}
function tfP(a){return (a||[]).map(function(x){return '<p>'+esc(x)+'</p>'}).join('')}

function tfLegend(){
  return '<details class="tfleg"><summary>Was bedeuten die Evidenzstufen?</summary><dl>'+Object.keys(AQ_STUFEN).map(function(k){return '<dt>'+tfBadge(k,k+' · '+AQ_STUFEN[k][0])+'</dt><dd>'+esc(AQ_STUFEN[k][1])+'</dd>'}).join('')+'</dl>'+
  '<p class="hint-t">Die Stufe beschreibt die Beleglage einer Aussage. Getrennt davon zählen Studienqualität, Effektstärke, Einheitlichkeit der Befunde und Übertragbarkeit auf Beratungsgespräche. Eine Stufe A im Labor heißt nicht, dass derselbe Effekt im Kundengespräch gleich stark ist.</p></details>';
}
function tfStats(){var ls=tfLs(),g=TIEF.filter(function(u){return ls.gelesen[u.id]}).length,t=TIEF.filter(function(u){return ls.tests[u.id]}).length,ue=Object.keys(ls.uebungen).reduce(function(s,k){return s+(ls.uebungen[k]||0)},0);return {g:g,t:t,ue:ue}}
function tfHomeSection(){
  var ls=tfLs(),st=tfStats();
  var h='<h3 class="wkh">Wissenschaftlich vertieft</h3><p class="hint-t" style="margin-top:0">Ausführliche Einheiten mit Grundlagen, Psychologie, Studienlage, Praxis, Beispielen, Grenzen, Training und Quellen. Jede Einheit gibt es in vier Modi: Schnell, Praxis, Experte und Üben.</p>';
  h+='<div class="tfstat"><span><b>'+st.g+'</b> von '+TIEF.length+' gelesen</span><span><b>'+st.t+'</b> Selbsttests</span><span><b>'+st.ue+'</b> Übungen</span><button class="btn small" data-act="tf-quellen">Quellenverzeichnis ('+Object.keys(AQ).length+')</button></div>';
  h+=tfLegend();
  TIEF_BEREICHE.forEach(function(b){
    var L=TIEF.filter(function(u){return u.bereich===b[0]});if(!L.length)return;
    h+='<div class="tfber"><h4>'+esc(b[1])+'</h4><div class="wkl">'+L.map(tfCard).join('')+'</div></div>';
  });
  return h;
}
function tfCard(u){
  var ls=tfLs(),t=ls.tests[u.id];
  return '<button class="wkli tfcard'+(u.haupt?' haupt':'')+'" data-act="wk-unit" data-id="'+u.id+'"><b>'+esc(u.titel)+'</b><small>'+tfBadge(u.stufe)+(ls.gelesen[u.id]?' <span class="tfok">gelesen</span>':'')+(t?' <span class="tfok">Test '+t.r+'/'+t.n+'</span>':'')+(tfFaellig(u)?' <span class="tfdue">Prüfung fällig</span>':'')+'</small></button>';
}
function tfLinksFor(knId){
  var L=TIEF.filter(function(u){return (u.kn||[]).indexOf(knId)>=0});
  return L.length?'<section class="wks tflink"><h4>Wissenschaftliche Vertiefung</h4><div class="wkl">'+L.map(tfCard).join('')+'</div></section>':'';
}
function tfSearch(q,n){
  var tk=wkTokens(q);if(!tk.length)return [];var res=[];
  TIEF.forEach(function(u){
    var t=u.titel.toLowerCase(),all=JSON.stringify([u.schnell,u.A,u.D]).toLowerCase(),sc=0;
    tk.forEach(function(w){if(t.indexOf(w)>=0)sc+=6;if(all.indexOf(w)>=0)sc+=1});
    if(sc>0)res.push([sc,u]);
  });
  res.sort(function(a,b){return b[0]-a[0]});return res.slice(0,n||4).map(function(x){return x[1]});
}

/* Einheit */
function tfUnit(id){
  var u=TIEF_IDX[id];if(!u)return wkHome();
  var m=tf.mode[id]||'schnell',ls=tfLs(),b=TIEF_BEREICHE.filter(function(x){return x[0]===u.bereich})[0];
  var h='<div class="plbar"><button class="linkbtn" data-act="wk-home">← Akademie</button><button class="linkbtn" data-act="tf-quellen">Quellenverzeichnis</button></div>';
  h+='<div class="wkhead tfhead"><div><small>'+esc(b?b[1]:'')+' · wissenschaftlich vertieft</small><h2>'+esc(u.titel)+'</h2><div class="tfmeta">'+tfBadge(u.stufe,'Gesamt: Evidenz '+u.stufe)+'<span>Version '+esc(u.version)+'</span><span>Stand '+esc(u.stand)+'</span><span>Nächste Prüfung '+esc(u.pruefen)+'</span>'+(tfFaellig(u)?'<span class="tfdue">Überprüfung fällig</span>':'')+'</div></div></div>';
  if(tfFaellig(u))h+='<p class="err" role="status">Diese Einheit hat ihr Prüfdatum überschritten. Inhalte und Quellen sollten mit dem aktuellen Forschungsstand abgeglichen werden.</p>';
  h+='<div class="seg tfseg" role="group" aria-label="Modus">'+TF_MODI.map(function(x){return '<button data-act="tf-mode" data-id="'+id+'" data-m="'+x[0]+'" aria-pressed="'+(m===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>';
  h+=m==='experte'?tfExperte(u):m==='praxis'?tfPraxis(u):m==='ueben'?tfUeben(u):tfSchnell(u);
  h+=tfVqHtml(u);
  var vk=(u.verkn||[]).filter(function(k){return TIEF_IDX[k]}),kn=(u.kn||[]).filter(function(k){return KN_IDX[k]});
  if(vk.length)h+=wkSec('Verknüpfte Vertiefungen','<div class="wkl">'+vk.map(function(k){return tfCard(TIEF_IDX[k])}).join('')+'</div>','');
  if(kn.length)h+=wkSec('Passende Lerneinheiten der Akademie',wkCardList(kn.map(function(k){return KN_IDX[k]})),'');
  h+='<div class="plbar" style="margin-top:12px"><button class="btn small'+(ls.gelesen[id]?'':' primary')+'" data-act="tf-read" data-id="'+id+'">'+(ls.gelesen[id]?'Als ungelesen markieren':'Als gelesen markieren')+'</button><button class="btn small" data-act="wk-go" data-id="training">Im Gesprächstraining üben</button></div>';
  h+='<p class="hint-t">Lerninhalte mit Quellenangaben, erstellt mit KI-Unterstützung und nicht durch eine Fachredaktion geprüft. Beispiele sind fiktiv. Keine echten Kundendaten in Übungen eintragen.</p>';
  return h;
}
function tfSchnell(u){
  var s=u.schnell;
  return wkSec('Das Wichtigste',wkUl(s.kern),'wkhl')+wkSec('Ein Satz zum Mitnehmen','<p class="wkq">'+esc(s.satz)+'</p>','')+wkSec('Vermeiden',wkUl(s.vermeiden),'wkwarn')+
    '<p class="hint-t">Mehr Tiefe: Praxis für Ablauf und Beispiele, Experte für Theorie und Studienlage, Üben für Fallübung und Selbsttest.</p>';
}
function tfPraxis(u){
  var D=u.D,E=u.E,G=u.G,h='';
  h+=wkSec('Wann einsetzen','<p>'+esc(D.wann)+'</p><p><b>Ziel:</b> '+esc(D.ziel)+'</p>','');
  h+=wkSec('Schritt für Schritt',wkOl(D.schritte),'wkhl')+wkSec('Formulierungen',wkUl(D.formulierungen),'');
  h+=wkSec('Mögliche Reaktionen',wkUl(D.reaktion),'')+wkSec('Wirkt es?','<p>'+esc(D.pruefen)+'</p><p><b>Anpassen:</b> '+esc(D.anpassen)+'</p>','');
  if(u.situationen)h+=wkSec('Zehn typische Einwandsituationen','<div class="tfsit">'+u.situationen.map(function(s){return '<div><b>'+esc(s[0])+'</b><i>'+esc(s[1])+'</i><span>'+esc(s[2])+'</span>'+(s[3]&&KN_IDX[s[3]]?'<button class="linkbtn" data-act="wk-unit" data-id="'+s[3]+'">Ausführlich</button>':'')+'</div>'}).join('')+'</div><p class="hint-t">Nicht jeder Einwand ist ein verstecktes Kaufsignal. Die Einteilung ist eine Praxisordnung (Stufe D).</p>','');
  h+=wkSec('Beispiele','<div class="wkgb"><div class="wkg"><small>Gut</small>'+esc(E.gut)+'</div><div class="wkb"><small>Weniger gut</small>'+esc(E.schlecht)+'</div></div>','');
  h+=wkSec('Beispieldialog',wkDia(E.dialog)+'<p><b>Analyse:</b> '+esc(E.analyse)+'</p><p><b>Alternative:</b> '+esc(E.alternative)+'</p>','');
  h+=wkSec('Übertragung','<p><b>Finanzberatung:</b> '+esc(E.finanz)+'</p><p><b>Allgemein:</b> '+esc(E.allgemein)+'</p>','');
  if(u.sammlung)h+=wkSec('Beispielsammlung: wenn Spiegeln danebengeht','<div class="tfsam">'+u.sammlung.map(function(s){return '<div><p class="k">Kunde: „'+esc(s[0])+'“</p><p class="x"><b>Schwach:</b> '+esc(s[1])+'</p><p class="w"><b>Problem:</b> '+esc(s[2])+'</p><p class="g"><b>Besser:</b> '+esc(s[3])+'</p></div>'}).join('')+'</div>','');
  h+=wkSec('Übungen',(G.uebungen||[]).map(function(x){return '<div class="tfue"><span class="tflvl">'+esc(x.level)+'</span><b>'+esc(x.titel)+'</b><p>'+esc(x.aufgabe)+'</p></div>'}).join(''),'');
  h+=wkSec('Reflexion',wkUl(G.reflexion),'')+wkSec('Woran du gute Anwendung erkennst',wkUl(G.kriterien),'');
  return h;
}
function tfExperte(u){
  var A=u.A,B=u.B,C=u.C,F=u.F,h='';
  h+=wkSec('A · Grundlagen','<p><b>Definition:</b> '+esc(A.def)+'</p><p><b>Herkunft:</b> '+esc(A.herkunft)+'</p>'+(A.begriffe&&A.begriffe.length?'<dl class="tfdl">'+A.begriffe.map(function(b){return '<dt>'+esc(b[0])+'</dt><dd>'+esc(b[1])+'</dd>'}).join('')+'</dl>':'')+'<p><b>Theorie:</b> '+esc(A.theorie)+'</p><p><b>Abgrenzung:</b> '+esc(A.abgrenzung)+'</p>','');
  h+=wkSec('B · Psychologische Wirkmechanismen',tfP(B.text)+'<p><b>Alternative Erklärung:</b> '+esc(B.alternativ)+'</p>','');
  h+=wkSec('C · Wissenschaftliche Evidenz','<ul class="tfaus">'+C.aussagen.map(function(a){return '<li>'+tfBadge(a.s)+' <span class="tfart">'+esc(TF_ART[a.art]||a.art)+'</span><p>'+esc(a.t)+tfCite(a.q)+'</p></li>'}).join('')+'</ul><p><b>Widersprüche und Grenzen der Studienlage:</b> '+esc(C.widerspruch)+'</p><p><b>Übertragbarkeit:</b> '+esc(C.transfer)+'</p><p class="hint-t">Zusammenhänge aus Befragungen zeigen keine Ursache. Laborbefunde sind nicht automatisch auf Kundengespräche übertragbar.</p>','');
  if(u.bias)h+=wkSec('Verzerrungen im Überblick','<div class="tfbias">'+u.bias.map(function(b){return '<details><summary><b>'+esc(b.n)+'</b> '+tfBadge(b.s)+'</summary><p><b>Theorie:</b> '+esc(b.th)+'</p><p><b>Evidenz:</b> '+esc(b.ev)+tfCite(b.q)+'</p><p><b>Alltag:</b> '+esc(b.all)+'</p><p><b>Im Gespräch:</b> '+esc(b.ges)+'</p><p><b>Grenzen:</b> '+esc(b.gr)+'</p></details>'}).join('')+'</div>','');
  h+=wkSec('F · Grenzen, Risiken und Ethik','<p><b>Nicht geeignet:</b></p>'+wkUl(F.nicht)+'<p><b>Manipulativ wird es, wenn:</b> '+esc(F.manipulativ)+'</p><p><b>Häufige Missverständnisse:</b></p>'+wkUl(F.missverstaendnisse)+'<p><b>Ethik:</b> '+esc(F.ethik)+'</p><p><b>Was sich nicht ableiten lässt:</b> '+esc(F.nichtAbleiten)+'</p>','wkwarn');
  h+=wkSec('H · Quellen','<ol class="tfq">'+(u.q||[]).map(tfSrcLi).join('')+'</ol><p class="hint-t">Geprüft am '+esc(AQ_STAND)+'. '+esc(AQ_PRUEFART)+'</p>','');
  return h;
}
function tfSrcLi(k){
  var q=AQ[k];if(!q)return '';
  var link=q.doi?'https://doi.org/'+q.doi:q.url||'';
  return '<li id="aq-'+k+'"><b>'+esc(q.a)+' ('+q.y+').</b> '+esc(q.t)+'. <i>'+esc(q.j)+'</i>.'+(link?' <a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">'+esc(q.doi?'DOI '+q.doi:'Link')+'</a>':'')+
    '<div class="tfqm"><span>'+esc(q.typ)+'</span>'+(AQ_DOI_OFFEN.indexOf(k)>=0?'<span class="tfwarn">DOI aus Literaturangabe, nicht direkt geprüft</span>':'')+(q.status==='teilgeprueft'?'<span class="tfwarn">teilweise geprüft</span>':'')+(q.hinweis?'<span>'+esc(q.hinweis)+'</span>':'')+'</div>'+
    '<details><summary>Fragestellung, Methode, Ergebnis</summary><p><b>Frage:</b> '+esc(q.frage)+'</p><p><b>Methode:</b> '+esc(q.methode)+'</p><p><b>Ergebnis:</b> '+esc(q.erg)+'</p><p><b>Grenzen:</b> '+esc(q.grenz)+'</p><p><b>Bedeutung für die Praxis:</b> '+esc(q.rel)+'</p></details></li>';
}

/* Üben: Fall mit Rückmeldung zu acht Kriterien und Selbsttest */
function tfUeben(u){
  var id=u.id,cases=u.uebung||[],i=Math.min(tf.ueI[id]||0,Math.max(cases.length-1,0)),c=cases[i],r=tf.res[id]||{},h='';
  if(c){
    h+='<section class="wks wkex"><h4>Fallübung'+(cases.length>1?' '+(i+1)+' von '+cases.length:'')+'</h4><p><b>Situation:</b> '+esc(c.sit)+'</p><div class="wkdia"><div class="wkd k"><small>Kunde</small>'+esc(c.kunde)+'</div></div><p><b>Deine Aufgabe:</b> '+esc(c.ziel)+'</p>'+
      '<label for="tf-ue" class="sr">Deine Antwort</label><textarea id="tf-ue" rows="4" maxlength="1500" data-tf="ue" data-id="'+id+'" placeholder="Was sagst du dem Kunden?">'+esc(tf.ue[id+':'+i]||'')+'</textarea>'+
      '<div class="btnrow"><button class="btn primary" data-act="tf-fb" data-id="'+id+'"'+(r.busy?' disabled':'')+'>'+(r.busy?'Wird ausgewertet ...':'Rückmeldung holen')+'</button>'+(cases.length>1?'<button class="btn" data-act="tf-next" data-id="'+id+'">Anderer Fall</button>':'')+'</div>';
    if(r.err)h+='<p class="err" role="alert">'+esc(r.err)+'</p>';
    if(r.out&&r.i===i)h+=tfFbHtml(r.out);
    h+='</section>';
  }
  var G=u.G,qa=tf.quiz[id]||{};
  if(G.selbsttest&&G.selbsttest.length){
    h+='<section class="wks"><h4>Selbsttest</h4>'+G.selbsttest.map(function(t,k){var a=qa[k];return '<div class="tfquiz"><p><b>'+(k+1)+'. '+esc(t.f)+'</b></p><div class="tfopts">'+t.a.map(function(o,j){var cls=a==null?'':j===t.r?' ok':j===a?' no':'';return '<button class="chip'+cls+'" data-act="tf-quiz" data-id="'+id+'" data-i="'+k+'" data-a="'+j+'" aria-pressed="'+(a===j)+'"'+(a!=null?' disabled':'')+'>'+esc(o)+'</button>'}).join('')+'</div>'+(a!=null?'<p class="hint-t">'+(a===t.r?'Richtig. ':'Nicht ganz. ')+esc(t.e)+'</p>':'')+'</div>'}).join('');
    var done=G.selbsttest.every(function(t,k){return qa[k]!=null});
    if(done){var n=G.selbsttest.filter(function(t,k){return qa[k]===t.r}).length;h+='<p><b>Ergebnis: '+n+' von '+G.selbsttest.length+'</b></p><button class="btn small" data-act="tf-quiz-reset" data-id="'+id+'">Noch einmal</button>'}
    h+='</section>';
  }
  h+=wkSec('Bewertungskriterien',wkUl(G.kriterien),'');
  return h;
}
function tfFbHtml(o){
  var h='<div class="tffb"><div class="tfkrit">'+o.krit.map(function(k){return '<div><span>'+esc(k.k)+'</span>'+(k.n?'<b class="tfn n'+k.n+'">'+k.n+'/5</b>':'<b class="tfn">–</b>')+'<small>'+esc(k.t)+'</small></div>'}).join('')+'</div>';
  h+='<div class="nbp" style="margin-top:10px"><div class="nbr"><span><b>Was gut war</b><small>'+esc(o.gut)+'</small></span></div><div class="nbr"><span><b>Was du verbessern kannst</b><small>'+esc(o.besser)+'</small></span></div>'+(o.alt?'<div class="nbr"><span><b>Mögliche Formulierung</b><small style="font-size:14.5px;color:var(--ink)">'+esc(o.alt)+'</small></span></div>':'')+'</div>';
  return h+'<p class="hint-t">'+(o.src==='ki'?'Rückmeldung von Claude. Sie ist eine Einschätzung, keine geprüfte Bewertung.':'Einfache Regelprüfung auf deinem Gerät, keine KI. Sie erkennt nur Merkmale wie Rückfrage, Zurückmelden und Druckformulierungen, nicht die Qualität im Ganzen.')+'</p></div>';
}
function tfLocalFb(txt,u,c){
  var t=String(txt||''),L=t.toLowerCase(),base=exLocal(t,null);
  var q=/\?/.test(t),offen=/(^|[.!?]\s*)(was|wie|welche|wodurch|woran|wobei|wofür|wann)\b/i.test(t),zur=/(verstehe ich|richtig verstanden|sie sagen|ihnen ist|klingt|das heißt für sie|wenn ich sie)/.test(L),emp=/(verstehe|nachvollzieh|klingt|belast|schwer|sorge)/.test(L),pr=/(nur heute|unbedingt|müssen sie|sofort|letzte chance|sonst)/.test(L),fach=(t.match(/\b[a-zäöü]{16,}\b/gi)||[]).length,len=t.length,ein=/(einwand|teuer|preis|zeit|partner|überleg)/.test((c&&c.kunde||'').toLowerCase());
  function s(v){return Math.max(1,Math.min(5,v))}
  var k=[
    ['Verständlichkeit',s(len<20?2:len>500?2:fach>2?3:4),len>500?'Eher lang, kürzer wirkt klarer.':fach>2?'Mehrere lange Fachwörter, prüfe, ob der Kunde sie kennt.':'Kurz und gut lesbar.'],
    ['Zuhören',s(zur?4:2),zur?'Du meldest zurück, was du gehört hast.':'Es fehlt eine Rückmeldung, was du verstanden hast.'],
    ['Fragetechnik',s(offen?4:q?3:1),offen?'Offene Frage enthalten.':q?'Frage enthalten, eher geschlossen.':'Keine Frage an den Kunden.'],
    ['Gesprächsstruktur',s(zur&&q?4:3),zur&&q?'Erst zurückmelden, dann fragen: gute Reihenfolge.':'Ordne: zurückmelden, nachfragen, dann erst informieren.'],
    ['Empathie',s(emp?4:2),emp?'Gefühl oder Sorge wird aufgenommen.':'Kein Bezug auf das Erleben des Kunden.'],
    ['Umgang mit Einwänden',ein?s(pr?1:q?4:2):0,!ein?'In diesem Fall nicht im Vordergrund.':pr?'Druckformulierung erkannt.':q?'Du fragst nach, statt zu argumentieren.':'Erst nachfragen, dann argumentieren.'],
    ['Klarheit',s(len>40&&len<400?4:3),'Grobe Einschätzung nach Länge.'],
    ['Kundenorientierung',s(pr?1:(zur||offen)?4:3),pr?'Druck widerspricht Kundenorientierung.':'Bezug auf den Kunden erkennbar.']
  ].map(function(x){return {k:x[0],n:x[1],t:x[2]}});
  return {krit:k,gut:base.gut,besser:base.besser,alt:'',src:'lokal'};
}
function tfFeedback(id){
  var u=TIEF_IDX[id],r=tf.res[id]||(tf.res[id]={});if(!u||r.busy)return;
  var i=tf.ueI[id]||0,c=(u.uebung||[])[i],a=(tf.ue[id+':'+i]||'').trim();r.err='';
  if(!a){r.err='Bitte zuerst eine Antwort eintragen.';render();return}
  var e=checkText(a);if(e){r.err=e;render();return}
  r.busy=true;r.out=null;r.i=i;render();
  function fertig(o){r.busy=false;r.out=o;r.i=i;var ls=tfLs();ls.uebungen[id]=(ls.uebungen[id]||0)+1;save();render()}
  getSample(function(sample){
    if(!sample){fertig(tfLocalFb(a,u,c));return}
    var pr='Du bist Gesprächstrainer für einen Versicherungsberater in Deutschland. Lerneinheit: '+u.titel+'. Kernpunkte der Einheit: '+u.schnell.kern.join(' ')+'\nSituation: '+c.sit+'\nKunde sagt: „'+c.kunde+'“\nAufgabe: '+c.ziel+'\nAntwort des Beraters: „'+a+'“\n\nBewerte fair und konkret auf einer Skala von 1 bis 5 diese acht Kriterien: '+TF_KRIT.join(', ')+'. Wenn ein Kriterium in dieser Situation nicht relevant ist, gib 0. Empfiehl keine manipulativen Methoden, keinen Druck. Behaupte keine Studien. Antworte NUR als JSON: {"krit":[{"k":"Kriterium","n":Zahl,"t":"ein kurzer Satz"}],"gut":"1 bis 2 Sätze","besser":"1 bis 2 Sätze","alt":"eine bessere Formulierung in 2 bis 3 Sätzen"}';
    sample.json(pr,{modelTier:'quick',cache:false}).then(function(o){
      var kr=Array.isArray(o&&o.krit)?o.krit:[];
      var krit=TF_KRIT.map(function(n){var f=kr.filter(function(x){return x&&String(x.k||'').toLowerCase()===n.toLowerCase()})[0]||{};var v=Math.round(Number(f.n));return {k:n,n:v>=1&&v<=5?v:0,t:String(f.t||'').slice(0,240)}});
      if(!krit.some(function(k){return k.n})){fertig(tfLocalFb(a,u,c));return}
      fertig({krit:krit,gut:String(o.gut||'').slice(0,400),besser:String(o.besser||'').slice(0,500),alt:String(o.alt||'').slice(0,600),src:'ki'});
    },function(er){var o=tfLocalFb(a,u,c);fertig(o);r.err=chErr(er)+' Ersatzweise einfache Regelprüfung.';render()});
  });
}

/* Vertiefungsfragen */
function tfVqHtml(u){
  var v=tf.vq[u.id]||{},h='<section class="wks tfvq"><h4>Vertiefungsfragen</h4><div class="plbar">'+TF_VQ.map(function(q,i){return '<button class="chip" data-act="tf-vq" data-id="'+u.id+'" data-i="'+i+'"'+(v.busy?' disabled':'')+'>'+esc(q)+'</button>'}).join('')+'</div>';
  if(v.busy)h+='<p class="hint-t">Antwort wird erstellt ...</p>';
  if(v.ans)h+='<div class="wkans"><div class="wkansh"><b>'+esc(v.frage)+'</b><span>'+(v.src==='ki'?'Claude, auf Grundlage dieser Einheit':'Aus dieser Einheit, keine KI')+'</span></div><div>'+(v.src==='ki'?chFmt(v.ans):v.ans)+'</div>'+(v.src==='ki'?'<p class="hint-t">KI-Antwort, nicht fachlich geprüft. Quellenangaben nur übernehmen, wenn sie im Quellenverzeichnis dieser Einheit stehen.</p>':'')+'</div>';
  return h+'</section>';
}
function tfVqLokal(u,i){
  if(i===0)return tfP(u.B.text)+'<p><b>Alternative Erklärung:</b> '+esc(u.B.alternativ)+'</p>';
  if(i===1)return '<ul class="tfaus">'+u.C.aussagen.map(function(a){return '<li>'+tfBadge(a.s)+' <p>'+esc(a.t)+tfCite(a.q)+'</p></li>'}).join('')+'</ul>';
  if(i===2)return '<p>'+esc(u.C.widerspruch)+'</p>'+wkUl(u.F.missverstaendnisse)+'<p>'+esc(u.F.nichtAbleiten)+'</p>';
  if(i===3)return '<p>'+esc(u.E.gut)+'</p><p>'+esc(u.E.finanz)+'</p><p>'+esc(u.E.allgemein)+'</p>'+(u.sammlung?u.sammlung.slice(0,2).map(function(s){return '<p>„'+esc(s[0])+'“ → '+esc(s[3])+'</p>'}).join(''):'')+'<p class="hint-t">Weitere neue Beispiele kann nur die KI formulieren. Hier stehen die Beispiele aus der Einheit.</p>';
  if(i===4)return '<p>'+esc(u.E.finanz)+'</p>'+wkOl(u.D.schritte);
  return '';
}
function tfVq(id,i){
  var u=TIEF_IDX[id],v=tf.vq[id]||(tf.vq[id]={});if(!u||v.busy)return;
  if(i===5){tf.mode[id]='ueben';tf.vq[id]={};render();return}
  var frage=TF_VQ[i];v.frage=frage;v.ans=null;v.busy=true;render();
  function lokal(){v.busy=false;v.src='lokal';v.ans=tfVqLokal(u,i);render()}
  getSample(function(sample){
    if(!sample){lokal();return}
    var ctx='EINHEIT: '+u.titel+'\nDEFINITION: '+u.A.def+'\nTHEORIE: '+u.A.theorie+'\nMECHANISMEN: '+u.B.text.join(' ')+'\nEVIDENZ:\n'+u.C.aussagen.map(function(a){return '- ['+a.s+', '+a.art+'] '+a.t+(a.q.length?' ('+a.q.map(aqKurz).join('; ')+')':'')}).join('\n')+'\nWIDERSPRÜCHE: '+u.C.widerspruch+'\nÜBERTRAGBARKEIT: '+u.C.transfer+'\nPRAXIS: '+u.D.schritte.join(' | ')+'\nGRENZEN: '+u.F.nicht.join(' | ')+' | '+u.F.nichtAbleiten+'\nBEISPIEL FINANZ: '+u.E.finanz+'\nQUELLEN DIESER EINHEIT:\n'+(u.q||[]).map(function(k){return '- '+aqFmt(k)+' Ergebnis: '+AQ[k].erg+' Grenzen: '+AQ[k].grenz}).join('\n');
    var pr='Du bist Trainer in einer Vertriebs- und Beratungsakademie für einen Versicherungsberater in Deutschland. Beantworte die Frage zur unten stehenden Lerneinheit auf Deutsch, klar und ehrlich. Regeln: Nenne nur Studien und Quellen, die im Abschnitt QUELLEN DIESER EINHEIT stehen, und erfinde keine Autoren, Jahre, Zahlen, Effektstärken oder Links. Wenn die Quellen eine Frage nicht beantworten, sage das offen. Unterscheide Zusammenhang und Ursache, Labor und Praxis. Beispiele sind fiktiv, ohne Namen, ohne konkrete Tarifdaten oder Leistungsbeträge. Keine manipulativen Methoden. Gliedere mit fetten Zwischenüberschriften.\n\n'+ctx.slice(0,9000)+'\n\nFRAGE: '+frage;
    sample([{role:'user',content:pr}],{cache:false,modelTier:'default'}).then(function(res){v.busy=false;v.src='ki';v.ans=String(res&&res.text||'');if(!v.ans){lokal();return}render()},function(er){lokal();toast(chErr(er))});
  });
}

/* Quellenverzeichnis */
function tfQuellen(){
  var typen={};Object.keys(AQ).forEach(function(k){typen[AQ[k].typ]=1});
  var f=tf.qf,s=(tf.sq||'').toLowerCase(),keys=Object.keys(AQ).filter(function(k){var q=AQ[k];return (!f||q.typ===f)&&(!s||(q.a+' '+q.t+' '+q.erg).toLowerCase().indexOf(s)>=0)}).sort(function(a,b){return AQ[a].a.localeCompare(AQ[b].a)});
  var h='<div class="plbar"><button class="linkbtn" data-act="wk-home">← Akademie</button></div><h2 class="wkt">Quellenverzeichnis</h2>';
  h+='<p class="hint-t">'+Object.keys(AQ).length+' Quellen, geprüft am '+esc(AQ_STAND)+'. '+esc(AQ_PRUEFART)+'</p>'+tfLegend();
  h+='<div class="wksearch"><label for="tf-sq" class="sr">Quellen durchsuchen</label><input id="tf-sq" type="search" data-tf="sq" placeholder="Autor, Titel oder Ergebnis" value="'+esc(tf.sq)+'"></div>';
  h+='<div class="plbar"><button class="chip" data-act="tf-qf" data-id="" aria-pressed="'+(!f)+'">Alle</button>'+Object.keys(typen).sort().map(function(t){return '<button class="chip" data-act="tf-qf" data-id="'+esc(t)+'" aria-pressed="'+(f===t)+'">'+esc(t)+'</button>'}).join('')+'</div>';
  h+='<div id="tf-ql"><p class="hint-t">'+keys.length+' Treffer</p><ol class="tfq">'+keys.map(function(k){
    var used=TIEF.filter(function(u){return (u.q||[]).indexOf(k)>=0});
    return tfSrcLi(k).replace(/<\/li>$/,'')+(used.length?'<div class="tfused">Verwendet in: '+used.map(function(u){return '<button class="linkbtn" data-act="wk-unit" data-id="'+u.id+'">'+esc(u.titel)+'</button>'}).join(', ')+'</div>':'')+'</li>';
  }).join('')+'</ol></div>';
  return h;
}

function tfAct(act,btn){
  var id=btn.dataset.id;
  switch(act){
    case 'tf-mode':tf.mode[id]=btn.dataset.m;render();break;
    case 'tf-read':{var ls=tfLs();if(ls.gelesen[id])delete ls.gelesen[id];else ls.gelesen[id]=todayIso();save();render();break}
    case 'tf-quiz':{var u=TIEF_IDX[id],i=+btn.dataset.i,a=+btn.dataset.a,qa=tf.quiz[id]||(tf.quiz[id]={});if(qa[i]!=null)break;qa[i]=a;
      var T=u.G.selbsttest;if(T.every(function(t,k){return qa[k]!=null})){var ls2=tfLs();ls2.tests[id]={r:T.filter(function(t,k){return qa[k]===t.r}).length,n:T.length,d:todayIso()};save()}render();break}
    case 'tf-quiz-reset':tf.quiz[id]={};render();break;
    case 'tf-fb':tfFeedback(id);break;
    case 'tf-next':{var n=(TIEF_IDX[id].uebung||[]).length;tf.ueI[id]=((tf.ueI[id]||0)+1)%Math.max(n,1);tf.res[id]={};render();break}
    case 'tf-vq':tfVq(id,+btn.dataset.i);break;
    case 'tf-quellen':wk.mode='akad';wk.unit='';wk.cat='Q';tab='akademie';render();window.scrollTo(0,0);break;
    case 'tf-qf':tf.qf=id||'';render();break;
    case 'tf-src':wk.mode='akad';wk.unit='';wk.cat='Q';tf.qf='';tf.sq='';tab='akademie';render();setTimeout(function(){var el=document.getElementById('aq-'+id);if(el){el.scrollIntoView({block:'center'});el.classList.add('tfhi');var d=el.querySelector('details');if(d)d.open=true}},30);break;
  }
}
function tfInput(t){
  var d=t.dataset;
  if(d.tf==='ue'){tf.ue[d.id+':'+(tf.ueI[d.id]||0)]=t.value;return}
  if(d.tf==='sq'){tf.sq=t.value;var el=$('tf-ql');if(el){var tmp=document.createElement('div');tmp.innerHTML=tfQuellen();var n=tmp.querySelector('#tf-ql');if(n)el.innerHTML=n.innerHTML}}
}
