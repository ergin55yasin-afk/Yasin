var GV_KI={frei:false,analyse:null};
var GVPF={stand:'1. Juli 2026',datum:'14.07.2026',quelle:'vdek, Landesvertretung Baden-Württemberg, Pressemitteilung vom 14.07.2026',gesamt:3657,pflege:2041,uv:1153,invest:463,ausb:139,vorjahr:3400,scope:'Landesdurchschnitt Baden-Württemberg, erstes Jahr im Pflegeheim'};
var GV_EX='Der Kunde kommt wegen der Fälligkeit eines bestehenden Sparvertrags zu mir. Er möchte über die Wiederanlage sprechen. Seine bestehenden Sachversicherungen sind bei uns vorhanden und sollen nicht verändert werden. Ich möchte ihm zusätzlich ein Angebot zur Krankenzusatzversicherung und ein Angebot zur Pflegezusatzversicherung mitgeben.\n\nBei der Krankenzusatzversicherung möchte ich erklären, dass der Tarif neben dem Zahnschutz weitere Leistungen wie Sehhilfen, Vorsorgeuntersuchungen und professionelle Zahnreinigung enthalten kann. Tarif A kostet monatlich 35 Euro: Zahnersatz 80 %, Brille bis 150 Euro alle zwei Jahre, professionelle Zahnreinigung bis 100 Euro im Jahr, Vorsorge ja. Tarif B kostet monatlich 42 Euro: Zahnersatz 90 %, Brille bis 250 Euro alle zwei Jahre, professionelle Zahnreinigung bis 150 Euro im Jahr, Vorsorge ja, Wartezeit 3 Monate. Erstelle daraus eine verständliche Gegenüberstellung und einen Effektivrechner.\n\nBei der Pflegeversicherung möchte ich die aktuelle finanzielle Situation bei stationärer Pflege im Raum Heilbronn erläutern. Der Kunde soll verstehen, welche Kosten entstehen können und welcher Eigenanteil verbleiben kann. Erkläre außerdem den Unterschied zwischen einer Absicherung grundlegender Kosten und einer Absicherung, die mehr Selbstbestimmung bietet.\n\nDie bestehenden Verträge sollen nur als Kontext dienen. Sie sind kein Anlass für eine Anpassung. Bereite mich auf das Gespräch vor und erstelle zusätzlich eine Kundeninformation zu den beiden neuen Angeboten.';
/* Baustein-Register: weitere Themen (z. B. Unfall mit Beitragsrückgewähr) werden hier mit eigenen Regeln ergänzt */
var GV_MODS={
 kz:{name:'Krankenzusatz',ic:'hospital',col:'#0E7490',rx:/krankenzusatz|zahnzusatz|zahnschutz|zahnersatz|sehhilfe|zahnreinigung|zusatzversicherung\w*\s+(?:für|fuer)\s+(?:zahn|brille)/i,
  feat:[['zahn','Zahnleistungen',/zahn(?!reinig)|inlay|implantat|kieferorth/i],['pzr','Professionelle Zahnreinigung',/zahnreinigung|prophylaxe|\bpzr\b/i],['brille','Sehhilfen',/brille|sehhilf|kontaktlinse/i],['vorsorge','Vorsorge',/vorsorge|früherkennung|check-?up/i],['grenze','Erstattungsgrenzen',/erstattungsgrenze|höchst|maximal|\bmax\b|begrenz|jahreshöchst|deckel/i],['warte','Wartezeiten',/wartezeit|karenz/i],['staffel','Leistungsstaffeln',/staffel|im ersten jahr|im zweiten jahr|nach \d+ jahren/i],['weitere','Weitere Leistungen',/heilpraktiker|naturheil|krankenhaus|chefarzt|einbettzimmer|auslandsreise/i]],
  core:['zahn','pzr','brille','vorsorge']},
 pf:{name:'Pflegezusatz',ic:'shieldok',col:'#6B4E9B',rx:/pflege/i,
  feat:[['haus','Leistung bei häuslicher Pflege',/häusliche|ambulant|zu hause|pflegedienst/i],['stat','Leistung bei stationärer Pflege',/stationär|pflegeheim|\bheim\b/i],['leist','Vereinbarte Leistung',/pflegetagegeld|pflegerente|pflegemonatsgeld|leistung von|pflegegrad|tagegeld/i],['weitere','Weitere Leistungen',/beitragsbefreiung|dynamik|assistance|demenz|rückgewähr|selbstbestimm|freie verwendung|freie verfügung/i],['grenze','Grenzen und Bedingungen',/wartezeit|gesundheitsfrage|karenz|höchst|maximal|\bmax\b|begrenz|bedingung/i]],
  core:['haus','stat','leist']}
};
var GV_CONTR=[['Sparvertrag',/sparvertrag|sparplan|bausparvertrag|festgeld|sparbrief/i],['Fondssparplan',/fondssparplan|investmentfonds|depot/i],['Lebensversicherung',/lebensversicherung|kapitallebens|rentenversicherung|risikoleben/i],['Haftpflicht',/haftpflicht/i],['Hausrat',/hausrat/i],['Wohngebäude',/wohngebäude/i],['Rechtsschutz',/rechtsschutz/i],['Kfz',/\bkfz\b|autoversicherung/i],['Sachversicherungen',/sachversicherung/i],['Berufsunfähigkeit',/berufsunfähigkeit|\bbu\b/i],['Unfallversicherung',/unfallversicherung/i]];
function gvCut(t,n){t=String(t||'').replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1).replace(/\s+\S*$/,'')+'…':t}
function gvNum(s){var v=parseFloat(String(s).replace(/\./g,'').replace(',','.'));return isFinite(v)?v:NaN}
function gvSplit(txt){
  var t=String(txt||'').replace(/[„“”"]/g,'').replace(/\r/g,'').replace(/\b(z\.\s?B\.|d\.\s?h\.|ca\.|inkl\.|ggf\.|bzw\.|u\.\s?a\.|Nr\.|max\.|mind\.|evtl\.)/gi,function(m){return m.replace(/\./g,'\u0001')});
  var out=[];t.split('\n').forEach(function(line,li){
    var raw=line.trim();if(!raw)return;var bullet=/^[-•*]\s*/.test(raw);raw=raw.replace(/^[-•*]\s*/,'');
    raw.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9\[])/).forEach(function(s,i){s=s.replace(/\u0001/g,'.').trim();if(s)out.push({s:s,line:li,first:i===0,bullet:bullet})})});
  return out;
}
function gvAnlassTxt(s){var m=s.match(/\bwegen\s+(.+?)(?:\s+(?:zu mir|an|bei mir))?[.!]?$/i),t=m?m[1]:s.replace(/^(?:Anlass|Der Kunde|Die Kundin)[:\s]*/i,'').replace(/[.!]$/,'');t=t.replace(/^(?:der|die|das|einer|einem)\s+(?=Fälligkeit|Frage)/i,'');return gvCut(t.charAt(0).toUpperCase()+t.slice(1),160)}
function gvAnlassTyp(s){return /fällig|ablauf|läuft aus|wiederanlage|sparvertrag|anlage/i.test(s)?'wa':/finanziell|altersvorsorge|vorsorge|vermögen/i.test(s)?'fin':/vertrag/i.test(s)?'vertrag':'anl'}
function gvTopicOf(s){var r=[];['kz','pf'].forEach(function(k){if(GV_MODS[k].rx.test(s))r.push(k)});return r}
function gvMoney(s,kws){
  var m=s.match(/(?:kostet|kosten|beitrag(?:\s+von|\s+beträgt)?|monatlich|prämie|zahlt)[^\d]{0,30}(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|euro|eur)\b/i)||s.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|euro|eur)\s*(?:\/|pro|im)?\s*(?:monat|monatlich)/i);
  if(!m)return NaN;var v=gvNum(m[1]);if(/jähr|pro jahr|im jahr|\/\s*jahr/i.test(s)&&!/monat/i.test(s))v=v/12;return v;
}
function gvAnalyse(txt){
  var S=gvSplit(txt),A={anlass:'',anlassTyp:'',situation:[],bestand:[],allUnv:false,topics:{kz:false,pf:false},other:[],wuensche:[],inhalte:[],excl:[],noInt:[],region:'',tarife:{kz:[],pf:[]},announce:{},platz:{},calc:{kz:true,pf:true},ass:[150,400,800],assGiven:false,pfEig:GVPF.gesamt,order:[],q:{},note:[]};
  var offerRx=/angebot|mitgeben|mitgebe|tarif|ansprechen|vergleich|erkl[äa]r|erläuter|information|rechner|beitr[äa]g|darstell/i,exclRx=/nicht (?:verwenden|erwähnen|ansprechen|thematisieren|nennen|in die kundeninformation)|bitte nicht|kein interesse|nicht interessiert|lehnt (?:\w+ )?ab|ausdrücklich nicht/i;
  var unvRx=/nicht (?:verändert|angepasst|angefasst|geändert|angetastet|optimiert|umgestellt)|unverändert|bleiben?\s+(?:so|bestehen|unverändert)|keine (?:änderung|anpassung|optimierung)|sollen? nicht (?:verändert|angepasst|geändert)/i;
  var cur=null,ctx=null,prevContr=[],tmap={},tl=[];
  function tarif(top,name){var k=top+'|'+name;if(!tmap[k]){tmap[k]={n:name,beitrag:NaN,txt:[],f:{}};A.tarife[top].push(tmap[k])}return tmap[k]}
  S.forEach(function(z,idx){
    var s=z.s,tops=gvTopicOf(s),isExcl=exclRx.test(s);
    var pz=S[idx-1],cont=!!(z.bullet||(pz&&pz.hadCtx&&(pz.line===z.line||(pz.line===z.line-1&&pz.s.slice(-1)===':'))));if(!cont)ctx=null;
    if(tops.length&&!isExcl){cur=tops.length===1?tops[0]:cur;tops.forEach(function(k){if(A.order.indexOf(k)<0)A.order.push(k)})}
    var contr=GV_CONTR.filter(function(c){return c[1].test(s)}).map(function(c){return c[0]});
    /* Ausschluss, kein Interesse */
    if(isExcl){A.excl.push(gvCut(s,140));tops.forEach(function(k){A.noInt.push(k)});if(/unfall/i.test(s))A.noInt.push('uv');return}
    /* Anlass */
    if(!A.anlass&&/kommt (?:wegen|zu)|\bwegen\b|ruft .* an|anlass|einladung|termin|fälligkeit|fällig|wiederanlage|läuft aus|jahresgespräch|ablauf|gespräch (?:über|zu|wegen)|besprechen/i.test(s)&&!/angebot|mitgeben|tarif\s+[A-Z0-9]/.test(s)&&!/^(?:er|sie)\b/i.test(s)){
      A.anlass=gvAnlassTxt(s);A.anlassTyp=gvAnlassTyp(s);
      contr.forEach(function(c){A.bestand.push({n:c,unv:false,due:true})});return}
    /* Unverändert und Kontext */
    if(unvRx.test(s)){var cc=contr.length?contr:prevContr;cc.forEach(function(c){var b=A.bestand.filter(function(x){return x.n===c})[0];if(b)b.unv=true;else A.bestand.push({n:c,unv:true})});if(!cc.length&&/verträge|versicherungen/i.test(s))A.allUnv=true;return}
    if(/nur als kontext|kein anlass für eine anpassung|kontext dienen|dienen? nur als kontext/i.test(s)){A.allUnv=true;return}
    /* Tarife */
    var tn=null,nm=/\b(?:Tarif(?:variante)?|Variante|Angebot)\s+([A-Z0-9ÄÖÜ][\wÄÖÜäöüß-]*)/g,m,names=[];
    while((m=nm.exec(s))){if(!/zusatz|versicherung|pflege|kranken|unfall|mitgeben|und|oder|zur|für|der|die|das/i.test(m[1]))names.push(m[1])}
    if(names.length){ctx={n:names[names.length-1],top:cur||tops[0]||'kz'}}
    z.hadCtx=!!ctx;
    var top0=ctx?(tops.length===1?tops[0]:(ctx.top||cur||'kz')):'kz',fh=ctx&&GV_MODS[top0].feat.some(function(f){return f[2].test(s)});
    if(ctx&&(names.length||fh||/\d+\s*(?:€|euro|%)/i.test(s))&&!/^(?:erstelle|bereite|erkläre|ich\b)/i.test(s)&&!(!names.length&&/erstattung|szenario|rechner|nutzung/i.test(s))){
      var top=top0;
      var segs=[s];
      if(names.length>1){segs=s.split(new RegExp('(?=\\b(?:Tarif(?:variante)?|Variante|Angebot)\\s+'+names[1].replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')+'\\b)'))}
      segs.forEach(function(sg,si){var nn=names.length?(names.length>1?names[si]:names[0]):ctx.n;if(!nn)return;var t=tarif(top,nn);t.txt.push(sg);var v=gvMoney(sg);if(isFinite(v)&&!isFinite(t.beitrag))t.beitrag=v});
      if(!/\bwerde\b|\bwill\b|einfügen|nachreichen/i.test(s))return}
    /* Hinweise auf noch einzufügende Tarife */
    if(/einfüg|nachreich|trage .* ein|folgen|ergänze/i.test(s)&&/tarif|beitr/i.test(s)&&cur){A.announce[cur]=true}
    /* Region */
    var rg=s.match(/(?:im Raum|in der Region|Region|Raum|in)\s+(Heilbronn|Stuttgart|Karlsruhe|Mannheim|Ulm|Freiburg|Pforzheim|Ludwigsburg|Esslingen|Tübingen|Reutlingen)/);if(rg)A.region=rg[1];
    /* Bestand */
    if(contr.length&&/bestehend|besteht|bestehen|vorhanden|hat |haben|läuft|laufen|abgeschlossen|bei uns/i.test(s)&&!offerRx.test(s.replace(/bestehende[nr]?/gi,''))){contr.forEach(function(c){if(!A.bestand.some(function(x){return x.n===c}))A.bestand.push({n:c,unv:false})})}
    if(contr.length)prevContr=contr;
    /* Themen */
    var existing=/bereits|schon|bestehende[nr]?\s+(?:kranken|pflege)|hat\s+(?:eine|ein)\b/i.test(s)&&!/angebot|mitgeben|tarif/i.test(s);
    if(tops.length&&!existing){tops.forEach(function(k){A.topics[k]=true})}
    if(/unfall/i.test(s)&&/angebot|mitgeben|ansprechen|besprechen|beitragsrückgewähr/i.test(s)&&!/unfallversicherung\b.*bestehend/i.test(s)){if(A.other.indexOf('Unfallversicherung mit Beitragsrückgewähr')<0)A.other.push('Unfallversicherung mit Beitragsrückgewähr')}
    /* Rechner */
    if(/rechner|berechn|eigenaufwand|szenario/i.test(s)){if(tops.length===1||cur){A.calcWish=true}
      var en=s.match(/erstattung\w*[^.]*?/i);if(en&&/erstattung|szenario|nutzung/i.test(s)){var nums=(s.slice(s.search(/erstattung|szenario|nutzung/i)).match(/\d{1,3}(?:\.\d{3})+|\d{2,6}/g)||[]).map(gvNum).filter(isFinite);if(nums.length===3){A.ass=nums;A.assGiven=true}else if(nums.length===1){A.ass[1]=nums[0];A.assGiven=true}}}
    if(/ohne (?:rechner|berechnung)|keine berechnung/i.test(s)){if(tops.indexOf('kz')>=0||cur==='kz')A.calc.kz=false;if(cur==='pf')A.calc.pf=false}
    /* Wünsche des Kunden */
    if(/^(?:er|sie|der kunde|die kundin|kunde|kundin|das ehepaar|die familie)\b/i.test(s)&&/möchte|wünscht|fragt|interessiert|sorge|wichtig|will\b|hat angst|befürchtet/i.test(s)){
      var hd=s.split(/,?\s+(?:möchte|wünscht|fragt|interessiert sich|will)\b/i)[0];if(hd.length<s.length&&/\d{2}\s?(?:jahre|-jährig)|verheiratet|ledig|kinder|rente|ruhestand|selbstständig|angestellt|beruf|familie|alleinstehend/i.test(hd))A.situation.push(gvCut(hd,160));
      A.wuensche.push(gvCut(s,150));return}
    /* Inhalte der Kundeninformation */
    if(/erklär|erläuter|verstehen|darstell|gegenüberstellung|rechner|visual|kundeninformation|grafik|diagramm|zeige|unterschied/i.test(s)){A.inhalte.push({t:gvCut(s.replace(/^(Bei der \w+ )?(möchte ich |Erkläre |Erstelle )/i,''),130),k:cur});return}
    /* Kundensituation */
    if(/\d{2}\s?(?:jahre|-jährig)|verheiratet|ledig|kinder|\bkind\b|\brente\b|ruhestand|selbstständig|selbständig|angestellt|beruf|eigentum|familie|alleinstehend|partner|ehefrau|ehemann|vermögen|einkommen|pension|erbschaft|witwe|geschieden/i.test(s))A.situation.push(gvCut(s,160));
  });
  if(!A.anlass&&A.wuensche.length&&/sprechen|besprechen|fragt|anliegen/i.test(A.wuensche[0])){A.anlass=gvAnlassTxt(A.wuensche[0].replace(/^.*?(?:möchte|wünscht|fragt)\s+(?:über|nach|zu)?\s*/i,'wegen '));A.anlassTyp=gvAnlassTyp(A.wuensche[0])}
  A.noInt.forEach(function(k){if(A.topics[k])A.topics[k]=false});
  /* Tarife auswerten */
  ['kz','pf'].forEach(function(k){
    A.tarife[k].forEach(function(t){
      var full=t.txt.join(' ');if(/\[[^\]]*\]/.test(full)){A.platz[k+'|'+t.n]=true;full=full.replace(/\[[^\]]*\]/g,'')}
      var clauses=full.split(/[;,\n]|:\s|\.\s/);
      clauses.forEach(function(c){c=c.trim().replace(/^(?:Tarif|Variante|Angebot)\s+\S+\s+(?:kostet|hat|ist|beinhaltet|bietet)?\s*/i,'');if(!c)return;
        var hit=GV_MODS[k].feat.filter(function(f){return f[2].test(c)});
        if(hit.length>1&&c.length>60&&/\sund\s/.test(c)){c.split(/\s+und\s+/).forEach(function(p){GV_MODS[k].feat.forEach(function(f){if(f[2].test(p)&&!t.f[f[0]])t.f[f[0]]=gvCut(p,90)})});return}
        hit.forEach(function(f){if(!t.f[f[0]]){var v=c.replace(/^(?:kostet|hat|folgende leistungen)\s*/i,'');var v2=v.replace(/^(?:professionelle\s+zahnreinigung|zahnersatz|zahnleistungen|zahnbehandlung|zahn|sehhilfen?|brille|vorsorge(?:untersuchungen)?|pflegetagegeld|pflegerente)\s+/i,'');if(v2&&/\S/.test(v2)&&f[0]!=='weitere')v=v2;if(f[0]!=='grenze'||/\d/.test(v))t.f[f[0]]=gvCut(v.replace(/[.\s]+$/,''),90)}});
        if(/^\s*vorsorge\s+ja\b/i.test(c))t.f.vorsorge='Ja, enthalten';
      });
      if(!isFinite(t.beitrag)){var v=gvMoney(full);if(isFinite(v))t.beitrag=v}
    });
  });
  if(A.calcWish===undefined)A.calcWish=false;
  A.calc.kz=A.calc.kz!==false;
  /* Themen ohne ausdrückliches Angebot, aber mit Tarifen */
  ['kz','pf'].forEach(function(k){if(A.tarife[k].length&&A.noInt.indexOf(k)<0)A.topics[k]=true});
  var dd={};A.bestand=A.bestand.filter(function(b){if(dd[b.n])return false;dd[b.n]=1;return true});
  if(A.allUnv)A.bestand.forEach(function(b){if(!b.due)b.unv=true});
  A.situation=A.situation.filter(function(x,i,a){return a.indexOf(x)===i}).slice(0,4);
  return A;
}
function gvMissing(A){
  var M=[];
  if(!A.anlass)M.push({id:'anlass',t:'Anlass des Gesprächs ist nicht erkennbar.',crit:false});
  if(!A.topics.kz&&!A.topics.pf)M.push({id:'topics',t:'Es ist kein Angebot oder Beratungsthema erkennbar. Ohne Thema kann keine Kundeninformation entstehen.',crit:true});
  ['kz','pf'].forEach(function(k){if(!A.topics[k])return;var n=GV_MODS[k].name,T=A.tarife[k];
    if(!T.length)M.push({id:k+'t',t:n+': keine Tarifvarianten angegeben. Die Kundeninformation enthält allgemeine Erläuterungen und gekennzeichnete Platzhalter.',crit:false});
    T.forEach(function(t){if(!isFinite(t.beitrag))M.push({id:k+'b'+t.n,t:n+', Tarif '+t.n+': Beitrag fehlt (Platzhalter im Dokument).',crit:false});
      if(A.platz[k+'|'+t.n]||!gvFN(t))M.push({id:k+'l'+t.n,t:n+', Tarif '+t.n+': Leistungsbeschreibung fehlt oder ist nur ein Platzhalter.',crit:false})});
    if(T.length>=2&&T.every(function(t){return !gvFN(t)}))M.push({id:k+'v',t:n+': Ein vollständiger Leistungsvergleich ist noch nicht möglich, nur die Beiträge werden verglichen.',crit:false});
    if(T.length&&A.announce[k]&&T.every(function(t){return !isFinite(t.beitrag)}))M.push({id:k+'a',t:n+': Du wolltest Tarife mit Beiträgen einfügen, es sind aber keine Beiträge erkannt worden.',crit:false});
  });
  if(A.topics.pf&&A.region&&A.region!=='Baden-Württemberg')M.push({id:'reg',t:'Für '+A.region+' liegen keine eigenen Durchschnittswerte vor. Verwendet werden Landeswerte für Baden-Württemberg (vdek, '+GVPF.stand+').',crit:false,info:true});
  return M;
}
function gvAsks(A){
  var Q=[];
  if(!A.topics.kz&&!A.topics.pf&&!A.q.topics)Q.push({q:'topics',t:'Welche Angebote möchtest du dem Kunden mitgeben?',o:[['kz','Krankenzusatz'],['pf','Pflegezusatz'],['both','Beide']]});
  if(!A.anlass&&!A.q.anlass)Q.push({q:'anlass',t:'Was ist der Anlass des Gesprächs?',o:[['wa','Fälligkeit oder Wiederanlage'],['vertrag','Bestehender Vertrag'],['fin','Finanzielle Situation'],['anl','Konkretes Anliegen']]});
  return Q;
}
var GV_ANL={wa:'Vertragsfälligkeit und Wiederanlage',vertrag:'Besprechung eines bestehenden Vertrags',fin:'Besprechung der finanziellen Situation',anl:'Konkretes Anliegen des Kunden'};
function gvAnswer(q,v){var A=prep.A;if(!A)return;A.q[q]=true;
  if(q==='topics'){if(v==='both'){A.topics.kz=true;A.topics.pf=true}else A.topics[v]=true;['kz','pf'].forEach(function(k){if(A.topics[k]&&A.order.indexOf(k)<0)A.order.push(k)})}
  else if(q==='anlass'){A.anlassTyp=v;A.anlass=GV_ANL[v]}
  render()}
