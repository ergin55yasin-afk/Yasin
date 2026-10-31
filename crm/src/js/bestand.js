var SPARTEN=['Leben und Rente','Berufsunfähigkeit','Kranken','Unfall','Haftpflicht','Hausrat','Wohngebäude','KFZ','Rechtsschutz','Sonstiges'];
var BEREICHE=['Altersvorsorge','Geldanlage','Krankenversicherung','Sachversicherungen','Pflege'];
var ERG=[['offen','Offen'],['angebot','Angebot erstellt'],['abschluss','Abschluss'],['verloren','Verloren']];
var GRUENDE=['Preis','Vertrag läuft noch','Kein Termin oder keine Zeit','Bindung oder Vertrauen','Bankberater','Sonstiges'];
function plBer(){var l=db.settings&&db.settings.berater;return l&&l.length?l:['Berater A','Berater B','Berater C','Berater D','Berater E','Berater F','Berater G','Berater H']}
function plFil(){var l=db.settings&&db.settings.filialen;return l&&l.length?l:['Filiale 1','Filiale 2','Filiale 3','Filiale 4','Filiale 5','Filiale 6']}
function ergSel(id,erg,grund,dataAttr,ber,fil){
  var a=dataAttr?function(n){return ' data-adv="'+n+'"'}:function(n){return ''};
  return '<label for="'+id+'-erg">Ergebnis des Gesprächs</label><select id="'+id+'-erg"'+a('erg')+'>'+ERG.map(function(o){return '<option value="'+o[0]+'"'+((erg||'offen')===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>'+
    '<label for="'+id+'-grund">Grund, falls verloren</label><select id="'+id+'-grund"'+a('grund')+'><option value="">Keine Angabe</option>'+GRUENDE.map(function(g){return '<option'+(g===grund?' selected':'')+'>'+esc(g)+'</option>'}).join('')+'</select>'+
    '<label for="'+id+'-ber">Bankberater</label><select id="'+id+'-ber"'+a('ber')+'><option value="">Keine Angabe</option>'+plBer().map(function(g){return '<option'+(g===ber?' selected':'')+'>'+esc(g)+'</option>'}).join('')+'</select>'+
    '<label for="'+id+'-fil">Filiale</label><select id="'+id+'-fil"'+a('fil')+'><option value="">Keine Angabe</option>'+plFil().map(function(g){return '<option'+(g===fil?' selected':'')+'>'+esc(g)+'</option>'}).join('')+'</select>';
}

/* ================= Pipeline-Board ================= */
var plF={ber:'',fil:'',tage:'90'};
function plList(){
  var lim=plF.tage==='alle'?'':addDaysIso(todayIso(),-Number(plF.tage));
  return db.beratungen.filter(function(b){return (!plF.ber||b.ber===plF.ber)&&(!plF.fil||b.fil===plF.fil)&&(!lim||b.datum>=lim)});
}
function plNext(e){var i=ERG.map(function(o){return o[0]}).indexOf(e||'offen');return i>=0&&i<2?ERG[i+1][0]:(i===2?'':'')}
function viewPipeline(){
  var L=plList();
  var sel=function(k,list,lab){return '<select data-plf="'+k+'" aria-label="'+lab+'"><option value="">'+lab+': alle</option>'+list.map(function(g){return '<option'+(plF[k]===g?' selected':'')+'>'+esc(g)+'</option>'}).join('')+'</select>'};
  var h='<div class="plbar">'+sel('ber',plBer(),'Bankberater')+sel('fil',plFil(),'Filiale')+
    '<select data-plf="tage" aria-label="Zeitraum">'+[['30','30 Tage'],['90','90 Tage'],['365','1 Jahr'],['alle','Alles']].map(function(o){return '<option value="'+o[0]+'"'+(plF.tage===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>'+
    '<button class="btn small" data-act="pl-set">Berater und Filialen</button></div>';
  if(!db.beratungen.length)return h+'<div class="empty">Noch keine Gespräche. Sobald du eine Beratung speicherst, erscheint sie hier als Karte.</div>';
  var g=L.length,a=L.filter(function(b){return b.erg==='abschluss'}).length;
  h+='<p class="hint-t">'+g+(g===1?' Gespräch':' Gespräche')+', '+a+(a===1?' Abschluss':' Abschlüsse')+(g?' ('+Math.round(a/g*100)+' %)':'')+'. Mit dem Pfeil schiebst du eine Karte in die nächste Spalte.</p><div class="plboard">';
  ERG.forEach(function(o,ci){
    var items=L.filter(function(b){return (b.erg||'offen')===o[0]}).sort(function(x,y){return (y.ts||0)-(x.ts||0)});
    h+='<section class="plcol c-'+o[0]+'"><h3>'+o[1]+' <span>'+items.length+'</span></h3>';
    if(!items.length)h+='<div class="plempty">Leer</div>';
    items.forEach(function(b){
      var who=[b.ber,b.fil].filter(Boolean).map(esc).join(' · ');
      h+='<div class="plcard"><button class="plmain" data-act="open-ber" data-id="'+b.id+'"><span class="tag">'+esc(b.kunde)+'</span><b>'+esc(b.bereich)+'</b><small>'+whenLabel(b.datum)+(who?' · '+who:'')+(o[0]==='verloren'&&b.grund?'<br>Grund: '+esc(b.grund):'')+'</small></button>'+
        '<span class="plmv">'+(ci>0&&ci<3?'<button class="btn small" data-act="pl-move" data-id="'+b.id+'" data-to="'+ERG[ci-1][0]+'" aria-label="Zurück">←</button>':'')+
        (ci<2?'<button class="btn small primary" data-act="pl-move" data-id="'+b.id+'" data-to="'+ERG[ci+1][0]+'" aria-label="Weiter">→</button>':'')+
        (ci<2?'<button class="btn small" data-act="pl-move" data-id="'+b.id+'" data-to="verloren" aria-label="Verloren">Verloren</button>':'')+'</span></div>';
    });
    h+='</section>';
  });
  return h+'</div>';
}
function plSetSheet(){
  openSheet('<h3>Berater und Filialen</h3><p class="sub">Je eine Zeile. Nur Kürzel oder Bezeichnungen, keine Kundendaten.</p><label for="pl-b">Bankberater</label><textarea id="pl-b" rows="8">'+esc(plBer().join('\n'))+'</textarea><label for="pl-f">Filialen</label><textarea id="pl-f" rows="6">'+esc(plFil().join('\n'))+'</textarea><label for="pl-z">Zuordnung (Berater = Filiale, je Zeile)</label><textarea id="pl-z" rows="8">'+esc(Object.keys(rvZuord()).map(function(k){return k+' = '+rvZuord()[k]}).join('\n'))+'</textarea><div class="btnrow"><button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="pl-set-save">Speichern</button></div>');
}
function plSetSave(){
  var f=function(id){return $(id).value.split('\n').map(function(x){return x.trim().slice(0,30)}).filter(Boolean).slice(0,20)};
  if(!db.settings)db.settings={};db.settings.berater=f('pl-b');db.settings.filialen=f('pl-f');var z={};($('pl-z').value||'').split('\n').forEach(function(l){var m=l.split('=');if(m.length===2){var a=m[0].trim().slice(0,30),b=m[1].trim().slice(0,30);if(a&&b&&db.settings.berater.indexOf(a)>=0)z[a]=b}});db.settings.zuord=z;save();closeSheet();render();toast('Gespeichert');
}

/* ================= Revier (Filialen und Bankberater) ================= */
var rv={tage:'90',sel:''};
var RV_TIP={'Preis':'Erst den Nutzen in Euro zeigen (Lücke, Steuervorteil), dann den Preis nennen.','Vertrag läuft noch':'Ablaufdatum und Kündigungsfrist früh erfragen und Wiedervorlage setzen.','Kein Termin oder keine Zeit':'Kurzen Folgetermin gleich im Gespräch vereinbaren.','Bindung oder Vertrauen':'Mit dem Bankberater gemeinsam auftreten, er stellt den Kontakt her.','Bankberater':'Vorab mit dem Berater klären, wie der Termin angekündigt wird.','Sonstiges':'Gründe genauer erfassen, um Muster zu erkennen.'};
function rvZuord(){return (db.settings&&db.settings.zuord)||{}}
function rvStat(f){
  var lim=rv.tage==='alle'?'':addDaysIso(todayIso(),-Number(rv.tage));
  var L=db.beratungen.filter(function(b){return (!lim||b.datum>=lim)&&f(b)});
  var gr={};L.forEach(function(b){if(b.erg==='verloren'&&b.grund)gr[b.grund]=(gr[b.grund]||0)+1});
  var top=Object.keys(gr).sort(function(a,b){return gr[b]-gr[a]})[0]||'';
  return {g:L.length,ab:L.filter(function(b){return b.erg==='abschluss'}).length,an:L.filter(function(b){return b.erg==='angebot'}).length,offen:L.filter(function(b){return !b.erg||b.erg==='offen'}).length,top:top};
}
function rvQ(st){return st.g?Math.round(st.ab/st.g*100)+' %':'-'}
function rvTips(name,st,all){
  var t=[];
  if(!st.g)t.push('Noch keine Gespräche im Zeitraum. Beim nächsten Besuch einen Termin anbieten.');
  if(st.top&&RV_TIP[st.top])t.push('Häufigster Verlustgrund: '+st.top+'. '+RV_TIP[st.top]);
  if(st.offen)t.push(st.offen+(st.offen===1?' Gespräch hat':' Gespräche haben')+' noch kein Ergebnis. Kurz nachtragen, dann stimmt die Auswertung.');
  if(st.g>=3&&all.g&&st.ab/st.g<all.ab/all.g)t.push('Quote liegt unter dem Schnitt aller Gespräche ('+rvQ(all)+'). Vor dem nächsten Termin kurz gemeinsam vorbereiten.');
  if(st.g>=3&&all.g&&st.ab/st.g>=all.ab/all.g&&st.ab)t.push('Läuft gut: Was in diesen Terminen anders ist, lohnt sich zu notieren.');
  return t;
}
function viewRevier(){
  var all=rvStat(function(){return true}),Z=rvZuord(),bl=plBer(),fl=plFil();
  var h='<div class="plbar"><select data-rvf="tage" aria-label="Zeitraum">'+[['30','30 Tage'],['90','90 Tage'],['365','1 Jahr'],['alle','Alles']].map(function(o){return '<option value="'+o[0]+'"'+(rv.tage===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select><button class="btn small" data-act="pl-set">Berater und Filialen</button></div>';
  h+='<p class="hint-t">'+fl.length+' Filialen, '+bl.length+' Bankberater. Antippen für Details. Nur zur Terminplanung, keine Bewertung von Personen.</p>';
  var groups=fl.map(function(f){return {f:f,b:bl.filter(function(x){return Z[x]===f})}});
  var rest=bl.filter(function(x){return fl.indexOf(Z[x])<0});
  if(rest.length)groups.push({f:'',b:rest});
  h+='<div class="rvgrid"><div class="rvmap">';
  groups.forEach(function(g){
    var st=g.f?rvStat(function(b){return b.fil===g.f}):null;
    h+='<section class="rvf"><h3><svg viewBox="0 0 22 30" width="14" height="19" aria-hidden="true"><path d="M11 30C11 30 0 18 0 11a11 11 0 0 1 22 0c0 7-11 19-11 19z" fill="currentColor"/><circle cx="11" cy="11" r="4.5" fill="var(--surface)"/></svg>'+(g.f?esc(g.f):'Nicht zugeordnet')+'</h3>'+
      (st?'<p class="rvs"><b>'+st.g+'</b> '+(st.g===1?'Gespräch':'Gespräche')+' · <b>'+st.ab+'</b> '+(st.ab===1?'Abschluss':'Abschlüsse')+' · <b>'+rvQ(st)+'</b></p>':'')+
      '<div class="rvb">'+(g.b.length?g.b.map(function(x){var q=rvStat(function(b){return b.ber===x});return '<button class="rvchip" aria-pressed="'+(rv.sel===x)+'" data-act="rv-sel" data-id="'+esc(x)+'"><i>'+esc(x.replace(/^Berater\s+/,'').slice(0,2))+'</i><span>'+esc(x)+'<small>'+q.g+' Gespräche</small></span></button>'}).join(''):'<span class="plempty">Kein Berater zugeordnet</span>')+'</div></section>';
  });
  h+='</div><aside class="rvd">';
  if(rv.sel&&bl.indexOf(rv.sel)>=0){
    var st2=rvStat(function(b){return b.ber===rv.sel}),tp=rvTips(rv.sel,st2,all);
    h+='<h3>'+esc(rv.sel)+'</h3><p class="sub">'+(Z[rv.sel]?esc(Z[rv.sel]):'Keine Filiale zugeordnet')+'</p><div class="rvk"><div><b>'+st2.g+'</b><small>Gespräche</small></div><div><b>'+st2.ab+'</b><small>Abschlüsse</small></div><div><b>'+rvQ(st2)+'</b><small>Quote</small></div></div>'+
      '<div class="pl" style="margin-top:14px">Spickzettel</div><ul class="rvl">'+tp.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'+
      '<button class="btn primary" style="width:100%;margin-top:12px" data-act="rv-plan" data-id="'+esc(rv.sel)+'">Termin mit '+esc(rv.sel)+' planen</button>';
  }else h+='<div class="empty">Wähle links einen Bankberater.</div>';
  return h+'</aside></div>';
}

/* ================= Copilot, Wissen, Training (KI-Chat) ================= */
var CH={cp:{msgs:[],busy:false,ctl:null},wk:{msgs:[],busy:false,ctl:null},tr:{msgs:[],busy:false,ctl:null,role:'',on:false,voice:false,fb:null,fbBusy:false,fbErr:''}};
var CH_TITLE={cp:'Copilot',wk:'Wissen',tr:'Training'};
var TR_ROLES=[['skeptiker','Skeptiker','Misstrauisch, will überzeugt werden, hinterfragt jeden Nutzen.'],['preis','Preisfokus','Vergleicht nur Beiträge und sagt oft, anderswo sei es billiger.'],['zeit','Zeitknapp','Hat nur wenig Zeit, unterbricht, will die Kurzfassung.'],['bank','Mit Bankberater','Der Bankberater sitzt dabei und der Kunde schaut oft zu ihm.']];
function getSample(cb){
  try{if(!window.claude||!window.claude.use){cb(null);return}window.claude.use('sample').then(function(f){cb(f||null)},function(){cb(null)})}catch(e){cb(null)}
}
function chFmt(t){return esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')}
function chMsgsHtml(id){
  if(id==='tr')return trMsgsHtml();
  var c=CH[id];
  return c.msgs.map(function(m){return '<div class="cm '+m.r+'">'+(m.r==='s'?'':'')+chFmt(m.t)+'</div>'}).join('')+(c.busy&&!c.live?'<div class="cm a dim">Denkt nach ...</div>':'');
}
function chPaint(id){
  var el=$('cm-'+id);if(!el)return;el.innerHTML=chMsgsHtml(id);el.scrollTop=el.scrollHeight;
  var b=$('cs-'+id);if(b){b.textContent=CH[id].busy?'Stopp':'Senden';b.setAttribute('data-act',CH[id].busy?'chat-stop':'chat-send')}
}
function chIntro(id){
  if(id==='cp')return 'Schreib oder sprich, was passiert ist. Zum Beispiel: „Neuer Vertrag bei 10482, Hausrat, läuft am 1.1. ab" oder „10483 hat zugesagt, Rückmeldung bis Freitag". Ich lege Aufgaben, Verträge, Termine und Angebote an. Bitte nur Kundennummern, keine Namen.';
  if(id==='wk')return wissenList().length?'Frag mich etwas. Ich antworte nur aus deiner Wissensdatenbank ('+wissenList().length+' Einträge).':'Die Wissensdatenbank ist noch leer. Lege über „Einträge" Wissen an, zum Beispiel Einwandbehandlung, Produktregeln oder Abläufe. Danach beantworte ich Fragen daraus.';
  return CH.tr.on?'':'Wähle Szenario, Kunde und Modus und starte das Übungsgespräch. Du sprichst oder schreibst, die KI spielt den Kunden und bleibt in der Rolle. Am Ende bekommst du ein strukturiertes Feedback zu deinem Gesprächsverlauf. Es werden keine echten Kundendaten verwendet.';
}
function viewChat(id){
  var c=CH[id],h='';
  if(id==='wk')h+=wissenSeg('wissenki');
  if(id==='wk')h+='<div class="plbar"><button class="btn small" data-act="wk-edit">Einträge ('+wissenList().length+')</button></div>';
  if(id==='tr'){
    h+='<div class="plbar"><button class="chip" data-act="tr-mode" data-id="drill" aria-pressed="'+(trMode==='drill')+'">Einwandtrainer</button><button class="chip" data-act="tr-mode" data-id="rolle" aria-pressed="'+(trMode==='rolle')+'">Rollenspiel</button></div>';
    if(trMode==='drill')return h+drHtml();
    h+=trKopfHtml();
  }
  var intro=chIntro(id);
  h+='<div class="chat"><div class="cmsgs" id="cm-'+id+'" aria-live="polite">'+(intro?'<div class="cm i">'+chFmt(intro)+'</div>':'')+chMsgsHtml(id)+'</div>'+
    '<div class="cbar"><textarea id="ci-'+id+'" rows="2" maxlength="1500" placeholder="'+(id==='cp'?'Schreib oder sprich':id==='wk'?'Frage stellen':'Deine Antwort an den Kunden')+'" data-chat="'+id+'"></textarea>'+
    (speechOk()?'<button class="btn" data-act="chat-mic" data-id="'+id+'" aria-label="Sprechen" id="cmic-'+id+'">'+ico('mic',20)+'</button>':'')+
    '<button class="btn primary" id="cs-'+id+'" data-act="'+(c.busy?'chat-stop':'chat-send')+'" data-id="'+id+'">'+(c.busy?'Stopp':'Senden')+'</button></div>'+
    '<p class="hint-t" id="cn-'+id+'">'+(id==='tr'?'Übung mit KI. Es werden keine echten Kundendaten verwendet.':'Antworten kommen von Claude auf deinem Konto. Keine Namen oder Kontaktdaten eintragen.')+'</p></div>';
  return h+(id==='tr'?trHistHtml():'');
}
function speechOk(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
var recog=null,trMode='drill';
function chMic(id){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  if(recog){try{recog.stop()}catch(e){}recog=null;return}
  try{
    recog=new SR();recog.lang='de-DE';recog.interimResults=false;recog.maxAlternatives=1;
    var b=$('cmic-'+id);if(b)b.classList.add('rec');
    recog.onresult=function(ev){var t=ev.results[0][0].transcript;var ta=$('ci-'+id);if(ta){ta.value=(ta.value?ta.value+' ':'')+t}if(id==='tr'&&CH.tr.on)chSend(id)};
    recog.onend=function(){recog=null;var b2=$('cmic-'+id);if(b2)b2.classList.remove('rec')};
    recog.onerror=function(){recog=null;var b3=$('cmic-'+id);if(b3)b3.classList.remove('rec');toast('Mikrofon nicht verfügbar')};
    recog.start();
  }catch(e){recog=null;toast('Mikrofon nicht verfügbar')}
}
function chSpeak(t){
  try{if(!window.speechSynthesis||!CH.tr.voice)return;window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t.replace(/\*+/g,''));u.lang='de-DE';window.speechSynthesis.speak(u)}catch(e){}
}
function chErr(e){
  var c=e&&e.code;
  if(c==='not_granted'||c==='sampling_disabled'||c==='not_declared'||c==='capability_disabled')return 'Die KI ist hier nicht freigegeben. Erlaube Claude beim Öffnen der Seite die Nutzung.';
  if(c==='rate_limited')return 'Gerade zu viele Anfragen. Bitte etwas später erneut senden.';
  if(c==='session_expired')return 'Bitte neu anmelden.';
  return 'Das hat nicht geklappt. Bitte erneut senden.';
}
function cpTools(created){
  function chk(i){
    var k=String(i.kunde||'').trim().toUpperCase();var e=checkKunde(k);if(e||!k)throw new Error(e||'Kundennummer fehlt');
    return k;
  }
  function txt(v){v=String(v||'').trim().slice(0,300);var e=checkText(v);if(e)throw new Error(e);return v}
  function dt(v){v=String(v||'');return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:''}
  return [
   {name:'anlegen_aufgabe',description:'Legt eine Aufgabe (To-do) zu einer Kundennummer an. wartet_auf_kunde=true, wenn eine Rückmeldung des Kunden erwartet wird. Gibt Bestätigung zurück.',inputSchema:{type:'object',properties:{kunde:{type:'string',description:'Kundennummer'},text:{type:'string'},faellig:{type:'string',description:'Datum YYYY-MM-DD, leer wenn offen'},wartet_auf_kunde:{type:'boolean'}},required:['kunde','text']},
    execute:function(i){var k=chk(i),t=txt(i.text);if(!t)throw new Error('Text fehlt');db.todos.push({id:uid(),kunde:k,text:t,due:dt(i.faellig),done:false,ts:Date.now(),wait:!!i.wartet_auf_kunde});save();created.push('Aufgabe '+k+': '+t+(dt(i.faellig)?' (bis '+fmtFull(dt(i.faellig))+')':''));return 'Aufgabe angelegt'}},
   {name:'anlegen_vertrag',description:'Legt einen Vertrag mit Ablaufdatum und Kündigungsfrist in Monaten zu einer Kundennummer an. sparte muss eine aus: '+SPARTEN.join(', ')+'.',inputSchema:{type:'object',properties:{kunde:{type:'string'},sparte:{type:'string'},ablauf:{type:'string',description:'Ablaufdatum YYYY-MM-DD'},frist_monate:{type:'number'},notiz:{type:'string'}},required:['kunde','sparte','ablauf']},
    execute:function(i){var k=chk(i),sp=SPARTEN.indexOf(i.sparte)>=0?i.sparte:'Sonstiges',ab=dt(i.ablauf);if(!ab)throw new Error('Ablaufdatum fehlt oder ist ungültig');db.vertraege.push({id:uid(),kunde:k,sparte:sp,ablauf:ab,frist:String(Number(i.frist_monate)||3),note:txt(i.notiz),ts:Date.now()});save();created.push('Vertrag '+k+': '+sp+', läuft '+fmtFull(ab)+' ab');return 'Vertrag angelegt'}},
   {name:'anlegen_termin',description:'Legt einen Termin zu einer Kundennummer an.',inputSchema:{type:'object',properties:{kunde:{type:'string'},datum:{type:'string',description:'YYYY-MM-DD'},sparte:{type:'string'},notiz:{type:'string'},nachbereitung:{type:'boolean',description:'To-do Nachbereitung am Termintag anlegen'}},required:['kunde','datum']},
    execute:function(i){var k=chk(i),d=dt(i.datum);if(!d)throw new Error('Datum fehlt oder ist ungültig');var sp=SPARTEN.indexOf(i.sparte)>=0?i.sparte:'';db.termine.push({id:uid(),kunde:k,datum:d,sparte:sp,note:txt(i.notiz),ts:Date.now()});if(i.nachbereitung)db.todos.push({id:uid(),kunde:k,text:'Nachbereitung'+(sp?' ('+sp+')':''),due:d,done:false,ts:Date.now()+1});save();created.push('Termin '+k+' am '+fmtFull(d));return 'Termin angelegt'}},
   {name:'anlegen_angebot',description:'Legt ein offenes Angebot mit Nachfass-Datum zu einer Kundennummer an.',inputSchema:{type:'object',properties:{kunde:{type:'string'},sparte:{type:'string'},nachfassen:{type:'string',description:'YYYY-MM-DD'},notiz:{type:'string'}},required:['kunde','sparte']},
    execute:function(i){var k=chk(i),sp=SPARTEN.indexOf(i.sparte)>=0?i.sparte:'Sonstiges',nf=dt(i.nachfassen)||addDaysIso(todayIso(),7);db.angebote.push({id:uid(),kunde:k,sparte:sp,status:'offen',nachfass:nf,note:txt(i.notiz),log:[],ts:Date.now()});save();created.push('Angebot '+k+': '+sp+', nachfassen '+fmtFull(nf));return 'Angebot angelegt'}},
   {name:'uebersicht',description:'Gibt die offenen Aufgaben, Rückmeldungen und Angebote (nur Kundennummern) als Text zurück. Nutzen bei Fragen wie „Was ist offen?".',
    execute:function(){var o=db.todos.filter(function(x){return !x.done}).slice(0,25).map(function(x){return (x.wait?'wartet auf Kunde: ':'Aufgabe: ')+x.kunde+' '+x.text+' (fällig '+(x.due||'offen')+')'});db.angebote.filter(isOpenAng).slice(0,15).forEach(function(a){o.push('Angebot: '+a.kunde+' '+a.sparte+' (nachfassen '+(a.nachfass||'offen')+')')});return o.length?o.join('\n'):'Nichts offen.'}}
  ];
}
function chPrompt(id){
  var T=todayIso(),wd=new Date().toLocaleDateString('de-DE',{weekday:'long'});
  if(id==='cp')return 'Du bist der Copilot in einem CRM für einen Versicherungsvertreter (R&V, Zusammenarbeit mit einer Volksbank). Heute ist '+wd+', der '+T+' (Format YYYY-MM-DD). Kunden gibt es nur als Nummern. Regeln: Antworte kurz auf Deutsch (Sie-Form nicht nötig, duze den Nutzer). Lege Daten ausschließlich mit den bereitgestellten Werkzeugen an, nie erfunden. Fehlt eine Pflichtangabe (Kundennummer, Ablaufdatum), frage kurz nach, statt zu raten. Relative Datumsangaben („Freitag", „in zwei Wochen") rechnest du ab heute in YYYY-MM-DD um. Eine Rückmeldung, auf die der Nutzer wartet, ist eine Aufgabe mit wartet_auf_kunde=true. Wenn ein Name, eine Telefonnummer oder E-Mail vorkommt, lege nichts an und bitte um die Kundennummer. Gib keine Rechts- oder Steuerberatung. Bestätige nach dem Anlegen in einem Satz, was angelegt wurde, und weise bei einer verpassten Kündigungsfrist darauf hin.';
  if(id==='wk'){
    var W=wissenList().map(function(w){return '### '+w.titel+'\n'+w.text}).join('\n\n').slice(0,150000);
    var AK=KN.filter(function(u){return !u.light&&u.s}).map(function(u){return '### Akademie: '+u.t+'\n'+u.s}).join('\n\n').slice(0,12000);W=W+(AK?'\n\n'+AK:'');
    return 'Du bist der Wissens-Assistent für einen Versicherungsvertreter. Beantworte Fragen nur anhand der folgenden Wissensdatenbank. Steht die Antwort nicht darin, sage das offen und schlage vor, einen Eintrag zu ergänzen; erfinde nichts. Nenne den Titel des Eintrags, aus dem du antwortest. Antworte kurz und auf Deutsch.\n\nWISSENSDATENBANK:\n'+(W||'(leer)');
  }
  return trPrompt();
}
function chSend(id){
  var c=CH[id];if(c.busy)return;
  if(id==='tr'&&!c.on){toast('Bitte zuerst das Gespräch starten');return}
  var ta=$('ci-'+id),text=ta?ta.value.trim():'';if(!text)return;
  var e=id==='tr'?'':checkText(text);if(e){toast(e);return}
  ta.value='';c.msgs.push({r:'u',t:text});chRun(id,null)
}
function chRun(id,extra){
  var c=CH[id];c.busy=true;c.live=false;chPaint(id);
  getSample(function(sample){
    if(!sample){c.busy=false;c.msgs.push({r:'s',t:'Die KI ist in dieser Ansicht nicht verfügbar. Öffne die Seite in Claude.'});chPaint(id);return}
    var turns=[];
    c.msgs.forEach(function(m){if(m.r==='u')turns.push({role:'user',content:m.t});else if(m.r==='a')turns.push({role:'assistant',content:m.t})});
    if(extra)turns.push({role:'user',content:extra});
    if(!turns.length||turns[0].role!=='user')turns.unshift({role:'user',content:'(Bitte beginnen)'});
    turns[0]={role:'user',content:chPrompt(id)+'\n\n---\n'+turns[0].content};
    if(turns[turns.length-1].role!=='user')turns.push({role:'user',content:'(Bitte fortfahren)'});
    var created=[],ctl=new AbortController();c.ctl=ctl;
    var opt={cache:false,signal:ctl.signal,modelTier:id==='cp'||id==='tr'?'quick':'default',onText:function(u){c.live=true;var m=c.msgs[c.msgs.length-1];if(!m||m.r!=='a'||!m.live){m={r:'a',t:'',live:true};c.msgs.push(m)}m.t=u.text;chPaint(id)}};
    if(id==='cp')opt.tools=cpTools(created);
    sample(turns,opt).then(function(res){
      c.busy=false;var m=c.msgs[c.msgs.length-1];if(m&&m.live){m.live=false;m.t=res.text}else c.msgs.push({r:'a',t:res.text});
      if(created.length)c.msgs.push({r:'s',t:'Angelegt:\n'+created.map(function(x){return '• '+x}).join('\n')});
      chPaint(id);if(id==='tr'){chSpeak(res.text);trNachKunde(c.msgs[c.msgs.length-1])}if(created.length)render();
    },function(er){
      c.busy=false;var m=c.msgs[c.msgs.length-1];if(m&&m.live){m.live=false;if(!er||er.code==='cancelled'){}}
      if(!er||er.code!=='cancelled')c.msgs.push({r:'s',t:chErr(er)});
      if(created.length)c.msgs.push({r:'s',t:'Angelegt:\n'+created.map(function(x){return '• '+x}).join('\n')});
      chPaint(id);if(created.length)render();
    });
  });
}
function wkEdit(){
  var h='<h3>Wissensdatenbank</h3><p class="sub">Eigene Einträge, keine Kundendaten. Der Chat antwortet nur daraus.</p>';
  var L=wissenList();
  h+=L.length?'<div class="list">'+L.map(function(w){return '<div class="row soon"><div class="body"><div class="txt"><b>'+esc(w.titel)+'</b></div><div class="sub">'+esc(w.text.slice(0,140))+(w.text.length>140?' ...':'')+'</div><div class="actions"><button class="btn small danger" data-act="wk-del" data-id="'+w.id+'" data-confirm="Eintrag löschen?">Löschen</button></div></div></div>'}).join('')+'</div>':'<div class="empty">Noch keine Einträge.</div>';
  h+='<label for="wk-t">Titel</label><input type="text" id="wk-t" maxlength="80" placeholder="z. B. Einwand: Ich habe schon eine Rente"><label for="wk-x">Inhalt</label><textarea id="wk-x" rows="6" maxlength="4000" placeholder="Wissen, Argumente, Abläufe"></textarea><div class="btnrow"><button class="btn" data-act="close">Schließen</button><button class="btn primary" data-act="wk-add">Eintrag speichern</button></div>';
  openSheet(h);
}
function wkAdd(){
  var t=$('wk-t').value.trim(),x=$('wk-x').value.trim();if(!t||!x){toast('Titel und Inhalt ausfüllen');return}
  var e=checkText(t)||checkText(x);if(e){toast(e);return}
  if(!db.settings)db.settings={};if(!db.settings.wissen)db.settings.wissen=[];db.settings.wissen.push({id:uid(),titel:t,text:x,ts:Date.now()});save();wkEdit();render();toast('Gespeichert');
}

/* ================= Suche über alles ================= */
function searchAll(q){
  q=String(q||'').trim().toLowerCase();if(q.length<1)return [];
  var R=[];function has(){for(var i=0;i<arguments.length;i++)if(String(arguments[i]||'').toLowerCase().indexOf(q)>-1)return true;return false}
  allKunden().forEach(function(n){if(has(n))R.push({g:'Nummern',t:n,s:'Nummer öffnen',act:'open-kunde',k:n})});
  db.todos.forEach(function(x){if(has(x.kunde,x.text))R.push({g:'Aufgaben',t:x.kunde+' · '+x.text,s:(x.done?'erledigt':x.wait?'wartet auf Kunde':'offen'),act:'open-todo',id:x.id})});
  db.angebote.forEach(function(a){if(has(a.kunde,a.sparte,a.note))R.push({g:'Angebote',t:a.kunde+' · '+a.sparte,s:STATUS[a.status],act:'open-ang',id:a.id})});
  db.beratungen.forEach(function(b){if(has(b.kunde,b.bereich,b.note,b.grund,b.ber,b.fil))R.push({g:'Beratungen',t:b.kunde+' · '+b.bereich,s:ergLabel(b)+' · '+fmtDate(b.datum),act:'open-ber',id:b.id})});
  db.vertraege.forEach(function(v){if(has(v.kunde,v.sparte,v.note))R.push({g:'Verträge',t:v.kunde+' · '+v.sparte,s:'läuft ab '+fmtDate(v.ablauf),act:'open-vertrag',id:v.id})});
  var WR=[];lexAll().forEach(function(e){if(has(e.titel,e.text,e.tags.join(' ')))WR.push({g:'Beraterwissen',t:e.titel,s:lexSparteName(e.sparte)+' · '+(LEXTYP[e.typ]||''),act:'lex-open',id:e.id})});
  [['Neue Beratung','beratung'],['Copilot','copilot'],['Training','training'],['Pipeline','pipeline'],['Aufgaben','aufgaben'],['Beraterwissen','wissen'],['Lexikon','wissen'],['Wissens-Chat','wissenki'],['Start','start'],['Kunden','kunden']].forEach(function(a){if(has(a[0]))R.push({g:'Gehe zu',t:a[0],s:'',act:'search-go',to:a[1]})});
  return R.slice(0,30).concat(WR.slice(0,10));
}
function searchHtml(q){
  var R=searchAll(q);if(!q.trim())return '<p class="hint-t">Tippe eine Nummer, ein Stichwort oder einen Bereich. Es wird in Kundennummern, Aufgaben, Angeboten, Beratungen, Verträgen und im Beraterwissen gesucht.</p>';
  if(!R.length)return '<p class="hint-t">Nichts gefunden.</p>';
  var g='',h='';R.forEach(function(r){if(r.g!==g){g=r.g;h+='<div class="pl" style="margin-top:12px">'+g+'</div>'}
    h+='<button class="srr" data-act="search-go" data-to="'+(r.to||'')+'" data-do="'+r.act+'" data-id="'+esc(r.id||'')+'" data-k="'+esc(r.k||'')+'"><b>'+esc(r.t)+'</b>'+(r.s?'<small>'+esc(r.s)+'</small>':'')+'</button>'});
  return h;
}
function openSearch(){
  openSheet('<h3>Suche</h3><input type="text" class="search" id="sr-q" placeholder="Nummer oder Stichwort" autocomplete="off" aria-label="Suche"><div id="sr-list">'+searchHtml('')+'</div>');
  setTimeout(function(){var e=$('sr-q');if(e)e.focus()},50);
}

/* ================= Kündigungsschreiben ================= */
var kuMode='regulaer';
function kuText(v,mode){
  var sp=v.sparte||'Versicherung',ab=fmtFull(v.ablauf);
  var t='[Name und Anschrift des Versicherungsnehmers]\n\n[Name und Anschrift des Versicherers]\n\n[Ort], [Datum]\n\n';
  t+='Kündigung meiner '+sp+'-Versicherung\nVersicherungsschein-Nr.: [Nummer laut Police]\n\n';
  t+='Sehr geehrte Damen und Herren,\n\n';
  if(mode==='sonder')t+='hiermit kündige ich den oben genannten Vertrag außerordentlich wegen [Grund, z. B. Beitragserhöhung vom ...] zum nächstmöglichen Zeitpunkt. Hilfsweise kündige ich ordentlich zum '+ab+'.\n\n';
  else if(mode==='naechst')t+='hiermit kündige ich den oben genannten Vertrag ordentlich zum nächstmöglichen Zeitpunkt.\n\n';
  else t+='hiermit kündige ich den oben genannten Vertrag ordentlich zum '+ab+', hilfsweise zum nächstmöglichen Zeitpunkt.\n\n';
  t+='Bitte bestätigen Sie mir die Kündigung und das Vertragsende schriftlich.\n\nMit freundlichen Grüßen\n\n[Unterschrift]';
  return t;
}
function openKuend(id){
  var v=db.vertraege.find(function(x){return x.id===id});if(!v)return;
  var i=vtInfo(v);if(i.st==='verpasst'&&kuMode==='regulaer')kuMode='naechst';
  var M=[['regulaer','Zum Ablauf'],['naechst','Nächstmöglich'],['sonder','Sonderkündigung']];
  var h='<h3>Kündigungsschreiben</h3><p class="sub"><span class="tag">'+esc(v.kunde)+'</span> '+esc(v.sparte)+', läuft ab '+fmtFull(v.ablauf)+'</p>';
  h+='<div class="chips">'+M.map(function(m){return '<button class="chip" data-act="ku-mode" data-id="'+v.id+'" data-m="'+m[0]+'" aria-pressed="'+(kuMode===m[0])+'">'+m[1]+'</button>'}).join('')+'</div>';
  h+='<div class="letterbox"><pre>'+esc(kuText(v,kuMode))+'</pre></div>';
  h+='<p class="hint-t">Namen und Anschriften trägst du erst im Brief ein. Hier werden keine Kundendaten gespeichert. Richtwert: Die Kündigung muss rechtzeitig beim Versicherer eingehen. Ob ein Sonderkündigungsrecht besteht, hängt von Police und Bedingungen ab. '+(i.st==='verpasst'?'Die Frist zum Ablauf ist verpasst ('+fmtFull(i.bis)+'). ':'')+'</p>';
  h+='<div class="note ok" style="margin-top:8px"><b>Verkaufschance:</b> Fällt der Vertrag weg, jetzt ein Angebot für '+esc(v.sparte)+' anbieten und einen Termin vereinbaren.</div>';
  h+='<div class="btnrow"><button class="btn" data-act="ku-follow" data-id="'+v.id+'">Aufgabe: Bestätigung nachfassen</button><button class="btn primary" data-act="ku-copy" data-id="'+v.id+'">Kopieren</button></div>';
  openSheet(h);
}

/* ================= Nachbereitung per Sprachnotiz ================= */
var nb={kunde:'',text:'',plan:null,busy:false,err:''};
function nbSheet(){
  var h='<h3>Nachbereitung</h3><p class="sub">Sprich oder schreibe kurz, wie der Termin lief. Daraus entstehen Beratung, Ergebnis und Aufgaben. Nur Kundennummern, keine Namen.</p>';
  h+='<label for="nb-k">Kundennummer</label><input type="text" id="nb-k" maxlength="20" value="'+esc(nb.kunde)+'" placeholder="z. B. 10482" autocomplete="off">';
  h+='<label for="nb-t">Was war? <span class="opt">Bereich, Ergebnis, was zugesagt wurde, bis wann</span></label><textarea id="nb-t" rows="5" maxlength="1500" placeholder="z. B. Altersvorsorge besprochen, wollte nochmal mit Partnerin sprechen, Rückmeldung bis Freitag. Hausrat läuft zum 1.1. ab.">'+esc(nb.text)+'</textarea>';
  h+='<div class="btnrow">'+(speechOk()?'<button class="btn" data-act="nb-mic" id="nb-mic">'+ico('mic',20)+' Sprechen</button>':'')+'<button class="btn primary" data-act="nb-run"'+(nb.busy?' disabled':'')+'>'+(nb.busy?'Wertet aus ...':'Auswerten')+'</button></div>';
  if(nb.err)h+='<p class="err" role="alert">'+esc(nb.err)+'</p>';
  if(nb.plan)h+=nbPlanHtml();
  openSheet(h);
}
function nbPlanHtml(){
  var P=nb.plan,h='<div class="sh2">Vorschlag zum Übernehmen</div><div class="nbp">';
  if(P.beratung)h+='<label class="nbr"><input type="checkbox" data-nb="ber" checked> <span><b>Beratung</b> '+esc(P.beratung.bereich)+' · '+esc(ergName(P.beratung.erg))+(P.beratung.erg==='verloren'&&P.beratung.grund?' ('+esc(P.beratung.grund)+')':'')+'<small>'+esc(P.beratung.notiz||'')+'</small></span></label>';
  (P.aufgaben||[]).forEach(function(a,i){h+='<label class="nbr"><input type="checkbox" data-nb="auf'+i+'" checked> <span><b>'+(a.wartet?'Wartet auf Kunde':'Aufgabe')+'</b> '+esc(a.text)+'<small>fällig '+(a.faellig?fmtFull(a.faellig):'offen')+'</small></span></label>'});
  (P.vertraege||[]).forEach(function(v,i){h+='<label class="nbr"><input type="checkbox" data-nb="ver'+i+'" checked> <span><b>Vertrag</b> '+esc(v.sparte)+' läuft ab '+fmtFull(v.ablauf)+'<small>Frist '+esc(String(v.frist))+' Monate</small></span></label>'});
  if(P.chance)h+='<label class="nbr"><input type="checkbox" data-nb="chance" checked> <span><b>Chance</b> '+esc(P.chance)+'<small>wird als Aufgabe in 30 Tagen angelegt</small></span></label>';
  h+='</div><div class="btnrow"><button class="btn" data-act="close">Verwerfen</button><button class="btn primary" data-act="nb-apply">Übernehmen</button></div>';
  return h;
}
function ergName(e){var o=ERG.filter(function(x){return x[0]===e})[0];return o?o[1]:'Offen'}
function nbRun(){
  var k=($('nb-k').value||'').trim().toUpperCase(),t=($('nb-t').value||'').trim();nb.kunde=k;nb.text=t;nb.err='';
  var e=checkKunde(k)||(!k?'Bitte eine Kundennummer eintragen.':'')||(!t?'Bitte kurz beschreiben, wie der Termin lief.':'')||checkText(t);
  if(e){nb.err=e;nbSheet();return}
  nb.busy=true;nb.plan=null;nbSheet();
  getSample(function(sample){
    if(!sample){nb.busy=false;nb.err='Die KI ist in dieser Ansicht nicht verfügbar. Öffne die Seite in Claude.';nbSheet();return}
    var T=todayIso();
    var prompt='Du bereitest für einen Versicherungsvertreter die Nachbereitung eines Kundentermins auf. Heute ist '+T+'. Lies die Notiz und antworte NUR mit einem JSON-Objekt dieser Form:\n{"beratung":{"bereich":"Altersvorsorge|Geldanlage|Krankenversicherung|Sachversicherungen","erg":"offen|angebot|abschluss|verloren","grund":"Preis|Vertrag läuft noch|Kein Termin oder keine Zeit|Bindung oder Vertrauen|Bankberater|Sonstiges oder leer","notiz":"1 bis 2 Sätze, ohne Namen und Kontaktdaten"},"aufgaben":[{"text":"kurz","faellig":"YYYY-MM-DD oder leer","wartet":true/false}],"vertraege":[{"sparte":"'+SPARTEN.join('|')+'","ablauf":"YYYY-MM-DD","frist":3}],"chance":"ein Satz: welches Thema beim Kunden als nächstes Verkaufschance sinnvoll ist, oder leer"}\nRegeln: beratung weglassen (null), wenn kein Beratungsgespräch stattfand. erg=verloren nur, wenn der Kunde klar ablehnte, dann grund setzen. wartet=true, wenn auf eine Rückmeldung des Kunden gewartet wird. Relative Datumsangaben ab heute umrechnen. Nichts erfinden, was nicht in der Notiz steht. Keine Namen, Telefonnummern oder E-Mails ausgeben.\n\nNOTIZ (Kundennummer '+k+'):\n'+t;
    sample.json(prompt,{modelTier:'default'}).then(function(r){
      nb.busy=false;
      if(!r||typeof r!=='object'){nb.err='Die Auswertung war nicht lesbar. Bitte kürzer formulieren.';nbSheet();return}
      var P={beratung:null,aufgaben:[],vertraege:[],chance:''};
      function dt(v){v=String(v||'');return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:''}
      function cl(v){v=String(v||'').trim().slice(0,200);return checkText(v)?'':v}
      if(r.beratung&&typeof r.beratung==='object'){var be=r.beratung;P.beratung={bereich:BEREICHE.indexOf(be.bereich)>=0?be.bereich:BEREICHE[0],erg:['offen','angebot','abschluss','verloren'].indexOf(be.erg)>=0?be.erg:'offen',grund:GRUENDE.indexOf(be.grund)>=0?be.grund:'',notiz:cl(be.notiz)};if(P.beratung.erg==='verloren'&&!P.beratung.grund)P.beratung.grund='Sonstiges'}
      (Array.isArray(r.aufgaben)?r.aufgaben:[]).slice(0,6).forEach(function(a){var x=cl(a&&a.text);if(x)P.aufgaben.push({text:x,faellig:dt(a.faellig),wartet:!!a.wartet})});
      (Array.isArray(r.vertraege)?r.vertraege:[]).slice(0,4).forEach(function(v){var ab=dt(v&&v.ablauf);if(ab)P.vertraege.push({sparte:SPARTEN.indexOf(v.sparte)>=0?v.sparte:'Sonstiges',ablauf:ab,frist:[1,2,3,6].indexOf(Number(v.frist))>=0?Number(v.frist):3})});
      P.chance=cl(r.chance);
      if(!P.beratung&&!P.aufgaben.length&&!P.vertraege.length&&!P.chance){nb.err='Daraus konnte ich nichts ableiten. Bitte genauer beschreiben.';nbSheet();return}
      nb.plan=P;nbSheet();
    },function(er){nb.busy=false;nb.err=chErr(er);nbSheet()});
  });
}
function nbApply(){
  var P=nb.plan,k=nb.kunde,now=Date.now(),n=0;if(!P)return;
  function on(key){var el=document.querySelector('[data-nb="'+key+'"]');return el&&el.checked}
  if(P.beratung&&on('ber')){var b={id:uid(),kunde:k,bereich:P.beratung.bereich,datum:todayIso(),note:P.beratung.notiz,wv:'',erg:P.beratung.erg,grund:P.beratung.erg==='verloren'?P.beratung.grund:'',ber:'',fil:'',ts:now};db.beratungen.push(b);n++}
  P.aufgaben.forEach(function(a,i){if(on('auf'+i)){db.todos.push({id:uid(),kunde:k,text:a.text,due:a.faellig,done:false,ts:now+i,wait:!!a.wartet});n++}});
  P.vertraege.forEach(function(v,i){if(on('ver'+i)){db.vertraege.push({id:uid(),kunde:k,sparte:v.sparte,ablauf:v.ablauf,frist:String(v.frist),note:'',ts:now+i});n++}});
  if(P.chance&&on('chance')){db.todos.push({id:uid(),kunde:k,text:P.chance,due:addDaysIso(todayIso(),30),done:false,ts:now+9,wait:false});n++}
  save();nb={kunde:'',text:'',plan:null,busy:false,err:''};closeSheet();render();toast(n+(n===1?' Eintrag angelegt':' Einträge angelegt'));
}
function nbMic(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  if(recog){try{recog.stop()}catch(e){}recog=null;return}
  try{recog=new SR();recog.lang='de-DE';recog.interimResults=false;recog.continuous=true;
    var b=$('nb-mic');if(b)b.classList.add('rec');
    recog.onresult=function(ev){var t='';for(var i=ev.resultIndex;i<ev.results.length;i++)if(ev.results[i].isFinal)t+=ev.results[i][0].transcript+' ';var ta=$('nb-t');if(ta)ta.value=(ta.value?ta.value+' ':'')+t.trim()};
    recog.onend=function(){recog=null;var b2=$('nb-mic');if(b2)b2.classList.remove('rec')};
    recog.onerror=function(){recog=null;var b3=$('nb-mic');if(b3)b3.classList.remove('rec');toast('Mikrofon nicht verfügbar')};
    recog.start();
  }catch(e){recog=null;toast('Mikrofon nicht verfügbar')}
}

/* ================= Einwandtrainer ================= */
var EINW=['Das ist mir zu teuer.','Ich habe schon eine Versicherung.','Ich muss das erst mit meinem Partner besprechen.','Dafür habe ich gerade keine Zeit.','Ich überlege es mir und melde mich.','Meine Bank macht das doch alles.','Ich brauche das nicht, die gesetzliche Rente reicht.','Ich möchte erst Angebote von anderen vergleichen.'];
var dr={einw:'',res:null,busy:false,err:'',streak:0,hist:[]};
function drHtml(){
  var h='<div class="plbar">'+EINW.map(function(e,i){return '<button class="chip" data-act="dr-pick" data-id="'+i+'" aria-pressed="'+(dr.einw===e)+'">'+esc(e.replace(/\.$/,''))+'</button>'}).join('')+'<button class="chip" data-act="dr-rand">Zufällig</button></div>';
  if(!dr.einw)return h+'<p class="hint-t">Wähle einen Einwand oder lass dir einen zeigen. Du antwortest so, wie du es dem Kunden sagen würdest. Danach bekommst du Rückmeldung und eine Musterantwort.</p>'+drStats();
  h+='<div class="cm a" style="max-width:100%;font-size:18px"><b>Kunde:</b> „'+esc(dr.einw)+'"</div>';
  h+='<label for="dr-a">Deine Antwort</label><textarea id="dr-a" rows="4" maxlength="1200" placeholder="Wie reagierst du?"></textarea>';
  h+='<div class="btnrow">'+(speechOk()?'<button class="btn" data-act="dr-mic" id="dr-mic">'+ico('mic',20)+' Sprechen</button>':'')+'<button class="btn primary" data-act="dr-run"'+(dr.busy?' disabled':'')+'>'+(dr.busy?'Bewertet ...':'Bewerten')+'</button></div>';
  if(dr.err)h+='<p class="err" role="alert">'+esc(dr.err)+'</p>';
  if(dr.res){var r=dr.res;h+='<div class="nbp" style="margin-top:12px"><div class="nbr"><span><b>Bewertung: '+r.punkte+' von 5</b><small>'+esc(r.gut)+'</small></span></div><div class="nbr"><span><b>Besser machen</b><small>'+esc(r.besser)+'</small></span></div><div class="nbr"><span><b>Musterantwort</b><small style="font-size:14.5px;color:var(--ink)">'+esc(r.muster)+'</small></span></div></div><div class="btnrow"><button class="btn" data-act="dr-save">In Wissen speichern</button><button class="btn primary" data-act="dr-rand">Nächster Einwand</button></div>'}
  return h+drStats();
}
function drStats(){
  if(!dr.hist.length)return '';
  var a=dr.hist.reduce(function(x,y){return x+y},0)/dr.hist.length;
  return '<p class="hint-t" style="margin-top:12px">Diese Sitzung: '+dr.hist.length+(dr.hist.length===1?' Antwort':' Antworten')+', Durchschnitt '+(Math.round(a*10)/10).toString().replace('.',',')+' von 5.</p>';
}
function drRun(){
  var a=($('dr-a').value||'').trim();dr.err='';
  if(!a){dr.err='Bitte zuerst eine Antwort geben.';render();return}
  var e=checkText(a);if(e){dr.err=e;render();return}
  dr.busy=true;dr.res=null;render();var ta=$('dr-a');if(ta)ta.value=a;
  getSample(function(sample){
    if(!sample){dr.busy=false;var _l=exLocal(a,KN.filter(function(x){return x.e===dr.einw})[0]);dr.res={punkte:3,gut:_l.gut,besser:_l.besser,muster:_l.alt};render();return}
    var pr='Du bist Verkaufstrainer für einen Versicherungsvertreter (Zusammenarbeit mit einer Volksbank). Der Kunde sagt: „'+dr.einw+'". Der Berater antwortet: „'+a+'". Bewerte die Antwort streng aber fair nach: Verständnis zeigen, offene Frage stellen, Nutzen statt Preis, nächster Schritt. Antworte NUR als JSON: {"punkte":1-5,"gut":"1 Satz, was gut war","besser":"1 bis 2 Sätze, was konkret besser geht","muster":"eine kurze, natürliche Musterantwort in 2 bis 3 Sätzen, Du-Form des Beraters gegenüber dem Kunden mit Sie"}. Keine Floskeln, keine Namen.';
    sample.json(pr,{modelTier:'quick',cache:false}).then(function(r){
      dr.busy=false;var pt=Math.max(1,Math.min(5,Math.round(Number(r&&r.punkte)||3)));
      dr.res={punkte:pt,gut:String(r&&r.gut||'').slice(0,300),besser:String(r&&r.besser||'').slice(0,400),muster:String(r&&r.muster||'').slice(0,500)};dr.hist.push(pt);render();
    },function(er){dr.busy=false;dr.err=chErr(er);render()});
  });
}
function drMic(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  if(recog){try{recog.stop()}catch(e){}recog=null;return}
  try{recog=new SR();recog.lang='de-DE';recog.interimResults=false;recog.continuous=true;var b=$('dr-mic');if(b)b.classList.add('rec');
    recog.onresult=function(ev){var t='';for(var i=ev.resultIndex;i<ev.results.length;i++)if(ev.results[i].isFinal)t+=ev.results[i][0].transcript+' ';var ta=$('dr-a');if(ta)ta.value=(ta.value?ta.value+' ':'')+t.trim()};
    recog.onend=function(){recog=null;var b2=$('dr-mic');if(b2)b2.classList.remove('rec')};recog.onerror=function(){recog=null;toast('Mikrofon nicht verfügbar')};recog.start();
  }catch(e){recog=null;toast('Mikrofon nicht verfügbar')}
}

/* ================= Rechtsstand (Quartalsprüfung) ================= */
function rechtRows(){
  function n(v,d){return v.toLocaleString('de-DE',{minimumFractionDigits:d||0,maximumFractionDigits:d||0})}
  return [
   ['Versicherungspflichtgrenze (JAEG)',n(KV.jaeg)+' € pro Jahr','Rechengrößen der Sozialversicherung','Wechsel in die PKV, GKV-Pflicht'],
   ['Beitragsbemessungsgrenze Kranken- und Pflegeversicherung',n(KV.bbg)+' € pro Jahr','Rechengrößen der Sozialversicherung','GKV-Beitrag, PKV-Zuschuss'],
   ['Allgemeiner Beitragssatz GKV',n(KV.gkv,1)+' %','Bundesgesundheitsministerium, GKV-Spitzenverband','GKV-Beitrag'],
   ['Durchschnittlicher Zusatzbeitrag',n(KV.zus,1)+' %','Bundesgesundheitsministerium (Bekanntmachung)','GKV-Beitrag'],
   ['Pflegeversicherung gesamt',n(KV.pvGes,1)+' %, Arbeitnehmeranteil '+n(KV.pvAn,2)+' %','Bundesgesundheitsministerium','GKV-Beitrag'],
   ['Höchster Arbeitgeberzuschuss PKV',n(KV.agMax,2)+' € pro Monat','GKV-Spitzenverband, Rechengrößen','PKV-Nettobeitrag'],
   ['Höchstbetrag Basisrente (Rürup), allein / zusammen',n(RURUP_MAX)+' € / '+n(RURUP_MAX2)+' €','Bundesfinanzministerium, Einkommensteuergesetz','Rürup-Steuerersparnis'],
   ['Abgeltungsteuer inkl. Solidaritätszuschlag',REGEL.abg,'Einkommensteuergesetz','Fondspolice, Geldanlage'],
   ['Freibeträge Erbschaftsteuer (Ehegatte / Kind / Enkel)','500.000 € / 400.000 € / 200.000 €','Erbschaftsteuergesetz §16, Bundesfinanzministerium','Vorsorge-Check'],
   ['Eigenanteil Pflegeheim, erstes Jahr (Durchschnitt)',n(VPK.eigenanteil)+' € pro Monat','vdek, jährliche Auswertung (Stand 1. Januar)','Vorsorge-Check, Pflege'],
   ['Pflegegeld Pflegegrad 2 bis 5',REGEL.pflege.geld.slice(2).map(function(x){return n(x)}).join(' / ')+' € pro Monat','SGB XI § 37, Bundesgesundheitsministerium','Pflege'],
   ['Pflegesachleistung Pflegegrad 2 bis 5',REGEL.pflege.sach.slice(2).map(function(x){return n(x)}).join(' / ')+' € pro Monat','SGB XI § 36','Pflege'],
   ['Vollstationär Pflegegrad 2 bis 5',REGEL.pflege.heim.slice(2).map(function(x){return n(x)}).join(' / ')+' € pro Monat','SGB XI § 43','Pflege'],
   ['Leistungszuschlag im Heim nach 1 / 2 / 3 / 4 Jahren',REGEL.pflege.zuschlag.join(' / ')+' % des pflegebedingten Eigenanteils','SGB XI § 43c','Pflege']
  ];
}
function rechtDue(){var c=db.settings&&db.settings.rechtPruef;if(!c)return true;return diffDays(c,todayIso())>=90}
function openRecht(){
  var c=db.settings&&db.settings.rechtPruef;
  var h='<h3>Rechtsstand</h3><p class="sub">Diese Werte stecken in den Rechnern. Sie ändern sich meist zum Jahreswechsel, einzelne auch unterjährig.</p>';
  h+='<div class="note'+(rechtDue()?'':' ok')+'">'+(c?'Zuletzt geprüft am '+fmtFull(c)+'. Nächste Prüfung ab '+fmtFull(addMonthsIso(c,3))+'.':'Noch nie geprüft.')+'</div>';
  h+='<div class="list">'+rechtRows().map(function(r){return '<div class="row soon"><div class="body"><div class="txt"><b>'+esc(r[0])+'</b></div><div class="sub" style="font-size:15px;color:var(--ink)">'+esc(r[1])+'</div><div class="sub">Quelle prüfen: '+esc(r[2])+' · wirkt auf: '+esc(r[3])+'</div></div></div>'}).join('')+'</div>';
  h+='<p class="hint-t">Prüfung: Werte mit der jeweiligen Quelle vergleichen. Weichen sie ab, gib mir (Claude) Bescheid, dann passe ich die Rechner an. Das ist keine Rechtsberatung.</p>';
  h+='<div class="btnrow"><button class="btn" data-act="close">Schließen</button><button class="btn primary" data-act="recht-ok">Werte als geprüft markieren</button></div>';
  openSheet(h);
}
function ergLabel(b){var e=b.erg||'offen',o=ERG.filter(function(x){return x[0]===e})[0];return (o?o[1]:'Offen')+(e==='verloren'&&b.grund?': '+b.grund:'')}
var STATUS={offen:'Offen',nachgefasst:'Nachgefasst',abgeschlossen:'Abgeschlossen',abgelehnt:'Abgelehnt'};
var KEY='nachbereitung.v1';
var DAY=86400000;
var db=emptyDb();
var storageOk=true,dl=null;
var tab='start',angFilter='offen',kundeQuery='',kundeAkt='';
var addState=null,angDraft=null,todoDraft=null,berDraft=null,sheetFn=null,toastTimer=null;

function emptyDb(){return {v:3,vertraege:[],todos:[],angebote:[],termine:[],beratungen:[],laufend:[],lexikon:null,training:[],dismissed:{},lastBackup:0,settings:{}}}
function normalize(d){
  if(!d||!Array.isArray(d.todos)||!Array.isArray(d.angebote)||!Array.isArray(d.termine))return null;
  d.v=3;
  if(!Array.isArray(d.laufend))d.laufend=[];
  if(!Array.isArray(d.training))d.training=[];
  if(!d.lexikon||typeof d.lexikon!=='object'||!Array.isArray(d.lexikon.eintraege))d.lexikon=null;
  if(!Array.isArray(d.beratungen))d.beratungen=[];
  if(!Array.isArray(d.vertraege))d.vertraege=[];
  if(!d.dismissed||typeof d.dismissed!=='object')d.dismissed={};
  if(!d.lastBackup)d.lastBackup=0;
  if(!d.settings||typeof d.settings!=='object')d.settings={};
  return d;
}

/* ---------- helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function pad(n){return String(n).padStart(2,'0')}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function todayIso(){return iso(new Date())}
function addDaysIso(s,n){var p=s.split('-').map(Number);return iso(new Date(p[0],p[1]-1,p[2]+n))}
function endOfWeekIso(){var k=(new Date().getDay()+6)%7;return addDaysIso(todayIso(),6-k)}
function diffDays(a,b){var A=a.split('-').map(Number),B=b.split('-').map(Number);return Math.round((Date.UTC(B[0],B[1]-1,B[2])-Date.UTC(A[0],A[1]-1,A[2]))/DAY)}
function toTs(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]).getTime()}
function fmtDate(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'})}
function fmtFull(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'})}
function rel(s){var n=diffDays(todayIso(),s);if(n===0)return 'heute';if(n===1)return 'morgen';if(n===-1)return 'gestern';if(n<0)return 'seit '+(-n)+' Tagen';return 'in '+n+' Tagen'}
function whenLabel(s){return s?fmtDate(s)+', '+rel(s):'ohne Datum'}
function $(id){return document.getElementById(id)}
function isOpenAng(a){return a.status==='offen'||a.status==='nachgefasst'}
function sparteBereich(s){
  if(s==='Leben und Rente'||s==='Berufsunfähigkeit')return 'Altersvorsorge';
  if(s==='Kranken')return 'Krankenversicherung';
  if(!s||s==='Sonstiges')return '';
  return 'Sachversicherungen';
}

/* ---------- storage ---------- */
function load(){
  try{
    var r=localStorage.getItem(KEY);
    if(r){var d=normalize(JSON.parse(r));if(d)db=d}
  }catch(e){storageOk=false}
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(db,ohnePrivat));storageOk=true}catch(e){storageOk=false}
  renderBanner();
}
function hasData(){return db.todos.length+db.angebote.length+db.termine.length+db.beratungen.length+db.vertraege.length>0}
function renderBanner(){
  var h='';
  if(!storageOk)h+='<div class="note">Der Speicher dieses Browsers ist nicht verfügbar. Einträge gehen verloren, sobald du die Seite schließt. Nutze „Sichern“ im Schild-Menü.</div>';
  else if(hasData()){
    var age=db.lastBackup?Math.floor((Date.now()-db.lastBackup)/DAY):null;
    if(age===null)h+='<div class="note">Du hast noch keine Sicherung gemacht.<br><button class="btn small" data-act="menu">Jetzt sichern</button></div>';
    else if(age>=7)h+='<div class="note">Die letzte Sicherung ist '+age+' Tage alt.<br><button class="btn small" data-act="menu">Jetzt sichern</button></div>';
  }
  if(storageOk&&hasData()&&rechtDue()&&tab==='start')h+='<div class="note">Die Rechenwerte (Grenzen, Beitragssätze) sind zu prüfen. Das geht einmal im Quartal.<br><button class="btn small" data-act="recht-open">Rechtsstand ansehen</button></div>';
  $('banner').innerHTML=h;
}

/* ---------- validation ---------- */
function checkKunde(v){
  if(!v)return 'Bitte eine Kundennummer eintragen.';
  if(v.length>20)return 'Die Nummer ist zu lang (höchstens 20 Zeichen).';
  if(!/^[A-Za-z0-9._\-]+$/.test(v))return 'Nur Zahlen, Buchstaben und Bindestrich. Keine Namen.';
  if(/^[A-Za-z]{4,}$/.test(v))return 'Das sieht wie ein Name aus. Bitte eine Nummer verwenden.';
  return '';
}
function checkText(v){
  if(!v)return '';
  var bad='Das sieht nach persönlichen Daten aus (E-Mail, Telefon, Geburtsdatum oder Adresse). Bitte entfernen.';
  if(/[\w.+-]+@[\w-]+\.[\w.-]+/.test(v))return bad;
  if(/\+?\d[\d\s\/\-]{7,}\d/.test(v))return bad;
  if(/\b\d{1,2}\.\s?\d{1,2}\.\s?19\d{2}\b/.test(v))return bad;
  if(/\bgeb(\.|oren)/i.test(v))return bad;
  if(/\w*(straße|strasse|str\.|weg|allee|platz|gasse)\s*\d+/i.test(v))return bad;
  return '';
}

/* ---------- sheet / toast ---------- */
function openSheet(html,fn){$('sheetbody').innerHTML=html;$('sheet').hidden=false;sheetFn=fn||null}
function closeSheet(){$('sheet').hidden=true;$('sheetbody').innerHTML='';sheetFn=null;addState=null;angDraft=null;todoDraft=null;berDraft=null}
function toast(msg,undo){
  clearTimeout(toastTimer);
  $('toastmsg').textContent=msg;
  var b=$('toastbtn');
  if(undo){b.hidden=false;b.textContent='Rückgängig';b.onclick=function(){undo();$('toast').hidden=true}}
  else{b.hidden=true;b.onclick=null}
  $('toast').hidden=false;
  toastTimer=setTimeout(function(){$('toast').hidden=true},5000);
}
function opts(list,sel,withNone){
  var h=withNone?'<option value="">Keine Angabe</option>':'';
  list.forEach(function(s){h+='<option'+(s===sel?' selected':'')+'>'+esc(s)+'</option>'});
  return h;
}
function dateChips(target,list){
  return '<div class="chips">'+list.map(function(c){return '<button class="chip" data-act="setdate" data-target="'+target+'" data-days="'+c[0]+'">'+c[1]+'</button>'}).join('')+'</div>';
}
function winChips(target){
  return '<div class="chips">'+[['now','Sofort'],['week','Diese Woche'],['two','In 2 Wochen']].map(function(c){return '<button class="chip" data-act="setwin" data-target="'+target+'" data-win="'+c[0]+'">'+c[1]+'</button>'}).join('')+'</div>';
}

/* ---------- file output ---------- */
function exportFile(name,text){
  if(dl){
    dl.save({filename:name,data:text}).then(function(){toast('Datei gespeichert')},function(e){
      if(e&&e.code==='declined')return;
      fallbackCopy(name,text);
    });
  }else fallbackCopy(name,text);
}
function fallbackCopy(name,text){
  openSheet('<h3>'+esc(name)+'</h3><p class="hint-t" style="font-size:14px">Direktes Speichern ist hier nicht verfügbar. Kopiere den Text und lege ihn in deinem Kundenordner ab.</p>'+
    '<textarea id="fb-text" readonly rows="8">'+esc(text)+'</textarea><div class="btnrow"><button class="btn" data-act="close">Schließen</button><button class="btn primary" data-act="fb-copy">Kopieren</button></div>');
}
function copyText(text,okMsg){
  var done=function(ok){toast(ok?okMsg:'Text markiert. Jetzt lange drücken und kopieren.')};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){done(true)},function(){try{done(document.execCommand('copy'))}catch(e){done(false)}});
  }else{try{done(document.execCommand('copy'))}catch(e){done(false)}}
}

/* ---------- hints (local rules only) ---------- */
function lastActivity(k){
  var m=0,t=todayIso();
  db.termine.forEach(function(x){if(x.kunde===k&&x.datum<=t)m=Math.max(m,toTs(x.datum))});
  db.beratungen.forEach(function(x){if(x.kunde===k&&x.datum<=t)m=Math.max(m,toTs(x.datum))});
  db.todos.forEach(function(x){if(x.kunde===k&&x.doneAt)m=Math.max(m,x.doneAt)});
  db.angebote.forEach(function(x){if(x.kunde===k){m=Math.max(m,x.ts||0);(x.log||[]).forEach(function(l){m=Math.max(m,toTs(l))})}});
  return m;
}
function computeHints(){
  var hs=[],now=Date.now();
  db.angebote.forEach(function(a){
    if(isOpenAng(a)&&!(a.log&&a.log.length)&&a.ts&&(now-a.ts)>=30*DAY)
      hs.push({key:'ng:'+a.id,prio:1,text:'Angebot '+a.sparte+' (Nr. '+a.kunde+') ist seit '+Math.floor((now-a.ts)/DAY)+' Tagen offen und wurde noch nicht nachgefasst.',btn:'open-ang',id:a.id});
  });
  db.beratungen.forEach(function(b){
    if(!b.wv)hs.push({key:'bw:'+b.id,prio:2,text:'Beratung '+b.bereich+' (Nr. '+b.kunde+') hat keine Wiedervorlage.',btn:'open-ber',id:b.id});
  });
  allKunden().forEach(function(k){
    var open=db.todos.some(function(x){return x.kunde===k&&!x.done})||db.angebote.some(function(x){return x.kunde===k&&isOpenAng(x)});
    var la=lastActivity(k);
    if(!open&&la&&(now-la)>=90*DAY)
      hs.push({key:'kk:'+k,prio:3,text:'Nr. '+k+': seit '+Math.floor((now-la)/DAY)+' Tagen kein Kontakt erfasst. Ist ein Jahresgespräch sinnvoll?',btn:'open-kunde',k:k});
  });
  var dis=db.dismissed||{};
  return hs.filter(function(h){return !(dis[h.key]&&now-dis[h.key]<60*DAY)}).sort(function(a,b){return a.prio-b.prio});
}
function hintsHtml(){
  var hs=computeHints();
  if(!hs.length)return '';
  var shown=hs.slice(0,8);
  var h='<details class="hints"><summary>Hinweise <span class="count">'+hs.length+'</span></summary>';
  shown.forEach(function(x){
    h+='<div class="hint"><div>'+esc(x.text)+'</div><div class="actions"><button class="btn small" data-act="'+x.btn+'"'+(x.id?' data-id="'+x.id+'"':'')+(x.k?' data-k="'+esc(x.k)+'"':'')+'>Öffnen</button><button class="btn small" data-act="hint-hide" data-key="'+esc(x.key)+'">Ausblenden</button></div></div>';
  });
  if(hs.length>shown.length)h+='<div class="hint" style="font-size:13px;color:var(--muted)">Weitere '+(hs.length-shown.length)+' Hinweise erscheinen, sobald du diese erledigt oder ausgeblendet hast.</div>';
  h+='<div class="fine">Automatische Gesprächsanlässe aus deinen Einträgen, rein lokal berechnet. Keine Beratungsempfehlung.</div></details>';
  return h;
}

/* ---------- views ---------- */
function allKunden(){
  var set={};
  db.todos.concat(db.angebote,db.termine,db.beratungen,db.vertraege).forEach(function(x){set[x.kunde]=Math.max(set[x.kunde]||0,x.ts||0)});
  return Object.keys(set).sort(function(a,b){return set[b]-set[a]});
}
function render(){
  var T=TITEL[tab]||TITEL.start;
  $('title').textContent=tab==='kunde'&&kundeAkt?'Kunde '+kundeAkt:T[0];
  $('dateline').textContent=T[1]||new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
  var grp=NAV_GRUPPE[tab]||tab;
  document.querySelectorAll('[data-nav]').forEach(function(b){if(b.dataset.tab===grp)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  document.body.dataset.tab=tab;
  var fab=document.querySelector('.fab');if(fab)fab.hidden=!(tab==='aufgaben'||tab==='kunden'||tab==='kunde');
  var v=$('view');v.className='view v-'+tab;
  v.innerHTML=tab==='start'?viewStart():tab==='aufgaben'?viewAufgaben():tab==='beratung'?viewBeratung():tab==='pipeline'?viewPipeline():tab==='revier'?viewRevier():tab==='wissen'?viewWissen():tab==='akademie'?viewAkademie():tab==='vorbereitung'?viewPrep():tab==='kunde'?viewKunde():(tab==='copilot'||tab==='wissenki'||tab==='training')?viewChat(tab==='copilot'?'cp':tab==='wissenki'?'wk':'tr'):viewKunden();
  if(tab==='beratung')afterBeratungRender();
  drawCharts(v);
  $('kunden-list').innerHTML=allKunden().map(function(n){return '<option value="'+esc(n)+'">'}).join('');
  renderBanner();
}

function rowHtml(it,cls){
  var x=it.x;
  if(it.kind==='todo'){
    return '<div class="row '+cls+'"><button class="check" data-act="toggle-todo" data-id="'+x.id+'" aria-label="Erledigt"></button>'+
      '<div class="body" data-act="open-todo" data-id="'+x.id+'"><div class="line1"><span class="tag">'+esc(x.kunde)+'</span>'+(x.wait?'<span class="pill wait">wartet auf Kunde</span>':'')+'<span class="when">'+whenLabel(x.due)+'</span></div>'+
      '<div class="txt">'+esc(x.text)+'</div></div></div>';
  }
  return '<div class="row '+cls+'"><div class="body" data-act="open-ang" data-id="'+x.id+'"><div class="line1"><span class="tag">'+esc(x.kunde)+'</span><span class="when">Nachfassen: '+whenLabel(x.nachfass)+'</span></div>'+
    '<div class="txt">Angebot '+esc(x.sparte)+'</div>'+(x.note?'<div class="sub">'+esc(x.note)+'</div>':'')+
    '<div class="actions"><button class="btn small primary" data-act="nachfass" data-id="'+x.id+'">Nachgefasst</button></div></div></div>';
}

function viewAngebote(){
  var cnt={offen:0,abgeschlossen:0,abgelehnt:0,alle:db.angebote.length};
  db.angebote.forEach(function(a){if(isOpenAng(a))cnt.offen++;else cnt[a.status]++});
  var f=[['offen','Offen'],['abgeschlossen','Abgeschlossen'],['abgelehnt','Abgelehnt'],['alle','Alle']];
  var h='<div class="chips">'+f.map(function(c){return '<button class="chip" data-act="angfilter" data-f="'+c[0]+'" aria-pressed="'+(angFilter===c[0])+'">'+c[1]+' '+cnt[c[0]]+'</button>'}).join('')+'</div>';
  var list=db.angebote.filter(function(a){return angFilter==='alle'||(angFilter==='offen'?isOpenAng(a):a.status===angFilter)});
  list.sort(function(a,b){
    if(angFilter==='offen')return (a.nachfass||'9999').localeCompare(b.nachfass||'9999');
    return (b.ts||0)-(a.ts||0);
  });
  if(!list.length)return h+'<div class="empty">Keine Angebote in dieser Ansicht.<br><button class="btn primary" data-act="add-ang">Angebot anlegen</button></div>';
  list.forEach(function(a){
    var late=isOpenAng(a)&&a.nachfass&&a.nachfass<todayIso();
    h+='<button class="card" data-act="open-ang" data-id="'+a.id+'"><div class="head"><span><span class="tag">'+esc(a.kunde)+'</span> <strong>'+esc(a.sparte)+'</strong></span><span class="pill '+a.status+'">'+STATUS[a.status]+'</span></div>'+
      (isOpenAng(a)?'<div class="sub"'+(late?' style="color:var(--late);font-weight:600"':'')+'>Nachfassen: '+whenLabel(a.nachfass)+'</div>':'')+
      (a.note?'<div class="sub">'+esc(a.note)+'</div>':'')+'</button>';
  });
  return h;
}

/* ---------- add sheet ---------- */
function openAdd(pre){
  addState=Object.assign({type:'todo',kunde:'',text:'',due:'',zeit:'',anliegen:'',prio:false,sparte:'',nachfass:addDaysIso(todayIso(),7),note:'',datum:todayIso(),nachb:true,wait:false,ablauf:'',frist:'3',bereich:BEREICHE[0],wv:addDaysIso(todayIso(),30),erg:'offen',grund:'',ber:'',fil:'',err:''},pre||{});
  renderAdd();
}
function readAdd(){
  var s=addState;
  ['kunde','text','due','sparte','nachfass','note','datum','zeit','anliegen','bereich','wv','ablauf','frist','erg','grund','ber','fil'].forEach(function(k){var e=$('f-'+k);if(e)s[k]=e.value});
  var nb=$('f-nachb');if(nb)s.nachb=nb.checked;var nw=$('f-wait');if(nw)s.wait=nw.checked;var np=$('f-prio');if(np)s.prio=np.checked;
}
function renderAdd(){
  var s=addState;
  var h='<h3>Neuer Eintrag</h3>';
  h+='<div class="seg" style="margin-top:12px">'+[['todo','To-do'],['angebot','Angebot'],['termin','Termin'],['beratung','Beratung'],['vertrag','Vertrag']].map(function(t){return '<button data-act="addtype" data-t="'+t[0]+'" aria-pressed="'+(s.type===t[0])+'">'+t[1]+'</button>'}).join('')+'</div>';
  h+='<label for="f-kunde">Kundennummer</label><input type="text" id="f-kunde" list="kunden-list" autocomplete="off" autocapitalize="characters" placeholder="z. B. 10482" value="'+esc(s.kunde)+'">';
  if(s.type==='todo'){
    h+='<label for="f-text">Was ist zu tun?</label><input type="text" id="f-text" maxlength="140" placeholder="z. B. Unterlagen nachreichen lassen" value="'+esc(s.text)+'">';
    h+='<label for="f-due">Wann?</label>'+winChips('f-due')+'<input type="date" id="f-due" value="'+esc(s.due)+'">';
    h+='<label class="ck"><input type="checkbox" id="f-wait"'+(s.wait?' checked':'')+'> Wartet auf den Kunden (Nachfassen)</label><label class="ck"><input type="checkbox" id="f-prio"'+(s.prio?' checked':'')+'> Wichtig (hohe Priorität)</label>';
  }else if(s.type==='vertrag'){
    h+='<label for="f-sparte">Sparte</label><select id="f-sparte">'+opts(SPARTEN,s.sparte,false)+'</select>';
    h+='<label for="f-ablauf">Vertrag läuft ab am</label><input type="date" id="f-ablauf" value="'+esc(s.ablauf)+'">';
    h+='<label for="f-frist">Kündigungsfrist</label><select id="f-frist">'+[['1','1 Monat'],['2','2 Monate'],['3','3 Monate'],['6','6 Monate']].map(function(o){return '<option value="'+o[0]+'"'+(s.frist===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>';
    h+='<label for="f-note">Notiz (optional)</label><input type="text" id="f-note" maxlength="140" placeholder="z. B. Vorversicherer, Sonderkündigung möglich" value="'+esc(s.note)+'">';
    h+='<p class="hint-t">Ablaufdatum und Frist stehen in der Police. Die App rechnet als Richtwert und erinnert dich rechtzeitig.</p>';
  }else if(s.type==='angebot'){
    h+='<label for="f-sparte">Sparte</label><select id="f-sparte">'+opts(SPARTEN,s.sparte,false)+'</select>';
    h+='<label for="f-nachfass">Nachfassen am</label>'+dateChips('f-nachfass',[[3,'In 3 Tagen'],[7,'In 1 Woche'],[14,'In 2 Wochen']])+'<input type="date" id="f-nachfass" value="'+esc(s.nachfass)+'">';
    h+='<label for="f-note">Notiz (optional)</label><input type="text" id="f-note" maxlength="140" placeholder="z. B. wartet auf Rückmeldung" value="'+esc(s.note)+'">';
  }else if(s.type==='termin'){
    h+='<div class="grid2"><div><label for="f-datum">Datum des Termins</label><input type="date" id="f-datum" value="'+esc(s.datum)+'"></div><div><label for="f-zeit">Uhrzeit <span class="opt">optional</span></label><input type="time" id="f-zeit" value="'+esc(s.zeit)+'"></div></div>';
    h+='<label for="f-anliegen">Anliegen des Kunden</label><select id="f-anliegen"><option value="">Keine Angabe</option>'+ANLIEGEN.map(function(a){return '<option value="'+a[0]+'"'+(s.anliegen===a[0]?' selected':'')+'>'+esc(a[1])+'</option>'}).join('')+'</select>';
    h+='<label for="f-sparte">Sparte</label><select id="f-sparte">'+opts(SPARTEN,s.sparte,true)+'</select>';
    h+='<label for="f-note">Notiz (optional)</label><input type="text" id="f-note" maxlength="140" placeholder="z. B. Bedarfsanalyse gemacht" value="'+esc(s.note)+'">';
    h+='<label class="ck"><input type="checkbox" id="f-nachb"'+(s.nachb?' checked':'')+'> To-do „Nachbereitung“ am Termintag anlegen</label>';
  }else{
    h+='<label for="f-bereich">Bereich</label><select id="f-bereich">'+opts(BEREICHE,s.bereich,false)+'</select>';
    h+='<label for="f-datum">Datum der Beratung</label><input type="date" id="f-datum" value="'+esc(s.datum)+'">';
    h+='<label for="f-note">Ergebnis und Stichpunkte</label><textarea id="f-note" maxlength="600" placeholder="z. B. Versorgungslücke besprochen, Kunde will Unterlagen prüfen">'+esc(s.note)+'</textarea>';
    h+=ergSel('f',s.erg,s.grund,false,s.ber,s.fil);
    h+='<label for="f-wv">Wiedervorlage</label>'+dateChips('f-wv',[[7,'1 Woche'],[30,'1 Monat'],[90,'3 Monate'],[180,'6 Monate'],['clear','Keine']])+'<input type="date" id="f-wv" value="'+esc(s.wv)+'">';
  }
  if(s.err)h+='<p class="err" role="alert">'+esc(s.err)+'</p>';
  h+='<p class="hint-t">Nur Nummer und Stichworte eintragen. Keine Namen, Geburtsdaten, Adressen oder Gesundheitsangaben.</p>';
  h+='<div class="btnrow"><button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="save-add">Speichern</button></div>';
  openSheet(h);
}
function syncWv(b){
  var t=db.todos.find(function(x){return x.ref===b.id&&!x.done});
  if(b.wv){
    var text='Wiedervorlage Beratung '+b.bereich;
    if(t){t.due=b.wv;t.text=text;t.kunde=b.kunde}
    else db.todos.push({id:uid(),kunde:b.kunde,text:text,due:b.wv,done:false,ts:Date.now(),ref:b.id});
  }else if(t){db.todos=db.todos.filter(function(x){return x!==t})}
}
function saveAdd(){
  readAdd();
  var s=addState,k=s.kunde.trim().toUpperCase();
  var e=checkKunde(k)||checkText(s.text)||checkText(s.note);
  if(!e){
    if(s.type==='todo'&&!s.text.trim())e='Bitte eintragen, was zu tun ist.';
    else if((s.type==='termin'||s.type==='beratung')&&!s.datum)e='Bitte ein Datum wählen.';
    else if(s.type==='vertrag'&&!s.ablauf)e='Bitte das Ablaufdatum wählen.';
    else if(s.type==='beratung'&&s.erg==='verloren'&&!s.grund)e='Bitte den Grund wählen, warum der Kunde nicht abgeschlossen hat.';
  }
  if(e){s.err=e;renderAdd();return}
  var now=Date.now();
  if(s.type==='todo')db.todos.push({id:uid(),kunde:k,text:s.text.trim(),due:s.due||'',done:false,ts:now,wait:!!s.wait,prio:!!s.prio});
  else if(s.type==='vertrag')db.vertraege.push({id:uid(),kunde:k,sparte:s.sparte,ablauf:s.ablauf,frist:s.frist||'3',note:s.note.trim(),ts:now});
  else if(s.type==='angebot')db.angebote.push({id:uid(),kunde:k,sparte:s.sparte,status:'offen',nachfass:s.nachfass||'',note:s.note.trim(),log:[],ts:now});
  else if(s.type==='termin'){
    db.termine.push({id:uid(),kunde:k,datum:s.datum,zeit:s.zeit||'',anliegen:s.anliegen||'',sparte:s.sparte,note:s.note.trim(),ts:now});
    if(s.nachb)db.todos.push({id:uid(),kunde:k,text:'Nachbereitung'+(s.sparte?' ('+s.sparte+')':''),due:s.datum,done:false,ts:now+1});
  }else{
    var b={id:uid(),kunde:k,bereich:s.bereich,datum:s.datum,note:s.note.trim(),wv:s.wv||'',erg:s.erg||'offen',grund:s.erg==='verloren'?s.grund:'',ber:s.ber||'',fil:s.fil||'',ts:now};
    db.beratungen.push(b);syncWv(b);
  }
  save();closeSheet();render();toast('Gespeichert');
}

/* ---------- todo sheet ---------- */
function openTodo(id){
  var x=db.todos.find(function(t){return t.id===id});if(!x)return;
  todoDraft={id:id,text:x.text,due:x.due||'',err:''};
  renderTodo();
}
function renderTodo(){
  var d=todoDraft,x=db.todos.find(function(t){return t.id===d.id});
  var h='<h3>To-do</h3><p class="sub"><span class="tag">'+esc(x.kunde)+'</span></p>';
  h+='<label for="t-text">Was ist zu tun?</label><input type="text" id="t-text" maxlength="140" value="'+esc(d.text)+'">';
  h+='<label for="t-due">Wann?</label>'+winChips('t-due')+'<input type="date" id="t-due" value="'+esc(d.due)+'">';
  h+='<label class="ck"><input type="checkbox" id="t-wait"'+(x.wait?' checked':'')+'> Wartet auf den Kunden (Nachfassen)</label><label class="ck"><input type="checkbox" id="t-prio"'+(x.prio?' checked':'')+'> Wichtig (hohe Priorität)</label>';
  if(d.err)h+='<p class="err" role="alert">'+esc(d.err)+'</p>';
  h+='<div class="btnrow"><button class="btn danger" data-act="del-todo" data-id="'+x.id+'" data-confirm="Wirklich löschen?">Löschen</button><button class="btn primary" data-act="save-todo">Speichern</button></div>';
  openSheet(h);
}
function saveTodo(){
  var d=todoDraft,x=db.todos.find(function(t){return t.id===d.id});
  var text=$('t-text').value.trim(),due=$('t-due').value;
  var e=!text?'Bitte eintragen, was zu tun ist.':checkText(text);
  if(e){d.text=text;d.due=due;d.err=e;renderTodo();return}
  x.text=text;x.due=due;x.wait=!!$('t-wait').checked;x.prio=!!$('t-prio').checked;
  if(x.ref){var b=db.beratungen.find(function(y){return y.id===x.ref});if(b)b.wv=due}
  save();closeSheet();render();toast('Gespeichert');
}

/* ---------- angebot sheets ---------- */
function openAng(id){
  var a=db.angebote.find(function(x){return x.id===id});if(!a)return;
  angDraft={id:id,status:a.status,sparte:a.sparte,nachfass:a.nachfass||'',note:a.note||'',err:''};
  renderAng();
}
function readAng(){
  var d=angDraft;
  if($('a-sparte'))d.sparte=$('a-sparte').value;
  if($('a-nachfass'))d.nachfass=$('a-nachfass').value;
  if($('a-note'))d.note=$('a-note').value;
}
function renderAng(){
  var d=angDraft,a=db.angebote.find(function(x){return x.id===d.id});
  var h='<h3>Angebot</h3><p class="sub"><span class="tag">'+esc(a.kunde)+'</span></p>';
  h+='<label>Status</label><div class="grid2">'+Object.keys(STATUS).map(function(k){return '<button class="chip" data-act="set-status" data-val="'+k+'" aria-pressed="'+(d.status===k)+'">'+STATUS[k]+'</button>'}).join('')+'</div>';
  h+='<label for="a-sparte">Sparte</label><select id="a-sparte">'+opts(SPARTEN,d.sparte,false)+'</select>';
  if(d.status==='offen'||d.status==='nachgefasst'){
    h+='<label for="a-nachfass">Nachfassen am</label>'+dateChips('a-nachfass',[[3,'In 3 Tagen'],[7,'In 1 Woche'],[14,'In 2 Wochen'],[30,'In 1 Monat']])+'<input type="date" id="a-nachfass" value="'+esc(d.nachfass)+'">';
  }
  h+='<label for="a-note">Notiz (optional)</label><input type="text" id="a-note" maxlength="140" value="'+esc(d.note)+'">';
  var log=(a.log||[]);
  if(log.length)h+='<p class="hint-t">Nachgefasst: '+log.length+'x, zuletzt '+fmtDate(log[log.length-1])+'.</p>';
  if(d.err)h+='<p class="err" role="alert">'+esc(d.err)+'</p>';
  h+='<div class="btnrow"><button class="btn danger" data-act="del-ang" data-id="'+a.id+'" data-confirm="Wirklich löschen?">Löschen</button><button class="btn primary" data-act="save-ang">Speichern</button></div>';
  openSheet(h);
}
function saveAng(){
  readAng();
  var d=angDraft,a=db.angebote.find(function(x){return x.id===d.id});
  var e=checkText(d.note);
  if(e){d.err=e;renderAng();return}
  a.status=d.status;a.sparte=d.sparte;a.note=d.note.trim();
  a.nachfass=(d.status==='offen'||d.status==='nachgefasst')?d.nachfass:'';
  save();closeSheet();render();toast('Gespeichert');
}
function openNachfass(id){
  var a=db.angebote.find(function(x){return x.id===id});if(!a)return;
  var h='<h3>Nachgefasst</h3><p class="sub"><span class="tag">'+esc(a.kunde)+'</span> '+esc(a.sparte)+'</p>';
  h+='<label>Wann wieder nachfassen?</label><div class="grid2">'+[[3,'In 3 Tagen'],[7,'In 1 Woche'],[14,'In 2 Wochen'],[30,'In 1 Monat']].map(function(c){return '<button class="btn" data-act="nach-days" data-id="'+id+'" data-days="'+c[0]+'">'+c[1]+'</button>'}).join('')+'</div>';
  h+='<label for="n-date">Eigenes Datum</label><div style="display:flex;gap:8px"><input type="date" id="n-date"><button class="btn" data-act="nach-date" data-id="'+id+'">Übernehmen</button></div>';
  h+='<label>Oder abschließen</label><div class="grid2"><button class="btn" data-act="nach-end" data-id="'+id+'" data-val="abgeschlossen">Abgeschlossen</button><button class="btn" data-act="nach-end" data-id="'+id+'" data-val="abgelehnt">Abgelehnt</button></div>';
  h+='<div class="btnrow"><button class="btn block" data-act="nach-days" data-id="'+id+'" data-days="">Ohne neuen Termin merken</button></div>';
  openSheet(h);
}
function applyNach(id,date,status){
  var a=db.angebote.find(function(x){return x.id===id});if(!a)return;
  var prev={status:a.status,nachfass:a.nachfass,log:(a.log||[]).slice()};
  if(!status){a.log=(a.log||[]).concat(todayIso());a.status='nachgefasst';a.nachfass=date}
  else{a.status=status;a.nachfass=''}
  save();closeSheet();render();
  toast(status?STATUS[status]:'Nachgefasst gespeichert',function(){a.status=prev.status;a.nachfass=prev.nachfass;a.log=prev.log;save();render()});
}

/* ---------- beratung sheet ---------- */
function openBer(id){
  var b=db.beratungen.find(function(x){return x.id===id});if(!b)return;
  berDraft={id:id,bereich:b.bereich,datum:b.datum,note:b.note||'',wv:b.wv||'',erg:b.erg||'offen',grund:b.grund||'',ber:b.ber||'',fil:b.fil||'',err:''};
  renderBer();
}
function renderBer(){
  var d=berDraft,b=db.beratungen.find(function(x){return x.id===d.id});
  var h='<h3>Beratung</h3><p class="sub"><span class="tag">'+esc(b.kunde)+'</span></p>';
  h+='<label for="b-bereich">Bereich</label><select id="b-bereich">'+opts(BEREICHE,d.bereich,false)+'</select>';
  h+='<label for="b-datum">Datum</label><input type="date" id="b-datum" value="'+esc(d.datum)+'">';
  h+='<label for="b-note">Ergebnis und Stichpunkte</label><textarea id="b-note" maxlength="600">'+esc(d.note)+'</textarea>';
  h+=ergSel('b',d.erg,d.grund,false,d.ber,d.fil);
  h+='<label for="b-wv">Wiedervorlage</label>'+dateChips('b-wv',[[7,'1 Woche'],[30,'1 Monat'],[90,'3 Monate'],[180,'6 Monate'],['clear','Keine']])+'<input type="date" id="b-wv" value="'+esc(d.wv)+'">';
  if(d.err)h+='<p class="err" role="alert">'+esc(d.err)+'</p>';
  h+='<div class="btnrow"><button class="btn danger" data-act="del-ber" data-id="'+b.id+'" data-confirm="Wirklich löschen?">Löschen</button><button class="btn primary" data-act="save-ber">Speichern</button></div>';
  openSheet(h);
}
function saveBer(){
  var d=berDraft,b=db.beratungen.find(function(x){return x.id===d.id});
  d.bereich=$('b-bereich').value;d.datum=$('b-datum').value;d.note=$('b-note').value;d.wv=$('b-wv').value;d.erg=$('b-erg').value;d.grund=$('b-grund').value;d.ber=$('b-ber').value;d.fil=$('b-fil').value;
  var e=!d.datum?'Bitte ein Datum wählen.':(d.erg==='verloren'&&!d.grund?'Bitte den Grund wählen, warum der Kunde nicht abgeschlossen hat.':checkText(d.note));
  if(e){d.err=e;renderBer();return}
  b.bereich=d.bereich;b.datum=d.datum;b.note=d.note.trim();b.wv=d.wv;b.erg=d.erg;b.grund=d.erg==='verloren'?d.grund:'';b.ber=d.ber;b.fil=d.fil;
  syncWv(b);save();closeSheet();render();toast('Gespeichert');
}

/* ---------- nummer sheet ---------- */
function akteText(k){
  var L=['Kundenakte Nr. '+k,'Stand: '+fmtFull(todayIso()),''];
  var be=db.beratungen.filter(function(x){return x.kunde===k}).sort(function(a,b){return a.datum.localeCompare(b.datum)});
  L.push('BERATUNGEN');
  if(!be.length)L.push('- keine');
  be.forEach(function(b){L.push('- '+fmtFull(b.datum)+', '+b.bereich+(b.note?': '+b.note:'')+(b.wv?' (Wiedervorlage: '+fmtFull(b.wv)+')':''))});
  L.push('','TERMINE');
  var tm=db.termine.filter(function(x){return x.kunde===k}).sort(function(a,b){return a.datum.localeCompare(b.datum)});
  if(!tm.length)L.push('- keine');
  tm.forEach(function(x){L.push('- '+fmtFull(x.datum)+(x.sparte?', '+x.sparte:'')+(x.note?': '+x.note:''))});
  L.push('','ANGEBOTE');
  var ag=db.angebote.filter(function(x){return x.kunde===k});
  if(!ag.length)L.push('- keine');
  ag.forEach(function(a){L.push('- '+a.sparte+', '+STATUS[a.status]+(isOpenAng(a)&&a.nachfass?', nachfassen am '+fmtFull(a.nachfass):'')+(a.note?': '+a.note:''))});
  L.push('','VERTRÄGE (ABLAUF)');
  var vt=db.vertraege.filter(function(x){return x.kunde===k});
  if(!vt.length)L.push('- keine');
  vt.forEach(function(v){L.push('- '+v.sparte+', läuft ab '+fmtFull(v.ablauf)+', Kündigung bis '+fmtFull(vtInfo(v).bis)+(v.note?': '+v.note:''))});
  L.push('','OFFENE TO-DOS');
  var td=db.todos.filter(function(x){return x.kunde===k&&!x.done});
  if(!td.length)L.push('- keine');
  td.forEach(function(x){L.push('- '+x.text+(x.due?' (fällig '+fmtFull(x.due)+')':''))});
  return L.join('\n');
}
function kundeEvents(nr){
  var ev=[];function dts(t){return t?iso(new Date(t)):''}
  db.beratungen.forEach(function(b){if(b.kunde===nr)ev.push({d:b.datum,k:'Beratung',t:b.bereich+' · '+ergLabel(b),act:'open-ber',id:b.id,c:'b'})});
  db.termine.forEach(function(t){if(t.kunde===nr)ev.push({d:t.datum,k:'Termin',t:(t.zeit?t.zeit+' Uhr · ':'')+(t.anliegen?themaName(t.anliegen):(t.sparte||'ohne Thema'))+(t.note?' · '+t.note:''),c:'t'})});
  db.angebote.forEach(function(a){if(a.kunde===nr)ev.push({d:dts(a.ts),k:'Angebot',t:a.sparte+' · '+STATUS[a.status]+(isOpenAng(a)&&a.nachfass?' (nachfassen '+fmtDate(a.nachfass)+')':''),act:'open-ang',id:a.id,c:'a'})});
  db.vertraege.forEach(function(v){if(v.kunde===nr)ev.push({d:v.ablauf,k:'Vertrag',t:v.sparte+' läuft ab',act:'open-vertrag',id:v.id,c:'v'})});
  db.todos.forEach(function(x){if(x.kunde===nr)ev.push({d:x.done?dts(x.doneAt||x.ts):(x.due||dts(x.ts)),k:x.wait?'Wartet':'Aufgabe',t:x.text+(x.done?' (erledigt)':''),act:'open-todo',id:x.id,c:'o'})});
  return ev.filter(function(e){return e.d}).sort(function(a,b){return b.d.localeCompare(a.d)});
}
function kundeLast(nr){var e=kundeEvents(nr).filter(function(x){return x.d<=todayIso()});return e.length?e[0].d:''}
function kundeTimeline(nr){
  var ev=kundeEvents(nr);if(!ev.length)return '<p class="hint-t">Noch keine Einträge.</p>';
  return '<div class="tl3">'+ev.slice(0,30).map(function(e){return '<'+(e.act?'button data-act="'+e.act+'" data-id="'+e.id+'"':'div')+' class="tle c-'+e.c+'"><i></i><span class="tld">'+fmtDate(e.d)+'</span><span class="tlt"><b>'+e.k+'</b> '+esc(e.t)+'</span></'+(e.act?'button':'div')+'>'}).join('')+'</div>';
}
/* ---------- menu sheet ---------- */
function openMenu(){
  var h='<h3>Sichern und Datenschutz</h3>';
  h+='<h4>So sind deine Daten gespeichert</h4><p class="hint-t" style="font-size:14px;margin-top:0">Alle Einträge liegen nur im Speicher dieses Browsers auf diesem Gerät. Die App sendet nichts an einen Server. Auf einem anderen Gerät oder nach dem Löschen der Browserdaten ist alles weg, deshalb regelmäßig sichern.</p>';
  h+='<h4>Sichern</h4><div class="grid2"><button class="btn primary" data-act="backup-file">Als Datei speichern</button><button class="btn" data-act="backup-copy">Als Text kopieren</button></div>';
  h+='<p class="hint-t">Die Sicherung enthält deine Nummern und Notizen, aber keine Namen. Lege sie dort ab, wo auch deine Kundenordner liegen.'+(db.lastBackup?' Letzte Sicherung: '+fmtFull(iso(new Date(db.lastBackup)))+'.':'')+'</p>';
  h+='<h4>Wiederherstellen</h4><label for="m-file" style="margin-top:0">Sicherungsdatei wählen</label><input type="file" id="m-file" accept=".json,application/json">';
  h+='<label for="m-import">Oder Text einfügen</label><textarea id="m-import" rows="3" placeholder="Sicherung hier einfügen"></textarea>';
  h+='<div id="m-err"></div><div class="btnrow" style="margin-top:10px"><button class="btn" data-act="restore" data-confirm="Aktuelle Daten ersetzen?">Wiederherstellen</button></div>';
  h+='<h4>Alles löschen</h4><button class="btn danger block" data-act="wipe" data-confirm="Wirklich alles löschen?">Alle Daten löschen</button>';
  openSheet(h);
}
function ohnePrivat(k,v){return (k==='pdfName'||k==='brief')?undefined:v}
function backupJson(){return JSON.stringify(db,ohnePrivat,1)}
function markBackup(){db.lastBackup=Date.now();save()}

/* ---------- events ---------- */
document.addEventListener('click',function(ev){
  var btn=ev.target.closest('[data-act]');if(!btn)return;
  if(btn.dataset.confirm&&btn.dataset.armed!=='1'){
    btn.dataset.armed='1';btn.dataset.orig=btn.textContent;btn.textContent=btn.dataset.confirm;
    setTimeout(function(){if(btn.isConnected&&btn.dataset.armed==='1'){btn.dataset.armed='0';btn.textContent=btn.dataset.orig}},4000);
    return;
  }
  var act=btn.dataset.act,id=btn.dataset.id;
  if(kmode()&&!KMODE_OK.test(act)){toast('Im Kundenmodus nicht verfügbar');return}
  switch(act){
    case 'tab':tab=btn.dataset.tab;render();window.scrollTo(0,0);break;
    case 'add':openAdd();break;
    case 'add-termin':openAdd({type:'termin'});break;
    case 'add-ang':openAdd({type:'angebot'});break;
    case 'add-for':openAdd({kunde:btn.dataset.k});break;
    case 'close':closeSheet();break;
    case 'menu':openMenu();break;
    case 'addtype':readAdd();addState.type=btn.dataset.t;addState.err='';renderAdd();break;
    case 'save-add':saveAdd();break;
    case 'setdate':
      var inp=$(btn.dataset.target);
      if(inp)inp.value=btn.dataset.days==='clear'?'':addDaysIso(todayIso(),Number(btn.dataset.days));
      break;
    case 'setwin':
      var wi=$(btn.dataset.target),wv=btn.dataset.win;
      if(wi)wi.value=wv==='now'?todayIso():wv==='week'?endOfWeekIso():addDaysIso(todayIso(),14);
      break;
    case 'toggle-todo':
      var x=db.todos.find(function(t){return t.id===id});if(!x)break;
      x.done=true;x.doneAt=Date.now();save();render();
      if(sheetFn)sheetFn();
      toast('Erledigt',function(){x.done=false;delete x.doneAt;save();render();if(sheetFn)sheetFn()});
      break;
    case 'open-todo':openTodo(id);break;
    case 'open-vertrag':openVertrag(id);break;
    case 'save-vertrag':saveVertrag(id);break;
    case 'del-vertrag':db.vertraege=db.vertraege.filter(function(v){return v.id!==id});save();closeSheet();render();toast('Gelöscht');break;
    case 'wait-mail':waitMail(id);break;
    case 'theme':{var th=document.documentElement.getAttribute('data-theme')||'auto',nx=th==='auto'?'dark':th==='dark'?'light':'auto';if(nx==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',nx);try{localStorage.setItem('crm.theme',nx)}catch(e){}toast('Darstellung: '+(nx==='auto'?'wie das Gerät':nx==='dark'?'dunkel':'hell'));break}
    case 'fb-toggle':fbOn=!fbOn;fbState='bar';fbPend=null;fbClearPick();fbRender();break;
    case 'fb-off':fbOn=false;fbState='bar';fbPend=null;fbClearPick();fbRender();break;
    case 'fb-cancel':fbPend=null;fbState='bar';fbClearPick();fbRender();break;
    case 'fb-save':{var ft=$('fb-text').value.trim();if(!ft){$('fb-err').textContent='Bitte kurz eintragen, was geändert werden soll.';break}var fe=checkText(ft);if(fe){$('fb-err').textContent=fe;break}
      fbItems.push({id:uid(),where:fbPend.where,kind:fbPend.kind,text:fbPend.text,note:ft,done:false});fbSave();fbPend=null;fbState='bar';fbClearPick();fbRender();toast('Gemerkt');break}
    case 'fb-list':fbState='list';fbRender();break;
    case 'fb-close-list':fbState='bar';fbRender();break;
    case 'fb-done':{var fi=fbItems[Number(btn.dataset.i)];if(fi){fi.done=!fi.done;fbSave();fbRender()}break}
    case 'fb-del':fbItems.splice(Number(btn.dataset.i),1);fbSave();fbRender();break;
    case 'fb-clear':fbItems=fbItems.filter(function(i){return !i.done});fbSave();fbRender();break;
    case 'fb-list-copy':copyText(fbText(),'Liste kopiert');break;
    case 'open-woche':openWoche();break;
    case 'open-ganz':openGanz();break;
    case 'ev-set':{var eo=evObj();eo[btn.dataset.k]=!eo[btn.dataset.k];ganzRefresh();break}
    case 'ganz-set':{var go=ganzObj();go[btn.dataset.k]=go[btn.dataset.k]===btn.dataset.s?'':btn.dataset.s;ganzRefresh();break}
    case 'woche-copy':copyText(wocheText(),'Wochenbericht kopiert');break;
    case 'save-todo':saveTodo();break;
    case 'del-todo':db.todos=db.todos.filter(function(t){return t.id!==id});save();closeSheet();render();toast('Gelöscht');break;
    case 'open-ang':openAng(id);break;
    case 'set-status':readAng();angDraft.status=btn.dataset.val;angDraft.err='';renderAng();break;
    case 'save-ang':saveAng();break;
    case 'del-ang':db.angebote=db.angebote.filter(function(a){return a.id!==id});save();closeSheet();render();toast('Gelöscht');break;
    case 'nachfass':openNachfass(id);break;
    case 'nach-days':applyNach(id,btn.dataset.days===''?'':addDaysIso(todayIso(),Number(btn.dataset.days)));break;
    case 'nach-date':var dv=$('n-date').value;if(dv)applyNach(id,dv);break;
    case 'nach-end':applyNach(id,'',btn.dataset.val);break;
    case 'open-ber':openBer(id);break;
    case 'save-ber':saveBer();break;
    case 'del-ber':
      db.beratungen=db.beratungen.filter(function(b){return b.id!==id});
      db.todos=db.todos.filter(function(t){return !(t.ref===id&&!t.done)});
      save();closeSheet();render();toast('Gelöscht');break;
    case 'auffilter':aufFilter=btn.dataset.f;render();break;
    case 'goto-waits':var we_=$('waits');if(we_)we_.scrollIntoView({behavior:'smooth',block:'start'});break;
    case 'rv-open':tab='revier';render();window.scrollTo(0,0);break;
    case 'rv-sel':rv.sel=id;render();break;
    case 'rv-plan':openAdd({type:'termin',note:'Mit '+id});break;
    case 'open-auswertung':openSheet('<h3>Auswertung</h3>'+trichterHtml()+'<div class="btnrow"><button class="btn" data-act="close">Schließen</button></div>');break;
    case 'chat-send':chSend(id);break;
    case 'chat-stop':if(CH[id]&&CH[id].ctl)CH[id].ctl.abort();break;
    case 'chat-mic':chMic(id);break;
    case 'tr-role':if(CH.tr.on){toast('Die Kundenrolle lässt sich nach dem Gespräch ändern.');break}CH.tr.role=id;render();break;
    case 'tr-szen':case 'tr-modus':case 'tr-coach':case 'tr-coach-close':case 'tr-hist':case 'tr-hist-copy':case 'tr-hist-del':trAct(act,btn);break;
    case 'tr-start':trStart();break;
    case 'tr-end':trEnd();break;
    case 'tr-fb-retry':trFeedback();break;
    case 'tr-fb-copy':copyText(trFbText(),'Feedback kopiert');break;
    case 'tr-voice':CH.tr.voice=!CH.tr.voice;if(!CH.tr.voice&&window.speechSynthesis)try{window.speechSynthesis.cancel()}catch(e){}render();break;
    case 'gv-go':prep.step=Number(btn.dataset.i);if(prep.step===3&&!prep.A)gvBuild();render();window.scrollTo(0,0);break;
    case 'gv-anl':prep.anlass=(prep.anlass===btn.dataset.v?'':btn.dataset.v);if(prep.A)prep.A.anlassTyp=prep.anlass;render();break;
    case 'gv-prod':prep.sel[btn.dataset.k]=!prep.sel[btn.dataset.k];gvSync();render();break;
    case 'gv-gen':{var tx=document.getElementById('gvtxt');if(tx)prep.txt=tx.value;gvBuild();prep.step=3;render();window.scrollTo(0,0);break}
    case 'gv-regen':{var tx2=document.getElementById('gvtxt');if(tx2)prep.txt=tx2.value;gvBuild();render();break}
    case 'gv-ex':prep.txt=GV_EX;render();break;
    case 'gv-lf':prep.lf=!prep.lf;render();break;
    case 'gv-wk':tab='akademie';wkOpenProd(btn.dataset.k);render();window.scrollTo(0,0);break;
    case 'gv-addt':{var tl=prep.A.tarife[btn.dataset.k];tl.push({n:String.fromCharCode(65+tl.length),beitrag:NaN,txt:[],f:{}});render();break}
    case 'gv-delt':prep.A.tarife[btn.dataset.k].splice(Number(btn.dataset.i),1);render();break;
    case 'gv-chk':prep.A.calc[btn.dataset.p]=btn.checked;break;
    case 'gv-pdf':gvPdf(btn.dataset.v);break;
    case 'gv-reset':prep=newPrep();render();break;
    case 'wk-mode':if(btn.dataset.id==='db'){tab='wissenki';render();break}wk.mode=btn.dataset.id;render();break;
    case 'wk-home':wk.cat='';wk.unit='';render();window.scrollTo(0,0);break;
    case 'wk-cat':wk.mode='akad';wk.cat=btn.dataset.id;wk.unit='';render();window.scrollTo(0,0);break;
    case 'wk-unit':wk.mode='akad';wk.unit=btn.dataset.id;wk.cat=KN_IDX[wk.unit]?KN_IDX[wk.unit].c:wk.cat;tab='akademie';render();window.scrollTo(0,0);break;
    case 'wk-fav':wkFavToggle(btn.dataset.id);render();break;
    case 'wk-more':wk.more[btn.dataset.id]=!wk.more[btn.dataset.id];render();break;
    case 'wk-ask':wkAsk();break;
    case 'wk-askunit':{var _u=KN_IDX[btn.dataset.id];wk.q='Erkläre mir ausführlicher und mit Beispielen: '+(_u?_u.t:'');wk.unit='';wk.cat='';wk.mode='akad';render();wkAsk();window.scrollTo(0,0);break}
    case 'wk-ex':exRun(btn.dataset.id);break;
    case 'wk-go':tab=btn.dataset.id;render();window.scrollTo(0,0);break;
    case 'wk-edit':lx={q:'',sparte:'',typ:'',status:'',fav:false,edit:null};tab='wissen';render();break;
    case 'wk-add':wkAdd();break;
    case 'wk-del':db.settings.wissen=wissenList().filter(function(w){return w.id!==id});save();wkEdit();render();break;
    case 'more':openMore();break;
    case 'profil':openProfil();break;
    case 'profil-save':if(!db.settings)db.settings={};db.settings.beraterName=$('pr-n').value.trim().slice(0,40);save();closeSheet();render();toast('Gespeichert');break;
    case 'more-go':{closeSheet();var tg=document.createElement('button');tg.dataset.act=btn.dataset.to;if(btn.dataset.tab)tg.dataset.tab=btn.dataset.tab;document.body.appendChild(tg);tg.click();tg.remove();break}
    case 'prep-termin':homeKunde=id;tab='beratung';render();window.scrollTo(0,0);break;
    case 'search':openSearch();break;
    case 'search-go':{closeSheet();var sd=btn.dataset['do'],st=btn.dataset.to;
      if(st&&!sd){tab=st;render();window.scrollTo(0,0)}
      else if(sd==='search-go'){tab=st;render();window.scrollTo(0,0)}
      else{var tg2=document.createElement('button');tg2.dataset.act=sd;tg2.dataset.id=btn.dataset.id;tg2.dataset.k=btn.dataset.k;document.body.appendChild(tg2);tg2.click();tg2.remove()}
      break}
    case 'ku-open':openKuend(id);break;
    case 'ku-mode':kuMode=btn.dataset.m;openKuend(id);break;
    case 'ku-copy':{var kv=db.vertraege.find(function(x){return x.id===id});if(kv)copyText(kuText(kv,kuMode),'Schreiben kopiert');break}
    case 'ku-follow':{var kv2=db.vertraege.find(function(x){return x.id===id});if(kv2){db.todos.push({id:uid(),kunde:kv2.kunde,text:'Kündigungsbestätigung '+kv2.sparte+' nachfassen',due:addDaysIso(todayIso(),14),done:false,ts:Date.now(),wait:true});save();closeSheet();render();toast('Aufgabe angelegt')}break}
    case 'nb-open':nb.kunde=btn.dataset.id||nb.kunde;nb.plan=null;nb.err='';nbSheet();break;
    case 'nb-run':nbRun();break;
    case 'nb-apply':nbApply();break;
    case 'nb-mic':nbMic();break;
    case 'tr-mode':trMode=id;render();break;
    case 'dr-pick':dr.einw=EINW[Number(id)];dr.res=null;dr.err='';render();break;
    case 'dr-rand':{var ri=Math.floor(Math.random()*EINW.length);if(EINW[ri]===dr.einw)ri=(ri+1)%EINW.length;dr.einw=EINW[ri];dr.res=null;dr.err='';render();break}
    case 'dr-run':drRun();break;
    case 'dr-mic':drMic();break;
    case 'dr-save':{if(dr.res){lexNeuKI('allgemein','einwaende','Einwand: '+dr.einw.replace(/\.$/,''),dr.res.muster);toast('Als KI-Entwurf im Beraterwissen gespeichert')}break}
    case 'recht-open':openRecht();break;
    case 'recht-ok':if(!db.settings)db.settings={};db.settings.rechtPruef=todayIso();save();closeSheet();render();toast('Als geprüft markiert');break;
    case 'pl-open':tab='pipeline';render();window.scrollTo(0,0);break;
    case 'pl-set':plSetSheet();break;
    case 'pl-set-save':plSetSave();break;
    case 'pl-move':var pb=db.beratungen.find(function(x){return x.id===btn.dataset.id});if(!pb)break;
      if(btn.dataset.to==='verloren'){openBer(pb.id);berDraft.erg='verloren';renderBer();toast('Bitte den Grund wählen')}
      else{pb.erg=btn.dataset.to;pb.grund='';save();render()}
      break;
    case 'goto-radar':var re_=document.querySelector('.fr');if(re_)re_.scrollIntoView({behavior:'smooth',block:'start'});break;
    case 'goto-now':aufFilter='now';tab='aufgaben';render();window.scrollTo(0,0);break;
    case 'angfilter':angFilter=btn.dataset.f;render();break;
    case 'open-kunde':openKunde(btn.dataset.k);break;
    case 'export-akte':exportFile('Akte-'+btn.dataset.k+'.txt',akteText(btn.dataset.k));break;
    case 'del-kunde':
      var k=btn.dataset.k;
      ['todos','angebote','termine','beratungen','vertraege','laufend'].forEach(function(n){db[n]=db[n].filter(function(t){return t.kunde!==k})});
      if(cur&&cur.kunde===k){cur=null;adv=null}kundeAkt='';tab='kunden';
      save();closeSheet();render();toast('Gelöscht');break;
    case 'hint-hide':db.dismissed[btn.dataset.key]=Date.now();save();render();break;
    case 'backup-file':
      if(dl){dl.save({filename:'crm-sicherung-'+todayIso()+'.json',data:backupJson()}).then(function(){markBackup();toast('Sicherung gespeichert');render()},function(e){if(e&&e.code==='declined')return;fallbackCopy('Sicherung',backupJson())})}
      else fallbackCopy('Sicherung',backupJson());
      break;
    case 'backup-copy':
      openSheet('<h3>Sicherung</h3><textarea id="fb-text" readonly rows="8">'+esc(backupJson())+'</textarea><div class="btnrow"><button class="btn" data-act="close">Schließen</button><button class="btn primary" data-act="fb-copy" data-backup="1">Kopieren</button></div>');
      break;
    case 'fb-copy':
      var ta=$('fb-text');ta.focus();ta.select();
      copyText(ta.value,'Kopiert');
      if(btn.dataset.backup)markBackup();
      break;
    case 'restore':
      try{
        var d=normalize(JSON.parse($('m-import').value));
        if(!d)throw new Error('x');
        db=d;save();closeSheet();render();toast('Wiederhergestellt');
      }catch(e){$('m-err').innerHTML='<p class="err" role="alert">Das ist keine gültige Sicherung.</p>'}
      break;
    case 'wipe':db=emptyDb();save();closeSheet();render();toast('Alles gelöscht');break;
    default:if(/^lex-/.test(act))lexAct(act,btn);else if(/^bs-/.test(act))bsAct(act,btn);else if(/^(adv|kat|talk|disc|home)-/.test(act))advAct(act,btn);
  }
});
document.addEventListener('keydown',function(ev){if((ev.ctrlKey||ev.metaKey)&&ev.key&&ev.key.toLowerCase()==='k'){ev.preventDefault();if(!kmode())openSearch();return}var t=ev.target;if(t&&t.dataset&&t.dataset.chat&&ev.key==='Enter'&&!ev.shiftKey&&!ev.isComposing){ev.preventDefault();chSend(t.dataset.chat)}});
document.addEventListener('input',function(ev){
  if(ev.target.dataset&&ev.target.dataset.wk){var _d=ev.target.dataset;if(_d.wk==='q')wk.q=ev.target.value;else if(_d.wk==='s'){wk.s=ev.target.value;wkSearchPaint()}else if(_d.wk==='ex')wk.exTxt[_d.id]=ev.target.value;return}
  if(ev.target.dataset&&ev.target.dataset.prep!==undefined){prepInput(ev.target);return}
  if(ev.target.dataset&&(ev.target.dataset.home!==undefined||ev.target.dataset.adv!==undefined||ev.target.dataset.kat!==undefined||ev.target.dataset.katsel||ev.target.dataset.sig!==undefined)&&ev.target.type!=='checkbox'&&ev.target.tagName!=='SELECT'){advInput(ev.target);return}
  if(ev.target.id==='sr-q'){var sl=$('sr-list');if(sl)sl.innerHTML=searchHtml(ev.target.value);return}
  if(ev.target.id==='kq'){kundeQuery=ev.target.value;$('klist').innerHTML=kundenListHtml()}
});
document.addEventListener('change',function(ev){
  if(ev.target.dataset&&ev.target.dataset.rvf){rv[ev.target.dataset.rvf]=ev.target.value;render();return}
  if(ev.target.dataset&&ev.target.dataset.plf){plF[ev.target.dataset.plf]=ev.target.value;render();return}
  if(ev.target.dataset&&(ev.target.dataset.home!==undefined||ev.target.dataset.adv!==undefined||ev.target.dataset.kat!==undefined||ev.target.dataset.katsel||ev.target.dataset.sig!==undefined)&&(ev.target.type==='checkbox'||ev.target.tagName==='SELECT')){advInput(ev.target);return}
  if(ev.target.id==='adv-file'&&ev.target.files&&ev.target.files[0]){var r0=new FileReader();r0.onload=function(){advLoadText(String(r0.result||''))};r0.readAsText(ev.target.files[0]);return}
  if(ev.target.id==='m-file'&&ev.target.files&&ev.target.files[0]){
    var r=new FileReader();
    r.onload=function(){var t=$('m-import');if(t)t.value=String(r.result||'')};
    r.readAsText(ev.target.files[0]);
  }
});
document.addEventListener('keydown',function(ev){if(talkKey(ev))return;if(ev.key==='Escape'&&!$('sheet').hidden)closeSheet()});

var Eng=(function(){
function rm(r){return Math.pow(1+r,1/12)-1}
function fvFac(r,N){var m=rm(r);return m===0?N:(Math.pow(1+m,N)-1)/m}
/* Barwert einer Entnahme von 1 EUR im ersten Monat, jährlich um i steigend, Auszahlung zu Monatsbeginn */
function annFac(i,re,D){var m=rm(re),s=0;for(var k=0;k<12*D;k++){s+=Math.pow(1+i,Math.floor(k/12))/Math.pow(1+m,k)}return s}
function abgSatz(kirche,kSatz){var k=kirche?kSatz:0;var e=0.25/(1+0.25*k);return e*(1+0.055+k)}

/* Schritt 2: Versorgungslücke, Kapitalbedarf, Sparrate */
function bedarf(p){
  var n=p.rentenalter-p.alter,D=p.lebenserw-p.rentenalter;
  if(!(n>=1)||!(D>=1))return null;
  var f=Math.pow(1+p.infl,n);
  var lueckeHeute=Math.max(0,p.ziel-p.rente-p.vorsorge);
  var lueckeNom=lueckeHeute*f;
  var A=annFac(p.infl,p.re,D);
  var C=lueckeNom*A;
  var N=12*n,FV=fvFac(p.ra,N),FVd=n>1?fvFac(p.ra,12*(n-1)):NaN;
  var FVe=(p.einmal||0)*Math.pow(1+p.ra,n);
  var restC=Math.max(0,C-FVe);
  var sNow=restC/FV,sDelay=n>1?restC/FVd:NaN;
  var out={n:n,D:D,f:f,A:A,lueckeHeute:lueckeHeute,lueckeNom:lueckeNom,zielNom:p.ziel*f,renteNom:p.rente*f,vorsorgeNom:p.vorsorge*f,
    C:C,sNow:sNow,sDelay:sDelay,delayCost:sDelay-sNow};
  if(p.sparen>=0&&isFinite(p.sparen)){
    var S=p.sparen;
    var fvS=S*FV+FVe,fvSd=n>1?S*FVd+FVe:NaN;
    var W=fvS/A;
    out.S=S;out.fvS=fvS;out.fvSdelay=fvSd;out.entgangen=fvS-fvSd;
    out.W=W;out.WHeute=W/f;
    out.gesamtHeuteNach=p.rente+p.vorsorge+W/f;
    out.lueckeNach=Math.max(0,p.ziel-out.gesamtHeuteNach);
    out.gesamtHeuteVor=p.rente+p.vorsorge;
  }
  return out;
}

return {rm:rm,fvFac:fvFac,annFac:annFac,abgSatz:abgSatz,bedarf:bedarf};
})();
/* ================= Beratung: Altersvorsorge und Sachversicherungen ================= */
var SACH=[['gebaeude','Gebäude'],['hausrat','Hausrat'],['haftpflicht','Privathaftpflicht'],['rechtsschutz','Rechtsschutz'],['unfall','Unfall'],['kfz','KFZ']];
var AMP={ja:'gedeckt',teil:'teilweise',nein:'nicht gedeckt','':'offen'};
var AMPC={ja:[44,122,87],teil:[184,105,10],nein:[179,54,45],'':[150,158,166]};
var RURUP_MAX=30826,RURUP_MAX2=61652;
var adv=null,advTab=0,katSp='gebaeude';
var nf=new Intl.NumberFormat('de-DE',{maximumFractionDigits:0});
var nf2=new Intl.NumberFormat('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
function nv(s){var x=parseFloat(String(s==null?'':s).replace(/\./g,function(m,o,str){return /,/.test(str)?'':'.'}).replace(',','.'));return isFinite(x)?x:NaN}
function eur(x){return isFinite(x)?nf.format(Math.round(x))+' €':'-'}
function pctS(x){return isFinite(x)?nf2.format(x*100).replace(/,00$/,'')+' %':'-'}
function getp(o,p){var a=p.split('.');for(var i=0;i<a.length;i++){if(o==null)return '';o=o[a[i]]}return o==null?'':o}
function setp(o,p,v){var a=p.split('.');for(var i=0;i<a.length-1;i++){if(o[a[i]]==null)o[a[i]]={};o=o[a[i]]}o[a[a.length-1]]=v}
function deep(a,b){if(Array.isArray(b))return b.slice();if(b&&typeof b==='object'){var o=Array.isArray(a)?{}:Object.assign({},a);Object.keys(b).forEach(function(k){o[k]=deep(a&&a[k],b[k])});return o}return b}

/* ---- Katalog der Leistungsmerkmale (anpassbar) ---- */
function defaultKatalog(){
  function r(n,s,t){return {name:n,s:s||'',t:t||''}}
  return {
    pkv:KVROWS.map(function(n){return r(n)}),
    gebaeude:[r('Versicherungssumme','ja','unbegrenzt'),r('Unterversicherungsverzicht'),r('Starkregen und eindringendes Oberflächenwasser','ja','mitversichert, nicht nur reine Überschwemmung'),r('Weitere Elementarschäden'),r('Rohrpaket inkl. Ableitungsrohre außerhalb von Haus und Grundstück','ja'),r('Grobe Fahrlässigkeit'),r('Nebengebäude und PV-Anlage'),r('Überspannungsschäden'),r('Selbstbeteiligung'),r('Cashback-Option','ja','10 % pro Jahr')],
    hausrat:[r('Versicherungssumme','ja','unbegrenzt'),r('Unterversicherungsverzicht'),r('Starkregen und eindringendes Oberflächenwasser','ja','mitversichert, nicht nur reine Überschwemmung'),r('Weitere Elementarschäden'),r('Fahrraddiebstahl'),r('Grobe Fahrlässigkeit'),r('Überspannungsschäden'),r('Wertsachen (Entschädigungsgrenzen)'),r('Glasbruch'),r('Cashback-Option','ja','10 % pro Jahr')],
    haftpflicht:[r('Deckungssumme'),r('Forderungsausfalldeckung'),r('Mietsachschäden'),r('Schlüsselverlust'),r('Deliktunfähige Kinder'),r('Selbstbeteiligung')],
    rechtsschutz:[r('Privatrechtsschutz'),r('Berufsrechtsschutz'),r('Verkehrsrechtsschutz'),r('Wohnungs- und Grundstücksrechtsschutz'),r('Wartezeit'),r('Selbstbeteiligung')],
    unfall:[r('Invaliditätssumme'),r('Progression'),r('Gliedertaxe'),r('Unfallrente'),r('Todesfallleistung'),r('Bergungskosten und kosmetische Operationen')],
    kfz:[r('Haftpflicht-Deckungssumme'),r('Kaskoschutz (Teil- oder Vollkasko)'),r('Selbstbeteiligung'),r('Neuwertentschädigung'),r('Rabattschutz'),r('Grobe Fahrlässigkeit'),r('Tierbiss und Marderschäden'),r('Schutzbrief')],
    police:[r('Zuzahlungen möglich'),r('Teilentnahmen möglich'),r('Fondswechsel innerhalb der Police'),r('Beitragspause oder Beitragsfreistellung'),r('Todesfallleistung'),r('Auszahlung als Kapital oder Rente'),r('Auszahlplan')]
  };
}
function katalog(){if(!db.settings)db.settings={};if(!db.settings.katalog)db.settings.katalog=defaultKatalog();if(!db.settings.katalog.police)db.settings.katalog.police=defaultKatalog().police;if(!db.settings.katalog.pkv)db.settings.katalog.pkv=defaultKatalog().pkv;return db.settings.katalog}
function rowsFromKat(sp){return (katalog()[sp]||[]).map(function(k){return {name:k.name,ist:{s:'',t:''},soll:{s:k.s||'',t:k.t||''}}})}

/* ---- Zustand ---- */

/* ---- Berechnung Altersvorsorge ---- */
function calcAl(){
  var a=adv.al,o={alter:nv(a.alter),rentenalter:nv(a.rentenalter),lebenserw:nv(a.lebenserw),infl:nv(a.infl)/100,ra:nv(a.ra)/100,re:nv(a.re)/100};
  if(isNaN(o.infl))o.infl=0.02;if(isNaN(o.ra))o.ra=0.05;if(isNaN(o.re))o.re=0.04;
  var gehalt=nv(a.gehalt),pct=nv(a.zielPct)/100,err='';
  if(!(o.alter>0)||!(o.rentenalter>o.alter)||!(o.lebenserw>o.rentenalter))err='Bitte Alter, Rentenalter und Planungshorizont eintragen (Alter < Rentenalter < Planungshorizont).';
  else if(!(gehalt>0))err='Bitte das aktuelle Netto-Gehalt eintragen.';
  else if(isNaN(nv(a.rente)))err='Bitte die erwartete gesetzliche Rente eintragen (0 ist erlaubt).';
  if(err)return {err:err,o:o};
  var n=o.rentenalter-o.alter,f=Math.pow(1+o.infl,n),nom=a.modus==='nom';
  function H(x){x=nv(x);if(isNaN(x))x=0;return nom?x/f:x}
  var ziel=gehalt*(isNaN(pct)?1:pct),rente=H(a.rente),bav=H(a.bav);
  var b=Eng.bedarf({alter:o.alter,rentenalter:o.rentenalter,lebenserw:o.lebenserw,infl:o.infl,ra:o.ra,re:o.re,ziel:ziel,rente:rente,vorsorge:bav,einmal:0,sparen:NaN});
  var steuer=nv(a.steuer)/100,prods=[];
  var ru=a.ru,T=NaN;
  if(ru.on){
    var jb=(nv(ru.b)||0)*12;
    T=!isNaN(nv(ru.tOver))?nv(ru.tOver):(steuer>0?jb*steuer:NaN);
    prods.push({key:'ru',name:'Rürup-Rente (fondsbasiert)',b:nv(ru.b)||0,r:H(ru.r),rIn:nv(ru.r),c:'#1F7A8C',T:T,jb:jb});
  }
  if(a.fp.on)prods.push({key:'fp',name:'Fondspolice',b:nv(a.fp.b)||0,r:H(a.fp.r),rIn:nv(a.fp.r),c:'#6B4FA0'});
  if(a.ad.on)prods.push({key:'ad',name:'Altersvorsorgedepot (ab 2027)',b:nv(a.ad.b)||0,r:H(a.ad.r),rIn:nv(a.ad.r),c:'#2C7A57',z:nv(a.ad.z)});
  var sumB=0,sumR=0;prods.forEach(function(p){sumB+=p.b;sumR+=isNaN(p.r)?0:p.r});
  var gesamtNach=rente+bav+sumR,lueckeNach=Math.max(0,ziel-gesamtNach);
  return {o:o,n:n,f:f,nom:nom,gehalt:gehalt,ziel:ziel,rente:rente,bav:bav,b:b,prods:prods,sumB:sumB,sumR:sumR,gesamtNach:gesamtNach,lueckeNach:lueckeNach,steuer:steuer,T:T,
    lueckeHeute:b.lueckeHeute,lueckeNom:b.lueckeNom};
}
function sachStats(){
  var out=[];
  SACH.forEach(function(s){
    var d=adv.sach[s[0]];if(!d||!d.on)return;
    var rows=d.rows.filter(function(r){return r.ist.s||r.soll.s||r.ist.t||r.soll.t});
    var cnt={nein:0,teil:0},cs={ja:0};
    d.rows.forEach(function(r){if(r.ist.s==='nein')cnt.nein++;else if(r.ist.s==='teil')cnt.teil++});
    out.push({key:s[0],name:s[1],rows:rows,nein:cnt.nein,teil:cnt.teil,bIst:nv(d.bIst),bSoll:nv(d.bSoll),tIst:d.tIst,tSoll:d.tSoll});
  });
  return out;
}

/* ---- Diagramme (Canvas, heller Hintergrund, für Bildschirm und PDF) ---- */
var FONT='Arial, Helvetica, sans-serif';
function cv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);return {c:c,x:x}}
function niceMax(v){if(!(v>0))return 1;var p=Math.pow(10,Math.floor(Math.log(v)/Math.LN10)),m=v/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p}
function stackedBars(bars,o){
  o=o||{};var W=o.w||1100,H=o.h||560,k=cv(W,H),x=k.x,L=120,R=40,T=64,B=130,pw=W-L-R,ph=H-T-B;
  var tot=bars.map(function(b){return b.segs.reduce(function(s,g){return s+(g.v>0?g.v:0)},0)});
  var mx=niceMax(Math.max.apply(null,tot.concat([o.ref?o.ref.v:0,1]))*1.08);
  x.fillStyle='#16202A';x.font='bold 26px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText(o.title||'',L,34);
  x.font='20px '+FONT;x.fillStyle='#5B6773';x.fillText(o.unit||'Euro pro Monat',L,58);
  x.textBaseline='middle';
  for(var i=0;i<=5;i++){var yv=mx*i/5,y=T+ph-ph*i/5;x.strokeStyle='#E3E8ED';x.lineWidth=1;x.beginPath();x.moveTo(L,y);x.lineTo(W-R,y);x.stroke();x.fillStyle='#5B6773';x.textAlign='right';x.font='19px '+FONT;x.fillText(nf.format(yv),L-10,y)}
  var gap=pw/bars.length,bw=Math.min(190,gap*0.55);
  bars.forEach(function(b,j){
    var cx=L+gap*(j+0.5),y0=T+ph;
    b.segs.forEach(function(g){
      if(!(g.v>0))return;var h=g.v/mx*ph;x.fillStyle=g.c;x.fillRect(cx-bw/2,y0-h,bw,h);
      if(h>30){x.fillStyle='#fff';x.textAlign='center';x.font='bold 19px '+FONT;x.fillText(eur(g.v),cx,y0-h/2)}
      y0-=h;
    });
    x.fillStyle='#16202A';x.textAlign='center';x.font='bold 21px '+FONT;x.fillText(eur(tot[j]),cx,y0-16);
    x.font='20px '+FONT;x.fillStyle='#16202A';x.textBaseline='alphabetic';
    var words=b.label.split(' '),l1=words.slice(0,Math.ceil(words.length/2)).join(' '),l2=words.slice(Math.ceil(words.length/2)).join(' ');
    x.fillText(l1,cx,T+ph+30);if(l2)x.fillText(l2,cx,T+ph+54);x.textBaseline='middle';
  });
  if(o.ref&&o.ref.v>0){var ry=T+ph-o.ref.v/mx*ph;x.save();x.setLineDash([10,7]);x.strokeStyle='#16202A';x.lineWidth=2.5;x.beginPath();x.moveTo(L,ry);x.lineTo(W-R,ry);x.stroke();x.restore();x.fillStyle='#16202A';x.textAlign='left';x.font='bold 18px '+FONT;x.fillText(o.ref.label,L+6,ry-14)}
  var seen={},leg=[];bars.forEach(function(b){b.segs.forEach(function(g){if(g.v>0&&!seen[g.t]){seen[g.t]=1;leg.push(g)}})});
  var lx=L,ly=H-38;x.font='19px '+FONT;x.textAlign='left';
  leg.forEach(function(g){var tw=x.measureText(g.t).width+44;if(lx+tw>W-R){lx=L;ly+=28}x.fillStyle=g.c;x.fillRect(lx,ly-9,18,18);x.fillStyle='#16202A';x.fillText(g.t,lx+26,ly);lx+=tw});
  return k.c;
}
function rrect(x,X,Y,w,h,r,fill,stroke){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();if(fill){x.fillStyle=fill;x.fill()}if(stroke){x.strokeStyle=stroke;x.lineWidth=3;x.stroke()}}
function arrow(x,x1,y1,x2,y2,col){x.strokeStyle=col||'#5B6773';x.fillStyle=col||'#5B6773';x.lineWidth=4;x.beginPath();x.moveTo(x1,y1);x.lineTo(x2,y2);x.stroke();var a=Math.atan2(y2-y1,x2-x1);x.beginPath();x.moveTo(x2,y2);x.lineTo(x2-16*Math.cos(a-0.45),y2-16*Math.sin(a-0.45));x.lineTo(x2-16*Math.cos(a+0.45),y2-16*Math.sin(a+0.45));x.closePath();x.fill()}
function boxTxt(x,X,Y,w,h,fill,l1,l2,l3){rrect(x,X,Y,w,h,16,fill);x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='bold 22px '+FONT;x.fillText(l1,X+w/2,Y+h*(l3?0.24:0.3));x.font='bold 30px '+FONT;x.fillText(l2,X+w/2,Y+h*(l3?0.52:0.66));if(l3){x.font='19px '+FONT;x.fillText(l3,X+w/2,Y+h*0.82)}}
function konzeptDiagram(c){
  var k=cv(1100,560),x=k.x,ru=c.prods.filter(function(p){return p.key==='ru'})[0],fp=c.prods.filter(function(p){return p.key==='fp'})[0];
  var T=ru?ru.T:NaN,Tm=T/12;
  x.fillStyle='#16202A';x.font='bold 26px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Konzept: Rürup-Rente und Fondspolice',40,36);
  boxTxt(x,40,200,260,140,'#5B6773','Eigener Beitrag',eur(ru.b)+' / Monat','in die Rürup-Rente');
  boxTxt(x,380,70,300,140,'#1F7A8C','Rürup-Rente',eur(ru.b)+' / Monat',isNaN(T)?'':'Steuerersparnis '+eur(T)+' / Jahr');
  boxTxt(x,380,350,300,140,'#6B4FA0','Fondspolice',eur(fp.b)+' / Monat',isNaN(Tm)?'':'Steuerersparnis ≈ '+eur(Tm)+' / Monat');
  boxTxt(x,760,70,300,140,'#1F7A8C','Rente im Ruhestand',isNaN(ru.rIn)?'-':eur(ru.rIn)+' / Monat','aus der Rürup-Rente');
  boxTxt(x,760,350,300,140,'#6B4FA0','Entnahme im Ruhestand',isNaN(fp.rIn)?'-':eur(fp.rIn)+' / Monat','aus der Fondspolice');
  arrow(x,300,250,378,160);
  arrow(x,530,212,530,346,'#B8690A');
  x.fillStyle='#B8690A';x.font='bold 20px '+FONT;x.textAlign='left';x.textBaseline='middle';x.fillText('Steuerersparnis wird investiert',546,280);
  arrow(x,682,140,756,140);arrow(x,682,420,756,420);
  var sum=(isNaN(ru.rIn)?0:ru.rIn)+(isNaN(fp.rIn)?0:fp.rIn);
  x.fillStyle='#16202A';x.textAlign='center';x.font='bold 24px '+FONT;x.fillText('Zusammen im Ruhestand: '+eur(sum)+' / Monat',550,534);
  return k.c;
}
function chartLueckeIst(c){
  var u='Euro pro Monat, in heutiger Kaufkraft';
  return stackedBars([
    {label:'Wunsch: Versorgungsziel',segs:[{v:c.ziel,c:'#5B6773',t:'Versorgungsziel'}]},
    {label:'Erwartung im Ruhestand',segs:[{v:c.rente,c:'#25507A',t:'Gesetzliche Rente'},{v:c.bav,c:'#B8690A',t:'Betriebsrente'},{v:c.lueckeHeute,c:'#B3362D',t:'Versorgungslücke'}]}
  ],{title:'Aktueller Stand: Wunsch gegen Erwartung',unit:u});
}
function chartLueckeSoll(c){
  var segs=[{v:c.rente,c:'#25507A',t:'Gesetzliche Rente'},{v:c.bav,c:'#B8690A',t:'Betriebsrente'}];
  c.prods.forEach(function(p){if(p.r>0)segs.push({v:p.r,c:p.c,t:p.name})});
  segs.push({v:c.lueckeNach,c:'#B3362D',t:'Restliche Lücke'});
  return stackedBars([
    {label:'Aktueller Stand',segs:[{v:c.rente,c:'#25507A',t:'Gesetzliche Rente'},{v:c.bav,c:'#B8690A',t:'Betriebsrente'},{v:c.lueckeHeute,c:'#B3362D',t:'Versorgungslücke'}]},
    {label:'Mit unserer Lösung',segs:segs}
  ],{title:'Aktueller Stand gegen neuer Stand',unit:'Euro pro Monat, in heutiger Kaufkraft',ref:{v:c.ziel,label:'Ziel '+eur(c.ziel)}});
}



/* ================= Cockpit: Zahlen ================= */
function trichter(days){
  var from=addDaysIso(todayIso(),-days),L=db.beratungen.filter(function(b){return b.datum>=from});
  var an=L.filter(function(b){return b.erg==='angebot'||b.erg==='abschluss'}).length,ab=L.filter(function(b){return b.erg==='abschluss'}).length,ver=L.filter(function(b){return b.erg==='verloren'}),gr={},by={};
  ver.forEach(function(b){var k=b.grund||'Ohne Angabe';gr[k]=(gr[k]||0)+1});
  BEREICHE.forEach(function(k){by[k]={g:0,a:0}});
  L.forEach(function(b){if(by[b.bereich]){by[b.bereich].g++;if(b.erg==='abschluss')by[b.bereich].a++}});
  return {g:L.length,an:an,ab:ab,ver:ver.length,gr:Object.keys(gr).map(function(k){return [k,gr[k]]}).sort(function(a,b){return b[1]-a[1]}),by:by,ohne:L.filter(function(b){return !b.erg||b.erg==='offen'}).length};
}
function dayFracs(){
  var T=todayIso(),ws=weekStart(),we=endOfWeekIso(),wsTs=toTs(ws),goal=Number(db.settings.wochenziel)||10;
  var ter=db.termine.filter(function(x){return x.datum>=ws&&x.datum<=we}),terDone=ter.filter(function(x){return x.datum<=T}).length;
  var doneT=db.todos.filter(function(x){return x.done&&x.doneAt>=wsTs}).length,openT=db.todos.filter(function(x){return !x.done&&x.due&&x.due<=we}).length;
  var ber=db.beratungen.filter(function(b){return b.datum>=ws&&b.datum<=T}).length;
  return {ter:[terDone,ter.length],auf:[doneT,doneT+openT],ges:[ber,goal]};
}
function ringSvg(f){
  function fr(a){return a[1]>0?Math.min(1,a[0]/a[1]):0}
  var R=[[96,fr(f.ter),'var(--cta)'],[72,fr(f.auf),'var(--ok)'],[48,fr(f.ges),'var(--amber)']],g='',c=0,n=0;
  R.forEach(function(r){var C=2*Math.PI*r[0];g+='<circle cx="110" cy="110" r="'+r[0]+'" fill="none" stroke="var(--line)" stroke-width="14"/><circle cx="110" cy="110" r="'+r[0]+'" fill="none" stroke="'+r[2]+'" stroke-width="14" stroke-linecap="round" stroke-dasharray="'+(C*r[1]).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 110 110)"/>'});
  [f.ter,f.auf,f.ges].forEach(function(a){if(a[1]>0){c+=fr(a);n++}});
  var pct=n?Math.round(c/n*100):0;
  return '<svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="Tagesradar">'+g+'<text x="110" y="108" text-anchor="middle" fill="var(--ink)" font-size="38" font-weight="700" font-family="Space Grotesk">'+pct+'%</text><text x="110" y="130" text-anchor="middle" fill="var(--muted)" font-size="11" font-family="JetBrains Mono" letter-spacing="2">DIESE WOCHE</text></svg>';
}
function nextAction(){
  var r=radarList().filter(function(o){return o.i.st==='verpasst'||o.i.st==='dringend'})[0];
  if(r)return {t:r.v.kunde+' · '+r.v.sparte,s:vtText(r.i),b:'Vertrag öffnen',act:'open-vertrag',id:r.v.id};
  var w=waitList()[0];
  if(w)return {t:w.kunde+' nachfassen',s:w.text+' · nachfassen '+whenLabel(w.due),b:'Erinnerung per Mail',act:'wait-mail',id:w.id};
  var d=taskData(),it=d.g.now[0]||d.g.week[0];
  if(it)return it.kind==='todo'?{t:it.x.kunde+': '+it.x.text,s:whenLabel(it.x.due),b:'Aufgabe öffnen',act:'open-todo',id:it.x.id}:{t:it.x.kunde+': Angebot '+it.x.sparte,s:'Nachfassen '+whenLabel(it.x.nachfass),b:'Angebot öffnen',act:'open-ang',id:it.x.id};
  return null;
}
function trichterHtml(){
  var t=trichter(30),h='<div class="pl">Trichter · letzte 30 Tage</div>';
  if(!t.g)return h+'<p class="hint-t" style="margin-top:12px">Noch keine Gespräche in diesem Zeitraum. Trage bei jeder Beratung das Ergebnis ein, dann siehst du hier, wo Kunden verloren gehen.</p>';
  function bar(l,n,w,c){return '<div class="fn"><div class="fl2"><span>'+l+'</span><b>'+n+'</b></div><div class="fb"><i style="width:'+Math.max(2,w)+'%;background:'+c+'"></i></div></div>'}
  h+='<div class="fnw">'+bar('Gespräche',t.g,100,'var(--accent)')+bar('Angebote',t.an,t.an/t.g*100,'var(--accent)')+bar('Abschlüsse',t.ab,t.ab/t.g*100,'var(--ok)')+'</div>';
  if(t.ohne)h+='<p class="hint-t">'+t.ohne+' Gespräch'+(t.ohne===1?'':'e')+' noch ohne Ergebnis.</p>';
  h+='<div class="pl" style="margin-top:16px">Warum verloren</div>';
  if(t.gr.length){var mx=t.gr[0][1];h+='<div class="grd">'+t.gr.map(function(g){return '<span>'+esc(g[0])+'</span><div class="fb loss"><i style="width:'+Math.round(g[1]/mx*100)+'%"></i></div><b>'+g[1]+'</b>'}).join('')+'</div>'}
  else h+='<p class="hint-t">Noch kein verlorenes Gespräch eingetragen.</p>';
  h+='<div class="pl" style="margin-top:16px">Quote je Bereich</div><div class="qg">'+BEREICHE.map(function(k){var b=t.by[k],q=b.g?Math.round(b.a/b.g*100):0;return '<div class="qc"><span>'+esc(k)+'</span><b>'+(b.g?q+' %':'-')+'</b><small>'+b.g+(b.g===1?' Gespräch, ':' Gespräche, ')+b.a+(b.a===1?' Abschluss':' Abschlüsse')+'</small></div>'}).join('')+'</div>';
  return h;
}

/* ================= Ganzheitlich beraten (Mindmap) ================= */
var GANZ=[
  ['sach','Sach & Haftpflicht','Hausrat, Gebäude, Haftpflicht','home'],
  ['gesund','Gesundheit & Pflege','Kranken, Zusatz, Pflege','heart'],
  ['einkommen','Einkommen & Familie','Berufsunfähigkeit, Familie','shieldok'],
  ['alter','Altersvorsorge','Rente, Rürup, Betriebsrente','hourglass'],
  ['vermoegen','Vermögen & Anlage','Fonds, Fondspolice, Sparen','rocket'],
  ['immo','Immobilie & Finanzierung','Baufinanzierung, Bausparen','bank'],
  ['nachlass','Nachlass & Vorsorge','Testament, Vollmacht, Erbe','layers'],
  ['konto','Konto & Alltag','Girokonto, Karten, Zahlung','wallet']
];
var ganzSolo={};
function ganzObj(){if(adv){if(!adv.ganz)adv.ganz={};return adv.ganz}return ganzSolo}
function ganzMods(){return adv?adv.mods:homeSel}
function ganzStatus(k){
  var m=ganzObj()[k];if(m)return m;
  var md=ganzMods();
  if((k==='alter'&&md.alter)||(k==='vermoegen'&&md.anlage)||(k==='gesund'&&md.kv)||(k==='sach'&&md.sach)||(k==='nachlass'&&md.vorsorge))return 'heute';
  return '';
}
function ganzInterest(){var der={};if(adv&&adv.ue)ueNext().forEach(function(r){der[r.area]=1});return GANZ.filter(function(g){return ganzObj()[g[0]]==='interest'||der[g[0]]}).map(function(g){return g[1]})}
function chartGanz(){
  var W=960,H=1190,k=cv(W,H),x=k.x,cx=480,cy=575,rx=330,ry=480;
  var col={heute:'#0A4A9C',interest:'#C26A00',have:'#2C7A57','':'#7B8794'};
  var lab={heute:'Heute Thema',interest:'Interesse',have:'Schon vorhanden','':''};
  var P=GANZ.map(function(g,i){var a=-Math.PI/2+i*Math.PI/4;return {g:g,x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)}});
  x.lineWidth=6;x.strokeStyle='#CBD3DB';x.lineCap='round';
  P.forEach(function(q){x.beginPath();x.moveTo(cx,cy);x.lineTo(q.x,q.y);x.stroke()});
  x.fillStyle='#EEF2F7';x.beginPath();x.arc(cx,cy,150,0,Math.PI*2);x.fill();
  x.fillStyle='#25507A';x.beginPath();x.arc(cx,cy,132,0,Math.PI*2);x.fill();
  x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';
  x.font='bold 36px '+FONT;x.fillText('Ganzheitlich',cx,cy-34);x.fillText('beraten',cx,cy+8);
  x.font='22px '+FONT;x.fillText('Ihre Ziele im',cx,cy+52);x.fillText('Mittelpunkt',cx,cy+80);
  function fit(t,size,bold,maxw,min){var f=size;do{x.font=(bold?'bold ':'')+f+'px '+FONT;if(x.measureText(t).width<=maxw||f<=min)break;f--}while(true)}
  function lines(t,maxw){x.font='bold 28px '+FONT;if(x.measureText(t).width<=maxw)return [t];var w=t.split(' '),best=[t],bd=1e9;for(var i=1;i<w.length;i++){var a=w.slice(0,i).join(' '),b=w.slice(i).join(' '),d=Math.abs(x.measureText(a).width-x.measureText(b).width);if(d<bd){bd=d;best=[a,b]}}return best}
  P.forEach(function(q){
    var st=ganzStatus(q.g[0]),c=col[st],w=300,h=140,X=q.x-w/2,Y=q.y-h/2,filled=st==='heute';
    x.save();x.shadowColor='rgba(16,32,48,.16)';x.shadowBlur=16;x.shadowOffsetY=5;rrect(x,X,Y,w,h,22,filled?c:'#fff');x.restore();
    rrect(x,X,Y,w,h,22,null,c);
    x.textAlign='center';x.textBaseline='middle';
    var L=lines(q.g[1],w-28),y0=L.length>1?Y+30:Y+40;
    x.fillStyle=filled?'#fff':'#16202A';x.font='bold 28px '+FONT;L.forEach(function(t,i){x.fillText(t,q.x,y0+i*32)});
    x.fillStyle=filled?'#DCE6F2':'#5B6773';fit(q.g[2],20,false,w-24,14);x.fillText(q.g[2],q.x,Y+(L.length>1?100:84));
    if(st){x.fillStyle=filled?'#fff':c;x.font='bold 19px '+FONT;x.fillText(lab[st],q.x,Y+(L.length>1?124:112))}
  });
  var Lg=[['heute','Heute Thema'],['interest','Interesse'],['have','Schon vorhanden'],['','Noch nicht besprochen']],tw=0;
  x.font='20px '+FONT;Lg.forEach(function(l){l.w=x.measureText(l[1]).width+30;tw+=l.w+18});
  var lx=(W-tw+18)/2;
  Lg.forEach(function(l){x.fillStyle=col[l[0]];x.beginPath();x.arc(lx+8,H-28,8,0,Math.PI*2);x.fill();x.fillStyle='#5B6773';x.textAlign='left';x.textBaseline='middle';x.font='20px '+FONT;x.fillText(l[1],lx+24,H-28);lx+=l.w+18});
  return k.c;
}
function ganzRows(){
  return GANZ.map(function(g){
    var cur=ganzObj()[g[0]]||'',st=ganzStatus(g[0]);
    return '<div class="gzr"><span class="gzi">'+ico(g[3],20)+'</span><div class="gzt"><strong>'+g[1]+'</strong><span>'+g[2]+(st==='heute'?' · <b>heute Thema</b>':'')+'</span></div>'+
      '<div class="gzb"><button class="gzc'+(cur==='interest'?' on i':'')+'" data-act="ganz-set" data-k="'+g[0]+'" data-s="interest" aria-pressed="'+(cur==='interest')+'">Interesse</button>'+
      '<button class="gzc'+(cur==='have'?' on h':'')+'" data-act="ganz-set" data-k="'+g[0]+'" data-s="have" aria-pressed="'+(cur==='have')+'">Vorhanden</button></div></div>';
  }).join('');
}
/* Lebensweg: Ereignisse und die drei größten Lücken */
var EREIGNIS=[
 ['heirat','Heirat oder Partnerschaft',{einkommen:3,gesund:1,nachlass:2,konto:1}],
 ['kind','Kind',{einkommen:4,gesund:2,sach:1,vermoegen:1}],
 ['haus','Haus oder Wohnung',{immo:4,sach:3,einkommen:2,alter:1}],
 ['job','Jobwechsel oder Selbstständigkeit',{alter:3,einkommen:3,gesund:2}],
 ['erbe','Erbe oder Schenkung',{vermoegen:4,nachlass:3,immo:1}],
 ['rente','Ruhestand rückt näher',{alter:4,gesund:2,nachlass:3,vermoegen:2}]
];
function evObj(){var g=ganzObj();if(!g._ev)g._ev={};return g._ev}
function lebensLuecken(){
  var ev=evObj(),sc={},why={};
  GANZ.forEach(function(g){sc[g[0]]=0;why[g[0]]=[]});
  EREIGNIS.forEach(function(e){if(ev[e[0]])Object.keys(e[2]).forEach(function(k){sc[k]+=e[2][k];why[k].push(e[1])})});
  return GANZ.filter(function(g){var st=ganzStatus(g[0]);return sc[g[0]]>0&&st!=='have'&&st!=='heute'}).sort(function(a,b){return sc[b[0]]-sc[a[0]]}).slice(0,3).map(function(g){return {g:g,why:why[g[0]]}});
}
function lebensHtml(){
  var ev=evObj(),L=lebensLuecken(),h='<div class="lw"><div class="pl">Was ist im Leben des Kunden passiert oder geplant?</div><div class="lwc">'+
    EREIGNIS.map(function(e){return '<button class="chip" data-act="ev-set" data-k="'+e[0]+'" aria-pressed="'+!!ev[e[0]]+'">'+e[1]+'</button>'}).join('')+'</div>';
  if(Object.keys(ev).some(function(k){return ev[k]})){
    h+='<div class="pl" style="margin-top:12px">Die größten Lücken dazu</div>';
    if(L.length)h+=L.map(function(o,i){return '<div class="lwg"><b>'+(i+1)+'</b><div><strong>'+o.g[1]+'</strong><span>Wegen: '+o.why.map(esc).join(', ')+'</span></div><button class="gzc'+(ganzObj()[o.g[0]]==='interest'?' on i':'')+'" data-act="ganz-set" data-k="'+o.g[0]+'" data-s="interest" aria-pressed="'+(ganzObj()[o.g[0]]==='interest')+'">Interesse</button></div>'}).join('');
    else h+='<p class="hint-t">Keine offenen Lücken. Alles Wichtige ist besprochen oder vorhanden.</p>';
  }
  return h+'</div>';
}
function ganzForm(){return '<div class="gz" data-ganz-form>'+lebensHtml()+ganzRows()+'</div>'}
function ganzBox(){return '<div class="chartbox" data-c="ganz"></div>'}
function ganzRefresh(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-ganz-form]'),function(e){e.innerHTML=lebensHtml()+ganzRows()});
  Array.prototype.forEach.call(document.querySelectorAll('.chartbox[data-c="ganz"]'),function(b){b.innerHTML='';var c=chartGanz();c.style.width='100%';c.style.height='auto';b.appendChild(c)});
}
function openGanz(){
  var h='<h3>Mehr als Versicherung</h3><p class="hint-t" style="margin-top:2px">Wir begleiten Sie in allen Lebensbereichen. Tippe an, was für den Kunden spannend ist oder schon vorhanden ist.</p>'+ganzBox()+ganzForm()+
    '<p class="hint-t">Das Angebot hängt von der Bank und ihren Partnern ab. Die Übersicht ist eine Orientierung und keine Empfehlung.</p><div class="btnrow"><button class="btn primary" data-act="close">Schließen</button></div>';
  openSheet(h);drawCharts($('sheetbody'));
}

/* ---- Oberfläche ---- */
function fld(path,label,o){
  o=o||{};var v=getp(adv,path);
  return '<label class="fl"><span>'+label+'</span><span class="fi"><input type="text" inputmode="'+(o.mode||'decimal')+'" data-adv="'+path+'" value="'+esc(v)+'" placeholder="'+esc(o.ph||'')+'" autocomplete="off"'+(o.max?' maxlength="'+o.max+'"':'')+'>'+(o.unit?'<em>'+o.unit+'</em>':'')+'</span>'+(o.hint?'<small>'+o.hint+'</small>':'')+'</label>';
}
function chk(path,label){return '<label class="ck"><input type="checkbox" data-adv="'+path+'"'+(getp(adv,path)?' checked':'')+'> '+label+'</label>'}
function ampSel(path,val){
  return '<select data-adv="'+path+'" data-amp="'+esc(val)+'" aria-label="Status">'+['','ja','teil','nein'].map(function(k){return '<option value="'+k+'"'+(k===val?' selected':'')+'>'+(k===''?'offen':AMP[k])+'</option>'}).join('')+'</select>';
}
function stat(label,val,sub,cls){var si=/bad/.test(cls||'')?'alert':/good/.test(cls||'')?'trend':/grow/.test(cls||'')?'rocket':'';return '<div class="stat '+(cls||'')+'"><div class="sl">'+(si?'<span class="si">'+ico(si,14)+'</span>':'')+label+'</div><div class="sv">'+val+'</div>'+(sub?'<div class="ss">'+sub+'</div>':'')+'</div>'}

function stepForm(id){
  if(id==='start')return fStart();if(id==='al_ist')return fAlIst();if(id==='al_loes')return fAlLoes();if(id==='sach')return fSach();if(id==='an')return fAn();if(id==='kv')return fKv();if(id==='brief')return fBrief();if(id==='pf')return pfWizardForm();if(id==='bu')return buForm();if(id==='zus')return zusForm();if(id==='vp')return fVp();return fOut();
}
function fAlIst(){
  return '<h3 class="sh">Altersvorsorge: aktueller Stand</h3><div class="grid2">'+
    fld('al.alter','Alter heute',{unit:'Jahre'})+fld('al.rentenalter','Rentenalter',{unit:'Jahre'})+
    fld('al.lebenserw','Planung bis Alter',{unit:'Jahre'})+fld('al.infl','Inflation',{unit:'% p. a.'})+'</div>'+
    '<label class="fl"><span>Rentenwerte eingeben als</span><select data-adv="al.modus"><option value="heute"'+(adv.al.modus==='heute'?' selected':'')+'>in heutiger Kaufkraft</option><option value="nom"'+(adv.al.modus==='nom'?' selected':'')+'>zum Rentenbeginn (z. B. Renteninformation)</option></select><small>Gilt für gesetzliche Rente, Betriebsrente und die Produkte im nächsten Schritt.</small></label>'+
    fld('al.gehalt','Aktuelles Netto-Gehalt',{unit:'€ / Monat'})+
    fld('al.zielPct','Versorgungsziel',{unit:'% vom Netto',hint:'100 % bedeutet: der Kunde möchte im Ruhestand so viel wie heute.'})+
    fld('al.brutto','Rente laut Renteninformation (brutto)',{unit:'€ / Monat',hint:'Optional. Daraus wird die Netto-Rente geschätzt.'})+fld('al.abzug','Abzüge für Steuer, Kranken- und Pflegeversicherung',{unit:'%'})+fld('al.rente','Erwartete gesetzliche Rente (netto)',{unit:'€ / Monat',hint:'Netto nach Steuern und Krankenversicherung. Wird bei Eingabe der Brutto-Rente berechnet.'})+
    fld('al.bav','Betriebsrente (bAV)',{unit:'€ / Monat',hint:'Netto, leer lassen wenn keine.'})+
    '<details class="adv"><summary>Annahmen für die Modellrechnung</summary><div class="grid2">'+fld('al.ra','Rendite Ansparphase',{unit:'% p. a.'})+fld('al.re','Rendite Rentenphase',{unit:'% p. a.'})+'</div><p class="hint-t">Nur für die Frage, welche Sparrate rechnerisch nötig wäre. Wertentwicklungen sind nicht garantiert.</p></details>';
}
function prodBox(key,title,extra){
  var p=adv.al[key];
  return '<div class="pbox">'+chk('al.'+key+'.on',title)+(p.on?'<div class="grid2">'+fld('al.'+key+'.b','Beitrag',{unit:'€ / Monat'})+fld('al.'+key+'.r',extra.rl,{unit:'€ / Monat'})+'</div>'+(extra.more||''):'')+'</div>';
}
function fAlLoes(){
  var a=adv.al;
  return '<h3 class="sh">Altersvorsorge: unsere Lösung</h3><p class="hint-t">Trage die Ergebnisse aus deiner Berechnung ein ('+(a.modus==='nom'?'zum Rentenbeginn':'in heutiger Kaufkraft')+').</p>'+
    prodBox('ru','Rürup-Rente (fondsbasiert)',{rl:'Erwartete Rente',more:fld('al.steuer','Grenzsteuersatz des Kunden',{unit:'%',hint:'Für die Steuerersparnis. Schätzwert inkl. Zuschläge.'})+fld('al.ru.tOver','Steuerersparnis pro Jahr (manuell)',{unit:'€ / Jahr',hint:'Optional. Überschreibt die Berechnung aus Beitrag und Steuersatz.'})})+
    prodBox('fp','Fondspolice',{rl:'Entnahmebetrag zu Rentenbeginn',more:(a.ru.on?'<button class="btn small" data-act="adv-fp-from-tax">Beitrag aus Steuerersparnis übernehmen</button>':'')})+
    prodBox('ad','Altersvorsorgedepot (ab 2027)',{rl:'Erwartete Entnahme',more:fld('al.ad.z','Zulagen pro Jahr (manuell)',{unit:'€ / Jahr',hint:'Optional, aus deiner Berechnung.'})})+
    fld('al.quelle','Hinweis zur Berechnung',{mode:'text',max:120,ph:'z. B. Berechnung der Gesellschaft, Stand 10/2026',hint:'Erscheint im PDF unter den Zahlen.'});
}
function rowHtml2(sp,r,i){
  var b='sach.'+sp+'.rows.'+i;
  return '<div class="mrow"><div class="mname"><input type="text" data-adv="'+b+'.name" value="'+esc(r.name)+'" maxlength="90" aria-label="Merkmal"><button class="x" data-act="adv-row-del" data-sp="'+sp+'" data-i="'+i+'" aria-label="Zeile entfernen">×</button></div>'+
    '<div class="mcols"><div><small>Aktueller Stand</small>'+ampSel(b+'.ist.s',r.ist.s)+'<input type="text" data-adv="'+b+'.ist.t" value="'+esc(r.ist.t)+'" maxlength="80" placeholder="Angabe" aria-label="Angabe aktuell"></div>'+
    '<div><small>Neuer Stand</small>'+ampSel(b+'.soll.s',r.soll.s)+'<input type="text" data-adv="'+b+'.soll.t" value="'+esc(r.soll.t)+'" maxlength="80" placeholder="Angabe" aria-label="Angabe neu"></div></div></div>';
}
function fSach(){
  var h='<h3 class="sh">Sachversicherungen: Ist gegen Soll</h3><p class="hint-t">Wähle die Sparten für das Gespräch. Zeilen, bei denen nichts eingetragen ist, erscheinen nicht im PDF.</p>';
  SACH.forEach(function(s){
    var d=adv.sach[s[0]];
    h+='<div class="pbox">'+chk('sach.'+s[0]+'.on',s[1]);
    if(d.on){
      h+=d.rows.map(function(r,i){return rowHtml2(s[0],r,i)}).join('')+
        '<div class="btnrow" style="margin-top:8px"><button class="btn small" data-act="adv-row-add" data-sp="'+s[0]+'">Zeile hinzufügen</button><button class="btn small" data-act="adv-row-reset" data-sp="'+s[0]+'" data-confirm="Zeilen aus Katalog neu laden?">Aus Katalog neu laden</button></div>'+
        '<div class="grid2">'+fld('sach.'+s[0]+'.tIst','Tarif aktuell',{mode:'text',max:60})+fld('sach.'+s[0]+'.tSoll','Tarif neu',{mode:'text',max:60})+
        fld('sach.'+s[0]+'.bIst','Beitrag aktuell',{unit:'€ / Jahr'})+fld('sach.'+s[0]+'.bSoll','Beitrag neu',{unit:'€ / Jahr'})+'</div>';
    }
    h+='</div>';
  });
  return h;
}

function ganzSachBox(){return '<div class="ganzcard"><h4 class="gh">Ganzheitlich beraten</h4><p class="hint-t">Sachversicherungen sind ein Baustein. Zeige dem Kunden, was wir sonst noch für ihn tun können.</p>'+ganzBox()+ganzForm()+'</div>'}

/* Ergebnisbereich je Schritt */
function stepRes(id){
  if(id==='zus')return zusLive();
  if(id==='al_ist'){
    var c=calcAl();if(c.err)return '<div class="note">'+esc(c.err)+'</div>';
    var h='<div class="stats">'+stat('Versorgungsziel',eur(c.ziel),'heutige Kaufkraft')+stat('Erwartung im Ruhestand',eur(c.rente+c.bav),'gesetzliche Rente und Betriebsrente')+
      stat('Versorgungslücke',eur(c.lueckeHeute),'pro Monat, heutige Kaufkraft','bad')+stat('Lücke bei Rentenbeginn',eur(c.lueckeNom),'in '+c.n+' Jahren, mit '+pctS(c.o.infl)+' Inflation')+'</div>';
    h+='<div class="chartbox" data-c="ist"></div>';
    if(c.lueckeHeute>0&&isFinite(c.b.sNow))h+='<div class="stats">'+stat('Rechnerisch nötige Sparrate',eur(c.b.sNow),'pro Monat bei '+pctS(c.o.ra)+' Rendite, vor Steuern und Kosten')+stat('Ein Jahr später starten',isFinite(c.b.sDelay)?eur(c.b.sDelay):'-',isFinite(c.b.delayCost)?'+'+eur(c.b.delayCost)+' pro Monat':'')+stat('Kapitalbedarf bei Rentenbeginn',eur(c.b.C),'bis Alter '+c.o.lebenserw)+'</div><p class="hint-t">Modellrechnung. Wertentwicklungen sind nicht garantiert.</p>';
    return h;
  }
  if(id==='al_loes'){
    var c2=calcAl();if(c2.err)return '<div class="note">'+esc(c2.err)+' (Schritt Ist-Stand)</div>';
    if(!c2.prods.length)return '<div class="note">Wähle mindestens ein Produkt.</div>';
    var ru=c2.prods.filter(function(p){return p.key==='ru'})[0],h2='<div class="stats">'+stat('Beiträge gesamt',eur(c2.sumB),'pro Monat')+stat('Rente und Entnahme neu',eur(c2.sumR),'pro Monat, heutige Kaufkraft')+stat('Gesamt im Ruhestand',eur(c2.gesamtNach),'von Ziel '+eur(c2.ziel))+stat('Restliche Lücke',eur(c2.lueckeNach),'pro Monat',c2.lueckeNach>0?'bad':'good')+'</div>';
    if(ru){
      h2+='<div class="stats">'+stat('Steuerersparnis Rürup',isNaN(ru.T)?'-':eur(ru.T),'pro Jahr'+(isNaN(ru.T)?', Steuersatz oder Betrag eintragen':''),isNaN(ru.T)?'':'good')+'</div>';
      if(ru.jb>RURUP_MAX)h2+='<div class="note">Der Jahresbeitrag liegt über dem Höchstbetrag 2026 für Einzelveranlagte ('+eur(RURUP_MAX)+'; zusammen veranlagt '+eur(RURUP_MAX2)+'). Darüber hinaus gibt es keine Steuerförderung.</div>';
      var fp=c2.prods.filter(function(p){return p.key==='fp'})[0];
      if(fp)h2+='<div class="chartbox" data-c="konzept"></div>';
    }
    h2+='<div class="chartbox" data-c="soll"></div>';
    if(c2.prods.some(function(p){return isNaN(p.rIn)}))h2+='<div class="note">Bei mindestens einem Produkt fehlt die erwartete Rente oder Entnahme.</div>';
    return h2;
  }
  if(id==='sach'){
    var ss=sachStats();if(!ss.length)return '<div class="note">Wähle mindestens eine Sparte.</div>'+ganzSachBox();
    var tI=0,tS=0,h3='<div class="stats">';
    ss.forEach(function(s){if(isFinite(s.bIst))tI+=s.bIst;if(isFinite(s.bSoll))tS+=s.bSoll;h3+=stat(s.name,s.nein+' Lücken',s.teil+' teilweise gedeckt',s.nein>0?'bad':'')});
    h3+=stat('Beitrag aktuell',eur(tI),'pro Jahr')+stat('Beitrag neu',eur(tS),'pro Jahr')+'</div>';return h3+ganzSachBox();
  }
  if(id==='an')return anRes();
  if(id==='kv')return kvRes()+'<div class="sh2">Beitragsentwicklung</div>'+entwRes()+'<div class="sh2">Im Alter</div>'+alterRes();
  if(id==='brief')return briefRes();
  if(id==='pf')return pfRes();
  return '';
}
function renderWizard(){if(talkOpen&&cur){renderTalk(true);return}var y=window.scrollY;render();window.scrollTo(0,y)}

/* ---- Bericht (Blöcke für PDF und HTML) ---- */
function pdfTxt(s){return String(s==null?'':s).replace(/€/g,'EUR').replace(/[–—]/g,'-').replace(/[„“”]/g,'"').replace(/[’‘]/g,"'").replace(/≈/g,'ca.').replace(/·/g,'|').replace(/×/g,'x')}
function renderPdf(blocks){
  var J=window.jspdf.jsPDF,d=new J({unit:'mm',format:'a4'}),W=210,H=297,M=18,CW=W-2*M,y=M;
  function need(h){if(y+h>H-16){d.addPage();y=M+8}}
  function ink(){d.setTextColor(22,32,42)}
  blocks.forEach(function(b){
    if(b.t==='head'&&b.compact){
      d.setFillColor(11,27,51);d.rect(0,0,W,46,'F');d.setFillColor(34,227,255);d.rect(M,36,24,1.2,'F');
      d.setFont('helvetica','bold');d.setFontSize(8.5);d.setTextColor(34,227,255);d.text(pdfTxt(b.kick||'UEBERSICHT'),M,15);
      d.setFontSize(22);d.setTextColor(255,255,255);d.text(d.splitTextToSize(pdfTxt(b.title),CW),M,26);
      d.setFont('helvetica','normal');d.setFontSize(10.5);d.setTextColor(201,214,234);d.text(pdfTxt(b.sub),M,32);y=56;ink()}
    else if(b.t==='head'){
      d.setFillColor(11,27,51);d.rect(0,0,W,120,'F');d.setFillColor(34,227,255);d.rect(M,64,24,1.4,'F');
      d.setFont('helvetica','bold');d.setFontSize(9);d.setTextColor(34,227,255);d.text('BERATUNGSUNTERLAGE',M,30);
      d.setFontSize(30);d.setTextColor(255,255,255);var HT=d.splitTextToSize(pdfTxt(b.title),CW);d.text(HT,M,46);
      d.setFont('helvetica','normal');d.setFontSize(12);d.setTextColor(201,214,234);d.text(d.splitTextToSize(pdfTxt(b.sub),CW),M,76);
      var toc=[];blocks.forEach(function(x){if(x.t==='h'&&toc.indexOf(x.text)<0&&toc.length<14)toc.push(x.text)});
      d.setFont('helvetica','bold');d.setFontSize(12);d.setTextColor(11,27,51);d.text('Das finden Sie in dieser Unterlage',M,142);d.setDrawColor(10,74,156);d.setLineWidth(0.6);d.line(M,145,M+30,145);d.setLineWidth(0.2);
      d.setFont('helvetica','normal');d.setFontSize(11);d.setTextColor(22,32,42);var ty=156;
      toc.forEach(function(t,i){d.setFillColor(10,74,156);d.circle(M+2,ty-1.2,1.1,'F');d.text(d.splitTextToSize(pdfTxt(t),CW-10)[0],M+7,ty);ty+=8});
      d.setFontSize(8.5);d.setTextColor(91,103,115);d.text('Die Zahlen sind Modellrechnungen auf Ihren Angaben. Sie sind keine Garantie und keine Steuer- oder Rechtsberatung.',M,H-24);
      d.addPage();y=M+8;ink()}
    else if(b.t==='h'){need(36);y+=4;d.setFillColor(10,74,156);d.rect(M,y,1.6,7.5,'F');d.setFont('helvetica','bold');d.setFontSize(14);d.setTextColor(11,27,51);d.text(pdfTxt(b.text),M+5,y+5.6);y+=10;d.setDrawColor(213,219,225);d.line(M,y,W-M,y);y+=4;ink()}
    else if(b.t==='p'){d.setFont('helvetica','normal');d.setFontSize(10);ink();var L=d.splitTextToSize(pdfTxt(b.text),CW);need(L.length*5+2);d.text(L,M,y+4);y+=L.length*5+3}
    else if(b.t==='small'){d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(91,103,115);var L2=d.splitTextToSize(pdfTxt(b.text),CW);need(L2.length*3.8+3);d.text(L2,M,y+3);y+=L2.length*3.8+4;ink()}
    else if(b.t==='kv'){b.rows.forEach(function(r,i){need(9);var st=(i===b.strong);if(st){d.setFillColor(228,237,249);d.rect(M,y,CW,8.4,'F');d.setFillColor(10,74,156);d.rect(M,y,1.4,8.4,'F')}d.setFontSize(st?11.5:10);d.setFont('helvetica',st?'bold':'normal');if(st)d.setTextColor(6,48,107);else ink();d.text(pdfTxt(r[0]),M+(st?4:0),y+(st?5.7:4.5));d.text(pdfTxt(r[1]),W-M-(st?3:0),y+(st?5.7:4.5),{align:'right'});y+=st?9.6:6.5;ink();d.setDrawColor(235,238,242);if(!st)d.line(M,y-0.8,W-M,y-0.8)});y+=2}
    else if(b.t==='table'){
      var xs=[],acc=M;b.w.forEach(function(w){xs.push(acc);acc+=w*CW});
      need(8+Math.min(b.rows.length,3)*9);d.setFillColor(11,27,51);d.rect(M,y,CW,7,'F');d.setFont('helvetica','bold');d.setFontSize(9.5);d.setTextColor(255,255,255);b.head.forEach(function(t,i){d.text(pdfTxt(t),xs[i]+2,y+4.8)});y+=7;ink();
      b.rows.forEach(function(r,ri){
        d.setFont('helvetica',ri===b.rows.length-1&&r[0]==='Summe'?'bold':'normal');d.setFontSize(9.5);
        var cells=r.map(function(t,i){return d.splitTextToSize(pdfTxt(t),b.w[i]*CW-4)}),n=Math.max.apply(null,cells.map(function(c){return c.length})),h=n*4.6+3;
        need(h);cells.forEach(function(c,i){d.text(c,xs[i]+2,y+4.6)});y+=h;d.setDrawColor(235,238,242);d.line(M,y,W-M,y)});
      y+=4}
    else if(b.t==='vs2'){
      var gap=6,cwd=(CW-gap)/2,cards=[b.left].concat(b.right?[b.right]:[]);
      function vsLay(c){return c.rows.map(function(r){d.setFont('helvetica','bold');var tv=pdfTxt(r[1]),vw=(typeof d.getTextWidth==='function'?d.getTextWidth(tv):tv.length*1.8)+3;d.setFont('helvetica','normal');var L1=d.splitTextToSize(pdfTxt(r[0]),Math.max(cwd-8-vw,18));return {r:r,L:L1,h:Math.max(L1.length*4.4,5)+3}})}
      d.setFont('helvetica','normal');d.setFontSize(9);
      var lays=cards.map(vsLay),bh=0;
      lays.forEach(function(ls){var h=19;ls.forEach(function(x){h+=x.h});h+=13;bh=Math.max(bh,h)});
      need(bh+16);var y0=y;
      cards.forEach(function(c,ci){
        var x0=M+ci*(cwd+gap),ls=lays[ci];
        d.setDrawColor(213,219,225);d.setFillColor(255,255,255);d.rect(x0,y0,cwd,bh,'FD');
        d.setFillColor(c.col[0],c.col[1],c.col[2]);d.rect(x0,y0,cwd,15,'F');
        d.setFont('helvetica','bold');d.setFontSize(8);d.setTextColor(255,255,255);d.text(pdfTxt(c.tag),x0+4,y0+5);
        d.setFontSize(10.5);d.text(d.splitTextToSize(pdfTxt(c.title),cwd-8)[0],x0+4,y0+10);
        d.setFont('helvetica','normal');d.setFontSize(7.5);d.text(d.splitTextToSize(pdfTxt(c.sub),cwd-8)[0],x0+4,y0+13.6);
        var yy=y0+19;d.setFontSize(9);ink();
        ls.forEach(function(x){d.setFont('helvetica','normal');d.setFontSize(9);ink();d.text(x.L,x0+4,yy+3.4);d.setFont('helvetica','bold');d.text(pdfTxt(x.r[1]),x0+cwd-4,yy+3.4,{align:'right'});yy+=x.h;d.setDrawColor(235,238,242);d.line(x0+4,yy-1,x0+cwd-4,yy-1)});
        d.setFillColor(c.tint[0],c.tint[1],c.tint[2]);d.rect(x0,y0+bh-13,cwd,13,'F');d.setFillColor(c.col[0],c.col[1],c.col[2]);d.rect(x0,y0+bh-13,1.4,13,'F');
        d.setFont('helvetica','bold');d.setFontSize(8);d.setTextColor(c.col[0],c.col[1],c.col[2]);d.text(pdfTxt(c.total[0]),x0+5,y0+bh-7.6);
        d.setFontSize(13);d.text(pdfTxt(c.total[1]),x0+5,y0+bh-2.4);ink()});
      y=y0+bh+3;
      if(!b.right){d.setFont('helvetica','normal');d.setFontSize(8.5);d.setTextColor(91,103,115);d.text('Für die PKV sind noch keine Beiträge eingetragen.',M,y+3);y+=6;ink()}
      if(b.diff){need(11);d.setFillColor(11,27,51);d.rect(M,y,CW,9,'F');d.setFont('helvetica','bold');d.setFontSize(10.5);d.setTextColor(255,255,255);d.text(pdfTxt(b.diff),M+4,y+6);y+=12;ink()}
      else y+=3}
    else if(b.t==='card'){
      var cc=parseInt(String(b.col||'#25507A').slice(1),16),cr=cc>>16,cg=(cc>>8)&255,cb=cc&255;
      d.setFont('helvetica','normal');d.setFontSize(9);
      var rl=b.rows.map(function(r){return d.splitTextToSize(pdfTxt(r[1]),CW-40)}),ch=12;rl.forEach(function(l){ch+=Math.max(l.length*4.2,4.6)+1.6});
      need(ch+4);d.setFillColor(246,248,251);d.setDrawColor(213,219,225);d.rect(M,y,CW,ch,'FD');d.setFillColor(cr,cg,cb);d.rect(M,y,2,ch,'F');
      d.setFont('helvetica','bold');d.setFontSize(11);d.setTextColor(11,27,51);d.text(pdfTxt(b.title),M+6,y+6.4);
      d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(cr,cg,cb);d.text(pdfTxt(b.tag||''),W-M-4,y+6.4,{align:'right'});
      var cy=y+10;b.rows.forEach(function(r,i){d.setFont('helvetica','bold');d.setFontSize(8.5);d.setTextColor(91,103,115);d.text(pdfTxt(r[0]),M+6,cy+3.4);d.setFont('helvetica','normal');d.setFontSize(9);ink();d.text(rl[i],M+36,cy+3.4);cy+=Math.max(rl[i].length*4.2,4.6)+1.6});
      y+=ch+4}
    else if(b.t==='pb'){d.addPage();y=M+8}
    else if(b.t==='sh'){need(10);y+=2;d.setFont('helvetica','bold');d.setFontSize(10.5);d.setTextColor(10,74,156);d.text(pdfTxt(b.text),M,y+4);y+=7;ink()}
    else if(b.t==='facts'){
      b.rows.forEach(function(r){d.setFont('helvetica','normal');d.setFontSize(9.5);var L1=d.splitTextToSize(pdfTxt(r[1]),CW-34),h1=Math.max(L1.length*4.5,5)+2;need(h1);d.setFont('helvetica','bold');d.setTextColor(91,103,115);d.setFontSize(8.5);d.text(pdfTxt(r[0]).toUpperCase(),M,y+3.6);d.setFont('helvetica','normal');d.setFontSize(9.5);ink();d.text(L1,M+34,y+3.8);y+=h1;d.setDrawColor(235,238,242);d.line(M,y-0.6,W-M,y-0.6)});
      y+=3}
    else if(b.t==='topic'){
      var pcol=b.prio==='hoch'?[154,95,14]:b.prio==='mittel'?[10,74,156]:[110,120,132];
      var scol=b.stt==='ok'?[44,122,87]:b.stt==='warn'?[154,95,14]:[110,120,132];
      d.setFont('helvetica','normal');d.setFontSize(9);var kL=b.kenn?d.splitTextToSize(pdfTxt(b.kenn),CW-14):[],aL=d.splitTextToSize(pdfTxt(b.ansatz),CW-14),wL=b.why?d.splitTextToSize(pdfTxt(b.why),CW-14):[];
      var hh=22+(kL.length+aL.length+wL.length)*4.1+4;need(hh+4);
      d.setFillColor(246,248,251);d.setDrawColor(213,219,225);d.rect(M,y,CW,hh,'FD');d.setFillColor(pcol[0],pcol[1],pcol[2]);d.rect(M,y,2,hh,'F');
      d.setFont('helvetica','bold');d.setFontSize(11);d.setTextColor(11,27,51);d.text(d.splitTextToSize(pdfTxt(b.n+'   '+b.title),CW-14)[0],M+6,y+7);
      d.setFontSize(8);d.setTextColor(scol[0],scol[1],scol[2]);d.text(pdfTxt('Status: '+b.stl),M+6,y+12.5);d.setTextColor(pcol[0],pcol[1],pcol[2]);d.text(pdfTxt(b.prioL),W-M-4,y+12.5,{align:'right'});
      var yy=y+16;d.setFont('helvetica','normal');d.setFontSize(9);d.setTextColor(91,103,115);if(wL.length){d.text(wL,M+6,yy+3);yy+=wL.length*4.1+1.5}
      ink();if(kL.length){d.text(kL,M+6,yy+3);yy+=kL.length*4.1+1.5}d.setFont('helvetica','bold');d.setTextColor(10,74,156);d.text('Gesprächsansatz',M+6,yy+3);d.setFont('helvetica','normal');ink();yy+=0.2;
      d.text(aL,M+6,yy+7);y+=hh+4}
    else if(b.t==='notes'){
      need(38);y+=2;d.setFont('helvetica','bold');d.setFontSize(10.5);d.setTextColor(10,74,156);d.text(pdfTxt(b.title),M,y+4);y+=6;
      var nl=Math.max(3,Math.min(7,Math.floor((H-24-y)/7.5)));d.setDrawColor(200,207,215);for(var li=0;li<nl;li++){y+=7.5;d.line(M,y,W-M,y)}y+=4;ink()}
    else if(b.t==='chk'){
      need(16);d.setFillColor(11,27,51);d.rect(M,y,CW,7,'F');d.setFont('helvetica','bold');d.setFontSize(10);d.setTextColor(255,255,255);d.text(pdfTxt(b.title),M+3,y+4.9);y+=7;
      b.rows.forEach(function(r){var ind=r.sub?7:0;need(7.5);d.setFont('helvetica',r.sub?'normal':'bold');d.setFontSize(r.sub?9:10);ink();
        if(r.ok){d.setFillColor(44,122,87);d.circle(M+4+ind,y+3.8,1.8,'F')}else{d.setDrawColor(183,121,31);d.setLineWidth(0.5);d.circle(M+4+ind,y+3.8,1.8,'S');d.setLineWidth(0.2)}
        d.text(pdfTxt(r.name),M+9+ind,y+4.6);d.setFont('helvetica','normal');d.setFontSize(9);if(r.ok)d.setTextColor(44,122,87);else d.setTextColor(154,95,14);d.text(pdfTxt(r.text),W-M-3,y+4.6,{align:'right'});ink();
        y+=7;d.setDrawColor(235,238,242);d.line(M,y,W-M,y)});
      y+=5}
    else if(b.t==='rec'){
      d.setFont('helvetica','normal');d.setFontSize(9.5);var bl=d.splitTextToSize(pdfTxt(b.body),CW-20),fl=[];(b.facts||[]).forEach(function(f){fl.push(d.splitTextToSize(pdfTxt(f),CW-26))});
      d.setFont('helvetica','bold');d.setFontSize(9.5);var sl=d.splitTextToSize(pdfTxt('Naechster Schritt: '+b.step).replace('Naechster','Nächster'),CW-20);
      var fh=0;fl.forEach(function(f){fh+=f.length*4.3+1.2});
      var hh=12+bl.length*4.7+fh+sl.length*4.7+6;need(hh+4);
      d.setFillColor(244,247,251);d.setDrawColor(213,219,225);d.rect(M,y,CW,hh,'FD');d.setFillColor(10,74,156);d.rect(M,y,1.8,hh,'F');
      d.circle(M+9,y+7,4,'F');d.setFont('helvetica','bold');d.setFontSize(10);d.setTextColor(255,255,255);d.text(String(b.n),M+9,y+8.3,{align:'center'});
      d.setFontSize(12);d.setTextColor(11,27,51);d.text(pdfTxt(b.title),M+16,y+8);
      d.setFont('helvetica','normal');d.setFontSize(9);d.setTextColor(10,74,156);d.text(pdfTxt(b.tag||''),W-M-3,y+7.5,{align:'right'});
      var yy=y+13;d.setFont('helvetica','normal');d.setFontSize(9.5);ink();d.text(bl,M+16,yy+3);yy+=bl.length*4.7+1.5;
      fl.forEach(function(f){d.setFontSize(9);d.setFillColor(10,74,156);d.circle(M+18,yy+2.3,0.7,'F');d.text(f,M+21,yy+3);yy+=f.length*4.3+1.2});
      d.setFont('helvetica','bold');d.setFontSize(9.5);d.setTextColor(10,74,156);d.text(sl,M+16,yy+4);ink();
      y+=hh+5}
    else if(b.t==='img'){var w=b.w||CW,h=w*b.ratio;need(h+3);d.addImage(b.src,'PNG',M+(CW-w)/2,y,w,h,undefined,'FAST');y+=h+4}
    else if(b.t==='bul'){d.setFont('helvetica','normal');d.setFontSize(10);ink();b.items.forEach(function(it){var L3=d.splitTextToSize(pdfTxt(it),CW-6);need(L3.length*5+2);d.text('-',M+1,y+4);d.text(L3,M+6,y+4);y+=L3.length*5+1.5});y+=2}
    else if(b.t==='feat'){
      need(20);d.setFont('helvetica','bold');d.setFontSize(11);d.setTextColor(37,80,122);d.text(pdfTxt(b.title),M,y+4);y+=7;ink();
      d.setFillColor(227,232,237);d.rect(M,y,CW,7,'F');d.setFontSize(9.5);d.text('Merkmal',M+2,y+4.8);d.text('Ihre Police',M+0.5*CW+2,y+4.8);y+=7;
      b.rows.forEach(function(r){d.setFont('helvetica','normal');d.setFontSize(9);var nm=d.splitTextToSize(pdfTxt(r.name),0.5*CW-4),tx=d.splitTextToSize(pdfTxt(r.t||AMP[r.s||'']),0.5*CW-10),n=Math.max(nm.length,tx.length),h=n*4.3+3.2;need(h);d.text(nm,M+2,y+4.2);var col=AMPC[r.s||''];d.setFillColor(col[0],col[1],col[2]);d.circle(M+0.5*CW+4,y+3.4,1.5,'F');d.text(tx,M+0.5*CW+8,y+4.2);y+=h;d.setDrawColor(235,238,242);d.line(M,y,W-M,y)});y+=5}
    else if(b.t==='disc'){d.setFont('helvetica','italic');d.setFontSize(8.5);var Ld=d.splitTextToSize(pdfTxt(b.text),CW-8),hh=Ld.length*4+6;need(hh+4);y+=2;d.setFillColor(240,243,246);d.rect(M,y,CW,hh,'F');d.setTextColor(60,70,80);d.text(Ld,M+4,y+5);y+=hh+2;ink()}
    else if(b.t==='cmp'){
      var cw=[0.34,0.33,0.33],cx=[M,M+0.34*CW,M+0.67*CW];
      need(24);d.setFont('helvetica','bold');d.setFontSize(11);d.setTextColor(37,80,122);d.text(pdfTxt(b.title),M,y+4);y+=7;ink();
      d.setFillColor(227,232,237);d.rect(M,y,CW,7,'F');d.setFontSize(9.5);['Leistung','Aktueller Stand','Neuer Stand'].forEach(function(t,i){d.text(t,cx[i]+2,y+4.8)});y+=7;
      b.rows.forEach(function(r){
        d.setFont('helvetica','normal');d.setFontSize(9);
        var nm=d.splitTextToSize(pdfTxt(r.name),cw[0]*CW-4),a1=d.splitTextToSize(pdfTxt(r.ist.t||AMP[r.ist.s]),cw[1]*CW-10),a2=d.splitTextToSize(pdfTxt(r.soll.t||AMP[r.soll.s]),cw[2]*CW-10);
        var n=Math.max(nm.length,a1.length,a2.length),h=n*4.3+3.2;need(h);
        d.text(nm,cx[0]+2,y+4.2);
        [[r.ist,a1,1],[r.soll,a2,2]].forEach(function(z){var col=AMPC[z[0].s||''];d.setFillColor(col[0],col[1],col[2]);d.circle(cx[z[2]]+4,y+3.4,1.5,'F');d.text(z[1],cx[z[2]]+8,y+4.2)});
        y+=h;d.setDrawColor(235,238,242);d.line(M,y,W-M,y)});
      var bt=[];if(isFinite(b.bIst)||isFinite(b.bSoll)){need(9);d.setFont('helvetica','bold');d.setFontSize(9.5);ink();d.text('Beitrag pro Jahr',cx[0]+2,y+5);d.text(isFinite(b.bIst)?pdfTxt(eur(b.bIst)):'-',cx[1]+8,y+5);d.text(isFinite(b.bSoll)?pdfTxt(eur(b.bSoll)):'-',cx[2]+8,y+5);y+=7.5}
      if(b.tIst||b.tSoll){need(7);d.setFont('helvetica','normal');d.setFontSize(8.5);d.setTextColor(91,103,115);d.text('Tarif: '+pdfTxt(b.tIst||'-')+'  >  '+pdfTxt(b.tSoll||'-'),M+2,y+4);y+=6;ink()}
      y+=5;
    }
  });
  var n=d.getNumberOfPages();
  var HB=(blocks[0]&&blocks[0].t==='head')?blocks[0]:{},hdrT=HB.hdr||'BERATUNGSUNTERLAGE',ftT=HB.foot||'Modellrechnung, keine Garantie, keine Steuer- oder Rechtsberatung';renderPdf.pages=n;
  for(var i=1;i<=n;i++){d.setPage(i);d.setFont('helvetica','normal');d.setFontSize(8);if(i>1){d.setTextColor(11,27,51);d.setFont('helvetica','bold');d.text(pdfTxt(hdrT),M,12);d.setFont('helvetica','normal');d.setTextColor(91,103,115);d.text(fmtFull(todayIso()),W-M,12,{align:'right'});d.setDrawColor(34,227,255);d.setLineWidth(0.5);d.line(M,14.5,W-M,14.5);d.setLineWidth(0.2);d.setDrawColor(213,219,225);d.line(M,H-12,W-M,H-12)}d.setTextColor(120,128,138);d.text('Seite '+i+' von '+n,W-M,H-8,{align:'right'});d.text(pdfTxt(ftT),M,H-8)}
  return d.output('arraybuffer');
}
function renderHtmlReport(blocks){
  function e(s){return esc(String(s==null?'':s))}
  var h='<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Beratungsunterlage</title><style>@page{size:A4;margin:16mm 16mm 18mm}*{box-sizing:border-box}body{font:14px/1.55 Arial,Helvetica,sans-serif;max-width:780px;margin:0 auto;padding:0 16px 32px;color:#16202A}.cover{background:#0B1B33;color:#fff;margin:0 -16px 28px;padding:56px 40px 48px;min-height:380px;page-break-after:always;break-after:page}.cover .k{color:#22E3FF;font-size:12px;letter-spacing:.18em;font-weight:700}.cover h1{color:#fff;font-size:38px;line-height:1.1;margin:14px 0 14px}.cover .bar{width:60px;height:4px;background:#22E3FF;margin:18px 0}.cover p{color:#C9D6EA;font-size:16px;margin:0}.toc{padding:28px 0 0}.toc h3{margin:0 0 6px;font-size:16px;color:#0B1B33}.toc ul{list-style:none;padding:0;margin:14px 0}.toc li{padding:5px 0 5px 20px;position:relative}.toc li:before{content:"";position:absolute;left:0;top:13px;width:8px;height:8px;border-radius:50%;background:#0A4A9C}h2{font-size:19px;color:#0B1B33;border-left:5px solid #0A4A9C;padding:2px 0 2px 12px;margin:30px 0 10px;border-bottom:0;break-after:avoid}h3{color:#0A4A9C;break-after:avoid}table{border-collapse:collapse;width:100%;margin:8px 0;break-inside:auto}tr{break-inside:avoid}td,th{border-bottom:1px solid #E3E8ED;padding:7px 8px;text-align:left;vertical-align:top}th{background:#0B1B33;color:#fff;font-size:13px}tr.key td{background:#E4EDF9;border-left:4px solid #0A4A9C;font-weight:700;font-size:16px;color:#06306B}img{width:100%;margin:8px 0;break-inside:avoid}img.nar{width:60%;display:block;margin:8px auto}.s{font-size:12px;color:#5B6773}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}.vs{display:flex;gap:14px;margin:12px 0;break-inside:avoid}.vc{flex:1;border:1px solid #D5DBE1;border-radius:10px;overflow:hidden;display:flex;flex-direction:column}.vc table{margin:0;flex:1}.vh{padding:10px 14px;color:#fff;display:flex;flex-direction:column;gap:1px}.vh small{letter-spacing:.14em;font-weight:700;font-size:11px;opacity:.9}.vh b{font-size:16px}.vh span{font-size:12px;opacity:.9}.vt{padding:10px 14px;display:flex;flex-direction:column}.vt small{font-weight:700;font-size:12px}.vt strong{font-size:22px}.vd{background:#0B1B33;color:#fff;font-weight:700;padding:10px 14px;border-radius:8px;margin-bottom:12px}.cover.mini{min-height:0;padding:30px 36px;page-break-after:auto;break-after:auto}.cover.mini h1{font-size:30px;margin:8px 0}.cover h1{overflow-wrap:anywhere}@media(max-width:560px){.cover h1{font-size:26px}.cover.mini{padding:22px 18px}.cover{padding:36px 22px}}.chk{margin:12px 0;break-inside:avoid}.chk th{text-align:left}.chk tr.sub td{padding-left:28px;font-size:13px}.rec{background:#F4F7FB;border:1px solid #D5DBE1;border-left:5px solid #0A4A9C;border-radius:8px;padding:12px 16px;margin:12px 0;break-inside:avoid}.rec .rh{display:flex;align-items:center;gap:10px}.rec .rh b{background:#0A4A9C;color:#fff;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:14px}.rec .rh strong{font-size:17px;color:#0B1B33;flex:1}.rec .rh span{color:#0A4A9C;font-size:12px}.rec p{margin:8px 0}.rec .st{color:#0A4A9C;font-weight:700}.shh{margin:14px 0 4px;font-size:15px}.fcts th{width:150px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#5B6773;background:none;border-bottom:1px solid #E3E8ED}.tpc{background:#F6F8FB;border:1px solid #D5DBE1;border-left:5px solid #6E7884;border-radius:8px;padding:10px 14px;margin:10px 0;break-inside:avoid}.tpc.p-hoch{border-left-color:#9A5F0E}.tpc.p-mittel{border-left-color:#0A4A9C}.tpc .th{font-size:15px;color:#0B1B33}.tpc .tm{display:flex;justify-content:space-between;font-size:12px;margin:4px 0}.tpc .s-ok{color:#2C7A57}.tpc .s-warn{color:#9A5F0E}.tpc .s-miss,.tpc .s-off{color:#6E7884}.tpc .pp{font-weight:700}.tpc .why{color:#5B6773;margin:2px 0}.tpc p{margin:4px 0;font-size:13px}.nl{height:150px;background:repeating-linear-gradient(transparent,transparent 29px,#C8CFD7 29px,#C8CFD7 30px)}.foot{margin-top:30px;border-top:2px solid #22E3FF;padding-top:8px;font-size:11px;color:#5B6773}</style></head><body>';
  blocks.forEach(function(b){
    if(b.t==='head'&&b.compact){h+='<div class="cover mini"><div class="k">'+e(b.kick||'ÜBERSICHT')+'</div><h1>'+e(b.title)+'</h1><p>'+e(b.sub)+'</p></div>'}
    else if(b.t==='head'){var tc=[];blocks.forEach(function(x){if(x.t==='h'&&tc.indexOf(x.text)<0&&tc.length<14)tc.push(x.text)});h+='<div class="cover"><div class="k">BERATUNGSUNTERLAGE</div><h1>'+e(b.title)+'</h1><div class="bar"></div><p>'+e(b.sub)+'</p></div><div class="toc"><h3>Das finden Sie in dieser Unterlage</h3><ul>'+tc.map(function(t){return '<li>'+e(t)+'</li>'}).join('')+'</ul></div>'}
    else if(b.t==='h')h+='<h2>'+e(b.text)+'</h2>';
    else if(b.t==='p')h+='<p>'+e(b.text)+'</p>';
    else if(b.t==='small')h+='<p class="s">'+e(b.text)+'</p>';
    else if(b.t==='kv')h+='<table>'+b.rows.map(function(r,i){return '<tr'+(i===b.strong?' class="key"':'')+'><td>'+e(r[0])+'</td><td style="text-align:right">'+e(r[1])+'</td></tr>'}).join('')+'</table>';
    else if(b.t==='table')h+='<table><tr>'+b.head.map(function(t){return '<th>'+e(t)+'</th>'}).join('')+'</tr>'+b.rows.map(function(r){return '<tr>'+r.map(function(t){return '<td>'+e(t)+'</td>'}).join('')+'</tr>'}).join('')+'</table>';
    else if(b.t==='bul')h+='<ul>'+b.items.map(function(t){return '<li>'+e(t)+'</li>'}).join('')+'</ul>';
    else if(b.t==='feat')h+='<h3>'+e(b.title)+'</h3><table><tr><th>Merkmal</th><th>Ihre Police</th></tr>'+b.rows.map(function(r){var c=AMPC[r.s||''];return '<tr><td>'+e(r.name)+'</td><td><span class="dot" style="background:rgb('+c.join(',')+')"></span>'+e(r.t||AMP[r.s||''])+'</td></tr>'}).join('')+'</table>';
    else if(b.t==='disc')h+='<p class="s" style="border:1px solid #D5DBE1;padding:10px;background:#F0F3F6;font-style:italic">'+e(b.text)+'</p>';
    else if(b.t==='vs2'){h+='<div class="vs">'+[b.left,b.right].filter(Boolean).map(function(c){return '<div class="vc"><div class="vh" style="background:rgb('+c.col.join(',')+')"><small>'+e(c.tag)+'</small><b>'+e(c.title)+'</b><span>'+e(c.sub)+'</span></div><table>'+c.rows.map(function(r){return '<tr><td>'+e(r[0])+'</td><td style="text-align:right;white-space:nowrap"><b>'+e(r[1])+'</b></td></tr>'}).join('')+'</table><div class="vt" style="background:rgb('+c.tint.join(',')+');border-left:4px solid rgb('+c.col.join(',')+');color:rgb('+c.col.join(',')+')"><small>'+e(c.total[0])+'</small><strong>'+e(c.total[1])+'</strong></div></div>'}).join('')+'</div>'+(b.right?'':'<p class="s">Für die PKV sind noch keine Beiträge eingetragen.</p>')+(b.diff?'<div class="vd">'+e(b.diff)+'</div>':'')}
    else if(b.t==='card')h+='<div class="tpc" style="border-left-color:'+e(b.col)+'"><div class="tm"><strong class="th">'+e(b.title)+'</strong><span class="s">'+e(b.tag||'')+'</span></div><table class="fcts">'+b.rows.map(function(r){return '<tr><th>'+e(r[0])+'</th><td>'+e(r[1])+'</td></tr>'}).join('')+'</table></div>';
    else if(b.t==='pb')h+='<div style="break-after:page;page-break-after:always"></div>';
    else if(b.t==='sh')h+='<h3 class="shh">'+e(b.text)+'</h3>';
    else if(b.t==='facts')h+='<table class="fcts">'+b.rows.map(function(r){return '<tr><th>'+e(r[0])+'</th><td>'+e(r[1])+'</td></tr>'}).join('')+'</table>';
    else if(b.t==='topic')h+='<div class="tpc p-'+e(b.prio)+'"><div class="th"><strong>'+e(b.n)+'  '+e(b.title)+'</strong></div><div class="tm"><span class="s-'+e(b.stt)+'">Status: '+e(b.stl)+'</span><span class="pp">'+e(b.prioL)+'</span></div><p class="why">'+e(b.why)+'</p><p>'+e(b.kenn)+'</p><p><b style="color:#0A4A9C">Gesprächsansatz</b> '+e(b.ansatz)+'</p></div>';
    else if(b.t==='notes')h+='<h3 class="shh">'+e(b.title)+'</h3><div class="nl"></div>';
    else if(b.t==='chk')h+='<table class="chk"><tr><th colspan="2">'+e(b.title)+'</th></tr>'+b.rows.map(function(r){return '<tr'+(r.sub?' class="sub"':'')+'><td><span class="dot" style="background:'+(r.ok?'#2C7A57':'#fff;border:2px solid #B7791F;box-sizing:border-box')+'"></span>'+e(r.name)+'</td><td style="text-align:right;color:'+(r.ok?'#2C7A57':'#9A5F0E')+'">'+e(r.text)+'</td></tr>'}).join('')+'</table>';
    else if(b.t==='rec')h+='<div class="rec"><div class="rh"><b>'+b.n+'</b><strong>'+e(b.title)+'</strong><span>'+e(b.tag||'')+'</span></div><p>'+e(b.body)+'</p>'+((b.facts&&b.facts.length)?'<ul>'+b.facts.map(function(f){return '<li>'+e(f)+'</li>'}).join('')+'</ul>':'')+'<p class="st">Nächster Schritt: '+e(b.step)+'</p></div>';
    else if(b.t==='img')h+='<img'+(b.w?' class="nar"':'')+' src="'+b.src+'" alt="Diagramm">';
    else if(b.t==='cmp'){
      function cell(z){var c=AMPC[z.s||''];return '<td><span class="dot" style="background:rgb('+c.join(',')+')"></span>'+e(z.t||AMP[z.s||''])+'</td>'}
      h+='<h3>'+e(b.title)+'</h3><table><tr><th>Leistung</th><th>Aktueller Stand</th><th>Neuer Stand</th></tr>'+b.rows.map(function(r){return '<tr><td>'+e(r.name)+'</td>'+cell(r.ist)+cell(r.soll)+'</tr>'}).join('')+
        ((isFinite(b.bIst)||isFinite(b.bSoll))?'<tr><td><strong>Beitrag pro Jahr</strong></td><td>'+(isFinite(b.bIst)?e(eur(b.bIst)):'-')+'</td><td>'+(isFinite(b.bSoll)?e(eur(b.bSoll)):'-')+'</td></tr>':'')+'</table>';
    }
  });
  return h+'<div class="foot">Modellrechnung, keine Garantie, keine Steuer- oder Rechtsberatung.</div></body></html>';
}
function loadJsPdf(cb){
  if(window.jspdf&&window.jspdf.jsPDF)return cb(true);
  var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload=function(){cb(!!(window.jspdf&&window.jspdf.jsPDF))};s.onerror=function(){cb(false)};document.head.appendChild(s);
}
function advMsg(t,bad){var m=$('advmsg');if(m)m.innerHTML=t?'<p class="'+(bad?'err':'hint-t')+'" role="alert">'+esc(t)+'</p>':''}
function fileBase(){return 'Beratung'+(adv.kunde?'-'+adv.kunde:'')+'-'+todayIso()}
function advPdf(){
  var e=checkKunde((adv.kunde||'').trim().toUpperCase());
  if(adv.kunde&&e){advMsg(e,true);return}
  var blocks;
  try{blocks=buildReport()}catch(x){advMsg('Der Bericht konnte nicht erstellt werden: '+x.message,true);return}
  if(blocks.length<2){advMsg('Es ist noch nichts für das PDF ausgewählt oder ausgefüllt.',true);return}
  advMsg('PDF wird erstellt ...');
  loadJsPdf(function(ok){
    var name=fileBase()+'.pdf';
    function saveHtml(){
      advMsg('Das PDF konnte hier nicht erstellt werden. Du bekommst stattdessen eine HTML-Datei, die du im Browser öffnen und als PDF drucken kannst.',true);
      var html=renderHtmlReport(blocks);
      if(dl)dl.save({filename:fileBase()+'.html',data:html}).catch(function(){});else fallbackCopy(fileBase()+'.html',html);
    }
    if(!ok){saveHtml();return}
    var buf;try{buf=renderPdf(blocks)}catch(x){saveHtml();return}
    if(!dl){advMsg('Direktes Speichern ist hier nicht verfügbar.',true);return}
    dl.save({filename:name,data:buf}).then(function(){advMsg('PDF gespeichert.')},function(er){if(er&&er.code==='declined'){advMsg('');return}advMsg('Speichern nicht möglich ('+(er&&er.code?er.code:'Fehler')+').',true)});
  });
}
function advFileSave(){
  var copy=JSON.parse(JSON.stringify(adv));delete copy.pdfName;delete copy.brief;copy.step=0;
  var data=JSON.stringify({app:'crm-beratung',v:1,adv:copy},null,1),name=fileBase()+'.json';
  if(dl)dl.save({filename:name,data:data}).then(function(){advMsg('Beratungsdatei gespeichert. Sie enthält keine Namen.')},function(er){if(er&&er.code==='declined')return;fallbackCopy(name,data)});else fallbackCopy(name,data);
}
function advSaveCrm(){
  var k=(adv.kunde||'').trim().toUpperCase(),e=checkKunde(k)||checkText(adv.notiz);
  if(e){advMsg(e,true);return}
  if(adv.erg==='verloren'&&!adv.grund){advMsg('Bitte den Grund wählen, warum der Kunde nicht abgeschlossen hat.',true);return}
  var made=[],now=Date.now(),wv=adv.wvDays&&adv.wvDays!=='0'?addDaysIso(todayIso(),Number(adv.wvDays)):'',nt=adv.notiz.trim();
  if(adv.mods.alter){
    var c=calcAl();
    if(!c.err){
      var s='Netto-Gehalt '+eur(c.gehalt)+', Versorgungsziel '+eur(c.ziel)+', Erwartung '+eur(c.rente+c.bav)+', Lücke '+eur(c.lueckeHeute)+' pro Monat (heutige Kaufkraft).';
      if(c.prods.length)s+=' Lösung: '+c.prods.map(function(p){return p.name.replace(/ \(.*\)/,'')}).join(', ')+', Beiträge '+eur(c.sumB)+' pro Monat, Lücke danach '+eur(c.lueckeNach)+'.';
      var b={id:uid(),kunde:k,bereich:'Altersvorsorge',datum:todayIso(),note:(s+(nt?' '+nt:'')).slice(0,600),wv:wv,ts:now};b.erg=adv.erg||'offen';b.grund=adv.erg==='verloren'?adv.grund:'';b.ber=adv.ber||'';b.fil=adv.fil||'';db.beratungen.push(b);syncWv(b);made.push('Altersvorsorge')
    }
  }
  if(adv.mods.sach){
    var ss=sachStats();
    if(ss.length){
      var tI=0,tS=0,s2='Sparten: '+ss.map(function(x){if(isFinite(x.bIst))tI+=x.bIst;if(isFinite(x.bSoll))tS+=x.bSoll;return x.name+' ('+x.nein+' Lücken)'}).join(', ')+'. Beitrag aktuell '+eur(tI)+', neu '+eur(tS)+' pro Jahr.';
      var b2={id:uid(),kunde:k,bereich:'Sachversicherungen',datum:todayIso(),note:(s2+(nt&&!adv.mods.alter?' '+nt:'')).slice(0,600),wv:wv,ts:now+1};b2.erg=adv.erg||'offen';b2.grund=adv.erg==='verloren'?adv.grund:'';b2.ber=adv.ber||'';b2.fil=adv.fil||'';db.beratungen.push(b2);syncWv(b2);made.push('Sachversicherungen')
    }
  }
  if(adv.mods.anlage){var an=calcAn();if(!an.err){var s3='Fondspolice: '+(an.m>0?eur(an.m)+' pro Monat':'')+(an.e>0?(an.m>0?' plus ':'')+eur(an.e)+' einmalig':'')+', Laufzeit '+an.j+' Jahre, Einzahlungen gesamt '+eur(an.ein)+'.';var b3={id:uid(),kunde:k,bereich:'Geldanlage',datum:todayIso(),note:(s3+(nt&&!adv.mods.alter&&!adv.mods.sach?' '+nt:'')).slice(0,600),wv:wv,ts:now+2};b3.erg=adv.erg||'offen';b3.grund=adv.erg==='verloren'?adv.grund:'';b3.ber=adv.ber||'';b3.fil=adv.fil||'';db.beratungen.push(b3);syncWv(b3);made.push('Geldanlage')}}
  if(adv.mods.kv){var kk=calcKv();if(!kk.err){var s4='Krankenversicherung: GKV mit Zusatz '+eur(kk.A)+' pro Monat'+(kk.hasPkv?', PKV Eigenanteil '+eur(kk.eigen)+(kk.cbOn?' (effektiv '+eur(kk.eff[2])+' mit Cashback ab Jahr 3)':''):'')+', '+kk.n+' Kinder.';var b4={id:uid(),kunde:k,bereich:'Krankenversicherung',datum:todayIso(),note:(s4+(nt&&!adv.mods.alter&&!adv.mods.sach&&!adv.mods.anlage?' '+nt:'')).slice(0,600),wv:wv,ts:now+3};b4.erg=adv.erg||'offen';b4.grund=adv.erg==='verloren'?adv.grund:'';b4.ber=adv.ber||'';b4.fil=adv.fil||'';db.beratungen.push(b4);syncWv(b4);made.push('Krankenversicherung')}}
  if(adv.mods.pflege){var pfx=pfObj(),pe=checkText(pfx.fragen)||checkText(pfx.next);if(pe){advMsg(pe+' (Pflege, Schritt 6)',true);return}
    var b5={id:uid(),kunde:k,bereich:'Pflege',datum:todayIso(),note:(pfCrmNote()+(nt&&!adv.mods.alter&&!adv.mods.sach&&!adv.mods.anlage&&!adv.mods.kv?' '+nt:'')).slice(0,600),wv:wv,ts:now+4};b5.erg=adv.erg||'offen';b5.grund=adv.erg==='verloren'?adv.grund:'';b5.ber=adv.ber||'';b5.fil=adv.fil||'';db.beratungen.push(b5);syncWv(b5);made.push('Pflege');
    var pol=pfOpenList();if(pfx.fragen.trim())pol.push(pfx.fragen.trim());if(pol.length)db.todos.push({id:uid(),kunde:k,text:('Pflege, offen: '+pol.join('; ')).slice(0,300),due:wv||addDaysIso(todayIso(),14),done:false,ts:now+5})}
  var gi2=ganzInterest();
  if(!made.length&&!(gi2.length&&k)){advMsg('Es gibt noch kein Ergebnis zum Speichern. Prüfe die Pflichtfelder im Ist-Stand.',true);return}
  if(gi2.length&&k){db.todos.push({id:uid(),kunde:k,text:'Folgegespräch anbieten: '+gi2.join(', '),due:wv||addDaysIso(todayIso(),30),done:false,ts:now+9})}
  save();advMsg('Im CRM gespeichert: '+(made.length?made.join(' und ')+(gi2.length&&k?', dazu eine Aufgabe für das Folgegespräch':''):'Aufgabe für das Folgegespräch')+'. Die Eingaben selbst werden nicht im CRM abgelegt.');
}

/* Katalog-Editor */
function openKat(){
  var kat=katalog(),rows=kat[katSp]||[];
  var h='<h3>Leistungsmerkmale</h3><p class="hint-t">Diese Liste wird beim Aktivieren einer Sparte als Vorlage übernommen. „Neuer Stand“ ist dein Standard für deinen Tarif.</p>'+
    '<label class="fl"><span>Sparte</span><select id="kat-sp" data-katsel="1">'+KATS.map(function(s){return '<option value="'+s[0]+'"'+(s[0]===katSp?' selected':'')+'>'+s[1]+'</option>'}).join('')+'</select></label>';
  h+=rows.map(function(r,i){return '<div class="mrow"><div class="mname"><input type="text" data-kat="'+i+'.name" value="'+esc(r.name)+'" maxlength="90" aria-label="Merkmal"><button class="x" data-act="kat-del" data-i="'+i+'" aria-label="Entfernen">×</button></div><div class="mcols"><div><small>Standard neuer Stand</small>'+ampSel('katS'+i,r.s).replace('data-adv="katS'+i+'"','data-kat="'+i+'.s"')+'</div><div><small>Angabe</small><input type="text" data-kat="'+i+'.t" value="'+esc(r.t)+'" maxlength="80"></div></div></div>'}).join('');
  h+='<div class="btnrow"><button class="btn" data-act="kat-add">Merkmal hinzufügen</button><button class="btn primary" data-act="close">Fertig</button></div>';
  openSheet(h);
}

/* Aktionen */

function buildReport(){
  var S=adv.sec,b=[],c=adv.mods.alter?calcAl():null,today=fmtFull(todayIso());
  b.push({t:'head',title:'Ihre Beratungsunterlage',sub:(adv.pdfName?adv.pdfName+' · ':'')+today});
  var cOk=c&&!c.err;
  dokuReport(b);
  if(S.einstieg)einstiegReport(b);
  if(S.leben&&adv.leben&&adv.leben.pos){b.push({t:'h',text:'Ihr Lebensweg: Wo wir begleiten'});b.push({t:'img',src:chartLeben().toDataURL('image/png'),ratio:lebenH()/800});b.push({t:'small',text:'Zu jeder Lebensphase zeigen die Themen, worüber wir sprechen können. Das ist eine Orientierung und keine Empfehlung.'})}
  if(cOk&&S.rente){
    b.push({t:'h',text:'Die gesetzliche Rente: das Wichtigste'});
    b.push({t:'bul',items:['Die gesetzliche Rente wird im Umlageverfahren finanziert. Ihre Rente ergibt sich aus Ihren Entgeltpunkten mal dem aktuellen Rentenwert.','Das Rentenniveau liegt bei 48 % und ist bis 1. Juli 2031 gesetzlich festgeschrieben. Wie es danach weitergeht, ist offen.','Von der Bruttorente gehen Steuer sowie Kranken- und Pflegeversicherungsbeiträge ab. Bei Rentenbeginn 2026 sind 84 % der Rente steuerpflichtig (2027: 84,5 %).','Die Inflation mindert die Kaufkraft: 1.000 € von heute haben in '+c.n+' Jahren nur noch einen Wert von etwa '+eur(1000/c.f)+'.']});
  }
  if(cOk&&S.al_ist){
    b.push({t:'h',text:'Altersvorsorge: Ihr aktueller Stand'});
    b.push({t:'kv',rows:[['Netto-Gehalt heute',eur(c.gehalt)+' pro Monat'],['Versorgungsziel ('+pctS(nv(adv.al.zielPct)/100)+' vom Netto)',eur(c.ziel)+' pro Monat'],['Gesetzliche Rente (Erwartung)',eur(c.rente)+' pro Monat'],['Betriebsrente',eur(c.bav)+' pro Monat'],['Versorgungslücke heute',eur(c.lueckeHeute)+' pro Monat'],['Versorgungslücke bei Rentenbeginn (in '+c.n+' Jahren)',eur(c.lueckeNom)+' pro Monat']],strong:4});
    b.push({t:'img',src:chartLueckeIst(c).toDataURL('image/png'),ratio:560/1100});
  }
  if(cOk&&S.al_zeit&&calcWarten(c).length>1){
    b.push({t:'h',text:'Zeit ist Ihr größter Hebel'});
    b.push({t:'img',src:chartWarten(c).toDataURL('image/png'),ratio:560/1100});
  }
  if(cOk&&S.al_loes&&c.prods.length){
    b.push({t:'h',text:'Altersvorsorge: Unsere Lösung'});
    b.push({t:'table',head:['Baustein','Beitrag pro Monat','Leistung im Ruhestand'],w:[0.46,0.24,0.30],rows:c.prods.map(function(p){return [p.name,eur(p.b),isNaN(p.rIn)?'-':eur(p.rIn)+(p.key==='fp'?' Entnahme':' Rente')]}).concat([['Summe',eur(c.sumB),eur(c.sumR)+' (heutige Kaufkraft)']])});
    var ru=c.prods.filter(function(p){return p.key==='ru'})[0],fp=c.prods.filter(function(p){return p.key==='fp'})[0],kv=[];
    if(ru&&!isNaN(ru.T)){kv.push(['Steuerersparnis Rürup',eur(ru.T)+' pro Jahr']);kv.push(['Echte Belastung Rürup nach Steuerersparnis',eur(rurupNetto(ru))+' pro Monat'])}
    kv.push(['Versorgungslücke danach',eur(c.lueckeNach)+' pro Monat']);
    b.push({t:'kv',rows:kv,strong:kv.length-1});
    if(ru&&fp)b.push({t:'img',src:konzeptDiagram(c).toDataURL('image/png'),ratio:560/1100});
    b.push({t:'img',src:chartLueckeSoll(c).toDataURL('image/png'),ratio:560/1100});
    if(adv.al.quelle)b.push({t:'small',text:adv.al.quelle});
  }
  var a=adv.mods.anlage?calcAn():null;
  if(a&&!a.err&&S.an){
    b.push({t:'h',text:'Geldanlage: Fondspolice'});
    var kv2=[];if(a.e>0)kv2.push(['Einmalanlage',eur(a.e)]);if(a.m>0)kv2.push(['Monatlicher Beitrag',eur(a.m)]);kv2.push(['Laufzeit',a.j+' Jahre']);kv2.push(['Einzahlungen gesamt',eur(a.ein)]);
    if(isFinite(a.ent))kv2.push(['Mögliche Entnahme pro Monat',eur(a.ent)]);
    if(isFinite(a.vorteil))kv2.push(['Steuervorteil gegenüber Fondssparplan laut Rechner',eur(a.vorteil)]);
    b.push({t:'kv',rows:kv2,strong:-1});
    if(S.an_steuer){
      b.push({t:'bul',items:['Fondssparplan und Depot: Gewinne werden mit '+REGEL.abg+' (zuzüglich Kirchensteuer) besteuert, Umschichtungen lösen Steuer aus.','Fondspolice: keine laufende Steuer, Fondswechsel im Vertrag sind steuerfrei. Bei Auszahlung nach mindestens 12 Jahren und ab 62 wird nur die Hälfte des Ertrags mit dem persönlichen Steuersatz versteuert.']});
      b.push({t:'img',src:chartSteuerZeit().toDataURL('image/png'),ratio:560/1100});
    }
    if(a.sz.length){
      b.push({t:'img',src:chartAnlage(a).toDataURL('image/png'),ratio:560/1100});
      b.push({t:'table',head:['Szenario','Kapital am Laufzeitende','davon Wertzuwachs'],w:[0.4,0.3,0.3],rows:a.sz.map(function(z){return [z.name,eur(z.w),eur(Math.max(0,z.w-a.ein))]})});
    }
    var fr=adv.an.rows.filter(function(r){return r.s||r.t});
    if(fr.length)b.push({t:'feat',title:'Merkmale der Police',rows:fr});
    if(adv.an.quelle)b.push({t:'small',text:adv.an.quelle});
  }
  if(adv.mods.kv){
    var kc=calcKv();
    if(!kc.err){
      if(S.kv){
        b.push({t:'h',text:'Krankenversicherung: Zwei Wege im Vergleich'});b.push({t:'p',text:'Beide Wege sind möglich. Hier steht nebeneinander, was jeder Weg monatlich kostet und was darin enthalten ist. Eine Entscheidung ist heute nicht nötig.'});
        var gl=[['GKV-Beitrag (Arbeitnehmeranteil, inkl. Pflege)',eur(kc.gkv)]];
        if(kc.zk>0)gl.push(['Zusatzversicherungen Kunde',eur(kc.zk)]);
        if(kc.zn>0)gl.push(['Zusatzversicherungen Kinder',eur(kc.zn)]);
        var L={t:'vs',tag:'WEG 1 · GKV',title:'Gesetzlich versichert, mit Zusatz',sub:'Ihr Weg heute: Kassenbeitrag plus Zusatzversicherungen',rows:gl,total:['Gesamt pro Monat',eur(kc.A)],col:[10,74,156],tint:[228,237,249]},R=null;
        if(kc.hasPkv){
          var pl=[['Beitrag aller Personen',eur(kc.tot)],['abzüglich Arbeitgeberzuschuss',eur(kc.agz)]];
          if(kc.cbOn)pl.push(['Mit Cashback: Jahr 1 / 2 / ab 3',eur(kc.eff[0])+' / '+eur(kc.eff[1])+' / '+eur(kc.eff[2])]);
          R={t:'vs',tag:'WEG 2 · PKV',title:'Privat versichert, ohne Zusatz',sub:(adv.kv.pers[0]&&adv.kv.pers[0].tarif?'Tarif: '+adv.kv.pers[0].tarif+'. ':'')+'Zusatzversicherungen sind im Tarif enthalten',rows:pl,total:['Ihr Eigenanteil pro Monat',eur(kc.eigen)],col:[14,116,144],tint:[221,240,244]};
        }
        var dm=R?(kc.eigen-kc.A):NaN;
        b.push({t:'vs2',left:L,right:R,diff:R&&isFinite(dm)?('Unterschied pro Monat: Weg 2 liegt '+(dm>0?eur(dm)+' über':dm<0?eur(-dm)+' unter':'gleichauf mit')+' Weg 1'):''});
        b.push({t:'img',src:chartKv(kc).toDataURL('image/png'),ratio:560/1100});
        var pr=adv.kv.pers.map(function(p,i){return [persName(i),p.tarif||'-',isFinite(nv(p.b))?eur(nv(p.b)):'-']}).filter(function(r){return r[2]!=='-'});
        if(pr.length)b.push({t:'table',head:['Person','Tarif','Beitrag pro Monat'],w:[0.25,0.45,0.3],rows:pr});
        var kr2=adv.sach.pkv.rows.filter(function(r){return r.ist.s||r.soll.s||r.ist.t||r.soll.t});
        if(kr2.length)b.push({t:'cmp',title:'Was Sie dafür bekommen: Leistungen im Vergleich',rows:kr2,tIst:adv.sach.pkv.tIst,tSoll:adv.sach.pkv.tSoll,bIst:NaN,bSoll:NaN});
      }
      if(S.kv_entw)b.push({t:'img',src:chartEntw().toDataURL('image/png'),ratio:600/1100});
      if(S.kv_alter){var ka=calcKvAlter();if(!ka.err){
        var kk2=adv.kv,pc2=nv(kk2.rvPct);if(isNaN(pc2))pc2=KV.rv;var pcs=String(pc2).replace('.',',')+' %',rn=nv(kk2.rente),neg=function(x){return '- '+eur(x)};
        b.push({t:'h',text:'Beitrag im Ruhestand: Wird es im Alter teurer?'});
        var bl=[];
        if(kc.n>0)bl.push('Die Kinder sind dann nicht mehr im Tarif. Ihr Beitrag bezieht sich nur noch auf Sie.');
        if(ka.en>0)bl.push('Die Beitragsentlastung greift: Der Beitrag wird günstiger, und der Beitragsteil dafür fällt komplett weg.');
        if(ka.tg>0)bl.push('Das Krankentagegeld entfällt, denn im Ruhestand wird es nicht mehr gebraucht.');
        if(ka.zu>0)bl.push('Der gesetzliche Zuschlag endet.');
        bl.push('Die Rentenversicherung zahlt auf Antrag einen Zuschuss von '+pcs+' der Bruttorente, höchstens die Hälfte des Beitrags (Stand 2026).');
        b.push({t:'bul',items:bl});
        var gr=[];if(isFinite(rn)&&rn>0)gr.push(['Bruttorente (Annahme)',eur(rn)]);
        gr.push([ka.gEst?'Kranken- und Pflegebeitrag aus der Rente (geschätzt)':'Kranken- und Pflegebeitrag im Alter',isFinite(ka.gA)?eur(ka.gA):'-']);
        if(kc.zk>0)gr.push(['Zusatzversicherungen',eur(kc.zk)]);
        var gtot=isFinite(ka.gA)?ka.gA+(kc.zk>0?kc.zk:0):NaN;
        var pr2=[[ka.manual?'Beitrag im Alter (Eingabe)':'Beitrag bei Rentenbeginn, nur Sie',eur(ka.ges)]];
        if(ka.zu>0)pr2.push(['Gesetzlicher Zuschlag entfällt',neg(ka.zu)]);
        if(ka.tg>0)pr2.push(['Krankentagegeld entfällt',neg(ka.tg)]);
        if(ka.en>0)pr2.push(['Beitragsentlastung: Beitrag fällt weg',neg(ka.en)]);
        if(ka.rvz>0)pr2.push(['Zuschuss Rentenversicherung ('+pcs+')',neg(ka.rvz)]);
        var dA=isFinite(gtot)?ka.end-gtot:NaN;
        b.push({t:'vs2',left:{tag:'WEG 1 · GKV',title:'Gesetzlich im Ruhestand',sub:'Beitrag aus der gesetzlichen Rente',rows:gr,total:['Pro Monat im Ruhestand',isFinite(gtot)?eur(gtot):'-'],col:[10,74,156],tint:[228,237,249]},
          right:{tag:'WEG 2 · PKV',title:'Privat im Ruhestand',sub:'So wird aus dem Beitrag Ihr Eigenanteil',rows:pr2,total:['Ihr Beitrag im Ruhestand',eur(ka.end)],col:[14,116,144],tint:[221,240,244]},
          diff:isFinite(dA)?('Unterschied pro Monat im Ruhestand: Weg 2 liegt '+(dA>0?eur(dA)+' über':dA<0?eur(-dA)+' unter':'gleichauf mit')+' Weg 1'):''});
        (function(){
          var D=KV_ENTW,nY=D.years.length-1,yr0=D.years[0],yr1=D.years[nY];
          function cg(v){return Math.pow(v[nY]/v[0],1/nY)-1}
          var cp=cg(D.pkv),cgk=cg(D.gkv),pr=function(x){return String(Math.round(x*1000)/10).replace('.',',')+' %'};
          var tot=function(v){return '+ '+String(Math.round((v[nY]/v[0]-1)*100))+' % gesamt'};
          var rows=[['Entwicklung '+yr0+' bis '+yr1+': PKV',pr(cp)+' pro Jahr ('+tot(D.pkv)+')'],['Entwicklung '+yr0+' bis '+yr1+': GKV',pr(cgk)+' pro Jahr ('+tot(D.gkv)+')']];
          var endFor=function(ges){var rvz=isFinite(rn)?Math.min(rn*pc2/100,Math.max(0,(ges-ka.zu-ka.tg-ka.en)/2)):0;return Math.max(0,ges-ka.zu-ka.tg-ka.en-rvz)};
          var st=0;
          if(!ka.manual&&kc.hasPkv&&ka.J>=0){
            var g2=kc.kopf*Math.pow(1+cp,ka.J),e2=endFor(g2);
            rows.push(['PKV-Beitrag bei Rentenbeginn, mit Ihrer Annahme ('+String(ka.st).replace('.',',')+' % pro Jahr)',eur(ka.ges)]);
            rows.push(['PKV-Beitrag bei Rentenbeginn, bei gleicher Entwicklung wie '+yr0+' bis '+yr1+' ('+pr(cp)+')',eur(g2)]);
            rows.push(['Ihr Beitrag im Ruhestand nach Zuschuss: Annahme / wie in der Vergangenheit',eur(ka.end)+' / '+eur(e2)]);
            st=rows.length-1;
          }
          b.push({t:'h',text:'Prognose: Orientierung an der Beitragsentwicklung'});
          b.push({t:'p',text:'Wir orientieren uns an der Entwicklung der vergangenen Jahre (R+V, Beispiel in der Grafik "Beitragsentwicklung: PKV gegen GKV"'+(S.kv_entw?', siehe oben':'')+'). Daraus ergibt sich eine Hochrechnung bis zum Rentenbeginn. Sie ist eine Orientierung und keine Garantie.'});
          b.push({t:'kv',rows:rows,strong:st});
          b.push({t:'small',text:'Die Entwicklung der Vergangenheit ist kein verlässlicher Hinweis auf die Zukunft. Beiträge können stärker oder schwächer steigen. Beispiel der R+V: Mann, Versicherungsbeginn 2014, Eintrittsalter 35.'});
        })();
        b.push({t:'img',src:chartAlter(ka).toDataURL('image/png'),ratio:580/1100});
        b.push({t:'small',text:(ka.manual?'Beitrag im Alter laut Eingabe. ':'Hochrechnung mit '+String(ka.st).replace('.',',')+' % Beitragssteigerung pro Jahr über '+ka.J+' Jahre. ')+'Der Zuschuss der Rentenversicherung muss beantragt werden und ist auf die Hälfte des tatsächlichen Beitrags begrenzt. Modellrechnung, keine Garantie.'})}}
      if(S.kv_pc){
        [['pro','Vorteile eines Wechsels','Einschätzung'],['con','Nachteile und Risiken','Einschätzung']].forEach(function(z){
          var rr=adv.kv[z[0]].filter(function(r){return r.v}).map(function(r){return [r.t,r.v==='wichtig'?'wichtig':r.v==='egal'?'egal':'Sorge']});
          if(rr.length){b.push({t:'h',text:z[1]+', Einschätzung des Kunden'});b.push({t:'table',head:['Punkt','Einschätzung'],w:[0.76,0.24],rows:rr})}
        });
      }
    }
  }
  if(adv.mods.sach&&S.sach){
    var ss=sachStats();
    if(ss.length){b.push({t:'h',text:'Sachversicherungen: aktueller Stand gegen neuer Stand'});
      ss.forEach(function(s){b.push({t:'cmp',title:s.name,rows:s.rows,tIst:s.tIst,tSoll:s.tSoll,bIst:s.bIst,bSoll:s.bSoll})})}
  }
  if(adv.mods.zus&&S.zus)zusReport(b);
  if(adv.mods.bu&&S.bu)buReport(b);
  if(adv.mods.pflege&&S.pf)pfReport(b);
  if(adv.mods.vorsorge&&S.vp)vpReport(b);
  if(S.ganz){
    b.push({t:'h',text:'Mehr als Versicherung: Ihr Überblick'});
    b.push({t:'img',src:chartGanz().toDataURL('image/png'),ratio:1190/960,w:130});
    var gi=ganzInterest();
    b.push({t:'small',text:'Wir begleiten Sie in allen Lebensbereichen.'+(gi.length?' Als Themen für ein Folgegespräch haben wir vorgemerkt: '+gi.join(', ')+'.':'')+' Das Angebot hängt von der Bank und ihren Partnern ab. Die Übersicht ist eine Orientierung und keine Empfehlung.'});
  }
  if(S.summe){
    var rows=[],tI=0,tS=0;
    if(cOk&&c.prods.length)rows.push(['Altersvorsorge (pro Monat)','bisher: nicht erfasst',eur(c.sumB)]);
    if(a&&!a.err&&a.m>0)rows.push(['Geldanlage (pro Monat)','bisher: nicht erfasst',eur(a.m)]);
    if(adv.mods.kv){var ck=calcKv();if(!ck.err&&ck.hasPkv)rows.push(['Krankenversicherung (pro Monat, ohne Cashback)','GKV mit Zusatz: '+eur(ck.A),'PKV: '+eur(ck.eigen)])}
    if(adv.mods.sach){sachStats().forEach(function(s){if(isFinite(s.bIst))tI+=s.bIst;if(isFinite(s.bSoll))tS+=s.bSoll});if(tI||tS)rows.push(['Sachversicherungen (pro Jahr)',eur(tI),eur(tS)])}
    if(rows.length){b.push({t:'h',text:'Zusammenfassung der Beiträge'});b.push({t:'table',head:['Bereich','Aktuell','Neu'],w:[0.46,0.27,0.27],rows:rows})}
  }
  var gk=adv.gesp||{};if(S.einstieg&&gk.klar&&gk.klar.trim()){b.push({t:'h',text:'Das haben wir geklärt'});b.push({t:'p',text:gk.klar.trim()})}
  if(S.notiz&&(adv.notiz.trim()||(gk.termin&&gk.termin.trim()))){b.push({t:'h',text:'Nächste Schritte'});if(adv.notiz.trim())b.push({t:'p',text:adv.notiz.trim()});if(gk.termin&&gk.termin.trim())b.push({t:'p',text:'Nächster Termin: '+gk.termin.trim()})}
  var hn=['Alle Beträge sind Modellrechnungen und keine Garantie. Wertentwicklungen sind nicht garantiert. Rechtsstand: Oktober 2026.'];
  if(cOk)hn.push('Annahmen: Inflation '+pctS(c.o.infl)+' pro Jahr; gesetzliche Rente und Betriebsrente wachsen vereinfacht mit der Inflation; Versorgungslücke in heutiger Kaufkraft, sofern nicht anders angegeben.');
  if(cOk&&c.prods.length)hn.push('Die Werte der Produkte stammen aus den Berechnungen der jeweiligen Gesellschaft und wurden manuell übernommen. Maßgeblich sind die Produktinformationen und Vertragsbedingungen.');
  if(cOk&&c.prods.some(function(p){return p.key==='ru'}))hn.push('Steuerersparnis Rürup: Beitrag mal persönlichem Steuersatz, soweit der Beitrag innerhalb des Höchstbetrags liegt (2026: '+eur(RURUP_MAX)+' für Einzelveranlagte, '+eur(RURUP_MAX2)+' bei Zusammenveranlagung; Abzug zu 100 %). Die Renten werden später versteuert.');
  if(a&&!a.err)hn.push('Steuerliche Angaben zur Fondspolice sind vereinfacht. Maßgeblich ist die individuelle Steuersituation.');
  if(adv.mods.kv&&calcKv().hasPkv)hn.push('Krankenversicherung: Beitragsanpassungen sind in der GKV und in der PKV möglich und nicht garantierbar. Der GKV-Beitrag ist, soweit nicht anders angegeben, eine Schätzung (Stand 10/2026). Der Arbeitgeberzuschuss ist vereinfacht berechnet. Das Cashback ist vereinfacht vom Gesamtbeitrag gerechnet und hängt von Leistungsfreiheit und Tarif ab. Die Beitragsentwicklung ist ein Beispiel aus der Vergangenheit und keine Prognose.');
  if(adv.mods.sach&&S.sach)hn.push('Leistungsvergleich nach Angaben des Beraters. Maßgeblich sind die Versicherungsbedingungen.');
  hn.push('Diese Unterlage ersetzt keine Steuer- oder Rechtsberatung.');
  b.push({t:'small',text:'Hinweise: '+hn.join(' ')});
  b.push({t:'disc',text:discText()});
  return b;
}
function advInput(el){
  if(el.dataset.sig!==undefined){if(!db.settings)db.settings={};db.settings.signatur=el.value;save();if(adv)fillRes();return true}
  if(el.dataset.home!==undefined){homeKunde=el.value;return true}
  if(el.dataset.katsel){katSp=el.value;openKat();return true}
  if(el.dataset.kat!==undefined){var p=el.dataset.kat.split('.'),r=katalog()[katSp][Number(p[0])];if(r){r[p[1]]=el.value;save()}if(el.dataset.amp!==undefined)el.dataset.amp=el.value;return true}
  if(el.dataset.adv===undefined||!adv)return false;
  var path=el.dataset.adv,val=el.type==='checkbox'?el.checked:el.value;
  setp(adv,path,val);
  if(path==='kv.kinder'){kvSyncPers();var kp=$('kvpers');if(kp)kp.innerHTML=kvPersHtml()}
  if(el.dataset.amp!==undefined)el.dataset.amp=el.value;
  if(path==='kd.alter'){adv.al.alter=el.value;adv.an.alter=el.value}
  if(path==='kd.netto'){if(adv.kd.gruppe==='rentner')adv.vp.rente=el.value;else adv.al.gehalt=el.value}
  if(path==='kd.kinder'){adv.kv.kinder=el.value;kvSyncPers()}
  if(/^vp\./.test(path)){var vr=$('vp-res'),vf=$('vp-pf');if(vr)vr.innerHTML=vpResHtml();if(vf&&!/^vp\.i\./.test(path)){var act=document.activeElement;vf.innerHTML=vpPflegeForm().replace(/^<div id="vp-pf">|<\/div>$/g,'');if(act&&act.dataset&&act.dataset.adv){var nn=document.querySelector('#vp-pf [data-adv="'+act.dataset.adv+'"]');if(nn){nn.focus();try{nn.setSelectionRange(nn.value.length,nn.value.length)}catch(x){}}}}if(talkOpen)talkLive();else fillRes();return true}
  if(path==='al.brutto'||path==='al.abzug'){
    var bb=nv(adv.al.brutto),ab=nv(adv.al.abzug);
    if(isFinite(bb)){adv.al.rente=String(Math.round(bb*(1-(isFinite(ab)?ab:15)/100)));var ri=document.querySelector('[data-adv="al.rente"]');if(ri)ri.value=adv.al.rente}
  }
  if(el.type==='checkbox'){
    var m=path.match(/^sach\.(\w+)\.on$/);if(m&&val&&!adv.sach[m[1]].rows.length)adv.sach[m[1]].rows=rowsFromKat(m[1]);
    if(/^mods\./.test(path)){if(!anyMod()){adv.mods.alter=true}advTab=Math.min(advTab,steps().length-1)}
    if(talkOpen){renderTalk(true);return true}
    renderWizard();return true;
  }
  if(!talkOpen&&(path==='al.modus'||path==='wvDays')){renderWizard();return true}
  if(/^pf\.(mg|bed)/.test(path))Array.prototype.forEach.call(document.querySelectorAll('.pf-tarif'),function(e){e.innerHTML=pfTarifLive()});
  if(talkOpen){talkLive();return true}
  fillRes();return true;
}
function advAct(act,btn){
  var i=Number(btn.dataset.i),sp=btn.dataset.sp;
  switch(act){
    case 'home-mail':cur=null;talkOpen=false;adv=newAdv('');adv.mods={alter:false,anlage:false,kv:false,sach:false,vorsorge:false,pflege:false,bu:false,zus:false};mailAdv=true;tab='beratung';render();window.scrollTo(0,0);break;
    case 'adv-fp-from-tax':
      var c=calcAl(),ru=c.prods&&c.prods.filter(function(p){return p.key==='ru'})[0];
      if(ru&&!isNaN(ru.T)){adv.al.fp.b=String(Math.round(ru.T/12*100)/100).replace('.',',');if(talkOpen)renderTalk(true);else renderWizard()}else toast('Bitte zuerst Beitrag und Steuersatz oder die Steuerersparnis bei der Rürup-Rente eintragen.');
      break;
    case 'adv-row-add':adv.sach[sp].rows.push({name:'',ist:{s:'',t:''},soll:{s:'',t:''}});if(talkOpen)renderTalk(true);else renderWizard();break;
    case 'adv-row-del':adv.sach[sp].rows.splice(i,1);if(talkOpen)renderTalk(true);else renderWizard();break;
    case 'adv-row-reset':adv.sach[sp].rows=rowsFromKat(sp);if(talkOpen)renderTalk(true);else renderWizard();break;
    case 'adv-kvl-add':adv.kv[btn.dataset.l].push({t:'',v:''});if(talkOpen)renderTalk(true);else renderWizard();break;
    case 'adv-kvl-del':adv.kv[btn.dataset.l].splice(i,1);if(talkOpen)renderTalk(true);else renderWizard();break;
    case 'adv-an-add':adv.an.rows.push({name:'',s:'',t:''});if(talkOpen)renderTalk(true);else renderWizard();break;
    case 'adv-an-del':adv.an.rows.splice(i,1);if(talkOpen)renderTalk(true);else renderWizard();break;
    case 'adv-an-reset':adv.an.rows=anRowsFromKat();if(talkOpen)renderTalk(true);else renderWizard();break;
    case 'adv-wish':var w=btn.dataset.w,wi=adv.wuensche.indexOf(w);if(wi>-1)adv.wuensche.splice(wi,1);else adv.wuensche.push(w);renderTalk(true);break;
    case 'adv-pdf':advPdf();break;
    case 'adv-crm':advSaveCrm();break;
    case 'adv-file-save':advFileSave();break;
    case 'adv-kat':openKat();break;
    case 'adv-disc':openDisc();break;
    case 'disc-save':var dv=$('disc-text').value.trim();if(!db.settings)db.settings={};db.settings.disclaimer=dv||DISC_DEF;save();closeSheet();toast('Gespeichert');break;
    case 'disc-reset':$('disc-text').value=DISC_DEF;break;
    case 'kat-add':katalog()[katSp].push({name:'',s:'',t:''});save();openKat();break;
    case 'kat-del':katalog()[katSp].splice(i,1);save();openKat();break;
    case 'adv-leben':{var lo=lenObjSafe();lo.pos=lo.pos===btn.dataset.k?'':btn.dataset.k;if(talkOpen)renderTalk(true);else renderWizard();break}
    case 'adv-grp':{adv.kd.gruppe=adv.kd.gruppe===btn.dataset.k?'':btn.dataset.k;if(talkOpen)renderTalk(true);else renderWizard();break}
    case 'adv-ent':{if(!adv.ent)adv.ent={};adv.ent[btn.dataset.k]=adv.ent[btn.dataset.k]===btn.dataset.v?'':btn.dataset.v;if(talkOpen)renderTalk(true);else renderWizard();break}
    case 'adv-pfp':{var pl=adv.pf.prio,ix=pl.indexOf(btn.dataset.k);if(ix>=0)pl.splice(ix,1);else pl.push(btn.dataset.k);if(talkOpen)renderTalk(true);else renderWizard();break}
    case 'adv-pfset':{var pp=pfObj(),pk=btn.dataset.k,po=pk.indexOf('lage.')===0?pp.lage:pp,pn=pk.replace(/^lage\./,'');po[pn]=po[pn]===btn.dataset.v?'':btn.dataset.v;if(talkOpen)renderTalk(true);else renderWizard();break}
    case 'adv-pfopt':{var pq=pfObj();pq.opt[btn.dataset.k]=pq.opt[btn.dataset.k]===btn.dataset.v?'':btn.dataset.v;if(talkOpen)renderTalk(true);else renderWizard();break}
    case 'adv-pfoff':{var pr2=pfObj().offen,oi=pr2.indexOf(btn.dataset.k);if(oi>=0)pr2.splice(oi,1);else pr2.push(btn.dataset.k);if(talkOpen)renderTalk(true);else renderWizard();break}
    case 'talk-jump':{var jr=document.querySelector('.uer[data-k="'+btn.dataset.k+'"]');if(jr){jr.scrollIntoView({block:'center',behavior:'smooth'});jr.classList.add('flash');setTimeout(function(){jr.classList.remove('flash')},1400)}break}
    case 'adv-ue':{if(!adv.ue)adv.ue={};adv.ue[btn.dataset.k]=adv.ue[btn.dataset.k]===btn.dataset.v?'':btn.dataset.v;if(talkOpen)renderTalk(true);else renderWizard();break}
    case 'adv-top':{if(!adv.top)adv.top=[];var ti=adv.top.indexOf(btn.dataset.k);if(ti>=0)adv.top.splice(ti,1);else{if(adv.top.length>=3){toast('Für heute reichen drei Themen');break}adv.top.push(btn.dataset.k)}topDerive();renderTalk(true);break}
    case 'adv-wenn':{adv.wenn[btn.dataset.k]=adv.wenn[btn.dataset.k]===btn.dataset.v?'':btn.dataset.v;renderTalk(true);break}
    case 'adv-wahl':{adv.mods[btn.dataset.m]=!adv.mods[btn.dataset.m];renderTalk(true);break}
    default:if(/^adv-brief-/.test(act))briefAct(act,btn);
  }
}

/* ================= Gesprächsmodus, Geldanlage, Hinweistext ================= */
var KATS=SACH.concat([['police','Fondspolice (Geldanlage)']]);
var WUENSCHE=['Lebensstandard halten','Reisen und Freizeit','Immobilie schuldenfrei','Familie absichern','Früher aufhören','Pflege und Gesundheit'];
var ANWUENSCHE=['Vermögen aufbauen','Steuerlich effizient','Flexibel bleiben','Kinder und Enkel bedenken','Zusätzliche Rente','Kapital für den Ruhestand'];
var DISC_DEF='Diese Unterlage enthält Skizzen und Notizen, die im Gespräch gemeinsam erarbeitet wurden. Sie ist unverbindlich und stellt kein Angebot, keine Beratungsdokumentation und keine Zusage dar. Maßgeblich sind Angebot, Produktinformationen und Versicherungsbedingungen der Gesellschaft.';
var talkOpen=false,talkIdx=0,talkTips=false;
function discText(){return (db.settings&&db.settings.disclaimer)||DISC_DEF}
function openDisc(){openSheet('<h3>Hinweistext im PDF</h3><p class="hint-t">Dieser Text steht am Ende jeder Unterlage. Stimme den Wortlaut bei Bedarf mit deiner Gesellschaft ab.</p><textarea id="disc-text" rows="7" maxlength="900">'+esc(discText())+'</textarea><div class="btnrow"><button class="btn" data-act="disc-reset">Standard einsetzen</button><button class="btn primary" data-act="disc-save">Speichern</button></div>')}

function anRowsFromKat(){return (katalog().police||[]).map(function(k){return {name:k.name,s:k.s||'',t:k.t||''}})}
function stepIndex(id){var st=steps();for(var i=0;i<st.length;i++)if(st[i][0]===id)return i;return st.length-1}

/* ---- Berechnung Geldanlage ---- */
function calcAn(){
  var a=adv.an,e=nv(a.einmal),m=nv(a.monat),j=nv(a.jahre),al=nv(a.alter);
  if(isNaN(e))e=0;if(isNaN(m))m=0;
  if(!(j>0))return {err:'Bitte die Laufzeit in Jahren eintragen.'};
  if(!(e>0||m>0))return {err:'Bitte Einmalanlage oder monatlichen Beitrag eintragen.'};
  var ein=e+m*12*j,sz=[['low','Vorsichtig','#5B6773'],['mid','Mittleres Szenario','#1F7A8C'],['high','Chancenreich','#6B4FA0']].map(function(x){return {key:x[0],name:x[1],c:x[2],w:nv(a.szen[x[0]])}}).filter(function(z){return isFinite(z.w)});
  var endAlter=isFinite(al)?al+j:NaN;
  return {e:e,m:m,j:j,ein:ein,sz:sz,endAlter:endAlter,halb:isFinite(endAlter)?(j>=12&&endAlter>=62):null,ent:nv(a.entnahme),vorteil:nv(a.vorteil)};
}
function calcWarten(c){
  var out=[];if(!(c.lueckeHeute>0)||!isFinite(c.b.C))return out;
  [[0,'Heute'],[1,'In 1 Jahr'],[3,'In 3 Jahren'],[5,'In 5 Jahren'],[10,'In 10 Jahren']].forEach(function(l){
    var N=c.n-l[0];if(N<1)return;
    out.push({l:l[1],s:c.b.C/Eng.fvFac(c.o.ra,12*N)});
  });
  return out;
}
function rurupNetto(ru){return (ru&&isFinite(ru.T))?ru.b-ru.T/12:NaN}

/* ---- zusätzliche Diagramme ---- */
function wrapTxt(x,t,cx,y,maxW,lh,align){
  var words=String(t).split(' '),line='',yy=y;x.textAlign=align||'left';
  words.forEach(function(w){var test=line?line+' '+w:w;if(x.measureText(test).width>maxW&&line){x.fillText(line,cx,yy);yy+=lh;line=w}else line=test});
  if(line){x.fillText(line,cx,yy);yy+=lh}return yy;
}
function chartWarten(c){
  var d=calcWarten(c);
  return stackedBars(d.map(function(z,i){return {label:z.l,segs:[{v:z.s,c:i===0?'#1F7A8C':'#B8690A',t:'Rechnerisch nötige Sparrate'}]}}),{title:'Je später der Start, desto höher die Sparrate',unit:'Euro pro Monat, nötig für das Ziel (Modellrechnung)'});
}
function chartAnlage(a){
  var bars=[];
  if(!a.sz.length)bars.push({label:'Einzahlungen gesamt',segs:[{v:a.ein,c:'#25507A',t:'Einzahlungen'}]});
  a.sz.forEach(function(z){bars.push({label:z.name,segs:[{v:Math.min(a.ein,z.w),c:'#25507A',t:'Einzahlungen'},{v:Math.max(0,z.w-a.ein),c:z.c,t:'Wertzuwachs'}]})});
  return stackedBars(bars,{title:'Einzahlungen und mögliches Kapital am Laufzeitende',unit:'Euro, Szenarien aus der Berechnung der Gesellschaft, keine Garantie'});
}
function chartSteuerZeit(){
  var W=1100,H=560,k=cv(W,H),x=k.x,L=50,R=W-50,span=R-L;
  x.fillStyle='#16202A';x.font='bold 26px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Wann fällt Steuer an?',L,36);
  x.font='19px '+FONT;x.fillStyle='#5B6773';x.fillText('Vereinfachte Darstellung. Die persönliche Steuersituation entscheidet.',L,62);
  function lane(y,title,col){
    rrect(x,L,y,span,40,10,col);x.fillStyle='#fff';x.font='bold 22px '+FONT;x.textAlign='left';x.textBaseline='middle';x.fillText(title,L+16,y+21);
    x.strokeStyle=col;x.lineWidth=5;x.beginPath();x.moveTo(L,y+110);x.lineTo(R,y+110);x.stroke();
  }
  function dot(px,y,col,r){x.fillStyle=col;x.beginPath();x.arc(L+px*span,y+110,r||9,0,Math.PI*2);x.fill()}
  function txt(px,y,t,w,align,col,bold){x.fillStyle=col||'#16202A';x.font=(bold?'bold ':'')+'18px '+FONT;x.textBaseline='alphabetic';wrapTxt(x,t,L+px*span,y,w,23,align||'left')}
  var y1=84,y2=300,red='#B3362D',grn='#2C7A57';
  lane(y1,'Fondssparplan oder Depot',red);
  for(var i=0;i<9;i++)dot(0.04+i*0.065,y1,red,6);
  dot(0.6,y1,red,10);dot(0.88,y1,red,12);
  txt(0.02,y1+148,'Jedes Jahr: Vorabpauschale kann Steuer auslösen',230,'left');
  txt(0.6,y1+148,'Umschichten: Gewinne werden sofort versteuert',210,'center');
  txt(0.88,y1+148,'Verkauf: '+REGEL.abg+' auf den Gewinn',190,'center');
  lane(y2,'Fondspolice',grn);
  x.fillStyle='#E8F3EC';rrect(x,L+0.02*span,y2+90,0.5*span,40,10,'#E8F3EC');
  x.fillStyle=grn;x.font='bold 19px '+FONT;x.textAlign='left';x.textBaseline='middle';x.fillText('Ansparphase ohne laufende Steuer',L+0.04*span,y2+110);
  dot(0.6,y2,grn,10);dot(0.88,y2,grn,12);
  txt(0.02,y2+148,'Fondswechsel in der Police lösen keine Steuer aus',230,'left');
  txt(0.6,y2+148,'Fondswechsel bleiben steuerfrei',200,'center');
  txt(0.88,y2+148,'Auszahlung: ab 12 Jahren und ab 62 nur 50 % des Ertrags steuerpflichtig',230,'center');
  x.fillStyle='#5B6773';x.font='18px '+FONT;x.textBaseline='alphabetic';x.textAlign='left';x.fillText('Anlagebeginn',L,H-18);x.textAlign='right';x.fillText('Auszahlung',R,H-18);
  return k.c;
}
/* ---- Chart-Zeichnen für Wizard und Gesprächsmodus ---- */
function chartAlt(t){
  try{
    if(t==='pfwo'){var P=REGEL.pflege.stat;return 'Balkendiagramm: '+P.zuhause+' Prozent der Pflegebedürftigen werden zu Hause versorgt, '+P.heim+' Prozent im Heim.'}
    if(t==='pfheim'||t==='pfhaus'){var R=pfBruecke(t==='pfheim'?'heim':'haus');return 'Rechenweg als Balken: '+R.map(function(z){return z.l+' '+eur(Math.abs(z.v))}).join(', ')+'.'}
    if(t==='pfjahre')return 'Balkendiagramm: Eigenanteil im Heim nach Aufenthaltsjahr: '+pfHeimJahre().map(function(j){return eur(j.eigen)}).join(', ')+'.';
    if(t==='bu'){var u=buCalc();return 'Balkendiagramm: Netto-Einkommen '+(isNaN(u.n)?'nicht erfasst':eur(u.n))+', im Leistungsfall verfügbar '+eur(u.v)+(isNaN(u.lueN)?'':', Unterschied '+eur(u.lueN))+' pro Monat.'}
    if(t==='ganz')return 'Themenrad mit acht Lebensbereichen und ihrem Beratungsstand.';
    if(t==='leben')return 'Lebensweg von der Geburt bis zum Lebensende mit markierter aktueller Position.';
  }catch(e){}
  return 'Diagramm zur Beratung. Die Zahlen stehen auch im Text und in den Kennzahlen daneben.';
}
function drawCharts(el){
  var c=null,a=null;
  Array.prototype.forEach.call(el.querySelectorAll('.chartbox'),function(b){
    var t=b.dataset.c,cvs=null;b.innerHTML='';
    try{
      if(t==='steuer')cvs=chartSteuerZeit();
      else if(t==='kv'){var kc=calcKv();if(!kc.err)cvs=chartKv(kc)}
      else if(t==='ganz')cvs=chartGanz();
      else if(t==='pfheim')cvs=chartPfBruecke('heim');
      else if(t==='pfhaus')cvs=chartPfBruecke('haus');
      else if(t==='pfjahre')cvs=chartPfJahre();
      else if(t==='bu')cvs=chartBu();
      else if(t==='pfwo')cvs=chartPfWo();
      else if(t==='leben')cvs=chartLeben();
      else if(t==='entw')cvs=chartEntw();
      else if(t==='alter'){var ka=calcKvAlter();if(!ka.err)cvs=chartAlter(ka)}
      else if(t==='anlage'){a=a||calcAn();if(!a.err)cvs=chartAnlage(a)}
      else{c=c||calcAl();if(!c.err)cvs=t==='ist'?chartLueckeIst(c):t==='soll'?chartLueckeSoll(c):t==='warten'?chartWarten(c):konzeptDiagram(c)}
    }catch(e){cvs=null}
    if(cvs){cvs.style.width='100%';cvs.style.height='auto';b.appendChild(cvs);b.setAttribute('role','img');b.setAttribute('aria-label',chartAlt(t))}
  });
}
function fillRes(){if(talkOpen&&cur){talkLive();return}var el=$('advres');if(el&&adv&&mailAdv){el.innerHTML=briefRes()}}

/* ---- Formulare Geldanlage ---- */
function anRowHtml(i,r){
  var b='an.rows.'+i;
  return '<div class="mrow"><div class="mname"><input type="text" data-adv="'+b+'.name" value="'+esc(r.name)+'" maxlength="90" aria-label="Merkmal"><button class="x" data-act="adv-an-del" data-i="'+i+'" aria-label="Zeile entfernen">×</button></div>'+
    '<div class="mcols"><div>'+ampSel(b+'.s',r.s)+'</div><div><input type="text" data-adv="'+b+'.t" value="'+esc(r.t)+'" maxlength="80" placeholder="Angabe" aria-label="Angabe"></div></div></div>';
}
function anEck(){return '<div class="grid2">'+fld('an.alter','Alter heute',{unit:'Jahre'})+fld('an.jahre','Laufzeit',{unit:'Jahre'})+fld('an.einmal','Einmalanlage',{unit:'€'})+fld('an.monat','Monatlicher Beitrag',{unit:'€ / Monat'})+'</div>'}
function anErgForm(){
  return '<div class="sh2">Kapital am Laufzeitende laut Berechnung der Gesellschaft</div><div class="grid2">'+fld('an.szen.low','Vorsichtig',{unit:'€'})+fld('an.szen.mid','Mittleres Szenario',{unit:'€'})+fld('an.szen.high','Chancenreich',{unit:'€'})+fld('an.entnahme','Mögliche Entnahme',{unit:'€ / Monat'})+'</div>'+
    fld('an.vorteil','Steuervorteil gegenüber Fondssparplan laut Rechner',{unit:'€',hint:'Optional. Nur eintragen, wenn dein Rechner den Wert ausweist.'})+
    fld('an.quelle','Hinweis zur Berechnung',{mode:'text',max:120,ph:'z. B. Berechnung der Gesellschaft, Stand 10/2026',hint:'Erscheint im PDF unter den Zahlen.'});
}
function anRowsForm(){
  return '<div class="sh2">Merkmale deiner Police</div>'+adv.an.rows.map(function(r,i){return anRowHtml(i,r)}).join('')+'<div class="btnrow" style="margin-top:8px"><button class="btn small" data-act="adv-an-add">Zeile hinzufügen</button><button class="btn small" data-act="adv-an-reset" data-confirm="Zeilen aus Katalog neu laden?">Aus Katalog neu laden</button></div>';
}
function fAn(){return '<h3 class="sh">Geldanlage: Fondspolice</h3>'+anEck()+anErgForm()+anRowsForm()}
function halbNote(a){
  if(a.err||a.halb===null)return '';
  return a.halb?'<div class="note ok">Laufzeit und Endalter ('+a.endAlter+') passen zum Halbeinkünfteverfahren: mindestens 12 Jahre Laufzeit und Auszahlung ab 62.</div>':'<div class="note">Für das Halbeinkünfteverfahren sind mindestens 12 Jahre Laufzeit und eine Auszahlung ab 62 nötig. Das ist mit diesen Angaben noch nicht erfüllt.</div>';
}
function anRes(){
  var a=calcAn();if(a.err)return '<div class="note">'+esc(a.err)+'</div>';
  var h='<div class="stats">'+stat('Einzahlungen gesamt',eur(a.ein),'über '+a.j+' Jahre')+(isFinite(a.ent)?stat('Mögliche Entnahme',eur(a.ent),'pro Monat','grow'):'')+(isFinite(a.vorteil)?stat('Steuervorteil laut Rechner',eur(a.vorteil),'','good'):'')+'</div>';
  h+=halbNote(a)+'<div class="chartbox" data-c="steuer"></div>';
  if(a.sz.length)h+='<div class="chartbox" data-c="anlage"></div>';
  return h;
}

/* ---- Gesprächsmodus ---- */
function P(t){return '<p class="tp">'+t+'</p>'}
function Q(t){return '<div class="tq">'+t+'</div>'}
function BUL(l){return '<ul class="tl">'+l.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul>'}
function chipsHtml(list){return '<div class="chips">'+list.map(function(w){return '<button class="chip" data-act="adv-wish" data-w="'+esc(w)+'" aria-pressed="'+(adv.wuensche.indexOf(w)>-1)+'">'+esc(w)+'</button>'}).join('')+'</div>'}
function layersHtml(){
  var h=adv.al.have;
  return '<div class="layers"><div class="layer l3'+(h.s3?' on':'')+'"><b>3. Private Vorsorge</b><span>Fondspolice, Kapitalanlagen, Immobilien. Flexibel, nicht staatlich gefördert.</span></div>'+
    '<div class="layer l2'+(h.s2?' on':'')+'"><b>2. Zusatzversorgung</b><span>Betriebsrente, Riester, ab 2027 das Altersvorsorgedepot. Teils staatlich gefördert.</span></div>'+
    '<div class="layer l1'+(h.s1?' on':'')+'"><b>1. Basisversorgung</b><span>Gesetzliche Rente, berufsständische Versorgung, Basisrente (Rürup). Steuerlich gefördert.</span></div></div>';
}
function kaufkraftStat(c){return '<div class="stats">'+stat('Kaufkraft im Ruhestand','1.000 € = '+eur(1000/c.f),'Wert von 1.000 € heute nach '+c.n+' Jahren bei '+pctS(c.o.infl)+' Inflation','bad')+'</div>'}
function rurupLive(){
  var c=calcAl();if(c.err)return '<div class="note">'+esc(c.err)+'</div>';
  var ru=c.prods.filter(function(p){return p.key==='ru'})[0];
  if(!ru||!(ru.b>0))return '<div class="note">Trage einen Beitrag für die Rürup-Rente und den Steuersatz ein.</div>';
  var net=rurupNetto(ru),h='<div class="stats">'+stat('Ihr Beitrag',eur(ru.b),'pro Monat, '+eur(ru.jb)+' im Jahr')+stat('Steuerersparnis',isNaN(ru.T)?'-':eur(ru.T),'pro Jahr'+(isNaN(ru.T)?', Steuersatz eintragen':''),isNaN(ru.T)?'':'good')+stat('Echte Belastung',isNaN(net)?'-':eur(net),'pro Monat nach Steuerersparnis')+'</div>';
  if(ru.jb>RURUP_MAX)h+='<div class="note">Der Jahresbeitrag liegt über dem Höchstbetrag 2026 für Einzelveranlagte ('+eur(RURUP_MAX)+'). Darüber hinaus gibt es keine Steuerförderung.</div>';
  return h;
}
function fazitForm(){
  return entForm()+abschlussFields()+'<div class="btnrow"><button class="btn primary" data-act="talk-out">Zur Ausgabe: PDF und CRM</button></div>'+(adv.mods.sach?'<div class="btnrow"><button class="btn" data-act="talk-sach">Weiter zu den Sachversicherungen</button></div>':'');
}
function fazitLive(){
  var nx=adv.ue?ueNext():[];
  var op=adv.ue?ueOpen():[];var h=(nx.length?'<div class="note"><b>Für unseren nächsten Termin vorgemerkt:</b> '+nx.map(function(r){return esc(r.t)}).join(', ')+'</div>':'')+(op.length?'<div class="note"><b>Noch zu klären:</b> '+op.map(function(r){return esc(r.t)}).join(', ')+'</div>':'')+'<div class="stats">';
  if(adv.mods.alter){var c=calcAl();if(!c.err){h+=stat('Versorgungslücke heute',eur(c.lueckeHeute),'pro Monat','bad');if(c.prods.length)h+=stat('Restlücke mit Lösung',eur(c.lueckeNach),'pro Monat',c.lueckeNach>0?'':'good')+stat('Beiträge gesamt',eur(c.sumB),'pro Monat')}}
  if(adv.mods.anlage){var a=calcAn();if(!a.err){h+=stat('Einzahlungen gesamt',eur(a.ein),'über '+a.j+' Jahre');var mid=a.sz.filter(function(z){return z.key==='mid'})[0];if(mid)h+=stat('Kapital, mittleres Szenario',eur(mid.w),'keine Garantie','grow')}}
  if(adv.mods.kv){var kf=calcKv();if(!kf.err){h+=stat('GKV mit Zusatz',eur(kf.A),'pro Monat');if(kf.hasPkv)h+=stat('PKV Eigenanteil',eur(kf.eigen),kf.cbOn?'effektiv '+eur(kf.eff[2])+' ab Jahr 3':'pro Monat')}}
  return h+'</div>';
}
function talkSlides(){
  var S=[];
  if(adv.mods.alter){
    S.push({title:'Die drei Schichten der Altersvorsorge',text:P('Wer im Ruhestand gut leben will, stützt sich auf mehrere Säulen. Schauen wir, wo Sie heute stehen.')+Q('Welche dieser Schichten haben Sie heute schon, und wie sicher fühlen Sie sich damit?'),
      form:function(){return layersHtml()+chk('al.have.s1','Basisversorgung vorhanden (gesetzliche Rente)')+chk('al.have.s2','Zusatzversorgung vorhanden (Betriebsrente, Riester)')+chk('al.have.s3','Private Vorsorge vorhanden')},
      tip:'Schichten abhaken, die der Kunde hat. Meist ist nur die gesetzliche Rente gefüllt. Lass ihn die Lücke selbst benennen.'});
    S.push({title:'Wie stellen Sie sich Ihren Ruhestand vor?',text:Q('Was ist Ihnen später wichtig? Tippen Sie an, was zutrifft.'),
      form:function(){return chipsHtml(WUENSCHE)+'<div class="grid2">'+fld('al.alter','Alter heute',{unit:'Jahre'})+fld('al.rentenalter','Gewünschtes Rentenalter',{unit:'Jahre'})+'</div>'},
      tip:'Die Wünsche später im Fazit wieder aufgreifen. Der Kunde begründet selbst, warum Vorsorge wichtig ist.'});
    S.push({title:'Wie viel Geld brauchen Sie im Monat?',text:P('Wie viel Netto sollte Ihnen im Ruhestand zur Verfügung stehen? Viele wollen ihren heutigen Lebensstandard halten.')+Q('Was zahlt Ihnen Ihr Arbeitgeber heute netto aus, und wie viel davon möchten Sie später haben?'),
      form:function(){return '<div class="grid2">'+fld('al.gehalt','Netto-Gehalt heute',{unit:'€ / Monat'})+fld('al.zielPct','Gewünscht',{unit:'% vom Netto'})+'</div>'},
      live:function(){var g=nv(adv.al.gehalt),p=nv(adv.al.zielPct);return g>0?'<div class="stats">'+stat('Ihr Wunsch im Ruhestand',eur(g*(isNaN(p)?1:p/100)),'pro Monat, in heutiger Kaufkraft','good')+'</div>':''},
      tip:'Der Kunde nennt den Betrag selbst. Je klarer sein Wunsch, desto überzeugender ist später die Lücke.'});
    S.push({title:'Was bringt die gesetzliche Rente?',text:BUL(['Die Rente wird im <b>Umlageverfahren</b> bezahlt: Ihre Beiträge finanzieren die Renten von heute, die Beitragszahler von morgen zahlen Ihre.','Ihre Rente = <b>Entgeltpunkte × aktueller Rentenwert</b>. Ein Jahr mit Durchschnittsverdienst ergibt einen Punkt. Seit 1. Juli 2026 ist ein Punkt 42,52 € wert.','Das <b>Rentenniveau</b> liegt bei 48 % und ist bis 1. Juli 2031 gesetzlich festgeschrieben. Danach ist offen, wie es weitergeht. Ohne Eingreifen könnte es bis 2040 auf rund 45 % sinken.','Regelaltersgrenze: <b>67 Jahre</b> (Jahrgang 1964 und jünger). Wer früher geht, bekommt <b>0,3 % Abschlag pro Monat</b>.','Von der Bruttorente gehen <b>Steuer sowie Kranken- und Pflegeversicherung</b> ab. Bei Rentenbeginn 2026 sind 84 % der Rente steuerpflichtig, bei Beginn 2027 84,5 %, danach steigt der Anteil weiter.'])+Q('Haben Sie Ihre Renteninformation dabei? Was steht dort als voraussichtliche Rente?'),
      form:function(){return fld('al.brutto','Voraussichtliche Rente laut Renteninformation (brutto)',{unit:'€ / Monat'})+fld('al.abzug','Abzüge für Steuer, Kranken- und Pflegeversicherung',{unit:'%',hint:'Grobe Schätzung. Der Kunde kann auch direkt seine erwartete Netto-Rente eintragen.'})+fld('al.rente','Erwartete Netto-Rente',{unit:'€ / Monat'})+fld('al.bav','Betriebsrente (netto), falls vorhanden',{unit:'€ / Monat'})},
      tip:'Stand der Zahlen: 10/2026 (Rentenanpassung DRV, Rentenpaket 2025, Besteuerungsanteil). Vor Terminen kurz prüfen. Die Renteninformation zeigt Brutto-Werte, deshalb der Abzug.'});
    S.push({title:'Ihre persönliche Versorgungslücke',text:P('Das ist der Unterschied zwischen dem, was Sie möchten, und dem, was die gesetzliche Rente voraussichtlich liefert.'),
      form:function(){return '<details class="adv"><summary>Annahmen der Rechnung</summary><div class="grid2">'+fld('al.lebenserw','Planung bis Alter',{unit:'Jahre'})+fld('al.infl','Inflation',{unit:'% p. a.'})+fld('al.ra','Rendite Ansparphase',{unit:'% p. a.'})+fld('al.re','Rendite Rentenphase',{unit:'% p. a.'})+'</div><label class="fl"><span>Rentenwerte eingeben als</span><select data-adv="al.modus"><option value="heute"'+(adv.al.modus==='heute'?' selected':'')+'>in heutiger Kaufkraft</option><option value="nom"'+(adv.al.modus==='nom'?' selected':'')+'>zum Rentenbeginn</option></select></label></details>'},
      live:function(){var c=calcAl();return stepRes('al_ist')+(c.err?'':kaufkraftStat(c))},
      tip:'Lass den Kunden die rote Fläche kommentieren: Was bedeutet das für ihn? Die Lücke in Euro pro Monat wirkt stärker als Prozentwerte.'});
    S.push({title:'Zeit ist Ihr größter Hebel',text:P('Je früher Sie anfangen, desto kleiner ist die monatliche Sparrate. Jedes Jahr Warten macht es teurer.')+Q('Was wäre Ihnen lieber: jetzt etwas weniger oder später deutlich mehr?'),
      live:function(){var c=calcAl();if(c.err)return '<div class="note">'+esc(c.err)+' (Schritte davor ausfüllen)</div>';if(!(c.lueckeHeute>0))return '<div class="note">Es gibt keine Lücke, daher ist keine Sparrate nötig.</div>';return '<div class="chartbox" data-c="warten"></div><p class="hint-t">Modellrechnung mit '+pctS(c.o.ra)+' Rendite vor Steuern und Kosten. Wertentwicklungen sind nicht garantiert.</p>'},
      tip:'Die Balken zeigen, wie stark die nötige Rate steigt. Dann direkt zur Lösung überleiten.'});
    S.push({title:'Der Staat hilft mit: Rürup-Rente',text:BUL(['Beiträge zur <b>Basisrente (Rürup)</b> können Sie zu 100 % von der Steuer absetzen, bis zum Höchstbetrag (2026: '+eur(RURUP_MAX)+', zusammen veranlagt '+eur(RURUP_MAX2)+').','Ihre echte Belastung ist deshalb niedriger als der Beitrag.','Die Rente wird später besteuert. Der Anteil hängt vom Rentenbeginn ab (2026: 84 %).','Ab 2027 kommt das <b>Altersvorsorgedepot</b> mit staatlicher Förderung hinzu und löst Riester ab. Die genauen Bedingungen hängen vom Anbieter ab.'])+Q('Was würden Sie mit der Steuerersparnis machen?'),
      form:function(){return '<div class="grid2">'+fld('al.ru.b','Beitrag Rürup',{unit:'€ / Monat'})+fld('al.steuer','Grenzsteuersatz',{unit:'%',hint:'Schätzwert inkl. Zuschläge'})+'</div>'+chk('al.ru.on','Rürup-Rente in die Lösung aufnehmen')},
      live:rurupLive,
      tip:'Die Steuerersparnis ist der Einstieg ins Konzept: Ersparnis in die Fondspolice investieren (nächste Folie).'});
    S.push({title:'Unsere Lösung',text:P('Hier tragen wir die Ergebnisse aus der Berechnung ein und sehen, wie sich Ihre Lücke schließt.'),
      form:function(){return prodBox('ru','Rürup-Rente (fondsbasiert)',{rl:'Erwartete Rente'})+prodBox('fp','Fondspolice',{rl:'Entnahmebetrag zu Rentenbeginn',more:(adv.al.ru.on?'<button class="btn small" data-act="adv-fp-from-tax">Beitrag aus Steuerersparnis übernehmen</button>':'')})+prodBox('ad','Altersvorsorgedepot (ab 2027)',{rl:'Erwartete Entnahme'})+fld('al.quelle','Hinweis zur Berechnung',{mode:'text',max:120,ph:'z. B. Berechnung der Gesellschaft, Stand 10/2026'})},
      live:function(){return stepRes('al_loes')},
      tip:'Werte aus dem Rechner der Gesellschaft übernehmen. Das Konzept-Diagramm zeigt: Beitrag in Rürup, Steuerersparnis in die Fondspolice.'});
  }
  S.forEach(function(x){x.area='alter'});
  var n1=S.length;
  if(adv.mods.anlage){
    S.push({title:'Was möchten Sie mit Ihrem Geld erreichen?',text:Q('Was ist Ihnen bei der Geldanlage wichtig? Tippen Sie an, was zutrifft.'),
      form:function(){return chipsHtml(ANWUENSCHE)+anEck()},
      live:function(){var a=calcAn();return a.err?'':'<div class="stats">'+stat('Einzahlungen gesamt',eur(a.ein),'über '+a.j+' Jahre')+'</div>'+halbNote(a)},
      tip:'Alter und Laufzeit prüfen die Voraussetzung für das Halbeinkünfteverfahren (12 Jahre, Auszahlung ab 62).'});
    S.push({title:'So wird Geldanlage normalerweise besteuert',text:BUL(['Gewinne aus Fonds und Aktien unterliegen der <b>Abgeltungsteuer</b>: 25 % plus Solidaritätszuschlag, also '+REGEL.abg+', zuzüglich Kirchensteuer.','Pro Jahr bleiben Gewinne bis <b>1.000 €</b> (Verheiratete 2.000 €) durch den Sparer-Pauschbetrag steuerfrei.','Bei Aktienfonds sind <b>30 %</b> der Erträge teilfreigestellt.','Auch ohne Verkauf kann jedes Jahr eine <b>Vorabpauschale</b> anfallen (Basiszins 2026: 3,20 %).','Wer <b>umschichtet</b>, verkauft. Gewinne werden dabei sofort versteuert.'])+Q('Wie oft schichten Sie um, und wie viel Steuer zahlen Sie heute pro Jahr auf Ihre Anlagen?'),
      tip:'Stand der Werte: 10/2026. Lass den Kunden seine jährliche Steuer schätzen, das macht den Vorteil der Police greifbar.'});
    S.push({title:'Die Fondspolice als Steuer-Hülle',text:BUL(['In der Police gibt es <b>keine laufende Besteuerung</b>. Fondswechsel innerhalb des Vertrags lösen keine Steuer aus.','Steuer fällt erst bei der <b>Auszahlung</b> an.','Bei Auszahlung nach <b>mindestens 12 Jahren</b> und ab <b>Alter 62</b> wird nur die Hälfte des Ertrags mit Ihrem persönlichen Steuersatz versteuert (Halbeinkünfteverfahren).','Bei lebenslanger Rente wird nur der <b>Ertragsanteil</b> versteuert, bei Rentenbeginn mit 67 sind das 17 %.']),
      live:function(){var a=calcAn();return '<div class="chartbox" data-c="steuer"></div>'+halbNote(a)+'<div class="note">Gut zu wissen: Policen haben eigene Kosten und binden Sie enger an den Vertrag. Ob sich das lohnt, hängt von Laufzeit, Kosten und Ihrer Steuersituation ab.</div>'},
      tip:'Ehrlich bleiben: Kosten und Bindung nennen. Vorteile wirken stärker, wenn der Kunde sie selbst einordnet.'});
    S.push({title:'Was kann am Ende herauskommen?',text:P('Drei Szenarien zeigen, in welcher Bandbreite sich das Kapital entwickeln kann. Garantiert ist das nicht.'),
      form:anErgForm,
      live:function(){var a=calcAn();return a.err?'<div class="note">'+esc(a.err)+'</div>':(a.sz.length?'<div class="chartbox" data-c="anlage"></div>':'<div class="note">Trage mindestens ein Szenario ein, dann erscheint das Diagramm.</div>')+'<div class="stats">'+stat('Einzahlungen gesamt',eur(a.ein),'über '+a.j+' Jahre')+(isFinite(a.ent)?stat('Mögliche Entnahme',eur(a.ent),'pro Monat','grow'):'')+(isFinite(a.vorteil)?stat('Steuervorteil laut Rechner',eur(a.vorteil),'','good'):'')+'</div>'},
      tip:'Szenarien aus dem Rechner der Gesellschaft übernehmen. Immer auch das vorsichtige Szenario zeigen.'});
    S.push({title:'Flexibilität und Absicherung',text:P('Welche Leistungen die Police mitbringt, sehen Sie hier. So behalten Sie den Überblick.'),
      form:anRowsForm,
      tip:'Merkmale mit der Ampel einstufen. Katalog unter „Leistungsmerkmale bearbeiten“ anpassbar.'});
  }
  S.slice(n1).forEach(function(x){x.area='vermoegen'});
  var n2=S.length;
  if(adv.mods.kv)S=S.concat(kvSlides());
  S.slice(n2).forEach(function(x){x.area='gesund'});
  var n3=S.length;
  if(adv.mods.zus)S=S.concat(zusSlides());
  if(adv.mods.bu)S=S.concat(buSlides());
  if(adv.mods.pflege)S=S.concat(pfSlides());
  if(adv.mods.vorsorge)S=S.concat(vpSlides());
  S.slice(n3).forEach(function(x){if(!x.area)x.area=x.ill==='zus'?'gesund':'nachlass'});
  (function(){
    var tg={'Die drei Schichten der Altersvorsorge':['rente'],'Was wäre Ihnen im Pflegefall wichtig?':['pflege'],'Was passiert, wenn mir etwas passiert?':['vollmacht','testament','tod','unfall'],'Wenn ich nicht mehr selbst entscheiden kann':['vollmacht'],'Wenn ich pflegebedürftig werde':['pflege'],'Wenn etwas passiert':['unfall','arbeit'],'Wenn ich sterbe':['testament','tod']};
    S.forEach(function(x){var t=String(x.title).replace(/<[^>]+>/g,'');if(tg[t]&&!x.leit)x.leit=tg[t]});
    var fs=function(re,keys){for(var i=0;i<S.length;i++){if(!S[i].leit&&re.test(String(S[i].title))){S[i].leit=keys;return}}};
    fs(/^Was möchten Sie mit Ihrem Geld erreichen/,['anlage']);
    fs(/^Die gesetzliche Krankenversicherung/,['kranken']);
  })();
  S.forEach(function(x){x.st=4});
  var intro=[];
  if(!adv.direct){
    intro.push({st:1,title:'Ihre Situation',text:'<p class="tp rahmen">'+esc(grp()?grp().rahmen:GR.arbeitend.rahmen)+'</p>',form:kdForm,tip:(grp()?grp().tipp+' ':'')+'Basisdaten einmal erfassen, nur Zahlen, keine Namen. Der Rahmen oben nimmt dem Kunden die Sorge, nur verkauft zu bekommen.'});
    intro.push({st:2,title:'Ihr Überblick',text:P('So sind Sie heute abgesichert. Grün gedeckt, gelb teilweise, rot eine Lücke. Ungeklärt, kein Bedarf oder bewusst nein sind keine Lücken.'),form:ueForm,live:ueSummary,tip:'Zeile für Zeile mit dem Kunden durchgehen: „Haben Sie dazu etwas?“ Nur feststellen, noch nicht beraten. Bei „weiß ich nicht“ als Lücke markieren. Die Lücke benennt der Kunde selbst.'});
    intro.push({st:3,title:'Was ist Ihnen heute am wichtigsten?',text:Q('Welche ein bis drei Themen gehen wir heute an? Der Rest hat Zeit.'),form:schwerForm,leit:(adv.top||[]),tip:'Der Kunde wählt, du schlägst höchstens vor. Die übrigen Lücken bleiben als „Nächster Termin“ stehen und landen als Aufgabe im CRM.'});
  }
  if(!adv.direct&&!S.length)S.push({st:4,title:'Noch kein Schwerpunkt gewählt',text:P('Wähle in Station 3 ein bis drei Themen. Dann öffnen sich hier die passenden Rechner.')});
  S=intro.concat(S);
  S.push({st:5,title:'Zusammenfassung und nächste Schritte',text:P('Das haben wir heute gemeinsam erarbeitet.')+(adv.wuensche.length?'<p class="tp">Ihnen sind wichtig: <b>'+adv.wuensche.map(esc).join(', ')+'</b>.</p>':''),form:fazitForm,live:fazitLive,leit:(adv.top||[]),tip:'Wiedervorlage setzen, Unterlagen vereinbaren. Der Folgetermin ergibt sich aus den Sorgen des Kunden, nicht aus deiner Liste. Das PDF enthält den Hinweis, dass es sich um Skizzen und Notizen handelt.'});
  return S;
}
var WENNQ=[['a','Wenn ich ausfalle','Krankheit, Unfall: Wer entscheidet für mich, und wovon leben wir?'],['b','Wenn ich älter werde und Hilfe brauche','Wer pflegt mich, und wer bezahlt es?'],['c','Wenn ich nicht mehr da bin','Ist geregelt, wer was bekommt und wer versorgt ist?']];
function wennForm(){
  var w=adv.wenn||{};
  return WENNQ.map(function(q){return '<div class="vpb"><h4>'+esc(q[1])+'</h4><div class="vpi" style="margin:0 0 8px">'+esc(q[2])+'</div><div class="lwc">'+[['ja','Ist geregelt'],['teil','Teilweise'],['nein','Noch offen']].map(function(o){return '<button class="chip" data-act="adv-wenn" data-k="'+q[0]+'" data-v="'+o[0]+'" aria-pressed="'+(w[q[0]]===o[0])+'">'+o[1]+'</button>'}).join('')+'</div></div>'}).join('');
}
var WAHL=[['alter','Rente und Ruhestand'],['anlage','Geld sinnvoll anlegen'],['kv','Gesundheit und Krankenversicherung'],['sach','Haus, Auto, Hausrat'],['vorsorge','Vorsorge im Ernstfall im Detail']];
function wahlForm(){return '<div class="lwc">'+WAHL.map(function(o){return '<button class="chip" data-act="adv-wahl" data-m="'+o[0]+'" aria-pressed="'+!!adv.mods[o[0]]+'">'+o[1]+'</button>'}).join('')+'</div>'}
var RAIL_STEP={alter:'al_ist',vermoegen:'an',gesund:'kv',sach:'sach',nachlass:'vp'};
function railArea(){
  if(talkOpen){var s=talkSlides()[talkIdx];return s&&s.area?s.area:''}
  var id=steps()[advTab]?steps()[advTab][0]:'';
  return id==='al_ist'||id==='al_loes'?'alter':id==='an'?'vermoegen':id==='kv'?'gesund':id==='sach'?'sach':id==='vp'?'nachlass':'';
}
function railMod(k){var m=adv.mods;return k==='alter'?m.alter:k==='vermoegen'?m.anlage:k==='gesund'?(m.kv||m.pflege||m.zus):k==='sach'?m.sach:k==='nachlass'?m.vorsorge:false}
function railHtml(){
  var cur=railArea();
  return '<div class="rail" role="group" aria-label="Themen dieser Beratung">'+GANZ.map(function(g){
    var st=ganzStatus(g[0]);
    return '<button class="rchip'+(g[0]===cur?' cur':'')+(st?' s-'+st:'')+'" data-act="talk-rail" data-k="'+g[0]+'" aria-pressed="'+(g[0]===cur)+'"><i class="rd"></i>'+esc(g[1])+'</button>'}).join('')+'</div><div class="rcap">Antippen: Thema öffnen, oder für einen Folgetermin vormerken.</div>';
}
function railGo(k){
  var g=ganzObj();
  if(railMod(k)){
    if(talkOpen){var sl=talkSlides();for(var i=0;i<sl.length;i++)if(sl[i].area===k){talkIdx=i;renderTalk();return}return}
    advTab=stepIndex(RAIL_STEP[k]);renderWizard();window.scrollTo(0,0);return;
  }
  g[k]=g[k]==='interest'?'':'interest';toast(g[k]?'Für einen Folgetermin vorgemerkt':'Vormerkung entfernt');
  if(talkOpen)renderTalk(true);else renderWizard();
}




/* ================= Lebensweg und Gesprächseinstieg ================= */
var LEBEN=[
 ['geb','Geburt',['gesund','sach']],
 ['schule','Schule',['sach','gesund']],
 ['aus','Ausbildung oder Studium',['sach','einkommen','konto']],
 ['job','Erster Job',['einkommen','alter','gesund']],
 ['heirat','Heirat oder Partnerschaft',['einkommen','nachlass','sach']],
 ['kind','Kinder',['einkommen','gesund','vermoegen']],
 ['wechsel','Jobwechsel und Weiterbildung',['alter','einkommen']],
 ['mehr','Mehr Einkommen',['vermoegen','alter','immo']],
 ['rente','Ruhestand',['alter','gesund','vermoegen']],
 ['pflege','Pflegebedürftig',['gesund','nachlass']],
 ['tod','Lebensende und Nachlass',['nachlass','vermoegen']]
];
var LEBENK=[
 ['kgeb','Geburt',['gesund','sach']],
 ['kschule','Schule',['sach','gesund']],
 ['kaus','Ausbildung oder Studium',['gesund','einkommen','konto']],
 ['kjob','Berufsstart',['einkommen','alter','gesund']],
 ['kfam','Eigene Familie',['immo','nachlass','vermoegen']]
];
var KURZ={sach:'Sach',gesund:'Gesundheit',einkommen:'Einkommen',alter:'Altersvorsorge',vermoegen:'Vermögen',immo:'Immobilie',nachlass:'Nachlass',konto:'Konto'};
function lenObjSafe(){return lebenObj()}
function lebenObj(){if(!adv.leben)adv.leben={pos:'',kinder:false};return adv.leben}
function lebenH(){return lebenObj().kinder?820:500}
function chartLeben(){
  var L=lebenObj(),W=800,H=lebenH(),k=cv(W,H),x=k.x;
  var pos=-1;LEBEN.forEach(function(s2,i){if(s2[0]===L.pos)pos=i});
  function words(t,maxw,f){x.font='bold '+f+'px '+FONT;var w=t.split(' '),out=[],cur='';w.forEach(function(q){var tt=cur?cur+' '+q:q;if(x.measureText(tt).width>maxw&&cur){out.push(cur);cur=q}else cur=tt});if(cur)out.push(cur);return out}
  function node(cx,cy,s2,past,isCur){
    var r=isCur?34:28;
    if(isCur){x.fillStyle='#DCE9F8';x.beginPath();x.arc(cx,cy,r+11,0,Math.PI*2);x.fill()}
    x.fillStyle=past?'#7B8FA6':isCur?'#0A4A9C':'#fff';x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();
    x.lineWidth=4;x.strokeStyle=past?'#7B8FA6':'#0A4A9C';x.stroke();
    if(past){x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='bold 28px '+FONT;x.fillText('✓',cx,cy+1)}
    var lines=words(s2[1],176,25);x.fillStyle=isCur?'#0A4A9C':'#16202A';x.font='bold 25px '+FONT;x.textAlign='center';x.textBaseline='middle';lines.forEach(function(t,i){x.fillText(t,cx,cy+r+28+i*29)});
    if(isCur){x.fillStyle='#0A4A9C';x.font='bold 22px '+FONT;x.fillText('Hier stehen Sie',cx,cy-r-26)}
  }
  function row(list,y,x0,sp,start,kids){
    x.strokeStyle='#CBD3DB';x.lineWidth=6;x.lineCap='round';x.beginPath();x.moveTo(x0,y);x.lineTo(x0+(list.length-1)*sp,y);x.stroke();
    list.forEach(function(s2,i){var idx=start+i;node(x0+i*sp,y,s2,!kids&&pos>=0&&idx<pos,!kids&&idx===pos)});
  }
  var x0=(W-3*190)/2;
  row(LEBEN.slice(0,4),90,x0,190,0);row(LEBEN.slice(4,8),290,x0,190,4);row(LEBEN.slice(8),490-110+10,x0,190,8);
  if(L.kinder){
    x.fillStyle='#25507A';x.font='bold 30px '+FONT;x.textAlign='left';x.textBaseline='middle';x.fillText('Und bei den Kindern',40,520);
    row(LEBENK,610,90,150,0,true);
  }
  return k.c;
}
function einstiegThemen(){
  var heute=GANZ.filter(function(g){return ganzStatus(g[0])==='heute'}).map(function(g){return g[1]});
  var folge=GANZ.filter(function(g){return ganzStatus(g[0])==='interest'}).map(function(g){return g[1]});
  var rest=GANZ.filter(function(g){var st=ganzStatus(g[0]);return !st}).map(function(g){return g[1]});
  return {heute:heute,folge:folge,rest:rest};
}
function einstiegText(){
  var t=einstiegThemen(),h=t.heute.length?t.heute:['Ihre Wünsche und Ziele'];
  var f=t.folge.length?t.folge:t.rest.slice(0,4);
  return 'Heute sprechen wir über: '+h.join(' und ')+'.'+(f.length?' Weitere wichtige Themen für einen Folgetermin: '+f.join(', ')+'.':'')+' Wir begleiten Sie durch alle Lebensphasen. Deshalb sehen Sie auf jeder Seite, wo wir gerade sind und was noch kommt.';
}
function lebenForm(){
  var L=lebenObj();
  return '<div class="lw"><div class="pl">Wo stehen Sie auf Ihrem Lebensweg?</div><div class="lwc">'+LEBEN.map(function(s2){return '<button class="chip" data-act="adv-leben" data-k="'+s2[0]+'" aria-pressed="'+(L.pos===s2[0])+'">'+esc(s2[1])+'</button>'}).join('')+'</div>'+chk('leben.kinder','Kinder: auch den Weg der Kinder zeigen')+'</div><div class="chartbox" data-c="leben"></div>';
}
function folgeForm(){
  return '<label class="fl"><span>Gesprächseinstieg im PDF (leer lassen für den Standardtext)</span><textarea data-adv="folge.text" maxlength="500" placeholder="'+esc(einstiegText())+'">'+esc((adv.folge&&adv.folge.text)||'')+'</textarea></label>'+
   '<label class="fl"><span>Notizen zu Folgethemen</span><textarea data-adv="folge.notiz" maxlength="800" placeholder="z. B. Pflege: Kunde möchte Eltern einladen, Vollmachten bis zum nächsten Termin klären">'+esc((adv.folge&&adv.folge.notiz)||'')+'</textarea></label>';
}
function wennRows(){
  var T={a:'Wenn ich ausfalle (Krankheit, Unfall): Wer entscheidet, wovon leben wir?',b:'Wenn ich älter werde und Hilfe brauche: Wer pflegt, wer bezahlt es?',c:'Wenn ich nicht mehr da bin: Wer bekommt was, wer ist versorgt?'},W={ja:'geregelt',teil:'teilweise',nein:'noch offen','':'nicht besprochen'},w=adv.wenn||{};
  return ['a','b','c'].map(function(k){return [T[k],W[w[k]||'']]});
}
function einstiegReportOld(b){
  var g=adv.gesp||{},f=[g.f1,g.f2,g.f3].filter(function(t){return t&&t.trim()});
  b.push({t:'h',text:'Unser Gespräch heute'});
  b.push({t:'p',text:'Wir haben zuerst zugehört und geschaut, wo Sie stehen. Was davon sinnvoll ist, entscheiden Sie.'});
  if(f.length){b.push({t:'h',text:'Was Sie beschäftigt'});b.push({t:'bul',items:f.map(function(t){return t.trim()})})}
  var w=adv.wenn||{};
  if(w.a||w.b||w.c){b.push({t:'h',text:'Was passiert, wenn ...'});b.push({t:'table',head:['Frage','Stand'],w:[0.74,0.26],rows:wennRows()})}
}

/* ================= Überblick, Schwerpunkte, Stationen ================= */
var STATIONEN=[[1,'Kunde'],[2,'Überblick'],[3,'Schwerpunkte'],[4,'Vertiefen'],[5,'Ergebnis']];
var UE=[
 ['Existenz',[['arbeit','Arbeitskraft (Berufsunfähigkeit)','bu','einkommen'],['pflege','Pflege','pflege','gesund'],['tod','Hinterbliebene (Todesfall)','vorsorge','einkommen']]],
 ['Alter und Vermögen',[['rente','Rente und Ruhestand','alter','alter'],['anlage','Vermögen und Geldanlage','anlage','vermoegen']]],
 ['Gesundheit',[['kranken','Krankenversicherung','kv','gesund'],['unfall','Unfall','vorsorge','gesund']]],
 ['Haftung und Sachen',[['haftpflicht','Haftpflicht','sach','sach'],['hausrat','Hausrat','sach','sach'],['gebaeude','Wohngebäude','sach','sach'],['kfz','Kfz','sach','sach'],['rechtsschutz','Rechtsschutz','sach','sach']]],
 ['Ernstfall',[['vollmacht','Vollmachten und Patientenverfügung','vorsorge','nachlass'],['testament','Testament und Erbe','vorsorge','nachlass']]]
];

var GR={
 einsteiger:{name:'Berufseinsteiger',sub:'Ausbildung, Studium, erste Stelle',
  main:['arbeit','haftpflicht','rente','anlage','kranken','unfall','hausrat','rechtsschutz','kfz'],star:['arbeit','haftpflicht','rente'],
  lab:{rente:'Früh für die Rente vorsorgen',anlage:'Sparen und Vermögen aufbauen',arbeit:'Arbeitskraft absichern (Berufsunfähigkeit)',kranken:'Krankenversicherung (Zusatz, Wechsel)'},
  rahmen:'Sie stehen am Anfang. Heute geht es um die wenigen wirklich wichtigen Dinge, die früh angepackt wenig kosten. Ein Nein ist jederzeit in Ordnung.',
  tipp:'Einsteiger: Berufsunfähigkeit und Haftpflicht zuerst, der Gesundheitszustand entscheidet über den Beitrag. Rente nur als „früh anfangen kostet wenig“. Pflege und Erbe sind kein Thema.',
  beruf:['','in Ausbildung oder Studium','Berufsstart (erste Stelle)','Beamtenanwärter'],wohnen:['','bei den Eltern','Miete','Eigentum']},
 arbeitend:{name:'Arbeitende',sub:'Beruf, Familie, Haus',
  main:['arbeit','tod','rente','kranken','pflege','anlage','unfall','haftpflicht','hausrat','gebaeude','kfz','rechtsschutz','vollmacht','testament'],star:['arbeit','tod','rente'],lab:{},
  rahmen:'Wir schauen zuerst gemeinsam, wo Sie stehen. Was davon sinnvoll ist, entscheiden Sie. Ein Nein ist jederzeit in Ordnung.',
  tipp:'Arbeitende: Arbeitskraft, Familie absichern, Rente. Bei Eigentum Gebäude und Hausrat. Pflege als Ausblick, vor allem wenn die Eltern betroffen sind.',
  beruf:['','angestellt','selbstständig','Beamter'],wohnen:['','Miete','Eigentum']},
 rentner:{name:'Rentner',sub:'Ruhestand, Vermögen, Familie',
  main:['pflege','vollmacht','testament','tod','kranken','anlage','unfall','haftpflicht','hausrat','gebaeude','kfz'],star:['pflege','vollmacht','testament'],
  lab:{tod:'Bestattung und Hinterbliebene',anlage:'Vermögen erhalten und weitergeben',unfall:'Unfall im Alter',kranken:'Krankenversicherung (Zusatz und Beitrag)',pflege:'Pflege im Alter'},
  rahmen:'Es geht darum, dass Sie und Ihre Familie im Ernstfall gut aufgehoben sind. Ein Nein ist jederzeit in Ordnung.',
  tipp:'Rentner: Pflege, Vollmachten und Erbe stehen vorn. Keine Berufsunfähigkeit, keine Rentenlücke. Pflege-Rechnung mit der Netto-Rente zeigen, das wirkt.',
  beruf:[''],wohnen:['','Miete','Eigentum']}
};
function grp(){var g=adv&&adv.kd&&adv.kd.gruppe;return GR[g]||null}
function ueLab(k,t){var g=grp();return g&&g.lab[k]?g.lab[k]:t}
function ueIsStar(k){var g=grp();return !!(g&&g.star.indexOf(k)>=0)}
function ueRank(k){var g=grp();if(!g)return 99;var i=g.main.indexOf(k);return i<0?100:i}
var UEW={ja:'gedeckt',teil:'teilweise',nein:'Lücke',unklar:'ungeklärt',kb:'kein Bedarf',pref:'bewusst nicht gewünscht','':'nicht besprochen'};
var UEC=[['ja','✓ Gedeckt'],['teil','½ Teilweise'],['nein','▲ Lücke'],['unklar','? Ungeklärt'],['kb','– Kein Bedarf'],['pref','✕ Bewusst nein']];
var BS=[['nb','Noch nicht besprochen','○'],['bear','In Bearbeitung','◔'],['info','Informationen fehlen','?'],['pruef','Prüfbedarf','½'],['hand','Handlungsbedarf erkannt','▲'],['ent','Entscheidung ausstehend','‖'],['fertig','Abgeschlossen','✓']];
function bsOf(k){
  var v=ueStatus(k),e=(adv.ent&&adv.ent[k])||'',top=(adv.top||[]).indexOf(k)>=0;
  if(!v)return 'nb';
  if(v==='unklar')return 'info';
  if(v==='ja'||v==='kb'||v==='pref')return 'fertig';
  if(e==='spaeter')return 'ent';
  if(e==='heute'||e==='nein')return 'fertig';
  if(top)return 'bear';
  return v==='teil'?'pruef':'hand';
}
function bsLabel(b){return BS.filter(function(x){return x[0]===b})[0][1]}
function ueOpen(){return ueRows().filter(function(r){return ueStatus(r.k)==='unklar'})}
function bsList(){
  var by={};ueRows().forEach(function(r){var b=bsOf(r.k);(by[b]=by[b]||[]).push(r)});
  var out=['hand','ent','bear','pruef','info','fertig','nb'].filter(function(b){return by[b]}).map(function(b){var d=BS.filter(function(x){return x[0]===b})[0];return '<div class="bsr bs-'+b+'" role="listitem"><span class="bsg" aria-hidden="true">'+d[2]+'</span><div><b>'+d[1]+' ('+by[b].length+')</b><small>'+by[b].map(function(r){return esc(r.t)}).join(', ')+'</small></div></div>'}).join('');
  return out?'<div class="bsl" role="list" aria-label="Stand der Beratung">'+out+'</div><p class="hint-t">Ungeklärt ist keine Lücke: Es fehlt nur die Information. Lücke heißt: Der Kunde hat den Bedarf und ist nicht abgesichert.</p>':'';
}
function entForm(){
  var rows=ueGaps();if(!rows.length)return '';
  return '<div class="ueg">Was wurde entschieden?</div>'+rows.map(function(r){var e=(adv.ent&&adv.ent[r.k])||'';return '<div class="uer"><span class="n">'+esc(r.t)+'</span><div class="lwc">'+[['heute','Heute entschieden'],['spaeter','Kunde entscheidet später'],['nein','Bewusst nicht']].map(function(o){return '<button class="chip" data-act="adv-ent" data-k="'+r.k+'" data-v="'+o[0]+'" aria-pressed="'+(e===o[0])+'">'+o[1]+'</button>'}).join('')+'</div></div>'}).join('');
}
function ueRows(){var r=[];UE.forEach(function(g){g[1].forEach(function(x){r.push({k:x[0],t:ueLab(x[0],x[1]),mod:x[2],area:x[3],g:g[0]})})});return r}
function ueRow(k){return ueRows().filter(function(r){return r.k===k})[0]}
function ueStatus(k){return (adv.ue&&adv.ue[k])||''}
function ueGaps(){return ueRows().filter(function(r){var v=ueStatus(r.k);return v==='nein'||v==='teil'})}
function ueNext(){return ueGaps().filter(function(r){return (adv.top||[]).indexOf(r.k)<0})}
function topDerive(){
  var m={alter:false,anlage:false,kv:false,sach:false,vorsorge:false,pflege:false,bu:false,zus:false};
  (adv.top||[]).forEach(function(k){var r=ueRow(k);if(r)m[r.mod]=true});
  adv.mods=m;
}
function selHtml(path,label,opts){var v=getp(adv,path);return '<label class="fl"><span>'+label+'</span><select data-adv="'+path+'">'+opts.map(function(o){return '<option value="'+esc(o)+'"'+(o===v?' selected':'')+'>'+(o||'bitte wählen')+'</option>'}).join('')+'</select></label>'}
function grpPick(){
  return '<div class="ueg">Lebensphase des Kunden</div>'+Object.keys(GR).map(function(k){var on=adv.kd.gruppe===k;return '<button class="sw" data-act="adv-grp" data-k="'+k+'" aria-pressed="'+on+'"><span><strong>'+GR[k].name+'</strong><small>'+GR[k].sub+'</small></span></button>'}).join('');
}
function kdForm(){
  var g=grp(),h=grpPick();
  if(!g)return h+'<p class="hint-t">Wähle die Lebensphase. Danach passen sich Fragen und Überblick an.</p>';
  h+='<div class="ueg" style="margin-top:20px">Zur Person</div>';
  var rt=adv.kd.gruppe==='rentner';
  h+='<div class="grid2">'+fld('kd.alter','Alter',{unit:'Jahre'})+(rt?'':fld('kd.kinder','Kinder',{unit:'Anzahl'}))+'</div>';
  h+=selHtml('kd.fam','Familienstand',['','ledig','verheiratet oder Partnerschaft','getrennt oder geschieden','verwitwet']);
  if(!rt)h+=selHtml('kd.beruf',adv.kd.gruppe==='einsteiger'?'Ausbildung und Beruf':'Beruf',g.beruf);
  else h+=fld('kd.kinder','Kinder (Erben)',{unit:'Anzahl'});
  h+=selHtml('kd.wohnen','Wohnen',g.wohnen)+fld('kd.netto',rt?'Netto-Rente':'Netto-Einkommen',{unit:'€ / Monat'});
  return h;
}
function ueRowHtml(x){
  var v=ueStatus(x.k);
  return '<div class="uer" data-k="'+x.k+'"><span class="n"><i class="ui">'+ico(UIC[x.k]||'shield',20)+'</i>'+(ueIsStar(x.k)?'★ ':'')+esc(x.t)+'</span><div class="lwc">'+UEC.map(function(o){return '<button class="chip" data-act="adv-ue" data-k="'+x.k+'" data-v="'+o[0]+'" aria-pressed="'+(v===o[0])+'">'+o[1]+'</button>'}).join('')+'</div></div>';
}
function ueBase(k){var t=k;UE.forEach(function(g){g[1].forEach(function(x){if(x[0]===k)t=x[1]})});return t}
var LL=[
 ['Aufbau','Kindheit, Ausbildung, Start',['haftpflicht','unfall','arbeit'],'einsteiger','Mit Kindern: Unfallschutz, Zahn und Ausbildung früh bedenken.'],
 ['Arbeit und Familie','Beruf, Familie, Eigentum',['tod','rente','anlage','kranken','hausrat','gebaeude','kfz','rechtsschutz'],'arbeitend',''],
 ['Ruhestand','Pflege, Vorsorge, Nachlass',['pflege','vollmacht','testament'],'rentner','Vermögen übertragen: Schenkungen sind alle zehn Jahre bis zu den Freibeträgen steuerfrei. Das ist eine Information und kein Prüfpunkt.']
];
function lebenslinieHtml(){
  var all=ueRows(),cur=adv.kd&&adv.kd.gruppe;
  function band(b,i){
    var on=b[3]===cur;
    return '<div class="llb'+(on?' on':'')+'"><div class="llt"><span class="lln">'+(i+1)+'</span><span><b>'+b[0]+'</b><small>'+b[1]+'</small></span>'+(on?'<em>Ihre Phase</em>':'')+'</div>'+b[2].map(function(k){var r0=all.filter(function(q){return q.k===k})[0];if(!r0)return '';var r={k:k,t:ueBase(k)};var v=ueStatus(k);return '<button class="llk" data-act="talk-jump" data-k="'+k+'" title="'+esc(r.t+': '+UEW[v])+'" aria-label="'+esc(r.t+': '+UEW[v])+'"><span class="lli" aria-hidden="true">'+ico(UIC[k]||'shield',16)+'</span><span class="lls s-'+(v||'nb')+'" aria-hidden="true">'+(v==='ja'?'✓':v==='teil'?'½':v==='nein'?'▲':v==='unklar'?'?':v==='kb'?'–':v==='pref'?'✕':'○')+'</span>'+esc(r.t)+'</button>'}).join('')+(b[4]?'<p class="llp">'+esc(b[4])+'</p>':'')+'</div>';
  }
  var idx=LL.map(function(b,i){return i}),h='<div class="ll" role="group" aria-label="Lebenslinie mit Themen"><div class="llh">Ihre Lebenslinie</div>';
  var curI=LL.map(function(b){return b[3]}).indexOf(cur);
  if(curI<0)h+='<div class="llg">'+LL.map(band).join('')+'</div>';
  else h+='<div class="llg one">'+band(LL[curI],curI)+'</div><details class="adv"><summary>Andere Lebensphasen anzeigen</summary><div class="llg">'+LL.map(function(b,i){return i===curI?'':band(b,i)}).join('')+'</div></details>';
  return h+'<p class="hint-t">Antippen springt zur Zeile. Symbol und Text zeigen den Stand, nicht nur die Farbe.</p></div>';
}
function ueForm(){
  var g=grp(),all=ueRows();
  if(!g)return lebenslinieHtml()+UE.map(function(gg){return '<div class="ueg">'+esc(gg[0])+'</div>'+all.filter(function(r){return r.g===gg[0]}).map(ueRowHtml).join('')}).join('');
  var main=g.main.map(function(k){return all.filter(function(r){return r.k===k})[0]});
  var star=main.filter(function(r){return g.star.indexOf(r.k)>=0}),rest=main.filter(function(r){return g.star.indexOf(r.k)<0});
  var more=all.filter(function(r){return g.main.indexOf(r.k)<0});
  var h=lebenslinieHtml()+'<div class="ueg">★ Besonders wichtig in dieser Lebensphase</div>'+star.map(ueRowHtml).join('')+'<div class="ueg">Weitere Bereiche</div>'+rest.map(ueRowHtml).join('');
  if(more.length)h+='<details class="adv"><summary>Meist nicht relevant in dieser Lebensphase</summary>'+more.map(ueRowHtml).join('')+'</details>';
  return h;
}
function ueSummary(){
  var c={};ueRows().forEach(function(r){var v=ueStatus(r.k);c[v]=(c[v]||0)+1});
  return '<div class="stats">'+stat('Lücken',String(c.nein||0),'Handlungsbedarf',c.nein?'bad':'')+stat('Teilweise',String(c.teil||0),'prüfen')+stat('Gedeckt',String(c.ja||0),'in Ordnung','good')+stat('Ungeklärt',String(c.unklar||0),'keine Lücke, nur offen')+'</div>'+bsList();
}
function schwerForm(){
  var gaps=ueGaps().sort(function(a,b){return (ueIsStar(b.k)?1:0)-(ueIsStar(a.k)?1:0)||ueRank(a.k)-ueRank(b.k)||(ueStatus(a.k)==='nein'?0:1)-(ueStatus(b.k)==='nein'?0:1)});
  var rest=ueRows().filter(function(r){return gaps.indexOf(r)<0}).sort(function(a,b){return ueRank(a.k)-ueRank(b.k)});
  function card(r){var on=(adv.top||[]).indexOf(r.k)>=0,v=ueStatus(r.k);return '<button class="sw" data-act="adv-top" data-k="'+r.k+'" aria-pressed="'+on+'"><i class="sd '+v+'"></i><span><strong>'+(ueIsStar(r.k)?'★ ':'')+esc(r.t)+'</strong><small>'+(v?UEW[v]:'nicht besprochen')+(ueIsStar(r.k)?' · wichtig in dieser Lebensphase':'')+(on?' · heute Thema':'')+'</small></span></button>'}
  var h='';
  h+=gaps.length?'<div class="ueg">Hier gibt es Lücken</div>'+gaps.map(card).join(''):'<div class="note">Im Überblick sind noch keine Lücken eingetragen. Du kannst trotzdem ein Thema wählen.</div>';
  h+='<details class="adv"><summary>Weitere Themen</summary>'+rest.map(card).join('')+'</details>';
  if(!(adv.top||[]).length)h+='<p class="hint-t">Wähle bis zu drei Themen. Danach öffnen sich die passenden Rechner.</p>';
  return h;
}
function kdReport(b){
  var k=adv.kd||{},rows=[['Lebensphase',GR[k.gruppe]?GR[k.gruppe].name:''],['Alter',k.alter&&k.alter+' Jahre'],['Familienstand',k.fam],['Kinder',k.kinder],['Beruf',k.beruf],['Wohnen',k.wohnen]].filter(function(r){return r[1]});
  if(rows.length){b.push({t:'h',text:'Ihre Situation'});b.push({t:'kv',rows:rows,strong:-1})}
}
function einstiegReport(b){
  b.push({t:'h',text:'Unser Gespräch heute'});
  b.push({t:'p',text:'Wir haben gemeinsam angeschaut, wo Sie heute stehen. Was davon sinnvoll ist, entscheiden Sie.'});
  kdReport(b);
  var rows=ueRows().filter(function(r){return ueStatus(r.k)}).map(function(r){return [r.t,UEW[ueStatus(r.k)],bsLabel(bsOf(r.k))]});
  if(rows.length){b.push({t:'h',text:'Ihr Überblick'});b.push({t:'table',head:['Bereich','Situation','Stand'],w:[0.42,0.28,0.30],rows:rows})}
  var uo=ueOpen();if(uo.length){b.push({t:'h',text:'Noch zu klären'});b.push({t:'bul',items:uo.map(function(r){return r.t+': Dazu fehlt uns noch eine Information. Das ist keine Lücke.'})})}
  var tp=(adv.top||[]).map(function(k){return ueRow(k)}).filter(Boolean);
  if(tp.length){b.push({t:'h',text:'Unsere Schwerpunkte heute'});b.push({t:'bul',items:tp.map(function(r){return r.t})})}
  var nx=ueNext();
  if(nx.length){b.push({t:'h',text:'Für unseren nächsten Termin'});b.push({t:'bul',items:nx.map(function(r){return r.t})})}
}

function abschlussFields(){
  var g=adv.gesp||{};
  return '<label class="fl"><span>Das haben wir geklärt</span><textarea data-adv="gesp.klar" maxlength="600" placeholder="z. B. Kfz und Gebäude gewechselt, Kranken geprüft">'+esc(g.klar||'')+'</textarea></label>'+
   '<label class="fl"><span>Das nehmen Sie bis zum nächsten Mal mit</span><textarea data-adv="notiz" maxlength="600" placeholder="z. B. Verträge mitbringen, Vollmacht beim Notar klären">'+esc(adv.notiz)+'</textarea></label>'+
   '<label class="fl"><span>Nächster Termin</span><input type="text" data-adv="gesp.termin" maxlength="80" value="'+esc(g.termin||'')+'" placeholder="z. B. in zwei Wochen, Freitag 10 Uhr"></label>';
}


/* ================= Gesprächsleitfäden (Bibliothek) ================= */
/* e Einstieg, v Situation verstehen, b Bedeutung, m Merksatz, p eigene Prioritäten, z Zusammenfassung */
var LEIT={
 pflege:{t:'Pflege',e:'Was wäre Ihnen im Pflegefall besonders wichtig: die finanzielle Sicherheit, die Entlastung Ihrer Angehörigen oder möglichst viel Selbstbestimmung bei der Organisation Ihrer Pflege?',v:'Wer würde sich bei Ihnen im Pflegefall kümmern, und wie wäre das zu schaffen?',b:'Wenn Sie wählen könnten, wo Sie gepflegt werden: Was würde Ihnen die Entscheidung erleichtern?',m:'Es geht nicht nur darum, Pflege bezahlen zu können. Es geht auch darum, möglichst viele Entscheidungen über das eigene Leben selbst treffen zu können.',p:'Welche dieser Möglichkeiten passt am ehesten zu dem, was Ihnen wichtig ist?',z:'Sie möchten im Pflegefall selbst entscheiden können. Dafür klären wir, was die Pflegeversicherung zahlt, was bleibt und wer Sie vertritt.'},
 arbeit:{t:'Berufsunfähigkeit',e:'Wenn Sie aus gesundheitlichen Gründen längere Zeit nicht mehr arbeiten könnten: Was müsste finanziell weiterhin funktionieren, damit Ihr Leben möglichst stabil bleibt?',v:'Welche Ausgaben laufen auch ohne Einkommen weiter, zum Beispiel Miete, Kredit, Familie?',b:'Was würde sich für Sie ändern, wenn das Einkommen dauerhaft niedriger wäre?',m:'Ihr Einkommen finanziert nicht nur Ihren Lebensunterhalt. Es ermöglicht auch Ihre heutigen und zukünftigen Lebenspläne.',p:'Was davon möchten Sie auf jeden Fall absichern, und was könnten Sie notfalls anpassen?',z:'Wir haben gesehen, wie viel im Ernstfall fehlen würde und welche Ausgaben Ihnen am wichtigsten sind.'},
 unfall:{t:'Unfall',e:'Wenn ein Unfall Ihren Alltag dauerhaft verändern würde: Welche finanziellen Möglichkeiten möchten Sie sich erhalten, um Ihr Leben an die neue Situation anzupassen?',v:'Wie sind Sie heute bei Unfällen in der Freizeit abgesichert?',b:'Was würde sich zuerst ändern, zum Beispiel Wohnung, Auto, Beruf?',m:'Es geht nicht nur um die Folgen eines Unfalls, sondern auch um die finanziellen Möglichkeiten, danach den eigenen Alltag neu zu gestalten.',p:'Welche Leistungen sind Ihnen im Ernstfall am wichtigsten?',z:'Wir haben geklärt, wo die gesetzliche Absicherung endet und was Sie darüber hinaus wünschen.'},
 kranken:{t:'Krankenversicherung',e:'Welche zusätzlichen Leistungen wären Ihnen bei einer medizinischen Behandlung persönlich wichtig, und welche Kosten möchten Sie gegebenenfalls selbst übernehmen?',v:'Wie zufrieden sind Sie heute mit Arztwahl, Wartezeiten und Zahnleistungen?',b:'Was war bei Ihrer letzten Behandlung schwierig oder teuer?',m:'Entscheidend ist nicht, möglichst viele Leistungen zu versichern, sondern die Leistungen zu verstehen, die zu Ihren persönlichen Prioritäten passen.',p:'Welche zwei Leistungen sind Ihnen am wichtigsten?',z:'Wir haben Ihre Wünsche mit den Kosten verglichen. Was Sie ändern, entscheiden Sie.'},
 rente:{t:'Altersvorsorge',e:'Wie möchten Sie im Alter leben, und welches monatliche Einkommen würde Ihnen helfen, diesen Lebensstil zu finanzieren?',v:'Was haben Sie heute schon für später, und wie sicher fühlen Sie sich damit?',b:'Was wäre anders, wenn im Ruhestand jeden Monat etwa diese Summe fehlt?',m:'Bei der Altersvorsorge geht es nicht nur um eine Zahl auf dem Rentenbescheid, sondern darum, wie Sie später leben möchten.',p:'Was ist Ihnen im Ruhestand am wichtigsten: Reisen, Wohnen, Sicherheit, Unabhängigkeit?',z:'Wir haben Ihren Wunsch und Ihre erwartete Rente nebeneinander gelegt. Der Unterschied ist das, was wir gemeinsam betrachten.'},
 anlage:{t:'Geld anlegen',e:'Wofür möchten Sie Geld zur Seite legen, und bis wann soll es verfügbar sein?',v:'Wie viel Schwankung können Sie aushalten, ohne unruhig zu werden?',b:'Was würde ein Verlust auf dem Papier für Sie bedeuten?',m:'Eine gute Geldanlage passt zu Ihrem Ziel und zu Ihrer Ruhe, nicht zur Rendite der anderen.',p:'Ist Ihnen Flexibilität, Steuer oder Sicherheit am wichtigsten?',z:'Wir haben Ziel, Zeitraum und Risiko zusammengebracht. Rendite ist nicht garantiert.'},
 haftpflicht:{t:'Privathaftpflicht',e:'Welche finanziellen Folgen könnte es für Sie haben, wenn Sie versehentlich einen Schaden verursachen, für den Sie haften müssen?',v:'Wer gehört in Ihrem Haushalt alles dazu?',b:'Was bedeutet ein großer Schaden für Ihre Ersparnisse?',m:'Ein kleiner Fehler kann große finanzielle Folgen haben. Entscheidend ist, welche Risiken tatsächlich abgesichert sind.',p:'Welche Situationen sind für Sie am wahrscheinlichsten?',z:'Wir haben geprüft, ob Ihre Haftpflicht zu Ihrer Lebenssituation passt.'},
 hausrat:{t:'Hausrat',e:'Wenn Sie Ihren gesamten Hausrat nach einem größeren Schaden ersetzen müssten: Welche Summe würde dafür realistisch benötigt?',v:'Welche Dinge sind Ihnen besonders wichtig, zum Beispiel Fahrräder, Technik, Schmuck?',b:'Was würde es bedeuten, alles auf einmal neu zu kaufen?',m:'Entscheidend ist nicht nur, was Ihre Einrichtung heute gekostet hat, sondern was eine Wiederbeschaffung unter den vereinbarten Bedingungen kosten würde.',p:'Was soll auf jeden Fall abgedeckt sein?',z:'Wir haben Wohnfläche, Summe und Leistungen verglichen.'},
 gebaeude:{t:'Wohngebäude',e:'Wenn Ihr Haus durch Sturm, Feuer oder Wasser beschädigt würde: Wer würde den Wiederaufbau bezahlen, und was wäre dafür nötig?',v:'Wann wurde der Versicherungswert zuletzt geprüft?',b:'Was würde ein größerer Schaden für Ihre Familie bedeuten?',m:'Ihr Haus ist oft der größte Wert. Entscheidend ist, dass die Absicherung zum heutigen Baupreis passt.',p:'Welche Risiken sind für Ihre Lage wichtig, zum Beispiel Starkregen oder Elementar?',z:'Wir haben Wert und Leistungen Ihrer Gebäudeversicherung abgeglichen.'},
 kfz:{t:'Kfz',e:'Wie wichtig ist Ihnen das Auto im Alltag, und was würde ein Totalschaden für Sie bedeuten?',v:'Wie viel fahren Sie, und wer fährt noch?',b:'Was wäre bei einem Schaden für Sie am ärgerlichsten?',m:'Ein guter Autoschutz bezahlt im Schaden fair und ist im Beitrag nachvollziehbar.',p:'Was ist Ihnen wichtiger: ein niedriger Beitrag oder mehr Leistung?',z:'Wir haben Leistung und Beitrag Ihres Kfz-Schutzes nebeneinander gelegt.'},
 rechtsschutz:{t:'Rechtsschutz',e:'In welchen Bereichen könnte für Sie ein Rechtsstreit realistisch sein, zum Beispiel Beruf, Wohnen, Verkehr?',v:'Haben Sie schon einmal einen Streit gehabt, bei dem Kosten ein Thema waren?',b:'Würden Sie wegen der Kosten auf Ihr Recht verzichten?',m:'Rechtsschutz ist die Möglichkeit, sein Recht durchzusetzen, ohne wegen der Kosten zu zögern.',p:'Welche Bereiche wollen Sie auf jeden Fall abgedeckt haben?',z:'Wir haben geklärt, welche Bereiche Ihnen wichtig sind und welche nicht.'},
 vollmacht:{t:'Vollmachten und Verfügungen',e:'Wer soll Ihre Wünsche vertreten können, wenn Sie wichtige Entscheidungen vorübergehend oder dauerhaft nicht selbst treffen können?',v:'Gibt es schon eine Vorsorgevollmacht oder Patientenverfügung, und weiß die Person davon?',b:'Was würde ohne Vollmacht passieren, wenn Sie nicht mehr entscheiden könnten?',m:'Vorsorge bedeutet auch, festzulegen, wie Ihre persönlichen Wünsche berücksichtigt werden sollen, wenn Sie selbst nicht entscheiden können.',p:'Wem vertrauen Sie diese Aufgabe an?',z:'Wir haben gesehen, was geregelt ist. Eine rechtlich geprüfte Gestaltung machen Notar oder Rechtsanwalt.'},
 testament:{t:'Testament und Nachlass',e:'Haben Sie sich schon Gedanken darüber gemacht, wie Ihr Vermögen später verteilt werden soll und welche Personen Sie dabei besonders berücksichtigen möchten?',v:'Wer würde ohne Testament erben, und passt das zu Ihrem Willen?',b:'Was soll bei Ihrer Familie nach Ihrem Tod unbedingt geklärt sein?',m:'Eine frühzeitige Nachlassplanung hilft dabei, den eigenen Willen klar zu formulieren und mögliche Unklarheiten zu reduzieren.',p:'Wer soll was bekommen, und was soll gar nicht passieren?',z:'Wir haben Ihre Wünsche und die gesetzliche Erbfolge nebeneinander gelegt. Die Gestaltung klären Sie mit Notar oder Rechtsanwalt.'},
 tod:{t:'Hinterbliebene',e:'Wenn Sie als Verdiener ausfielen: Was müsste für Ihre Familie weiterlaufen, damit der Alltag stabil bleibt?',v:'Wer wäre finanziell von Ihnen abhängig, und für wie lange?',b:'Wie lange könnte Ihre Familie ohne Ihr Einkommen die Wohnung und das Leben halten?',m:'Absicherung heißt, dass die Menschen, die Ihnen wichtig sind, ihr Zuhause behalten können.',p:'Was soll für Ihre Familie auf jeden Fall bleiben?',z:'Wir haben geklärt, was im Ernstfall weiterlaufen muss und wie groß der Unterschied zu heute ist.'}
};
function leitHtml(keys){
  var ks=(keys||[]).filter(function(k){return LEIT[k]});if(!ks.length)return '';
  function one(k){var L=LEIT[k];return '<div class="leit"><b>'+esc(L.t)+'</b><ol><li><i>Einstieg:</i> '+esc(L.e)+'</li><li><i>Situation verstehen:</i> '+esc(L.v)+'</li><li><i>Bedeutung:</i> '+esc(L.b)+'</li><li><i>Merksatz:</i> „'+esc(L.m)+'“</li><li><i>Eigene Prioritäten:</i> '+esc(L.p)+'</li><li><i>Zusammenfassung:</i> '+esc(L.z)+'</li></ol></div>'}
  return '<details class="leitd"><summary>Gesprächsleitfaden'+(ks.length>1?'e':'')+': Fragen und Merksatz</summary>'+ks.map(one).join('')+'</details>';
}


/* ================= Einkommen absichern (Berufsunfähigkeit) ================= */
function buCalc(){
  var n=nv(adv.al.gehalt),f=nv(adv.bu.fix),e=nv(adv.bu.emr),h=nv(adv.bu.has);
  var o={n:n,f:f,e:isNaN(e)?0:e,h:isNaN(h)?0:h,eIn:!isNaN(e),hIn:!isNaN(h)};
  o.v=o.e+o.h;o.lueN=isNaN(n)?NaN:Math.max(0,n-o.v);o.lueF=isNaN(f)?NaN:Math.max(0,f-o.v);
  return o;
}
function buForm(){
  return '<div class="grid2">'+fld('al.gehalt','Netto-Einkommen heute',{unit:'€ / Monat'})+fld('bu.fix','Ausgaben, die weiterlaufen müssen',{unit:'€ / Monat',hint:'Miete, Kredit, Versicherungen, Lebenshaltung, Familie.'})+'</div><div class="grid2">'+fld('bu.emr','Gesetzliche Erwerbsminderungsrente',{unit:'€ / Monat',hint:'Steht in der Renteninformation (volle Erwerbsminderung). Leer lassen, wenn unbekannt.'})+fld('bu.has','Bestehende BU-Rente (privat oder Betrieb)',{unit:'€ / Monat',hint:'Nur eintragen, was im Vertrag steht.'})+'</div>';
}
function buLive(){
  var o=buCalc();
  if(isNaN(o.n)&&isNaN(o.f))return '<div class="note">Tragen Sie das Netto-Einkommen oder die Ausgaben ein, dann sehen wir den Unterschied.</div>';
  var h='<div class="stats">';
  if(!isNaN(o.n))h+=stat('Netto-Einkommen heute',eur(o.n),'pro Monat');
  h+=stat('Im Leistungsfall verfügbar',eur(o.v),o.eIn||o.hIn?'pro Monat':'noch nichts eingetragen');
  if(!isNaN(o.lueN))h+=stat('Unterschied zum Einkommen',eur(o.lueN),'pro Monat',o.lueN>0?'bad':'good');
  if(!isNaN(o.lueF))h+=stat('Fehlt für die Ausgaben',eur(o.lueF),'pro Monat',o.lueF>0?'bad':'good');
  h+='</div>';
  if(!o.eIn)h+='<div class="note">Die gesetzliche Erwerbsminderungsrente ist noch nicht eingetragen. Ohne diese Zahl ist der Unterschied nicht aussagekräftig.</div>';
  return h+'<div class="chartbox" data-c="bu"></div><p class="hint-t">Beispielrechnung mit den Angaben des Kunden. Maßgeblich sind Renteninformation und Versicherungsbedingungen.</p>';
}
function buSlides(){
  var S=[];
  S.push({title:'Was müsste weiterlaufen?',text:Q('Wenn Sie aus gesundheitlichen Gründen längere Zeit nicht mehr arbeiten könnten: Was müsste finanziell weiterhin funktionieren, damit Ihr Leben möglichst stabil bleibt?')+TP('Gemeint sind die Ausgaben, die auch ohne Arbeit weiterlaufen.'),form:buForm,live:buLive,
   tip:'Zuerst die Ausgaben des Kunden erfragen, nicht die Versicherungssumme. Er nennt die Zahl selbst. Merksatz: Ihr Einkommen finanziert nicht nur Ihren Lebensunterhalt, es ermöglicht auch Ihre Lebenspläne.',leit:['arbeit'],area:'einkommen'});
  S.push({title:'Was zahlt der Staat bei Erwerbsminderung?',text:BUL(['Wer nach 1960 geboren ist, hat <b>keine gesetzliche Berufsunfähigkeitsrente</b> mehr.','Es gibt nur die <b>Erwerbsminderungsrente</b>: voll, wenn Sie in <b>irgendeinem</b> Beruf weniger als 3 Stunden täglich arbeiten können, halb bei 3 bis unter 6 Stunden.','Die Höhe steht in Ihrer <b>Renteninformation</b>. Sie liegt meist deutlich unter dem früheren Einkommen.'])+Q('Haben Sie Ihre Renteninformation dabei? Was steht dort bei Erwerbsminderung?'),form:buForm,live:buLive,
   tip:'Keine Zahl nennen, nur aus der Renteninformation ablesen lassen. Unterschied Berufsunfähigkeit (privat, an den Beruf gebunden) und Erwerbsminderung (gesetzlich, jede Tätigkeit) erklären.',area:'einkommen'});
  S.push({title:'Ihr Ergebnis: Einkommen',text:Q('Ihr Einkommen finanziert nicht nur Ihren Lebensunterhalt. Es ermöglicht auch Ihre heutigen und zukünftigen Lebenspläne.')+TP('Was davon möchten Sie auf jeden Fall absichern, und was könnten Sie notfalls anpassen?'),live:buLive,
   tip:'Ohne Druck: Der Kunde entscheidet, was ihm wichtig ist. Gesundheitsfragen und Beitrag hängen vom Beruf und Gesundheitszustand ab. Folgetermin vorschlagen.',area:'einkommen'});
  S.forEach(function(x){x.ill='bu'});
  return S;
}
function chartBu(){
  var o=buCalc(),W=1100,rows=[];
  if(!isNaN(o.n))rows.push({t:'Netto-Einkommen heute',segs:[{v:o.n,c:'#2C7A57',l:eur(o.n)}]});
  if(!isNaN(o.f))rows.push({t:'Ausgaben, die weiterlaufen',segs:[{v:o.f,c:'#5B6773',l:eur(o.f)}]});
  var sg=[];if(o.e>0)sg.push({v:o.e,c:'#7B8FA6',l:'gesetzlich '+eur(o.e)});if(o.h>0)sg.push({v:o.h,c:'#0A4A9C',l:'BU-Rente '+eur(o.h)});
  rows.push({t:'Im Leistungsfall verfügbar',segs:sg.length?sg:[{v:0,c:'#fff',l:'noch nichts eingetragen'}]});
  var H=130+rows.length*130,k=cv(W,H),x=k.x,L=60,pw=W-120;
  var mx=niceMax(Math.max.apply(null,rows.map(function(r){return r.segs.reduce(function(a,g){return a+g.v},0)}).concat([1]))*1.1);
  x.fillStyle='#16202A';x.font='bold 30px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Einkommen heute und im Leistungsfall',L,44);
  x.fillStyle='#5B6773';x.font='22px '+FONT;x.fillText('Beispielrechnung in Euro pro Monat',L,74);
  var y=110;
  rows.forEach(function(r){
    x.fillStyle='#16202A';x.font='bold 26px '+FONT;x.textBaseline='alphabetic';x.textAlign='left';x.fillText(r.t,L,y+22);
    var cx=L,tot=0;r.segs.forEach(function(g){var w=pw*g.v/mx;if(w>0){rrect(x,cx,y+34,w,48,6,g.c);x.fillStyle='#fff';x.font='bold 21px '+FONT;x.textBaseline='middle';x.textAlign='center';if(w>200)x.fillText(g.l,cx+w/2,y+58);cx+=w;tot+=g.v}});
    x.fillStyle='#16202A';x.font='bold 24px '+FONT;x.textAlign='left';x.textBaseline='middle';x.fillText(r.segs[0].v===0&&r.segs.length===1?r.segs[0].l:eur(tot),cx+12,y+58);
    y+=130;
  });
  if(!isNaN(o.lueN)&&o.lueN>0){x.fillStyle='#B3362D';x.font='bold 26px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Unterschied zum Einkommen: '+eur(o.lueN)+' pro Monat',L,H-18)}
  return k.c;
}
function buReport(b){
  var o=buCalc();
  b.push({t:'h',text:'Einkommen: Was wäre, wenn Sie nicht arbeiten könnten?'});
  b.push({t:'p',text:'Ihr Einkommen finanziert nicht nur Ihren Lebensunterhalt. Es ermöglicht auch Ihre heutigen und zukünftigen Lebenspläne.'});
  var rows=[];if(!isNaN(o.n))rows.push(['Netto-Einkommen heute',eur(o.n)]);if(!isNaN(o.f))rows.push(['Ausgaben, die weiterlaufen',eur(o.f)]);rows.push(['Gesetzliche Erwerbsminderungsrente',o.eIn?eur(o.e):'nicht erfasst']);if(o.hIn)rows.push(['Bestehende BU-Rente',eur(o.h)]);rows.push(['Im Leistungsfall verfügbar',eur(o.v)]);if(!isNaN(o.lueN))rows.push(['Unterschied zum Einkommen',eur(o.lueN)]);if(!isNaN(o.lueF))rows.push(['Fehlt für die Ausgaben',eur(o.lueF)]);
  b.push({t:'table',head:['Pro Monat','Betrag'],w:[0.68,0.32],rows:rows});
  var cc=chartBu();b.push({t:'img',src:cc.toDataURL('image/png'),ratio:cc.width/cc.height,w:150});
  b.push({t:'small',text:'Beispielrechnung nach Ihren Angaben. Die Erwerbsminderungsrente steht in Ihrer Renteninformation. Maßgeblich sind Renteninformation und Versicherungsbedingungen.'});
}

/* ================= Pflege-Beratung ================= */
/* Sechs Schritte: Situation, Ziele, Risiken, Lücke, Möglichkeiten, Entscheidung.
   Alle Zahlen kommen aus REGEL.pflege (mit Quelle) oder aus Eingaben im Gespräch. */
var PFPRIO=[['zuhause','Möglichst lange zu Hause leben'],['partner','Den Partner finanziell schützen'],['angeh','Angehörige möglichst wenig belasten'],['selbst','Finanziell selbstständig bleiben'],['wahl','Die Pflegeform selbst wählen können']];
var PFSATZ={zuhause:'Es geht darum, so lange wie möglich dort zu leben, wo Sie sich zu Hause fühlen.',partner:'Es geht darum, dass Ihr Partner nicht für Ihre Pflege seine eigene Zukunft aufbrauchen muss.',angeh:'Es geht darum, dass Ihre Familie Sie begleiten kann, ohne an die eigenen Grenzen zu kommen.',selbst:'Es geht darum, über das eigene Geld auch im Pflegefall selbst zu entscheiden.',wahl:'Es geht darum, dass Sie entscheiden, wo und wie Sie gepflegt werden, und nicht allein das, was gerade bezahlbar ist.'};
var PFSTEPS=[['lage','Situation verstehen'],['ziele','Ziele und Prioritäten'],['risiko','Risiken und Folgen'],['luecke','Leistungen und Lücke'],['optionen','Möglichkeiten vergleichen'],['entscheid','Entscheidung festhalten']];
var PFLAGE={angeh:['Angehörige in der Nähe, die helfen könnten',[['ja','Ja'],['teil','Eingeschränkt'],['nein','Nein']]],wohn:['Wohnung für Pflege geeignet (Treppen, Bad)',[['ja','Ja, weitgehend'],['teil','Mit Umbau'],['nein','Eher nicht'],['unklar','Unklar']]],erf:['Pflege schon in der Familie erlebt',[['ja','Ja'],['nein','Nein']]]};
var PFORT=[['zuhause','Zu Hause'],['betreut','Betreutes Wohnen'],['heim','Pflegeheim'],['offen','Noch offen']];
var PFGRAD=[[1,'Geringe Beeinträchtigung der Selbstständigkeit'],[2,'Erhebliche Beeinträchtigung'],[3,'Schwere Beeinträchtigung'],[4,'Schwerste Beeinträchtigung'],[5,'Schwerste Beeinträchtigung mit besonderen Anforderungen an die pflegerische Versorgung']];
var PFOPT=[
 ['eigen','Eigene Mittel','Rente und Vermögen',
  ['Keine zusätzlichen Beiträge.','Rente und Vermögen tragen den Eigenanteil. Das Vermögen nimmt ab.','Ausreichend Einkommen oder Vermögen.','Was verbraucht wird, fehlt später dem Partner oder den Erben.']],
 ['angeh','Pflege durch Angehörige','mit Pflegegeld und Entlastung',
  ['Keine Beiträge.','Die Pflegekasse zahlt Pflegegeld. Pflegedienst, Tages- und Verhinderungspflege können entlasten.','Angehörige, die Zeit haben und in der Nähe wohnen.','Pflege kostet die Pflegenden viel Zeit und Kraft, oft über Jahre.']],
 ['privat','Private Pflegezusatzversicherung','zum Beispiel Pflegemonatsgeld',
  ['Laufender Beitrag. Er hängt vom Eintrittsalter und vom Tarif ab.','Leistung im vereinbarten Umfang, je nach Pflegegrad und Versicherungsbedingungen.','In der Regel eine Gesundheitsprüfung beim Abschluss. Die staatlich geförderte Variante (Pflege-Bahr) hat keine Gesundheitsprüfung, dafür eine Wartezeit.','Beitragsanpassungen sind je nach Tarifart möglich. Gezahlt wird nur, was vereinbart ist.']],
 ['komb','Kombination','mehrere Wege zusammen',
  ['Je nach Baustein.','Pflegekasse, eigene Mittel, Angehörige und Versicherung ergänzen sich.','Klare Absprache, wer was übernimmt.','Etwas mehr Planung, dafür weniger Abhängigkeit von einem einzelnen Weg.']]
];
var PFKRIT=['Was es heute kostet','Was im Pflegefall passiert','Voraussetzung','Zu bedenken'];
var PFDEC=[['pruefen','Weiter prüfen'],['spaeter','Später besprechen'],['nein','Nicht gewünscht']];
var PFOFFEN=[['vertr','Bestehende Verträge auf Pflegeleistungen prüfen'],['heim','Heimkosten in der eigenen Region erfragen'],['vollm','Vorsorgevollmacht und Betreuungsverfügung klären'],['fam','Mit Angehörigen über Wünsche und Aufgaben sprechen'],['gesund','Gesundheitsfragen für einen möglichen Antrag klären'],['bed','Leistung und Voraussetzungen eines Angebots in den Bedingungen prüfen']];
function pfObj(){var p=adv.pf;if(!p.lage)p.lage={};if(!p.opt)p.opt={};if(!p.offen)p.offen=[];if(p.fragen==null)p.fragen='';if(p.next==null)p.next='';if(p.ort==null)p.ort='';if(p.bestand==null)p.bestand='';return p}
function pfG(){var g=parseInt(adv.pf.pg,10);return g>=1&&g<=5?g:3}
function pfLbl(list,v){var o=list.filter(function(x){return x[0]===v})[0];return o?o[1]:''}
/* Heim: Eigenanteil je Aufenthaltsjahr. REGEL.pflege.eee ist der pflegebedingte Anteil im ersten Jahr,
   also schon um den Leistungszuschlag von 15 % gemindert. Daraus folgt der volle Anteil vor Zuschlag. */
function pfHeimJahre(){
  var P=REGEL.pflege,voll=P.eee/(1-P.zuschlag[0]/100),fix=P.uv+P.invest;
  return P.zuschlag.map(function(z,i){return {jahr:i+1,zuschlag:voll*z/100,eigen:voll*(1-z/100)+fix}});
}
function pfCalc(){
  var P=REGEL.pflege,p=pfObj(),g=pfG(),o={g:g,geld:P.geld[g],sach:P.sach[g],heimK:P.heim[g]};
  var kz=nv(p.kost),he=nv(p.heim),r=nv(adv.vp.rente),v=nv(adv.vp.verm),mh=nv(p.mgH),ms=nv(p.mgS),be=nv(p.bestand);
  o.kz=kz;o.r=r;o.v=v;o.best=isNaN(be)?0:Math.max(0,be);o.mgH=isNaN(mh)?0:mh;o.mgS=isNaN(ms)?0:ms;
  o.tarif=o.mgH>0||o.mgS>0;o.ok=!!p.bed;
  /* Zu Hause mit Pflegedienst: Kosten minus Sachleistung (höchstens die Kosten) */
  o.sachGenutzt=isNaN(kz)?NaN:Math.min(kz,o.sach);
  o.ebZ=isNaN(kz)?NaN:Math.max(0,kz-o.sach);
  o.ebZB=isNaN(o.ebZ)?NaN:Math.max(0,o.ebZ-o.best);
  o.ebZT=isNaN(o.ebZB)?NaN:Math.max(0,o.ebZB-o.mgH);
  /* Pflegeheim: nur ab Pflegegrad 2 aussagekräftig (Eigenanteil gilt für Pflegegrad 2 bis 5 gleich) */
  o.heimOk=g>=2;o.heimDef=isNaN(he);o.jahre=pfHeimJahre();
  if(o.heimDef){var j1=o.jahre[0];o.zuschlag=j1.zuschlag;o.ebH=j1.eigen;o.heimGes=o.heimK+o.ebH+o.zuschlag}
  else{o.zuschlag=NaN;o.ebH=he;o.heimGes=NaN}
  o.ebHB=Math.max(0,o.ebH-o.best);o.ebHT=Math.max(0,o.ebHB-o.mgS);
  o.lueH=isNaN(r)?NaN:Math.max(0,o.ebH-r-o.best);o.lueHT=isNaN(r)?NaN:Math.max(0,o.ebH-r-o.best-o.mgS);
  o.monH=pfReichweite(o,0);o.monHT=o.mgS>0?pfReichweite(o,o.mgS):null;
  return o;
}
/* Wie viele Monate reicht das Vermögen im Heim? Rechnet mit dem sinkenden Eigenanteil je Jahr,
   wenn der Bundesdurchschnitt verwendet wird, sonst mit dem eingetragenen festen Betrag. */
function pfReichweite(o,extra){
  if(!o.heimOk||isNaN(o.r)||!(o.v>=0))return null;
  var rest=o.v,m=0;
  while(m<600){
    var e=o.heimDef?o.jahre[Math.min(3,Math.floor(m/12))].eigen:o.ebH,luecke=e-o.r-o.best-extra;
    if(luecke<=0)return m===0?null:Infinity;
    if(rest<luecke)return m;
    rest-=luecke;m++;
  }
  return Infinity;
}
function pfReichTxt(m){if(m===Infinity)return 'auf Dauer, weil die Lücke mit den Jahren kleiner wird';if(m===0)return 'nicht einmal einen Monat';return 'etwa '+pfMonTxt(m)}
function pfMonTxt(m){if(m===null)return '';if(m===Infinity)return 'dauerhaft';var j=Math.floor(m/12),r=m%12;return (j?j+(j===1?' Jahr':' Jahre'):'')+(j&&r?' und ':'')+(r||!j?r+(r===1?' Monat':' Monate'):'')}
/* Kostenbrücke: von den Kosten zum Betrag, der monatlich fehlt. Jede Zeile nennt ihre Herkunft. */
function pfBruecke(art,mitAngebot){
  var o=pfCalc(),R=[];
  if(art==='heim'){
    if(!o.heimOk)return null;
    if(o.heimDef){
      R.push({l:'Kosten im Pflegeheim',v:o.heimGes,t:'start',q:'Leistung der Kasse plus Eigenanteil, Bundesdurchschnitt'});
      R.push({l:'Pflegekasse (Pflegegrad '+o.g+')',v:-o.heimK,t:'minus',q:'SGB XI § 43'});
      R.push({l:'Leistungszuschlag im ersten Jahr (15 %)',v:-o.zuschlag,t:'minus',q:'SGB XI § 43c'});
    }else R.push({l:'Eigenanteil laut Angabe',v:o.ebH,t:'start',q:'eingetragen'});
    if(o.heimDef)R.push({l:'Eigenanteil im ersten Jahr',v:o.ebH,t:'sub',q:'vdek, Stand 1. Januar 2026'});
    if(!isNaN(o.r))R.push({l:'Rente oder Einkommen',v:-o.r,t:'minus',q:'Angabe im Gespräch'});
  }else{
    if(isNaN(o.kz))return null;
    R.push({l:'Kosten der Pflege zu Hause',v:o.kz,t:'start',q:'Schätzung im Gespräch'});
    R.push({l:'Pflegekasse, Pflegedienst (Pflegegrad '+o.g+')',v:-o.sachGenutzt,t:'minus',q:'SGB XI § 36'});
  }
  if(o.best>0)R.push({l:'Bestehende private Pflegeleistung',v:-o.best,t:'minus',q:'laut Vertrag'});
  var ang=art==='heim'?o.mgS:o.mgH;
  if(mitAngebot&&ang>0)R.push({l:'Leistung aus dem Angebot',v:-ang,t:'minus',q:o.ok?'laut Bedingungen geprüft':'noch zu prüfen'});
  var sum=0;R.forEach(function(x){if(x.t!=='sub')sum+=x.v});
  R.push({l:art==='heim'?(isNaN(o.r)?'Bleibt pro Monat zu zahlen':'Fehlt pro Monat'):'Bleibt zusätzlich zu den Lebenshaltungskosten',v:Math.max(0,sum),t:'end',q:sum<=0?'gedeckt':'Ergebnis'});
  return R;
}
function pfBrueckeTab(R){
  return '<table class="ds-calc"><tbody>'+R.map(function(x){var cls=x.t==='end'?' class="end"':x.t==='sub'?' class="sub"':'';return '<tr'+cls+'><th>'+esc(x.l)+'<small>'+esc(x.q)+'</small></th><td>'+(x.t==='minus'?'− '+eur(-x.v):eur(x.v))+'</td></tr>'}).join('')+'</tbody></table>';
}
function chartPfBruecke(art,mitAngebot){
  var R=pfBruecke(art,mitAngebot);if(!R)return null;
  var W=760,rowH=70,T=104,H=T+R.length*rowH+24,k=cv(W,H),x=k.x,L=300,Rr=24,pw=W-L-Rr;
  var mx=niceMax(Math.max.apply(null,R.map(function(z){return Math.abs(z.v)}).concat([1]))*1.05);
  x.fillStyle='#16202A';x.font='bold 30px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';
  x.fillText(art==='heim'?'Pflegeheim: Was bleibt pro Monat?':'Zu Hause: Was bleibt pro Monat?',24,44);
  x.fillStyle='#5B6773';x.font='20px '+FONT;x.fillText('Beispielrechnung in Euro pro Monat, Pflegegrad '+pfG(),24,76);
  var run=0;
  R.forEach(function(z,i){
    var y=T+i*rowH,a,b,col;
    if(z.t==='start'){a=0;b=z.v;run=z.v;col='#25507A'}
    else if(z.t==='sub'){a=0;b=z.v;col='#7B8FA6'}
    else if(z.t==='minus'){a=Math.max(0,run+z.v);b=run;run=run+z.v;col='#2C7A57'}
    else{a=0;b=z.v;col=z.v>0?'#B3362D':'#2C7A57'}
    x.fillStyle=z.t==='end'?'#16202A':'#27384F';x.font=(z.t==='end'||z.t==='start'?'bold ':'')+'22px '+FONT;x.textAlign='left';x.textBaseline='middle';
    wrapTxt(x,z.l,24,y+rowH/2-(x.measureText(z.l).width>L-40?12:0),L-40,24,'left');
    var x0=L+pw*a/mx,w=Math.max(3,pw*(b-a)/mx);
    rrect(x,x0,y+14,w,rowH-28,6,col);
    var lab=(z.t==='minus'?'− ':'')+eur(Math.abs(z.v));
    x.font='bold 22px '+FONT;x.textBaseline='middle';
    if(w>150){x.fillStyle='#fff';x.textAlign='right';x.fillText(lab,x0+w-12,y+rowH/2)}
    else{x.fillStyle='#16202A';x.textAlign='left';x.fillText(lab,Math.min(x0+w+10,W-120),y+rowH/2)}
    if(i<R.length-1&&z.t!=='end'){x.strokeStyle='#CBD3DB';x.lineWidth=2;x.setLineDash([5,5]);var xr=L+pw*Math.max(0,run)/mx;x.beginPath();x.moveTo(xr,y+rowH-14);x.lineTo(xr,y+rowH+14);x.stroke();x.setLineDash([])}
  });
  return k.c;
}
function chartPfJahre(){
  var J=pfHeimJahre(),W=760,H=420,k=cv(W,H),x=k.x,L=80,R=20,T=110,B=80,pw=W-L-R,ph=H-T-B;
  var mx=niceMax(J[0].eigen*1.1),gap=pw/J.length,bw=Math.min(170,gap*0.55);
  x.fillStyle='#16202A';x.font='bold 30px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Eigenanteil im Heim nach Aufenthaltsdauer',24,44);
  x.fillStyle='#5B6773';x.font='21px '+FONT;x.font='19px '+FONT;x.fillText('Bundesdurchschnitt pro Monat. Der Zuschlag der Kasse steigt jährlich.',24,76);
  x.textBaseline='middle';
  for(var i=0;i<=4;i++){var yv=mx*i/4,y=T+ph-ph*i/4;x.strokeStyle='#E3E8ED';x.lineWidth=1;x.beginPath();x.moveTo(L,y);x.lineTo(W-R,y);x.stroke();x.fillStyle='#5B6773';x.textAlign='right';x.font='19px '+FONT;x.fillText(nf.format(yv),L-12,y)}
  J.forEach(function(j,i){
    var cx=L+gap*(i+0.5),h=j.eigen/mx*ph;rrect(x,cx-bw/2,T+ph-h,bw,h,6,i===0?'#B3362D':'#7B8FA6');
    x.fillStyle='#16202A';x.font='bold 22px '+FONT;x.textAlign='center';x.fillText(eur(j.eigen),cx,T+ph-h-18);
    x.font='20px '+FONT;x.fillText(i<3?j.jahr+'. Jahr':'ab '+j.jahr+'. Jahr',cx,T+ph+24);
    x.fillStyle='#5B6773';x.font='17px '+FONT;x.fillText('Zuschlag '+REGEL.pflege.zuschlag[i]+' %',cx,T+ph+50);
  });
  return k.c;
}
/* ---- Bausteine für Formular und Gesprächsmodus ---- */
function pfPath(cur){
  return '<ol class="ds-path" aria-label="Schritte der Pflegeberatung">'+PFSTEPS.map(function(s,i){return '<li class="'+(i===cur?'on':i<cur?'done':'')+'"'+(i===cur?' aria-current="step"':'')+'><b>'+(i+1)+'</b><span>'+esc(s[1])+'</span></li>'}).join('')+'</ol>';
}
function pfChoice(key,list,cur){return '<div class="lwc">'+list.map(function(o){return '<button class="chip" data-act="adv-pfset" data-k="'+key+'" data-v="'+o[0]+'" aria-pressed="'+(cur===o[0])+'">'+esc(o[1])+'</button>'}).join('')+'</div>'}
function pfLageForm(){
  var p=pfObj(),h='<div class="grid2">'+fld('kd.alter','Alter',{unit:'Jahre'})+selHtml('kd.fam','Familienstand',['','ledig','verheiratet oder Partnerschaft','getrennt oder geschieden','verwitwet'])+'</div>';
  h+=selHtml('kd.wohnen','Wohnen',['','Miete','Eigentum','bei Angehörigen']);
  Object.keys(PFLAGE).forEach(function(k){h+='<div class="ds-q"><span>'+esc(PFLAGE[k][0])+'</span>'+pfChoice('lage.'+k,PFLAGE[k][1],p.lage[k]||'')+'</div>'});
  return h+'<p class="hint-t">Keine Gesundheitsangaben und keine Namen erfassen. Es geht um die Lebensumstände, nicht um Diagnosen.</p>';
}
function pfLageLive(){
  var p=pfObj(),L=p.lage,k=adv.kd||{},f=[],q=[];
  if(k.alter)f.push(['Alter',k.alter+' Jahre']);if(k.fam)f.push(['Familienstand',k.fam]);if(k.wohnen)f.push(['Wohnen',k.wohnen]);
  Object.keys(PFLAGE).forEach(function(x){if(L[x])f.push([PFLAGE[x][0],pfLbl(PFLAGE[x][1],L[x])])});
  if(!f.length)return '<div class="ds-callout">Noch nichts erfasst. Die Angaben helfen später, die Möglichkeiten realistisch einzuschätzen.</div>';
  if(L.angeh==='nein')q.push('Wer würde die Pflege organisieren, wenn niemand in der Nähe ist?');
  if(L.angeh==='teil')q.push('Wie viel Zeit hätten die Angehörigen wirklich, und für wie lange?');
  if(L.wohn==='nein'||L.wohn==='teil')q.push('Was müsste an der Wohnung geändert werden, damit Pflege zu Hause geht?');
  if(/verheiratet/.test(k.fam||''))q.push('Was bräuchte der Partner, um selbst gut weiterzuleben?');
  var h='<div class="ds-card"><div class="ds-cap">Das wissen wir</div>'+pfFacts(f)+'</div>';
  if(q.length)h+='<div class="ds-card"><div class="ds-cap">Daraus ergeben sich Fragen</div><ul class="ds-list">'+q.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul></div>';
  return h;
}
function pfFacts(rows){return '<dl class="ds-facts">'+rows.map(function(r){return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>'}).join('')+'</dl>'}
function pfZieleForm(){
  var p=pfObj();
  return '<div class="ds-q"><span>Was wäre Ihnen wichtig? In der Reihenfolge antippen, die für Sie gilt.</span><div class="lwc">'+PFPRIO.map(function(o){var i=p.prio.indexOf(o[0]);return '<button class="chip ds-rank" data-act="adv-pfp" data-k="'+o[0]+'" aria-pressed="'+(i>=0)+'">'+(i>=0?'<i>'+(i+1)+'</i>':'')+esc(o[1])+'</button>'}).join('')+'</div></div>'+
    '<div class="ds-q"><span>Wo möchten Sie am liebsten gepflegt werden?</span>'+pfChoice('ort',PFORT,p.ort)+'</div>';
}
function pfPrioSatz(){
  var p=pfObj(),pr=p.prio;if(!pr.length&&!p.ort)return '<div class="ds-callout">Noch keine Priorität gewählt. Die Reihenfolge entscheidet der Kunde.</div>';
  var h='<div class="ds-card"><div class="ds-cap">Ihre Prioritäten</div>';
  if(pr.length)h+='<ol class="ds-rank-list">'+pr.map(function(k){return '<li>'+esc(pfLbl(PFPRIO,k))+'</li>'}).join('')+'</ol><p class="ds-quote">'+esc(PFSATZ[pr[0]])+'</p>';
  if(p.ort)h+=pfFacts([['Gewünschter Ort der Pflege',pfLbl(PFORT,p.ort)]]);
  return h+'</div>';
}
function pfRisikoText(){
  var P=REGEL.pflege;
  return TP('In Deutschland gelten knapp <b>'+P.stat.gesamt+' Millionen Menschen</b> als pflegebedürftig ('+P.stat.jahr+'). Die meisten werden zu Hause versorgt, oft von Angehörigen.')+
    '<div class="ds-grade" role="list" aria-label="Pflegegrade">'+PFGRAD.map(function(g){return '<div role="listitem"><b>PG '+g[0]+'</b><span>'+esc(g[1])+'</span></div>'}).join('')+'</div>'+
    '<p class="ds-source">Pflegegrade nach SGB XI § 15. Den Pflegegrad stellt die Pflegekasse fest.</p>'+
    Q('Wer würde sich bei Ihnen im Pflegefall kümmern, und wie wäre das für ihn oder sie zu schaffen?');
}
function pfRisikoLive(){
  return '<div class="chartbox" data-c="pfwo"></div><p class="ds-source">Quelle: Statistisches Bundesamt, Pflegestatistik 2023.</p>'+
    '<div class="ds-conseq"><div><b>Finanziell</b><span>Die Pflegeversicherung zahlt feste Beträge. Der Rest kommt aus Rente und Vermögen, auch aus dem gemeinsamen Vermögen mit dem Partner.</span></div>'+
    '<div><b>Familie</b><span>Kinder zahlen für die Eltern erst ab einem Jahresbruttoeinkommen von mehr als 100.000 €. Die Pflege selbst leisten aber oft sie.</span></div>'+
    '<div><b>Organisation</b><span>Pflegegrad beantragen, Pflegedienst oder Heimplatz finden. Das muss oft kurzfristig gehen.</span></div></div>'+
    '<p class="ds-source">Sozialhilfe (Hilfe zur Pflege) zahlt erst, wenn Einkommen und Vermögen bis auf einen Schonbetrag eingesetzt sind. Einzelfälle klärt das Sozialamt oder eine Rechtsberatung.</p>';
}
function pfLueckeForm(){
  var h=selHtml('pf.pg','Angenommener Pflegegrad (Beispiel)',['1','2','3','4','5']);
  h+='<div class="grid2">'+fld('vp.rente','Rente oder Einkommen im Pflegefall',{unit:'€ / Monat',hint:'Netto.'})+fld('vp.verm','Verfügbares Vermögen',{unit:'€'})+'</div>';
  h+='<div class="grid2">'+fld('pf.kost','Kosten der Pflege zu Hause',{unit:'€ / Monat',hint:'Schätzung, z. B. Pflegedienst. Leer lassen, wenn offen.'})+fld('pf.heim','Eigenanteil im Pflegeheim',{unit:'€ / Monat',hint:'Leer = Bundesdurchschnitt '+eur(REGEL.pflege.heimEigen)+' im ersten Jahr.'})+'</div>';
  h+=fld('pf.bestand','Bestehende private Pflegeleistung',{unit:'€ / Monat',hint:'Nur, was in einem bestehenden Vertrag steht. Leer lassen, wenn keine.'});
  return h;
}
function pfLueckeLive(){
  var o=pfCalc(),h='';
  if(o.heimOk){
    var Rh=pfBruecke('heim');
    h+='<div class="ds-card"><div class="ds-cap">Pflegeheim</div><div class="chartbox" data-c="pfheim"></div>'+pfBrueckeTab(Rh)+'</div>';
    if(!isNaN(o.r)&&o.lueH>0&&o.monH!==null)h+='<div class="ds-callout bad"><b>Ihr Vermögen von '+eur(o.v)+' reicht im Heim '+pfReichTxt(o.monH)+'.</b>'+(o.heimDef?' Berücksichtigt ist, dass der Eigenanteil mit den Jahren sinkt.':'')+'</div>';
    else if(!isNaN(o.r)&&o.lueH<=0)h+='<div class="ds-callout good">Rente und bestehende Leistungen decken den Eigenanteil im Heim.</div>';
    else if(isNaN(o.r))h+='<div class="ds-callout">Tragen Sie Rente oder Einkommen ein, dann sehen wir, was monatlich fehlt.</div>';
    if(o.heimDef)h+='<div class="chartbox" data-c="pfjahre"></div>';
  }else h+='<div class="ds-callout">Bei Pflegegrad 1 zahlt die Pflegekasse im Heim nur '+eur(o.heimK)+' im Monat. Die Rechnung mit dem Durchschnitts-Eigenanteil gilt erst ab Pflegegrad 2 und wird deshalb nicht gezeigt.</div>';
  var Rz=pfBruecke('haus');
  if(Rz)h+='<div class="ds-card"><div class="ds-cap">Zu Hause mit Pflegedienst</div><div class="chartbox" data-c="pfhaus"></div>'+pfBrueckeTab(Rz)+'<p class="ds-source">Zu Hause laufen Miete und Lebenshaltung weiter. Deshalb ist die Rente hier nicht abgezogen.</p></div>';
  h+='<details class="adv"><summary>Leistungen der Pflegekasse für alle Pflegegrade</summary>'+pfLeistTab()+'</details>';
  return h+'<p class="ds-source">Beispielrechnung mit Annahmen, keine Prognose. '+esc(REGEL.pflege.quelle)+'</p>';
}
function pfLeistTab(){
  var P=REGEL.pflege,g=pfG();
  function cell(a,i){return '<td'+(i===g?' class="hl"':'')+'>'+(a[i]>0?eur(a[i]):'–')+'</td>'}
  var rows=[['Pflegegeld (Angehörige pflegen)',P.geld],['Pflegedienst (Sachleistung)',P.sach],['Pflegeheim (Zuschuss der Kasse)',P.heim]];
  return '<div class="tw"><table class="pft"><thead><tr><th>Pro Monat</th>'+[1,2,3,4,5].map(function(i){return '<th'+(i===g?' class="hl"':'')+'>PG '+i+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr><th>'+r[0]+'</th>'+[1,2,3,4,5].map(function(i){return cell(r[1],i)}).join('')+'</tr>'}).join('')+'</tbody></table></div><p class="hint-t">Bei Pflegegrad 1 gibt es keine Geld- und Sachleistung, aber den Entlastungsbetrag von '+eur(P.entlast)+' pro Monat. Die Pflegeversicherung ist eine Teilabsicherung. Stand 2026.</p>';
}
function pfOptHint(k){
  var p=pfObj(),o=pfCalc(),a=adv.kd&&adv.kd.alter;
  if(k==='eigen'&&o.monH!==null)return 'Laut Schritt 4 reicht das Vermögen im Heim '+pfReichTxt(o.monH)+'.';
  if(k==='eigen'&&o.lueH===0)return 'Laut Schritt 4 decken Rente und Leistungen den Eigenanteil.';
  if(k==='angeh'&&p.lage.angeh==='nein')return 'Laut Schritt 1 wohnen keine Angehörigen in der Nähe.';
  if(k==='angeh'&&p.lage.angeh==='teil')return 'Laut Schritt 1 können Angehörige nur eingeschränkt helfen.';
  if(k==='angeh')return 'Pflegegeld bei Pflegegrad '+o.g+': '+(o.geld>0?eur(o.geld)+' pro Monat.':'keines.');
  if(k==='privat'&&a)return 'Alter heute: '+a+' Jahre. Der Beitrag hängt vom Eintrittsalter ab.';
  return '';
}
function pfOptForm(){
  var p=pfObj();
  var h='<div class="tw"><table class="ds-matrix"><thead><tr><th scope="col"><span class="sr">Kriterium</span></th>'+PFOPT.map(function(o){return '<th scope="col">'+esc(o[1])+'<small>'+esc(o[2])+'</small></th>'}).join('')+'</tr></thead><tbody>';
  PFKRIT.forEach(function(kr,ri){h+='<tr><th scope="row">'+esc(kr)+'</th>'+PFOPT.map(function(o){return '<td>'+esc(o[3][ri])+'</td>'}).join('')+'</tr>'});
  h+='<tr class="ds-rel"><th scope="row">Bezug zu Ihrer Situation</th>'+PFOPT.map(function(o){var t=pfOptHint(o[0]);return '<td>'+(t?esc(t):'<span class="muted">–</span>')+'</td>'}).join('')+'</tr>';
  h+='<tr class="ds-decrow"><th scope="row">Ihre Einschätzung</th>'+PFOPT.map(function(o){var cur=p.opt[o[0]]||'';return '<td><div class="ds-dec">'+PFDEC.map(function(d){return '<button class="chip" data-act="adv-pfopt" data-k="'+o[0]+'" data-v="'+d[0]+'" aria-pressed="'+(cur===d[0])+'">'+d[1]+'</button>'}).join('')+'</div></td>'}).join('')+'</tr>';
  h+='</tbody></table></div>';
  h+='<div class="opt-cards">'+PFOPT.map(function(o){var cur=p.opt[o[0]]||'',t=pfOptHint(o[0]);return '<section class="opt-c"><h4>'+esc(o[1])+'<small>'+esc(o[2])+'</small></h4><dl>'+PFKRIT.map(function(kr,ri){return '<div><dt>'+esc(kr)+'</dt><dd>'+esc(o[3][ri])+'</dd></div>'}).join('')+(t?'<div class="rel"><dt>Bezug zu Ihrer Situation</dt><dd>'+esc(t)+'</dd></div>':'')+'</dl><div class="lwc">'+PFDEC.map(function(d){return '<button class="chip" data-act="adv-pfopt" data-k="'+o[0]+'" data-v="'+d[0]+'" aria-pressed="'+(cur===d[0])+'">'+d[1]+'</button>'}).join('')+'</div></section>'}).join('')+'</div>';
  h+='<p class="ds-source">Allgemeine Merkmale, keine Produktempfehlung. Was ein konkreter Tarif leistet, steht in seinen Versicherungsbedingungen.</p>';
  h+='<details class="adv"'+(p.opt.privat==='pruefen'||p.mgH||p.mgS?' open':'')+'><summary>Angebot einer Pflegezusatzversicherung eintragen</summary>'+pfTarifForm()+'<div class="pf-tarif">'+pfTarifLive()+'</div></details>';
  return h;
}
function pfTarifForm(){
  return '<p class="hint-t">Nur eintragen, was im Angebot steht. Höhe und Voraussetzungen der Leistung (ab welchem Pflegegrad, bei welcher Pflegeform) stehen in den Versicherungsbedingungen.</p><div class="grid2">'+fld('pf.mgH','Pflegemonatsgeld bei Pflege zu Hause',{unit:'€ / Monat'})+fld('pf.mgS','Pflegemonatsgeld im Heim',{unit:'€ / Monat'})+'</div>'+chk('pf.bed','Leistung und Voraussetzungen in den Versicherungsbedingungen geprüft');
}
function pfTarifLive(){
  var o=pfCalc();if(!o.tarif)return '';
  var h='<div class="stats">';
  if(o.mgH>0&&!isNaN(o.ebZ))h+=stat('Zu Hause: bleibt mit Angebot',eur(o.ebZT),'vorher '+eur(o.ebZB)+' pro Monat',o.ebZT>0?'':'good');
  if(o.mgS>0&&o.heimOk)h+=stat('Heim: bleibt mit Angebot',eur(o.ebHT),'vorher '+eur(o.ebHB)+' pro Monat',o.ebHT>0?'':'good');
  h+='</div>';
  if(o.monHT!==null&&o.heimOk)h+='<p class="hint-t">Mit dem Angebot reicht das Vermögen im Heim '+pfReichTxt(o.monHT)+'.</p>';
  if(!o.ok)h+='<div class="ds-callout"><b>Noch nicht geprüft:</b> Höhe und Voraussetzungen der Leistung müssen in den Versicherungsbedingungen bestätigt werden. Bis dahin ist das eine Annahme.</div>';
  return h;
}
function pfEntForm(){
  var p=pfObj();
  return '<div class="ds-q"><span>Was ist noch offen?</span><div class="ds-checks">'+PFOFFEN.map(function(o){var on=p.offen.indexOf(o[0])>=0;return '<button class="ds-check" data-act="adv-pfoff" data-k="'+o[0]+'" aria-pressed="'+on+'"><i aria-hidden="true">'+(on?'✓':'')+'</i>'+esc(o[1])+'</button>'}).join('')+'</div></div>'+
    '<label class="fl"><span>Weitere Fragen des Kunden</span><textarea data-adv="pf.fragen" maxlength="500" placeholder="z. B. Was passiert mit dem Haus, wenn wir ins Heim gehen?">'+esc(p.fragen)+'</textarea></label>'+
    '<label class="fl"><span>Nächster Schritt</span><input type="text" data-adv="pf.next" maxlength="120" value="'+esc(p.next)+'" placeholder="z. B. Angebot rechnen, Termin mit Tochter in zwei Wochen"></label>';
}
function pfSummaryRows(){
  var p=pfObj(),o=pfCalc(),R=[];
  if(p.prio.length)R.push(['Wichtig ist Ihnen',p.prio.map(function(k){return pfLbl(PFPRIO,k)}).join(', ')]);
  if(p.ort)R.push(['Gewünschter Ort der Pflege',pfLbl(PFORT,p.ort)]);
  if(o.heimOk)R.push(['Eigenanteil im Heim, erstes Jahr',eur(o.ebH)+' pro Monat']);
  if(o.heimOk&&!isNaN(o.r))R.push(['Fehlt im Heim nach Rente'+(o.best>0?' und Leistungen':''),eur(o.lueH)+' pro Monat']);
  if(o.monH!==null)R.push(['Vermögen reicht im Heim',pfReichTxt(o.monH)]);
  if(!isNaN(o.ebZB))R.push(['Zu Hause zusätzlich zu tragen',eur(o.ebZB)+' pro Monat']);
  PFOPT.forEach(function(x){var d=p.opt[x[0]];if(d)R.push([x[1],pfLbl(PFDEC,d)])});
  return R;
}
function pfEntLive(){
  var p=pfObj(),R=pfSummaryRows(),off=PFOFFEN.filter(function(o){return p.offen.indexOf(o[0])>=0}).map(function(o){return o[1]});
  var h='<div class="ds-card"><div class="ds-cap">Ergebnis der Pflegeberatung</div>'+(R.length?pfFacts(R):'<p class="hint-t">Noch keine Ergebnisse. Die Schritte davor füllen diese Übersicht.</p>')+'</div>';
  if(off.length||p.fragen.trim())h+='<div class="ds-card"><div class="ds-cap">Offene Punkte</div><ul class="ds-list">'+off.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+(p.fragen.trim()?'<li>'+esc(p.fragen.trim())+'</li>':'')+'</ul></div>';
  if(p.next.trim())h+='<div class="ds-callout good"><b>Nächster Schritt:</b> '+esc(p.next.trim())+'</div>';
  return h+'<p class="ds-source">Die Übersicht kommt ins PDF und als Kurzfassung ins CRM (Schritt Ausgabe).</p>';
}
function pfSlides(){
  var S=[];
  function sl(i,title,o){o.title=title;o.kick='Pflege · Schritt '+(i+1)+' von 6';o.path=i;o.area='gesund';S.push(o)}
  sl(0,'Ihre Lebenssituation',{text:Q('Bevor wir über Geld sprechen: Wie leben Sie heute, und wer ist in Ihrer Nähe?'),form:pfLageForm,live:pfLageLive,
   tip:'Nur Lebensumstände erfassen, keine Diagnosen. Die Antworten fließen in den Vergleich in Schritt 5 ein.',leit:['pflege']});
  sl(1,'Was wäre Ihnen im Pflegefall wichtig?',{text:Q('Sollen wir darüber sprechen, wie Sie sich Pflege leisten können, oder darüber, wie Sie möglichst selbst entscheiden, wo und wie Sie gepflegt werden?'),form:pfZieleForm,live:pfPrioSatz,
   tip:'Nicht mit Zahlen starten. Die erste Priorität im Fazit wieder aufgreifen. Die Reihenfolge legt der Kunde fest.'});
  sl(2,'Was Pflegebedürftigkeit bedeutet',{text:pfRisikoText(),live:pfRisikoLive,
   tip:'Keine Angst machen, die Lage zeigen. Pflegegrade erklären, aber keinen Pflegegrad für den Kunden einschätzen.'});
  sl(3,'Was die Pflegekasse zahlt und was bleibt',{text:TP('Die Pflegeversicherung zahlt feste Beträge. Wir rechnen Schritt für Schritt aus, was bei Ihnen bleibt.')+Q('Wenn Sie im Pflegefall zwischen Zuhause und Heim wählen könnten: Was würde Ihnen die Entscheidung erleichtern?'),form:pfLueckeForm,live:pfLueckeLive,
   tip:'Jede Zeile der Rechnung nennt ihre Quelle. Durchschnittswerte sind regional verschieden, die Kosten vor Ort erfragen lassen (Schritt 6).'});
  sl(4,'Welche Möglichkeiten gibt es?',{text:'',form:function(){return TP('Vier Wege, neutral nebeneinander. Was davon passt, entscheiden Sie.')+pfOptForm()},
   tip:'Alle Wege nennen, auch die ohne Produkt. Ein Angebot erst eintragen, wenn es vorliegt, und die Leistung in den Bedingungen prüfen.'});
  sl(5,'Entscheidung und offene Fragen',{text:Q('Was nehmen Sie heute mit, und was klären wir bis zum nächsten Mal?'),form:pfEntForm,live:pfEntLive,
   tip:'Entscheidungen des Kunden festhalten, keine eigenen. Offene Punkte werden im CRM als Aufgabe angelegt.'});
  S.forEach(function(x){x.ill='pflege'});
  return S;
}
/* Formularmodus: alle Schritte auf einer Seite, Ergebnisse darunter */
function pfWizardForm(){
  return '<h3 class="sh">Pflege-Beratung</h3>'+pfPath(-1)+
    '<div class="sh2">1 · Lebenssituation</div>'+pfLageForm()+
    '<div class="sh2">2 · Ziele und Prioritäten</div>'+pfZieleForm()+
    '<div class="sh2">4 · Leistungen und Lücke</div>'+pfLueckeForm()+
    '<div class="sh2">5 · Möglichkeiten</div>'+pfOptForm()+
    '<div class="sh2">6 · Entscheidung und offene Fragen</div>'+pfEntForm();
}
function pfRes(){return '<div class="sh2">Ergebnis: Leistungen und Lücke</div>'+pfLueckeLive()+'<div class="sh2">Zusammenfassung</div>'+pfEntLive()}
function pfReport(b){
  var p=pfObj(),o=pfCalc(),P=REGEL.pflege,k=adv.kd||{};
  var f=[];if(!adv.sec.einstieg){if(k.alter)f.push(['Alter',k.alter+' Jahre']);if(k.fam)f.push(['Familienstand',k.fam]);if(k.wohnen)f.push(['Wohnen',k.wohnen])}
  Object.keys(PFLAGE).forEach(function(x){if(p.lage[x])f.push([PFLAGE[x][0],pfLbl(PFLAGE[x][1],p.lage[x])])});
  if(f.length){b.push({t:'h',text:'Pflege: Ihre Situation'});b.push({t:'kv',rows:f,strong:-1})}
  b.push({t:'h',text:'Pflege: Was Ihnen wichtig ist'});
  if(p.prio.length){b.push({t:'bul',items:p.prio.map(function(x,i){return (i+1)+'. '+pfLbl(PFPRIO,x)})});b.push({t:'p',text:PFSATZ[p.prio[0]]})}
  else b.push({t:'p',text:'Es geht nicht nur darum, Pflege bezahlen zu können. Es geht auch darum, möglichst selbst zu entscheiden, wie und wo man gepflegt wird.'});
  if(p.ort)b.push({t:'p',text:'Gewünschter Ort der Pflege: '+pfLbl(PFORT,p.ort)+'.'});
  b.push({t:'h',text:'Was die Pflegekasse zahlt (Pflegegrad '+o.g+', Beispiel)'});
  b.push({t:'table',head:['Leistung pro Monat','Betrag'],w:[0.7,0.3],rows:[['Pflegegeld, wenn Angehörige pflegen',eur(o.geld)],['Pflegedienst (Sachleistung)',eur(o.sach)],['Pflegeheim, Zuschuss der Kasse',eur(o.heimK)]]});
  function br(art,title){var R=pfBruecke(art);if(!R)return;b.push({t:'h',text:title});b.push({t:'table',head:['Rechenschritt','Herkunft','Pro Monat'],w:[0.5,0.28,0.22],rows:R.map(function(x){return [x.l,x.q,(x.t==='minus'?'- ':'')+eur(Math.abs(x.v))]})});var c=chartPfBruecke(art);if(c)b.push({t:'img',src:c.toDataURL('image/png'),ratio:c.height/c.width,w:150})}
  br('heim','Pflegeheim: Was bleibt pro Monat?');
  if(o.heimOk&&o.monH!==null)b.push({t:'p',text:'Ihr Vermögen von '+eur(o.v)+' reicht im Heim '+pfReichTxt(o.monH)+'.'+(o.heimDef?' Berücksichtigt ist der mit den Jahren steigende Leistungszuschlag.':'')});
  if(o.heimOk&&o.heimDef){var cj=chartPfJahre();b.push({t:'img',src:cj.toDataURL('image/png'),ratio:cj.height/cj.width,w:150})}
  if(!o.heimOk)b.push({t:'small',text:'Bei Pflegegrad 1 ist die Heimrechnung mit dem Durchschnitts-Eigenanteil nicht aussagekräftig und daher nicht enthalten.'});
  br('haus','Zu Hause mit Pflegedienst: Was bleibt pro Monat?');
  b.push({t:'h',text:'Pflege: Möglichkeiten im Vergleich'});
  b.push({t:'table',head:['Möglichkeit','Was im Pflegefall passiert','Ihre Einschätzung'],w:[0.28,0.5,0.22],rows:PFOPT.map(function(x){return [x[1],x[3][1],pfLbl(PFDEC,p.opt[x[0]])||'nicht besprochen']})});
  if(o.tarif){var tr=[];if(o.mgH>0&&!isNaN(o.ebZ))tr.push(['Zu Hause',eur(o.mgH),eur(o.ebZT)]);if(o.mgS>0&&o.heimOk)tr.push(['Pflegeheim',eur(o.mgS),eur(o.ebHT)]);if(tr.length){b.push({t:'table',head:['Angebot','Pflegemonatsgeld','Bleibt bei Ihnen'],w:[0.34,0.36,0.30],rows:tr})}b.push({t:'small',text:o.ok?'Die Leistung des Angebots wurde in den Versicherungsbedingungen geprüft. Maßgeblich sind die Vertragsbedingungen.':'Die Leistung des Angebots ist noch nicht in den Versicherungsbedingungen geprüft.'})}
  var off=PFOFFEN.filter(function(x){return p.offen.indexOf(x[0])>=0}).map(function(x){return x[1]});if(p.fragen.trim())off.push(p.fragen.trim());
  if(off.length||p.next.trim()){b.push({t:'h',text:'Pflege: Offene Punkte und nächster Schritt'});if(off.length)b.push({t:'bul',items:off});if(p.next.trim())b.push({t:'p',text:'Nächster Schritt: '+p.next.trim()})}
  b.push({t:'small',text:'Beispielrechnung mit Annahmen, keine Prognose. Pflegegrad, Kosten und Leistungen im Einzelfall können abweichen. '+P.quelle});
}
function pfCrmNote(){
  var p=pfObj(),o=pfCalc(),s='Pflege: PG '+o.g+' als Annahme.';
  if(p.prio.length)s+=' Wichtig: '+p.prio.map(function(k){return pfLbl(PFPRIO,k)}).join(', ')+'.';
  if(o.heimOk)s+=' Heim-Eigenanteil '+eur(o.ebH)+(isNaN(o.r)?'':', Lücke '+eur(o.lueH))+' pro Monat'+(o.monH!==null?', Vermögen reicht '+pfReichTxt(o.monH):'')+'.';
  var d=PFOPT.filter(function(x){return p.opt[x[0]]}).map(function(x){return x[1]+': '+pfLbl(PFDEC,p.opt[x[0]])});
  if(d.length)s+=' '+d.join('; ')+'.';
  if(p.next.trim())s+=' Nächster Schritt: '+p.next.trim()+'.';
  return s;
}
function pfOpenList(){var p=pfObj();return PFOFFEN.filter(function(x){return p.offen.indexOf(x[0])>=0}).map(function(x){return x[1]})}
function chartPfWo(){
  var P=REGEL.pflege,W=1100,H=330,k=cv(W,H),x=k.x;
  x.fillStyle='#16202A';x.font='bold 30px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Wo werden Pflegebedürftige versorgt?',40,46);
  x.fillStyle='#5B6773';x.font='22px '+FONT;x.fillText('Anteil an knapp '+P.stat.gesamt+' Millionen, '+P.stat.jahr,40,76);
  var L=40,T=110,w=W-80,h=70,zw=w*P.stat.zuhause/100;
  rrect(x,L,T,zw,h,12,'#2C7A57');rrect(x,L+zw+6,T,w-zw-6,h,12,'#B3362D');
  x.fillStyle='#fff';x.font='bold 30px '+FONT;x.textBaseline='middle';x.textAlign='center';x.fillText(P.stat.zuhause+' %',L+zw/2,T+h/2);x.fillText(P.stat.heim+' %',L+zw+6+(w-zw-6)/2,T+h/2);
  x.textAlign='left';x.textBaseline='alphabetic';x.fillStyle='#16202A';x.font='bold 26px '+FONT;x.fillText('Zu Hause versorgt',L,T+h+44);x.fillText('Im Heim',L+zw+6-10,T+h+44);
  x.fillStyle='#5B6773';x.font='22px '+FONT;x.fillText('Davon rund '+P.stat.nurgeld+' Millionen nur mit Pflegegeld, meist von Angehörigen gepflegt',L,T+h+82);
  return k.c;
}
function TP(t){return P(t)}
/* ================= Vorsorge-Check ================= */
/* Zentrale fachliche Werte. Hier ändern, nicht in den Texten. Prüfung: Menü Rechtsstand. */
var REGEL={
 abg:'26,375 %',
 pflege:{
  geld:[0,0,347,599,800,990],sach:[0,0,796,1497,1859,2299],heim:[0,131,805,1319,1855,2096],
  zuschlag:[15,30,50,75],heimEigen:3245,eee:1685,uv:1046,invest:514,vhaus:3539,entlast:131,
  stat:{gesamt:'5,7',zuhause:86,heim:14,nurgeld:'3,1',jahr:'Ende 2023'},
  quelle:'Leistungsbeträge: SGB XI §§ 36, 37, 43 und 43c. Eigenanteile: vdek, Auswertung vom 1. Januar 2026. Anteile der Versorgung: Statistisches Bundesamt, Pflegestatistik 2023.'}
};
var VPK={eigenanteil:REGEL.pflege.heimEigen,stand:'vdek, Stand 1. Januar 2026, erstes Pflegejahr im Heim'};
var ERBFREI=[['Ehegatte oder eingetragener Lebenspartner',500000],['Kinder und Stiefkinder',400000],['Enkel',200000],['Eltern und Großeltern (bei Erbschaft)',100000],['Geschwister, Nichten und Neffen',20000],['Alle übrigen, auch unverheiratete Partner',20000]];
var VP=[
 ['b1','Wenn ich nicht mehr selbst entscheiden kann',[
   ['vv','Vorsorgevollmacht liegt vor (Gesundheit und Vermögen)','Keine Vorsorgevollmacht: Im Ernstfall entscheidet das Betreuungsgericht, wer handeln darf.','recht'],
   ['pv','Patientenverfügung liegt vor','Keine Patientenverfügung: Die Ärzte kennen den eigenen Willen nicht.','recht'],
   ['bv','Betreuungsverfügung (Wunsch, wer Betreuer wird)','Keine Betreuungsverfügung: Der Wunsch, wer betreut, ist nicht festgehalten.','recht'],
   ['bk','Vollmacht für Konten und Depots, auch über den Tod hinaus','Zugriff auf Konten und Depots ist im Ernstfall nicht geregelt.','recht'],
   ['vr','Eintrag im Zentralen Vorsorgeregister','Vollmachten sind nicht im Vorsorgeregister hinterlegt.','recht']
 ]],
 ['b2','Wenn ich pflegebedürftig werde',[
   ['pf1','Kosten eines Pflegeplatzes und eigener Beitrag sind bekannt','Die Kosten eines Pflegeplatzes sind nicht bekannt oder nicht eingeplant.','pflege'],
   ['pf2','Private Pflegeabsicherung (Pflegetagegeld oder Pflegerente) vorhanden','Keine private Pflegeabsicherung: Die Pflegekasse zahlt nur einen Teil, der Rest kommt aus Rente und Vermögen.','pflege'],
   ['pf3','Familie weiß, wer pflegt und wie es bezahlt wird','Offen, wer pflegt und wie es bezahlt wird.','pflege']
 ]],
 ['b3','Wenn etwas passiert',[
   ['un','Private Unfallversicherung vorhanden','Keine private Unfallversicherung: In der Freizeit zahlt die gesetzliche Unfallversicherung nicht.','unfall'],
   ['bu','Arbeitskraft abgesichert (Berufsunfähigkeit oder Grundfähigkeit)','Die Arbeitskraft ist nicht privat abgesichert.','bu'],
   ['ki','Kinder sind abgesichert (Unfall, Invalidität)','Kinder haben keinen privaten Unfallschutz.','unfall']
 ]],
 ['b4','Wenn ich sterbe',[
   ['te','Testament oder Erbvertrag liegt vor','Kein Testament: Es gilt die gesetzliche Erbfolge.','recht'],
   ['ef','Gesetzliche Erbfolge ist bekannt und passt zum eigenen Wunsch','Die gesetzliche Erbfolge ist nicht bekannt.','recht'],
   ['st','Erbschaftsteuer geprüft (Freibeträge, Immobilie, Anlagevermögen)','Mögliche Erbschaftsteuer ist nicht geprüft.','steuer'],
   ['bn','Begünstigte in Lebens- und Rentenverträgen sind aktuell','Begünstigte in den Verträgen sind nicht geprüft.','vertrag'],
   ['ka','Kosten für Bestattung und Nachlass sind abgesichert','Kosten für Bestattung und Nachlass sind nicht abgesichert.','vertrag']
 ]]
];
var VPSCHRITT={recht:'Mit einem Notar oder einer Rechtsanwältin klären. Wir geben dazu keine Rechtsberatung.',pflege:'Pflegeabsicherung besprechen: Pflegetagegeld oder Pflegerente, passend zu Alter und Gesundheit.',unfall:'Private Unfallversicherung prüfen und Invaliditätssumme festlegen.',bu:'Absicherung der Arbeitskraft prüfen (Berufsunfähigkeit oder Grundfähigkeit).',steuer:'Mit einer Steuerberatung prüfen, ob Erbschaftsteuer anfällt. Wir zeigen die Freibeträge zur Orientierung.',vertrag:'Begünstigte und Absicherung in den bestehenden Verträgen prüfen. Das übernehmen wir gern.'};
function vpNew(){var i={};VP.forEach(function(b){b[2].forEach(function(r){i[r[0]]=''})});return {i:i,rente:'',verm:'',kinder:false}}
function anyMod(){var m=adv.mods;return !!(m.alter||m.anlage||m.kv||m.sach||m.vorsorge||m.pflege||m.bu||m.zus)}
function vpSel(path,val){return '<select data-adv="'+path+'" data-amp="'+esc(val)+'" aria-label="Status">'+[['','offen'],['ja','geregelt'],['teil','teilweise'],['nein','nicht geregelt']].map(function(k){return '<option value="'+k[0]+'"'+(k[0]===val?' selected':'')+'>'+k[1]+'</option>'}).join('')+'</select>'}
function vpGaps(){
  var g=[];VP.forEach(function(b){b[2].forEach(function(r){var v=adv.vp.i[r[0]];if(v==='nein'||v==='teil')g.push({b:b[1],k:r[0],t:r[2],art:r[3],teil:v==='teil'})})});
  if(adv.vp.kinder===false){} return g;
}
function vpArten(){var a={};vpGaps().forEach(function(x){a[x.art]=1});return Object.keys(a)}
function vpPflege(){
  var r=nv(adv.vp.rente),v=nv(adv.vp.verm),e=VPK.eigenanteil;
  if(!(r>=0))return null;
  var l=Math.max(0,e-r),o={e:e,r:r,l:l,monate:null};
  if(l>0&&v>=0)o.monate=Math.floor(v/l);
  return o;
}
function vpRows(bi){
  var b=VP[bi];
  return '<div class="vpb"><h4>'+esc(b[1])+'</h4>'+b[2].map(function(r){return '<div class="vpr"><span>'+esc(r[1])+'</span>'+vpSel('vp.i.'+r[0],adv.vp.i[r[0]])+'</div>'}).join('')+'</div>';
}
function vpInfo(bi){
  if(bi===0)return '<div class="vpi"><b>Gut zu wissen:</b> Ehegatten und eingetragene Partner dürfen sich seit 2023 im Notfall höchstens 6 Monate in Gesundheitsangelegenheiten vertreten. Für Konten, Vermögen und Verträge gilt das nicht. Unverheiratete Partner, Kinder und Eltern haben dieses Recht nicht. Eine Vorsorgevollmacht regelt es verlässlich. Stand 10/2026, keine Rechtsberatung.</div>';
  if(bi===1)return '<div class="vpi"><b>Gut zu wissen:</b> Im Pflegeheim bleiben im ersten Jahr im Schnitt <b>'+eur(VPK.eigenanteil)+' pro Monat</b> als Eigenanteil, auch nach dem Zuschuss der Pflegekasse ('+esc(VPK.stand)+'). Kinder müssen erst ab einem Jahresbruttoeinkommen von 100.000 € für Pflegekosten der Eltern aufkommen.</div>'+vpPflegeForm();
  if(bi===2)return '<div class="vpi"><b>Gut zu wissen:</b> Die gesetzliche Unfallversicherung gilt bei Arbeit, Schule und Arbeitsweg. In der Freizeit, wo die meisten Unfälle passieren, greift sie nicht.</div>';
  return '<div class="vpi"><b>Gut zu wissen:</b> Ohne Testament erben zuerst die Kinder und deren Nachkommen, dann Eltern und Geschwister, dann Großeltern. Der Ehegatte erbt neben Kindern bei Zugewinngemeinschaft die Hälfte. Unverheiratete Partner erben ohne Testament nichts. Wer in einem Vertrag als Begünstigter steht, bekommt die Leistung außerhalb des Testaments. Erben übernehmen die Anschaffungskosten des Verstorbenen. Gewinne aus einem geerbten Depot werden beim Verkauf mit '+REGEL.abg+' Abgeltungsteuer versteuert.</div>'+vpErbTab();
}
function vpErbTab(){return '<details class="adv"><summary>Freibeträge bei der Erbschaftsteuer (pro Person)</summary><div class="list">'+ERBFREI.map(function(f){return '<div class="row soon"><div class="body"><div class="txt">'+esc(f[0])+': <b>'+eur(f[1])+'</b></div></div></div>'}).join('')+'</div><p class="hint-t">Die Freibeträge gelten alle zehn Jahre neu. Dazu kommen für Ehegatten ein Versorgungsfreibetrag von 256.000 € und für Kinder bis zu 52.000 €. Der Steuersatz hängt von Verwandtschaftsgrad und Höhe des Erwerbs ab. Stand 10/2026.</p></details>'}
function vpPflegeForm(){
  var o=vpPflege(),h='<div class="grid2">'+fld('vp.rente','Netto-Rente des Kunden später',{unit:'€ / Monat'})+fld('vp.verm','Freies Vermögen, falls genannt',{unit:'€'})+'</div>';
  if(o){h+='<div class="stats">'+stat('Eigenanteil im Heim',eur(o.e),'pro Monat, Durchschnitt')+stat('Netto-Rente',eur(o.r),'pro Monat')+stat('Monatliche Lücke',eur(o.l),o.monate!=null?'Vermögen reicht etwa '+(o.monate>=12?Math.floor(o.monate/12)+' Jahre und '+(o.monate%12)+' Monate':o.monate+' Monate'):'wird aus Vermögen oder von Angehörigen gedeckt',o.l>0?'bad':'good')+'</div>'}
  return '<div id="vp-pf">'+h+'</div>';
}
function fVp(){
  var h='<h3 class="sh">Vorsorge-Check</h3><p class="hint-t">Frage den Kunden Baustein für Baustein. Das sind Einstiegsfragen, keine Rechtsberatung. Bei Vollmachten, Testament und Steuern verweisen wir an Notar, Anwalt oder Steuerberatung.</p>';
  VP.forEach(function(b,i){h+=vpRows(i)+vpInfo(i)});
  return h+'<div id="vp-res">'+vpResHtml()+'</div>';
}
function vpResHtml(){
  var g=vpGaps(),arten=vpArten(),h='<h3 class="sh">Ergebnis</h3>';
  if(!g.length)return h+'<div class="note ok">Bisher keine Lücken eingetragen.</div>';
  h+='<div class="note"><b>'+g.length+' Punkt'+(g.length>1?'e':'')+' offen oder nur teilweise geregelt.</b></div><div class="list">'+g.map(function(x){return '<div class="row late"><div class="body"><div class="txt">'+esc(x.t)+'</div><div class="sub">'+esc(x.b)+(x.teil?' · teilweise':'')+'</div></div></div>'}).join('')+'</div>';
  h+='<h3 class="sh">Empfohlene nächste Schritte</h3><div class="list">'+arten.map(function(a){return '<div class="row soon"><div class="body"><div class="txt">'+esc(VPSCHRITT[a])+'</div></div></div>'}).join('')+'</div>';
  return h;
}
function vpSlides(flagged){
  var S=[];
  var W=adv.wenn||{},need={0:['a'],1:['b'],2:['a'],3:['c']};
  function flag(i){return need[i].some(function(k){return W[k]==='nein'||W[k]==='teil'})}
  if(!flagged)S.push({title:'Was passiert, wenn mir etwas passiert?',text:P('Wir sprechen heute nicht über ein Produkt, sondern darüber, ob im Ernstfall alles so läuft, wie Sie es sich wünschen.')+Q('Wenn Sie morgen nicht mehr selbst entscheiden könnten: Wer dürfte für Sie handeln, und weiß diese Person, was Sie wollen?'),tip:'Zuhören und den Kunden selbst feststellen lassen, was ungeklärt ist. Nicht verkaufen. Der Vorsorge-Check öffnet die Themen Pflege und Unfall von selbst.'});
  VP.forEach(function(b,i){
    if(flagged&&!flag(i))return;
    S.push({title:b[1],text:'',form:function(){return vpRows(i)+vpInfo(i)},live:function(){return ''},tip:i===0||i===3?'Keine Rechtsberatung. Bei Lücken auf Notar oder Rechtsanwalt verweisen.':'Antworten mit dem Kunden gemeinsam einstufen. Auf „nicht geregelt“ nicht drängen, sondern die Folge benennen lassen.'});
  });
  if(!flagged||S.length)S.push({title:'Ihr Ergebnis: Was ist geregelt, was ist offen?',text:P('Hier sehen wir, was Sie schon geordnet haben und wo wir als Nächstes ansetzen sollten.'),live:function(){return vpResHtml()},tip:'Pflege und Unfall führen zur Beratung. Wenn der Kunde eine Lücke selbst nennt, direkt einen Folgetermin dafür vereinbaren.'});
  return S;
}
function vpReport(b){
  var rows=[];VP.forEach(function(bl){bl[2].forEach(function(r){var v=adv.vp.i[r[0]];rows.push([r[1],v==='ja'?'geregelt':v==='teil'?'teilweise':v==='nein'?'nicht geregelt':'offen'])})});
  b.push({t:'h',text:'Vorsorge-Check: Was ist geregelt?'});
  b.push({t:'table',head:['Punkt','Stand'],w:[0.74,0.26],rows:rows});
  var o=vpPflege();
  if(o){b.push({t:'kv',rows:[['Eigenanteil im Pflegeheim, erstes Jahr (Durchschnitt)',eur(o.e)+' pro Monat'],['Erwartete Netto-Rente',eur(o.r)+' pro Monat'],['Monatliche Lücke',eur(o.l)]],strong:2});b.push({t:'small',text:'Eigenanteil: '+VPK.stand+'. Regional deutlich abweichend.'})}
  var ar=vpArten();
  if(ar.length){b.push({t:'h',text:'Vorsorge-Check: Empfohlene nächste Schritte'});b.push({t:'bul',items:ar.map(function(a){return VPSCHRITT[a]})})}
  b.push({t:'small',text:'Diese Übersicht ersetzt keine Rechts- oder Steuerberatung. Zu Vollmachten, Testament und Erbschaftsteuer berät ein Notar, eine Rechtsanwältin oder eine Steuerberatung.'});
}

/* ================= Startseite der Beratung ================= */
var homeGruppe='';
var homeSel={alter:false,anlage:false,kv:false,sach:false,vorsorge:false,pflege:false,bu:false,zus:false},homeKunde='';
var HOME_TILES=[
  ['alter','Vorsorge fürs Alter','Gesetzliche Rente, Lücke, Rürup und Fondspolice','sun'],
  ['anlage','Steueroptimiert anlegen','Fondspolice als Steuer-Hülle, Szenarien und Merkmale','rocket'],
  ['kv','Krankenversicherung','GKV mit Zusatz oder PKV, Beitrag, Alter und Risiken','hospital'],
  ['sach','Sachversicherungen','Aktueller Stand gegen neuer Stand mit Ampel','home'],
  ['zus','Krankenzusatz','Zahn, Brille, Krankenhaus und Vorsorge, ohne PKV-Vergleich','tooth'],
  ['bu','Einkommen absichern','Berufsunfähigkeit: Einkommen, Fixkosten und Lücke','briefcase'],
  ['pflege','Pflege-Beratung','Kosten, Leistungen, Selbstbestimmung und Eigenanteil','users'],
  ['vorsorge','Vorsorge-Check','Vollmachten, Absicherung und Erbe','shieldok']
];
var HOME_ILLU={zus:'gesund',alter:'alter',anlage:'vermoegen',kv:'gesund',sach:'sach',bu:'bu',pflege:'pflege',vorsorge:'nachlass'};
var HOME_PH={einsteiger:['rocket','Ausbildung, Studium, erste Stelle'],arbeitend:['briefcase','Beruf, Familie, Haus'],rentner:['sun','Ruhestand, Vermögen, Familie']};
function fStart(){
  return '<h3 class="sh">Grunddaten</h3>'+
    fld('kunde','Kundennummer',{mode:'text',max:20,ph:'z. B. 10482',hint:'Nur für das CRM. Im PDF erscheint sie nicht.'})+
    '<div class="sh2">Themen in dieser Beratung</div>'+chk('mods.alter','Vorsorge fürs Alter: gesetzliche Rente, Lücke, Rürup und Fondspolice')+chk('mods.anlage','Steueroptimiert anlegen: Fondspolice')+chk('mods.kv','Krankenversicherung: GKV mit Zusatz oder private Krankenvollversicherung')+chk('mods.sach','Sachversicherungen: aktueller Stand gegen neuer Stand')+chk('mods.bu','Einkommen absichern: Berufsunfähigkeit')+chk('mods.pflege','Pflege-Beratung: Situation, Lücke, Möglichkeiten und Entscheidung')+chk('mods.vorsorge','Vorsorge-Check: Vollmachten, Pflege, Absicherung und Erbe')+'<div class="sh2">Kunde</div>'+kdForm()+'<div class="sh2">Überblick</div>'+ueForm()+ueSummary()+'<div class="sh2">Lebensweg</div>'+lebenForm();
}
function fOut(){
  var h='<h3 class="sh">Ausgabe</h3>'+fld('pdfName','Name für das PDF (optional)',{mode:'text',max:60,hint:'Erscheint nur im PDF. Wird nicht gespeichert, auch nicht in der Beratungsdatei oder im CRM.'})+'<div class="sh2">Inhalt des PDF</div>';
  if(adv.mods.alter)h+=chk('sec.rente','Vorsorge: die gesetzliche Rente, das Wichtigste')+chk('sec.al_ist','Vorsorge: aktueller Stand und Versorgungslücke')+chk('sec.al_zeit','Vorsorge: Zeit ist der Hebel')+chk('sec.al_loes','Vorsorge: unsere Lösung und Konzept');
  if(adv.mods.anlage)h+=chk('sec.an','Geldanlage: Fondspolice, Szenarien und Merkmale')+chk('sec.an_steuer','Geldanlage: Steuerdiagramm');
  if(adv.mods.kv)h+=chk('sec.kv','Krankenversicherung: Beitragsvergleich und Leistungen')+chk('sec.kv_entw','Krankenversicherung: Beitragsentwicklung')+chk('sec.kv_alter','Krankenversicherung: Beitrag im Alter')+chk('sec.kv_pc','Krankenversicherung: Vorteile, Nachteile und Risiken');
  if(adv.mods.sach)h+=chk('sec.sach','Sachversicherungen: aktueller Stand gegen neuer Stand');
  if(adv.mods.zus)h+=chk('sec.zus','Krankenzusatz: Was die Kasse zahlt und was Ihnen wichtig ist');
  if(adv.mods.bu)h+=chk('sec.bu','Einkommen: Absicherung bei Berufsunfähigkeit');
  if(adv.mods.pflege)h+=chk('sec.pf','Pflege: Kosten, Leistungen und Eigenanteil');
  if(adv.mods.vorsorge)h+=chk('sec.vp','Vorsorge-Check: Überblick und Empfehlungen');
  h+=chk('sec.einstieg','Seite 1: Ihre Situation, Überblick, Schwerpunkte und nächster Termin')+chk('sec.leben','Lebensweg: von der Geburt bis zum Lebensende')+chk('sec.ganz','Übersicht aller Lebensbereiche (Themenrad)')+'<label class="fl"><span>Das haben wir geklärt</span><textarea data-adv="gesp.klar" maxlength="600">'+esc((adv.gesp&&adv.gesp.klar)||'')+'</textarea></label><label class="fl"><span>Nächster Termin</span><input type="text" data-adv="gesp.termin" maxlength="80" value="'+esc((adv.gesp&&adv.gesp.termin)||'')+'"></label>'+chk('sec.summe','Zusammenfassung der Beiträge')+chk('sec.notiz','Notizen und nächste Schritte');
  h+='<label class="fl"><span>Notizen und nächste Schritte</span><textarea data-adv="notiz" maxlength="600" placeholder="z. B. Unterlagen bis Freitag, Folgetermin am ...">'+esc(adv.notiz)+'</textarea></label>';
  h+='<p class="hint-t">Am Ende des PDF steht immer der Hinweistext (unverbindlich, keine Beratungsdokumentation). Du kannst ihn auf der Beratungs-Startseite unter „Weitere Funktionen“ ändern.</p>';
  h+='<div class="btnrow"><button class="btn primary" data-act="adv-pdf">PDF herunterladen</button></div>';
  h+='<div class="sh2">Im CRM festhalten</div>'+ergSel('adv',adv.erg,adv.grund,true,adv.ber,adv.fil)+'<p class="hint-t">Speichert das Ergebnis in Kurzform unter der Kundennummer mit Wiedervorlage. Der Name im PDF wird nicht gespeichert.</p>'+
    '<label class="fl"><span>Wiedervorlage</span><select data-adv="wvDays">'+[['7','in 1 Woche'],['30','in 1 Monat'],['90','in 3 Monaten'],['180','in 6 Monaten'],['0','keine']].map(function(o){return '<option value="'+o[0]+'"'+(adv.wvDays===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></label>'+
    '<div class="btnrow"><button class="btn" data-act="adv-crm">Im CRM speichern</button><button class="btn" data-act="adv-file-save">Beratungsdatei sichern</button></div><div id="advmsg"></div>';
  return h;
}

/* ================= Übersicht (Dashboard) und Aufgabenliste ================= */
var aufFilter='alle';
var IC={x:'<path d="M6 6l12 12M18 6L6 18"/>',doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',tooth:'<path d="M8 3c-2.4 0-4 1.8-4 4.4 0 2.6 1.2 3.6 1.8 6C6.4 15.8 6.7 21 8.3 21c1.2 0 1.6-3.6 2.4-4.8.4-.6.9-.8 1.3-.8s.9.2 1.3.8c.8 1.2 1.2 4.8 2.4 4.8 1.6 0 1.9-5.200 2.500-7.600.600-2.400 1.800-3.400 1.800-6C20 4.800 18.400 3 16 3c-1.600 0-2.600.9-4 .9S9.600 3 8 3z"/>',glasses:'<circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-4 0M2.500 13 5 7c.7-1.300 1.400-2 3-2M21.500 13 19 7c-.7-1.300-1.500-2-3-2"/>',bed:'<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',pencil:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',bubble:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',rocket:'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  wallet:'<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l2-3h12v3M16 13.5h2"/>',
  bank:'<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  shieldok:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  tax:'<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  sliders:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  heart:'<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  hourglass:'<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
  thumb:'<path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1.2 2 2.8L12.5 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7"/>',
  check:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  scale:'<path d="M12 3v18M5 21h14M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/>',
  radar:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M12 13v3M12 18v.01"/>',
  report:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  task:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16l1.5 1.5L13 14"/>',
  alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  chat:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  hash:'<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>'
};

/* ================= Designsystem: Icons und Illustrationen ================= */
IC.briefcase='<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>';
IC.hospital='<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 7.5v6M9 10.5h6M10 21v-4h4v4"/>';
IC.car='<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="16" width="18" height="4" rx="1.5"/><path d="M7.5 18h.01M16.5 18h.01"/>';
IC.scale='<path d="M12 3v18M7 21h10M5 7h14"/><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7zM19 7l-3 7a3.5 3.5 0 0 0 6 0l-3-7z"/>';
IC.doc='<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>';
IC.cross='<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>';
IC.key='<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>';
IC.coins='<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7M15 11c3 0 6 1 6 2.5V18c0 1.7-2.7 3-6 3-1.5 0-2.8-.3-3.8-.8"/>';
IC.users='<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .7 3.5 2.7 3.5 6"/>';
IC.umbrella='<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 0 4 0"/>';
IC.tooth='<path d="M7 3c-2.5 0-4 2-4 4.5 0 2.5 1.2 3.5 1.8 6 .6 2.6.9 7.5 2.7 7.5 1.5 0 1.4-4 3.5-4s2 4 3.5 4c1.8 0 2.1-4.9 2.7-7.5.6-2.5 1.8-3.5 1.8-6C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>';
IC.glasses='<circle cx="6" cy="14" r="3.5"/><circle cx="18" cy="14" r="3.5"/><path d="M9.5 14h5M2.5 14L4 7M21.5 14L20 7"/>';
var UIC={arbeit:'briefcase',pflege:'users',tod:'umbrella',rente:'sun',anlage:'trend',kranken:'hospital',unfall:'cross',haftpflicht:'shield',hausrat:'home',gebaeude:'home',kfz:'car',rechtsschutz:'scale',vollmacht:'doc',testament:'key'};
var AREA_IC={alter:'sun',vermoegen:'trend',gesund:'heart',einkommen:'briefcase',nachlass:'doc',sach:'home'};
var AREA_NM={alter:'Altersvorsorge',vermoegen:'Vermögen und Geldanlage',gesund:'Gesundheit und Pflege',einkommen:'Einkommen absichern',nachlass:'Vorsorge im Ernstfall',sach:'Haus, Auto, Haftung'};
var ILLU={
 pflege:'<svg viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="124" rx="100" ry="8" fill="#0B1B33" opacity=".07"/><polygon points="112,62 155,26 198,62" fill="#0A4A9C"/><rect x="120" y="62" width="70" height="58" fill="#fff" stroke="#0B1B33" stroke-width="2.5"/><rect x="146" y="90" width="18" height="30" fill="#DCE9F8" stroke="#0B1B33" stroke-width="2"/><rect x="128" y="72" width="14" height="14" fill="#DCE9F8" stroke="#0B1B33" stroke-width="2"/><rect x="168" y="72" width="14" height="14" fill="#DCE9F8" stroke="#0B1B33" stroke-width="2"/><circle cx="50" cy="62" r="11" fill="#F2C9A0"/><rect x="38" y="75" width="25" height="46" rx="11" fill="#0E7490"/><circle cx="86" cy="64" r="10" fill="#F2C9A0"/><rect x="75" y="76" width="22" height="45" rx="10" fill="#0A4A9C"/><path d="M60 98h18" stroke="#F2C9A0" stroke-width="5" stroke-linecap="round"/><path d="M68 40C52 28 56 14 68 22 80 14 84 28 68 40z" fill="#B3362D"/></svg>',
 bu:'<svg viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="124" rx="100" ry="8" fill="#0B1B33" opacity=".07"/><rect x="26" y="30" width="46" height="90" rx="8" fill="#2C7A57"/><rect x="86" y="62" width="46" height="58" rx="8" fill="#0A4A9C"/><rect x="86" y="30" width="46" height="32" rx="8" fill="none" stroke="#B3362D" stroke-width="3" stroke-dasharray="7 6"/><circle cx="176" cy="52" r="22" fill="#E0A100"/><path d="M176 42v20M168 48h12a4 4 0 0 1 0 8h-12" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M150 100l20 14M170 100l-20 14" stroke="#B3362D" stroke-width="0"/></svg>',
 alter:'<svg viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="124" rx="100" ry="8" fill="#0B1B33" opacity=".07"/><circle cx="110" cy="92" r="46" fill="#E0A100" opacity=".9"/><rect x="0" y="92" width="220" height="40" fill="#F6F3EC"/><path d="M20 112h180" stroke="#0B1B33" stroke-width="3" stroke-linecap="round"/><rect x="58" y="96" width="60" height="8" rx="3" fill="#0A4A9C"/><path d="M62 104v10M114 104v10" stroke="#0B1B33" stroke-width="3"/><circle cx="150" cy="84" r="9" fill="#F2C9A0"/><rect x="140" y="94" width="20" height="22" rx="8" fill="#0E7490"/></svg>',
 vermoegen:'<svg viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="124" rx="100" ry="8" fill="#0B1B33" opacity=".07"/><path d="M110 118V62" stroke="#2C7A57" stroke-width="5" stroke-linecap="round"/><path d="M110 78C84 76 74 58 74 44c20 0 36 8 36 34z" fill="#2C7A57"/><path d="M110 66c0-18 12-30 34-32 0 18-12 30-34 32z" fill="#3E9A72"/><ellipse cx="62" cy="116" rx="22" ry="7" fill="#E0A100"/><ellipse cx="62" cy="108" rx="22" ry="7" fill="#F2B705"/><ellipse cx="62" cy="100" rx="22" ry="7" fill="#E0A100"/><ellipse cx="160" cy="116" rx="22" ry="7" fill="#E0A100"/><ellipse cx="160" cy="108" rx="22" ry="7" fill="#F2B705"/></svg>',
 gesund:'<svg viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="124" rx="100" ry="8" fill="#0B1B33" opacity=".07"/><rect x="62" y="22" width="96" height="96" rx="22" fill="#fff" stroke="#0B1B33" stroke-width="2.5"/><path d="M110 46v48M86 70h48" stroke="#0E7490" stroke-width="12" stroke-linecap="round"/><path d="M28 112l24-30 14 18 18-34" stroke="#B3362D" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/><path d="M178 56C164 46 168 34 178 40 188 34 192 46 178 56z" fill="#B3362D"/></svg>',
 nachlass:'<svg viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="124" rx="100" ry="8" fill="#0B1B33" opacity=".07"/><rect x="58" y="16" width="86" height="106" rx="8" fill="#fff" stroke="#0B1B33" stroke-width="2.5"/><path d="M74 40h54M74 56h54M74 72h34" stroke="#0A4A9C" stroke-width="5" stroke-linecap="round"/><circle cx="128" cy="98" r="14" fill="#B3362D"/><path d="M121 108l-4 14 11-6 11 6-4-14" fill="#B3362D"/><circle cx="178" cy="70" r="14" fill="none" stroke="#E0A100" stroke-width="7"/><path d="M178 84v34M178 100h14M178 112h10" stroke="#E0A100" stroke-width="7" stroke-linecap="round"/></svg>',
 sach:'<svg viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="124" rx="100" ry="8" fill="#0B1B33" opacity=".07"/><polygon points="22,66 66,28 110,66" fill="#0A4A9C"/><rect x="30" y="66" width="72" height="54" fill="#fff" stroke="#0B1B33" stroke-width="2.5"/><rect x="58" y="88" width="16" height="32" fill="#DCE9F8" stroke="#0B1B33" stroke-width="2"/><path d="M122 112l8-22a8 8 0 0 1 7.500-5.500h30a8 8 0 0 1 7.500 5.500l8 22z" fill="#0E7490"/><rect x="118" y="110" width="84" height="12" rx="5" fill="#0B1B33"/><circle cx="138" cy="122" r="7" fill="#fff" stroke="#0B1B33" stroke-width="3"/><circle cx="182" cy="122" r="7" fill="#fff" stroke="#0B1B33" stroke-width="3"/></svg>',
 x:'<svg viewBox="0 0 220 140" aria-hidden="true"><ellipse cx="110" cy="124" rx="100" ry="8" fill="#0B1B33" opacity=".07"/><circle cx="70" cy="78" r="38" fill="#DCE9F8"/><circle cx="118" cy="70" r="30" fill="#0A4A9C" opacity=".9"/><circle cx="160" cy="88" r="22" fill="#0E7490" opacity=".85"/><path d="M40 112h150" stroke="#0B1B33" stroke-width="3" stroke-linecap="round"/></svg>'
};
function heroFor(s){
  var a=s.area||'',st=s.st||4,kick,ic,ill=s.ill||a||'x';
  if(st===1){kick='Ihre Situation';ic='users';ill='x'}
  else if(st===2){kick='Überblick';ic='layers';ill='x'}
  else if(st===3){kick='Schwerpunkte';ic='target';ill='x'}
  else if(st===5){kick='Ergebnis';ic='shieldok';ill='x'}
  else{kick=AREA_NM[a]||'Beratung';ic=AREA_IC[a]||'shieldok'}
  if(s.ill==='pflege'){kick=s.kick||'Pflege';ic='users'}
  if(s.ill==='bu'){kick='Einkommen absichern';ic='briefcase'}
  if(!ILLU[ill])ill='x';
  return {cls:'a-'+(a||'x'),kick:kick,ic:ic,ill:ILLU[ill]};
}

function ico(n,sz){return '<svg viewBox="0 0 24 24" width="'+(sz||22)+'" height="'+(sz||22)+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC[n]+'</svg>'}
function taskData(){
  var t=todayIso(),w=endOfWeekIso(),z=addDaysIso(t,14),items=[];
  db.todos.forEach(function(x){if(!x.done)items.push({kind:'todo',date:x.due||'',x:x})});
  db.angebote.forEach(function(a){if(isOpenAng(a))items.push({kind:'nach',date:a.nachfass||'',x:a})});
  function bucket(d){if(!d)return 'later';if(d<=t)return 'now';if(d<=w)return 'week';if(d<=z)return 'two';return 'later'}
  var g={now:[],week:[],two:[],later:[]};
  items.forEach(function(it){g[bucket(it.date)].push(it)});
  Object.keys(g).forEach(function(k){g[k].sort(function(a,b){return (a.date||'9999').localeCompare(b.date||'9999')||a.x.kunde.localeCompare(b.x.kunde)})});
  return {t:t,g:g,total:items.length};
}
function rowCls(k,it,t){return k==='now'?(it.date&&it.date<t?'late':'today'):k==='week'?'soon':'later'}
function viewAufgaben(){
  var d=taskData(),g=d.g,t=d.t;
  var F=[['alle','Alle',d.total],['now','Sofort',g.now.length],['week','Diese Woche',g.week.length],['two','2 Wochen',g.two.length],['later','Später',g.later.length]];
  var h='<div class="chips">'+F.map(function(f){return '<button class="chip" data-act="auffilter" data-f="'+f[0]+'" aria-pressed="'+(aufFilter===f[0])+'">'+f[1]+' '+f[2]+'</button>'}).join('')+'</div>';
  if(!d.total)return h+'<div class="empty">Noch nichts eingetragen.<br>Lege nach einem Termin deine To-dos, Angebote und Beratungen an.<div class="btnrow stack"><button class="btn primary" data-act="add">Ersten Eintrag anlegen</button></div></div>';
  var names={now:'Sofort',week:'Diese Woche',two:'In den nächsten 2 Wochen',later:'Später und ohne Datum'},shown=0;
  ['now','week','two','later'].forEach(function(k){
    if(aufFilter!=='alle'&&aufFilter!==k)return;if(!g[k].length)return;shown++;
    h+='<div class="group '+k+'">'+names[k]+'<span>'+g[k].length+'</span></div><div class="list">';
    g[k].forEach(function(it){h+=rowHtml(it,rowCls(k,it,t))});h+='</div>';
  });
  if(!shown)h+='<div class="empty">Nichts in diesem Zeitraum.</div>';
  var hh=hintsHtml();if(hh)h+='<h3 class="sub-h">Hinweise aus deinen Einträgen</h3>'+hh;
  return h;
}

/* ================= Krankenversicherung (PKV oder GKV mit Zusatz) und Anschreiben ================= */
var KV={jaeg:77400,bbg:69750,gkv:14.6,zus:2.9,pvAn:1.8,pvKind:0.25,pvGes:3.6,agMax:613.22,rv:8.55};
var KV_ENTW={years:[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026],pkv:[474,495,502,504,512,528,559,568,593,593,658,740],gkv:[747,775,805,814,853,891,929,934,977,1051,1174,1261]};
var STUFEN=[['','offen'],['keine','nicht versichert'],['gkv','Kassenleistung'],['zus','Zusatzversicherung'],['voll','Volle Erstattung']];
AMP.keine='nicht versichert';AMP.gkv='Kassenleistung';AMP.zus='Zusatzversicherung';AMP.voll='Volle Erstattung';
AMPC.keine=[179,54,45];AMPC.gkv=[184,105,10];AMPC.zus=[37,80,122];AMPC.voll=[44,122,87];
var KVWUENSCHE=['Chefarzt und Einbettzimmer','Freie Arztwahl','Schnelle Facharzttermine','Zahn und Brille','Beitrag im Alter','Familie und Kinder'];
var KVPRO=['Leistungen vertraglich garantiert','Chefarzt und Einbettzimmer möglich','Freie Arztwahl, oft schnellere Termine','Cashback bei Leistungsfreiheit','Zusatzversicherungen fallen weg','Beitragsentlastung im Alter'];
var KVCON=['Kinder haben eigene Beiträge','Beitrag hängt von Eintrittsalter und Gesundheit ab','Beitragsanpassungen sind möglich und nicht garantiert','Gesundheitsprüfung beim Eintritt','Rückkehr in die GKV später kaum möglich','Rechnung vorstrecken, dann erstatten lassen','Beitrag bleibt auch bei sinkendem Einkommen'];
var RATE=[['','Bewertung'],['wichtig','wichtig'],['egal','egal'],['sorge','Sorge']];
var KVROWS=['Arzt und Chefarzt','Krankenhaus (Zimmer und Chefarzt)','Zahn (Behandlung und Zahnersatz)','Brille, Heilpraktiker, Hilfsmittel','Cashback pro leistungsfreiem Jahr'];

function newAdv(k){
  var o={kunde:k||'',pdfName:'',mods:{alter:true,anlage:false,kv:false,sach:false,vorsorge:false,pflege:false,bu:false,zus:false},vp:vpNew(),bu:{fix:'',emr:'',has:''},zus:{pri:{},ist:{},beitrag:'',kosten:''},pf:{prio:[],pg:'3',kost:'',heim:'',mgH:'',mgS:'',bed:false,wo:'',partner:'',lage:{},ort:'',bestand:'',opt:{},offen:[],fragen:'',next:''},leben:{pos:'',kinder:false},folge:{text:'',notiz:''},gesp:{f1:'',f2:'',f3:'',klar:'',termin:''},wenn:{a:'',b:'',c:''},direct:false,kd:{gruppe:homeGruppe,fam:'',kinder:'',alter:'',beruf:'',netto:'',wohnen:''},ue:{},ent:{},top:[],wuensche:[],
    al:{alter:'',rentenalter:'67',lebenserw:'87',infl:'2',modus:'heute',gehalt:'',zielPct:'100',brutto:'',abzug:'15',rente:'',bav:'',ra:'5',re:'4',steuer:'',
      have:{s1:true,s2:false,s3:false},
      ru:{on:true,b:'',r:'',tOver:''},fp:{on:true,b:'',r:''},ad:{on:false,b:'',r:'',z:''},quelle:''},
    an:{alter:'',jahre:'',einmal:'',monat:'',szen:{low:'',mid:'',high:''},entnahme:'',vorteil:'',quelle:'',rows:anRowsFromKat()},
    kv:{brutto:'',kinder:'',zusKunde:'',zusKinder:'',zusbeitrag:'2,9',gkv:'',pers:[{tarif:'',b:''}],agz:'',cbOn:true,cb1:'1',cb2:'1,5',cb3:'2',
      rente:'',alterJahre:'',stg:'3',alterGesamt:'',zuschlag:'',tagegeld:'',entlastung:'',rvPct:'8,55',gkvAlter:'',
      pro:KVPRO.map(function(t){return {t:t,v:''}}),con:KVCON.map(function(t){return {t:t,v:''}})},
    brief:{anrede:'',betreff:'Ihre Beratung und die Angebote',besprochen:'',benoetigt:'',kennzahlen:true,anlagen:'Beratungsunterlage, Angebote',punkte:''},
    erg:'offen',grund:'',ber:'',fil:'',sach:{},ganz:{},sec:{zus:true,einstieg:true,leben:false,vp:true,pf:true,bu:true,ganz:false,rente:true,al_ist:true,al_zeit:true,al_loes:true,an:true,an_steuer:true,kv:true,kv_entw:true,kv_alter:true,kv_pc:true,sach:true,summe:true,notiz:true},notiz:'',wvDays:'30'};
  SACH.forEach(function(s){o.sach[s[0]]={on:false,rows:[],bIst:'',bSoll:'',tIst:'',tSoll:''}});
  o.sach.pkv={on:true,rows:rowsFromKat('pkv'),bIst:'',bSoll:'',tIst:'',tSoll:''};
  return o;
}
function steps(){
  var s=[['start','Grunddaten']];
  if(adv.mods.alter){s.push(['al_ist','Ist-Stand']);s.push(['al_loes','Lösungen'])}
  if(adv.mods.anlage)s.push(['an','Geldanlage']);
  if(adv.mods.kv)s.push(['kv','Krankenversicherung']);
  if(adv.mods.sach)s.push(['sach','Sachversicherungen']);
  if(adv.mods.zus)s.push(['zus','Krankenzusatz']);
  if(adv.mods.bu)s.push(['bu','Einkommen']);
  if(adv.mods.pflege)s.push(['pf','Pflege']);
  if(adv.mods.vorsorge)s.push(['vp','Vorsorge-Check']);
  s.push(['out','Ausgabe']);s.push(['brief','Anschreiben']);return s;
}

/* ---- Berechnung ---- */
function persName(i){return i===0?'Kunde':'Kind '+i}
function kvSyncPers(){
  var k=adv.kv,n=Math.max(0,Math.min(6,Math.round(nv(k.kinder)||0))),want=n+1;
  while(k.pers.length<want)k.pers.push({tarif:'',b:''});
  if(k.pers.length>want)k.pers.length=want;
}
function sgn(x){return (x>=0?'+':'-')+eur(Math.abs(x))}
function calcKv(){
  var k=adv.kv,b=nv(k.brutto),n=nv(k.kinder);if(isNaN(n)||n<0)n=0;n=Math.round(n);
  if(!(b>0))return {err:'Bitte das Brutto-Jahreseinkommen eintragen.'};
  var zb=nv(k.zusbeitrag);if(isNaN(zb))zb=KV.zus;
  var base=Math.min(b,KV.bbg)/12,kvAn=base*(KV.gkv+zb)/2/100,pvR=KV.pvAn-Math.max(0,Math.min(n,5)-1)*KV.pvKind,pvAn=base*pvR/100;
  var est=kvAn+pvAn,man=nv(k.gkv),gkv=isFinite(man)?man:est;
  var zk=nv(k.zusKunde),zn=nv(k.zusKinder);if(isNaN(zk))zk=0;if(isNaN(zn))zn=0;
  var o={err:'',b:b,n:n,ueber:b>KV.jaeg,est:est,estUsed:!isFinite(man),gkv:gkv,zk:zk,zn:zn,A:gkv+zk+zn,hasPkv:false};
  kvSyncPers();
  var tot=0,kopf=NaN,kind=0;
  k.pers.forEach(function(p,i){var v=nv(p.b);if(isFinite(v)){tot+=v;if(i===0)kopf=v;else kind+=v}});
  if(isFinite(kopf)){
    var ag=nv(k.agz),agz=isFinite(ag)?ag:Math.min(tot/2,KV.agMax),eigen=tot-agz,fk=tot>0?eigen*kopf/tot:eigen;
    var cb=[1,1.5,2];['cb1','cb2','cb3'].forEach(function(key,i){var v=nv(k[key]);if(isFinite(v))cb[i]=v});
    o.hasPkv=true;o.tot=tot;o.kopf=kopf;o.kind=kind;o.agz=agz;o.eigen=eigen;o.fk=fk;o.fn=eigen-fk;o.cb=cb;o.cbOn=!!k.cbOn;
    o.eff=cb.map(function(f){return k.cbOn?eigen-f*tot/12:eigen});
  }
  return o;
}
function calcKvAlter(){
  var k=adv.kv,c=calcKv();if(c.err)return {err:c.err};
  var man=nv(k.alterGesamt),J=nv(k.alterJahre),st=nv(k.stg);if(isNaN(st))st=3;
  var ges;
  if(isFinite(man))ges=man;
  else if(c.hasPkv&&J>=0)ges=c.kopf*Math.pow(1+st/100,J);
  else return {err:'Bitte PKV-Beitrag, Jahre bis zur Rente (oder den Gesamtbeitrag im Alter) eintragen.'};
  function g(x){x=nv(x);return isFinite(x)?x:0}
  var zu=g(k.zuschlag),tg=g(k.tagegeld),en=g(k.entlastung),rente=nv(k.rente),pct=nv(k.rvPct);if(isNaN(pct))pct=KV.rv;
  var rvz=isFinite(rente)?Math.min(rente*pct/100,Math.max(0,(ges-zu-tg-en)/2)):0;
  var end=Math.max(0,ges-zu-tg-en-rvz),zb=nv(k.zusbeitrag);if(isNaN(zb))zb=KV.zus;
  var gm=nv(k.gkvAlter),gA=isFinite(gm)?gm:(isFinite(rente)&&rente>0?Math.min(rente,KV.bbg/12)*((KV.gkv+zb)/2+KV.pvGes)/100:NaN);
  return {err:'',ges:ges,zu:zu,tg:tg,en:en,rvz:rvz,end:end,gA:gA,st:st,J:J,manual:isFinite(man),gEst:!isFinite(gm)};
}

/* ---- Diagramme ---- */
function chartKv(c){
  var bars=[{label:'GKV bleiben mit Zusatz',segs:[{v:c.gkv,c:'#25507A',t:'GKV-Beitrag'},{v:c.zk,c:'#B8690A',t:'Zusatz Kunde'},{v:c.zn,c:'#6B4FA0',t:'Zusatz Kinder'}]}];
  if(c.hasPkv){
    bars.push({label:'PKV Eigenanteil',segs:[{v:c.fk,c:'#1F7A8C',t:'PKV Kunde (nach Zuschuss)'},{v:c.fn,c:'#2C7A57',t:'PKV Kinder (nach Zuschuss)'}]});
    if(c.cbOn)bars.push({label:'PKV effektiv ab Jahr 3',segs:[{v:c.eff[2],c:'#1B2F66',t:'PKV effektiv mit Cashback'}]});
  }
  return stackedBars(bars,{title:'Monatsbeitrag im Vergleich',unit:'Euro pro Monat, Arbeitnehmeranteil nach Arbeitgeberzuschuss'});
}
function chartEntw(){
  var D=KV_ENTW,W=1100,H=600,k=cv(W,H),x=k.x,L=80,R=40,T=210,B=110,pw=W-L-R,ph=H-T-B,mx=1400,n=D.years.length,gap=pw/n,bw=gap*0.66;
  x.fillStyle='#16202A';x.font='bold 27px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Beitragsentwicklung: PKV gegen GKV',L-30,40);
  x.font='18px '+FONT;x.fillStyle='#5B6773';x.fillText('Beispiel: Mann, Versicherungsbeginn 2014, Eintrittsalter 35, Monatsbeiträge in Euro',L-30,68);
  x.fillText('Entwicklung der Vergangenheit, keine Prognose',L-30,92);
  x.textBaseline='middle';
  for(var i=0;i<=7;i++){var yv=mx*i/7,y=T+ph-ph*i/7;x.strokeStyle='#E3E8ED';x.lineWidth=1;x.beginPath();x.moveTo(L,y);x.lineTo(W-R,y);x.stroke();x.fillStyle='#5B6773';x.textAlign='right';x.font='17px '+FONT;x.fillText(nf.format(yv),L-10,y)}
  function yy(v){return T+ph-v/mx*ph}
  D.years.forEach(function(yr,j){
    var cx=L+gap*(j+0.5),h=D.pkv[j]/mx*ph;x.fillStyle='#1B2F66';x.fillRect(cx-bw/2,T+ph-h,bw,h);
    x.fillStyle='#fff';x.font='bold 19px '+FONT;x.textAlign='center';x.fillText(String(D.pkv[j]),cx,T+ph-h/2+(j===0?0:0));
    x.fillStyle='#16202A';x.font='18px '+FONT;x.fillText(String(yr),cx,T+ph+24);
  });
  x.strokeStyle='#F28C28';x.lineWidth=5;x.beginPath();
  D.gkv.forEach(function(v,j){var cx=L+gap*(j+0.5);if(j===0)x.moveTo(cx,yy(v));else x.lineTo(cx,yy(v))});x.stroke();
  D.gkv.forEach(function(v,j){var cx=L+gap*(j+0.5);x.fillStyle='#F28C28';x.beginPath();x.arc(cx,yy(v),8,0,Math.PI*2);x.fill();x.fillStyle='#16202A';x.font='bold 19px '+FONT;x.textAlign='center';x.fillText(String(v),cx,yy(v)-22)});
  var dG=D.gkv[n-1]-D.gkv[0],dP=D.pkv[n-1]-D.pkv[0];
  function tag(px,py,t1,t2,col){rrect(x,px,py,300,66,14,'#FFF3DC');x.fillStyle=col;x.textAlign='center';x.font='bold 20px '+FONT;x.fillText(t1,px+150,py+24);x.font='bold 26px '+FONT;x.fillText(t2,px+150,py+50)}
  tag(W-R-300,112,'Mehrbeitrag in der GKV',nf.format(dG)+' €','#B3362D');
  tag(W-R-300-320,112,'Mehrbeitrag in der PKV',nf.format(dP)+' €','#1B2F66');
  var lx=L,ly=H-30;x.fillStyle='#1B2F66';x.fillRect(lx,ly-9,18,18);x.fillStyle='#16202A';x.font='18px '+FONT;x.textAlign='left';x.fillText('PKV',lx+26,ly);
  x.fillStyle='#F28C28';x.fillRect(lx+110,ly-9,18,18);x.fillStyle='#16202A';x.fillText('GKV',lx+136,ly);
  x.fillStyle='#5B6773';x.font='16px '+FONT;x.textAlign='right';x.fillText('Quelle: Beispielrechnung der Gesellschaft',W-R,ly);
  return k.c;
}
function chartAlter(a){
  var items=[{l:'Gesamtbeitrag im Alter',v:a.ges,tot:true,c:'#1B2F66'}];
  [['Gesetzlicher Zuschlag (ab 61)',a.zu],['Krankentagegeld entfällt',a.tg],['Beitragsentlastung (ab 65)',a.en],['Zuschuss der Rentenversicherung',a.rvz]].forEach(function(z){if(z[1]>0)items.push({l:z[0],v:-z[1],c:'#2C7A57'})});
  items.push({l:'Beitrag im Alter (PKV)',v:a.end,tot:true,c:'#1F7A8C'});
  if(isFinite(a.gA))items.push({l:a.gEst?'GKV im Alter (Schätzung)':'GKV im Alter',v:a.gA,tot:true,c:'#B8690A'});
  var W=1100,H=580,k=cv(W,H),x=k.x,L=90,R=30,T=90,B=130,pw=W-L-R,ph=H-T-B,n=items.length,gap=pw/n,bw=Math.min(130,gap*0.7);
  var mxv=niceMax(Math.max(a.ges,isFinite(a.gA)?a.gA:0,1)*1.08);
  x.fillStyle='#16202A';x.font='bold 26px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Beitrag im Ruhestand',L-50,36);
  x.font='19px '+FONT;x.fillStyle='#5B6773';x.fillText('Euro pro Monat, Modellrechnung ohne Garantie',L-50,62);
  x.textBaseline='middle';
  for(var i=0;i<=5;i++){var yv=mxv*i/5,y=T+ph-ph*i/5;x.strokeStyle='#E3E8ED';x.lineWidth=1;x.beginPath();x.moveTo(L,y);x.lineTo(W-R,y);x.stroke();x.fillStyle='#5B6773';x.textAlign='right';x.font='18px '+FONT;x.fillText(nf.format(yv),L-10,y)}
  function yy(v){return T+ph-v/mxv*ph}
  var run=0;
  items.forEach(function(it,j){
    var cx=L+gap*(j+0.5),top,bot;
    if(it.tot){top=it.v;bot=0;run=it.v}else{top=run;bot=run+it.v;run=bot}
    x.fillStyle=it.c;x.fillRect(cx-bw/2,yy(top),bw,Math.max(2,yy(bot)-yy(top)));
    x.fillStyle='#16202A';x.font='bold 20px '+FONT;x.textAlign='center';x.fillText((it.tot?'':'-')+nf.format(Math.abs(Math.round(it.v)))+' €',cx,yy(top)-16);
    x.font='17px '+FONT;x.textBaseline='alphabetic';wrapTxt(x,it.l,cx,T+ph+28,gap-10,21,'center');x.textBaseline='middle';
  });
  return k.c;
}

/* ---- Formulare ---- */
function stufeSel(path,val){return '<select data-adv="'+path+'" data-amp="'+esc(val)+'" aria-label="Leistungsstufe">'+STUFEN.map(function(s){return '<option value="'+s[0]+'"'+(s[0]===val?' selected':'')+'>'+s[1]+'</option>'}).join('')+'</select>'}
function kvRowHtml(r,i){
  var b='sach.pkv.rows.'+i;
  return '<div class="mrow"><div class="mname"><input type="text" data-adv="'+b+'.name" value="'+esc(r.name)+'" maxlength="90" aria-label="Leistung"><button class="x" data-act="adv-row-del" data-sp="pkv" data-i="'+i+'" aria-label="Zeile entfernen">×</button></div>'+
    '<div class="mcols"><div><small>Heute (GKV mit Zusatz)</small>'+stufeSel(b+'.ist.s',r.ist.s)+'<input type="text" data-adv="'+b+'.ist.t" value="'+esc(r.ist.t)+'" maxlength="80" placeholder="Angabe" aria-label="Angabe heute"></div>'+
    '<div><small>Neuer Tarif (PKV)</small>'+stufeSel(b+'.soll.s',r.soll.s)+'<input type="text" data-adv="'+b+'.soll.t" value="'+esc(r.soll.t)+'" maxlength="80" placeholder="Angabe" aria-label="Angabe neu"></div></div></div>';
}
function kvRowsForm(){
  var d=adv.sach.pkv;
  return '<div class="grid2">'+fld('sach.pkv.tIst','Heute',{mode:'text',max:60,ph:'z. B. GKV mit Zusatz'})+fld('sach.pkv.tSoll','Neuer Tarif',{mode:'text',max:60})+'</div>'+
    d.rows.map(function(r,i){return kvRowHtml(r,i)}).join('')+
    '<div class="btnrow" style="margin-top:8px"><button class="btn small" data-act="adv-row-add" data-sp="pkv">Zeile hinzufügen</button><button class="btn small" data-act="adv-row-reset" data-sp="pkv" data-confirm="Zeilen neu laden?">Zeilen neu laden</button></div>';
}
function kvEck(){
  return '<div class="grid2">'+fld('kv.brutto','Brutto-Jahreseinkommen',{unit:'€'})+fld('kv.kinder','Kinder unter 25',{unit:'Anzahl'})+fld('kv.zusKunde','Zusatzversicherung Kunde',{unit:'€ / Monat'})+fld('kv.zusKinder','Zusatzversicherung Kinder',{unit:'€ / Monat'})+'</div>'+
    '<details class="adv"><summary>GKV-Beitrag und Annahmen</summary><div class="grid2">'+fld('kv.zusbeitrag','Zusatzbeitrag der Kasse',{unit:'%'})+fld('kv.gkv','GKV-Beitrag laut Abrechnung',{unit:'€ / Monat',hint:'Arbeitnehmeranteil inkl. Pflege. Leer lassen für die Schätzung.'})+'</div></details>';
}
function kvPersHtml(){
  kvSyncPers();
  return adv.kv.pers.map(function(p,i){return '<div class="sh2">'+persName(i)+'</div><div class="grid2">'+fld('kv.pers.'+i+'.tarif','Tarif',{mode:'text',max:50})+fld('kv.pers.'+i+'.b','Beitrag',{unit:'€ / Monat'})+'</div>'}).join('');
}
function kvKosten(){
  return '<div id="kvpers">'+kvPersHtml()+'</div>'+
    fld('kv.agz','Arbeitgeberzuschuss (optional)',{unit:'€ / Monat',hint:'Sonst Schätzung: Hälfte des Gesamtbeitrags, höchstens '+eur(KV.agMax)+' (2026). Genauer Wert laut Arbeitgeber.'})+
    chk('kv.cbOn','Cashback bei Leistungsfreiheit berücksichtigen')+
    '<details class="adv"><summary>Cashback-Staffel (Monatsbeiträge je leistungsfreiem Jahr)</summary><div class="grid2">'+fld('kv.cb1','1. Jahr',{unit:'MB'})+fld('kv.cb2','2. Jahr',{unit:'MB'})+fld('kv.cb3','ab 3. Jahr',{unit:'MB'})+'</div><p class="hint-t">MB = Monatsbeitrag. Berechnet vom Gesamtbeitrag, vereinfacht und ohne Garantie.</p></details>'+
    fld('kv.quelle','Hinweis zur Berechnung',{mode:'text',max:120,ph:'z. B. Berechnung der Gesellschaft, Stand 10/2026'});
}
function kvAlterForm(){
  return '<div class="grid2">'+fld('kv.rente','Bruttorente (Annahme)',{unit:'€ / Monat'})+fld('kv.alterJahre','Jahre bis zur Rente',{unit:'Jahre'})+fld('kv.stg','Beitragssteigerung',{unit:'% p. a.'})+fld('kv.alterGesamt','Gesamtbeitrag im Alter',{unit:'€ / Monat',hint:'Optional, sonst hochgerechnet'})+'</div>'+
    '<div class="grid2">'+fld('kv.zuschlag','Gesetzlicher Zuschlag (ab 61)',{unit:'€ / Monat'})+fld('kv.tagegeld','Krankentagegeld entfällt',{unit:'€ / Monat'})+fld('kv.entlastung','Beitragsentlastung (ab 65)',{unit:'€ / Monat'})+fld('kv.rvPct','Zuschuss Rentenversicherung',{unit:'% der Rente',hint:'2026 laut Rentenversicherung 8,55 %'})+'</div>'+
    fld('kv.gkvAlter','GKV im Alter (optional)',{unit:'€ / Monat',hint:'Sonst Schätzung aus der Rente'});
}
function kvListHtml(key){
  return adv.kv[key].map(function(r,i){
    var b='kv.'+key+'.'+i,am=r.v;
    return '<div class="mrow"><div class="mname"><input type="text" data-adv="'+b+'.t" value="'+esc(r.t)+'" maxlength="90" aria-label="Punkt"><button class="x" data-act="adv-kvl-del" data-l="'+key+'" data-i="'+i+'" aria-label="Zeile entfernen">×</button></div>'+
      '<select data-adv="'+b+'.v" data-amp="'+am+'" aria-label="Bewertung des Kunden">'+RATE.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===r.v?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>';
  }).join('')+'<div class="btnrow" style="margin-top:8px"><button class="btn small" data-act="adv-kvl-add" data-l="'+key+'">Punkt hinzufügen</button></div>';
}
function fKv(){
  return '<h3 class="sh">Krankenversicherung</h3>'+kvEck()+'<div class="sh2">PKV-Beiträge pro Person</div>'+kvKosten()+
    '<div class="sh2">Leistungen im Vergleich</div>'+kvRowsForm()+'<div class="sh2">Im Alter</div>'+kvAlterForm()+
    '<div class="sh2">Vorteile eines Wechsels, Einschätzung des Kunden</div>'+kvListHtml('pro')+'<div class="sh2">Nachteile und Risiken, Einschätzung des Kunden</div>'+kvListHtml('con');
}

/* ---- Ergebnisse ---- */
function jaegNote(c){
  return c.ueber?'<div class="note ok">Das Einkommen liegt über der Versicherungspflichtgrenze 2026 ('+eur(KV.jaeg)+' im Jahr). Ein Wechsel in die PKV ist möglich, wenn das Einkommen auch im laufenden Jahr voraussichtlich darüber liegt.</div>':'<div class="note">Das Einkommen liegt unter der Versicherungspflichtgrenze 2026 ('+eur(KV.jaeg)+' im Jahr). Als Angestellter ist ein Wechsel in die PKV dann nicht möglich.</div>';
}
function kvAusgang(c){
  var h='<div class="stats">'+stat('GKV bleiben mit Zusatz',eur(c.A),'pro Monat')+stat('GKV-Beitrag',eur(c.gkv),c.estUsed?'Schätzung, Arbeitnehmeranteil inkl. Pflege':'laut Abrechnung')+stat('Zusatzversicherungen',eur(c.zk+c.zn),'Kunde '+eur(c.zk)+', Kinder '+eur(c.zn))+'</div>';
  if(c.n>0)h+='<div class="note">In der GKV sind die Kinder in der Regel beitragsfrei familienversichert. In der PKV hat jedes Kind einen eigenen Beitrag.</div>';
  return jaegNote(c)+h;
}
function kvRes(){
  var c=calcKv();if(c.err)return '<div class="note">'+esc(c.err)+'</div>';
  var h=kvAusgang(c);
  if(!c.hasPkv)return h+'<div class="note">Trage den PKV-Beitrag des Kunden ein, dann erscheint der Vergleich.</div>';
  var d=c.eigen-c.A;
  h+='<div class="stats">'+stat('PKV Eigenanteil',eur(c.eigen),'Gesamtbeitrag '+eur(c.tot)+', Arbeitgeberzuschuss '+eur(c.agz))+stat('Unterschied zu GKV mit Zusatz',sgn(d),'pro Monat',d<=0?'good':'bad')+'</div>';
  if(c.cbOn)h+='<div class="stats">'+stat('Effektiv Jahr 1',eur(c.eff[0]),'mit Cashback')+stat('Effektiv Jahr 2',eur(c.eff[1]),'mit Cashback')+stat('Effektiv ab Jahr 3',eur(c.eff[2]),'mit Cashback','good')+'</div>';
  return h+'<div class="chartbox" data-c="kv"></div><p class="hint-t">Beitragsanpassungen sind in GKV und PKV möglich und nicht garantiert. Cashback vereinfacht vom Gesamtbeitrag gerechnet.</p>';
}
function alterRes(){
  var a=calcKvAlter();if(a.err)return '<div class="note">'+esc(a.err)+'</div>';
  var h='<div class="stats">'+stat('Gesamtbeitrag im Alter',eur(a.ges),a.manual?'manuell eingetragen':'hochgerechnet mit '+pctS(a.st/100)+' pro Jahr')+stat('Beitrag im Alter (PKV)',eur(a.end),'pro Monat','good')+(isFinite(a.gA)?stat(a.gEst?'GKV im Alter (Schätzung)':'GKV im Alter',eur(a.gA),'pro Monat'):'')+'</div>';
  h+='<div class="chartbox" data-c="alter"></div>';
  h+='<div class="note">Beitragssteigerungen kann niemand garantieren, weder in der PKV noch in der GKV. Auch der GKV-Beitrag steigt, etwa durch die steigende Beitragsbemessungsgrenze und höhere Zusatzbeiträge. In der PKV verringern Zuschlag, Beitragsentlastung, Zuschuss der Rentenversicherung und das wegfallende Krankentagegeld den Beitrag im Alter.</div>';
  return h;
}
function entwRes(){
  var D=KV_ENTW,n=D.years.length;
  return '<div class="chartbox" data-c="entw"></div><div class="note">Das Beispiel zeigt die Vergangenheit eines Tarifs und ist keine Prognose. Auch die PKV-Beiträge sind zuletzt gestiegen (2025: '+D.pkv[n-2]+' €, 2026: '+D.pkv[n-1]+' €).</div>';
}

/* ---- Folien ---- */
function kvSlides(){
  var S=[];
  S.push({title:'Wo sind Sie heute versichert?',text:P('Sie sind gesetzlich versichert, vielleicht mit Zusatzversicherungen. Schauen wir, ob das für Sie und Ihre Familie noch die beste Lösung ist.')+Q('Was ist Ihnen bei Ihrer Krankenversicherung wichtig? Tippen Sie an, was zutrifft.'),form:function(){return chipsHtml(KVWUENSCHE)},
    tip:'Die Wünsche des Kunden im Fazit wieder aufgreifen. Frage nach Erfahrungen mit Wartezeiten und Zuzahlungen.'});
  S.push({title:'Die gesetzliche Krankenversicherung',text:BUL(['Der Beitrag richtet sich nach dem <b>Einkommen</b>: 14,6 % plus Zusatzbeitrag (durchschnittlich 2,9 %), Arbeitgeber und Arbeitnehmer zahlen je die Hälfte, höchstens bis 5.812,50 € Einkommen im Monat (2026).','Die Leistungen legt der <b>Gesetzgeber</b> fest. Chefarzt, Einbettzimmer, hochwertiger Zahnersatz oder Brille gibt es nur über Zusatzversicherungen.','Ehepartner ohne Einkommen und <b>Kinder</b> sind in der Regel beitragsfrei familienversichert.','Dazu kommt die Pflegeversicherung mit 3,6 %, Eltern mit mehreren Kindern zahlen weniger.'])+Q('Wie viel zahlen Sie heute insgesamt für Krankenversicherung und Zusatzversicherungen?'),
    tip:'Stand der Werte: 10/2026 (Beitragsbemessungsgrenze, Zusatzbeitrag, Pflegeversicherung). Vor Terminen prüfen.'});
  S.push({title:'Ihre Ausgangslage',text:P('Wir rechnen mit Ihren Zahlen. Die Beiträge in der GKV schätzen wir, Sie können den echten Wert aus der Gehaltsabrechnung eintragen.'),form:kvEck,live:function(){var c=calcKv();return c.err?'<div class="note">'+esc(c.err)+'</div>':kvAusgang(c)},
    tip:'JAEG-Check beachten. Zusatzversicherungen bei der Gesellschaft entfallen bei einem Wechsel in die PKV. Für Kinder prüfen, ob eine Familienversicherung in der GKV überhaupt greift.'});
  S.push({title:'Die private Krankenversicherung',text:BUL(['Der Beitrag richtet sich nach <b>Alter bei Eintritt, Gesundheit und Leistung</b>, nicht nach dem Einkommen.','Die Leistungen sind <b>vertraglich garantiert</b> und lassen sich auswählen.','Alterungsrückstellungen sorgen dafür, dass der Beitrag im Alter bezahlbar bleibt. Beitragsanpassungen sind trotzdem möglich.','Der Arbeitgeber zahlt einen <b>Zuschuss</b>: die Hälfte des Beitrags, höchstens 613,22 € im Monat (2026).','Jedes <b>Kind hat einen eigenen Beitrag</b>. Vor dem Eintritt gibt es eine Gesundheitsprüfung.','Ein Wechsel als Angestellter ist nur möglich, wenn das Einkommen über <b>6.450 € im Monat (77.400 € im Jahr)</b> liegt.']),
    tip:'Ehrlich bleiben bei Kindern, Gesundheitsprüfung und Rückkehr in die GKV. Das schafft Vertrauen und dokumentiert die Beratung.'});
  S.push({title:'Leistungen im Vergleich',text:P('Was bekommen Sie heute, was bekämen Sie in der PKV? Wählen Sie je Leistung die Stufe aus.'),form:kvRowsForm,tip:'Je Zeile heute und neu auswählen: nicht versichert, Kassenleistung, Zusatzversicherung oder volle Erstattung. Zeilen lassen sich ändern und ergänzen.'});
  S.push({title:'Beitrag: GKV bleiben oder PKV?',text:P('Hier stehen die Kosten nebeneinander. Mit Zusatzversicherungen für Sie und die Kinder und mit dem Cashback der PKV.'),form:kvKosten,live:kvRes,tip:'PKV-Beiträge je Person aus der Berechnung der Gesellschaft eintragen. Die Zusatzversicherungen stehen bei GKV bleiben, in der PKV entfallen sie.'});
  S.push({title:'Die Beitragsentwicklung',text:Q('Was würden Sie erwarten: Wie entwickeln sich Beiträge über die Jahre?'),live:entwRes,tip:'Botschaft: im Beispiel stieg die GKV stärker. Zugleich klar sagen: Vergangenheit, kein Versprechen, und die PKV ist zuletzt auch gestiegen.'});
  S.push({title:'Und im Alter?',text:P('Die PKV wird im Alter nicht automatisch teurer. Einige Bausteine verringern den Beitrag.'),form:kvAlterForm,live:alterRes,tip:'Beitragssteigerung nicht garantierbar, aber die GKV steigt ebenfalls. Vergleich ehrlich zeigen, auch wenn die GKV im Alter günstiger sein kann.'});
  S.push({title:'Was spricht für den Wechsel?',text:Q('Was davon ist Ihnen wichtig? Bewerten Sie jeden Punkt.'),form:function(){return kvListHtml('pro')},tip:'Der Kunde gewichtet selbst: wichtig, egal oder Sorge. Eigene Punkte lassen sich ergänzen.'});
  S.push({title:'Nachteile und Risiken',text:Q('Was davon beschäftigt Sie? Bewerten Sie jeden Punkt.'),form:function(){return kvListHtml('con')},tip:'Jede Sorge im Gespräch klären. Das PDF hält fest, was besprochen wurde. Es ersetzt dein Beratungsprotokoll nicht.'});
  return S;
}

/* ---- Anschreiben ---- */
function sigText(){return (db.settings&&db.settings.signatur)||''}
function letterFacts(){
  var f=[];
  if(adv.mods.alter){var c=calcAl();if(!c.err){var s='Altersvorsorge: Versorgungslücke heute '+eur(c.lueckeHeute)+' pro Monat';if(c.prods.length)s+=', mit unserer Lösung '+eur(c.lueckeNach)+', Beiträge '+eur(c.sumB)+' pro Monat';f.push(s)}}
  if(adv.mods.anlage){var a=calcAn();if(!a.err)f.push('Fondspolice: '+(a.m>0?eur(a.m)+' pro Monat':'')+(a.e>0?(a.m>0?' plus ':'')+eur(a.e)+' einmalig':'')+', Laufzeit '+a.j+' Jahre')}
  if(adv.mods.kv){var k=calcKv();if(!k.err){var t='Krankenversicherung: GKV mit Zusatzversicherungen etwa '+eur(k.A)+' pro Monat';if(k.hasPkv){t+=', private Krankenversicherung '+eur(k.eigen)+' pro Monat nach Arbeitgeberzuschuss';if(k.cbOn)t+=' (effektiv '+eur(k.eff[2])+' mit Cashback ab dem dritten leistungsfreien Jahr)'}f.push(t)}}
  if(adv.mods.sach){var ss=sachStats();if(ss.length)f.push('Sachversicherungen: '+ss.map(function(x){return x.name}).join(', '))}
  return f;
}
function mdPlain(t){return String(t).replace(/\*\*(.+?)\*\*/g,'$1')}
function mdHtml(t){return esc(String(t)).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}
function lines(t){return String(t||'').split('\n').map(function(x){return x.trim()}).filter(function(x){return x})}
function bulletLines(t){return lines(t).map(function(x){return x.replace(/^[\-•*]\s+/,'')})}
function buildLetter(){
  var b=adv.brief,d=fmtFull(todayIso()),an=b.anrede.trim(),B=[];
  B.push({p:[an?(/,$/.test(an)?an:an+','):'Guten Tag,']});
  B.push({p:['vielen Dank für das persönliche Gespräch am '+d+'. Wie besprochen sende ich Ihnen die Unterlagen zu.']});
  if(b.besprochen.trim())B.push({p:lines(b.besprochen)});
  var pk=bulletLines(b.punkte);
  if(pk.length)B.push({p:['Das Wichtigste in Kürze:'],ul:pk,hd:true});
  if(b.kennzahlen){var kz=letterFacts();if(kz.length)B.push({p:['Die wichtigsten Zahlen aus unserem Gespräch:'],ul:kz,hd:true})}
  var bn=bulletLines(b.benoetigt);
  if(bn.length)B.push({p:['Dafür benötige ich noch von Ihnen:'],ul:bn,hd:true});
  B.push({p:['Bei Fragen melde ich mich gerne bei Ihnen, oder Sie rufen mich einfach an.']});
  var sg=sigText().trim(),cl=['Mit freundlichen Grüßen'];if(sg)cl=cl.concat(['']).concat(lines(sg));
  B.push({p:cl,sig:true});
  if(b.anlagen.trim())B.push({p:['Anlagen: '+b.anlagen.trim()]});
  var T=[],H=[];
  B.forEach(function(x,i){
    if(i)T.push('');
    x.p.forEach(function(l){T.push(mdPlain(l))});
    (x.ul||[]).forEach(function(l){T.push('- '+mdPlain(l))});
    var ph=x.p.map(function(l){return l===''?'':mdHtml(l)});
    var h='<p style="margin:0 0 12px 0">'+(x.hd?'<b>'+ph.join('<br>')+'</b>':ph.join('<br>'))+'</p>';
    if(x.ul)h+='<ul style="margin:0 0 12px 0;padding-left:22px">'+x.ul.map(function(l){return '<li style="margin:0 0 4px 0">'+mdHtml(l)+'</li>'}).join('')+'</ul>';
    H.push(h);
  });
  return {subject:b.betreff.trim()||'Ihre Beratung und die Angebote',text:T.join('\n'),html:'<div style="font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#16202A">'+H.join('')+'</div>'};
}
var BRIEF_CHIPS={besprochen:[['GKV oder PKV','Wir haben besprochen, ob Sie in der gesetzlichen Krankenversicherung bleiben und Zusatzversicherungen abschließen oder in die private Krankenversicherung wechseln.'],['Angebot A','Angebot A: Sie bleiben in der GKV und schließen Zusatzversicherungen ab.'],['Angebot B','Angebot B: Wechsel in die private Krankenversicherung.']],
  benoetigt:[['Antrag','- Die ausgefüllten und unterschriebenen Antragsunterlagen'],['Gesundheitsfragen','- Ihre Angaben zu den Gesundheitsfragen'],['Rückmeldung','- Ihre Rückmeldung, für welches Angebot Sie sich entscheiden']]};
function briefChips(f){return '<div class="chips">'+BRIEF_CHIPS[f].map(function(c){return '<button class="chip" data-act="adv-brief-add" data-f="'+f+'" data-t="'+esc(c[1])+'">'+esc(c[0])+'</button>'}).join('')+'</div>'}
function punkteSug(){
  var o=[];
  if(adv.mods.kv){o.push('Bei einem Wechsel in die PKV entfallen Ihre Zusatzversicherungen.');o.push('Der Arbeitgeber zahlt einen **Zuschuss** zum PKV-Beitrag.');o.push('Mit **Cashback** sinkt der effektive Beitrag bei Leistungsfreiheit.');o.push('Beitragsanpassungen sind in GKV und PKV möglich und nicht garantiert.');o.push('In der PKV hat jedes Kind einen eigenen Beitrag.')}
  if(adv.mods.alter){var c=calcAl();if(!c.err&&c.lueckeHeute>0)o.push('Ihre **Versorgungslücke** liegt bei '+eur(c.lueckeHeute)+' pro Monat (heutige Kaufkraft).');o.push('Je früher Sie starten, desto kleiner ist die nötige Sparrate.')}
  if(adv.mods.anlage)o.push('Die steuerlichen Vorteile der Fondspolice hängen von Laufzeit und Auszahlungsalter ab, Details im Angebot.');
  if(adv.mods.sach)o.push('Die **Leistungslücken** Ihrer bisherigen Verträge sind in der Gegenüberstellung markiert.');
  o.push('Bitte schauen Sie sich die Angebote in Ruhe an, ich melde mich in einigen Tagen.');
  return o;
}
function punkteChips(){return '<div class="chips">'+punkteSug().map(function(t){var l=mdPlain(t);return '<button class="chip" data-act="adv-brief-add" data-f="punkte" data-t="'+esc('- '+t)+'">'+esc(l.length>46?l.slice(0,44)+'…':l)+'</button>'}).join('')+'</div>'}
function fBrief(){
  var b=adv.brief;
  return '<h3 class="sh">Mail vorbereiten</h3><p class="hint-t">Erzeugt Betreff und Text für die E-Mail an den Kunden. Die Angebote und die Beratungsunterlage hängst du im Mailprogramm selbst an. Die Texte dieses Schritts werden nicht gespeichert, auch nicht in der Beratungsdatei. Eine Empfängeradresse brauchst du hier nicht einzutragen.</p>'+
    fld('brief.anrede','Anrede',{mode:'text',max:80,ph:'z. B. Sehr geehrter Herr Muster'})+
    fld('brief.betreff','Betreff',{mode:'text',max:100})+
    '<label class="fl"><span>Was wir besprochen haben</span><textarea data-adv="brief.besprochen" maxlength="1200" placeholder="z. B. Frage: in der GKV bleiben und für die Kinder Zusatzversicherungen (ca. 50 € im Monat) abschließen, oder in die PKV wechseln?">'+esc(b.besprochen)+'</textarea></label>'+briefChips('besprochen')+
    '<label class="fl"><span>Punkte, die ich hervorheben möchte</span><textarea data-adv="brief.punkte" maxlength="1500" placeholder="Ein Punkt pro Zeile. Mit **zwei Sternchen** wird ein Wort fett.">'+esc(b.punkte)+'</textarea><small>Ein Punkt pro Zeile. Mit **Sternchen** setzt du Wörter fett (in der formatierten Mail).</small></label>'+punkteChips()+
    '<label class="fl"><span>Das benötige ich von Ihnen</span><textarea data-adv="brief.benoetigt" maxlength="800" placeholder="z. B. Antrag unterschrieben zurück">'+esc(b.benoetigt)+'</textarea></label>'+briefChips('benoetigt')+
    '<div class="sh2">KI-Hilfe</div><div id="kiwrap">'+kiWrapHtml()+'</div>'+
    chk('brief.kennzahlen','Kennzahlen aus der Beratung ergänzen')+
    fld('brief.anlagen','Anlagen',{mode:'text',max:140})+
    '<label class="fl"><span>Absender</span><textarea data-sig="1" maxlength="300" placeholder="Name, Gesellschaft, Telefon">'+esc(sigText())+'</textarea><small>Bleibt auf diesem Gerät für alle Mails gespeichert. Das sind nur deine Daten.</small></label>'+
    '<div class="btnrow"><button class="btn primary" data-act="adv-brief-mail">Mail öffnen</button><button class="btn" data-act="adv-brief-html">Mit Formatierung kopieren</button></div>'+
    '<div class="btnrow" style="margin-top:8px"><button class="btn" data-act="adv-brief-copy">Nur Text kopieren</button><button class="btn" data-act="adv-brief-pdf">Als PDF</button><button class="btn" data-act="adv-brief-txt">Textdatei</button></div>'+
    '<div class="sh2">Vor dem Versand</div><ul class="hint-t" style="padding-left:20px;margin:6px 0"><li>Angebote als PDF anhängen</li><li>Beratungsunterlage als PDF anhängen: <button class="btn small" data-act="adv-brief-main">PDF erstellen</button></li><li>Empfänger im Mailprogramm eintragen</li><li>Bei sensiblen Angaben verschlüsselt senden, so wie deine Gesellschaft es vorgibt</li></ul>';
}
function briefRes(){
  var L=buildLetter();
  return '<div class="sh2">Vorschau</div><div class="letterbox"><div class="lsub">Betreff: '+esc(L.subject)+'</div><div class="lbody">'+L.html+'</div></div><p class="hint-t">„Mail öffnen“ übergibt Betreff und Text an dein Mailprogramm. Anhänge kann der Browser nicht mitschicken. Bei langem Text wird er stattdessen kopiert.</p>';
}
function renderLetterPdf(L){
  var J=window.jspdf.jsPDF,d=new J({unit:'mm',format:'a4'}),M=22,W=210,H=297,CW=W-2*M,y=26;
  d.setFont('helvetica','bold');d.setFontSize(12);d.setTextColor(22,32,42);d.text(pdfTxt(L.subject),M,y);y+=10;
  d.setFont('helvetica','normal');d.setFontSize(11);
  L.text.split('\n').forEach(function(line){
    if(!line.trim()){y+=5;return}
    var parts=d.splitTextToSize(pdfTxt(line),CW);
    parts.forEach(function(p){if(y>H-24){d.addPage();y=26}d.text(p,M,y);y+=5.6});
  });
  return d.output('arraybuffer');
}
function briefMsg(t){toast(t)}
function copyHtml(html,plain,okMsg){
  function fb(){var d=document.createElement('div');d.contentEditable='true';d.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';d.innerHTML=html;document.body.appendChild(d);var r=document.createRange();r.selectNodeContents(d);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);var ok=false;try{ok=document.execCommand('copy')}catch(e){}sel.removeAllRanges();document.body.removeChild(d);if(ok)toast(okMsg);else copyText(plain,'Nur der Text wurde kopiert')}
  if(navigator.clipboard&&window.ClipboardItem){try{navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]).then(function(){toast(okMsg)},fb);return}catch(e){}}
  fb();
}
function openMail(L){
  var sub=encodeURIComponent(L.subject),url='mailto:?subject='+sub+'&body='+encodeURIComponent(L.text.replace(/\n/g,'\r\n')),msg='Mailprogramm wird geöffnet. Angebote noch anhängen.';
  if(url.length>1900){copyText(L.text,'Text kopiert. Im Mailprogramm einfügen.');url='mailto:?subject='+sub;msg=''}
  var a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();document.body.removeChild(a);
  if(msg)toast(msg);
}
var kiBusy=false,kiTon='freundlich',kiRes=null,kiCtl=null,kiMsg='';
var KI_TON={freundlich:['Freundlich','freundlich, wertschätzend und professionell'],kurz:['Kurz','kurz und knapp, nur das Wesentliche'],einfach:['Einfach erklärt','in sehr einfacher Sprache, ohne Fachbegriffe, notwendige Fachwörter kurz erklärt']};
function kiInput(){var b=adv.brief;return {besprochen:b.besprochen.trim(),punkte:bulletLines(b.punkte),benoetigt:bulletLines(b.benoetigt)}}
function kiWrapHtml(){
  var h='<p class="hint-t">Claude formuliert „Was wir besprochen haben“, deine Punkte und „Das benötige ich“ kundenfreundlich um. Es werden nur diese drei Texte gesendet, nicht die Anrede und keine Kennzahlen. Bitte keine Namen, Adressen oder Kontaktdaten eintragen. Prüfe den Vorschlag, bevor du ihn übernimmst.</p>';
  h+='<div class="chips">'+Object.keys(KI_TON).map(function(k){return '<button class="chip" data-act="adv-brief-kiton" data-v="'+k+'" aria-pressed="'+(kiTon===k)+'">'+KI_TON[k][0]+'</button>'}).join('')+'</div>';
  h+='<div class="btnrow">'+(kiBusy?'<button class="btn" data-act="adv-brief-kistop">Abbrechen</button>':'<button class="btn primary" data-act="adv-brief-ki">Kundenfreundlich umschreiben</button>')+'</div>';
  if(kiBusy)h+='<div class="note">Claude schreibt den Vorschlag ...</div>';
  if(kiMsg)h+='<div class="note">'+esc(kiMsg)+'</div>';
  if(kiRes){
    h+='<div class="letterbox"><div class="lsub">Vorschlag</div><div class="lbody">';
    if(kiRes.besprochen)h+='<p><b>Besprochen</b><br>'+mdHtml(kiRes.besprochen).replace(/\n/g,'<br>')+'</p>';
    if(kiRes.punkte.length)h+='<p><b>Das Wichtigste in Kürze</b></p><ul>'+kiRes.punkte.map(function(x){return '<li>'+mdHtml(x)+'</li>'}).join('')+'</ul>';
    if(kiRes.benoetigt.length)h+='<p><b>Das benötige ich</b></p><ul>'+kiRes.benoetigt.map(function(x){return '<li>'+mdHtml(x)+'</li>'}).join('')+'</ul>';
    h+='</div></div><div class="btnrow"><button class="btn primary" data-act="adv-brief-kiok">Übernehmen</button><button class="btn" data-act="adv-brief-kino">Verwerfen</button></div>';
  }
  return h;
}
function kiRender(){var e=$('kiwrap');if(e)e.innerHTML=kiWrapHtml()}
function kiRun(){
  var inp=kiInput();
  if(!inp.besprochen&&!inp.punkte.length&&!inp.benoetigt.length){kiMsg='Trage zuerst Texte ein.';kiRender();return}
  if(/[\w.+-]+@[\w-]+\.\w{2,}|\d[\d\s\/-]{7,}\d/.test(JSON.stringify(inp))){kiMsg='Bitte keine E-Mail-Adressen oder Telefonnummern eintragen.';kiRender();return}
  if(!(window.claude&&window.claude.use)){kiMsg='Die KI-Hilfe ist in dieser Ansicht nicht verfügbar.';kiRender();return}
  kiBusy=true;kiMsg='';kiRes=null;kiRender();
  var ctl=new AbortController();kiCtl=ctl;
  var prompt='Du hilfst einem Versicherungsberater in Deutschland, eine E-Mail an einen Kunden kundenfreundlich zu formulieren. Formuliere die folgenden drei Textbausteine um.\n\nTon: '+KI_TON[kiTon][1]+'.\n\nRegeln:\n- Sie-Form, deutsche Sprache, natürlich und höflich, nicht werblich.\n- Zahlen, Beträge, Fakten und Produktnamen unverändert lassen. Nichts erfinden, keine Garantien, keine Renditeversprechen, keine neuen Aussagen ergänzen.\n- Wörter in **doppelten Sternchen** sind Hervorhebungen und bleiben als solche erhalten.\n- Anzahl und Reihenfolge der Punkte beibehalten. Leere Felder bleiben leer.\n- Keine Anrede, keine Grußformel, keine Namen.\n\nAntworte nur mit JSON in dieser Form: {"besprochen": string, "punkte": [string], "benoetigt": [string]}\n\nTexte:\n'+JSON.stringify(inp);
  window.claude.use('sample').then(function(sample){
    if(!sample)throw {code:'capability_disabled'};
    return sample.json(prompt,{signal:ctl.signal,cache:false});
  }).then(function(r){
    function sa(a){return Array.isArray(a)?a.map(function(x){return String(x==null?'':x).trim()}).filter(function(x){return x}):[]}
    if(!r||typeof r!=='object')throw {code:'invalid_json'};
    kiRes={besprochen:String(r.besprochen||'').trim(),punkte:sa(r.punkte),benoetigt:sa(r.benoetigt)};
    if(!kiRes.besprochen&&!kiRes.punkte.length&&!kiRes.benoetigt.length){kiRes=null;kiMsg='Es kam kein Vorschlag zurück. Versuche es noch einmal.'}
  }).catch(function(e){
    var c=e&&e.code;
    kiMsg=c==='cancelled'?'':c==='not_granted'?'Die KI-Hilfe wurde nicht erlaubt.':c==='rate_limited'?'Gerade zu viele Anfragen. Bitte später noch einmal.':(c==='sampling_disabled'||c==='not_declared'||c==='capability_disabled'||c==='capability_removed')?'Die KI-Hilfe ist für dieses Konto nicht verfügbar.':'Das hat nicht geklappt. Bitte noch einmal versuchen.';
  }).then(function(){kiBusy=false;kiCtl=null;kiRender()});
}
function kiApply(){
  if(!kiRes)return;var b=adv.brief,r=kiRes;
  if(r.besprochen)b.besprochen=r.besprochen;
  if(r.punkte.length)b.punkte=r.punkte.map(function(x){return '- '+x}).join('\n');
  if(r.benoetigt.length)b.benoetigt=r.benoetigt.map(function(x){return '- '+x}).join('\n');
  ['besprochen','punkte','benoetigt'].forEach(function(f){var t=document.querySelector('[data-adv="brief.'+f+'"]');if(t)t.value=b[f]});
  kiRes=null;kiMsg='Vorschlag übernommen. Du kannst ihn noch ändern.';kiRender();fillRes();
}
function briefAct(act,btn){
  var L=buildLetter(),full='Betreff: '+L.subject+'\n\n'+L.text,base='Anschreiben'+(adv.kunde?'-'+adv.kunde:'')+'-'+todayIso();
  if(act==='adv-brief-ki'){kiRun();return}
  if(act==='adv-brief-kistop'){if(kiCtl)kiCtl.abort();return}
  if(act==='adv-brief-kiton'){kiTon=btn.dataset.v;kiRender();return}
  if(act==='adv-brief-kiok'){kiApply();return}
  if(act==='adv-brief-kino'){kiRes=null;kiMsg='';kiRender();return}
  if(act==='adv-brief-mail'){openMail(L);return}
  if(act==='adv-brief-html'){copyHtml(L.html,full,'Mail-Text mit Formatierung kopiert');return}
  if(act==='adv-brief-main'){advPdf();return}
  if(act==='adv-brief-copy'){copyText(full,'Anschreiben kopiert');return}
  if(act==='adv-brief-txt'){if(dl)dl.save({filename:base+'.txt',data:full}).then(function(){toast('Gespeichert')},function(e){if(e&&e.code==='declined')return;fallbackCopy(base+'.txt',full)});else fallbackCopy(base+'.txt',full);return}
  if(act==='adv-brief-pdf'){
    loadJsPdf(function(ok){
      if(!ok){toast('PDF nicht verfügbar, bitte Text kopieren.');return}
      var buf;try{buf=renderLetterPdf(L)}catch(x){toast('PDF konnte nicht erstellt werden.');return}
      if(!dl){toast('Direktes Speichern ist hier nicht verfügbar.');return}
      dl.save({filename:base+'.pdf',data:buf}).then(function(){toast('Gespeichert')},function(e){if(e&&e.code==='declined')return;toast('Speichern nicht möglich.')});
    });
    return;
  }
  if(act==='adv-brief-add'){
    var f=btn.dataset.f,t=btn.dataset.t;adv.brief[f]=(adv.brief[f]?adv.brief[f].replace(/\s+$/,'')+'\n':'')+t;
    var ta=document.querySelector('[data-adv="brief.'+f+'"]');if(ta)ta.value=adv.brief[f];fillRes();
  }
}

/* ================= Ablauf-Radar, offene Fäden, Wochenabschluss, Übersicht ================= */
function addMonthsIso(s,n){var p=s.split('-').map(Number),m=p[1]-1+n,y=p[0]+Math.floor(m/12);m=((m%12)+12)%12;var last=new Date(y,m+1,0).getDate();return iso(new Date(y,m,Math.min(p[2],last)))}
function vtInfo(v){
  var T=todayIso(),fr=Number(v.frist)||3,bis=addDaysIso(addMonthsIso(v.ablauf,-fr),-1);
  var dEnd=diffDays(T,v.ablauf),dBis=diffDays(T,bis),st,cls;
  if(dEnd<0){st='abgelaufen';cls='later'}
  else if(dBis<0){st='verpasst';cls='late'}
  else if(dBis<=30){st='dringend';cls='late'}
  else if(dBis<=90){st='bald';cls='today'}
  else if(dBis<=150){st='vormerken';cls='soon'}
  else{st='ok';cls='later'}
  return {bis:bis,dBis:dBis,dEnd:dEnd,st:st,cls:cls};
}
function radarList(){
  return db.vertraege.map(function(v){return {v:v,i:vtInfo(v)}}).filter(function(o){return o.i.st==='verpasst'||o.i.st==='dringend'||o.i.st==='bald'||o.i.st==='vormerken'})
    .sort(function(a,b){function k(o){return o.i.st==='verpasst'?1000+o.i.dEnd:o.i.dBis}return k(a)-k(b)});
}
function vtText(i){
  if(i.st==='verpasst')return 'Frist verpasst am '+fmtFull(i.bis)+'. Sonderkündigung oder nächsten Termin prüfen.';
  return 'Kündigung bis '+fmtFull(i.bis)+', '+rel(i.bis)+'.';
}
function vtRow(o){
  var v=o.v,i=o.i;
  return '<div class="row '+i.cls+'"><div class="body" data-act="open-vertrag" data-id="'+v.id+'"><div class="line1"><span class="tag">'+esc(v.kunde)+'</span><span class="when">'+esc(v.sparte)+', läuft ab '+fmtFull(v.ablauf)+'</span></div><div class="txt">'+vtText(i)+'</div>'+(v.note?'<div class="sub">'+esc(v.note)+'</div>':'')+'</div></div>';
}
function openVertrag(id){
  var v=db.vertraege.find(function(x){return x.id===id});if(!v)return;
  var i=vtInfo(v);
  var h='<h3>Vertrag</h3><p class="sub"><span class="tag">'+esc(v.kunde)+'</span></p>';
  h+='<div class="note'+(i.cls==='late'?'':' ok')+'" style="margin-top:12px">'+(i.st==='abgelaufen'?'Der Vertrag ist abgelaufen.':vtText(i))+'</div>';
  h+='<label for="v-sparte">Sparte</label><select id="v-sparte">'+opts(SPARTEN,v.sparte,false)+'</select>';
  h+='<label for="v-ablauf">Vertrag läuft ab am</label><input type="date" id="v-ablauf" value="'+esc(v.ablauf)+'">';
  h+='<label for="v-frist">Kündigungsfrist</label><select id="v-frist">'+[['1','1 Monat'],['2','2 Monate'],['3','3 Monate'],['6','6 Monate']].map(function(o){return '<option value="'+o[0]+'"'+(String(v.frist)===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>';
  h+='<label for="v-note">Notiz</label><input type="text" id="v-note" maxlength="140" value="'+esc(v.note||'')+'">';
  h+='<p class="hint-t">Richtwert: Die Kündigung muss rechtzeitig beim Versicherer eingehen. Maßgeblich sind Police und Bedingungen.</p>';
  h+='<div class="btnrow" style="margin-top:10px"><button class="btn" data-act="ku-open" data-id="'+v.id+'">Kündigungsschreiben</button></div>';
  h+='<div id="v-err"></div><div class="btnrow"><button class="btn danger" data-act="del-vertrag" data-id="'+v.id+'" data-confirm="Wirklich löschen?">Löschen</button><button class="btn primary" data-act="save-vertrag" data-id="'+v.id+'">Speichern</button></div>';
  openSheet(h);
}
function saveVertrag(id){
  var v=db.vertraege.find(function(x){return x.id===id});if(!v)return;
  var a=$('v-ablauf').value,n=$('v-note').value.trim(),e=!a?'Bitte das Ablaufdatum wählen.':checkText(n);
  if(e){$('v-err').innerHTML='<p class="err" role="alert">'+esc(e)+'</p>';return}
  v.sparte=$('v-sparte').value;v.ablauf=a;v.frist=$('v-frist').value;v.note=n;
  save();closeSheet();render();toast('Gespeichert');
}
function waitList(){return db.todos.filter(function(x){return !x.done&&x.wait}).sort(function(a,b){return (a.due||'9999').localeCompare(b.due||'9999')||(a.ts||0)-(b.ts||0)})}
function waitRow(x){
  var T=todayIso(),late=x.due&&x.due<=T,days=Math.max(0,Math.floor((Date.now()-(x.ts||Date.now()))/DAY));
  return '<div class="row '+(late?'late':'soon')+'"><button class="check" data-act="toggle-todo" data-id="'+x.id+'" aria-label="Erledigt"></button>'+
    '<div class="body" data-act="open-todo" data-id="'+x.id+'"><div class="line1"><span class="tag">'+esc(x.kunde)+'</span><span class="when">seit '+days+(days===1?' Tag':' Tagen')+' offen, nachfassen '+whenLabel(x.due)+'</span></div><div class="txt">'+esc(x.text)+'</div>'+
    '<div class="actions"><button class="btn small" data-act="wait-mail" data-id="'+x.id+'">Erinnerung per Mail</button></div></div></div>';
}
function weekStart(){var k=(new Date().getDay()+6)%7;return addDaysIso(todayIso(),-k)}
function wocheData(){
  var T=todayIso(),ws=weekStart(),wsTs=toTs(ws);
  return {ws:ws,
    doneTodos:db.todos.filter(function(x){return x.done&&x.doneAt>=wsTs}).length,
    ber:db.beratungen.filter(function(b){return b.datum>=ws&&b.datum<=T}),
    ter:db.termine.filter(function(x){return x.datum>=ws&&x.datum<=T}),
    angNeu:db.angebote.filter(function(a){return (a.ts||0)>=wsTs}).length,
    angOffen:db.angebote.filter(isOpenAng).length,
    angFaellig:db.angebote.filter(function(a){return isOpenAng(a)&&a.nachfass&&a.nachfass<=T}).length,
    waits:waitList(),
    rad:radarList().filter(function(o){return o.i.st!=='vormerken'}),
    next:db.todos.filter(function(x){return !x.done&&x.due&&x.due>T&&x.due<=addDaysIso(T,7)}).length};
}
function wocheText(){
  var w=wocheData(),L=['Wochenbericht ab '+fmtFull(w.ws),''];
  L.push('Termine: '+w.ter.length+', Beratungen: '+w.ber.length);
  var by={};w.ber.forEach(function(b){by[b.bereich]=(by[b.bereich]||0)+1});
  Object.keys(by).forEach(function(k){L.push('- '+k+': '+by[k])});
  if(w.ber.length){L.push('','Beratungen und Ergebnisse:');w.ber.forEach(function(b){L.push('- Nr. '+b.kunde+', '+b.bereich+(b.note?': '+b.note:''))})}
  L.push('','Angebote neu: '+w.angNeu+', offen: '+w.angOffen+', Nachfassen fällig: '+w.angFaellig);
  L.push('Erledigte To-dos: '+w.doneTodos+', nächste Woche fällig: '+w.next);
  L.push('','Offene Fäden (wartet auf Kunde): '+w.waits.length);
  w.waits.forEach(function(x){L.push('- Nr. '+x.kunde+': '+x.text)});
  L.push('','Fristen im Blick: '+w.rad.length);
  w.rad.forEach(function(o){L.push('- Nr. '+o.v.kunde+', '+o.v.sparte+': Kündigung bis '+fmtFull(o.i.bis)+(o.i.st==='verpasst'?' (verpasst)':''))});
  L.push('','Bitte ergänzen: Gründe bei Absagen und besondere Einwände.');
  return L.join('\n');
}
function openWoche(){
  var w=wocheData();
  var h='<h3>Wochenabschluss</h3><p class="hint-t" style="margin-top:2px">Seit '+fmtFull(w.ws)+'</p>';
  h+='<div class="wk">'+stat('Termine',w.ter.length)+stat('Beratungen',w.ber.length)+stat('Erledigt',w.doneTodos)+'</div>';
  h+='<div class="wk">'+stat('Neue Angebote',w.angNeu)+stat('Angebote offen',w.angOffen,w.angFaellig?w.angFaellig+' zum Nachfassen':'')+stat('Fällig nächste Woche',w.next)+'</div>';
  h+='<h4>Offene Fäden ('+w.waits.length+')</h4>';
  h+=w.waits.length?w.waits.slice(0,6).map(waitRow).join(''):'<p class="hint-t">Nichts offen, alles beim Kunden erledigt.</p>';
  h+='<h4>Fristen im Blick ('+w.rad.length+')</h4>';
  h+=w.rad.length?w.rad.slice(0,6).map(vtRow).join(''):'<p class="hint-t">Keine Frist in den nächsten 90 Tagen.</p>';
  h+='<div class="btnrow"><button class="btn" data-act="close">Schließen</button><button class="btn primary" data-act="woche-copy">Bericht kopieren</button></div>';
  h+='<p class="hint-t">Der Bericht enthält nur Nummern, Zahlen und deine Stichworte. Keine Namen.</p>';
  openSheet(h);
}
function dtile(act,attrs,icon,title,sub,badge,tone){
  return '<button class="dtile m-'+(tone||'acc')+'" data-act="'+act+'" '+attrs+'><span class="dic">'+ico(icon,26)+(badge?'<i class="dbadge">'+badge+'</i>':'')+'</span><strong>'+title+'</strong><span class="dsub">'+sub+'</span></button>';
}
function kp(act,attrs,icon,label,num,sub,cls){
  return '<button class="kp'+(cls?' '+cls:'')+'" data-act="'+act+'" '+attrs+' aria-label="'+label+': '+num+'"><span class="kl">'+ico(icon,15)+label+'</span><span class="kn">'+num+'</span><span class="ks">'+sub+'</span></button>';
}
function qa(act,attrs,icon,label,primary){
  return '<button class="qa'+(primary?' primary':'')+'" data-act="'+act+'" '+attrs+'>'+ico(icon,18)+label+'</button>';
}
function tool(act,att,ic,t,sub,primary){return '<button class="tl2'+(primary?' pri':'')+'" data-act="'+act+'" '+att+'><span class="tli">'+ico(ic,24)+'</span><span><strong>'+t+'</strong><small>'+sub+'</small></span></button>'}
var SL_IC={'Die drei Schichten der Altersvorsorge':['layers','alter'],'Wie stellen Sie sich Ihren Ruhestand vor?':['sun','alter'],'Wie viel Geld brauchen Sie im Monat?':['wallet','alter'],'Was bringt die gesetzliche Rente?':['bank','alter'],'Ihre persönliche Versorgungslücke':['alert','late'],'Zeit ist Ihr größter Hebel':['hourglass','alter'],'Der Staat hilft mit: Rürup-Rente':['tax','alter'],'Unsere Lösung':['shieldok','alter'],
  'Was möchten Sie mit Ihrem Geld erreichen?':['target','anlage'],'So wird Geldanlage normalerweise besteuert':['tax','anlage'],'Die Fondspolice als Steuer-Hülle':['shield','anlage'],'Was kann am Ende herauskommen?':['rocket','anlage'],'Flexibilität und Absicherung':['sliders','anlage'],
  'Wo sind Sie heute versichert?':['heart','kv'],'Die gesetzliche Krankenversicherung':['bank','kv'],'Ihre Ausgangslage':['wallet','kv'],'Die private Krankenversicherung':['shieldok','kv'],'Leistungen im Vergleich':['sliders','kv'],'Beitrag: GKV bleiben oder PKV?':['scale','kv'],'Die Beitragsentwicklung':['trend','kv'],'Und im Alter?':['clock','kv'],'Was spricht für den Wechsel?':['thumb','kv'],'Nachteile und Risiken':['alert','late'],'Zusammenfassung und nächste Schritte':['check','acc'],'Mehr als Versicherung':['layers','acc'],'Was wir noch für Sie tun können':['target','acc']};
function slideIc(t){var m=SL_IC[t];return m?'<span class="tic m-'+m[1]+'">'+ico(m[0],26)+'</span>':''}


/* ================= Korrektur-Modus ================= */
var fbOn=false,fbState='bar',fbPend=null,fbItems=[],FB_KEY='crm.fb.v1';
try{var fbr=localStorage.getItem(FB_KEY);if(fbr)fbItems=JSON.parse(fbr)||[]}catch(e){fbItems=[]}
function fbSave(){try{localStorage.setItem(FB_KEY,JSON.stringify(fbItems))}catch(e){}}
function fbWhere(){
  var w=(TITEL[tab]||[''])[0];
  if(!$('sheet').hidden)w+=' (Dialog)';
  else if(tab==='beratung'&&cur){var st=curStep().st;w+=', '+st.grp+': '+st.name}
  return w;
}
function fbLabel(el){
  var t=el.closest('button,.stat,.row,.tile,.kp,.card,.chartbox,h1,h2,h3,h4,.tq,label,p,li,.note,.ttip,.gzr,details,input,select,textarea')||el;
  var kind=/^(BUTTON|A)$/.test(t.tagName)?'Knopf':t.classList.contains('chartbox')||t.tagName==='CANVAS'?'Diagramm':/^H[1-4]$/.test(t.tagName)?'Überschrift':/^(INPUT|SELECT|TEXTAREA|LABEL)$/.test(t.tagName)?'Feld':t.classList.contains('stat')?'Kennzahl':t.classList.contains('row')?'Listeneintrag':t.classList.contains('tile')?'Kachel':'Bereich';
  var tx=(t.getAttribute('aria-label')||t.innerText||t.getAttribute('placeholder')||'').replace(/\s+/g,' ').trim();
  if(kind==='Diagramm')tx=tx||'Diagramm';
  return {kind:kind,text:tx.slice(0,70),node:t};
}
function fbRender(){
  var u=$('fbui');if(!u)return;
  document.body.classList.toggle('fbmode',fbOn);
  if(!fbOn){u.hidden=true;u.innerHTML='';return}
  u.hidden=false;
  var open=fbItems.filter(function(i){return !i.done}).length,h='';
  h+='<div class="fbbar"><span>Korrektur-Modus: tippe auf die Stelle</span><button class="btn small" data-act="fb-list">Liste ('+open+')</button><button class="btn small primary" data-act="fb-off">Fertig</button></div>';
  if(fbState==='note'&&fbPend){
    h+='<div class="fbcard"><div class="fbctx"><b>'+esc(fbPend.where)+'</b><br>'+esc(fbPend.kind)+(fbPend.text?': „'+esc(fbPend.text)+'“':'')+'</div>'+
      '<label class="fl"><span>Was soll geändert werden?</span><textarea id="fb-text" maxlength="400" placeholder="z. B. Text kürzen, Farbe ändern, Knopf größer"></textarea><small>Bitte keine Kundennamen eintragen.</small></label><div id="fb-err" class="err"></div>'+
      '<div class="btnrow"><button class="btn" data-act="fb-cancel">Abbrechen</button><button class="btn primary" data-act="fb-save">Merken</button></div></div>';
  }else if(fbState==='list'){
    h+='<div class="fbcard"><div class="fbhead"><b>Korrekturen ('+fbItems.length+')</b><button class="linkbtn" data-act="fb-close-list">Schließen</button></div>';
    h+=fbItems.length?'<div class="fblist">'+fbItems.map(function(i,ix){return '<div class="fbit'+(i.done?' done':'')+'"><button class="check" data-act="fb-done" data-i="'+ix+'" aria-label="Erledigt"></button><div class="fbtx"><small>'+(ix+1)+'. '+esc(i.where)+' · '+esc(i.kind)+(i.text?' „'+esc(i.text)+'“':'')+'</small><div>'+esc(i.note)+'</div></div><button class="x" data-act="fb-del" data-i="'+ix+'" aria-label="Löschen">×</button></div>'}).join('')+'</div>':'<p class="hint-t">Noch nichts markiert.</p>';
    h+='<div class="btnrow"><button class="btn" data-act="fb-clear" data-confirm="Erledigte entfernen?">Erledigte löschen</button><button class="btn primary" data-act="fb-list-copy">Liste kopieren</button></div></div>';
  }
  u.innerHTML=h;
  var ta=$('fb-text');if(ta)ta.focus();
}
function fbText(){
  var o=fbItems.filter(function(i){return !i.done});
  return 'Korrekturen Mein CRM ('+fmtFull(todayIso())+')\n\n'+o.map(function(i,ix){return (ix+1)+'. ['+i.where+'] '+i.kind+(i.text?' „'+i.text+'“':'')+': '+i.note}).join('\n');
}
function fbPick(ev){
  if(!fbOn)return;
  var t=ev.target;
  if(t.closest('#fbui')||t.closest('[data-act="fb-toggle"]'))return;
  ev.preventDefault();ev.stopPropagation();
  var old=document.querySelector('.fb-pick');if(old)old.classList.remove('fb-pick');
  var l=fbLabel(t);l.node.classList.add('fb-pick');
  fbPend={where:fbWhere(),kind:l.kind,text:l.text,node:l.node};fbState='note';fbRender();
}
function fbClearPick(){var o=document.querySelector('.fb-pick');if(o)o.classList.remove('fb-pick')}
document.addEventListener('click',fbPick,true);

