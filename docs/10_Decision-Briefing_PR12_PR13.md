# Decision Briefing: PR #12 und PR #13

Stand: 2026-07-01

## Hygiene Change-Log (geplante/erforderliche GitHub-Aktionen)

1. PR #12 (`[WIP] Implement localStorage persistence for app data`) soll geschlossen werden.
- Grund: Branch ist gegen `main` klar veraltet und widerspricht dem aktuellen Stand (zeigt massive Loeschungen statt inkrementeller Aenderungen).
- Evidenz: Diff gegen `main` enthaelt Loeschungen zentraler Dateien (`src/App.tsx`, `src/main.tsx`, `vite.config.ts`, `src/features/...`).

2. PR #13 (`UI-Politur Basisfluss...`) bleibt offen, aber sollte aus Draft in reviewfaehigen Zustand ueberfuehrt werden.
- Grund: Scope passt inhaltlich zu Issue #9.
- Empfehlung zur Verlinkung: `Closes #9` nur setzen, wenn alle Akzeptanzkriterien in #9 nachweisbar erfuellt sind.

3. Kommentare in #9/#12/#13 nachziehen.
- #12: Abschlusskommentar mit Verweis auf bereits umgesetzte Persistenz auf `main`.
- #13: Kommentar mit Restpunkten (falls vorhanden) und klarer Merge-Readiness-Einschaetzung.

Hinweis: Die konkrete Ausfuehrung der GitHub-UI-Aktionen (Close/Kommentar) war in dieser Session mangels GitHub-Login nicht direkt moeglich.

## PR #12 Bewertung

### Scope

- Branch: `origin/copilot/implement-persistenz-localstorage`
- Commits: 1 (`Initial plan`)
- Diff gegen `main`: breite, destructive Aenderung ueber viele Kern-Dateien, inkl. Entfernen von React/Vite- und Feature-Dateien.

### Reifegrad

- Klar nicht merge-ready.
- WIP-/Planungszustand ohne sauberen, isolierten Persistenz-Scope.

### Risiko

- Sehr hoch (Regression): massive Dateiloeschungen, potenzieller App-Break.
- Hoch (Projektverlauf): dupliziert bereits erledigtes Issue #2.

### Testabdeckung / fehlende Checks

- Keine belastbare, aktuelle Testabsicherung fuer den Branchinhalt.
- Scope-Diff ist bereits disqualifizierend.

### Konflikte / Ueberschneidungen

- Ueberschneidet sich fachlich mit bereits umgesetzter Persistenz in `main`.
- Widerspricht strukturell dem aktuellen Codezustand.

### Empfehlung

- **close**

### Naechste Actions (1-3)

1. PR #12 schliessen.
2. Abschlusskommentar: Persistenz ist bereits in `main` enthalten (Issue #2 abgeschlossen), PR daher ueberholt.
3. Optional: Branch archivieren/loeschen.

## PR #13 Bewertung

### Scope

- Branch: `origin/copilot/ui-politur-basisfluss`
- Commits: 3
- Geaenderte Dateien: `src/features/portfolio/ui/portfolio-workspace.tsx`, `src/styles.css`, `package-lock.json`
- Inhaltlicher Fokus: UI-Politur, Validierungs-/Inputfluss, Speichern-Feedback, Prozentdarstellung.

### Reifegrad

- Funktional fortgeschritten, aber initial als Draft markiert.
- Nachziehen von Tests und klarer Doku verbessert Merge-Readiness deutlich.

### Risiko

- Mittel (UX/Verhalten): Aenderungen in Eingabe- und Speicherflow.
- Niedrig bis mittel (Datenintegritaet): bei sauberer Validation und Tests kontrollierbar.

### Testabdeckung / fehlende Checks

- Zusaeztliche Unit- und Smoke-Tests sind erforderlich/empfohlen.
- Vor Merge: `npm run test` und kurzer manueller UI-Sanity-Check.

### Konflikte / Ueberschneidungen

- Sinnvolle Ueberschneidung mit Issue #9 (UI-Politur Basisfluss).
- Keine inhaltliche Kollision mit abgeschlossenem Persistenz-Issue #2, solange Scope UI-zentriert bleibt.

### Empfehlung

- **request changes** (falls die unten genannten Punkte noch fehlen), danach **merge**.

### Naechste Actions (1-3)

1. Review auf Vollstaendigkeit gegen #9-Akzeptanzkriterien.
2. Bei Vollstaendigkeit PR-Beschreibung um `Closes #9` ergaenzen.
3. Draft entfernen und mergen.
