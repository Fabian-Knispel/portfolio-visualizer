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

## IST-Modell (Reales Portfolio)

- Pro Knoten: `ownValue`
- `nodeValue = ownValue + Σ(childNodeValue)`
- `totalValue = Σ(nodeValue aller Top-Level-Knoten)`
- `pct(node) = nodeValue / totalValue`
- `uncategorized` automatischer IST-Knoten

## Bewertungskategorien

- `correct`: Abweichung = 0%
- `overweighted`: IST > SOLL
- `underweighted`: IST < SOLL
- `missing_in_ist`: SOLL vorhanden, kein IST
- `missing_in_soll`: IST vorhanden, kein SOLL
- `extra_in_ist`: Synonym für missing_in_soll

## Nicht-Ziele

- Keine Rebalancing-Logik
- Keine Kauf-/Verkaufsvorschläge
- Keine Simulationen
- Keine Compliance-Anforderungen