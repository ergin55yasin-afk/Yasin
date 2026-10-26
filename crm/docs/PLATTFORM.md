# Beratungsplattform: erste Umsetzungsstufe

Stand: 26.10.2026 · Branch `claude/crm-pflegeberatung` · Ausgangsstand gesichert als Git-Tag `stand-vor-plattform`

## Aufbau des Projekts

Die App bleibt eine einzelne HTML-Datei (lauffähig als Artifact). Entwickelt wird sie in Modulen unter `src/`. `python3 build.py` setzt die Module zu `index.html` zusammen.

| Datei | Inhalt |
|---|---|
| `src/css/tokens.css` | Designsystem: Farben (hell und dunkel), Schrift, Abstände, Radien, Schatten |
| `src/css/basis.css` | Grundbausteine: Schaltflächen, Formulare, Chips, Statusanzeigen, Dialoge, Meldungen, leere Zustände |
| `src/css/app.css` | Seitenrahmen, Navigation, Startseite, Kunden, bestehende CRM-Ansichten, Rechner-Bausteine |
| `src/css/beratung.css` | Beratungsstrecke, Themenkarten, Kontextbereich, Kundenmodus |
| `src/css/wissen.css` | Beraterwissen und alle Regeln für Tablet und Handy |
| `src/js/bestand.js` | Bestehende Logik: CRM-Daten, Rechner, PDF, KI, Pflege-Modul (angepasst) |
| `src/js/grafik.js` | Icons und 13 Themenillustrationen (SVG, eine gemeinsame Palette) |
| `src/js/navigation.js` | Hauptnavigation, Seitentitel, Menü „Mehr und Einstellungen“ |
| `src/js/start.js` | Startseite als Beratungsnavigator |
| `src/js/kunden.js` | Kundenübersicht und Kundenprofil |
| `src/js/beratung.js` | Beratungsstrecke, Sitzungen, Kundenmodus, Dokumentation |
| `src/js/wissen-inhalte.js` | Startinhalte des Lexikons (KI-Entwürfe) |
| `src/js/wissen.js` | Lexikon: Suche, Filter, Redaktion, Historie, Verknüpfung zur Beratung |
| `src/js/zz-init.js` | Start der App |

Neue Beratungsthemen kommen als Eintrag in `THEMEN` (beratung.js) dazu. Ein Thema ohne eigenes Rechenmodul bekommt automatisch die Schritte „Gespräch und Fragen“ und „Bedarf festhalten“. Neue Lexikonsparten kommen in `LEXSPARTEN` dazu.

## Datenmodell (localStorage, Schlüssel `nachbereitung.v1`, Version 3)

Bestehende Daten werden ohne Verlust übernommen (geprüft im Test „Altdaten bleiben erhalten“). Neu sind:

- `laufend[]`: Beratungssitzungen mit Anliegen, Themen (mit Herkunft: Anliegen, im Gespräch gewählt, aus einem Gesprächsansatz gewählt), Bedarfsstand je Thema, Antworten, offenen Fragen, Vereinbarungen, nächstem Schritt, interner Notiz, Schrittfortschritt und den Rechner-Eingaben. Gespeichert wird automatisch nach jeder Eingabe. Der PDF-Name und die Mail-Texte werden bewusst nicht gespeichert.
- `lexikon`: Einträge mit Sparte, Inhaltsbereich, Quelle, Prüfdatum, Status, verantwortlicher Person, Kundeneignung, Favorit, Ursprung (KI oder von Hand) und Änderungshistorie.
- Termine: Uhrzeit und Anliegen. Aufgaben: Priorität.

## Bedarfsstand: was die App unterscheidet

| Stand | Bedeutung | Kundenansicht und PDF |
|---|---|---|
| noch offen | nichts festgehalten | ja |
| vermutet | Einschätzung des Beraters | **nein** |
| besprochen | im Gespräch angeschaut | ja |
| Kundenwunsch bestätigt | der Kunde möchte eine Lösung | ja |
| kein Bedarf | bewusst nicht gewünscht | ja |

Zusammenhänge zwischen Themen erscheinen nur als „möglicher Gesprächsansatz“ und werden nie automatisch gewählt.

## Kundenmodus

Im Kundenmodus werden interne Inhalte **gar nicht erst erzeugt**, nicht nur versteckt: die interne Notiz, der Kontextbereich, Berater-Tipps, der Bedarfsstand „vermutet“, der interne Abschlussschritt sowie die Liste aller Kundennummern. Navigation, Suche (auch Strg+K) und alle Aktionen außerhalb der Beratung sind gesperrt. Zum Beenden braucht es eine Bestätigung. Der Test durchsucht den Seitenquelltext, ohne den eingebetteten Programmcode, nach der internen Notiz und nach anderen Kundennummern.

Das PDF enthält nie die interne Notiz und keine Vermutungen.

## Grenzen und nächste Schritte für den Mehrbenutzerbetrieb

Die Daten liegen nur im Browser des jeweiligen Geräts. Ein öffentlich geteilter Artifact-Link ist **kein** gemeinsamer, gesicherter Datenspeicher. Für mehrere Berater wären nötig:

1. ein Server mit Datenbank und verschlüsselter Übertragung, Hosting in der EU
2. eine Anmeldung (zum Beispiel über die Gesellschaft oder die Bank), Rollen und Rechte je Berater und Filiale
3. eine Mandantentrennung, sodass jeder Berater nur seine Kunden sieht
4. ein Lösch- und Aufbewahrungskonzept nach DSGVO und den Dokumentationspflichten (§ 61 VVG, § 62 VVG), Auftragsverarbeitung, Protokollierung der Zugriffe
5. ein Redaktionsprozess für das Lexikon mit Freigabe durch eine zweite Person
6. die Übernahme der bestehenden Browserdaten über die vorhandene Sicherungsdatei (JSON)

## Tests

`JSPDF_PATH=<pfad zu jspdf.umd.min.js> node tests/<name>.js`

| Test | Prüfungen | Inhalt |
|---|---|---|
| `plattform.js` | 63 | Startseite, Kunden, Beratung, Speichern und Wiederaufrufen, Kundenmodus (inklusive Seitenquelltext), PDF, Lexikon mit Suche, Filter, Redaktion, Prüfung, Historie und Wiederherstellen, leere Zustände, kein seitliches Scrollen bei 390, 1024 und 1440 px |
| `pflege.js` | 72 | Referenzmodul Pflege auf 3 Bildschirmgrößen, Rechenwerte gegen vdek und SGB XI, Bericht, PDF, CRM |
| `smoke.js` | 64 | alle Bereiche und Menüs, Termin mit Uhrzeit, Aufgabe mit Priorität, Vertrag, Kündigungsschreiben, zentrale Suche |
| `alle-module.js` | 5 | alle 12 Themen in einer Beratung, ältere Beratungsdatei laden |
| `bug-fbcopy.js` | 1 | Sicherung kopieren (früherer Fehler) |
