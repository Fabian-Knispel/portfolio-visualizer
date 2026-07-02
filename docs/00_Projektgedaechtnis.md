# Projektgedächtnis: Portfolio-Visualisierung

## Aktuelle Projektphase
**Phase: MVP 1.0 abgeschlossen**

*(Fortschritt: 7 von 7 Phasen abgeschlossen)*

**Begründung:** Der definierte MVP-Basisumfang wurde umgesetzt und abgenommen. Bereits vorhandene Zusatzfeatures (z. B. SOLL/IST-Vergleichsstatus) sind bewusst nicht abnahmekritisch für den MVP-Status.

---

## Getroffene Entscheidungen

### ✅ Fachliche Anforderungen (vollständig spezifiziert)

#### Anwendungstyp
- Lokale Web-App (nicht Desktop)
- Zielgruppe: Privatanleger, Einzelplatz, nur vom Nutzer betrieben
- Scope: Rein deskriptive Differenzanalyse, keine Rebalancing-, Optimierungs- oder Handlungsempfehlungen
- Visualisierungen: Baum und Sunburst (Treemap später, nicht im MVP)
- Datenstruktur: Baumstruktur mit beliebiger Tiefe, Root = technischer Container, Knotenidentität = vollständiger Pfad

#### SOLL-Modell (Zielportfolio)
- **Charakteristik:** Flat Target Model ohne harte Konsistenzzwänge
- **Pro Knoten:** `targetPct` (reine lokale Zielannotation)
- **Keine Aggregation:** Parent und Child mathematisch unabhängig
- **Keine Summenzwänge:** `targetPct` aller Siblings kann beliebig sein
- **Keine Normalisierung:** Wie eingegeben wird es verwendet
- **Wichtig:** Keine Eingabeblockade und keine automatische Korrektur; Freeness-Status dient der diagnostischen Einordnung

#### IST-Modell (Reales Portfolio)
- **Pro Knoten:** `ownValue` (direkt zugeordnete Werte)
- **Aggregation:** `nodeValue = ownValue + Σ(childNodeValue)`
- **Gesamt:** `totalValue = Σ(nodeValue aller Top-Level-Knoten)`
- **Prozentsätze:**
  - `pct(node) = nodeValue / totalValue` (von Gesamt)
  - `pctOfParent(node) = nodeValue / parent.nodeValue` (nur Anzeige)
- **uncategorized:** Automatischer IST-Knoten für nicht zugeordnete Werte, vollständig aggregiert

#### Bewertungslogik
- **Statussysteme (orthogonal):**
  1. **Freeness-Status (SOLL-Modellierung):** `correct` / `free` / `overallocated`
  2. **SOLL/IST-Vergleichsstatus (Vergleichsansicht):** `correct` / `underweighted` / `overweighted` / `missing_in_ist`
- **Vergleich:** Ausschließlich über vollständigen Pfad
- **Toleranz:** 0% (d.h. Abweichung ≠ `correct`)
- **Logik:** Lokal pro Knoten, keine Gesamtscore-Logik
- **Eingabe:** Manuell für SOLL und IST, keine automatische Erfassung

#### Nicht-Ziele
- noch keine Rebalancing-Logik
- noch keine Kauf-/Verkaufsvorschläge
- Keine Simulationen
- Keine Zielerreichungsberechnung
- Keine globale Optimierung
- Keine Compliance-Anforderungen

---

### UX-Entscheidung 1: Parent vs Child Darstellung
- **Gewählte Variante:** A (optisch identisch)
- **Datum:** 2026-06-21
- **Status:** ENTSCHIEDEN
- **Dokumentation:** `docs/02-ux-entscheidungen.md`

### UX-Entscheidung 2: Bewertungsdarstellung
- **Status:** ENTSCHIEDEN & KONKRETISIERT
- **Ansatz:** Zwei orthogonale Statussysteme (Freeness + SOLL/IST), kontextgebunden pro View
- **Datum:** 2026-06-21
- **Dokumentation:** `docs/03-bewertungsdarstellung.md`

