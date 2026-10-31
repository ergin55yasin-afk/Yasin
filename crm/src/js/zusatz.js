var ZUS=[
 ['zahn','Zahn','tooth','Die Kasse zahlt einen Festzuschuss zur Regelversorgung, in der Regel 60 %, mit lückenlosem Bonusheft bis zu 75 %. Mehrkosten für höherwertigen Zahnersatz trägt der Patient.'],
 ['pzr','Zahnreinigung','heart','Die professionelle Zahnreinigung zahlen viele Kassen nicht oder nur anteilig. Oft ist sie Selbstzahlerleistung.'],
 ['brille','Sehhilfen und Brillen','glasses','Erwachsene erhalten nur bei starker Fehlsichtigkeit einen Zuschuss. Sonst zahlt der Patient selbst.'],
 ['kh','Krankenhaus','bed','Mehrbettzimmer und Behandlung durch den diensthabenden Arzt. Ein Einbettzimmer oder die Wahl des Chefarztes sind keine Kassenleistung.'],
 ['vor','Vorsorge und Naturheilkunde','shieldok','Vorsorge über das Standardprogramm hinaus, Heilpraktiker und Naturheilverfahren zahlt die Kasse meist nicht.']
];
var ZUS_IST=['','vorhanden','nicht vorhanden','unklar'],ZUS_PRI=['','wichtig','weniger wichtig','kein Thema'];
function zusForm(){
  var h='<div class="sh2">Was ist dem Kunden wichtig, und was besteht schon?</div>';
  ZUS.forEach(function(z){h+='<div class="zrow"><b>'+z[1]+'</b><div class="grid2">'+selHtml('zus.pri.'+z[0],'Wichtigkeit',ZUS_PRI)+selHtml('zus.ist.'+z[0],'Stand heute',ZUS_IST)+'</div></div>'});
  h+='<div class="grid2">'+fld('zus.beitrag','Beitrag für bestehenden Zusatz',{unit:'€ / Monat',hint:'Optional. Leer lassen, wenn keiner besteht.'})+fld('zus.kosten','Selbst getragene Kosten, letzte 2 Jahre',{unit:'€',hint:'Optional. Zahn, Brille, Krankenhaus.'})+'</div>';
  return h;
}
function zusState(){
  var z=adv.zus||{pri:{},ist:{}};
  return ZUS.map(function(x){return {k:x[0],n:x[1],ic:x[2],kasse:x[3],pri:(z.pri||{})[x[0]]||'',ist:(z.ist||{})[x[0]]||''}});
}
function zusOffen(){return zusState().filter(function(r){return r.pri==='wichtig'&&r.ist!=='vorhanden'})}
function zusLive(){
  var R=zusState(),h='<div class="zgrid">';
  R.forEach(function(r){
    var cls=r.ist==='vorhanden'?'ok':(r.pri==='wichtig'?'warn':'');
    h+='<div class="zc '+cls+'"><div class="zh"><span class="zi">'+ico(r.ic,22)+'</span><strong>'+r.n+'</strong></div><p>'+r.kasse+'</p><div class="zt">'+(r.pri?'<span class="zp">'+r.pri+'</span>':'')+(r.ist?'<span class="zs '+(r.ist==='vorhanden'?'ok':'')+'">'+r.ist+'</span>':'')+'</div></div>';
  });
  h+='</div>';
  var o=zusOffen(),bt=nv(adv.zus.beitrag),ko=nv(adv.zus.kosten);
  if(isFinite(bt)||isFinite(ko)){h+='<div class="stats">'+(isFinite(bt)?stat('Beitrag heute',eur(bt),'pro Monat'):'')+(isFinite(ko)?stat('Selbst getragen',eur(ko),'in den letzten 2 Jahren'):'')+'</div>'}
  if(o.length)h+='<div class="note"><b>Wichtig und noch nicht abgedeckt:</b> '+o.map(function(r){return r.n}).join(', ')+'. Hier lohnt ein Blick auf den Mitgliedertarif.</div>';
  else if(R.some(function(r){return r.pri||r.ist}))h+='<div class="note">Alles, was dem Kunden wichtig ist, ist abgedeckt oder noch nicht benannt. Wunsch und Stand im Gespräch klären.</div>';
  return h+'<p class="hint-t">Angaben zur gesetzlichen Kasse sind allgemein. Leistungen, Beiträge und Wartezeiten des Tarifs stehen in den Tarifunterlagen.</p>';
}
function zusSlides(){
  var S=[];
  S.push({title:'Was zahlt die Kasse, was nicht?',text:Q('Wenn Sie an Zahnarzt, Brille und Krankenhaus denken: Was möchten Sie auf keinen Fall allein bezahlen müssen?')+TP('Die gesetzliche Kasse sichert die Grundversorgung. Hier steht, wo sie aufhört.'),form:zusForm,live:zusLive,
   tip:'Zuerst zuhören, was dem Kunden wichtig ist, nicht gleich den Tarif erklären. Die Wichtigkeit und den heutigen Stand je Bereich eintragen. Keine Tarifleistungen nennen, die nicht in den aktuellen Tarifunterlagen stehen.',area:'gesund'});
  S.push({title:'Ihr Ergebnis: Krankenzusatz',text:Q('Wo möchten Sie sich absichern, und wo reicht Ihnen die gesetzliche Leistung?')+TP('Wenn etwas offen ist, schauen wir uns gern gemeinsam den Mitgliedertarif an. Sie entscheiden.'),live:zusLive,
   tip:'Ohne Druck. Ein „Nein“ ist in Ordnung. Bei Interesse einen Folgetermin vereinbaren und Tarifunterlagen mitbringen. Den Mitgliedertarif nicht als besten oder günstigsten darstellen.',area:'gesund'});
  S.forEach(function(x){x.ill='zus'});
  return S;
}
function zusReport(b){
  var R=zusState();
  b.push({t:'h',text:'Krankenzusatz: Was die Kasse zahlt und was Ihnen wichtig ist'});
  b.push({t:'p',text:'Die gesetzliche Krankenkasse sichert die Grundversorgung. Diese Übersicht zeigt, wo sie aufhört und was Ihnen persönlich wichtig ist.'});
  b.push({t:'table',head:['Bereich','Gesetzliche Kasse','Wichtig?','Stand'],w:[0.19,0.5,0.15,0.16],rows:R.map(function(r){return [r.n,r.kasse,r.pri||'-',r.ist||'-']})});
  var o=zusOffen();
  if(o.length)b.push({t:'p',text:'Wichtig und noch nicht abgedeckt: '+o.map(function(r){return r.n}).join(', ')+'. Dazu schauen wir uns gern gemeinsam den Mitgliedertarif an. Ob das für Sie passt, entscheiden Sie.'});
  var bt=nv(adv.zus.beitrag),ko=nv(adv.zus.kosten),kr=[];if(isFinite(bt))kr.push(['Beitrag für bestehenden Zusatz',eur(bt)+' pro Monat']);if(isFinite(ko))kr.push(['Selbst getragene Kosten, letzte 2 Jahre',eur(ko)]);
  if(kr.length)b.push({t:'kv',rows:kr,strong:-1});
  b.push({t:'small',text:'Angaben zur gesetzlichen Kasse sind allgemein. Leistungen, Beiträge, Wartezeiten und Aufnahmebedingungen eines Zusatztarifs stehen in den Tarifunterlagen und sind erst mit einem Angebot verbindlich.'});
}
