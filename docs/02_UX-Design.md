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

## ✅ ENTSCHIEDEN: Bewertungsdarstellung (historischer Entscheidungsweg)

**Hinweis:** Die finale, normative Spezifikation befindet sich in `docs/03_Bewertungsdarstellung.md`.  
Dieser Abschnitt dokumentiert den Entscheidungsweg (vormals OFFEN/TBD), ist aber nicht mehr maßgeblich.

### Bewertungskategorien (Diskussionsstand, historisch)

| Kategorie | Bedeutung |
|-----------|-----------|
| `correct` | Abweichung = 0% (SOLL == IST) |
| `overweighted` | IST > SOLL (zu viel vom Knoten vorhanden) |
| `underweighted` | IST < SOLL (zu wenig vom Knoten vorhanden) |
| `missing_in_ist` | SOLL vorhanden, kein IST (Knoten wird nicht bespielt) |
| `missing_in_soll` | IST vorhanden, kein SOLL (Knoten ist ungeplant) |
| `extra_in_ist` | Synonym für missing_in_soll |

### Finaler Entscheidungsstatus
✅ Entschieden am 2026-06-21  
✅ Konkretisiert in `docs/03_Bewertungsdarstellung.md`  
➡️ Für Implementierung gilt ausschließlich `docs/03_Bewertungsdarstellung.md`.

---

## ✅ ENTSCHIEDEN: Tree-Panel Overflow-Verhalten

### Gewählte Variante
- Tree-Zeilen bleiben strikt einzeilig, auch unter 900px.
- Nur das Node-Label wird per Ellipsis gekürzt und zeigt den Volltext bei Hover.
- Metadaten werden nicht textuell gekürzt; bei engem Viewport wird erst Direction/Badge reduziert und danach der Referenzwert ausgeblendet.

### Begründung
- Verhindert horizontales Ausbrechen der Tree-Zeilen aus Panel und Seite.
- Hält den Informationskern stabil und priorisiert lesbare Metadaten ohne Text-Clipping.
- Entschärft Überlappungen in kleinen Viewports durch klare Priorisierung bei Platzmangel.