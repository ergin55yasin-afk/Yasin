/* ================= Gesprächstraining: Szenarien, zwei Modi, Coaching-Hinweise, Feedback, Verlauf ================= */
/* Modus A „Freies Rollenspiel“: keine Hinweise. Modus B „Mit Coaching“: zu geeigneten Kundenaussagen erscheint
   eine Glühbirne. Der Hinweis wird separat erzeugt, kennt die Rolle des Kunden nicht und nimmt keine Reaktion vorweg.
   Das Feedback am Ende ist ein eigener Aufruf. Zitate werden gegen den echten Verlauf geprüft. */
/* Neues Szenario: Eintrag ergänzen. kunde = verdeckte Lage für die KI, lern = Trainingsschwerpunkt. */
var TR_SZEN=[
 {k:'erst',t:'Erstgespräch',d:'Der Kunde kommt zum ersten Mal, die Bank hat den Termin vermittelt.',lern:'Vertrauen aufbauen, Gesprächsrahmen klären, Anlass erfragen.',
  kunde:'Du bist 34, angestellt im Einzelhandel, ledig und wohnst zur Miete. Deine Bank hat dir den Termin vorgeschlagen, du weißt nicht genau, worum es gehen soll, und bist etwas abwartend.',
  start:'Sag kurz Hallo und dass dir die Bank den Termin empfohlen hat.'},
 {k:'bedarf',t:'Bedarfsermittlung',d:'Der Kunde möchte „mal alles durchgehen“, hat aber keinen Überblick.',lern:'Offene Fragen, Situation verstehen, Prioritäten des Kunden herausarbeiten.',
  kunde:'Du bist 41, verheiratet, ihr habt zwei Kinder (6 und 9). Du arbeitest angestellt als Techniker. Ihr wohnt seit drei Jahren im eigenen Reihenhaus, das noch finanziert wird. Du hast keinen Überblick über eure Verträge. Erzähle Einzelheiten nur, wenn der Berater gezielt danach fragt.',
  start:'Sag kurz Hallo und dass du gern mal alles durchgehen würdest.'},
 {k:'einwand',t:'Einwandbehandlung',d:'Der Kunde hat ein Angebot bekommen und hat Bedenken.',lern:'Einwände ernst nehmen, nachfragen, den eigentlichen Grund verstehen.',
  kunde:'Du bist 29, angestellt und ledig. Beim letzten Termin wurde dir eine Absicherung gegen Berufsunfähigkeit vorgestellt. Du hast Bedenken: Der Beitrag kommt dir hoch vor, du hast gehört, dass Versicherer oft nicht zahlen, und ein Kollege meint, so etwas brauche man nicht.',
  start:'Sag kurz Hallo und dass du über das Angebot nachgedacht hast, aber noch Zweifel hast.'},
 {k:'ganz',t:'Ganzheitliche Beratung',d:'Der Kunde kommt mit einem einzelnen Anliegen. Weitere Themen spricht er nicht von selbst an.',lern:'Beim Anliegen bleiben und trotzdem die Lebenssituation verstehen, Zusammenhänge ohne Druck ansprechen.',
  kunde:'Du bist 37, verheiratet, euer erstes Kind ist vor vier Monaten geboren. Ihr seid gerade in eine größere Mietwohnung gezogen, dein Partner ist in Elternzeit. Du kommst nur, weil du die Hausratversicherung an die neue Wohnung anpassen möchtest. Weitere Themen sprichst du nicht von dir aus an. Wenn der Berater interessiert nach deiner Lebenssituation fragt, erzählst du offen davon.',
  start:'Sag kurz Hallo und dass du wegen der Hausratversicherung für die neue Wohnung da bist.'},
 {k:'schwierig',t:'Schwieriges Gespräch',d:'Der Kunde ist verärgert über eine Beitragserhöhung.',lern:'Ruhig bleiben, zuhören, Ärger anerkennen, zur Sache zurückführen.',
  kunde:'Du bist 58 und selbstständiger Handwerker. Du bist verärgert, weil der Beitrag deiner Wohngebäudeversicherung gestiegen ist und du dich schlecht informiert fühlst. Am Anfang bist du gereizt und fällst dem Berater ins Wort. Wenn er ruhig bleibt, zuhört und dein Anliegen ernst nimmt, wirst du nach und nach sachlicher.',
  start:'Sag ohne lange Begrüßung, dass du dich über die Beitragserhöhung ärgerst.'},
 {k:'abschluss',t:'Abschlussgespräch',d:'Der Kunde findet das Angebot gut, zögert aber mit der Entscheidung.',lern:'Entscheidung erleichtern, Zögern verstehen, nächsten Schritt vereinbaren, ohne Druck.',
  kunde:'Du bist 46, angestellt und verheiratet. Du hast ein Angebot für eine private Altersvorsorge bekommen und findest es grundsätzlich gut, zögerst aber mit der Unterschrift. Du sagst Dinge wie, du müsstest das noch mit deinem Partner besprechen, oder vielleicht sei nächstes Jahr besser.',
  start:'Sag kurz Hallo und dass du dir das Angebot angeschaut hast.'},
 {k:'unsicher',t:'Unsicherer Kunde',d:'Der Kunde versteht wenig von Versicherungen und hat Angst, etwas falsch zu machen.',lern:'Einfach erklären, Verständnis prüfen, Sicherheit geben, ohne zu überfordern.',
  kunde:'Du bist 24 und hast gerade deinen ersten Job nach der Ausbildung. Versicherungen sind dir ein Rätsel, du hast Angst, etwas falsch zu machen oder über den Tisch gezogen zu werden. Du stellst einfache Fragen und sagst offen, wenn du etwas nicht verstehst.',
  start:'Sag kurz Hallo und dass du ehrlich gesagt keine Ahnung von Versicherungen hast.'}
];
TR_ROLES.unshift(['offen','Aufgeschlossen','Freundlich und gesprächsbereit, aber nicht leicht zu überzeugen.']);
var TR_BEREICHE=[['eroeffnung','Gesprächseröffnung'],['fragen','Fragetechnik'],['zuhoeren','Zuhören und Verständnis'],['einwand','Einwandbehandlung'],['fachlich','Fachliche Qualität'],['ganzheitlich','Ganzheitliche Beratung'],['abschluss','Gesprächsabschluss']];
(function(c){c.szen='erst';c.role='offen';c.modus='frei';c.coachOpen=-1;c.histId='';c.start=0})(CH.tr);
var trHistOffen='';
function trSzen(k){return TR_SZEN.filter(function(x){return x.k===(k||CH.tr.szen)})[0]||TR_SZEN[0]}
function trRolle(k){return TR_ROLES.filter(function(x){return x[0]===(k||CH.tr.role)})[0]||TR_ROLES[0]}
function trListe(){if(!Array.isArray(db.training))db.training=[];return db.training}

