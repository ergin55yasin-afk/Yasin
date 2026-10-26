/* ================= Navigation und Seitenrahmen ================= */
var TITEL={
  start:['Start',''],kunden:['Kunden','Alle Kundennummern mit Terminen, Aufgaben und Beratungen'],kunde:['Kunde','Kundenprofil'],
  beratung:['Beratung','Ganzheitlich beraten, vom Anliegen zur Vereinbarung'],wissen:['Beraterwissen','Lexikon, Kernaussagen und Beratungsfragen'],
  aufgaben:['Aufgaben','Fällig, wartend und später'],pipeline:['Pipeline','Gespräche nach Ergebnis'],revier:['Revier','Filialen und Bankberater'],
  copilot:['Copilot','Einträge per Text oder Sprache anlegen'],training:['Training','Einwände und Gespräche üben'],wissenki:['Wissens-Chat','Fragen an dein Beraterwissen']
};
var NAV_GRUPPE={kunde:'kunden',revier:'pipeline',wissenki:'wissen'};
var NAV_HAUPT=[['start','Start','compass'],['kunden','Kunden','users'],['beratung','Beratung','play'],['wissen','Wissen','book']];
var NAV_ARBEIT=[['aufgaben','Aufgaben','task'],['pipeline','Pipeline','chart'],['copilot','Copilot','bubble'],['training','Training','mic']];
function navBuild(){
  function a(t){return '<button class="nav-i" data-nav data-act="tab" data-tab="'+t[0]+'">'+ico(t[2],20)+'<span>'+t[1]+'</span></button>'}
  $('nav').innerHTML='<div class="nav-brand"><span class="nav-logo" aria-hidden="true">'+ico('compass',20)+'</span><span><b>Beratungsplattform</b><small>Vorsorge und Finanzen</small></span></div>'+
    '<div class="nav-g">'+NAV_HAUPT.map(a).join('')+'</div><div class="nav-h">Arbeit</div><div class="nav-g">'+NAV_ARBEIT.map(a).join('')+'</div>'+
    '<div class="nav-foot"><button class="nav-i" data-act="more">'+ico('settings',20)+'<span>Mehr und Einstellungen</span></button></div>';
  $('bnav').innerHTML=NAV_HAUPT.map(function(t){return '<button data-nav data-act="tab" data-tab="'+t[0]+'">'+ico(t[2],22)+'<span>'+t[1]+'</span></button>'}).join('')+'<button data-act="more">'+ico('more',22)+'<span>Mehr</span></button>';
  document.querySelectorAll('.top [data-act="search"].icon').forEach(function(b){b.innerHTML=ico('search',20)});
  document.querySelectorAll('.top [data-act="more"]').forEach(function(b){b.innerHTML=ico('more',20)});
  var s=document.querySelector('.top-search .ic-s');if(s)s.innerHTML=ico('search',18);
  var f=document.querySelector('.fab');if(f)f.innerHTML=ico('plus',26);
}
function openMore(){
  function it(to,tab,ic,t,sub){return '<button class="tl2" data-act="more-go" data-to="'+to+'"'+(tab?' data-tab="'+tab+'"':'')+'><span class="tli">'+ico(ic,20)+'</span><span><strong>'+t+'</strong><small>'+sub+'</small></span></button>'}
  var h='<h3>Mehr und Einstellungen</h3>'+
    '<div class="dsec"><h3>Arbeit</h3></div><div class="tools">'+it('tab','aufgaben','task','Aufgaben','Fällig, wartend, später')+it('tab','pipeline','chart','Pipeline','Gespräche nach Ergebnis')+it('rv-open','','bank','Revier','Filialen und Bankberater')+it('open-auswertung','','report','Trichter','Verlustgründe und Quote')+it('open-woche','','report','Wochenabschluss','Bericht der Woche')+'</div>'+
    '<div class="dsec"><h3>Assistent</h3></div><div class="tools">'+it('tab','copilot','bubble','Copilot','Einträge per Text oder Sprache')+it('nb-open','','mic','Nachbereitung','Sprachnotiz zum Termin auswerten')+it('tab','wissenki','book','Wissens-Chat','Fragen an dein Beraterwissen')+it('tab','training','mic','Training','Einwände und Gespräche üben')+'</div>'+
    '<div class="dsec"><h3>Beratung</h3></div><div class="tools">'+it('open-ganz','','layers','Mehr als Versicherung','Themenrad und Lebensweg')+it('home-mail','','mail','Mail vorbereiten','Nachfass- und Terminmails')+it('adv-kat','','sliders','Leistungsmerkmale','Vorlagen für Vergleiche')+it('adv-disc','','doc','Hinweistext im PDF','Text am Ende der Unterlage')+'</div>'+
    '<div class="dsec"><h3>Einstellungen</h3></div><div class="tools">'+it('profil','','user','Mein Profil','Name für die Begrüßung')+it('recht-open','','tax','Rechtsstand','Werte der Rechner prüfen')+it('pl-set','','layers','Berater und Filialen','Listen und Zuordnung')+it('menu','','shieldok','Sichern und Datenschutz','Sicherung, Wiederherstellen')+it('fb-toggle','','pencil','Korrektur markieren','Stellen für Änderungen anstreichen')+it('theme','','sun','Hell oder dunkel','Darstellung wechseln')+'</div>'+
    '<div class="btnrow"><button class="btn" data-act="close">Schließen</button></div>';
  openSheet(h);
}
function openProfil(){
  openSheet('<h3>Mein Profil</h3><p class="hint-t">Dein Vorname erscheint in der Begrüßung auf der Startseite. Er bleibt nur auf diesem Gerät.</p><label for="pr-n">Vorname</label><input type="text" id="pr-n" maxlength="40" value="'+esc((db.settings&&db.settings.beraterName)||'')+'" autocomplete="off"><div class="btnrow"><button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="profil-save">Speichern</button></div>');
}
