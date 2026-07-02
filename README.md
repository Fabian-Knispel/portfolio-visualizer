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
- [x] Phase 6: Komponenten-Design und UI-Sockel
- [x] Phase 7: Implementierung

## Starten

```bash
npm install
npm run dev
```

## Nutzung (Kurzablauf)

1. In der SOLL-Ansicht Knoten anlegen und Ziel-Prozentwerte pflegen.
2. In der IST-Ansicht reale Werte erfassen.
3. Aenderungen im Seitenbereich mit Enter oder ueber den Speichern-Button sichern.
4. In Vergleich und Sunburst pruefen, ob Struktur und Gewichtung konsistent sind.

## Datenformat (Persistenz)

Gespeichert wird ein Envelope im Browser-localStorage unter dem Key
`portfolio-visualizer.portfolio-state.v1`:

```json
{
  "version": 1,
  "state": {
    "sollRoot": {
      "path": "root",
      "label": "Portfolio",
      "children": []
    },
    "istRoot": {
      "path": "root",
      "label": "Portfolio",
      "children": []
    }
  }
}
```

Hinweise:

- Persistiert werden nur fachliche Daten (`sollRoot`, `istRoot`).
- UI-Zustaende wie aktive Ansicht oder aufgeklappte Baumknoten werden nicht gespeichert.
- Ungueltige oder kaputte Speicherinhalte fallen robust auf einen leeren Initialzustand zurueck.

## Validierung

- SOLL-Prozentwerte muessen zwischen 0 und 100 liegen.
- IST-Werte duerfen nicht negativ sein.
- Ungueltige Zahleneingaben erzeugen sichtbare Fehlermeldungen und blockieren Speichern/Hinzufuegen.

## Tests

```bash
npm run test
```

Abgedeckt sind unter anderem:

- Unit-Tests fuer Prozent- und Aggregationslogik inkl. Grenzfaellen.
- Sunburst-Transformationslogik.
- Smoke-Flow: Eingabe -> Speichern/Persistenz -> Reload -> Visualisierungsableitungen.

## Bekannte Einschraenkungen

- Kein manueller Real-Daten-Test im Scope (Issue #10 bleibt offen).
- Keine Server-Synchronisation, ausschliesslich lokaler Browser-Speicher.
- Aktuell keine End-to-End-Browserautomation; der Smoke-Flow ist code-nah (Vitest).

## Aktueller Stand

Das Projekt enthält jetzt einen React/Vite-Sockel mit Seitenbereich für die manuelle Pflege von SOLL- und IST-Knoten. Der Root-Knoten ist fest, kann umbenannt werden und bleibt vor dem Löschen geschützt.

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

**MVP 1.0:** ✅ abgeschlossen.

**Hinweis zum Scope:** Enthaltene Zusatzfeatures (z. B. SOLL/IST-Vergleichsstatus) sind vorgezogen umgesetzt und nicht abnahmekritisch fuer den MVP-Basisumfang.

**Repository:** https://github.com/Fabian-Knispel/portfolio-visualizer