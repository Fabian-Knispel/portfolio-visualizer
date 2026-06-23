# Bewertungsdarstellung (UX-Spezifikation)

## Überblick: Zwei orthogonale Statussysteme

Die Bewertungsdarstellung basiert auf zwei fundamental unabhängigen Statussystemen, die kontextgebunden in verschiedenen Ansichten dargestellt werden:

1. **Freeness-Status** (SOLL-Modellierungs-Ansicht)
2. **SOLL/IST-Vergleichsstatus** (Vergleichs-Ansicht)

---

## System 1: Freeness-Status (SOLL-Modellierungs-Ansicht)

### Zustände & Farben

| Status | Farbe | Hex | Randstil | Bedeutung |
|--------|-------|-----|----------|----------|
| `correct` | Grün | `#22c55e` | Normal (2px) | Zielstruktur konsistent & vollständig |
| `free` | Indigo | `#6366f1` | Normal (2px) | Zielstruktur unvollständig, aber zulässig |
| `overallocated` | Rot | `#ef4444` | Gestrichelt/dicker (3px dashed) | Zielstruktur verletzt Constraints (Fehler) |

### Geltungsbereich
- Nur Knoten **mit Kindern**
- Blätter: Status nicht relevant (nicht angezeigt)

### Rationale
- **Farbe + Randstil, keine Icons** — passt zu minimalistischem, cleanen Dark-Mode-Design
- **`free` = Indigo (nicht Gelb/Orange)** — bewusst nicht alarmierend, da zulässig. Indigo = App-Akzentfarbe
- **`overallocated` = Rot + gestrichelter Rahmen** — Fehler-Kennzeichnung, wichtig für Farbenblinde
- **Asymmetrie:** `correct` und `free` sind zulässige Zustände; `overallocated` ist Fehlerzustand

---

## System 2: SOLL/IST-Vergleichsstatus (Vergleichs-Ansicht)

### Zustände & Farben

| Status | Farbe | Hex | Randstil | Bedeutung |
|--------|-------|-----|----------|----------|
| `correct` | Grün | `#22c55e` | Normal (2px) | IST ≈ SOLL (perfekt im Ziel) |
| `underweighted` | Orange | `#f97316` | Normal (2px) | IST < SOLL (zu wenig) |
| `overweighted` | Rot | `#ef4444` | Normal (2px) | IST > SOLL (zu viel) |
| `missing_in_ist` | Grau | `#64748b` | Gestrichelt (2px dashed) | SOLL > 0, IST = 0 (nicht im Portfolio) |

### Geltungsbereich
- **Alle Knoten** (Blätter, Parents, alles)

### Rationale
- **Grün/Rot konsistent zu System 1** — gleiche Bedeutung (gut/Problem)
- **Orange vs. Rot — asymmetrische Kritikalität** — Overweight wird kritischer eingestuft (z.B. Klumpenrisiko) → stärkere Warnfarbe Rot
- **`missing_in_ist` = Grau + gestrichelt** — signalisiert "nicht vorhanden", nicht "Fehler", analog zu bestehenden Patterns
- **Prozent-Differenz (Δ in pp)** — wird nur in Tooltip angezeigt, nicht permanent im Knoten

---

## View-Umschaltung & Synchronisation

### Tab-basierte Umschaltung

Die bestehenden SOLL/IST/Vergleich-Tabs steuern direkt, welcher Statuskontext sichtbar ist:

| Tab | Active Mode | Statuskontext | Zeigt |
|-----|-------------|---------------|-------|
| **SOLL-Modell** | `'soll'` | Freeness-Status | correct / free / overallocated |
| **Vergleich** | `'vergleich'` | SOLL/IST-Status | correct / underweighted / overweighted / missing_in_ist |
| **IST** | `'ist'` | Keine Statusfarben | Neutrale Wertevisualisierung (keine Statusmarkierungen) |

### Synchronisation
- **Gemeinsamer State:** `activeViewMode` auf App-Root-Ebene
- **Synchronisiert:** Tree und Sunburst zeigen immer denselben Modus
- Umschalten eines Tabs ändert beide Visualisierungen

---

## Orthogonalität der Systeme

Die beiden Statussysteme sind **fundamentally unabhängig**:

- Ein Knoten kann gleichzeitig `free` (Modellstatus) UND `overweighted` (SOLL/IST-Status) sein
- Diese Zustände widersprechen sich nicht
- Sie beantworten unterschiedliche Fragen

**Konsequenz:** Nur ein System pro View aktiv, keine simultane Darstellung beider.

---

## Risiken & Mitigations-Strategien

### Risiko 1: Schmale Sunburst-Segmente
**Problem:** Gestrichelte/dicke Ränder bei sehr kleinen Winkeln kaum sichtbar

**Mitigation:**
- Mindestwinkel-Schwelle definieren (z.B. < 5°)
- Bei schmalen Segmenten: Fallback auf Tooltip-Highlight statt Randstil
- Hover-Effekt kann kleine Segmente ggf. vergrößern

### Risiko 2: Nutzer-Verständnis der Orthogonalität
**Problem:** Nutzer könnte verwirrt sein, warum verschiedene Tabs unterschiedliche Status zeigen

**Mitigation:**
- Klare Tab-Labels mit Icon/Tooltip
- Legenden bei jedem Tab
- Onboarding-Hinweise beim ersten Besuch
- Tooltips zeigen immer Text-Label (z.B. "free", "overweighted")

### Risiko 3: Farbenblindheit
**Problem:** Indigo/Grün könnten für gewisse Farbenblinde-Typen verwechselt werden

**Mitigation:**
- Randstile als Sekundärmerkmale (nicht nur Farbe)
- Tooltips zeigen immer Text-Label
- A11y-Testing mit Farbenblindheits-Simulatoren

---

## Status
✅ **ENTSCHIEDEN & KONKRETISIERT** — Ready für nächste Phase (Architektur)