function gvTopicsOn(A){var o=A.order.filter(function(k){return A.topics[k]});['kz','pf'].forEach(function(k){if(A.topics[k]&&o.indexOf(k)<0)o.push(k)});return o}
/* ---------- Berechnungen ---------- */
function gvKzCalc(A){
  var T=A.tarife.kz.filter(function(t){return isFinite(t.beitrag)}),names=['Geringe Nutzung','Mittlere Nutzung','Höhere Nutzung'];
  return T.map(function(t){var j=t.beitrag*12;return {n:t.n,monat:t.beitrag,jahr:j,sc:A.ass.map(function(e,i){var d=j-e;return {l:names[i],e:e,d:d}})}});
}
function gvPfCalc(A){var m=A.pfEig,res=[1,3,5,8].map(function(y){return {y:y,v:m*12*y}});return {m:m,j:m*12,res:res,reicht:function(r){return r/m}}}
function chartKzCalc(A,calc){
  var W=1100,H=520,k=cv(W,H),x=k.x,L=70,R=40,T=96,B=118,pw=W-L-R,ph=H-T-B,cols=['#1B2F66','#B8690A','#6B4FA0'],mx=0;
  calc.forEach(function(c){mx=Math.max(mx,c.jahr)});A.ass.forEach(function(e){mx=Math.max(mx,e)});mx=niceMax(mx*1.12);
  x.fillStyle='#16202A';x.font='bold 27px '+FONT;x.textAlign='left';x.textBaseline='alphabetic';x.fillText('Jahresbeitrag und angenommene Erstattung',L,38);
  x.font='19px '+FONT;x.fillStyle='#5B6773';x.fillText('Rechenbeispiel in Euro pro Jahr. Keine Prognose, keine Garantie.',L,64);
  x.textBaseline='middle';
  for(var i=0;i<=4;i++){var yv=mx*i/4,y=T+ph-ph*i/4;x.strokeStyle='#E3E8ED';x.lineWidth=1;x.beginPath();x.moveTo(L,y);x.lineTo(W-R,y);x.stroke();x.fillStyle='#5B6773';x.textAlign='right';x.font='17px '+FONT;x.fillText(nf.format(yv),L-8,y)}
  var n=A.ass.length,gap=pw/n,nb=calc.length+1,bw=Math.min(70,gap*0.8/nb);
  A.ass.forEach(function(e,si){
    var cx=L+gap*(si+0.5),x0=cx-nb*bw/2,series=[{v:e,c:'#2C7A57'}].concat(calc.map(function(c,ci){return {v:c.jahr,c:cols[ci%3]}}));
    series.forEach(function(s,j){var h=s.v/mx*ph,bx=x0+j*bw;x.fillStyle=s.c;x.fillRect(bx+3,T+ph-h,bw-6,h);x.fillStyle='#16202A';x.font='bold 17px '+FONT;x.textAlign='center';x.fillText(nf.format(s.v),bx+bw/2,T+ph-h-14)});
    x.fillStyle='#16202A';x.font='bold 19px '+FONT;x.textBaseline='alphabetic';x.textAlign='center';x.fillText(['Geringe','Mittlere','Höhere'][si]+' Nutzung',cx,T+ph+30);
    x.font='16px '+FONT;x.fillStyle='#5B6773';x.fillText(calc.map(function(c){var d=c.sc[si].d;return (calc.length>1?c.n+': ':'')+(d>=0?'Eigenaufwand ':'Erstattung höher um ')+nf.format(Math.abs(d))+' €'}).join('   '),cx,T+ph+54);x.textBaseline='middle';
  });
  var lx=L,ly=H-22,leg=[['Angenommene Erstattung','#2C7A57']].concat(calc.map(function(c,ci){return ['Jahresbeitrag Tarif '+c.n,cols[ci%3]]}));
  x.font='18px '+FONT;x.textAlign='left';leg.forEach(function(g){x.fillStyle=g[1];x.fillRect(lx,ly-9,18,18);x.fillStyle='#16202A';x.fillText(g[0],lx+26,ly);lx+=x.measureText(g[0]).width+58});
  return k.c;
}
function chartPf(){
  return stackedBars([{label:'Durchschnitt Baden-Württemberg',segs:[{v:GVPF.pflege,c:'#6B4E9B',t:'Pflege (inkl. Ausbildung)'},{v:GVPF.uv,c:'#25507A',t:'Unterkunft und Verpflegung'},{v:GVPF.invest,c:'#B8690A',t:'Investitionskosten'}]}],{title:'Eigenanteil im Pflegeheim, Monat 1 bis 12',unit:'Euro pro Monat nach Leistung der Pflegeversicherung, Landesdurchschnitt BW, Stand '+GVPF.stand,h:430});
}
/* ---------- Dokumente ---------- */
function gvName(){var k=String(prep.kenn||'').trim().replace(/[^A-Za-z0-9ÄÖÜäöüß_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,24);return k||'Kunde'}
function gvTdesc(A,k){var T=A.tarife[k];return T.length?T.map(function(t){return 'Tarif '+t.n+(isFinite(t.beitrag)?' ('+eur(t.beitrag)+' pro Monat)':' (Beitrag offen)')}).join(', '):'noch keine Tarifvarianten angegeben'}
function gvKunden(lv){
  lv=lv||0;var A=prep.A,b=[],tops=gvTopicsOn(A);
  b.push({t:'head',compact:true,hdr:'KUNDENINFORMATION',foot:'Information zu Ihren Angeboten. Keine Garantie, keine Rechtsberatung.',kick:'KUNDENINFORMATION',title:tops.length===1?(tops[0]==='kz'?'Ihr Krankenzusatz im Überblick':'Pflege: Kosten und Absicherung'):'Krankenzusatz und Pflege im Überblick',sub:'Erstellt am '+fmtFull(todayIso())});
  tops.forEach(function(k){
    if(k==='kz'){
      var T=A.tarife.kz,F=GV_MODS.kz.feat;
      b.push({t:'h',text:'Krankenzusatz: Wo die Kasse endet'});
      b.push({t:'p',text:'Die gesetzliche Kasse sichert die Grundversorgung. Bei Zahnersatz zahlt sie einen Festzuschuss, bei Brillen nur in Ausnahmefällen, bei der professionellen Zahnreinigung oft nichts oder nur einen Teil. Ein Zusatztarif kann hier ergänzen, je nach Tarif.'});
      var pl='[Angabe folgt]',head=['Leistung'].concat(T.length?T.map(function(t){return 'Tarif '+t.n}):['Ihr Tarif']),rows=[];
      var show=F.filter(function(f){return GV_MODS.kz.core.indexOf(f[0])>=0||T.some(function(t){return t.f[f[0]]})});
      var bm=['Monatlicher Beitrag'].concat(T.length?T.map(function(t){return isFinite(t.beitrag)?eur(t.beitrag):pl}):[pl]),bj=['Jährlicher Beitrag'].concat(T.length?T.map(function(t){return isFinite(t.beitrag)?eur(t.beitrag*12):pl}):[pl]);
      rows.push(bm);rows.push(bj);show.forEach(function(f){rows.push([f[1]].concat(T.length?T.map(function(t){return t.f[f[0]]||'nicht angegeben'}):[pl]))});
      b.push({t:'table',head:head,w:T.length>=2?[0.28,0.36,0.36]:[0.4,0.6],rows:rows});
      var nogo=F.filter(function(f){return GV_MODS.kz.core.indexOf(f[0])<0&&!T.some(function(t){return t.f[f[0]]})}).map(function(f){return f[1]});
      if(T.length&&lv<1)b.push({t:'small',text:'„Nicht angegeben“ bedeutet, dass die Angabe hier nicht vorliegt. Es heißt nicht, dass die Leistung ausgeschlossen ist. Nicht angegeben: '+(nogo.join(', ')||'-')+'. Maßgeblich sind die Tarifbedingungen.'});
      if(T.length>=2&&T.every(function(t){return !gvFN(t)}))b.push({t:'small',text:'Ein vollständiger Leistungsvergleich ist noch nicht möglich, die Leistungsangaben der Tarife fehlen.'});
      if(A.calc.kz){var C=gvKzCalc(A);
        if(C.length){
          b.push({t:'sh',text:'Rechenbeispiel: Beitrag und angenommene Erstattung'});
          var rr=[];C.forEach(function(c){c.sc.forEach(function(s){rr.push([(C.length>1?'Tarif '+c.n+', ':'')+s.l,eur(s.e),eur(c.jahr),s.d>=0?eur(s.d):'Erstattung höher um '+eur(-s.d)])})});
          b.push({t:'table',head:['Szenario','Erstattung (Annahme)','Beitrag pro Jahr','Eigenaufwand'],w:[0.3,0.24,0.2,0.26],rows:rr});
          if(lv<2)b.push({t:'img',src:chartKzCalc(A,C).toDataURL('image/png'),ratio:520/1100,w:lv<1?150:112});
          b.push({t:'small',text:'Die Erstattungen sind Annahmen für ein Rechenbeispiel, keine Prognose und keine Garantie. Tatsächliche Erstattungen hängen von Ihren Rechnungen, den Tarifbedingungen und möglichen Erstattungsgrenzen ab. Nicht genutzte Leistungen werden nicht erstattet. Der Wert einer Versicherung zeigt sich nicht nur darin, ob die Erstattungen eines Jahres den Beitrag übersteigen: Sie sichern auch Kosten ab, die erst später oder unerwartet entstehen.'})}
        else b.push({t:'small',text:'Für den Rechner fehlt noch der Beitrag eines Tarifs. Sobald er vorliegt, wird das Rechenbeispiel ergänzt.'})}
    }
    if(k==='pf'){
      var P=gvPfCalc(A),PT=A.tarife.pf,g=GVPF;
      b.push({t:'h',text:'Pflege: Was im Pflegeheim kosten kann'});
      b.push({t:'p',text:'Die gesetzliche Pflegeversicherung ist eine Teilleistung. Im Pflegeheim zahlt sie je nach Pflegegrad einen festen Betrag und einen Zuschlag auf den pflegebedingten Eigenanteil, der mit der Aufenthaltsdauer steigt (15 %, 30 %, 50 % und 75 %). Was darüber hinausgeht, bleibt als Eigenanteil bei der pflegebedürftigen Person.'});
      b.push({t:'kv',rows:[['Eigenanteil pro Monat, Ø Baden-Württemberg',eur(g.gesamt)],['davon Pflege (inkl. Ausbildungsumlage '+eur(g.ausb)+', rechnerisch)',eur(g.pflege)],['davon Unterkunft und Verpflegung',eur(g.uv)],['davon Investitionskosten',eur(g.invest)]],strong:0});
      b.push({t:'img',src:chartPf().toDataURL('image/png'),ratio:430/1100,w:lv<1?140:100});
      b.push({t:'table',head:['Zeitraum','Belastung (Modellrechnung)'],w:[0.4,0.6],rows:P.res.map(function(r){return [r.y===1?'1 Jahr':r.y+' Jahre',eur(r.v)]})});
      b.push({t:'small',text:'Modellrechnung: Der Wert für das erste Jahr ('+eur(P.m)+' pro Monat) wird unverändert fortgeschrieben. Nicht berücksichtigt: steigende Zuschläge der Pflegeversicherung (der Eigenanteil kann sinken) und künftige Preissteigerungen (er kann steigen). Eine Rücklage von 100.000 Euro würde bei diesem Wert rechnerisch rund '+Math.round(100000/P.m)+' Monate reichen. '+g.scope+'. '+(A.region?'Für '+A.region+' liegen keine eigenen Durchschnittswerte vor, die Kosten eines einzelnen Heims können deutlich abweichen. ':'Die Kosten eines einzelnen Heims können deutlich abweichen. ')+'Quelle: '+g.quelle+' (Stichtag 1. Juli 2026).'});
      b.push({t:'sh',text:'Kosten reduzieren oder mehr Gestaltungsspielraum?'});
      b.push({t:'table',head:['Ziel','Was das bedeuten kann (allgemein)'],w:[0.32,0.68],rows:[['Finanzielle Belastung reduzieren','Eine vereinbarte monatliche Leistung deckt einen Teil des Eigenanteils ab. Die Höhe bestimmt, wie viel davon.'],['Mehr Selbstbestimmung','Ein höheres oder flexibler verwendbares Leistungsniveau kann mehr Spielraum für die Gestaltung der Pflege geben, zum Beispiel zu Hause. Ob ein Tarif das bietet, steht in seinen Bedingungen.']]});
      if(PT.length){
        var pc=GV_MODS.pf.feat,prow=[['Monatlicher Beitrag'].concat(PT.map(function(t){return isFinite(t.beitrag)?eur(t.beitrag):'[Angabe folgt]'}))];
        pc.forEach(function(f){if(PT.some(function(t){return t.f[f[0]]})||GV_MODS.pf.core.indexOf(f[0])>=0)prow.push([f[1]].concat(PT.map(function(t){return t.f[f[0]]||'nicht angegeben'})))});
        b.push({t:'sh',text:'Ihre Pflegeangebote im Vergleich'});b.push({t:'table',head:['Merkmal'].concat(PT.map(function(t){return 'Tarif '+t.n})),w:PT.length>=2?[0.28,0.36,0.36]:[0.4,0.6],rows:prow});
      } else b.push({t:'small',text:'Tarifangaben zu den Pflegeangeboten: [Angabe folgt]. Konkrete Leistungen und Beiträge stehen in den Angeboten.'});
    }
  });
  b.push({t:'disc',text:'Diese Information dient dem Verständnis und begleitet Ihre Angebote. Sie ist keine Produktempfehlung und keine Rechts- oder Steuerberatung. Verbindlich sind allein die Tarifbedingungen und Ihr Angebot.'});
  return b;
}
function gvFN(t){return Object.keys(t.f).filter(function(k){return t.f[k]}).length}
function buildPrepReport(l,kind){return kind==='k'?gvKunden(l):gvBerater(l)}
function prepMsg(t,bad){var m=$('prepmsg');if(m)m.innerHTML=t?'<p class="'+(bad?'err':'hint-t')+'" role="alert">'+esc(t)+'</p>':''}
function gvPdf(kind){
  var A=prep.A;if(!A)return;var base=(kind==='k'?'Kundeninformation_':'Gesprächsleitfaden_')+gvName()+'_'+todayIso(),build=kind==='k'?gvKunden:gvBerater;
  if(kind==='k'&&!gvTopicsOn(A).length){prepMsg('Für die Kundeninformation fehlt ein Thema. Wähle Krankenzusatz oder Pflege in der Vorschau.',true);return}
  var blocks;try{blocks=build(0)}catch(x){prepMsg('Das Dokument konnte nicht aufgebaut werden: '+(x&&x.message?x.message:'Fehler'),true);return}
  prepMsg('PDF wird erstellt ...');
  loadJsPdf(function(ok){
    function saveHtml(why){prepMsg((why||'Das PDF konnte hier nicht erstellt werden.')+' Du bekommst stattdessen eine HTML-Datei, die du im Browser öffnen und als PDF drucken kannst.',true);var html=renderHtmlReport(blocks);if(dl)dl.save({filename:base+'.html',data:html}).catch(function(){});else fallbackCopy(base+'.html',html)}
    if(!ok){saveHtml('Die PDF-Bibliothek konnte nicht geladen werden.');return}
    var buf,l=0;try{buf=renderPdf(blocks);while(renderPdf.pages>2&&l<2){l++;blocks=build(l);buf=renderPdf(blocks)}}catch(x){saveHtml('Beim Erstellen ist ein Fehler aufgetreten.');return}
    var pg=renderPdf.pages;
    if(!dl){prepMsg('Direktes Speichern ist hier nicht verfügbar.',true);return}
    dl.save({filename:base+'.pdf',data:buf}).then(function(){prepMsg('PDF gespeichert ('+pg+' Seite'+(pg===1?'':'n')+').'+(pg>2?' Hinweis: Mehr als zwei Seiten, bitte Inhalte in der Vorschau reduzieren.':''))},function(er){if(er&&er.code==='declined'){prepMsg('');return}prepMsg('Speichern nicht möglich ('+(er&&er.code?er.code:'Fehler')+').',true)});
  });
}
/* ---------- Oberfläche ---------- */
function gvSet(path,val){var p=path.split('.'),o=prep;for(var i=0;i<p.length-1;i++){o=o[p[i]];if(o==null)return}var k=p[p.length-1];o[k]=val}
function prepInput(el){
  var k=el.dataset.prep,v=el.value;
  if(el.dataset.num!==undefined){var n=gvNum(v);v=isFinite(n)?n:NaN}
  if(el.dataset.lst!==undefined){var arr=String(v).split('\n').map(function(x){return x.trim()}).filter(Boolean);var pp=k.split('.'),o=prep;for(var i=0;i<pp.length-1;i++)o=o[pp[i]];o[pp[pp.length-1]]=arr;return}
  gvSet(k,v);
}
/* ---------- Gesprächsvorbereitung: geführter Ablauf ---------- */
var GV_ANLT=[['vertrag','Vertragsbesprechung','Ein bestehender Vertrag wird besprochen.','folder'],['faell','Vertragsfälligkeit','Ein Vertrag läuft aus oder wird fällig.','calendar'],['wa','Wiederanlage von Geld','Geld soll neu angelegt werden.','trend'],['allg','Allgemeines Beratungsgespräch','Überblick über die Situation des Kunden.','users'],['anfrage','Kundenanfrage','Der Kunde hat eine konkrete Frage.','chat'],['sonst','Sonstiger Anlass','Anderer Grund für den Termin.','doc']];
var GV_ANLN={vertrag:'Vertragsbesprechung',faell:'Vertragsfälligkeit',wa:'Wiederanlage von Geld',allg:'Allgemeines Beratungsgespräch',anfrage:'Kundenanfrage',sonst:'Sonstiger Anlass'};
var GV_PROD=[
 {k:'sach',n:'Sachversicherungen',ic:'home',col:'#25507A',kurz:'Haftpflicht, Hausrat, Gebäude, Rechtsschutz, Kfz',
  warum:'Sachversicherungen sichern Schäden mit hohen Folgekosten ab. Eine kurze Bestandsprüfung kann sinnvoll sein, wenn sich Wohnung, Familie oder Fahrzeug geändert haben.',
  frag:['Wann wurden Umfang und Versicherungssummen zuletzt geprüft?','Hat sich bei Wohnung, Haus, Familie oder Fahrzeug etwas geändert?'],
  klaer:['Welche Sachversicherungen bestehen und bei wem?','Gibt es einen Anlass für eine Prüfung?'],
  nat:'„Wenn wir schon über Ihre Verträge sprechen: Wann haben Sie zuletzt geschaut, ob der Schutz noch zu Ihrer Wohnsituation passt?“',
  unterl:'Eigene Angebots- oder Prüfunterlagen',wk:'sach'},
 {k:'kz',n:'Krankenzusatzversicherung',ic:'hospital',col:'#0E7490',kurz:'Zahn, Zahnreinigung, Brille, Vorsorge, Mitgliedertarif',
  warum:'Die gesetzliche Kasse sichert die Grundversorgung. Bei Zahnersatz, Brille und Zahnreinigung bleibt oft ein Eigenanteil. Das Thema ist relevant, wenn dem Kunden diese Leistungen wichtig sind oder Kosten anstehen.',
  frag:['Welche Kosten für Zahn oder Brille haben Sie zuletzt selbst getragen?','Was ist Ihnen bei Gesundheitsleistungen wichtig?','Besteht schon eine Zusatzversicherung?'],
  klaer:['Besteht bereits ein Zusatzschutz?','Welche Leistungen sind dem Kunden wichtig?','Tarifbeiträge und Leistungen aus den Tarifunterlagen'],
  nat:'„Ein Thema, das oft untergeht: Was die Kasse beim Zahnarzt oder bei der Brille nicht zahlt. Darf ich Ihnen kurz zeigen, wo die Kasse endet?“',
  unterl:'Kundeninformation Krankenzusatz und Tarifangebot',wk:'kz',doc:true},
 {k:'pf',n:'Pflegezusatzversicherung',ic:'shieldok',col:'#6B4E9B',kurz:'Pflegekosten, Eigenanteil, Selbstbestimmung',
  warum:'Die gesetzliche Pflegeversicherung ist eine Teilleistung. Im Pflegeheim bleibt ein Eigenanteil. Das Thema ist relevant, wenn der Kunde Vermögen schützen oder die Pflege selbst gestalten möchte.',
  frag:['Wie stellen Sie sich eine Pflege vor: zu Hause oder im Heim?','Wie wichtig ist es Ihnen, die Pflege selbst zu gestalten?','Haben Sie mit Ihrer Familie schon darüber gesprochen?'],
  klaer:['Besteht schon eine Pflegeabsicherung?','Welche Rücklagen gibt es?','Tarifleistungen aus den Tarifunterlagen'],
  nat:'„Pflege ist ein Thema, über das viele erst spät sprechen. Soll ich Ihnen zeigen, was im Pflegeheim im Durchschnitt zu zahlen bleibt?“',
  unterl:'Kundeninformation Pflege und Tarifangebot',wk:'pf',doc:true},
 {k:'vs',n:'Vermögensschutz',ic:'wallet',col:'#2C7A57',kurz:'Rücklagen vor hohen Folgekosten schützen',
  warum:'Hohe Kosten durch Pflege oder schwere Unfälle können Rücklagen belasten. Das Thema ist relevant, wenn der Kunde Vermögen aufgebaut hat und es erhalten möchte.',
  frag:['Wofür sind Ihre Rücklagen vorgesehen?','Welche Kosten sollen Ihre Rücklagen nicht tragen müssen?'],
  klaer:['Welche Rücklagen und Ziele gibt es?','Welche Absicherungen bestehen schon?'],
  nat:'„Sie haben Vermögen aufgebaut. Wie wichtig ist es Ihnen, dass es bei unerwarteten Kosten erhalten bleibt?“',
  unterl:'Eigene Unterlagen zu den gewählten Lösungen',wk:'pf'},
 {k:'uv',n:'Unfallversicherung',ic:'shield',col:'#B4506B',kurz:'Auch mit Beitragsrückgewähr',
  warum:'Die gesetzliche Unfallversicherung gilt nur bei Arbeit, Weg und Schule. In der Freizeit besteht dadurch kein Schutz. Das Thema ist relevant, wenn der Kunde viel in der Freizeit unternimmt oder Familie hat.',
  frag:['Wie sieht Ihre Absicherung bei einem Unfall in der Freizeit aus?','Welche finanziellen Folgen hätte ein schwerer Unfall?'],
  klaer:['Besteht schon eine Unfallversicherung?','Ist eine Beitragsrückgewähr für den Kunden überhaupt interessant?'],
  nat:'„Bei der Arbeit ist man über die gesetzliche Unfallversicherung geschützt, in der Freizeit nicht. Wie ist das bei Ihnen geregelt?“',
  unterl:'Eigene Tarifunterlagen. Rückgewähr nur laut Bedingungen.',wk:'uv'},
 {k:'ga',n:'Geldanlage und Vorsorge',ic:'sun',col:'#B8690A',kurz:'Anlage und Vorsorge in Versicherungslösungen',
  warum:'Bei Wiederanlage oder Fälligkeit stellt sich die Frage nach Ziel, Zeithorizont und Verfügbarkeit des Geldes.',
  frag:['Welches Ziel hat das Geld, und wann brauchen Sie es?','Wie wichtig ist es Ihnen, jederzeit an das Geld zu kommen?','Wie gehen Sie mit Schwankungen um?'],
  klaer:['Ziel, Zeithorizont, Risikobereitschaft und Verfügbarkeit','Beratungs- und Dokumentationspflichten beachten'],
  nat:'„Bevor wir über Produkte sprechen: Was soll das Geld in den nächsten Jahren für Sie erreichen?“',
  unterl:'Eigene Unterlagen. Keine Renditeaussagen ohne Produktunterlagen.',wk:'ga'}
];
function gvProd(k){return GV_PROD.filter(function(p){return p.k===k})[0]}
function newPrep(){return {txt:'',kenn:'',datum:todayIso(),anlass:'',sel:{},step:0,A:null,lf:true,busy:false}}
var prep=newPrep();
function gvSelKeys(){return GV_PROD.filter(function(p){return prep.sel[p.k]}).map(function(p){return p.k})}
function gvSync(){var A=prep.A;if(!A)return;A.topics.kz=!!prep.sel.kz;A.topics.pf=!!prep.sel.pf;A.order=['kz','pf'].filter(function(k){return prep.sel[k]})}
function gvBuild(){
  var A=gvAnalyse(prep.txt||'');
  ['kz','pf'].forEach(function(k){if(A.topics[k]&&A.noInt.indexOf(k)<0)prep.sel[k]=true});
  A.noInt.forEach(function(k){if(prep.sel[k]&&A.tarife[k]&&!A.tarife[k].length)prep.sel[k]=false});
  prep.A=A;if(prep.anlass)A.anlassTyp=prep.anlass;else if(A.anlassTyp)prep.anlass=({wa:'wa',vertrag:'vertrag',fin:'allg',anl:'sonst'})[A.anlassTyp]||'';
  gvSync();
}
function gvAnl(){return prep.anlass?GV_ANLN[prep.anlass]:(prep.A&&prep.A.anlass)||'noch offen'}
function gvEin(){
  var t=prep.anlass,a=prep.A?prep.A.anlass:'';
  var m={vertrag:'„Schön, dass wir uns Zeit nehmen. Wir schauen uns heute Ihren Vertrag in Ruhe an. Was möchten Sie dazu klären?“',faell:'„Guten Morgen, schön, dass Sie da sind. Wir schauen uns heute in Ruhe an, welche Möglichkeiten Sie bei der anstehenden Fälligkeit haben.“',wa:'„Schön, dass Sie da sind. Wir sprechen heute darüber, wie Ihr Geld weiter angelegt werden kann. Was soll es für Sie erreichen?“',allg:'„Schön, dass wir uns Zeit nehmen. Mich interessiert zuerst, wie Ihre Situation heute aussieht und was Ihnen wichtig ist.“',anfrage:'„Schön, dass Sie da sind. Sie hatten eine Frage mitgebracht. Wollen wir damit beginnen?“',sonst:'„Schön, dass Sie da sind. Wir beginnen mit Ihrem Anliegen. Was ist Ihnen für heute am wichtigsten?“'};
  return m[t]||m.sonst}
function gvLeit(){
  var sel=gvSelKeys(),A=prep.A||{},P=sel.map(gvProd),an=gvAnl(),wa=prep.anlass==='wa'||prep.anlass==='faell',S=[];
  S.push({n:1,t:'Einstieg und ursprüngliches Anliegen',items:[gvEin(),'Anliegen ('+an+') zuerst vollständig klären, noch kein Zusatzthema.']});
  var q=[wa?'Welches Ziel und welchen Zeithorizont hat das Geld?':'Was soll das Gespräch für Sie klären?','Hat sich in Ihrer Situation zuletzt etwas verändert?'];
  if(A.wuensche&&A.wuensche.length)q.push('Kundenwunsch aus der Vorbereitung aufgreifen: '+gvCut(A.wuensche[0],100));
  S.push({n:2,t:'Fragen zur aktuellen Situation',items:q.slice(0,3)});
  if(P.length)S.push({n:3,t:'Überleitung zu den gewählten Themen',items:['„Wenn wir das geklärt haben: Es gibt '+(P.length===1?'ein Thema':'ein paar Themen')+', das häufig zu kurz kommt, nämlich '+P.map(function(p){return p.n}).join(', ')+'. Darf ich Ihnen dazu kurz etwas zeigen?“','Erst überleiten, wenn das ursprüngliche Anliegen beantwortet ist. Nicht so formulieren, als sei der Anlass nur ein Vorwand.']});
  if(P.length)S.push({n:4,t:'Besprechung der Themen und Angebote',items:P.map(function(p){return p.n+': '+gvCut(p.frag[0],90)})});
  var kf=['Wie hoch sind die Kosten, und was passiert, wenn ich die Leistungen nicht nutze?'];
  if(sel.indexOf('kz')>=0||sel.indexOf('pf')>=0)kf.push('Was ist der konkrete Vorteil für mich, und was unterscheidet die Varianten?');
  S.push({n:5,t:'Fragen und Einwände des Kunden',items:kf.concat(['Einwände ernst nehmen, nachfragen, sachlich antworten. Muster im Bereich Wissen.'])});
  S.push({n:6,t:'Nächste Schritte und Abschluss',items:['Ergebnis kurz zusammenfassen und offene Fragen klären.','Unterlagen mitgeben, Folgetermin oder Wiedervorlage festlegen und notieren.']});
  return S;
}
function gvProdInfo(p){
  var A=prep.A||{},info=[],unv=(A.bestand||[]).filter(function(b){return b.unv}),T=(A.tarife&&A.tarife[p.k])||[];
  if(p.k==='sach'&&(A.bestand||[]).some(function(b){return /Sachversicherung|Haftpflicht|Hausrat|Wohngeb|Rechtsschutz|Kfz/.test(b.n)})){var bs=A.bestand.filter(function(b){return /Sachversicherung|Haftpflicht|Hausrat|Wohngeb|Rechtsschutz|Kfz/.test(b.n)});info.push('Bestand laut Text: '+bs.map(function(b){return b.n+(b.unv?' (bleibt unverändert)':'')}).join(', '))}
  if(T.length)info.push('Tarife laut Text: '+T.map(function(t){return 'Tarif '+t.n+(isFinite(t.beitrag)?' '+eur(t.beitrag)+' pro Monat':'')}).join(', '));
  if(p.k==='ga'&&(A.bestand||[]).some(function(b){return b.due}))info.push('Fälliger Vertrag: '+A.bestand.filter(function(b){return b.due}).map(function(b){return b.n}).join(', '));
  if(A.wuensche&&A.wuensche.length&&(p.k==='kz'&&/zahn|brille|vorsorge/i.test(A.wuensche.join(' '))||p.k==='pf'&&/pflege/i.test(A.wuensche.join(' '))))info.push('Kundenwunsch: '+gvCut(A.wuensche[0],110));
  return info;
}
function gvBerater(lv){
  lv=lv||0;var A=prep.A,b=[],sel=gvSelKeys(),P=sel.map(gvProd),L=gvLeit();
  b.push({t:'head',compact:true,hdr:'GESPRÄCHSLEITFADEN | INTERN',foot:'Intern, nicht für den Kunden bestimmt. Keine Produktempfehlung.',kick:'GESPRÄCHSLEITFADEN | INTERN',title:'Gesprächsvorbereitung',sub:(String(prep.kenn||'').trim()?gvCut(prep.kenn,30)+'  |  ':'')+fmtFull(prep.datum||todayIso())+'  |  '+gvAnl()});
  var fr=[['Anlass',gvAnl()+(A&&A.anlass&&prep.anlass&&A.anlass!==GV_ANLN[prep.anlass]?': '+gvCut(A.anlass,110):'')],['Ziel','Zuerst das Anliegen klären, dann passende Themen anbieten.'],['Themen',P.length?P.map(function(p){return p.n}).join(', '):'noch keine gewählt']];
  if(A&&A.situation.length)fr.push(['Situation',gvCut(A.situation.join(' '),lv>=1?110:170)]);
  if(A&&A.wuensche.length)fr.push(['Kundenwunsch',gvCut(A.wuensche.join(' '),lv>=1?100:150)]);
  var unv=A?A.bestand.filter(function(x){return x.unv}).map(function(x){return x.n}):[];if(unv.length)fr.push(['Unverändert',unv.join(', ')+'. Nur Kontext, kein Anlass für eine Anpassung.']);
  b.push({t:'facts',rows:fr});
  if(P.length){b.push({t:'h',text:'Themen und Gesprächsansätze'});
    P.forEach(function(p){var info=gvProdInfo(p),rows=[['Relevanz',gvCut(p.warum,lv>=1?130:200)],['Vorliegend',info.length?gvCut(info.join('; '),lv>=1?110:170):'noch nichts bekannt'],['Klären',gvCut(p.klaer.slice(0,2).join('; '),lv>=1?100:150)],['Fragen',p.frag.slice(0,lv>=1?2:3).map(function(x){return '„'+x+'“'}).join(' ')]];if(lv<1)rows.push(['Ansprache',p.nat]);
      b.push({t:'card',title:p.n,tag:p.kurz,col:p.col,rows:rows})})}
  b.push({t:'pb'});
  b.push({t:'h',text:'Gesprächsleitfaden'});
  L.forEach(function(s){b.push({t:'sh',text:s.n+'  '+s.t});b.push({t:'bul',items:s.items.slice(0,lv>=1?2:3)})});
  if(lv<2){b.push({t:'sh',text:'Mögliche Kundenfragen (Vorbereitungshilfe, keine bekannten Einstellungen)'});b.push({t:'bul',items:['Warum sollte ich das überhaupt brauchen?','Was ist der konkrete Vorteil für mich, und welche Kosten entstehen?','Was passiert, wenn ich die Leistungen nicht nutze?'].concat(P.length&&A&&((A.tarife.kz||[]).length>=2||(A.tarife.pf||[]).length>=2)?['Was unterscheidet die angebotenen Varianten?']:[])})}
  var U=P.map(function(p){return p.n+': '+p.unterl});b.push({t:'sh',text:'Angebote und Unterlagen zum Mitgeben'});b.push({t:'bul',items:U.length?U:['noch keine Themen gewählt']});
  b.push({t:'chk',title:'Checkliste',rows:[{name:'Ursprüngliches Anliegen abgeschlossen',ok:false,text:''},{name:'Interesse an den Zusatzthemen erfragt',ok:false,text:''},{name:'Unterlagen mitgegeben',ok:false,text:''},{name:'Folgetermin oder Wiedervorlage notiert',ok:false,text:''}]});
  return b;
}
/* ---------- Oberfläche ---------- */
function gvTarife(){
  var A=prep.A,h='';
  ['kz','pf'].forEach(function(k){
    if(!prep.sel[k])return;var T=A.tarife[k],mod=GV_MODS[k],b='';
    if(T.length)b+='<div class="gxtbl"><table><tr><th>Tarif</th><th>Beitrag pro Monat</th>'+mod.feat.map(function(f){return '<th>'+f[1]+'</th>'}).join('')+'<th></th></tr>'+T.map(function(t,i){return '<tr><td>'+gvIn('A.tarife.'+k+'.'+i+'.n',t.n,{lbl:'Tarifname',max:30})+'</td><td>'+gvIn('A.tarife.'+k+'.'+i+'.beitrag',t.beitrag,{num:true,lbl:'Beitrag',ph:'fehlt'})+'</td>'+mod.feat.map(function(f){return '<td'+(t.f[f[0]]?'':' class="gxn"')+'>'+gvIn('A.tarife.'+k+'.'+i+'.f.'+f[0],t.f[f[0]]||'',{lbl:f[1],ph:'nicht angegeben',max:100})+'</td>'}).join('')+'<td><button class="gxx" data-act="gv-delt" data-k="'+k+'" data-i="'+i+'" aria-label="Tarif entfernen">×</button></td></tr>'}).join('')+'</table></div>';
    else b+='<p class="hint-t">Keine Tarife angegeben. Die Kundeninformation enthält gekennzeichnete Platzhalter.</p>';
    b+='<div class="btnrow tight"><button class="btn" data-act="gv-addt" data-k="'+k+'">Tarif hinzufügen</button></div>';
    if(k==='kz')b+='<div class="gxcalc"><label class="gxtg"><input type="checkbox" data-act="gv-chk" data-p="kz"'+(A.calc.kz?' checked':'')+'> Effektivrechner mit drei Szenarien</label><div class="gxass"><span>Angenommene Erstattung pro Jahr</span>'+['Gering','Mittel','Höher'].map(function(l,i){return '<label>'+l+gvIn('A.ass.'+i,A.ass[i],{num:true,lbl:'Szenario '+l})+'</label>'}).join('')+'</div><p class="hint-t">Rechenannahmen zur Veranschaulichung. Keine Prognose, keine Garantie.</p></div>';
    if(k==='pf')b+='<div class="gxcalc"><div class="gxass"><span>Eigenanteil im Pflegeheim pro Monat (Modellrechnung)</span><label>Euro'+gvIn('A.pfEig',A.pfEig,{num:true,lbl:'Eigenanteil'})+'</label></div><p class="hint-t">Vorgabe: Ø Baden-Württemberg '+eur(GVPF.gesamt)+' pro Monat, '+esc(GVPF.quelle)+', Stichtag '+GVPF.stand+'. Landeswert, nicht der Preis eines bestimmten Heims.</p></div>';
    h+='<div class="gxsub"><h4>'+mod.name+'</h4>'+b+'</div>';
  });
  return h;
}
function gvIn(path,val,o){o=o||{};var v=(typeof val==='number'&&!isFinite(val))?'':(Array.isArray(val)?val.join('\n'):val);
  return o.area?'<textarea data-prep="'+path+'"'+(o.lst?' data-lst':'')+' rows="'+(o.rows||3)+'" maxlength="'+(o.max||600)+'" placeholder="'+esc(o.ph||'')+'" aria-label="'+esc(o.lbl||'')+'">'+esc(v)+'</textarea>':'<input type="text" data-prep="'+path+'"'+(o.num?' data-num inputmode="decimal"':'')+' value="'+esc(v)+'" maxlength="'+(o.max||160)+'" placeholder="'+esc(o.ph||'')+'" aria-label="'+esc(o.lbl||'')+'" autocomplete="off">'}
function gvStep0(){
  var ks=allKunden();
  return '<h3 class="gvh3">Für wen und wann?</h3><div class="grid2"><label class="fl"><span>Kundennummer (optional, keine Namen)</span><span class="fi"><input type="text" data-prep="kenn" list="gvk" value="'+esc(prep.kenn)+'" maxlength="40" placeholder="z. B. 10482" autocomplete="off"></span></label><label class="fl"><span>Datum des Gesprächs</span><span class="fi"><input type="date" data-prep="datum" value="'+esc(prep.datum)+'"></span></label></div><datalist id="gvk">'+ks.slice(0,60).map(function(k){return '<option value="'+esc(k)+'">'}).join('')+'</datalist>'+
   '<h3 class="gvh3">Was ist der Anlass?</h3><div class="gvtiles">'+GV_ANLT.map(function(o){var on=prep.anlass===o[0];return '<button class="gvt'+(on?' on':'')+'" data-act="gv-anl" data-v="'+o[0]+'" aria-pressed="'+on+'"><span class="gvti">'+ico(o[3],22)+'</span><span><strong>'+o[1]+'</strong><small>'+o[2]+'</small></span></button>'}).join('')+'</div>';
}
function gvStep1(){
  return '<h3 class="gvh3">Welche Themen möchtest du ansprechen?</h3><p class="hint-t">Mehrere möglich. Wähle nur, was bei diesem Kunden passt.</p><div class="gvtiles">'+GV_PROD.map(function(p){var on=!!prep.sel[p.k];return '<button class="gvt gvp'+(on?' on':'')+'" style="--hc:'+p.col+'" data-act="gv-prod" data-k="'+p.k+'" aria-pressed="'+on+'"><span class="gvti">'+ico(p.ic,22)+'</span><span><strong>'+p.n+'</strong><small>'+p.kurz+'</small></span><i class="gvck">'+(on?'✓':'')+'</i></button>'}).join('')+'</div>';
}
function gvStep2(){
  return '<h3 class="gvh3">Was sollte die KI über diesen Kunden und das Gespräch wissen?</h3><p class="hint-t">Optional. Ein paar Sätze genügen. Beispiel: Anlass, bestehende Verträge, die unverändert bleiben, Angebote, Tarife mit Beiträgen.</p><textarea id="gvtxt" class="gxtxt" data-prep="txt" rows="8" maxlength="8000" placeholder="Der Kunde kommt wegen einer Vertragsfälligkeit. Seine Sachversicherungen sind in Ordnung und bleiben unverändert. Ich möchte ihm ein Angebot zur Krankenzusatzversicherung mitgeben ...">'+esc(prep.txt)+'</textarea><div class="gxrow"><button class="btn" data-act="gv-ex">Beispieltext einfügen</button></div>';
}
function gvResult(){
  var A=prep.A,sel=gvSelKeys(),P=sel.map(gvProd),h='',unv=A.bestand.filter(function(b){return b.unv});
  h+='<section class="gx"><h3><span class="gxi">'+ico('check',18)+'</span>Gesprächsüberblick</h3><div class="gvov"><div><small>Kunde</small><b>'+esc(prep.kenn||'ohne Kundennummer')+'</b></div><div><small>Datum</small><b>'+fmtFull(prep.datum||todayIso())+'</b></div><div><small>Anlass</small><b>'+esc(gvAnl())+'</b></div><div class="gvw"><small>Ziel</small><b>Erst das Anliegen klären, dann passende Themen anbieten.</b></div></div>'+
    (A.situation.length||A.wuensche.length?'<p class="gvsit"><b>Bekannt:</b> '+esc(gvCut(A.situation.concat(A.wuensche).join(' '),240))+'</p>':'<p class="hint-t">Zur Situation ist noch nichts bekannt. Das erste Gesprächsziel ist, sie zu verstehen.</p>')+
    '<div class="pchips">'+GV_PROD.map(function(p){var on=!!prep.sel[p.k];return '<button class="pchip sm'+(on?' on':'')+'" data-act="gv-prod" data-k="'+p.k+'" aria-pressed="'+on+'"><span class="pck">'+(on?'✓':'')+'</span>'+p.n+'</button>'}).join('')+'</div></section>';
  if(unv.length)h+='<p class="gvnote">Laut deinem Text bleiben unverändert: <b>'+esc(unv.map(function(x){return x.n}).join(', '))+'</b>. Sie dienen nur als Kontext und sind kein Anlass für eine Anpassung.</p>';
  if(!P.length)h+='<p class="hint-t">Noch kein Thema gewählt. Tippe oben auf ein Thema, um es hinzuzufügen.</p>';
  P.forEach(function(p){var info=gvProdInfo(p);
    h+='<section class="gx gvprod" style="--hc:'+p.col+'"><h3><span class="gxi" style="background:'+p.col+'">'+ico(p.ic,18)+'</span>'+p.n+'<button class="gxx" data-act="gv-prod" data-k="'+p.k+'" aria-label="'+p.n+' entfernen" style="margin-left:auto">×</button></h3>'+
     '<div class="gvr"><b>Warum könnte es relevant sein?</b><p>'+esc(p.k==='sach'&&(A.noInt.indexOf('sach')>=0||unv.some(function(b){return /Sachversicherung|Haftpflicht|Hausrat|Wohngeb|Rechtsschutz|Kfz/.test(b.n)}))?'Die bestehenden Sachversicherungen bleiben laut deinem Text unverändert. Sie dienen nur als Kontext, kein Anlass für eine Anpassung.':p.warum)+'</p></div>'+
     '<div class="gvr"><b>Was liegt vor?</b><p>'+(info.length?esc(info.join(' · ')):'Noch nichts bekannt.')+'</p></div>'+
     '<div class="gvr"><b>Was ist noch zu klären?</b><ul class="gvul">'+p.klaer.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>'+
     '<div class="gvr"><b>Fragen</b><ul class="gvul">'+p.frag.slice(0,3).map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>'+
     '<div class="gvr"><b>So kann ich es ansprechen</b><p>'+esc(p.nat)+'</p></div><p class="hint-t"><button class="linkbtn" data-act="gv-wk" data-k="'+p.wk+'">Mehr dazu im Bereich Wissen</button></p></section>'});
  h+='<section class="gx"><h3><span class="gxi">'+ico('chat',18)+'</span>Gesprächsleitfaden<button class="btn small" data-act="gv-lf" style="margin-left:auto">'+(prep.lf?'Ausblenden':'Anzeigen')+'</button></h3>';
  if(prep.lf)h+='<ol class="gvlf">'+gvLeit().map(function(s){return '<li><b>'+esc(s.t)+'</b><ul>'+s.items.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></li>'}).join('')+'</ol><div class="gvkf"><b>Mögliche Kundenfragen</b> <small>(Vorbereitungshilfe, keine bekannten Einstellungen)</small><ul><li>Warum sollte ich das überhaupt brauchen?</li><li>Was ist der konkrete Vorteil für mich, und welche Kosten entstehen?</li><li>Was passiert, wenn ich die Leistungen nicht nutze?</li></ul></div>';
  h+='</section>';
  h+='<section class="gx"><h3><span class="gxi">'+ico('doc',18)+'</span>Angebote und Unterlagen</h3>'+(P.length?'<ul class="gvul">'+P.map(function(p){return '<li><b>'+p.n+':</b> '+esc(p.unterl)+'</li>'}).join('')+'</ul>':'<p class="hint-t">Noch keine Themen gewählt.</p>')+
    ((prep.sel.kz||prep.sel.pf)?'<div class="btnrow tight"><button class="btn" data-act="gv-pdf" data-v="k">Kundeninformation als PDF</button></div><details class="gxdet"><summary>Tarifangaben prüfen und anpassen</summary>'+gvTarife()+'</details>':'')+'</section>';
  var M=gvMissing(A).filter(function(m){return m.id!=='topics'&&m.id!=='anlass'});
  if(M.length&&(prep.sel.kz||prep.sel.pf))h+='<section class="gx"><h3><span class="gxi">'+ico('alert',18)+'</span>Noch zu klären</h3><ul class="gvul">'+M.map(function(m){return '<li>'+esc(m.t)+'</li>'}).join('')+'</ul></section>';
  h+='<section class="gx"><h3><span class="gxi">'+ico('pencil',18)+'</span>Informationen ergänzen</h3><textarea id="gvtxt" data-prep="txt" rows="4" maxlength="8000" placeholder="Weitere Angaben zum Kunden oder Gespräch">'+esc(prep.txt)+'</textarea><div class="btnrow tight"><button class="btn" data-act="gv-regen">Vorbereitung neu erstellen</button></div></section>';
  h+='<div class="btnrow"><button class="btn" data-act="gv-go" data-i="0">Anlass ändern</button><button class="btn cta big" data-act="gv-pdf" data-v="b">Leitfaden als PDF exportieren</button></div><div id="prepmsg"></div>';
  return h;
}
function viewPrep(){
  var S=['Anlass','Themen','Infos','Vorbereitung'],h='<div class="pvh"><div class="pvi">'+ico('check',30)+'</div><div><div class="hm-kick" style="color:var(--accent)">Gesprächsvorbereitung</div><h2>In wenigen Klicks vorbereitet</h2><p>Anlass, Themen, optional ein paar Sätze. Dann bekommst du Fragen und einen kurzen Leitfaden.</p></div></div>';
  h+='<div class="gvsteps">'+S.map(function(t,i){var ok=i<=prep.step||i===0||(prep.A&&i<=3);return '<button class="gvstep'+(prep.step===i?' cur':'')+(i<prep.step?' done':'')+'" '+(ok?'data-act="gv-go" data-i="'+i+'"':'disabled')+'><b>'+(i+1)+'</b>'+t+'</button>'}).join('')+'</div>';
  if(prep.step<3){
    h+=prep.step===0?gvStep0():prep.step===1?gvStep1():gvStep2();
    h+='<div class="btnrow">'+(prep.step>0?'<button class="btn" data-act="gv-go" data-i="'+(prep.step-1)+'">Zurück</button>':'<button class="btn" data-act="gv-reset" data-confirm="Alles zurücksetzen?">Zurücksetzen</button>')+(prep.step<2?'<button class="btn cta big" data-act="gv-go" data-i="'+(prep.step+1)+'">Weiter</button>':'<button class="btn cta big" data-act="gv-gen">Vorbereitung erstellen</button>')+'</div>';
    h+='<p class="hint-t gvpriv">Die Auswertung läuft lokal in der App nach festen Regeln. Dein Text wird nicht an einen KI-Dienst gesendet, nicht ins CRM übertragen und nicht gespeichert.</p>';
  } else h+=prep.A?gvResult():'<p class="err">Bitte zuerst die Vorbereitung erstellen.</p>';
  return h;
}
