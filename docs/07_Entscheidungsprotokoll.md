# Entscheidungsprotokoll

## Format

| Datum | Phase | Entscheidung | Begründung | Status |
|-------|-------|--------------|------------|--------|
| 2026-06-21 | UX | Parent vs Child: Variante A (optisch identisch) | Einfachheit, Konsistenz, Minimale Komplexität |Entschieden |
| 2026-06-21 | UX | Bewertungsdarstellung: Zwei orthogonale Systeme | Freeness (SOLL-Modellierung) + SOLL/IST (Monitoring) — kontextgebunden, nicht vermischt | Entschieden |


2026-06-24 | Architektur | Feature-based Architektur | SOLL/IST/Vergleich fachlich getrennt, bessere Wartbarkeit | Entschieden
2026-06-24 | Architektur | State-Management: Zustand | Selektive Re-Renders, gute TS-Integration | Entschieden
2026-06-24 | Tech-Stack | Frontend: React | Komponentenmodell + D3-Integration | Entschieden
2026-06-24 | Tech-Stack | Build: Vite | schneller Dev-Server, TS-Integration | Entschieden
2026-06-24 | Tech-Stack | Sprache: TypeScript | Typsicherheit/Wartbarkeit | Entschieden
2026-06-24 | Tech-Stack | Visualisierung: D3.js | hohe Flexibilität, passend für Sunburst | Entschieden
2026-06-24 | Betrieb | Lokale Web-App mit Build-Step | Wartbarkeit/Struktur vor Single-File-Prototyp | Entschieden

| 2026-06-24 | Betrieb | Lokale Web-App mit Build-Step | Wartbarkeit und klare Modulstruktur priorisiert; lokal ausführbar ohne Installer | Entschieden |
| 2026-06-24 | Architektur | Architektur-Stil: Feature-based | SOLL/IST/Vergleich fachlich getrennt, dadurch bessere Kohäsion und Skalierbarkeit | Entschieden |
| 2026-06-24 | Architektur | State-Management: Zustand | Selektorbasierter Zugriff, gute TypeScript-Integration, geeignet für häufige State-Änderungen | Entschieden |
| 2026-06-24 | Tech-Stack | Frontend-Framework: React | Komponentenmodell passt zu Tree/Sunburst und D3-Integration | Entschieden |
| 2026-06-24 | Tech-Stack | Build-Tool: Vite | Schneller Dev-Server, HMR, einfacher TS-Workflow, stabiler Production-Build | Entschieden |
| 2026-06-24 | Tech-Stack | Sprache: TypeScript | Typsicherheit, bessere Wartbarkeit, robustere Refactorings | Entschieden |
| 2026-06-24 | Tech-Stack | Visualisierung: D3.js (für Sunburst) | Hohe Flexibilität und gute Eignung für hierarchische Visualisierungen | Entschieden |
| 2026-06-30 | Dokumentation | Dokumentenhierarchie präzisiert (00 Status, 01–07 normativ, 08 Zwischenspeicher) | Konsistenz, klare Verbindlichkeit, konfliktfreie Fortschreibung nach Eintragungsdatum | Entschieden |