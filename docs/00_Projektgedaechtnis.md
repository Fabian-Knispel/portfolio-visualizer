# Projektgedächtnis: Portfolio-Visualisierung

## Aktuelle Projektphase
**Phase: UX- und Bewertungsdarstellung klären (vor Architektur- und Tech-Stack-Entscheidung)**

*(Fortschritt: 2 von 7 Phasen abgeschlossen)*

**Begründung:** Fachliche Modellierung ist konsolidiert. Die kritischen offenen Fragen betreffen UX-Entscheidungen (Parent vs Child Darstellung) und Bewertungsdarstellung, die vor Architektur und Technologiewahl entschieden sein müssen. Architektur darf nicht durch Tech-Stack vorweggenommen werden.

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
- **Charakteristik:** Flat Target Model ohne Konsistenzzwänge
- **Pro Knoten:** `targetPct` (reine lokale Zielannotation)
- **Keine Aggregation:** Parent und Child mathematisch unabhängig
- **Keine Summenzwänge:** `targetPct` aller Siblings kann beliebig sein
- **Keine Normalisierung:** Wie eingegeben wird es verwendet
- **Keine Konsistenzprüfung:** Keine automatische Korrektur

#### IST-Modell (Reales Portfolio)
- **Pro Knoten:** `ownValue` (direkt zugeordnete Werte)
- **Aggregation:** `nodeValue = ownValue + Σ(childNodeValue)`
- **Gesamt:** `totalValue = Σ(nodeValue aller Top-Level-Knoten)`
- **Prozentsätze:**
  - `pct(node) = nodeValue / totalValue` (von Gesamt)
  - `pctOfParent(node) = nodeValue / parent.nodeValue` (nur Anzeige)
- **uncategorized:** Automatischer IST-Knoten für nicht zugeordnete Werte, vollständig aggregiert

#### Bewertungslogik
- **Kategorien:** correct / overweighted / underweighted / missing_in_ist / missing_in_soll / extra_in_ist
- **Vergleich:** Ausschließlich über vollständigen Pfad
- **Toleranz:** 0% (d.h. abweichung ≠ correct)
- **Logik:** Lokal pro Knoten, keine Gesamtscore-Logik
- **Eingabe:** Manuell für SOLL und IST, keine automatische Erfassung

#### Nicht-Ziele
- Keine Rebalancing-Logik
- Keine Kauf-/Verkaufsvorschläge
- Keine Simulationen
- Keine Zielerreichungsberechnung
- Keine globale Optimierung
- Keine Compliance-Anforderungen

---

### ✅ UX-Entscheidung 1: Parent vs Child Darstellung
- **Gewählte Variante:** A (Optisch identisch)
- **Datum:** 2026-06-21
- **Status:** ✅ ENTSCHIEDEN
- **Dokumentation:** `docs/02-ux-entscheidungen.md`

### ✅ UX-Entscheidung 2: Bewertungsdarstellung
- **Status:** ✅ ENTSCHIEDEN & KONKRETISIERT
- **Ansatz:** Zwei orthogonale Statussysteme (Freeness + SOLL/IST)
- **Datum:** 2026-06-21
- **Dokumentation:** `docs/03-bewertungsdarstellung.md`

---

## Offene Punkte (für nächste Phase: Architektur)

1. **Architektur-Entscheidungen**
   - Gesamtarchitektur (Monolith, Modular, Feature-based?)
   - State-Management-Strategie
   - Komponenten-Struktur

2. **Tech-Stack-Entscheidungen**
   - Frontend-Framework (React, Vue, Svelte?)
   - Visualisierungs-Library (D3, Visx, ECharts?)
   - Build-Tool (Vite, Webpack?)
   - Testing-Framework

3. **MVP-Definition**
   - Was ist in Release 1.0 enthalten?
   - Was wird später gemacht?

4. **Datenmodell-Konkretisierung**
   - TypeScript Interfaces
   - Funktions-Signaturen für Statusberechnung

---

## Risiken & Annahmen

### Risiken
1. **Missverständnisse durch Darstellung** — Nutzer könnte Parent-Zielwerte übersehen oder als Aggregation missdeuten
   - **Mitigation:** Klare Tooltips, Dokumentation, Onboarding

2. **Späte UX-Komplexität** — Zu viele Icons/Farben/Ebenen machen die Oberfläche unleserlich
   - **Mitigation:** Minimalistisches Design, kontextgebundene Informationen

3. **Überfrachtung der Oberfläche** — Beide Visualisierungen mit zu vielen Kategorien überladen
   - **Mitigation:** Nur ein Statussystem pro View aktiv

4. **Fehlinterpretation von Bewertungskategorien** — Verwechslungen zwischen overweighted/underweighted
   - **Mitigation:** Farbcodes, Randstile, Tooltips

### Annahmen
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
- GitHub (Versionierung)
- Google AI Studio

---

## Meta-Informationen zum Projektstatus

### Implementierungsstand
- **Code:** Keine Implementierung bisher
- **Dokumentation:** Vollständig (fachlich + UX)
- **Repository:** https://github.com/Platzmangel/portfolio-visualizer

### Technologie-Stack
- **Status:** Noch nicht entschieden
- **Grund:** Wird nach UX- und Architektur-Klärung entschieden

### Projektstruktur
- **VCS:** GitHub
- **Editor:** VS Code
- **Branches:** main (nur committed, documented, reviewed)

### Dokumentation (Struktur)
```
docs/
├── 00-projektgedachtnis.md (diese Datei)
├── 01-anforderungen.md (fachlich, vollständig)
├── 02-ux-entscheidungen.md (UX Decision 1, vollständig)
├── 03-bewertungsdarstellung.md (UX Decision 2, vollständig)
├── 04-architektur.md (TBD)
├── 05-tech-stack.md (TBD)
├── 06-datenmodell.md (TBD)
├── 07_Entscheidungsprotokoll.md (Entscheidungshistorie)
└── 08_noch einzupflegen.md

### Nächste Meilensteine (Phasen)
1. ✅ Phase 1: Fachliche Spezifikation
2. ✅ Phase 2: UX-Entscheidungen (2/2 getroffen)
3. [ ] Phase 3: Architektur-Entscheidungen
4. [ ] Phase 4: Tech-Stack-Entscheidungen
5. [ ] Phase 5: Datenmodell konkretisieren (TypeScript)
6. [ ] Phase 6: Komponenten-Design
7. [ ] Phase 7: Implementierung

---

## Willkommen, neuer Agent!

Du übernimmst dieses Projekt an dieser Stelle. Du hast vollständigen Zugriff auf:

✅ Die fachliche Modellierung (SOLL-Modell, IST-Modell, Bewertungslogik)  
✅ Die UX-Entscheidungen (Parent vs Child, Bewertungsdarstellung)  
✅ Die Entscheidungsdisziplin und Regeln für Zusammenarbeit  
✅ Den aktuellen Status und die nächsten Schritte  

**Deine nächste Aufgabe:** Architektur-Entscheidungen klären oder weitermachen, wo ich aufgehört habe.

Was möchtest du tun? 👇
