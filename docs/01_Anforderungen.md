# Anforderungen

## Fachliche Anforderungen

- Baumstruktur mit beliebiger Tiefe
- Root ist ein technischer Container
- Knotenidentität über vollständigen Pfad
- SOLL und IST strikt getrennt
- Manuelle Eingabe für SOLL und IST

## SOLL-Modell (Zielportfolio)

- Flat Target Model ohne Konsistenzzwänge
- Pro Knoten: `targetPct` (lokale Zielannotation)
- Parent und Child mathematisch unabhängig
- Keine Aggregation, keine Summenzwänge
- Keine Normalisierung
- Freeness-Bewertung ist diagnostisch und blockiert Eingaben nicht
- targetPctOfParent als primäres SOLL-Eingabefeld für Nicht-Root
- Root fachlich immer 100%
- targetPct als Legacy-Fallback

## IST-Modell (Reales Portfolio)

- Pro Knoten: `ownValue`
- `nodeValue = ownValue + Σ(childNodeValue)`
- `totalValue = Σ(nodeValue aller Top-Level-Knoten)`
- `pct(node) = nodeValue / totalValue`
- `uncategorized` automatischer IST-Knoten
- Root fachlich immer 100%

## Bewertungskategorien

### SOLL/IST-Vergleichsstatus (Portfolio-Abweichung)
- `correct`: IST ≈ SOLL (Abweichung = 0%)
- `underweighted`: IST < SOLL (zu wenig)
- `overweighted`: IST > SOLL (zu viel)
- `missing_in_ist`: SOLL vorhanden, kein IST (nicht bespielt)

### Freeness-Status (Zielstruktur-Konsistenz, nur SOLL)
- `correct`: Summe Kinder-SOLL = Parent-SOLL
- `free`: Summe Kinder-SOLL < Parent-SOLL (unvollständig, aber zulässig)
- `overallocated`: Summe Kinder-SOLL > Parent-SOLL (Fehlerzustand)

## Nicht-Ziele

- noch keine Rebalancing-Logik
- noch keine Kauf-/Verkaufsvorschläge
- Keine Simulationen
- Keine Compliance-Anforderungen
