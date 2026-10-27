/* ================= Persönlicher Überblick: vom Anliegen zu den Zusammenhängen ================= */
/* Zeigt wenige, begründete Lebensbereiche, die mit dem Anliegen zusammenhängen KÖNNEN.
   Ein Bereich ist zunächst nur ein möglicher Gesprächsansatz. Erst nach der Erklärung entscheidet
   der Kunde: jetzt besprechen, später, oder heute nicht vertiefen. Nichts wird als Lücke markiert. */
IC.home=IC.home||'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>';
IC.bank=IC.bank||'<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>';
IC.wallet=IC.wallet||'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>';
IC.sun=IC.sun||'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
IC.heart=IC.heart||'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>';
IC.trend=IC.trend||'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>';
IC.bulb=IC.bulb||'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>';
var FELDER={
 zuhause:{t:'Mein Zuhause rundum schützen',ic:'home',thema:'sach',
  nutzen:'Neben dem Gebäude gehören die Einrichtung, Gefahren wie Starkregen und die Haftung als Eigentümer zum Schutz des Zuhauses.',
  bezug:'Das Zuhause ist meist der größte Sachwert. Entscheidend ist, ob die Absicherung zum heutigen Wert und zum Wohnort passt.',
  frage:'Welche Gefahren gibt es an Ihrem Wohnort, und wann wurde der Wert Ihres Hausrats zuletzt angesehen?',fehlt:['Wohnfläche und Ausstattung','Gefahren am Wohnort, etwa Starkregen','bestehende Verträge']},
 finanzierung:{t:'Meine Finanzierung absichern',ic:'bank',thema:'arbeit',
  nutzen:'Wenn ein großer Teil des Einkommens für die Finanzierung gebraucht wird, kann ein längerer Einkommensausfall auch die Finanzierung belasten.',
  bezug:'Laufende Raten hängen am Einkommen, unabhängig davon, wie es einem gesundheitlich geht.',
  frage:'Wie gut könnten Sie Ihre laufende Finanzierung weiter bedienen, wenn Ihr Einkommen für längere Zeit deutlich sinken würde?',fehlt:['Höhe der monatlichen Rate','wer zum Haushaltseinkommen beiträgt','bestehende Absicherungen']},
 familie:{t:'Meine Familie berücksichtigen',ic:'family',thema:'familie',
  nutzen:'Wenn andere vom eigenen Einkommen leben, stellt sich die Frage, wie es für sie weitergeht, wenn man selbst ausfällt.',
  bezug:'Viele Entscheidungen betreffen nicht nur den Kunden selbst, sondern auch Partner und Kinder.',
  frage:'Was müsste für Ihre Familie weiterlaufen, wenn Ihnen etwas zustößt?',fehlt:['wer finanziell abhängig ist und wie lange','gesetzliche und bestehende Leistungen für Hinterbliebene']},
 reserven:{t:'Größere Ausgaben einplanen',ic:'wallet',thema:'anlage',
  nutzen:'Reparaturen, Modernisierungen oder ein neues Auto kommen oft nicht planbar. Eine Rücklage verschafft Spielraum.',
  bezug:'Auch gut abgesicherte Haushalte tragen Selbstbeteiligungen und Kosten, die keine Versicherung übernimmt.',
  frage:'Wie würden Sie heute eine größere, unerwartete Ausgabe bezahlen?',fehlt:['vorhandene Rücklagen','geplante größere Ausgaben']},
 einkommen:{t:'Mein Einkommen absichern',ic:'briefcase',thema:'arbeit',
  nutzen:'Das Einkommen finanziert den Alltag und die Pläne. Wichtig ist, was weiterläuft, wenn man länger nicht arbeiten kann.',
  bezug:'Fast alle Pläne setzen voraus, dass das Einkommen weiter fließt.',
  frage:'Wie lange könnten Sie Ihre laufenden Ausgaben tragen, wenn Ihr Einkommen deutlich sinkt?',fehlt:['Netto-Einkommen und feste Ausgaben','Angaben aus der Renteninformation zur Erwerbsminderung','bestehende Absicherungen']},
 ruhestand:{t:'Meinen Ruhestand planen',ic:'sun',thema:'alter',
  nutzen:'Die gesetzliche Rente deckt meist nur einen Teil des heutigen Einkommens. Je früher man plant, desto mehr Spielraum bleibt.',
  bezug:'Was heute entschieden wird, wirkt oft bis in den Ruhestand.',
  frage:'Wie möchten Sie im Ruhestand leben, und wissen Sie schon, was Ihre Rente dafür hergibt?',fehlt:['Renteninformation','gewünschtes Einkommen im Ruhestand']},
 gesundheit:{t:'Gesundheit und Wahlmöglichkeiten',ic:'heart',thema:'zusatz',
  nutzen:'Bei bestimmten Gesundheitsleistungen können Eigenanteile entstehen. Entscheidend ist, welche Leistungen Ihnen wichtig sind und welche Kosten Sie selbst tragen möchten.',
  bezug:'Gesundheit betrifft alle Lebensphasen, die eigenen Prioritäten sind dabei sehr verschieden.',
  frage:'Bei welchen Gesundheitsleistungen wären Ihnen zusätzliche Leistungen oder mehr Wahlmöglichkeiten besonders wichtig?',fehlt:['heutige Krankenversicherung','eigene Prioritäten, etwa Zahn, Brille, Krankenhaus']},
 pflege:{t:'Für den Pflegefall vorsorgen',ic:'users',thema:'pflege',
  nutzen:'Die Pflegeversicherung zahlt feste Beträge. Was darüber hinausgeht, kommt aus Rente und Vermögen.',
  bezug:'Pflege betrifft Einkommen, Vermögen und die Familie gleichermaßen.',
  frage:'Was wäre Ihnen wichtig, wenn Sie einmal Hilfe im Alltag bräuchten?',fehlt:['Rente oder Einkommen im Alter','Wünsche zur Pflegeform','wer helfen könnte']},
 vollmacht:{t:'Entscheidungen im Ernstfall regeln',ic:'doc',thema:'vorsorge',
  nutzen:'Wenn man selbst nicht entscheiden kann, braucht jemand eine Vollmacht. Ehepartner dürfen sich ohne Vollmacht nur eingeschränkt vertreten.',
  bezug:'Ohne Vollmacht kann im Ernstfall niemand ohne Weiteres für Konten, Verträge oder Behandlungen entscheiden.',
  frage:'Wer soll für Sie entscheiden, wenn Sie es einmal nicht selbst können, und weiß diese Person davon?',fehlt:['vorhandene Vollmachten und Verfügungen','Vertrauensperson']},
 vermoegen:{t:'Vermögen aufbauen und weitergeben',ic:'trend',thema:'anlage',
  nutzen:'Geld, das länger nicht gebraucht wird, kann für ein Ziel arbeiten. Welche Anlage passt, hängt von Ziel, Zeit und Risikobereitschaft ab.',
  bezug:'Ziele lassen sich leichter erreichen, wenn klar ist, wofür und bis wann Geld gebraucht wird.',
  frage:'Wofür möchten Sie in den nächsten Jahren Geld zurücklegen?',fehlt:['Ziel und Zeitraum','Umgang mit Schwankungen']},
 unfall:{t:'Folgen eines Unfalls',ic:'bandage',thema:'unfall',
  nutzen:'Die gesetzliche Unfallversicherung gilt bei der Arbeit und auf dem Arbeitsweg, nicht in der Freizeit.',
  bezug:'Ein schwerer Unfall kann Wohnung, Mobilität und Einkommen zugleich verändern.',
  frage:'Was würde sich in Ihrem Alltag ändern, wenn Sie nach einem Unfall dauerhaft eingeschränkt wären?',fehlt:['Hobbys und Alltag','bestehende Absicherungen']}
};
var ANL_UEB={
 sach:{titel:'Mein Zuhause und meine finanzielle Sicherheit',mitte:'Mein Zuhause',felder:['zuhause','finanzierung','familie','reserven','unfall']},
 alter:{titel:'Mein Ruhestand und was ihn trägt',mitte:'Mein Ruhestand',felder:['einkommen','pflege','vermoegen','familie','vollmacht']},
 arbeit:{titel:'Mein Einkommen und was davon abhängt',mitte:'Mein Einkommen',felder:['familie','finanzierung','ruhestand','unfall']},
 pflege:{titel:'Selbstbestimmt älter werden',mitte:'Pflege und Selbstbestimmung',felder:['vollmacht','familie','ruhestand','gesundheit']},
 familie:{titel:'Meine Familie und ihre Sicherheit',mitte:'Meine Familie',felder:['einkommen','finanzierung','vollmacht','reserven']},
 kranken:{titel:'Meine Gesundheit und meine Wahlmöglichkeiten',mitte:'Meine Gesundheit',felder:['gesundheit','pflege','einkommen','unfall']},
 zusatz:{titel:'Meine Gesundheit und meine Wahlmöglichkeiten',mitte:'Meine Gesundheit',felder:['pflege','einkommen','unfall']},
 unfall:{titel:'Was nach einem Unfall zählt',mitte:'Unfallfolgen',felder:['einkommen','familie','reserven','zuhause']},
 anlage:{titel:'Mein Vermögen und meine Ziele',mitte:'Mein Vermögen',felder:['ruhestand','reserven','vollmacht','familie']},
 vorsorge:{titel:'Für den Ernstfall vorgesorgt',mitte:'Vorsorge für den Ernstfall',felder:['pflege','familie','vermoegen','ruhestand']},
 check:{titel:'Mein persönlicher Überblick',mitte:'Meine Situation',felder:['einkommen','familie','ruhestand','zuhause','pflege','vollmacht','gesundheit']}
};
ANL_UEB.individuell=ANL_UEB.check;
var BEZUG={
 'sach:finanzierung':'Haus und Finanzierung gehören zusammen: Die Rate läuft weiter, auch wenn sich das Einkommen ändert.',
 'sach:familie':'Das Zuhause ist meist auch der Ort der Familie. Wichtig ist, ob alle darin wohnen bleiben könnten, wenn einem etwas zustößt.',
 'sach:reserven':'Ein Haus braucht laufend Pflege. Reparaturen und Selbstbeteiligungen kommen nicht planbar.',
 'sach:zuhause':'Neben dem Gebäude gehören die Einrichtung, Elementargefahren und die Haftung als Eigentümer zum Schutz des Zuhauses.',
 'alter:einkommen':'Wer für den Ruhestand spart, braucht dafür bis dahin ein laufendes Einkommen.',
 'alter:pflege':'Im Ruhestand stellt sich oft auch die Frage, was im Pflegefall aus Rente und Vermögen bezahlt werden müsste.',
 'pflege:vollmacht':'Im Pflegefall muss oft jemand anderes für den Kunden handeln dürfen.',
 'arbeit:finanzierung':'Ein Einkommensausfall trifft zuerst die festen Verpflichtungen, etwa eine Finanzierung.',
 'familie:einkommen':'Das Einkommen ist meist die Grundlage für den Alltag der Familie.'
};
var AENDERUNG=[['haus','Hauskauf, Bau oder Umzug'],['heirat','Heirat oder Partnerschaft'],['kind','Kind'],['job','Jobwechsel oder Selbstständigkeit'],['ruhestand','Ruhestand rückt näher'],['eltern','Pflegefall in der Familie'],['erbe','Erbe oder Schenkung']];
var FSTATUS=[['offen','noch nicht betrachtet'],['erkannt','möglicher Zusammenhang'],['angesprochen','mit dem Kunden angesprochen'],['bestaetigt','Bedarf gemeinsam bestätigt'],['spaeter','später besprechen'],['nein','heute nicht vertiefen']];
var FSTATUS_K={erkannt:'Möglicher Zusammenhang',angesprochen:'Angesprochen',bestaetigt:'Gemeinsam bestätigt',spaeter:'Für später vorgemerkt',nein:'Heute nicht vertieft'};
function anlassObj(){if(!cur.anlass)cur.anlass={wichtig:'',aenderung:[],fragen:''};return cur.anlass}
function felderObj(){if(!cur.felder)cur.felder={};return cur.felder}
/* Bewertet die Bereiche nur aus erfassten Angaben. Gründe werden wörtlich angezeigt. */
function feldKandidaten(){
  var def=ANL_UEB[cur.anliegen]||ANL_UEB.check,kd=adv.kd||{},A=anlassObj().aenderung||[],ae=function(x){return A.indexOf(x)>=0};
  var kinder=parseInt(kd.kinder,10)||0,alter=parseInt(kd.alter,10)||0,partner=/verheiratet|Partnerschaft/.test(kd.fam||''),eig=kd.wohnen==='Eigentum',miete=kd.wohnen==='Miete',g=kd.gruppe;
  return def.felder.map(function(k,i){
    var s=10-i,gr=[],aus=false;
    function plus(n,t){s+=n;if(t&&gr.indexOf(t)<0)gr.push(t)}
    if(k==='finanzierung'){if(miete)aus=true;if(eig)plus(3,'Sie wohnen im eigenen Haus oder in der eigenen Wohnung.');if(ae('haus'))plus(4,'Sie haben kürzlich gekauft, gebaut oder sind umgezogen.');if(g==='rentner')s-=3}
    if(k==='zuhause'){if(eig)plus(2,'Sie wohnen im eigenen Haus oder in der eigenen Wohnung.');if(ae('haus'))plus(3,'Sie haben kürzlich gekauft, gebaut oder sind umgezogen.')}
    if(k==='reserven'){if(ae('haus'))plus(2,'Sie haben kürzlich gekauft, gebaut oder sind umgezogen.');if(eig)plus(1)}
    if(k==='familie'){if(kinder>0)plus(3,'In Ihrem Haushalt leben Kinder.');if(partner)plus(2,'Sie leben in einer Ehe oder Partnerschaft.');if(ae('kind'))plus(4,'Sie haben Nachwuchs bekommen oder erwarten ein Kind.');if(ae('heirat'))plus(3,'Sie haben geheiratet oder leben jetzt in einer Partnerschaft.');if(!kinder&&!partner&&kd.fam)s-=3}
    if(k==='einkommen'){if(g==='rentner')aus=true;if(/selbst/.test(kd.beruf||''))plus(2,'Sie sind selbstständig tätig.');if(ae('job'))plus(3,'Sie haben den Job gewechselt oder sich selbstständig gemacht.');if(g==='einsteiger')plus(3,'Sie stehen am Anfang des Berufslebens.')}
    if(k==='ruhestand'){if(g==='rentner')aus=true;if(alter>=50&&alter<67)plus(2,'Bis zur Regelaltersgrenze sind es noch etwa '+(67-alter)+' Jahre.');if(ae('ruhestand'))plus(4,'Der Ruhestand rückt näher.');if(ae('job'))plus(1)}
    if(k==='pflege'){if(g==='einsteiger')aus=true;if(g==='rentner')plus(3,'Sie sind im Ruhestand.');if(ae('eltern'))plus(4,'In Ihrer Familie gibt es einen Pflegefall.');if(alter>=55)plus(1)}
    if(k==='vollmacht'){if(g==='einsteiger')s-=3;if(g==='rentner')plus(2,'Sie sind im Ruhestand.');if(ae('eltern'))plus(3,'In Ihrer Familie gibt es einen Pflegefall.');if(ae('heirat'))plus(1);if(ae('erbe'))plus(2,'Sie haben geerbt oder planen eine Schenkung.')}
    if(k==='vermoegen'){if(ae('erbe'))plus(4,'Sie haben geerbt oder planen eine Schenkung.');if(ae('ruhestand'))plus(1)}
    if(k==='gesundheit'&&g==='rentner')plus(1);
    return {k:k,f:FELDER[k],s:s,gr:gr,aus:aus,bezug:BEZUG[cur.anliegen+':'+k]||FELDER[k].bezug};
  }).filter(function(x){return !x.aus}).sort(function(a,b){return b.s-a.s});
}
function feldStatus(k){
  var F=felderObj()[k],st=F?F.status:'offen',th=FELDER[k].thema;
  if((st==='angesprochen'||st==='erkannt')&&cur.themen[th]&&cur.bedarf[th]==='bestaetigt')return 'bestaetigt';
  return st||'offen';
}
function feldIstBesprochen(k){return cur.themen[FELDER[k].thema]&&felderObj()[k]&&felderObj()[k].jetzt}
var uebOffen='',uebAdd=false;
function ueberblickHtml(st){
  var km=kmode(),def=ANL_UEB[cur.anliegen]||ANL_UEB.check,K=feldKandidaten(),F=felderObj(),kd=adv.kd||{};
  var haupt=K.slice(0,4),mehr=K.slice(4);
  K.forEach(function(x){if(!F[x.k])F[x.k]={status:'erkannt',ts:Date.now()}});
  var offen=haupt.filter(function(x){var s=feldStatus(x.k);return s==='erkannt'||s==='angesprochen'}),geklaert=K.filter(function(x){var s=feldStatus(x.k);return s==='bestaetigt'||s==='spaeter'||s==='nein'||(F[x.k]&&F[x.k].jetzt)});
  offen=offen.filter(function(x){return !(F[x.k]&&F[x.k].jetzt)});
  var anz=haupt.filter(function(x){return feldStatus(x.k)!=='erkannt'}).length;
  var lage=[];if(kd.gruppe&&GR[kd.gruppe])lage.push(GR[kd.gruppe].name);if(kd.alter)lage.push(kd.alter+' Jahre');if(kd.fam)lage.push(kd.fam);if(parseInt(kd.kinder,10))lage.push(kd.kinder+(kd.kinder==='1'?' Kind':' Kinder'));if(kd.wohnen)lage.push(kd.wohnen);
  (anlassObj().aenderung||[]).forEach(function(a){lage.push(pfLbl(AENDERUNG,a))});
  var name=cur.anliegen==='individuell'&&cur.anliegenText?cur.anliegenText.slice(0,60):def.mitte;
  var h='<header class="ueb-h"><p class="eyebrow">Ihr persönlicher Überblick</p><h2>'+esc(def.titel)+'</h2><p class="lead">Ausgangspunkt ist Ihr Anliegen. Daneben stehen wenige Bereiche, die damit zusammenhängen können. Ob und wann wir darüber sprechen, entscheiden Sie.</p></header>';
  h+='<div class="ueb"><section class="ueb-anchor" aria-label="Ihr Anliegen"><div class="ueb-ill" aria-hidden="true">'+themaIll(cur.anliegen||'individuell')+'</div><div class="ueb-ab"><p class="eyebrow">Ihr Anliegen</p><h3>'+esc(name)+'</h3>'+(cur.anliegenText?'<p class="ueb-q">„'+esc(cur.anliegenText)+'“</p>':'<p class="muted">'+esc(cur.anliegen?themaName(cur.anliegen):'Noch kein Anliegen gewählt')+'</p>')+
    (lage.length?'<div class="ueb-lage"><span class="eyebrow">Ihre Situation</span><ul>'+lage.map(function(l){return '<li>'+esc(l)+'</li>'}).join('')+'</ul></div>':'<p class="fine-s">Mit Angaben zur Lebenssituation werden die Zusammenhänge genauer.</p>')+
    '<button class="btn primary block" data-act="bs-fokus">'+ico('arrow',18)+'Mit dem Anliegen weitermachen</button></div></section>';
  h+='<section class="ueb-felder" aria-label="Mögliche Zusammenhänge"><div class="ueb-fh"><h3>Was damit zusammenhängen kann</h3><span class="ueb-prog"><span class="bar"><i style="width:'+(haupt.length?Math.round(anz/haupt.length*100):0)+'%"></i></span>'+anz+' von '+haupt.length+' angesprochen</span></div>';
  h+=offen.length?'<ol class="fcards">'+offen.map(function(x){return feldKarte(x,haupt.indexOf(x)+1)}).join('')+'</ol>':'<div class="empty-s"><p>Alle Bereiche sind geklärt. Unten sehen Sie, was vereinbart ist.</p></div>';
  if(mehr.length&&!km)h+='<details class="adv"><summary>Weitere mögliche Zusammenhänge ('+mehr.filter(function(x){return feldStatus(x.k)==='erkannt'}).length+')</summary><ol class="fcards">'+mehr.filter(function(x){return feldStatus(x.k)==='erkannt'||feldStatus(x.k)==='angesprochen'}).map(function(x){return feldKarte(x,0)}).join('')+'</ol></details>';
  h+='</section></div>';
  if(geklaert.length)h+='<section class="ueb-done"><h3>Bereits geklärt</h3><ul>'+geklaert.map(function(x){var s=F[x.k]&&F[x.k].jetzt&&feldStatus(x.k)!=='bestaetigt'?'jetzt':feldStatus(x.k),wv=F[x.k]&&F[x.k].wv?db.todos.find(function(t){return t.id===F[x.k].wv}):null;
    return '<li><span class="fd-ic" aria-hidden="true">'+ico(x.f.ic,18)+'</span><span class="fd-t"><b>'+esc(x.f.t)+'</b>'+(wv?'<small>Wiedervorlage am '+esc(fmtFull(wv.due))+'</small>':'')+'</span><span class="stat-pill s-'+({jetzt:'info',bestaetigt:'ok',spaeter:'warn',nein:'muted'})[s]+'">'+(s==='jetzt'?'Wird heute besprochen':FSTATUS_K[s])+'</span>'+
      (s==='spaeter'&&!wv&&!km?'<span class="fd-wv">Wiedervorlage vereinbart? '+[[1,'in 1 Monat'],[3,'in 3 Monaten'],[6,'in 6 Monaten']].map(function(m){return '<button class="lnk" data-act="bs-fwv" data-k="'+x.k+'" data-m="'+m[0]+'">'+m[1]+'</button>'}).join('')+'</span>':'')+
      (wv&&!km?'<button class="lnk" data-act="bs-fwv-del" data-k="'+x.k+'">Wiedervorlage entfernen</button>':'')+
      '<button class="lnk" data-act="bs-feld" data-k="'+x.k+'" data-s="erkannt">Ändern</button></li>'}).join('')+'</ul></section>';
  var nochOffen=offen.length>0;
  h+='<div class="ueb-stay"><p>'+(nochOffen?'Wir können heute gerne bei '+esc(cur.anliegen?themaName(cur.anliegen):'Ihrem Anliegen')+' bleiben. Wenn Sie möchten, sehen wir uns einen der anderen Punkte bei einem späteren Termin an.':'Die Themen für heute stehen fest.')+'</p><button class="btn" data-act="bs-fokus">'+(nochOffen?'Beim Anliegen bleiben':'Weiter zur Beratung')+'</button></div>';
  if(!km)h+='<details class="adv ueb-add"'+(uebAdd?' open':'')+'><summary>Thema direkt hinzufügen</summary><p class="hint-t">Für Folgetermine oder wenn der Kunde ein Thema selbst anspricht.</p><div class="tcards small">'+THEMEN.map(function(t){var on=!!cur.themen[t[0]];return '<button class="tcard'+(on?' on':'')+'" data-act="bs-thema" data-a="'+t[0]+'" aria-pressed="'+on+'"><span class="tc-ill">'+themaIll(t[0])+'</span><span class="tc-b"><strong>'+esc(t[1])+(t[0]===cur.anliegen?' <em class="anl-tag">Anliegen</em>':'')+'</strong><span>'+esc(t[2])+'</span></span><span class="tc-check" aria-hidden="true">'+(on?'✓':'')+'</span></button>'}).join('')+'</div></details>';
  return h;
}
function feldKarte(x,nr){
  var k=x.k,f=x.f,offen=uebOffen===k,s=feldStatus(k),km=kmode();
  var h='<li class="fcard'+(offen?' open':'')+'"><button class="fc-h" data-act="bs-fopen" data-k="'+k+'" aria-expanded="'+offen+'"><span class="fc-ic" aria-hidden="true">'+ico(f.ic,22)+'</span><span class="fc-t"><b>'+esc(f.t)+'</b><span>'+esc(f.nutzen)+'</span></span>'+(s==='angesprochen'?'<span class="stat-pill s-info">Angesprochen</span>':'')+'<span class="fc-chev" aria-hidden="true"></span></button>';
  if(offen){
    h+='<div class="fc-b"><dl class="fc-d"><div><dt>Zusammenhang mit Ihrem Anliegen</dt><dd>'+esc(x.bezug)+'</dd></div>'+
      '<div><dt>Aus Ihren Angaben</dt><dd>'+(x.gr.length?'<ul>'+x.gr.map(function(g){return '<li>'+esc(g)+'</li>'}).join('')+'</ul>':'Dazu liegen noch keine Angaben vor. Ob das für Sie zutrifft, klärt das Gespräch.')+'</dd></div>'+
      '<div><dt>Dafür wäre noch zu klären</dt><dd>'+esc(f.fehlt.join(', '))+'</dd></div></dl>'+
      '<blockquote class="fc-q"><span>Offene Frage</span>'+esc(f.frage)+'</blockquote>'+
      '<p class="fine-s">Ein möglicher Gesprächsansatz, kein festgestellter Bedarf und keine Empfehlung.</p>'+
      '<div class="fc-a">'+(s==='erkannt'&&!km?'<button class="btn small" data-act="bs-feld" data-k="'+k+'" data-s="angesprochen">Angesprochen</button>':'')+
      '<button class="btn small primary" data-act="bs-feld" data-k="'+k+'" data-s="jetzt">Jetzt besprechen</button><button class="btn small" data-act="bs-feld" data-k="'+k+'" data-s="spaeter">Später besprechen</button><button class="btn small" data-act="bs-feld" data-k="'+k+'" data-s="nein">Heute nicht vertiefen</button></div></div>';
  }
  return h+'</li>';
}
function feldSetzen(k,s){
  var F=felderObj(),e=F[k]||(F[k]={status:'erkannt',ts:Date.now()}),th=FELDER[k].thema;
  var war=e.jetzt;
  if(s==='jetzt'){e.status='angesprochen';e.jetzt=true;if(!cur.themen[th])cur.themen[th]={quelle:'zusammenhang',feld:k,ts:Date.now()}}
  else{
    e.status=s;e.jetzt=false;
    if(war&&cur.themen[th]&&cur.themen[th].quelle==='zusammenhang'&&cur.themen[th].feld===k&&th!==cur.anliegen)delete cur.themen[th];
    if(s==='erkannt'&&e.wv){db.todos=db.todos.filter(function(t){return t.id!==e.wv||t.done});e.wv=''}
  }
  e.ts=Date.now();
  if(s!=='angesprochen'&&s!=='erkannt')uebOffen='';
  syncMods();
}
function feldWv(k,mon){
  var e=felderObj()[k];if(!e)return;
  if(!cur.kunde){toast('Für eine Wiedervorlage bitte zuerst die Kundennummer eintragen (Schritt Anliegen).');return}
  var t={id:uid(),kunde:cur.kunde,text:('Später besprechen: '+FELDER[k].t).slice(0,140),due:addMonthsIso(todayIso(),Number(mon)),done:false,ts:Date.now(),wait:false};
  db.todos.push(t);e.wv=t.id;toast('Wiedervorlage am '+fmtFull(t.due)+' angelegt');
}
function felderGeklaert(s){var F=(s||cur).felder||{};return Object.keys(F).filter(function(k){return FELDER[k]&&F[k].status&&F[k].status!=='erkannt'&&F[k].status!=='offen'}).map(function(k){return {k:k,f:FELDER[k],e:F[k]}})}
function anlassForm(){
  var a=anlassObj();
  return '<div class="anlass"><h3>Kurz nachgefragt</h3>'+
    '<label class="fl"><span>Was möchte der Kunde heute klären?</span><textarea data-bs="anliegenText" maxlength="400" rows="2" placeholder="z. B. „Ich möchte meine Gebäudeversicherung überprüfen.“">'+esc(cur.anliegenText)+'</textarea></label>'+
    '<label class="fl"><span>Was ist ihm dabei besonders wichtig? <em class="opt">optional</em></span><input type="text" data-bs="anlass.wichtig" maxlength="160" value="'+esc(a.wichtig)+'" placeholder="z. B. dass auch Starkregen abgedeckt ist"></label>'+
    '<div class="ds-q" style="margin-top:14px"><span>Hat sich an der Lebenssituation etwas verändert? <em class="opt">optional, mehrere möglich</em></span><div class="lwc">'+AENDERUNG.map(function(o){var on=a.aenderung.indexOf(o[0])>=0;return '<button class="chip" data-act="bs-aend" data-k="'+o[0]+'" aria-pressed="'+on+'">'+esc(o[1])+'</button>'}).join('')+'</div></div>'+
    '<label class="fl"><span>Konkrete Fragen oder Unsicherheiten <em class="opt">optional</em></span><input type="text" data-bs="anlass.fragen" maxlength="200" value="'+esc(a.fragen)+'" placeholder="z. B. Ist der Wert des Hauses noch richtig versichert?"></label></div>';
}
function feldStatusVon(s,k){var F=(s.felder||{})[k],st=F?F.status:'offen',th=FELDER[k].thema;if((st==='angesprochen'||st==='erkannt')&&s.themen&&s.themen[th]&&(s.bedarf||{})[th]==='bestaetigt')return 'bestaetigt';return st||'offen'}
/* Zusammenfassung: nur Bereiche, über die tatsächlich gesprochen wurde. „Möglicher Zusammenhang“ erscheint nie. */
function felderErgebnis(km){
  var G=felderGeklaert();
  var h='<div class="ds-card"><div class="ds-cap">Weitere Lebensbereiche aus dem Überblick</div>';
  if(!G.length)return h+'<p class="muted">'+(cur.fokus==='anliegen'?'Wir sind heute beim Anliegen geblieben. Weitere Bereiche wurden nicht vertieft.':'Es wurden keine weiteren Bereiche angesprochen.')+'</p></div>';
  h+='<ul class="fd-list">'+G.map(function(x){var s=x.e.jetzt&&feldStatusVon(cur,x.k)!=='bestaetigt'?'jetzt':feldStatusVon(cur,x.k),wv=x.e.wv?db.todos.find(function(t){return t.id===x.e.wv}):null;
    return '<li><b>'+esc(x.f.t)+'</b><span class="stat-pill s-'+({jetzt:'info',angesprochen:'info',bestaetigt:'ok',spaeter:'warn',nein:'muted'})[s]+'">'+(s==='jetzt'?'Heute besprochen':FSTATUS_K[s])+'</span>'+(wv?'<small>Wiedervorlage am '+esc(fmtFull(wv.due))+'</small>':s==='spaeter'&&!km?'<small>Noch kein Termin vereinbart</small>':'')+'</li>'}).join('')+'</ul>';
  if(cur.fokus==='anliegen')h+='<p class="fine-s">Auf Wunsch des Kunden ist die Beratung heute beim Anliegen geblieben.</p>';
  return h+'</div>';
}
