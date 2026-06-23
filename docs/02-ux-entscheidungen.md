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
