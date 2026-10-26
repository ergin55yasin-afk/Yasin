# CRM-Beratungsplattform: Bestandsanalyse, Designkonzept und erste Verbesserung

Stand: 26.10.2026 · Grundlage: die veröffentlichte Version des Artifacts „Mein CRM“ (4.285 Zeilen, eine HTML-Datei)

---

## 1. Bestandsanalyse

### 1.1 Technische Architektur

| Aspekt | Befund |
|---|---|
| Aufbau | Eine einzige HTML-Datei, rund 4.300 Zeilen. CSS (≈ 650 Zeilen) und JavaScript (≈ 3.600 Zeilen) liegen in einem Block, ohne Module, ohne Build. |
| Darstellung | Jede Ansicht wird als HTML-Text zusammengesetzt und per `innerHTML` neu geschrieben. Klicks laufen über einen zentralen Verteiler (`data-act`) mit über 100 Fällen. |
| Daten | Alles liegt in `localStorage` (Schlüssel `nachbereitung.v1`), nur im jeweiligen Browser. Es gibt keinen Server und keine Synchronisation. Das Sicherungs- und Wiederherstellen-Menü ist vorhanden. |
| Laufende Beratung | Das Beratungsobjekt (`adv`) liegt **nur im Arbeitsspeicher**. Ein Neuladen der Seite während des Gesprächs löscht alle Eingaben (außer nach „Beratungsdatei sichern“). |
| PDF | Eigene PDF-Ausgabe mit jsPDF 2.5.1 (wird bei Bedarf von cdnjs nachgeladen), mit Ersatzweg über einen HTML-Bericht. **Tatsächlich implementiert.** |
| KI | Copilot, Wissen, Training, Einwandtrainer, Nachbereitung und Mail-Umformulierung nutzen `window.claude.use('sample')`. Das funktioniert nur innerhalb von claude.ai mit Freigabe. |
| Tests | Keine. Es gab nur eine Testschnittstelle `window.__crm`. |

### 1.2 Implementiert oder nur Oberfläche?

| Funktion | Stand |
|---|---|
| Aufgaben, Angebote, Termine, Verträge, Beratungen (anlegen, ändern, löschen) | implementiert |
| Fristen-Radar, Kündigungsschreiben, Wochenbericht, Suche, Hinweise | implementiert |
| Pipeline und Revier | implementiert. Es sind aber nur Zählungen nach Ergebnis; Beträge oder Volumen fehlen. |
| „Kundenverwaltung“ | **nur eingeschränkt**. Es gibt keine Kundendaten, nur Kundennummern, die aus Einträgen gesammelt werden. Haushalt, Verträge mit Beitrag und Stammdaten fehlen. |
| Rechner Altersvorsorge, Geldanlage, Krankenversicherung, BU, Pflege, Vorsorge-Check | implementiert. BU, Pflege und Vorsorge-Check zeigten ihre Ergebnisse aber nur im Gesprächsmodus, **im Formularmodus nicht** (Pflege ist jetzt behoben). |
| BU, Pflege, Vorsorge-Check im CRM speichern | **fehlte**. „Im CRM speichern“ legte für diese Themen nichts an (Pflege ist jetzt behoben). |
| KI-Funktionen | implementiert, laufen aber nur in claude.ai. |

### 1.3 Gefundene Fehler

| # | Fehler | Status |
|---|---|---|
| F1 | **„Sicherung als Text kopieren“ kopierte die Korrekturliste statt der Sicherung.** Ursache: Die Aktion `fb-copy` war doppelt vergeben, der zweite Fall wurde nie erreicht. Das betraf auch jeden Ersatzweg „Kopieren“ (Akte, PDF-Ersatz, Anschreiben), wenn direktes Speichern nicht verfügbar war. Außerdem wurde das Sicherungsdatum nie vermerkt. | behoben, Test `tests/bug-fbcopy.js` |
| F2 | **Die CSS-Klasse `.ck` war doppelt belegt:** einmal für alle Checkboxen, einmal für ein nicht mehr genutztes „Cockpit“-Raster. Dadurch war jede Checkbox in der App verschoben (Kästchen und Text in einem Grid). | behoben (tote Regeln entfernt) |
| F3 | Pflege bei Pflegegrad 1: Die Heimrechnung nutzte den Durchschnitts-Eigenanteil von 3.245 €. Bei Pflegegrad 1 zahlt die Kasse im Heim aber nur 131 €, die Rechnung war also falsch. | behoben (wird nicht mehr gerechnet, sondern erklärt) |
| F4 | Die Reichweite des Vermögens im Heim rechnete mit einem festen Eigenanteil, obwohl der Leistungszuschlag nach §43c jedes Jahr steigt. | behoben (rechnet Jahr für Jahr) |
| F5 | Doppelter, unerreichbarer `case 'goto-waits'` | entfernt |
| F6 | **Pflegeversicherung in der GKV-Schätzung:** Für 0 Kinder wird 1,8 % angesetzt. Kinderlose ab 23 zahlen aber 2,4 %. Das Feld fragt „Kinder unter 25“ ab, daraus lässt sich Kinderlosigkeit nicht sicher ableiten. | **offen, fachliche Frage (siehe 5.3)** |
| F7 | Laufende Beratung geht beim Neuladen verloren (siehe 1.1). | **offen, Datenschutzentscheidung (siehe 5.3)** |
| F8 | PDF-Dateien waren sehr groß (Pflege-Beispiel: 6 MB), weil Diagramme unkomprimiert eingebettet wurden. | behoben (196 KB) |

