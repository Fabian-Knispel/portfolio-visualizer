# Portfolio-Visualisierung

Lokale Web-Anwendung zur Visualisierung eines Investment-Portfolios.  
Vergleich zwischen SOLL (Zielportfolio) und IST (reales Portfolio).

## Ziel

Rein deskriptive Differenzanalyse ohne Rebalancing-, Optimierungs- oder Handlungsempfehlungen.

## Zielgruppe

Privatanleger, tech-versiert, aber nicht Designer. Einzelnutzer, lokal auf eigenem Rechner.

## Features (MVP-fähiger Zielkorridor)

- Baumstruktur mit beliebiger Tiefe
- Sunburst-Visualisierung
- Vergleich SOLL vs IST
- Zwei orthogonale Bewertungssysteme:
  - **Freeness-Status:** Konsistenz der Zielstruktur (SOLL-Modellierung)
  - **SOLL/IST-Status:** Abweichung des realen Portfolios (Vergleichsansicht)

## Projektphasen

- [x] Phase 1: Fachliche Spezifikation
- [x] Phase 2: UX-Entscheidungen (2/2)
  - [x] Parent vs Child Darstellung
  - [x] Bewertungsdarstellung (zwei Systeme)
- [x] Phase 3: Architektur-Entscheidungen
- [x] Phase 4: Tech-Stack-Entscheidungen
- [x] Phase 5: Datenmodell konkretisieren
- [ ] Phase 6: Komponenten-Design
- [ ] Phase 7: Implementierung

## Dokumentation

### Normative Dokumente (maßgeblich)

- [Projektgedächtnis](docs/00_Projektgedaechtnis.md) — Status, Kontext, Phasenfortschritt
- [Anforderungen](docs/01_Anforderungen.md) — Fachliche Spezifikation
- [UX-Design](docs/02_UX-Design.md) — UX-Entscheidung 1 + historischer Entscheidungsweg
- [Bewertungsdarstellung](docs/03_Bewertungsdarstellung.md) — Finale UX-Spezifikation für Statussysteme
- [Architektur](docs/04_Architektur.md) — Architekturleitlinien
- [Tech-Stack](docs/05_TechStack.md) — Technologische Entscheidungen
- [Datenmodell](docs/06_Datenmodell.md) — Typen, Status, Funktionssignaturen

### Historie / Governance

- [Entscheidungsprotokoll](docs/07_Entscheidungsprotokoll.md) — konsolidierte Entscheidungshistorie (Audit Trail)

### Nicht-normativ

- `docs/08_noch einzupflegen.md` — temporärer Zwischenspeicher (nicht maßgeblich)

## Status

**Aktuelle Phase:** ✅ Phase 5 abgeschlossen → nächster Schritt: **Phase 6 (Komponenten-Design)** starten.

**Repository:** https://github.com/Fabian-Knispel/portfolio-visualizer