### Architektur-/Tech-Stack-Entscheidungen (neuester Stand)
- **Status:** ENTSCHIEDEN (Eintragungsdatum maßgeblich)
- **Datum:** 2026-06-24
- **Entscheidungen:**
  - Betriebsform: Lokale Web-App mit Build-Step
  - Frontend-Framework: React
  - Build-Tool: Vite
  - Sprache: TypeScript
  - Visualisierung: D3.js (für Sunburst)
  - Architektur-Stil: Feature-based
  - State-Management: Zustand
- **Dokumentationsstatus:** Aus `docs/08_noch einzupflegen.md` in normative Dokumente zu konsolidieren

---

## Annahmen
- Anwendung nur auf dem Rechner des Nutzers, nur von ihm genutzt → Keine Sicherheits-, Compliance-, Skalierungsanforderungen
- Fachliche Modellierung ist stabil und vollständig
- Priorität: Stabilität, einfache Wartung, Erweiterbarkeit (nicht: Maximum-Feature-Set)
- Kein Geldbudget für externe Tools/Services
- Moderne, aktiv gepflegte, zukunftsfähige Technologien bevorzugt

---

## Tool-Inventar
- ChatGPT
- Perplexity
- Claude
- GitHub Copilot
- VS Code
- Firefox
- GitHub
- Google AI Studio

---

## Meta-Informationen zum Projektstatus

### Implementierungsstand
- **Code:** React/Vite-App-Sockel und Seitenbereich-Editor sind umgesetzt
- **Dokumentation:** Fachlich + UX vollständig; Architektur/Tech-Stack entschieden, Konsolidierung in den normativen Dokus ist weitgehend abgeschlossen
- **Repository:** https://github.com/Fabian-Knispel/portfolio-visualizer

### Technologie-Stack
- **Status:** Entscheidet (Stand 2026-06-24), formale Konsolidierung in `04`/`05` ausstehend
- **Aktueller Entscheidungsstand:** React + TypeScript + Vite + D3 + Zustand

### Projektstruktur
- **VCS:** GitHub
- **Editor:** VS Code
- **Branches:** main (nur committed, documented, reviewed)

### Dokumentation (Struktur)
```text
docs/
├── 00_Projektgedaechtnis.md (Statusdokument, diese Datei)
├── 01_Anforderungen.md (fachlich, normativ)
├── 02_UX-Design.md (UX Decision 1 + historischer Entscheidungsweg)
├── 03_Bewertungsdarstellung.md (UX Decision 2, normativ)
├── 04_Architektur.md (aktuell zu konsolidieren)
├── 05-TechStack.md (aktuell zu konsolidieren)
├── 06_Datenmodell.md (zu konkretisieren)
├── 07_Entscheidungsprotokoll.md (Entscheidungshistorie, zu aktualisieren)
├── 08_noch einzupflegen.md (Zwischenspeicher, nicht normativ)
└── 09_MVP-Definition
```

### Nächste Meilensteine (Phasen)
1. ✅ Phase 1: Fachliche Spezifikation
2. ✅ Phase 2: UX-Entscheidungen (2/2 getroffen)
3. ✅ Phase 3: Architektur-Entscheidungen (getroffen)
4. ✅ Phase 4: Tech-Stack-Entscheidungen (getroffen)
5. ✅ Phase 5: Datenmodell konkretisieren (TypeScript)
6. ✅ Phase 6: Komponenten-Design
7. ✅ Phase 7: Implementierung

---

## Willkommen, neuer Agent!

Du übernimmst dieses Projekt an dieser Stelle. Du hast vollständigen Zugriff auf:

✅ Die fachliche Modellierung (SOLL-Modell, IST-Modell, Bewertungslogik)  
✅ Die UX-Entscheidungen (Parent vs Child, Bewertungsdarstellung)  
✅ Die Architektur-/Tech-Stack-Entscheidungen (Stand 2026-06-24)  
✅ Die Entscheidungsdisziplin und Regeln für Zusammenarbeit  
✅ Den aktuellen Status und die nächsten Schritte  