### 1.4 Priorisierte Schwachstellen

1. **Datenhaltung und Datenschutz (hoch).** Daten liegen nur in einem Browser, und laufende Beratungen sind flüchtig. Für ein Team und für echte Kundendaten fehlen Server, Rechte, Löschkonzept und Protokoll. Das ist die größte Grenze und lässt sich nur mit einer Architekturentscheidung lösen.
2. **Zwei parallele Beratungsoberflächen (hoch).** Formularmodus und Gesprächsmodus bilden dieselben Inhalte doppelt ab (`stepForm` und `talkSlides`). Ergebnisse fehlten deshalb in einem der beiden Modi, und jede Änderung muss zweimal gemacht werden.
3. **Gewachsene Gestaltung (mittel).** Mehrere übereinander gelegte Designschichten („Design 4“, „patch34“, „Neue Designsprache“) mit `!important`, drei Schriftfamilien plus Serifenschrift, viele fest eingetragene Farben statt Variablen und toter CSS-Code (siehe F2).
4. **Navigation (mittel).** Fünf Tabs, dazu ein verstecktes „Mehr“-Menü mit sieben weiteren Bereichen, ein schwebender Copilot-Knopf und ein eigener Gesprächsmodus mit eigener Navigation. Im Gesprächsmodus zeigen Stationsleiste, Seitenleiste und Punkte denselben Fortschritt dreifach.
5. **„Kunde“ ist nur eine Nummer (mittel).** Für eine ganzheitliche Plattform fehlt ein Kundenprofil: Haushalt, bestehende Verträge mit Leistung und Beitrag, frühere Beratungen als Grundlage.
6. **Fachwerte im Code (mittel).** Die Werte sind zentral und mit Quelle gepflegt (`REGEL`, `KV`, Rechtsstand-Prüfung). Gut gelöst. Teils stehen sie aber noch als Text in Folien (zum Beispiel BBG, Rentenwert), statt aus `REGEL` zu kommen.
7. **Diagramme (niedrig bis mittel).** Canvas-Grafiken mit festen Farben haben immer einen weißen Hintergrund und passen sich der Breite nicht an. Gut ist, dass sie auch fürs PDF taugen.
8. **Keine automatisierten Tests (mittel).** Behoben durch die neuen Testskripte (siehe 4).

### 1.5 Mobile und Desktop

Desktop (ab 900 px) zeigt eine Seitenleiste, darunter gibt es eine Tab-Leiste. Auf dem Tablet (1024 px) wird der Gesprächsmodus durch die Seitenleiste (270 px) eng. Auf dem Handy waren Eingabepaare zu schmal (behoben im Gesprächsmodus: unter 520 px eine Spalte).

---

## 2. Designkonzept

**Leitbild:** ruhig, sachlich, vertrauenswürdig. Zahlen erklären sich selbst, und jede Zahl nennt ihre Herkunft. Interne Werkzeuge und die Kundenansicht sind klar getrennt.

### 2.1 Zwei Räume

| | Interne Arbeit (Heute, Aufgaben, Kunden, Pipeline) | Kundengespräch (Beratungsmappe) |
|---|---|---|
| Fläche | dunkle Navigation, kompakte Listen | immer hell, große Schrift, eine Frage pro Seite |
| Ziel | schnell finden und abarbeiten | gemeinsam verstehen und entscheiden |
| Inhalte | Fristen, Status, Kennzahlen | Situation, Ziele, Rechenweg, Möglichkeiten, Entscheidung |
| Berater-Hinweise | sichtbar | nur auf Knopfdruck („Berater-Tipps“) |

### 2.2 Grundwerte (Tokens)

