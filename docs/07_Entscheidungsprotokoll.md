# Entscheidungsprotokoll

Konsolidierte, chronologische Entscheidungshistorie des Projekts.  
Bei Konflikten zwischen Dokumenten gilt: **Eintragungsdatum im Protokoll + normative Zieldokumente (01–06) sind maßgeblich.**

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
| 2026-06-30 | Dokumentation | Dokumentenhierarchie präzisiert (00 Status, 01–06 normativ, 07 Historie, 08 Zwischenspeicher) | Konsistenz, klare Verbindlichkeit, konfliktfreie Fortschreibung | Entschieden |
| 2026-06-30 | Datenmodell | Feature-nahes zentrales Modul mit festem Root-Pfad `root` | Konsistent mit Feature-based Architektur und stabiler Pfad-Identität | Entschieden |
| 2026-06-30 | Persistenz | Nur fachliche Daten `sollRoot` und `istRoot` werden gespeichert; UI-Zustand bleibt abgeleitet | Minimiert Persistenzlast und verhindert unnötige Kopplung an die Darstellung | Entschieden |
| 2026-06-30 | Store | Portfolio-Store lädt beim Initialisieren und persistiert jede fachliche Mutation unmittelbar | Garantiert Reload-Erhalt und hält die UI nur als Ableitung des fachlichen Zustands | Entschieden |
| 2026-06-30 | Store-API | Pfadbasierte Tree-Mutationen (`add`, `update`, `move`, `remove`) werden direkt im Store angeboten | Macht fachliche Änderungen unmittelbar speicherbar ohne UI-Duplikation der Persistenzlogik | Entschieden |
| 2026-06-30 | UX | Knotenbearbeitung erfolgt über einen Seitenbereich statt inline; Parent-Wechsel und Root-Umbenennung sind dort ausdrücklich enthalten | Bessere Übersicht bei tiefen Hierarchien und mehreren Bearbeitungsfeldern | Entschieden |

## Hinweise zur Pflege

- Jede neue Entscheidung genau **einmal** eintragen.
- Datum im ISO-Format `YYYY-MM-DD`.
- Entscheidungstext kurz und eindeutig.
- Zu jeder Entscheidung das normative Zieldokument (01–06) zeitnah aktualisieren.