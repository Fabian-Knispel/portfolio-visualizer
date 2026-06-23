# Bewertungsdarstellung (Statussysteme & Visualisierung)

## Überblick: Zwei orthogonale Statussysteme

Die Bewertungsdarstellung basiert auf zwei fundamentally unabhängigen Statussystemen:

1. **Freeness-Status** (SOLL-Modellierungs-Ansicht) — Qualität der Zielstruktur
2. **SOLL/IST-Vergleichsstatus** (Vergleichs-Ansicht) — Abweichung des realen Portfolios

---

## System 1: Freeness-Status (SOLL-Modellierungs-Ansicht)

### Zustände

| Status | Farbe | Hex | Randstil | Bedeutung |
|--------|-------|-----|----------|-----------|
| `correct` | Grün | `#22c55e` | Normal | Zielstruktur konsistent & vollständig |
| `free` | Indigo | `#6366f1` | Normal | Zielstruktur unvollständig, aber zulässig |
| `overallocated` | Rot | `#ef4444` | Gestrichelt/dicker | Zielstruktur verletzt Constraints |

### Geltungsbereich
- Nur Knoten **mit Kindern**
- Blätter: Status nicht relevant (nicht angezeigt)

### Rationale
- **Keine Icons** — nur Farbe + Randstil, passt zu Dark-Mode
- **`free` = Indigo (nicht Gelb)** — signalisiert „normaler Zustand", keine Warnung (ist zulässig!)
- **`overallocated` = Rand-Style** — wichtig für Farbenblinde

---

## System 2: SOLL/IST-Vergleichsstatus (Vergleichs-Ansicht)

### Zustände

| Status | Farbe | Hex | Randstil | Bedeutung |
|--------|-------|-----|----------|-----------|
| `correct` | Grün | `#22c55e` | Normal | IST ≈ SOLL |
| `underweighted` | Orange | `#f97316` | Normal | IST < SOLL |
| `overweighted` | Rot | `#ef4444` | Normal | IST > SOLL |
| `missing_in_ist` | Grau | `#64748b` | Gestrichelt | SOLL vorhanden, IST = 0 |

### Geltungsbereich
- **Alle Knoten** (Blätter, Parents, alles)

### Rationale
- **Grün/Rot konsistent** zu System 1
- **Orange vs. Rot** — asymmetrische Kritikalität (Overweight kritischer)
- **Grau + gestrichelt** — analog zu „unallocated"-Pattern im Sunburst
- **Prozent-Differenz nur in Tooltip** — hält Hauptansicht clean

---

## View-Umschaltung

### Tab-basiert
Die bestehenden SOLL/IST/Vergleich-Tabs steuern direkt den aktiven Statuskontext:

| Tab | Mode | Status-System | Beschreibung |
|-----|------|---------------|-------------|
| **SOLL-Modell** | `'soll'` | Freeness | Sind die Zielstrukturen vollständig geplant? |
| **Vergleich** | `'vergleich'` | SOLL/IST | Wie weicht das reale Portfolio ab? |
| **IST** | `'ist'` | Keine Farben | Nur Wertedarstellung, kein Status |

### Synchronisation
- Gemeinsamer State `activeViewMode` auf App-Root-Ebene
- Tree und Sunburst sind **synchronisiert** — zeigen immer denselben Modus
- Umschalten eines Tabs ändert Darstellung in beiden Visualisierungen

---

## Implementierungsdetails

### Statusberechnung (orthogonal)

```typescript
// System 1: Freeness
function getFreenessStatus(node) {
  if (!node.hasChildren) return null // Nicht für Blätter
  
  const sumChildren = node.children.reduce((sum, child) => sum + child.targetPct, 0)
  const parentTarget = node.targetPct
  
  if (sumChildren === parentTarget) return 'correct'
  if (sumChildren < parentTarget) return 'free'
  return 'overallocated'
}

// System 2: SOLL/IST-Vergleich
function getComparisonStatus(node) {
  const soll = node.targetPct
  const ist = node.pct
  
  if (ist === soll) return 'correct'
  if (ist < soll) return 'underweighted'
  if (ist > soll) return 'overweighted'
  if (soll > 0 && ist === 0) return 'missing_in_ist'
  return null
}
