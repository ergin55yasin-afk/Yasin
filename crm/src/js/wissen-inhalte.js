/* ================= Beraterwissen: Startinhalte ================= */
/* Alle Startinhalte sind KI-Entwürfe (Status „Entwurf“) und müssen fachlich geprüft werden.
   Beträge kommen aus REGEL, damit Rechner und Lexikon denselben Stand zeigen. */
var LEXSPARTEN=[['pflege','Pflegeversicherung','pflege'],['altersvorsorge','Altersvorsorge','alter'],['bu','Berufsunfähigkeit','arbeit'],['unfall','Unfallversicherung','unfall'],['kranken','Kranken und Krankenzusatz','kranken'],['sach','Sachversicherungen','sach'],['nachlass','Vollmachten und Nachlass','vorsorge'],['anlage','Geldanlage','anlage'],['allgemein','Allgemein','check']];
var LEXTYPEN=[['grund','Grundwissen'],['vertieft','Vertieftes Fachwissen'],['fragen','Beratungsfragen'],['indikatoren','Bedarfsindikatoren'],['kern','Kernaussagen und Merksätze'],['einwaende','Einwände und Kundenfragen'],['praxis','Praxisfälle und Beispielrechnungen'],['produkt','Produkt- und Tarifwissen'],['recht','Gesetzliche Grundlagen und Quellen'],['doku','Beratungs- und Dokumentationsbausteine']];
var LEXTYP={};LEXTYPEN.forEach(function(t){LEXTYP[t[0]]=t[1]});
var LEXSTATUS=[['entwurf','Entwurf'],['geprueft','Fachlich geprüft'],['aktualisieren','Aktualisierung erforderlich']];
var THEMA_SPARTE={alter:'altersvorsorge',arbeit:'bu',pflege:'pflege',familie:'nachlass',kranken:'kranken',zusatz:'kranken',unfall:'unfall',sach:'sach',anlage:'anlage',vorsorge:'nachlass'};
var LEX_VERSION=1;
function lexSeed(){
  var P=REGEL.pflege,n=function(x){return nf.format(x)+' €'},L=[];
  function e(id,sp,typ,titel,text,quelle,o){o=o||{};L.push({id:id,sparte:sp,typ:typ,titel:titel,text:text,quelle:quelle||'',kunde:!!o.kunde,tags:o.tags||[]})}
  var GI='https://www.gesetze-im-internet.de/sgb_11/';
  /* --- Muster-Sparte Pflegeversicherung --- */
  e('pf-g1','pflege','grund','Die Pflegeversicherung ist eine Teilabsicherung',
    'Die gesetzliche Pflegeversicherung zahlt je nach Pflegegrad feste Beträge. Sie deckt die Kosten der Pflege nicht vollständig ab. Was darüber hinaus anfällt, tragen die Pflegebedürftigen selbst, aus Rente, Vermögen oder mit Hilfe der Familie.\n\nWer gesetzlich krankenversichert ist, ist in der sozialen Pflegeversicherung. Wer privat krankenversichert ist, hat eine private Pflegepflichtversicherung. Die Leistungen sind gleichwertig.',
    'SGB XI §§ 1, 4 und 23; '+GI,{kunde:true,tags:['Teilkasko','Pflegekasse']});
  e('pf-g2','pflege','grund','Wann gilt jemand als pflegebedürftig?',
    'Pflegebedürftig ist, wer wegen gesundheitlicher Einschränkungen in seiner Selbstständigkeit beeinträchtigt ist und deshalb Hilfe braucht, voraussichtlich für mindestens sechs Monate.\n\nDen Pflegegrad stellt die Pflegekasse fest, nach einer Begutachtung durch den Medizinischen Dienst. Bewertet werden sechs Lebensbereiche, zum Beispiel Mobilität, Selbstversorgung und der Umgang mit Krankheit.',
    'SGB XI §§ 14, 15 und 18',{kunde:true,tags:['Begutachtung','Medizinischer Dienst']});
  e('pf-g3','pflege','grund','Die fünf Pflegegrade',
    'Aus der Begutachtung ergibt sich eine Punktzahl von 0 bis 100:\n- Pflegegrad 1: 12,5 bis unter 27 Punkte, geringe Beeinträchtigung\n- Pflegegrad 2: 27 bis unter 47,5 Punkte, erhebliche Beeinträchtigung\n- Pflegegrad 3: 47,5 bis unter 70 Punkte, schwere Beeinträchtigung\n- Pflegegrad 4: 70 bis unter 90 Punkte, schwerste Beeinträchtigung\n- Pflegegrad 5: 90 bis 100 Punkte, schwerste Beeinträchtigung mit besonderen Anforderungen an die pflegerische Versorgung',
    'SGB XI § 15 Absatz 3',{kunde:true,tags:['Pflegegrad','Punkte']});
  e('pf-g4','pflege','grund','Leistungen der Pflegekasse im Überblick',
    'Monatliche Beträge nach Pflegegrad 2 / 3 / 4 / 5:\n- Pflegegeld, wenn Angehörige pflegen: '+P.geld.slice(2).map(n).join(' / ')+'\n- Pflegesachleistung für einen Pflegedienst: '+P.sach.slice(2).map(n).join(' / ')+'\n- Zuschuss im Pflegeheim: '+P.heim.slice(2).map(n).join(' / ')+'\n\nAb Pflegegrad 1 gibt es den Entlastungsbetrag von '+n(P.entlast)+' im Monat. Pflegegeld und Sachleistung lassen sich kombinieren.',
    'SGB XI §§ 36, 37, 38, 43 und 45b; Beträge Stand 2026, in der App unter „Rechtsstand“ geprüft',{kunde:true,tags:['Pflegegeld','Sachleistung','Kombinationsleistung','Entlastungsbetrag']});
  e('pf-v1','pflege','vertieft','Woraus sich der Eigenanteil im Heim zusammensetzt',
    'Im Pflegeheim zahlen Bewohner einen Eigenanteil. Er besteht aus drei Teilen:\n- dem pflegebedingten Eigenanteil (in einem Heim für Pflegegrad 2 bis 5 gleich hoch),\n- den Kosten für Unterkunft und Verpflegung,\n- den Investitionskosten des Heims.\n\nIm Bundesdurchschnitt lag die Belastung im ersten Jahr am 1. Januar 2026 bei '+n(P.heimEigen)+' im Monat: pflegebedingt '+n(P.eee)+', Unterkunft und Verpflegung '+n(P.uv)+', Investitionskosten '+n(P.invest)+'. Die Werte schwanken je nach Bundesland und Heim deutlich.',
    'vdek, Auswertung Eigenanteile vom 1. Januar 2026; SGB XI §§ 43, 84',{tags:['Eigenanteil','EEE','Heimkosten']});
  e('pf-v2','pflege','vertieft','Der Leistungszuschlag im Heim',
    'Zum pflegebedingten Eigenanteil zahlt die Pflegekasse einen Zuschlag, der mit der Aufenthaltsdauer steigt: '+P.zuschlag.join(' / ')+' % im ersten, zweiten, dritten und ab dem vierten Jahr. Unterkunft, Verpflegung und Investitionskosten sind davon nicht erfasst. Deshalb sinkt die Gesamtbelastung mit den Jahren, bleibt aber hoch.\n\nDer Rechner der Beratung leitet die Belastung je Jahr daraus ab. Sie weicht höchstens um 1 € von den veröffentlichten vdek-Werten ab, weil vdek mit gerundeten Ausgangswerten arbeitet.',
    'SGB XI § 43c; vdek, Auswertung vom 1. Januar 2026',{tags:['Zuschlag','§ 43c']});
  e('pf-v3','pflege','vertieft','Wann Kinder für die Pflege der Eltern zahlen',
    'Kinder werden für Pflegekosten ihrer Eltern nur herangezogen, wenn ihr Jahresbruttoeinkommen mehr als 100.000 € beträgt. Bis zu dieser Grenze springt bei Bedarf das Sozialamt ein (Hilfe zur Pflege), nachdem Einkommen und Vermögen der Pflegebedürftigen bis auf einen Schonbetrag eingesetzt wurden.',
    'SGB XII § 94 Absatz 1a (Angehörigen-Entlastungsgesetz, seit 2020); SGB XII §§ 61 ff.',{kunde:true,tags:['Elternunterhalt','Sozialamt','Hilfe zur Pflege']});
  e('pf-v4','pflege','vertieft','Entlastung für pflegende Angehörige',
    'Wer zu Hause pflegt, kann Entlastungsleistungen nutzen, zum Beispiel Tages- und Nachtpflege, Verhinderungspflege und Kurzzeitpflege. Seit Juli 2025 gibt es für Verhinderungs- und Kurzzeitpflege einen gemeinsamen Jahresbetrag (Entlastungsbudget) von '+n(P.vhaus)+'.\n\nDie genauen Voraussetzungen erklärt die Pflegekasse oder ein Pflegestützpunkt.',
    'SGB XI §§ 39, 41, 42 und 42a',{tags:['Verhinderungspflege','Kurzzeitpflege','Entlastungsbudget']});
  e('pf-f1','pflege','fragen','Was ist Ihnen im Pflegefall besonders wichtig?',
    'Was ist dir im Pflegefall besonders wichtig: die finanzielle Belastung abzufedern, möglichst lange zu Hause leben zu können oder selbstbestimmt über die Art deiner Pflege zu entscheiden?\n\nZiel: Prioritäten sichtbar machen, ohne eine Antwort vorzugeben. Die Reihenfolge legt der Kunde fest.','',{tags:['Prioritäten','Selbstbestimmung']});
  e('pf-f2','pflege','fragen','Wer würde sich kümmern?',LEIT.pflege.v+'\n\nZiel: verstehen, ob Pflege durch Angehörige realistisch ist, und wie belastbar diese Möglichkeit wäre.','',{tags:['Angehörige']});
  e('pf-f3','pflege','fragen','Zuhause oder Heim?',LEIT.pflege.b,'',{tags:['Pflegeform']});
  e('pf-f4','pflege','fragen','Einstieg ohne Zahlen',LEIT.pflege.e,'',{tags:['Einstieg']});
  e('pf-i1','pflege','indikatoren','Gesprächsanlässe für die Pflegevorsorge',
    'Diese Punkte sind Anlässe, das Thema anzusprechen. Sie sind kein festgestellter Bedarf:\n- Die Rente liegt deutlich unter dem durchschnittlichen Eigenanteil im Heim.\n- Es gibt keine Angehörigen in der Nähe, die Pflege übernehmen könnten.\n- Der Kunde möchte möglichst lange zu Hause bleiben.\n- Vermögen soll für den Partner oder die Erben erhalten bleiben.\n- In der Familie gibt es bereits einen Pflegefall.\n- Es gibt keine Vorsorgevollmacht.','',{tags:['Anlass']});
  e('pf-k1','pflege','kern','Pflegevorsorge ist mehr als Kosten',
    'Pflegevorsorge betrifft nicht nur mögliche Kosten, sondern auch die finanziellen Spielräume und Wahlmöglichkeiten im Pflegefall.','',{kunde:true,tags:['Merksatz']});
  e('pf-k2','pflege','kern','Selbst entscheiden können',LEIT.pflege.m,'',{kunde:true,tags:['Merksatz']});
  e('pf-k3','pflege','kern','Die Pflegekasse zahlt feste Beträge',
    'Die Pflegeversicherung zahlt feste Beträge, keine vollen Kosten. Was darüber hinausgeht, bleibt bei Ihnen.','SGB XI § 4',{kunde:true,tags:['Teilabsicherung']});
  e('pf-e1','pflege','einwaende','„Das zahlt doch die Pflegekasse.“',
    'Antwort in der Sache: Die Pflegekasse zahlt feste Beträge je Pflegegrad. Im Heim blieben im Bundesdurchschnitt im ersten Jahr '+n(P.heimEigen)+' im Monat beim Bewohner (vdek, 1. Januar 2026).\n\nRückfrage: „Wie würden Sie diesen Betrag heute aus Rente und Ersparnissen tragen?“','vdek, 1. Januar 2026; SGB XI § 43',{tags:['Einwand']});
  e('pf-e2','pflege','einwaende','„Meine Kinder kümmern sich.“',
    'Antwort in der Sache: Viele Pflegebedürftige werden zu Hause von Angehörigen versorgt. Für die Pflegenden bedeutet das oft über Jahre viel Zeit und Kraft. Finanziell müssen Kinder erst ab einem Jahresbruttoeinkommen von mehr als 100.000 € einspringen.\n\nRückfrage: „Haben Sie mit Ihren Kindern schon darüber gesprochen, was sie leisten könnten und wollen?“','Statistisches Bundesamt, Pflegestatistik 2023; SGB XII § 94 Absatz 1a',{tags:['Einwand','Angehörige']});
  e('pf-e3','pflege','einwaende','„Dafür bin ich noch zu jung.“',
    'Antwort in der Sache: Bei privaten Pflegezusatzversicherungen hängt der Beitrag in der Regel vom Eintrittsalter ab, und beim Abschluss wird meist nach der Gesundheit gefragt. Wer später abschließt, zahlt deshalb oft mehr oder wird nicht mehr angenommen.\n\nRückfrage: „Was wäre Ihnen lieber: heute in Ruhe entscheiden oder später unter Zeitdruck?“','',{tags:['Einwand','Eintrittsalter']});
  e('pf-e4','pflege','einwaende','„Im Notfall zahlt das Sozialamt.“',
    'Antwort in der Sache: Das stimmt, aber erst, wenn eigenes Einkommen und Vermögen bis auf einen Schonbetrag eingesetzt sind. Dazu gehört auch gemeinsames Vermögen mit dem Partner.\n\nRückfrage: „Was soll im Pflegefall mit Ihrem Ersparten und Ihrem Zuhause geschehen?“','SGB XII §§ 61 ff. und 90',{tags:['Einwand','Sozialhilfe']});
  e('pf-p1','pflege','praxis','Beispiel: Pflegeheim bei Pflegegrad 3',
    'Annahmen: Pflegegrad 3, Bundesdurchschnitt am 1. Januar 2026, Rente 1.800 € netto, Vermögen 60.000 €, keine private Pflegeleistung.\n- Kosten im Heim: '+n(P.heim[3]+P.heimEigen+Math.round(P.eee/(1-P.zuschlag[0]/100)*P.zuschlag[0]/100))+' (Zuschuss der Kasse plus Eigenanteil plus Leistungszuschlag)\n- Eigenanteil im ersten Jahr: '+n(P.heimEigen)+'\n- Es fehlen nach der Rente: '+n(P.heimEigen-1800)+' im Monat\n- Das Vermögen reicht etwa 9 Jahre und 5 Monate, weil der Eigenanteil mit dem Zuschlag jedes Jahr sinkt.\n\nBeispielrechnung, keine Prognose. Regionale Kosten können stark abweichen.','Berechnung mit dem Pflege-Rechner der Beratung (Schritt 4)',{tags:['Beispiel','Heim']});
  e('pf-pr1','pflege','produkt','Arten privater Pflegezusatzversicherung',
    'Es gibt drei Grundformen:\n- Pflegetagegeld oder Pflegemonatsgeld: ein vereinbarter Betrag je Pflegegrad, frei verwendbar.\n- Pflegekostenversicherung: erstattet nachgewiesene Kosten, die nach der Leistung der Pflegekasse übrig bleiben, bis zu einer Grenze.\n- Pflegerentenversicherung: eine Rente im Pflegefall, als Lebensversicherung gestaltet.\n\nLeistungen, Wartezeiten, Beitragsentwicklung und Voraussetzungen unterscheiden sich je Tarif. Maßgeblich sind die Versicherungsbedingungen.','',{tags:['Pflegetagegeld','Pflegekosten','Pflegerente']});
  e('pf-pr2','pflege','produkt','Staatlich geförderte Pflegezusatzversicherung (Pflege-Bahr)',
    'Für geförderte Pflegetagegeld-Tarife gibt es eine staatliche Zulage von 5 € im Monat, wenn der Versicherte mindestens 10 € im Monat selbst zahlt. Die Versicherer dürfen niemanden wegen Vorerkrankungen ablehnen und keine Risikozuschläge verlangen. Dafür gilt eine Wartezeit von bis zu fünf Jahren.','SGB XI §§ 126 bis 130',{tags:['Förderung','Zulage','Wartezeit']});
  e('pf-r1','pflege','recht','Wichtige Vorschriften zur Pflege',
    '- SGB XI § 14, § 15: Begriff der Pflegebedürftigkeit, Pflegegrade\n- SGB XI § 36: Pflegesachleistung\n- SGB XI § 37: Pflegegeld\n- SGB XI § 38: Kombinationsleistung\n- SGB XI § 43, § 43c: vollstationäre Pflege und Leistungszuschlag\n- SGB XI § 45b: Entlastungsbetrag\n- SGB XI §§ 126 bis 130: geförderte Pflegevorsorge\n- SGB XII § 94 Absatz 1a: Unterhaltsrückgriff erst ab 100.000 € Jahreseinkommen\n\nQuellen: Gesetzestexte unter gesetze-im-internet.de; Eigenanteile: vdek-Auswertung vom 1. Januar 2026; Statistik: Statistisches Bundesamt, Pflegestatistik 2023.',GI,{tags:['Gesetz','Quelle']});
  e('pf-d1','pflege','doku','Baustein: Information zur Teilabsicherung',
    'Der Kunde wurde darüber informiert, dass die gesetzliche Pflegeversicherung feste Leistungsbeträge zahlt und die tatsächlichen Pflegekosten nicht vollständig abdeckt. Die Beispielrechnung beruht auf Durchschnittswerten und den Angaben des Kunden.','',{tags:['Dokumentation']});
  e('pf-d2','pflege','doku','Baustein: Kunde entscheidet später',
    'Der Kunde möchte zum jetzigen Zeitpunkt keine Entscheidung zur privaten Pflegevorsorge treffen. Er wurde auf die Bedeutung von Eintrittsalter und Gesundheitsfragen hingewiesen. Ein Folgegespräch wurde angeboten.','',{tags:['Dokumentation']});
  /* --- weitere Sparten: Fragen und Merksätze aus den Gesprächsleitfäden --- */
  var M={rente:'altersvorsorge',arbeit:'bu',unfall:'unfall',kranken:'kranken',anlage:'anlage',haftpflicht:'sach',hausrat:'sach',gebaeude:'sach',kfz:'sach',rechtsschutz:'sach',vollmacht:'nachlass',testament:'nachlass',tod:'nachlass'};
  Object.keys(M).forEach(function(k){
    var G=LEIT[k];if(!G)return;
    L.push({id:'lt-'+k+'-f',sparte:M[k],typ:'fragen',titel:G.t+': Gesprächsfragen',text:'Einstieg: '+G.e+'\n\nSituation verstehen: '+G.v+'\n\nBedeutung: '+G.b+'\n\nEigene Prioritäten: '+G.p,quelle:'',kunde:false,tags:['Leitfaden']});
    L.push({id:'lt-'+k+'-k',sparte:M[k],typ:'kern',titel:G.t+': Merksatz',text:G.m,quelle:'',kunde:true,tags:['Merksatz']});
  });
  e('av-k1','altersvorsorge','kern','Früh anfangen',
    'Je früher du mit dem Aufbau deiner Altersvorsorge beginnst, desto länger können deine Beiträge und mögliche Erträge für dich arbeiten.','',{kunde:true,tags:['Startzeitpunkt','Zinseszins']});
  e('av-f1','altersvorsorge','fragen','Was bedeutet ein späterer Start?',
    'Was würde es für deine Planung bedeuten, wenn du erst in fünf Jahren mit dem Sparen beginnst?\n\nIn der Beratung zeigt der Schritt „Zeit ist Ihr größter Hebel“ die nötige Sparrate für verschiedene Startzeitpunkte, mit den eingetragenen Annahmen zu Rendite und Laufzeit.','',{tags:['Startzeitpunkt']});
  return L;
}