function trPrompt(){
  var sz=trSzen(),r=trRolle();
  return 'Du spielst in einem Gesprächstraining für Versicherungsberater einen Kunden. Szenario: '+sz.t+'. Deine Lage: '+sz.kunde+' Persönlichkeit: '+r[1]+'. '+r[2]+
    ' WICHTIG zur Rollenverteilung: DU bist der KUNDE. Der Nutzer ist der VERSICHERUNGSBERATER und führt das Gespräch. Du stellst keine Beratungsfragen und führst keine Bedarfsanalyse durch (also nie Fragen wie „Was ist Ihnen wichtig?“ oder „Wie kann ich Ihnen helfen?“). Du antwortest auf das, was der Berater fragt oder sagt. Du darfst Rückfragen stellen, die ein Kunde stellt (Kosten, Leistung, Kleingedrucktes, „Brauche ich das wirklich?“), und Einwände bringen, bleibst aber immer der, der beraten wird.'+
    ' Gib Informationen aus deiner Lage nur preis, wenn sie zum Gespräch passen oder der Berater danach fragt. Bleib bei den Angaben deiner Lage und erfinde keine widersprüchlichen Details. Zu deinen eigenen Verträgen machst du höchstens ungefähre Laienangaben. Behaupte keine Fakten über Tarife, Leistungsbeträge oder Gesetze. Wenn der Berater etwas fachlich Ungenaues sagt, reagierst du als Laie, nicht als Experte.'+
    ' Antworte kurz (1 bis 3 Sätze), wie ein echter Mensch am Tisch, ohne Aufzählungen. Erfinde keine echten Namen, Adressen oder Kontaktdaten. Mache es dem Berater realistisch, aber nicht unmöglich: reagiere positiv, wenn er gute offene Fragen stellt, zuhört und Nutzen statt Preis zeigt.'+
    ' Bleib immer in der Rolle. Gib kein Feedback, keine Tipps und keine Bewertung, auch wenn der Berater darum bittet; reagiere dann verwundert als Kunde. Beende die Rolle nie von dir aus.';
}
function trStart(){
  var c=CH.tr;if(!c.role){toast('Bitte eine Kundenrolle wählen');return}
  c.msgs=[];c.on=true;c.fb=null;c.fbErr='';c.coachOpen=-1;c.histId='';c.start=Date.now();render();
  chRun('tr','(Das Gespräch beginnt. Du bist der Kunde und sitzt dem Berater gegenüber. '+trSzen().start+' Ein bis zwei Sätze. Stell dem Berater keine Beratungsfrage und warte, dass er das Gespräch führt.)');
}
function trEnd(){
  var c=CH.tr;
  if(c.busy&&c.ctl)c.ctl.abort();
  c.on=false;c.fb=null;c.fbErr='';c.coachOpen=-1;
  if(window.speechSynthesis)try{window.speechSynthesis.cancel()}catch(e){}
  if(!c.msgs.some(function(m){return m.r==='u'})){c.fbErr='Gespräch beendet. Für ein Feedback brauchst du mindestens eine eigene Antwort im Gespräch.';render();return}
  trHistSpeichern();
  trFeedback();
}
/* ---- Coaching zu einer Kundenaussage (nur Modus B) ---- */
function trZeilen(msgs,bis){
  var nb=0,nk=0,L=[];
  msgs.forEach(function(m,i){if(bis!=null&&i>bis)return;if(m.r==='u')L.push({ref:'B'+(++nb),r:'u',t:m.t,i:i});else if(m.r==='a')L.push({ref:'K'+(++nk),r:'a',t:m.t,i:i})});
  return L;
}
function trNachKunde(m){
  var c=CH.tr;if(c.modus!=='coach'||!c.on||!m||m.r!=='a'||m.coachState)return;
  var idx=c.msgs.indexOf(m);if(idx<0)return;
  m.coachState='busy';
  var verlauf=trZeilen(c.msgs,idx-1).map(function(z){return (z.r==='u'?'BERATER: ':'KUNDE: ')+z.t}).join('\n');
  getSample(function(sample){
    if(!sample||!sample.json){m.coachState='err';return}
    var pr='Du bist Coach in einem Gesprächstraining für Versicherungsberater (Szenario: '+trSzen().t+'). Unten stehen der bisherige Verlauf und die LETZTE AUSSAGE DES KUNDEN. Prüfe nur diese letzte Aussage. '+
      'Geeignet für einen Coaching-Hinweis ist sie, wenn sie einen Einwand, eine Sorge, ein Zögern, ein Kaufsignal, eine beiläufige Information zur Lebenssituation, eine Frage des Kunden oder eine deutliche Emotion enthält. Reine Begrüßungen oder Zustimmungen ohne Gehalt sind nicht geeignet.\n'+
      'Regeln: Beziehe dich konkret auf den Wortlaut der Aussage. Mögliche Hintergründe sind Vermutungen; formuliere sie ausdrücklich als Hypothesen („Vielleicht …“, „Möglicherweise …“). Sage NICHT voraus, wie der Kunde als Nächstes reagieren wird. Erfinde keine Tarifdaten, Beträge oder Gesetzesinhalte. Die Antwortwege sind Gesprächstechnik (nachfragen, spiegeln, einordnen, Nutzen erklären, nächsten Schritt anbieten), keine Produktargumente mit Zahlen. Du-Form an den Berater, kurz und natürlich.\n'+
      'Antworte NUR als JSON: {"geeignet":true oder false,"stichwort":"worum es in der Aussage geht, 2 bis 5 Wörter","hintergrund":["2 bis 3 Hypothesen"],"erkennen":"ein Satz: was du an der Aussage erkennen solltest","reaktionen":[{"weg":"kurzer Name, z. B. Nachfragen","satz":"natürlicher Beispielsatz"}],"vermeiden":["1 bis 3 typische Fehler"],"lernziel":"ein Satz"}\n\n'+
      'VERLAUF:\n'+(verlauf||'(noch nichts)').slice(-8000)+'\n\nLETZTE AUSSAGE DES KUNDEN:\n„'+m.t.slice(0,1200)+'“';
    sample.json(pr,{modelTier:'quick',cache:false}).then(function(o){
      function L(a,n){return (Array.isArray(a)?a:[]).map(function(x){return String(x==null?'':x).trim().slice(0,300)}).filter(Boolean).slice(0,n)}
      if(!o||typeof o!=='object'||o.geeignet!==true){m.coachState='none';return}
      var re=(Array.isArray(o.reaktionen)?o.reaktionen:[]).map(function(x){return x&&typeof x==='object'?{weg:String(x.weg||'').trim().slice(0,60),satz:String(x.satz||'').trim().slice(0,300)}:{weg:'',satz:String(x||'').trim().slice(0,300)}}).filter(function(x){return x.satz}).slice(0,3);
      var co={stichwort:String(o.stichwort||'').trim().slice(0,60),hintergrund:L(o.hintergrund,3),erkennen:String(o.erkennen||'').trim().slice(0,300),reaktionen:re,vermeiden:L(o.vermeiden,3),lernziel:String(o.lernziel||'').trim().slice(0,240)};
      if(!co.reaktionen.length&&!co.hintergrund.length){m.coachState='none';return}
      m.coach=co;m.coachState='ok';chPaint('tr');
    }).catch(function(){m.coachState='err'});
  });
}
function trCoachHtml(m,i){
  var co=m.coach;
  return '<div class="tr-coach" role="region" aria-label="Coaching-Hinweis" id="trc-'+i+'"><div class="trc-h"><b>'+ico('bulb',16)+'Coaching'+(co.stichwort?': '+esc(co.stichwort):'')+'</b><button class="icon sm" data-act="tr-coach-close" aria-label="Hinweis schließen">×</button></div>'+
    '<p class="trc-zu">Zur Aussage: „'+esc(m.t.length>140?m.t.slice(0,140)+' …':m.t)+'“</p>'+
    (co.hintergrund.length?'<div class="trc-s"><p class="trc-l">A · Möglicher Hintergrund <em>Hypothesen, nicht bestätigt</em></p><ul>'+co.hintergrund.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>':'')+
    (co.erkennen?'<div class="trc-s"><p class="trc-l">B · Was du erkennen solltest</p><p>'+esc(co.erkennen)+'</p></div>':'')+
    (co.reaktionen.length?'<div class="trc-s"><p class="trc-l">C · Mögliche Antwortwege</p><ol class="trc-r">'+co.reaktionen.map(function(x){return '<li>'+(x.weg?'<b>'+esc(x.weg)+'</b>':'')+'<span>„'+esc(x.satz)+'“</span></li>'}).join('')+'</ol></div>':'')+
    (co.vermeiden.length?'<div class="trc-s"><p class="trc-l">D · Besser vermeiden</p><ul>'+co.vermeiden.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>':'')+
    (co.lernziel?'<div class="trc-s"><p class="trc-l">E · Lernziel</p><p>'+esc(co.lernziel)+'</p></div>':'')+
    '<p class="ds-source">KI-Hinweis zur Übung. Das Gespräch läuft normal weiter, du entscheidest selbst, wie du antwortest.</p></div>';
}
function trMsgsHtml(){
  var c=CH.tr;
  return c.msgs.map(function(m,i){
    var h='<div class="cm '+m.r+'">'+chFmt(m.t)+'</div>';
    if(m.r==='a'&&m.coach&&c.modus==='coach'){
      var auf=c.coachOpen===i;
      h+='<div class="cm-x"><button class="tr-bulb'+(auf?' on':'')+(m.coachSeen?' seen':'')+'" data-act="tr-coach" data-id="'+i+'" aria-expanded="'+auf+'" aria-controls="trc-'+i+'" title="Coaching-Hinweis zu dieser Aussage">'+ico('bulb',16)+'<span>Hinweis</span></button></div>';
      if(auf)h+=trCoachHtml(m,i);
    }
    return h;
  }).join('')+(c.busy&&!c.live?'<div class="cm a dim">Denkt nach ...</div>':'');
}
/* ---- Feedback ---- */
function trNorm(s){return String(s||'').toLowerCase().replace(/[„“”"'‚‘’«»]/g,'').replace(/[.,;:!?…–-]+/g,' ').replace(/\s+/g,' ').trim()}
function trDatenlage(msgs){
  var B=msgs.filter(function(m){return m.r==='u'}),w=B.reduce(function(n,m){return n+m.t.split(/\s+/).filter(Boolean).length},0);
  return {nB:B.length,worte:w,knapp:B.length<3||w<40};
}
/* Prüft Zitate gegen die Beraterzeilen: nur wörtlich gefundene Zitate werden als Zitat gezeigt. */
function trFbAufbereiten(o,msgs){
  var Z=trZeilen(msgs).filter(function(z){return z.r==='u'}),dl=trDatenlage(msgs);
  function S(v,n){return String(v==null?'':v).trim().slice(0,n||400)}
  function L(a,n){return (Array.isArray(a)?a:[]).map(function(x){return S(x)}).filter(Boolean).slice(0,n||3)}
  var fb={v:2,gesamt:S(o.gesamt,500),bereiche:[],punkte:[],staerken:L(o.staerken),entwicklung:L(o.entwicklung||o.verbesserungen),uebung:S(o.uebung||o.satz,400),daten:dl,szen:CH.tr.szen,role:CH.tr.role,modus:CH.tr.modus};
  var B=Array.isArray(o.bereiche)?o.bereiche:[];
  TR_BEREICHE.forEach(function(b){var x=B.filter(function(y){return y&&y.key===b[0]})[0];var sc=x&&x.score!=null&&x.score!==''?Math.round(Number(x.score)):null;if(!(sc>=1&&sc<=5))sc=null;fb.bereiche.push({key:b[0],score:x?sc:null,text:x?S(x.einschaetzung,300):''})});
  (Array.isArray(o.punkte)?o.punkte:[]).slice(0,8).forEach(function(p){
    if(!p||typeof p!=='object')return;
    var zi=S(p.zitat,300),nz=trNorm(zi),ref=S(p.ref,6).toUpperCase(),z=Z.filter(function(x){return x.ref===ref})[0],treffer=null;
    if(nz.length>=4){treffer=z&&trNorm(z.t).indexOf(nz)>=0?z:Z.filter(function(x){return trNorm(x.t).indexOf(nz)>=0})[0]||null}
    var q={bereich:TR_BEREICHE.some(function(b){return b[0]===p.bereich})?p.bereich:'',bewertung:p.bewertung==='gut'?'gut':'verbesserbar',warum:S(p.warum),alternative:S(p.alternative),wirkung:S(p.wirkung),faehigkeit:S(p.faehigkeit,80)};
    if(treffer){q.ref=treffer.ref;q.zitat=zi;q.belegt=true}
    else if(z){q.ref=z.ref;q.zitat=z.t.length>220?z.t.slice(0,220)+' …':z.t;q.belegt=false}
    else{q.ref='';q.zitat='';q.belegt=false}
    if(q.warum||q.alternative)fb.punkte.push(q);
  });
  if(typeof o.punkte==='number'&&!B.length)fb.alt=Math.max(1,Math.min(5,Math.round(o.punkte)));
  var sc=fb.bereiche.filter(function(b){return b.score!=null});
  fb.schnitt=sc.length?Math.round(sc.reduce(function(n,b){return n+b.score},0)/sc.length*10)/10:null;fb.nBew=sc.length;
  return fb;
}
function trFeedback(){
  var c=CH.tr,r=trRolle(),sz=trSzen();
  var Z=trZeilen(c.msgs),verlauf=Z.map(function(z){return z.ref+': '+z.t}).join('\n');
  c.fbBusy=true;c.fbErr='';render();
  getSample(function(sample){
    if(!sample){c.fbBusy=false;c.fbErr='Die KI ist in dieser Ansicht nicht verfügbar. Öffne die Seite in Claude.';render();return}
    var pr='Du bist ein erfahrener Verkaufstrainer für Versicherungsberater in Deutschland (Zusammenarbeit mit einer Volksbank). Unten steht ein Übungsgespräch. Szenario: '+sz.t+' (Schwerpunkt: '+sz.lern+'). Der Kunde wurde von einer KI gespielt, Persönlichkeit: '+r[1]+'.\n'+
      'Die Zeilen sind nummeriert: B1, B2 … sind Aussagen des BERATERS, K1, K2 … Aussagen des KUNDEN. Bewerte nur den Berater.\n'+
      'Bereiche (key: Name): '+TR_BEREICHE.map(function(b){return b[0]+': '+b[1]}).join(', ')+'.\n'+
      'Regeln:\n- Zitate nur wörtlich aus Berater-Zeilen und immer mit Zeilennummer (ref). Keine erfundenen, gekürzten oder umformulierten Zitate.\n- Trenne die Beobachtung (was wörtlich gesagt wurde) von deiner Einschätzung (warum gut oder verbesserbar).\n- Kam ein Bereich im Gespräch nicht vor (zum Beispiel kein Einwand, kein Abschluss erreicht), setze score auf null und sage das in einschaetzung.\n- Fachliche Qualität: bewerte Verständlichkeit und Sorgfalt. Stelle selbst keine Fakten zu Tarifen, Beträgen oder Gesetzen auf. Sollte eine fachliche Aussage des Beraters geprüft werden, schreibe „bitte im Beraterwissen prüfen“, ohne selbst Zahlen zu nennen.\n- score von 1 bis 5 (1 deutlich ausbaufähig, 3 solide, 5 sehr gut).\n- Du-Form an den Berater, konkret, freundlich, keine Floskeln. Höchstens 7 Punkte.\n\n'+
      'Antworte NUR als JSON: {"gesamt":"1 bis 2 Sätze Gesamteindruck","bereiche":[{"key":"eroeffnung","score":1 bis 5 oder null,"einschaetzung":"ein Satz"}],"punkte":[{"bereich":"key","ref":"B2","zitat":"wörtlicher Ausschnitt aus dieser Zeile","bewertung":"gut" oder "verbesserbar","warum":"Einschätzung","alternative":"bessere oder alternative Formulierung","wirkung":"warum die Alternative hilft","faehigkeit":"zu trainierende Fähigkeit, 2 bis 4 Wörter"}],"staerken":["3 Stärken"],"entwicklung":["3 Entwicklungsfelder"],"uebung":"eine konkrete Übung für das nächste Training"}\n\n'+
      'GESPRÄCH:\n'+verlauf.slice(0,14000);
    sample.json(pr,{modelTier:'default',cache:false}).then(function(o){
      if(!o||typeof o!=='object')throw {code:'invalid_json'};
      var fb=trFbAufbereiten(o,c.msgs);
      if(!fb.gesamt&&!fb.staerken.length&&!fb.entwicklung.length&&!fb.punkte.length)throw {code:'invalid_json'};
      c.fb=fb;c.fbBusy=false;trHistSpeichern();render();var el=$('tr-fb');if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'start'});
    }).catch(function(er){c.fbBusy=false;c.fbErr=er&&er.code==='invalid_json'?'Das Feedback war nicht lesbar. Bitte erneut versuchen.':chErr(er);render()});
  });
}
function trPunkte(n){var h='<span class="trk-d" aria-hidden="true">';for(var i=1;i<=5;i++)h+='<i class="'+(i<=n?'on':'')+'"></i>';return h+'</span>'}
function trFbHtml(f,opt){
  var c=CH.tr;opt=opt||{};
  if(!opt.hist){
    if(c.fbBusy)return '<div class="ds-callout" id="tr-fb" role="status">Das Gespräch ist beendet. Das Feedback wird erstellt …</div>';
    if(c.fbErr)return '<div class="ds-callout bad" id="tr-fb" role="alert">'+esc(c.fbErr)+(c.msgs.some(function(m){return m.r==='u'})?'<div class="btnrow wrap"><button class="btn small" data-act="tr-fb-retry">Feedback erneut anfordern</button></div>':'')+'</div>';
    f=c.fb;
  }
  if(!f)return '';
  var BN={};TR_BEREICHE.forEach(function(b){BN[b[0]]=b[1]});
  var d=f.daten||{nB:0,knapp:false};
  var h='<section class="ds-card trfb"'+(opt.hist?'':' id="tr-fb"')+'><div class="ds-cap">Feedback zu deinem Gespräch · '+esc(trSzen(f.szen).t)+' · '+(f.modus==='coach'?'mit Coaching':'freies Rollenspiel')+'</div>';
  if(d.knapp)h+='<div class="ds-callout warn" role="note"><b>Wenig Gesprächsstoff.</b> Das Feedback stützt sich auf '+d.nB+' Beraterbeitr'+(d.nB===1?'ag':'äge')+' mit zusammen '+d.worte+' Wörtern und ist deshalb nur eingeschränkt aussagekräftig.</div>';
  if(f.gesamt)h+='<p class="trfb-g">'+esc(f.gesamt)+'</p>';
  if(f.bereiche&&f.bereiche.length){
    h+='<h4 class="trfb-h">Kompetenzen'+(f.schnitt!=null?' <span class="muted">· Durchschnitt '+String(f.schnitt).replace('.',',')+' von 5 aus '+f.nBew+' bewerteten Bereichen</span>':'')+'</h4><ul class="trk">'+f.bereiche.map(function(b){return '<li><span class="trk-n">'+esc(BN[b.key])+'</span>'+(b.score!=null?trPunkte(b.score)+'<span class="trk-s">'+b.score+' von 5</span>':'<span class="trk-s muted">nicht beurteilbar</span>')+(b.text?'<small>'+esc(b.text)+'</small>':'')+'</li>'}).join('')+'</ul>'+
      '<p class="fine-s">Skala 1 bis 5. Einschätzung der KI auf Grundlage von '+d.nB+' Beraterbeiträgen. Bereiche, zu denen es im Gespräch keine passende Stelle gab, werden nicht bewertet.</p>';
  }else if(f.alt)h+='<p class="muted">Einschätzung der KI: '+f.alt+' von 5</p>';
  h+='<div class="trfb-2"><div><h4>Das war gut</h4><ul class="ds-list">'+f.staerken.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div><div><h4>Das geht besser</h4><ul class="ds-list">'+f.entwicklung.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div></div>';
  if(f.punkte&&f.punkte.length){
    h+='<h4 class="trfb-h">Stellen aus dem Gespräch</h4><ol class="trp">'+f.punkte.map(function(p){
      return '<li class="trp-i '+(p.bewertung==='gut'?'gut':'bes')+'"><div class="trp-k">'+(p.ref?'<span class="trp-ref">'+esc(p.ref)+'</span>':'')+(p.bereich?'<span>'+esc(BN[p.bereich])+'</span>':'')+'<span class="stat-pill s-'+(p.bewertung==='gut'?'ok':'info')+'">'+(p.bewertung==='gut'?'gut':'verbesserbar')+'</span></div>'+
        '<div class="trp-o"><p class="trc-l">Beobachtung · '+(p.belegt?'wörtlich aus dem Gespräch':p.zitat?'Originalzeile, das Zitat der KI war nicht wörtlich auffindbar':'ohne belegbare Gesprächsstelle')+'</p>'+(p.zitat?'<blockquote>„'+esc(p.zitat)+'“</blockquote>':'')+'</div>'+
        '<div class="trp-e"><p class="trc-l">Einschätzung der KI</p>'+(p.warum?'<p>'+esc(p.warum)+'</p>':'')+
        (p.alternative?'<p class="trc-l">'+(p.bewertung==='gut'?'Variante':'So könntest du es sagen')+'</p><blockquote class="kq">'+esc(p.alternative)+'</blockquote>':'')+
        (p.wirkung?'<p class="trc-l">Warum das hilft</p><p>'+esc(p.wirkung)+'</p>':'')+
        (p.faehigkeit?'<p class="trp-f">Fähigkeit: <b>'+esc(p.faehigkeit)+'</b></p>':'')+'</div></li>'}).join('')+'</ol>';
  }
  if(f.uebung)h+='<div class="tr-ueb"><p class="trc-l">Übung für das nächste Training</p><p>'+esc(f.uebung)+'</p></div>';
  if(opt.coachN)h+='<p class="fine-s">Geöffnete Coaching-Hinweise in diesem Gespräch: '+opt.coachN+'</p>';
  h+='<p class="ds-source">KI-Einschätzung zu einem Übungsgespräch, keine Bewertung durch einen Menschen und keine fachliche Prüfung.</p>';
  if(!opt.hist)h+='<div class="btnrow wrap"><button class="btn small" data-act="tr-fb-copy">Feedback kopieren</button><button class="btn small primary" data-act="tr-start">Neues Gespräch starten</button></div>';
  return h+'</section>';
}
function trFbText(f){
  f=f||CH.tr.fb;if(!f)return '';
  var BN={};TR_BEREICHE.forEach(function(b){BN[b[0]]=b[1]});
  var t='Feedback zum Übungsgespräch ('+trSzen(f.szen).t+')\n\n'+(f.gesamt?f.gesamt+'\n\n':'');
  if(f.daten&&f.daten.knapp)t+='Hinweis: wenig Gesprächsstoff, Einschätzung nur eingeschränkt aussagekräftig.\n\n';
  if(f.bereiche&&f.bereiche.length)t+='Kompetenzen (1 bis 5, KI-Einschätzung):\n'+f.bereiche.map(function(b){return '- '+BN[b.key]+': '+(b.score!=null?b.score:'nicht beurteilbar')}).join('\n')+'\n\n';
  t+='Stärken:\n'+f.staerken.map(function(x){return '- '+x}).join('\n')+'\n\nEntwicklungsfelder:\n'+f.entwicklung.map(function(x){return '- '+x}).join('\n');
  (f.punkte||[]).forEach(function(p){t+='\n\n'+(p.ref?p.ref+' ':'')+(p.bewertung==='gut'?'(gut)':'(verbesserbar)')+(p.zitat?': „'+p.zitat+'“':'')+(p.warum?'\n'+p.warum:'')+(p.alternative?'\nAlternative: '+p.alternative:'')});
  if(f.uebung)t+='\n\nÜbung: '+f.uebung;
  return t;
}
/* ---- Verlauf früherer Übungen (nur in diesem Browser) ---- */
function trHistSpeichern(){
  var c=CH.tr,L=trListe(),e=c.histId&&L.filter(function(x){return x.id===c.histId})[0];
  if(!e){e={id:uid(),ts:c.start||Date.now()};L.unshift(e);c.histId=e.id}
  e.szen=c.szen;e.role=c.role;e.modus=c.modus;e.ende=Date.now();
  e.msgs=c.msgs.filter(function(m){return m.r==='u'||m.r==='a'}).map(function(m){return {r:m.r,t:String(m.t).slice(0,1500)}});
  e.coachN=c.msgs.filter(function(m){return m.coachSeen}).length;
  e.fb=c.fb||e.fb||null;
  if(L.length>30)L.length=30;
  save();
}
function trHistHtml(){
  var L=trListe();if(!L.length)return '';
  return '<section class="trh"><h3 class="sub-h">Frühere Übungen <span class="muted">('+L.length+')</span></h3><ul class="list-s">'+L.map(function(e){var f=e.fb;
    return '<li><button data-act="tr-hist" data-id="'+e.id+'"><b>'+esc(trSzen(e.szen).t)+'</b><span>'+esc(new Date(e.ts).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}))+' · '+esc(trRolle(e.role)[1])+' · '+(e.modus==='coach'?'mit Coaching':'frei')+' · '+((e.msgs||[]).filter(function(m){return m.r==='u'}).length)+' Beiträge</span><small>'+(f?(f.schnitt!=null?'Durchschnitt '+String(f.schnitt).replace('.',',')+' von 5':'Feedback vorhanden')+(f.daten&&f.daten.knapp?' · wenig Gesprächsstoff':''):'ohne Feedback')+'</small></button></li>'}).join('')+'</ul><p class="fine-s">Gespeichert nur in diesem Browser, höchstens 30 Übungen. Übungsgespräche enthalten keine echten Kundendaten.</p></section>';
}
function trHistOpen(id){
  var e=trListe().filter(function(x){return x.id===id})[0];if(!e)return;
  var Z=trZeilen(e.msgs||[]);
  openSheet('<h3>'+esc(trSzen(e.szen).t)+'</h3><p class="sub">'+esc(new Date(e.ts).toLocaleString('de-DE'))+' · '+esc(trRolle(e.role)[1])+' · '+(e.modus==='coach'?'mit Coaching':'freies Rollenspiel')+'</p>'+
    (e.fb?trFbHtml(e.fb,{hist:true,coachN:e.coachN}):'<p class="muted">Zu diesem Gespräch gibt es kein Feedback.</p>')+
    '<details class="adv"><summary>Gesprächsverlauf ('+Z.length+' Beiträge)</summary><ol class="trv">'+Z.map(function(z){return '<li class="'+z.r+'"><span>'+z.ref+'</span>'+esc(z.t)+'</li>'}).join('')+'</ol></details>'+
    '<div class="btnrow wrap">'+(e.fb?'<button class="btn small" data-act="tr-hist-copy" data-id="'+e.id+'">Feedback kopieren</button>':'')+'<button class="btn small danger" data-act="tr-hist-del" data-id="'+e.id+'" data-confirm="Diese Übung löschen?">Löschen</button><button class="btn small" data-act="close">Schließen</button></div>');
}
/* ---- Kopfbereich der Trainingsseite ---- */
function trKopfHtml(){
  var c=CH.tr,sz=trSzen(),dis=c.on?' disabled':'';
  var h='<div class="tr-set">';
  h+='<div class="tr-row"><p class="trc-l">Szenario</p><div class="plbar">'+TR_SZEN.map(function(s){return '<button class="chip" data-act="tr-szen" data-id="'+s.k+'" aria-pressed="'+(c.szen===s.k)+'"'+dis+'>'+esc(s.t)+'</button>'}).join('')+'</div><p class="tr-d">'+esc(sz.d)+' <span class="muted">Schwerpunkt: '+esc(sz.lern)+'</span></p></div>';
  h+='<div class="tr-row"><p class="trc-l">Kunde</p><div class="plbar">'+TR_ROLES.map(function(r){return '<button class="chip" data-act="tr-role" data-id="'+r[0]+'" aria-pressed="'+(c.role===r[0])+'" title="'+esc(r[2])+'"'+dis+'>'+r[1]+'</button>'}).join('')+'</div></div>';
  h+='<div class="tr-row"><p class="trc-l">Modus</p><div class="seg" role="group" aria-label="Trainingsmodus"><button data-act="tr-modus" data-id="frei" aria-pressed="'+(c.modus==='frei')+'">Freies Rollenspiel</button><button data-act="tr-modus" data-id="coach" aria-pressed="'+(c.modus==='coach')+'">Mit Coaching</button></div><p class="tr-d muted">'+(c.modus==='coach'?'Bei geeigneten Kundenaussagen erscheint eine Glühbirne. Ein Klick öffnet einen kurzen Hinweis, das Gespräch läuft normal weiter.':'Ohne Hinweise während des Gesprächs. Feedback gibt es am Ende.')+'</p></div>';
  h+='<div class="plbar">'+(c.on?'<button class="btn small primary" data-act="tr-end">Gespräch beenden und Feedback</button>':(c.fbBusy?'':'<button class="btn small primary" data-act="tr-start">'+(c.msgs.length?'Neues Gespräch starten':'Gespräch starten')+'</button>'))+'<button class="chip" data-act="tr-voice" aria-pressed="'+!!c.voice+'">Kunde spricht laut</button></div></div>';
  return h+trFbHtml();
}
function trAct(act,btn){
  var c=CH.tr,id=btn.dataset.id;
  switch(act){
    case 'tr-szen':if(c.on){toast('Das Szenario lässt sich nach dem Gespräch ändern.');return}c.szen=id;render();return;
    case 'tr-modus':c.modus=id==='coach'?'coach':'frei';if(c.modus==='frei')c.coachOpen=-1;else if(c.on){var la=c.msgs[c.msgs.length-1];if(la&&la.r==='a'&&!la.live)trNachKunde(la)}render();return;
    case 'tr-coach':{var i=Number(id),m=c.msgs[i];if(!m||!m.coach)return;c.coachOpen=c.coachOpen===i?-1:i;if(c.coachOpen===i)m.coachSeen=true;chPaint('tr');var p=$('trc-'+i);if(p&&p.scrollIntoView)p.scrollIntoView({block:'nearest'});return}
    case 'tr-coach-close':c.coachOpen=-1;chPaint('tr');var ta=$('ci-tr');if(ta)ta.focus();return;
    case 'tr-hist':trHistOpen(id);return;
    case 'tr-hist-copy':{var e=trListe().filter(function(x){return x.id===id})[0];if(e&&e.fb)copyText(trFbText(e.fb),'Feedback kopiert');return}
    case 'tr-hist-del':db.training=trListe().filter(function(x){return x.id!==id});if(c.histId===id)c.histId='';save();closeSheet();render();toast('Übung gelöscht');return;
  }
}