- **Abstände:** 4 · 8 · 12 · 16 · 24 · 32 px. **Radius:** 12 px für Elemente, 16 px für Flächen.
- **Bedeutungsfarben (nur mit Bedeutung):** `--ok` entlastet oder gedeckt · `--late` Lücke oder Risiko · `--accent` Auswahl und Fortschritt · `--muted` Herkunft und Hinweise. Dekorative Farben entfallen.
- **Schrift:** eine Grotesk für die Oberfläche, Monospace nur für Schrittnummern, Serifenschrift nur für die Leitfrage im Kundengespräch.
- **Zahlen:** tabellarische Ziffern, rechtsbündig, Euro immer mit Einheit („pro Monat“).

### 2.3 Bausteine (neu, CSS-Präfix `ds-`)

| Baustein | Zweck |
|---|---|
| `ds-path` | Schrittpfad eines Beratungsthemas (z. B. 6 Schritte Pflege) |
| `ds-card` + `ds-cap` | ruhige Fläche mit kleiner Überschrift |
| `ds-facts` | Schlüssel-Wert-Liste („Das wissen wir“) |
| `ds-calc` | Rechenweg: jede Zeile mit Betrag und Quelle, Ergebnis mit Linie |
| `ds-matrix` | neutraler Vergleich von Möglichkeiten mit „Bezug zu Ihrer Situation“ und Entscheidung |
| `ds-callout` (neutral, `bad`, `good`) | eine Kernaussage, farbig nur mit Bedeutung |
| `ds-check` | Checkliste offener Punkte |
| `ds-source` | Quellen- und Annahmezeile |

### 2.4 Diagramm-Regeln

1. Ein Diagramm nur dann, wenn es einen Rechenweg oder Vergleich zeigt, den Text schlechter vermittelt.
2. Grün entlastet, Rot fehlt, Blau-Grau ist neutral. Keine Regenbogenfarben.
3. Jedes Diagramm hat daneben oder darunter dieselben Zahlen als Text oder Tabelle (Barrierefreiheit, PDF).
4. Titel als Frage oder Aussage („Was bleibt pro Monat?“), Untertitel mit Einheit und Annahme.

### 2.5 Beratungsmuster für alle Themen

Jedes Thema folgt denselben sechs Schritten: **Situation → Ziele → Risiken → Leistungen und Lücke → Möglichkeiten → Entscheidung**. Die Pflege ist das erste Thema nach diesem Muster. Altersvorsorge, BU und Krankenversicherung sollen folgen.

---

## 3. Umgesetzt: Pflegeberatung neu

Die Pflegeberatung gab es schon (7 Folien). Sie wurde nach dem Muster aus 2.5 neu aufgebaut:

| Schritt | Vorher | Jetzt |
|---|---|---|
| 1 Situation | fehlte | Alter, Familienstand, Wohnen, Angehörige in der Nähe, Wohnung pflegegeeignet, Pflegeerfahrung. Daraus abgeleitete Gesprächsfragen. Keine Gesundheitsdaten. |
| 2 Ziele | Auswahl ohne Rangfolge | Rangfolge in Klickreihenfolge, gewünschter Pflegeort, Merksatz zur ersten Priorität |
| 3 Risiken | zwei getrennte Folien | Pflegegrade nach § 15 SGB XI, Versorgungsstatistik, Folgen für Finanzen, Familie und Organisation |
| 4 Leistung und Lücke | Kennzahlen und ein Balken | **Kostenbrücke** Heim und Zuhause (Kosten → Pflegekasse → Leistungszuschlag → Eigenanteil → Rente → bestehende Leistung → Lücke), jede Zeile mit Quelle. **Eigenanteil nach Aufenthaltsjahr.** Vermögensreichweite Jahr für Jahr. Bestehende private Leistung. |
| 5 Möglichkeiten | Stichpunktliste | **Neutraler Vergleich** von 4 Wegen nach 4 Kriterien, „Bezug zu Ihrer Situation“ aus Schritt 1 und 4, Einschätzung des Kunden je Weg, optional Angebot mit Prüfvermerk |
| 6 Entscheidung | fehlte | Checkliste offener Punkte, Fragen des Kunden, nächster Schritt, Ergebnisübersicht |
| PDF | Kostenvergleich | alle 6 Schritte mit Rechenweg-Tabellen und Diagrammen |
| CRM | **wurde nicht gespeichert** | Beratung „Pflege“ mit Kurzfassung. Offene Punkte werden als Aufgabe angelegt. |
| Formularmodus | nur Eingaben | Eingaben und Ergebnisse |

### Fachliche Herleitung (nachprüfbar)

