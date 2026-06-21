# UX-Entscheidungen

## ✅ ENTSCHIEDEN: Parent vs Child Darstellung

### Gewählte Variante
**Variante A: Optisch identisch**

Parent und Child werden optisch gleich dargestellt (kein visueller Unterschied).

### Begründung
- Einfachheit: Minimal, keine zusätzlichen Symbole
- Konsistenz: Alle Knoten sehen gleich aus
- Implementierbarkeit: Einfach zu entwickeln und zu warten

### Risiko & Mitigation
**Risiko:** Nutzer könnte verwechseln, dass Parent seine Kinder aggregiert (tut es nicht).

**Mitigation:**
- Tooltips: "Parent und Child sind unabhängig"
- Dokumentation: Clear explanation im README
- Onboarding: Erster Besuch könnte Hinweis zeigen

### Umsetzungs-Details
- Beide Parent und Child nutzen die gleiche Komponente
- Keine speziellen Icons oder Styling-Unterschiede
- Datenmodell bleibt unverändert

---

## ⏳ OFFEN: Bewertungsdarstellung

**Frage:** Wie sollen die 6 Bewertungskategorien in Tree und Sunburst dargestellt werden?

### Bewertungskategorien

| Kategorie | Bedeutung |
|-----------|-----------|
| `correct` | Abweichung = 0% (SOLL == IST) |
| `overweighted` | IST > SOLL (zu viel vom Knoten vorhanden) |
| `underweighted` | IST < SOLL (zu wenig vom Knoten vorhanden) |
| `missing_in_ist` | SOLL vorhanden, kein IST (Knoten wird nicht bespielt) |
| `missing_in_soll` | IST vorhanden, kein SOLL (Knoten ist ungeplant) |
| `extra_in_ist` | Synonym für missing_in_soll |

### Darstellungs-Optionen zur Diskussion

#### Option 1: Farbskala
- Grün: correct
- Orange: overweighted
- Rot: underweighted
- Grau: missing_in_ist
- Gelb: missing_in_soll

#### Option 2: Icons + Text
- ✓ correct
- ↑ overweighted
- ↓ underweighted
- ⊘ missing_in_ist
- ⊕ missing_in_soll

#### Option 3: Tooltip + Hover
- Neutral Farben, Details nur bei Hover
- Weniger optische Last

#### Option 4: Balkendiagramme
- Im Knoten kleine SOLL/IST-Vergleichsleisten
- Visueller Vergleich direkt sichtbar

#### Option 5: Kombiniert
- Farbe + Icon + Tooltip
- Mehr Information, aber auch mehr Komplexität

### Status
[TBD] — Wird in separatem UX-Workshop geklärt