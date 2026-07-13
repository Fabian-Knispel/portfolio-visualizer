# Entscheidungsprotokoll

Konsolidierte, chronologische Entscheidungshistorie des Projekts.  
Bei Konflikten zwischen Dokumenten gilt: **Eintragungsdatum im Protokoll + normative Zieldokumente (01–06) sind maßgeblich.**

## Hinweise zur Pflege

- Jede neue Entscheidung genau **einmal** eintragen.
- Datum im ISO-Format `YYYY-MM-DD`.
- Entscheidungstext kurz und eindeutig.
- Zu jeder Entscheidung das normative Zieldokument (01–06) zeitnah aktualisieren.

## Format

| Datum | Phase | Entscheidung | Begründung | Status |
|-------|-------|--------------|------------|--------|
| 2026-06-21 | UX | Parent vs Child: Variante A (optisch identisch) | Einfachheit, Konsistenz, minimale visuelle Komplexität | Entschieden |
| 2026-06-21 | UX | Bewertungsdarstellung: zwei orthogonale Statussysteme (Freeness + SOLL/IST), kontextgebunden pro View | Trennschärfe der Aussagen, weniger UI-Überfrachtung, bessere Interpretierbarkeit | Entschieden |
| 2026-06-24 | Betrieb | Lokale Web-App mit Build-Step | Wartbarkeit und klare Modulstruktur priorisiert; lokal ausführbar ohne Installer | Entschieden |
| 2026-06-24 | Architektur | Architektur-Stil: Feature-based | SOLL/IST/Vergleich fachlich getrennt, bessere Kohäsion und Skalierbarkeit | Entschieden |
| 2026-06-24 | Architektur | State-Management: Zustand (selektorbasiert) | Schlanker globaler State, reduzierte Re-Renders, gute TypeScript-Integration | Entschieden |
| 2026-06-24 | Tech-Stack | Frontend-Framework: React | Komponentenmodell passt zu Tree/Sunburst und D3-Integration | Entschieden |
| 2026-06-24 | Tech-Stack | Build-Tool: Vite | Schneller Dev-Server/HMR, einfacher TS-Workflow, stabiler Production-Build | Entschieden |
| 2026-06-24 | Tech-Stack | Sprache: TypeScript | Typsicherheit, Wartbarkeit, robustere Refactorings | Entschieden |
| 2026-06-24 | Tech-Stack | Visualisierung: D3.js (insb. Sunburst) | Hohe Flexibilität für hierarchische Visualisierungen und Interaktionen | Entschieden |
| 2026-06-30 | Dokumentation | Dokumentenhierarchie präzisiert (00 Status, 01–06 normativ, 07 Historie) | Konsistenz, klare Verbindlichkeit, konfliktfreie Fortschreibung | Entschieden |
| 2026-06-30 | Datenmodell | Feature-nahes zentrales Modul mit festem Root-Pfad `root` | Konsistent mit Feature-based Architektur und stabiler Pfad-Identität | Entschieden |
| 2026-06-30 | Persistenz | Nur fachliche Daten `sollRoot` und `istRoot` werden gespeichert; UI-Zustand bleibt abgeleitet | Minimiert Persistenzlast und verhindert unnötige Kopplung an die Darstellung | Entschieden |
| 2026-06-30 | Store | Portfolio-Store lädt beim Initialisieren und persistiert jede fachliche Mutation unmittelbar | Garantiert Reload-Erhalt und hält die UI nur als Ableitung des fachlichen Zustands | Entschieden |
| 2026-06-30 | Store-API | Pfadbasierte Tree-Mutationen (`add`, `update`, `move`, `remove`) werden direkt im Store angeboten | Macht fachliche Änderungen unmittelbar speicherbar ohne UI-Duplikation der Persistenzlogik | Entschieden |
| 2026-06-30 | UX | Knotenbearbeitung erfolgt über einen Seitenbereich statt inline; Parent-Wechsel und Root-Umbenennung sind dort ausdrücklich enthalten | Bessere Übersicht bei tiefen Hierarchien und mehreren Bearbeitungsfeldern | Entschieden |
| 2026-07-01 | Datenmodell | Prozentwerte werden zentral mit voller Präzision berechnet und in beiden Views einheitlich auf 2 Nachkommastellen angezeigt; Root-Parent bleibt `—`, `totalValue = 0` zeigt `0,00 %` | Eindeutige Anzeigevorgaben, keine Division durch 0, konsistente Sunburst-/Baumdarstellung | Entschieden |
| 2026-07-01 | Visualisierung | Sunburst zunächst nur für SOLL umgesetzt, aber über eine separate Transformationsschicht vorbereitet, damit IST später ohne Chart-Umbau ergänzt werden kann | Kleine, sichere Erweiterung mit klarer Trennung von Domain und Rendering | Entschieden |
| 2026-07-01 | Visualisierung | SOLL/IST-Sunburst wird per Workspace-Schalter umgeschaltet; Hover-Zustand wird beim Wechsel zurückgesetzt | Kein Mischzustand, klare Zustandsgrenze, Konsistenz der Anzeige | Entschieden |
| 2026-07-01 | UI-State | View-Toggle und Sunburst-Modus liegen im App-Root-State; fachliche Portfolio-Daten bleiben davon getrennt | Verhindert unerwartete Resets beim Umschalten und hält Darstellungs- sowie Fachzustand unabhängig | Entschieden |
| 2026-07-01 | UX | Tree-Panel bleibt horizontal overflow-frei: einzeilige Rows, Label-Ellipsis mit Hover-Volltext, responsive Priorität Badge/Direction reduzieren vor Referenz-Ausblendung | Stabilität bei langen Labels, tiefen Ebenen und kleinen Viewports ohne überlappende Controls | Entschieden |
| 2026-07-02 | Scope/Governance | MVP 1.0 gilt als abgeschlossen, auch wenn vorgezogene Zusatzfeatures bereits enthalten sind | Abnahme erfolgt gegen den definierten MVP-Basisumfang; Extras sind nicht abnahmekritisch | Entschieden |
| 2026-07-07 | Datenmodell/UX | SOLL-Eingabe ist pro Nicht-Root-Knoten zwischen `% vom Parent` und `% gesamt (absolut)` umschaltbar; Validierung bleibt hinweisend ohne Speichern zu blockieren | Erhoeht Bedienflexibilitaet, behaelt Rueckwaertskompatibilitaet (`targetPct`) und bleibt konsistent mit diagnostischer Freeness-Logik | Entschieden |
| 2026-07-07 | Datenmodell | Root speichert keinen `targetPctOfParent`; Root wird ausschliesslich als fachlich fixer Gesamtanteil `100 %` behandelt | Root hat keinen Parent, dadurch weniger Modell-Sonderfaelle und klarere Semantik fuer Persistenz/Migration | Entschieden |
| 2026-07-09 | Datenmodell/Visualisierung | IST-`ownValue` wird als Parent-Gesamtwert interpretiert; der direkt gehaltene Anteil ist abgeleitet (`max(parent - Summe(Kinder), 0)`) und wird nicht separat gespeichert | Verhindert statische Restwerte, haelt Tree-Details und Sunburst bei Kind-Updates konsistent; Overflow bleibt sichtbar, indem der Parent mindestens der Kinder-Summe entspricht | Entschieden |