- Leistungsbeträge 2026 (unverändert gegenüber 2025): Pflegegeld, Sachleistung und Heim nach §§ 36, 37, 43 SGB XI, Leistungszuschlag 15/30/50/75 % nach § 43c.
- Eigenanteil Heim: vdek-Auswertung vom 1.1.2026, im ersten Jahr 3.245 € (pflegebedingt 1.685 €, Unterkunft und Verpflegung 1.046 €, Investitionskosten 514 €).
- Rechenweg Folgejahre: Der pflegebedingte Anteil vor Zuschlag ist 1.685 € / 0,85 = 1.982 €. Daraus folgen 2.948 / 2.551 / 2.056 €. vdek veröffentlicht 2.947 / 2.551 / 2.056 €. Die Abweichung von 1 € entsteht durch die gerundeten Ausgangswerte. Diese Übereinstimmung ist im Test geprüft.
- Kosten im Heim gesamt = Leistung der Kasse für den Pflegegrad + pflegebedingter Anteil vor Zuschlag + Unterkunft und Verpflegung + Investitionskosten.
- Alle Vergleichsaussagen in Schritt 5 sind allgemeine Merkmale, keine Tarifdaten. Ein konkretes Angebot wird nur mit Betrag aus dem Angebot und Prüfvermerk „laut Bedingungen geprüft“ gerechnet.

---

## 4. Tests

| Test | Inhalt | Ergebnis |
|---|---|---|
| `tests/smoke.js` | alle Tabs, Mehr-Menü, Kundenakte auf Desktop, Tablet und Handy mit Beispieldaten, ohne JS-Fehler | bestanden (alte und neue Version) |
| `tests/pflege.js` | 6 Schritte auf 3 Bildschirmgrößen, je 25 Prüfungen: Rechenwerte gegen vdek und SGB XI, Pflegegrad 1, Reichweite, Angebot, Bericht, PDF, HTML-Bericht, CRM-Speicherung, Formularmodus, Pipeline | bestanden |
| `tests/bug-fbcopy.js` | Sicherung kopieren | alte Version **fehlgeschlagen** (Fehler F1 nachgewiesen), neue Version bestanden |
| `tests/alle-module.js` | Gesprächsmodus mit allen 7 Themen (39 Folien), Bericht, Laden einer älteren Beratungsdatei | bestanden |

Aufruf: `node tests/<datei>.js` (Playwright). Für die PDF-Prüfung muss `JSPDF_PATH` auf eine lokale `jspdf.umd.min.js` zeigen.

---

## 5. Ergebnisprüfung

### 5.1 Veränderte Dateien
- `crm/index.html`: die App (veröffentlicht unter dem bestehenden Artifact-Link)
- `crm/original.html`: unveränderte Sicherung der Ausgangsversion
- `crm/tests/*.js`: neue Tests
- `crm/docs/ANALYSE.md`: dieses Dokument

### 5.2 Für den Benutzer sichtbar
- Die Pflegeberatung ist neu aufgebaut: 6 Schritte mit Schrittpfad, Kostenbrücke, Eigenanteil nach Jahren, Optionsvergleich und Entscheidungsprotokoll.
- Im Formularmodus lassen sich jetzt alle Themen wählen (vorher fehlten BU und Pflege).
- Checkboxen sind in der ganzen App wieder korrekt ausgerichtet.
- „Sicherung kopieren“ kopiert die Sicherung.
- PDFs sind etwa 30-mal kleiner.
- In der Pipeline gibt es den Bereich „Pflege“. Für Bestandskunden entstehen dadurch bewusst **keine** neuen automatischen Hinweise.

### 5.3 Offene Punkte und Entscheidungen
1. **Laufende Beratung zwischenspeichern?** Technisch einfach (im Browser, wie die übrigen CRM-Daten). Da die Beratung Einkommen und Vermögen enthält, ist das eine **Datenschutzentscheidung**, deshalb noch nicht umgesetzt.
2. **Pflegeversicherung für Kinderlose (F6):** Soll der Rechner nach „Kinder überhaupt (auch älter als 25)“ fragen? Erst dann lässt sich der Zuschlag von 0,6 % korrekt anwenden.
3. **Team und Server:** Für mehrere Berater und echte Kundendaten braucht es eine Architekturentscheidung (Server, Anmeldung, Rechte, Löschfristen).
4. **Nächste Module im neuen Muster:** Altersvorsorge, BU, Krankenversicherung. Danach kann der doppelte Formularmodus entfallen.
5. Noch nicht in dieser Sitzung geprüfte Werte, die in der App stehen: Rentenwert 42,52 € ab 1.7.2026, Basiszins 3,20 % für 2026, Rürup-Höchstbetrag 30.826 €. Sie lassen sich über „Rechtsstand“ prüfen.
